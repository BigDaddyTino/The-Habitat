import type { Prisma } from "@habitat/db/client";
import { grantIdentityOwnership } from "@habitat/identity";

/** Attaches every exact SteamID match and queues its already-recorded history for replay. */
export async function attachVerifiedSteamIdentities(transaction: Prisma.TransactionClient, userId: string, steamId: string, verifiedAt: Date) {
  const identities = await transaction.playerIdentity.findMany({
    where: { externalProvider: "STEAM", externalAccountId: steamId, userId: null },
    select: { id: true },
  });
  if (identities.length === 0) return 0;

  const identityIds = identities.map((identity) => identity.id);
  for (const playerIdentityId of identityIds) {
    await grantIdentityOwnership(transaction, {
      playerIdentityId,
      userId,
      actorUserId: userId,
      source: "STEAM_VERIFICATION",
      reason: "Ownership proved by linked SteamID64.",
    });
  }
  await transaction.playerIdentityClaim.updateMany({
    where: { playerIdentityId: { in: identityIds }, userId, status: "PENDING" },
    data: { status: "APPROVED", resolvedAt: verifiedAt, resolvedByUserId: userId, resolutionNote: "Automatically verified by linked SteamID64." },
  });
  await transaction.playerIdentityClaim.updateMany({
    where: { playerIdentityId: { in: identityIds }, userId: { not: userId }, status: "PENDING" },
    data: { status: "REJECTED", resolvedAt: verifiedAt, resolutionNote: "Identity ownership was verified through a linked Steam account." },
  });
  return identityIds.length;
}
