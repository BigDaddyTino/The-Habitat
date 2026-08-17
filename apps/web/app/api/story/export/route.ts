import { NextResponse } from "next/server";
import { getPrismaClient } from "@habitat/db/client";
import { storyExportContractVersion } from "@habitat/shared";
import { authorizeStoryExport, buildStoryExport } from "@/lib/story-export";

const db = getPrismaClient();

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

  const newest = await db.storyRevision.findFirst({ orderBy: { createdAt: "desc" }, select: { id: true } });
  const etag = `"story-v${storyExportContractVersion}-${newest?.id ?? "empty"}"`;
  const since = new URL(request.url).searchParams.get("since");
  const unchanged = request.headers.get("if-none-match") === etag || (since !== null && since === (newest?.id ?? ""));

  if (unchanged) {
    return new NextResponse(null, { status: 304, headers: { ETag: etag, "Cache-Control": "private, no-store, max-age=0" } });
  }

  const story = await buildStoryExport();
  return NextResponse.json(story, {
    headers: { ETag: etag, "Cache-Control": "private, no-store, max-age=0" },
  });
}
