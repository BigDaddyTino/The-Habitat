import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import {
  bloomfallV3Assets,
  bloomfallV3AtlasAssets,
  bloomfallV3CodexAssets,
  bloomfallV3PublicationMarker,
  getBloomfallV3CodexArt,
} from "./bloomfall-v3-art";
import { resolveCodexArtFile } from "./codex-art";

function location(asset: (typeof bloomfallV3Assets)[number]) {
  return asset.kind === "atlas"
    ? path.join(process.cwd(), "private", "codex-art", "maps", asset.filename)
    : path.join(process.cwd(), "private", "codex-art", "bloomfall-v3", asset.filename);
}

function pngDimensions(bytes: Buffer) {
  assert.equal(bytes.subarray(1, 4).toString("ascii"), "PNG");
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
}

test("the owner-approved release registry contains exactly fifteen unique V3 assets", () => {
  assert.equal(bloomfallV3Assets.length, 15);
  assert.equal(bloomfallV3AtlasAssets.length, 2);
  assert.equal(bloomfallV3CodexAssets.length, 13);
  assert.equal(new Set(bloomfallV3Assets.map((asset) => asset.id)).size, 15);
  assert.equal(new Set(bloomfallV3CodexAssets.map((asset) => asset.entrySlug)).size, 13);
  assert.ok(bloomfallV3Assets.every((asset) => !asset.filename.includes("v1") && !asset.filename.includes("v2")));
});

test("all fifteen registered files match their approved hashes and dimensions", () => {
  for (const asset of bloomfallV3Assets) {
    const bytes = readFileSync(location(asset));
    assert.equal(createHash("sha256").update(bytes).digest("hex"), asset.sha256, `${asset.id} hash`);
    assert.deepEqual(pngDimensions(bytes), { width: asset.width, height: asset.height }, `${asset.id} dimensions`);
  }
});

test("Codex V3 art is development-visible but production-gated by its exact marker", () => {
  const asset = bloomfallV3CodexAssets[0]!;
  const expected = `/codex-art/bloomfall-v3/${asset.filename}`;
  assert.equal(getBloomfallV3CodexArt(asset.entrySlug, {}, { HABITAT_ENVIRONMENT: "development" }), expected);
  assert.equal(getBloomfallV3CodexArt(asset.entrySlug, {}, { HABITAT_ENVIRONMENT: "production" }), null);
  assert.equal(getBloomfallV3CodexArt(asset.entrySlug, { visualArt: bloomfallV3PublicationMarker(asset) }, { HABITAT_ENVIRONMENT: "production" }), expected);
  assert.equal(getBloomfallV3CodexArt(asset.entrySlug, { visualArt: { ...bloomfallV3PublicationMarker(asset), sha256: "wrong" } }, { HABITAT_ENVIRONMENT: "production" }), null);
});

test("the protected Codex art resolver accepts only registered private files", () => {
  assert.ok(resolveCodexArtFile("bloomfall-v3", "bloomfall-reach.png"));
  for (const file of ["../bloomfall-reach.png", "..%2fbloomfall-reach.png", "bloomfall-reach.svg", "missing.png"]) {
    assert.equal(resolveCodexArtFile("bloomfall-v3", file), null);
  }
});
