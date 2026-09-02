import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { codexArtFileForUrl, codexArtSlot, findCodexArt, listCodexArt, resolveCodexArtFile, type CodexArtKind } from "./codex-art";
import { getDossierArt } from "./dossier-art";
import { getFactionBranding } from "./faction-branding";

const plates = [
  { kind: "factions", slug: "the-congregation-of-the-bound", width: 1672, height: 941 },
  { kind: "faction-logos", slug: "the-congregation-of-the-bound", width: 1024, height: 1024 },
  { kind: "characters", slug: "the-sexton-of-heartland", width: 1672, height: 941 },
  { kind: "characters", slug: "the-wellkeeper-of-honest-well", width: 1672, height: 941 },
] as const satisfies ReadonlyArray<{ kind: CodexArtKind; slug: string; width: number; height: number }>;

const webRoot = process.cwd();
const repoRoot = path.join(webRoot, "..", "..");
const diskFile = (kind: CodexArtKind, slug: string) => path.join(webRoot, "private", "codex-art", kind, `${slug}.png`);
const hash = (file: string) => createHash("sha256").update(readFileSync(file)).digest("hex");

test("the Faith weave has exactly its four commissioned private plates", () => {
  assert.equal(plates.length, 4);
  assert.equal(new Set(plates.map(({ kind, slug }) => `${kind}/${slug}`)).size, 4);

  for (const { kind, slug } of plates) {
    const filename = `${slug}.png`;
    const url = `/codex-art/${kind}/${filename}`;
    const file = diskFile(kind, slug);

    assert.equal(codexArtSlot(kind, slug), `private/codex-art/${kind}/${filename}`);
    assert.equal(findCodexArt(kind, slug), url);
    assert.equal(listCodexArt(kind).get(slug), url);
    assert.equal(resolveCodexArtFile(kind, filename), file);
    assert.equal(codexArtFileForUrl(url), file);
    assert.ok(existsSync(file) && statSync(file).size > 0);
  }
});

test("the new faction and characters resolve on their actual dossier surfaces", () => {
  const faction = getFactionBranding("the-congregation-of-the-bound");
  assert.ok(faction);
  assert.equal(faction.keyart, "/codex-art/factions/the-congregation-of-the-bound.png");
  assert.equal(faction.logo, "/codex-art/faction-logos/the-congregation-of-the-bound.png");

  for (const slug of ["the-sexton-of-heartland", "the-wellkeeper-of-honest-well"]) {
    const portrait = getDossierArt("CHARACTER", slug, {});
    assert.ok(portrait, `${slug} has no dossier portrait`);
    assert.equal(portrait.src, `/codex-art/characters/${slug}.png`);
  }

  assert.equal(findCodexArt("characters", "the-grand-advocate"), null, "the unnamed reserved seat must not receive a portrait");
});

test("every Faith final satisfies its exact RGB24 PNG contract", async () => {
  const sharp = (await import("sharp")).default;

  for (const { kind, slug, width, height } of plates) {
    const metadata = await sharp(diskFile(kind, slug)).metadata();

    assert.equal(metadata.format, "png", `${kind}/${slug} is not a PNG`);
    assert.equal(metadata.width, width, `${kind}/${slug} has the wrong width`);
    assert.equal(metadata.height, height, `${kind}/${slug} has the wrong height`);
    assert.equal(metadata.channels, 3, `${kind}/${slug} is not RGB24`);
    assert.equal(metadata.depth, "uchar", `${kind}/${slug} does not use 8-bit channels`);
    assert.equal(metadata.space, "srgb", `${kind}/${slug} is not sRGB`);
    assert.equal(metadata.hasAlpha, false, `${kind}/${slug} unexpectedly has alpha`);
    assert.equal(metadata.isPalette, false, `${kind}/${slug} is unexpectedly palette-indexed`);
  }
});

test("no commissioned Faith plate is a duplicate", () => {
  const hashes = plates.map(({ kind, slug }) => hash(diskFile(kind, slug)));
  assert.equal(new Set(hashes).size, hashes.length);
});

test("the Faith ledger reconciles exactly four commissioned deliveries", () => {
  const ledger = readFileSync(path.join(repoRoot, "Docs", "art", "SOL56_FAITH_ART_LEDGER.md"), "utf8");
  const rows = [...ledger.matchAll(
    /^\| [^|]+ \| `apps\/web\/private\/codex-art\/(factions|faction-logos|characters)\/([a-z0-9-]+)\.png` \| \*\*(delivered|revised)\*\* \| [\d,]+ \| `([a-f0-9]{64})` \|/gm,
  )];
  const byPlate = new Map(rows.map((match) => [`${match[1]}/${match[2]}`, { status: match[3], hash: match[4] }]));

  assert.equal(rows.length, plates.length);
  assert.equal(byPlate.size, plates.length);
  assert.deepEqual([...byPlate.keys()].sort(), plates.map(({ kind, slug }) => `${kind}/${slug}`).sort());

  for (const { kind, slug } of plates) {
    assert.equal(byPlate.get(`${kind}/${slug}`)?.hash, hash(diskFile(kind, slug)), `${kind}/${slug} ledger hash is stale`);
  }
  assert.doesNotMatch(ledger, /apps\/web\/private\/codex-art\/characters\/the-grand-advocate\./);
});
