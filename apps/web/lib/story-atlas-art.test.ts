import assert from "node:assert/strict";
import { basename } from "node:path";
import test from "node:test";
import { resolveStoryAtlasArt } from "./story-atlas-art";

test("every authoritative atlas scene resolves its allow-listed master", () => {
  assert.equal(basename(resolveStoryAtlasArt("martino-world", "v1.png") ?? ""), "martino-world-map-v1.png");
  assert.equal(basename(resolveStoryAtlasArt("martino-world", "v2.png") ?? ""), "martino-world-map-v2-clean-production-candidate.png");
  assert.equal(basename(resolveStoryAtlasArt("martino-starting-island", "v1.png") ?? ""), "martino-starting-island-map-v1.png");
  assert.equal(basename(resolveStoryAtlasArt("martino-port-arcadia", "v2.png") ?? ""), "martino-port-arcadia-map-v2.png");
});

test("atlas art resolution rejects unknown scenes, versions, and traversal", () => {
  assert.equal(resolveStoryAtlasArt("martino-port-arcadia", "v1.png"), null);
  assert.equal(resolveStoryAtlasArt("martino-world", "../v1.png"), null);
  assert.equal(resolveStoryAtlasArt("../martino-world", "v1.png"), null);
});
