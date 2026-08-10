"use server";

import "@/lib/environment";
import { getPrismaClient } from "@habitat/db/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole } from "@/lib/authorization";

const db = getPrismaClient();
const commandSchema = z.object({ serverId: z.string().uuid(), action: z.enum(["START", "STOP", "RESTART", "UPDATE"]), confirmation: z.string().trim().max(12) });

export async function requestServerCommand(formData: FormData) {
  const actor = await requireRole("ADMIN");
  const parsed = commandSchema.safeParse({ serverId: formData.get("serverId"), action: formData.get("action"), confirmation: formData.get("confirmation") ?? "" });
  if (!parsed.success) throw new Error("Invalid server command.");
  if (parsed.data.action !== "START" && parsed.data.confirmation !== parsed.data.action) throw new Error(`Type ${parsed.data.action} to authorize this command.`);
  const server = await db.gameServer.findUnique({ where: { id: parsed.data.serverId }, select: { id: true, displayName: true, controlEnabled: true, desiredState: true } });
  if (!server?.controlEnabled) throw new Error("Lifecycle controls are not enabled for this world.");
  const now = new Date();
  const requestedState = parsed.data.action === "START" ? "STARTING" : parsed.data.action === "STOP" || parsed.data.action === "RESTART" ? "STOPPING" : "UPDATING";
  await db.$transaction(async (transaction) => {
    const command = await transaction.serverCommand.create({ data: { serverId: server.id, requestedByUserId: actor.id, action: parsed.data.action, status: "AUTHORIZED", authorizedAt: now } });
    await transaction.serverCommandAudit.createMany({ data: [
      { serverCommandId: command.id, status: "REQUESTED", actorUserId: actor.id, details: { action: parsed.data.action, source: "HABITAT_ADMIN" } },
      { serverCommandId: command.id, status: "AUTHORIZED", actorUserId: actor.id, details: { source: "HABITAT_ADMIN" } },
    ] });
    await transaction.gameServer.update({ where: { id: server.id }, data: { desiredState: requestedState } });
    await transaction.auditLog.create({ data: { actorUserId: actor.id, action: "SERVER_COMMAND_AUTHORIZED", entityType: "ServerCommand", entityId: command.id, before: { desiredState: server.desiredState }, after: { serverId: server.id, serverName: server.displayName, action: parsed.data.action, desiredState: requestedState } } });
  });
  revalidatePath("/admin/operations");
}
