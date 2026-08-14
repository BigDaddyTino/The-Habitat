# Build Status

Last updated: 2026-08-14

This is the implementation source of truth. Checked items are built and locally validated; unchecked items are intentionally pending, require real-world verification, or remain outside the approved scope. Seeded registry/content data is never a claim of live telemetry.

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
- [x] Active-member invitation flow, exact Discord-email guidance, friendly OAuth denial handling, automatic member callsigns, and audited standard-role grants
- [x] Distinct Monday-rotating member invite codes with signed short-lived redemption, Discord verification, permanent inviter-to-member attribution, and audit records
- [x] Proxy-safe canonical public origin shared by Discord authentication, Steam OpenID, absolute redirects, and same-origin checks; production refuses unsafe origin configuration
- [x] Repeatable read-only connection audit validates database, private agent authentication, public origin, provider callbacks/credentials, Discord guild access, and club-provider selection without printing secrets

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
- [x] Valheim death, native achievement, and personal-record recovery from the structured HabitatCore Chronicle
- [ ] Death events for other games, only where a reliable adapter source exists

## Phase 7 - Player Identities and Profiles

- [x] Private cross-game identity registry populated from verified Palworld player observations
- [x] Authenticated member claim requests and admin-only, audit-logged approval or rejection flow
- [x] Profile identity cards and protected admin claim-review route
- [x] Admin-managed title definitions and grants; members can equip one earned title at a time
- [x] Pre-claim impact preview measured by projecting the claimant's progression with and without the candidate identity through the live rule engine
- [x] Merge-conflict detection covering ownership races, contradicting Steam proof, competing claimants, duplicate character names, prior revocations, and overlapping sessions, with typed confirmation past severe conflicts
- [x] Append-only `IdentityOwnershipTransaction` ledger recording every ownership transition with its projected and applied impact, backfilled for pre-existing ownership
- [x] Administrator rollback that detaches an identity and reverses playtime XP plus no-longer-earned identity/level achievements, rewards, titles, award events, and record holdings in one transaction without touching unrelated activity or web awards
- [x] Identity dossier with ownership history, claim history, audit trail, and evidence provenance by source, confidence, and window
- [x] Administrator member data export as audit-logged JSON that declares its profile/identity/progression scope, excludes credentials, and states its own truncation
- [x] Unlink consequences shown before confirmation on both administrator rollback and member Steam disconnect
- [ ] Apply `20260814143000_preserve_identity_ownership_history` so deleting an identity cannot cascade-delete its permanent ownership ledger
- [ ] Live claim and approval verification with a newly observed Palworld identity
- [ ] Discord identity and additional verified game-stat sections

## Phase 8 - Achievement Engine

- [x] Achievement definitions, rarity, points, data-driven rule configuration, and persistent award records
- [x] Event-driven, idempotent evaluation from verified player-join Chronicle events
- [x] Initial verified participation definitions seeded: Welcome to God's Country and Habitat Tourist
- [x] Member-facing achievement archive and Chronicle award entries
- [ ] Live award verification after an approved Palworld identity joins a Habitat world
- [x] Additional verified rule types, concealed secret achievements, verified progress views, rarity ceremonies, and top-tier notifications
- [ ] Manual achievement awards remain intentionally unimplemented; the normal award path requires verified Chronicle evidence

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
- [x] Replace the initial command-shell wrappers with direct executable ownership; 7 Days to Die process exit and Palworld native REST shutdown verified end to end
- [x] Persisted command queue, admin confirmation surface, worker dispatch, and command audit trail
- [x] Direct-wrapper lifecycle verification accepted for Valheim, Enshrouded, Project Zomboid, and Dragonwilds

## Phase 13 - Production Hardening

- [x] Dedicated remotely managed `habitat-martserv101` Cloudflare Tunnel installed as an automatic Windows service on MartServ101
- [x] `habitat.martinobear.com` published through a proxied tunnel route to the loopback-only `http://127.0.0.1:3000` origin; public HTTPS and certificate verified against both advertised Cloudflare edge addresses
- [x] Legacy public DNS-only A record removed; no database, agent, game, RCON, file-sharing, or management port was added to the tunnel
- [x] MartServDMC's legacy split-horizon A record for `habitat.martinobear.com` removed
- [x] MartServDMC internal DNS now returns two short-TTL Cloudflare edge A records for `habitat.martinobear.com`; LAN HTTPS verification completed
- [x] Full backup and restore drill completed and operator-verified
- [x] MartServ101 reboot, automatic service startup, and application recovery completed and operator-verified
- [x] MartServ102 reboot, agent recovery, and managed game-service recovery completed and operator-verified
- [x] Managed restart flows exercised across the deployed Habitat and game services
- [x] Production Discord OAuth callback pinned to the public Habitat origin and verified against the registered Discord redirect URI
- [ ] Remaining Phase 13 production-hardening audit intentionally pending

## Pre-Phase 13 - Community and Great Hall Expansion

- [x] Verified-data leaderboards for activity, exploration, and achievement points
- [x] Member-customizable public profile cards, optional gaming/social handles, avatar presets, and controlled image uploads
- [x] Private member profile command-center redesign with a cinematic identity header, anchored task navigation, grouped identity/world/connection/collection chapters, explicit provider privacy states, responsive mobile layouts, and reduced-motion support while preserving every existing profile control
- [x] Cinematic public member roster with profile links, live portal status, verified hosted-world presence, member-only browser/device context, and member-driven invitation console
- [x] Premium Admin Suite command deck with grouped navigation, live operational counts, recent audit signal, and responsive desktop/mobile presentation
- [x] Whole-app Eastern-time ambience pass with sunrise, midday, sunset, and night palettes that coordinate the canvas, panels, typography, header, and lodge imagery while preserving readable contrast and visible sky-state identity across desktop and mobile
- [x] Generated Habitat-specific member standard and Admin Suite command reliquary overlays, plus illustrated title-plate and avatar-frame atlases applied consistently to roster cards, public profiles, private profiles, and reward selectors
- [x] Audited member management for role changes, suspension/reactivation, database-session revocation, pending-invitation revocation, and referral-lineage review with self/last-admin lockout protections
- [x] Achievement reward inventory with automatic titles, selectable avatar borders, profile layout unlocks, and badges
- [x] Always-cinematic Great Hall with composition-matched sunrise/midday/sunset/night plates tied to America/New_York, a continuously rendered Three.js vista, pointer-depth parallax, adaptive quality, reduced-motion behavior, and an image fallback
- [x] Deterministic living-window scheduler produces exactly three brief, sky-appropriate encounters per Eastern hour while leaving the Hall quiet most of the time: bird flocks, bear visits, UFOs, comets, aurora, fireflies, eclipse, blood moon, lightning, and storms
- [x] Server-verified clickable bear encounter with a synthesized roar, replay-safe secret achievement, selectable Bearly Welcome title, Window Bear trophy, immediate reward ceremony, and audit record
- [x] Cinematic event parity pass with generated, alpha-matted bear/raven/UFO plates; phase-aware color grading; exterior-window feathering; balcony-rail depth occlusion; synchronized elapsed-event animation; photographic storm, comet, celestial, aurora, and branched-lightning composites; and Chrome desktop/mobile visual QA
- [x] Great Hall encounter professionalization pass with correct intrinsic asset geometry, eager rare-event loading, articulated flock/UFO/bear motion, responsive scene anchors, feathered depth masks, event-driven room bounce lighting, deterministic visual-QA frames, and an automated all-encounter animation contract
- [x] Verified Steam OpenID linking and automatic SteamID64 identity ownership without administrator approval
- [x] Steam callback ownership attachment now queues reward reconciliation for every exact-ID match and explicitly reports a zero-character match without guessing from Steam library ownership or character names
- [x] Idempotent legacy-history import from fixed, agent-configured log sources with bounded reads and no request-supplied paths
- [x] Legacy identity ingestion rejects placeholder provider keys such as `None` at the agent, worker, and database boundaries; the duplicate placeholder `Crazyred_19` identity and its two zero-duration events were removed after a successful backup while the real provider-key identity was preserved
- [x] Bounded directory scans now prioritize newest files and complete log tails; Valheim Chronicle-to-Steam correlation requires mutually unique one-to-one join timestamps and reassigns replayed evidence without duplicating events
- [x] Previously missed verified-identity reconciliation jobs were backfilled and completed for the three affected historical Tino identities
- [x] Reconstructed Valheim sessions from paired Steam connect/disconnect timestamps, plus conservative Steam-ID participation evidence for other supported logs
- [x] Automatic Steam ownership for recovered identities, retroactive verified-visit achievement evaluation, and a separate Old Guard legacy achievement for non-timed evidence
- [x] Cross-game and public-Steam persona reconciliation replaces Enshrouded `Steam ######` fallbacks and rewrites matching historical Chronicle actor labels without altering verified ownership
- [x] Legacy Hours leaderboard and public-profile totals; only timestamp-paired sessions contribute playtime
- [x] Persistent Level 1-100 progression ledger with a deliberately steep 1.2M+ XP summit
- [x] Cumulative verified-playtime XP with partial-session carryover and historical-session reconciliation
- [x] Four deterministic-random weekly quests with automatic replay-safe rewards and weekly member progress
- [x] Level milestone achievements at 10/25/50/75/100 with titles, animated borders, layouts, and badges
- [x] Quest board, profile level bars, Habitat Level leaderboard, and reduced-motion-aware XP/level-up toasts
- [x] Full-card Great Hall server dossiers with sleeping-world access, retained telemetry, verified roster activity, and server Chronicle signals
- [x] Compact live-character disclosure in each server dossier: current named-player snapshots are persisted for name-capable adapters and shown only for the matching current agent sample; count-only adapters remain explicitly unnamed
- [x] Compact, hourly-cached game-specific news and patch-note dispatch rail on each server dossier, capped at three linked source items
- [x] Observed-but-unclaimed player identities shown as explicitly labeled competitors in server rosters and leaderboards, with provisional standing only
- [x] Durable, idempotent claim-reconciliation queue: approved or Steam-verified ownership replays attached verified history into XP, achievements, titles, badges, layouts, and leaderboard totals
- [x] Clickable claimed-character cards on private and public profiles open an exact identity-filtered Chronicle containing up to 100 retained events
- [x] Unified rarity-aware reward ceremonies for XP, levels, and every achievement tier, coordinating a Three.js particle scene and Canvas2D Rive state machine from one animation clock
- [x] Living Three.js trophy cabinet on private and public profiles, filled exclusively from persisted badge, medal, and trophy unlocks with pointer inspection, accessible inventory controls, mobile composition, and non-WebGL fallback
- [x] Premium collectible-art pass: 28 reward-specific relief designs across 11 badges, 9 medals, and 8 trophies; generated museum-grade cabinet/material artwork; distinct modeled silhouettes, ribbons, pins, bases, and engraved data-backed reverses; smooth click-to-inspect zoom, inertial pointer/touch and keyboard rotation, wheel zoom, mobile inspection bay, and the same 3D reward in earned ceremonies
- [x] Trophy-cabinet legibility pass: trophy-first inventory ordering, larger angled trophy silhouettes, relief art moved off the sculpted volume, neutral museum lighting isolated from Eastern sky grading, and exact alpha-backed avatar frames without blend-mode haze or animated geometry drift
- [x] Trophy-cupboard fit-and-finish pass with stable opaque relief rendering, grounded physical mounts, shelf-aligned scale and spacing, removed idle bobbing, and a centered four-column mobile cabinet composition
- [x] Interactive filtered achievement archive with server-side secret redaction, verified progress bars, rarity presentation, reward previews, and 39 catalogue records
- [x] Expanded verified achievement catalogue: progression, legacy, exploration, extreme return-visit milestones, humorous secrets, and six per-game mastery records with titles, borders, layouts, badges, medals, and trophies
- [x] Replay-safe historical catalogue reconciliation for claimed members with retroactive rewards and suppressed Discord announcements
- [x] Live bounded history sources deployed on MartServ102: Valheim HabitatCore Chronicle, Project Zomboid named Steam connections, Enshrouded accepted Steam sessions, 7 Days persistent-player XML, and Dragonwilds session logs
- [x] MartServ102 Valheim WinSW `VALHEIM_LOG` activated and verified untruncated through the authenticated connection audit; the first replay recovered 18 Steam-backed records and 16 timed sessions, and an immediate second replay inserted zero duplicates
- [x] Recovered unclaimed rosters and Chronicle events imported without premature XP: 6 Valheim names, 4 Project Zomboid names, 4 Enshrouded Steam identities, and 2 named 7 Days Steam identities
- [x] Palworld official game-data snapshot support enabled and bounded without treating returned actors as currently online; live verification currently returns zero player actors, so this moment-in-time world snapshot is not represented as complete persisted legacy history
- [ ] Durable Palworld legacy-player recovery remains a real coverage gap: there is no configured historical source, and safe save-file extraction is still required for characters absent from the live player and game-data snapshots
- [ ] Telemetry-only, game-specific event collectors: staged behind private agent authentication and per-game backup/validation gates; no gameplay-changing mods deployed
- [x] Provider-authenticated Twitch live presence implemented for the `/streams` broadcast wing: OAuth channel ownership proof, member-revocable showcase opt-in defaulting to off, batched Helix live polling with observed stream sessions, and a database check constraint keeping live columns NULL while offline. Entered handles are still never represented as verified or live, and an unconfigured integration reports live status as unavailable rather than implying nobody is streaming. Awaiting operator credentials (`TWITCH_CLIENT_ID`/`TWITCH_CLIENT_SECRET` plus the registered callback) before first live verification
- [ ] Discord streaming presence is built but dormant: it needs the privileged `GUILD_PRESENCES` intent enabled in the Discord developer portal and `HABITAT_DISCORD_PRESENCE=on`. It is displayed as a Discord signal only, and a self-reported stream URL is linked only when it matches that member's verified channel
- [ ] Dragonwilds retained dedicated-server logs contain no player-session lines yet; the deployed collector will ingest authenticated account/name join and leave signals when real sessions occur
- [x] Unified Games hub now presents hosted worlds and Club Rooms under one clubhouse hierarchy; Marvel Rivals is surfaced in the Great Hall with a cinematic lodge war-room image and an honest six-seat member board
- [x] Header navigation consolidated around Great Hall, Games, Chronicle, and a compact Progress menu; Game Night and the Departure Board now live in the Games hub
- [x] Marvel Rivals member-link model added: Steam remains the verified Habitat identity while the separately entered public Rivals UID is explicitly labeled member-linked, audit logged, and never presented as cryptographic ownership
- [x] Persistent Rivals profile records and stat snapshots added with a private-key server action and a bounded, sequential six-hour worker refresh; private/error states retain the last good figures
- [x] Marvel Rivals official Steam announcements now feed the same compact news and patch-note rail used by hosted game dossiers
- [ ] Live Marvel Rivals profile linking awaits a private `MARVEL_RIVALS_API_KEY`; the room remains functional and accurately reports the integration as offline until configured

## Steam and Club Provider Expansion

- [x] Separate Steam enrichment consent, privacy notice, visibility controls, deletion cascade, cached profile/library models, and independent profile/library sync state
- [x] Bounded Steam profile, owned-game, and per-app achievement synchronization with strict parsers, timeouts, last-good retention, terminal unsupported states, and a persistent daily request budget
- [x] Marvel profile refresh hardened with deterministic snapshots, retry metadata, private/error preservation, and a persistent daily request budget
- [x] Cursor-overlap Marvel match ingestion, participant-level results, supported hero performance, recent form, rank snapshots, tracked-since language, and shared-match coverage caveats
- [x] Marvel provider consent now starts private; visibility is member-controlled and disconnect cascades provider matches, activities, activity-backed awards/records, and notifications
- [x] Normalized cross-game `GameActivity` evidence layer added without replacing or fabricating `ServerEvent` rows
- [x] Activity-backed achievement and record engines, exact evidence links, Discord outbox support, and privacy-filtered Chronicle projection implemented
- [x] Six additive migrations applied after a successful backup; bounded hosted-source backfill reconciled 30 of 30 eligible sources and a replay projected zero duplicates
- [x] Cross-game reward/record catalogue seeded behind `HABITAT_CROSS_GAME_CONSUMERS_ENABLED=false` pending real-provider shadow evaluation
- [x] Steam API key accepted by the non-personal supported-interface contract check; `STEAM_DATA_STORAGE_COUNTRY=US` is published by the privacy route
- [x] Consenting live member profile and owned library synchronized with last-good retention; 259 visible games and Steam-reported playtime cached without creating Habitat XP
- [x] Steam achievement API denial is classified as an account-level access restriction and defers the whole queue instead of retrying every app
- [ ] Live Steam achievement progress remains unavailable because Steam returns HTTP 403 for the consenting account on both documented achievement hosts
- [ ] Live Marvel match pagination, convergence, privacy, quota, and retention verification awaits provider recovery, `MARVEL_RIVALS_API_KEY`, and consenting test profiles
- [ ] Cross-game consumers remain intentionally disabled until live-provider fixtures and shadow-award/record comparisons pass review

## 2026-08-13 - Repository Audit and Safe Hardening

- [x] Completed a repository-wide architecture, security, dependency, data-flow, migration, integration, performance, and cleanup audit; see `Docs/AUDIT_2026-08-13.md`
- [x] Closed the member-invitation role gap end to end: only `USER` and `ADMIN` members can render, create, resolve, or sign in through member invitations
- [x] Made invitation creation and its audit record atomic
- [x] Resolved all five baseline production dependency advisories with workspace-level PostCSS and Sharp resolutions; the production audit now reports zero advisories
- [x] Added baseline HSTS, content-type, frame, referrer, and browser-permission response headers in web configuration without claiming deployment
- [x] Bounded game-news fetches to five seconds and rejected non-HTTPS provider links
- [x] Added Twitch credential verification to the sanitized operator connection audit
- [x] Changed all tracked WinSW service templates from unbounded append logs to 10 MB/date rolling logs with 14-file retention
- [x] Hardened backup failure cleanup for container dumps and staged secret configuration
- [x] Revalidated sequential typecheck, 125 tests, lint, optimized production build, XML syntax, PowerShell syntax, dependency audit, and connection checks
- [ ] Define and deploy a backed-up `ServerMetricSample` retention/downsampling policy; the audit measured 96,221 samples in less than three days and intentionally deleted none
- [ ] Capture a real Dragonwilds player-session fixture and validate the parser; the readable live source still contains zero parseable player records
- [ ] Add sequential CI gates and stage a report-only CSP with Auth.js/Rive/Three.js desktop and mobile coverage
- [ ] Convert the remaining administrative mutation/audit pairs to transactions
- [ ] Deploy the tracked web/service hardening through the private release process and verify production headers and installed WinSW rollover configuration

## 2026-08-14 - Operational Observability

- [x] Added `/admin/pulse`, a private administrator view of twelve evaluated signals: tunnel reachability, web/worker/agent freshness, per-world collector health, last database backup, event-ingestion lag, event volume against the installation's own baseline, Discord and Twitch provider state, failed pipeline evaluations, and stuck claim reconciliations
- [x] Made the worker the sole evaluator and persisted every verdict to `PulseSignal`, so the admin view and any Discord alert always report the same judgement of the same facts
- [x] Recomputed web and worker liveness in the view from `ServiceHeartbeat` rather than trusting the worker to report its own death; a stale worker dims and dates every other signal instead of leaving a wall of green
- [x] Treated an unevaluable signal as `UNKNOWN`, never green and never alertable, and treated a readable collector source that parses zero records as a failure rather than a quiet day
- [x] Added heartbeats to the web and worker processes carrying their own declared cadence, so freshness is judged against the writer's interval instead of a guessed constant
- [x] Added per-world, per-source `CollectorSourceState` recorded by the history scan, and `EvaluationFailure` so one poisoned record is skipped and stays visible instead of silently aborting a whole import cycle
- [x] Routed Habitat Pulse alerts to a guild's explicit `operationsChannelId` only, with no fallback to the community announcement channel, one alert per transition, and one recovery note; a queue that reached nobody is not recorded as notified
- [x] Instrumented the web app, worker and agent with OpenTelemetry over OTLP, dormant unless an endpoint is configured, refusing endpoints that carry credentials, a query or a fragment
- [x] Added a loopback-only collector, Tempo, Prometheus and provisioned Grafana to `docker-compose.yml`, with the backend replaceable by editing exporters alone
- [x] Verified live: traces from `habitat-web` and `habitat-worker` in Tempo, worker metrics in Prometheus, all twelve signals evaluating, and Pulse independently detecting the known Dragonwilds parser failure
- [x] Audited and hardened Pulse alert transitions: `UNKNOWN` can neither alert nor send a false recovery, notification state requires durable outbox evidence, and orphaned markers from the earlier build self-repair
- [x] Expanded `EvaluationFailure` coverage to legacy import, activity projection, catalog reconciliation, and identity reconciliation, with per-record isolation, deduplication, and automatic resolution after a successful replay
- [x] Made backup health verify the recorded dump path and exact non-zero size, made Twitch health enforce its configured poll cadence, and made enabled worlds with no history collector visible in the breakdown without miscounting them as failed configured sources
- [x] Added an early worker telemetry bootstrap so `pg` and HTTP dependencies load after instrumentation, restored collector self-metrics for Prometheus, derived web request metrics from Next spans, and corrected the database-rate dashboard query
- [x] Tightened the Pulse layout with content-sized desktop grids, an explicit missing-collector state, and an accessible compact mobile navigation that does not overflow a 390px viewport
- [x] Accounted for Next's already-loaded `node:http`: the web app exports native Next request spans and the collector derives request/error metrics from them, avoiding a production TS preload solely for duplicate counters; see `Docs/OBSERVABILITY.md`
- [ ] Set an operations channel on `/admin/discord` to actually receive Pulse alerts; none is configured, so alerting is currently inert by design

## 2026-08-14 - Agent Deployment Recovery

- [x] Established that MartServ102 was still executing the 2026-08-11 agent build: the Valheim Steam identity correlation, rotated-log offset handling, the `sc.exe` kill timer, the `400 invalid_request_body` response, and the telemetry bootstrap were all committed but unreachable by the running service
- [x] Diagnosed the 2026-08-13 crash loop from the agent error log: the agent is the only workspace that runs compiled output on bare `node`, and its new value imports from `@habitat/shared` reached the extensionless relative re-exports in that package, which tsx and the bundler accept but Node rejects
- [x] Exposed `@habitat/shared/agent` and `@habitat/shared/telemetry-config` as focused subpath exports and pointed the agent value imports at them without touching the specifiers the web app and worker rely on
- [x] Added `apps/agent/scripts/verify-build.mjs` to the agent build so every emitted module is loaded under bare `node`; neither the tsx test run nor `tsc` exercises that resolver, which is why an unloadable build shipped
- [x] Installed the missing OpenTelemetry dependencies on MartServ102 and refreshed the installed `HabitatAgent.xml` from the tracked template, correcting a relative `logpath` that sent application output to `C:\Windows\System32\logs`, a `sizeThreshold` of 10485760 KB rather than the intended 10 MB, and `keepFiles` 5 rather than 14
- [x] Verified live on MartServ102: clean start with an empty error log, telemetry dormant with no endpoint configured, the allow list rejecting the agent host itself, and the Valheim scan attributing 7 Chronicle character records to SteamID64 and naming 7 archived sessions where the previous build attributed none
- [ ] Move the historical agent output left in `C:\Windows\System32\logs` by the earlier relative `logpath`, including the 2026-08-13 crash evidence, once it is no longer needed for reference

## 2026-08-14 - Agent Review Corrections

- [x] Prevented Valheim character-name reuse from being suppressed: sequential Steam sessions now retain both observed name pairings, making the mapping ambiguous and leaving Chronicle identity native instead of assigning the first account
- [x] Refused Valheim identity correlation whenever either required source set is unavailable or truncated, because a partial scan cannot prove a one-to-one mapping
- [x] Added regression coverage for reused names and incomplete correlation sources
- [x] Replaced in-place Agent compilation with a staged build that stamps a Git/CI build identifier, verifies output under bare Node, preserves the current `dist` on failure, and retains the previous verified artifact for rollback
- [x] Compiled the Agent's shared runtime subpaths to JavaScript before its build, removing the service's runtime dependence on TypeScript source and pnpm symlink resolution
- [x] Added a checked elevated updater that uses fast-forward-only pulls, refuses tracked uncommitted changes, stops on native command failure, refreshes the installed WinSW XML, probes the protected local health route, and restores the previous XML/build if the new service does not stay healthy
- [x] Pinned the service XML to a validated absolute Node 24.19+ executable and explicit Agent working directory
- [x] Corrected all generated game/update service logs to 10 MB, midnight rolling, and 14-file retention; added the missing midnight roll trigger to the Agent, worker, and web templates
- [ ] Deploy the corrected Agent with `update-agent.ps1`; replace the twelve generated game/update services only during a controlled window after confirming every game process is stopped

## 2026-08-14 - Habitat Live Layer

- [x] Added one shared, typed live-event contract projected exclusively from confidence-100 `ServerEvent` evidence; the authenticated browser feed is bounded, cursor-based, private/no-store, and introduces no public service or port
- [x] Connected verified world starts to matching Great Hall portal ignition and verified unexpected stops to a distinct portal sputter treatment; intentional `SLEEPING` remains visually and semantically separate
- [x] Added a five-player threshold crossing event that requires a known prior player count, records a Chronicle entry, warms and populates the Hall, and queues a replay-safe Discord notice
- [x] Added allow-listed HabitatCore `BOSS` ingestion, Chronicle presentation, server-wide trophy ceremony, Discord notice, and a verified-identity Bossbreaker achievement with a persisted trophy reward
- [x] Connected top-tier persisted achievement events to a temporary Great Hall constellation and routed all five live moments through the existing Three.js/Rive cinematic ceremony renderer with reduced-motion fallbacks
- [x] Completed the Live Layer cinematic polish pass: a self-contained transparent vector antler/mountain Legendary constellation crest, celestial orbit and impact-light choreography, warm gathering silhouettes and firelight, an authored boss reliquary rise, multi-ring portal ignition, crash-only portal core sputter, full-screen Legendary ceremony rays, and a bespoke rotating 3D Bossbreaker Reliquary; all effects have responsive and reduced-motion presentations
- [x] Audited every Live Layer image reference and visual anchor in-browser at desktop and 390px mobile widths; removed the rejected fringe-contaminated raster crest, corrected the mobile toast viewport overflow and Three.js ceremony center, and added regression coverage for asset transparency, anchors, sleeping-state isolation, and mobile placement
- [x] Added localhost-only visual QA routes for Hall, portal, and toast choreography. Every preview is explicitly marked as a visual preview/no event recorded and never enters Chronicle, progression, telemetry, or Discord
- [x] Added live projection, threshold, and boss parser coverage; strict shared/worker/web typechecks, agent and worker tests, web tests, and web lint pass locally
- [x] Restored and verified the loopback HabitatWeb service on the new build after validation; the web projection detects installed event enum values, so this staged rollout does not represent the unapplied gathering migration as available
- [x] Applied migrations `20260814170000_add_habitat_live_layer` and `20260814193000_index_server_event_arrival`, ran the idempotent seed, and deployed the web, worker, and agent builds through their private service processes. Post-deployment verification confirmed fresh heartbeats, the exact current agent build, an empty Discord queue, no unresolved evaluation failures, and the authenticated desktop/mobile UI

## 2026-08-14 - Habitat Live Layer correctness pass

- [x] Served the Legendary constellation crest unoptimized. Next's image optimizer answers 400 for SVG unless `dangerouslyAllowSVG` relaxes the policy for every image, so the crest — the centrepiece of the Legendary reaction — was never rendering in the browser while its regression test still passed on the file's contents
- [x] Stopped a history import from announcing recovered boss kills. Only a kill still fresh at import time reaches Discord; the rest enter the Chronicle silently instead of arriving as breaking news
- [x] Bucketed the world-gathering dedupe key by a six-hour cooldown, so a group sitting on the five-player boundary can no longer re-announce itself every fifteen-second cycle. The bucket derives from the timestamp rather than worker memory, so a restart does not reopen the window
- [x] Removed the Bossbreaker Reliquary's borrowed atlas tile, which was presenting the Centurion Monument's relief as the reliquary's own artwork on its emblem and 3D plaque. Authored tiles are now unique per atlas by test, and an unauthored collectible falls back to its modeled and icon forms
- [x] Indexed `ServerEvent(receivedAt, id)` and narrowed the live feed to the five projectable event types, replacing a per-poll sequential scan and sort. The feed's event-type allow-list is filtered through the installed enum values, so it stays stageable ahead of its migration
- [x] Flagged each live event with whether the requesting viewer is its verified actor, so a member's own Legendary is no longer staged twice — once by the clubhouse broadcast and once by their progression feed. The Hall constellation still fires for the earner
- [x] Took every idle Live Layer overlay out of the box tree instead of leaving it transparent; roughly thirty infinite decorative animations had been running permanently on the Great Hall and world grids. A sleeping card now makes an exception for a verified ignition, which its stale rendered state had been suppressing
- [x] Full workspace verification after the pass: typecheck, lint, 203 tests, and production build all green
