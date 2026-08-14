import type { Prisma } from "@habitat/db/client";
import { loadProjectableDefinitions, projectLedger, type LedgerProjection } from "./projection";
import { currentIdentityScope, scopeWithIdentity, scopeWithoutIdentity, type IdentityScope } from "./scope";

export type ImpactDirection = "GRANT" | "REVOKE";

export type ImpactedAchievement = { id: string; slug: string; name: string; rarity: string; points: number };
export type ImpactedTitle = { id: string; name: string; achievementName: string };

export type OwnershipImpact = {
  direction: ImpactDirection;
  before: LedgerProjection;
  after: LedgerProjection;
  delta: {
    trackedSeconds: number;
    trackedHours: number;
    verifiedSessionSeconds: number;
    legacyEvidenceSeconds: number;
    legacyImportSessionSeconds: number;
    sessionCount: number;
    joinCount: number;
    distinctGameTypes: number;
    totalXp: number;
    levels: number;
    achievementCount: number;
    achievementPoints: number;
  };
  achievementsGained: ImpactedAchievement[];
  achievementsLost: ImpactedAchievement[];
  titlesGained: ImpactedTitle[];
  titlesLost: ImpactedTitle[];
  /** One-sentence summary suitable for a confirmation dialog. */
  headline: string;
  /** Things the projection deliberately does not model, stated rather than hidden. */
  caveats: string[];
};

/**
 * Projects a member's progression with and without one identity and returns the
 * difference. Nothing is written; this runs before an administrator confirms.
 */
export async function previewOwnershipChange(
  transaction: Prisma.TransactionClient,
  input: { playerIdentityId: string; userId: string; direction: ImpactDirection },
  now = new Date(),
): Promise<OwnershipImpact> {
  const definitions = await loadProjectableDefinitions(transaction);
  const currentScope = await currentIdentityScope(transaction, input.userId);
  const { beforeScope, afterScope } = input.direction === "GRANT"
    ? { beforeScope: scopeWithoutIdentity(currentScope, input.playerIdentityId), afterScope: scopeWithIdentity(currentScope, input.playerIdentityId) }
    : { beforeScope: scopeWithIdentity(currentScope, input.playerIdentityId), afterScope: scopeWithoutIdentity(currentScope, input.playerIdentityId) };

  const before = await projectLedger(transaction, beforeScope, definitions, now);
  const after = await projectLedger(transaction, afterScope, definitions, now);
  return buildImpact(transaction, input.direction, before, after, afterScope);
}

/** Builds the impact of a scope change that has already been computed. */
export async function buildImpact(
  transaction: Prisma.TransactionClient,
  direction: ImpactDirection,
  before: LedgerProjection,
  after: LedgerProjection,
  scope: IdentityScope,
): Promise<OwnershipImpact> {
  const beforeIds = new Set(before.eligibleDefinitionIds);
  const afterIds = new Set(after.eligibleDefinitionIds);
  const gainedIds = after.eligibleDefinitionIds.filter((id) => !beforeIds.has(id));
  const lostIds = before.eligibleDefinitionIds.filter((id) => !afterIds.has(id));

  const [achievementsGained, achievementsLost] = await Promise.all([describeAchievements(transaction, gainedIds), describeAchievements(transaction, lostIds)]);
  const [titlesGained, titlesLost] = await Promise.all([describeTitles(transaction, gainedIds), describeTitles(transaction, lostIds)]);

  const delta = {
    trackedSeconds: after.trackedSeconds - before.trackedSeconds,
    trackedHours: Math.round(((after.trackedSeconds - before.trackedSeconds) / 3_600) * 10) / 10,
    verifiedSessionSeconds: after.verifiedSessionSeconds - before.verifiedSessionSeconds,
    legacyEvidenceSeconds: after.legacyEvidenceSeconds - before.legacyEvidenceSeconds,
    legacyImportSessionSeconds: after.legacyImportSessionSeconds - before.legacyImportSessionSeconds,
    sessionCount: after.sessionCount - before.sessionCount,
    joinCount: after.joinCount - before.joinCount,
    distinctGameTypes: after.distinctGameTypes - before.distinctGameTypes,
    totalXp: after.totalXp - before.totalXp,
    levels: after.level - before.level,
    achievementCount: achievementsGained.length - achievementsLost.length,
    achievementPoints: after.achievementPoints - before.achievementPoints,
  };

  return {
    direction,
    before,
    after,
    delta,
    achievementsGained,
    achievementsLost,
    titlesGained,
    titlesLost,
    headline: describeImpact(direction, delta, achievementsGained.length, achievementsLost.length),
    // Caveats describe the state that includes the identity in question: what
    // approving would produce, or what unlinking would take away.
    caveats: collectCaveats(direction, delta, scope, direction === "GRANT" ? after : before),
  };
}

/** "This claim will add 428 hours, 19 achievements and 14 levels." */
export function describeImpact(
  direction: ImpactDirection,
  delta: OwnershipImpact["delta"],
  gainedAchievements: number,
  lostAchievements: number,
): string {
  const subject = direction === "GRANT" ? "This claim will" : "Unlinking this identity will";
  const parts: string[] = [];
  const hours = Math.abs(delta.trackedHours);
  const levels = Math.abs(delta.levels);
  const achievements = direction === "GRANT" ? gainedAchievements : lostAchievements;

  if (hours > 0) parts.push(`${formatNumber(hours)} ${hours === 1 ? "hour" : "hours"}`);
  if (achievements > 0) parts.push(`${formatNumber(achievements)} ${achievements === 1 ? "achievement" : "achievements"}`);
  if (levels > 0) parts.push(`${formatNumber(levels)} ${levels === 1 ? "level" : "levels"}`);

  if (parts.length === 0) {
    const xp = Math.abs(delta.totalXp);
    if (xp > 0) return `${subject} ${direction === "GRANT" ? "add" : "remove"} ${formatNumber(xp)} XP without changing hours, achievements, or level.`;
    return `${subject} not change hours, XP, achievements, or level. This identity carries no verified history yet.`;
  }
  return `${subject} ${direction === "GRANT" ? "add" : "remove"} ${joinClauses(parts)}.`;
}

function collectCaveats(direction: ImpactDirection, delta: OwnershipImpact["delta"], scope: IdentityScope, after: LedgerProjection): string[] {
  const caveats: string[] = [];
  if (delta.legacyEvidenceSeconds !== 0 && delta.verifiedSessionSeconds === 0) {
    caveats.push("The hours shown come entirely from imported legacy sessions, which count toward displayed playtime but never toward XP.");
  }
  if (delta.legacyImportSessionSeconds !== 0 && delta.legacyEvidenceSeconds !== 0) {
    // The legacy importer writes a ServerEvent and a LegacyPlayerEvidence row
    // for the same session; leaderboards sum both, so the tracked-hours figure
    // predicts what the member will see rather than the true elapsed time.
    caveats.push("Imported history is recorded as both a session event and a legacy evidence row, and the tracked-hours figure sums both exactly as the leaderboards do. Read the XP-bearing and imported rows separately for true elapsed time.");
  }
  if (direction === "REVOKE") {
    caveats.push("Weekly quest XP already banked is not recalculated, including XP earned in the current week. Quest progress is historical and is never replayed during an ownership rollback.");
  }
  if (direction === "GRANT" && scope.identityIds.length > 1) {
    caveats.push("This member already owns other identities. Overlapping sessions between them would be counted twice; check the conflict list below.");
  }
  return caveats;
}

async function describeAchievements(transaction: Prisma.TransactionClient, definitionIds: string[]): Promise<ImpactedAchievement[]> {
  if (definitionIds.length === 0) return [];
  return transaction.achievementDefinition.findMany({ where: { id: { in: definitionIds } }, select: { id: true, slug: true, name: true, rarity: true, points: true }, orderBy: { name: "asc" } });
}

async function describeTitles(transaction: Prisma.TransactionClient, definitionIds: string[]): Promise<ImpactedTitle[]> {
  if (definitionIds.length === 0) return [];
  const rewards = await transaction.achievementReward.findMany({
    where: { achievementDefinitionId: { in: definitionIds }, kind: "TITLE", titleDefinitionId: { not: null } },
    select: { title: { select: { id: true, name: true } }, achievement: { select: { name: true } } },
  });
  return rewards.flatMap((reward) => (reward.title ? [{ id: reward.title.id, name: reward.title.name, achievementName: reward.achievement.name }] : []));
}

function joinClauses(parts: string[]): string {
  if (parts.length === 1) return parts[0]!;
  return `${parts.slice(0, -1).join(", ")} and ${parts[parts.length - 1]}`;
}

function formatNumber(value: number): string {
  return Number.isInteger(value) ? value.toLocaleString("en-US") : value.toLocaleString("en-US", { maximumFractionDigits: 1 });
}
