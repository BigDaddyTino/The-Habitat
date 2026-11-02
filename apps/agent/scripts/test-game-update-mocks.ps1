# Isolated child-process fixture. Every service/process/network mutation is
# replaced before loading the production workflow. No installed game is touched.
param([Parameter(Mandatory)][string]$FixtureRoot, [Parameter(Mandatory)][string]$Scenario, [Parameter(Mandatory)][string]$WorkflowPath)
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$script:running = $Scenario -ne 'sleeping'
$script:serviceState = if ($script:running) { 'Running' } else { 'Stopped' }
$events = Join-Path $FixtureRoot 'events.log'
function Record([string]$Value) { Add-Content -LiteralPath $events -Value $Value }
function Get-CimInstance {
  param($ClassName,$Filter,$ErrorAction)
  if ($Filter -eq "Name='steamcmd.exe'") { if ($Scenario -eq 'busy') { return @{ProcessId=456} }; return }
  if ($script:running) { return @{ ProcessId=123; CommandLine='fixture' } }
}
function Get-Service {
  param($Name)
  if ($Name -notin @('HabitatGameValheim','HabitatGamePalworld','HabitatGameProjectZomboid')) { throw 'Unexpected fixture service' }
  $service = [pscustomobject]@{Status=$script:serviceState}
  $service | Add-Member -MemberType ScriptMethod -Name WaitForStatus -Value { param($Wanted,$Timeout) if ($script:serviceState -ne $Wanted) { throw 'Fixture service did not settle' } }
  return $service
}
function Stop-Service {
  param($Name,$ErrorAction)
  Record 'stop'
  if ($Scenario -eq 'stop-failure') { throw 'Fixture stop failed' }
  $script:running=$false; $script:serviceState='Stopped'
}
function Start-Service {
  param($Name)
  Record 'start'
  if ($Scenario -eq 'start-failure') { throw 'Fixture start failed' }
  $script:running=$true; $script:serviceState='Running'
}
function Invoke-RestMethod {
  param($Method,$Uri,$Headers,$ContentType,$Body,$TimeoutSec,$MaximumRedirection)
  if ($Uri -ne 'http://127.0.0.1:8212/v1/api/shutdown') { throw 'Unexpected fixture API' }
  Record 'shutdown-api'; $script:running=$false
}
function Start-Process {
  param($FilePath,$ArgumentList,$WorkingDirectory,$WindowStyle,[switch]$PassThru,$RedirectStandardOutput,$RedirectStandardError)
  if ($FilePath -eq "$env:SystemRoot\System32\WindowsPowerShell\v1.0\powershell.exe") {
    if (-not $Scenario.StartsWith('zomboid') -or $WindowStyle -ne 'Hidden' -or $ArgumentList -notlike '*stop-zomboid.ps1*') { throw 'Unexpected graceful shutdown helper' }
    Record 'graceful-stop'
    if ($Scenario -ne 'zomboid-shutdown-failure') { $script:running=$false }
    $process = [pscustomobject]@{Handle=0;ExitCode=$(if ($Scenario -eq 'zomboid-shutdown-failure') { 1 } else { 0 })}
    $process | Add-Member -MemberType ScriptMethod -Name WaitForExit -Value { param($Timeout) return $true }
    $process | Add-Member -MemberType ScriptMethod -Name Refresh -Value {}
    $process | Add-Member -MemberType ScriptMethod -Name Dispose -Value {}
    return $process
  }
  if ($FilePath -ne (Join-Path $FixtureRoot 'steamcmd.exe') -or $WindowStyle -ne 'Hidden') { throw 'Unexpected fixture executable' }
  Record 'steamcmd'
  Set-Content -LiteralPath (Join-Path $FixtureRoot 'settings.ini') -Value 'overwritten by fixture update'
  $app = if ($Scenario -eq 'palworld') { '2394010' } elseif ($Scenario.StartsWith('zomboid')) { '380870' } else { '896660' }
  $output = if ($Scenario -eq 'missing-success') { 'ERROR! Update unavailable.' } else { "Success! App '$app' fully installed." }
  Set-Content -LiteralPath $RedirectStandardOutput -Value $output
  Set-Content -LiteralPath $RedirectStandardError -Value ''
  $process = [pscustomobject]@{Handle=0;Id=999999;ExitCode=$(if ($Scenario -eq 'steam-failure') { 1 } else { 0 })}
  $process | Add-Member -MemberType ScriptMethod -Name WaitForExit -Value { param($Timeout) return $true }
  $process | Add-Member -MemberType ScriptMethod -Name Refresh -Value {}
  $process | Add-Member -MemberType ScriptMethod -Name Dispose -Value {}
  return $process
}
. $WorkflowPath -ConfigPath (Join-Path $FixtureRoot 'config.json')
exit $LASTEXITCODE
