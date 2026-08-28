# Martino World Atlas Master V2 Candidate — Map Support Manifest

Status: **REVIEW CANDIDATE — NOT CANONICAL OR RUNTIME-ACTIVE**  
Prepared: 2026-08-24

## Candidate assets

| Output | File | Dimensions | SHA-256 |
| --- | --- | ---: | --- |
| A — labeled | `apps/web/private/codex-art/maps/candidates/martino-world-map-v2-labeled-candidate.png` | 1536 × 1024 | `baa0ecacddc90d610ad46842cab415d7345bfecf8ed25b182b7393ad5aae5bc8` |
| B — clean | `apps/web/private/codex-art/maps/candidates/martino-world-map-v2-clean-candidate.png` | 1536 × 1024 | `e276622ab473b5b538daeafeb832d235a23541ad6cad5aece20d4526f2cd7ec0` |
| V1 reference, unchanged | `apps/web/private/codex-art/maps/martino-world-map-v1.png` | 1536 × 1024 | `785f4d5a4637598ef04a40a2c8e86d7b69ef3f38d4b50cb32b6ebcd0363b79c1` |

The labeled candidate was derived from the clean candidate. They use the same world composition and cartographic boundaries. Output B contains no text, so future Atlas labels and interaction states can remain data-driven.

## Interpretation rule

These lines define proposed **Atlas segmentation**, not political ownership. Geographic regions, nested biome/hazard zones, faction influence, political control, corruption, discovery, and narrative areas remain separate data layers. Approval of this artwork must not convert its cartographic lines into faction borders.

## Major regions and boundary rationale

| Atlas area | Classification | Proposed visual boundary rationale | Confidence / softness |
| --- | --- | --- | --- |
| The Riverlands | Geographic region | Central connected watershed. Its outer line follows the stable lowland transition while river arms remain visible corridors into neighboring terrain. | Medium. River corridors naturally cross biome transitions; the segmentation line is intentionally crisper than the ecology. |
| The Grand Rift | Geographic region | The large northwestern fracture system is bounded by its outer broken-earth rim and shelf transition. | High along the main rift walls; medium at the northern and southern shelf endpoints. |
| The High Cliffs | Geographic region | The northern alpine crown is defined by the ridge/escarpment system and the enormous waterfall edge. Grand Lake is contained within it. | High at cliffs/coast; medium where uplands descend into Riverlands and adjacent anomalous terrain. |
| The Grand Lake | Landmark / water area | The visible elevated shoreline is the exact proposed perimeter. In topology it should be a shared water boundary consumed by Grand Lake and by the surrounding High Cliffs hole in reverse. | High. |
| Death Canyon | Nested hazard zone inside Grand Rift | The lethal inner chasm is isolated by the deepest fractured shelves, green luminescence, and purple gas. | High at the main chasm; medium where hazardous shelves grade outward. |
| The Red Forest | Top-level geographic region / biome | The cartographic line encloses one contiguous dominant crimson canopy while the painted canopy can still feather into the shared fractured-shelf transition with Grand Rift. | Owner decision locked: Red Forest neighbors Grand Rift; it is neither nested inside nor overlapping it. |
| The Desert | Geographic region | Western and southwestern dry basins, badlands, and coast are separated from fertile lowlands by the aridity/vegetation break. River-fed oasis corridors remain continuous through it. | Medium at the Riverlands transition; high at coast and rift walls. |
| The Peninsula | Geographic landform / macro region | The long south-central landform is separated at its northern neck, with coastline defining the remaining perimeter. Port Arcadia remains at its southern crescent. | High at coast; owner review required at the northern neck. |
| Magic-Torn Wasteland | Geographic region / hazard biome | The northeastern violet fault field is enclosed by the visible reality-damage front while its shielded city remains inside. | High where fractures and anomalies are strongest; medium at the Riverlands transition. |
| Unknown Southeast | Reserved geographic region | The intentionally charcoal-gray, cloud-veiled southeast is given a crisp western/northern segmentation edge without inventing ecology, settlements, factions, or hazards. | Deliberately artificial clarity. Canon remains unknown. |

## Named cities and settlements shown

| Name | Type | Placement / treatment | Canon note |
| --- | --- | --- | --- |
| Port Arcadia | Major port city | Crescent city at the southern tip of the Peninsula; labeled and marked in Output A. | Established proper name and position. |
| The Floating City | Major city | Suspended directly above/beside Grand Lake; labeled in Output A. | Descriptive canonical title; final proper name remains unresolved in Codex lore. |
| Ignit Island | Starting/tutorial island and inhabited local scene | The nearer island immediately southwest of Port Arcadia; labeled in Output A. | Owner-confirmed canonical name. “Starting Island” and “tutorial island” are functional aliases only. |
| Riverlands major city | Major city | Existing central city silhouette/glyph retained without a name label. | Proper name and controlling faction unresolved. |
| Grand Rift major city | Major city | Existing built-up rift-shelf silhouette/glyph retained without a name label. | Proper name and controlling faction unresolved. |
| Desert major city | Major city | Existing western urban silhouette/glyph retained without a name label. | Proper name and exact faction control unresolved. |
| Magic-Torn shielded city | Major city | Existing fortified city beneath the stabilizing dome retained without a name label. | Proper name and ruler unresolved. |

No new city proper names were invented.

## Major POIs and world anchors shown

- Grand Lake and its elevated shoreline.
- The High Cliffs escarpment and great waterfall feeding the central watershed.
- The Grand Rift fracture and the nested Death Canyon hazard.
- The Red Forest canopy transition.
- Port Arcadia’s crescent harbor.
- The Floating City above/beside Grand Lake.
- Ignit Island immediately southwest of Port Arcadia.
- The shielded city and controlled anomalies in the Magic-Torn Wasteland.
- The cloud-veiled Unknown Southeast as reserved future-facing territory.

## Integration notes

- Do not point the protected artwork route or `StoryMap.artVersion` at either candidate before owner approval.
- If approved, register a new immutable art version; do not overwrite `martino-world:v1`.
- Trace topology against Output B, not Output A. Labels, glyphs, and leader lines are presentation only.
- Keep the current canonical `100000 × 66667` top-left coordinate extent unless approval testing proves a reason to change it. Recalibrate placements visually against V2; matching pixel dimensions do not imply identical feature coordinates.
- Store Grand Lake’s shoreline and every neighbor-to-neighbor line once as shared topology, then consume it in forward/reverse order from adjacent areas.
- Treat Death Canyon as a nested geographic region inside Grand Rift. Treat Red Forest as a neighboring top-level geographic region that consumes one exact shared transition with Grand Rift; it must not overlap Grand Rift or Death Canyon.
- Preserve Codex entry slugs and references; art approval creates no duplicate lore records.
