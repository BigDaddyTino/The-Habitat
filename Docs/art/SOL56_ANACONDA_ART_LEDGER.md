# SOL 5.6 — The Blackweir Anaconda art ledger

**Status:** OWED — commission issued, no plates delivered yet

**Commission issued:** 2026-09-02
**Authority:** `Docs/art/SOL56_ANACONDA_ART_PROMPT.txt`
**Canon:** `Docs/bloomfall/BLOOMFALL_BLACKWEIR_ANACONDA.md`

## Acceptance summary

- Commissioned: **25 plates** — 2 figures, 3 scenes, 3 spoils, 17 ability tiles.
- Delivered: **0/25**.
- Format gate: pending. 8 plates at 1672x941 RGB24 sRGB PNG (no alpha); 17 tiles at 256x256.
- Visual gate: pending — Bloomfall palette only, zero-text law, clinical register, phase-two
  scale proof, catalogue-is-order-not-gore.
- Story-lock gate: pending — he never reads as anguished; the marsh is never depicted as his.
- Resolver gate: pending — every path resolves through the auth-gated `/codex-art` route.
- Coverage gate: pending — `scripts/audit-codex-art-coverage.ts` before and after the run.

## Plate ledger

One row per commissioned plate. `revised` means at least one generated candidate was rejected or
superseded during visual QA; the reason is stated in the row. `refused` means a generation tool
declined the subject — the row records the refusal and retains the full spec, per house law.

| Plate | Final path | Status | Bytes | Final SHA-256 | Accepted generated source / source SHA-256 | QA and revision record |
| --- | --- | --- | ---: | --- | --- | --- |
| Phase One — the Mire Stalker | `apps/web/private/codex-art/characters/elias-vey.png` | owed | — | — | — | — |
| Phase Two — the Blackweir Coil | `apps/web/private/codex-art/creatures/the-blackweir-anaconda.png` | owed | — | — | — | — |
| The Fight Ground | `apps/web/private/codex-art/bosses/blackweir-arena.png` | owed | — | — | — | — |
| Letting Go of the Shape | `apps/web/private/codex-art/bosses/the-transformation.png` | owed | — | — | — | — |
| The Specimens | `apps/web/private/codex-art/bosses/the-catalogue.png` | owed | — | — | — | — |
| Blackweir Heart | `apps/web/private/codex-art/items/blackweir-heart.png` | owed | — | — | — | — |
| Anaconda Hideplate | `apps/web/private/codex-art/items/anaconda-hideplate.png` | owed | — | — | — | — |
| Mutated Fang | `apps/web/private/codex-art/items/mutated-fang.png` | owed | — | — | — | — |
| Foreign Material | `apps/web/private/codex-art/bosses/ability-foreign-material.png` | owed | — | — | — | — |
| Prisma Re-Roll | `apps/web/private/codex-art/bosses/ability-prisma-re-roll.png` | owed | — | — | — | — |
| Pylon Draw | `apps/web/private/codex-art/bosses/ability-pylon-draw.png` | owed | — | — | — | — |
| Reactor Weather | `apps/web/private/codex-art/bosses/ability-reactor-weather.png` | owed | — | — | — | — |
| Lunge | `apps/web/private/codex-art/bosses/ability-lunge.png` | owed | — | — | — | — |
| Tail Whip | `apps/web/private/codex-art/bosses/ability-tail-whip.png` | owed | — | — | — | — |
| Acid Spit | `apps/web/private/codex-art/bosses/ability-acid-spit.png` | owed | — | — | — | — |
| Ambush Dive | `apps/web/private/codex-art/bosses/ability-ambush-dive.png` | owed | — | — | — | — |
| Shedding Strike | `apps/web/private/codex-art/bosses/ability-shedding-strike.png` | owed | — | — | — | — |
| Grab and Drag | `apps/web/private/codex-art/bosses/ability-grab-and-drag.png` | owed | — | — | — | — |
| Devouring Surge | `apps/web/private/codex-art/bosses/ability-devouring-surge.png` | owed | — | — | — | — |
| Coil Crush | `apps/web/private/codex-art/bosses/ability-coil-crush.png` | owed | — | — | — | — |
| Toxic Flood | `apps/web/private/codex-art/bosses/ability-toxic-flood.png` | owed | — | — | — | — |
| Tail Tsunami | `apps/web/private/codex-art/bosses/ability-tail-tsunami.png` | owed | — | — | — | — |
| Bile Eruption | `apps/web/private/codex-art/bosses/ability-bile-eruption.png` | owed | — | — | — | — |
| Venomous Roar | `apps/web/private/codex-art/bosses/ability-venomous-roar.png` | owed | — | — | — | — |
| Submerged Stalk | `apps/web/private/codex-art/bosses/ability-submerged-stalk.png` | owed | — | — | — | — |

## Explicit non-commission

- `apps/web/private/codex-art/regions/blackweir.png` already exists and is **not** replaced. The
  arena plate is a separate slot under `bosses/` because it is the same place at a different hour
  and water level, shot from inside the fight rather than from the road.
- The two-phase dossier layout itself is **not** commissioned as an image. It is built as a real
  page at `/codex/bosses/the-blackweir-anaconda`, because the zero-text law makes a
  generated infographic impossible and because real text is searchable, themeable, and editable.

## Refusal and revision record

Known exposure before the run: image tools have previously refused `bloommarked-remnant` and
`the-last-shift` as human-derived subjects, and Phase One is the same class of subject. The
commission mitigates by leading with non-human anatomy and treating the coat and harness as
equipment fused to a serpentine organism. Any refusal is recorded here with the full spec
retained — never softened into a different shot.

*(No refusals recorded yet.)*

## Publication boundary

Every path in this ledger is under `apps/web/private/` and resolves through the authenticated
`/codex-art` route. Art delivery changes no StoryEntry, no database row, no public asset, no
credential, and no infrastructure.
