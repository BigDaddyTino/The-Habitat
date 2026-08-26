# Bloomfall Reach + Geographic Hierarchy + V3 Visual Lock — Production Cutover Report

Date: 2026-08-25
Prompt: FINAL PROMPT 6 (controlled production release)

## FINAL DECISION

```text
BLOOMFALL_V3_RELEASE_BLOCKED
```

Failed gate: **Section 16 / Stage 1 step 1 — Production Hierarchy Repair**, and by the same
root cause Sections 17, 18 and 24. Independently, Sections 22 and 39 fail on a second cause.

No production write was attempted. No production backup was required or taken, because
Section 14 scopes the backup to "immediately before the first production write" and no such
write was reached. Production is byte-for-byte unchanged.

## 1. Release identity

```text
branch            main
starting HEAD     d292b9455106914f13c33b4f513f8ebbd57b458a
origin/main       d292b9455106914f13c33b4f513f8ebbd57b458a
divergence        ahead 0 / behind 0
release commit    NOT CREATED (release blocked before deployment)
evidence commit   NOT CREATED
deployed commit   unchanged
production build  unchanged
```

Worktree preserved intact: 26 tracked modifications, 263 untracked files. Nothing reset,
cleaned, stashed or discarded.

## 2. Blocking cause A — no production activation path exists

Every Stage 1 mutation tool is hard-locked to the development database. Each resolves its
target through `resolveAtlasDevelopmentDatabaseUrl`, which returns `null` unless
`HABITAT_ENVIRONMENT=development` and then *rewrites the URL path* to `/habitat_atlas_dev`.

| Section | Required production mutation | Tool | Production path |
| --- | --- | --- | --- |
| 16 | Hierarchy repair | `repair-geographic-hierarchy.ts` | none |
| 17 | Bloomfall canonical rename | `rename-bloomfall-reach.ts` | none |
| 18 | Bloomfall canon content activation | `implement-bloomfall-reach-content.ts` | none |
| 24 | Bloomfall local Atlas promotion | `activate-bloomfall-local-atlas.ts` | none |

Reinforcing guards:

- `rename-bloomfall-reach.ts` and `implement-bloomfall-reach-content.ts` additionally
  re-assert `database === "habitat_atlas_dev"` *inside* the transaction.
- `repair-geographic-hierarchy.ts` calls `assertAtlasPersistentDevelopmentTarget(url)`.
- The confirmation token is literally `GLOBAL_REGION_HIERARCHY_DEVELOPMENT_REPAIR`.

There is no environment variable, CLI flag, or branch in any of the four that can target
`habitat`. Compare `activate-atlas-v2.ts`, which *does* implement the repository production
cutover convention (`ATLAS_V2_ACTIVATION_DATABASE_URL`, owner-authorization token, backup /
release-HEAD / build-ID preconditions). The Bloomfall and hierarchy tools were never given
the equivalent.

Reaching production would require either modifying those development-only guards or writing
a new tool that bypasses them. Section 51 states **"Do not weaken safety guards."** Both
options violate it, so the release stops here rather than forcing the write.

## 3. Blocking cause B — V3 art is not registered in any environment

`apps/web/lib/story-atlas-art.ts` holds a hardcoded registry:

```text
martino-world:v1            martino-world-map-v1.png
martino-world:v2            candidates/martino-world-map-v2-clean-production-candidate.png
martino-starting-island:v1  martino-starting-island-map-v1.png
martino-port-arcadia:v2     martino-port-arcadia-map-v2.png
martino-bloomfall-reach:v1  candidates/martino-bloomfall-reach-map-v1.png  (developmentOnly)
```

- There is **no `:v3` key** for any scene.
- The resolver serves only from `private/codex-art/maps/`; all 15 V3 files live under
  `private/codex-art/bloomfall/v3-reset/`, outside the served tree.
- `martino-bloomfall-reach:v1` is flagged `developmentOnly: true`, so the local scene is
  deliberately non-production today.
- Both databases still report `martino-world` art=`v1` and `martino-bloomfall-reach` art=`v1`.

Section 39 (V3 Codex imagery) has no binding surface either: Codex heroes in
`apps/web/lib/story-library.ts` are static `/images/...` paths, and none of the 13 cinematic
V3 assets are wired to canonical entries.

The V3 manifest agrees it was never released:

```text
decision    BLOOMFALL_VISUAL_RESET_READY_FOR_OWNER_REVIEW
publication candidateOnly=true  active=false  playerVisible=false
            productionReleasePaused=true  prompt6Run=false
```

Promoting V3 is therefore a code change (register `:v3` keys, relocate assets into the served
tree, drop `developmentOnly`, bind Codex imagery), not a release-time activation.

## 4. V3 visual lock inventory — VERIFIED AND FROZEN

Manifest: `apps/web/private/codex-art/bloomfall/v3-reset/bloomfall-visual-v3-reset-manifest.json`
All 15 assets: file present, dimensions match, SHA-256 matches. **15/15 verified, 0 failed.**

| # | Purpose | Filename | Dimensions | SHA-256 |
| ---: | --- | --- | --- | --- |
| 1 | Corrected world Atlas | martino-world-map-v3-reset-candidate.png | 1536x1024 | `9670a94dc80a69272648bd7cdb51795e933dc099b03d95bf05c47047ea85b62a` |
| 2 | Bloomfall Reach hero | bloomfall-hero-v3-reset.png | 1672x941 | `8750634e8c515ae2dc71bb87d3ff372e2dfc2247f844b41fa9de5c06497a8eae` |
| 3 | Shattercore | shattercore-v3-reset.png | 1672x941 | `6a63118ea898f69d2ed8043d67a2564b801773a0677a4163b0fc99a1e87d4b72` |
| 4 | Southreach exterior | southreach-exterior-v3-reset.png | 1672x941 | `37919540f6d74d50de9476bc86dc6b20888051aa43173142aa92ca03569de422` |
| 5 | Southreach interior | southreach-interior-v3-reset.png | 1672x941 | `2627d93017f2c27571f5b1393ddb25a0e1f12f8b954165679309d6411d325f71` |
| 6 | Mutation Belt | mutation-belt-v3-reset.png | 1672x941 | `f30f9f049f13e48ea7b312ada29a271e5f100db5eb1fb46dd5c36ccff59523a1` |
| 7 | Living Marsh day | living-marsh-day-v3-reset.png | 1672x941 | `96d664e7ae59ef6964a409afb871e7b9e9d0bbc5fe41c9d2ec2dcd7b95f2565a` |
| 8 | Living Marsh night | living-marsh-night-v3-reset.png | 1672x941 | `b8e7ede36195162c812e3bc0f6322ca0b17b73a1368e724c5d8655841621b4b1` |
| 9 | Bellwether | bellwether-v3-reset.png | 1672x941 | `d68bc35a655fbcc2f9e66092b403710cf822838ee50e01b5c482ef70b6e11784` |
| 10 | Switchmother | switchmother-v3-reset.png | 1672x941 | `53fc717810276550b2e43459134b7a104879ba019f85865357242bad22806ae1` |
| 11 | Marsh coordination | marsh-coordination-v3-reset.png | 1672x941 | `6f86fa6c4c5031561de792a74db06636e3a2f63b9c51adc778ca4efa4e56b81d` |
| 12 | Flora/resources | flora-resources-v3-reset.png | 1672x941 | `8d162eb2eb4350e3a32065b0607bea90c88258e5d0cd9e7e40420eb701b73133` |
| 13 | Bloomstorm | bloomstorm-v3-reset.png | 1672x941 | `aa710396e9d7764977b00c03894ee10eb170fb967de7aa68d402981375014f6a` |
| 14 | Expedition/survivor team | expedition-v3-reset.png | 1672x941 | `6a8834258638b53dab8c3b6e7dc7226810762a9fb04a702e01ae72286ec7067c` |
| 15 | Bloomfall local Atlas | local-atlas-v3-reset.png | 1536x1024 | `3a9f5517e972217a5513428544567267d29ea219ea11dcf69dd12f0aa67e6569` |

```text
V1 selected for release = 0
V2 selected for release = 0
V3 selected for release = 0   (activation blocked; 15 verified and frozen, none promoted)
```

No art was regenerated, restyled, upscaled, recoloured or blended. V1 and V2 preserved as
superseded development evidence.

## 5. V3 world Atlas lock — visually confirmed

Manual inspection of `martino-world-map-v3-reset-candidate.png` confirms every owner-approved
correction:

- Floating City restored — airborne over the lake, visible underside and water shadow.
- Missing island groups restored — several distinct offshore archipelagos.
- Volcanic islands strongly represented — smoking cones, active lava, black basalt.
- Tropical islands strongly represented — canopy, beaches, turquoise reef shallows.
- Desert city restored — dense settlement in the western desert corridor.
- Magic-Torn settlement restored — fortified city beneath a visible defensive field.
- Death Canyon — lethal purple/green gas pooled inside the nested canyon depth.
- Port Arcadia — enlarged, clearly crescent, with harbour, docks and breakwaters.
- Bloomfall Reach — represented in the south-east.
- No boundary-filament contamination; no baked Atlas UI or boundary lines.

The V3 local Atlas confirms three legible bands (Shattercore industrial wound / Mutation Belt
countryside / Living Marsh coastal flooding) with the Drowned Intake on the sea terminus and
no baked labels.

## 6. Stage 0 — production baseline (captured, unchanged)

```text
database                  localhost:5432/habitat
StoryEntry rows           175
StoryMap rows             3
world topology            19 nodes / 26 boundaries / 11 rings
placements                36        nodePlacements    10
worldConnections          25        connectionPaths    9
arcs                       7
martino-world art          v1
martino-port-arcadia art   v2
martino-starting-island    v1
HabitatWeb                 Running      HabitatWorker  Running
public site /              HTTP 200
```

Production hierarchy defects present (**invalidParents = 6**):

```text
the-desert            parent=the-peninsula   (should be null)
grand-rift            parent=the-peninsula   (should be null)
high-cliffs           parent=the-peninsula   (should be null)
magic-torn-wasteland  parent=the-peninsula   (should be null)
riverlands            parent=the-peninsula   (should be null)
the-red-forest        parent=grand-rift  type=zone  (should be null / region)
unknown-southeast     parent=the-peninsula   (not yet renamed)
```

Legitimate nesting already correct in production and to be preserved:
`death-canyon → grand-rift`, `grand-lake → high-cliffs`, `the-floating-city → high-cliffs`,
`port-arcadia → the-peninsula`.

Repair-manifest StoryEntry IDs were checked against production and **match exactly**, so the
manifest is production-compatible once a production-capable tool exists. Note the manifest
expects slug `bloomfall-reach` with `beforeParent=the-peninsula`, so the rename (Section 17)
must run **before** the hierarchy repair (Section 16).

## 7. Development release candidate — ALL GATES PASS

```text
database                    habitat_atlas_dev
StoryEntry rows             238
StoryMap rows               4
world topology              19 nodes / 26 boundaries / 11 rings / 43 refs   (unchanged)
bloomfall local topology     8 nodes / 10 boundaries /  3 rings / 12 refs
```

Bloomfall content audit — `status: PASS`:

```text
main region 1            subregions 3           POIs 15
systems 9                characters/entities 7  creatures 8
aberrants 4              resources 8            events 11
regional arcs 6          semantic connections 2 route paths 2
local scene 1            local placements 18
brokenReferences 0       orphanMajorEntries 0
mainlineArcsLinked 0     mainlineNodeLinks 0    nobodyCameOutcomes 6
productionWrites 0
```

Geographic hierarchy audit — 55 entries, `invalidParents 0`, `cycles 0`, `missingParents 0`,
`suspiciousContainment 0`. All eight required top-level regions present.

Peninsula dossier audit — `status: PASS`. `peninsulaRows = [port-arcadia]` only; 13 legitimate
Peninsula entries; no unrelated world region appears.

Local Atlas verification — `verificationStatus: PASS`; nodes 8, boundaries 10, rings 3,
references 12, paths 2, placements 18; approved routes `riverlands-road` and `ocean-sea-route`;
route candidates correctly left DEFER (5) and REVIEW_REQUIRED (2).

World connections — `bloomfall-reach ↔ riverlands ROAD BIDIRECTIONAL` and
`bloomfall-reach ↔ the-ocean SEA_ROUTE BIDIRECTIONAL`. No Magic-Torn semantic route.

Idempotency — `geography:repair` preview reports `mutations 0`, `invalidParents 0`
(ALREADY_APPLIED) on development.

## 8. Test suite — ALL PASS

```text
@habitat/web test             403 pass / 0 fail
@habitat/web typecheck        clean
@habitat/web lint             clean
@habitat/shared typecheck     clean
@habitat/db typecheck         clean
@habitat/db prisma validate   schema valid
@habitat/codex-sync typecheck clean
@habitat/codex-sync test        3 pass / 0 fail
bloomfall:audit               PASS
codex-sync bloomfall:verify   PASS
geography:audit               0 defects
geography:dossier:audit       PASS
bloomfall:atlas:verify        PASS
atlas:dev:verify              world topology unchanged
atlas:routes:verify           27 connections / 11 approved
git diff --check              clean
```

No safety guard was weakened, disabled or bypassed.

## 9. Section 9 worktree classification

```text
RELEASE_REQUIRED            source under apps/web, apps/codex-sync, packages/shared
                            (~0.3 MB, ~26 files) plus the 15 V3 production rasters
                            (~40 MB) once relocated into private/codex-art/maps/
RELEASE_EVIDENCE            Docs/BLOOMFALL_*.md, Docs/bloomfall-local-atlas/,
                            Docs/geographic-hierarchy/, the V3 manifest
SUPERSEDED_VISUAL_HISTORY   private/codex-art/bloomfall/v2       167 MB / 81 files
                            private/codex-art/bloomfall/candidates 113 MB / 36 files
                            (preserve on disk; do NOT commit)
TEMPORARY/DO_NOT_COMMIT     v3-reset evidence: comparisons, native close-ups, overlays,
                            contact sheets, sources, runtime copies (~145 MB)
UNRELATED                   none identified
```

Repository convention (7 tracked files under `private/codex-art/`) commits only
production-required rasters. The 472 MB of untracked art is **not** gitignored, so a naive
`git add -A` would commit all of it. Selective staging is required.

## 10. Campaign protection — INTACT

```text
mainline arcs modified        0
mainline Bloomfall links      0
Tino required                 NO
Amanda required               NO
campaign unlock               UNDECIDED
campaign act                  UNDECIDED
major antagonist connection   UNDECIDED
ending relevance              UNDECIDED
true Bloomfall culprit        UNRESOLVED
```

## 11. Production authoring — DISABLED (verified)

`HABITAT_ATLAS_AUTHORING_ENABLED` is absent from `.env` (production) and present only in
`.env.local` (development). `assertAtlasAuthoringEnvironment` additionally rejects
`HABITAT_ENVIRONMENT=production` and any URL resolving to the `habitat` database.

## 12. Rollback

```text
rollback used = NO
```

No rollback was needed — no production mutation, deployment or art activation occurred.
All four rollback levels remain available and unused. `/codex/map?atlas=v1` legacy renderer
compatibility is present and untouched.

## 13. Work required to unblock

1. **Production activation tooling.** Give the four Bloomfall/hierarchy tools the production
   convention already proven by `activate-atlas-v2.ts`: explicit
   `*_ACTIVATION_DATABASE_URL`, owner-authorization token, fresh-backup / release-HEAD /
   build-ID preconditions, serializable transaction, optimistic version claims, atlas
   preservation snapshot, and an `ALREADY_APPLIED` idempotent path. This is new reviewed
   engineering, not a release action.
2. **V3 art registration.** Add `martino-world:v3` and `martino-bloomfall-reach:v3` to the
   art registry, relocate the two Atlas rasters into `private/codex-art/maps/`, drop
   `developmentOnly` from the Bloomfall scene, and bind the 13 cinematic V3 assets to their
   canonical Codex entries.
3. **Re-run this prompt** once both land, starting from a fresh preflight.
