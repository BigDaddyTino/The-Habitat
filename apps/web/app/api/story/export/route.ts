import { NextResponse } from "next/server";
import { authorizeStoryExport } from "@/lib/story-export";
import { findStoryRelease, newestStoryRelease } from "@/lib/story-release";

/**
 * The canon story, for the Martino Unreal project.
 *
 * This is the one endpoint in the Habitat read by a machine rather than a
 * member, so it authenticates with a bearer token instead of a session. It is
 * strictly read-only and carries no server, agent, or member data — it is game
 * content, not a game-management API.
 *
 * IT SERVES A NAMED RELEASE, NEVER LIVE CANON. The writers' room lands every
 * save straight at CANON, which is the point of it and which used to mean this
 * endpoint answered with whatever happened to be true the second it was asked
 * — so an importer could pick up half a rewrite, and two machines polling a
 * minute apart could disagree. A release is a frozen, hash-locked cut; the
 * room goes on moving and nothing here changes until somebody cuts again.
 *
 *   GET /api/story/export                     the newest release
 *   GET /api/story/export?release=<name>      that release, forever
 *
 * There is deliberately no way to ask for live canon. Live canon is what the
 * codex UI is for; this is the boundary.
 *
 * Freshness is the release identity rather than a revision cursor. The
 * importer stores what it holds and sends it back as `?since=` (the release
 * name or its sha256) or as an `If-None-Match` ETag; when the newest release
 * is still the one it has, it gets a 304 without the payload being read.
 */
export async function GET(request: Request) {
  const grant = await authorizeStoryExport(request.headers.get("authorization"));
  if (!grant) {
    return NextResponse.json(
      { error: "unauthorized" },
      { status: 401, headers: { "WWW-Authenticate": "Bearer realm=\"martino-story-export\"", "Cache-Control": "private, no-store, max-age=0" } },
    );
  }

  const url = new URL(request.url);
  const requested = url.searchParams.get("release");

  // Identity first, payload second — a 304 should not read a megabyte of JSONB.
  const identity = requested ? await findStoryRelease(requested) : await newestStoryRelease();

  if (!identity) {
    return NextResponse.json(
      requested
        ? { error: "no_such_release", release: requested, detail: "Release names are frozen identities. Check the name, or ask for the newest release by omitting ?release=." }
        : { error: "no_release_cut", detail: "No release has been cut yet. The export serves named, frozen releases rather than live canon; cut one with scripts/cut-story-release.ts." },
      { status: requested ? 404 : 503, headers: { "Cache-Control": "private, no-store, max-age=0" } },
    );
  }

  const etag = `"story-release-${identity.name}-${identity.sha256.slice(0, 16)}"`;
  const since = url.searchParams.get("since");
  // Cloudflare downgrades the response ETag to a weak validator (W/"…"), so a
  // well-behaved client echoing what it received would never match a strict
  // comparison. Weakness only concerns byte-identity; for "is this still the
  // release I hold" the weak form is exactly as meaningful.
  const presented = request.headers.get("if-none-match")?.replace(/^\s*W\//i, "") ?? null;
  const holds = since !== null && (since === identity.name || since === identity.sha256);

  const headers = {
    ETag: etag,
    "Cache-Control": "private, no-store, max-age=0",
    // So an importer can pin what it just took without parsing the body.
    "X-Story-Release": identity.name,
    "X-Story-Release-Sha256": identity.sha256,
    "X-Story-Release-Cut-At": identity.cutAt.toISOString(),
  };

  if (presented === etag || holds) return new NextResponse(null, { status: 304, headers });

  const release = await findStoryRelease(identity.name, { withPayload: true });
  if (!release?.payload) {
    return NextResponse.json({ error: "release_unreadable", release: identity.name }, { status: 500, headers: { "Cache-Control": "private, no-store, max-age=0" } });
  }
  return NextResponse.json(release.payload, { headers });
}
