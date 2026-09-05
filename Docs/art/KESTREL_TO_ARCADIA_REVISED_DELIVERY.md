# Revised three-image delivery

Superseded status: Glasswater is now delivered and the full set is 13/13. See [the final report](GLASSWATER_FINAL_DELIVERY.md). This record preserves the earlier run.

Built-in image_gen, using the user's revised production brief. Two images delivered; Glasswater remains unfilled. Combined with the earlier ten delivered plates, the original set now has 12 of 13 images.

| Output beneath apps/web/private/codex-art/ | Result | Moderation retries in this run | Image-specific checks | Important final deviations |
| --- | --- | --- | --- | --- |
| [regions/wrackline.png](../../apps/web/private/codex-art/regions/wrackline.png) | Delivered | 0 | 6/6 visible | None identified |
| [flags/kestrel-shielded-the-clinic.png](../../apps/web/private/codex-art/flags/kestrel-shielded-the-clinic.png) | Delivered | 0 | 6/6 visible | None identified |
| flags/glasswater-came-aboard.png | Failed; no image returned | 2 | Not assessable | No final image |

## Wrackline inspection

- Engineered wall extends beyond the upper frame.
- Fishing settlement occupies black volcanic sand below it.
- Chapel window is the sole visible warm light on land; cookfire contributes smoke.
- Large old foundation blocks visibly differ from the smaller chapel masonry.
- Plain flat grave slabs lie on the misty left slope.
- Two fishers at far right tip a visible stream of fish from a net into the sea.

One visual correction replaced the initially generated upright grave markers and crosses with plain flat slabs. No moderation rejection occurred.

## Clinic inspection

- Camera is a standing eyewitness within the treatment room.
- Castellan's appearance is consistent with the established portrait: middle-aged South Asian woman, tied grey-streaked hair, lined face, dark tactical clothing and branching forearm veins.
- Her eyes and hands attend to the patient; she is actively working.
- Tables, stretchers, blankets, basins and salvaged supplies establish the improvised clinic.
- Workers install wall plate and roof material while treatment continues.
- The old corrugated Forge roof and damaged camp wall/sandbags are visible through the exterior opening.

One visual correction removed label-like marks from supplies. No moderation rejection occurred.

## Glasswater failure

All three attempts were rejected during output moderation with category `other`; no more specific explanation or image was returned.

1. Initial revised scene: request `762f5ff6-39c1-4686-bc6e-c9fbe3a2ad9d`.
2. Retry 1 omitted distant muzzle flashes, retaining the smoky rearguard position and civilian boarding: request `c13d7757-e496-4ed9-887b-6185cc708390`.
3. Retry 2 showed parent-assisted boarding and a guiding gesture from the harbourmaster: request `79a74d6e-bdc8-44d6-8532-a5ff5cb6f094`.

Intended render: At fading daylight, a radio-holding harbourmaster helps a child aboard while clinic patients and families crowd low-sitting fishing hulls. Taut mooring ropes, exposed low-tide harbour edges and a distant rearguard explain why everyone needs to leave and the boats still cannot.

## Technical verification

Both delivered files have valid PNG signatures, exact dimensions 1672 × 941, 8-bit RGB color type 2 and no alpha. Both resolve through the existing dossier and private art-path resolvers. Glasswater's file remains absent. No code change, rebuild or restart was needed; no authenticated browser page-load check was performed.

[Exact prompts and service errors](KESTREL_TO_ARCADIA_REVISED_DELIVERY.json) · [File verification](KESTREL_TO_ARCADIA_REVISED_VERIFICATION.json)
