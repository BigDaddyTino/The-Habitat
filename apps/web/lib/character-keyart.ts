import { codexArtSlot, findCodexArt } from "./codex-art";

const characterKeyart = {
  "abraham-islay-kane": "/codex-art/characters/abraham-islay-kane.jpg",
  amanda: "/codex-art/characters/amanda.jpg",
  "jaro-fen": "/codex-art/characters/jaro-fen.png",
  "keira-ansel": "/codex-art/characters/keira-ansel.png",
  "mara-quill": "/codex-art/characters/mara-quill.png",
  "nalia-reed": "/codex-art/characters/nalia-reed.png",
  "selene-ward": "/codex-art/characters/selene-ward.png",
  steve: "/codex-art/characters/steve.png",
  "the-kestrel-commander": "/codex-art/characters/the-kestrel-commander.png",
  "the-war-correspondent": "/codex-art/characters/the-war-correspondent.png",
  tino: "/codex-art/characters/tino.png",
  "tomas-vey": "/codex-art/characters/tomas-vey.png",
} as const satisfies Record<string, string>;

export function getCharacterKeyart(slug: string): string | null {
  return characterKeyart[slug as keyof typeof characterKeyart] ?? null;
}

/**
 * A character's portrait: an explicitly mapped asset above, or any file dropped
 * in beside it.
 *
 * Both halves now resolve to the same authenticated /codex-art route. The map
 * used to point at `/images/...`, which Next served statically to anonymous
 * callers — twelve portraits, roughly 74 MiB of unreleased character design,
 * reachable by anyone who guessed the slug while the dossier around them
 * required a member account.
 *
 * The map still exists because it is the only half a client component can
 * call; anything added by convention is read off disk per request instead, so
 * a new portrait appears on the next reload — drop
 * `private/codex-art/characters/<slug>.png` and the dossier wears it.
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
