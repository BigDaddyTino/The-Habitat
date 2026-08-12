# Operations

The portal remains useful when games are sleeping, down, or temporarily unobservable. `SLEEPING` is intentional; `DOWN_UNEXPECTEDLY` is a verified failed state; worker or agent loss becomes `UNKNOWN` rather than a false outage.

## Routine release checks

```powershell
pnpm test
pnpm lint
pnpm typecheck
pnpm build
Restart-Service HabitatWeb
Invoke-WebRequest -UseBasicParsing "http://127.0.0.1:3000/" | Select-Object StatusCode
```

Run a worker cycle after changing private agent configuration or a history source:

```powershell
& "C:\Program Files\nodejs\corepack.cmd" pnpm --filter @habitat/worker run-once
```

Review configured worlds, agent health, and Chronicle output afterward. Do not infer that a new query/log source is good merely because the process starts.

## Server operations

Admins submit typed-confirmed `start`, `stop`, `restart`, or `update` requests. They are persisted, audited, and dispatched by the worker only to agent-configured named Windows services.

- Confirm the intended world and action before submitting.
- A successful service wrapper transition is not sufficient: the agent verifies the configured game process has exited for stops.
- `update` requires the game service to be stopped first.
- A command failure remains in the audit/queue history; do not retry by inventing an agent URL, process name, or command.
- Existing manual server instances must be stopped before starting the matching Habitat service.

See [Managed Game Services](GAME_SERVICE_DEPLOYMENT.md) for installation and replacement safety.

## Persistent storage volume

State a rebuild cannot regenerate lives on a separate MartServ101 volume, normally `N:\The Habitat`:

```ini
HABITAT_AVATAR_STORAGE_PATH=N:\The Habitat\avatars
HABITAT_BACKUP_PATH=N:\The Habitat\backups
```

| Path | Contents |
| --- | --- |
| `avatars\` | Live member-uploaded avatars written by the web app |
| `backups\database\` | `pg_dump` custom-format dumps |
| `backups\config\` | Zipped untracked configuration; treat as secret material |
| `backups\repository\` | `git bundle` snapshots of committed application history |
| `backups\avatars\` | Mirror of the live avatar directory |
| `backups\latest.json` | Machine-readable result of the latest backup run |
| `backups\backup-log.txt` | Appended backup summary |

When avatar storage is outside the repository, `/member-avatars/<file>` serves only generated UUID filenames after upload magic-byte validation. It cannot address arbitrary filesystem paths.

## Backups and restore

Run an on-demand backup:

```powershell
Set-Location "<repository>"
.\scripts\backup-habitat.ps1
```

Schedule nightly backups from an elevated session:

```powershell
.\scripts\install-backup-task.ps1 -At 04:00
Start-ScheduledTask -TaskName "Habitat Nightly Backup"
Get-Content "N:\The Habitat\backups\backup-log.txt" -Tail 5
```

Versioned categories retain the newest daily backup for seven days, weekly backup for four weeks, and monthly backup for six months. A failed category is not pruned. Game-world saves remain out of scope until their existing backup mechanisms are inspected and integrated safely.

Restore only during a deliberate maintenance window:

```powershell
docker cp "N:\The Habitat\backups\database\habitat-<stamp>.dump" habitat-postgres:/tmp/restore.dump
docker exec habitat-postgres pg_restore --username habitat_app --dbname habitat --clean --if-exists /tmp/restore.dump
robocopy "N:\The Habitat\backups\avatars" "N:\The Habitat\avatars" /E
git clone "N:\The Habitat\backups\repository\habitat-<stamp>.bundle" "C:\The Habitat"
```

Restore configuration archives by hand. They can contain live secrets. Repository bundles include committed history only; uncommitted files are not a backup.

## Production recovery validation

The owner has completed and accepted the full backup/restore drill. MartServ101 and MartServ102 have both been rebooted, and automatic recovery of the deployed Habitat services, private agent connection, and managed game-service state has been verified. Managed restart flows have also been exercised across the deployed services. Repeat these drills after material service-wrapper, storage, database, or host-startup changes.
