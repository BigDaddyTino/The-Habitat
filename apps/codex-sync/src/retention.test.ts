import assert from "node:assert/strict";
import { mkdtemp, mkdir, readdir, rm, utimes, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { pruneCodexShare } from "./retention";

/**
 * Retention is the thing that keeps the share publishable, and the share is
 * read by a machine this process cannot see. Every rule tested here exists
 * because deleting the wrong directory breaks a build on another computer.
 */

const HOUR = 60 * 60_000;

/**
 * Time is driven forward rather than backdated.
 *
 * `pruneCodexShare` ages a directory by `max(mtime, birthtime)` — the
 * conservative reading, so a directory looks young if *either* stamp is
 * recent — and Node cannot move a birthtime. So a fixture cannot be made to
 * look old by backdating it; instead the sweep is handed a clock 48 hours
 * ahead, which ages everything created here, and anything that must still
 * look fresh is given an mtime near that simulated present.
 */
const NOW = Date.now() + 48 * HOUR;

async function share(releaseIds: string[], staging: Array<{ name: string; freshMs?: number }> = []) {
  const root = await mkdtemp(path.join(tmpdir(), "codex-retention-"));
  for (const id of releaseIds) {
    const directory = path.join(root, "releases", id);
    await mkdir(directory, { recursive: true });
    await writeFile(path.join(directory, "manifest.json"), "{}");
  }
  for (const entry of staging) {
    const directory = path.join(root, ".staging", entry.name);
    await mkdir(directory, { recursive: true });
    // A directory a publish is writing into right now: its mtime sits just
    // behind the simulated present rather than 48 hours behind it.
    if (entry.freshMs !== undefined) {
      const when = new Date(NOW - entry.freshMs);
      await utimes(directory, when, when);
    }
  }
  return { root };
}

/** Make every fixture directory look freshly written, at the simulated now. */
async function touchAll(root: string, subdirectory: string) {
  const when = new Date(NOW - 30_000);
  for (const entry of await readdir(path.join(root, subdirectory))) {
    await utimes(path.join(root, subdirectory, entry), when, when);
  }
}

/** Ids that sort chronologically, the way real snapshot ids do. */
function ids(count: number) {
  return Array.from({ length: count }, (_, index) => `20260904T${String(100000000 + index * 1000).slice(0, 9)}Z-${index.toString(16).padStart(12, "0")}`);
}

test("the active release is never deleted, whatever its age or position", async () => {
  const names = ids(10);
  const active = names[0]; // the OLDEST, and deliberately outside the keep window
  const { root } = await share(names);

  const report = await pruneCodexShare(root, { activeSnapshotId: active, keepReleases: 3, minAgeMs: HOUR, now: NOW });

  assert.ok(!report.releasesRemoved.includes(active), "the release current.json points at was deleted — the other machine reads exactly that one");
  const left = await readdir(path.join(root, "releases"));
  assert.ok(left.includes(active), "the active release is gone from disk");
  // Newest 3 plus the active one.
  assert.equal(left.length, 4);
  await rm(root, { recursive: true, force: true });
});

test("nothing is deleted until it has been superseded long enough to be safe", async () => {
  const names = ids(10);
  const { root } = await share(names);
  await touchAll(root, "releases");

  const report = await pruneCodexShare(root, { activeSnapshotId: names.at(-1)!, keepReleases: 2, minAgeMs: HOUR, now: NOW });

  assert.deepEqual(report.releasesRemoved, [], "a release younger than the age floor was deleted; a consumer that read the pointer a moment ago may still be copying it");
  assert.ok(report.heldBack > 0, "the sweep did not report holding anything back");
  assert.equal((await readdir(path.join(root, "releases"))).length, 10);
  await rm(root, { recursive: true, force: true });
});

test("the newest releases are kept and the oldest go first", async () => {
  const names = ids(10);
  const { root } = await share(names);

  const report = await pruneCodexShare(root, { activeSnapshotId: names.at(-1)!, keepReleases: 4, minAgeMs: HOUR, now: NOW });

  assert.equal(report.releasesRemoved.length, 6);
  assert.deepEqual(report.releasesRemoved, names.slice(0, 6), "retention did not delete oldest-first");
  assert.deepEqual((await readdir(path.join(root, "releases"))).sort(), names.slice(6).sort());
  await rm(root, { recursive: true, force: true });
});

test("abandoned staging directories are swept, and one in flight is not", async () => {
  const names = ids(3);
  const { root } = await share(
    names,
    [
      { name: "publish-20260904T211351589Z-bc4dbaf890d0-0a1b2c3d" },
      { name: "publish-20260904T211351589Z-bc4dbaf890d0-1a2b3c4d" },
      // The one a publish is writing into right now.
      { name: "publish-20260904T211351589Z-bc4dbaf890d0-2a3b4c5d", freshMs: 5_000 },
    ],
  );

  const report = await pruneCodexShare(root, { activeSnapshotId: names.at(-1)!, keepReleases: 30, minAgeMs: HOUR, now: NOW });

  assert.equal(report.stagingRemoved.length, 2, "the abandoned staging directories were not swept — these are the hardlinks that wedged the share");
  const left = await readdir(path.join(root, ".staging"));
  assert.deepEqual(left, ["publish-20260904T211351589Z-bc4dbaf890d0-2a3b4c5d"], "a staging directory still being written was deleted");
  await rm(root, { recursive: true, force: true });
});

test("only directories the publisher itself creates are ever touched", async () => {
  const names = ids(4);
  const { root } = await share(names);
  // Things a person, another tool, or a half-finished copy might leave behind.
  for (const stray of ["notes", "_superseded", "20260904-backup", "README.md"]) {
    await mkdir(path.join(root, "releases", stray), { recursive: true });
  }
  await mkdir(path.join(root, ".staging", "mirror-something-abcd1234"), { recursive: true });

  const report = await pruneCodexShare(root, { activeSnapshotId: names.at(-1)!, keepReleases: 1, minAgeMs: HOUR, now: NOW });

  for (const stray of ["notes", "_superseded", "20260904-backup", "README.md"]) {
    assert.ok(!report.releasesRemoved.includes(stray), `retention deleted "${stray}", which it did not create`);
  }
  assert.deepEqual((await readdir(path.join(root, ".staging"))), ["mirror-something-abcd1234"], "retention deleted a directory belonging to the mirror, not the publisher");
  await rm(root, { recursive: true, force: true });
});

test("a share with nothing on it yet is not an error", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "codex-retention-empty-"));
  const report = await pruneCodexShare(root, { activeSnapshotId: null, keepReleases: 30, minAgeMs: HOUR, now: NOW });
  assert.deepEqual(report.releasesRemoved, []);
  assert.deepEqual(report.stagingRemoved, []);
  await rm(root, { recursive: true, force: true });
});

test("the blob store and the pointer are never touched", async () => {
  const names = ids(5);
  const { root } = await share(names);
  await mkdir(path.join(root, "blobs", "sha256", "06"), { recursive: true });
  await writeFile(path.join(root, "blobs", "sha256", "06", "0611deadbeef"), "content");
  await writeFile(path.join(root, "current.json"), "{}");

  await pruneCodexShare(root, { activeSnapshotId: names.at(-1)!, keepReleases: 1, minAgeMs: HOUR, now: NOW });

  assert.deepEqual(await readdir(path.join(root, "blobs", "sha256", "06")), ["0611deadbeef"], "retention removed a blob — blobs are the content store and releases are only links into it");
  assert.deepEqual((await readdir(root)).sort(), ["blobs", "current.json", "releases"], "retention added or removed something at the root of the share");
  await rm(root, { recursive: true, force: true });
});
