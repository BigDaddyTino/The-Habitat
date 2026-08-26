import { createHash } from "node:crypto";
import path from "node:path";
import dotenv from "dotenv";
import { createPrismaClient } from "@habitat/db/client";
import { atlasRingSignedArea, validateAtlasTopology, type AtlasMultiPolygonGeometry, type AtlasNumericPoint, type AtlasPolygonGeometry, type AtlasTopologyDataset } from "@habitat/shared";
import { assertAtlasPersistentDevelopmentTarget, assertAtlasV2SchemaPresent } from "./lib/atlas-v2-activation";
import { stableAtlasJson } from "./lib/atlas-integrity";
import { resolveAtlasDevelopmentDatabaseUrl } from "../lib/atlas-development-database";

const formerSlug = "unknown-southeast";
const canonicalSlug = "bloomfall-reach";
const formerTitle = "Unknown Southeast";
const canonicalTitle = "Bloomfall Reach";
const root = path.resolve(process.cwd(), "..", "..");
const production = process.argv.includes("--production");

dotenv.config({ path: path.join(root, ".env"), quiet: true });
if (!production) dotenv.config({ path: path.join(root, ".env.local"), override: true, quiet: true });

function resolveTarget() {
  if (!production) {
    const url = resolveAtlasDevelopmentDatabaseUrl(process.env);
    if (!url) throw new Error("Bloomfall discovery requires the guarded Atlas development environment.");
    return { mode: "DEVELOPMENT" as const, url, identity: assertAtlasPersistentDevelopmentTarget(url) };
  }
  const url = process.env.ATLAS_V2_VERIFICATION_DATABASE_URL ?? process.env.DATABASE_URL;
  if (!url) throw new Error("Production audit requires a database URL.");
  const parsed = new URL(url);
  const identity = { hostname: parsed.hostname.toLowerCase(), port: parsed.port || "5432", database: parsed.pathname.slice(1) };
  if (!["localhost", "127.0.0.1", "::1"].includes(identity.hostname) || identity.database !== "habitat") throw new Error("Production audit requires the loopback canonical habitat database.");
  if (process.env.ATLAS_V2_VERIFICATION_ENVIRONMENT !== "production" || process.env.ATLAS_V2_VERIFICATION_CONFIRM_DATABASE !== "habitat") throw new Error("Production audit requires explicit environment and database confirmation.");
  return { mode: "PRODUCTION" as const, url, identity };
}

const target = resolveTarget();
const db = createPrismaClient(target.url);
const oldPattern = /unknown[- ]southeast/i;
const continuityFocusSlugs = new Set([
  "essence", "magic", "the-corruption-system", "the-seven-phases-of-corruption", "environment", "gathering-and-harvest", "professions", "persistent-damage", "lasting-wounds", "weather", "veil-expeditions", "veil-incursions",
  "abomination-containment-authority", "aegis-extraction-consortium", "helix-arcanobiotics", "meridian-arcane-institute", "national-defense-directorate", "peninsula-expeditionary-army", "wardens-monster-hunter-guild", "verdant-marsh-clans", "stormglass-cartel",
  "abraham-islay-kane", "amanda", "steve", "the-kestrel-commander", "the-war-correspondent", "tino",
  "abominations", "monstrosities", "arcadian-devil", "the-risen", "stormglass", "dimensional-echo", "field-infusion-rig",
  "riverlands", "magic-torn-wasteland", "the-ocean", "the-peninsula", "the-starting-island",
]);

function record(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null;
}

function textMatches(value: unknown) {
  return typeof value === "string" && oldPattern.test(value);
}

function matchingPaths(value: unknown, prefix = ""): string[] {
  if (textMatches(value)) return [prefix || "$value"];
  if (Array.isArray(value)) return value.flatMap((item, index) => matchingPaths(item, `${prefix}[${index}]`));
  const object = record(value);
  return object ? Object.entries(object).flatMap(([key, item]) => matchingPaths(item, prefix ? `${prefix}.${key}` : key)) : [];
}

function geometryArea(geometry: AtlasPolygonGeometry | AtlasMultiPolygonGeometry) {
  const polygonArea = (coordinates: readonly (readonly AtlasNumericPoint[])[]) => Math.abs(atlasRingSignedArea(coordinates[0]!)) - coordinates.slice(1).reduce((sum, ring) => sum + Math.abs(atlasRingSignedArea(ring)), 0);
  return geometry.type === "POLYGON" ? polygonArea(geometry.coordinates) : geometry.coordinates.reduce((sum, polygon) => sum + polygonArea(polygon), 0);
}

function geometryBounds(geometry: AtlasPolygonGeometry | AtlasMultiPolygonGeometry) {
  const points = (geometry.type === "POLYGON" ? geometry.coordinates.flat() : geometry.coordinates.flat(2)) as AtlasNumericPoint[];
  return [Math.min(...points.map(([x]) => x)), Math.min(...points.map(([, y]) => y)), Math.max(...points.map(([x]) => x)), Math.max(...points.map(([, y]) => y))] as const;
}

function keywordMatches(entries: Array<{ slug: string; title: string; summary: string | null; body: string | null; meta: unknown }>, keywords: RegExp) {
  return entries.filter((entry) => keywords.test(stableAtlasJson(entry, false))).map((entry) => ({ slug: entry.slug, title: entry.title }));
}

async function main() {
  await assertAtlasV2SchemaPresent(db);
  const databaseIdentity = await db.$queryRaw<Array<{ database: string; schema: string }>>`SELECT current_database() AS database, current_schema() AS schema`;
  if (databaseIdentity[0]?.database !== target.identity.database) throw new Error(`Connected database identity mismatch: expected ${target.identity.database}, received ${databaseIdentity[0]?.database ?? "unknown"}.`);

  const region = await db.storyEntry.findFirst({
    where: { slug: { in: [formerSlug, canonicalSlug] } },
    include: {
      mapPlacements: { include: { map: { select: { id: true, slug: true, title: true, artVersion: true, imageWidth: true, imageHeight: true, coordinateWidth: true, coordinateHeight: true } }, areaRings: { orderBy: [{ componentIndex: "asc" }, { ringIndex: "asc" }], include: { boundaries: { orderBy: { sequence: "asc" } } } } } },
      ownedMap: { select: { id: true, slug: true, title: true } },
      worldConnectionsFrom: { include: { toEntry: { select: { id: true, slug: true, title: true } }, paths: { include: { map: { select: { slug: true } } } } } },
      worldConnectionsTo: { include: { fromEntry: { select: { id: true, slug: true, title: true } }, paths: { include: { map: { select: { slug: true } } } } } },
      regionOf: { select: { id: true, slug: true, title: true, category: true, isMainline: true, status: true } },
      nodeLinks: { select: { id: true, node: { select: { key: true, title: true, arc: { select: { slug: true, title: true } } } } } },
      comments: { select: { id: true } },
    },
  });
  if (!region) throw new Error(`Neither ${formerSlug} nor ${canonicalSlug} exists in ${target.identity.database}.`);

  const [regions, allEntries, revisions, arcs, nodes, edges, comments, connections, maps, topologyCounts] = await Promise.all([
    db.storyEntry.findMany({ where: { kind: "REGION" }, select: { id: true, slug: true, title: true, summary: true, body: true, meta: true }, orderBy: { slug: "asc" } }),
    db.storyEntry.findMany({ select: { id: true, kind: true, slug: true, title: true, summary: true, body: true, meta: true }, orderBy: [{ kind: "asc" }, { slug: "asc" }] }),
    db.storyRevision.findMany({ select: { id: true, entityType: true, entityId: true, action: true, summary: true, before: true, after: true, createdAt: true }, orderBy: { createdAt: "asc" } }),
    db.storyArc.findMany({ select: { id: true, slug: true, title: true, summary: true, hook: true, category: true, isMainline: true, status: true, regionEntryId: true, companionEntryId: true, factionEntryId: true, _count: { select: { nodes: true, edges: true } } }, orderBy: { slug: "asc" } }),
    db.storyNode.findMany({ select: { id: true, key: true, title: true, summary: true, body: true, completion: true, effects: true, rewards: true, arcId: true } }),
    db.storyEdge.findMany({ select: { id: true, key: true, label: true, condition: true, effects: true, arcId: true } }),
    db.storyComment.findMany({ select: { id: true, body: true, entryId: true, nodeId: true } }),
    db.storyWorldConnection.findMany({ select: { id: true, fromEntryId: true, toEntryId: true, type: true, directionality: true, status: true, visibility: true, originalWording: true, editorialNotes: true, metadata: true, version: true } }),
    db.storyMap.findMany({ select: { id: true, slug: true, title: true, artVersion: true, imageWidth: true, imageHeight: true, coordinateWidth: true, coordinateHeight: true, ownerEntryId: true, parentMapId: true }, orderBy: { slug: "asc" } }),
    Promise.all([db.storyMapTopologyNode.count(), db.storyMapBoundary.count(), db.storyMapAreaRing.count(), db.storyMapAreaRingBoundary.count(), db.storyWorldConnection.count(), db.storyMapConnectionPath.count()]),
  ]);

  const occurrenceSources = [
    ...allEntries.map((row) => ({ model: "StoryEntry", id: row.id, classification: "CANONICAL_RUNTIME_REFERENCE", value: row })),
    ...revisions.map((row) => ({ model: "StoryRevision", id: row.id, classification: "HISTORICAL_DEVELOPMENT_EVIDENCE", value: row })),
    ...arcs.map((row) => ({ model: "StoryArc", id: row.id, classification: "CANONICAL_RUNTIME_REFERENCE", value: row })),
    ...nodes.map((row) => ({ model: "StoryNode", id: row.id, classification: "PLAYER_FACING_CONTENT", value: row })),
    ...edges.map((row) => ({ model: "StoryEdge", id: row.id, classification: "PLAYER_FACING_CONTENT", value: row })),
    ...comments.map((row) => ({ model: "StoryComment", id: row.id, classification: "HISTORICAL_DEVELOPMENT_EVIDENCE", value: row })),
    ...connections.map((row) => ({ model: "StoryWorldConnection", id: row.id, classification: "CANONICAL_RUNTIME_REFERENCE", value: row })),
    ...maps.map((row) => ({ model: "StoryMap", id: row.id, classification: "CANONICAL_RUNTIME_REFERENCE", value: row })),
  ];
  const databaseOccurrences = occurrenceSources.flatMap((source) => {
    const paths = matchingPaths(source.value);
    return paths.length ? [{ model: source.model, id: source.id, classification: source.classification, paths }] : [];
  });

  const placement = region.mapPlacements.find((candidate) => candidate.map.slug === "martino-world" && candidate.areaRings.length > 0);
  if (!placement) throw new Error("Bloomfall target lacks its locked martino-world topology placement.");
  const worldMap = placement.map;
  const [topologyNodes, boundaries, topologyPlacements] = await Promise.all([
    db.storyMapTopologyNode.findMany({ where: { mapId: worldMap.id }, orderBy: { id: "asc" } }),
    db.storyMapBoundary.findMany({ where: { mapId: worldMap.id }, orderBy: { id: "asc" } }),
    db.storyMapPlacement.findMany({ where: { mapId: worldMap.id, areaRings: { some: {} } }, include: { entry: { select: { slug: true, title: true } }, areaRings: { orderBy: [{ componentIndex: "asc" }, { ringIndex: "asc" }], include: { boundaries: { orderBy: { sequence: "asc" } } } } } }),
  ]);
  const dataset = {
    nodes: topologyNodes.map((node) => ({ id: node.id, mapSlug: worldMap.slug, position: [node.x, node.y] as const, version: node.version })),
    boundaries: boundaries.map((boundary) => ({ id: boundary.id, mapSlug: worldMap.slug, startNodeId: boundary.startNodeId, endNodeId: boundary.endNodeId, kind: boundary.kind, interiorVertices: boundary.interiorVertices, version: boundary.version })),
    areas: topologyPlacements.map((candidate) => ({ id: candidate.id, mapSlug: worldMap.slug, layerKind: "BASE_GEOGRAPHY" as const, version: candidate.version, rings: candidate.areaRings.map((ring) => ({ id: ring.id, componentIndex: ring.componentIndex, role: ring.role, boundaries: ring.boundaries.map((reference) => ({ boundaryId: reference.boundaryId, sequence: reference.sequence, reversed: reference.reversed })) })) })),
  } as unknown as AtlasTopologyDataset;
  const validation = validateAtlasTopology(dataset, { width: worldMap.coordinateWidth as 100_000, height: worldMap.coordinateHeight });
  if (!validation.valid || !validation.value) throw new Error(`Persisted topology is invalid: ${stableAtlasJson(validation.findings, false)}`);
  const derived = validation.value.find((candidate) => candidate.areaId === placement.id);
  if (!derived) throw new Error("Bloomfall topology did not reconstruct.");
  const targetBoundaryIds = new Set(placement.areaRings.flatMap((ring) => ring.boundaries.map((reference) => reference.boundaryId)));
  const neighbors = topologyPlacements.filter((candidate) => candidate.id !== placement.id && candidate.areaRings.some((ring) => ring.boundaries.some((reference) => targetBoundaryIds.has(reference.boundaryId)))).map((candidate) => ({ slug: candidate.entry.slug, title: candidate.entry.title })).sort((left, right) => left.slug.localeCompare(right.slug));

  const parentSlug = typeof record(region.meta)?.parent === "string" ? record(region.meta)!.parent as string : null;
  const children = regions.filter((candidate) => record(candidate.meta)?.parent === region.slug || record(candidate.meta)?.parent === formerSlug || record(candidate.meta)?.parent === canonicalSlug).map((candidate) => ({ id: candidate.id, slug: candidate.slug, title: candidate.title }));
  const ownRevisions = revisions.filter((revision) => revision.entityId === region.id).map((revision) => ({ id: revision.id, action: revision.action, summary: revision.summary, createdAt: revision.createdAt }));
  const relatedConnections = [
    ...region.worldConnectionsFrom.map((connection) => ({ id: connection.id, source: region.slug, destination: connection.toEntry.slug, destinationId: connection.toEntry.id, type: connection.type, directionality: connection.directionality, status: connection.status, visibility: connection.visibility, originalWording: connection.originalWording, editorialNotes: connection.editorialNotes, metadata: connection.metadata, version: connection.version, paths: connection.paths.map((route) => ({ id: route.id, map: route.map.slug, geometryKind: route.geometryKind, geometry: route.geometry, version: route.version })) })),
    ...region.worldConnectionsTo.map((connection) => ({ id: connection.id, source: connection.fromEntry.slug, sourceId: connection.fromEntry.id, destination: region.slug, type: connection.type, directionality: connection.directionality, status: connection.status, visibility: connection.visibility, originalWording: connection.originalWording, editorialNotes: connection.editorialNotes, metadata: connection.metadata, version: connection.version, paths: connection.paths.map((route) => ({ id: route.id, map: route.map.slug, geometryKind: route.geometryKind, geometry: route.geometry, version: route.version })) })),
  ];

  const entriesForKeywords = allEntries.map((entry) => ({ slug: entry.slug, title: entry.title, summary: entry.summary, body: entry.body, meta: entry.meta }));
  const kinds = (kind: typeof allEntries[number]["kind"]) => allEntries.filter((entry) => entry.kind === kind).map((entry) => ({ slug: entry.slug, title: entry.title, summary: entry.summary, body: entry.body, meta: entry.meta }));
  const report = {
    contract: "martino-bloomfall-reach-discovery-audit", contractVersion: 1, mode: target.mode, database: { ...target.identity, schema: databaseIdentity[0]?.schema },
    nomenclature: { formerTitle, formerSlug, canonicalTitle, canonicalSlug },
    target: {
      id: region.id, kind: region.kind, status: region.status, version: region.version, slug: region.slug, title: region.title, summary: region.summary, body: region.body, meta: region.meta,
      parent: parentSlug ? regions.find((candidate) => candidate.slug === parentSlug) ?? { slug: parentSlug, unresolved: true } : null,
      children, ownedMap: region.ownedMap, placements: region.mapPlacements.map((candidate) => ({ id: candidate.id, map: candidate.map, geometryKind: candidate.geometryKind, geometry: candidate.geometry, label: candidate.labelX === null || candidate.labelY === null ? null : [candidate.labelX, candidate.labelY], minZoom: candidate.minZoom, maxZoom: candidate.maxZoom, priority: candidate.priority, version: candidate.version, areaRings: candidate.areaRings.map((ring) => ({ id: ring.id, componentIndex: ring.componentIndex, ringIndex: ring.ringIndex, role: ring.role, version: ring.version, boundaries: ring.boundaries })) })),
      connections: relatedConnections, arcs: region.regionOf, nodeLinks: region.nodeLinks, comments: region.comments.length, revisions: ownRevisions,
    },
    topology: {
      counts: { topologyNodes: topologyCounts[0], boundaries: topologyCounts[1], areaRings: topologyCounts[2], ringBoundaryReferences: topologyCounts[3], worldConnections: topologyCounts[4], connectionPaths: topologyCounts[5] },
      valid: true, findings: validation.findings, placementId: placement.id, ringIds: placement.areaRings.map((ring) => ring.id), boundaryIds: [...targetBoundaryIds].sort(), geometry: derived.geometry, geometrySha256: createHash("sha256").update(stableAtlasJson(derived.geometry, false)).digest("hex"), area: geometryArea(derived.geometry), bounds: geometryBounds(derived.geometry), neighbors,
    },
    databaseOccurrences,
    databaseOccurrenceCounts: Object.fromEntries([...new Set(databaseOccurrences.map((occurrence) => occurrence.classification))].sort().map((classification) => [classification, databaseOccurrences.filter((occurrence) => occurrence.classification === classification).reduce((sum, occurrence) => sum + occurrence.paths.length, 0)])),
    continuity: {
      directlyReusable: {
        systems: keywordMatches(kinds("SYSTEM"), /essence|magic|corrupt|mutat|injur|damage|environment|resource|craft|alchem|power|reactor|weather|event/i),
        factions: keywordMatches(kinds("FACTION"), /military|science|research|industrial|magic|salvage|expedition|contain|environment|guard|cartel|trade/i),
        characters: keywordMatches(kinds("CHARACTER"), /essence|magic|corrupt|mutat|science|research|military|expedition|salvage|marsh|surviv/i),
        creatures: keywordMatches(kinds("CREATURE"), /corrupt|mutat|aberr|magic|construct|essence|marsh|toxic|body/i),
        resources: keywordMatches(kinds("ITEM"), /essence|crystal|craft|alchem|salvage|biolog|magic|stormglass|resource/i),
        events: keywordMatches(kinds("EVENT"), /essence|magic|corrupt|mutat|disaster|catastrophe|reactor|environment/i),
      },
      relevantRegions: keywordMatches(regions, /riverlands|magic-torn|ocean|coast|wetland|marsh|essence|magic|corrupt/i),
      storyStructures: { counts: { arcs: arcs.length, mainline: arcs.filter((arc) => arc.isMainline).length, companion: arcs.filter((arc) => arc.category === "COMPANION_QUEST").length, regionLinked: arcs.filter((arc) => arc.regionEntryId !== null).length, nodes: nodes.length, edges: edges.length }, arcs: arcs.map((arc) => ({ slug: arc.slug, title: arc.title, category: arc.category, isMainline: arc.isMainline, status: arc.status, regionEntryId: arc.regionEntryId, companionEntryId: arc.companionEntryId, factionEntryId: arc.factionEntryId, nodes: arc._count.nodes, edges: arc._count.edges })) },
      allRelevantEntries: keywordMatches(entriesForKeywords, /essence|magic|corrupt|mutat|reactor|marsh|salvage|expedition|contain|resource|craft|alchem|injur|damage|environment/i),
      focusDetails: allEntries.filter((entry) => continuityFocusSlugs.has(entry.slug)).map((entry) => ({ kind: entry.kind, slug: entry.slug, title: entry.title, summary: entry.summary, body: entry.body, meta: entry.meta })),
    },
  };
  process.stdout.write(stableAtlasJson(report));
}

void main().finally(() => db.$disconnect());
