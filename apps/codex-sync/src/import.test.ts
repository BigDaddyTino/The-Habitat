import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtempSync, rmSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { codexBundleContractVersion } from "@habitat/shared";
import { applyCodexImport, planCodexImport, readImportLedger, rollbackCodexImport } from "./import";

/**
 * The importer is what the machine building the game runs, so the properties
 * that matter are the ones that keep a bad release from becoming a bad build:
 * a dry run that tells the truth about what would change, staging that never
 * destroys the last good import, and a rollback that is a pointer move rather
 * than a restore.
 *
 * These build real bundles on disk rather than mocking the reader, because the
 * hash and path checks are most of what the importer does.
 */

const sha = (value: string | Uint8Array) => createHash("sha256").update(value).digest("hex");

type Arc = { slug: string; title: string; nodes: Array<{ key: string; title: string; body: string | null; choices: Array<{ key: string; label: string | null; toKey: string }> }> };

function canonPayload(arcs: Arc[], bible: Array<{ kind: string; slug: string; title: string; body: string }>) {
  return { contractVersion: 1, generatedAt: "2026-08-28T00:00:00.000Z", revisionCursor: null, arcs, bible };
}

/** Writes a complete, verifiable bundle release and points current.json at it. */
async function writeBundle(root: string, snapshotId: string, payload: unknown, assets: Array<{ logicalPath: string; body: string }> = []) {
  const releaseDir = path.join(root, "releases", snapshotId);
  await mkdir(path.join(releaseDir, "content"), { recursive: true });
  await mkdir(path.join(releaseDir, "compatibility"), { recursive: true });

  const snapshotBody = JSON.stringify({ contract: "martino-codex-snapshot", contractVersion: codexBundleContractVersion });
  const canonBody = JSON.stringify(payload);
  await writeFile(path.join(releaseDir, "content", "snapshot.json"), snapshotBody);
  await writeFile(path.join(releaseDir, "compatibility", "canon-v1.json"), canonBody);

  const assetRecords = [];
  for (const asset of assets) {
    const relative = path.posix.join("releases", snapshotId, "images", asset.logicalPath.replace(/^\/images\//, ""));
    const file = path.join(root, relative);
    await mkdir(path.dirname(file), { recursive: true });
    await writeFile(file, asset.body);
    assetRecords.push({ path: relative, sha256: sha(asset.body), bytes: Buffer.byteLength(asset.body), logicalPath: asset.logicalPath, mimeType: "image/png", width: 1, height: 1 });
  }

  const manifest = {
    contract: "martino-codex-bundle",
    contractVersion: codexBundleContractVersion,
    snapshotId,
    generatedAt: "2026-08-28T00:00:00.000Z",
    revisionCursor: null,
    sourceContentSha256: sha(canonBody),
    storyRelease: { name: `martino-test-${snapshotId}`, sha256: sha(canonBody), contractVersion: 1, cutAt: "2026-08-28T00:00:00.000Z" },
    counts: { arcs: 0, nodes: 0, edges: 0, entries: 0, links: 0, comments: 0, revisions: 0, maps: 0, placements: 0, nodePlacements: 0, assets: assetRecords.length },
    content: { path: path.posix.join("releases", snapshotId, "content", "snapshot.json"), sha256: sha(snapshotBody), bytes: Buffer.byteLength(snapshotBody) },
    compatibility: { path: path.posix.join("releases", snapshotId, "compatibility", "canon-v1.json"), sha256: sha(canonBody), bytes: Buffer.byteLength(canonBody) },
    assets: assetRecords,
  };
  const manifestBody = JSON.stringify(manifest);
  await writeFile(path.join(releaseDir, "manifest.json"), manifestBody);

  await writeFile(path.join(root, "current.json"), JSON.stringify({
    contract: "martino-codex-pointer",
    contractVersion: codexBundleContractVersion,
    snapshotId,
    generatedAt: manifest.generatedAt,
    manifestPath: path.posix.join("releases", snapshotId, "manifest.json"),
    manifestSha256: sha(manifestBody),
    sourceContentSha256: manifest.sourceContentSha256,
  }));
}

function scratch() {
  const root = mkdtempSync(path.join(tmpdir(), "codex-import-"));
  return { share: path.join(root, "share"), local: path.join(root, "local"), dispose: () => rmSync(root, { recursive: true, force: true }) };
}

const arcOne = (bodyText: string): Arc => ({
  slug: "the-island-is-already-lost",
  title: "The Island Is Already Lost",
  nodes: [
    { key: "cold-open", title: "Eyes The Fuck Up", body: "A muzzle flash.", choices: [{ key: "c1", label: null, toKey: "the-strike" }] },
    { key: "the-strike", title: "The Sky Changes Its Mind", body: bodyText, choices: [] },
  ],
});

test("a first import reports everything as new and stages it", async (t) => {
  const { share, local, dispose } = scratch();
  t.after(dispose);
  await writeBundle(share, "snap-1", canonPayload([arcOne("The sky opens.")], [{ kind: "CHARACTER", slug: "tino", title: "Tino", body: "He is taken." }]), [{ logicalPath: "/images/characters/tino.png", body: "PNGDATA" }]);

  const plan = await planCodexImport(share, local);
  assert.equal(plan.imported, null);
  assert.equal(plan.current, false);
  assert.deepEqual(plan.diff.arcs.added, ["the-island-is-already-lost"]);
  assert.equal(plan.diff.nodes.added.length, 2);
  assert.deepEqual(plan.diff.entries.added, ["CHARACTER:tino"]);
  assert.deepEqual(plan.diff.assets.added, ["/images/characters/tino.png"]);

  const result = await applyCodexImport(share, local);
  assert.equal(result.changed, true);
  assert.equal(result.record.storyRelease?.name, "martino-test-snap-1");

  const ledger = await readImportLedger(local);
  assert.equal(ledger.current, "snap-1");
  assert.equal(ledger.history.length, 1);
});

test("importing the same release twice changes nothing the second time", async (t) => {
  const { share, local, dispose } = scratch();
  t.after(dispose);
  await writeBundle(share, "snap-1", canonPayload([arcOne("The sky opens.")], []));
  await applyCodexImport(share, local);

  const plan = await planCodexImport(share, local);
  assert.equal(plan.current, true, "the share is already the imported release");
  const second = await applyCodexImport(share, local);
  assert.equal(second.changed, false, "a repeat import must not restage anything");
});

test("one edited scene reports as one changed scene, not a changed arc", async (t) => {
  const { share, local, dispose } = scratch();
  t.after(dispose);
  await writeBundle(share, "snap-1", canonPayload([arcOne("The sky opens.")], []));
  await applyCodexImport(share, local);

  await writeBundle(share, "snap-2", canonPayload([arcOne("The sky changes its mind.")], []));
  const plan = await planCodexImport(share, local);
  assert.deepEqual(plan.diff.nodes.changed, ["the-island-is-already-lost/the-strike"]);
  assert.deepEqual(plan.diff.arcs.changed, [], "an arc must not report as changed because a scene inside it moved");
  assert.deepEqual(plan.diff.nodes.added, []);
  assert.deepEqual(plan.diff.choices.changed, []);
});

test("a new release whose canon payload is identical reports no work", async (t) => {
  const { share, local, dispose } = scratch();
  t.after(dispose);
  const payload = canonPayload([arcOne("The sky opens.")], []);
  await writeBundle(share, "snap-1", payload);
  await applyCodexImport(share, local);

  // A writer saving a comment republishes the bundle without moving canon.
  await writeBundle(share, "snap-2", payload);
  const plan = await planCodexImport(share, local);
  assert.equal(plan.current, false, "it is a different release");
  assert.equal(plan.diff.empty, true, "and nothing the game reads has changed");
});

test("a deleted scene is reported as removed rather than quietly dropped", async (t) => {
  const { share, local, dispose } = scratch();
  t.after(dispose);
  await writeBundle(share, "snap-1", canonPayload([arcOne("The sky opens.")], [{ kind: "ITEM", slug: "stormglass", title: "Stormglass", body: "Nature-drawn." }]));
  await applyCodexImport(share, local);

  const trimmed = arcOne("The sky opens.");
  trimmed.nodes = trimmed.nodes.slice(0, 1);
  await writeBundle(share, "snap-2", canonPayload([trimmed], []));
  const plan = await planCodexImport(share, local);
  assert.deepEqual(plan.diff.nodes.removed, ["the-island-is-already-lost/the-strike"]);
  assert.deepEqual(plan.diff.entries.removed, ["ITEM:stormglass"]);
});

test("rollback moves the ledger and deletes nothing", async (t) => {
  const { share, local, dispose } = scratch();
  t.after(dispose);
  await writeBundle(share, "snap-1", canonPayload([arcOne("The sky opens.")], []));
  await applyCodexImport(share, local);
  await writeBundle(share, "snap-2", canonPayload([arcOne("The sky changes its mind.")], []));
  await applyCodexImport(share, local);

  const rolled = await rollbackCodexImport(local);
  assert.equal(rolled.from.snapshotId, "snap-2");
  assert.equal(rolled.to.snapshotId, "snap-1");
  assert.deepEqual(rolled.diff.nodes.changed, ["the-island-is-already-lost/the-strike"], "a rollback describes what goes back, in the same terms");

  const ledger = await readImportLedger(local);
  assert.equal(ledger.current, "snap-1");
  assert.equal(ledger.history.length, 2, "history is never truncated — a record is the only route back");
});

test("rolling back with nothing behind it is refused, not guessed at", async (t) => {
  const { share, local, dispose } = scratch();
  t.after(dispose);
  await writeBundle(share, "snap-1", canonPayload([arcOne("The sky opens.")], []));
  await applyCodexImport(share, local);
  await assert.rejects(() => rollbackCodexImport(local), /nothing to roll back to/);
});

test("a rollback to a release whose files were cleaned up is refused", async (t) => {
  const { share, local, dispose } = scratch();
  t.after(dispose);
  await writeBundle(share, "snap-1", canonPayload([arcOne("The sky opens.")], []));
  await applyCodexImport(share, local);
  await writeBundle(share, "snap-2", canonPayload([arcOne("Changed.")], []));
  await applyCodexImport(share, local);

  rmSync(path.join(local, "releases", "snap-1"), { recursive: true, force: true });
  await assert.rejects(() => rollbackCodexImport(local), /staged files for "snap-1" are gone/);
});

test("a corrupt share fails before anything local is written", async (t) => {
  const { share, local, dispose } = scratch();
  t.after(dispose);
  await writeBundle(share, "snap-1", canonPayload([arcOne("The sky opens.")], []));
  // Rewrite the canon payload without touching the manifest that describes it.
  await writeFile(path.join(share, "releases", "snap-1", "compatibility", "canon-v1.json"), JSON.stringify({ tampered: true }));

  await assert.rejects(() => planCodexImport(share, local), /integrity verification/);
  const ledger = await readImportLedger(local);
  assert.equal(ledger.current, null, "a failed verification must leave no import recorded");
});
