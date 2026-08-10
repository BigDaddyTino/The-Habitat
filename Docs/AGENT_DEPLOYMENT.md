# Habitat Agent Deployment

The Habitat Agent is a private, read-only Windows service for MartServ102. It is not part of Docker Compose, Cloudflare Tunnel, or the public website.

## Boundary

- The agent binds to one explicit private LAN address. It never binds to `0.0.0.0`.
- Every route requires `Authorization: Bearer <HABITAT_AGENT_TOKEN>`.
- The firewall accepts TCP 4317 only from the explicit MartServ101 LAN address supplied at install time, on the agent's configured private address. The rule applies across Windows network profiles without broadening its address scope.
- The only implemented routes are `GET /health`, `GET /v1/servers`, and `GET /v1/servers/:key/status`.
- There are no action, shell, command, arbitrary-path, or arbitrary-host endpoints.

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

## Install

From an elevated PowerShell session on MartServ102, set a random token in the current session without committing it, then run:

```powershell
$env:HABITAT_AGENT_TOKEN = "<long random secret>"
Set-Location "<repository>\apps\agent"
.\scripts\install-agent.ps1 -InstallRoot (Get-Location) -AgentBindIp "<MartServ102 private LAN IP>" -MartServ101Ip "<MartServ101 private LAN IP>"
```

The installer writes the ignored local `.env`, creates an empty config when needed, creates the source-limited firewall rule, and installs the `HabitatAgent` WinSW service. It refuses non-private bind/source addresses, missing Node/WinSW artifacts, short tokens, and duplicate services.

## Verify And Remove

From MartServ101, call `/health` using the configured token. A valid response is minimal host-health data only. A missing token receives `401`; a source outside the configured allow list receives `403`.

To remove the service and only its dedicated firewall rule, while retaining local config and logs:

```powershell
.\scripts\uninstall-agent.ps1 -InstallRoot "<repository>\apps\agent"
```

The worker health-probe helper is implemented and tested, but the continuous worker polling and PostgreSQL heartbeat persistence belong to the next monitoring phase.
