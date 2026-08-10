"use server";

import "@/lib/environment";
import { getPrismaClient } from "@habitat/db/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole } from "@/lib/authorization";

const db = getPrismaClient();
const wakeRequestSchema = z.object({ serverId: z.string().uuid() });

export async function requestWake(formData: FormData) {
  const user = await requireRole("USER");
  const parsed = wakeRequestSchema.safeParse({ serverId: formData.get("serverId") });
  if (!parsed.success) throw new Error("Invalid Habitat world.");
  const result = await db.$transaction(async (transaction) => {
    const server = await transaction.gameServer.findUnique({ where: { id: parsed.data.serverId }, select: { id: true, slug: true, displayName: true, gameType: true, enabled: true, actualState: true } });
    if (!server?.enabled || server.actualState !== "SLEEPING") throw new Error("Only intentionally sleeping worlds can receive a wake request.");
    let request = await transaction.wakeRequest.findFirst({ where: { serverId: server.id, status: "PENDING" }, select: { id: true } });
    if (!request) {
      try {
        request = await transaction.wakeRequest.create({ data: { serverId: server.id, requesterUserId: user.id }, select: { id: true } });
        const event = await transaction.serverEvent.create({ data: { serverId: server.id, gameType: server.gameType as never, eventType: "WAKE_REQUESTED", occurredAt: new Date(), actorText: user.name ?? "Habitat member", source: "HABITAT_PORTAL", sourceConfidence: 100, dedupeKey: `wake-request:${request.id}` } });
        const configurations = await transaction.discordGuildConfig.findMany({ where: { notificationsEnabled: true, notifyWakeRequest: true, announcementChannelId: { not: null } }, select: { id: true } });
        for (const configuration of configurations) {
          await transaction.discordNotification.upsert({ where: { dedupeKey: `discord:${configuration.id}:wake:${request.id}` }, create: { configId: configuration.id, serverEventId: event.id, kind: "WAKE_REQUEST", content: `**${user.name ?? "A Habitat member"}** asked to light the fire for **${server.displayName}**.`, dedupeKey: `discord:${configuration.id}:wake:${request.id}` }, update: {} });
        }
      } catch (error) {
        if (!(typeof error === "object" && error !== null && "code" in error && error.code === "P2002")) throw error;
        request = await transaction.wakeRequest.findFirst({ where: { serverId: server.id, status: "PENDING" }, select: { id: true } });
        if (!request) throw error;
      }
    }
    await transaction.wakeVote.upsert({ where: { wakeRequestId_userId: { wakeRequestId: request.id, userId: user.id } }, create: { wakeRequestId: request.id, userId: user.id }, update: {} });
    await transaction.auditLog.create({ data: { actorUserId: user.id, action: "WAKE_REQUEST_SUPPORTED", entityType: "WakeRequest", entityId: request.id, after: { serverId: server.id } } });
    return { slug: server.slug };
  });
  revalidatePath(`/worlds/${result.slug}`);
  revalidatePath("/");
}
