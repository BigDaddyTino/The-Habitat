import { createHash } from "node:crypto";
import { readFile, stat } from "node:fs/promises";
import {
  analyzeExactSharedAtlasGeometry,
  atlasCoordinateWidth,
  atlasFinding,
  atlasFindingsFail,
  artworkHasCanonicalAspectRatio,
  classifyLegacyAtlasConnectionWording,
  deriveAtlasCoordinateDimensions,
  findAtlasReciprocalCandidates,
  resolveAtlasConnectionEndpoint,
  validateAtlasCoordinateDimensions,
  validateAtlasPoint,
  validateAtlasRing,
  type AtlasCoordinateDimensions,
  type AtlasExactGeometryFeature,
  type AtlasFindingSeverity,
  type AtlasMultiPolygonGeometry,
  type AtlasPolygonGeometry,
  type AtlasValidationFinding,
} from "@habitat/shared";

export const atlasIntegrityAuditContract = "martino-atlas-integrity-audit" as const;
export const atlasIntegrityAuditContractVersion = 1 as const;
export const atlasGeometryManifestContract = "martino-atlas-v1-geometry-migration-manifest" as const;
export const atlasConnectionManifestContract = "martino-atlas-v1-connection-migration-manifest" as const;
export const atlasMigrationManifestVersion = 1 as const;

export type AtlasAuditJson = null | boolean | number | string | AtlasAuditJson[] | { [key: string]: AtlasAuditJson };

export type AtlasAuditPlacementSource = {
  readonly placementId: string;
  readonly entryId: string;
  readonly entrySlug: string;
  readonly entryTitle: string;
  readonly entryStatus: string;
  readonly placeType: string | null;
  readonly parentSlug: string | null;
  readonly geometryKind: string;
  readonly geometry: unknown;
  readonly labelX: number | null;
  readonly labelY: number | null;
  readonly minZoom: number;
  readonly maxZoom: number | null;
  readonly priority: number;
};

export type AtlasAuditNodePlacementSource = {
  readonly placementId: string;
  readonly nodeId: string;
  readonly nodeKey: string;
  readonly nodeTitle: string;
  readonly nodeStatus: string;
  readonly arcId: string;
  readonly arcSlug: string;
  readonly arcStatus: string;
  readonly geometryKind: string;
  readonly geometry: unknown;
  readonly labelX: number | null;
  readonly labelY: number | null;
  readonly minZoom: number;
  readonly maxZoom: number | null;
  readonly priority: number;
};

export type AtlasAuditMapSource = {
  readonly mapId: string;
  readonly slug: string;
  readonly title: string;
  readonly parentSlug: string | null;
  readonly childSlugs: readonly string[];
  readonly ownerEntrySlug: string | null;
  readonly artVersion: string;
  readonly imageWidth: number;
  readonly imageHeight: number;
  readonly coordinateWidth: number;
  readonly coordinateHeight: number;
  readonly placements: readonly AtlasAuditPlacementSource[];
  readonly nodePlacements: readonly AtlasAuditNodePlacementSource[];
};

export type AtlasAuditEntrySource = {
  readonly id: string;
  readonly kind: string;
  readonly slug: string;
  readonly title: string;
  readonly summary: string | null;
  readonly body: string | null;
  readonly status: string;
  readonly meta: unknown;
};

export type AtlasAuditSource = {
  readonly maps: readonly AtlasAuditMapSource[];
  readonly entries: readonly AtlasAuditEntrySource[];
};

export type AtlasArtworkInspection = {
  readonly configuredUrl: string;
  readonly allowlisted: boolean;
  readonly exists: boolean;
  readonly format: "PNG" | "UNKNOWN";
  readonly decodedWidth: number | null;
  readonly decodedHeight: number | null;
  readonly bytes: number | null;
  readonly sha256: string | null;
};

export type AtlasArtworkInspector = (map: AtlasAuditMapSource) => Promise<AtlasArtworkInspection>;

export function canonicalizeAtlasJson(value: unknown): AtlasAuditJson {
  if (value === null || typeof value === "boolean" || typeof value === "string") return value;
  if (typeof value === "number") return Number.isFinite(value) ? value : String(value);
  if (Array.isArray(value)) return value.map(canonicalizeAtlasJson);
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).sort(([left], [right]) => left.localeCompare(right)).map(([key, item]) => [key, canonicalizeAtlasJson(item)]));
  return String(value);
}

export function stableAtlasJson(value: unknown, pretty = true) {
  return `${JSON.stringify(canonicalizeAtlasJson(value), null, pretty ? 2 : undefined)}${pretty ? "\n" : ""}`;
}

export function atlasSha256(value: string | Uint8Array) {
  return createHash("sha256").update(value).digest("hex");
}

export function fingerprintAtlasSource(value: unknown) {
  return atlasSha256(stableAtlasJson(value, false));
}

export function decodePngDimensions(bytes: Uint8Array) {
  const signature = [137, 80, 78, 71, 13, 10, 26, 10];
  if (bytes.length < 24 || signature.some((value, index) => bytes[index] !== value)) return null;
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const width = view.getUint32(16, false);
  const height = view.getUint32(20, false);
  return width > 0 && height > 0 ? { width, height } : null;
}

export function createFilesystemAtlasArtworkInspector(resolveArtwork: (slug: string, versionFile: string) => string | null): AtlasArtworkInspector {
  return async (map) => {
    const configuredUrl = `/codex-map/${map.slug}/${map.artVersion}.png`;
    const target = resolveArtwork(map.slug, `${map.artVersion}.png`);
    if (!target) return { configuredUrl, allowlisted: false, exists: false, format: "UNKNOWN", decodedWidth: null, decodedHeight: null, bytes: null, sha256: null };
    const info = await stat(target).catch(() => null);
    if (!info?.isFile()) return { configuredUrl, allowlisted: true, exists: false, format: "UNKNOWN", decodedWidth: null, decodedHeight: null, bytes: null, sha256: null };
    const bytes = await readFile(target).catch(() => null);
    if (!bytes) return { configuredUrl, allowlisted: true, exists: false, format: "UNKNOWN", decodedWidth: null, decodedHeight: null, bytes: null, sha256: null };
    const dimensions = decodePngDimensions(bytes);
    return {
      configuredUrl,
      allowlisted: true,
      exists: true,
      format: dimensions ? "PNG" : "UNKNOWN",
      decodedWidth: dimensions?.width ?? null,
      decodedHeight: dimensions?.height ?? null,
      bytes: info.size,
      sha256: atlasSha256(bytes),
    };
  };
}

function record(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null;
}

function text(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function rows(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is Record<string, unknown> => Boolean(record(item))) : [];
}

function sortFindings(findings: readonly AtlasValidationFinding[]) {
  const severity: Record<AtlasFindingSeverity, number> = { FATAL: 0, ERROR: 1, WARNING: 2, INFO: 3 };
  return [...findings].sort((left, right) => severity[left.severity] - severity[right.severity] || left.code.localeCompare(right.code) || left.path.localeCompare(right.path) || left.message.localeCompare(right.message));
}

function legacyGeometryValidation(value: unknown, geometryKind: string, dimensions: AtlasCoordinateDimensions, path: string) {
  const findings: AtlasValidationFinding[] = [];
  if (!value || typeof value !== "object") return { geometry: null, findings: [atlasFinding("ERROR", "GEOMETRY_SHAPE", path, "Placement geometry is not an object.")] } as const;
  const candidate = value as { type?: unknown; coordinates?: unknown };
  if (candidate.type !== geometryKind) findings.push(atlasFinding("ERROR", "GEOMETRY_KIND_MISMATCH", path, "Stored geometry kind and JSON geometry type differ."));
  if (candidate.type === "POINT") {
    const point = validateAtlasPoint(candidate.coordinates, dimensions);
    if (!point.ok) findings.push(atlasFinding("ERROR", `COORDINATE_${point.issue}`, `${path}.coordinates`, "Point must be a finite in-bounds integer coordinate."));
    return { geometry: point.ok ? { type: "POINT" as const, coordinates: point.value } : null, findings };
  }
  if (candidate.type === "POLYGON" && Array.isArray(candidate.coordinates)) {
    const rings = candidate.coordinates.map((ring, index) => validateAtlasRing(ring, dimensions, { orientation: "ANY", path: `${path}.coordinates[${index}]` }));
    findings.push(...rings.flatMap((ring) => ring.findings));
    const coordinates = rings.every((ring) => ring.value) ? rings.map((ring) => ring.value!) : null;
    return { geometry: coordinates ? { type: "POLYGON" as const, coordinates } satisfies AtlasPolygonGeometry : null, findings };
  }
  if (candidate.type === "MULTIPOLYGON" && Array.isArray(candidate.coordinates)) {
    const sourcePolygons = candidate.coordinates;
    const polygons = sourcePolygons.map((polygon, polygonIndex) => Array.isArray(polygon)
      ? polygon.map((ring, ringIndex) => validateAtlasRing(ring, dimensions, { orientation: "ANY", path: `${path}.coordinates[${polygonIndex}][${ringIndex}]` }))
      : []);
    findings.push(...polygons.flatMap((polygon) => polygon.flatMap((ring) => ring.findings)));
    const complete = polygons.length === sourcePolygons.length && polygons.every((polygon, index) => Array.isArray(sourcePolygons[index]) && polygon.length === (sourcePolygons[index] as unknown[]).length && polygon.every((ring) => ring.value));
    const coordinates = complete ? polygons.map((polygon) => polygon.map((ring) => ring.value!)) : null;
    return { geometry: coordinates ? { type: "MULTIPOLYGON" as const, coordinates } satisfies AtlasMultiPolygonGeometry : null, findings };
  }
  findings.push(atlasFinding("ERROR", "GEOMETRY_KIND", path, "Unsupported placement geometry type."));
  return { geometry: null, findings };
}

function validateLabel(labelX: number | null, labelY: number | null, dimensions: AtlasCoordinateDimensions, path: string) {
  if (labelX === null && labelY === null) return [];
  if (labelX === null || labelY === null) return [atlasFinding("ERROR", "LABEL_PAIR", path, "Label coordinates must be both present or both null.")];
  const label = validateAtlasPoint([labelX, labelY], dimensions);
  return label.ok ? [] : [atlasFinding("ERROR", `COORDINATE_${label.issue}`, path, "Label anchor must be a finite in-bounds integer coordinate.")];
}

function inspectSemanticReferences(entries: readonly AtlasAuditEntrySource[]) {
  const biomes: Array<{ slug: string; biome: string }> = [];
  const controls: Array<{ slug: string; index: number; faction: string | null; kind: string | null }> = [];
  const gateOrPortalReferences: Array<{ slug: string; kind: string; references: readonly string[] }> = [];
  const statuses: Record<string, number> = {};
  for (const entry of entries) {
    statuses[entry.status] = (statuses[entry.status] ?? 0) + 1;
    const meta = record(entry.meta);
    if (entry.kind === "REGION") {
      const biome = text(meta?.biome);
      if (biome) biomes.push({ slug: entry.slug, biome });
      for (const [index, control] of rows(meta?.control).entries()) controls.push({ slug: entry.slug, index, faction: text(control.faction), kind: text(control.kind) });
    }
    if (entry.kind === "REGION" || entry.kind === "SYSTEM") {
      const haystack = `${entry.slug}\n${entry.title}\n${entry.summary ?? ""}\n${entry.body ?? ""}\n${JSON.stringify(entry.meta ?? null)}`.toLowerCase();
      const references = ["gate", "portal", "veil anchor"].filter((term) => haystack.includes(term));
      if (references.length) gateOrPortalReferences.push({ slug: entry.slug, kind: entry.kind, references });
    }
  }
  return {
    biomes: biomes.sort((left, right) => left.slug.localeCompare(right.slug)),
    controls: controls.sort((left, right) => left.slug.localeCompare(right.slug) || left.index - right.index),
    gateOrPortalReferences: gateOrPortalReferences.sort((left, right) => left.slug.localeCompare(right.slug)),
    statuses: Object.fromEntries(Object.entries(statuses).sort(([left], [right]) => left.localeCompare(right))),
  };
}

export type AtlasLegacyConnectionAuditRow = {
  readonly locator: string;
  readonly sourceEntryId: string;
  readonly sourceSlug: string;
  readonly sourceArrayIndex: number;
  readonly original: AtlasAuditJson;
  readonly targetAuthored: string | null;
  readonly byAuthored: string | null;
  readonly resolvedTargetSlug: string | null;
  readonly resolvedTargetEntryId: string | null;
  readonly endpointStatus: "RESOLVED" | "UNRESOLVED" | "AMBIGUOUS";
  readonly endpointMethod: "SLUG" | "TITLE" | null;
  readonly candidateType: string;
  readonly candidateDirectionality: "UNSPECIFIED";
  readonly reciprocalCandidates: readonly string[];
  readonly ambiguous: boolean;
  readonly ambiguityNotes: readonly string[];
  readonly fingerprint: string;
};

function inspectLegacyConnections(entries: readonly AtlasAuditEntrySource[], findings: AtlasValidationFinding[]) {
  const candidates = entries.map((entry) => ({ id: entry.id, slug: entry.slug, title: entry.title, kind: entry.kind, status: entry.status }));
  const working: Omit<AtlasLegacyConnectionAuditRow, "reciprocalCandidates">[] = [];
  for (const entry of entries.filter((candidate) => candidate.kind === "REGION").sort((left, right) => left.slug.localeCompare(right.slug))) {
    const connections = rows(record(entry.meta)?.connections);
    for (const [index, connection] of connections.entries()) {
      const locator = `${entry.slug}.meta.connections[${index}]`;
      const targetAuthored = text(connection.to);
      const byAuthored = text(connection.by);
      const resolution = resolveAtlasConnectionEndpoint(connection.to, candidates);
      const classification = classifyLegacyAtlasConnectionWording(connection.by);
      const ambiguityNotes: string[] = [];
      if (classification.ambiguous) {
        ambiguityNotes.push(classification.reason);
        findings.push(atlasFinding("WARNING", "CONNECTION_CLASSIFICATION_AMBIGUOUS", locator, classification.reason));
      }
      if (resolution.status !== "RESOLVED") {
        ambiguityNotes.push(resolution.status === "AMBIGUOUS" ? "Target title resolves to more than one Codex entry." : "Target does not resolve to a canonical Codex entry.");
        findings.push(atlasFinding("ERROR", `CONNECTION_ENDPOINT_${resolution.status}`, locator, ambiguityNotes.at(-1)!));
      } else if (resolution.method === "TITLE") {
        ambiguityNotes.push("Target resolved by exact title rather than canonical slug; human review is required.");
        findings.push(atlasFinding("WARNING", "CONNECTION_ENDPOINT_TITLE", locator, ambiguityNotes.at(-1)!));
      }
      const original = canonicalizeAtlasJson(connection);
      working.push({
        locator,
        sourceEntryId: entry.id,
        sourceSlug: entry.slug,
        sourceArrayIndex: index,
        original,
        targetAuthored,
        byAuthored,
        resolvedTargetSlug: resolution.status === "RESOLVED" ? resolution.target.slug : null,
        resolvedTargetEntryId: resolution.status === "RESOLVED" ? resolution.target.id : null,
        endpointStatus: resolution.status,
        endpointMethod: resolution.method,
        candidateType: classification.type,
        candidateDirectionality: "UNSPECIFIED",
        ambiguous: classification.ambiguous || resolution.status !== "RESOLVED" || resolution.method === "TITLE",
        ambiguityNotes,
        fingerprint: fingerprintAtlasSource({ sourceSlug: entry.slug, sourceArrayIndex: index, original }),
      });
    }
  }
  const reciprocal = findAtlasReciprocalCandidates(working.map((row) => ({ locator: row.locator, sourceSlug: row.sourceSlug, resolvedTargetSlug: row.resolvedTargetSlug })));
  return working.map((row) => {
    const reciprocalCandidates = reciprocal.get(row.locator) ?? [];
    if (reciprocalCandidates.length) findings.push(atlasFinding("WARNING", "CONNECTION_RECIPROCAL_CANDIDATE", row.locator, `Human review required; possible reciprocal row(s): ${reciprocalCandidates.join(", ")}.`));
    return { ...row, reciprocalCandidates } satisfies AtlasLegacyConnectionAuditRow;
  });
}

export type AtlasIntegrityAudit = {
  readonly contract: typeof atlasIntegrityAuditContract;
  readonly contractVersion: typeof atlasIntegrityAuditContractVersion;
  readonly summary: {
    readonly maps: number;
    readonly placeEntries: number;
    readonly placePlacements: number;
    readonly questNodePlacements: number;
    readonly totalPlacements: number;
    readonly unplacedPlaceEntries: number;
    readonly legacyConnections: number;
    readonly placePolygons: number;
    readonly exactSharedVertices: number;
    readonly exactSharedDirectedSegments: number;
    readonly exactSharedUndirectedSegments: number;
  };
  readonly maps: readonly unknown[];
  readonly places: readonly unknown[];
  readonly legacyConnections: readonly AtlasLegacyConnectionAuditRow[];
  readonly geometryAnalysis: ReturnType<typeof analyzeExactSharedAtlasGeometry>;
  readonly semanticMetadata: ReturnType<typeof inspectSemanticReferences>;
  readonly findings: readonly AtlasValidationFinding[];
};

const prompt2ReviewBaseline = {
  maps: 3,
  placeEntries: 37,
  placePlacements: 36,
  questNodePlacements: 10,
  unplacedPlaceEntries: 1,
  legacyConnections: 25,
  placePolygons: 26,
} as const;

export async function buildAtlasIntegrityAudit(source: AtlasAuditSource, inspectArtwork: AtlasArtworkInspector): Promise<AtlasIntegrityAudit> {
  const findings: AtlasValidationFinding[] = [];
  const mapBySlug = new Map(source.maps.map((map) => [map.slug, map]));
  const entryBySlug = new Map(source.entries.map((entry) => [entry.slug, entry]));
  const childSceneByOwner = new Map(source.maps.flatMap((map) => map.ownerEntrySlug ? [[map.ownerEntrySlug, map.slug] as const] : []));
  const exactFeatures: AtlasExactGeometryFeature[] = [];
  const mapReports: unknown[] = [];

  for (const map of [...source.maps].sort((left, right) => left.slug.localeCompare(right.slug))) {
    const artwork = await inspectArtwork(map);
    const coordinateResult = validateAtlasCoordinateDimensions({ width: map.coordinateWidth, height: map.coordinateHeight });
    const coordinates: AtlasCoordinateDimensions = coordinateResult.ok ? coordinateResult.value : { width: atlasCoordinateWidth, height: Math.max(1, map.coordinateHeight) };
    if (!coordinateResult.ok) findings.push(atlasFinding("ERROR", "MAP_COORDINATE_EXTENT", `maps.${map.slug}`, "Map does not use a valid fixed-point canonical extent."));
    if (!artwork.allowlisted) findings.push(atlasFinding("ERROR", "ARTWORK_ALLOWLIST", `maps.${map.slug}.artwork`, "Artwork does not resolve through the protected allow-list."));
    if (!artwork.exists) findings.push(atlasFinding("ERROR", "ARTWORK_MISSING", `maps.${map.slug}.artwork`, "Configured artwork is missing or unreadable."));
    if (artwork.exists && artwork.format !== "PNG") findings.push(atlasFinding("ERROR", "ARTWORK_FORMAT", `maps.${map.slug}.artwork`, "Artwork is not a valid PNG."));
    let dimensionStatus = "UNAVAILABLE";
    let decodedAspectRatio: number | null = null;
    const declaredAspectRatio = map.imageWidth / map.imageHeight;
    let expectedCoordinateHeight: number | null = null;
    if (artwork.decodedWidth && artwork.decodedHeight) {
      decodedAspectRatio = artwork.decodedWidth / artwork.decodedHeight;
      const expected = deriveAtlasCoordinateDimensions({ width: artwork.decodedWidth, height: artwork.decodedHeight });
      expectedCoordinateHeight = expected.ok ? expected.value.height : null;
      const dimensionsMatch = artwork.decodedWidth === map.imageWidth && artwork.decodedHeight === map.imageHeight;
      const aspectMatches = artworkHasCanonicalAspectRatio({ width: artwork.decodedWidth, height: artwork.decodedHeight }, { width: map.imageWidth, height: map.imageHeight });
      const extentMatchesDecoded = expected.ok && expected.value.height === map.coordinateHeight && map.coordinateWidth === atlasCoordinateWidth;
      dimensionStatus = dimensionsMatch && extentMatchesDecoded ? "MATCH" : aspectMatches && extentMatchesDecoded ? "RESOLUTION_VARIANT" : "RECALIBRATION_REQUIRED";
      if (dimensionStatus === "RECALIBRATION_REQUIRED") findings.push(atlasFinding("WARNING", "ARTWORK_DIMENSION_MISMATCH", `maps.${map.slug}.artwork`, `Decoded ${artwork.decodedWidth}x${artwork.decodedHeight}; declared ${map.imageWidth}x${map.imageHeight}; canonical extent ${map.coordinateWidth}x${map.coordinateHeight}. Explicit visual recalibration is required.`));
    }

    const placementReports = map.placements.map((placement) => {
      const path = `maps.${map.slug}.placements.${placement.entrySlug}`;
      const validation = legacyGeometryValidation(placement.geometry, placement.geometryKind, coordinates, `${path}.geometry`);
      findings.push(...validation.findings, ...validateLabel(placement.labelX, placement.labelY, coordinates, `${path}.label`));
      if (!entryBySlug.has(placement.entrySlug)) findings.push(atlasFinding("ERROR", "PLACEMENT_ENTRY_MISSING", path, "Placement references a missing canonical entry."));
      if (validation.geometry?.type === "POLYGON" || validation.geometry?.type === "MULTIPOLYGON") exactFeatures.push({ mapSlug: map.slug, featureKey: placement.entrySlug, geometry: validation.geometry });
      return {
        mapSlug: map.slug,
        placementKey: `${map.slug}:${placement.entrySlug}`,
        entrySlug: placement.entrySlug,
        entryTitle: placement.entryTitle,
        entryStatus: placement.entryStatus,
        placeType: placement.placeType,
        parentSlug: placement.parentSlug,
        geometryKind: placement.geometryKind,
        geometry: canonicalizeAtlasJson(placement.geometry),
        childSceneSlug: childSceneByOwner.get(placement.entrySlug) ?? null,
        label: placement.labelX === null || placement.labelY === null ? null : [placement.labelX, placement.labelY],
        labelAnchorPresent: placement.labelX !== null && placement.labelY !== null,
        minZoom: placement.minZoom,
        maxZoom: placement.maxZoom,
        priority: placement.priority,
        findings: sortFindings([...validation.findings, ...validateLabel(placement.labelX, placement.labelY, coordinates, `${path}.label`)]),
      };
    }).sort((left, right) => left.entrySlug.localeCompare(right.entrySlug));

    const nodePlacementReports = map.nodePlacements.map((placement) => {
      const path = `maps.${map.slug}.nodePlacements.${placement.arcSlug}.${placement.nodeKey}`;
      const validation = legacyGeometryValidation(placement.geometry, placement.geometryKind, coordinates, `${path}.geometry`);
      findings.push(...validation.findings, ...validateLabel(placement.labelX, placement.labelY, coordinates, `${path}.label`));
      if (!placement.nodeId || !placement.arcId) findings.push(atlasFinding("ERROR", "QUEST_PLACEMENT_ORPHAN", path, "Quest placement is missing its node or arc relation."));
      return {
        mapSlug: map.slug,
        placementKey: `${map.slug}:${placement.arcSlug}:${placement.nodeKey}`,
        arcSlug: placement.arcSlug,
        arcStatus: placement.arcStatus,
        nodeKey: placement.nodeKey,
        nodeTitle: placement.nodeTitle,
        nodeStatus: placement.nodeStatus,
        geometryKind: placement.geometryKind,
        geometry: canonicalizeAtlasJson(placement.geometry),
        label: placement.labelX === null || placement.labelY === null ? null : [placement.labelX, placement.labelY],
        minZoom: placement.minZoom,
        maxZoom: placement.maxZoom,
        priority: placement.priority,
        findings: sortFindings([...validation.findings, ...validateLabel(placement.labelX, placement.labelY, coordinates, `${path}.label`)]),
      };
    }).sort((left, right) => left.arcSlug.localeCompare(right.arcSlug) || left.nodeKey.localeCompare(right.nodeKey));

    mapReports.push({
      slug: map.slug,
      title: map.title,
      parentSlug: map.parentSlug,
      childSlugs: [...map.childSlugs].sort(),
      ownerEntrySlug: map.ownerEntrySlug,
      artworkIdentity: `${map.slug}:${map.artVersion}`,
      artwork: {
        ...artwork,
        declaredWidth: map.imageWidth,
        declaredHeight: map.imageHeight,
        decodedAspectRatio,
        declaredAspectRatio,
        expectedCoordinateHeight,
        dimensionStatus,
      },
      coordinateExtent: { width: map.coordinateWidth, height: map.coordinateHeight, origin: "TOP_LEFT" },
      placePlacementCount: placementReports.length,
      questNodePlacementCount: nodePlacementReports.length,
      totalFeatureCount: placementReports.length + nodePlacementReports.length,
      placements: placementReports,
      nodePlacements: nodePlacementReports,
    });
  }

  const regions = source.entries.filter((entry) => entry.kind === "REGION").sort((left, right) => left.slug.localeCompare(right.slug));
  const placeReports = regions.map((entry) => {
    const meta = record(entry.meta);
    const parentSlug = text(meta?.parent);
    const scenes = source.maps.filter((map) => map.placements.some((placement) => placement.entrySlug === entry.slug)).map((map) => map.slug).sort();
    const unplaced = scenes.length === 0;
    const parentResolves = parentSlug === null || entryBySlug.get(parentSlug)?.kind === "REGION";
    const childSceneSlug = childSceneByOwner.get(entry.slug) ?? null;
    const childSceneResolves = childSceneSlug === null || mapBySlug.has(childSceneSlug);
    if (unplaced) findings.push(atlasFinding("INFO", "PLACE_UNPLACED", `places.${entry.slug}`, `Canonical place "${entry.slug}" is intentionally visible as unplaced; no placement was created.`));
    if (!parentResolves) findings.push(atlasFinding("ERROR", "PLACE_PARENT_UNRESOLVED", `places.${entry.slug}.parent`, `Parent "${parentSlug}" does not resolve to a canonical place.`));
    if (!childSceneResolves) findings.push(atlasFinding("ERROR", "PLACE_CHILD_SCENE_UNRESOLVED", `places.${entry.slug}.childScene`, "Child scene does not resolve."));
    const duplicateScenes = scenes.filter((scene, index) => scenes.indexOf(scene) !== index);
    if (duplicateScenes.length) findings.push(atlasFinding("ERROR", "PLACE_DUPLICATE_PLACEMENT", `places.${entry.slug}`, "Place has conflicting duplicate placements in one scene."));
    return { slug: entry.slug, title: entry.title, status: entry.status, placeType: text(meta?.type), parentSlug, parentResolves, childSceneSlug, childSceneResolves, scenes, unplaced, duplicateScenes };
  });

  const legacyConnections = inspectLegacyConnections(source.entries, findings);
  const geometryAnalysis = analyzeExactSharedAtlasGeometry(exactFeatures);
  if (geometryAnalysis.truncated) findings.push(atlasFinding("FATAL", "GEOMETRY_ANALYSIS_LIMIT", "geometryAnalysis", "Exact segment analysis exceeded its safe bounded limit; results are incomplete."));
  findings.push(atlasFinding("INFO", "V1_TOPOLOGY_ABSENT", "geometryAnalysis", `V1 contains ${geometryAnalysis.polygonFeatures} independent polygon features; exact equality found ${geometryAnalysis.exactSharedVertices.length} shared vertices and ${geometryAnalysis.exactSharedUndirectedSegments.length} shared undirected segments. These are not persisted shared topology.`));
  if (Object.values(geometryAnalysis.intersections).some((count) => count > 0)) findings.push(atlasFinding("INFO", "V1_SEGMENT_INTERSECTIONS", "geometryAnalysis", "Exact segment intersections are reported for review; gap detection is not implemented or claimed."));

  const summary = {
    maps: source.maps.length,
    placeEntries: regions.length,
    placePlacements: source.maps.reduce((sum, map) => sum + map.placements.length, 0),
    questNodePlacements: source.maps.reduce((sum, map) => sum + map.nodePlacements.length, 0),
    totalPlacements: source.maps.reduce((sum, map) => sum + map.placements.length + map.nodePlacements.length, 0),
    unplacedPlaceEntries: placeReports.filter((place) => place.unplaced).length,
    legacyConnections: legacyConnections.length,
    placePolygons: geometryAnalysis.polygonFeatures,
    exactSharedVertices: geometryAnalysis.exactSharedVertices.length,
    exactSharedDirectedSegments: geometryAnalysis.exactSharedDirectedSegments.length,
    exactSharedUndirectedSegments: geometryAnalysis.exactSharedUndirectedSegments.length,
  };
  for (const [key, expected] of Object.entries(prompt2ReviewBaseline)) {
    const actual = summary[key as keyof typeof prompt2ReviewBaseline];
    if (actual !== expected) findings.push(atlasFinding("WARNING", "BASELINE_INVENTORY_DRIFT", `summary.${key}`, `Prompt 1 review baseline was ${expected}; current read-only inventory is ${actual}.`));
  }

  return {
    contract: atlasIntegrityAuditContract,
    contractVersion: atlasIntegrityAuditContractVersion,
    summary,
    maps: mapReports,
    places: placeReports,
    legacyConnections,
    geometryAnalysis,
    semanticMetadata: inspectSemanticReferences(source.entries),
    findings: sortFindings(findings),
  };
}

export type AtlasGeometryMigrationManifest = {
  readonly contract: typeof atlasGeometryManifestContract;
  readonly contractVersion: typeof atlasMigrationManifestVersion;
  readonly source: "StoryMapPlacement";
  readonly records: readonly unknown[];
};

export type AtlasConnectionMigrationManifest = {
  readonly contract: typeof atlasConnectionManifestContract;
  readonly contractVersion: typeof atlasMigrationManifestVersion;
  readonly source: "StoryEntry(kind=REGION).meta.connections";
  readonly records: readonly unknown[];
};

export function buildAtlasMigrationManifests(audit: AtlasIntegrityAudit) {
  const geometryRecords = (audit.maps as Array<{ slug: string; placements: Array<Record<string, unknown>> }>).flatMap((map) => map.placements.map((placement) => {
    const source = {
      mapSlug: map.slug,
      entrySlug: placement.entrySlug,
      placementKey: placement.placementKey,
      geometryKind: placement.geometryKind,
      geometry: placement.geometry,
      label: placement.label,
      minZoom: placement.minZoom,
      maxZoom: placement.maxZoom,
      priority: placement.priority,
      entryStatus: placement.entryStatus,
      childSceneSlug: placement.childSceneSlug,
    };
    return { ...source, fingerprint: fingerprintAtlasSource(source) };
  })).sort((left, right) => String(left.mapSlug).localeCompare(String(right.mapSlug)) || String(left.entrySlug).localeCompare(String(right.entrySlug)));
  const connectionRecords = audit.legacyConnections.map((row) => ({
    sourceSlug: row.sourceSlug,
    stableLocator: row.locator,
    sourceArrayIndex: row.sourceArrayIndex,
    original: row.original,
    resolvedTargetSlug: row.resolvedTargetSlug,
    endpointStatus: row.endpointStatus,
    endpointMethod: row.endpointMethod,
    candidateType: row.candidateType,
    candidateDirectionality: row.candidateDirectionality,
    reciprocalCandidates: row.reciprocalCandidates,
    ambiguous: row.ambiguous,
    ambiguityNotes: row.ambiguityNotes,
    fingerprint: row.fingerprint,
  })).sort((left, right) => left.sourceSlug.localeCompare(right.sourceSlug) || left.sourceArrayIndex - right.sourceArrayIndex);
  return {
    geometry: { contract: atlasGeometryManifestContract, contractVersion: atlasMigrationManifestVersion, source: "StoryMapPlacement", records: geometryRecords } satisfies AtlasGeometryMigrationManifest,
    connections: { contract: atlasConnectionManifestContract, contractVersion: atlasMigrationManifestVersion, source: "StoryEntry(kind=REGION).meta.connections", records: connectionRecords } satisfies AtlasConnectionMigrationManifest,
  };
}

export function renderAtlasIntegrityReport(audit: AtlasIntegrityAudit) {
  const counts = Object.fromEntries(["INFO", "WARNING", "ERROR", "FATAL"].map((severity) => [severity, audit.findings.filter((finding) => finding.severity === severity).length]));
  const lines = [
    `Martino Atlas integrity audit v${audit.contractVersion}`,
    `Maps ${audit.summary.maps} | places ${audit.summary.placeEntries} | place placements ${audit.summary.placePlacements} | quest placements ${audit.summary.questNodePlacements}`,
    `Unplaced ${audit.summary.unplacedPlaceEntries} | legacy connections ${audit.summary.legacyConnections} | polygons ${audit.summary.placePolygons}`,
    `Exact shared vertices ${audit.summary.exactSharedVertices} | directed segments ${audit.summary.exactSharedDirectedSegments} | undirected segments ${audit.summary.exactSharedUndirectedSegments}`,
    `Findings INFO ${counts.INFO} | WARNING ${counts.WARNING} | ERROR ${counts.ERROR} | FATAL ${counts.FATAL}`,
    "",
  ];
  for (const map of audit.maps as Array<{ slug: string; artwork: { decodedWidth: number | null; decodedHeight: number | null; declaredWidth: number; declaredHeight: number; dimensionStatus: string }; placePlacementCount: number; questNodePlacementCount: number }>) {
    lines.push(`${map.slug}: art ${map.artwork.decodedWidth ?? "?"}x${map.artwork.decodedHeight ?? "?"} declared ${map.artwork.declaredWidth}x${map.artwork.declaredHeight} [${map.artwork.dimensionStatus}], places ${map.placePlacementCount}, quests ${map.questNodePlacementCount}`);
  }
  lines.push("");
  for (const finding of audit.findings) lines.push(`${finding.severity.padEnd(7)} ${finding.code} ${finding.path} — ${finding.message}`);
  return `${lines.join("\n")}\n`;
}

export function atlasAuditExitCode(audit: AtlasIntegrityAudit, strict = false) {
  return atlasFindingsFail(audit.findings, strict) ? 1 : 0;
}
