import { createHash } from "node:crypto";
import {
  atlasRingSignedArea,
  classifyAtlasSegmentIntersection,
  validateAtlasPoint,
  validateAtlasTopology,
  type AtlasBoundary,
  type AtlasDerivedTopologyArea,
  type AtlasNumericPoint,
  type AtlasPoint,
  type AtlasPolygonGeometry,
  type AtlasTopologyArea,
  type AtlasTopologyDataset,
  type AtlasTopologyNode,
  bloomfallReachCanon,
  canonicalBloomfallReachSlug,
} from "@habitat/shared";

export const atlasCanonicalTopologyContract = "martino-atlas-v2-canonical-world-topology" as const;
export const atlasCanonicalTopologyVersion = 1 as const;
export const atlasFrozenArtworkSha256 = "427bf4967afa8a96afa2175d5aed261225cf7fbeed17944be527f4616b5713b6" as const;

export const atlasTopLevelRegionSlugs = [
  "the-desert",
  "grand-rift",
  "the-red-forest",
  "high-cliffs",
  "riverlands",
  "magic-torn-wasteland",
  bloomfallReachCanon.slug,
  "the-peninsula",
] as const;

export type AtlasTopLevelRegionSlug = (typeof atlasTopLevelRegionSlugs)[number];
export type AtlasCanonicalAreaRole = "TOP_LEVEL_LAND" | "MAJOR_WATER" | "NESTED_GEOGRAPHY";
export type AtlasBoundarySemantic = "CANONICAL_FEATURE" | "CARTOGRAPHIC_TRANSITION" | "COASTLINE" | "WATER_BOUNDARY";
export type AtlasTraceConfidence = "HIGH" | "MEDIUM" | "OWNER_REVIEW_REQUIRED";
export type AtlasMigrationApproval = "APPROVED_FOR_MIGRATION" | "OWNER_REVIEW_REQUIRED";

export type AtlasCanonicalBoundaryMetadata = {
  readonly locator: string;
  readonly semantic: AtlasBoundarySemantic;
  readonly confidence: AtlasTraceConfidence;
  readonly owners: readonly string[];
  readonly evidence: string;
};

export type AtlasCanonicalAreaMetadata = {
  readonly entrySlug: string;
  readonly title: string;
  readonly role: AtlasCanonicalAreaRole;
  readonly approval: AtlasMigrationApproval;
  readonly parentEntrySlug: string | null;
  readonly hierarchyLevel: "WORLD" | "REGION";
};

export type AtlasTraceReview = {
  readonly locator: string;
  readonly mapSlug: string;
  readonly entrySlugs: readonly string[];
  readonly confidence: AtlasTraceConfidence;
  readonly evidence: string;
  readonly ownerDecision: string | null;
};

export type AtlasCanonicalTopologyTrace = {
  readonly contract: typeof atlasCanonicalTopologyContract;
  readonly contractVersion: typeof atlasCanonicalTopologyVersion;
  readonly traceVersion: 2;
  readonly coordinateSource: "MANUAL_FROZEN_ARTWORK_TRACE";
  readonly frozenArtwork: {
    readonly path: "apps/web/private/codex-art/maps/candidates/martino-world-map-v2-clean-production-candidate.png";
    readonly width: 1536;
    readonly height: 1024;
    readonly sha256: typeof atlasFrozenArtworkSha256;
  };
  readonly deathCanyonCandidateReview: {
    readonly path: "Docs/atlas-master-v2-candidate/death-canyon-dynamic-boundary-v1.json";
    readonly sha256: "be6fa25410d3d10e5e13d5fc3afe680b8ed1bec571c54e6a46a8d94dcbd64ceb";
    readonly declaredReferenceArtwork: "martino-world-map-v2-topology-lock-review-candidate.png";
    readonly ringPoints: 23;
    readonly atlasGeometryValidationFindings: 0;
    readonly distinctVerticesInsideFinalGrandRift: "22/22";
    readonly grandRiftBoundaryCrossings: 0;
    readonly redForestBoundaryCrossings: 0;
    readonly decision: "REFINED_NOT_USED_AS_TRACE_SOURCE";
    readonly rationale: string;
  };
  readonly maps: readonly [{
    readonly mapSlug: "martino-world";
    readonly artworkIdentity: "martino-world:v2-clean-production-candidate";
    readonly dimensions: { readonly width: 100_000; readonly height: 66_667 };
    readonly dataset: AtlasTopologyDataset;
    readonly nodeLocators: Readonly<Record<string, string>>;
    readonly boundaryLocators: Readonly<Record<string, string>>;
    readonly areaEntrySlugs: Readonly<Record<string, string>>;
    readonly boundaryMetadata: Readonly<Record<string, AtlasCanonicalBoundaryMetadata>>;
    readonly areaMetadata: Readonly<Record<string, AtlasCanonicalAreaMetadata>>;
    readonly reviews: readonly AtlasTraceReview[];
  }];
  readonly startingIsland: {
    readonly mapSlug: "martino-starting-island";
    readonly status: "DEFERRED_CHILD_SCENE";
    readonly reason: string;
  };
  readonly portArcadia: {
    readonly mapSlug: "martino-port-arcadia";
    readonly status: "RECALIBRATION_REQUIRED";
    readonly decodedArtwork: "1599x984";
    readonly declaredContract: "1536x1024";
  };
};

type BoundaryDefinition = {
  readonly locator: string;
  readonly start: string;
  readonly end: string;
  readonly kind: AtlasBoundary["kind"];
  readonly interiorVertices: readonly AtlasNumericPoint[];
  readonly semantic: AtlasBoundarySemantic;
  readonly confidence: AtlasTraceConfidence;
  readonly owners: readonly string[];
  readonly evidence: string;
};

const worldDimensions = { width: 100_000, height: 66_667 } as const;

function deterministicUuid(key: string) {
  const hex = createHash("sha256").update(`martino-atlas-v2-migration-rehearsal:${key}`).digest("hex").slice(0, 32).split("");
  hex[12] = "5";
  hex[16] = ((Number.parseInt(hex[16]!, 16) & 0x3) | 0x8).toString(16);
  const compact = hex.join("");
  return `${compact.slice(0, 8)}-${compact.slice(8, 12)}-${compact.slice(12, 16)}-${compact.slice(16, 20)}-${compact.slice(20)}`;
}

function atlasPoint(position: AtlasNumericPoint): AtlasPoint {
  const result = validateAtlasPoint(position, worldDimensions);
  if (!result.ok) throw new Error(`Invalid canonical topology point ${position.join(",")}: ${result.issue}.`);
  return result.value;
}

function pointsEqual(left: AtlasNumericPoint, right: AtlasNumericPoint) {
  return left[0] === right[0] && left[1] === right[1];
}

function topologyLine(trace: AtlasCanonicalTopologyTrace, boundaryId: string) {
  const map = trace.maps[0];
  const boundary = map.dataset.boundaries.find((candidate) => candidate.id === boundaryId);
  if (!boundary) throw new Error(`Missing topology boundary ${boundaryId}.`);
  const nodes = new Map(map.dataset.nodes.map((node) => [node.id, node.position]));
  const start = nodes.get(boundary.startNodeId);
  const end = nodes.get(boundary.endNodeId);
  if (!start || !end) throw new Error(`Boundary ${boundaryId} has a missing endpoint.`);
  return [start, ...boundary.interiorVertices, end] as readonly AtlasPoint[];
}

function reversePoints(points: readonly AtlasPoint[]) {
  return [...points].reverse() as AtlasPoint[];
}

function joinPieces(pieces: readonly (readonly AtlasPoint[])[]) {
  const points: AtlasPoint[] = [];
  for (const [index, piece] of pieces.entries()) points.push(...(index === 0 ? piece : piece.slice(1)));
  return points;
}

export function buildAtlasCanonicalTopologyTrace(): AtlasCanonicalTopologyTrace {
  const nodePositions: Readonly<Record<string, AtlasNumericPoint>> = {
    "junction.desert-high-cliffs-grand-rift": [24_089, 3_581],
    "junction.high-cliffs-grand-rift-riverlands": [34_180, 13_021],
    "junction.desert-grand-rift-red-forest": [27_344, 32_227],
    "junction.grand-rift-red-forest-riverlands": [34_505, 19_857],
    "junction.desert-red-forest-riverlands": [33_854, 38_086],
    "junction.high-cliffs-riverlands-magic-torn": [58_594, 14_974],
    "junction.riverlands-magic-torn-unknown": [69_661, 21_484],
    "coast.high-cliffs-magic-torn": [62_500, 2_279],
    "coast.magic-torn-unknown": [96_029, 16_276],
    "coast.unknown-peninsula-riverlands": [65_755, 39_063],
    "coast.peninsula-desert-riverlands": [36_133, 39_714],
    "grand-lake.northwest": [38_411, 5_859],
    "grand-lake.northeast": [56_315, 4_883],
    "grand-lake.southeast": [57_943, 13_997],
    "grand-lake.southwest": [39_714, 14_323],
    "death-canyon.north": [26_367, 7_813],
    "death-canyon.east": [31_250, 18_229],
    "death-canyon.south": [27_344, 29_623],
    "death-canyon.west": [23_828, 19_531],
  };
  const nodesByLocator = Object.fromEntries(Object.entries(nodePositions).map(([locator, position]) => [locator, {
    id: deterministicUuid(`topology-node:${locator}`),
    mapSlug: "martino-world",
    position: atlasPoint(position),
    version: 1,
  } satisfies AtlasTopologyNode])) as Record<string, AtlasTopologyNode>;

  const definitions: readonly BoundaryDefinition[] = [
    { locator: "coast.high-cliffs", start: "junction.desert-high-cliffs-grand-rift", end: "coast.high-cliffs-magic-torn", kind: "COAST", interiorVertices: [[30_599, 1_628], [39_063, 1_302], [48_177, 1_302], [55_990, 1_628]], semantic: "COASTLINE", confidence: "HIGH", owners: ["high-cliffs"], evidence: "The northern alpine shoreline is a stable geographic feature on the frozen raster." },
    { locator: "coast.magic-torn", start: "coast.high-cliffs-magic-torn", end: "coast.magic-torn-unknown", kind: "COAST", interiorVertices: [[70_313, 1_302], [78_776, 1_953], [87_240, 4_232], [94_401, 7_487], [98_633, 11_068], [98_958, 14_323]], semantic: "COASTLINE", confidence: "HIGH", owners: ["magic-torn-wasteland"], evidence: "The northeastern coast is visually explicit and independent of the magical transition." },
    { locator: "coast.unknown-southeast", start: "coast.magic-torn-unknown", end: "coast.unknown-peninsula-riverlands", kind: "COAST", interiorVertices: [[99_284, 20_833], [97_982, 26_693], [94_401, 32_552], [89_193, 36_133], [83_333, 41_016], [75_521, 45_573], [70_313, 43_294], [67_057, 41_016]], semantic: "COASTLINE", confidence: "HIGH", owners: [bloomfallReachCanon.slug], evidence: "The southeastern coastline is visually explicit; the region's canonical identity is independent of its locked geometry." },
    { locator: "coast.peninsula", start: "coast.unknown-peninsula-riverlands", end: "coast.peninsula-desert-riverlands", kind: "COAST", interiorVertices: [[67_708, 42_318], [65_755, 46_875], [63_802, 52_084], [62_500, 57_292], [59_896, 61_198], [55_339, 63_802], [50_781, 63_151], [46_875, 60_547], [44_271, 56_641], [42_318, 51_433], [40_365, 45_573], [38_086, 42_318]], semantic: "COASTLINE", confidence: "HIGH", owners: ["the-peninsula"], evidence: "The long Peninsula and Port Arcadia tip are among the strongest frozen-raster anchors." },
    { locator: "coast.desert", start: "junction.desert-high-cliffs-grand-rift", end: "coast.peninsula-desert-riverlands", kind: "COAST", interiorVertices: [[19_531, 1_953], [14_323, 2_279], [9_766, 4_557], [6_510, 7_813], [3_906, 13_021], [2_279, 19_531], [2_930, 27_344], [5_859, 33_854], [11_068, 37_761], [16_927, 39_714], [22_786, 41_016], [29_297, 41_667], [33_854, 40_690]], semantic: "COASTLINE", confidence: "HIGH", owners: ["the-desert"], evidence: "The western and southwestern coastline is explicit around the arid landmass." },

    { locator: "border.desert-grand-rift", start: "junction.desert-high-cliffs-grand-rift", end: "junction.desert-grand-rift-red-forest", kind: "INTERNAL_BORDER", interiorVertices: [[22_786, 7_161], [21_484, 11_719], [20_182, 16_276], [19_206, 20_833], [20_508, 24_740], [22_786, 27_995], [25_391, 30_599]], semantic: "CANONICAL_FEATURE", confidence: "HIGH", owners: ["the-desert", "grand-rift"], evidence: "The western rift wall and exposed geology provide a defensible shared edge." },
    { locator: "border.desert-red-forest", start: "junction.desert-grand-rift-red-forest", end: "junction.desert-red-forest-riverlands", kind: "INTERNAL_BORDER", interiorVertices: [[28_646, 33_854], [31_250, 36_459]], semantic: "CARTOGRAPHIC_TRANSITION", confidence: "MEDIUM", owners: ["the-desert", "the-red-forest"], evidence: "The edge follows the logical center of the arid-to-crimson vegetation transition." },
    { locator: "border.desert-riverlands", start: "junction.desert-red-forest-riverlands", end: "coast.peninsula-desert-riverlands", kind: "INTERNAL_BORDER", interiorVertices: [[35_156, 39_063]], semantic: "CARTOGRAPHIC_TRANSITION", confidence: "MEDIUM", owners: ["the-desert", "riverlands"], evidence: "A short cartographic transition completes the western lowland partition without turning the river corridor into a hole." },
    { locator: "border.grand-rift-high-cliffs", start: "junction.desert-high-cliffs-grand-rift", end: "junction.high-cliffs-grand-rift-riverlands", kind: "INTERNAL_BORDER", interiorVertices: [[26_042, 4_557], [28_646, 6_185], [31_250, 8_464], [33_203, 10_742]], semantic: "CANONICAL_FEATURE", confidence: "HIGH", owners: ["grand-rift", "high-cliffs"], evidence: "The fractured rift rim meets the alpine crown along a visible ridge and shelf break." },
    { locator: "border.grand-rift-riverlands", start: "junction.high-cliffs-grand-rift-riverlands", end: "junction.grand-rift-red-forest-riverlands", kind: "INTERNAL_BORDER", interiorVertices: [[34_505, 15_300], [34_831, 17_578]], semantic: "CANONICAL_FEATURE", confidence: "HIGH", owners: ["grand-rift", "riverlands"], evidence: "The upper eastern rift wall creates a short, visually defensible boundary with the central lowlands." },
    { locator: "border.grand-rift-red-forest", start: "junction.grand-rift-red-forest-riverlands", end: "junction.desert-grand-rift-red-forest", kind: "INTERNAL_BORDER", interiorVertices: [[33_203, 22_136], [32_552, 24_740], [31_250, 27_344], [29_297, 29_948]], semantic: "CANONICAL_FEATURE", confidence: "MEDIUM", owners: ["grand-rift", "the-red-forest"], evidence: "The shared edge follows the fractured shelf between rift geology and the contiguous crimson canopy; visual feathering does not change ownership." },
    { locator: "border.high-cliffs-riverlands", start: "junction.high-cliffs-grand-rift-riverlands", end: "junction.high-cliffs-riverlands-magic-torn", kind: "INTERNAL_BORDER", interiorVertices: [[39_063, 16_927], [44_922, 18_229], [50_781, 18_555], [55_339, 16_927]], semantic: "CARTOGRAPHIC_TRANSITION", confidence: "MEDIUM", owners: ["high-cliffs", "riverlands"], evidence: "The line follows the cliff lip and watershed while allowing visible river valleys to cross the ecological transition." },
    { locator: "border.high-cliffs-magic-torn", start: "coast.high-cliffs-magic-torn", end: "junction.high-cliffs-riverlands-magic-torn", kind: "INTERNAL_BORDER", interiorVertices: [[61_849, 5_208], [60_547, 8_464], [59_570, 11_719]], semantic: "CANONICAL_FEATURE", confidence: "HIGH", owners: ["high-cliffs", "magic-torn-wasteland"], evidence: "The alpine rock gives way to the first continuous reality fractures along a strong visible transition." },
    { locator: "border.magic-torn-riverlands", start: "junction.high-cliffs-riverlands-magic-torn", end: "junction.riverlands-magic-torn-unknown", kind: "INTERNAL_BORDER", interiorVertices: [[61_198, 16_927], [64_453, 19_531]], semantic: "CANONICAL_FEATURE", confidence: "HIGH", owners: ["magic-torn-wasteland", "riverlands"], evidence: "The anomaly front provides a clear western edge to the magical terrain." },
    { locator: "border.magic-torn-unknown", start: "junction.riverlands-magic-torn-unknown", end: "coast.magic-torn-unknown", kind: "INTERNAL_BORDER", interiorVertices: [[74_870, 20_508], [80_078, 18_555], [85_938, 16_927], [91_146, 16_276]], semantic: "CARTOGRAPHIC_TRANSITION", confidence: "MEDIUM", owners: ["magic-torn-wasteland", bloomfallReachCanon.slug], evidence: "The vector follows the defensible midpoint between active purple fractures and Bloomfall Reach." },
    { locator: "border.riverlands-unknown", start: "junction.riverlands-magic-torn-unknown", end: "coast.unknown-peninsula-riverlands", kind: "INTERNAL_BORDER", interiorVertices: [[68_359, 24_740], [67_057, 27_995], [66_406, 32_552], [65_755, 36_459]], semantic: "CARTOGRAPHIC_TRANSITION", confidence: "MEDIUM", owners: ["riverlands", bloomfallReachCanon.slug], evidence: "The line follows the western edge of Bloomfall Reach without changing the locked regional partition." },
    { locator: "border.riverlands-peninsula", start: "coast.peninsula-desert-riverlands", end: "coast.unknown-peninsula-riverlands", kind: "INTERNAL_BORDER", interiorVertices: [[42_318, 37_110], [49_479, 37_761], [57_292, 37_110], [62_500, 38_412]], semantic: "CANONICAL_FEATURE", confidence: "HIGH", owners: ["riverlands", "the-peninsula"], evidence: "The established northern neck closure separates the Peninsula from the central lowlands at one exact edge." },
    { locator: "border.red-forest-riverlands", start: "junction.grand-rift-red-forest-riverlands", end: "junction.desert-red-forest-riverlands", kind: "INTERNAL_BORDER", interiorVertices: [[39_063, 19_531], [42_969, 21_484], [41_016, 25_391], [42_969, 27_995], [40_365, 31_901], [37_109, 35_156]], semantic: "CARTOGRAPHIC_TRANSITION", confidence: "MEDIUM", owners: ["the-red-forest", "riverlands"], evidence: "The exact selection edge follows the center of forest thinning while keeping the Red Forest one contiguous region." },

    { locator: "grand-lake.shore.north", start: "grand-lake.northwest", end: "grand-lake.northeast", kind: "WATER_BOUNDARY", interiorVertices: [[42_969, 3_581], [48_177, 2_604], [53_385, 3_581]], semantic: "WATER_BOUNDARY", confidence: "HIGH", owners: ["grand-lake", "high-cliffs"], evidence: "The northern lake shoreline is visually explicit beneath the Floating City." },
    { locator: "grand-lake.shore.east", start: "grand-lake.northeast", end: "grand-lake.southeast", kind: "WATER_BOUNDARY", interiorVertices: [[58_594, 6_836], [59_570, 10_417]], semantic: "WATER_BOUNDARY", confidence: "HIGH", owners: ["grand-lake", "high-cliffs"], evidence: "The eastern shore is a stable water/rock edge." },
    { locator: "grand-lake.shore.south", start: "grand-lake.southeast", end: "grand-lake.southwest", kind: "WATER_BOUNDARY", interiorVertices: [[53_385, 14_974], [47_526, 15_300], [42_318, 14_974]], semantic: "WATER_BOUNDARY", confidence: "HIGH", owners: ["grand-lake", "high-cliffs"], evidence: "The southern shoreline follows the elevated basin above the great waterfall." },
    { locator: "grand-lake.shore.west", start: "grand-lake.southwest", end: "grand-lake.northwest", kind: "WATER_BOUNDARY", interiorVertices: [[38_086, 12_044], [37_760, 8_789]], semantic: "WATER_BOUNDARY", confidence: "HIGH", owners: ["grand-lake", "high-cliffs"], evidence: "The western shore is a clear enclosed basin edge." },

    { locator: "death-canyon.edge.northeast", start: "death-canyon.north", end: "death-canyon.east", kind: "INTERNAL_BORDER", interiorVertices: [[27_669, 7_813], [28_971, 8_789], [29_818, 10_417], [30_078, 12_370], [30_924, 14_323], [31_250, 16_276]], semantic: "CANONICAL_FEATURE", confidence: "HIGH", owners: ["death-canyon"], evidence: "The nested edge follows the toxic fissure's northeastern broken shelf." },
    { locator: "death-canyon.edge.southeast", start: "death-canyon.east", end: "death-canyon.south", kind: "INTERNAL_BORDER", interiorVertices: [[31_576, 20_508], [31_120, 22_787], [30_469, 25_391], [29_297, 27_995]], semantic: "CANONICAL_FEATURE", confidence: "HIGH", owners: ["death-canyon"], evidence: "The nested edge follows the eastern canyon wall without touching the Grand Rift shell." },
    { locator: "death-canyon.edge.southwest", start: "death-canyon.south", end: "death-canyon.west", kind: "INTERNAL_BORDER", interiorVertices: [[26_042, 28_516], [25_000, 26_693], [24_219, 24_414], [23_763, 21_810]], semantic: "CANONICAL_FEATURE", confidence: "HIGH", owners: ["death-canyon"], evidence: "The nested edge follows the southern and western exposed canyon shelves." },
    { locator: "death-canyon.edge.northwest", start: "death-canyon.west", end: "death-canyon.north", kind: "INTERNAL_BORDER", interiorVertices: [[23_698, 17_253], [24_089, 14_649], [24_414, 12_044], [25_065, 9_440]], semantic: "CANONICAL_FEATURE", confidence: "HIGH", owners: ["death-canyon"], evidence: "The nested edge closes along the western shelf while remaining inside Grand Rift." },
  ];

  const boundariesByLocator: Record<string, AtlasBoundary> = {};
  const metadataByBoundaryId: Record<string, AtlasCanonicalBoundaryMetadata> = {};
  for (const definition of definitions) {
    const start = nodesByLocator[definition.start];
    const end = nodesByLocator[definition.end];
    if (!start || !end) throw new Error(`Boundary ${definition.locator} references an unknown node.`);
    const value: AtlasBoundary = {
      id: deterministicUuid(`boundary:${definition.locator}`),
      mapSlug: "martino-world",
      startNodeId: start.id,
      endNodeId: end.id,
      kind: definition.kind,
      interiorVertices: definition.interiorVertices.map(atlasPoint),
      version: 1,
    };
    boundariesByLocator[definition.locator] = value;
    metadataByBoundaryId[value.id] = { locator: definition.locator, semantic: definition.semantic, confidence: definition.confidence, owners: definition.owners, evidence: definition.evidence };
  }

  const refs = (specifications: readonly (string | readonly [string, boolean])[]) => specifications.map((specification, sequence) => {
    const [locator, reversed] = typeof specification === "string" ? [specification, false] : specification;
    const boundary = boundariesByLocator[locator];
    if (!boundary) throw new Error(`Area ring references unknown boundary ${locator}.`);
    return { boundaryId: boundary.id, sequence, reversed };
  });
  const areaMetadata: Record<string, AtlasCanonicalAreaMetadata> = {};
  const area = (entrySlug: string, title: string, role: AtlasCanonicalAreaRole, shell: readonly (string | readonly [string, boolean])[], holes: readonly (readonly (string | readonly [string, boolean])[])[] = [], parentEntrySlug: string | null = null, stableIdentitySlug = entrySlug): AtlasTopologyArea => {
    const id = deterministicUuid(`area:martino-world:${stableIdentitySlug}`);
    areaMetadata[id] = { entrySlug, title, role, approval: "APPROVED_FOR_MIGRATION", parentEntrySlug, hierarchyLevel: role === "NESTED_GEOGRAPHY" ? "REGION" : "WORLD" };
    return {
      id,
      mapSlug: "martino-world",
      layerKind: "BASE_GEOGRAPHY",
      version: 1,
      rings: [
        { id: deterministicUuid(`ring:martino-world:${stableIdentitySlug}:0:0`), componentIndex: 0, role: "SHELL", boundaries: refs(shell) },
        ...holes.map((hole, index) => ({ id: deterministicUuid(`ring:martino-world:${stableIdentitySlug}:0:${index + 1}`), componentIndex: 0, role: "HOLE" as const, boundaries: refs(hole) })),
      ],
    };
  };

  const areas: AtlasTopologyArea[] = [
    area("high-cliffs", "High Cliffs", "TOP_LEVEL_LAND", ["coast.high-cliffs", "border.high-cliffs-magic-torn", ["border.high-cliffs-riverlands", true], ["border.grand-rift-high-cliffs", true]], [[ ["grand-lake.shore.west", true], ["grand-lake.shore.south", true], ["grand-lake.shore.east", true], ["grand-lake.shore.north", true] ]]),
    area("grand-lake", "Grand Lake", "MAJOR_WATER", ["grand-lake.shore.north", "grand-lake.shore.east", "grand-lake.shore.south", "grand-lake.shore.west"]),
    area("magic-torn-wasteland", "Magic-Torn Wasteland", "TOP_LEVEL_LAND", ["coast.magic-torn", ["border.magic-torn-unknown", true], ["border.magic-torn-riverlands", true], ["border.high-cliffs-magic-torn", true]]),
    area(bloomfallReachCanon.slug, bloomfallReachCanon.title, "TOP_LEVEL_LAND", ["coast.unknown-southeast", ["border.riverlands-unknown", true], "border.magic-torn-unknown"], [], null, bloomfallReachCanon.formerDevelopmentPlaceholder.slug),
    area("the-peninsula", "The Peninsula", "TOP_LEVEL_LAND", ["coast.peninsula", "border.riverlands-peninsula"]),
    area("riverlands", "Riverlands", "TOP_LEVEL_LAND", ["border.high-cliffs-riverlands", "border.magic-torn-riverlands", "border.riverlands-unknown", ["border.riverlands-peninsula", true], ["border.desert-riverlands", true], ["border.red-forest-riverlands", true], ["border.grand-rift-riverlands", true]]),
    area("the-desert", "The Desert", "TOP_LEVEL_LAND", ["border.desert-grand-rift", "border.desert-red-forest", "border.desert-riverlands", ["coast.desert", true]]),
    area("grand-rift", "Grand Rift", "TOP_LEVEL_LAND", ["border.grand-rift-high-cliffs", "border.grand-rift-riverlands", "border.grand-rift-red-forest", ["border.desert-grand-rift", true]]),
    area("the-red-forest", "The Red Forest", "TOP_LEVEL_LAND", ["border.red-forest-riverlands", ["border.desert-red-forest", true], ["border.grand-rift-red-forest", true]]),
    area("death-canyon", "Death Canyon", "NESTED_GEOGRAPHY", ["death-canyon.edge.northeast", "death-canyon.edge.southeast", "death-canyon.edge.southwest", "death-canyon.edge.northwest"], [], "grand-rift"),
  ];

  const dataset: AtlasTopologyDataset = { nodes: Object.values(nodesByLocator), boundaries: Object.values(boundariesByLocator), areas };
  const validation = validateAtlasTopology(dataset, worldDimensions);
  if (!validation.valid) throw new Error(`Canonical topology trace is invalid: ${validation.findings.map((finding) => `${finding.code}:${finding.path}`).join(", ")}`);
  const reviews = definitions.map((definition): AtlasTraceReview => ({ locator: definition.locator, mapSlug: "martino-world", entrySlugs: definition.owners, confidence: definition.confidence, evidence: definition.evidence, ownerDecision: definition.confidence === "OWNER_REVIEW_REQUIRED" ? "Localized owner review required." : null }));
  return {
    contract: atlasCanonicalTopologyContract,
    contractVersion: atlasCanonicalTopologyVersion,
    traceVersion: 2,
    coordinateSource: "MANUAL_FROZEN_ARTWORK_TRACE",
    frozenArtwork: { path: "apps/web/private/codex-art/maps/candidates/martino-world-map-v2-clean-production-candidate.png", width: 1536, height: 1024, sha256: atlasFrozenArtworkSha256 },
    deathCanyonCandidateReview: {
      path: "Docs/atlas-master-v2-candidate/death-canyon-dynamic-boundary-v1.json",
      sha256: "be6fa25410d3d10e5e13d5fc3afe680b8ed1bec571c54e6a46a8d94dcbd64ceb",
      declaredReferenceArtwork: "martino-world-map-v2-topology-lock-review-candidate.png",
      ringPoints: 23,
      atlasGeometryValidationFindings: 0,
      distinctVerticesInsideFinalGrandRift: "22/22",
      grandRiftBoundaryCrossings: 0,
      redForestBoundaryCrossings: 0,
      decision: "REFINED_NOT_USED_AS_TRACE_SOURCE",
      rationale: "The Prompt 5 candidate is structurally valid and contained, but it declares the prohibited topology-lock review raster as its visual source. Prompt 6 therefore preserves it as evidence and authors the canonical 23-point shell independently against the frozen clean raster.",
    },
    maps: [{
      mapSlug: "martino-world",
      artworkIdentity: "martino-world:v2-clean-production-candidate",
      dimensions: worldDimensions,
      dataset,
      nodeLocators: Object.fromEntries(Object.entries(nodesByLocator).map(([locator, value]) => [value.id, locator])),
      boundaryLocators: Object.fromEntries(Object.entries(boundariesByLocator).map(([locator, value]) => [value.id, locator])),
      areaEntrySlugs: Object.fromEntries(areas.map((value) => [value.id, areaMetadata[value.id]!.entrySlug])),
      boundaryMetadata: metadataByBoundaryId,
      areaMetadata,
      reviews,
    }],
    startingIsland: { mapSlug: "martino-starting-island", status: "DEFERRED_CHILD_SCENE", reason: "Prompt 6 locks only the world master. Igit Island remains a world anchor and independent child scene." },
    portArcadia: { mapSlug: "martino-port-arcadia", status: "RECALIBRATION_REQUIRED", decodedArtwork: "1599x984", declaredContract: "1536x1024" },
  };
}

function geometryArea(geometry: AtlasPolygonGeometry) {
  const shell = Math.abs(atlasRingSignedArea(geometry.coordinates[0]!));
  const holes = geometry.coordinates.slice(1).reduce((sum, ring) => sum + Math.abs(atlasRingSignedArea(ring)), 0);
  return shell - holes;
}

function pointOnSegment(point: AtlasNumericPoint, from: AtlasNumericPoint, to: AtlasNumericPoint) {
  const cross = (to[0] - from[0]) * (point[1] - from[1]) - (to[1] - from[1]) * (point[0] - from[0]);
  return cross === 0 && point[0] >= Math.min(from[0], to[0]) && point[0] <= Math.max(from[0], to[0]) && point[1] >= Math.min(from[1], to[1]) && point[1] <= Math.max(from[1], to[1]);
}

function pointInRing(point: AtlasNumericPoint, ring: readonly AtlasNumericPoint[]) {
  for (let index = 1; index < ring.length; index += 1) if (pointOnSegment(point, ring[index - 1]!, ring[index]!)) return "BOUNDARY" as const;
  let inside = false;
  for (let left = 0, right = ring.length - 1; left < ring.length; right = left++) {
    const a = ring[left]!;
    const b = ring[right]!;
    if ((a[1] > point[1]) !== (b[1] > point[1]) && point[0] < (b[0] - a[0]) * (point[1] - a[1]) / (b[1] - a[1]) + a[0]) inside = !inside;
  }
  return inside ? "INSIDE" as const : "OUTSIDE" as const;
}

function ringsCross(left: readonly AtlasNumericPoint[], right: readonly AtlasNumericPoint[]) {
  for (let a = 1; a < left.length; a += 1) for (let b = 1; b < right.length; b += 1) if (classifyAtlasSegmentIntersection(left[a - 1]!, left[a]!, right[b - 1]!, right[b]!) !== "NONE") return true;
  return false;
}

function normalizedPath(points: readonly AtlasNumericPoint[]) {
  const forward = JSON.stringify(points);
  const reverse = JSON.stringify([...points].reverse());
  return forward < reverse ? forward : reverse;
}

export function analyzeAtlasCanonicalTopology(trace: AtlasCanonicalTopologyTrace) {
  const map = trace.maps[0];
  const validation = validateAtlasTopology(map.dataset, map.dimensions);
  const derivedBySlug = new Map<string, AtlasPolygonGeometry>();
  for (const area of validation.value ?? []) {
    const slug = map.areaEntrySlugs[area.areaId];
    if (!slug || area.geometry.type !== "POLYGON") throw new Error(`Canonical world topology requires one polygon component for ${slug ?? area.areaId}.`);
    derivedBySlug.set(canonicalBloomfallReachSlug(slug), area.geometry);
  }
  const nodeUse = new Map(map.dataset.nodes.map((node) => [node.id, 0]));
  const boundaryUse = new Map<string, Array<{ areaId: string; slug: string; role: AtlasCanonicalAreaRole; reversed: boolean; ringRole: "SHELL" | "HOLE" }>>(map.dataset.boundaries.map((boundary) => [boundary.id, []]));
  for (const boundary of map.dataset.boundaries) {
    nodeUse.set(boundary.startNodeId, (nodeUse.get(boundary.startNodeId) ?? 0) + 1);
    nodeUse.set(boundary.endNodeId, (nodeUse.get(boundary.endNodeId) ?? 0) + 1);
  }
  for (const area of map.dataset.areas) for (const ring of area.rings) for (const reference of ring.boundaries) boundaryUse.get(reference.boundaryId)?.push({ areaId: area.id, slug: canonicalBloomfallReachSlug(map.areaEntrySlugs[area.id]!), role: map.areaMetadata[area.id]!.role, reversed: reference.reversed, ringRole: ring.role });

  const boundaryLines = new Map(map.dataset.boundaries.map((boundary) => [boundary.id, topologyLine(trace, boundary.id)]));
  const duplicatePathGroups = new Map<string, string[]>();
  for (const [boundaryId, points] of boundaryLines) duplicatePathGroups.set(normalizedPath(points), [...(duplicatePathGroups.get(normalizedPath(points)) ?? []), boundaryId]);
  const duplicateEditableBorders = [...duplicatePathGroups.values()].filter((ids) => ids.length > 1);

  const unintendedCrossings: Array<{ left: string; right: string; kind: string }> = [];
  const boundaries = map.dataset.boundaries;
  const nodePosition = new Map(map.dataset.nodes.map((node) => [node.id, node.position]));
  for (let leftIndex = 0; leftIndex < boundaries.length; leftIndex += 1) for (let rightIndex = leftIndex + 1; rightIndex < boundaries.length; rightIndex += 1) {
    const left = boundaries[leftIndex]!;
    const right = boundaries[rightIndex]!;
    const leftPoints = boundaryLines.get(left.id)!;
    const rightPoints = boundaryLines.get(right.id)!;
    const sharedNodeIds = [left.startNodeId, left.endNodeId].filter((id) => id === right.startNodeId || id === right.endNodeId);
    const sharedPoints = sharedNodeIds.map((id) => nodePosition.get(id)!);
    for (let a = 1; a < leftPoints.length; a += 1) for (let b = 1; b < rightPoints.length; b += 1) {
      const kind = classifyAtlasSegmentIntersection(leftPoints[a - 1]!, leftPoints[a]!, rightPoints[b - 1]!, rightPoints[b]!);
      if (kind === "NONE") continue;
      const endpointTouch = kind === "TOUCH" && sharedPoints.some((point) => [leftPoints[a - 1]!, leftPoints[a]!].some((candidate) => pointsEqual(candidate, point)) && [rightPoints[b - 1]!, rightPoints[b]!].some((candidate) => pointsEqual(candidate, point)));
      if (!endpointTouch) unintendedCrossings.push({ left: map.boundaryLocators[left.id]!, right: map.boundaryLocators[right.id]!, kind });
    }
  }

  const coordinateOwners = new Map<string, string[]>();
  for (const node of map.dataset.nodes) {
    const key = node.position.join(",");
    coordinateOwners.set(key, [...(coordinateOwners.get(key) ?? []), node.id]);
  }
  const accidentalDuplicateNodes = [...coordinateOwners.entries()].filter(([, ids]) => ids.length > 1).map(([coordinate, ids]) => ({ coordinate, nodeIds: ids }));

  const topLevel = new Set<string>(atlasTopLevelRegionSlugs);
  const partition = new Set<string>([...atlasTopLevelRegionSlugs, "grand-lake"]);
  const oneSidedTopLevelInternalBoundaries = boundaries.filter((boundary) => boundary.kind === "INTERNAL_BORDER" && (boundaryUse.get(boundary.id) ?? []).filter((use) => use.role !== "NESTED_GEOGRAPHY").length !== 2 && (boundaryUse.get(boundary.id) ?? []).some((use) => use.role !== "NESTED_GEOGRAPHY")).map((boundary) => map.boundaryLocators[boundary.id]!);
  const sharedDirectionFailures = [...boundaryUse.entries()].filter(([, uses]) => uses.filter((use) => use.role !== "NESTED_GEOGRAPHY").length === 2 && uses.filter((use) => use.role !== "NESTED_GEOGRAPHY")[0]!.reversed === uses.filter((use) => use.role !== "NESTED_GEOGRAPHY")[1]!.reversed).map(([boundaryId]) => map.boundaryLocators[boundaryId]!);
  const boundaryOwnerMismatches = boundaries.flatMap((boundary) => {
    const declared = [...map.boundaryMetadata[boundary.id]!.owners].map(canonicalBloomfallReachSlug).sort();
    const actual = [...new Set((boundaryUse.get(boundary.id) ?? []).map((use) => use.slug))].sort();
    return declared.length === actual.length && declared.every((owner, index) => owner === actual[index]) ? [] : [{ boundary: map.boundaryLocators[boundary.id]!, declared, actual }];
  });

  const coastOrder = ["coast.high-cliffs", "coast.magic-torn", "coast.unknown-southeast", "coast.peninsula"];
  const boundaryIdByLocator = new Map(Object.entries(map.boundaryLocators).map(([id, locator]) => [locator, id]));
  const outerRing = joinPieces([
    ...coastOrder.map((locator) => boundaryLines.get(boundaryIdByLocator.get(locator)!)!),
    reversePoints(boundaryLines.get(boundaryIdByLocator.get("coast.desert")!)!),
  ]);
  if (!pointsEqual(outerRing[0]!, outerRing.at(-1)!)) throw new Error("Canonical mainland coastline does not close.");
  const outerArea = Math.abs(atlasRingSignedArea(outerRing));
  const partitionArea = [...partition].reduce((sum, slug) => sum + geometryArea(derivedBySlug.get(slug)!), 0);
  const partitionAreaDelta = partitionArea - outerArea;

  const death = derivedBySlug.get("death-canyon")!;
  const rift = derivedBySlug.get("grand-rift")!;
  const redForest = derivedBySlug.get("the-red-forest")!;
  const deathRing = death.coordinates[0]!;
  const riftRing = rift.coordinates[0]!;
  const redForestRing = redForest.coordinates[0]!;
  const deathVerticesInsideGrandRift = deathRing.slice(0, -1).every((point) => pointInRing(point, riftRing) === "INSIDE");
  const deathCrossesGrandRift = ringsCross(deathRing, riftRing);
  const deathOverlapsRedForest = ringsCross(deathRing, redForestRing) || deathRing.slice(0, -1).some((point) => pointInRing(point, redForestRing) !== "OUTSIDE") || redForestRing.slice(0, -1).some((point) => pointInRing(point, deathRing) !== "OUTSIDE");

  const regionResults = map.dataset.areas.map((area) => {
    const metadata = map.areaMetadata[area.id]!;
    const boundaryIds = area.rings.flatMap((ring) => ring.boundaries.map((reference) => reference.boundaryId));
    const neighbors = new Set<string>();
    for (const boundaryId of boundaryIds) for (const use of boundaryUse.get(boundaryId) ?? []) if (use.areaId !== area.id) neighbors.add(use.slug);
    if (metadata.parentEntrySlug) neighbors.add(metadata.parentEntrySlug);
    const semanticMix = [...new Set(boundaryIds.map((id) => map.boundaryMetadata[id]!.semantic))].sort();
    const confidence = [...new Set(boundaryIds.map((id) => map.boundaryMetadata[id]!.confidence))].sort();
    return {
      areaId: area.id,
      entrySlug: canonicalBloomfallReachSlug(metadata.entrySlug),
      title: metadata.entrySlug === bloomfallReachCanon.formerDevelopmentPlaceholder.slug ? bloomfallReachCanon.title : metadata.title,
      role: metadata.role,
      approval: metadata.approval,
      parentEntrySlug: metadata.parentEntrySlug ? canonicalBloomfallReachSlug(metadata.parentEntrySlug) : null,
      shellCount: area.rings.filter((ring) => ring.role === "SHELL").length,
      holes: area.rings.filter((ring) => ring.role === "HOLE").length,
      neighbors: [...neighbors].sort(),
      boundaryIds,
      boundaryLocators: boundaryIds.map((id) => map.boundaryLocators[id]!),
      sharedBoundaryCount: boundaryIds.filter((id) => (boundaryUse.get(id) ?? []).length === 2).length,
      semanticMix,
      confidence,
    };
  }).sort((left, right) => left.entrySlug.localeCompare(right.entrySlug));

  const junctions = map.dataset.nodes.flatMap((node) => {
    const boundaryIds = boundaries.filter((boundary) => boundary.startNodeId === node.id || boundary.endNodeId === node.id).map((boundary) => boundary.id);
    const regions = [...new Set(boundaryIds.flatMap((id) => map.boundaryMetadata[id]!.owners).map(canonicalBloomfallReachSlug).filter((slug) => topLevel.has(slug)))].sort();
    return regions.length >= 3 ? [{ nodeId: node.id, locator: map.nodeLocators[node.id]!, coordinate: node.position, regions, boundaryIds, boundaryLocators: boundaryIds.map((id) => map.boundaryLocators[id]!).sort() }] : [];
  }).sort((left, right) => left.locator.localeCompare(right.locator));

  const validationFailures = validation.findings.filter((finding) => finding.severity === "ERROR" || finding.severity === "FATAL");
  const orphanNodes = [...nodeUse.entries()].filter(([, count]) => count === 0).map(([id]) => id);
  const unusedBoundaries = [...boundaryUse.entries()].filter(([, uses]) => uses.length === 0).map(([id]) => id);
  const ownerReviewBoundaries = Object.values(map.boundaryMetadata).filter((metadata) => metadata.confidence === "OWNER_REVIEW_REQUIRED").map((metadata) => metadata.locator);
  const hardGates = {
    allAreasApproved: regionResults.every((region) => region.approval === "APPROVED_FOR_MIGRATION"),
    grandLakeShell: regionResults.find((region) => region.entrySlug === "grand-lake")?.shellCount === 1,
    highCliffsShell: regionResults.find((region) => region.entrySlug === "high-cliffs")?.shellCount === 1,
    allTopLevelShells: atlasTopLevelRegionSlugs.every((slug) => regionResults.find((region) => region.entrySlug === slug)?.shellCount === 1),
    deathCanyonShell: regionResults.find((region) => region.entrySlug === "death-canyon")?.shellCount === 1,
    deathCanyonContained: deathVerticesInsideGrandRift && !deathCrossesGrandRift && !deathOverlapsRedForest,
    sharedBoundariesReused: oneSidedTopLevelInternalBoundaries.length === 0 && sharedDirectionFailures.length === 0 && boundaryOwnerMismatches.length === 0,
    multiRegionJunctionsExact: junctions.length === 9 && accidentalDuplicateNodes.length === 0,
    partitionExact: partitionAreaDelta === 0,
    noUnintendedCrossings: unintendedCrossings.length === 0,
    noOrphans: orphanNodes.length === 0,
    noUnusedBoundaries: unusedBoundaries.length === 0,
    noInvalidRings: validationFailures.length === 0,
    noDuplicateEditableBorders: duplicateEditableBorders.length === 0,
    noOwnerReviewEdges: ownerReviewBoundaries.length === 0,
  };
  return {
    mapSlug: map.mapSlug,
    tracedAreas: map.dataset.areas.length,
    topLevelRegions: atlasTopLevelRegionSlugs.length,
    nestedRegions: regionResults.filter((region) => region.role === "NESTED_GEOGRAPHY").length,
    majorWaterAreas: regionResults.filter((region) => region.role === "MAJOR_WATER").length,
    topologyNodes: map.dataset.nodes.length,
    boundaries: map.dataset.boundaries.length,
    areaRings: map.dataset.areas.reduce((sum, area) => sum + area.rings.length, 0),
    orderedBoundaryReferences: map.dataset.areas.flatMap((area) => area.rings).reduce((sum, ring) => sum + ring.boundaries.length, 0),
    sharedBoundaries: [...boundaryUse.values()].filter((uses) => uses.length === 2).length,
    internalBoundariesConsumedByTwoAreas: boundaries.filter((boundary) => boundary.kind === "INTERNAL_BORDER" && (boundaryUse.get(boundary.id) ?? []).length === 2).length,
    sharedWaterBoundariesConsumedByTwoAreas: boundaries.filter((boundary) => boundary.kind === "WATER_BOUNDARY" && (boundaryUse.get(boundary.id) ?? []).length === 2).length,
    coastBoundaries: boundaries.filter((boundary) => boundary.kind === "COAST").length,
    nestedBoundaries: boundaries.filter((boundary) => (boundaryUse.get(boundary.id) ?? []).every((use) => use.role === "NESTED_GEOGRAPHY")).length,
    shells: map.dataset.areas.flatMap((area) => area.rings).filter((ring) => ring.role === "SHELL").length,
    holes: map.dataset.areas.flatMap((area) => area.rings).filter((ring) => ring.role === "HOLE").length,
    components: map.dataset.areas.reduce((count, area) => count + new Set(area.rings.map((ring) => ring.componentIndex)).size, 0),
    orphanNodes,
    unusedBoundaries,
    accidentalDuplicateNodes,
    oneSidedTopLevelInternalBoundaries,
    sharedDirectionFailures,
    boundaryOwnerMismatches,
    duplicateEditableBorders,
    unintendedCrossings,
    ownerReviewBoundaries,
    partition: { outerArea, assignedArea: partitionArea, areaDelta: partitionAreaDelta, overlaps: partitionAreaDelta === 0 && unintendedCrossings.length === 0 ? 0 : null, gaps: partitionAreaDelta === 0 && unintendedCrossings.length === 0 ? 0 : null },
    deathCanyon: { ringPoints: deathRing.length, everyVertexInsideGrandRift: deathVerticesInsideGrandRift, crossesGrandRift: deathCrossesGrandRift, overlapsRedForest: deathOverlapsRedForest, parent: "grand-rift", valid: deathVerticesInsideGrandRift && !deathCrossesGrandRift && !deathOverlapsRedForest },
    junctions,
    regionResults,
    validationFailures,
    hardGates,
    topologyLocked: Object.values(hardGates).every(Boolean),
    derivedAreas: validation.value ?? [] as readonly AtlasDerivedTopologyArea[],
  };
}

function ringCentroid(ring: readonly AtlasNumericPoint[]) {
  let twiceArea = 0;
  let x = 0;
  let y = 0;
  for (let index = 1; index < ring.length; index += 1) {
    const from = ring[index - 1]!;
    const to = ring[index]!;
    const cross = from[0] * to[1] - to[0] * from[1];
    twiceArea += cross;
    x += (from[0] + to[0]) * cross;
    y += (from[1] + to[1]) * cross;
  }
  const area = twiceArea / 2;
  return area === 0 ? [0, 0] as const : [Math.round(x / (6 * area)), Math.round(y / (6 * area))] as const;
}

function svgLine(points: readonly AtlasNumericPoint[]) {
  return points.map((point, index) => `${index === 0 ? "M" : "L"}${point[0]} ${point[1]}`).join(" ");
}

function svgGeometry(geometry: AtlasPolygonGeometry) {
  return geometry.coordinates.map((ring) => `${svgLine(ring)} Z`).join(" ");
}

function escapeHtml(value: unknown) {
  return String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}

export function buildAtlasCanonicalDerivedGeometry(trace: AtlasCanonicalTopologyTrace) {
  const analysis = analyzeAtlasCanonicalTopology(trace);
  const map = trace.maps[0];
  return {
    contract: "martino-atlas-v2-derived-area-geometry",
    contractVersion: 1,
    sourceContract: trace.contract,
    sourceVersion: trace.contractVersion,
    mapSlug: map.mapSlug,
    dimensions: map.dimensions,
    editableSource: false,
    features: analysis.derivedAreas.map((area) => {
      const metadata = map.areaMetadata[area.areaId]!;
      const region = analysis.regionResults.find((candidate) => candidate.areaId === area.areaId)!;
      const geometry = area.geometry as AtlasPolygonGeometry;
      return { type: "Feature", id: area.areaId, properties: { entrySlug: metadata.entrySlug, title: metadata.title, role: metadata.role, approval: metadata.approval, parentEntrySlug: metadata.parentEntrySlug, neighbors: region.neighbors, boundaryIds: region.boundaryIds, labelAnchor: ringCentroid(geometry.coordinates[0]!) }, geometry };
    }),
    validation: { topologyLocked: analysis.topologyLocked, hardGates: analysis.hardGates, partition: analysis.partition, deathCanyon: analysis.deathCanyon },
  };
}

export function buildAtlasCanonicalReviewSvg(trace: AtlasCanonicalTopologyTrace) {
  const analysis = analyzeAtlasCanonicalTopology(trace);
  const map = trace.maps[0];
  const derived = new Map(analysis.derivedAreas.map((area) => [area.areaId, area.geometry as AtlasPolygonGeometry]));
  const areas = analysis.regionResults.map((region) => `<path class="area ${region.role === "NESTED_GEOGRAPHY" ? "nested" : region.role === "MAJOR_WATER" ? "water" : "land"}" data-area="${escapeHtml(region.entrySlug)}" d="${svgGeometry(derived.get(region.areaId)!)}"><title>${escapeHtml(region.title)} — ${region.approval}</title></path>`).join("\n");
  const boundaries = map.dataset.boundaries.map((boundary) => {
    const metadata = map.boundaryMetadata[boundary.id]!;
    return `<path class="boundary ${metadata.semantic.toLowerCase().replaceAll("_", "-")}" data-boundary-id="${boundary.id}" data-owners="${escapeHtml(metadata.owners.join(" "))}" d="${svgLine(topologyLine(trace, boundary.id))}"><title>${escapeHtml(metadata.locator)} — ${metadata.semantic} — ${metadata.confidence}</title></path>`;
  }).join("\n");
  const nodes = map.dataset.nodes.map((node) => `<circle class="node" cx="${node.position[0]}" cy="${node.position[1]}" r="180"><title>${escapeHtml(map.nodeLocators[node.id])} — ${node.id}</title></circle>`).join("\n");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1536" height="1024" viewBox="0 0 100000 66667" fill="none">
<style>.area{fill-opacity:.025;stroke:none}.area.land{fill:#e8d8b0}.area.water{fill:#48b9df;fill-opacity:.12}.area.nested{fill:#b9ff69;fill-opacity:.08;stroke:#d7ff96;stroke-width:1.5;stroke-dasharray:8 5;vector-effect:non-scaling-stroke}.boundary{fill:none;stroke:#a59b8b;stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round;vector-effect:non-scaling-stroke}.boundary.water-boundary{stroke:#69c9e8}.boundary.coastline{stroke:#d8c9aa}.node{fill:#fff;stroke:#171612;stroke-width:1;vector-effect:non-scaling-stroke}</style>
<g id="area-shells">${areas}</g>
<g id="canonical-boundaries">${boundaries}</g>
<g id="topology-nodes">${nodes}</g>
</svg>`;
}

type AtlasV1ReviewGeometry = { readonly records: readonly { readonly mapSlug: string; readonly entrySlug: string; readonly geometry: unknown }[] };

export function buildAtlasCanonicalReviewHtml(trace: AtlasCanonicalTopologyTrace, v1Manifest: AtlasV1ReviewGeometry) {
  const analysis = analyzeAtlasCanonicalTopology(trace);
  const map = trace.maps[0];
  const derived = new Map(analysis.derivedAreas.map((area) => [area.areaId, area.geometry as AtlasPolygonGeometry]));
  const v1 = v1Manifest.records.filter((record) => record.mapSlug === map.mapSlug).flatMap((record) => {
    const geometry = record.geometry as { type?: string; coordinates?: unknown };
    if (geometry.type !== "POLYGON" || !Array.isArray(geometry.coordinates)) return [];
    return (geometry.coordinates as Array<Array<[number, number]>>).map((ring) => `<path class="v1-geometry" d="${svgLine(ring)} Z"><title>V1 ${escapeHtml(record.entrySlug)}</title></path>`);
  }).join("\n");
  const areaOutlines = analysis.regionResults.map((region) => `<path class="area-outline ${region.role === "NESTED_GEOGRAPHY" ? "nested-area" : region.role === "MAJOR_WATER" ? "water-area" : "land-area"}" data-area-outline="${escapeHtml(region.entrySlug)}" d="${svgGeometry(derived.get(region.areaId)!)}"/>`).join("\n");
  const boundaries = map.dataset.boundaries.map((boundary) => {
    const metadata = map.boundaryMetadata[boundary.id]!;
    const points = topologyLine(trace, boundary.id);
    const midpoint = points[Math.floor(points.length / 2)]!;
    return `<g class="boundary-group" data-boundary="${boundary.id}" data-owners="${escapeHtml(metadata.owners.join(" "))}"><path class="canonical-boundary semantic-${metadata.semantic.toLowerCase().replaceAll("_", "-")}" d="${svgLine(points)}"><title>${escapeHtml(metadata.locator)} — ${metadata.semantic} — ${metadata.confidence}</title></path><text class="boundary-id" x="${midpoint[0]}" y="${midpoint[1]}">${escapeHtml(metadata.locator)} · ${boundary.id.slice(0, 8)}</text><text class="boundary-semantic" x="${midpoint[0]}" y="${midpoint[1] + 720}">${metadata.semantic} · ${metadata.confidence}</text></g>`;
  }).join("\n");
  const nodes = map.dataset.nodes.map((node) => `<g class="node-group"><circle class="topology-node" cx="${node.position[0]}" cy="${node.position[1]}" r="260"><title>${escapeHtml(map.nodeLocators[node.id])} — ${node.id}</title></circle><text class="node-label" x="${node.position[0] + 400}" y="${node.position[1] - 400}">${escapeHtml(map.nodeLocators[node.id])}</text></g>`).join("\n");
  const labels = analysis.regionResults.map((region) => {
    const geometry = derived.get(region.areaId)!;
    const [x, y] = ringCentroid(geometry.coordinates[0]!);
    return `<text class="region-label ${region.role === "NESTED_GEOGRAPHY" ? "nested-label" : ""}" data-region-label="${escapeHtml(region.entrySlug)}" x="${x}" y="${y}">${escapeHtml(region.title)}</text>`;
  }).join("\n");
  const hits = analysis.regionResults.map((region) => `<path class="region-hit ${region.role === "NESTED_GEOGRAPHY" ? "nested-hit" : ""}" tabindex="0" role="button" aria-label="Inspect ${escapeHtml(region.title)}" data-area="${escapeHtml(region.entrySlug)}" d="${svgGeometry(derived.get(region.areaId)!)}"/>`).join("\n");
  const reviewData = Object.fromEntries(analysis.regionResults.map((region) => [region.entrySlug, { ...region, children: analysis.regionResults.filter((candidate) => candidate.parentEntrySlug === region.entrySlug).map((candidate) => candidate.entrySlug) }]));
  const safeData = JSON.stringify(reviewData).replaceAll("<", "\\u003c");
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Martino Atlas 2.0 Canonical Topology Review</title><style>
:root{color-scheme:dark;background:#0d100e;color:#eee5d0;font-family:Inter,ui-sans-serif,system-ui,sans-serif}*{box-sizing:border-box}body{margin:0;padding:20px;max-width:1800px;margin-inline:auto}h1{margin:.2rem 0}.lede{color:#b9b09e;margin:.3rem 0 1rem}.toolbar{display:flex;flex-wrap:wrap;gap:8px 16px;padding:12px 14px;background:#181c18;border:1px solid #4c4a40;border-radius:10px}.toolbar label{font-size:13px;font-weight:700}.workspace{display:grid;grid-template-columns:minmax(0,1fr) 320px;gap:16px;margin-top:16px}.map{position:relative;background:#050706;border:1px solid #6b6556;box-shadow:0 16px 55px #0009;overflow:hidden}.map svg{display:block;width:100%;height:auto}.raster{opacity:1}.v1-geometry{fill:#ff3f6822;stroke:#ff5475;stroke-width:1.5;vector-effect:non-scaling-stroke}.area-outline{fill:#d6c9aa08;stroke:none;pointer-events:none}.area-outline.selected{fill:#ffe27d1c;stroke:#ffe27d;stroke-width:3;vector-effect:non-scaling-stroke}.area-outline.nested-area{fill:#a8ff5d10}.canonical-boundary{fill:none;stroke:#aaa08e;stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round;vector-effect:non-scaling-stroke;pointer-events:none}.semantic-water-boundary{stroke:#71d0ee}.semantic-coastline{stroke:#d9c8a8}.boundary-group.selected .canonical-boundary{stroke:#ffe26e;stroke-width:4}.topology-node{fill:#f8f2df;stroke:#151510;stroke-width:1;vector-effect:non-scaling-stroke}.boundary-id,.boundary-semantic,.node-label,.region-label{font-weight:800;paint-order:stroke;stroke:#111;stroke-width:220;fill:#fff;pointer-events:none}.boundary-id,.boundary-semantic,.node-label{font-size:650px}.boundary-semantic{fill:#9ee8ff}.region-label{font-size:1100px;text-anchor:middle}.nested-label{fill:#d6ff9f;font-size:850px}.region-hit{fill:#fff;fill-opacity:.001;stroke:none;pointer-events:fill;cursor:pointer}.region-hit:focus{outline:none}.nested-hit{stroke:#d6ff9f;stroke-width:2;stroke-dasharray:8 5;vector-effect:non-scaling-stroke}.panel{background:#171b18;border:1px solid #4c4a40;border-radius:10px;padding:16px;min-height:300px}.panel h2{margin-top:0}.panel dl{display:grid;grid-template-columns:90px 1fr;gap:7px 9px;font-size:13px}.panel dt{color:#a9a08e;font-weight:800}.panel dd{margin:0;overflow-wrap:anywhere}.status{display:inline-block;padding:3px 7px;border:1px solid #69836b;color:#bde9be;border-radius:999px;font-size:11px;font-weight:900}.hint{color:#a9a08e;font-size:13px}.hide-raster .raster,.hide-v1 .v1-layer,.hide-v2 .v2-layer,.hide-nodes .nodes-layer,.hide-boundary-ids .boundary-id,.hide-semantics .boundary-semantic,.hide-nested .nested-area,.hide-nested .nested-hit,.hide-nested .nested-label,.hide-labels .labels-layer{display:none}@media(max-width:950px){.workspace{grid-template-columns:1fr}.panel{min-height:0}}
</style></head><body><header><h1>Martino Atlas 2.0 — Canonical Topology Review</h1><p class="lede">Frozen raster + deterministic shared topology. Development-only; no API or active database access.</p><div class="toolbar">
<label><input data-toggle="raster" type="checkbox" checked> Raster</label><label><input data-toggle="v1" type="checkbox"> V1 geometry</label><label><input data-toggle="v2" type="checkbox" checked> Canonical V2 topology</label><label><input data-toggle="nodes" type="checkbox"> Topology nodes</label><label><input data-toggle="boundary-ids" type="checkbox"> Boundary IDs</label><label><input data-toggle="semantics" type="checkbox"> Boundary semantics</label><label><input data-toggle="nested" type="checkbox" checked> Death Canyon nested area</label><label><input data-toggle="labels" type="checkbox" checked> Region labels</label>
</div></header><main class="workspace"><div class="map"><svg viewBox="0 0 100000 66667" role="img" aria-label="Martino world canonical topology review"><image class="raster" href="../../apps/web/private/codex-art/maps/candidates/martino-world-map-v2-clean-production-candidate.png" x="0" y="0" width="100000" height="66667" preserveAspectRatio="none"/><g class="v1-layer">${v1}</g><g class="v2-layer"><g class="areas-layer">${areaOutlines}</g><g class="boundaries-layer">${boundaries}</g><g class="nodes-layer">${nodes}</g><g class="labels-layer">${labels}</g><g class="hits-layer">${hits}</g></g></svg></div><aside class="panel" aria-live="polite"><h2 id="panel-title">Select a region</h2><p id="panel-status" class="hint">Hover or click an exact vector area. Click selection persists in the URL hash.</p><dl id="panel-data"></dl></aside></main><script>
const regions=${safeData};let locked=null;const body=document.body;const title=document.querySelector('#panel-title');const status=document.querySelector('#panel-status');const data=document.querySelector('#panel-data');
function render(slug){const region=regions[slug];document.querySelectorAll('.area-outline').forEach(el=>el.classList.toggle('selected',el.dataset.areaOutline===slug));document.querySelectorAll('.boundary-group').forEach(el=>el.classList.toggle('selected',(el.dataset.owners||'').split(' ').includes(slug)));if(!region){title.textContent='Select a region';status.textContent='Hover or click an exact vector area. Click selection persists in the URL hash.';data.innerHTML='';return}title.textContent=region.title;status.innerHTML='<span class="status">'+region.approval+'</span>';const rows=[['Role',region.role],['Parent',region.parentEntrySlug||'—'],['Children',region.children.length?region.children.join(', '):'—'],['Neighbors',region.neighbors.join(', ')||'—'],['Shells',String(region.shellCount)],['Holes',String(region.holes)],['Shared edges',String(region.sharedBoundaryCount)],['Semantics',region.semanticMix.join(', ')],['Confidence',region.confidence.join(', ')],['Boundary IDs',region.boundaryIds.join(', ')]];data.innerHTML=rows.map(([k,v])=>'<dt>'+k+'</dt><dd>'+v+'</dd>').join('')}
document.querySelectorAll('.region-hit').forEach(el=>{const slug=el.dataset.area;el.addEventListener('mouseenter',()=>{if(!locked)render(slug)});el.addEventListener('mouseleave',()=>{if(!locked)render(null)});el.addEventListener('focus',()=>{if(!locked)render(slug)});el.addEventListener('click',()=>{locked=slug;location.hash='region='+encodeURIComponent(slug);render(slug)});el.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();el.click()}})});
document.querySelectorAll('[data-toggle]').forEach(input=>{const key=input.dataset.toggle;const apply=()=>body.classList.toggle('hide-'+key,!input.checked);input.addEventListener('change',apply);apply()});
const match=location.hash.match(/^#region=(.+)$/);if(match){const slug=decodeURIComponent(match[1]);if(regions[slug]){locked=slug;render(slug)}}window.addEventListener('hashchange',()=>{if(!location.hash){locked=null;render(null)}});
</script></body></html>`;
}
