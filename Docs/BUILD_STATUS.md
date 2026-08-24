# Build Status

Last updated: 2026-08-20

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
- [x] Chronicle Replay Theater groups retained evidence into daily cinematic chapters with playback controls, abstract non-coordinate journey paths, verified player and achievement spotlights, honest media availability, permanent receipts, and a Discord-ready private recap copy action
- [x] Chronicle visual package adds original lodge-theater, transparent projector, and recap-card artwork; event-reactive light, film, dust, route, and transition choreography; reduced-motion fallbacks; and local-only downloadable Discord PNG cards populated from retained chapter evidence
- [x] Signed-in Chronicle Director's Cut uses the member's real avatar, equipped title, claimed identity links, achievements, records, and retained sessions to build a provenance-safe personal reel; owned scenes receive a generated brass-and-iron portrait reliquary, personal spotlight choreography, a filtered evidence archive, and a locally rendered recap seal without inventing history or transmitting Chronicle data
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
- [x] Hall of Legends and Hall of Shame routes present exactly five cinematic category showcases each; the world and record-holder filter bars were retired because a five-category hall has nothing left to narrow
- [x] Hall cards show current holder, value, date, prior record, and a restrained new-record treatment
- [x] Lifetime cross-world Combat record sums verified eliminations from hosted `PLAYER_KILLED` evidence and Club Game match history under one gameKey-free definition
- [x] Five seeded Shame categories: lifetime deaths, worlds died in, heroic defeats, consolation crowns, and uncredited assists
- [x] Category showcase manifest is CI-locked to the seeded record catalog, so a new record can never land in an unrendered wing
- [ ] Live first-record verification after an approved identity produces a qualifying event
- [x] All ten category banners authored at the 2400x1000 cinematic spec and CI-asserted for presence and dimensions; generation prompts retained in `Docs/HALL_CATEGORY_ART.md`
- [ ] Combat and Supporting Role records stay unheld until a source emits `PLAYER_KILLED` or Club Game ingestion is enabled

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

## 2026-08-14 - Seasons and Community Expeditions

- [x] Added optional, exact three-calendar-month seasons as a separate persisted progression layer; lifetime XP, levels, achievements, titles, records, and prior rewards are never reset or rewritten
- [x] Added explicit member enrollment, replay-safe verified-playtime season XP, a cooperative community XP bar, personal quests, whole-lodge team quests, and per-game expedition progress
- [x] Added seasonal leaderboard scope and metric tabs without removing the lifetime standings or admitting unclaimed identities into opt-in season totals
- [x] Added replay-safe season closure with an immutable Chronicle snapshot, permanent commemorative trophies, a first-season Founder's Lantern, and a dedicated physical seasonal shelf in private and public trophy cabinets
- [x] Added a reduced-motion-aware cinematic season Chronicle and a seeded First Light configuration that creates no memberships, progress, XP, or fabricated live activity
- [x] Backed up the live local database, applied migration `20260814230000_add_seasons_and_community_expeditions`, and reran the idempotent seed; service deployment remains a separate private release step
- [x] Replaced both seasonal trophy fallbacks with authored Legendary 3D heirlooms: a gilded ironwood First Light battle-standard and an internally lit Founder's Lantern, each with unique geometry, materials, front seal, reverse inscription, subtle motion, and localhost-only visual QA

## 2026-08-14 - Seasons hardening pass

- [x] Split the season reconciliation pass out of one long interactive transaction into bounded per-member, cooperative, and closure transactions with explicit timeouts; a whole-roster pass had been running several hundred sequential queries against Prisma's default five-second budget, where a `P2028` would have silently stopped all season reconciliation behind a warning line
- [x] Excluded completed seasons from per-event season progression, so a backfilled or legacy-imported event landing inside a closed window can no longer add season XP or move expedition progress behind an already-published Chronicle snapshot
- [x] Deferred cooperative goals to the periodic pass for legacy history replays, which had been rescanning the entire roster's season window once per imported row; live events still recompute expeditions and team quests immediately
- [x] Replaced the per-member team-quest XP fan-out and the closure trophy fan-out with ledger-checked `createMany`, removing one no-op upsert per member per cycle
- [x] Matched `isThreeMonthSeason` to the Postgres `INTERVAL '3 months'` CHECK constraint; naive JavaScript month addition overflowed month-end starts (30 Nov became 2 Mar rather than 28 Feb), so no month-end season could satisfy both the helper and the database
- [x] Rendered the `notice` outcome that `joinSeason` redirects with; enrollment success and rejection had both been silently discarded by the seasons page
- [x] Stopped loading every membership row on the seasons page to answer "am I enrolled" and "how many members", using a counted relation and one keyed lookup
- [x] Added season reconciler tests covering replay safety across playtime, personal and team XP, closed-season exclusion, legacy-replay deferral, and month-end window arithmetic
- [x] Full workspace verification after the pass: typecheck, lint, 209 tests, and production build all green

## 2026-08-14 - Earned seasonal shelf

- [x] Added `Season.trophyXpRequirement` (migration `20260815010000`, default and First Light value 1,500) so commemorative trophies and the Founder's Lantern are earned inside the window rather than granted for enrolling; zero disables the bar for a season that wants none. The bar sits just above finishing all five First Light quests (1,660 XP together) plus roughly sixty hours of verified play, out of reach for a last-day enrollment and reachable for anyone who ran the season
- [x] Closure now awards only members whose own season ledger cleared the bar, and the Chronicle snapshot (version 2) records the requirement and how many members met it
- [x] Made eligibility trackable while the season runs: a live progress rail and exact remaining-XP figure on `/seasons` for enrolled members, a shelf-qualified marker per row plus a qualified-of-enrolled count on `/leaderboards/season`, and the cleared-the-bar line in the closing Chronicle
- [x] Corrected the reward copy, which had promised the shelf to every enrolled member and implied a completion bar that did not exist
- [x] Full workspace verification after the pass: typecheck, lint, 210 tests, and production build all green

## 2026-08-14 - Admin season launch

- [x] Added `/admin/seasons` behind the existing `requireRole("ADMIN")` wing, with a Clubhouse nav entry: launch a scheduled season immediately, reschedule its opening date, and edit its name, theme, description, community XP goal, trophy XP bar, and availability
- [x] Launching opens the window at the launch instant rather than at midnight, so no activity recorded before an administrator pressed the button is credited; the close date is always computed with `seasonEndFor`, which mirrors the Postgres `INTERVAL '3 months'` CHECK
- [x] Refused launches that could not work: a season with no trophies would award nothing at closure, a season already holding seasonal XP would strand that ledger, and a running or completed season is never reopened. A season with no quests or expeditions launches but says it will score raw playtime only
- [x] Enforced one season at a time through an interval-overlap check inside the launch transaction, so a stale page or double submit cannot open two overlapping seasons
- [x] Froze completed seasons against edits; their Chronicle already publishes the goals and trophy bar they were judged against
- [x] Shared the launch decision between the button and the server guard through `lib/season-launch.ts` so the two can never disagree, and audited every launch, reschedule, and settings change to `AuditLog`
- [x] Verified all three window shapes an administrator can produce (launch-now, a month-end reschedule, a 31st) against the live CHECK constraint inside rolled-back transactions; all accepted, First Light row unchanged
- [x] Full workspace verification after the pass: typecheck, lint, 217 tests, and production build all green

## 2026-08-14 - Season content builder

- [x] Added `/admin/seasons/[slug]`, a full authoring surface for a season's quests, personal/team scope, per-game expeditions, and its two trophies; season content no longer requires editing the database seed
- [x] Added season creation from `/admin/seasons`. A drafted season is created disabled and unstarted with the next free ordinal and a slug derived from its name, so its goals and trophies are built before it can ever reach the board
- [x] Staged editability by season state: an unstarted season is fully editable, a running season keeps wording, difficulty, ordering, and availability adjustable while scope, rule, game, and reward are frozen so enrolled members are not re-judged mid-season, and a completed season is immutable. The rule is re-read inside every write transaction, so a stale form cannot slip past it
- [x] Refused goals the reconciler could never satisfy: a distinct-game goal restricted to one game cannot target above 1, and an unrestricted one cannot target above the Habitat's six games. Boss-kill and sub-ten-minute playtime goals warn without blocking
- [x] Protected the ledger and the cabinet: a quest that has awarded season XP cannot be removed, and a trophy any member already holds is never withdrawn
- [x] Held the founding reward to season 1, where the worker actually awards it, rather than offering a piece that would never be handed out
- [x] Reported trophy artwork honestly — a code with authored 3D work says so, and an invented code states it will render with the generic trophy form until artwork is added
- [x] Verified the builder against the live schema inside a rolled-back transaction: a full season with two quests, an expedition, and both trophies wrote cleanly, and the database independently refused a duplicate trophy kind, a duplicate quest slug, and a zero threshold. Nothing persisted
- [x] Full workspace verification after the pass: typecheck, lint, 226 tests, and production build all green

## 2026-08-14 - Season builder hardening and command-deck pass

- [x] Made edit authorization clock-aware. An enabled season freezes structural fields at its scheduled opening instant even if the worker has not persisted `ACTIVE` yet; an expired window is likewise immutable while closure is pending. Disabled drafts remain inert and editable
- [x] Made scheduling publish the completed season package as an enabled `UPCOMING` season, rejected past schedule dates to prevent back-crediting, and prevented a running season from being disabled before the worker closes and chronicles it
- [x] Fixed zero-bar trophy closure: when a season intentionally sets its trophy XP requirement to zero, every enrolled member now qualifies even when they have no seasonal XP row
- [x] Kept expired active/upcoming rows off the public season board and seasonal leaderboard while the worker finishes their closure pass
- [x] Reworked the builder into a premium command deck with a readiness instrument, sticky section navigation, stronger open/edit states, responsive layouts, live 3D trophy previews, and clearer empty-piece presentation
- [x] Added rule-aware goal controls: administrators enter playtime in hours while the existing worker/database contract remains seconds, evidence and stored-unit copy update live, unreachable combinations warn immediately, and all writes still repeat validation on the server
- [x] Added pending submission states across season creation, launch, scheduling, settings, quest, expedition, and trophy writes to prevent accidental double submissions
- [x] Deployed the hardening pass to `habitat.martinobear.com` after a successful database/config/repository/avatar backup; all 43 migrations were current, the idempotent seed completed, and the HabitatWeb and HabitatWorker services restarted cleanly while the tunnel, private agent, and game services remained undisturbed
- [x] Verified the live authenticated builder in Chrome at desktop and 390 x 844 mobile widths: readiness is 4/4, all five quests and six per-game expeditions render, both authored 3D trophies render without fallback, the rule-aware hours/seconds conversion round-trips correctly, there is no horizontal page overflow, and the public season and seasonal leaderboard routes report no browser warnings or errors
- [x] Full workspace verification after the hardening pass: strict typecheck, lint, all 230 tests, production build, and `git diff --check` are green. The post-deploy connection audit passes every configured provider and private boundary except the already-documented Dragonwilds source, whose retained logs still contain no parseable player-session evidence

## 2026-08-15 - Cinematic Halls clash and Shame records

- [x] Changed the Progress menu's Halls destination from the Legends page to a dedicated `/halls` gateway, where the Hall of Legends stands on the left and the Hall of Shame stands on the right as two clickable, cinematically opposed chambers
- [x] Added pointer-reactive lighting, layered parallax, drifting sparks, orbiting sigils, clash choreography, focus treatments, and reduced-motion fallbacks without introducing a public service or browser-side source of record truth
- [x] Created and integrated three original high-quality cinematic assets: the gilded Legends chamber, the affectionate disaster-gallery Shame chamber, and a no-gore `Most Verified Deaths` diorama. Next Image serves responsive optimized derivatives while the project retains the authored PNG masters
- [x] Rebuilt both record ledgers as interactive showcases with cinematic heroes, verified/held counters, image-led record cards, animated holder engravings, correct event-or-activity Chronicle receipts, responsive filters, and an honest visual empty state that never invents a holder
- [x] Added three real Shame definitions: always-available `Most Verified Deaths` sums the trusted `DEATHS_RECORDED` activity projected from hosted `PLAYER_DIED` evidence and Club Game match rows, while provider-derived `Most Heroic Defeats` and `Most Consolation Crowns` continue to honor the existing cross-game consumer rollout flag
- [x] Added a silent, replay-safe activity-record catalogue reconciliation so newly seeded provider definitions can evaluate retained trusted history without re-projecting evidence or announcing an old result as breaking news; regression coverage proves the highest verified defeat count is engraved exactly once
- [x] Verified the complete experience in the local browser at desktop and 390 x 844 mobile widths: both gateway directions are obvious and clickable, generated images load through Next optimization, record cards retain their hierarchy, Progress points to `/halls`, no horizontal overflow appears, and no browser warnings or errors were emitted
- [x] Full workspace verification after the Halls pass: strict typecheck, lint, all 231 tests, production build, and `git diff --check` are green
- [x] Review pass repairs before deployment: `Most Verified Deaths` was rewritten from a `PLAYER_EVENT_COUNT` rule to an `ACTIVITY_VALUE_SUM` over `DEATHS_RECORDED`, because no code path evaluates records for a `PLAYER_DIED` event and the record could never have been awarded; the reconciler now replays candidates in chronological order so a history row can never carry a timestamp older than the row it supersedes; its unbounded `distinct` scan over every retained activity was replaced with one index-covered lookup per active member, matching the achievement catalogue reconciliation, so the cost tracks the roster rather than retained history; the halls only offer an activity receipt link when that evidence is actually viewable; the reduced-motion block now stops every looping decoration; the unfiltered empty state no longer tells the reader to clear filters they never set; and the superseded record-card rules were removed from the global stylesheet
- [ ] Production deployment, idempotent seed, web/worker restart, and authenticated live Chrome verification remain pending; no seeded Shame definition or holder is claimed live yet

## 2026-08-17 - Story Codex for Martino

- [x] Built a collaborative story-writing surface at `/codex` so contributors can add arcs, scenes, and branching choices to the Martino Unreal project from their own Habitat accounts, with a React Flow board per arc, a searchable lore bible, per-node discussion, and an administrator review queue
- [x] Made the status ladder the safety property: contributions land at `PROPOSED`, only `CANON` is ever exported, and there is no path through the schema, the actions, or the export by which unreviewed writing reaches a game build. Approving a node also canonises its arc so an approved scene cannot be silently dropped, and `canoniseArc` promotes an arc with its proposed nodes and branches together
- [x] Protected concurrent writing with optimistic `version` checks rather than locks — a stale save is refused instead of overwriting whoever saved first — and kept card positions out of `version` so dragging never invalidates an open edit. Courtesy locks are advisory, expire after two minutes, and are CHECK-constrained to always carry an expiry
- [x] Added live sync over SSE that carries no story content, only a change cursor, so refreshes go through the ordinary authenticated render path; the per-tick probe is a single indexed `StoryRevision` lookup, with proxy-buffering disabled, keep-alives, and bounded connection lifetime
- [x] Added `analyzeStoryGraph` in `packages/shared` as a pure function shared by the board and the export, reporting missing entry points, isolated cards, unreachable nodes, dead ends, unlabelled splits, and duplicate choice text as warnings — never as errors, because a story in progress is supposed to have loose ends
- [x] Added the token-authenticated read-only export at `/api/story/export`, keyed by stable node keys rather than UUIDs so retitling a scene cannot orphan a generated asset, dropping edges and references whose targets are not canon, and answering `304` from an indexed row read when the caller's cursor is current. Tokens are stored only as SHA-256 digests and issued from `/admin/story`
- [x] Hand-wrote migration `20260817120000_add_story_codex` (nine new tables, no change to any existing table) with CHECKs for kebab-case keys, self-transitions, canvas bounds, lock completeness, single-target comments, and digest-shaped token hashes; applied with `migrate deploy`
- [x] Documented the whole design, including why CRDT co-authoring was not built, in `Docs/STORY_CODEX.md`
- [x] Full workspace verification: strict typecheck across all six projects, lint, 217 tests (18 new), and production build are green
- [ ] The Native Tales importer is not built — the plugin's asset format has not been inspected, and the export shape was deliberately kept neutral until it is. Deployment, seed, and live authenticated verification also remain pending

## 2026-08-17 - The Warden, an audited codex assistant

- [x] Added a Gemini-backed writing assistant to the Story Codex boards: member-only, scoped to one arc plus the bible, and reachable from an ember panel that knows which card the writer currently has open
- [x] Wrote the persona and its rules as one pure string in `packages/shared`, so the exact text sent to Google is asserted in tests rather than drifting. Two clauses are load-bearing: he is grounded strictly in the supplied extract and says "That is not written yet" instead of inventing, and he is told the extract is member-authored story data and never an instruction to him
- [x] Fenced the extract with explicit begin/end markers, carried every item's status so proposed material is never read as settled, excluded archived and rejected material, and handed over the board's known loose ends so he explains them rather than rediscovering them
- [x] Kept him strictly advisory: he has no tools, cannot write to the codex, cannot approve anything, and is never shown servers, members, or anything else outside the story. A suggestion becomes story only when a human types it into a card
- [x] Made the audit total. Every exchange writes a `StoryAssistantMessage` including the ones that never reach Google — rate limited, budget exhausted, unconfigured — because a log that only kept successful answers would hide the pattern worth looking for. A DB CHECK ties answer to outcome in both directions. The transcript is readable at `/admin/story` with outcome, model, context summary, token counts, and latency
- [x] Stored `contextSummary` plus `revisionCursor` rather than a copy of the extract on every row: rendering is a pure function, so any exchange reconstructs exactly without duplicating the story per question
- [x] Added a per-member hourly throttle checked before the shared daily budget, so one writer cannot drain the clubhouse's allowance; the daily counter reuses the existing `ProviderRequestUsage` table
- [x] Verified the key and model live. `gemini-3.7-flash` is real and answers well — asked whether a creature bound to water could climb dry steps, it caught the contradiction, quoted the CANON entry, and proposed drowning the lower staircase as the smallest fix
- [x] Fixed two real defects the live probe exposed: Flash 3.7 reasons from the same output allowance as the reply (640 thinking tokens against 122 of answer), so a 900-token budget would have returned successful responses containing nothing — the allowance is now 4000 and an exhausted one names the knob to turn; and the model returns 503 "high demand" readily, so the client now retries once and reports demand specifically instead of calling a busy model an outage
- [x] Added `thinkingTokens` to the audit, since reasoning is billed and invisible and omitting it understates an exchange's real cost by roughly an order of magnitude
- [x] Full workspace verification: strict typecheck across six projects, lint, 290 tests (27 new), production build, and `git diff --check` are green. All five new database constraints independently proven to reject bad data inside a rolled-back transaction against the live database
- [ ] Not deployed: migrations are applied to the live database and the build is green, but HabitatWeb has not been restarted. The currently running authenticated Codex was exercised during the audit below; the newest visual build still awaits the normal deployment/restart path

## 2026-08-17 - Story Codex audit and experience pass

- [x] Closed the canon review bypass: contributors can no longer revise canon nodes, branches, bible entries, or canon-node references in place. The policy is shared between UI and server actions, has regression coverage, and keeps notes available as the route for requested changes
- [x] Completed the branch workflow that the first board shipped without: branches can now be selected, labelled with the player choice, given an optional condition, reviewed, rejected, and safely removed from the inspector
- [x] Exposed bible linking in the node workbench, including unlink controls and honest empty states, so the existing reference/export model is usable without direct database work
- [x] Repaired collaboration behavior: the selected card now follows presence heartbeats, presence displays stable initials and the card being edited, node and bible-entry locks renew during long edits and can retry after contention, and resolved notes now emit an audited revision so other writers refresh
- [x] Added pending states and destructive confirmations, contributor-friendly read-only canon presentation, clearer note counts, Escape-to-close behavior, a board legend, minimap, first-card guidance, richer card/edge focus states, and a mobile layout that removes nonessential canvas chrome
- [x] Gave the Codex landing room a purpose-made, warm-lit archive hall with layered brass-and-ink treatment, stronger editorial hierarchy, and responsive mobile composition; the image is decorative atmosphere only and never presented as server or story data
- [x] Finished the browser-driven layout corrections: empty and small boards no longer waste space on a minimap, left-to-right branches route cleanly through matching handles, newly added/removed cards reframe without stealing the viewport during ordinary edits, dense mobile boards can zoom out far enough to remain visible, the board is an immersive footer-free desktop workspace, and Bible filters retain usable mobile widths
- [x] Corrected working counts so archived and rejected cards/references do not inflate arc and bible summaries
- [x] Authenticated live browser QA covered the landing, Bible, review queue, admin audit, empty board, three-card branched board, branch editor, card editing/version refresh, Bible reference linking, Warden panel, confirmations, and 390 x 844 mobile layouts with no horizontal overflow or browser-console errors. Exact-slug QA arc/Bible data and all 10 associated revisions were deleted and verified absent afterward
- [x] Full workspace verification after the audit: strict typecheck across six projects, lint, all 291 tests, production build, and `git diff --check` are green
- [ ] No deployment or HabitatWeb service restart was performed; the new archive hero and final canvas refinements will appear after the normal release process

## 2026-08-18 - Writer-first Story Codex workspaces

- [x] Rebuilt `/codex` around a story compass that states the premise immediately, surfaces the three current theme entries as the game's shared truths, and routes writers into the world or story area they intend to shape before showing audit and administration material
- [x] Added dedicated, searchable visual libraries for characters, factions, regions, creatures, items, events, themes, and rules, with guided create-and-open flows instead of requiring writers to find a kind in a generic form
- [x] Added full entity dossiers that put the writer briefing, game model, canon status, typed facts, inbound and outbound world relationships, written quest appearances, planned arc involvement, and open writing questions in one readable place
- [x] Added an interactive faction sheet alongside the existing character and region sheets, moved character casting to the top of its editor, and exposed recoverable archive actions to ordinary Codex writers while preserving the revision ledger
- [x] Added a compact secondary Codex navigation designed around large mobile tap targets, horizontally safe overflow, responsive one-column libraries and dossiers, and two original cinematic faction/region library images that are atmosphere only and never represented as live game data
- [x] Kept the game handoff at `contractVersion: 1`: the new interfaces write the already-exported nullable `bible[].meta` objects documented in `Docs/Codex_Module_Schema.md`; there is no payload shape change, migration, public game API, or importer update required
- [x] Full workspace strict typecheck, web lint, all 292 tests, production build, `git diff --check`, live service restart, and anonymous route probes are green; `/members` returns 200 and protected Codex routes return the expected authentication redirect
- [x] Authenticated live Chrome QA covered the premise and three-theme compass, character/faction/region libraries, Tino's dossier with 17 quest and 3 world connections, character and faction editors, 93-model picker, Warden open/close flow, and `/members` at desktop and 390 x 844 mobile widths with no horizontal overflow or browser-console warnings/errors
- [x] Browser QA corrections were deployed in the same pass: editor summaries now separate their label and helper copy, the mobile premise stays inside its frame, key mobile actions meet a 44 px tap target, the Warden collapses to a compact mobile action, and unavailable remote member avatars fall back to the local campfire instead of rendering broken media
- [x] Added three original AAA-style cinematic theme paintings to the story compass—ancient infrastructure beneath the war, the intimate cost of infused power, and the industrial harvest economy—bound to their canonical slugs with responsive single-column mobile cards, clean crops, no horizontal overflow, and no browser-console warnings/errors
- [x] Read the live canon for all 34 factions and created an original visual identity set for every one: 34 cinematic key-art scenes plus 34 transparent symbol marks, with faction-specific palettes and contemporary military, corporate, civic, criminal, resistance, or supernatural art direction instead of medieval heraldry
- [x] Integrated faction branding into the searchable faction library and individual dossiers with per-faction accent treatments, responsive key-art crops, readable mobile logos, and no change to story data, database schema, export contract, or the game-side importer
- [x] Made faction identity relationship-driven on character surfaces: character library cards and dossiers automatically resolve every selected faction's existing logo and palette, and the character-sheet editor previews the mark immediately as a faction is selected; new characters require no duplicated logo data and the export contract remains unchanged
- [x] Created 14 original AAA-style, contemporary dark-fantasy environment paintings for every canonical region and POI, then integrated them into the organized region atlas, searchable result cards, and location dossiers with per-place accents and responsive crops; this is presentation-only and does not change canon data or the game handoff contract
- [x] Created a cohesive AAA-style cinematic key-art set for the four current characters—Tino, Commander Rook, Steve, and the half-elf/human War Correspondent—and integrated it into character library cards and dossiers while preserving model previews as the fallback for future characters
- [x] Added the Systems shelf to the Story Codex: game mechanics as first-class SYSTEM bible entries (editable, removable, addable like all lore), each with a sheet carrying category, build status, dependencies, and the release gate that ties it to the quest arc that unlocks it; seeded nineteen canon-grounded systems, a release-plan view on the library, unlock strips on arc pages, and conventional key-art slots that print their own drop path
- [x] Wrote the deep-history timeline into the codex: seven canon EVENT epochs from The First Hunt (~10,000 years ago) to The Drain (present), the timeline law "The Long Hunt" (ten millennia of hunting, one century of consuming faster than the world replaces — and canon never answers whether humanity caused the collapse), a Drain stance appended to all 34 factions, the long hunt written into the four key regions, and the harvest-economy theme rooted in the full timeline
- [x] Built the history timeline (/codex/timeline): every dated EVENT on one glowing golden spine, oldest at the top down to a "now" node, cards branching alternately with matching golden borders, key-art slots that promote events to major moments, where/involved chips wiring each moment to its regions and factions, and an "outside the count" section for history whose unknown age is itself canon; events gain a sortable timelineYearsAgo anchor on their sheet, and a full cross-reference audit verified all 124 meta references and 305 body links resolve
- [x] Added Persistent Damage to the systems shelf as a day-one family: the world keeps its wounds across hours, sessions, and every player, with Structural Integrity (load paths, demolition, cascading collapse) and Lasting Wounds (scars, unhealed injury, missing limbs, prosthetics) as its two halves; wired to repair/upgrade through Building, off-screen persistence through The Living World, shared state through Co-op, and grounded in the island ledger, the Kestrel siege, and the Strike's wound
- [x] Replaced the Timeline/History art slots with a complete original cinematic set for every placed epoch, plus the undated Riftwood Breach, and added a low-contrast black-stone/brass history mural behind the golden spine; added matching original key art to the first six founding Systems cards (Character Progression, Corruption, Combat, Survival, Gathering & Harvest, and Trade & Economy) without changing canon data or the game export contract
- [x] Completed the Systems art library with 25 additional original AAA-style cinematic masters, giving all 31 seeded systems dedicated key art; each master now fills both its library card and dossier hero, removing all 50 remaining image placeholders while preserving the shared art resolver, canon data, and game export contract
- [x] Audited the Timeline and Systems sections end to end: extracted the per-kind sheet schemas into a pure module so stored rows can be validated against the very schemas the sheets enforce, then found and repaired 21 entries whose meta predated fields added later (SYSTEM parent/regionNotes, CHARACTER model, EVENT timelineYearsAgo); fixed a stale revalidation list that never refreshed systems, events, themes, rules, or the timeline after a write; and replaced static art serving with a request-time /codex-art route so key art dropped in after a build actually appears — plus scripts/audit-story-meta.ts and scripts/normalize-story-meta.ts to keep it verifiable
- [x] Full Codex audit pass: found and fixed the silent destruction of in-progress edits (live sync now defers its refresh while a form has unsaved text, so a colleague's save no longer remounts the fields and deletes what you were typing), restored missing titles on unbranded region children (the dossier's fixed art column swallowed the copy when a place had no key art — every place a writer adds is unbranded, so this hit new work only), made region dossiers list every place beneath them at any depth rather than two rungs, and corrected the new-place default so a settlement's next rung is a district rather than a shop; added scripts/audit-codex-surfaces.ts, which walks all 150 codex surfaces and checks every link, every form's action id, and every affordance a page must offer
- [x] Added the Veil Incursion & Cross-World Extraction System to the systems shelf as a four-system family (The Veil parent; Veil Anchors, Veil Expeditions, Veil Incursions as children) plus the Dimensional Echo as a canon ITEM: reality as Shards, tiered Anchors as atlas POIs with region notes on Igit Island and the Peninsula, PvE crossings through Dead and Corrupted Shards, opt-in 20-minute PvP incursions with tracking pulses / physical extraction / emergency recall / anti-griefing law, and lore wired to rhyme with the Riftbound Legion, the hidden realms, and Meridian's "taken" data without ever answering them; the codex landing page gained a Core System Spotlight block headlining it, with key-art slots throughout
- [x] Added a cohesive four-image AAA-style Veil key-art suite with bright legendary portal scale and unmistakable extraction-shooter staging: a multi-Shard flagship Crossing for the Codex spotlight, a jungle Tier V Anchor megastructure, an artifact-looting PvE expedition, and a three-person combat extraction for Incursions; all four entries resolve dedicated art across spotlight, library, and dossier surfaces without changing canon data or the export contract
- [x] Verified the Veil systems feature and closed its connection gaps: Veil Anchors are now recordable on the places that ARE them (veilAnchorTier I–V on the REGION sheet, validated server-side, filled on all 22 stored places), the marker lives in the shared place label so an Anchor shows on the atlas, its own dossier, and every ancestor's dossier at any depth, and Expeditions/Incursions now declare the dependency on Anchors they cannot ship without
- [x] Added the Soul Forge death system as a three-system family (The Soul Forge parent; Soul Binding and Reclamation as children) and integrated it where it changes existing canon: REGION entries gained a soulForge state so Forges show on the atlas and their dossiers (Kestrel destroyed, Port Arcadia active), Commander Rook owns the binding scene and its "where are you bound?" reactions, the Tino rule gained the law that a Forge can only speak about Echoes bound to it — so the scene raises the question of his survival without ever answering it — and Essence and the harvest-economy theme now state resurrection as the motive that makes the atrocity understandable
- [x] Added three original AAA-style Soul Forge death-system paintings with a deliberately primal Mature 17+ treatment: the resurrection machine is fed beside a butchered magical creature, Commander Rook forces the bloody Kestrel binding ritual through, and Reclamation lands a newly rebuilt adult on the platform amid ruptured Essence, horrified witnesses, and brutal retrofitted machinery; all three entries now resolve dedicated art without changing canon data or the export contract
- [x] Added true death: a RULE stating that a death with no living Forge holding your Echo is permanent and ends the run, the jeopardy window it creates (Kestrel's Forge dies with the island, so from landfall at Port Arcadia until the party binds again every death is final), and the self-starting quest "The Danger of True Death" — a four-card spine picked up in Port Arcadia — plus the law written through The Soul Forge, Soul Binding, Reclamation, and Arcadia's own dossier
- [x] Verified the death system against the rest of the game and fixed four contradictions it had introduced: the binding scene claimed Rook's first words at Kestrel, which the authored prologue gives to "Where's Your Partner?" (re-staged to the TUTORIAL COMPLETE handoff, before the operations table); co-op was gated "Day one" while the prologue board fires CO-OP AVAILABLE at Kestrel (now gated on the prologue arc); "Echo" meant two opposite things across the Soul Forge and the Veil, which would have made every Incursion death a true death; and neither system said what happens when you die in another Shard (it is a normal reclamation — the Soul Echo is untouched, only carried gear is lost, and only crossing unbound is fatal)
- [x] Integrated three lore updates and reconciled them with existing law: Essence is soul-stuff (which is why extraction kills, why infusion corrupts — souls do not share — and why reclamation is paid for in something that was alive), stormglass answers its own open question as nature-drawn essence that costs nobody a soul but is weaker, less pure and needed in far greater volume, and Soul Forges became the strategic object that decides who holds ground, written through outpost/city management, kingdom management, battle management and the power balance; the three-origin ban was explicitly preserved by making nature-drawn essence a second feedstock for infusion rather than a fourth origin
- [x] Codex prose now renders: **bold**, *italic*, and [[slug]] cross-references become real links to entries and arcs, composed from parsed tokens into React elements with no HTML injection anywhere; unwritten targets render as visible "fill later" todos rather than dead links, dense card grids and list rows show clean text instead of raw markers, and editors still show the source they edit
- [x] The narrative development room: Story Threads (/codex/threads — proposals argued from brainstorming toward approved/rejected with attribution, statuses, categories, stages, filters, and the existing comment/revision law) and Companion Missions (first-class chain records grouped under their companion), both new StoryEntry kinds withheld from the game export; characters wear a COMPANION badge from their sheet; the flag ledger moved intact to /codex/promises; seeded with Travis Martino's The Empty Cribs — Amanda (Am~hors~ormen~da), Tino marked companion-capable without touching his canon, and Amanda's nine-mission arc — every mystery the spec locks kept locked
- [x] The seven phases of corruption, enumerated at last: Clean, Tremor, Veining, Appetite, Sensitivity, Drift, Turning, Completion — each with the tell a scene shows, what is happening underneath, and how it gets hidden. Code-owned in packages/shared so the sheet picker, the character dossier and the rule page cannot drift; projected into the rule's prose by a rerunnable script so the game export carries them too; the character sheet's bare 0-7 number picker replaced with named phases that explain themselves inline
- [x] Corrected the Reclamation master to show a gearless adult woman painfully rebuilt under the Forge's reconstruction field, then replaced the duplicated Characters/Game Systems Codex tile art with a canonical four-character ensemble and a systems-driven frontier operations scene; no canon or export changes
- [x] Resolved Amanda's mythical identity as a Lizzarnix — the lost half-lizard, half-phoenix people who gave magic through willing death and rebirth — and integrated the ending-tier truth through The Empty Cribs, mission eight, Amanda's dossier, the creature library, the three origins, taxonomy, Essence, the harvest economy, Magic, and Soul Forge cosmology; the finale now ends in fire, ash, a scaled rebirth egg, and Tino carrying it, while the kidnappers, hatching, and memory remain protected mysteries; added dedicated AAA Amanda and Lizzarnix key art and migrated the live Codex idempotently
- [x] The bestiary became the races library: creatures gained a `parent` race (the same tree law regions and systems run on), seven races named from the taxonomy rule — Mythical, Beasts, Humans, Supernaturals, plus the Monstrosities/Abominations/Risen umbrellas that were already doing the job — every existing creature filed under one, the Lizzarnix under Mythical, and `/codex/library/creatures` permanently redirecting to `/codex/library/races` so no hand-written link ever dies
- [x] Refined the Lizzarnix visual identity: Amanda keeps her existing face, armor and sunset composition while gaining near-luminous non-emissive golden eyes and one anatomically integrated scaled tail; the race master now shows an equal adult male/female pair as tall upright two-legged humanoids with hands, tails and phoenix wings, and the creature prose/live Codex explicitly carry that anatomy without disturbing the new Mythical race assignment
- [x] Rebuilt the Races navigation around strict parent → child disclosure: the landing page now shows parent races only, parent dossiers reveal their children, Mythical explicitly contains only the exceptionally rare Lizzarnix, Beasts contains Hippogriff, and Humanoid contains Human; migrated the combined Hypogriff Rider record in place so story history survives, added audited/idempotent live data migration, and supplied nine mature AAA category/member key-art assets
- [x] Reorganized the story surfaces into a Stories & Quests room: a hub at `/codex/stories` (canon and threads as two doors, the writers’ room law, and a guided “what kind of story is this?” create form) and a canon workspace at `/codex/stories/canon` with an articy-style navigator — campaign spine, a gold divider, the region tree with each place’s side quests and contracts, companion chains showing planned steps dimmed, incursions, world events, and the timeline. Arcs gained a `category` (mainline / side quest / contract / companion quest / incursion / world event) and a companion, kept `isMainline` in lockstep under a database CHECK, and the export carries both additively. Settled thread material now travels to canon as packets: pushed from a thread’s dossier, counted in sidebar bubbles, woven in from the inbox, and traced back onto the thread — the arc padlock stays the only thing that settles story. Cross-quest connections are derived as ripples on every board and as one web on the canon page, flow cards gained node-kind colors with the freeze still overriding them, and a new `sweep-story-legacy.ts` makes every remaining backlog visible in one command
- [x] Polished the Stories & Quests writer experience after desktop and mobile visual review: the hub now leads with a direct new-story shortcut and a balanced guided form, binding room law folds into a compact reference, empty canon categories gather into one actionable Open Roads panel, the Warden’s prompt suggestions wait inside his panel instead of covering story cards, board briefs collapse so the writing canvas gains meaningful vertical space, and the mobile canon navigator now starts folded instead of pushing the board below its entire tree
- [x] Closed the last one-way edges in the world graph and put the bestiary on the map: a character’s people (`species`), a system’s dependencies and release gate, and every creature’s habitat now read from both ends, with CREATURE and SYSTEM finally getting the per-kind reference checks every other kind already had — a test asserts no entry-naming kind can land unwatched again. Nine of twelve creatures were filed onto Igit Island, The Ocean, or The Peninsula using only ground their own dossier or a region’s names, each placement carrying the sentence it was read from; the Lizzarnix, Mythical, and Humanoid stay deliberately unplaced with their reasons recorded
- [x] Audited the whole app in both directions and kept the tooling: `audit-app-surfaces.ts` walks all 244 pages as an administrator, resolves every internal link, and traces every one of 812 form fields to the action that receives it (following `Object.fromEntries` schemas and helper delegation); `audit-write-paths.ts` drives every save/edit/delete through the no-JavaScript form path and reads the database back, including the version guards, the malformed-sheet refusal, canon archiving instead of erasure, and the freeze; `audit-story-connections.ts` plants a probe reference in all 34 slug-typed sheet fields plus both arc links and asks the target whether it knows. Fixed a companion quest not counting as a tie to the world (its character read as an orphan), a latent dead link where a completed season linked to a chronicle that had not been written yet, and link nonces that only self-pruned for the member who retried; removed 7 expired nonces after proving nothing can reach them
- [x] Added the clickable campaign-level flow above the individual quest boards, derived from the same ENDING-to-arc continuations the game export reads: The Island Is Already Lost now branches structurally into The Last Days of Kestrel or The Evacuation, both full roads converge on a new Binding in Arcadia mainline board, its storm-beach and military-docks openings play separately before merging at Find the Soul Forge, and binding closes the true-death gap and explicitly begins Act I without erasing either route's survivors, cargo, reputation, or arrival state
- [x] Finished a Story Codex legibility pass: every document and nested writing pane now uses a dark tarnished-gold scrollbar, the canon navigator is modestly wider and wraps full quest/place titles instead of clipping them, and the Region atlas is a responsive region-first hierarchy with full-width region rows, adaptive place cards, and clearly nested destinations instead of three stretched, cramped columns
- [x] Consolidated the faction shelf into a map somebody can hold in their head: thirty-five powers filed as ten majors, twenty-one wings, and four that answer to nobody, on the same `meta.parent` tree law regions, systems, and races already run on — with `power` landing as a hand-set placeholder until strength is counted from territory, cities, wealth, population, and armies. The law rides in canon, not just in the docs: **major does not mean important** — a banner is a geopolitical umbrella, a wing lives inside its sphere and may be far more famous and dangerous than the power above it, and the tree is a political ecosystem rather than a chain of command. One power was invented to make the shape honest — **The Free Peoples Compact**, the marsh clans, desert caravans, mountain holdfasts, island league, and the road camps that signed, agreeing on nothing except that their land is not for sale — and twenty-seven dossiers gained an additive paragraph, each in its own voice, saying what the filing means from where it stands: the Wardens chartered by the Directorate but never employed by it, the Foundry Union organizing industries it cannot strike without stopping Aegis lines, Meridian claiming academic independence until the invoices come due, the Black Tithe insisting that stealing from Stormglass constitutes independence, and the Crimson Choir independent in the one way that matters — four powers each confidently misfile it. `the-faction-map` was redrawn around the law and the tree. Tino settled the canon question the filing forced: the Riftbound Legion is the Ashen Court’s instrument, recorded in the Legion’s own prose. Added a FACTION_QUEST arc category mirroring companion quests end to end — `factionEntryId` on StoryArc, a factions section in the canon navigator where a wing’s quest rolls up to its banner named by the wing, a factions canon-packet destination, dossier wings panel and “quests under this banner” block, and an additive `faction` field on the export
- [x] Finished the faction data behind that map: all thirteen prose-only major/independent powers now have schema-valid starter sheets derived only from their existing dossiers, with unknown leaders, seats, strength, and game tags left explicitly undecided; the idempotent seed never overwrites a writer-authored sheet
- [x] Rebuilt the Factions landing page as a premium political command map: ten cinematic major banners each contain their linked wings, four genuinely independent powers have a separate horizon, counts are accurate, parent creation offers only real major banners, and search still falls back to the complete flat result set on desktop and mobile
- [x] Replaced The Free Peoples Compact's moss placeholders with original AAA-style key art showing its five equal peoples at one field table and a transparent forged five-part emblem; the authored 1280×720 and 512×512 delivery contracts remain intact
- [x] Corrected doubled articles globally at render time without rewriting writer prose: an authored `a`, `an`, or `the` before a Codex link elides only that target's leading “The,” including links nested inside emphasis; the live audit currently checks 69 article-before-link instances and renders zero doubles
- [x] Resolved the dangling captivity reference with a five-card PROPOSED mainline scaffold that records only the confirmed capture-alive floor and places a visible owner gate before the captor, motive, site, or outcome; Amanda is now a CANON character while The Empty Cribs and its companion-mission resolution remain explicitly brainstorming

## 2026-08-20 - Complete one-way Martino Codex synchronization

- [x] Added the strict Bundle v2 contract as a separate full-resource handoff instead of weakening the canon-only v1 game export: all statuses and entry kinds, complete arcs/nodes/edges/entries/links, writer comments, sanitized revision history, and all Codex artwork travel together while auth, tokens, transient presence/courtesy locks, and Warden audit prompts remain private
- [x] Added an atomic publisher with revision-cursor retry, content-addressed SHA-256 artwork blobs, immutable releases, logical `/images/...` release paths, exact byte/hash/MIME/dimension manifests, a single `current.json` activation pointer, five-second change detection, retry without damaging the last good release, and no automatic deletion
- [x] Preserved `/api/story/export` compatibility by deriving `compatibility/canon-v1.json` from the same stable snapshot; live parity verification matched the existing exporter exactly after its timestamp/cursor were normalized (6 canon arcs and 155 canon Bible entries)
- [x] Added a read-only game-server mirror that verifies source content, copies into unique staging, materializes normal image paths, verifies every copy, and changes its local pointer only after a complete release; source/mirror paths must be absolute, separate, and non-nested
- [x] Published and independently reverified the first complete shared-folder release: 7 arcs, 48 nodes, 46 edges, 165 entries, 97 links, 774 revisions, and 209 materialized Codex images (190.77 MB); the second identical publish correctly created no release
- [x] Added focused path-traversal, corruption, idempotent-mirror, and revision-sanitization tests plus WinSW publisher installation and rolling-log configuration; no listener, firewall rule, public route, database address, or real infrastructure path is tracked
- [x] Installed the automatic publisher on the Habitat host, confirmed it remains running with an unchanged-content no-op cycle, and reverified the complete active release through the SMB UNC boundary; local-path and UNC `current.json` hashes match exactly

## 2026-08-21 - Story Codex art fallback sweep

- [x] Diffed the live CANON CHARACTER, CREATURE, FACTION, REGION, and SYSTEM entries against their real resolvers and disk conventions: all 35 factions and all 38 systems already resolved art; the remaining apparent gaps were fourteen finished but unwired assets plus two dossiers too thin to illustrate without inventing canon
- [x] Wrote `Docs/CODEX_ART_STYLE.md` from the existing art library, fixing the shared palette, lighting, material language, framing, Essence/corruption treatment, Mature 17+ tone, and the protected-mystery boundary for future work
- [x] Registered the Arcadian Devil and True Demons on the races shelf, and registered twelve Arcadian regions/POIs after inspecting each image against its dossier; the region masters were normalized from their oversized PNG sources to the resolver's optimized 1600x900 JPEG contract
- [x] With owner approval to settle Abraham Islay Kane's visual identity, created and registered dedicated character key art grounded in the existing Arcadian canon: visibly human, early sixties, military-genteel, oxblood and charcoal rather than a literal devil, with extensive healed facial trauma concentrated on his left side and a blinded milky left eye; The Docks remains on an honest fallback because it still has only its title, no body, and no parent
- [x] Focused art tests pass (6/6), the full web suite passes (333/333), strict typecheck and lint pass, and authenticated development rendering returns 200 with Abraham's exact key-art source and no profile placeholder on both his character-library result and dossier; the active 210-asset Codex handoff release includes the 1672x941 JPEG and verifies all content hashes

## 2026-08-24 - Martino interactive atlas vertical slice

- [x] Locked the architecture, Codex ownership rules, hierarchy, art/tiling pipeline, authoring workflow, security boundaries, phased delivery gates, and definition of done in `Docs/MARTINO_INTERACTIVE_ATLAS_PLAN.md`; the plan now makes the atlas a first-class private Codex bundle resource with a canonical game payload, stable identities, verified mirroring, staged importer generation, last-good retention, and atomic activation on the other computer
- [x] Locked `martino-world-map-approval-v2.png` as the approved geographic baseline and copied it non-destructively into the private versioned map-art library as `martino-world-map-v1.png`; the concept and approval files remain preserved under `Docs/map-concepts`
- [x] Added strict `StoryMap` and `StoryMapPlacement` models, normalized top-left scene coordinates, point/polygon/multipolygon geometry validation, parent/child scene support, Codex entry ownership, optimistic versions, authenticated authorship, and `MAP`/`PLACEMENT` audit revisions through two applied migrations
- [x] Seeded the live Codex idempotently with ten owner-established macro dossiers and one world scene: narrower branching Riverlands; long Peninsula; High Cliffs, Grand Lake, and Floating City; Grand Rift, expanded Red Forest, and luminescent Death Canyon; Desert; Magic-Torn Wasteland; and the deliberately undefined southeast. Twenty-four initial placements cover those regions plus Port Arcadia, Igit Island, the ocean, and known Igit POIs; missing city names and faction claims remain unguessed
- [x] Added authenticated `/codex/map` and `/api/codex/maps/[slug]` surfaces with OpenLayers pixel projection, pan/wheel/pinch zoom, selectable biome polygons and POI markers, zoom-gated Igit detail, filters, search, Codex dossiers, derived quest pickup/step locations, faction/biome/system facts, mobile bottom-dossier behavior, and Codex revision-stream refreshes
- [x] Added the Atlas destination to Codex navigation and a lightweight, member-only Great Hall map card; the full OpenLayers renderer is route-scoped and the approved art is served through a fixed allow-listed USER-gated route that returns 404 anonymously
- [x] Upgraded the trusted machine bundle to v3 with map scenes, placements, normalized geometry, map art metadata, and the versioned map master in the existing content-addressed asset flow; snapshot verification reports one scene, 24 placements, 175 entries, a live revision cursor, and the correct 100000 x 66667 extent. An isolated full publish and integrity verification passed with 211 assets including the 3,330,020-byte map master; the configured publisher was not run because this checkout currently has no `HABITAT_CODEX_SYNC_ROOT`
- [x] Prisma migration/generation, strict shared/web/sync typechecks, web lint, all 333 web tests, all 3 sync tests, production build, repeatable live seed, bundle snapshot read, and anonymous access probes pass (`/codex/map` redirects to sign-in; protected map art returns 404)
- [x] Authenticated Chrome QA covered the world view, protected map art, desktop and 390 x 844 mobile layouts, search, biome and settlement selection, map pan/zoom, layer toggles, quest appearances, Codex dossier navigation, the Great Hall card, page overflow, and browser-console health. QA found and corrected two mobile issues: the layer rail now hides its scrollbar while remaining swipeable, and the detail dossier is a true viewport-fixed bottom sheet; search results now call repeated quest steps “quest markers” rather than overstating the number of quests
- [ ] Native 8K-class deep-zoom tiles, additional region/city/town scenes beyond Starting Island and Port Arcadia, an Unplaced authoring tray, polygon editing, political/route overlays, and explicit Unreal level calibration remain subsequent phases

## 2026-08-24 - Atlas calibration and regional drill-down

- [x] Generated and installed two label-free AAA regional masters from the current Codex: a full Starting Island tactical map with its established civilian, military, industrial, supernatural, faction, and coastal topology; and a seven-district Port Arcadia crescent-city map with the Exclusion Area land gate, enclosed harbor, reefs, jungle edge, military docks, and the outer black-sand Storm Beach/fishing settlement
- [x] Replaced the inaccurate one-image deep zoom with three linked atlas scenes. The macro world now carries only fourteen world-scale overlays and drills into dedicated Starting Island and Port Arcadia scenes, where thirty-six place overlays and ten quest-node overlays use image-pixel calibration converted into the shared normalized coordinate system
- [x] Added the audited `StoryMapNodePlacement` model and applied migration `20260824200000_add_story_atlas_quest_markers`, allowing exact Story Codex arc/node positions without creating false REGION records. The unresolved Port Arcadia Soul Forge remains an honest city-wide search area rather than a fabricated exact point
- [x] Corrected the Starting Island macro marker from an unrelated western ocean settlement onto the actual island immediately southwest of Port Arcadia; added parent breadcrumbs, search-driven focus, direct quest dossiers, child-map buttons, double-click drill-down, per-scene viewport memory, explicit regional zoom ceilings, and full-extent initial framing
- [x] Upgraded the trusted handoff contract to Bundle v4. Isolated publish and verification passed with 3 maps, 36 place placements, 10 quest-node placements, 213 assets, and all 3 protected map masters carried through the existing content-addressed, atomic release flow
- [x] Authenticated Chrome QA passed on desktop and 390 x 844 mobile: all three protected art routes render, the world/Starting Island/Port Arcadia hierarchy navigates, calibrated districts and sites track visible terrain, The Harbour Run and Storm Beach resolve to their intended quest nodes, the Soul Forge remains explicitly unresolved, close zoom retains readable regional detail, the mobile dossier behaves as a bottom sheet, page width does not overflow, and the browser console is clean
- [x] Corrected an OpenLayers extent constraint discovered during visual QA: `showFullExtent` plus a measured initial resolution now displays every scene from edge to edge before the player zooms, instead of cropping the north and south to satisfy the wider desktop viewport
- [x] Final regression is green: strict shared/database/web/sync typechecks, web lint, 335/335 web tests, 3/3 sync tests, all 58 database migrations applied, and a production Next.js build; focused atlas-art tests cover every allow-listed scene plus unknown-version and path-traversal rejection
- [x] Added the World Atlas as a first-class door in the Codex landing page's “Choose what you want to shape” grid, with dedicated original cinematic command-table art, direct access to the interactive map, and a balanced responsive six-card layout; authenticated production QA passed at desktop and 390 × 844 mobile, including exact link navigation, no horizontal overflow, and a clean page console. The image is promotional atmosphere only and is never presented as authoritative geography or live game data
