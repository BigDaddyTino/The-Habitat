# Habitat Progression

Habitat levels run from 1 through 100. The cumulative threshold is `floor(50 × (level - 1)^2.2)`, placing Level 100 above 1.2 million XP. The curve is intentionally a multi-year community record rather than a seasonal pass.

## XP Sources

- Verified playtime awards 1 XP per five cumulative minutes. Partial sessions carry across session boundaries.
- A session must belong to a verified player identity, have 100% source confidence, and provide a measured duration from the Palworld presence adapter or a paired legacy-history session.
- Four weekly quests rotate every Monday at 00:00 UTC. The deterministic shuffle always includes playtime, visit-count, and distinct-game objectives plus one additional random contract.
- Weekly quest rewards are automatic and replay-safe. There is no manual claim action.
- Anonymous observations, unpaired log sightings, entered social handles, Steam global playtime, and estimated time award no XP.

Every XP grant is an append-only `UserXpEntry` with a database-unique dedupe key. The displayed level is calculated from the ledger rather than stored as mutable profile state.

## Milestones

Levels 10, 25, 50, 75, and 100 unlock achievement milestones. Their existing achievement reward pipeline grants selectable titles, avatar borders, profile layouts, and badges. Reconciliation is idempotent, so importing an older verified session or replaying a worker cycle cannot duplicate XP or rewards.
