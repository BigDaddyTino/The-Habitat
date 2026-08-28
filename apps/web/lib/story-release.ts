import "@/lib/environment";
import { getPrismaClient } from "@habitat/db/client";
import type { MartinoStoryExport } from "@habitat/shared";

const db = getPrismaClient();

/**
 * Reading named, frozen releases.
 *
 * A release is the boundary between the writers' room and everything
 * downstream. The room lands every save straight at CANON on purpose; a
 * release freezes what canon was at one moment, and the export endpoint and
 * Codex Sync read a release by name rather than whatever is true right now.
 *
 * Nothing here writes. Cutting a release is a deliberate, gated act that lives
 * in scripts/cut-story-release.ts, and the rows are immutable at the database
 * level — UPDATE and DELETE are both refused by trigger.
 */

/** Everything about a release except the megabyte of payload. */
const identity = { id: true, name: true, notes: true, contractVersion: true, sha256: true, atlasSha256: true, bytes: true, counts: true, cutAt: true } as const;

export type StoryReleaseIdentity = {
  id: string;
  name: string;
  notes: string | null;
  contractVersion: number;
  sha256: string;
  atlasSha256: string;
  bytes: number;
  counts: unknown;
  cutAt: Date;
};

/**
 * The newest release, or null when none has been cut.
 *
 * Deliberately identity-only: a 304 on the export endpoint should cost one
 * indexed row read, not a megabyte of JSONB that is about to be discarded.
 */
export async function newestStoryRelease(): Promise<StoryReleaseIdentity | null> {
  return db.storyRelease.findFirst({ orderBy: { cutAt: "desc" }, select: identity });
}

export async function listStoryReleases(limit = 50): Promise<StoryReleaseIdentity[]> {
  return db.storyRelease.findMany({ orderBy: { cutAt: "desc" }, take: limit, select: identity });
}

/**
 * One release by name. `withPayload` is opt-in for the same reason as above —
 * most callers want to know what exists, not to read it.
 */
export async function findStoryRelease(
  name: string,
  options: { withPayload?: boolean } = {},
): Promise<(StoryReleaseIdentity & { payload?: MartinoStoryExport; atlas?: unknown }) | null> {
  if (!options.withPayload) return db.storyRelease.findUnique({ where: { name }, select: identity });
  const row = await db.storyRelease.findUnique({ where: { name }, select: { ...identity, payload: true, atlas: true } });
  if (!row) return null;
  return { ...row, payload: row.payload as unknown as MartinoStoryExport, atlas: row.atlas };
}
