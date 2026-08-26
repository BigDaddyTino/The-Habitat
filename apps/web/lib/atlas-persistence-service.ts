import { randomUUID } from "node:crypto";
import { getPrismaClient, type Prisma } from "@habitat/db/client";
import {
  atlasCoordinateWidth,
  validateAtlasLineString,
  validateAtlasMapConnectionPath,
  validateAtlasPoint,
  validateAtlasTopology,
  validateAtlasWorldConnection,
  type AtlasBoundary,
  type AtlasCoordinateDimensions,
  type AtlasMapConnectionPath,
  type AtlasPoint,
  type AtlasRingBoundaryReference,
  type AtlasTopologyArea,
  type AtlasTopologyDataset,
  type AtlasTopologyNode,
  type AtlasWorldConnection,
} from "@habitat/shared";

export type AtlasPersistenceClient = ReturnType<typeof getPrismaClient>;
type Transaction = Prisma.TransactionClient;

export type AtlasPersistenceErrorCode = "NOT_FOUND" | "VALIDATION" | "STALE_VERSION" | "IN_USE" | "CONFLICT";

export class AtlasPersistenceError extends Error {
  constructor(readonly code: AtlasPersistenceErrorCode, message: string) {
    super(message);
    this.name = "AtlasPersistenceError";
  }
}

type RevisionEntityType = "PLACEMENT" | "TOPO_NODE" | "BOUNDARY" | "AREA_RING" | "WORLD_CONN" | "CONN_PATH";
type RevisionAction = "CREATED" | "UPDATED" | "DELETED";

type MapExtent = { id: string; slug: string; coordinateWidth: number; coordinateHeight: number };

export type CreateTopologyNodeInput = { mapId: string; x: number; y: number; actorUserId: string };
export type UpdateTopologyNodeInput = CreateTopologyNodeInput & { id: string; expectedVersion: number };
export type CreateBoundaryInput = {
  mapId: string;
  startNodeId: string;
  endNodeId: string;
  kind: AtlasBoundary["kind"];
  interiorVertices: readonly (readonly [number, number])[];
  actorUserId: string;
};
export type UpdateBoundaryInput = CreateBoundaryInput & { id: string; expectedVersion: number };
export type SplitBoundaryInput = { readonly id: string; readonly expectedVersion: number; readonly interiorVertexIndex: number; readonly actorUserId: string };

export type PersistedAreaRingInput = {
  readonly id?: string;
  readonly componentIndex: number;
  readonly ringIndex: number;
  readonly role: "SHELL" | "HOLE";
  readonly boundaries: readonly AtlasRingBoundaryReference[];
};

export type ReplacePlacementTopologyInput = {
  readonly placementId: string;
  readonly expectedRings: readonly { readonly id: string; readonly version: number }[];
  readonly rings: readonly PersistedAreaRingInput[];
  readonly actorUserId: string;
};

export type CreateWorldConnectionInput = Omit<AtlasWorldConnection, "id" | "version"> & { readonly id?: string; readonly actorUserId: string };
export type UpdateWorldConnectionInput = CreateWorldConnectionInput & { readonly id: string; readonly expectedVersion: number };
export type CreateConnectionPathInput = Omit<AtlasMapConnectionPath, "id" | "version" | "mapSlug"> & { readonly id?: string; readonly mapId: string; readonly actorUserId: string };
export type UpdateConnectionPathInput = CreateConnectionPathInput & { readonly id: string; readonly expectedVersion: number };
export type CreatePointPlacementInput = { readonly mapId: string; readonly entryId: string; readonly x: number; readonly y: number; readonly labelX: number | null; readonly labelY: number | null; readonly minZoom: number; readonly maxZoom: number | null; readonly priority: number; readonly actorUserId: string };
export type UpdatePointPlacementInput = CreatePointPlacementInput & { readonly id: string; readonly expectedVersion: number };

function topologyWrite<T>(client: AtlasPersistenceClient, operation: (tx: Transaction) => Promise<T>) {
  return client.$transaction(operation, { isolationLevel: "Serializable" });
}

function fail(code: AtlasPersistenceErrorCode, message: string): never {
  throw new AtlasPersistenceError(code, message);
}

function routeRevisionLabel(type: AtlasWorldConnection["type"]) {
  switch (type) {
    case "ROAD": return "road route";
    case "TRAIL": return "trail route";
    case "RIVER_TRAVEL": return "river route";
    case "SEA_ROUTE": return "sea route";
    case "AIR_ROUTE": return "air route";
    case "OTHER":
    case "UNKNOWN": return "route";
  }
}

function dimensions(map: MapExtent): AtlasCoordinateDimensions {
  if (map.coordinateWidth !== atlasCoordinateWidth || !Number.isSafeInteger(map.coordinateHeight) || map.coordinateHeight <= 0) {
    fail("VALIDATION", `Map ${map.slug} does not have a valid Atlas fixed-point extent.`);
  }
  return { width: atlasCoordinateWidth, height: map.coordinateHeight };
}

function inputJson(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

function findingMessage(label: string, findings: readonly { code: string; path: string; message: string }[]) {
  return `${label}: ${findings.map((finding) => `${finding.code} at ${finding.path}: ${finding.message}`).join("; ")}`;
}

async function recordRevision(
  tx: Transaction,
  input: { entityType: RevisionEntityType; entityId: string; action: RevisionAction; actorUserId: string; summary: string; before?: unknown; after?: unknown },
) {
  await tx.storyRevision.create({
    data: {
      entityType: input.entityType,
      entityId: input.entityId,
      action: input.action,
      actorUserId: input.actorUserId,
      summary: input.summary.slice(0, 300),
      before: input.before === undefined ? undefined : inputJson(input.before),
      after: input.after === undefined ? undefined : inputJson(input.after),
    },
  });
}

function topologyNode(row: { id: string; map: { slug: string }; x: number; y: number; version: number }): AtlasTopologyNode {
  return { id: row.id, mapSlug: row.map.slug, position: [row.x, row.y] as unknown as AtlasPoint, version: row.version };
}

function topologyBoundary(row: {
  id: string;
  map: { slug: string };
  startNodeId: string;
  endNodeId: string;
  interiorVertices: unknown;
  kind: AtlasBoundary["kind"];
  version: number;
}): AtlasBoundary {
  return {
    id: row.id,
    mapSlug: row.map.slug,
    startNodeId: row.startNodeId,
    endNodeId: row.endNodeId,
    interiorVertices: row.interiorVertices as readonly AtlasPoint[],
    kind: row.kind,
    version: row.version,
  };
}

async function loadTopologyDataset(tx: Transaction, mapId: string): Promise<{ map: MapExtent; dataset: AtlasTopologyDataset }> {
  const map = await tx.storyMap.findUnique({
    where: { id: mapId },
    select: {
      id: true,
      slug: true,
      coordinateWidth: true,
      coordinateHeight: true,
      topologyNodes: { include: { map: { select: { slug: true } } }, orderBy: { id: "asc" } },
      boundaries: { include: { map: { select: { slug: true } } }, orderBy: { id: "asc" } },
      placements: {
        where: { areaRings: { some: {} } },
        select: {
          id: true,
          areaRings: {
            orderBy: [{ componentIndex: "asc" }, { ringIndex: "asc" }],
            include: { boundaries: { orderBy: { sequence: "asc" } } },
          },
        },
      },
    },
  });
  if (!map) fail("NOT_FOUND", "Atlas map no longer exists.");
  const areas: AtlasTopologyArea[] = map.placements.map((placement) => ({
    id: placement.id,
    mapSlug: map.slug,
    layerKind: "BASE_GEOGRAPHY",
    version: Math.max(1, ...placement.areaRings.map((ring) => ring.version)),
    rings: placement.areaRings.map((ring) => ({
      id: ring.id,
      componentIndex: ring.componentIndex,
      role: ring.role,
      boundaries: ring.boundaries.map((reference) => ({ boundaryId: reference.boundaryId, sequence: reference.sequence, reversed: reference.reversed })),
    })),
  }));
  return {
    map: { id: map.id, slug: map.slug, coordinateWidth: map.coordinateWidth, coordinateHeight: map.coordinateHeight },
    dataset: { nodes: map.topologyNodes.map(topologyNode), boundaries: map.boundaries.map(topologyBoundary), areas },
  };
}

function assertTopologyValid(dataset: AtlasTopologyDataset, map: MapExtent, label: string) {
  const result = validateAtlasTopology(dataset, dimensions(map));
  if (!result.valid) fail("VALIDATION", findingMessage(label, result.findings));
  return result;
}

async function assertMapTopologyValid(
  tx: Transaction,
  mapId: string,
  mutate: (dataset: AtlasTopologyDataset) => AtlasTopologyDataset = (dataset) => dataset,
) {
  const snapshot = await loadTopologyDataset(tx, mapId);
  return assertTopologyValid(mutate(snapshot.dataset), snapshot.map, "Invalid topology");
}

async function getAssembledTopologyForPlacement(tx: Transaction, placementId: string) {
  const placement = await tx.storyMapPlacement.findUnique({ where: { id: placementId }, select: { mapId: true } });
  if (!placement) fail("NOT_FOUND", "Atlas placement no longer exists.");
  const snapshot = await loadTopologyDataset(tx, placement.mapId);
  const area = snapshot.dataset.areas.find((candidate) => candidate.id === placementId);
  if (!area) return null;
  const result = assertTopologyValid({ ...snapshot.dataset, areas: [area] }, snapshot.map, "Invalid placement topology");
  return result.value?.[0] ?? null;
}

async function requireMap(tx: Transaction, mapId: string): Promise<MapExtent> {
  const map = await tx.storyMap.findUnique({ where: { id: mapId }, select: { id: true, slug: true, coordinateWidth: true, coordinateHeight: true } });
  if (!map) fail("NOT_FOUND", "Atlas map no longer exists.");
  dimensions(map);
  return map;
}

async function requireRegionEndpoints(tx: Transaction, fromEntryId: string, toEntryId: string) {
  const entries = await tx.storyEntry.findMany({ where: { id: { in: [fromEntryId, toEntryId] } }, select: { id: true, kind: true, slug: true } });
  const byId = new Map(entries.map((entry) => [entry.id, entry]));
  const from = byId.get(fromEntryId);
  const to = byId.get(toEntryId);
  if (!from || !to) fail("NOT_FOUND", "A world-connection endpoint no longer exists.");
  if (from.kind !== "REGION" || to.kind !== "REGION") fail("VALIDATION", "Prompt 3 world connections are place-to-place and require canonical REGION endpoints.");
  return { from, to };
}

function connectionContract(input: CreateWorldConnectionInput | UpdateWorldConnectionInput, id: string, version: number): AtlasWorldConnection {
  return {
    id,
    fromEntryId: input.fromEntryId,
    toEntryId: input.toEntryId,
    type: input.type,
    directionality: input.directionality,
    status: input.status,
    visibility: input.visibility,
    originalWording: input.originalWording,
    editorialNotes: input.editorialNotes,
    metadata: input.metadata,
    version,
  };
}

function validatePointPlacement(input: CreatePointPlacementInput, map: MapExtent) {
  const point = validateAtlasPoint([input.x, input.y], dimensions(map));
  if (!point.ok) fail("VALIDATION", `Invalid placement coordinate: ${point.issue}.`);
  if ((input.labelX === null) !== (input.labelY === null)) fail("VALIDATION", "A label anchor requires both X and Y coordinates.");
  if (input.labelX !== null && input.labelY !== null) {
    const label = validateAtlasPoint([input.labelX, input.labelY], dimensions(map));
    if (!label.ok) fail("VALIDATION", `Invalid label coordinate: ${label.issue}.`);
  }
  if (!Number.isFinite(input.minZoom) || input.minZoom < 0 || (input.maxZoom !== null && (!Number.isFinite(input.maxZoom) || input.maxZoom < input.minZoom))) fail("VALIDATION", "Placement zoom bounds are invalid.");
  if (!Number.isSafeInteger(input.priority)) fail("VALIDATION", "Placement priority must be a safe integer.");
}

export function createAtlasPersistenceService(client: AtlasPersistenceClient) {
  return {
    getTopologyForMap(mapId: string) {
      return client.$transaction((tx) => loadTopologyDataset(tx, mapId));
    },

    getTopologyNode(id: string) {
      return client.storyMapTopologyNode.findUnique({ where: { id } });
    },

    createTopologyNode(input: CreateTopologyNodeInput) {
      return topologyWrite(client, async (tx) => {
        const map = await requireMap(tx, input.mapId);
        const point = validateAtlasPoint([input.x, input.y], dimensions(map));
        if (!point.ok) fail("VALIDATION", `Invalid topology coordinate: ${point.issue}.`);
        const node = await tx.storyMapTopologyNode.create({ data: { mapId: input.mapId, x: input.x, y: input.y, createdByUserId: input.actorUserId } });
        await recordRevision(tx, { entityType: "TOPO_NODE", entityId: node.id, action: "CREATED", actorUserId: input.actorUserId, summary: `Created Atlas topology node on ${map.slug}`, after: { mapId: input.mapId, x: input.x, y: input.y, version: 1 } });
        return node;
      });
    },

    updateTopologyNode(input: UpdateTopologyNodeInput) {
      return topologyWrite(client, async (tx) => {
        const current = await tx.storyMapTopologyNode.findUnique({ where: { id: input.id }, include: { map: { select: { id: true, slug: true, coordinateWidth: true, coordinateHeight: true } } } });
        if (!current) fail("NOT_FOUND", "Topology node no longer exists.");
        if (current.mapId !== input.mapId) fail("VALIDATION", "Topology nodes cannot move between maps.");
        const point = validateAtlasPoint([input.x, input.y], dimensions(current.map));
        if (!point.ok) fail("VALIDATION", `Invalid topology coordinate: ${point.issue}.`);
        await assertMapTopologyValid(tx, current.mapId, (dataset) => ({ ...dataset, nodes: dataset.nodes.map((node) => node.id === current.id ? { ...node, position: point.value } : node) }));
        const updated = await tx.storyMapTopologyNode.updateMany({ where: { id: current.id, version: input.expectedVersion }, data: { x: input.x, y: input.y, updatedByUserId: input.actorUserId, version: { increment: 1 } } });
        if (updated.count !== 1) fail("STALE_VERSION", "Somebody edited this topology node first.");
        await recordRevision(tx, { entityType: "TOPO_NODE", entityId: current.id, action: "UPDATED", actorUserId: input.actorUserId, summary: `Moved Atlas topology node on ${current.map.slug}`, before: { x: current.x, y: current.y, version: current.version }, after: { x: input.x, y: input.y, version: input.expectedVersion + 1 } });
        return tx.storyMapTopologyNode.findUniqueOrThrow({ where: { id: current.id } });
      });
    },

    deleteTopologyNode(id: string, expectedVersion: number, actorUserId: string) {
      return topologyWrite(client, async (tx) => {
        const current = await tx.storyMapTopologyNode.findUnique({ where: { id }, include: { map: { select: { slug: true } }, _count: { select: { boundariesFrom: true, boundariesTo: true } } } });
        if (!current) fail("NOT_FOUND", "Topology node no longer exists.");
        if (current._count.boundariesFrom + current._count.boundariesTo > 0) fail("IN_USE", "Delete boundaries that consume this node first.");
        const deleted = await tx.storyMapTopologyNode.deleteMany({ where: { id, version: expectedVersion } });
        if (deleted.count !== 1) fail("STALE_VERSION", "Somebody edited this topology node first.");
        await recordRevision(tx, { entityType: "TOPO_NODE", entityId: id, action: "DELETED", actorUserId, summary: `Deleted unused Atlas topology node on ${current.map.slug}`, before: { mapId: current.mapId, x: current.x, y: current.y, version: current.version } });
      });
    },

    createBoundary(input: CreateBoundaryInput) {
      return topologyWrite(client, async (tx) => {
        const map = await requireMap(tx, input.mapId);
        if (input.startNodeId === input.endNodeId) fail("VALIDATION", "A boundary requires distinct endpoint nodes.");
        const nodes = await tx.storyMapTopologyNode.findMany({ where: { id: { in: [input.startNodeId, input.endNodeId] } } });
        if (nodes.length !== 2) fail("NOT_FOUND", "A boundary endpoint no longer exists.");
        if (nodes.some((node) => node.mapId !== input.mapId)) fail("VALIDATION", "Boundary endpoints must belong to its map.");
        const byId = new Map(nodes.map((node) => [node.id, node]));
        const line = validateAtlasLineString([[byId.get(input.startNodeId)!.x, byId.get(input.startNodeId)!.y], ...input.interiorVertices, [byId.get(input.endNodeId)!.x, byId.get(input.endNodeId)!.y]], dimensions(map));
        if (!line.valid) fail("VALIDATION", findingMessage("Invalid boundary", line.findings));
        const boundary = await tx.storyMapBoundary.create({ data: { mapId: input.mapId, startNodeId: input.startNodeId, endNodeId: input.endNodeId, kind: input.kind, interiorVertices: inputJson(input.interiorVertices), createdByUserId: input.actorUserId } });
        await recordRevision(tx, { entityType: "BOUNDARY", entityId: boundary.id, action: "CREATED", actorUserId: input.actorUserId, summary: `Created shared Atlas boundary on ${map.slug}`, after: { ...input, actorUserId: undefined, version: 1 } });
        return boundary;
      });
    },

    updateBoundary(input: UpdateBoundaryInput) {
      return topologyWrite(client, async (tx) => {
        const current = await tx.storyMapBoundary.findUnique({ where: { id: input.id }, include: { map: { select: { id: true, slug: true, coordinateWidth: true, coordinateHeight: true } } } });
        if (!current) fail("NOT_FOUND", "Boundary no longer exists.");
        if (current.mapId !== input.mapId) fail("VALIDATION", "Boundaries cannot move between maps.");
        if (input.startNodeId === input.endNodeId) fail("VALIDATION", "Boundary endpoints must be distinct nodes on the same map.");
        const nodes = await tx.storyMapTopologyNode.findMany({ where: { id: { in: [input.startNodeId, input.endNodeId] } } });
        if (nodes.length !== 2) fail("NOT_FOUND", "A boundary endpoint no longer exists.");
        if (nodes.some((node) => node.mapId !== input.mapId)) fail("VALIDATION", "Boundary endpoints must be distinct nodes on the same map.");
        const byId = new Map(nodes.map((node) => [node.id, node]));
        const line = validateAtlasLineString([[byId.get(input.startNodeId)!.x, byId.get(input.startNodeId)!.y], ...input.interiorVertices, [byId.get(input.endNodeId)!.x, byId.get(input.endNodeId)!.y]], dimensions(current.map));
        if (!line.valid) fail("VALIDATION", findingMessage("Invalid boundary", line.findings));
        const replacement: AtlasBoundary = { id: current.id, mapSlug: current.map.slug, startNodeId: input.startNodeId, endNodeId: input.endNodeId, interiorVertices: input.interiorVertices as unknown as readonly AtlasPoint[], kind: input.kind, version: input.expectedVersion + 1 };
        await assertMapTopologyValid(tx, input.mapId, (dataset) => ({ ...dataset, boundaries: dataset.boundaries.map((boundary) => boundary.id === current.id ? replacement : boundary) }));
        const updated = await tx.storyMapBoundary.updateMany({ where: { id: current.id, version: input.expectedVersion }, data: { startNodeId: input.startNodeId, endNodeId: input.endNodeId, kind: input.kind, interiorVertices: inputJson(input.interiorVertices), updatedByUserId: input.actorUserId, version: { increment: 1 } } });
        if (updated.count !== 1) fail("STALE_VERSION", "Somebody edited this boundary first.");
        await recordRevision(tx, { entityType: "BOUNDARY", entityId: current.id, action: "UPDATED", actorUserId: input.actorUserId, summary: `Updated shared Atlas boundary on ${current.map.slug}`, before: { startNodeId: current.startNodeId, endNodeId: current.endNodeId, kind: current.kind, interiorVertices: current.interiorVertices, version: current.version }, after: { startNodeId: input.startNodeId, endNodeId: input.endNodeId, kind: input.kind, interiorVertices: input.interiorVertices, version: input.expectedVersion + 1 } });
        return tx.storyMapBoundary.findUniqueOrThrow({ where: { id: current.id } });
      });
    },

    splitBoundaryAtInteriorVertex(input: SplitBoundaryInput) {
      return topologyWrite(client, async (tx) => {
        const current = await tx.storyMapBoundary.findUnique({ where: { id: input.id }, include: { map: { select: { id: true, slug: true, coordinateWidth: true, coordinateHeight: true } } } });
        if (!current) fail("NOT_FOUND", "Boundary no longer exists.");
        if (current.version !== input.expectedVersion) fail("STALE_VERSION", "Somebody edited this boundary first.");
        const interior = current.interiorVertices as unknown as readonly (readonly [number, number])[];
        if (!Number.isSafeInteger(input.interiorVertexIndex) || input.interiorVertexIndex < 0 || input.interiorVertexIndex >= interior.length) fail("VALIDATION", "Choose an existing interior vertex at which to split this boundary.");
        const splitPoint = interior[input.interiorVertexIndex]!;
        const point = validateAtlasPoint(splitPoint, dimensions(current.map));
        if (!point.ok) fail("VALIDATION", `Invalid split coordinate: ${point.issue}.`);
        const nodeId = randomUUID();
        const firstId = randomUUID();
        const secondId = randomUUID();
        const firstInterior = interior.slice(0, input.interiorVertexIndex);
        const secondInterior = interior.slice(input.interiorVertexIndex + 1);
        const first: AtlasBoundary = { id: firstId, mapSlug: current.map.slug, startNodeId: current.startNodeId, endNodeId: nodeId, kind: current.kind, interiorVertices: firstInterior as unknown as readonly AtlasPoint[], version: 1 };
        const second: AtlasBoundary = { id: secondId, mapSlug: current.map.slug, startNodeId: nodeId, endNodeId: current.endNodeId, kind: current.kind, interiorVertices: secondInterior as unknown as readonly AtlasPoint[], version: 1 };
        await assertMapTopologyValid(tx, current.mapId, (dataset) => ({
          nodes: [...dataset.nodes, { id: nodeId, mapSlug: current.map.slug, position: point.value, version: 1 }],
          boundaries: dataset.boundaries.flatMap((boundary) => boundary.id === current.id ? [first, second] : [boundary]),
          areas: dataset.areas.map((area) => ({ ...area, rings: area.rings.map((ring) => ({ ...ring, boundaries: ring.boundaries.flatMap((reference) => reference.boundaryId !== current.id ? [reference] : reference.reversed ? [{ boundaryId: secondId, sequence: 0, reversed: true }, { boundaryId: firstId, sequence: 0, reversed: true }] : [{ boundaryId: firstId, sequence: 0, reversed: false }, { boundaryId: secondId, sequence: 0, reversed: false }]).map((reference, sequence) => ({ ...reference, sequence })) })) })),
        }));
        const affectedRings = await tx.storyMapAreaRing.findMany({ where: { boundaries: { some: { boundaryId: current.id } } }, include: { boundaries: { orderBy: { sequence: "asc" } } } });
        await tx.storyMapTopologyNode.create({ data: { id: nodeId, mapId: current.mapId, x: point.value[0], y: point.value[1], createdByUserId: input.actorUserId } });
        await tx.storyMapBoundary.createMany({ data: [{ id: firstId, mapId: current.mapId, startNodeId: current.startNodeId, endNodeId: nodeId, kind: current.kind, interiorVertices: inputJson(firstInterior), createdByUserId: input.actorUserId }, { id: secondId, mapId: current.mapId, startNodeId: nodeId, endNodeId: current.endNodeId, kind: current.kind, interiorVertices: inputJson(secondInterior), createdByUserId: input.actorUserId }] });
        if (affectedRings.length) {
          await tx.storyMapAreaRingBoundary.deleteMany({ where: { ringId: { in: affectedRings.map((ring) => ring.id) } } });
          for (const ring of affectedRings) {
            const references = ring.boundaries.flatMap((reference) => reference.boundaryId !== current.id ? [{ boundaryId: reference.boundaryId, reversed: reference.reversed }] : reference.reversed ? [{ boundaryId: secondId, reversed: true }, { boundaryId: firstId, reversed: true }] : [{ boundaryId: firstId, reversed: false }, { boundaryId: secondId, reversed: false }]);
            await tx.storyMapAreaRingBoundary.createMany({ data: references.map((reference, sequence) => ({ ringId: ring.id, boundaryId: reference.boundaryId, sequence, reversed: reference.reversed })) });
            await tx.storyMapAreaRing.update({ where: { id: ring.id }, data: { version: { increment: 1 }, updatedByUserId: input.actorUserId } });
          }
        }
        await tx.storyMapBoundary.delete({ where: { id: current.id } });
        await recordRevision(tx, { entityType: "TOPO_NODE", entityId: nodeId, action: "CREATED", actorUserId: input.actorUserId, summary: `Created topology node while splitting a boundary on ${current.map.slug}`, after: { x: point.value[0], y: point.value[1], version: 1 } });
        await recordRevision(tx, { entityType: "BOUNDARY", entityId: current.id, action: "DELETED", actorUserId: input.actorUserId, summary: `Split shared Atlas boundary on ${current.map.slug}`, before: current, after: { replacementBoundaryIds: [firstId, secondId], nodeId } });
        return { nodeId, boundaryIds: [firstId, secondId] as const, affectedRingIds: affectedRings.map((ring) => ring.id) };
      });
    },

    deleteBoundary(id: string, expectedVersion: number, actorUserId: string) {
      return topologyWrite(client, async (tx) => {
        const current = await tx.storyMapBoundary.findUnique({ where: { id }, include: { map: { select: { slug: true } }, _count: { select: { ringReferences: true } } } });
        if (!current) fail("NOT_FOUND", "Boundary no longer exists.");
        if (current._count.ringReferences > 0) fail("IN_USE", "Remove this boundary from every area ring before deleting it.");
        const deleted = await tx.storyMapBoundary.deleteMany({ where: { id, version: expectedVersion } });
        if (deleted.count !== 1) fail("STALE_VERSION", "Somebody edited this boundary first.");
        await recordRevision(tx, { entityType: "BOUNDARY", entityId: id, action: "DELETED", actorUserId, summary: `Deleted unused Atlas boundary on ${current.map.slug}`, before: { mapId: current.mapId, startNodeId: current.startNodeId, endNodeId: current.endNodeId, kind: current.kind, interiorVertices: current.interiorVertices, version: current.version } });
      });
    },

    getAssembledTopologyForPlacement(placementId: string) {
      return client.$transaction((tx) => getAssembledTopologyForPlacement(tx, placementId));
    },

    createPointPlacement(input: CreatePointPlacementInput) {
      return client.$transaction(async (tx) => {
        const map = await requireMap(tx, input.mapId);
        validatePointPlacement(input, map);
        const entry = await tx.storyEntry.findUnique({ where: { id: input.entryId }, select: { id: true, slug: true, title: true, kind: true } });
        if (!entry) fail("NOT_FOUND", "Codex location no longer exists.");
        if (entry.kind !== "REGION") fail("VALIDATION", "Atlas place authoring requires a canonical REGION entry.");
        const existing = await tx.storyMapPlacement.findUnique({ where: { mapId_entryId: { mapId: input.mapId, entryId: input.entryId } }, select: { id: true } });
        if (existing) fail("CONFLICT", "This Codex location is already placed on the scene.");
        const placement = await tx.storyMapPlacement.create({ data: { mapId: input.mapId, entryId: input.entryId, geometryKind: "POINT", geometry: inputJson({ type: "POINT", coordinates: [input.x, input.y] }), labelX: input.labelX, labelY: input.labelY, minZoom: input.minZoom, maxZoom: input.maxZoom, priority: input.priority, createdByUserId: input.actorUserId } });
        await recordRevision(tx, { entityType: "PLACEMENT", entityId: placement.id, action: "CREATED", actorUserId: input.actorUserId, summary: `Placed ${entry.title} on ${map.slug}`, after: { entryId: entry.id, position: [input.x, input.y], label: input.labelX === null ? null : [input.labelX, input.labelY], minZoom: input.minZoom, maxZoom: input.maxZoom, priority: input.priority, version: 1 } });
        return placement;
      });
    },

    updatePointPlacement(input: UpdatePointPlacementInput) {
      return client.$transaction(async (tx) => {
        const map = await requireMap(tx, input.mapId);
        validatePointPlacement(input, map);
        const current = await tx.storyMapPlacement.findUnique({ where: { id: input.id }, include: { entry: { select: { title: true } }, _count: { select: { areaRings: true } } } });
        if (!current) fail("NOT_FOUND", "Atlas placement no longer exists.");
        if (current.mapId !== input.mapId || current.entryId !== input.entryId) fail("VALIDATION", "Placements cannot move between maps or Codex entities.");
        if (current.geometryKind !== "POINT" || current._count.areaRings > 0) fail("VALIDATION", "Point authoring cannot overwrite region topology.");
        const updated = await tx.storyMapPlacement.updateMany({ where: { id: input.id, version: input.expectedVersion }, data: { geometry: inputJson({ type: "POINT", coordinates: [input.x, input.y] }), labelX: input.labelX, labelY: input.labelY, minZoom: input.minZoom, maxZoom: input.maxZoom, priority: input.priority, updatedByUserId: input.actorUserId, version: { increment: 1 } } });
        if (updated.count !== 1) fail("STALE_VERSION", "Somebody edited this placement first.");
        await recordRevision(tx, { entityType: "PLACEMENT", entityId: input.id, action: "UPDATED", actorUserId: input.actorUserId, summary: `Updated ${current.entry.title} placement on ${map.slug}`, before: { geometry: current.geometry, labelX: current.labelX, labelY: current.labelY, minZoom: current.minZoom, maxZoom: current.maxZoom, priority: current.priority, version: current.version }, after: { position: [input.x, input.y], label: input.labelX === null ? null : [input.labelX, input.labelY], minZoom: input.minZoom, maxZoom: input.maxZoom, priority: input.priority, version: input.expectedVersion + 1 } });
        return tx.storyMapPlacement.findUniqueOrThrow({ where: { id: input.id } });
      });
    },

    deletePointPlacement(id: string, expectedVersion: number, actorUserId: string) {
      return client.$transaction(async (tx) => {
        const current = await tx.storyMapPlacement.findUnique({ where: { id }, include: { entry: { select: { title: true } }, map: { select: { slug: true } }, _count: { select: { areaRings: true } } } });
        if (!current) fail("NOT_FOUND", "Atlas placement no longer exists.");
        if (current.geometryKind !== "POINT" || current._count.areaRings > 0) fail("IN_USE", "Region topology cannot be removed through Unplace POI.");
        const deleted = await tx.storyMapPlacement.deleteMany({ where: { id, version: expectedVersion } });
        if (deleted.count !== 1) fail("STALE_VERSION", "Somebody edited this placement first.");
        await recordRevision(tx, { entityType: "PLACEMENT", entityId: id, action: "DELETED", actorUserId, summary: `Unplaced ${current.entry.title} from ${current.map.slug}`, before: current });
      });
    },

    replacePlacementTopology(input: ReplacePlacementTopologyInput) {
      const proposed = input.rings.map((ring) => ({ ...ring, id: ring.id ?? randomUUID() }));
      return topologyWrite(client, async (tx) => {
        const locked = await tx.$queryRaw<Array<{ id: string }>>`SELECT "id" FROM "StoryMapPlacement" WHERE "id" = ${input.placementId}::uuid FOR UPDATE`;
        if (locked.length !== 1) fail("NOT_FOUND", "Atlas placement no longer exists.");
        const placement = await tx.storyMapPlacement.findUnique({
          where: { id: input.placementId },
          include: { map: { select: { id: true, slug: true, coordinateWidth: true, coordinateHeight: true } }, areaRings: { include: { boundaries: { orderBy: { sequence: "asc" } } }, orderBy: [{ componentIndex: "asc" }, { ringIndex: "asc" }] } },
        });
        if (!placement) fail("NOT_FOUND", "Atlas placement no longer exists.");
        const actualVersions = placement.areaRings.map((ring) => `${ring.id}:${ring.version}`).sort();
        const expectedVersions = input.expectedRings.map((ring) => `${ring.id}:${ring.version}`).sort();
        if (actualVersions.length !== expectedVersions.length || actualVersions.some((value, index) => value !== expectedVersions[index])) fail("STALE_VERSION", "Somebody edited this placement topology first.");
        const identifiers = new Set<string>();
        const slots = new Set<string>();
        for (const ring of proposed) {
          if (identifiers.has(ring.id)) fail("VALIDATION", "Area ring identities must be unique.");
          identifiers.add(ring.id);
          const slot = `${ring.componentIndex}:${ring.ringIndex}`;
          if (slots.has(slot)) fail("VALIDATION", "Each component/ring index may be used once.");
          slots.add(slot);
          if ((ring.role === "SHELL") !== (ring.ringIndex === 0)) fail("VALIDATION", "Each component uses ring index zero for its shell and positive indexes for holes.");
        }
        const snapshot = await loadTopologyDataset(tx, placement.mapId);
        const proposedArea: AtlasTopologyArea = {
          id: placement.id,
          mapSlug: placement.map.slug,
          layerKind: "BASE_GEOGRAPHY",
          version: Math.max(1, ...placement.areaRings.map((ring) => ring.version + 1)),
          rings: proposed.map((ring) => ({ id: ring.id, componentIndex: ring.componentIndex, role: ring.role, boundaries: ring.boundaries })),
        };
        if (proposed.length > 0) assertTopologyValid({ ...snapshot.dataset, areas: [proposedArea] }, placement.map, "Invalid replacement topology");

        const before = placement.areaRings.map((ring) => ({ id: ring.id, componentIndex: ring.componentIndex, ringIndex: ring.ringIndex, role: ring.role, version: ring.version, boundaries: ring.boundaries }));
        if (placement.areaRings.length) {
          await tx.storyMapAreaRingBoundary.deleteMany({ where: { ringId: { in: placement.areaRings.map((ring) => ring.id) } } });
          await tx.storyMapAreaRing.deleteMany({ where: { id: { in: placement.areaRings.map((ring) => ring.id) } } });
        }
        const currentById = new Map(placement.areaRings.map((ring) => [ring.id, ring]));
        for (const ring of proposed) {
          const current = currentById.get(ring.id);
          await tx.storyMapAreaRing.create({ data: { id: ring.id, placementId: placement.id, componentIndex: ring.componentIndex, ringIndex: ring.ringIndex, role: ring.role, version: current ? current.version + 1 : 1, createdByUserId: current?.createdByUserId ?? input.actorUserId, updatedByUserId: current ? input.actorUserId : null, ...(current ? { createdAt: current.createdAt } : {}) } });
          if (ring.boundaries.length) await tx.storyMapAreaRingBoundary.createMany({ data: ring.boundaries.map((reference) => ({ ringId: ring.id, boundaryId: reference.boundaryId, sequence: reference.sequence, reversed: reference.reversed })) });
        }
        await recordRevision(tx, { entityType: "AREA_RING", entityId: placement.id, action: placement.areaRings.length ? "UPDATED" : "CREATED", actorUserId: input.actorUserId, summary: `${placement.areaRings.length ? "Rebuilt" : "Created"} shared topology for ${placement.entryId} on ${placement.map.slug}`, before, after: proposed });
        return getAssembledTopologyForPlacement(tx, placement.id);
      });
    },

    listWorldConnections(filter: { entryId?: string; type?: AtlasWorldConnection["type"] } = {}) {
      return client.storyWorldConnection.findMany({ where: { ...(filter.type ? { type: filter.type } : {}), ...(filter.entryId ? { OR: [{ fromEntryId: filter.entryId }, { toEntryId: filter.entryId }] } : {}) }, include: { fromEntry: true, toEntry: true, paths: true }, orderBy: [{ type: "asc" }, { id: "asc" }] });
    },

    getWorldConnection(id: string) {
      return client.storyWorldConnection.findUnique({ where: { id }, include: { fromEntry: true, toEntry: true, paths: { include: { map: true }, orderBy: { mapId: "asc" } } } });
    },

    createWorldConnection(input: CreateWorldConnectionInput) {
      const id = input.id ?? randomUUID();
      const contract = connectionContract(input, id, 1);
      const validated = validateAtlasWorldConnection(contract);
      if (!validated.valid) fail("VALIDATION", findingMessage("Invalid world connection", validated.findings));
      return client.$transaction(async (tx) => {
        const endpoints = await requireRegionEndpoints(tx, input.fromEntryId, input.toEntryId);
        const connection = await tx.storyWorldConnection.create({ data: { id, fromEntryId: input.fromEntryId, toEntryId: input.toEntryId, type: input.type, directionality: input.directionality, status: input.status, visibility: input.visibility, originalWording: input.originalWording, editorialNotes: input.editorialNotes, metadata: inputJson(input.metadata), createdByUserId: input.actorUserId } });
        await recordRevision(tx, { entityType: "WORLD_CONN", entityId: connection.id, action: "CREATED", actorUserId: input.actorUserId, summary: `Connected ${endpoints.from.slug} to ${endpoints.to.slug}`, after: contract });
        return connection;
      });
    },

    updateWorldConnection(input: UpdateWorldConnectionInput) {
      const contract = connectionContract(input, input.id, input.expectedVersion + 1);
      const validated = validateAtlasWorldConnection(contract);
      if (!validated.valid) fail("VALIDATION", findingMessage("Invalid world connection", validated.findings));
      return client.$transaction(async (tx) => {
        const current = await tx.storyWorldConnection.findUnique({ where: { id: input.id } });
        if (!current) fail("NOT_FOUND", "World connection no longer exists.");
        const endpoints = await requireRegionEndpoints(tx, input.fromEntryId, input.toEntryId);
        const updated = await tx.storyWorldConnection.updateMany({ where: { id: input.id, version: input.expectedVersion }, data: { fromEntryId: input.fromEntryId, toEntryId: input.toEntryId, type: input.type, directionality: input.directionality, status: input.status, visibility: input.visibility, originalWording: input.originalWording, editorialNotes: input.editorialNotes, metadata: inputJson(input.metadata), updatedByUserId: input.actorUserId, version: { increment: 1 } } });
        if (updated.count !== 1) fail("STALE_VERSION", "Somebody edited this world connection first.");
        await recordRevision(tx, { entityType: "WORLD_CONN", entityId: input.id, action: "UPDATED", actorUserId: input.actorUserId, summary: `Updated connection from ${endpoints.from.slug} to ${endpoints.to.slug}`, before: current, after: contract });
        return tx.storyWorldConnection.findUniqueOrThrow({ where: { id: input.id } });
      });
    },

    deleteWorldConnection(id: string, expectedVersion: number, actorUserId: string) {
      return client.$transaction(async (tx) => {
        const current = await tx.storyWorldConnection.findUnique({ where: { id }, include: { _count: { select: { paths: true } } } });
        if (!current) fail("NOT_FOUND", "World connection no longer exists.");
        if (current._count.paths > 0) fail("IN_USE", "Delete every scene path before deleting this world connection.");
        const deleted = await tx.storyWorldConnection.deleteMany({ where: { id, version: expectedVersion } });
        if (deleted.count !== 1) fail("STALE_VERSION", "Somebody edited this world connection first.");
        await recordRevision(tx, { entityType: "WORLD_CONN", entityId: id, action: "DELETED", actorUserId, summary: "Deleted unused Atlas world connection", before: current });
      });
    },

    createConnectionPath(input: CreateConnectionPathInput) {
      const id = input.id ?? randomUUID();
      return client.$transaction(async (tx) => {
        const connection = await tx.storyWorldConnection.findUnique({ where: { id: input.connectionId }, select: { id: true, type: true, fromEntry: { select: { slug: true } }, toEntry: { select: { slug: true } } } });
        const map = await requireMap(tx, input.mapId);
        if (!connection) fail("NOT_FOUND", "World connection no longer exists.");
        const contract: AtlasMapConnectionPath = { id, connectionId: input.connectionId, mapSlug: map.slug, geometry: input.geometry, minZoom: input.minZoom, maxZoom: input.maxZoom, priority: input.priority, version: 1 };
        const validated = validateAtlasMapConnectionPath(contract, dimensions(map));
        if (!validated.valid) fail("VALIDATION", findingMessage("Invalid connection path", validated.findings));
        const path = await tx.storyMapConnectionPath.create({ data: { id, connectionId: input.connectionId, mapId: input.mapId, geometryKind: input.geometry.type, geometry: inputJson(input.geometry), minZoom: input.minZoom, maxZoom: input.maxZoom, priority: input.priority, createdByUserId: input.actorUserId } });
        await recordRevision(tx, { entityType: "CONN_PATH", entityId: path.id, action: "CREATED", actorUserId: input.actorUserId, summary: `Added ${routeRevisionLabel(connection.type)}: ${connection.fromEntry.slug} → ${connection.toEntry.slug} on ${map.slug}`, after: contract });
        return path;
      });
    },

    updateConnectionPath(input: UpdateConnectionPathInput) {
      return client.$transaction(async (tx) => {
        const current = await tx.storyMapConnectionPath.findUnique({ where: { id: input.id }, include: { connection: { select: { type: true, fromEntry: { select: { slug: true } }, toEntry: { select: { slug: true } } } } } });
        if (!current) fail("NOT_FOUND", "Connection path no longer exists.");
        if (current.connectionId !== input.connectionId || current.mapId !== input.mapId) fail("VALIDATION", "Connection paths cannot move between connections or maps.");
        const map = await requireMap(tx, input.mapId);
        const contract: AtlasMapConnectionPath = { id: input.id, connectionId: input.connectionId, mapSlug: map.slug, geometry: input.geometry, minZoom: input.minZoom, maxZoom: input.maxZoom, priority: input.priority, version: input.expectedVersion + 1 };
        const validated = validateAtlasMapConnectionPath(contract, dimensions(map));
        if (!validated.valid) fail("VALIDATION", findingMessage("Invalid connection path", validated.findings));
        const updated = await tx.storyMapConnectionPath.updateMany({ where: { id: input.id, version: input.expectedVersion }, data: { geometryKind: input.geometry.type, geometry: inputJson(input.geometry), minZoom: input.minZoom, maxZoom: input.maxZoom, priority: input.priority, updatedByUserId: input.actorUserId, version: { increment: 1 } } });
        if (updated.count !== 1) fail("STALE_VERSION", "Somebody edited this connection path first.");
        await recordRevision(tx, { entityType: "CONN_PATH", entityId: input.id, action: "UPDATED", actorUserId: input.actorUserId, summary: `Updated ${routeRevisionLabel(current.connection.type)}: ${current.connection.fromEntry.slug} → ${current.connection.toEntry.slug} on ${map.slug}`, before: current, after: contract });
        return tx.storyMapConnectionPath.findUniqueOrThrow({ where: { id: input.id } });
      });
    },

    deleteConnectionPath(id: string, expectedVersion: number, actorUserId: string) {
      return client.$transaction(async (tx) => {
        const current = await tx.storyMapConnectionPath.findUnique({ where: { id }, include: { map: { select: { slug: true } }, connection: { select: { type: true, fromEntry: { select: { slug: true } }, toEntry: { select: { slug: true } } } } } });
        if (!current) fail("NOT_FOUND", "Connection path no longer exists.");
        const deleted = await tx.storyMapConnectionPath.deleteMany({ where: { id, version: expectedVersion } });
        if (deleted.count !== 1) fail("STALE_VERSION", "Somebody edited this connection path first.");
        await recordRevision(tx, { entityType: "CONN_PATH", entityId: id, action: "DELETED", actorUserId, summary: `Removed ${routeRevisionLabel(current.connection.type)}: ${current.connection.fromEntry.slug} → ${current.connection.toEntry.slug} from ${current.map.slug}`, before: current });
      });
    },
  };
}
