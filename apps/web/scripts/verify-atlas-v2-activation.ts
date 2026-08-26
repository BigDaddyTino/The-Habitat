import "../lib/environment";
import { readFile } from "node:fs/promises";
import path from "node:path";
import dotenv from "dotenv";
import { createPrismaClient } from "@habitat/db/client";
import { resolveAtlasDevelopmentDatabaseUrl } from "../lib/atlas-development-database";
import { stableAtlasJson } from "./lib/atlas-integrity";
import type { AtlasCanonicalTopologyTrace } from "./lib/atlas-canonical-topology";
import type { AtlasConnectionCandidate, AtlasV1ConnectionManifest } from "./lib/atlas-migration-rehearsal";
import { loadAtlasCanonicalRouteBacklog } from "./lib/atlas-canonical-routes";
import { assertAtlasPersistentDevelopmentTarget, assertAtlasV2ActivationTarget, verifyAtlasV2Activation, verifyAtlasV2ArtifactHash } from "./lib/atlas-v2-activation";

const root = path.resolve(process.cwd(), "..", "..");
const sourceUrl = process.env.DATABASE_URL;
dotenv.config({ path: path.join(root, ".env.local"), override: true, quiet: true });
const explicitTargetUrl = process.env.ATLAS_V2_ACTIVATION_DATABASE_URL;
const targetUrl = explicitTargetUrl ?? resolveAtlasDevelopmentDatabaseUrl(process.env);
if (!sourceUrl || !targetUrl) throw new Error("Atlas V2 verification requires the production source URL and a guarded development or explicit activation target.");
const identity = explicitTargetUrl ? assertAtlasV2ActivationTarget(sourceUrl, targetUrl) : { mode: "PERSISTENT_DEVELOPMENT_VERIFICATION" as const, source: new URL(sourceUrl).pathname.slice(1), target: assertAtlasPersistentDevelopmentTarget(targetUrl) };

async function main() {
  const rehearsal = path.join(root, "Docs", "atlas-migration-rehearsal");
  const traceBytes = await readFile(path.join(rehearsal, "atlas-v2-topology-manifest.json"));
  const derivedBytes = await readFile(path.join(rehearsal, "atlas-v2-derived-geometry.json"));
  const candidateBytes = await readFile(path.join(rehearsal, "atlas-v2-connection-candidates.json"));
  const routeBytes = await readFile(path.join(root, "Docs", "atlas-route-authoring-backlog.json"));
  verifyAtlasV2ArtifactHash("topologyManifest", traceBytes); verifyAtlasV2ArtifactHash("derivedGeometry", derivedBytes); verifyAtlasV2ArtifactHash("connectionCandidates", candidateBytes);
  verifyAtlasV2ArtifactHash("canonicalRoutes", routeBytes);
  const manifest = JSON.parse(await readFile(path.join(root, "Docs", "atlas-migration-manifests", "atlas-v1-connections.json"), "utf8")) as AtlasV1ConnectionManifest;
  const trace = JSON.parse(traceBytes.toString("utf8")) as AtlasCanonicalTopologyTrace;
  const candidates = (JSON.parse(candidateBytes.toString("utf8")) as { candidates: AtlasConnectionCandidate[] }).candidates;
  const routes = (await loadAtlasCanonicalRouteBacklog(root)).routes.filter((route) => route.status === "AUTHOR_NOW");
  const database = createPrismaClient(targetUrl!);
  try { process.stdout.write(stableAtlasJson({ identity, verification: await verifyAtlasV2Activation(database, manifest, candidates, trace, routes) })); }
  finally { await database.$disconnect(); }
}

void main();
