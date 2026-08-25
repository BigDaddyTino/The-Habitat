import dotenv from "dotenv";
import path from "node:path";
import { createPrismaClient } from "@habitat/db/client";
import { assertAtlasAuthoringEnvironment } from "../lib/atlas-authoring-environment";
import { resolveAtlasDevelopmentDatabaseUrl } from "../lib/atlas-development-database";
import { createAtlasPersistenceService } from "../lib/atlas-persistence-service";
import { stableAtlasJson } from "./lib/atlas-integrity";
import { loadAtlasCanonicalRouteBacklog } from "./lib/atlas-canonical-routes";

const root = path.resolve(process.cwd(), "..", "..");
dotenv.config({ path: path.join(root, ".env"), quiet: true });
dotenv.config({ path: path.join(root, ".env.local"), override: true, quiet: true });
const developmentUrl = resolveAtlasDevelopmentDatabaseUrl(process.env);
if (!developmentUrl) throw new Error("Canonical route authoring requires the guarded Atlas development target.");
process.env.DATABASE_URL = developmentUrl;
assertAtlasAuthoringEnvironment(process.env);
const db = createPrismaClient(developmentUrl);
const atlas = createAtlasPersistenceService(db);

async function main() {
  const backlog = await loadAtlasCanonicalRouteBacklog(root);
  const planned = backlog.routes.filter((route) => route.status === "AUTHOR_NOW");
  const [actor, maps, connections] = await Promise.all([
    db.user.findFirstOrThrow({ where: { role: "ADMIN", isActive: true }, orderBy: { id: "asc" }, select: { id: true } }),
    db.storyMap.findMany({ where: { slug: { in: [...new Set(planned.map((route) => route.recommendedScene))] } }, select: { id: true, slug: true } }),
    db.storyWorldConnection.findMany({ where: { id: { in: planned.map((route) => route.connectionId) } }, include: { fromEntry: { select: { slug: true } }, toEntry: { select: { slug: true } }, paths: true } }),
  ]);
  const mapBySlug = new Map(maps.map((map) => [map.slug, map]));
  const connectionById = new Map(connections.map((connection) => [connection.id, connection]));
  const created: string[] = [];
  const preserved: string[] = [];
  for (const route of planned) {
    const map = mapBySlug.get(route.recommendedScene);
    const connection = connectionById.get(route.connectionId);
    if (!map || !connection) throw new Error(`Canonical route ${route.connectionId} lacks its map or semantic connection.`);
    if (connection.fromEntry.slug !== route.source || connection.toEntry.slug !== route.destination || connection.type !== route.type) throw new Error(`Canonical route ${route.connectionId} no longer matches its reviewed semantic connection.`);
    const existing = connection.paths.find((candidate) => candidate.mapId === map.id);
    if (existing) {
      if (stableAtlasJson(existing.geometry, false) !== stableAtlasJson(route.geometry, false)) throw new Error(`Canonical route ${route.connectionId} already has different geometry; refusing overwrite.`);
      preserved.push(route.connectionId);
      continue;
    }
    await atlas.createConnectionPath({ connectionId: route.connectionId, mapId: map.id, geometry: route.geometry!, minZoom: 0, maxZoom: null, priority: 10, actorUserId: actor.id });
    created.push(route.connectionId);
  }
  const paths = await db.storyMapConnectionPath.count();
  process.stdout.write(stableAtlasJson({ contract: "martino-atlas-canonical-route-authoring", contractVersion: 1, database: "habitat_atlas_dev", status: "PASS", approved: planned.length, created, preserved, persistedPaths: paths }));
}

void main().finally(() => db.$disconnect());
