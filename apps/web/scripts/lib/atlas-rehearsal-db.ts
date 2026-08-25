import { createPrismaClient, type Prisma } from "@habitat/db/client";
import { fingerprintAtlasSource, stableAtlasJson, atlasSha256, canonicalizeAtlasJson } from "./atlas-integrity";
import {
  analyzeAtlasTopologyTrace,
  assertAtlasRehearsalTarget,
  verifyAtlasConnectionParity,
  type AtlasConnectionCandidate,
  type AtlasTopologyTrace,
  type AtlasV1ConnectionManifest,
} from "./atlas-migration-rehearsal";

type Database = ReturnType<typeof createPrismaClient>;

export type AtlasRehearsalSourceSnapshot = Awaited<ReturnType<typeof loadAtlasRehearsalSourceSnapshot>>;

function record(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null;
}

function rows(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is Record<string, unknown> => Boolean(record(item))) : [];
}

function stableRevisionId(kind: string, identity: string) {
  const hex = atlasSha256(`martino-atlas-v2-rehearsal-revision:${kind}:${identity}`).slice(0, 32).split("");
  hex[12] = "5";
  hex[16] = ((Number.parseInt(hex[16]!, 16) & 0x3) | 0x8).toString(16);
  const value = hex.join("");
  return `${value.slice(0, 8)}-${value.slice(8, 12)}-${value.slice(12, 16)}-${value.slice(16, 20)}-${value.slice(20)}`;
}

/**
 * The source transaction is explicitly READ ONLY before any canonical rows are
 * selected. This adapter intentionally exposes no source mutation callback.
 */
export async function loadAtlasRehearsalSourceSnapshot(source: Database) {
  return source.$transaction(async (tx) => {
    await tx.$executeRawUnsafe("SET TRANSACTION READ ONLY");
    const entries = await tx.storyEntry.findMany({
      where: { kind: "REGION" },
      orderBy: { slug: "asc" },
      select: { id: true, kind: true, slug: true, title: true, summary: true, body: true, meta: true, status: true, version: true, createdByUserId: true, updatedByUserId: true, createdAt: true, updatedAt: true },
    });
    const maps = await tx.storyMap.findMany({
      orderBy: { slug: "asc" },
      select: { id: true, slug: true, title: true, parentMapId: true, ownerEntryId: true, artVersion: true, imageWidth: true, imageHeight: true, coordinateWidth: true, coordinateHeight: true, initialCenterX: true, initialCenterY: true, initialZoom: true, minZoom: true, maxZoom: true, version: true, createdByUserId: true, updatedByUserId: true, createdAt: true, updatedAt: true },
    });
    const mapIds = maps.map((map) => map.id);
    const placements = await tx.storyMapPlacement.findMany({
      where: { mapId: { in: mapIds } },
      orderBy: [{ mapId: "asc" }, { entryId: "asc" }],
      select: { id: true, mapId: true, entryId: true, geometryKind: true, geometry: true, labelX: true, labelY: true, minZoom: true, maxZoom: true, priority: true, version: true, createdByUserId: true, updatedByUserId: true, createdAt: true, updatedAt: true },
    });
    const userIds = [...new Set([...entries, ...maps, ...placements].flatMap((row) => [row.createdByUserId, row.updatedByUserId].filter((value): value is string => Boolean(value))))].sort();
    const users = await tx.user.findMany({ where: { id: { in: userIds } }, orderBy: { id: "asc" }, select: { id: true, name: true, username: true, displayName: true, role: true, isActive: true, createdAt: true, updatedAt: true } });
    if (users.length !== userIds.length) throw new Error("A canonical Atlas creator/editor user could not be extracted for rehearsal foreign keys.");
    return { entries, maps, placements, users };
  }, { isolationLevel: "RepeatableRead", timeout: 30_000 });
}

export function assertSourceSnapshotMatchesConnectionManifest(snapshot: AtlasRehearsalSourceSnapshot, manifest: AtlasV1ConnectionManifest) {
  const current = snapshot.entries.flatMap((entry) => rows(record(entry.meta)?.connections).map((original, sourceArrayIndex) => ({
    stableLocator: `${entry.slug}.meta.connections[${sourceArrayIndex}]`,
    fingerprint: fingerprintAtlasSource({ sourceSlug: entry.slug, sourceArrayIndex, original: canonicalizeAtlasJson(original) }),
    original: canonicalizeAtlasJson(original),
  }))).sort((left, right) => left.stableLocator.localeCompare(right.stableLocator));
  const expected = [...manifest.records].sort((left, right) => left.stableLocator.localeCompare(right.stableLocator));
  if (current.length !== expected.length) throw new Error(`Active V1 connection count drifted: manifest ${expected.length}, source ${current.length}.`);
  for (const [index, row] of current.entries()) {
    const wanted = expected[index]!;
    if (row.stableLocator !== wanted.stableLocator || row.fingerprint !== wanted.fingerprint || stableAtlasJson(row.original, false) !== stableAtlasJson(wanted.original, false)) throw new Error(`Active V1 connection drift at ${wanted.stableLocator}.`);
  }
  return { rows: current.length, fingerprints: current.map((row) => row.fingerprint) };
}

async function applyWithinTransaction(tx: Prisma.TransactionClient, snapshot: AtlasRehearsalSourceSnapshot, manifest: AtlasV1ConnectionManifest, candidates: readonly AtlasConnectionCandidate[], trace: AtlasTopologyTrace, injectFailureAfterConnections: boolean) {
  await tx.user.createMany({ data: snapshot.users.map((user) => ({ ...user, email: null })), skipDuplicates: true });
  await tx.storyEntry.createMany({ data: snapshot.entries.map((entry) => ({ ...entry, meta: entry.meta as Prisma.InputJsonValue, lockedByUserId: null, lockExpiresAt: null })), skipDuplicates: true });
  await tx.storyMap.createMany({ data: snapshot.maps.map((map) => ({ ...map, parentMapId: null })), skipDuplicates: true });
  for (const map of snapshot.maps.filter((candidate) => candidate.parentMapId)) await tx.storyMap.updateMany({ where: { id: map.id, parentMapId: null }, data: { parentMapId: map.parentMapId } });
  await tx.storyMapPlacement.createMany({ data: snapshot.placements.map((placement) => ({ ...placement, geometry: placement.geometry as Prisma.InputJsonValue })), skipDuplicates: true });

  const entries = await tx.storyEntry.findMany({ where: { slug: { in: [...new Set(candidates.flatMap((candidate) => [candidate.sourceSlug, candidate.targetSlug]))] } }, select: { id: true, slug: true } });
  const entryId = new Map(entries.map((entry) => [entry.slug, entry.id]));
  const actorUserId = snapshot.users[0]?.id;
  if (!actorUserId) throw new Error("Rehearsal has no source-derived audit actor.");
  for (const candidate of candidates) {
    const fromEntryId = entryId.get(candidate.sourceSlug);
    const toEntryId = entryId.get(candidate.targetSlug);
    if (!fromEntryId || !toEntryId) throw new Error(`Missing rehearsal endpoint for ${candidate.provenanceKey}.`);
    const existing = await tx.storyWorldConnection.findUnique({ where: { id: candidate.id } });
    const expected = { fromEntryId, toEntryId, type: candidate.type, directionality: candidate.directionality, status: candidate.status, visibility: candidate.visibility, originalWording: candidate.originalWording, editorialNotes: candidate.editorialNotes, metadata: candidate.metadata, version: 1 };
    if (existing) {
      const actual = { fromEntryId: existing.fromEntryId, toEntryId: existing.toEntryId, type: existing.type, directionality: existing.directionality, status: existing.status, visibility: existing.visibility, originalWording: existing.originalWording, editorialNotes: existing.editorialNotes, metadata: existing.metadata, version: existing.version };
      if (stableAtlasJson(actual, false) !== stableAtlasJson(expected, false)) throw new Error(`Rehearsal target contains conflicting connection ${candidate.provenanceKey}.`);
    } else await tx.storyWorldConnection.create({ data: { id: candidate.id, ...expected, metadata: candidate.metadata as Prisma.InputJsonValue, createdByUserId: actorUserId } });
    await tx.storyRevision.createMany({ data: [{ id: stableRevisionId("WORLD_CONN", candidate.id), entityType: "WORLD_CONN", entityId: candidate.id, action: "CREATED", actorUserId, summary: `Rehearsed V1 connection ${candidate.provenanceKey}`, after: { rehearsal: true, stableLocator: candidate.provenanceKey, fingerprint: candidate.sourceFingerprint, reviewStatus: candidate.reviewStatus } as Prisma.InputJsonValue }], skipDuplicates: true });
  }
  if (injectFailureAfterConnections) throw new Error("INTENTIONAL_REHEARSAL_ROLLBACK_PROBE");

  const traceMap = trace.maps[0];
  const map = await tx.storyMap.findUnique({ where: { slug: traceMap.mapSlug }, select: { id: true } });
  if (!map) throw new Error(`Missing rehearsal map ${traceMap.mapSlug}.`);
  const placementRows = await tx.storyMapPlacement.findMany({ where: { mapId: map.id, entry: { slug: { in: Object.values(traceMap.areaEntrySlugs) } } }, select: { id: true, entry: { select: { slug: true } } } });
  const placementId = new Map(placementRows.map((placement) => [placement.entry.slug, placement.id]));
  for (const node of traceMap.dataset.nodes) {
    const existing = await tx.storyMapTopologyNode.findUnique({ where: { id: node.id } });
    const expected = { mapId: map.id, x: node.position[0], y: node.position[1], version: 1 };
    if (existing) {
      const actual = { mapId: existing.mapId, x: existing.x, y: existing.y, version: existing.version };
      if (stableAtlasJson(actual, false) !== stableAtlasJson(expected, false)) throw new Error(`Rehearsal target contains conflicting topology node ${traceMap.nodeLocators[node.id]}.`);
    } else await tx.storyMapTopologyNode.create({ data: { id: node.id, ...expected, createdByUserId: actorUserId } });
  }
  for (const boundary of traceMap.dataset.boundaries) {
    const existing = await tx.storyMapBoundary.findUnique({ where: { id: boundary.id } });
    const expected = { mapId: map.id, startNodeId: boundary.startNodeId, endNodeId: boundary.endNodeId, kind: boundary.kind, interiorVertices: boundary.interiorVertices, version: 1 };
    if (existing) {
      const actual = { mapId: existing.mapId, startNodeId: existing.startNodeId, endNodeId: existing.endNodeId, kind: existing.kind, interiorVertices: existing.interiorVertices, version: existing.version };
      if (stableAtlasJson(actual, false) !== stableAtlasJson(expected, false)) throw new Error(`Rehearsal target contains conflicting boundary ${traceMap.boundaryLocators[boundary.id]}.`);
    } else await tx.storyMapBoundary.create({ data: { id: boundary.id, mapId: map.id, startNodeId: boundary.startNodeId, endNodeId: boundary.endNodeId, kind: boundary.kind, interiorVertices: boundary.interiorVertices as unknown as Prisma.InputJsonValue, version: 1, createdByUserId: actorUserId } });
  }
  for (const area of traceMap.dataset.areas) {
    const entrySlug = traceMap.areaEntrySlugs[area.id];
    const targetPlacementId = placementId.get(entrySlug);
    if (!targetPlacementId) throw new Error(`Missing rehearsal placement for traced area ${entrySlug}.`);
    for (const [ringIndex, ring] of area.rings.entries()) {
      const existing = await tx.storyMapAreaRing.findUnique({ where: { id: ring.id } });
      const expected = { placementId: targetPlacementId, componentIndex: ring.componentIndex, ringIndex, role: ring.role, version: 1 };
      if (existing) {
        const actual = { placementId: existing.placementId, componentIndex: existing.componentIndex, ringIndex: existing.ringIndex, role: existing.role, version: existing.version };
        if (stableAtlasJson(actual, false) !== stableAtlasJson(expected, false)) throw new Error(`Rehearsal target contains conflicting ring ${ring.id}.`);
      } else await tx.storyMapAreaRing.create({ data: { id: ring.id, ...expected, createdByUserId: actorUserId } });
      await tx.storyMapAreaRingBoundary.createMany({ data: ring.boundaries.map((reference) => ({ ringId: ring.id, boundaryId: reference.boundaryId, sequence: reference.sequence, reversed: reference.reversed })), skipDuplicates: true });
      const persistedReferences = await tx.storyMapAreaRingBoundary.findMany({ where: { ringId: ring.id }, orderBy: { sequence: "asc" }, select: { boundaryId: true, sequence: true, reversed: true } });
      if (stableAtlasJson(persistedReferences, false) !== stableAtlasJson(ring.boundaries, false)) throw new Error(`Rehearsal target contains conflicting ordered references for ring ${ring.id}.`);
    }
    const reviewStatus = traceMap.reviews.some((review) => review.entrySlugs.includes(entrySlug) && review.confidence === "OWNER_REVIEW_REQUIRED") ? "OWNER_REVIEW_REQUIRED" : "HIGH";
    await tx.storyRevision.createMany({ data: [{ id: stableRevisionId("AREA_RING", area.id), entityType: "AREA_RING", entityId: targetPlacementId, action: "CREATED", actorUserId, summary: `Rehearsed manual topology trace for ${entrySlug}`, after: { rehearsal: true, traceContract: trace.contract, traceVersion: trace.traceVersion, mapSlug: traceMap.mapSlug, entrySlug, reviewStatus } as Prisma.InputJsonValue }], skipDuplicates: true });
  }
  return { actorUserId, manifestRows: manifest.records.length };
}

export async function applyAtlasRehearsal(target: Database, snapshot: AtlasRehearsalSourceSnapshot, manifest: AtlasV1ConnectionManifest, candidates: readonly AtlasConnectionCandidate[], trace: AtlasTopologyTrace, options: { injectFailureAfterConnections?: boolean } = {}) {
  return target.$transaction((tx) => applyWithinTransaction(tx, snapshot, manifest, candidates, trace, options.injectFailureAfterConnections === true), { isolationLevel: "Serializable", timeout: 30_000 });
}

export async function newAtlasTableCounts(database: Database) {
  const [nodes, boundaries, rings, ringBoundaries, connections, paths] = await Promise.all([
    database.storyMapTopologyNode.count(),
    database.storyMapBoundary.count(),
    database.storyMapAreaRing.count(),
    database.storyMapAreaRingBoundary.count(),
    database.storyWorldConnection.count(),
    database.storyMapConnectionPath.count(),
  ]);
  return { topologyNodes: nodes, boundaries, areaRings: rings, ringBoundaryReferences: ringBoundaries, worldConnections: connections, connectionPaths: paths };
}

export async function verifyAtlasRehearsalDatabase(target: Database, manifest: AtlasV1ConnectionManifest, candidates: readonly AtlasConnectionCandidate[], trace: AtlasTopologyTrace) {
  const persisted = await target.storyWorldConnection.findMany({ orderBy: { id: "asc" }, include: { fromEntry: { select: { slug: true } }, toEntry: { select: { slug: true } } } });
  const candidateById = new Map(candidates.map((candidate) => [candidate.id, candidate]));
  const reconstructed = persisted.map((row): AtlasConnectionCandidate => {
    const planned = candidateById.get(row.id);
    if (!planned) throw new Error(`Unexpected rehearsed connection ${row.id}.`);
    return { ...planned, fromEntryId: row.fromEntry.slug, toEntryId: row.toEntry.slug, sourceSlug: row.fromEntry.slug, targetSlug: row.toEntry.slug, type: row.type, directionality: row.directionality, status: row.status, visibility: row.visibility, originalWording: row.originalWording, editorialNotes: row.editorialNotes, metadata: row.metadata as AtlasConnectionCandidate["metadata"], version: row.version };
  });
  const parity = verifyAtlasConnectionParity(manifest, reconstructed);
  if (!parity.valid) throw new Error(`Persisted connection parity failed: ${stableAtlasJson(parity, false)}`);
  for (const expected of candidates) {
    const actual = reconstructed.find((candidate) => candidate.id === expected.id);
    if (!actual || stableAtlasJson({ ...actual, fromEntryId: actual.sourceSlug, toEntryId: actual.targetSlug }, false) !== stableAtlasJson(expected, false)) throw new Error(`Persisted candidate differs from plan: ${expected.provenanceKey}.`);
  }
  const counts = await newAtlasTableCounts(target);
  const topology = analyzeAtlasTopologyTrace(trace);
  if (!topology.topologyLocked) throw new Error(`Refusing to verify an unlocked topology: ${stableAtlasJson(topology.hardGates, false)}`);
  const expectedCounts = { topologyNodes: topology.topologyNodes, boundaries: topology.boundaries, areaRings: topology.shells + topology.holes, ringBoundaryReferences: trace.maps[0].dataset.areas.flatMap((area) => area.rings).reduce((sum, ring) => sum + ring.boundaries.length, 0), worldConnections: candidates.length, connectionPaths: 0 };
  if (stableAtlasJson(counts, false) !== stableAtlasJson(expectedCounts, false)) throw new Error(`Rehearsal table counts differ: ${stableAtlasJson({ counts, expectedCounts }, false)}`);
  const traceMap = trace.maps[0];
  const [persistedNodes, persistedBoundaries, persistedRings] = await Promise.all([
    target.storyMapTopologyNode.findMany({ where: { map: { slug: traceMap.mapSlug } }, orderBy: { id: "asc" }, include: { map: { select: { slug: true } } } }),
    target.storyMapBoundary.findMany({ where: { map: { slug: traceMap.mapSlug } }, orderBy: { id: "asc" }, include: { map: { select: { slug: true } } } }),
    target.storyMapAreaRing.findMany({ where: { placement: { map: { slug: traceMap.mapSlug } } }, orderBy: [{ placement: { entry: { slug: "asc" } } }, { componentIndex: "asc" }, { ringIndex: "asc" }], include: { placement: { include: { map: { select: { slug: true } }, entry: { select: { slug: true } } } }, boundaries: { orderBy: { sequence: "asc" } } } }),
  ]);
  const actualAreas = Object.entries(traceMap.areaEntrySlugs).sort(([, left], [, right]) => left.localeCompare(right)).map(([areaId, entrySlug]) => ({
    id: areaId,
    mapSlug: traceMap.mapSlug,
    layerKind: "BASE_GEOGRAPHY" as const,
    version: 1,
    rings: persistedRings.filter((ring) => ring.placement.entry.slug === entrySlug).map((ring) => ({ id: ring.id, componentIndex: ring.componentIndex, role: ring.role, boundaries: ring.boundaries.map((reference) => ({ boundaryId: reference.boundaryId, sequence: reference.sequence, reversed: reference.reversed })) })),
  }));
  const actualDataset = {
    nodes: persistedNodes.map((node) => ({ id: node.id, mapSlug: node.map.slug, position: [node.x, node.y], version: node.version })),
    boundaries: persistedBoundaries.map((boundary) => ({ id: boundary.id, mapSlug: boundary.map.slug, startNodeId: boundary.startNodeId, endNodeId: boundary.endNodeId, interiorVertices: boundary.interiorVertices, kind: boundary.kind, version: boundary.version })),
    areas: actualAreas,
  };
  const sortedPlannedDataset = { nodes: [...traceMap.dataset.nodes].sort((left, right) => left.id.localeCompare(right.id)), boundaries: [...traceMap.dataset.boundaries].sort((left, right) => left.id.localeCompare(right.id)), areas: [...traceMap.dataset.areas].sort((left, right) => traceMap.areaEntrySlugs[left.id].localeCompare(traceMap.areaEntrySlugs[right.id])) };
  if (stableAtlasJson(actualDataset, false) !== stableAtlasJson(sortedPlannedDataset, false)) throw new Error("Persisted topology differs from the deterministic manual trace plan.");
  const legacyRows = await target.storyEntry.findMany({ where: { kind: "REGION" }, select: { slug: true, meta: true } }).then((entries) => entries.reduce((sum, entry) => sum + rows(record(entry.meta)?.connections).length, 0));
  const report = { contract: "martino-atlas-v2-rehearsal-verification", contractVersion: 1, connectionParity: parity, counts, legacyRowsPreserved: legacyRows, topology: { ...topology, derivedAreas: topology.derivedAreas.map((area) => ({ areaId: area.areaId, geometry: area.geometry })) }, connectionPathsDeferred: counts.connectionPaths === 0 };
  return { ...report, logicalFingerprint: atlasSha256(stableAtlasJson(report, false)) };
}

export function connectAtlasRehearsalDatabases(sourceUrl: string, targetUrl: string) {
  const identities = assertAtlasRehearsalTarget(sourceUrl, targetUrl);
  return { identities, source: createPrismaClient(sourceUrl), target: createPrismaClient(targetUrl) };
}
