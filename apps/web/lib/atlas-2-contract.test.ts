import assert from "node:assert/strict";
import test from "node:test";
import {
  atlasCoordinateWidth,
  atlasGeometryLimits,
  atlasPointToOpenLayers,
  atlasPointToPixel,
  atlasSpatialGeometryMode,
  closeAtlasRingForAnalysis,
  classifyLegacyAtlasConnectionWording,
  deriveAtlasCoordinateDimensions,
  findAtlasReciprocalCandidates,
  openLayersPointToAtlas,
  pixelPointToAtlas,
  resolveAtlasConnectionEndpoint,
  validateAtlasBoundedMetadata,
  validateAtlasMapConnectionPath,
  validateAtlasFixedCoordinate,
  validateAtlasLineString,
  validateAtlasMultiPolygon,
  validateAtlasPoint,
  validateAtlasPolygon,
  validateAtlasRing,
  validateAtlasTopology,
  validateAtlasWorldConnection,
  type AtlasBoundary,
  type AtlasCoordinateDimensions,
  type AtlasPoint,
  type AtlasTopologyArea,
  type AtlasTopologyNode,
} from "@habitat/shared";

const dimensions: AtlasCoordinateDimensions = { width: atlasCoordinateWidth, height: 66_667 };
const p = (x: number, y: number) => [x, y] as unknown as AtlasPoint;

test("fixed-point coordinates derive the canonical extent and reject unsafe values", () => {
  assert.deepEqual(deriveAtlasCoordinateDimensions({ width: 1536, height: 1024 }), { ok: true, value: dimensions });
  assert.equal(validateAtlasFixedCoordinate(10.5, 100).ok, false);
  assert.equal(validateAtlasFixedCoordinate(Number.POSITIVE_INFINITY, 100).ok, false);
  assert.equal(validateAtlasFixedCoordinate(-1, 100).ok, false);
  assert.equal(validateAtlasFixedCoordinate(101, 100).ok, false);
  assert.equal(validateAtlasPoint([100_000, 66_667], dimensions).ok, true);
});

test("pixel and OpenLayers conversions are centralized and deterministic", () => {
  const pixel = atlasPointToPixel([50_000, 33_333], dimensions, { width: 1536, height: 1024 });
  assert.deepEqual(pixel, [768, 511.9923200383998]);
  assert.deepEqual(pixelPointToAtlas(pixel, { width: 1536, height: 1024 }, dimensions), [50_000, 33_333]);
  const openLayers = atlasPointToOpenLayers([12_345, 54_321], dimensions);
  assert.deepEqual(openLayers, [12_345, 12_346]);
  assert.deepEqual(openLayersPointToAtlas(openLayers, dimensions), [12_345, 54_321]);
});

test("line validation covers shape, duplicate runs, integer coordinates, and bounds", () => {
  assert.equal(validateAtlasLineString([[0, 0], [10, 10]], dimensions).valid, true);
  assert.equal(validateAtlasLineString([[0, 0]], dimensions).valid, false);
  assert.ok(validateAtlasLineString([[0, 0], [0, 0]], dimensions).findings.some((finding) => finding.code === "GEOMETRY_DUPLICATE_RUN"));
  assert.ok(validateAtlasLineString([[0, 0], [10.5, 10]], dimensions).findings.some((finding) => finding.code === "COORDINATE_NOT_INTEGER"));
  assert.ok(validateAtlasLineString([[0, 0], [100_001, 10]], dimensions).findings.some((finding) => finding.code === "COORDINATE_OUT_OF_BOUNDS"));
});

test("ring validation requires explicit closure, distinct vertices, and no self-intersection", () => {
  const valid = [[0, 0], [100, 0], [100, 100], [0, 100], [0, 0]];
  assert.equal(validateAtlasRing(valid, dimensions, { orientation: "CLOCKWISE" }).valid, true);
  assert.ok(validateAtlasRing(valid.slice(0, -1), dimensions).findings.some((finding) => finding.code === "RING_NOT_CLOSED"));
  assert.ok(validateAtlasRing([[0, 0], [10, 0], [10, 0], [0, 0]], dimensions).findings.some((finding) => finding.code === "GEOMETRY_DUPLICATE_RUN"));
  assert.ok(validateAtlasRing([[0, 0], [10, 0], [0, 0], [0, 0]], dimensions).findings.some((finding) => finding.code === "RING_DISTINCT_VERTICES"));
  assert.ok(validateAtlasRing([[0, 0], [100, 100], [0, 100], [100, 0], [0, 0]], dimensions).findings.some((finding) => finding.code === "RING_SELF_INTERSECTION"));
});

test("analysis-only ring closure is non-mutating and reports normalization", () => {
  const source = [[0, 0], [10, 0], [10, 10]] as const;
  const result = closeAtlasRingForAnalysis(source);
  assert.equal(result.normalized, true);
  assert.equal(source.length, 3);
  assert.deepEqual(result.ring, [[0, 0], [10, 0], [10, 10], [0, 0]]);
});

test("polygon and multipolygon validation enforce shell/hole containment and limits", () => {
  const shell = [[0, 0], [100, 0], [100, 100], [0, 100], [0, 0]];
  const hole = [[20, 20], [20, 40], [40, 40], [40, 20], [20, 20]];
  assert.equal(validateAtlasPolygon([shell, hole], dimensions).valid, true);
  const outsideHole = [[120, 20], [120, 40], [140, 40], [140, 20], [120, 20]];
  assert.ok(validateAtlasPolygon([shell, outsideHole], dimensions).findings.some((finding) => finding.code === "POLYGON_HOLE_OUTSIDE"));
  assert.equal(validateAtlasMultiPolygon([[shell], [[[200, 0], [300, 0], [300, 100], [200, 100], [200, 0]]]], dimensions).valid, true);
  const oversized = Array.from({ length: atlasGeometryLimits.maxRingVertices + 1 }, (_, index) => [index % 100, Math.floor(index / 100)]);
  assert.ok(validateAtlasRing(oversized, dimensions).findings.some((finding) => finding.code === "GEOMETRY_VERTEX_LIMIT"));
});

function sharedTopologyFixture() {
  const nodes: AtlasTopologyNode[] = [
    { id: "n00", mapSlug: "world", position: p(0, 0), version: 1 },
    { id: "n10", mapSlug: "world", position: p(10, 0), version: 1 },
    { id: "n20", mapSlug: "world", position: p(20, 0), version: 1 },
    { id: "n01", mapSlug: "world", position: p(0, 10), version: 1 },
    { id: "n11", mapSlug: "world", position: p(10, 10), version: 1 },
    { id: "n21", mapSlug: "world", position: p(20, 10), version: 1 },
  ];
  const boundary = (id: string, startNodeId: string, endNodeId: string): AtlasBoundary => ({ id, mapSlug: "world", startNodeId, endNodeId, interiorVertices: [], kind: id === "shared" ? "INTERNAL_BORDER" : "OPEN_BOUNDARY", version: 1 });
  const boundaries = [
    boundary("left-top", "n00", "n10"), boundary("shared", "n10", "n11"), boundary("left-bottom", "n11", "n01"), boundary("left-edge", "n01", "n00"),
    boundary("right-top", "n10", "n20"), boundary("right-edge", "n20", "n21"), boundary("right-bottom", "n21", "n11"),
  ];
  const area = (id: string, references: Array<[string, boolean]>): AtlasTopologyArea => ({
    id, mapSlug: "world", layerKind: "BASE_GEOGRAPHY", version: 1,
    rings: [{ id: `${id}-shell`, componentIndex: 0, role: "SHELL", boundaries: references.map(([boundaryId, reversed], sequence) => ({ boundaryId, reversed, sequence })) }],
  });
  const areas = [
    area("left", [["left-top", false], ["shared", false], ["left-bottom", false], ["left-edge", false]]),
    area("right", [["right-top", false], ["right-edge", false], ["right-bottom", false], ["shared", true]]),
  ];
  return { nodes, boundaries, areas };
}

test("two topology areas consume one shared boundary in opposite directions", () => {
  const fixture = sharedTopologyFixture();
  const result = validateAtlasTopology(fixture, dimensions);
  assert.equal(result.valid, true);
  assert.equal(result.value?.length, 2);
  assert.equal(fixture.areas[0]!.rings[0]!.boundaries[1]!.boundaryId, "shared");
  assert.equal(fixture.areas[1]!.rings[0]!.boundaries[3]!.boundaryId, "shared");
  assert.equal(fixture.areas[1]!.rings[0]!.boundaries[3]!.reversed, true);
});

test("topology validation catches missing references, endpoint/map mismatch, bad sequence, invalid reversal, and disconnected chains", () => {
  const missing = sharedTopologyFixture();
  missing.areas[0] = { ...missing.areas[0]!, rings: [{ ...missing.areas[0]!.rings[0]!, boundaries: missing.areas[0]!.rings[0]!.boundaries.map((reference, index) => index === 0 ? { boundaryId: "missing", sequence: 0, reversed: false } : reference) }] };
  assert.ok(validateAtlasTopology(missing, dimensions).findings.some((finding) => finding.code === "TOPOLOGY_MISSING_BOUNDARY"));

  const mismatch = sharedTopologyFixture();
  mismatch.nodes[0] = { ...mismatch.nodes[0]!, mapSlug: "other" };
  assert.ok(validateAtlasTopology(mismatch, dimensions).findings.some((finding) => finding.code === "TOPOLOGY_MAP_MISMATCH"));

  const endpoint = sharedTopologyFixture();
  endpoint.boundaries[0] = { ...endpoint.boundaries[0]!, endNodeId: endpoint.boundaries[0]!.startNodeId };
  assert.ok(validateAtlasTopology(endpoint, dimensions).findings.some((finding) => finding.code === "BOUNDARY_ENDPOINT_MATCH"));

  const sequence = sharedTopologyFixture();
  sequence.areas[0] = { ...sequence.areas[0]!, rings: [{ ...sequence.areas[0]!.rings[0]!, boundaries: sequence.areas[0]!.rings[0]!.boundaries.map((reference, index) => index === 1 ? { ...reference, sequence: 4 } : reference) }] };
  assert.ok(validateAtlasTopology(sequence, dimensions).findings.some((finding) => finding.code === "TOPOLOGY_SEQUENCE"));

  const reversal = sharedTopologyFixture();
  reversal.areas[0] = { ...reversal.areas[0]!, rings: [{ ...reversal.areas[0]!.rings[0]!, boundaries: reversal.areas[0]!.rings[0]!.boundaries.map((reference, index) => index === 0 ? { ...reference, reversed: "yes" as unknown as boolean } : reference) }] };
  assert.ok(validateAtlasTopology(reversal, dimensions).findings.some((finding) => finding.code === "TOPOLOGY_REVERSAL"));

  const disconnected = sharedTopologyFixture();
  disconnected.areas[0] = { ...disconnected.areas[0]!, rings: [{ ...disconnected.areas[0]!.rings[0]!, boundaries: disconnected.areas[0]!.rings[0]!.boundaries.map((reference, index) => index === 1 ? { boundaryId: "right-edge", sequence: 1, reversed: false } : reference) }] };
  assert.ok(validateAtlasTopology(disconnected, dimensions).findings.some((finding) => finding.code === "TOPOLOGY_DISCONNECTED_CHAIN"));
});

test("topology assembly supports a shell with a counterclockwise hole", () => {
  const nodeValues = [["a", 0, 0], ["b", 10, 0], ["c", 10, 10], ["d", 0, 10], ["e", 2, 2], ["f", 2, 4], ["g", 4, 4], ["h", 4, 2]] as const;
  const nodes: AtlasTopologyNode[] = nodeValues.map(([id, x, y]) => ({ id, mapSlug: "world", position: p(x, y), version: 1 }));
  const edgeValues = [["ab", "a", "b"], ["bc", "b", "c"], ["cd", "c", "d"], ["da", "d", "a"], ["ef", "e", "f"], ["fg", "f", "g"], ["gh", "g", "h"], ["he", "h", "e"]] as const;
  const boundaries: AtlasBoundary[] = edgeValues.map(([id, startNodeId, endNodeId]) => ({ id, mapSlug: "world", startNodeId, endNodeId, interiorVertices: [], kind: "OPEN_BOUNDARY", version: 1 }));
  const references = (ids: readonly string[]) => ids.map((boundaryId, sequence) => ({ boundaryId, sequence, reversed: false }));
  const areas: AtlasTopologyArea[] = [{ id: "enclave", mapSlug: "world", layerKind: "BASE_GEOGRAPHY", version: 1, rings: [
    { id: "shell", componentIndex: 0, role: "SHELL", boundaries: references(["ab", "bc", "cd", "da"]) },
    { id: "hole", componentIndex: 0, role: "HOLE", boundaries: references(["ef", "fg", "gh", "he"]) },
  ] }];
  const result = validateAtlasTopology({ nodes, boundaries, areas }, dimensions);
  assert.equal(result.valid, true);
  assert.equal(result.value?.[0]?.geometry.type, "POLYGON");
  assert.equal(result.value?.[0]?.geometry.coordinates.length, 2);
});

test("analytical layers remain independent from shared base topology", () => {
  assert.equal(atlasSpatialGeometryMode("BASE_GEOGRAPHY"), "SHARED_TOPOLOGY");
  assert.equal(atlasSpatialGeometryMode("FACTION_INFLUENCE"), "INDEPENDENT_OVERLAY");
  const fixture = sharedTopologyFixture();
  fixture.areas[0] = { ...fixture.areas[0]!, layerKind: "CORRUPTION" };
  assert.ok(validateAtlasTopology(fixture, dimensions).findings.some((finding) => finding.code === "TOPOLOGY_ANALYTICAL_LAYER"));
});

test("connection classification is conservative and preserves unknown wording for its caller", () => {
  assert.equal(classifyLegacyAtlasConnectionWording("road").type, "ROAD");
  assert.equal(classifyLegacyAtlasConnectionWording("quarry ravine trail").type, "TRAIL");
  assert.equal(classifyLegacyAtlasConnectionWording("great waterfalls").type, "RIVER_TRAVEL");
  assert.equal(classifyLegacyAtlasConnectionWording("skybridge and aerial transit").type, "AIR_ROUTE");
  const unknown = classifyLegacyAtlasConnectionWording("broken canyon shelves");
  assert.deepEqual(unknown, { type: "OTHER", ambiguous: true, reason: "Authored wording is preserved but does not safely map to a controlled transport type." });
});

test("connection endpoint and reciprocal analysis never consolidates rows", () => {
  const candidates = [{ id: "a", slug: "alpha", title: "Alpha", kind: "REGION", status: "CANON" }];
  assert.equal(resolveAtlasConnectionEndpoint("alpha", candidates).status, "RESOLVED");
  assert.equal(resolveAtlasConnectionEndpoint("Alpha", candidates).status, "RESOLVED");
  assert.equal(resolveAtlasConnectionEndpoint("missing", candidates).status, "UNRESOLVED");
  const reciprocal = findAtlasReciprocalCandidates([
    { locator: "a[0]", sourceSlug: "alpha", resolvedTargetSlug: "beta" },
    { locator: "b[0]", sourceSlug: "beta", resolvedTargetSlug: "alpha" },
  ]);
  assert.deepEqual(reciprocal.get("a[0]"), ["b[0]"]);
  assert.equal(reciprocal.size, 2);
});

test("connection metadata is finite and bounded", () => {
  assert.equal(validateAtlasBoundedMetadata({ note: "preserved", score: 1 }).valid, true);
  assert.equal(validateAtlasBoundedMetadata({ score: Number.NaN }).valid, false);
  assert.equal(validateAtlasBoundedMetadata({ note: "x".repeat(1_001) }).valid, false);
});

test("world connections and map paths validate controlled values and bounded geometry", () => {
  const connection = {
    id: "route-1", fromEntryId: "alpha", toEntryId: "beta", type: "ROAD", directionality: "FROM_TO",
    status: "OPEN", visibility: "DEFAULT", originalWording: "old coast road", editorialNotes: null,
    metadata: { legacyLocator: "alpha.meta.connections[0]" }, version: 1,
  };
  assert.equal(validateAtlasWorldConnection(connection).valid, true);
  assert.ok(validateAtlasWorldConnection({ ...connection, visibility: "DISCOVERED" }).findings.some((finding) => finding.code === "CONNECTION_VISIBILITY"));
  const path = { id: "path-1", connectionId: "route-1", mapSlug: "world", geometry: { type: "LINESTRING", coordinates: [[0, 0], [10, 10]] }, minZoom: 0, maxZoom: 4, priority: 1, version: 1 };
  assert.equal(validateAtlasMapConnectionPath(path, dimensions).valid, true);
  assert.ok(validateAtlasMapConnectionPath({ ...path, maxZoom: -1 }, dimensions).findings.some((finding) => finding.code === "CONNECTION_PATH_ZOOM"));
});
