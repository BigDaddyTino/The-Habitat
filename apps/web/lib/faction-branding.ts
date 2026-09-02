export type FactionBranding = {
  accent: string;
  keyart: string;
  logo: string;
};

const factionAccents = {
  "abomination-containment-authority": "#e59b42",
  "aegis-extraction-consortium": "#4fb487",
  "black-tithe-syndicate": "#b36ee7",
  "bone-market-families": "#c7aa78",
  "church-of-the-first-gift": "#dfc568",
  "concordance-of-natural-casters": "#8d78f2",
  "crimson-choir": "#d14b52",
  "cybernetic-ascendancy": "#36c9e7",
  "desert-nomad-compact": "#d39743",
  "drifter-renegade-camps": "#4eaa9f",
  "drone-surveillance-bureau": "#49aacc",
  "floating-city-council": "#d8b764",
  "foundry-workers-union": "#e26b32",
  "free-islander-league": "#42b8bd",
  "helix-arcanobiotics": "#7d63ea",
  "iron-saints-pmc": "#b89b63",
  "liberation-of-the-gifted": "#a75de0",
  "meridian-arcane-institute": "#58bddd",
  "mountain-holdfasts": "#4b9bd2",
  "national-defense-directorate": "#d85c56",
  "ossuary-covenant": "#b7b39b",
  "peninsula-coast-guard-authority": "#ef8139",
  "peninsula-expeditionary-army": "#9c9b56",
  "sanctuary-of-living-beasts": "#56b97b",
  "skybridge-transit-authority": "#41c9dc",
  "stormglass-cartel": "#438ee8",
  "the-ashen-court": "#b8323f",
  "the-choir-below": "#4bb4be",
  "the-congregation-of-the-bound": "#a8bdc5",
  "the-free-peoples-compact": "#7c9a52",
  "the-old-hunger": "#9f2737",
  "the-pale-embassy": "#d9c7a1",
  "the-riftbound-legion": "#c72f3e",
  "tropic-pearl-trade-house": "#e4c675",
  "verdant-marsh-clans": "#54b878",
  "wardens-monster-hunter-guild": "#d4913f",
} as const satisfies Record<string, string>;

// The original faction shelf shipped as JPG key art. New drop-in commissions
// may use the standing PNG contract without forcing every older plate through
// a lossy transcode.
const pngFactionKeyart = new Set<string>(["the-congregation-of-the-bound"]);

export function getFactionBranding(slug: string): FactionBranding | null {
  const accent = factionAccents[slug as keyof typeof factionAccents];
  if (!accent) return null;

  return {
    accent,
    keyart: `/codex-art/factions/${slug}.${pngFactionKeyart.has(slug) ? "png" : "jpg"}`,
    logo: `/codex-art/faction-logos/${slug}.png`,
  };
}

export const brandedFactionCount = Object.keys(factionAccents).length;
export const brandedFactionSlugs = Object.freeze(Object.keys(factionAccents));
