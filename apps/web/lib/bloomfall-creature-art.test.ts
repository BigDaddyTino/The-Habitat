import assert from "node:assert/strict";
import test from "node:test";
import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import {
  bloomfallCreatureArtAssets,
  bloomfallCreatureArtPackage,
  bloomfallCreatureArtUrl,
  getBloomfallCreatureHeroArt,
  getBloomfallCreatureRungArt,
} from "./bloomfall-creature-art";
import { bloomfallCreatureEnhancements } from "./bloomfall-creature-enhancements";
import { bloomfallCreatureFieldGuide } from "./bloomfall-creature-field-guide";
import { bloomfallMutationRungs } from "./bloomfall-adaptive-ladder";

const directory = path.join(process.cwd(), "private", "codex-art", bloomfallCreatureArtPackage);

/** The two the generator refused. Delete from here the moment they are drawn. */
const undrawn = ["bloommarked-remnant", "the-last-shift"];

test("every plate on disk is in the manifest, byte for byte", () => {
  const onDisk = readdirSync(directory).filter((file) => file.endsWith(".webp")).sort();
  assert.deepEqual(onDisk, bloomfallCreatureArtAssets.map((asset) => asset.filename).sort());
  for (const asset of bloomfallCreatureArtAssets) {
    const file = path.join(directory, asset.filename);
    assert.ok(existsSync(file), `${asset.filename} is missing`);
    assert.equal(createHash("sha256").update(readFileSync(file)).digest("hex"), asset.sha256, `${asset.filename} does not match its locked hash`);
    assert.ok(asset.width > 0 && asset.height > 0, `${asset.filename} has no dimensions`);
    assert.equal(bloomfallCreatureArtUrl(asset), `/codex-art/${bloomfallCreatureArtPackage}/${asset.filename}`);
  }
});

test("every adaptive species has a plate for all five rungs", () => {
  for (const entry of bloomfallCreatureEnhancements) {
    const guide = bloomfallCreatureFieldGuide[entry.slug]!;
    if (guide.kind !== "ADAPTIVE") continue;
    for (const rung of bloomfallMutationRungs) {
      assert.ok(getBloomfallCreatureRungArt(entry.slug, rung), `${entry.slug} has no ${rung} plate`);
    }
  }
});

test("every dossier has a hero plate except the two still undrawn", () => {
  const without = bloomfallCreatureEnhancements
    .filter((entry) => !getBloomfallCreatureHeroArt(entry.slug))
    .map((entry) => entry.slug)
    .sort();
  assert.deepEqual(without, undrawn);
  // The two named Aberrants that are a rung of another species wear that plate.
  assert.equal(getBloomfallCreatureHeroArt("the-bellwether")?.filename, "blackbloom-hart-aberrant.webp");
  assert.equal(getBloomfallCreatureHeroArt("old-drowner")?.filename, "mirejaw-aberrant.webp");
  // An adaptive species leads with its baseline, not a later rung.
  assert.equal(getBloomfallCreatureHeroArt("latchhound")?.filename, "latchhound-none.webp");
});
