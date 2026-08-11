<#
.SYNOPSIS
  Registers the nightly Habitat backup as a Windows scheduled task.

.DESCRIPTION
  The task runs as the invoking account with the highest available privileges, because
  the backup shells out to the Docker CLI and SYSTEM is usually not a docker-users member.

.EXAMPLE
  powershell -File scripts\install-backup-task.ps1 -At 04:00
#>
[CmdletBinding()]
param(
  [string] $TaskName = "Habitat Nightly Backup",
  [datetime] $At = "04:00",
  [string] $RepositoryRoot
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

if (-not ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
  throw "Run this installer from an elevated PowerShell session."
}

$repository = $RepositoryRoot
if (-not $repository) { $repository = Split-Path -Parent $PSScriptRoot }
$repository = (Resolve-Path -LiteralPath $repository).Path
$script = Join-Path $repository "scripts\backup-habitat.ps1"
if (-not (Test-Path -LiteralPath $script)) { throw "Missing backup script: $script" }
if (-not (Test-Path -LiteralPath (Join-Path $repository ".env"))) { throw "Missing .env at $repository. HABITAT_BACKUP_PATH must be set before scheduling." }

$identity = [Security.Principal.WindowsIdentity]::GetCurrent().Name
$action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-NoProfile -NonInteractive -ExecutionPolicy Bypass -File `"$script`"" -WorkingDirectory $repository
$trigger = New-ScheduledTaskTrigger -Daily -At $At
$principal = New-ScheduledTaskPrincipal -UserId $identity -LogonType S4U -RunLevel Highest
$settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -DontStopOnIdleEnd -ExecutionTimeLimit (New-TimeSpan -Hours 2) -MultipleInstances IgnoreNew

if (Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue) {
  Set-ScheduledTask -TaskName $TaskName -Action $action -Trigger $trigger -Principal $principal -Settings $settings | Out-Null
  Write-Output "Updated scheduled task '$TaskName'."
} else {
  Register-ScheduledTask -TaskName $TaskName -Action $action -Trigger $trigger -Principal $principal -Settings $settings -Description "Backs up the Habitat database, avatars, configuration, and Git history to the persistent volume." | Out-Null
  Write-Output "Registered scheduled task '$TaskName'."
}

Write-Output "Runs daily at $($At.ToString('HH:mm')) as $identity."
Write-Output "Run it once now with: Start-ScheduledTask -TaskName `"$TaskName`""
