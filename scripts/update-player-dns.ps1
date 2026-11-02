[CmdletBinding()]
param(
  [Parameter(Mandatory)] [string] $ConfigPath,
  [switch] $CheckOnly
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$configuration = Get-Content -LiteralPath $ConfigPath -Raw | ConvertFrom-Json
$zoneId = [string]$configuration.zoneId
$hostname = ([string]$configuration.hostname).Trim().ToLowerInvariant()
$tokenPath = [string]$configuration.tokenFile
if ($zoneId -notmatch '^[a-f0-9]{32}$') { throw 'Set a valid Cloudflare zone ID in the private configuration.' }
if ($hostname.Length -gt 253 -or $hostname -notmatch '^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z][a-z0-9-]*$') { throw 'Set a valid DNS hostname.' }
if (-not [System.IO.Path]::IsPathRooted($tokenPath)) { throw 'The token file must have an absolute local path.' }
$apiToken = (Get-Content -LiteralPath $tokenPath -Raw).Trim()
if ([string]::IsNullOrWhiteSpace($apiToken) -or $apiToken -match '\s') { throw 'The DNS token file is empty or malformed.' }
$headers = @{ Authorization = "Bearer $apiToken" }
$recordRoot = "https://api.cloudflare.com/client/v4/zones/$zoneId/dns_records"
$ownershipComment = 'Managed by Habitat player DDNS'

function Invoke-DnsApi([string] $Method, [string] $Uri, $Body = $null) {
  try {
    $arguments = @{ Method = $Method; Uri = $Uri; Headers = $headers; TimeoutSec = 15; MaximumRedirection = 0 }
    if ($null -ne $Body) { $arguments.Body = ($Body | ConvertTo-Json -Compress); $arguments.ContentType = 'application/json' }
    $response = Invoke-RestMethod @arguments
    if (-not $response.success) { throw 'Request refused' }
    return $response.result
  } catch { throw 'Cloudflare DNS request failed. Check the scoped token and zone ID; no credentials are logged.' }
}

# Inspect every record type at this name; never overwrite a tunnel or another service.
$records = @(Invoke-DnsApi 'GET' ($recordRoot + '?name=' + [Uri]::EscapeDataString($hostname)))
if ($records.Count -gt 1) { throw 'Multiple DNS records exist at this name; refusing to change them.' }
if ($records.Count -eq 1) {
  $record = $records[0]
  if ($record.name -ne $hostname -or $record.type -ne 'A' -or $record.proxied -or $record.comment -ne $ownershipComment) {
    throw 'This hostname is not an owned DNS-only player record. Review it before enabling this updater.'
  }
  if ([string]$record.id -notmatch '^[a-f0-9]{32}$') { throw 'Invalid record identifier.' }
}

$observed = (Invoke-RestMethod -Uri 'https://api.ipify.org?format=json' -TimeoutSec 10 -MaximumRedirection 0).ip
if ($observed -notmatch '^(?:\d{1,3}\.){3}\d{1,3}$') { throw 'Public address detection failed.' }
$octets = @($observed.Split('.') | ForEach-Object { [int]$_ })
if (@($octets | Where-Object { $_ -gt 255 }).Count -gt 0 -or $octets[0] -in @(0,10,127) -or $octets[0] -ge 224 -or
    ($octets[0] -eq 100 -and $octets[1] -ge 64 -and $octets[1] -le 127) -or
    ($octets[0] -eq 169 -and $octets[1] -eq 254) -or
    ($octets[0] -eq 172 -and $octets[1] -ge 16 -and $octets[1] -le 31) -or
    ($octets[0] -eq 192 -and $octets[1] -in @(0,168)) -or
    ($octets[0] -eq 198 -and $octets[1] -in @(18,19,51)) -or
    ($octets[0] -eq 203 -and $octets[1] -eq 0 -and $octets[2] -eq 113)) { throw 'Address detection returned a non-public IPv4 address.' }

if ($CheckOnly) { Write-Output 'DNS access and public address detection passed. No record changed.'; return }
$payload = @{ type = 'A'; name = $hostname; content = $observed; ttl = 60; proxied = $false; comment = $ownershipComment }
if ($records.Count -eq 0) {
  $null = Invoke-DnsApi 'POST' $recordRoot $payload
  Write-Output 'Created the DNS-only player record.'
} elseif ($record.content -ne $observed -or $record.ttl -ne 60) {
  $null = Invoke-DnsApi 'PATCH' ($recordRoot + '/' + $record.id) $payload
  Write-Output 'Updated the player record.'
} else { Write-Output 'Player DNS is current.' }
