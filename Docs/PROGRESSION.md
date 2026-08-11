# Habitat Progression and Rewards

Habitat levels run from 1 through 100. The cumulative threshold is `floor(50 × (level - 1)^2.2)`, placing Level 100 above 1.2 million XP. It is intentionally a multi-year community record, not a seasonal pass.

## XP sources

- Verified playtime awards 1 XP per five cumulative minutes; partial verified time carries across sessions.
- A qualifying session must have a measured duration and belong to a verified player identity. Current measured sources include paired legacy sessions and supported verified presence observations.
- Four deterministic weekly quests begin Monday at 00:00 UTC. The rotation always includes playtime, visit-count, and distinct-game objectives plus one additional contract.
- Quest rewards are automatic, replay-safe, and have no manual claim button.
- Historic verified sessions become eligible after an admin-approved claim or validated Steam attachment; reconciliation replays them once through the XP/reward pipeline.

Anonymous observations, unpaired sightings, entered social handles, Steam global playtime, and estimates never award XP. They can remain visible as provisional server history until ownership is proved.

## Ledger and milestones

Every XP grant is an append-only `UserXpEntry` with a database-unique dedupe key. Level is calculated from the ledger, not kept as mutable profile state.

Levels 10, 25, 50, 75, and 100 award milestone achievements through the same reward pipeline as other achievements. Rewards can include selectable titles, avatar borders, profile layouts, badges, medals, trophies, and rarity-aware ceremonies. Reconciliation is idempotent, so historical imports and worker retries cannot duplicate XP or inventory.

## Presentation

Profiles show level bars, equipped rewards, selectable inventory, claimed identities, and an earned-only trophy cabinet. Achievement ceremonies coordinate a Three.js particle scene and Canvas2D Rive state machine from one clock, with a reduced-motion-aware alternative and non-WebGL fallback.
