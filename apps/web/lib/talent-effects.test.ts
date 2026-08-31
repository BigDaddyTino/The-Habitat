import assert from "node:assert/strict";
import test from "node:test";
import { corruptedEffects, describeEffects, nodeEffects } from "./talent-effects";
import { talentClasses } from "./talent-trees";

test("every effect key points at a real node — a rename cannot orphan its numbers", () => {
  const real = new Set(
    talentClasses.flatMap((tree) => tree.branches.flatMap((branch) => branch.nodes.map((node) => `${tree.slug}/${node.id}`))),
  );
  for (const key of Object.keys(nodeEffects)) {
    assert.ok(real.has(key), `${key} carries numbers but no such node exists`);
  }
});

test("every class has a corrupted effect for phases one through six", () => {
  for (const tree of talentClasses) {
    const phases = corruptedEffects[tree.slug];
    assert.ok(phases, `${tree.slug} has no corrupted effects`);
    for (let phase = 1; phase <= 6; phase++) {
      assert.ok(phases[phase], `${tree.slug} phase ${phase} has no effect — the free branch would show an empty popout`);
    }
  }
});

test("the popout never shows an empty numbers list for a weighted node", () => {
  for (const [key, effect] of Object.entries(nodeEffects)) {
    if (Object.keys(effect).length === 0) continue; // declared narrative
    assert.ok(describeEffects(effect).length > 0, `${key} has weights but describes to nothing`);
  }
});

test("every node describes something concrete — the narrative fallback is extinct", () => {
  // Owner's ruling, 2026-08-31: carry weight is carry weight, not
  // "narrative". Combat nodes carry sim weights; world nodes carry
  // hand-written numbers. Nothing shows the fallback.
  for (const tree of talentClasses) {
    for (const branch of tree.branches) {
      for (const node of branch.nodes) {
        const effect = nodeEffects[`${tree.slug}/${node.id}`];
        assert.ok(effect && describeEffects(effect).length > 0, `${tree.slug}/${node.id} ("${node.name}") shows the narrative fallback`);
      }
    }
  }
});
