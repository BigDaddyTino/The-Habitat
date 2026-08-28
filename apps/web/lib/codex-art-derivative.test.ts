import assert from "node:assert/strict";
import { existsSync, mkdirSync, readdirSync, rmSync, statSync, utimesSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { codexArtDerivative, codexArtSized, codexArtSrcSet, codexArtWidths, parseCodexArtWidth } from "./codex-art-derivative";

/**
 * The six Bloomfall-era portraits are 3072x3840 PNGs of ten to eleven
 * megabytes, and every surface was sending one whole into a box a tenth of its
 * size — down to a 55px casting thumbnail. These tests hold the two properties
 * that make the fix safe to leave alone: a derivative is smaller than what it
 * replaces, and it stops being found the moment the original changes.
 */
const kind = "__derivative_test__";
const scratch = path.join(process.cwd(), "private", "codex-art-cache", kind);
const cleanup = () => rmSync(scratch, { recursive: true, force: true });

async function makeSource(name: string, width: number, height: number): Promise<string> {
  const sharp = (await import("sharp")).default;
  const directory = path.join(process.cwd(), "private", "codex-art-cache", `${kind}-src`);
  mkdirSync(directory, { recursive: true });
  const file = path.join(directory, name);
  // Noise, not flat colour: a solid image compresses to nothing and would make
  // the size assertions pass for the wrong reason.
  const pixels = Buffer.alloc(width * height * 3);
  for (let index = 0; index < pixels.length; index += 1) pixels[index] = (index * 2654435761) % 251;
  await sharp(pixels, { raw: { width, height, channels: 3 } }).png().toFile(file);
  return file;
}

test("a large original is served far smaller than it is stored", async (t) => {
  t.after(cleanup);
  const source = await makeSource("large.png", 1600, 2000);
  const derivative = await codexArtDerivative(source, 320, kind, "large");
  assert.ok(derivative, "a 1600px original asked for at 320 must produce something");
  assert.equal(derivative.contentType, "image/webp");
  assert.ok(derivative.bytes.byteLength < statSync(source).size, "the derivative is not smaller than the master it replaces");

  const sharp = (await import("sharp")).default;
  const meta = await sharp(derivative.bytes).metadata();
  assert.equal(meta.width, 320, "the derivative is not the width that was asked for");
});

test("a small original is never blown up to fill the request", async (t) => {
  t.after(cleanup);
  const source = await makeSource("small.png", 200, 250);
  const derivative = await codexArtDerivative(source, 1920, kind, "small");
  if (derivative) {
    const sharp = (await import("sharp")).default;
    const meta = await sharp(derivative.bytes).metadata();
    assert.equal(meta.width, 200, "a 200px original was upscaled to 1920");
  }
});

test("replacing the original retires every derivative of it", async (t) => {
  t.after(cleanup);
  const source = await makeSource("swapped.png", 900, 900);
  await codexArtDerivative(source, 320, kind, "swapped");
  const first = readdirSync(scratch).filter((file) => file.startsWith("swapped-w320-"));
  assert.equal(first.length, 1);

  // Same bytes, new mtime — the stamp is size and mtime, so this is a miss.
  const later = new Date(Date.now() + 60_000);
  utimesSync(source, later, later);
  await codexArtDerivative(source, 320, kind, "swapped");
  const second = readdirSync(scratch).filter((file) => file.startsWith("swapped-w320-"));
  assert.equal(second.length, 1, "a stale derivative was left beside the fresh one");
  assert.notEqual(second[0], first[0], "the cache key did not move when the original did");
});

test("only the fixed set of widths is honoured", () => {
  for (const width of codexArtWidths) assert.equal(parseCodexArtWidth(String(width)), width);
  for (const rejected of ["321", "0", "-640", "99999", "640.5", "", "abc", "640; DROP"]) {
    assert.equal(parseCodexArtWidth(rejected), null, `${rejected} was accepted as a width`);
  }
  assert.equal(parseCodexArtWidth(null), null);
});

test("derivatives never land where the audits or the machine bundle would find them", () => {
  const cacheRoot = path.join(process.cwd(), "private", "codex-art-cache");
  const artRoot = path.join(process.cwd(), "private", "codex-art");
  assert.ok(!cacheRoot.startsWith(artRoot + path.sep), "the cache is inside codex-art, which the publisher sweeps onto the drive");
  assert.ok(!cacheRoot.includes(`${path.sep}public${path.sep}`), "the cache is under public/, which serves without a session");
  assert.ok(!existsSync(path.join(process.cwd(), "public", "codex-art-cache")));
});

test("the srcset offers each width against the same gated URL", () => {
  const set = codexArtSrcSet("/codex-art/characters/tino.png", [320, 960]);
  assert.equal(set, "/codex-art/characters/tino.png?w=320 320w, /codex-art/characters/tino.png?w=960 960w");
  assert.equal(codexArtSized("/codex-art/characters/tino.png", 320), "/codex-art/characters/tino.png?w=320");
  for (const url of [set, codexArtSized("/codex-art/x.png", 96)]) {
    assert.ok(!url.includes("/images/"), "an art URL escaped to the unauthenticated static path");
  }
});

test.after(() => {
  cleanup();
  rmSync(path.join(process.cwd(), "private", "codex-art-cache", `${kind}-src`), { recursive: true, force: true });
});
