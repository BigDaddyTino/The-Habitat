import type { Prisma } from "@habitat/db/client";

/**
 * The set of player identities a projection should treat as belonging to a
 * member. Everything in this package is expressed against a scope rather than
 * a user id, because that is what lets the same rule engine answer both "what
 * does this member have today" and "what would they have if this claim were
 * approved" without writing anything to the database.
 *
 * `identityIds` drives achievement evidence, which counts every owned identity.
 * `verifiedIdentityIds` drives playtime and XP, which additionally require a
 * proven identity — the same `verifiedAt` gate the progression engine applies.
 */
export type IdentityScope = {
  userId: string;
  identityIds: string[];
  verifiedIdentityIds: string[];
};

export async function currentIdentityScope(transaction: Prisma.TransactionClient, userId: string): Promise<IdentityScope> {
  const identities = await transaction.playerIdentity.findMany({ where: { userId }, select: { id: true, verifiedAt: true } });
  return {
    userId,
    identityIds: identities.map((identity) => identity.id),
    verifiedIdentityIds: identities.filter((identity) => identity.verifiedAt).map((identity) => identity.id),
  };
}

/** The scope a member would have once `identityId` is granted and verified. */
export function scopeWithIdentity(scope: IdentityScope, identityId: string): IdentityScope {
  if (scope.identityIds.includes(identityId)) return scope;
  return {
    userId: scope.userId,
    identityIds: [...scope.identityIds, identityId],
    verifiedIdentityIds: [...scope.verifiedIdentityIds, identityId],
  };
}

/** The scope a member would have once `identityId` is detached from them. */
export function scopeWithoutIdentity(scope: IdentityScope, identityId: string): IdentityScope {
  return {
    userId: scope.userId,
    identityIds: scope.identityIds.filter((id) => id !== identityId),
    verifiedIdentityIds: scope.verifiedIdentityIds.filter((id) => id !== identityId),
  };
}
