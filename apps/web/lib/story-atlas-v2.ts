import "server-only";
import { getPrismaClient } from "@habitat/db/client";
import type { AtlasV2ConnectionPathProjection, AtlasV2Projection } from "@habitat/shared";
import { createAtlasPersistenceService, type AtlasPersistenceClient } from "./atlas-persistence-service";
import { createStoryAtlasProjectionService } from "./story-atlas";
import { buildStoryAtlasV2Projection } from "./story-atlas-v2-projection";

export { buildStoryAtlasV2Projection } from "./story-atlas-v2-projection";

export function createStoryAtlasV2ProjectionService(client: AtlasPersistenceClient) {
  const persistence = createAtlasPersistenceService(client);
  const getV1Projection = createStoryAtlasProjectionService(client);
  return async function project(slug: string): Promise<AtlasV2Projection | null> {
    const v1 = await getV1Projection(slug);
    if (!v1) return null;
    const topology = await persistence.getTopologyForMap(v1.scene.id);
    const [connections, revision, sceneOwner] = await Promise.all([
      client.storyWorldConnection.findMany({ orderBy: { id: "asc" }, include: { fromEntry: { select: { slug: true } }, toEntry: { select: { slug: true } }, paths: { where: { mapId: v1.scene.id }, orderBy: { id: "asc" } }, _count: { select: { paths: true } } } }),
      client.storyRevision.findFirst({ where: { entityType: { in: ["MAP", "PLACEMENT", "TOPO_NODE", "BOUNDARY", "AREA_RING", "WORLD_CONN", "CONN_PATH"] } }, orderBy: [{ createdAt: "desc" }, { id: "desc" }], select: { id: true } }),
      client.storyMap.findUnique({ where: { id: v1.scene.id }, select: { owner: { select: { title: true } } } }),
    ]);
    return buildStoryAtlasV2Projection({ v1, topology: topology.dataset, revisionCursor: revision?.id ?? null, sceneOwnerTitle: sceneOwner?.owner?.title, connections: connections.map((connection) => ({ id: connection.id, fromSlug: connection.fromEntry.slug, toSlug: connection.toEntry.slug, type: connection.type, directionality: connection.directionality, status: connection.status, visibility: connection.visibility, hasPath: connection._count.paths > 0 })), connectionPaths: connections.flatMap((connection) => connection.paths.map((path) => ({ id: path.id, connectionId: connection.id, fromSlug: connection.fromEntry.slug, toSlug: connection.toEntry.slug, type: connection.type, geometry: path.geometry as unknown as AtlasV2ConnectionPathProjection["geometry"], minZoom: path.minZoom, maxZoom: path.maxZoom, priority: path.priority, version: path.version }))) });
  };
}

export const getStoryAtlasV2Projection = createStoryAtlasV2ProjectionService(getPrismaClient());
