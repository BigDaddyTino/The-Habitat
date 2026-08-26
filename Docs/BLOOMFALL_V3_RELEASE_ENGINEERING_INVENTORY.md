# Bloomfall V3 release-engineering inventory

Captured before Prompt 6A mutations on 2026-08-25.

## Starting Git state

- Branch: `main`
- HEAD: `d292b9455106914f13c33b4f513f8ebbd57b458a`
- `origin/main`: `d292b9455106914f13c33b4f513f8ebbd57b458a`
- Divergence: `0 ahead / 0 behind`
- Modified tracked files: `26`
- Deleted tracked files: `0`
- Untracked files: `264`
- Total untracked bytes: `496062071` (`473.08 MiB`)
- Untracked private-art files: `217`
- Untracked private-art bytes: `495314606` (`472.37 MiB`)
- Tracked repository files: `1027`

The dirty state is entirely attributable to validated Prompt 1–5B, V1/V2/V3 visual history, the failed guarded cutover report, and the new V3 owner lock. No unrelated user work was identified.

## Classification manifest

### RELEASE_SOURCE

Canonical rename/content, hierarchy, Atlas projection/search, publication guards, shared domain types, audits, deterministic activation libraries, package scripts, Codex Sync export logic, and exact migration/route verification:

- `apps/codex-sync/package.json`
- `apps/codex-sync/src/snapshot.ts`
- `apps/codex-sync/src/verify-bloomfall-development.ts`
- `apps/web/app/api/codex/maps/search/route.ts`
- `apps/web/app/codex/bible/[slug]/page.tsx`
- `apps/web/components/story-atlas-v2.tsx`
- `apps/web/lib/bloomfall-reach-content.ts`
- `apps/web/lib/story-atlas-art.ts`
- `apps/web/lib/story-atlas-v2-projection.ts`
- `apps/web/lib/story-atlas.ts`
- `apps/web/lib/story-library.ts`
- `apps/web/package.json`
- `apps/web/scripts/activate-bloomfall-local-atlas.ts`
- `apps/web/scripts/audit-bloomfall-reach-content.ts`
- `apps/web/scripts/audit-bloomfall-reach.ts`
- `apps/web/scripts/audit-geographic-hierarchy.ts`
- `apps/web/scripts/audit-peninsula-dossier.ts`
- `apps/web/scripts/implement-bloomfall-reach-content.ts`
- `apps/web/scripts/lib/atlas-canonical-topology.ts`
- `apps/web/scripts/lib/atlas-integrity.ts`
- `apps/web/scripts/lib/atlas-migration-rehearsal.ts`
- `apps/web/scripts/lib/atlas-v2-activation.ts`
- `apps/web/scripts/lib/bloomfall-local-atlas-activation.ts`
- `apps/web/scripts/lib/bloomfall-local-atlas.ts`
- `apps/web/scripts/lib/geographic-hierarchy-repair.ts`
- `apps/web/scripts/lib/geographic-hierarchy.ts`
- `apps/web/scripts/plan-bloomfall-local-atlas.ts`
- `apps/web/scripts/rehearse-bloomfall-local-atlas.ts`
- `apps/web/scripts/rename-bloomfall-reach.ts`
- `apps/web/scripts/repair-geographic-hierarchy.ts`
- `apps/web/scripts/report-atlas-v2-parity.ts`
- `apps/web/scripts/seed-story-atlas.ts`
- `apps/web/scripts/verify-atlas-authoring.ts`
- `apps/web/scripts/verify-atlas-development.ts`
- `apps/web/scripts/verify-atlas-v2-activation.ts`
- `apps/web/scripts/verify-canonical-atlas-routes.ts`
- `packages/shared/src/bloomfall-reach.ts`
- `packages/shared/src/index.ts`
- `packages/shared/src/story-map.ts`

### RELEASE_TEST

- `apps/web/lib/atlas-migration-rehearsal.test.ts`
- `apps/web/lib/bloomfall-local-atlas.test.ts`
- `apps/web/lib/bloomfall-reach-content.test.ts`
- `apps/web/lib/bloomfall-reach.test.ts`
- `apps/web/lib/geographic-hierarchy.test.ts`
- `apps/web/lib/story-atlas-art.test.ts`
- `apps/web/lib/story-map-publication.test.ts`

### RELEASE_DOC

- `Docs/ATLAS_2_CONTRACT.md`
- `Docs/BUILD_STATUS.md`
- `Docs/BLOOMFALL_REACH_CAMPAIGN_DEFERRAL.md`
- `Docs/BLOOMFALL_REACH_CANON.md`
- `Docs/BLOOMFALL_REACH_CANON_ARCHITECTURE.md`
- `Docs/BLOOMFALL_REACH_FOUNDATION.md`
- `Docs/bloomfall-local-atlas/bloomfall-local-atlas-manifest.json`
- `Docs/bloomfall-local-atlas/prompt-5-verification.json`
- `Docs/geographic-hierarchy/development-before.json`
- `Docs/geographic-hierarchy/development-after.json`
- `Docs/geographic-hierarchy/production-comparison.json`
- `Docs/geographic-hierarchy/prompt-5b-verification.json`
- `Docs/BLOOMFALL_V3_PRODUCTION_CUTOVER_REPORT.md`
- `Docs/BLOOMFALL_VISUAL_RESET_V3_CANON_DIRECTION.md`
- `Docs/BLOOMFALL_VISUAL_RESET_V3_PROMPTS.md`
- `Docs/BLOOMFALL_VISUAL_RESET_V3_REPORT.md`

### PRODUCTION_V3_ASSET

Exactly 15 selected V3 source candidates exist under the ignored local generation tree. Prompt 6A will copy them byte-for-byte into explicit tracked production destinations and record source/destination SHA-256 values in one authoritative V3 release manifest. No V1/V2 image is eligible for those bindings.

### HISTORICAL_VISUAL_EVIDENCE

- `apps/web/private/codex-art/bloomfall/**`: 216 files, `468.83 MiB` after excluding the separately required local V1 map raster.
- Six superseded V1/V2 visual-direction Markdown files.
- Four local visual build/review scripts.

These remain on disk and are narrowly ignored. They include generation sources, rejected/revise iterations, comparisons, overlays, native crops, contact sheets, galleries, and previous visual-package manifests. They are not deleted.

### GENERATED_REHEARSAL_EVIDENCE

The two local-Atlas JSON files and four hierarchy JSON files are deterministic validation evidence and belong in `RELEASE_DOC`; they are small, reviewable, and required to explain the validated state.

### TEMPORARY

No standalone browser download, screenshot, log, or temporary-server artifact was found in the Git inventory.

### UNRELATED

No unrelated dirty file was identified. This classification does not authorize future unrelated files to be staged.

### DO_NOT_COMMIT

- Entire local Bloomfall generation/review tree.
- Rejected or revise V1/V2/V3 rasters.
- Comparisons, crops, overlays, contact sheets, and HTML galleries.
- Superseded V1/V2 visual-direction documents.
- Local visual evidence build/serve scripts.

## Hygiene rules

- `git add -A` is prohibited.
- Every checkpoint uses explicit pathspec staging.
- Before every commit, cached stat and name-status are reviewed.
- Required production assets are never covered by the visual-history ignore rule.
- Local evidence remains recoverable in the working directory.
