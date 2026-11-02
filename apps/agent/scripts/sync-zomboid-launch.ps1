Set-StrictMode -Version Latest

function Sync-ZomboidLaunch([string]$InstallDirectory, [string]$ServiceXmlPath) {
  $launcher = [IO.File]::ReadAllText((Join-Path $InstallDirectory 'StartServer64.bat'))
  $classpathMatch = [regex]::Match($launcher, '(?im)^SET PZ_CLASSPATH=([^\r\n]+)\r?$')
  $nativeMatch = [regex]::Match($launcher, '-Djava\.library\.path=([^\s"]+)')
  if (-not $classpathMatch.Success -or -not $nativeMatch.Success) { throw 'Unrecognized vendor Zomboid launcher' }
  $classpath = $classpathMatch.Groups[1].Value.Trim()
  $nativePath = $nativeMatch.Groups[1].Value.Trim()
  foreach ($value in @($classpath,$nativePath)) {
    if ($value -notmatch '^[A-Za-z0-9_./;-]+$' -or $value.Contains('..')) { throw 'Unsupported vendor Java path' }
    foreach ($part in $value.Split(';')) { if ($part.StartsWith('/')) { throw 'Vendor Java paths must be relative' } }
  }
  if ($classpath.Contains('projectzomboid.jar') -and -not (Test-Path -LiteralPath (Join-Path $InstallDirectory 'java\projectzomboid.jar'))) { throw 'Packaged game classes are missing' }
  $xml = [xml]([IO.File]::ReadAllText($ServiceXmlPath))
  if ([string]$xml.service.id -ne 'HabitatGameProjectZomboid' -or [string]$xml.service.arguments -notlike '*zombie.network.GameServer*') { throw 'Unexpected Zomboid service definition' }
  foreach ($entry in @(@{Name='PZ_CLASSPATH';Value=$classpath},@{Name='PZ_LIBRARY_PATH';Value=$nativePath})) {
    $node = $xml.service.SelectSingleNode("env[@name='$($entry.Name)']")
    if (-not $node) { $node = $xml.CreateElement('env'); $node.SetAttribute('name',$entry.Name); $null=$xml.service.AppendChild($node) }
    $node.SetAttribute('value',$entry.Value)
  }
  # Keep host-specific memory limits separate from the vendor's 16 GB default.
  # Once configured, an update preserves these values.
  foreach ($entry in @(@{Name='HABITAT_PZ_INITIAL_HEAP';Default='1024m'},@{Name='HABITAT_PZ_MAX_HEAP';Default='4096m'})) {
    $node = $xml.service.SelectSingleNode("env[@name='$($entry.Name)']")
    if (-not $node) { $node=$xml.CreateElement('env'); $node.SetAttribute('name',$entry.Name); $node.SetAttribute('value',$entry.Default); $null=$xml.service.AppendChild($node) }
    if ($node.GetAttribute('value') -notmatch '^[1-9][0-9]*m$') { throw 'Heap limits must be expressed in whole MiB' }
    $mib=[int]$node.GetAttribute('value').TrimEnd('m')
    if ($mib -lt 512 -or $mib -gt 32768) { throw 'Heap limit is outside the supported range' }
  }
  $initialMiB=[int]$xml.service.SelectSingleNode("env[@name='HABITAT_PZ_INITIAL_HEAP']").GetAttribute('value').TrimEnd('m')
  $maxMiB=[int]$xml.service.SelectSingleNode("env[@name='HABITAT_PZ_MAX_HEAP']").GetAttribute('value').TrimEnd('m')
  if ($initialMiB -gt $maxMiB) { throw 'Initial heap exceeds maximum heap' }
  foreach ($entry in @(@{Flag='Xms';Name='HABITAT_PZ_INITIAL_HEAP'},@{Flag='Xmx';Name='HABITAT_PZ_MAX_HEAP'})) {
    $pattern='(?<!\S)-'+$entry.Flag+'\S+'
    if ([regex]::Matches([string]$xml.service.arguments,$pattern).Count -ne 1) { throw 'Expected one explicit Java heap argument' }
    $xml.service.arguments=[regex]::Replace([string]$xml.service.arguments,$pattern,('-'+$entry.Flag+'%'+$entry.Name+'%'))
  }
  $xml.service.arguments = [regex]::Replace([string]$xml.service.arguments, '-Djava\.library\.path=[^\s]+', '-Djava.library.path=%PZ_LIBRARY_PATH%')
  if ([string]$xml.service.arguments -notlike '*-cp "%PZ_CLASSPATH%"*') { throw 'Expected the configured Java classpath argument' }
  $xml.Save($ServiceXmlPath)
}
