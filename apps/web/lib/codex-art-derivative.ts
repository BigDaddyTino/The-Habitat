import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readdirSync, renameSync, rmSync, statSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

/**
 * Smaller copies of codex art, made on demand and kept on disk.
 *
 * The originals are masters: the six Bloomfall-era character portraits are
 * 3072x3840 PNGs of ten to eleven megabytes each, and every one of them was
 * being sent whole into a hero box 390 pixels tall — 330 on a phone — and
 * again into a 42-pixel casting-strip thumbnail. Sixty-four megabytes for six
 * faces, re-fetched every minute, because the route deliberately caches short
 * so a replaced file shows up quickly.
 *
 * next/image cannot help here. Its optimiser fetches the source over HTTP from
 * the server, without the member's cookies, and /codex-art answers anything
 * without a session with a 404 — which is the whole point of that route. So
 * the resizing happens here instead, behind the same gate.
 *
 * The cache lives outside `private/codex-art` on purpose. Everything inside
 * that tree is a shelf somebody drops art into and the audits enumerate; this
 * is disposable derived output, and deleting the whole directory costs nothing
 * but the next request.
 *
 * Server-only. Never import from a "use client" module.
 */

/** The widths a caller may ask for. A fixed set, so no request can fill the
 *  disk by walking through arbitrary sizes. */
export const codexArtWidths = [96, 320, 640, 960, 1440, 1920] as const;
export type CodexArtWidth = (typeof codexArtWidths)[number];

export function parseCodexArtWidth(value: string | null): CodexArtWidth | null {
  if (!value) return null;
  const width = Number(value);
  return (codexArtWidths as readonly number[]).includes(width) ? width as CodexArtWidth : null;
}

const cacheRoot = () => path.join(/*turbopackIgnore: true*/ process.cwd(), "private", "codex-art-cache");

/** Identity of the file as it is right now. A replaced original changes its
 *  size or its mtime, so its derivatives are simply never found again. */
function sourceStamp(file: string): string | null {
  try {
    const stat = statSync(file);
    return createHash("sha1").update(`${stat.size}:${stat.mtimeMs}`).digest("hex").slice(0, 12);
  } catch {
    return null;
  }
}

export type CodexArtDerivative = { bytes: Buffer; contentType: string };

/**
 * A WebP copy of `sourceFile` no wider than `width`, or null when the caller
 * should just be handed the original.
 *
 * Null is the honest answer for art that is already small — re-encoding a
 * 40 KB faction logo buys nothing and loses a little — so the route falls
 * back rather than pretending it did something.
 */
export async function codexArtDerivative(sourceFile: string, width: CodexArtWidth, kind: string, slug: string): Promise<CodexArtDerivative | null> {
  const stamp = sourceStamp(sourceFile);
  if (!stamp) return null;

  const directory = path.join(cacheRoot(), kind);
  const cached = path.join(directory, `${slug}-w${width}-${stamp}.webp`);
  const existing = await readFile(cached).catch(() => null);
  if (existing) return { bytes: existing, contentType: "image/webp" };

  // Imported here rather than at module load: sharp is a native binding, and
  // nothing that merely resolves an art URL should pay to load it.
  const sharp = (await import("sharp")).default;
  const image = sharp(sourceFile, { failOn: "error" });
  const meta = await image.metadata().catch(() => null);
  if (!meta?.width || !meta.height) return null;

  // Already the right size and already in a modern format — leave it alone.
  if (meta.format === "webp" && meta.width <= width) return null;

  const bytes = await image
    .resize({ width: Math.min(width, meta.width), withoutEnlargement: true })
    .webp({ quality: 82, effort: 4 })
    .toBuffer()
    .catch(() => null);
  if (!bytes) return null;

  // A derivative bigger than the file it came from is not a saving.
  if (bytes.byteLength >= statSync(sourceFile).size && meta.width <= width) return null;

  try {
    mkdirSync(directory, { recursive: true });
    // Anything left from an older version of this original is dead the moment
    // this one is written, and nothing else will ever ask for it by name.
    for (const file of readdirSync(directory)) {
      if (file.startsWith(`${slug}-w${width}-`) && file !== path.basename(cached)) {
        rmSync(path.join(directory, file), { force: true });
      }
    }
    // Written aside and renamed, so a second request that arrives mid-encode
    // reads either nothing or a whole file, never half of one.
    const temporary = `${cached}.${process.pid}.${stamp}.part`;
    await writeFile(temporary, bytes);
    renameSync(temporary, cached);
  } catch {
    // A cache that cannot be written is still a correct resize.
  }

  return { bytes, contentType: "image/webp" };
}

/** Drops every derivative. Safe at any time; the next request rebuilds. */
export function clearCodexArtDerivatives() {
  if (existsSync(cacheRoot())) rmSync(cacheRoot(), { recursive: true, force: true });
}

/**
 * The `srcset` for an art URL, so the browser asks for the size it will
 * actually paint instead of the master. `sizes` belongs at the call site —
 * only the layout there knows how wide the box is.
 */
export function codexArtSrcSet(url: string, widths: readonly CodexArtWidth[] = codexArtWidths): string {
  return widths.map((width) => `${url}?w=${width} ${width}w`).join(", ");
}

/**
 * A fixed-size box asks for one width. Most codex art sits in a box the CSS
 * pins — a 128px card column, a 104px faction logo, a 55px casting thumbnail —
 * so a `srcset` there would be ceremony around a single answer.
 */
export function codexArtSized(url: string, width: CodexArtWidth): string {
  return `${url}?w=${width}`;
}
