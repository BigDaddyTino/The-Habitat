# Bloomfall Reach Normalized Visual Prompt Set

Status: **Prompt 4 generation record - development only**  
Generation mode: built-in Codex image generation (`imagegen`)  
Output policy: image generation produced source candidates; deterministic Sharp processing normalized final dimensions and built the topology-masked world composite.

## Reference set

- `apps/web/private/codex-art/regions/stormglass-quarry.jpg` - grounded industrial scale and contained cyan Essence.
- `apps/web/private/codex-art/regions/riftwood-interior.jpg` - Martino mature dark-fantasy contrast; used mainly to avoid conflating Bloomfall with purple Magic-Torn anomalies.
- `apps/web/private/codex-art/regions/the-peninsula.jpg` - grounded coastal atmosphere and material realism.
- `apps/web/private/codex-art/maps/candidates/martino-world-map-v2-clean-production-candidate.png` - controlling world raster for the regional edit source.
- `Docs/BLOOMFALL_REACH_VISUAL_BIBLE.md` - shared consistency rules derived during the Tier 1 review.

## Shared constraints

Apply to every prompt unless overridden: AAA cinematic realism; grounded near-future magitech; mature industrial and ecological horror; charcoal concrete, wet oxidized steel, dull brass, bruised vegetation, black water, physically sourced cyan/storm-blue Essence; believable architecture, anatomy, scale, gravity, drainage, and weather. No text, typography, labels, iconography, borders, legends, UI, brands, watermarks, wizard towers, parchment fantasy, steampunk, cyberpunk neon, generic nuclear imagery, uniform toxic green, excessive purple, random tentacles, glossy plastic panels, or unresolved-canon answers.

## 1. World Atlas regional patch source

**Primary request:** Edit the supplied Martino world raster as a label-free illustrated terrain map. Preserve the established coastline, camera, relief, palette, and all surrounding regions. Inside Bloomfall's southeast only, show a coherent north-to-south story: colossal broken Southreach reserve/refinery/gridworks on the northern industrial shelf; warped former countryside and energy-seeking glassroot ecology through the center; black-water distributary marsh, luminous root filtration, flooded intake remnants, and absorbed contamination before the southern coast. It must look native to the existing map, with no border or pasted-tile seam.

**Implementation constraint:** The generated full-world source is not authoritative. Only bytes selected by the exact locked topology mask enter the aligned RGBA patch and deterministic composite.

## 2. Bloomfall Codex hero

**Primary request:** Elevated wide view across one enormous region, looking from the southern Living Marsh toward the northern Southreach Complex. Foreground: black reflective water, immense functional filter roots, restrained luminous organisms. Midground: recognizable roads, farms, pylons, and woodland reorganized into the Mutation Belt. Background: monumental shattered containment rings, reserve towers, railworks, and controlled Essence vapor. Beautiful, threatening, geographically legible, and not merely an explosion.

## 3. Shattercore environment

**Primary request:** Human-scale expedition view through the failed Southreach industrial district: damaged reserve banks, service rail, thick containment structures, exposed armored conduits, vitrified ground, cold cyan venting, and isolated systems still cycling. Include very small explorers or a sealed utility vehicle for scale. Make every pipe and bridge structurally plausible and preserve the original facility logic.

## 4. Southreach Complex exterior

**Primary request:** Hero exterior of the Southreach Strategic Essence Reserve, Refinery, and Gridworks before ruin overwhelms function. Show a national-scale campus of reserve banks, refining towers, segmented containment rings, switching yards, freight approaches, heavy conduits, and partly active damaged systems. The viewer should understand storage, refinement, grid dispatch, and catastrophic failure from the architecture alone.

## 5. Southreach reactor/core interior

**Primary request:** Deep interior of a gigantic containment chamber with broken segmented rings, service catwalks, exposed Essence buses, armored piping, amber emergency lamps, and a cold cyan active core system. Some machinery still performs obsolete cycles. Mature aftermath may be suggested with restrained old casualties and machine-organic accretion where energy and condensate meet, but do not show the disaster's true cause.

## 6. Mutation Belt

**Primary request:** Wide former agricultural and utility landscape transformed by functional adaptation: broken road, drainage ditch, farm/grid remnants, mineral-root thickets following energy gradients, vegetation armoring or storing charge, several habitat-adapted animals, and distant charged weather that still obeys physical law. The environment should appear to reorganize itself without becoming a fantasy jungle or random mutation collage.

## 7. Living Marsh day

**Primary request:** Low daylight wetland with flat, believable hydrology: black reflective channels, peat shelves, enormous braided filtration roots, microbial and fungal beds, calm luminous pools visible in overcast light, and warped flooded industrial remnants. Show contaminated flow being separated and stored by an ecosystem performing a function. Avoid ornamental terraces, fantasy waterfalls, and generic southern swamp imagery.

**Revision note:** The first candidate was replaced because repeated waterfall terraces made the hydrology decorative and implausible.

## 8. Living Marsh night

**Primary request:** The same functional marsh language at night: deep fog, black water crossed by restrained luminous channels, clustered Spore Lantern Colonies, cyan Essence captured in roots and fungal filters, faint ambiguous animal silhouettes, and a navigable but dangerous water passage. Make it irresistibly beautiful and immediately unsafe, with no central creature or intelligence revealed.

## 9. The Bellwether

**Primary request:** Hero encounter with the named Blackbloom Hart Aberrant in the Mutation Belt. Build a biologically credible, herd-commanding cervid whose mineral antler array senses or redistributes Essence and visibly changes the posture and movement of nearby ordinary herd animals. Large but supportable scale, frightening awareness without humanization, distinct host-specific adaptations rather than a generic mutant deer.

## 10. Switchmother

**Primary request:** Machine-organic Aberrant integrated into Splicefield Substation. Her biological mass must structurally use transformer housings, busbars, ceramic insulators, buried cables, and switching frames to route power, sense intrusion, and move attached defensive organisms. The substation remains readable around her. Avoid a freestanding flesh robot, decorative cable tangles, or meaningless machinery.

## 11. Marsh-intelligence ambiguity

**Primary request:** Wide observational moment in the Living Marsh where separate root beds, filter colonies, and channels appear to coordinate: one zone closes, organisms sacrifice a contaminated bed, and another channel opens to redirect the flow. Show the pattern through simultaneous physical responses, never a face, god, brain, telepathy effect, or central organism. The only conclusion should be, "That cannot be coincidence."

## 12. Flora and resource sheet

**Primary request:** Premium unlabeled in-world scientific concept sheet on a dark neutral field with six clearly separated material specimens: translucent Reserve Glass; dense engineered Gridcore Alloy; braided living Sinkroot Fiber; glossy Blackweir Resin; charged biological Capacitor Tissue; and Quietwater Culture in a sealed sample vessel. Add restrained Stormglass and contained Essence context. Leave clean spacing for later programmatic labels; generate no fake text.

## 13. Bloomstorm

**Primary request:** Severe biological/environmental Essence escalation sweeping across the Mutation Belt: charged mist and rain, rapid plant response along energized structures, mineral roots opening, ordinary affected wildlife seeking cover, visibility collapsing, and infrastructure lighting under load. Keep gravity and reality intact. Do not feature a named Aberrant or imply a canonical Bellwether connection.

**Revision note:** The first candidate was rejected because it centered a Bellwether-like figure and accidentally implied a specific event relationship.

## 14. Expedition ensemble

**Primary request:** Five-person Bloomfall field team moving through the region as a practical equipment study: Meridian ecologist, Warden, NDD security role, salvage specialist, and local guide. Use sealed masks or obscured identities, layered field protection, sample tools, rugged magitech instruments, insulated packs, and distinct role silhouettes. People must feel vulnerable to the environment. These are generic roles, not definitive portraits of named characters.

## 15. Local Atlas master

**Primary request:** Strict top-down illustrated regional Atlas terrain master, no labels or symbols, 3:2 composition. Northern terrain: complex facility footprint, containment circles, reserve structures, freight and service network. Center: irregular former countryside, road/grid remnants, altered woods, drainage, herd clearings. South: branching marsh channels, root islands, pools, flooded intake, and stable coast. Make the subregions interlock through believable relief and flow; provide enough separated landmarks and negative space for fifteen later POIs, three future polygons, label anchors, roads, expedition corridors, and shallow-draft channels.

**Revision note:** The first candidate was replaced because an oblique camera reduced traceability. The selected source uses a much stricter overhead read. Prompt 4 intentionally adds no coordinates, polygons, anchors, or route vectors.

## Selection record

- Approved visual assets: 15.
- Revised first-pass candidates retained for audit: Living Marsh day and local Atlas.
- Rejected first-pass candidate retained for audit: Bloomstorm.
- Deferred assets: 0.
- Named-character portraits: 0; expedition appearances remain provisional.
