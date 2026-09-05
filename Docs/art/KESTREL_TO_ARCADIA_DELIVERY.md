# Kestrel to Arcadia art delivery

Current status: **13 of 13 slots delivered**. See [the final Glasswater delivery and acceptance report](GLASSWATER_FINAL_DELIVERY.md). Earlier runs below are retained as history.

2026-09-05. Built-in image_gen. All 13 slots attempted in brief order; 10 PNGs delivered and 3 rejected by the image service's output violence filter. Rejected scenes were not softened or retried.

## Delivered

All files are under `apps/web/private/codex-art/`. One final per slot, 1672 × 941 pixels, PNG, 8-bit RGB (PNG color type 2), no alpha.

- [flags/kestrel-shielded-the-forge.png](../../apps/web/private/codex-art/flags/kestrel-shielded-the-forge.png)
- [flags/kestrel-shielded-the-wall.png](../../apps/web/private/codex-art/flags/kestrel-shielded-the-wall.png)
- [flags/believed-brask.png](../../apps/web/private/codex-art/flags/believed-brask.png)
- [flags/tempest-fired-last.png](../../apps/web/private/codex-art/flags/tempest-fired-last.png)
- [flags/tempest-crew-aboard.png](../../apps/web/private/codex-art/flags/tempest-crew-aboard.png)
- [flags/rook-left-on-the-dock.png](../../apps/web/private/codex-art/flags/rook-left-on-the-dock.png)
- [flags/the-army-opened-a-road.png](../../apps/web/private/codex-art/flags/the-army-opened-a-road.png)
- [flags/owes-the-army.png](../../apps/web/private/codex-art/flags/owes-the-army.png)
- [flags/sold-the-pearl-archive.png](../../apps/web/private/codex-art/flags/sold-the-pearl-archive.png)
- [flags/owes-the-cartel.png](../../apps/web/private/codex-art/flags/owes-the-cartel.png)

## Unfilled slots

### `regions/wrackline.png`

Generation rejected: output moderation, violence. Full error and request ID are retained in the delivery JSON.

Grey dawn reveals a black-sand fishing village beneath an immense engineered wall, with exhausted survivors and one mourner kneeling over a body amid tide debris. A chapel lamp, misted grave stones, and two fishers returning their catch to the sea carry the quiet finality of the lost island.

### `flags/kestrel-shielded-the-clinic.png`

Generation rejected: output moderation, violence. Full error and request ID are retained in the delivery JSON.

Castellan works with steady bloodied hands in a mess hall converted to a clinic as engineers bolt new plate over the windows and roof. The exposed Forge's old corrugated housing and unrepaired wall remain visible through a gap, while real blood stains the treatment tables.

### `flags/glasswater-came-aboard.png`

Generation rejected: output moderation, violence. Full error and request ID are retained in the delivery JSON.

Fishing families and clinic patients crowd into overloaded boats in a harbour under fire at the wrong tide. A harbourmaster pushes a child aboard while the Stormglass rearguard holds the palm-lined coast road and the boats remain tied.

## Validation and provenance

- Inspected generated plates for scene, cast, material detail and zero legible text. Corrected equipment lettering, the corporal's missing right arm, Okafor's signing action, Vane's gaze, and the brass signalling horn.
- Checked PNG signatures, dimensions, bit depth and RGB color type on all 10 final files.
- Executed the existing `getDossierArt` and `resolveCodexArtFile` functions for every delivered slot; all resolve to the expected private PNG and `/codex-art/flags/<slug>.png` URL. No authenticated browser page-load check was performed.
- Read the four current chapter boards through a read-only database query and checked the existing character portraits.
- No application code, manifest, rebuild or restart was needed.
- Exact generation prompts, correction prompts, source paths and rejection errors: [KESTREL_TO_ARCADIA_DELIVERY.json](KESTREL_TO_ARCADIA_DELIVERY.json).
- Per-file technical checks: [KESTREL_TO_ARCADIA_VERIFICATION.json](KESTREL_TO_ARCADIA_VERIFICATION.json).
