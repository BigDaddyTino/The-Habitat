import assert from "node:assert/strict";
import test from "node:test";
import { resolveStoryAtlasArt, storyAtlasArtRegistered } from "./story-atlas-art";

test("only registered scene art can activate a player Atlas projection", () => {
  assert.equal(storyAtlasArtRegistered("martino-world", "v1"), true);
  assert.equal(storyAtlasArtRegistered("martino-bloomfall-reach", "foundation"), false);
  assert.equal(storyAtlasArtRegistered("martino-bloomfall-reach", "v1", { HABITAT_ENVIRONMENT: "development" }), true);
  assert.equal(storyAtlasArtRegistered("martino-bloomfall-reach", "v1", { HABITAT_ENVIRONMENT: "production" }), false);
  assert.equal(storyAtlasArtRegistered("martino-world", "v3", { HABITAT_ENVIRONMENT: "production" }), true);
  assert.equal(storyAtlasArtRegistered("martino-bloomfall-reach", "v3", { HABITAT_ENVIRONMENT: "production" }), true);
  assert.ok(resolveStoryAtlasArt("martino-world", "v3.png"));
  assert.ok(resolveStoryAtlasArt("martino-bloomfall-reach", "v3.png"));
});
