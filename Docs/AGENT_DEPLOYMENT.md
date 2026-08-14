# Habitat Agent Deployment

The Habitat Agent is a private Windows service for MartServ102. It provides read-only observation plus a tiny fixed allow-list of authenticated named-service actions; it is not part of Docker Compose, Cloudflare Tunnel, or the public website.

## Boundary

- The agent binds to one explicit private LAN address. It never binds to `0.0.0.0`.
- Every route requires `Authorization: Bearer <HABITAT_AGENT_TOKEN>`.
- The firewall accepts TCP 4317 only from the explicit MartServ101 LAN address supplied at install time, on the agent's configured private address. The rule applies across Windows network profiles without broadening its address scope.
- Read routes are limited to `GET /health`, `GET /v1/servers`, `GET /v1/servers/:key/status`, and `GET /v1/servers/:key/history`.
- The only write routes are fixed `POST /v1/servers/:key/actions/:action` actions for `start`, `stop`, `restart`, and `update`, with an empty JSON body. There are no shell, request-supplied command, arbitrary-path, or arbitrary-host endpoints.

## Before Installation

Perform these steps on MartServ102, after inspecting its actual game-server processes, install directories, executable locations, and query ports. Do not copy guessed paths from another host.

1. Install Node.js 24 LTS and clone or update this repository.
2. Run `pnpm install --frozen-lockfile` and `pnpm --filter @habitat/agent build`.
3. Download the WinSW executable and place it at `apps/agent/HabitatAgent.exe`. The executable is intentionally not committed.
4. Create `apps/agent/agent.config.json` from `agent.config.example.json`.
5. Fill the config only with inspected local server information. An empty `servers` array is valid while discovery is incomplete.

Example shape, with placeholders rather than real paths:

```json
{
  "servers": [
    {
      "key": "example-world",
      "displayName": "Example World",
      "processName": "example-server.exe",
      "executablePath": "<inspected executable path>",
      "installPath": "<inspected install directory>",
      "query": {
        "type": "<verified GameDig game id>",
        "host": "127.0.0.1",
        "port": 12345,
        "timeoutMs": 3000,
        "playerCountSupported": true
      }
    }
  ]
}
```

`query.host` is restricted to loopback or a private IPv4 address. Set `playerCountSupported` to `false` when a query protocol is known not to provide a trustworthy count, including Valheim crossplay until another verified source exists.

For Palworld, use `"type": "palworld"`, `"host": "127.0.0.1"`, and `"port": 8212`. The agent requires `HABITAT_PALWORLD_ADMIN_PASSWORD` in its ignored local `.env`; it sends that credential only to Palworld's local REST endpoint and never includes it in status responses, logs, or browser data. Do not port-forward the REST endpoint.

## Legacy History Sources

Archived history is opt-in per server. Every source path must be an inspected, absolute local Windows path in the ignored `agent.config.json`; clients cannot provide or override a path. The agent reads at most the configured `maxBytes`, scans at most 100 non-recursive `.log`, `.txt`, or `.jsonl` files, prioritizes the newest files and each file's newest complete lines, returns at most 5,000 normalized evidence records, and never returns raw log lines.

```json
"history": [
  {
    "kind": "VALHEIM_LOG",
    "label": "Valheim archived server logs",
    "path": "<inspected log file or directory>",
    "maxBytes": 33554432
  }
]
```

- `VALHEIM_LOG` reconstructs a timed session only from a timestamped `Got connection SteamID` paired with its later `Closing socket`. An unmatched connection becomes participation evidence without playtime.
- When `VALHEIM_LOG` and `HABITAT_CHRONICLE_LOG` are both configured, the agent can attach a SteamID64 to a Chronicle character only when their join timestamps form a mutually unique one-to-one match within 30 seconds. Ambiguous names or timestamps remain separate and require review.
- `STEAM_PLATFORM_LOG` records conservative participation evidence only when a timestamp, SteamID64, and explicit player activity marker occur on the same line. It never estimates session time.
- `HABITAT_SESSION_JSONL` accepts a controlled migration export with `externalProvider: "STEAM"`, `externalAccountId`, ISO `occurredAt`, optional ISO `endedAt`, and optional `displayName`. Use it only for an inspected export from a source whose semantics are known.

The worker rescans these sources every six hours by default. `HABITAT_WORKER_HISTORY_SCAN_INTERVAL_MS` can set an interval from five minutes to 24 hours. Database dedupe keys make replay safe. Run `pnpm check:connections` after deployment; the audit fails if any required identity source is missing, unavailable, or truncated.

## Install

From an elevated PowerShell session on MartServ102, set a random token in the current session without committing it, then run:

```powershell
$env:HABITAT_AGENT_TOKEN = "<long random secret>"
Set-Location "<repository>\apps\agent"
.\scripts\install-agent.ps1 -InstallRoot (Get-Location) -AgentBindIp "<MartServ102 private LAN IP>" -MartServ101Ip "<MartServ101 private LAN IP>"
```

The installer writes the ignored local `.env`, creates an empty config when needed, creates the source-limited firewall rule, and installs the `HabitatAgent` WinSW service. It refuses non-private bind/source addresses, missing Node/WinSW artifacts, short tokens, and duplicate services.

## Updating An Installed Agent

The service runs compiled output (`<arguments>dist\index.js</arguments>`), not TypeScript sources, so pulling changes is not enough on its own. A pull followed only by a restart keeps executing the previous build. From the repository root on MartServ102:

```powershell
git pull
pnpm install --frozen-lockfile
pnpm --filter @habitat/agent build
Restart-Service HabitatAgent
```

The build compiles and then loads every emitted module under bare `node` (`scripts/verify-build.mjs`), because the agent is the only workspace that runs compiled output on plain `node`: the worker runs under tsx and the web app is bundled, and both accept module specifiers that Node itself rejects. A value import from `@habitat/shared` must therefore name a subpath export whose target has no extensionless relative imports of its own, such as `@habitat/shared/agent` rather than `@habitat/shared`, whose `index.ts` re-exports `./agent` without an extension and fails to resolve at runtime. Type-only imports are erased at compile time and may use any specifier. The check fails the build on the build machine instead of crash-looping the installed service, which is how an unloadable build reached MartServ102 on 2026-08-13.

`HabitatAgent` exists only on MartServ102. Running `Start-Service HabitatAgent` on MartServ101 fails with "Cannot find any service with service name 'HabitatAgent'" because MartServ101 hosts only `HabitatWeb` and `HabitatWorker`. To inspect or control it from MartServ101 without signing in to MartServ102, use an elevated prompt:

```powershell
sc.exe \\<MartServ102 private LAN IP> query HabitatAgent
sc.exe \\<MartServ102 private LAN IP> stop HabitatAgent
sc.exe \\<MartServ102 private LAN IP> start HabitatAgent
```

A brief agent restart does not flap world state: the worker debounces an unreachable agent for two consecutive cycles before recording `UNKNOWN`.

Agent logs live in `<repository>\apps\agent\logs` via the template's `%BASE%\logs` path. `%BASE%` is WinSW's own directory; a relative `logpath` would instead resolve against the service process's working directory, which is `C:\Windows\System32` for a LocalSystem service, and the application log would silently land in `C:\Windows\System32\logs`. An agent installed before that template fix still carries the relative value in its already-copied `HabitatAgent.xml`, so correct it in place and restart.

## Verify And Remove

From MartServ101, call `/health` using the configured token. A valid response is minimal host-health data only. A missing token receives `401`; a source outside the configured allow list receives `403`.

To remove the service and only its dedicated firewall rule, while retaining local config and logs:

```powershell
.\scripts\uninstall-agent.ps1 -InstallRoot "<repository>\apps\agent"
```

The worker health probe, continuous monitoring, PostgreSQL persistence, legacy-history scan, Steam persona reconciliation, reward evaluation, and command dispatch are implemented. Verify every newly configured source and service locally before treating its resulting data or control path as production-ready.
