import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { getCharacterKeyart, illustratedCharacterSlugs } from "./character-keyart";

test("every illustrated character has project-local key art", () => {
  assert.deepEqual(illustratedCharacterSlugs, [
    "amanda",
    "steve",
    "the-kestrel-commander",
    "the-war-correspondent",
    "tino",
  ]);

  for (const slug of illustratedCharacterSlugs) {
    const keyart = getCharacterKeyart(slug);
    assert.ok(keyart);
    assert.ok(existsSync(join(process.cwd(), "public", keyart)), `${slug} key art exists`);
  }
});

test("unknown characters fall back to their model or placeholder", () => {
  assert.equal(getCharacterKeyart("not-yet-illustrated"), null);
});
