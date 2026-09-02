import assert from "node:assert/strict";
import test from "node:test";
import { courtDay, courtSeats, crownRanks, faiths, groundVerbs, kingdomLevels, provings, realmPoints, realmTrees, riverlandsPlots, siegeLaw, standingLaws } from "./kingdom";

test("the five Ranks of the Crown are the level system: fifteen levels, three a rank, a proving at every third", () => {
  assert.deepEqual(crownRanks.map((rank) => rank.title), ["Freeholder", "Warden", "Magistrate", "Lord", "Crown"]);
  assert.deepEqual(crownRanks.map((rank) => rank.realm), ["The Freehold", "The Ward", "The Township", "The City", "The Kingdom"]);
  assert.deepEqual(crownRanks.map((rank) => rank.levels), [[1, 3], [4, 6], [7, 9], [10, 12], [13, 15]]);
  for (const rank of crownRanks) assert.ok(rank.verbs.length >= 3, `${rank.title} adds too few verbs`);
  assert.equal(kingdomLevels.length, 15);
  assert.deepEqual(kingdomLevels.map((row) => row.level), Array.from({ length: 15 }, (_, index) => index + 1));
  for (const row of kingdomLevels) {
    const rank = crownRanks.find((candidate) => candidate.numeral === row.rank)!;
    assert.ok(row.level >= rank.levels[0] && row.level <= rank.levels[1], `level ${row.level} filed under the wrong rank`);
    assert.ok(row.perk.length > 3 && row.grants.length > 20, `level ${row.level} grants nothing readable`);
  }
  assert.equal(new Set(kingdomLevels.map((row) => row.perk)).size, 15, "every level's perk has its own name");
  assert.deepEqual(provings.map((proving) => proving.afterLevel), [3, 6, 9, 12], "a ceiling at every third level, four provings");
  assert.deepEqual(provings.map((proving) => proving.name), ["The Held Night", "The Second Core", "The Doctrine Crisis", "The Recognition"]);
  for (const [index, proving] of provings.entries()) {
    assert.equal(proving.from, crownRanks[index].title);
    assert.equal(proving.to, crownRanks[index + 1].title);
  }
  assert.equal(courtSeats.length, 6, "six court seats, one per Heartland tutor stop");
});

test("plots are plots, not ranks: the Riverlands holds three Charters and no rank is bought with one", () => {
  assert.equal(riverlandsPlots.length, 3, "the Riverlands holds three plots: the Charters");
  assert.deepEqual(riverlandsPlots.map((plot) => plot.slug), ["first-charter", "second-charter", "third-charter"]);
  for (const rank of crownRanks) assert.doesNotMatch(rank.how, /charter/i, "charters are plots, not ranks of the crown");
});

test("four ways to get ground, six realm trees of seven nodes with a Crown-only capstone, five faiths and the secular crown", () => {
  assert.deepEqual(groundVerbs.map((verb) => verb.name), ["Buy", "Seize", "Earn", "Found"]);
  assert.deepEqual(realmTrees.map((tree) => tree.name), ["Might", "Coffers", "Works", "Arcana", "Roots", "Faith"]);
  const ids = new Set<string>();
  let onOffer = 0;
  for (const tree of realmTrees) {
    assert.equal(tree.nodes.length, 7, `${tree.name} holds seven nodes`);
    const capstone = tree.nodes.at(-1)!;
    assert.ok(capstone.capstone && capstone.rank === "V", `${tree.name}'s last node is its Crown-only capstone`);
    assert.equal(tree.nodes.filter((node) => node.capstone).length, 1);
    for (const node of tree.nodes) {
      assert.ok(node.cost >= 1 && node.cost <= 3, `${node.name}: nodes cost one to three points`);
      assert.ok(!ids.has(node.id), `${node.id} is reused across trees`);
      ids.add(node.id);
      onOffer += node.cost;
    }
  }
  assert.equal(onOffer, realmPoints.onOffer, "the page's points-on-offer figure matches the trees");
  assert.equal(realmPoints.total, 15 * realmPoints.perLevel + 4 * realmPoints.perProving);
  assert.ok(realmPoints.total < onOffer, "nobody owns everything");
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
