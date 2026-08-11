export const achievementEventTypes = ["PLAYER_JOINED"] as const;
export const achievementGameTypes = ["SEVEN_DAYS_TO_DIE", "PROJECT_ZOMBOID", "DRAGONWILDS", "ENSHROUDED", "PALWORLD", "VALHEIM"] as const;
export const achievementRarities = ["COMMON", "UNCOMMON", "RARE", "EPIC", "LEGENDARY", "QUESTIONABLE_LIFE_CHOICE"] as const;

export type AchievementEventType = (typeof achievementEventTypes)[number];
export type AchievementGameType = (typeof achievementGameTypes)[number];
export type AchievementRarity = (typeof achievementRarities)[number];
export type EventCountRule = { eventType: AchievementEventType; threshold: number };
export type GameEventCountRule = EventCountRule & { gameType: AchievementGameType };
export type DistinctGameEventCountRule = { eventType: AchievementEventType; threshold: number };
export type LegacyEvidenceCountRule = { threshold: number };

export function parseEventCountRule(value: unknown): EventCountRule | null {
  if (!isRecord(value) || !isAchievementEventType(value.eventType) || !isPositiveInteger(value.threshold)) return null;
  return { eventType: value.eventType, threshold: value.threshold };
}

export function parseGameEventCountRule(value: unknown): GameEventCountRule | null {
  if (!isRecord(value) || !isAchievementEventType(value.eventType) || !isAchievementGameType(value.gameType) || !isPositiveInteger(value.threshold)) return null;
  return { eventType: value.eventType, gameType: value.gameType, threshold: value.threshold };
}

export function parseDistinctGameEventCountRule(value: unknown): DistinctGameEventCountRule | null {
  if (!isRecord(value) || !isAchievementEventType(value.eventType) || !isPositiveInteger(value.threshold)) return null;
  return { eventType: value.eventType, threshold: value.threshold };
}

export function parseLegacyEvidenceCountRule(value: unknown): LegacyEvidenceCountRule | null {
  if (!isRecord(value) || !isPositiveInteger(value.threshold)) return null;
  return { threshold: value.threshold };
}

function isAchievementEventType(value: unknown): value is AchievementEventType {
  return typeof value === "string" && achievementEventTypes.includes(value as AchievementEventType);
}

function isAchievementGameType(value: unknown): value is AchievementGameType {
  return typeof value === "string" && achievementGameTypes.includes(value as AchievementGameType);
}

function isPositiveInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value > 0 && value <= 100_000;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object";
}
