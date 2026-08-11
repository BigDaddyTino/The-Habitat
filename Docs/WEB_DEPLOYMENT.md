# Habitat Web Deployment

`HabitatWeb` runs the production Next.js application as a native Windows service on MartServ101. It binds to `127.0.0.1:3000` only. The local `habitat-martserv101` Cloudflare Tunnel reaches that loopback endpoint at `https://habitat.martinobear.com`; the database, Habitat Agent, game ports, and management APIs remain private.

## Prerequisites

- Node.js 24 LTS is installed at `C:\Program Files\nodejs`.
- The repository root `.env` has the production database and Auth.js settings.
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

The installer copies the existing `HabitatWorker.exe` WinSW wrapper to the ignored local `HabitatWeb.exe` when needed, creates the ignored `HabitatWeb.xml` with the resolved repository working directory, configures automatic startup, and writes local service logs to `web-logs`.

## Verify

```powershell
Invoke-WebRequest -UseBasicParsing "http://127.0.0.1:3000/chronicle" |
  Select-Object StatusCode
```

Expected result: `200`. Also verify the Great Hall with a signed-out browser, then a permitted Discord member account, and confirm the page represents unavailable game telemetry as `UNKNOWN` rather than as live data.

For tunnel verification, confirm `Get-Service Cloudflared` reports `Running` with automatic startup and verify the public hostname from a resolver that is not using MartServDMC's temporary split-horizon override. The Cloudflare dashboard route must remain exactly `HTTP` to `127.0.0.1:3000` with no path restriction.

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
