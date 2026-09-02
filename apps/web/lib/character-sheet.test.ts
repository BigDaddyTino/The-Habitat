import assert from "node:assert/strict";
import test from "node:test";
import { attributeNames, classAllotments, creationRules, species, startingRungs } from "./character-sheet";
import { talentClasses } from "./talent-trees";

test("every class has a starting allotment of nine rungs shaped 3 · 2 · 1 · 1 · 1 · 1", () => {
  assert.equal(classAllotments.length, talentClasses.length);
  for (const tree of talentClasses) {
    const rungs = startingRungs(tree.slug);
    assert.ok(rungs, `${tree.slug} has no allotment`);
    const values = attributeNames.map((name) => rungs[name]);
    assert.equal(values.reduce((sum, value) => sum + value, 0), creationRules.baseTotal, `${tree.slug} must total ${creationRules.baseTotal}`);
    assert.deepEqual([...values].sort((a, b) => b - a), [3, 2, 1, 1, 1, 1], `${tree.slug} must be shaped 3 · 2 · 1 · 1 · 1 · 1`);
    assert.ok(values.every((value) => value >= 1), `${tree.slug}: nobody starts at 0`);
  }
});

test("the primary attribute is the one the class's growth line drives first", () => {
  for (const entry of classAllotments) {
    const tree = talentClasses.find((candidate) => candidate.slug === entry.classSlug)!;
    const [first, second] = tree.growth.replace(" per level", "").split(" / ").map((part) => part.replace(/^\+\d+\s+/, ""));
    assert.equal(entry.primary, first, `${entry.classSlug} primary should follow its growth line`);
    assert.equal(entry.secondary, second, `${entry.classSlug} secondary should follow its growth line`);
  }
});

test("a recruit signs inside the 7-to-14 band under every species cap", () => {
  for (const tree of talentClasses) {
    const rungs = startingRungs(tree.slug)!;
    const level = creationRules.baseTotal + creationRules.freePoints;
    assert.ok(level >= 7 && level <= 14, `${tree.slug} signs at ${level}`);
    for (const kind of species) {
      for (const name of attributeNames) {
        const cap = kind.caps[name];
        if (cap !== null) assert.ok(rungs[name] <= cap, `${tree.slug} ${name} ${rungs[name]} exceeds ${kind.name}'s cap ${cap}`);
        assert.ok(rungs[name] <= creationRules.deskCap, `${tree.slug} ${name} exceeds the desk cap`);
      }
    }
  }
});
