import assert from "node:assert/strict";
import { readdirSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { codexArtFileForUrl } from "./codex-art";
import { artSlotKinds, dossierArtExpected, dossierArtSlot, getDossierArt } from "./dossier-art";

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

test("creature child thumbnails can reuse every convention plate their dossiers wear", () => {
  // These were valid dossier heroes but false placeholders in the parent
  // species' Children list because that surface bypassed this resolver.
  const formerlyMissing = [
    "armistice-frame",
    "bureau-stork",
    "carriers",
    "chaff-wasp",
    "chartered",
    "collector-pattern",
    "falls-swift",
    "glasspike",
    "jackknife",
    "millstone",
    "palisade-frame",
    "reedjack",
    "returnees",
    "salt-ibis",
    "shrieker-bat",
    "the-hollow-wing-creature",
    "the-latent",
    "the-unregistered",
    "tollgull",
    "towback",
    "boneback-sturgeon",
  ] as const;

  for (const slug of formerlyMissing) {
    const art = getDossierArt("CREATURE", slug, {});
    assert.ok(art, `${slug} has a convention plate but no shared dossier/thumbnail art`);
    assert.ok(codexArtFileForUrl(art.src), `${slug} resolves to missing art at ${art.src}`);
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

test("an unnamed reserved character seat is not reported as an owed portrait", () => {
  const reservedSeat = {
    fullName: null,
    appearance: null,
    model: "The reserved-leader pattern: seat exists, first writer names it.",
  };

  assert.equal(dossierArtExpected("CHARACTER", "the-grand-advocate", reservedSeat), false);
  assert.equal(dossierArtSlot("CHARACTER", "the-grand-advocate", reservedSeat), null);
  assert.equal(dossierArtExpected("CHARACTER", "the-grand-advocate", { ...reservedSeat, appearance: "decided", model: "copy changed" }), false);
  assert.equal(getDossierArt("CHARACTER", "the-grand-advocate", { ...reservedSeat, appearance: "decided", model: "copy changed" }), null);
  assert.equal(dossierArtExpected("CHARACTER", "the-grand-advocate", { ...reservedSeat, fullName: "A named person" }), true);
  assert.equal(dossierArtSlot("CHARACTER", "the-grand-advocate", { ...reservedSeat, fullName: "A named person" }), "private/codex-art/characters/the-grand-advocate.png");
});

test("owner-approved Bloomfall plates still outrank everything below them", () => {
  const mender = getDossierArt("CHARACTER", "maintenance-unit-m-17", {});
  assert.ok(mender, "Mender — slug maintenance-unit-m-17 — is a CHARACTER carried by the Bloomfall creature package");
  assert.match(mender.caption, /Bloomfall creature/);
});
