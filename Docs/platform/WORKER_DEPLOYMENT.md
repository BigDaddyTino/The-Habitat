# Habitat Worker Deployment

The Habitat Worker runs natively on MartServ101. It makes outbound, bearer-authenticated requests to the private MartServ102 agent and writes verified observations to localhost-only PostgreSQL. It does not expose an HTTP port.

## Configuration

Keep the existing MartServ101 root `.env` in place and add these local-only values:

```text
HABITAT_AGENT_URL=http://<MartServ102 private LAN IP>:4317
HABITAT_AGENT_TOKEN=<the same token used by the MartServ102 agent>
HABITAT_WORKER_POLL_INTERVAL_MS=15000
HABITAT_WORKER_HISTORY_SCAN_INTERVAL_MS=21600000
HABITAT_WORKER_PROVIDER_SCAN_INTERVAL_MS=300000
HABITAT_METRIC_RETENTION_DAYS=30
STEAM_WEB_API_KEY=<optional private key>
STEAM_DATA_STORAGE_COUNTRY=<required before Steam enrichment runs>
STEAM_WEB_API_DAILY_REQUEST_BUDGET=5000
MARVEL_RIVALS_API_KEY=<optional private key>
MARVEL_RIVALS_PROVIDER=<blank | marvelrivalsapi | rivalsmeta | off>
MARVEL_RIVALS_REFRESH_MINUTES=<blank for defaults: 60 rivalsmeta, 360 official>
MARVEL_RIVALS_DAILY_REQUEST_BUDGET=2500
HABITAT_CROSS_GAME_CONSUMERS_ENABLED=false
```

The worker rejects public, HTTPS, credentialed, or path-bearing agent URLs. Its token stays in `.env`; it is not typed into a PowerShell variable for normal operation.

When `MARVEL_RIVALS_API_KEY` is blank the worker automatically falls back to the rivalsmeta.com community provider (set `MARVEL_RIVALS_PROVIDER=off` to disable instead). Rivals refreshes are presence-gated and cover only member-linked accounts: a profile pulls once when the member links it, then hourly while the member's verified Steam account shows Marvel Rivals running (plus one pass up to an hour after they stop, since provider data lags live play), with a daily safety pass for everyone else.


### Metric retention

`ServerMetricSample` is written on every monitoring cycle and, until
2026-08-28, was never pruned: 609,931 rows and 129 MB across eighteen days,
larger than every other table in the database combined and on course for about
2.5 GB a year. The only reader is the world page, which asks for the newest 48
samples per server.

The worker now prunes on the history-scan cadence.
`HABITAT_METRIC_RETENTION_DAYS` sets the window — default 30, minimum 7,
maximum 3650 — and an out-of-range or non-integer value is refused at startup
rather than rounded. The floor exists because a window measured in hours would
delete what the world page is still showing; unbounded growth was the bug, and
a window too tight is simply a different one.

Deletion runs in batches of 5,000 with a ceiling of 20 batches per scan, so the
first prune on a database that has never had one cannot hold locks against the
monitoring cycle still writing to that table. Whatever is left is taken by the
next scan.

To keep long-range history, widen the window rather than disabling the prune —
there is no off switch, because "no bound" is the state this replaced. If a
surface is ever written that charts months of samples, the right change is to
roll old rows up to hourly in `retention.ts`, not to keep every fifteen-second
sample forever.

## First Cycle

From an ordinary MartServ101 PowerShell session at the repository root:

```powershell
$env:Path = "C:\Program Files\nodejs;$env:Path"
& "C:\Program Files\nodejs\corepack.cmd" pnpm --filter @habitat/worker run-once
```

The first successful cycle creates live runtime entries, metric samples, and initial state-history transitions only for worlds returned by the agent. Other worlds remain `UNKNOWN`. The current agent supports all six registered worlds, with game-specific capabilities documented in [Game Adapters](GAME_ADAPTERS.md).

When a server configured as `SLEEPING` is observed with a verified running process, the worker automatically promotes its desired state to `ONLINE`. No routine admin edit is needed when a server comes online. A later missing process is `DOWN_UNEXPECTEDLY` unless the Habitat initiated the stop or receives another trusted shutdown signal.

The same worker also performs bounded history imports, name/persona reconciliation, XP/quest/achievement/record evaluation, reward reconciliation after claims, Discord outbox delivery when configured, and audited command dispatch. These jobs use replay-safe database dedupe keys; they still require real, configured sources before producing game-specific data.

Provider scans have their own due time and do not delay the hosted monitoring loop. Missing keys disable only that provider. Steam enrichment runs only for a verified Steam account whose member separately opted in, and it also requires the configured storage-country disclosure. Both providers reserve requests against PostgreSQL-backed UTC-day budgets before calling upstream APIs. Keep `HABITAT_CROSS_GAME_CONSUMERS_ENABLED=false` until real provider data has been shadow-reviewed; setting it true requires rerunning the database seed and restarting the worker.

## Windows Service

After a successful one-cycle check, download the WinSW executable to `<repository>\HabitatWorker.exe`. From an elevated PowerShell session:

```powershell
Set-Location "<repository>"
.\apps\worker\scripts\install-worker.ps1 -InstallRoot (Get-Location)
```

The service reads the persistent root `.env` automatically. It has no inbound firewall rule or listening port. Its logs are local-only in `<repository>\worker-logs`: `HabitatWorker.out.log` holds application output, `HabitatWorker.err.log` holds errors, and `HabitatWorker.wrapper.log` holds WinSW's own service log. Rotation is size and date based, rolling at 10 MB and keeping 14 files.

The `<logpath>` in the service template is deliberately absolute, built from `{{INSTALL_ROOT}}`. WinSW resolves a *relative* `logpath` against the service process's working directory, which is `C:\Windows\System32` for a LocalSystem service. A relative value therefore writes `HabitatWorker.out.log` and `HabitatWorker.err.log` into `C:\Windows\System32\worker-logs` while only the wrapper log lands beside the executable, which reads exactly like "the application produces no logs". If application output ever appears to vanish, check that path before suspecting the log mode: the log mode is not the usual cause.

Note also that WinSW's `<sizeThreshold>` is expressed in **kilobytes**, so the intended 10 MB is `10240`, not `10485760`.

The per-cycle summary line is folded rather than printed every 15 seconds. A line is written when the summary changes, on the first cycle after a restart, and on a 30-minute heartbeat; the count of identical cycles folded since the previous line is reported on that line, so nothing is hidden. A state change — an agent going unavailable, a world count moving — is therefore always logged the moment it happens, and steady-state operation stays quiet enough to read.

To remove it without deleting the local configuration or logs:

```powershell
.\apps\worker\scripts\uninstall-worker.ps1 -InstallRoot "<repository>"
```
