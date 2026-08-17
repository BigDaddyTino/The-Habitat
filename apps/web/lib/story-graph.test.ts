import assert from "node:assert/strict";
import test from "node:test";
import {
  analyzeStoryGraph,
  findStoryEntryNodeKeys,
  isStoryLockHeld,
  isStoryContentEditable,
  isStoryPresenceFresh,
  isValidStoryKey,
  slugifyStoryKey,
  storyLockTtlMs,
  storyPresenceTtlMs,
  type StoryGraphEdge,
  type StoryGraphNode,
} from "@habitat/shared";

const scene = (key: string, title = key): StoryGraphNode => ({ key, kind: "SCENE", title });
const ending = (key: string): StoryGraphNode => ({ key, kind: "ENDING", title: key });
const link = (fromKey: string, toKey: string, label: string | null = null): StoryGraphEdge => ({ fromKey, toKey, label });

test("contributors cannot revise canon in place while reviewers can", () => {
  assert.equal(isStoryContentEditable("CANON", false), false);
  assert.equal(isStoryContentEditable("CANON", true), true);
  assert.equal(isStoryContentEditable("PROPOSED", false), true);
  assert.equal(isStoryContentEditable("DRAFT", false), true);
});

function problemKinds(nodes: StoryGraphNode[], edges: StoryGraphEdge[]) {
  return analyzeStoryGraph(nodes, edges).map((problem) => `${problem.kind}:${problem.nodeKey ?? ""}`);
}

test("a straight line from an opening to an ending is clean", () => {
  const nodes = [scene("gate"), scene("hall"), ending("out")];
  const edges = [link("gate", "hall"), link("hall", "out")];
  assert.deepEqual(analyzeStoryGraph(nodes, edges), []);
});

test("the opening is the node nothing leads into", () => {
  const nodes = [scene("gate"), scene("hall"), ending("out")];
  const edges = [link("gate", "hall"), link("hall", "out")];
  assert.deepEqual(findStoryEntryNodeKeys(nodes, edges), ["gate"]);
});

test("a scene with no way out is a dead end, but an ending is not", () => {
  assert.deepEqual(problemKinds([scene("gate"), scene("stuck")], [link("gate", "stuck")]), ["DEAD_END:stuck"]);
  assert.deepEqual(problemKinds([scene("gate"), ending("done")], [link("gate", "done")]), []);
});

test("a node reachable only from a second opening is not a problem", () => {
  // Several openings are legitimate: a side quest can be enterable from more
  // than one place, so a subgraph with its own entry is not an error.
  const nodes = [scene("gate"), ending("out"), scene("side"), ending("side-out")];
  const edges = [link("gate", "out"), link("side", "side-out")];
  assert.deepEqual(problemKinds(nodes, edges), []);
});

test("a card wired to nothing is reported as isolated, whatever its kind", () => {
  assert.deepEqual(problemKinds([scene("gate"), ending("out"), ending("orphan")], [link("gate", "out")]), ["ISOLATED:orphan"]);
  assert.deepEqual(problemKinds([scene("gate"), ending("out"), scene("stray")], [link("gate", "out")]), ["ISOLATED:stray"]);
});

test("the only node on a board is not called isolated", () => {
  // A board with one card is where every arc starts. Warning about it would
  // greet the writer with a problem before they have done anything wrong.
  assert.deepEqual(problemKinds([scene("gate")], []), ["DEAD_END:gate"]);
  assert.deepEqual(problemKinds([ending("out")], []), []);
});

test("a node behind a cut branch is reported as unreachable", () => {
  const nodes = [scene("gate"), ending("out"), scene("stranded"), ending("beyond")];
  const edges = [link("gate", "out"), link("stranded", "beyond"), link("beyond", "stranded")];
  // `stranded` and `beyond` only point at each other, so neither is an opening
  // and nothing outside the pair leads in.
  assert.deepEqual(problemKinds(nodes, edges), ["UNREACHABLE:stranded", "UNREACHABLE:beyond"]);
});

test("a board that is entirely a loop has no way in", () => {
  const nodes = [scene("a"), scene("b")];
  const edges = [link("a", "b"), link("b", "a")];
  const problems = analyzeStoryGraph(nodes, edges);
  assert.equal(problems.length, 1);
  assert.equal(problems[0]?.kind, "NO_ENTRY_POINT");
});

test("with no entry point, nothing is additionally reported as unreachable", () => {
  // Every node in a closed loop is unreachable by definition. Listing them all
  // would bury the one problem that actually needs fixing.
  const nodes = [scene("a"), scene("b"), scene("c")];
  const edges = [link("a", "b"), link("b", "c"), link("c", "a")];
  assert.deepEqual(problemKinds(nodes, edges), ["NO_ENTRY_POINT:"]);
});

test("a split with unlabelled branches is flagged, a single continuation is not", () => {
  const forked = problemKinds([scene("gate"), ending("left"), ending("right")], [link("gate", "left", "Go left"), link("gate", "right")]);
  assert.deepEqual(forked, ["UNLABELLED_BRANCH:gate"]);
  assert.deepEqual(problemKinds([scene("gate"), ending("out")], [link("gate", "out")]), []);
});

test("two branches offering the same choice text are flagged once", () => {
  const nodes = [scene("gate"), ending("a"), ending("b")];
  const edges = [link("gate", "a", "Knock"), link("gate", "b", "knock")];
  assert.deepEqual(problemKinds(nodes, edges), ["DUPLICATE_BRANCH_LABEL:gate"]);
});

test("edges pointing at nodes outside the graph are ignored rather than crashing", () => {
  // The export drops choices whose far end is not canon, so an edge can
  // legitimately outlive one of its endpoints in the data handed to analysis.
  const nodes = [scene("gate"), ending("out")];
  const edges = [link("gate", "out"), link("gate", "cut-scene")];
  assert.deepEqual(analyzeStoryGraph(nodes, edges), []);
});

test("an empty board reports nothing", () => {
  assert.deepEqual(analyzeStoryGraph([], []), []);
});

test("slugs are kebab-case and survive accents", () => {
  assert.equal(slugifyStoryKey("The Drowned Chapel"), "the-drowned-chapel");
  assert.equal(slugifyStoryKey("Ëlara's Gate"), "elara-s-gate");
  assert.equal(slugifyStoryKey("  ...  "), "");
  assert.equal(slugifyStoryKey("a".repeat(90)).length, 64);
});

test("a slug is never left with a trailing separator after truncation", () => {
  const slug = slugifyStoryKey(`${"a".repeat(63)} tail`);
  assert.equal(slug.endsWith("-"), false);
  assert.equal(isValidStoryKey(slug), true);
});

test("key validation matches what the database CHECK accepts", () => {
  assert.equal(isValidStoryKey("the-gate"), true);
  assert.equal(isValidStoryKey("gate2"), true);
  assert.equal(isValidStoryKey("The-Gate"), false);
  assert.equal(isValidStoryKey("-gate"), false);
  assert.equal(isValidStoryKey("gate-"), false);
  assert.equal(isValidStoryKey("gate--two"), false);
  assert.equal(isValidStoryKey(""), false);
});

test("an expired lock is not held", () => {
  const now = new Date("2026-08-17T12:00:00Z");
  const live = new Date(now.getTime() + storyLockTtlMs);
  const stale = new Date(now.getTime() - 1000);
  assert.equal(isStoryLockHeld({ lockedByUserId: "u1", lockExpiresAt: live }, now), true);
  assert.equal(isStoryLockHeld({ lockedByUserId: "u1", lockExpiresAt: stale }, now), false);
  assert.equal(isStoryLockHeld({ lockedByUserId: null, lockExpiresAt: null }, now), false);
  assert.equal(isStoryLockHeld(null, now), false);
});

test("presence ages out rather than being deleted on exit", () => {
  const now = new Date("2026-08-17T12:00:00Z");
  assert.equal(isStoryPresenceFresh(new Date(now.getTime() - 1000), now), true);
  assert.equal(isStoryPresenceFresh(new Date(now.getTime() - storyPresenceTtlMs - 1), now), false);
});
