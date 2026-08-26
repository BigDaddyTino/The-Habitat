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

test("the presentation covers two ladders, one exceptional case, and one explicit NONE case", () => {
  assert.equal(getBloomfallAdaptiveP0Presentation("blackbloom-hart")?.kind, "ADAPTIVE");
  assert.equal(getBloomfallAdaptiveP0Presentation("latchhound")?.kind, "ADAPTIVE");
  assert.equal(getBloomfallAdaptiveP0Presentation("the-last-shift")?.kind, "EXCEPTIONAL");
  assert.equal(getBloomfallAdaptiveP0Presentation("glasswing-kite")?.kind, "NONE");
  assert.equal(getBloomfallAdaptiveP0Presentation("not-a-bloomfall-creature"), null);
});

test("the approved finals are served everywhere; the generation history never is", () => {
  const development = { HABITAT_ENVIRONMENT: "development" };
  const production = { HABITAT_ENVIRONMENT: "production" };
  const final = "blackbloom-hart-gradient-sensing.png";
  const revisedOut = "blackbloom-hart-grounded-crown-iteration-1-revise.png";

  // The candidates directory holds only owner-approved finals, so promotion
  // serves it like any other art package.
  assert.ok(resolveCodexArtFile("bloomfall-adaptive-p0", final, development));
  assert.ok(resolveCodexArtFile("bloomfall-adaptive-p0", final, production));

  // The sources beside it hold every iteration review sent back. That is local
  // evidence, and no release opens it.
  assert.ok(resolveCodexArtFile("bloomfall-adaptive-p0-source", revisedOut, development));
  assert.equal(resolveCodexArtFile("bloomfall-adaptive-p0-source", revisedOut, production), null);

  // Traversal stays impossible in either environment.
  assert.equal(resolveCodexArtFile("bloomfall-adaptive-p0-source", "../candidates/blackbloom-hart-gradient-sensing.png", development), null);
  assert.ok(resolveCodexArtFile("bloomfall-v3", "the-bellwether.png", production));
});
