import { getPrismaClient } from "@habitat/db/client";
import type { AgentServerAction, AgentServerActionResult } from "@habitat/shared";

export type QueuedServerCommand = { id: string; serverKey: string; action: AgentServerAction };

export type ServerCommandRepository = {
  findAuthorized(): Promise<QueuedServerCommand[]>;
  claim(commandId: string): Promise<boolean>;
  succeeded(commandId: string, result: AgentServerActionResult): Promise<void>;
  failed(commandId: string, errorCode: string, details?: Record<string, unknown>): Promise<void>;
};

export type ServerActionDispatcher = { requestServerAction(key: string, action: AgentServerAction): Promise<AgentServerActionResult> };

export async function dispatchAuthorizedServerCommands(repository: ServerCommandRepository, dispatcher: ServerActionDispatcher): Promise<{ dispatched: number; succeeded: number; failed: number }> {
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
    } catch {
      await repository.failed(command.id, "agent_action_unavailable");
      failed += 1;
    }
  }
  return { dispatched, succeeded, failed };
}

export function createPostgresServerCommandRepository(): ServerCommandRepository {
  const db = getPrismaClient();
  return {
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
      await db.$transaction([
        db.serverCommand.update({ where: { id: commandId }, data: { status: "SUCCEEDED", completedAt: now, result: { action: result.action, executedAt: result.executedAt, serviceState: result.serviceState, detail: result.detail } } }),
        db.serverCommandAudit.create({ data: { serverCommandId: commandId, status: "SUCCEEDED", details: { serviceState: result.serviceState, detail: result.detail } } }),
      ]);
    },
    async failed(commandId, errorCode, details) {
      const now = new Date();
      await db.$transaction([
        db.serverCommand.update({ where: { id: commandId }, data: { status: "FAILED", completedAt: now, errorCode, result: details as never } }),
        db.serverCommandAudit.create({ data: { serverCommandId: commandId, status: "FAILED", details: { errorCode, ...details } } }),
      ]);
    },
  };
}
