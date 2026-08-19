import { codexArtSlot, findCodexArt } from "./codex-art";

/**
 * Key art for timeline events. Thin wrappers over the shared convention in
 * `codex-art.ts`; see that file for why these are served through /codex-art
 * rather than as static assets under public/.
 */
export function getEventArt(slug: string): string | null {
  return findCodexArt("timeline", slug);
}

export function eventArtSlot(slug: string) {
  return codexArtSlot("timeline", slug);
}
