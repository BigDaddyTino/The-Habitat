import { spawn } from "node:child_process";
import path from "node:path";
import { setTimeout as wait } from "node:timers/promises";
import type { AgentActionErrorCode, AgentServerAction, AgentServerActionResult, AgentUpdateStatus } from "@habitat/shared";
import type { AgentServerConfiguration } from "./config.js";
import { observeProcess } from "./observations.js";
import { queueUpdate, readUpdateStatus } from "./update-status.js";

type ServiceState = "RUNNING" | "STOPPED" | "PENDING" | "UNKNOWN";

type CommandResult = { exitCode: number; output: string };

export class WindowsServiceController {
  private readonly busy = new Set<string>();
  constructor(
    private readonly run = runSc,
    private readonly observe = (name: string, includes?: string) => observeProcess(name, includes, true),
    private readonly shutdownPalworld = requestPalworldShutdown,
    private readonly prepareUpdate = queueUpdate,
    private readonly readUpdate = readUpdateStatus,
    private readonly shutdownZomboid = requestZomboidShutdown,
  ) {}

  async perform(server: AgentServerConfiguration, action: AgentServerAction): Promise<AgentServerActionResult> {
    if (!server.control) throw new ServiceControlError("control_not_configured");
    if (this.busy.has(server.key)) return this.result(server.key, action, false, "PENDING", "operation_in_progress");
    this.busy.add(server.key);
    try {
      const updater = await this.getState(server.control.updateServiceName);
      if (updater !== "STOPPED") return this.result(server.key, action, false, updater, "operation_in_progress");
      if (action === "update") {
        if (!server.control.updateStatusPath) throw new ServiceControlError("update_not_configured");
        const operation = await this.prepareUpdate(server);
        await this.start(server.control.updateServiceName);
        return { ...this.result(server.key, action, true, "PENDING", "update_started"), operationId: operation.operationId };
      }
      return await this.performServiceAction(server, action);
    } finally {
      this.busy.delete(server.key);
    }
  }

  async updateStatus(server: AgentServerConfiguration): Promise<AgentUpdateStatus> {
    if (!server.control?.updateStatusPath) throw new ServiceControlError("update_not_configured");
    const status = await this.readUpdate(server);
    if (!status) throw new ServiceControlError("update_status_unavailable");
    if (status.phase !== "SUCCEEDED" && status.phase !== "FAILED"
      && Date.now() - Date.parse(status.startedAt) > 15_000
      && await this.getState(server.control.updateServiceName) === "STOPPED") {
      return { ...status, phase: "FAILED", errorCode: "update_interrupted", updatedAt: new Date().toISOString() };
    }
    return status;
  }

  private async performServiceAction(server: AgentServerConfiguration, action: AgentServerAction): Promise<AgentServerActionResult> {
    if (!server.control) throw new ServiceControlError("control_not_configured");

    const { serviceName, timeoutMs } = server.control;

    if (action === "start") {
      const state = await this.getState(serviceName);
      if (state === "RUNNING") {
        await this.waitForGameRunning(server, timeoutMs);
        return this.result(server.key, action, true, state, "already_in_requested_state");
      }
      await this.assertGameStopped(server);
      await this.start(serviceName);
      const settled = await this.waitForState(serviceName, "RUNNING", timeoutMs);
      await this.waitForGameRunning(server, timeoutMs);
      return this.result(server.key, action, true, settled, "requested");
    }

    if (action === "stop") {
      const state = await this.getState(serviceName);
      if ((this.isPalworld(server) || server.key === "project-zomboid") && (await this.observe(server.processName, server.processCommandLineIncludes)).running) {
        await this.shutdownGame(server);
        await this.waitForGameStopped(server, timeoutMs);
        if ((await this.getState(serviceName)) !== "STOPPED") {
          await this.stop(serviceName);
          await this.waitForState(serviceName, "STOPPED", timeoutMs);
        }
        return this.result(server.key, action, true, "STOPPED", "requested");
      }
      if (state === "STOPPED") {
        await this.assertGameStopped(server);
        return this.result(server.key, action, true, state, "already_in_requested_state");
      }
      await this.stop(serviceName);
      const settled = await this.waitForState(serviceName, "STOPPED", timeoutMs);
      await this.waitForGameStopped(server, timeoutMs);
      return this.result(server.key, action, true, settled, "requested");
    }

    const state = await this.getState(serviceName);
    const process = await this.observe(server.processName, server.processCommandLineIncludes);
    if ((this.isPalworld(server) || server.key === "project-zomboid") && process.running) {
      await this.shutdownGame(server);
      await this.waitForGameStopped(server, timeoutMs);
    }
    if (state !== "STOPPED") {
      await this.stop(serviceName);
      await this.waitForState(serviceName, "STOPPED", timeoutMs);
      await this.waitForGameStopped(server, timeoutMs);
    } else {
      await this.assertGameStopped(server);
    }
    await this.start(serviceName);
    const settled = await this.waitForState(serviceName, "RUNNING", timeoutMs);
    await this.waitForGameRunning(server, timeoutMs);
    return this.result(server.key, action, true, settled, "requested");
  }

  private async getState(serviceName: string): Promise<ServiceState> {
    const result = await this.run(["query", serviceName]);
    if (result.exitCode !== 0) throw new ServiceControlError("service_unavailable");
    const state = parseServiceState(result.output);
    if (state === "UNKNOWN") throw new ServiceControlError("service_unavailable");
    return state;
  }

  private async start(serviceName: string): Promise<void> {
    const result = await this.run(["start", serviceName]);
    if (result.exitCode !== 0 && !result.output.includes("1056")) throw new ServiceControlError("service_start_failed");
  }

  private async stop(serviceName: string): Promise<void> {
    const result = await this.run(["stop", serviceName]);
    if (result.exitCode !== 0 && !result.output.includes("1062")) throw new ServiceControlError("service_stop_failed");
  }

  private async waitForState(serviceName: string, expected: "RUNNING" | "STOPPED", timeoutMs: number): Promise<ServiceState> {
    const deadline = Date.now() + timeoutMs;
    let state = await this.getState(serviceName);
    while (state !== expected && Date.now() < deadline) {
      await wait(1_000);
      state = await this.getState(serviceName);
    }
    if (state !== expected) throw new ServiceControlError("service_timeout");
    return state;
  }

  private async assertGameStopped(server: AgentServerConfiguration): Promise<void> {
    const process = await this.observe(server.processName, server.processCommandLineIncludes);
    if (process.running) throw new ServiceControlError("service_stop_incomplete");
  }

  private async waitForGameRunning(server: AgentServerConfiguration, timeoutMs: number): Promise<void> {
    const deadline = Date.now() + timeoutMs;
    while (!(await this.observe(server.processName, server.processCommandLineIncludes)).running) {
      if (await this.getState(server.control!.serviceName) === "STOPPED") throw new ServiceControlError("service_start_failed");
      if (Date.now() >= deadline) throw new ServiceControlError("service_timeout");
      await wait(1_000);
    }
  }

  private async waitForGameStopped(server: AgentServerConfiguration, timeoutMs: number): Promise<void> {
    const deadline = Date.now() + timeoutMs;
    while ((await this.observe(server.processName, server.processCommandLineIncludes)).running) {
      if (Date.now() >= deadline) throw new ServiceControlError("service_stop_incomplete");
      await wait(1_000);
    }
  }

  private isPalworld(server: AgentServerConfiguration): boolean {
    return server.query?.type === "palworld";
  }

  private async shutdownGame(server: AgentServerConfiguration): Promise<void> {
    if (server.key === "project-zomboid") await this.shutdownZomboid(server);
    else await this.shutdownPalworld(server);
  }

  private result(key: string, action: AgentServerAction, accepted: boolean, serviceState: ServiceState, detail: AgentServerActionResult["detail"]): AgentServerActionResult {
    return { key, action, accepted, executedAt: new Date().toISOString(), serviceState, detail };
  }
}

export class ServiceControlError extends Error {
  constructor(readonly code: AgentActionErrorCode) {
    super(code);
  }
}

async function requestPalworldShutdown(server: AgentServerConfiguration): Promise<void> {
  const query = server.query;
  const password = process.env.HABITAT_PALWORLD_ADMIN_PASSWORD?.trim();
  if (query?.type !== "palworld" || !query.port || !password) throw new ServiceControlError("palworld_shutdown_failed");

  try {
    const authorization = Buffer.from(`admin:${password}`).toString("base64");
    const response = await fetch(`http://${query.host}:${query.port}/v1/api/shutdown`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        Authorization: `Basic ${authorization}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ waittime: 15, message: "The Habitat is shutting down this world." }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) throw new Error(`Palworld shutdown returned ${response.status}`);
  } catch {
    throw new ServiceControlError("palworld_shutdown_failed");
  }
}

async function requestZomboidShutdown(server: AgentServerConfiguration): Promise<void> {
  if (server.key !== "project-zomboid" || server.control?.serviceName !== "HabitatGameProjectZomboid" || !server.executablePath) {
    throw new ServiceControlError("service_stop_failed");
  }
  await new Promise<void>((resolve, reject) => {
    const child = spawn(`${process.env.SystemRoot ?? "C:\\Windows"}\\System32\\WindowsPowerShell\\v1.0\\powershell.exe`, [
      "-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass", "-File",
      path.resolve(import.meta.dirname, "../scripts/stop-zomboid.ps1"), "-ExpectedExecutable", server.executablePath!,
    ], { windowsHide: true, stdio: "ignore" });
    const timer = setTimeout(() => { child.kill(); reject(new ServiceControlError("service_stop_failed")); }, 170_000);
    child.once("error", () => { clearTimeout(timer); reject(new ServiceControlError("service_stop_failed")); });
    child.once("close", (code) => { clearTimeout(timer); if (code === 0) resolve(); else reject(new ServiceControlError("service_stop_failed")); });
  });
}

export function parseServiceState(output: string): ServiceState {
  const match = /STATE\s*:\s*\d+\s+([A-Z_]+)/i.exec(output);
  if (!match) return "UNKNOWN";
  if (match[1] === "RUNNING") return "RUNNING";
  if (match[1] === "STOPPED") return "STOPPED";
  return "PENDING";
}

const scCommandTimeoutMs = 15_000;

async function runSc(argumentsList: string[]): Promise<CommandResult> {
  const executable = `${process.env.SystemRoot ?? "C:\\Windows"}\\System32\\sc.exe`;
  return new Promise((resolve, reject) => {
    const child = spawn(executable, argumentsList, { windowsHide: true, stdio: ["ignore", "pipe", "pipe"] });
    let output = "";
    const killTimer = setTimeout(() => {
      child.kill();
      reject(new ServiceControlError("service_timeout"));
    }, scCommandTimeoutMs);
    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", (chunk: string) => { output += chunk; });
    child.stderr.on("data", (chunk: string) => { output += chunk; });
    child.once("error", (error) => { clearTimeout(killTimer); reject(error); });
    child.once("close", (exitCode) => { clearTimeout(killTimer); resolve({ exitCode: exitCode ?? 1, output }); });
  });
}
