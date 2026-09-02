import { NATION_MANAGEMENT_PERSISTED_SLUG, NATION_MANAGEMENT_ROUTE_SLUG } from "@habitat/shared";
import { codexArtSlot, findCodexArt } from "./codex-art";

/**
 * Key art for game-system dossiers. Thin wrappers over the shared convention
 * in `codex-art.ts`; see that file for why these are served through /codex-art
 * rather than as static assets under public/.
 */
export function getSystemArt(slug: string): string | null {
  return findCodexArt("systems", canonicalSystemArtSlug(slug));
}

export function systemArtSlot(slug: string) {
  return codexArtSlot("systems", canonicalSystemArtSlug(slug));
}

function canonicalSystemArtSlug(slug: string) {
  return slug === NATION_MANAGEMENT_PERSISTED_SLUG ? NATION_MANAGEMENT_ROUTE_SLUG : slug;
}
