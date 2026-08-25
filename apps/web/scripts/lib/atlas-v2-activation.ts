import { createHash } from "node:crypto";
import { createPrismaClient, type Prisma } from "@habitat/db/client";
import { validateAtlasTopology, type AtlasTopologyDataset } from "@habitat/shared";
import { analyzeAtlasCanonicalTopology, buildAtlasCanonicalDerivedGeometry, type AtlasCanonicalTopologyTrace } from "./atlas-canonical-topology";
import { atlasSha256, stableAtlasJson } from "./atlas-integrity";
import { verifyAtlasConnectionParity, type AtlasConnectionCandidate, type AtlasV1ConnectionManifest } from "./atlas-migration-rehearsal";

type Database = ReturnType<typeof createPrismaClient>;
type Transaction = Prisma.TransactionClient;

export const atlasV2ActivationMigration = "20260824230000_add_atlas_topology_connections" as const;
export const atlasV2ArtifactHashes = {
  topologyManifest: "6af3fa434526ef853d4ebd3f00599ffa56cb3ad961339afcde94fdd0fe38a647",
  derivedGeometry: "bad2aaf43dd08587729ef429f5ba66f37606c8f0a0d54dd04244c61104b8270b",
  connectionCandidates: "333f72dbb1b03155abf7b0c6fbf3688feea1e3fb50e123e476938604e20396e7",
} as const;

export function verifyAtlasV2ArtifactHash(label: keyof typeof atlasV2ArtifactHashes, bytes: string | Buffer) {
  const actual = atlasSha256(bytes);
  const expected = atlasV2ArtifactHashes[label];
  if (actual !== expected) throw new Error(`${label} hash mismatch: expected ${expected}, received ${actual}. Activation refused.`);
  return actual;
}

function databaseIdentity(value: string) {
  const url = new URL(value);
  return { hostname: url.hostname.toLowerCase(), port: url.port || "5432", database: url.pathname.slice(1) };
}

export const atlasPersistentDevelopmentDatabase = "habitat_atlas_dev" as const;

export function assertAtlasPersistentDevelopmentTarget(targetUrl: string, environment: Readonly<Record<string, string | undefined>> = process.env) {
  const target = databaseIdentity(targetUrl);
  if (!['localhost', '127.0.0.1', '::1'].includes(target.hostname)) throw new Error("Persistent Atlas development requires a loopback PostgreSQL target.");
  if (target.database !== atlasPersistentDevelopmentDatabase) throw new Error(`Persistent Atlas development requires database ${atlasPersistentDevelopmentDatabase}.`);
  if (environment.HABITAT_ENVIRONMENT !== "development" && environment.ATLAS_V2_ACTIVATION_ENVIRONMENT !== "development") throw new Error("Persistent Atlas development requires HABITAT_ENVIRONMENT=development or an explicit development activation environment.");
  return target;
}

export function assertAtlasV2ActivationTarget(sourceUrl: string, targetUrl: string, environment: Readonly<Record<string, string | undefined>> = process.env) {
  const source = databaseIdentity(sourceUrl);
  const target = databaseIdentity(targetUrl);
  if (!['localhost', '127.0.0.1', '::1'].includes(target.hostname)) throw new Error("Atlas V2 activation is restricted to a loopback PostgreSQL target.");
  if (/^habitat_atlas_p7_activation_[a-z0-9_]+$/.test(target.database)) return { mode: "ISOLATED_REHEARSAL" as const, source, target };
  if (target.database === atlasPersistentDevelopmentDatabase) {
    assertAtlasPersistentDevelopmentTarget(targetUrl, environment);
    if (stableAtlasJson(source, false) === stableAtlasJson(target, false)) throw new Error("Persistent Atlas development activation requires an explicit production source URL distinct from the target.");
    if (environment.ATLAS_V2_ACTIVATION_ENVIRONMENT !== "development" || environment.ATLAS_V2_ACTIVATION_CONFIRM_DATABASE !== atlasPersistentDevelopmentDatabase) throw new Error(`Persistent Atlas development activation requires ATLAS_V2_ACTIVATION_ENVIRONMENT=development and ATLAS_V2_ACTIVATION_CONFIRM_DATABASE=${atlasPersistentDevelopmentDatabase}.`);
    return { mode: "PERSISTENT_DEVELOPMENT" as const, source, target };
  }
  if (stableAtlasJson(source, false) !== stableAtlasJson(target, false) || target.database !== "habitat") throw new Error("Active activation requires the explicit canonical habitat database URL; use a guarded p7 database for rehearsal.");
  const publicOrigin = environment.AUTH_URL ?? environment.HABITAT_PUBLIC_ORIGIN ?? "";
  const productionOrigin = publicOrigin ? !["localhost", "127.0.0.1", "::1"].includes(new URL(publicOrigin).hostname.toLowerCase()) : false;
  if (productionOrigin) throw new Error("The configured Atlas database belongs to the deployed production service. Prompt 7 active activation is development-only.");
  if (environment.ATLAS_V2_ACTIVATION_ENVIRONMENT !== "development" || environment.ATLAS_V2_ACTIVATION_CONFIRM_DATABASE !== "habitat") throw new Error("Active development activation requires ATLAS_V2_ACTIVATION_ENVIRONMENT=development and ATLAS_V2_ACTIVATION_CONFIRM_DATABASE=habitat.");
  return { mode: "ACTIVE_DEVELOPMENT" as const, source, target };
}

export async function assertAtlasV2SchemaPresent(database: Database) {
  const rows = await database.$queryRaw<Array<{ migration_name: string }>>`SELECT migration_name FROM "_prisma_migrations" WHERE migration_name = ${atlasV2ActivationMigration} AND finished_at IS NOT NULL AND rolled_back_at IS NULL`;
  if (rows.length !== 1) throw new Error(`Required migration ${atlasV2ActivationMigration} is not applied.`);
}

function record(value: unknown): Record<string, unknown> | null { return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null; }
function rows(value: unknown) { return Array.isArray(value) ? value.filter((item): item is Record<string, unknown> => Boolean(record(item))) : []; }

export async function captureAtlasV1LegacySnapshot(client: Transaction | Database) {
  const [entries, maps, placements, questPlacements] = await Promise.all([
    client.storyEntry.findMany({ where: { kind: "REGION" }, orderBy: { slug: "asc" }, select: { slug: true, meta: true, version: true } }),
    client.storyMap.findMany({ orderBy: { slug: "asc" }, select: { id: true, slug: true, artVersion: true, version: true } }),
    client.storyMapPlacement.findMany({ orderBy: [{ mapId: "asc" }, { entryId: "asc" }], select: { id: true, mapId: true, entryId: true, geometryKind: true, geometry: true, labelX: true, labelY: true, minZoom: true, maxZoom: true, priority: true, version: true } }),
    client.storyMapNodePlacement.findMany({ orderBy: [{ mapId: "asc" }, { nodeId: "asc" }], select: { id: true, mapId: true, nodeId: true, geometryKind: true, geometry: true, labelX: true, labelY: true, minZoom: true, maxZoom: true, priority: true, version: true } }),
  ]);
  const connections = entries.flatMap((entry) => rows(record(entry.meta)?.connections).map((original, index) => ({ locator: `${entry.slug}.meta.connections[${index}]`, original })));
  const value = { maps, placements, questPlacements, connections };
  return { value, fingerprint: atlasSha256(stableAtlasJson(value, false)) };
}

function stableRevisionId(kind: string, identity: string) {
  const hex = createHash("sha256").update(`martino-atlas-v2-activation:${kind}:${identity}`).digest("hex").slice(0, 32).split("");
  hex[12] = "5";
  hex[16] = ((Number.parseInt(hex[16]!, 16) & 0x3) | 0x8).toString(16);
  const value = hex.join("");
  return `${value.slice(0, 8)}-${value.slice(8, 12)}-${value.slice(12, 16)}-${value.slice(16, 20)}-${value.slice(20)}`;
}

async function atlasCounts(client: Transaction | Database) {
  const [topologyNodes, boundaries, areaRings, ringBoundaryReferences, worldConnections, connectionPaths] = await Promise.all([
    client.storyMapTopologyNode.count(), client.storyMapBoundary.count(), client.storyMapAreaRing.count(), client.storyMapAreaRingBoundary.count(), client.storyWorldConnection.count(), client.storyMapConnectionPath.count(),
  ]);
  return { topologyNodes, boundaries, areaRings, ringBoundaryReferences, worldConnections, connectionPaths };
}

async function verifyConnectionSource(client: Transaction | Database, manifest: AtlasV1ConnectionManifest) {
  const entries = await client.storyEntry.findMany({ where: { kind: "REGION" }, orderBy: { slug: "asc" }, select: { slug: true, meta: true } });
  const current = entries.flatMap((entry) => rows(record(entry.meta)?.connections).map((original, sourceArrayIndex) => ({ stableLocator: `${entry.slug}.meta.connections[${sourceArrayIndex}]`, original })));
  if (current.length !== manifest.records.length) throw new Error(`V1 connection source drift: expected ${manifest.records.length}, received ${current.length}.`);
  for (const expected of manifest.records) {
    const actual = current.find((row) => row.stableLocator === expected.stableLocator);
    if (!actual || stableAtlasJson(actual.original, false) !== stableAtlasJson(expected.original, false)) throw new Error(`V1 connection source drift at ${expected.stableLocator}.`);
  }
}

async function verifyPersistedState(client: Transaction | Database, manifest: AtlasV1ConnectionManifest, candidates: readonly AtlasConnectionCandidate[], trace: AtlasCanonicalTopologyTrace) {
  const expectedCounts = { topologyNodes: 19, boundaries: 26, areaRings: 11, ringBoundaryReferences: 43, worldConnections: candidates.length, connectionPaths: 0 };
  const counts = await atlasCounts(client);
  if (stableAtlasJson(counts, false) !== stableAtlasJson(expectedCounts, false)) throw new Error(`Atlas V2 counts conflict: ${stableAtlasJson({ counts, expectedCounts }, false)}`);
  await verifyConnectionSource(client, manifest);
  const connections = await client.storyWorldConnection.findMany({ orderBy: { id: "asc" }, include: { fromEntry: { select: { slug: true } }, toEntry: { select: { slug: true } } } });
  const reconstructed = connections.map((row) => {
    const planned = candidates.find((candidate) => candidate.id === row.id);
    if (!planned) throw new Error(`Unexpected V2 connection ${row.id}.`);
    return { ...planned, sourceSlug: row.fromEntry.slug, targetSlug: row.toEntry.slug, fromEntryId: row.fromEntry.slug, toEntryId: row.toEntry.slug, type: row.type, directionality: row.directionality, status: row.status, visibility: row.visibility, originalWording: row.originalWording, editorialNotes: row.editorialNotes, metadata: row.metadata as AtlasConnectionCandidate["metadata"], version: row.version };
  });
  const parity = verifyAtlasConnectionParity(manifest, reconstructed);
  if (!parity.valid) throw new Error(`Activated connection provenance failed: ${stableAtlasJson(parity, false)}`);
  const traceMap = trace.maps[0];
  const map = await client.storyMap.findUnique({ where: { slug: traceMap.mapSlug }, select: { id: true, coordinateWidth: true, coordinateHeight: true } });
  if (!map) throw new Error(`Missing Atlas map ${traceMap.mapSlug}.`);
  const [nodes, boundaries, placements] = await Promise.all([
    client.storyMapTopologyNode.findMany({ where: { mapId: map.id }, orderBy: { id: "asc" } }),
    client.storyMapBoundary.findMany({ where: { mapId: map.id }, orderBy: { id: "asc" } }),
    client.storyMapPlacement.findMany({ where: { mapId: map.id, areaRings: { some: {} } }, include: { entry: { select: { slug: true } }, areaRings: { orderBy: [{ componentIndex: "asc" }, { ringIndex: "asc" }], include: { boundaries: { orderBy: { sequence: "asc" } } } } } }),
  ]);
  const dataset = {
    nodes: nodes.map((node) => ({ id: node.id, mapSlug: traceMap.mapSlug, position: [node.x, node.y] as const, version: node.version })),
    boundaries: boundaries.map((boundary) => ({ id: boundary.id, mapSlug: traceMap.mapSlug, startNodeId: boundary.startNodeId, endNodeId: boundary.endNodeId, interiorVertices: boundary.interiorVertices as never, kind: boundary.kind, version: boundary.version })),
    areas: placements.map((placement) => ({ id: placement.id, mapSlug: traceMap.mapSlug, layerKind: "BASE_GEOGRAPHY" as const, version: 1, rings: placement.areaRings.map((ring) => ({ id: ring.id, componentIndex: ring.componentIndex, role: ring.role, boundaries: ring.boundaries.map((reference) => ({ boundaryId: reference.boundaryId, sequence: reference.sequence, reversed: reference.reversed })) })) })),
  } as unknown as AtlasTopologyDataset;
  const topology = validateAtlasTopology(dataset, { width: map.coordinateWidth as 100_000, height: map.coordinateHeight });
  if (!topology.valid || !topology.value) throw new Error(`Activated topology reconstruction failed: ${stableAtlasJson(topology.findings, false)}`);
  const actualGeometry = new Map(topology.value.map((area) => [placements.find((placement) => placement.id === area.areaId)!.entry.slug, area.geometry]));
  const expectedGeometry = buildAtlasCanonicalDerivedGeometry(trace).features;
  for (const feature of expectedGeometry) if (stableAtlasJson(actualGeometry.get(feature.properties.entrySlug), false) !== stableAtlasJson(feature.geometry, false)) throw new Error(`Activated geometry differs for ${feature.properties.entrySlug}.`);
  const analysis = analyzeAtlasCanonicalTopology(trace);
  if (!analysis.topologyLocked) throw new Error("Locked topology analysis no longer passes.");
  return { counts, parity, topology: { topologyLocked: true, partition: analysis.partition, deathCanyon: analysis.deathCanyon, orphanNodes: analysis.orphanNodes, unusedBoundaries: analysis.unusedBoundaries, crossings: analysis.unintendedCrossings, duplicateBorders: analysis.duplicateEditableBorders, sharedDirectionFailures: analysis.sharedDirectionFailures } };
}

async function writeActivation(tx: Transaction, candidates: readonly AtlasConnectionCandidate[], trace: AtlasCanonicalTopologyTrace, actorUserId: string, injectFailure: boolean) {
  const slugs = [...new Set(candidates.flatMap((candidate) => [candidate.sourceSlug, candidate.targetSlug]))];
  const entries = await tx.storyEntry.findMany({ where: { slug: { in: slugs } }, select: { id: true, slug: true } });
  const entryId = new Map(entries.map((entry) => [entry.slug, entry.id]));
  for (const candidate of candidates) {
    const fromEntryId = entryId.get(candidate.sourceSlug); const toEntryId = entryId.get(candidate.targetSlug);
    if (!fromEntryId || !toEntryId) throw new Error(`Missing V2 connection endpoint for ${candidate.provenanceKey}.`);
    await tx.storyWorldConnection.create({ data: { id: candidate.id, fromEntryId, toEntryId, type: candidate.type, directionality: candidate.directionality, status: candidate.status, visibility: candidate.visibility, originalWording: candidate.originalWording, editorialNotes: candidate.editorialNotes, metadata: candidate.metadata as Prisma.InputJsonValue, version: 1, createdByUserId: actorUserId } });
    await tx.storyRevision.create({ data: { id: stableRevisionId("WORLD_CONN", candidate.id), entityType: "WORLD_CONN", entityId: candidate.id, action: "CREATED", actorUserId, summary: `Activated Atlas V2 connection ${candidate.provenanceKey}`, after: { activation: "ATLAS_V2", stableLocator: candidate.provenanceKey, fingerprint: candidate.sourceFingerprint } } });
  }
  if (injectFailure) throw new Error("INTENTIONAL_ATLAS_V2_ACTIVATION_ROLLBACK");
  const traceMap = trace.maps[0];
  const map = await tx.storyMap.findUniqueOrThrow({ where: { slug: traceMap.mapSlug }, select: { id: true } });
  const placements = await tx.storyMapPlacement.findMany({ where: { mapId: map.id, entry: { slug: { in: Object.values(traceMap.areaEntrySlugs) } } }, select: { id: true, entry: { select: { slug: true } } } });
  const placementId = new Map(placements.map((placement) => [placement.entry.slug, placement.id]));
  for (const node of traceMap.dataset.nodes) {
    await tx.storyMapTopologyNode.create({ data: { id: node.id, mapId: map.id, x: node.position[0], y: node.position[1], version: node.version, createdByUserId: actorUserId } });
    await tx.storyRevision.create({ data: { id: stableRevisionId("TOPO_NODE", node.id), entityType: "TOPO_NODE", entityId: node.id, action: "CREATED", actorUserId, summary: `Activated Atlas V2 node ${traceMap.nodeLocators[node.id]}`, after: { activation: "ATLAS_V2", locator: traceMap.nodeLocators[node.id] } } });
  }
  for (const boundary of traceMap.dataset.boundaries) {
    await tx.storyMapBoundary.create({ data: { id: boundary.id, mapId: map.id, startNodeId: boundary.startNodeId, endNodeId: boundary.endNodeId, kind: boundary.kind, interiorVertices: boundary.interiorVertices as unknown as Prisma.InputJsonValue, version: boundary.version, createdByUserId: actorUserId } });
    await tx.storyRevision.create({ data: { id: stableRevisionId("BOUNDARY", boundary.id), entityType: "BOUNDARY", entityId: boundary.id, action: "CREATED", actorUserId, summary: `Activated Atlas V2 boundary ${traceMap.boundaryLocators[boundary.id]}`, after: { activation: "ATLAS_V2", locator: traceMap.boundaryLocators[boundary.id], metadata: traceMap.boundaryMetadata[boundary.id] } as Prisma.InputJsonValue } });
  }
  for (const area of traceMap.dataset.areas) {
    const slug = traceMap.areaEntrySlugs[area.id]; const targetPlacementId = placementId.get(slug);
    if (!targetPlacementId) throw new Error(`Missing canonical placement for ${slug}.`);
    for (const [ringIndex, ring] of area.rings.entries()) {
      await tx.storyMapAreaRing.create({ data: { id: ring.id, placementId: targetPlacementId, componentIndex: ring.componentIndex, ringIndex, role: ring.role, version: 1, createdByUserId: actorUserId } });
      await tx.storyMapAreaRingBoundary.createMany({ data: ring.boundaries.map((reference) => ({ ringId: ring.id, boundaryId: reference.boundaryId, sequence: reference.sequence, reversed: reference.reversed })) });
    }
    await tx.storyRevision.create({ data: { id: stableRevisionId("AREA_RING", area.id), entityType: "AREA_RING", entityId: targetPlacementId, action: "CREATED", actorUserId, summary: `Activated Atlas V2 topology for ${slug}`, after: { activation: "ATLAS_V2", traceContract: trace.contract, traceVersion: trace.traceVersion, entrySlug: slug, metadata: traceMap.areaMetadata[area.id] } as Prisma.InputJsonValue } });
  }
}

export async function verifyAtlasV2Activation(database: Database, manifest: AtlasV1ConnectionManifest, candidates: readonly AtlasConnectionCandidate[], trace: AtlasCanonicalTopologyTrace) {
  await assertAtlasV2SchemaPresent(database);
  const legacy = await captureAtlasV1LegacySnapshot(database);
  const verified = await verifyPersistedState(database, manifest, candidates, trace);
  const report = { contract: "martino-atlas-v2-active-verification", contractVersion: 1, legacyFingerprint: legacy.fingerprint, ...verified };
  return { ...report, logicalFingerprint: atlasSha256(stableAtlasJson(report, false)) };
}

export async function activateAtlasV2(database: Database, manifest: AtlasV1ConnectionManifest, candidates: readonly AtlasConnectionCandidate[], trace: AtlasCanonicalTopologyTrace, options: { injectFailureAfterConnections?: boolean } = {}) {
  await assertAtlasV2SchemaPresent(database);
  const before = await captureAtlasV1LegacySnapshot(database);
  const counts = await atlasCounts(database);
  if (Object.values(counts).some((count) => count !== 0)) {
    const verified = await verifyAtlasV2Activation(database, manifest, candidates, trace);
    return { status: "ALREADY_ACTIVATED" as const, ...verified };
  }
  const result = await database.$transaction(async (tx) => {
    const actor = await tx.user.findFirst({ where: { role: "ADMIN", isActive: true }, orderBy: { id: "asc" }, select: { id: true } });
    if (!actor) throw new Error("Atlas V2 activation requires an active administrator for audit authorship.");
    await verifyConnectionSource(tx, manifest);
    await writeActivation(tx, candidates, trace, actor.id, options.injectFailureAfterConnections === true);
    const after = await captureAtlasV1LegacySnapshot(tx);
    if (after.fingerprint !== before.fingerprint) throw new Error("V1 Atlas compatibility data changed inside activation transaction.");
    const verified = await verifyPersistedState(tx, manifest, candidates, trace);
    return { actorUserId: actor.id, verified };
  }, { isolationLevel: "Serializable", timeout: 30_000 });
  const report = await verifyAtlasV2Activation(database, manifest, candidates, trace);
  return { status: "ACTIVATED" as const, actorUserId: result.actorUserId, ...report };
}

export async function cleanupAtlasV2Activation(database: Database, confirm: string) {
  if (confirm !== "DELETE_CANONICAL_ATLAS_V2") throw new Error("Atlas V2 cleanup requires the exact destructive confirmation token.");
  await assertAtlasV2SchemaPresent(database);
  return database.$transaction(async (tx) => {
    if (await tx.storyMapConnectionPath.count()) throw new Error("Cleanup refuses activated connection paths.");
    const ids = await Promise.all([
      tx.storyMapTopologyNode.findMany({ select: { id: true } }), tx.storyMapBoundary.findMany({ select: { id: true } }), tx.storyMapAreaRing.findMany({ select: { id: true, placementId: true } }), tx.storyWorldConnection.findMany({ select: { id: true } }),
    ]);
    await tx.storyMapAreaRingBoundary.deleteMany();
    await tx.storyMapAreaRing.deleteMany();
    await tx.storyMapBoundary.deleteMany();
    await tx.storyMapTopologyNode.deleteMany();
    await tx.storyWorldConnection.deleteMany();
    const entityIds = [...ids[0], ...ids[1], ...ids[2].flatMap((row) => [{ id: row.id }, { id: row.placementId }]), ...ids[3]].map((row) => row.id);
    await tx.storyRevision.deleteMany({ where: { entityId: { in: entityIds }, after: { path: ["activation"], equals: "ATLAS_V2" } } });
    return atlasCounts(tx);
  }, { isolationLevel: "Serializable" });
}
