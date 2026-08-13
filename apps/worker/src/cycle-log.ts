/**
 * Collapses a repeated, unchanged status line.
 *
 * The monitoring cycle runs every 15 seconds and its summary is almost always
 * identical, which buries the lines that actually matter. A line is emitted when
 * the summary changes, on the first cycle, and on a periodic heartbeat so that
 * silence still cannot be mistaken for a dead worker. Suppressed cycles are
 * counted and reported on the next line, so nothing is hidden — only folded.
 */
export type CycleLogState = {
  summary: string | null;
  loggedAt: number | null;
  suppressed: number;
};

export const initialCycleLogState: CycleLogState = { summary: null, loggedAt: null, suppressed: 0 };

/** Long enough to keep the log quiet, short enough to prove the worker is alive. */
export const defaultCycleHeartbeatMs = 30 * 60 * 1_000;

export function nextCycleLog(
  state: CycleLogState,
  summary: string,
  now: number,
  heartbeatMs: number = defaultCycleHeartbeatMs,
): { state: CycleLogState; message: string | null } {
  const changed = state.summary !== summary;
  const neverLogged = state.loggedAt === null;
  // A non-positive heartbeat disables folding entirely rather than dividing by it.
  const heartbeatDue = !neverLogged && (heartbeatMs <= 0 || now - state.loggedAt! >= heartbeatMs);
  if (!changed && !neverLogged && !heartbeatDue) {
    return { state: { ...state, suppressed: state.suppressed + 1 }, message: null };
  }
  const folded = state.suppressed;
  const message = folded > 0
    ? `${summary} (unchanged across ${folded} further cycle${folded === 1 ? "" : "s"})`
    : summary;
  return { state: { summary, loggedAt: now, suppressed: 0 }, message };
}
