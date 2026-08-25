import "../lib/environment";
import { createPrismaClient } from "@habitat/db/client";
import { atlasV2ActivationMigration, captureAtlasV1LegacySnapshot } from "./lib/atlas-v2-activation";
import { stableAtlasJson } from "./lib/atlas-integrity";

const databaseUrl = process.env.ATLAS_V2_VERIFICATION_DATABASE_URL ?? process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("Production Atlas baseline requires a database URL.");
const target = new URL(databaseUrl);
if (!["localhost", "127.0.0.1", "::1"].includes(target.hostname.toLowerCase()) || target.pathname.slice(1) !== "habitat") throw new Error("Production Atlas baseline requires the loopback canonical habitat database.");
if (process.env.ATLAS_V2_VERIFICATION_ENVIRONMENT !== "production" || process.env.ATLAS_V2_VERIFICATION_CONFIRM_DATABASE !== "habitat") throw new Error("Production Atlas baseline requires explicit environment and database confirmation.");
const publicOrigin = new URL(process.env.AUTH_URL ?? process.env.HABITAT_PUBLIC_ORIGIN ?? "http://localhost");
if (["localhost", "127.0.0.1", "::1"].includes(publicOrigin.hostname.toLowerCase())) throw new Error("Production Atlas baseline refuses a local public origin.");

const db = createPrismaClient(databaseUrl);

async function main() {
  const [legacy, migrationRows, placements, questPlacements, regions, entries] = await Promise.all([
    captureAtlasV1LegacySnapshot(db),
    db.$queryRaw<Array<{ migration_name: string }>>`SELECT migration_name FROM "_prisma_migrations" WHERE migration_name = ${atlasV2ActivationMigration} AND finished_at IS NOT NULL AND rolled_back_at IS NULL`,
    db.storyMapPlacement.count(),
    db.storyMapNodePlacement.count(),
    db.storyEntry.count({ where: { kind: "REGION" } }),
    db.storyEntry.count(),
  ]);
  const migrationApplied = migrationRows.length === 1;
  const v2 = migrationApplied ? {
    topologyNodes: await db.storyMapTopologyNode.count(), boundaries: await db.storyMapBoundary.count(), areaRings: await db.storyMapAreaRing.count(), ringBoundaryReferences: await db.storyMapAreaRingBoundary.count(), worldConnections: await db.storyWorldConnection.count(), connectionPaths: await db.storyMapConnectionPath.count(),
  } : { topologyNodes: 0, boundaries: 0, areaRings: 0, ringBoundaryReferences: 0, worldConnections: 0, connectionPaths: 0 };
  process.stdout.write(stableAtlasJson({ contract: "martino-atlas-production-baseline", contractVersion: 1, status: "PASS", database: { host: target.hostname, port: target.port || "5432", name: target.pathname.slice(1) }, migration: { name: atlasV2ActivationMigration, applied: migrationApplied }, legacy: { fingerprint: legacy.fingerprint, maps: legacy.value.maps.length, placements, questPlacements, regionEntries: regions, entries, connections: legacy.value.connections.length }, v2 }));
}

void main().finally(() => db.$disconnect());
