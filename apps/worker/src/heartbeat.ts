import os from "node:os";
import { randomUUID } from "node:crypto";
import { getPrismaClient } from "@habitat/db/client";
import type { HabitatService } from "@habitat/shared";

/**
 * A process proves it is alive by writing a beat on a fixed cadence. The row is
 * a single upsert per service rather than an append-only log: what matters is
 * freshness, and a table that grows every fifteen seconds would need pruning
 * before it earned its keep.
 *
 * The declared cadence travels with the beat so a reader judges staleness
 * against the writer's real interval. Changing HABITAT_WORKER_POLL_INTERVAL_MS
 * must not turn a healthy worker red on the next render.
 */

const startedAt = new Date();
const instanceId = randomUUID();

export type HeartbeatDetail = Record<string, string | number | boolean | null>;

export async function recordServiceHeartbeat(
  service: HabitatService,
  intervalMs: number,
  version: string,
  detail: HeartbeatDetail = {},
  now = new Date(),
): Promise<void> {
  const db = getPrismaClient();
  const row = {
    instanceId,
    hostname: os.hostname().slice(0, 120),
    version: version.slice(0, 40),
    startedAt,
    observedAt: now,
    // The CHECK constraint on this column rejects an implausible cadence, so it
    // is clamped here rather than left to throw and abort a monitoring cycle.
    intervalMs: Math.min(3_600_000, Math.max(1_000, Math.round(intervalMs))),
    detail: detail as object,
  };
  await db.serviceHeartbeat.upsert({ where: { service }, create: { service, ...row }, update: row });
}

/** Exposed so a log line and the stored beat cannot disagree about which process wrote them. */
export function heartbeatInstanceId(): string {
  return instanceId;
}

export function heartbeatStartedAt(): Date {
  return startedAt;
}
