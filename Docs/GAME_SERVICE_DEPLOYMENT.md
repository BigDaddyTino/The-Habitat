# Managed Game Services

Phase 12 controls only named Windows services. The Habitat agent never accepts a program, path, argument, or service name from a portal request.

## Before installation

Run these steps on MartServ102 from an elevated PowerShell session.

1. Keep each current start and update batch unchanged.
2. Copy `apps/agent/game-services.example.json` to the ignored local `apps/agent/game-services.json`.
3. Populate each game with its existing start and update batch paths, the corresponding working directories, and unique service names.
4. For 7 Days to Die, copy `apps/agent/service-templates/7-days-to-die-launch.cmd.example` into the server directory, name it something local such as `Habitat-7DaysToDie-Service.cmd`, and use that file as `startScript`. Its existing launcher detaches the game process, so it cannot be service-managed safely.

The installer creates ignored copies in `apps/agent/game-services/<key>/` and removes `pause` lines from those copies. Sensitive launch arguments remain local and are never committed.

The installer adds the corresponding `control` block to each matching entry in the ignored `agent.config.json`; do not copy service names or script paths into tracked files.

## Install

Build the agent first, then run:

```powershell
Set-Location "C:\The Habitat\apps\agent"
.\scripts\install-game-services.ps1 -InstallRoot (Get-Location)
Restart-Service HabitatAgent
```

The game and update services are installed with manual startup. This prevents all six games from unexpectedly starting at Windows boot.

## Operational behavior

- `start`, `stop`, and `restart` target the configured game service only.
- `update` first verifies that the configured game service is stopped, then starts its configured one-shot update service.
- A service operation is not proof that the game is reachable. Habitat monitoring remains the authority for live world state.
- Existing manual game instances must be stopped before the matching Habitat service is started; do not run both.

Review each service with a local start and stop before enabling portal controls. A game-specific RCON or native shutdown adapter can replace service stop behavior later where a verified graceful mechanism exists.
