import assert from "node:assert/strict";
import test from "node:test";
import { pulseThresholds } from "@habitat/shared";
import {
  evaluateAchievementFailures,
  evaluateAgent,
  evaluateBackup,
  evaluateClaimReconciliation,
  evaluateCollectorSource,
  evaluateCollectors,
  evaluateDiscordProvider,
  evaluateEventVolume,
  evaluateHeartbeat,
  evaluateIngestionLag,
  evaluateTunnel,
  evaluateTwitchProvider,
  pulseAlertTransition,
  type CollectorFact,
} from "./pulse-signals.js";

const now = new Date("2026-08-13T20:00:00.000Z");

function collector(overrides: Partial<CollectorFact> = {}): CollectorFact {
  return {
    world: "valheim",
    sourceKind: "VALHEIM_LOG",
    reported: true,
    available: true,
    truncated: false,
    recordsLastScan: 12,
    lastScanAt: new Date(now.getTime() - 60_000),
    lastYieldAt: new Date(now.getTime() - 60_000),
    lastError: null,
    ...overrides,
  };
}

test("an unconfigured or unprobeable signal is unknown, never healthy and never an outage", () => {
  assert.equal(evaluateTunnel({ configured: false }).status, "UNKNOWN");
  assert.equal(evaluateBackup({ configured: false }, now).status, "UNKNOWN");
  assert.equal(evaluateTwitchProvider({ configured: false, reason: "off" }).status, "UNKNOWN");
  assert.equal(evaluateDiscordProvider({ configured: false }).status, "UNKNOWN");
  assert.equal(evaluateAgent({ probed: false, reason: "no configuration" }).status, "UNKNOWN");
  assert.equal(evaluateHeartbeat({ service: "WEB", observedAt: null, intervalMs: 60_000, hostname: null, version: null, startedAt: null }, now).status, "UNKNOWN");
});

test("unknown never alerts and never masquerades as a recovery", () => {
  assert.equal(pulseAlertTransition("CRITICAL", null), "ALERT");
  assert.equal(pulseAlertTransition("WARN", "CRITICAL"), "ALERT");
  assert.equal(pulseAlertTransition("OK", "CRITICAL"), "RECOVERY");
  assert.equal(pulseAlertTransition("UNKNOWN", "CRITICAL"), null);
  assert.equal(pulseAlertTransition("UNKNOWN", null), null);
});

test("a tunnel that answers something other than this web app is a failure, not a success", () => {
  const reachable = evaluateTunnel({ configured: true, origin: "https://habitat.example", reachable: true, httpStatus: 200, latencyMs: 42, failure: null });
  assert.equal(reachable.status, "OK");

  const hijacked = evaluateTunnel({ configured: true, origin: "https://habitat.example", reachable: false, httpStatus: 200, latencyMs: 42, failure: "the origin answered but is not this Habitat web app" });
  assert.equal(hijacked.status, "CRITICAL");
});

test("heartbeat freshness is judged against the writer's own cadence, not a fixed constant", () => {
  const slow = { service: "WEB" as const, observedAt: new Date(now.getTime() - 4 * 60_000), intervalMs: 5 * 60_000, hostname: "portal", version: "0.1.0", startedAt: new Date(now.getTime() - 3_600_000) };
  // Four minutes stale is healthy for a five-minute cadence…
  assert.equal(evaluateHeartbeat(slow, now).status, "OK");
  // …and unhealthy for a fifteen-second one.
  assert.equal(evaluateHeartbeat({ ...slow, intervalMs: 15_000 }, now).status, "WARN");
});

test("a heartbeat stamped in the future is clamped rather than read as perfectly fresh", () => {
  const verdict = evaluateHeartbeat({ service: "WORKER", observedAt: new Date(now.getTime() + 600_000), intervalMs: 15_000, hostname: "worker", version: "0.1.0", startedAt: now }, now);
  assert.equal(verdict.status, "OK");
  assert.equal(verdict.detail.ageMs, 0);
});

test("a readable collector source that parses nothing is critical, because that is what a broken parser looks like", () => {
  assert.equal(evaluateCollectorSource(collector(), now, 3_600_000).status, "OK");
  assert.equal(evaluateCollectorSource(collector({ recordsLastScan: 0 }), now, 3_600_000).status, "CRITICAL");
  assert.equal(evaluateCollectorSource(collector({ available: false, recordsLastScan: 0 }), now, 3_600_000).status, "CRITICAL");
  assert.equal(evaluateCollectorSource(collector({ truncated: true }), now, 3_600_000).status, "WARN");
  assert.equal(evaluateCollectorSource(collector({ lastError: "one record was skipped" }), now, 3_600_000).status, "WARN");
});

test("collector health takes the worst source and names the failures", () => {
  const verdict = evaluateCollectors([
    collector(),
    collector({ world: "dragonwilds", sourceKind: "DRAGONWILDS_LOG", recordsLastScan: 0 }),
  ], now, 3_600_000);
  assert.equal(verdict.status, "CRITICAL");
  assert.match(verdict.summary, /dragonwilds\/DRAGONWILDS_LOG/);
  assert.equal(evaluateCollectors([], now, 3_600_000).status, "UNKNOWN");
});

test("an explicitly unreported collector fact is unknown rather than green", () => {
  const missing = collector({ world: "new-world", sourceKind: "NO_SOURCE_REPORTED", reported: false, available: false, recordsLastScan: 0, lastScanAt: null });
  const verdict = evaluateCollectors([collector(), missing], now, 3_600_000);
  assert.equal(verdict.status, "UNKNOWN");
  assert.match(verdict.summary, /new-world\/NO_SOURCE_REPORTED/);
});

test("a backup that ran recently but did not capture the database is not a success", () => {
  const base = { configured: true as const, readable: true as const, result: "succeeded", databaseDetail: "18.4 MB", failures: [] as string[] };
  assert.equal(evaluateBackup({ ...base, completedAt: new Date(now.getTime() - 3_600_000), databaseOk: true }, now).status, "OK");
  assert.equal(evaluateBackup({ ...base, completedAt: new Date(now.getTime() - 3_600_000), databaseOk: false, result: "failed", failures: ["database: container is not running"] }, now).status, "CRITICAL");
});

test("backup age escalates from late to critical", () => {
  const base = { configured: true as const, readable: true as const, result: "succeeded", databaseOk: true, databaseDetail: null, failures: [] as string[] };
  const hours = (count: number) => new Date(now.getTime() - count * 3_600_000);
  assert.equal(evaluateBackup({ ...base, completedAt: hours(12) }, now).status, "OK");
  assert.equal(evaluateBackup({ ...base, completedAt: hours(pulseThresholds.backupWarnHours + 1) }, now).status, "WARN");
  assert.equal(evaluateBackup({ ...base, completedAt: hours(pulseThresholds.backupCriticalHours + 1) }, now).status, "CRITICAL");
});

test("ingestion lag reports both staleness and arrival delay", () => {
  const fresh = evaluateIngestionLag({ newestReceivedAt: new Date(now.getTime() - 300_000), medianDelayMs: 4_000, sampleSize: 200 }, now);
  assert.equal(fresh.status, "OK");

  // Events are still arriving, but hours after they happened.
  const delayed = evaluateIngestionLag({ newestReceivedAt: new Date(now.getTime() - 60_000), medianDelayMs: 4 * 3_600_000, sampleSize: 200 }, now);
  assert.equal(delayed.status, "CRITICAL");
});

test("event volume is judged only against the installation's own baseline", () => {
  const baselineHours = 167;
  // A quiet clubhouse has no baseline worth comparing against, so nothing is called abnormal.
  assert.equal(evaluateEventVolume({ lastHour: 0, baselineTotal: 30, baselineHours, hoursSinceLastEvent: 20 }).status, "UNKNOWN");

  const busy = { baselineTotal: 20 * baselineHours, baselineHours };
  assert.equal(evaluateEventVolume({ ...busy, lastHour: 22, hoursSinceLastEvent: 0.1 }).status, "OK");
  assert.equal(evaluateEventVolume({ ...busy, lastHour: 400, hoursSinceLastEvent: 0.1 }).status, "WARN");
  assert.equal(evaluateEventVolume({ ...busy, lastHour: 0, hoursSinceLastEvent: 9 }).status, "WARN");
});

test("a notification that exhausted every delivery attempt is critical, and a merely queued one is not", () => {
  const base = { configured: true as const, gateway: { ready: true, guilds: 1 }, connecting: false, deadLettered: 0, queued: 0, oldestQueuedMs: null, lastSentAt: now };
  assert.equal(evaluateDiscordProvider({ ...base }).status, "OK");
  assert.equal(evaluateDiscordProvider({ ...base, deadLettered: 2 }).status, "CRITICAL");
  assert.equal(evaluateDiscordProvider({ ...base, gateway: { ready: false, guilds: 1 } }).status, "WARN");
  assert.equal(evaluateDiscordProvider({ ...base, queued: 3, oldestQueuedMs: 60 * 60_000 }).status, "WARN");
});

test("a bot still connecting after a restart is unknown, not a fault, but a real delivery failure still lands", () => {
  const connecting = { configured: true as const, gateway: null, connecting: true, deadLettered: 0, queued: 2, oldestQueuedMs: 5_000, lastSentAt: now };
  assert.equal(evaluateDiscordProvider(connecting).status, "UNKNOWN");
  // Startup must not mask a queue that has already given up.
  assert.equal(evaluateDiscordProvider({ ...connecting, deadLettered: 1 }).status, "CRITICAL");
  // Once startup has settled with no bot, that is a genuine warning.
  assert.equal(evaluateDiscordProvider({ ...connecting, connecting: false }).status, "WARN");
});

test("an exhausted Twitch budget is critical because live status silently freezes", () => {
  const base = { configured: true as const, channels: 4, failing: 0, lastSyncedAt: now, pollIntervalMs: 2 * 60_000, dailyBudget: 5_000 };
  assert.equal(evaluateTwitchProvider({ ...base, requestsToday: 100 }, now).status, "OK");
  assert.equal(evaluateTwitchProvider({ ...base, requestsToday: 4_800 }, now).status, "WARN");
  assert.equal(evaluateTwitchProvider({ ...base, requestsToday: 5_000 }, now).status, "CRITICAL");
  assert.equal(evaluateTwitchProvider({ ...base, requestsToday: 10, failing: 4 }, now).status, "CRITICAL");
});

test("Twitch freshness cannot stay green after polling stops", () => {
  const base = { configured: true as const, channels: 2, failing: 0, pollIntervalMs: 2 * 60_000, requestsToday: 100, dailyBudget: 5_000 };
  assert.equal(evaluateTwitchProvider({ ...base, lastSyncedAt: null }, now).status, "WARN");
  assert.equal(evaluateTwitchProvider({ ...base, lastSyncedAt: new Date(now.getTime() - 15 * 60_000) }, now).status, "WARN");
  assert.equal(evaluateTwitchProvider({ ...base, lastSyncedAt: new Date(now.getTime() - 2 * 60 * 60_000) }, now).status, "CRITICAL");
});

test("evaluation failures outside the window are reported without raising an alarm", () => {
  const older = evaluateAchievementFailures({ unresolvedInWindow: 0, unresolvedTotal: 3, newest: null });
  assert.equal(older.status, "OK");
  assert.match(older.summary, /3 older/);
  assert.equal(evaluateAchievementFailures({ unresolvedInWindow: 1, unresolvedTotal: 1, newest: null }).status, "WARN");
  assert.equal(evaluateAchievementFailures({ unresolvedInWindow: pulseThresholds.evaluationFailureCritical, unresolvedTotal: 40, newest: null }).status, "CRITICAL");
});

test("a reconciliation past its retry ceiling is critical even when only one job is stuck", () => {
  assert.equal(evaluateClaimReconciliation({ stuck: 0, oldestQueuedMs: null, exhausted: 0, pendingClaims: 2, lastError: null }).status, "OK");
  assert.equal(evaluateClaimReconciliation({ stuck: 1, oldestQueuedMs: 45 * 60_000, exhausted: 0, pendingClaims: 0, lastError: null }).status, "WARN");
  assert.equal(evaluateClaimReconciliation({ stuck: 1, oldestQueuedMs: 45 * 60_000, exhausted: 1, pendingClaims: 0, lastError: "identity_not_verified" }).status, "CRITICAL");
});
