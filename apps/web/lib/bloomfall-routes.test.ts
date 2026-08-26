import assert from "node:assert/strict";
import test from "node:test";
import { validateAtlasMapConnectionPath } from "@habitat/shared";
import { buildBloomfallRouteStatusManifest, bloomfallPersistedRoutes, bloomfallRouteCandidates } from "../scripts/lib/bloomfall-routes";
import { stableAtlasJson } from "../scripts/lib/atlas-integrity";

test("Bloomfall route-status manifest classifies every candidate without turning dynamic ecology into topology", () => {
  const manifest = buildBloomfallRouteStatusManifest();
  assert.deepEqual(manifest.counts, { candidates: 12, persistedBefore: 2, persistedAfter: 4, newPersisted: 2, PERMANENT: 1, CONDITIONAL: 3, DYNAMIC: 5, DEFERRED: 3 });
  assert.equal(new Set(manifest.routes.map((route) => route.key)).size, manifest.routes.length);
  assert.equal(manifest.routes.filter((route) => route.classification === "DYNAMIC").every((route) => !route.persisted && route.pathSha256 === null), true);
  assert.equal(manifest.routes.find((route) => route.key === "magic-torn-adjacency")?.classification, "DEFERRED");
  assert.equal(manifest.logicalSha256, buildBloomfallRouteStatusManifest().logicalSha256);
});
test("the four stable local paths are valid, distinct, and use exact endpoint logic", () => {
  const expectedEndpoints = new Map([
    ["cairnwood-glassroot-expedition-trail", [[17904,34180],[65104,29297]]],
    ["southreach-service-rail-alignment", [[32552,3255],[74870,3255]]],
  ]);
  const geometries = new Set<string>();
  for (const route of bloomfallPersistedRoutes) {
    const checked = validateAtlasMapConnectionPath({ id: route.pathId, connectionId: route.connectionId, mapSlug: "martino-bloomfall-reach", geometry: route.geometry, minZoom: route.minZoom, maxZoom: route.maxZoom, priority: route.priority, version: 1 }, { width: 100000, height: 66667 });
    assert.equal(checked.valid, true, `${route.key} geometry must validate`);
    const encoded = stableAtlasJson(route.geometry, false);
    assert.equal(geometries.has(encoded), false, `${route.key} duplicates another path`);
    geometries.add(encoded);
    const endpoints = expectedEndpoints.get(route.key);
    if (endpoints) {
      assert.equal(route.geometry.type, "LINESTRING");
      assert.deepEqual([route.geometry.coordinates[0], route.geometry.coordinates.at(-1)], endpoints);
    }
  }
  assert.equal(bloomfallRouteCandidates.filter((route) => route.persisted).length, 4);
});

test("route metadata separates stable connection identity, authoritative availability, and player knowledge", () => {
  for (const route of bloomfallPersistedRoutes) {
    assert.equal(route.metadata.contract, "martino-bloomfall-route-metadata");
    assert.equal(route.metadata.stableGeometry, true);
    assert.equal(["PERMANENT", "CONDITIONAL"].includes(route.metadata.routeClass), true);
    assert.notEqual(route.metadata.conditionOwner, "");
  }
  assert.deepEqual(buildBloomfallRouteStatusManifest().playerKnowledge.values, ["KNOWN_OPEN", "KNOWN_CLOSED", "HAZARDOUS", "UNVERIFIED", "LOST"]);
});
