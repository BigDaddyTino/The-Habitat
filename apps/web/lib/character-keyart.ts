import { codexArtSlot, findCodexArt } from "./codex-art";

const characterKeyart = {
  "abraham-islay-kane": "/images/characters/keyart/abraham-islay-kane.jpg",
  amanda: "/images/characters/keyart/amanda.jpg",
  steve: "/images/characters/keyart/steve.png",
  "the-kestrel-commander": "/images/characters/keyart/the-kestrel-commander.png",
  "the-war-correspondent": "/images/characters/keyart/the-war-correspondent.png",
  tino: "/images/characters/keyart/tino.png",
} as const satisfies Record<string, string>;

export function getCharacterKeyart(slug: string): string | null {
  return characterKeyart[slug as keyof typeof characterKeyart] ?? null;
}

/**
 * A character's portrait: the six above, or any file dropped in beside them.
 *
 * The map predates the /codex-art route and points at static paths, which is
 * why those six need a build to change. Anything added by convention is read
 * off disk per request instead, so a new portrait appears on the next reload —
 * drop `public/images/characters/keyart/<slug>.png` and the dossier wears it.
 *
 * Server-only (node:fs via codex-art). Never import from a "use client" module.
 */
export function getCharacterArt(slug: string): string | null {
  return getCharacterKeyart(slug) ?? findCodexArt("characters", slug);
}

export function characterArtSlot(slug: string) {
  return codexArtSlot("characters", slug);
}

export const illustratedCharacterSlugs = Object.freeze(Object.keys(characterKeyart));
