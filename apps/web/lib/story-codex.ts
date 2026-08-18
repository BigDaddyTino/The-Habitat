import "@/lib/environment";
import { getPrismaClient } from "@habitat/db/client";
import {
  analyzeStoryGraph,
  findStoryEntryNodeKeys,
  isStoryPresenceFresh,
  storyPresenceTtlMs,
  type StoryEntryKind,
  type StoryGraphEdge,
  type StoryGraphNode,
  type StoryEndingKind,
  type StoryGraphProblem,
  type StoryNodeKind,
  type StoryStatus,
} from "@habitat/shared";

const db = getPrismaClient();

/**
 * The Story Codex is unreleased plot for a game that has not shipped, so the
 * whole surface sits behind USER rather than being readable by VIEWER. Every
 * page and action in the codex checks this, and the export endpoint uses a
 * separate bearer token instead of a session.
 */
export const storyReadRole = "USER" as const;
export const storyReviewRole = "ADMIN" as const;

type NamedUser = { displayName: string | null; name: string | null; username: string | null } | null;

export function storyMemberName(user: NamedUser) {
  return user?.displayName ?? user?.name ?? user?.username ?? "A Habitat member";
}

export type StoryWriter = {
  userId: string;
  name: string;
  username: string | null;
  image: string | null;
};

export type StoryPresentWriter = StoryWriter & { nodeId: string | null };

export type StoryBoardNode = {
  id: string;
  key: string;
  kind: StoryNodeKind;
  title: string;
  summary: string | null;
  body: string | null;
  status: StoryStatus;
  /** The CHARACTER bible entry speaking this node, when it is one voice. */
  speaker: { id: string; slug: string; title: string } | null;
  endingKind: StoryEndingKind | null;
  completion: string | null;
  effects: string[];
  rewards: string[];
  /** The arc an ENDING flows into, when the writer has linked one. */
  continuesIn: { id: string; slug: string; title: string } | null;
  canvasX: number;
  canvasY: number;
  version: number;
  author: string;
  updatedAt: Date;
  commentCount: number;
  references: Array<{ id: string; slug: string; title: string; kind: StoryEntryKind }>;
  /** Unresolved notes only. Settled discussion is history, not a to-do. */
  comments: Array<{ id: string; body: string; author: string; createdAt: Date }>;
  /** Non-null only while somebody else's courtesy lock is still live. */
  lockedBy: StoryWriter | null;
};

export type StoryBoardEdge = {
  id: string;
  key: string;
  fromNodeId: string;
  toNodeId: string;
  label: string | null;
  condition: string | null;
  effects: string[];
  position: number;
  status: StoryStatus;
};

export type StoryBoard = {
  arc: {
    id: string;
    slug: string;
    title: string;
    summary: string | null;
    hook: string | null;
    region: { id: string; slug: string; title: string } | null;
    isMainline: boolean;
    status: StoryStatus;
    author: string;
  };
  nodes: StoryBoardNode[];
  edges: StoryBoardEdge[];
  libraryEntries: Array<{ id: string; slug: string; title: string; kind: StoryEntryKind; status: StoryStatus }>;
  entryNodeKeys: string[];
  problems: StoryGraphProblem[];
  present: StoryPresentWriter[];
};

function toWriter(user: { id: string; displayName: string | null; name: string | null; username: string | null; image: string | null }): StoryWriter {
  return { userId: user.id, name: storyMemberName(user), username: user.username, image: user.image };
}

const writerSelect = { id: true, displayName: true, name: true, username: true, image: true } as const;

/**
 * Statuses a writer sees on a board. REJECTED and ARCHIVED stay out of the way
 * by default — they are kept for the record, not for the working surface.
 */
const workingStatuses: StoryStatus[] = ["DRAFT", "PROPOSED", "CANON"];

export async function listStoryArcs() {
  const arcs = await db.storyArc.findMany({
    where: { status: { in: workingStatuses } },
    include: {
      creator: { select: writerSelect },
      _count: { select: { nodes: { where: { status: { in: workingStatuses } } } } },
    },
    orderBy: [{ isMainline: "desc" }, { position: "asc" }, { createdAt: "asc" }],
  });

  const canonCounts = await db.storyNode.groupBy({
    by: ["arcId"],
    where: { status: "CANON" },
    _count: { _all: true },
  });
  const canonByArc = new Map(canonCounts.map((row) => [row.arcId, row._count._all]));

  return arcs.map((arc) => ({
    id: arc.id,
    slug: arc.slug,
    title: arc.title,
    summary: arc.summary,
    isMainline: arc.isMainline,
    status: arc.status,
    author: storyMemberName(arc.creator),
    nodeCount: arc._count.nodes,
    canonNodeCount: canonByArc.get(arc.id) ?? 0,
    updatedAt: arc.updatedAt,
  }));
}

export async function getStoryBoard(slug: string): Promise<StoryBoard | null> {
  const arc = await db.storyArc.findUnique({
    where: { slug },
    include: { creator: { select: writerSelect }, region: { select: { id: true, slug: true, title: true } } },
  });
  if (!arc) return null;

  const now = new Date();
  const [nodes, edges, presence, libraryEntries] = await Promise.all([
    db.storyNode.findMany({
      where: { arcId: arc.id, status: { in: workingStatuses } },
      include: {
        creator: { select: writerSelect },
        lockedBy: { select: writerSelect },
        speaker: { select: { id: true, slug: true, title: true } },
        continuesIn: { select: { id: true, slug: true, title: true } },
        entryLinks: { include: { entry: { select: { id: true, slug: true, title: true, kind: true } } } },
        comments: { where: { resolvedAt: null }, include: { author: { select: writerSelect } }, orderBy: { createdAt: "asc" } },
      },
      orderBy: { createdAt: "asc" },
    }),
    db.storyEdge.findMany({
      where: { arcId: arc.id, status: { in: workingStatuses } },
      orderBy: [{ fromNodeId: "asc" }, { position: "asc" }],
    }),
    db.storyPresence.findMany({
      where: { arcId: arc.id, lastSeenAt: { gt: new Date(now.getTime() - storyPresenceTtlMs) } },
      include: { user: { select: writerSelect } },
      orderBy: { lastSeenAt: "desc" },
    }),
    db.storyEntry.findMany({
      where: { status: { in: workingStatuses } },
      select: { id: true, slug: true, title: true, kind: true, status: true },
      orderBy: [{ kind: "asc" }, { title: "asc" }],
    }),
  ]);

  const boardNodes: StoryBoardNode[] = nodes.map((node) => ({
    id: node.id,
    key: node.key,
    kind: node.kind,
    title: node.title,
    summary: node.summary,
    body: node.body,
    status: node.status,
    speaker: node.speaker,
    endingKind: node.endingKind,
    completion: node.completion,
    effects: node.effects,
    rewards: node.rewards,
    continuesIn: node.continuesIn,
    canvasX: node.canvasX,
    canvasY: node.canvasY,
    version: node.version,
    author: storyMemberName(node.creator),
    updatedAt: node.updatedAt,
    commentCount: node.comments.length,
    references: node.entryLinks.map((link) => link.entry),
    comments: node.comments.map((comment) => ({ id: comment.id, body: comment.body, author: storyMemberName(comment.author), createdAt: comment.createdAt })),
    // An expired lock is no lock. Reading it as live would leave a node frozen
    // by whoever last closed their laptop on it.
    lockedBy: node.lockedBy && node.lockExpiresAt && node.lockExpiresAt > now ? toWriter(node.lockedBy) : null,
  }));

  const byId = new Map(boardNodes.map((node) => [node.id, node]));
  const graphNodes: StoryGraphNode[] = boardNodes.map((node) => ({ key: node.key, kind: node.kind, title: node.title }));
  const graphEdges: StoryGraphEdge[] = edges.flatMap((edge) => {
    const from = byId.get(edge.fromNodeId);
    const to = byId.get(edge.toNodeId);
    return from && to ? [{ fromKey: from.key, toKey: to.key, label: edge.label, hasConsequence: edge.effects.length > 0 }] : [];
  });

  return {
    arc: {
      id: arc.id,
      slug: arc.slug,
      title: arc.title,
      summary: arc.summary,
      hook: arc.hook,
      region: arc.region,
      isMainline: arc.isMainline,
      status: arc.status,
      author: storyMemberName(arc.creator),
    },
    nodes: boardNodes,
    edges: edges.map((edge) => ({
      id: edge.id,
      key: edge.key,
      fromNodeId: edge.fromNodeId,
      toNodeId: edge.toNodeId,
      label: edge.label,
      condition: edge.condition,
      effects: edge.effects,
      position: edge.position,
      status: edge.status,
    })),
    libraryEntries,
    entryNodeKeys: findStoryEntryNodeKeys(graphNodes, graphEdges),
    problems: analyzeStoryGraph(graphNodes, graphEdges),
    present: presence
      .filter((row) => isStoryPresenceFresh(row.lastSeenAt, now))
      .map((row) => ({ ...toWriter(row.user), nodeId: row.nodeId })),
  };
}

/**
 * The light arc list the editors offer in pickers — "continues in", branch
 * targets across boards — where the full board projection would be waste.
 */
export async function listStoryArcRefs() {
  return db.storyArc.findMany({
    where: { status: { in: workingStatuses } },
    select: { id: true, slug: true, title: true, isMainline: true },
    orderBy: [{ isMainline: "desc" }, { position: "asc" }, { createdAt: "asc" }],
  });
}

export async function listStoryEntries(options: { kind?: StoryEntryKind; search?: string } = {}) {
  const search = options.search?.trim();
  const entries = await db.storyEntry.findMany({
    where: {
      status: { in: workingStatuses },
      ...(options.kind ? { kind: options.kind } : {}),
      ...(search ? { OR: [{ title: { contains: search, mode: "insensitive" } }, { summary: { contains: search, mode: "insensitive" } }, { body: { contains: search, mode: "insensitive" } }] } : {}),
    },
    include: {
      creator: { select: writerSelect },
      _count: { select: { nodeLinks: { where: { node: { status: { in: workingStatuses } } } } } },
    },
    orderBy: [{ kind: "asc" }, { title: "asc" }],
  });

  return entries.map((entry) => ({
    id: entry.id,
    kind: entry.kind,
    slug: entry.slug,
    title: entry.title,
    summary: entry.summary,
    status: entry.status,
    author: storyMemberName(entry.creator),
    appearanceCount: entry._count.nodeLinks,
    updatedAt: entry.updatedAt,
  }));
}

export async function getStoryEntry(slug: string) {
  const entry = await db.storyEntry.findUnique({
    where: { slug },
    include: {
      creator: { select: writerSelect },
      editor: { select: writerSelect },
      lockedBy: { select: writerSelect },
      nodeLinks: {
        include: { node: { select: { id: true, key: true, title: true, status: true, arc: { select: { slug: true, title: true } } } } },
        orderBy: { createdAt: "asc" },
      },
      // The derived side of the connection law: a node naming this entry as
      // its speaker shows up here automatically, never hand-maintained.
      speakerOf: {
        where: { status: { in: workingStatuses } },
        select: { id: true, key: true, title: true, status: true, arc: { select: { slug: true, title: true } } },
        orderBy: { createdAt: "asc" },
      },
      comments: { include: { author: { select: writerSelect } }, orderBy: { createdAt: "asc" } },
    },
  });
  if (!entry) return null;

  const now = new Date();
  const referenced = entry.nodeLinks.map((link) => ({ ...link.node, via: "referenced" as const }));
  const speaks = entry.speakerOf.map((node) => ({ ...node, via: "speaks" as const }));
  const seen = new Set(referenced.map((node) => node.id));

  return {
    id: entry.id,
    kind: entry.kind,
    slug: entry.slug,
    title: entry.title,
    summary: entry.summary,
    body: entry.body,
    meta: (entry.meta as Record<string, unknown> | null) ?? null,
    status: entry.status,
    version: entry.version,
    author: storyMemberName(entry.creator),
    lastEditor: entry.editor ? storyMemberName(entry.editor) : null,
    updatedAt: entry.updatedAt,
    lockedBy: entry.lockedBy && entry.lockExpiresAt && entry.lockExpiresAt > now ? toWriter(entry.lockedBy) : null,
    appearances: [...referenced, ...speaks.filter((node) => !seen.has(node.id))],
    comments: entry.comments.map((comment) => ({
      id: comment.id,
      body: comment.body,
      author: storyMemberName(comment.author),
      createdAt: comment.createdAt,
      resolvedAt: comment.resolvedAt,
    })),
  };
}

/**
 * The needs-work dashboard: unanswered corners of the world, found by scanning
 * rather than by anyone maintaining a to-do list. Null meta, open questions,
 * and wiki-links pointing at slugs nobody has written yet — all of which are
 * normal states of a growing world, surfaced instead of flagged as errors.
 */
export async function getStoryNeedsWork() {
  const [entries, arcs] = await Promise.all([
    db.storyEntry.findMany({
      where: { status: { in: workingStatuses } },
      select: { slug: true, title: true, kind: true, body: true, meta: true },
      orderBy: [{ kind: "asc" }, { title: "asc" }],
    }),
    db.storyArc.findMany({ where: { status: { in: workingStatuses } }, select: { slug: true } }),
  ]);

  const known = new Set([...entries.map((entry) => entry.slug), ...arcs.map((arc) => arc.slug)]);
  const unresolvedLinks: Array<{ slug: string; title: string; target: string }> = [];
  const openQuestions: Array<{ slug: string; title: string; question: string }> = [];
  const missingMeta: Array<{ slug: string; title: string; kind: StoryEntryKind }> = [];
  /** Slug-typed meta fields pointing at things nobody has written — the
   *  "pick this up later" markers. This is how a character's involvement in a
   *  future arc stays in view until somebody opens that arc. */
  const planned: Array<{ slug: string; title: string; field: string; target: string }> = [];

  const slugOf = (value: unknown): string | null => (typeof value === "string" && value.trim() ? value.trim() : null);
  const rows = (value: unknown): Array<Record<string, unknown>> =>
    Array.isArray(value) ? value.filter((row): row is Record<string, unknown> => typeof row === "object" && row !== null) : [];

  for (const entry of entries) {
    for (const match of (entry.body ?? "").matchAll(/\[\[([a-z0-9-]+)\]\]/g)) {
      if (!known.has(match[1])) unresolvedLinks.push({ slug: entry.slug, title: entry.title, target: match[1] });
    }
    const meta = entry.meta as Record<string, unknown> | null;
    if (meta === null) {
      // THEME and RULE deliberately have no module yet; their null is silence,
      // not an unanswered question.
      if (entry.kind !== "THEME" && entry.kind !== "RULE") missingMeta.push({ slug: entry.slug, title: entry.title, kind: entry.kind });
      continue;
    }
    if (Array.isArray(meta.openQuestions)) {
      for (const question of meta.openQuestions) {
        if (typeof question === "string" && question.trim()) openQuestions.push({ slug: entry.slug, title: entry.title, question });
      }
    }

    const check = (field: string, target: unknown) => {
      const slug = slugOf(target);
      if (slug && !known.has(slug)) planned.push({ slug: entry.slug, title: entry.title, field, target: slug });
    };
    if (entry.kind === "CHARACTER") {
      check("home", meta.home);
      for (const row of rows(meta.factions)) check("faction", row.faction);
      for (const row of rows(meta.relationships)) check("relationship", row.character);
      for (const row of rows(meta.involvement)) check("involvement", row.arc);
    }
    if (entry.kind === "REGION") {
      check("parent", meta.parent);
      for (const row of rows(meta.control)) check("control", row.faction);
      for (const row of rows(meta.connections)) check("connection", row.to);
    }
  }

  return { unresolvedLinks, openQuestions, missingMeta, planned, total: unresolvedLinks.length + openQuestions.length + missingMeta.length + planned.length };
}

/** Everything waiting on a reviewer, newest first. */
export async function getStoryReviewQueue() {
  const [arcs, nodes, edges, entries] = await Promise.all([
    db.storyArc.findMany({ where: { status: "PROPOSED" }, include: { creator: { select: writerSelect } }, orderBy: { createdAt: "asc" } }),
    db.storyNode.findMany({ where: { status: "PROPOSED" }, include: { creator: { select: writerSelect }, arc: { select: { slug: true, title: true } } }, orderBy: { createdAt: "asc" } }),
    db.storyEdge.findMany({ where: { status: "PROPOSED" }, include: { creator: { select: writerSelect }, fromNode: { select: { title: true } }, toNode: { select: { title: true } }, arc: { select: { slug: true, title: true } } }, orderBy: { createdAt: "asc" } }),
    db.storyEntry.findMany({ where: { status: "PROPOSED" }, include: { creator: { select: writerSelect } }, orderBy: { createdAt: "asc" } }),
  ]);

  return {
    arcs: arcs.map((arc) => ({ id: arc.id, slug: arc.slug, title: arc.title, summary: arc.summary, author: storyMemberName(arc.creator), createdAt: arc.createdAt })),
    nodes: nodes.map((node) => ({ id: node.id, key: node.key, title: node.title, summary: node.summary, kind: node.kind, arc: node.arc, author: storyMemberName(node.creator), createdAt: node.createdAt })),
    edges: edges.map((edge) => ({ id: edge.id, label: edge.label, from: edge.fromNode.title, to: edge.toNode.title, arc: edge.arc, author: storyMemberName(edge.creator), createdAt: edge.createdAt })),
    entries: entries.map((entry) => ({ id: entry.id, slug: entry.slug, kind: entry.kind, title: entry.title, summary: entry.summary, author: storyMemberName(entry.creator), createdAt: entry.createdAt })),
    total: arcs.length + nodes.length + edges.length + entries.length,
  };
}

/**
 * The audit log. With the approval ladder gone this is the codex's whole
 * safety mechanism: every change, who made it, and what it did, color-coded
 * on the landing page so nothing happens quietly. MOVED is excluded — card
 * drags are layout, and drag spam would bury the changes that matter.
 */
export async function getStoryActivity(limit = 30, arcId?: string) {
  const revisions = await db.storyRevision.findMany({
    where: { ...(arcId ? { arcId } : {}), action: { not: "MOVED" } },
    include: { actor: { select: writerSelect } },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: limit,
  });

  return revisions.map((revision) => ({
    id: revision.id,
    entityType: revision.entityType,
    entityId: revision.entityId,
    action: revision.action,
    /** For STATUS_CHANGED rows: the status the entity landed on. */
    statusTo: typeof revision.after === "object" && revision.after !== null && "status" in revision.after ? String((revision.after as { status: unknown }).status) : null,
    summary: revision.summary,
    actor: storyMemberName(revision.actor),
    createdAt: revision.createdAt,
  }));
}

/**
 * The newest change in the codex. The live-sync stream compares this between
 * ticks, so it must stay a single indexed row read rather than a scan.
 */
export async function getStoryCursor() {
  const newest = await db.storyRevision.findFirst({ orderBy: [{ createdAt: "desc" }, { id: "desc" }], select: { id: true, createdAt: true } });
  return newest ? `${newest.createdAt.getTime()}:${newest.id}` : "";
}
