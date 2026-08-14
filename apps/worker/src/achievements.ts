import { getPrismaClient, type Prisma } from "@habitat/db/client";
import { currentIdentityScope, isActivityEligible, isIdentityEligible } from "@habitat/identity";
import { parseLevelReachedRule, progressionForXp } from "@habitat/shared";
import { evaluateRecordsForEvent } from "./records.js";
import { queueDiscordNotification } from "./discord-notifications.js";
import { recordEvaluationFailure, resolveEvaluationFailures } from "./evaluation-failures.js";

type AchievementEvaluationOptions = { suppressNotifications?: boolean };

export async function evaluateAchievementsForEvent(transaction: Prisma.TransactionClient, eventId: string, options: AchievementEvaluationOptions = {}) {
  const event = await transaction.serverEvent.findUnique({ where: { id: eventId }, include: { playerIdentity: { select: { id: true, userId: true, displayName: true } } } });
  if (!event?.playerIdentity?.userId || event.eventType !== "PLAYER_JOINED") return;

  const definitions = await transaction.achievementDefinition.findMany({ where: { enabled: true, ruleType: { in: ["EVENT_COUNT", "GAME_EVENT_COUNT", "DISTINCT_GAME_EVENT_COUNT"] } } });
  const scope = await currentIdentityScope(transaction, event.playerIdentity.userId);
  for (const definition of definitions) {
    const eligible = await isIdentityEligible(transaction, definition, scope);
    if (!eligible) continue;
    await awardAchievement(transaction, definition, { userId: event.playerIdentity.userId, playerIdentityId: event.playerIdentity.id, displayName: event.playerIdentity.displayName, serverId: event.serverId, gameType: event.gameType, occurredAt: event.occurredAt, sourceEventId: event.id, repeatKey: event.id, source: "ACHIEVEMENT_ENGINE", suppressNotifications: options.suppressNotifications });
  }
}

export async function evaluateAchievementsForLegacyEvidence(transaction: Prisma.TransactionClient, evidenceId: string, options: AchievementEvaluationOptions = {}) {
  const evidence = await transaction.legacyPlayerEvidence.findUnique({ where: { id: evidenceId }, include: { playerIdentity: { select: { id: true, userId: true, displayName: true } } } });
  if (!evidence?.playerIdentity.userId) return;
  const definitions = await transaction.achievementDefinition.findMany({ where: { enabled: true, ruleType: "LEGACY_EVIDENCE_COUNT" } });
  const scope = await currentIdentityScope(transaction, evidence.playerIdentity.userId);
  for (const definition of definitions) {
    if (!await isIdentityEligible(transaction, definition, scope)) continue;
    await awardAchievement(transaction, definition, { userId: evidence.playerIdentity.userId, playerIdentityId: evidence.playerIdentity.id, displayName: evidence.playerIdentity.displayName, serverId: evidence.serverId, gameType: evidence.gameType, occurredAt: evidence.occurredAt, sourceEventId: null, repeatKey: evidence.id, source: "LEGACY_HISTORY_IMPORT", suppressNotifications: options.suppressNotifications });
  }
}

export async function evaluateLevelAchievementsForUser(
  transaction: Prisma.TransactionClient,
  userId: string,
  event: { id: string; serverId: string; gameType: Prisma.ServerEventCreateInput["gameType"]; occurredAt: Date; playerIdentity: { id: string; displayName: string } },
  options: AchievementEvaluationOptions = {},
) {
  const total = await transaction.userXpEntry.aggregate({ where: { userId }, _sum: { amount: true } });
  const level = progressionForXp(total._sum.amount ?? 0).level;
  const definitions = await transaction.achievementDefinition.findMany({ where: { enabled: true, ruleType: "LEVEL_REACHED" } });
  for (const definition of definitions) {
    const rule = parseLevelReachedRule(definition.ruleConfig);
    if (!rule || level < rule.level) continue;
    await awardAchievement(transaction, definition, { userId, playerIdentityId: event.playerIdentity.id, displayName: event.playerIdentity.displayName, serverId: event.serverId, gameType: event.gameType, occurredAt: event.occurredAt, sourceEventId: event.id, repeatKey: `level-${rule.level}`, source: "PROGRESSION_ENGINE", suppressNotifications: options.suppressNotifications });
  }
}

export async function evaluateAchievementsForActivity(transaction: Prisma.TransactionClient, activityId: string, options: AchievementEvaluationOptions = {}) {
  const activity = await transaction.gameActivity.findUnique({ where: { id: activityId }, include: { user: { select: { id: true, displayName: true, name: true, username: true } } } });
  if (!activity) return;
  const definitions = await transaction.achievementDefinition.findMany({ where: { enabled: true, ruleType: { in: ["ACTIVITY_COUNT", "ACTIVITY_VALUE_SUM", "DISTINCT_ACTIVITY_GAME_COUNT", "ORDERED_ACTIVITY_STREAK", "SHARED_ACTIVITY_COUNT", "ACTIVITY_STAT_THRESHOLD"] } } });
  for (const definition of definitions) {
    if (definition.gameKey && definition.gameKey !== activity.gameKey) continue;
    if (!await isActivityEligible(transaction, definition, activity.userId)) continue;
    const displayName = activity.user.displayName ?? activity.user.name ?? activity.user.username ?? "Habitat member";
    const dedupeKey = `achievement:${definition.id}:${activity.userId}:${definition.isRepeatable ? activity.id : "once"}`;
    const existingAward = await transaction.playerAchievement.findUnique({ where: { dedupeKey }, select: { id: true } });
    const award = await transaction.playerAchievement.upsert({
      where: { dedupeKey },
      create: { userId: activity.userId, achievementDefinitionId: definition.id, sourceActivityId: activity.id, awardedAt: activity.occurredAt, dedupeKey },
      update: {},
    });
    await unlockAchievementRewards(transaction, { achievementDefinitionId: definition.id, userId: activity.userId, playerAchievementId: award.id });
    if (!existingAward && !options.suppressNotifications && ["LEGENDARY", "QUESTIONABLE_LIFE_CHOICE"].includes(definition.rarity)) await queueDiscordNotification(transaction, { gameActivityId: activity.id, kind: "LEGENDARY_ACHIEVEMENT", content: `**${displayName}** earned a top-tier Habitat achievement: **${definition.name}**.` });
  }
}

/** Replays only each member's latest verified evidence to make newly seeded rules retroactive. */
export async function reconcileAchievementCatalog() {
  const db = getPrismaClient();
  const users = await db.user.findMany({ where: { isActive: true }, select: { id: true } });
  let reconciled = 0;
  for (const user of users) {
    try {
      const [joinEvent, legacyEvidence, progressionEvent, activity] = await Promise.all([
      db.serverEvent.findFirst({ where: { eventType: "PLAYER_JOINED", playerIdentity: { is: { userId: user.id } } }, orderBy: [{ occurredAt: "desc" }, { id: "desc" }], select: { id: true } }),
      db.legacyPlayerEvidence.findFirst({ where: { playerIdentity: { is: { userId: user.id } } }, orderBy: [{ occurredAt: "desc" }, { id: "desc" }], select: { id: true } }),
      db.serverEvent.findFirst({
        where: { playerIdentity: { is: { userId: user.id } } },
        orderBy: [{ occurredAt: "desc" }, { id: "desc" }],
        include: { playerIdentity: { select: { id: true, displayName: true, userId: true } } },
      }),
      db.gameActivity.findFirst({ where: { userId: user.id }, orderBy: [{ occurredAt: "desc" }, { id: "desc" }], select: { id: true } }),
    ]);
      await db.$transaction(async (transaction) => {
        if (joinEvent) await evaluateAchievementsForEvent(transaction, joinEvent.id, { suppressNotifications: true });
        if (legacyEvidence) await evaluateAchievementsForLegacyEvidence(transaction, legacyEvidence.id, { suppressNotifications: true });
        if (progressionEvent?.playerIdentity?.userId) await evaluateLevelAchievementsForUser(transaction, user.id, {
          id: progressionEvent.id,
          serverId: progressionEvent.serverId,
          gameType: progressionEvent.gameType,
          occurredAt: progressionEvent.occurredAt,
          playerIdentity: { id: progressionEvent.playerIdentity.id, displayName: progressionEvent.playerIdentity.displayName },
        }, { suppressNotifications: true });
        if (activity) await evaluateAchievementsForActivity(transaction, activity.id, { suppressNotifications: true });
      });
      await resolveEvaluationFailures("ACHIEVEMENT_CATALOG", [user.id]);
      reconciled += 1;
    } catch (error) {
      await recordEvaluationFailure({ kind: "ACHIEVEMENT_CATALOG", scope: "catalog-reconciliation", reference: user.id, error });
    }
  }
  return reconciled;
}

async function awardAchievement(
  transaction: Prisma.TransactionClient,
  definition: { id: string; slug: string; name: string; rarity: string; points: number; isRepeatable: boolean },
  input: { userId: string; playerIdentityId: string; displayName: string; serverId: string; gameType: Prisma.ServerEventCreateInput["gameType"]; occurredAt: Date; sourceEventId: string | null; repeatKey: string; source: string; suppressNotifications?: boolean },
) {
  const dedupeKey = `achievement:${definition.id}:${input.userId}:${definition.isRepeatable ? input.repeatKey : "once"}`;
  const award = await transaction.playerAchievement.upsert({
    where: { dedupeKey },
    create: { userId: input.userId, achievementDefinitionId: definition.id, sourceEventId: input.sourceEventId, awardedAt: input.occurredAt, dedupeKey },
    update: {},
  });
  await unlockAchievementRewards(transaction, { achievementDefinitionId: definition.id, userId: input.userId, playerAchievementId: award.id });
  const achievementEvent = await transaction.serverEvent.upsert({
    where: { dedupeKey: `achievement-event:${dedupeKey}` },
    create: {
      serverId: input.serverId,
      gameType: input.gameType,
      eventType: "ACHIEVEMENT_EARNED",
      occurredAt: input.occurredAt,
      playerIdentityId: input.playerIdentityId,
      actorText: input.displayName,
      valueText: definition.name,
      source: input.source,
      sourceConfidence: 100,
      dedupeKey: `achievement-event:${dedupeKey}`,
      metadata: { achievementSlug: definition.slug, rarity: definition.rarity, points: definition.points, sourceEventId: input.sourceEventId },
    },
    update: {},
  });
  await evaluateRecordsForEvent(transaction, achievementEvent.id);
  if (!input.suppressNotifications && ["LEGENDARY", "QUESTIONABLE_LIFE_CHOICE"].includes(definition.rarity)) await queueDiscordNotification(transaction, { serverEventId: achievementEvent.id, kind: "LEGENDARY_ACHIEVEMENT", content: `**${input.displayName}** earned a top-tier Habitat achievement: **${definition.name}**.` });
}

async function unlockAchievementRewards(
  transaction: Prisma.TransactionClient,
  input: { achievementDefinitionId: string; userId: string; playerAchievementId: string },
) {
  const rewards = await transaction.achievementReward.findMany({
    where: { achievementDefinitionId: input.achievementDefinitionId },
    select: { id: true, kind: true, titleDefinitionId: true },
  });

  for (const reward of rewards) {
    await transaction.userAchievementReward.upsert({
      where: { userId_achievementRewardId: { userId: input.userId, achievementRewardId: reward.id } },
      create: { userId: input.userId, achievementRewardId: reward.id, playerAchievementId: input.playerAchievementId },
      update: {},
    });
    if (reward.kind === "TITLE" && reward.titleDefinitionId) {
      await transaction.userTitle.upsert({
        where: { userId_titleDefinitionId: { userId: input.userId, titleDefinitionId: reward.titleDefinitionId } },
        create: { userId: input.userId, titleDefinitionId: reward.titleDefinitionId, source: "ACHIEVEMENT" },
        update: {},
      });
    }
  }
}
