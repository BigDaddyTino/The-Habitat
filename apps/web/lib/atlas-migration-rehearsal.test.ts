import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { atlasSha256, stableAtlasJson } from "../scripts/lib/atlas-integrity";
import {
  analyzeAtlasTopologyTrace,
  assertAtlasRehearsalTarget,
  buildAtlasAreaInventory,
  buildAtlasConnectionCandidates,
  buildAtlasGeometryComparisons,
  buildAtlasManualTopologyTrace,
  buildAtlasReciprocalGroups,
  buildAtlasRehearsalPlan,
  verifyAtlasConnectionParity,
  type AtlasV1ConnectionManifest,
  type AtlasV1GeometryManifest,
} from "../scripts/lib/atlas-migration-rehearsal";

const repositoryRoot = path.resolve(process.cwd(), "..", "..");
const manifestDirectory = path.join(repositoryRoot, "Docs", "atlas-migration-manifests");

async function manifests() {
  const [connections, geometry] = await Promise.all([
    readFile(path.join(manifestDirectory, "atlas-v1-connections.json"), "utf8"),
    readFile(path.join(manifestDirectory, "atlas-v1-geometry.json"), "utf8"),
  ]);
  return { connections: JSON.parse(connections) as AtlasV1ConnectionManifest, geometry: JSON.parse(geometry) as AtlasV1GeometryManifest };
}

test("all 25 legacy connection rows become distinct lossless candidates with deterministic provenance", async () => {
  const { connections } = await manifests();
  const first = buildAtlasConnectionCandidates(connections);
  const second = buildAtlasConnectionCandidates(connections);
  assert.equal(first.length, 25);
  assert.equal(new Set(first.map((candidate) => candidate.id)).size, 25);
  assert.equal(new Set(first.map((candidate) => candidate.provenanceKey)).size, 25);
  assert.equal(new Set(first.map((candidate) => candidate.sourceFingerprint)).size, 25);
  assert.equal(stableAtlasJson(first), stableAtlasJson(second));
  for (const [index, record] of [...connections.records].sort((left, right) => left.stableLocator.localeCompare(right.stableLocator)).entries()) {
    const candidate = first[index]!;
    assert.equal(candidate.provenanceKey, record.stableLocator);
    assert.equal(candidate.sourceFingerprint, record.fingerprint);
    assert.equal(candidate.originalWording, typeof record.original.by === "string" ? record.original.by : null);
    assert.equal(candidate.editorialNotes, typeof record.original.notes === "string" ? record.original.notes : null);
    assert.deepEqual(candidate.originalRow, record.original);
    assert.deepEqual((candidate.metadata as { migration: { rawAuthoredRow: unknown } }).migration.rawAuthoredRow, record.original);
  }
});

test("ambiguous classifications and reciprocal rows remain explicitly reviewable and unmerged", async () => {
  const { connections } = await manifests();
  const candidates = buildAtlasConnectionCandidates(connections);
  const ambiguous = candidates.filter((candidate) => candidate.reviewStatus === "REVIEW_REQUIRED");
  assert.deepEqual(ambiguous.map((candidate) => candidate.provenanceKey), ["death-canyon.meta.connections[0]", "the-red-forest.meta.connections[0]"]);
  assert.ok(ambiguous.every((candidate) => candidate.type === "OTHER" && candidate.directionality === "UNSPECIFIED"));
  const reciprocalRows = candidates.filter((candidate) => candidate.reciprocalCandidates.length > 0);
  assert.equal(reciprocalRows.length, 10);
  const groups = buildAtlasReciprocalGroups(candidates);
  assert.equal(groups.length, 5);
  assert.ok(groups.every((group) => group.connectionA.locator !== group.connectionB.locator));
  assert.equal(new Set(groups.flatMap((group) => [group.connectionA.locator, group.connectionB.locator])).size, 10);
});

test("connection parity detects missing, duplicate, fingerprint, and authored-wording drift", async () => {
  const { connections } = await manifests();
  const candidates = buildAtlasConnectionCandidates(connections);
  assert.equal(verifyAtlasConnectionParity(connections, candidates).valid, true);
  assert.equal(verifyAtlasConnectionParity(connections, candidates.slice(1)).missing.length, 1);
  assert.equal(verifyAtlasConnectionParity(connections, [...candidates, { ...candidates[0]!, id: "another-id" }]).duplicates.length, 1);
  assert.equal(verifyAtlasConnectionParity(connections, candidates.map((candidate, index) => index ? candidate : { ...candidate, originalWording: "altered" })).alteredWording.length, 1);
  assert.equal(verifyAtlasConnectionParity(connections, candidates.map((candidate, index) => index ? candidate : { ...candidate, sourceFingerprint: "0".repeat(64) })).fingerprintMismatches.length, 1);
});

test("canonical trace interlocks every world region and passes every topology lock gate", async () => {
  const trace = buildAtlasManualTopologyTrace();
  const metrics = analyzeAtlasTopologyTrace(trace);
  assert.equal(metrics.tracedAreas, 10);
  assert.equal(metrics.topLevelRegions, 8);
  assert.equal(metrics.nestedRegions, 1);
  assert.equal(metrics.majorWaterAreas, 1);
  assert.equal(metrics.topologyNodes, 19);
  assert.equal(metrics.boundaries, 26);
  assert.equal(metrics.areaRings, 11);
  assert.equal(metrics.orderedBoundaryReferences, 43);
  assert.equal(metrics.sharedBoundaries, 17);
  assert.equal(metrics.internalBoundariesConsumedByTwoAreas, 13);
  assert.equal(metrics.sharedWaterBoundariesConsumedByTwoAreas, 4);
  assert.equal(metrics.coastBoundaries, 5);
  assert.equal(metrics.nestedBoundaries, 4);
  assert.equal(metrics.holes, 1);
  assert.equal(metrics.orphanNodes.length, 0);
  assert.equal(metrics.unusedBoundaries.length, 0);
  assert.equal(metrics.validationFailures.length, 0);
  assert.equal(metrics.junctions.length, 9);
  assert.equal(metrics.partition.areaDelta, 0);
  assert.equal(metrics.partition.overlaps, 0);
  assert.equal(metrics.partition.gaps, 0);
  assert.equal(metrics.deathCanyon.valid, true);
  assert.equal(metrics.deathCanyon.parent, "grand-rift");
  assert.equal(metrics.deathCanyon.overlapsRedForest, false);
  assert.equal(trace.deathCanyonCandidateReview.atlasGeometryValidationFindings, 0);
  assert.equal(trace.deathCanyonCandidateReview.distinctVerticesInsideFinalGrandRift, "22/22");
  assert.equal(trace.deathCanyonCandidateReview.grandRiftBoundaryCrossings, 0);
  assert.equal(trace.deathCanyonCandidateReview.redForestBoundaryCrossings, 0);
  assert.equal(trace.deathCanyonCandidateReview.decision, "REFINED_NOT_USED_AS_TRACE_SOURCE");
  assert.ok(Object.values(metrics.hardGates).every(Boolean));
  assert.equal(metrics.topologyLocked, true);
  const map = trace.maps[0];
  const deathCanyonCandidate = await readFile(path.join(repositoryRoot, trace.deathCanyonCandidateReview.path));
  assert.equal(atlasSha256(deathCanyonCandidate), trace.deathCanyonCandidateReview.sha256);
  const lake = map.dataset.areas.find((area) => map.areaEntrySlugs[area.id] === "grand-lake")!;
  const cliffs = map.dataset.areas.find((area) => map.areaEntrySlugs[area.id] === "high-cliffs")!;
  const lakeBoundaryIds = new Set(lake.rings[0]!.boundaries.map((reference) => reference.boundaryId));
  const hole = cliffs.rings.find((ring) => ring.role === "HOLE")!;
  assert.deepEqual(new Set(hole.boundaries.map((reference) => reference.boundaryId)), lakeBoundaryIds);
  assert.ok(hole.boundaries.every((reference) => reference.reversed));
  assert.ok(metrics.regionResults.every((region) => region.approval === "APPROVED_FOR_MIGRATION"));
  assert.equal(trace.startingIsland.status, "DEFERRED_CHILD_SCENE");
  assert.equal(trace.portArcadia.status, "RECALIBRATION_REQUIRED");
});

test("area inventory distinguishes areas, point-only sites, unresolved borders, and Port Arcadia recalibration", async () => {
  const { geometry } = await manifests();
  const inventory = buildAtlasAreaInventory(geometry);
  assert.equal(inventory.length, 36);
  assert.deepEqual(Object.fromEntries([...new Set(inventory.map((row) => row.disposition))].sort().map((status) => [status, inventory.filter((row) => row.disposition === status).length])), {
    OWNER_REVIEW_REQUIRED: 1,
    POINT_ONLY: 18,
    PORT_ARCADIA_RECALIBRATION: 7,
    TRACED: 10,
  });
  assert.equal(inventory.find((row) => row.placementKey === "martino-starting-island:riftwood-interior")?.disposition, "OWNER_REVIEW_REQUIRED");
  assert.ok(inventory.filter((row) => row.mapSlug === "martino-port-arcadia" && row.v1GeometryKind !== "POINT").every((row) => row.disposition === "PORT_ARCADIA_RECALIBRATION"));
});

test("V1 polygon coordinates are comparison evidence and never generate the manual trace", async () => {
  const { connections, geometry } = await manifests();
  const baseline = buildAtlasRehearsalPlan(connections, geometry).topologyTrace;
  const changedGeometry = { ...geometry, records: geometry.records.map((record) => ({ ...record, geometry: { type: "POLYGON", coordinates: [[[1, 1], [2, 1], [1, 2], [1, 1]]] } })) };
  const changed = buildAtlasRehearsalPlan(connections, changedGeometry).topologyTrace;
  assert.equal(stableAtlasJson(baseline), stableAtlasJson(changed));
  assert.equal(baseline.coordinateSource, "MANUAL_FROZEN_ARTWORK_TRACE");
  const comparisons = buildAtlasGeometryComparisons(geometry, baseline);
  assert.deepEqual(comparisons.map((comparison) => comparison.entrySlug), ["death-canyon", "grand-lake", "grand-rift", "high-cliffs", "magic-torn-wasteland", "riverlands", "the-desert", "the-peninsula", "the-red-forest", "unknown-southeast"]);
  assert.ok(comparisons.every((comparison) => comparison.v1Fingerprint.length === 64 && comparison.reason.includes("V2")));
});

test("rehearsal writes reject the active database and any non-isolated target", () => {
  const source = "postgresql://user:secret@localhost:5432/habitat?schema=public";
  assert.throws(() => assertAtlasRehearsalTarget(source, source), /target matches the active canonical database/);
  assert.throws(() => assertAtlasRehearsalTarget(source, "postgresql://user:secret@example.com:5432/habitat_atlas_p4_rehearsal_test"), /isolated local/);
  assert.throws(() => assertAtlasRehearsalTarget(source, "postgresql://user:secret@localhost:5432/not_a_rehearsal"), /prefix/);
  assert.deepEqual(assertAtlasRehearsalTarget(source, "postgresql://user:secret@localhost:5432/habitat_atlas_p4_rehearsal_test"), { sourceDatabase: "habitat", targetDatabase: "habitat_atlas_p4_rehearsal_test" });
});

test("source extraction is read-only, target writes are transactional, and public Atlas surfaces remain untouched", async () => {
  const databaseLayer = await readFile(path.join(repositoryRoot, "apps", "web", "scripts", "lib", "atlas-rehearsal-db.ts"), "utf8");
  const sourceAdapter = databaseLayer.slice(databaseLayer.indexOf("export async function loadAtlasRehearsalSourceSnapshot"), databaseLayer.indexOf("export function assertSourceSnapshotMatchesConnectionManifest"));
  assert.match(sourceAdapter, /SET TRANSACTION READ ONLY/);
  assert.doesNotMatch(sourceAdapter, /\.(?:create|createMany|update|updateMany|upsert|delete|deleteMany)\s*\(/);
  assert.match(databaseLayer, /isolationLevel: "Serializable"/);
  assert.match(databaseLayer, /INTENTIONAL_REHEARSAL_ROLLBACK_PROBE/);
  assert.doesNotMatch(databaseLayer, /storyMapConnectionPath\.(?:create|createMany|upsert)/);
  const packageJson = await readFile(path.join(repositoryRoot, "apps", "web", "package.json"), "utf8");
  assert.match(packageJson, /atlas:migrate:plan/);
  assert.match(packageJson, /atlas:migrate:rehearse/);
  assert.match(packageJson, /atlas:migrate:verify/);
  for (const publicFile of ["apps/web/lib/story-atlas.ts", "apps/web/components/story-atlas.tsx", "apps/web/app/api/codex/maps/[slug]/route.ts"]) {
    const content = await readFile(path.join(repositoryRoot, publicFile), "utf8");
    assert.doesNotMatch(content, /StoryWorldConnection|StoryMapTopologyNode|atlas-migration-rehearsal/);
  }
});

test("review artifacts are self-contained development tooling over unchanged protected artwork", async () => {
  const reviewPath = path.join(repositoryRoot, "Docs", "atlas-migration-rehearsal", "atlas-v2-review.html");
  const html = await readFile(reviewPath, "utf8");
  assert.equal((html.match(/<svg\b/g) ?? []).length, 1);
  assert.equal((html.match(/<image\b/g) ?? []).length, 1);
  assert.match(html, /Raster/);
  assert.match(html, /V1 geometry/);
  assert.match(html, /Canonical V2 topology/);
  assert.match(html, /Topology nodes/);
  assert.match(html, /Boundary semantics/);
  assert.match(html, /Death Canyon nested area/);
  assert.match(html, /Click selection persists in the URL hash/);
  assert.match(html, /martino-world-map-v2-clean-production-candidate\.png/);
  assert.doesNotMatch(html, /fetch\(|XMLHttpRequest|\/api\//);
  const artworkPath = path.join(repositoryRoot, "apps", "web", "private", "codex-art", "maps", "candidates", "martino-world-map-v2-clean-production-candidate.png");
  await access(artworkPath);
  assert.equal(atlasSha256(await readFile(artworkPath)), "427bf4967afa8a96afa2175d5aed261225cf7fbeed17944be527f4616b5713b6");
  for (const filename of ["atlas-v2-topology-manifest.json", "atlas-v2-derived-geometry.json", "atlas-v2-topology-review.svg"]) await access(path.join(repositoryRoot, "Docs", "atlas-migration-rehearsal", filename));
});
