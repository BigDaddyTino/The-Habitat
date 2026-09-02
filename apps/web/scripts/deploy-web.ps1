[CmdletBinding()]
param(
  [Parameter(Mandatory)] [string] $InstallRoot,
  # How many superseded release directories to keep for rollback. The active
  # one and the one it replaced are never pruned regardless.
  [int] $KeepReleases = 3,
  [string] $HealthPath = "/chronicle",
  [int] $HealthAttempts = 20,
  # Ship past a failing release audit. For a hotfix whose whole point is to
  # repair the data the audit is complaining about - never as a way of not
  # reading it. What was skipped is printed and repeated at the end.
  [switch] $SkipAudit
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

<#
  Deploys a web change without building into the directory the running server
  is reading.

  The old runbook rebuilt straight into the live `.next` and then restarted the
  service. Between those two steps the running process was serving a build
  whose chunks had already been replaced underneath it, which is where the
  production log's ChunkLoadError and missing-module failures came from, and a
  build that failed halfway left no way back.

  Here each deploy builds into its own `.next-<stamp>` while the current
  release keeps serving. Only when that build has produced a BUILD_ID does the
  service switch to it - one restart, seconds rather than the length of a
  build. If the new release does not answer a health check, the service is put
  back on the previous directory, which is still on disk untouched.

  Which directory the service reads is the `HABITAT_WEB_DIST_DIR` env value in
  HabitatWeb.xml; next.config.ts reads the same variable. Nothing is renamed,
  so a rollback is the same one-line change in reverse.

    .\apps\web\scripts\deploy-web.ps1 -InstallRoot (Get-Location)
#>

if (-not ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
  throw "Run this deploy from an elevated PowerShell session."
}

$root = (Resolve-Path -LiteralPath $InstallRoot).Path
$webRoot = Join-Path $root "apps\web"
$serviceXml = Join-Path $root "HabitatWeb.xml"
$serviceExecutable = Join-Path $root "HabitatWeb.exe"

foreach ($required in @($webRoot, $serviceXml, $serviceExecutable, (Join-Path $root ".env"))) {
  if (-not (Test-Path -LiteralPath $required)) { throw "Missing required deployment input: $required" }
}
if (-not (Get-Service -Name "HabitatWeb" -ErrorAction SilentlyContinue)) { throw "The HabitatWeb service does not exist. Use install-web.ps1 first." }

# --- the service's current build directory ------------------------------------

function Get-DistDir([string] $xmlPath) {
  $xml = [xml] (Get-Content -LiteralPath $xmlPath -Raw)
  $node = $xml.service.env | Where-Object { $_.name -eq "HABITAT_WEB_DIST_DIR" }
  if ($node) { return $node.value }
  return ".next"
}

function Set-DistDir([string] $xmlPath, [string] $value) {
  $xml = [xml] (Get-Content -LiteralPath $xmlPath -Raw)
  $node = $xml.service.env | Where-Object { $_.name -eq "HABITAT_WEB_DIST_DIR" }
  if (-not $node) {
    $node = $xml.CreateElement("env")
    $node.SetAttribute("name", "HABITAT_WEB_DIST_DIR")
    # Beside the other env entries, so the file stays readable by hand.
    $anchor = @($xml.service.env)[-1]
    if ($anchor) { [void] $xml.service.InsertAfter($node, $anchor) } else { [void] $xml.service.AppendChild($node) }
  }
  $node.SetAttribute("value", $value)
  $xml.Save($xmlPath)
}

function Restart-HabitatWeb() {
  # Restart-Service throws when the stop takes longer than the service
  # controller's default wait, even though WinSW does finish stopping a few
  # seconds later and starts the new release. That threw once (2026-09-02)
  # after the switch and skipped the health check and the prune, with the
  # new release already serving. Stop, wait up to 90s for Stopped, then
  # start - and let Test-Health be the judge, not the stop's timing.
  $service = Get-Service HabitatWeb
  if ($service.Status -ne "Stopped") {
    try { Stop-Service HabitatWeb -Force -ErrorAction Stop } catch { Write-Warning "Stop-Service reported: $($_.Exception.Message) - waiting for the service to settle." }
    try { $service.WaitForStatus("Stopped", [TimeSpan]::FromSeconds(90)) } catch { Write-Warning "HabitatWeb did not report Stopped within 90s; starting anyway and letting the health check decide." }
  }
  Start-Service HabitatWeb -ErrorAction SilentlyContinue
  Start-Sleep -Seconds 2
}

function Test-Health([int] $attempts) {
  for ($attempt = 1; $attempt -le $attempts; $attempt++) {
    try {
      $response = Invoke-WebRequest -UseBasicParsing -TimeoutSec 10 "http://127.0.0.1:3000$HealthPath"
      if ($response.StatusCode -eq 200) { return $true }
    } catch {
      # Next takes a few seconds to accept connections after a restart; a
      # refused connection early in the window is not yet a failed deploy.
    }
    Start-Sleep -Seconds 3
  }
  return $false
}

$previousDist = Get-DistDir $serviceXml
$stamp = (Get-Date).ToString("yyyyMMdd-HHmmss")
$releaseDist = ".next-$stamp"
$releasePath = Join-Path $webRoot $releaseDist
if (Test-Path -LiteralPath $releasePath) { throw "Release directory already exists: $releasePath" }

Write-Output "Current release: $previousDist"
Write-Output "Building:        $releaseDist"

# --- the release audit, before anything is built ------------------------------

# Read-only, and deliberately first: a release that would ship stripped
# metadata, a reference in the wrong namespace, art reachable without a
# session, a missing asset, an impossible place tree, or a board nobody can
# play should not consume a build, let alone reach members.
if ($SkipAudit) {
  Write-Warning "The release audit was SKIPPED by request. Whatever it would have caught is going to production."
} else {
  Write-Output ""
  $strictForAudit = $ErrorActionPreference
  $ErrorActionPreference = "Continue"
  try {
    & "C:\Program Files\nodejs\corepack.cmd" pnpm --filter @habitat/web exec tsx scripts/audit-release.ts 2>&1 | ForEach-Object { "$_" }
    $auditExit = $LASTEXITCODE
  } finally {
    $ErrorActionPreference = $strictForAudit
  }
  if ($auditExit -ne 0) {
    throw "The release audit failed (exit $auditExit). Nothing was built and $previousDist is still serving. Fix the findings above, or re-run with -SkipAudit if this deploy is the fix."
  }
  Write-Output ""
}

# --- build, with the old release still serving --------------------------------

# `next build` rewrites next-env.d.ts to reference whatever distDir it built
# into, and that file is committed. Left alone, every deploy would dirty the
# working tree with a pointer to a release directory that pruning later
# deletes, and the next `pnpm typecheck` would fail on the missing types.
$nextEnv = Join-Path $webRoot "next-env.d.ts"
$nextEnvBefore = if (Test-Path -LiteralPath $nextEnv) { [System.IO.File]::ReadAllText($nextEnv) } else { $null }

$env:HABITAT_WEB_DIST_DIR = $releaseDist
# Windows PowerShell wraps every stderr line from a native command in an
# ErrorRecord, and under `Stop` that makes the first one terminating. pnpm
# writes its own "$ next build" banner to stderr, so the strict preference has
# to be relaxed across the call or a perfectly good build reads as a failure.
# The exit code below is what actually decides the outcome.
$strict = $ErrorActionPreference
$ErrorActionPreference = "Continue"
try {
  & "C:\Program Files\nodejs\corepack.cmd" pnpm --filter @habitat/web build 2>&1 | ForEach-Object { "$_" }
  $buildExit = $LASTEXITCODE
} finally {
  $ErrorActionPreference = $strict
  Remove-Item Env:\HABITAT_WEB_DIST_DIR -ErrorAction SilentlyContinue
  if ($null -ne $nextEnvBefore) { [System.IO.File]::WriteAllText($nextEnv, $nextEnvBefore) }
}

# A build that did not finish leaves a half-written directory behind. Remove it
# rather than leaving something that looks like a release nobody can roll to.
if ($buildExit -ne 0 -or -not (Test-Path -LiteralPath (Join-Path $releasePath "BUILD_ID"))) {
  if (Test-Path -LiteralPath $releasePath) { Remove-Item -LiteralPath $releasePath -Recurse -Force -ErrorAction SilentlyContinue }
  throw "The production build failed (exit $buildExit). Nothing was deployed; $previousDist is still serving."
}

# --- switch ------------------------------------------------------------------

Write-Output "Switching HabitatWeb to $releaseDist"
Set-DistDir $serviceXml $releaseDist
Restart-HabitatWeb

if (-not (Test-Health $HealthAttempts)) {
  Write-Warning "$releaseDist did not answer $HealthPath with 200. Rolling back to $previousDist."
  Set-DistDir $serviceXml $previousDist
  Restart-HabitatWeb
  if (Test-Health $HealthAttempts) { Write-Warning "Rolled back. $previousDist is serving again; $releaseDist is kept on disk for inspection." }
  else { Write-Error "Rollback to $previousDist also failed its health check. HabitatWeb needs hands." }
  exit 1
}

Write-Output "$releaseDist is live and healthy."

# --- prune -------------------------------------------------------------------

# Never the active release, never the one it replaced. Everything older is
# sorted newest-first and trimmed to $KeepReleases.
$stale = Get-ChildItem -LiteralPath $webRoot -Directory -Filter ".next-*" |
  Where-Object { $_.Name -ne $releaseDist -and $_.Name -ne $previousDist } |
  Sort-Object Name -Descending |
  Select-Object -Skip $KeepReleases
foreach ($directory in $stale) {
  Write-Output "Pruning superseded release $($directory.Name)"
  Remove-Item -LiteralPath $directory.FullName -Recurse -Force
}

Write-Output ""
if ($SkipAudit) { Write-Warning "This release shipped WITHOUT the release audit. Run it and fix what it finds." }
Write-Output "Deployed. To roll back by hand, set HABITAT_WEB_DIST_DIR to $previousDist in HabitatWeb.xml and restart HabitatWeb."
