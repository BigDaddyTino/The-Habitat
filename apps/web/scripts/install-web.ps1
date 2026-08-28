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

# Which build directory this install should point the service at. A plain
# `.next` is the ordinary case; after deploy-web.ps1 has run at least once the
# builds live in versioned `.next-<stamp>` directories instead, and an install
# that insisted on `.next` would either fail here or start a service pointing
# at a directory nobody builds into any more.
$webRoot = Join-Path $root "apps\web"
$distDir = ".next"
if (-not (Test-Path -LiteralPath (Join-Path $webRoot ".next\BUILD_ID"))) {
  $newest = Get-ChildItem -LiteralPath $webRoot -Directory -Filter ".next-*" -ErrorAction SilentlyContinue |
    Where-Object { Test-Path -LiteralPath (Join-Path $_.FullName "BUILD_ID") } |
    Sort-Object Name -Descending | Select-Object -First 1
  if ($newest) { $distDir = $newest.Name }
}

foreach ($required in @((Join-Path $webRoot "$distDir\BUILD_ID"), (Join-Path $root "apps\web\node_modules\next\dist\bin\next"), $serviceTemplate, (Join-Path $root ".env"))) {
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
if ($distDir -ne ".next") {
  $xml = [xml] (Get-Content -LiteralPath $serviceXml -Raw)
  $node = $xml.CreateElement("env")
  $node.SetAttribute("name", "HABITAT_WEB_DIST_DIR")
  $node.SetAttribute("value", $distDir)
  [void] $xml.service.InsertAfter($node, @($xml.service.env)[-1])
  $xml.Save($serviceXml)
}
& $serviceExecutable install
Set-Service -Name "HabitatWeb" -StartupType Automatic
& $serviceExecutable start
Write-Output "Habitat Web installed from $distDir. It listens only on 127.0.0.1:3000 for a local reverse proxy or Cloudflare Tunnel."
