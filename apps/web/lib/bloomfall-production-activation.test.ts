import assert from "node:assert/strict";
import test from "node:test";
import { bloomfallReachCanon } from "@habitat/shared";
import {
  assertBloomfallExpectedBaseline,
  assertBloomfallProductionActivationTarget,
  assertBloomfallReleaseEvidence,
  assertBloomfallV3ArtLock,
  bloomfallProductionOwnerAuthorization,
  classifyBloomfallActivationSnapshot,
  type BloomfallActivationSnapshot,
} from "../scripts/lib/bloomfall-production-activation";
import { geographicHierarchyRepairManifest } from "../scripts/lib/geographic-hierarchy-repair";
import { bloomfallV3Assets } from "./bloomfall-v3-art";

const source = "postgresql://release@localhost:5432/habitat";
const target = source;
const productionEnvironment = {
  HABITAT_ENVIRONMENT: "production",
  BLOOMFALL_PRODUCTION_ACTIVATION_MODE: "production",
  BLOOMFALL_PRODUCTION_ACTIVATION_CONFIRM_DATABASE: "habitat",
  BLOOMFALL_PRODUCTION_ACTIVATION_CONFIRM: bloomfallProductionOwnerAuthorization,
};

function beforeSnapshot(): BloomfallActivationSnapshot {
  const hierarchy = geographicHierarchyRepairManifest.map((entry) => ({
    id: entry.id,
    slug: entry.slug === bloomfallReachCanon.slug ? bloomfallReachCanon.formerDevelopmentPlaceholder.slug : entry.slug,
    parent: entry.beforeParent,
    type: entry.beforeType,
  })).sort((left, right) => left.id.localeCompare(right.id));
  return {
    placeholder: { id: "a64869df-c623-49ec-9236-dd306a3fd5c7", slug: "unknown-southeast", title: "Unknown Southeast", kind: "REGION", status: "CANON", version: 1 },
    hierarchy,
    maps: [{ slug: "martino-world", artVersion: "v1" }],
    counts: { storyEntries: 175, storyMaps: 3, placements: 36, nodePlacements: 10, topologyNodes: 19, boundaries: 26, rings: 11, references: 43, worldConnections: 25, connectionPaths: 9, arcs: 7 },
    revisions: 0,
    logicalSha256: "a".repeat(64),
  };
}

test("production target refuses a development database even in production mode", () => {
  assert.throws(() => assertBloomfallProductionActivationTarget(source, "postgresql://release@localhost:5432/habitat_atlas_dev", productionEnvironment), /canonical habitat database/);
});

test("production target refuses missing owner authorization and wrong database names", () => {
  assert.throws(() => assertBloomfallProductionActivationTarget(source, target, { ...productionEnvironment, BLOOMFALL_PRODUCTION_ACTIVATION_CONFIRM: undefined }), /owner-authorization/);
  assert.throws(() => assertBloomfallProductionActivationTarget(source, "postgresql://release@localhost:5432/habitat_copy", productionEnvironment), /canonical habitat database/);
});

test("release evidence refuses wrong HEAD, wrong build ID, and missing backup gate", () => {
  const now = Date.now();
  const evidence = { actualHead: "a".repeat(40), actualBuildId: "build-1", backupPath: "C:\\release\\baseline.dump", backupBytes: 10, backupMtimeMs: now };
  const environment = { BLOOMFALL_V3_RELEASE_HEAD: evidence.actualHead, BLOOMFALL_V3_EXPECTED_BUILD_ID: evidence.actualBuildId, BLOOMFALL_V3_PRODUCTION_BACKUP_PATH: evidence.backupPath, BLOOMFALL_V3_BACKUP_VERIFICATION: "PG_RESTORE_LIST_OK" };
  assert.throws(() => assertBloomfallReleaseEvidence(evidence, { ...environment, BLOOMFALL_V3_RELEASE_HEAD: "b".repeat(40) }, now), /HEAD mismatch/);
  assert.throws(() => assertBloomfallReleaseEvidence(evidence, { ...environment, BLOOMFALL_V3_EXPECTED_BUILD_ID: "other" }, now), /build identity mismatch/);
  assert.throws(() => assertBloomfallReleaseEvidence(evidence, { ...environment, BLOOMFALL_V3_PRODUCTION_BACKUP_PATH: undefined }, now), /backup dump path/);
});

test("baseline refuses the wrong placeholder ID and unexpected hierarchy", () => {
  const wrongPlaceholder = beforeSnapshot();
  wrongPlaceholder.placeholder = { ...wrongPlaceholder.placeholder!, id: "00000000-0000-0000-0000-000000000000" };
  assert.throws(() => classifyBloomfallActivationSnapshot(wrongPlaceholder), /baseline differs/);
  const wrongHierarchy = beforeSnapshot();
  wrongHierarchy.hierarchy[0] = { ...wrongHierarchy.hierarchy[0]!, parent: "unexpected-parent" };
  assert.throws(() => classifyBloomfallActivationSnapshot(wrongHierarchy), /baseline differs/);
});

test("baseline fingerprint is mandatory and exact", () => {
  const snapshot = beforeSnapshot();
  assert.throws(() => assertBloomfallExpectedBaseline(snapshot, {}), /fingerprint mismatch/);
  assert.throws(() => assertBloomfallExpectedBaseline(snapshot, { BLOOMFALL_V3_EXPECTED_BASELINE_FINGERPRINT: "b".repeat(64) }), /fingerprint mismatch/);
  assert.equal(assertBloomfallExpectedBaseline(snapshot, { BLOOMFALL_V3_EXPECTED_BASELINE_FINGERPRINT: snapshot.logicalSha256 }), "BEFORE");
});

test("art lock refuses mismatched hashes and any V1 or V2 selection", () => {
  const exact = bloomfallV3Assets.map((asset) => ({ id: asset.id, sha256: asset.sha256 }));
  assert.throws(() => assertBloomfallV3ArtLock({ selected: { v1: 1, v2: 0, v3: 14 }, assets: exact }), /V1=0/);
  assert.throws(() => assertBloomfallV3ArtLock({ selected: { v1: 0, v2: 0, v3: 15 }, assets: exact.map((asset, index) => index === 0 ? { ...asset, sha256: "wrong" } : asset) }), /hash mismatch/);
});

test("a partial or second conflicting activation is refused", () => {
  const mixed = beforeSnapshot();
  mixed.maps = [{ slug: "martino-world", artVersion: "v3" }];
  assert.throws(() => classifyBloomfallActivationSnapshot(mixed), /baseline differs/);
});
