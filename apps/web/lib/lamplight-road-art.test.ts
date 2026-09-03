import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, readFileSync, statSync } from "node:fs";
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
import { getCreatureKeyart } from "./creature-keyart";
import { getDossierArt } from "./dossier-art";
import { getFactionBranding } from "./faction-branding";

const plates = [
  ...["ilse-vetch", "corrin-ade", "wren-salloway", "imogen-roe", "del-anwar", "ivo-crane", "the-marker", "ottoline-vasque"]
    .map((slug) => ({ kind: "characters" as const, slug, width: 1672, height: 941, alpha: false })),
  { kind: "factions", slug: "the-radiant-path", width: 1672, height: 941, alpha: false },
  { kind: "faction-logos", slug: "the-radiant-path", width: 1024, height: 1024, alpha: true },
  { kind: "factions", slug: "the-nation-state-of-arcadia", width: 1672, height: 941, alpha: false },
  { kind: "faction-logos", slug: "the-nation-state-of-arcadia", width: 1024, height: 1024, alpha: true },
  { kind: "items", slug: "the-platform-ledger", width: 1672, height: 941, alpha: false },
  { kind: "rules", slug: "what-the-forge-rebuilds", width: 1672, height: 941, alpha: false },
  { kind: "creatures", slug: "arcadian-devil", width: 1672, height: 941, alpha: false },
  { kind: "creatures", slug: "the-lamplighter", width: 1672, height: 941, alpha: false },
  ...["the-green", "the-lower-gate", "lamplight", "the-stone-field", "the-ash-ground", "the-burned-wagon", "the-last-water", "the-lamp-chapel", "the-quiet-office", "the-quiet-altar", "the-drawn-shutter", "the-accreditation-hall"]
    .map((slug) => ({ kind: "regions" as const, slug, width: 1672, height: 941, alpha: false })),
] as const satisfies ReadonlyArray<{ kind: CodexArtKind; slug: string; width: number; height: number; alpha: boolean }>;

const webRoot = process.cwd();
const repoRoot = path.join(webRoot, "..", "..");
const diskFile = ({ kind, slug }: (typeof plates)[number]) => path.join(webRoot, "private", "codex-art", kind, `${slug}.png`);
const hash = (file: string) => createHash("sha256").update(readFileSync(file)).digest("hex");

test("the Lamplight Road commission has exactly its 28 private plates", () => {
  assert.equal(plates.length, 28);
  assert.equal(new Set(plates.map(({ kind, slug }) => `${kind}/${slug}`)).size, 28);
  assert.equal(plates.filter(({ kind }) => kind === "characters").length, 8);
  assert.equal(plates.filter(({ kind }) => kind === "factions").length, 2);
  assert.equal(plates.filter(({ kind }) => kind === "faction-logos").length, 2);
  assert.equal(plates.filter(({ kind }) => kind === "items").length, 1);
  assert.equal(plates.filter(({ kind }) => kind === "rules").length, 1);
  assert.equal(plates.filter(({ kind }) => kind === "creatures").length, 2);
  assert.equal(plates.filter(({ kind }) => kind === "regions").length, 12);

  for (const plate of plates) {
    const file = diskFile(plate);
    assert.ok(existsSync(file), `${plate.kind}/${plate.slug}.png is missing`);
    assert.ok(statSync(file).size > 0, `${plate.kind}/${plate.slug}.png is empty`);
  }
});

test("every Lamplight Road plate round-trips through the authenticated resolver", () => {
  for (const plate of plates) {
    const filename = `${plate.slug}.png`;
    const url = `/codex-art/${plate.kind}/${filename}`;
    const file = diskFile(plate);

    assert.equal(codexArtSlot(plate.kind, plate.slug), `private/codex-art/${plate.kind}/${filename}`);
    assert.equal(findCodexArt(plate.kind, plate.slug), url);
    assert.equal(listCodexArt(plate.kind).get(plate.slug), url);
    assert.equal(resolveCodexArtFile(plate.kind, filename), file);
    assert.equal(codexArtFileForUrl(url), file);
  }
});

test("every final satisfies its exact PNG and alpha contract", async () => {
  const sharp = (await import("sharp")).default;

  for (const plate of plates) {
    const file = diskFile(plate);
    const metadata = await sharp(file).metadata();
    assert.equal(metadata.format, "png", `${plate.kind}/${plate.slug} is not PNG`);
    assert.equal(metadata.width, plate.width, `${plate.kind}/${plate.slug} has the wrong width`);
    assert.equal(metadata.height, plate.height, `${plate.kind}/${plate.slug} has the wrong height`);
    assert.equal(metadata.space, "srgb", `${plate.kind}/${plate.slug} is not sRGB`);
    assert.equal(metadata.depth, "uchar", `${plate.kind}/${plate.slug} is not 8-bit`);
    assert.equal(metadata.bitsPerSample, 8, `${plate.kind}/${plate.slug} does not use 8 bits per sample`);
    assert.equal(metadata.isPalette, false, `${plate.kind}/${plate.slug} is palette-indexed`);
    assert.equal(metadata.channels, plate.alpha ? 4 : 3, `${plate.kind}/${plate.slug} has the wrong channel count`);
    assert.equal(metadata.hasAlpha, plate.alpha, `${plate.kind}/${plate.slug} has the wrong alpha mode`);

    if (plate.alpha) {
      const alpha = (await sharp(file).stats()).channels[3];
      assert.ok(alpha, `${plate.slug} has no alpha channel statistics`);
      assert.equal(alpha.min, 0, `${plate.slug} has no fully transparent pixels`);
      assert.equal(alpha.max, 255, `${plate.slug} has no fully opaque pixels`);
      assert.ok(alpha.mean > 0 && alpha.mean < 255, `${plate.slug} does not use meaningful transparency`);
    }
  }
});

test("all Lamplight Road finals are unique and the held-back Dam stays undrawn", () => {
  const hashes = plates.map((plate) => hash(diskFile(plate)));
  assert.equal(new Set(hashes).size, hashes.length);
  assert.equal(findCodexArt("creatures", "the-dam"), null);
  assert.equal(existsSync(path.join(webRoot, "private", "codex-art", "creatures", "the-dam.png")), false);
});

test("the faction pairs and Arcadian Devil wear the new PNGs", () => {
  for (const slug of ["the-radiant-path", "the-nation-state-of-arcadia"]) {
    const branding = getFactionBranding(slug);
    assert.ok(branding, `${slug} has no branding`);
    assert.equal(branding.keyart, `/codex-art/factions/${slug}.png`);
    assert.equal(branding.logo, `/codex-art/faction-logos/${slug}.png`);
  }

  assert.equal(getCreatureKeyart("arcadian-devil"), "/codex-art/creatures/arcadian-devil.png");
  assert.equal(getDossierArt("CREATURE", "arcadian-devil", {})?.src, "/codex-art/creatures/arcadian-devil.png");
  assert.equal(getDossierArt("CREATURE", "the-lamplighter", {})?.src, "/codex-art/creatures/the-lamplighter.png");
});

test("all eight portraits and twelve places resolve on dossier surfaces", () => {
  for (const plate of plates.filter(({ kind }) => kind === "characters")) {
    assert.equal(getDossierArt("CHARACTER", plate.slug, {})?.src, `/codex-art/characters/${plate.slug}.png`);
  }
  for (const plate of plates.filter(({ kind }) => kind === "regions")) {
    assert.equal(getDossierArt("REGION", plate.slug, {})?.src, `/codex-art/regions/${plate.slug}.png`);
  }
  assert.equal(getDossierArt("ITEM", "the-platform-ledger", {})?.src, "/codex-art/items/the-platform-ledger.png");
  assert.equal(getDossierArt("RULE", "what-the-forge-rebuilds", {})?.src, "/codex-art/rules/what-the-forge-rebuilds.png");
});

test("the permanent ledger reconciles every final path and hash", () => {
  const ledger = readFileSync(path.join(repoRoot, "Docs", "art", "SOL56_LAMPLIGHT_ROAD_ART_LEDGER.md"), "utf8");
  const rows = [...ledger.matchAll(
    /^\| [^|]+ \| `(apps\/web\/private\/codex-art\/([a-z-]+)\/([a-z0-9-]+)\.png)` \| \*\*(delivered|revised)\*\* \| [\d,]+ \| `([a-f0-9]{64})` \|/gm,
  )];
  const byPath = new Map(rows.map((match) => [match[1], match[5]]));

  assert.equal(rows.length, plates.length);
  assert.equal(byPath.size, plates.length);
  for (const plate of plates) {
    const finalPath = `apps/web/private/codex-art/${plate.kind}/${plate.slug}.png`;
    assert.equal(byPath.get(finalPath), hash(diskFile(plate)), `${plate.kind}/${plate.slug} has a stale ledger hash`);
  }
});
