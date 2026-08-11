export const MAX_HABITAT_LEVEL = 100;
export const VERIFIED_SECONDS_PER_XP = 300;

export function xpRequiredForLevel(level: number): number {
  const boundedLevel = Math.max(1, Math.min(MAX_HABITAT_LEVEL, Math.floor(level)));
  return Math.floor(50 * Math.pow(boundedLevel - 1, 2.2));
}

export function levelForXp(totalXp: number): number {
  const safeXp = Math.max(0, Math.floor(totalXp));
  let low = 1;
  let high = MAX_HABITAT_LEVEL;
  while (low < high) {
    const middle = Math.ceil((low + high) / 2);
    if (xpRequiredForLevel(middle) <= safeXp) low = middle;
    else high = middle - 1;
  }
  return low;
}

export function progressionForXp(totalXp: number) {
  const xp = Math.max(0, Math.floor(totalXp));
  const level = levelForXp(xp);
  const currentFloor = xpRequiredForLevel(level);
  const nextFloor = level === MAX_HABITAT_LEVEL ? currentFloor : xpRequiredForLevel(level + 1);
  const span = Math.max(1, nextFloor - currentFloor);
  return {
    level,
    totalXp: xp,
    currentLevelXp: xp - currentFloor,
    nextLevelXp: level === MAX_HABITAT_LEVEL ? 0 : span,
    progressPercent: level === MAX_HABITAT_LEVEL ? 100 : Math.min(100, ((xp - currentFloor) / span) * 100),
  };
}

export function verifiedPlaytimeXp(seconds: number): number {
  return Math.floor(Math.max(0, seconds) / VERIFIED_SECONDS_PER_XP);
}

export function utcWeekWindow(value = new Date()) {
  const date = new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()));
  const daysSinceMonday = (date.getUTCDay() + 6) % 7;
  date.setUTCDate(date.getUTCDate() - daysSinceMonday);
  const endsAt = new Date(date);
  endsAt.setUTCDate(endsAt.getUTCDate() + 7);
  return { weekStart: date, endsAt };
}

export type LevelReachedRule = { level: number };

export function parseLevelReachedRule(value: unknown): LevelReachedRule | null {
  if (!value || typeof value !== "object" || !("level" in value)) return null;
  const level = (value as { level?: unknown }).level;
  return typeof level === "number" && Number.isInteger(level) && level >= 2 && level <= MAX_HABITAT_LEVEL ? { level } : null;
}
