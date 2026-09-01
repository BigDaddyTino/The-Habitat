# Bloomfall Reach Visual V2 Prompt Set

Status: reproducibility record for the owner-review candidate set. These prompts do not authorize production activation.

## Generation mode

- Tooling: built-in image generation.
- Method: fresh generation per asset; no V1 Bloomfall image was used as a style reference.
- Native output retained: 1536 x 1024 for the two Atlas rasters and 1672 x 941 for the 13 cinematic/concept assets.
- Post-generation treatment: file copy, hashing, comparisons, review overlays, and lossless crops only. No simple upscale, synthetic sharpening pass, or content-altering image script.
- Selection gate: native-resolution inspection plus the ten-category QA rubric in `Docs/BLOOMFALL_REACH_VISUAL_BIBLE_V2.md`.

## Clean references

References were assigned by function, not mixed indiscriminately.

- `apps/web/private/codex-art/bloomfall/v2/references/world-topology-clean-guide.png`: locked world shells plus unchanged Port Arcadia and Ignit Island anchor support; geometry only.
- `apps/web/private/codex-art/bloomfall/v2/references/local-atlas-canonical-placement-guide.png`: three local subregions, 15 POIs, and two routes; placement only.
- `apps/web/private/codex-art/systems/environment.jpg`: broad terrain realism and atmospheric scale.
- `apps/web/private/codex-art/regions/stormglass-quarry.jpg`: functional industrial scale and contained cyan light.
- `apps/web/private/codex-art/regions/the-peninsula.jpg`: grounded coast, water, weather, and material realism.
- `apps/web/private/codex-art/regions/forward-camp-kestrel.jpg`: rugged field logistics, practical equipment, and human vulnerability.

The legacy world raster and all V1 Bloomfall rasters were used only in forensic OLD/NEW evidence. They were excluded from the selected world iteration 3 and from all scene style conditioning.

## Shared positive prompt

Apply to all scene prompts unless the asset overrides it:

> AAA cinematic photorealism; mature rugged near-future industrial/ecological horror; physically motivated light; believable scale, gravity, anatomy, hydrology, architecture, joints, access, routing, and weather. Use charcoal concrete, oxidized steel, black containment ceramic, dull brass/copper, wet terrain, practical textiles, and restrained host-specific storm-blue Essence only inside plausible vessels, conduits, instruments, mineral tissue, roots, fungi, or organs. Detail must resolve into recognizable materials at native pixels.

## Shared negative prompt

> No universal magic strands, baked Atlas boundaries, texture smearing, fake microdetail, meaningless industrial geometry, neon-everywhere corruption, pseudo-text, generic AI fantasy composition, glossy black spaghetti, cyan pods, decorative cable/root tangles, floating rings, unsupported machinery, duplicated anatomy, fused hands or tools, purple Bloomfall language, labels, letters, numerals, icons, legends, logos, UI, brands, watermark, or unresolved-canon answers.

## 1. World Atlas — selected iteration 3

References: world topology/anchor guide and clean environment terrain art.

> Transform the flat guide into an unlabeled premium realistic 3:2 orthographic terrain Atlas while matching its pixel-space mainland silhouette, region placement and scale, Grand Lake, long Peninsula, separate Ignit Island, and Port Arcadia/Ignit anchors. Convert guide fields to: west Desert; coherent Grand Rift with nested Death Canyon; contiguous Red Forest; High Cliffs around Grand Lake; central Riverlands with one major river and three to five clear tributaries; localized Magic-Torn volcanic anomalies in the northeast; Bloomfall's industrial-to-marsh gradient in the southeast; forested Peninsula and compact Port Arcadia at its tip; inhabited Ignit Island southwest. Remove every guide line and locator dot. Use broad landforms, sparse destination-connected roads, real drainage, natural canopy, readable settlements, and calm negative space. No border, route, contour, reticulated crack/road network, etched line web, radial city lattice, or ambiguous miniature scribble.

Iteration record:

- iteration 1: `V2_REVISE`; topology broadly aligned, but 100% review found inherited reticulated roads/fissures and fake miniature detail;
- iteration 2: `V2_REVISE`; clean surface, but mainland framing and Ignit anchor support were not tight enough;
- iteration 3: `V2_APPROVED_CANDIDATE`.

## 2. Bloomfall Codex hero

References: clean terrain, coast, and industrial material art.

> Wide coastal approach to Bloomfall Reach. Foreground: black-water distributary marsh with real peat, reeds, roots, remnant concrete, and navigable channels. Midground: former roads, fields, drains, woods, and pylons visibly altered by localized host-specific adaptation. Background: the broken Southreach/Shattercore industrial shelf connected by real transport and utility corridors. Let geography tell the north-to-south causal story; restrained overcast light and only localized contained cyan.

## 3. Shattercore environment

References: Stormglass Quarry and Forward Camp Kestrel.

> Ground-level entry into the broken Southreach reserve/refinery/gridworks. A connected rail and service road lead toward a shattered but load-bearing containment complex. Show concrete fracture, supported pipe galleries, reserve-bank mass, rubble, vehicles, and people at believable scale. One localized storm-blue leak emerges from a specific breach. No floating ring, arbitrary pipe forest, cyan rubble filler, or collapsed pseudo-engineering.

## 4. Southreach Complex exterior

References: Stormglass Quarry and clean logistics art.

> Elevated facility overview with clearly separated intake, process blocks, reserve vessels, cooling, switching yard, freight handling, roads, and service access. Every pipe, bus, gantry, rail, road, and support must enter a meaningful system. Weathered concrete and oxidized metal dominate; contained cyan appears only inside reserve vessels/instrumentation.

## 5. Southreach Complex interior

References: Stormglass Quarry and practical human-scale logistics art.

> Interior containment hall with a central reserve vessel, supported galleries, stairs, guardrails, bulkheads, terminated pipe runs, emergency lighting, and a localized wall breach where Blackbloom has adapted to concrete/steel. Preserve access and load paths. No universal organic cabling, free-floating machinery, or cyan-coated chamber.

## 6. Mutation Belt environment — selected iteration 2

References: clean environment and industrial terrain art.

> Recognizable former countryside: connected road, fields, fences, drainage, woodland, pylons, substation, and a small coherent herd. Add localized adaptations with distinct functions: mineral-bark vascular change on one tree, a root bridging a drain, charge-storage reed bladders near infrastructure, and restrained animal adaptation. The ecology must remain legible before the mutation.

Iteration 1 was `V2_REVISE` because its realism passed but the adaptation was too subtle to read. Iteration 2 is selected.

## 7. Living Marsh day

References: The Peninsula coast and clean environment art.

> Low overcast daylight in a flat distributary marsh: black reflective channels, peat shelves, reeds, fungi, microbial beds, large braided filtration roots, flooded concrete remnants, and a practical shallow-draft skiff. Show contaminated flow being separated and stored through physical water and biological processes. No waterfall terraces, ornamental channels, or glowing ground net.

## 8. Living Marsh night

References: grounded coastal/night material reference.

> The same functional marsh language at night with deep fog, black navigable water, sparse source-based fungal colonies, and one localized cyan precipitation/filtration pool. Keep bark, reeds, water, peat, and silhouettes readable in darkness. Beautiful and unsafe, but no universal glow, luminous eggs, central organism, or confirmed intelligence.

## 9. Bellwether — selected iteration 3

Reference: The Peninsula for natural light and wet terrain; anatomy-first written constraints.

> Wildlife-documentary realism in a flooded former agricultural plain. One mature red-deer stag is shown full body with exactly four clearly separated weight-bearing limbs, correct cervid joints/muscles, normal cloven hooves, real wet fur, one head, two ears, and a coherent left/right antler rack attached continuously to skull pedicles. Add only narrow matte stormglass/mineral lamination inside several antler tines and small reinforcement at the bases; no body plates or random growth. Four ordinary anatomically correct deer behind it respond to its posture. Include connected road and distant practical grid/industrial silhouettes.

Iteration record:

- iteration 1: `V2_REVISE`; overall design passed but the hoof crop was ambiguous;
- iteration 2: `V2_REJECTED`; improved limb readability but introduced slab antlers, luminous cracks, and random neck growths;
- iteration 3: `V2_APPROVED_CANDIDATE`.

## 10. Switchmother — selected iteration 2

References: Stormglass Quarry and clean environment art.

> A huge recognizable biological quadrupedal Monstrosity structurally integrated into Splicefield Substation. Show one continuous load-bearing body, readable head/limbs/feet, anchoring pads, charge-storage organs, and one separate small symbiotic defensive organism sheltered beside the anchoring bay. Route a limited number of interfaces into real transformer housings, busbars, ceramic insulators, and switching frames. The substation remains readable. Horrifying because the locomotion, anchoring, and power-routing logic make sense.

Iteration 1 was `V2_REJECTED` because it read as a freestanding robot rather than an integrated biological Monstrosity. Iteration 2 is selected.

## 11. Marsh coordination

References: clean marsh and coast material art.

> Wide observational marsh scene in which three separate systems respond at once: one root zone closes a contaminated channel, one pale fungal/filter bed is visibly sacrificed, and another channel opens to redirect flow. Communicate coordination through physical water level, root pressure, filter color, and channel movement only. No connecting light, face, brain, god, telepathy, or central organism. Consciousness must remain unresolved.

## 12. Flora/resource sheet

Reference: clean industrial material art.

> Premium unlabeled material study on a neutral dark field. Exactly six separated resource specimens: translucent Reserve Glass, dense engineered Gridcore Alloy, braided living Sinkroot Fiber, glossy Blackweir Resin, charged biological Capacitor Tissue, and Quietwater Culture sealed in glass. Distinguish glass, metal, fiber, resin, tissue, and culture at native pixels. Two neutral unmarked scale/label fixtures may sit below the resources; they are not specimens. Leave spacing and generate zero text.

## 13. Bloomstorm

References: clean environment and grounded infrastructure art.

> Severe charged rain and wind moving across the Mutation Belt. Different systems react according to physics: trees bend, reeds shed water/particulate, drains surge, switchgear arcs under load, a vehicle uses practical lights, and ordinary wildlife seeks cover. Keep gravity/reality intact and cyan localized to real electrical/biological sources. No named Aberrant or implied Bellwether event.

## 14. Expedition ensemble

Reference: Forward Camp Kestrel.

> Exactly five generic masked Bloomfall field roles moving together: Meridian ecologist, Warden, NDD security, salvage specialist, and local guide. Give each a distinct silhouette, sealed field protection, correct hands and grips, practical sample/tool load, insulated packs, and rugged instruments. Full bodies visible; identities provisional; no named-character portraits. People look vulnerable to the marsh and distant Southreach infrastructure.

## 15. Local Bloomfall Atlas

References: exact local placement guide plus clean environment/coast/industrial art.

> Strict top-down unlabeled 3:2 regional terrain. Preserve the guide's three subregion fields and provide real geography beneath all fixed points and routes: Shattercore industrial shelf in the north; recognizable road/grid/farm/wood/drainage terrain in the Mutation Belt center; branching flat marsh, root islands, pools, Drowned Intake and stable coast in the south. Support the Riverlands road and ocean approach without baking either line. Remove all guide polygons, points, routes and markers. No icons, borders, labels, contour mesh, radial lattice, or pseudo-detail.

## Selected outputs

The exact source filenames, selected iteration numbers, dimensions, hashes, scores, and retained revise/reject history are authoritative in:

`apps/web/private/codex-art/bloomfall/v2/bloomfall-visual-v2-manifest.json`
