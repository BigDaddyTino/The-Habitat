# Build Status

Last updated: 2026-08-10

## Phase 0 - Repository and Documentation

- [x] Git repository connected to `BigDaddyTino/The-Habitat`
- [x] Workspace, strict TypeScript, lint, and package scripts defined
- [x] Environment template and repository guardrails added
- [x] Architecture, security, deployment, operations, and adapter docs added
- [x] Dependencies installed; typecheck, lint, and production build passing

## Phase 1 - PostgreSQL and Prisma

- [x] Private PostgreSQL Compose definition added
- [x] Prisma 7 schema, generated client, initial migration, and idempotent seed
- [x] Database health, localhost-only binding, named-volume restart persistence validated

## Phase 2 - Auth and RBAC

- [x] Auth.js, Prisma adapter, secure session model, and Discord provider integration added
- [x] Server-side `ADMIN` / `USER` / `VIEWER` permission helpers and protected admin endpoint added
- [x] Invite-only sign-in gate and documented bootstrap-admin path added
- [x] Role-boundary tests and unauthenticated direct API denial verified
- [x] Discord OAuth application configured; end-to-end owner login verified and bootstrap setting removed

## Phase 3 - Server Registry and Basic UI

- [x] Great Hall dashboard and six registered world definitions
- [x] Worlds and Departure Board routes
- [x] Database-backed registry and audited admin metadata editor
- [x] Dashboard uses only verified registry data; runtime telemetry remains `UNKNOWN` until the agent reports it
- [x] Loopback-only production web service packaging with WinSW install, update, and removal scripts

## Phase 4 - Habitat Agent

- [x] Private read-only Node/TypeScript agent with token and source-IP authentication
- [x] Authenticated health, server list, and config-allow-listed status routes; no action or shell routes
- [x] Windows process, uptime, memory, CPU-time, disk, executable-version, and optional GameDig observations
- [x] WinSW template plus explicit install, uninstall, and MartServ101-only firewall scripts
- [x] Worker-to-agent authenticated health probe and tests
- [x] Deployed to MartServ102 with source-locked firewall and inspected Valheim/Palworld process telemetry

## Phase 5 - Live Monitoring

- [x] Authenticated worker client, state normalization, runtime persistence, transition history, and metric samples
- [x] Native MartServ101 worker service packaging and one-cycle rollout command
- [x] MartServ101 worker service records verified process telemetry and metric samples for all six registered worlds
- [x] Verified local GameDig queries for Valheim, Enshrouded, Project Zomboid, and 7 Days to Die provide ping, capacity, and supported player counts
- [x] Authenticated Palworld REST query deployed locally with agent-only credentials; player count, capacity, and version verified end to end
- [x] Dragonwilds process telemetry and allow-listed lifecycle-log heartbeats verified; player counts remain intentionally unavailable

## Phase 6 - Chronicle and Event Ingestion

- [x] Persistent normalized `ServerEvent` ingestion with database-enforced dedupe keys
- [x] Verified server lifecycle transitions and Dragonwilds world-save events recorded by the worker
- [x] Database-backed Chronicle route and Great Hall preview added with stable entry fragments
- [x] Replay-safe Dragonwilds save ingestion verified against live agent telemetry
- [x] Server-rendered Chronicle filters and permanent event detail links
- [x] Authenticated, audit-logged, database-deduplicated member reactions
- [ ] Palworld REST player-presence tracker awaiting first baseline and live join/leave verification
- [ ] Death events, only where a reliable adapter source exists

## Phase 7 - Player Identities and Profiles

- [x] Private cross-game identity registry populated from verified Palworld player observations
- [x] Authenticated member claim requests and admin-only, audit-logged approval or rejection flow
- [x] Profile identity cards and protected admin claim-review route
- [ ] Live claim and approval verification with a newly observed Palworld identity
- [ ] Discord identity, titles, equipped-title selection, and verified game-stat sections

## Phase 8 - Achievement Engine

- [ ] Not started

## Phase 9 - Halls of Shame and Legends

- [ ] Not started

## Phase 10 - Discord

- [ ] Not started

## Phase 11 - Wake Requests and Polls

- [ ] Not started

## Phase 12 - Controlled Server Actions

- [ ] Not started

## Phase 13 - Production Hardening

- [ ] Not started
