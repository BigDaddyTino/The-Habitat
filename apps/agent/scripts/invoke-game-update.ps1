[CmdletBinding()]
param([Parameter(Mandatory)][string]$ConfigPath)
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$failureCode = 'update_configuration_invalid'
$status = $null
$mutex = $null
$ownsMutex = $false
$steamProcess = $null
$savedFiles = @()

function Write-UpdatePhase([string]$Phase, [string]$Code = '') {
  $status.phase = $Phase
  $status.updatedAt = [DateTime]::UtcNow.ToString('o')
  $status.errorCode = if ($Code) { $Code } else { $null }
  $temporary = $config.statusPath + '.' + $status.operationId + '.tmp'
  [IO.File]::WriteAllText($temporary, ($status | ConvertTo-Json -Compress), [Text.UTF8Encoding]::new($false))
  [IO.File]::Replace($temporary, $config.statusPath, ($config.statusPath + '.previous'))
  Write-Output "Update phase: $Phase"
}

function Test-GameProcess {
  $processes = @(Get-CimInstance Win32_Process -Filter ("Name='" + $config.processName + "'") -ErrorAction Stop)
  if ($config.processCommandLineIncludes) {
    $processes = @($processes | Where-Object { $_.CommandLine -and $_.CommandLine.IndexOf($config.processCommandLineIncludes, [StringComparison]::OrdinalIgnoreCase) -ge 0 })
  }
  return $processes.Count -gt 0
}

function Wait-GameProcess([bool]$Running) {
  $deadline = [DateTime]::UtcNow.AddSeconds($config.serviceTimeoutSeconds)
  while ((Test-GameProcess) -ne $Running) {
    if ($Running -and (Get-Service -Name $config.serviceName).Status -eq 'Stopped') { throw 'Game service exited during startup' }
    if ([DateTime]::UtcNow -ge $deadline) { throw 'Game process did not settle' }
    Start-Sleep -Seconds 1
  }
}

function Read-PalworldPassword {
  foreach ($line in [IO.File]::ReadAllLines($config.agentEnvironmentPath)) {
    if ($line -match '^\s*HABITAT_PALWORLD_ADMIN_PASSWORD\s*=\s*(.*)$') {
      $value = $Matches[1].Trim()
      if ($value.Length -ge 2 -and (($value.StartsWith('"') -and $value.EndsWith('"')) -or ($value.StartsWith("'") -and $value.EndsWith("'")))) { return $value.Substring(1, $value.Length - 2) }
      return ($value -split '#', 2)[0].Trim()
    }
  }
  throw 'Palworld shutdown credential missing'
}

try {
  $config = Get-Content -LiteralPath $ConfigPath -Raw | ConvertFrom-Json
  $apps = @{valheim=896660;palworld=2394010;enshrouded=2278520;'project-zomboid'=380870;'7-days-to-die'=294420;dragonwilds=4019830}
  $services = @{valheim='HabitatGameValheim';palworld='HabitatGamePalworld';enshrouded='HabitatGameEnshrouded';'project-zomboid'='HabitatGameProjectZomboid';'7-days-to-die'='HabitatGame7DaysToDie';dragonwilds='HabitatGameDragonwilds'}
  if (-not $apps.ContainsKey($config.gameKey) -or $apps[$config.gameKey] -ne $config.appId -or $services[$config.gameKey] -ne $config.serviceName) { throw 'Game definition not allow-listed' }
  if ($config.processName -notmatch '^[A-Za-z0-9_.-]+\.exe$' -or $config.serviceTimeoutSeconds -lt 5 -or $config.serviceTimeoutSeconds -gt 300) { throw 'Invalid process definition' }
  foreach ($localPath in @($config.installDirectory,$config.steamcmdPath,$config.statusPath,$config.gameExecutable)) {
    if ($localPath -notmatch '^[A-Za-z]:\\[^"\r\n]+$') { throw 'Expected a fixed local path' }
  }
  foreach ($required in @($config.installDirectory,$config.steamcmdPath,$config.gameExecutable,$config.statusPath)) {
    if (-not (Test-Path -LiteralPath $required)) { throw 'Required update input missing' }
  }
  $status = Get-Content -LiteralPath $config.statusPath -Raw | ConvertFrom-Json
  if ($status.operationId -notmatch '^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$' -or $status.phase -ne 'QUEUED' -or [DateTime]::UtcNow - [DateTime]::Parse($status.startedAt).ToUniversalTime() -gt [TimeSpan]::FromMinutes(5)) { $status=$null; throw 'No fresh queued operation' }
  $failureCode = 'updater_busy'
  $mutex = [Threading.Mutex]::new($false, 'Global\HabitatSteamCmdUpdate')
  try { $ownsMutex = $mutex.WaitOne(0) } catch [Threading.AbandonedMutexException] { $ownsMutex = $true }
  if (-not $ownsMutex -or @(Get-CimInstance Win32_Process -Filter "Name='steamcmd.exe'" -ErrorAction Stop).Count -gt 0) { throw 'SteamCMD is already in use' }

  $failureCode = 'server_stop_failed'
  Write-UpdatePhase 'STOPPING'
  $gameService = Get-Service -Name $config.serviceName
  if ($gameService.Status -notin @('Running','Stopped')) { throw 'Game service is transitioning' }
  if ($gameService.Status -eq 'Stopped' -and (Test-GameProcess)) { $failureCode='service_stop_incomplete'; throw 'Game process exists outside its stopped service' }
  if ($gameService.Status -eq 'Running') {
    if ($config.gameKey -eq 'project-zomboid' -and (Test-GameProcess)) {
      $stopArguments = '-NoProfile -NonInteractive -ExecutionPolicy Bypass -File "'+(Join-Path $PSScriptRoot 'stop-zomboid.ps1')+'" -ExpectedExecutable "'+$config.gameExecutable+'"'
      $shutdownLog = Join-Path (Split-Path -Parent $config.statusPath) ('shutdown-'+$status.operationId)
      $stopper = Start-Process -FilePath "$env:SystemRoot\System32\WindowsPowerShell\v1.0\powershell.exe" -ArgumentList $stopArguments -WindowStyle Hidden -PassThru -RedirectStandardOutput ($shutdownLog+'.out.log') -RedirectStandardError ($shutdownLog+'.err.log')
      try {
        $null = $stopper.Handle
        if (-not $stopper.WaitForExit(170000)) { $stopper.Kill(); throw 'Graceful shutdown helper timed out' }
        $stopper.Refresh()
        Write-Output ("Zomboid graceful shutdown helper exit: "+$stopper.ExitCode)
        if ($stopper.ExitCode -ne 0) { throw 'Zomboid graceful shutdown did not complete' }
      } finally { $stopper.Dispose() }
      Wait-GameProcess $false
    }
    if ($config.gameKey -eq 'palworld' -and (Test-GameProcess)) {
      $failureCode = 'palworld_shutdown_failed'
      $password = Read-PalworldPassword
      if ([string]::IsNullOrWhiteSpace($password)) { throw 'Shutdown credential missing' }
      $auth = [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes('admin:'+$password))
      try {
        $null = Invoke-RestMethod -Method Post -Uri ("http://127.0.0.1:"+$config.palworldApiPort+'/v1/api/shutdown') -Headers @{Authorization=('Basic '+$auth)} -ContentType 'application/json' -Body '{"waittime":15,"message":"The Habitat is updating this world. It will start again when the update finishes."}' -TimeoutSec 15 -MaximumRedirection 0
      } finally { $password=$null; $auth=$null }
      Wait-GameProcess $false
    }
    $failureCode = 'server_stop_failed'
    if ((Get-Service -Name $config.serviceName).Status -ne 'Stopped') { Stop-Service -Name $config.serviceName -ErrorAction Stop }
    $gameService.WaitForStatus('Stopped',[TimeSpan]::FromSeconds($config.serviceTimeoutSeconds))
  }
  $failureCode = 'service_stop_incomplete'
  Wait-GameProcess $false

  # Preserve operator configuration and original logs before Steam touches files.
  $failureCode = 'update_backup_failed'
  $operationRoot = Join-Path (Split-Path -Parent $config.statusPath) $status.operationId
  $null = New-Item -ItemType Directory -Path $operationRoot
  foreach ($sourcePath in $config.preserveFiles) {
    if (Test-Path -LiteralPath $sourcePath -PathType Leaf) {
      $backupPath = Join-Path $operationRoot ('config-'+$savedFiles.Count+'.bak')
      Copy-Item -LiteralPath $sourcePath -Destination $backupPath
      $savedFiles += @{Source=$sourcePath;Backup=$backupPath}
    }
  }
  if ($config.logDirectory -and (Test-Path -LiteralPath $config.logDirectory -PathType Container)) {
    $archive = Join-Path $operationRoot 'original-logs'
    $null = New-Item -ItemType Directory -Path $archive
    foreach ($log in Get-ChildItem -LiteralPath $config.logDirectory -File -Filter '*.log') { Copy-Item -LiteralPath $log.FullName -Destination (Join-Path $archive $log.Name) }
  }
  $failureCode = 'steamcmd_failed'
  Write-UpdatePhase 'UPDATING'
  $stdout = Join-Path $operationRoot 'steamcmd.out.log'
  $stderr = Join-Path $operationRoot 'steamcmd.err.log'
  $arguments = '+@ShutdownOnFailedCommand 1 +@NoPromptForPassword 1 +force_install_dir "'+$config.installDirectory+'" +login anonymous +app_update '+$config.appId+' +quit'
  try {
    $steamProcess = Start-Process -FilePath $config.steamcmdPath -ArgumentList $arguments -WorkingDirectory (Split-Path -Parent $config.steamcmdPath) -WindowStyle Hidden -PassThru -RedirectStandardOutput $stdout -RedirectStandardError $stderr
    $null = $steamProcess.Handle
    if (-not $steamProcess.WaitForExit(3600000)) {
      $failureCode = 'update_timeout'
      & "$env:SystemRoot\System32\taskkill.exe" /PID $steamProcess.Id /T /F | Out-Null
      throw 'SteamCMD timed out'
    }
    $steamProcess.Refresh()
    $successPattern = "Success!\s+App\s+'"+[regex]::Escape([string]$config.appId)+"'\s+(fully installed|already up to date)\."
    if ($steamProcess.ExitCode -ne 0 -or -not (Select-String -LiteralPath $stdout -Pattern $successPattern -Quiet)) { throw 'SteamCMD did not confirm a completed update' }
  } finally {
    foreach ($saved in $savedFiles) { Copy-Item -LiteralPath $saved.Backup -Destination $saved.Source -Force }
  }
  $failureCode = 'server_start_failed'
  Write-UpdatePhase 'STARTING'
  if ($config.gameKey -eq 'project-zomboid') {
    $failureCode = 'startup_configuration_failed'
    . (Join-Path $PSScriptRoot 'sync-zomboid-launch.ps1')
    Sync-ZomboidLaunch $config.installDirectory $config.gameServiceXmlPath
    $failureCode = 'server_start_failed'
  }
  Start-Service -Name $config.serviceName
  (Get-Service -Name $config.serviceName).WaitForStatus('Running',[TimeSpan]::FromSeconds($config.serviceTimeoutSeconds))
  Wait-GameProcess $true
  Write-UpdatePhase 'SUCCEEDED'
  exit 0
} catch {
  if ($null -ne $status) { Write-UpdatePhase 'FAILED' $failureCode }
  Write-Output "Update failed: $failureCode"
  exit 1
} finally {
  if ($steamProcess) { $steamProcess.Dispose() }
  if ($ownsMutex) { $mutex.ReleaseMutex() }
  if ($mutex) { $mutex.Dispose() }
}
