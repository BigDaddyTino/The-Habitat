import assert from "node:assert/strict";
import test from "node:test";
import { bloomfallV3CodexAssets, bloomfallV3PublicationMarker } from "./bloomfall-v3-art";
import { getPlaceKeyart } from "./place-art";

test("place thumbnails use every registered image before falling back to a map pin", () => {
  assert.equal(getPlaceKeyart("port-arcadia", {}, { HABITAT_ENVIRONMENT: "development" }), "/images/regions/keyart/port-arcadia.jpg");
  assert.equal(getPlaceKeyart("the-docks", {}, { HABITAT_ENVIRONMENT: "development" }), "/images/regions/keyart/the-docks.png");
  assert.equal(getPlaceKeyart("death-canyon", {}, { HABITAT_ENVIRONMENT: "development" }), "/images/regions/keyart/death-canyon.png");
  assert.equal(getPlaceKeyart("grand-lake", {}, { HABITAT_ENVIRONMENT: "development" }), "/images/regions/keyart/grand-lake.png");
  assert.equal(getPlaceKeyart("the-floating-city", {}, { HABITAT_ENVIRONMENT: "development" }), "/images/regions/keyart/the-floating-city.jpg");
  assert.equal(getPlaceKeyart("not-illustrated", {}, { HABITAT_ENVIRONMENT: "development" }), null);
});

test("Bloomfall place thumbnails respect the same publication gate as their dossiers", () => {
  const asset = bloomfallV3CodexAssets.find((candidate) => candidate.entrySlug === "the-shattercore")!;
  const expected = `/codex-art/bloomfall-v3/${asset.filename}`;
  assert.equal(getPlaceKeyart(asset.entrySlug, {}, { HABITAT_ENVIRONMENT: "development" }), expected);
  assert.equal(getPlaceKeyart(asset.entrySlug, {}, { HABITAT_ENVIRONMENT: "production" }), null);
  assert.equal(getPlaceKeyart(asset.entrySlug, { visualArt: bloomfallV3PublicationMarker(asset) }, { HABITAT_ENVIRONMENT: "production" }), expected);
});
