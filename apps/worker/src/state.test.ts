import assert from "node:assert/strict";
import test from "node:test";
import type { AgentServerStatus } from "@habitat/shared";
import { resolveDesiredState } from "./monitoring.js";
import { normalizeServerState } from "./state.js";

const status = (running: boolean, query: AgentServerStatus["query"] = null): AgentServerStatus => ({
  key: "valheim",
  observedAt: new Date().toISOString(),
  process: { running, processCount: running ? 1 : 0, pid: running ? 1 : null, startedAt: null, uptimeSeconds: null, memoryBytes: null, cpuSeconds: null },
  disk: null,
  executable: null,
  query,
});

test("intentional sleep is distinct from an unexpected down process", () => {
  assert.deepEqual(normalizeServerState("SLEEPING", status(false)), { state: "SLEEPING", reason: "intentionally_sleeping" });
  assert.deepEqual(normalizeServerState("ONLINE", status(false)), { state: "DOWN_UNEXPECTEDLY", reason: "required_process_missing" });
});

test("a running process with a failed supported query is degraded", () => {
  assert.deepEqual(normalizeServerState("ONLINE", status(true, { attempted: true, reachable: false, pingMs: null, playerCount: null, maxPlayers: null, version: null })), { state: "DEGRADED", reason: "process_running_query_unreachable" });
  assert.deepEqual(normalizeServerState("ONLINE", status(true)), { state: "ONLINE", reason: "process_running" });
});

test("a verified running process automatically becomes expected online", () => {
  assert.equal(resolveDesiredState("SLEEPING", status(true)), "ONLINE");
  assert.equal(resolveDesiredState("UPDATING", status(true)), "UPDATING");
  assert.equal(resolveDesiredState("SLEEPING", status(false)), "SLEEPING");
});
