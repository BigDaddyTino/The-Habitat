import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { hasRequiredRole } from "@/lib/permissions";
import { searchStoryAtlas } from "@/lib/story-atlas";
import { storyReadRole } from "@/lib/story-codex";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id || !session.user.isActive || !hasRequiredRole(session.user.role, storyReadRole)) return new NextResponse("Not found", { status: 404 });
  const query = new URL(request.url).searchParams.get("q") ?? "";
  return NextResponse.json({ results: await searchStoryAtlas(query) }, { headers: { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" } });
}
