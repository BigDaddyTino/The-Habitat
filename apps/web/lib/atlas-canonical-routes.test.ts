import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { validateAtlasMapConnectionPath } from "@habitat/shared";
import { loadAtlasCanonicalRouteBacklog } from "../scripts/lib/atlas-canonical-routes";

const root = path.resolve(process.cwd(), "..", "..");

test("canonical route backlog covers all migrated connections and only approves validated geometry", async () => {
  const backlog = await loadAtlasCanonicalRouteBacklog(root);
  const candidates = JSON.parse(await readFile(path.join(root, "Docs", "atlas-migration-rehearsal", "atlas-v2-connection-candidates.json"), "utf8")) as { candidates: Array<{ id: string; sourceSlug: string; targetSlug: string; type: string }> };
  assert.equal(backlog.routes.length, 25);
  assert.deepEqual([...backlog.routes.map((route) => route.connectionId)].sort(), [...candidates.candidates.map((candidate) => candidate.id)].sort());
  for (const route of backlog.routes) {
    const candidate = candidates.candidates.find((value) => value.id === route.connectionId);
    assert.deepEqual(candidate && { source: candidate.sourceSlug, destination: candidate.targetSlug, type: candidate.type }, { source: route.source, destination: route.destination, type: route.type });
    if (route.status !== "AUTHOR_NOW") { assert.equal(route.geometry, undefined); continue; }
    const result = validateAtlasMapConnectionPath({ id: route.connectionId, connectionId: route.connectionId, mapSlug: route.recommendedScene, geometry: route.geometry!, minZoom: 0, maxZoom: null, priority: 10, version: 1 }, { width: 100_000, height: 66_667 });
    assert.equal(result.valid, true, JSON.stringify(result.findings));
  }
  assert.deepEqual(backlog.counts, { connections: 25, authorNow: 9, reviewRequired: 14, defer: 2 });
});

test("canonical route authoring command is guarded and idempotent", async () => {
  const command = await readFile(path.join(root, "apps", "web", "scripts", "author-canonical-atlas-routes.ts"), "utf8");
  assert.match(command, /resolveAtlasDevelopmentDatabaseUrl/);
  assert.match(command, /assertAtlasAuthoringEnvironment/);
  assert.match(command, /refusing overwrite/);
  assert.match(command, /createAtlasPersistenceService/);
  assert.doesNotMatch(command, /storyMapConnectionPath\.(create|update|delete)/);
});
