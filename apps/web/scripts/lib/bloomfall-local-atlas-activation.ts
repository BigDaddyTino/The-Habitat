import { createPrismaClient, type Prisma } from "@habitat/db/client";
import { validateAtlasMapConnectionPath, validateAtlasTopology, type AtlasTopologyDataset } from "@habitat/shared";
import { buildBloomfallLocalAtlasManifest, bloomfallAtlasId } from "./bloomfall-local-atlas";
import { assertAtlasV2SchemaPresent } from "./atlas-v2-activation";
import { stableAtlasJson } from "./atlas-integrity";
import { bloomfallPersistedRoutes } from "./bloomfall-routes";

type Database = ReturnType<typeof createPrismaClient>;
type Client = Database | Prisma.TransactionClient;
const manifest = buildBloomfallLocalAtlasManifest();

async function scopedCounts(client: Client) {
  const map = await client.storyMap.findUnique({ where: { slug: manifest.scene.slug }, select: { id: true } });
  if (!map) return null;
  const [placements, nodes, boundaries, rings, references, paths] = await Promise.all([
    client.storyMapPlacement.count({ where: { mapId: map.id } }), client.storyMapTopologyNode.count({ where: { mapId: map.id } }),
    client.storyMapBoundary.count({ where: { mapId: map.id } }), client.storyMapAreaRing.count({ where: { placement: { mapId: map.id } } }),
    client.storyMapAreaRingBoundary.count({ where: { ring: { placement: { mapId: map.id } } } }), client.storyMapConnectionPath.count({ where: { mapId: map.id } }),
  ]);
  return { placements, nodes, boundaries, rings, references, paths };
}

export async function verifyBloomfallLocalAtlas(database: Database, options: { expectedArtVersion?: string; allowSystemAwareRoutes?: boolean } = {}) {
  await assertAtlasV2SchemaPresent(database);
  const map = await database.storyMap.findUnique({
    where: { slug: manifest.scene.slug },
    include: {
      parent: { select: { slug: true } }, owner: { select: { slug: true } },
      placements: { include: { entry: { select: { slug: true } }, areaRings: { include: { boundaries: { orderBy: { sequence: "asc" } } }, orderBy: [{ componentIndex: "asc" }, { ringIndex: "asc" }] } }, orderBy: { id: "asc" } },
      topologyNodes: { orderBy: { id: "asc" } }, boundaries: { orderBy: { id: "asc" } },
      connectionPaths: { include: { connection: { include: { fromEntry: { select: { slug: true } }, toEntry: { select: { slug: true } } } } }, orderBy: { id: "asc" } },
    },
  });
  if (!map) throw new Error("Bloomfall local scene is missing.");
  const expectedArtVersion = options.expectedArtVersion ?? manifest.scene.artVersion;
  if (map.parent?.slug !== manifest.scene.parentSlug || map.owner?.slug !== manifest.scene.ownerEntrySlug || map.artVersion !== expectedArtVersion) throw new Error("Bloomfall local scene identity or activation metadata differs from the manifest.");
  const counts = await scopedCounts(database);
  const expectedCounts = { placements: 18, nodes: 8, boundaries: 10, rings: 3, references: 12, paths: options.allowSystemAwareRoutes ? bloomfallPersistedRoutes.length : 2 };
  if (stableAtlasJson(counts, false) !== stableAtlasJson(expectedCounts, false)) throw new Error(`Bloomfall Atlas counts differ: ${stableAtlasJson({ counts, expectedCounts }, false)}`);
  const entrySlugByPlacement = new Map(map.placements.map((placement) => [placement.id, placement.entry.slug]));
  const topology: AtlasTopologyDataset = {
    nodes: map.topologyNodes.map((row) => ({ id: row.id, mapSlug: map.slug, position: [row.x, row.y] as never, version: row.version })),
    boundaries: map.boundaries.map((row) => ({ id: row.id, mapSlug: map.slug, startNodeId: row.startNodeId, endNodeId: row.endNodeId, interiorVertices: row.interiorVertices as never, kind: row.kind, version: row.version })),
    areas: map.placements.filter((row) => row.areaRings.length).map((row) => ({ id: row.id, mapSlug: map.slug, layerKind: "BASE_GEOGRAPHY", version: 1, rings: row.areaRings.map((ring) => ({ id: ring.id, componentIndex: ring.componentIndex, role: ring.role, boundaries: ring.boundaries.map((reference) => ({ boundaryId: reference.boundaryId, sequence: reference.sequence, reversed: reference.reversed })) })) })),
  };
  const validation = validateAtlasTopology(topology, { width: 100000, height: 66667 });
  if (!validation.valid || !validation.value) throw new Error(`Persisted Bloomfall topology is invalid: ${stableAtlasJson(validation.findings, false)}`);
  for (const expected of manifest.placements) {
    const actual = map.placements.find((row) => row.entry.slug === expected.entrySlug);
    if (!actual || actual.id !== expected.id || actual.geometryKind !== expected.geometry.type || stableAtlasJson(actual.geometry, false) !== stableAtlasJson(expected.geometry, false) || actual.labelX !== expected.label[0] || actual.labelY !== expected.label[1] || actual.minZoom !== expected.minZoom || actual.maxZoom !== expected.maxZoom || actual.priority !== expected.priority) throw new Error(`Persisted placement differs for ${expected.entrySlug}.`);
  }
  for (const path of map.connectionPaths) {
    if (options.allowSystemAwareRoutes) {
      const expected = bloomfallPersistedRoutes.find((route) => route.pathId === path.id && route.connectionId === path.connectionId);
      if (!expected || path.connection.fromEntry.slug !== expected.source || path.connection.toEntry.slug !== expected.destination || path.connection.type !== expected.type || stableAtlasJson(path.geometry, false) !== stableAtlasJson(expected.geometry, false) || path.minZoom !== expected.minZoom || path.maxZoom !== expected.maxZoom || path.priority !== expected.priority) throw new Error(`Persisted Bloomfall system-aware route ${path.id} differs from the manifest.`);
      const checked = validateAtlasMapConnectionPath({ id: path.id, connectionId: path.connectionId, mapSlug: map.slug, geometry: path.geometry as never, minZoom: path.minZoom, maxZoom: path.maxZoom, priority: path.priority, version: path.version }, { width: 100000, height: 66667 });
      if (!checked.valid) throw new Error(`Persisted Bloomfall system-aware route ${path.id} is invalid.`);
      continue;
    }
    const endpointSlugs = new Set([path.connection.fromEntry.slug, path.connection.toEntry.slug]);
    const expected = manifest.routes.find((route) => endpointSlugs.has("bloomfall-reach") && endpointSlugs.has(route.endpointSlug) && path.connection.type === route.type);
    if (!expected || stableAtlasJson(path.geometry, false) !== stableAtlasJson(expected.geometry, false) || path.minZoom !== expected.minZoom || path.priority !== expected.priority) throw new Error(`Persisted Bloomfall route ${path.id} differs from the manifest.`);
    const checked = validateAtlasMapConnectionPath({ id: path.id, connectionId: path.connectionId, mapSlug: map.slug, geometry: path.geometry as never, minZoom: path.minZoom, maxZoom: path.maxZoom, priority: path.priority, version: path.version }, { width: 100000, height: 66667 });
    if (!checked.valid) throw new Error(`Persisted Bloomfall route ${path.id} is invalid.`);
  }
  return { contract: "martino-bloomfall-local-atlas-verification", contractVersion: 1, verificationStatus: "PASS" as const, manifestSha256: manifest.logicalSha256, counts, regions: validation.value.map((area) => entrySlugByPlacement.get(area.areaId)).sort(), routePhase: options.allowSystemAwareRoutes ? "PROMPT_D_SYSTEM_AWARE" : "PROMPT_5_BASELINE", routeBacklog: manifest.routeBacklog, productionWrites: 0 };
}

async function writeActivation(tx: Prisma.TransactionClient, actorUserId: string) {
  const map = await tx.storyMap.findUniqueOrThrow({ where: { slug: manifest.scene.slug }, select: { id: true } });
  const slugs = manifest.placements.map((placement) => placement.entrySlug);
  const entries = await tx.storyEntry.findMany({ where: { slug: { in: slugs } }, select: { id: true, slug: true } });
  if (entries.length !== slugs.length) throw new Error(`Bloomfall activation requires all ${slugs.length} canonical entries.`);
  const entryId = new Map(entries.map((entry) => [entry.slug, entry.id]));
  await tx.storyMap.update({ where: { id: map.id }, data: { artVersion: manifest.scene.artVersion, imageWidth: manifest.scene.imageWidth, imageHeight: manifest.scene.imageHeight, coordinateWidth: manifest.scene.coordinateWidth, coordinateHeight: manifest.scene.coordinateHeight, initialCenterX: manifest.scene.initialCenter[0], initialCenterY: manifest.scene.initialCenter[1], initialZoom: manifest.scene.initialZoom, minZoom: manifest.scene.minZoom, maxZoom: manifest.scene.maxZoom, version: { increment: 1 }, updatedByUserId: actorUserId } });
  await tx.storyRevision.create({ data: { id: bloomfallAtlasId("revision", "map"), entityType: "MAP", entityId: map.id, action: "UPDATED", actorUserId, summary: "Activated owner-approved Bloomfall Reach local Atlas art and geometry", after: { activation: "BLOOMFALL_LOCAL_ATLAS_V1", manifestSha256: manifest.logicalSha256 } } });
  for (const placement of manifest.placements) {
    await tx.storyMapPlacement.create({ data: { id: placement.id, mapId: map.id, entryId: entryId.get(placement.entrySlug)!, geometryKind: placement.geometry.type, geometry: placement.geometry as unknown as Prisma.InputJsonValue, labelX: placement.label[0], labelY: placement.label[1], minZoom: placement.minZoom, maxZoom: placement.maxZoom, priority: placement.priority, version: 1, createdByUserId: actorUserId } });
    await tx.storyRevision.create({ data: { id: bloomfallAtlasId("revision-placement", placement.entrySlug), entityType: "PLACEMENT", entityId: placement.id, action: "CREATED", actorUserId, summary: `Placed ${placement.entrySlug} on the Bloomfall Reach Atlas`, after: { activation: "BLOOMFALL_LOCAL_ATLAS_V1", scene: map.id, entrySlug: placement.entrySlug } } });
  }
  for (const node of manifest.topology.nodes) {
    await tx.storyMapTopologyNode.create({ data: { id: node.id, mapId: map.id, x: node.position[0], y: node.position[1], version: 1, createdByUserId: actorUserId } });
    await tx.storyRevision.create({ data: { id: bloomfallAtlasId("revision-node", node.id), entityType: "TOPO_NODE", entityId: node.id, action: "CREATED", actorUserId, summary: "Added Bloomfall local topology node", after: { activation: "BLOOMFALL_LOCAL_ATLAS_V1" } } });
  }
  for (const boundary of manifest.topology.boundaries) {
    await tx.storyMapBoundary.create({ data: { id: boundary.id, mapId: map.id, startNodeId: boundary.startNodeId, endNodeId: boundary.endNodeId, kind: boundary.kind, interiorVertices: boundary.interiorVertices as unknown as Prisma.InputJsonValue, version: 1, createdByUserId: actorUserId } });
    await tx.storyRevision.create({ data: { id: bloomfallAtlasId("revision-boundary", boundary.id), entityType: "BOUNDARY", entityId: boundary.id, action: "CREATED", actorUserId, summary: "Added Bloomfall local shared boundary", after: { activation: "BLOOMFALL_LOCAL_ATLAS_V1" } } });
  }
  for (const area of manifest.topology.areas) for (const [ringIndex, ring] of area.rings.entries()) {
    await tx.storyMapAreaRing.create({ data: { id: ring.id, placementId: area.id, componentIndex: ring.componentIndex, ringIndex, role: ring.role, version: 1, createdByUserId: actorUserId } });
    await tx.storyMapAreaRingBoundary.createMany({ data: ring.boundaries.map((reference) => ({ ringId: ring.id, boundaryId: reference.boundaryId, sequence: reference.sequence, reversed: reference.reversed })) });
    await tx.storyRevision.create({ data: { id: bloomfallAtlasId("revision-ring", ring.id), entityType: "AREA_RING", entityId: ring.id, action: "CREATED", actorUserId, summary: "Added Bloomfall local topology ring", after: { activation: "BLOOMFALL_LOCAL_ATLAS_V1" } } });
  }
  for (const route of manifest.routes) {
    const connection = await tx.storyWorldConnection.findFirst({ where: { type: route.type, OR: [{ fromEntry: { slug: "bloomfall-reach" }, toEntry: { slug: route.endpointSlug } }, { fromEntry: { slug: route.endpointSlug }, toEntry: { slug: "bloomfall-reach" } }] }, select: { id: true } });
    if (!connection) throw new Error(`Missing approved semantic connection for ${route.key}.`);
    const id = bloomfallAtlasId("connection-path", route.key);
    await tx.storyMapConnectionPath.create({ data: { id, connectionId: connection.id, mapId: map.id, geometryKind: route.geometry.type, geometry: route.geometry as unknown as Prisma.InputJsonValue, minZoom: route.minZoom, maxZoom: null, priority: route.priority, version: 1, createdByUserId: actorUserId } });
    await tx.storyRevision.create({ data: { id: bloomfallAtlasId("revision-route", route.key), entityType: "CONN_PATH", entityId: id, action: "CREATED", actorUserId, summary: `Added approved Bloomfall ${route.type.toLowerCase()} geometry`, after: { activation: "BLOOMFALL_LOCAL_ATLAS_V1", route: route.key } } });
  }
}

export async function activateBloomfallLocalAtlas(database: Database) {
  await assertAtlasV2SchemaPresent(database);
  const map = await database.storyMap.findUnique({ where: { slug: manifest.scene.slug }, include: { parent: { select: { slug: true } }, owner: { select: { slug: true } } } });
  if (!map || map.id !== "1d8fe347-8ce8-5bc1-ae5c-6ee5dedab54f" || map.parent?.slug !== manifest.scene.parentSlug || map.owner?.slug !== manifest.scene.ownerEntrySlug) throw new Error("Bloomfall local scene identity/ownership guard failed.");
  const counts = await scopedCounts(database);
  if (map.artVersion === "v3") return { status: "ALREADY_APPLIED" as const, ...(await verifyBloomfallLocalAtlas(database, { expectedArtVersion: "v3", allowSystemAwareRoutes: counts?.paths === bloomfallPersistedRoutes.length })) };
  if (map.artVersion === manifest.scene.artVersion) return { status: "ALREADY_APPLIED" as const, ...(await verifyBloomfallLocalAtlas(database, { allowSystemAwareRoutes: counts?.paths === bloomfallPersistedRoutes.length })) };
  if (map.artVersion !== "foundation" || !counts || Object.values(counts).some((count) => count !== 0)) throw new Error("Bloomfall local scene is neither the clean foundation nor the exact activated state; activation refused.");
  const actor = await database.user.findFirst({ where: { role: "ADMIN", isActive: true }, orderBy: { id: "asc" }, select: { id: true } });
  if (!actor) throw new Error("Bloomfall local Atlas activation requires an active administrator for audit authorship.");
  await database.$transaction((tx) => writeActivation(tx, actor.id), { isolationLevel: "Serializable", timeout: 30_000 });
  return { status: "APPLIED" as const, actorUserId: actor.id, ...(await verifyBloomfallLocalAtlas(database)) };
}
