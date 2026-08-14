import assert from "node:assert/strict";
import test from "node:test";
import { buildPulseView, groupPulseTiles, type PulseHeartbeatRow, type PulseSignalRow } from "./pulse-view.js";

const now = new Date("2026-08-13T20:00:00.000Z");

function signal(key: string, overrides: Partial<PulseSignalRow> = {}): PulseSignalRow {
  return {
    key,
    status: "OK",
    summary: "Healthy.",
    observedAt: new Date(now.getTime() - 30_000),
    statusSince: new Date(now.getTime() - 3_600_000),
    lastOkAt: new Date(now.getTime() - 30_000),
    detail: {},
    ...overrides,
  };
}

function heartbeat(service: PulseHeartbeatRow["service"], ageMs: number, intervalMs = 15_000): PulseHeartbeatRow {
  return {
    service,
    hostname: "portal",
    version: "0.1.0",
    startedAt: new Date(now.getTime() - 86_400_000),
    observedAt: new Date(now.getTime() - ageMs),
    intervalMs,
  };
}

test("every catalogued signal gets a tile, even one the worker has never evaluated", () => {
  const view = buildPulseView([], [], now);
  assert.ok(view.tiles.length >= 12);
  assert.ok(view.tiles.every((tile) => tile.status === "UNKNOWN"));
  assert.equal(view.overall, "UNKNOWN");
  assert.equal(view.evaluatedAt, null);
});

test("worker liveness is recomputed from the heartbeat, so a dead worker cannot report itself healthy", () => {
  // The stored verdict is the last thing the worker managed to write: all green.
  const stored = [signal("service.worker"), signal("service.web"), signal("backup.database")];
  const view = buildPulseView(stored, [heartbeat("WORKER", 60 * 60_000), heartbeat("WEB", 10_000, 60_000)], now);

  const worker = view.tiles.find((tile) => tile.key === "service.worker");
  assert.equal(worker?.status, "CRITICAL");
  assert.equal(worker?.statusSince?.toISOString(), new Date(now.getTime() - 55 * 60_000).toISOString());
  assert.equal(view.workerStale, true);
  assert.equal(view.overall, "CRITICAL");
});

test("a stale verdict keeps its last known status and is dated rather than flattened to unknown", () => {
  const stored = [signal("backup.database", { status: "CRITICAL", summary: "No backup for four days." })];
  const view = buildPulseView(stored, [heartbeat("WORKER", 60 * 60_000)], now);

  const backup = view.tiles.find((tile) => tile.key === "backup.database");
  assert.equal(backup?.status, "CRITICAL");
  assert.equal(backup?.stale, true);
  assert.equal(backup?.summary, "No backup for four days.");
});

test("a fresh worker leaves stored verdicts unmarked", () => {
  const view = buildPulseView([signal("backup.database")], [heartbeat("WORKER", 10_000)], now);
  assert.equal(view.workerStale, false);
  assert.equal(view.tiles.find((tile) => tile.key === "backup.database")?.stale, false);
});

test("the agent tile comes from the stored verdict, because the web app holds no agent credentials", () => {
  const view = buildPulseView([signal("service.agent", { status: "CRITICAL", summary: "The agent health probe failed." })], [heartbeat("WORKER", 10_000)], now);
  const agent = view.tiles.find((tile) => tile.key === "service.agent");
  assert.equal(agent?.status, "CRITICAL");
  assert.equal(agent?.stale, false);
});

test("groups keep the catalogue order and carry the worst status in each", () => {
  const view = buildPulseView([signal("backup.database", { status: "WARN" }), signal("ingestion.event-lag")], [heartbeat("WORKER", 10_000)], now);
  const groups = groupPulseTiles(view.tiles);
  assert.equal(groups[0].category, "DELIVERY");
  const data = groups.find((group) => group.category === "DATA");
  assert.equal(data?.status, "WARN");
});
