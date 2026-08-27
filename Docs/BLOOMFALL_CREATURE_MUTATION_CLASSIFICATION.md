# Bloomfall Creature/Race Codex Enhancement and Adaptive Mutation Classification

Status: Prompt B development authoring complete; runtime and image production deferred

Target: guarded local `habitat_atlas_dev` only

Source of truth: `apps/web/lib/bloomfall-creature-enhancements.ts` (design specification: anatomy, triggers, systems coupling, visual continuity, image direction) and `apps/web/lib/bloomfall-creature-field-guide.ts` (the reader copy the dossier body prints — specimen, field notes, each mutation with the abilities it grants and its counter, and why to hunt it). Since 2026-08-26 the stored dossier body is rendered from the field guide; the specification fields stay in source for the simulation and for image prompting and are no longer printed.

Bloomfall now has a bounded ecology-first rule set:

`REACTOR -> ESSENCE -> ENVIRONMENT -> LIFE -> PLAYER INTERFERENCE -> CONSEQUENCES`

Adaptive Mutation is a species eligibility decision inside that chain. It is not a universal creature buff, a synonym for Blackbloom exposure, or a substitute for Seven-Phase Corruption.

## 1. Creature/Race audit

The live development Codex contains twelve Bloomfall creature records and one additional living entity requiring a classification decision. All thirteen were audited and enhanced.

| Surface | Existing kind | Parent/category | Audit decision |
|---|---|---|---|
| Blackbloom Hart | Creature | Beasts / Natural | Adaptive species |
| Rootback Grazer | Creature | Beasts / Natural | Adaptive species |
| Glasswing Kite | Creature | Beasts / Natural | Fixed regional specialization |
| Mirejaw | Creature | Beasts / Natural | Adaptive species |
| Sump Eel | Creature | Beasts / Natural | Adaptive species |
| Spore Lantern Colony | Creature | Beasts / Natural | Fixed symbiosis; physiological load states |
| Latchhound | Creature | Beasts / Natural | Adaptive species |
| Bloommarked Remnant | Creature | Human / Natural | Case-specific Human field classification |
| The Bellwether | Creature | Beasts / Natural | Named exceptional Aberrant |
| Switchmother | Creature | Monstrosities / Monstrosity | Named exceptional Aberrant |
| Old Drowner | Creature | Beasts / Natural | Named exceptional Aberrant |
| The Last Shift | Creature | Human / Natural | Named exceptional collective |
| Maintenance Unit M-17 “Mender” | Character | No creature parent | Unique corrupted maintenance entity |

The existing parent-race surfaces remain authoritative: Beasts, Human under Humanoid, and Monstrosities. No Bloomfall-specific race was invented. Jaro Fen, Keira Voss, Mara Quill, Nalia Reed, Selene Ward, and Tomas Venn remain ordinary authored Human characters; the Codex provides no evidence for species-level Adaptive Mutation eligibility, so they were not given mutation ladders.

Living ecological records were also checked. Walking Orchard, Heartfen, and Blackweir correctly remain Regions/ecosystems. Quietwater Culture, Sinkroot Fiber, Blackweir Resin, and Capacitor Tissue correctly remain Items/resources. None was misfiled as a creature merely to receive mutation metadata.

## 2. Enhanced Codex result

Every target now explains distribution, diet and ecological role, interspecies relationships, flora/absorption interaction, Bloomstorm behavior, reactor relationship, eligibility rationale, state mechanics, encounter function, reversibility, persistence, promotion, harvest consequences, and future image direction. The prose is stored in the development Codex and generated from a reviewable typed manifest.

The enhancement deliberately separates four concepts:

- fixed regional anatomy;
- reversible physiological/exposure response;
- bounded species-level Adaptive Mutation;
- unique exceptional Aberrants or entity mechanics.

## 3. Adaptive Mutation classification matrix

| Entity | Classification | Eligibility | States | Promotion |
|---|---|---:|---:|---|
| Blackbloom Hart | `ADVANCED_ADAPTIVE` | Advanced | 4 | Yes |
| Rootback Grazer | `FUNCTIONAL_ADAPTIVE` | Functional | 3 | No |
| Glasswing Kite | `NONE` | None | 1 fixed form | No |
| Mirejaw | `FUNCTIONAL_ADAPTIVE` | Functional | 3 | Yes |
| Sump Eel | `MINOR_ADAPTIVE` | Minor | 2 | No |
| Spore Lantern Colony | `NONE` | None | 1 fixed form | No |
| Latchhound | `ADVANCED_ADAPTIVE` | Advanced | 4 | Yes |
| Bloommarked Remnant | `NONE` | None | 1 case phenotype | No |
| The Bellwether | `EXCEPTIONAL_ABERRANT` | Underlying Hart: Advanced | 1 unique form | Already named canon |
| Switchmother | `EXCEPTIONAL_ABERRANT` | None | 1 unique form | Already named canon |
| Old Drowner | `EXCEPTIONAL_ABERRANT` | None/unresolved lineage | 1 unique form | Already named canon |
| The Last Shift | `EXCEPTIONAL_ABERRANT` | None | 1 unique collective | Already named canon |
| Mender | `NONE` | None | 1 unique chassis | Not an Aberrant pipeline |

## 4. Non-adaptive decisions

- Glasswing Kites already have a strong fixed warning/scavenger niche. Injuries and overload do not create a staged morphology.
- Spore Lantern brightness, dormancy, warning pulses, and spore release are reversible physiology governed by water chemistry and Marsh Absorption.
- Bloommarked Remnant is not a species. A generic escalation ladder would erase identity, turn uncertain personhood into loot progression, and conflate Blackbloom with Corruption.
- Mender integrates material according to corrupted work priorities. That is `CORRUPTED_MAINTENANCE_INTEGRATION`, not biological adaptation.
- Switchmother, Old Drowner, and The Last Shift are singular histories. Their named exceptional status does not establish an ordinary reusable lineage.

## 5. Advanced adaptive species

Blackbloom Hart teaches environmental anticipation, migration, grounding, and herd-level consequence. Latchhound teaches powered-terrain response, finite combat stress imprints, pack coordination, and persistent survivor threats. Both have four readable states but preserve anatomy and counterplay. Neither gains arbitrary elemental powers or unlimited forms.

## 6. Species-specific mutation states

| Species | State progression | Frequency ceiling |
|---|---|---|
| Blackbloom Hart | Gradient-Sensing Hart -> Charge-Raised -> Grounded Crown -> Storm-Tuned Relay | Rare |
| Rootback Grazer | Carried-Mat Grazer -> Root-Clamped -> Bastion-Back | Uncommon |
| Mirejaw | Flow-Reader -> Silt-Veiled -> Weir-Plated | Uncommon |
| Sump Eel | Sump Scavenger -> Deep-Charge | Uncommon |
| Latchhound | Corridor Latcher -> Live-Latched -> Circuit Stalker -> Pack Relay | Rare |

The arrows describe authored state order, not automatic linear leveling. Acute exposed states can regress; structural adapted states persist for the encounter or individual. Rare Bloom-evolved states require accumulated ecology and weighted spawn rules.

## 7. Combat-driven adaptation

Combat is one possible stress source and never the sole progression engine. The allowed families are finite:

| Species | Allowed families | Constraint |
|---|---|---|
| Hart | Electrical, Defensive, Mobility | At most one supported imprint on a promoted survivor |
| Rootback | Defensive, Toxic/Environmental | Species states only; no survivor promotion |
| Mirejaw | Physical, Toxic/Environmental, Defensive | At most one supported imprint on a promoted survivor |
| Latchhound | Electrical, Physical, Thermal, Mobility | At most one supported imprint on a promoted survivor |
| Sump Eel and all `NONE` entities | None | Damage can wound, displace, or kill; it cannot mint a family |

No Arcane or Predatory family is currently assigned. That absence is intentional scope control, not an invitation to fill every category.

## 8. Environmental adaptation

An eligible mutation evaluation requires a species, a qualifying accumulated exposure history, the local saturation/terrain context, and a state-specific trigger. Reactor labels cannot mutate wildlife remotely. Venting, Restart, Purge, Overflow, or Breach matter only after the regional simulation transfers their pressure into the creature’s current cell through air, water, mineral, root, or infrastructure connections.

## 9. Bloomstorm behavior

| Entity | Primary behavior |
|---|---|
| Hart | Warns, migrates, then grounds stored charge; eligible individuals may adapt |
| Rootback | Migrates if warned; otherwise anchors and shelters its carried ecology |
| Glasswing | Warns, climbs/migrates, avoids Peak, feeds in Aftermath |
| Mirejaw | Shelters under root shelves; hunts displaced prey in Decay |
| Sump Eel | Moves along charged runoff in Decay/Aftermath |
| Lantern Colony | Dims or becomes dormant through Peak; may release stored load |
| Latchhound | Shelters in powered structure and hunts along energized routes |
| Remnant | Case-specific; no universal storm buff |
| Named entities/Mender | Follow their authored hydrology, grid, procedure, or work-order rules |

## 10. Saturation tolerance

| Tolerance | Entities |
|---|---|
| Moderate | Spore Lantern Colony |
| High | Hart, Rootback, Glasswing, Mirejaw |
| Extreme | Sump Eel, Latchhound, Bellwether, Switchmother, Old Drowner, Last Shift, Mender |
| Variable | Bloommarked Remnant |

Tolerance is survival capacity, not mutation eligibility. Glasswings and Mender demonstrate why those axes must remain separate.

## 11. Ecological network

Hart movement forecasts pressure and distributes seed. Rootbacks expose browse, carry soil, and reseed filtration patches. Latchhounds read Hart routes and powered corridors. Sump Eels remove conductive residue and feed Mirejaws. Mirejaws engineer channel pressure and predator boundaries. Lantern Colonies bind trace material and signal water change. Removing one node changes warning capacity, prey availability, filtration, migration, or infrastructure risk; harvest never exists as a consequence-free loot reset.

Bellwether shifts migration signaling, Switchmother routes biological-industrial charge, Old Drowner reshapes hydrology, Last Shift repeats industrial procedure, and Mender changes systems by “repairing” them. Their consequences operate through the same regional graph while preserving unique mechanics.

## 12. Aberrant escalation

Only Hart, Mirejaw, and Latchhound can currently enter the persistent promoted-survivor model. Promotion requires an eligible structural state, a meaningful survived encounter, sufficient exposure, an open regional cap, and a recognizable authored profile. Rootback, Sump Eel, fixed species, Human cases, and unique entities are excluded for ecological, legibility, or ethical reasons.

## 13. Named Aberrants

- The Bellwether stays a single final Hart-lineage regional threat. The approved V3 hero remains authoritative and is compared with the new Hart baseline rather than an invented five-form gallery.
- Switchmother stays a single Monstrosity/grid integration. Her approved final V3 hero is reused; one engineered-origin structural reference may clarify provenance.
- Old Drowner stays a unique Beasts-lineage hydrological engineer. Its exact ancestral species remains unresolved; future art must label the comparison as a probable-lineage reconstruction.
- The Last Shift stays a unique Human-origin collective with unresolved consciousness. Current and pre-disaster images must preserve worker, equipment, and workplace continuity without resolving personhood.

## 14. Mender

Maintenance Unit M-17 remains a Character/entity, not a Creature or race. Its persistent work orders, integrated parts, repaired systems, and corrupted priorities may change its chassis and behavior, but those changes are authored repair history. Mender gets no saturation ladder, combat mutation family, or Aberrant promotion roll.

## 15. Image requirement matrix

| Entity | New references | New heroes | Existing reuse | Priority |
|---|---:|---:|---|---|
| Hart | 4 | 1 | — | P0 |
| Rootback | 3 | 0 | — | P1 |
| Glasswing | 0 | 1 | — | P2 |
| Mirejaw | 3 | 0 | — | P1 |
| Sump Eel | 2 | 0 | — | P2 |
| Lantern Colony | 0 | 1 | Living Marsh environment support | P2 |
| Latchhound | 4 | 1 | — | P0 |
| Remnant | 0 | 1 | — | P3 |
| Bellwether | 0 | 0 | V3 hero + Hart baseline comparison | P0 |
| Switchmother | 1 | 0 | V3 hero | P1 |
| Old Drowner | 1 | 1 | — | P1 |
| Last Shift | 1 | 1 | Southreach environment support only | P0 |
| Mender | 0 | 1 | Environment support only | P2 |

## 16. Total image workload

Twenty-seven new images are proposed: P0 12, P1 9, P2 5, P3 1. Two owner-approved V3 final heroes are reused. No image was generated in Prompt B. Matched state references should be produced as continuity sheets before heroes; Prompt C should stop at each priority gate for review.

## 17. Races/Creature Codex UI requirements

The future page should display base taxonomy separately from mutation classification; a compact eligibility/status summary; state tabs or a comparison strip; frequency, trigger, reversibility, persistence, and system bindings; Bloomstorm/tolerance badges; promotion eligibility; ecology/harvest consequences; and a gallery that distinguishes reference sheets from final heroes. `NONE` pages should show a single canonical form and explicitly explain why ordinary behavior or physiology is not mutation.

The current UI only has Category, Habitats, Threat, prose, and V3 hero resolution. Prompt B therefore improves development Codex prose without pretending structured state UI already exists.

## 18. Data architecture

Current `StoryCreatureMeta` has category, parent, biomes, threat, harvest, game ID, open questions, and optional visual art. It has no mutation-state contract. Adding unvalidated keys would be rejected by the exact schema and would create a false runtime promise.

Before runtime or state UI work, add cross-package domain types in `packages/shared` for classification, eligibility, aberrant status, tolerance, state frequency, combat families, triggers, persistence, promotion, and image references. Then extend the metadata schema through an explicit migration/backfill, add validation, and update the UI. Population/runtime state should live in a simulation-owned store rather than overloading canonical Codex metadata.

## 19. Development content changes

- Added a typed 13-record enhancement manifest and deterministic Codex renderer.
- Added manifest tests for coverage, taxonomy, classification, states, promotion, bounded combat families, and exact image workload.
- Added guarded development-only preview/apply tooling with revision authorship and body-only mutation.
- Added an independent development audit.
- Applied enhanced bodies to 13 records in `habitat_atlas_dev`, then corrected one Mender canon-name typo through the same audited path; summaries, kinds, taxonomy metadata, visual art, statuses, and schema were preserved.

## 20. Validation/audit

The independent audit passes: 13/13 records exact, no broken prose links, five ordinary adaptive species, four exceptional named Aberrants, promotion limited to Hart/Latchhound/Mirejaw, no Abomination taxonomy conflation, exact 27-image workload, and existing `StoryCreatureMeta` preserved. Strict TypeScript and manifest unit tests pass.

## 21. Production safety

Production writes: zero. The apply path resolves only `HABITAT_ENVIRONMENT=development`, rewrites only to loopback `habitat_atlas_dev`, independently checks the database identity, requires the Atlas authoring guard and an explicit confirmation token, uses a serializable transaction, rejects unrecognized body drift, and writes audited StoryRevision records. No runtime system, database schema, production data, or images were changed.

## 22. Owner decisions

No decision blocks Prompt B. Before implementation of persistent world threats, the owner must approve:

1. named-threat population caps per subregion and whether caps are global or per species;
2. whether nonlethal resolution can permanently retire/relocate a promoted survivor alongside death;
3. Last Shift and Bloommarked Remnant combat/harvest policies wherever personhood is unresolved;
4. whether Old Drowner’s base lineage should remain permanently uncertain or be canonically identified later;
5. the P0 art continuity sheets before any later-priority image batch begins.

## 23. Prompt C recommendation

Prompt C should be **Bloomfall Creature Visual Systems and Codex State UI — P0 Review Gate**. It should generate only the matched Hart and Latchhound four-state reference sheets, their two ecological heroes, and the two Last Shift continuity images (12 total); compare Bellwether against the approved Hart baseline using the existing V3 hero; verify silhouette locks, mature tone, scale markers, state readability, filenames/manifests, and Codex gallery behavior; then stop for owner approval before P1. It must not build runtime mutation logic or expand the taxonomy.

This recommendation is planning only. Prompt C has not been executed.
