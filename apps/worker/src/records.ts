import { getPrismaClient, type Prisma } from "@habitat/db/client";
import { isAchievementCountRecordRule, parseActivityRecordRule, parseDistinctGameEventCountRecordRule, parsePlayerEventCountRecordRule } from "@habitat/shared";
import { queueDiscordNotification } from "./discord-notifications.js";

type HabitatGameType = Prisma.GameServerGetPayload<{ select: { gameType: true } }>["gameType"];

export async function evaluateRecordsForEvent(transaction: Prisma.TransactionClient, eventId: string) {
  const event = await transaction.serverEvent.findUnique({
    where: { id: eventId },
    include: { playerIdentity: { select: { id: true, userId: true, displayName: true } } },
  });
  if (!event?.playerIdentity?.userId) return;
  const player = { ...event.playerIdentity, userId: event.playerIdentity.userId };

  const definitions = await transaction.recordDefinition.findMany({ where: { enabled: true } });
  for (const definition of definitions) {
    const value = await calculateRecordValue(transaction, definition, player.userId, event.eventType);
    if (value === null || value < 1) continue;
    await recordIfBroken(transaction, definition, event, player, value);
  }
}

export async function evaluateRecordsForActivity(transaction: Prisma.TransactionClient, activityId: string, options: { suppressNotifications?: boolean } = {}) {
  const activity = await transaction.gameActivity.findUnique({
    where: { id: activityId },
    include: { user: { select: { id: true, displayName: true, name: true, username: true } } },
  });
  if (!activity) return;
  const definitions = await transaction.recordDefinition.findMany({
    where: { enabled: true, ruleType: { in: ["ACTIVITY_COUNT", "ACTIVITY_VALUE_SUM", "ACTIVITY_DISTINCT_GAME_COUNT", "ACHIEVEMENT_COUNT"] } },
  });
  for (const definition of definitions) {
    if (definition.gameKey && definition.gameKey !== activity.gameKey) continue;
    const result = await calculateActivityRecordValue(transaction, definition, activity.userId, activity.activityType);
    if (!result || result.sampleSize < definition.minimumSampleSize) continue;
    const displayName = activity.user.displayName ?? activity.user.name ?? activity.user.username ?? "Habitat member";
    await recordActivityIfBroken(transaction, definition, activity, { userId: activity.userId, displayName }, result.value, options);
  }
}

/**
 * Replays one representative activity per member through every enabled
 * activity-backed record. New record definitions therefore pick up trusted
 * history after a seed without re-projecting source evidence or announcing an
 * old result as breaking news.
 */
export async function reconcileActivityRecordCatalog(db: ReturnType<typeof getPrismaClient> = getPrismaClient()): Promise<{ definitions: number; candidates: number }> {
  const definitions = await db.recordDefinition.findMany({
    where: { enabled: true, ruleType: { in: ["ACTIVITY_COUNT", "ACTIVITY_VALUE_SUM", "ACTIVITY_DISTINCT_GAME_COUNT"] } },
  });
  let candidates = 0;
  for (const definition of definitions) {
    const rule = parseActivityRecordRule(definition.ruleConfig);
    if (!rule) continue;
    const activities = await db.gameActivity.findMany({
      where: {
        activityType: rule.activityType,
        sourceConfidence: { gte: rule.minimumConfidence },
        ...(definition.gameKey ? { gameKey: definition.gameKey } : {}),
      },
      distinct: ["userId"],
      orderBy: [{ userId: "asc" }, { occurredAt: "desc" }, { id: "desc" }],
      include: { user: { select: { displayName: true, name: true, username: true } } },
    });
    candidates += activities.length;
    await db.$transaction(async (transaction) => {
      for (const activity of activities) {
        const result = await calculateActivityRecordValue(transaction, definition, activity.userId, activity.activityType);
        if (!result || result.sampleSize < definition.minimumSampleSize) continue;
        const displayName = activity.user.displayName ?? activity.user.name ?? activity.user.username ?? "Habitat member";
        await recordActivityIfBroken(transaction, definition, activity, { userId: activity.userId, displayName }, result.value, { suppressNotifications: true });
      }
    }, { timeout: 20_000 });
  }
  return { definitions: definitions.length, candidates };
}

async function calculateActivityRecordValue(
  transaction: Prisma.TransactionClient,
  definition: { ruleType: string; ruleConfig: unknown; gameKey: string | null },
  userId: string,
  triggeringActivityType: string,
): Promise<{ value: number; sampleSize: number } | null> {
  if (definition.ruleType === "ACHIEVEMENT_COUNT") {
    if (!isAchievementCountRecordRule(definition.ruleConfig)) return null;
    const value = await transaction.playerAchievement.count({ where: { userId } });
    return { value, sampleSize: value };
  }
  const rule = parseActivityRecordRule(definition.ruleConfig);
  if (!rule || triggeringActivityType !== rule.activityType) return null;
  const where = { userId, activityType: rule.activityType, sourceConfidence: { gte: rule.minimumConfidence }, ...(definition.gameKey ? { gameKey: definition.gameKey } : {}) };
  if (definition.ruleType === "ACTIVITY_COUNT") {
    const value = await transaction.gameActivity.count({ where });
    return { value, sampleSize: value };
  }
  if (definition.ruleType === "ACTIVITY_VALUE_SUM") {
    const aggregate = await transaction.gameActivity.aggregate({ where, _sum: { valueNumber: true }, _count: { _all: true } });
    return { value: Math.trunc(aggregate._sum.valueNumber ?? 0), sampleSize: aggregate._count._all };
  }
  if (definition.ruleType === "ACTIVITY_DISTINCT_GAME_COUNT") {
    const games = await transaction.gameActivity.findMany({ where, distinct: ["gameKey"], select: { gameKey: true } });
    const sampleSize = await transaction.gameActivity.count({ where });
    return { value: games.length, sampleSize };
  }
  return null;
}

async function calculateRecordValue(transaction: Prisma.TransactionClient, definition: { gameType: HabitatGameType | null; ruleType: string; ruleConfig: unknown }, userId: string, eventType: string): Promise<number | null> {
  const gameType = definition.gameType ?? undefined;
  if (definition.ruleType === "PLAYER_EVENT_COUNT") {
    const rule = parsePlayerEventCountRecordRule(definition.ruleConfig);
    if (!rule || eventType !== rule.eventType) return null;
    return transaction.serverEvent.count({ where: { playerIdentity: { is: { userId } }, eventType: rule.eventType, ...(gameType ? { gameType } : {}) } });
  }
  if (definition.ruleType === "DISTINCT_GAME_EVENT_COUNT") {
    const rule = parseDistinctGameEventCountRecordRule(definition.ruleConfig);
    if (!rule || eventType !== rule.eventType) return null;
    const games = await transaction.serverEvent.findMany({ where: { playerIdentity: { is: { userId } }, eventType: rule.eventType, ...(gameType ? { gameType } : {}) }, distinct: ["gameType"], select: { gameType: true } });
    return games.length;
  }
  if (definition.ruleType === "ACHIEVEMENT_COUNT") {
    if (eventType !== "ACHIEVEMENT_EARNED" || !isAchievementCountRecordRule(definition.ruleConfig)) return null;
    return transaction.playerAchievement.count({ where: { userId } });
  }
  return null;
}

async function recordIfBroken(transaction: Prisma.TransactionClient, definition: { id: string; slug: string; title: string; valueLabel: string }, event: { id: string; serverId: string; gameType: HabitatGameType; occurredAt: Date }, player: { id: string; userId: string; displayName: string }, value: number) {
  let prior = await transaction.recordHolder.findUnique({ where: { recordDefinitionId: definition.id } });
  if (prior && value <= prior.valueNumber) return;

  const holderData = {
    userId: player.userId,
    playerIdentityId: player.id,
    holderName: player.displayName,
    valueNumber: value,
    sourceEventId: event.id,
    establishedAt: event.occurredAt,
  };
  let brokeRecord = false;
  if (!prior) {
    try {
      await transaction.recordHolder.create({ data: { recordDefinitionId: definition.id, ...holderData } });
      brokeRecord = true;
    } catch (error) {
      if (!isUniqueConstraint(error)) throw error;
      prior = await transaction.recordHolder.findUnique({ where: { recordDefinitionId: definition.id } });
      if (!prior || value <= prior.valueNumber) return;
      const updated = await transaction.recordHolder.updateMany({ where: { recordDefinitionId: definition.id, valueNumber: { lt: value } }, data: holderData });
      brokeRecord = updated.count === 1;
    }
  } else {
    const updated = await transaction.recordHolder.updateMany({ where: { recordDefinitionId: definition.id, valueNumber: { lt: value } }, data: holderData });
    brokeRecord = updated.count === 1;
  }
  if (!brokeRecord) return;

  const dedupeKey = `record-history:${definition.id}:${player.userId}:${value}`;
  const history = await transaction.recordHistory.upsert({
    where: { dedupeKey },
    create: {
      recordDefinitionId: definition.id,
      userId: holderData.userId,
      playerIdentityId: holderData.playerIdentityId,
      holderName: holderData.holderName,
      valueNumber: holderData.valueNumber,
      sourceEventId: holderData.sourceEventId,
      priorValue: prior?.valueNumber,
      priorHolderName: prior?.holderName,
      occurredAt: event.occurredAt,
      dedupeKey,
    },
    update: {},
  });
  const recordEvent = await transaction.serverEvent.upsert({
    where: { dedupeKey: `record-event:${history.dedupeKey}` },
    create: {
      serverId: event.serverId,
      gameType: event.gameType,
      eventType: "RECORD_BROKEN",
      occurredAt: event.occurredAt,
      playerIdentityId: player.id,
      actorText: player.displayName,
      valueNumber: value,
      valueText: definition.title,
      source: "RECORD_ENGINE",
      sourceConfidence: 100,
      dedupeKey: `record-event:${history.dedupeKey}`,
      metadata: { recordSlug: definition.slug, valueLabel: definition.valueLabel, sourceEventId: event.id, priorValue: prior?.valueNumber ?? null, priorHolderName: prior?.holderName ?? null },
    },
    update: {},
  });
  await queueDiscordNotification(transaction, { serverEventId: recordEvent.id, kind: "RECORD_BROKEN", content: `**${player.displayName}** set a Habitat record: **${definition.title}** (${value} ${definition.valueLabel}).` });
}

async function recordActivityIfBroken(
  transaction: Prisma.TransactionClient,
  definition: { id: string; slug: string; title: string; valueLabel: string; comparison: "MAX" | "MIN" },
  activity: { id: string; occurredAt: Date },
  player: { userId: string; displayName: string },
  value: number,
  options: { suppressNotifications?: boolean },
) {
  let prior = await transaction.recordHolder.findUnique({ where: { recordDefinitionId: definition.id } });
  if (prior && !isBetter(definition.comparison, value, prior.valueNumber)) return;
  const holderData = { userId: player.userId, playerIdentityId: null, holderName: player.displayName, valueNumber: value, sourceEventId: null, sourceActivityId: activity.id, establishedAt: activity.occurredAt };
  let brokeRecord = false;
  if (!prior) {
    try {
      await transaction.recordHolder.create({ data: { recordDefinitionId: definition.id, ...holderData } });
      brokeRecord = true;
    } catch (error) {
      if (!isUniqueConstraint(error)) throw error;
      prior = await transaction.recordHolder.findUnique({ where: { recordDefinitionId: definition.id } });
      if (!prior || !isBetter(definition.comparison, value, prior.valueNumber)) return;
    }
  }
  if (!brokeRecord) {
    const valueCondition = definition.comparison === "MAX" ? { lt: value } : { gt: value };
    const updated = await transaction.recordHolder.updateMany({ where: { recordDefinitionId: definition.id, valueNumber: valueCondition }, data: holderData });
    brokeRecord = updated.count === 1;
  }
  if (!brokeRecord) return;
  const dedupeKey = `record-history:activity:${definition.id}:${player.userId}:${value}`;
  await transaction.recordHistory.upsert({
    where: { dedupeKey },
    create: { recordDefinitionId: definition.id, userId: player.userId, playerIdentityId: null, holderName: player.displayName, valueNumber: value, priorValue: prior?.valueNumber, priorHolderName: prior?.holderName, sourceEventId: null, sourceActivityId: activity.id, occurredAt: activity.occurredAt, dedupeKey },
    update: {},
  });
  if (!options.suppressNotifications) await queueDiscordNotification(transaction, { gameActivityId: activity.id, kind: "RECORD_BROKEN", content: `**${player.displayName}** set a Habitat record: **${definition.title}** (${value} ${definition.valueLabel}).` });
}

function isBetter(comparison: "MAX" | "MIN", candidate: number, current: number) {
  return comparison === "MAX" ? candidate > current : candidate < current;
}

function isUniqueConstraint(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === "P2002";
}
