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
- The browser endpoint requires an active Habitat session, accepts a bounded cursor, returns at most 50 events, and sends `private, no-store` cache headers.
- Only `sourceConfidence = 100` `ServerEvent` rows enter the live projection.
- Browser event IDs and Discord outbox dedupe keys make reconnect/replay harmless.
- The live ceremony is presentation only. Persisted trophies are unlocked exclusively through the achievement engine and verified identity ownership.

## Cinematic presentation and visual QA

- Legendary status composites a self-contained transparent vector antler-and-mountain constellation crest with orbit lines, star pulses, impact light, and an authenticated event banner. The vector is authored directly in the application so its star nodes, connecting lines, glow, and transparency remain precise at every viewport and pixel density.
- Boss kills raise a Hall reliquary and use the collectible renderer's authored, rotating 3D Bossbreaker model in the toast ceremony.
- Five-player gatherings add warm table light, practical glints, and a breathing foreground crowd. Portal startup uses expanding rings and a living core; only unexpected outages use the broken red core and stepped sputter.
- Effects remain static but legible under `prefers-reduced-motion`; mobile moves the verified-event banner into the clear sky, keeps the constellation within the Hall window, and pins the ceremony toast to safe left/right insets so neither the card nor its Three.js reliquary can drift off-screen.
- Localhost-only QA parameters are available for deterministic inspection: `livePreview=constellation|trophy-ceremony|hall-crowd`, `portalPreview=<world-slug>:ignite|sputter`, and `toastPreview=boss|legendary`. Preview UI is explicitly labeled and creates no Habitat event or persistence.

## Deployment

The loopback web build can be staged first: it discovers which `ServerEventType` enum values are installed and does not offer an unapplied event type as a Chronicle filter. To activate the complete pipeline, apply migration `20260814170000_add_habitat_live_layer`, run the idempotent database seed to install the Bossbreaker definition/reward, then deploy the worker and agent builds through their existing private service process. No new port or public service is introduced.
