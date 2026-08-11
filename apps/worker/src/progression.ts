import { createHash } from "node:crypto";
import { getPrismaClient, type Prisma } from "@habitat/db/client";
import { utcWeekWindow, verifiedPlaytimeXp } from "@habitat/shared";
import { evaluateLevelAchievementsForUser } from "./achievements.js";

const questCount = 4;
const verifiedSessionSources = ["PALWORLD_REST", "LEGACY_HISTORY_IMPORT"];

export function selectWeeklyQuestRotation<T extends { id: string; slug: string; ruleType: "PLAY_SECONDS" | "JOIN_COUNT" | "DISTINCT_GAME_COUNT" }>(definitions: T[], weekStart: Date, count = questCount): T[] {
  const ranked = definitions
    .map((definition) => ({ definition, score: createHash("sha256").update(`${weekStart.toISOString()}:${definition.slug}`).digest("hex") }))
    .sort((left, right) => left.score.localeCompare(right.score));
  const selected = ["PLAY_SECONDS", "JOIN_COUNT", "DISTINCT_GAME_COUNT"]
    .map((ruleType) => ranked.find((item) => item.definition.ruleType === ruleType)?.definition)
    .filter((definition): definition is T => Boolean(definition));
  selected.push(...ranked.map((item) => item.definition).filter((definition) => !selected.some((item) => item.id === definition.id)).slice(0, count - selected.length));
  return selected.slice(0, count);
}

export async function ensureCurrentWeeklyQuestCycle(now = new Date()) {
  const db = getPrismaClient();
  return db.$transaction((transaction) => ensureWeeklyQuestCycle(transaction, now));
}

export async function processProgressionForEvent(transaction: Prisma.TransactionClient, eventId: string, now = new Date()) {
  const event = await transaction.serverEvent.findUnique({
    where: { id: eventId },
    include: { playerIdentity: { select: { id: true, userId: true, verifiedAt: true, displayName: true } } },
  });
  if (!event?.playerIdentity?.userId || !event.playerIdentity.verifiedAt || event.sourceConfidence < 100) return;
  const achievementContext = { id: event.id, serverId: event.serverId, gameType: event.gameType, occurredAt: event.occurredAt, playerIdentity: { id: event.playerIdentity.id, displayName: event.playerIdentity.displayName } };

  if (event.eventType === "PLAYER_LEFT" && verifiedSessionSources.includes(event.source) && typeof event.valueNumber === "number" && event.valueNumber > 0) {
    await awardAccumulatedPlaytimeXp(transaction, event.playerIdentity.userId, event.id, event.occurredAt);
  }
  await evaluateLevelAchievementsForUser(transaction, event.playerIdentity.userId, achievementContext);

  const { weekStart, endsAt } = utcWeekWindow(now);
  if (event.occurredAt < weekStart || event.occurredAt >= endsAt) return;
  const cycle = await ensureWeeklyQuestCycle(transaction, now);
  for (const selection of cycle.selections) {
    const measured = await measureQuestProgress(transaction, event.playerIdentity.userId, selection.definition.ruleType, weekStart, endsAt);
    const progressValue = Math.min(selection.definition.threshold, measured);
    const existing = await transaction.userWeeklyQuestProgress.findUnique({ where: { userId_selectionId: { userId: event.playerIdentity.userId, selectionId: selection.id } }, select: { id: true, completedAt: true } });
    const completedAt = progressValue >= selection.definition.threshold ? event.occurredAt : null;
    const progress = await transaction.userWeeklyQuestProgress.upsert({
      where: { userId_selectionId: { userId: event.playerIdentity.userId, selectionId: selection.id } },
      create: { userId: event.playerIdentity.userId, selectionId: selection.id, progress: progressValue, completedAt },
      update: { progress: progressValue, completedAt: existing?.completedAt ?? completedAt },
      select: { id: true, completedAt: true },
    });
    if (!existing?.completedAt && progress.completedAt) {
      await transaction.userXpEntry.upsert({
        where: { dedupeKey: `weekly-quest:${progress.id}` },
        create: { userId: event.playerIdentity.userId, serverEventId: event.id, source: "WEEKLY_QUEST", amount: selection.definition.xpReward, description: `Weekly quest: ${selection.definition.name}`, earnedAt: event.occurredAt, dedupeKey: `weekly-quest:${progress.id}` },
        update: {},
      });
    }
  }
  await evaluateLevelAchievementsForUser(transaction, event.playerIdentity.userId, achievementContext);
}

export async function reconcileProgression(now = new Date()) {
  const db = getPrismaClient();
  await ensureCurrentWeeklyQuestCycle(now);
  const qualifyingEvents = { OR: [{ eventType: "PLAYER_LEFT" as const, source: { in: verifiedSessionSources }, valueNumber: { gt: 0 }, sourceConfidence: { gte: 100 } }, { eventType: "PLAYER_JOINED" as const, sourceConfidence: { gte: 100 } }] };
  const users = await db.user.findMany({
    where: { isActive: true, playerIdentities: { some: { verifiedAt: { not: null }, events: { some: qualifyingEvents } } } },
    select: { id: true, playerIdentities: { where: { verifiedAt: { not: null } }, select: { events: { where: qualifyingEvents, orderBy: { occurredAt: "desc" }, take: 1, select: { id: true, occurredAt: true } } } } },
  });
  let reconciled = 0;
  for (const user of users) {
    const latest = user.playerIdentities.flatMap((identity) => identity.events).sort((left, right) => right.occurredAt.getTime() - left.occurredAt.getTime())[0];
    if (!latest) continue;
    await db.$transaction((transaction) => processProgressionForEvent(transaction, latest.id, now));
    reconciled += 1;
  }
  return reconciled;
}

async function ensureWeeklyQuestCycle(transaction: Prisma.TransactionClient, now: Date) {
  const { weekStart, endsAt } = utcWeekWindow(now);
  const cycle = await transaction.weeklyQuestCycle.upsert({ where: { weekStart }, create: { weekStart, endsAt }, update: { endsAt }, select: { id: true } });
  const existing = await transaction.weeklyQuestSelection.count({ where: { cycleId: cycle.id } });
  if (existing === 0) {
    const definitions = await transaction.weeklyQuestDefinition.findMany({ where: { enabled: true }, select: { id: true, slug: true, ruleType: true } });
    const selected = selectWeeklyQuestRotation(definitions, weekStart);
    if (selected.length > 0) await transaction.weeklyQuestSelection.createMany({ data: selected.map((definition, sortOrder) => ({ cycleId: cycle.id, definitionId: definition.id, sortOrder })), skipDuplicates: true });
  }
  return transaction.weeklyQuestCycle.findUniqueOrThrow({ where: { id: cycle.id }, include: { selections: { include: { definition: true }, orderBy: { sortOrder: "asc" } } } });
}

async function awardAccumulatedPlaytimeXp(transaction: Prisma.TransactionClient, userId: string, eventId: string, earnedAt: Date) {
  const [duration, awarded] = await Promise.all([
    transaction.serverEvent.aggregate({ where: { eventType: "PLAYER_LEFT", source: { in: verifiedSessionSources }, sourceConfidence: { gte: 100 }, valueNumber: { gt: 0 }, playerIdentity: { is: { userId, verifiedAt: { not: null } } } }, _sum: { valueNumber: true } }),
    transaction.userXpEntry.aggregate({ where: { userId, source: "VERIFIED_PLAYTIME" }, _sum: { amount: true } }),
  ]);
  const targetXp = verifiedPlaytimeXp(duration._sum.valueNumber ?? 0);
  const delta = targetXp - (awarded._sum.amount ?? 0);
  if (delta <= 0) return;
  await transaction.userXpEntry.upsert({
    where: { dedupeKey: `verified-playtime:${userId}:${targetXp}` },
    create: { userId, serverEventId: eventId, source: "VERIFIED_PLAYTIME", amount: delta, description: "Verified Habitat playtime", earnedAt, dedupeKey: `verified-playtime:${userId}:${targetXp}` },
    update: {},
  });
}

async function measureQuestProgress(transaction: Prisma.TransactionClient, userId: string, ruleType: "PLAY_SECONDS" | "JOIN_COUNT" | "DISTINCT_GAME_COUNT", weekStart: Date, endsAt: Date) {
  const common = { occurredAt: { gte: weekStart, lt: endsAt }, sourceConfidence: { gte: 100 }, playerIdentity: { is: { userId, verifiedAt: { not: null } } } } as const;
  if (ruleType === "PLAY_SECONDS") {
    const value = await transaction.serverEvent.aggregate({ where: { ...common, eventType: "PLAYER_LEFT", source: { in: verifiedSessionSources }, valueNumber: { gt: 0 } }, _sum: { valueNumber: true } });
    return Math.floor(value._sum.valueNumber ?? 0);
  }
  if (ruleType === "JOIN_COUNT") return transaction.serverEvent.count({ where: { ...common, eventType: "PLAYER_JOINED" } });
  const games = await transaction.serverEvent.findMany({ where: { ...common, eventType: "PLAYER_JOINED" }, distinct: ["gameType"], select: { gameType: true } });
  return games.length;
}
