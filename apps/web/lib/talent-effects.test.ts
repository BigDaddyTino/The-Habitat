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

test("most of each tree carries numbers, and pure-narrative nodes are the exception", () => {
  // The Procurator sets the floor: half its tree — Envoy, Magnate,
  // Sovereign — does its work at tables, markets and thrones, which is the
  // class. Every other tree clears sixty percent.
  for (const tree of talentClasses) {
    const ids = tree.branches.flatMap((branch) => branch.nodes.map((node) => `${tree.slug}/${node.id}`));
    const weighted = ids.filter((id) => nodeEffects[id] && Object.keys(nodeEffects[id]).length > 0);
    const floor = tree.slug === "procurator" ? 0.45 : 0.6;
    assert.ok(weighted.length / ids.length >= floor, `${tree.slug}: only ${weighted.length}/${ids.length} nodes carry numbers`);
  }
});
