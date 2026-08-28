[CmdletBinding()]
param([Parameter(Mandatory)] [string] $InstallRoot, [string] $SyncRoot)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

if (-not ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
  throw "Run this installer from an elevated PowerShell session."
}

$root = (Resolve-Path -LiteralPath $InstallRoot).Path
$serviceExecutable = Join-Path $root "HabitatWorker.exe"
$serviceTemplate = Join-Path $root "apps\worker\service\HabitatWorker.xml.template"
$serviceXml = Join-Path $root "HabitatWorker.xml"

foreach ($required in @((Join-Path $root "apps\worker\src\bootstrap.ts"), (Join-Path $root "apps\worker\src\index.ts"), (Join-Path $root "apps\worker\node_modules\tsx\dist\cli.mjs"), $serviceExecutable, $serviceTemplate, (Join-Path $root ".env"))) {
  if (-not (Test-Path -LiteralPath $required)) { throw "Missing required worker artifact: $required" }
}
if (-not (Get-Command node.exe -ErrorAction SilentlyContinue)) { throw "Node.js 24 LTS must be installed and available as node.exe." }
if (Get-Service -Name "HabitatWorker" -ErrorAction SilentlyContinue) { throw "The HabitatWorker service already exists. Use uninstall-worker.ps1 first." }

# The worker reads the codex drive to judge whether it has gone stale; it
# never writes there. Without -SyncRoot the env line is dropped entirely and
# the Pulse signal reports UNKNOWN, which is never alerted on.
$syncEnv = ""
if ($SyncRoot) {
  $resolvedSync = (Resolve-Path -LiteralPath $SyncRoot).Path
  $escapedSync = $resolvedSync.Replace("&", "&amp;").Replace("<", "&lt;").Replace(">", "&gt;").Replace('"', "&quot;")
  $syncEnv = '  <env name="HABITAT_CODEX_SYNC_ROOT" value="' + $escapedSync + '" />'
}
$xml = (Get-Content -LiteralPath $serviceTemplate -Raw).Replace("{{CODEX_SYNC_ROOT_ENV}}", $syncEnv)
Set-Content -LiteralPath $serviceXml -Value $xml -Encoding utf8
& $serviceExecutable install
& $serviceExecutable start
Write-Output "Habitat Worker installed. It makes authenticated outbound requests only and has no listening port."
