export const recordEventTypes = ["PLAYER_JOINED"] as const;

export type RecordEventType = (typeof recordEventTypes)[number];
export type PlayerEventCountRecordRule = { eventType: RecordEventType };
export type DistinctGameEventCountRecordRule = { eventType: RecordEventType };

export function parsePlayerEventCountRecordRule(value: unknown): PlayerEventCountRecordRule | null {
  if (!isRecord(value) || !isRecordEventType(value.eventType)) return null;
  return { eventType: value.eventType };
}

export function parseDistinctGameEventCountRecordRule(value: unknown): DistinctGameEventCountRecordRule | null {
  if (!isRecord(value) || !isRecordEventType(value.eventType)) return null;
  return { eventType: value.eventType };
}

export function isAchievementCountRecordRule(value: unknown): boolean {
  return isRecord(value);
}

function isRecordEventType(value: unknown): value is RecordEventType {
  return typeof value === "string" && recordEventTypes.includes(value as RecordEventType);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object";
}
