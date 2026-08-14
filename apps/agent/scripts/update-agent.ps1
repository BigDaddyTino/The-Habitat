[CmdletBinding()]
param(
  [Parameter(Mandatory)] [string] $InstallRoot,
  [switch] $SkipPull
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Net.Http

if (-not ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
  throw "Run this updater from an elevated PowerShell session."
}

$agentRoot = (Resolve-Path -LiteralPath $InstallRoot).Path
$repositoryRoot = (Resolve-Path -LiteralPath (Join-Path $agentRoot "..\..")).Path
$serviceTemplate = Join-Path $agentRoot "service\HabitatAgent.xml.template"
$serviceXml = Join-Path $agentRoot "HabitatAgent.xml"
$serviceXmlBackup = Join-Path $agentRoot "HabitatAgent.xml.previous"
$environmentFile = Join-Path $agentRoot ".env"

foreach ($required in @($serviceTemplate, $serviceXml, $environmentFile, (Join-Path $agentRoot "package.json"))) {
  if (-not (Test-Path -LiteralPath $required -PathType Leaf)) { throw "Missing required Agent artifact: $required" }
}
if (-not (Get-Service -Name "HabitatAgent" -ErrorAction SilentlyContinue)) { throw "HabitatAgent is not installed on this host." }

$nodeCommand = Get-Command node.exe -ErrorAction SilentlyContinue
if (-not $nodeCommand) { throw "Node.js 24 LTS must be installed and available as node.exe." }
$nodeExecutable = $nodeCommand.Source
$nodeVersionText = & $nodeExecutable -p "process.versions.node"
if ($LASTEXITCODE -ne 0) { throw "Unable to determine the installed Node.js version." }
$nodeVersion = [version]$nodeVersionText.Trim()
if ($nodeVersion.Major -ne 24 -or $nodeVersion -lt [version]"24.19.0") {
  throw "Habitat Agent requires Node.js >=24.19.0 and <25; found $nodeVersion."
}

function Invoke-Checked([string] $Executable, [string[]] $Arguments) {
  & $Executable @Arguments
  if ($LASTEXITCODE -ne 0) { throw "$Executable failed with exit code $LASTEXITCODE." }
}

function Get-AgentEnvironmentValue([string] $Name) {
  foreach ($line in [System.IO.File]::ReadAllLines($environmentFile)) {
    if ($line -match ("^\s*" + [regex]::Escape($Name) + "\s*=\s*(.*)$")) { return $Matches[1].Trim() }
  }
  throw "The Agent .env does not contain $Name."
}

function Test-AgentListener([string] $BindHost, [int] $Port) {
  $handler = [System.Net.Http.HttpClientHandler]::new()
  $handler.UseProxy = $false
  $client = [System.Net.Http.HttpClient]::new($handler)
  $client.Timeout = [TimeSpan]::FromSeconds(2)
  try {
    for ($attempt = 1; $attempt -le 5; $attempt++) {
      try {
        $response = $client.GetAsync("http://${BindHost}:$Port/health").GetAwaiter().GetResult()
        # No bearer token is sent. A protected, running Agent returns 401 when
        # local access is allow-listed or 403 when it is not.
        $statusCode = [int]$response.StatusCode
        $response.Dispose()
        if ($statusCode -in @(401, 403)) { return $true }
      } catch {
        # The wrapper may still be starting. Retry within the bounded window.
      }
      Start-Sleep -Seconds 1
    }
    return $false
  } finally {
    $client.Dispose()
  }
}

Push-Location $repositoryRoot
try {
  if (-not $SkipPull) { Invoke-Checked "git.exe" @("pull", "--ff-only") }
  $trackedStatus = & git.exe status --porcelain --untracked-files=no
  if ($LASTEXITCODE -ne 0) { throw "Unable to verify repository status before deployment." }
  if (-not [string]::IsNullOrWhiteSpace(($trackedStatus -join [Environment]::NewLine))) {
    throw "Refusing to deploy tracked, uncommitted changes. Commit or restore the worktree first."
  }
  Invoke-Checked "pnpm.cmd" @("install", "--frozen-lockfile")
  Invoke-Checked "pnpm.cmd" @("--filter", "@habitat/agent", "build")

  $serviceContents = [System.IO.File]::ReadAllText($serviceTemplate)
  $serviceContents = $serviceContents.Replace("{{NODE_EXE}}", [Security.SecurityElement]::Escape($nodeExecutable)).Replace("{{AGENT_ROOT}}", [Security.SecurityElement]::Escape($agentRoot))
  if ($serviceContents.Contains("{{")) { throw "The HabitatAgent service template contains an unresolved placeholder." }
  [xml]$serviceContents | Out-Null

  Copy-Item -LiteralPath $serviceXml -Destination $serviceXmlBackup -Force
  [System.IO.File]::WriteAllText($serviceXml, $serviceContents, [System.Text.UTF8Encoding]::new($false))
  try {
    Restart-Service -Name "HabitatAgent" -ErrorAction Stop
    $service = Get-Service -Name "HabitatAgent"
    if ($service.Status -ne [System.ServiceProcess.ServiceControllerStatus]::Running) {
      throw "HabitatAgent did not remain running after restart; current state is $($service.Status)."
    }
    $bindHost = Get-AgentEnvironmentValue "HABITAT_AGENT_BIND_HOST"
    $port = [int](Get-AgentEnvironmentValue "HABITAT_AGENT_PORT")
    if (-not (Test-AgentListener $bindHost $port)) {
      throw "HabitatAgent did not answer its protected local health route after restart."
    }
  } catch {
    $restartFailure = $_
    Stop-Service -Name "HabitatAgent" -Force -ErrorAction SilentlyContinue
    Copy-Item -LiteralPath $serviceXmlBackup -Destination $serviceXml -Force
    $dist = [System.IO.Path]::GetFullPath((Join-Path $agentRoot "dist"))
    $previousDist = [System.IO.Path]::GetFullPath((Join-Path $agentRoot "dist.previous"))
    if ((Split-Path -Parent $dist) -ne $agentRoot -or (Split-Path -Parent $previousDist) -ne $agentRoot) {
      throw "Refusing to roll back build directories outside the Agent root. Original restart error: $restartFailure"
    }
    if (Test-Path -LiteralPath $previousDist -PathType Container) {
      $failedDist = Join-Path $agentRoot ("dist.failed." + (Get-Date -Format "yyyyMMddHHmmss"))
      if (Test-Path -LiteralPath $dist -PathType Container) { Move-Item -LiteralPath $dist -Destination $failedDist }
      Move-Item -LiteralPath $previousDist -Destination $dist
    }
    Start-Service -Name "HabitatAgent" -ErrorAction SilentlyContinue
    throw "The new Habitat Agent did not stay healthy. The prior XML and build were restored, its restart was attempted, and failed output was retained for diagnosis. Original error: $restartFailure"
  }
} finally {
  Pop-Location
}

Write-Output "Habitat Agent update built in staging, passed bare-Node verification, refreshed its service definition, and restarted successfully."
