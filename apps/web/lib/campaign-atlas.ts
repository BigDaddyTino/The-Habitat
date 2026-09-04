import type { StoryArcCategory, StoryNodeKind, StoryStatus } from "@habitat/shared";

/**
 * The campaign atlas: the whole main campaign as one continuous graph, and
 * everything that spiders off it.
 *
 * The existing campaign page is arc-level — six chapter cards and the gold
 * lines between them. This is the scene-level map underneath it: every
 * mainline card from the first quest down, every branch inside every chapter,
 * the joins between chapters, and each side board, contract and companion
 * chain hung off the exact card it reaches.
 *
 * **Everything here is derived and nothing is maintained.** Three kinds of
 * join, drawn differently on purpose, because the difference is the point:
 *
 *   `handoff` — an ENDING's `continuesInArcId`. Structural, exported to the
 *               game, the only kind the campaign flow has ever drawn.
 *   `flag`    — a FLAG slug set in one board's effects and read in another's
 *               condition. Real, playable, and invisible to the old map.
 *   `implied` — neither of those: two consecutive mainline chapters that
 *               nothing actually connects. **Drawn as a gap, not a line**,
 *               because a campaign map that quietly stitches its own holes
 *               shut is worse than no map.
 *
 * This module is the pure half — layout and graph maths, no I/O — so the
 * arithmetic can be tested without a database.
 */

export type AtlasNode = {
  id: string;
  key: string;
  kind: StoryNodeKind;
  title: string;
  arcSlug: string;
  /** Only meaningful on ENDING. */
  endingKind: string | null;
  lines: number;
  /** Nothing inside this arc leads here — where a reader starts. */
  entry: boolean;
  /** Nothing leads out of here inside this arc. */
  terminal: boolean;
};

export type AtlasEdge = {
  id: string;
  from: string;
  to: string;
  label: string | null;
  condition: string | null;
};

export type AtlasArc = {
  slug: string;
  title: string;
  category: StoryArcCategory;
  isMainline: boolean;
  position: number;
  status: StoryStatus;
  locked: boolean;
  summary: string | null;
  hook: string | null;
  nodeCount: number;
  region: { slug: string; title: string } | null;
};

export type AtlasJoinKind = "handoff" | "flag" | "implied";

export type AtlasJoin = {
  kind: AtlasJoinKind;
  fromArc: string;
  /** The exact card the join leaves from, when one is known. */
  fromNode: string | null;
  toArc: string;
  toNode: string | null;
  label: string;
};

export type AtlasCompanion = {
  slug: string;
  title: string;
  /**
   * The earliest mainline card that names them, by chapter order — which is
   * where the chain is drawn from.
   *
   * Deliberately "first named" and not "recruited here": nothing in the data
   * distinguishes the card where a companion joins from the cards that merely
   * mention them, so the map says what it can prove and `namedOn` carries the
   * rest rather than a guess dressed up as a fact.
   */
  atArc: string;
  atNode: string;
  /** Every mainline card that names them, earliest first. */
  namedOn: { arcSlug: string; arcTitle: string; nodeId: string; nodeTitle: string }[];
  missions: { slug: string; title: string; order: number | null; stage: string | null }[];
};

/** An ENDING in a chapter that is not the last one, with nothing after it. */
export type DanglingEnding = { arcSlug: string; arcTitle: string; nodeId: string; nodeTitle: string };

export type CampaignAtlas = {
  /** The mainline, in position order. */
  spine: AtlasArc[];
  /** Every mainline card. */
  nodes: AtlasNode[];
  /** Every branch inside a mainline chapter. */
  edges: AtlasEdge[];
  /** Boards that are not mainline but reach it, directly or through others. */
  side: AtlasArc[];
  joins: AtlasJoin[];
  companions: AtlasCompanion[];
  /**
   * Recruitable characters with no mission chain written, so the map can say
   * how many companions the campaign has rather than only how many have one.
   */
  companionsWithoutChain: { slug: string; title: string }[];
  /** Boards nothing connects to at all. Reported, never hidden. */
  orphans: AtlasArc[];
  /**
   * Orphans grouped by what they are wired to. Seven boards that all reach
   * each other and nothing else is one problem; seven loose boards are seven.
   * The map is more use if it says which.
   */
  orphanClusters: AtlasArc[][];
  /**
   * An ENDING that stops. The chapter-level gap catches two chapters nothing
   * joins; this catches the sharper case — a card the story is supposed to
   * leave by, in the middle of the campaign, with nothing leading out of it.
   */
  danglingEndings: DanglingEnding[];
  /**
   * Approved story threads that have not become a board yet: the campaign's
   * forward edge, so the map does not simply stop at the last written card.
   */
  planned: { slug: string; title: string; summary: string | null }[];
};

// ---------------------------------------------------------------- the layout

export const ATLAS_ROW = 118;
export const ATLAS_COL = 300;
export const ATLAS_SIDE_GAP = 470;
export const ATLAS_LANE_GAP = 190;

export type Placed = { x: number; y: number };

/**
 * Longest-path depth over a directed graph, by Kahn's algorithm.
 *
 * Longest rather than shortest so a card that two branches both reach sits
 * *below* both of them instead of level with the earlier one — which is what
 * makes a convergence read as a convergence. Kahn also gives a cycle a safe
 * failure mode: anything still holding an indegree when the queue empties
 * keeps the depth it had, so a loop drawn by mistake flattens instead of
 * hanging the page.
 */
export function longestPathDepth(ids: readonly string[], links: readonly { from: string; to: string }[]): Map<string, number> {
  const known = new Set(ids);
  const out = new Map<string, string[]>();
  const indegree = new Map<string, number>(ids.map((id) => [id, 0]));
  for (const link of links) {
    if (!known.has(link.from) || !known.has(link.to) || link.from === link.to) continue;
    out.set(link.from, [...(out.get(link.from) ?? []), link.to]);
    indegree.set(link.to, (indegree.get(link.to) ?? 0) + 1);
  }
  const depth = new Map<string, number>(ids.map((id) => [id, 0]));
  const queue = ids.filter((id) => (indegree.get(id) ?? 0) === 0);
  while (queue.length > 0) {
    const id = queue.shift() as string;
    for (const child of out.get(id) ?? []) {
      depth.set(child, Math.max(depth.get(child) ?? 0, (depth.get(id) ?? 0) + 1));
      const left = (indegree.get(child) ?? 0) - 1;
      indegree.set(child, left);
      if (left === 0) queue.push(child);
    }
  }
  return depth;
}

/** Where a chapter's lane starts and how wide it turned out. */
export type Lane = { arcSlug: string; x: number; width: number; rows: number };

export type SpineLayout = { placed: Map<string, Placed>; lanes: Lane[]; width: number; rows: number };

/**
 * Places every mainline card: one lane per chapter, left to right in campaign
 * order, each lane flowing top to bottom.
 *
 * Depth is computed **inside a chapter**, not across the whole campaign. One
 * global spine was the first thing tried and it is unreadable: 107 cards came
 * out 87 rows deep and about one card wide, so fitting it to a landscape
 * canvas zoomed every card down to a smudge. Lanes give the map an aspect
 * ratio a screen actually has, and the joins between chapters still carry the
 * eye across, which is what makes it one map rather than six.
 *
 * A lane is as wide as its widest row, so a chapter that branches four ways
 * gets the room and a linear one does not waste it.
 */
export function layoutSpine(atlas: Pick<CampaignAtlas, "spine" | "nodes" | "edges" | "joins">): SpineLayout {
  const byArc = new Map<string, AtlasNode[]>();
  for (const node of atlas.nodes) byArc.set(node.arcSlug, [...(byArc.get(node.arcSlug) ?? []), node]);
  const edgesByArc = new Map<string, { from: string; to: string }[]>();
  const arcOfNode = new Map(atlas.nodes.map((node) => [node.id, node.arcSlug]));
  for (const edge of atlas.edges) {
    const arc = arcOfNode.get(edge.from);
    if (!arc || arcOfNode.get(edge.to) !== arc) continue;
    edgesByArc.set(arc, [...(edgesByArc.get(arc) ?? []), { from: edge.from, to: edge.to }]);
  }

  const placed = new Map<string, Placed>();
  const lanes: Lane[] = [];
  let cursor = 0;

  for (const arc of atlas.spine) {
    const members = byArc.get(arc.slug) ?? [];
    if (members.length === 0) {
      lanes.push({ arcSlug: arc.slug, x: cursor, width: ATLAS_COL, rows: 0 });
      cursor += ATLAS_COL + ATLAS_LANE_GAP;
      continue;
    }
    const depth = longestPathDepth(members.map((node) => node.id), edgesByArc.get(arc.slug) ?? []);
    const rows = new Map<number, AtlasNode[]>();
    for (const node of members) {
      const row = depth.get(node.id) ?? 0;
      rows.set(row, [...(rows.get(row) ?? []), node]);
    }
    let widest = 1;
    for (const row of rows.values()) widest = Math.max(widest, row.length);
    const laneWidth = widest * ATLAS_COL;

    for (const [row, cards] of rows) {
      cards.sort((left, right) => left.title.localeCompare(right.title));
      cards.forEach((node, index) => {
        // Centred inside the lane, so a wide row and a single card below it
        // still read as one column of story rather than a ragged edge.
        const offset = (index - (cards.length - 1) / 2) * ATLAS_COL;
        placed.set(node.id, { x: cursor + laneWidth / 2 + offset, y: row * ATLAS_ROW });
      });
    }
    lanes.push({ arcSlug: arc.slug, x: cursor, width: laneWidth, rows: rows.size });
    cursor += laneWidth + ATLAS_LANE_GAP;
  }

  let deepest = 0;
  for (const spot of placed.values()) deepest = Math.max(deepest, spot.y);
  return { placed, lanes, width: Math.max(0, cursor - ATLAS_LANE_GAP), rows: Math.round(deepest / ATLAS_ROW) + 1 };
}

/**
 * How complete the campaign's connective tissue is, as a number the page can
 * state plainly. A map that shows gaps should also count them.
 */
export function atlasHealth(atlas: CampaignAtlas) {
  const gaps = atlas.joins.filter((join) => join.kind === "implied");
  return {
    chapters: atlas.spine.length,
    cards: atlas.nodes.length,
    branches: atlas.edges.length,
    handoffs: atlas.joins.filter((join) => join.kind === "handoff").length,
    flagJoins: atlas.joins.filter((join) => join.kind === "flag").length,
    gaps: gaps.length,
    gapLabels: gaps.map((join) => `${join.fromArc} → ${join.toArc}`),
    sideBoards: atlas.side.length,
    companions: atlas.companions.length,
    companionsWithoutChain: atlas.companionsWithoutChain.length,
    orphans: atlas.orphans.length,
    orphanClusters: atlas.orphanClusters.length,
    danglingEndings: atlas.danglingEndings.length,
    planned: atlas.planned.length,
    /** Everything the map is asking somebody to finish, as one number. */
    loose: gaps.length + atlas.danglingEndings.length + atlas.orphans.length,
  };
}

/**
 * Connected components over a set of boards, given the joins between them.
 * Used to group orphans: boards that reach each other but not the campaign.
 */
export function clusterBoards(boards: readonly AtlasArc[], joins: readonly AtlasJoin[]): AtlasArc[][] {
  const inSet = new Map(boards.map((arc) => [arc.slug, arc]));
  const neighbours = new Map<string, Set<string>>();
  for (const join of joins) {
    if (join.kind === "implied") continue;
    if (!inSet.has(join.fromArc) || !inSet.has(join.toArc)) continue;
    neighbours.set(join.fromArc, (neighbours.get(join.fromArc) ?? new Set<string>()).add(join.toArc));
    neighbours.set(join.toArc, (neighbours.get(join.toArc) ?? new Set<string>()).add(join.fromArc));
  }
  const seen = new Set<string>();
  const clusters: AtlasArc[][] = [];
  for (const arc of boards) {
    if (seen.has(arc.slug)) continue;
    const cluster: AtlasArc[] = [];
    const frontier = [arc.slug];
    seen.add(arc.slug);
    while (frontier.length > 0) {
      const slug = frontier.shift() as string;
      const found = inSet.get(slug);
      if (found) cluster.push(found);
      for (const next of neighbours.get(slug) ?? []) {
        if (seen.has(next)) continue;
        seen.add(next);
        frontier.push(next);
      }
    }
    clusters.push(cluster.sort((left, right) => left.title.localeCompare(right.title)));
  }
  return clusters.sort((left, right) => right.length - left.length);
}
