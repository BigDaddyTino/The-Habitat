# SOL 5.6 — The Crown · art ledger

Commission: `Docs/art/SOL56_KINGDOM_ART_PROMPT.txt` (issued 2026-09-02).
Drop-in root: `apps/web/private/codex-art/kingdom/`. The Kingdom page
(`/codex/kingdom`) picks each plate up on reload and prints the slot path
until then. `apps/web/scripts/audit-codex-art-coverage.ts` is the truth of
what is still owed.

One row per plate. Status is one of: **owed** · **delivered** ·
**refused** (with the reason, never softened) · **revised**.

| Plate | Path | Status | Notes |
| --- | --- | --- | --- |
| The Map Table (hero) | `kingdom/hero.png` | owed | 1672x941, the ruler's eyes, no throne in frame |
| Rank I · The Freehold | `kingdom/rank-i-freeholder.png` | owed | 1200x800, drained plot, signal fire laid unlit |
| Rank II · The Ward | `kingdom/rank-ii-warden.png` | owed | 1200x800, lock-gate blockhouse |
| Rank III · The Township | `kingdom/rank-iii-magistrate.png` | owed | 1200x800, courthouse porch, admission list |
| Rank IV · The City | `kingdom/rank-iv-lord.png` | owed | 1200x800, balcony over the harbor, council argument |
| Rank V · The Kingdom | `kingdom/rank-v-crown.png` | owed | 1200x800, Court Day from the doorway, chair empty |
| Sigil · Might | `kingdom/tree-might.png` | owed | 1024x1024, muster drum, rust red |
| Sigil · Coffers | `kingdom/tree-coffers.png` | owed | 1024x1024, toll counterweight, ledger white |
| Sigil · Works | `kingdom/tree-works.png` | owed | 1024x1024, lock lever handle, brass |
| Sigil · Arcana | `kingdom/tree-arcana.png` | owed | 1024x1024, reserve gauge, Forge blue-white |
| Sigil · Roots | `kingdom/tree-roots.png` | owed | 1024x1024, granary key and stamp, moss |
| Sigil · Faith | `kingdom/tree-faith.png` | owed | 1024x1024, shrine box with an empty slot, bone |
