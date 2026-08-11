import { auth } from "@/auth";
import { getPrismaClient } from "@habitat/db/client";
import {
  parseDistinctGameEventCountRule,
  parseEventCountRule,
  parseGameEventCountRule,
  parseLegacyEvidenceCountRule,
  parseLevelReachedRule,
  progressionForXp,
  rarityPresentation,
  type AchievementRarity,
  type AchievementRewardKind,
} from "@habitat/shared";
import { AchievementArchive, type AchievementArchiveEntry } from "@/components/achievement-archive";

const db = getPrismaClient();

export default async function AchievementsPage() {
  const session = await auth();
  const userId = session?.user?.id && session.user.isActive ? session.user.id : null;
  const [definitions, earned, gameVisits, legacyCount, xpTotal] = await Promise.all([
    db.achievementDefinition.findMany({
      where: { enabled: true },
      include: { rewards: { select: { kind: true, code: true, name: true } }, _count: { select: { awards: true } } },
    }),
    userId ? db.playerAchievement.findMany({ where: { userId }, select: { achievementDefinitionId: true, awardedAt: true } }) : Promise.resolve([]),
    userId ? db.serverEvent.groupBy({ by: ["gameType"], where: { eventType: "PLAYER_JOINED", playerIdentity: { userId } }, _count: { _all: true } }) : Promise.resolve([]),
    userId ? db.legacyPlayerEvidence.count({ where: { playerIdentity: { userId } } }) : Promise.resolve(0),
    userId ? db.userXpEntry.aggregate({ where: { userId }, _sum: { amount: true } }) : Promise.resolve({ _sum: { amount: null } }),
  ]);
  const awards = new Map(earned.map((award) => [award.achievementDefinitionId, award.awardedAt]));
  const visitsByGame = new Map(gameVisits.map((entry) => [entry.gameType, entry._count._all]));
  const totalVisits = gameVisits.reduce((total, entry) => total + entry._count._all, 0);
  const level = progressionForXp(xpTotal._sum.amount ?? 0).level;

  const entries: AchievementArchiveEntry[] = definitions.map((definition) => {
    const awardedAt = awards.get(definition.id) ?? null;
    const earnedByUser = Boolean(awardedAt);
    let progress: number | null = null;
    let target: number | null = null;
    if (userId && definition.ruleType === "EVENT_COUNT") {
      const rule = parseEventCountRule(definition.ruleConfig);
      if (rule) { progress = totalVisits; target = rule.threshold; }
    } else if (userId && definition.ruleType === "GAME_EVENT_COUNT") {
      const rule = parseGameEventCountRule(definition.ruleConfig);
      if (rule) { progress = visitsByGame.get(rule.gameType) ?? 0; target = rule.threshold; }
    } else if (userId && definition.ruleType === "DISTINCT_GAME_EVENT_COUNT") {
      const rule = parseDistinctGameEventCountRule(definition.ruleConfig);
      if (rule) { progress = gameVisits.length; target = rule.threshold; }
    } else if (userId && definition.ruleType === "LEGACY_EVIDENCE_COUNT") {
      const rule = parseLegacyEvidenceCountRule(definition.ruleConfig);
      if (rule) { progress = legacyCount; target = rule.threshold; }
    } else if (userId && definition.ruleType === "LEVEL_REACHED") {
      const rule = parseLevelReachedRule(definition.ruleConfig);
      if (rule) { progress = level; target = rule.level; }
    }
    const concealed = definition.isSecret && !earnedByUser;
    return {
      id: definition.id,
      slug: definition.slug,
      name: concealed ? "" : definition.name,
      description: concealed ? "" : definition.description,
      secretDescription: definition.secretDescription,
      rarity: definition.rarity as AchievementRarity,
      category: concealed ? "Secret" : definition.category,
      points: concealed ? 0 : definition.points,
      isSecret: definition.isSecret,
      earned: earnedByUser,
      awardedAt: awardedAt?.toISOString() ?? null,
      awardedCount: definition._count.awards,
      progress: concealed ? null : progress,
      target: concealed ? null : target,
      rewards: concealed ? [] : definition.rewards.map((reward) => ({ ...reward, kind: reward.kind as AchievementRewardKind })),
    };
  }).sort((left, right) => Number(right.earned) - Number(left.earned) || rarityPresentation[right.rarity].rank - rarityPresentation[left.rarity].rank || left.name.localeCompare(right.name));

  return <section className="page-shell achievement-page"><AchievementArchive entries={entries} /></section>;
}
