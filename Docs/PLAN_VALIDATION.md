# Master Plan Validation

Validated: 2026-08-11

The master plan remains the product direction, but it is a historical planning document—not a live implementation checklist. [Build Status](BUILD_STATUS.md) and the focused operational documents are the source of truth for the current app.

## Confirmed architecture decisions

- Node.js 24 LTS, strict TypeScript, pnpm, Next.js App Router, PostgreSQL 18, Prisma, a separate worker, and a Windows-native agent are the implemented baseline.
- MartServ101 owns the web, worker, database, backup, and public-tunnel boundary; MartServ102 owns game processes, local observations, and private agent/service control.
- The portal never fabricates unavailable telemetry, exposes game-management interfaces publicly, or accepts arbitrary shell/RCON/file-path input.
- SLEEPING and DOWN_UNEXPECTEDLY remain distinct states, and adapter capability maps continue to prevent unsupported metrics from being shown as facts.

## Current implementation additions

The live implementation now extends the original plan with Steam OpenID ownership proof, idempotent legacy-history reconciliation, provisional unclaimed identity visibility, 1–100 progression, deterministic weekly quests, reward inventories, Rive/Three.js ceremonies, a trophy cabinet, server dossiers, compact cached news/patch notes, and the time-aware cinematic Great Hall.

## Remaining validation work

- Phase 13 hardening remains intentionally pending.
- Verify new telemetry/history collectors with live player activity before relying on their richer game-specific details.
- Provider-authenticated live social presence and gameplay-changing or client-required mods are not deployed.
- Dragonwilds player-session evidence awaits real dedicated-server session lines in retained logs.
