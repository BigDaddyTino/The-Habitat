export const SEASON_LENGTH_MONTHS = 3;

export type SeasonWindow = { startsAt: Date; endsAt: Date };

export function seasonPhase(window: SeasonWindow, now = new Date()): "UPCOMING" | "ACTIVE" | "COMPLETED" {
  if (now < window.startsAt) return "UPCOMING";
  if (now >= window.endsAt) return "COMPLETED";
  return "ACTIVE";
}

export function isThreeMonthSeason(window: SeasonWindow): boolean {
  const expectedEnd = new Date(window.startsAt);
  expectedEnd.setUTCMonth(expectedEnd.getUTCMonth() + SEASON_LENGTH_MONTHS);
  return expectedEnd.getTime() === window.endsAt.getTime();
}

export function boundedProgress(value: number, goal: number) {
  const safeGoal = Math.max(1, Math.floor(goal));
  const safeValue = Math.max(0, Math.floor(value));
  return {
    value: safeValue,
    goal: safeGoal,
    percent: Math.min(100, (safeValue / safeGoal) * 100),
    complete: safeValue >= safeGoal,
  };
}
