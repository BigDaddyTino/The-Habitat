# The Price of a Person — the character bible, and how it landed

Integrated 2026-08-30. This document is the *process* half of the character
bible: what the design decided, what it deliberately did not, and how the pass
was executed. The canon half is in the codex itself, on the entries listed
below — read those first. This exists so the next agent can find out **why**
without having to re-derive it, the same way `Docs/STORY_CODEX.md` does for the
codex itself.

## What the pass covered

The player character, end to end: ten ledgers, six species, six backgrounds,
four origins, six attributes, twenty skills with sixty techniques, six pillars
of magic holding twenty-seven licence classes and one hundred and eight
abilities, nine professions, kit, cybernetics, corruption as a build, suspicion,
survival, companions, the career curve, and the whole of combat including the
wound model and the live order wheel.

## The architecture, in one paragraph

A character is **ten ledgers in three tiers**, and death sorts them. *Given* —
species and background — is kept. *Earned* — attributes, skills, disciplines,
professions — is kept, except attributes, which are rebuilt to the last-bound
pattern. *Carried* — corruption, suspicion, standing, kit — is kept, except kit,
which is on the corpse. One ledger rebuilt, one lost, eight untouched: death
costs Essence, time and your bag, and never costs identity.

**A level is a body.** The six attribute rungs sum to a level, and the Soul
Forge's existing arithmetic — 35 Essence plus 11.7 per level — is what makes
that number the only one anybody in the world ever says out loud.

## The rulings this design is built on

Every one of these came from the owner during the design pass. They are listed
because each of them closes a door that would otherwise look open.

| Ruling | What it forecloses |
| --- | --- |
| Near-future naming everywhere | No fantasy register in the career area. Engineering, not smithing; Chemistry, not alchemy; Background, not class; Species, not race; Kit, not gear. |
| The sheet is diegetic | No numbers on screen, ever. Eleven in-world surfaces replace every menu, and a medic's note replaces a stat block. |
| Adaptive Mutation is Bloomfall's alone | It is the *first instance* of the region-signature rule, not a world-wide system. Every other region gets its own slot. |
| Faction reputation is deferred | Standing-with-companions is designed; faction reputation and alignment wait for the kingdom-management pass. |
| Chemistry and Refining stay apart | Different institutions, and merging them would put the setting's two sharpest moral ceilings on one sheet. |
| The player never fails a dose check | Companions do. The player always chooses, which is what makes the choice mean anything. |
| Corruption pays as well as charges | Phase 2 pays Conductivity, 4 pays Acuity, 6 pays Resilience. The ladder is the fastest progression path in the game. |
| Hard end at phase 7 | No playable abominations. The campaign continues with what is left. |
| Instruments and institutions can be beaten; people never can | The whole of `suspicion` follows from this one line. |
| The Forge never records chrome | Which makes augmentation the *alternative* to reclamation rather than a complement, and gives the Ascendancy its tragedy. |
| Hybrid shortfall | The first rung lost to a shortfall is permanent; the rest regrow at about one a day. It reconciles canon's savage arithmetic with canon's "nobody dies of it". |
| The Unregistered are opt-in hardcore | True death from minute one, behind a warning at the desk, with the clerk making you say yes twice. |
| Conductivity is a sixth attribute | Overruling an earlier recommendation to leave it out. It is the number the harvest economy reads, and the only attribute an instrument can measure. |
| Neither `the-unnamed` nor `the-war-teaches` is edited | The seat-after-Tino brief rides in `companions`; the tutorial beat map is deferred entirely. |
| Tutorial design waits for the prologue pass | Teaching order belongs to whoever writes the prologue arc. See the deferral below. |

## What landed where

The pass wrote 41 new entries, appended design layers to 13 dossiers, amended 2
locked rules by hand, added 29 back-links so every new entry is reachable from
the world, and made 21 meta corrections.

**New SYSTEM entries** — `enlistment`, `attributes`, `skills`, `kit`,
`cybernetics`, `suspicion`, `the-wound-model`, and `the-six-pillars` with its six
children (`thermodynamics`, `kinetics`, `structure`, `biologics`, `cognition`,
`resonance`).

**Design layers appended** — `character-progression`, `character-classes` (now
titled *Backgrounds*), `magic`, `professions`, `the-corruption-system`,
`survival`, `companions`, `environment`, `combat`, `battle-management`,
`reclamation`, `lasting-wounds`, and a region design note on `port-arcadia`.

**Species** — five peoples joined `human` under `humanoid`: `returnees`,
`carriers`, `chartered`, `the-unregistered`, `the-latent`. Three more are held
as slots on `humanoid`'s open questions (the Benthic, the Aerials, the Quiet),
plus a returned giver whose existence is canon's to reveal.

**Named pieces** — six ITEM entries demonstrating the provenance law:
`shattermarket-plate`, `tempest-shell-case`, `the-southside-rifle`,
`ansels-sample-case`, `choir-ledger-page`, `the-single-name`.

**People** — sixteen CHARACTER entries, all `PROPOSED`, all with bracketed
placeholder names: the four Kestrel command staff `the-unnamed` reserved, and
twelve teachers who each hold one skill ceiling. Under the standing rule,
whoever names them, names them.

**The two amendments.** `the-three-origins-of-magic` had its flat school list
replaced with the six pillars and twenty-seven classes, with all fourteen
original names carried and mapped. `the-taxonomy-of-monsters` gained a fourth
category — the chartered — and one clause on the writers' line. The ban on a
fourth origin is untouched, and the three original monster categories are
untouched.

## What was deliberately NOT done

- **The tutorial map.** II·18 of the bible maps every system to the prologue
  beat that teaches it. It writes nothing. Teaching order belongs to whoever
  authors the prologue arc, and the arc is not written — the map keeps until it
  is. Its value in the meantime is negative space: it shows which systems
  already have a beat that would teach them and which would need one invented.
- **`the-unnamed` and `the-war-teaches` are untouched.** The command staff claim
  four of `the-unnamed`'s slots by *being written*, which is how that rule says
  slots are claimed.
- **Region layouts.** Regions received connections and characters only. No
  region was laid out, because the pass is about the player and the codex is
  still growing.
- **Faction reputation and alignment.** Deferred to kingdom management. Nothing
  in this pass writes to `reputation` or `faction-membership`.
- **The Veil.** Untouched by request.

## The schema change, and its backfill

`characterMetaSchema` gained four keys — `background`, `professions[]`,
`skills[]`, `cybernetics[]` — all free text rather than slugs, because a trade
rung and a skill rank are positions *inside* a system dossier rather than
entries of their own, and a slug-typed field whose target can never exist is a
link that structurally cannot come true.

Every field on a sheet is required-but-nullable, so a sheet that omits a key is
rejected whole. That means the schema change and its backfill had to ship
together, and they did: `scripts/backfill-character-bible-ledgers.ts` filled all
thirty character sheets. The same four keys were added to the sheet form, the
empty-sheet definitions in `backfill-entry-sheets.ts` and
`audit-story-connections.ts`, the create action, and the two content modules
that build character sheets in code.

The five damage types were promoted from `bloomfall-adaptive-ladder` to
`packages/shared` as `storyDamageTypes`. The Bloomfall constant now re-exports
the shared one so the region and the game cannot drift. There is no COLD type
and none is coming: Cryogenic deals PHYSICAL, because its signature is *vitrify,
then strike*.

The `races` shelf was renamed to `species`, with `races` and `creatures` both
redirecting to it permanently through `renamedStoryCollections`.

## How to re-run it

```
pnpm --filter @habitat/web exec tsx scripts/integrate-character-bible.ts            # preview
pnpm --filter @habitat/web exec tsx scripts/integrate-character-bible.ts --apply    # write
pnpm --filter @habitat/web exec tsx scripts/audit-character-bible.ts                # verify
pnpm --filter @habitat/web exec tsx scripts/audit-character-bible.ts --write-art-manifest
```

The runner is idempotent: every append cuts back to its own marker before
reapplying, so a second run replaces its own work rather than stacking a second
copy underneath. **Every layer needs its own marker if its heading differs from
`## Designed`** — this was learned the hard way when the `environment` design
note stacked three copies before anybody looked. `reclamation` and
`lasting-wounds` carry markers of their own for the opposite reason: both
already had layers from the Soul Forge pass, and this one lands underneath.

Every append is proved by a word-level loss check against the prose it lands
under. The pass reported **zero author words not carried** on every run.

`--rewrite` allows updating entries this pass authored. Without it, an existing
slug is reported and left alone, because the codex owns whatever has happened to
an entry since it was written.

## The verification pass (2026-08-30, same day)

A full review after the integration: audits re-run, idempotency re-proved, and
two independent word-by-word proofreads over every new body. What it changed:

- **Prose repairs in the pass's own entries** (applied with `--rewrite`):
  two US spellings brought to British (`tranquilliser`), four grammar slips,
  the Thermal ability list re-ordered to match every other class entry, the
  ambiguous bare *Anchor* under Shroud prefixed *Empathic*, and the reclamation
  addendum's nine steps given real list markers — single newlines collapse to
  one paragraph in the codex renderer, so they were rendering as a wall.
- **Numbers reconciled**: "Eight teachers" listed six (now six, with Trauma's
  ceiling credited to [[the-kestrel-medic]], which closes the 20-skill roster);
  "Seven of ten materials" named six (now six, both places); the standard rig's
  two delivery rates unified under one rule — *it always reads one charge
  high*; the corruption enumerations no longer skip phase 3 (attributes) or
  phase 5 (the tells ladder).
- **Contradictions removed**: the shell case no longer asserts the guns held
  (whoever writes the battery officer still decides); three command staff no
  longer carry the "only this person can teach the ceiling" boilerplate their
  own next sentence denied; the scout's assay line no longer reuses the
  Latent entry's superlative against itself.
- **UI chrome finished the species rename**: every user-facing "race" string
  in the shelf, sheets, profile eyebrow, and connection relations now says
  "species" (`belongs to this species`, `is one of this species`). Variable
  names and the on-disk `races/` art directory deliberately keep the old name.

Left alone on purpose: the `arcadian-soverign-guard` slug (frozen, pre-dates
the pass), the `hippogriff` slug under the "Hypogriff" title (owner tidy-up),
`[[sinkroot-fiber]]` and `[[national-defense-directorate]]` (US-spelled frozen
slugs), and every deliberate fragment, paradox, and dark line — see the
mature-content ruling. The Survival Craft *Marsh Sense* gloss ("predict a
coordinated response") is vaguer than its fifty-nine siblings and is left for
the owner to sharpen, as is whether "the Gun" in the Southside rifle's open
question is the maker or the rifle.

## Where the remaining design material lives

The bible artifact itself — Part II·20 (interlocks), Part III·11 (seven combat
simulations run on paper), and Part IV (the manifest) — is design process rather
than canon and is not in the codex. It is the working document that produced
everything above.

Open art slots are recorded in `Docs/MARTINO_CHARACTER_BIBLE_ART.md`, regenerated
by the audit.
