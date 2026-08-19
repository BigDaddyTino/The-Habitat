import "@/lib/environment";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { hasRequiredRole } from "@/lib/permissions";
import { codexArtContentTypes, resolveCodexArtFile } from "@/lib/codex-art";
import { storyReadRole } from "@/lib/story-codex";

/**
 * Serves codex key art off disk at request time.
 *
 * Files under `public/` are indexed when the app is built, so an image dropped
 * in afterwards 404s until the next build — which quietly broke the whole
 * promise the art slots make ("drop a file here and the card wears it on the
 * next load"). Reading from disk per request makes that promise true: add
 * `images/systems/<slug>.png` or `images/timeline/<slug>.jpg`, reload, done.
 *
 * Behind the same USER gate as the rest of the codex, because unreleased key
 * art is unreleased plot. Traversal is impossible: the kind is one of two
 * fixed directories and the filename is pattern-checked before it is resolved.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ kind: string; file: string }> }) {
  const session = await auth();
  if (!session?.user?.id || !session.user.isActive || !hasRequiredRole(session.user.role, storyReadRole)) {
    return new NextResponse("Not found", { status: 404 });
  }

  const { kind, file } = await params;
  const target = resolveCodexArtFile(kind, file);
  if (!target) return new NextResponse("Not found", { status: 404 });

  const extension = path.extname(target).slice(1).toLowerCase() as keyof typeof codexArtContentTypes;
  const contentType = codexArtContentTypes[extension];
  if (!contentType) return new NextResponse("Not found", { status: 404 });

  const bytes = await readFile(target).catch(() => null);
  if (!bytes) return new NextResponse("Not found", { status: 404 });

  return new NextResponse(new Uint8Array(bytes), {
    headers: {
      "Content-Type": contentType,
      "Content-Length": String(bytes.byteLength),
      // Short: the whole point is that replacing the file shows up quickly.
      "Cache-Control": "private, max-age=60",
      "Content-Security-Policy": "default-src 'none'; sandbox",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
