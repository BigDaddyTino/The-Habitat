import assert from "node:assert/strict";
import { readdirSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { codexArtFileForUrl } from "./codex-art";
import { artSlotKinds, dossierArtSlot, getDossierArt } from "./dossier-art";

/**
 * The regression these tests exist for: six kinds had finished artwork in
 * `private/codex-art/` that no resolver had ever been taught to read, so forty
 * images rendered as a grey placeholder on every surface. The chain lived
 * twice — once in the dossier, once in the library directory — which is why
 * nobody noticed it was missing a branch in both.
 */
const conventionKinds = [
  ["COMPANION_MISSION", "companion-missions"],
  ["FLAG", "flags"],
  ["ITEM", "items"],
  ["RULE", "rules"],
  ["THEME", "themes"],
  ["THREAD", "threads"],
] as const;

const slugsOnDisk = (directory: string) =>
  readdirSync(path.join(process.cwd(), "private", "codex-art", directory))
    .flatMap((file) => { const match = /^([a-z0-9-]+)\.(?:png|jpg|jpeg|webp)$/.exec(file); return match ? [match[1]] : []; });

for (const [kind, directory] of conventionKinds) {
  test(`${kind} artwork on disk reaches the dossier`, () => {
    const slugs = slugsOnDisk(directory);
    assert.ok(slugs.length > 0, `${directory} has no art to wire, so this test proves nothing`);
    for (const slug of slugs) {
      const art = getDossierArt(kind, slug, {});
      assert.ok(art, `${kind} ${slug} has art at private/codex-art/${directory}/ that no resolver returns`);
      assert.ok(art.src.startsWith("/codex-art/"), `${kind} ${slug} resolves to ${art.src}, which bypasses the member gate`);
      assert.ok(codexArtFileForUrl(art.src), `${kind} ${slug} resolves to ${art.src}, which is not on disk`);
      assert.ok(art.caption.length > 0 && art.alt.length > 0, `${kind} ${slug} has art but no caption or alt text`);
    }
  });
}

test("a place with approved art but no settled accent still wears it", () => {
  // Artwork and identity are separate
  // concerns, and the dossier used to ask branding for the picture.
  for (const slug of ["grand-lake", "death-canyon", "draw-nine", "the-floating-city"]) {
    const art = getDossierArt("REGION", slug, {});
    assert.ok(art, `region ${slug} has a plate on disk that the dossier does not show`);
    assert.ok(codexArtFileForUrl(art.src), `region ${slug} points at ${art.src}, which is not on disk`);
  }
});

test("every kind that can wear art offers the path that would fill it", () => {
  for (const kind of artSlotKinds) {
    const slot = dossierArtSlot(kind, "some-entry");
    assert.ok(slot, `${kind} can carry art but its empty state offers nowhere to put one`);
    assert.match(slot, /^private\/codex-art\/[a-z-]+\/some-entry\.png$/);
  }
  assert.equal(dossierArtSlot("ARC", "some-arc"), null, "kinds with no art shelf must not invent one");
});

test("owner-approved Bloomfall plates still outrank everything below them", () => {
  const mender = getDossierArt("CHARACTER", "maintenance-unit-m-17", {});
  assert.ok(mender, "Mender — slug maintenance-unit-m-17 — is a CHARACTER carried by the Bloomfall creature package");
  assert.match(mender.caption, /Bloomfall creature/);
});
