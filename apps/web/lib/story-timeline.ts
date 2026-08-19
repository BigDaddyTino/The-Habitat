/**
 * Ordering for the history timeline: pure, so the same arrangement the page
 * renders can be pinned by tests. No database, no browser.
 */

export type TimelineCandidate = {
  slug: string;
  title: string;
  meta: Record<string, unknown> | null;
};

export type ArrangedTimeline<T extends TimelineCandidate> = {
  /** Oldest first — the top of the golden line — down to the present. */
  dated: Array<T & { yearsAgo: number }>;
  /** Events whose age the timeline cannot place. Sometimes that is the canon
   *  (the Riftwood Breach is "older than the battle" and deliberately no more
   *  precise), sometimes it is a sheet nobody has dated yet — the section
   *  shows them either way rather than quietly dropping history. */
  undated: T[];
};

export function timelineYearsAgo(meta: Record<string, unknown> | null): number | null {
  const value = meta?.timelineYearsAgo;
  return typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : null;
}

export function arrangeTimeline<T extends TimelineCandidate>(events: T[]): ArrangedTimeline<T> {
  const dated: Array<T & { yearsAgo: number }> = [];
  const undated: T[] = [];
  for (const event of events) {
    const yearsAgo = timelineYearsAgo(event.meta);
    if (yearsAgo === null) undated.push(event);
    else dated.push({ ...event, yearsAgo });
  }
  // Oldest at the top; ties settle alphabetically so the order is stable
  // rather than databases-dependent.
  dated.sort((a, b) => b.yearsAgo - a.yearsAgo || a.title.localeCompare(b.title));
  undated.sort((a, b) => a.title.localeCompare(b.title));
  return { dated, undated };
}

/** "~9,000 years ago" / "within the last year" — the line's own label when the
 *  prose `when` is missing, and the sanity check beside it when it is not. */
export function timelineEraLabel(yearsAgo: number): string {
  if (yearsAgo < 1) return "within the last year";
  if (yearsAgo < 10) return `~${Math.round(yearsAgo)} year${Math.round(yearsAgo) === 1 ? "" : "s"} ago`;
  const rounded = yearsAgo >= 1000 ? Math.round(yearsAgo / 100) * 100 : Math.round(yearsAgo / 10) * 10;
  return `~${rounded.toLocaleString("en-US")} years ago`;
}
