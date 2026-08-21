import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
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
    assert.ok(existsSync(join(process.cwd(), "public", keyart)), `${slug} key art exists`);
  }
});

test("unknown creatures fall back to their model or placeholder", () => {
  assert.equal(getCreatureKeyart("not-yet-illustrated"), null);
});
