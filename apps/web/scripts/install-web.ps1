[CmdletBinding()]
param([Parameter(Mandatory)] [string] $InstallRoot)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

if (-not ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
  throw "Run this installer from an elevated PowerShell session."
}

$root = (Resolve-Path -LiteralPath $InstallRoot).Path
$serviceExecutable = Join-Path $root "HabitatWeb.exe"
$workerExecutable = Join-Path $root "HabitatWorker.exe"
$serviceTemplate = Join-Path $root "apps\web\service\HabitatWeb.xml.template"
$serviceXml = Join-Path $root "HabitatWeb.xml"

foreach ($required in @((Join-Path $root "apps\web\.next\BUILD_ID"), (Join-Path $root "apps\web\node_modules\next\dist\bin\next"), $serviceTemplate, (Join-Path $root ".env"))) {
  if (-not (Test-Path -LiteralPath $required)) { throw "Missing required web artifact: $required" }
}
if (-not (Get-Command node.exe -ErrorAction SilentlyContinue)) { throw "Node.js 24 LTS must be installed and available as node.exe." }
if (Get-Service -Name "HabitatWeb" -ErrorAction SilentlyContinue) { throw "The HabitatWeb service already exists. Use uninstall-web.ps1 first." }

if (-not (Test-Path -LiteralPath $serviceExecutable)) {
  if (-not (Test-Path -LiteralPath $workerExecutable)) { throw "Missing WinSW executable: $serviceExecutable. Download WinSW or copy the existing HabitatWorker.exe to HabitatWeb.exe." }
  Copy-Item -LiteralPath $workerExecutable -Destination $serviceExecutable
}

$serviceConfiguration = [System.IO.File]::ReadAllText($serviceTemplate).Replace("{{INSTALL_ROOT}}", $root)
[System.IO.File]::WriteAllText($serviceXml, $serviceConfiguration)
& $serviceExecutable install
Set-Service -Name "HabitatWeb" -StartupType Automatic
& $serviceExecutable start
Write-Output "Habitat Web installed. It listens only on 127.0.0.1:3000 for a local reverse proxy or Cloudflare Tunnel."
