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
  fromNodeId: string;
  toNodeId: string;
  label: string | null;
  condition: string | null;
  position: number;
  status: StoryStatus;
};

export type StoryBoard = {
  arc: {
    id: string;
    slug: string;
    title: string;
    summary: string | null;
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
    include: { creator: { select: writerSelect } },
  });
  if (!arc) return null;

  const now = new Date();
  const [nodes, edges, presence, libraryEntries] = await Promise.all([
    db.storyNode.findMany({
      where: { arcId: arc.id, status: { in: workingStatuses } },
      include: {
        creator: { select: writerSelect },
        lockedBy: { select: writerSelect },
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
    return from && to ? [{ fromKey: from.key, toKey: to.key, label: edge.label }] : [];
  });

  return {
    arc: {
      id: arc.id,
      slug: arc.slug,
      title: arc.title,
      summary: arc.summary,
      isMainline: arc.isMainline,
      status: arc.status,
      author: storyMemberName(arc.creator),
    },
    nodes: boardNodes,
    edges: edges.map((edge) => ({
      id: edge.id,
      fromNodeId: edge.fromNodeId,
      toNodeId: edge.toNodeId,
      label: edge.label,
      condition: edge.condition,
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
      comments: { include: { author: { select: writerSelect } }, orderBy: { createdAt: "asc" } },
    },
  });
  if (!entry) return null;

  const now = new Date();
  return {
    id: entry.id,
    kind: entry.kind,
    slug: entry.slug,
    title: entry.title,
    summary: entry.summary,
    body: entry.body,
    status: entry.status,
    version: entry.version,
    author: storyMemberName(entry.creator),
    lastEditor: entry.editor ? storyMemberName(entry.editor) : null,
    updatedAt: entry.updatedAt,
    lockedBy: entry.lockedBy && entry.lockExpiresAt && entry.lockExpiresAt > now ? toWriter(entry.lockedBy) : null,
    appearances: entry.nodeLinks.map((link) => link.node),
    comments: entry.comments.map((comment) => ({
      id: comment.id,
      body: comment.body,
      author: storyMemberName(comment.author),
      createdAt: comment.createdAt,
      resolvedAt: comment.resolvedAt,
    })),
  };
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

export async function getStoryActivity(limit = 30, arcId?: string) {
  const revisions = await db.storyRevision.findMany({
    where: arcId ? { arcId } : {},
    include: { actor: { select: writerSelect } },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return revisions.map((revision) => ({
    id: revision.id,
    entityType: revision.entityType,
    entityId: revision.entityId,
    action: revision.action,
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
  const newest = await db.storyRevision.findFirst({ orderBy: { createdAt: "desc" }, select: { id: true, createdAt: true } });
  return newest ? `${newest.createdAt.getTime()}:${newest.id}` : "";
}
