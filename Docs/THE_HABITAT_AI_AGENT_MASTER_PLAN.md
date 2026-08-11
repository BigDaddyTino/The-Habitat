# THE HABITAT

> **Implementation status — updated 2026-08-11:** This is the original product and build-direction document, retained for rationale and future planning. It is not a live task checklist. Phases 0–12 plus the documented pre-Phase-13 community, progression, history, reward, dossier, and cinematic Great Hall expansion are substantially implemented. For exact shipped scope, known limits, and remaining validation work, use [BUILD_STATUS.md](BUILD_STATUS.md) and the focused deployment/operations documents.
## “God’s Country”
### AI Agent Master Build Plan for VS Code

**Project domain:** `https://habitat.martinobear.com`  
**Project name:** **The Habitat**  
**Subtitle:** **God’s Country**  
**Primary host:** **MartServ101**  
**Game/Jellyfin host:** **MartServ102**  
**Plan date:** August 9, 2026

---

# 0. AGENT MISSION

Build a polished, secure, self-hosted web portal for the private dedicated-game-server community called **The Habitat**.

This is not supposed to look like a generic game-server control panel, an admin template, or a hobby dashboard.

It should feel like:

> **A private survival-gaming clubhouse crossed with a premium operations center.**

The site should be useful even when no game server is running. It should become the central home for:

- live game-server status;
- players and identities;
- server history;
- uptime;
- versions;
- population;
- player statistics;
- achievements;
- ridiculous achievements;
- leaderboards;
- records;
- the **Hall of Shame**;
- the **Hall of Legends**;
- the **Habitat Chronicle**;
- Discord integration;
- server wake requests;
- announcements;
- administration;
- future server control.

It must be professional enough to look intentionally designed, but fun enough that the group wants to open it just to see what stupid thing happened last night.

The initial dedicated servers are:

1. **7 Days to Die**
2. **Project Zomboid**
3. **RuneScape: Dragonwilds**
4. **Enshrouded**
5. **Palworld**
6. **Valheim**

The architecture must make adding future games straightforward.

---

# 1. NON-NEGOTIABLE PROJECT PRINCIPLES

The agent should follow these principles throughout the build.

## 1.1 Build for reliability before cleverness

Do not build a giant microservice architecture.

This is a private portal for a relatively small community. Favor:

- boring reliability;
- clear TypeScript;
- PostgreSQL;
- simple background workers;
- explicit adapters;
- good logging;
- easy backups;
- easy troubleshooting.

## 1.2 Do not fake statistics

Different games expose different amounts of information.

If a game cannot reliably provide a statistic, do **not** invent it or infer it poorly.

Every game adapter must expose a capability map such as:

```ts
{
  status: true,
  playerCount: true,
  playerNames: false,
  version: true,
  ping: true,
  deaths: false,
  kills: false,
  chat: false,
  adminControl: false
}
```

The UI must gracefully hide unsupported metrics.

## 1.3 “Offline” does not automatically mean broken

These servers are intentionally **not all running at the same time**.

The portal must distinguish:

- `ONLINE`
- `STARTING`
- `STOPPING`
- `SLEEPING` — intentionally shut down
- `UPDATING`
- `DEGRADED`
- `DOWN_UNEXPECTEDLY`
- `UNKNOWN`

**SLEEPING must be visually different from DOWN.**

A sleeping server is not an outage and should not damage its uptime percentage.

## 1.4 Never expose game-admin interfaces to the Internet

RCON, Telnet, REST management APIs, local agent APIs, Windows remote-management interfaces, game query ports, and database ports must never be exposed through the public website.

Only the Habitat web application should be publicly reachable through Cloudflare.

## 1.5 No arbitrary remote shell

Do **not** create a browser-based PowerShell terminal, command prompt, arbitrary RCON shell, or “run anything” admin API.

Server-control actions must be explicit allow-listed operations such as:

- Start server
- Stop server
- Restart server
- Save world
- Update server
- Send announcement
- Create backup

Each action must map to a predefined operation.

## 1.6 Mobile matters

The boys will absolutely check this thing from phones while sitting in Discord.

All major pages must work well on:

- desktop;
- tablet;
- mobile.

---

# 2. RECOMMENDED ARCHITECTURE

## 2.1 Host placement

### Run the main Habitat stack on MartServ101

Use **MartServ101** for:

- Habitat web application;
- PostgreSQL;
- monitoring worker;
- Discord bot/integration;
- Cloudflare Tunnel endpoint;
- database backups.

### Keep MartServ102 focused on games and Jellyfin

MartServ102 already carries:

- Jellyfin;
- dedicated game servers.

Do not add the public-facing portal/database workload there unless necessary.

This provides better separation between:

- the public portal;
- persistent data;
- game workloads;
- media workloads.

It also allows the portal to remain online and show history/status even when a game server crashes or MartServ102 is rebooting.

---

# 3. HABITAT AGENT ON MARTSERV102

Create a small **Habitat Agent** that runs locally on MartServ102 as a Windows service.

This is a major part of the architecture.

## 3.1 Why use an agent

A local agent gives the Habitat portal safe access to information that ordinary remote game queries cannot provide:

- Windows process state;
- PID;
- process uptime;
- memory consumption;
- CPU use;
- server executable version;
- Steam appmanifest build ID;
- log files;
- server config files;
- predefined start/stop scripts;
- game-specific local APIs;
- game-specific RCON/Telnet;
- server update state.

It also avoids relying entirely on UDP game queries from inside Docker.

## 3.2 Security requirements

The Habitat Agent must:

- bind only to the local LAN interface;
- never bind publicly;
- use an API key or HMAC authentication;
- optionally support mTLS later;
- accept requests only from MartServ101;
- reject unknown operations;
- never accept arbitrary shell commands;
- redact passwords/tokens from logs;
- have a `/health` endpoint;
- maintain a heartbeat record in the Habitat database through the worker.

Recommended initial port:

```text
MartServ102:4317
```

This is only a suggested LAN port. Change if needed.

## 3.3 Windows service

Build the agent in TypeScript/Node and run it as a Windows service using a reliable wrapper such as WinSW.

Structure the service so that development can use:

```powershell
pnpm --filter @habitat/agent dev
```

and production can use a built Node entry point.

---

# 4. TECHNOLOGY STACK

Use a modern but conservative stack.

## 4.1 Runtime

Use:

- **Node.js 24 LTS**
- **TypeScript**
- **pnpm**

Do not use Node Current for production merely because it is newer.

## 4.2 Web application

Use:

- **Next.js 16**
- **App Router**
- **React 19**
- Server Components by default
- Client Components only where interaction requires them

At the time this plan was prepared, Next.js 16.3 was preview material and 16.2.11 was the patched Active-LTS production line.

**Agent requirement:** before installation, verify the official Next.js security/release page and install the latest patched production-safe 16.x release.

Do not blindly install an old version from this document.

## 4.3 Styling/UI

Use:

- **Tailwind CSS 4**
- **shadcn/ui**
- **Lucide icons**
- **Motion** for restrained animation
- **Recharts** for charts
- CSS custom properties for the Habitat design tokens

Do not turn this into rainbow neon gamer UI.

## 4.4 Database

Use:

- **PostgreSQL 18**
- **Prisma ORM**
- migrations committed to Git;
- UUIDs;
- JSONB for game-specific payloads.

Do not use a separate TimescaleDB installation initially.

The data volume does not justify the additional operational burden yet.

## 4.5 Authentication

Use:

- **Auth.js**
- Discord OAuth as the preferred login provider;
- optional credentials login for the owner/admin recovery path.

Registration should be **invite-only or admin-approved**.

Do not allow unrestricted public account creation.

## 4.6 Background work

Create a separate Node/TypeScript worker.

The worker handles:

- server polling;
- agent polling;
- status transitions;
- event normalization;
- achievement evaluation;
- Discord notifications;
- scheduled summaries;
- metric retention;
- heartbeat checks.

Do not run critical monitoring solely in browser traffic or Next.js page requests.

## 4.7 Realtime UI

Start with a reliable approach:

- server status worker refresh: every 15 seconds for active servers;
- every 60 seconds for intentionally sleeping servers;
- client status refresh: approximately every 15 seconds.

Use normal HTTP + cache revalidation first.

SSE may be added later for immediate event-stream updates.

Do not introduce WebSockets unless a feature genuinely needs them.

---

# 5. MONOREPO LAYOUT

Create a pnpm workspace.

Recommended structure:

```text
habitat/
├─ apps/
│  ├─ web/                    # Next.js website/API
│  ├─ worker/                 # polling, achievements, Discord, jobs
│  └─ agent/                  # Windows-native MartServ102 Habitat Agent
│
├─ packages/
│  ├─ db/                     # Prisma schema/client/migrations
│  ├─ game-adapters/          # per-game data adapters
│  ├─ shared/                 # types, Zod schemas, constants
│  ├─ auth/                   # shared authorization helpers if useful
│  └─ ui/                     # shared Habitat UI components if justified
│
├─ infra/
│  ├─ docker/
│  ├─ cloudflare/
│  └─ winsw/
│
├─ scripts/
│  ├─ backup/
│  ├─ seed/
│  └─ maintenance/
│
├─ docs/
│  ├─ ARCHITECTURE.md
│  ├─ DEPLOYMENT.md
│  ├─ GAME_ADAPTERS.md
│  ├─ SECURITY.md
│  └─ OPERATIONS.md
│
├─ .env.example
├─ docker-compose.yml
├─ pnpm-workspace.yaml
├─ package.json
├─ README.md
└─ AGENTS.md
```

If Next.js generates an `AGENTS.md`, keep it and supplement it with Habitat-specific instructions.

---

# 6. DOCKER DESIGN ON MARTSERV101

The primary Docker Compose stack should contain:

```text
habitat-web
habitat-worker
habitat-postgres
cloudflared        # optional if reusing an existing host tunnel instead
```

Do not put the MartServ102 native agent in this Docker Compose stack.

## 6.1 PostgreSQL

Use a named persistent volume.

Example logical configuration:

```text
Database: habitat
User: habitat_app
Port: 5432 internal only
```

Do not publish PostgreSQL port 5432 to the public network.

If host troubleshooting requires access, bind to localhost only.

## 6.2 Health checks

All long-running services need health checks:

- web;
- worker;
- PostgreSQL;
- agent;
- Cloudflare tunnel where possible.

## 6.3 Restart policies

Use:

```yaml
restart: unless-stopped
```

for production services unless a stronger reason exists.

---

# 7. CLOUDFLARE / DOMAIN

Public hostname:

```text
habitat.martinobear.com
```

Use Cloudflare Tunnel.

The public request path should be:

```text
Internet
   ↓
Cloudflare
   ↓
Cloudflare Tunnel
   ↓
Habitat Web on MartServ101
```

The tunnel must **not** expose:

- PostgreSQL;
- MartServ102 Habitat Agent;
- RCON;
- Telnet;
- Palworld REST API;
- game query APIs;
- SMB;
- WinRM;
- Docker daemon.

Add security headers and sensible Cloudflare protections.

---

# 8. VISUAL DIRECTION

## 8.1 Brand

Primary title:

# THE HABITAT

Immediately under it in smaller restrained text:

### GOD’S COUNTRY

Avoid giant novelty fonts.

The design should communicate:

- private;
- established;
- rugged;
- premium;
- survival;
- warm;
- tactical without pretending to be military software.

## 8.2 Visual concept

Think:

> **Dark survival lodge + old-world expedition board + modern mission control**

Suggested visual language:

- charcoal / near-black background;
- warm parchment/ivory text;
- muted brass / bronze highlights;
- subtle ember orange for “awake” status;
- subdued moss/forest accents;
- red reserved for actual trouble;
- textured backgrounds used very lightly;
- dark glass panels;
- restrained border highlights;
- tasteful glow only for live state;
- excellent typography;
- large negative space;
- premium charts.

Game tiles may use a small per-game accent, but the overall page must still look like one product.

## 8.3 Animations

Use subtle animations only:

- ember pulse around an online server;
- flip-board style transition for server state;
- achievement toast;
- tiny status heartbeat;
- chronicle entries sliding in;
- record-break animation.

No constant bouncing elements.

## 8.4 Accessibility

Meet reasonable WCAG contrast.

Status cannot be conveyed by color alone.

Use:

- icon;
- text;
- color.

Example:

```text
● ONLINE
☾ SLEEPING
↻ UPDATING
! DOWN
```

---

# 9. HOME PAGE — “THE GREAT HALL”

The homepage should immediately answer:

1. What is running?
2. Who is playing?
3. What happened recently?
4. What is everyone playing tonight?
5. Who embarrassed themselves?

## 9.1 Hero

Top section:

```text
THE HABITAT
God’s Country

[ 2 Fires Burning ] [ 7 Players Online ] [ 6 Worlds ]
```

Hero message can dynamically change:

- “The fires are burning.”
- “Quiet night in God’s Country.”
- “Someone has made another terrible decision.”
- “The Habitat is awake.”
- “All worlds sleeping. Allegedly everyone has a life.”

Keep these tasteful and rotate from a curated set.

## 9.2 Server cards

Each game receives a premium server card.

Show:

- game;
- server/world name;
- state;
- players online;
- capacity;
- current version/build;
- ping;
- session uptime;
- last seen online;
- last update;
- optional current map/world;
- “View World” button.

Sleeping card:

```text
VALHEIM
HabitatValhalla

☾ SLEEPING
Last fire: Today, 2:17 AM
Version: x.x.x
```

Unexpected down card:

```text
PALWORLD

! DOWN UNEXPECTEDLY
Last response: 4 minutes ago
```

Do not use the same styling for these two states.

---

# 10. THE DEPARTURE BOARD

Build a dedicated cross-game status page called:

# The Departure Board

This is the Habitat equivalent of an old station/airport departure board.

Rows:

```text
WORLD               STATUS       PLAYERS     VERSION      LAST FIRE
Valheim             ONLINE       5 / 10      0.x.x        Now
Palworld             SLEEPING     —           1.x.x        Yesterday
7 Days to Die        UPDATING     —           3.x.x        18m ago
Project Zomboid      ONLINE       3 / 16      42.x         Now
```

Optional later columns:

- current event;
- scheduled wake;
- last backup;
- modset.

This page should look cool enough to leave on a spare monitor.

---

# 11. SERVER DETAIL PAGE

Route:

```text
/worlds/[slug]
```

Each server detail page should contain:

## Overview

- state;
- server name;
- game;
- world/save;
- current players;
- version;
- build;
- uptime;
- ping;
- current run start;
- last online;
- latest backup;
- server notes.

## Live Players

When supported:

- avatar;
- Habitat username;
- in-game identity;
- join time;
- session duration;
- game-specific details.

## Activity

Timeline of:

- joins;
- leaves;
- deaths;
- kills;
- achievements;
- records;
- server starts;
- server stops;
- updates;
- admin announcements.

## History

Charts:

- population over time;
- active hours;
- uptime while expected online;
- server run length;
- crash history;
- update history.

## Records

Game-specific records.

## Hall of Shame

Game-specific shame categories.

## Achievements

Achievements earned in that game.

---

# 12. THE HABITAT CHRONICLE

Create a cross-game history feed named:

# The Habitat Chronicle

This should become one of the core fun pages.

It is a normalized event stream across every game.

Examples:

```text
22:41  Torstein died to a tree in Valheim.
22:42  Torstein earned “Forestry Victim.”
22:48  Gunnar joined HabitatValhalla.
23:03  Valheim population reached 6.
23:19  Hakon broke the “Fastest Second Death” record.
23:57  Palworld went to sleep.
00:02  Project Zomboid woke up.
```

Filter by:

- all;
- game;
- player;
- deaths;
- achievements;
- records;
- server;
- admin;
- Discord.

The Chronicle should support permanent links to notable events.

---

# 13. PLAYER SYSTEM

Create Habitat player profiles.

Route:

```text
/players/[username]
```

## 13.1 Player identities

One Habitat user may have different names across games.

Example data model:

```text
Habitat User: Travis

Valheim: Torstein
Project Zomboid: ...
Palworld: ...
Discord: ...
Steam ID: ...
```

Allow users to request/claim identities.

Admin approves ambiguous claims.

## 13.2 Player profile

Show:

- display name;
- optional Discord avatar;
- title;
- favorite game;
- current status;
- games played;
- total recorded playtime;
- achievements;
- rare achievements;
- records;
- shame score;
- recent activity;
- personal stats.

Do not expose sensitive Steam/account identifiers publicly.

---

# 14. TITLES

Create a Habitat title system.

Titles appear:

- under username on profile;
- next to name on leaderboards;
- in achievement notifications;
- optionally in Discord bot output.

Examples:

- **Founder**
- **The Unkillable**
- **Professional Corpse Runner**
- **Keeper of the Campfire**
- **The Architect**
- **Dragon Bait**
- **Employee of the Month**
- **Definitely Had a Plan**
- **Local Wildlife Problem**
- **Portal Inspector**
- **OSHA’s Most Wanted**

Some titles are automatically earned.

Some are manually awarded by admins.

One title can be equipped at a time.

---

# 15. ACHIEVEMENT ENGINE

Achievements must be data-driven, not hard-coded into random UI components.

Create an achievement rule engine.

## 15.1 Achievement definition

Fields:

```text
id
slug
name
description
secretDescription
icon
gameScope
rarity
category
ruleType
ruleConfig JSONB
isSecret
isRepeatable
points
enabled
createdAt
updatedAt
```

## 15.2 Achievement categories

- Progress
- Survival
- Combat
- Exploration
- Social
- Builder
- Server
- Stupid
- Legendary
- Secret

## 15.3 Rarity

- Common
- Uncommon
- Rare
- Epic
- Legendary
- Questionable Life Choice

## 15.4 Initial global achievements

Seed examples:

### Welcome to God’s Country
Join any Habitat server for the first time.

### Habitat Tourist
Play on three different Habitat games.

### Multiversal Liability
Die in three different games.

### The Regular
Record activity on seven separate days.

### Night Shift
Be active between 2:00 AM and 4:00 AM.

### One More Thing
Leave and rejoin a server within five minutes.

### We Have Other Games
Record meaningful play across all six Habitat worlds.

### First Funeral
Become the first recorded death after a world starts.

### Somebody Had to Do It
Become the first player to earn a newly added achievement.

### The Long Haul
Accumulate a large threshold of recorded Habitat playtime.

---

# 16. COMPLETELY USELESS ACHIEVEMENTS

This category should be a first-class feature.

Make them funny, rare, and socially shareable.

Examples:

### Loading Screen Enthusiast
Join the same server an unreasonable number of times in one night.

### Tactical Repositioning
Leave shortly after dying.

### Didn’t Need That Anyway
Die shortly after acquiring/earning something notable, where detectable.

### Fast Learner
Repeat the same death cause within ten minutes.

### World Tour: Wrong Answers Only
Play three different Habitat servers in one night.

### Bedtime Is a Social Construct
Still be active after an absurd hour.

### Stable Connection
Disconnect and reconnect several times in one session.

### That Looked Expensive
Trigger a game-specific destruction/collapse event if the adapter can reliably detect one.

### Administrative Burden
Generate enough ridiculous Chronicle events that an admin manually awards it.

Do not force telemetry that the game cannot reliably provide just to enable a joke.

---

# 17. GAME-SPECIFIC ACHIEVEMENT IDEAS

Only activate rules when the required event can actually be observed.

## 17.1 Valheim

Potential:

- **Forestry Victim** — killed by a falling tree.
- **Naked and Afraid** — recorded corpse run / repeated death chain if detectable.
- **Odin’s HR Complaint** — absurd death streak.
- **Portal Inspector** — use/trigger portal-related event if custom server plugin supplies it.
- **Boar Whisperer** — tame-related event if server-side instrumentation exposes it.
- **Gravity Remains Undefeated** — fatal fall.
- **The Scenic Route** — long delay between death and recovery, if detectable.

## 17.2 Project Zomboid

Potential:

- **Forgot About the Bite**
- **This House Looked Empty**
- **Door Dash**
- **The Walking Skill Issue**
- **One More Can’t Hurt**
- **Interior Decorator** — absurd construction volume if observable.

## 17.3 7 Days to Die

Potential:

- **Blood Moon Intern**
- **Structural Engineer’nt**
- **Loot Goblin**
- **Horde Resources Department**
- **Concrete Was Optional**
- **I Thought You Had Ammo**

## 17.4 Palworld

Potential:

- **Depresso Employee of the Month**
- **PETA Has Entered the Chat**
- **Management Material**
- **Labor Optimization Specialist**
- **That Pal Had a Family**
- **Base Inspector**

## 17.5 Enshrouded

Potential:

- **Shroud Happens**
- **Fog Enjoyer**
- **I Can Make That Jump**
- **Flameborn, Temporarily**
- **Inventory Management Is Content**

## 17.6 Dragonwilds

Potential:

- **Dragon Bait**
- **RuneScape Has Changed**
- **Local Wildlife Problem**
- **This Seemed Safer in the Tutorial**
- **Definitely Ready for That**
- **Surveyor of Bad Decisions**

---

# 18. HALL OF SHAME

Create:

# The Habitat Hall of Shame

It should be funny, prominent, and automated where data supports it.

## 18.1 Global categories

Potential categories:

- Most Deaths
- Fastest Death After Joining
- Fastest Repeat Death
- Most Deaths in One Session
- Most Consecutive Deaths
- Most Frequent Death Cause
- Most Reconnects
- Shortest Survival
- Most Times Breaking Their Own Shame Record
- Latest-Night Disaster
- Worst K/D when K/D is actually available

## 18.2 The Shame Score

Optionally compute a playful non-serious score.

Do **not** create a score that rewards intentionally griefing or sabotaging other players.

Good sources:

- harmless deaths;
- repeated deaths;
- reconnect chaos;
- unusual late-night events;
- silly achievement triggers.

Bad sources:

- harassment;
- bans;
- private moderation events;
- destructive behavior against friends.

## 18.3 Shame record cards

Each record card should show:

- record title;
- current holder;
- game;
- value;
- date;
- prior record;
- related Chronicle event.

---

# 19. HALL OF LEGENDS

Create a positive counterpart:

# The Hall of Legends

Possible records:

- Longest Recorded Session
- Longest Survival Streak
- Most Boss Kills
- Most Total Kills
- Most Habitat Playtime
- Most Games Played
- Most Achievements
- Rarest Achievement
- Longest Active World Session
- Highest Population Event
- First to Complete a Game-specific milestone

Again, only expose metrics reliably supported by game data.

---

# 20. SERVER STATS

## 20.1 Universal server stats

Every adapter should attempt to provide:

- reachable;
- player count;
- max players;
- version;
- ping;
- map/world if available;
- password-required flag where useful;
- query timestamp.

The local Habitat Agent may add:

- process running;
- PID;
- process start time;
- process uptime;
- CPU%;
- working-set memory;
- executable version;
- Steam build ID;
- disk free space;
- last log write;
- last backup.

## 20.2 Historical stats

Store enough data for:

- daily active player peak;
- weekly active player peak;
- total active hours;
- number of server sessions;
- unexpected outages;
- average ping;
- version history;
- update history.

Do not insert a complete row every few seconds forever without retention.

Recommended:

- poll live status every 15 seconds;
- store status transition events immediately;
- store metric samples every 1 minute while online;
- store coarser samples while sleeping;
- roll up historical metrics daily;
- retain raw samples for approximately 90 days;
- keep daily rollups indefinitely.

---

# 21. GAME ADAPTER ARCHITECTURE

Create a shared adapter interface.

Example:

```ts
export interface GameAdapter {
  game: GameType;
  capabilities: GameCapabilities;

  queryStatus(ctx: AdapterContext): Promise<NormalizedServerStatus>;
  getPlayers?(ctx: AdapterContext): Promise<NormalizedPlayer[]>;
  collectEvents?(ctx: AdapterContext): Promise<NormalizedGameEvent[]>;
  getServerDetails?(ctx: AdapterContext): Promise<ServerDetails>;
  sendAnnouncement?(ctx: AdapterContext, message: string): Promise<void>;
  saveWorld?(ctx: AdapterContext): Promise<void>;
}
```

Normalized status:

```ts
type NormalizedServerStatus = {
  reachable: boolean;
  stateHint?: ServerState;
  name?: string;
  map?: string;
  players?: number;
  maxPlayers?: number;
  pingMs?: number;
  version?: string;
  buildId?: string;
  queriedAt: Date;
  raw?: unknown;
};
```

Do not leak raw provider objects directly into the UI.

---

# 22. GAME QUERY STRATEGY

Research completed for this plan indicates that **node-GameDig supports**:

- 7 Days to Die;
- Project Zomboid;
- Enshrouded;
- Palworld;
- Valheim.

Use GameDig server-side as the first status source for these games where it works reliably.

GameDig can return common fields such as:

- server name;
- map;
- player count;
- max players;
- players where provided;
- connect address;
- ping;
- query port;
- version.

GameDig must run server-side, never in the browser.

## 22.1 Docker warning

UDP query libraries can behave poorly in restricted container networking.

Therefore:

- let the Habitat Agent on MartServ102 perform GameDig queries when possible;
- normalize those results;
- send them to MartServ101 over the LAN.

This is preferable to making the Docker web app directly depend on incoming UDP query responses.

---

# 23. PER-GAME DATA SOURCES

## 23.1 7 Days to Die

Start with:

1. GameDig / Valve query for basic status.
2. Habitat Agent process monitoring.
3. Server log parsing.
4. Optional Telnet or built-in server management features for richer events.

Do not expose Telnet publicly.

Potential data:

- state;
- population;
- player names;
- ping;
- version;
- joins/leaves;
- deaths;
- kills where logs expose them;
- chat where appropriate;
- world saves;
- shutdown/start events.

Treat log format as version-specific and protect parsers with tests.

## 23.2 Project Zomboid

Start with:

1. GameDig / Valve query.
2. Habitat Agent process state.
3. server logs;
4. RCON only where necessary for controlled operations.

Potential data:

- state;
- population;
- player names;
- version;
- joins/leaves;
- deaths;
- server events;
- controlled announcements/admin actions.

Do not build an exposed RCON console.

## 23.3 Enshrouded

Use:

1. GameDig / Valve query.
2. Habitat Agent process state.
3. log parsing where stable.

Initial reliable scope:

- state;
- player count;
- max players;
- ping;
- version where provided;
- process uptime;
- build;
- joins/leaves if discoverable.

Expand only after verified testing.

## 23.4 Palworld

Palworld has an official dedicated-server REST API.

Use it **only over the LAN**.

The official documentation warns that it is not intended to be exposed directly to the Internet.

Use:

1. official REST API;
2. GameDig as fallback/status cross-check;
3. Habitat Agent process telemetry.

Potential REST-driven features:

- server info;
- player list;
- server settings;
- metrics;
- announcements;
- save;
- controlled shutdown.

Store the Palworld API credentials only in a server-side secret.

## 23.5 Valheim

Use:

1. GameDig / Valve query;
2. Habitat Agent process telemetry;
3. dedicated-server logs;
4. optional server-side Habitat plugins for structured events.

Valheim must start in public mode (`-public 1`) to respond to GameDig queries. Crossplay servers report zero players through GameDig, so player count must be marked unsupported for crossplay until another verified source exists.

Valheim is an excellent first target for richer custom Habitat telemetry.

Design an event-ingestion endpoint or local file/event queue so server-side plugins can submit structured events such as:

```json
{
  "event": "player_death",
  "player": "Torstein",
  "cause": "Tree",
  "timestamp": "..."
}
```

Possible future plugin events:

- death broadcasts;
- tame events;
- boss kills;
- portal events;
- build records;
- achievements;
- custom titles;
- useless statistics.

The web portal must remain functional even when these plugins are absent.

## 23.6 RuneScape: Dragonwilds

Do **not** assume GameDig support.

Build a custom adapter based on:

1. Habitat Agent process state;
2. UDP/game-port reachability;
3. official server log output;
4. Steam build/appmanifest data;
5. any supported query/API discovered during implementation.

The official Dragonwilds dedicated-server guide confirms dedicated servers and useful console/log output.

Make the adapter modular so a richer protocol can replace the simple health checks later.

---

# 24. HABITAT EVENT MODEL

The secret to achievements, Chronicle, Discord, records, and Hall of Shame is a single normalized event model.

Create a `ServerEvent` table with:

```text
id
serverId
gameType
eventType
occurredAt
receivedAt
playerId nullable
playerIdentityId nullable
actorText nullable
targetText nullable
cause nullable
valueNumber nullable
valueText nullable
metadata JSONB
source
sourceConfidence
dedupeKey nullable
```

Example event types:

```text
SERVER_STARTED
SERVER_STOPPED
SERVER_SLEEPING
SERVER_CRASHED
SERVER_UPDATED
PLAYER_JOINED
PLAYER_LEFT
PLAYER_DIED
PLAYER_KILLED
BOSS_KILLED
CHAT_MESSAGE
WORLD_SAVED
BACKUP_CREATED
ACHIEVEMENT_EARNED
RECORD_BROKEN
ADMIN_ANNOUNCEMENT
WAKE_REQUESTED
WAKE_APPROVED
```

Create deduplication logic.

Log parsers may read overlapping data after restart; events must not duplicate.

---

# 25. DATABASE MODEL

Use Prisma.

Minimum major tables:

## Identity/auth

- `User`
- Auth.js `Account`
- Auth.js `Session`
- `Invitation`
- `PlayerIdentity`
- `UserTitle`
- `TitleDefinition`

## Servers

- `GameServer`
- `ServerRuntimeState`
- `ServerStatusHistory`
- `ServerMetricSample`
- `ServerDailyRollup`
- `AgentHeartbeat`
- `ServerCommand`
- `ServerCommandAudit`

## Activity

- `ServerEvent`
- `PlayerGameSession`
- `PlayerStatSnapshot`

## Achievements

- `AchievementDefinition`
- `PlayerAchievement`
- `AchievementProgress`

## Records

- `RecordDefinition`
- `RecordHolder`
- `RecordHistory`

## Social/content

- `Announcement`
- `ChronicleReaction`
- `WakeRequest`
- `WakeVote`
- `ServerPoll`
- `DiscordConfig`

## Administration

- `AuditLog`
- `SystemSetting`

Use JSONB where game-specific details would otherwise create dozens of nullable columns.

Do not use JSONB for everything.

---

# 26. GAME SERVER TABLE

Suggested core fields:

```text
id
slug
displayName
gameType
worldName
description
hostMachine
hostAddress
gamePort
queryPort
enabled
desiredState
actualState
lastStateChangeAt
lastQueryAt
lastOnlineAt
currentVersion
currentBuildId
maxPlayers
adapterType
agentServerKey
capabilities JSONB
publicNotes
adminNotes
createdAt
updatedAt
```

Sensitive values must not live directly in this table in plaintext.

---

# 27. SECRETS

Secrets may include:

- Discord client secret;
- Discord bot token;
- Auth secret;
- Habitat Agent token;
- RCON password;
- Telnet password;
- Palworld REST credentials;
- database password;
- Cloudflare tunnel token.

Use environment variables for global secrets.

For per-server secrets stored in the database, encrypt them using an application master key such as:

```text
HABITAT_ENCRYPTION_KEY
```

Use authenticated encryption such as AES-256-GCM.

Never render credentials back to the browser after save.

Admin settings should display:

```text
•••••••• configured
```

not the secret.

---

# 28. ROLES & PERMISSIONS

The required roles are:

- `ADMIN`
- `USER`
- `VIEWER`

Do not confuse UI visibility with authorization.

Authorization must be enforced server-side on every sensitive action.

## 28.1 ADMIN

Can:

- access Admin;
- invite users;
- change roles;
- link/approve player identities;
- create/edit achievements;
- create/edit titles;
- edit server configuration;
- manage Discord settings;
- view operational health;
- start/stop/restart servers;
- update servers;
- trigger backups;
- send server announcements;
- manage wake requests;
- view audit logs.

Cannot bypass the no-arbitrary-shell rule.

## 28.2 USER

Can:

- view full community dashboard;
- view server status;
- view leaderboards;
- view Chronicle;
- view Hall of Shame/Legends;
- claim player identities;
- earn achievements;
- equip earned titles;
- vote in polls;
- request a sleeping server be started;
- react to Chronicle events;
- manage their own profile.

Cannot:

- start/stop/update servers directly;
- manage users;
- change server configuration;
- access secrets.

## 28.3 VIEWER

Can:

- view approved status pages;
- view public/approved Chronicle events;
- view records;
- view leaderboards;
- view player profiles if configured public.

Cannot:

- request server actions;
- vote;
- claim identities;
- edit anything;
- view admin operational details.

## 28.4 Public guest

Optional.

A completely unauthenticated visitor should see very little by default.

If implemented:

- general landing page;
- intentionally non-sensitive server status;
- no connection password;
- no private player details;
- no admin metadata.

Make this configurable.

---

# 29. DISCORD INTEGRATION

Discord should be a major feature.

Use a proper Discord application/bot for interactive features.

Use webhooks only for simple outbound messages where appropriate.

## 29.1 Discord account login

Prefer Discord OAuth for Habitat login.

Store:

- Discord user ID;
- display name;
- avatar reference;
- guild membership state if needed.

Do not assume Discord display name equals in-game identity.

## 29.2 Slash commands

Target commands:

```text
/habitat
/server
/server valheim
/who
/leaderboard
/shame
/achievement
/wake
/poll
/chronicle
```

Examples:

```text
/server valheim
→ Valheim is ONLINE — 5/10 players — 42 ms — build ####

/wake palworld
→ Wake request created. 3 people have voted to light the fire.

/shame
→ Current champion: Hakon — Fastest Second Death: 38 seconds
```

## 29.3 Automated Discord events

Configurable per channel:

- server came online;
- server intentionally went to sleep;
- unexpected outage;
- update complete;
- record broken;
- Legendary achievement;
- wake threshold reached;
- weekly Habitat Chronicle.

Do not spam every ordinary join/leave by default.

## 29.4 Weekly Chronicle

Generate a fun weekly summary:

```text
THE HABITAT — WEEK IN REVIEW

Most Played: Valheim
Peak Population: 8
Deaths: 47
New Records: 3
Worst Decision: ...
Achievement of the Week: ...
```

Use deterministic stored data.

AI-generated flavor text may be added later, but the numbers must come from the database.

---

# 30. WAKE REQUESTS — “LIGHT THE FIRE”

Because the servers do not all run simultaneously, create a standout feature:

# Light the Fire

When a server is sleeping, USERS can request it.

Button:

```text
🔥 LIGHT THE FIRE
```

## 30.1 Phase-one behavior

Initially:

1. user clicks Light the Fire;
2. request stored;
3. Discord notification sent;
4. admin can approve;
5. portal tracks request status.

## 30.2 Voting

Allow multiple users to support the same request.

Display:

```text
Palworld
🔥 4 people want this world awake
```

## 30.3 Later automation

After server-control code is proven safe, optionally allow:

- admin approval → automatic start;
- threshold vote → admin prompt;
- scheduled wake windows.

Do not enable fully automatic community startup in the first implementation.

---

# 31. “WHAT ARE WE PLAYING?” POLLS

Create quick community polls.

Examples:

```text
Tonight:
[ Valheim ] 6
[ Zomboid ] 3
[ Palworld ] 4
```

Discord command and portal should use the same database object.

Poll closes at a configured time.

Winner may display:

> **Tonight’s Bad Decision: Valheim**

---

# 32. SERVER CONTROL

Implement only after monitoring is stable.

## 32.1 Allowed operations

Per game:

- Start
- Graceful Stop
- Restart
- Save
- Update
- Backup
- Send Announcement

Capabilities vary by game.

## 32.2 Command lifecycle

Every command:

```text
REQUESTED
AUTHORIZED
DISPATCHED
RUNNING
SUCCEEDED
FAILED
TIMED_OUT
```

Store:

- requesting user;
- action;
- server;
- request time;
- start time;
- completion;
- result;
- safe log excerpt.

## 32.3 Admin UI

Use strong confirmation for destructive operations:

```text
Restart Valheim?

Current players: 6

[ Cancel ] [ Announce & Restart ]
```

If players are online, encourage:

1. announcement;
2. save;
3. delay;
4. shutdown.

---

# 33. ADMIN CENTER

Route:

```text
/admin
```

Sections:

## Dashboard

- web health;
- worker health;
- database;
- agent heartbeat;
- last poll;
- last backup;
- server problems;
- failed commands.

## Servers

- edit display info;
- ports;
- paths;
- adapter;
- process;
- desired state;
- feature capability flags.

## Users

- invite;
- approve;
- role;
- enable/disable;
- player identity mapping;
- Discord link.

## Achievements

- definitions;
- rules;
- rarity;
- manual awards;
- enabled state.

## Titles

- create;
- grant;
- revoke;
- automatic rule.

## Discord

- channel bindings;
- notification toggles;
- test notification.

## Operations

- backups;
- updates;
- server-control queue;
- worker jobs;
- agent health.

## Audit

- all privileged actions.

---

# 34. STATUS / UPTIME LOGIC

A naive uptime percentage will be misleading because servers intentionally sleep.

Implement two metrics:

## 34.1 Availability while requested online

```text
availability =
successful online checks /
checks during desired ONLINE windows
```

## 34.2 Run uptime

Current process uptime:

```text
4h 17m
```

## 34.3 Sleeping time

Track intentionally sleeping time separately.

The UI might show:

```text
Availability: 99.8%
Current Run: 4h 17m
Sleeping This Week: 63h
```

This makes the metric meaningful.

---

# 35. VERSION / BUILD TRACKING

Track:

- reported game version;
- Steam build ID when available;
- detected update changes;
- first seen timestamp;
- last seen timestamp.

Create version history.

Example:

```text
Valheim
Current: 0.x.x
Installed: build 12345678
First detected: Aug 9, 2026
```

Future:

- detect update available;
- show `UPDATE AVAILABLE`;
- admin update action.

Do not auto-update active servers without an explicit policy.

---

# 36. BACKUPS

Add world backup awareness even if actual backup automation is phased later.

## 36.1 Portal metadata

Show:

- latest successful backup;
- age;
- size;
- result.

## 36.2 Database backups

Nightly PostgreSQL backup to a persistent host path.

Suggested:

```text
D:\Habitat\backups\postgres\
```

Retention example:

- 7 daily;
- 4 weekly;
- 6 monthly.

## 36.3 Game-world backups

Do not rewrite existing game backup systems without first inspecting them.

The Habitat Agent should first **discover and report** existing backup methods.

Later standardize them through allow-listed scripts.

---

# 37. NOTIFICATIONS

Create user notification preferences.

Possible notification types:

- world online;
- wake request approved;
- server update complete;
- server unexpected outage;
- achievement earned;
- record broken;
- poll result;
- admin announcement.

Delivery channels:

- website;
- Discord.

Email is unnecessary initially.

---

# 38. CHRONICLE REACTIONS

Allow USERS to react to Chronicle entries with a limited custom reaction set.

Examples:

- 💀
- 🔥
- 🫡
- 🤦
- 👑
- “Skill Issue”

Do not build free-form comments initially.

Discord already handles conversation better.

---

# 39. SEARCH

Global search should eventually find:

- players;
- worlds;
- achievements;
- records;
- Chronicle events.

Use PostgreSQL full-text/trigram features if needed.

Do not add Elasticsearch.

---

# 40. OBSERVABILITY

Use structured logs.

Every service log should include:

```text
timestamp
service
level
message
serverId if relevant
requestId/jobId
```

Never log secrets.

Create:

```text
/api/health
/api/health/ready
```

Health page for admin:

- web;
- database;
- worker last heartbeat;
- agent last heartbeat;
- Discord bot;
- polling loop;
- last successful status check by game;
- backup age.

---

# 41. AUDITING

Privileged actions must create an audit log.

Audit:

- user role changes;
- invites;
- server starts;
- server stops;
- updates;
- backups;
- config changes;
- achievement manual grants;
- title manual grants;
- Discord config changes.

Fields:

```text
actorUserId
action
entityType
entityId
before JSONB
after JSONB
ipHash or request context where appropriate
createdAt
```

Do not record credentials in before/after payloads.

---

# 42. SECURITY REQUIREMENTS

The public site must not become a way into the home network.

Required:

- Cloudflare Tunnel;
- no inbound router forward for the web portal;
- Auth.js;
- invite-only signup;
- server-side RBAC;
- encrypted secrets;
- secure cookies;
- CSRF-safe auth/action patterns;
- input validation with Zod;
- output escaping;
- rate limiting for login/action endpoints;
- no arbitrary file paths from users;
- allow-listed server IDs;
- allow-listed agent operations;
- audit logging;
- dependency updates;
- security headers;
- least-privilege database user;
- no Docker socket mounted into the web container.

Do not mount:

```text
/var/run/docker.sock
```

into the web app.

---

# 43. AGENT API DESIGN

Suggested Habitat Agent endpoints:

```text
GET  /health
GET  /v1/servers
GET  /v1/servers/:key/status
GET  /v1/servers/:key/metrics
GET  /v1/servers/:key/version
GET  /v1/servers/:key/events?cursor=...
POST /v1/servers/:key/actions/start
POST /v1/servers/:key/actions/stop
POST /v1/servers/:key/actions/restart
POST /v1/servers/:key/actions/save
POST /v1/servers/:key/actions/backup
POST /v1/servers/:key/actions/update
POST /v1/servers/:key/actions/announce
```

Authenticate every route except optionally `/health`.

Even `/health` should reveal minimal data.

No endpoint like:

```text
POST /shell
POST /command
POST /powershell
```

is permitted.

---

# 44. AGENT SERVER CONFIG

Keep agent-side server configuration in a local file that is not committed with secrets.

Example:

```yaml
servers:
  - key: valheim
    game: valheim
    displayName: Habitat Valhalla
    processName: valheim_server.exe
    installPath: "C:\\..."
    logPath: "C:\\..."
    query:
      type: valheim
      port: 2457
    actions:
      startScript: "C:\\...\\start.bat"
      stopMode: graceful
```

The VS Code agent must inspect actual installations before writing production paths.

Never guess destructive paths.

---

# 45. PUBLIC API / WEB ROUTES

Suggested Next.js route layout:

```text
/
 /worlds
 /worlds/[slug]
 /departure-board
 /chronicle
 /players
 /players/[username]
 /achievements
 /records
 /hall-of-shame
 /hall-of-legends
 /polls
 /profile

 /admin
 /admin/servers
 /admin/users
 /admin/achievements
 /admin/titles
 /admin/discord
 /admin/operations
 /admin/audit

 /api/status
 /api/worlds/[slug]
 /api/chronicle
 /api/wake
 /api/polls
 /api/profile
 /api/admin/*
```

Do not expose raw agent proxy endpoints generically.

---

# 46. DESIGN SYSTEM COMPONENTS

Create reusable Habitat components.

Examples:

```text
HabitatHeader
HabitatLogo
ServerStatusBadge
ServerCard
DepartureBoard
PlayerChip
PlayerCard
AchievementBadge
AchievementToast
ChronicleEntry
RecordCard
ShameCard
LegendCard
MetricTile
MiniSparkline
WorldHero
WakeButton
PollCard
AdminHealthCard
EmptyWorldState
```

Avoid giant page files with hundreds of lines of repeated Tailwind classes.

---

# 47. EMPTY / SLEEPING STATES

Sleeping worlds should still feel alive.

Example:

```text
☾ THIS WORLD IS SLEEPING

Last fire:
Aug 9 • 2:17 AM

Last known version:
1.0.3

Last party:
Travis, Gunnar, Hakon

🔥 Light the Fire
```

This is far better than a blank “offline” card.

---

# 48. FUN MICROCOPY

Use curated microcopy sparingly.

Examples:

### Online
- “The fire is lit.”
- “God’s Country is open for business.”
- “Poor decisions are currently in progress.”

### Sleeping
- “The world sleeps.”
- “No current emergencies.”
- “Everyone is pretending to be productive.”

### Unexpected Down
- “That was not part of the plan.”
- “The fire went out.”
- “Someone check MartServ102.”

### Empty online server
- “World is ready. Cowards absent.”
- “Server is up. Excuses remain.”

Keep admin/error text professional.

---

# 49. INITIAL SERVER SEED DATA

Create seed entries for:

```text
7 Days to Die
Project Zomboid
RuneScape: Dragonwilds
Enshrouded
Palworld
Valheim
```

Use placeholders for unknown values:

```text
hostAddress
gamePort
queryPort
installPath
logPath
processName
```

Do not invent production values.

For Valheim, if verified locally, use its actual configured values.

The seed script should be safe to run more than once.

---

# 50. PHASED IMPLEMENTATION PLAN

The agent should execute in the following order.

Do not jump to achievement animations before monitoring and identity are correct.

---

## PHASE 0 — REPOSITORY + DOCUMENTATION

### Goals

- create project;
- establish monorepo;
- pin runtime;
- configure lint/typecheck;
- establish architectural docs.

### Tasks

- [ ] Create Git repository if not already present.
- [ ] Add `.gitignore`.
- [ ] Add pnpm workspace.
- [ ] Scaffold apps/packages.
- [ ] Add TypeScript strict config.
- [ ] Add ESLint.
- [ ] Add Prettier only if project-wide formatting is desired.
- [ ] Create `AGENTS.md`.
- [ ] Create `README.md`.
- [ ] Create `.env.example`.
- [ ] Create `docs/ARCHITECTURE.md`.
- [ ] Create `docs/SECURITY.md`.
- [ ] Create `docs/GAME_ADAPTERS.md`.
- [ ] Create `docs/DEPLOYMENT.md`.
- [ ] Create `docs/OPERATIONS.md`.

### Exit criteria

```text
pnpm install
pnpm typecheck
pnpm lint
```

must run successfully.

Commit:

```text
chore: scaffold Habitat monorepo
```

---

## PHASE 1 — POSTGRES + PRISMA + DOCKER

### Tasks

- [ ] Create Docker Compose.
- [ ] Add PostgreSQL 18.
- [ ] Create `packages/db`.
- [ ] Add Prisma.
- [ ] Build first schema.
- [ ] Create migrations.
- [ ] Add seed script.
- [ ] Add database health check.
- [ ] Confirm persistent volume.
- [ ] Confirm database is not publicly exposed.

### Exit criteria

- database survives container restart;
- migration from a clean database succeeds;
- seed succeeds twice without duplicates.

Commit:

```text
feat: add Habitat database foundation
```

---

## PHASE 2 — AUTH + RBAC

### Tasks

- [ ] Integrate Auth.js.
- [ ] Add Discord OAuth.
- [ ] Add recovery/admin credential path if desired.
- [ ] Add `ADMIN`, `USER`, `VIEWER`.
- [ ] Add invitation/approval workflow.
- [ ] Add route protection.
- [ ] Add server-side permission helpers.
- [ ] Create user profile.
- [ ] Seed first ADMIN through a documented secure method.

### Tests

- VIEWER cannot perform USER action.
- USER cannot reach ADMIN action.
- UI hiding a button is **not** counted as security.
- direct HTTP request must also be denied.

Commit:

```text
feat: add authentication and role permissions
```

---

## PHASE 3 — SERVER REGISTRY + BASIC UI

### Tasks

- [ ] Add six server entries.
- [ ] Create status state enum.
- [ ] Build homepage.
- [ ] Build server cards.
- [ ] Build `/worlds`.
- [ ] Build `/worlds/[slug]`.
- [ ] Build The Departure Board.
- [ ] Implement sleeping state.
- [ ] Implement admin server metadata editor.
- [ ] Add custom Habitat branding.

No fake live status yet.

Exit criteria:

- all pages render;
- mobile works;
- cards use database server definitions;
- intentionally sleeping state is first-class.

Commit:

```text
feat: build Habitat world registry and dashboard
```

---

## PHASE 4 — HABITAT AGENT

### Tasks

- [ ] Build agent server.
- [ ] Implement authentication.
- [ ] Implement `/health`.
- [ ] Add process lookup.
- [ ] Add process uptime.
- [ ] Add memory/CPU.
- [ ] Add disk space.
- [ ] Add executable/build detection.
- [ ] Add GameDig dependency.
- [ ] Add per-server configuration.
- [ ] Create Windows service packaging.
- [ ] Create install/uninstall scripts.
- [ ] Lock firewall to MartServ101.
- [ ] Add worker→agent health test.

Exit criteria:

- agent reports actual MartServ102 data;
- no public access;
- no arbitrary command endpoint;
- agent automatically restarts as a Windows service.

Commit:

```text
feat: add MartServ102 Habitat Agent
```

---

## PHASE 5 — LIVE SERVER MONITORING

### Tasks

Implement adapters for:

- [ ] Valheim
- [ ] Palworld
- [ ] Enshrouded
- [ ] Project Zomboid
- [ ] 7 Days to Die
- [ ] Dragonwilds

For each:

- [ ] status;
- [ ] player count if supported;
- [ ] ping if supported;
- [ ] version if supported;
- [ ] process state;
- [ ] capability map.

Worker:

- [ ] poll agent;
- [ ] normalize status;
- [ ] detect state transitions;
- [ ] persist current state;
- [ ] persist history;
- [ ] store metric samples;
- [ ] detect unexpected down separately from sleeping.

Exit criteria:

The homepage accurately shows actual running/sleeping servers.

Commit:

```text
feat: add live multi-game server monitoring
```

---

## PHASE 6 — CHRONICLE + EVENT INGESTION

### Tasks

- [ ] Add normalized `ServerEvent`.
- [ ] Add dedupe keys.
- [ ] Implement join/leave where available.
- [ ] Implement death events where verified.
- [ ] Implement server start/stop/update events.
- [ ] Create Chronicle page.
- [ ] Add filters.
- [ ] Add permanent event detail links.
- [ ] Add reactions.

Exit criteria:

The Chronicle remains valid across worker restarts and does not duplicate replayed events.

Commit:

```text
feat: add the Habitat Chronicle
```

---

## PHASE 7 — PLAYER IDENTITIES + PROFILES

### Tasks

- [ ] Add cross-game player identities.
- [ ] Add claim flow.
- [ ] Add admin approval.
- [ ] Add Discord identity.
- [ ] Create profiles.
- [ ] Create game stats sections.
- [ ] Add titles model.
- [ ] Allow equipped title.
- [ ] Protect sensitive identifiers.

Commit:

```text
feat: add Habitat player identities and profiles
```

---

## PHASE 8 — ACHIEVEMENT ENGINE

### Tasks

- [ ] Add achievement tables.
- [ ] Create rule engine.
- [ ] Add event-driven evaluation.
- [ ] Add progress-based rules.
- [ ] Add secret achievements.
- [ ] Add rarity.
- [ ] Seed initial achievements.
- [ ] Add achievement page.
- [ ] Add achievement toasts.
- [ ] Add Discord notification for important awards.
- [ ] Add manual admin award.

Tests must verify idempotency.

The same event cannot award the same non-repeatable achievement twice.

Commit:

```text
feat: add Habitat achievements and titles
```

---

## PHASE 9 — HALL OF SHAME + HALL OF LEGENDS

### Tasks

- [ ] Add record definitions.
- [ ] Add record evaluator.
- [ ] Track record history.
- [ ] Add Hall of Shame.
- [ ] Add Hall of Legends.
- [ ] Add game filters.
- [ ] Add player filters.
- [ ] Link records to Chronicle events.
- [ ] Add tasteful record-break animation.

Commit:

```text
feat: add Habitat records and Hall of Shame
```

---

## PHASE 10 — DISCORD

### Tasks

- [ ] Create bot.
- [ ] Add slash commands.
- [ ] Add outbound notifications.
- [ ] Add channel configuration.
- [ ] Add wake-request notices.
- [ ] Add record announcements.
- [ ] Add Legendary achievement notices.
- [ ] Add weekly Chronicle summary.
- [ ] Add `/server`.
- [ ] Add `/who`.
- [ ] Add `/wake`.
- [ ] Add `/shame`.
- [ ] Add `/leaderboard`.

Commit:

```text
feat: connect The Habitat to Discord
```

---

## PHASE 11 — LIGHT THE FIRE + POLLS

### Tasks

- [ ] Add wake requests.
- [ ] Add votes.
- [ ] Add admin approval.
- [ ] Add Discord integration.
- [ ] Add “What are we playing?” polls.
- [ ] Add current active poll to homepage.

Do not auto-start servers yet.

Commit:

```text
feat: add community wake requests and game-night polls
```

---

## PHASE 12 — CONTROLLED SERVER ACTIONS

Only begin after monitoring has been proven stable.

### Tasks

- [ ] Build allow-listed agent actions.
- [ ] Start.
- [ ] Graceful stop.
- [ ] Restart.
- [ ] Save.
- [ ] Backup.
- [ ] Update.
- [ ] Announcement.
- [ ] Add command state machine.
- [ ] Add admin confirmation.
- [ ] Add player-count warning.
- [ ] Add audit trail.
- [ ] Add Discord maintenance message.

Test each game independently.

Commit:

```text
feat: add guarded dedicated-server controls
```

---

## PHASE 13 — PRODUCTION HARDENING

### Tasks

- [ ] Create production Docker images.
- [ ] Add non-root container users where possible.
- [ ] Add health checks.
- [ ] Add backup scripts.
- [ ] Add retention job.
- [x] Add Cloudflare hostname.
- [x] Confirm only web is publicly exposed.
- [ ] Run dependency audit.
- [ ] Run authorization tests.
- [ ] Run Playwright.
- [ ] Test phone layouts.
- [ ] Test database restore.
- [ ] Test MartServ102 reboot.
- [ ] Test MartServ101 reboot.
- [ ] Test game crash.
- [ ] Test sleeping server.
- [ ] Test agent unavailable.
- [ ] Test Discord unavailable.
- [ ] Document recovery.

Commit:

```text
chore: harden Habitat for production
```

---

# 51. TESTING STRATEGY

Use:

- unit tests for normalizers;
- unit tests for achievement rules;
- unit tests for record rules;
- integration tests for database;
- adapter fixture tests using captured sanitized payloads/log lines;
- Playwright for major user flows.

Critical tests:

## Status

- online response → ONLINE;
- intentional desired sleeping → SLEEPING;
- process dies while desired online → DOWN_UNEXPECTEDLY;
- query fails but process running → DEGRADED;
- agent absent → UNKNOWN, not automatically DOWN.

## Permissions

- direct unauthorized API calls fail;
- VIEWER cannot create wake request;
- USER cannot server-control;
- ADMIN can control.

## Achievements

- idempotent awards;
- replaying old log lines does not duplicate;
- unsupported metric never triggers achievement.

## Records

- ties handled;
- prior holder preserved;
- record history immutable.

---

# 52. ERROR HANDLING

The portal should degrade gracefully.

Examples:

## Agent unavailable

Display:

```text
STATUS UNKNOWN
MartServ102 agent has not reported in 52 seconds.
```

Do not display all servers as down.

## Query failure but process running

Display:

```text
DEGRADED
Server process is running, but game query is not responding.
```

## Discord unavailable

Do not fail server monitoring.

Queue/retry important notification once.

## Database unavailable

Health check should fail and web should show a controlled error.

---

# 53. PERFORMANCE

This is a small private portal.

Do not prematurely optimize.

Still follow:

- server rendering for initial page;
- sensible indexes;
- pagination on Chronicle;
- aggregate queries for leaderboards;
- daily rollups;
- lazy chart data;
- image optimization;
- no huge client JS bundle.

Aim for fast mobile load.

---

# 54. DATABASE INDEXES

Add indexes for:

```text
ServerEvent(serverId, occurredAt)
ServerEvent(eventType, occurredAt)
ServerEvent(playerId, occurredAt)
ServerMetricSample(serverId, recordedAt)
PlayerGameSession(playerId, startedAt)
PlayerAchievement(playerId, earnedAt)
RecordHolder(recordDefinitionId)
WakeRequest(serverId, status, createdAt)
AuditLog(createdAt)
```

Use indexes based on actual query plans, not every column.

---

# 55. DATA PRIVACY

This is a friends/family portal.

Still avoid collecting unnecessary personal data.

Do not show publicly:

- IP addresses;
- Steam IDs;
- emails;
- Discord tokens;
- game passwords;
- admin notes;
- exact private network addresses;
- server filesystem paths.

The public UI should show friendly server names, not infrastructure secrets.

---

# 56. FUTURE IDEAS — AFTER V1

These should be designed for but not block V1.

## 56.1 Habitat TV Mode

Fullscreen rotating display:

- Departure Board;
- live players;
- Chronicle;
- records;
- screenshots.

## 56.2 Screenshot of the Week

Members submit screenshots.

Discord vote chooses winner.

## 56.3 Season Pages

Track eras:

```text
Valheim — Deep North Season
Palworld — 1.0 World
Zomboid — Bad Decisions Season III
```

Allow stats/records to reset by season while preserving lifetime history.

## 56.4 World Memorials

When a server world is retired:

- archive final stats;
- final player list;
- screenshots;
- records;
- Chronicle highlights;
- world lifespan.

Call it:

# The Graveyard

This is an archive of worlds, not failed server health.

## 56.5 Habitat Yearbook

Generate an annual recap:

- total playtime;
- deaths;
- peak population;
- most played game;
- player of the year;
- shame champion;
- rarest achievement;
- biggest night;
- favorite screenshots.

## 56.6 “Tonight in the Habitat”

Automatic home-page card combining:

- active poll;
- current servers;
- recent Discord activity;
- planned game night.

## 56.7 AI Chronicle Narrator

Optional later.

Use an LLM to turn verified event data into a short comedic recap.

Important:

- facts come from stored data;
- AI only writes flavor;
- AI cannot alter stats;
- keep it opt-in;
- never block core portal operation on AI.

## 56.8 Habitat API

Create read-only API endpoints so future:

- Discord;
- mobile widgets;
- Stream Deck;
- desktop tray app;
- OLED status screen

can reuse the same data.

---

# 57. V1 DEFINITION OF DONE

V1 is complete when:

- [x] `habitat.martinobear.com` is live through Cloudflare Tunnel.
- [ ] The Habitat branding looks intentional and polished.
- [ ] Discord login works.
- [ ] ADMIN / USER / VIEWER permissions work.
- [ ] All six servers exist in the registry.
- [ ] Each server correctly shows ONLINE/SLEEPING/DOWN/UNKNOWN.
- [ ] Running servers show player count where supported.
- [ ] Version/build is shown where supported.
- [ ] Last online time is correct.
- [ ] Server detail pages work.
- [ ] The Departure Board works.
- [ ] The Chronicle works.
- [ ] Player profiles exist.
- [ ] Player identities can be linked.
- [ ] Achievements work.
- [ ] Useless achievements exist.
- [ ] Hall of Shame works.
- [ ] Hall of Legends works.
- [ ] Discord status commands work.
- [ ] Wake requests work.
- [ ] Polls work.
- [ ] Database backups work.
- [ ] Admin health page works.
- [ ] Mobile layout is excellent.
- [ ] No game-management API is exposed publicly.
- [ ] Production recovery is documented.

Server-control actions may ship immediately after V1 if additional validation is needed.

---

# 58. V2 DEFINITION OF LEGENDARY

The project reaches “legendary” status when the group naturally uses it without being told to.

Target:

- someone opens the portal to see who is on;
- Discord links to a ridiculous death record;
- someone fights over the Hall of Shame;
- achievements become inside jokes;
- a sleeping world gets voted awake;
- everyone knows The Departure Board;
- the Chronicle becomes the unofficial history of the group;
- new game servers feel incomplete until they are added to Habitat.

---

# 59. AGENT EXECUTION RULES

The VS Code AI agent should operate autonomously and methodically.

## Required behavior

1. Read this entire plan before changing files.
2. Inspect the current machine/repository state first.
3. Do not destroy or rewrite existing dedicated-server installations.
4. Do not modify production server config merely to make monitoring easier without documenting and validating the change.
5. Keep a task checklist in `docs/BUILD_STATUS.md`.
6. Update the checklist as work is completed.
7. Build one phase at a time.
8. Run tests/typecheck before moving on.
9. Fix root causes rather than suppressing errors.
10. Commit after meaningful stable phases.
11. Do not commit `.env`, credentials, tokens, passwords, or private IP-sensitive config unless explicitly intended.
12. Keep `.env.example` current.
13. Keep documentation current.
14. Never fake successful tests.
15. Never fake live server data.
16. Never silently downgrade security to “make it work.”
17. Do not add dependencies for trivial functionality.
18. Prefer first-party/official game APIs where available.
19. Keep adapters isolated so one broken game integration cannot break all monitoring.
20. Create fixtures/tests before aggressively parsing game logs.

## When blocked

If a missing value is truly required, such as an unknown production path or secret:

- leave a clear placeholder;
- document exactly what is needed;
- continue all independent work.

Do not guess a dangerous server path or credential.

---

# 60. FIRST ACTIONS FOR THE VS CODE AGENT

Start here.

### Step 1

Create:

```text
docs/BUILD_STATUS.md
```

with every phase from this plan.

### Step 2

Inspect:

- operating system;
- Node version;
- pnpm;
- Docker;
- current working directory;
- Git state;
- available LAN DNS resolution for `MartServ102`.

### Step 3

Scaffold the monorepo.

### Step 4

Create Docker Compose with PostgreSQL.

### Step 5

Create Prisma models for:

- User;
- GameServer;
- ServerRuntimeState;
- ServerStatusHistory;
- ServerEvent;
- PlayerIdentity;
- AuditLog.

Do not try to model every future feature in migration #1.

### Step 6

Build the branded static dashboard against seeded server data.

### Step 7

Add authentication/RBAC.

### Step 8

Build the Habitat Agent.

### Step 9

Get **one game completely working end-to-end** before wiring all six.

Recommended first game:

# Valheim

Validate:

```text
MartServ102
→ Habitat Agent
→ adapter
→ worker
→ PostgreSQL
→ Next.js API
→ dashboard
```

Then implement the other game adapters.

---

# 61. RESEARCH BASIS / CURRENT TECHNICAL NOTES

These notes were checked while preparing this plan on August 9, 2026.

## Next.js

The current Next.js documentation uses the App Router and modern React Server Component architecture.

Next.js 16.3 was preview material in 2026. The project should use the latest patched production-safe stable Next.js 16.x version verified at implementation time.

References:

- https://nextjs.org/docs
- https://nextjs.org/docs/app
- https://nextjs.org/blog

## Node.js

Node’s own guidance recommends production applications use an LTS release.

Use Node 24 LTS for this project unless a newer LTS has become appropriate at implementation time.

Reference:

- https://nodejs.org/en/about/previous-releases

## PostgreSQL

PostgreSQL 18 is the current supported major production release while PostgreSQL 19 remains pre-release as of this plan date.

References:

- https://www.postgresql.org/docs/current/
- https://www.postgresql.org/docs/release/

## Auth.js RBAC

Auth.js supports role-based access-control patterns and restricting account access.

References:

- https://authjs.dev/guides/role-based-access-control
- https://authjs.dev/guides/restricting-user-access

## Steam / Valve server query protocol

Valve documents A2S queries including:

- A2S_INFO;
- A2S_PLAYER;
- A2S_RULES.

Reference:

- https://developer.valvesoftware.com/wiki/Server_queries

## GameDig

GameDig is a Node server-side game-query library supporting hundreds of games.

Its current supported list includes:

- 7 Days to Die;
- Project Zomboid;
- Enshrouded;
- Palworld;
- Valheim.

References:

- https://github.com/gamedig/node-gamedig
- https://github.com/gamedig/node-gamedig/blob/master/GAMES_LIST.md

Important: GameDig notes that UDP queries may need special handling in containers. This is a major reason for running the local Habitat Agent on MartServ102.

## Palworld

Pocketpair provides an official dedicated-server REST API.

The documentation specifically warns against publishing the API directly to the Internet and recommends LAN use.

Reference:

- https://docs.palworldgame.com/api/rest-api/palwold-rest-api/

## Dragonwilds

RuneScape: Dragonwilds now has official dedicated-server support, including Windows/Linux hosting and server log/console operation.

Reference:

- https://dragonwilds.runescape.com/news/how-to-dedicated-servers

Do not assume GameDig support; use a custom adapter until a tested supported query mechanism is confirmed.

## Discord

Discord provides:

- REST APIs;
- applications/bots;
- application commands;
- webhooks.

References:

- https://docs.discord.com/developers/reference
- https://docs.discord.com/developers/interactions/application-commands
- https://docs.discord.com/developers/resources/webhook

---

# 62. FINAL PRODUCT STANDARD

Do not stop when it technically works.

Before calling a page complete, ask:

- Does it look intentionally designed?
- Is the important information obvious in three seconds?
- Is the copy actually fun?
- Does a sleeping server look intentional rather than broken?
- Does mobile look as good as desktop?
- Is every privileged action authorized server-side?
- Could a game-server failure break the portal?
- Could a portal compromise expose MartServ102?
- Are the statistics real?
- Does this feel like **The Habitat**, or like a template with a logo pasted onto it?

The final standard is:

> **Useful enough to operate the servers, polished enough to show off, and ridiculous enough that the group keeps coming back to see who earned “OSHA’s Most Wanted.”**

---

# BUILD THE DAMN THING

**THE HABITAT**  
*God’s Country*

Six worlds. One clubhouse. A permanent record of every questionable decision.
