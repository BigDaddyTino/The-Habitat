import dotenv from "dotenv";
import path from "node:path";
import { createPrismaClient } from "@habitat/db/client";
import type { AtlasMapConnectionPath } from "@habitat/shared";
import { assertAtlasAuthoringEnvironment } from "../lib/atlas-authoring-environment";
import { resolveAtlasDevelopmentDatabaseUrl } from "../lib/atlas-development-database";
import { createAtlasPersistenceService } from "../lib/atlas-persistence-service";

const root = path.resolve(process.cwd(), "..", "..");
dotenv.config({ path: path.join(root, ".env"), quiet: true });
dotenv.config({ path: path.join(root, ".env.local"), override: true, quiet: true });
const developmentUrl = resolveAtlasDevelopmentDatabaseUrl(process.env);
if (!developmentUrl) throw new Error("Atlas authoring verification requires the development target.");
process.env.DATABASE_URL = developmentUrl;
assertAtlasAuthoringEnvironment(process.env);
const db = createPrismaClient(developmentUrl);
const atlas = createAtlasPersistenceService(db);

async function main() {
  const [map, actor, connection, pathCountBefore, revisionCountBefore] = await Promise.all([
    db.storyMap.findUniqueOrThrow({ where: { slug: "martino-world" }, include: { topologyNodes: { orderBy: { id: "asc" } }, placements: { where: { geometryKind: "POINT" }, orderBy: { id: "asc" } } } }),
    db.user.findFirstOrThrow({ where: { role: "ADMIN", isActive: true }, select: { id: true } }),
    db.storyWorldConnection.findFirstOrThrow({ where: { paths: { none: { map: { slug: "martino-world" } } } }, orderBy: { id: "asc" } }),
    db.storyMapConnectionPath.count(),
    db.storyRevision.count(),
  ]);
  const node = map.topologyNodes.find((candidate, index, rows) => !rows.some((other) => other.id !== candidate.id && other.x === candidate.x + 1 && other.y === candidate.y));
  const placement = map.placements[0];
  if (!node || !placement) throw new Error("Development Atlas lacks a reversible authoring fixture.");
  const point = placement.geometry as { type: "POINT"; coordinates: [number, number] };
  let movedNodeVersion: number | null = null; let movedPlacementVersion: number | null = null; let createdPath: { id: string; version: number } | null = null; let fixtureConnection: { id: string; version: number } | null = null; let staleConnectionRefused = false; const fixtureNodes: Array<{ id: string; version: number }> = []; const fixtureBoundaries: Array<{ id: string; version: number }> = []; let boundarySplitVerified = false;
  try {
    const movedNode = await atlas.updateTopologyNode({ id: node.id, mapId: map.id, x: node.x + 1, y: node.y, expectedVersion: node.version, actorUserId: actor.id }); movedNodeVersion = movedNode.version;
    const movedPlacement = await atlas.updatePointPlacement({ id: placement.id, mapId: map.id, entryId: placement.entryId, x: point.coordinates[0] + 1, y: point.coordinates[1], labelX: placement.labelX === null ? null : placement.labelX + 1, labelY: placement.labelY, minZoom: placement.minZoom, maxZoom: placement.maxZoom, priority: placement.priority, expectedVersion: placement.version, actorUserId: actor.id }); movedPlacementVersion = movedPlacement.version;
    const geometry = { type: "LINESTRING", coordinates: [[10_000, 10_000], [20_000, 20_000]] } as unknown as AtlasMapConnectionPath["geometry"];
    createdPath = await atlas.createConnectionPath({ connectionId: connection.id, mapId: map.id, geometry, minZoom: 1, maxZoom: 3, priority: 0, actorUserId: actor.id });
    const createdConnection = await atlas.createWorldConnection({ fromEntryId: connection.fromEntryId, toEntryId: connection.toEntryId, type: "OTHER", directionality: "UNSPECIFIED", status: "UNSPECIFIED", visibility: "HIDDEN", originalWording: "Prompt 9 reversible verification fixture", editorialNotes: "Removed automatically before verification completes.", metadata: { fixture: true }, actorUserId: actor.id });
    fixtureConnection = { id: createdConnection.id, version: createdConnection.version };
    const updatedConnection = await atlas.updateWorldConnection({ id: createdConnection.id, expectedVersion: createdConnection.version, fromEntryId: connection.fromEntryId, toEntryId: connection.toEntryId, type: "UNKNOWN", directionality: "FROM_TO", status: "OPEN", visibility: "HIDDEN", originalWording: "Prompt 9 reversible verification fixture", editorialNotes: "Update and stale-version behavior verified before automatic removal.", metadata: { fixture: true }, actorUserId: actor.id });
    fixtureConnection = { id: updatedConnection.id, version: updatedConnection.version };
    try { await atlas.updateWorldConnection({ id: createdConnection.id, expectedVersion: createdConnection.version, fromEntryId: connection.fromEntryId, toEntryId: connection.toEntryId, type: "ROAD", directionality: "BIDIRECTIONAL", status: "OPEN", visibility: "HIDDEN", originalWording: null, editorialNotes: null, metadata: {}, actorUserId: actor.id }); } catch (error) { staleConnectionRefused = error instanceof Error && error.message.includes("edited this world connection first"); }
    const splitStart = await atlas.createTopologyNode({ mapId: map.id, x: 101, y: 101, actorUserId: actor.id }); fixtureNodes.push(splitStart);
    const splitEnd = await atlas.createTopologyNode({ mapId: map.id, x: 303, y: 101, actorUserId: actor.id }); fixtureNodes.push(splitEnd);
    const splitSource = await atlas.createBoundary({ mapId: map.id, startNodeId: splitStart.id, endNodeId: splitEnd.id, kind: "OPEN_BOUNDARY", interiorVertices: [[202, 101]], actorUserId: actor.id }); fixtureBoundaries.push(splitSource);
    const split = await atlas.splitBoundaryAtInteriorVertex({ id: splitSource.id, expectedVersion: splitSource.version, interiorVertexIndex: 0, actorUserId: actor.id });
    fixtureBoundaries.splice(0, 1, ...split.boundaryIds.map((id) => ({ id, version: 1 })));
    fixtureNodes.push({ id: split.nodeId, version: 1 });
    boundarySplitVerified = split.affectedRingIds.length === 0 && split.boundaryIds.length === 2;
  } finally {
    if (createdPath) await atlas.deleteConnectionPath(createdPath.id, createdPath.version, actor.id);
    if (fixtureConnection) await atlas.deleteWorldConnection(fixtureConnection.id, fixtureConnection.version, actor.id);
    for (const boundary of fixtureBoundaries) await atlas.deleteBoundary(boundary.id, boundary.version, actor.id);
    for (const topologyNode of fixtureNodes.reverse()) await atlas.deleteTopologyNode(topologyNode.id, topologyNode.version, actor.id);
    if (movedPlacementVersion !== null) await atlas.updatePointPlacement({ id: placement.id, mapId: map.id, entryId: placement.entryId, x: point.coordinates[0], y: point.coordinates[1], labelX: placement.labelX, labelY: placement.labelY, minZoom: placement.minZoom, maxZoom: placement.maxZoom, priority: placement.priority, expectedVersion: movedPlacementVersion, actorUserId: actor.id });
    if (movedNodeVersion !== null) await atlas.updateTopologyNode({ id: node.id, mapId: map.id, x: node.x, y: node.y, expectedVersion: movedNodeVersion, actorUserId: actor.id });
  }
  const [restoredNode, restoredPlacement, pathCount, connectionInventory, revisionCountAfter] = await Promise.all([db.storyMapTopologyNode.findUniqueOrThrow({ where: { id: node.id } }), db.storyMapPlacement.findUniqueOrThrow({ where: { id: placement.id } }), db.storyMapConnectionPath.count(), db.storyWorldConnection.findMany({ select: { type: true, paths: { select: { id: true } } } }), db.storyRevision.count()]);
  const connectionCount = connectionInventory.length;
  const byType = Object.fromEntries([...new Set(connectionInventory.map((item) => item.type))].sort().map((type) => { const rows = connectionInventory.filter((item) => item.type === type); return [type, { connections: rows.length, pathsAuthored: rows.filter((item) => item.paths.length > 0).length, missingPaths: rows.filter((item) => item.paths.length === 0).length }]; }));
  const restoredPoint = restoredPlacement.geometry as { coordinates: [number, number] };
  if (restoredNode.x !== node.x || restoredNode.y !== node.y || restoredPoint.coordinates[0] !== point.coordinates[0] || restoredPoint.coordinates[1] !== point.coordinates[1] || pathCount !== pathCountBefore || connectionCount !== 25 || !staleConnectionRefused || !boundarySplitVerified || revisionCountAfter - revisionCountBefore < 19) throw new Error("Atlas authoring verification did not restore its fixture cleanly.");
  process.stdout.write(JSON.stringify({ status: "PASS", database: "habitat_atlas_dev", node: "moved-and-restored", boundarySplit: "fixture-created-split-and-removed", placement: "moved-label-tested-and-restored", connection: "created-updated-stale-refused-and-removed", connectionPath: "created-and-removed", revisionsAdded: revisionCountAfter - revisionCountBefore, remainingConnections: connectionCount, remainingPaths: pathCount, pathProgress: { approved: pathCount, missing: connectionCount - pathCount, byType } }, null, 2) + "\n");
}

void main().finally(() => db.$disconnect());
