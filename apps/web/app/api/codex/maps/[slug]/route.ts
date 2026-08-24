import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { hasRequiredRole } from "@/lib/permissions";
import { getStoryAtlasProjection } from "@/lib/story-atlas";
import { storyReadRole } from "@/lib/story-codex";

export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const session = await auth();
  if (!session?.user?.id || !session.user.isActive || !hasRequiredRole(session.user.role, storyReadRole)) return new NextResponse("Not found", { status: 404 });
  const { slug } = await params;
  const projection = await getStoryAtlasProjection(slug);
  if (!projection) return new NextResponse("Not found", { status: 404 });
  const etag = `"${projection.revisionCursor ?? `${projection.scene.id}-${projection.scene.artVersion}`}"`;
  if (request.headers.get("if-none-match") === etag) return new NextResponse(null, { status: 304, headers: { ETag: etag } });
  return NextResponse.json(projection, { headers: { ETag: etag, "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" } });
}
