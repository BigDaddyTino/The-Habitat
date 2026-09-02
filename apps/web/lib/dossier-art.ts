import { bloomfallCreatureArtUrl, getBloomfallCreatureHeroArt } from "./bloomfall-creature-art";
import { getBloomfallV3CodexArt } from "./bloomfall-v3-art";
import { getCharacterArt } from "./character-keyart";
import { codexArtSlot, findCodexArt, type CodexArtKind } from "./codex-art";
import { getCreatureKeyart } from "./creature-keyart";
import { getEventArt } from "./event-art";
import { getRegionBranding, getRegionKeyart } from "./region-branding";
import { getSystemArt, systemArtSlot } from "./system-art";

/**
 * The one place that decides which picture a codex entry wears.
 *
 * The dossier and the library directory had grown the same nine-rung fallback
 * chain, written out twice as nested ternaries, and the duplication is what
 * hid the bug this file was extracted to fix: six whole kinds — rules,
 * companion missions, flags, items, themes and threads — had owner-approved
 * artwork sitting in `private/codex-art/<kind>/` that no resolver had ever
 * been taught to look for, so forty finished images rendered as a grey
 * placeholder. Adding a kind is now one row of a table instead of one more
 * rung on a chain nobody wants to read.
 *
 * Faction branding is deliberately NOT here. A faction hero is two elements —
 * key art with the logo laid over it — so it stays in the components, ahead of
 * this call.
 *
 * Server-only (node:fs via codex-art). Never import from a "use client" module.
 */
export type DossierArt = {
  src: string;
  /** Follows the entry title in the img alt text. */
  alt: string;
  /** The provenance line printed beneath the art. */
  caption: string;
};

/**
 * Kinds served purely by the drop-in convention: a file named for the slug,
 * in the directory named for the shelf. Nothing to register, and the reason
 * the six of them can be fixed by a table rather than by six resolvers.
 */
const conventionArt = {
  COMPANION_MISSION: ["companion-missions", "companion mission key art", "Companion mission · original key art"],
  FLAG: ["flags", "story flag key art", "Story flag · original key art"],
  ITEM: ["items", "item key art", "Item · original key art"],
  RULE: ["rules", "world rule key art", "World rule · original key art"],
  THEME: ["themes", "theme key art", "Theme · original key art"],
  THREAD: ["threads", "story thread key art", "Story thread · original key art"],
} as const satisfies Record<string, readonly [CodexArtKind, string, string]>;

/**
 * Where a picture for this entry would go. Every kind that can wear art gets
 * to say so on its empty state, which is the whole authoring affordance: the
 * dossier prints the exact path, somebody drops a file there, and the next
 * reload wears it.
 */
const artSlotDirectory = {
  CHARACTER: "characters",
  COMPANION_MISSION: "companion-missions",
  CREATURE: "creatures",
  EVENT: "timeline",
  FLAG: "flags",
  ITEM: "items",
  REGION: "regions",
  RULE: "rules",
  SYSTEM: "systems",
  THEME: "themes",
  THREAD: "threads",
} as const satisfies Record<string, CodexArtKind>;

/**
 * Reserved, unnamed character seats are real story records but not casting
 * briefs. They become portrait-eligible only once a writer gives the seat a
 * person: until then the honest visual state is deliberately blank, not an
 * "owed" art path.
 */
const reservedPortraitSlugs = new Set<string>(["the-grand-advocate"]);

export function dossierArtExpected(kind: string, slug: string, meta: unknown): boolean {
  if (!(kind in artSlotDirectory)) return false;
  if (kind !== "CHARACTER" || !reservedPortraitSlugs.has(slug)) return true;

  const character = meta && typeof meta === "object" && !Array.isArray(meta)
    ? meta as Record<string, unknown>
    : {};
  return typeof character.fullName === "string" && character.fullName.trim().length > 0;
}

export function dossierArtSlot(kind: string, slug: string, meta?: unknown): string | null {
  if (!dossierArtExpected(kind, slug, meta)) return null;
  if (kind === "SYSTEM") return systemArtSlot(slug);
  const directory = artSlotDirectory[kind as keyof typeof artSlotDirectory];
  return directory ? codexArtSlot(directory, slug) : null;
}

/**
 * The entry's picture, or null when nobody has made one yet.
 *
 * Order is the order the surfaces used before this file existed, so nothing
 * that already had art changes what it wears: the owner-approved Bloomfall
 * plates outrank everything, then the V3 bindings, then each kind's own
 * resolver, then the drop-in convention.
 */
export function getDossierArt(kind: string, slug: string, meta: unknown): DossierArt | null {
  if (!dossierArtExpected(kind, slug, meta)) return null;

  const plate = getBloomfallCreatureHeroArt(slug);
  if (plate) {
    return { src: bloomfallCreatureArtUrl(plate), alt: "creature key art", caption: "Bloomfall creature · owner-approved key art" };
  }

  const v3 = getBloomfallV3CodexArt(slug, meta);
  if (v3) return { src: v3, alt: "Bloomfall V3 key art", caption: "Bloomfall V3 · owner-approved key art" };

  if (kind === "REGION") {
    // Artwork and identity are separate concerns, and asking for branding is
    // how three finished environment plates went unseen: a place can have an
    // approved picture long before anyone settles its accent colour.
    const art = getRegionKeyart(slug);
    if (art) {
      return {
        src: art,
        alt: "environment key art",
        caption: getRegionBranding(slug) ? "Region identity · original environment key art" : "Original environment key art",
      };
    }
  }

  if (kind === "CHARACTER") {
    const art = getCharacterArt(slug);
    if (art) return { src: art, alt: "character key art", caption: "Original character key art" };
  }

  if (kind === "CREATURE") {
    const art = getCreatureKeyart(slug) ?? findCodexArt("creatures", slug) ?? findCodexArt("races", slug);
    if (art) return { src: art, alt: "creature key art", caption: "Mythical creature · original key art" };
  }

  if (kind === "SYSTEM") {
    const art = getSystemArt(slug);
    if (art) return { src: art, alt: "system key art", caption: "Game system · original key art" };
  }

  if (kind === "EVENT") {
    const art = getEventArt(slug);
    if (art) return { src: art, alt: "timeline key art", caption: "From the timeline archive" };
  }

  const convention = conventionArt[kind as keyof typeof conventionArt];
  if (convention) {
    const art = findCodexArt(convention[0], slug);
    if (art) return { src: art, alt: convention[1], caption: convention[2] };
  }

  return null;
}

/** The kinds whose empty state offers a drop-in path, for the audits. */
export const artSlotKinds = Object.freeze(Object.keys(artSlotDirectory));
