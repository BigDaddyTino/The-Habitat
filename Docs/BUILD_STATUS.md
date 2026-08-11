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
- [x] Admin-managed title definitions and grants; members can equip one earned title at a time
- [ ] Live claim and approval verification with a newly observed Palworld identity
- [ ] Discord identity and additional verified game-stat sections

## Phase 8 - Achievement Engine

- [x] Achievement definitions, rarity, points, data-driven rule configuration, and persistent award records
- [x] Event-driven, idempotent evaluation from verified player-join Chronicle events
- [x] Initial verified participation definitions seeded: Welcome to God's Country and Habitat Tourist
- [x] Member-facing achievement archive and Chronicle award entries
- [ ] Live award verification after an approved Palworld identity joins a Habitat world
- [ ] Additional verified rule types, secret achievements, progress views, manual awards, and notifications

## Phase 9 - Halls of Shame and Legends

- [x] Record definitions, current holders, break history, and database-enforced replay safety
- [x] Event-driven Legend evaluator for verified visits, games explored, and achievements earned
- [x] Chronicle `RECORD_BROKEN` entries with a direct link back to the qualifying evidence
- [x] Hall of Legends and Hall of Shame routes with world and record-holder filters
- [x] Hall cards show current holder, value, date, prior record, and a restrained new-record treatment
- [ ] Live first-record verification after an approved identity produces a qualifying event
- [ ] Shame categories, pending a trustworthy death or reconnect adapter source

## Phase 10 - Discord

- [x] Optional private Discord bot runtime in the MartServ101 worker; monitoring remains independent when Discord is unavailable
- [x] Guild-scoped read-only commands: `/habitat`, `/server`, `/who`, `/leaderboard`, `/shame`, `/chronicle`, and a safe non-actioning `/wake`
- [x] Admin-only, audit-logged guild and announcement-channel configuration
- [x] Durable, replay-safe Discord outbox for server online/rest/outage, record-break, and Legendary-achievement notices
- [x] Category-level notification toggles; ordinary joins and leaves remain silent
- [x] Live bot install, guild command registration, private command delivery, and command verification
- [ ] Wake-request notices, weekly Chronicle summary, and other Phase 11-driven Discord flows

## Phase 11 - Wake Requests and Polls

- [x] Authenticated wake requests for intentionally sleeping worlds with database-enforced one-request-per-world behavior
- [x] Member support votes, admin approval or rejection, Chronicle entries, and audit records; no server action is dispatched
- [x] Optional Discord wake notice and mapped Discord `/wake` request path, both dormant until bot installation
- [x] One active, time-bounded game-night poll with one revisable vote per member
- [x] Admin poll creation and closure, member poll page, and active-poll Great Hall surface
- [ ] Live request, approval, poll, and Discord verification with Habitat members

## Phase 12 - Controlled Server Actions

- [x] Local-only direct-executable service-wrapper installer for named game and update services
- [x] Agent-side fixed allow-list for `start`, `stop`, `restart`, and `update`; no request can provide a command, path, argument, or service name
- [x] Admin-only, typed-confirmation command queue with worker dispatch and append-only command lifecycle audits
- [x] Install and individually verify start/stop/restart behavior for all six MartServ102 game services and update behavior for Valheim
- [x] Persisted command queue, admin confirmation surface, worker dispatch, and command audit trail
- [ ] Replace the initial command-shell wrappers with direct executable ownership and repeat lifecycle verification, including proof that no configured process remains after stop

## Phase 13 - Production Hardening

- [ ] Not started
