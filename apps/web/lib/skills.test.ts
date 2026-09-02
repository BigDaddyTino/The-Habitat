import assert from "node:assert/strict";
import test from "node:test";
import { skillRanks, skills, skillsByCategory } from "./skills";
import { cardForNode } from "./talent-cards";
import { talentClasses } from "./talent-trees";

test("twenty skills in five categories, five ranks, sixty techniques", () => {
  assert.equal(skills.length, 20);
  assert.equal(skillRanks.map((step) => step.rank).join(","), "Green,Practised,Reliable,Expert,Ceiling");
  const groups = skillsByCategory();
  assert.deepEqual(groups.map((group) => `${group.category}:${group.skills.length}`), ["Combat:4", "Field:4", "Technical:4", "Social:4", "Applied:4"]);
  assert.equal(skills.flatMap((skill) => skill.techniques).length, 60);
  assert.equal(new Set(skills.map((skill) => skill.slug)).size, 20, "skill slugs must be unique");
});

test("techniques run Practised, Expert, Ceiling; ceilings are capstones with a teacher", () => {
  for (const skill of skills) {
    assert.deepEqual(skill.techniques.map((technique) => technique.rank), ["Practised", "Expert", "Ceiling"], `${skill.slug} rank order`);
    for (const technique of skill.techniques) {
      if (technique.card.kind === "Active") {
        assert.ok(technique.card.cooldown && technique.card.range, `${skill.slug}/${technique.name} is Active without cooldown and range`);
      }
      if (technique.rank === "Ceiling") {
        assert.equal(technique.card.kind, "Capstone", `${skill.slug}/${technique.name} must be a Capstone`);
        assert.ok(technique.teacher, `${skill.slug}/${technique.name} needs a teacher`);
      }
    }
  }
});

test("a technique that names a talent node points at a real node and agrees with its card", () => {
  const ids = new Set(talentClasses.flatMap((tree) => tree.branches.flatMap((branch) => branch.nodes.map((node) => `${tree.slug}/${node.id}`))));
  let linked = 0;
  for (const skill of skills) {
    for (const technique of skill.techniques) {
      if (!technique.talentNode) continue;
      linked += 1;
      assert.ok(ids.has(technique.talentNode), `${skill.slug}/${technique.name} links to missing node ${technique.talentNode}`);
      const [classSlug, nodeId] = technique.talentNode.split("/");
      assert.ok(cardForNode(classSlug, nodeId), `${technique.talentNode} has no card to agree with`);
    }
  }
  assert.ok(linked >= 30, `expected most techniques to link to a node; got ${linked}`);
});
