import { createHash, randomBytes } from "node:crypto";
import "@/lib/environment";
import { getPrismaClient } from "@habitat/db/client";
import {
  analyzeStoryGraph,
  exportableStoryStatus,
  findStoryEntryNodeKeys,
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
 * Projects the canon story into the shape the Unreal importer reads.
 *
 * Nothing below CANON is selected at any level — arc, node, edge, or bible
 * entry — so a proposal cannot reach a game build even if a reviewer approves
 * one node and forgets its branches. Edges whose far end is not itself canon
 * are dropped for the same reason: a choice pointing at an unapproved scene
 * would import as a dangling asset reference.
 */
export async function buildStoryExport(): Promise<MartinoStoryExport> {
  const [arcs, entries, newestRevision] = await Promise.all([
    db.storyArc.findMany({
      where: { status: exportableStoryStatus },
      orderBy: [{ isMainline: "desc" }, { position: "asc" }, { createdAt: "asc" }],
      include: {
        nodes: {
          where: { status: exportableStoryStatus },
          orderBy: { key: "asc" },
          include: {
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
      where: { status: exportableStoryStatus },
      orderBy: [{ kind: "asc" }, { slug: "asc" }],
      select: { kind: true, slug: true, title: true, summary: true, body: true },
    }),
    db.storyRevision.findFirst({ orderBy: { createdAt: "desc" }, select: { id: true } }),
  ]);

  const exportArcs: StoryExportArc[] = arcs.map((arc) => {
    const keyById = new Map(arc.nodes.map((node) => [node.id, node.key]));

    const nodes: StoryExportNode[] = arc.nodes.map((node) => {
      const choices = arc.edges
        .filter((edge) => edge.fromNodeId === node.id && keyById.has(edge.toNodeId))
        .sort((left, right) => left.position - right.position)
        .map((edge, index) => ({
          order: index,
          label: edge.label,
          condition: edge.condition,
          toKey: keyById.get(edge.toNodeId) as string,
        }));

      return {
        key: node.key,
        kind: node.kind,
        title: node.title,
        summary: node.summary,
        body: node.body,
        choices,
        // A reference to a bible entry that is still proposed is dropped: the
        // importer would otherwise resolve it against an asset that does not
        // exist on the game side.
        references: node.entryLinks
          .filter((link) => link.entry.status === exportableStoryStatus)
          .map((link) => ({ kind: link.entry.kind, slug: link.entry.slug, title: link.entry.title })),
      };
    });

    const graphNodes: StoryGraphNode[] = nodes.map((node) => ({ key: node.key, kind: node.kind, title: node.title }));
    const graphEdges: StoryGraphEdge[] = nodes.flatMap((node) => node.choices.map((choice) => ({ fromKey: node.key, toKey: choice.toKey, label: choice.label })));

    return {
      slug: arc.slug,
      title: arc.title,
      summary: arc.summary,
      isMainline: arc.isMainline,
      entryNodeKeys: findStoryEntryNodeKeys(graphNodes, graphEdges),
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
    bible: entries,
  };
}
