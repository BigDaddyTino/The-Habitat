export type RegionBranding = {
  accent: string;
  keyart: string;
};

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
    keyart: `/images/regions/keyart/${slug}.jpg`,
  };
}

export const brandedRegionCount = Object.keys(regionAccents).length;
export const brandedRegionSlugs = Object.freeze(Object.keys(regionAccents));
