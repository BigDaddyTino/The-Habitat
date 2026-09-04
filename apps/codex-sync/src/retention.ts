import { readdir, rm, stat } from "node:fs/promises";
import path from "node:path";

/**
 * What keeps the share publishable.
 *
 * A release materializes its assets as HARDLINKS into `blobs/`, so every kept
 * release is one more link on every blob it uses, and NTFS caps a single file
 * at 1024 links. The publisher had no retention at all: 512 releases banked up
 * between 2026-08-20 and 2026-09-03, one blob reached exactly 1024, and every
 * publish after that failed at link 1025. Because a failed publish also left
 * its `.staging` directory behind, each retry added more links and made the
 * next failure certain — a spiral that ended with 7,652 abandoned staging
 * directories and a game build reading a day-old bundle while the service
 * still reported itself healthy.
 *
 * Two sweeps, and the safety rules matter more than the sweeping:
 *
 *  1. RELEASES — keep the newest N, never the active one, never anything too
 *     recent to be sure nobody is still reading it.
 *  2. STAGING — remove abandoned `publish-*` directories. The publisher now
 *     cleans up its own failures, but a process killed mid-publish (a service
 *     stop, a reboot) never gets to run that, and those are exactly the links
 *     that wedged the share.
 *
 * THE SHARE IS READ BY ANOTHER MACHINE. Every rule below exists because this
 * process cannot see that machine, cannot coordinate with it, and must never
 * delete something it might be in the middle of copying.
 */

/** `20260904T211351589Z-bc4dbaf890d0` — the only shape a release directory has. */
const releaseDirectory = /^\d{8}T\d{9}Z-[0-9a-f]{12}$/;
/** `publish-<snapshotId>-<8 hex>` — the only shape the publisher stages under. */
const stagingDirectory = /^publish-\d{8}T\d{9}Z-[0-9a-f]{12}-[0-9a-f]{8}$/;

export type RetentionReport = {
  releasesKept: number;
  releasesRemoved: string[];
  stagingRemoved: string[];
  /** Directories that were eligible but could not be removed. Never fatal. */
  failures: string[];
  /** Eligible but deliberately spared for not being old enough yet. */
  heldBack: number;
};

async function entriesIn(directory: string) {
  try {
    return await readdir(directory, { withFileTypes: true });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }
}

/** Age by the directory's own timestamp, not the id in its name — a clock skew
 *  between machines must never make something look older than it is. */
async function olderThan(target: string, minAgeMs: number, now: number) {
  try {
    const info = await stat(target);
    return now - Math.max(info.mtimeMs, info.birthtimeMs || 0) >= minAgeMs;
  } catch (error) {
    // Gone already, or unreadable. Either way this sweep does not touch it.
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return false;
    throw error;
  }
}

/**
 * Prune the share. Never throws: a publish that has already succeeded must not
 * be reported as failed because a directory would not delete, and a publish
 * about to happen must not be blocked by one either.
 */
export async function pruneCodexShare(
  syncRoot: string,
  options: { activeSnapshotId: string | null; keepReleases: number; minAgeMs: number; now?: number },
): Promise<RetentionReport> {
  const now = options.now ?? Date.now();
  const report: RetentionReport = { releasesKept: 0, releasesRemoved: [], stagingRemoved: [], failures: [], heldBack: 0 };

  // --- releases -----------------------------------------------------------
  const releasesRoot = path.join(syncRoot, "releases");
  const releases = (await entriesIn(releasesRoot))
    .filter((entry) => entry.isDirectory() && releaseDirectory.test(entry.name))
    .map((entry) => entry.name)
    // Snapshot ids begin with a UTC timestamp, so lexical order is chronological.
    .sort();

  // The newest N are kept, and the active release is kept whatever its age or
  // position — if the pointer names it, the other machine can still ask for it.
  const keep = new Set(releases.slice(-options.keepReleases));
  if (options.activeSnapshotId) keep.add(options.activeSnapshotId);
  report.releasesKept = keep.size;

  for (const name of releases) {
    if (keep.has(name)) continue;
    const target = path.join(releasesRoot, name);
    if (!(await olderThan(target, options.minAgeMs, now))) {
      report.heldBack += 1;
      continue;
    }
    try {
      await rm(target, { recursive: true, force: true });
      report.releasesRemoved.push(name);
    } catch {
      report.failures.push(`releases/${name}`);
    }
  }

  // --- abandoned staging --------------------------------------------------
  // A publish in flight owns a directory here, so age is the whole safety
  // margin: anything still being written was created seconds ago.
  const stagingRoot = path.join(syncRoot, ".staging");
  for (const entry of await entriesIn(stagingRoot)) {
    if (!entry.isDirectory() || !stagingDirectory.test(entry.name)) continue;
    const target = path.join(stagingRoot, entry.name);
    if (!(await olderThan(target, options.minAgeMs, now))) {
      report.heldBack += 1;
      continue;
    }
    try {
      await rm(target, { recursive: true, force: true });
      report.stagingRemoved.push(entry.name);
    } catch {
      report.failures.push(`.staging/${entry.name}`);
    }
  }

  return report;
}

export function describeRetention(report: RetentionReport) {
  const parts: string[] = [];
  if (report.releasesRemoved.length) parts.push(`${report.releasesRemoved.length} superseded release${report.releasesRemoved.length === 1 ? "" : "s"}`);
  if (report.stagingRemoved.length) parts.push(`${report.stagingRemoved.length} abandoned staging director${report.stagingRemoved.length === 1 ? "y" : "ies"}`);
  if (report.failures.length) parts.push(`${report.failures.length} could not be removed`);
  return parts.length ? `Pruned ${parts.join(", ")}; ${report.releasesKept} releases kept.` : null;
}
