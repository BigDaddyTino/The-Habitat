import {
  evaluateHeartbeatFreshness,
  formatPulseDuration,
  pulseThresholds,
  worseStatus,
  type HabitatService,
  type PulseSignalKey,
  type PulseStatus,
} from "@habitat/shared";

/**
 * Pure Habitat Pulse verdicts.
 *
 * Every function here takes plain facts and returns a status, a one-line
 * summary an administrator can act on, and structured detail. Nothing in this
 * module touches the database, the network, or the clock — which is what makes
 * the thresholds testable and keeps `pulse.ts` a thin gatherer.
 */

export type PulseVerdict = {
  key: PulseSignalKey;
  status: PulseStatus;
  summary: string;
  detail: Record<string, unknown>;
};

export type PulseAlertTransition = "ALERT" | "RECOVERY" | null;

/**
 * UNKNOWN is deliberately absent from both branches. Losing the ability to
 * evaluate a failing check is not a recovery, and must never produce a green
 * Discord message.
 */
export function pulseAlertTransition(status: PulseStatus, notifiedStatus: PulseStatus | null): PulseAlertTransition {
  if ((status === "WARN" || status === "CRITICAL") && notifiedStatus !== status) return "ALERT";
  if (status === "OK" && notifiedStatus !== null && (notifiedStatus === "WARN" || notifiedStatus === "CRITICAL")) return "RECOVERY";
  return null;
}

// ---------------------------------------------------------------------------
// Reaching the outside
// ---------------------------------------------------------------------------

export type TunnelFact =
  | { configured: false }
  | { configured: true; origin: string; reachable: boolean; httpStatus: number | null; latencyMs: number | null; failure: string | null };

export function evaluateTunnel(fact: TunnelFact): PulseVerdict {
  if (!fact.configured) {
    return { key: "tunnel.public-origin", status: "UNKNOWN", summary: "No public origin is configured, so the tunnel cannot be probed.", detail: { configured: false } };
  }
  if (fact.reachable) {
    return {
      key: "tunnel.public-origin",
      status: "OK",
      summary: `${fact.origin} answered in ${fact.latencyMs ?? 0} ms.`,
      detail: { origin: fact.origin, httpStatus: fact.httpStatus, latencyMs: fact.latencyMs },
    };
  }
  return {
    key: "tunnel.public-origin",
    status: "CRITICAL",
    summary: fact.httpStatus === null
      ? `${fact.origin} did not answer: ${fact.failure ?? "the probe failed"}.`
      : `${fact.origin} answered HTTP ${fact.httpStatus}.`,
    detail: { origin: fact.origin, httpStatus: fact.httpStatus, failure: fact.failure },
  };
}

// ---------------------------------------------------------------------------
// Processes
// ---------------------------------------------------------------------------

export type HeartbeatFact = {
  service: HabitatService;
  observedAt: Date | null;
  intervalMs: number;
  hostname: string | null;
  version: string | null;
  startedAt: Date | null;
};

const serviceSignalKeys: Record<HabitatService, PulseSignalKey> = {
  WEB: "service.web",
  WORKER: "service.worker",
  AGENT: "service.agent",
};

export function evaluateHeartbeat(fact: HeartbeatFact, now: Date): PulseVerdict {
  const freshness = evaluateHeartbeatFreshness(fact.observedAt, fact.intervalMs, now);
  const key = serviceSignalKeys[fact.service];
  if (freshness.status === "UNKNOWN") {
    return { key, status: "UNKNOWN", summary: "This process has never reported a heartbeat.", detail: { service: fact.service } };
  }
  const age = formatPulseDuration(freshness.ageMs);
  const summary = freshness.status === "OK"
    ? `Last beat ${age} ago on ${fact.hostname ?? "an unnamed host"}.`
    : `No beat for ${age}; the expected cadence is ${formatPulseDuration(fact.intervalMs)}.`;
  return {
    key,
    status: freshness.status,
    summary,
    detail: {
      service: fact.service,
      hostname: fact.hostname,
      version: fact.version,
      ageMs: freshness.ageMs,
      intervalMs: fact.intervalMs,
      uptimeMs: fact.startedAt ? Math.max(0, now.getTime() - fact.startedAt.getTime()) : null,
    },
  };
}

export type AgentProbeFact =
  | { probed: false; reason: string }
  | { probed: true; healthy: true; hostname: string; version: string; uptimeSeconds: number }
  | { probed: true; healthy: false; reason: string };

export function evaluateAgent(fact: AgentProbeFact): PulseVerdict {
  if (!fact.probed) return { key: "service.agent", status: "UNKNOWN", summary: `The agent could not be probed: ${fact.reason}.`, detail: { reason: fact.reason } };
  if (!fact.healthy) return { key: "service.agent", status: "CRITICAL", summary: `The agent health probe failed (${fact.reason}).`, detail: { reason: fact.reason } };
  return {
    key: "service.agent",
    status: "OK",
    summary: `Agent ${fact.version} answered from ${fact.hostname}, host up ${formatPulseDuration(fact.uptimeSeconds * 1_000)}.`,
    detail: { hostname: fact.hostname, version: fact.version, uptimeSeconds: fact.uptimeSeconds },
  };
}

// ---------------------------------------------------------------------------
// Collectors
// ---------------------------------------------------------------------------

export type CollectorFact = {
  world: string;
  sourceKind: string;
  reported: boolean;
  available: boolean;
  truncated: boolean;
  recordsLastScan: number;
  lastScanAt: Date | null;
  lastYieldAt: Date | null;
  lastError: string | null;
};

export type CollectorSourceVerdict = {
  world: string;
  sourceKind: string;
  status: PulseStatus;
  reason: string;
};

/**
 * A source that opens but parses nothing is treated as broken, not healthy.
 * That is exactly what a parser whose regex no longer matches the real log
 * format looks like, and it is the failure mode that cost this installation
 * days of missing joins.
 */
export function evaluateCollectorSource(fact: CollectorFact, now: Date, scanIntervalMs: number): CollectorSourceVerdict {
  const staleAfterMs = Math.max(scanIntervalMs * 3, 60 * 60_000);
  if (!fact.reported || !fact.lastScanAt) return { world: fact.world, sourceKind: fact.sourceKind, status: "UNKNOWN", reason: "this enabled world has not reported any collector source" };
  if (!fact.available) return { world: fact.world, sourceKind: fact.sourceKind, status: "CRITICAL", reason: "the source was unreadable on the last scan" };
  if (fact.recordsLastScan === 0) return { world: fact.world, sourceKind: fact.sourceKind, status: "CRITICAL", reason: "readable but parsed zero records, so the log format may no longer match the parser" };
  if (fact.lastError) return { world: fact.world, sourceKind: fact.sourceKind, status: "WARN", reason: `records were skipped: ${fact.lastError}` };
  if (fact.truncated) return { world: fact.world, sourceKind: fact.sourceKind, status: "WARN", reason: "the scan was truncated, so older records were not read" };
  if (now.getTime() - fact.lastScanAt.getTime() >= staleAfterMs) {
    return { world: fact.world, sourceKind: fact.sourceKind, status: "WARN", reason: `no scan for ${formatPulseDuration(now.getTime() - fact.lastScanAt.getTime())}` };
  }
  return { world: fact.world, sourceKind: fact.sourceKind, status: "OK", reason: `${fact.recordsLastScan} records on the last scan` };
}

export function evaluateCollectors(facts: readonly CollectorFact[], now: Date, scanIntervalMs: number): PulseVerdict & { sources: CollectorSourceVerdict[] } {
  const sources = facts.map((fact) => evaluateCollectorSource(fact, now, scanIntervalMs));
  if (sources.length === 0) {
    return { key: "collectors.game-sources", status: "UNKNOWN", summary: "No history scan has completed yet, so no collector has reported.", detail: {}, sources };
  }
  const failing = sources.filter((source) => source.status !== "OK");
  const status = sources.reduce<PulseStatus>((worst, source) => worseStatus(worst, source.status), "OK");
  const summary = failing.length === 0
    ? `All ${sources.length} configured sources across ${new Set(sources.map((source) => source.world)).size} worlds are yielding records.`
    : `${failing.length} of ${sources.length} sources need attention: ${failing.slice(0, 3).map((source) => `${source.world}/${source.sourceKind}`).join(", ")}${failing.length > 3 ? "…" : ""}.`;
  return { key: "collectors.game-sources", status, summary, detail: { total: sources.length, failing: failing.length }, sources };
}

// ---------------------------------------------------------------------------
// Data custody
// ---------------------------------------------------------------------------

export type BackupFact =
  | { configured: false }
  | { configured: true; readable: false; reason: string }
  | { configured: true; readable: true; completedAt: Date | null; result: string; databaseOk: boolean; databaseDetail: string | null; failures: string[] };

export function evaluateBackup(fact: BackupFact, now: Date): PulseVerdict {
  if (!fact.configured) return { key: "backup.database", status: "UNKNOWN", summary: "No backup destination is configured, so backups cannot be verified.", detail: { configured: false } };
  if (!fact.readable) return { key: "backup.database", status: "CRITICAL", summary: `The backup summary could not be read: ${fact.reason}.`, detail: { reason: fact.reason } };
  if (!fact.completedAt) return { key: "backup.database", status: "CRITICAL", summary: "The backup summary carries no completion time.", detail: { result: fact.result } };

  const ageMs = Math.max(0, now.getTime() - fact.completedAt.getTime());
  const ageHours = ageMs / 3_600_000;
  const detail = {
    completedAt: fact.completedAt.toISOString(),
    ageMs,
    result: fact.result,
    databaseOk: fact.databaseOk,
    databaseDetail: fact.databaseDetail,
    failures: fact.failures,
  };
  if (!fact.databaseOk) {
    return { key: "backup.database", status: "CRITICAL", summary: `The last run ${formatPulseDuration(ageMs)} ago did not capture the database${fact.failures.length ? `: ${fact.failures[0]}` : "."}`, detail };
  }
  if (ageHours >= pulseThresholds.backupCriticalHours) {
    return { key: "backup.database", status: "CRITICAL", summary: `The last successful database backup was ${formatPulseDuration(ageMs)} ago.`, detail };
  }
  if (ageHours >= pulseThresholds.backupWarnHours) {
    return { key: "backup.database", status: "WARN", summary: `The last successful database backup was ${formatPulseDuration(ageMs)} ago, past its nightly window.`, detail };
  }
  // A captured database with other steps failing is still a real warning: the
  // config archive and Git bundle are what make a rebuild possible.
  if (fact.failures.length > 0) {
    return { key: "backup.database", status: "WARN", summary: `Database captured ${formatPulseDuration(ageMs)} ago, but ${fact.failures.length} other step(s) failed: ${fact.failures[0]}`, detail };
  }
  return { key: "backup.database", status: "OK", summary: `Database captured ${formatPulseDuration(ageMs)} ago${fact.databaseDetail ? ` (${fact.databaseDetail})` : ""}.`, detail };
}

export type IngestionLagFact = {
  newestReceivedAt: Date | null;
  /** Median delay between an event happening in a world and being recorded. */
  medianDelayMs: number | null;
  sampleSize: number;
};

export function evaluateIngestionLag(fact: IngestionLagFact, now: Date): PulseVerdict {
  if (!fact.newestReceivedAt) return { key: "ingestion.event-lag", status: "UNKNOWN", summary: "No world events have been recorded yet.", detail: {} };
  const ageMs = Math.max(0, now.getTime() - fact.newestReceivedAt.getTime());
  const ageHours = ageMs / 3_600_000;
  const delayMinutes = fact.medianDelayMs === null ? null : fact.medianDelayMs / 60_000;
  const detail = { newestReceivedAt: fact.newestReceivedAt.toISOString(), ageMs, medianDelayMs: fact.medianDelayMs, sampleSize: fact.sampleSize };

  let status: PulseStatus = "OK";
  if (ageHours >= pulseThresholds.ingestionCriticalHours) status = "CRITICAL";
  else if (ageHours >= pulseThresholds.ingestionWarnHours) status = "WARN";
  if (delayMinutes !== null) {
    if (delayMinutes >= pulseThresholds.ingestionDelayCriticalMinutes) status = worseStatus(status, "CRITICAL");
    else if (delayMinutes >= pulseThresholds.ingestionDelayWarnMinutes) status = worseStatus(status, "WARN");
  }
  const delayText = fact.medianDelayMs === null ? "no arrival delay sample" : `median arrival delay ${formatPulseDuration(fact.medianDelayMs)}`;
  return { key: "ingestion.event-lag", status, summary: `Newest event recorded ${formatPulseDuration(ageMs)} ago; ${delayText}.`, detail };
}

export type EventVolumeFact = {
  lastHour: number;
  /** Events over the trailing baseline window, used to derive a per-hour expectation. */
  baselineTotal: number;
  baselineHours: number;
  hoursSinceLastEvent: number | null;
};

/**
 * Volume is judged only against this installation's own history. A private
 * clubhouse is quiet by nature, so an absolute threshold would either alert
 * every night or never alert at all.
 */
export function evaluateEventVolume(fact: EventVolumeFact): PulseVerdict {
  const baselinePerHour = fact.baselineHours > 0 ? fact.baselineTotal / fact.baselineHours : 0;
  const detail = { lastHour: fact.lastHour, baselinePerHour: Math.round(baselinePerHour * 100) / 100, baselineHours: fact.baselineHours, hoursSinceLastEvent: fact.hoursSinceLastEvent };
  if (baselinePerHour < pulseThresholds.volumeMinimumBaselinePerHour) {
    return { key: "ingestion.event-volume", status: "UNKNOWN", summary: `Only ${Math.round(baselinePerHour * 10) / 10} events an hour on average — too little history to call anything abnormal.`, detail };
  }
  if (fact.lastHour >= 20 && fact.lastHour > baselinePerHour * pulseThresholds.volumeSpikeMultiplier) {
    return {
      key: "ingestion.event-volume",
      status: "WARN",
      summary: `${fact.lastHour} events in the last hour against a baseline of ${Math.round(baselinePerHour)} — usually a source re-importing history.`,
      detail,
    };
  }
  if (fact.hoursSinceLastEvent !== null && fact.hoursSinceLastEvent >= pulseThresholds.volumeSilenceHours) {
    return {
      key: "ingestion.event-volume",
      status: "WARN",
      summary: `No events for ${formatPulseDuration(fact.hoursSinceLastEvent * 3_600_000)} against a baseline of ${Math.round(baselinePerHour)} an hour.`,
      detail,
    };
  }
  return { key: "ingestion.event-volume", status: "OK", summary: `${fact.lastHour} events in the last hour, baseline ${Math.round(baselinePerHour)} an hour.`, detail };
}

// ---------------------------------------------------------------------------
// Third parties
// ---------------------------------------------------------------------------

export type DiscordProviderFact =
  | { configured: false }
  | {
    configured: true;
    gateway: { ready: boolean; guilds: number } | null;
    /**
     * The bot is started without blocking the monitoring cycle, so the first
     * evaluation after a restart can land before the gateway has connected.
     * That is not a fault, and reporting it as one would alert on every restart.
     */
    connecting: boolean;
    deadLettered: number;
    queued: number;
    oldestQueuedMs: number | null;
    lastSentAt: Date | null;
  };

export function evaluateDiscordProvider(fact: DiscordProviderFact): PulseVerdict {
  if (!fact.configured) return { key: "provider.discord", status: "UNKNOWN", summary: "No Discord bot token is configured.", detail: { configured: false } };
  const detail = { gateway: fact.gateway, connecting: fact.connecting, deadLettered: fact.deadLettered, queued: fact.queued, oldestQueuedMs: fact.oldestQueuedMs, lastSentAt: fact.lastSentAt?.toISOString() ?? null };
  if (fact.deadLettered > 0) {
    return { key: "provider.discord", status: "CRITICAL", summary: `${fact.deadLettered} notification(s) exhausted every delivery attempt.`, detail };
  }
  if (fact.gateway && !fact.gateway.ready) {
    return { key: "provider.discord", status: "WARN", summary: "The bot is running but its gateway connection is not ready.", detail };
  }
  if (fact.oldestQueuedMs !== null && fact.oldestQueuedMs >= 30 * 60_000) {
    return { key: "provider.discord", status: "WARN", summary: `A notification has been queued for ${formatPulseDuration(fact.oldestQueuedMs)} without being delivered.`, detail };
  }
  if (fact.connecting) {
    return { key: "provider.discord", status: "UNKNOWN", summary: `The bot is still connecting; ${fact.queued} notification(s) waiting.`, detail };
  }
  if (!fact.gateway) {
    return { key: "provider.discord", status: "WARN", summary: "The bot did not start this run; notifications are queued but slash commands are unavailable.", detail };
  }
  return { key: "provider.discord", status: "OK", summary: `Gateway connected to ${fact.gateway.guilds} guild(s); ${fact.queued} notification(s) waiting.`, detail };
}

export type TwitchProviderFact =
  | { configured: false; reason: string }
  | { configured: true; channels: number; failing: number; lastSyncedAt: Date | null; pollIntervalMs: number; requestsToday: number; dailyBudget: number };

export function evaluateTwitchProvider(fact: TwitchProviderFact, now = new Date()): PulseVerdict {
  if (!fact.configured) return { key: "provider.twitch", status: "UNKNOWN", summary: fact.reason, detail: { configured: false } };
  const usedPercent = fact.dailyBudget > 0 ? (fact.requestsToday / fact.dailyBudget) * 100 : 0;
  const syncAgeMs = fact.lastSyncedAt ? Math.max(0, now.getTime() - fact.lastSyncedAt.getTime()) : null;
  const warnAfterMs = Math.max(fact.pollIntervalMs * 3, 10 * 60_000);
  const criticalAfterMs = Math.max(fact.pollIntervalMs * 12, 60 * 60_000);
  const detail = { channels: fact.channels, failing: fact.failing, lastSyncedAt: fact.lastSyncedAt?.toISOString() ?? null, syncAgeMs, pollIntervalMs: fact.pollIntervalMs, requestsToday: fact.requestsToday, dailyBudget: fact.dailyBudget };
  if (usedPercent >= 100) return { key: "provider.twitch", status: "CRITICAL", summary: `The daily Helix budget of ${fact.dailyBudget} requests is exhausted; live status is frozen until UTC midnight.`, detail };
  if (fact.channels > 0 && fact.failing === fact.channels) return { key: "provider.twitch", status: "CRITICAL", summary: `All ${fact.channels} verified channel(s) are failing to sync.`, detail };
  if (fact.failing > 0) return { key: "provider.twitch", status: "WARN", summary: `${fact.failing} of ${fact.channels} verified channel(s) are failing to sync.`, detail };
  if (fact.channels > 0 && syncAgeMs === null) return { key: "provider.twitch", status: "WARN", summary: `${fact.channels} verified channel(s) have never completed a Helix sync.`, detail };
  if (syncAgeMs !== null && syncAgeMs >= criticalAfterMs) return { key: "provider.twitch", status: "CRITICAL", summary: `Helix polling has not completed for ${formatPulseDuration(syncAgeMs)}; live status is stale.`, detail };
  if (syncAgeMs !== null && syncAgeMs >= warnAfterMs) return { key: "provider.twitch", status: "WARN", summary: `The newest Helix sync is ${formatPulseDuration(syncAgeMs)} old, past the expected ${formatPulseDuration(fact.pollIntervalMs)} cadence.`, detail };
  if (usedPercent >= pulseThresholds.providerBudgetWarnPercent) return { key: "provider.twitch", status: "WARN", summary: `${Math.round(usedPercent)}% of the daily Helix budget is spent.`, detail };
  return { key: "provider.twitch", status: "OK", summary: `${fact.channels} verified channel(s); ${fact.requestsToday} of ${fact.dailyBudget} daily requests used.`, detail };
}

// ---------------------------------------------------------------------------
// Evaluation pipeline
// ---------------------------------------------------------------------------

export type EvaluationFailureFact = {
  unresolvedInWindow: number;
  unresolvedTotal: number;
  newest: { kind: string; scope: string; message: string; occurredAt: Date } | null;
};

export function evaluateAchievementFailures(fact: EvaluationFailureFact): PulseVerdict {
  const detail = {
    unresolvedInWindow: fact.unresolvedInWindow,
    unresolvedTotal: fact.unresolvedTotal,
    windowHours: pulseThresholds.evaluationFailureWindowHours,
    newest: fact.newest ? { ...fact.newest, occurredAt: fact.newest.occurredAt.toISOString() } : null,
  };
  if (fact.unresolvedInWindow >= pulseThresholds.evaluationFailureCritical) {
    return { key: "pipeline.achievement-evaluations", status: "CRITICAL", summary: `${fact.unresolvedInWindow} pipeline evaluations failed in the last ${pulseThresholds.evaluationFailureWindowHours}h; records may be missing.`, detail };
  }
  if (fact.unresolvedInWindow >= pulseThresholds.evaluationFailureWarn) {
    return { key: "pipeline.achievement-evaluations", status: "WARN", summary: `${fact.unresolvedInWindow} evaluation(s) failed in the last ${pulseThresholds.evaluationFailureWindowHours}h${fact.newest ? `; newest: ${fact.newest.scope}` : ""}.`, detail };
  }
  return {
    key: "pipeline.achievement-evaluations",
    status: "OK",
    summary: fact.unresolvedTotal === 0 ? "No unresolved evaluation failures." : `No failures in the last ${pulseThresholds.evaluationFailureWindowHours}h; ${fact.unresolvedTotal} older one(s) still unresolved.`,
    detail,
  };
}

export type ReconciliationFact = {
  stuck: number;
  oldestQueuedMs: number | null;
  exhausted: number;
  pendingClaims: number;
  lastError: string | null;
};

export function evaluateClaimReconciliation(fact: ReconciliationFact): PulseVerdict {
  const detail = { stuck: fact.stuck, oldestQueuedMs: fact.oldestQueuedMs, exhausted: fact.exhausted, pendingClaims: fact.pendingClaims, lastError: fact.lastError };
  if (fact.stuck >= pulseThresholds.reconciliationCriticalCount || fact.exhausted > 0) {
    return {
      key: "pipeline.claim-reconciliation",
      status: "CRITICAL",
      summary: `${fact.stuck} reconciliation job(s) stuck${fact.exhausted > 0 ? `, ${fact.exhausted} past the retry ceiling` : ""}${fact.lastError ? `: ${fact.lastError}` : "."}`,
      detail,
    };
  }
  if (fact.stuck > 0) {
    return {
      key: "pipeline.claim-reconciliation",
      status: "WARN",
      summary: `${fact.stuck} reconciliation job(s) have been waiting ${formatPulseDuration(fact.oldestQueuedMs ?? 0)}; members are missing backdated history.`,
      detail,
    };
  }
  return { key: "pipeline.claim-reconciliation", status: "OK", summary: `No stuck reconciliations; ${fact.pendingClaims} claim(s) awaiting an administrator.`, detail };
}

/**
 * What the drive says about itself, and what canon says it should say. Every
 * field is cheap to gather: one small JSON off the share and a handful of
 * aggregates. Deliberately NOT the publisher's own `codexPublishState`, which
 * rebuilds the snapshot and writes assets to the share to work out its answer
 * — that is a fine thing for a CLI somebody typed and a terrible thing to do
 * every worker cycle.
 */
export type CodexDriveFact = {
  /** Null when HABITAT_CODEX_SYNC_ROOT is unset — nobody has asked for this. */
  syncRoot: string | null;
  /** Set when the root is configured but could not be read at all. */
  unreadable: string | null;
  /** When the drive's current bundle was published. Null when nothing ever was. */
  publishedAt: Date | null;
  /** The release the drive is carrying, and the newest one that has been cut. */
  driveRelease: { name: string; sha256: string } | null;
  canonRelease: { name: string; sha256: string } | null;
  /** The newest change to the codex the publisher would have republished for. */
  canonChangedAt: Date | null;
  assets: number | null;
};

export function evaluateCodexDrive(fact: CodexDriveFact, now: Date): PulseVerdict {
  const key = "pipeline.codex-drive" as const;
  const detail: Record<string, unknown> = {
    syncRoot: fact.syncRoot,
    publishedAt: fact.publishedAt?.toISOString() ?? null,
    driveRelease: fact.driveRelease,
    canonRelease: fact.canonRelease,
    canonChangedAt: fact.canonChangedAt?.toISOString() ?? null,
    assets: fact.assets,
  };

  // Nobody configured a drive, so there is nothing to be behind. Unknown, and
  // never alerted on — the same treatment as an unconfigured integration.
  if (!fact.syncRoot) {
    return { key, status: "UNKNOWN", summary: "No shared drive is configured, so nothing publishes the codex.", detail };
  }
  // Configured is the operator asserting the drive should be there. A path
  // that was promised and cannot be read is a real problem, not an unknown.
  if (fact.unreadable) {
    return { key, status: "CRITICAL", summary: `The codex drive at ${fact.syncRoot} could not be read: ${fact.unreadable}`, detail };
  }
  if (!fact.canonRelease) {
    return { key, status: "UNKNOWN", summary: "No story release has been cut, so there is no canon payload to publish yet.", detail };
  }
  if (!fact.publishedAt) {
    return { key, status: "CRITICAL", summary: "The drive is configured but nothing has ever been published to it.", detail };
  }

  const behindMs = fact.canonChangedAt ? fact.canonChangedAt.getTime() - fact.publishedAt.getTime() : 0;
  const lagMs = behindMs > 0 ? now.getTime() - fact.canonChangedAt!.getTime() : 0;
  const releaseMismatch = Boolean(fact.driveRelease && fact.driveRelease.sha256 !== fact.canonRelease.sha256);
  detail.behindBy = behindMs > 0 ? formatPulseDuration(lagMs) : null;

  // A bundle cut before the release boundary carried live canon rather than a
  // named cut. It verifies perfectly and is still the wrong kind of thing.
  if (!fact.driveRelease) {
    return { key, status: "WARN", summary: "The published bundle predates the release boundary — its canon payload was read live rather than from a named cut. Republish.", detail };
  }

  const reason = releaseMismatch
    ? `release ${fact.canonRelease.name} has been cut and the drive is still carrying ${fact.driveRelease.name}`
    : "the codex has changed since the drive was last published";

  if (behindMs > 0 && lagMs >= pulseThresholds.codexDriveCriticalMinutes * 60_000) {
    return { key, status: "CRITICAL", summary: `The codex drive is ${formatPulseDuration(lagMs)} behind — ${reason}.`, detail };
  }
  if (behindMs > 0 && lagMs >= pulseThresholds.codexDriveWarnMinutes * 60_000) {
    return { key, status: "WARN", summary: `The codex drive is ${formatPulseDuration(lagMs)} behind — ${reason}.`, detail };
  }
  // A cut release the drive has not taken is worth saying even inside the
  // grace window, because that is the state a build machine reads wrongly.
  if (releaseMismatch && lagMs >= pulseThresholds.codexDriveWarnMinutes * 60_000) {
    return { key, status: "WARN", summary: `The drive is carrying ${fact.driveRelease.name}; ${fact.canonRelease.name} has been cut since.`, detail };
  }

  return {
    key,
    status: "OK",
    summary: `The drive matches canon — ${fact.driveRelease.name}, ${fact.assets ?? "?"} assets, published ${formatPulseDuration(now.getTime() - fact.publishedAt.getTime())} ago.`,
    detail,
  };
}
