import dotenv from "dotenv";
import path from "node:path";
import { createPrismaClient } from "@habitat/db/client";
import { validateAtlasMapConnectionPath } from "@habitat/shared";
import { assertAtlasAuthoringEnvironment } from "../lib/atlas-authoring-environment";
import { resolveAtlasDevelopmentDatabaseUrl } from "../lib/atlas-development-database";
import { stableAtlasJson } from "./lib/atlas-integrity";
import { loadAtlasCanonicalRouteBacklog } from "./lib/atlas-canonical-routes";

const root = path.resolve(process.cwd(), "..", "..");
dotenv.config({ path: path.join(root, ".env"), quiet: true });
const verificationUrl = process.env.ATLAS_V2_VERIFICATION_DATABASE_URL;
if (!verificationUrl) dotenv.config({ path: path.join(root, ".env.local"), override: true, quiet: true });

function resolveVerificationTarget() {
  if (!verificationUrl) {
    const developmentUrl = resolveAtlasDevelopmentDatabaseUrl(process.env);
    if (!developmentUrl) throw new Error("Canonical route verification requires the guarded Atlas development target.");
    process.env.DATABASE_URL = developmentUrl;
    assertAtlasAuthoringEnvironment(process.env);
    return { url: developmentUrl, database: "habitat_atlas_dev", mode: "DEVELOPMENT" as const };
  }
  const parsed = new URL(verificationUrl);
  if (!["localhost", "127.0.0.1", "::1"].includes(parsed.hostname.toLowerCase()) || parsed.pathname.slice(1) !== "habitat") throw new Error("Production route verification requires the loopback canonical habitat database.");
  if (process.env.ATLAS_V2_VERIFICATION_ENVIRONMENT !== "production" || process.env.ATLAS_V2_VERIFICATION_CONFIRM_DATABASE !== "habitat") throw new Error("Production route verification requires explicit environment and database confirmation.");
  return { url: verificationUrl, database: "habitat", mode: "PRODUCTION" as const };
}

const target = resolveVerificationTarget();
const db = createPrismaClient(target.url);

async function main() {
  const backlog = await loadAtlasCanonicalRouteBacklog(root);
  const approved = backlog.routes.filter((route) => route.status === "AUTHOR_NOW");
  const paths = await db.storyMapConnectionPath.findMany({ include: { map: true, connection: { include: { fromEntry: { select: { slug: true } }, toEntry: { select: { slug: true } } } } }, orderBy: { connectionId: "asc" } });
  if (paths.length !== approved.length) throw new Error(`Expected ${approved.length} approved paths, received ${paths.length}.`);
  for (const route of approved) {
    const persisted = paths.find((candidate) => candidate.connectionId === route.connectionId && candidate.map.slug === route.recommendedScene);
    if (!persisted) throw new Error(`Missing approved path ${route.connectionId}.`);
    if (persisted.connection.fromEntry.slug !== route.source || persisted.connection.toEntry.slug !== route.destination || persisted.connection.type !== route.type) throw new Error(`Approved path ${route.connectionId} semantic data drifted.`);
    if (stableAtlasJson(persisted.geometry, false) !== stableAtlasJson(route.geometry, false)) throw new Error(`Approved path ${route.connectionId} geometry drifted.`);
    const validation = validateAtlasMapConnectionPath({ id: persisted.id, connectionId: persisted.connectionId, mapSlug: persisted.map.slug, geometry: persisted.geometry as never, minZoom: persisted.minZoom, maxZoom: persisted.maxZoom, priority: persisted.priority, version: persisted.version }, { width: persisted.map.coordinateWidth as 100_000, height: persisted.map.coordinateHeight });
    if (!validation.valid) throw new Error(`Approved path ${route.connectionId} failed geometry validation.`);
    const revision = await db.storyRevision.findFirst({ where: { entityType: "CONN_PATH", entityId: persisted.id, action: "CREATED" }, select: { summary: true } });
    if (!revision || !revision.summary.includes(route.source) || !revision.summary.includes(route.destination)) throw new Error(`Approved path ${route.connectionId} lacks an understandable creation revision.`);
  }
  const scenes = [...new Set(approved.map((route) => route.recommendedScene))];
  const scenePaths = await Promise.all(scenes.map(async (slug) => ({ slug, paths: await db.storyMapConnectionPath.count({ where: { map: { slug } } }) })));
  for (const scene of scenePaths) {
    const expected = approved.filter((route) => route.recommendedScene === scene.slug).length;
    if (scene.paths !== expected) throw new Error(`V2 scene source ${scene.slug} does not contain its ${expected} approved paths.`);
  }
  const connections = await db.storyWorldConnection.findMany({ select: { type: true, paths: { select: { id: true } } } });
  const byType = Object.fromEntries([...new Set(connections.map((connection) => connection.type))].sort().map((type) => { const rows = connections.filter((connection) => connection.type === type); return [type, { connections: rows.length, pathsAuthored: rows.filter((connection) => connection.paths.length > 0).length, missingPaths: rows.filter((connection) => connection.paths.length === 0).length }]; }));
  process.stdout.write(stableAtlasJson({ contract: "martino-atlas-canonical-route-verification", contractVersion: 1, database: target.database, mode: target.mode, status: "PASS", connections: connections.length, pathsAuthored: paths.length, pathsMissing: connections.length - paths.length, approved: paths.length, reviewRequired: backlog.counts.reviewRequired, deferred: backlog.counts.defer, byType, scenes: Object.fromEntries(scenePaths.map(({ slug, paths: count }) => [slug, count])) }));
}

void main().finally(() => db.$disconnect());
