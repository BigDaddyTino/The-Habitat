import assert from "node:assert/strict";
import { createPrismaClient } from "@habitat/db/client";
import { atlasConnectionLimits, type AtlasLineGeometry } from "@habitat/shared";
import { AtlasPersistenceError, createAtlasPersistenceService } from "../lib/atlas-persistence-service";

const connectionString = process.env.ATLAS_PERSISTENCE_TEST_DATABASE_URL;
if (!connectionString) throw new Error("ATLAS_PERSISTENCE_TEST_DATABASE_URL is required; the live development database is never a persistence-test target.");
const target = new URL(connectionString);
const databaseName = target.pathname.slice(1);
if (!["localhost", "127.0.0.1", "::1"].includes(target.hostname) || !databaseName.startsWith("habitat_atlas_p3_verify_")) {
  throw new Error("Persistence verification is restricted to an explicitly named isolated local database.");
}

const db = createPrismaClient(connectionString);
const atlas = createAtlasPersistenceService(db);

async function rejectsCode(operation: () => Promise<unknown>, code: AtlasPersistenceError["code"]) {
  await assert.rejects(Promise.resolve().then(operation), (error: unknown) => error instanceof AtlasPersistenceError && error.code === code);
}

const tableNames = ["StoryMapTopologyNode", "StoryMapBoundary", "StoryMapAreaRing", "StoryMapAreaRingBoundary", "StoryWorldConnection", "StoryMapConnectionPath"] as const;

async function rowCounts() {
  const result: Record<string, number> = {};
  for (const table of tableNames) {
    const rows = await db.$queryRawUnsafe<Array<{ count: bigint }>>(`SELECT COUNT(*) AS count FROM "${table}"`);
    result[table] = Number(rows[0]!.count);
  }
  return result;
}

async function main() {
  const empty = await rowCounts();
  assert.deepEqual(empty, Object.fromEntries(tableNames.map((table) => [table, 0])));

  const actor = await db.user.create({ data: { username: `atlas-p3-${Date.now()}`, role: "ADMIN", isActive: true } });
  const mapInput = (slug: string) => ({ slug, title: slug, artVersion: "test", imageWidth: 1536, imageHeight: 1024, coordinateWidth: 100_000, coordinateHeight: 66_667, initialCenterX: 50_000, initialCenterY: 33_333, createdByUserId: actor.id });
  const world = await db.storyMap.create({ data: mapInput("p3-world") });
  const local = await db.storyMap.create({ data: mapInput("p3-local") });
  const entry = (slug: string, kind: "REGION" | "CHARACTER" = "REGION") => db.storyEntry.create({ data: { kind, slug, title: slug, status: "CANON", createdByUserId: actor.id } });
  const alpha = await entry("p3-alpha");
  const beta = await entry("p3-beta");
  const gamma = await entry("p3-gamma");
  const character = await entry("p3-character", "CHARACTER");
  const polygon = { type: "POLYGON", coordinates: [[[0, 0], [100, 0], [100, 100], [0, 100], [0, 0]]] };
  const leftPlacement = await db.storyMapPlacement.create({ data: { mapId: world.id, entryId: alpha.id, geometryKind: "POLYGON", geometry: polygon, createdByUserId: actor.id } });
  const rightPlacement = await db.storyMapPlacement.create({ data: { mapId: world.id, entryId: beta.id, geometryKind: "POLYGON", geometry: polygon, createdByUserId: actor.id } });

  await rejectsCode(() => atlas.createTopologyNode({ mapId: world.id, x: 100_001, y: 0, actorUserId: actor.id }), "VALIDATION");
  const values = [["n00", 0, 0], ["n10", 100, 0], ["n20", 200, 0], ["n01", 0, 100], ["n11", 100, 100], ["n21", 200, 100]] as const;
  const nodes = new Map<string, Awaited<ReturnType<typeof atlas.createTopologyNode>>>();
  for (const [name, x, y] of values) nodes.set(name, await atlas.createTopologyNode({ mapId: world.id, x, y, actorUserId: actor.id }));
  const otherNode = await atlas.createTopologyNode({ mapId: local.id, x: 0, y: 0, actorUserId: actor.id });
  const movable = await atlas.createTopologyNode({ mapId: world.id, x: 300, y: 300, actorUserId: actor.id });
  const moved = await atlas.updateTopologyNode({ id: movable.id, mapId: world.id, x: 301, y: 301, expectedVersion: 1, actorUserId: actor.id });
  assert.equal(moved.version, 2);
  await rejectsCode(() => atlas.updateTopologyNode({ id: movable.id, mapId: world.id, x: 302, y: 302, expectedVersion: 1, actorUserId: actor.id }), "STALE_VERSION");

  await rejectsCode(() => atlas.createBoundary({ mapId: world.id, startNodeId: nodes.get("n00")!.id, endNodeId: nodes.get("n00")!.id, kind: "OPEN_BOUNDARY", interiorVertices: [], actorUserId: actor.id }), "VALIDATION");
  await rejectsCode(() => atlas.createBoundary({ mapId: world.id, startNodeId: nodes.get("n00")!.id, endNodeId: otherNode.id, kind: "OPEN_BOUNDARY", interiorVertices: [], actorUserId: actor.id }), "VALIDATION");
  await rejectsCode(() => atlas.createBoundary({ mapId: world.id, startNodeId: nodes.get("n00")!.id, endNodeId: nodes.get("n10")!.id, kind: "OPEN_BOUNDARY", interiorVertices: [[1.5, 2]], actorUserId: actor.id }), "VALIDATION");

  const boundary = async (name: string, start: string, end: string, kind: "INTERNAL_BORDER" | "OPEN_BOUNDARY" = "OPEN_BOUNDARY") => [name, await atlas.createBoundary({ mapId: world.id, startNodeId: nodes.get(start)!.id, endNodeId: nodes.get(end)!.id, kind, interiorVertices: [], actorUserId: actor.id })] as const;
  const boundaryRows = [];
  boundaryRows.push(await boundary("left-top", "n00", "n10"));
  boundaryRows.push(await boundary("shared", "n10", "n11", "INTERNAL_BORDER"));
  boundaryRows.push(await boundary("left-bottom", "n11", "n01"));
  boundaryRows.push(await boundary("left-edge", "n01", "n00"));
  boundaryRows.push(await boundary("right-top", "n10", "n20"));
  boundaryRows.push(await boundary("right-edge", "n20", "n21"));
  boundaryRows.push(await boundary("right-bottom", "n21", "n11"));
  const boundaries = new Map(boundaryRows);
  const refs = (names: readonly string[], reversed = false) => names.map((name, sequence) => ({ boundaryId: boundaries.get(name)!.id, sequence, reversed: reversed && name === "shared" }));
  await atlas.replacePlacementTopology({ placementId: leftPlacement.id, expectedRings: [], actorUserId: actor.id, rings: [{ componentIndex: 0, ringIndex: 0, role: "SHELL", boundaries: refs(["left-top", "shared", "left-bottom", "left-edge"]) }] });
  await atlas.replacePlacementTopology({ placementId: rightPlacement.id, expectedRings: [], actorUserId: actor.id, rings: [{ componentIndex: 0, ringIndex: 0, role: "SHELL", boundaries: refs(["right-top", "right-edge", "right-bottom", "shared"], true) }] });
  assert.equal((await atlas.getAssembledTopologyForPlacement(leftPlacement.id))?.geometry.type, "POLYGON");
  assert.equal((await atlas.getAssembledTopologyForPlacement(rightPlacement.id))?.geometry.type, "POLYGON");
  const sharedUses = await db.storyMapAreaRingBoundary.count({ where: { boundaryId: boundaries.get("shared")!.id } });
  assert.equal(sharedUses, 2);
  const reversedUses = await db.storyMapAreaRingBoundary.count({ where: { boundaryId: boundaries.get("shared")!.id, reversed: true } });
  assert.equal(reversedUses, 1);
  await rejectsCode(() => atlas.deleteBoundary(boundaries.get("shared")!.id, 1, actor.id), "IN_USE");
  await rejectsCode(() => atlas.deleteTopologyNode(nodes.get("n10")!.id, 1, actor.id), "IN_USE");

  const leftRings = await db.storyMapAreaRing.findMany({ where: { placementId: leftPlacement.id }, select: { id: true, version: true } });
  const beforeFailure = await db.storyMapAreaRingBoundary.count({ where: { ringId: { in: leftRings.map((ring) => ring.id) } } });
  await rejectsCode(() => atlas.replacePlacementTopology({ placementId: leftPlacement.id, expectedRings: leftRings, actorUserId: actor.id, rings: [{ componentIndex: 0, ringIndex: 0, role: "SHELL", boundaries: [{ boundaryId: "00000000-0000-0000-0000-000000000000", sequence: 0, reversed: false }] }] }), "VALIDATION");
  assert.equal(await db.storyMapAreaRingBoundary.count({ where: { ringId: { in: leftRings.map((ring) => ring.id) } } }), beforeFailure, "a failed topology replacement must leave no partial write");
  await rejectsCode(() => atlas.replacePlacementTopology({ placementId: leftPlacement.id, expectedRings: leftRings, actorUserId: actor.id, rings: [{ componentIndex: 0, ringIndex: 0, role: "SHELL", boundaries: [{ boundaryId: boundaries.get("left-top")!.id, sequence: 0, reversed: false }, { boundaryId: boundaries.get("shared")!.id, sequence: 0, reversed: false }] }] }), "VALIDATION");
  await rejectsCode(() => atlas.replacePlacementTopology({ placementId: leftPlacement.id, expectedRings: leftRings, actorUserId: actor.id, rings: [{ componentIndex: 0, ringIndex: 0, role: "SHELL", boundaries: refs(["left-top", "right-edge", "left-bottom", "left-edge"]) }] }), "VALIDATION");

  const connectionInput = { fromEntryId: alpha.id, toEntryId: beta.id, type: "ROAD" as const, directionality: "FROM_TO" as const, status: "OPEN" as const, visibility: "DEFAULT" as const, originalWording: "coast road", editorialNotes: null, metadata: {}, actorUserId: actor.id };
  const road = await atlas.createWorldConnection(connectionInput);
  const secondRoad = await atlas.createWorldConnection({ ...connectionInput, directionality: "BIDIRECTIONAL", originalWording: "old military road" });
  assert.notEqual(road.id, secondRoad.id, "multiple routes between one endpoint pair need distinct stable identities");
  const unknown = await atlas.createWorldConnection({ ...connectionInput, toEntryId: gamma.id, type: "UNKNOWN", directionality: "UNSPECIFIED", originalWording: "authored but unclassified" });
  assert.equal(unknown.type, "UNKNOWN");
  await rejectsCode(() => atlas.createWorldConnection({ ...connectionInput, toEntryId: alpha.id }), "VALIDATION");
  await rejectsCode(() => atlas.createWorldConnection({ ...connectionInput, toEntryId: "00000000-0000-0000-0000-000000000000" }), "NOT_FOUND");
  await rejectsCode(() => atlas.createWorldConnection({ ...connectionInput, toEntryId: character.id }), "VALIDATION");
  await rejectsCode(() => atlas.createWorldConnection({ ...connectionInput, metadata: { note: "x".repeat(atlasConnectionLimits.maxMetadataStringLength + 1) } }), "VALIDATION");
  const updatedRoad = await atlas.updateWorldConnection({ ...connectionInput, id: road.id, expectedVersion: 1, status: "CLOSED" });
  assert.equal(updatedRoad.version, 2);
  await rejectsCode(() => atlas.updateWorldConnection({ ...connectionInput, id: road.id, expectedVersion: 1, status: "OPEN" }), "STALE_VERSION");

  const line = { type: "LINESTRING", coordinates: [[0, 0], [100, 100]] } as unknown as AtlasLineGeometry;
  await atlas.createConnectionPath({ connectionId: road.id, mapId: world.id, geometry: line, minZoom: 0, maxZoom: 4, priority: 1, actorUserId: actor.id });
  await atlas.createConnectionPath({ connectionId: road.id, mapId: local.id, geometry: line, minZoom: 0, maxZoom: null, priority: 1, actorUserId: actor.id });
  assert.equal(await db.storyMapConnectionPath.count({ where: { connectionId: road.id } }), 2, "one connection may have scene-specific paths on multiple maps");
  const outside = { type: "LINESTRING", coordinates: [[0, 0], [100_001, 100]] } as unknown as AtlasLineGeometry;
  await rejectsCode(() => atlas.createConnectionPath({ connectionId: secondRoad.id, mapId: world.id, geometry: outside, minZoom: 0, maxZoom: null, priority: 0, actorUserId: actor.id }), "VALIDATION");

  const revisions = await db.storyRevision.groupBy({ by: ["entityType"], where: { actorUserId: actor.id }, _count: { _all: true } });
  for (const required of ["TOPO_NODE", "BOUNDARY", "AREA_RING", "WORLD_CONN", "CONN_PATH"]) assert.ok(revisions.some((row) => row.entityType === required && row._count._all > 0), `${required} must use StoryRevision`);
  const final = await rowCounts();
  process.stdout.write(`${JSON.stringify({ database: databaseName, initiallyEmpty: empty, exercisedRows: final, revisionEntityTypes: revisions.map((row) => row.entityType).sort() }, null, 2)}\n`);
}

void main().finally(() => db.$disconnect());
