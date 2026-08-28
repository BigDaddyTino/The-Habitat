import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { codexArtFileForUrl, codexArtKinds, codexArtSlot, findCodexArt } from "./codex-art";

/**
 * The codex requires a member account. Its artwork did not.
 *
 * Every dossier image lived under `public/`, which Next serves as a static
 * asset at its own URL, so the whole art set — character portraits, region
 * key art, faction identity, race plates, world rules, story flags — was
 * reachable by anyone who guessed a slug. The twelve character portraits alone
 * were roughly 74 MiB of unreleased design work handed out anonymously.
 *
 * These tests hold the boundary: the art lives under `private/codex-art`, and
 * every resolver hands back a `/codex-art/...` URL that goes through the route
 * with the USER gate on it.
 */

const publicImages = join(process.cwd(), "public", "images");

test("every registered art kind resolves to a directory under private/codex-art", () => {
  for (const kind of Object.keys(codexArtKinds) as Array<keyof typeof codexArtKinds>) {
    const slot = codexArtSlot(kind, "example-slug");
    assert.match(slot, /^private\/codex-art\//, `${kind} tells writers to drop files somewhere public`);
    // The slot is the instruction shown on an empty art slot, so it has to be
    // the real path — a writer following it must land in the served directory.
    const directory = join(process.cwd(), slot.slice(0, slot.lastIndexOf("/")));
    if (kind.endsWith("-source") || kind.startsWith("bloomfall-adaptive")) continue;
    assert.ok(existsSync(directory), `${kind} points at ${directory}, which does not exist`);
  }
});

test("no codex art directory is left inside public/", () => {
  const stray = readdirSync(publicImages, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .filter((name) => name in codexArtKinds || existsSync(join(publicImages, name, "keyart")));
  assert.deepEqual(stray, [], `these codex art directories are still served statically to anonymous callers: ${stray.join(", ")}`);
});

test("the resolvers hand back gated URLs, never static ones", () => {
  // Source-level, because these are hand-kept maps: a portrait added as
  // "/images/characters/keyart/<slug>.png" would work in the browser and
  // silently reopen the hole. The four files are the only ones that hold them.
  for (const file of ["character-keyart.ts", "creature-keyart.ts", "region-branding.ts", "faction-branding.ts"]) {
    const source = readFileSync(join(process.cwd(), "lib", file), "utf8");
    const statics = [...source.matchAll(/["`]\/images\/[a-z0-9-]+\//g)].map((match) => match[0]);
    assert.deepEqual(statics, [], `${file} still points at public art: ${statics.join(", ")}`);
  }
});

test("a real asset resolves through the URL a dossier renders", () => {
  const art = findCodexArt("characters", "tino");
  assert.ok(art, "the seeded portrait should be found");
  assert.match(art, /^\/codex-art\/characters\/tino\.(png|jpg|jpeg|webp)$/);
  const file = codexArtFileForUrl(art);
  assert.ok(file, "and that URL has to resolve back to the file behind it");
  assert.ok(statSync(file).size > 0);
  // Nothing outside the route's own directories, however it is spelled.
  assert.equal(codexArtFileForUrl("/images/characters/keyart/tino.png"), null);
  assert.equal(codexArtFileForUrl("/codex-art/characters/../../../.env"), null);
  assert.equal(codexArtFileForUrl("/codex-art/secrets/tino.png"), null);
});
