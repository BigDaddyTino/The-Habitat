# Habitat Web Deployment

`HabitatWeb` runs the production Next.js application as a native Windows service on MartServ101. It binds to `127.0.0.1:3000` only. The local `habitat-martserv101` Cloudflare Tunnel reaches that loopback endpoint at `https://habitat.martinobear.com`; the database, Habitat Agent, game ports, and management APIs remain private.

## Prerequisites

- Node.js 24 LTS is installed at `C:\Program Files\nodejs`.
- The repository root `.env` has the production database and Auth.js settings.
- `AUTH_URL` is set to `https://habitat.martinobear.com` so Discord OAuth, Steam OpenID, and application redirects retain the public origin behind Cloudflare Tunnel.
- `HABITAT_AVATAR_STORAGE_PATH` points at the persistent storage volume so a rebuild does not destroy member uploads. See [Operations](OPERATIONS.md).
- Dependencies are installed and `pnpm test`, `pnpm lint`, `pnpm typecheck`, and the production build succeed.
- `HabitatWorker.exe` is already present from the worker installation, or a WinSW executable has been placed at `<repository>\HabitatWeb.exe`.

## Build and Install

Stop a manually started `next start` process on port 3000 before installing the service. From an elevated PowerShell session:

```powershell
Set-Location "<repository>"
$env:Path = "C:\Program Files\nodejs;$env:Path"
& "C:\Program Files\nodejs\corepack.cmd" pnpm --filter @habitat/web build
.\apps\web\scripts\install-web.ps1 -InstallRoot (Get-Location)
Get-Service HabitatWeb
```

The installer copies the existing `HabitatWorker.exe` WinSW wrapper to the ignored local `HabitatWeb.exe` when needed, creates the ignored `HabitatWeb.xml` with the resolved repository working directory, configures automatic startup, and writes local service logs to `<repository>\web-logs`.

The template's `<logpath>` is deliberately absolute, built from `{{INSTALL_ROOT}}`. WinSW resolves a *relative* `logpath` against the service process's working directory, which is `C:\Windows\System32` for a LocalSystem service, so a relative value silently writes `HabitatWeb.out.log` and `HabitatWeb.err.log` into `C:\Windows\System32\web-logs` while only the wrapper log lands beside the executable. WinSW's `<sizeThreshold>` is in kilobytes, so the intended 10 MB is `10240`.

## Verify

```powershell
Invoke-WebRequest -UseBasicParsing "http://127.0.0.1:3000/chronicle" |
  Select-Object StatusCode
```

Expected result: `200`. Also verify the Great Hall with a signed-out browser, then a permitted Discord member account, and confirm the page represents unavailable game telemetry as `UNKNOWN` rather than as live data.

For tunnel verification, confirm `Get-Service Cloudflared` reports `Running` with automatic startup and verify `https://habitat.martinobear.com/` from both the LAN and a public resolver. MartServDMC maintains short-TTL local A records matching the current authoritative Cloudflare answers; recheck them if Cloudflare changes its edge response. The Cloudflare dashboard route must remain exactly `HTTP` to `127.0.0.1:3000` with no path restriction.

Run `pnpm check:connections` after deployment. A successful audit confirms that the public callbacks, database, private agent, Steam, Discord application and guild, and configured club provider agree with the deployed environment without exposing their secrets.

## Update

After pulling a web change, rebuild first, then restart the service:

```powershell
Set-Location "<repository>"
& "C:\Program Files\nodejs\corepack.cmd" pnpm --filter @habitat/web build
Restart-Service HabitatWeb
```

## Remove

```powershell
.\apps\web\scripts\uninstall-web.ps1 -InstallRoot "<repository>"
```
