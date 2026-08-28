import { getPrismaClient } from "@habitat/db/client";
import type { MartinoStoryExport } from "@habitat/shared";

/**
 * The named, frozen release the bundle's canon payload comes from.
 *
 * Codex Sync publishes two different things and only one of them is game
 * content. The snapshot is a mirror of the codex — every entry, revision and
 * comment, for reading — and mirroring that live is the point of it. The
 * `compatibility/canon-v1.json` payload is what an importer turns into game
 * assets, and that is subject to the release boundary: it comes from a cut,
 * by name, with a hash an importer can pin, and it does not move when a writer
 * saves a sentence.
 *
 * Read-only. Cutting is a deliberate, gated act in
 * apps/web/scripts/cut-story-release.ts.
 */
export type PublishedStoryRelease = {
  name: string;
  sha256: string;
  contractVersion: number;
  cutAt: string;
  payload: MartinoStoryExport;
};

export async function newestPublishedRelease(): Promise<PublishedStoryRelease | null> {
  const db = getPrismaClient();
  const row = await db.storyRelease.findFirst({
    orderBy: { cutAt: "desc" },
    select: { name: true, sha256: true, contractVersion: true, cutAt: true, payload: true },
  });
  if (!row) return null;
  return {
    name: row.name,
    sha256: row.sha256,
    contractVersion: row.contractVersion,
    cutAt: row.cutAt.toISOString(),
    payload: row.payload as unknown as MartinoStoryExport,
  };
}
