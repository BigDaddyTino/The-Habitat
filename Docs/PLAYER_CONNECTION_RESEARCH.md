# Player connection research

Researched 2026-10-31. Scope: the six managed worlds and a shared player-facing hostname. The owner confirmed Steam on PC for all players and does not want players to install any additional software. Connection testing and website instructions target the existing browser and Steam. Consoles and Game Pass are outside this rollout.

## Finding

A shared hostname can remove changing public IP addresses from player instructions. It cannot make every game's connection screen omit the port. That behavior belongs to the game client. The installed Valheim connection code supports a hostname with an implicit port; some other games have separate port fields, and others document address-plus-port input.

No universal bare-hostname solution has been verified for all six games. DNS SRV records are not a general fix: clients must explicitly implement the relevant SRV lookup. Do not invent service records or claim support based on another game's behavior. See [RFC 2782 applicability and client lookup rules](https://www.rfc-editor.org/rfc/rfc2782).

Examples below use `play.example.com`. Production hostnames, IP addresses, and DNS credentials belong in untracked deployment configuration, not Git.

## Recommended alternative: website connection controls

Use the existing Habitat website as the place players return to. Each world supplies its own connection action. A server-side DNS lookup supplies the current IPv4 address, so neither the player nor the game needs to resolve a hostname or remember a port. Alternatively, a fixed HTTPS public-address lookup works after verifying the web and game hosts share the same public IPv4 egress. This removes the unresolved hostname-input question from the critical path. The public hostname still needs its dynamic updater, and existing player network access must work.

The flow is: open Habitat, choose a world, then either open its Steam connection link or copy the correct connection fields and launch the game. A browser may ask for confirmation before opening Steam; the game may still ask for a character, account, or server password. Do not label launch-only actions as automatic server joining.

### Steam connection-link evidence

CubeCoders' maintained AMP templates provide concrete connection-link formats, rather than assuming that every Steam game supports the same link. Installed game code independently supports several of these paths. This is source-backed integration evidence, not a successful join from an outside client.

| Game | Website action to implement and test | Evidence |
| --- | --- | --- |
| Valheim | `steam://connect/<resolved-ip>:2457`, with in-game/manual fallback on 2456 | [AMP template](https://github.com/CubeCoders/AMPTemplates/blob/main/valheim.kvp) uses its Steam query port; [port definitions](https://github.com/CubeCoders/AMPTemplates/blob/main/valheimports.json) distinguish 2457 query from 2456 gameplay. Installed `FejdStartup.HandleStartupJoin` processes `+connect`; `ZSteamMatchmaking` handles Steam server-change requests. |
| Project Zomboid | `steam://connect/<resolved-ip>:16261` | [AMP template](https://github.com/CubeCoders/AMPTemplates/blob/main/project-zomboid.kvp) supplies this connection-link format. Installed `MainScreen.lua` consumes an address-and-port launch argument and opens the connection popup. User/account entry can still be required. |
| 7 Days to Die | `steam://connect/<resolved-ip>:26900` | [AMP template](https://github.com/CubeCoders/AMPTemplates/blob/main/seven-days-to-die.kvp) supplies a Steam connection endpoint. Installed `Platform.Steam.JoinSessionGameInviteListener` registers and processes `GameServerChangeRequested_t`. |
| Enshrouded | `steam://connect/<resolved-ip>:15637`, with Steam Favorites/server-name search fallback | [AMP template](https://github.com/CubeCoders/AMPTemplates/blob/main/enshrouded.kvp) explicitly uses the query port in its Steam link. The local game's JSON confirms queryPort=15637. |
| Palworld | Copy `<resolved-ip>:8211` and open the game with `steam://run/1623730`; player pastes into direct connect | [Pocketpair's guide](https://docs.palworldgame.com/getting-started/connect-server/) documents address-and-port input. The [AMP template](https://github.com/CubeCoders/AMPTemplates/blob/main/palworld.kvp) has no endpoint URI; absence is not proof of impossibility, but there is insufficient evidence to advertise automatic server joining. |
| RuneScape: Dragonwilds | Copy current IP and port 7777 as individually copyable fields and open the game with `steam://run/1374490`; show Direct IP instructions | [Jagex patch notes](https://dragonwilds.runescape.com/news/latest-hotfixes-0425) confirm Direct IP. The [AMP template](https://github.com/CubeCoders/AMPTemplates/blob/main/runescape-dragonwilds.kvp) has no endpoint URI. The exact current client field arrangement still needs visual acceptance testing; separate IP/port copy controls avoid assuming a combined field. |

[Steamworks documents Steam launch URLs](https://partner.steamgames.com/doc/api/ISteamApps#GetLaunchCommandLine) and [server-change callbacks](https://partner.steamgames.com/doc/api/ISteamFriends#GameServerChangeRequested_t). Support must be evaluated per game. A successful launch is not a successful server join.

For a reliable browser experience, render separate `Copy connection details` and `Open game` controls for the two fallback games. Combining an asynchronous clipboard operation and an external-app launch into one button can lose the browser's user activation; any combined action needs browser testing. All six worlds should retain a copy/manual fallback.

The correct Dragonwilds player application ID is **1374490**, confirmed by its [Steam store page](https://store.steampowered.com/app/1374490/). The existing game-news map contains 3270700, which is [Forge Lord](https://store.steampowered.com/app/3270700/); do not reuse that value for launch buttons. This separate existing metadata issue was recorded, not silently corrected during research.

### Why favorites alone are insufficient

Steamworks' [AddFavoriteGame API](https://partner.steamgames.com/doc/api/ISteamMatchmaking#AddFavoriteGame) takes a numeric IPv4 address plus connection and query ports. That does not establish every current Steam UI implementation, but it is enough to reject a promise that a previously saved favorite will automatically track DNS changes. Resolve the address afresh for website actions, and keep favorites as an optional convenience.

### Other alternatives considered

- **Server-name search:** Supported by several games' browsers, including Palworld community servers and Dragonwilds world search. This avoids entering an address, provided the server is running, registered, discoverable, and the correct filters/name are used. Re-registration after an address change can still be necessary. Use each game's real advertised name, not the website's descriptive world title.
- **Private overlay network:** [Tailscale assigns stable device addresses](https://tailscale.com/docs/concepts/ip-and-dns-addresses) and [documents private game sharing](https://tailscale.com/docs/use-cases/personal-or-at-home-use/share-private-game-server), but requires players to install and sign into its client. This does not meet the owner's no-additional-player-software constraint.
- **Server-side game tunnel:** [Playit](https://playit.gg/) runs an agent only on the host, with no player installation, and supports TCP/UDP game transport. It is a possible alternative to direct public routing if separately chosen. It adds a transport provider and can require different external ports, latency testing, and game-specific server-list validation. It does not by itself make all games accept a bare hostname and would change the current private-access policy.
- **Custom launcher or client mods:** Additional player installation and ongoing maintenance; outside the owner's requirements.

### Implementation boundaries

Read the shared hostname and external game/query ports from trusted deployment configuration. Resolve only that configured hostname; never accept an arbitrary DNS name or endpoint from a request. Use bounded lookup timeouts and a short cache with an explicit freshness limit. Do not label stale or failed lookups as current connection details. Generate only allow-listed Steam URI formats and verified player app IDs; never interpolate credentials or user-controlled launch arguments.

Keep player connection details behind existing member access. A separate copy action can provide the current numeric address for clients that reject DNS names. Keep game and query ports distinct, especially for Valheim and Enshrouded. This feature does not need any public agent, database, RCON, or management API.

Use the existing website hostname for browser access. The game hostname's DNS-only A record and the website's proxied tunnel route have different purposes; do not accidentally replace the website route or point the game hostname at the HTTP tunnel.

## Per-game findings

| Game | Locally observed configuration | Client behavior and proposed instructions | Evidence / remaining verification |
| --- | --- | --- | --- |
| Valheim | Managed launch uses game port 2456; running process binds 2456 and 2457; Steam backend | Join Game > Add server: `play.example.com`. The explicit fallback is `play.example.com:2456`. | Installed `ServerListGui` accepts a host, `ServerJoinDataDedicated` defaults an omitted port to 2456, and the join path resolves DNS. Code verified; an outside-client join with the eventual hostname is still required. |
| Project Zomboid | Active server configuration has DefaultPort=16261 and UDPPort=16262 | Put the hostname in the IP field and keep the separate Port field at 16261. Save a favorite after testing. | Installed `media/lua/client/OptionScreens/ServerList.lua` initializes and resets Port to 16261 and retains the entered address in the favorite. This inspection did not prove end-to-end hostname resolution; verify with the actual client. 16262 is an additional transport port, not the Port-field value. |
| 7 Days to Die | ServerPort=26900 | Connect to IP: enter `play.example.com`; keep the separate Port field at 26900. A full `play.example.com:26900` paste is also recognized by the inspected UI code. | Installed `XUiC_ServerBrowserDirectConnect` resolves hostnames with `Dns.GetHostEntry`; `GamePrefs` initializes the connection port from `Constants.cDefaultPort`, which is 26900. A previous connection may have changed the saved port. Code verified; outside-client join still required. |
| Palworld | PublicPort=8211; managed launch does not override the default game listen port | Test `play.example.com:8211` in direct connect. The alternative is finding the configured server in Community Servers. | [Official connection guide](https://docs.palworldgame.com/getting-started/connect-server/) documents IP and port together, not bare-hostname input. Hostname acceptance still needs a real client test. PublicPort advertises the port; it does not itself set the listener. Do not publish the agent's REST port as a player connection port. |
| Enshrouded | Current server JSON has queryPort=15637 | Use the configured server name in the game browser, or test `play.example.com:15637` in Steam > View > Game Servers > Favorites > Add. | [Official favorite instructions](https://enshrouded.zendesk.com/hc/en-us/articles/16454683440541-Favorite-Server-via-IP) require IP plus query port. Hostname acceptance and whether Steam retains a hostname after resolving it must be checked. Do not promise a saved Steam favorite survives an IP change. The agent configuration's query value differs from the live game's JSON; use the game's JSON for this research and investigate monitoring separately. |
| RuneScape: Dragonwilds | Running process and log confirm game port 7777; a separate world-settings beacon listens on 8888 | Test the PC client's Direct IP Connection tab with the hostname and game port 7777; separately test whether omitting the port is accepted. World-name search remains a documented alternative. | [April 30 hotfix notes](https://dragonwilds.runescape.com/news/latest-hotfixes-0425) explicitly add Direct IP Connection. The older [March hosting guide](https://dragonwilds.runescape.com/news/how-to-dedicated-servers) documents world-name search and default UDP port 7777. Neither proves hostname acceptance, omitted-port behavior, or every platform's UI. |

These observations are configuration/code evidence, not proof that all worlds are currently running or reachable from the Internet. No game was started, stopped, restarted, renamed, or reconfigured during this research.

## DNS proposal

The requested domain uses Cloudflare nameservers. The requested player subdomain initially returned NXDOMAIN during research. It was subsequently activated and publicly verified during the implementation described below.

Use one DNS-only A record for the shared player hostname and an updater on an always-on host or compatible router. The updater should detect public IPv4 changes, validate the address, update only the intended record, and retain its DNS token outside Git and application responses. A short TTL reduces stale-cache time but does not guarantee uninterrupted sessions. Do not add an AAAA record without working IPv6 routing and client verification.

Cloudflare documents [automatic updates through its DNS API](https://developers.cloudflare.com/dns/manage-dns-records/how-to/managing-dynamic-ip-addresses/). Its [ordinary proxy](https://developers.cloudflare.com/dns/proxy-status/) is for supported HTTP/HTTPS traffic; game records need DNS-only behavior unless a separately supported game transport service is deliberately configured. The existing website tunnel is not a generic game-server tunnel.

DNS does not create router mappings, grant VPN membership, or verify external connectivity. Keep the documented private-access boundary until the owner explicitly chooses a different player-access policy. The repository currently says game ports must remain private; research alone does not authorize changing that rule. Agent, database, RCON, REST administration, and other management access remain private.

## Website proposal after validation

Add a member-facing "How to join" block to each existing world page, near current state. Keep the hostname in deployment configuration and validated per-game connection details separate from telemetry/query settings. The website's display names are not necessarily the games' advertised names.

- Show the simplest verified entry for the selected game, with a copy button.
- Show a separate port only when the game's UI needs one; include the explicit address-and-port fallback where it helps.
- Supply short steps for direct connect, community browsing, or Steam favorites, matching the player's platform.
- Offer a launch/join button only after that specific game's link handler has been tested. Steam installation alone does not prove `steam://connect` support for every title.
- If a client accepts only numeric IPs, resolve the configured hostname on the server and provide a current, timestamped copy value; do not label this as in-game hostname support or claim DNS changes are instantaneous.
- Preserve `SLEEPING`, `DOWN_UNEXPECTEDLY`, and `UNKNOWN` distinctions. Having connection instructions does not mean a world is running.
- Keep credentials out of copied addresses and links. Do not display management endpoints.

## Acceptance checks before publishing player instructions

1. Configure the DNS record and updater under the chosen player-access policy; verify the record through an outside resolver.
2. For each game, test the proposed entry from a real outside-network client on every supported platform. Record hostname support, the input format, omitted-port behavior, and successful joining separately.
3. Validate the updater and re-resolution behavior. Check saved favorites separately from fresh manual connections; some clients retain the resolved IP.
4. Publish only verified per-game instructions. If bare-hostname input is unsupported, use a copyable complete entry or a tested server-browser route.

## Implementation outcome - 2026-10-31

The browser-and-Steam alternative is deployed: source-backed Steam connection links for four titles, launch-and-copy controls for the other two, and manual steps for all six. It initially used a public-address lookup after independently confirming shared egress. After the owner supplied a scoped token, the shared DNS-only A record was created, publicly verified, and connected to the website's DNS-resolution mode. Member authorization, current connection fields, link targets, clipboard fallback, expired/failed responses, distinct server states, and desktop/mobile layout passed website validation. This is not a claim of successful external gameplay.

The DNS updater is installed under SYSTEM with startup and indefinite five-minute triggers; its first scheduled-task execution succeeded. The player record has a 60-second TTL, and all seven pre-existing zone records remain unchanged. Outside-client acceptance testing remains pending. Hostname-only input in every game is not a prerequisite for the deployed website flow; ports and client-specific behavior still apply. See [deployment notes](PLAYER_CONNECTION_DEPLOYMENT.md).
