import { existsSync } from "node:fs";
import path from "node:path";

/**
 * Key art for codex dossiers, found by convention rather than a hand-kept map:
 * drop a file named for the entry's slug and the card and dossier wear it.
 *
 *   public/images/systems/<slug>.(png|jpg|webp)    — game systems
 *   public/images/timeline/<slug>.(png|jpg|webp)   — timeline events
 *
 * The files live under `public/` so they are version-controlled with the rest
 * of the art, but they are SERVED through /codex-art rather than as static
 * assets: Next indexes `public/` at build time, so a file added afterwards
 * would 404 until the next build. Reading from disk per request is what makes
 * "drop it in and reload" actually true.
 *
 * Server-only (node:fs). Never import from a "use client" module.
 */

export const codexArtKinds = { systems: "systems", timeline: "timeline" } as const;
export type CodexArtKind = keyof typeof codexArtKinds;

export const codexArtContentTypes = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
} as const;

const artExtensions = ["png", "jpg", "jpeg", "webp"] as const;

function directoryFor(kind: CodexArtKind) {
  return path.join(process.cwd(), "public", "images", codexArtKinds[kind]);
}

/** The URL for an entry's art, or null when nobody has dropped one in yet. */
export function findCodexArt(kind: CodexArtKind, slug: string): string | null {
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) return null;
  for (const extension of artExtensions) {
    if (existsSync(path.join(directoryFor(kind), `${slug}.${extension}`))) {
      return `/codex-art/${codexArtKinds[kind]}/${slug}.${extension}`;
    }
  }
  return null;
}

/** Where to drop the art, shown verbatim on the empty slot. */
export function codexArtSlot(kind: CodexArtKind, slug: string) {
  return `images/${codexArtKinds[kind]}/${slug}.png`;
}

/**
 * Resolves a request path to a file on disk, or null. The kind must be one of
 * the two known directories and the filename must be `<slug>.<ext>`, so there
 * is no way to express a traversal — and the resolved path is re-checked to be
 * inside its directory regardless.
 */
export function resolveCodexArtFile(kind: string, file: string): string | null {
  if (!(kind in codexArtKinds)) return null;
  const match = /^([a-z0-9]+(?:-[a-z0-9]+)*)\.(png|jpg|jpeg|webp)$/.exec(file);
  if (!match) return null;
  const directory = directoryFor(kind as CodexArtKind);
  const target = path.resolve(directory, file);
  if (target !== path.join(directory, file)) return null;
  return existsSync(target) ? target : null;
}
