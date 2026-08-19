import { existsSync } from "node:fs";
import path from "node:path";

/**
 * Key art for game-system dossiers, found by convention rather than by a
 * hand-kept map: drop a file at `public/images/systems/<slug>.png` (or .jpg /
 * .webp) and the card and dossier pick it up on the next render — no code
 * change, no redeploy of anything but the file.
 *
 * Server-only (node:fs): both surfaces that render systems — the library
 * directory and the dossier profile — are server components. Never import
 * this from a "use client" module.
 */

const artDirectory = path.join(process.cwd(), "public", "images", "systems");
const artExtensions = ["png", "jpg", "webp"] as const;

export function getSystemArt(slug: string): string | null {
  for (const extension of artExtensions) {
    if (existsSync(path.join(artDirectory, `${slug}.${extension}`))) return `/images/systems/${slug}.${extension}`;
  }
  return null;
}

/** Where to drop the art, shown verbatim on the empty slot so nobody has to ask. */
export function systemArtSlot(slug: string) {
  return `images/systems/${slug}.png`;
}
