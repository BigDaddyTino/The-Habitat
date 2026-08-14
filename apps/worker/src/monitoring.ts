import { getPrismaClient, type Prisma } from "@habitat/db/client";
import { grantIdentityOwnership } from "@habitat/identity";
import { isStablePlayerProviderKey, type AgentPlayerObservation, type AgentServerStatus, type ServerState } from "@habitat/shared";
import { evaluateAchievementsForEvent } from "./achievements.js";
import { evaluateRecordsForEvent } from "./records.js";
import { queueDiscordNotification } from "./discord-notifications.js";
import { normalizeServerState } from "./state.js";
import { processProgressionForEvent } from "./progression.js";

export type MonitoredServer = {
  id: string;
  slug: string;
  displayName: string;
  gameType: string;
  desiredState: ServerState;
  actualState: ServerState;
  playerCount: number | null;
  playerPresenceInitialized: boolean;
  lastStateChangeAt: Date | null;
};

export type MonitoringRepository = {
  findBySlug(slug: string): Promise<MonitoredServer | null>;
  findPreviouslyAgentMonitored(): Promise<MonitoredServer[]>;
  saveObservation(server: MonitoredServer, status: AgentServerStatus): Promise<void>;
  markAgentUnavailable(server: MonitoredServer, reason: string, observedAt: Date): Promise<void>;
};

export type AgentPoller = {
  pollStatuses(): Promise<Array<{ key: string; status: AgentServerStatus | null }>>;
};

export type MonitoringCycleResult = {
  observed: number;
  unknown: number;
  ignored: number;
  agentAvailable: boolean;
};

type PresenceTransaction = Prisma.TransactionClient;

const unknownDebounceThreshold = 2;
const consecutiveObservationFailures = new Map<string, number>();
const consecutiveRunningObservations = new Map<string, number>();

export async function runMonitoringCycle(repository: MonitoringRepository, agent: AgentPoller, now = new Date(), retryDelayMs = 2_000): Promise<MonitoringCycleResult> {
  let statuses: Array<{ key: string; status: AgentServerStatus | null }>;
  try {
    statuses = await agent.pollStatuses();
  } catch (firstError) {
    console.error("[monitoring] agent poll failed, retrying once:", firstError instanceof Error ? firstError.message : String(firstError));
    try {
      await delay(retryDelayMs);
      statuses = await agent.pollStatuses();
    } catch (retryError) {
      console.error("[monitoring] agent poll retry failed:", retryError instanceof Error ? retryError.message : String(retryError));
      const previouslyMonitored = await repository.findPreviouslyAgentMonitored();
      let unknown = 0;
      for (const server of previouslyMonitored) {
        unknown += 1;
        if (registerObservationFailure(server.id) >= unknownDebounceThreshold) await repository.markAgentUnavailable(server, "agent_unavailable", now);
      }
      return { observed: 0, unknown, ignored: 0, agentAvailable: false };
    }
  }

  let observed = 0;
  let unknown = 0;
  let ignored = 0;
  for (const entry of statuses) {
    const server = await repository.findBySlug(entry.key);
    if (!server) {
      ignored += 1;
      continue;
    }
    if (!entry.status) {
      unknown += 1;
      if (registerObservationFailure(server.id) >= unknownDebounceThreshold) await repository.markAgentUnavailable(server, "agent_status_unavailable", now);
      continue;
    }
    consecutiveObservationFailures.delete(server.id);
    await repository.saveObservation(server, entry.status);
    observed += 1;
  }
  return { observed, unknown, ignored, agentAvailable: true };
}

function registerObservationFailure(serverId: string): number {
  const failures = (consecutiveObservationFailures.get(serverId) ?? 0) + 1;
  consecutiveObservationFailures.set(serverId, failures);
  return failures;
}

function delay(durationMs: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, durationMs));
}

export function createPostgresMonitoringRepository(): MonitoringRepository {
  const db = getPrismaClient();
  return {
    async findBySlug(slug) {
      const server = await db.gameServer.findUnique({
        where: { slug },
        select: { id: true, slug: true, displayName: true, gameType: true, desiredState: true, actualState: true, lastStateChangeAt: true, runtimeState: { select: { details: true, playerCount: true } } },
      });
      return server ? toMonitoredServer(server) : null;
    },
    async findPreviouslyAgentMonitored() {
      const servers = await db.gameServer.findMany({
        where: {
          lastQueryAt: { not: null },
          runtimeState: { is: { processRunning: { not: null } } },
        },
        select: { id: true, slug: true, displayName: true, gameType: true, desiredState: true, actualState: true, lastStateChangeAt: true, runtimeState: { select: { details: true, playerCount: true } } },
      });
      return servers.map(toMonitoredServer);
    },
    async saveObservation(server, status) {
      const observedAt = parseObservedAt(status.observedAt);
      const runningStreak = status.process.running ? (consecutiveRunningObservations.get(server.id) ?? 0) + 1 : 0;
      if (runningStreak > 0) consecutiveRunningObservations.set(server.id, runningStreak);
      else consecutiveRunningObservations.delete(server.id);
      const settledDesiredState = settleTransitionalDesiredState(server, status, observedAt);
      const effectiveDesiredState = resolveDesiredState(settledDesiredState, status, runningStreak);
      const decision = normalizeServerState(effectiveDesiredState, status);
      const version = status.query?.version ?? status.executable?.version ?? null;
      const stateChanged = server.actualState !== decision.state;
      const rawNamedPlayers = Array.isArray(status.query?.players) ? status.query.players : null;
      const namedPlayers = rawNamedPlayers?.every((player) => isStablePlayerProviderKey(player.providerKey)) ? rawNamedPlayers : null;
      const palworldKnownPlayers = server.gameType === "PALWORLD" && Array.isArray(status.query?.knownPlayers)
        ? status.query.knownPlayers.filter((player) => isStablePlayerProviderKey(player.providerKey))
        : null;
      const details = {
        source: "HABITAT_AGENT",
        agentKey: status.key,
        process: status.process,
        disk: status.disk,
        executable: status.executable,
        query: status.query ? { ...status.query, players: status.query.players === null || status.query.players === undefined ? null : { available: true, count: status.query.players.length }, knownPlayers: status.query.knownPlayers === null || status.query.knownPlayers === undefined ? null : { available: true, count: status.query.knownPlayers.length } } : null,
        log: status.log,
        playerPresenceInitialized: server.playerPresenceInitialized || namedPlayers !== null,
      };
      await db.$transaction(async (transaction) => {
        await transaction.serverRuntimeState.upsert({
          where: { serverId: server.id },
          create: {
            serverId: server.id,
            state: decision.state,
            reachable: status.query?.reachable ?? status.process.running,
            playerCount: status.query?.playerCount ?? null,
            maxPlayers: status.query?.maxPlayers ?? null,
            pingMs: status.query?.pingMs ?? null,
            version,
            processRunning: status.process.running,
            processStartedAt: parseNullableDate(status.process.startedAt),
            observedAt,
            details,
          },
          update: {
            state: decision.state,
            reachable: status.query?.reachable ?? status.process.running,
            playerCount: status.query?.playerCount ?? null,
            maxPlayers: status.query?.maxPlayers ?? null,
            pingMs: status.query?.pingMs ?? null,
            version,
            processRunning: status.process.running,
            processStartedAt: parseNullableDate(status.process.startedAt),
            observedAt,
            details,
          },
        });
        await transaction.gameServer.update({
          where: { id: server.id },
          data: {
            actualState: decision.state,
            desiredState: effectiveDesiredState,
            lastQueryAt: observedAt,
            lastOnlineAt: decision.state === "ONLINE" ? observedAt : undefined,
            lastStateChangeAt: stateChanged ? observedAt : undefined,
            currentVersion: version ?? undefined,
          },
        });
        if (stateChanged) {
          await transaction.serverStatusHistory.create({
            data: {
              serverId: server.id,
              state: decision.state,
              desiredState: effectiveDesiredState,
              observedAt,
              reason: decision.reason,
              details: { source: "HABITAT_AGENT", processRunning: status.process.running, queryReachable: status.query?.reachable ?? null },
            },
          });
          const eventType = chronicleEventType(decision.state);
          if (eventType && shouldAnnounceTransition(eventType, server.actualState)) {
            const dedupeKey = `state:${server.id}:${decision.state}:${observedAt.toISOString()}`;
            const event = await transaction.serverEvent.upsert({
              where: { dedupeKey },
              create: {
                serverId: server.id,
                gameType: server.gameType as never,
                eventType,
                occurredAt: observedAt,
                source: "HABITAT_AGENT",
                sourceConfidence: 100,
                dedupeKey,
              },
              update: {},
            });
            const notification = stateNotification(server.displayName, eventType);
            if (notification) await queueDiscordNotification(transaction, { serverEventId: event.id, ...notification });
          }
        }
        const currentPlayerCount = status.query?.playerCount ?? null;
        if (crossedWorldGatheringThreshold(server.playerCount, currentPlayerCount)) {
          const dedupeKey = worldGatheringDedupeKey(server.id, observedAt);
          const event = await transaction.serverEvent.upsert({
            where: { dedupeKey },
            create: {
              serverId: server.id,
              gameType: server.gameType as never,
              eventType: "WORLD_GATHERING",
              occurredAt: observedAt,
              valueNumber: currentPlayerCount,
              source: "HABITAT_AGENT",
              sourceConfidence: 100,
              dedupeKey,
              metadata: { threshold: worldGatheringThreshold, previousPlayerCount: server.playerCount, playerCount: currentPlayerCount },
            },
            update: {},
          });
          await queueDiscordNotification(transaction, {
            serverEventId: event.id,
            kind: "WORLD_GATHERING",
            content: `The Great Hall is stirring: **${currentPlayerCount} players** are gathered in **${server.displayName}**.`,
          });
        }
        if (status.log?.available && status.log.lastSaveAt) {
          await transaction.serverEvent.upsert({
            where: { dedupeKey: `dragonwilds-save:${server.id}:${status.log.lastSaveAt}` },
            create: {
              serverId: server.id,
              gameType: server.gameType as never,
              eventType: "WORLD_SAVED",
              occurredAt: observedAt,
              source: "DRAGONWILDS_LOG",
              sourceConfidence: 100,
              dedupeKey: `dragonwilds-save:${server.id}:${status.log.lastSaveAt}`,
              metadata: { sourceTimestamp: status.log.lastSaveAt },
            },
            update: {},
          });
        }
        if (namedPlayers !== null) {
          await synchronizeNamedPlayerPresence(transaction, server, namedPlayers, observedAt, server.gameType === "PALWORLD");
        }
        if (palworldKnownPlayers !== null) {
          await synchronizePalworldKnownPlayers(transaction, server, palworldKnownPlayers, observedAt);
        }
        await transaction.serverMetricSample.create({
          data: {
            serverId: server.id,
            observedAt,
            playerCount: status.query?.playerCount ?? null,
            maxPlayers: status.query?.maxPlayers ?? null,
            pingMs: status.query?.pingMs ?? null,
            processMemoryBytes: toBigInt(status.process.memoryBytes),
            cpuSeconds: status.process.cpuSeconds,
            diskFreeBytes: toBigInt(status.disk?.freeBytes),
            diskTotalBytes: toBigInt(status.disk?.totalBytes),
            source: "HABITAT_AGENT",
          },
        });
      });
    },
    async markAgentUnavailable(server, reason, observedAt) {
      const stateChanged = server.actualState !== "UNKNOWN";
      await db.$transaction(async (transaction) => {
        const existingState = await transaction.serverRuntimeState.findUnique({ where: { serverId: server.id }, select: { details: true } });
        const existingDetails = existingState?.details && typeof existingState.details === "object" && !Array.isArray(existingState.details) ? existingState.details as Record<string, unknown> : {};
        const details = { ...existingDetails, source: "HABITAT_AGENT", agentAvailable: false, reason } as Prisma.InputJsonObject;
        await transaction.serverRuntimeState.upsert({
          where: { serverId: server.id },
          create: { serverId: server.id, state: "UNKNOWN", observedAt, details },
          update: {
            state: "UNKNOWN",
            reachable: null,
            playerCount: null,
            maxPlayers: null,
            pingMs: null,
            version: null,
            processRunning: null,
            processStartedAt: null,
            observedAt,
            details,
          },
        });
        await transaction.gameServer.update({
          where: { id: server.id },
          data: { actualState: "UNKNOWN", lastQueryAt: observedAt, lastStateChangeAt: stateChanged ? observedAt : undefined },
        });
        if (stateChanged) {
          await transaction.serverStatusHistory.create({
            data: { serverId: server.id, state: "UNKNOWN", desiredState: server.desiredState, observedAt, reason, details: { source: "HABITAT_AGENT", agentAvailable: false } },
          });
        }
      });
    },
  };
}

function chronicleEventType(state: ServerState): "SERVER_STARTED" | "SERVER_SLEEPING" | "SERVER_UPDATED" | "SERVER_CRASHED" | null {
  if (state === "ONLINE") return "SERVER_STARTED";
  if (state === "SLEEPING") return "SERVER_SLEEPING";
  if (state === "UPDATING") return "SERVER_UPDATED";
  if (state === "DOWN_UNEXPECTEDLY") return "SERVER_CRASHED";
  return null;
}

function stateNotification(serverName: string, eventType: ReturnType<typeof chronicleEventType>) {
  if (eventType === "SERVER_STARTED") return { kind: "SERVER_ONLINE" as const, content: `**${serverName}** came online.` };
  if (eventType === "SERVER_SLEEPING") return { kind: "SERVER_SLEEPING" as const, content: `**${serverName}** entered intentional rest.` };
  if (eventType === "SERVER_CRASHED") return { kind: "SERVER_OUTAGE" as const, content: `**${serverName}** stopped unexpectedly.` };
  return null;
}

function shouldAnnounceTransition(eventType: NonNullable<ReturnType<typeof chronicleEventType>>, previousState: ServerState): boolean {
  if (eventType !== "SERVER_STARTED") return true;
  return previousState === "SLEEPING" || previousState === "DOWN_UNEXPECTEDLY" || previousState === "STOPPING" || previousState === "STARTING";
}

function toMonitoredServer(server: { id: string; slug: string; displayName: string; gameType: string; desiredState: string; actualState: string; lastStateChangeAt: Date | null; runtimeState: { details: unknown; playerCount?: number | null } | null }): MonitoredServer {
  return { id: server.id, slug: server.slug, displayName: server.displayName, gameType: server.gameType, desiredState: server.desiredState as ServerState, actualState: server.actualState as ServerState, playerCount: server.runtimeState?.playerCount ?? null, playerPresenceInitialized: hasPlayerPresenceBaseline(server.runtimeState?.details), lastStateChangeAt: server.lastStateChangeAt };
}

export const worldGatheringThreshold = 5;

/** A missing baseline is not a crossing and therefore cannot create a ceremony. */
export function crossedWorldGatheringThreshold(previous: number | null, current: number | null): boolean {
  return previous !== null && current !== null && previous < worldGatheringThreshold && current >= worldGatheringThreshold;
}

export const worldGatheringCooldownMs = 6 * 60 * 60_000;

/**
 * A crossing is an edge, so a group sitting on the boundary crosses it again
 * every time one player steps out and back in. Bucketing the dedupe key by a
 * cooldown window makes the repeat crossings resolve to the same ServerEvent
 * row, which the upsert leaves untouched and the notification outbox therefore
 * refuses a second time. Deriving this from the timestamp rather than worker
 * memory keeps it stable across restarts.
 */
export function worldGatheringDedupeKey(serverId: string, observedAt: Date): string {
  return `gathering:${serverId}:${Math.floor(observedAt.getTime() / worldGatheringCooldownMs)}`;
}

async function synchronizeNamedPlayerPresence(transaction: PresenceTransaction, server: MonitoredServer, players: AgentPlayerObservation[], observedAt: Date, emitPalworldChronicleEvents: boolean) {
  const known = await transaction.serverPlayerPresence.findMany({ where: { serverId: server.id } });
  const knownByKey = new Map(known.map((presence) => [presence.providerKey, presence]));
  const observedKeys = new Set(players.map((player) => player.providerKey));

  for (const player of players) {
    const externalIdentity = player.externalProvider === "STEAM" && player.externalAccountId
      ? { externalProvider: "STEAM" as const, externalAccountId: player.externalAccountId }
      : null;
    const identity = await transaction.playerIdentity.upsert({
      where: { gameType_providerKey: { gameType: server.gameType as never, providerKey: player.providerKey } },
      create: { gameType: server.gameType as never, providerKey: player.providerKey, displayName: player.displayName, serverId: server.id, ...(externalIdentity ?? {}) },
      update: { displayName: player.displayName, serverId: server.id, ...(externalIdentity ?? {}) },
      select: { id: true, userId: true },
    });
    if (externalIdentity && !identity.userId) await autoLinkVerifiedSteamIdentity(transaction, identity.id, externalIdentity.externalAccountId, observedAt);
    const previous = knownByKey.get(player.providerKey);
    if (!previous) {
      await transaction.serverPlayerPresence.create({ data: { serverId: server.id, providerKey: player.providerKey, displayName: player.displayName, present: true, firstObservedAt: observedAt, lastObservedAt: observedAt } });
      if (emitPalworldChronicleEvents && server.playerPresenceInitialized) await createPalworldPresenceEvent(transaction, server, player, identity.id, "PLAYER_JOINED", observedAt);
      continue;
    }
    if (emitPalworldChronicleEvents && !previous.present) await createPalworldPresenceEvent(transaction, server, player, identity.id, "PLAYER_JOINED", observedAt);
    await transaction.serverPlayerPresence.update({ where: { serverId_providerKey: { serverId: server.id, providerKey: player.providerKey } }, data: { displayName: player.displayName, present: true, lastObservedAt: observedAt, ...(previous.present ? {} : { firstObservedAt: observedAt }) } });
  }

  if (!server.playerPresenceInitialized) return;
  for (const presence of known.filter((item) => item.present && !observedKeys.has(item.providerKey))) {
    if (emitPalworldChronicleEvents) {
      const identity = await transaction.playerIdentity.findUnique({ where: { gameType_providerKey: { gameType: server.gameType as never, providerKey: presence.providerKey } }, select: { id: true } });
      await createPalworldPresenceEvent(transaction, server, presence, identity?.id ?? null, "PLAYER_LEFT", observedAt, presence.lastObservedAt, presence.firstObservedAt);
    }
    await transaction.serverPlayerPresence.update({ where: { serverId_providerKey: { serverId: server.id, providerKey: presence.providerKey } }, data: { present: false } });
  }
}

async function synchronizePalworldKnownPlayers(transaction: PresenceTransaction, server: MonitoredServer, players: AgentPlayerObservation[], observedAt: Date) {
  for (const player of players) {
    const matched = player.externalProvider === "STEAM" && player.externalAccountId
      ? await transaction.playerIdentity.findFirst({ where: { gameType: "PALWORLD", externalProvider: "STEAM", externalAccountId: player.externalAccountId }, select: { id: true } })
      : null;
    const identity = matched
      ? await transaction.playerIdentity.update({ where: { id: matched.id }, data: { displayName: player.displayName, serverId: server.id }, select: { id: true, userId: true } })
      : await transaction.playerIdentity.upsert({
        where: { gameType_providerKey: { gameType: "PALWORLD", providerKey: player.providerKey } },
        create: { gameType: "PALWORLD", providerKey: player.providerKey, displayName: player.displayName, serverId: server.id, ...(player.externalProvider === "STEAM" && player.externalAccountId ? { externalProvider: "STEAM" as const, externalAccountId: player.externalAccountId } : {}) },
        update: { displayName: player.displayName, serverId: server.id, ...(player.externalProvider === "STEAM" && player.externalAccountId ? { externalProvider: "STEAM" as const, externalAccountId: player.externalAccountId } : {}) },
        select: { id: true, userId: true },
      });
    if (!identity.userId && player.externalProvider === "STEAM" && player.externalAccountId) await autoLinkVerifiedSteamIdentity(transaction, identity.id, player.externalAccountId, observedAt);
  }
}

export async function autoLinkVerifiedSteamIdentity(transaction: PresenceTransaction, identityId: string, steamId: string, observedAt: Date) {
  const account = await transaction.userSocialAccount.findFirst({ where: { platform: "STEAM", providerAccountId: steamId, verifiedAt: { not: null } }, select: { userId: true } });
  if (!account) return;
  const identity = await transaction.playerIdentity.findFirst({ where: { id: identityId, userId: null, externalProvider: "STEAM", externalAccountId: steamId }, select: { id: true } });
  if (!identity) return;
  await grantIdentityOwnership(transaction, {
    playerIdentityId: identity.id,
    userId: account.userId,
    actorUserId: null,
    source: "WORKER_AUTO_LINK",
    reason: "Ownership proved by an observed SteamID64 matching a verified Habitat account.",
  }, observedAt);
  await transaction.playerIdentityClaim.updateMany({ where: { playerIdentityId: identityId, userId: account.userId, status: "PENDING" }, data: { status: "APPROVED", resolvedAt: observedAt, resolvedByUserId: account.userId, resolutionNote: "Automatically verified by linked SteamID64." } });
  await transaction.playerIdentityClaim.updateMany({ where: { playerIdentityId: identityId, userId: { not: account.userId }, status: "PENDING" }, data: { status: "REJECTED", resolvedAt: observedAt, resolutionNote: "Identity ownership was verified through a linked Steam account." } });
}

async function createPalworldPresenceEvent(transaction: PresenceTransaction, server: MonitoredServer, player: { providerKey: string; displayName: string }, playerIdentityId: string | null, eventType: "PLAYER_JOINED" | "PLAYER_LEFT", observedAt: Date, priorObservedAt?: Date, sessionStartedAt?: Date) {
  const occurrence = priorObservedAt ?? observedAt;
  const durationSeconds = eventType === "PLAYER_LEFT" && priorObservedAt && sessionStartedAt ? Math.max(0, Math.min(43_200, Math.floor((priorObservedAt.getTime() - sessionStartedAt.getTime()) / 1_000))) : null;
  const presenceEvent = await transaction.serverEvent.upsert({
    where: { dedupeKey: `palworld:${eventType}:${server.id}:${player.providerKey}:${occurrence.toISOString()}` },
    create: {
      serverId: server.id,
      gameType: server.gameType as never,
      eventType,
      occurredAt: observedAt,
      actorText: player.displayName,
      playerIdentityId,
      valueNumber: durationSeconds,
      source: "PALWORLD_REST",
      sourceConfidence: 100,
      dedupeKey: `palworld:${eventType}:${server.id}:${player.providerKey}:${occurrence.toISOString()}`,
      metadata: { providerKey: player.providerKey, observedBy: "player_list_snapshot", ...(durationSeconds !== null ? { durationSeconds } : {}) },
    },
    update: {},
  });
  await evaluateAchievementsForEvent(transaction, presenceEvent.id);
  await evaluateRecordsForEvent(transaction, presenceEvent.id);
  await processProgressionForEvent(transaction, presenceEvent.id);
}

function hasPlayerPresenceBaseline(details: unknown): boolean {
  return Boolean(details && typeof details === "object" && "playerPresenceInitialized" in details && (details as { playerPresenceInitialized?: unknown }).playerPresenceInitialized === true);
}

const updatingSettleTimeoutMs = 3_600_000;

export function settleTransitionalDesiredState(server: MonitoredServer, status: AgentServerStatus, observedAt: Date): ServerState {
  const running = status.process.running;
  if (server.desiredState === "STOPPING" && !running) return "SLEEPING";
  if (server.desiredState === "STARTING" && running) return "ONLINE";
  if (server.desiredState === "UPDATING") {
    if (running) return "ONLINE";
    if (server.lastStateChangeAt && observedAt.getTime() - server.lastStateChangeAt.getTime() > updatingSettleTimeoutMs) return "SLEEPING";
  }
  return server.desiredState;
}

export function resolveDesiredState(currentDesiredState: ServerState, status: AgentServerStatus, consecutiveRunning = 2): ServerState {
  return status.process.running && consecutiveRunning >= 2 && currentDesiredState === "SLEEPING" ? "ONLINE" : currentDesiredState;
}

function parseObservedAt(value: string): Date {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

function parseNullableDate(value: string | null): Date | null {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function toBigInt(value: number | null | undefined): bigint | null {
  return value !== null && value !== undefined && Number.isSafeInteger(value) && value >= 0 ? BigInt(value) : null;
}
