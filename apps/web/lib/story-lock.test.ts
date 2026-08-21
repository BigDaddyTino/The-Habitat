import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { isStoryFlowEditable, storyLockNotice } from "@habitat/shared";

/**
 * The lock is only worth as much as its weakest action. Hiding a button is
 * presentation; what actually freezes a flow is `assertArcUnlocked` running
 * inside the transaction that writes. So these tests read the action module
 * itself and insist that every mutation which can reach an arc passes through
 * that gate — the failure mode being guarded against is not a broken guard but
 * a new action written later that simply forgets to call it.
 */
const source = readFileSync(join(process.cwd(), "app/codex/actions.ts"), "utf8");

/** Every `export async function name(...)` and the body up to the next one. */
function actionBodies() {
  const bodies = new Map<string, string>();
  const pattern = /^export async function (\w+)\(/gm;
  const starts: Array<{ name: string; at: number }> = [];
  for (let match = pattern.exec(source); match; match = pattern.exec(source)) {
    starts.push({ name: match[1], at: match.index });
  }
  starts.forEach((start, index) => {
    bodies.set(start.name, source.slice(start.at, starts[index + 1]?.at ?? source.length));
  });
  return bodies;
}

/** Mutations that reach an arc, its cards, its branches, or their links. */
const gatedActions = [
  "updateArc",
  "createNode",
  "updateNode",
  "deleteNode",
  "createEdge",
  "updateEdge",
  "reorderEdge",
  "addBranch",
  "deleteEdge",
  "linkEntryToNode",
  "unlinkEntryFromNode",
  "setStoryStatus",
  "canoniseArc",
  // Closing a board is the most final thing that can happen to one, so the
  // freeze binds it hardest: a settled flow has to be deliberately unlocked
  // before anybody can take it off the shelf.
  "archiveArc",
];

/**
 * Deliberately outside the freeze. Comments stay open because locking settles
 * the story, not the conversation about it; presence and courtesy locks are
 * signals rather than writes; the bible is not a flow; and an arc that does
 * not exist yet cannot be locked.
 */
const ungatedActions = [
  "createArc",
  "createEntry",
  "updateEntry",
  "updateEntryMeta",
  "archiveEntry",
  // Canon packets write the THREAD entry and nothing else. Pushing settled
  // material toward canon is a hand-off, not a freeze and not an approval —
  // the arc padlock is still the only thing that settles a flow — so a locked
  // arc has no say over what the development room hands across.
  "pushCanonPacket",
  "markCanonPacketWoven",
  "withdrawCanonPacket",
  "addComment",
  "resolveComment",
  "claimNodeLock",
  "releaseNodeLock",
  "claimEntryLock",
  "releaseEntryLock",
  "askWarden",
  "touchStoryPresence",
  "lockArc",
  "unlockArc",
];

test("nothing is frozen until a lock says so", () => {
  assert.equal(isStoryFlowEditable(false), true);
  assert.equal(isStoryFlowEditable(true), false);
});

test("every arc-scoped mutation passes through the lock gate", () => {
  const bodies = actionBodies();
  for (const name of gatedActions) {
    const body = bodies.get(name);
    assert.ok(body, `${name} is no longer an exported action — the gate list is stale`);
    assert.match(body, /await assertArcUnlocked\(tx, /, `${name} can write to an arc without checking whether it is locked`);
  }
});

test("the gate runs inside the writing transaction, never before it", () => {
  // Checked outside `db.$transaction`, a lock landing between the read and the
  // write would be raced straight past. Every call site must sit after the
  // transaction opens.
  const bodies = actionBodies();
  for (const name of gatedActions) {
    const body = bodies.get(name) as string;
    const opens = body.indexOf("db.$transaction");
    const gate = body.indexOf("assertArcUnlocked");
    assert.ok(opens >= 0, `${name} does not open a transaction`);
    assert.ok(gate > opens, `${name} checks the lock outside its transaction`);
  }
});

test("any writer can lock, and only an admin can unlock", () => {
  // The asymmetry is the feature. A writer settles their own flow so nobody
  // edits it out from under them; letting them lift it again would make the
  // freeze a preference rather than a record.
  const bodies = actionBodies();
  const lock = bodies.get("lockArc");
  const unlock = bodies.get("unlockArc");
  assert.ok(lock && unlock, "lockArc and unlockArc must both exist");
  assert.match(lock, /requireRole\(storyReadRole\)/, "any member must be able to lock");
  assert.doesNotMatch(lock, /requireRole\(storyReviewRole\)/);
  assert.match(unlock, /requireRole\(storyReviewRole\)/, "only an admin may unlock");
  assert.doesNotMatch(unlock, /requireRole\(storyReadRole\)/);
});

test("locking is idempotent, so a second click cannot rewrite who settled it", () => {
  const lock = actionBodies().get("lockArc") as string;
  assert.match(lock, /if \(arc\.lockedAt\) return/, "a lock already held must be left exactly as it stands");
});

test("the actions left outside the freeze are left outside deliberately", () => {
  const bodies = actionBodies();
  for (const name of ungatedActions) {
    const body = bodies.get(name);
    assert.ok(body, `${name} is no longer an exported action — the exemption list is stale`);
    assert.doesNotMatch(body, /assertArcUnlocked/, `${name} is gated but listed as exempt — move it to the gated list`);
  }
});

test("no action is missing from both lists", () => {
  // A new action added later lands in neither list and fails here, forcing the
  // author to decide whether the freeze applies to it.
  const known = new Set([...gatedActions, ...ungatedActions]);
  const unclassified = [...actionBodies().keys()].filter((name) => !known.has(name));
  assert.deepEqual(unclassified, [], `these actions are neither gated nor exempted: ${unclassified.join(", ")}`);
});

test("status no longer freezes anything", () => {
  // The approval ladder went on 2026-08-18 and the status-based gate went with
  // it on 2026-08-19. Its return would silently re-freeze canon.
  assert.doesNotMatch(source, /isStoryContentEditable/);
});

test("a locked flow explains itself the same way wherever it is met", () => {
  assert.match(storyLockNotice("Tino"), /^Tino locked this flow\./);
  // The locker's account can be deleted out from under a standing lock, and
  // the notice still has to read as a sentence rather than "null locked this".
  assert.match(storyLockNotice(null), /^This flow is locked\./);
  for (const notice of [storyLockNotice("Tino"), storyLockNotice(null)]) {
    assert.match(notice, /an admin can unlock it/i);
  }
});
