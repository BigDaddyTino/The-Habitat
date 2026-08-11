import { getPrismaClient } from "@habitat/db/client";
import type { AgentServerAction, AgentServerActionResult } from "@habitat/shared";

export type QueuedServerCommand = { id: string; serverKey: string; action: AgentServerAction };

export type ServerCommandRepository = {
  sweepStaleDispatched(): Promise<number>;
  findAuthorized(): Promise<QueuedServerCommand[]>;
  claim(commandId: string): Promise<boolean>;
  succeeded(commandId: string, result: AgentServerActionResult): Promise<void>;
  failed(commandId: string, errorCode: string, details?: Record<string, unknown>): Promise<void>;
  deferForRetry(commandId: string): Promise<"deferred" | "exhausted">;
};

export type ServerActionDispatcher = { requestServerAction(key: string, action: AgentServerAction): Promise<AgentServerActionResult> };

const actionTimeoutMs = 480_000;
const staleDispatchGraceMs = 60_000;
const unreachableRetryWindowMs = 600_000;

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
      await repository.succeeded(command.id, result);
      succeeded += 1;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
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
  if (causeCode === null && error.message.includes("fetch failed")) return "connection";
  return "other";
}

export function createPostgresServerCommandRepository(): ServerCommandRepository {
  const db = getPrismaClient();
  const repository: ServerCommandRepository = {
    async sweepStaleDispatched() {
      const cutoff = new Date(Date.now() - (actionTimeoutMs + staleDispatchGraceMs));
      const stale = await db.serverCommand.findMany({ where: { status: "DISPATCHED", dispatchedAt: { lt: cutoff } }, select: { id: true } });
      let swept = 0;
      for (const command of stale) {
        const updated = await db.serverCommand.updateMany({ where: { id: command.id, status: "DISPATCHED" }, data: { status: "TIMED_OUT", completedAt: new Date(), errorCode: "dispatch_timed_out" } });
        if (updated.count !== 1) continue;
        await db.serverCommandAudit.create({ data: { serverCommandId: command.id, status: "TIMED_OUT", details: { errorCode: "dispatch_timed_out", dispatcher: "HABITAT_WORKER" } } });
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
      const now = new Date();
      const claimed = await db.serverCommand.updateMany({ where: { id: commandId, status: "AUTHORIZED" }, data: { status: "DISPATCHED", dispatchedAt: now, startedAt: now } });
      if (claimed.count !== 1) return false;
      await db.serverCommandAudit.create({ data: { serverCommandId: commandId, status: "DISPATCHED", details: { dispatcher: "HABITAT_WORKER" } } });
      return true;
    },
    async succeeded(commandId, result) {
      const now = new Date();
      const command = await db.serverCommand.findUniqueOrThrow({ where: { id: commandId }, select: { serverId: true, action: true } });
      const desiredState = command.action === "STOP" ? "STOPPING" : command.action === "UPDATE" ? "UPDATING" : "STARTING";
      await db.$transaction([
        db.serverCommand.update({ where: { id: commandId }, data: { status: "SUCCEEDED", completedAt: now, result: { action: result.action, executedAt: result.executedAt, serviceState: result.serviceState, detail: result.detail } } }),
        db.serverCommandAudit.create({ data: { serverCommandId: commandId, status: "SUCCEEDED", details: { serviceState: result.serviceState, detail: result.detail } } }),
        db.gameServer.update({ where: { id: command.serverId }, data: { desiredState } }),
      ]);
    },
    async failed(commandId, errorCode, details) {
      const now = new Date();
      const command = await db.serverCommand.findUniqueOrThrow({ where: { id: commandId }, select: { serverId: true, action: true } });
      const desiredState = command.action === "STOP" ? "ONLINE" : command.action === "UPDATE" ? "SLEEPING" : "ONLINE";
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
