# Bloomfall Reach — System-Aware Route Authoring Report

Status: development authoring complete; owner review pending; runtime implementation deferred

Target: guarded loopback `habitat_atlas_dev` only

Principle: `WORLD CONNECTION` is semantic, `CONNECTION PATH` is stable scene geometry, and `ROUTE STATE` is future authoritative gameplay usability. None substitutes for another.

## 1. Existing route audit

| Route | Semantic endpoints | Type | Class | Result |
|---|---|---|---|---|
| Riverlands / Ashline historical corridor | Bloomfall Reach ↔ Riverlands | `ROAD` | `PERMANENT` | Preserved exactly; the local path enters through Ashline, reaches Southreach, and retains the Redline spur. Geometry SHA `e44319339df39f39295e618ccd9ec801160e44a131cb67a6dff3d17e062de2f7`. |
| Drowned Intake / Ocean approach | Bloomfall Reach ↔ The Ocean | `SEA_ROUTE` | `CONDITIONAL` | Preserved exactly; the stable shallow-draft alignment remains hazardous and hydrology-owned. Geometry SHA `013098b8a69cf266114519c62b8bf20e9007cfdc95c681a8e4a1271410d948e4`. |

Both path IDs, geometries, zooms, and priorities remain unchanged. Prompt D updated only their semantic metadata/editorial notes through optimistic-version writes and StoryRevision records.

## 2. Candidate inventory

Twelve candidates were reviewed: the two existing local paths; Cairnwood–Glassroot; Southreach reserve/service rail; Walking Orchard–Reedless; Reedless openings; Long Graze herd travel; Heartfen openings; secondary Living Marsh waterways; Riverlands world continuation; Ocean world continuation; and Magic-Torn adjacency.

The requested exact standalone Codex records `bloomstorms` and `roaming-aberrants` do not currently exist. No page was fabricated. Review used the current canonical Systems records `essence-saturation`, `reactor-cycles`, `harvesting-consequences`, `bloomfall-environmental-hazards`, and `aberrant-escalation`, plus the Prompt A architecture's Bloomstorm and roaming-threat rules.

## 3. Final classification

| Route key | Classification | Persistence decision |
|---|---|---|
| `riverlands-ashline-corridor` | `PERMANENT` | preserve current path |
| `drowned-intake-ocean-approach` | `CONDITIONAL` | preserve stable base path |
| `cairnwood-glassroot-expedition-trail` | `CONDITIONAL` | author stable base path now |
| `southreach-service-rail-alignment` | `CONDITIONAL` | author stable base path now |
| `walking-orchard-reedless-moving-corridor` | `DYNAMIC` | do not persist |
| `reedless-mile-openings` | `DYNAMIC` | do not persist |
| `long-graze-herd-corridor` | `DYNAMIC` | do not persist |
| `heartfen-openings` | `DYNAMIC` | do not persist |
| `living-marsh-secondary-waterways` | `DYNAMIC` | do not persist |
| `riverlands-world-continuation` | `DEFERRED` | semantic/local support only |
| `ocean-world-continuation` | `DEFERRED` | semantic/local support only |
| `magic-torn-adjacency` | `DEFERRED` | adjacency only; no connection |

Definitions are locked in the manifest: Permanent retains stable identity; Conditional retains stable geometry while usability changes; Dynamic geometry is system-selected/moving and absent from base topology; Deferred lacks sufficient art, canon, endpoint, or runtime evidence.

## 4. Cairnwood ↔ Glassroot

Final decision: `CONDITIONAL`, `AUTHOR_NOW` for one stable surveyed base trail.

The current Codex establishes Cairnwood as the principal modern survey camp, Glassroot as the Belt research station, and Belt travel as dependent on recent field knowledge. The V3 map supports a continuous terrain-following expedition alignment between the exact POI anchors. Its identity persists, but Active/Surge saturation, Bloomstorm exposure, damaged root ground, migration, Bellwether/herd displacement, and stale field reports may raise cost or close it. Reactor state acts only through transferred local pressure; it cannot close the trail remotely.

## 5. Southreach service/rail

Final decision: `CONDITIONAL`, `AUTHOR_NOW` for the missing fixed Reserve Vault Twelve → Southreach Complex → Crown Break service bed, using `OTHER` as the closest existing taxonomy for mixed rail/service/plant infrastructure.

The established Riverlands path already contains Ashline → Southreach and the Redline spur. Those segments were not duplicated. The new line completes the V3-visible northern industrial spine. Dormant may permit manual access; Stabilization provides warning; Restart/Purge may open powered systems or reserve access; Venting raises downwind/downslope hazard; Overflow and Breach may close segments. Last Shift can change access through procedure without changing the underlying bed.

## 6. Walking Orchard

Final decision: `DYNAMIC`. The location and its ecological wake move. A future corridor resolver may select from authored envelopes and current ecology, but no permanent or conditional base line is stored.

## 7. Reedless Mile

Final decision: `DYNAMIC`. Bare substrate creates temporary opportunities on narrow schedules, and `the-route-that-moves` can appear without a storm. The Atlas may show a current observed corridor with freshness, then degrade it to `LOST`; it must not promise a permanent trail.

## 8. Long Graze

Final decision: `DYNAMIC`. This is herd range, not a road. Saturation gradients, resource disturbance, predators, storms, and the Bellwether determine the current corridor. A future herd scheduler owns it; no static path was authored.

## 9. Heartfen

Final decision: `DYNAMIC` access or route-less exploration. Heartfen receives no convenient road. Current openings belong to marsh coordination/hydrology and may be `UNVERIFIED` even when world-authoritatively present.

## 10. Marsh waterways

| Waterway | Classification |
|---|---|
| Drowned Intake → Ocean shallows | `CONDITIONAL CHANNEL`; stable base alignment already persisted |
| Blackweir → Drowned Intake working reach | `CONDITIONAL CHANNEL`; represented inside the existing Ocean approach, not duplicated |
| Blackweir controlled local channels | `DYNAMIC CHANNEL` |
| Reedless Mile crossings | `DYNAMIC CHANNEL` |
| Heartfen openings | `DYNAMIC CHANNEL` |
| Lantern Pools | `NO CANONICAL ROUTE`; local refuge/research water, not a through-channel |
| Other secondary Marsh passages | `DYNAMIC CHANNEL`; no persisted line |

## 11. World Riverlands path

Decision: `DEFER`. V3 establishes landmass adjacency and regional context, not an exact world-scene road. The semantic `ROAD` plus the approved local Ashline continuation remain authoritative.

## 12. World Ocean path

Decision: `DEFER`. V3 shows the coast and marsh edge but not a defensible exact shallow-draft world continuation. The semantic `SEA_ROUTE` plus the local Drowned Intake base alignment remain authoritative.

## 13. Magic-Torn

Confirmed: geographic adjacency only. Current Codex has not materially changed this ruling. Connections created: zero. Paths created: zero. No road, trail, hidden passage, or speculative travel semantics were added.

## 14. New persisted paths

| Source | Destination | Type | Vertices | Geometry SHA-256 |
|---|---|---:|---:|---|
| Cairnwood Camp | Glassroot Observatory | `TRAIL` | 9 | `60c80be021bc043582c87b65c6f208c4394d6e9e7fadf7b4a2a7288ed1d756a1` |
| Reserve Vault Twelve | Crown Break, via Southreach Complex | `OTHER` | 9 | `260ef0c3edb6ea0ee2ed3f80aa0312b8f4eba85b89ebc55e66ebd2e91d7cc809` |

All coordinates are integer, in bounds, terrain/infrastructure-aligned, endpoint-exact, and distinct from every existing path.

## 15. Total local paths

Before: 2. After: 4. New: 2. Existing preserved: 2. Dynamic persisted: 0.

## 16. Conditional route architecture

Stable connections carry bounded existing JSON metadata: `routeClass`, `conditionOwner`, `systemDependencies`, `defaultAvailability`, `defaultKnowledge`, and `stableGeometry`. A future server/world route service owns `OPEN / DANGEROUS / CLOSED`; it records cause and time against the stable route ID. Reactor, saturation, Bloomstorms, harvesting pressure, and Aberrants are only included where causal. No seven-state alternate geometry set was authored.

## 17. Dynamic route architecture

Walking Orchard/Reedless, Long Graze, Heartfen, and secondary channels belong to future ecology/hydrology/herd resolvers. Runtime may select a temporary path from reviewed corridor candidates, publish freshness-limited knowledge, and remove it when conditions change. Base Atlas topology stores none of these geometries. No runtime resolver, timer, simulation, blocker, save state, or replication was implemented.

## 18. Atlas presentation

- Permanent: standard restrained route line; state treatment only for a changed segment.
- Conditional: stable line remains, with subtle OPEN/DANGEROUS/CLOSED treatment and information freshness.
- Dynamic: render only a current observed/forecast corridor or fuzzy envelope; never a default permanent line.
- Deferred: render nothing.

Only one analytical ecology overlay should be active at once. Route state may remain as the restrained secondary layer. Accessibility must not rely on color alone.

## 19. Review overlay

`apps/web/private/codex-art/bloomfall-routes/review/index.html`

The development-only overlay distinguishes current persisted paths, new AUTHOR_NOW alignments, conditional-base status, and broad dynamic corridor envelopes over the locked V3 local Atlas.

## 20. Route manifest

`Docs/bloomfall-routes/bloomfall-route-status-manifest.json`

Contract: `martino-bloomfall-route-status` v1. Logical SHA-256: `d121d82a754773570adcfb4c8986b0c5c3d7b906b3229da84cdbf26b284a5b5f`.

## 21. Codex travel updates

Changed Codex records: none. Existing route/travel prose already states the required distinctions and no rewrite was justified. Connection metadata and Atlas paths changed only in guarded development data; production Codex changes remain zero.

## 22. Tests

- Atlas canonical route verification: PASS, 13 paths total / 4 Bloomfall local
- Bloomfall route audit: PASS, 12 candidates / 0 failures
- Bloomfall canonical content audit: PASS, 71 resolved references / 0 broken
- Route manifest deterministic validation: PASS
- V3 local/world art SHA alignment: PASS
- Desktop browser QA at 1440 × 1000: PASS, 11 marks, full native map loaded, no horizontal overflow
- Mobile browser QA at 390 × 844: PASS, four legend items, one-column notes, no horizontal overflow
- Web tests: PASS, 432
- Strict typecheck: PASS
- Lint: PASS (the only first-attempt failure was an expected concurrent Prisma-generation directory lock; the sequential rerun passed)
- Production build: PASS, 54/54 static pages generated; existing NFT trace warning unchanged
- Production read-only fingerprint before/after: PASS, `83aa6896d138dc2dbbf8f575bb104738bc525d3acc449dd1f5f6a2653a982ece` both times; 27 world connections and 11 paths both times
- `git diff --check`: PASS

## 23. Git

Commit SHA and final worktree status are recorded at handoff. Intended message: `feat(atlas): author Bloomfall system-aware routes`.

## 24. Production safety

```text
production writes = 0
production migrations = 0
production Atlas changes = 0
production Codex changes = 0
```

No production mutation path was invoked. The route author requires the explicit loopback `habitat_atlas_dev`, the shared Atlas authoring interlock, and a confirmation token.

## 25. Final decision

`BLOOMFALL_SYSTEM_AWARE_ROUTES_READY_FOR_OWNER_REVIEW`

## 26. Next recommendation

If the owner approves this classification and the two new base alignments, proceed with **PROMPT E — BLOOMFALL RUNTIME SYSTEM IMPLEMENTATION PLAN**. That planning phase should translate Prompts A, B, and D into Unreal/runtime architecture for Essence Saturation, Reactor Cycles, Adaptive Mutation, Bloomstorms, Harvesting Consequences, Roaming Aberrants, and conditional/dynamic travel. Prompt E was not executed here.
