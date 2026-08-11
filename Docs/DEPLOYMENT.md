# Deployment

Production is split between MartServ101 and MartServ102. The public boundary is Cloudflare Tunnel to the loopback-only `HabitatWeb` service on MartServ101; no other Habitat or game-management service is public.

## Install order

1. Provision loopback-only PostgreSQL on MartServ101 and apply Prisma migrations/seed data.
2. Configure and install the private MartServ102 Habitat Agent.
3. Configure and run the MartServ101 worker once; verify only observed worlds become live.
4. Install the MartServ101 worker service.
5. Build and install the MartServ101 web service.
6. Configure Cloudflare Tunnel to reach only `127.0.0.1:3000`.
7. Configure Discord, Steam, backups, and game-service controls only after their local verification steps pass.

## Deployment guides

- [Web service](WEB_DEPLOYMENT.md)
- [Worker service](WORKER_DEPLOYMENT.md)
- [Private agent](AGENT_DEPLOYMENT.md)
- [Managed game services](GAME_SERVICE_DEPLOYMENT.md)
- [Operations, backup, and restore](OPERATIONS.md)
- [Security controls](SECURITY.md)

## Required configuration

Copy `.env.example` to the untracked root `.env`. At minimum, production requires `DATABASE_URL`, `AUTH_SECRET`, and the private worker-to-agent settings when monitoring is enabled. Discord, Cloudflare, storage-volume, and bot values are optional integrations, not values to invent or commit.

The Compose database binds `127.0.0.1:5432` only and uses a persistent named volume. Game ports, RCON/Telnet, agent port 4317, Palworld REST, SMB, WinRM, and Docker must remain private.

## Cloudflare Tunnel

MartServ101 runs the remotely managed tunnel `habitat-martserv101` as the automatic Windows service `Cloudflared`. Its only published application route is:

```text
https://habitat.martinobear.com -> http://127.0.0.1:3000
```

The connector token is held by the installed Cloudflare service and must not be copied into the repository, documentation, or logs. Check the connector and origin from an elevated PowerShell session with:

```powershell
Get-Service Cloudflared
Invoke-WebRequest -UseBasicParsing "http://127.0.0.1:3000/" |
  Select-Object StatusCode
```

The authoritative Cloudflare record is tunnel-managed and proxied. MartServDMC currently has a legacy split-horizon A record for `habitat.martinobear.com`; replace it with an internal CNAME to the tunnel target shown in Cloudflare before using the public hostname from the LAN. Merely deleting the record may return `NXDOMAIN` if the internal server remains authoritative for the zone. Do not pin an internal record to a Cloudflare edge IP because those addresses are not application-owned endpoints.

## Release verification

Before a release, run:

```powershell
pnpm test
pnpm lint
pnpm typecheck
pnpm build
```

Then verify `http://127.0.0.1:3000/` locally, inspect the worker health path through its private agent connection, and verify that production pages describe unavailable telemetry as `UNKNOWN` rather than generating data.
