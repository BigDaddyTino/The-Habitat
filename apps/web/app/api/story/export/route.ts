import { NextResponse } from "next/server";
import { storyExportContractVersion } from "@habitat/shared";
import { authorizeStoryExport, buildStoryExport, newestExportRevision } from "@/lib/story-export";

/**
 * The canon story, for the Martino Unreal project.
 *
 * This is the one endpoint in the Habitat that is read by a machine rather than
 * a member, so it authenticates with a bearer token instead of a session. It is
 * strictly read-only and carries no server, agent, or member data — it is game
 * content, not a game-management API.
 *
 * The importer stores `revisionCursor` and sends it back as `?since=` (or as an
 * `If-None-Match` ETag). When nothing has changed it gets a 304 without the
 * codex ever being projected, so polling this every few minutes from the game
 * machine costs a single indexed row read.
 */
export async function GET(request: Request) {
  const grant = await authorizeStoryExport(request.headers.get("authorization"));
  if (!grant) {
    return NextResponse.json(
      { error: "unauthorized" },
      { status: 401, headers: { "WWW-Authenticate": "Bearer realm=\"martino-story-export\"", "Cache-Control": "private, no-store, max-age=0" } },
    );
  }

  // Tie-broken by id: several revisions written inside one transaction share a
  // createdAt, and an ETag that flips between them would send the importer to
  // fetch the whole codex again for a story that had not changed. MOVED rows
  // are excluded (same rule as the cursor stamped into the payload): a card
  // drag changes nothing the importer reads.
  const newest = await newestExportRevision();
  const etag = `"story-v${storyExportContractVersion}-${newest?.id ?? "empty"}"`;
  const since = new URL(request.url).searchParams.get("since");
  // Cloudflare downgrades the response ETag to a weak validator (W/"…"), so a
  // well-behaved client echoing what it received would never match a strict
  // comparison. Weakness only concerns byte-identity; for "has the story
  // changed" the weak form is exactly as meaningful, so compare without it.
  const presented = request.headers.get("if-none-match")?.replace(/^\s*W\//i, "") ?? null;
  const unchanged = presented === etag || (since !== null && since === (newest?.id ?? ""));

  if (unchanged) {
    return new NextResponse(null, { status: 304, headers: { ETag: etag, "Cache-Control": "private, no-store, max-age=0" } });
  }

  const story = await buildStoryExport();
  return NextResponse.json(story, {
    headers: { ETag: etag, "Cache-Control": "private, no-store, max-age=0" },
  });
}
