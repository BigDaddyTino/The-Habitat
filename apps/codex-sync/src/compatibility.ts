import {
  analyzeStoryGraph,
  developmentOnlyStoryKinds,
  findStoryEntryNodeKeys,
  isDevelopmentOnlyStoryKind,
  storyExportContractVersion,
  type MartinoCodexSnapshot,
  type MartinoStoryExport,
  type StoryArcCategory,
  type StoryEndingKind,
  type StoryEntryKind,
  type StoryExportArc,
  type StoryGraphEdge,
  type StoryGraphNode,
  type StoryNodeKind,
} from "@habitat/shared";

const canon = "CANON";

/** Rebuilds the existing canon-v1 payload from the same consistent v2 read. */
export function buildCanonCompatibilityExport(snapshot: MartinoCodexSnapshot): MartinoStoryExport {
  const entryBySlug = new Map(snapshot.entries.map((entry) => [entry.slug, entry]));
  const entryById = new Map(snapshot.entries.map((entry) => [entry.id, entry]));
  const nodeById = new Map(snapshot.nodes.map((node) => [node.id, node]));
  const linksByNode = new Map<string, typeof snapshot.links>();
  for (const link of snapshot.links) {
    const links = linksByNode.get(link.nodeId);
    if (links) links.push(link);
    else linksByNode.set(link.nodeId, [link]);
  }

  const exportArcs: StoryExportArc[] = snapshot.arcs
    .filter((arc) => arc.status === canon)
    .sort((left, right) => Number(right.isMainline) - Number(left.isMainline) || left.position - right.position || left.createdAt.localeCompare(right.createdAt))
    .map((arc) => {
      const arcNodes = snapshot.nodes.filter((node) => node.arcId === arc.id && node.status === canon);
      const knownNodeIds = new Set(arcNodes.map((node) => node.id));
      const arcEdges = snapshot.edges
        .filter((edge) => edge.arcId === arc.id && edge.status === canon && knownNodeIds.has(edge.fromNodeId) && knownNodeIds.has(edge.toNodeId))
        .sort((left, right) => left.fromNodeId.localeCompare(right.fromNodeId) || left.position - right.position);

      const nodes = arcNodes
        .slice()
        .sort((left, right) => left.key.localeCompare(right.key))
        .map((node) => ({
          key: node.key,
          kind: node.kind as StoryNodeKind,
          title: node.title,
          summary: node.summary,
          body: node.body,
          speaker:
            node.speakerSlug && entryBySlug.get(node.speakerSlug)?.status === canon
              ? { slug: node.speakerSlug, title: entryBySlug.get(node.speakerSlug)?.title ?? node.speakerSlug }
              : null,
          endingKind: node.endingKind as StoryEndingKind | null,
          completion: node.completion,
          effects: node.effects.length > 0 ? node.effects : null,
          rewards: node.rewards.length > 0 ? node.rewards : null,
          continuesInArcSlug:
            node.continuesInArcSlug && snapshot.arcs.some((candidate) => candidate.slug === node.continuesInArcSlug && candidate.status === canon)
              ? node.continuesInArcSlug
              : null,
          choices: arcEdges
            .filter((edge) => edge.fromNodeId === node.id)
            .map((edge, index) => ({
              order: index,
              key: edge.key,
              label: edge.label,
              condition: edge.condition,
              effects: edge.effects.length > 0 ? edge.effects : null,
              toKey: nodeById.get(edge.toNodeId)?.key ?? "",
            })),
          references: (linksByNode.get(node.id) ?? [])
            .map((link) => entryById.get(link.entryId))
            .filter(
              (entry): entry is NonNullable<typeof entry> =>
                Boolean(entry && entry.status === canon && !isDevelopmentOnlyStoryKind(entry.kind as StoryEntryKind)),
            )
            .map((entry) => ({ kind: entry.kind as StoryEntryKind, slug: entry.slug, title: entry.title })),
        }));

      const graphNodes: StoryGraphNode[] = nodes.map((node) => ({ key: node.key, kind: node.kind, title: node.title }));
      const graphEdges: StoryGraphEdge[] = nodes.flatMap((node) =>
        node.choices.map((choice) => ({
          fromKey: node.key,
          toKey: choice.toKey,
          label: choice.label,
          hasConsequence: (choice.effects?.length ?? 0) > 0,
        })),
      );
      const graphNodesByAge: StoryGraphNode[] = arcNodes
        .slice()
        .sort((left, right) => left.createdAt.localeCompare(right.createdAt) || left.id.localeCompare(right.id))
        .map((node) => ({ key: node.key, kind: node.kind as StoryNodeKind, title: node.title }));

      const region = arc.regionSlug ? entryBySlug.get(arc.regionSlug) : null;
      const companion = arc.companionSlug ? entryBySlug.get(arc.companionSlug) : null;
      const faction = arc.factionSlug ? entryBySlug.get(arc.factionSlug) : null;
      return {
        slug: arc.slug,
        title: arc.title,
        summary: arc.summary,
        hook: arc.hook,
        region: region?.status === canon ? { slug: region.slug, title: region.title } : null,
        isMainline: arc.isMainline,
        category: arc.category as StoryArcCategory,
        companion: companion?.status === canon ? { slug: companion.slug, title: companion.title } : null,
        faction: faction?.status === canon ? { slug: faction.slug, title: faction.title } : null,
        entryNodeKeys: findStoryEntryNodeKeys(graphNodesByAge, graphEdges),
        nodes,
        problems: analyzeStoryGraph(graphNodes, graphEdges),
      };
    });

  return {
    contractVersion: storyExportContractVersion,
    generatedAt: snapshot.generatedAt,
    revisionCursor: snapshot.revisionCursor,
    arcs: exportArcs,
    bible: snapshot.entries
      .filter(
        (entry) =>
          entry.status === canon && !(developmentOnlyStoryKinds as readonly string[]).includes(entry.kind),
      )
      .map((entry) => ({
        kind: entry.kind as StoryEntryKind,
        slug: entry.slug,
        title: entry.title,
        summary: entry.summary,
        body: entry.body,
        meta: entry.meta && !Array.isArray(entry.meta) && typeof entry.meta === "object" ? entry.meta : null,
      })),
  };
}
