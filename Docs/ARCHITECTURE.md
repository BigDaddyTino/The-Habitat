# Architecture

The Habitat is a pnpm monorepo with a Next.js web app, an independent worker, a Windows-native MartServ102 agent, and shared domain packages.

The web app, PostgreSQL, worker, and Cloudflare Tunnel will run on MartServ101. The agent remains on MartServ102, close to the games and Jellyfin. The web app never proxies arbitrary agent requests; it uses defined server data and allow-listed actions only.

The initial dashboard is seeded static data. Production status moves through `MartServ102 agent -> worker -> PostgreSQL -> web`, preserving the difference between `SLEEPING`, `DOWN_UNEXPECTEDLY`, `DEGRADED`, and `UNKNOWN`.
