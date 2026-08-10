# Managed Game Services

Phase 12 controls only named Windows services. The Habitat agent never accepts a program, path, argument, or service name from a portal request.

## Before installation

Run these steps on MartServ102 from an elevated PowerShell session.

1. Keep each current start and update batch unchanged as a known-good manual fallback.
2. Copy `apps/agent/game-services.example.json` to the ignored local `apps/agent/game-services.json`.
3. Set only `valheimPassword` in that local file.

The installer generates Habitat-owned non-interactive start and update scripts for all six games in `apps/agent/game-services/<key>/`. Their executable paths, working directories, Steam application IDs, and known launch flags come from the inspected dedicated-server commands. The Valheim password remains only in ignored local configuration and the generated local service XML.

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
