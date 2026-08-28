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

Run `pnpm --filter @habitat/codex-sync sync:health` after any deployment that touched the codex, the art directories, or `apps/codex-sync`. The publisher runs from source and loads its code at service start, so it needs `Restart-Service CodexSyncPublisher` to pick up changes — and it fails safely, meaning a stale bundle on `N:\Martino_Codex` looks perfectly valid until something asks whether it is current.

Run `pnpm check:connections` after deployment. A successful audit confirms that the public callbacks, database, private agent, Steam, Discord application and guild, and configured club provider agree with the deployed environment without exposing their secrets.

## Update

After pulling a web change, deploy it. From an elevated PowerShell session:

```powershell
Set-Location "<repository>"
.\apps\web\scripts\deploy-web.ps1 -InstallRoot (Get-Location)
```

Each deploy runs the release audit first, then builds into its own
`apps\web\.next-<stamp>` directory while the current release keeps serving, then
points the service at the new directory and restarts it. The site is down for
one restart rather than for the whole build, and if the new release does not
answer `/chronicle` with a 200 the script puts the service back on the previous
directory and restarts again.

### The release audit

`apps\web\scripts\audit-release.ts` is read-only and runs before anything is
built. A failure stops the deploy with nothing built and the current release
still serving. Run it on its own at any time:

```powershell
pnpm --filter @habitat/web audit:release        # add --json for machine output
```

Six checks, each standing for a failure that actually reached production:

| Check | Blocks on |
| --- | --- |
| METADATA | a stored sheet that would fail its own schema, a key the next save would silently drop, or a lost art publication marker |
| NAMESPACES | a typed reference that resolves in the **wrong** pool — an event named through an arc field, and the reverse |
| ART PRIVACY | codex art under `public/`, or a resolver handing out a `/images/...` URL that bypasses the member gate |
| IMAGES | referenced art that is not on disk, an unreadable header, or declared dimensions that do not match the file |
| GEOGRAPHY | a place filed under a parent that does not exist, under itself, or in a cycle |
| GRAPH | a populated board with no way in, a scene nothing reaches, or choices that all land in one place and record nothing |

"Link now, fill later" is canon law, so a reference to something nobody has
written yet is **reported and never fails**. Only a reference that resolves in
the wrong namespace fails — that is a mistake, not a plan. An empty quest board
is likewise a note, not a failure.

Accepted defects live in the `waivers` map at the top of
`scripts/lib/release-audit.ts`, each with the reason it is not a blocker, and
are printed on every run. **The map is currently empty, and that is the state
to keep it in** — the only entry it ever held was Port Arcadia's artwork
mismatch, recalibrated on 2026-08-28.

A waiver is a defect somebody agreed to live with, and it does not travel: a
deploy honours the map, a **release cut honours none of it**. See "Cutting a
release" in [STORY_CODEX.md](STORY_CODEX.md) — the audit is the same code
either way, called with `honourWaivers` false.

`-SkipAudit` ships past a failure. It is for a hotfix whose whole point is to
repair the data the audit is complaining about; the deploy warns at the start
and again at the end when it is used.

Which directory the service reads is the `HABITAT_WEB_DIST_DIR` env value in
`HabitatWeb.xml`; `next.config.ts` reads the same variable. Nothing is renamed,
so a manual rollback is that one value plus `Restart-Service HabitatWeb`. Three
superseded releases are kept for exactly that; the active one and the one it
replaced are never pruned.

**Do not build into the directory the running service is reading.** That was
the previous instruction here, and it is the cause of the `ChunkLoadError` and
missing-module entries in `web-logs`: `next build` replaces chunk files under
the live process, so any request between the start of the build and the restart
can ask for a chunk that no longer exists. A build that failed halfway also
left no way back. If you must build by hand, stop the service first.

## Remove

```powershell
.\apps\web\scripts\uninstall-web.ps1 -InstallRoot "<repository>"
```
