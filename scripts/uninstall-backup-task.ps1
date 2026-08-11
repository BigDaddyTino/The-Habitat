<#
.SYNOPSIS
  Removes the nightly Habitat backup scheduled task. Existing backup files are left alone.
#>
[CmdletBinding()]
param([string] $TaskName = "Habitat Nightly Backup")

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

if (-not ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
  throw "Run this uninstaller from an elevated PowerShell session."
}

if (-not (Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue)) {
  Write-Output "Scheduled task '$TaskName' is not registered."
  return
}

Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false
Write-Output "Removed scheduled task '$TaskName'. Backup files on the storage volume were not touched."
