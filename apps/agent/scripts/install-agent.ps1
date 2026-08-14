[CmdletBinding()]
param(
  [Parameter(Mandatory)] [string] $InstallRoot,
  [Parameter(Mandatory)] [string] $AgentBindIp,
  [Parameter(Mandatory)] [string] $MartServ101Ip,
  [ValidateRange(1, 65535)] [int] $Port = 4317,
  # Optional. Written as HABITAT_PALWORLD_ADMIN_PASSWORD; required only when
  # agent.config.json enables the local Palworld REST query.
  [string] $PalworldAdminPassword
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

if (-not ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
  throw "Run this installer from an elevated PowerShell session."
}

$agentRoot = (Resolve-Path -LiteralPath $InstallRoot).Path
$serviceExecutable = Join-Path $agentRoot "HabitatAgent.exe"
$serviceTemplate = Join-Path $agentRoot "service\HabitatAgent.xml.template"
$serviceXml = Join-Path $agentRoot "HabitatAgent.xml"
$configuration = Join-Path $agentRoot "agent.config.json"
$environmentFile = Join-Path $agentRoot ".env"

foreach ($required in @((Join-Path $agentRoot "dist\index.js"), (Join-Path $agentRoot "dist\version.js"), $serviceExecutable, $serviceTemplate)) {
  if (-not (Test-Path -LiteralPath $required)) { throw "Missing required agent artifact: $required" }
}
if ([System.IO.File]::ReadAllText((Join-Path $agentRoot "dist\version.js")) -match '\+dev";') {
  throw "The Agent build is unstamped. Run pnpm --filter @habitat/agent build before installing."
}
if ([string]::IsNullOrWhiteSpace($env:HABITAT_AGENT_TOKEN) -or $env:HABITAT_AGENT_TOKEN.Trim().Length -lt 32 -or $env:HABITAT_AGENT_TOKEN.Contains("`r") -or $env:HABITAT_AGENT_TOKEN.Contains("`n")) {
  throw "Set HABITAT_AGENT_TOKEN to a single-line secret of at least 32 characters before installing."
}
$nodeCommand = Get-Command node.exe -ErrorAction SilentlyContinue
if (-not $nodeCommand) { throw "Node.js 24 LTS must be installed and available as node.exe." }
$nodeExecutable = $nodeCommand.Source
$nodeVersionText = & $nodeExecutable -p "process.versions.node"
if ($LASTEXITCODE -ne 0) { throw "Unable to determine the installed Node.js version." }
$nodeVersion = [version]$nodeVersionText.Trim()
if ($nodeVersion.Major -ne 24 -or $nodeVersion -lt [version]"24.19.0") {
  throw "Habitat Agent requires Node.js >=24.19.0 and <25; found $nodeVersion."
}
if (Get-Service -Name "HabitatAgent" -ErrorAction SilentlyContinue) { throw "The HabitatAgent service already exists. Use uninstall-agent.ps1 first." }

if (-not (Test-Path -LiteralPath $configuration)) {
  Copy-Item -LiteralPath (Join-Path $agentRoot "agent.config.example.json") -Destination $configuration
  Write-Warning "Created an empty agent.config.json. Add only inspected MartServ102 server definitions before relying on status endpoints."
}

# Build the keys this installer manages, then merge with any existing .env so a
# reinstall never silently drops keys added by hand (for example
# HABITAT_PALWORLD_ADMIN_PASSWORD).
$managedValues = [ordered]@{
  "HABITAT_AGENT_TOKEN"       = $env:HABITAT_AGENT_TOKEN.Trim()
  "HABITAT_AGENT_BIND_HOST"   = $AgentBindIp
  "HABITAT_AGENT_ALLOWED_IPS" = $MartServ101Ip
  "HABITAT_AGENT_PORT"        = "$Port"
}
if (-not [string]::IsNullOrWhiteSpace($PalworldAdminPassword)) {
  if ($PalworldAdminPassword.Contains("`r") -or $PalworldAdminPassword.Contains("`n")) {
    throw "PalworldAdminPassword must be a single-line value."
  }
  $managedValues["HABITAT_PALWORLD_ADMIN_PASSWORD"] = $PalworldAdminPassword
}
$preservedLines = @()
if (Test-Path -LiteralPath $environmentFile) {
  foreach ($existingLine in [System.IO.File]::ReadAllLines($environmentFile)) {
    if ($existingLine -match '^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=') {
      if (-not $managedValues.Contains($Matches[1])) { $preservedLines += $existingLine }
    } elseif (-not [string]::IsNullOrWhiteSpace($existingLine)) {
      # Keep comments and any other non-blank lines untouched.
      $preservedLines += $existingLine
    }
  }
}
$environmentLines = @()
foreach ($entry in $managedValues.GetEnumerator()) { $environmentLines += "$($entry.Key)=$($entry.Value)" }
$environmentLines += $preservedLines
# WriteAllLines emits UTF-8 without a BOM, which dotenv requires for the first key.
[System.IO.File]::WriteAllLines($environmentFile, [string[]]$environmentLines)
$serviceContents = [System.IO.File]::ReadAllText($serviceTemplate)
$serviceContents = $serviceContents.Replace("{{NODE_EXE}}", [Security.SecurityElement]::Escape($nodeExecutable)).Replace("{{AGENT_ROOT}}", [Security.SecurityElement]::Escape($agentRoot))
if ($serviceContents.Contains("{{")) { throw "The HabitatAgent service template contains an unresolved placeholder." }
[System.IO.File]::WriteAllText($serviceXml, $serviceContents, [System.Text.UTF8Encoding]::new($false))
& (Join-Path $PSScriptRoot "set-agent-firewall.ps1") -AgentBindIp $AgentBindIp -MartServ101Ip $MartServ101Ip -Port $Port
& $serviceExecutable install
& $serviceExecutable start
Write-Output "Habitat Agent installed. It listens only on $AgentBindIp`:$Port and accepts only $MartServ101Ip."
