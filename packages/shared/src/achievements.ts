export const achievementEventTypes = ["PLAYER_JOINED"] as const;

export type AchievementEventType = (typeof achievementEventTypes)[number];
export type EventCountRule = { eventType: AchievementEventType; threshold: number };
export type DistinctGameEventCountRule = { eventType: AchievementEventType; threshold: number };

export function parseEventCountRule(value: unknown): EventCountRule | null {
  if (!isRecord(value) || !isAchievementEventType(value.eventType) || !isPositiveInteger(value.threshold)) return null;
  return { eventType: value.eventType, threshold: value.threshold };
}

export function parseDistinctGameEventCountRule(value: unknown): DistinctGameEventCountRule | null {
  if (!isRecord(value) || !isAchievementEventType(value.eventType) || !isPositiveInteger(value.threshold)) return null;
  return { eventType: value.eventType, threshold: value.threshold };
}

function isAchievementEventType(value: unknown): value is AchievementEventType {
  return typeof value === "string" && achievementEventTypes.includes(value as AchievementEventType);
}

function isPositiveInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value > 0 && value <= 100;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object";
}
