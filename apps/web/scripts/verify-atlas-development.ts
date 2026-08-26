import dotenv from "dotenv";
import path from "node:path";
import { createPrismaClient } from "@habitat/db/client";
import { stableAtlasJson } from "./lib/atlas-integrity";
import { assertAtlasPersistentDevelopmentTarget, assertAtlasV2SchemaPresent, captureAtlasV1LegacySnapshot } from "./lib/atlas-v2-activation";
import { resolveAtlasDevelopmentDatabaseUrl } from "../lib/atlas-development-database";

const root = path.resolve(process.cwd(), "..", "..");
dotenv.config({ path: path.join(root, ".env"), quiet: true });
dotenv.config({ path: path.join(root, ".env.local"), override: true, quiet: true });
const developmentUrl = resolveAtlasDevelopmentDatabaseUrl(process.env);
if (developmentUrl) process.env.DATABASE_URL = developmentUrl;

const targetUrl = process.env.DATABASE_URL;
if (!targetUrl) throw new Error("DATABASE_URL must be configured in .env.local for Atlas development verification.");
const target = assertAtlasPersistentDevelopmentTarget(targetUrl);
const database = createPrismaClient(targetUrl);

async function main() {
  try {
    await assertAtlasV2SchemaPresent(database);
    const [nodes, boundaries, rings, references, connections, paths, legacyConnections, legacySnapshot] = await Promise.all([
      database.storyMapTopologyNode.count(), database.storyMapBoundary.count(), database.storyMapAreaRing.count(), database.storyMapAreaRingBoundary.count(), database.storyWorldConnection.count(), database.storyMapConnectionPath.count(),
      database.storyEntry.findMany({ where: { kind: "REGION" }, select: { meta: true } }),
      captureAtlasV1LegacySnapshot(database),
    ]);
    const legacyRows = legacyConnections.reduce((total, entry) => total + (Array.isArray((entry.meta as { connections?: unknown } | null)?.connections) ? (entry.meta as { connections: unknown[] }).connections.length : 0), 0);
    process.stdout.write(stableAtlasJson({ contract: "martino-atlas-development-environment", contractVersion: 2, environment: process.env.HABITAT_ENVIRONMENT, database: target, atlasSchema: "APPLIED", atlasV2: { topologyNodes: nodes, boundaries, areaRings: rings, ringBoundaryReferences: references, worldConnections: connections, additiveWorldConnections: Math.max(0, connections - 25), connectionPaths: paths, activated: nodes === 27 && boundaries === 36 && rings === 14 && references === 55 && connections === 27 && paths === 11, worldTopology: { nodes: 19, boundaries: 26, rings: 11, references: 43 }, bloomfallTopology: { nodes: 8, boundaries: 10, rings: 3, references: 12, paths: 2 } }, legacyV1: { connectionRows: legacyRows, fingerprint: legacySnapshot.fingerprint, present: legacyRows === 25 }, featureFlag: process.env.HABITAT_ATLAS_V2_INTERNAL_ENABLED?.trim().toLowerCase() === "true" }));
  } finally {
    await database.$disconnect();
  }
}

void main();
