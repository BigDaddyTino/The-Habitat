import os from "node:os";
import { randomUUID } from "node:crypto";
import { getPrismaClient } from "@habitat/db/client";
import { webVersion } from "@/lib/web-version";

/**
 * The web app's Habitat Pulse heartbeat.
 *
 * The Next.js process cannot prove its own liveness through the request path —
 * a site nobody has visited for an hour is not a dead site — so it writes a
 * beat on a timer from the process bootstrap. The timer is unref'd so it can
 * never be the reason a shutdown hangs.
 */

const intervalMs = 60_000;
const instanceId = randomUUID();
const startedAt = new Date();

let timer: NodeJS.Timeout | null = null;

export function startWebHeartbeat(telemetryEnabled: boolean): void {
  if (timer) return;
  const write = async () => {
    const row = {
      instanceId,
      hostname: os.hostname().slice(0, 120),
      version: webVersion,
      startedAt,
      observedAt: new Date(),
      intervalMs,
      detail: { telemetry: telemetryEnabled, node: process.version } as object,
    };
    try {
      await getPrismaClient().serviceHeartbeat.upsert({ where: { service: "WEB" }, create: { service: "WEB", ...row }, update: row });
    } catch (error) {
      // A database that is down is already the worker's problem to report; the
      // web process must not crash trying to say so.
      console.error("[heartbeat] web heartbeat could not be recorded:", error instanceof Error ? error.message : String(error));
    }
  };
  void write();
  timer = setInterval(() => { void write(); }, intervalMs);
  timer.unref();
}
