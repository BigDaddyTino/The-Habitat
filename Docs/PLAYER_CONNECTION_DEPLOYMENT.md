# Player connection controls

The world cards on the home page, Games, and Worlds link directly to a prominent join panel. Every panel has a Steam launch path and separate copyable connection fields. Four games also expose Steam server-join links; Palworld and Dragonwilds launch the game and explain manual joining. Game passwords are never embedded in links.

In DNS mode, the primary Full address is the configured hostname plus that game's port; Server address is the hostname alone for games with separate fields. The current numeric IP and IP-plus-port are under a collapsed IP fallback for clients that reject hostnames. Steam join links continue to receive a freshly resolved numeric target. In public-IP mode the primary fields remain numeric. This display correction preserves stable copy values across WAN address changes; it does not establish hostname acceptance in every game client.

Connection details are returned only to active USER/ADMIN sessions. Public pages show a sign-in prompt. Responses use `private, no-store`; addresses expire after at most 30 seconds and refresh every 20 seconds while the page is visible. Failed/expired lookups do not leave usable stale links. Sleeping, starting, stopping, updating, and unexpectedly stopped worlds disable the server-join link; manual details remain available with the real state notice.

## Configuration

Set these in the web host's ignored root `.env`:

```ini
HABITAT_PLAYER_CONNECTIONS_ENABLED=true
HABITAT_PLAYER_ADDRESS_SOURCE=dns
HABITAT_PLAYER_HOSTNAME=play.example.com
```

Alternatively, set `HABITAT_PLAYER_ADDRESS_SOURCE=public-ip` only after independently confirming the web host and all six game servers share the same public IPv4 egress. This mode requests the web host's current address from the fixed HTTPS ipify endpoint and works without Cloudflare credentials or a DNS record. It is unsuitable if the game host moves to another network or the web server uses a different VPN/proxy egress.

Optional `HABITAT_PLAYER_<GAME>_PORT` values override player-facing ports. Supported game keys are `VALHEIM`, `PALWORLD`, `ENSHROUDED`, `PROJECT_ZOMBOID`, `SEVEN_DAYS_TO_DIE`, and `DRAGONWILDS`. Valheim's Steam query port is separate: `HABITAT_PLAYER_VALHEIM_STEAM_PORT=2457` by default. Other Steam-capable games use their configured player port unless `HABITAT_PLAYER_<GAME>_STEAM_PORT` is set. Enshrouded's displayed port is its query/favorite port, 15637. Palworld uses 8211, never its management REST port.

No configuration here opens router/firewall ports or starts a sleeping server. It supplies player connection details over the existing website. Network reachability remains separately configured and tested.

## Current rollout - 2026-10-31

The production website now uses `dns` mode with the shared player hostname in its ignored environment file. The owned DNS-only A record has a 60-second TTL and matches the independently observed WAN address through Cloudflare, Google, and the web host's resolver. All seven other records in the zone were compared before and after and remain unchanged. The owner supplied the token through a masked local prompt; the token and zone configuration remain outside Git in an Administrators/SYSTEM-only directory on the game host.

The `Habitat Player DNS` Windows task runs under SYSTEM at startup and every five minutes indefinitely. It has a two-minute execution limit, ignores overlapping runs, starts missed runs when available, and retries failures up to three times at one-minute intervals. Its action invokes the installed status runner in `C:\ProgramData\The Habitat\player-dns`. Its initial SYSTEM execution and the following automatic five-minute execution both succeeded and reported the record current. `last-run.json` records the latest outcome; `last-success.json` preserves the most recent successful check. Credentials never appear in task arguments or these status files.

The production checkout passed all 842 workspace tests, typecheck, lint, the 7-check release audit, isolated build, and web service health for the website feature. DNS activation changed only private runtime configuration and restarted the same healthy release. Live browser validation was repeated in DNS mode for all six games' member endpoints and launch targets, signed-out rejection, clipboard success and selection fallback, desktop and 390px/320px mobile layouts. VIEWER/inactive rejection was also verified during the initial rollout. Browser interception tested expiry, lookup failure, access revocation, sleeping, and unexpected failure without changing game state. Temporary QA membership and sessions were deleted. Ten offline updater scenarios passed with all network calls mocked. A successful outside-network game join has not been verified.

The broader `pnpm check:connections` audit after DNS activation passed 10 of 11 checks. Investigation confirmed that Dragonwilds' previously imported history remains in the database, while the two retained logs opened during the morning restarts contain no player sessions. The audit now states those facts separately and retains the empty-source finding pending a real join/leave verification on the current game version. DNS and the member connection endpoint pass. See [Dragonwilds history investigation](DRAGONWILDS_HISTORY_INVESTIGATION.md).

## Optional Cloudflare updater

`scripts/update-player-dns.ps1` updates exactly one DNS-only A record. It creates an absent record or updates a record bearing the exact comment `Managed by Habitat player DDNS`. It refuses another record type, proxied records, multiple records, or an unowned record. Existing website/tunnel routes must not be repurposed.

Store a scoped Cloudflare DNS Edit token in a private text file outside Git. Restrict both that file and its parent directory to Administrators and SYSTEM. Create a private JSON configuration beside it:

```json
{
  "zoneId": "REPLACE_WITH_ZONE_ID",
  "hostname": "play.example.com",
  "tokenFile": "C:\\ProgramData\\The Habitat\\player-dns\\token.txt"
}
```

Run on the game host or another host with the same verified public egress:

```powershell
.\scripts\update-player-dns.ps1 -ConfigPath 'C:\ProgramData\The Habitat\player-dns\config.json' -CheckOnly
.\scripts\update-player-dns.ps1 -ConfigPath 'C:\ProgramData\The Habitat\player-dns\config.json'
```

For installation, copy `scripts/update-player-dns.ps1` and `scripts/invoke-player-dns.ps1` into the protected configuration directory. The status runner expects `update-player-dns.ps1` and `config.json` beside it. After a successful first update, register a Windows scheduled task under SYSTEM to run that fixed status runner at startup and every five minutes with `powershell.exe -NoProfile -NonInteractive -WindowStyle Hidden -File ...`. Omit repetition duration so it repeats indefinitely. Keep tokens out of task arguments. Monitor task exit codes and the status JSON files; a failed update is not success. Validate the hostname using an external DNS resolver, then switch the website's address source to `dns` and restart the web service with a health check and configuration rollback available. A source-code deployment still uses the normal isolated-release workflow.

To diagnose the installed task, inspect `Get-ScheduledTaskInfo -TaskName 'Habitat Player DNS'` and the protected `last-run.json`. Run the updater with `-CheckOnly` to verify credentials, record ownership, and public-address detection without modifying DNS. If the website must return temporarily to direct address detection, restore `HABITAT_PLAYER_ADDRESS_SOURCE=public-ip` only while web/game egress still matches, then restart the web service and verify member endpoints. Disabling the task stops DNS updates; it does not remove the DNS record.

## Validation and rollout

Run the address-resolution regression tests, strict typecheck, lint, and the normal production release audit/build. Verify both unauthorized API rejection and active member access, all six connection/launch targets, clipboard success and manual-selection fallback, stale/failing lookups, sleeping versus unexpectedly stopped notices, and desktop/mobile layout. A successful Steam launch does not prove joining or router reachability; final gameplay checks must happen from an outside Steam PC.

Disable the feature with `HABITAT_PLAYER_CONNECTIONS_ENABLED=false` and restart the web service. Use the existing isolated-release deployment/rollback script on the production checkout; do not build into the running release directory.

## 2026-10-31 — Hostname-first player connection display

Corrected the join panel to show the configured DNS hostname and game port as the primary copy address, with the hostname alone in the separate Server address field. Numeric IP details are now an expandable fallback; Steam links still use the current resolved address. The DNS record/updater were already healthy. Nine address regression tests, web typecheck, targeted lint, all seven release-audit gates, and the isolated build/health check passed. Live member browser checks verified all six games, clipboard values, fallback fields, and 390px/320px mobile layouts. No game services or network rules changed. Deployment: `.next-20261031-115505`; prior release retained for rollback.
