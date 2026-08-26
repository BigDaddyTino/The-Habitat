/** Owner-approved canonical vocabulary for Martino's southeastern region. */
export const bloomfallReachCanon = {
  title: "Bloomfall Reach",
  slug: "bloomfall-reach",
  commonName: "The Living Ruin",
  historicalName: "Southreach Energy Reserve",
  historicalShorthand: "Southreach",
  facility: {
    formalName: "Southreach Strategic Essence Reserve, Refinery, and Gridworks",
    commonName: "The Southreach Complex",
  },
  catastrophe: "The Bloomfall",
  catastropheAge: "roughly two decades before the present day",
  corruption: "The Blackbloom",
  officialCause: "A cascading industrial control and containment failure during strategic load balancing drove multiple Essence storage banks into uncontrolled resonance. Isolation systems failed faster than the facility could segment the reserve, causing a catastrophic regional release.",
  deepMysteryTruth: "DEFERRED",
  subregions: {
    north: "The Shattercore",
    central: "The Mutation Belt",
    south: "The Living Marsh",
  },
  formerDevelopmentPlaceholder: {
    title: "Unknown Southeast",
    slug: "unknown-southeast",
    inWorldCanon: false,
  },
} as const;

/**
 * Historical Atlas activation artifacts retain the former slug as provenance.
 * Current projections canonicalize that one retired placeholder at the edge.
 */
export function canonicalBloomfallReachSlug(slug: string) {
  return slug === bloomfallReachCanon.formerDevelopmentPlaceholder.slug ? bloomfallReachCanon.slug : slug;
}

/** Locked semantic metadata for the development-only Bloomfall child Atlas. */
export const bloomfallReachLocalAtlas = {
  sceneSlug: "martino-bloomfall-reach",
  artVersion: "v1",
  subregions: [
    { slug: "the-shattercore", title: "The Shattercore", parentSlug: null, neighbors: ["the-mutation-belt"] },
    { slug: "the-mutation-belt", title: "The Mutation Belt", parentSlug: null, neighbors: ["the-shattercore", "the-living-marsh"] },
    { slug: "the-living-marsh", title: "The Living Marsh", parentSlug: null, neighbors: ["the-mutation-belt"] },
  ],
} as const;
