[CmdletBinding()]
param()
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$status = [ordered]@{ checkedAtUtc = [DateTime]::UtcNow.ToString('o'); success = $false; message = '' }
$exitCode = 1
try {
  $result = @(& (Join-Path $PSScriptRoot 'update-player-dns.ps1') -ConfigPath (Join-Path $PSScriptRoot 'config.json'))
  $status.success = $true
  $status.message = ($result -join ' ')
  $exitCode = 0
} catch {
  $status.message = 'Player DNS update failed. Run the updater with -CheckOnly locally to diagnose.'
} finally {
  $statusJson = $status | ConvertTo-Json
  [IO.File]::WriteAllText((Join-Path $PSScriptRoot 'last-run.json'), $statusJson, [Text.UTF8Encoding]::new($false))
  if ($status.success) { [IO.File]::WriteAllText((Join-Path $PSScriptRoot 'last-success.json'), $statusJson, [Text.UTF8Encoding]::new($false)) }
}
exit $exitCode
