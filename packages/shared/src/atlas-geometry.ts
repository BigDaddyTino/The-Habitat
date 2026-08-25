import type { AtlasCoordinateDimensions, AtlasNumericPoint, AtlasPoint } from "./atlas-coordinate";
import { validateAtlasPoint } from "./atlas-coordinate";
import { atlasFinding, atlasValidationResult, type AtlasValidationFinding, type AtlasValidationResult } from "./atlas-validation";

export const atlasGeometryLimits = {
  maxLineVertices: 4_096,
  maxRingVertices: 4_097,
  maxPolygonRings: 128,
  maxMultiPolygonComponents: 128,
  maxGeometryVertices: 50_000,
  maxExactAnalysisSegments: 5_000,
  maxDiagnosticExamples: 100,
} as const;

export type AtlasLineString = readonly AtlasPoint[];
export type AtlasMultiLineString = readonly AtlasLineString[];
export type AtlasRing = readonly AtlasPoint[];
export type AtlasPolygonCoordinates = readonly AtlasRing[];
export type AtlasMultiPolygonCoordinates = readonly AtlasPolygonCoordinates[];

export type AtlasLineGeometry = { readonly type: "LINESTRING"; readonly coordinates: AtlasLineString };
export type AtlasMultiLineGeometry = { readonly type: "MULTILINESTRING"; readonly coordinates: AtlasMultiLineString };
export type AtlasPolygonGeometry = { readonly type: "POLYGON"; readonly coordinates: AtlasPolygonCoordinates };
export type AtlasMultiPolygonGeometry = { readonly type: "MULTIPOLYGON"; readonly coordinates: AtlasMultiPolygonCoordinates };

export const atlasRingOrientations = ["CLOCKWISE", "COUNTERCLOCKWISE"] as const;
export type AtlasRingOrientation = (typeof atlasRingOrientations)[number];
export type AtlasRingOrientationRequirement = AtlasRingOrientation | "ANY";

export type AtlasRingValidationOptions = {
  readonly orientation?: AtlasRingOrientationRequirement;
  readonly path?: string;
};

function pointsEqual(left: AtlasNumericPoint, right: AtlasNumericPoint) {
  return left[0] === right[0] && left[1] === right[1];
}

function pointKey(point: AtlasNumericPoint) {
  return `${point[0]},${point[1]}`;
}

function segmentKey(from: AtlasNumericPoint, to: AtlasNumericPoint, directed: boolean) {
  const left = pointKey(from);
  const right = pointKey(to);
  return directed || left <= right ? `${left}>${right}` : `${right}>${left}`;
}

function cross(a: AtlasNumericPoint, b: AtlasNumericPoint, c: AtlasNumericPoint) {
  return (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
}

function pointOnSegment(point: AtlasNumericPoint, from: AtlasNumericPoint, to: AtlasNumericPoint) {
  return cross(from, to, point) === 0
    && point[0] >= Math.min(from[0], to[0])
    && point[0] <= Math.max(from[0], to[0])
    && point[1] >= Math.min(from[1], to[1])
    && point[1] <= Math.max(from[1], to[1]);
}

export type AtlasSegmentIntersection = "NONE" | "TOUCH" | "CROSS" | "OVERLAP";

export function classifyAtlasSegmentIntersection(a: AtlasNumericPoint, b: AtlasNumericPoint, c: AtlasNumericPoint, d: AtlasNumericPoint): AtlasSegmentIntersection {
  const abC = cross(a, b, c);
  const abD = cross(a, b, d);
  const cdA = cross(c, d, a);
  const cdB = cross(c, d, b);
  if (abC === 0 && abD === 0 && cdA === 0 && cdB === 0) {
    const useX = Math.abs(b[0] - a[0]) >= Math.abs(b[1] - a[1]);
    const [a1, a2, c1, c2] = useX ? [a[0], b[0], c[0], d[0]] : [a[1], b[1], c[1], d[1]];
    const start = Math.max(Math.min(a1, a2), Math.min(c1, c2));
    const end = Math.min(Math.max(a1, a2), Math.max(c1, c2));
    return start > end ? "NONE" : start === end ? "TOUCH" : "OVERLAP";
  }
  if ((abC === 0 && pointOnSegment(c, a, b)) || (abD === 0 && pointOnSegment(d, a, b)) || (cdA === 0 && pointOnSegment(a, c, d)) || (cdB === 0 && pointOnSegment(b, c, d))) return "TOUCH";
  return ((abC > 0 && abD < 0) || (abC < 0 && abD > 0)) && ((cdA > 0 && cdB < 0) || (cdA < 0 && cdB > 0)) ? "CROSS" : "NONE";
}

function validatePointList(value: unknown, dimensions: AtlasCoordinateDimensions, minimum: number, maximum: number, path: string) {
  const findings: AtlasValidationFinding[] = [];
  if (!Array.isArray(value)) return atlasValidationResult<readonly AtlasPoint[]>(null, [atlasFinding("ERROR", "GEOMETRY_SHAPE", path, "Expected an array of coordinate pairs.")]);
  if (value.length < minimum) findings.push(atlasFinding("ERROR", "GEOMETRY_TOO_FEW_VERTICES", path, `Expected at least ${minimum} vertices.`));
  if (value.length > maximum) findings.push(atlasFinding("ERROR", "GEOMETRY_VERTEX_LIMIT", path, `Geometry exceeds the ${maximum}-vertex limit.`));
  const points: AtlasPoint[] = [];
  for (const [index, candidate] of value.entries()) {
    const point = validateAtlasPoint(candidate, dimensions);
    if (!point.ok) findings.push(atlasFinding("ERROR", `COORDINATE_${point.issue}`, `${path}[${index}]`, "Coordinate must be a finite in-bounds integer pair."));
    else points.push(point.value);
  }
  const complete = points.length === value.length && value.length >= minimum && value.length <= maximum;
  return atlasValidationResult(complete ? points : null, findings);
}

function consecutiveDuplicateFindings(points: readonly AtlasPoint[], path: string, allowClosingDuplicate: boolean) {
  const findings: AtlasValidationFinding[] = [];
  for (let index = 1; index < points.length; index += 1) {
    if (!pointsEqual(points[index - 1]!, points[index]!)) continue;
    if (allowClosingDuplicate && index === points.length - 1 && pointsEqual(points[0]!, points[index]!)) continue;
    findings.push(atlasFinding("ERROR", "GEOMETRY_DUPLICATE_RUN", `${path}[${index}]`, "Consecutive duplicate vertices are not allowed."));
  }
  return findings;
}

export function validateAtlasLineString(value: unknown, dimensions: AtlasCoordinateDimensions, path = "line"): AtlasValidationResult<AtlasLineString> {
  const points = validatePointList(value, dimensions, 2, atlasGeometryLimits.maxLineVertices, path);
  if (!points.value) return points;
  const findings = [...points.findings, ...consecutiveDuplicateFindings(points.value, path, false)];
  return atlasValidationResult(points.value, findings);
}

export function validateAtlasMultiLineString(value: unknown, dimensions: AtlasCoordinateDimensions, path = "multiline"): AtlasValidationResult<AtlasMultiLineString> {
  if (!Array.isArray(value) || value.length === 0) return atlasValidationResult<AtlasMultiLineString>(null, [atlasFinding("ERROR", "MULTILINE_SHAPE", path, "A multiline requires at least one line component.")]);
  if (value.length > atlasGeometryLimits.maxMultiPolygonComponents) return atlasValidationResult<AtlasMultiLineString>(null, [atlasFinding("ERROR", "MULTILINE_COMPONENT_LIMIT", path, "Multiline component limit exceeded.")]);
  const findings: AtlasValidationFinding[] = [];
  const lines: AtlasLineString[] = [];
  let vertices = 0;
  for (const [index, candidate] of value.entries()) {
    const line = validateAtlasLineString(candidate, dimensions, `${path}[${index}]`);
    findings.push(...line.findings);
    if (line.value) { lines.push(line.value); vertices += line.value.length; }
  }
  if (vertices > atlasGeometryLimits.maxGeometryVertices) findings.push(atlasFinding("ERROR", "GEOMETRY_TOTAL_VERTEX_LIMIT", path, "Geometry total vertex limit exceeded."));
  return atlasValidationResult(lines.length === value.length ? lines : null, findings);
}

export function atlasRingSignedArea(ring: readonly AtlasNumericPoint[]) {
  let twiceArea = 0;
  for (let index = 1; index < ring.length; index += 1) {
    const from = ring[index - 1]!;
    const to = ring[index]!;
    twiceArea += from[0] * to[1] - to[0] * from[1];
  }
  return twiceArea / 2;
}

export function atlasRingOrientation(ring: readonly AtlasNumericPoint[]): AtlasRingOrientation | null {
  const area = atlasRingSignedArea(ring);
  if (area === 0) return null;
  // Canonical Atlas coordinates are top-left/y-down: positive screen-space
  // signed area is visually clockwise.
  return area > 0 ? "CLOCKWISE" : "COUNTERCLOCKWISE";
}

function ringSelfIntersects(ring: readonly AtlasPoint[]) {
  const lastSegment = ring.length - 2;
  for (let left = 0; left <= lastSegment; left += 1) {
    for (let right = left + 1; right <= lastSegment; right += 1) {
      if (right === left + 1 || (left === 0 && right === lastSegment)) continue;
      if (classifyAtlasSegmentIntersection(ring[left]!, ring[left + 1]!, ring[right]!, ring[right + 1]!) !== "NONE") return true;
    }
  }
  return false;
}

export function validateAtlasRing(value: unknown, dimensions: AtlasCoordinateDimensions, options: AtlasRingValidationOptions = {}): AtlasValidationResult<AtlasRing> {
  const path = options.path ?? "ring";
  const points = validatePointList(value, dimensions, 4, atlasGeometryLimits.maxRingVertices, path);
  if (!points.value) return points;
  const findings = [...points.findings, ...consecutiveDuplicateFindings(points.value, path, true)];
  const closed = pointsEqual(points.value[0]!, points.value.at(-1)!);
  if (!closed) findings.push(atlasFinding("ERROR", "RING_NOT_CLOSED", path, "Ring must repeat its first vertex as its final vertex."));
  const unique = new Set((closed ? points.value.slice(0, -1) : points.value).map(pointKey));
  if (unique.size < 3) findings.push(atlasFinding("ERROR", "RING_DISTINCT_VERTICES", path, "Ring requires at least three distinct vertices."));
  if (closed && unique.size >= 3) {
    const orientation = atlasRingOrientation(points.value);
    if (!orientation) findings.push(atlasFinding("ERROR", "RING_ZERO_AREA", path, "Ring has zero signed area."));
    else if (options.orientation && options.orientation !== "ANY" && orientation !== options.orientation) findings.push(atlasFinding("ERROR", "RING_ORIENTATION", path, `Ring must be ${options.orientation.toLowerCase()} in top-left coordinates.`));
    if (ringSelfIntersects(points.value)) findings.push(atlasFinding("ERROR", "RING_SELF_INTERSECTION", path, "Ring self-intersects."));
  }
  return atlasValidationResult(points.value, findings);
}

export function closeAtlasRingForAnalysis(value: readonly AtlasNumericPoint[]) {
  if (value.length === 0 || pointsEqual(value[0]!, value.at(-1)!)) return { ring: value.map((point) => [...point] as AtlasNumericPoint), normalized: false } as const;
  return { ring: [...value.map((point) => [...point] as AtlasNumericPoint), [...value[0]!] as AtlasNumericPoint], normalized: true } as const;
}

function pointInRing(point: AtlasNumericPoint, ring: readonly AtlasNumericPoint[]) {
  for (let index = 1; index < ring.length; index += 1) if (pointOnSegment(point, ring[index - 1]!, ring[index]!)) return "BOUNDARY" as const;
  let inside = false;
  for (let left = 0, right = ring.length - 1; left < ring.length; right = left++) {
    const a = ring[left]!;
    const b = ring[right]!;
    const crosses = (a[1] > point[1]) !== (b[1] > point[1]) && point[0] < (b[0] - a[0]) * (point[1] - a[1]) / (b[1] - a[1]) + a[0];
    if (crosses) inside = !inside;
  }
  return inside ? "INSIDE" as const : "OUTSIDE" as const;
}

function ringsIntersect(left: readonly AtlasPoint[], right: readonly AtlasPoint[]) {
  for (let a = 1; a < left.length; a += 1) for (let b = 1; b < right.length; b += 1) {
    if (classifyAtlasSegmentIntersection(left[a - 1]!, left[a]!, right[b - 1]!, right[b]!) !== "NONE") return true;
  }
  return false;
}

export function validateAtlasPolygon(value: unknown, dimensions: AtlasCoordinateDimensions, path = "polygon"): AtlasValidationResult<AtlasPolygonCoordinates> {
  if (!Array.isArray(value) || value.length === 0) return atlasValidationResult<AtlasPolygonCoordinates>(null, [atlasFinding("ERROR", "POLYGON_SHAPE", path, "Polygon requires a shell ring.")]);
  if (value.length > atlasGeometryLimits.maxPolygonRings) return atlasValidationResult<AtlasPolygonCoordinates>(null, [atlasFinding("ERROR", "POLYGON_RING_LIMIT", path, "Polygon ring limit exceeded.")]);
  const findings: AtlasValidationFinding[] = [];
  const rings: AtlasRing[] = [];
  let vertices = 0;
  for (const [index, candidate] of value.entries()) {
    const ring = validateAtlasRing(candidate, dimensions, { orientation: index === 0 ? "CLOCKWISE" : "COUNTERCLOCKWISE", path: `${path}[${index}]` });
    findings.push(...ring.findings);
    if (ring.value) { rings.push(ring.value); vertices += ring.value.length; }
  }
  if (vertices > atlasGeometryLimits.maxGeometryVertices) findings.push(atlasFinding("ERROR", "GEOMETRY_TOTAL_VERTEX_LIMIT", path, "Geometry total vertex limit exceeded."));
  if (rings.length === value.length && rings.length > 0) {
    const shell = rings[0]!;
    for (let index = 1; index < rings.length; index += 1) {
      const hole = rings[index]!;
      const location = pointInRing(hole[0]!, shell);
      if (location !== "INSIDE") findings.push(atlasFinding("ERROR", "POLYGON_HOLE_OUTSIDE", `${path}[${index}]`, "Hole must be strictly contained by the shell."));
      if (ringsIntersect(shell, hole)) findings.push(atlasFinding("ERROR", "POLYGON_HOLE_INTERSECTION", `${path}[${index}]`, "Hole boundary intersects the shell."));
      for (let other = 1; other < index; other += 1) {
        if (ringsIntersect(rings[other]!, hole) || pointInRing(hole[0]!, rings[other]!) === "INSIDE" || pointInRing(rings[other]![0]!, hole) === "INSIDE") {
          findings.push(atlasFinding("ERROR", "POLYGON_HOLE_OVERLAP", `${path}[${index}]`, "Hole overlaps another hole."));
        }
      }
    }
  }
  return atlasValidationResult(rings.length === value.length ? rings : null, findings);
}

export function validateAtlasMultiPolygon(value: unknown, dimensions: AtlasCoordinateDimensions, path = "multipolygon"): AtlasValidationResult<AtlasMultiPolygonCoordinates> {
  if (!Array.isArray(value) || value.length === 0) return atlasValidationResult<AtlasMultiPolygonCoordinates>(null, [atlasFinding("ERROR", "MULTIPOLYGON_SHAPE", path, "Multipolygon requires at least one polygon component.")]);
  if (value.length > atlasGeometryLimits.maxMultiPolygonComponents) return atlasValidationResult<AtlasMultiPolygonCoordinates>(null, [atlasFinding("ERROR", "MULTIPOLYGON_COMPONENT_LIMIT", path, "Multipolygon component limit exceeded.")]);
  const findings: AtlasValidationFinding[] = [];
  const polygons: AtlasPolygonCoordinates[] = [];
  let vertices = 0;
  for (const [index, candidate] of value.entries()) {
    const polygon = validateAtlasPolygon(candidate, dimensions, `${path}[${index}]`);
    findings.push(...polygon.findings);
    if (polygon.value) { polygons.push(polygon.value); vertices += polygon.value.reduce((sum, ring) => sum + ring.length, 0); }
  }
  if (vertices > atlasGeometryLimits.maxGeometryVertices) findings.push(atlasFinding("ERROR", "GEOMETRY_TOTAL_VERTEX_LIMIT", path, "Geometry total vertex limit exceeded."));
  return atlasValidationResult(polygons.length === value.length ? polygons : null, findings);
}

export function validateAtlasAreaGeometry(value: unknown, dimensions: AtlasCoordinateDimensions, path = "geometry"): AtlasValidationResult<AtlasPolygonGeometry | AtlasMultiPolygonGeometry> {
  if (!value || typeof value !== "object") return atlasValidationResult<AtlasPolygonGeometry | AtlasMultiPolygonGeometry>(null, [atlasFinding("ERROR", "GEOMETRY_SHAPE", path, "Expected polygon or multipolygon geometry.")]);
  const candidate = value as { type?: unknown; coordinates?: unknown };
  if (candidate.type === "POLYGON") {
    const polygon = validateAtlasPolygon(candidate.coordinates, dimensions, `${path}.coordinates`);
    return atlasValidationResult(polygon.value ? { type: "POLYGON", coordinates: polygon.value } : null, polygon.findings);
  }
  if (candidate.type === "MULTIPOLYGON") {
    const multipolygon = validateAtlasMultiPolygon(candidate.coordinates, dimensions, `${path}.coordinates`);
    return atlasValidationResult(multipolygon.value ? { type: "MULTIPOLYGON", coordinates: multipolygon.value } : null, multipolygon.findings);
  }
  return atlasValidationResult<AtlasPolygonGeometry | AtlasMultiPolygonGeometry>(null, [atlasFinding("ERROR", "GEOMETRY_KIND", path, "Expected POLYGON or MULTIPOLYGON geometry.")]);
}

type ExactSegment = { readonly mapSlug: string; readonly featureKey: string; readonly from: AtlasPoint; readonly to: AtlasPoint };
export type AtlasExactGeometryFeature = { readonly mapSlug: string; readonly featureKey: string; readonly geometry: AtlasPolygonGeometry | AtlasMultiPolygonGeometry };

export type AtlasExactSharedGeometryAnalysis = {
  readonly polygonFeatures: number;
  readonly polygonRings: number;
  readonly segments: number;
  readonly exactSharedVertices: readonly { readonly mapSlug: string; readonly point: AtlasNumericPoint; readonly owners: readonly string[] }[];
  readonly exactSharedDirectedSegments: readonly { readonly mapSlug: string; readonly segment: string; readonly owners: readonly string[] }[];
  readonly exactSharedUndirectedSegments: readonly { readonly mapSlug: string; readonly segment: string; readonly owners: readonly string[] }[];
  readonly duplicatePolygons: readonly { readonly mapSlug: string; readonly owners: readonly string[] }[];
  readonly intersections: Readonly<Record<Exclude<AtlasSegmentIntersection, "NONE">, number>>;
  readonly intersectionExamples: readonly { readonly mapSlug: string; readonly left: string; readonly right: string; readonly kind: Exclude<AtlasSegmentIntersection, "NONE"> }[];
  readonly truncated: boolean;
};

function geometryPolygons(geometry: AtlasPolygonGeometry | AtlasMultiPolygonGeometry) {
  return geometry.type === "POLYGON" ? [geometry.coordinates] : geometry.coordinates;
}

export function analyzeExactSharedAtlasGeometry(features: readonly AtlasExactGeometryFeature[]): AtlasExactSharedGeometryAnalysis {
  const vertices = new Map<string, Set<string>>();
  const directed = new Map<string, Set<string>>();
  const undirected = new Map<string, Set<string>>();
  const duplicate = new Map<string, Set<string>>();
  const segments: ExactSegment[] = [];
  let rings = 0;
  for (const feature of features) {
    const geometryKey = `${feature.mapSlug}|${JSON.stringify(feature.geometry)}`;
    const geometryOwners = duplicate.get(geometryKey) ?? new Set<string>();
    geometryOwners.add(feature.featureKey);
    duplicate.set(geometryKey, geometryOwners);
    for (const polygon of geometryPolygons(feature.geometry)) for (const ring of polygon) {
      rings += 1;
      for (const point of ring.slice(0, -1)) {
        const key = `${feature.mapSlug}|${pointKey(point)}`;
        const owners = vertices.get(key) ?? new Set<string>();
        owners.add(feature.featureKey);
        vertices.set(key, owners);
      }
      for (let index = 1; index < ring.length; index += 1) {
        const from = ring[index - 1]!;
        const to = ring[index]!;
        segments.push({ mapSlug: feature.mapSlug, featureKey: feature.featureKey, from, to });
        for (const [store, key] of [[directed, `${feature.mapSlug}|${segmentKey(from, to, true)}`], [undirected, `${feature.mapSlug}|${segmentKey(from, to, false)}`]] as const) {
          const owners = store.get(key) ?? new Set<string>();
          owners.add(feature.featureKey);
          store.set(key, owners);
        }
      }
    }
  }
  const truncated = segments.length > atlasGeometryLimits.maxExactAnalysisSegments;
  const analyzed = segments.slice(0, atlasGeometryLimits.maxExactAnalysisSegments);
  const intersections: Record<Exclude<AtlasSegmentIntersection, "NONE">, number> = { TOUCH: 0, CROSS: 0, OVERLAP: 0 };
  const examples: Array<{ mapSlug: string; left: string; right: string; kind: Exclude<AtlasSegmentIntersection, "NONE"> }> = [];
  for (let left = 0; left < analyzed.length; left += 1) for (let right = left + 1; right < analyzed.length; right += 1) {
    const a = analyzed[left]!;
    const b = analyzed[right]!;
    if (a.mapSlug !== b.mapSlug || a.featureKey === b.featureKey) continue;
    const kind = classifyAtlasSegmentIntersection(a.from, a.to, b.from, b.to);
    if (kind === "NONE") continue;
    intersections[kind] += 1;
    if (examples.length < atlasGeometryLimits.maxDiagnosticExamples) examples.push({ mapSlug: a.mapSlug, left: a.featureKey, right: b.featureKey, kind });
  }
  const shared = (store: Map<string, Set<string>>) => [...store.entries()].filter(([, owners]) => owners.size > 1).sort(([left], [right]) => left.localeCompare(right));
  return {
    polygonFeatures: features.length,
    polygonRings: rings,
    segments: segments.length,
    exactSharedVertices: shared(vertices).map(([key, owners]) => { const [mapSlug, point] = key.split("|"); return { mapSlug: mapSlug!, point: point!.split(",").map(Number) as unknown as AtlasNumericPoint, owners: [...owners].sort() }; }),
    exactSharedDirectedSegments: shared(directed).map(([key, owners]) => { const [mapSlug, segment] = key.split("|"); return { mapSlug: mapSlug!, segment: segment!, owners: [...owners].sort() }; }),
    exactSharedUndirectedSegments: shared(undirected).map(([key, owners]) => { const [mapSlug, segment] = key.split("|"); return { mapSlug: mapSlug!, segment: segment!, owners: [...owners].sort() }; }),
    duplicatePolygons: shared(duplicate).map(([key, owners]) => ({ mapSlug: key.split("|")[0]!, owners: [...owners].sort() })),
    intersections,
    intersectionExamples: examples,
    truncated,
  };
}
