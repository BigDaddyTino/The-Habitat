[CmdletBinding()]
param([Parameter(Mandatory)][string]$InstallRoot, [switch]$CheckOnly)
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$agentRoot = (Resolve-Path -LiteralPath $InstallRoot).Path
$configurationPath = Join-Path $agentRoot 'agent.config.json'
$configuration = Get-Content -LiteralPath $configurationPath -Raw | ConvertFrom-Json
$sourceScript = Join-Path $PSScriptRoot 'invoke-game-update.ps1'
$zomboidLaunchScript = Join-Path $PSScriptRoot 'sync-zomboid-launch.ps1'
$zomboidStopScript = Join-Path $PSScriptRoot 'stop-zomboid.ps1'
$runtimeRoot = Join-Path $env:ProgramData 'The Habitat\game-updates'
$apps = @{valheim=896660;palworld=2394010;enshrouded=2278520;'project-zomboid'=380870;'7-days-to-die'=294420;dragonwilds=4019830}
$plans = @()
foreach ($server in $configuration.servers) {
  if (-not $apps.ContainsKey($server.key)) { continue }
  $serviceRoot = Join-Path (Join-Path $agentRoot 'game-services') $server.key
  $startXmlPath = Join-Path $serviceRoot ($server.control.serviceName+'.xml')
  $updateXmlPath = Join-Path $serviceRoot ($server.control.updateServiceName+'.xml')
  $start = [xml](Get-Content -LiteralPath $startXmlPath -Raw)
  $update = [xml](Get-Content -LiteralPath $updateXmlPath -Raw)
  if ((Get-Service -Name $server.control.updateServiceName).Status -ne 'Stopped') { throw "Updater is active for $($server.key); install after it finishes." }
  $installDirectory = [IO.Path]::GetFullPath([string]$start.service.workingdirectory)
  $gameExecutable = [string]$start.service.executable
  $steamcmdPath = if ([IO.Path]::GetFileName([string]$update.service.executable) -ieq 'steamcmd.exe') { [string]$update.service.executable } else {
    $existingConfig = Join-Path (Join-Path $runtimeRoot $server.key) 'config.json'
    (Get-Content -LiteralPath $existingConfig -Raw | ConvertFrom-Json).steamcmdPath
  }
  foreach ($required in @($installDirectory,$gameExecutable,$steamcmdPath,$sourceScript,$zomboidLaunchScript,$zomboidStopScript)) { if (-not (Test-Path -LiteralPath $required)) { throw "Missing lifecycle input for $($server.key)" } }
  $gameRuntime = Join-Path $runtimeRoot $server.key
  $preserveFiles = @()
  switch ($server.key) {
    'palworld' { $preserveFiles += Join-Path $installDirectory 'Pal\Saved\Config\WindowsServer\PalWorldSettings.ini' }
    'enshrouded' { $preserveFiles += Join-Path $installDirectory 'enshrouded_server.json' }
    '7-days-to-die' { $preserveFiles += Join-Path $installDirectory 'serverconfig.xml' }
  }
  $processExe = if ($server.processName.EndsWith('.exe')) { $server.processName } else { $server.processName+'.exe' }
  $needle = if ($server.PSObject.Properties['processCommandLineIncludes']) { [string]$server.processCommandLineIncludes } else { '' }
  $job = [ordered]@{
    gameKey=$server.key; appId=$apps[$server.key]; serviceName=$server.control.serviceName
    gameServiceXmlPath=$startXmlPath
    installDirectory=$installDirectory; gameExecutable=$gameExecutable; steamcmdPath=$steamcmdPath
    processName=$processExe; processCommandLineIncludes=$needle
    serviceTimeoutSeconds=[int]($server.control.timeoutMs / 1000)
    statusPath=(Join-Path $gameRuntime 'status.json'); preserveFiles=$preserveFiles
    logDirectory=$(if ($server.key -eq 'dragonwilds') { Split-Path -Parent $server.log.path } else { '' })
    agentEnvironmentPath=(Join-Path $agentRoot '.env')
    palworldApiPort=$(if ($server.key -eq 'palworld') { [int]$server.query.port } else { 0 })
  }
  $plans += [pscustomobject]@{Server=$server;GameRuntime=$gameRuntime;StartXml=$start;StartXmlPath=$startXmlPath;UpdateXml=$update;UpdateXmlPath=$updateXmlPath;Job=$job}
}
if ($plans.Count -ne 6) { throw 'Expected all six configured game service pairs' }
if ($CheckOnly) { $plans | ForEach-Object { Write-Output "PASS $($_.Server.key): service pair and executable paths exist; Steam app $($_.Job.appId); update targets the running installation." }; return }
if (-not ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) { throw 'Run the workflow installer as Administrator.' }
$null = New-Item -ItemType Directory -Path $runtimeRoot -Force
& icacls.exe $runtimeRoot /inheritance:r /grant:r '*S-1-5-32-544:(OI)(CI)F' '*S-1-5-18:(OI)(CI)F' | Out-Null
if ($LASTEXITCODE -ne 0) { throw 'Could not restrict the update runtime directory' }
$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
Copy-Item -LiteralPath $zomboidStopScript -Destination (Join-Path $runtimeRoot 'stop-zomboid.ps1') -Force
Copy-Item -LiteralPath $configurationPath -Destination (Join-Path $runtimeRoot ("agent.config.before-$stamp.json"))
$installedScript = Join-Path $runtimeRoot 'invoke-game-update.ps1'
Copy-Item -LiteralPath $sourceScript -Destination $installedScript -Force
Copy-Item -LiteralPath $zomboidLaunchScript -Destination (Join-Path $runtimeRoot 'sync-zomboid-launch.ps1') -Force
. $zomboidLaunchScript
foreach ($plan in $plans) {
  $null = New-Item -ItemType Directory -Path $plan.GameRuntime -Force
  $jobPath = Join-Path $plan.GameRuntime 'config.json'
  [IO.File]::WriteAllText($jobPath, ($plan.Job | ConvertTo-Json -Depth 8), [Text.UTF8Encoding]::new($false))
  Copy-Item -LiteralPath $plan.UpdateXmlPath -Destination (Join-Path $plan.GameRuntime ("update-service.before-$stamp.xml"))
  Copy-Item -LiteralPath $plan.StartXmlPath -Destination (Join-Path $plan.GameRuntime ("start-service.before-$stamp.xml"))
  # WinSW 2.12 can lose the parent handle before it discovers children.
  # Dragonwilds needs its game child stopped before the bootstrap launcher.
  # Direct executables must retain their console host until they shut down.
  # Updaters stop children first so SteamCMD cannot outlive a cancelled runner.
  foreach ($serviceXml in @($plan.StartXml, $plan.UpdateXml)) {
    $stopOrder = $serviceXml.service.SelectSingleNode('stopparentprocessfirst')
    if (-not $stopOrder) { $stopOrder = $serviceXml.CreateElement('stopparentprocessfirst'); $null = $serviceXml.service.AppendChild($stopOrder) }
    $stopOrder.InnerText = if ([string]$serviceXml.service.id -eq 'HabitatGameDragonwilds' -or ([string]$serviceXml.service.id).StartsWith('HabitatUpdate')) { 'false' } else { 'true' }
  }
  $plan.StartXml.Save($plan.StartXmlPath)
  if ($plan.Server.key -eq 'project-zomboid') { Sync-ZomboidLaunch $plan.Job.installDirectory $plan.StartXmlPath }
  $plan.UpdateXml.service.executable = "$env:SystemRoot\System32\WindowsPowerShell\v1.0\powershell.exe"
  $plan.UpdateXml.service.arguments = '-NoProfile -NonInteractive -WindowStyle Hidden -File "'+$installedScript+'" -ConfigPath "'+$jobPath+'"'
  $plan.UpdateXml.service.workingdirectory = [string]$plan.GameRuntime
  $plan.UpdateXml.Save($plan.UpdateXmlPath)
  $plan.Server.control | Add-Member -NotePropertyName updateStatusPath -NotePropertyValue $plan.Job.statusPath -Force
  Write-Output "Installed stop/update/start workflow for $($plan.Server.key)."
}
[IO.File]::WriteAllText($configurationPath, ($configuration | ConvertTo-Json -Depth 20), [Text.UTF8Encoding]::new($false))
Write-Output 'All six workflows installed. Reload the compatible HabitatAgent build to read the updated private configuration. Game services were not started or stopped.'
