import { getPrismaClient } from "@habitat/db/client";
import type { AgentServerStatus, ServerState } from "@habitat/shared";
import { normalizeServerState } from "./state.js";

export type MonitoredServer = {
  id: string;
  slug: string;
  desiredState: ServerState;
  actualState: ServerState;
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
        select: { id: true, slug: true, desiredState: true, actualState: true },
      });
      return server ? toMonitoredServer(server) : null;
    },
    async findPreviouslyAgentMonitored() {
      const servers = await db.gameServer.findMany({
        where: {
          lastQueryAt: { not: null },
          runtimeState: { is: { processRunning: { not: null } } },
        },
        select: { id: true, slug: true, desiredState: true, actualState: true },
      });
      return servers.map(toMonitoredServer);
    },
    async saveObservation(server, status) {
      const observedAt = parseObservedAt(status.observedAt);
      const effectiveDesiredState = resolveDesiredState(server.desiredState, status);
      const decision = normalizeServerState(effectiveDesiredState, status);
      const version = status.query?.version ?? status.executable?.version ?? null;
      const stateChanged = server.actualState !== decision.state;
      const details = {
        source: "HABITAT_AGENT",
        agentKey: status.key,
        process: status.process,
        disk: status.disk,
        executable: status.executable,
        query: status.query,
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

function toMonitoredServer(server: { id: string; slug: string; desiredState: string; actualState: string }): MonitoredServer {
  return { id: server.id, slug: server.slug, desiredState: server.desiredState as ServerState, actualState: server.actualState as ServerState };
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
