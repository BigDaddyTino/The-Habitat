# Bloomfall Reach Integration Foundation

Date: 2026-08-25
Scope: Prompt 1 discovery, development-only canonical rename, continuity audit, and later-phase implementation constraints.
Naming authority: [`BLOOMFALL_REACH_CANON.md`](./BLOOMFALL_REACH_CANON.md)

## Preserved identity and geography

The existing `REGION`/`CANON` StoryEntry was renamed in place in `habitat_atlas_dev`.

| Property | Audited result |
| --- | --- |
| StoryEntry ID | `a64869df-c623-49ec-9236-dd306a3fd5c7` |
| Old identity | `Unknown Southeast` / `unknown-southeast` |
| Current identity | `Bloomfall Reach` / `bloomfall-reach` |
| Parent | `the-peninsula` |
| Placement ID | `64b2795b-779b-4d6a-969c-a101dd17c560` |
| Label anchor | `[82031,30599]` |
| Label priority | `85` |
| Topology ring ID | `1d5af8b4-778e-587d-bc45-afced94b9ae9` |
| Boundary IDs | `ce312c5f-63be-51e8-8e4c-a5a91090fb20`, `707952fe-da65-52f1-bf25-60e7e48d56ff`, `1c994691-a4ec-568e-a0fb-dc944d06b09e` |
| Derived geometry SHA-256 | `dd0d59066cfda3ff7ddee1ccce034b105f65fd25123d9207054f110e052c3f75` |
| Fixed-point area | `652959188` square units |
| Bounds | `[65755,16276,99284,45573]` |
| Topological neighbors | Riverlands; Magic-Torn Wasteland |

Before and after the rename, the world contains 19 topology nodes, 26 boundaries, 11 rings, and 43 ordered references. The region has the same placement, ring, boundaries, polygon, area, bounds, label anchor, and neighbors. The complete lock analyzer reports zero gaps, overlaps, crossings, duplicate editable borders, orphan nodes, or unused boundaries, and zero land-partition area drift.

There were no V1 or V2 semantic world connections or authored connection paths whose endpoint was this region. No connection metadata or route geometry therefore required migration, and Prompt 1 authored no new connection.

## Canonical integration points

The current runtime and authoring sources now use the new title and slug. The seed, current topology owner metadata, V1/V2 parity keys, projection resolution, route page, audit tools, tests, and current Atlas contract were migrated. The old URL redirects to the canonical URL. Immutable V1 manifests, rehearsal/release evidence, StoryRevision rows, and deterministic topology locator fragments retain the historical value where rewriting it would falsify evidence or change stable IDs.

Player surface checks covered:

- `/codex/bible/unknown-southeast` redirecting to `/codex/bible/bloomfall-reach`;
- Atlas V2 world label, search result, selection/dossier, neighbors, and Codex target;
- the Atlas authoring workbench's region/parent/connection selectors;
- absence of the former title from the current player-facing result.

V1 remains available. Frozen V1 activation artifacts are translated at the compatibility boundary to the canonical slug; no V1 polygon was regenerated or retraced.

## Reference disposition

The final case-insensitive repository scan contains 94 former-name occurrences. Every occurrence is classified:

| Classification | Count | Disposition |
| --- | ---: | --- |
| `CANONICAL_RUNTIME_REFERENCE` | 7 | Required former-placeholder constants, guarded audit logic, and stable topology locator strings; current outputs canonicalize them |
| `PLAYER_FACING_CONTENT` | 0 | No former name remains on a current development player surface |
| `GENERATED_DERIVED_ARTIFACT` | 0 | Current generated truth uses the canonical name |
| `MIGRATION_SOURCE_ARTIFACT` | 5 | Frozen V1 manifest and comparison compatibility code preserved |
| `HISTORICAL_DEVELOPMENT_EVIDENCE` | 73 | Prior candidate/rehearsal/topology-lock evidence preserved unchanged |
| `TEST_OR_FIXTURE` | 3 | Alias and retired-slug behavior assertions retained |
| `DOCUMENTATION` | 6 | This foundation, naming authority, and build record explain the retirement |
| `STALE_OR_DEAD_REFERENCE` | 0 | None identified |

The development database has 21 matching historical revision-field paths and zero matching current canonical fields. Historical documents and revision rows are evidence, not a current naming authority. `BLOOMFALL_REACH_CANON.md` is the only naming authority.

## Martino continuity audit

### Directly reusable

- Systems: Essence, Magic, Corruption and its Seven Phases rule, Environment and Weather, Gathering & Harvest, Professions, Persistent Damage, and Lasting Wounds.
- Institutions by established function: Abomination Containment Authority and the National Defense Directorate for quarantine/containment; Aegis Extraction Consortium for extraction; Helix Arcanobiotics for magic-biotech laboratories and engineered monstrosities; Meridian Arcane Institute for magical research; Peninsula Expeditionary Army for military activity; Wardens' Guild for dangerous-creature hunts.
- Creature taxonomies: Abominations and Monstrosities are established classifications. Monstrosities already cover engineered laboratory products.
- Resources and tools: Essence, Stormglass, and the Field-Infusion Rig.
- Story infrastructure: region-linked `StoryArc` records support side quests, contracts, faction quests, incursions, and world events; companion chains use `COMPANION_QUEST` arcs plus ordered `COMPANION_MISSION` entries; Story Threads hold unsettled proposals; Codex regions and events hold local canon.
- Atlas relationships: Riverlands and Magic-Torn Wasteland are exact topology neighbors; The Peninsula is the metadata parent; the eastern and southern edge is coastal in the frozen raster.

### Potential connections, not assignments

- Stormglass Cartel could participate in artifact trade or exploitation; Verdant Marsh Clans could have relevant wetland knowledge.
- Abraham Kane, Amanda, Steve, Commander Rook, the War Correspondent, and Tino surface through relevant themes, but no current record directly ties any of them to Bloomfall Reach.
- Arcadian Devil, The Risen, natural creatures, and Dimensional Echoes may offer reusable patterns only after a canon decision.
- Veil Expeditions and Veil Incursions provide expedition/event mechanics but should not be presumed to describe this region.

### Conflict and continuity risks

- The Blackbloom must not be silently equated with the existing soul-infusion `Corruption` system or its Seven Phases.
- A future Aberrant taxonomy must not duplicate Abominations (completed corruption) or Monstrosities (engineered laboratory products).
- Bloomfall Reach needs a distinct biological/reactor-disaster identity rather than duplicating the Magic-Torn Wasteland's established reality-failure identity.
- The Living Marsh does not automatically place or grant ownership to the Verdant Marsh Clans.
- Amanda's companion arc and Tino's campaign fate are protected campaign-spine material; neither receives a regional relationship in this phase.
- Dimensional Echo is Veil-specific and should not be renamed into a generic Bloomfall material.

### New content required

No current Codex entry supplies the region detail, three subregion dossiers, pre-disaster identity, facility, disaster chronology, local POIs, Aberrant definition, corrupted flora, regional materials, residents, local factions, regional quests, or local Atlas scene. These are genuine gaps rather than permission to infer canon.

## Content gap matrix for Prompt 2

| Category | Prompt 2 responsibility |
| --- | --- |
| Region | Lock pre-Bloomfall identity, facility, chronology, present condition, and regional hierarchy |
| Subregion | Author the three approved subregion records without changing their names |
| POI | Define a bounded, evidence-linked set after facility and subregions are locked |
| System | Add local mechanics only where existing systems cannot represent them |
| Character | Create or connect people only after roles and ownership are decided |
| Creature/Aberrant | Decide taxonomy first, then create non-duplicative regional entities |
| Flora | Establish Blackbloom ecology and gameplay roles |
| Resource | Reuse Essence/Stormglass where appropriate; add only non-duplicative materials |
| Regional quest | Build expeditions, salvage, hunts, containment, investigations, rescues, disputes, survivor stories, and temporary events in existing arc/thread structures |
| Image brief | Produce an approved regional patch shot list and 16:9 Codex key-art briefs |
| Local Atlas scene | Specify scene ownership, extent, art, placements, topology, and routes before implementation |
| World connection | Propose semantic links only after travel and campaign-entry decisions are approved |

Major campaign integration remains reserved exactly as recorded in the naming canon.

## Art audit and safe later workflow

The active protected raster is `apps/web/private/codex-art/maps/candidates/martino-world-map-v2-clean-production-candidate.png`, 1536 x 1024, SHA-256 `427bf4967afa8a96afa2175d5aed261225cf7fbeed17944be527f4616b5713b6`. The `martino-world:v2` protected-art registration resolves that file. Visual inspection confirms the southeastern area is a charcoal/gray, cloud-veiled unfinished placeholder while the established regions are colored.

There is no existing deterministic region-only compositor. A later art phase should add one with these controls:

1. Rasterize the locked placement/ring/boundary topology as the sole region mask in the `100000 x 66667` fixed extent.
2. Align a 1536 x 1024 RGBA regional patch with `pixelX = coordinateX * 1536 / 100000` and `pixelY = coordinateY * 1024 / 66667`.
3. Composite only inside the mask. Any feather must be inward-only and use one recorded fixed pixel width; it must never soften across the protected coastline or a shared boundary.
4. Copy all mask-exterior pixels byte-for-byte from the frozen source and require an outside-mask diff of `changedPixels = 0` and `maxChannelDelta = 0`.
5. Preserve the exact coastline silhouette and shared vector topology. Do not use another full-map generative repaint.
6. Save a non-active candidate, patch, mask, hashes, diff report, and before/after review artifact. Activate the protected-art registry only after explicit approval.

Future outputs should include the aligned regional patch, deterministic mask, composited world candidate, exterior pixel-diff evidence, review imagery, a 1600 x 900 regional Codex key art master, any approved 16:9 subregion/POI art, and local-scene art only after its specification is locked.

## Production boundary

Prompt 1 changes only the retained development database and repository source. Production retains its deployed record and Atlas state until a separately authorized release. No production migration, data write, configuration change, art activation, or Atlas content change is part of this foundation.
