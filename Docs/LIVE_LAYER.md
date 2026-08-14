# Habitat Live Layer

The Live Layer is a presentation and notification projection of the existing verified event pipeline. It does not create a second source of truth and it never upgrades uncertain telemetry into a fact.

```text
private agent / allow-listed game history
                    |
                    v
       ServerEvent (confidence 100)
          |       |        |
          |       |        +-- progression / weekly quests
          |       +----------- achievements / rewards
          +------------------- Chronicle
                    |
                    v
       authenticated live-event projection
          |          |             |
          |          |             +-- Discord outbox
          |          +---------------- cinematic 3D ceremony
          +--------------------------- Great Hall reaction
```

## Allow-listed reactions

| Verified source event | Great Hall reaction | Ceremony |
| --- | --- | --- |
| `SERVER_STARTED` | Matching portal ignites | World-awake toast |
| Legendary `ACHIEVEMENT_EARNED` | Constellation forms | Persisted achievement and rewards |
| `BOSS_KILLED` | Trophy rises | Bossbreaker trophy ceremony |
| `WORLD_GATHERING` | Hall crowd and warmth appear | Five-player gathering toast |
| `SERVER_CRASHED` | Matching portal sputters | Unexpected-stop toast |

`SLEEPING` is deliberately absent from the crash reaction. An intentional rest remains a quiet, cool portal state; only a confidence-100 `SERVER_CRASHED` event or persisted `DOWN_UNEXPECTEDLY` runtime state receives the sputter treatment.

## Delivery and replay

- The worker creates `WORLD_GATHERING` only when a known player-count baseline crosses from below five to five or more. A missing count is not treated as a crossing.
- A crossing is an edge, and a group sitting on the boundary crosses it repeatedly. The gathering dedupe key is bucketed by a six-hour cooldown, so the repeat crossings resolve to the same `ServerEvent` row and the outbox refuses a second announcement. The bucket comes from the timestamp, not worker memory, so it survives restarts.
- A history import recovers every past boss kill at once. Only a kill still fresh at import time is announced; older ones enter the Chronicle silently rather than arriving in the announcement channel as breaking news.
- The browser endpoint requires an active Habitat session, accepts a bounded cursor, returns at most 50 events, is narrowed to the five projectable event types, and sends `private, no-store` cache headers.
- Only `sourceConfidence = 100` `ServerEvent` rows enter the live projection.
- Each event is flagged with whether the requesting viewer is its verified actor. The Hall still reacts to your own legend, but the toast is left to your progression feed so the same award is not staged twice.
- Browser event IDs and Discord outbox dedupe keys make reconnect/replay harmless.
- The live ceremony is presentation only. Persisted trophies are unlocked exclusively through the achievement engine and verified identity ownership.

## Cinematic presentation and visual QA

- Legendary status composites a self-contained transparent vector antler-and-mountain constellation crest with orbit lines, star pulses, impact light, and an authenticated event banner. The vector is authored directly in the application so its star nodes, connecting lines, glow, and transparency remain precise at every viewport and pixel density.
- Boss kills raise a Hall reliquary and use the collectible renderer's authored, rotating 3D Bossbreaker model in the toast ceremony.
- Five-player gatherings add warm table light, practical glints, and a breathing foreground crowd. Portal startup uses expanding rings and a living core; only unexpected outages use the broken red core and stepped sputter.
- Effects remain static but legible under `prefers-reduced-motion`; mobile moves the verified-event banner into the clear sky, keeps the constellation within the Hall window, and pins the ceremony toast to safe left/right insets so neither the card nor its Three.js reliquary can drift off-screen.
- Every overlay is absent from the box tree until its reaction activates, rather than transparent. These layers carry dozens of infinite decorative loops, and a hidden-but-displayed layer keeps all of them ticking on a page showing nothing. A sleeping world is the one exception that stays suppressed while reacting — except for a verified ignition, because a world that just woke is still rendered as sleeping until the next server render.
- The constellation crest is served unoptimized. Next's image optimizer rejects SVG unless `images.dangerouslyAllowSVG` is set, which would relax the policy for every image; the crest is a local authored vector with nothing to optimize.
- The Bossbreaker Reliquary has no relief tile of its own. The trophy atlas is a full 4x2 of authored sprites, and borrowing another trophy's index would present its artwork as the reliquary's, so the reliquary shows its bespoke 3D model and a plain trophy emblem until the atlas gains a ninth sprite.
- Localhost-only QA parameters are available for deterministic inspection: `livePreview=constellation|trophy-ceremony|hall-crowd`, `portalPreview=<world-slug>:ignite|sputter`, and `toastPreview=boss|legendary`. Preview UI is explicitly labeled and creates no Habitat event or persistence.

## Deployment

**Status:** Deployed on 2026-08-14. Both Live Layer migrations are recorded as finished, the Bossbreaker definition and Reliquary reward are seeded, HabitatWeb and HabitatWorker are running on MartServ101, and the authenticated HabitatAgent on MartServ102 reports the current Git build. The web listener remains loopback-only; public access continues through the existing tunnel.

The loopback web build can be staged first: it discovers which `ServerEventType` enum values are installed and neither offers an unapplied event type as a Chronicle filter nor names one in the live-feed query. The worker has no such tolerance, so the order below is a requirement, not a preference — a worker that reaches a five-player crossing before its enum exists throws inside the monitoring transaction and rolls back that whole cycle's runtime state, chronicle, presence and metrics.

1. Apply migrations `20260814170000_add_habitat_live_layer` and `20260814193000_index_server_event_arrival`. The second adds the arrival index the live feed polls against; without it the feed falls back to a sequential scan and a sort on every poll.
2. Run the idempotent database seed to install the Bossbreaker definition and reward.
3. Deploy the worker and agent builds through their existing private service process.

No new port or public service is introduced.
