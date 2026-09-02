import assert from "node:assert/strict";
import test from "node:test";
import { abilityKindLabel } from "./ability-cards";
import { cardForCorruptedPhase, cardForNode, talentCards } from "./talent-cards";
import { corruptedEffects, effectsForNode } from "./talent-effects";
import { talentClasses } from "./talent-trees";

/**
 * The cards are the readable layer over the trees; these tests keep them
 * complete (every node, every corrupted phase), well-formed (Actives carry a
 * cooldown and range, Spells carry a cost), honest about what the sims
 * measured, and in the vocabulary the wound model uses.
 */

test("every node of every class has a card, and every corrupted phase too", () => {
  for (const tree of talentClasses) {
    for (const branch of tree.branches) {
      for (const node of branch.nodes) {
        const card = cardForNode(tree.slug, node.id);
        assert.ok(card, `${tree.slug}/${node.id} has no card`);
        assert.ok(card.effect.trim().length > 8, `${tree.slug}/${node.id} effect is too short to say anything`);
      }
    }
    for (let phase = 1; phase <= 7; phase++) {
      const card = cardForCorruptedPhase(tree.slug, phase);
      assert.ok(card, `${tree.slug} corrupted phase ${phase} has no card`);
      assert.equal(card.kind, "Corrupted", `${tree.slug} corrupted phase ${phase} must be kind Corrupted`);
    }
  }
});

test("no card names a node that does not exist", () => {
  const ids = new Set(talentClasses.flatMap((tree) => tree.branches.flatMap((branch) => branch.nodes.map((node) => `${tree.slug}/${node.id}`))));
  for (const key of Object.keys(talentCards)) {
    if (/\/corrupt-[1-7]$/.test(key)) continue;
    assert.ok(ids.has(key), `card ${key} names a node that is not in the trees`);
  }
});

test("actives carry a cooldown and a range; spell unlocks carry a cost and a range", () => {
  for (const [key, card] of Object.entries(talentCards)) {
    assert.ok(card.kind in abilityKindLabel, `${key} has unknown kind ${card.kind}`);
    if (card.kind === "Active") {
      assert.ok(card.cooldown, `${key} is Active with no cooldown`);
      assert.ok(card.range, `${key} is Active with no range`);
    }
    if (card.kind === "Spell") {
      assert.ok(card.cost, `${key} is a Spell with no cost`);
      assert.ok(card.range, `${key} is a Spell with no range`);
      assert.match(card.effect, /^Unlocks /, `${key} spell effect must open with "Unlocks"`);
    }
  }
});

test("the kind matches the node's shape: forks are Choice, ceilings Capstone", () => {
  for (const tree of talentClasses) {
    for (const branch of tree.branches) {
      for (const node of branch.nodes) {
        const card = cardForNode(tree.slug, node.id)!;
        if (node.fork) assert.equal(card.kind, "Choice", `${tree.slug}/${node.id} is a fork half and must be Choice`);
        else if (node.ceiling) assert.equal(card.kind, "Capstone", `${tree.slug}/${node.id} is a ceiling and must be Capstone`);
        else if (node.spell) assert.equal(card.kind, "Spell", `${tree.slug}/${node.id} opens a spell and must be Spell`);
      }
    }
  }
});

test("cards speak the wound model's language, never hit points", () => {
  const banned = /\b(hp|hit points|health|mana)\b/i;
  for (const [key, card] of Object.entries(talentCards)) {
    assert.doesNotMatch(`${card.effect} ${card.notes ?? ""}`, banned, `${key} uses a banned word`);
  }
});

/** The sim's percentages must appear in the effect text exactly. */
function percentsIn(text: string): Set<number> {
  return new Set([...text.matchAll(/([−+-]?)(\d+(?:\.\d+)?)%/g)].map((match) => Number(match[2])));
}

test("where the sims carry a number, the effect line states it", () => {
  const checks: Array<[string, number | undefined]> = [];
  for (const tree of talentClasses) {
    for (const branch of tree.branches) {
      for (const node of branch.nodes) {
        const effect = effectsForNode(tree.slug, node.id);
        const card = cardForNode(tree.slug, node.id)!;
        if (!effect) continue;
        const text = `${card.effect} ${card.notes ?? ""}`;
        const found = percentsIn(text);
        const expectPct = (value: number | undefined) => {
          if (value === undefined) return;
          const pct = Math.round(Math.abs(value) * 100);
          assert.ok(found.has(pct), `${tree.slug}/${node.id}: expected ${pct}% in "${card.effect}"`);
        };
        expectPct(effect.accuracy);
        expectPct(effect.damageBonus);
        if (effect.incoming !== undefined && effect.incoming !== 1) expectPct(effect.incoming - 1);
        expectPct(effect.partyMitigation);
        expectPct(effect.extraAction);
        expectPct(effect.concealment);
        expectPct(effect.detection);
        expectPct(effect.control);
        expectPct(effect.ammo);
        if (effect.castCost !== undefined && effect.castCost !== 1) expectPct(effect.castCost - 1);
        if (effect.toughness) assert.match(text, new RegExp(`\\+${effect.toughness} Hit`), `${tree.slug}/${node.id}: expected +${effect.toughness} Hit before Down`);
        if (effect.dyingClock) assert.match(text, new RegExp(`\\+${effect.dyingClock}s`), `${tree.slug}/${node.id}: expected +${effect.dyingClock}s on the Dying clock`);
        if (effect.resourceCap) assert.match(text, new RegExp(`\\+${effect.resourceCap} maximum`), `${tree.slug}/${node.id}: expected +${effect.resourceCap} maximum pool / charges`);
        checks.push([`${tree.slug}/${node.id}`, effect.damageBonus]);
      }
    }
  }
  assert.ok(checks.length > 250, "the sim-backed node count fell — did the effects map shrink?");
});

test("corrupted cards state the free power the sims give each phase", () => {
  for (const tree of talentClasses) {
    for (const [phase, effect] of Object.entries(corruptedEffects[tree.slug] ?? {})) {
      const card = cardForCorruptedPhase(tree.slug, Number(phase))!;
      const found = percentsIn(`${card.effect} ${card.notes ?? ""}`);
      for (const value of [effect.accuracy, effect.damageBonus, effect.concealment, effect.detection, effect.control, effect.partyMitigation, effect.extraAction, effect.initiative]) {
        if (value !== undefined) assert.ok(found.has(Math.round(Math.abs(value) * 100)), `${tree.slug} phase ${phase}: expected ${Math.round(Math.abs(value) * 100)}%`);
      }
    }
  }
});
