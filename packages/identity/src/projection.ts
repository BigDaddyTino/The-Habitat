import type { Prisma } from "@habitat/db/client";
import { progressionForXp, utcWeekWindow, verifiedPlaytimeXp } from "@habitat/shared";
import { isDefinitionEligible } from "./eligibility";
import type { IdentityScope } from "./scope";

/** The two `ServerEvent.source` values the progression engine treats as measured sessions. */
export const verifiedSessionSources = ["PALWORLD_REST", "LEGACY_HISTORY_IMPORT"];

export type LedgerProjection = {
  /** Session seconds that can earn XP: measured `PLAYER_LEFT` events on verified identities. */
  verifiedSessionSeconds: number;
  /** Imported legacy session seconds. These count toward displayed hours but never toward XP. */
  legacyEvidenceSeconds: number;
  /**
   * The part of `verifiedSessionSeconds` that came from the legacy importer.
   * The importer writes both a `ServerEvent` and a `LegacyPlayerEvidence` row
   * for the same session, so when this is non-zero the displayed hours count
   * that history through both paths. Tracked so the preview can say so.
   */
  legacyImportSessionSeconds: number;
  /** Hours as the leaderboards and profiles present them. */
  trackedSeconds: number;
  sessionCount: number;
  joinCount: number;
  distinctGameTypes: number;
  playtimeXp: number;
  questXp: number;
  totalXp: number;
  level: number;
  eligibleDefinitionIds: string[];
  achievementPoints: number;
};

export type ProjectableDefinition = { id: string; ruleType: string; ruleConfig: unknown; gameKey: string | null; points: number };

export async function loadProjectableDefinitions(transaction: Prisma.TransactionClient): Promise<ProjectableDefinition[]> {
  return transaction.achievementDefinition.findMany({ where: { enabled: true }, select: { id: true, ruleType: true, ruleConfig: true, gameKey: true, points: true } });
}

/**
 * Computes everything a member's progression would look like for a given
 * identity scope, without writing anything. Running it for the scope with and
 * without a candidate identity is what produces the pre-claim impact preview
 * and the pre-unlink consequence list.
 */
export async function projectLedger(
  transaction: Prisma.TransactionClient,
  scope: IdentityScope,
  definitions: ProjectableDefinition[],
  now = new Date(),
): Promise<LedgerProjection> {
  const verifiedScope = { playerIdentityId: { in: scope.verifiedIdentityIds } };
  const ownedScope = { playerIdentityId: { in: scope.identityIds } };
  const sessionFilter = { ...verifiedScope, eventType: "PLAYER_LEFT" as const, source: { in: verifiedSessionSources }, sourceConfidence: { gte: 100 }, valueNumber: { gt: 0 } };

  const [sessions, legacyImportSessions, legacy, joinCount, gameTypes, questEntries] = await Promise.all([
    scope.verifiedIdentityIds.length > 0
      ? transaction.serverEvent.aggregate({ where: sessionFilter, _sum: { valueNumber: true }, _count: { _all: true } })
      : Promise.resolve({ _sum: { valueNumber: 0 }, _count: { _all: 0 } }),
    scope.verifiedIdentityIds.length > 0
      ? transaction.serverEvent.aggregate({ where: { ...sessionFilter, source: "LEGACY_HISTORY_IMPORT" }, _sum: { valueNumber: true } })
      : Promise.resolve({ _sum: { valueNumber: 0 } }),
    scope.identityIds.length > 0
      ? transaction.legacyPlayerEvidence.aggregate({ where: { ...ownedScope, kind: "SESSION" }, _sum: { durationSeconds: true } })
      : Promise.resolve({ _sum: { durationSeconds: 0 } }),
    scope.identityIds.length > 0 ? transaction.serverEvent.count({ where: { ...ownedScope, eventType: "PLAYER_JOINED" } }) : Promise.resolve(0),
    scope.identityIds.length > 0
      ? transaction.serverEvent.findMany({ where: { ...ownedScope, eventType: "PLAYER_JOINED" }, distinct: ["gameType"], select: { gameType: true } })
      : Promise.resolve([]),
    transaction.userXpEntry.aggregate({ where: { userId: scope.userId, source: "WEEKLY_QUEST" }, _sum: { amount: true } }),
  ]);

  const verifiedSessionSeconds = sessions._sum.valueNumber ?? 0;
  const legacyEvidenceSeconds = legacy._sum.durationSeconds ?? 0;
  const playtimeXp = verifiedPlaytimeXp(verifiedSessionSeconds);
  const earnedQuestXp = questEntries._sum.amount ?? 0;
  const projectedQuestXp = earnedQuestXp + await projectOutstandingQuestXp(transaction, scope, now);
  const totalXp = playtimeXp + projectedQuestXp;
  const level = progressionForXp(totalXp).level;

  const eligibleDefinitionIds: string[] = [];
  let achievementPoints = 0;
  for (const definition of definitions) {
    if (!await isDefinitionEligible(transaction, definition, scope, level)) continue;
    eligibleDefinitionIds.push(definition.id);
    achievementPoints += definition.points;
  }

  return {
    verifiedSessionSeconds,
    legacyEvidenceSeconds,
    legacyImportSessionSeconds: legacyImportSessions._sum.valueNumber ?? 0,
    trackedSeconds: verifiedSessionSeconds + legacyEvidenceSeconds,
    sessionCount: sessions._count._all,
    joinCount,
    distinctGameTypes: gameTypes.length,
    playtimeXp,
    questXp: projectedQuestXp,
    totalXp,
    level,
    eligibleDefinitionIds,
    achievementPoints,
  };
}

/**
 * Weekly quest XP the scope would newly complete in the current cycle. Past
 * cycles are never recomputed by the progression engine, so quest XP already in
 * the ledger stays exactly as earned and only the open week can move.
 */
async function projectOutstandingQuestXp(transaction: Prisma.TransactionClient, scope: IdentityScope, now: Date): Promise<number> {
  if (scope.verifiedIdentityIds.length === 0) return 0;
  const { weekStart, endsAt } = utcWeekWindow(now);
  const cycle = await transaction.weeklyQuestCycle.findUnique({ where: { weekStart }, include: { selections: { include: { definition: true } } } });
  if (!cycle) return 0;

  const window = { occurredAt: { gte: weekStart, lt: endsAt }, sourceConfidence: { gte: 100 }, playerIdentityId: { in: scope.verifiedIdentityIds } };
  let outstanding = 0;
  for (const selection of cycle.selections) {
    const existing = await transaction.userWeeklyQuestProgress.findUnique({ where: { userId_selectionId: { userId: scope.userId, selectionId: selection.id } }, select: { completedAt: true } });
    if (existing?.completedAt) continue;
    const measured = await measureQuestProgress(transaction, window, selection.definition.ruleType);
    if (measured >= selection.definition.threshold) outstanding += selection.definition.xpReward;
  }
  return outstanding;
}

async function measureQuestProgress(
  transaction: Prisma.TransactionClient,
  window: { occurredAt: { gte: Date; lt: Date }; sourceConfidence: { gte: number }; playerIdentityId: { in: string[] } },
  ruleType: "PLAY_SECONDS" | "JOIN_COUNT" | "DISTINCT_GAME_COUNT",
): Promise<number> {
  if (ruleType === "PLAY_SECONDS") {
    const value = await transaction.serverEvent.aggregate({ where: { ...window, eventType: "PLAYER_LEFT", source: { in: verifiedSessionSources }, valueNumber: { gt: 0 } }, _sum: { valueNumber: true } });
    return Math.floor(value._sum.valueNumber ?? 0);
  }
  if (ruleType === "JOIN_COUNT") return transaction.serverEvent.count({ where: { ...window, eventType: "PLAYER_JOINED" } });
  const games = await transaction.serverEvent.findMany({ where: { ...window, eventType: "PLAYER_JOINED" }, distinct: ["gameType"], select: { gameType: true } });
  return games.length;
}
