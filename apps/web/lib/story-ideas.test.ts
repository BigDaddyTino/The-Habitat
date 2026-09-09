import assert from "node:assert/strict";
import test from "node:test";
import { storyIdeaFacets, storyIdeaStageLabel, storyIdeaStageLabels, storyThreadStatuses } from "@habitat/shared";
import { ideaFacetsOf, ideaPreview, ideaSectionsOf, ideaStatusOf, ideaTabs } from "./story-ideas-pure";
import { cutOnWord } from "./story-ideas-pure";

test("facets come back in canonical order and unknown ones are dropped", () => {
  assert.deepEqual(ideaFacetsOf({ facets: ["characters", "bogus", "story", "story"] }), ["story", "characters"]);
  assert.deepEqual(ideaFacetsOf({ facets: "story" }), []);
  assert.deepEqual(ideaFacetsOf(null), []);
  assert.deepEqual(ideaFacetsOf({}), []);
});

test("an idea shows Overview, then only the facets it touches", () => {
  assert.deepEqual(ideaTabs([]), ["overview"]);
  assert.deepEqual(ideaTabs(["models"]), ["overview", "models"]);
  assert.deepEqual(ideaTabs(["characters", "story"]), ["overview", "story", "characters"]);
  assert.deepEqual(ideaTabs([...storyIdeaFacets]), ["overview", ...storyIdeaFacets]);
});

test("every thread status has a plain-language stage label, and no label is the raw status", () => {
  for (const status of storyThreadStatuses) {
    const label = storyIdeaStageLabels[status];
    assert.ok(label && label.length > 0, `${status} has a label`);
    assert.match(label, /^[A-Z]/, `${status} reads as a word, not a slug`);
    assert.ok(!label.includes("-"), `${status} label has no hyphen`);
    assert.equal(storyIdeaStageLabel(status), label);
  }
  assert.equal(storyIdeaStageLabel(null), "New");
  assert.equal(storyIdeaStageLabel(undefined), "New");
});

test("the stage reads only real statuses", () => {
  assert.equal(ideaStatusOf({ threadStatus: "planned" }), "planned");
  assert.equal(ideaStatusOf({ threadStatus: "PLANNED" }), null);
  assert.equal(ideaStatusOf({}), null);
});

test("sections keep their author and drop malformed rows", () => {
  const good = { id: "a", facet: "systems", body: "Cooldowns should show on the ring.", authorUserId: "u1", authorName: "Hunter", at: "2026-09-09" };
  const rows = ideaSectionsOf({ sections: [good, { id: "b", facet: "nope", body: "x" }, { facet: "story" }, "junk"] });
  assert.equal(rows.length, 1);
  assert.equal(rows[0]?.authorName, "Hunter");
  assert.equal(rows[0]?.facet, "systems");
  assert.deepEqual(ideaSectionsOf({ sections: "x" }), []);
});

test("the card preview prefers the summary, strips markup, and cuts on a word", () => {
  assert.equal(ideaPreview("A market that moves.", "**Long** body"), "A market that moves.");
  assert.ok(!ideaPreview(null, "**Bold** and [[the-old-hunger]] linked.").includes("**"), "markdown emphasis is stripped");
  assert.ok(!ideaPreview(null, "**Bold** and [[the-old-hunger]] linked.").includes("[["), "wiki links are stripped");
  const long = ideaPreview(null, Array.from({ length: 60 }, (_, i) => `word${i}`).join(" "));
  assert.ok(long.length <= 180, "fits the card");
  assert.ok(long.endsWith("…"), "ends with an ellipsis");
  assert.match(long, /word\d+…$/, "never cuts mid-word");
  assert.equal(ideaPreview("", ""), "");
});

test("cutOnWord never cuts inside a word when it can help it", () => {
  assert.equal(cutOnWord("short", 10), "short");
  const cut = cutOnWord("the quick brown fox jumps over the lazy dog", 20);
  assert.ok(cut.length <= 20);
  assert.equal(cut, "the quick brown…");
  assert.equal(cutOnWord("the quick brown fox jumps over the lazy dog", 21), "the quick brown fox…");
});
