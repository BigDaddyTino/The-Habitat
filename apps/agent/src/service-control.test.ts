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
