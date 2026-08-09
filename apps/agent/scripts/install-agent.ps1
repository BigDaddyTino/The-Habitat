[CmdletBinding()]
param(
  [Parameter(Mandatory)] [string] $InstallRoot,
  [Parameter(Mandatory)] [string] $AgentBindIp,
  [Parameter(Mandatory)] [string] $MartServ101Ip,
  [ValidateRange(1, 65535)] [int] $Port = 4317
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

foreach ($required in @((Join-Path $agentRoot "dist\index.js"), $serviceExecutable, $serviceTemplate)) {
  if (-not (Test-Path -LiteralPath $required)) { throw "Missing required agent artifact: $required" }
}
if ([string]::IsNullOrWhiteSpace($env:HABITAT_AGENT_TOKEN) -or $env:HABITAT_AGENT_TOKEN.Trim().Length -lt 32 -or $env:HABITAT_AGENT_TOKEN.Contains("`r") -or $env:HABITAT_AGENT_TOKEN.Contains("`n")) {
  throw "Set HABITAT_AGENT_TOKEN to a single-line secret of at least 32 characters before installing."
}
if (-not (Get-Command node.exe -ErrorAction SilentlyContinue)) { throw "Node.js 24 LTS must be installed and available as node.exe." }
if (Get-Service -Name "HabitatAgent" -ErrorAction SilentlyContinue) { throw "The HabitatAgent service already exists. Use uninstall-agent.ps1 first." }

if (-not (Test-Path -LiteralPath $configuration)) {
  Copy-Item -LiteralPath (Join-Path $agentRoot "agent.config.example.json") -Destination $configuration
  Write-Warning "Created an empty agent.config.json. Add only inspected MartServ102 server definitions before relying on status endpoints."
}

[System.IO.File]::WriteAllLines($environmentFile, @(
  "HABITAT_AGENT_TOKEN=$($env:HABITAT_AGENT_TOKEN.Trim())",
  "HABITAT_AGENT_BIND_HOST=$AgentBindIp",
  "HABITAT_AGENT_ALLOWED_IPS=$MartServ101Ip",
  "HABITAT_AGENT_PORT=$Port"
))
Copy-Item -LiteralPath $serviceTemplate -Destination $serviceXml -Force
& (Join-Path $PSScriptRoot "set-agent-firewall.ps1") -AgentBindIp $AgentBindIp -MartServ101Ip $MartServ101Ip -Port $Port
& $serviceExecutable install
& $serviceExecutable start
Write-Output "Habitat Agent installed. It listens only on $AgentBindIp`:$Port and accepts only $MartServ101Ip."
