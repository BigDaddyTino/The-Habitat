# The Habitat Agent Guide

## Product rules

- Treat `SLEEPING` as intentional and visually distinct from `DOWN_UNEXPECTEDLY`.
- Never fabricate server data or claim that seeded data is live.
- Keep server control explicit, allow-listed, authenticated, and audited. No arbitrary shell, RCON, or file-path endpoints.
- Do not expose the agent, database, game ports, or game-management APIs publicly.
- Preserve the private, rugged, premium clubhouse visual direction. Mobile is a first-class target.

## Working rules

- Keep TypeScript strict and package boundaries clear.
- Put cross-package domain types in `packages/shared`.
- Keep game-specific behavior in isolated adapters when that phase begins.
- Update `docs/BUILD_STATUS.md` as phases move forward.
- Do not add real credentials or infrastructure addresses to Git.
