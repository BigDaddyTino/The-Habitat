"use server";

import "@/lib/environment";
import { getPrismaClient } from "@habitat/db/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole } from "@/lib/authorization";

const db = getPrismaClient();
const claimSchema = z.object({ playerIdentityId: z.string().uuid() });

export async function requestIdentityClaim(formData: FormData) {
  const user = await requireRole("USER");
  const parsed = claimSchema.safeParse({ playerIdentityId: formData.get("playerIdentityId") });
  if (!parsed.success) throw new Error("Invalid identity claim.");

  const identity = await db.playerIdentity.findUnique({ where: { id: parsed.data.playerIdentityId }, select: { id: true, userId: true } });
  if (!identity || identity.userId) throw new Error("This identity is no longer available to claim.");

  await db.$transaction([
    // A rejected claim can be filed again: administrator rollback rejects the
    // claim it reversed, and `update: {}` would otherwise strand the member on
    // a permanently rejected row they can never resubmit.
    db.playerIdentityClaim.upsert({
      where: { playerIdentityId_userId: { playerIdentityId: identity.id, userId: user.id } },
      create: { playerIdentityId: identity.id, userId: user.id },
      update: { status: "PENDING", requestedAt: new Date(), resolvedAt: null, resolvedByUserId: null, resolutionNote: null },
    }),
    db.auditLog.create({ data: { actorUserId: user.id, action: "PLAYER_IDENTITY_CLAIM_REQUESTED", entityType: "PlayerIdentity", entityId: identity.id } }),
  ]);

  revalidatePath("/profile");
  revalidatePath("/profile/identities");
  revalidatePath("/admin/claims");
}
