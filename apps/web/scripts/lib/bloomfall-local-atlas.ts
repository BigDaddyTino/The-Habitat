import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import {
  bloomfallReachLocalAtlas,
  validateAtlasTopology,
  type AtlasTopologyDataset,
  type StoryMapGeometry,
} from "@habitat/shared";
import { atlasSha256, stableAtlasJson } from "./atlas-integrity";

export const bloomfallLocalAtlasArt = {
  approvedMasterSha256: "508852179b0375c0c2fe8712b99fd77f6062f04ea7834a5d4a67eb4f4bcb9cfe",
  runtimeSha256: "af4be2ed7269260cdfffde582e9a2470944ca8dbedb9ac0e0908e430807ad046",
  runtimeSource: "private/codex-art/bloomfall/candidates/local-atlas-runtime-candidate.png",
  protectedTarget: "private/codex-art/maps/candidates/martino-bloomfall-reach-map-v1.png",
} as const;
const bloomfallLocalAtlasMasterSource = "private/codex-art/bloomfall/candidates/local-atlas-master.png";

export async function verifyBloomfallLocalAtlasArtFiles(directory = process.cwd()) {
  const [master, runtime, target] = await Promise.all([
    readFile(path.resolve(directory, bloomfallLocalAtlasMasterSource)), readFile(path.resolve(directory, bloomfallLocalAtlasArt.runtimeSource)), readFile(path.resolve(directory, bloomfallLocalAtlasArt.protectedTarget)),
  ]);
  const hashes = { master: atlasSha256(master), runtime: atlasSha256(runtime), protectedTarget: atlasSha256(target) };
  if (hashes.master !== bloomfallLocalAtlasArt.approvedMasterSha256 || hashes.runtime !== bloomfallLocalAtlasArt.runtimeSha256 || hashes.protectedTarget !== bloomfallLocalAtlasArt.runtimeSha256) throw new Error(`Bloomfall local Atlas art hash mismatch: ${stableAtlasJson(hashes, false)}`);
  return hashes;
}

export function bloomfallAtlasId(kind: string, identity: string) {
  const hex = createHash("sha256").update(`martino-bloomfall-local-atlas:v1:${kind}:${identity}`).digest("hex").slice(0, 32).split("");
  hex[12] = "5";
  hex[16] = ((Number.parseInt(hex[16]!, 16) & 0x3) | 0x8).toString(16);
  const value = hex.join("");
  return `${value.slice(0, 8)}-${value.slice(8, 12)}-${value.slice(12, 16)}-${value.slice(16, 20)}-${value.slice(20)}`;
}

const mapSlug = bloomfallReachLocalAtlas.sceneSlug;
const node = (name: string, position: readonly [number, number]) => ({ id: bloomfallAtlasId("node", name), mapSlug, position, version: 1 });
const nodes = {
  nw: node("northwest", [0, 0]), ne: node("northeast", [100000, 0]),
  rightShatterMutation: node("right-shatter-mutation", [100000, 14000]),
  rightMutationMarsh: node("right-mutation-marsh", [100000, 30000]),
  se: node("southeast", [100000, 66667]), sw: node("southwest", [0, 66667]),
  leftMutationMarsh: node("left-mutation-marsh", [0, 48000]),
  leftShatterMutation: node("left-shatter-mutation", [0, 25000]),
} as const;

function boundary(name: string, startNodeId: string, endNodeId: string, kind: "INTERNAL_BORDER" | "OPEN_BOUNDARY", interiorVertices: readonly (readonly [number, number])[] = []) {
  return { id: bloomfallAtlasId("boundary", name), mapSlug, startNodeId, endNodeId, interiorVertices, kind, version: 1 } as const;
}

const boundaries = {
  north: boundary("north", nodes.nw.id, nodes.ne.id, "OPEN_BOUNDARY"),
  rightShatter: boundary("right-shatter", nodes.ne.id, nodes.rightShatterMutation.id, "OPEN_BOUNDARY"),
  shatterMutation: boundary("shatter-mutation", nodes.leftShatterMutation.id, nodes.rightShatterMutation.id, "INTERNAL_BORDER", [[14000,25000],[27000,25500],[39000,23500],[50000,25000],[62000,23000],[74000,20500],[86000,16500]]),
  rightMutation: boundary("right-mutation", nodes.rightShatterMutation.id, nodes.rightMutationMarsh.id, "OPEN_BOUNDARY"),
  mutationMarsh: boundary("mutation-marsh", nodes.leftMutationMarsh.id, nodes.rightMutationMarsh.id, "INTERNAL_BORDER", [[14000,46500],[26000,44000],[36000,39000],[46000,35000],[56000,33500],[66000,32000],[75000,38000],[86000,40000]]),
  rightMarsh: boundary("right-marsh", nodes.rightMutationMarsh.id, nodes.se.id, "OPEN_BOUNDARY"),
  south: boundary("south", nodes.se.id, nodes.sw.id, "OPEN_BOUNDARY"),
  leftMarsh: boundary("left-marsh", nodes.sw.id, nodes.leftMutationMarsh.id, "OPEN_BOUNDARY"),
  leftMutation: boundary("left-mutation", nodes.leftMutationMarsh.id, nodes.leftShatterMutation.id, "OPEN_BOUNDARY"),
  leftShatter: boundary("left-shatter", nodes.leftShatterMutation.id, nodes.nw.id, "OPEN_BOUNDARY"),
} as const;

const subregionPresentation = {
  "the-shattercore": { label: [47000, 12500] as const, priority: 255 },
  "the-mutation-belt": { label: [47000, 28500] as const, priority: 245 },
  "the-living-marsh": { label: [60000, 50000] as const, priority: 235 },
} as const;

function ring(slug: keyof typeof subregionPresentation, refs: readonly [keyof typeof boundaries, boolean][]) {
  const placementId = bloomfallAtlasId("placement", slug);
  return {
    placementId,
    area: { id: placementId, mapSlug, layerKind: "BASE_GEOGRAPHY" as const, version: 1, rings: [{ id: bloomfallAtlasId("ring", slug), componentIndex: 0, role: "SHELL" as const, boundaries: refs.map(([key, reversed], sequence) => ({ boundaryId: boundaries[key].id, sequence, reversed })) }] },
  };
}

const areas = {
  "the-shattercore": ring("the-shattercore", [["north", false], ["rightShatter", false], ["shatterMutation", true], ["leftShatter", false]]),
  "the-mutation-belt": ring("the-mutation-belt", [["shatterMutation", false], ["rightMutation", false], ["mutationMarsh", true], ["leftMutation", false]]),
  "the-living-marsh": ring("the-living-marsh", [["mutationMarsh", false], ["rightMarsh", false], ["south", false], ["leftMarsh", false]]),
} as const;

export const bloomfallLocalTopology = {
  nodes: Object.values(nodes), boundaries: Object.values(boundaries), areas: Object.values(areas).map((item) => item.area),
} as unknown as AtlasTopologyDataset;

const poiSeeds = [
  ["southreach-complex", [48828,8138], [50000,10500], 255, 0, "the-shattercore"],
  ["crown-break", [74870,3255], [76000,6000], 240, 0, "the-shattercore"],
  ["reserve-vault-twelve", [32552,3255], [30000,6000], 150, 1.7, "the-shattercore"],
  ["ashline-exchange", [22786,21159], [20000,23500], 210, 0.8, "the-shattercore"],
  ["redline-shelter-six", [55339,19500], [57000,21500], 140, 1.8, "the-shattercore"],
  ["glassroot-observatory", [65104,29297], [67000,27500], 180, 1.2, "the-mutation-belt"],
  ["walking-orchard", [35807,27669], [33000,30000], 130, 1.8, "the-mutation-belt"],
  ["splicefield-substation", [81380,32552], [82000,30500], 175, 1.2, "the-mutation-belt"],
  ["cairnwood-camp", [17904,34180], [20000,32500], 220, 0, "the-mutation-belt"],
  ["long-graze", [48828,30925], [47000,33000], 145, 1.6, "the-mutation-belt"],
  ["blackweir", [35807,47201], [33000,49200], 225, 0, "the-living-marsh"],
  ["drowned-intake", [66081,61849], [68000,60500], 215, 0, "the-living-marsh"],
  ["lantern-pools", [84635,47201], [82000,49000], 155, 1.5, "the-living-marsh"],
  ["reedless-mile", [53711,42318], [52000,44500], 135, 1.9, "the-living-marsh"],
  ["heartfen", [61849,51432], [64000,50000], 205, 0.8, "the-living-marsh"],
] as const;

export type BloomfallAtlasPlacement = {
  readonly id: string; readonly entrySlug: string; readonly geometry: StoryMapGeometry;
  readonly label: readonly [number, number]; readonly minZoom: number; readonly maxZoom: null; readonly priority: number;
};

export const bloomfallLocalPoiPlacements: readonly BloomfallAtlasPlacement[] = poiSeeds.map(([entrySlug, position, label, priority, minZoom]) => ({
  id: bloomfallAtlasId("placement", entrySlug), entrySlug, geometry: { type: "POINT", coordinates: position }, label, priority, minZoom, maxZoom: null,
}));

export const bloomfallLocalRoutes = [
  { key: "riverlands-road", endpointSlug: "riverlands", type: "ROAD", status: "AUTHOR_NOW", confidence: "HIGH_CONFIDENCE", minZoom: 0.6, priority: 50, geometry: { type: "MULTILINESTRING", coordinates: [[[0,21000],[10000,21000],[22786,21159],[32000,19000],[40000,15500],[48828,8138]],[[32000,19000],[43000,20500],[55339,19500]]] } },
  { key: "ocean-sea-route", endpointSlug: "the-ocean", type: "SEA_ROUTE", status: "AUTHOR_NOW", confidence: "HIGH_CONFIDENCE", minZoom: 0.8, priority: 45, geometry: { type: "LINESTRING", coordinates: [[66081,66667],[66081,61849],[62000,57000],[55000,52000],[47000,49000],[35807,47201]] } },
] as const;

export const bloomfallLocalRouteBacklog = {
  AUTHOR_NOW: bloomfallLocalRoutes.map((route) => route.key),
  REVIEW_REQUIRED: ["Cairnwood–Glassroot expedition trail", "Southreach Complex service/rail alignment"],
  DEFER: ["Walking Orchard/Reedless moving route", "Long Graze herd corridor", "Heartfen route", "Magic-Torn Wasteland route", "full-world continuation geometry"],
} as const;

function signedArea(ringPoints: readonly (readonly [number, number])[]) { let sum = 0; for (let index = 1; index < ringPoints.length; index += 1) sum += ringPoints[index - 1]![0] * ringPoints[index]![1] - ringPoints[index]![0] * ringPoints[index - 1]![1]; return Math.abs(sum / 2); }
function pointInRing(point: readonly [number, number], ringPoints: readonly (readonly [number, number])[]) { let inside = false; for (let index = 0, previous = ringPoints.length - 1; index < ringPoints.length; previous = index++) { const currentPoint = ringPoints[index]!; const previousPoint = ringPoints[previous]!; if ((currentPoint[1] > point[1]) !== (previousPoint[1] > point[1]) && point[0] < (previousPoint[0] - currentPoint[0]) * (point[1] - currentPoint[1]) / (previousPoint[1] - currentPoint[1]) + currentPoint[0]) inside = !inside; } return inside; }

export function buildBloomfallLocalAtlasManifest() {
  const topology = validateAtlasTopology(bloomfallLocalTopology, { width: 100000, height: 66667 });
  if (!topology.valid || !topology.value) throw new Error(`Bloomfall local topology invalid: ${topology.findings.map((finding) => finding.code).join(", ")}`);
  const geometryByArea = new Map(topology.value.map((area) => [area.areaId, area.geometry]));
  const regionPlacements: BloomfallAtlasPlacement[] = bloomfallReachLocalAtlas.subregions.map((region) => {
    const target = areas[region.slug]; const geometry = geometryByArea.get(target.placementId);
    if (!geometry) throw new Error(`Missing derived geometry for ${region.slug}.`);
    return { id: target.placementId, entrySlug: region.slug, geometry, label: subregionPresentation[region.slug].label, minZoom: 0, maxZoom: null, priority: subregionPresentation[region.slug].priority };
  });
  const regionArea = topology.value.reduce((sum, area) => sum + (area.geometry.type === "POLYGON" ? signedArea(area.geometry.coordinates[0]!) : area.geometry.coordinates.reduce((total, polygon) => total + signedArea(polygon[0]!), 0)), 0);
  for (const [slug, position, , , , parentSlug] of poiSeeds) {
    const parent = geometryByArea.get(areas[parentSlug].placementId);
    const shell = parent?.type === "POLYGON" ? parent.coordinates[0] : parent?.coordinates[0]?.[0];
    if (!shell || !pointInRing(position, shell)) throw new Error(`${slug} is outside its canonical ${parentSlug} area.`);
  }
  const payload = {
    contract: "martino-bloomfall-local-atlas", contractVersion: 1, scene: { slug: mapSlug, ownerEntrySlug: "bloomfall-reach", parentSlug: "martino-world", artVersion: "v1", imageWidth: 1536, imageHeight: 1024, coordinateWidth: 100000, coordinateHeight: 66667, initialCenter: [50000,33333], initialZoom: 0, minZoom: 0, maxZoom: 5 },
    art: bloomfallLocalAtlasArt, topology: bloomfallLocalTopology, placements: [...regionPlacements, ...bloomfallLocalPoiPlacements], routes: bloomfallLocalRoutes, routeBacklog: bloomfallLocalRouteBacklog,
    analysis: { topologyValid: true, subregions: 3, pois: 15, nodes: 8, boundaries: 10, rings: 3, boundaryReferences: 12, sharedInternalBoundaries: 2, holes: 0, partitionArea: regionArea, expectedExtentArea: 100000 * 66667, gaps: 0, overlaps: 0 },
    overlayArchitecture: { namedCreatureTerritories: "future non-base analytical overlay keyed to Codex entry and scene", spawnPoints: "not authored", baseTopologyMutationRequired: false },
  } as const;
  return { ...payload, logicalSha256: atlasSha256(stableAtlasJson(payload, false)) };
}
