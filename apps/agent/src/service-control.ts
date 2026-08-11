import { spawn } from "node:child_process";
import { setTimeout as wait } from "node:timers/promises";
import type { AgentServerAction, AgentServerActionResult } from "@habitat/shared";
import type { AgentServerConfiguration } from "./config.js";
import { observeProcess } from "./observations.js";

type ServiceState = "RUNNING" | "STOPPED" | "PENDING" | "UNKNOWN";

type CommandResult = { exitCode: number; output: string };

export class WindowsServiceController {
  constructor(
    private readonly run = runSc,
    private readonly observe = observeProcess,
  ) {}

  async perform(server: AgentServerConfiguration, action: AgentServerAction): Promise<AgentServerActionResult> {
    if (!server.control) throw new ServiceControlError("control_not_configured");

    const { serviceName, updateServiceName, timeoutMs } = server.control;
    if (action === "update") {
      const gameState = await this.getState(serviceName);
      if (gameState !== "STOPPED") {
        return this.result(server.key, action, false, gameState, "server_service_must_be_stopped");
      }
      await this.assertGameStopped(server);
      await this.start(updateServiceName);
      return this.result(server.key, action, true, "PENDING", "update_started");
    }

    if (action === "start") {
      const state = await this.getState(serviceName);
      if (state === "RUNNING") return this.result(server.key, action, true, state, "already_in_requested_state");
      await this.assertGameStopped(server);
      await this.start(serviceName);
      const settled = await this.waitForState(serviceName, "RUNNING", timeoutMs);
      return this.result(server.key, action, true, settled, "requested");
    }

    if (action === "stop") {
      const state = await this.getState(serviceName);
      if (state === "STOPPED") {
        await this.assertGameStopped(server);
        return this.result(server.key, action, true, state, "already_in_requested_state");
      }
      await this.stop(serviceName);
      const settled = await this.waitForState(serviceName, "STOPPED", timeoutMs);
      await this.assertGameStopped(server, true);
      return this.result(server.key, action, true, settled, "requested");
    }

    const state = await this.getState(serviceName);
    if (state !== "STOPPED") {
      await this.stop(serviceName);
      await this.waitForState(serviceName, "STOPPED", timeoutMs);
      await this.assertGameStopped(server, true);
    } else {
      await this.assertGameStopped(server);
    }
    await this.start(serviceName);
    const settled = await this.waitForState(serviceName, "RUNNING", timeoutMs);
    return this.result(server.key, action, true, settled, "requested");
  }

  private async getState(serviceName: string): Promise<ServiceState> {
    const result = await this.run(["query", serviceName]);
    if (result.exitCode !== 0) throw new ServiceControlError("service_unavailable");
    return parseServiceState(result.output);
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

  private async assertGameStopped(server: AgentServerConfiguration, waitForExit = false): Promise<void> {
    if (waitForExit) await wait(1_000);
    const process = await this.observe(server.processName, server.processCommandLineIncludes);
    if (process.running) throw new ServiceControlError("service_stop_incomplete");
  }

  private result(key: string, action: AgentServerAction, accepted: boolean, serviceState: ServiceState, detail: AgentServerActionResult["detail"]): AgentServerActionResult {
    return { key, action, accepted, executedAt: new Date().toISOString(), serviceState, detail };
  }
}

export class ServiceControlError extends Error {
  constructor(readonly code: "control_not_configured" | "service_unavailable" | "service_start_failed" | "service_stop_failed" | "service_stop_incomplete" | "service_timeout") {
    super(code);
  }
}

export function parseServiceState(output: string): ServiceState {
  const match = /STATE\s*:\s*\d+\s+([A-Z_]+)/i.exec(output);
  if (!match) return "UNKNOWN";
  if (match[1] === "RUNNING") return "RUNNING";
  if (match[1] === "STOPPED") return "STOPPED";
  return "PENDING";
}

async function runSc(argumentsList: string[]): Promise<CommandResult> {
  const executable = `${process.env.SystemRoot ?? "C:\\Windows"}\\System32\\sc.exe`;
  return new Promise((resolve, reject) => {
    const child = spawn(executable, argumentsList, { windowsHide: true, stdio: ["ignore", "pipe", "pipe"] });
    let output = "";
    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", (chunk: string) => { output += chunk; });
    child.stderr.on("data", (chunk: string) => { output += chunk; });
    child.once("error", reject);
    child.once("close", (exitCode) => resolve({ exitCode: exitCode ?? 1, output }));
  });
}
