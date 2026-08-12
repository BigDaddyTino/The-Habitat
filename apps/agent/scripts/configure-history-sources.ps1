[CmdletBinding()]
param(
  [Parameter(Mandatory)] [string] $InstallRoot
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

if (-not ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
  throw "Run this configuration update from an elevated PowerShell session."
}

$agentRoot = (Resolve-Path -LiteralPath $InstallRoot).Path
$configurationPath = Join-Path $agentRoot "agent.config.json"
$valheimLogPath = Join-Path $agentRoot "game-services\valheim\logs"

if (-not (Test-Path -LiteralPath $configurationPath -PathType Leaf)) {
  throw "Missing agent configuration: $configurationPath"
}
if (-not (Test-Path -LiteralPath $valheimLogPath -PathType Container)) {
  throw "The allow-listed Valheim service log directory does not exist: $valheimLogPath"
}

$configuration = Get-Content -Raw -LiteralPath $configurationPath | ConvertFrom-Json
$valheimServer = $configuration.servers | Where-Object { $_.key -eq "valheim" } | Select-Object -First 1
if ($null -eq $valheimServer) {
  throw "Agent configuration does not contain the valheim server."
}

$history = @($valheimServer.history)
$existingSource = $history | Where-Object { $_.kind -eq "VALHEIM_LOG" } | Select-Object -First 1
if ($null -eq $existingSource) {
  $history += [pscustomobject]@{
    kind = "VALHEIM_LOG"
    label = "Valheim Steam session logs"
    path = $valheimLogPath
    maxBytes = 33554432
  }
  $valheimServer | Add-Member -NotePropertyName history -NotePropertyValue $history -Force
  [System.IO.File]::WriteAllText($configurationPath, ($configuration | ConvertTo-Json -Depth 20), [System.Text.UTF8Encoding]::new($false))
  Restart-Service -Name "HabitatAgent"
  Write-Output "Added the Valheim Steam session history source and restarted HabitatAgent."
} else {
  Write-Output "Valheim Steam session history source is already configured; no change was made."
}
