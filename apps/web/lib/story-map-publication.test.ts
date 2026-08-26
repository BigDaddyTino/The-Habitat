import assert from "node:assert/strict";
import test from "node:test";
import { isPublishedStoryMapArtVersion } from "@habitat/shared";

test("only numbered map-art releases enter the trusted bundle", () => {
  assert.equal(isPublishedStoryMapArtVersion("v1"), true);
  assert.equal(isPublishedStoryMapArtVersion("v20"), true);
  assert.equal(isPublishedStoryMapArtVersion("foundation"), false);
  assert.equal(isPublishedStoryMapArtVersion("v0"), false);
  assert.equal(isPublishedStoryMapArtVersion("draft-v1"), false);
});
