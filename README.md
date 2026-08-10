# The Habitat

The private operations center for six dedicated survival-game worlds: status, history, community lore, and a permanent record of questionable decisions.

## Current slice

The Great Hall reads its world registry from PostgreSQL. Valheim and Palworld process telemetry is live on the private MartServ102 agent; the MartServ101 worker persists it to the dashboard once configured. Unmonitored worlds remain `UNKNOWN`.

## Development

```powershell
corepack enable pnpm
pnpm install
pnpm dev
```

Open `http://localhost:3000`.

## Stack

- Node.js 24 LTS and pnpm workspace
- Next.js App Router and React
- Tailwind CSS
- PostgreSQL 18 (Compose definition; not started until Docker is available)

## Security baseline

Only the future web app may be public through Cloudflare Tunnel. PostgreSQL, the Habitat Agent, RCON/Telnet, game query ports, and management APIs remain private.
