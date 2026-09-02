# Importing the Codex into the game

The machine that builds Martino reads a **bundle** off the shared drive and
turns it into game assets. This is the contract for that: what the objects are,
what their names are, and what the importer must do to be safe to run twice.

The reference implementation is `apps/codex-sync/src/import.ts`, and it is
runnable — `sync:import` plans, applies, reports and rolls back against a real
share. Anything the Unreal side does should behave the way that does, and where
prose here and that code disagree, the code is right.

See [CODEX_SYNC.md](CODEX_SYNC.md) for how the bundle gets onto the drive, and
[STORY_CODEX.md](STORY_CODEX.md) for what the objects mean to the writers.

## The two payloads, and which one is the game

A bundle carries both, and mistaking one for the other is the single most
expensive error available here.

| File | What it is | Import it? |
| --- | --- | --- |
| `compatibility/canon-v1.json` | Canon only, from a **named frozen release**. `MartinoStoryExport`, contract v1. | **Yes.** This is the game. |
| `content/snapshot.json` | The whole writers' room — every status, every kind, comments and revision history. Bundle v4. | No. It is a reading mirror, and it moves whenever somebody saves a sentence. |

The canon payload does not change because a writer typed something. It changes
when somebody cuts a release, and `manifest.storyRelease` says which one by
name and sha256. Pin that pair. A bundle with no `storyRelease` predates the
release boundary and its canon payload was read live — treat it as untrusted
for a build.

## Object identity — frozen

These names are the contract. They are stable across rewrites, retitles,
reorders and relabels, which is what lets a game asset stay attached to a story
object while a writer changes everything else about it. The codex enforces this
at the source: **slugs and node keys are export identities and are never
renamed.** A rename is a delete plus an add, and the importer is right to treat
it that way.

| Object | Identity | Where it comes from |
| --- | --- | --- |
| Quest arc | `slug` | `arcs[].slug` |
| Scene / step / beat | `arcSlug/nodeKey` | `arcs[].nodes[].key` |
| Branch | `arcSlug/nodeKey#choiceKey` | `arcs[].nodes[].choices[].key` |
| Spoken line | `arcSlug/nodeKey/nn` (two-digit line number, never renumbered — deleting retires it) | `nodes[].lines[].lineId` in `content/snapshot.json`, flattened in `content/dialogue-lines.json` |
| Choice option (spoken) | `arcSlug/nodeKey/opt-edgeKey` | `nodes[].options[].lineId` |
| Bible entry | `KIND:slug` | `bible[].kind` + `bible[].slug` |
| Artwork | `logicalPath` | `manifest.assets[].logicalPath` |

`codexObjectId` in `import.ts` is these four rules as code. Use it rather than
rebuilding the strings, and never key a game asset off a title, a database
`id`, or an array index — titles change, ids are internal, and order is not
part of the contract.

Two identity details that will bite otherwise:

- **`arcs[].entryNodeKeys` is a list**, because a side quest can legitimately be
  entered from more than one place. An importer that must store exactly one
  start uses `entryNodeKeys[0]`, which is emitted oldest-created-first, so the
  arc's original opening can never be silently displaced by one added later.
- **A choice's `label` may be null**, which is an unconditional continuation
  rather than a player-facing option. It is not a missing label.

## Bible kinds and what they are for

Twelve kinds ship today. An importer that does not recognise a kind must
**ignore it and keep going** — kinds are additive and one has been added as
recently as this month.

| Kind | What it carries |
| --- | --- |
| `CHARACTER` | People. Includes companions; `meta.companion` says whether they can join. |
| `CREATURE` | Species and named beasts. A creature with no `meta.parent` is a race. |
| `REGION` | Places, nesting region → place → destination via `meta.parent`. |
| `FACTION` | Organisations, with scope and seat. |
| `ITEM` | Objects and resources. |
| `EVENT` | Timeline moments, ordered by `meta.timelineYearsAgo`. |
| `SYSTEM` | Game mechanics as the writers understand them, with `meta.buildStatus`. |
| `RULE` | Laws of the world that constrain writing. |
| `THEME` | What the story is about. |
| `THREAD` | Narrative development in progress. |
| `COMPANION_MISSION` | One mission in a companion's chain, ordered by `meta.order`. |
| `FLAG` | The canonical name for something one quest sets and another checks. |

`meta` is a typed sheet whose shape depends on the kind, and **every field
inside it is nullable**. A null there means nobody has decided yet, which is a
legitimate state in an open writers' room and never an error to import.

## Flags, and the one thing to get right

A flag is SET where its slug appears in a node's or branch's `effects`, and
CHECKED where its slug appears in a branch's `condition`. Both are free text
that the *game* interprets — the codex deliberately does not parse them,
because the moment it does, writers start writing to a parser instead of to the
story. Match on the flag slug appearing in the string; do not require a syntax.

`completion` on a `QUEST_STEP` is writer intent for whoever authors the real
task in Unreal. It is documentation for a human and is never parsed.

## What an import must do

1. Read `current.json`. It is the **only** thing that says which release is
   active — never infer it from the newest directory on the share.
2. Refuse an unsupported `contractVersion`, on the pointer and the manifest.
3. Verify `manifestSha256`, then every file's `sha256` and `bytes` before use.
4. Resolve every path through the manifest, and reject anything absolute or
   containing `..`.
5. **Plan before writing.** Diff the incoming canon payload against what is
   already imported, by the identities above, and report added / changed /
   removed per object class.
6. **Stage, never overwrite.** Copy into a fresh directory, verify the copies,
   and only then record the release as active.
7. **Record what was taken** — snapshotId, source content hash, and the release
   name and sha256.
8. **Keep the previous release staged** so going back is a pointer move.
9. On any failure, keep the last good import. Never delete generated assets
   because a poll failed or a share went away.

## Two pointers, on purpose

In the import root:

- `current.json` is the mirror's, and means *the newest release copied and
  verified locally*.
- `imported.json` is the import ledger, and means *the release the game is
  actually built from*.

They are usually the same, and they are allowed not to be. A rollback moves the
ledger and leaves the staged files alone, which is what makes it a rollback
rather than a restore. **The build reads the ledger.**

## Running it

```powershell
$env:HABITAT_CODEX_SYNC_ROOT   = "\\<codex-host>\<share>"
$env:HABITAT_CODEX_IMPORT_ROOT = "<absolute local path>"

pnpm --filter @habitat/codex-sync sync:import              # plan only, writes nothing
pnpm --filter @habitat/codex-sync sync:import --apply      # stage and record
pnpm --filter @habitat/codex-sync sync:import --status     # what the build is using
pnpm --filter @habitat/codex-sync sync:import --rollback   # back one release
pnpm --filter @habitat/codex-sync sync:import --rollback --to <snapshotId>
```

The plan verifies the whole share first, so a corrupt or half-written release
fails before a single local file is touched. A dry run against a first import
reports everything as new; after that it reports only what moved:

```text
share     20260828T214359499Z-ddecc4299983 (229 assets), verified
canon     martino-2026.08.3 bc2a226b04e2…
imported  20260828T213012001Z-4b1f0e77a210
  scenes         1 changed
  branches       2 new
```

A release can be new while the canon payload is identical — a writer saving a
comment republishes the bundle without moving the game. The plan says so and
there is no work to do.

## What is deliberately not here

`content/snapshot.json` carries comments, revision history and non-canon work
because the writers' room is the point of it. Authentication records, export
tokens, presence heartbeats, courtesy locks and Warden audit records are not
game resources and are never published at all.

Atlas topology — maps, placements and node placements — **is** in the bundle,
in `content/snapshot.json` since Bundle v3. It is not in the canon payload.
Placing quests on a world map in-game therefore reads the snapshot, and doing
so means accepting that the snapshot moves more often than a release does.
