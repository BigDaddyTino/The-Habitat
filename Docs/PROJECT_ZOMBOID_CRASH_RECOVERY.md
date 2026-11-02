# Project Zomboid crash recovery - 2026-11-02

The owner reported repeated crashes of the existing mod-free Build 42 world. The retained evidence establishes a native game crash on November 1, following the October 31 installation migration. This recovery preserves that world, player data, server settings, and the separate Build 41 backup.

## Evidence

- The fatal JVM report records `EXCEPTION_ACCESS_VIOLATION` (`0xc0000005`), a null-address read in `PZPopMan64.dll+0xef6b`, on the `MapCollisionDataJNI` thread during `ZombiePopulationManager.n_updateThread`. The process had run for approximately 3 hours 42 minutes.
- Immediately before the crash, the game reported `EOFException` reading `media/maps/Muldraugh, KY/chunkdata_25_17.bin` from the installation. That file predates the Build 42 migration and is absent from a fresh installation of the same current stable build.
- Comparing the installed media tree with the clean Steam download found 2,363 files absent from the fresh installation. The earlier migration removed obsolete loose Java classes but left these obsolete media files. Steam validation does not establish that untracked legacy files have been removed.
- The installed native library and packaged game JAR have identical SHA-256 hashes to the clean download. The discrepancy is obsolete extra installation files, rather than differing copies of those two current binaries.
- The service requested a 16 GiB initial and maximum Java heap on a shared host with 16 GiB physical RAM. The fatal report records about 10.4 GiB of used Java heap and only 585 MiB of free physical memory. This is an unsuitable allocation for this host, but the report does not establish an out-of-memory exception as the direct cause of the native crash.

The stale map-file error is a strong lead, not a reproduced proof of the native defect. A short successful startup cannot establish that an hours-later gameplay crash is permanently resolved.

## Repair

1. Backed up the entire current world data directory, including settings and account database, plus the service definition and original crash/service logs. The source and pre-repair world copy had matching totals of 16,056 files and 99,900,677 bytes.
2. Downloaded Steam app 380870 into an empty protected directory and validated it. Steam explicitly reported successful installation of stable build 25485538 (game version 42.21.0). No beta branch or mod was introduced.
3. With the game and updater stopped and the shared Steam mutex held, moved the entire previous installation into the protected recovery folder and activated the clean installation at the existing service path. The existing world data directory remains separate and unchanged by this cutover.
4. Set the initial Java heap to 1 GiB and maximum heap to 4 GiB. These limit the Java heap, not the process's native allocations or total resident memory. Future launcher synchronization preserves configured limits; full installation reads the same settings from the ignored private configuration.
5. Started the world through the existing authenticated agent/worker lifecycle path using an explicitly audited recovery command. No new control endpoint, network exposure, automatic restart loop, world reset, password change, or unrelated game restart was introduced.

The protected recovery folder contains the previous installation, full world snapshot, crash evidence, service/configuration before-files, Steam validation output, and inventory of obsolete files. Its exact local path is recorded in ignored recovery data. Retain this evidence for rollback and any recurring crash investigation; do not restore old media files into the clean installation.

## Configuration and checks

- `projectZomboidInitialHeapMiB` and `projectZomboidMaxHeapMiB` in ignored `game-services.json` default to 1024 and 4096. The example configuration documents these fields.
- `sync-zomboid-launch.ps1` validates and preserves `HABITAT_PZ_INITIAL_HEAP` / `HABITAT_PZ_MAX_HEAP` in the service XML while synchronizing the vendor classpath/native-library path. Invalid values leave the service file unchanged.
- Four isolated launcher tests pass: migrate the old 16 GiB arguments to safe defaults, preserve custom limits across repeated synchronization, reject initial heap above maximum, and reject invalid values.
- All twelve existing PowerShell update-workflow scenarios pass, including Zomboid stop/update/start and failure handling. Agent TypeScript checking and the read-only six-service installation check pass.
- Live startup reached `SERVER STARTED`, loaded the existing world's dictionary/zones, and bound both configured game ports. Production monitoring observed the process running and game query reachable with actual state `ONLINE` across subsequent polls. The recovery Start command succeeded.
- After startup, the account database still matched its pre-repair SHA-256 hash, all server INI setting values matched the backup, and the sandbox configuration matched its backup hash. The game rewrote INI formatting; this was not a settings change. Both mod lists remain empty.
- No new fatal native report, map-file EOF exception, or Java out-of-memory error was observed during startup. Existing vanilla asset/script and room-metadata errors still appear in stderr; the same categories exist in the retained pre-repair logs, and they did not prevent this startup. Do not describe the logs as error-free or reset map metadata merely to silence them.
- Longer play-session stability remains a follow-up, because the observed crash happened after several hours with players. The 4 GiB Java heap limit does not make this shared host's total memory unlimited; further tuning should use actual gameplay measurements.

## Post-repair verification

Read-only review on the running server after the repair, with an empty server and no restart, setting change, or client join.

- **Crash trigger:** every valid `chunkdata_*.bin` measures 2 + 64n bytes. All 4,065 clean-installation files and all 32 world-save files fit; 187 of the 192 obsolete Build 41 files do not, including `chunkdata_25_17.bin`. `PZPopMan64.dll` contains its own `EOFException`, consistent with that read failing just before the null read in the same library. No such file remains, and all 15,552 saved chunks plus every saved cell file map to a cell in the clean installation.
- **Room metadata:** the four `invalid room metaID` errors for cell 25,33 appeared before and after the repair, and that cell's files are byte-identical in both installations. All 8,135 shared Muldraugh map files match, so the mixed installation did not cause them.
- **Item and script residue:** the crashed session logged 567 item-creation failures and rejected 192 Build 41 map cells; neither appeared during the clean startup. 239 item types existed only through obsolete scripts and are now marked removed in the world dictionary (21 before, 260 after). Saved copies of those items are expected to drop on load through the game's normal removed-item handling. All 49 vehicle types across the 247 saved vehicles are defined. SQLite `integrity_check` passes for the player, vehicle, and account databases.
- **Heap:** the fatal report's GC history shows no heap exhaustion. With two players on the old lazy 16 GiB heap, usage after collection settled at roughly 1,800-2,500 MiB, reaching 4,038 MiB during one allocation burst. The idle clean server holds about 1,150 MiB. One session suggests roughly 575 MiB per player, so 4 GiB is comfortable for three concurrent players and should be raised before regular play with four or more, measuring host memory while doing so.
- **Reachability:** the server's own UPnP mapping fails, but it is not needed. Both game ports answer through the public address, Steam's master list shows the server, and the October 31 connection log records a real join from a public address over RakNet. This supersedes the earlier "outside-network joining unverified" note. Server and client public branches are the same release.
- **First join:** one player joined and played for about 2 minutes 37 seconds at 05:25 with the saved character at its saved position. The server log recorded no errors after startup, no item-creation failures, and no EOF or out-of-memory errors. Old-generation heap was about 1,440 MiB.
- **Still unproven:** sustained stability still needs a session longer than the original 3 hours 42 minutes, with travel through the wider world.
