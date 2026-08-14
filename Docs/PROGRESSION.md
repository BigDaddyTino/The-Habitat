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

The single exception is administrator ownership rollback. `VERIFIED_PLAYTIME` entries are cumulative deltas recomputed from total verified seconds, and the ledger carries a database `CHECK` that every amount is positive, so a reversal cannot post a negative compensating row. Detaching an identity therefore drops the newest playtime entries until the remaining sum no longer exceeds the recomputed target and re-adds any remainder under the same cumulative dedupe key. Quest XP is never touched this way. What was removed is recorded on the `IdentityOwnershipTransaction` reversal row, so the ownership ledger — not the XP ledger — is the audit trail for a rollback.

Levels 10, 25, 50, 75, and 100 award milestone achievements through the same reward pipeline as other achievements. Rewards can include selectable titles, avatar borders, profile layouts, badges, medals, trophies, and rarity-aware ceremonies. Reconciliation is idempotent, so historical imports and worker retries cannot duplicate XP or inventory.

## Presentation

Profiles show level bars, equipped rewards, selectable inventory, claimed identities, and an earned-only trophy cabinet. Achievement ceremonies coordinate a Three.js particle scene and Canvas2D Rive state machine from one clock, with a reduced-motion-aware alternative and non-WebGL fallback.
## Seasons

Seasons are an optional three-calendar-month goal layer. They never reset or
subtract from `UserXpEntry`, Habitat level, achievements, titles, records, or
previous rewards. A member explicitly joins through `/seasons`; the worker then
reconciles only source-confidence-100 activity inside that season's half-open
time window into a separate `SeasonXpEntry` ledger.

Each season can carry personal quests, whole-lodge team quests, and one or more
per-game expeditions. Community XP is the sum of the enrolled members' season
ledger, not a synthetic counter. Closing is replay-safe: the worker snapshots a
season Chronicle, issues persisted commemorative trophies, adds the first-season
founding reward, and marks the season complete. Those rewards stay on the
physical seasonal shelf in the trophy cabinet after future seasons begin.

Seasonal trophies are earned, not granted for enrolling. Each season carries a
`trophyXpRequirement` (1,500 season XP for First Light); at closure only members
whose own season ledger cleared that bar receive the commemorative piece and, in
the first season, the Founder's Lantern. Progress toward the bar is visible on
`/seasons` and `/leaderboards/season` for the whole season, and the closing
Chronicle records the requirement alongside how many members met it. Missing the
bar costs a member nothing permanent: lifetime XP, level, achievements, titles,
records, and previously earned trophies are untouched either way.
