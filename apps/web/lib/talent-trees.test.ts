import assert from "node:assert/strict";
import test from "node:test";
import { talentClasses, talentPointsAtLevel } from "./talent-trees";

test("the point formula pays 1 a level, 5 at level 1 and every 10th, 144 at the cap", () => {
  assert.equal(talentPointsAtLevel(1), 5);
  assert.equal(talentPointsAtLevel(9), 13);
  assert.equal(talentPointsAtLevel(10), 18);
  assert.equal(talentPointsAtLevel(50), 74);
  assert.equal(talentPointsAtLevel(100), 144);
});

test("eight classes, six branches each, core first, 48-50 bought nodes and 7 corrupted", () => {
  assert.equal(talentClasses.length, 8);
  for (const tree of talentClasses) {
    assert.equal(tree.branches.length, 6, `${tree.slug} must have a core and five branches`);
    assert.equal(tree.branches[0].core, true, `${tree.slug}'s first branch must be the core`);
    const bought = tree.branches.reduce((sum, branch) => sum + branch.nodes.length, 0);
    assert.ok(bought >= 48 && bought <= 50, `${tree.slug} has ${bought} bought nodes`);
    assert.equal(tree.corrupted.nodes.length, 7, `${tree.slug} must carry the full corrupted ladder`);
    assert.deepEqual(tree.corrupted.nodes.map((node) => node.phase), [1, 2, 3, 4, 5, 6, 7], `${tree.slug}'s corrupted branch must run phase 1 to 7 in order`);
  }
});

test("node ids are unique per class, costs run 1-5, and every reference resolves", () => {
  for (const tree of talentClasses) {
    const seen = new Set<string>();
    const all = new Map(tree.branches.flatMap((branch) => branch.nodes.map((node) => [node.id, node] as const)));
    for (const branch of tree.branches) {
      for (const node of branch.nodes) {
        assert.ok(!seen.has(node.id), `${tree.slug} duplicates node id ${node.id}`);
        seen.add(node.id);
        assert.ok(node.cost >= 1 && node.cost <= 5, `${tree.slug}/${node.id} costs ${node.cost}`);
        for (const required of node.requiresAny ?? []) {
          assert.ok(all.has(required), `${tree.slug}/${node.id} requires missing node ${required}`);
        }
      }
    }
  }
});

test("weaves are symmetric bridges and forks are symmetric exclusive pairs", () => {
  for (const tree of talentClasses) {
    const all = new Map(tree.branches.flatMap((branch) => branch.nodes.map((node) => [node.id, node] as const)));
    for (const node of all.values()) {
      if (node.weave) {
        const partner = all.get(node.weave);
        assert.ok(partner, `${tree.slug}/${node.id} weaves to missing ${node.weave}`);
        assert.equal(partner?.weave, node.id, `${tree.slug}: weave ${node.id} ↔ ${node.weave} must point both ways`);
      }
      if (node.fork) {
        const partner = all.get(node.fork);
        assert.ok(partner, `${tree.slug}/${node.id} forks against missing ${node.fork}`);
        assert.equal(partner?.fork, node.id, `${tree.slug}: fork ${node.id} ⟂ ${node.fork} must point both ways`);
      }
    }
  }
});

test("every tree's bought nodes fit the level-100 budget, leaving ability ranks as the sink", () => {
  // A capped character can clear their tree's nodes but never max the
  // ability ranks (I-III) on top — that sink is where levels 90-100 keep
  // meaning. Structurally: node cost sits inside the 144 budget, is deep
  // enough that a mid-game character genuinely chooses, and every class
  // has spell nodes for the ranks to attach to.
  for (const tree of talentClasses) {
    const nodes = tree.branches.flatMap((branch) => branch.nodes);
    const nodeCost = nodes.reduce((sum, node) => sum + node.cost, 0);
    assert.ok(nodeCost <= 144, `${tree.slug}'s bought nodes cost ${nodeCost} — must fit the level-100 budget`);
    assert.ok(nodeCost >= 110, `${tree.slug}'s bought nodes cost ${nodeCost} — too shallow to force mid-game choices`);
    // The Procurator is the one deliberately spell-free tree — the
    // commander's magic is other people. Every other class carries spell
    // nodes for the ranks to attach to.
    if (tree.slug !== "procurator") {
      assert.ok(nodes.filter((node) => node.spell).length >= 3, `${tree.slug} needs spell nodes for ability ranks to attach to`);
    } else {
      assert.equal(nodes.filter((node) => node.spell).length, 0, "the Procurator stays spell-free by design");
    }
  }
});
