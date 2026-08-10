[CmdletBinding()]
param(
  [Parameter(Mandatory)] [string] $InstallRoot,
  [switch] $Replace
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

if (-not ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
  throw "Run this installer from an elevated PowerShell session."
}

$agentRoot = (Resolve-Path -LiteralPath $InstallRoot).Path
$configurationPath = Join-Path $agentRoot "game-services.json"
$agentConfigurationPath = Join-Path $agentRoot "agent.config.json"
$winsw = Join-Path $agentRoot "HabitatAgent.exe"
$servicesRoot = Join-Path $agentRoot "game-services"

foreach ($required in @($configurationPath, $agentConfigurationPath, $winsw)) {
  if (-not (Test-Path -LiteralPath $required)) { throw "Missing required local artifact: $required" }
}

$configuration = Get-Content -Raw -LiteralPath $configurationPath | ConvertFrom-Json
$agentConfiguration = Get-Content -Raw -LiteralPath $agentConfigurationPath | ConvertFrom-Json
if ($null -eq $configuration.games -or @($configuration.games).Count -eq 0) { throw "game-services.json must contain at least one game." }

$seenKeys = @{}
$seenServiceNames = @{}
New-Item -ItemType Directory -Path $servicesRoot -Force | Out-Null

foreach ($game in @($configuration.games)) {
  foreach ($property in @("key", "serviceName", "updateServiceName", "startScript", "updateScript")) {
    if ([string]::IsNullOrWhiteSpace([string]$game.$property)) { throw "Each game requires $property." }
  }
  if ([string]$game.key -notmatch '^[a-z0-9][a-z0-9-]{0,62}$') { throw "Invalid game key: $($game.key)" }
  foreach ($serviceName in @([string]$game.serviceName, [string]$game.updateServiceName)) {
    if ($serviceName -notmatch '^[A-Za-z0-9_.-]{1,120}$') { throw "Invalid Windows service name: $serviceName" }
    if ($seenServiceNames.ContainsKey($serviceName)) { throw "Duplicate Windows service name: $serviceName" }
    $seenServiceNames[$serviceName] = $true
  }
  if ($seenKeys.ContainsKey([string]$game.key)) { throw "Duplicate game key: $($game.key)" }
  $seenKeys[[string]$game.key] = $true
  foreach ($scriptPath in @([string]$game.startScript, [string]$game.updateScript)) {
    if (-not [System.IO.Path]::IsPathFullyQualified($scriptPath) -or -not (Test-Path -LiteralPath $scriptPath -PathType Leaf)) { throw "Script path must be an existing absolute local file: $scriptPath" }
  }
  if ($null -eq ($agentConfiguration.servers | Where-Object { $_.key -eq $game.key })) { throw "Agent configuration does not contain server key: $($game.key)" }
}

function Escape-Xml([string] $value) {
  return [Security.SecurityElement]::Escape($value)
}

function Copy-NonInteractiveScript([string] $sourcePath, [string] $destinationPath) {
  $content = Get-Content -Raw -LiteralPath $sourcePath
  $content = [regex]::Replace($content, '(?im)^\s*pause(?:\s+.*)?\s*\r?\n?', '')
  [System.IO.File]::WriteAllText($destinationPath, $content, [System.Text.UTF8Encoding]::new($false))
}

function Write-ServiceXml([string] $xmlPath, [string] $id, [string] $name, [string] $scriptPath, [string] $workingDirectory, [int] $stopTimeoutSeconds, [string] $logPath) {
  $command = "/d /c call `"$scriptPath`""
  $xml = @"
<service>
  <id>$(Escape-Xml $id)</id>
  <name>$(Escape-Xml $name)</name>
  <description>Local Habitat allow-listed game operation.</description>
  <executable>C:\Windows\System32\cmd.exe</executable>
  <arguments>$(Escape-Xml $command)</arguments>
  <workingdirectory>$(Escape-Xml $workingDirectory)</workingdirectory>
  <logpath>$(Escape-Xml $logPath)</logpath>
  <log mode="roll-by-size-time">
    <sizeThreshold>10485760</sizeThreshold>
    <keepFiles>5</keepFiles>
    <pattern>yyyyMMdd</pattern>
  </log>
  <stoptimeout>$($stopTimeoutSeconds)sec</stoptimeout>
  <onfailure action="none" />
</service>
"@
  [System.IO.File]::WriteAllText($xmlPath, $xml, [System.Text.UTF8Encoding]::new($false))
}

foreach ($game in @($configuration.games)) {
  $gameRoot = Join-Path $servicesRoot $game.key
  New-Item -ItemType Directory -Path $gameRoot -Force | Out-Null
  $startDestination = Join-Path $gameRoot "start.cmd"
  $updateDestination = Join-Path $gameRoot "update.cmd"
  Copy-NonInteractiveScript ([string]$game.startScript) $startDestination
  Copy-NonInteractiveScript ([string]$game.updateScript) $updateDestination

  $startWorkingDirectory = if ([string]::IsNullOrWhiteSpace([string]$game.startWorkingDirectory)) { Split-Path -Parent ([string]$game.startScript) } else { [string]$game.startWorkingDirectory }
  $updateWorkingDirectory = if ([string]::IsNullOrWhiteSpace([string]$game.updateWorkingDirectory)) { Split-Path -Parent ([string]$game.updateScript) } else { [string]$game.updateWorkingDirectory }
  foreach ($workingDirectory in @($startWorkingDirectory, $updateWorkingDirectory)) {
    if (-not [System.IO.Path]::IsPathFullyQualified($workingDirectory) -or -not (Test-Path -LiteralPath $workingDirectory -PathType Container)) { throw "Working directory must be an existing absolute local directory: $workingDirectory" }
  }
  $stopTimeoutSeconds = if ($null -eq $game.stopTimeoutSeconds) { 120 } else { [int]$game.stopTimeoutSeconds }
  if ($stopTimeoutSeconds -lt 15 -or $stopTimeoutSeconds -gt 180) { throw "stopTimeoutSeconds must be between 15 and 180." }

  foreach ($definition in @(
    @{ Id = [string]$game.serviceName; Name = "Habitat Game - $($game.key)"; Script = $startDestination; WorkingDirectory = $startWorkingDirectory; Timeout = $stopTimeoutSeconds; Log = (Join-Path $gameRoot "logs") },
    @{ Id = [string]$game.updateServiceName; Name = "Habitat Update - $($game.key)"; Script = $updateDestination; WorkingDirectory = $updateWorkingDirectory; Timeout = 300; Log = (Join-Path $gameRoot "update-logs") }
  )) {
    $wrapper = Join-Path $gameRoot "$($definition.Id).exe"
    $xml = Join-Path $gameRoot "$($definition.Id).xml"
    $existing = Get-Service -Name $definition.Id -ErrorAction SilentlyContinue
    if ($existing) {
      if (-not $Replace) { throw "Service $($definition.Id) already exists. Re-run with -Replace after reviewing its current configuration." }
      & $wrapper stop 2>$null
      & $wrapper uninstall
    }
    Copy-Item -LiteralPath $winsw -Destination $wrapper -Force
    Write-ServiceXml $xml $definition.Id $definition.Name $definition.Script $definition.WorkingDirectory $definition.Timeout $definition.Log
    & $wrapper install
    Set-Service -Name $definition.Id -StartupType Manual
  }

  $agentServer = $agentConfiguration.servers | Where-Object { $_.key -eq $game.key } | Select-Object -First 1
  $agentServer | Add-Member -NotePropertyName control -NotePropertyValue ([pscustomobject]@{
    serviceName = [string]$game.serviceName
    updateServiceName = [string]$game.updateServiceName
    timeoutMs = $stopTimeoutSeconds * 1000
  }) -Force
}

$agentConfiguration | ConvertTo-Json -Depth 20 | Set-Content -LiteralPath $agentConfigurationPath -Encoding utf8
Write-Output "Installed $(@($configuration.games).Count * 2) local Habitat game services. They are manual-start by design; restart HabitatAgent after reviewing the generated service scripts."
