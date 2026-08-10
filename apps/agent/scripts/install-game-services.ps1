[CmdletBinding()]
param(
  [Parameter(Mandatory)] [string] $InstallRoot,
  [switch] $Replace
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

if (-not ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
  throw "Run this installer from an elevated PowerShell session."
}

$agentRoot = (Resolve-Path -LiteralPath $InstallRoot).Path
$configurationPath = Join-Path $agentRoot "game-services.json"
$agentConfigurationPath = Join-Path $agentRoot "agent.config.json"
$winsw = Join-Path $agentRoot "HabitatAgent.exe"
$servicesRoot = Join-Path $agentRoot "game-services"

foreach ($required in @($configurationPath, $agentConfigurationPath, $winsw)) {
  if (-not (Test-Path -LiteralPath $required)) { throw "Missing required local artifact: $required" }
}

$configuration = Get-Content -Raw -LiteralPath $configurationPath | ConvertFrom-Json
$valheimPassword = [string]$configuration.valheimPassword
if ([string]::IsNullOrWhiteSpace($valheimPassword) -or $valheimPassword -eq "REPLACE_WITH_YOUR_VALHEIM_PASSWORD") {
  throw "Set valheimPassword in the ignored local game-services.json before installing."
}

function New-GameDefinition([string] $key, [string] $serviceName, [string] $updateServiceName, [string] $startWorkingDirectory, [string] $updateWorkingDirectory, [int] $stopTimeoutSeconds, [string] $startScript, [string] $updateScript, [hashtable] $environment = @{}) {
  return [pscustomobject]@{ Key = $key; ServiceName = $serviceName; UpdateServiceName = $updateServiceName; StartWorkingDirectory = $startWorkingDirectory; UpdateWorkingDirectory = $updateWorkingDirectory; StopTimeoutSeconds = $stopTimeoutSeconds; StartScript = $startScript; UpdateScript = $updateScript; Environment = $environment }
}

$games = @(
  (New-GameDefinition "valheim" "HabitatGameValheim" "HabitatUpdateValheim" "C:\ValheimServer" "C:\ValheimServer" 120 @'
@echo off
set SteamAppId=892970
cd /d "C:\ValheimServer"
valheim_server.exe -nographics -batchmode -name "Habitat" -port 2456 -world "HabitatValhalla" -password "%HABITAT_VALHEIM_PASSWORD%" -savedir "C:\ValheimData" -public 1 -saveinterval 1800 -backups 10 -backupshort 7200 -backuplong 43200 -logFile-
'@ @'
@echo off
"C:\steamcmd\steamcmd.exe" +force_install_dir "C:\ValheimServer" +login anonymous +app_update 896660 +quit
'@ @{ HABITAT_VALHEIM_PASSWORD = $valheimPassword })
  (New-GameDefinition "palworld" "HabitatGamePalworld" "HabitatUpdatePalworld" "C:\steamcmd\palworld_server" "C:\steamcmd" 120 @'
@echo off
cd /d "C:\steamcmd\palworld_server"
PalServer.exe -log -useperfthreads -NoAsyncLoadingThread -UseMultithreadForDS -publiclobby
'@ @'
@echo off
"C:\steamcmd\steamcmd.exe" +force_install_dir "C:\steamcmd\palworld_server" +login anonymous +app_update 2394010 +quit
'@)
  (New-GameDefinition "dragonwilds" "HabitatGameDragonwilds" "HabitatUpdateDragonwilds" "C:\RSDragonwildsServer" "C:\steamcmd" 120 @'
@echo off
"C:\RSDragonwildsServer\RSDragonwildsServer.exe" -log -NewConsole
'@ @'
@echo off
"C:\steamcmd\steamcmd.exe" +force_install_dir "C:\RSDragonwildsServer" +login anonymous +app_update 4019830 +quit
'@)
  (New-GameDefinition "enshrouded" "HabitatGameEnshrouded" "HabitatUpdateEnshrouded" "C:\Enshrouded" "C:\steamcmd" 120 @'
@echo off
"C:\Enshrouded\enshrouded_server.exe"
'@ @'
@echo off
"C:\steamcmd\steamcmd.exe" +force_install_dir "C:\Enshrouded" +login anonymous +app_update 2278520 +quit
'@)
  (New-GameDefinition "project-zomboid" "HabitatGameProjectZomboid" "HabitatUpdateProjectZomboid" "C:\pzserver" "C:\steamcmd" 180 @'
@echo off
cd /d "C:\pzserver"
set PZ_CLASSPATH=java/istack-commons-runtime.jar;java/jassimp.jar;java/javacord-2.0.17-shaded.jar;java/javax.activation-api.jar;java/jaxb-api.jar;java/jaxb-runtime.jar;java/lwjgl.jar;java/lwjgl-natives-windows.jar;java/lwjgl-glfw.jar;java/lwjgl-glfw-natives-windows.jar;java/lwjgl-jemalloc.jar;java/lwjgl-jemalloc-natives-windows.jar;java/lwjgl-opengl.jar;java/lwjgl-opengl-natives-windows.jar;java/lwjgl_util.jar;java/sqlite-jdbc-3.27.2.1.jar;java/trove-3.0.3.jar;java/uncommons-maths-1.2.3.jar;java/commons-compress-1.18.jar;java/
".\jre64\bin\java.exe" -Djava.awt.headless=true -Dzomboid.steam=1 -Dzomboid.znetlog=1 -XX:+UseZGC -XX:-CreateCoredumpOnCrash -XX:-OmitStackTraceInFastThrow -Xms16g -Xmx16g -Djava.library.path=natives/;natives/win64/;. -cp %PZ_CLASSPATH% zombie.network.GameServer -statistic 0
'@ @'
@echo off
"C:\steamcmd\steamcmd.exe" +force_install_dir "C:\steamcmd\steamapps\common\Project Zomboid Dedicated Server" +login anonymous +app_update 380870 +quit
'@)
  (New-GameDefinition "7-days-to-die" "HabitatGame7DaysToDie" "HabitatUpdate7DaysToDie" "C:\7daysserver" "C:\steamcmd" 180 @'
@echo off
cd /d "C:\7daysserver"
echo|set /p="251570" > steam_appid.txt
set SteamAppId=251570
set SteamGameId=251570
7DaysToDieServer.exe -logfile "C:\7daysserver\output_log_dedi_habitat.txt" -quit -batchmode -nographics -configfile=serverconfig.xml -dedicated
'@ @'
@echo off
"C:\steamcmd\steamcmd.exe" +force_install_dir "C:\7daysserver" +login anonymous +app_update 294420 +quit
'@)
)

function Escape-Xml([string] $value) { return [Security.SecurityElement]::Escape($value) }

function Write-GeneratedScript([string] $destinationPath, [string] $content) {
  [System.IO.File]::WriteAllText($destinationPath, $content.Trim() + [Environment]::NewLine, [System.Text.UTF8Encoding]::new($false))
}

function Write-ServiceXml([string] $xmlPath, [string] $id, [string] $name, [string] $scriptPath, [string] $workingDirectory, [int] $stopTimeoutSeconds, [string] $logPath, [hashtable] $environment) {
  $command = "/d /c call `"$scriptPath`""
  $environmentXml = ($environment.GetEnumerator() | ForEach-Object { '  <env name="{0}" value="{1}" />' -f (Escape-Xml ([string]$_.Key)), (Escape-Xml ([string]$_.Value)) }) -join [Environment]::NewLine
  $xml = @"
<service>
  <id>$(Escape-Xml $id)</id>
  <name>$(Escape-Xml $name)</name>
  <description>Local Habitat allow-listed game operation.</description>
  <executable>C:\Windows\System32\cmd.exe</executable>
  <arguments>$(Escape-Xml $command)</arguments>
  <workingdirectory>$(Escape-Xml $workingDirectory)</workingdirectory>
$environmentXml
  <logpath>$(Escape-Xml $logPath)</logpath>
  <log mode="roll-by-size-time">
    <sizeThreshold>10485760</sizeThreshold>
    <keepFiles>5</keepFiles>
    <pattern>yyyyMMdd</pattern>
  </log>
  <stoptimeout>$($stopTimeoutSeconds)sec</stoptimeout>
  <onfailure action="none" />
</service>
"@
  [System.IO.File]::WriteAllText($xmlPath, $xml, [System.Text.UTF8Encoding]::new($false))
}

$agentConfiguration = Get-Content -Raw -LiteralPath $agentConfigurationPath | ConvertFrom-Json
New-Item -ItemType Directory -Path $servicesRoot -Force | Out-Null

foreach ($game in $games) {
  foreach ($directory in @($game.StartWorkingDirectory, $game.UpdateWorkingDirectory)) {
    if (-not (Test-Path -LiteralPath $directory -PathType Container)) { throw "Expected game directory was not found: $directory" }
  }
  if ($null -eq ($agentConfiguration.servers | Where-Object { $_.key -eq $game.Key })) { throw "Agent configuration does not contain server key: $($game.Key)" }

  $gameRoot = Join-Path $servicesRoot $game.Key
  New-Item -ItemType Directory -Path $gameRoot -Force | Out-Null
  $startScript = Join-Path $gameRoot "start.cmd"
  $updateScript = Join-Path $gameRoot "update.cmd"
  Write-GeneratedScript $startScript $game.StartScript
  Write-GeneratedScript $updateScript $game.UpdateScript

  foreach ($definition in @(
    @{ Id = $game.ServiceName; Name = "Habitat Game - $($game.Key)"; Script = $startScript; WorkingDirectory = $game.StartWorkingDirectory; Timeout = $game.StopTimeoutSeconds; Log = (Join-Path $gameRoot "logs"); Environment = $game.Environment },
    @{ Id = $game.UpdateServiceName; Name = "Habitat Update - $($game.Key)"; Script = $updateScript; WorkingDirectory = $game.UpdateWorkingDirectory; Timeout = 180; Log = (Join-Path $gameRoot "update-logs"); Environment = @{} }
  )) {
    $wrapper = Join-Path $gameRoot "$($definition.Id).exe"
    $xml = Join-Path $gameRoot "$($definition.Id).xml"
    $existing = Get-Service -Name $definition.Id -ErrorAction SilentlyContinue
    if ($existing) {
      if (-not $Replace) { throw "Service $($definition.Id) already exists. Re-run with -Replace after reviewing its current configuration." }
      & $wrapper stop 2>$null
      & $wrapper uninstall
    }
    Copy-Item -LiteralPath $winsw -Destination $wrapper -Force
    Write-ServiceXml $xml $definition.Id $definition.Name $definition.Script $definition.WorkingDirectory $definition.Timeout $definition.Log $definition.Environment
    & $wrapper install
    Set-Service -Name $definition.Id -StartupType Manual
  }

  $agentServer = $agentConfiguration.servers | Where-Object { $_.key -eq $game.Key } | Select-Object -First 1
  $agentServer | Add-Member -NotePropertyName control -NotePropertyValue ([pscustomobject]@{ serviceName = $game.ServiceName; updateServiceName = $game.UpdateServiceName; timeoutMs = [Math]::Min(($game.StopTimeoutSeconds + 30) * 1000, 300000) }) -Force
}

$agentConfiguration | ConvertTo-Json -Depth 20 | Set-Content -LiteralPath $agentConfigurationPath -Encoding utf8
Write-Output "Generated and installed 12 local Habitat services. They are manual-start by design; restart HabitatAgent before portal control is enabled."
