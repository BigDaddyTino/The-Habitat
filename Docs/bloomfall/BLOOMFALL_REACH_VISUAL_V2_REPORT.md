# Bloomfall Reach Visual V2 Final Report

Date: 2026-08-25

Release state: owner-review candidate only; production remains paused.

## 1. Visual forensic audit

The audit inspected the controlling world raster, V1 Bloomfall patch/composite, local master and runtime, and all 13 V1 cinematic/concept candidates at full/native pixels.

- Prior controlling world raster: `apps/web/private/codex-art/maps/candidates/martino-world-map-v2-clean-production-candidate.png`, 1536 x 1024, SHA-256 `427bf4967afa8a96afa2175d5aed261225cf7fbeed17944be527f4616b5713b6`.
- V1 Bloomfall composite: 1536 x 1024, SHA-256 `23e271db896ebed25d83ebbf98a15507c11090c8966a358bec02d560020788ce`.
- V1 local "master": 3072 x 2048, SHA-256 `508852179b0375c0c2fe8712b99fd77f6062f04ea7834a5d4a67eb4f4bcb9cfe`; forensic decoding proved it is a Lanczos 2x enlargement of a 1536 x 1024 source.
- V1 local runtime: 1536 x 1024, SHA-256 `af4be2ed7269260cdfffde582e9a2470944ca8dbedb9ac0e0908e430807ad046`; decoded pixels match the native V1 source.
- V1 scenes: 13 selected 1600 x 900 files derived from 1672 x 941 sources; every scene fell below 8 in at least one critical category.

Forensic separation:

- Intentional canon visual: the north-to-south industrial/Belt/marsh sequence, Southreach scale, limited Essence containment, Blackbloom adaptation, filtration ecology, expedition vulnerability, and broad camera intent.
- Generation artifact: malformed anatomy and hands, unsupported pipes/catwalks, meaningless machine fragments, smeared animals/vegetation, fused tools, and indistinct background structures.
- Boundary-era artifact: bright or glossy strand networks tracing terrain and material edges across unrelated regions and hosts; exact causation cannot be proven from pixels, but the repeated propagation pattern is global.
- Overused stylistic motif: black wet filaments surrounding cyan/amber pods or crystals, repeated storm/refinery composition, and one specular surface language applied to steel, bark, mud, hide, and cable.
- Low-detail generation issue: repeated stipple, loops, splinters, and miniature scribbles posing as roads, settlements, foliage, machinery, or organisms.

Per-asset V1 finding matrix:

| V1 asset | Intentional canon/composition retained | Decisive native-pixel defects | Lowest score / disposition |
|---|---|---|---|
| World raster + Bloomfall patch | Overall layout, coast/island placement, regional sequence | Global baked boundaries; filament/road/fissure web; radial pseudo-cities; etched ocean; material and scale collapse; Bloomfall patch repeats the same surface language | FAIL / `V1_SUPERSEDED_CANDIDATE` |
| Bloomfall hero | Marsh/Belt/industrial depth order and coastal viewpoint | Pod-trunks, cyan lattice, terrain-wide glossy filaments, fake vegetation microdetail | 2 / `V1_SUPERSEDED_CANDIDATE` |
| Shattercore | Rail-led entry, reserve mass, broken containment, person/vehicle scale | Unterminated pipes, unsupported structure, cyan rubble filler, detail collapse | 4 / `V1_SUPERSEDED_CANDIDATE` |
| Southreach exterior | Facility overview, reserve/switchyard/freight massing | Pipe forest, floating ring logic, incoherent transformers/gantries, pseudo-engineering | 4 / `V1_SUPERSEDED_CANDIDATE` |
| Southreach interior | Radial chamber, central vessel, service access, human scale | Universal organic cabling, fused catwalks, excessive cyan, unreadable maintenance/load paths | 3 / `V1_SUPERSEDED_CANDIDATE` |
| Mutation Belt | Road, former managed land, drainage/fence idea, herd, industrial source | Repeated glowing cord-trees, decorative rather than functional adaptation, smeared animals/fields | 2 / `V1_SUPERSEDED_CANDIDATE` |
| Living Marsh day | Distributary water, boat/bridge scale, low horizon | Continuous string-net groundcover, crystalline tree pylons, indistinct reeds/peat/fungi, ornamental hydrology | 2 / `V1_SUPERSEDED_CANDIDATE` |
| Living Marsh night | Dark-water navigation and localized-light intent | Amber egg/pod repetition, cord saturation, crushed blacks, unreadable filtration ecology | 2 / `V1_SUPERSEDED_CANDIDATE` |
| Bellwether | Central Hart, herd response, wet habitat, industrial background | Melted glass-loop antlers, decorative veins, malformed/duplicated animals, no clear adaptive function | 2 / `V1_SUPERSEDED_CANDIDATE` |
| Switchmother | Organism/substation integration premise and human scale | Prohibited flesh-blob-plus-cables read; no anatomy, anchoring, locomotion, routing, or charge-storage logic | 2 / `V1_SUPERSEDED_CANDIDATE` |
| Marsh coordination | Multiple beds, water routing, observer scale, no face | Giant luminous network and repeated cores overstate a central intelligence; repeated strand motif | 2 / `V1_SUPERSEDED_CANDIDATE` |
| Flora/resources | Unlabeled tabletop study and strongest close-range rendering | Ambiguous organ/bundle forms and repeated cyan cracking/veining across unlike materials | 4 / `V1_SUPERSEDED_CANDIDATE` |
| Bloomstorm | Storm-front composition, road/vehicle anchor, wildlife/facility response intent | Tsunami-like overprocessing; every host reacts through the same filaments/crystals; smeared wildlife | 2 / `V1_SUPERSEDED_CANDIDATE` |
| Expedition | Five-person briefing, provisional masked identity, Southreach context | Unreliable hands/tool contacts, meaningless map/tablet detail, fused straps/buckles, caricatured guide | 3 / `V1_SUPERSEDED_CANDIDATE` |
| Local Atlas master/runtime | 3:2 north/center/south composition and broad hydrology | Repeated loops, smeared terrain, decorative rail/road filaments, radial lattices, weak POI distinction; false 3K master is a simple 2x resize | FAIL / `V1_SUPERSEDED_CANDIDATE` |

V1 remains intact and is recorded as 15 historical `V1_SUPERSEDED_CANDIDATE` assets.

## 2. World Atlas decision

`WORLD_ATLAS_FULL_VISUAL_REMASTER_REQUIRED`

The locked Bloomfall mask covers only 154,055 of 1,572,864 pixels (9.79%). Native-pixel inspection found the same line-web, fake-microdetail, material-collapse, and baked-boundary drift in the Desert, Riverlands, Red Forest, Grand Rift, Magic-Torn Wasteland, Peninsula, ocean, and islands. A Bloomfall-only patch would preserve the defect in 90.21% of the raster.

## 3. World Atlas V2

- Master candidate: `apps/web/private/codex-art/bloomfall/v2/candidates/martino-world-map-v3-visual-remaster-candidate.png`
- Inactive runtime candidate: `apps/web/private/codex-art/bloomfall/v2/runtime/martino-world-map-v3-runtime-candidate.png`
- Native/final/runtime resolution: 1536 x 1024
- Candidate/runtime SHA-256: `e011b6c0ac7033af22b39cfcfc2004c3c2631b6efd7bf8e9f54d2d4614ee95cd`
- Derivation: runtime is a byte-identical native-resolution copy; no upscale.
- Selected generation: iteration 3, generated from the locked topology-and-anchor guide and clean terrain reference, without a legacy raster reference.
- QA: minimum 8.7, average 9.01.

Topology overlay: `apps/web/private/codex-art/bloomfall/v2/evidence/overlays/world-topology-alignment-review.png`. The overlay aligns the Desert, Grand Rift/Death Canyon, Red Forest, High Cliffs/Grand Lake, Riverlands, Magic-Torn Wasteland, Bloomfall Reach, and Peninsula with natural geographic transitions; Port Arcadia and Ignit Island anchors are visibly supported. The raster contains no baked vector boundaries, labels, route lines, icons, or locator dots. The selected iteration replaces the former reticulated microtexture with identifiable rivers, roads, canopy, fields, marsh channels, structures, ridges, and volcanic features.

## 4. Bloomfall world patch

Not used / not applicable; no surgical patch was produced. The full-remaster gate made a masked Bloomfall-only composite the wrong scope. V1 mask/patch/composite artifacts remain preserved and unchanged for history.

## 5. Local Bloomfall Atlas V2

- Master candidate: `apps/web/private/codex-art/bloomfall/v2/candidates/local-atlas-master-v2.png`
- Inactive runtime candidate: `apps/web/private/codex-art/bloomfall/v2/runtime/local-atlas-runtime-v2-candidate.png`
- Native/final/runtime resolution: 1536 x 1024
- Candidate/runtime SHA-256: `05ab8a522e298823a30edf8072eb9d998b2cbefd11c949c451df9544c401744d`
- QA: minimum 8.5, average 8.89.

Alignment evidence: `apps/web/private/codex-art/bloomfall/v2/evidence/overlays/local-topology-poi-route-alignment-review.png`. Exactly three subregion polygons align to the northern industrial shelf, central altered countryside, and southern marsh/coast. All 15 fixed POIs land on plausible facility, road, field, woodland, marsh, intake, pool, or coastal features. The Riverlands road and ocean sea route align to visible corridors. The overlay is review-only; none of its polygons, points, routes, labels, or icons is baked into the raster.

## 6. Bloomfall hero V2

`candidates/bloomfall-codex-hero-v2.png`, 1672 x 941, SHA-256 `779e28053a74ed8d008accaacffe3f2f29fa1513a7a3f8da152014fe3258c983`; minimum 8.8, average 9.15. Marsh foreground, altered countryside, and Southreach/Shattercore background form a coherent geographic story with real water, roads, pylons, and facility depth rather than decorative strands.

## 7. Shattercore V2

`candidates/shattercore-environment-v2.png`, 1672 x 941, SHA-256 `b24a8499ce8dfa5d9ac0e49cd8e7ef22d05f8a4695dacc620322629c4ed502b2`; minimum 8.8, average 9.10. Rail, service road, concrete mass, supported pipe galleries, rubble, vehicles, and localized containment breach remain readable at 100%.

## 8. Southreach exterior V2

`candidates/southreach-complex-exterior-v2.png`, 1672 x 941, SHA-256 `3d8dee3cb48bffa9f9c3ff6271483aa5ab0db66656c451daa8892dfc96a829e6`; minimum 8.7, average 8.98. Process blocks, reserve vessels, cooling, switchyard, freight, roads, supports, and pipe routing form one practical campus.

## 9. Southreach interior V2

`candidates/southreach-reactor-interior-v2.png`, 1672 x 941, SHA-256 `42a9626b6070c5cadeccd61b251565ae79a22ca88fed377d8ccb6f883937a027`; minimum 8.7, average 8.97. The containment vessel, galleries, guardrails, bulkheads, pipe runs, human scale, and localized material breach replace the V1 cable-coated chamber.

## 10. Mutation Belt V2

`candidates/mutation-belt-environment-v2.png`, 1672 x 941, SHA-256 `f03a0153877aeaec2db25f3fb968ea270a6795f4bd4cf2450567e5071d4bd98c`; minimum 8.6, average 8.91. Selected iteration 2 keeps road, field, fence, drainage, woodland, herd, and grid legible while making tree, root, reed, and animal adaptations host-specific.

## 11. Living Marsh day V2

`candidates/living-marsh-day-v2.png`, 1672 x 941, SHA-256 `68b0194a57466042a2d8f1c4c6f89c89b370f8092689089bffbf98d128f8c94d`; minimum 9.0, average 9.16. Native crops resolve flat water, peat, reeds, fungi, braided roots, concrete remnants, and skiff scale with functional filtration and no ornamental waterfalls.

## 12. Living Marsh night V2

`candidates/living-marsh-night-v2.png`, 1672 x 941, SHA-256 `3b209b6496a41ce26d53ea2c53e837725537f962be32522f3981092a6eed29d6`; minimum 8.7, average 9.07. Sparse source-based fungi and one localized precipitation pool light real water and vegetation; the night retains detail without universal glow.

## 13. Bellwether V2

`candidates/bellwether-v2.png`, 1672 x 941, SHA-256 `72279ee1fae3cd0c510123b2b28729b4e77289070cfb71765d52a729dca9b0e0`; minimum 8.7, average 8.99. Iteration 3 passes native anatomy QA: one cervid body, exactly four separated weight-bearing limbs, correct joint chain, readable cloven hooves, real muscle/fur, continuous skull-mounted antlers, restrained localized mineral lamination, and four coherent ordinary herd animals. There are no duplicated limbs, random body growths, luminous crack webs, or floating antler pieces.

## 14. Switchmother V2

`candidates/switchmother-v2.png`, 1672 x 941, SHA-256 `28d7579682acfdb14dea79305ff633a38c1e946d65ff93762268e0ecf40455cc`; minimum 8.6, average 8.85. Selected iteration 2 reads as one biological quadrupedal Monstrosity with weight-bearing anatomy, anchoring, routed interfaces, charge-storage logic, and real transformers/busbars/insulators. One separate small secondary organism is sheltered beside the anchoring bay; neither a defensive function nor physical attachment is inferred from the still image. The image avoids the rejected freestanding-robot design and arbitrary cable tangle.

## 15. Marsh coordination V2

`candidates/marsh-coordination-v2.png`, 1672 x 941, SHA-256 `d8437a490ec275eb12e3beaf922ce8c5ec94a5aea843e791afdbec1b38c2281b`; minimum 8.6, average 8.94. Separate root closure, pale sacrificial filter bed, and open diversion channel imply coordination only through simultaneous physical response. Consciousness remains unresolved: no brain, face, god, telepathy effect, connecting light, or central organism is shown.

## 16. Flora/resources V2

`candidates/flora-resource-sheet-v2.png`, 1672 x 941, SHA-256 `ba2d8657dd297822112b76647e70a3a139f2c02cdcd59dd568b44f5acb843b90`; minimum 9.0, average 9.23. Exactly six separated resource specimens present distinct glass, alloy, living fiber, resin, tissue, and culture surfaces. The two blank metal bars along the bottom are inert scale/label fixtures, not additional resources. The sheet contains no generated text, fake logo, or duplicated specimen.

## 17. Bloomstorm V2

`candidates/bloomstorm-v2.png`, 1672 x 941, SHA-256 `ba782eb00e46fef33ed58c415f4546ace0f7fc128bc7b89d65b7f495d76f9509`; minimum 8.7, average 9.06. Wind, rain, drainage, vegetation, substation load, vehicle lighting, and ordinary wildlife have differentiated physical responses. No named Aberrant or Bellwether connection is implied.

## 18. Expedition V2

`candidates/expedition-ensemble-v2.png`, 1672 x 941, SHA-256 `5a71d887fb343b176b228bbd2715c09052be413066fbce19aa6035a118a36c10`; minimum 8.8, average 8.99. Exactly five masked generic roles have separated full-body silhouettes, coherent limbs, gloves, grips, tools, packs, protective clothing, and practical field equipment. No named face is canonized.

## 19. Artifact comparison

Primary defects removed relative to V1:

- all-over glossy black filament and cyan/amber pod language;
- baked world boundary lines and repeated contour/vein networks;
- global reticulated fake roads, fissures, and miniature scribble-detail;
- steel/bark/mud/hide/cable material collapse;
- arbitrary pipes, floating rings, fused catwalks, and meaningless machinery;
- smeared trees, wildlife, settlements, and distant structures;
- malformed creature anatomy, ambiguous hooves, duplicated background animals, and unreliable human/tool contacts;
- omnipresent glow and purple/cyan overpainting;
- repeated storm-refinery composition standing in for regional specificity;
- visible certainty where marsh intelligence must remain ambiguous.

All 15 OLD/NEW comparisons are under `apps/web/private/codex-art/bloomfall/v2/evidence/comparisons/`.

## 20. V2 visual bible

`Docs/BLOOMFALL_REACH_VISUAL_BIBLE_V2.md`

It includes the required `PROHIBITED VISUAL DRIFT` section, Blackbloom host/material rules, the Seven-Phase distinction, Atlas raster/vector separation, clean-reference policy, resolution truth, and QA/release gates.

## 21. V2 manifest

`apps/web/private/codex-art/bloomfall/v2/bloomfall-visual-v2-manifest.json`

Counts: approved `15`; revised `4`; rejected `2`; V1 superseded `15`. Every asset records ID, V2/source filename, native/final dimensions, SHA-256, generation method, status, iteration, canon/artifact/realism QA, all ten scores, notes, and inactive runtime metadata where applicable.

| Asset | AAA | Mat | Detail | Physical | Martino | Canon | Clean | Comp | Light | Story |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| world-atlas | 8.9 | 9.0 | 8.7 | 9.1 | 8.9 | 9.3 | 9.2 | 9.1 | 8.9 | 9.0 |
| bloomfall-hero | 9.2 | 9.1 | 8.8 | 9.0 | 9.2 | 9.3 | 9.1 | 9.4 | 9.1 | 9.3 |
| shattercore | 9.1 | 9.2 | 8.8 | 9.0 | 9.1 | 9.2 | 9.0 | 9.3 | 9.0 | 9.3 |
| southreach-exterior | 9.0 | 9.1 | 8.7 | 8.9 | 9.0 | 9.1 | 8.9 | 9.2 | 8.8 | 9.1 |
| southreach-interior | 8.9 | 9.1 | 8.7 | 8.9 | 9.0 | 9.0 | 8.8 | 9.1 | 9.2 | 9.0 |
| mutation-belt | 8.9 | 8.8 | 8.6 | 8.9 | 9.0 | 9.2 | 8.9 | 9.0 | 8.7 | 9.1 |
| living-marsh-day | 9.2 | 9.1 | 9.0 | 9.2 | 9.2 | 9.3 | 9.3 | 9.1 | 9.0 | 9.2 |
| living-marsh-night | 9.0 | 9.0 | 8.7 | 9.0 | 9.1 | 9.2 | 9.1 | 9.2 | 9.3 | 9.1 |
| bellwether | 9.0 | 9.1 | 8.8 | 9.2 | 8.7 | 9.1 | 9.4 | 9.0 | 8.8 | 8.8 |
| switchmother | 8.7 | 8.8 | 8.6 | 8.7 | 9.0 | 9.0 | 8.8 | 9.0 | 8.8 | 9.1 |
| marsh-coordination | 8.8 | 8.8 | 8.7 | 9.1 | 9.0 | 9.3 | 9.2 | 8.9 | 8.6 | 9.0 |
| flora-resources | 9.3 | 9.4 | 9.2 | 9.1 | 9.0 | 9.4 | 9.4 | 9.3 | 9.2 | 9.0 |
| bloomstorm | 9.0 | 9.0 | 8.7 | 9.1 | 9.0 | 9.2 | 9.1 | 9.1 | 9.3 | 9.1 |
| expedition-ensemble | 8.9 | 9.0 | 8.8 | 8.9 | 9.0 | 9.3 | 9.0 | 9.2 | 8.8 | 9.0 |
| local-atlas | 8.8 | 8.8 | 8.5 | 9.0 | 8.9 | 9.2 | 9.1 | 9.1 | 8.6 | 8.9 |

All scores pass the 8.0 hard floor. Flagship 9+ is a target and is not claimed universally; selected minimums range from 8.5 to 9.0.

## 22. Review gallery

`apps/web/private/codex-art/bloomfall/v2/review/index.html`

The loopback/static gallery contains all 15 OLD/NEW pairs, real aspect ratios, direct native-resolution links, comparison evidence, 100%-pixel crops, world/local alignment overlays, contact sheet, manifest link, and a prominent production-pause notice.

Browser QA passed at desktop and a 390 x 844 mobile override: 15 cards, 15 comparison pairs, zero broken images, 84 resolved links, correct two-column desktop/one-column mobile comparison layout, visible pause state, and zero horizontal overflow. All 50 native preview images use lazy loading and asynchronous decoding so the mobile page does not front-load the full package. The browser pass caught and corrected a long gate-token wrap defect before finalization.

## 23. Close-up QA

Twenty lossless native-pixel crops are under `apps/web/private/codex-art/bloomfall/v2/evidence/crops/`.

- Architecture/industrial: Shattercore rail and containment, Southreach exterior process/switchyard, Southreach interior vessel/pipes, and Switchmother grid interfaces resolve into recognizable systems.
- Vegetation/water: world Riverlands/Bloomfall, local north/center/south, hero marsh, day/night marsh, and Bloomstorm crops retain distinct canopy, fields, reeds, fungi, peat, drainage, channels, and coast.
- Creature anatomy: Bellwether head/antlers and four limbs/hooves pass; Switchmother body/feet/anchoring remain coherent.
- Materials: the six specimen surfaces remain distinct without pseudo-text.
- Human/equipment: expedition left/right crops show coherent limbs, gloves, grips, radio, case, shield, cable, cutters, probe, packs, and protective clothing.

## 24. Code/data preservation

- `StoryEntry changes = 0`
- `database changes = 0`
- `topology changes = 0`
- `POI coordinate changes = 0`
- `route changes = 0`
- `campaign changes = 0`

All world/local overlays consume the existing locked data read-only. No canonical lore, names, IDs, coordinates, polygons, routes, search, navigation, React behavior, or campaign content was changed.

## 25. Production safety

- `production writes = 0`
- `production art activation = 0`
- `production Atlas changes = 0`
- `production migrations = 0`
- `production configuration changes = 0`
- `production Codex changes = 0`

Prompt 6 was not run. Production remains paused. Both V2 runtime files are inactive private candidates. Owner approval is required before any release prompt is regenerated with final V2 hashes.

## 26. Git state

This phase adds only V2 visual sources/candidates/runtime candidates, comparisons/crops/overlays/contact sheet/gallery/manifest, three visual documentation files, the build-status note, and one deterministic V2 image-evidence utility. No application or runtime logic was changed by this phase. The pre-existing dirty worktree from Prompts 1-5B was preserved; no reset, clean, revert, commit, or overwrite of V1 was performed.

## 27. Final decision

`BLOOMFALL_VISUAL_V2_READY_FOR_OWNER_REVIEW`

This is an owner-review decision, not production approval or activation.
