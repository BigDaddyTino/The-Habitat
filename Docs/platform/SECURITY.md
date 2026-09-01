# Security

## Network boundary

- Cloudflare Tunnel may expose only the loopback-bound `HabitatWeb` application.
- PostgreSQL, the Habitat Agent, game query ports, RCON/Telnet, Palworld REST, game-management APIs, SMB, WinRM, Docker, and Windows service-control interfaces are never public.
- The MartServ102 agent binds to one configured private address, requires a bearer token, and accepts only configured private source addresses.
- The OpenTelemetry collector, Tempo, Prometheus, and Grafana publish on `127.0.0.1` only. Traces carry request paths and host names, so telemetry is private operational data and is treated exactly like the database.
- Exporting telemetry from the agent would mean publishing the collector on the private network rather than loopback. That is a deliberate, separate decision; left alone the agent emits nothing and opens no outbound connection.

## Observability boundary

- `GET /api/pulse` is the only intentionally public observability surface. It exists so the tunnel can be proven from outside the network, and answers with nothing but `{"service":"habitat-web","status":"ok"}` — no version, build, uptime, or anything else that would help fingerprint the installation.
- `/admin/pulse` and every signal it renders require `ADMIN`.
- Habitat Pulse alerts carry infrastructure detail, so they are delivered only to a guild's explicitly configured operations channel. There is no fallback to the community announcement channel, and the delivery target is captured when the notice is queued so a later configuration change cannot redirect one.
- A configured OTLP endpoint carrying credentials, a query string, or a fragment is refused rather than silently stripped; credentials in a telemetry URL end up in logs and process listings. Authentication belongs in `HABITAT_OTEL_EXPORTER_OTLP_HEADERS`.
- `PulseSignal`, `ServiceHeartbeat`, `CollectorSourceState`, and `EvaluationFailure` hold operational facts only — no secrets, and no infrastructure addresses.

## Application boundary

- Discord access is invite-only; the bootstrap-admin email is an untracked temporary setting.
- Server-side role checks protect every privileged route. Client visibility is never authorization.
- Steam ownership is accepted only after server-side Steam OpenID validation.
- Avatar uploads are magic-byte checked, stored under generated UUID names, and served through a path-restricted route when external storage is configured.
- User-entered social handles are unverified metadata and are never treated as a live provider connection.
- Identity ownership changes are previewed, conflict-checked, written to an append-only ownership ledger, and reversible. Approval past a severe conflict and every rollback require a typed confirmation, and conflicts are re-detected inside the write transaction so a stale preview cannot authorise a change.
- Provider identifiers are never rendered on claim surfaces; those views report only whether proof exists and whether it matches.
- The scoped member profile/identity/progression export is administrator-only, audit logged, `no-store`, declares what it does and does not include, and excludes OAuth tokens, session tokens, verification tokens, and link nonces by construction rather than by filtering.

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
