import {
  bloomfallReachLocalAtlas,
  validateAtlasTopology,
  type AtlasDerivedTopologyArea,
  type AtlasNumericPoint,
  type AtlasTopologyDataset,
  type AtlasV2ConnectionProjection,
  type AtlasV2ConnectionPathProjection,
  type AtlasV2Projection,
  type AtlasV2RegionProjection,
  type StoryAtlasProjection,
  type StoryMapPoint,
} from "@habitat/shared";
import { analyzeAtlasCanonicalTopology, buildAtlasCanonicalTopologyTrace } from "../scripts/lib/atlas-canonical-topology";

function geometryPoints(area: AtlasDerivedTopologyArea) { return area.geometry.type === "POLYGON" ? area.geometry.coordinates.flat() : area.geometry.coordinates.flat(2); }
function boundsFor(area: AtlasDerivedTopologyArea): AtlasV2RegionProjection["bounds"] { const points = geometryPoints(area); return [Math.min(...points.map((point) => point[0])), Math.min(...points.map((point) => point[1])), Math.max(...points.map((point) => point[0])), Math.max(...points.map((point) => point[1]))]; }
function centroid(ring: readonly AtlasNumericPoint[]): StoryMapPoint { let twiceArea = 0; let x = 0; let y = 0; for (let index = 1; index < ring.length; index += 1) { const from = ring[index - 1]!; const to = ring[index]!; const cross = from[0] * to[1] - to[0] * from[1]; twiceArea += cross; x += (from[0] + to[0]) * cross; y += (from[1] + to[1]) * cross; } return twiceArea === 0 ? ring[0]! : [Math.round(x / (3 * twiceArea)), Math.round(y / (3 * twiceArea))]; }
function defaultLabel(area: AtlasDerivedTopologyArea): StoryMapPoint { return centroid(area.geometry.type === "POLYGON" ? area.geometry.coordinates[0]! : area.geometry.coordinates[0]![0]!); }
function canonicalSceneTitle(legacyTitle: string, ownerTitle?: string) { if (!ownerTitle) return legacyTitle; const suffix = legacyTitle.match(/\s+(?:city|tactical)\s+atlas$/i)?.[0] ?? ""; return `${ownerTitle}${suffix}`; }

export function buildStoryAtlasV2Projection(input: { v1: StoryAtlasProjection; topology: AtlasTopologyDataset; connections: readonly AtlasV2ConnectionProjection[]; connectionPaths?: readonly AtlasV2ConnectionPathProjection[]; revisionCursor: string | null; sceneOwnerTitle?: string }): AtlasV2Projection {
  const validation = validateAtlasTopology(input.topology, { width: input.v1.scene.coordinateWidth as 100_000, height: input.v1.scene.coordinateHeight });
  if (!validation.valid || !validation.value) throw new Error(`Persisted Atlas V2 topology is invalid: ${validation.findings.map((finding) => finding.code).join(", ")}`);
  const isWorldScene = input.v1.scene.slug === "martino-world";
  const canonical = isWorldScene ? analyzeAtlasCanonicalTopology(buildAtlasCanonicalTopologyTrace()) : null;
  const canonicalBySlug = new Map(canonical?.regionResults.map((region) => [region.entrySlug, region]) ?? []);
  const localBySlug = new Map<string, (typeof bloomfallReachLocalAtlas.subregions)[number]>(bloomfallReachLocalAtlas.subregions.map((region) => [region.slug, region]));
  const v1ByPlacement = new Map(input.v1.features.filter((feature) => feature.source === "ENTRY").map((feature) => [feature.placementId, feature]));
  const regions = validation.value.map((area): AtlasV2RegionProjection => {
    const feature = v1ByPlacement.get(area.areaId);
    if (!feature?.entryId) throw new Error(`Persisted topology area ${area.areaId} has no canonical V1 placement/entry.`);
    const worldMetadata = canonicalBySlug.get(feature.slug);
    const localMetadata = input.v1.scene.slug === bloomfallReachLocalAtlas.sceneSlug ? localBySlug.get(feature.slug) : undefined;
    if (!worldMetadata && !localMetadata) throw new Error(`Persisted topology area ${feature.slug} is absent from the locked scene manifest.`);
    const areaBounds = boundsFor(area); const explicitLabel = feature.label;
    const labelAnchor = explicitLabel && explicitLabel[0] >= areaBounds[0] && explicitLabel[0] <= areaBounds[2] && explicitLabel[1] >= areaBounds[1] && explicitLabel[1] <= areaBounds[3] ? explicitLabel : defaultLabel(area);
    const role = worldMetadata?.role ?? "NESTED_GEOGRAPHY";
    return { id: worldMetadata?.areaId ?? area.areaId, placementId: feature.placementId, entryId: feature.entryId, slug: feature.slug, title: feature.title, summary: feature.summary, status: feature.status, role, detailLevel: localMetadata ? "L2_LOCAL" : role === "NESTED_GEOGRAPHY" ? "L1_REGION" : "L0_WORLD", parentSlug: worldMetadata?.parentEntrySlug ?? localMetadata?.parentSlug ?? null, childSlugs: worldMetadata ? (canonical?.regionResults ?? []).filter((candidate) => candidate.parentEntrySlug === feature.slug).map((candidate) => candidate.entrySlug) : [], neighbors: worldMetadata?.neighbors ?? [...(localMetadata?.neighbors ?? [])], geometry: area.geometry, bounds: areaBounds, labelAnchor, minZoom: localMetadata ? 0 : role === "NESTED_GEOGRAPHY" ? 1.8 : role === "MAJOR_WATER" ? 0.4 : 0, maxZoom: null, childMap: feature.childMap };
  }).sort((left, right) => left.slug.localeCompare(right.slug));
  const regionSlugs = new Set(regions.map((region) => region.slug));
  const points = input.v1.features.filter((feature) => feature.source === "ENTRY" && !regionSlugs.has(feature.slug));
  const questNodes = input.v1.features.filter((feature) => feature.source === "NODE");
  return { contract: "martino-story-atlas-v2", contractVersion: 1, projectionVersion: "V2", revisionCursor: input.revisionCursor, scene: { ...input.v1.scene, title: canonicalSceneTitle(input.v1.scene.title, input.sceneOwnerTitle) }, regions, points, questNodes, connections: input.connections, connectionPaths: input.connectionPaths ?? [], hierarchy: regions.map((region) => ({ slug: region.slug, parentSlug: region.parentSlug, childSlugs: region.childSlugs })), counts: { regions: regions.length, topLevelRegions: regions.filter((region) => region.role === "TOP_LEVEL_LAND").length, nestedRegions: regions.filter((region) => region.role === "NESTED_GEOGRAPHY").length, points: points.length, questNodes: questNodes.length, connections: input.connections.length, connectionPaths: input.connectionPaths?.length ?? 0 } };
}
