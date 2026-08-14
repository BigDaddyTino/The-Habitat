import type { Prisma } from "@habitat/db/client";
import { progressionForXp } from "@habitat/shared";
import { summarizeIdentityProvenance } from "./provenance";

export const memberExportVersion = 1;

/** Per-collection ceiling. Anything truncated says so in the export itself. */
const collectionLimit = 5_000;

/**
 * Builds a self-describing snapshot of one member's identity, progression,
 * profile, provider-link, referral, record, and associated evidence data.
 *
 * Credentials are structurally excluded: OAuth access and refresh tokens,
 * database session tokens, verification tokens, and link nonces are never read.
 * Collections in this declared scope carry explicit truncation flags so a
 * partial export can never be mistaken for a complete one. The payload does
 * not pretend to be a dump of unrelated community or volatile provider-cache
 * tables; those boundaries are declared in its metadata.
 */
export async function buildMemberDataExport(transaction: Prisma.TransactionClient, userId: string, exportedAt = new Date()) {
  const user = await transaction.user.findUnique({
    where: { id: userId },
    select: {
      id: true, name: true, username: true, displayName: true, email: true, emailVerified: true, role: true, image: true,
      bio: true, avatarBorder: true, profileLayout: true, isActive: true, createdAt: true, updatedAt: true,
    },
  });
  if (!user) return null;

  const [identities, ownershipLedger, claims, xpEntries, achievements, unlockedRewards, titles, questProgress, socialAccounts, referredBy, referralsMade, twitchChannel, clubProfiles, recordHoldings, auditTrail] = await Promise.all([
    transaction.playerIdentity.findMany({
      where: { userId },
      select: { id: true, gameType: true, displayName: true, providerKey: true, externalProvider: true, externalAccountId: true, verifiedAt: true, createdAt: true, server: { select: { displayName: true, worldName: true } } },
      orderBy: [{ gameType: "asc" }, { displayName: "asc" }],
    }),
    transaction.identityOwnershipTransaction.findMany({
      where: { OR: [{ toUserId: userId }, { fromUserId: userId }] },
      select: { id: true, playerIdentityId: true, action: true, status: true, source: true, fromUserId: true, toUserId: true, reason: true, projectedImpact: true, appliedImpact: true, reversedAt: true, createdAt: true, playerIdentity: { select: { displayName: true, gameType: true } } },
      orderBy: { createdAt: "desc" },
      take: collectionLimit,
    }),
    transaction.playerIdentityClaim.findMany({
      where: { userId },
      select: { id: true, status: true, requestedAt: true, resolvedAt: true, resolutionNote: true, playerIdentity: { select: { displayName: true, gameType: true } } },
      orderBy: { requestedAt: "desc" },
      take: collectionLimit,
    }),
    transaction.userXpEntry.findMany({ where: { userId }, select: { source: true, amount: true, description: true, earnedAt: true }, orderBy: { earnedAt: "desc" }, take: collectionLimit }),
    transaction.playerAchievement.findMany({
      where: { userId },
      select: { awardedAt: true, achievement: { select: { slug: true, name: true, description: true, rarity: true, points: true } } },
      orderBy: { awardedAt: "desc" },
      take: collectionLimit,
    }),
    transaction.userAchievementReward.findMany({
      where: { userId },
      select: { unlockedAt: true, equipped: true, reward: { select: { kind: true, code: true, name: true } } },
      orderBy: { unlockedAt: "desc" },
      take: collectionLimit,
    }),
    transaction.userTitle.findMany({ where: { userId }, select: { source: true, equipped: true, awardedAt: true, title: { select: { slug: true, name: true } } }, orderBy: { awardedAt: "desc" } }),
    transaction.userWeeklyQuestProgress.findMany({
      where: { userId },
      select: { progress: true, completedAt: true, selection: { select: { definition: { select: { slug: true, name: true, threshold: true, xpReward: true } }, cycle: { select: { weekStart: true } } } } },
      orderBy: { id: "desc" },
      take: collectionLimit,
    }),
    transaction.userSocialAccount.findMany({ where: { userId }, select: { platform: true, handle: true, profileUrl: true, providerAccountId: true, verifiedAt: true, displayPublic: true, createdAt: true } }),
    transaction.memberReferral.findFirst({ where: { invitedUserId: userId }, select: { method: true, codeWeek: true, createdAt: true, inviter: { select: { name: true, username: true } } } }),
    transaction.memberReferral.findMany({ where: { inviterUserId: userId }, select: { method: true, createdAt: true, invitedUser: { select: { name: true, username: true } } } }),
    transaction.twitchChannel.findUnique({ where: { userId }, select: { login: true, displayName: true, showcaseEnabled: true, connectedAt: true, isLive: true, lastLiveAt: true } }),
    transaction.clubGameProfile.findMany({ where: { userId }, select: { gameType: true, displayName: true, displayPublic: true, rosterSeatClaimedAt: true, connectedAt: true } }),
    transaction.recordHolder.findMany({ where: { userId }, select: { holderName: true, valueNumber: true, establishedAt: true, definition: { select: { slug: true, title: true, valueLabel: true } } } }),
    transaction.auditLog.findMany({
      where: { OR: [{ actorUserId: userId }, { entityType: "User", entityId: userId }] },
      select: { action: true, entityType: true, entityId: true, before: true, after: true, createdAt: true },
      orderBy: { createdAt: "desc" },
      take: collectionLimit,
    }),
  ]);

  const [ownershipLedgerTotal, claimsTotal, xpEntriesTotal, achievementsTotal, unlockedRewardsTotal, questProgressTotal, auditTrailTotal] = await Promise.all([
    transaction.identityOwnershipTransaction.count({ where: { OR: [{ toUserId: userId }, { fromUserId: userId }] } }),
    transaction.playerIdentityClaim.count({ where: { userId } }),
    transaction.userXpEntry.count({ where: { userId } }),
    transaction.playerAchievement.count({ where: { userId } }),
    transaction.userAchievementReward.count({ where: { userId } }),
    transaction.userWeeklyQuestProgress.count({ where: { userId } }),
    transaction.auditLog.count({ where: { OR: [{ actorUserId: userId }, { entityType: "User", entityId: userId }] } }),
  ]);

  const identityIds = identities.map((identity) => identity.id);
  const [events, legacyEvidence, activities, eventTotal, evidenceTotal, activityTotal, xpTotal] = await Promise.all([
    identityIds.length > 0
      ? transaction.serverEvent.findMany({ where: { playerIdentityId: { in: identityIds } }, select: { gameType: true, eventType: true, occurredAt: true, actorText: true, targetText: true, valueText: true, valueNumber: true, source: true, sourceConfidence: true }, orderBy: { occurredAt: "desc" }, take: collectionLimit })
      : Promise.resolve([]),
    identityIds.length > 0
      ? transaction.legacyPlayerEvidence.findMany({ where: { playerIdentityId: { in: identityIds } }, select: { gameType: true, kind: true, occurredAt: true, endedAt: true, durationSeconds: true, sourceKind: true, sourceLabel: true, sourceRecordHash: true }, orderBy: { occurredAt: "desc" }, take: collectionLimit })
      : Promise.resolve([]),
    transaction.gameActivity.findMany({ where: { userId }, select: { gameKey: true, activityType: true, occurredAt: true, valueNumber: true, valueText: true, source: true, sourceConfidence: true }, orderBy: { occurredAt: "desc" }, take: collectionLimit }),
    identityIds.length > 0 ? transaction.serverEvent.count({ where: { playerIdentityId: { in: identityIds } } }) : Promise.resolve(0),
    identityIds.length > 0 ? transaction.legacyPlayerEvidence.count({ where: { playerIdentityId: { in: identityIds } } }) : Promise.resolve(0),
    transaction.gameActivity.count({ where: { userId } }),
    transaction.userXpEntry.aggregate({ where: { userId }, _sum: { amount: true } }),
  ]);

  const provenance = await Promise.all(identityIds.map((identityId) => summarizeIdentityProvenance(transaction, identityId)));
  const totalXp = xpTotal._sum.amount ?? 0;

  return {
    export: {
      version: memberExportVersion,
      exportedAt: exportedAt.toISOString(),
      subjectUserId: userId,
      collectionLimit,
      scope: "Profile, identity ownership, progression, provider links, referrals, record holdings, and associated game evidence.",
      excluded: ["OAuth access and refresh tokens", "database session tokens", "email verification tokens", "Steam and Twitch link nonces"],
      notIncluded: ["Authentication account and active-session records", "volatile provider enrichment caches", "community interactions outside the declared export scope"],
      truncated: {
        ownershipLedger: truncation(ownershipLedger.length, ownershipLedgerTotal),
        claims: truncation(claims.length, claimsTotal),
        xpEntries: truncation(xpEntries.length, xpEntriesTotal),
        achievements: truncation(achievements.length, achievementsTotal),
        unlockedRewards: truncation(unlockedRewards.length, unlockedRewardsTotal),
        questProgress: truncation(questProgress.length, questProgressTotal),
        auditTrail: truncation(auditTrail.length, auditTrailTotal),
        serverEvents: eventTotal > events.length ? { returned: events.length, total: eventTotal } : null,
        legacyEvidence: evidenceTotal > legacyEvidence.length ? { returned: legacyEvidence.length, total: evidenceTotal } : null,
        gameActivities: activityTotal > activities.length ? { returned: activities.length, total: activityTotal } : null,
      },
    },
    member: user,
    progression: { ...progressionForXp(totalXp), storedXpEntryCount: xpEntriesTotal },
    identities: identities.map((identity, index) => ({ ...identity, provenance: provenance[index] })),
    ownershipLedger,
    claims,
    xpEntries,
    achievements,
    unlockedRewards,
    titles,
    questProgress,
    socialAccounts,
    referral: { invitedBy: referredBy, invitationsAccepted: referralsMade },
    twitchChannel,
    clubProfiles,
    recordHoldings,
    serverEvents: events,
    legacyEvidence,
    gameActivities: activities,
    auditTrail,
  };
}

function truncation(returned: number, total: number): { returned: number; total: number } | null {
  return total > returned ? { returned, total } : null;
}

/** A filesystem-safe, human-recognisable name for the downloaded export. */
export function memberExportFileName(member: { username: string | null; name: string | null; id: string }, exportedAt = new Date()): string {
  const identifier = (member.username ?? member.name ?? member.id).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || member.id;
  return `habitat-member-export-${identifier}-${exportedAt.toISOString().slice(0, 10)}.json`;
}
