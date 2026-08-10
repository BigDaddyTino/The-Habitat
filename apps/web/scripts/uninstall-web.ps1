[CmdletBinding()]
param([Parameter(Mandatory)] [string] $InstallRoot)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

if (-not ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
  throw "Run this uninstaller from an elevated PowerShell session."
}

$root = (Resolve-Path -LiteralPath $InstallRoot).Path
$serviceExecutable = Join-Path $root "HabitatWeb.exe"
if (Get-Service -Name "HabitatWeb" -ErrorAction SilentlyContinue) {
  if (-not (Test-Path -LiteralPath $serviceExecutable)) { throw "HabitatWeb.exe is required to uninstall the existing service." }
  & $serviceExecutable stop
  & $serviceExecutable uninstall
}
Write-Output "Habitat Web service is removed. Local configuration and web logs were retained."
