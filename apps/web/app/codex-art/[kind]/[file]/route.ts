import "@/lib/environment";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { hasRequiredRole } from "@/lib/permissions";
import { codexArtContentTypes, resolveCodexArtFile } from "@/lib/codex-art";
import { codexArtDerivative, parseCodexArtWidth } from "@/lib/codex-art-derivative";
import { storyReadRole } from "@/lib/story-codex";

/**
 * Serves codex key art off disk at request time.
 *
 * This route is the ONLY way codex artwork reaches a browser. The files used
 * to sit under `public/`, where Next serves them as static assets — so every
 * portrait, region plate, faction identity and world rule was reachable by an
 * anonymous caller who guessed the slug, while the dossier around it required
 * a member account. They live under `private/codex-art` now and come through
 * here, behind the same USER gate as the rest of the codex, because
 * unreleased key art is unreleased plot.
 *
 * Serving from disk per request also keeps the art slots' promise true ("drop
 * a file here and the card wears it on the next load") — `public/` is indexed
 * at build time, so a file added afterwards used to 404 until the next build.
 * Add `private/codex-art/systems/<slug>.png`, reload, done.
 *
 * Traversal is impossible: the kind is one of a fixed set of directories and
 * the filename is pattern-checked before it is resolved.
 *
 * `?w=<width>` asks for a WebP copy no wider than that, from one of a fixed
 * set of widths. The originals are masters — several are ten megabytes and
 * over three thousand pixels wide — and every surface that showed one was
 * sending the whole thing into a box a tenth of its size. The width is
 * advisory: anything unrecognised, and any file already small enough, is
 * simply served whole.
 */
export async function GET(request: Request, { params }: { params: Promise<{ kind: string; file: string }> }) {
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

  const width = parseCodexArtWidth(new URL(request.url).searchParams.get("w"));
  const slug = path.basename(file, path.extname(file));
  const derivative = width ? await codexArtDerivative(target, width, kind, slug) : null;

  const bytes = derivative?.bytes ?? await readFile(target).catch(() => null);
  if (!bytes) return new NextResponse("Not found", { status: 404 });

  return new NextResponse(new Uint8Array(bytes), {
    headers: {
      "Content-Type": derivative?.contentType ?? contentType,
      "Content-Length": String(bytes.byteLength),
      // Short: the whole point is that replacing the file shows up quickly.
      // A resize does not change that — the cache key behind it is the
      // original's size and mtime, so a replaced file is a cache miss.
      "Cache-Control": "private, max-age=60",
      "Content-Security-Policy": "default-src 'none'; sandbox",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
