[CmdletBinding()]
param([Parameter(Mandatory)] [string] $InstallRoot)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

if (-not ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
  throw "Run this uninstaller from an elevated PowerShell session."
}

$root = (Resolve-Path -LiteralPath $InstallRoot).Path
$serviceExecutable = Join-Path $root "HabitatWorker.exe"
if (Get-Service -Name "HabitatWorker" -ErrorAction SilentlyContinue) {
  & $serviceExecutable stop
  & $serviceExecutable uninstall
}
Write-Output "Habitat Worker service is removed. Local configuration and worker logs were retained."
