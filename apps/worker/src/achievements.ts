import { getPrismaClient, type Prisma } from "@habitat/db/client";
import { parseDistinctGameEventCountRule, parseEventCountRule, parseLegacyEvidenceCountRule, parseLevelReachedRule, progressionForXp } from "@habitat/shared";
import { evaluateRecordsForEvent } from "./records.js";
import { queueDiscordNotification } from "./discord-notifications.js";

export async function evaluateAchievementsForEvent(transaction: Prisma.TransactionClient, eventId: string) {
  const event = await transaction.serverEvent.findUnique({ where: { id: eventId }, include: { playerIdentity: { select: { id: true, userId: true, displayName: true } } } });
  if (!event?.playerIdentity?.userId || event.eventType !== "PLAYER_JOINED") return;

  const definitions = await transaction.achievementDefinition.findMany({ where: { enabled: true } });
  for (const definition of definitions) {
    const eligible = await isEligible(transaction, definition, event.playerIdentity.userId);
    if (!eligible) continue;
    await awardAchievement(transaction, definition, { userId: event.playerIdentity.userId, playerIdentityId: event.playerIdentity.id, displayName: event.playerIdentity.displayName, serverId: event.serverId, gameType: event.gameType, occurredAt: event.occurredAt, sourceEventId: event.id, repeatKey: event.id, source: "ACHIEVEMENT_ENGINE" });
  }
}

export async function evaluateAchievementsForLegacyEvidence(transaction: Prisma.TransactionClient, evidenceId: string) {
  const evidence = await transaction.legacyPlayerEvidence.findUnique({ where: { id: evidenceId }, include: { playerIdentity: { select: { id: true, userId: true, displayName: true } } } });
  if (!evidence?.playerIdentity.userId) return;
  const definitions = await transaction.achievementDefinition.findMany({ where: { enabled: true, ruleType: "LEGACY_EVIDENCE_COUNT" } });
  for (const definition of definitions) {
    const rule = parseLegacyEvidenceCountRule(definition.ruleConfig);
    if (!rule) continue;
    const count = await transaction.legacyPlayerEvidence.count({ where: { playerIdentity: { is: { userId: evidence.playerIdentity.userId } } } });
    if (count < rule.threshold) continue;
    await awardAchievement(transaction, definition, { userId: evidence.playerIdentity.userId, playerIdentityId: evidence.playerIdentity.id, displayName: evidence.playerIdentity.displayName, serverId: evidence.serverId, gameType: evidence.gameType, occurredAt: evidence.occurredAt, sourceEventId: null, repeatKey: evidence.id, source: "LEGACY_HISTORY_IMPORT" });
  }
}

export async function evaluateLevelAchievementsForUser(
  transaction: Prisma.TransactionClient,
  userId: string,
  event: { id: string; serverId: string; gameType: Prisma.ServerEventCreateInput["gameType"]; occurredAt: Date; playerIdentity: { id: string; displayName: string } },
) {
  const total = await transaction.userXpEntry.aggregate({ where: { userId }, _sum: { amount: true } });
  const level = progressionForXp(total._sum.amount ?? 0).level;
  const definitions = await transaction.achievementDefinition.findMany({ where: { enabled: true, ruleType: "LEVEL_REACHED" } });
  for (const definition of definitions) {
    const rule = parseLevelReachedRule(definition.ruleConfig);
    if (!rule || level < rule.level) continue;
    await awardAchievement(transaction, definition, { userId, playerIdentityId: event.playerIdentity.id, displayName: event.playerIdentity.displayName, serverId: event.serverId, gameType: event.gameType, occurredAt: event.occurredAt, sourceEventId: event.id, repeatKey: `level-${rule.level}`, source: "PROGRESSION_ENGINE" });
  }
}

/** Replays only each member's latest verified evidence to make newly seeded rules retroactive. */
export async function reconcileAchievementCatalog() {
  const db = getPrismaClient();
  const users = await db.user.findMany({ where: { isActive: true }, select: { id: true } });
  let reconciled = 0;
  for (const user of users) {
    const [joinEvent, legacyEvidence, progressionEvent] = await Promise.all([
      db.serverEvent.findFirst({ where: { eventType: "PLAYER_JOINED", playerIdentity: { is: { userId: user.id } } }, orderBy: [{ occurredAt: "desc" }, { id: "desc" }], select: { id: true } }),
      db.legacyPlayerEvidence.findFirst({ where: { playerIdentity: { is: { userId: user.id } } }, orderBy: [{ occurredAt: "desc" }, { id: "desc" }], select: { id: true } }),
      db.serverEvent.findFirst({
        where: { playerIdentity: { is: { userId: user.id } } },
        orderBy: [{ occurredAt: "desc" }, { id: "desc" }],
        include: { playerIdentity: { select: { id: true, displayName: true, userId: true } } },
      }),
    ]);
    await db.$transaction(async (transaction) => {
      if (joinEvent) await evaluateAchievementsForEvent(transaction, joinEvent.id);
      if (legacyEvidence) await evaluateAchievementsForLegacyEvidence(transaction, legacyEvidence.id);
      if (progressionEvent?.playerIdentity?.userId) await evaluateLevelAchievementsForUser(transaction, user.id, {
        id: progressionEvent.id,
        serverId: progressionEvent.serverId,
        gameType: progressionEvent.gameType,
        occurredAt: progressionEvent.occurredAt,
        playerIdentity: { id: progressionEvent.playerIdentity.id, displayName: progressionEvent.playerIdentity.displayName },
      });
    });
    reconciled += 1;
  }
  return reconciled;
}

async function awardAchievement(
  transaction: Prisma.TransactionClient,
  definition: { id: string; slug: string; name: string; rarity: string; points: number; isRepeatable: boolean },
  input: { userId: string; playerIdentityId: string; displayName: string; serverId: string; gameType: Prisma.ServerEventCreateInput["gameType"]; occurredAt: Date; sourceEventId: string | null; repeatKey: string; source: string },
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
  if (["LEGENDARY", "QUESTIONABLE_LIFE_CHOICE"].includes(definition.rarity)) await queueDiscordNotification(transaction, { serverEventId: achievementEvent.id, kind: "LEGENDARY_ACHIEVEMENT", content: `**${input.displayName}** earned a top-tier Habitat achievement: **${definition.name}**.` });
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
  return false;
}
