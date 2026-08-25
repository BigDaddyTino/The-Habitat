import "../lib/environment";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { createPrismaClient } from "@habitat/db/client";
import { stableAtlasJson } from "./lib/atlas-integrity";
import type { AtlasCanonicalTopologyTrace } from "./lib/atlas-canonical-topology";
import type { AtlasConnectionCandidate, AtlasV1ConnectionManifest } from "./lib/atlas-migration-rehearsal";
import { assertAtlasV2ActivationTarget, verifyAtlasV2Activation, verifyAtlasV2ArtifactHash } from "./lib/atlas-v2-activation";

const root = path.resolve(process.cwd(), "..", "..");
const sourceUrl = process.env.DATABASE_URL;
const targetUrl = process.env.ATLAS_V2_ACTIVATION_DATABASE_URL;
if (!sourceUrl || !targetUrl) throw new Error("DATABASE_URL and explicit ATLAS_V2_ACTIVATION_DATABASE_URL are required.");
const identity = assertAtlasV2ActivationTarget(sourceUrl, targetUrl);

async function main() {
  const rehearsal = path.join(root, "Docs", "atlas-migration-rehearsal");
  const traceBytes = await readFile(path.join(rehearsal, "atlas-v2-topology-manifest.json"));
  const derivedBytes = await readFile(path.join(rehearsal, "atlas-v2-derived-geometry.json"));
  const candidateBytes = await readFile(path.join(rehearsal, "atlas-v2-connection-candidates.json"));
  verifyAtlasV2ArtifactHash("topologyManifest", traceBytes); verifyAtlasV2ArtifactHash("derivedGeometry", derivedBytes); verifyAtlasV2ArtifactHash("connectionCandidates", candidateBytes);
  const manifest = JSON.parse(await readFile(path.join(root, "Docs", "atlas-migration-manifests", "atlas-v1-connections.json"), "utf8")) as AtlasV1ConnectionManifest;
  const trace = JSON.parse(traceBytes.toString("utf8")) as AtlasCanonicalTopologyTrace;
  const candidates = (JSON.parse(candidateBytes.toString("utf8")) as { candidates: AtlasConnectionCandidate[] }).candidates;
  const database = createPrismaClient(targetUrl!);
  try { process.stdout.write(stableAtlasJson({ identity, verification: await verifyAtlasV2Activation(database, manifest, candidates, trace) })); }
  finally { await database.$disconnect(); }
}

void main();
