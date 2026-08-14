import type { Prisma } from "@habitat/db/client";
import {
  parseActivityCountRule,
  parseActivityStatThresholdRule,
  parseActivityValueSumRule,
  parseDistinctActivityGameRule,
  parseDistinctGameEventCountRule,
  parseEventCountRule,
  parseGameEventCountRule,
  parseLegacyEvidenceCountRule,
  parseLevelReachedRule,
  parseOrderedActivityStreakRule,
} from "@habitat/shared";
import type { IdentityScope } from "./scope";

export type EligibilityDefinition = { ruleType: string; ruleConfig: unknown; gameKey: string | null };

/** Rule types whose evidence hangs off owned player identities, so a claim can change them. */
export const identityScopedRuleTypes = ["EVENT_COUNT", "GAME_EVENT_COUNT", "DISTINCT_GAME_EVENT_COUNT", "LEGACY_EVIDENCE_COUNT", "LEVEL_REACHED"] as const;

/** Rule types measured against `GameActivity`, which is keyed by member rather than identity. */
export const activityScopedRuleTypes = ["ACTIVITY_COUNT", "ACTIVITY_VALUE_SUM", "DISTINCT_ACTIVITY_GAME_COUNT", "ORDERED_ACTIVITY_STREAK", "SHARED_ACTIVITY_COUNT", "ACTIVITY_STAT_THRESHOLD"] as const;

/** Rules whose truth value can change when one owned identity is attached or detached. */
export const ownershipSensitiveRuleTypes = [...identityScopedRuleTypes, "LEVEL_REACHED"] as const;

/**
 * Evaluates one achievement rule against a hypothetical identity scope.
 *
 * `level` is supplied by the caller rather than read back from the XP ledger so
 * that a projection can ask about a level the member does not hold yet.
 */
export async function isDefinitionEligible(
  transaction: Prisma.TransactionClient,
  definition: EligibilityDefinition,
  scope: IdentityScope,
  level: number,
): Promise<boolean> {
  if (definition.ruleType === "LEVEL_REACHED") {
    const rule = parseLevelReachedRule(definition.ruleConfig);
    return Boolean(rule) && level >= rule!.level;
  }
  if ((identityScopedRuleTypes as readonly string[]).includes(definition.ruleType)) {
    return isIdentityEligible(transaction, definition, scope);
  }
  if ((activityScopedRuleTypes as readonly string[]).includes(definition.ruleType)) {
    return isActivityEligible(transaction, definition, scope.userId);
  }
  return false;
}

export async function isIdentityEligible(transaction: Prisma.TransactionClient, definition: EligibilityDefinition, scope: IdentityScope): Promise<boolean> {
  const identityScope = { playerIdentityId: { in: scope.identityIds } };
  if (scope.identityIds.length === 0) return false;

  if (definition.ruleType === "EVENT_COUNT") {
    const rule = parseEventCountRule(definition.ruleConfig);
    if (!rule) return false;
    return await transaction.serverEvent.count({ where: { ...identityScope, eventType: rule.eventType } }) >= rule.threshold;
  }
  if (definition.ruleType === "DISTINCT_GAME_EVENT_COUNT") {
    const rule = parseDistinctGameEventCountRule(definition.ruleConfig);
    if (!rule) return false;
    const games = await transaction.serverEvent.findMany({ where: { ...identityScope, eventType: rule.eventType }, distinct: ["gameType"], select: { gameType: true } });
    return games.length >= rule.threshold;
  }
  if (definition.ruleType === "GAME_EVENT_COUNT") {
    const rule = parseGameEventCountRule(definition.ruleConfig);
    if (!rule) return false;
    return await transaction.serverEvent.count({ where: { ...identityScope, eventType: rule.eventType, gameType: rule.gameType } }) >= rule.threshold;
  }
  if (definition.ruleType === "LEGACY_EVIDENCE_COUNT") {
    const rule = parseLegacyEvidenceCountRule(definition.ruleConfig);
    if (!rule) return false;
    return await transaction.legacyPlayerEvidence.count({ where: identityScope }) >= rule.threshold;
  }
  return false;
}

export async function isActivityEligible(transaction: Prisma.TransactionClient, definition: EligibilityDefinition, userId: string): Promise<boolean> {
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
