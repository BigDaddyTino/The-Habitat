[CmdletBinding()]
param([Parameter(Mandatory)] [string] $InstallRoot)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

if (-not ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
  throw "Run this uninstaller from an elevated PowerShell session."
}

$agentRoot = (Resolve-Path -LiteralPath $InstallRoot).Path
$serviceExecutable = Join-Path $agentRoot "HabitatAgent.exe"
if (Get-Service -Name "HabitatAgent" -ErrorAction SilentlyContinue) {
  & $serviceExecutable stop
  & $serviceExecutable uninstall
}
Get-NetFirewallRule -DisplayName "Habitat Agent (MartServ101 only)" -ErrorAction SilentlyContinue | Remove-NetFirewallRule
Write-Output "Habitat Agent service and its dedicated firewall rule are removed. Local configuration and logs were retained."
