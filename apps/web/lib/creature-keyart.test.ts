import assert from "node:assert/strict";
import test from "node:test";
import { codexArtFileForUrl } from "./codex-art";
import { getCreatureKeyart, illustratedCreatureSlugs } from "./creature-keyart";

test("every illustrated creature has project-local key art", () => {
  assert.deepEqual(illustratedCreatureSlugs, [
    "abominations",
    "arcadian-devil",
    "beasts",
    "hippogriff",
    "human",
    "humanoid",
    "lizzarnix",
    "monstrosities",
    "mythical",
    "supernaturals",
    "the-risen",
    "true-demons",
  ]);

  for (const slug of illustratedCreatureSlugs) {
    const keyart = getCreatureKeyart(slug);
    assert.ok(keyart);
    assert.match(keyart, /^\/codex-art\/(races|creatures)\//, `${slug} key art is served through the authenticated route`);
    assert.ok(codexArtFileForUrl(keyart), `${slug} key art exists`);
  }
});

test("unknown creatures fall back to their model or placeholder", () => {
  assert.equal(getCreatureKeyart("not-yet-illustrated"), null);
});
