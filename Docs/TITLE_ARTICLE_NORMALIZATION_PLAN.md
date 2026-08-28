# "The" prefix — deep-dive audit and correction plan

Date: 2026-08-26
Status: EXECUTED 2026-08-26 — owner approved ("drop The where feasible"); see the execution record at the end of this document.
Source of truth: read-only audit of production `localhost:5432/habitat` (238 StoryEntries, post-Bloomfall-V3).

## 1. Is it normal?

Partly. Two different things are going on, and they need opposite treatments:

1. **Titles** (display names) have drifted toward "The" everywhere: **98 of 238 titles (41%)**
   start with "The ". Some of that is genuine proper naming ("The Bloomfall", "The Risen",
   "The Last Shift"); a lot is reflexive garnish ("The National Defense Directorate",
   "The Foundry Workers Union", "The Desert").
2. **Slugs** (identifiers) are much cleaner: only **64 of 238** start with `the-`, and
   **37 entries already have a The-title over a The-less slug** (`riverlands` → "The
   Riverlands", `grand-rift` → "The Grand Rift", almost every faction). The codebase's own
   naming DNA is The-less; titles grew articles on top of it.

Two pieces of existing engineering confirm this was already an irritant:

- The prose renderer (`apps/web/lib/story-prose.ts`) has a dedicated `elideLeadingThe`
  mechanism so "the [[the-soul-forge]]" doesn't render as "the The Soul Forge".
- Three entries already prove slug ≠ title is safe and established:
  `the-starting-island` → "Ignit Island", `the-corruption-system` → "Corruption",
  `the-kestrel-commander` → "Commander Rook".

The same audit surfaced two casing bugs to fold into the fix: **"The southside"** and
**"The East side"**.

## 2. Inventory (exact, from production)

```text
StoryEntries total                 238
titles starting "The "              98
slugs starting "the-"               64
title-The over The-less slug        37   (mostly factions + the 7 repaired world regions)
slug-the- under The-less title       3   (existing safe precedent)
arcs with "The " titles              9   (4 of them MAINLINE)
story nodes with "The " titles      22 / 78
maps with "The "                     0
```

By kind, the 98 The-titles break down roughly as: ~30 factions, ~20 regions/places,
~13 events, ~12 rules, ~8 systems, ~5 companion missions, and the rest across
creatures / themes / threads / characters.

## 3. What is wired to what — the dependency map

### Slugs are identity. They are wired into everything:

| Dependency | Scale |
| --- | --- |
| `meta.parent` hierarchy references (slug strings) | 10 distinct `the-` parents, 39 child rows |
| `[[slug]]` wiki links inside prose bodies | **248 of 810 links target `the-` slugs, across 132 entries** |
| Public URLs `/codex/bible/<slug>` | every entry |
| Deterministic v5 UUIDs derived from slugs (scene IDs, revision IDs, Bloomfall content IDs) | all idempotent tooling |
| Art bindings keyed by slug (`bloomfall-v3-art.ts` entrySlug, `region-branding.ts`, keyart, faction branding) | ~15 registries |
| Hardcoded slugs in code (seeds, tests, audits, hierarchy manifests, codex-sync) | **~55 files** |
| Codex-sync export/mirror (external consumers) | full snapshot |

### Titles are display. They are wired into much less:

| Dependency | Behaviour on title change |
| --- | --- |
| Atlas map labels | Render `entry.title` directly — **fix the title, the map label fixes itself** |
| Dossier headers, breadcrumbs, search text | Follow the title automatically |
| Wiki-link labels | Follow the target's title automatically (with existing "the The" elision) |
| Hardcoded title expectations in code | ~15 relevant files: seeds, tests, audit expected-titles, shared canon (`bloomfall-reach.ts`, `geographic-hierarchy-repair.ts` manifest titles, Peninsula dossier audit) |
| Verbatim prose mentions of region titles | **Tiny: 13 total** across all ten major regions (0–3 each) |
| Revision history summaries | Historical text; correctly left untouched |

### The conclusion that falls out of the map

**Titles are cheap to fix. Slugs are catastrophic to fix.** Renaming the 64 `the-` slugs
would touch 248 prose links, 39 parent references, ~55 code files, every derived v5 UUID,
public URLs, and the external codex-sync surface — for a change players barely see (slugs
appear only in URLs). Titles drive everything a player actually reads.

## 4. Recommendation

1. **Freeze slugs permanently as immutable identifiers.** Never rename a slug for cosmetic
   reasons. (The one precedent — `unknown-southeast` → `bloomfall-reach` — was a semantic
   identity change with dedicated gated tooling, not a style fix.) Adopt this as written
   policy so the question never reopens as the world grows.
2. **Normalize titles only**, through a reviewed decision manifest and the same deterministic,
   audited, idempotent repair pattern that shipped the hierarchy repair and Bloomfall V3.
3. **Adopt a naming policy** so every future entry is born correct (see §5).

## 5. Proposed naming policy (owner approval required — this is a creative call)

**Keep "The" only when it is part of the proper name; drop it when it is a generic article.**

| Category | Default | Examples |
| --- | --- | --- |
| KEEP — the article *is* the name | creatures, mysteries, named events | "The Risen", "The Last Shift", "The Bellwether", "The Unnamed", "The Bloomfall", "The Drain", "The Empty Cribs" |
| KEEP — established rule/system monikers | rules, systems | "The Veil", "The Soul Forge", "The Five Pillars", "The Seven Phases of Corruption", "The Island Remembers" |
| KEEP — sentence-style titles | companion missions, some arcs | "The Man Who Left", "The Night We Were Happy", "The Island Is Already Lost" |
| DROP — geographic descriptors | regions, districts, waters | "The Peninsula" → "Peninsula", "The Desert" → "Desert", "The Grand Rift" → "Grand Rift", "The Red Forest" → "Red Forest", "The Riverlands" → "Riverlands", "The High Cliffs" → "High Cliffs", "The Magic-Torn Wasteland" → "Magic-Torn Wasteland", "The Grand Lake" → "Grand Lake", "The Floating City" → "Floating City", "The Northside" → "Northside" |
| DROP — institutional garnish | most factions/organizations | "The National Defense Directorate" → "National Defense Directorate", "The Foundry Workers Union" → "Foundry Workers Union", "The Peninsula Coast Guard Authority" → "Peninsula Coast Guard Authority" |
| OWNER_DECISION — could read either way | evocative faction names; Bloomfall subregions | "The Old Hunger", "The Choir Below", "The Pale Embassy", "The Ashen Court"; "The Shattercore" / "The Mutation Belt" / "The Living Marsh" (freshly shipped Bloomfall canon — dropping is safe but is a canon change) |

Also folded in: fix "The southside" → "Southside" and "The East side" → "East Side"
(casing bugs regardless of the article decision).

Prose keeps its natural grammar: sentences still say "deep in the Peninsula" — the literal
"the" lives in the prose text, the title just stops duplicating it. The existing
`elideLeadingThe` renderer logic remains correct in both worlds.

## 6. Phased execution plan

### Phase 0 — Policy sign-off (owner)
Approve §5 (or amend it) and rule on each OWNER_DECISION row. Nothing proceeds without this.

### Phase 1 — Decision manifest + audit tool (engineering, zero writes)
- Author `titleNormalizationManifest`: one reviewed row per affected entry
  (`id`, `slug`, `beforeTitle`, `finalTitle`, `category`, `decision`) — exactly the shape
  that made `geographicHierarchyRepairManifest` safe. Include the 9 arcs and 22 node titles
  as separate sections.
- Author a read-only audit (`title:audit`) reporting BEFORE / ALREADY_APPLIED / DRIFT per
  row against dev and production, with a logical fingerprint.

### Phase 2 — Code alignment (repo only, still zero DB writes)
- Update the ~15 files that hardcode affected **titles** (seeds, shared canon, audit
  expected-titles, tests) to the final titles, sourced from the manifest where practical.
- Do **not** touch slug-keyed code — it is unaffected by design.
- Full suite green against dev before any DB write.

### Phase 3 — Development apply
- `title:repair --apply` modeled directly on `repair-geographic-hierarchy.ts`: serializable
  transaction, optimistic `version` claims, one StoryRevision per change, before/after
  assessment, Atlas-preservation snapshot (title changes must not touch geometry), and a
  deterministic ALREADY_APPLIED second-run path.
- Apply to `habitat_atlas_dev`; run hierarchy audit, Peninsula dossier audit, Bloomfall
  audit, atlas dev verify, full test suite.

### Phase 4 — Production cutover (own prompt, same discipline as Bloomfall V3)
- Production-gated entrypoint reusing the proven convention: explicit source/target URLs,
  owner token, release HEAD, build ID, fresh verified backup, read-only baseline
  fingerprint, dry-run → apply → idempotency re-run.
- Deploy + restart HabitatWeb only if code changed (Phase 2 means it will have).

### Phase 5 — Editorial and QA sweep
- Hand-edit the ~13 verbatim "The <Region>" prose mentions where the sentence still needs
  a lowercase "the" (most already read correctly since prose supplies its own article).
- Visual QA: Atlas labels at all zoom tiers (labels get shorter — decluttering improves),
  dossier headers, search results, breadcrumbs, desktop + mobile.

## 7. Hard non-goals

- **No slug renames.** Slugs are frozen identifiers from this point on.
- No StoryEntry ID changes; no `[[link]]` rewrites; no `meta.parent` changes.
- No topology, placement, or geometry writes (enforced by the preservation snapshot).
- No mainline arc restructuring — the 4 mainline arcs with "The" titles are
  sentence-style KEEPs anyway.
- Ignit Island / starter progression untouched.
- Production authoring stays disabled.

## 8. Effort and risk

| Phase | Size | Risk |
| --- | --- | --- |
| 0 | owner review of ~98-row table | — |
| 1 | manifest + audit tool | none (zero writes) |
| 2 | ~15 files of expectation updates | low; suite catches misses |
| 3 | one repair tool + dev apply | low; direct reuse of proven pattern |
| 4 | production cutover | low-moderate; identical gate discipline to Bloomfall V3 |
| 5 | ~13 prose edits + QA pass | trivial |

The single biggest risk is scope creep into slug renames mid-project. The policy in §4/§7
exists to prevent exactly that.

## Execution record — 2026-08-26

Owner direction: "Drop 'The' where it is feasible, just make sure we don't break any
connection in doing so." Slugs were treated as frozen identifiers throughout; every
change below is title-only.

### Decision applied

- 50 titles normalized: 37 ARTICLE_DRIFT (The-title over The-less slug), 11
  GEOGRAPHIC_LABEL (the- slugged places whose map labels read bare), 2 CASING_SPELLING
  ("Waterfront district" -> "Waterfront District", "Arcadian Soverign Guard" ->
  "Arcadian Sovereign Guard"; "The southside" -> "Southside" and "The East side" ->
  "East Side" ride in the first two categories).
- Articles retained on authored names, recorded in `retainedArticleTitles`: the six
  the- factions (The Ashen Court, The Choir Below, The Free Peoples Compact, The Old
  Hunger, The Pale Embassy, The Riftbound Legion) and all creature/event/rule/system/
  theme/thread/mission/character lore titles (The Risen, The Last Shift, The Bloomfall,
  The Veil, ...). The pre-existing creature/event title duplicate "The Bellwether" was
  deliberately left untouched for future editorial.
- Arcs (9) and story nodes (22) with "The" titles: all sentence-style authored names,
  all kept.

### Tooling

- `apps/web/scripts/lib/title-normalization.ts` — frozen 50-row manifest
  (id/slug/beforeTitle/finalTitle/category), BEFORE/ALREADY_APPLIED/DRIFT assessment,
  deterministic v5 revision IDs.
- `apps/web/scripts/normalize-titles.ts` (`pnpm --filter @habitat/web titles:normalize`)
  — dev-locked by default; `--production` requires the explicit target URL, production
  environment confirmation, a fresh verified `.dump` backup, and the exact confirm token.
  Serializable transaction, optimistic version claims, one StoryRevision per change,
  and an Atlas-preservation snapshot proving geometry/placements/connections unchanged.

### Code alignment (lockstep with the DB)

`geographic-hierarchy-repair.ts` manifest titles (6), `seed-story-atlas.ts` (8),
`packages/shared/src/bloomfall-reach.ts` (7), `bloomfall-reach-content.ts` (4), and
three test fixtures. `atlas-canonical-topology.ts` deliberately untouched — it feeds
frozen migration-manifest hashes and runtime labels come from DB titles.

### Results

```text
development apply      NORMALIZED  mutations=50 revisions=50 atlasPreserved=true
development second run ALREADY_APPLIED mutations=0
production backup      habitat-pre-title-normalization-20260826-082742.dump
                       19,799,838 bytes, pg_restore --list exit 0
                       sha256 5a5eeeee3f37f1a7c23c00345751da9409aaac128bc77085964e6b1954519008
production preview     PREVIEW mutations=50 (baseline exactly BEFORE)
production apply       NORMALIZED  mutations=50 revisions=50 atlasPreserved=true
                       receipt aa690d611c2efcb59a1973fe7dcce1d1402ae0e999dcf995d1e455be54429ff2
production second run  ALREADY_APPLIED mutations=0
hierarchy audit (prod) 0 invalid / 0 cycles / 0 missing (55 entries)
geography:repair       consistent, 0 mutations against updated manifest
bloomfall audits       PASS (content, local atlas, codex-sync)
Bloomfall V3 snapshot  fingerprint c3fd0ff0...c7a40 UNCHANGED, state ALREADY_APPLIED
test suite             web 418/418, codex-sync 3/3, typechecks + lint clean
production build       Cb-qCH9ihKFBPUCvZWldT (restart required to serve it)
```

### Deliberately untouched

Slugs, StoryEntry IDs, [[wiki links]], meta.parent references, geometry, prose bodies
(the ~13 capitalized verbatim region mentions read correctly either way), historical
revision summaries, and the frozen atlas migration artifacts.
