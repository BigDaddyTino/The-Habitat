import { execFile } from "node:child_process";
import { promisify } from "node:util";
import path from "node:path";
import { GameDig } from "gamedig";
import type { AgentDiskObservation, AgentExecutableObservation, AgentProcessObservation, AgentQueryObservation } from "@habitat/shared";
import type { AgentServerConfiguration } from "./config.js";

const execFileAsync = promisify(execFile);
const processLookupScript = "$name = $env:HABITAT_PROCESS_EXE; $needle = $env:HABITAT_PROCESS_COMMAND_LINE_INCLUDES; $processes = @(Get-CimInstance Win32_Process -Filter \"Name='$name'\" -ErrorAction SilentlyContinue); if ($needle) { $processes = @($processes | Where-Object { $_.CommandLine -and $_.CommandLine.IndexOf($needle, [System.StringComparison]::OrdinalIgnoreCase) -ge 0 }) }; $items = @($processes | ForEach-Object { [PSCustomObject]@{ Id = $_.ProcessId; StartTime = if ($_.CreationDate) { $_.CreationDate.ToUniversalTime().ToString('o') } else { $null }; WorkingSet64 = [double]$_.WorkingSetSize; CPU = ([double]$_.KernelModeTime + [double]$_.UserModeTime) / 10000000 } }); $items | ConvertTo-Json -Compress";
const diskLookupScript = "$drive = $env:HABITAT_DISK_DRIVE; $disk = Get-CimInstance Win32_LogicalDisk -Filter \"DeviceID='$drive'\" | Select-Object FreeSpace,Size; $disk | ConvertTo-Json -Compress";
const executableLookupScript = "$item = Get-Item -LiteralPath $env:HABITAT_EXECUTABLE_PATH -ErrorAction SilentlyContinue; if ($item) { [PSCustomObject]@{ Exists = $true; Version = $item.VersionInfo.FileVersion } | ConvertTo-Json -Compress }";

type WindowsProcess = { Id: number; StartTime?: string; WorkingSet64?: number; CPU?: number };

export async function observeServer(server: AgentServerConfiguration): Promise<{ process: AgentProcessObservation; disk: AgentDiskObservation | null; executable: AgentExecutableObservation | null; query: AgentQueryObservation | null }> {
  const [process, disk, executable, query] = await Promise.all([
    observeProcess(server.processName, server.processCommandLineIncludes),
    server.installPath ? observeDisk(server.installPath) : Promise.resolve(null),
    server.executablePath ? observeExecutable(server.executablePath) : Promise.resolve(null),
    server.query ? observeGameQuery(server) : Promise.resolve(null),
  ]);
  return { process, disk, executable, query };
}

export async function observeProcess(configuredProcessName: string, processCommandLineIncludes?: string): Promise<AgentProcessObservation> {
  if (process.platform !== "win32") return emptyProcessObservation();
  const executableName = configuredProcessName.toLowerCase().endsWith(".exe") ? configuredProcessName : `${configuredProcessName}.exe`;
  try {
    const { stdout } = await execFileAsync("powershell.exe", ["-NoProfile", "-NonInteractive", "-Command", processLookupScript], {
      timeout: 5_000,
      windowsHide: true,
      env: { ...process.env, HABITAT_PROCESS_EXE: executableName, HABITAT_PROCESS_COMMAND_LINE_INCLUDES: processCommandLineIncludes ?? "" },
    });
    const processes = parseJsonArray<WindowsProcess>(stdout);
    if (processes.length === 0) return emptyProcessObservation();
    const earliestStart = processes.map((item) => item.StartTime ? new Date(item.StartTime) : null).filter((item): item is Date => item !== null).sort((left, right) => left.getTime() - right.getTime())[0] ?? null;
    return {
      running: true,
      processCount: processes.length,
      pid: processes[0]?.Id ?? null,
      startedAt: earliestStart?.toISOString() ?? null,
      uptimeSeconds: earliestStart ? Math.max(0, Math.floor((Date.now() - earliestStart.getTime()) / 1_000)) : null,
      memoryBytes: sumNullable(processes.map((item) => item.WorkingSet64)),
      cpuSeconds: sumNullable(processes.map((item) => item.CPU)),
    };
  } catch {
    return emptyProcessObservation();
  }
}

async function observeDisk(installPath: string): Promise<AgentDiskObservation> {
  if (process.platform !== "win32") return { available: false, freeBytes: null, totalBytes: null };
  const drive = path.parse(installPath).root.replace(/\\/g, "").replace(/\/$/, "");
  if (!/^[A-Za-z]:$/.test(drive)) return { available: false, freeBytes: null, totalBytes: null };
  try {
    const { stdout } = await execFileAsync("powershell.exe", ["-NoProfile", "-NonInteractive", "-Command", diskLookupScript], {
      timeout: 5_000,
      windowsHide: true,
      env: { ...process.env, HABITAT_DISK_DRIVE: drive },
    });
    const value = parseSingleJson<{ FreeSpace?: number; Size?: number }>(stdout);
    return value && Number.isFinite(value.FreeSpace) && Number.isFinite(value.Size)
      ? { available: true, freeBytes: value.FreeSpace ?? null, totalBytes: value.Size ?? null }
      : { available: false, freeBytes: null, totalBytes: null };
  } catch {
    return { available: false, freeBytes: null, totalBytes: null };
  }
}

async function observeExecutable(executablePath: string): Promise<AgentExecutableObservation> {
  if (process.platform !== "win32") return { available: false, version: null };
  try {
    const { stdout } = await execFileAsync("powershell.exe", ["-NoProfile", "-NonInteractive", "-Command", executableLookupScript], {
      timeout: 5_000,
      windowsHide: true,
      env: { ...process.env, HABITAT_EXECUTABLE_PATH: executablePath },
    });
    const value = parseSingleJson<{ Exists?: boolean; Version?: string }>(stdout);
    return { available: value?.Exists === true, version: value?.Version?.trim() || null };
  } catch {
    return { available: false, version: null };
  }
}

async function observeGameQuery(server: AgentServerConfiguration): Promise<AgentQueryObservation> {
  const query = server.query;
  if (!query) return { attempted: false, reachable: null, pingMs: null, playerCount: null, maxPlayers: null, version: null };
  try {
    const result = await GameDig.query({
      type: query.type as never,
      host: query.host,
      port: query.port,
      socketTimeout: query.timeoutMs,
    });
    return {
      attempted: true,
      reachable: true,
      pingMs: Number.isFinite(result.ping) ? result.ping : null,
      playerCount: query.playerCountSupported && Number.isFinite(result.numplayers) ? result.numplayers : null,
      maxPlayers: query.playerCountSupported ? result.maxplayers : null,
      version: result.version || null,
    };
  } catch {
    return { attempted: true, reachable: false, pingMs: null, playerCount: null, maxPlayers: null, version: null };
  }
}

function emptyProcessObservation(): AgentProcessObservation {
  return { running: false, processCount: 0, pid: null, startedAt: null, uptimeSeconds: null, memoryBytes: null, cpuSeconds: null };
}

function parseJsonArray<T>(value: string): T[] {
  const parsed = parseSingleJson<T | T[]>(value);
  return Array.isArray(parsed) ? parsed : parsed ? [parsed] : [];
}

function parseSingleJson<T>(value: string): T | null {
  if (!value.trim()) return null;
  try { return JSON.parse(value) as T; } catch { return null; }
}

function sumNullable(values: Array<number | undefined>): number | null {
  const present = values.filter((value): value is number => typeof value === "number" && Number.isFinite(value));
  return present.length > 0 ? present.reduce((total, value) => total + value, 0) : null;
}
