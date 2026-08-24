import { getPrismaClient } from "@habitat/db/client";
import {
  codexBundleContractVersion,
  type CodexJsonValue,
  type CodexWriterAttribution,
  type MartinoCodexSnapshot,
} from "@habitat/shared";

const writerSelect = { name: true, username: true } as const;

function writer(value: { name: string | null; username: string | null }): CodexWriterAttribution {
  return { displayName: value.name?.trim() || value.username?.trim() || "Habitat writer" };
}

const privateRevisionKeys = new Set([
  "actorUserId",
  "authorUserId",
  "createdByUserId",
  "lockExpiresAt",
  "lockedByUserId",
  "resolvedByUserId",
  "updatedByUserId",
  "userId",
]);

export function sanitizeCodexJson(value: unknown): CodexJsonValue {
  if (value === null || typeof value === "string" || typeof value === "boolean") return value;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (Array.isArray(value)) return value.map(sanitizeCodexJson);
  if (typeof value === "object") {
    const result: Record<string, CodexJsonValue> = {};
    for (const [key, nested] of Object.entries(value)) {
      if (!privateRevisionKeys.has(key)) result[key] = sanitizeCodexJson(nested);
    }
    return result;
  }
  return null;
}

/**
 * Reads the complete authoring domain between two revision cursors and retries
 * if a writer commits during the read. Story writes and their revisions share
 * one database transaction, so an activated snapshot can never straddle two
 * authored states. Authentication, transient presence/courtesy locks, export
 * grants, and Warden audit prompts are outside the resource boundary.
 */
export async function buildCodexSnapshot(generatedAt = new Date(), attempt = 0): Promise<MartinoCodexSnapshot> {
  const database = getPrismaClient();
  const cursorBefore = await database.storyRevision.findFirst({
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    select: { id: true },
  });
  const arcs = await database.storyArc.findMany({
    orderBy: [{ position: "asc" }, { slug: "asc" }],
    include: {
      region: { select: { slug: true } },
      companion: { select: { slug: true } },
      faction: { select: { slug: true } },
      creator: { select: writerSelect },
      lockedBy: { select: writerSelect },
    },
  });
  const nodes = await database.storyNode.findMany({
    orderBy: [{ arcId: "asc" }, { createdAt: "asc" }, { key: "asc" }],
    include: {
      creator: { select: writerSelect },
      editor: { select: writerSelect },
      speaker: { select: { slug: true } },
      continuesIn: { select: { slug: true } },
    },
  });
  const edges = await database.storyEdge.findMany({
    orderBy: [{ arcId: "asc" }, { fromNodeId: "asc" }, { position: "asc" }, { key: "asc" }],
    include: { creator: { select: writerSelect } },
  });
  const entries = await database.storyEntry.findMany({
    orderBy: [{ kind: "asc" }, { slug: "asc" }],
    include: {
      creator: { select: writerSelect },
      editor: { select: writerSelect },
    },
  });
  const links = await database.storyEntryLink.findMany({
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    include: {
      node: { select: { key: true, arc: { select: { slug: true } } } },
      entry: { select: { slug: true } },
    },
  });
  const comments = await database.storyComment.findMany({
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    include: {
      author: { select: writerSelect },
      resolver: { select: writerSelect },
    },
  });
  const revisions = await database.storyRevision.findMany({
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    include: { actor: { select: writerSelect } },
  });
  const maps = await database.storyMap.findMany({
    orderBy: [{ parentMapId: "asc" }, { slug: "asc" }],
    include: { parent: { select: { slug: true } }, owner: { select: { slug: true } } },
  });
  const placements = await database.storyMapPlacement.findMany({
    orderBy: [{ mapId: "asc" }, { priority: "desc" }, { entryId: "asc" }],
    include: { map: { select: { slug: true } }, entry: { select: { slug: true } } },
  });
  const nodePlacements = await database.storyMapNodePlacement.findMany({
    orderBy: [{ mapId: "asc" }, { priority: "desc" }, { nodeId: "asc" }],
    include: { map: { select: { slug: true } }, node: { select: { key: true, arc: { select: { slug: true } } } } },
  });
  const cursorAfter = await database.storyRevision.findFirst({
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    select: { id: true },
  });
  if (cursorBefore?.id !== cursorAfter?.id) {
    if (attempt >= 2) throw new Error("The Codex changed throughout three consecutive snapshot reads; retry on the next cycle.");
    return buildCodexSnapshot(generatedAt, attempt + 1);
  }

  const newestRevision = cursorAfter?.id ?? null;
  return {
        contract: "martino-codex-snapshot",
        contractVersion: codexBundleContractVersion,
        generatedAt: generatedAt.toISOString(),
        revisionCursor: newestRevision,
        scope: {
          statuses: "ALL",
          entryKinds: "ALL",
          includesComments: true,
          includesRevisionHistory: true,
          excludesOperationalState: ["presence", "courtesy-locks", "assistant-audit", "auth", "export-tokens"],
        },
        arcs: arcs.map((arc) => ({
          id: arc.id,
          slug: arc.slug,
          title: arc.title,
          summary: arc.summary,
          hook: arc.hook,
          regionSlug: arc.region?.slug ?? null,
          isMainline: arc.isMainline,
          category: arc.category,
          companionSlug: arc.companion?.slug ?? null,
          factionSlug: arc.faction?.slug ?? null,
          status: arc.status,
          position: arc.position,
          lockedAt: arc.lockedAt?.toISOString() ?? null,
          createdBy: writer(arc.creator),
          lockedBy: arc.lockedBy ? writer(arc.lockedBy) : null,
          createdAt: arc.createdAt.toISOString(),
          updatedAt: arc.updatedAt.toISOString(),
        })),
        nodes: nodes.map((node) => ({
          id: node.id,
          arcId: node.arcId,
          key: node.key,
          kind: node.kind,
          title: node.title,
          summary: node.summary,
          body: node.body,
          status: node.status,
          speakerSlug: node.speaker?.slug ?? null,
          endingKind: node.endingKind,
          completion: node.completion,
          effects: node.effects,
          rewards: node.rewards,
          continuesInArcSlug: node.continuesIn?.slug ?? null,
          canvasX: node.canvasX,
          canvasY: node.canvasY,
          version: node.version,
          createdBy: writer(node.creator),
          updatedBy: node.editor ? writer(node.editor) : null,
          createdAt: node.createdAt.toISOString(),
          updatedAt: node.updatedAt.toISOString(),
        })),
        edges: edges.map((edge) => ({
          id: edge.id,
          arcId: edge.arcId,
          key: edge.key,
          fromNodeId: edge.fromNodeId,
          toNodeId: edge.toNodeId,
          label: edge.label,
          condition: edge.condition,
          effects: edge.effects,
          position: edge.position,
          status: edge.status,
          createdBy: writer(edge.creator),
          createdAt: edge.createdAt.toISOString(),
          updatedAt: edge.updatedAt.toISOString(),
        })),
        entries: entries.map((entry) => ({
          id: entry.id,
          kind: entry.kind,
          slug: entry.slug,
          title: entry.title,
          summary: entry.summary,
          body: entry.body,
          meta: sanitizeCodexJson(entry.meta),
          status: entry.status,
          version: entry.version,
          createdBy: writer(entry.creator),
          updatedBy: entry.editor ? writer(entry.editor) : null,
          createdAt: entry.createdAt.toISOString(),
          updatedAt: entry.updatedAt.toISOString(),
        })),
        links: links.map((link) => ({
          id: link.id,
          nodeId: link.nodeId,
          entryId: link.entryId,
          arcSlug: link.node.arc.slug,
          nodeKey: link.node.key,
          entrySlug: link.entry.slug,
          createdAt: link.createdAt.toISOString(),
        })),
        comments: comments.map((comment) => ({
          id: comment.id,
          nodeId: comment.nodeId,
          entryId: comment.entryId,
          body: comment.body,
          author: writer(comment.author),
          resolvedAt: comment.resolvedAt?.toISOString() ?? null,
          resolvedBy: comment.resolver ? writer(comment.resolver) : null,
          createdAt: comment.createdAt.toISOString(),
        })),
        revisions: revisions.map((revision) => ({
          id: revision.id,
          entityType: revision.entityType,
          entityId: revision.entityId,
          arcId: revision.arcId,
          action: revision.action,
          actor: writer(revision.actor),
          summary: revision.summary,
          before: sanitizeCodexJson(revision.before),
          after: sanitizeCodexJson(revision.after),
          createdAt: revision.createdAt.toISOString(),
        })),
        maps: maps.map((map) => ({
          id: map.id,
          slug: map.slug,
          title: map.title,
          parentMapSlug: map.parent?.slug ?? null,
          ownerEntrySlug: map.owner?.slug ?? null,
          artVersion: map.artVersion,
          artLogicalPath: `/images/maps/${map.slug}-map-${map.artVersion}.png`,
          imageWidth: map.imageWidth,
          imageHeight: map.imageHeight,
          coordinateWidth: map.coordinateWidth,
          coordinateHeight: map.coordinateHeight,
          initialCenter: [map.initialCenterX, map.initialCenterY] as const,
          initialZoom: map.initialZoom,
          minZoom: map.minZoom,
          maxZoom: map.maxZoom,
          version: map.version,
          createdAt: map.createdAt.toISOString(),
          updatedAt: map.updatedAt.toISOString(),
        })),
        placements: placements.map((placement) => ({
          id: placement.id,
          mapSlug: placement.map.slug,
          entrySlug: placement.entry.slug,
          geometryKind: placement.geometryKind,
          geometry: sanitizeCodexJson(placement.geometry),
          label: placement.labelX === null || placement.labelY === null ? null : [placement.labelX, placement.labelY] as const,
          minZoom: placement.minZoom,
          maxZoom: placement.maxZoom,
          priority: placement.priority,
          version: placement.version,
          createdAt: placement.createdAt.toISOString(),
          updatedAt: placement.updatedAt.toISOString(),
        })),
        nodePlacements: nodePlacements.map((placement) => ({
          id: placement.id,
          mapSlug: placement.map.slug,
          arcSlug: placement.node.arc.slug,
          nodeKey: placement.node.key,
          geometryKind: placement.geometryKind,
          geometry: sanitizeCodexJson(placement.geometry),
          label: placement.labelX === null || placement.labelY === null ? null : [placement.labelX, placement.labelY] as const,
          minZoom: placement.minZoom,
          maxZoom: placement.maxZoom,
          priority: placement.priority,
          version: placement.version,
          createdAt: placement.createdAt.toISOString(),
          updatedAt: placement.updatedAt.toISOString(),
        })),
  };
}

export async function codexDatabaseFingerprint() {
  const database = getPrismaClient();
  const newestRevision = await database.storyRevision.findFirst({
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    select: { id: true },
  });
  // The revision cursor is the normal signal. Counts and modification times
  // also catch a maintenance script that legitimately changes Codex rows
  // without going through the web action/revision path.
  const arcs = await database.storyArc.aggregate({ _count: { _all: true }, _max: { updatedAt: true } });
  const nodes = await database.storyNode.aggregate({ _count: { _all: true }, _max: { updatedAt: true } });
  const edges = await database.storyEdge.aggregate({ _count: { _all: true }, _max: { updatedAt: true } });
  const entries = await database.storyEntry.aggregate({ _count: { _all: true }, _max: { updatedAt: true } });
  const links = await database.storyEntryLink.aggregate({ _count: { _all: true }, _max: { createdAt: true } });
  const comments = await database.storyComment.aggregate({
    _count: { _all: true },
    _max: { createdAt: true, resolvedAt: true },
  });
  const maps = await database.storyMap.aggregate({ _count: { _all: true }, _max: { updatedAt: true } });
  const placements = await database.storyMapPlacement.aggregate({ _count: { _all: true }, _max: { updatedAt: true } });
  const nodePlacements = await database.storyMapNodePlacement.aggregate({ _count: { _all: true }, _max: { updatedAt: true } });
  return JSON.stringify({
    revision: newestRevision?.id ?? null,
    arcs: [arcs._count._all, arcs._max.updatedAt?.toISOString() ?? null],
    nodes: [nodes._count._all, nodes._max.updatedAt?.toISOString() ?? null],
    edges: [edges._count._all, edges._max.updatedAt?.toISOString() ?? null],
    entries: [entries._count._all, entries._max.updatedAt?.toISOString() ?? null],
    links: [links._count._all, links._max.createdAt?.toISOString() ?? null],
    comments: [comments._count._all, comments._max.createdAt?.toISOString() ?? null, comments._max.resolvedAt?.toISOString() ?? null],
    maps: [maps._count._all, maps._max.updatedAt?.toISOString() ?? null],
    placements: [placements._count._all, placements._max.updatedAt?.toISOString() ?? null],
    nodePlacements: [nodePlacements._count._all, nodePlacements._max.updatedAt?.toISOString() ?? null],
  });
}
