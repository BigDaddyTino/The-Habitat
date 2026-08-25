import "../lib/environment";
import { readFile, stat } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { createPrismaClient } from "@habitat/db/client";
import { atlasSha256, stableAtlasJson } from "./lib/atlas-integrity";
import type { AtlasCanonicalTopologyTrace } from "./lib/atlas-canonical-topology";
import type { AtlasConnectionCandidate, AtlasV1ConnectionManifest } from "./lib/atlas-migration-rehearsal";
import { loadAtlasCanonicalRouteBacklog } from "./lib/atlas-canonical-routes";
import { activateAtlasV2, assertAtlasV2ActivationTarget, cleanupAtlasV2Activation, verifyAtlasV2ArtifactHash } from "./lib/atlas-v2-activation";

const root = path.resolve(process.cwd(), "..", "..");
const sourceUrl = process.env.DATABASE_URL;
const targetUrl = process.env.ATLAS_V2_ACTIVATION_DATABASE_URL;
if (!sourceUrl || !targetUrl) throw new Error("DATABASE_URL and explicit ATLAS_V2_ACTIVATION_DATABASE_URL are required.");
const identity = assertAtlasV2ActivationTarget(sourceUrl, targetUrl);
const frozenRasterHash = "427bf4967afa8a96afa2175d5aed261225cf7fbeed17944be527f4616b5713b6";

async function load() {
  const rehearsal = path.join(root, "Docs", "atlas-migration-rehearsal");
  const manifestBytes = await readFile(path.join(rehearsal, "atlas-v2-topology-manifest.json"));
  const derivedBytes = await readFile(path.join(rehearsal, "atlas-v2-derived-geometry.json"));
  const candidateBytes = await readFile(path.join(rehearsal, "atlas-v2-connection-candidates.json"));
  const routeBytes = await readFile(path.join(root, "Docs", "atlas-route-authoring-backlog.json"));
  verifyAtlasV2ArtifactHash("topologyManifest", manifestBytes);
  verifyAtlasV2ArtifactHash("derivedGeometry", derivedBytes);
  verifyAtlasV2ArtifactHash("connectionCandidates", candidateBytes);
  verifyAtlasV2ArtifactHash("canonicalRoutes", routeBytes);
  const connectionManifest = JSON.parse(await readFile(path.join(root, "Docs", "atlas-migration-manifests", "atlas-v1-connections.json"), "utf8")) as AtlasV1ConnectionManifest;
  const backlog = await loadAtlasCanonicalRouteBacklog(root);
  const routes = backlog.routes.filter((route) => route.status === "AUTHOR_NOW");
  if (routes.length !== 9) throw new Error(`Production route release requires exactly 9 approved paths, received ${routes.length}.`);
  const raster = await readFile(path.join(root, "apps", "web", "private", "codex-art", "maps", "candidates", "martino-world-map-v2-clean-production-candidate.png"));
  const rasterHash = atlasSha256(raster);
  if (rasterHash !== frozenRasterHash) throw new Error(`Frozen Atlas raster hash mismatch: expected ${frozenRasterHash}, received ${rasterHash}.`);
  return { trace: JSON.parse(manifestBytes.toString("utf8")) as AtlasCanonicalTopologyTrace, candidates: (JSON.parse(candidateBytes.toString("utf8")) as { candidates: AtlasConnectionCandidate[] }).candidates, connectionManifest, routes, rasterHash };
}

async function assertProductionReleasePreconditions() {
  if (identity.mode !== "PRODUCTION") return null;
  const releaseHead = process.env.ATLAS_V2_RELEASE_HEAD?.trim().toLowerCase();
  const actualHead = execFileSync("git", ["rev-parse", "HEAD"], { cwd: root, encoding: "utf8" }).trim().toLowerCase();
  if (!releaseHead || releaseHead !== actualHead) throw new Error(`Production Atlas activation release HEAD mismatch: expected ${releaseHead ?? "missing"}, actual ${actualHead}.`);
  const expectedBuildId = process.env.ATLAS_V2_EXPECTED_BUILD_ID?.trim();
  const actualBuildId = (await readFile(path.join(root, "apps", "web", ".next", "BUILD_ID"), "utf8")).trim();
  if (!expectedBuildId || expectedBuildId !== actualBuildId) throw new Error(`Production Atlas activation build identity mismatch: expected ${expectedBuildId ?? "missing"}, actual ${actualBuildId}.`);
  const backupPath = process.env.ATLAS_V2_PRODUCTION_BACKUP_PATH?.trim();
  if (!backupPath || !path.isAbsolute(backupPath) || path.extname(backupPath).toLowerCase() !== ".dump") throw new Error("Production Atlas activation requires an absolute custom-format backup dump path.");
  const backup = await stat(backupPath);
  if (!backup.isFile() || backup.size <= 0) throw new Error("Production Atlas activation backup is missing or empty.");
  if (Date.now() - backup.mtimeMs > 2 * 60 * 60 * 1000) throw new Error("Production Atlas activation backup is older than two hours.");
  if (process.env.ATLAS_V2_BACKUP_VERIFICATION !== "PG_RESTORE_LIST_OK") throw new Error("Production Atlas activation requires successful pg_restore list verification.");
  const expectedLegacyFingerprint = process.env.ATLAS_V2_EXPECTED_LEGACY_FINGERPRINT?.trim().toLowerCase();
  if (!expectedLegacyFingerprint || !/^[a-f0-9]{64}$/.test(expectedLegacyFingerprint)) throw new Error("Production Atlas activation requires the exact pre-cutover legacy fingerprint.");
  return { releaseHead: actualHead, buildId: actualBuildId, backupPath, backupBytes: backup.size, expectedLegacyFingerprint };
}

async function main() {
  const database = createPrismaClient(targetUrl!);
  try {
    const release = await assertProductionReleasePreconditions();
    const input = await load();
    if (process.argv.includes("--cleanup")) {
      const counts = await cleanupAtlasV2Activation(database, process.env.ATLAS_V2_CLEANUP_CONFIRM ?? "", input.connectionManifest, input.candidates, input.trace, input.routes);
      process.stdout.write(stableAtlasJson({ action: "CLEANUP", identity, release, counts }));
      return;
    }
    if (process.argv.includes("--prove-rollback")) {
      await activateAtlasV2(database, input.connectionManifest, input.candidates, input.trace, input.routes, { injectFailureAfterConnections: true, expectedLegacyFingerprint: release?.expectedLegacyFingerprint }).then(
        () => { throw new Error("The intentional Atlas V2 rollback probe unexpectedly committed."); },
        (error: unknown) => { if (!(error instanceof Error) || !error.message.includes("INTENTIONAL_ATLAS_V2_ACTIVATION_ROLLBACK")) throw error; },
      );
    }
    const result = await activateAtlasV2(database, input.connectionManifest, input.candidates, input.trace, input.routes, { expectedLegacyFingerprint: release?.expectedLegacyFingerprint });
    process.stdout.write(stableAtlasJson({ identity, release, rasterHash: input.rasterHash, rollbackProof: process.argv.includes("--prove-rollback") ? "PASSED" : "NOT_REQUESTED", result }));
  } finally {
    await database.$disconnect();
  }
}

void main();
