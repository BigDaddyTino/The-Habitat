import assert from "node:assert/strict";
import { existsSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { codexArtFileForUrl, codexArtSlot, findCodexArt } from "./codex-art";
import { talentClasses } from "./talent-trees";

const classSlugs = [
  "bastion",
  "spector",
  "conduit",
  "surger",
  "archon",
  "procurator",
  "cypherist",
  "maverick",
] as const;

const classArtDirectory = path.join(process.cwd(), "private", "codex-art", "classes");

test("the class shelf has exactly the Eight Trees' class-art contract", () => {
  assert.deepEqual(talentClasses.map((entry) => entry.slug), [...classSlugs]);
  assert.deepEqual(
    readdirSync(classArtDirectory).filter((file) => /\.(png|jpg|jpeg|webp)$/.test(file)).sort(),
    classSlugs.map((slug) => `${slug}.png`).sort(),
  );

  for (const slug of classSlugs) {
    const url = `/codex-art/classes/${slug}.png`;
    assert.equal(codexArtSlot("classes", slug), `private/codex-art/classes/${slug}.png`);
    assert.equal(findCodexArt("classes", slug), url);

    const file = codexArtFileForUrl(url);
    assert.equal(file, path.join(classArtDirectory, `${slug}.png`));
    assert.ok(file && existsSync(file) && statSync(file).size > 0, `${slug}.png is missing or empty`);
  }
});

test("every class plate is a 1672x941 RGB24 PNG", async () => {
  const sharp = (await import("sharp")).default;

  for (const slug of classSlugs) {
    const metadata = await sharp(path.join(classArtDirectory, `${slug}.png`)).metadata();
    assert.equal(metadata.format, "png", `${slug} is not a PNG`);
    assert.equal(metadata.width, 1672, `${slug} has the wrong width`);
    assert.equal(metadata.height, 941, `${slug} has the wrong height`);
    assert.equal(metadata.channels, 3, `${slug} is not RGB24`);
    assert.equal(metadata.depth, "uchar", `${slug} does not use 8-bit channels`);
    assert.equal(metadata.space, "srgb", `${slug} is not sRGB`);
    assert.equal(metadata.hasAlpha, false, `${slug} unexpectedly has an alpha channel`);
  }
});
