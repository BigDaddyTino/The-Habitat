import { createHash, randomBytes } from "node:crypto";
import "@/lib/environment";
import { getPrismaClient } from "@habitat/db/client";
import {
  analyzeStoryGraph,
  developmentOnlyStoryKinds,
  exportableStoryStatus,
  findStoryEntryNodeKeys,
  isDevelopmentOnlyStoryKind,
  storyExportContractVersion,
  type MartinoStoryExport,
  type StoryExportArc,
  type StoryExportNode,
  type StoryGraphEdge,
  type StoryGraphNode,
} from "@habitat/shared";

const db = getPrismaClient();

/**
 * Only the digest is ever persisted, so the plaintext exists once — in the
 * dialog that issues it — and a database dump cannot be replayed against the
 * export endpoint.
 */
export function hashStoryExportToken(rawToken: string) {
  return createHash("sha256").update(rawToken.trim()).digest("hex");
}

export function generateStoryExportToken() {
  return `martino_${randomBytes(32).toString("hex")}`;
}

export function readBearerToken(authorization: string | null) {
  if (!authorization) return null;
  const match = /^Bearer\s+(\S+)$/i.exec(authorization.trim());
  return match?.[1] ?? null;
}

/**
 * Resolves a presented token to a live grant, or null. Revoked tokens are kept
 * rather than deleted so `lastUsedAt` still shows when a leaked one was last
 * tried, and the unique hash index means this is a single indexed lookup.
 */
export async function authorizeStoryExport(authorization: string | null) {
  const raw = readBearerToken(authorization);
  if (!raw) return null;

  const token = await db.storyExportToken.findUnique({
    where: { tokenHash: hashStoryExportToken(raw) },
    select: { id: true, label: true, revokedAt: true },
  });
  if (!token || token.revokedAt) return null;

  await db.storyExportToken.update({ where: { id: token.id }, data: { lastUsedAt: new Date() } });
  return { id: token.id, label: token.label };
}

/**
 * The newest revision the export cares about. MOVED rows are excluded: card
 * drags never change a byte of the export, and counting them churned the
 * importer's ETag/`?since` cursor into full refetches of identical payloads
 * every time somebody tidied a board. (The SSE cursor deliberately still
 * counts MOVED — live boards do want to see cards move.)
 */
export async function newestExportRevision() {
  return db.storyRevision.findFirst({
    where: { action: { not: "MOVED" } },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    select: { id: true },
  });
}

/**
 * Projects the canon story into the shape the Unreal importer reads.
 *
 * Nothing below CANON is selected at any level — arc, node, edge, or bible
 * entry — so a proposal cannot reach a game build even if a reviewer approves
 * one node and forgets its branches. Edges whose far end is not itself canon
 * are dropped for the same reason: a choice pointing at an unapproved scene
 * would import as a dangling asset reference.
 */
export async function buildStoryExport(): Promise<MartinoStoryExport> {
  // The cursor is read BEFORE the content, not alongside it. Read together,
  // a change committing between the content reads and the cursor read stamps
  // newer-cursor-on-older-content — and the importer, polling ?since=cursor,
  // 304s forever on a codex that already moved past what it holds. Read
  // first, the mismatch inverts to older-cursor-on-newer-content, which
  // merely costs one redundant refetch and then self-corrects.
  const newestRevision = await newestExportRevision();
  const [arcs, entries] = await Promise.all([
    db.storyArc.findMany({
      where: { status: exportableStoryStatus },
      orderBy: [{ isMainline: "desc" }, { position: "asc" }, { createdAt: "asc" }],
      include: {
        region: { select: { slug: true, title: true, status: true } },
        companion: { select: { slug: true, title: true, status: true } },
        nodes: {
          where: { status: exportableStoryStatus },
          orderBy: { key: "asc" },
          include: {
            speaker: { select: { slug: true, title: true, status: true } },
            continuesIn: { select: { slug: true, status: true } },
            entryLinks: {
              include: { entry: { select: { kind: true, slug: true, title: true, status: true } } },
              orderBy: { createdAt: "asc" },
            },
          },
        },
        edges: {
          where: { status: exportableStoryStatus },
          orderBy: [{ fromNodeId: "asc" }, { position: "asc" }],
        },
      },
    }),
    db.storyEntry.findMany({
      // THREAD and COMPANION_MISSION are the writers' room arguing with
      // itself — statused in meta, canon only in the sense that the room owns
      // them. The game is never built from a brainstorm: an implemented
      // thread ships as real arcs and entries, so the export withholds the
      // discussion records entirely rather than trusting a status field.
      where: { status: exportableStoryStatus, kind: { notIn: [...developmentOnlyStoryKinds] } },
      orderBy: [{ kind: "asc" }, { slug: "asc" }],
      select: { kind: true, slug: true, title: true, summary: true, body: true, meta: true },
    }),
  ]);

  const exportArcs: StoryExportArc[] = arcs.map((arc) => {
    const keyById = new Map(arc.nodes.map((node) => [node.id, node.key]));

    const nodes: StoryExportNode[] = arc.nodes.map((node) => {
      const choices = arc.edges
        .filter((edge) => edge.fromNodeId === node.id && keyById.has(edge.toNodeId))
        .sort((left, right) => left.position - right.position)
        .map((edge, index) => ({
          order: index,
          key: edge.key,
          label: edge.label,
          condition: edge.condition,
          effects: edge.effects.length > 0 ? edge.effects : null,
          toKey: keyById.get(edge.toNodeId) as string,
        }));

      return {
        key: node.key,
        kind: node.kind,
        title: node.title,
        summary: node.summary,
        body: node.body,
        // A speaker that is not itself canon is withheld like any other
        // reference — the importer must never resolve an attribution against
        // a character the game does not have.
        speaker: node.speaker && node.speaker.status === exportableStoryStatus
          ? { slug: node.speaker.slug, title: node.speaker.title }
          : null,
        endingKind: node.endingKind,
        completion: node.completion,
        effects: node.effects.length > 0 ? node.effects : null,
        rewards: node.rewards.length > 0 ? node.rewards : null,
        // A continuation into an arc that is not itself canon is withheld —
        // the importer must never chain a quest into a story it cannot see.
        continuesInArcSlug: node.continuesIn && node.continuesIn.status === exportableStoryStatus ? node.continuesIn.slug : null,
        choices,
        // A reference to a bible entry that is still proposed is dropped: the
        // importer would otherwise resolve it against an asset that does not
        // exist on the game side. Development-room kinds are dropped for the
        // same reason from the other direction — the bible withholds threads
        // and companion missions entirely, so a scene that cites one in the
        // room must not export a reference nothing in the payload resolves.
        references: node.entryLinks
          .filter((link) => link.entry.status === exportableStoryStatus && !isDevelopmentOnlyStoryKind(link.entry.kind))
          .map((link) => ({ kind: link.entry.kind, slug: link.entry.slug, title: link.entry.title })),
      };
    });

    const graphNodes: StoryGraphNode[] = nodes.map((node) => ({ key: node.key, kind: node.kind, title: node.title }));
    const graphEdges: StoryGraphEdge[] = nodes.flatMap((node) =>
      node.choices.map((choice) => ({ fromKey: node.key, toKey: choice.toKey, label: choice.label, hasConsequence: (choice.effects?.length ?? 0) > 0 })),
    );

    // Entry keys are ordered by node creation, not by the key-sorted node
    // list: `entryNodeKeys[0]` is the canonical start on the importer side,
    // and creation order is the only ordering a newly added opening cannot
    // rewrite out from under it.
    const graphNodesByAge: StoryGraphNode[] = [...arc.nodes]
      .sort((left, right) => left.createdAt.getTime() - right.createdAt.getTime() || (left.id < right.id ? -1 : 1))
      .map((node) => ({ key: node.key, kind: node.kind, title: node.title }));

    return {
      slug: arc.slug,
      title: arc.title,
      summary: arc.summary,
      hook: arc.hook,
      region: arc.region && arc.region.status === exportableStoryStatus ? { slug: arc.region.slug, title: arc.region.title } : null,
      isMainline: arc.isMainline,
      // Additive to the v1 contract, and never a replacement: an importer that
      // only knows `isMainline` keeps reading exactly what it always read,
      // and the database CHECK guarantees the two can never disagree.
      category: arc.category,
      // Withheld like every other reference whose target is not itself canon.
      companion: arc.companion && arc.companion.status === exportableStoryStatus ? { slug: arc.companion.slug, title: arc.companion.title } : null,
      entryNodeKeys: findStoryEntryNodeKeys(graphNodesByAge, graphEdges),
      nodes,
      // Reported, never enforced. The importer decides whether a story with
      // loose ends is worth building; the codex only refuses to hide them.
      problems: analyzeStoryGraph(graphNodes, graphEdges),
    };
  });

  return {
    contractVersion: storyExportContractVersion,
    generatedAt: new Date().toISOString(),
    revisionCursor: newestRevision?.id ?? null,
    arcs: exportArcs,
    bible: entries.map((entry) => ({
      kind: entry.kind,
      slug: entry.slug,
      title: entry.title,
      summary: entry.summary,
      body: entry.body,
      // Postgres NULL and JSON null both project to the contract's null; the
      // CHECK constraint guarantees anything else here is an object.
      meta: (entry.meta as Record<string, unknown> | null) ?? null,
    })),
  };
}
