[CmdletBinding()]
param(
  [Parameter(Mandatory)] [string] $AgentBindIp,
  [Parameter(Mandatory)] [string] $MartServ101Ip,
  [ValidateRange(1, 65535)] [int] $Port = 4317
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"
$ruleName = "Habitat Agent (MartServ101 only)"

function Test-PrivateIpv4([string] $Address) {
  $parts = $Address.Split(".")
  if ($parts.Count -ne 4) { return $false }
  foreach ($part in $parts) {
    if ($part -notmatch '^\d{1,3}$' -or [int] $part -gt 255) { return $false }
  }
  $first = [int] $parts[0]
  $second = [int] $parts[1]
  return $first -eq 10 -or ($first -eq 172 -and $second -ge 16 -and $second -le 31) -or ($first -eq 192 -and $second -eq 168)
}

if (-not (Test-PrivateIpv4 $AgentBindIp) -or -not (Test-PrivateIpv4 $MartServ101Ip)) {
  throw "Both AgentBindIp and MartServ101Ip must be explicit private IPv4 addresses."
}

Get-NetFirewallRule -DisplayName $ruleName -ErrorAction SilentlyContinue | Remove-NetFirewallRule
New-NetFirewallRule -DisplayName $ruleName -DisplayGroup "The Habitat" -Direction Inbound -Action Allow -Protocol TCP -LocalAddress $AgentBindIp -LocalPort $Port -RemoteAddress $MartServ101Ip -Profile Private | Out-Null
Write-Output "Firewall allows Habitat Agent TCP $Port only from $MartServ101Ip."
