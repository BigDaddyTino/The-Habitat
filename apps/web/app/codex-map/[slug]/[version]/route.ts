import "@/lib/environment";
import { readFile } from "node:fs/promises";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { hasRequiredRole } from "@/lib/permissions";
import { storyReadRole } from "@/lib/story-codex";
import { resolveStoryAtlasArt } from "@/lib/story-atlas-art";

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string; version: string }> }) {
  const session = await auth();
  if (!session?.user?.id || !session.user.isActive || !hasRequiredRole(session.user.role, storyReadRole)) return new NextResponse("Not found", { status: 404 });
  const { slug, version } = await params;
  const target = resolveStoryAtlasArt(slug, version);
  if (!target) return new NextResponse("Not found", { status: 404 });
  const bytes = await readFile(target).catch(() => null);
  if (!bytes) return new NextResponse("Not found", { status: 404 });
  return new NextResponse(new Uint8Array(bytes), { headers: { "Content-Type": "image/png", "Content-Length": String(bytes.byteLength), "Cache-Control": "private, max-age=60", "Content-Security-Policy": "default-src 'none'; sandbox", "X-Content-Type-Options": "nosniff" } });
}
