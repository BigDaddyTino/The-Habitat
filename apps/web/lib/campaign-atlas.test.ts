import assert from "node:assert/strict";
import test from "node:test";
import { atlasHealth, layoutSpine, longestPathDepth, ATLAS_COL, ATLAS_ROW, type CampaignAtlas } from "./campaign-atlas";

const node = (id: string, arcSlug: string, extra: Partial<CampaignAtlas["nodes"][number]> = {}) => ({
  id, key: id, kind: "SCENE" as const, title: id, arcSlug,
  endingKind: null, lines: 0, entry: false, terminal: false, ...extra,
});

test("longest-path depth puts a convergence below both of its branches", () => {
  const depth = longestPathDepth(["a", "b", "c", "d"], [
    { from: "a", to: "b" },
    { from: "a", to: "c" },
    { from: "b", to: "d" },
    { from: "c", to: "d" },
  ]);
  assert.equal(depth.get("a"), 0);
  assert.equal(depth.get("b"), 1);
  assert.equal(depth.get("c"), 1);
  // Shortest path would also say 1 here, and the merge would draw level with
  // the branches it merges. Longest is what makes a convergence read as one.
  assert.equal(depth.get("d"), 2);
});

test("a long leg pushes the convergence all the way down", () => {
  const depth = longestPathDepth(["a", "b1", "b2", "b3", "c", "end"], [
    { from: "a", to: "b1" }, { from: "b1", to: "b2" }, { from: "b2", to: "b3" }, { from: "b3", to: "end" },
    { from: "a", to: "c" }, { from: "c", to: "end" },
  ]);
  assert.equal(depth.get("end"), 4, "the ending sits below the longest road into it, not the shortest");
});

test("a cycle flattens instead of hanging the page", () => {
  const depth = longestPathDepth(["a", "b"], [{ from: "a", to: "b" }, { from: "b", to: "a" }]);
  // Neither node ever reaches indegree zero, so Kahn's queue starts empty and
  // both keep their initial depth. A board drawn with a loop still renders.
  assert.equal(depth.get("a"), 0);
  assert.equal(depth.get("b"), 0);
});

test("edges naming an unknown node, or a node naming itself, are ignored", () => {
  const depth = longestPathDepth(["a"], [{ from: "a", to: "ghost" }, { from: "a", to: "a" }]);
  assert.equal(depth.size, 1);
  assert.equal(depth.get("a"), 0);
});

test("each chapter gets its own lane, left to right in campaign order", () => {
  const atlas = {
    spine: [
      { slug: "one", title: "One", category: "MAINLINE" as const, isMainline: true, position: 0, status: "CANON" as const, locked: false, summary: null, hook: null, nodeCount: 2, region: null },
      { slug: "two", title: "Two", category: "MAINLINE" as const, isMainline: true, position: 1, status: "CANON" as const, locked: false, summary: null, hook: null, nodeCount: 1, region: null },
    ],
    nodes: [
      node("a", "one", { entry: true }),
      node("a-end", "one", { kind: "ENDING", terminal: true }),
      node("b", "two", { entry: true }),
    ],
    edges: [{ id: "e", from: "a", to: "a-end", label: null, condition: null }],
    joins: [{ kind: "handoff" as const, fromArc: "one", fromNode: "a-end", toArc: "two", toNode: null, label: "on" }],
  };
  const { placed, lanes } = layoutSpine(atlas);
  // Depth is per chapter, so the next chapter starts at the top of its own
  // lane rather than continuing the previous one downward. One global spine
  // was tried first and came out 87 rows deep and one card wide.
  assert.equal(placed.get("a")?.y, 0);
  assert.equal(placed.get("a-end")?.y, ATLAS_ROW, "a branch still runs downward inside its chapter");
  assert.equal(placed.get("b")?.y, 0, "the next chapter starts at the top of its own lane");
  assert.ok(placed.get("b")!.x > placed.get("a")!.x, "and to the right of the one before it");
  assert.deepEqual(lanes.map((lane) => lane.arcSlug), ["one", "two"], "lanes come back in campaign order");
});

test("a lane is as wide as its widest row, and no wider", () => {
  const wide = {
    spine: [{ slug: "one", title: "One", category: "MAINLINE" as const, isMainline: true, position: 0, status: "CANON" as const, locked: false, summary: null, hook: null, nodeCount: 3, region: null }],
    nodes: [node("a", "one", { entry: true }), node("l", "one"), node("r", "one")],
    edges: [
      { id: "e1", from: "a", to: "l", label: null, condition: null },
      { id: "e2", from: "a", to: "r", label: null, condition: null },
    ],
    joins: [],
  };
  const branching = layoutSpine(wide);
  assert.equal(branching.lanes[0]!.width, ATLAS_COL * 2, "two siblings on one row make a two-column lane");

  const linear = layoutSpine({ ...wide, nodes: [node("a", "one", { entry: true }), node("l", "one")], edges: [{ id: "e1", from: "a", to: "l", label: null, condition: null }] });
  assert.equal(linear.lanes[0]!.width, ATLAS_COL, "a chapter that never branches does not reserve the room");
});

test("cards sharing a row straddle the centre of their own lane", () => {
  const atlas = {
    spine: [{ slug: "one", title: "One", category: "MAINLINE" as const, isMainline: true, position: 0, status: "CANON" as const, locked: false, summary: null, hook: null, nodeCount: 3, region: null }],
    nodes: [node("a", "one", { entry: true }), node("l", "one"), node("r", "one")],
    edges: [
      { id: "e1", from: "a", to: "l", label: null, condition: null },
      { id: "e2", from: "a", to: "r", label: null, condition: null },
    ],
    joins: [],
  };
  const { placed, lanes } = layoutSpine(atlas);
  const centre = lanes[0]!.x + lanes[0]!.width / 2;
  assert.equal(placed.get("a")?.x, centre, "a lone card sits on its lane's centre line");
  const xs = [placed.get("l")!.x, placed.get("r")!.x].sort((a, b) => a - b);
  assert.ok(xs[0]! < centre && xs[1]! > centre, "two siblings straddle it");
  assert.equal((xs[0]! + xs[1]!) / 2, centre, "symmetrically");
});

test("an empty chapter still takes a lane rather than collapsing the map", () => {
  const { lanes, width } = layoutSpine({
    spine: [
      { slug: "empty", title: "Empty", category: "MAINLINE" as const, isMainline: true, position: 0, status: "CANON" as const, locked: false, summary: null, hook: null, nodeCount: 0, region: null },
      { slug: "one", title: "One", category: "MAINLINE" as const, isMainline: true, position: 1, status: "CANON" as const, locked: false, summary: null, hook: null, nodeCount: 1, region: null },
    ],
    nodes: [node("a", "one", { entry: true })],
    edges: [],
    joins: [],
  });
  assert.equal(lanes.length, 2);
  assert.equal(lanes[0]!.rows, 0);
  assert.ok(width > ATLAS_COL, "the empty chapter still occupies width, so nothing draws on top of it");
});

test("health counts each join kind apart, because they mean different things", () => {
  const arc = (slug: string) => ({ slug, title: slug, category: "MAINLINE" as const, isMainline: true, position: 0, status: "CANON" as const, locked: false, summary: null, hook: null, nodeCount: 0, region: null });
  const health = atlasHealth({
    spine: [arc("one"), arc("two")],
    nodes: [node("a", "one")],
    edges: [],
    side: [],
    companions: [],
    orphans: [],
    joins: [
      { kind: "handoff", fromArc: "one", fromNode: "a", toArc: "two", toNode: null, label: "x" },
      { kind: "flag", fromArc: "one", fromNode: "a", toArc: "two", toNode: null, label: "y" },
      { kind: "implied", fromArc: "two", fromNode: null, toArc: "three", toNode: null, label: "z" },
    ],
  });
  assert.equal(health.handoffs, 1);
  assert.equal(health.flagJoins, 1);
  assert.equal(health.gaps, 1);
  assert.deepEqual(health.gapLabels, ["two → three"]);
});
