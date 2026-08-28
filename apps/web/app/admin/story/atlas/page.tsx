import { notFound } from "next/navigation";
import { getPrismaClient } from "@habitat/db/client";
import { AtlasAuthoringWorkbench, type AtlasAuthoringData } from "@/components/atlas-authoring-workbench";
import { atlasAuthoringEnvironmentAvailable } from "@/lib/atlas-authoring";
import { requireRole } from "@/lib/authorization";

const db = getPrismaClient();
export const dynamic = "force-dynamic";
export const metadata = { title: "Atlas Authoring" };

export default async function AtlasAuthoringPage({ searchParams }: { searchParams: Promise<{ scene?: string }> }) {
  await requireRole("ADMIN");
  if (!atlasAuthoringEnvironmentAvailable()) notFound();
  const sceneSlug = (await searchParams).scene ?? "martino-world";
  const map = await db.storyMap.findUnique({
    where: { slug: sceneSlug },
    include: {
      topologyNodes: { include: { boundariesFrom: { select: { id: true } }, boundariesTo: { select: { id: true } } }, orderBy: { id: "asc" } },
      boundaries: {
        include: {
          ringReferences: {
            include: { ring: { include: { placement: { include: { entry: { select: { title: true } } } } } } },
          },
        },
        orderBy: { id: "asc" },
      },
      placements: { where: { geometryKind: "POINT" }, include: { entry: { select: { id: true, slug: true, title: true } } }, orderBy: { entry: { title: "asc" } } },
      connectionPaths: { orderBy: { connectionId: "asc" } },
    },
  });
  if (!map) notFound();
  const [entries, connections, revisions, scenes] = await Promise.all([
    db.storyEntry.findMany({ where: { kind: "REGION" }, select: { id: true, slug: true, title: true, mapPlacements: { where: { mapId: map.id }, select: { id: true } } }, orderBy: { title: "asc" } }),
    db.storyWorldConnection.findMany({ include: { fromEntry: { select: { title: true } }, toEntry: { select: { title: true } }, paths: { where: { mapId: map.id } } }, orderBy: [{ type: "asc" }, { id: "asc" }] }),
    db.storyRevision.findMany({ where: { entityType: { in: ["PLACEMENT", "TOPO_NODE", "BOUNDARY", "AREA_RING", "WORLD_CONN", "CONN_PATH"] } }, include: { actor: { select: { displayName: true, name: true } } }, orderBy: { createdAt: "desc" }, take: 40 }),
    db.storyMap.findMany({ select: { slug: true, title: true }, orderBy: { title: "asc" } }),
  ]);
  const pathByConnection = new Map(map.connectionPaths.map((path) => [path.connectionId, path]));
  const data: AtlasAuthoringData = {
    map: { id: map.id, slug: map.slug, title: map.title, imageUrl: `/codex-map/${map.slug}/${map.artVersion}.png`, width: map.coordinateWidth, height: map.coordinateHeight },
    scenes,
    nodes: map.topologyNodes.map((node) => ({ id: node.id, x: node.x, y: node.y, version: node.version, boundaryIds: [...node.boundariesFrom, ...node.boundariesTo].map((boundary) => boundary.id) })),
    boundaries: map.boundaries.map((boundary) => ({ id: boundary.id, startNodeId: boundary.startNodeId, endNodeId: boundary.endNodeId, kind: boundary.kind, interiorVertices: boundary.interiorVertices as unknown as readonly (readonly [number, number])[], version: boundary.version, regions: [...new Set(boundary.ringReferences.map((reference) => reference.ring.placement.entry.title))].sort() })),
    placements: map.placements.map((placement) => { const geometry = placement.geometry as { coordinates?: unknown }; const coordinates = Array.isArray(geometry.coordinates) ? geometry.coordinates as [number, number] : [0, 0]; return { id: placement.id, entryId: placement.entry.id, slug: placement.entry.slug, title: placement.entry.title, x: coordinates[0], y: coordinates[1], labelX: placement.labelX, labelY: placement.labelY, minZoom: placement.minZoom, maxZoom: placement.maxZoom, priority: placement.priority, version: placement.version }; }),
    unplaced: entries.filter((entry) => entry.mapPlacements.length === 0).map(({ id, slug, title }) => ({ id, slug, title })),
    entries: entries.map(({ id, slug, title }) => ({ id, slug, title })),
    connections: connections.map((connection) => { const path = pathByConnection.get(connection.id); return { id: connection.id, fromEntryId: connection.fromEntryId, fromTitle: connection.fromEntry.title, toEntryId: connection.toEntryId, toTitle: connection.toEntry.title, type: connection.type, directionality: connection.directionality, status: connection.status, visibility: connection.visibility, originalWording: connection.originalWording, editorialNotes: connection.editorialNotes, version: connection.version, path: path ? { id: path.id, geometry: path.geometry as unknown as NonNullable<AtlasAuthoringData["connections"][number]["path"]>["geometry"], minZoom: path.minZoom, maxZoom: path.maxZoom, priority: path.priority, version: path.version } : null }; }),
    revisions: revisions.map((revision) => ({ id: revision.id, entityType: revision.entityType, action: revision.action, summary: revision.summary, actor: revision.actor.displayName ?? revision.actor.name ?? "Administrator", createdAt: revision.createdAt.toISOString() })),
  };
  return <AtlasAuthoringWorkbench data={data}/>;
}
