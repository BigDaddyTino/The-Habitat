import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

const root = path.resolve(process.cwd(), "..", "..");

test("V2 renderer keeps a clean layered map and OpenLayers-native interaction updates", async () => {
  const component = await readFile(path.join(root, "apps", "web", "components", "story-atlas-v2.tsx"), "utf8");
  assert.match(component, /layers: \[baseLayer, hitLayer, highlightLayer, pointLayer, labelLayer\]/);
  assert.match(component, /rgba\(0,0,0,0\.001\)/, "resting hit fill is effectively invisible");
  assert.match(component, /pointermove/);
  assert.match(component, /highlightLayer\.changed\(\)/);
  assert.doesNotMatch(component, /setHovered/);
  assert.match(component, /getView\(\)\.fit/);
  assert.match(component, /atlasV2Hash/);
  assert.match(component, /map\.on\("click"/);
  assert.match(component, /NESTED_GEOGRAPHY/);
  assert.match(component, /region\.parentSlug/);
  assert.match(component, /replaceProjectionFeatures/);
  assert.match(component, /regionSource\.clear\(true\)/);
  assert.doesNotMatch(component, /\}, \[projection, select\]\);/, "projection refreshes must not reconstruct the OpenLayers map");
});

test("V1 component remains separate and API/page selection is centralized", async () => {
  const v1 = await readFile(path.join(root, "apps", "web", "components", "story-atlas.tsx"), "utf8");
  const page = await readFile(path.join(root, "apps", "web", "app", "codex", "map", "page.tsx"), "utf8");
  const route = await readFile(path.join(root, "apps", "web", "app", "api", "codex", "maps", "[slug]", "route.ts"), "utf8");
  assert.doesNotMatch(v1, /AtlasV2|projectionVersion|HABITAT_ATLAS_V2/);
  assert.match(page, /resolveAtlasProjectionVersion/);
  assert.match(route, /resolveAtlasProjectionVersion/);
});
