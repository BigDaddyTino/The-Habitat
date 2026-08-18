export type RegionBranding = {
  accent: string;
  keyart: string;
};

const regionAccents = {
  "blackreef-harbour": "#4f9baa",
  "fort-tempest": "#91a6b4",
  "forward-camp-kestrel": "#c49a61",
  "glasswater-village": "#55a79b",
  "northwatch-relay": "#5e9fd1",
  "pearl-beachhead": "#d8bd78",
  "port-arcadia": "#d6ac5b",
  "riftwood-interior": "#826be8",
  "shattermarket": "#9e6ac6",
  "stormglass-landing": "#58cf83",
  "stormglass-quarry": "#4fc6d3",
  "the-ocean": "#388ca6",
  "the-peninsula": "#88a56d",
  "the-starting-island": "#64b778",
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
