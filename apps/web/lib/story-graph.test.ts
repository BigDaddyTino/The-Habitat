import assert from "node:assert/strict";
import test from "node:test";
import {
  analyzeStoryGraph,
  findStoryEntryNodeKeys,
  isStoryLockHeld,
  isStoryContentEditable,
  isStoryPresenceFresh,
  isValidStoryKey,
  parseStoryPlaceKind,
  slugifyStoryKey,
  storyLockTtlMs,
  storyPlaceAncestry,
  storyPlaceDescendants,
  storyPlaceKinds,
  storyPlaceRoot,
  storyPresenceTtlMs,
  type StoryGraphEdge,
  type StoryGraphNode,
  type StoryPlaceLink,
} from "@habitat/shared";

const scene = (key: string, title = key): StoryGraphNode => ({ key, kind: "SCENE", title });
const ending = (key: string): StoryGraphNode => ({ key, kind: "ENDING", title: key });
const link = (fromKey: string, toKey: string, label: string | null = null): StoryGraphEdge => ({ fromKey, toKey, label });

test("the codex is an open writers' room — every status is editable by any member", () => {
  // The approval ladder was removed on 2026-08-18; the audit log replaced it.
  assert.equal(isStoryContentEditable("CANON", false), true);
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

test("labelled choices that all land on one card and record nothing are hollow", () => {
  const nodes = [scene("manifest"), scene("carry"), ending("out")];
  const onward = [link("carry", "out")];
  // Three labelled choices, one destination, no effects: the decision is theatre.
  const hollow = [link("manifest", "carry", "Wounded first"), link("manifest", "carry", "Munitions first"), link("manifest", "carry", "Archives")];
  assert.deepEqual(problemKinds(nodes, [...hollow, ...onward]), ["HOLLOW_CHOICE:manifest"]);

  // Effects on each branch make the same shape a real decision.
  const consequential = hollow.map((edge) => ({ ...edge, hasConsequence: true }));
  assert.deepEqual(problemKinds(nodes, [...consequential, ...onward]), []);

  // Different destinations are their own consequence — never flagged.
  const diverging = [link("manifest", "carry", "Wounded first"), link("manifest", "out", "Munitions first")];
  assert.deepEqual(problemKinds(nodes, [...diverging, ...onward]), []);

  // A condition gates whether a choice is offered; it is not a consequence.
  const gated = [link("manifest", "carry", "Wounded first"), { ...link("manifest", "carry", "Archives"), hasConsequence: false }];
  assert.deepEqual(problemKinds(nodes, [...gated, ...onward]), ["HOLLOW_CHOICE:manifest"]);
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

// --- the place picker -------------------------------------------------------

test("one place-kind choice carries both the type and the settlement tier", () => {
  assert.deepEqual(parseStoryPlaceKind("site"), { type: "site", settlementTier: null });
  assert.deepEqual(parseStoryPlaceKind("settlement:village"), { type: "settlement", settlementTier: "village" });
  assert.deepEqual(parseStoryPlaceKind("settlement:major-city"), { type: "settlement", settlementTier: "major-city" });
  assert.deepEqual(parseStoryPlaceKind("region"), { type: "region", settlementTier: null });
});

test("an unknown place kind is refused rather than guessed at", () => {
  // The value arrives from a form, so anything can be posted; a null here
  // leaves the sheet's type unset instead of inventing a tier.
  assert.equal(parseStoryPlaceKind("settlement"), null);
  assert.equal(parseStoryPlaceKind("hamlet"), null);
  assert.equal(parseStoryPlaceKind(""), null);
  assert.equal(parseStoryPlaceKind(null), null);
  assert.equal(parseStoryPlaceKind(undefined), null);
});

test("every offered place kind parses, and only settlements carry a tier", () => {
  for (const kind of storyPlaceKinds) {
    const parsed = parseStoryPlaceKind(kind.value);
    assert.deepEqual(parsed, { type: kind.type, settlementTier: kind.settlementTier });
    if (kind.type !== "settlement") assert.equal(parsed?.settlementTier, null, `${kind.value} must not carry a tier`);
  }
});

// --- the world hierarchy: region > place > destination ----------------------

/** island > shattermarket > grocery-store, plus an unattached drifter. */
const world: StoryPlaceLink[] = [
  { slug: "igit-island", parent: null },
  { slug: "shattermarket", parent: "igit-island" },
  { slug: "grocery-store", parent: "shattermarket" },
  { slug: "stock-room", parent: "grocery-store" },
  { slug: "glasswater", parent: "igit-island" },
  { slug: "loose-place", parent: null },
];

test("a destination knows every place that contains it, nearest first", () => {
  assert.deepEqual(storyPlaceAncestry("grocery-store", world), ["shattermarket", "igit-island"]);
  assert.deepEqual(storyPlaceAncestry("stock-room", world), ["grocery-store", "shattermarket", "igit-island"]);
  assert.deepEqual(storyPlaceAncestry("igit-island", world), []);
  assert.deepEqual(storyPlaceAncestry("loose-place", world), []);
});

test("a place lists everything inside it at every depth", () => {
  assert.deepEqual(storyPlaceDescendants("igit-island", world), ["shattermarket", "glasswater", "grocery-store", "stock-room"]);
  assert.deepEqual(storyPlaceDescendants("shattermarket", world), ["grocery-store", "stock-room"]);
  assert.deepEqual(storyPlaceDescendants("stock-room", world), []);
});

test("a destination still files under the top-level region it sits in", () => {
  const isRoot = (slug: string) => slug === "igit-island";
  assert.equal(storyPlaceRoot("stock-room", world, isRoot), "igit-island");
  assert.equal(storyPlaceRoot("igit-island", world, isRoot), "igit-island");
  assert.equal(storyPlaceRoot("loose-place", world, isRoot), null);
});

test("a broken parent chain renders short instead of hanging the page", () => {
  // parent is writer-editable, so all three of these are reachable states.
  const selfParent: StoryPlaceLink[] = [{ slug: "a", parent: "a" }];
  const cycle: StoryPlaceLink[] = [{ slug: "a", parent: "b" }, { slug: "b", parent: "a" }];
  const unwritten: StoryPlaceLink[] = [{ slug: "a", parent: "not-written-yet" }];

  assert.deepEqual(storyPlaceAncestry("a", selfParent), []);
  assert.deepEqual(storyPlaceDescendants("a", selfParent), []);
  assert.deepEqual(storyPlaceAncestry("a", cycle), ["b"]);
  assert.deepEqual(storyPlaceDescendants("a", cycle), ["b"]);
  assert.deepEqual(storyPlaceAncestry("a", unwritten), []);
  assert.equal(storyPlaceRoot("a", cycle, () => false), null);
});
