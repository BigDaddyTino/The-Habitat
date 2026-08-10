import type { Prisma } from "@habitat/db/client";
import { parseDistinctGameEventCountRule, parseEventCountRule } from "@habitat/shared";
import { evaluateRecordsForEvent } from "./records.js";

export async function evaluateAchievementsForEvent(transaction: Prisma.TransactionClient, eventId: string) {
  const event = await transaction.serverEvent.findUnique({ where: { id: eventId }, include: { playerIdentity: { select: { id: true, userId: true, displayName: true } } } });
  if (!event?.playerIdentity?.userId || event.eventType !== "PLAYER_JOINED") return;

  const definitions = await transaction.achievementDefinition.findMany({ where: { enabled: true } });
  for (const definition of definitions) {
    const eligible = await isEligible(transaction, definition, event.playerIdentity.userId);
    if (!eligible) continue;
    const dedupeKey = `achievement:${definition.id}:${event.playerIdentity.userId}:${definition.isRepeatable ? event.id : "once"}`;
    await transaction.playerAchievement.upsert({
      where: { dedupeKey },
      create: { userId: event.playerIdentity.userId, achievementDefinitionId: definition.id, sourceEventId: event.id, dedupeKey },
      update: {},
    });
    const achievementEvent = await transaction.serverEvent.upsert({
      where: { dedupeKey: `achievement-event:${dedupeKey}` },
      create: {
        serverId: event.serverId,
        gameType: event.gameType,
        eventType: "ACHIEVEMENT_EARNED",
        occurredAt: event.occurredAt,
        playerIdentityId: event.playerIdentity.id,
        actorText: event.playerIdentity.displayName,
        valueText: definition.name,
        source: "ACHIEVEMENT_ENGINE",
        sourceConfidence: 100,
        dedupeKey: `achievement-event:${dedupeKey}`,
        metadata: { achievementSlug: definition.slug, rarity: definition.rarity, points: definition.points, sourceEventId: event.id },
      },
      update: {},
    });
    await evaluateRecordsForEvent(transaction, achievementEvent.id);
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
