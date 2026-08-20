[CmdletBinding()]
param(
  [Parameter(Mandatory)] [string] $InstallRoot,
  [Parameter(Mandatory)] [string] $SyncRoot,
  [ValidateRange(1000, 300000)] [int] $PollIntervalMs = 5000
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

if (-not ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
  throw "Run this installer from an elevated PowerShell session."
}

$root = (Resolve-Path -LiteralPath $InstallRoot).Path
$sync = (Resolve-Path -LiteralPath $SyncRoot).Path
$syncDriveRoot = [System.IO.Path]::GetPathRoot($sync).TrimEnd('\')
if ($sync.TrimEnd('\') -eq $syncDriveRoot) { throw "SyncRoot must be a dedicated folder, not an entire drive." }

$nodeCommand = Get-Command node.exe -ErrorAction Stop
$nodeVersion = (& $nodeCommand.Source --version).TrimStart('v').Split('.')[0]
if ([int]$nodeVersion -ne 24) { throw "The Codex publisher requires Node.js 24 LTS." }

$serviceExecutable = Join-Path $root "CodexSyncPublisher.exe"
$wrapperSource = Join-Path $root "HabitatWorker.exe"
$serviceTemplate = Join-Path $root "apps\codex-sync\service\CodexSyncPublisher.xml.template"
$serviceXml = Join-Path $root "CodexSyncPublisher.xml"
$tsx = Join-Path $root "apps\codex-sync\node_modules\tsx\dist\cli.mjs"
$entry = Join-Path $root "apps\codex-sync\src\cli.ts"
$envFile = Join-Path $root ".env"
$logPath = Join-Path $root "codex-sync-logs"

foreach ($required in @($wrapperSource, $serviceTemplate, $tsx, $entry, $envFile)) {
  if (-not (Test-Path -LiteralPath $required)) { throw "Missing required Codex publisher artifact: $required" }
}
if (Get-Service -Name "CodexSyncPublisher" -ErrorAction SilentlyContinue) {
  throw "CodexSyncPublisher already exists. Use uninstall-publisher.ps1 before reinstalling it."
}

New-Item -ItemType Directory -Path $logPath -Force | Out-Null
Copy-Item -LiteralPath $wrapperSource -Destination $serviceExecutable -Force

function Escape-Xml([string] $Value) {
  return [Security.SecurityElement]::Escape($Value)
}

$xml = Get-Content -LiteralPath $serviceTemplate -Raw
$xml = $xml.Replace("{{NODE_PATH}}", (Escape-Xml $nodeCommand.Source))
$xml = $xml.Replace("{{INSTALL_ROOT}}", (Escape-Xml $root))
$xml = $xml.Replace("{{LOG_PATH}}", (Escape-Xml $logPath))
$xml = $xml.Replace("{{SYNC_ROOT}}", (Escape-Xml $sync))
$xml = $xml.Replace("{{POLL_INTERVAL_MS}}", $PollIntervalMs.ToString())
[System.IO.File]::WriteAllText($serviceXml, $xml, [System.Text.UTF8Encoding]::new($false))

& $serviceExecutable install
if ($LASTEXITCODE -ne 0) { throw "WinSW failed to install CodexSyncPublisher (exit $LASTEXITCODE)." }
& $serviceExecutable start
if ($LASTEXITCODE -ne 0) { throw "WinSW failed to start CodexSyncPublisher (exit $LASTEXITCODE)." }

$service = Get-Service -Name "CodexSyncPublisher" -ErrorAction Stop
$service.WaitForStatus([System.ServiceProcess.ServiceControllerStatus]::Running, [TimeSpan]::FromSeconds(20))
Write-Output "CodexSyncPublisher is running. It has no listener and publishes complete releases to the configured private folder."
