export type SeasonLaunchState = {
  status: "UPCOMING" | "ACTIVE" | "COMPLETED";
  trophyCount: number;
  questCount: number;
  expeditionCount: number;
  xpEntryCount: number;
};

export type SeasonLaunchReadiness = {
  /// True only when moving this season's window is both permitted and useful.
  launchable: boolean;
  /// Reasons launching is refused outright, phrased for an administrator.
  blockers: string[];
  /// Conditions worth stating before launch that do not make the season broken.
  warnings: string[];
};

/// Shared by the admin screen and the launch actions so the button and the
/// server-side guard can never disagree about whether a season may open.
export function seasonLaunchReadiness(season: SeasonLaunchState): SeasonLaunchReadiness {
  const blockers: string[] = [];
  if (season.status === "ACTIVE") blockers.push("This season is already running; its window cannot be moved out from under enrolled members.");
  if (season.status === "COMPLETED") blockers.push("This season is closed and chronicled. A published season is never reopened.");
  if (season.trophyCount === 0) blockers.push("Add at least one trophy before launching; closing this season would award nothing.");
  // XP can only exist for a window that already opened, so this catches a season
  // whose status was edited backwards as well as any partially reconciled state.
  if (season.xpEntryCount > 0) blockers.push("This season already holds seasonal XP. Moving its window would strand that ledger.");

  const warnings: string[] = [];
  if (season.questCount === 0 && season.expeditionCount === 0) warnings.push("It has no quests or expeditions, so only raw verified playtime would score.");

  return { launchable: blockers.length === 0, blockers, warnings };
}

export function seasonScheduleProblems(startsAt: Date, now = new Date()): string[] {
  if (!Number.isFinite(startsAt.getTime())) return ["Choose a valid season start date."];
  if (startsAt <= now) return ["A scheduled season must open in the future. Use Launch now to open a season without back-crediting earlier activity."];
  return [];
}

export function seasonAvailabilityProblems(status: SeasonLaunchState["status"], isEnabled: boolean, draft?: { wasEnabled: boolean; startsAt: Date; now?: Date }): string[] {
  if (status === "ACTIVE" && !isEnabled) return ["A running season must stay enabled until the worker closes and chronicles it."];
  if (isEnabled && draft && !draft.wasEnabled && draft.startsAt <= (draft.now ?? new Date())) return ["This draft's opening time has passed. Reschedule it into the future or use Launch now so earlier activity is not back-credited."];
  return [];
}
