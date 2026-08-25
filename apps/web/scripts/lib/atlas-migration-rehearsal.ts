import { createHash } from "node:crypto";
import {
  validateAtlasPoint,
  validateAtlasTopology,
  validateAtlasWorldConnection,
  type AtlasBoundary,
  type AtlasDerivedTopologyArea,
  type AtlasNumericPoint,
  type AtlasPoint,
  type AtlasTopologyArea,
  type AtlasTopologyDataset,
  type AtlasTopologyNode,
  type AtlasWorldConnection,
} from "@habitat/shared";
import {
  analyzeAtlasCanonicalTopology,
  buildAtlasCanonicalTopologyTrace,
  type AtlasCanonicalTopologyTrace,
} from "./atlas-canonical-topology";
import { canonicalizeAtlasJson, stableAtlasJson, type AtlasAuditJson } from "./atlas-integrity";

export const atlasRehearsalContract = "martino-atlas-v2-migration-rehearsal" as const;
export const atlasRehearsalVersion = 1 as const;

export type AtlasV1ConnectionRecord = {
  readonly ambiguityNotes: readonly string[];
  readonly ambiguous: boolean;
  readonly candidateDirectionality: "UNSPECIFIED";
  readonly candidateType: AtlasWorldConnection["type"];
  readonly endpointMethod: "SLUG" | "TITLE" | null;
  readonly endpointStatus: "RESOLVED" | "UNRESOLVED" | "AMBIGUOUS";
  readonly fingerprint: string;
  readonly original: Readonly<Record<string, AtlasAuditJson>> & { readonly to?: AtlasAuditJson; readonly by?: AtlasAuditJson; readonly notes?: AtlasAuditJson };
  readonly reciprocalCandidates: readonly string[];
  readonly resolvedTargetSlug: string | null;
  readonly sourceArrayIndex: number;
  readonly sourceSlug: string;
  readonly stableLocator: string;
};

export type AtlasV1ConnectionManifest = {
  readonly contract: string;
  readonly contractVersion: number;
  readonly records: readonly AtlasV1ConnectionRecord[];
};

export type AtlasV1GeometryRecord = {
  readonly entrySlug: string;
  readonly entryStatus: string;
  readonly fingerprint: string;
  readonly geometry: unknown;
  readonly geometryKind: "POINT" | "POLYGON" | "MULTIPOLYGON";
  readonly mapSlug: string;
  readonly placementKey: string;
};

export type AtlasV1GeometryManifest = {
  readonly contract: string;
  readonly contractVersion: number;
  readonly records: readonly AtlasV1GeometryRecord[];
};

export type AtlasConnectionCandidate = AtlasWorldConnection & {
  readonly provenanceKey: string;
  readonly sourceSlug: string;
  readonly targetSlug: string;
  readonly sourceArrayIndex: number;
  readonly sourceFingerprint: string;
  readonly classificationConfidence: "HIGH" | "LOW";
  readonly classificationRationale: string;
  readonly reviewStatus: "AUTO_SAFE" | "REVIEW_REQUIRED";
  readonly reciprocalCandidates: readonly string[];
  readonly originalRow: AtlasV1ConnectionRecord["original"];
};

export type AtlasAreaDisposition = "TRACED" | "POINT_ONLY" | "DEFERRED" | "OWNER_REVIEW_REQUIRED" | "PORT_ARCADIA_RECALIBRATION";

export type AtlasAreaInventoryRow = {
  readonly placementKey: string;
  readonly mapSlug: string;
  readonly entrySlug: string;
  readonly entryStatus: string;
  readonly v1GeometryKind: string;
  readonly disposition: AtlasAreaDisposition;
  readonly rationale: string;
};

export type AtlasTopologyTrace = AtlasCanonicalTopologyTrace;

function deterministicUuid(key: string) {
  const hex = createHash("sha256").update(`${atlasRehearsalContract}:${key}`).digest("hex").slice(0, 32).split("");
  hex[12] = "5";
  hex[16] = ((Number.parseInt(hex[16]!, 16) & 0x3) | 0x8).toString(16);
  const compact = hex.join("");
  return `${compact.slice(0, 8)}-${compact.slice(8, 12)}-${compact.slice(12, 16)}-${compact.slice(16, 20)}-${compact.slice(20)}`;
}

function classificationRationale(record: AtlasV1ConnectionRecord) {
  if (record.ambiguous) return `The authored route wording ${JSON.stringify(record.original.by ?? null)} has no safe controlled transport mapping; preserve it as OTHER pending owner review.`;
  const rationales: Record<AtlasWorldConnection["type"], string> = {
    ROAD: "The authored route explicitly says road.",
    TRAIL: "The authored route explicitly says trail.",
    RIVER_TRAVEL: "The authored route explicitly describes a river, waterfall, or water corridor used for travel.",
    SEA_ROUTE: "The authored route explicitly says sea.",
    AIR_ROUTE: "The authored route explicitly describes aerial transit or a skybridge.",
    OTHER: "The wording is preserved but does not map to a safer controlled type.",
    UNKNOWN: "The authored route type is unknown.",
  };
  return rationales[record.candidateType];
}

export function buildAtlasConnectionCandidates(manifest: AtlasV1ConnectionManifest) {
  const locators = new Set<string>();
  const fingerprints = new Set<string>();
  return [...manifest.records].sort((left, right) => left.stableLocator.localeCompare(right.stableLocator)).map((record) => {
    if (locators.has(record.stableLocator)) throw new Error(`Duplicate V1 connection locator ${record.stableLocator}.`);
    if (fingerprints.has(record.fingerprint)) throw new Error(`Duplicate V1 connection fingerprint ${record.fingerprint}.`);
    locators.add(record.stableLocator);
    fingerprints.add(record.fingerprint);
    if (record.endpointStatus !== "RESOLVED" || !record.resolvedTargetSlug) throw new Error(`Connection ${record.stableLocator} has no resolved target.`);
    const reviewStatus = record.ambiguous ? "REVIEW_REQUIRED" : "AUTO_SAFE";
    const originalWording = typeof record.original.by === "string" ? record.original.by : null;
    const editorialNotes = typeof record.original.notes === "string" ? record.original.notes : null;
    const metadata = {
      migration: {
        manifestContract: manifest.contract,
        manifestContractVersion: manifest.contractVersion,
        rehearsalContract: atlasRehearsalContract,
        rehearsalVersion: atlasRehearsalVersion,
        sourceSlug: record.sourceSlug,
        sourceArrayIndex: record.sourceArrayIndex,
        stableLocator: record.stableLocator,
        fingerprint: record.fingerprint,
        targetAuthored: canonicalizeAtlasJson(record.original.to ?? null),
        rawAuthoredRow: canonicalizeAtlasJson(record.original),
        classification: {
          source: "PROMPT_2_DETERMINISTIC_CLASSIFIER",
          confidence: record.ambiguous ? "LOW" : "HIGH",
          rationale: classificationRationale(record),
          reviewStatus,
        },
        reciprocalCandidates: [...record.reciprocalCandidates].sort(),
      },
    };
    const candidate: AtlasConnectionCandidate = {
      id: deterministicUuid(`connection:${record.fingerprint}`),
      fromEntryId: record.sourceSlug,
      toEntryId: record.resolvedTargetSlug,
      type: record.candidateType,
      directionality: record.candidateDirectionality,
      status: "UNSPECIFIED",
      visibility: "DEFAULT",
      originalWording,
      editorialNotes,
      metadata,
      version: 1,
      provenanceKey: record.stableLocator,
      sourceSlug: record.sourceSlug,
      targetSlug: record.resolvedTargetSlug,
      sourceArrayIndex: record.sourceArrayIndex,
      sourceFingerprint: record.fingerprint,
      classificationConfidence: record.ambiguous ? "LOW" : "HIGH",
      classificationRationale: classificationRationale(record),
      reviewStatus,
      reciprocalCandidates: [...record.reciprocalCandidates].sort(),
      originalRow: record.original,
    };
    const validation = validateAtlasWorldConnection(candidate);
    if (!validation.valid) throw new Error(`Invalid candidate ${record.stableLocator}: ${validation.findings.map((finding) => finding.code).join(", ")}`);
    return candidate;
  });
}

export function buildAtlasReciprocalGroups(candidates: readonly AtlasConnectionCandidate[]) {
  const byLocator = new Map(candidates.map((candidate) => [candidate.provenanceKey, candidate]));
  const groups = new Map<string, { left: AtlasConnectionCandidate; right: AtlasConnectionCandidate }>();
  for (const candidate of candidates) for (const peerLocator of candidate.reciprocalCandidates) {
    const peer = byLocator.get(peerLocator);
    if (!peer) throw new Error(`Missing reciprocal candidate ${peerLocator}.`);
    const key = [candidate.provenanceKey, peer.provenanceKey].sort().join("|");
    groups.set(key, candidate.provenanceKey < peer.provenanceKey ? { left: candidate, right: peer } : { left: peer, right: candidate });
  }
  return [...groups.entries()].sort(([left], [right]) => left.localeCompare(right)).map(([groupKey, group]) => ({
    groupKey,
    connectionA: { locator: group.left.provenanceKey, source: group.left.sourceSlug, target: group.left.targetSlug, wording: group.left.originalWording, fingerprint: group.left.sourceFingerprint },
    connectionB: { locator: group.right.provenanceKey, source: group.right.sourceSlug, target: group.right.targetSlug, wording: group.right.originalWording, fingerprint: group.right.sourceFingerprint },
    candidateInterpretation: group.left.type === group.right.type && !group.left.reviewStatus.includes("REVIEW") && !group.right.reviewStatus.includes("REVIEW")
      ? "LIKELY_ONE_BIDIRECTIONAL_ROUTE"
      : "UNRESOLVED",
    recommendation: "Keep both directional candidates distinct until an owner confirms merge, directionality, or distinct-route intent.",
  }));
}

export function verifyAtlasConnectionParity(manifest: AtlasV1ConnectionManifest, candidates: readonly AtlasConnectionCandidate[]) {
  const byLocator = new Map<string, AtlasConnectionCandidate[]>();
  for (const candidate of candidates) byLocator.set(candidate.provenanceKey, [...(byLocator.get(candidate.provenanceKey) ?? []), candidate]);
  const missing = manifest.records.filter((record) => !byLocator.has(record.stableLocator)).map((record) => record.stableLocator);
  const duplicates = [...byLocator].filter(([, rows]) => rows.length !== 1).map(([locator]) => locator);
  const alteredWording = manifest.records.flatMap((record) => {
    const candidate = byLocator.get(record.stableLocator)?.[0];
    const wording = typeof record.original.by === "string" ? record.original.by : null;
    const notes = typeof record.original.notes === "string" ? record.original.notes : null;
    return candidate && (candidate.originalWording !== wording || candidate.editorialNotes !== notes || stableAtlasJson(candidate.originalRow, false) !== stableAtlasJson(record.original, false)) ? [record.stableLocator] : [];
  });
  const fingerprintMismatches = manifest.records.flatMap((record) => byLocator.get(record.stableLocator)?.[0]?.sourceFingerprint === record.fingerprint ? [] : [record.stableLocator]);
  return {
    legacyRows: manifest.records.length,
    v2Candidates: candidates.length,
    resolvedEndpoints: candidates.filter((candidate) => candidate.toEntryId.length > 0).length,
    exactProvenance: candidates.filter((candidate) => candidate.provenanceKey.length > 0 && candidate.sourceFingerprint.length === 64).length,
    autoClassified: candidates.filter((candidate) => candidate.reviewStatus === "AUTO_SAFE").length,
    typeReviewRequired: candidates.filter((candidate) => candidate.reviewStatus === "REVIEW_REQUIRED").length,
    missing,
    duplicates,
    alteredWording,
    fingerprintMismatches,
    dropped: missing.length,
    unexpectedDuplicates: duplicates.length,
    valid: missing.length === 0 && duplicates.length === 0 && alteredWording.length === 0 && fingerprintMismatches.length === 0 && candidates.length === manifest.records.length,
  };
}

const inventoryDecisions: Readonly<Record<string, { disposition: AtlasAreaDisposition; rationale: string }>> = {
  "martino-world:high-cliffs": { disposition: "TRACED", rationale: "Prompt 6 approves a deterministic alpine shell using the frozen V2 coastline, shared Grand Lake shoreline, cliff lip, and exact Grand Rift/Riverlands/Magic-Torn junctions." },
  "martino-world:grand-lake": { disposition: "TRACED", rationale: "The frozen V2 shoreline is a closed water shell shared in reverse by the High Cliffs hole." },
  "martino-world:grand-rift": { disposition: "TRACED", rationale: "Prompt 6 locks one top-level outer rift shell independently of the nested Death Canyon boundary." },
  "martino-world:death-canyon": { disposition: "TRACED", rationale: "Prompt 6 locks a validated 23-point nested shell wholly inside Grand Rift and disjoint from Red Forest." },
  "martino-world:the-red-forest": { disposition: "TRACED", rationale: "The owner-approved Red Forest is one contiguous top-level shell adjacent to Grand Rift, Riverlands, and Desert." },
  "martino-world:the-desert": { disposition: "TRACED", rationale: "The canonical shell follows the western coast, rift wall, crimson transition, and a short Riverlands cartographic edge without creating a river-corridor hole." },
  "martino-world:riverlands": { disposition: "TRACED", rationale: "The central shell is assembled entirely from shared neighboring boundaries and exact multi-region junctions." },
  "martino-world:magic-torn-wasteland": { disposition: "TRACED", rationale: "The canonical shell follows the northeastern coast and defensible anomaly transitions to High Cliffs, Riverlands, and Unknown Southeast." },
  "martino-world:unknown-southeast": { disposition: "TRACED", rationale: "Only the geographic selection footprint is locked; the cloud-veiled territory receives no invented biome, faction, or settlement lore." },
  "martino-world:the-peninsula": { disposition: "TRACED", rationale: "The canonical shell preserves the established coastline and uses one exact Riverlands boundary across the northern neck." },
  "martino-world:the-floating-city": { disposition: "POINT_ONLY", rationale: "Canonical settlement marker, not base partition geography." },
  "martino-world:port-arcadia": { disposition: "POINT_ONLY", rationale: "Canonical city marker with its own child scene." },
  "martino-world:the-starting-island": { disposition: "POINT_ONLY", rationale: "Canonical island destination marker with its own child scene." },
  "martino-world:the-ocean": { disposition: "POINT_ONLY", rationale: "Water context marker; no fictional ocean partition is required." },
  "martino-starting-island:riftwood-interior": { disposition: "OWNER_REVIEW_REQUIRED", rationale: "The breach-scarred interior is visible, but lore describes a forest armies route around rather than a settled legal boundary." },
  "martino-port-arcadia:exclusion-area": { disposition: "PORT_ARCADIA_RECALIBRATION", rationale: "Area tracing is blocked by the decoded/declared artwork aspect-ratio mismatch." },
  "martino-port-arcadia:upper-westside": { disposition: "PORT_ARCADIA_RECALIBRATION", rationale: "Area tracing is blocked by the decoded/declared artwork aspect-ratio mismatch." },
  "martino-port-arcadia:lower-westside": { disposition: "PORT_ARCADIA_RECALIBRATION", rationale: "Area tracing is blocked by the decoded/declared artwork aspect-ratio mismatch." },
  "martino-port-arcadia:the-northside": { disposition: "PORT_ARCADIA_RECALIBRATION", rationale: "Area tracing is blocked by the decoded/declared artwork aspect-ratio mismatch." },
  "martino-port-arcadia:the-southside": { disposition: "PORT_ARCADIA_RECALIBRATION", rationale: "Area tracing is blocked by the decoded/declared artwork aspect-ratio mismatch." },
  "martino-port-arcadia:waterfront-district": { disposition: "PORT_ARCADIA_RECALIBRATION", rationale: "Area tracing is blocked by the decoded/declared artwork aspect-ratio mismatch." },
  "martino-port-arcadia:east-side": { disposition: "PORT_ARCADIA_RECALIBRATION", rationale: "Area tracing is blocked by the decoded/declared artwork aspect-ratio mismatch." },
};

export function buildAtlasAreaInventory(manifest: AtlasV1GeometryManifest) {
  return [...manifest.records].sort((left, right) => left.placementKey.localeCompare(right.placementKey)).map((record): AtlasAreaInventoryRow => {
    const explicit = inventoryDecisions[record.placementKey];
    const fallback = record.geometryKind === "POINT"
      ? { disposition: "POINT_ONLY" as const, rationale: "Existing point placement is not base partition geography." }
      : record.mapSlug === "martino-starting-island"
        ? { disposition: "POINT_ONLY" as const, rationale: "This settlement, fort, landing, or site is cartographically a marker; its V1 polygon is not canonical base geography." }
        : { disposition: "DEFERRED" as const, rationale: "No defensible reviewed topology trace exists yet." };
    const decision = explicit ?? fallback;
    return { placementKey: record.placementKey, mapSlug: record.mapSlug, entrySlug: record.entrySlug, entryStatus: record.entryStatus, v1GeometryKind: record.geometryKind, ...decision };
  });
}

const worldDimensions = { width: 100_000, height: 66_667 } as const;

function atlasPoint(position: AtlasNumericPoint): AtlasPoint {
  const result = validateAtlasPoint(position, worldDimensions);
  if (!result.ok) throw new Error(`Invalid manual trace point ${position.join(",")}: ${result.issue}.`);
  return result.value;
}

function node(locator: string, position: AtlasNumericPoint): AtlasTopologyNode {
  return { id: deterministicUuid(`topology-node:${locator}`), mapSlug: "martino-world", position: atlasPoint(position), version: 1 };
}

/** @deprecated Prompt 4 forensic trace only. Rehearsal and artifacts use the canonical Prompt 6 builder. */
export function buildAtlasLegacyPrompt4TopologyTrace() {
  const nodesByLocator = {
    "high-cliffs.outer.northwest": node("high-cliffs.outer.northwest", [24_000, 1_500]),
    "high-cliffs.outer.northeast": node("high-cliffs.outer.northeast", [73_000, 1_500]),
    "high-cliffs.outer.southeast": node("high-cliffs.outer.southeast", [66_000, 19_000]),
    "high-cliffs.outer.southwest": node("high-cliffs.outer.southwest", [32_000, 19_000]),
    "grand-lake.northwest": node("grand-lake.northwest", [37_000, 5_500]),
    "grand-lake.northeast": node("grand-lake.northeast", [59_000, 5_500]),
    "grand-lake.southeast": node("grand-lake.southeast", [57_000, 14_500]),
    "grand-lake.southwest": node("grand-lake.southwest", [39_000, 14_500]),
  } as const;
  const boundary = (locator: string, start: keyof typeof nodesByLocator, end: keyof typeof nodesByLocator, kind: AtlasBoundary["kind"], interiorVertices: readonly AtlasNumericPoint[]): AtlasBoundary => ({
    id: deterministicUuid(`boundary:${locator}`), mapSlug: "martino-world", startNodeId: nodesByLocator[start].id, endNodeId: nodesByLocator[end].id, kind, interiorVertices: interiorVertices.map(atlasPoint), version: 1,
  });
  const boundariesByLocator = {
    "high-cliffs.outer.north-coast": boundary("high-cliffs.outer.north-coast", "high-cliffs.outer.northwest", "high-cliffs.outer.northeast", "COAST", [[35_000, 800], [50_000, 500], [64_000, 900]]),
    "high-cliffs.outer.east-transition": boundary("high-cliffs.outer.east-transition", "high-cliffs.outer.northeast", "high-cliffs.outer.southeast", "INTERNAL_BORDER", [[72_000, 7_000], [70_000, 13_000]]),
    "high-cliffs.outer.south-cliff": boundary("high-cliffs.outer.south-cliff", "high-cliffs.outer.southeast", "high-cliffs.outer.southwest", "INTERNAL_BORDER", [[59_000, 17_500], [50_000, 18_500], [41_000, 17_500]]),
    "high-cliffs.outer.west-transition": boundary("high-cliffs.outer.west-transition", "high-cliffs.outer.southwest", "high-cliffs.outer.northwest", "INTERNAL_BORDER", [[29_000, 14_000], [26_000, 9_000]]),
    "grand-lake.shore.north": boundary("grand-lake.shore.north", "grand-lake.northwest", "grand-lake.northeast", "WATER_BOUNDARY", [[44_000, 4_800], [52_000, 4_700]]),
    "grand-lake.shore.east": boundary("grand-lake.shore.east", "grand-lake.northeast", "grand-lake.southeast", "WATER_BOUNDARY", [[60_000, 8_500], [59_000, 12_000]]),
    "grand-lake.shore.south": boundary("grand-lake.shore.south", "grand-lake.southeast", "grand-lake.southwest", "WATER_BOUNDARY", [[51_000, 15_500], [44_000, 15_400]]),
    "grand-lake.shore.west": boundary("grand-lake.shore.west", "grand-lake.southwest", "grand-lake.northwest", "WATER_BOUNDARY", [[37_000, 12_000], [36_000, 8_500]]),
  } as const;
  const refs = (locators: readonly (keyof typeof boundariesByLocator)[], reversed = false) => locators.map((locator, sequence) => ({ boundaryId: boundariesByLocator[locator].id, sequence, reversed }));
  const highCliffsId = deterministicUuid("area:martino-world:high-cliffs");
  const grandLakeId = deterministicUuid("area:martino-world:grand-lake");
  const areas: AtlasTopologyArea[] = [
    {
      id: highCliffsId, mapSlug: "martino-world", layerKind: "BASE_GEOGRAPHY", version: 1,
      rings: [
        { id: deterministicUuid("ring:martino-world:high-cliffs:0:0"), componentIndex: 0, role: "SHELL", boundaries: refs(["high-cliffs.outer.north-coast", "high-cliffs.outer.east-transition", "high-cliffs.outer.south-cliff", "high-cliffs.outer.west-transition"]) },
        { id: deterministicUuid("ring:martino-world:high-cliffs:0:1"), componentIndex: 0, role: "HOLE", boundaries: refs(["grand-lake.shore.west", "grand-lake.shore.south", "grand-lake.shore.east", "grand-lake.shore.north"], true) },
      ],
    },
    {
      id: grandLakeId, mapSlug: "martino-world", layerKind: "BASE_GEOGRAPHY", version: 1,
      rings: [{ id: deterministicUuid("ring:martino-world:grand-lake:0:0"), componentIndex: 0, role: "SHELL", boundaries: refs(["grand-lake.shore.north", "grand-lake.shore.east", "grand-lake.shore.south", "grand-lake.shore.west"]) }],
    },
  ];
  const dataset: AtlasTopologyDataset = { nodes: Object.values(nodesByLocator), boundaries: Object.values(boundariesByLocator), areas };
  const validation = validateAtlasTopology(dataset, { width: 100_000, height: 66_667 });
  if (!validation.valid) throw new Error(`Manual topology trace is invalid: ${validation.findings.map((finding) => `${finding.code}:${finding.path}`).join(", ")}`);
  return {
    contract: "martino-atlas-v2-manual-topology-trace",
    contractVersion: 1,
    traceVersion: 1,
    coordinateSource: "MANUAL_APPROVED_ARTWORK_TRACE",
    maps: [{
      mapSlug: "martino-world",
      artworkIdentity: "martino-world:v1",
      dimensions: { width: 100_000, height: 66_667 } as const,
      dataset,
      nodeLocators: Object.fromEntries(Object.entries(nodesByLocator).map(([locator, value]) => [value.id, locator])),
      boundaryLocators: Object.fromEntries(Object.entries(boundariesByLocator).map(([locator, value]) => [value.id, locator])),
      areaEntrySlugs: { [highCliffsId]: "high-cliffs", [grandLakeId]: "grand-lake" },
      reviews: [
        { locator: "grand-lake.shore", mapSlug: "martino-world", entrySlugs: ["grand-lake", "high-cliffs"], confidence: "HIGH", evidence: "The approved artwork shows a distinct elevated blue lake, and canonical lore places it inside the High Cliffs.", ownerDecision: null },
        { locator: "high-cliffs.outer.north-coast", mapSlug: "martino-world", entrySlugs: ["high-cliffs"], confidence: "MEDIUM", evidence: "The northern coastline and alpine crown are visually clear; the exact endpoints where the crown yields to neighboring regions remain interpretive.", ownerDecision: "Approve or move the northwest/northeast endpoints of the High Cliffs coast segment." },
        { locator: "high-cliffs.outer.west-transition", mapSlug: "martino-world", entrySlugs: ["high-cliffs", "grand-rift"], confidence: "OWNER_REVIEW_REQUIRED", evidence: "The mountain mass yields to broken rift country, but the artwork does not declare a legal/geographic line.", ownerDecision: "Define whether the visible ridge, watershed, or another lore boundary owns this transition." },
        { locator: "high-cliffs.outer.south-cliff", mapSlug: "martino-world", entrySlugs: ["high-cliffs", "riverlands"], confidence: "OWNER_REVIEW_REQUIRED", evidence: "The cliff edge and waterfalls are visible, while river valleys penetrate the heights.", ownerDecision: "Confirm whether the cliff lip, watershed, or valley mouths define the regional boundary." },
        { locator: "high-cliffs.outer.east-transition", mapSlug: "martino-world", entrySlugs: ["high-cliffs", "magic-torn-wasteland"], confidence: "OWNER_REVIEW_REQUIRED", evidence: "Alpine rock transitions into purple reality-torn terrain without a single authored line.", ownerDecision: "Choose the canonical transition through the northeastern mountain approaches." },
      ],
    }],
    startingIsland: { mapSlug: "martino-starting-island", status: "OWNER_REVIEW_REQUIRED", reason: "Current named placements are settlements, sites, forts, and one broad Riftwood zone. The artwork does not establish a base-geography partition that can be traced without inventing borders." },
    portArcadia: { mapSlug: "martino-port-arcadia", status: "RECALIBRATION_REQUIRED", decodedArtwork: "1599x984", declaredContract: "1536x1024" },
  };
}

/** @deprecated Prompt 4 forensic metrics only. */
export function analyzeAtlasLegacyPrompt4TopologyTrace(trace: ReturnType<typeof buildAtlasLegacyPrompt4TopologyTrace>) {
  const map = trace.maps[0];
  const validation = validateAtlasTopology(map.dataset, map.dimensions);
  const nodeUse = new Map(map.dataset.nodes.map((node) => [node.id, 0]));
  const boundaryUse = new Map(map.dataset.boundaries.map((boundary) => [boundary.id, 0]));
  for (const boundary of map.dataset.boundaries) {
    nodeUse.set(boundary.startNodeId, (nodeUse.get(boundary.startNodeId) ?? 0) + 1);
    nodeUse.set(boundary.endNodeId, (nodeUse.get(boundary.endNodeId) ?? 0) + 1);
  }
  for (const area of map.dataset.areas) for (const ring of area.rings) for (const reference of ring.boundaries) boundaryUse.set(reference.boundaryId, (boundaryUse.get(reference.boundaryId) ?? 0) + 1);
  return {
    mapSlug: map.mapSlug,
    tracedAreas: map.dataset.areas.length,
    topologyNodes: map.dataset.nodes.length,
    boundaries: map.dataset.boundaries.length,
    sharedBoundaries: [...boundaryUse.values()].filter((count) => count === 2).length,
    internalBoundariesConsumedByTwoAreas: map.dataset.boundaries.filter((boundary) => boundary.kind === "INTERNAL_BORDER" && boundaryUse.get(boundary.id) === 2).length,
    sharedWaterBoundariesConsumedByTwoAreas: map.dataset.boundaries.filter((boundary) => boundary.kind === "WATER_BOUNDARY" && boundaryUse.get(boundary.id) === 2).length,
    coastBoundaries: map.dataset.boundaries.filter((boundary) => boundary.kind === "COAST").length,
    shells: map.dataset.areas.flatMap((area) => area.rings).filter((ring) => ring.role === "SHELL").length,
    holes: map.dataset.areas.flatMap((area) => area.rings).filter((ring) => ring.role === "HOLE").length,
    components: map.dataset.areas.reduce((count, area) => count + new Set(area.rings.map((ring) => ring.componentIndex)).size, 0),
    orphanNodes: [...nodeUse.values()].filter((count) => count === 0).length,
    unusedBoundaries: [...boundaryUse.values()].filter((count) => count === 0).length,
    oneSidedInternalBoundaries: map.dataset.boundaries.filter((boundary) => boundary.kind === "INTERNAL_BORDER" && boundaryUse.get(boundary.id) === 1).length,
    reviewRequiredBoundaries: map.reviews.filter((review) => review.confidence === "OWNER_REVIEW_REQUIRED").length,
    validationFailures: validation.findings.filter((finding) => finding.severity === "ERROR" || finding.severity === "FATAL"),
    completeGapValidationClaimed: false,
    derivedAreas: validation.value ?? [] as readonly AtlasDerivedTopologyArea[],
  };
}

export const buildAtlasManualTopologyTrace = buildAtlasCanonicalTopologyTrace;
export const analyzeAtlasTopologyTrace = analyzeAtlasCanonicalTopology;

function ringMeasure(points: readonly (readonly [number, number])[]) {
  let twiceArea = 0;
  let centroidX = 0;
  let centroidY = 0;
  for (let index = 1; index < points.length; index += 1) {
    const from = points[index - 1]!;
    const to = points[index]!;
    const cross = from[0] * to[1] - to[0] * from[1];
    twiceArea += cross;
    centroidX += (from[0] + to[0]) * cross;
    centroidY += (from[1] + to[1]) * cross;
  }
  const area = twiceArea / 2;
  return { area: Math.abs(area), centroid: area === 0 ? [0, 0] as const : [Math.round(centroidX / (6 * area)), Math.round(centroidY / (6 * area))] as const };
}

function geometryDiagnostic(geometry: unknown) {
  const candidate = geometry as { type?: unknown; coordinates?: unknown };
  if (candidate.type !== "POLYGON" || !Array.isArray(candidate.coordinates) || !Array.isArray(candidate.coordinates[0])) return null;
  const rings = candidate.coordinates as Array<Array<[number, number]>>;
  const shell = ringMeasure(rings[0]!);
  const holes = rings.slice(1).map(ringMeasure);
  const points = rings.flat();
  return {
    bounds: { minX: Math.min(...points.map((point) => point[0])), minY: Math.min(...points.map((point) => point[1])), maxX: Math.max(...points.map((point) => point[0])), maxY: Math.max(...points.map((point) => point[1])) },
    centroid: shell.centroid,
    approximateArea: Math.round(shell.area - holes.reduce((sum, hole) => sum + hole.area, 0)),
    holes: holes.length,
  };
}

export function buildAtlasGeometryComparisons(manifest: AtlasV1GeometryManifest, trace: AtlasTopologyTrace) {
  const topology = analyzeAtlasTopologyTrace(trace);
  const map = trace.maps[0];
  const rationale: Record<string, { included: readonly string[]; excluded: readonly string[]; reason: string }> = {
    "death-canyon": { included: ["toxic green fissure", "broken inner canyon shelves"], excluded: ["Grand Rift outer shelves", "Red Forest canopy"], reason: "V2 replaces the broad V1 approximation with a validated 23-point nested shell wholly inside Grand Rift." },
    "grand-rift": { included: ["complete outer rupture", "rift walls and exposed shelves"], excluded: ["adjacent Red Forest", "nested Death Canyon as a peer partition"], reason: "V2 locks one closed top-level outer shell while retaining Death Canyon as contained child geography." },
    "high-cliffs": { included: ["northern alpine crown", "visible waterfall cliff"], excluded: ["Grand Lake water surface, represented as a shared-boundary hole"], reason: "V2 follows the frozen artwork's alpine mass and models Grand Lake as a true hole/shared neighbor instead of reproducing overlapping V1 lake and cliff polygons." },
    "grand-lake": { included: ["elevated blue lake", "Floating City marker vicinity"], excluded: ["surrounding alpine rock"], reason: "V2 follows the visible shoreline and shares it exactly with the High Cliffs hole; it does not reuse V1 vertices." },
    "magic-torn-wasteland": { included: ["northeastern anomaly terrain", "shielded-city region"], excluded: ["High Cliffs", "cloud-veiled Unknown Southeast"], reason: "V2 follows the frozen coastline and defensible reality-fracture transitions through exact shared boundaries." },
    "riverlands": { included: ["central lowlands", "connected watershed"], excluded: ["river corridors as independent regions"], reason: "V2 closes the central partition entirely from reused neighbor edges while allowing painted rivers to cross cartographic transitions." },
    "the-desert": { included: ["western arid landmass", "oasis corridor context"], excluded: ["river corridor as a hole"], reason: "V2 follows the coast, rift wall, forest transition, and shared Riverlands edge without duplicating neighboring borders." },
    "the-peninsula": { included: ["long south-central landform", "Port Arcadia world anchor"], excluded: ["child-scene district topology"], reason: "V2 preserves the coastline and closes the landform with one exact shared Riverlands neck boundary." },
    "the-red-forest": { included: ["one contiguous crimson selection footprint"], excluded: ["disconnected visual feathering", "Grand Rift and Death Canyon overlap"], reason: "V2 implements the owner decision that Red Forest is one top-level neighbor of Grand Rift, Riverlands, and Desert." },
    "unknown-southeast": { included: ["current cloud-veiled geographic footprint"], excluded: ["new biome, faction, city, or narrative lore"], reason: "V2 defines selection geometry only and shares exact borders with Magic-Torn Wasteland and Riverlands." },
  };
  return Object.entries(map.areaEntrySlugs).sort(([, left], [, right]) => left.localeCompare(right)).map(([areaId, entrySlug]) => {
    const v1 = manifest.records.find((record) => record.mapSlug === map.mapSlug && record.entrySlug === entrySlug);
    const v2 = topology.derivedAreas.find((area) => area.areaId === areaId);
    if (!v1 || !v2) throw new Error(`Missing V1/V2 geometry comparison input for ${entrySlug}.`);
    const before = geometryDiagnostic(v1.geometry);
    const after = geometryDiagnostic(v2.geometry);
    if (!before || !after) throw new Error(`Unsupported comparison geometry for ${entrySlug}.`);
    const decision = rationale[entrySlug];
    if (!decision) throw new Error(`Missing Prompt 6 comparison rationale for ${entrySlug}.`);
    return { mapSlug: map.mapSlug, entrySlug, v1Fingerprint: v1.fingerprint, v1: before, v2: after, centroidDelta: [after.centroid[0] - before.centroid[0], after.centroid[1] - before.centroid[1]], ...decision };
  });
}

export function assertAtlasRehearsalTarget(sourceValue: string, targetValue: string) {
  const source = new URL(sourceValue);
  const target = new URL(targetValue);
  const identity = (url: URL) => `${url.protocol}//${url.hostname.toLowerCase()}:${url.port || "5432"}/${url.pathname.slice(1).split("?")[0]}`;
  if (identity(source) === identity(target)) throw new Error("Refusing Atlas rehearsal writes: target matches the active canonical database.");
  if (!["localhost", "127.0.0.1", "::1"].includes(target.hostname)) throw new Error("Atlas rehearsal writes require an isolated local PostgreSQL target.");
  const database = target.pathname.slice(1).split("?")[0] ?? "";
  if (!/^habitat_atlas_p4_rehearsal_[a-z0-9_]+$/.test(database)) throw new Error("Atlas rehearsal target must use the habitat_atlas_p4_rehearsal_ database prefix.");
  return { sourceDatabase: source.pathname.slice(1).split("?")[0], targetDatabase: database };
}

export function buildAtlasRehearsalPlan(connectionManifest: AtlasV1ConnectionManifest, geometryManifest: AtlasV1GeometryManifest) {
  const connectionCandidates = buildAtlasConnectionCandidates(connectionManifest);
  const connectionParity = verifyAtlasConnectionParity(connectionManifest, connectionCandidates);
  if (!connectionParity.valid) throw new Error(`Connection migration parity failed: ${stableAtlasJson(connectionParity, false)}`);
  const topologyTrace = buildAtlasManualTopologyTrace();
  return {
    contract: atlasRehearsalContract,
    contractVersion: atlasRehearsalVersion,
    connectionManifest: { contract: connectionManifest.contract, contractVersion: connectionManifest.contractVersion },
    geometryManifest: { contract: geometryManifest.contract, contractVersion: geometryManifest.contractVersion },
    connectionCandidates,
    reciprocalGroups: buildAtlasReciprocalGroups(connectionCandidates),
    connectionParity,
    areaInventory: buildAtlasAreaInventory(geometryManifest),
    topologyTrace,
    topologyMetrics: analyzeAtlasTopologyTrace(topologyTrace),
    geometryComparisons: buildAtlasGeometryComparisons(geometryManifest, topologyTrace),
    policies: {
      activeDatabaseWrites: 0,
      v1GeometryIsCanonicalTraceInput: false,
      connectionPathsCreated: 0,
      rendererSwitch: false,
      reciprocalRowsMerged: 0,
      portArcadiaTopologyCreated: 0,
    },
  };
}
