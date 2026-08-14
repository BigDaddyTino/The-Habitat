import { collectibleVisuals } from "./collectible-art";

export type SeasonRuleType = "PLAY_SECONDS" | "JOIN_COUNT" | "DISTINCT_GAME_COUNT" | "BOSS_KILL_COUNT";
export type SeasonQuestScope = "PERSONAL" | "TEAM";
export type SeasonStatus = "UPCOMING" | "ACTIVE" | "COMPLETED";
export type SeasonClockState = { status: SeasonStatus; isEnabled: boolean; startsAt: Date; endsAt: Date };

export const seasonRuleTypes: SeasonRuleType[] = ["PLAY_SECONDS", "JOIN_COUNT", "DISTINCT_GAME_COUNT", "BOSS_KILL_COUNT"];

/// What each rule counts, in the worker's own terms, so an administrator picks a
/// goal knowing which evidence will actually move it.
export const seasonRuleCopy: Record<SeasonRuleType, { label: string; unit: string; measures: string }> = {
  PLAY_SECONDS: { label: "Verified playtime", unit: "seconds", measures: "Summed duration of verified PLAYER_LEFT sessions inside the window." },
  JOIN_COUNT: { label: "Verified visits", unit: "visits", measures: "Count of verified PLAYER_JOINED events inside the window." },
  DISTINCT_GAME_COUNT: { label: "Distinct games visited", unit: "games", measures: "Number of different Habitat games joined inside the window." },
  BOSS_KILL_COUNT: { label: "Boss kills", unit: "kills", measures: "Count of BOSS_KILLED events, which only games with a reporting adapter record." },
};

/// Once a season is running, the shape of a goal is frozen: members are already
/// measured against it and completions are sticky. Presentation and difficulty
/// stay adjustable because both recompute cleanly from source evidence.
export type SeasonContentEditability = {
  /// May content be created or removed at all.
  structural: boolean;
  /// May scope, rule, game, and reward be changed.
  measurable: boolean;
  /// May name, description, order, and availability be changed.
  presentation: boolean;
  reason: string;
};

export function seasonContentEditability(status: SeasonStatus): SeasonContentEditability {
  if (status === "COMPLETED") return { structural: false, measurable: false, presentation: false, reason: "This season is closed and chronicled. Its record is published and never edited." };
  if (status === "ACTIVE") return { structural: false, measurable: false, presentation: true, reason: "This season is running. Wording, ordering, difficulty, and availability stay editable; what a goal measures and pays is frozen so enrolled members are not re-judged mid-season." };
  return { structural: true, measurable: true, presentation: true, reason: "This season has not started, so its content is fully editable." };
}

/// The worker persists status on its cadence, but authorization cannot leave an
/// edit window open between the scheduled instant and the next worker pass.
export function effectiveSeasonStatus(season: SeasonClockState, now = new Date()): SeasonStatus {
  if (season.status === "COMPLETED") return "COMPLETED";
  // Disabled drafts are inert even if their provisional dates have passed.
  if (!season.isEnabled) return season.status;
  if (now >= season.endsAt) return "COMPLETED";
  if (now >= season.startsAt) return "ACTIVE";
  return "UPCOMING";
}

export type SeasonGoalDraft = { ruleType: SeasonRuleType; gameType: string | null; threshold: number; scope?: SeasonQuestScope };

/// Rejects goals the reconciler could never satisfy. These are not style notes:
/// each one is a target that would sit at zero, or below its threshold, forever.
export function seasonGoalProblems(goal: SeasonGoalDraft): string[] {
  const problems: string[] = [];
  if (goal.ruleType === "DISTINCT_GAME_COUNT" && goal.gameType && goal.threshold > 1) {
    problems.push("A distinct-game goal restricted to one game can only ever reach 1. Remove the game restriction or choose another rule.");
  }
  if (goal.ruleType === "DISTINCT_GAME_COUNT" && goal.threshold > 6) {
    problems.push("The Habitat has six games, so a distinct-game goal above 6 is unreachable.");
  }
  if (goal.threshold < 1) problems.push("A threshold must be at least 1.");
  return problems;
}

export function seasonGoalWarnings(goal: SeasonGoalDraft): string[] {
  const warnings: string[] = [];
  if (goal.ruleType === "BOSS_KILL_COUNT") warnings.push("Boss kills are only recorded for games whose adapter reports them; this goal stays at zero everywhere else.");
  if (goal.ruleType === "PLAY_SECONDS" && goal.threshold < 600) warnings.push("Playtime thresholds are counted in seconds, so this goal is under ten minutes.");
  return warnings;
}

/// Every seasonal trophy is rendered as a physical piece in the cabinet. A code
/// with no authored artwork still works, but falls back to the generic form
/// rather than a piece designed for this season.
export function trophyArtwork(code: string): { authored: boolean; note: string } {
  const authored = Object.hasOwn(collectibleVisuals, code.trim());
  return authored
    ? { authored: true, note: "This code has authored 3D artwork and renders as its own piece." }
    : { authored: false, note: "No authored artwork for this code yet; it renders with the generic trophy form until one is added to collectible-art." };
}

export function seasonSlugFrom(value: string): string {
  return value.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);
}

/// Seconds are the stored unit for playtime goals; hours are the unit an
/// administrator thinks in. Kept here so the form and its tests agree.
export function playSecondsFromHours(hours: number): number {
  return Math.round(hours * 3_600);
}

export function hoursFromPlaySeconds(seconds: number): number {
  return Math.round((seconds / 3_600) * 100) / 100;
}

/// Builder inputs use hours for playtime and whole counts for every other rule.
/// The worker and database continue to use seconds, so no stored contract moves.
export function seasonThresholdInputValue(ruleType: SeasonRuleType, threshold: number): number {
  return ruleType === "PLAY_SECONDS" ? hoursFromPlaySeconds(threshold) : threshold;
}

export function normalizeSeasonThreshold(ruleType: SeasonRuleType, input: number): number {
  return ruleType === "PLAY_SECONDS" ? playSecondsFromHours(input) : Math.round(input);
}
