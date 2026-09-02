import assert from "node:assert/strict";
import test from "node:test";
import { courtDay, faiths, groundVerbs, holdingRungs, realmTrees, siegeLaw, standingLaws } from "./kingdom";

test("five rungs of holding, each adding verbs and none retiring the ones below", () => {
  assert.deepEqual(holdingRungs.map((rung) => rung.name), ["Homestead", "Outpost", "Town", "City", "Kingdom"]);
  for (const rung of holdingRungs) assert.ok(rung.verbs.length >= 3, `${rung.name} adds too few verbs`);
  assert.equal(holdingRungs.filter((rung) => rung.teaches).length, 3, "the Riverlands' Three Charters teach rungs one through three");
});

test("four ways to get ground, six realm trees, five faiths and the secular crown", () => {
  assert.deepEqual(groundVerbs.map((verb) => verb.name), ["Buy", "Seize", "Earn", "Found"]);
  assert.equal(realmTrees.length, 6);
  assert.equal(faiths.length, 6);
  assert.equal(faiths.filter((faith) => faith.secular).length, 1);
  for (const faith of faiths) {
    assert.ok(faith.perk.length > 20 && faith.price.length > 20, `${faith.name}: every faith buys something real and costs something real`);
  }
});

test("the siege has two postures and Court Day four priced options, ordered as the sims measured", () => {
  assert.deepEqual(siegeLaw.postures.map((posture) => posture.name), ["Storm", "Wait"]);
  const values = courtDay.options.map((option) => Number(option.value.match(/^(\d+)/)?.[1]));
  assert.deepEqual(values, [771, 542, 313, 192]);
  assert.ok(standingLaws.length >= 5);
});
