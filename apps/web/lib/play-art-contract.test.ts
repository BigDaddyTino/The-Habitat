import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import {
  codexArtFileForUrl,
  codexArtSlot,
  findCodexArt,
  listCodexArt,
  resolveCodexArtFile,
  type CodexArtKind,
} from "./codex-art";
import { skills } from "./skills";
import { spells } from "./spellbook";
import { talentClasses } from "./talent-trees";

type PlayArtKind = Extract<CodexArtKind, "talent-backdrops" | "talent-icons" | "skills" | "spells">;

const talentBackdropSlugs = talentClasses.map((tree) => tree.slug);
const regularTalentIconSlugs = talentClasses.flatMap((tree) =>
  tree.branches.flatMap((branch) => branch.nodes.map((node) => `${tree.slug}-${node.id}`)),
);
const corruptedTalentIconSlugs = talentClasses.flatMap((tree) =>
  tree.corrupted.nodes.map((node) => `${tree.slug}-corrupt-${node.phase}`),
);

const slugsByKind = {
  "talent-backdrops": talentBackdropSlugs,
  "talent-icons": [...regularTalentIconSlugs, ...corruptedTalentIconSlugs],
  skills: skills.map((skill) => skill.slug),
  spells: spells.map((spell) => spell.id),
} satisfies Record<PlayArtKind, string[]>;

const expectedCounts = {
  "talent-backdrops": 8,
  "talent-icons": 450,
  skills: 20,
  spells: 108,
} satisfies Record<PlayArtKind, number>;

const imageContract = {
  "talent-backdrops": { width: 1672, height: 941 },
  "talent-icons": { width: 256, height: 256 },
  skills: { width: 512, height: 512 },
  spells: { width: 256, height: 256 },
} satisfies Record<PlayArtKind, { width: number; height: number }>;

const playArtKinds = Object.keys(slugsByKind) as PlayArtKind[];
const artRoot = path.join(process.cwd(), "private", "codex-art");
const imageFilename = /^[a-z0-9]+(?:-[a-z0-9]+)*\.png$/;

function directoryFor(kind: PlayArtKind) {
  return path.join(artRoot, kind);
}

function expectedFilenames(kind: PlayArtKind) {
  return slugsByKind[kind].map((slug) => `${slug}.png`).sort();
}

function installedImageFilenames(kind: PlayArtKind) {
  return readdirSync(directoryFor(kind))
    .filter((file) => /\.(png|jpg|jpeg|webp)$/i.test(file))
    .sort();
}

test("the Play art shelves have exactly the generated Sol 5.6 inventory", () => {
  assert.equal(regularTalentIconSlugs.length, 394);
  assert.equal(corruptedTalentIconSlugs.length, 56);

  for (const kind of playArtKinds) {
    const slugs = slugsByKind[kind];
    const expected = expectedFilenames(kind);
    const actual = installedImageFilenames(kind);

    assert.equal(slugs.length, expectedCounts[kind], `${kind} generated the wrong slot count`);
    assert.equal(new Set(slugs).size, slugs.length, `${kind} generated duplicate slugs`);
    assert.ok(expected.every((file) => imageFilename.test(file)), `${kind} generated a non-lowercase PNG filename`);
    assert.deepEqual(actual, expected, `${kind} does not exactly match its generated PNG inventory`);
  }
});

test("every generated Play art slot round-trips through the private resolver", () => {
  for (const kind of playArtKinds) {
    const listed = listCodexArt(kind);
    assert.equal(listed.size, expectedCounts[kind], `${kind} resolver listed the wrong number of files`);

    for (const slug of slugsByKind[kind]) {
      const filename = `${slug}.png`;
      const url = `/codex-art/${kind}/${filename}`;
      const privateSlot = `private/codex-art/${kind}/${filename}`;
      const diskFile = path.join(directoryFor(kind), filename);

      assert.equal(codexArtSlot(kind, slug), privateSlot);
      assert.equal(findCodexArt(kind, slug), url);
      assert.equal(listed.get(slug), url);
      assert.equal(resolveCodexArtFile(kind, filename), diskFile);
      assert.equal(codexArtFileForUrl(url), diskFile);
      assert.ok(existsSync(diskFile) && statSync(diskFile).size > 0, `${privateSlot} is missing or empty`);
    }
  }
});

test("every generated Play art final has its exact RGB24 PNG contract", async () => {
  const sharp = (await import("sharp")).default;

  for (const kind of playArtKinds) {
    const contract = imageContract[kind];

    for (const filename of installedImageFilenames(kind)) {
      const metadata = await sharp(path.join(directoryFor(kind), filename)).metadata();
      const label = `${kind}/${filename}`;

      assert.equal(metadata.format, "png", `${label} is not a PNG`);
      assert.equal(metadata.width, contract.width, `${label} has the wrong width`);
      assert.equal(metadata.height, contract.height, `${label} has the wrong height`);
      assert.equal(metadata.channels, 3, `${label} is not RGB24`);
      assert.equal(metadata.depth, "uchar", `${label} does not use 8-bit channels`);
      assert.equal(metadata.space, "srgb", `${label} is not sRGB`);
      assert.equal(metadata.hasAlpha, false, `${label} unexpectedly has an alpha channel`);
    }
  }
});

test("no Play art family contains duplicate final files", () => {
  for (const kind of playArtKinds) {
    const hashes = installedImageFilenames(kind).map((filename) =>
      createHash("sha256").update(readFileSync(path.join(directoryFor(kind), filename))).digest("hex"),
    );

    assert.equal(new Set(hashes).size, hashes.length, `${kind} contains duplicate final hashes`);
  }
});
