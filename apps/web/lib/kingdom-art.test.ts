import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { codexArtFileForUrl, codexArtSlot, findCodexArt, listCodexArt, resolveCodexArtFile } from "./codex-art";

const plates = [
  { slug: "hero", width: 1672, height: 941 },
  { slug: "rank-i-freeholder", width: 1200, height: 800 },
  { slug: "rank-ii-warden", width: 1200, height: 800 },
  { slug: "rank-iii-magistrate", width: 1200, height: 800 },
  { slug: "rank-iv-lord", width: 1200, height: 800 },
  { slug: "rank-v-crown", width: 1200, height: 800 },
  { slug: "tree-might", width: 1024, height: 1024 },
  { slug: "tree-coffers", width: 1024, height: 1024 },
  { slug: "tree-works", width: 1024, height: 1024 },
  { slug: "tree-arcana", width: 1024, height: 1024 },
  { slug: "tree-roots", width: 1024, height: 1024 },
  { slug: "tree-faith", width: 1024, height: 1024 },
] as const;

const artRoot = path.join(process.cwd(), "private", "codex-art", "kingdom");
const expectedFilenames = plates.map(({ slug }) => `${slug}.png`).sort();

function installedPngs() {
  return readdirSync(artRoot).filter((file) => file.endsWith(".png")).sort();
}

test("the Crown has exactly its twelve commissioned plates", () => {
  assert.equal(new Set(plates.map(({ slug }) => slug)).size, 12);
  assert.deepEqual(installedPngs(), expectedFilenames);
  assert.ok(expectedFilenames.every((file) => /^[a-z0-9]+(?:-[a-z0-9]+)*\.png$/.test(file)));
});

test("every Crown plate round-trips through the private art resolver", () => {
  const listed = listCodexArt("kingdom");
  assert.equal(listed.size, 12);

  for (const { slug } of plates) {
    const filename = `${slug}.png`;
    const url = `/codex-art/kingdom/${filename}`;
    const diskFile = path.join(artRoot, filename);

    assert.equal(codexArtSlot("kingdom", slug), `private/codex-art/kingdom/${filename}`);
    assert.equal(findCodexArt("kingdom", slug), url);
    assert.equal(listed.get(slug), url);
    assert.equal(resolveCodexArtFile("kingdom", filename), diskFile);
    assert.equal(codexArtFileForUrl(url), diskFile);
    assert.ok(existsSync(diskFile) && statSync(diskFile).size > 0);
  }
});

test("every Crown final satisfies its exact RGB24 PNG contract", async () => {
  const sharp = (await import("sharp")).default;

  for (const { slug, width, height } of plates) {
    const metadata = await sharp(path.join(artRoot, `${slug}.png`)).metadata();

    assert.equal(metadata.format, "png", `${slug} is not a PNG`);
    assert.equal(metadata.width, width, `${slug} has the wrong width`);
    assert.equal(metadata.height, height, `${slug} has the wrong height`);
    assert.equal(metadata.channels, 3, `${slug} is not RGB24`);
    assert.equal(metadata.depth, "uchar", `${slug} does not use 8-bit channels`);
    assert.equal(metadata.space, "srgb", `${slug} is not sRGB`);
    assert.equal(metadata.hasAlpha, false, `${slug} unexpectedly has alpha`);
    assert.equal(metadata.isPalette, false, `${slug} is unexpectedly palette-indexed`);
  }
});

test("no Crown plate is a duplicate", () => {
  const hashes = installedPngs().map((filename) =>
    createHash("sha256").update(readFileSync(path.join(artRoot, filename))).digest("hex"),
  );

  assert.equal(new Set(hashes).size, hashes.length);
});

test("the Crown ledger has one reconciled delivery row per plate", () => {
  const ledger = readFileSync(
    path.join(process.cwd(), "..", "..", "Docs", "art", "SOL56_KINGDOM_ART_LEDGER.md"),
    "utf8",
  );
  const rows = [...ledger.matchAll(
    /^\| [^|]+ \| `apps\/web\/private\/codex-art\/kingdom\/([a-z0-9-]+)\.png` \| \*\*(delivered|revised)\*\* \| [\d,]+ \| `([a-f0-9]{64})` \|/gm,
  )];
  const bySlug = new Map(rows.map((match) => [match[1], { status: match[2], hash: match[3] }]));

  assert.equal(rows.length, plates.length);
  assert.equal(bySlug.size, plates.length);
  assert.deepEqual([...bySlug.keys()].sort(), plates.map(({ slug }) => slug).sort());

  for (const { slug } of plates) {
    const finalHash = createHash("sha256")
      .update(readFileSync(path.join(artRoot, `${slug}.png`)))
      .digest("hex");
    assert.equal(bySlug.get(slug)?.hash, finalHash, `${slug} ledger hash is stale`);
  }
});

test("the Kingdom page keeps all three drop-in wiring paths", () => {
  const page = readFileSync(path.join(process.cwd(), "app", "codex", "kingdom", "page.tsx"), "utf8");
  const styles = readFileSync(path.join(process.cwd(), "app", "codex", "kingdom", "kingdom.css"), "utf8");

  assert.match(page, /findCodexArt\("kingdom", slug\)/);
  assert.match(page, /slug="hero"/);
  assert.match(page, /slug=\{rankArtSlug\(rank\)\}/);
  assert.match(page, /slug=\{`tree-\$\{tree\.slug\}`\}/);
  assert.match(styles, /\.km-tree > header \{[^}]*grid-template-columns: 64px 1fr;/);
  assert.match(styles, /\.km-sigil \{[^}]*width: 64px; height: 64px;/);
});
