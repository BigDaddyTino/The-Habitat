import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getPrismaClient } from "@habitat/db/client";
import { achievementSlugFromMetadata, projectableLiveEventTypes, projectVerifiedHabitatLiveEvent } from "@/lib/live-event-projection";
import { filterToInstalledServerEventTypes } from "@/lib/server-event-types";

const db = getPrismaClient();
const maximumLookbackMs = 15 * 60_000;

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id || !session.user.isActive) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const until = new Date();
  const rawCursor = new URL(request.url).searchParams.get("since") ?? "";
  const [rawSince, afterId] = rawCursor.split("|", 2);
  const requestedSince = new Date(rawSince ?? "");
  const oldestAllowed = new Date(until.getTime() - maximumLookbackMs);
  const since = Number.isNaN(requestedSince.getTime()) || requestedSince < oldestAllowed ? oldestAllowed : requestedSince > until ? until : requestedSince;
  const after = afterId && /^[0-9a-f-]{36}$/i.test(afterId) ? afterId : null;
  const batchSize = 50;
  const eventTypes = await filterToInstalledServerEventTypes(projectableLiveEventTypes);
  const sourceEvents = eventTypes.length ? await db.serverEvent.findMany({
    where: {
      eventType: { in: eventTypes },
      sourceConfidence: 100,
      receivedAt: { lte: until },
      OR: [{ receivedAt: { gt: since } }, ...(after ? [{ receivedAt: since, id: { gt: after } }] : [])],
    },
    include: { server: { select: { id: true, slug: true, displayName: true, gameType: true } }, playerIdentity: { select: { userId: true } } },
    orderBy: [{ receivedAt: "asc" }, { id: "asc" }],
    take: batchSize,
  }) : [];
  const achievementSlugs = [...new Set(sourceEvents.map((event) => achievementSlugFromMetadata(event.metadata)).filter((slug): slug is string => Boolean(slug)))];
  const definitions = achievementSlugs.length ? await db.achievementDefinition.findMany({
    where: { slug: { in: achievementSlugs } },
    select: { slug: true, name: true, description: true, category: true, rarity: true, points: true, rewards: { select: { kind: true, code: true, name: true } } },
  }) : [];
  const achievements = new Map(definitions.map((definition) => [definition.slug, definition]));
  const events = sourceEvents.flatMap((event) => {
    const slug = achievementSlugFromMetadata(event.metadata);
    const projected = projectVerifiedHabitatLiveEvent(event, slug ? achievements.get(slug) : undefined, session.user.id);
    return projected ? [projected] : [];
  });
  // A full batch may have left more rows behind it, so the cursor resumes from
  // the last row read. A short batch drained everything up to `until`, so it can
  // resume from the clock instead and skip the rows it already delivered.
  const last = sourceEvents.length === batchSize ? sourceEvents[batchSize - 1] : undefined;
  const cursor = last ? `${last.receivedAt.toISOString()}|${last.id}` : `${until.toISOString()}|`;
  return NextResponse.json({ events, cursor }, { headers: { "Cache-Control": "private, no-store, max-age=0" } });
}
