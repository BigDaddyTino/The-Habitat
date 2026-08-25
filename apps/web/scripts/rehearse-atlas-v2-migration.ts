import "../lib/environment";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { stableAtlasJson } from "./lib/atlas-integrity";
import { buildAtlasRehearsalPlan, type AtlasV1ConnectionManifest, type AtlasV1GeometryManifest } from "./lib/atlas-migration-rehearsal";
import { applyAtlasRehearsal, assertSourceSnapshotMatchesConnectionManifest, connectAtlasRehearsalDatabases, loadAtlasRehearsalSourceSnapshot, newAtlasTableCounts, verifyAtlasRehearsalDatabase } from "./lib/atlas-rehearsal-db";

const repositoryRoot = path.resolve(process.cwd(), "..", "..");
const sourceUrl = process.env.DATABASE_URL;
const targetUrl = process.env.ATLAS_REHEARSAL_DATABASE_URL;
if (!sourceUrl || !targetUrl) throw new Error("DATABASE_URL and explicit ATLAS_REHEARSAL_DATABASE_URL are required.");
const canonicalSourceUrl = sourceUrl;
const explicitTargetUrl = targetUrl;

async function main() {
  const directory = path.join(repositoryRoot, "Docs", "atlas-migration-manifests");
  const connectionManifest = JSON.parse(await readFile(path.join(directory, "atlas-v1-connections.json"), "utf8")) as AtlasV1ConnectionManifest;
  const geometryManifest = JSON.parse(await readFile(path.join(directory, "atlas-v1-geometry.json"), "utf8")) as AtlasV1GeometryManifest;
  const plan = buildAtlasRehearsalPlan(connectionManifest, geometryManifest);
  const databases = connectAtlasRehearsalDatabases(canonicalSourceUrl, explicitTargetUrl);
  try {
    const snapshot = await loadAtlasRehearsalSourceSnapshot(databases.source);
    const sourceParity = assertSourceSnapshotMatchesConnectionManifest(snapshot, connectionManifest);
    if (process.argv.includes("--prove-rollback")) {
      const before = await newAtlasTableCounts(databases.target);
      if (Object.values(before).some((count) => count !== 0)) throw new Error("Rollback proof requires a fresh rehearsal target with empty Atlas 2.0 tables.");
      await applyAtlasRehearsal(databases.target, snapshot, connectionManifest, plan.connectionCandidates, plan.topologyTrace, { injectFailureAfterConnections: true }).then(
        () => { throw new Error("The intentional rollback probe unexpectedly committed."); },
        (error: unknown) => { if (!(error instanceof Error) || !error.message.includes("INTENTIONAL_REHEARSAL_ROLLBACK_PROBE")) throw error; },
      );
      const after = await newAtlasTableCounts(databases.target);
      if (stableAtlasJson(before, false) !== stableAtlasJson(after, false)) throw new Error("The intentional failure left partial Atlas rehearsal rows.");
    }
    await applyAtlasRehearsal(databases.target, snapshot, connectionManifest, plan.connectionCandidates, plan.topologyTrace);
    const verification = await verifyAtlasRehearsalDatabase(databases.target, connectionManifest, plan.connectionCandidates, plan.topologyTrace);
    process.stdout.write(stableAtlasJson({
      sourceDatabase: databases.identities.sourceDatabase,
      rehearsalDatabase: databases.identities.targetDatabase,
      sourceTransaction: "READ_ONLY_REPEATABLE_READ",
      sourceWrites: 0,
      sourceConnectionParity: sourceParity,
      copiedSupportRows: { users: snapshot.users.length, entries: snapshot.entries.length, maps: snapshot.maps.length, placements: snapshot.placements.length },
      rollbackProof: process.argv.includes("--prove-rollback") ? "PASSED" : "NOT_REQUESTED",
      verification,
    }));
  } finally {
    await Promise.all([databases.source.$disconnect(), databases.target.$disconnect()]);
  }
}

void main();
