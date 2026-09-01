import { findCodexArt } from "./codex-art";

export type RegionBranding = {
  accent: string;
  keyart: string;
};

const standaloneRegionKeyart = {
  "death-canyon": "/codex-art/regions/death-canyon.png",
  "draw-nine": "/codex-art/regions/draw-nine.png",
  "grand-lake": "/codex-art/regions/grand-lake.png",
  "the-docks": "/codex-art/regions/the-docks.png",
  "the-floating-city": "/codex-art/regions/the-floating-city.jpg",
} as const satisfies Record<string, string>;

const regionAccents = {
  // The Docks stays unbranded until its title-only, parentless dossier says
  // which docks these are and what distinguishes them from the waterfront.
  "arcadian-soverign-guard": "#4f9f9c",
  "arcadian-special-intelligence-service": "#4e94a0",
  "blackreef-harbour": "#4f9baa",
  "census-office": "#b48755",
  "chancellory-of-arcadia": "#4ca5b2",
  "east-side": "#3da9bd",
  "embassy-row": "#c39a59",
  "exclusion-area": "#4a9d83",
  "fort-tempest": "#91a6b4",
  "forward-camp-kestrel": "#c49a61",
  "glasswater-village": "#55a79b",
  "lower-westside": "#4da8b2",
  "northwatch-relay": "#5e9fd1",
  "pearl-beachhead": "#d8bd78",
  "port-arcadia": "#d6ac5b",
  "riftwood-interior": "#826be8",
  "shattermarket": "#9e6ac6",
  "stormglass-landing": "#58cf83",
  "stormglass-quarry": "#4fc6d3",
  "the-northside": "#67a66f",
  "the-ocean": "#388ca6",
  "the-peninsula": "#88a56d",
  "the-southside": "#a76547",
  "the-starting-island": "#64b778",
  "upper-westside": "#c2a263",
  "waterfront-district": "#548d9f",
} as const satisfies Record<string, string>;

export function getRegionBranding(slug: string): RegionBranding | null {
  const accent = regionAccents[slug as keyof typeof regionAccents];
  if (!accent) return null;

  return {
    accent,
    keyart: getRegionKeyart(slug)!,
  };
}

/** Artwork and full branding are separate concerns. A place can already have
 * approved key art without yet having a settled accent/identity package. */
export function getRegionKeyart(slug: string): string | null {
  const convention = findCodexArt("regions", slug);
  if (convention) return convention;

  const standalone = standaloneRegionKeyart[slug as keyof typeof standaloneRegionKeyart];
  if (standalone) return standalone;
  return slug in regionAccents ? `/codex-art/regions/${slug}.jpg` : null;
}

export const brandedRegionCount = Object.keys(regionAccents).length;
export const brandedRegionSlugs = Object.freeze(Object.keys(regionAccents));
