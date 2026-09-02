import assert from "node:assert/strict";
import test from "node:test";
import { pillars, spells, spellsForLicence } from "./spellbook";
import { spellsForClass, unlocksForSpell, unresolvedSpellNodes } from "./spell-unlocks";
import { talentClasses } from "./talent-trees";

test("six pillars, twenty-seven licence classes, one hundred and eight spells", () => {
  assert.equal(pillars.length, 6);
  assert.deepEqual(pillars.map((pillar) => pillar.slug), ["thermodynamics", "kinetics", "structure", "biologics", "cognition", "resonance"]);
  const licences = pillars.flatMap((pillar) => pillar.licences);
  assert.equal(licences.length, 27);
  assert.equal(spells.length, 108);
  assert.equal(new Set(spells.map((spell) => spell.id)).size, 108, "spell ids must be unique");
  for (const licence of licences) {
    const four = spellsForLicence(licence);
    assert.equal(four.length, 4, `${licence} must hold four spells`);
    assert.deepEqual(four.map((spell) => spell.tier), ["Licensed", "Licensed", "Certified", "Master"], `${licence} must run Licensed ×2, Certified, Master`);
  }
});

test("every spell is a Spell card with cost by tier, a range, an effect, an overcharge failure", () => {
  const costByTier = { Licensed: "2 pool · 1 charge", Certified: "4 pool · 2 charges", Master: "8 pool · 4 charges" };
  for (const spell of spells) {
    assert.equal(spell.card.kind, "Spell", `${spell.id} kind`);
    assert.ok(spell.card.cost?.startsWith(costByTier[spell.tier]), `${spell.id} cost must follow its tier (got ${spell.card.cost})`);
    assert.ok(spell.card.range, `${spell.id} needs a range`);
    assert.ok(spell.card.effect.length > 20, `${spell.id} effect too short`);
    assert.ok(spell.overcharge.length > 10, `${spell.id} needs an overcharge failure`);
    assert.ok(spell.flavor.length > 5, `${spell.id} needs its flavor line`);
    assert.ok(pillars.some((pillar) => pillar.slug === spell.pillar && pillar.licences.includes(spell.licence)), `${spell.id} sits under an unknown pillar or licence`);
    if (spell.pillar === "cognition") assert.equal(spell.damageType, undefined, `${spell.id}: Cognition deals no damage`);
  }
});

test("every spell-chip talent node opens at least one real spell", () => {
  assert.deepEqual(unresolvedSpellNodes, [], "spell nodes that matched nothing in the spellbook");
  for (const tree of talentClasses) {
    const reach = spellsForClass(tree.slug);
    const chipNodes = tree.branches.flatMap((branch) => branch.nodes.filter((node) => node.spell));
    if (chipNodes.length) assert.ok(reach.length >= chipNodes.length, `${tree.slug}: ${chipNodes.length} spell nodes reach only ${reach.length} spells`);
  }
  const seal = spells.find((spell) => spell.name === "Seal");
  assert.ok(seal);
  const openers = unlocksForSpell(seal.id).map((unlock) => `${unlock.classSlug}/${unlock.nodeId}`);
  assert.ok(openers.includes("bastion/first-ward"), "First Ward opens Seal");
  assert.ok(openers.includes("cypherist/shield-pylon"), "Shield Pylon opens Seal as hardware");
});
