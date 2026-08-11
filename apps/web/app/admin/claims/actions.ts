"use server";

import "@/lib/environment";
import { getPrismaClient } from "@habitat/db/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole } from "@/lib/authorization";

const db = getPrismaClient();
const decisionSchema = z.object({ claimId: z.string().uuid(), decision: z.enum(["APPROVED", "REJECTED"]) });

export async function resolveIdentityClaim(formData: FormData) {
  const admin = await requireRole("ADMIN");
  const parsed = decisionSchema.safeParse({ claimId: formData.get("claimId"), decision: formData.get("decision") });
  if (!parsed.success) throw new Error("Invalid identity claim decision.");

  await db.$transaction(async (transaction) => {
    const claim = await transaction.playerIdentityClaim.findUnique({ where: { id: parsed.data.claimId }, include: { playerIdentity: { select: { id: true } } } });
    if (!claim || claim.status !== "PENDING") throw new Error("This claim has already been resolved.");
    if (parsed.data.decision === "APPROVED") {
      const assigned = await transaction.playerIdentity.updateMany({ where: { id: claim.playerIdentity.id, userId: null }, data: { userId: claim.userId, verifiedAt: new Date() } });
      if (assigned.count !== 1) throw new Error("This identity has already been claimed.");
      await transaction.identityRewardReconciliation.upsert({ where: { playerIdentityId: claim.playerIdentity.id }, create: { playerIdentityId: claim.playerIdentity.id, userId: claim.userId }, update: { userId: claim.userId, completedAt: null, lastError: null } });
      await transaction.playerIdentityClaim.update({ where: { id: claim.id }, data: { status: "APPROVED", resolvedAt: new Date(), resolvedByUserId: admin.id } });
      await transaction.playerIdentityClaim.updateMany({ where: { playerIdentityId: claim.playerIdentity.id, status: "PENDING", id: { not: claim.id } }, data: { status: "REJECTED", resolvedAt: new Date(), resolvedByUserId: admin.id, resolutionNote: "Identity approved for another member." } });
    } else {
      await transaction.playerIdentityClaim.update({ where: { id: claim.id }, data: { status: "REJECTED", resolvedAt: new Date(), resolvedByUserId: admin.id } });
    }
    await transaction.auditLog.create({ data: { actorUserId: admin.id, action: `PLAYER_IDENTITY_CLAIM_${parsed.data.decision}`, entityType: "PlayerIdentityClaim", entityId: claim.id, after: { playerIdentityId: claim.playerIdentity.id, claimantUserId: claim.userId } } });
  });

  revalidatePath("/admin/claims");
  revalidatePath("/profile");
  revalidatePath("/profile/identities");
  revalidatePath("/leaderboards");
}
