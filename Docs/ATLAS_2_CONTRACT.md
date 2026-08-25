# Atlas 2.0 Contract Foundation

This document is the authority for the Atlas 2.0 coordinate, geometry, topology, connection, integrity-audit, and migration-manifest contracts. `MARTINO_INTERACTIVE_ATLAS_PLAN.md` remains useful historical and product context, but this document governs new Atlas 2.0 data work.

Prompt 2 established the non-persistent contracts. Prompt 3 adds an empty, additive persistence foundation and internal server service without migrating legacy data or changing the existing OpenLayers renderer, protected artwork, routes, seed, canonical lore, or Bundle V4.

## Canonical coordinates

Atlas coordinates are deterministic fixed-point integers with a top-left origin:

```text
coordinateWidth = 100000
coordinateHeight = round(100000 * canonicalArtworkHeight / canonicalArtworkWidth)
extent = [0, 0] through [coordinateWidth, coordinateHeight]
```

A 1536 x 1024 scene therefore has a `100000 x 66667` coordinate extent. Values must be finite integers within that inclusive extent. Artwork dimensions must be positive integers.

All conversions live in `packages/shared/src/atlas-coordinate.ts`:

```text
pixelX = atlasX / coordinateWidth * decodedArtworkWidth
pixelY = atlasY / coordinateHeight * decodedArtworkHeight
openLayersX = atlasX
openLayersY = coordinateHeight - atlasY
```

Pixel-to-Atlas and OpenLayers-to-Atlas conversions round to the nearest fixed-point integer. Round trips are deterministic within that documented quantization. Artwork can replace an existing resolution without recalibration only when integer cross-multiplication proves the aspect ratio identical. A different ratio requires explicit visual recalibration.

## Geometry contract

Browser-safe shared contracts cover line strings, multilines, rings, polygons, and multipolygons. Validators are deterministic and do not mutate their input.

- Lines require at least 2 points; rings require at least 3 distinct vertices and explicit closure by repeating the first vertex.
- Consecutive duplicate vertices, non-integer or out-of-bounds points, zero-area rings, and self-intersections are errors.
- In the top-left/y-down coordinate plane, polygon shells are clockwise and holes are counterclockwise.
- Holes must be strictly inside their shell and may not touch or cross it, intersect one another, or contain one another.
- A non-mutating analysis helper may return a closed copy of a legacy ring and reports whether it normalized the copy. It never changes the source, and fingerprints remain based on the original source.
- Exact segment analysis reports shared vertices, directed and undirected shared segments, duplicate polygons, and exact `TOUCH`, `CROSS`, and `OVERLAP` intersections. It does not claim gap detection or treat near matches as topology.

Bounds keep malformed input from causing unbounded work: 4,096 line vertices; 4,097 ring vertices including closure; 128 rings per polygon; 128 multiline or multipolygon components; 50,000 total vertices per geometry; 5,000 segments in exact pair analysis; and 100 retained diagnostic examples.

## Spatial layers and shared topology

The controlled spatial layer kinds are `BASE_GEOGRAPHY`, `BIOME`, `FACTION_INFLUENCE`, `POLITICAL_CONTROL`, `MILITARY_CONTROL`, `CORRUPTION`, `NARRATIVE_AREA`, `RESOURCE_AREA`, and `OTHER`.

Only `BASE_GEOGRAPHY` consumes `SHARED_TOPOLOGY`. Every analytical layer uses independently editable overlay geometry, so overlapping biome, control, influence, quest, corruption, and resource areas are never forced into a mutually exclusive political/geographic partition.

The future base-topology contract consists of:

- topology nodes: identity, map identity, integer position, optimistic version;
- boundaries: identity, map identity, start/end node identities, ordered interior vertices, kind, optimistic version;
- ring references: boundary identity, zero-based sequence, and reversed direction;
- area rings: stable identity, component index, `SHELL` or `HOLE`, and ordered boundary references;
- areas: identity, map identity, `BASE_GEOGRAPHY`, rings, and optimistic version.

Boundary kinds are `INTERNAL_BORDER`, `COAST`, `WATER_BOUNDARY`, and `OPEN_BOUNDARY`. Adjacent areas can consume one boundary in opposite directions. Component indexes allow disconnected territories; one shell plus zero or more holes describes each component. Synthetic validation rejects missing references, endpoint/map mismatches, sequence gaps, duplicate boundary use, disconnected or unclosed chains, duplicate/missing shells, and invalid component declarations.

Assembled polygons and multipolygons are rebuildable read models. Once persistence exists, they must never become a second independently editable source of truth beside nodes and boundaries.

## World connections

`AtlasWorldConnection` references canonical `StoryEntry` identities and carries stable identity, controlled type, directionality, status, editorial visibility, preserved original wording, editorial notes, bounded metadata, and optimistic version. `AtlasMapConnectionPath` separately associates a connection with a map and line/multiline presentation, zoom constraints, priority, and version. Neither contract is persistent or rendered yet.

The initial connection vocabulary is limited to the inspected legacy rows: `ROAD`, `TRAIL`, `RIVER_TRAVEL`, `SEA_ROUTE`, `AIR_ROUTE`, `OTHER`, and `UNKNOWN`. Directionality is `UNSPECIFIED`, `FROM_TO`, `TO_FROM`, or `BIDIRECTIONAL`; status is `UNSPECIFIED`, `OPEN`, `CLOSED`, or `DESTROYED`. Visibility is only `DEFAULT` or `HIDDEN` and is editorial/cartographic—not player discovery.

Classification is conservative. Unknown or unsafe wording remains `OTHER`/`UNKNOWN`, the original row is retained verbatim, and ambiguity requires human review. Endpoint resolution tries an exact canonical slug first, then an exact unique title; it never guesses. Reciprocal legacy rows are marked as review candidates but are never consolidated automatically.

Connection metadata is JSON-compatible and finite, with an 8 KiB encoded limit, depth 4, 32 keys per object, 64 array items, 1,000 characters per string, and keys no longer than 80 characters. Editorial notes have a 2,000-character contract limit.

## Read-only integrity audit

The production adapter reads only `StoryMap` and `StoryEntry` data. It contains no create, update, upsert, delete, migration, reconciliation, or seed path. Database unavailability is `FATAL`; the command does not fabricate data or invoke a seed.

Run from the repository root:

```powershell
# Human-readable; warnings do not fail
pnpm --filter @habitat/web atlas:audit

# Deterministic JSON with contract/version identifier
pnpm --silent --filter @habitat/web exec tsx scripts/audit-story-atlas.ts --json

# Human-readable; warnings also fail
pnpm --filter @habitat/web atlas:audit -- --strict
```

Severities are `INFO`, `WARNING`, `ERROR`, and `FATAL`. Normal mode exits nonzero for `ERROR` or `FATAL`; strict mode also fails on warnings. Known V1 limitations are informational. The current Port Arcadia PNG decodes to 1599 x 984 while the database declares 1536 x 1024 with a 100000 x 66667 extent; the audit reports `RECALIBRATION_REQUIRED` and does not repair it.

## Migration manifests

The files under `Docs/atlas-migration-manifests/` are review snapshots for later migrations, not runtime or lore authorities:

- `atlas-v1-geometry.json` (`martino-atlas-v1-geometry-migration-manifest`, version 1) preserves every placement's map/entry/placement identity, original geometry and kind, label anchor, display/zoom fields, entry status, child scene, and source fingerprint.
- `atlas-v1-connections.json` (`martino-atlas-v1-connection-migration-manifest`, version 1) preserves every legacy source/index locator and raw row, endpoint resolution, candidate classification/directionality, reciprocal candidates, ambiguity, and source fingerprint.

Records and object keys are canonically sorted; hashes use SHA-256; there are no timestamps, random IDs, machine paths, or database UUIDs as the sole stable identity.

```powershell
pnpm --filter @habitat/web atlas:manifests
pnpm --filter @habitat/web atlas:manifests -- --check
```

The first command regenerates both files from read-only live data. The second compares generated bytes with the committed files and fails on drift.

## Ownership and deferred decisions

Canonical place, faction, quest, hierarchy, control, and legacy connection ownership remains where the current Codex defines it. Atlas contracts reference those records and do not duplicate lore. No verified player discovery-state owner exists, so Prompt 2 defines none. The product policy for spatial presentation of `DRAFT`, `PROPOSED`, and `CANON` entries remains unresolved; the audit reports status without promoting content.

The current Atlas/Codex seed can overwrite known placements and remove placements absent from its arrays. Do not run it to reconcile Atlas data. Authoring must remain blocked until a later phase makes the seed bootstrap-only or otherwise non-destructive.

Bundle V4 and its map/placement serialization remain unchanged. Runtime fills/borders, hover, click-to-fit, progressive disclosure, label-anchor rendering, layer defaults, SSE reconstruction, URL state, accessibility alternatives, connection rendering, Port Arcadia recalibration, boundary tracing/migration, analytical-layer persistence, and editor UI are explicitly deferred.

## Additive persistence foundation

Migration `20260824230000_add_atlas_topology_connections` adds the following empty authoring structures. It contains no legacy-data statements and is not applied to the active development database as part of Prompt 3.

### Base topology ownership

- `StoryMapTopologyNode` owns one canonical fixed-point junction on one `StoryMap`. `(mapId, x, y)` is unique because independently overlapping analytical layers do not consume base topology; exact coincident base nodes are one shared junction.
- `StoryMapBoundary` owns one versioned ordered edge from a start node through JSON interior vertices to an end node. Endpoints are never repeated in the JSON. Map-relative bounds, point shape, and connectivity are validated by the service.
- `StoryMapAreaRing` attaches topology to the existing `StoryMapPlacement`; it does not create another place/lore entity. `componentIndex` identifies a polygon component. Within that component, `ringIndex=0` is its sole `SHELL`, and positive ring indexes are independently ordered `HOLE` records, allowing multiple holes.
- `StoryMapAreaRingBoundary` orders shared boundaries with a zero-based sequence and reversal flag. Its compound key prevents one ring from consuming one boundary twice. Two placements may reference the same boundary, including in opposite directions.

One component represents a polygon; several components represent disconnected territories or islands as a multipolygon. Each component has one shell and zero or more holes, supporting enclaves. Full assembled polygon/multipolygon values remain derived read models from nodes, boundaries, and ring references. They are never independently editable persistence.

Topology coordinates are bounded against their owning map in the application because SQL cannot express a safe cross-row extent check. SQL still enforces non-negative coordinates, positive versions, distinct boundary endpoints, JSON container shape, non-negative indexes/sequences, shell/hole index roles, exact node uniqueness, ring slot uniqueness, and reference ordering uniqueness.

### World connections and paths

`StoryWorldConnection` owns stable connection identity independently of endpoints and type. It references two canonical `StoryEntry` rows, permits multiple distinct routes between the same pair, stores the exact Prompt 2 enums, original wording, editorial notes, bounded metadata, version, and authorship. Self-connections are refused. The Prompt 3 service permits `REGION` endpoints only because all verified world routes are place-to-place; the foreign keys deliberately remain general `StoryEntry` references so a reviewed future endpoint policy can expand without a schema rewrite.

`StoryMapConnectionPath` owns one cartographic line or multiline representation for a connection on a scene. One connection may have paths on multiple maps. A disconnected path in one scene uses `MULTILINESTRING`, so `(connectionId, mapId)` is unique. Geometry, extent, zoom, and version are validated independently of connection identity.

### Versions, transactions, revisions, and deletion

All authored topology, connection, and path records begin at version 1. Representative updates use an atomic `WHERE id = ... AND version = expectedVersion` write and increment the version. A zero-row update is a stale-editor refusal, never a last-write-wins overwrite.

Topology writes run in serializable transactions. Full placement topology replacement locks the placement aggregate, compares every current ring identity/version, validates the entire proposed assembly, then replaces ring references and writes a revision atomically. Failed validation or persistence rolls the transaction back without partial topology.

The existing `StoryRevision` table remains the sole authoring audit stream. Its entity-type constraint now admits `TOPO_NODE`, `BOUNDARY`, `AREA_RING`, `WORLD_CONN`, and `CONN_PATH`; every internal mutation writes its revision in the same transaction. No new audit table exists.

Every structural foreign key uses `RESTRICT`; editor attribution uses `SET NULL`. A map, placement, node, boundary, entry, connection, or ring cannot silently cascade-delete topology or routes. Service deletes first check references and expected versions. Connection paths and ring references must be explicitly removed before their owners.

Indexes cover map nodes, map/start/end boundaries, placement rings, ordered ring references, connection endpoints/type, and map/connection paths. No endpoint/type uniqueness exists for connections.

### Internal persistence service

`apps/web/lib/atlas-persistence-service.ts` provides map topology reads, node/boundary lifecycle operations, assembled placement topology, atomic full-ring replacement, connection listing/query/lifecycle, and scene-path lifecycle. `apps/web/lib/atlas-persistence.ts` binds it to Prisma behind `server-only`. Prompt 3 adds no route, action, or public write surface; a future authenticated caller must supply the actor whose existing `User` row is recorded in authorship and `StoryRevision`.

### Compatibility and migration boundary

The new tables must be empty before Prompt 4. `StoryMapPlacement.geometry` and `REGION.meta.connections` remain the only live V1 sources; there is no production dual-write. The Atlas projection/API, OpenLayers renderer, SSE refresh, URLs, seed, and Bundle V4 do not read the new tables.

Generic analytical-layer persistence is deliberately deferred. Prompt 2 already separates independent overlay contracts from base topology, but Martino has no reviewed analytical polygons or authoring requirements that justify a speculative table now. A later additive generic model is safer than guessing ownership fields in Prompt 3.

Prompt 4 is limited to a controlled V1-to-V2 migration rehearsal and parity reporting. It must preserve V1 compatibility and must not switch the renderer.

## Controlled V1-to-V2 rehearsal

Prompt 4 implements deterministic planning, isolated application, and verification without applying the pending Atlas migration to the active `habitat` database. The rehearsal writer requires an explicit `ATLAS_REHEARSAL_DATABASE_URL`, accepts only a distinct local database named with the `habitat_atlas_p4_rehearsal_` prefix, and refuses a target whose normalized host, port, and database identity match the canonical source. Canonical extraction runs inside a repeatable-read transaction after `SET TRANSACTION READ ONLY`; the writer receives the extracted value and has no source mutation handle.

The connection rehearsal preserves the Prompt 2 manifest locator, fingerprint, source slug, array index, authored target, route wording, notes, complete canonicalized legacy row, classifier source/rationale/confidence, review status, and reciprocal candidate locators in bounded metadata. Stable rehearsal UUIDs derive from source fingerprints, but parity remains keyed by the manifest locator/fingerprint rather than database identity. All 25 rows produce distinct candidates; reciprocal rows remain distinct and directionality remains `UNSPECIFIED`. The two shelf descriptions remain `OTHER` and `REVIEW_REQUIRED`. No connection path is inferred.

Prompt 6 replaces the partial Prompt 4 trace with the approved canonical world-master topology. It references the frozen 1536 x 1024 `martino-world-map-v2-clean-production-candidate.png` (SHA-256 `427bf4967afa8a96afa2175d5aed261225cf7fbeed17944be527f4616b5713b6`) and stores only integer coordinates in the existing 100000 x 66667 top-left extent. The editable source is 19 shared nodes, 26 single-owner boundaries, 11 area rings, and 43 ordered boundary references. Derived polygon geometry is validation/review output only.

Eight top-level land regions form one exact partition: The Desert, Grand Rift, The Red Forest, High Cliffs, Riverlands, Magic-Torn Wasteland, Unknown Southeast, and The Peninsula. Grand Lake is a major-water shell and its four shoreline boundaries are consumed in reverse by the High Cliffs hole. Death Canyon is one 23-point nested shell whose parent is Grand Rift; it does not tessellate the world partition. The Red Forest is one contiguous top-level area. Every top-level internal boundary is consumed by both owners in opposite directions, and all nine three-or-more-region junctions use one exact node each.

The lock analyzer fails on bounds/ring errors, crossings, partition-area drift, duplicate editable paths, one-sided internal edges, owner metadata disagreement, imprecise junctions, orphan/unused topology, or Death Canyon containment/Red Forest overlap. All hard gates currently pass and no boundary remains `OWNER_REVIEW_REQUIRED`. Igit Island stays a world anchor and independent child scene; Port Arcadia stays a Peninsula point/child scene with its existing calibration work explicitly deferred.

Review-only artifacts live under `Docs/atlas-migration-rehearsal/`. They are not runtime sources of truth. `atlas-v2-topology-manifest.json` is the deterministic topology handoff; `atlas-v2-derived-geometry.json` is the derived read model; `atlas-v2-topology-review.svg` is a transparent vector overlay; and `atlas-v2-review.html` adds raster/V1/V2/node/ID/semantic/nested/label toggles plus hover and hash-persisted click inspection. The HTML references the frozen candidate in place and has no API, database, or mutation access. `ATLAS_2_OWNER_REVIEW.md` now contains only the connection and child-scene decisions outside this world topology lock.

```powershell
# Read-only deterministic plan; writes nothing
pnpm --filter @habitat/web atlas:migrate:plan

# Explicitly regenerate deterministic review artifacts
pnpm --filter @habitat/web atlas:migrate:artifacts

# Requires a guarded ATLAS_REHEARSAL_DATABASE_URL
pnpm --filter @habitat/web atlas:migrate:rehearse
pnpm --filter @habitat/web atlas:migrate:verify
```

Two fresh disposable Prompt 6 databases and an intentional rollback probe on each produced logical fingerprint `60368a93b625328cbc0beb638eb7b657431d3d64a4d711bab81f217d2810b517`. Each resulting rehearsal state was 25 unchanged connection candidates, 19 topology nodes, 26 boundaries, 11 rings, 43 ordered references, and zero connection paths. Both disposable databases were removed. The active database received zero writes, zero migration applications, and zero seed runs. V1 placement geometry, legacy connection metadata, renderer/API/routes/SSE, seed, artwork, child scenes, and Bundle V4 remain unchanged.

## Controlled V2 activation and dual projection

Prompt 7 adds an explicit `atlas:v2:activate` command, a read-only `atlas:v2:verify` command, and a deterministic `atlas:v2:parity` report. Activation verifies the locked raster, topology, derived-geometry, and connection-candidate hashes; validates an allow-listed loopback database identity and the additive schema; fingerprints every V1 placement, quest placement, and legacy connection; then writes the 25 canonical connections and locked topology in one serializable transaction with `StoryRevision` audit rows. Exact existing data returns `ALREADY_ACTIVATED`; partial, invalid, or conflicting stable-ID content is refused rather than overwritten. The guarded cleanup path requires `ATLAS_V2_CLEANUP_CONFIRM=DELETE_CANONICAL_ATLAS_V2`, verifies the canonical activated state first, and removes only V2 activation rows and their revisions.

The configured `localhost:5432/habitat` database is the deployed production database according to `Docs/WEB_DEPLOYMENT.md`; `HabitatWeb` and `HabitatWorker` are running automatic services against that environment. Therefore the Prompt 7 migration and activation remain unapplied there. Two fresh disposable clones proved migration, rollback, activation, verification, idempotency, conflict refusal, parity, authenticated runtime rendering, and guarded cleanup before being removed. The durable evidence record is `Docs/atlas-v2-activation/prompt-7-verification.json`.

V1 remains the default projection. V2 is selected only when `HABITAT_ATLAS_V2_INTERNAL_ENABLED=true`, the authenticated user is an administrator, and the request explicitly includes `?atlas=v2`. The page and API resolve that choice at one server boundary and render separate V1/V2 components. The V2 contract returns assembled region geometry, bounds, labels, hierarchy, points, quests, connections, and an Atlas-scoped revision cursor without exposing topology-edit records.

The V2 OpenLayers stack is base artwork, invisible region hits, hover/selection highlight, POI/quest points, and decluttered region labels. Connection paths remain absent because canonical path geometry is zero. Hover updates OpenLayers styles without React state churn. Click/tap persists a hash selection and fits its geometry. Selecting Grand Rift makes nested Death Canyon available at region zoom. SSE refresh replaces features in the existing vector sources instead of reconstructing the map. Child-scene headings derive from the owning canonical `StoryEntry.title`, so the legacy map record can remain unchanged while V2 correctly displays `Igit Island Tactical Atlas`.

```powershell
# Internal runtime opt-in; V1 remains the fallback for every other request
$env:HABITAT_ATLAS_V2_INTERNAL_ENABLED = "true"
# Authenticated ADMIN only
# /codex/map?atlas=v2

# Explicit activation/verification require a separately confirmed target URL
pnpm --filter @habitat/web atlas:v2:activate -- --prove-rollback
pnpm --filter @habitat/web atlas:v2:verify
pnpm --filter @habitat/web atlas:v2:parity
```

## Persistent Atlas development database (Prompt 7B)

`localhost:5432/habitat` remains the deployed production database and must not receive the pending Atlas migration, V2 activation, cleanup, or Atlas seed reconciliation. The retained local development target is precisely `localhost:5432/habitat_atlas_dev`. It is refreshed only by an explicit, verified restore from a fresh production backup; it is never dropped as normal workflow cleanup.

The ignored root `.env.local` opts local application processes into that target using `HABITAT_ENVIRONMENT=development` and `HABITAT_DEVELOPMENT_DATABASE=habitat_atlas_dev`. `apps/web/lib/atlas-development-database.ts` derives the target URL from the existing loopback base URL, changing only its database name. It does not duplicate a credential and refuses any non-loopback source or other database name. Production processes do not opt in, so their `DATABASE_URL` remains unchanged.

Local Atlas V2 rendering is explicitly internal-only through `HABITAT_ATLAS_V2_INTERNAL_ENABLED=true`; V1 remains the default route unless an authenticated administrator requests `?atlas=v2`. The development override also disables Discord, telemetry, third-party game integrations, and story-assistant side effects, and uses the local `AUTH_URL`. It contains no credentials. Development browser QA must use a disposable local test session or an approved local authentication flow, never production OAuth credentials.

Start the isolated local Atlas server through the development wrapper; it loads the ignored local file only for its child process and cannot change a service already running elsewhere. Use the read-only development verification before and after any intentional Atlas maintenance:

```powershell
pnpm --filter @habitat/web atlas:dev -- --hostname 127.0.0.1 --port 3010
pnpm --filter @habitat/web atlas:dev:verify
```

The V2 activation script accepts this persistent target only when its target URL identifies `habitat_atlas_dev`, the source is a distinct loopback database, and both `ATLAS_V2_ACTIVATION_ENVIRONMENT=development` and `ATLAS_V2_ACTIVATION_CONFIRM_DATABASE=habitat_atlas_dev` are set. `--cleanup` additionally requires `ATLAS_V2_CLEANUP_CONFIRM=DELETE_CANONICAL_ATLAS_V2`; it removes only verified V2 activation rows and their revisions. The existing seed refuses an activated V2 database before reconciliation unless a deliberately separate future policy authorizes that operation.

## Development-only Atlas authoring (Prompt 9)

Atlas authoring is an internal `ADMIN` surface at `/admin/story/atlas`. It is unavailable unless every server-side guard agrees that `HABITAT_ENVIRONMENT=development`, `HABITAT_ATLAS_AUTHORING_ENABLED=true`, internal V2 is enabled, and `DATABASE_URL` is the loopback `habitat_atlas_dev` database. Hiding editor chrome is not authorization: every bounded server action repeats role and database-identity checks before calling the server-only persistence service. Production remains both disabled and rejected.

The authoring path is `Workbench UI -> typed Zod server action -> Atlas persistence service -> transaction/version check -> Prisma -> StoryRevision -> path revalidation`. React components never write through Prisma. The workbench enters a non-mutating `SELECT` mode and requires an explicit switch to `REGIONS`, `POIS`, `LABELS`, or `CONNECTIONS`. Drag operations update only local fixed-point drafts; Save is explicit, Discard restores the loaded state, leaving with a draft warns, and stale versions are surfaced as conflicts. Raw screen pixels are never persisted.

Region editing operates on `StoryMapTopologyNode` and `StoryMapBoundary`, never derived polygons. Moving a shared node previews every connected edge and the service validates the complete map before its one versioned write. Boundary endpoints remain nodes; only ordered interior vertices are editable. Shared ownership is displayed before edits. Inserting and deleting interior vertices remains a boundary update and therefore receives global topology validation. Splitting at an existing interior vertex is one serializable service operation: it creates one node and two edges, rewrites all consuming ring sequences in their correct orientation, advances affected ring versions, validates the proposed global topology, and records revisions. Boundary merge is deliberately deferred because a safe merge must additionally prove compatible consecutive-ring semantics; no partial merge exists.

POI authoring references existing canonical `StoryEntry` rows. The Unplaced Locations tray is derived from entries lacking a placement on the current scene. Marker position, optional label anchor, zoom bounds, and display priority are cartographic placement data; title and lore remain Codex data. `Remove placement only` cannot delete a StoryEntry. Position and label handles use separate modes and local previews.

Semantic `StoryWorldConnection` rows and per-scene `StoryMapConnectionPath` rows remain separate. Authors can create or update controlled endpoint/type/direction/status/visibility data; semantic deletion requires the exact phrase `DELETE WORLD CONNECTION` and is refused while any scene path exists. The path canvas adds vertices by deliberate clicks, moves them with handles, removes the last local vertex, cancels without persistence, and submits validated LineString or contract-valid MultiLineString JSON. Missing paths are valid and displayed as backlog, never fabricated. Removing a map path preserves its semantic connection.

The V2 player projection now carries only persisted scene paths. OpenLayers receives a separate restrained route source/layer, hidden by default behind an `Authored routes` control that appears only when paths exist; toggling visibility does not reconstruct the map. Author nodes, boundary handles, coordinates, route vertices, revision history, and validation status are isolated to the editor.

Every placement, topology, connection, and path mutation writes the existing `StoryRevision` stream in the same transaction. The Atlas-specific revision cursor therefore advances naturally for the established refresh path. The seed's activated-V2 refusal remains unchanged, V1 data is not mirrored or removed, Bundle V4 is unchanged, and the frozen raster remains read-only.

## Internal V2 default and canonical route baseline (Prompt 10)

Atlas selection remains centralized in `atlas-v2-feature.ts`. An authenticated administrator receives V2 from `/codex/map` only when the server is positively identified as development and the existing internal V2 flag is enabled. `?atlas=v1` is an unconditional explicit legacy comparison/rollback request. `?atlas=v2` still requires administrator authorization plus the internal feature flag. Production, non-admin, and disabled-flag requests continue to resolve to V1. The internal version badge and comparison link are never rendered for ordinary player sessions.

V2 navigation now owns scene-aware URLs and browser history. World or child-scene selection pushes a restorable URL state, browser Back/Forward restores selection and scene, and `/codex/map?scene=<map-slug>` is a durable direct link. Child maps preserve a World breadcrumb. These are presentation links only; map, entry, placement, and lore ownership is unchanged.

`Docs/atlas-route-authoring-backlog.json` is the deterministic review ledger for all 25 canonical semantic connections. It is not a second connection source of truth: IDs, endpoints, types, and wording must match the activated database. Only `AUTHOR_NOW` records may contain geometry. The initial approved baseline is nine paths: five roads on `martino-starting-island` and four world paths (two river-travel corridors, one sea route, and one air route). Fourteen connections require owner review and two non-route geographic transitions are deferred. The guarded `atlas:routes:author` command creates or preserves only that approved geometry in `habitat_atlas_dev`, refuses different existing geometry, and records normal audited persistence revisions. `atlas:routes:verify` is read-only and checks backlog parity, geometry validity, endpoint semantics, scene placement, revision wording, and dashboard totals.

Persisted routes remain hidden by default. The `Authored routes` control appears only when the current scene has paths and changes layer visibility in place. Selecting an endpoint reveals only its relevant authored connection paths even while the global route layer is off. Road, trail, river, sea, and air styles share a restrained cartographic palette; unapproved or missing paths are never inferred from decorative raster marks.

The Atlas editor is scene-aware and uses the same canonical models for the world, Igit Island, and Port Arcadia. Its server-action module exports only asynchronous action functions; constants belong to the client module because Next.js rejects non-function exports from a `"use server"` boundary. Browser acceptance proved save/revision/restore for a shared topology node, a POI position, and a label anchor, with canonical values restored afterward.

## Production cutover controls (Prompt 11B)

Production activation is an explicitly owner-authorized mode of the existing guarded activation command. It is restricted to the loopback canonical `habitat` database and additionally requires the exact production environment/database confirmation, owner-authorization token, current release HEAD, current Next.js build ID, a non-empty custom-format backup less than two hours old with an independently successful `pg_restore --list`, the frozen raster hash, all locked artifact hashes, the applied additive migration, and the exact pre-cutover V1 legacy fingerprint. The transaction writes the locked topology, all 25 provenance-preserving semantic connections, exactly the nine approved route paths, and their audit revisions. Any failed invariant rolls the whole activation back.

The production resolver has two separate staged controls. `HABITAT_ATLAS_V2_INTERNAL_ENABLED=true` permits an ADMIN to request `?atlas=v2` while V1 remains the default. Only a production Node process with `HABITAT_ATLAS_V2_PRODUCTION_DEFAULT_ENABLED=true` makes V2 the default for normal authorized Codex users. Explicit `?atlas=v1` overrides either setting and remains the immediate Level 1 rollback. Neither flag enables Atlas authoring; the authoring guard still requires the distinct development identity and loopback `habitat_atlas_dev` database.

Production route and baseline verification are read-only. They require an explicit production verification environment/database confirmation and accept only the loopback canonical database. The route verifier expects the frozen nine-path release ledger exactly; it never authors missing paths.
