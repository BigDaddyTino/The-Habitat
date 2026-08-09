# The Habitat

The private operations center for six dedicated survival-game worlds: status, history, community lore, and a permanent record of questionable decisions.

## Current slice

The initial Great Hall is a static, seeded dashboard. It deliberately does not represent live game-server telemetry yet.

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
