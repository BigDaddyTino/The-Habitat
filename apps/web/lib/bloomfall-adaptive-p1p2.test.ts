import assert from "node:assert/strict";
import { test } from "node:test";
import { bloomfallCreatureEnhancements } from "./bloomfall-creature-enhancements";
import { bloomfallAdaptiveP0SelectedAssets } from "./bloomfall-adaptive-p0";
import {
  bloomfallAdaptiveP1P2Assets,
  bloomfallAdaptiveP1P2GenerationSummary,
  bloomfallAdaptiveP1P2RejectedAssets,
  bloomfallAdaptiveP1P2ReusedAssets,
  bloomfallAdaptiveP1P2SelectedAssets,
  getBloomfallAdaptiveP1P2Presentation,
} from "./bloomfall-adaptive-p1p2";
import { resolveCodexArtFile } from "./codex-art";

test("Prompt C2 locks the exact remaining P1/P2 visual matrix", () => {
  assert.equal(bloomfallAdaptiveP1P2SelectedAssets.length, 14);
  assert.equal(bloomfallAdaptiveP1P2RejectedAssets.length, 0);
  assert.deepEqual(bloomfallAdaptiveP1P2GenerationSummary, { attempts: 15, revisedSubjects: 1, rejectedAttempts: 1 });
  assert.equal(bloomfallAdaptiveP1P2ReusedAssets.length, 3);
  assert.equal(bloomfallAdaptiveP1P2Assets.filter((asset) => asset.status === "REVISE").length, 0);
  assert.equal(bloomfallAdaptiveP0SelectedAssets.length, 12);
  assert.deepEqual(bloomfallAdaptiveP1P2SelectedAssets.filter((asset) => asset.entitySlug === "rootback-grazer").map((asset) => asset.state), ["Carried-Mat Grazer", "Root-Clamped", "Bastion-Back"]);
  assert.deepEqual(bloomfallAdaptiveP1P2SelectedAssets.filter((asset) => asset.entitySlug === "mirejaw").map((asset) => asset.state), ["Flow-Reader", "Silt-Veiled", "Weir-Plated"]);
  assert.deepEqual(bloomfallAdaptiveP1P2SelectedAssets.filter((asset) => asset.entitySlug === "sump-eel").map((asset) => asset.state), ["Sump Scavenger", "Deep-Charge"]);
});

test("selected P1/P2 candidates clear every critical 9/10 gate", () => {
  for (const asset of bloomfallAdaptiveP1P2SelectedAssets) {
    assert.match(asset.sha256, /^[a-f0-9]{64}$/);
    assert.ok(asset.width > 1000 && asset.height > 900);
    assert.ok(asset.codexDevelopmentBinding);
    assert.ok(asset.matureTone.length > 10);
    assert.ok(asset.alt.length > 10 && asset.alt.length <= 180);
    for (const value of Object.values(asset.scores)) assert.ok(value >= 9);
  }
});

test("classification, NONE, exceptional, and promotion boundaries stay locked", () => {
  const bySlug = new Map(bloomfallCreatureEnhancements.map((entry) => [entry.slug, entry]));
  assert.equal(bySlug.get("rootback-grazer")?.classification, "FUNCTIONAL_ADAPTIVE");
  assert.equal(bySlug.get("mirejaw")?.classification, "FUNCTIONAL_ADAPTIVE");
  assert.equal(bySlug.get("sump-eel")?.classification, "MINOR_ADAPTIVE");
  for (const slug of ["glasswing-kite", "spore-lantern-colony", "bloommarked-remnant", "maintenance-unit-m-17"]) assert.equal(bySlug.get(slug)?.mutationEligibility, "NONE");
  for (const slug of ["the-bellwether", "switchmother", "old-drowner", "the-last-shift"]) assert.equal(bySlug.get(slug)?.classification, "EXCEPTIONAL_ABERRANT");
  assert.deepEqual(bloomfallCreatureEnhancements.filter((entry) => entry.promotedThreat.eligible).map((entry) => entry.slug).sort(), ["blackbloom-hart", "latchhound", "mirejaw"]);
  assert.equal(bloomfallAdaptiveP1P2Assets.map((asset) => String(asset.entitySlug)).includes("bloommarked-remnant"), false);
});

test("every classified entity presents explicitly, in whichever environment asks", () => {
  for (const slug of ["rootback-grazer", "mirejaw", "sump-eel"]) assert.equal(getBloomfallAdaptiveP1P2Presentation(slug)?.kind, "ADAPTIVE");
  for (const slug of ["glasswing-kite", "spore-lantern-colony", "maintenance-unit-m-17", "bloommarked-remnant"]) assert.equal(getBloomfallAdaptiveP1P2Presentation(slug)?.kind, "NONE");
  for (const slug of ["the-bellwether", "switchmother", "old-drowner"]) assert.equal(getBloomfallAdaptiveP1P2Presentation(slug)?.kind, "EXCEPTIONAL");
  assert.equal(getBloomfallAdaptiveP1P2Presentation("not-a-bloomfall-creature"), null);
});

test("the approved P1/P2 finals are served everywhere; the generation history never is", () => {
  const development = { HABITAT_ENVIRONMENT: "development" };
  const production = { HABITAT_ENVIRONMENT: "production" };
  assert.ok(resolveCodexArtFile("bloomfall-adaptive-p1p2", "mirejaw-flow-reader.png", development));
  assert.ok(resolveCodexArtFile("bloomfall-adaptive-p1p2", "mirejaw-flow-reader.png", production));
  assert.ok(resolveCodexArtFile("bloomfall-adaptive-p1p2-source", "mender-current-integrated-chassis-hero-iteration-2.png", development));
  assert.equal(resolveCodexArtFile("bloomfall-adaptive-p1p2-source", "mender-current-integrated-chassis-hero-iteration-2.png", production), null);
  assert.equal(resolveCodexArtFile("bloomfall-adaptive-p1p2-source", "../candidates/mirejaw-flow-reader.png", development), null);
});
