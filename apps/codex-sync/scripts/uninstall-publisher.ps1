[CmdletBinding()]
param([Parameter(Mandatory)] [string] $InstallRoot)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

if (-not ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
  throw "Run this uninstaller from an elevated PowerShell session."
}

$root = (Resolve-Path -LiteralPath $InstallRoot).Path
$serviceExecutable = Join-Path $root "CodexSyncPublisher.exe"
if (-not (Test-Path -LiteralPath $serviceExecutable)) { throw "Missing CodexSyncPublisher.exe in $root." }

$service = Get-Service -Name "CodexSyncPublisher" -ErrorAction SilentlyContinue
if (-not $service) {
  Write-Output "CodexSyncPublisher is not installed."
  exit 0
}
if ($service.Status -ne "Stopped") {
  & $serviceExecutable stop
  if ($LASTEXITCODE -ne 0) { throw "WinSW failed to stop CodexSyncPublisher (exit $LASTEXITCODE)." }
}
& $serviceExecutable uninstall
if ($LASTEXITCODE -ne 0) { throw "WinSW failed to uninstall CodexSyncPublisher (exit $LASTEXITCODE)." }
Write-Output "CodexSyncPublisher was uninstalled. Existing immutable releases and logs were retained."
