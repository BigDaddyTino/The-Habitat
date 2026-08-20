"use server";

import "@/lib/environment";
import { getPrismaClient } from "@habitat/db/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireRole } from "@/lib/authorization";
import { refusal } from "@/lib/writer-refusal";

const db = getPrismaClient();
const states = ["ONLINE", "STARTING", "STOPPING", "SLEEPING", "UPDATING", "DEGRADED", "DOWN_UNEXPECTEDLY", "UNKNOWN"] as const;

const metadataSchema = z.object({
  id: z.string().uuid(),
  displayName: z.string().trim().min(1).max(80),
  worldName: z.string().trim().min(1).max(100),
  description: z.preprocess((value) => value === "" ? null : value, z.string().trim().max(500).nullable()),
  maxPlayers: z.preprocess((value) => value === "" ? null : value, z.coerce.number().int().min(1).max(256).nullable()),
  desiredState: z.enum(states),
  enabled: z.boolean(),
  controlEnabled: z.boolean(),
});

export async function updateServerMetadata(formData: FormData) {
  const actor = await requireRole("ADMIN");
  const parsed = metadataSchema.safeParse({
    id: formData.get("id"),
    displayName: formData.get("displayName"),
    worldName: formData.get("worldName"),
    description: formData.get("description"),
    maxPlayers: formData.get("maxPlayers"),
    desiredState: formData.get("desiredState"),
    enabled: formData.get("enabled") === "on",
    controlEnabled: formData.get("controlEnabled") === "on",
  });

  if (!parsed.success) throw refusal("Invalid server metadata.");

  const existing = await db.gameServer.findUniqueOrThrow({ where: { id: parsed.data.id } });
  const metadata = {
    displayName: parsed.data.displayName,
    worldName: parsed.data.worldName,
    description: parsed.data.description,
    maxPlayers: parsed.data.maxPlayers,
    desiredState: parsed.data.desiredState,
    enabled: parsed.data.enabled,
    controlEnabled: parsed.data.controlEnabled,
  };

  await db.$transaction([
    db.gameServer.update({ where: { id: existing.id }, data: metadata }),
    db.auditLog.create({
      data: {
        actorUserId: actor.id,
        action: "SERVER_METADATA_UPDATED",
        entityType: "GameServer",
        entityId: existing.id,
        before: {
          displayName: existing.displayName,
          worldName: existing.worldName,
          description: existing.description,
          maxPlayers: existing.maxPlayers,
          desiredState: existing.desiredState,
          enabled: existing.enabled,
          controlEnabled: existing.controlEnabled,
        },
        after: metadata,
      },
    }),
  ]);

  revalidatePath("/");
  revalidatePath("/worlds");
  revalidatePath(`/worlds/${existing.slug}`);
  revalidatePath("/departure-board");
  revalidatePath("/admin/servers");
  redirect("/admin/servers");
}
