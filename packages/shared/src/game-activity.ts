export const habitatGameKeys = ["SEVEN_DAYS_TO_DIE", "PROJECT_ZOMBOID", "DRAGONWILDS", "ENSHROUDED", "PALWORLD", "VALHEIM", "MARVEL_RIVALS"] as const;
export const gameActivityTypes = ["SESSION_STARTED", "MATCH_PLAYED", "MATCH_WON", "MATCH_LOST", "MATCH_DRAWN", "KILLS_RECORDED", "DEATHS_RECORDED", "ASSISTS_RECORDED", "MVP_EARNED", "SVP_EARNED", "SHARED_MATCH_PLAYED", "BOSS_KILLED", "RATING_CHANGED"] as const;

export type HabitatGameKey = (typeof habitatGameKeys)[number];
export type GameActivityType = (typeof gameActivityTypes)[number];
export type ActivityCountRule = { activityType: GameActivityType; threshold: number; minimumConfidence: number };
export type ActivityValueSumRule = ActivityCountRule;
export type DistinctActivityGameRule = ActivityCountRule;
export type OrderedActivityStreakRule = { successActivityType: GameActivityType; breakActivityTypes: GameActivityType[]; threshold: number; minimumConfidence: number };
export type ActivityStatThresholdRule = { activityType: GameActivityType; threshold: number; comparison: "GTE" | "LTE"; aggregation: "MAX" | "MIN" | "LATEST"; minimumConfidence: number };
export type ActivityRecordRule = { activityType: GameActivityType; minimumConfidence: number };

export function isHabitatGameKey(value: unknown): value is HabitatGameKey {
  return typeof value === "string" && habitatGameKeys.includes(value as HabitatGameKey);
}

export function isGameActivityType(value: unknown): value is GameActivityType {
  return typeof value === "string" && gameActivityTypes.includes(value as GameActivityType);
}

export function parseActivityCountRule(value: unknown): ActivityCountRule | null {
  if (!isRecord(value) || !isGameActivityType(value.activityType) || !isPositiveInteger(value.threshold)) return null;
  return { activityType: value.activityType, threshold: value.threshold, minimumConfidence: confidence(value.minimumConfidence) };
}

export const parseActivityValueSumRule = parseActivityCountRule;
export const parseDistinctActivityGameRule = parseActivityCountRule;

export function parseOrderedActivityStreakRule(value: unknown): OrderedActivityStreakRule | null {
  if (!isRecord(value) || !isGameActivityType(value.successActivityType) || !Array.isArray(value.breakActivityTypes) || !value.breakActivityTypes.every(isGameActivityType) || !isPositiveInteger(value.threshold)) return null;
  return { successActivityType: value.successActivityType, breakActivityTypes: [...new Set(value.breakActivityTypes)], threshold: value.threshold, minimumConfidence: confidence(value.minimumConfidence) };
}

export function parseActivityStatThresholdRule(value: unknown): ActivityStatThresholdRule | null {
  if (!isRecord(value) || !isGameActivityType(value.activityType) || typeof value.threshold !== "number" || !Number.isFinite(value.threshold) || !["GTE", "LTE"].includes(String(value.comparison)) || !["MAX", "MIN", "LATEST"].includes(String(value.aggregation))) return null;
  return { activityType: value.activityType, threshold: value.threshold, comparison: value.comparison as "GTE" | "LTE", aggregation: value.aggregation as "MAX" | "MIN" | "LATEST", minimumConfidence: confidence(value.minimumConfidence) };
}

export function parseActivityRecordRule(value: unknown): ActivityRecordRule | null {
  if (!isRecord(value) || !isGameActivityType(value.activityType)) return null;
  return { activityType: value.activityType, minimumConfidence: confidence(value.minimumConfidence) };
}

function confidence(value: unknown) {
  return typeof value === "number" && Number.isInteger(value) && value >= 0 && value <= 100 ? value : 100;
}

function isPositiveInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value > 0 && value <= 1_000_000;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
