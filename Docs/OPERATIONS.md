# Operations

The portal must remain useful when games are down or sleeping. Worker and agent heartbeat loss produces `UNKNOWN`, not a false outage.

Backups, updates, restarts, and shutdowns will only be introduced as predefined agent operations after monitoring has proven stable. Every action will have a lifecycle and audit log.

## Persistent storage volume

Portal state that a rebuild cannot regenerate lives on a separate volume from the application drive. On MartServ101 that is `N:\The Habitat`, configured through two repository `.env` values:

```ini
HABITAT_AVATAR_STORAGE_PATH=N:\The Habitat\avatars
HABITAT_BACKUP_PATH=N:\The Habitat\backups
```

| Path | Contents |
| --- | --- |
| `avatars\` | Live member-uploaded avatars, written by the web app |
| `backups\database\` | `pg_dump` custom-format dumps |
| `backups\config\` | Zipped untracked configuration; **contains live secrets** |
| `backups\repository\` | `git bundle` snapshots of the full application history |
| `backups\avatars\` | Mirror of the live avatar directory |
| `backups\latest.json` | Machine-readable result of the most recent run |
| `backups\backup-log.txt` | One appended line per run |

`README.txt` on the volume repeats this layout and the restore commands for whoever is standing in front of the machine.

### Avatar serving

When `HABITAT_AVATAR_STORAGE_PATH` points outside the repository, uploads are no longer inside `apps/web/public`, so Next.js cannot serve them statically. The `/member-avatars/<file>` route handler reads them from the configured directory instead. Stored names are UUIDs assigned at upload time after a magic-byte check, and the route accepts only that pattern, so no request can reach another path. Leaving the variable unset keeps the old behaviour: files land in `apps/web/public/member-avatars` and the static handler answers first.

## Backups

`scripts\backup-habitat.ps1` captures the database, untracked configuration, application Git history, and the avatar mirror in one run. Game-world saves are deliberately out of scope until existing game backup systems have been discovered and reported.

Run it on demand:

```powershell
Set-Location "<repository>"
.\scripts\backup-habitat.ps1
```

Schedule it nightly from an elevated session:

```powershell
.\scripts\install-backup-task.ps1 -At 04:00
Start-ScheduledTask -TaskName "Habitat Nightly Backup"
Get-Content "N:\The Habitat\backups\backup-log.txt" -Tail 5
```

The task runs as the invoking account with highest privileges rather than `SYSTEM`, because the database step shells out to the Docker CLI and `SYSTEM` is usually not a member of `docker-users`. Remove it with `.\scripts\uninstall-backup-task.ps1`; backup files are left alone.

### Retention

Each versioned category keeps the newest backup per day for 7 days, per week for 4 weeks, and per month for 6 months. Pruning is skipped for any category whose step failed, so a bad run never erodes the history it just failed to extend. A run that fails any step exits non-zero and records `result: "failed"` in `latest.json`.

### Restoring

```powershell
docker cp "N:\The Habitat\backups\database\habitat-<stamp>.dump" habitat-postgres:/tmp/restore.dump
docker exec habitat-postgres pg_restore --username habitat_app --dbname habitat --clean --if-exists /tmp/restore.dump
robocopy "N:\The Habitat\backups\avatars" "N:\The Habitat\avatars" /E
git clone "N:\The Habitat\backups\repository\habitat-<stamp>.bundle" "C:\The Habitat"
```

Config archives are restored by hand; the underscores in the archived filenames are the original path separators. The bundle carries committed history only, so uncommitted working-tree changes are never captured — the run reports how many uncommitted paths it saw.

### Not yet built

`latest.json` exists so the portal can surface last successful backup, age, size, and result on an admin surface. That view, and any agent-driven game-world backup operation, remain unimplemented.
