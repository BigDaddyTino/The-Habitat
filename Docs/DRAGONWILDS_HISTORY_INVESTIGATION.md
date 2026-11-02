# Dragonwilds history investigation

Investigated 2026-10-31. Times below are America/New_York (EDT).

## Finding

Previously imported player history remains in the production database. The connection audit is reporting an empty scan of the currently retained raw logs, not deleted database history. The evidence points to loss of older source logs around the morning restarts; the exact deletion or cleanup mechanism was not observed.

- The database retains two Dragonwilds player identities, two participation-evidence records, two joined events, and two left events from August 15. No unresolved Dragonwilds history-evaluation failures were found.
- The collector last successfully scanned at 8:16 a.m. on October 31 and yielded six records: the two evidence records plus four events. These were already imported, so the scan created no duplicates.
- The game service started at 8:48 a.m., stopped at 8:54 a.m., and started again at 8:56 a.m. Its current process started at 8:56 a.m.
- The allow-listed history folder now contains exactly two readable, untruncated game logs. They begin at 8:48 and 8:56 a.m. and contain world-save activity but no player-added/removed, login-request, or successful-join entries during inspection.
- The game-service stdout log also contains no matching player session records. No older Dragonwilds session-log backup was found in the checked game, service, dedicated-server-backup, or filesystem-shadow-copy locations. This does not establish that no other backup exists.
- The worker remains running. Its configured history-scan interval is six hours, which explains why the stored collector status still describes the earlier successful scan while the on-demand audit sees the new empty logs.

## Change and validation

The connection audit now reports the current source-file count and the number of previously imported evidence records still present in the database. Its failure status is retained when a source yields zero records; stored old history does not prove that a current parser still works.

The updated production audit reports two current source files, zero current player records, and two previously imported evidence records retained. The other ten connection checks pass. Worker typecheck passes, and all 14 existing history-parser tests pass, including the Dragonwilds join/leave case. No game process, game configuration, database history, or member ownership was changed during this investigation.

## Remaining verification

A real player join and leave on the current game version is needed to verify the new log output and the complete import path. Existing fixture tests alone do not establish that the updated game still emits the expected format. Do not fabricate a session or reconstruct raw game logs from database rows to clear the audit.

Before a future restart/update, preserve the actual game logs outside the game's rotation directory. Existing imported history is durable in the database; durable raw-log retention is a separate operational improvement. Any archive integration must preserve original timestamps and hashes, avoid duplicate events, and keep current-source failure visible rather than letting old archive records mask it.
