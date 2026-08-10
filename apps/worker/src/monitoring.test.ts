import assert from "node:assert/strict";
import test from "node:test";
import type { AgentServerStatus, ServerState } from "@habitat/shared";
import { runMonitoringCycle, type MonitoredServer, type MonitoringRepository } from "./monitoring.js";

const valheim: MonitoredServer = { id: "server-1", slug: "valheim", desiredState: "ONLINE", actualState: "UNKNOWN" };
const status: AgentServerStatus = {
  key: "valheim",
  observedAt: new Date().toISOString(),
  process: { running: true, processCount: 1, pid: 11, startedAt: new Date().toISOString(), uptimeSeconds: 10, memoryBytes: 1_024, cpuSeconds: 1 },
  disk: null,
  executable: null,
  query: null,
  log: null,
};

test("a successful agent poll persists only registered agent worlds", async () => {
  const saved: string[] = [];
  const repository = fakeRepository({
    findBySlug: async (slug) => slug === "valheim" ? valheim : null,
    saveObservation: async (server) => { saved.push(server.slug); },
  });
  const result = await runMonitoringCycle(repository, { pollStatuses: async () => [{ key: "valheim", status }, { key: "unknown-world", status: { ...status, key: "unknown-world" } }] });
  assert.deepEqual(result, { observed: 1, unknown: 0, ignored: 1, agentAvailable: true });
  assert.deepEqual(saved, ["valheim"]);
});

test("an unavailable agent marks only previously monitored worlds unknown", async () => {
  const unavailable: string[] = [];
  const repository = fakeRepository({
    findPreviouslyAgentMonitored: async () => [valheim],
    markAgentUnavailable: async (server) => { unavailable.push(server.slug); },
  });
  const result = await runMonitoringCycle(repository, { pollStatuses: async () => { throw new Error("agent unavailable"); } });
  assert.deepEqual(result, { observed: 0, unknown: 1, ignored: 0, agentAvailable: false });
  assert.deepEqual(unavailable, ["valheim"]);
});

function fakeRepository(overrides: Partial<MonitoringRepository>): MonitoringRepository {
  return {
    findBySlug: async () => null,
    findPreviouslyAgentMonitored: async () => [],
    saveObservation: async () => undefined,
    markAgentUnavailable: async () => undefined,
    ...overrides,
  };
}
