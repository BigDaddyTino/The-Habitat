# Bloomfall Reach — Codex production promotion report

Status: **LIVE**

Date: 2026-08-26

Scope: controlled production promotion of the reviewed Bloomfall Codex systems integration, the Adaptive Mutation galleries, and the cross-links that connect them. Codex only. No Unreal runtime, gameplay, Blueprint, AI, spawning, networking, or save-game work.

## 1. Release identity

| | |
| --- | --- |
| Branch | `main` |
| Starting HEAD | `89e174d863606dea43fb29a80c95ce34117f5085` |
| Release commit | `d6aa1b8167deea4d10dece48576b20bd5881678b` |
| Production build ID | `BilUK581FklIESWFe5Km3` |
| Deployed service | `HabitatWeb`, restarted 15:43:55 |
| Worktree at release | clean; the promotion refuses a dirty tree |

## 2. Backup

Taken immediately before the first production write, using the convention in `scripts/backup-habitat.ps1`.

```text
path       N:\The Habitat\backups\database\habitat-bloomfall-codex-promotion-20260826-153540.dump
bytes      20,145,673
written    2026-08-26T15:35:43-04:00
sha256     b302eff63c68ff08af2dacb744343e1c6b1ee197d1dc910f5b8462a0ed731f22
verify     pg_restore --list exit 0, 746 TOC entries, dbname habitat
```

## 3. Production baseline

Captured read-only before any mutation.

```text
state                 ALREADY_APPLIED (the V3 cutover final state)
baseline fingerprint  c3fd0ff0a3ae73fc7b18198c717b48e579b1d764f7ae821b01fccc49741c7a40
storyEntries          238
storyMaps             4      placements 54     topologyNodes 27
boundaries            36     rings 14          references 55
worldConnections      27     connectionPaths 11    arcs 13
revisions             1277
maps                  martino-world v3, martino-bloomfall-reach v3
hierarchy             Bloomfall Reach top-level, parent null
```

No drift. The release proceeded.

## 4. Two findings the dry run surfaced

**Prompt B had never reached production.** All 43 cross-link targets still held their original Prompt 3 bodies; the creature enhancement existed only in development. The promotion now accepts either approved prior state — the Prompt 3 body or the rendered Prompt B one — and writes the same target from both, so production received the enhancement and its cross-links together in one gated transaction. Refusing anything outside those states is what kept the guard meaningful rather than simply widening it.

**The route table claimed something the Atlas does not yet show.** It reported "On the Atlas: Drawn" for four persisted alignments, but two of those four — the Cairnwood–Glassroot trail and the Southreach service spine — are authored in development only, and this release promotes Codex content rather than Atlas geometry. The column now reports **base topology** (`Persisted alignment` / `Not persisted`), which is the classification the route review actually settled. No route was reclassified.

## 5. Dry run

```text
action              DRY_RUN
writes              0
result              READY
planned mutations   50   (2 create, 5 upgrade, 43 cross-link appends)
gates passed        canonical database URL, production mode, owner token,
                    release-specific promotion token, exact HEAD, exact build ID,
                    fresh verified backup, baseline fingerprint,
                    adaptive gallery lock (12 P0 + 14 P1/P2, 26 unique bindings),
                    route parity (1/3/5/3, 4 persisted)
```

## 6. Promotion result

```text
action              PROMOTE
status              APPLIED
mutations           50
storyEntries        238 -> 240
after fingerprint   f40977b125023538325a813bcb76941637721afb68a673cf6fbeb3be165fb583
unpromoted records  0
transaction         single serializable transaction, one audited StoryRevision per record
```

## 7. Production audit

`pnpm --filter @habitat/web bloomfall:integration:audit:production` — **PASS**, writes 0.

```text
system dossiers                      7 / 7 exact against the reviewed manifest
cross-link blocks                    43 / 43
POIs a system names                  15 / 15
POIs that name a system back         15 / 15
classified creatures linked          13 / 13
explicit NONE classifications        4
named Aberrants linked               4 / 4
resources consequence-classified     8 / 8
regional stories linked              10 / 11 (A Ledger with Two Owners, by decision)
routes                               12, matching the route manifest key for key
route classes                        1 permanent / 3 conditional / 5 dynamic / 3 deferred
persisted alignments                 4
broken references                    0
duplicate system entries             0
missing images                       0
superseded image bindings            0
mainline links                       0
Bloomfall / Magic-Torn connections   0
```

## 8. Image delivery

Verified over HTTP against the running production service, with the served bytes hashed and compared to the locked manifests.

| Asset | Result |
| --- | --- |
| `bloomfall-v3/bloomfall-reach.png` | 200, hash matches |
| `bloomfall-v3/bloomstorm.png` | 200, hash matches |
| `bloomfall-v3/the-bellwether.png` | 200 |
| `bloomfall-adaptive-p0/blackbloom-hart-gradient-sensing.png` | 200, hash matches |
| `bloomfall-adaptive-p0/latchhound-pack-relay.png` | 200, hash matches |
| `bloomfall-adaptive-p0/the-last-shift-current-collective.png` | 200 |
| `bloomfall-adaptive-p1p2/mirejaw-weir-plated.png` | 200, hash matches |
| `bloomfall-adaptive-p1p2/old-drowner-drowned-intake-hero.png` | 200, hash matches |
| `bloomfall-adaptive-p0-source/…-iteration-1-revise.png` | **404**, as designed |
| `bloomfall-adaptive-p1p2-source/…-iteration-2.png` | **404**, as designed |

The candidate directories hold only owner-approved finals — 12 P0 and 14 P1/P2, 26 in total — so promotion serves them like any other art package. The sources beside them carry every iteration review sent back, and no release opens that directory.

The V3 package is untouched: same fifteen assets, same hashes, same bindings. The Bloomstorms dossier displays the approved V3 storm plate without moving its existing binding.

## 9. Desktop and mobile QA

Authenticated production pages, rendered by the live service, captured with the live production stylesheets and measured in headless Chromium. Evidence: `apps/web/private/codex-art/bloomfall-systems/evidence/production-qa.json`.

| | Desktop 1500 × 900 | Mobile 390 × 844 |
| --- | ---: | ---: |
| Pages measured | 15 | 15 |
| Failures | 0 | 0 |
| Horizontal overflow | 0 on every page | 0 on every page |
| Client / scroll width | 1484 / 1484 | 390 / 390 |
| Elements outside the viewport | 0 | 0 |
| Controls under 24 px | 0 | 0 |
| Panel images missing alt text | 0 | 0 |

Every system dossier renders one system panel, one fact ribbon, and its seven prose sections as real headings. The creature dossiers render their galleries: Hart 5 cards, Latchhound 5, Rootback 3, Last Shift 2, Glasswing 1, Mender 1. The relationship diagram renders on Bloomfall Reach and on Essence Saturation.

Sixty-six separate content assertions were also run against the production HTML — panel presence, fact ribbon, concept build status, future-gameplay labelling, no raw markdown hashes, the creature index linking all thirteen entities, the storm plate, the twelve routes, adjacency-only wording, explicit NONE treatment, and Mender carrying no adaptive ladder. All 66 passed.

## 10. System fact ribbon

Now visible on every SYSTEM dossier, which is the one presentation change that was never development-gated. It renders category, build status, and unlock stage from metadata production already held. Verified after deployment: system dossiers show their facts, non-system dossiers are unaffected, no metadata is duplicated, and mobile layout is unchanged.

## 11. Monitoring

```text
HabitatWeb                 Running
HabitatWorker              Running
/                          200
/sign-in                   200
/codex (unauthenticated)   307 to sign-in, as designed
new server errors          0   (HabitatWeb.err.log last written 08:24, before the release)
new 5xx                    0
new database errors        0
asset failures             0   (only the intended 404s on the source directories)
```

The pre-existing `ChunkLoadError` entries in the error log predate the release: they come from rebuilding `.next` under a running server earlier in the day and were cleared by the release restart.

## 12. Idempotency

A second promotion run reports `ALREADY_APPLIED` with `mutations = 0` and no duplicate systems, relationships, image bindings, POI links, resource links, or route records.

## 13. Rollback

Not used. Four layers remain available, narrowest first:

1. **Presentation and image bindings** — revert the release commit's gate changes and redeploy; the Codex content stays.
2. **Codex content** — every one of the 50 records carries an audited `StoryRevision` with its exact prior body, so any record can be restored individually.
3. **Application build** — redeploy the previous commit.
4. **Database restore** — the verified backup named above.

## 14. What changed, and what did not

Changed in production: seven Bloomfall system dossiers (two created, five upgraded in place), 43 cross-link blocks across regions, POIs, resources, characters, and regional stories, the creature enhancement layer for all thirteen classified entities, the Adaptive Mutation galleries, the system panel and relationship diagram, the SYSTEM fact ribbon, and markdown section headings in Codex prose.

Unchanged: the game runtime and the Unreal project, the main campaign, world topology and the V3 world Atlas, Bloomfall canon fundamentals, Atlas geometry, the geographic hierarchy, route classifications, and Codex search.

## 15. Deliberately out of scope

- The whole-Codex relationship-aware search enhancement remains a documented proposal.
- The optional Bloommarked Remnant P3 visual was not generated or promoted.
- No runtime system was implemented; every dossier still labels its mechanics future gameplay design.
- Prompt D's two new conditional Atlas alignments remain authored in development. They need their own gated Atlas release, and the Codex no longer asserts that the live map draws them.

## 16. Final decision

`BLOOMFALL_CODEX_SYSTEMS_AND_ADAPTIVE_GALLERIES_LIVE`
