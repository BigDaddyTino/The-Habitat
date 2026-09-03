import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

/**
 * The one law behind the gold card at the foot of a dossier: a contributor's
 * original stays on the website and **never reaches the outbound codex.**
 *
 * The guarantee is structural, so this is a structural test. It reads the
 * exporter's own source and asserts three things about it:
 *
 *   1. The entry mapper is still an explicit column allowlist, not a spread.
 *      `...entry` would ship every column the model grows, forever, silently.
 *   2. The exporter never names the contributions table at all. It cannot leak
 *      a relation it does not query.
 *   3. The word "contribution" appears in the snapshot module only inside the
 *      comment that explains why it is absent.
 *
 * A runtime test against a built snapshot would be stronger in one way and far
 * weaker in another: it proves nothing about the day somebody adds an include.
 * This fails on the diff that would cause the leak.
 */

const snapshotPath = path.join(process.cwd(), "..", "..", "apps", "codex-sync", "src", "snapshot.ts");
const source = readFileSync(snapshotPath, "utf8");

/** The exact columns the outbound bundle is allowed to carry for an entry. */
const allowedEntryColumns = [
  "id", "kind", "slug", "title", "summary", "body", "meta",
  "status", "version", "createdBy", "updatedBy", "createdAt", "updatedAt",
];

test("the outbound entry mapper is an explicit allowlist", () => {
  const start = source.indexOf("entries: entries.map((entry) => ({");
  assert.ok(start > 0, "the entry mapper has moved or been rewritten; re-verify the contributor guarantee before updating this test");
  const block = source.slice(start, source.indexOf("})),", start));

  assert.ok(!block.includes("...entry"), "the entry mapper spreads the row — every column the model grows would ship, including contributor material");

  const mapped = [...block.matchAll(/^\s{10}([A-Za-z]+):/gm)].map((match) => match[1]);
  assert.deepEqual(mapped.sort(), [...allowedEntryColumns].sort(), "the outbound entry shape changed; a new column must be a deliberate decision, not a diff nobody read");
});

test("the exporter never queries the contributions table", () => {
  assert.ok(!source.includes("storyEntryContribution"), "the exporter names storyEntryContribution — contributor originals are website-only and must never be queried by the bundle builder");
  assert.ok(!/contributions\s*:/.test(source.replace(/\/\/.*$/gm, "")), "the exporter includes a `contributions` relation somewhere");
});

test("the reason it is absent is written down where somebody would break it", () => {
  const start = source.indexOf("entries: entries.map((entry) => ({");
  const preamble = source.slice(Math.max(0, start - 700), start);
  assert.match(preamble, /allowlist/i, "the entry mapper has no comment explaining that it is an allowlist");
  assert.match(preamble, /contribution/i, "the entry mapper's comment does not mention what the allowlist is protecting");
});

test("the dossier renders contributions from their own query, not from the entry row", () => {
  const codex = readFileSync(path.join(process.cwd(), "lib", "story-codex.ts"), "utf8");
  assert.match(codex, /export async function listEntryContributions/, "listEntryContributions is gone; the card has no data source");
  const getEntry = codex.slice(codex.indexOf("export async function getStoryEntry"), codex.indexOf("export async function getStoryEntry") + 3000);
  assert.ok(!getEntry.includes("contributions"), "getStoryEntry includes contributions — keep it off the entry projection so nothing that walks an entry picks it up");
});
