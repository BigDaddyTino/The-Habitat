# Codex Module Schema — building the living world in modules

Status: proposal from the Unreal side, written 2026-08-18, for the Habitat side to build against.
Companion to `Habitat_Story_Codex_Mapping.md` (the Narrative Tales mapping) and the seed fixtures in `Tools/HabitatStoryImport/Fixtures/`.

The goal: multiple writers building one world incrementally — characters, factions, territories, settlements, creatures, items, history — with every connection visible in the app, every unfinished corner findable, and everything shaped so the Narrative Tales plugin can consume it when the game is ready. The world will be full of unanswered areas for a long time; the schema must make *empty* a first-class state, not an error.

---

## 1. The registry principle

**Every entity in the world is one bible entry: one slug, one kind, forever.**

The existing core does not change: `slug` (identity, never renamed), `kind` (one of the eight: THEME, REGION, CREATURE, CHARACTER, FACTION, ITEM, EVENT, RULE), `title`, `summary`, `body`. Prose stays primary — a writer can always create an entry with nothing but a slug, a title, and two sentences, and it is valid.

Modules do not invent new identity systems, new files-as-databases, or parallel registries. A module is a **typed `meta` object added per kind** — one new nullable field on bible entries:

```
bible[].meta : object | null      // shape depends on kind, all fields nullable
```

By the Habitat side's own versioning rule this is additive-nullable, so `contractVersion` stays 1. An entry with `meta: null` is exactly as valid as it is today.

Three laws that make this survive multiple writers:

1. **Every meta field is nullable.** Null means "not yet decided", and the app can build a "needs work" dashboard purely by scanning for nulls and `openQuestions`. Unanswered areas are the normal state of a growing world.
2. **Prose first, fields second.** The body is the source of truth for nuance; meta is the queryable index over it. When they disagree, a human fixes it — the app should surface the disagreement, never auto-resolve it.
3. **Connections are stored once, on the owning side; the app computes the reverse.** A quest node references a character → the character's page shows "appears in" automatically. Nobody hand-maintains both directions, because hand-maintained bidirectional links always desync.

---

## 2. Seed file modularity

Authoring-side, the world ships as one file per module, all in the export's contract-v1 shape, all merging on slug (an entry re-shipped on an existing slug supersedes it — already proven with `port-arcadia`):

| File | Contents |
|---|---|
| `prologue.json` (+ future chapter files) | Story arcs and their directly-referenced bible entries |
| `world-bible.json` | Setting law: pillars, magic, corruption, taxonomy, art direction, RULEs |
| `factions.json` | FACTION entries |
| `characters.json` | CHARACTER entries with full meta |
| `world.json` | REGION entries — territories, settlements, and the map (see §3.2) |
| `creatures.json` | CREATURE entries |
| `items.json` | ITEM entries |
| `timeline.json` | EVENT entries with `when` — the world's history, sortable |

The export itself can stay a single payload; modularity is an authoring and organization concern, not a wire-format one. On the board, each module is naturally a section/tab, and slugs are the API between writers: **link now, fill later** — a `[[slug]]` that doesn't resolve yet is a todo marker, not an error (already the contract's stated philosophy).

---

## 3. Per-kind meta schemas

All fields nullable unless stated. `slug`-typed fields reference other bible entries.

### 3.1 CHARACTER.meta — the writers' priority

```json
{
  "fullName": "string — if longer than the title",
  "aliases": ["string"],
  "pronouns": "string, e.g. 'he/him' — null = undecided, writers use they/them meanwhile",
  "sex": "string | null",
  "species": "string — default 'human'; introducing a new people needs owner sign-off",
  "age": "string, free text: 'late twenties'",
  "appearance": "string, free text",
  "voice": "string — register, speech patterns, what their dialogue sounds like",
  "magic": {
    "origin": "none | born | infused | gifted | null    // mirrors Magic.Origin.* tags",
    "schools": ["string — mirrors Magic.School.*"],
    "corruptionPhase": "0-7 | null",
    "notes": "string"
  },
  "factions": [{ "faction": "slug", "role": "string", "standing": "string" }],
  "home": "region slug",
  "status": {
    "known": "string — what the world/player believes: 'missing'",
    "actual": "string | null — writers-room truth: 'captured alive'. Spoiler-tier: the app should visually gate it, and story content must not collapse known/actual gaps without owner sign-off (the Tino rule, generalized)"
  },
  "relationships": [{ "character": "slug | null", "who": "string when not an entry (e.g. 'the player')", "type": "string" }],
  "storyRole": "string — why this character exists: 'campaign emotional anchor'",
  "involvement": [{ "arc": "slug", "how": "string — authored intent, e.g. 'rescue target of the captivity arc'" }],
  "gameId": "string — the identity the game will use (SpeakerID / actor tag / DA name). Default: derived from slug",
  "openQuestions": ["string"]
}
```

**Quest touchpoints are both derived and authored.** The hard links come free: the app indexes every node `references` entry and (once built) every `speaker` field, so a character page lists every arc and node that touches them with zero maintenance. `involvement` is the complement — authored *intent* for arcs that don't have nodes yet ("Tino: the captivity arc will center him") so planning is visible before writing starts.

### 3.2 REGION.meta — territory, settlements, and the map in one kind

Settlements are not a new kind — a village is a REGION with a tier, matching the game's locked "settlement tiers are content templates" rule. The map is not a separate file — it is the `connections` arrays, which give the app a graph it can render as an actual map view.

```json
{
  "type": "region | zone | settlement | landmark | site | destination",
  // `destination` added Habitat-side 2026-08-18 (additive, contract still v1):
  // the third rung, a place inside a place — the shop inside the district.
  // See Docs/STORY_CODEX.md. An importer may treat it exactly like `site`.
  "settlementTier": "village | town | city | major-city   // only when type = settlement",
  "parent": "region slug — hierarchy: forward-camp-kestrel -> the-starting-island; port-arcadia -> the-peninsula",
  "biome": "string: 'jungle', 'tropical coast', ...",
  "control": [{ "faction": "slug", "kind": "holds | contests | influences" }],
  "population": "string, free text scale",
  "connections": [{ "to": "region slug", "by": "road | river | sea | trail | air | string", "notes": "string" }],
  "status": "string: 'collapsing', 'occupied', 'thriving'",
  "gameTag": "string — Region.* gameplay-tag hint for the importer",
  "openQuestions": ["string"]
}
```

### 3.3 FACTION.meta

```json
{
  "scope": "state | corporate | criminal | regional | religious | supernatural | string",
  "parent": "faction slug — the power this one answers to; null means this IS a major",
  "power": "int | null — PLACEHOLDER, see below",
  "seat": "region slug",
  "leaders": ["character slug"],
  "relations": [{ "faction": "slug", "stance": "ally | enemy | rival | client | unknown", "notes": "string" }],
  "goals": ["string"],
  "gameTag": "string — Faction.* hint",
  "openQuestions": ["string"]
}
```

`parent` runs the same tree law as REGION, SYSTEM, and CREATURE: a major is a
faction with nothing above it, and its wings are derived from their own sheets
rather than stored twice. The shelf is one rung deep — a wing is never itself
a banner.

`power` is a placeholder a writer sets by hand. Strength is meant to derive
from what a power physically holds — territory, cities, wealth, population,
armies — and that algorithm is not built. A major's dossier shows its own
number plus its wings'; nothing else reads it.

### 3.4 CREATURE.meta

```json
{
  "category": "natural | magical | monstrosity | abomination | supernatural   // the taxonomy law as a picker — never free text",
  "biomes": ["string or region slug"],
  "threat": "string, free text",
  "harvest": "string — what the harvest economy wants from it, if anything",
  "gameId": "string",
  "openQuestions": ["string"]
}
```

### 3.5 ITEM.meta

```json
{
  "category": "weapon | tool | substance | relic | document | string",
  "rarity": "string",
  "origin": "string or faction/region slug",
  "gameId": "string — the DA_* asset name once one exists; the asset name is the game's save ID, so once set it never changes",
  "openQuestions": ["string"]
}
```

### 3.6 EVENT.meta — the timeline module

`timelineYearsAgo` (added 2026-08-19, additive): years before the present,
as a sortable anchor for /codex/timeline. Fractions order same-era events;
null = the timeline cannot place it, which is sometimes the canon.

```json
{
  "when": "string — free-text era/date the app can sort: 'prologue', '20 years before opening', 'chapter 1'",
  "where": ["region slug"],
  "involved": ["any slug"],
  "outcome": "string",
  "openQuestions": ["string"]
}
```

EVENT entries with `when` *are* the timeline — the app sorts and renders them; no separate history system.

### 3.7 SYSTEM.meta — the release gate

The mechanics shelf. `category` and `buildStatus` are pickers from the shared
enums; `unlockArc` is the arc slug that unlocks the system for the player —
the tie between pacing and story — with `unlockStage` as prose intent while no
arc exists to link. `dependsOn` lists other SYSTEM slugs this one cannot ship
without, `pillars` are the loop's promises one per line, and `openQuestions`
work as everywhere else. Key art is by convention, not by meta: drop a file at
`public/images/systems/<slug>.png` and the card and dossier pick it up.

Systems nest: `parent` names the SYSTEM this one lives inside (Weather sits
in Environment; the Blood Moon sits in The Sun & Moon), exactly as places nest
under regions. A child without its own release gate ships with its parent.
`regionNotes` is the tie to the atlas — `[{ region, note }]` rows saying how
the system expresses per region (the tropical island cools in winter but never
sees snow); the region dossier shows the same rows back.

### 3.8 THEME / RULE

No meta needed now. Optionally `appliesTo: [kind]` later so the app can surface "rules that govern characters" on character-editing screens (e.g. the Tino rule appearing wherever someone edits his status).

### 3.9 THREAD.meta — the development room

A thread is an evolving narrative concept — an arc, a mystery, a betrayal, a
boss, an ending — argued in the open and never confirmed canon until the room
decides. The development truth lives in `threadStatus`, not in the entry's own
status: the room's open-write law lands every save as a working entry, so the
entry status says nothing about whether the idea is settled.

Every `related-*` field is slugs, never names as text, under the same
link-now-fill-later law the rest of the codex runs on.

```json
{
  "threadStatus": "brainstorming | under-discussion | planned | approved | in-development | implemented | on-hold | rejected | archived",
  "categories": ["main-story | character-arc | companion-arc | mystery | boss-encounter | ending | …"],
  "stages": ["peninsula | endgame | post-credits | …"],
  "priority": "low | medium | high | critical",
  "spoilerLevel": "none | minor | major | ending",
  "parent": "thread slug — the thread this one grew out of; children are derived, never stored twice",
  "characters": ["character slug"],
  "companions": ["character slug, in their companion capacity"],
  "factions": ["faction slug"],
  "locations": ["region slug"],
  "arcs": ["arc slug — the story boards this thread touches, and the trace of what it shipped"],
  "companionMissions": ["companion mission slug"],
  "bosses": ["any slug — a boss can be a character or a creature"],
  "canonPackets": [{
    "id": "uuid, minted server-side",
    "title": "string ≤120",
    "body": "the settled material itself, ≤8000",
    "targetKind": "campaign | region | companions | incursions | events",
    "targetRegion": "region slug — required iff targetKind is region, null otherwise",
    "targetCompanion": "character slug — optional on a companions packet; null is the general bucket",
    "entries": ["any slug this material names"],
    "status": "pending | woven",
    "pushedAt": "ISO timestamp", "pushedBy": "member name",
    "wovenAt": "ISO timestamp | null", "wovenBy": "member name | null",
    "wovenInto": ["arc slug this material actually became"]
  }],
  "tags": ["string"],
  "openQuestions": ["string"]
}
```

`canonPackets` is **required with no default**, and that is deliberate. The
sheet composes the whole meta object client-side and zod strips what it does
not know, so a default of `[]` would mean a sheet that forgot the field
silently deleted every packet on the thread. Required-with-no-default turns
that into a refused save instead. Packets are written only by the three server
actions (`pushCanonPacket`, `markCanonPacketWoven`, `withdrawCanonPacket`) and
carried through untouched by the sheet — see the Canon packets section of
`Docs/STORY_CODEX.md` for the whole road.

THREAD entries are development-room records: the export withholds them
entirely, and a scene that references one exports without that reference.

### 3.10 COMPANION_MISSION.meta — one step in a companion's chain

A first-class record rather than a text field on the character. `companion`
and `order` file it: `companion` names the CHARACTER whose arc it belongs to,
and `order` places it in their chain (Amanda's runs 1–9).

```json
{
  "companion": "character slug",
  "arc": "arc slug this mission actually became, or null while it is only planned",
  "order": 1,
  "missionStatus": "brainstorming | concept | planned | approved | in-development | implemented | cut | archived",
  "stage": "peninsula | endgame | post-credits | …",
  "unlockConditions": "prose — what has to be true before this opens",
  "rewards": ["string"],
  "relationshipEffects": "prose",
  "consequences": "prose — what it changes in the world or the story",
  "characters": ["character slug"],
  "locations": ["region slug"],
  "factions": ["faction slug"],
  "threads": ["thread slug this mission advances"],
  "openQuestions": ["string"]
}
```

`arc` (added 2026-08-20) is what tells an implemented chain step from a
written-down one. The canon navigator links a step to its board when the arc
resolves and renders it dimmed, linking the mission dossier, when it does not —
so a companion's chain shows the whole plan with the built half highlighted,
rather than only the parts somebody got around to building.

Like THREAD, COMPANION_MISSION is withheld from the export.

---

## 4. How Narrative Tales consumes each module

This is the constraint the whole design serves: everything above must either flow into the plugin or be explicitly writers-room-only. Per module:

| Module | Plugin destination | Notes |
|---|---|---|
| **CHARACTER** | **Dialogue speakers.** `slug`/`gameId` → `FSpeakerInfo.SpeakerID` (FName) and the node `speaker` field; `title` → `SpeakerName` (FText). | The live bridge: Narrative Tales links a speaker to a world actor by finding the actor **tagged with the SpeakerID** — so `gameId` is literally the tag the level actor will carry. `voice` guides the writing (and later VO direction); `pronouns`/`bio`/`appearance` are writing reference. Avatar class, transforms, and camera shots are Unreal-side, never board-side. |
| **REGION** | No direct plugin asset. | Drives level/POI work and `Region.*` gameplay tags. Quest `GoToLocation`-style tasks bind to level positions in Unreal; the codex names the place, the level owns the coordinates. |
| **FACTION** | No direct plugin asset. | `gameTag` bridges to `Faction.*` tags and the game's faction/reputation system; `relations` informs writing and eventually world-sim data. |
| **CREATURE / ITEM** | Report-only today; `gameId` is the future bridge to `DA_*` assets. | A node referencing an item with a `gameId` lets the importer eventually resolve real asset references for quest tasks and events — authored in Unreal, informed by the codex. |
| **EVENT / THEME / RULE** | Never imported. | Writers-room canon and law. The importer reads them only to report. |
| **Story arcs** | As already mapped: quest kinds → `UQuestBlueprint`, dialogue kinds → `UDialogueBlueprint`. | The "cinematic dialogue flows" requirement is exactly why `speaker` and `choices[].key` matter: with speakers resolved to tagged world actors, Narrative's own sequence/shot system stages conversations without any camera data ever crossing the contract. Staging, VO, montages, timing: Unreal-side, always. |

The one rule that protects the whole pipeline: **the board owns what the story *is*; Unreal owns how it is *staged*.** Every module field above is on the "what the story is" side. Nothing in any meta schema carries staging.

---

## 5. Multi-writer workflow this enables

- **Claim by slug.** A writer opens a faction entry, takes a hook from "Characters to write here", creates the CHARACTER entry, links `[[faction-slug]]` — the connection graph grows with zero coordination overhead.
- **Link now, fill later.** Unresolved `[[links]]` and null meta fields are the todo system. The app's dashboard: entries with open questions, links with no target, characters with no faction, regions with no connections.
- **Spoiler discipline is structural.** `status.actual` and similar writers-room-truth fields are visually gated in the app, and the standing RULEs (`what-the-player-knows-about-tino`) govern them. Approval filtering already keeps drafts out of the export.
- **The map draws itself.** REGION `connections` + `parent` give the app a world graph: the peninsula, the jungle belt, Port Arcadia's districts as they get written, the island POIs already seeded — renderable as a map view without anyone maintaining a map file.
- **The game side reads it all through one export**, same endpoint, same ETag/304 polling, same version gate. The importer consumes what has a plugin destination and reports the rest.

---

## 6. What this asks of each side

**Habitat:** add `bible[].meta` (nullable object) with the per-kind shapes above; board UI per kind (character sheet, region sheet with connections editor, faction sheet); the derived backlink index ("appears in"); the needs-work dashboard; spoiler gating on `status.actual`-class fields. All additive — no version bump by their own rule.

**Unreal:** nothing new until import time. The already-agreed v-next fields (`choices[].key`, `speaker`, `endingKind`, `completion`, `effects`) stay the priority; `meta` arrives with them or after. The importer's consumption of `gameId`/`gameTag` bridges is future work, gated behind the same field-ownership and non-destruction rules already specced.

**Seeds:** `characters.json` ships alongside this doc demonstrating the CHARACTER schema on the three established characters (Tino, Commander Rook, Steve), including the known/actual status split. Further modules (`world.json` regions with connections, `creatures.json`, `items.json`, `timeline.json`) follow the same pattern as content grows.
