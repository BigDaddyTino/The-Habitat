import assert from "node:assert/strict";
import test from "node:test";
import {
  bloomfallClassificationLabels,
  bloomfallCreatureEnhancements,
  bloomfallCreatureGuide,
  bloomfallCreatureNewImageCount,
  bloomfallMutationCards,
  renderBloomfallCreatureEnhancement,
  renderBloomfallCreatureGuide,
} from "./bloomfall-creature-enhancements";
import { bloomfallCreatureFieldGuide } from "./bloomfall-creature-field-guide";
import { bloomfallDamageTypes, bloomfallMutationLadder, bloomfallMutationRungs } from "./bloomfall-adaptive-ladder";
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

/** The five species a player can push up the ladder, and the four that stay put. */
const adaptiveSlugs = ["blackbloom-hart", "latchhound", "mirejaw", "rootback-grazer", "sump-eel"];
const fixedSlugs = ["bloommarked-remnant", "glasswing-kite", "maintenance-unit-m-17", "spore-lantern-colony"];
const bossSlugs = ["old-drowner", "switchmother", "the-bellwether", "the-last-shift"];

test("the manifest classifies every approved Bloomfall creature/entity once", () => {
  assert.equal(bloomfallCreatureEnhancements.length, 13);
  assert.deepEqual(
    [...new Set(bloomfallCreatureEnhancements.map((entry) => entry.slug))].sort(),
    Object.keys(expectedStates).sort(),
  );
  // The manifest's state list is the art/design spec and keeps its own shape.
  assert.deepEqual(
    Object.fromEntries(bloomfallCreatureEnhancements.map((entry) => [entry.slug, entry.states.length])),
    expectedStates,
  );
  assert.equal(bloomfallCreatureEnhancements.filter((entry) => entry.classification === "EXCEPTIONAL_ABERRANT").length, 4);
  assert.equal(bloomfallCreatureEnhancements.filter((entry) => entry.classification === "NONE").length, 4);
});

test("the ladder is one system: four climbable rungs plus the Aberrant seed", () => {
  assert.deepEqual(bloomfallMutationLadder.map((rung) => rung.key), [...bloomfallMutationRungs]);
  assert.deepEqual(bloomfallMutationLadder.map((rung) => rung.name), ["None", "Minor", "Functional", "Advanced", "Exceptional Aberrant"]);
  // The multipliers the design brief fixed: base, +20%, +100%, +250%.
  assert.deepEqual(bloomfallMutationLadder.slice(0, 4).map((rung) => rung.multiplier), [1, 1.2, 2, 3.5]);
  assert.ok(bloomfallMutationLadder.every((rung, index) => index === 0 || rung.multiplier > bloomfallMutationLadder[index - 1]!.multiplier));
  const advanced = bloomfallMutationLadder.find((rung) => rung.key === "ADVANCED")!;
  assert.match(advanced.defense, /Prisma/);
  assert.match(advanced.defense, /25%/);
  assert.match(bloomfallMutationLadder.find((rung) => rung.key === "ABERRANT")!.earned, /1%/);
});

test("every dossier has field-guide copy of the right shape, and nothing else does", () => {
  // The guide also covers the three named Aberrants that a surviving Advanced
  // can seed, plus the Reach's Mythic. They have a dossier and a boss card but
  // no design-spec record — the panel keys off the field guide, not the
  // enhancement manifest, precisely so they render.
  const cardOnlyBosses = ["the-blackweir-anaconda", "the-braid", "the-groundfault", "the-slow-hill"];
  assert.deepEqual(Object.keys(bloomfallCreatureFieldGuide).sort(), [...Object.keys(expectedStates), ...cardOnlyBosses].sort());
  for (const slug of cardOnlyBosses) assert.equal(bloomfallCreatureFieldGuide[slug]!.kind, "BOSS", `${slug} must be a boss card`);
  const byKind = (kind: string) => Object.entries(bloomfallCreatureFieldGuide).filter(([, guide]) => guide.kind === kind).map(([slug]) => slug).sort();
  const bossSlugsWithSeeded = [...bossSlugs, ...cardOnlyBosses].sort();
  assert.deepEqual(byKind("ADAPTIVE"), adaptiveSlugs);
  assert.deepEqual(byKind("FIXED"), fixedSlugs);
  assert.deepEqual(byKind("BOSS"), bossSlugsWithSeeded);

  for (const [slug, guide] of Object.entries(bloomfallCreatureFieldGuide)) {
    // A summary is a paragraph, not an essay — the whole point of the rewrite.
    assert.ok(!guide.summary.includes("\n"), `${slug} summary is more than one paragraph`);
    assert.ok(guide.summary.length < 700, `${slug} summary has grown back into an essay (${guide.summary.length} chars)`);
    if (guide.kind !== "ADAPTIVE") {
      assert.ok(guide.abilities.length >= 3, `${slug} lists fewer than three abilities`);
      assert.ok(guide.drops.trim().length > 0, `${slug} says nothing about what it drops`);
      continue;
    }
    // Every damage type a player can deal has an answer, both defensive and offensive.
    for (const damage of bloomfallDamageTypes) {
      assert.ok(guide.resistances[damage]?.effect, `${slug} has no ${damage} resistance`);
      assert.ok(guide.retaliation[damage]?.effect, `${slug} has no ${damage} retaliation`);
    }
    assert.equal(guide.advanced.length, 3, `${slug} must have exactly three Advanced attacks`);
    assert.ok(guide.aberrant.abilities.length >= 3, `${slug}'s Aberrant is underpowered on abilities`);
    for (const rung of bloomfallMutationRungs) {
      assert.ok(guide.forms[rung]?.length, `${slug} has no form name at ${rung}`);
      assert.ok(guide.drops[rung]?.length, `${slug} has no drop at ${rung}`);
    }
    assert.equal(guide.forms.ABERRANT, guide.aberrant.name, `${slug}'s Aberrant rung and Aberrant card disagree on the name`);
  }
});

test("an adaptive species renders five cards, in ladder order, with unique abilities", () => {
  for (const slug of adaptiveSlugs) {
    const entry = bloomfallCreatureEnhancements.find((candidate) => candidate.slug === slug)!;
    const guide = bloomfallCreatureGuide(entry);
    assert.equal(guide.kind, "ADAPTIVE");
    if (guide.kind !== "ADAPTIVE") return;
    const cards = bloomfallMutationCards(guide);
    assert.deepEqual(cards.map((card) => card.rung), [...bloomfallMutationRungs]);
    assert.deepEqual(cards.map((card) => card.label), ["None", "Minor", "Functional", "Advanced", "Exceptional Aberrant"]);
    for (const card of cards) {
      assert.ok(card.abilities.length >= 3, `${slug}/${card.rung} has too few abilities`);
      assert.equal(new Set(card.abilities.map((item) => item.name)).size, card.abilities.length, `${slug}/${card.rung} repeats an ability name`);
    }
    // The Minor and Functional cards are the damage-keyed tables, one row per type.
    assert.equal(cards[1]!.abilities.length, bloomfallDamageTypes.length);
    assert.equal(cards[2]!.abilities.length, bloomfallDamageTypes.length);
    assert.ok(cards[1]!.abilities.every((item) => item.name.includes(" → ")), `${slug} Minor card is not damage-keyed`);
  }
});

test("the dossier body is a summary, a loot list, and the ladder — and nothing else", () => {
  for (const entry of bloomfallCreatureEnhancements) {
    const body = renderBloomfallCreatureEnhancement(entry);
    const guide = bloomfallCreatureGuide(entry);
    const blocks = storyProseBlocks(body);
    const headings = blocks.flatMap((block) => (block.kind === "heading" && block.level === 2 ? [block.text] : []));
    const rungHeadings = blocks.flatMap((block) => (block.kind === "heading" && block.level === 3 ? [block.text] : []));

    if (guide.kind === "ADAPTIVE") {
      assert.deepEqual(headings, ["Why farm it", "Adaptive Mutation"], `${entry.slug} sections drifted`);
      assert.equal(rungHeadings.length, 5, `${entry.slug} does not print all five rungs`);
      for (const label of ["None", "Minor", "Functional", "Advanced", "Exceptional Aberrant"]) {
        assert.ok(rungHeadings.some((heading) => heading.startsWith(`${label} — `)), `${entry.slug} is missing the ${label} card`);
      }
      // Loot list plus one ability list per rung.
      assert.equal(blocks.filter((block) => block.kind === "list").length, 6, `${entry.slug} is missing a list block`);
      assert.ok(body.includes("+20%") && body.includes("+100%") && body.includes("+250%"), `${entry.slug} does not print the stat ladder`);
      assert.ok(body.includes("Prisma"), `${entry.slug} does not print the Advanced defense rule`);
    } else if (guide.kind === "BOSS") {
      assert.deepEqual(headings, ["Why farm it", "Mini-boss"], `${entry.slug} sections drifted`);
    } else {
      assert.deepEqual(headings, ["Why farm it", "Abilities", "Adaptive Mutation"], `${entry.slug} sections drifted`);
      assert.ok(body.includes(`**${bloomfallClassificationLabels.NONE}.**`), `${entry.slug} does not state its no-ladder decision`);
    }

    // The design specification stays in source; the reader never sees it.
    for (const leaked of ["## Ecology", "## Future state imagery", "Eligibility axis", "Aberrant status:", "Visual read", "Reversibility"]) {
      assert.ok(!body.includes(leaked), `${entry.slug} leaks ${leaked}`);
    }
  }
  assert.match(renderBloomfallCreatureEnhancement(bloomfallCreatureEnhancements.find((entry) => entry.slug === "maintenance-unit-m-17")!), /Mender/);
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

test("MYTHIC is a designation above Aberrant, and it changes nothing below it", () => {
  const mythic = bloomfallCreatureFieldGuide["the-blackweir-anaconda"]!;
  assert.equal(mythic.kind, "BOSS");
  if (mythic.kind !== "BOSS") return;
  assert.equal(mythic.tier, "MYTHIC");

  // One Mythic in the Reach. The rest of the per-region slots are reserved,
  // not empty, and a second one here would be a design decision, not a typo.
  const mythics = Object.entries(bloomfallCreatureFieldGuide)
    .filter(([, guide]) => guide.kind === "BOSS" && guide.tier === "MYTHIC")
    .map(([slug]) => slug);
  assert.deepEqual(mythics, ["the-blackweir-anaconda"]);

  // A Mythic fights in phases and prints them; an Aberrant stays one card.
  const body = renderBloomfallCreatureGuide(mythic);
  const blocks = storyProseBlocks(body);
  const headings = blocks.flatMap((block) => (block.kind === "heading" && block.level === 2 ? [block.text] : []));
  const phaseHeadings = blocks.flatMap((block) => (block.kind === "heading" && block.level === 3 ? [block.text] : []));
  assert.deepEqual(headings, ["Why farm it", "Mythic bounty"]);
  // The transition prints BETWEEN the phases, and only from its own field —
  // the page renders the same string, and a fight that narrates its own
  // transformation twice is what having two copies of it looks like.
  assert.deepEqual(phaseHeadings, ["Phase 1 — The Mire Stalker", "The transformation — about half", "Phase 2 — The Blackweir Coil"]);
  assert.equal(mythic.phases?.length, 2);
  assert.ok(mythic.transition, "a two-phase Mythic needs the moment between them");
  assert.ok(!mythic.phases?.[1]?.what.includes("arms retract"), "phase two must not re-narrate the transition");
  for (const phase of mythic.phases ?? []) {
    assert.ok(phase.abilities.length >= 3, `${phase.name} lists fewer than three abilities`);
  }

  // The un-tiered path is byte-identical to what it has always rendered. The
  // promotion gate fingerprints these bodies; a cosmetic renderer change that
  // silently rewrites seven live dossiers is a migration nobody asked for.
  const aberrant = bloomfallCreatureFieldGuide["old-drowner"]!;
  assert.equal(aberrant.kind, "BOSS");
  if (aberrant.kind !== "BOSS") return;
  assert.equal(aberrant.tier, undefined);
  assert.equal(
    renderBloomfallCreatureGuide(aberrant),
    `${aberrant.summary}\n\n## Why farm it\n\n${aberrant.drops}\n\n## Mini-boss\n\n**Spawn.** ${aberrant.spawn}\n\n**Stats.** ${aberrant.stats}\n\n**Abilities.**\n\n${aberrant.abilities.map((item) => `- **${item.name}.** ${item.effect.charAt(0).toUpperCase() + item.effect.slice(1)}`).join("\n")}`,
  );
});
