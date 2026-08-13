<#
.SYNOPSIS
  Backs up The Habitat portal to the persistent storage volume.

.DESCRIPTION
  Captures the four things a rebuild cannot regenerate:
    * the PostgreSQL database (members, identities, events, achievements, audits);
    * member avatar uploads;
    * untracked local configuration (.env, agent config, service wrappers);
    * the full Git history of the application itself.

  Game-world saves are deliberately out of scope. Per the master plan, existing game
  backup systems are discovered and reported before anything here touches them.

.EXAMPLE
  pwsh -File scripts\backup-habitat.ps1
#>
[CmdletBinding()]
param(
  [string] $BackupRoot,
  [string] $AvatarPath,
  [string] $RepositoryRoot,
  [string] $PostgresContainer = "habitat-postgres",
  [string] $PostgresUser = "habitat_app",
  [string] $PostgresDatabase = "habitat",
  [int] $DailyRetention = 7,
  [int] $WeeklyRetention = 4,
  [int] $MonthlyRetention = 6
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Read-EnvironmentFile {
  param([string] $Path)
  $values = @{}
  if (-not (Test-Path -LiteralPath $Path)) { return $values }
  foreach ($line in [System.IO.File]::ReadAllLines($Path)) {
    $trimmed = $line.Trim()
    if ($trimmed.Length -eq 0 -or $trimmed.StartsWith("#")) { continue }
    $separator = $trimmed.IndexOf("=")
    if ($separator -lt 1) { continue }
    $key = $trimmed.Substring(0, $separator).Trim()
    $value = $trimmed.Substring($separator + 1).Trim()
    if ($value.Length -ge 2 -and (($value.StartsWith('"') -and $value.EndsWith('"')) -or ($value.StartsWith("'") -and $value.EndsWith("'")))) {
      $value = $value.Substring(1, $value.Length - 2)
    }
    $values[$key] = $value
  }
  return $values
}

function Get-EnvironmentValue {
  param([hashtable] $Values, [string] $Key)
  if ($Values.ContainsKey($Key) -and $Values[$Key].Length -gt 0) { return $Values[$Key] }
  return $null
}

# Keeps the newest backup per day, per week, and per month, then discards the rest.
function Get-ExpiredBackup {
  param([object[]] $Files, [int] $Daily, [int] $Weekly, [int] $Monthly)
  $dated = @()
  foreach ($file in $Files) {
    $match = [regex]::Match($file.Name, "(\d{8}-\d{6})")
    if (-not $match.Success) { continue }
    $when = [datetime]::MinValue
    if (-not [datetime]::TryParseExact($match.Groups[1].Value, "yyyyMMdd-HHmmss", [cultureinfo]::InvariantCulture, [System.Globalization.DateTimeStyles]::None, [ref] $when)) { continue }
    $monday = $when.Date.AddDays(-((([int] $when.DayOfWeek) + 6) % 7))
    $dated += [pscustomobject]@{ File = $file; When = $when; Day = $when.ToString("yyyy-MM-dd"); Week = $monday.ToString("yyyy-MM-dd"); Month = $when.ToString("yyyy-MM") }
  }
  if ($dated.Count -eq 0) { return @() }

  $keep = New-Object System.Collections.Generic.HashSet[string]
  foreach ($tier in @(@{ Key = "Day"; Count = $Daily }, @{ Key = "Week"; Count = $Weekly }, @{ Key = "Month"; Count = $Monthly })) {
    if ($tier.Count -le 0) { continue }
    $buckets = $dated | Group-Object -Property $tier.Key | Sort-Object -Property Name -Descending | Select-Object -First $tier.Count
    foreach ($bucket in $buckets) {
      $newest = $bucket.Group | Sort-Object -Property When -Descending | Select-Object -First 1
      [void] $keep.Add($newest.File.FullName)
    }
  }
  return @($dated | Where-Object { -not $keep.Contains($_.File.FullName) } | ForEach-Object { $_.File })
}

function Remove-ExpiredBackup {
  param([string] $Directory, [string] $Filter)
  if (-not (Test-Path -LiteralPath $Directory)) { return 0 }
  $existing = @(Get-ChildItem -LiteralPath $Directory -Filter $Filter -File)
  $expired = @(Get-ExpiredBackup -Files $existing -Daily $DailyRetention -Weekly $WeeklyRetention -Monthly $MonthlyRetention)
  foreach ($file in $expired) { Remove-Item -LiteralPath $file.FullName -Force }
  return $expired.Count
}

function New-Directory {
  param([string] $Path)
  if (-not (Test-Path -LiteralPath $Path)) { [void] (New-Item -ItemType Directory -Path $Path -Force) }
  return (Resolve-Path -LiteralPath $Path).Path
}

$repository = $RepositoryRoot
if (-not $repository) { $repository = Split-Path -Parent $PSScriptRoot }
$repository = (Resolve-Path -LiteralPath $repository).Path
$environment = Read-EnvironmentFile -Path (Join-Path $repository ".env")

if (-not $BackupRoot) { $BackupRoot = Get-EnvironmentValue -Values $environment -Key "HABITAT_BACKUP_PATH" }
if (-not $BackupRoot) { throw "Set HABITAT_BACKUP_PATH in .env or pass -BackupRoot." }
if (-not $AvatarPath) { $AvatarPath = Get-EnvironmentValue -Values $environment -Key "HABITAT_AVATAR_STORAGE_PATH" }
if (-not $AvatarPath) { $AvatarPath = Join-Path $repository "apps\web\public\member-avatars" }

$stamp = (Get-Date).ToString("yyyyMMdd-HHmmss")
$started = Get-Date
$root = New-Directory -Path $BackupRoot
$databaseDirectory = New-Directory -Path (Join-Path $root "database")
$configDirectory = New-Directory -Path (Join-Path $root "config")
$repositoryDirectory = New-Directory -Path (Join-Path $root "repository")
$avatarDirectory = New-Directory -Path (Join-Path $root "avatars")
$steps = @()
$failures = @()

function Add-Step {
  param([string] $Name, [string] $Status, [string] $Detail, [long] $Bytes = 0, [string] $Path = "")
  $script:steps += [pscustomobject]@{ name = $Name; status = $Status; detail = $Detail; bytes = $Bytes; path = $Path }
  if ($Status -eq "failed") { $script:failures += "$Name`: $Detail" }
  Write-Output ("[{0}] {1} - {2}" -f $Status.ToUpper(), $Name, $Detail)
}

# 1. PostgreSQL. Dumped inside the container, then copied out, so the custom-format
#    stream is never mangled by PowerShell redirection.
$databaseFile = Join-Path $databaseDirectory "habitat-$stamp.dump"
$containerPath = $null
try {
  $running = @(& docker ps --filter "name=^/$PostgresContainer$" --filter "status=running" --format "{{.Names}}")
  if ($LASTEXITCODE -ne 0 -or $running.Count -eq 0) { throw "Container '$PostgresContainer' is not running." }
  $containerPath = "/tmp/habitat-$stamp.dump"
  & docker exec $PostgresContainer pg_dump --username $PostgresUser --dbname $PostgresDatabase --format custom --compress 6 --file $containerPath
  if ($LASTEXITCODE -ne 0) { throw "pg_dump exited with $LASTEXITCODE." }
  & docker cp "$($PostgresContainer):$containerPath" $databaseFile
  if ($LASTEXITCODE -ne 0) { throw "docker cp exited with $LASTEXITCODE." }
  $size = (Get-Item -LiteralPath $databaseFile).Length
  Add-Step -Name "database" -Status "ok" -Detail ("{0:N1} MB" -f ($size / 1MB)) -Bytes $size -Path $databaseFile
} catch {
  Add-Step -Name "database" -Status "failed" -Detail $_.Exception.Message
} finally {
  if ($containerPath) {
    & docker exec $PostgresContainer rm -f $containerPath | Out-Null
    $global:LASTEXITCODE = 0
  }
}

# 2. Untracked configuration. These files carry live secrets, so they stay on the
#    local volume and are never pushed anywhere.
$configFile = Join-Path $configDirectory "config-$stamp.zip"
$staging = $null
try {
  $staging = Join-Path ([System.IO.Path]::GetTempPath()) "habitat-config-$stamp"
  [void] (New-Item -ItemType Directory -Path $staging -Force)
  $captured = 0
  foreach ($relative in @(".env", "HabitatWeb.xml", "HabitatWorker.xml", "apps\agent\agent.config.json", "apps\agent\game-services.json", "docker-compose.yml")) {
    $source = Join-Path $repository $relative
    if (-not (Test-Path -LiteralPath $source -PathType Leaf)) { continue }
    Copy-Item -LiteralPath $source -Destination (Join-Path $staging ($relative -replace "[\\/]", "_"))
    $captured++
  }
  if ($captured -eq 0) { throw "No configuration files were found under $repository." }
  Compress-Archive -Path (Join-Path $staging "*") -DestinationPath $configFile -CompressionLevel Optimal -Force
  $size = (Get-Item -LiteralPath $configFile).Length
  Add-Step -Name "config" -Status "ok" -Detail "$captured files" -Bytes $size -Path $configFile
} catch {
  Add-Step -Name "config" -Status "failed" -Detail $_.Exception.Message
} finally {
  if ($staging -and (Test-Path -LiteralPath $staging)) {
    Remove-Item -LiteralPath $staging -Recurse -Force
  }
}

# 3. Application history. A bundle restores with `git clone`, so the portal can be
#    rebuilt from this volume alone if the working tree is lost.
$bundleFile = Join-Path $repositoryDirectory "habitat-$stamp.bundle"
try {
  if (-not (Get-Command git.exe -ErrorAction SilentlyContinue)) { throw "git.exe is not available on PATH." }
  & git -C $repository bundle create --quiet $bundleFile --all
  if ($LASTEXITCODE -ne 0) { throw "git bundle exited with $LASTEXITCODE." }
  $pending = @(& git -C $repository status --porcelain)
  $size = (Get-Item -LiteralPath $bundleFile).Length
  $detail = "{0:N1} MB" -f ($size / 1MB)
  if ($pending.Count -gt 0) { $detail = "$detail; $($pending.Count) uncommitted path(s) not captured" }
  Add-Step -Name "repository" -Status "ok" -Detail $detail -Bytes $size -Path $bundleFile
} catch {
  Add-Step -Name "repository" -Status "failed" -Detail $_.Exception.Message
}

# 4. Avatars. Mirrored rather than versioned; the files are immutable and named by UUID.
try {
  if (-not (Test-Path -LiteralPath $AvatarPath -PathType Container)) {
    Add-Step -Name "avatars" -Status "skipped" -Detail "No avatar directory at $AvatarPath yet."
  } else {
    $source = (Resolve-Path -LiteralPath $AvatarPath).Path
    if ($source.TrimEnd("\") -eq $avatarDirectory.TrimEnd("\")) { throw "Avatar storage and the mirror target are the same directory; /MIR would delete the originals." }
    & robocopy $source $avatarDirectory /MIR /R:2 /W:2 /NFL /NDL /NJH /NJS /NP | Out-Null
    if ($LASTEXITCODE -ge 8) { throw "robocopy exited with $LASTEXITCODE." }
    $global:LASTEXITCODE = 0
    $mirrored = @(Get-ChildItem -LiteralPath $avatarDirectory -File -Recurse)
    $size = 0
    if ($mirrored.Count -gt 0) { $size = ($mirrored | Measure-Object -Property Length -Sum).Sum }
    Add-Step -Name "avatars" -Status "ok" -Detail "$($mirrored.Count) files" -Bytes $size -Path $avatarDirectory
  }
} catch {
  Add-Step -Name "avatars" -Status "failed" -Detail $_.Exception.Message
}

# 5. Retention. Only prune categories that succeeded, so a failed run never erodes
#    the history it just failed to extend.
$pruned = 0
try {
  if (($steps | Where-Object { $_.name -eq "database" -and $_.status -eq "ok" })) { $pruned += Remove-ExpiredBackup -Directory $databaseDirectory -Filter "habitat-*.dump" }
  if (($steps | Where-Object { $_.name -eq "config" -and $_.status -eq "ok" })) { $pruned += Remove-ExpiredBackup -Directory $configDirectory -Filter "config-*.zip" }
  if (($steps | Where-Object { $_.name -eq "repository" -and $_.status -eq "ok" })) { $pruned += Remove-ExpiredBackup -Directory $repositoryDirectory -Filter "habitat-*.bundle" }
  Add-Step -Name "retention" -Status "ok" -Detail "$pruned expired file(s) removed"
} catch {
  Add-Step -Name "retention" -Status "failed" -Detail $_.Exception.Message
}

$completed = Get-Date
$result = "succeeded"
if ($failures.Count -gt 0) { $result = "failed" }
$summary = [pscustomobject]@{
  startedAt = $started.ToUniversalTime().ToString("o")
  completedAt = $completed.ToUniversalTime().ToString("o")
  durationSeconds = [math]::Round(($completed - $started).TotalSeconds, 1)
  result = $result
  backupRoot = $root
  steps = $steps
}
# latest.json is the file the portal will read for "last successful backup" metadata.
[System.IO.File]::WriteAllText((Join-Path $root "latest.json"), ($summary | ConvertTo-Json -Depth 4), (New-Object System.Text.UTF8Encoding($false)))
$logLine = "{0}  {1}  {2}s  {3}" -f $completed.ToString("s"), $result, $summary.durationSeconds, (($steps | ForEach-Object { "$($_.name)=$($_.status)" }) -join " ")
Add-Content -LiteralPath (Join-Path $root "backup-log.txt") -Value $logLine -Encoding utf8

if ($failures.Count -gt 0) {
  Write-Error ("Habitat backup finished with errors:`n - " + ($failures -join "`n - "))
  exit 1
}
Write-Output "Habitat backup $stamp completed in $($summary.durationSeconds)s -> $root"
