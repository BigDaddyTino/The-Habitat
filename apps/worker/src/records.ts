import type { Prisma } from "@habitat/db/client";
import { isAchievementCountRecordRule, parseDistinctGameEventCountRecordRule, parsePlayerEventCountRecordRule } from "@habitat/shared";
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

function isUniqueConstraint(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === "P2002";
}
