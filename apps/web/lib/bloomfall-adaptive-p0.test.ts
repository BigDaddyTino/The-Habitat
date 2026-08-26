import assert from "node:assert/strict";
import { test } from "node:test";
import {
  bloomfallAdaptiveP0Assets,
  bloomfallAdaptiveP0RevisionAssets,
  bloomfallAdaptiveP0ReusedAssets,
  bloomfallAdaptiveP0SelectedAssets,
  getBloomfallAdaptiveP0Presentation,
} from "./bloomfall-adaptive-p0";
import { resolveCodexArtFile } from "./codex-art";

test("Prompt C manifest locks the exact P0 matrix and evidence", () => {
  assert.equal(bloomfallAdaptiveP0SelectedAssets.length, 12);
  assert.equal(bloomfallAdaptiveP0RevisionAssets.length, 4);
  assert.equal(bloomfallAdaptiveP0ReusedAssets.length, 4);
  assert.equal(bloomfallAdaptiveP0Assets.filter((asset) => asset.status === "REJECTED").length, 0);
  assert.deepEqual(
    bloomfallAdaptiveP0SelectedAssets.filter((asset) => asset.purpose === "STATE_REFERENCE" && asset.entitySlug === "blackbloom-hart").map((asset) => asset.state),
    ["Gradient-Sensing Hart", "Charge-Raised", "Grounded Crown", "Storm-Tuned Relay"],
  );
  assert.deepEqual(
    bloomfallAdaptiveP0SelectedAssets.filter((asset) => asset.purpose === "STATE_REFERENCE" && asset.entitySlug === "latchhound").map((asset) => asset.state),
    ["Corridor Latcher", "Live-Latched", "Circuit Stalker", "Pack Relay"],
  );
});

test("all selected candidates clear the 9/10 gate and carry review metadata", () => {
  for (const asset of bloomfallAdaptiveP0SelectedAssets) {
    assert.match(asset.sha256, /^[a-f0-9]{64}$/);
    assert.ok(asset.width > 1000 && asset.height > 900);
    assert.ok(asset.codexDevelopmentBinding);
    assert.ok(asset.alt.length > 10 && asset.alt.length <= 180);
    for (const value of Object.values(asset.scores)) assert.ok(value >= 9);
  }
});

test("development presentation covers two ladders, one exceptional case, and one explicit NONE case", () => {
  assert.equal(getBloomfallAdaptiveP0Presentation("blackbloom-hart", { HABITAT_ENVIRONMENT: "development" })?.kind, "ADAPTIVE");
  assert.equal(getBloomfallAdaptiveP0Presentation("latchhound", { HABITAT_ENVIRONMENT: "development" })?.kind, "ADAPTIVE");
  assert.equal(getBloomfallAdaptiveP0Presentation("the-last-shift", { HABITAT_ENVIRONMENT: "development" })?.kind, "EXCEPTIONAL");
  assert.equal(getBloomfallAdaptiveP0Presentation("glasswing-kite", { HABITAT_ENVIRONMENT: "development" })?.kind, "NONE");
  assert.equal(getBloomfallAdaptiveP0Presentation("blackbloom-hart", { HABITAT_ENVIRONMENT: "production" }), null);
});

test("P0 art resolver is development-only while locked V3 behavior is unchanged", () => {
  assert.ok(resolveCodexArtFile("bloomfall-adaptive-p0", "blackbloom-hart-gradient-sensing.png", { HABITAT_ENVIRONMENT: "development" }));
  assert.equal(resolveCodexArtFile("bloomfall-adaptive-p0", "blackbloom-hart-gradient-sensing.png", { HABITAT_ENVIRONMENT: "production" }), null);
  assert.equal(resolveCodexArtFile("bloomfall-adaptive-p0-source", "../candidates/blackbloom-hart-gradient-sensing.png", { HABITAT_ENVIRONMENT: "development" }), null);
  assert.ok(resolveCodexArtFile("bloomfall-v3", "the-bellwether.png", { HABITAT_ENVIRONMENT: "production" }));
});
