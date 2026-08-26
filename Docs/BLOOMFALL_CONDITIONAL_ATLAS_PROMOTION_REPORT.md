# Bloomfall Reach — conditional Atlas alignment promotion report

Status: **LIVE**

Date: 2026-08-26

Scope: promote the two conditional base alignments Prompt D authored in development into the production Atlas. Geometry and its editorial condition metadata only. No route was designed, reclassified, or given runtime behaviour.

## 1. Release identity

| | |
| --- | --- |
| Branch | `main` |
| Starting HEAD | `8e8a7ffed21f7456042fdf2be981700f99b07da6` |
| Release commit | `fcf12c41fd2b0b372304d93149b21be0356abdfe` |
| Build used for the promotion | `IW5raOZXYMFu-CuwMcqKE` |
| Worktree at release | clean; the promoter refuses a dirty tree |

## 2. Backup

Taken immediately before the first production write, and not reused from the Codex promotion earlier in the day.

```text
path       N:\The Habitat\backups\database\habitat-bloomfall-conditional-atlas-20260826-174336.dump
bytes      20,336,488
written    2026-08-26T17:43:38-04:00
sha256     bdfa273e9f9b30ab61d6da445f8ea3306a0db4e1a1a94c85abebde2158f4cd73
verify     pg_restore --list exit 0, 746 TOC entries, dbname habitat
```

## 3. Production before-state

```text
baseline fingerprint  f40977b125023538325a813bcb76941637721afb68a673cf6fbeb3be165fb583
storyEntries 240   maps 4   worldConnections 27   connectionPaths 11   arcs 13
Bloomfall local paths          2   (Riverlands road, Ocean sea approach)
Bloomfall local topology       8 nodes / 10 boundaries / 3 rings / 12 refs / 18 placements
world topology                 19 nodes / 26 boundaries / 11 rings
scene art                      martino-bloomfall-reach v3, martino-world v3
```

## 4. Candidate 1 — Cairnwood to Glassroot expedition trail

```text
key             cairnwood-glassroot-expedition-trail
source          cairnwood-camp        destination  glassroot-observatory      via  none
semantic type   TRAIL                 classification  CONDITIONAL
path id         6ac67c99-7f1f-5de0-8b6a-a167704f8508
connection id   b81a9bb3-5436-5f7b-a146-33ea6046a4d0
scene           martino-bloomfall-reach
vertices        9   minZoom 0.8   maxZoom none   priority 42
geometry sha    60c80be021bc043582c87b65c6f208c4394d6e9e7fadf7b4a2a7288ed1d756a1
route sha       966d6f520f4889ca…  (source, destination, scene, type, class, geometry)
condition owner MUTATION_BELT_ROUTE_STATE
dependencies    ESSENCE_SATURATION, BLOOMSTORMS, HARVESTING_PRESSURE, ABERRANTS
```

**Visual alignment — PASS.** Reviewed at full resolution over the served V3 raster. It starts on the Cairnwood settlement edge, runs east through the woodland band along the cleared terraced ground the art actually draws, passes below the greenhouse block and north of the ruined structures, stays above the marsh waterline throughout, and terminates on the domed observatory. Endpoints are coordinate-exact to both POI placements. Smooth bends, no zig-zags, no structure crossings.

**Canon alignment — PASS.** The live Codex already describes it: Cairnwood names "the conditional trail to Glassroot Observatory", the Mutation Belt dossier says "the surveyed trail to Glassroot Observatory is real", and the travel dossier lists it among the three conditional lines. No new lore was required or written.

**Decision: ACCEPT_FOR_PRODUCTION.**

## 5. Candidate 2 — Southreach reserve and service alignment

```text
key             southreach-service-rail-alignment
source          reserve-vault-twelve  destination  crown-break   via  southreach-complex
semantic type   OTHER                 classification  CONDITIONAL
path id         244ddbaf-6f6b-59b3-9cbb-1a0c8d617f5a
connection id   ccb96d19-721a-58b6-b94f-a017847b79a6
scene           martino-bloomfall-reach
vertices        9   minZoom 1   maxZoom none   priority 40
geometry sha    260ef0c3edb6ea0ee2ed3f80aa0312b8f4eba85b89ebc55e66ebd2e91d7cc809
route sha       4926545187503cab…
condition owner SOUTHREACH_REACTOR_CONTROLLER
dependencies    ESSENCE_SATURATION, REACTOR_CYCLES, BLOOMSTORMS, ABERRANTS
```

**Visual alignment — PASS, after correcting an early read.** At map scale the eastern leg appears to cross the circular settling basins, and I nearly rejected it on that basis. At full resolution it does not: the line runs along the berm north of the tank field and then over the open ash flats between the basin clusters, passing above their rims rather than through any interior. The western leg converges onto the elevated causeway the art draws and arrives at Southreach where that causeway does. All three anchors — Vault 12, the Southreach stacks, and the Crown Break vent crater — are coordinate-exact, including the declared `via`.

**No duplication.** The preserved Riverlands road terminates at Southreach Complex from the south-west; this alignment runs east–west across the top. They share exactly one node and no segment, which is what the route manifest intended.

**Canon alignment — PASS.** Reserve Vault Twelve names "the conditional Southreach service alignment", Crown Break is described as a navigated landmark, Southreach Complex carried freight and logistics, and the travel dossier lists "the Southreach service spine".

**Decision: ACCEPT_FOR_PRODUCTION.**

## 6. Acceptance summary

```text
ACCEPTED_FOR_PRODUCTION   2
KEPT_DEVELOPMENT_ONLY     0
REJECTED                  0
```

Each gate was evaluated independently per route: canon support, V3 visual alignment, endpoint logic, geometry validity, condition classification, topology conflict, route duplication, dynamic-route misrepresentation. All pass for both.

## 7. Tooling and rehearsal

No production-safe path promotion entrypoint existed — the Prompt D route author is hard-gated to `habitat_atlas_dev` — so one was built first and committed through the normal release flow before any production write.

It was then rehearsed against a disposable clone of production (`habitat_bloomfall_v3_rehearsal_atlas_g`, restored from a fresh `pg_dump` of `habitat`): dry run READY with zero writes, apply promoted 2 → 4 paths, both preserved alignments hashed identical before and after, a second run reported `ALREADY_APPLIED` with zero mutations, and every path matched development on geometry and render properties. The clone was dropped before the production release.

## 8. Dry run and promotion

```text
dry run     READY, writes 0, planned mutations 2
gates       canonical database URL, production mode, owner token, release-specific
            token, exact HEAD, exact build ID, fresh verified backup, baseline
            fingerprint, scene art v3, both routes absent, dynamic and deferred
            candidates still unpersisted

promotion   APPLIED, mutations 2
            created connections  b81a9bb3…, ccb96d19…
            created paths        6ac67c99…, 244ddbaf…
            Bloomfall local paths 2 -> 4
            connectionPaths       11 -> 13
            worldConnections      27 -> 29
            after fingerprint     3ab9fba5d82d3afc45af7012b6b5431bb42b466d629bc950e3d5cc2b2866f75d
            runtime condition logic 0, art changes 0, topology changes 0
```

## 9. Existing paths unchanged

```text
riverlands-ashline-corridor      e44319339df39f39…  identical before and after
drowned-intake-ocean-approach    013098b8a69cf266…  identical before and after
```

Production now matches development exactly on geometry, type, minZoom, maxZoom, priority and vertex count for all four alignments.

## 10. Hard gates

```text
Bloomfall local paths                 4
duplicate path geometry               0
dynamic routes persisted              0 of 5
deferred routes persisted             0 of 3
Bloomfall to Magic-Torn connections   0
Bloomfall to Magic-Torn paths         0
world topology                        19 nodes / 26 boundaries / 11 rings  (unchanged)
Bloomfall local topology              8 / 10 / 3 / 12 refs                  (unchanged)
POI placements                        18                                    (unchanged)
scene art                             v3          world art  v3             (unchanged)
```

## 11. Rendering

The Atlas projection served by production carries all four paths with correct endpoints, types and zoom gating, and `counts.connectionPaths` reads 4. The renderer adds a styled feature for every projection path with no filtering by class, so both new alignments draw in the existing route visual language: `TRAIL` uses the established dashed trail stroke, `OTHER` the default dashed route stroke. No colour, weight, or style was invented, and the "Authored routes" control renders.

The interactive canvas itself could not be screenshotted: headless Chromium's renderer and network service crash on the OpenLayers map in this environment, while rendering every static Codex page fine. What is verified is the data contract the renderer consumes and the renderer code path that consumes it, not a pixel capture of the canvas.

## 12. Codex parity

The travel dossier's route table reports exactly 4 `Persisted alignment` cells and 8 `Not persisted`, with all twelve candidates listed and their classifications unchanged. Adjacency-only wording for the Magic-Torn border is intact, and nothing claims runtime opening or closing.

## 13. QA

Authenticated production pages, measured in headless Chromium at both viewports.

| Page | Desktop 1500 × 900 | Mobile 390 × 844 |
| --- | --- | --- |
| Bloomfall Travel Conditions | overflow 0 | overflow 0, table scrolls in its own box |
| Cairnwood Camp | overflow 0 | overflow 0 |
| Glassroot Observatory | overflow 0 | overflow 0 |
| Reserve Vault Twelve | overflow 0 | overflow 0 |
| Crown Break | overflow 0 | overflow 0 |

All five carry their fact ribbon and breadcrumb trail, and all link into the Atlas.

## 14. Two honest notes

**A deploy restart was owed and initially missed.** Rebuilding `.next` for the release commit while `HabitatWeb` was still running replaced chunk files underneath the live process, which produced `ChunkLoadError` entries in the production error log. This is the same self-inflicted pattern noted in the Codex promotion report, and the fix is the same: restart the service so it runs the build on disk. That restart was performed and health re-verified.

**Editorial metadata on the two pre-existing connections still differs between environments.** Prompt D wrote `routeKey` and `routeClass` onto the Riverlands and Ocean connections in development; production has them null. This release deliberately did not touch those records, because modifying the already-persisted alignments is out of scope. Nothing user-facing depends on it — the Codex reads classification from the reviewed manifest, not from connection metadata — so it is recorded here rather than fixed by widening this release.

Two POI dossiers, Glassroot Observatory and Crown Break, do not name the travel dossier in their own prose. Both already carried system links before the Codex integration and are reached inbound through system region notes. Changing Codex prose is out of scope here.

## 15. Rollback

Not used. Available, narrowest first:

1. Delete the two promoted paths and their connections — the promoter already does exactly this on a mid-run failure.
2. Restore either record from its audited Atlas revision.
3. Roll the application build back.
4. Restore the verified backup named above.

## 16. Final decision

`BLOOMFALL_CONDITIONAL_ATLAS_ALIGNMENTS_LIVE`
