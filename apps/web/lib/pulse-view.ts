import {
  evaluateHeartbeatFreshness,
  formatPulseDuration,
  overallPulseStatus,
  pulseCategoryLabels,
  pulseSignalDefinition,
  pulseSignalDefinitions,
  worseStatus,
  type HabitatService,
  type PulseCategory,
  type PulseStatus,
} from "@habitat/shared";

/**
 * Assembles the Habitat Pulse view.
 *
 * The worker evaluates and persists every signal, but it obviously cannot
 * report its own death, and a page that simply rendered the last stored verdict
 * would show a wall of green minutes after the worker stopped. So:
 *
 *  - the three service tiles are recomputed here from the raw heartbeats,
 *    which is live truth the page can establish on its own; and
 *  - every worker-evaluated signal is marked stale, with its age, once the
 *    worker's own beat has gone quiet.
 *
 * Stale signals keep their last known status rather than being flattened to
 * unknown. A real outage recorded five minutes ago is still a real outage, and
 * hiding it behind "we are not sure" would be worse than dating it honestly.
 */

export type PulseSignalRow = {
  key: string;
  status: PulseStatus;
  summary: string;
  observedAt: Date;
  statusSince: Date;
  lastOkAt: Date | null;
  detail: unknown;
};

export type PulseHeartbeatRow = {
  service: HabitatService;
  hostname: string;
  version: string;
  startedAt: Date;
  observedAt: Date;
  intervalMs: number;
};

export type PulseTile = {
  key: string;
  category: PulseCategory;
  categoryLabel: string;
  title: string;
  description: string;
  remedy: string;
  status: PulseStatus;
  summary: string;
  observedAt: Date | null;
  statusSince: Date | null;
  lastOkAt: Date | null;
  /** True when the last evaluation is older than the worker's own cadence allows. */
  stale: boolean;
  ageLabel: string;
};

export type PulseView = {
  tiles: PulseTile[];
  overall: PulseStatus;
  /** Null when the worker has never reported at all. */
  workerObservedAt: Date | null;
  workerStale: boolean;
  evaluatedAt: Date | null;
};

const serviceByKey: Record<string, HabitatService> = {
  "service.web": "WEB",
  "service.worker": "WORKER",
};

export function buildPulseView(signals: readonly PulseSignalRow[], heartbeats: readonly PulseHeartbeatRow[], now: Date): PulseView {
  const worker = heartbeats.find((heartbeat) => heartbeat.service === "WORKER") ?? null;
  const workerFreshness = evaluateHeartbeatFreshness(worker?.observedAt ?? null, worker?.intervalMs ?? 60_000, now);
  const workerStale = workerFreshness.status !== "OK";
  const signalsByKey = new Map(signals.map((signal) => [signal.key, signal]));
  const evaluatedAt = signals.reduce<Date | null>((newest, signal) => (!newest || signal.observedAt > newest ? signal.observedAt : newest), null);

  const tiles = pulseSignalDefinitions.map((definition) => {
    const stored = signalsByKey.get(definition.key) ?? null;
    const service = serviceByKey[definition.key];
    // Web and worker liveness is re-derived from the beats themselves, so the
    // page never depends on the worker to report that the worker has stopped.
    const live = service ? liveServiceTile(service, heartbeats, now) : null;
    const status = live?.status ?? stored?.status ?? "UNKNOWN";
    const summary = live?.summary ?? stored?.summary ?? "This signal has not been evaluated yet.";
    const observedAt = live ? now : stored?.observedAt ?? null;
    const statusSince = live
      ? (stored?.status === live.status ? stored.statusSince : live.statusSince)
      : stored?.statusSince ?? null;
    const lastOkAt = live?.status === "OK" ? now : stored?.lastOkAt ?? null;
    const stale = !live && workerStale && stored !== null;
    return {
      key: definition.key,
      category: definition.category,
      categoryLabel: pulseCategoryLabels[definition.category],
      title: definition.title,
      description: definition.description,
      remedy: definition.remedy,
      status,
      summary,
      observedAt,
      statusSince,
      lastOkAt,
      stale,
      ageLabel: observedAt ? formatPulseDuration(Math.max(0, now.getTime() - observedAt.getTime())) : "never",
    } satisfies PulseTile;
  });

  return {
    tiles,
    overall: overallPulseStatus(tiles.map((tile) => tile.status)),
    workerObservedAt: worker?.observedAt ?? null,
    workerStale,
    evaluatedAt,
  };
}

function liveServiceTile(service: HabitatService, heartbeats: readonly PulseHeartbeatRow[], now: Date): { status: PulseStatus; summary: string; statusSince: Date | null } | null {
  const heartbeat = heartbeats.find((candidate) => candidate.service === service) ?? null;
  const freshness = evaluateHeartbeatFreshness(heartbeat?.observedAt ?? null, heartbeat?.intervalMs ?? 60_000, now);
  if (!heartbeat) return { status: "UNKNOWN", summary: "This process has never reported a heartbeat.", statusSince: null };
  const age = formatPulseDuration(freshness.ageMs);
  const thresholdMs = freshness.status === "CRITICAL"
    ? freshness.criticalAfterMs
    : freshness.status === "WARN" ? freshness.warnAfterMs : 0;
  const statusSince = new Date(Math.min(now.getTime(), heartbeat.observedAt.getTime() + thresholdMs));
  return {
    status: freshness.status,
    statusSince,
    summary: freshness.status === "OK"
      ? `Last beat ${age} ago on ${heartbeat.hostname}, up ${formatPulseDuration(Math.max(0, now.getTime() - heartbeat.startedAt.getTime()))}.`
      : `No beat for ${age}; the expected cadence is ${formatPulseDuration(heartbeat.intervalMs)}.`,
  };
}

/** Groups tiles for rendering while preserving the catalogue's deliberate order. */
export function groupPulseTiles(tiles: readonly PulseTile[]): Array<{ category: PulseCategory; label: string; status: PulseStatus; tiles: PulseTile[] }> {
  const groups = new Map<PulseCategory, PulseTile[]>();
  for (const tile of tiles) {
    const existing = groups.get(tile.category);
    if (existing) existing.push(tile);
    else groups.set(tile.category, [tile]);
  }
  return [...groups.entries()].map(([category, categoryTiles]) => ({
    category,
    label: pulseCategoryLabels[category],
    status: categoryTiles.reduce<PulseStatus>((worst, tile) => worseStatus(worst, tile.status), "OK"),
    tiles: categoryTiles,
  }));
}

export function pulseSignalTitle(key: string): string {
  return pulseSignalDefinition(key)?.title ?? key;
}
