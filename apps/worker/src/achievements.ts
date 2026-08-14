import { getPrismaClient, type Prisma } from "@habitat/db/client";
import { parseActivityCountRule, parseActivityStatThresholdRule, parseActivityValueSumRule, parseDistinctActivityGameRule, parseDistinctGameEventCountRule, parseEventCountRule, parseGameEventCountRule, parseLegacyEvidenceCountRule, parseLevelReachedRule, parseOrderedActivityStreakRule, progressionForXp } from "@habitat/shared";
import { evaluateRecordsForEvent } from "./records.js";
import { queueDiscordNotification } from "./discord-notifications.js";
import { recordEvaluationFailure, resolveEvaluationFailures } from "./evaluation-failures.js";

type AchievementEvaluationOptions = { suppressNotifications?: boolean };

export async function evaluateAchievementsForEvent(transaction: Prisma.TransactionClient, eventId: string, options: AchievementEvaluationOptions = {}) {
  const event = await transaction.serverEvent.findUnique({ where: { id: eventId }, include: { playerIdentity: { select: { id: true, userId: true, displayName: true } } } });
  if (!event?.playerIdentity?.userId || event.eventType !== "PLAYER_JOINED") return;

  const definitions = await transaction.achievementDefinition.findMany({ where: { enabled: true } });
  for (const definition of definitions) {
    const eligible = await isEligible(transaction, definition, event.playerIdentity.userId);
    if (!eligible) continue;
    await awardAchievement(transaction, definition, { userId: event.playerIdentity.userId, playerIdentityId: event.playerIdentity.id, displayName: event.playerIdentity.displayName, serverId: event.serverId, gameType: event.gameType, occurredAt: event.occurredAt, sourceEventId: event.id, repeatKey: event.id, source: "ACHIEVEMENT_ENGINE", suppressNotifications: options.suppressNotifications });
  }
}

export async function evaluateAchievementsForLegacyEvidence(transaction: Prisma.TransactionClient, evidenceId: string, options: AchievementEvaluationOptions = {}) {
  const evidence = await transaction.legacyPlayerEvidence.findUnique({ where: { id: evidenceId }, include: { playerIdentity: { select: { id: true, userId: true, displayName: true } } } });
  if (!evidence?.playerIdentity.userId) return;
  const definitions = await transaction.achievementDefinition.findMany({ where: { enabled: true, ruleType: "LEGACY_EVIDENCE_COUNT" } });
  for (const definition of definitions) {
    const rule = parseLegacyEvidenceCountRule(definition.ruleConfig);
    if (!rule) continue;
    const count = await transaction.legacyPlayerEvidence.count({ where: { playerIdentity: { is: { userId: evidence.playerIdentity.userId } } } });
    if (count < rule.threshold) continue;
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
    const award = await transaction.playerAchievement.upsert({
      where: { dedupeKey },
      create: { userId: activity.userId, achievementDefinitionId: definition.id, sourceActivityId: activity.id, awardedAt: activity.occurredAt, dedupeKey },
      update: {},
    });
    await unlockAchievementRewards(transaction, { achievementDefinitionId: definition.id, userId: activity.userId, playerAchievementId: award.id });
    if (!options.suppressNotifications && ["LEGENDARY", "QUESTIONABLE_LIFE_CHOICE"].includes(definition.rarity)) await queueDiscordNotification(transaction, { gameActivityId: activity.id, kind: "LEGENDARY_ACHIEVEMENT", content: `**${displayName}** earned a top-tier Habitat achievement: **${definition.name}**.` });
  }
}

async function isActivityEligible(transaction: Prisma.TransactionClient, definition: { ruleType: string; ruleConfig: unknown; gameKey: string | null }, userId: string) {
  const gameScope = definition.gameKey ? { gameKey: definition.gameKey } : {};
  if (definition.ruleType === "ACTIVITY_COUNT" || definition.ruleType === "SHARED_ACTIVITY_COUNT") {
    const rule = parseActivityCountRule(definition.ruleConfig);
    if (!rule) return false;
    return await transaction.gameActivity.count({ where: { userId, activityType: rule.activityType, sourceConfidence: { gte: rule.minimumConfidence }, ...gameScope } }) >= rule.threshold;
  }
  if (definition.ruleType === "ACTIVITY_VALUE_SUM") {
    const rule = parseActivityValueSumRule(definition.ruleConfig);
    if (!rule) return false;
    const value = await transaction.gameActivity.aggregate({ where: { userId, activityType: rule.activityType, sourceConfidence: { gte: rule.minimumConfidence }, ...gameScope }, _sum: { valueNumber: true } });
    return (value._sum.valueNumber ?? 0) >= rule.threshold;
  }
  if (definition.ruleType === "DISTINCT_ACTIVITY_GAME_COUNT") {
    const rule = parseDistinctActivityGameRule(definition.ruleConfig);
    if (!rule) return false;
    const games = await transaction.gameActivity.findMany({ where: { userId, activityType: rule.activityType, sourceConfidence: { gte: rule.minimumConfidence } }, distinct: ["gameKey"], select: { gameKey: true } });
    return games.length >= rule.threshold;
  }
  if (definition.ruleType === "ORDERED_ACTIVITY_STREAK") {
    const rule = parseOrderedActivityStreakRule(definition.ruleConfig);
    if (!rule) return false;
    const continuityGuard = definition.gameKey === "MARVEL_RIVALS" ? { sourceClubMatchParticipant: { is: { clubGameProfile: { is: { matchHistoryGapDetected: false } } } } } : {};
    const activities = await transaction.gameActivity.findMany({ where: { userId, activityType: { in: [rule.successActivityType, ...rule.breakActivityTypes] }, sourceConfidence: { gte: rule.minimumConfidence }, ...gameScope, ...continuityGuard }, orderBy: [{ occurredAt: "asc" }, { id: "asc" }], select: { activityType: true } });
    let current = 0;
    let longest = 0;
    for (const activity of activities) {
      if (activity.activityType === rule.successActivityType) {
        current += 1;
        longest = Math.max(longest, current);
      } else current = 0;
    }
    return longest >= rule.threshold;
  }
  if (definition.ruleType === "ACTIVITY_STAT_THRESHOLD") {
    const rule = parseActivityStatThresholdRule(definition.ruleConfig);
    if (!rule) return false;
    const where = { userId, activityType: rule.activityType, sourceConfidence: { gte: rule.minimumConfidence }, valueNumber: { not: null }, ...gameScope };
    let value: number | null = null;
    if (rule.aggregation === "LATEST") value = (await transaction.gameActivity.findFirst({ where, orderBy: [{ occurredAt: "desc" }, { id: "desc" }], select: { valueNumber: true } }))?.valueNumber ?? null;
    else {
      const aggregate = await transaction.gameActivity.aggregate({ where, _max: { valueNumber: true }, _min: { valueNumber: true } });
      value = rule.aggregation === "MAX" ? aggregate._max.valueNumber : aggregate._min.valueNumber;
    }
    return value !== null && (rule.comparison === "GTE" ? value >= rule.threshold : value <= rule.threshold);
  }
  return false;
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

async function isEligible(transaction: Prisma.TransactionClient, definition: { ruleType: string; ruleConfig: unknown }, userId: string) {
  if (definition.ruleType === "EVENT_COUNT") {
    const rule = parseEventCountRule(definition.ruleConfig);
    if (!rule) return false;
    const count = await transaction.serverEvent.count({ where: { playerIdentity: { is: { userId } }, eventType: rule.eventType } });
    return count >= rule.threshold;
  }
  if (definition.ruleType === "DISTINCT_GAME_EVENT_COUNT") {
    const rule = parseDistinctGameEventCountRule(definition.ruleConfig);
    if (!rule) return false;
    const games = await transaction.serverEvent.findMany({ where: { playerIdentity: { is: { userId } }, eventType: rule.eventType }, distinct: ["gameType"], select: { gameType: true } });
    return games.length >= rule.threshold;
  }
  if (definition.ruleType === "GAME_EVENT_COUNT") {
    const rule = parseGameEventCountRule(definition.ruleConfig);
    if (!rule) return false;
    const count = await transaction.serverEvent.count({ where: { playerIdentity: { is: { userId } }, eventType: rule.eventType, gameType: rule.gameType } });
    return count >= rule.threshold;
  }
  return false;
}
