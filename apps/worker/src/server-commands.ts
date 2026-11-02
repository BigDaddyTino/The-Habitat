import { getPrismaClient } from "@habitat/db/client";
import type { AgentServerAction, AgentServerActionResult, AgentUpdateStatus } from "@habitat/shared";
import { AgentActionError } from "./agent-client.js";

export type QueuedServerCommand = { id: string; serverKey: string; action: AgentServerAction };

export type ServerCommandRepository = {
  sweepStaleDispatched(): Promise<number>;
  findAuthorized(): Promise<QueuedServerCommand[]>;
  findRunningUpdates(): Promise<Array<QueuedServerCommand & { operationId: string }>>;
  updateStarted(commandId: string, result: AgentServerActionResult): Promise<void>;
  updateProgress(commandId: string, status: AgentUpdateStatus): Promise<void>;
  claim(commandId: string): Promise<boolean>;
  succeeded(commandId: string, result: AgentServerActionResult): Promise<void>;
  failed(commandId: string, errorCode: string, details?: Record<string, unknown>): Promise<void>;
  deferForRetry(commandId: string): Promise<"deferred" | "exhausted">;
};

export type ServerActionDispatcher = { requestServerAction(key: string, action: AgentServerAction): Promise<AgentServerActionResult>; readUpdateStatus?(key: string): Promise<AgentUpdateStatus> };

const actionTimeoutMs = 480_000;
const staleDispatchGraceMs = 60_000;
const unreachableRetryWindowMs = 600_000;
const updateTimeoutMs = 90 * 60_000;

export async function dispatchAuthorizedServerCommands(repository: ServerCommandRepository, dispatcher: ServerActionDispatcher): Promise<{ dispatched: number; succeeded: number; failed: number }> {
  try {
    const swept = await repository.sweepStaleDispatched();
    if (swept > 0) console.warn(`[server-commands] ${swept} stale dispatched command${swept === 1 ? "" : "s"} marked TIMED_OUT.`);
  } catch (error) {
    console.error("[server-commands] stale dispatch sweep failed:", error instanceof Error ? error.message : String(error));
  }
  let dispatched = 0;
  let succeeded = 0;
  let failed = 0;
  for (const command of await repository.findRunningUpdates()) {
    try {
      if (!dispatcher.readUpdateStatus) throw new Error("Agent update status support is required");
      const status = await dispatcher.readUpdateStatus(command.serverKey);
      if (status.operationId !== command.operationId) {
        await repository.failed(command.id, "update_operation_mismatch");
        failed += 1;
        continue;
      }
      await repository.updateProgress(command.id, status);
      if (status.phase === "SUCCEEDED") succeeded += 1;
      if (status.phase === "FAILED") failed += 1;
    } catch (error) {
      // Poll again without re-sending a mutating operation. The durable deadline
      // eventually exposes an unknown outcome if the agent cannot be reached.
      console.error(`[server-commands] update status unavailable for ${command.id}:`, error instanceof Error ? error.message : String(error));
    }
  }
  for (const command of await repository.findAuthorized()) {
    if (!await repository.claim(command.id)) continue;
    dispatched += 1;
    try {
      const result = await dispatcher.requestServerAction(command.serverKey, command.action);
      if (!result.accepted) {
        await repository.failed(command.id, "operation_conflict", { serviceState: result.serviceState, detail: result.detail });
        failed += 1;
        continue;
      }
      if (command.action === "update") {
        if (result.detail !== "update_started" || !result.operationId) throw new Error("Agent did not return a tracked update operation");
        await repository.updateStarted(command.id, result);
      } else {
        await repository.succeeded(command.id, result);
        succeeded += 1;
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (error instanceof AgentActionError) {
        await repository.failed(command.id, error.code, { agentHttpStatus: error.httpStatus });
        failed += 1;
        continue;
      }
      const failure = classifyDispatchError(error);
      if (failure === "connection") {
        console.error(`[server-commands] agent unreachable while dispatching command ${command.id}:`, message);
        const outcome = await repository.deferForRetry(command.id);
        if (outcome === "exhausted") failed += 1;
        continue;
      }
      if (failure === "timeout") {
        console.error(`[server-commands] agent action timed out after send for command ${command.id}:`, message);
        await repository.failed(command.id, "agent_timeout_outcome_unknown");
        failed += 1;
        continue;
      }
      console.error(`[server-commands] agent action failed for command ${command.id}:`, message);
      await repository.failed(command.id, "agent_action_unavailable");
      failed += 1;
    }
  }
  return { dispatched, succeeded, failed };
}

function classifyDispatchError(error: unknown): "connection" | "timeout" | "other" {
  if (!(error instanceof Error)) return "other";
  if (error.name === "AbortError" || error.name === "TimeoutError") return "timeout";
  const cause = (error as { cause?: unknown }).cause;
  const causeCode = cause && typeof cause === "object" && "code" in cause ? String((cause as { code?: unknown }).code) : null;
  if (causeCode !== null && ["ECONNREFUSED", "ENOTFOUND", "EHOSTUNREACH"].includes(causeCode)) return "connection";
  // A generic fetch failure may occur after the request reached the agent.
  // Only a proven pre-connect failure is safe to retry automatically.
  return "other";
}

export function createPostgresServerCommandRepository(): ServerCommandRepository {
  const db = getPrismaClient();
  const repository: ServerCommandRepository = {
    async sweepStaleDispatched() {
      const cutoff = new Date(Date.now() - (actionTimeoutMs + staleDispatchGraceMs));
      const stale = await db.serverCommand.findMany({ where: { OR: [
        { status: "DISPATCHED", dispatchedAt: { lt: cutoff } },
        { status: "RUNNING", action: "UPDATE", startedAt: { lt: new Date(Date.now() - updateTimeoutMs) } },
      ] }, select: { id: true, status: true, action: true, serverId: true } });
      let swept = 0;
      for (const command of stale) {
        const errorCode = command.status === "RUNNING" ? "update_timeout_outcome_unknown" : "dispatch_timed_out";
        const updated = await db.serverCommand.updateMany({ where: { id: command.id, status: command.status }, data: { status: "TIMED_OUT", completedAt: new Date(), errorCode } });
        if (updated.count !== 1) continue;
        await db.serverCommandAudit.create({ data: { serverCommandId: command.id, status: "TIMED_OUT", details: { errorCode, dispatcher: "HABITAT_WORKER" } } });
        if (command.action === "UPDATE") await db.gameServer.update({ where: { id: command.serverId }, data: { desiredState: "ONLINE" } });
        swept += 1;
      }
      return swept;
    },
    async findAuthorized() {
      const commands = await db.serverCommand.findMany({
        where: { status: "AUTHORIZED" },
        orderBy: { requestedAt: "asc" },
        take: 12,
        include: { server: { select: { slug: true } } },
      });
      return commands.map((command) => ({ id: command.id, serverKey: command.server.slug, action: command.action.toLowerCase() as AgentServerAction }));
    },
    async claim(commandId) {
      return db.$transaction(async (transaction) => {
        // Serialize claim decisions across workers: one operation per world and
        // one update across the shared SteamCMD installation at a time.
        await transaction.$queryRaw`SELECT pg_advisory_xact_lock(72401629)::text`;
        const command = await transaction.serverCommand.findUnique({ where: { id: commandId }, select: { status: true, action: true, serverId: true } });
        if (!command || command.status !== "AUTHORIZED") return false;
        const active = await transaction.serverCommand.findFirst({ where: { id: { not: commandId }, status: { in: ["DISPATCHED", "RUNNING"] }, OR: [{ serverId: command.serverId }, ...(command.action === "UPDATE" ? [{ action: "UPDATE" as const }] : [])] }, select: { id: true } });
        if (active) return false;
        const now = new Date();
        const claimed = await transaction.serverCommand.updateMany({ where: { id: commandId, status: "AUTHORIZED" }, data: { status: "DISPATCHED", dispatchedAt: now, startedAt: now } });
        if (claimed.count !== 1) return false;
        await transaction.serverCommandAudit.create({ data: { serverCommandId: commandId, status: "DISPATCHED", details: { dispatcher: "HABITAT_WORKER" } } });
        return true;
      });
    },
    async findRunningUpdates() {
      const commands = await db.serverCommand.findMany({ where: { status: "RUNNING", action: "UPDATE" }, include: { server: { select: { slug: true } } } });
      return commands.flatMap((command) => {
        const result = command.result as { operationId?: unknown } | null;
        return typeof result?.operationId === "string" ? [{ id: command.id, serverKey: command.server.slug, action: "update" as const, operationId: result.operationId }] : [];
      });
    },
    async updateStarted(commandId, result) {
      await db.$transaction(async (transaction) => {
        const updated = await transaction.serverCommand.updateMany({ where: { id: commandId, status: "DISPATCHED" }, data: { status: "RUNNING", result: { operationId: result.operationId!, phase: "QUEUED", executedAt: result.executedAt } } });
        if (updated.count !== 1) return;
        await transaction.serverCommandAudit.create({ data: { serverCommandId: commandId, status: "RUNNING", details: { operationId: result.operationId!, phase: "QUEUED" } } });
      });
    },
    async updateProgress(commandId, progress) {
      await db.$transaction(async (transaction) => {
        await transaction.$queryRaw`SELECT id FROM "ServerCommand" WHERE id = ${commandId}::uuid FOR UPDATE`;
        const command = await transaction.serverCommand.findUnique({ where: { id: commandId }, select: { status: true, serverId: true, result: true } });
        const previous = command?.result as { operationId?: unknown; phase?: unknown } | null;
        if (!command || command.status !== "RUNNING" || previous?.operationId !== progress.operationId) return;
        if (previous.phase === progress.phase) return;
        const terminal = progress.phase === "SUCCEEDED" || progress.phase === "FAILED";
        const status = terminal ? progress.phase as "SUCCEEDED" | "FAILED" : "RUNNING";
        await transaction.serverCommand.update({ where: { id: commandId }, data: { status, result: { ...progress }, completedAt: terminal ? new Date() : null, errorCode: progress.errorCode } });
        await transaction.serverCommandAudit.create({ data: { serverCommandId: commandId, status, details: { ...progress } } });
        const desiredState = progress.phase === "STOPPING" ? "STOPPING" : progress.phase === "UPDATING" ? "UPDATING" : progress.phase === "STARTING" ? "STARTING" : "ONLINE";
        await transaction.gameServer.update({ where: { id: command.serverId }, data: { desiredState } });
      });
    },
    async succeeded(commandId, result) {
      const now = new Date();
      const command = await db.serverCommand.findUniqueOrThrow({ where: { id: commandId }, select: { serverId: true, action: true } });
      const desiredState = command.action === "STOP" ? "SLEEPING" : "ONLINE";
      await db.$transaction([
        db.serverCommand.update({ where: { id: commandId }, data: { status: "SUCCEEDED", completedAt: now, result: { action: result.action, executedAt: result.executedAt, serviceState: result.serviceState, detail: result.detail } } }),
        db.serverCommandAudit.create({ data: { serverCommandId: commandId, status: "SUCCEEDED", details: { serviceState: result.serviceState, detail: result.detail } } }),
        db.gameServer.update({ where: { id: command.serverId }, data: { desiredState } }),
      ]);
    },
    async failed(commandId, errorCode, details) {
      const now = new Date();
      const command = await db.serverCommand.findUniqueOrThrow({ where: { id: commandId }, select: { serverId: true, action: true } });
      const desiredState = "ONLINE";
      await db.$transaction([
        db.serverCommand.update({ where: { id: commandId }, data: { status: "FAILED", completedAt: now, errorCode, result: details as never } }),
        db.serverCommandAudit.create({ data: { serverCommandId: commandId, status: "FAILED", details: { errorCode, ...details } } }),
        db.gameServer.update({ where: { id: command.serverId }, data: { desiredState } }),
      ]);
    },
    async deferForRetry(commandId) {
      const command = await db.serverCommand.findUniqueOrThrow({ where: { id: commandId }, select: { authorizedAt: true } });
      if (!command.authorizedAt || Date.now() - command.authorizedAt.getTime() > unreachableRetryWindowMs) {
        await repository.failed(commandId, "agent_unreachable_retries_exhausted");
        return "exhausted";
      }
      await db.$transaction([
        db.serverCommand.updateMany({ where: { id: commandId, status: "DISPATCHED" }, data: { status: "AUTHORIZED" } }),
        db.serverCommandAudit.create({ data: { serverCommandId: commandId, status: "AUTHORIZED", details: { reason: "agent_unreachable_retry", dispatcher: "HABITAT_WORKER" } } }),
      ]);
      return "deferred";
    },
  };
  return repository;
}
