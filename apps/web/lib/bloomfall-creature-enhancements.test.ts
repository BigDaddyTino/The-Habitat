import assert from "node:assert/strict";
import test from "node:test";
import {
  bloomfallCreatureEnhancements,
  bloomfallCreatureNewImageCount,
  renderBloomfallCreatureEnhancement,
} from "./bloomfall-creature-enhancements";

const expectedStates: Record<string, number> = {
  "blackbloom-hart": 4,
  "rootback-grazer": 3,
  "glasswing-kite": 1,
  mirejaw: 3,
  "sump-eel": 2,
  "spore-lantern-colony": 1,
  latchhound: 4,
  "bloommarked-remnant": 1,
  "the-bellwether": 1,
  switchmother: 1,
  "old-drowner": 1,
  "the-last-shift": 1,
  "maintenance-unit-m-17": 1,
};

test("the Prompt B manifest classifies every approved Bloomfall creature/entity once", () => {
  assert.equal(bloomfallCreatureEnhancements.length, 13);
  assert.deepEqual(
    [...new Set(bloomfallCreatureEnhancements.map((entry) => entry.slug))].sort(),
    Object.keys(expectedStates).sort(),
  );
  assert.deepEqual(
    Object.fromEntries(bloomfallCreatureEnhancements.map((entry) => [entry.slug, entry.states.length])),
    expectedStates,
  );
  assert.equal(bloomfallCreatureEnhancements.filter((entry) => entry.classification === "EXCEPTIONAL_ABERRANT").length, 4);
  assert.equal(bloomfallCreatureEnhancements.filter((entry) => entry.classification === "ADVANCED_ADAPTIVE").length, 2);
  assert.equal(bloomfallCreatureEnhancements.filter((entry) => entry.classification === "FUNCTIONAL_ADAPTIVE").length, 2);
  assert.equal(bloomfallCreatureEnhancements.filter((entry) => entry.classification === "MINOR_ADAPTIVE").length, 1);
  assert.equal(bloomfallCreatureEnhancements.filter((entry) => entry.classification === "NONE").length, 4);
});

test("taxonomy, promotion, combat families, and Codex prose stay bounded", () => {
  const promoted = bloomfallCreatureEnhancements.filter((entry) => entry.promotedThreat.eligible).map((entry) => entry.slug).sort();
  assert.deepEqual(promoted, ["blackbloom-hart", "latchhound", "mirejaw"]);

  for (const entry of bloomfallCreatureEnhancements) {
    assert.notEqual(entry.taxonomyCategory, "abomination");
    assert.ok(new Set(entry.combatFamilies).size === entry.combatFamilies.length, `${entry.slug} repeats a combat family`);
    if (entry.mutationEligibility === "NONE") assert.equal(entry.combatFamilies.length, 0, `${entry.slug} cannot gain combat mutations`);
    const body = renderBloomfallCreatureEnhancement(entry);
    assert.match(body, /## Ecology/);
    assert.match(body, /## Adaptive Mutation/);
    assert.match(body, /## Harvest and consequence/);
    assert.match(body, /## Future state imagery/);
    assert.ok(body.includes(entry.classification.replaceAll("_", " ")));
    assert.ok(!body.includes("Tomas Vey"), `${entry.slug} uses a non-canonical character name`);
  }
  assert.match(renderBloomfallCreatureEnhancement(bloomfallCreatureEnhancements.find((entry) => entry.slug === "maintenance-unit-m-17")!), /Tomas Venn/);
});

test("the approved image workload is exact and reuses final V3 heroes", () => {
  const totals = Object.fromEntries(["P0", "P1", "P2", "P3"].map((priority) => [
    priority,
    bloomfallCreatureEnhancements
      .filter((entry) => entry.image.priority === priority)
      .reduce((sum, entry) => sum + bloomfallCreatureNewImageCount(entry), 0),
  ]));
  assert.deepEqual(totals, { P0: 12, P1: 9, P2: 5, P3: 1 });
  assert.equal(Object.values(totals).reduce((sum, value) => sum + value, 0), 27);
  assert.deepEqual(
    bloomfallCreatureEnhancements.filter((entry) => entry.image.existingV3AssetId === entry.slug).map((entry) => entry.slug).sort(),
    ["switchmother", "the-bellwether"],
  );
});
