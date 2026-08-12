# The Habitat – Steam + Club Game Data Expansion Plan

## Goal

Expand The Habitat's existing gamer identity system into a broader **Gamer Profile + Club Game Data platform** without disturbing the dedicated-server architecture that is already working.

## Execution Readiness Review — August 12, 2026

**Verdict: achievable, with the gates and schema corrections in this section.** The product direction fits the repository, but the original version of this plan treated several provider-dependent features as guaranteed and understated the changes needed in the Chronicle, achievement, and record evidence models.

| Capability | Readiness | Required condition |
| --- | --- | --- |
| Steam profile and public library | Ready to build | Explicit member opt-in, Steam privacy handling, and a published Habitat privacy policy |
| Steam achievements | Ready as a bounded second increment | Only for games that expose achievements and only while the member's game details are available |
| Steam published stats | Conditional | Store only fields actually returned per app; never promise a common schema or complete coverage |
| Existing Marvel Rivals profile snapshots | Code exists, live proof pending | Configure a private provider key and validate the current response contract with a real consenting profile |
| Marvel Rivals match history | Provider-supported, not guaranteed | Complete a provider spike for pagination, retention, quotas, terms, and match-detail coverage before the database migration |
| Shared-match and squad analysis | Achievable with coverage caveats | Matching match IDs prove co-participation, not party membership; all involved members must have linked, public, successfully synced profiles |
| Cross-game achievements | Achievable after evidence refactor | Add a normalized activity source and remove hosted-server assumptions from the award path |
| Cross-game records and Chronicle promotion | Achievable after evidence refactor | Record and notification rows need a Club Game activity evidence option; no fake `GameServer` or `ServerEvent` may be created |

### Non-negotiable gates

1. **Consent and privacy before Steam collection.** Steam's API terms require user-requested retrieval, disclosure of stored Steam data, and a privacy policy. Existing verified Steam accounts must be prompted to opt in; verification alone must not silently start a historical-library crawl.
2. **Provider proof before Marvel schema work.** Use a real private API key to capture sanitized fixtures for `/api/v2/player/{uid}/match-history` and `/api/v1/match/{match_uid}`. Confirm pagination, historical depth, field stability, rate-limit headers, permitted caching, and the account tier needed. If this gate fails, retain cumulative snapshots and defer match-derived features.
3. **Last-good-data behavior everywhere.** A private profile, timeout, malformed response, or rate limit updates attempt/error metadata but never deletes or zeroes previously successful data.
4. **No false completeness.** UI totals must say `Steam-reported`, `provider-reported`, or `synced across N games` when provider privacy or coverage can make a total incomplete.
5. **No progression from Steam history.** Steam library hours and imported Steam achievements never create Habitat XP. Cross-game Habitat awards use verified `GameActivity` evidence from supported adapters/providers, not game ownership alone.
6. **Provider kill switches.** Steam enrichment and Marvel match ingestion remain independently optional. Either integration can be disabled without delaying hosted-world monitoring, commands, progression, or Discord.

### Verified external constraints

- Steam profile summaries are available through `ISteamUser/GetPlayerSummaries`; owned and recent games are available only when the member's relevant Steam visibility settings permit them.
- `GetOwnedGames` provides app IDs, names/icons when requested, playtime, and last-played data where available. It is not a source of detailed match history.
- Achievements and published stats are per-app calls and may be absent, private, or unsupported. A complete-library achievement crawl is therefore a background enrichment job, not part of the first Steam sync.
- Steam limits normal Web API use to 100,000 calls per day and requires the API key to remain confidential. Habitat's much smaller expected usage should still use batching, caching, bounded concurrency, and daily request budgets.
- MarvelRivalsAPI.com currently documents player match-history and match-detail endpoints, but it explicitly identifies itself as unofficial and subject to change. Match features must degrade to cached data and be treated as optional provider capability.

Primary references: [Steam Web API overview](https://partner.steamgames.com/doc/webapi_overview), [Steam player service](https://partner.steamgames.com/doc/webapi/iplayerservice), [Steam user summaries](https://partner.steamgames.com/doc/webapi/isteamuser), [Steam user stats](https://partner.steamgames.com/doc/webapi/isteamuserstats), [Steam Web API terms](https://steamcommunity.com/dev/apiterms), [Marvel match history v2](https://docs.marvelrivalsapi.com/player-match-history-v2-19464249e0), [Marvel match detail](https://docs.marvelrivalsapi.com/search-match-19312748e0), [Marvel queued player update](https://docs.marvelrivalsapi.com/update-player-19312752e0), and [Marvel provider disclaimer and plans](https://www.marvelrivalsapi.com/).

The Habitat already has three important data systems:

1. **Hosted Worlds** — Valheim, Palworld, Enshrouded, Project Zomboid, 7 Days to Die, and Dragonwilds using the Habitat Agent, verified identities, Chronicle events, playtime, XP, achievements, records, and server telemetry.
2. **Verified Steam Identity** — members can already verify ownership of their Steam account through Steam OpenID, and matching Steam identities from hosted games automatically attach to that Habitat member.
3. **Club Games** — Marvel Rivals is already implemented as the first non-hosted Club Game, with linked member profiles, stat snapshots, standings, news, and worker-based refreshes.

The next step should **extend those systems rather than replace them**.

---

# 1. Steam Becomes the Gamer Profile Enrichment Layer

Steam authentication is already implemented.

Current Habitat flow:

```text
Habitat Member
      ↓
Verify with Steam
      ↓
Steam OpenID
      ↓
Verified SteamID64
      ↓
UserSocialAccount
      ↓
Automatically claim matching
hosted-game Steam identities
```

This should remain exactly as it is.

The new work is to add the **Steam Web API as an enrichment source after verification**.

### New environment variable

```env
STEAM_WEB_API_KEY=
```

The existing Steam OpenID connection continues proving which Steam account belongs to the member.

The API key is then used only by the Habitat backend/worker to enrich that verified account.

---

## Steam Data Habitat Should Import

For every member who has both a verified Steam account **and an explicit Steam-enrichment opt-in**, Habitat should periodically retrieve and cache:

### Steam Profile

* Steam display name
* Steam avatar
* Steam profile URL
* Public account information actually returned by the API
* Current game information when returned by the profile summary
* Community visibility state

Do not interpret the community visibility state as proof that the game library is visible. Track profile, library, recent-games, achievements, and stats availability separately because Steam privacy settings affect them independently.

### Game Library

* Steam App ID
* Game name
* Game artwork/icon references where useful
* Total lifetime playtime
* Two-week playtime where returned
* Last-played timestamp where returned

The displayed total must be labeled **Steam-reported playtime across the currently visible library**. Preserve the last successful library when a later call becomes private or fails; do not turn a provider failure into an empty library.

### Achievements

Where exposed by the game:

* Achievement list
* Earned/unearned status
* Unlock dates
* Per-game completion percentage calculated as earned achievements divided by the available achievement schema

Achievement sync must be staged and resumable. Start with recently played and explicitly viewed games, then fill older owned games within a daily request budget. The UI must show coverage, for example `1,204 achievements synced across 63 of 487 visible games`, until the scan is complete.

### Published Game Stats

Where a developer exposes them through Steam:

* Game-specific statistics
* Counters
* Progress
* Other published user stats

Published stats have game-defined names and meanings. Preserve the provider key, numeric/string value, app ID, and raw metadata; do not force unrelated game stats into a single universal column or use them for Habitat rewards until a game-specific adapter validates their meaning.

Steam should **not** be treated as the source of detailed match history.

Instead:

> Steam tells Habitat **who this gamer is and what they have played throughout their Steam life.**

Game-specific integrations tell Habitat **what actually happened inside individual games.**

---

# 2. Add Steam Enrichment Without Overloading `UserSocialAccount`

`UserSocialAccount` is already doing the correct job:

* provider identity
* SteamID64
* verification
* profile URL
* public/private preference

Keep it that way.

Do not turn `UserSocialAccount` into a massive Steam-stat table.

Add Steam-specific storage connected to the existing verified social account. Linking through the social-account row preserves provenance and gives Steam disconnect a single cascade-delete boundary.

A practical structure would be:

```text
User
│
├── UserSocialAccount
│      └── STEAM / verified SteamID64
│             │
│             └── SteamProfile
│                    ├── SteamLibraryGame ── SteamApp
│                    ├── SteamUserAchievement ── SteamAchievementDefinition
│                    └── SteamUserStat (later, adapter-approved)
│
└── existing Habitat profile, rewards, and identities
```

`SteamProfile` holds the latest profile-level information, `enrichmentEnabledAt`, section-level public preference, and independent attempt/success/status fields for profile, library, recent-games, achievements, and stats syncs.

`SteamApp` stores shared app metadata once. `SteamLibraryGame` stores the account-specific ownership/playtime facts and becomes the member's cached Steam gaming history.

For example:

```text
SteamLibraryGame

steamProfileId
steamAppId -> SteamApp.appId
playtimeMinutes
playtimeTwoWeeksMinutes?
lastPlayedAt?
lastSeenAt
metadata

unique(steamProfileId, steamAppId)
```

Use a shared `SteamAchievementDefinition` per app and a per-profile `SteamUserAchievement` row with `achieved`, `unlockTime`, and `lastSeenAt`. This avoids duplicating names, descriptions, icons, and hidden flags for every member. A future cross-provider achievement abstraction can be added after a second real provider exists; building it now would add complexity without proving the common contract.

On a successful full-library response, upsert returned games and mark missing rows as no longer visible/current. On a private, empty-without-proof, malformed, rate-limited, or failed response, retain the prior successful rows. Disconnecting Steam deletes the enrichment rows and stops future syncs; the member-facing consent copy and privacy policy must explain this behavior.

---

# 3. Steam Data Should Enrich the Existing Habitat Profile

The existing `/profile` page already contains:

* Habitat Level
* XP
* Trophy Cabinet
* Titles
* Avatar
* Cosmetics
* claimed identities
* social accounts
* Club Game profiles

Steam should become another section of this **same profile**, not its own unrelated profile system.

Example:

```text
BIGDADDYTINO
"The Menace"

HABITAT LEVEL 37
██████████████░░

🎮 GAMING HISTORY

Steam Member
487 Games

Total Steam Playtime
8,241 Hours

Achievements
3,842 Earned

Most Played
7 Days to Die — 1,481h

Recently Played
Marvel Rivals
Project Zomboid
Palworld
```

Then the public `/members/[username]` card can expose whichever Steam information the member chooses to make public.

For the first release, use one explicit **Show Steam gaming history publicly** preference rather than field-by-field controls. Private profile pages may show the member their cached data and sync coverage; public pages must require both that preference and the existing social account's `displayPublic` flag. Do not claim `487 Games`, total hours, or total achievements when the library/achievement scan is private, unavailable, or incomplete—show the last successful timestamp and coverage instead.

---

# 4. Important: Steam Playtime Should NOT Replace Habitat XP

The current Habitat progression system has an important design principle:

**Habitat XP comes from verified Habitat activity.**

Keep that rule.

Do **not** suddenly award somebody 80,000 XP because Steam says they played Skyrim for 4,000 hours twelve years ago.

Steam lifetime information is **Gamer Profile enrichment**, not Habitat progression.

Existing verified:

```text
Habitat server session
      ↓
ServerEvent / LegacyPlayerEvidence
      ↓
Verified playtime
      ↓
UserXpEntry
      ↓
Habitat Level
```

remains untouched.

Steam can show:

**Lifetime Gaming History**

while Habitat XP continues representing:

**What you have actually done within the Habitat ecosystem.**

That distinction fits the existing project's strong verified-data philosophy.

---

# 5. Marvel Rivals Remains a Club Game

The repo already contains the correct concept:

```text
ClubGameProfile
ClubGameStatSnapshot
ClubGameType.MARVEL_RIVALS
```

and the existing `/club-games/marvel-rivals` Assembly Room is already built around it.

Do not move Marvel Rivals into `GameServer`.

Marvel Rivals isn't a hosted Habitat world.

It should remain:

```text
Games
│
├── Hosted Worlds
│   ├── Valheim
│   ├── Palworld
│   ├── Project Zomboid
│   └── ...
│
└── Club Rooms
    └── Marvel Rivals
        └── The Assembly Room
```

That distinction is excellent and should become the pattern for future games.

---

# 6. Expand the Existing Marvel Rivals Integration

The existing integration already stores:

* player UID
* display name
* level
* current rank
* peak rank
* rank score
* total matches
* total wins
* K/D
* KDA
* top heroes
* sync status
* last successful sync
* historical stat snapshots

The existing worker also already:

* refreshes stale profiles
* processes them sequentially
* limits the batch size
* stores snapshots
* handles private profiles
* handles API errors
* handles rate limits
* preserves existing data during provider failure

Keep all of this.

Before expanding it, harden the current sync contract:

* add `lastAttemptedAt`, `consecutiveFailures`, and `nextAttemptAt` so success freshness is not confused with retry scheduling;
* honor `Retry-After` and provider rate-limit headers, apply capped exponential backoff with jitter, and enforce a per-run/per-day request budget;
* use a deterministic snapshot key based on profile plus provider update time or a content hash instead of `Date.now()` alone;
* validate responses with shared strict parsers and sanitized fixtures; and
* keep profile refresh and match-history cursors independent so one failure does not block the other.

### The major missing feature is Match History.

That should be the next Marvel Rivals expansion.

Add something conceptually like:

```text
ClubGameMatch

id
gameType
providerMatchId
occurredAt
durationSeconds?
modeId?
modeName?
mapId?
mapName?
seasonKey?
source
providerUpdatedAt?
ingestedAt
metadata

unique(gameType, providerMatchId)
```

and:

```text
ClubGameMatchParticipant

matchId
clubGameProfileId
kills?
deaths?
assists?
damage?
healing?
damageTaken?
score?
scoreChange?
result
mvp
svp
disconnected?
metadata

unique(matchId, clubGameProfileId)
```

If the match-detail endpoint proves that one player can have multiple hero segments, add:

```text
ClubGameMatchHeroPerformance

participantId
providerHeroId
heroName
playtimeSeconds?
kills
deaths
assists
damage
healing
damageTaken
metadata

unique(participantId, providerHeroId)
```

`result`, MVP/SVP status, and player score belong to the participant, not the match. A single match row is shared across every linked member who reports the same provider match ID. Persist only linked Habitat participants by default; do not retain unrelated players' names or identifiers merely because the match-detail response includes them.

Use an overlap-and-watermark ingestion strategy: fetch the newest pages, upsert by provider match ID, stop after crossing the saved watermark plus a small overlap, and perform a separately bounded first-time backfill. Provider retention is not known to be lifetime-complete, so the UI must say `tracked since` rather than claiming complete career history.

This gives Habitat something dramatically more useful than periodic cumulative snapshots while remaining replay-safe and bounded.

---

# 7. Marvel Rivals Match History Unlocks the Real Club Features

Once matches are persisted, The Assembly Room can evolve from:

```text
Current Rank
Wins
K/D
Hero Mains
```

into:

```text
THE ASSEMBLY ROOM

LAST NIGHT
────────────────────

6 Habitat Members
18 Matches

11 Wins
7 Losses
61% Win Rate

🔥 BigDaddyTino
7-3
2 MVPs

💀 Gunnar
3-7
"rough evening"

Most Played Hero
Magneto

Best Match
Victory — 14:32
```

Individual profiles can show:

### Recent Form

```text
LAST 10

W W L W W L W W W L

7-3
70% Win Rate
```

### Rank History

```text
Season Start     Gold I
Current          Diamond II
Peak             Diamond I
Change           +1,482
```

### Hero Performance

```text
MAGNETO

87 Matches
56 Wins
64.4% Win Rate

14.8 Kills
5.3 Deaths
21.2 Assists
```

---

# 8. Detect Habitat Members Playing Together

This becomes extremely valuable once match IDs are stored.

If:

```text
Travis → Match ABC123
Gunnar → Match ABC123
Morg   → Match ABC123
```

Habitat knows they played together.

No manual party tracking is required.

More precisely, Habitat knows they participated in the same match. It must not claim they queued as a premade party unless the provider supplies party evidence. Shared-match features are complete only for members whose match histories are linked, public, and synced over the same time window.

That unlocks:

* most-played duo
* most-played trio
* squad win rate
* best Habitat lineup
* worst Habitat lineup
* games played together
* consecutive nights together
* teammate chemistry
* shared win streaks

Example:

```text
🔥 THE UNHOLY TRINITY

Travis
Gunnar
Morg

147 Matches Together

93 Wins
54 Losses

63.3% Win Rate
```

---

# 9. Cross-Game Habitat Achievements

This should absolutely be added, but it should **extend the achievement system you already built**.

Habitat already has:

```text
AchievementDefinition
PlayerAchievement
AchievementReward
UserAchievementReward
TitleDefinition
UserTitle
```

along with:

* rarity
* points
* secret achievements
* badges
* medals
* trophies
* avatar borders
* layouts
* titles
* ceremonies
* Discord announcements

We should reuse all of it.

There should **not** be a second "Club Game Achievement System."

---

# 10. Add a Cross-Game Activity Layer

There is one architectural issue in the current implementation.

Existing achievements are heavily based on:

```text
ServerEvent
```

but `ServerEvent` requires:

```text
serverId
GameType
```

Marvel Rivals has neither because it isn't hosted by Habitat.

We should **not create fake Marvel Rivals servers just to satisfy that relationship.**

Instead introduce a normalized member gaming activity layer.

Conceptually:

```text
GameActivity

id
userId
gameKey
activityType
occurredAt

source
sourceConfidence
valueNumber
valueText
metadata

sourceServerEventId?
sourceClubMatchParticipantId?
providerEventId?
dedupeKey
```

`userId` is the canonical subject. `gameKey` comes from an allow-listed shared registry that includes both hosted `GameType` values and supported `ClubGameType` values. Use a database check so exactly one supported evidence reference is set when an activity is derived from another persisted row. `dedupeKey` is unique and deterministic, for example `MARVEL_RIVALS:{providerMatchId}:{providerUid}:MATCH_WON`.

One source row may create several activities. A Marvel participant can yield `MATCH_PLAYED`, `MATCH_WON`, `KILLS_RECORDED` with `valueNumber = kills`, and `MVP_EARNED`. Achievement rules must explicitly distinguish counting activity rows from summing `valueNumber` so a ten-kill match is not interpreted as one kill.

Examples:

```text
VALHEIM
PLAYER_DIED
Source: HABITAT_CORE

MARVEL_RIVALS
MATCH_WON
Source: MARVEL_RIVALS_API

PROJECT_ZOMBOID
SESSION_COMPLETED
Source: HABITAT_AGENT
```

The existing `ServerEvent` system remains intact.

The new activity layer gives achievements and records a **common language across hosted and non-hosted games**. It does not feed `UserXpEntry` unless a future, separately approved XP source is added; the existing verified-playtime progression rule remains unchanged.

This requires more than adding rule enum values:

* add `gameKey`/scope support to `AchievementDefinition` because its current optional `GameType` cannot represent Marvel Rivals;
* add `sourceActivityId` to `PlayerAchievement` and refactor the award function so it no longer requires `serverId`, hosted `gameType`, or `playerIdentityId`;
* make `playerIdentityId` and `sourceEventId` optional in record holder/history rows, add `sourceActivityId`, and enforce one valid evidence path with database checks;
* add activity-aware Discord outbox evidence rather than creating a fake achievement/record `ServerEvent`; and
* let the Chronicle query promoted `GameActivity` entries alongside existing `ServerEvent` entries, with stable URLs and source labels.

Do not bulk-copy every historical `ServerEvent` immediately. Add a replay-safe projector for only the activity types needed by enabled cross-game rules, backfill those in bounded pages, compare counts, and then enable the rule definitions. This keeps the first migration efficient and avoids an unused duplicate telemetry warehouse.

---

# 11. Existing Hosted Activity Can Feed the Same Layer

Eventually:

```text
ServerEvent
     │
     ├─────────────┐
     ↓             ↓
Chronicle      GameActivity
                   │
Marvel Match ──────┤
                   │
Future APIs ───────┤
                   ↓
          Achievement Engine
                   ↓
           Habitat Rewards
```

This means a future achievement doesn't care whether a kill came from:

* Valheim
* Marvel Rivals
* Palworld
* some future Riot integration

It simply sees verified gaming activity.

---

# 12. Cross-Game Achievement Examples

### The Menace

**10,000 verified kills across supported Habitat data sources.**

### Ride or Die

**Play 500 tracked matches/sessions with another Habitat member.**

### Main Character

**Earn 100 MVP-style awards across supported games.**

### World Traveler

**Record verified activity in 10 different games.**

### The Boys

**Play a tracked game with four or more Habitat members at the same time.**

### On a Heater

**Win 10 tracked matches consecutively.**

### Professional Victim

**Record 5,000 verified deaths.**

### Variety Pack

**Play five supported games during one calendar week.**

### No Loyalty

**Play 25 different games represented by Habitat.**

### Questionable Life Choices

**Accumulate an absurd verified combination of playtime, deaths, and matches.**

These are catalogue ideas, not all launch-ready definitions. Each enabled achievement needs a versioned rule config, qualifying activity types/sources, aggregation (`count`, `sum`, `distinct`, or ordered streak), time zone/window, tie behavior, and retroactive/backfill policy. In particular:

* `Ride or Die` and `The Boys` require a normalized shared-match/shared-session fact; overlapping presence may be used only when start/end evidence is reliable.
* `On a Heater` must define whether the streak is per game or across all ordered matches and how draws, disconnects, duplicate timestamps, and provider gaps behave. The safe first version is one Club Game with a total ordering by provider timestamp plus match ID.
* `Variety Pack` uses the Habitat product week in `America/New_York`, not an implicit database/server time zone.
* `World Traveler` and `No Loyalty` remain disabled until the number of supported, activity-producing games makes their thresholds attainable. Steam ownership alone does not qualify.
* `Questionable Life Choices` remains disabled until its exact weighted formula and thresholds are written; `absurd` is presentation copy, not an executable rule.

These achievements should continue using the existing Habitat rarities including:

```text
COMMON
UNCOMMON
RARE
EPIC
LEGENDARY
QUESTIONABLE_LIFE_CHOICE
```

There is absolutely no reason to create another reward presentation system—the existing one is already far more elaborate than what this feature requires.

---

# 13. Cross-Game Records

The existing:

```text
RecordDefinition
RecordHolder
RecordHistory
```

system should also expand to support Club Game and cross-game data.

The current engine is not yet generic: definitions are scoped by hosted `GameType`, holders/history require `playerIdentityId` and `sourceEventId`, values are integers, and only a higher number can win. The activity evidence refactor in Section 10 must land first. Extend record definitions with an allow-listed `gameKey`, comparison direction, value/unit formatting, minimum sample size, season/window scope, and a versioned rule config. Prefer scaled integers for ratings and percentages unless a genuine decimal record is required.

This gives us both:

## Hall of Legends

```text
Highest Marvel Rivals Rank
Most Competitive Wins
Most Lifetime MVPs
Longest Win Streak
Most Habitat Games Played
Most Habitat Achievements
```

and:

## Hall of Shame

```text
Biggest Rank Collapse
Longest Losing Streak
Most Deaths
Worst Match
Most Deaths In One Night
Most Hours With No Victory
Most Games Owned But Never Played
```

The current record-history system is especially useful here because Habitat already remembers:

* current holder
* previous holder
* previous value
* date established
* source evidence

So something like:

```text
💀 NEW HALL OF SHAME RECORD

BIGGEST RANK COLLAPSE

Morg
-742 Rating

Previous Holder
Gunnar
-611 Rating

Gunnar held the record for 184 days.
```

fits directly into infrastructure that already exists.

Every launch record still needs an exact formula. Scope rank records to a season when provider rank scales can change. Define `Biggest Rank Collapse` as a positive magnitude derived from two ordered rating observations. Define `Worst Match` with a published deterministic score and minimum playtime. `Most Hours With No Victory` requires gap-free ordered matches with durations. `Most Games Owned But Never Played` is Steam-reported profile trivia, not verified Habitat activity; it must disappear or be recalculated when the member withdraws Steam enrichment and must be labeled with that provenance.

---

# 14. Chronicle Integration

Do not dump every Marvel Rivals match into the Chronicle.

That would turn it into noise.

Instead promote only meaningful Club Game events:

```text
Travis reached Diamond II.

Morg set a new Habitat record.

Gunnar earned "The Anchor."

The Habitat squad won its tenth match in a row.

Travis and Gunnar played their 250th match together.

Morg unlocked a Legendary achievement.
```

This keeps the Chronicle what it already is:

**the memorable history of The Habitat**, not a raw telemetry log.

Today the Chronicle reads hosted `ServerEvent` rows, so Club Game promotion needs an activity-backed Chronicle projection or a merged query with a stable activity detail route. Promotions must use deterministic dedupe keys and be derived only after the source transaction commits. Do not insert a synthetic server event to reuse the current UI.

---

# 15. Worker Architecture

The repo already has the right place for all of this:

```text
apps/worker
```

Current:

```text
Habitat Agent
      ↓
Worker

Steam Personas
      ↓
Worker

Marvel Rivals
      ↓
Worker

Achievements
Records
Progression
Discord
```

Expand it to:

```text
                HABITAT WORKER

Hosted Worlds ───────┐
                     │
Steam Enrichment ────┤
                     │
Marvel Rivals ───────┤
                     │
Future Club APIs ────┤
                     ↓
                 PostgreSQL
                     │
         ┌───────────┼────────────┐
         ↓           ↓            ↓
     Chronicle   Progression   Records
                     │
                     ↓
                Achievements
                     │
                     ↓
                  Discord
```

No new standalone service is necessary right now.

Do not put every provider behind the existing six-hour legacy-history scan as one long serial block. Keep one process, but give each integration an independent due time, batch size, timeout, retry state, and request budget:

| Job | Initial cadence | Batch/concurrency |
| --- | --- | --- |
| Steam profile summaries | 6 hours | Batch up to 100 Steam IDs per summary request |
| Steam library/recent games | 24 hours / 2 hours | Small bounded account batches; no unbounded fan-out |
| Steam achievements | Background/on demand | One account-app work queue with daily budget |
| Marvel profile summary | 6 hours | Current bounded sequential batch, then tune from observed headers |
| Marvel recent matches | 6 hours initially | Small newest-first pages with watermark overlap; tune only after the provider spike proves freshness behavior |
| Activity projection and rule evaluation | After committed ingestion | Bounded replay-safe pages |

The exact production cadence should be configurable within validated minimum/maximum bounds. Store `lastAttemptedAt`, `lastSuccessfulAt`, cursor/watermark, failure count, and `nextAttemptAt` in PostgreSQL so restarts do not cause a full crawl. If a second worker replica is ever introduced, add a PostgreSQL advisory lock or claimable job rows before enabling provider work on both replicas.

The provider's player-update endpoint is documented as queue-based and locked per player for 30 minutes. Do not call it on every poll. Phase 0 must determine whether normal profile/match reads are sufficiently fresh; if explicit updates are needed, schedule an update request and a later read as separate idempotent jobs with the provider lock respected.

All HTTP adapters need timeouts, typed error mapping, redacted logging, injectable fetch functions, and fixture-based parser tests. Provider keys remain server-side, absent from browser payloads and logs. The hosted monitoring cycle must continue even when either external provider is slow or unavailable.

---

# 16. Marvel Rivals Provider Failure

The existing implementation already has the correct philosophy:

**Last good data survives an API outage.**

Keep and expand that.

Instead of:

```text
Marvel Rivals API Offline

ERROR
```

show:

```text
MARVEL RIVALS

Diamond II
57.8% Win Rate
1.41 K/D

Last successful sync:
Yesterday at 10:42 PM

⚠ Stats provider temporarily unavailable
```

During a provider outage, previously ingested matches, rank history, records, and achievements remain available from Habitat's database. This does not override the eventual disconnect/deletion policy: Phase 0 must define what is deleted, anonymized, recalculated, or retained when a member removes a Club Game profile, and the evidence behavior must match that policy.

---

# 17. Club Games Should Become an Extensible Registry

Marvel Rivals is currently the only:

```text
ClubGameType
```

That is fine today.

The current registry is compile-time (`ClubGameType` in Prisma plus the TypeScript list in `apps/web/lib/club-games.ts`), not dynamically extensible. Keep it compile-time for now: adding a trusted integration should require an explicit schema migration, shared adapter, UI registration, and tests. An admin-editable database registry is unnecessary until there is a real requirement to add rooms without deployment.

But the Club Room architecture should now be considered the official home for **games the Habitat plays but does not host**.

Future examples:

```text
Club Rooms

├── Marvel Rivals
│   └── The Assembly Room
│
├── Battlefield
│
├── Call of Duty
│
├── Rocket League
│
├── Fortnite
│
└── Future Games
```

A game should only get a full Club Room if we have a trustworthy enough data source to make it interesting.

There is no reason to build empty rooms simply because somebody owns a game on Steam.

Steam library information belongs on the **Gamer Profile**.

Club Rooms are for games where Habitat has deeper community data.

---

# Recommended Implementation Order

## Phase 0 — Provider and Privacy Proof

Before feature migrations:

* obtain private Steam and Marvel provider keys in the deployment environment;
* publish the Steam data consent, privacy, retention, disconnect, and as-is disclosure language;
* define Marvel link consent and disconnect/deletion behavior for profiles, participant rows, derived activities, achievements, records, and Chronicle entries;
* add an explicit Steam-enrichment opt-in for new and already-linked accounts;
* capture sanitized real-response fixtures for every endpoint and error state;
* confirm Marvel match-history pagination, retention, full-match detail, plan access, rate headers, and caching terms; and
* record baseline provider call counts for the current Habitat membership size.

**Exit gate:** both providers pass contract tests and the Marvel match capability is marked supported or deferred. A failed Marvel gate does not block Steam work or existing cumulative Rivals profiles.

---

## Phase A1 — Steam Profile and Library MVP

Add:

```env
STEAM_WEB_API_KEY=
```

Build:

* Steam profile synchronization
* Steam library synchronization
* independent sync status/freshness and last-good-data handling
* cached Steam app and member-library data
* Steam section on member profiles
* honest gaming-history summaries with privacy and coverage labels
* disconnect cascade and sync opt-out

Keep existing Steam OpenID verification untouched.

**Exit gate:** a public opted-in account, a private account, a disconnected account, an upstream timeout, malformed JSON, and a 429 response all pass automated tests and UI verification. No Steam field changes XP.

---

## Phase B — Marvel Match History MVP

Extend the existing Marvel provider implementation with:

* hardened provider retry and sync metadata
* newest-first, cursor-based match-history ingestion
* deterministic match and linked-participant deduplication
* hero-specific performance only to the depth proved by the provider spike
* recent form
* historical results
* provider-reported rank progression
* shared Habitat match detection with coverage caveats

This provides the biggest immediate improvement to The Assembly Room.

**Exit gate:** replaying overlapping pages creates no duplicate matches or participants; two linked profiles reporting the same match converge on one match; partial failure retains prior rows; private profiles expose no new public data; and the UI labels the tracked-since boundary.

---

## Phase A2 — Bounded Steam Achievements and Stats

Add shared Steam app/achievement definitions, a resumable account-app work queue, per-game completion, and explicit scan coverage. Prioritize recent/on-demand games before older library entries. Add published stats only for an allow-listed game adapter whose fields and units have been validated.

**Exit gate:** unsupported/no-achievement apps are terminal successes rather than endless retries; incomplete coverage is visible; schema metadata is cached once per app; and the configured request budget cannot be exceeded.

---

## Phase C — Cross-Game Activity and Evidence Foundation

Introduce a normalized activity ledger that can accept verified activity from:

```text
ServerEvent
Marvel Matches
Future Club APIs
```

Do not replace `ServerEvent`.

Add this as the bridge between existing hosted-game data and future external-game data. In the same migration series, add Club Game evidence support to achievements, records, Discord outbox rows, and Chronicle projection as described in Section 10.

Start with only the activity types required for the first enabled rules. Backfill in bounded, resumable pages and verify source-to-activity counts before enabling consumers.

**Exit gate:** source replay is idempotent, every activity has allow-listed provenance, no fake server rows exist, and hosted-world Chronicle/progression behavior is unchanged.

---

## Phase D — Cross-Game Achievements

Extend the existing Achievement Engine with rules such as:

```text
CROSS_GAME_EVENT_COUNT
CROSS_GAME_DISTINCT_GAME_COUNT
MATCH_WIN_COUNT
MATCH_STREAK
PLAY_WITH_MEMBER_COUNT
MVP_COUNT
STAT_THRESHOLD
```

Prefer a small generic rule vocabulary (`ACTIVITY_COUNT`, `ACTIVITY_VALUE_SUM`, `DISTINCT_GAME_COUNT`, `ORDERED_STREAK`, `SHARED_ACTIVITY_COUNT`, `STAT_THRESHOLD`) with versioned config over a new enum for every achievement name.

Continue using the existing:

* rewards
* titles
* rarity
* ceremonies
* trophy cabinet
* Discord notifications

Enable only fully specified and currently attainable definitions. Run shadow evaluation first, compare expected awards, then enable ceremonies and notifications.

**Exit gate:** deterministic replay awards each non-repeatable achievement once; provider gaps do not fabricate streaks; secret redaction still works; and no new rule awards XP.

---

## Phase E — Cross-Game Records and Chronicle Promotion

Expand Hall of Legends and Hall of Shame using normalized activity and Club Game match data, then promote only defined milestone/award/record activities into the Chronicle.

**Exit gate:** comparison and tie rules are deterministic, season/window scopes are explicit, evidence links resolve, previous-holder duration is correct, Discord delivery is replay-safe, and raw matches do not flood the Chronicle.

---

## Delivery discipline for every phase

Each phase includes, in the same change set:

1. shared strict domain types and provider parsers in `packages/shared`;
2. additive Prisma schema plus reviewed SQL migration, indexes, foreign keys, and database checks;
3. worker adapter/scheduler code with bounded calls, timeouts, and redacted errors;
4. fixture, unit, replay/idempotency, privacy, and failure-path tests;
5. private/profile UI with mobile and reduced-data/empty/error states;
6. a backup followed by staging migration, bounded backfill, count comparison, and provider-disabled rollback path; and
7. updates to `.env.example`, operations/deployment documentation, and `Docs/BUILD_STATUS.md` only after the phase actually passes its exit gate.

---

# Additional Improvements to Consider Later

## 1. Gamer Timeline

Turn the profile into a retained gaming history with provider coverage and deletion rules:

```text
AUG 12
Reached Diamond II — Marvel Rivals

AUG 10
Earned Habitat Level 37

AUG 07
Unlocked 3,500th Steam Achievement

AUG 03
100th Valheim Death

JUL 28
Started Marvel Rivals
```

---

## 2. Current Club Obsession

Use Steam recent activity + Habitat activity:

```text
🔥 CURRENT HABITAT OBSESSION

MARVEL RIVALS

8 members active
147 matches this week
63 combined hours
```

---

## 3. Squad Chemistry

Once shared matches are stored:

```text
Travis + Gunnar

427 Matches
268 Wins
62.8% Win Rate

Best Streak
14

Most Successful Hero Pair
Magneto + Rocket
```

---

## 4. Habitat Rivalries

Automatically identify close competitors:

```text
⚔️ ACTIVE RIVALRY

Travis
Diamond I — 2,934

Gunnar
Diamond I — 2,917

17 Rating Apart
```

---

## 5. Personal Records

Maintain PRs separately from club records:

* highest rank
* best K/D
* longest win streak
* most kills
* most assists
* most healing
* most damage
* longest gaming session
* biggest rank gain

---

## 6. Habitat Wrapped

Because Habitat retains consented historical data while the relevant connection and retention policy allow it:

```text
THE HABITAT
2026

You played
1,482 hours

You played
37 games

You earned
418 achievements

You recorded
613 victories

You died
2,847 times

Favorite Game
Marvel Rivals

Favorite Teammate
Gunnar

Highest Rank
Grandmaster III

Worst Night
0-11

March 17, 2026

We kept the receipts.
```

---

## 7. Dynamic Gamer Cards

Enhance the existing public member cards:

```text
BIGDADDYTINO
"The Menace"

HABITAT LVL 37

Steam
487 Games · 8,241 Hours

Marvel Rivals
Diamond II

🏆 43 Habitat Achievements
👑 6 Hall of Legends Records
💀 9 Hall of Shame Records
```

---

## 8. Provider Provenance

Habitat already takes verified data seriously.

Continue that visually.

Stats can carry small indicators:

```text
✓ Habitat Verified
✓ Steam Verified
◈ Provider Reported
⟳ Last Sync 2h ago
```

This prevents Steam library information, dedicated-server telemetry, entered gamer tags, and third-party API statistics from ever being misleadingly presented as the same quality of evidence.

---

# Final Architecture

The finished direction should look like:

```text
                         THE HABITAT
                              │
                         HABITAT USER
                              │
             ┌────────────────┼────────────────┐
             │                │                │
       VERIFIED STEAM    HOSTED WORLDS     CLUB GAMES
             │                │                │
       Gamer History     Habitat Agent    Marvel Rivals
       Game Library      Server Events     Match History
       Achievements      Playtime          Rank / Stats
             │                │                │
             └────────────────┼────────────────┘
                              ↓
                         PostgreSQL
                              │
          ┌───────────────┬───┼───────┬──────────────┐
          ↓               ↓           ↓              ↓
       Profiles        Chronicle   Progression    Club Rooms
                                      │
                           ┌──────────┴──────────┐
                           ↓                     ↓
                     Achievements             Records
                           │                     │
                           ├──────────┬──────────┤
                           ↓          ↓          ↓
                        Rewards    Legends     Shame
                           │
                           ↓
                        Discord
```

The core principle should be:

> **Steam tells Habitat which Steam account a member verified and what that account currently exposes. Hosted worlds tell Habitat what happened inside our servers. Club Game providers report what happened in games we don't host. Habitat combines retained, provenance-labeled evidence into one community history.**

That direction fits the architecture already built in the repository and lets us grow the gaming side dramatically without compromising the verified-data, Chronicle, progression, and reward systems that are already working.
