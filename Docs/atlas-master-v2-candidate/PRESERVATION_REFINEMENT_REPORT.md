# Martino World Atlas Master V2 Candidate — Preservation vs Refinement

Status: **OWNER REVIEW REQUIRED**  
Prepared: 2026-08-24

## PRESERVED

- The V1 source remains untouched at its recorded SHA-256: `785f4d5a4637598ef04a40a2c8e86d7b69ef3f38d4b50cb32b6ebcd0363b79c1`.
- The 1536 × 1024, 3:2 world framing and elevated three-quarter atlas viewpoint.
- The established landmass concept and relative arrangement of the Desert, Grand Rift, Red Forest, Riverlands, High Cliffs, Grand Lake, Magic-Torn Wasteland, Unknown Southeast, and long Peninsula.
- Grand Lake inside the northern heights, its great waterfall, and the central Riverlands drainage direction.
- Port Arcadia as a large crescent port at the Peninsula’s southern tip.
- Ignit Island as the Starting/tutorial island immediately southwest of Port Arcadia.
- The Floating City above/beside Grand Lake.
- Near-future industry, infrastructure, magic-tech fusion, inhabited terrain, danger, and mature AAA tone.
- Unknown Southeast’s deliberate lack of authored lore.

## REFINED

- Added one consistent, high-contrast but terrain-integrated cartographic boundary treatment.
- Increased macro differentiation without turning regions into flat color blobs.
- Made the Grand Rift / nested Death Canyon hierarchy and the adjacent top-level Red Forest relationship readable at world scale.
- Clarified the central hydrology, Peninsula silhouette, settlement silhouettes, and world anchors.
- Added a restrained label hierarchy in Output A while retaining a label-free Output B for runtime integration.
- Kept unnamed regional cities visible but unlabeled, preserving unresolved Codex canon.

## INTENTIONAL_GEOGRAPHIC_CLARIFICATION

- Soft ecological transitions now receive crisp proposed Atlas segmentation lines so they can be traced and share topology.
- The Red Forest remains visibly feathered into the Grand Rift even though its selection boundary is explicit.
- The Riverlands’ branching corridors remain visually continuous across neighboring biomes, while a stable macro perimeter is proposed for selection.
- The Peninsula receives an explicit northern-neck boundary that V1 did not make unambiguous.
- Unknown Southeast receives a clear interface perimeter while remaining intentionally unauthored.
- Grand Lake is visually isolated as a true water area contained by the High Cliffs, supporting a shared shoreline/hole topology.

## OWNER_REVIEW_REQUIRED

- Approve or adjust every internal boundary before tracing canonical V2 topology; the artwork is a proposal, not a migration decision.
- Confirm the High Cliffs’ northwest and northeast transition endpoints.
- Confirm the Riverlands / Desert, Riverlands / Magic-Torn Wasteland, and Riverlands / Unknown Southeast segmentation choices.
- Confirm the Peninsula’s northern-neck line.
- Owner decision recorded: Red Forest is one independently selectable top-level neighbor of Grand Rift; Death Canyon alone is nested inside Grand Rift.
- Confirm that the far southwestern inhabited city-island remains intentionally unnamed and distinct from Ignit Island.
- Confirm whether the strong light boundary treatment should remain at this prominence or receive a subtler final polish pass.
- Approve Output B as the tracing master before any new art version, placement recalibration, topology migration, renderer switch, or Bundle change.

## UNACCEPTABLE_DRIFT

The following would reject this candidate or any follow-up revision:

- Moving Port Arcadia away from the Peninsula tip.
- Moving the Ignit Island identity back to the far southwestern city-island.
- Losing or relocating the Floating City or Grand Lake.
- Replacing the established landmass with a new continent, adding arbitrary islands, or changing the region order.
- Treating cartographic segmentation as political control or faction ownership.
- Inventing names, factions, ecology, or settlements for unresolved areas—especially Unknown Southeast.
- Flattening the Red Forest / Grand Rift transition into lore that contradicts the current gradual-canopy canon.
- Overwriting V1, switching the live map before approval, or reusing V1 geometry without V2 visual recalibration.

## Recommendation

Keep both assets review-only. If Output B is approved, the next controlled step is an immutable `martino-world:v2-candidate` registration plus a side-by-side protected preview and fresh topology trace/recalibration. The existing V1 route, placements, Codex URLs, world connections, and Bundle V4 must remain active until that review passes.
