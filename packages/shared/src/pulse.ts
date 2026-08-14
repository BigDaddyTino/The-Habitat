/**
 * Habitat Pulse — the vocabulary of operational observability.
 *
 * The worker evaluates these signals and persists the verdicts; the admin view
 * renders them. Both sides import the definitions from here so a signal cannot
 * be alerted on under one name and displayed under another.
 *
 * Two rules run through the whole module:
 *
 *  - UNKNOWN is not a failure. A signal nobody could evaluate (integration not
 *    configured, probe never run) is reported as unknown and is never alerted
 *    on, because paging someone about a check that did not run is noise.
 *  - Freshness is judged against the writer's own declared cadence, never a
 *    guessed constant, so changing a poll interval cannot silently turn every
 *    tile red.
 */

export const pulseStatuses = ["OK", "WARN", "CRITICAL", "UNKNOWN"] as const;
export type PulseStatus = typeof pulseStatuses[number];

export const pulseCategories = ["DELIVERY", "SERVICES", "COLLECTION", "DATA", "PROVIDERS", "PIPELINE"] as const;
export type PulseCategory = typeof pulseCategories[number];

export const habitatServices = ["WEB", "WORKER", "AGENT"] as const;
export type HabitatService = typeof habitatServices[number];

/** Ranked worst-first so the highest number is the most urgent real problem. */
const statusSeverity: Record<PulseStatus, number> = { OK: 0, UNKNOWN: 1, WARN: 2, CRITICAL: 3 };

export function isPulseStatus(value: unknown): value is PulseStatus {
  return typeof value === "string" && (pulseStatuses as readonly string[]).includes(value);
}

export function worseStatus(first: PulseStatus, second: PulseStatus): PulseStatus {
  return statusSeverity[second] > statusSeverity[first] ? second : first;
}

/** The single headline state for a set of signals. An empty set is unknown, not healthy. */
export function overallPulseStatus(statuses: readonly PulseStatus[]): PulseStatus {
  if (statuses.length === 0) return "UNKNOWN";
  return statuses.reduce<PulseStatus>((worst, status) => worseStatus(worst, status), "OK");
}

export function comparePulseSeverity(first: PulseStatus, second: PulseStatus): number {
  return statusSeverity[second] - statusSeverity[first];
}

/** Only a confirmed problem is worth waking someone for. */
export function isAlertable(status: PulseStatus): boolean {
  return status === "WARN" || status === "CRITICAL";
}

// ---------------------------------------------------------------------------
// Signal catalogue
// ---------------------------------------------------------------------------

export const pulseSignalKeys = [
  "tunnel.public-origin",
  "service.web",
  "service.worker",
  "service.agent",
  "collectors.game-sources",
  "backup.database",
  "ingestion.event-lag",
  "ingestion.event-volume",
  "provider.discord",
  "provider.twitch",
  "pipeline.achievement-evaluations",
  "pipeline.claim-reconciliation",
] as const;

export type PulseSignalKey = typeof pulseSignalKeys[number];

export type PulseSignalDefinition = {
  key: PulseSignalKey;
  category: PulseCategory;
  title: string;
  /** What the signal actually measures, in the operator's own terms. */
  description: string;
  /** What to do first when it goes red. Shown on the tile so a 3am reader is not left guessing. */
  remedy: string;
};

export const pulseSignalDefinitions: readonly PulseSignalDefinition[] = [
  {
    key: "tunnel.public-origin",
    category: "DELIVERY",
    title: "Cloudflare tunnel",
    description: "The public origin answered a probe made from outside the loopback interface, which is the only proof the tunnel is carrying traffic.",
    remedy: "Check the cloudflared service and the tunnel's route. A healthy web heartbeat with a failing probe means the site is up but unreachable.",
  },
  {
    key: "service.web",
    category: "SERVICES",
    title: "Web freshness",
    description: "The Next.js process has written a heartbeat within its declared cadence.",
    remedy: "Inspect web-logs and restart the HabitatWeb service.",
  },
  {
    key: "service.worker",
    category: "SERVICES",
    title: "Worker freshness",
    description: "The monitoring worker has completed a cycle within its declared cadence. Every other signal here is only as fresh as this one.",
    remedy: "Inspect worker-logs and restart the HabitatWorker service.",
  },
  {
    key: "service.agent",
    category: "SERVICES",
    title: "Agent freshness",
    description: "The read-only agent answered an authenticated health probe from the worker.",
    remedy: "Check the HabitatAgent service on the game host, then its bearer token and source-IP allow list.",
  },
  {
    key: "collectors.game-sources",
    category: "COLLECTION",
    title: "Collector health",
    description: "Every configured history source per world is readable, untruncated, and still parsing records. A readable source that yields nothing is treated as a failure, because that is what a silently broken parser looks like.",
    remedy: "Open the per-world breakdown below, then compare the failing source's real log format against its parser.",
  },
  {
    key: "backup.database",
    category: "DATA",
    title: "Database backup",
    description: "The most recent scripts/backup-habitat.ps1 run completed with a successful database step.",
    remedy: "Run the backup script by hand and check the scheduled task; the summary it writes is what this reads.",
  },
  {
    key: "ingestion.event-lag",
    category: "DATA",
    title: "Event ingestion lag",
    description: "How long ago the newest world event was recorded, and how far behind real time events are arriving.",
    remedy: "A quiet clubhouse is not lag. Confirm against collector health before treating this as an outage.",
  },
  {
    key: "ingestion.event-volume",
    category: "DATA",
    title: "Event volume",
    description: "Recent event volume against this installation's own trailing baseline. Flags both an implausible flood and a sudden silence.",
    remedy: "A flood usually means a parser is re-importing history; silence usually means a collector stopped.",
  },
  {
    key: "provider.discord",
    category: "PROVIDERS",
    title: "Discord",
    description: "The bot is configured and the notification queue is draining.",
    remedy: "Check the bot token, the guild configuration, and any notification stuck at its attempt ceiling.",
  },
  {
    key: "provider.twitch",
    category: "PROVIDERS",
    title: "Twitch",
    description: "The showcase's Helix polling is succeeding and staying inside its daily request budget.",
    remedy: "Check the client credentials and whether the daily budget has been exhausted.",
  },
  {
    key: "pipeline.achievement-evaluations",
    category: "PIPELINE",
    title: "Pipeline evaluations",
    description: "Import, activity, identity, and reward evaluations that threw and were recorded instead of silently aborting a cycle.",
    remedy: "Each failure names the stage and record that failed. Fix the rule or record; a successful replay resolves it automatically.",
  },
  {
    key: "pipeline.claim-reconciliation",
    category: "PIPELINE",
    title: "Claim reconciliation",
    description: "Identity reward reconciliation jobs queued when a claim was approved and not yet completed.",
    remedy: "A job retried past its attempt ceiling carries the last error. Resolve it, or the member never receives their backdated history.",
  },
];

const definitionsByKey = new Map<string, PulseSignalDefinition>(pulseSignalDefinitions.map((definition) => [definition.key, definition]));

export function pulseSignalDefinition(key: string): PulseSignalDefinition | null {
  return definitionsByKey.get(key) ?? null;
}

export const pulseCategoryLabels: Record<PulseCategory, string> = {
  DELIVERY: "Reaching the outside",
  SERVICES: "Processes",
  COLLECTION: "Collectors",
  DATA: "Data custody",
  PROVIDERS: "Third parties",
  PIPELINE: "Evaluation pipeline",
};

// ---------------------------------------------------------------------------
// Freshness
// ---------------------------------------------------------------------------

/**
 * A heartbeat is late once it has missed a couple of beats and stale once it
 * has missed several. The multipliers, not absolute times, are what make this
 * safe across a 15-second worker and a 60-second web process.
 */
export const heartbeatWarnIntervals = 3;
export const heartbeatCriticalIntervals = 8;
/** Floors, so a fast cadence cannot alert on ordinary scheduling jitter. */
export const heartbeatWarnFloorMs = 90_000;
export const heartbeatCriticalFloorMs = 5 * 60_000;

export type HeartbeatFreshness = {
  status: PulseStatus;
  ageMs: number;
  warnAfterMs: number;
  criticalAfterMs: number;
};

export function evaluateHeartbeatFreshness(observedAt: Date | null, intervalMs: number, now: Date): HeartbeatFreshness {
  const warnAfterMs = Math.max(intervalMs * heartbeatWarnIntervals, heartbeatWarnFloorMs);
  const criticalAfterMs = Math.max(intervalMs * heartbeatCriticalIntervals, heartbeatCriticalFloorMs);
  if (!observedAt) return { status: "UNKNOWN", ageMs: Number.POSITIVE_INFINITY, warnAfterMs, criticalAfterMs };
  // A beat from the future is a clock problem, not freshness; clamp rather than
  // report a negative age that would always read as healthy.
  const ageMs = Math.max(0, now.getTime() - observedAt.getTime());
  if (ageMs >= criticalAfterMs) return { status: "CRITICAL", ageMs, warnAfterMs, criticalAfterMs };
  if (ageMs >= warnAfterMs) return { status: "WARN", ageMs, warnAfterMs, criticalAfterMs };
  return { status: "OK", ageMs, warnAfterMs, criticalAfterMs };
}

// ---------------------------------------------------------------------------
// Thresholds shared by the evaluator and the view
// ---------------------------------------------------------------------------

export const pulseThresholds = {
  /** A backup older than this has missed its nightly window. */
  backupWarnHours: 30,
  backupCriticalHours: 72,
  /** Event ingestion. Quiet is normal at night, so these are generous. */
  ingestionWarnHours: 12,
  ingestionCriticalHours: 36,
  /** Arrival delay between a world event happening and being recorded. */
  ingestionDelayWarnMinutes: 45,
  ingestionDelayCriticalMinutes: 180,
  /** Volume anomaly, measured against the installation's own trailing hourly baseline. */
  volumeBaselineDays: 7,
  volumeMinimumBaselinePerHour: 5,
  volumeSpikeMultiplier: 6,
  volumeSilenceHours: 6,
  /** Reward pipeline. */
  evaluationFailureWarn: 1,
  evaluationFailureCritical: 10,
  evaluationFailureWindowHours: 24,
  /** A reconciliation job is stuck once it is older than this or has burnt this many attempts. */
  reconciliationStuckMinutes: 30,
  reconciliationStuckAttempts: 3,
  reconciliationCriticalCount: 5,
  /** Provider queues. */
  notificationDeadLetterAttempts: 8,
  providerBudgetWarnPercent: 90,
} as const;

export function formatPulseDuration(ms: number): string {
  if (!Number.isFinite(ms)) return "never";
  const seconds = Math.max(0, Math.round(ms / 1_000));
  if (seconds < 90) return `${seconds}s`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 90) return `${minutes}m`;
  const hours = Math.round(minutes / 60);
  if (hours < 48) return `${hours}h`;
  return `${Math.round(hours / 24)}d`;
}
