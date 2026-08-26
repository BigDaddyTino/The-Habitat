import path from "node:path";
import dotenv from "dotenv";
import { createPrismaClient } from "@habitat/db/client";
import { assertAtlasAuthoringEnvironment } from "../lib/atlas-authoring-environment";
import { resolveAtlasDevelopmentDatabaseUrl } from "../lib/atlas-development-database";
import { createAtlasPersistenceService } from "../lib/atlas-persistence-service";
import { assertAtlasPersistentDevelopmentTarget, assertAtlasV2SchemaPresent } from "./lib/atlas-v2-activation";
import { bloomfallPersistedRoutes, bloomfallRouteSceneSlug } from "./lib/bloomfall-routes";
import { stableAtlasJson } from "./lib/atlas-integrity";

const confirmation = "--confirm=BLOOMFALL_SYSTEM_AWARE_ROUTES_DEVELOPMENT_ONLY";
const root = path.resolve(process.cwd(), "..", "..");
dotenv.config({ path: path.join(root, ".env"), quiet: true });
dotenv.config({ path: path.join(root, ".env.local"), override: true, quiet: true });
const developmentUrl = resolveAtlasDevelopmentDatabaseUrl(process.env);
if (!developmentUrl || !process.argv.includes(confirmation)) throw new Error(`Route authoring requires the guarded development target and ${confirmation}.`);
process.env.DATABASE_URL = developmentUrl;
assertAtlasAuthoringEnvironment(process.env);
assertAtlasPersistentDevelopmentTarget(developmentUrl);
const db = createPrismaClient(developmentUrl);
const atlas = createAtlasPersistenceService(db);

function jsonEqual(left: unknown, right: unknown) {
  return stableAtlasJson(left, false) === stableAtlasJson(right, false);
}

async function main() {
  await assertAtlasV2SchemaPresent(db);
  const identity = await db.$queryRaw<Array<{ database: string }>>`SELECT current_database() AS database`;
  if (identity[0]?.database !== "habitat_atlas_dev") throw new Error("Route authoring independently verified the wrong database.");
  const routeSlugs = [...new Set(bloomfallPersistedRoutes.flatMap((route) => [route.source, route.destination]))];
  const [map, actor, entries] = await Promise.all([
    db.storyMap.findUnique({ where: { slug: bloomfallRouteSceneSlug }, select: { id: true, slug: true } }),
    db.user.findFirst({ where: { role: "ADMIN", isActive: true }, orderBy: { id: "asc" }, select: { id: true } }),
    db.storyEntry.findMany({ where: { slug: { in: routeSlugs } }, select: { id: true, slug: true, kind: true } }),
  ]);
  if (!map || !actor || entries.length !== routeSlugs.length || entries.some((entry) => entry.kind !== "REGION")) throw new Error("Route authoring requires the exact scene, administrator, and REGION endpoints.");
  const entryBySlug = new Map(entries.map((entry) => [entry.slug, entry]));
  const createdConnections: string[] = [];
  const updatedConnections: string[] = [];
  const createdPaths: string[] = [];
  const preservedPaths: string[] = [];

  for (const route of bloomfallPersistedRoutes) {
    const source = entryBySlug.get(route.source)!;
    const destination = entryBySlug.get(route.destination)!;
    let connection = await db.storyWorldConnection.findUnique({ where: { id: route.connectionId } });
    if (!connection) {
      if (route.authoringDecision === "PRESERVE") throw new Error(`Established route connection ${route.key} is missing; authoring refused.`);
      connection = await atlas.createWorldConnection({
        id: route.connectionId,
        fromEntryId: source.id,
        toEntryId: destination.id,
        type: route.type,
        directionality: "BIDIRECTIONAL",
        status: "UNSPECIFIED",
        visibility: "DEFAULT",
        originalWording: route.originalWording,
        editorialNotes: route.editorialNotes,
        metadata: route.metadata,
        actorUserId: actor.id,
      });
      createdConnections.push(route.key);
    } else {
      if (connection.fromEntryId !== source.id || connection.toEntryId !== destination.id || connection.type !== route.type || connection.directionality !== "BIDIRECTIONAL") throw new Error(`Connection identity drifted for ${route.key}.`);
      const exact = connection.originalWording === route.originalWording && connection.editorialNotes === route.editorialNotes && jsonEqual(connection.metadata, route.metadata);
      if (!exact) {
        const metadata = connection.metadata && typeof connection.metadata === "object" && !Array.isArray(connection.metadata) ? connection.metadata as Record<string, unknown> : {};
        if (metadata.routeKey !== undefined && metadata.routeKey !== route.key) throw new Error(`Connection metadata belongs to another route for ${route.key}.`);
        connection = await atlas.updateWorldConnection({
          id: connection.id,
          expectedVersion: connection.version,
          fromEntryId: connection.fromEntryId,
          toEntryId: connection.toEntryId,
          type: connection.type,
          directionality: connection.directionality,
          status: connection.status,
          visibility: connection.visibility,
          originalWording: route.originalWording,
          editorialNotes: route.editorialNotes,
          metadata: route.metadata,
          actorUserId: actor.id,
        });
        updatedConnections.push(route.key);
      }
    }

    const pathRow = await db.storyMapConnectionPath.findUnique({ where: { id: route.pathId } });
    if (!pathRow) {
      if (route.authoringDecision === "PRESERVE") throw new Error(`Established route path ${route.key} is missing; authoring refused.`);
      await atlas.createConnectionPath({ id: route.pathId, connectionId: connection.id, mapId: map.id, geometry: route.geometry, minZoom: route.minZoom, maxZoom: route.maxZoom, priority: route.priority, actorUserId: actor.id });
      createdPaths.push(route.key);
    } else {
      if (pathRow.connectionId !== connection.id || pathRow.mapId !== map.id || pathRow.geometryKind !== route.geometry.type || !jsonEqual(pathRow.geometry, route.geometry) || pathRow.minZoom !== route.minZoom || pathRow.maxZoom !== route.maxZoom || pathRow.priority !== route.priority) throw new Error(`Persisted geometry drifted for ${route.key}; overwrite refused.`);
      preservedPaths.push(route.key);
    }
  }

  process.stdout.write(stableAtlasJson({ contract: "martino-bloomfall-system-aware-route-authoring", contractVersion: 1, database: "habitat_atlas_dev", status: "PASS", createdConnections, updatedConnections, createdPaths, preservedPaths, localPaths: await db.storyMapConnectionPath.count({ where: { mapId: map.id } }), productionWrites: 0 }));
}

void main().finally(() => db.$disconnect());
