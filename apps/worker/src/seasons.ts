import { getPrismaClient, type Prisma } from "@habitat/db/client";
import { verifiedPlaytimeXp } from "@habitat/shared";

const verifiedSessionSources = ["PALWORLD_REST", "LEGACY_HISTORY_IMPORT"];

type SeasonWindow = { id: string; ordinal: number; name: string; startsAt: Date; endsAt: Date };
type SeasonRule = "PLAY_SECONDS" | "JOIN_COUNT" | "DISTINCT_GAME_COUNT" | "BOSS_KILL_COUNT";

function completionTime(now: Date, season: SeasonWindow) {
  return now < season.endsAt ? now : season.endsAt;
}

export async function processSeasonProgressionForEvent(transaction: Prisma.TransactionClient, eventId: string, now = new Date()) {
  const event = await transaction.serverEvent.findUnique({ where: { id: eventId }, select: { id: true, occurredAt: true, playerIdentity: { select: { userId: true, verifiedAt: true } } } });
  const userId = event?.playerIdentity?.userId;
  if (!event || !userId || !event.playerIdentity?.verifiedAt) return;
  const memberships = await transaction.seasonMembership.findMany({
    where: { userId, season: { isEnabled: true, startsAt: { lte: event.occurredAt }, endsAt: { gt: event.occurredAt } } },
    include: { season: true },
  });
  for (const membership of memberships) {
    await reconcileSeasonMember(transaction, membership.season, userId, event.id, event.occurredAt);
    await reconcileCooperativeGoals(transaction, membership.season, event.id, now);
  }
}

export async function reconcileSeasons(now = new Date()) {
  const db = getPrismaClient();
  const seasons = await db.season.findMany({ where: { isEnabled: true, status: { not: "COMPLETED" }, startsAt: { lte: now } }, orderBy: { startsAt: "asc" } });
  let members = 0;
  let completed = 0;
  for (const season of seasons) {
    await db.$transaction(async (transaction) => {
      if (season.status === "UPCOMING" && season.endsAt > now) await transaction.season.update({ where: { id: season.id }, data: { status: "ACTIVE" } });
      const memberships = await transaction.seasonMembership.findMany({ where: { seasonId: season.id }, select: { userId: true } });
      for (const membership of memberships) await reconcileSeasonMember(transaction, season, membership.userId, null, now);
      await reconcileCooperativeGoals(transaction, season, null, now);
      if (season.endsAt <= now) {
        await closeSeason(transaction, season, now);
        completed += 1;
      }
      members += memberships.length;
    });
  }
  return { seasons: seasons.length, members, completed };
}

async function reconcileSeasonMember(transaction: Prisma.TransactionClient, season: SeasonWindow, userId: string, serverEventId: string | null, now: Date) {
  const duration = await transaction.serverEvent.aggregate({
    where: {
      occurredAt: { gte: season.startsAt, lt: season.endsAt }, eventType: "PLAYER_LEFT", source: { in: verifiedSessionSources },
      sourceConfidence: { gte: 100 }, valueNumber: { gt: 0 }, playerIdentity: { is: { userId, verifiedAt: { not: null } } },
    },
    _sum: { valueNumber: true },
  });
  const targetXp = verifiedPlaytimeXp(duration._sum.valueNumber ?? 0);
  const awarded = await transaction.seasonXpEntry.aggregate({ where: { seasonId: season.id, userId, source: "VERIFIED_PLAYTIME" }, _sum: { amount: true } });
  const delta = targetXp - (awarded._sum.amount ?? 0);
  if (delta > 0) await transaction.seasonXpEntry.upsert({
    where: { dedupeKey: `season-playtime:${season.id}:${userId}:${targetXp}` },
    create: { seasonId: season.id, userId, serverEventId, source: "VERIFIED_PLAYTIME", amount: delta, description: `${season.name}: verified playtime`, earnedAt: completionTime(now, season), dedupeKey: `season-playtime:${season.id}:${userId}:${targetXp}` },
    update: {},
  });

  const quests = await transaction.seasonQuestDefinition.findMany({ where: { seasonId: season.id, scope: "PERSONAL", enabled: true }, orderBy: { sortOrder: "asc" } });
  for (const quest of quests) {
    const measured = await measureSeasonRule(transaction, season, quest.ruleType, { userIds: [userId], gameType: quest.gameType });
    const progressValue = Math.min(quest.threshold, measured);
    const existing = await transaction.userSeasonQuestProgress.findUnique({ where: { userId_questId: { userId, questId: quest.id } }, select: { completedAt: true } });
    const completedAt = existing?.completedAt ?? (progressValue >= quest.threshold ? completionTime(now, season) : null);
    await transaction.userSeasonQuestProgress.upsert({
      where: { userId_questId: { userId, questId: quest.id } },
      create: { userId, questId: quest.id, progress: progressValue, completedAt },
      update: { progress: progressValue, completedAt },
    });
    if (completedAt) await transaction.seasonXpEntry.upsert({
      where: { dedupeKey: `season-personal-quest:${quest.id}:${userId}` },
      create: { seasonId: season.id, userId, serverEventId, source: "PERSONAL_QUEST", amount: quest.xpReward, description: `Personal quest: ${quest.name}`, earnedAt: completedAt, dedupeKey: `season-personal-quest:${quest.id}:${userId}` },
      update: {},
    });
  }
}

async function reconcileCooperativeGoals(transaction: Prisma.TransactionClient, season: SeasonWindow, serverEventId: string | null, now: Date) {
  const memberships = await transaction.seasonMembership.findMany({ where: { seasonId: season.id }, select: { userId: true } });
  const userIds = memberships.map((membership) => membership.userId);
  const quests = await transaction.seasonQuestDefinition.findMany({ where: { seasonId: season.id, scope: "TEAM", enabled: true }, orderBy: { sortOrder: "asc" } });
  for (const quest of quests) {
    const measured = await measureSeasonRule(transaction, season, quest.ruleType, { userIds, gameType: quest.gameType });
    const progressValue = Math.min(quest.threshold, measured);
    const existing = await transaction.seasonTeamQuestProgress.findUnique({ where: { questId: quest.id }, select: { completedAt: true } });
    const completedAt = existing?.completedAt ?? (progressValue >= quest.threshold ? completionTime(now, season) : null);
    await transaction.seasonTeamQuestProgress.upsert({ where: { questId: quest.id }, create: { questId: quest.id, progress: progressValue, completedAt }, update: { progress: progressValue, completedAt } });
    if (completedAt) {
      for (const userId of userIds) await transaction.seasonXpEntry.upsert({
        where: { dedupeKey: `season-team-quest:${quest.id}:${userId}` },
        create: { seasonId: season.id, userId, serverEventId, source: "TEAM_QUEST", amount: quest.xpReward, description: `Team quest: ${quest.name}`, earnedAt: completedAt, dedupeKey: `season-team-quest:${quest.id}:${userId}` },
        update: {},
      });
    }
  }

  const expeditions = await transaction.seasonExpedition.findMany({ where: { seasonId: season.id }, orderBy: { sortOrder: "asc" } });
  for (const expedition of expeditions) {
    const measured = await measureSeasonRule(transaction, season, expedition.ruleType, { userIds, gameType: expedition.gameType });
    const progress = Math.min(expedition.threshold, measured);
    await transaction.seasonExpedition.update({ where: { id: expedition.id }, data: { progress, completedAt: expedition.completedAt ?? (progress >= expedition.threshold ? completionTime(now, season) : null) } });
  }
}

async function measureSeasonRule(transaction: Prisma.TransactionClient, season: SeasonWindow, ruleType: SeasonRule, scope: { userIds: string[]; gameType: string | null }) {
  if (scope.userIds.length === 0) return 0;
  const common = {
    occurredAt: { gte: season.startsAt, lt: season.endsAt }, sourceConfidence: { gte: 100 },
    playerIdentity: { is: { userId: { in: scope.userIds }, verifiedAt: { not: null } } },
    ...(scope.gameType ? { gameType: scope.gameType as never } : {}),
  } as const;
  if (ruleType === "PLAY_SECONDS") {
    const result = await transaction.serverEvent.aggregate({ where: { ...common, eventType: "PLAYER_LEFT", source: { in: verifiedSessionSources }, valueNumber: { gt: 0 } }, _sum: { valueNumber: true } });
    return Math.floor(result._sum.valueNumber ?? 0);
  }
  if (ruleType === "JOIN_COUNT") return transaction.serverEvent.count({ where: { ...common, eventType: "PLAYER_JOINED" } });
  if (ruleType === "BOSS_KILL_COUNT") return transaction.serverEvent.count({ where: { ...common, eventType: "BOSS_KILLED" } });
  const games = await transaction.serverEvent.findMany({ where: { ...common, eventType: "PLAYER_JOINED" }, distinct: ["gameType"], select: { gameType: true } });
  return games.length;
}

async function closeSeason(transaction: Prisma.TransactionClient, season: SeasonWindow & { id: string }, now: Date) {
  const [memberships, totals, expeditions, quests, trophies] = await Promise.all([
    transaction.seasonMembership.findMany({ where: { seasonId: season.id }, select: { userId: true } }),
    transaction.seasonXpEntry.groupBy({ by: ["userId"], where: { seasonId: season.id }, _sum: { amount: true } }),
    transaction.seasonExpedition.findMany({ where: { seasonId: season.id }, orderBy: { sortOrder: "asc" }, select: { name: true, gameType: true, progress: true, threshold: true, completedAt: true } }),
    transaction.seasonQuestDefinition.findMany({ where: { seasonId: season.id }, select: { id: true, name: true, scope: true, teamProgress: { select: { completedAt: true } }, personalProgress: { where: { completedAt: { not: null } }, select: { id: true } } } }),
    transaction.seasonTrophy.findMany({ where: { seasonId: season.id } }),
  ]);
  const users = await transaction.user.findMany({ where: { id: { in: totals.map((entry) => entry.userId) } }, select: { id: true, displayName: true, name: true, username: true } });
  const names = new Map(users.map((user) => [user.id, { name: user.displayName ?? user.name ?? "Habitat member", username: user.username }]));
  const contributors = totals.map((entry) => ({ userId: entry.userId, ...names.get(entry.userId), xp: entry._sum.amount ?? 0 })).sort((left, right) => right.xp - left.xp).slice(0, 10);
  const communityXp = totals.reduce((sum, entry) => sum + (entry._sum.amount ?? 0), 0);
  await transaction.seasonChronicle.upsert({
    where: { seasonId: season.id },
    create: { seasonId: season.id, generatedAt: now, snapshot: { version: 1, communityXp, memberCount: memberships.length, contributors, expeditions: expeditions.map((expedition) => ({ ...expedition, completedAt: expedition.completedAt?.toISOString() ?? null })), quests: quests.map((quest) => ({ name: quest.name, scope: quest.scope, completions: quest.scope === "TEAM" ? Number(Boolean(quest.teamProgress?.completedAt)) : quest.personalProgress.length })) } },
    update: {},
  });
  for (const membership of memberships) {
    for (const trophy of trophies.filter((reward) => reward.kind === "COMMEMORATIVE" || (reward.kind === "FOUNDING_MEMBER" && season.ordinal === 1))) {
      await transaction.userSeasonTrophy.upsert({ where: { userId_trophyId: { userId: membership.userId, trophyId: trophy.id } }, create: { userId: membership.userId, trophyId: trophy.id, unlockedAt: now }, update: {} });
    }
  }
  await transaction.season.update({ where: { id: season.id }, data: { status: "COMPLETED", completedAt: now } });
}
