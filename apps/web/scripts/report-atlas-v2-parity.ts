import "../lib/environment";
import { createPrismaClient } from "@habitat/db/client";
import { stableAtlasJson } from "./lib/atlas-integrity";
import { assertAtlasV2ActivationTarget } from "./lib/atlas-v2-activation";

const sourceUrl = process.env.DATABASE_URL;
const targetUrl = process.env.ATLAS_V2_ACTIVATION_DATABASE_URL;
if (!sourceUrl || !targetUrl) throw new Error("DATABASE_URL and explicit ATLAS_V2_ACTIVATION_DATABASE_URL are required.");
const identity = assertAtlasV2ActivationTarget(sourceUrl, targetUrl);
const database = createPrismaClient(targetUrl);

async function main() {
  const world = await database.storyMap.findUnique({
    where: { slug: "martino-world" },
    include: {
      children: { select: { slug: true, ownerEntryId: true } },
      placements: { orderBy: { id: "asc" }, include: { entry: { select: { id: true, slug: true, title: true } }, areaRings: { select: { id: true } } } },
      nodePlacements: { orderBy: { id: "asc" }, select: { id: true, nodeId: true, geometry: true } },
    },
  });
  if (!world) throw new Error("World map is unavailable.");
  const [connections, paths] = await Promise.all([database.storyWorldConnection.count(), database.storyMapConnectionPath.count()]);
  const differences: Array<{ classification: "EXPECTED_V2_CHANGE" | "POTENTIAL_REGRESSION" | "V1_ONLY_COMPATIBILITY" | "V2_NEW_CAPABILITY"; key: string; detail: string }> = [];
  const topologyPlacements = world.placements.filter((placement) => placement.areaRings.length > 0);
  const pointPlacements = world.placements.filter((placement) => placement.areaRings.length === 0);
  for (const placement of topologyPlacements) differences.push({ classification: "EXPECTED_V2_CHANGE", key: placement.entry.slug, detail: "V1 independent polygon remains stored while V2 derives shared-topology geometry for rendering." });
  const expectedTopology = new Set(["the-desert", "grand-rift", "the-red-forest", "high-cliffs", "riverlands", "magic-torn-wasteland", "unknown-southeast", "the-peninsula", "grand-lake", "death-canyon"]);
  for (const slug of expectedTopology) if (!topologyPlacements.some((placement) => placement.entry.slug === slug)) differences.push({ classification: "POTENTIAL_REGRESSION", key: slug, detail: "Approved topology placement is missing." });
  for (const child of world.children) if (!child.ownerEntryId || !world.placements.some((placement) => placement.entryId === child.ownerEntryId)) differences.push({ classification: "POTENTIAL_REGRESSION", key: child.slug, detail: "Child scene has no preserved world anchor." });
  differences.push({ classification: "V2_NEW_CAPABILITY", key: "shared-topology", detail: `${topologyPlacements.length} exact geographic regions with hierarchy, neighbors, bounds, and hit geometry.` });
  differences.push({ classification: "V2_NEW_CAPABILITY", key: "death-canyon", detail: "Nested Grand Rift → Death Canyon hierarchy." });
  differences.push({ classification: "V1_ONLY_COMPATIBILITY", key: "legacy-data", detail: "StoryMapPlacement.geometry and REGION.meta.connections remain the V1 compatibility authorities." });
  const pointReview = pointPlacements.filter((placement) => placement.geometryKind === "POINT").map((placement) => ({ slug: placement.entry.slug, coordinate: (placement.geometry as { coordinates?: unknown }).coordinates, status: "VISUAL_REVIEW_REQUIRED_ON_V2_RASTER" as const, correctionApplied: false }));
  const report = {
    contract: "martino-atlas-v1-v2-parity", contractVersion: 1, identity,
    counts: { v1PlacePlacements: world.placements.length, v1QuestPlacements: world.nodePlacements.length, v2Regions: topologyPlacements.length, v2Points: pointPlacements.length, v2QuestPlacements: world.nodePlacements.length, v2Connections: connections, v2ConnectionPaths: paths, childScenes: world.children.length },
    differences, potentialRegressions: differences.filter((difference) => difference.classification === "POTENTIAL_REGRESSION").length, pointReview,
    deepLinks: ["/codex/map", "/codex/bible/[slug]", "/codex/arc/[slug]", "/codex/bible/arcadian-soverign-guard"],
  };
  if (report.potentialRegressions) throw new Error(stableAtlasJson(report));
  process.stdout.write(stableAtlasJson(report));
}

void main().finally(() => database.$disconnect());
