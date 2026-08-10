import { getPrismaClient, type Prisma } from "@habitat/db/client";
import type { AgentServerStatus, ServerState } from "@habitat/shared";
import { evaluateAchievementsForEvent } from "./achievements.js";
import { evaluateRecordsForEvent } from "./records.js";
import { queueDiscordNotification } from "./discord-notifications.js";
import { normalizeServerState } from "./state.js";

export type MonitoredServer = {
  id: string;
  slug: string;
  displayName: string;
  gameType: string;
  desiredState: ServerState;
  actualState: ServerState;
  playerPresenceInitialized: boolean;
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

export async function runMonitoringCycle(repository: MonitoringRepository, agent: AgentPoller, now = new Date()): Promise<MonitoringCycleResult> {
  let statuses: Array<{ key: string; status: AgentServerStatus | null }>;
  try {
    statuses = await agent.pollStatuses();
  } catch {
    const previouslyMonitored = await repository.findPreviouslyAgentMonitored();
    await Promise.all(previouslyMonitored.map((server) => repository.markAgentUnavailable(server, "agent_unavailable", now)));
    return { observed: 0, unknown: previouslyMonitored.length, ignored: 0, agentAvailable: false };
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
      await repository.markAgentUnavailable(server, "agent_status_unavailable", now);
      unknown += 1;
      continue;
    }
    await repository.saveObservation(server, entry.status);
    observed += 1;
  }
  return { observed, unknown, ignored, agentAvailable: true };
}

export function createPostgresMonitoringRepository(): MonitoringRepository {
  const db = getPrismaClient();
  return {
    async findBySlug(slug) {
      const server = await db.gameServer.findUnique({
        where: { slug },
        select: { id: true, slug: true, displayName: true, gameType: true, desiredState: true, actualState: true, runtimeState: { select: { details: true } } },
      });
      return server ? toMonitoredServer(server) : null;
    },
    async findPreviouslyAgentMonitored() {
      const servers = await db.gameServer.findMany({
        where: {
          lastQueryAt: { not: null },
          runtimeState: { is: { processRunning: { not: null } } },
        },
        select: { id: true, slug: true, displayName: true, gameType: true, desiredState: true, actualState: true, runtimeState: { select: { details: true } } },
      });
      return servers.map(toMonitoredServer);
    },
    async saveObservation(server, status) {
      const observedAt = parseObservedAt(status.observedAt);
      const effectiveDesiredState = resolveDesiredState(server.desiredState, status);
      const decision = normalizeServerState(effectiveDesiredState, status);
      const version = status.query?.version ?? status.executable?.version ?? null;
      const stateChanged = server.actualState !== decision.state;
      const palworldPlayers = server.gameType === "PALWORLD" && Array.isArray(status.query?.players) ? status.query.players : null;
      const details = {
        source: "HABITAT_AGENT",
        agentKey: status.key,
        process: status.process,
        disk: status.disk,
        executable: status.executable,
        query: status.query ? { ...status.query, players: status.query.players === null || status.query.players === undefined ? null : { available: true, count: status.query.players.length } } : null,
        log: status.log,
        playerPresenceInitialized: server.playerPresenceInitialized || palworldPlayers !== null,
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
          if (eventType) {
            const event = await transaction.serverEvent.create({
              data: {
                serverId: server.id,
                gameType: server.gameType as never,
                eventType,
                occurredAt: observedAt,
                source: "HABITAT_AGENT",
                sourceConfidence: 100,
                dedupeKey: `state:${server.id}:${decision.state}:${observedAt.toISOString()}`,
              },
            });
            const notification = stateNotification(server.displayName, eventType);
            if (notification) await queueDiscordNotification(transaction, { serverEventId: event.id, ...notification });
          }
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
        if (palworldPlayers !== null) {
          await synchronizePalworldPresence(transaction, server, palworldPlayers, observedAt);
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
        await transaction.serverRuntimeState.upsert({
          where: { serverId: server.id },
          create: { serverId: server.id, state: "UNKNOWN", observedAt, details: { source: "HABITAT_AGENT", agentAvailable: false, reason } },
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
            details: { source: "HABITAT_AGENT", agentAvailable: false, reason },
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

function toMonitoredServer(server: { id: string; slug: string; displayName: string; gameType: string; desiredState: string; actualState: string; runtimeState: { details: unknown } | null }): MonitoredServer {
  return { id: server.id, slug: server.slug, displayName: server.displayName, gameType: server.gameType, desiredState: server.desiredState as ServerState, actualState: server.actualState as ServerState, playerPresenceInitialized: hasPlayerPresenceBaseline(server.runtimeState?.details) };
}

async function synchronizePalworldPresence(transaction: PresenceTransaction, server: MonitoredServer, players: Array<{ providerKey: string; displayName: string }>, observedAt: Date) {
  const known = await transaction.serverPlayerPresence.findMany({ where: { serverId: server.id } });
  const knownByKey = new Map(known.map((presence) => [presence.providerKey, presence]));
  const observedKeys = new Set(players.map((player) => player.providerKey));

  for (const player of players) {
    const identity = await transaction.playerIdentity.upsert({
      where: { gameType_providerKey: { gameType: "PALWORLD", providerKey: player.providerKey } },
      create: { gameType: "PALWORLD", providerKey: player.providerKey, displayName: player.displayName, serverId: server.id },
      update: { displayName: player.displayName, serverId: server.id },
      select: { id: true },
    });
    const previous = knownByKey.get(player.providerKey);
    if (!previous) {
      await transaction.serverPlayerPresence.create({ data: { serverId: server.id, providerKey: player.providerKey, displayName: player.displayName, present: true, firstObservedAt: observedAt, lastObservedAt: observedAt } });
      if (server.playerPresenceInitialized) await createPalworldPresenceEvent(transaction, server, player, identity.id, "PLAYER_JOINED", observedAt);
      continue;
    }
    if (!previous.present) await createPalworldPresenceEvent(transaction, server, player, identity.id, "PLAYER_JOINED", observedAt);
    await transaction.serverPlayerPresence.update({ where: { serverId_providerKey: { serverId: server.id, providerKey: player.providerKey } }, data: { displayName: player.displayName, present: true, lastObservedAt: observedAt } });
  }

  if (!server.playerPresenceInitialized) return;
  for (const presence of known.filter((item) => item.present && !observedKeys.has(item.providerKey))) {
    const identity = await transaction.playerIdentity.findUnique({ where: { gameType_providerKey: { gameType: "PALWORLD", providerKey: presence.providerKey } }, select: { id: true } });
    await createPalworldPresenceEvent(transaction, server, presence, identity?.id ?? null, "PLAYER_LEFT", observedAt, presence.lastObservedAt);
    await transaction.serverPlayerPresence.update({ where: { serverId_providerKey: { serverId: server.id, providerKey: presence.providerKey } }, data: { present: false } });
  }
}

async function createPalworldPresenceEvent(transaction: PresenceTransaction, server: MonitoredServer, player: { providerKey: string; displayName: string }, playerIdentityId: string | null, eventType: "PLAYER_JOINED" | "PLAYER_LEFT", observedAt: Date, priorObservedAt?: Date) {
  const occurrence = priorObservedAt ?? observedAt;
  const presenceEvent = await transaction.serverEvent.upsert({
    where: { dedupeKey: `palworld:${eventType}:${server.id}:${player.providerKey}:${occurrence.toISOString()}` },
    create: {
      serverId: server.id,
      gameType: server.gameType as never,
      eventType,
      occurredAt: observedAt,
      actorText: player.displayName,
      playerIdentityId,
      source: "PALWORLD_REST",
      sourceConfidence: 100,
      dedupeKey: `palworld:${eventType}:${server.id}:${player.providerKey}:${occurrence.toISOString()}`,
      metadata: { providerKey: player.providerKey, observedBy: "player_list_snapshot" },
    },
    update: {},
  });
  await evaluateAchievementsForEvent(transaction, presenceEvent.id);
  await evaluateRecordsForEvent(transaction, presenceEvent.id);
}

function hasPlayerPresenceBaseline(details: unknown): boolean {
  return Boolean(details && typeof details === "object" && "playerPresenceInitialized" in details && (details as { playerPresenceInitialized?: unknown }).playerPresenceInitialized === true);
}

export function resolveDesiredState(currentDesiredState: ServerState, status: AgentServerStatus): ServerState {
  return status.process.running && currentDesiredState === "SLEEPING" ? "ONLINE" : currentDesiredState;
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
