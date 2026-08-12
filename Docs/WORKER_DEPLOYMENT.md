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
STEAM_WEB_API_KEY=<optional private key>
STEAM_DATA_STORAGE_COUNTRY=<required before Steam enrichment runs>
STEAM_WEB_API_DAILY_REQUEST_BUDGET=5000
MARVEL_RIVALS_API_KEY=<optional private key>
MARVEL_RIVALS_DAILY_REQUEST_BUDGET=2500
HABITAT_CROSS_GAME_CONSUMERS_ENABLED=false
```

The worker rejects public, HTTPS, credentialed, or path-bearing agent URLs. Its token stays in `.env`; it is not typed into a PowerShell variable for normal operation.

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

The service reads the persistent root `.env` automatically. It has no inbound firewall rule or listening port. Its logs are local-only in `worker-logs`.

To remove it without deleting the local configuration or logs:

```powershell
.\apps\worker\scripts\uninstall-worker.ps1 -InstallRoot "<repository>"
```
