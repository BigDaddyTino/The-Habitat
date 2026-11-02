[CmdletBinding()]
param([Parameter(Mandatory)][string]$ExpectedExecutable)
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$target = $null

try {
  $expected = (Resolve-Path -LiteralPath $ExpectedExecutable).Path
  if ([IO.Path]::GetFileName($expected) -ine 'java.exe') { throw 'Unexpected game executable' }
  $service = Get-CimInstance Win32_Service -Filter "Name='HabitatGameProjectZomboid'"
  if (-not $service -or $service.ProcessId -eq 0) { throw 'Managed game service is not running' }
  $targets = @(Get-CimInstance Win32_Process -Filter "Name='java.exe'" | Where-Object {
    $_.ExecutablePath -ieq $expected -and $_.ParentProcessId -eq $service.ProcessId -and
    $_.CommandLine -match '(?:^|\s)zombie\.network\.GameServer(?:\s|$)'
  })
  if ($targets.Count -ne 1) { throw 'Expected exactly one managed game process' }
  $target = Get-Process -Id $targets[0].ProcessId
  # Retain this process handle so PID reuse cannot target a later process.
  $null = $target.Handle
  Add-Type -TypeDefinition @'
using System;
using System.ComponentModel;
using System.Runtime.InteropServices;
public static class HabitatZomboidConsole {
  [DllImport("kernel32.dll", SetLastError=true)] static extern bool FreeConsole();
  [DllImport("kernel32.dll", SetLastError=true)] static extern bool AttachConsole(uint processId);
  [DllImport("kernel32.dll", SetLastError=true)] static extern bool SetConsoleCtrlHandler(IntPtr handler, bool add);
  [DllImport("kernel32.dll", SetLastError=true)] static extern bool GenerateConsoleCtrlEvent(uint signal, uint group);
  public static void RequestStop(uint processId) {
    FreeConsole();
    if (!AttachConsole(processId)) throw new Win32Exception(Marshal.GetLastWin32Error());
    try {
      if (!SetConsoleCtrlHandler(IntPtr.Zero, true)) throw new Win32Exception(Marshal.GetLastWin32Error());
      System.Threading.Thread.Sleep(100);
      if (!GenerateConsoleCtrlEvent(0, 0)) throw new Win32Exception(Marshal.GetLastWin32Error());
    } finally { FreeConsole(); }
  }
}
'@
  [HabitatZomboidConsole]::RequestStop([uint32]$target.Id)
  if (-not $target.WaitForExit(150000)) { throw 'Game did not finish graceful shutdown' }
  # FreeConsole invalidates a console host's output handles. Use the exit code
  # for feedback; writing through PowerShell's host here can turn success into failure.
  exit 0
} catch {
  # Never kill the game after a failed signal; let the audited operation fail.
  exit 1
} finally {
  if ($null -ne $target) { $target.Dispose() }
}
