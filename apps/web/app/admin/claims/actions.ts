"use server";

import "@/lib/environment";
import { getPrismaClient } from "@habitat/db/client";
import { detectClaimConflicts, grantIdentityOwnership, hasBlockingConflict, previewOwnershipChange, requiresTypedConfirmation, revokeIdentityOwnership } from "@habitat/identity";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireRole } from "@/lib/authorization";
import { approvalConfirmationPhrase, rollbackConfirmationPhrase } from "@/lib/claim-center";

const db = getPrismaClient();

const decisionSchema = z.object({
  claimId: z.string().uuid(),
  decision: z.enum(["APPROVED", "REJECTED"]),
  confirmation: z.string().max(40).optional(),
  note: z.string().max(300).optional(),
});

const rollbackSchema = z.object({
  playerIdentityId: z.string().uuid(),
  ownershipTransactionId: z.string().uuid().optional(),
  reason: z.string().trim().min(8).max(300),
  confirmation: z.string().max(40),
});

export async function resolveIdentityClaim(formData: FormData) {
  const admin = await requireRole("ADMIN");
  const parsed = decisionSchema.safeParse({
    claimId: formData.get("claimId"),
    decision: formData.get("decision"),
    confirmation: formData.get("confirmation") ?? undefined,
    note: formData.get("note") ?? undefined,
  });
  if (!parsed.success) redirect("/admin/claims?error=invalid_decision");

  try {
    await db.$transaction(async (transaction) => {
      const claim = await transaction.playerIdentityClaim.findUnique({ where: { id: parsed.data.claimId }, select: { id: true, status: true, userId: true, playerIdentityId: true } });
      if (!claim || claim.status !== "PENDING") throw new ClaimActionError("already_resolved");

      if (parsed.data.decision === "REJECTED") {
        await transaction.playerIdentityClaim.update({ where: { id: claim.id }, data: { status: "REJECTED", resolvedAt: new Date(), resolvedByUserId: admin.id, resolutionNote: parsed.data.note?.trim() || null } });
        await transaction.auditLog.create({ data: { actorUserId: admin.id, action: "PLAYER_IDENTITY_CLAIM_REJECTED", entityType: "PlayerIdentityClaim", entityId: claim.id, after: { playerIdentityId: claim.playerIdentityId, claimantUserId: claim.userId } } });
        return;
      }

      // Conflicts are re-detected inside the write transaction: the preview an
      // administrator read may be minutes old, and ownership can move underneath it.
      const conflicts = await detectClaimConflicts(transaction, { playerIdentityId: claim.playerIdentityId, userId: claim.userId });
      if (hasBlockingConflict(conflicts)) throw new ClaimActionError("blocked_by_conflict");
      if (requiresTypedConfirmation(conflicts) && parsed.data.confirmation?.trim().toUpperCase() !== approvalConfirmationPhrase) throw new ClaimActionError("confirmation_required");

      const impact = await previewOwnershipChange(transaction, { playerIdentityId: claim.playerIdentityId, userId: claim.userId, direction: "GRANT" });
      await grantIdentityOwnership(transaction, {
        playerIdentityId: claim.playerIdentityId,
        userId: claim.userId,
        actorUserId: admin.id,
        source: "ADMIN_CLAIM_APPROVAL",
        claimId: claim.id,
        reason: parsed.data.note?.trim() || null,
        projectedImpact: { headline: impact.headline, delta: impact.delta, conflicts: conflicts.map((conflict) => ({ code: conflict.code, severity: conflict.severity })) },
      });

      await transaction.playerIdentityClaim.update({ where: { id: claim.id }, data: { status: "APPROVED", resolvedAt: new Date(), resolvedByUserId: admin.id, resolutionNote: parsed.data.note?.trim() || null } });
      await transaction.playerIdentityClaim.updateMany({
        where: { playerIdentityId: claim.playerIdentityId, status: "PENDING", id: { not: claim.id } },
        data: { status: "REJECTED", resolvedAt: new Date(), resolvedByUserId: admin.id, resolutionNote: "Identity approved for another member." },
      });
      await transaction.auditLog.create({ data: { actorUserId: admin.id, action: "PLAYER_IDENTITY_CLAIM_APPROVED", entityType: "PlayerIdentityClaim", entityId: claim.id, after: { playerIdentityId: claim.playerIdentityId, claimantUserId: claim.userId, projectedHeadline: impact.headline } } });
    });
  } catch (error) {
    redirect(`/admin/claims?error=${errorCode(error)}`);
  }

  revalidateOwnershipSurfaces();
  redirect(`/admin/claims?notice=${parsed.data.decision === "APPROVED" ? "claim_approved" : "claim_rejected"}`);
}

/**
 * Reverses an ownership grant: the identity is detached and every retroactive
 * effect reconciliation applied is unwound in the same transaction.
 */
export async function rollbackIdentityOwnership(formData: FormData) {
  const admin = await requireRole("ADMIN");
  const parsed = rollbackSchema.safeParse({
    playerIdentityId: formData.get("playerIdentityId"),
    ownershipTransactionId: formData.get("ownershipTransactionId") || undefined,
    reason: formData.get("reason"),
    confirmation: formData.get("confirmation"),
  });
  if (!parsed.success) {
    const identityId = String(formData.get("playerIdentityId") ?? "");
    redirect(`/admin/claims/${identityId}?error=invalid_rollback`);
  }
  if (parsed.data.confirmation.trim().toUpperCase() !== rollbackConfirmationPhrase) {
    redirect(`/admin/claims/${parsed.data.playerIdentityId}?error=confirmation_required`);
  }

  try {
    await db.$transaction(async (transaction) => {
      await revokeIdentityOwnership(transaction, {
        playerIdentityId: parsed.data.playerIdentityId,
        actorUserId: admin.id,
        source: "ADMIN_REVOCATION",
        reason: parsed.data.reason.trim(),
        reversesTransactionId: parsed.data.ownershipTransactionId ?? null,
      });
    });
  } catch (error) {
    redirect(`/admin/claims/${parsed.data.playerIdentityId}?error=${errorCode(error)}`);
  }

  revalidateOwnershipSurfaces();
  redirect(`/admin/claims/${parsed.data.playerIdentityId}?notice=ownership_rolled_back`);
}

class ClaimActionError extends Error {
  constructor(public readonly code: string) {
    super(code);
  }
}

function errorCode(error: unknown): string {
  if (error instanceof ClaimActionError) return error.code;
  // `redirect` throws a control-flow signal that must not be swallowed here.
  if (error && typeof error === "object" && "digest" in error && String((error as { digest: unknown }).digest).startsWith("NEXT_REDIRECT")) throw error;
  return "rollback_failed";
}

function revalidateOwnershipSurfaces() {
  revalidatePath("/admin/claims");
  revalidatePath("/profile");
  revalidatePath("/profile/identities");
  revalidatePath("/leaderboards");
  revalidatePath("/members");
}
