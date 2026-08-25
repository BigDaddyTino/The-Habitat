# Atlas 2.0 Owner Review Packet

This packet contains only unresolved owner/editorial calls. No item here was merged, promoted, or written to the active database.

## Ambiguous connection classifications

### death-canyon.meta.connections[0]

- Source: `death-canyon`
- Target: `the-red-forest`
- Original wording: `broken canyon shelves`
- Candidate: `OTHER` (low confidence)
- Fingerprint: `1594591c8ed4a2f59f3b9977fdac7bca405f4e4efffcb9ac4a6f6939cfd45f60`
- Recommendation: retain `OTHER`; decide whether the authored shelves describe a travel route at all and, if so, which controlled type fits.
- Why review: The authored route wording "broken canyon shelves" has no safe controlled transport mapping; preserve it as OTHER pending owner review.

### the-red-forest.meta.connections[0]

- Source: `the-red-forest`
- Target: `death-canyon`
- Original wording: `fractured forest shelves`
- Candidate: `OTHER` (low confidence)
- Fingerprint: `8c21ee4686d5a1c3dac17d82345fc20205c7d320f22bd62b98be5e748561307a`
- Recommendation: retain `OTHER`; decide whether the authored shelves describe a travel route at all and, if so, which controlled type fits.
- Why review: The authored route wording "fractured forest shelves" has no safe controlled transport mapping; preserve it as OTHER pending owner review.

## Reciprocal connection candidates

### Group 1

- A: `death-canyon → the-red-forest` — `broken canyon shelves` — `death-canyon.meta.connections[0]`
- B: `the-red-forest → death-canyon` — `fractured forest shelves` — `the-red-forest.meta.connections[0]`
- Candidate interpretation: `UNRESOLVED`
- Recommendation: Keep both directional candidates distinct until an owner confirms merge, directionality, or distinct-route intent.

### Group 2

- A: `grand-rift → riverlands` — `rift river corridor` — `grand-rift.meta.connections[0]`
- B: `riverlands → grand-rift` — `river corridor` — `riverlands.meta.connections[1]`
- Candidate interpretation: `LIKELY_ONE_BIDIRECTIONAL_ROUTE`
- Recommendation: Keep both directional candidates distinct until an owner confirms merge, directionality, or distinct-route intent.

### Group 3

- A: `high-cliffs → riverlands` — `waterfalls and river valleys` — `high-cliffs.meta.connections[0]`
- B: `riverlands → high-cliffs` — `river corridor` — `riverlands.meta.connections[0]`
- Candidate interpretation: `LIKELY_ONE_BIDIRECTIONAL_ROUTE`
- Recommendation: Keep both directional candidates distinct until an owner confirms merge, directionality, or distinct-route intent.

### Group 4

- A: `magic-torn-wasteland → riverlands` — `stabilized river corridor` — `magic-torn-wasteland.meta.connections[0]`
- B: `riverlands → magic-torn-wasteland` — `river corridor` — `riverlands.meta.connections[3]`
- Candidate interpretation: `LIKELY_ONE_BIDIRECTIONAL_ROUTE`
- Recommendation: Keep both directional candidates distinct until an owner confirms merge, directionality, or distinct-route intent.

### Group 5

- A: `riverlands → the-desert` — `river corridor` — `riverlands.meta.connections[2]`
- B: `the-desert → riverlands` — `oasis river corridor` — `the-desert.meta.connections[0]`
- Candidate interpretation: `LIKELY_ONE_BIDIRECTIONAL_ROUTE`
- Recommendation: Keep both directional candidates distinct until an owner confirms merge, directionality, or distinct-route intent.

## World topology

Prompt 6 resolves the world-master geography. All eight top-level land regions, Grand Lake, and nested Death Canyon are approved for migration in the deterministic topology manifest. No world-master boundary remains owner-review-required.

## Starting Island

No canonical base-geography topology was stored. Named polygons are mostly settlements, forts, sites, landings, or markers. `riftwood-interior` is the sole broad geography candidate, but its lore and artwork do not define a precise perimeter. Owner decision: decide whether Riftwood is a base-geography area, a narrative/biome overlay, or a point/label-only place before tracing.

## Port Arcadia

Decoded artwork is **1599×984** while the declared contract remains **1536×1024**. No topology was created. Recalibrate the coordinate/artwork relationship first, then review the seven intended district areas against the undistorted image: exclusion-area, upper-westside, lower-westside, the-northside, the-southside, waterfront-district, and east-side.
