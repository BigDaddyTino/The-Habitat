import type { AtlasCoordinateDimensions, AtlasPoint } from "./atlas-coordinate";
import { validateAtlasPoint } from "./atlas-coordinate";
import type { AtlasMultiPolygonGeometry, AtlasPolygonCoordinates, AtlasPolygonGeometry, AtlasRing } from "./atlas-geometry";
import { validateAtlasLineString, validateAtlasPolygon } from "./atlas-geometry";
import type { AtlasSpatialLayerKind } from "./atlas-spatial";
import { atlasSpatialGeometryMode } from "./atlas-spatial";
import { atlasFinding, atlasValidationResult, type AtlasValidationFinding, type AtlasValidationResult } from "./atlas-validation";

export const atlasBoundaryKinds = ["INTERNAL_BORDER", "COAST", "WATER_BOUNDARY", "OPEN_BOUNDARY"] as const;
export type AtlasBoundaryKind = (typeof atlasBoundaryKinds)[number];

export const atlasAreaRingRoles = ["SHELL", "HOLE"] as const;
export type AtlasAreaRingRole = (typeof atlasAreaRingRoles)[number];

export type AtlasTopologyNode = {
  readonly id: string;
  readonly mapSlug: string;
  readonly position: AtlasPoint;
  readonly version: number;
};

export type AtlasBoundary = {
  readonly id: string;
  readonly mapSlug: string;
  readonly startNodeId: string;
  readonly endNodeId: string;
  readonly interiorVertices: readonly AtlasPoint[];
  readonly kind: AtlasBoundaryKind;
  readonly version: number;
};

export type AtlasRingBoundaryReference = {
  readonly boundaryId: string;
  readonly sequence: number;
  readonly reversed: boolean;
};

export type AtlasAreaRing = {
  readonly id: string;
  readonly componentIndex: number;
  readonly role: AtlasAreaRingRole;
  readonly boundaries: readonly AtlasRingBoundaryReference[];
};

export type AtlasTopologyArea = {
  readonly id: string;
  readonly mapSlug: string;
  readonly layerKind: AtlasSpatialLayerKind;
  readonly rings: readonly AtlasAreaRing[];
  readonly version: number;
};

export type AtlasTopologyDataset = {
  readonly nodes: readonly AtlasTopologyNode[];
  readonly boundaries: readonly AtlasBoundary[];
  readonly areas: readonly AtlasTopologyArea[];
};

export type AtlasDerivedTopologyArea = {
  readonly areaId: string;
  readonly geometry: AtlasPolygonGeometry | AtlasMultiPolygonGeometry;
};

export type AtlasTopologyValidation = AtlasValidationResult<readonly AtlasDerivedTopologyArea[]>;

function validIdentity(value: unknown) {
  return typeof value === "string" && value.length > 0 && value.length <= 128;
}

function validVersion(value: unknown) {
  return Number.isSafeInteger(value) && (value as number) >= 1;
}

function uniqueById<T extends { readonly id: string }>(items: readonly T[], kind: string, findings: AtlasValidationFinding[]) {
  const result = new Map<string, T>();
  for (const [index, item] of items.entries()) {
    if (!validIdentity(item.id)) findings.push(atlasFinding("ERROR", "TOPOLOGY_ID", `${kind}[${index}].id`, "Topology identity must be a non-empty bounded string."));
    else if (result.has(item.id)) findings.push(atlasFinding("ERROR", "TOPOLOGY_DUPLICATE_ID", `${kind}[${index}].id`, `Duplicate ${kind} identity.`));
    else result.set(item.id, item);
  }
  return result;
}

function orientedBoundaryPoints(boundary: AtlasBoundary, nodes: ReadonlyMap<string, AtlasTopologyNode>) {
  const start = nodes.get(boundary.startNodeId)?.position;
  const end = nodes.get(boundary.endNodeId)?.position;
  if (!start || !end) return null;
  return [start, ...boundary.interiorVertices, end] as readonly AtlasPoint[];
}

function reversePoints(points: readonly AtlasPoint[]) {
  return [...points].reverse() as AtlasPoint[];
}

export function validateAtlasTopology(dataset: AtlasTopologyDataset, dimensions: AtlasCoordinateDimensions): AtlasTopologyValidation {
  const findings: AtlasValidationFinding[] = [];
  const nodes = uniqueById(dataset.nodes, "nodes", findings);
  const boundaries = uniqueById(dataset.boundaries, "boundaries", findings);
  uniqueById(dataset.areas, "areas", findings);

  for (const [index, node] of dataset.nodes.entries()) {
    if (!validIdentity(node.mapSlug)) findings.push(atlasFinding("ERROR", "TOPOLOGY_MAP", `nodes[${index}].mapSlug`, "Node requires a map identity."));
    if (!validVersion(node.version)) findings.push(atlasFinding("ERROR", "TOPOLOGY_VERSION", `nodes[${index}].version`, "Version must be a positive integer."));
    const point = validateAtlasPoint(node.position, dimensions);
    if (!point.ok) findings.push(atlasFinding("ERROR", `COORDINATE_${point.issue}`, `nodes[${index}].position`, "Topology node must be an in-bounds integer coordinate."));
  }

  for (const [index, boundary] of dataset.boundaries.entries()) {
    const path = `boundaries[${index}]`;
    if (!validIdentity(boundary.mapSlug)) findings.push(atlasFinding("ERROR", "TOPOLOGY_MAP", `${path}.mapSlug`, "Boundary requires a map identity."));
    if (!validVersion(boundary.version)) findings.push(atlasFinding("ERROR", "TOPOLOGY_VERSION", `${path}.version`, "Version must be a positive integer."));
    if (!(atlasBoundaryKinds as readonly string[]).includes(boundary.kind)) findings.push(atlasFinding("ERROR", "BOUNDARY_KIND", `${path}.kind`, "Unsupported boundary kind."));
    const start = nodes.get(boundary.startNodeId);
    const end = nodes.get(boundary.endNodeId);
    if (!start) findings.push(atlasFinding("ERROR", "TOPOLOGY_MISSING_NODE", `${path}.startNodeId`, "Boundary start node does not exist."));
    if (!end) findings.push(atlasFinding("ERROR", "TOPOLOGY_MISSING_NODE", `${path}.endNodeId`, "Boundary end node does not exist."));
    if (start && end) {
      if (start.id === end.id) findings.push(atlasFinding("ERROR", "BOUNDARY_ENDPOINT_MATCH", path, "Boundary endpoints must be different nodes."));
      if (start.mapSlug !== boundary.mapSlug || end.mapSlug !== boundary.mapSlug) findings.push(atlasFinding("ERROR", "TOPOLOGY_MAP_MISMATCH", path, "Boundary and endpoint nodes must belong to the same map."));
      const line = validateAtlasLineString([start.position, ...boundary.interiorVertices, end.position], dimensions, `${path}.vertices`);
      findings.push(...line.findings);
    }
  }

  const derived: AtlasDerivedTopologyArea[] = [];
  for (const [areaIndex, area] of dataset.areas.entries()) {
    const areaPath = `areas[${areaIndex}]`;
    if (!validIdentity(area.mapSlug)) findings.push(atlasFinding("ERROR", "TOPOLOGY_MAP", `${areaPath}.mapSlug`, "Area requires a map identity."));
    if (!validVersion(area.version)) findings.push(atlasFinding("ERROR", "TOPOLOGY_VERSION", `${areaPath}.version`, "Version must be a positive integer."));
    if (atlasSpatialGeometryMode(area.layerKind) !== "SHARED_TOPOLOGY") findings.push(atlasFinding("ERROR", "TOPOLOGY_ANALYTICAL_LAYER", `${areaPath}.layerKind`, "Analytical layers must remain independently representable rather than consuming the base partition topology."));
    if (area.rings.length === 0) findings.push(atlasFinding("ERROR", "TOPOLOGY_AREA_EMPTY", `${areaPath}.rings`, "Topology area requires at least one ring."));

    const assembled = new Map<number, { shell: AtlasRing | null; holes: AtlasRing[] }>();
    for (const [ringIndex, ring] of area.rings.entries()) {
      const ringPath = `${areaPath}.rings[${ringIndex}]`;
      if (!validIdentity(ring.id)) findings.push(atlasFinding("ERROR", "TOPOLOGY_ID", `${ringPath}.id`, "Ring requires an identity."));
      if (!Number.isSafeInteger(ring.componentIndex) || ring.componentIndex < 0) findings.push(atlasFinding("ERROR", "TOPOLOGY_COMPONENT", `${ringPath}.componentIndex`, "Component index must be a non-negative integer."));
      if (!(atlasAreaRingRoles as readonly string[]).includes(ring.role)) findings.push(atlasFinding("ERROR", "TOPOLOGY_RING_ROLE", `${ringPath}.role`, "Ring role must be SHELL or HOLE."));
      if (ring.boundaries.length === 0) { findings.push(atlasFinding("ERROR", "TOPOLOGY_RING_EMPTY", `${ringPath}.boundaries`, "Ring requires boundary references.")); continue; }

      const sorted = [...ring.boundaries].sort((left, right) => left.sequence - right.sequence);
      const used = new Set<string>();
      const pieces: AtlasPoint[][] = [];
      for (const [referenceIndex, reference] of sorted.entries()) {
        const referencePath = `${ringPath}.boundaries[${referenceIndex}]`;
        if (reference.sequence !== referenceIndex) findings.push(atlasFinding("ERROR", "TOPOLOGY_SEQUENCE", `${referencePath}.sequence`, "Boundary sequence must be unique and contiguous from zero."));
        if (typeof reference.reversed !== "boolean") findings.push(atlasFinding("ERROR", "TOPOLOGY_REVERSAL", `${referencePath}.reversed`, "Boundary reversal must be a boolean."));
        if (used.has(reference.boundaryId)) findings.push(atlasFinding("ERROR", "TOPOLOGY_DUPLICATE_BOUNDARY_USE", referencePath, "A ring cannot consume the same boundary twice."));
        used.add(reference.boundaryId);
        const boundary = boundaries.get(reference.boundaryId);
        if (!boundary) { findings.push(atlasFinding("ERROR", "TOPOLOGY_MISSING_BOUNDARY", `${referencePath}.boundaryId`, "Referenced boundary does not exist.")); continue; }
        if (boundary.mapSlug !== area.mapSlug) findings.push(atlasFinding("ERROR", "TOPOLOGY_MAP_MISMATCH", referencePath, "Area and boundary must belong to the same map."));
        const points = orientedBoundaryPoints(boundary, nodes);
        if (!points) continue;
        if (typeof reference.reversed === "boolean") pieces.push(reference.reversed ? reversePoints(points) : [...points]);
      }

      const ringPoints: AtlasPoint[] = [];
      for (const [pieceIndex, piece] of pieces.entries()) {
        if (pieceIndex > 0 && ringPoints.length && piece.length && (ringPoints.at(-1)![0] !== piece[0]![0] || ringPoints.at(-1)![1] !== piece[0]![1])) {
          findings.push(atlasFinding("ERROR", "TOPOLOGY_DISCONNECTED_CHAIN", ringPath, "Boundary endpoints do not form a connected ring chain."));
        }
        ringPoints.push(...(pieceIndex === 0 ? piece : piece.slice(1)));
      }
      if (ringPoints.length && (ringPoints[0]![0] !== ringPoints.at(-1)![0] || ringPoints[0]![1] !== ringPoints.at(-1)![1])) findings.push(atlasFinding("ERROR", "TOPOLOGY_RING_NOT_CLOSED", ringPath, "Assembled boundary chain does not close."));
      const component = assembled.get(ring.componentIndex) ?? { shell: null, holes: [] };
      if (ring.role === "SHELL") {
        if (component.shell) findings.push(atlasFinding("ERROR", "TOPOLOGY_DUPLICATE_SHELL", ringPath, "Each component must have exactly one shell."));
        component.shell = ringPoints;
      } else component.holes.push(ringPoints);
      assembled.set(ring.componentIndex, component);
    }

    const componentIndexes = [...assembled.keys()].sort((left, right) => left - right);
    if (componentIndexes.some((value, index) => value !== index)) findings.push(atlasFinding("ERROR", "TOPOLOGY_COMPONENT_SEQUENCE", `${areaPath}.rings`, "Component indexes must be contiguous from zero."));
    const polygons: AtlasPolygonCoordinates[] = [];
    for (const componentIndex of componentIndexes) {
      const component = assembled.get(componentIndex)!;
      if (!component.shell) { findings.push(atlasFinding("ERROR", "TOPOLOGY_MISSING_SHELL", `${areaPath}.component[${componentIndex}]`, "Component has holes but no shell.")); continue; }
      const polygon = validateAtlasPolygon([component.shell, ...component.holes], dimensions, `${areaPath}.component[${componentIndex}]`);
      findings.push(...polygon.findings);
      if (polygon.value) polygons.push(polygon.value);
    }
    if (polygons.length === componentIndexes.length && polygons.length > 0) {
      const geometry: AtlasPolygonGeometry | AtlasMultiPolygonGeometry = polygons.length === 1
        ? { type: "POLYGON", coordinates: polygons[0]! }
        : { type: "MULTIPOLYGON", coordinates: polygons };
      derived.push({ areaId: area.id, geometry });
    }
  }

  return atlasValidationResult(derived.length === dataset.areas.length ? derived : null, findings);
}
