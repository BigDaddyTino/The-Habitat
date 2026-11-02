# Dedicated server lifecycle review — 2026-10-31

The six installed worlds now use one-click Start, Stop, Restart, and Update controls at `/admin/operations`. The form and server action no longer require a typed confirmation. Administrator authorization, the fixed service allow-list, private agent access, and the command audit ledger remain enforced.

## Reviewed services

| World | Start / stop / restart findings | Update findings |
| --- | --- | --- |
| Valheim | Direct server executable, explicit world/save folder, Steam environment, process check, and 120-second wrapper stop allowance verified. | Steam app 896660 targets the running installation. |
| Palworld | Child-process check and graceful local shutdown API retained. Keep `-enable-gamedata-api` in the installer, matching the installed service. | Steam app 2394010; preserve operator settings, wait for graceful shutdown before replacing files. |
| Enshrouded | Direct executable and working directory verified; 120-second wrapper stop allowance. | Steam app 2278520; preserve `enshrouded_server.json`. |
| Project Zomboid | The evening update moved the installation from 41.78.18 to 42.21.0. The owner approved a fresh Build 42 world; the old world, settings, accounts, and mods remain separate and backed up. The service uses the initialized new data directory explicitly. Startup classpath and native-library paths now follow the shipped launcher. | Steam app 380870 updates the service's actual installation. Each update refreshes the launcher settings before starting the service. See the evening recovery evidence below. |
| 7 Days to Die | Executable, configuration argument, process check, and 180-second wrapper stop allowance verified. Its latest retained startup log separately reports ProjectZ mod errors (`SecureLoot` missing and XML patches not applying). No mods were removed or changed during this lifecycle work. | Steam app 294420; preserve `serverconfig.xml`. Steam updating does not establish that third-party mods are compatible. |
| RuneScape: Dragonwilds | Direct launcher, shipping child-process check, working directory, and 120-second wrapper stop allowance verified. | Steam app 4019830; archive original retained logs before an update, in addition to the existing game-managed saves. |

The installed WinSW XML definitions are authoritative. Historical `start.cmd` / `update.cmd` files remain unused by those service definitions. Stop and restart are named service operations implemented by the agent, not arbitrary command/script endpoints.

## Update behavior

1. The web action serializes requests for a world and records one authorized command. Controls disable while submitting or while its command is pending.
2. The worker serializes claims: one operation per world and one Steam update at a time across all worlds.
3. The agent creates an operation UUID and a durable `QUEUED` record in the protected local runtime directory, then starts only that world's configured updater service.
4. The updater holds a machine-wide mutex, refuses another running SteamCMD, reports `STOPPING`, and waits for the game process to exit. Palworld uses its local graceful-shutdown API first. Zomboid receives a console shutdown signal while its console host is still alive, and must finish saving/exiting before the update continues.
5. It preserves operator configuration, reports `UPDATING`, and runs SteamCMD against the same installation that the game service uses. Both a zero exit code and the matching app's explicit SteamCMD success message are required. Configuration is restored even when the update fails.
6. It reports `STARTING`, starts the named game service, and checks its game process. Only then does it record `SUCCEEDED`. Monitoring independently reports whether the world is ready to join.

Update starts the world afterward even if it was initially sleeping, as requested. A failed update leaves it stopped rather than starting potentially incomplete files. Failures retain their phase/reason and do not relabel a failed update as intentional sleep. The updater's status and output survive agent/worker restarts; the worker polls without resending a running mutation. SteamCMD has a one-hour deadline, with a longer reconciliation deadline for an unreachable agent. An interrupted updater is reported as failed. Proven pre-connect failures can retry; a generic fetch failure after dispatch cannot safely retry a mutating action.

The protected runtime is `C:\ProgramData\The Habitat\game-updates`. Each world has a fixed private config, current status, prior status, and per-operation SteamCMD output/config backups. It is restricted to Administrators and SYSTEM. No runtime paths, shell commands, or service names are accepted from browser input. No ports or firewall rules were added.

## Installation and recovery

- `apps/agent/scripts/install-game-update-workflows.ps1 -InstallRoot <agent-directory> -CheckOnly` verifies all six installed service pairs and their executable paths.
- Without `-CheckOnly`, it backs up private configuration/update XML, installs the runner, and updates updater XML plus agent configuration. It does not start or stop game services. Run only with all updater services stopped.
- The full `install-game-services.ps1` installer also installs the workflows. Its existing `-Replace` operation replaces services and is not the migration used here. Set `projectZomboidDataDirectory` in the ignored `game-services.json` to the existing initialized data folder before a full install.
- Agent build `0.1.0+lifecycle.20261031113458` is installed; the previous compiled artifact remains in `apps/agent/dist.previous`. Private before-files are under the protected runtime directory.
- The worker was restarted with the compatible dispatcher. Web release `.next-20261031-113527` passed its audit/build/health gate; `.next-20261031-102851` remains available for rollback. Source backups are in ignored deployment data.
- Roll back agent, worker, and updater configuration together when restoring the old protocol. The new UI does not depend on reverting to typed confirmations.

## Validation and limits

- All 868 production workspace tests pass, including 45 agent tests and 107 worker tests. Typechecks pass. Web lint has zero errors and seven existing image warnings. Release audit: 7/7 gates passed.
- Nine isolated PowerShell scenarios cover a running world, a sleeping world, Palworld shutdown, Steam failure, missing success output, stop failure, start failure, a busy updater, and a stale request. They verify operation ordering, configuration restoration, progress, and failure behavior without calling live game services.
- Authenticated status routes, malformed status rejection, duplicate/overlap refusal, interrupted updates, durable progress reconciliation, and no premature success are covered by tests. Production PostgreSQL lock queries were verified without writing game records.
- Browser verification on the live desktop/mobile site found six forms and 24 buttons, no confirmation fields/dialogs, 44px mobile controls, and no horizontal overflow or browser errors. All 24 submissions were intercepted; a real Update server-action request was also intercepted before reaching the server. An ordinary member cannot access the controls. Temporary QA account/session removed.
- No live Steam update, game stop, or game start was triggered for validation. Both running game-service process IDs were unchanged; the four sleeping services remained stopped. Actual game/mod readiness still requires a real operation and the normal monitoring checks. In particular, the retained 7 Days to Die mod failure was not reproduced or repaired here.

Relevant vendor references: [WinSW stop behavior](https://github.com/winsw/winsw/blob/v3/docs/xml-config-file.md), [Palworld shutdown API](https://docs.palworldgame.com/0.5.0/api/rest-api/shutdown), and [The Indie Stone's explicit data-directory guidance](https://theindiestone.com/forums/topic/42017-how-to-change-where-the-server-data-is-stored/). The installed Zomboid server class also contains the `-cachedir=` option.

## Evening incident and live recovery

The earlier validation above describes the daytime deployment. It did not catch the following real service and version-transition failures. The recovery work below supersedes the earlier claim that no game operations were performed.

- **Dragonwilds stop:** WinSW 2.12 stopped the launcher before enumerating its children, then failed on an invalid parent handle. The shipping game process survived. After backing up its saves/logs, targeted graceful recovery was attempted; the console was unavailable, so only the verified orphan was terminated. Dragonwilds now stops its game children before the bootstrap launcher. Direct game executables retain parent-first wrapper behavior so their console hosts survive until shutdown; updater wrappers stop children first. A subsequent real managed Dragonwilds start/stop completed successfully. It remains intentionally `SLEEPING`.
- **Specific failures:** The worker now preserves only allow-listed agent failure codes and the operations page explains them. A process that survives Stop reports `service_stop_incomplete`; an unknown response remains redacted. Recovery commands retain their audit entries rather than rewriting the original failures as successful.
- **Monitoring race:** A poll taken before a completed Stop could overwrite its desired state with `ONLINE`. Monitoring now checks the poll start time and atomically compares the server revision before persisting any observation/history. Active lifecycle commands own their requested state. Dragonwilds remained `SLEEPING` across later polls after this fix.
- **Zomboid update:** SteamCMD tried inaccessible older depot manifests and returned app state `0x6`. The installed manifest was backed up and detached; the audited retry downloaded/validated the current build successfully. This was not a disk-space failure.
- **Zomboid launch:** The new installation packages its classes in a jar, but leftover Build 41 loose classes took precedence. Those obsolete directories were moved into protected recovery storage. The service now obtains its classpath and native-library path from the vendor launcher; this synchronization also runs after future updates. Unrecognized/unsafe launcher paths fail before starting the game.
- **New world:** Build 42 could not use the old save/account database. The owner explicitly chose a fresh Build 42 world and retention of the old backup. A separate data folder was initialized without old mods, using a new private administrator credential. It reached `SERVER STARTED`, saved, and shut down normally. Normal Windows-service startup subsequently reached the listening state, and Habitat observed process-running/query-reachable `ONLINE`.
- **Zomboid saving during stop:** A live update exposed that stopping a Java console host first caused forced termination. Stop/Restart/Update now use a fixed local Zomboid shutdown helper before wrapper cleanup. It verifies the Java executable, main class, and parent service PID, signals only that console, and waits for exit. Failure aborts the operation without force-killing the game or running SteamCMD. The live test recorded `Saving finish` and `Shutdown handling finished`, then a successful Steam check and restart. No RCON listener or new network endpoint was enabled.

The protected recovery folder beneath `C:\ProgramData\The Habitat\game-updates` holds before-files, the original world/database/settings backup, detached manifest, obsolete classes, and Dragonwilds saves/logs. The original Zomboid data directory remains separate; its account database was restored from the pre-migration backup. The new data directory is `C:\ProgramData\The Habitat\game-data\project-zomboid-b42`. Its `administrator-credentials.txt` is restricted to Administrators and SYSTEM and must not be copied into Git or web content. Existing server access settings and game ports were retained. The new history source was added alongside the retained old source; Build 42 player-history parsing still needs a real join for verification.

Agent build `0.1.0+zomboidstop.20261031205942`, the compatible worker, and web release `.next-20261031-204131` are deployed. Validation includes 114 worker tests, 13 targeted service-control tests, and 12 isolated PowerShell workflow cases, including vendor-launcher synchronization and refusal to update after a failed graceful stop. Agent/worker/web typechecks and the web release audit passed. The other four worlds were not cycled during this recovery; their live update behavior is not claimed as tested.

The final live Update command completed successfully. After startup finished, the game query and the production operations page both showed Zomboid `ONLINE` / `Update Succeeded`, and Dragonwilds `SLEEPING` / `Stop Succeeded`. Desktop and 390px mobile browser checks passed with six forms, 24 buttons, no confirmation inputs, no horizontal overflow, and no browser errors. No lifecycle requests were submitted by this final browser check. The temporary QA user and sessions were removed. Actual outside-network joining remains unverified.

The owner reviewed the [first-person findings and client requirements](PROJECT_ZOMBOID_FIRST_PERSON_RESEARCH.md), then explicitly chose a mod-free new world. `Mods` and `WorkshopItems` remain empty. No first-person, loader, or optimization mod was installed.

## November 2 crash recovery

The retained November 1 native crash exposed additional migration residue: 2,363 obsolete media files remained after the earlier loose-class cleanup, including the map file that reported an EOF error immediately before the crash. A fresh validated installation of the same stable Build 42 replaced the mixed installation, with the entire previous installation and current world backed up separately. The existing world was retained. The service's 16 GiB initial/maximum heap was also inappropriate for the shared 16 GiB host; it now starts at 1 GiB with a 4 GiB maximum Java heap. The launcher synchronization and full installer preserve configurable limits. See [crash evidence, repair, and verification limits](PROJECT_ZOMBOID_CRASH_RECOVERY.md). Successful October 31 startup/update testing did not establish long-session gameplay stability.
