# Operational observability

Two separate things, deliberately kept separate:

- **Habitat Pulse** (`/admin/pulse`) answers *is this installation healthy right
  now*, using only Postgres. It works on a fresh clone with no extra
  infrastructure, and it is the surface an administrator is expected to open.
- **OpenTelemetry** answers *why was that request slow, and what happened
  inside it*. It is dormant until an OTLP endpoint is configured, and nothing in
  the product depends on it being on.

Pulse never reads from the telemetry backend, and the telemetry backend never
decides a Pulse verdict. Either can be switched off without the other noticing.

---

## Habitat Pulse

### How it works

The worker evaluates every signal on its own cadence
(`HABITAT_PULSE_INTERVAL_MS`, default 60s) and writes the verdict to
`PulseSignal`. The admin view renders those stored verdicts rather than
recomputing them, so what an administrator reads and what Discord was told about
are the same judgement, made at the same moment, about the same facts.

Three rules run through the whole design:

1. **Unknown is not a failure.** A signal that could not be evaluated — an
   integration that is not configured, a probe that has never run — reports as
   unknown. It is never painted green, and it never raises an alert.
2. **Freshness is judged against the writer's declared cadence.** Each heartbeat
   carries the interval its writer intends to keep, so changing
   `HABITAT_WORKER_POLL_INTERVAL_MS` cannot turn a healthy process red.
3. **The worker cannot report its own death.** The admin view therefore
   recomputes the web and worker tiles directly from `ServiceHeartbeat`, and
   marks every other signal as stale — keeping its last known status, clearly
   dated — once the worker's beat stops.

### The signals

| Signal | Healthy means | Fails when |
| --- | --- | --- |
| Cloudflare tunnel | The worker fetched `GET /api/pulse` on the public origin and this app answered | The origin is unreachable, returns a non-2xx, or answers with something that is not this app |
| Web freshness | The Next.js process wrote a heartbeat within its cadence | The beat is 3 intervals late (warn) or 8 (critical) |
| Worker freshness | The monitoring cycle wrote a heartbeat within its cadence | As above. Everything else on the page is only as fresh as this |
| Agent freshness | The authenticated `/health` probe succeeded | The agent is down, or rejects the token or source IP |
| Collector health | Every configured history source is readable, untruncated, and still parsing records | A source is unreadable, is truncated, skipped records, or **is readable but parsed nothing**; enabled worlds without a history source remain visible in the breakdown but do not count as a failed configured source |
| Database backup | The newest `backup-habitat.ps1` run captured the database, the recorded dump still exists with the recorded size, and the run is within 30h | The database step failed, its artifact is missing or inconsistent, the summary is unreadable, or the run is 30h (warn) / 72h (critical) old |
| Event ingestion lag | Events are arriving, and arriving soon after they happen | Nothing recorded for 12h (warn) / 36h (critical), or a median arrival delay over 45m (warn) / 3h (critical) |
| Event volume | Recent volume sits within this installation's own trailing baseline | A 6× spike over baseline, or total silence for 6h against a real baseline |
| Discord | The bot is connected and the notification queue is draining | A notification exhausted all 8 attempts (critical); the gateway is not ready, the bot did not start, or a notice has been queued 30m (warn) |
| Twitch | Helix polling is succeeding on its configured cadence and inside its daily budget | The budget is exhausted or every channel is failing (critical); some channels failing, 90% of budget spent, or the newest sync is late (warn, then critical) |
| Pipeline evaluations | No import, activity, identity, or reward evaluation threw in the last 24h | 1+ unresolved failure (warn), 10+ (critical) |
| Claim reconciliation | No identity reward job is stuck | A job is 30m old or on its 3rd attempt (warn); 5+ stuck, or any past the retry ceiling (critical) |
| Codex drive freshness | The bundle on the shared drive is as new as the codex it came from | The codex has changed, or a release has been cut, and the drive has not caught up for 5m (warn) / 20m (critical); the configured drive cannot be read, or nothing was ever published (critical); the published bundle predates the release boundary (warn). Unknown when no drive is configured or no release has been cut |

A readable source that parses zero records is treated as **critical**, not
healthy. That is exactly what a parser whose pattern no longer matches the real
log format looks like, and it is the failure that cost this installation days of
missing Valheim joins in August 2026.

### Why codex drive freshness is not the same as `sync:verify`

Integrity is not freshness. `pnpm --filter @habitat/codex-sync sync:verify` confirms
that the bundle on `N:\Martino_Codex` hashes correctly — and it does, perfectly,
while the publisher has been failing on every poll for hours and the machine
building the game is reading yesterday's canon. That is not a hypothetical: it
happened on 2026-08-28, for eight hours, and the reason nobody noticed is that
the publisher **fails safely**. It leaves the last good bundle exactly where it
was.

This signal asks the only question that matters to the build machine: is what is
on the drive what canon says now? It compares the drive's own pointer and
manifest against the newest cut release and the newest codex change, which is
cheap enough to run every worker cycle — deliberately *not* the publisher's
`codexPublishState`, which rebuilds the snapshot and writes assets to the share
to reach its answer.

The worker needs `HABITAT_CODEX_SYNC_ROOT` to see the drive at all; supply it
with `install-worker.ps1 -SyncRoot`. It reads and never writes. Without it the
signal is UNKNOWN, and UNKNOWN is never alerted on.

### Alerting

A transition to warn or critical queues one Discord message; the signal staying
in that state queues nothing further. Returning from warn or critical to healthy
queues one recovery note. Unknown never alerts and never masquerades as a
recovery. A signal is marked notified only when a durable operations-alert row
was actually queued; older orphaned markers are repaired automatically.

Alerts go **only** to a guild's `operationsChannelId`, configured on
`/admin/discord`. There is no fallback to the announcement channel: operational
detail being read by the whole clubhouse is worse than an alert nobody receives.
Leaving the field blank keeps operational alerting off entirely.

### What the worker had to start recording

- `ServiceHeartbeat` — one upserted row per process. Freshness is the signal;
  the values are context.
- `CollectorSourceState` — per world, per source: whether the last scan opened
  it, how many records it parsed, how many were new, and the newest record seen.
- `EvaluationFailure` — an import, activity, identity, or reward evaluation that
  threw. Previously one poisoned record could abort an entire loop with nothing
  but a log line; the record is now skipped, counted, and automatically resolved
  when that exact stage and record succeeds on replay.

---

## OpenTelemetry

### Turning it on

```
HABITAT_OTEL_EXPORTER_OTLP_ENDPOINT=http://127.0.0.1:4318
```

That is the whole switch. With it unset, no SDK starts, no instrumentation is
installed, and no outbound connection is opened. The standard
`OTEL_EXPORTER_OTLP_ENDPOINT` is honoured too, so a collector agent that injects
it works without editing Habitat configuration; the `HABITAT_`-prefixed variable
wins when both are present. `HABITAT_OTEL=off` disables telemetry while keeping
the endpoint configured.

An endpoint carrying credentials, a query string or a fragment is refused rather
than silently stripped — credentials in a telemetry URL end up in logs and
process listings. Use `HABITAT_OTEL_EXPORTER_OTLP_HEADERS` instead.

### What is instrumented

| Service | Bootstrap | Instrumentation |
| --- | --- | --- |
| Web | `apps/web/instrumentation.ts` → `lib/telemetry.ts` | Next's own request/render spans, plus undici (`fetch`) and `pg` — see the limitation below |
| Worker | `apps/worker/src/bootstrap.ts` → `telemetry.ts`, before worker dependencies load | HTTP, undici, `pg` |
| Agent | `apps/agent/src/index.ts` starts telemetry before dynamically loading the server | Inbound HTTP only — the agent holds no database credentials |

All three carry `service.name`, `service.version`, `service.namespace` and
`deployment.environment.name`, so one Grafana query separates them.

The OpenTelemetry Node SDK patches modules at require time, which only works
when it is loaded from `node_modules` rather than bundled. The web packages are
therefore listed in `serverExternalPackages` in `next.config.ts`; removing them
silently disables web instrumentation.

`apps/web/instrumentation.ts` loads `@/lib/environment` before anything else,
deliberately. That module is what reads `.env`, and every other entry point
picks it up incidentally by importing a page or a route — but `register()` runs
before any of those exist. Without it the SDK reads an empty environment and
reports itself permanently off.

### Web HTTP metrics are derived from Next spans

Under `next start`, Next has already required `node:http` and created its server
by the time `register()` runs. Next's own request and render spans still arrive,
because those go through the OpenTelemetry API and attach to whichever tracer
provider is registered, but the HTTP module instrumentation cannot patch a
module that is already loaded. The collector's bounded span-metrics connector
therefore derives the web request and error series from Next's server spans.
The worker and agent, which control their own process bootstrap, can also export
native HTTP instruments.

Adding native web HTTP instruments would mean preloading the SDK with `node --import` before Next starts,
which either duplicates the endpoint validation in a plain `.mjs` (it cannot
import this repo's TypeScript through a workspace symlink) or injects a TS
loader into the production web server. Neither was judged worth it for HTTP
counters that the Next spans already supply safely. If it
becomes worth it, the hook is `NODE_OPTIONS` in
`apps/web/service/HabitatWeb.xml.template`.

### The local stack

`docker-compose.yml` runs the collector, Tempo, Prometheus and Grafana beside
Postgres. **Every port is published on 127.0.0.1 only.** Traces carry request
paths and host names, so telemetry is treated as private operational data,
exactly like the database.

```
web ─┐
worker ├─ OTLP/HTTP :4318 ─▶ otel-collector ─┬─ OTLP ─▶ tempo      (traces, 7 days)
agent ─┘                                     └─ :8889 ◀─ prometheus (metrics, 15 days)
                                                            ▲
                                                         grafana  (127.0.0.1:3009)
```

Grafana provisions both data sources and a `Habitat services` dashboard. The
collector also exposes its own pull metrics on the Compose network so Prometheus
can distinguish a healthy telemetry pipeline from a silent one. A bounded
span-metrics connector derives request/error/duration series from the same spans
already sent to Tempo. The early worker bootstrap also allows `pg` to emit its
native operation metrics before Prisma loads. Grafana's Explore is the better
tool for anything past the overview.

```powershell
docker compose up -d          # the whole stack, including Postgres
docker compose logs -f otel-collector
```

`HABITAT_GRAFANA_PASSWORD` is required — compose refuses to start without it.
`HABITAT_GRAFANA_PORT` defaults to 3009, because 3000 belongs to the web app and
3001 is often already relayed to WSL on a Docker Desktop host.

### The agent is a separate decision

The agent runs on the game host, so exporting from it means reaching the
collector across the private network — which would mean publishing the
collector's 4318 on the private interface instead of loopback. That is a real
change to the network posture, so it is opt-in and separate: set
`HABITAT_OTEL_EXPORTER_OTLP_ENDPOINT` in the *agent's own* environment on
MartServ102, and change the collector's port publication deliberately. Left
alone, the agent emits nothing and opens no outbound connection.

### Swapping the backend

Point the exporters in `ops/observability/otel-collector.yaml` somewhere else.
No application code changes — that is the entire reason the services speak OTLP
to a collector rather than to a vendor SDK.
