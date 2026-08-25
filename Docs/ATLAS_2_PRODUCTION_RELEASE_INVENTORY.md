# Martino Atlas V2 production release inventory

Release inventory frozen for the owner-approved production cutover on 2026-08-25. Paths below are repository-relative. The production deployment must be built from a commit containing every `RUNTIME_REQUIRED`, `MIGRATION_REQUIRED`, and `ART_REQUIRED` path.

## RUNTIME_REQUIRED

- `apps/web/app/codex/map/page.tsx`
- `apps/web/app/codex-map/[slug]/[version]/route.ts`
- `apps/web/app/story-atlas.css`
- `apps/web/components/story-atlas.tsx` (V1 rollback)
- `apps/web/components/story-atlas-v2.tsx`
- `apps/web/lib/atlas-v2-feature.ts`
- `apps/web/lib/story-atlas.ts`
- `apps/web/lib/story-atlas-art.ts`
- `apps/web/lib/story-atlas-v2.ts`
- `apps/web/lib/story-atlas-v2-experience.ts`
- `apps/web/lib/story-atlas-v2-projection.ts`
- `apps/web/scripts/activate-atlas-v2.ts`
- `apps/web/scripts/capture-atlas-production-baseline.ts`
- `apps/web/scripts/report-atlas-v2-parity.ts`
- `apps/web/scripts/verify-atlas-v2-activation.ts`
- `apps/web/scripts/verify-canonical-atlas-routes.ts`
- `apps/web/scripts/lib/atlas-canonical-routes.ts`
- `apps/web/scripts/lib/atlas-canonical-topology.ts`
- `apps/web/scripts/lib/atlas-integrity.ts`
- `apps/web/scripts/lib/atlas-migration-rehearsal.ts`
- `apps/web/scripts/lib/atlas-v2-activation.ts`
- `apps/web/package.json`
- `packages/shared/src/atlas-connection.ts`
- `packages/shared/src/atlas-coordinate.ts`
- `packages/shared/src/atlas-geometry.ts`
- `packages/shared/src/atlas-spatial.ts`
- `packages/shared/src/atlas-topology.ts`
- `packages/shared/src/atlas-v2-projection.ts`
- `packages/shared/src/atlas-validation.ts`
- `packages/shared/src/story-map.ts`
- `Docs/atlas-migration-manifests/atlas-v1-connections.json`
- `Docs/atlas-migration-rehearsal/atlas-v2-connection-candidates.json`
- `Docs/atlas-migration-rehearsal/atlas-v2-derived-geometry.json`
- `Docs/atlas-migration-rehearsal/atlas-v2-topology-manifest.json`
- `Docs/atlas-route-authoring-backlog.json`

## MIGRATION_REQUIRED

- `packages/db/prisma/schema.prisma`
- `packages/db/prisma/migrations/20260824230000_add_atlas_topology_connections/migration.sql`

The earlier Story Atlas migrations remain part of normal repository history. The production cutover is permitted to apply only `20260824230000_add_atlas_topology_connections` because all earlier migrations are already applied.

## ART_REQUIRED

- `apps/web/private/codex-art/maps/candidates/martino-world-map-v2-clean-production-candidate.png`
- `apps/web/private/codex-art/maps/martino-world-map-v1.png` (V1 rollback)

The frozen V2 raster SHA-256 is `427bf4967afa8a96afa2175d5aed261225cf7fbeed17944be527f4616b5713b6`.

## DEVELOPMENT_ONLY

- `apps/web/app/admin/story/atlas/actions.ts`
- `apps/web/app/admin/story/atlas/page.tsx`
- `apps/web/components/atlas-authoring-workbench.tsx`
- `apps/web/lib/atlas-authoring-environment.ts`
- `apps/web/lib/atlas-authoring.ts`
- `apps/web/scripts/author-canonical-atlas-routes.ts`
- `apps/web/scripts/start-atlas-development.ts`
- `apps/web/scripts/verify-atlas-authoring.ts`
- `apps/web/scripts/verify-atlas-development.ts`
- `packages/db/scripts/manage-atlas-test-database.ts`

These files are committed so the accepted authoring workflow is reproducible, but production author mode remains disabled and unadvertised.

## DOCUMENTATION_ONLY

- `Docs/ATLAS_2_CONTRACT.md`
- `Docs/ATLAS_2_PRODUCTION_RELEASE_INVENTORY.md`
- `Docs/BUILD_STATUS.md`
- `Docs/MARTINO_INTERACTIVE_ATLAS_PLAN.md`
- `Docs/atlas-migration-rehearsal/ATLAS_2_OWNER_REVIEW.md`

## GENERATED_REVIEW_ONLY

- `Docs/atlas-migration-rehearsal/atlas-v2-review.html`
- `Docs/atlas-migration-rehearsal/atlas-v2-topology-review.svg`
- `Docs/atlas-acceptance-evidence/`
- non-production map candidates under `Docs/map-concepts/`, `Docs/atlas-master-v2-candidate/`, and `apps/web/private/codex-art/maps/candidates/`

The untracked acceptance screenshots are intentionally excluded from the executable release commit. They are preserved in the worktree and are not production dependencies.

## Release controls

- V2 production default is controlled by `HABITAT_ATLAS_V2_PRODUCTION_DEFAULT_ENABLED=true` in a production Node process.
- Explicit `?atlas=v1` always selects V1.
- Stage 1 internal V2 requires `HABITAT_ATLAS_V2_INTERNAL_ENABLED=true` and an ADMIN requesting `?atlas=v2`.
- Atlas author mode additionally requires the development-only authoring environment contract; it must not be configured in production.
- Activation is additive and transactionally writes only locked topology, migrated semantic connections, approved paths, and their audit revisions.
- The destructive seed reconciliation is not part of deployment.
