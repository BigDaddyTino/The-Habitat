# Security

## Network boundary

- Cloudflare Tunnel may expose only the loopback-bound `HabitatWeb` application.
- PostgreSQL, the Habitat Agent, game query ports, RCON/Telnet, Palworld REST, game-management APIs, SMB, WinRM, Docker, and Windows service-control interfaces are never public.
- The MartServ102 agent binds to one configured private address, requires a bearer token, and accepts only configured private source addresses.

## Application boundary

- Discord access is invite-only; the bootstrap-admin email is an untracked temporary setting.
- Server-side role checks protect every privileged route. Client visibility is never authorization.
- Steam ownership is accepted only after server-side Steam OpenID validation.
- Avatar uploads are magic-byte checked, stored under generated UUID names, and served through a path-restricted route when external storage is configured.
- User-entered social handles are unverified metadata and are never treated as a live provider connection.

## Agent and command boundary

- The agent exposes only authenticated health, status, bounded history, and fixed action routes.
- Its local configuration provides allowed server keys, history paths, queries, and named services; request payloads cannot override them.
- Commands are restricted to allow-listed `start`, `stop`, `restart`, and `update` operations, require server-side admin authorization and typed confirmation, and are audit logged through a durable queue.
- A stopped Windows service is not considered a successful game stop until the configured process has also exited.

## Data boundary

- Secrets live only in ignored `.env`, agent configuration, or generated local service files; never in Git, browser payloads, or intended logs.
- Per-server credentials are not returned to browsers. Database encryption material, where configured, remains separately managed.
- Prisma data is persisted in loopback-only PostgreSQL. Backups containing configuration are treated as secret material.
- Event, XP, reward, command, and reconciliation pipelines use database dedupe keys and append-only/audited records where relevant to prevent replay from granting duplicate effects.
