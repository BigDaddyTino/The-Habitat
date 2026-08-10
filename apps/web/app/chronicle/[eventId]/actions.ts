"use server";

import "@/lib/environment";
import { getPrismaClient } from "@habitat/db/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole } from "@/lib/authorization";

const db = getPrismaClient();
const reactionSchema = z.object({
  eventId: z.string().uuid(),
  reactionType: z.enum(["SKULL", "FIRE", "FACEPALM", "CROWN", "SKILL_ISSUE"]),
});

export async function toggleChronicleReaction(formData: FormData) {
  const actor = await requireRole("USER");
  const parsed = reactionSchema.safeParse({ eventId: formData.get("eventId"), reactionType: formData.get("reactionType") });
  if (!parsed.success) throw new Error("Invalid Chronicle reaction.");

  const event = await db.serverEvent.findUnique({ where: { id: parsed.data.eventId }, select: { id: true } });
  if (!event) throw new Error("Chronicle event not found.");

  const existing = await db.chronicleReaction.findUnique({
    where: { serverEventId_userId_reactionType: { serverEventId: event.id, userId: actor.id, reactionType: parsed.data.reactionType } },
    select: { id: true },
  });

  if (existing) {
    await db.$transaction([
      db.chronicleReaction.delete({ where: { id: existing.id } }),
      db.auditLog.create({ data: { actorUserId: actor.id, action: "CHRONICLE_REACTION_REMOVED", entityType: "ServerEvent", entityId: event.id, after: { reactionType: parsed.data.reactionType } } }),
    ]);
  } else {
    await db.$transaction([
      db.chronicleReaction.create({ data: { serverEventId: event.id, userId: actor.id, reactionType: parsed.data.reactionType } }),
      db.auditLog.create({ data: { actorUserId: actor.id, action: "CHRONICLE_REACTION_ADDED", entityType: "ServerEvent", entityId: event.id, after: { reactionType: parsed.data.reactionType } } }),
    ]);
  }

  revalidatePath("/chronicle");
  revalidatePath(`/chronicle/${event.id}`);
}
