import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { hasRequiredRole } from "@/lib/permissions";
import { getStoryAtlasProjection } from "@/lib/story-atlas";
import { getStoryAtlasV2Projection } from "@/lib/story-atlas-v2";
import { resolveAtlasProjectionVersion } from "@/lib/atlas-v2-feature";
import { storyReadRole } from "@/lib/story-codex";

export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const session = await auth();
  if (!session?.user?.id || !session.user.isActive || !hasRequiredRole(session.user.role, storyReadRole)) return new NextResponse("Not found", { status: 404 });
  const { slug } = await params;
  const requested = new URL(request.url).searchParams.get("atlas");
  const version = resolveAtlasProjectionVersion({ requested, role: session.user.role });
  const projection = version === "V2" ? await getStoryAtlasV2Projection(slug) : await getStoryAtlasProjection(slug);
  if (!projection) return new NextResponse("Not found", { status: 404 });
  const etag = `"${projection.revisionCursor ?? `${projection.scene.id}-${projection.scene.artVersion}`}"`;
  if (request.headers.get("if-none-match") === etag) return new NextResponse(null, { status: 304, headers: { ETag: etag } });
  return NextResponse.json(projection, { headers: { ETag: etag, "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" } });
}
