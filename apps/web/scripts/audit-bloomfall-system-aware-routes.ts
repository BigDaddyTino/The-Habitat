import { readFile } from "node:fs/promises";
import path from "node:path";
import dotenv from "dotenv";
import { createPrismaClient } from "@habitat/db/client";
import { validateAtlasMapConnectionPath, validateAtlasWorldConnection } from "@habitat/shared";
import { bloomfallV3AtlasAssets } from "../lib/bloomfall-v3-art";
import { resolveAtlasDevelopmentDatabaseUrl } from "../lib/atlas-development-database";
import { assertAtlasPersistentDevelopmentTarget, assertAtlasV2SchemaPresent } from "./lib/atlas-v2-activation";
import { atlasSha256, stableAtlasJson } from "./lib/atlas-integrity";
import { buildBloomfallRouteStatusManifest, bloomfallPersistedRoutes, bloomfallRouteCandidates, bloomfallRouteSceneSlug } from "./lib/bloomfall-routes";

const root = path.resolve(process.cwd(), "..", "..");
dotenv.config({ path: path.join(root, ".env"), quiet: true });
dotenv.config({ path: path.join(root, ".env.local"), override: true, quiet: true });
const developmentUrl = resolveAtlasDevelopmentDatabaseUrl(process.env);
if (!developmentUrl) throw new Error("Bloomfall route audit requires the guarded development database.");
assertAtlasPersistentDevelopmentTarget(developmentUrl);
const db = createPrismaClient(developmentUrl);

function jsonEqual(left: unknown, right: unknown) {
  return stableAtlasJson(left, false) === stableAtlasJson(right, false);
}

async function main() {
  await assertAtlasV2SchemaPresent(db);
  const identity = await db.$queryRaw<Array<{ database: string }>>`SELECT current_database() AS database`;
  if (identity[0]?.database !== "habitat_atlas_dev") throw new Error("Bloomfall route audit independently verified the wrong database.");
  const failures: string[] = [];
  const check = (condition: unknown, message: string) => { if (!condition) failures.push(message); };
  const expectedManifest = buildBloomfallRouteStatusManifest();
  const [manifestText, overlayText, localArt, worldArt, map, connections, allConnections] = await Promise.all([
    readFile(path.join(root, "Docs", "bloomfall-routes", "bloomfall-route-status-manifest.json"), "utf8"),
    readFile(path.join(root, "apps", "web", "private", "codex-art", "bloomfall-routes", "review", "index.html"), "utf8"),
    readFile(path.join(root, "apps", "web", "private", "codex-art", "maps", "martino-bloomfall-reach-map-v3.png")),
    readFile(path.join(root, "apps", "web", "private", "codex-art", "maps", "martino-world-map-v3.png")),
    db.storyMap.findUnique({ where: { slug: bloomfallRouteSceneSlug }, include: { connectionPaths: { include: { connection: { include: { fromEntry: { select: { slug: true } }, toEntry: { select: { slug: true } } } } }, orderBy: { id: "asc" } } } }),
    db.storyWorldConnection.findMany({ where: { id: { in: bloomfallPersistedRoutes.map((route) => route.connectionId) } }, include: { fromEntry: { select: { slug: true } }, toEntry: { select: { slug: true } }, paths: { include: { map: { select: { slug: true, coordinateWidth: true, coordinateHeight: true } } } } }, orderBy: { id: "asc" } }),
    db.storyWorldConnection.findMany({ include: { fromEntry: { select: { slug: true } }, toEntry: { select: { slug: true } }, paths: true } }),
  ]);

  check(manifestText === stableAtlasJson(expectedManifest), "Generated route-status manifest differs from its typed source.");
  check(expectedManifest.counts.candidates === 12 && expectedManifest.counts.persistedBefore === 2 && expectedManifest.counts.persistedAfter === 4 && expectedManifest.counts.newPersisted === 2, "Route-status counts drifted.");
  check(expectedManifest.counts.PERMANENT === 1 && expectedManifest.counts.CONDITIONAL === 3 && expectedManifest.counts.DYNAMIC === 5 && expectedManifest.counts.DEFERRED === 3, "Route classification counts drifted.");
  check(bloomfallRouteCandidates.filter((route) => route.classification === "DYNAMIC").every((route) => !route.persisted), "A dynamic route was incorrectly persisted.");
  check(bloomfallRouteCandidates.find((route) => route.key === "magic-torn-adjacency")?.classification === "DEFERRED", "Magic-Torn adjacency is not deferred.");
  check(!allConnections.some((connection) => [connection.fromEntry.slug, connection.toEntry.slug].includes("magic-torn-wasteland") && [connection.fromEntry.slug, connection.toEntry.slug].includes("bloomfall-reach")), "An accidental Bloomfall / Magic-Torn connection exists.");
  check(map?.connectionPaths.length === 4, "Bloomfall local scene does not have exactly four stable paths.");
  check(connections.length === bloomfallPersistedRoutes.length, "One or more route connections are missing.");

  const encodedGeometry = new Set<string>();
  for (const expected of bloomfallPersistedRoutes) {
    const connection = connections.find((candidate) => candidate.id === expected.connectionId);
    check(Boolean(connection), `Missing connection ${expected.key}.`);
    if (!connection) continue;
    check(connection.fromEntry.slug === expected.source && connection.toEntry.slug === expected.destination && connection.type === expected.type && connection.directionality === "BIDIRECTIONAL", `Endpoint/type drift for ${expected.key}.`);
    const semantic = validateAtlasWorldConnection({ id: connection.id, fromEntryId: connection.fromEntryId, toEntryId: connection.toEntryId, type: connection.type, directionality: connection.directionality, status: connection.status, visibility: connection.visibility, originalWording: connection.originalWording, editorialNotes: connection.editorialNotes, metadata: connection.metadata as never, version: connection.version });
    check(semantic.valid && jsonEqual(connection.metadata, expected.metadata), `Metadata validation/drift for ${expected.key}.`);
    const persisted = connection.paths.find((candidate) => candidate.map.slug === bloomfallRouteSceneSlug);
    check(Boolean(persisted), `Missing local path ${expected.key}.`);
    if (!persisted) continue;
    check(persisted.id === expected.pathId && jsonEqual(persisted.geometry, expected.geometry) && persisted.minZoom === expected.minZoom && persisted.maxZoom === expected.maxZoom && persisted.priority === expected.priority, `Path drift for ${expected.key}.`);
    const geometry = stableAtlasJson(persisted.geometry, false);
    check(!encodedGeometry.has(geometry), `Duplicate path geometry for ${expected.key}.`);
    encodedGeometry.add(geometry);
    check(validateAtlasMapConnectionPath({ id: persisted.id, connectionId: persisted.connectionId, mapSlug: persisted.map.slug, geometry: persisted.geometry as never, minZoom: persisted.minZoom, maxZoom: persisted.maxZoom, priority: persisted.priority, version: persisted.version }, { width: persisted.map.coordinateWidth as 100_000, height: persisted.map.coordinateHeight }).valid, `Invalid geometry for ${expected.key}.`);
    const revision = await db.storyRevision.findFirst({ where: { entityType: "CONN_PATH", entityId: persisted.id }, orderBy: { createdAt: "asc" } });
    check(Boolean(revision), `Missing route revision for ${expected.key}.`);
  }

  const localExpected = bloomfallV3AtlasAssets.find((asset) => asset.mapSlug === bloomfallRouteSceneSlug)!;
  const worldExpected = bloomfallV3AtlasAssets.find((asset) => asset.mapSlug === "martino-world")!;
  check(atlasSha256(localArt) === localExpected.sha256 && atlasSha256(worldArt) === worldExpected.sha256, "V3 Atlas art SHA alignment failed.");
  for (const marker of ["CURRENT PERSISTED", "NEW AUTHOR_NOW", "CONDITIONAL BASE", "DYNAMIC CORRIDOR", ...bloomfallPersistedRoutes.map((route) => route.key)]) check(overlayText.includes(marker), `Review overlay lacks ${marker}.`);

  const report = {
    contract: "martino-bloomfall-system-aware-route-audit",
    contractVersion: 1,
    status: failures.length ? "FAIL" : "PASS",
    database: "habitat_atlas_dev",
    candidates: expectedManifest.counts.candidates,
    classifications: { PERMANENT: expectedManifest.counts.PERMANENT, CONDITIONAL: expectedManifest.counts.CONDITIONAL, DYNAMIC: expectedManifest.counts.DYNAMIC, DEFERRED: expectedManifest.counts.DEFERRED },
    localPaths: map?.connectionPaths.length ?? 0,
    newPaths: bloomfallPersistedRoutes.filter((route) => route.authoringDecision === "AUTHOR_NOW").map((route) => ({ key: route.key, source: route.source, destination: route.destination, type: route.type, vertices: route.geometry.type === "LINESTRING" ? route.geometry.coordinates.length : route.geometry.coordinates.reduce((sum, line) => sum + line.length, 0), sha256: atlasSha256(stableAtlasJson(route.geometry, false)) })),
    currentPathsPreserved: bloomfallPersistedRoutes.filter((route) => route.authoringDecision === "PRESERVE").length,
    dynamicPathsPersisted: 0,
    magicTornConnections: 0,
    v3ArtAlignment: "PASS",
    reviewOverlay: "apps/web/private/codex-art/bloomfall-routes/review/index.html",
    manifest: "Docs/bloomfall-routes/bloomfall-route-status-manifest.json",
    productionWrites: 0,
    failures,
  };
  process.stdout.write(stableAtlasJson(report));
  if (failures.length) process.exitCode = 1;
}

void main().finally(() => db.$disconnect());
