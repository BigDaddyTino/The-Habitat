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
