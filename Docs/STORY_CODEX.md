# The Story Codex

A collaborative writing surface inside The Habitat for **Martino**, the Unreal 5
game, and the canon export that game reads.

It exists because the story is being written by several people who are not all
in the same room, and because the Unreal project on the game machine needs a
single authoritative answer to "what is the story, and where is it going" that
is not a stale copy pasted into a chat window.

Two halves, severable:

- **The codex** (`/codex`) — arcs, boards, the bible, review. Postgres only.
  Works on a fresh clone with no external service configured.
- **The export** (`/api/story/export`) — a read-only, token-authenticated
  projection of canon for the Unreal importer. Inert until a token is issued.

---

## Surfaces

| Route | Who | What |
| --- | --- | --- |
| `/codex` | USER | Story premise, core themes, world libraries, and the audit log |
| `/codex/stories` | USER | The stories room: canon and threads, the room law, and where a new story is opened |
| `/codex/stories/canon` | USER | The canon workspace: the navigator, every board by kind, the canon inbox, and the connection web |
| `/codex/stories/campaign` | USER | The macro board: which chapter hands to which, derived from the endings themselves |
| `/codex/threads` | USER | The development room: story threads argued from brainstorm toward canon |
| `/codex/promises` | USER | The flag ledger: every promise a scene plants and where it comes due |
| `/codex/timeline` | USER | Ten thousand years of the long hunt on one line |
| `/codex/library/[collection]` | USER | Visual, searchable libraries for characters, factions, regions, creatures, items, events, themes, and rules |
| `/codex/arc/[slug]` | USER | The board: cards, branches, inspector, presence |
| `/codex/bible` | USER | The lore bible, filterable by kind |
| `/codex/bible/[slug]` | USER | One entity dossier, relationships, quest appearances, guided sheet, notes, and archive action |
| `/codex/review` | ADMIN | Everything waiting on a reviewer |
| `/admin/story` | ADMIN | Issue and revoke export tokens |

The whole codex sits behind `USER`, not `VIEWER`. It is unreleased plot for a
game that has not shipped, so a signed-in spectator does not get to read it, and
the nav entry is not rendered for them either.

### Writer-first entity workspaces

The Codex does not ask a writer to edit JSON. Its landing page starts with the
game premise and the three current theme entries, then sends the writer into a
visual library for the kind of thing they want to shape. Each library supports
search, create, open, edit, and recoverable archive flows.

Character dossiers expose identity, story role, voice, home, faction and
character relationships, planned arc involvement, open questions, and a visual
picker backed by the game team's supplied model gallery. Faction dossiers expose
scope, seat, leadership, faction stances, goals, game tag, and open questions.
Region dossiers expose hierarchy, biome, population, control, travel
connections, landmarks, game tag, and open questions. Other lore kinds use the
same visual library and natural-language dossier flow without pretending they
have a typed schema that has not been defined yet.

The Warden is available from the landing page and every library as a read-only
writing partner. It sees the existing Codex but still cannot mutate it; a human
must decide what belongs and save it through the ordinary audited action.

---

## The status ladder

Every arc, node, branch, and bible entry carries a `StoryStatus`.

```
DRAFT ──▶ PROPOSED ──▶ CANON ──▶ ARCHIVED
              │
              └──────▶ REJECTED
```

**Only `CANON` is exported — and since 2026-08-18, everything is written at
`CANON`.** Tino removed the approval ladder: the codex is an open writers'
room where every member writes, edits, and removes freely, and the game reads
the result on its next pull. The safety mechanism is no longer a gate but a
ledger — the color-coded audit log at the bottom of `/codex` shows every
change, who made it, and when (green added, yellow edited, red removed or
archived), and `StoryRevision` keeps before/after for every mutation so an
administrator can reconstruct anything.

- Every member creates and edits at `CANON`, including canon written by
  someone else. `isStoryContentEditable` survives as a hook returning true,
  so a review ladder could return without touching call sites.
- `REJECTED` and `ARCHIVED` remain as administrator housekeeping via
  `setStoryStatus` — review after the fact rather than before.
- Canon is never hard-deleted, only `ARCHIVED` — by any member. Deleting it
  would tear a hole in an export somebody has already imported; archiving
  keeps the key addressable. Draft/proposed leftovers hard-delete.
- The review queue at `/codex/review` survives for legacy proposed material
  and only resurfaces on the landing page when such material exists.

---

## Concurrency: what actually protects the text

Three mechanisms, in descending order of how much they matter.

1. **Optimistic concurrency (the real one).** `StoryNode.version` and
   `StoryEntry.version` are submitted with every edit. The write is a
   `updateMany` filtered on that version; a count of zero means somebody saved
   first, and the writer is told to reopen rather than being allowed to
   overwrite. Positions deliberately do **not** bump `version` — dragging a card
   is layout, and must never invalidate an edit somebody has open.

2. **Courtesy locks (advisory only).** `lockedByUserId` / `lockExpiresAt` drive
   the "somebody is writing here" badge. A lock never blocks a save, because a
   lock that could block would strand a node behind whoever walked away from
   their desk. Node and bible-entry locks expire after `storyLockTtlMs` (2 min)
   and are renewed while the writer remains in the editor; the database CHECKs
   that a lock always carries an expiry.

3. **Presence.** `StoryPresence` is a timestamp, judged stale on read
   (`storyPresenceTtlMs`, 45s). It is never deleted on exit — a browser that
   crashes never sends a goodbye. Same reasoning the streaming showcase applies
   to a channel going offline.

### Why not CRDTs

Character-by-character co-authoring (Yjs and friends) needs a stateful
WebSocket server. The web app runs under `next start` behind the tunnel with no
custom server, so that would mean a fourth WinSW service to deploy, monitor, and
keep alive. For a group writing different scenes, per-node concurrency plus live
refresh gets the same practical result. If two people genuinely need to type in
the same paragraph at once, that is the moment to revisit this — not before.

---

## Live sync

`GET /api/codex/stream` is Server-Sent Events. It carries **no story content** —
only `{ cursor }` meaning "something changed". Clients respond with
`router.refresh()`, so re-reading goes through the ordinary authenticated render
path and the stream can never deliver something the server would have withheld.
A dropped stream degrades to a stale page, never a wrong one.

The cursor is the newest `StoryRevision` row, which every mutation writes. That
makes the per-tick probe a single indexed lookup (`StoryRevision_createdAt_idx`)
rather than a scan across four tables.

Operational details that matter:

- `X-Accel-Buffering: no` — without it a buffering proxy holds every event until
  the stream ends, which is indistinguishable from no sync at all.
- A `: keep-alive` comment every 20s, because Cloudflare drops a silent
  connection and a dead stream looks exactly like a quiet board.
- Connections are recycled after 10 minutes. `EventSource` reconnects on its
  own; this only bounds how long one leaked tab keeps a polling loop alive.
- Drags and moves write a `MOVED` revision so they propagate, but the activity
  feed filters `MOVED` out so it does not become drag spam.

---

## The board's problems panel

`analyzeStoryGraph` in `packages/shared/src/story.ts` is pure, so the same
analysis runs on the board and over an export. It reports:

| Problem | Meaning |
| --- | --- |
| `NO_ENTRY_POINT` | Every node is reachable from another — the player can never get in |
| `ISOLATED` | A card wired to nothing at either end, on a board that has others |
| `UNREACHABLE` | No path from any opening leads to it |
| `DEAD_END` | A non-`ENDING` node that continues nowhere |
| `UNLABELLED_BRANCH` | A split where the player cannot tell the options apart |
| `DUPLICATE_BRANCH_LABEL` | The same choice text offered twice from one node |

These are **warnings, never errors**. A story in progress is supposed to have
loose ends, and refusing to save one would make the board useless for drafting.
The export reports them alongside the content so nobody imports a branch that
silently drops the player.

Note that several openings on one board are legitimate — a side quest can be
enterable from more than one place — so multiple entry points are not flagged.

---

## The export contract

`GET /api/story/export`, `Authorization: Bearer <token>`.

```jsonc
{
  "contractVersion": 1,
  "generatedAt": "2026-08-17T12:00:00.000Z",
  "revisionCursor": "…",       // newest change included
  "arcs": [{
    "slug": "the-drowned-chapel",
    "title": "The Drowned Chapel",
    "summary": "…",
    "hook": "A notice board in the fishing village.", // how the party finds it; free text
    "region": { "slug": "port-arcadia", "title": "Port Arcadia" }, // pickup place, from a REGION entry
    "isMainline": false,
    // Added 2026-08-20, additive to contract v1. An importer that only knows
    // `isMainline` keeps reading exactly what it always read; a database CHECK
    // guarantees the two can never disagree.
    "category": "SIDE_QUEST",  // MAINLINE | SIDE_QUEST | CONTRACT | COMPANION_QUEST | INCURSION | WORLD_EVENT
    "companion": null,         // COMPANION_QUEST only: the CHARACTER whose story it is
    "entryNodeKeys": ["the-gate"], // oldest-first; [0] is the importer's canonical start
    "nodes": [{
      "key": "the-gate",        // stable across retitling — the importer's handle
      "kind": "SCENE",
      "title": "The gate refuses him",
      "summary": "…",
      "body": "…",
      "speaker": { "slug": "ashwarden", "title": "Ashwarden of the Low Fen" }, // null = narration
      "endingKind": null,       // SUCCESS | FAILURE | NEUTRAL, ENDING nodes only
      "completion": null,       // QUEST_STEP only: writer intent, free text, never parsed
      "effects": null,          // free-text lines the game interprets; null when none
      "rewards": null,          // what finishing this pays, one line each; null when none
      "continuesInArcSlug": null, // ENDING only: the arc this ending flows into (canon arcs only)
      "choices": [{
        "order": 0,
        "key": "the-gate-choice", // stable choice handle: survives relabel, retarget, reorder
        "label": "Knock again",
        "condition": null,
        "effects": null,
        "toKey": "the-hall"
      }],
      "references": [{ "kind": "CREATURE", "slug": "ashwarden", "title": "Ashwarden of the Low Fen" }]
    }],
    "problems": []
  }],
  "bible": [{ "kind": "THEME", "slug": "…", "title": "…", "summary": "…", "body": "…",
               "meta": null }] // typed module object per kind (Codex_Module_Schema.md); null = not yet decided
  // kinds: THEME REGION CREATURE CHARACTER FACTION ITEM EVENT RULE FLAG SYSTEM.
  // FLAG entries are the canonical names for consequences one quest sets and
  // another checks — both ends reference the flag entry, so a side quest can
  // touch the main story chapters later without the name ever drifting.
}
```

**The `SYSTEM` kind was added (2026-08-19), additive, contract still v1.**
SYSTEM entries are the game's mechanics written down for the writers' room —
what the player can actually do, and when the story hands each verb over. The
meta carries the release gate: `unlockArc` names the quest arc that switches
the system on (`unlockStage` is the prose fallback while no arc exists to
link), `dependsOn` names other systems, and `buildStatus` says how real it is
on the game side. An importer that has never heard of the kind reads these
entries exactly as it reads a THEME it does not act on.

**REGION `meta.type` gained `destination` (2026-08-18), additive, contract still v1.**
The world nests three rungs: a **region** holds **places** (`site`, `zone`,
`settlement`, `landmark`), and a place holds **destinations** — the grocery
store inside the market district, the ward inside the clinic. `meta.parent`
carries the nesting at every rung and is unchanged; `destination` is simply one
more value in an enum the importer already had to tolerate, and an importer
that has never heard of it can read it exactly as it reads `site`. Quests,
characters, creatures and events attach to whichever rung they actually happen
at, and the app rolls them up: a quest picked up at a destination is listed on
that destination, on the place holding it, and on the region above that.

Design points:

- **Keys, not UUIDs.** `key` is stable when a scene is retitled, so renaming in
  the web editor does not orphan the asset the importer already generated.
- **Nothing below canon at any level.** Edges whose far end is not canon are
  dropped, and references to non-canon bible entries are dropped, so the
  importer never resolves against an asset that does not exist on the game side.
- **`contractVersion` is checked, not guessed at.** A half-understood story
  import corrupts assets that are expensive to rebuild.
- **Cheap polling.** Send `revisionCursor` back as `?since=` or as an
  `If-None-Match` ETag; unchanged gets a `304` without the codex ever being
  projected. The cursor is opaque — send it back verbatim, never parse it. It
  is not the same value the live-sync SSE stream emits; the two are not
  interchangeable.
- **Version 1 survives additive change.** `speaker`, `endingKind`,
  `completion`, `effects`, and `choices[].key` were added 2026-08-18 without
  a bump: all nullable, all safely ignored by an importer that predates them.
  The version moves only when the shape changes in a way an old importer
  cannot read.
- **Labels are never blank.** A choice `label` is `null` or genuinely
  non-empty — a database CHECK enforces it — so an importer can rely on
  "labelled" meaning "has text a player can be shown".
- **Speakers resolve.** `speaker` is drawn from a CHARACTER bible entry via a
  picker, never typed free-hand, and a non-canon speaker is withheld like any
  other reference — an attribution always points at an entry in the same
  payload.
- **Cross-arc flow is structural.** An ENDING may carry `continuesInArcSlug`
  — the arc the story flows into next — withheld unless that arc is itself
  canon. Side quests declare where they are picked up (`region` + `hook` on
  the arc) and what they pay (`rewards` on nodes); consequences that outlive
  a quest are FLAG bible entries referenced at both the set and check ends.
- **Parallel branches are legal.** Two nodes can be connected by several
  differently-labelled choices (the consequences live in `effects`);
  `choices[].key` is what tells them apart, not the (from, to) pair.

### Tokens

Issued at `/admin/story`. Only a SHA-256 digest is stored — the plaintext exists
once, in the dialog that mints it, and there is deliberately no way to read it
back. A database CHECK refuses any `tokenHash` that is not 64 hex characters, so
a raw token written into that column is caught rather than silently accepted.
Revoked tokens are kept so `lastUsedAt` still shows when a leaked one was last
tried.

This endpoint is read-only and carries only story content. It is not a
game-management API and exposes nothing about servers, the agent, or members.

---

## Wiring the game machine

On the Unreal box (192.168.86.150):

```bash
# One-time, from /admin/story
setx MARTINO_STORY_TOKEN "martino_…"

# Read the story
curl -H "Authorization: Bearer $MARTINO_STORY_TOKEN" \
     https://habitat.martinobear.com/api/story/export
```

Two consumers are intended:

1. **A UE editor utility** (Python or an Editor Utility Blueprint) that pulls
   the JSON and creates or updates Native Tales assets at design time, keyed by
   `key`. Story stays baked into the shipped build; the codex is not a runtime
   dependency of the game.

2. **The Claude session working in the Unreal project.** Point it at the
   endpoint — via `.mcp.json` or simply the `curl` above in that project's
   `CLAUDE.md` — so it writes quests against the live bible instead of a summary
   that was accurate last week.

**Not yet built:** the Native Tales importer itself. Its asset format has not
been inspected, and guessing at it would produce exactly the kind of
half-understood import `contractVersion` exists to prevent. Someone with the
plugin open needs to document its data assets first; the export shape above was
chosen to be neutral enough to map onto them.

---

## The Warden — the codex assistant

A Gemini-backed helper that has read the arc you are on and the whole bible, and
answers questions about them. Member-only, like the rest of the codex, and fully
audited.

He lives on the board: an ember button bottom-right of the canvas opens his
panel. He knows which card you have open, so "why is this flagged?" works.

### What he is allowed to be

The persona and its rules live in `packages/shared/src/story-assistant.ts` as one
pure string, so the exact text sent to Google is asserted in tests. Two parts of
it are load-bearing and must not be trimmed as flavour:

- **Grounding.** The extract is the only source of truth he has about Martino.
  When something is not written, he says "That is not written yet" rather than
  filling the gap. He sits next to an export that builds a game; confident
  invention would be indistinguishable from real lore to a writer.
- **Untrusted-input framing.** Scene bodies are member-authored prose, so a
  member can type something shaped like an instruction into a card. The extract
  is fenced with explicit begin/end markers and he is told it is story data,
  never a command. He also has no tools and cannot write to the codex, so the
  worst case is a strange answer, not a damaged story.

He also states plainly that he cannot approve anything and knows nothing about
the Habitat's servers, members, or infrastructure — and he is never handed any
of it.

**Nothing he says is written to the codex.** A suggestion becomes story only when
a human types it into a card, which is what keeps the review ladder meaningful.

### What he is shown

One arc plus the bible. Never another arc's board, never anything outside the
story. Archived and rejected material is excluded — asking "what is true" should
not be answered from a branch that was thrown out — and every item carries its
status, so proposed material is never presented as settled. Known loose ends are
handed over so he explains them rather than rediscovering them. Long bodies are
trimmed and marked `[trimmed]` so one card cannot crowd out the board.

### The audit

Every exchange writes a `StoryAssistantMessage`, **including the ones that never
come back with an answer** — rate limited by Google, blocked, unconfigured. A log
that only kept successful answers would hide exactly the pattern worth looking
for. Read it at `/admin/story`.

A DB CHECK ties answer to outcome in both directions: an `ANSWERED` row must
carry an answer, and a non-answered row must not.

The extract itself is not copied onto every row — it would duplicate most of the
story per question. Instead `contextSummary` plus `revisionCursor` pin down which
codex state was rendered, and rendering is a pure function, so any exchange can
be reconstructed exactly.

### Cost and limits

| Control | Default | Env |
| --- | --- | --- |
| Model | `gemini-3.7-flash` | `GEMINI_MODEL` |
| Off switch | on | `HABITAT_STORY_ASSISTANT=off` |

**There is no Habitat-side quota** (removed 2026-08-19). The key runs on
Gemini's free tier, which enforces its own ceiling and answers `429` when it is
reached; the client reports that as rate limiting and names Google as the
source. A second budget on this side only ever refused a writer Google would
still have answered. Requests are still counted into the `ProviderRequestUsage`
table the worker's providers share, and `/admin/story` still reports the day's
total — the counter is for visibility, not enforcement.

### Flash 3.7 is a thinking model — this matters

Verified live: answering "say ready" with a two-token reply spent **108
reasoning tokens**, and a real story question spent **640 thinking tokens against
122 of answer**.

Reasoning is drawn from the same `maxOutputTokens` allowance as the reply, so an
allowance sized only for the ~200-word answer the persona asks for gets consumed
entirely by thinking and returns a **successful response with nothing in it**.
The allowance is therefore 4000, and an empty response with `finishReason:
MAX_TOKENS` reports which knob to turn rather than "returned nothing".

Reasoning tokens are billed and invisible in the reply, so `thinkingTokens` is
recorded on every audited exchange — omitting it would understate the real cost
of an exchange by roughly an order of magnitude.

Also observed live: this model returns **503 "high demand"** fairly readily. The
client retries once after 1.5s and then reports demand specifically, rather than
calling a busy model an outage.

### Prompt size

A four-item context cost 691 prompt tokens. A board with thirty scenes will cost
substantially more on **every** question, since the whole arc travels with each
turn. If a board gets large enough for that to hurt, the next move is to send
only the focused node's neighbourhood rather than the entire arc.

---

## Canon packets — the road out of the development room

Story threads are the room arguing with itself. Canon is what it settled on.
A **canon packet** is the one road between them.

```
a thread        →   the canon inbox        →   a story board        →   locked
(an argument)       (settled, waiting)         (built by a writer)      (finished)
```

A writer opens a thread's dossier, writes down the part that has stopped
being an argument, says where it belongs, and sends it. It lands in the canon
inbox on `/codex/stories/canon`, and the navigator shows a counted bubble
beside whatever it is aimed at until somebody weaves it in.

**Pushing settles nothing.** It is a hand-off, not an approval and not a
freeze — the arc padlock is still the only thing in the codex that makes
anything settled, and it is unchanged by any of this. Marking a packet woven
is a writer saying "I built this", and it records which boards it became;
those arc slugs are unioned into the thread's own `arcs` list, which is how a
thread keeps a permanent trace of what it shipped.

Packets live inside the thread's own `meta.canonPackets`, not in a table of
their own, for two reasons: a packet can never outlive or drift from the
thread it came out of, and the export — which withholds THREAD entries
entirely — never has to learn they exist. Nothing about a packet ever reaches
the game.

Three properties worth knowing before touching one:

- `canonPackets` is **required with no default** in `threadMetaSchema`. A
  sheet that forgets to pass it through is refused whole rather than saved
  without it. The alternative — a default of `[]` — would silently delete
  every packet on the thread the next time anybody edited the sheet.
- Every packet write (`pushCanonPacket`, `markCanonPacketWoven`,
  `withdrawCanonPacket`) re-validates the **whole** meta object through
  `threadMetaSchema` and is version-guarded like any other sheet save.
- Weaving is a one-way door and withdrawing only reaches pending packets:
  woven material is history, and re-weaving would rewrite who did it and when.

`scripts/sweep-story-legacy.ts` reports any packet the inbox cannot read, and
`scripts/audit-story-meta.ts` validates every stored packet against the same
schema the sheet enforces.

---

## What kind of story is this?

Every arc carries a `category`: `MAINLINE`, `SIDE_QUEST`, `CONTRACT`,
`COMPANION_QUEST`, `FACTION_QUEST`, `INCURSION`, or `WORLD_EVENT`. It is what
the canon navigator files by — the campaign spine, then the map (side quests
and the contracts posted at each place), then the companions, then the
factions, then what comes through and what happens to the world.

Three categories are defined by what they are filed to, and the server refuses
one without it: a `CONTRACT` needs a region (being posted somewhere is what
makes it a contract), a `COMPANION_QUEST` needs a character, and a
`FACTION_QUEST` needs a faction.

A faction quest may fly a wing's banner rather than a major's. The navigator
rolls it up under the power that wing answers to and names the wing it came
through, so the shelf stays short without losing who actually did the work —
see the faction hierarchy below.

`StoryArc.isMainline` is **not** replaced. It is the export contract, the
ordering key, and what every arc picker reads, and it stays in lockstep with
the category — a database CHECK refuses any row where the two disagree, so a
writer that sets one column and forgets the other fails loudly instead of
shipping a mainline chapter the game files as a side quest. Three places write
an arc: `createArc`, `updateArc`, and `packages/db/scripts/ingest-story-seed.ts`.

---

## Major powers and their wings

The faction shelf grew past what the room can hold in view, so it runs the
same tree the regions atlas, the systems shelf, and the races library
already do: `FACTION.meta.parent` names the power a faction answers to, and
**a major is a faction with `parent: null`**. Wings are derived from their
own sheets and never stored twice.

The shelf holds **thirty-five powers: ten majors, twenty-one wings, and four
that answer to nobody** — plus the seat left open for the faction the players
may found. One law governs how that is read, and it is written into
`the-faction-map` in canon rather than only here:

> **Major does not mean important.** A major is a geopolitical umbrella —
> something that can move the world's balance on its own. A wing lives inside
> that banner's economic, political, religious, territorial, or military
> sphere, and may be more famous, more dangerous, and far more present in a
> player's story than the power above it. Independence is reserved for what
> operates outside those spheres altogether.

The tree is a **political ecosystem, not a chain of command**. Several wings
despise their banner and say so in their own dossiers — the Foundry Workers
Union organizes industries it cannot strike without stopping Aegis lines; the
Black Tithe insists that stealing from the Stormglass Cartel constitutes
independence; the Meridian Arcane Institute claims academic freedom until the
invoices come due. Being inside a sphere is a fact about where the money, the
ground, and the licences come from, never a statement of loyalty.

What that buys, day to day:

- The factions library lists majors; a wing lives behind the major's dossier,
  exactly as a race member lives behind its race.
- A wing's faction quests roll up to its banner in the navigator and on the
  major's dossier, labelled with the wing they came through.
- Canon material aimed at a wing lights the major's bubble too, the same
  rollup a packet aimed at a room inside a city already gets.

`FACTION.meta.power` is a **placeholder**. Strength is meant to be counted
from what a power physically holds — territory, cities, wealth, population,
armies — and that reckoning is not built. Until it is, a writer sets the
number by hand and a major's dossier shows its own plus its wings'. Nothing
computes anything from it, and `the-power-balance` remains the design entry
describing what will.

The filing itself lives in `apps/web/lib/story-factions-seed.ts` — one row
per wing, each carrying the sentence it was read from and how strongly canon
supports it (CANON / ALIGNED / OWNER-CALL). It also carries the prose: one
additive paragraph per faction recording what the filing means from where
that faction stands, in that faction's own voice, slotted in before its
closing paragraph on the Drain. Alongside them sit the one power the
restructuring invented — **The Free Peoples Compact**, five free peoples who
agree on nothing except that their land is not for sale — and the rewritten
`the-faction-map`. Apply or re-apply the whole thing with:

```
pnpm --filter @habitat/web exec tsx scripts/seed-faction-hierarchy.ts
pnpm --filter @habitat/web exec tsx scripts/seed-faction-hierarchy.ts --apply
```

It never overrules a faction a writer has filed by hand, never adds a
paragraph a dossier already carries, and re-validates the whole sheet before
writing — a seed is not a way around the sheet. Dry run by default; the
printed plan is the review gate.

---

## Ripples — what one quest does that another quest can see

The same scan that builds the promises ledger answers a second question: if a
flag is set in one quest and read in another, those two quests are connected,
and both boards should say so. `getStoryRipples()` derives that web — nobody
maintains it — and it renders twice: as a panel under each board ("this quest
ripples into…", "…and is shaped by"), and as the whole web in campaign order
on the canon workspace.

A flag set and read inside one arc is that arc's own machinery, not a ripple;
only crossings count. `StoryNode.continuesInArcId` is carried as a chain in
both directions.

Amber rows are **future** connections — real, but not walkable yet: a promise
nothing plants, a promise nothing collects, or a flag named in a packet still
sitting in the canon inbox. None of these are errors. They are the parts of
the web that get written down before they get built.

`getStoryPromises` and `getStoryRipples` read one shared `scanStoryFlagSites()`
pass, because two scanners drifted the moment one of them learned about a site
the other did not, and the two pages would then disagree about the same board.

---

## Schema

New tables, all added by `20260817120000_add_story_codex`:
`StoryArc`, `StoryNode`, `StoryEdge`, `StoryEntry`, `StoryEntryLink`,
`StoryRevision`, `StoryComment`, `StoryPresence`, `StoryExportToken`. The
assistant adds `StoryAssistantMessage` in `20260817160000_add_story_assistant`,
and `thinkingTokens` in `20260817173000_add_assistant_thinking_tokens`.

Nothing was added to an existing table, so the codex is severable: dropping
these ten tables leaves the rest of the Habitat untouched. The assistant is
severable from the codex in turn — drop its one table and the boards are
unaffected.

Constraints that live in the migration SQL (documented with `///` comments in
`schema.prisma`, per this repo's convention):

- Slugs and node keys must be kebab-case — they become asset-path segments.
- `StoryEdge_no_self_transition` — a node continuing into itself is a hang.
- `StoryNode_canvas_within_bounds` — a fat-fingered drag cannot park a card
  where nobody can find it again.
- `StoryNode_lock_is_complete` / `StoryEntry_lock_is_complete` — a lock without
  an expiry is a node nobody can ever edit again.
- `StoryComment_targets_exactly_one` — a comment attached to both a node and an
  entry would appear in two discussions and be resolved from one.
- `StoryExportToken_hash_is_sha256_hex` — catches a raw token in the hash column.
- `StoryArc_mainline_category_agree` — `isMainline` and `category` say the same
  thing, or the write fails. Added by `20260820120000_add_story_arc_category`,
  which also backfills `canonPackets: []` onto every THREAD and `arc: null`
  onto every COMPANION_MISSION, because a stored row that is missing a key the
  schema requires would be refused on its next sheet save.

Both ends of an edge living in the same arc is enforced in the server action
rather than by a composite foreign key, because a two-relation composite FK
through `arcId` would need Prisma to own the same column from two sides.

**Never run `prisma migrate dev` in this repo** — hand-write the SQL and apply
with `prisma migrate deploy`.

---

## Deploy

Order matters, as always:

```
pnpm --filter @habitat/db exec prisma migrate deploy
pnpm build
# restart HabitatWeb (and HabitatWorker if worker code changed)
```

The worker is not involved in the codex — no worker change is required for this
feature, and no migration here affects an enum the worker writes.

---

## Known gaps

- The Native Tales importer, as above.
- Bible `[[slug]]` cross-links are stored as plain text; nothing resolves them
  into links yet.
- The board has no undo. `StoryRevision` records `before`/`after` for every
  mutation, so the data to build one exists, but no UI reads it.
- Comments are node- or entry-scoped only; there is no thread on a branch.
- Search over the bible is a `contains` scan. Fine at the scale of one game's
  lore; it would want a real index long before it became slow.
