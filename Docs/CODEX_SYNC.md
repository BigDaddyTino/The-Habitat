# Martino Codex live synchronization

## Outcome

The Codex publishes a complete, immutable resource bundle to a private shared folder. A game-development machine can consume that folder directly by UNC path or run the included mirror command to keep a verified local cache. Habitat remains the only writer; the game side never writes into the Codex database or source-art tree.

This is a second contract, not a replacement for `/api/story/export`:

- `content/snapshot.json` is Bundle v2 and contains every current arc, node, edge, Bible entry, reference, comment, and revision across every status and entry kind.
- `compatibility/canon-v1.json` is the existing canon-only game-build payload, generated from the same stable read.
- `images/` contains the Codex artwork under the same logical paths used by the web application.
- `manifest.json` records exact SHA-256, byte length, MIME type, and image dimensions.
- `current.json` is the only activation pointer. A consumer must finish and verify the referenced immutable release before switching to it.

Authentication records, export tokens, presence heartbeats, courtesy locks, and Warden prompt/audit records are intentionally not game resources and are never copied.

## Shared-folder layout

```text
<share>/
  current.json
  blobs/sha256/<prefix>/<hash>
  releases/<snapshot-id>/
    manifest.json
    content/snapshot.json
    compatibility/canon-v1.json
    images/<logical Codex paths>
```

Release images are hard links to content-addressed blobs when the volume supports them, so unchanged AAA artwork is not stored again for every release. A copy fallback is used when hard links are unavailable. No automatic release deletion is performed.

## Publisher on the Habitat machine

Keep the real local/share path out of Git. For a one-time publish or integrity audit, use an elevated or normal PowerShell session with access to the configured folder:

```powershell
$env:HABITAT_CODEX_SYNC_ROOT = "<absolute local shared-folder path>"
pnpm --filter @habitat/codex-sync sync:publish
pnpm --filter @habitat/codex-sync sync:verify
```

For live updates, install the no-listener WinSW publisher from an elevated PowerShell session. The existing Habitat WinSW binary is copied under a dedicated ignored service name; no port or firewall rule is created.

```powershell
.\apps\codex-sync\scripts\install-publisher.ps1 `
  -InstallRoot (Get-Location) `
  -SyncRoot "<absolute local shared-folder path>"
```

The publisher polls every five seconds by default. It compares the newest Codex revision, table counts/modification times (covering maintenance scripts outside the UI), and the path/size/modified-time inventory of all Codex images. Only a change triggers a full database snapshot and artwork hash. A failed cycle leaves the prior `current.json` untouched and retries; identical content creates no release.

## Consumption on the game-development machine

Use the UNC share path, not an Explorer Network Shortcut or a mapped drive. Services do not inherit a user's Explorer shortcut/mapping state.

The simplest importer sequence is:

1. Read `current.json` from `\\<codex-host>\<share>`.
2. Refuse any unsupported `contractVersion`.
3. Read its `manifestPath` and verify `manifestSha256`.
4. Resolve content and art only through manifest paths; reject absolute paths or `..` traversal.
5. Verify each required file's byte length and SHA-256 before using it.
6. Build/import into a staging location, then record the successfully imported `snapshotId`.
7. If the share disappears or a new release is incomplete/corrupt, retain the last imported snapshot and retry. Never erase good generated assets because a poll failed.

The asset record gives both addresses needed by tooling:

- `logicalPath`: the stable bundle/game identity, such as `/images/characters/keyart/amanda.jpg`. It is deliberately not the web URL — the app serves the same file through the authenticated `/codex-art/characters/amanda.jpg` route — and it does not change when a shelf moves on disk, because importers pin assets by it.
- `path`: the immutable file inside the active shared release.

If a local cache is preferred, clone/install this workspace on the game-development machine and run:

```powershell
$env:HABITAT_CODEX_SYNC_ROOT = "\\<codex-host>\<share>"
$env:HABITAT_CODEX_MIRROR_ROOT = "<absolute local cache path>"
pnpm --filter @habitat/codex-sync sync:mirror
```

`sync:mirror:watch` repeats that operation. It verifies the source before copying, writes into a unique staging directory, verifies every copy, and changes the local `current.json` only after the release is complete. The mirror does not write to the share.

## Operational checks

```powershell
Get-Service CodexSyncPublisher
Get-Content .\codex-sync-logs\CodexSyncPublisher.out.log -Tail 50

$env:HABITAT_CODEX_SYNC_ROOT = "<absolute local or UNC shared-folder path>"
pnpm --filter @habitat/codex-sync sync:verify
```

The old canon API remains available during migration. An Unreal importer should store the last successful Bundle v2 `snapshotId` and should never infer that the newest visible directory is active; only `current.json` makes that claim.

## The release boundary

Since 2026-08-28 the bundle's canon payload comes from a **named, frozen release**, not from a live read of the codex.

Codex Sync publishes two different things and only one of them is game content:

- `content/snapshot.json` mirrors the codex — every entry, revision and comment, for reading. It moves whenever the writers' room does, which is the point of it.
- `compatibility/canon-v1.json` is what an importer turns into game assets. That is subject to the boundary: it is a cut, by name, with a sha256 an importer can pin, and it does not change because somebody saved a sentence.

The manifest records which release the payload came from:

```json
"storyRelease": { "name": "martino-2026.08.1", "sha256": "…", "contractVersion": 1, "cutAt": "…" }
```

The field is optional because bundles published before the boundary existed genuinely lack it — its absence means that canon payload was read live, which is the thing the boundary ended.

**Publishing refuses when no release has been cut.** There is deliberately no fallback to live canon; cut one with `apps/web/scripts/cut-story-release.ts`.
