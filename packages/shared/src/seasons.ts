export const SEASON_LENGTH_MONTHS = 3;

export type SeasonWindow = { startsAt: Date; endsAt: Date };

export function seasonPhase(window: SeasonWindow, now = new Date()): "UPCOMING" | "ACTIVE" | "COMPLETED" {
  if (now < window.startsAt) return "UPCOMING";
  if (now >= window.endsAt) return "COMPLETED";
  return "ACTIVE";
}

/// Mirrors Postgres `startsAt + INTERVAL '3 months'`, which the season table
/// enforces as a CHECK constraint. Naive month addition in JavaScript overflows
/// instead of clamping (31 Nov becomes 2 Mar rather than 28 Feb), which would
/// make every month-end start date fail a constraint it actually satisfies.
export function seasonEndFor(startsAt: Date): Date {
  const targetMonth = startsAt.getUTCMonth() + SEASON_LENGTH_MONTHS;
  const lastDayOfTargetMonth = new Date(Date.UTC(startsAt.getUTCFullYear(), targetMonth + 1, 0)).getUTCDate();
  const endsAt = new Date(startsAt);
  endsAt.setUTCFullYear(startsAt.getUTCFullYear(), targetMonth, Math.min(startsAt.getUTCDate(), lastDayOfTargetMonth));
  return endsAt;
}

export function isThreeMonthSeason(window: SeasonWindow): boolean {
  return seasonEndFor(window.startsAt).getTime() === window.endsAt.getTime();
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
