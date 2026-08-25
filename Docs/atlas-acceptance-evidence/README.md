# Atlas 2.0 internal acceptance evidence

Owner-style QA was performed on 2026-08-24 against the loopback `habitat_atlas_dev` environment as an authenticated administrator. The screenshots are evidence, not pixel-regression fixtures.

## Accepted

- V2 is materially cleaner than V1: the frozen artwork dominates, region fills remain absent at rest, and selection is a restrained boundary treatment.
- All nine top-level regions, Grand Rift -> Death Canyon hierarchy, Igit Island and Port Arcadia child scenes, search, browser Back/Forward, direct scene URLs, World reset, and the authored-route toggle work.
- The editor opens safely in SELECT and exposes REGIONS, POIS, LABELS, and CONNECTIONS deliberately. Browser saves and restores succeeded for one shared topology node, one POI position, and one label anchor. The guarded authoring verifier independently exercises every persistence workflow and restores all temporary fixtures.
- The nine approved routes are visually restrained and geographically defensible. A proposed Desert -> Riverlands line was rejected during visual review because it crossed the Red Forest; it remains `REVIEW_REQUIRED` and has no persisted path.
- At 390 x 844, world, Death Canyon, Igit Island, Port Arcadia, search, detail sheets, route toggling, breadcrumbs, and World reset remain usable with no horizontal overflow.

## Minor polish

- Port Arcadia's world-point selection does not display Peninsula as an intermediate breadcrumb because the canonical point placement has no explicit parent-region relationship. Child-scene navigation and Back restoration are correct.
- The development runtime emits a PostgreSQL client concurrency deprecation warning. It did not affect Atlas correctness and is not Atlas-specific, but should be handled before the pg 9 upgrade.

## Blockers

None.

## Evidence index

- `01-world-v2-default.png` - default internal V2 world view
- `02-legacy-v1-comparison.png` - explicit V1 rollback/comparison
- `03-grand-rift-death-canyon.png` - nested geography and dossier
- `04-igit-island-child-scene.png` - Igit Island child scene
- `05-igit-authored-routes.png` - five approved Igit road paths
- `06-port-arcadia-child-scene.png` - Port Arcadia child scene
- `07-world-authored-routes.png` - four approved world paths
- `08-atlas-editor-select.png` - safe editor entry and modes
- `09-topology-edit-restored.png` - selected shared node after restoration
- `10-igit-connection-editor.png` - selected authored path and connection editor
- `11-mobile-world.png` - 390 x 844 world view
- `12-mobile-death-canyon.png` - 390 x 844 nested detail
- `13-mobile-igit-island.png` - 390 x 844 Igit Island
- `14-mobile-port-arcadia.png` - 390 x 844 Port Arcadia
