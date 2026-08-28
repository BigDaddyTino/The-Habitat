import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { getPrismaClient, type Prisma } from "@habitat/db/client";
import {
  isCodexBundleManifest,
  isCodexBundlePointer,
  overallPulseStatus,
  pulseSignalDefinition,
  pulseThresholds,
  resolveTwitchProvider,
  type PulseCategory,
  type PulseSignalKey,
  type PulseStatus,
} from "@habitat/shared";
import { checkAgentHealth } from "./agent-health.js";
import type { DiscordBotStatus } from "./discord-bot.js";
import { queueDiscordNotification } from "./discord-notifications.js";
import { parseRequestBudget, utcUsageDay } from "./provider-budget.js";
import {
  evaluateAchievementFailures,
  evaluateAgent,
  evaluateBackup,
  evaluateClaimReconciliation,
  evaluateCodexDrive,
  evaluateCollectors,
  evaluateDiscordProvider,
  evaluateEventVolume,
  evaluateHeartbeat,
  evaluateIngestionLag,
  pulseAlertTransition,
  evaluateTunnel,
  evaluateTwitchProvider,
  type BackupFact,
  type CodexDriveFact,
  type CollectorFact,
  type PulseVerdict,
  type TunnelFact,
} from "./pulse-signals.js";

/**
 * Habitat Pulse — gathering.
 *
 * The worker is the only process that evaluates operational signals, and it
 * persists the verdicts rather than leaving the admin view to recompute them.
 * That way what an administrator reads on the page and what Discord was told
 * about can never disagree.
 *
 * The one thing this cannot self-report is its own death, so the admin view
 * recomputes service freshness from the raw heartbeats and treats every other
 * signal as stale when the worker's beat has stopped.
 */

const db = getPrismaClient();

export type PulseCycleOptions = {
  agentUrl: URL;
  agentToken: string;
  /** The worker's own poll cadence, used to judge how stale a collector scan is. */
  historyScanIntervalMs: number;
  /** Present only when the Discord bot started this run. */
  discordStatus: DiscordBotStatus | null;
  /** True until the non-blocking bot startup has settled, one way or the other. */
  discordConnecting: boolean;
  environment?: NodeJS.ProcessEnv;
  now?: Date;
};

export type PulseCycleResult = {
  evaluated: number;
  changed: number;
  alerts: number;
  overall: PulseStatus;
};

export async function runPulseCycle(options: PulseCycleOptions): Promise<PulseCycleResult> {
  const environment = options.environment ?? process.env;
  const now = options.now ?? new Date();

  await repairOrphanedNotificationStates();
  const verdicts: PulseVerdict[] = [];
  verdicts.push(evaluateTunnel(await probeTunnel(environment)));
  verdicts.push(...await evaluateServiceHeartbeats(now));
  verdicts.push(evaluateAgent(await probeAgent(options.agentUrl, options.agentToken)));
  verdicts.push(evaluateCollectors(await readCollectorFacts(), now, options.historyScanIntervalMs));
  verdicts.push(evaluateBackup(await readBackupFact(environment), now));
  verdicts.push(evaluateIngestionLag(await readIngestionLagFact(), now));
  verdicts.push(evaluateEventVolume(await readEventVolumeFact(now)));
  verdicts.push(evaluateDiscordProvider(await readDiscordFact(environment, options.discordStatus, options.discordConnecting, now)));
  verdicts.push(evaluateTwitchProvider(await readTwitchFact(environment), now));
  verdicts.push(evaluateAchievementFailures(await readEvaluationFailureFact(now)));
  verdicts.push(evaluateClaimReconciliation(await readReconciliationFact(now)));
  verdicts.push(evaluateCodexDrive(await readCodexDriveFact(environment), now));

  let changed = 0;
  let alerts = 0;
  for (const verdict of verdicts) {
    const outcome = await persistVerdict(verdict, now);
    if (outcome.changed) changed += 1;
    if (outcome.alerted) alerts += 1;
  }
  return { evaluated: verdicts.length, changed, alerts, overall: overallPulseStatus(verdicts.map((verdict) => verdict.status)) };
}

// ---------------------------------------------------------------------------
// Persistence and alerting
// ---------------------------------------------------------------------------

async function persistVerdict(verdict: PulseVerdict, now: Date): Promise<{ changed: boolean; alerted: boolean }> {
  const definition = pulseSignalDefinition(verdict.key);
  if (!definition) throw new Error(`Pulse produced a verdict for an undefined signal: ${verdict.key}`);

  const previous = await db.pulseSignal.findUnique({ where: { key: verdict.key } });
  const changed = previous?.status !== verdict.status;
  // statusSince only moves on a real change, so "critical for three hours" stays
  // distinguishable from "critical since the last cycle".
  const statusSince = changed || !previous ? now : previous.statusSince;
  // The CHECK constraint requires an OK row to carry the time it was proven OK.
  const lastOkAt = verdict.status === "OK" ? now : previous?.lastOkAt ?? null;

  const row = {
    category: definition.category as PulseCategory,
    status: verdict.status,
    summary: verdict.summary.slice(0, 240),
    detail: verdict.detail as Prisma.InputJsonValue,
    observedAt: now,
    statusSince,
    lastOkAt,
  };
  await db.pulseSignal.upsert({ where: { key: verdict.key }, create: { key: verdict.key, ...row }, update: row });

  const alerted = await maybeAlert(verdict, previous?.notifiedStatus ?? null, statusSince, now);
  return { changed, alerted };
}

/**
 * Alerts on a transition, never on a state.
 *
 * A signal that stays critical alerts once, not every minute; a signal that
 * recovers sends a single recovery note so nobody is left chasing a problem
 * that fixed itself. UNKNOWN is never alerted on — a check that could not run
 * is not evidence of an outage.
 */
async function maybeAlert(verdict: PulseVerdict, notifiedStatus: PulseStatus | null, statusSince: Date, now: Date): Promise<boolean> {
  const definition = pulseSignalDefinition(verdict.key);
  if (!definition) return false;

  const transition = pulseAlertTransition(verdict.status, notifiedStatus);
  if (!transition) return false;
  const shouldAlert = transition === "ALERT";

  const content = shouldAlert
    ? `${verdict.status === "CRITICAL" ? "🔴" : "🟠"} **Habitat Pulse — ${definition.title}**\n${verdict.summary}\n_${definition.remedy}_`
    : `🟢 **Habitat Pulse — ${definition.title} recovered**\n${verdict.summary}`;

  try {
    const queued = await db.$transaction(async (transaction) => queueDiscordNotification(transaction, {
      kind: "OPERATIONS_ALERT",
      // Keyed on the transition, so one persistent failure produces one alert.
      evidenceKey: `pulse:${verdict.key}:${verdict.status}:${statusSince.toISOString()}`,
      content,
    }));
    // With no guild naming an operations channel, nothing was delivered — so
    // nothing is marked as notified either. Configuring a channel later then
    // alerts about the problem that is still happening, rather than staying
    // silent because a message nobody received was counted as sent.
    if (queued === 0) return false;
    await db.pulseSignal.update({
      where: { key: verdict.key },
      data: { notifiedStatus: shouldAlert ? verdict.status : null, notifiedAt: now },
    });
    return true;
  } catch (error) {
    // An alert that cannot be queued must not stop the rest of the evaluation.
    console.error("[pulse] could not queue an operational alert:", error instanceof Error ? error.message : String(error));
    return false;
  }
}

/**
 * Repairs notification markers written by an older Pulse build that counted a
 * notice as delivered even when no operations channel existed. A marker is
 * trusted only when the corresponding durable outbox row exists.
 */
async function repairOrphanedNotificationStates(): Promise<void> {
  const marked = await db.pulseSignal.findMany({
    where: { notifiedStatus: { in: ["WARN", "CRITICAL"] } },
    select: { key: true, notifiedStatus: true, statusSince: true },
  });
  for (const signal of marked) {
    if (!signal.notifiedStatus) continue;
    const suffix = `:pulse:${signal.key}:${signal.notifiedStatus}:${signal.statusSince.toISOString()}:OPERATIONS_ALERT`;
    const evidence = await db.discordNotification.findFirst({ where: { kind: "OPERATIONS_ALERT", dedupeKey: { endsWith: suffix } }, select: { id: true } });
    if (!evidence) await db.pulseSignal.update({ where: { key: signal.key }, data: { notifiedStatus: null, notifiedAt: null } });
  }
}

// ---------------------------------------------------------------------------
// Fact gathering
// ---------------------------------------------------------------------------

/**
 * Probes the public origin from the worker, which is the only way to observe
 * the tunnel: the request leaves the network, reaches Cloudflare, and comes
 * back through the tunnel. A local check would pass while the site was
 * unreachable to every member.
 */
async function probeTunnel(environment: NodeJS.ProcessEnv): Promise<TunnelFact> {
  const raw = environment.AUTH_URL?.trim();
  if (!raw) return { configured: false };
  let origin: URL;
  try {
    origin = new URL(raw);
  } catch {
    return { configured: false };
  }
  if (origin.protocol !== "https:") return { configured: false };

  const target = new URL("/api/pulse", origin);
  const startedAt = Date.now();
  try {
    const response = await fetch(target, { headers: { accept: "application/json" }, redirect: "error", signal: AbortSignal.timeout(10_000) });
    const latencyMs = Date.now() - startedAt;
    if (!response.ok) return { configured: true, origin: origin.origin, reachable: false, httpStatus: response.status, latencyMs, failure: null };
    const body: unknown = await response.json().catch(() => null);
    const served = body && typeof body === "object" && (body as { service?: unknown }).service === "habitat-web";
    return served
      ? { configured: true, origin: origin.origin, reachable: true, httpStatus: response.status, latencyMs, failure: null }
      : { configured: true, origin: origin.origin, reachable: false, httpStatus: response.status, latencyMs, failure: "the origin answered but is not this Habitat web app" };
  } catch (error) {
    return { configured: true, origin: origin.origin, reachable: false, httpStatus: null, latencyMs: null, failure: error instanceof Error ? error.message : "the probe failed" };
  }
}

async function evaluateServiceHeartbeats(now: Date): Promise<PulseVerdict[]> {
  const heartbeats = await db.serviceHeartbeat.findMany({ where: { service: { in: ["WEB", "WORKER"] } } });
  return (["WEB", "WORKER"] as const).map((service) => {
    const heartbeat = heartbeats.find((candidate) => candidate.service === service) ?? null;
    return evaluateHeartbeat({
      service,
      observedAt: heartbeat?.observedAt ?? null,
      intervalMs: heartbeat?.intervalMs ?? 60_000,
      hostname: heartbeat?.hostname ?? null,
      version: heartbeat?.version ?? null,
      startedAt: heartbeat?.startedAt ?? null,
    }, now);
  });
}

/** The agent holds no database credentials by design, so its liveness is probed, not self-reported. */
async function probeAgent(agentUrl: URL, agentToken: string) {
  const health = await checkAgentHealth(agentUrl.toString(), agentToken);
  return health.healthy
    ? { probed: true as const, healthy: true as const, hostname: health.health.hostname, version: health.health.version, uptimeSeconds: health.health.uptimeSeconds }
    : { probed: true as const, healthy: false as const, reason: health.reason };
}

async function readCollectorFacts(): Promise<CollectorFact[]> {
  const servers = await db.gameServer.findMany({
    where: { enabled: true },
    select: { slug: true, collectorSources: { orderBy: { sourceKind: "asc" } } },
    orderBy: { slug: "asc" },
  });
  return servers.flatMap<CollectorFact>((server) => server.collectorSources.map((state) => ({
        world: server.slug,
        sourceKind: state.sourceKind,
        reported: true,
        available: state.available,
        truncated: state.truncated,
        recordsLastScan: state.recordsLastScan,
        lastScanAt: state.lastScanAt,
        lastYieldAt: state.lastYieldAt,
        lastError: state.lastError,
      })));
}

/** Reads the summary scripts/backup-habitat.ps1 writes; the script is the authority, not this. */
/**
 * The codex drive, read the cheap way.
 *
 * Two small JSON files off the share and a few indexed aggregates — never the
 * publisher's own state function, which rebuilds the whole snapshot and writes
 * assets to the drive to reach its answer.
 *
 * The timestamps below mirror the inputs to the publisher's own change
 * fingerprint, because the question is not "did the codex change" but "did it
 * change in a way that should have triggered a republish". Cutting a release
 * counts: the bundle's canon payload comes from the newest cut, so a cut with
 * no other edit still leaves the drive behind.
 */
async function readCodexDriveFact(environment: NodeJS.ProcessEnv): Promise<CodexDriveFact> {
  const syncRoot = environment.HABITAT_CODEX_SYNC_ROOT?.trim() || null;
  const database = getPrismaClient();

  const [release, revision, arcs, nodes, edges, entries, links, comments, maps, placements, nodePlacements] = await Promise.all([
    database.storyRelease.findFirst({ orderBy: { cutAt: "desc" }, select: { name: true, sha256: true, cutAt: true } }),
    database.storyRevision.findFirst({ orderBy: [{ createdAt: "desc" }, { id: "desc" }], select: { createdAt: true } }),
    database.storyArc.aggregate({ _max: { updatedAt: true } }),
    database.storyNode.aggregate({ _max: { updatedAt: true } }),
    database.storyEdge.aggregate({ _max: { updatedAt: true } }),
    database.storyEntry.aggregate({ _max: { updatedAt: true } }),
    database.storyEntryLink.aggregate({ _max: { createdAt: true } }),
    database.storyComment.aggregate({ _max: { createdAt: true, resolvedAt: true } }),
    database.storyMap.aggregate({ _max: { updatedAt: true } }),
    database.storyMapPlacement.aggregate({ _max: { updatedAt: true } }),
    database.storyMapNodePlacement.aggregate({ _max: { updatedAt: true } }),
  ]);

  // Every table the publisher's fingerprint reads, so there is no edit that
  // would make it republish and leave this signal thinking all is well. A
  // placement moved on the atlas counts exactly as much as a scene rewritten.
  const canonChangedAt = [
    release?.cutAt ?? null,
    revision?.createdAt ?? null,
    arcs._max.updatedAt, nodes._max.updatedAt, edges._max.updatedAt, entries._max.updatedAt,
    links._max.createdAt, comments._max.createdAt, comments._max.resolvedAt,
    maps._max.updatedAt, placements._max.updatedAt, nodePlacements._max.updatedAt,
  ].reduce<Date | null>((newest, candidate) => (candidate && (!newest || candidate > newest) ? candidate : newest), null);

  const canonRelease = release ? { name: release.name, sha256: release.sha256 } : null;
  if (!syncRoot) {
    return { syncRoot: null, unreadable: null, publishedAt: null, driveRelease: null, canonRelease, canonChangedAt, assets: null };
  }

  try {
    const pointer: unknown = JSON.parse(await readFile(path.join(syncRoot, "current.json"), "utf8"));
    if (!isCodexBundlePointer(pointer)) {
      return { syncRoot, unreadable: "current.json is not a codex bundle pointer", publishedAt: null, driveRelease: null, canonRelease, canonChangedAt, assets: null };
    }
    const manifest: unknown = JSON.parse(await readFile(path.join(syncRoot, pointer.manifestPath), "utf8"));
    const driveRelease = isCodexBundleManifest(manifest) && manifest.storyRelease
      ? { name: manifest.storyRelease.name, sha256: manifest.storyRelease.sha256 }
      : null;
    const assets = isCodexBundleManifest(manifest) ? manifest.assets.length : null;
    const publishedAt = new Date(pointer.generatedAt);
    return {
      syncRoot,
      unreadable: null,
      publishedAt: Number.isNaN(publishedAt.getTime()) ? null : publishedAt,
      driveRelease,
      canonRelease,
      canonChangedAt,
      assets,
    };
  } catch (error) {
    // ENOENT on current.json is "nothing has ever been published", which the
    // verdict says in its own words; anything else is the share itself.
    const code = (error as NodeJS.ErrnoException).code;
    if (code === "ENOENT") {
      return { syncRoot, unreadable: null, publishedAt: null, driveRelease: null, canonRelease, canonChangedAt, assets: null };
    }
    return { syncRoot, unreadable: error instanceof Error ? error.message : String(error), publishedAt: null, driveRelease: null, canonRelease, canonChangedAt, assets: null };
  }
}

async function readBackupFact(environment: NodeJS.ProcessEnv): Promise<BackupFact> {
  const root = environment.HABITAT_BACKUP_PATH?.trim();
  if (!root) return { configured: false };
  try {
    const parsed: unknown = JSON.parse(await readFile(path.join(root, "latest.json"), "utf8"));
    if (!parsed || typeof parsed !== "object") return { configured: true, readable: false, reason: "the summary is not an object" };
    const summary = parsed as { completedAt?: unknown; result?: unknown; steps?: unknown };
    const completed = typeof summary.completedAt === "string" ? Date.parse(summary.completedAt) : Number.NaN;
    const steps = Array.isArray(summary.steps) ? summary.steps as Array<{ name?: unknown; status?: unknown; detail?: unknown; path?: unknown; bytes?: unknown }> : [];
    const database = steps.find((step) => step.name === "database");
    const artifactFailure = database?.status === "ok" ? await verifyBackupArtifact(root, database) : null;
    const failures = steps.filter((step) => step.status === "failed").map((step) => `${String(step.name)}: ${String(step.detail ?? "failed")}`.slice(0, 160));
    if (artifactFailure) failures.unshift(`database: ${artifactFailure}`);
    return {
      configured: true,
      readable: true,
      completedAt: Number.isNaN(completed) ? null : new Date(completed),
      result: typeof summary.result === "string" ? summary.result : "unknown",
      databaseOk: database?.status === "ok" && artifactFailure === null,
      databaseDetail: typeof database?.detail === "string" ? database.detail : null,
      failures,
    };
  } catch (error) {
    const reason = error instanceof Error && "code" in error && (error as { code?: unknown }).code === "ENOENT"
      ? "no backup has been recorded at the configured destination"
      : error instanceof Error ? error.message : "the summary could not be read";
    return { configured: true, readable: false, reason };
  }
}

async function verifyBackupArtifact(root: string, step: { path?: unknown; bytes?: unknown }): Promise<string | null> {
  if (typeof step.path !== "string" || !step.path.trim()) return "the successful summary does not identify its dump file";
  if (typeof step.bytes !== "number" || !Number.isSafeInteger(step.bytes) || step.bytes <= 0) return "the successful summary carries an invalid dump size";
  const resolvedRoot = path.resolve(root);
  const resolvedArtifact = path.resolve(step.path);
  const relativeArtifact = path.relative(resolvedRoot, resolvedArtifact);
  if (path.isAbsolute(relativeArtifact) || relativeArtifact === ".." || relativeArtifact.startsWith(`..${path.sep}`)) return "the recorded dump path is outside the configured backup root";
  try {
    const artifact = await stat(resolvedArtifact);
    if (!artifact.isFile()) return "the recorded dump is not a file";
    if (artifact.size !== step.bytes) return `the dump size is ${artifact.size} bytes, not the recorded ${step.bytes}`;
    return null;
  } catch (error) {
    return error instanceof Error && "code" in error && (error as { code?: unknown }).code === "ENOENT" ? "the recorded dump file is missing" : "the recorded dump file cannot be inspected";
  }
}

/** Anything older than this on arrival is a history import, not a live event running late. */
const backfillDelayMs = 24 * 3_600_000;

async function readIngestionLagFact() {
  // A bounded sample rather than an aggregate: the median of the newest events
  // describes current behaviour, and the query stays cheap on an indexed column.
  const recent = await db.serverEvent.findMany({
    orderBy: { receivedAt: "desc" },
    take: 200,
    select: { occurredAt: true, receivedAt: true },
  });
  if (recent.length === 0) return { newestReceivedAt: null, medianDelayMs: null, sampleSize: 0 };
  const delays = recent
    .map((event) => event.receivedAt.getTime() - event.occurredAt.getTime())
    // A negative delay is a clock skew artefact, not an arrival time. A delay
    // measured in days is a legacy import replaying years of history, which
    // would otherwise drown the live sources and hold this signal permanently
    // amber. Filtering by the delay itself rather than by a list of source
    // names means a new backfill source cannot silently reintroduce the noise —
    // and cannot hide real lag either, since the thresholds are hours, not days.
    .filter((delay) => delay >= 0 && delay < backfillDelayMs)
    .sort((first, second) => first - second);
  return {
    newestReceivedAt: recent[0].receivedAt,
    medianDelayMs: delays.length === 0 ? null : delays[Math.floor(delays.length / 2)],
    sampleSize: delays.length,
  };
}

async function readEventVolumeFact(now: Date) {
  const baselineHours = pulseThresholds.volumeBaselineDays * 24;
  const baselineStart = new Date(now.getTime() - baselineHours * 3_600_000);
  const hourStart = new Date(now.getTime() - 3_600_000);
  const [lastHour, baselineTotal, newest] = await Promise.all([
    db.serverEvent.count({ where: { receivedAt: { gte: hourStart } } }),
    db.serverEvent.count({ where: { receivedAt: { gte: baselineStart, lt: hourStart } } }),
    db.serverEvent.findFirst({ orderBy: { receivedAt: "desc" }, select: { receivedAt: true } }),
  ]);
  return {
    lastHour,
    baselineTotal,
    baselineHours: baselineHours - 1,
    hoursSinceLastEvent: newest ? (now.getTime() - newest.receivedAt.getTime()) / 3_600_000 : null,
  };
}

async function readDiscordFact(environment: NodeJS.ProcessEnv, status: DiscordBotStatus | null, connecting: boolean, now: Date) {
  if (!environment.DISCORD_BOT_TOKEN?.trim()) return { configured: false as const };
  const [deadLettered, queued, oldest, lastSent] = await Promise.all([
    db.discordNotification.count({ where: { sentAt: null, attempts: { gte: pulseThresholds.notificationDeadLetterAttempts } } }),
    db.discordNotification.count({ where: { sentAt: null, attempts: { lt: pulseThresholds.notificationDeadLetterAttempts } } }),
    db.discordNotification.findFirst({ where: { sentAt: null, attempts: { lt: pulseThresholds.notificationDeadLetterAttempts } }, orderBy: { queuedAt: "asc" }, select: { queuedAt: true } }),
    db.discordNotification.findFirst({ where: { sentAt: { not: null } }, orderBy: { sentAt: "desc" }, select: { sentAt: true } }),
  ]);
  return {
    configured: true as const,
    gateway: status ? { ready: status.ready, guilds: status.guilds } : null,
    connecting: connecting && !status,
    deadLettered,
    queued,
    oldestQueuedMs: oldest ? Math.max(0, now.getTime() - oldest.queuedAt.getTime()) : null,
    lastSentAt: lastSent?.sentAt ?? null,
  };
}

async function readTwitchFact(environment: NodeJS.ProcessEnv) {
  const provider = resolveTwitchProvider(environment);
  if (!provider) {
    return { configured: false as const, reason: "The Twitch integration is not configured or has been switched off." };
  }
  const dailyBudget = parseRequestBudget(environment.TWITCH_DAILY_REQUEST_BUDGET, 5_000);
  const [channels, failing, newest, usage] = await Promise.all([
    db.twitchChannel.count(),
    db.twitchChannel.count({ where: { syncStatus: "ERROR" } }),
    db.twitchChannel.findFirst({ where: { lastSyncedAt: { not: null } }, orderBy: { lastSyncedAt: "desc" }, select: { lastSyncedAt: true } }),
    db.providerRequestUsage.findUnique({ where: { provider_usageDay: { provider: "TWITCH", usageDay: utcUsageDay() } }, select: { requestCount: true } }),
  ]);
  return { configured: true as const, channels, failing, lastSyncedAt: newest?.lastSyncedAt ?? null, pollIntervalMs: provider.livePollIntervalMs, requestsToday: usage?.requestCount ?? 0, dailyBudget };
}

async function readEvaluationFailureFact(now: Date) {
  const windowStart = new Date(now.getTime() - pulseThresholds.evaluationFailureWindowHours * 3_600_000);
  const [unresolvedInWindow, unresolvedTotal, newest] = await Promise.all([
    db.evaluationFailure.count({ where: { resolvedAt: null, occurredAt: { gte: windowStart } } }),
    db.evaluationFailure.count({ where: { resolvedAt: null } }),
    db.evaluationFailure.findFirst({ where: { resolvedAt: null }, orderBy: { occurredAt: "desc" }, select: { kind: true, scope: true, message: true, occurredAt: true } }),
  ]);
  return { unresolvedInWindow, unresolvedTotal, newest };
}

async function readReconciliationFact(now: Date) {
  const stuckBefore = new Date(now.getTime() - pulseThresholds.reconciliationStuckMinutes * 60_000);
  const [stuck, oldest, exhausted, pendingClaims, lastFailure] = await Promise.all([
    db.identityRewardReconciliation.count({
      where: { completedAt: null, OR: [{ queuedAt: { lt: stuckBefore } }, { attempts: { gte: pulseThresholds.reconciliationStuckAttempts } }] },
    }),
    db.identityRewardReconciliation.findFirst({ where: { completedAt: null }, orderBy: { queuedAt: "asc" }, select: { queuedAt: true } }),
    db.identityRewardReconciliation.count({ where: { completedAt: null, attempts: { gte: pulseThresholds.reconciliationStuckAttempts } } }),
    db.playerIdentityClaim.count({ where: { status: "PENDING" } }),
    db.identityRewardReconciliation.findFirst({ where: { completedAt: null, lastError: { not: null } }, orderBy: { queuedAt: "asc" }, select: { lastError: true } }),
  ]);
  return {
    stuck,
    oldestQueuedMs: oldest ? Math.max(0, now.getTime() - oldest.queuedAt.getTime()) : null,
    exhausted,
    pendingClaims,
    lastError: lastFailure?.lastError ?? null,
  };
}

export type { PulseSignalKey };
