import assert from "node:assert/strict";
import test from "node:test";
import {
  bloomfallClassificationLabels,
  bloomfallCreatureEnhancements,
  bloomfallCreatureNewImageCount,
  renderBloomfallCreatureEnhancement,
} from "./bloomfall-creature-enhancements";
import { bloomfallCreatureFieldGuide } from "./bloomfall-creature-field-guide";
import { storyProseBlocks } from "./story-prose";

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

test("taxonomy, promotion, and combat families stay bounded", () => {
  const promoted = bloomfallCreatureEnhancements.filter((entry) => entry.promotedThreat.eligible).map((entry) => entry.slug).sort();
  assert.deepEqual(promoted, ["blackbloom-hart", "latchhound", "mirejaw"]);

  for (const entry of bloomfallCreatureEnhancements) {
    assert.notEqual(entry.taxonomyCategory, "abomination");
    assert.ok(new Set(entry.combatFamilies).size === entry.combatFamilies.length, `${entry.slug} repeats a combat family`);
    if (entry.mutationEligibility === "NONE") assert.equal(entry.combatFamilies.length, 0, `${entry.slug} cannot gain combat mutations`);
  }
});

test("every manifest entry and state has field-guide copy, and nothing else does", () => {
  assert.deepEqual(Object.keys(bloomfallCreatureFieldGuide).sort(), Object.keys(expectedStates).sort());
  for (const entry of bloomfallCreatureEnhancements) {
    const guide = bloomfallCreatureFieldGuide[entry.slug];
    // The guide names exactly the manifest's states, in the manifest's order.
    assert.deepEqual(Object.keys(guide.states), entry.states.map((state) => state.key), `${entry.slug} guide states drift from the manifest`);
    assert.ok(guide.specimen.length >= 1, `${entry.slug} has no specimen paragraph`);
    for (const state of entry.states) {
      const copy = guide.states[state.key]!;
      assert.ok(copy.abilities.length >= 2, `${entry.slug}/${state.key} lists fewer than two abilities`);
      assert.ok(new Set(copy.abilities.map((item) => item.name)).size === copy.abilities.length, `${entry.slug}/${state.key} repeats an ability name`);
      for (const field of [copy.read, copy.counter, copy.unlock]) assert.ok(field.trim().length > 0, `${entry.slug}/${state.key} leaves a field blank`);
    }
    // The named-threat rule is printed exactly when the species can be promoted.
    assert.equal(guide.hunt.named !== null, entry.promotedThreat.eligible, `${entry.slug} named-threat copy disagrees with its promotion rule`);
  }
});

test("the dossier body reads as specimen, field notes, mutations, and the hunt", () => {
  for (const entry of bloomfallCreatureEnhancements) {
    const body = renderBloomfallCreatureEnhancement(entry);
    const blocks = storyProseBlocks(body);
    const headings = blocks.flatMap((block) => (block.kind === "heading" && block.level === 2 ? [block.text] : []));
    assert.deepEqual(headings, ["Field notes", "Mutations", "Why hunt it"], `${entry.slug} sections drifted`);
    // One h3 per state, each with its own ability list.
    const stateHeadings = blocks.filter((block) => block.kind === "heading" && block.level === 3);
    assert.equal(stateHeadings.length, entry.states.length, `${entry.slug} prints the wrong number of mutation states`);
    for (const state of entry.states) assert.ok(body.includes(`### ${state.name} — `), `${entry.slug} does not print ${state.name}`);
    assert.equal(blocks.filter((block) => block.kind === "list").length, entry.states.length, `${entry.slug} is missing an ability list`);
    assert.ok(body.includes(`**${bloomfallClassificationLabels[entry.classification]}.**`), `${entry.slug} does not name its tier`);
    // The design fields stay in source; the reader never sees them.
    for (const leaked of ["## Ecology", "## Future state imagery", "Eligibility axis", "Aberrant status:", "Reactor:"]) assert.ok(!body.includes(leaked), `${entry.slug} leaks ${leaked}`);
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
