# Game Adapters and Historical Evidence

Every adapter emits a normalized status shape and an explicit capability boundary. A missing capability is absent in the UI and API; it is never guessed from unrelated data.

When an adapter returns a current named player snapshot, the worker persists that snapshot as live character presence. World dossiers show those character names only when they match the current agent observation; a numeric population without a supplied player list remains explicitly count-only.

## Current adapter coverage

| Game | Live observation | Roster/history sources | Important limit |
| --- | --- | --- | --- |
| Valheim | Process telemetry and GameDig when public query is configured | HabitatCore Chronicle plus timestamp-paired Steam connect/disconnect logs | Crossplay query player counts are treated as unsupported unless another verified source exists |
| Palworld | Official LAN-only REST API with agent-local password | REST player observations and optional game-data snapshot for offline actors | REST/admin endpoints are never public; presence tracking needs real join/leave baseline validation |
| Enshrouded | Process telemetry and verified GameDig query | Accepted Steam sessions; persona reconciliation can replace `Steam ####` display fallbacks | A Steam name is only a display improvement, not ownership proof by itself |
| Project Zomboid | Process telemetry and verified GameDig query | Named Steam connection logs | Rich death/event data remains unavailable pending a reliable source |
| 7 Days to Die | Process telemetry and verified GameDig query | Persistent player XML and verified Steam-backed identity evidence | Telnet/RCON is not exposed to the portal |
| RuneScape: Dragonwilds | Process telemetry and lifecycle/save-log heartbeats | Dedicated-server session logs when player account/name join/leave lines exist | Retained deployed logs do not yet contain player-session records; player count remains unavailable |

## History ingestion

History sources are configured only in ignored `apps/agent/agent.config.json`. The agent accepts inspected absolute local Windows paths, applies per-source byte limits, scans bounded file counts, normalizes records, and never returns raw log lines to the worker or browser.

Supported source kinds are:

- `VALHEIM_LOG`
- `STEAM_PLATFORM_LOG`
- `HABITAT_SESSION_JSONL`
- `HABITAT_CHRONICLE_LOG`
- `PROJECT_ZOMBOID_LOG`
- `ENSHROUDED_LOG`
- `SEVEN_DAYS_PLAYERS_XML`
- `DRAGONWILDS_LOG`

The worker rescans configured sources on the configured interval, deduplicates normalized evidence, and creates retained roster/Chronicle data. Only measured, timestamp-paired sessions with verified ownership qualify as playtime for XP. Other evidence can remain visible, earn history-specific achievements where explicitly defined, and become attributable once ownership is proven.

## Service control

Control capabilities are independent from observations. The agent accepts only `start`, `stop`, `restart`, and `update` for server keys with a configured named Windows service and update service. The admin portal queues a typed-confirmed, audited command; the worker dispatches it; the agent verifies service/process state. No adapter accepts a browser-provided process, path, argument, service name, or arbitrary command.

## Future collectors

Telemetry-only game-specific event collectors and optional gameplay mods are not deployed. Any future collector must remain server-side, authenticate to the private agent boundary, preserve per-game validation/backups, and avoid changing game balance or requiring player-side installation unless explicitly approved.
