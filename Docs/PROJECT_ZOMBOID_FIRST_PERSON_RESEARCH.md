# Project Zomboid first-person research — 2026-10-31

The owner wants first-person play on the fresh Build 42 world, with no separate installation for each player. Research found no verified current option that satisfies both requirements. No camera mod, Java loader, or performance patch was installed during this investigation.

## What can run only on the server?

The dedicated server simulates the world. The first-person renderer runs on each player's PC. A server can request Workshop content downloads, but that is different from installing and activating a native/Java loader in the player's game. The current full 3D options require that local setup.

| Option | Current author evidence | Fit for this server |
| --- | --- | --- |
| Project Viewpoint, Workshop `3809306528`, mod `Viewpoint` | Multiplayer supported; depends on ZombieBuddy. Latest published change note inspected: alpha 0.1.6.1, October 15, with AMD and memory-leak fixes. | A viable candidate for a small client trial, but not server-only. Players can toggle perspectives; installing it does not establish enforced first-person-only play. |
| PZ3D, Workshop `3807334881`, mod `pz3d` | Author site advertises 0.9.8 dated October 30. Dedicated-server guide targets 42.21.0, requires ZombieBuddy 2.3.4+, and explicitly says players should install the same release locally. It documents server camera permissions. | Also requires client setup. The published server guide is for Linux; it is not a tested Windows service procedure for this host. Camera restrictions need validation before promising enforced first person. |
| First Person View [B42 - WIP], Workshop `3786653645`, mod `FirstPersonView` | Version 0.2, last listed update August 25. Author explains it uses a self-contained Lua raycaster and has significant performance/detail limits. | Potentially simpler Workshop distribution, but still client rendering. Current 42.21 dedicated multiplayer behavior is unverified; not recommended as the production solution. |

Sources: [Viewpoint author page](https://steamcommunity.com/sharedfiles/filedetails/?id=3809306528), [Viewpoint change notes](https://steamcommunity.com/sharedfiles/filedetails/changelog/3809306528), [PZ3D author site](https://pz3d.dev/), [PZ3D server guide](https://pz3d.dev/install/server.html), [Lua prototype page](https://steamcommunity.com/sharedfiles/filedetails/?id=3786653645), [prototype author's explanation](https://steamcommunity.com/workshop/filedetails/discussion/3786653645/582806854239846207/).

## Least manual setup if the owner accepts a client requirement

ZombieBuddy's author provides a Windows installer. Each player still needs a one-time loader installation and approval of the mod's Java code. Changed Java files can prompt again. Server-managed Workshop downloads can simplify content delivery afterward, but cannot replace that setup or consent. A Habitat launch link cannot silently install the loader. See [ZombieBuddy's installation instructions](https://steamcommunity.com/sharedfiles/filedetails/?id=3619862853).

## Performance findings

No inspected first-person mod lists a separate optimization mod as a mandatory dependency. Start with the chosen camera mod and its loader, conservative built-in graphics settings, and a real multiplayer trial on the players' PCs. Server health alone cannot establish client frame rate.

- Viewpoint provides its own graphics presets; its October update includes performance work. Its setup notes require texture compression and a restart on GPUs with less than 12 GB VRAM. These are client settings, not dedicated-server fixes. [Author change notes](https://steamcommunity.com/sharedfiles/filedetails/changelog/3809306528).
- Viewpoint FPS Optimization explicitly describes itself as client-only and loaded through ZombieBuddy. Treat it as an optional measured experiment, not a requirement. [Author repository](https://github.com/mycansever/ViewpointFPS).
- Viewpoint - Smooth Frames targets Build 42.21 and Viewpoint 0.1.6. Its author says dedicated servers skip the Java payload; server configuration can arrange automatic downloads, but each player runs it locally. [Author page](https://steamcommunity.com/sharedfiles/filedetails/?id=3816784011).
- PZ_Optimization's current author README says multiplayer and other mods are untested and unsupported. It also requires a separate client installation. Do not deploy it as a blanket fix for this multiplayer server. [Author README](https://github.com/xD3I/PZ_Optimization).

The game's publisher currently lists 42.21 as stable and 42.22 as pre-release. It explains that Java loaders are outside the supported Lua interface and can break with game updates. Keep game/loader/mod versions compatible rather than assuming the newest release of each works together. [The Indie Stone's Java mod guidance](https://projectzomboid.com/blog/news/2026/10/a-note-on-java-mods-and-modding/).

## Decision

After reviewing the client requirements, the owner explicitly chose to abandon first person and run the new Build 42 world mod-free. Keep `Mods` and `WorkshopItems` empty; do not install a Java loader, camera conversion, or optimization patch. Retain the Build 41 backup. This closes the first-person investigation. Outside-network joining has not been tested from an actual game client in this investigation.
