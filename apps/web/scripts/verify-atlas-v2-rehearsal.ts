import "../lib/environment";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { createPrismaClient } from "@habitat/db/client";
import { stableAtlasJson } from "./lib/atlas-integrity";
import { assertAtlasRehearsalTarget, buildAtlasRehearsalPlan, type AtlasV1ConnectionManifest, type AtlasV1GeometryManifest } from "./lib/atlas-migration-rehearsal";
import { verifyAtlasRehearsalDatabase } from "./lib/atlas-rehearsal-db";

const repositoryRoot = path.resolve(process.cwd(), "..", "..");
const sourceUrl = process.env.DATABASE_URL;
const targetUrl = process.env.ATLAS_REHEARSAL_DATABASE_URL;
if (!sourceUrl || !targetUrl) throw new Error("DATABASE_URL and explicit ATLAS_REHEARSAL_DATABASE_URL are required.");
const canonicalSourceUrl = sourceUrl;
const explicitTargetUrl = targetUrl;
async function main() {
  const identity = assertAtlasRehearsalTarget(canonicalSourceUrl, explicitTargetUrl);
  const directory = path.join(repositoryRoot, "Docs", "atlas-migration-manifests");
  const connectionManifest = JSON.parse(await readFile(path.join(directory, "atlas-v1-connections.json"), "utf8")) as AtlasV1ConnectionManifest;
  const geometryManifest = JSON.parse(await readFile(path.join(directory, "atlas-v1-geometry.json"), "utf8")) as AtlasV1GeometryManifest;
  const plan = buildAtlasRehearsalPlan(connectionManifest, geometryManifest);
  const target = createPrismaClient(explicitTargetUrl);
  try {
    const verification = await verifyAtlasRehearsalDatabase(target, connectionManifest, plan.connectionCandidates, plan.topologyTrace);
    process.stdout.write(stableAtlasJson({ rehearsalDatabase: identity.targetDatabase, verification }));
  } finally {
    await target.$disconnect();
  }
}

void main();
