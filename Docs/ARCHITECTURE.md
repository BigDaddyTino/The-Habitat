# Architecture

The Habitat is a pnpm monorepo with a Next.js web app, an independent worker, a Windows-native MartServ102 agent, and shared domain packages.

The web app, PostgreSQL, worker, and Cloudflare Tunnel will run on MartServ101. The agent remains on MartServ102, close to the games and Jellyfin. The web app never proxies arbitrary agent requests; it uses defined server data and allow-listed actions only.

The dashboard reads world definitions from PostgreSQL. Until monitoring is in place, runtime state remains `UNKNOWN` rather than presenting seed data as live. Production status moves through `MartServ102 agent -> worker -> PostgreSQL -> web`, preserving the difference between `SLEEPING`, `DOWN_UNEXPECTEDLY`, `DEGRADED`, and `UNKNOWN`.

The agent is a separate Windows-native, read-only service. It binds to one explicitly configured private address, accepts a bearer token only from an explicit MartServ101 source address, and exposes only `GET /health`, `GET /v1/servers`, and config-allow-listed `GET /v1/servers/:key/status`. It has no generic proxy, shell, action, or path-taking route.
