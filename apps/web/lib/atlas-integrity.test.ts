import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import {
  atlasAuditExitCode,
  buildAtlasIntegrityAudit,
  buildAtlasMigrationManifests,
  decodePngDimensions,
  fingerprintAtlasSource,
  stableAtlasJson,
  type AtlasArtworkInspector,
  type AtlasAuditSource,
} from "../scripts/lib/atlas-integrity";

const polygon = { type: "POLYGON", coordinates: [[[0, 0], [100, 0], [100, 100], [0, 100], [0, 0]]] };

function fixtureSource(geometry: unknown = polygon): AtlasAuditSource {
  return {
    maps: [{
      mapId: "map-id",
      slug: "fixture-world",
      title: "Fixture World",
      parentSlug: null,
      childSlugs: [],
      ownerEntrySlug: null,
      artVersion: "v1",
      imageWidth: 1536,
      imageHeight: 1024,
      coordinateWidth: 100_000,
      coordinateHeight: 66_667,
      placements: [{
        placementId: "placement-id",
        entryId: "entry-id",
        entrySlug: "placed",
        entryTitle: "Placed",
        entryStatus: "CANON",
        placeType: "region",
        parentSlug: null,
        geometryKind: "POLYGON",
        geometry,
        labelX: 50,
        labelY: 50,
        minZoom: 0,
        maxZoom: null,
        priority: 10,
      }],
      nodePlacements: [],
    }],
    entries: [
      { id: "entry-id", kind: "REGION", slug: "placed", title: "Placed", summary: null, body: null, status: "CANON", meta: { type: "region", parent: null, biome: "test biome", control: [], connections: [] } },
      { id: "docks-id", kind: "REGION", slug: "the-docks", title: "The Docks", summary: null, body: null, status: "CANON", meta: { type: "site", parent: null, biome: null, control: [], connections: [] } },
    ],
  };
}

const mismatchedArtwork: AtlasArtworkInspector = async () => ({
  configuredUrl: "/codex-map/fixture-world/v1.png",
  allowlisted: true,
  exists: true,
  format: "PNG",
  decodedWidth: 1599,
  decodedHeight: 984,
  bytes: 123,
  sha256: "abc",
});

test("PNG inspection reads decoded dimensions rather than trusting metadata", () => {
  const bytes = Buffer.alloc(24);
  Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]).copy(bytes, 0);
  bytes.writeUInt32BE(1599, 16);
  bytes.writeUInt32BE(984, 20);
  assert.deepEqual(decodePngDimensions(bytes), { width: 1599, height: 984 });
  assert.equal(decodePngDimensions(Buffer.from("not png")), null);
});

test("audit reports artwork mismatch and unplaced places without failing normal execution", async () => {
  const audit = await buildAtlasIntegrityAudit(fixtureSource(), mismatchedArtwork);
  assert.ok(audit.findings.some((finding) => finding.code === "ARTWORK_DIMENSION_MISMATCH" && finding.severity === "WARNING"));
  assert.ok(audit.findings.some((finding) => finding.code === "PLACE_UNPLACED" && finding.severity === "INFO"));
  assert.equal(atlasAuditExitCode(audit), 0);
  assert.equal(atlasAuditExitCode(audit, true), 1);
});

test("missing artwork and malformed geometry are audit errors", async () => {
  const missing: AtlasArtworkInspector = async () => ({ configuredUrl: "/missing", allowlisted: false, exists: false, format: "UNKNOWN", decodedWidth: null, decodedHeight: null, bytes: null, sha256: null });
  const audit = await buildAtlasIntegrityAudit(fixtureSource({ type: "POLYGON", coordinates: [[[0, 0], [10, 10]]] }), missing);
  assert.ok(audit.findings.some((finding) => finding.code === "ARTWORK_MISSING" && finding.severity === "ERROR"));
  assert.ok(audit.findings.some((finding) => finding.code === "GEOMETRY_TOO_FEW_VERTICES" && finding.severity === "ERROR"));
  assert.equal(atlasAuditExitCode(audit), 1);
});

test("audit JSON, fingerprints, and migration manifests are deterministic", async () => {
  const first = await buildAtlasIntegrityAudit(fixtureSource(), mismatchedArtwork);
  const second = await buildAtlasIntegrityAudit(fixtureSource(), mismatchedArtwork);
  assert.equal(stableAtlasJson(first), stableAtlasJson(second));
  assert.equal(stableAtlasJson(buildAtlasMigrationManifests(first)), stableAtlasJson(buildAtlasMigrationManifests(second)));
  assert.equal(fingerprintAtlasSource({ b: 2, a: 1 }), fingerprintAtlasSource({ a: 1, b: 2 }));
  assert.doesNotMatch(stableAtlasJson(first), /generatedAt|timestamp/i);
});

test("the production Atlas audit adapter is read-only and the commands cannot import the seed", async () => {
  const adapter = await readFile(path.join(process.cwd(), "scripts", "lib", "atlas-integrity-db.ts"), "utf8");
  assert.match(adapter, /findMany/);
  assert.doesNotMatch(adapter, /\.(create|update|upsert|delete|createMany|updateMany|deleteMany)\s*\(/);
  for (const filename of ["audit-story-atlas.ts", "generate-atlas-migration-manifests.ts"]) {
    const command = await readFile(path.join(process.cwd(), "scripts", filename), "utf8");
    assert.doesNotMatch(command, /seed-story-atlas|ingest-story-seed|prisma\/seed/);
  }
});

