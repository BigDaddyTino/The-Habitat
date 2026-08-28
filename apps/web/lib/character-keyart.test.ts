import assert from "node:assert/strict";
import test from "node:test";
import { getCharacterKeyart, illustratedCharacterSlugs } from "./character-keyart";
import { codexArtFileForUrl } from "./codex-art";

test("every illustrated character has project-local key art", () => {
  assert.deepEqual(illustratedCharacterSlugs, [
    "abraham-islay-kane",
    "amanda",
    "jaro-fen",
    "keira-ansel",
    "mara-quill",
    "nalia-reed",
    "selene-ward",
    "steve",
    "the-kestrel-commander",
    "the-war-correspondent",
    "tino",
    "tomas-vey",
  ]);

  for (const slug of illustratedCharacterSlugs) {
    const keyart = getCharacterKeyart(slug);
    assert.ok(keyart);
    // Behind the member gate, never a static asset: a portrait served from
    // public/ is unreleased character design handed to anonymous callers.
    assert.match(keyart, /^\/codex-art\/characters\//, `${slug} key art is served through the authenticated route`);
    assert.ok(codexArtFileForUrl(keyart), `${slug} key art exists`);
  }
});

test("unknown characters fall back to their model or placeholder", () => {
  assert.equal(getCharacterKeyart("not-yet-illustrated"), null);
});
