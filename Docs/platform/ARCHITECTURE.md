# Architecture

The Habitat is a strict TypeScript pnpm monorepo. It uses a Next.js web application, PostgreSQL through Prisma, an independent monitoring/reconciliation worker, a Windows-native private agent, and a small shared-domain package.

## Runtime topology

| Location | Components | Responsibility |
| --- | --- | --- |
| MartServ101 | `HabitatWeb`, `HabitatWorker`, PostgreSQL, Cloudflare Tunnel, backups | Public portal boundary, persistence, scheduled work, Discord runtime, and backups |
| MartServ102 | `HabitatAgent`, named game/update services, game data and logs | Private observation and tightly allow-listed game service control |
| Browser | Next.js UI | Reads rendered/persisted data and submits authenticated application requests; never calls the agent or game services directly |

The intended data path is:

```text
MartServ102 game/process/log sources
  -> private authenticated Habitat Agent
  -> MartServ101 Worker
  -> PostgreSQL
  -> Next.js web application
  -> member browser
```

The command path is deliberately separate:

```text
admin typed confirmation -> persisted command queue + audit -> worker -> fixed agent action -> named Windows service
```

There is no browser-to-agent proxy, generic command endpoint, arbitrary shell, arbitrary RCON, or request-supplied file path.

## Packages

| Package | Responsibility |
| --- | --- |
| `apps/web` | Next.js App Router, Auth.js, member/admin surfaces, local APIs, avatar serving, Great Hall, Three.js/Rive reward presentation |
| `apps/worker` | Agent polling, normalized persistence, legacy-history imports, bounded Steam/Club provider sync, cross-game activity projection, XP/quest/reward/record evaluation, Discord outbox, command dispatch, Habitat Pulse signal evaluation |
| `apps/agent` | Windows process/query/log observation, bounded history extraction, and fixed allow-listed named-service actions |
| `packages/db` | Prisma schema, migrations, seed data, generated client |
| `packages/shared` | Server states, agent contracts, progression, reward, achievement, and record domain types |

## Data and truth boundaries

- Registry and UI definition data can be seeded, but runtime state is live only after the worker persists an agent observation.
- `ServerEvent` remains the hosted-world source of truth. `GameActivity` is a replay-safe evidence bridge for hosted and Club Game facts; it never fabricates a server or server event for external provider data.
- Steam library and achievement history is enrichment only and cannot create Habitat XP. Activity-backed consumers require allow-listed provenance and stay feature-gated until provider shadow evaluation passes.
- Unsupported game metrics are omitted instead of estimated.
- `SLEEPING` means intentionally stopped and is distinct from `DOWN_UNEXPECTEDLY`; unavailable monitoring produces `UNKNOWN`, not an invented outage.
- Historical evidence is normalized and deduplicated. Timestamp-paired verified sessions can contribute playtime and XP after ownership is established; sightings without verified duration remain visible but do not create XP.
- Profile rewards are ledger-backed and reconciliation is idempotent. Claiming an unowned identity can safely change a member's totals, achievements, titles, and standings because the history is replayed through the same dedupe-protected pipeline.
- Habitat Pulse follows the same rule as world state: a signal nobody could evaluate is `UNKNOWN`, never healthy and never alerted on. The worker is the sole evaluator and stores its verdicts, so the admin view and any Discord alert are the same judgement rather than two independent guesses. Because the worker cannot report its own death, the view recomputes process freshness from `ServiceHeartbeat` and dates every other signal as stale when the worker's beat stops.
- OpenTelemetry is additive and severable in both directions: Pulse never reads the telemetry backend, and the backend never decides a Pulse verdict. Pulse works on a fresh clone with nothing but Postgres.

## Great Hall and rewards

The Great Hall selects sunrise, midday, sunset, and night lodge plates using `America/New_York`. A continuously rendered Three.js background is coordinated with Rive/Canvas reward presentation. The living-window scheduler creates exactly three deterministic, non-overlapping encounters per Eastern hour; most of the time the view remains quiet.

Generated bear, raven, and UFO plates are color-graded and depth-masked against the lodge opening. Procedural storm, lightning, comet, aurora, firefly, eclipse, and blood-moon layers share the encounter clock. Reduced-motion users receive readable static compositions instead of hidden animation states.

## Operational constraints

- PostgreSQL binds to loopback only.
- The agent binds to one explicit private address and permits only configured private client addresses with a bearer token.
- Agent history paths and control-service names originate in ignored local configuration; requests cannot provide either value.
- Secrets stay in ignored `.env` or agent-local configuration and are not returned in browser payloads, logs, or tracked files.
