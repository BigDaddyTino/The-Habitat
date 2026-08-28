import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { bloomfallV3CodexAssets, bloomfallV3Published, bloomfallV3PublicationMarker, getBloomfallV3CodexArt } from "./bloomfall-v3-art";
import { carryServerOwnedMeta, metaSchemasByKind, serverOwnedMetaKeys } from "./story-meta-schemas";

/**
 * The thirteen production dossiers carrying an owner-approved V3 publication
 * marker were unsafe to edit: `updateEntryMeta` re-parses the whole sheet, zod
 * strips every key its schema does not name, and `visualArt` is not on any
 * sheet. Saving one sentence of Heartfen's body unpublished its key art with
 * no error and nothing in the revision to say what had gone.
 *
 * These tests hold the two halves of the fix — the marker survives a save, and
 * a forged one does not become a publication.
 */

const region = {
  type: null, settlementTier: null, parent: null, biome: null, control: [], population: null,
  connections: [], status: null, veilAnchorTier: null, soulForge: null, gameTag: null, openQuestions: [],
};

test("a sheet save carries the publication marker forward instead of stripping it", () => {
  const asset = bloomfallV3CodexAssets.find((row) => row.entrySlug === "heartfen")!;
  const marker = bloomfallV3PublicationMarker(asset);
  const priorRow = { ...region, biome: "marsh", visualArt: marker };

  // Exactly what the action does: parse the submitted sheet, then restore.
  const parsed = metaSchemasByKind.REGION!.safeParse({ ...region, biome: "tidal marsh" });
  assert.equal(parsed.success, true);
  assert.equal((parsed.data as Record<string, unknown>).visualArt, undefined, "zod strips it — that is the bug being guarded");

  const stored = carryServerOwnedMeta(priorRow, parsed.data) as Record<string, unknown>;
  assert.equal(stored.biome, "tidal marsh", "the writer's edit still lands");
  assert.deepEqual(stored.visualArt, marker);
  assert.equal(bloomfallV3Published(stored, asset), true);
  assert.equal(
    getBloomfallV3CodexArt("heartfen", stored, { HABITAT_ENVIRONMENT: "production" }),
    `/codex-art/bloomfall-v3/${asset.filename}`,
  );
});

test("a marker submitted in the sheet payload cannot publish art the release never approved", () => {
  const asset = bloomfallV3CodexAssets.find((row) => row.entrySlug === "the-shattercore")!;
  // An unpublished row, with a caller trying to smuggle the marker in.
  const parsed = metaSchemasByKind.REGION!.safeParse({ ...region, visualArt: bloomfallV3PublicationMarker(asset) });
  assert.equal(parsed.success, true);
  const stored = carryServerOwnedMeta({ ...region }, parsed.data) as Record<string, unknown>;
  assert.equal(stored.visualArt, undefined);
  assert.equal(getBloomfallV3CodexArt("the-shattercore", stored, { HABITAT_ENVIRONMENT: "production" }), null);
});

test("carrying forward is a no-op when the stored row owns nothing", () => {
  const parsed = metaSchemasByKind.REGION!.parse(region);
  assert.deepEqual(carryServerOwnedMeta({ ...region }, parsed), parsed);
  assert.deepEqual(carryServerOwnedMeta(null, parsed), parsed);
  assert.deepEqual(carryServerOwnedMeta(["not", "an", "object"], parsed), parsed);
});

test("no sheet schema claims a server-owned key, or the carry would overwrite a writer's field", () => {
  for (const [kind, schema] of Object.entries(metaSchemasByKind)) {
    const shape = (schema as unknown as { shape?: Record<string, unknown> }).shape;
    if (!shape) continue;
    for (const key of serverOwnedMetaKeys) {
      assert.equal(key in shape, false, `${kind} sheet owns ${key}`);
    }
  }
});

/**
 * The guard that actually catches a regression.
 *
 * Every path that REPLACES a stored entry's meta has to restore the
 * server-owned keys, and a new one written without that call is the same
 * silent data loss all over again. `storyEntry.create` is excluded on
 * purpose: a brand new entry has no stored row to preserve anything from.
 */
test("every action that updates a stored entry's meta carries the server-owned keys", () => {
  const source = readFileSync(path.join(process.cwd(), "app", "codex", "actions.ts"), "utf8");
  const unguarded: string[] = [];
  let found = 0;
  for (const match of source.matchAll(/storyEntry\.update(?:Many)?\(/g)) {
    const start = match.index!;
    // Wide enough to reach the `data:` object and the line above it that
    // prepares the value, which is where the call legitimately lives.
    const window = source.slice(Math.max(0, start - 700), start + 400);
    if (!/\bmeta:/.test(window)) continue;
    found += 1;
    if (!window.includes("carryServerOwnedMeta")) unguarded.push(source.slice(start, start + 140).split("\n")[0]);
  }
  assert.ok(found >= 3, `expected to find the known meta-update paths, found ${found}`);
  assert.deepEqual(unguarded, [], `these update paths write meta without carryServerOwnedMeta:\n${unguarded.join("\n")}`);
});
