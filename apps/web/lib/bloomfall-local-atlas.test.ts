import assert from "node:assert/strict";
import test from "node:test";
import { buildBloomfallLocalAtlasManifest, bloomfallLocalTopology } from "../scripts/lib/bloomfall-local-atlas";
import { validateAtlasTopology } from "@habitat/shared";

test("Bloomfall local Atlas is one exact shared-boundary partition", () => {
  const manifest = buildBloomfallLocalAtlasManifest();
  const validation = validateAtlasTopology(bloomfallLocalTopology, { width: 100000, height: 66667 });
  assert.equal(validation.valid, true);
  assert.deepEqual(manifest.analysis, { topologyValid: true, subregions: 3, pois: 15, nodes: 8, boundaries: 10, rings: 3, boundaryReferences: 12, sharedInternalBoundaries: 2, holes: 0, partitionArea: 6666700000, expectedExtentArea: 6666700000, gaps: 0, overlaps: 0 });
  assert.equal(new Set(manifest.placements.map((placement) => placement.entrySlug)).size, 18);
  assert.equal(manifest.logicalSha256, buildBloomfallLocalAtlasManifest().logicalSha256);
});

test("Bloomfall route release authors only the two existing high-confidence connections", () => {
  const manifest = buildBloomfallLocalAtlasManifest();
  assert.deepEqual(manifest.routes.map((route) => [route.endpointSlug, route.type, route.status]), [["riverlands", "ROAD", "AUTHOR_NOW"], ["the-ocean", "SEA_ROUTE", "AUTHOR_NOW"]]);
  assert.equal(manifest.routeBacklog.REVIEW_REQUIRED.length, 2);
  assert.equal(manifest.routeBacklog.DEFER.includes("Magic-Torn Wasteland route"), true);
  assert.equal(manifest.routeBacklog.status, "SUPERSEDED_BY_PROMPT_D_ROUTE_STATUS_MANIFEST");
  assert.equal(manifest.overlayArchitecture.spawnPoints, "not authored");
});
