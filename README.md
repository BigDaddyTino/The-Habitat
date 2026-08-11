# The Habitat

The Habitat is a private survival-gaming clubhouse and operations center for six dedicated worlds: Valheim, Palworld, Enshrouded, Project Zomboid, 7 Days to Die, and RuneScape: Dragonwilds.

It combines verified server monitoring and historical game evidence with member profiles, claimed game identities, Steam linking, achievements, levels, weekly quests, leaderboards, records, polls, a Chronicle, Discord notices, and tightly controlled server actions. The Great Hall is a living Eastern-time cinematic scene rather than a static dashboard.

## Current state

- Production topology is MartServ101 web/worker/PostgreSQL and MartServ102 private Habitat Agent/game services.
- The dashboard reads persisted registry, telemetry, Chronicle, roster, and reward data from PostgreSQL. Seed content is never represented as live telemetry.
- The worker consumes only the private, authenticated agent API. The public web app never exposes game ports, management APIs, RCON, Telnet, agent routes, or database access.
- Unclaimed observations are retained and labeled as provisional. They earn no profile benefits until a claim is approved or the owner proves a matching Steam identity; reconciliation then safely attaches the verified history and rewards.
- Phase 13 production hardening is intentionally the next major phase. See [Build Status](Docs/BUILD_STATUS.md) for the current implementation and remaining work.

## Main surfaces

- Great Hall: Eastern-time lodge scene, server overview, dossier entry points, three deterministic sky-appropriate encounters per hour, and the server-verified secret bear interaction.
- Worlds and dossiers: retained health, telemetry, roster activity, Chronicle signals, sleeping-world access, and a compact cached game-news/patch-note rail.
- Community: profiles, avatar uploads/presets, linked identities, Steam connection, character-event history, achievements, titles, reward inventory, trophy cabinet, records, leaderboards, quests, and polls.
- Operations: authenticated admin configuration, invitations, claim review, Discord settings, world metadata, and audited allow-listed server-command queueing.

## Development

```powershell
corepack enable pnpm
pnpm install --frozen-lockfile
pnpm dev
```

Open `http://localhost:3000`. Copy `.env.example` to the untracked root `.env` and supply only the integrations you are configuring. The web app can render without Discord credentials, but database-backed routes require `DATABASE_URL`.

Run the complete local verification suite with:

```powershell
pnpm test
pnpm lint
pnpm typecheck
pnpm build
```

## Documentation

- [Architecture](Docs/ARCHITECTURE.md)
- [Authentication and identity](Docs/AUTHENTICATION.md)
- [Game adapters and history](Docs/GAME_ADAPTERS.md)
- [Progression and rewards](Docs/PROGRESSION.md)
- [Operations and backup](Docs/OPERATIONS.md)
- [Security](Docs/SECURITY.md)
- [Deployment index](Docs/DEPLOYMENT.md)
- [Build status](Docs/BUILD_STATUS.md)

## Security posture

Only the web application may be public through Cloudflare Tunnel. PostgreSQL, the Habitat Agent, game query ports, RCON/Telnet, game-management APIs, SMB, WinRM, Docker, and service-control interfaces remain private.
