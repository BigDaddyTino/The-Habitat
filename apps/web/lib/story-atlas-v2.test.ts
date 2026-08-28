import assert from "node:assert/strict";
import test from "node:test";
import type { StoryAtlasFeature, StoryAtlasProjection } from "@habitat/shared";
import { buildAtlasCanonicalTopologyTrace } from "../scripts/lib/atlas-canonical-topology";
import { buildStoryAtlasV2Projection } from "./story-atlas-v2-projection";

function feature(areaId: string, slug: string, title = slug): StoryAtlasFeature {
  return { placementId: areaId, source: "ENTRY", entryId: `entry:${slug}`, nodeId: null, slug, title, summary: `${title} summary`, body: null, status: "CANON", layer: "REGION", geometry: { type: "POLYGON", coordinates: [[[0, 0], [10, 0], [10, 10], [0, 0]]] }, label: null, minZoom: 0, maxZoom: null, priority: 1, childMap: null, place: null, quests: [] };
}

test("V2 projection assembles locked geography while preserving canonical points and quests", () => {
  const trace = buildAtlasCanonicalTopologyTrace();
  const map = trace.maps[0];
  const regionFeatures = map.dataset.areas.map((area) => feature(area.id, map.areaEntrySlugs[area.id]!, map.areaEntrySlugs[area.id] === "grand-rift" ? "Canonical Grand Rift" : map.areaEntrySlugs[area.id]!));
  const point: StoryAtlasFeature = { ...feature("point:ignit", "ignit-island", "Ignit Island"), placementId: "point:ignit", geometry: { type: "POINT", coordinates: [50_000, 50_000] }, layer: "POI", childMap: { slug: "martino-starting-island", title: "Ignit Island" } };
  const quest: StoryAtlasFeature = { ...point, placementId: "quest:1", source: "NODE", entryId: null, nodeId: "node:1", slug: "quest:arc:step", title: "Quest step", layer: "QUEST", childMap: null };
  const v1: StoryAtlasProjection = { contract: "martino-story-atlas", contractVersion: 1, revisionCursor: "v1", scene: { id: "map:world", slug: "martino-world", title: "Ignit Island Tactical Atlas", artVersion: "v1", imageUrl: "/codex-map/martino-world/v1.png", imageWidth: 1536, imageHeight: 1024, coordinateWidth: 100_000, coordinateHeight: 66_667, initialCenter: [50_000, 33_333], initialZoom: 0, minZoom: 0, maxZoom: 5, parentMap: null }, features: [...regionFeatures, point, quest], counts: { placed: 12, regions: 10, settlements: 0, pois: 1, quests: 1 } };
  const projection = buildStoryAtlasV2Projection({ v1, topology: map.dataset, connections: [], revisionCursor: "v2", sceneOwnerTitle: "Ignit Island" });
  // The projection carries the scene's own art through untouched. It used to
  // pin martino-world to v2, which quietly served the superseded world map
  // once v3 shipped — the art version belongs to the StoryMap row, not here.
  assert.equal(projection.scene.imageUrl, v1.scene.imageUrl);
  assert.equal(projection.scene.artVersion, v1.scene.artVersion);
  assert.equal(projection.scene.title, "Ignit Island Tactical Atlas");
  assert.equal(projection.counts.regions, 10);
  assert.equal(projection.counts.topLevelRegions, 8);
  assert.equal(projection.counts.nestedRegions, 1);
  assert.equal(projection.regions.find((region) => region.slug === "grand-rift")?.title, "Canonical Grand Rift");
  assert.deepEqual(projection.regions.find((region) => region.slug === "death-canyon")?.parentSlug, "grand-rift");
  assert.equal(projection.regions.find((region) => region.slug === "grand-lake")?.role, "MAJOR_WATER");
  assert.deepEqual(projection.regions.find((region) => region.slug === "the-red-forest")?.neighbors, ["grand-rift", "riverlands", "the-desert"]);
  assert.equal(projection.points[0]?.slug, "ignit-island");
  assert.deepEqual(projection.points[0]?.childMap, point.childMap);
  assert.equal(projection.questNodes[0]?.placementId, "quest:1");
  assert.ok(projection.regions.every((region) => region.geometry.type === "POLYGON" && region.bounds.length === 4 && region.labelAnchor.length === 2));
});
