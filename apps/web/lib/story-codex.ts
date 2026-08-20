import "@/lib/environment";
import { getPrismaClient } from "@habitat/db/client";
import {
  analyzeStoryGraph,
  findStoryEntryNodeKeys,
  isStoryPresenceFresh,
  storyPlaceAncestry,
  storyPlaceDescendants,
  storyPresenceTtlMs,
  type StoryEntryKind,
  type StoryGraphEdge,
  type StoryGraphNode,
  type StoryEndingKind,
  type StoryGraphProblem,
  type StoryNodeKind,
  type StoryPlaceLink,
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
  /** Edges carry no version column, so the editor keys its fields on this to
   *  pick up another writer's save on refresh instead of silently holding —
   *  and later re-submitting — pre-refresh values. */
  updatedAt: Date;
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
    /** Non-null only while an admin's freeze stands. `by` decays to null if
     *  that admin's account is later deleted; the freeze itself does not. */
    locked: { at: Date; by: string | null } | null;
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
    include: { creator: { select: writerSelect }, lockedBy: { select: writerSelect }, region: { select: { id: true, slug: true, title: true } } },
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
      // Read off the timestamp, never off the relation: an admin's account can
      // be deleted (the FK nulls the locker) and the freeze must survive it.
      locked: arc.lockedAt ? { at: arc.lockedAt, by: arc.lockedBy ? storyMemberName(arc.lockedBy) : null } : null,
    },
    nodes: boardNodes,
    // Edges whose endpoint was withheld (archived/rejected node) are withheld
    // too, matching the export. Shipping them made the reader offer a choice
    // whose target is not in the payload — a "Continue →" into nothing.
    edges: edges.filter((edge) => byId.has(edge.fromNodeId) && byId.has(edge.toNodeId)).map((edge) => ({
      id: edge.id,
      key: edge.key,
      fromNodeId: edge.fromNodeId,
      toNodeId: edge.toNodeId,
      label: edge.label,
      condition: edge.condition,
      effects: edge.effects,
      position: edge.position,
      status: edge.status,
      updatedAt: edge.updatedAt,
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
      _count: { select: { nodeLinks: { where: { node: { status: { in: workingStatuses } } } }, comments: true } },
    },
    orderBy: [{ kind: "asc" }, { title: "asc" }],
  });

  return entries.map((entry) => ({
    id: entry.id,
    kind: entry.kind,
    slug: entry.slug,
    title: entry.title,
    summary: entry.summary,
    meta: (entry.meta as Record<string, unknown> | null) ?? null,
    status: entry.status,
    author: storyMemberName(entry.creator),
    appearanceCount: entry._count.nodeLinks,
    commentCount: entry._count.comments,
    updatedAt: entry.updatedAt,
  }));
}

export async function getStoryEntry(slug: string) {
  const [entry, possibleConnections] = await Promise.all([db.storyEntry.findUnique({
    where: { slug },
    include: {
      creator: { select: writerSelect },
      editor: { select: writerSelect },
      lockedBy: { select: writerSelect },
      nodeLinks: {
        // Filtered like speakerOf below and like every count elsewhere: a
        // rejected or archived scene is not an appearance. Unfiltered, a dead
        // reference also poisoned the dedupe set and could suppress a live
        // speaker row for the same node.
        where: { node: { status: { in: workingStatuses } } },
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
  }), db.storyEntry.findMany({
    where: { slug: { not: slug }, status: { in: workingStatuses } },
    select: { id: true, slug: true, title: true, kind: true, meta: true },
    orderBy: [{ kind: "asc" }, { title: "asc" }],
  })]);
  if (!entry) return null;

  const now = new Date();
  const referenced = entry.nodeLinks.map((link) => ({ ...link.node, via: "referenced" as const }));
  const speaks = entry.speakerOf.map((node) => ({ ...node, via: "speaks" as const }));
  const seen = new Set(referenced.map((node) => node.id));
  const connections: Array<{ slug: string; title: string; kind: StoryEntryKind; relation: string }> = [];
  const rows = (value: unknown): Array<Record<string, unknown>> => Array.isArray(value)
    ? value.filter((row): row is Record<string, unknown> => typeof row === "object" && row !== null)
    : [];
  const referencesSlug = (value: unknown) => typeof value === "string" && value === slug;

  for (const candidate of possibleConnections) {
    const meta = candidate.meta as Record<string, unknown> | null;
    if (!meta) continue;
    const add = (relation: string) => {
      if (!connections.some((connection) => connection.slug === candidate.slug && connection.relation === relation)) {
        connections.push({ slug: candidate.slug, title: candidate.title, kind: candidate.kind, relation });
      }
    };
    if (referencesSlug(meta.home)) add("calls this home");
    if (referencesSlug(meta.seat)) add("is based here");
    if (referencesSlug(meta.parent)) add(candidate.kind === "SYSTEM" ? "is a subsystem of this" : candidate.kind === "THREAD" ? "grew out of this thread" : "belongs inside this region");
    if (referencesSlug(meta.origin)) add("originates here");
    if (Array.isArray(meta.leaders) && meta.leaders.some(referencesSlug)) add("is led by this character");
    if (Array.isArray(meta.biomes) && meta.biomes.some(referencesSlug)) add("lives in this region");
    if (Array.isArray(meta.where) && meta.where.some(referencesSlug)) add("happened here");
    if (Array.isArray(meta.involved) && meta.involved.some(referencesSlug)) add("involved them in this event");
    if (rows(meta.factions).some((row) => referencesSlug(row.faction))) add("is a member of this faction");
    if (rows(meta.relationships).some((row) => referencesSlug(row.character))) add("has a character relationship");
    if (rows(meta.relations).some((row) => referencesSlug(row.faction))) add("has a faction relationship");
    if (rows(meta.control).some((row) => referencesSlug(row.faction))) add("is controlled or influenced by this faction");
    if (rows(meta.connections).some((row) => referencesSlug(row.to))) add("connects to this region");

    // The narrative-development room's relationships, read back the same way:
    // a thread or mission naming this entry shows up on this entry's dossier.
    const inThread = candidate.kind === "THREAD";
    const inMission = candidate.kind === "COMPANION_MISSION";
    if (inThread || inMission) {
      const names = (value: unknown) => Array.isArray(value) && value.some(referencesSlug);
      // One row per candidate, not one per field: a companion is necessarily
      // also a character, and a mission's companion is also in its cast, so
      // the most specific relation wins instead of the same link twice.
      if (names(meta.companions)) add("names them as a companion in this thread");
      else if (referencesSlug(meta.companion)) add("belongs to their companion arc");
      else if (names(meta.characters)) add(inThread ? "discusses this character in a story thread" : "features them in a companion mission");
      if (names(meta.locations)) add(inThread ? "is set here, per this story thread" : "takes place here");
      if (names(meta.bosses)) add("proposes them as a boss encounter");
      if (names(meta.factions)) add(inThread ? "involves this faction in a story thread" : "involves this faction");
      if (names(meta.threads)) add("is advanced by this companion mission");
      if (names(meta.companionMissions)) add("is part of this story thread");
    }
  }

  // The world hierarchy — region > place > destination — and the quests that
  // begin somewhere in it. An arc records its pickup place, but nothing ever
  // read that back the other way, so a place could be the door into a quest
  // and say nothing about it.
  let placeAncestry: Array<{ slug: string; title: string }> = [];
  let arcsHere: Array<{ slug: string; title: string; isMainline: boolean; hook: string | null; where: { slug: string; title: string } | null }> = [];

  if (entry.kind === "REGION") {
    const places = possibleConnections.filter((candidate) => candidate.kind === "REGION");
    const parentOf = (meta: unknown) => {
      const value = (meta as Record<string, unknown> | null)?.parent;
      return typeof value === "string" && value.trim() ? value.trim() : null;
    };
    const links: StoryPlaceLink[] = [
      { slug: entry.slug, parent: parentOf(entry.meta) },
      ...places.map((place) => ({ slug: place.slug, parent: parentOf(place.meta) })),
    ];
    const titleOf = new Map(places.map((place) => [place.slug, place.title]));

    // Nearest container first from the helper; the breadcrumb reads outermost
    // first, the way an address does.
    placeAncestry = storyPlaceAncestry(entry.slug, links)
      .map((ancestor) => ({ slug: ancestor, title: titleOf.get(ancestor) ?? ancestor }))
      .reverse();

    // A quest at the grocery store is also a quest in Shattermarket, so the
    // rollup reaches down the whole tree and says where each one actually is.
    const inside = storyPlaceDescendants(entry.slug, links);
    const idOf = new Map(places.map((place) => [place.slug, place.id]));
    const hereIds = [entry.id, ...inside.flatMap((child) => (idOf.has(child) ? [idOf.get(child) as string] : []))];
    const arcs = await db.storyArc.findMany({
      where: { status: { in: workingStatuses }, regionEntryId: { in: hereIds } },
      select: { slug: true, title: true, isMainline: true, hook: true, regionEntryId: true },
      orderBy: [{ isMainline: "desc" }, { title: "asc" }],
    });
    const placeById = new Map(places.map((place) => [place.id, { slug: place.slug, title: place.title }]));
    arcsHere = arcs.map((arc) => ({
      slug: arc.slug,
      title: arc.title,
      isMainline: arc.isMainline,
      hook: arc.hook,
      where: arc.regionEntryId && arc.regionEntryId !== entry.id ? placeById.get(arc.regionEntryId) ?? null : null,
    }));
  }

  return {
    placeAncestry,
    arcsHere,
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
    connections,
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
 * The promises ledger: every FLAG, where the story plants it and where
 * the story answers it, derived entirely by scanning effects and conditions
 * for the canonical slugs. Nobody maintains this list — that is the point of
 * flags having exactly one name each. A thread that is planted but never
 * checked is a promise still waiting for its payoff; one that is checked but
 * never planted is a payoff nothing sets up.
 */
export async function getStoryPromises() {
  const [flags, nodes, edges] = await Promise.all([
    db.storyEntry.findMany({
      where: { kind: "FLAG", status: { in: workingStatuses } },
      select: { id: true, slug: true, title: true, summary: true },
      orderBy: { title: "asc" },
    }),
    db.storyNode.findMany({
      where: { status: { in: workingStatuses } },
      select: { id: true, key: true, title: true, effects: true, arc: { select: { slug: true, title: true } } },
    }),
    db.storyEdge.findMany({
      where: { status: { in: workingStatuses } },
      select: { id: true, label: true, condition: true, effects: true, fromNodeId: true, fromNode: { select: { title: true } }, arc: { select: { slug: true, title: true } } },
    }),
  ]);

  // Word-boundary-ish match so one slug never matches inside a longer one.
  const touches = (text: string | null, slug: string) =>
    text !== null && new RegExp(`(^|[^a-z0-9-])${slug}([^a-z0-9-]|$)`).test(text);

  type ThreadSite = { label: string; detail: string; arcSlug: string; arcTitle: string; nodeId: string };

  const threads = flags.map((flag) => {
    const setAt: ThreadSite[] = [
      ...nodes
        .filter((node) => node.effects.some((line) => touches(line, flag.slug)))
        .map((node) => ({ label: node.title, detail: "scene effect", arcSlug: node.arc.slug, arcTitle: node.arc.title, nodeId: node.id })),
      ...edges
        .filter((edge) => edge.effects.some((line) => touches(line, flag.slug)))
        .map((edge) => ({ label: edge.label ?? "Continue", detail: `choice out of "${edge.fromNode.title}"`, arcSlug: edge.arc.slug, arcTitle: edge.arc.title, nodeId: edge.fromNodeId })),
    ];
    const checkedAt: ThreadSite[] = edges
      .filter((edge) => touches(edge.condition, flag.slug))
      .map((edge) => ({ label: edge.label ?? "Continue", detail: `condition on a choice out of "${edge.fromNode.title}"`, arcSlug: edge.arc.slug, arcTitle: edge.arc.title, nodeId: edge.fromNodeId }));

    const state: "planted" | "unset" | "wired" | "dormant" =
      setAt.length > 0 && checkedAt.length > 0 ? "wired" : setAt.length > 0 ? "planted" : checkedAt.length > 0 ? "unset" : "dormant";

    return { slug: flag.slug, title: flag.title, summary: flag.summary, state, setAt, checkedAt };
  });

  const order: Record<string, number> = { planted: 0, unset: 1, dormant: 2, wired: 3 };
  threads.sort((left, right) => order[left.state] - order[right.state] || left.title.localeCompare(right.title));

  return {
    threads,
    planted: threads.filter((thread) => thread.state === "planted").length,
    unset: threads.filter((thread) => thread.state === "unset").length,
    wired: threads.filter((thread) => thread.state === "wired").length,
    dormant: threads.filter((thread) => thread.state === "dormant").length,
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
      select: {
        id: true,
        slug: true,
        title: true,
        kind: true,
        summary: true,
        body: true,
        meta: true,
        _count: {
          select: {
            nodeLinks: { where: { node: { status: { in: workingStatuses } } } },
            speakerOf: { where: { status: { in: workingStatuses } } },
          },
        },
      },
      orderBy: [{ kind: "asc" }, { title: "asc" }],
    }),
    db.storyArc.findMany({ where: { status: { in: workingStatuses } }, select: { slug: true, regionEntryId: true } }),
  ]);

  const known = new Set([...entries.map((entry) => entry.slug), ...arcs.map((arc) => arc.slug)]);
  const arcRegionIds = new Set(arcs.flatMap((arc) => (arc.regionEntryId ? [arc.regionEntryId] : [])));
  const unresolvedLinks: Array<{ slug: string; title: string; target: string }> = [];
  const openQuestions: Array<{ slug: string; title: string; question: string }> = [];
  const missingMeta: Array<{ slug: string; title: string; kind: StoryEntryKind }> = [];
  /** Slug-typed meta fields pointing at things nobody has written — the
   *  "pick this up later" markers. This is how a character's involvement in a
   *  future arc stays in view until somebody opens that arc. */
  const planned: Array<{ slug: string; title: string; field: string; target: string }> = [];
  /** Entries with no connection in either direction — nothing links to them,
   *  they link to nothing. The one state where losing sight of an entry is
   *  actually possible, so it gets its own bucket. */
  const unconnected: Array<{ slug: string; title: string; kind: StoryEntryKind }> = [];

  const slugOf = (value: unknown): string | null => (typeof value === "string" && value.trim() ? value.trim() : null);
  const rows = (value: unknown): Array<Record<string, unknown>> =>
    Array.isArray(value) ? value.filter((row): row is Record<string, unknown> => typeof row === "object" && row !== null) : [];

  /** Every slug an entry's own text and sheet reach for, resolved or not. */
  const outboundOf = (entry: (typeof entries)[number]): string[] => {
    const targets: string[] = [];
    for (const match of `${entry.summary ?? ""}\n${entry.body ?? ""}`.matchAll(/\[\[([a-z0-9-]+)\]\]/g)) targets.push(match[1]);
    const meta = entry.meta as Record<string, unknown> | null;
    if (meta) {
      for (const value of [meta.home, meta.seat, meta.parent, meta.origin]) { const slug = slugOf(value); if (slug) targets.push(slug); }
      for (const list of [meta.leaders, meta.biomes, meta.where, meta.involved]) for (const value of Array.isArray(list) ? list : []) { const slug = slugOf(value); if (slug) targets.push(slug); }
      for (const row of rows(meta.factions)) { const slug = slugOf(row.faction); if (slug) targets.push(slug); }
      for (const row of rows(meta.relationships)) { const slug = slugOf(row.character); if (slug) targets.push(slug); }
      for (const row of rows(meta.relations)) { const slug = slugOf(row.faction); if (slug) targets.push(slug); }
      for (const row of rows(meta.control)) { const slug = slugOf(row.faction); if (slug) targets.push(slug); }
      for (const row of rows(meta.connections)) { const slug = slugOf(row.to); if (slug) targets.push(slug); }
      for (const row of rows(meta.involvement)) { const slug = slugOf(row.arc); if (slug) targets.push(slug); }
    }
    return targets;
  };

  // First pass: who points at whom. An entry is reachable if anything else in
  // the world names it — prose link, sheet field, scene reference, speaker
  // casting, or an arc picking it as its region.
  const inbound = new Set<string>();
  const outbound = new Map<string, string[]>();
  for (const entry of entries) {
    const targets = outboundOf(entry);
    outbound.set(entry.slug, targets);
    for (const target of targets) if (target !== entry.slug) inbound.add(target);
  }

  for (const entry of entries) {
    for (const target of outbound.get(entry.slug) ?? []) {
      if (!known.has(target)) {
        // Body links get the classic unresolved-link line; sheet fields are
        // reported through `planned` below with their field names attached.
        if (`${entry.summary ?? ""}\n${entry.body ?? ""}`.includes(`[[${target}]]`)) unresolvedLinks.push({ slug: entry.slug, title: entry.title, target });
      }
    }

    const meta = entry.meta as Record<string, unknown> | null;
    const hasInbound = inbound.has(entry.slug) || entry._count.nodeLinks > 0 || entry._count.speakerOf > 0 || arcRegionIds.has(entry.id);
    const hasOutbound = (outbound.get(entry.slug) ?? []).some((target) => known.has(target) && target !== entry.slug);
    // THEME and RULE are ambient law, and FLAG lives on the threads ledger —
    // being unreferenced is not a problem for them.
    if (!hasInbound && !hasOutbound && entry.kind !== "THEME" && entry.kind !== "RULE" && entry.kind !== "FLAG") {
      unconnected.push({ slug: entry.slug, title: entry.title, kind: entry.kind });
    }

    if (meta === null) {
      // THEME and RULE deliberately have no module, and a FLAG is complete the
      // moment it exists — their null is silence, not an unanswered question.
      if (entry.kind !== "THEME" && entry.kind !== "RULE" && entry.kind !== "FLAG") missingMeta.push({ slug: entry.slug, title: entry.title, kind: entry.kind });
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
    if (entry.kind === "FACTION") {
      check("seat", meta.seat);
      for (const leader of Array.isArray(meta.leaders) ? meta.leaders : []) check("leader", leader);
      for (const row of rows(meta.relations)) check("relation", row.faction);
    }
    if (entry.kind === "EVENT") {
      for (const place of Array.isArray(meta.where) ? meta.where : []) check("where", place);
      for (const participant of Array.isArray(meta.involved) ? meta.involved : []) check("involved", participant);
    }
  }

  return {
    unresolvedLinks,
    openQuestions,
    missingMeta,
    planned,
    unconnected,
    total: unresolvedLinks.length + openQuestions.length + missingMeta.length + planned.length + unconnected.length,
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
