import "server-only";
import { getPrismaClient } from "@habitat/db/client";
import { parseStoryMapGeometry, type StoryAtlasFeature, type StoryAtlasProjection, type StoryAtlasQuest } from "@habitat/shared";

const db = getPrismaClient();
const visibleStatuses = ["DRAFT", "PROPOSED", "CANON"] as const;

function record(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null;
}

function text(value: unknown) { return typeof value === "string" ? value : null; }

export async function getStoryAtlasProjection(slug: string): Promise<StoryAtlasProjection | null> {
  const scene = await db.storyMap.findUnique({
    where: { slug },
    include: {
      parent: { select: { slug: true, title: true } },
      children: { select: { slug: true, title: true, ownerEntryId: true } },
      placements: { orderBy: [{ priority: "desc" }, { entry: { title: "asc" } }], include: { entry: true } },
      nodePlacements: {
        orderBy: [{ priority: "desc" }, { node: { title: "asc" } }],
        include: { node: { include: { arc: true } } },
      },
    },
  });
  if (!scene) return null;

  const entryIds = scene.placements.map((placement) => placement.entryId);
  const directArcs = await db.storyArc.findMany({
    where: { regionEntryId: { in: entryIds }, status: { in: [...visibleStatuses] } },
    select: { slug: true, title: true, category: true, status: true, regionEntryId: true },
  });
  const linkedNodes = await db.storyEntryLink.findMany({
    where: { entryId: { in: entryIds }, node: { status: { in: [...visibleStatuses] }, arc: { status: { in: [...visibleStatuses] } } } },
    select: { entryId: true, node: { select: { key: true, arc: { select: { slug: true, title: true, category: true, status: true } } } } },
  });
  const factionSlugs = new Set<string>();
  for (const placement of scene.placements) {
    const controls = record(placement.entry.meta)?.control;
    if (Array.isArray(controls)) for (const control of controls) { const slug = text(record(control)?.faction); if (slug) factionSlugs.add(slug); }
  }
  const factions = factionSlugs.size ? await db.storyEntry.findMany({ where: { slug: { in: [...factionSlugs] }, kind: "FACTION" }, select: { slug: true, title: true } }) : [];
  const factionTitle = new Map(factions.map((faction) => [faction.slug, faction.title]));
  const childMapByOwner = new Map(scene.children.flatMap((child) => child.ownerEntryId ? [[child.ownerEntryId, { slug: child.slug, title: child.title }]] : []));

  const questsByEntry = new Map<string, StoryAtlasQuest[]>();
  const addQuest = (entryId: string, quest: StoryAtlasQuest) => {
    const list = questsByEntry.get(entryId) ?? [];
    if (!list.some((item) => item.slug === quest.slug && item.nodeKey === quest.nodeKey)) list.push(quest);
    questsByEntry.set(entryId, list);
  };
  for (const arc of directArcs) if (arc.regionEntryId) addQuest(arc.regionEntryId, { slug: arc.slug, title: arc.title, category: arc.category, status: arc.status, nodeKey: null });
  for (const link of linkedNodes) addQuest(link.entryId, { slug: link.node.arc.slug, title: link.node.arc.title, category: link.node.arc.category, status: link.node.arc.status, nodeKey: link.node.key });

  const features: StoryAtlasFeature[] = [];
  for (const placement of scene.placements) {
    if (!visibleStatuses.includes(placement.entry.status as typeof visibleStatuses[number])) continue;
    const geometry = parseStoryMapGeometry(placement.geometry, scene.coordinateWidth, scene.coordinateHeight);
    if (!geometry || geometry.type !== placement.geometryKind) continue;
    const meta = record(placement.entry.meta);
    const placeType = text(meta?.type);
    const layer = placement.entry.kind === "SYSTEM" ? "SYSTEM" : placeType === "region" || placeType === "zone" ? "REGION" : placeType === "settlement" ? "SETTLEMENT" : "POI";
    const controls = Array.isArray(meta?.control) ? meta.control.flatMap((value) => {
      const control = record(value); const faction = text(control?.faction);
      return faction ? [{ slug: faction, title: factionTitle.get(faction) ?? faction, kind: text(control?.kind) }] : [];
    }) : [];
    features.push({
      placementId: placement.id,
      source: "ENTRY",
      entryId: placement.entryId,
      nodeId: null,
      slug: placement.entry.slug,
      title: placement.entry.title,
      summary: placement.entry.summary,
      body: placement.entry.body,
      status: placement.entry.status,
      layer,
      geometry,
      label: placement.labelX === null || placement.labelY === null ? null : [placement.labelX, placement.labelY],
      minZoom: placement.minZoom,
      maxZoom: placement.maxZoom,
      priority: placement.priority,
      childMap: childMapByOwner.get(placement.entryId) ?? null,
      place: placement.entry.kind === "REGION" ? { type: placeType, settlementTier: text(meta?.settlementTier), biome: text(meta?.biome), population: text(meta?.population), condition: text(meta?.status), control: controls, soulForge: text(meta?.soulForge), veilAnchorTier: text(meta?.veilAnchorTier) } : null,
      quests: questsByEntry.get(placement.entryId) ?? [],
    });
  }
  for (const placement of scene.nodePlacements) {
    if (!visibleStatuses.includes(placement.node.status as typeof visibleStatuses[number]) || !visibleStatuses.includes(placement.node.arc.status as typeof visibleStatuses[number])) continue;
    const geometry = parseStoryMapGeometry(placement.geometry, scene.coordinateWidth, scene.coordinateHeight);
    if (!geometry || geometry.type !== placement.geometryKind) continue;
    features.push({
      placementId: placement.id,
      source: "NODE",
      entryId: null,
      nodeId: placement.nodeId,
      slug: `quest:${placement.node.arc.slug}:${placement.node.key}`,
      title: placement.node.title,
      summary: placement.node.summary,
      body: placement.node.body,
      status: placement.node.status,
      layer: "QUEST",
      geometry,
      label: placement.labelX === null || placement.labelY === null ? null : [placement.labelX, placement.labelY],
      minZoom: placement.minZoom,
      maxZoom: placement.maxZoom,
      priority: placement.priority,
      childMap: null,
      place: null,
      quests: [{ slug: placement.node.arc.slug, title: placement.node.arc.title, category: placement.node.arc.category, status: placement.node.arc.status, nodeKey: placement.node.key }],
    });
  }
  const revision = await db.storyRevision.findFirst({ orderBy: [{ createdAt: "desc" }, { id: "desc" }], select: { id: true } });
  const uniqueQuests = new Set(features.flatMap((feature) => feature.quests.map((quest) => quest.slug)));
  return {
    contract: "martino-story-atlas",
    contractVersion: 1,
    revisionCursor: revision?.id ?? null,
    scene: { id: scene.id, slug: scene.slug, title: scene.title, artVersion: scene.artVersion, imageUrl: `/codex-map/${scene.slug}/${scene.artVersion}.png`, imageWidth: scene.imageWidth, imageHeight: scene.imageHeight, coordinateWidth: scene.coordinateWidth, coordinateHeight: scene.coordinateHeight, initialCenter: [scene.initialCenterX, scene.initialCenterY], initialZoom: scene.initialZoom, minZoom: scene.minZoom, maxZoom: scene.maxZoom, parentMap: scene.parent },
    features,
    counts: { placed: features.length, regions: features.filter((feature) => feature.layer === "REGION").length, settlements: features.filter((feature) => feature.layer === "SETTLEMENT").length, pois: features.filter((feature) => feature.layer === "POI").length, quests: uniqueQuests.size },
  };
}
