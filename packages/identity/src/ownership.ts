import type { Prisma } from "@habitat/db/client";
import { progressionForXp, verifiedPlaytimeXp } from "@habitat/shared";
import { ownershipSensitiveRuleTypes } from "./eligibility";
import { buildImpact, type OwnershipImpact } from "./impact";
import { loadProjectableDefinitions, projectLedger } from "./projection";
import { currentIdentityScope, scopeWithIdentity, scopeWithoutIdentity } from "./scope";

export type OwnershipSource = "ADMIN_CLAIM_APPROVAL" | "ADMIN_TRANSFER" | "ADMIN_REVOCATION" | "STEAM_VERIFICATION" | "WORKER_AUTO_LINK";

export type GrantInput = {
  playerIdentityId: string;
  userId: string;
  actorUserId: string | null;
  source: OwnershipSource;
  claimId?: string | null;
  reason?: string | null;
  projectedImpact?: unknown;
};

export type RevokeInput = {
  playerIdentityId: string;
  actorUserId: string | null;
  source: OwnershipSource;
  reason: string;
  /** The GRANT this revocation reverses, when rolling a specific claim back. */
  reversesTransactionId?: string | null;
};

/** What a revocation actually removed, stored on the ledger row for later inspection. */
export type AppliedRevocation = {
  headline: string;
  trackedHoursRemoved: number;
  xpRemoved: number;
  levelBefore: number;
  levelAfter: number;
  achievementsRevoked: { slug: string; name: string }[];
  titlesRevoked: string[];
  xpEntriesDeleted: number;
  recordHoldingsCleared: number;
  reconciliationJobsCleared: number;
};

/**
 * Assigns an identity to a member and writes the ownership ledger row that
 * makes the change reversible. The `userId: null` guard is the race defense:
 * two concurrent approvals cannot both win.
 */
export async function grantIdentityOwnership(transaction: Prisma.TransactionClient, input: GrantInput, now = new Date()) {
  const identity = await transaction.playerIdentity.findUnique({ where: { id: input.playerIdentityId }, select: { id: true, userId: true, displayName: true } });
  if (!identity) throw new Error("This identity no longer exists.");
  if (identity.userId === input.userId) throw new Error("This member already owns this identity.");

  const assigned = await transaction.playerIdentity.updateMany({ where: { id: input.playerIdentityId, userId: null }, data: { userId: input.userId, verifiedAt: now } });
  if (assigned.count !== 1) throw new Error("This identity has already been claimed.");

  await transaction.identityRewardReconciliation.upsert({
    where: { playerIdentityId: input.playerIdentityId },
    create: { playerIdentityId: input.playerIdentityId, userId: input.userId },
    update: { userId: input.userId, completedAt: null, lastError: null, queuedAt: now },
  });

  const ledgerEntry = await transaction.identityOwnershipTransaction.create({
    data: {
      playerIdentityId: input.playerIdentityId,
      action: "GRANT",
      source: input.source,
      toUserId: input.userId,
      claimId: input.claimId ?? null,
      actorUserId: input.actorUserId,
      reason: input.reason?.slice(0, 300) ?? null,
      projectedImpact: toJson(input.projectedImpact),
    },
    select: { id: true },
  });

  await transaction.auditLog.create({
    data: {
      actorUserId: input.actorUserId,
      action: "IDENTITY_OWNERSHIP_GRANTED",
      entityType: "PlayerIdentity",
      entityId: input.playerIdentityId,
      after: { ownershipTransactionId: ledgerEntry.id, userId: input.userId, source: input.source, identityName: identity.displayName },
    },
  });
  return ledgerEntry;
}

/**
 * Detaches an identity and unwinds everything reconciliation granted because of
 * it: playtime XP is trimmed back to the evidence that remains, achievements
 * that are no longer earned are revoked along with their rewards and titles,
 * and record holdings established through the identity are cleared.
 *
 * Achievements are re-evaluated rather than pattern-matched by source, because
 * an achievement may have been earned from several identities at once and must
 * survive if the remaining evidence still qualifies.
 */
export async function revokeIdentityOwnership(transaction: Prisma.TransactionClient, input: RevokeInput, now = new Date()) {
  const identity = await transaction.playerIdentity.findUnique({ where: { id: input.playerIdentityId }, select: { id: true, userId: true, displayName: true, gameType: true } });
  if (!identity) throw new Error("This identity no longer exists.");
  if (!identity.userId) throw new Error("This identity is not owned by anyone.");
  const userId = identity.userId;

  if (input.reversesTransactionId) {
    const grant = await transaction.identityOwnershipTransaction.findUnique({
      where: { id: input.reversesTransactionId },
      select: { action: true, status: true, playerIdentityId: true, toUserId: true },
    });
    if (!grant || grant.action !== "GRANT" || grant.status !== "APPLIED" || grant.playerIdentityId !== identity.id || grant.toUserId !== userId) {
      throw new Error("The ownership grant selected for rollback is no longer the active grant for this identity.");
    }
  }

  const definitions = await loadProjectableDefinitions(transaction);
  const scope = await currentIdentityScope(transaction, userId);
  const before = await projectLedger(transaction, scopeWithIdentity(scope, input.playerIdentityId), definitions, now);
  const after = await projectLedger(transaction, scopeWithoutIdentity(scope, input.playerIdentityId), definitions, now);
  const impact = await buildImpact(transaction, "REVOKE", before, after, scopeWithoutIdentity(scope, input.playerIdentityId));

  const storedXpBefore = await totalStoredXp(transaction, userId);
  const detached = await transaction.playerIdentity.updateMany({ where: { id: input.playerIdentityId, userId }, data: { userId: null, verifiedAt: null } });
  if (detached.count !== 1) throw new Error("This identity changed ownership during rollback.");
  const reconciliationJobsCleared = (await transaction.identityRewardReconciliation.deleteMany({ where: { playerIdentityId: input.playerIdentityId } })).count;
  const xpEntriesDeleted = await trimPlaytimeXp(transaction, userId, after.verifiedSessionSeconds, now);
  const evaluatedDefinitionIds = definitions
    .filter((definition) => (ownershipSensitiveRuleTypes as readonly string[]).includes(definition.ruleType))
    .map((definition) => definition.id);
  const revoked = await revokeUnearnedAchievements(transaction, userId, after.eligibleDefinitionIds, evaluatedDefinitionIds);
  const recordHoldingsCleared = (await transaction.recordHolder.deleteMany({ where: { playerIdentityId: input.playerIdentityId } })).count;
  const storedXpAfter = await totalStoredXp(transaction, userId);

  const applied: AppliedRevocation = {
    headline: impact.headline,
    trackedHoursRemoved: Math.abs(impact.delta.trackedHours),
    xpRemoved: Math.max(0, storedXpBefore - storedXpAfter),
    levelBefore: progressionForXp(storedXpBefore).level,
    levelAfter: progressionForXp(storedXpAfter).level,
    achievementsRevoked: revoked.achievements,
    titlesRevoked: revoked.titles,
    xpEntriesDeleted,
    recordHoldingsCleared,
    reconciliationJobsCleared,
  };

  const ledgerEntry = await transaction.identityOwnershipTransaction.create({
    data: {
      playerIdentityId: input.playerIdentityId,
      action: "REVOKE",
      source: input.source,
      fromUserId: userId,
      actorUserId: input.actorUserId,
      reason: input.reason.slice(0, 300),
      appliedImpact: toJson(applied),
      reversalTransactionId: input.reversesTransactionId ?? null,
    },
    select: { id: true },
  });

  if (input.reversesTransactionId) {
    const reversed = await transaction.identityOwnershipTransaction.updateMany({
      where: { id: input.reversesTransactionId, status: "APPLIED" },
      data: { status: "REVERSED", reversedAt: now },
    });
    if (reversed.count !== 1) throw new Error("The ownership grant changed during rollback.");
  } else {
    await transaction.identityOwnershipTransaction.updateMany({
      where: { playerIdentityId: input.playerIdentityId, action: "GRANT", toUserId: userId, status: "APPLIED" },
      data: { status: "REVERSED", reversedAt: now },
    });
  }

  // The claim that produced this ownership no longer reflects reality. Marking
  // it rejected also frees the member to file a fresh request later.
  await transaction.playerIdentityClaim.updateMany({
    where: { playerIdentityId: input.playerIdentityId, userId, status: "APPROVED" },
    data: { status: "REJECTED", resolvedAt: now, resolvedByUserId: input.actorUserId, resolutionNote: `Ownership rolled back: ${input.reason}`.slice(0, 300) },
  });

  await transaction.auditLog.create({
    data: {
      actorUserId: input.actorUserId,
      action: "IDENTITY_OWNERSHIP_REVOKED",
      entityType: "PlayerIdentity",
      entityId: input.playerIdentityId,
      before: { userId, identityName: identity.displayName },
      after: { ownershipTransactionId: ledgerEntry.id, source: input.source, reason: input.reason, applied: toJson(applied) },
    },
  });
  return { ledgerEntry, applied, impact };
}

/**
 * Brings stored `VERIFIED_PLAYTIME` XP back in line with the evidence that
 * remains. Entries are cumulative deltas recomputed from total verified
 * seconds, so the correct reversal is to drop the newest entries until the sum
 * no longer exceeds the recomputed target and re-add any remainder. A negative
 * compensating entry is not an option: the ledger carries a database CHECK that
 * every amount is positive.
 */
export async function trimPlaytimeXp(transaction: Prisma.TransactionClient, userId: string, remainingSeconds: number, now: Date): Promise<number> {
  const target = verifiedPlaytimeXp(remainingSeconds);
  const entries = await transaction.userXpEntry.findMany({
    where: { userId, source: "VERIFIED_PLAYTIME" },
    orderBy: [{ earnedAt: "desc" }, { id: "desc" }],
    select: { id: true, amount: true },
  });
  let total = entries.reduce((sum, entry) => sum + entry.amount, 0);
  if (total <= target) return 0;

  const removable: string[] = [];
  for (const entry of entries) {
    if (total <= target) break;
    removable.push(entry.id);
    total -= entry.amount;
  }
  if (removable.length === 0) return 0;
  await transaction.userXpEntry.deleteMany({ where: { id: { in: removable } } });

  const remainder = target - total;
  if (remainder > 0) {
    await transaction.userXpEntry.create({
      data: { userId, source: "VERIFIED_PLAYTIME", amount: remainder, description: "Verified Habitat playtime", earnedAt: now, dedupeKey: `verified-playtime:${userId}:${target}` },
    });
  }
  return removable.length;
}

/**
 * Removes achievements the member no longer qualifies for once the identity is
 * detached, together with the rewards and titles those achievements unlocked
 * and the synthetic `ACHIEVEMENT_EARNED` events they emitted.
 */
async function revokeUnearnedAchievements(
  transaction: Prisma.TransactionClient,
  userId: string,
  stillEligibleDefinitionIds: string[],
  evaluatedDefinitionIds: string[],
) {
  if (evaluatedDefinitionIds.length === 0) return { achievements: [], titles: [] };
  const held = await transaction.playerAchievement.findMany({
    where: {
      userId,
      achievementDefinitionId: {
        in: evaluatedDefinitionIds,
        notIn: stillEligibleDefinitionIds.length > 0 ? stillEligibleDefinitionIds : ["00000000-0000-0000-0000-000000000000"],
      },
    },
    select: { id: true, dedupeKey: true, achievementDefinitionId: true, achievement: { select: { slug: true, name: true } } },
  });
  if (held.length === 0) return { achievements: [], titles: [] };

  const definitionIds = [...new Set(held.map((award) => award.achievementDefinitionId))];
  const titleRewards = await transaction.achievementReward.findMany({
    where: { achievementDefinitionId: { in: definitionIds }, kind: "TITLE", titleDefinitionId: { not: null } },
    select: { titleDefinitionId: true },
  });
  const candidateTitleIds = [...new Set(titleRewards.flatMap((reward) => (reward.titleDefinitionId ? [reward.titleDefinitionId] : [])))];

  await transaction.serverEvent.deleteMany({ where: { dedupeKey: { in: held.map((award) => `achievement-event:${award.dedupeKey}`) } } });
  // `UserAchievementReward` cascades from `PlayerAchievement`, so unlocked
  // rewards disappear with the award that granted them.
  await transaction.playerAchievement.deleteMany({ where: { id: { in: held.map((award) => award.id) } } });

  const titlesRevoked: string[] = [];
  for (const titleDefinitionId of candidateTitleIds) {
    const stillUnlocked = await transaction.userAchievementReward.count({ where: { userId, reward: { is: { titleDefinitionId } } } });
    if (stillUnlocked > 0) continue;
    const removed = await transaction.userTitle.deleteMany({ where: { userId, titleDefinitionId, source: "ACHIEVEMENT" } });
    if (removed.count > 0) {
      const title = await transaction.titleDefinition.findUnique({ where: { id: titleDefinitionId }, select: { name: true } });
      if (title) titlesRevoked.push(title.name);
    }
  }

  const achievements = [...new Map(held.map((award) => [award.achievement.slug, { slug: award.achievement.slug, name: award.achievement.name }])).values()];
  return { achievements, titles: titlesRevoked };
}

async function totalStoredXp(transaction: Prisma.TransactionClient, userId: string): Promise<number> {
  const total = await transaction.userXpEntry.aggregate({ where: { userId }, _sum: { amount: true } });
  return total._sum.amount ?? 0;
}

function toJson(value: unknown): Prisma.InputJsonValue | undefined {
  if (value === undefined || value === null) return undefined;
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}
