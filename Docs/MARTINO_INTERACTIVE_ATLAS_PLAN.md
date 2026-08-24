# Martino Interactive Atlas Plan

## Implementation status — 2026-08-24

The approved V2 geography is locked and the first production vertical slice is implemented. The live Codex now owns one authenticated world scene, ten new macro-region dossiers, and 24 audited placements. `/codex/map` renders the versioned world master with Codex-derived biome, settlement, POI, faction, system, and quest overlays; the Great Hall links to it without loading the renderer; and Bundle v3 carries scenes, normalized geometry, placements, and map art to the trusted game-computer handoff.

Authenticated desktop/mobile Chrome QA is complete, including search, filters, selection, pan/zoom, Codex navigation, Great Hall entry, overflow, and console health. Still ahead: an 8K-class deep-zoom art master and tile pyramid, separate region/city/town scene art, the writer-facing Unplaced tray and geometry editor, route/political overlays, and an adapter-owned calibration from atlas locations to Unreal level coordinates.

## Outcome

Build a private, authenticated interactive atlas for the Martino Story Codex that:

- pans, wheel-zooms, button-zooms, and pinch-zooms smoothly;
- shows regions and biome areas as selectable boundaries;
- shows filterable points of interest, settlements, systems, factions, and quests;
- opens Codex-backed details for every selectable place;
- enters separate, higher-detail maps for regions, cities, and towns;
- updates when the linked Codex entry or quest changes;
- gives writers a visual placement workflow instead of asking for coordinates;
- remains fast and usable on a phone;
- travels in the private Codex bundle to the game-development computer;
- can update the game's generated atlas, location, and quest-map data from the same information writers create in the Codex;
- never exposes story data publicly.

The atlas is a view over Codex truth. It is not a second lore database, a simulated live game state, or a real-world geographic map.

## Locked architectural decisions

1. **Use an illustrated hierarchical atlas.** The world, major regions, and detailed settlements are separate map scenes connected by parent/child links and breadcrumbs. A city map is not an impossibly large inset baked into the world image.
2. **Use OpenLayers with a pixel-coordinate projection.** It supports a fictional image coordinate system, deep-zoom image tiles, vector features, selection, and touch interaction. It does not require fake latitude and longitude.
3. **Keep map art and map information separate.** Terrain, coastlines, relief, water, and permanent environmental texture belong in the raster master. Labels, borders, highlights, POIs, quests, faction control, routes, and selection states are data-driven overlays.
4. **Keep lore in existing Codex records.** A map placement links to a `StoryEntry`; it does not copy the entry title, summary, biome, faction control, population, status, Veil Anchor tier, Soul Forge state, or dossier prose.
5. **Derive quest locations from existing quest relationships.** A quest pickup comes from `StoryArc.regionEntryId`. Quest steps come from REGION entries linked to `StoryNode` records through `StoryEntryLink`. An exact new objective location must first become a real Codex place.
6. **Store placement separately from `StoryEntry.meta`.** Geometry has different validation, revision, query, and editing needs from lore sheets. Adding large polygons to required-but-nullable region JSON would make ordinary region edits fragile and would duplicate map concerns in every entry.
7. **Use normalized fictional coordinates.** Store positions in a fixed `0..100000` coordinate space per scene, independent of the current art resolution. Replacing an 8K master with a 12K master will not move every POI.
8. **Do not invent locations.** New Codex places without geometry appear in an authenticated "Unplaced" tray. They do not receive guessed coordinates and do not silently disappear.
9. **Treat Codex revisions as the update signal.** All map mutations are authenticated, version-checked, revision-recorded, and visible to the existing Codex live-sync cursor. The stream still carries only a change cursor, never story content.
10. **Keep the Great Hall card lightweight.** The main-page card uses a responsive atlas crop, verified Codex counts, and a clear `Open the atlas` action. The full rendering engine loads only on the atlas route, not on every Great Hall visit.
11. **Publish the atlas as a game resource.** Map scenes, placements, canonical quest appearances, route relationships, and versioned art assets are part of the immutable Codex handoff consumed by the other computer. A web-only map feature is incomplete.
12. **Keep the handoff one-way and atomic.** Habitat remains authoritative. The game computer verifies and stages a complete release before activating it, retains its last good snapshot after any failure, and never writes changes back into the Codex database or source-art tree.
13. **Separate atlas coordinates from Unreal world coordinates.** Normalized 2D placement updates the website and the game's atlas UI directly. It does not silently place actors in a 3D level. Any gameplay-world binding uses an explicit game tag or adapter-owned calibration authored for that level.

## Product surfaces

### Great Hall card

Add a premium `Martino Atlas` card to the main page with:

- a responsive crop derived from the current world-map master;
- actual counts such as placed regions, POIs, and mapped quests;
- the most recent relevant Codex revision time;
- an honest `Codex world map` label, never wording that implies game telemetry;
- a link to `/codex/map`.

The card remains useful before the atlas is complete: counts come from real records, and unplaced work is not presented as mapped.

### Full atlas route

Add `/codex/map` as an authenticated Codex surface and add `Atlas` to the Codex navigation.

Desktop layout:

- full-height map canvas;
- compact layer/filter rail;
- search and breadcrumb bar;
- right-side detail drawer;
- zoom, fit, back, and reset controls.

Mobile layout:

- map remains the primary surface;
- filters open as a sheet;
- selected details open as a draggable bottom sheet;
- controls meet 44 px touch targets;
- pinch zoom and one-finger pan work without horizontal page overflow.

Selection behavior:

- hover or keyboard focus highlights a boundary or marker;
- click/tap selects it and opens its details;
- the drawer shows key art, title, place kind, biome, control, status, population, summary, systems, child places, routes, and quests using existing Codex data;
- `Open dossier` goes to `/codex/bible/[slug]`;
- a mapped settlement with its own scene offers `Enter city map` or `Enter town map`;
- the URL retains map, selection, and useful filter state so a view can be linked directly.

## Layer model

Layers are independent and can be toggled without repainting the base image.

| Layer | Source | Presentation |
| --- | --- | --- |
| Regions and zones | REGION map polygons + REGION meta | selectable boundaries and labels |
| Biomes | REGION/zone polygon + `meta.biome` | color wash, biome filter, area detail |
| Settlements | REGION point/polygon + type/tier | tier-aware town/city markers |
| POIs | REGION point/polygon + place type | sites, landmarks, and destinations |
| Quests | arc pickup + node-to-REGION links | pickup, ordered objective, and completion markers |
| Faction control | REGION `meta.control` | holds/contests/influences overlays |
| Veil Anchors | REGION `meta.veilAnchorTier` | tier-specific marker and filter |
| Soul Forges | REGION `meta.soulForge` | active/damaged/destroyed state marker |
| Creatures | CREATURE `meta.biomes` resolved to REGION slugs | habitat overlay; unresolved prose stays unplaced |
| Connections | REGION `meta.connections` | road, sea, trail, rail, or authored route lines |

The first release does not add a separate BIOME entry kind. A biome area is a mapped REGION or zone whose existing `biome` field and dossier provide the details. A first-class biome library can be added later if the writing room needs shared biome dossiers; the renderer does not depend on that choice.

Quest filters should include category, quest, location, faction/companion association, and Codex status. The map must not imply player progress until a separate, verified game-state contract exists.

## Proposed domain model

Names are provisional until migration implementation, but responsibilities are fixed.

### `StoryMap`

- `id`, `slug`, `title`
- optional `parentMapId`
- optional `ownerEntryId` for the REGION/settlement this detailed map represents
- `artVersion`, `width`, and `height`
- initial center and zoom
- minimum and maximum zoom
- optimistic `version`
- creator/editor and timestamps

The tile path is derived from validated `slug` and `artVersion`; a request never supplies an arbitrary filesystem path.

### `StoryMapPlacement`

- `id`, `mapId`, `entryId`
- geometry kind: `POINT`, `POLYGON`, or `MULTIPOLYGON`
- validated normalized geometry JSON
- optional label anchor
- minimum and maximum visible zoom
- display priority for label collision and marker clustering
- optimistic `version`
- creator/editor and timestamps

One placement represents one Codex place in one map scene. A multipolygon covers islands or separated pieces without duplicating the entry. The same place may have placements in a world overview and a detailed parent map when both scales need it.

### Route geometry

Connections continue to live in REGION meta. Initially the renderer draws a connection between the linked placements. A small optional route-geometry record can later provide an authored curve for a road or sea lane without copying the relationship itself. Removing the Codex connection removes the route.

### Game binding

The neutral shared contract carries stable slugs, scene relationships, normalized geometry, Codex relationships, and optional game tags. Unreal-specific conversion stays in an isolated importer adapter.

Two coordinate responsibilities must remain distinct:

- **Atlas coordinates:** the normalized `0..100000` scene coordinates used by the web atlas and the in-game 2D map. These can update automatically from Codex map edits.
- **Gameplay coordinates:** Unreal level/world transforms used for actors, triggers, spawn points, navigation, or objectives. These require an explicit binding from a stable Codex/game tag to a level asset or a calibrated scene transform. The importer must never infer these from the painted map.

This lets a writer move a quest marker on an illustrated city map and update the game's map UI safely. Moving the actual quest trigger in the 3D level remains an explicit game-side operation unless that location has a reviewed gameplay binding.

### Shared types

Strict geometry, scene, projection, filter, and API view types belong in `packages/shared`. Geometry parsers must enforce:

- finite integer coordinates from `0..100000`;
- closed polygons with enough distinct vertices;
- maximum ring/vertex counts;
- no empty geometry;
- scene and entry existence;
- no scene parenting cycle;
- no self-parented map;
- supported geometry for the chosen placement kind.

## Read projection and live updates

Create a pure `getStoryMapProjection(mapSlug, viewer)` service that returns only what the viewer may read:

- scene metadata and tile identity;
- placements with resolved Codex presentation data;
- derived quest appearances;
- derived connections and system markers;
- child-map links;
- real counts and an update cursor;
- unplaced items only when the viewer enters author mode.

The first render can be server supplied. After that:

1. the existing authenticated SSE stream announces a new Codex cursor;
2. the client conditionally fetches the selected scene projection;
3. vector sources are patched in place;
4. pan, zoom, open drawer, filters, and selected slug remain stable;
5. a removed selection closes with a clear `This location was removed or archived` notice.

This avoids a full route refresh that would reset the map viewport.

## Codex-to-game synchronization

The existing private publisher, immutable releases, content-addressed assets, `current.json` activation pointer, and verified mirror remain the transport. The atlas extends that proven handoff instead of creating another network service.

### Published resources

The next additive Codex bundle contract includes:

- map scene records and stable scene slugs;
- scene hierarchy and owning REGION entries;
- normalized placements and label anchors;
- derived canonical quest pickups and quest-step locations;
- canonical routes, faction control, systems, and POI classifications;
- map art masters or approved game derivatives;
- web deep-zoom derivatives where the game toolchain wants them;
- asset dimensions, MIME types, byte counts, and SHA-256 hashes;
- per-resource versions plus the bundle revision cursor;
- counts for maps, placements, routes, and map assets.

The full writers' snapshot may continue to include every Codex status for development/reference tooling. The game-facing atlas payload is separately derived and contains only content allowed by the game-build contract. Archived, rejected, malformed, unresolved, or unsupported placements do not become playable game data.

The existing `compatibility/canon-v1.json` remains available unchanged for the current importer. Atlas support is additive: either a dedicated `game/canon-atlas-v1.json` resource or a new versioned canonical export is introduced after the Unreal importer shape is agreed. An older importer must be able to reject the unsupported atlas contract cleanly while retaining its last imported build.

### Stable identities and generated ownership

- Scene slugs, entry slugs, node keys, arc slugs, and game tags are stable identities; display titles are not keys.
- The importer writes only into a clearly generated game namespace, for example `/Game/Martino/Generated/Codex/Atlas`.
- Hand-authored levels, Blueprints, quest logic, materials, and manually owned assets are never overwritten.
- Game-authored assets refer to generated Codex resources by stable identity or soft reference.
- A renamed title updates presentation without orphaning the asset.
- A removed canonical record is absent from the new full snapshot and is removed from the new staged generated output; the previously active snapshot remains untouched until activation succeeds.

### Import and activation sequence on the other computer

1. Read the private mirrored `current.json` pointer.
2. Refuse an unsupported contract version.
3. Verify the manifest hash, every required file hash/length, and referenced map assets.
4. Validate scene hierarchy, unique stable keys, geometry bounds, entry/quest references, game-tag collisions, and canonical status.
5. Generate or update atlas Data Assets/Data Tables, UI map resources, location records, and quest-map references in a staging namespace.
6. Run importer validation and save the generated staging output.
7. Atomically activate the new snapshot only after the whole import succeeds.
8. Record the imported `snapshotId` and source hashes.
9. On any failure, keep the last good generated snapshot active and report an actionable import error.

### What a Codex edit updates

| Codex change | Website atlas | Game handoff |
| --- | --- | --- |
| Place title, summary, biome, status, or control | detail/filter refresh | regenerated location/atlas metadata |
| Place point or polygon moved | vector overlay refresh | regenerated in-game 2D atlas geometry |
| Quest linked to a placed REGION | quest layer refresh | regenerated quest-map reference |
| Child city/town map added | new drill-down scene | new generated atlas scene/resource |
| Map master replaced and approved | new versioned tiles | new hashed map derivative/resource |
| Entry archived/removed from the game contract | removed after refresh | absent from the next staged generated snapshot |
| Gameplay binding changed | no invented visual movement | adapter updates the reviewed Unreal binding |

Publisher change detection must include map table fingerprints and the map-art inventory, so geometry-only and art-only changes both create a new verified release. The mirror and importer must no-op when the active content hashes have not changed.

## Visual authoring workflow

Author mode is part of the atlas, not a coordinate form hidden in a dossier.

Writers can:

- drag a new Codex place from the Unplaced tray onto a scene;
- move an existing point;
- draw or edit region/biome polygons;
- choose a label anchor and visibility range;
- create a child map for a city, town, or major region;
- preview filters and zoom thresholds before saving;
- replace a map master through a bounded, validated art workflow;
- see who last changed a placement and what changed.

Writes use the same open writers' room law as the Codex, with authentication, optimistic versions, and `StoryRevision` audit rows. A stale geometry save is refused rather than overwriting another writer.

The Unplaced tray is a safety feature:

- new REGION entries are visible there automatically;
- missing parent or malformed hierarchy is explained;
- quests linked to an unplaced region are counted as unmapped, not dropped;
- a placement can be removed without deleting its Codex dossier.

## Art pipeline

### Concept-image handoff

When the concept arrives:

1. inspect the image at original resolution;
2. identify which geography is fixed and which parts are mood/reference only;
3. preserve coastlines, relative placement, travel logic, and intended focal points unless the owner explicitly changes them;
4. produce a realistic AAA Martino master using the existing Codex art direction: rugged near-future dark fantasy, motivated light, practical infrastructure, readable relief, and no invented protected mystery;
5. keep labels, quest marks, POI icons, borders, and UI out of the raster master;
6. review the master at full view, common desktop crop, and phone crop;
7. obtain explicit geography approval before tracing interactive boundaries.

Preferred delivery is a lossless master with at least an 8K long edge, preserving the concept aspect ratio. The first derivative set is:

- deep-zoom web tiles;
- a Great Hall card crop;
- a low-resolution loading preview;
- an optional desaturated accessibility/filter background;
- a geometry reference image with the normalized coordinate grid for tracing only.

### Tile generation

Add a deterministic build script using a local image pipeline such as libvips/Sharp to create versioned 256 or 512 px deep-zoom tiles. Generated tiles are reproducible artifacts, not manually edited files.

Authenticated tile requests:

- validate map slug, version, zoom, x, and y against known scene records;
- resolve only through a fixed map-art root;
- use private immutable caching for a versioned tile;
- never accept a path, URL, shell command, or storage root from the request.

The private Codex publisher includes map masters/derivatives, scene metadata, placement geometry, and the game-facing atlas payload in a new additive bundle contract version. The old canon-v1 export remains compatible.

## Performance budget

- Do not load OpenLayers on the Great Hall.
- Dynamically load the renderer on `/codex/map`.
- Load one scene and its visible overlays at a time; child-map data waits until entry.
- Use deep-zoom tiles so an 8K/12K master is never downloaded whole.
- Cluster dense point markers below their useful zoom.
- Declutter labels and use zoom thresholds.
- Keep selected-detail images responsive and lazy.
- Patch vector sources after live updates instead of rebuilding the renderer.
- Add server projection timing and tile error telemetry without logging story prose.
- At very large future scale, move projection output to vector tiles without changing stored coordinates or UI contracts.

Initial acceptance budgets should be measured on a representative phone and the clubhouse LAN:

- Great Hall receives no atlas-renderer JavaScript;
- first useful map view loads only the visible low-zoom tiles and initial projection;
- pan/zoom stays visually smooth with the initial world dataset;
- entering a city does not preload sibling cities;
- no unbounded database scan occurs per SSE poll or tile request.

## Security and honesty boundaries

- Atlas page, projection API, art tiles, and edit actions require the existing Codex read/write roles.
- The browser never connects to the database, game server, Habitat Agent, or game-management APIs.
- The game computer consumes the existing verified private mirror/share; no public listener or browser-to-game write path is added.
- No arbitrary file-path, upload-path, URL-fetch, shell, or RCON capability is introduced.
- Map writes are allow-listed application actions and audited.
- Uploads are bounded by MIME type, decoded dimensions, file size, and fixed destination convention.
- The main page distinguishes Codex authoring data from verified game telemetry.
- Quest markers represent authored quest locations, not player location or completion.
- Faction overlays represent current Codex canon, not a claim of live simulated control.

## Accessibility and failure behavior

- Every interactive map result also exists in a semantic results list.
- Search, filters, breadcrumbs, and detail links work with keyboard alone.
- The map target is focusable and supports keyboard pan/zoom.
- Color is never the only marker distinction; icons/patterns/text labels carry state.
- Reduced motion removes fly-to animation and pulsing effects.
- A no-WebGL/canvas failure keeps the searchable list and dossiers usable.
- Failed tiles retain the last usable scene and show a retry state.
- A malformed placement is excluded with an author-visible warning; it never crashes the whole map.

## Delivery phases and gates

### Phase 0 — concept and spatial contract

- approve the world concept geography and final raster direction;
- list the initial scene hierarchy;
- decide the first vertical slice: world overview, one region, one settlement, several POIs, and one real quest;
- map existing REGION entries into placed/unplaced inventory without inventing coordinates.

**Gate:** signed-off geography master and placement inventory.

### Phase 1 — domain foundation

- add shared map types and validators;
- add `StoryMap` and `StoryMapPlacement` migrations and database constraints;
- add revision-recorded, version-checked map actions;
- add the pure projection service and quest derivation;
- extend snapshot/bundle fingerprinting, counts, manifests, and types additively;
- define the canonical game-atlas payload and stable generated-asset identities;
- add unit, schema, auth, traversal, cycle, and projection tests.

**Gate:** a fully tested projection and serialized game-atlas payload can represent the vertical slice with real Codex links, including honest unplaced counts.

### Phase 2 — interactive world viewer

- add authenticated/versioned tile serving;
- integrate OpenLayers with the custom pixel projection;
- implement pan, zoom, pinch, fit, search selection, breadcrumbs, and URL state;
- add region/biome polygons, labels, POIs, and detail drawer;
- add the lightweight Great Hall card and Codex Atlas navigation item.

**Gate:** the vertical slice is fully explorable on desktop and mobile with no fabricated data.

### Phase 3 — filters, quests, and world systems

- add layer controls and compound filters;
- derive quest pickup/objective/completion appearances;
- add faction control, connections, creature habitats, Veil Anchors, and Soul Forges;
- add selected-quest route highlighting and overlapping-marker handling;
- connect live cursor updates without losing viewport state.

**Gate:** editing a linked Codex detail changes the open map; linking a quest to a placed location adds it without hand-editing map data.

### Phase 4 — regions, cities, and towns

- add child-map creation and scene breadcrumbs;
- add region-to-city and city-to-destination navigation;
- support independent art/version/zoom settings per child scene;
- prove at least one city/town map end to end.

**Gate:** a user can travel world → region → settlement → POI and back while preserving meaningful context.

### Phase 5 — visual authoring

- add the Unplaced tray;
- add drag placement, polygon drawing/editing, label anchors, zoom ranges, and previews;
- add conflict handling, change summaries, restore/reposition tools, and map-specific audit views;
- add bounded map-master replacement and tile regeneration workflow.

**Gate:** a writer can create a Codex place, place it visually, attach a quest through existing Codex relationships, and see every result live without touching JSON or code.

### Phase 6 — production hardening

- authenticated browser QA at desktop and 390 × 844 mobile;
- accessibility and reduced-motion QA;
- performance profiling with dense representative data;
- path traversal, permission, upload, malformed geometry, and stale-write testing;
- Codex bundle publish/mirror/integrity verification;
- importer preflight, staged generation, last-good retention, and atomic activation verification on the game-development computer;
- confirm that one real Codex location edit and one real quest-location edit reach generated game atlas resources without touching hand-authored assets;
- update deployment, operations, art, schema, and build-status documentation.

**Gate:** strict typecheck, lint, full tests, production build, browser QA, private bundle verification, and a successful staged game-computer import are green before deployment is claimed.

## Deliberately deferred

- real-time player GPS/location;
- player quest completion state;
- public map sharing;
- arbitrary user-uploaded map servers or remote tile URLs;
- 3D globe or terrain engine;
- procedural generation of geography;
- PostGIS, until real query scale proves JSON geometry and scene-local indexes insufficient;
- automatic AI placement of new Codex entries.

These can be separate future decisions. None is required for the requested interactive, expandable Codex atlas.

## Definition of done

The atlas is complete when a member can open it from the Great Hall, smoothly explore the world at phone or desktop scale, select a biome/region/POI for real Codex details, filter and highlight real quest locations and world systems, enter detailed settlement maps, and add a new Codex-connected place through a visual editor—and when that same canonical map information is published, verified, staged, and activated as generated atlas/location/quest-map resources on the game-development computer. Every change remains private, authenticated, audited, version-safe, exportable, and honest about whether it is authored canon, generated game data, reviewed gameplay binding, or verified live game state.
