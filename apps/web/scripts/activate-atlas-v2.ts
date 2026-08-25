import "../lib/environment";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { createPrismaClient } from "@habitat/db/client";
import { stableAtlasJson } from "./lib/atlas-integrity";
import type { AtlasCanonicalTopologyTrace } from "./lib/atlas-canonical-topology";
import type { AtlasConnectionCandidate, AtlasV1ConnectionManifest } from "./lib/atlas-migration-rehearsal";
import { activateAtlasV2, assertAtlasV2ActivationTarget, cleanupAtlasV2Activation, verifyAtlasV2ArtifactHash } from "./lib/atlas-v2-activation";

const root = path.resolve(process.cwd(), "..", "..");
const sourceUrl = process.env.DATABASE_URL;
const targetUrl = process.env.ATLAS_V2_ACTIVATION_DATABASE_URL;
if (!sourceUrl || !targetUrl) throw new Error("DATABASE_URL and explicit ATLAS_V2_ACTIVATION_DATABASE_URL are required.");
const identity = assertAtlasV2ActivationTarget(sourceUrl, targetUrl);

async function load() {
  const rehearsal = path.join(root, "Docs", "atlas-migration-rehearsal");
  const manifestBytes = await readFile(path.join(rehearsal, "atlas-v2-topology-manifest.json"));
  const derivedBytes = await readFile(path.join(rehearsal, "atlas-v2-derived-geometry.json"));
  const candidateBytes = await readFile(path.join(rehearsal, "atlas-v2-connection-candidates.json"));
  verifyAtlasV2ArtifactHash("topologyManifest", manifestBytes);
  verifyAtlasV2ArtifactHash("derivedGeometry", derivedBytes);
  verifyAtlasV2ArtifactHash("connectionCandidates", candidateBytes);
  const connectionManifest = JSON.parse(await readFile(path.join(root, "Docs", "atlas-migration-manifests", "atlas-v1-connections.json"), "utf8")) as AtlasV1ConnectionManifest;
  return { trace: JSON.parse(manifestBytes.toString("utf8")) as AtlasCanonicalTopologyTrace, candidates: (JSON.parse(candidateBytes.toString("utf8")) as { candidates: AtlasConnectionCandidate[] }).candidates, connectionManifest };
}

async function main() {
  const database = createPrismaClient(targetUrl!);
  try {
    if (process.argv.includes("--cleanup")) {
      const counts = await cleanupAtlasV2Activation(database, process.env.ATLAS_V2_CLEANUP_CONFIRM ?? "");
      process.stdout.write(stableAtlasJson({ action: "CLEANUP", identity, counts }));
      return;
    }
    const input = await load();
    if (process.argv.includes("--prove-rollback")) {
      await activateAtlasV2(database, input.connectionManifest, input.candidates, input.trace, { injectFailureAfterConnections: true }).then(
        () => { throw new Error("The intentional Atlas V2 rollback probe unexpectedly committed."); },
        (error: unknown) => { if (!(error instanceof Error) || !error.message.includes("INTENTIONAL_ATLAS_V2_ACTIVATION_ROLLBACK")) throw error; },
      );
    }
    const result = await activateAtlasV2(database, input.connectionManifest, input.candidates, input.trace);
    process.stdout.write(stableAtlasJson({ identity, rollbackProof: process.argv.includes("--prove-rollback") ? "PASSED" : "NOT_REQUESTED", result }));
  } finally {
    await database.$disconnect();
  }
}

void main();
