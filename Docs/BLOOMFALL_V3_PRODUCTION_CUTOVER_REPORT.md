# Bloomfall V3 production cutover report

Date: 2026-08-26
Prompt: 6B — Bloomfall Reach + geographic hierarchy + owner-locked V3 controlled production cutover

Supersedes the Prompt 6 `BLOOMFALL_V3_RELEASE_BLOCKED` report, which is preserved in git history
at `0cc4ddf`. That report's two blocking causes — no production activation path, and V3 art
registered nowhere — were both resolved by the release engineering phase before this cutover ran.

## Final decision

```text
BLOOMFALL_HIERARCHY_AND_V3_LIVE
```

Rollback used: **NO**. Production database, application build, and V3 publication all reached
their exact locked target state on the first attempt.

## 1. Release identity

```text
branch                main
starting HEAD         0cc4ddfb844ef20c6c22144d9dd90d805539dc66
deployed commit       0cc4ddfb844ef20c6c22144d9dd90d805539dc66
production build ID   A-OBDskg7tzOM0cTu5qRn
origin/main (pre)     0cc4ddfb844ef20c6c22144d9dd90d805539dc66
divergence (pre)      ahead 0 / behind 0
worktree at cutover   0 modified, 0 staged, 0 untracked
```

The prompt's expected HEAD, origin, and clean-worktree state were verified rather than assumed
and matched exactly. The release build was confirmed to postdate the last source-bearing commit
(`f750bca`, 21:10:05) with no `.ts`/`.tsx` file modified after the build at 21:30:52, so
`A-OBDskg7tzOM0cTu5qRn` is a faithful build of HEAD.

## 2. Deployment ordering correction

Preflight found that HabitatWeb had been running since **08:10:34** while the release build was
written at **21:30:52** the previous evening. The live process was therefore serving a build whose
Turbopack chunks had been overwritten underneath it. Production was already degraded independently
of this release:

```text
/chronicle            HTTP 500
error log             ChunkLoadError: Cannot find module
                      .next/server/chunks/ssr/node_modules__pnpm_0qgnmgg._.js
```

Per section 14 the activation gate must reflect the actually deployed build, and per section 35
application deploy must pass before player visibility. HabitatWeb was therefore restarted **before**
any database write, which is also consistent with the publication boundary: code deployment and file
presence alone do not publish the package.

```text
new PID               24216
started               2026-08-26 05:53:33
serving BUILD_ID      A-OBDskg7tzOM0cTu5qRn
```

Post-deploy the pre-existing failure cleared:

```text
/chronicle            HTTP 500 -> HTTP 200
```

HabitatWorker was left running and untouched; the release does not require it.

## 3. Production backup

A dedicated fresh pre-release dump was taken immediately before the first write using the exact
convention in `scripts/backup-habitat.ps1` (`pg_dump --format custom --compress 6`). The 04:00
nightly dump was deliberately **not** reused; it would have aged out of the two-hour freshness gate
mid-cutover.

```text
path         N:\The Habitat\backups\database\habitat-pre-bloomfall-v3-20260826-055515.dump
size         19,566,193 bytes
timestamp    2026-08-26 05:55:17
SHA-256      199aa31c99e1bd7c8ade500c4efa82c14acc40b6a38156358f86fa3e768bea72
```

Independent restore-list verification was run against the **host artifact** (copied back into the
container so the exact gated file was the one checked):

```text
pg_restore --list exit code   0
archive dbname                habitat
TOC entries                   746
TABLE DATA entries            96
StoryEntry / StoryMap present YES
```

The backup is retained and was not deleted during the release. It is the Level 4 rollback artifact.

## 4. Baseline

Captured read-only from the exact production target with the separately guarded inspector
immediately before invocation.

```text
state                 BEFORE
database              localhost:5432/habitat
baseline fingerprint  98fc74662dc0c490ee23637d737ab99a25bf79c28ddebb946448d9d8d81ebe27
```

This is an exact match to the rehearsal baseline fingerprint. Pre-release counts matched the locked
expectation precisely:

```text
StoryEntries 175   StoryMaps 3   placements 36   nodePlacements 10
topology 19 nodes / 26 boundaries / 11 rings / 43 references
worldConnections 25   connectionPaths 9   arcs 7   world Atlas art v1
placeholder  a64869df-c623-49ec-9236-dd306a3fd5c7  Unknown Southeast / unknown-southeast  CANON v1
```

All six geographic hierarchy defects were present exactly as expected.

## 5. Dry run

```text
result   READY
writes   0
mode     PRODUCTION
source   localhost:5432/habitat   target   localhost:5432/habitat
release  head 0cc4ddfb…dc66  build A-OBDskg7tzOM0cTu5qRn  backup 19,566,193 bytes
```

## 6. Activation

```text
action     ACTIVATE
status     ACTIVATED
mutations  114        (rehearsal expectation: 114)
```

Stage breakdown, in the locked dependency order:

| Order | Stage | Status | Mutations |
| ---: | --- | --- | ---: |
| 1 | rename | RENAMED | 1 |
| 2 | hierarchy repair | REPAIRED | 7 |
| 3 | canonical content / stories / semantic connections | BLOOMFALL_CANONICAL_CONTENT_APPLIED | 90 |
| 4 | local Atlas | APPLIED | 1 |
| 5 | V3 publication | ACTIVATED | 15 |

## 7. Final production fingerprint

```text
final fingerprint     c3fd0ff0a3ae73fc7b18198c717b48e579b1d764f7ae821b01fccc49741c7a40
rehearsal fingerprint c3fd0ff0a3ae73fc7b18198c717b48e579b1d764f7ae821b01fccc49741c7a40
match                 EXACT
revisions             1227   (rehearsal: 1227)
```

Real production converged byte-for-byte on the same logical state as two independent rehearsal
clones.

## 8. Final production counts

```text
StoryEntries     238    StoryMaps        4
placements        54    nodePlacements  10
topologyNodes     27    boundaries      36
rings             14    references      55
worldConnections  27    connectionPaths 11
arcs              13
```

Every value matches the rehearsal target exactly.

## 9. World topology remains locked

Counted per map, not as post-release totals:

```text
martino-world             19 nodes / 26 boundaries / 11 rings     UNCHANGED
martino-bloomfall-reach    8 nodes / 10 boundaries /  3 rings     additive
```

The larger 27/36/14/55 totals are world plus the additive Bloomfall local topology. No world region
was retraced.

## 10. Hierarchy repair

Production hierarchy audit after activation:

```text
database          habitat
entries audited   55
invalid parents    0
cycles             0
missing parents    0
suspicious         0
```

Final top-level regions:

| Region | Parent | Type |
| --- | --- | --- |
| Bloomfall Reach | null | region |
| The Desert | null | region |
| The Grand Rift | null | region |
| The High Cliffs | null | region |
| The Magic-Torn Wasteland | null | region |
| The Peninsula | null | region |
| The Red Forest | null | region |
| The Riverlands | null | region |

Legitimate nesting preserved:

```text
Death Canyon   -> grand-rift        Grand Lake      -> high-cliffs
Floating City  -> high-cliffs       Port Arcadia    -> the-peninsula
Shattercore    -> bloomfall-reach   Mutation Belt   -> bloomfall-reach
Living Marsh   -> bloomfall-reach   Long Graze      -> the-mutation-belt
Ignit Island (the-starting-island)   -> null  (starter progression untouched)
```

## 11. Peninsula dossier

Exactly 13 legitimate descendants, all beneath Port Arcadia:

```text
Port Arcadia
├── Arcadian Soverign Guard
├── Arcadian Special Intelligence Service
├── Census Office
├── Chancellory of Arcadia
├── Embassy Row
├── Exclusion Area
├── Lower Westside
├── The East side
├── The Northside
├── The southside
├── Upper Westside
└── Waterfront district
```

```text
unrelated world regions inside Peninsula = 0
```

Titles are reproduced exactly as they exist in the canonical database. Pre-existing spelling in
unrelated content was deliberately not corrected in this release.

## 12. Bloomfall canonical rename

```text
Unknown Southeast retired   YES
Bloomfall Reach canonical   YES
slug bloomfall-reach        YES
same StoryEntry ID          YES   a64869df-c623-49ec-9236-dd306a3fd5c7
top-level parent            YES   parent = null, type = region
status / version            CANON / v5
subregion children          the-living-marsh, the-mutation-belt, the-shattercore
```

The 21 remaining `Unknown Southeast` occurrences are all classified
`HISTORICAL_DEVELOPMENT_EVIDENCE` in `StoryRevision` rows — the preserved audit lineage, which is
correct for an in-place rename.

## 13. Stories and campaign protection

```text
total arcs after activation   13    (7 before + 6 regional Bloomfall arcs)
mainline arcs                  5    unchanged
mainline arcs modified         0
mainline Bloomfall links       0
```

All six Bloomfall arcs are non-mainline (`SIDE_QUEST`, `CONTRACT`, `WORLD_EVENT`, `FACTION_QUEST`).

```text
campaign act decided          NO       mandatory progression   NO
Tino requirement               0       Amanda requirement       0
antagonist link          unresolved    true cause         unresolved
```

## 14. World connections

```text
total semantic connections    27   (25 + 2 additive)
bloomfall-reach <-> riverlands    ROAD        BIDIRECTIONAL   ACTIVE
bloomfall-reach <-> the-ocean     SEA_ROUTE   BIDIRECTIONAL   ACTIVE
magic-torn semantic route         NONE
```

## 15. Bloomfall local Atlas

```text
scene slug     martino-bloomfall-reach
scene ID       1d8fe347-8ce8-5bc1-ae5c-6ee5dedab54f
parent         martino-world
owner          bloomfall-reach
art version    v3
topology       8 nodes / 10 boundaries / 3 rings / 12 references
placements     18   (3 subregion polygons + 15 POIs)
paths           2   (Riverlands road corridor, Ocean marsh approach)
verification   PASS
```

No REVIEW_REQUIRED or DEFER route candidate was activated. No POI coordinate was moved.

## 16. V3 visual lock — production selections

```text
V1 selected for Bloomfall release = 0
V2 selected for Bloomfall release = 0
V3 selected for release           = 15   (2 Atlas + 13 Codex)
```

Verified by resolving the art exactly as production does (`HABITAT_ENVIRONMENT=production`):

| Binding | Served file | SHA-256 | Dimensions |
| --- | --- | --- | --- |
| `martino-world:v3` | `private/codex-art/maps/martino-world-map-v3.png` | `9670a94dc80a69272648bd7cdb51795e933dc099b03d95bf05c47047ea85b62a` | 1536x1024 |
| `martino-bloomfall-reach:v3` | `private/codex-art/maps/martino-bloomfall-reach-map-v3.png` | `3a9f5517e972217a5513428544567267d29ea219ea11dcf69dd12f0aa67e6569` | 1536x1024 |

```text
martino-bloomfall-reach:v1  -> NOT SERVED IN PRODUCTION (developmentOnly, superseded)
martino-world:v1            -> still registered, available for V1 renderer rollback
```

Codex publication markers:

```text
expected markers  13
active markers    13
missing            0
wrong version      0
```

Spot-checked production Codex files (hero, Shattercore, Bellwether, Switchmother) all returned
`SHA_OK` at 1672x941. The `bloomfall-v3` directory holds exactly 13 files.

## 17. World Atlas V3 visual verification

The exact served production file was inspected, not merely hashed. All owner-approved corrections
are present:

- Floating City restored — airborne over the lake with a real underside and water shadow.
- Additional island groups restored — several distinct offshore archipelagos.
- Volcanic islands clearly represented — smoking cones, active lava flow, black basalt.
- Tropical islands clearly represented — palm canopy, beaches, turquoise reef shallows.
- Desert city restored — dense settlement with defensive works in the desert corridor.
- Magic-Torn settlement restored — fortified city beneath a visible defensive field.
- Death Canyon — lethal purple/green gas pooled inside the canyon depth.
- Port Arcadia — enlarged and clearly crescent, with harbour, docks and breakwaters.
- Bloomfall Reach — correctly represented in the south-east.
- No filament contamination; no baked region-boundary artefacts; no baked Atlas UI.

The local Atlas shows the three canonical bands — Shattercore industrial wound, Mutation Belt
countryside, Living Marsh coastal flooding — with the Drowned Intake on the sea terminus and no
baked labels.

## 18. Idempotency

The activator was re-invoked against production with the post-release baseline fingerprint:

```text
status              ALREADY_APPLIED
mutations           0
revisions added     0   (1227 before and after)
fingerprint         c3fd0ff0…c7a40   unchanged
local Atlas         PASS
publication counts  atlas 2 / codex 13 / total 15
```

## 19. Monitoring

```text
new client errors    0
new HTTP 5xx         0
new DB errors        0
asset failures       0
error log growth     0 lines since the post-deploy baseline (16111)
```

The `/chronicle` 500 present before the cutover was resolved by the deploy. Protected art routes
correctly return HTTP 404 to unauthenticated callers, which is the intended private-art behaviour
rather than a delivery fault.

Route status after activation:

```text
/                            200
/codex/bible/bloomfall-reach 307  (authentication redirect, not an error)
/codex/map?atlas=v1          307  (authentication redirect, route intact)
```

## 20. Production authoring

```text
production Atlas authoring = DISABLED
```

`HABITAT_ATLAS_AUTHORING_ENABLED` is absent from `.env`, and the authoring guard independently
refuses `HABITAT_ENVIRONMENT=production` and any URL resolving to the `habitat` database. Topology,
POI, label, and route authoring remain unavailable in production.

## 21. Rollback

```text
rollback used = NO
```

All layers remain available:

| Level | Action | Status |
| --- | --- | --- |
| 1 | Disable Bloomfall publication markers / StoryMap V3 selections | available |
| 2 | Return Atlas/Codex visual selection to prior production state | available |
| 3 | Restore previous production build and restart HabitatWeb | available |
| 4 | Restore `habitat-pre-bloomfall-v3-20260826-055515.dump` | available, verified |

The corrected hierarchy should be retained under Levels 1–3; only a full Level 4 restore would
reintroduce the known-bad hierarchy.

## 22. Verification limitation — authenticated UI QA outstanding

Every Codex and Atlas surface is authentication-gated and returns HTTP 307 to this unauthenticated
loopback session. Server-side verification was therefore performed exhaustively — database state,
production art resolution, byte-level SHA verification, route health, and error monitoring — and the
served V3 rasters were inspected directly as image files.

The following require an authenticated browser session and have **not** been executed here:

- desktop interaction QA (region selection, search, breadcrumbs, browser history);
- Bloomfall local scene drill-down, POI hover/selection, route controls;
- cross-scene Atlas search for the three subregions and 15 POIs;
- mobile 390x844 layout, overflow, and tap-target QA.

The engineering phase browser-rendered all 15 registered V3 assets at desktop and mobile viewports
with exact native dimensions and zero broken images, so asset delivery is covered. The interaction
pass above remains an owner-side confirmation step.

## 23. Source suite

The release source suite was green before deployment: 415 web tests, 3 Codex Sync tests, strict
web/shared/database/Codex Sync typechecks, Prisma validation, and web lint. Expensive source tests
were not re-run after production mutation; production-safe audits were run instead and are reported
above.

One tool was deliberately not forced: `atlas:v2:verify` resolves to the development database under
the normal environment loader, and its production mode carries separate Atlas V2 activation
authorization semantics. Section 6 forbids bypassing a gate, so it was left alone. The ground it
covers was verified directly instead — per-map world topology unchanged at 19/26/11, hierarchy audit
clean including Death Canyon containment, and the activator's own hierarchy, local Atlas, and
publication verification all passing.
