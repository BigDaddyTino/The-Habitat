import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

/**
 * The staging leak that wedged the share, kept fixed.
 *
 * A publish builds the whole release inside `.staging/publish-<id>-<rand>` and
 * only renames it into `releases/` once it is complete. The staged assets are
 * HARDLINKS into the blob store, and NTFS caps a single file at 1024 links.
 *
 * Before 2026-09-04 nothing removed that directory when a publish threw. The
 * publisher retries every few seconds, so one failure leaked a directory full
 * of links, which brought the next publish closer to the cap, which made it
 * fail, which leaked another. On 2026-09-03 it crossed the line and stopped
 * publishing entirely: **7,652 abandoned staging directories**, one blob
 * pinned at exactly 1024 links, and the game build reading a day-old bundle
 * while the service still reported itself Running and `verify` still passed —
 * because nothing on the drive was invalid, it was just old.
 *
 * This is a source test rather than a runtime one on purpose. A runtime test
 * would need a database, a blob store, and a way to exhaust an NTFS link
 * count; what actually has to stay true is one structural property of the
 * code, and this fails on the diff that would remove it.
 */

const source = readFileSync(path.join(import.meta.dirname, "publisher.ts"), "utf8");

/** The body of `publishCodexBundle`, from the staging path to the end. */
function publishBody() {
  const start = source.indexOf("const stagingPath = path.join(syncRoot");
  assert.ok(start > 0, "the staging path has moved or been renamed; re-verify the cleanup guarantee before updating this test");
  return source.slice(start);
}

test("a failed publish removes its own staging directory", () => {
  const body = publishBody();
  const guard = body.indexOf("} catch (error) {");
  assert.ok(guard > 0, "publishCodexBundle no longer catches around the staging work — a failure will leak a directory of hardlinks again");

  const handler = body.slice(guard, guard + 400);
  assert.match(
    handler,
    /rm\(stagingPath, \{ recursive: true, force: true \}\)/,
    "the failure path does not remove stagingPath; every failed publish will leak hardlinks and walk the blob store toward the NTFS 1024-link cap",
  );
  assert.match(handler, /throw error/, "the failure path swallows the error — a publish must still fail loudly, just without leaking");
});

test("the staged release is still only renamed into place once it is complete", () => {
  const body = publishBody();
  const rename = body.indexOf("await rename(stagingPath, releasePath)");
  const pointer = body.indexOf('replaceFileAtomically(path.join(syncRoot, "current.json")');
  assert.ok(rename > 0, "the staged directory is no longer renamed into releases/ — a partial release could become visible");
  assert.ok(pointer > rename, "current.json is written before the release is in place; the pointer must never name a directory that is still staging");
});

test("the reason the cleanup exists is written down where somebody would remove it", () => {
  const body = publishBody();
  const preamble = body.slice(0, body.indexOf("try {"));
  assert.match(preamble, /hardlink/i, "the comment above the staging work no longer explains that staged assets are hardlinks");
  assert.match(preamble, /1024/, "the comment no longer names the NTFS link cap that makes a leaked directory an outage rather than clutter");
});
