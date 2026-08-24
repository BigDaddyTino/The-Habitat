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
    include: { placements: { orderBy: [{ priority: "desc" }, { entry: { title: "asc" } }], include: { entry: true } } },
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
    const layer = placement.entry.kind === "SYSTEM" ? "SYSTEM" : placeType === "region" ? "REGION" : placeType === "settlement" ? "SETTLEMENT" : "POI";
    const controls = Array.isArray(meta?.control) ? meta.control.flatMap((value) => {
      const control = record(value); const faction = text(control?.faction);
      return faction ? [{ slug: faction, title: factionTitle.get(faction) ?? faction, kind: text(control?.kind) }] : [];
    }) : [];
    features.push({
      placementId: placement.id,
      entryId: placement.entryId,
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
      place: placement.entry.kind === "REGION" ? { type: placeType, settlementTier: text(meta?.settlementTier), biome: text(meta?.biome), population: text(meta?.population), condition: text(meta?.status), control: controls, soulForge: text(meta?.soulForge), veilAnchorTier: text(meta?.veilAnchorTier) } : null,
      quests: questsByEntry.get(placement.entryId) ?? [],
    });
  }
  const revision = await db.storyRevision.findFirst({ orderBy: [{ createdAt: "desc" }, { id: "desc" }], select: { id: true } });
  const uniqueQuests = new Set(features.flatMap((feature) => feature.quests.map((quest) => quest.slug)));
  return {
    contract: "martino-story-atlas",
    contractVersion: 1,
    revisionCursor: revision?.id ?? null,
    scene: { id: scene.id, slug: scene.slug, title: scene.title, artVersion: scene.artVersion, imageUrl: `/codex-map/${scene.slug}/${scene.artVersion}.png`, imageWidth: scene.imageWidth, imageHeight: scene.imageHeight, coordinateWidth: scene.coordinateWidth, coordinateHeight: scene.coordinateHeight, initialCenter: [scene.initialCenterX, scene.initialCenterY], initialZoom: scene.initialZoom, minZoom: scene.minZoom, maxZoom: scene.maxZoom },
    features,
    counts: { placed: features.length, regions: features.filter((feature) => feature.layer === "REGION").length, settlements: features.filter((feature) => feature.layer === "SETTLEMENT").length, pois: features.filter((feature) => feature.layer === "POI").length, quests: uniqueQuests.size },
  };
}
