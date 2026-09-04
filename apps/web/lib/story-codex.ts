import "@/lib/environment";
import { getPrismaClient } from "@habitat/db/client";
import { clusterBoards, type AtlasArc, type AtlasCompanion, type AtlasEdge, type AtlasJoin, type AtlasNode, type CampaignAtlas } from "@/lib/campaign-atlas";
import {
  analyzeStoryGraph,
  canonicalStoryEntryRouteSlug,
  findStoryArcEntryNodeKeys,
  groupStoryMissionChains,
  isStoryPresenceFresh,
  persistedStoryEntrySlug,
  storyPlaceAncestry,
  storyPlaceDescendants,
  storyPresenceTtlMs,
  storyEntrySlugAliases,
  type StoryArcCategory,
  type StoryCanonPacket,
  type StoryEntryKind,
  type StoryGraphEdge,
  type StoryGraphNode,
  type StoryEndingKind,
  type StoryGraphProblem,
  type StoryNodeKind,
  type StoryPlaceLink,
  type StoryStatus,
} from "@habitat/shared";
import { canonPacketSchema } from "@/lib/story-meta-schemas";
import { legacyNationTerminologySearchText, nationTerminologyText, nationTerminologyValue } from "@/lib/nation-terminology";

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
  /** The node's spoken lines (export v5), live ones only, in order. */
  lines: StoryBoardLine[];
};

export type StoryBoardLine = {
  id: string;
  /** The frozen export number: `<arc>/<node>/<nn>`. */
  number: number;
  order: number;
  speaker: { id: string; slug: string; title: string } | null;
  speakerRole: string | null;
  listener: { id: string; slug: string; title: string } | null;
  listenerRole: string | null;
  text: string;
  performance: string;
  intensity: number;
  emotion: string[];
  locale: string;
  voiced: boolean;
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
  /** A labelled option out of a CHOICE node that the player speaks aloud. */
  voiced: boolean;
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
    companion: { id: string; slug: string; title: string } | null;
    faction: { id: string; slug: string; title: string } | null;
    isMainline: boolean;
    category: StoryArcCategory;
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
    title: nationTerminologyText(arc.title),
    summary: arc.summary ? nationTerminologyText(arc.summary) : null,
    isMainline: arc.isMainline,
    category: arc.category,
    regionEntryId: arc.regionEntryId,
    companionEntryId: arc.companionEntryId,
    factionEntryId: arc.factionEntryId,
    locked: arc.lockedAt !== null,
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
    include: {
      creator: { select: writerSelect },
      lockedBy: { select: writerSelect },
      region: { select: { id: true, slug: true, title: true } },
      companion: { select: { id: true, slug: true, title: true } },
      faction: { select: { id: true, slug: true, title: true } },
    },
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
        lines: {
          where: { retiredAt: null },
          include: { speaker: { select: { id: true, slug: true, title: true } }, listener: { select: { id: true, slug: true, title: true } } },
          orderBy: [{ order: "asc" }, { number: "asc" }],
        },
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
    title: nationTerminologyText(node.title),
    summary: node.summary ? nationTerminologyText(node.summary) : null,
    body: node.body ? nationTerminologyText(node.body) : null,
    status: node.status,
    speaker: node.speaker ? { ...node.speaker, slug: canonicalStoryEntryRouteSlug(node.speaker.slug), title: nationTerminologyText(node.speaker.title) } : null,
    endingKind: node.endingKind,
    completion: node.completion ? nationTerminologyText(node.completion) : null,
    effects: node.effects.map(nationTerminologyText),
    rewards: node.rewards.map(nationTerminologyText),
    continuesIn: node.continuesIn ? { ...node.continuesIn, title: nationTerminologyText(node.continuesIn.title) } : null,
    canvasX: node.canvasX,
    canvasY: node.canvasY,
    version: node.version,
    author: storyMemberName(node.creator),
    updatedAt: node.updatedAt,
    commentCount: node.comments.length,
    references: node.entryLinks.map((link) => ({ ...link.entry, slug: canonicalStoryEntryRouteSlug(link.entry.slug), title: nationTerminologyText(link.entry.title) })),
    comments: node.comments.map((comment) => ({ id: comment.id, body: nationTerminologyText(comment.body), author: storyMemberName(comment.author), createdAt: comment.createdAt })),
    // An expired lock is no lock. Reading it as live would leave a node frozen
    // by whoever last closed their laptop on it.
    lockedBy: node.lockedBy && node.lockExpiresAt && node.lockExpiresAt > now ? toWriter(node.lockedBy) : null,
    lines: node.lines.map((line) => ({
      id: line.id,
      number: line.number,
      order: line.order,
      speaker: line.speaker ? { ...line.speaker, slug: canonicalStoryEntryRouteSlug(line.speaker.slug), title: nationTerminologyText(line.speaker.title) } : null,
      speakerRole: line.speakerRole ? nationTerminologyText(line.speakerRole) : null,
      listener: line.listener ? { ...line.listener, slug: canonicalStoryEntryRouteSlug(line.listener.slug), title: nationTerminologyText(line.listener.title) } : null,
      listenerRole: line.listenerRole ? nationTerminologyText(line.listenerRole) : null,
      text: nationTerminologyText(line.text),
      performance: nationTerminologyText(line.performance),
      intensity: line.intensity,
      emotion: line.emotion,
      locale: line.locale,
      voiced: line.voiced,
    })),
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
      title: nationTerminologyText(arc.title),
      summary: arc.summary ? nationTerminologyText(arc.summary) : null,
      hook: arc.hook ? nationTerminologyText(arc.hook) : null,
      region: arc.region ? { ...arc.region, slug: canonicalStoryEntryRouteSlug(arc.region.slug), title: nationTerminologyText(arc.region.title) } : null,
      companion: arc.companion ? { ...arc.companion, slug: canonicalStoryEntryRouteSlug(arc.companion.slug), title: nationTerminologyText(arc.companion.title) } : null,
      faction: arc.faction ? { ...arc.faction, slug: canonicalStoryEntryRouteSlug(arc.faction.slug), title: nationTerminologyText(arc.faction.title) } : null,
      isMainline: arc.isMainline,
      category: arc.category,
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
      voiced: edge.voiced,
      fromNodeId: edge.fromNodeId,
      toNodeId: edge.toNodeId,
      label: edge.label ? nationTerminologyText(edge.label) : null,
      condition: edge.condition ? nationTerminologyText(edge.condition) : null,
      effects: edge.effects.map(nationTerminologyText),
      position: edge.position,
      status: edge.status,
      updatedAt: edge.updatedAt,
    })),
    libraryEntries: libraryEntries.map((entry) => ({ ...entry, slug: canonicalStoryEntryRouteSlug(entry.slug), title: nationTerminologyText(entry.title) })),
    entryNodeKeys: findStoryArcEntryNodeKeys(arc.slug, graphNodes, graphEdges),
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
  const searchTerms = search ? [...new Set([search, legacyNationTerminologySearchText(search)])] : [];
  const entries = await db.storyEntry.findMany({
    where: {
      status: { in: workingStatuses },
      ...(options.kind ? { kind: options.kind } : {}),
      ...(searchTerms.length ? { OR: searchTerms.flatMap((term) => [{ title: { contains: term, mode: "insensitive" as const } }, { summary: { contains: term, mode: "insensitive" as const } }, { body: { contains: term, mode: "insensitive" as const } }]) } : {}),
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
    slug: canonicalStoryEntryRouteSlug(entry.slug),
    title: nationTerminologyText(entry.title),
    summary: entry.summary ? nationTerminologyText(entry.summary) : null,
    meta: entry.meta ? nationTerminologyValue(entry.meta) as Record<string, unknown> : null,
    status: entry.status,
    author: storyMemberName(entry.creator),
    appearanceCount: entry._count.nodeLinks,
    commentCount: entry._count.comments,
    updatedAt: entry.updatedAt,
  }));
}

export async function getStoryEntry(slug: string) {
  const storageSlug = persistedStoryEntrySlug(slug);
  const lookupAliases = storyEntrySlugAliases(slug);
  const [entry, possibleConnections] = await Promise.all([db.storyEntry.findFirst({
    where: { slug: { in: lookupAliases } },
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
    orderBy: { slug: "asc" },
  }), db.storyEntry.findMany({
    where: { slug: { notIn: lookupAliases }, status: { in: workingStatuses } },
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
  const referencesSlug = (value: unknown) => typeof value === "string" && persistedStoryEntrySlug(value) === storageSlug;

  for (const candidate of possibleConnections) {
    const meta = candidate.meta as Record<string, unknown> | null;
    if (!meta) continue;
    const add = (relation: string) => {
      if (!connections.some((connection) => connection.slug === candidate.slug && connection.relation === relation)) {
        connections.push({ slug: canonicalStoryEntryRouteSlug(candidate.slug), title: nationTerminologyText(candidate.title), kind: candidate.kind, relation });
      }
    };
    if (referencesSlug(meta.home)) add("calls this home");
    if (referencesSlug(meta.seat)) add("is based here");
    if (referencesSlug(meta.parent)) add(candidate.kind === "SYSTEM" ? "is a subsystem of this" : candidate.kind === "THREAD" ? "grew out of this thread" : candidate.kind === "CREATURE" ? "belongs to this species" : candidate.kind === "FACTION" ? "answers to this power" : "belongs inside this region");
    if (referencesSlug(meta.origin)) add("originates here");
    // A character's race. `species` is slug-or-prose like `home` and `origin`:
    // Amanda's reads "Lizzarnix — half lizard, half phoenix; publicly passes
    // as a lizardwoman", which is the spoiler-tier truth and must stay prose.
    // An exact match against a real race is a link either way, so the race's
    // dossier finally lists the people who are one.
    if (referencesSlug(meta.species)) add("is one of this species");
    // A faction's faith, same slug-or-prose law as species: an exact match
    // against a faith entry puts the power on that faith's own dossier.
    if (referencesSlug(meta.faith)) add("keeps this faith");
    if (Array.isArray(meta.leaders) && meta.leaders.some(referencesSlug)) add("is led by this character");
    if (Array.isArray(meta.biomes) && meta.biomes.some(referencesSlug)) add("lives in this region");
    if (Array.isArray(meta.where) && meta.where.some(referencesSlug)) add("happened here");
    if (Array.isArray(meta.involved) && meta.involved.some(referencesSlug)) add("involved them in this event");
    if (rows(meta.factions).some((row) => referencesSlug(row.faction))) add("is a member of this faction");
    if (rows(meta.relationships).some((row) => referencesSlug(row.character))) add("has a character relationship");
    if (rows(meta.relations).some((row) => referencesSlug(row.faction))) add("has a faction relationship");
    if (rows(meta.control).some((row) => referencesSlug(row.faction))) add("is controlled or influenced by this faction");
    if (rows(meta.connections).some((row) => referencesSlug(row.to))) add("connects to this region");
    // The release gate, read from the other side: a system nothing can ship
    // without should say so on its own page, the way a faction says who
    // leads it. `regionNotes` is deliberately absent — the region dossier
    // already has a purpose-built panel for those, and a connection row
    // would print the same fact twice.
    if (Array.isArray(meta.dependsOn) && meta.dependsOn.some(referencesSlug)) add("cannot ship without this system");

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
      // A mission that has actually been built names the board it became.
      if (referencesSlug(meta.arc)) add("became this mission's canon quest");
    }

    // Canon packets are part of the same connection web as everything else: a
    // packet that names this entry, or is aimed at this place or companion,
    // shows up on this dossier rather than only inside the thread it came
    // from. Read defensively — a malformed row is skipped, never thrown on.
    if (inThread) {
      for (const row of rows(meta.canonPackets)) {
        if (row.status === "woven") continue;
        if (Array.isArray(row.entries) && row.entries.some(referencesSlug)) add("is named in canon material waiting to be woven in");
        if (referencesSlug(row.targetRegion) || referencesSlug(row.targetCompanion) || referencesSlug(row.targetFaction)) add("has canon material waiting to be woven in here");
      }
    }
  }

  // The world hierarchy — region > place > destination — and the quests that
  // begin somewhere in it. An arc records its pickup place, but nothing ever
  // read that back the other way, so a place could be the door into a quest
  // and say nothing about it.
  let placeAncestry: Array<{ slug: string; title: string }> = [];
  let arcsHere: Array<{ slug: string; title: string; isMainline: boolean; category: StoryArcCategory; hook: string | null; where: { slug: string; title: string } | null }> = [];
  /** The companion mirror of `arcsHere`: the quests filed to this character. */
  let companionArcs: Array<{ slug: string; title: string; category: StoryArcCategory; hook: string | null; summary: string | null; locked: boolean }> = [];
  /** The same for a faction, plus the quests its wings fly — `via` names the
   *  wing a rolled-up quest came through, so a major's page never claims
   *  work that belongs to somebody beneath it. */
  let factionArcs: Array<{ slug: string; title: string; category: StoryArcCategory; hook: string | null; summary: string | null; locked: boolean; via: { slug: string; title: string } | null }> = [];

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
      select: { slug: true, title: true, isMainline: true, category: true, hook: true, regionEntryId: true },
      orderBy: [{ isMainline: "desc" }, { title: "asc" }],
    });
    const placeById = new Map(places.map((place) => [place.id, { slug: place.slug, title: place.title }]));
    arcsHere = arcs.map((arc) => ({
      slug: arc.slug,
      title: arc.title,
      isMainline: arc.isMainline,
      category: arc.category,
      hook: arc.hook,
      where: arc.regionEntryId && arc.regionEntryId !== entry.id ? placeById.get(arc.regionEntryId) ?? null : null,
    }));
  }

  // A companion's own quests, read off the arcs rather than maintained on
  // the character — the same derivation the region dossier uses for the
  // quests that begin there.
  if (entry.kind === "CHARACTER") {
    const theirs = await db.storyArc.findMany({
      where: { status: { in: workingStatuses }, companionEntryId: entry.id },
      select: { slug: true, title: true, category: true, hook: true, summary: true, lockedAt: true, position: true },
      orderBy: [{ position: "asc" }, { title: "asc" }],
    });
    companionArcs = theirs.map((arc) => ({ slug: arc.slug, title: arc.title, category: arc.category, hook: arc.hook, summary: arc.summary, locked: arc.lockedAt !== null }));
  }

  // A faction's own quests and the ones its wings fly. The rollup is what
  // makes a major worth opening: the room tracks the majors, so a major's
  // page has to show what is happening beneath it — labelled, never
  // absorbed.
  if (entry.kind === "FACTION") {
    const wings = possibleConnections.filter((candidate) => {
      if (candidate.kind !== "FACTION") return false;
      const parent = (candidate.meta as Record<string, unknown> | null)?.parent;
      return typeof parent === "string" && parent.trim() === entry.slug;
    });
    const bannerIds = new Map<string, { slug: string; title: string } | null>([[entry.id, null]]);
    for (const wing of wings) bannerIds.set(wing.id, { slug: wing.slug, title: wing.title });
    const flown = await db.storyArc.findMany({
      where: { status: { in: workingStatuses }, factionEntryId: { in: [...bannerIds.keys()] } },
      select: { slug: true, title: true, category: true, hook: true, summary: true, lockedAt: true, position: true, factionEntryId: true },
      orderBy: [{ position: "asc" }, { title: "asc" }],
    });
    factionArcs = flown.map((arc) => ({
      slug: arc.slug,
      title: arc.title,
      category: arc.category,
      hook: arc.hook,
      summary: arc.summary,
      locked: arc.lockedAt !== null,
      via: (arc.factionEntryId && bannerIds.get(arc.factionEntryId)) || null,
    }));
  }

  return {
    placeAncestry,
    arcsHere,
    factionArcs,
    companionArcs,
    id: entry.id,
    kind: entry.kind,
    slug: canonicalStoryEntryRouteSlug(entry.slug),
    title: nationTerminologyText(entry.title),
    summary: entry.summary ? nationTerminologyText(entry.summary) : null,
    body: entry.body ? nationTerminologyText(entry.body) : null,
    meta: entry.meta ? nationTerminologyValue(entry.meta) as Record<string, unknown> : null,
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
      body: nationTerminologyText(comment.body),
      author: storyMemberName(comment.author),
      createdAt: comment.createdAt,
      resolvedAt: comment.resolvedAt,
    })),
  };
}

// ---------------------------------------------------------------------------
// Canon: the inbox settled thread material lands in, and the navigator that
// files every board where a reader expects to find it.
// ---------------------------------------------------------------------------

/** A packet with the thread it came out of attached. */
export type StoryCanonPacketRow = StoryCanonPacket & {
  thread: { slug: string; title: string; entryId: string; version: number; author: string };
};

/**
 * How many packets are still waiting, per place in the navigator. The regions,
 * companions, and factions maps are keyed by slug; a `""` key is the general
 * bucket — material for that section which names nobody in particular.
 */
export type StoryCanonPending = {
  campaign: number;
  regions: Record<string, number>;
  companions: Record<string, number>;
  factions: Record<string, number>;
  incursions: number;
  events: number;
  total: number;
};

/**
 * Reads a thread's packets out of its stored meta.
 *
 * Deliberately forgiving: a row that does not validate is skipped, never
 * thrown on. A single malformed packet must not be able to take down the canon
 * workspace, the navigator, and every arc page that renders the sidebar — the
 * audit script is where malformed rows get reported, not the reader's page.
 */
function readCanonPackets(meta: unknown): StoryCanonPacket[] {
  if (typeof meta !== "object" || meta === null || Array.isArray(meta)) return [];
  const rows = (meta as Record<string, unknown>).canonPackets;
  if (!Array.isArray(rows)) return [];
  const packets: StoryCanonPacket[] = [];
  for (const row of rows) {
    const parsed = canonPacketSchema.safeParse(row);
    if (parsed.success) packets.push(nationTerminologyValue(parsed.data) as StoryCanonPacket);
  }
  return packets;
}

/**
 * Everything the development room has pushed toward canon, newest first, with
 * the pending counts the navigator's bubbles read from.
 *
 * Packets live inside their thread's meta, so this is one query over the
 * threads rather than a table scan — and a packet can never outlive the thread
 * that produced it.
 */
export async function getCanonInbox(): Promise<{ packets: StoryCanonPacketRow[]; pending: StoryCanonPending }> {
  const threads = await db.storyEntry.findMany({
    where: { kind: "THREAD", status: { in: workingStatuses } },
    select: { id: true, slug: true, title: true, version: true, meta: true, creator: { select: writerSelect } },
    orderBy: { title: "asc" },
  });

  const packets: StoryCanonPacketRow[] = [];
  for (const thread of threads) {
    const author = storyMemberName(thread.creator);
    for (const packet of readCanonPackets(thread.meta)) {
      packets.push({ ...packet, thread: { slug: canonicalStoryEntryRouteSlug(thread.slug), title: nationTerminologyText(thread.title), entryId: thread.id, version: thread.version, author } });
    }
  }
  // Newest push first: the inbox reads like an inbox.
  packets.sort((left, right) => right.pushedAt.localeCompare(left.pushedAt) || left.title.localeCompare(right.title));

  const pending: StoryCanonPending = { campaign: 0, regions: {}, companions: {}, factions: {}, incursions: 0, events: 0, total: 0 };
  for (const packet of packets) {
    if (packet.status !== "pending") continue;
    pending.total += 1;
    if (packet.targetKind === "campaign") pending.campaign += 1;
    else if (packet.targetKind === "incursions") pending.incursions += 1;
    else if (packet.targetKind === "events") pending.events += 1;
    else if (packet.targetKind === "region" && packet.targetRegion) pending.regions[packet.targetRegion] = (pending.regions[packet.targetRegion] ?? 0) + 1;
    else if (packet.targetKind === "factions") {
      const key = packet.targetFaction ?? "";
      pending.factions[key] = (pending.factions[key] ?? 0) + 1;
    }
    else if (packet.targetKind === "companions") {
      const key = packet.targetCompanion ?? "";
      pending.companions[key] = (pending.companions[key] ?? 0) + 1;
    }
  }

  return { packets, pending };
}

/** One board as the navigator lists it. */
export type CanonNavArc = {
  slug: string;
  title: string;
  category: StoryArcCategory;
  status: StoryStatus;
  locked: boolean;
  nodeCount: number;
  position: number;
};

/** One campaign chapter on the macro flow. Its detailed scene tree stays on
 * the normal arc page; this is only the spine writers use to understand how
 * whole quests branch and come back together. */
export type CampaignFlowArc = {
  slug: string;
  title: string;
  summary: string | null;
  status: StoryStatus;
  locked: boolean;
  nodeCount: number;
  position: number;
};

/** A real cross-board handoff, read from an ENDING's continuesInArcId. */
export type CampaignFlowHandoff = {
  fromArcSlug: string;
  fromEndingTitle: string;
  toArcSlug: string;
};

export type CampaignFlowGraph = { arcs: CampaignFlowArc[]; handoffs: CampaignFlowHandoff[] };

/**
 * The campaign overview is derived from the same structural continuation the
 * game export consumes. No second hand-maintained diagram is allowed to drift
 * away from the quest boards: link an ending to its next arc and the macro
 * flow changes with it.
 */
export async function getCampaignFlow(): Promise<CampaignFlowGraph> {
  const rows = await db.storyArc.findMany({
    where: { category: "MAINLINE", status: { in: workingStatuses } },
    select: {
      slug: true,
      title: true,
      summary: true,
      status: true,
      position: true,
      lockedAt: true,
      _count: { select: { nodes: { where: { status: { in: workingStatuses } } } } },
      nodes: {
        where: { kind: "ENDING", status: { in: workingStatuses }, continuesInArcId: { not: null } },
        select: { title: true, continuesIn: { select: { slug: true, category: true, status: true } } },
        orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      },
    },
    orderBy: [{ position: "asc" }, { createdAt: "asc" }, { title: "asc" }],
  });

  const campaignSlugs = new Set(rows.map((row) => row.slug));
  const arcs: CampaignFlowArc[] = rows.map((row) => ({
    slug: row.slug,
    title: row.title,
    summary: row.summary,
    status: row.status,
    locked: row.lockedAt !== null,
    nodeCount: row._count.nodes,
    position: row.position,
  }));
  const handoffs = rows.flatMap((row) => row.nodes.flatMap((node) => {
    const next = node.continuesIn;
    if (!next || next.category !== "MAINLINE" || !workingStatuses.includes(next.status) || !campaignSlugs.has(next.slug)) return [];
    return [{ fromArcSlug: row.slug, fromEndingTitle: node.title, toArcSlug: next.slug }];
  }));

  return { arcs, handoffs };
}

export type CanonNavRegion = {
  slug: string;
  title: string;
  /** How deep in the place tree, so the sidebar can indent rather than nest. */
  depth: number;
  sideQuests: CanonNavArc[];
  contracts: CanonNavArc[];
  /** Packets waiting here or anywhere inside here. */
  pendingPackets: number;
};

export type CanonNavCompanionStep = {
  order: number | null;
  title: string;
  missionSlug: string;
  /** The board this step became, or null while it is only written down. */
  arc: CanonNavArc | null;
};

export type CanonNavCompanion = {
  slug: string;
  title: string;
  chain: CanonNavCompanionStep[];
  /** Companion quests no mission in the chain claims. */
  looseArcs: CanonNavArc[];
  pendingPackets: number;
};

/** One wing of a major, with whatever it flies. */
export type CanonNavFactionWing = {
  slug: string;
  title: string;
  arcs: CanonNavArc[];
};

export type CanonNavFaction = {
  slug: string;
  title: string;
  /** Quests flown under the major's own banner. */
  ownArcs: CanonNavArc[];
  wings: CanonNavFactionWing[];
  /** Waiting material aimed at this power or anything beneath it. */
  pendingPackets: number;
};

export type StoryCanonNavigator = {
  campaign: CanonNavArc[];
  regions: CanonNavRegion[];
  /** Side quests and contracts nobody has filed to a place yet. */
  unfiled: CanonNavArc[];
  companions: CanonNavCompanion[];
  factions: CanonNavFaction[];
  incursions: CanonNavArc[];
  events: CanonNavArc[];
  pending: StoryCanonPending;
};

/**
 * The articy-style navigator: the whole settled story as one tree — the
 * campaign spine, then the map, then the companions, then the factions, then
 * what comes through and what happens to the world.
 *
 * This runs on every arc page, so it stays five narrow selects and one inbox
 * read. Everything else here is arithmetic over what those returned.
 */
export async function getCanonNavigator(): Promise<StoryCanonNavigator> {
  const [arcs, regionEntries, missions, characters, factionEntries, inbox] = await Promise.all([
    db.storyArc.findMany({
      where: { status: { in: workingStatuses } },
      select: { slug: true, title: true, category: true, status: true, position: true, lockedAt: true, regionEntryId: true, companionEntryId: true, factionEntryId: true, _count: { select: { nodes: { where: { status: { in: workingStatuses } } } } } },
      orderBy: [{ position: "asc" }, { title: "asc" }],
    }),
    db.storyEntry.findMany({
      where: { kind: "REGION", status: { in: workingStatuses } },
      select: { id: true, slug: true, title: true, meta: true },
      orderBy: { title: "asc" },
    }),
    db.storyEntry.findMany({
      where: { kind: "COMPANION_MISSION", status: { in: workingStatuses } },
      select: { slug: true, title: true, meta: true },
      orderBy: { title: "asc" },
    }),
    db.storyEntry.findMany({
      where: { kind: "CHARACTER", status: { in: workingStatuses } },
      select: { id: true, slug: true, title: true },
      orderBy: { title: "asc" },
    }),
    db.storyEntry.findMany({
      where: { kind: "FACTION", status: { in: workingStatuses } },
      select: { id: true, slug: true, title: true, meta: true },
      orderBy: { title: "asc" },
    }),
    getCanonInbox(),
  ]);

  const navArc = (arc: (typeof arcs)[number]): CanonNavArc => ({
    slug: arc.slug,
    title: nationTerminologyText(arc.title),
    category: arc.category,
    status: arc.status,
    locked: arc.lockedAt !== null,
    nodeCount: arc._count.nodes,
    position: arc.position,
  });

  const campaign = arcs.filter((arc) => arc.category === "MAINLINE").map(navArc);
  const incursions = arcs.filter((arc) => arc.category === "INCURSION").map(navArc);
  const events = arcs.filter((arc) => arc.category === "WORLD_EVENT").map(navArc);

  // --- the map ---------------------------------------------------------------
  const parentOf = (meta: unknown) => {
    const value = (meta as Record<string, unknown> | null)?.parent;
    return typeof value === "string" && value.trim() ? value.trim() : null;
  };
  const placeLinks: StoryPlaceLink[] = regionEntries.map((region) => ({ slug: region.slug, parent: parentOf(region.meta) }));
  const knownPlace = new Set(regionEntries.map((region) => region.slug));
  const regionById = new Map(regionEntries.map((region) => [region.id, region]));
  const depthOf = new Map(regionEntries.map((region) => [region.slug, storyPlaceAncestry(region.slug, placeLinks).length]));
  const descendantsOf = new Map(regionEntries.map((region) => [region.slug, storyPlaceDescendants(region.slug, placeLinks)]));

  const filedArcs = arcs.filter((arc) => arc.category === "SIDE_QUEST" || arc.category === "CONTRACT");
  const arcsBySlug = new Map<string, (typeof arcs)>();
  const unfiled: CanonNavArc[] = [];
  for (const arc of filedArcs) {
    // A region entry the arc points at but that is archived or gone is the
    // same situation as no region at all — the arc surfaces in "not filed"
    // where somebody can put it somewhere real.
    const region = arc.regionEntryId ? regionById.get(arc.regionEntryId) : null;
    if (!region) { unfiled.push(navArc(arc)); continue; }
    const bucket = arcsBySlug.get(region.slug);
    if (bucket) bucket.push(arc); else arcsBySlug.set(region.slug, [arc]);
  }

  const packetsAt = (slug: string) => inbox.pending.regions[slug] ?? 0;
  // A packet aimed at a room in a tavern in a city lights the city too, so a
  // writer scanning the map sees there is something waiting down there.
  const rolledPackets = (slug: string) =>
    packetsAt(slug) + (descendantsOf.get(slug) ?? []).reduce((total, child) => total + packetsAt(child), 0);

  const built = new Map<string, CanonNavRegion>();
  for (const region of regionEntries) {
    const here = arcsBySlug.get(region.slug) ?? [];
    built.set(region.slug, {
      slug: region.slug,
      title: nationTerminologyText(region.title),
      depth: depthOf.get(region.slug) ?? 0,
      sideQuests: here.filter((arc) => arc.category === "SIDE_QUEST").map(navArc),
      contracts: here.filter((arc) => arc.category === "CONTRACT").map(navArc),
      pendingPackets: rolledPackets(region.slug),
    });
  }

  // A point of interest with no quest, no contract, and nothing waiting is not
  // navigation — it is noise. Its own dossier is where it lives; the sidebar
  // only shows the places that lead somewhere.
  const worthShowing = (slug: string): boolean => {
    const row = built.get(slug);
    if (!row) return false;
    if (row.sideQuests.length > 0 || row.contracts.length > 0 || row.pendingPackets > 0) return true;
    return (descendantsOf.get(slug) ?? []).some((child) => {
      const inner = built.get(child);
      return Boolean(inner && (inner.sideQuests.length > 0 || inner.contracts.length > 0 || inner.pendingPackets > 0));
    });
  };

  const childrenOf = new Map<string, string[]>();
  for (const link of placeLinks) {
    if (!link.parent || link.parent === link.slug || !knownPlace.has(link.parent)) continue;
    const siblings = childrenOf.get(link.parent);
    if (siblings) siblings.push(link.slug); else childrenOf.set(link.parent, [link.slug]);
  }
  const byTitle = (left: string, right: string) => (built.get(left)?.title ?? left).localeCompare(built.get(right)?.title ?? right);

  const regions: CanonNavRegion[] = [];
  const walked = new Set<string>();
  const walk = (slug: string) => {
    // The place tree is writer-editable free text, so it can cycle; the walk
    // carries a seen-set and stops rather than hanging the sidebar.
    if (walked.has(slug)) return;
    walked.add(slug);
    const row = built.get(slug);
    if (row && worthShowing(slug)) regions.push(row);
    for (const child of [...(childrenOf.get(slug) ?? [])].sort(byTitle)) walk(child);
  };
  const roots = regionEntries
    .filter((region) => { const parent = parentOf(region.meta); return !parent || !knownPlace.has(parent) || parent === region.slug; })
    .map((region) => region.slug)
    .sort(byTitle);
  for (const root of roots) walk(root);
  // A place inside a cycle is never reached from a root; it still deserves a
  // line rather than disappearing out of the navigator entirely.
  for (const region of regionEntries) if (!walked.has(region.slug)) walk(region.slug);

  // --- the companions --------------------------------------------------------
  const arcBySlugAll = new Map(arcs.map((arc) => [arc.slug, arc]));
  const { chains } = groupStoryMissionChains(missions.map((mission) => ({ slug: mission.slug, title: mission.title, meta: (mission.meta as Record<string, unknown> | null) ?? null })));
  const companionArcs = arcs.filter((arc) => arc.category === "COMPANION_QUEST");
  const companionSlugById = new Map(characters.map((character) => [character.id, character.slug]));
  const characterBySlug = new Map(characters.map((character) => [character.slug, character]));

  const arcsByCompanion = new Map<string, (typeof arcs)>();
  const companionless: CanonNavArc[] = [];
  for (const arc of companionArcs) {
    const slug = arc.companionEntryId ? companionSlugById.get(arc.companionEntryId) : null;
    if (!slug) { companionless.push(navArc(arc)); continue; }
    const bucket = arcsByCompanion.get(slug);
    if (bucket) bucket.push(arc); else arcsByCompanion.set(slug, [arc]);
  }

  const companionSlugs = [...new Set([...chains.keys(), ...arcsByCompanion.keys()])]
    .sort((left, right) => (characterBySlug.get(left)?.title ?? left).localeCompare(characterBySlug.get(right)?.title ?? right));

  const companions: CanonNavCompanion[] = companionSlugs.map((slug) => {
    const steps = chains.get(slug) ?? [];
    const claimed = new Set<string>();
    const chain: CanonNavCompanionStep[] = steps.map((mission) => {
      const meta = (mission.meta ?? {}) as Record<string, unknown>;
      const arcSlug = typeof meta.arc === "string" && meta.arc.trim() ? meta.arc.trim() : null;
      const arc = arcSlug ? arcBySlugAll.get(arcSlug) ?? null : null;
      if (arc) claimed.add(arc.slug);
      return {
        order: typeof meta.order === "number" ? meta.order : null,
        title: nationTerminologyText(mission.title),
        missionSlug: mission.slug,
        arc: arc ? navArc(arc) : null,
      };
    });
    return {
      slug,
      title: characterBySlug.get(slug)?.title ? nationTerminologyText(characterBySlug.get(slug)!.title) : slug.replaceAll("-", " "),
      chain,
      looseArcs: (arcsByCompanion.get(slug) ?? []).filter((arc) => !claimed.has(arc.slug)).map(navArc),
      pendingPackets: inbox.pending.companions[slug] ?? 0,
    };
  });

  // A companion quest filed to nobody would vanish; it goes in the general
  // bucket beside the packets that name no one either.
  if (companionless.length > 0 || (inbox.pending.companions[""] ?? 0) > 0) {
    companions.push({ slug: "", title: "Not filed to a companion yet", chain: [], looseArcs: companionless, pendingPackets: inbox.pending.companions[""] ?? 0 });
  }

  // --- the factions ----------------------------------------------------------
  // The room tracks majors, so the shelf is majors: a quest flown by a wing
  // rolls up under the power that wing answers to, named by the wing so the
  // provenance survives the rollup.
  const factionBySlug = new Map(factionEntries.map((faction) => [faction.slug, faction]));
  const factionById = new Map(factionEntries.map((faction) => [faction.id, faction]));
  const answersTo = (faction: (typeof factionEntries)[number]) => {
    const value = (faction.meta as Record<string, unknown> | null)?.parent;
    const slug = typeof value === "string" && value.trim() ? value.trim() : null;
    return slug && slug !== faction.slug && factionBySlug.has(slug) ? slug : null;
  };
  // `parent` is writer-editable, so the climb carries a seen-set and stops
  // rather than hanging the sidebar — the same guard the place tree uses.
  const bannerOver = (slug: string) => {
    let current = factionBySlug.get(slug);
    const seen = new Set<string>();
    while (current && !seen.has(current.slug)) {
      seen.add(current.slug);
      const above = answersTo(current);
      if (!above) return current;
      current = factionBySlug.get(above);
    }
    return current ?? factionBySlug.get(slug);
  };

  const factionQuests = arcs.filter((arc) => arc.category === "FACTION_QUEST");
  const ownByMajor = new Map<string, CanonNavArc[]>();
  const wingArcs = new Map<string, Map<string, CanonNavArc[]>>();
  const bannerless: CanonNavArc[] = [];
  for (const arc of factionQuests) {
    const flown = arc.factionEntryId ? factionById.get(arc.factionEntryId) : null;
    if (!flown) { bannerless.push(navArc(arc)); continue; }
    const major = bannerOver(flown.slug);
    if (!major) { bannerless.push(navArc(arc)); continue; }
    if (major.slug === flown.slug) {
      const bucket = ownByMajor.get(major.slug);
      if (bucket) bucket.push(navArc(arc)); else ownByMajor.set(major.slug, [navArc(arc)]);
      continue;
    }
    const wings = wingArcs.get(major.slug) ?? new Map<string, CanonNavArc[]>();
    const bucket = wings.get(flown.slug);
    if (bucket) bucket.push(navArc(arc)); else wings.set(flown.slug, [navArc(arc)]);
    wingArcs.set(major.slug, wings);
  }

  // Material waiting on a wing lights the power above it too, so a writer
  // scanning the shelf sees there is something down there — the same rollup
  // the map does for a packet aimed at a room inside a city.
  const bannerPacketsAt = (slug: string) => inbox.pending.factions[slug] ?? 0;
  const rolledBannerPackets = (majorSlug: string) => factionEntries
    .filter((faction) => faction.slug === majorSlug || bannerOver(faction.slug)?.slug === majorSlug)
    .reduce((total, faction) => total + bannerPacketsAt(faction.slug), 0);

  const majors = factionEntries.filter((faction) => !answersTo(faction));
  const factions: CanonNavFaction[] = majors
    .map((major) => ({
      slug: major.slug,
      title: nationTerminologyText(major.title),
      ownArcs: ownByMajor.get(major.slug) ?? [],
      wings: [...(wingArcs.get(major.slug) ?? new Map<string, CanonNavArc[]>()).entries()]
        .map(([slug, arcsFlown]) => ({ slug, title: factionBySlug.get(slug)?.title ? nationTerminologyText(factionBySlug.get(slug)!.title) : slug.replaceAll("-", " "), arcs: arcsFlown }))
        .sort((left, right) => left.title.localeCompare(right.title)),
      pendingPackets: rolledBannerPackets(major.slug),
    }))
    // A power with nothing flying and nothing waiting is not navigation — its
    // own dossier is where it lives. The same law prunes empty places.
    .filter((faction) => faction.ownArcs.length > 0 || faction.wings.length > 0 || faction.pendingPackets > 0);

  if (bannerless.length > 0 || (inbox.pending.factions[""] ?? 0) > 0) {
    factions.push({ slug: "", title: "Flying no banner yet", ownArcs: bannerless, wings: [], pendingPackets: inbox.pending.factions[""] ?? 0 });
  }
  return { campaign, regions, unfiled, companions, factions, incursions, events, pending: inbox.pending };
}

/**
 * The one pass over every working scene and branch that finds where each flag
 * is set and where it is checked.
 *
 * Two ledgers are derived from it — the promises page (is this promise planted,
 * answered, both, or neither?) and the ripples web (which quest pays off in
 * which other quest?) — and they have to agree, because they are the same
 * reading of the same board. Two scanners drifted the moment one of them
 * learned about a site the other did not.
 */
type StoryFlagSite = {
  label: string;
  detail: string;
  arcSlug: string;
  arcTitle: string;
  arcCategory: StoryArcCategory;
  isMainline: boolean;
  /** The arc's position, so a ripple can be ordered by where it lands. */
  position: number;
  /** The node a `?node=` deep link opens, so a ripple row lands on the scene. */
  nodeId: string;
};

async function scanStoryFlagSites() {
  const [flags, nodes, edges] = await Promise.all([
    db.storyEntry.findMany({
      where: { kind: "FLAG", status: { in: workingStatuses } },
      select: { id: true, slug: true, title: true, summary: true },
      orderBy: { title: "asc" },
    }),
    db.storyNode.findMany({
      where: { status: { in: workingStatuses } },
      select: { id: true, key: true, title: true, effects: true, arc: { select: { slug: true, title: true, category: true, isMainline: true, position: true } } },
    }),
    db.storyEdge.findMany({
      where: { status: { in: workingStatuses } },
      select: { id: true, label: true, condition: true, effects: true, fromNodeId: true, fromNode: { select: { title: true } }, arc: { select: { slug: true, title: true, category: true, isMainline: true, position: true } } },
    }),
  ]);

  // Word-boundary-ish match so one slug never matches inside a longer one.
  const touches = (text: string | null, slug: string) =>
    text !== null && new RegExp(`(^|[^a-z0-9-])${slug}([^a-z0-9-]|$)`).test(text);

  const arcOf = (arc: { slug: string; title: string; category: StoryArcCategory; isMainline: boolean; position: number }) =>
    ({ arcSlug: arc.slug, arcTitle: arc.title, arcCategory: arc.category, isMainline: arc.isMainline, position: arc.position });

  const setAt = new Map<string, StoryFlagSite[]>();
  const checkedAt = new Map<string, StoryFlagSite[]>();
  for (const flag of flags) {
    setAt.set(flag.slug, [
      ...nodes
        .filter((node) => node.effects.some((line) => touches(line, flag.slug)))
        .map((node) => ({ label: node.title, detail: "scene effect", nodeId: node.id, ...arcOf(node.arc) })),
      ...edges
        .filter((edge) => edge.effects.some((line) => touches(line, flag.slug)))
        .map((edge) => ({ label: edge.label ?? "Continue", detail: `choice out of "${edge.fromNode.title}"`, nodeId: edge.fromNodeId, ...arcOf(edge.arc) })),
    ]);
    checkedAt.set(flag.slug, edges
      .filter((edge) => touches(edge.condition, flag.slug))
      .map((edge) => ({ label: edge.label ?? "Continue", detail: `condition on a choice out of "${edge.fromNode.title}"`, nodeId: edge.fromNodeId, ...arcOf(edge.arc) })));
  }

  return { flags, setAt, checkedAt };
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
  const { flags, setAt, checkedAt } = await scanStoryFlagSites();

  // Projected back down to the five fields the promises page has always
  // carried. The scanner knows more now; the ledger's shape is not where that
  // gets spent.
  type ThreadSite = { label: string; detail: string; arcSlug: string; arcTitle: string; nodeId: string };
  const site = (row: StoryFlagSite): ThreadSite => ({ label: row.label, detail: row.detail, arcSlug: row.arcSlug, arcTitle: row.arcTitle, nodeId: row.nodeId });

  const threads = flags.map((flag) => {
    const planted = (setAt.get(flag.slug) ?? []).map(site);
    const answered = (checkedAt.get(flag.slug) ?? []).map(site);
    const state: "planted" | "unset" | "wired" | "dormant" =
      planted.length > 0 && answered.length > 0 ? "wired" : planted.length > 0 ? "planted" : answered.length > 0 ? "unset" : "dormant";
    return { slug: flag.slug, title: flag.title, summary: flag.summary, state, setAt: planted, checkedAt: answered };
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

export type StoryRippleSite = StoryFlagSite;

/** One quest reaching into another: a flag set here, read over there. */
export type StoryRipple = { flag: string; flagTitle: string; from: StoryRippleSite; to: StoryRippleSite };

/** An ending that hands the story on to another board. */
export type StoryRippleChain = {
  from: { arcSlug: string; arcTitle: string; nodeId: string; nodeTitle: string };
  to: { arcSlug: string; arcTitle: string };
};

/**
 * A connection that is real but not walkable yet — the amber rows. A promise
 * nobody plants, a promise nobody collects, or material still sitting in the
 * canon inbox. None of these are errors: they are the parts of the web that
 * get written down before they get built.
 */
export type StoryFutureRipple = {
  flag: string;
  flagTitle: string;
  kind: "unset" | "planted" | "packet";
  detail: string;
  /** Where the written half of the connection lives, when there is one. */
  where: StoryRippleSite | null;
  /** The thread the material is still waiting in, for `packet` rows. */
  packet: { threadSlug: string; threadTitle: string; packetTitle: string } | null;
};

export type StoryRippleWeb = { ripples: StoryRipple[]; chains: StoryRippleChain[]; future: StoryFutureRipple[] };

/**
 * The cross-quest connection web: everything one quest does that another quest
 * can see. Derived, never maintained — the same reading of effects and
 * conditions the promises ledger does, asked a different question.
 */
export async function getStoryRipples(): Promise<StoryRippleWeb> {
  const [{ flags, setAt, checkedAt }, continuations, inbox] = await Promise.all([
    scanStoryFlagSites(),
    db.storyNode.findMany({
      where: { status: { in: workingStatuses }, continuesInArcId: { not: null } },
      select: { id: true, title: true, arc: { select: { slug: true, title: true } }, continuesIn: { select: { slug: true, title: true } } },
    }),
    getCanonInbox(),
  ]);

  const ripples: StoryRipple[] = [];
  const future: StoryFutureRipple[] = [];
  const pending = inbox.packets.filter((packet) => packet.status === "pending");
  // Matched the way the scanner matches effects: a flag named inside a longer
  // slug is not a mention of it.
  const mentions = (text: string, slug: string) => new RegExp(`(^|[^a-z0-9-])${slug}([^a-z0-9-]|$)`).test(text);

  for (const flag of flags) {
    const planted = setAt.get(flag.slug) ?? [];
    const answered = checkedAt.get(flag.slug) ?? [];

    for (const from of planted) {
      for (const to of answered) {
        // A flag set and checked inside one arc is that arc's own machinery,
        // not a ripple into anywhere. Only crossings count.
        if (from.arcSlug === to.arcSlug) continue;
        ripples.push({ flag: flag.slug, flagTitle: flag.title, from, to });
      }
    }

    if (planted.length === 0 && answered.length > 0) {
      for (const where of answered) {
        future.push({ flag: flag.slug, flagTitle: flag.title, kind: "unset", detail: "Something reads this, but no quest sets it yet.", where, packet: null });
      }
    }
    if (planted.length > 0 && answered.length === 0) {
      for (const where of planted) {
        future.push({ flag: flag.slug, flagTitle: flag.title, kind: "planted", detail: "Planted here, still waiting for a quest to pay it off.", where, packet: null });
      }
    }

    for (const packet of pending) {
      if (!packet.entries.includes(flag.slug) && !mentions(packet.body, flag.slug)) continue;
      future.push({
        flag: flag.slug,
        flagTitle: flag.title,
        kind: "packet",
        detail: `Arrives with “${packet.title}”, still waiting to be woven in.`,
        where: null,
        packet: { threadSlug: packet.thread.slug, threadTitle: packet.thread.title, packetTitle: packet.title },
      });
    }
  }

  const chains: StoryRippleChain[] = continuations.flatMap((node) => (node.continuesIn
    ? [{ from: { arcSlug: node.arc.slug, arcTitle: node.arc.title, nodeId: node.id, nodeTitle: node.title }, to: { arcSlug: node.continuesIn.slug, arcTitle: node.continuesIn.title } }]
    : []));

  // Ordered by their mainline anchor: whichever end sits furthest up the spine
  // is what a reader places the connection against.
  const anchor = (ripple: StoryRipple) => [ripple.from, ripple.to]
    .sort((left, right) => Number(right.isMainline) - Number(left.isMainline) || left.position - right.position)[0];
  ripples.sort((left, right) => {
    const a = anchor(left);
    const b = anchor(right);
    return Number(b.isMainline) - Number(a.isMainline) || a.position - b.position || a.arcTitle.localeCompare(b.arcTitle) || left.flag.localeCompare(right.flag);
  });
  future.sort((left, right) => left.kind.localeCompare(right.kind) || left.flagTitle.localeCompare(right.flagTitle));
  chains.sort((left, right) => left.from.arcTitle.localeCompare(right.from.arcTitle) || left.to.arcTitle.localeCompare(right.to.arcTitle));

  return { ripples, chains, future };
}

/**
 * One arc's slice of the web, ready to render beside its board: what this
 * quest sets that something else reads, what reads back into it, where it
 * hands the story on, and the connections written down but not built yet.
 */
export function ripplesForArc(web: StoryRippleWeb, arcSlug: string) {
  return {
    outgoing: web.ripples.filter((ripple) => ripple.from.arcSlug === arcSlug && ripple.to.arcSlug !== arcSlug),
    incoming: web.ripples.filter((ripple) => ripple.to.arcSlug === arcSlug && ripple.from.arcSlug !== arcSlug),
    continues: web.chains.filter((chain) => chain.from.arcSlug === arcSlug),
    continuedFrom: web.chains.filter((chain) => chain.to.arcSlug === arcSlug),
    future: web.future.filter((row) => row.where?.arcSlug === arcSlug),
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
    db.storyArc.findMany({ where: { status: { in: workingStatuses } }, select: { slug: true, regionEntryId: true, companionEntryId: true, factionEntryId: true } }),
  ]);

  const knownEntries = new Set(entries.map((entry) => entry.slug));
  for (const entry of entries) {
    for (const alias of storyEntrySlugAliases(entry.slug)) knownEntries.add(alias);
  }
  const known = new Set([...knownEntries, ...arcs.map((arc) => arc.slug)]);
  // The pools kept apart, for the fields that name ONE namespace. Merging them
  // is what hid six involvement rows pointing at canon EVENT entries: an event
  // slug is in `known`, so an arc-only field validated against it looked
  // resolved. A field that legitimately reaches either way still uses `known`.
  const knownArcs = new Set(arcs.map((arc) => arc.slug));
  // Both ways an arc reaches into the bible: the place it is picked up, and
  // the companion whose story it is. A character whose only tie to the world
  // is that somebody opened their companion quest is not an orphan, and
  // reporting them as one sends a writer chasing a problem that is not there.
  const arcEntryIds = new Set(arcs.flatMap((arc) => [arc.regionEntryId, arc.companionEntryId, arc.factionEntryId].filter((id): id is string => Boolean(id))));
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
      // `companion` is a slug on a mission and a capability object on a
      // character; slugOf ignores the object, so one line serves both.
      for (const value of [meta.home, meta.seat, meta.parent, meta.origin, meta.companion, meta.species, meta.faith]) { const slug = slugOf(value); if (slug) targets.push(slug); }
      // The string-list fields. `factions` is object rows on a character but
      // plain slugs on a thread; slugOf skips the objects, so listing it here
      // only picks up the thread shape.
      for (const list of [meta.leaders, meta.biomes, meta.where, meta.involved, meta.characters, meta.companions, meta.locations, meta.bosses, meta.companionMissions, meta.threads, meta.arcs, meta.factions, meta.dependsOn]) for (const value of Array.isArray(list) ? list : []) { const slug = slugOf(value); if (slug) targets.push(slug); }
      for (const row of rows(meta.factions)) { const slug = slugOf(row.faction); if (slug) targets.push(slug); }
      for (const row of rows(meta.relationships)) { const slug = slugOf(row.character); if (slug) targets.push(slug); }
      for (const row of rows(meta.relations)) { const slug = slugOf(row.faction); if (slug) targets.push(slug); }
      for (const row of rows(meta.control)) { const slug = slugOf(row.faction); if (slug) targets.push(slug); }
      for (const row of rows(meta.connections)) { const slug = slugOf(row.to); if (slug) targets.push(slug); }
      for (const row of rows(meta.involvement)) { const slug = slugOf(row.ref) ?? slugOf(row.arc); if (slug) targets.push(slug); }
      for (const row of rows(meta.regionNotes)) { const slug = slugOf(row.region); if (slug) targets.push(slug); }
      { const slug = slugOf(meta.unlockArc); if (slug) targets.push(slug); }
      // The development room's newest links. A packet naming an entry
      // nobody wrote, or a mission pointing at an arc that was deleted, is an
      // unresolved link like any other — reported here rather than rotting
      // quietly inside a meta object nothing scans.
      { const slug = slugOf(meta.arc); if (slug) targets.push(slug); }
      for (const row of rows(meta.canonPackets)) {
        for (const value of [row.targetRegion, row.targetCompanion, row.targetFaction]) { const slug = slugOf(value); if (slug) targets.push(slug); }
        for (const list of [row.entries, row.wovenInto]) for (const value of Array.isArray(list) ? list : []) { const slug = slugOf(value); if (slug) targets.push(slug); }
      }
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
    const hasInbound = storyEntrySlugAliases(entry.slug).some((alias) => inbound.has(alias)) || entry._count.nodeLinks > 0 || entry._count.speakerOf > 0 || arcEntryIds.has(entry.id);
    const hasOutbound = (outbound.get(entry.slug) ?? []).some((target) => known.has(target) && persistedStoryEntrySlug(target) !== persistedStoryEntrySlug(entry.slug));
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

    const check = (field: string, target: unknown, pool: Set<string> = known) => {
      const slug = slugOf(target);
      if (slug && !pool.has(slug)) planned.push({ slug: entry.slug, title: entry.title, field, target: slug });
    };
    /** Slug-or-prose fields: only a multi-word kebab value could have been
     *  meant as a link, so "a fishing village on the coast" stays prose and
     *  a renamed `riftwood-interior` still surfaces as a break. */
    const checkIfSlugShaped = (field: string, target: unknown) => {
      const slug = slugOf(target);
      if (slug && slug.includes("-") && /^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) check(field, slug);
    };
    if (entry.kind === "CHARACTER") {
      check("home", meta.home);
      checkIfSlugShaped("race", meta.species);
      for (const row of rows(meta.factions)) check("faction", row.faction);
      for (const row of rows(meta.relationships)) check("relationship", row.character);
      // Each row is checked against ONLY its own namespace. An untyped legacy
      // row is checked the old way — against arcs — because that is what it
      // meant when it was written; the migration retypes it.
      for (const row of rows(meta.involvement)) {
        const ref = slugOf(row.ref) ?? slugOf(row.arc);
        check(row.kind === "EVENT" ? "involvement event" : "involvement", ref, row.kind === "EVENT" ? knownEntries : knownArcs);
      }
    }
    if (entry.kind === "SYSTEM") {
      // The release gate is the point of this sheet: a system gated on an arc
      // that was renamed or archived is silently unreleasable, and a
      // dependency on a system nobody wrote is a ship-order that cannot be
      // satisfied. Both are slug fields on the sheet, never prose.
      check("parent system", meta.parent);
      check("unlock arc", meta.unlockArc, knownArcs);
      for (const target of Array.isArray(meta.dependsOn) ? meta.dependsOn : []) check("depends on", target);
      for (const row of rows(meta.regionNotes)) check("region note", row.region);
    }
    if (entry.kind === "CREATURE") {
      // The race is a strict slug field on the sheet, never prose, so it is
      // checked outright — a member filed under a race nobody wrote is the
      // orphan the whole parent-child library exists to prevent.
      check("race", meta.parent);
      for (const habitat of Array.isArray(meta.biomes) ? meta.biomes : []) checkIfSlugShaped("habitat", habitat);
    }
    if (entry.kind === "REGION") {
      check("parent", meta.parent);
      for (const row of rows(meta.control)) check("control", row.faction);
      for (const row of rows(meta.connections)) check("connection", row.to);
    }
    if (entry.kind === "FACTION") {
      // The power this one answers to. A strict slug field on the sheet, never
      // prose, so a wing filed under a banner nobody wrote is caught the way
      // an orphaned race member is.
      check("answers to", meta.parent);
      check("seat", meta.seat);
      // Faith is slug-or-prose like species: only a slug-shaped value that
      // resolves nowhere is a break; prose is a writer's note by design.
      checkIfSlugShaped("faith", meta.faith);
      for (const leader of Array.isArray(meta.leaders) ? meta.leaders : []) check("leader", leader);
      for (const row of rows(meta.relations)) check("relation", row.faction);
    }
    if (entry.kind === "EVENT") {
      for (const place of Array.isArray(meta.where) ? meta.where : []) check("where", place);
      for (const participant of Array.isArray(meta.involved) ? meta.involved : []) check("involved", participant);
    }
    // The development room's link-now-fill-later markers: a thread naming an
    // arc nobody has opened, a mission filed under a character nobody has
    // written — exactly the pick-it-up-later signals this list exists for.
    if (entry.kind === "THREAD") {
      check("parent thread", meta.parent);
      for (const [field, list] of [["character", meta.characters], ["companion", meta.companions], ["faction", meta.factions], ["location", meta.locations], ["arc", meta.arcs], ["companion mission", meta.companionMissions], ["boss", meta.bosses]] as const) {
        for (const target of Array.isArray(list) ? list : []) check(field, target);
      }
      for (const row of rows(meta.canonPackets)) {
        check("canon packet target", row.targetRegion);
        check("canon packet companion", row.targetCompanion);
        check("canon packet banner", row.targetFaction);
        for (const target of Array.isArray(row.entries) ? row.entries : []) check("canon packet mentions", target);
        for (const target of Array.isArray(row.wovenInto) ? row.wovenInto : []) check("woven into", target);
      }
    }
    if (entry.kind === "COMPANION_MISSION") {
      check("companion", meta.companion);
      check("became arc", meta.arc);
      for (const [field, list] of [["character", meta.characters], ["location", meta.locations], ["faction", meta.factions], ["thread", meta.threads]] as const) {
        for (const target of Array.isArray(list) ? list : []) check(field, target);
      }
    }
  }

  return {
    unresolvedLinks: unresolvedLinks.map((item) => ({ ...item, slug: canonicalStoryEntryRouteSlug(item.slug), title: nationTerminologyText(item.title), target: nationTerminologyText(item.target) })),
    openQuestions: openQuestions.map((item) => ({ ...item, slug: canonicalStoryEntryRouteSlug(item.slug), title: nationTerminologyText(item.title), question: nationTerminologyText(item.question) })),
    missingMeta: missingMeta.map((item) => ({ ...item, slug: canonicalStoryEntryRouteSlug(item.slug), title: nationTerminologyText(item.title) })),
    planned: planned.map((item) => ({ ...item, slug: canonicalStoryEntryRouteSlug(item.slug), title: nationTerminologyText(item.title), target: nationTerminologyText(item.target) })),
    unconnected: unconnected.map((item) => ({ ...item, slug: canonicalStoryEntryRouteSlug(item.slug), title: nationTerminologyText(item.title) })),
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
    arcs: arcs.map((arc) => ({ id: arc.id, slug: arc.slug, title: nationTerminologyText(arc.title), summary: arc.summary ? nationTerminologyText(arc.summary) : null, author: storyMemberName(arc.creator), createdAt: arc.createdAt })),
    nodes: nodes.map((node) => ({ id: node.id, key: node.key, title: nationTerminologyText(node.title), summary: node.summary ? nationTerminologyText(node.summary) : null, kind: node.kind, arc: { ...node.arc, title: nationTerminologyText(node.arc.title) }, author: storyMemberName(node.creator), createdAt: node.createdAt })),
    edges: edges.map((edge) => ({ id: edge.id, label: edge.label ? nationTerminologyText(edge.label) : null, from: nationTerminologyText(edge.fromNode.title), to: nationTerminologyText(edge.toNode.title), arc: { ...edge.arc, title: nationTerminologyText(edge.arc.title) }, author: storyMemberName(edge.creator), createdAt: edge.createdAt })),
    entries: entries.map((entry) => ({ id: entry.id, slug: canonicalStoryEntryRouteSlug(entry.slug), kind: entry.kind, title: nationTerminologyText(entry.title), summary: entry.summary ? nationTerminologyText(entry.summary) : null, author: storyMemberName(entry.creator), createdAt: entry.createdAt })),
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
    summary: nationTerminologyText(revision.summary),
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

/**
 * A dossier's contributor originals — the gold-bordered cards at the foot of
 * the page (see components/contributor-card.tsx).
 *
 * Deliberately a separate query rather than an include on `getStoryEntry`:
 * the whole point of this material is that it lives outside the entry row and
 * outside anything the outbound bundle maps, so nothing that walks a
 * StoryEntry ever picks it up by accident.
 */
export async function listEntryContributions(entrySlug: string) {
  const rows = await db.storyEntryContribution.findMany({
    where: { entry: { slug: { in: storyEntrySlugAliases(entrySlug) } } },
    orderBy: { position: "asc" },
    select: {
      id: true,
      label: true,
      body: true,
      submittedAt: true,
      contributor: { select: writerSelect },
    },
  });
  return rows.map((row) => ({
    id: row.id,
    label: row.label,
    body: row.body,
    contributor: storyMemberName(row.contributor),
    submittedAt: row.submittedAt.toISOString().slice(0, 10),
  }));
}

/**
 * The campaign atlas: every mainline card as one continuous graph, plus each
 * side board, contract and companion chain hung off the card it reaches.
 *
 * Derived, like every other projection here — the shapes and the layout maths
 * live in lib/campaign-atlas.ts, which is pure and tested. Three kinds of join
 * are collected and kept apart deliberately: a structural `continuesIn`, a
 * flag set in one board and read in another, and — where neither exists
 * between two consecutive chapters — an `implied` gap, which the map draws as
 * a hole rather than a line.
 */
export async function getCampaignAtlas(): Promise<CampaignAtlas> {
  const [arcRows, web] = await Promise.all([
    db.storyArc.findMany({
      where: { status: { in: workingStatuses } },
      select: {
        id: true, slug: true, title: true, category: true, isMainline: true, position: true,
        status: true, lockedAt: true, summary: true, hook: true,
        region: { select: { slug: true, title: true } },
        _count: { select: { nodes: { where: { status: { in: workingStatuses } } } } },
      },
      orderBy: [{ isMainline: "desc" }, { position: "asc" }, { title: "asc" }],
    }),
    getStoryRipples(),
  ]);

  const asArc = (row: (typeof arcRows)[number]): AtlasArc => ({
    slug: row.slug, title: row.title, category: row.category, isMainline: row.isMainline,
    position: row.position, status: row.status, locked: row.lockedAt !== null,
    summary: row.summary, hook: row.hook, nodeCount: row._count.nodes, region: row.region,
  });
  const spine = arcRows.filter((row) => row.isMainline).map(asArc);
  const spineSlugs = new Set(spine.map((arc) => arc.slug));
  const spineIds = arcRows.filter((row) => row.isMainline).map((row) => row.id);

  const [nodeRows, edgeRows] = await Promise.all([
    db.storyNode.findMany({
      where: { arcId: { in: spineIds }, status: { in: workingStatuses } },
      select: {
        id: true, key: true, kind: true, title: true, endingKind: true,
        arc: { select: { slug: true } },
        _count: { select: { lines: { where: { retiredAt: null } } } },
      },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    }),
    db.storyEdge.findMany({
      where: { arcId: { in: spineIds }, status: { in: workingStatuses } },
      select: { id: true, label: true, condition: true, fromNodeId: true, toNodeId: true, position: true },
      orderBy: { position: "asc" },
    }),
  ]);

  const nodeIds = new Set(nodeRows.map((row) => row.id));
  const edges: AtlasEdge[] = edgeRows
    .filter((row) => nodeIds.has(row.fromNodeId) && nodeIds.has(row.toNodeId))
    .map((row) => ({ id: row.id, from: row.fromNodeId, to: row.toNodeId, label: row.label, condition: row.condition }));
  const hasIncoming = new Set(edges.map((edge) => edge.to));
  const hasOutgoing = new Set(edges.map((edge) => edge.from));
  const nodes: AtlasNode[] = nodeRows.map((row) => ({
    id: row.id, key: row.key, kind: row.kind, title: row.title, arcSlug: row.arc.slug,
    endingKind: row.endingKind, lines: row._count.lines,
    entry: !hasIncoming.has(row.id), terminal: !hasOutgoing.has(row.id),
  }));

  // --- the joins ----------------------------------------------------------
  const joins: AtlasJoin[] = [];
  const seen = new Set<string>();
  const add = (join: AtlasJoin) => {
    const key = `${join.kind}:${join.fromArc}:${join.fromNode ?? ""}:${join.toArc}`;
    if (seen.has(key)) return;
    seen.add(key);
    joins.push(join);
  };
  for (const chain of web.chains) {
    add({ kind: "handoff", fromArc: chain.from.arcSlug, fromNode: chain.from.nodeId, toArc: chain.to.arcSlug, toNode: null, label: chain.from.nodeTitle });
  }
  for (const ripple of web.ripples) {
    add({ kind: "flag", fromArc: ripple.from.arcSlug, fromNode: ripple.from.nodeId, toArc: ripple.to.arcSlug, toNode: ripple.to.nodeId, label: ripple.flagTitle });
  }
  // Consecutive chapters that nothing joins. Reported as a gap and never drawn
  // as a road: a map that stitches its own holes shut is worse than no map.
  const joinedPairs = new Set(joins.map((join) => `${join.fromArc}>${join.toArc}`));
  for (let index = 0; index < spine.length - 1; index += 1) {
    const from = spine[index]!;
    const to = spine[index + 1]!;
    if (joinedPairs.has(`${from.slug}>${to.slug}`)) continue;
    // Two chapters branching from the same parent are siblings, not a gap.
    const sharesAParent = joins.some((join) => join.toArc === from.slug && joins.some((other) => other.toArc === to.slug && other.fromArc === join.fromArc));
    if (sharesAParent) continue;
    add({ kind: "implied", fromArc: from.slug, fromNode: null, toArc: to.slug, toNode: null, label: "nothing connects these yet" });
  }

  // --- what spiders off it ------------------------------------------------
  // A board reaches the campaign if a join touches it, directly or through
  // another board that does. Walked rather than assumed, so a cluster like
  // the Bloomfall boards arrives whole or not at all.
  const neighbours = new Map<string, Set<string>>();
  for (const join of joins) {
    if (join.kind === "implied") continue;
    neighbours.set(join.fromArc, (neighbours.get(join.fromArc) ?? new Set<string>()).add(join.toArc));
    neighbours.set(join.toArc, (neighbours.get(join.toArc) ?? new Set<string>()).add(join.fromArc));
  }
  const reached = new Set(spineSlugs);
  const frontier = [...spineSlugs];
  while (frontier.length > 0) {
    const slug = frontier.shift() as string;
    for (const next of neighbours.get(slug) ?? []) {
      if (reached.has(next)) continue;
      reached.add(next);
      frontier.push(next);
    }
  }
  const side = arcRows.filter((row) => !row.isMainline && reached.has(row.slug)).map(asArc);
  const orphans = arcRows.filter((row) => !row.isMainline && !reached.has(row.slug)).map(asArc);

  // --- the companion chains -----------------------------------------------
  // A recruitable companion named on a mainline card is a chain hanging off
  // that card. Amanda's nine missions are entries rather than boards, so this
  // is the only way they reach the map at all.
  const [companionLinks, missionRows] = await Promise.all([
    db.storyEntryLink.findMany({
      where: { node: { arcId: { in: spineIds }, status: { in: workingStatuses } } },
      select: {
        node: { select: { id: true, title: true, createdAt: true, arc: { select: { slug: true, title: true, position: true } } } },
        entry: { select: { slug: true, title: true, kind: true, meta: true } },
      },
    }),
    db.storyEntry.findMany({
      where: { kind: "COMPANION_MISSION", status: { in: workingStatuses } },
      select: { slug: true, title: true, meta: true },
    }),
  ]);
  const companions: AtlasCompanion[] = [];
  const claimed = new Set<string>();
  // Earliest chapter first, then the order the cards were written, so the
  // chain anchors at the first place the campaign says their name rather than
  // at whichever link the database happened to return first.
  const orderedLinks = [...companionLinks].sort((left, right) =>
    left.node.arc.position - right.node.arc.position || left.node.createdAt.getTime() - right.node.createdAt.getTime());
  for (const link of orderedLinks) {
    if (link.entry.kind !== "CHARACTER" || claimed.has(link.entry.slug)) continue;
    const meta = (link.entry.meta ?? {}) as Record<string, unknown>;
    const companion = (meta.companion ?? {}) as Record<string, unknown>;
    if (companion.capable !== true) continue;
    const namedOn = orderedLinks
      .filter((row) => row.entry.slug === link.entry.slug)
      .map((row) => ({ arcSlug: row.node.arc.slug, arcTitle: row.node.arc.title, nodeId: row.node.id, nodeTitle: row.node.title }));
    const missions = missionRows
      .filter((row) => ((row.meta ?? {}) as Record<string, unknown>).companion === link.entry.slug)
      .map((row) => {
        const missionMeta = (row.meta ?? {}) as Record<string, unknown>;
        return {
          slug: row.slug,
          title: row.title,
          order: typeof missionMeta.order === "number" ? missionMeta.order : null,
          stage: typeof missionMeta.stage === "string" ? missionMeta.stage : null,
        };
      })
      .sort((left, right) => (left.order ?? 99) - (right.order ?? 99) || left.title.localeCompare(right.title));
    if (missions.length === 0) continue;
    claimed.add(link.entry.slug);
    companions.push({ slug: link.entry.slug, title: link.entry.title, atArc: link.node.arc.slug, atNode: link.node.id, namedOn, missions });
  }

  // Recruitable characters with nothing written for them. A campaign map that
  // shows one companion chain and stays quiet about the other six is telling
  // half the truth about what the campaign still owes.
  const chained = new Set(missionRows.map((row) => ((row.meta ?? {}) as Record<string, unknown>).companion).filter((slug): slug is string => typeof slug === "string"));
  const recruitable = await db.storyEntry.findMany({
    where: { kind: "CHARACTER", status: { in: workingStatuses } },
    select: { slug: true, title: true, meta: true },
    orderBy: { title: "asc" },
  });
  const companionsWithoutChain = recruitable
    .filter((row) => ((row.meta ?? {}) as Record<string, unknown>).companion !== null
      && (((row.meta ?? {}) as Record<string, unknown>).companion as Record<string, unknown> | undefined)?.capable === true
      && !chained.has(row.slug))
    .map((row) => ({ slug: row.slug, title: row.title }));

  // An ENDING that stops. The chapter-level gap above catches two chapters
  // nothing joins; this is the sharper one — a card the story is meant to
  // leave by, in the middle of the campaign, with nothing after it.
  const leaves = new Set(joins.filter((join) => join.fromNode).map((join) => join.fromNode as string));
  const lastChapter = spine[spine.length - 1]?.slug ?? null;
  const arcTitleOf = new Map(spine.map((arc) => [arc.slug, arc.title]));
  const danglingEndings = nodes
    .filter((node) => node.kind === "ENDING" && node.arcSlug !== lastChapter && !leaves.has(node.id))
    .map((node) => ({ arcSlug: node.arcSlug, arcTitle: arcTitleOf.get(node.arcSlug) ?? node.arcSlug, nodeId: node.id, nodeTitle: node.title }));

  // The forward edge: settled threads that have not become a board yet, so the
  // map does not simply stop at the last card anybody happened to write.
  const threads = await db.storyEntry.findMany({
    where: { kind: "THREAD", status: { in: workingStatuses } },
    select: { slug: true, title: true, summary: true, meta: true },
    orderBy: { title: "asc" },
  });
  const planned = threads
    .filter((row) => {
      const meta = (row.meta ?? {}) as Record<string, unknown>;
      const arcs = Array.isArray(meta.arcs) ? meta.arcs : [];
      return meta.threadStatus === "approved" && arcs.length === 0;
    })
    .map((row) => ({ slug: row.slug, title: row.title, summary: row.summary }));

  return {
    spine, nodes, edges, side, joins, companions, companionsWithoutChain,
    orphans, orphanClusters: clusterBoards(orphans, joins), danglingEndings, planned,
  };
}
