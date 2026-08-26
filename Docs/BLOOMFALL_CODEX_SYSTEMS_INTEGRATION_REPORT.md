# Bloomfall Reach — Codex systems integration report

Status: development authoring complete; owner review pending; runtime implementation deferred

Target: guarded loopback `habitat_atlas_dev` only

Scope: the Martino Codex. No Unreal runtime, gameplay code, Blueprint, AI, spawning, networking, or save-game work was performed.

Source of truth: `apps/web/lib/bloomfall-codex-integration.ts`

```text
production writes         = 0
production migrations     = 0
production Codex changes  = 0
production Atlas changes  = 0
production art activation = 0
runtime implementation    = 0
new imagery generated     = 0
```

## 1. What this phase was for

Prompt A locked the regional rules, Prompt B classified the creatures, Prompts C and C2 produced the Adaptive Mutation art, and Prompt D classified the routes. All four landed correctly and none of them reached the reader as one connected experience.

The Codex held Bloomfall as a region page, a set of two-paragraph system stubs, thirteen enhanced creature dossiers with almost no outbound links, an Atlas, and a pile of resources that happened to mention the same places. This phase turned that into one package: seven authoritative system dossiers, cross-links in both directions, a comparative presentation layer, and an audit that can prove the whole thing still hangs together next month.

## 2. Before-state audit

Measured against the development Codex before any change.

| Gap | Evidence |
| --- | --- |
| Systems were stubs | The six centrepiece dossiers averaged 730 characters of body text — two paragraphs each. |
| Bloomstorms had no page | Prompt A justified one new `bloomstorms` record under `weather`. It had never been created. |
| Bloomfall travel had no page | Prompt D classified twelve routes into four classes. Nothing in the Codex explained them. |
| Enhanced creature dossiers were dead ends | Seven of thirteen had **zero** outbound links; four more had exactly one. Glasswing Kite had no links in either direction. |
| POIs did not explain their systems | Seven of fifteen linked no system at all, including Reserve Vault Twelve, Ashline Exchange, the Drowned Intake, and Heartfen. |
| Resources did not name their consequence | Reserve Glass, Gridcore Alloy, and Capacitor Tissue linked no system, so the harvesting tradeoff was invisible where it mattered. |
| Generated dossiers printed their own markup | `## Ecology` and `### Grounded Crown` rendered as literal hashes in every Prompt B creature dossier. |
| System dossiers showed no status | The SYSTEM branch of the dossier fact ribbon was unreachable code, so no system page ever displayed its build status or unlock stage. |
| Aberrant roaming had no home | Prompt A asked for mobility classes, intel quality, and life policy. The `aberrant-escalation` stub covered none of it. |

## 3. The seven system dossiers

| Dossier | Slug | Authoring | Body before | Body after |
| --- | --- | --- | ---: | ---: |
| Essence Saturation | `essence-saturation` | upgraded in place | 794 | 4,038 |
| Reactor Cycles | `reactor-cycles` | upgraded in place | 701 | 4,036 |
| Adaptive Mutation | `adaptive-mutation` | upgraded in place | 805 | 3,854 |
| Bloomstorms | `bloomstorms` | **created** under `weather` | — | 3,869 |
| Bloomfall Harvesting Consequences | `harvesting-consequences` | upgraded in place | 730 | 3,782 |
| Aberrant Escalation & Roaming Threats | `aberrant-escalation` | upgraded in place; stable slug preserved | 633 | 4,001 |
| Bloomfall Travel Conditions | `bloomfall-travel` | **created** under `transportation` | — | 3,965 |

Every dossier follows the same structure, generated deterministically from the manifest so an audit can compare the database against the source byte for byte:

opening definition · Why it exists · Where it operates · What feeds it · What it changes · In play · On the Atlas · Canon and status · Related in the Codex.

Supporting pages — Blackbloom Exposure, Marsh Absorption, Blackbloom Spell Instability, and Bloomfall Environmental Hazards — keep their existing ownership and were not duplicated.

## 4. Cross-links

Forty-three short blocks were **appended** to records the earlier phases left unconnected. Appending rather than rewriting keeps the reviewed Prompt 3 and Prompt B prose exactly as approved and makes the addition auditable on its own.

| Kind | Records | What the block does |
| --- | ---: | --- |
| Region | 11 | The regional dossier and three subregions gain a systems paragraph; seven POIs that named no system gain an *In the wider Reach* paragraph. |
| Item | 6 | Each canonical resource states its harvest consequence class and the systems that class answers to. |
| Character | 4 | Ward, Quill, Reed, and Mender connect to the systems their work actually touches. |
| Event | 10 | Ten of the eleven regional stories name the systems in play. |
| Creature | 12 | Every classified creature dossier gains a grouped *Related in the Codex* block. |

POI-to-system linking in the other direction is data-driven rather than hand-written: each system dossier carries typed `regionNotes`, which the Codex's existing *How the world behaves here* panel already renders on the place it names. All fifteen POIs are covered that way, with no Bloomfall-specific navigation hardcoded into any component.

## 5. Presentation

`apps/web/components/bloomfall-system-panel.tsx` renders the comparative layer that prose cannot: saturation bands side by side, the seven reactor states grouped by frequency class, the mutation tier ladder with a creature index, the five storm stages, the five harvest classes with their four field states, threat mobility and information states, the four route classes with all twelve classified routes, and an inline SVG causal diagram.

It renders from the same manifest the prose is generated from, so the two cannot disagree. It resolves to nothing outside `HABITAT_ENVIRONMENT=development`.

The diagram is drawn with existing UI, CSS, and SVG. No image was generated for it. Every relationship it draws is also written out as an ordered list beneath it, which is both the text alternative and the readable form on a phone.

## 6. Imagery

No image was generated, regenerated, softened, or replaced.

- Thirteen approved V3 Codex plates: all present on disk, all bound to entries that exist.
- Adaptive P0 and P1/P2: 33 bound assets, no duplicate bindings, and every adaptive species' state bindings are exactly `0..n-1` for its authored state count. The manifests deliberately retain superseded revision attempts; those carry no binding and are excluded by construction.
- Superseded V1/V2 sets: not exposed through any served package.
- The Bloomstorms dossier displays the owner-approved V3 storm plate. Its production binding to `blackbloom-overcharge` was **not** moved, because moving it would be a production art change.

## 7. Two generic Codex fixes

Both are defects the Bloomfall content exposed, and both improve every dossier in the Codex rather than only these.

**Section headings render.** `storyProseBlocks` recognises `##` and `###` and `StoryProse` renders them as real headings. Before this, every generated dossier printed its own structure as literal punctuation — the same class of failure the link markup was written to fix.

**The SYSTEM fact ribbon renders.** The dossier's fact ribbon listed a SYSTEM branch that its own condition could never reach, so no system page had ever shown its category, build status, or unlock stage. Adding `isSystem` to that condition makes the project's established status vocabulary visible on every system page, which is exactly how this Codex is meant to say "concept, not shipped".

This second change is visible in production the next time the web app is deployed. It surfaces metadata production already holds and changes no data. It is called out here because it is the one item in this package that is not development-gated.

## 8. Audit

`pnpm --filter @habitat/web bloomfall:integration:audit`

```text
system dossiers                      7 / 7 exact against the manifest
cross-link blocks                    43 / 43 landed
POIs a system names                  15 / 15
POIs that name a system back         15 / 15
regional stories linked to systems   10 / 11 (one deliberate exception)
creature dossiers linked to systems  13 / 13
explicit NONE classifications        4
named Aberrants linked               4 / 4
resources linked to systems          8 / 8
routes                               12, matching the route manifest key for key
route classes                        1 permanent / 3 conditional / 5 dynamic / 3 deferred
routes drawn on the Atlas            4
broken references                    0
duplicate system entries             0
missing images                       0
superseded image bindings            0
mainline links                       0
Bloomfall / Magic-Torn connections   0
```

The audit also runs the Codex library's own search query for ten reader-plausible terms and asserts each reaches its canonical dossier.

| Query | Results | Reaches |
| --- | ---: | --- |
| Adaptive Mutation | 14 | `adaptive-mutation` |
| Blackbloom | 36 | `blackbloom-exposure` |
| Bloomstorm | 31 | `bloomstorms` |
| Essence Saturation | 1 | `essence-saturation` |
| Aberrant | 24 | `aberrant-escalation` |
| Bellwether | 10 | `the-bellwether` |
| Latchhound | 15 | `latchhound` |
| Southreach | 34 | `southreach-complex` |
| Heartfen | 6 | `heartfen` |
| Conditional route | 1 | `bloomfall-travel` |

## 9. Desktop and mobile QA

`pnpm --filter @habitat/web bloomfall:systems:qa` renders the real components against the real compiled stylesheet, measures them in headless Chromium, and writes evidence to `apps/web/private/codex-art/bloomfall-systems/evidence/`.

Headless Chromium clamps its window well above phone width, so the mobile pass runs the harness inside an exactly 390 × 844 frame and reads the measurement the harness took of its own viewport.

| Measure | Desktop 1500 × 900 | Mobile 390 × 844 |
| --- | ---: | ---: |
| Document client width | 1484 | 390 |
| Document scroll width | 1484 | 390 |
| Horizontal overflow | 0 | 0 |
| Panels rendered | 8 | 8 |
| Cards rendered | 47 | 47 |
| Wide tables | 2 | 2 |
| Scroll containers contained | 4 / 4 | 4 / 4 |
| Diagrams | 2 | 2 |
| Elements overflowing the viewport | 0 | 0 |
| Links under 24 px | 0 | 0 |
| Images missing alt text | 0 | 0 |

## 10. Accessibility

Headings are ordered — the dossier owns `h1`, panels and prose sections use `h2`, group headings `h3`, cards `h4`. Tables carry captions, `scope="col"`, and `scope="rowgroup"`. The diagram is `role="img"` with a `<title>` and a `<desc>` that states the causal chain in words, and every arrow it draws is repeated as an ordered list beneath it. Saturation bands, reactor states, route classes, and information states are all named in text; colour is decoration everywhere and carries no meaning alone. Touch targets clear 44 px on mobile. Nothing depends on hover.

## 11. Tests

```text
web tests                            PASS  446
strict typecheck                     PASS
lint                                 PASS
production build                     PASS  55/55 static pages
                                           (only the pre-existing NFT trace warning)
Bloomfall Codex integration audit    PASS
Bloomfall canonical content audit    PASS
Bloomfall creature enhancement audit PASS
Bloomfall route audit                PASS  12 candidates / 0 failures
Atlas canonical route verification   PASS
Geographic hierarchy audit           PASS  55 entries / 0 invalid parents / 0 cycles
Adaptive P0 visual manifest audit    PASS
Adaptive P1/P2 visual manifest audit PASS
Desktop and mobile QA                PASS
Production read-only comparisons     PASS
git diff --check                     PASS
```

## 12. Production safety

Two independent read-only comparisons were run against production, which is a different database.

- The Prompt C creature fingerprint is unchanged at `d943433bbdfdcfd70761249da81162782e67b71e08a8e74663a75ed91e54bf4f`, exactly matching the locked baseline. That comparison covers a fixed record set, so it is the one that proves production data did not move.
- The integration comparison finds 48 of the 50 touched slugs present, the two new dossiers correctly absent, and no Prompt E prose anywhere. Fingerprint `7eee1c9261c779fe452e05e78422ae4cfaf80ea1a8667b7f94310cf03496fd99`. This fingerprint is taken over whatever set of records the phase touches, so it changes when the phase touches more records — it is a completeness check, not a change detector, and the Prompt C baseline above is what rules out drift.

The apply tool resolves only `HABITAT_ENVIRONMENT=development`, rewrites only to the loopback `habitat_atlas_dev`, independently checks the database identity, requires the Atlas authoring interlock and an explicit confirmation token, refuses any record that has drifted from its approved prior state, writes inside a serializable transaction, and records an audited `StoryRevision` for every change.

## 13. Deferred, on purpose

- Main campaign integration: act, entry, unlock, antagonist, ending relevance, and the true cause of the Bloomfall all remain `DEFERRED`.
- The Magic-Torn border remains geographic adjacency only. No connection, path, or travel semantics exist across it.
- Dynamic corridors remain absent from base Atlas topology. Deferred routes draw nothing.
- No runtime system was implemented, and no page claims one exists.

## 14. Owner decisions

1. Approve or revise the seven system dossiers and the forty-three cross-link blocks.
2. Approve the retitle of `aberrant-escalation` to **Aberrant Escalation & Roaming Threats**. The slug is unchanged, so every existing link still resolves.
3. Decide whether the system panel should be promoted to production alongside the content, or whether production should carry the prose alone at first.
4. Optional: Codex search matches title, summary, and body text, so a phrase that prose always writes as a link — "Essence Saturation" — reaches its own dossier but not the pages citing it. Making search slug-aware would fix that for the whole Codex, not only Bloomfall. It is out of scope here and left as a proposal.

## 15. Final decision

`BLOOMFALL_CODEX_SYSTEMS_INTEGRATION_READY_FOR_OWNER_REVIEW`

## 16. Next recommendation

If the owner approves, proceed with a **controlled production promotion of the Bloomfall Codex systems package and the Adaptive Mutation galleries**: a single reviewed release that carries the seven dossiers, the cross-link blocks, the presentation layer, and the P0/P1/P2 art activation together, with a captured production baseline before and after.

The optional Bloommarked Remnant P3 image and any further Codex region work should follow that promotion rather than precede it.
