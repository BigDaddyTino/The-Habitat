import { getPrismaClient } from "@habitat/db/client";
import type { AtlasAuditSource } from "./atlas-integrity";

const db = getPrismaClient();

function record(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null;
}

function text(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

/** Read-only by construction: this adapter contains only Prisma findMany calls. */
export async function loadAtlasAuditSource(): Promise<AtlasAuditSource> {
  const [maps, entries] = await Promise.all([
    db.storyMap.findMany({
      orderBy: { slug: "asc" },
      include: {
        parent: { select: { slug: true } },
        children: { select: { slug: true } },
        owner: { select: { slug: true } },
        placements: {
          orderBy: [{ entry: { slug: "asc" } }],
          include: { entry: { select: { id: true, slug: true, title: true, status: true, meta: true } } },
        },
        nodePlacements: {
          orderBy: [{ node: { arc: { slug: "asc" } } }, { node: { key: "asc" } }],
          include: { node: { select: { id: true, key: true, title: true, status: true, arc: { select: { id: true, slug: true, status: true } } } } },
        },
      },
    }),
    db.storyEntry.findMany({
      orderBy: [{ kind: "asc" }, { slug: "asc" }],
      select: { id: true, kind: true, slug: true, title: true, summary: true, body: true, status: true, meta: true },
    }),
  ]);
  return {
    maps: maps.map((map) => ({
      mapId: map.id,
      slug: map.slug,
      title: map.title,
      parentSlug: map.parent?.slug ?? null,
      childSlugs: map.children.map((child) => child.slug),
      ownerEntrySlug: map.owner?.slug ?? null,
      artVersion: map.artVersion,
      imageWidth: map.imageWidth,
      imageHeight: map.imageHeight,
      coordinateWidth: map.coordinateWidth,
      coordinateHeight: map.coordinateHeight,
      placements: map.placements.map((placement) => {
        const meta = record(placement.entry.meta);
        return {
          placementId: placement.id,
          entryId: placement.entry.id,
          entrySlug: placement.entry.slug,
          entryTitle: placement.entry.title,
          entryStatus: placement.entry.status,
          placeType: text(meta?.type),
          parentSlug: text(meta?.parent),
          geometryKind: placement.geometryKind,
          geometry: placement.geometry,
          labelX: placement.labelX,
          labelY: placement.labelY,
          minZoom: placement.minZoom,
          maxZoom: placement.maxZoom,
          priority: placement.priority,
        };
      }),
      nodePlacements: map.nodePlacements.map((placement) => ({
        placementId: placement.id,
        nodeId: placement.node.id,
        nodeKey: placement.node.key,
        nodeTitle: placement.node.title,
        nodeStatus: placement.node.status,
        arcId: placement.node.arc.id,
        arcSlug: placement.node.arc.slug,
        arcStatus: placement.node.arc.status,
        geometryKind: placement.geometryKind,
        geometry: placement.geometry,
        labelX: placement.labelX,
        labelY: placement.labelY,
        minZoom: placement.minZoom,
        maxZoom: placement.maxZoom,
        priority: placement.priority,
      })),
    })),
    entries: entries.map((entry) => ({ ...entry, kind: String(entry.kind), status: String(entry.status) })),
  };
}

export function disconnectAtlasAuditDatabase() {
  return db.$disconnect();
}

