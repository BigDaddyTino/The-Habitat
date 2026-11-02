import assert from "node:assert/strict";
import test from "node:test";
import { ServiceControlError, WindowsServiceController, parseServiceState } from "./service-control.js";

test("parses only Windows service states from sc output", () => {
  assert.equal(parseServiceState("STATE              : 4  RUNNING"), "RUNNING");
  assert.equal(parseServiceState("STATE              : 1  STOPPED"), "STOPPED");
  assert.equal(parseServiceState("STATE              : 2  START_PENDING"), "PENDING");
  assert.equal(parseServiceState("anything else"), "UNKNOWN");
});

test("does not claim an already stopped service stopped while its game process remains", async () => {
  const controller = new WindowsServiceController(
    async () => ({ exitCode: 0, output: "STATE              : 1  STOPPED" }),
    async () => ({ running: true, processCount: 1, pid: 1234, startedAt: null, uptimeSeconds: null, memoryBytes: null, cpuSeconds: null }),
  );

  await assert.rejects(
    controller.perform({
      key: "palworld",
      displayName: "Palworld",
      processName: "PalServer-Win64-Shipping-Cmd.exe",
      control: { serviceName: "HabitatGamePalworld", updateServiceName: "HabitatUpdatePalworld", timeoutMs: 120_000 },
    }, "stop"),
    (error: unknown) => error instanceof ServiceControlError && error.code === "service_stop_incomplete",
  );
});

test("uses Palworld's configured local shutdown API before accepting a stopped wrapper", async () => {
  let observations = 0;
  let shutdowns = 0;
  const controller = new WindowsServiceController(
    async () => ({ exitCode: 0, output: "STATE              : 1  STOPPED" }),
    async () => ({ running: observations++ === 0, processCount: 1, pid: 1234, startedAt: null, uptimeSeconds: null, memoryBytes: null, cpuSeconds: null }),
    async () => { shutdowns += 1; },
  );

  const result = await controller.perform({
    key: "palworld",
    displayName: "Palworld",
    processName: "PalServer-Win64-Shipping-Cmd.exe",
    query: { type: "palworld", host: "127.0.0.1", port: 8212, timeoutMs: 3_000, playerCountSupported: true, passwordEnv: "HABITAT_PALWORLD_ADMIN_PASSWORD" },
    control: { serviceName: "HabitatGamePalworld", updateServiceName: "HabitatUpdatePalworld", timeoutMs: 120_000 },
  }, "stop");

  assert.equal(shutdowns, 1);
  assert.equal(result.accepted, true);
  assert.equal(result.serviceState, "STOPPED");
});

for (const action of ["stop", "restart"] as const) {
  test(`Zomboid ${action} saves through its console before stopping the wrapper`, async () => {
    let running = true;
    let wrapperRunning = true;
    const events: string[] = [];
    const controller = new WindowsServiceController(async (args) => {
      if (args[0] === "query") return { exitCode: 0, output: args[1].includes("Update") || !wrapperRunning ? "STATE : 1 STOPPED" : "STATE : 4 RUNNING" };
      events.push(args[0]!);
      if (args[0] === "stop") wrapperRunning = false;
      if (args[0] === "start") { running = true; wrapperRunning = true; }
      return { exitCode: 0, output: "" };
    }, async () => ({ running, processCount: running ? 1 : 0, pid: running ? 123 : null, startedAt: null, uptimeSeconds: null, memoryBytes: null, cpuSeconds: null }), undefined, undefined, undefined,
    async () => { events.push("graceful-stop"); running = false; });
    const result = await controller.perform({ key: "project-zomboid", displayName: "Project Zomboid", processName: "java.exe", control: { serviceName: "HabitatGameProjectZomboid", updateServiceName: "HabitatUpdateProjectZomboid", timeoutMs: 100 } }, action);
    assert.equal(result.accepted, true);
    assert.deepEqual(events, action === "stop" ? ["graceful-stop", "stop"] : ["graceful-stop", "stop", "start"]);
  });
}

test("failed Zomboid graceful shutdown never falls through to a forced wrapper stop", async () => {
  const mutations: string[] = [];
  const controller = new WindowsServiceController(async (args) => {
    if (args[0] !== "query") mutations.push(args[0]!);
    return { exitCode: 0, output: args[1].includes("Update") ? "STATE : 1 STOPPED" : "STATE : 4 RUNNING" };
  }, async () => ({ running: true, processCount: 1, pid: 123, startedAt: null, uptimeSeconds: null, memoryBytes: null, cpuSeconds: null }), undefined, undefined, undefined,
  async () => { throw new ServiceControlError("service_stop_failed"); });
  await assert.rejects(controller.perform({ key: "project-zomboid", displayName: "Project Zomboid", processName: "java.exe", control: { serviceName: "HabitatGameProjectZomboid", updateServiceName: "HabitatUpdateProjectZomboid", timeoutMs: 100 } }, "stop"));
  assert.deepEqual(mutations, []);
});

const updateServer = {
  key: "valheim", displayName: "Valheim", processName: "valheim_server",
  control: { serviceName: "HabitatGameValheim", updateServiceName: "HabitatUpdateValheim", timeoutMs: 100, updateStatusPath: "C:\\private\\status.json" },
};
const operation = { operationId: "89f7138a-10ad-48fd-9d76-55729ba00123", phase: "QUEUED" as const, startedAt: new Date().toISOString(), updatedAt: new Date().toISOString(), errorCode: null };

test("update delegates stop/update/start to the durable updater even when the game is running", async () => {
  const calls: string[][] = [];
  const controller = new WindowsServiceController(async (args) => { calls.push(args); return { exitCode: 0, output: "STATE : 1 STOPPED" }; }, undefined, undefined, async () => operation);
  const result = await controller.perform(updateServer, "update");
  assert.equal(result.operationId, operation.operationId);
  assert.equal(result.detail, "update_started");
  assert.equal(result.serviceState, "PENDING");
  assert.deepEqual(calls, [["query", "HabitatUpdateValheim"], ["start", "HabitatUpdateValheim"]]);
});

for (const action of ["start", "stop", "restart", "update"] as const) {
  test(`${action} refuses to overlap an active update`, async () => {
    const calls: string[][] = [];
    const controller = new WindowsServiceController(async (args) => { calls.push(args); return { exitCode: 0, output: "STATE : 4 RUNNING" }; });
    const result = await controller.perform(updateServer, action);
    assert.equal(result.accepted, false);
    assert.equal(result.detail, "operation_in_progress");
    assert.deepEqual(calls, [["query", "HabitatUpdateValheim"]]);
  });
}

test("an interrupted updater is reported as failed rather than left updating forever", async () => {
  const old = { ...operation, startedAt: new Date(Date.now() - 60_000).toISOString(), phase: "UPDATING" as const };
  const controller = new WindowsServiceController(async () => ({ exitCode: 0, output: "STATE : 1 STOPPED" }), undefined, undefined, undefined, async () => old);
  const status = await controller.updateStatus(updateServer);
  assert.equal(status.phase, "FAILED");
  assert.equal(status.errorCode, "update_interrupted");
});

test("start does not succeed just because the service wrapper briefly ran", async () => {
  let gameQueries = 0;
  const controller = new WindowsServiceController(async (args) => ({ exitCode: 0, output: args[1] === "HabitatGameValheim" && gameQueries++ === 0 ? "STATE : 4 RUNNING" : "STATE : 1 STOPPED" }), async () => ({ running: false, processCount: 0, pid: null, startedAt: null, uptimeSeconds: null, memoryBytes: null, cpuSeconds: null }));
  await assert.rejects(controller.perform(updateServer, "start"), (error: unknown) => error instanceof ServiceControlError && error.code === "service_start_failed");
});
