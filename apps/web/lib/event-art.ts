import { existsSync } from "node:fs";
import path from "node:path";

/**
 * Key art for timeline events, by the same convention systems use: drop a
 * file at `public/images/timeline/<slug>.png` (or .jpg / .webp) and the
 * timeline card and the event dossier pick it up on the next render.
 *
 * Server-only (node:fs) — the timeline page and the dossier profile are both
 * server components. Never import from a "use client" module.
 */

const artDirectory = path.join(process.cwd(), "public", "images", "timeline");
const artExtensions = ["png", "jpg", "webp"] as const;

export function getEventArt(slug: string): string | null {
  for (const extension of artExtensions) {
    if (existsSync(path.join(artDirectory, `${slug}.${extension}`))) return `/images/timeline/${slug}.${extension}`;
  }
  return null;
}

/** Where to drop the art, shown verbatim so nobody has to ask. */
export function eventArtSlot(slug: string) {
  return `images/timeline/${slug}.png`;
}
