import path from "node:path";
import dotenv from "dotenv";
import { createPrismaClient } from "@habitat/db/client";
import { storyProseLinks } from "../lib/story-prose";
import { storyAtlasArtRegistered } from "../lib/story-atlas-art";
import { metaSchemasByKind } from "../lib/story-meta-schemas";
import { bloomfallCreatureEnhancementBySlug, renderBloomfallCreatureEnhancement } from "../lib/bloomfall-creature-enhancements";
import {
  bloomfallAberrants,
  bloomfallArcs,
  bloomfallCharacters,
  bloomfallCreatures,
  bloomfallEvents,
  bloomfallExpectedCounts,
  bloomfallMainRegion,
  bloomfallNewEntries,
  bloomfallPois,
  bloomfallRegionId,
  bloomfallResources,
  bloomfallScene,
  bloomfallSubregions,
  bloomfallSystems,
} from "../lib/bloomfall-reach-content";
import { resolveAtlasDevelopmentDatabaseUrl } from "../lib/atlas-development-database";
import { assertAtlasPersistentDevelopmentTarget, assertAtlasV2SchemaPresent } from "./lib/atlas-v2-activation";
import { stableAtlasJson } from "./lib/atlas-integrity";

const root = path.resolve(process.cwd(), "..", "..");
dotenv.config({ path: path.join(root, ".env"), quiet: true });
dotenv.config({ path: path.join(root, ".env.local"), override: true, quiet: true });
const developmentUrl = resolveAtlasDevelopmentDatabaseUrl(process.env);
if (!developmentUrl) throw new Error("Bloomfall content audit requires the guarded development database.");
const target = assertAtlasPersistentDevelopmentTarget(developmentUrl);
const db = createPrismaClient(developmentUrl);

const extensionSlugs = [
  "essence", "stormglass", "magic", "environment", "weather", "persistent-damage", "lasting-wounds", "gathering-and-harvest",
  "national-defense-directorate", "aegis-extraction-consortium", "meridian-arcane-institute", "wardens-monster-hunter-guild",
  "abomination-containment-authority", "peninsula-expeditionary-army", "stormglass-cartel", "verdant-marsh-clans", "helix-arcanobiotics",
] as const;

function jsonEqual(left: unknown, right: unknown) { return stableAtlasJson(left, false) === stableAtlasJson(right, false); }

async function main() {
  await assertAtlasV2SchemaPresent(db);
  const identity = await db.$queryRaw<Array<{ database: string; schema: string }>>`SELECT current_database() AS database, current_schema() AS schema`;
  if (identity[0]?.database !== "habitat_atlas_dev") throw new Error("Bloomfall audit independently verified the wrong database identity.");
  const failures: string[] = [];
  const check = (condition: unknown, message: string) => { if (!condition) failures.push(message); };
  const packageSlugs = bloomfallNewEntries.map((entry) => entry.slug);
  const [region, entries, extensions, arcs, scene, connections, allEntries, bloomfallPathCount, mainlineRegional, mainlinePackageLinks] = await Promise.all([
    db.storyEntry.findUnique({ where: { id: bloomfallRegionId } }),
    db.storyEntry.findMany({ where: { slug: { in: packageSlugs } }, orderBy: { slug: "asc" } }),
    db.storyEntry.findMany({ where: { slug: { in: [...extensionSlugs] } }, select: { slug: true, body: true, meta: true } }),
    db.storyArc.findMany({ where: { slug: { in: bloomfallArcs.map((arc) => arc.slug) } }, include: { faction: { select: { slug: true } }, nodes: { include: { entryLinks: { include: { entry: { select: { slug: true } } } } }, orderBy: { key: "asc" } }, edges: { orderBy: { key: "asc" } } }, orderBy: { slug: "asc" } }),
    db.storyMap.findUnique({ where: { slug: bloomfallScene.slug }, include: { parent: { select: { slug: true } }, placements: true, nodePlacements: true, topologyNodes: true, boundaries: true, connectionPaths: true } }),
    db.storyWorldConnection.findMany({ where: { OR: [{ fromEntryId: bloomfallRegionId }, { toEntryId: bloomfallRegionId }] }, include: { fromEntry: { select: { slug: true } }, toEntry: { select: { slug: true } }, paths: true }, orderBy: { type: "asc" } }),
    db.storyEntry.findMany({ select: { id: true, slug: true, body: true } }),
    db.storyMapConnectionPath.count({ where: { connection: { OR: [{ fromEntryId: bloomfallRegionId }, { toEntryId: bloomfallRegionId }] } } }),
    db.storyArc.count({ where: { isMainline: true, regionEntryId: bloomfallRegionId } }),
    db.storyEntryLink.count({ where: { entry: { slug: { in: ["bloomfall-reach", ...packageSlugs] } }, node: { arc: { isMainline: true } } } }),
  ]);

  check(region?.slug === "bloomfall-reach" && region.title === "Bloomfall Reach" && region.kind === "REGION" && region.status === "CANON", "Main Bloomfall Reach identity is missing or wrong.");
  check(region?.summary === bloomfallMainRegion.summary && region.body === bloomfallMainRegion.body && jsonEqual(region.meta, bloomfallMainRegion.meta), "Main Bloomfall Reach dossier drifted from the approved manifest.");
  check(entries.length === bloomfallNewEntries.length, `Expected ${bloomfallNewEntries.length} new canonical entries, found ${entries.length}.`);
  const storedBySlug = new Map(entries.map((entry) => [entry.slug, entry]));
  for (const seed of bloomfallNewEntries) {
    const stored = storedBySlug.get(seed.slug);
    check(Boolean(stored), `Missing canonical entry ${seed.slug}.`);
    if (!stored) continue;
    const enhancement = bloomfallCreatureEnhancementBySlug.get(seed.slug);
    const expectedBody = enhancement ? renderBloomfallCreatureEnhancement(enhancement) : seed.body;
    check(stored.kind === seed.kind && stored.title === seed.title && stored.summary === seed.summary && stored.body === expectedBody && stored.status === "CANON" && jsonEqual(stored.meta, seed.meta), `Canonical entry ${seed.slug} differs from its latest approved source manifest.`);
    const schema = metaSchemasByKind[seed.kind];
    if (schema) check(schema.safeParse(stored.meta).success, `${seed.slug} fails its typed metadata schema.`);
  }

  check(bloomfallSubregions.length === bloomfallExpectedCounts.subregions, "Subregion source count drifted.");
  check(bloomfallPois.length === bloomfallExpectedCounts.pois, "POI source count drifted.");
  check(bloomfallSystems.length === bloomfallExpectedCounts.systems, "System source count drifted.");
  check(bloomfallCharacters.length === bloomfallExpectedCounts.characters, "Character/entity source count drifted.");
  check(bloomfallCreatures.length === bloomfallExpectedCounts.creatures, "Creature-package source count drifted.");
  check(bloomfallAberrants.length === bloomfallExpectedCounts.aberrants, "Aberrant source count drifted.");
  check(bloomfallResources.length === bloomfallExpectedCounts.newResources, "New-resource source count drifted.");
  check(bloomfallEvents.length === bloomfallExpectedCounts.events, "Event source count drifted.");

  for (const slug of extensionSlugs) check(extensions.find((entry) => entry.slug === slug)?.body?.includes("Bloomfall Reach —") ?? false, `${slug} lacks its canonical Bloomfall cross-link block.`);
  const resourcePackage = ["essence", "stormglass", ...bloomfallResources.map((entry) => entry.slug)];
  check(new Set(resourcePackage).size === bloomfallExpectedCounts.resourcePackage, "Eight-resource package is incomplete or duplicated.");

  for (const creature of [...bloomfallCreatures, ...bloomfallAberrants]) {
    const meta = creature.meta as { parent?: unknown; category?: unknown; threat?: unknown };
    check(typeof meta.parent === "string" && meta.parent.length > 0, `${creature.slug} lacks a base taxonomy parent.`);
    check(meta.category !== "abomination", `${creature.slug} incorrectly uses Abomination taxonomy.`);
  }
  for (const aberrant of bloomfallAberrants) check(String((aberrant.meta as { threat?: unknown }).threat).includes("Bloomfall designation: Aberrant"), `${aberrant.slug} lacks bounded Aberrant designation metadata.`);
  check(storedBySlug.get("maintenance-unit-m-17")?.kind === "CHARACTER", "Mender is not stored in the approved entity taxonomy.");
  check(storedBySlug.get("bloommarked-remnant")?.kind === "CREATURE" && (storedBySlug.get("bloommarked-remnant")?.meta as { parent?: unknown } | null)?.parent === "human", "Bloommarked Remnant is not a Human-derived field classification.");

  check(arcs.length === bloomfallExpectedCounts.arcs, `Expected ${bloomfallExpectedCounts.arcs} regional arcs, found ${arcs.length}.`);
  const representedConcepts = new Set<string>();
  for (const seed of bloomfallArcs) {
    const arc = arcs.find((candidate) => candidate.slug === seed.slug);
    check(Boolean(arc), `Missing regional arc ${seed.slug}.`);
    if (!arc) continue;
    check(!arc.isMainline && arc.regionEntryId === bloomfallRegionId && arc.status === "CANON" && arc.category === seed.category, `${seed.slug} is not a canonical non-mainline regional arc.`);
    check(arc.nodes.length === seed.nodes.length && arc.edges.length === seed.edges.length, `${seed.slug} graph count drifted.`);
    check(arc.nodes.some((node) => node.key === "nobody-came" && node.kind === "ENDING" && node.status === "CANON"), `${seed.slug} lacks its Nobody Came ending.`);
    if (seed.factionSlug) check(arc.faction?.slug === seed.factionSlug, `${seed.slug} lacks its approved faction ownership.`);
    for (const concept of seed.concepts) representedConcepts.add(concept);
  }
  const expectedConcepts = ["the-last-safe-reading", "reserve-twelve", "the-purge-window", "a-ledger-with-two-owners", "the-bellwether-event", "root-of-the-bargain", "the-route-that-moves", "menders-work", "three-failure-reports", "black-tide-at-blackweir"];
  check(expectedConcepts.every((concept) => representedConcepts.has(concept)), "One or more approved regional story concepts is absent from the arc grouping.");
  check(mainlineRegional === 0 && mainlinePackageLinks === 0, "Bloomfall content is linked into a mainline arc.");

  const road = connections.find((connection) => connection.type === "ROAD" && new Set([connection.fromEntry.slug, connection.toEntry.slug]).has("riverlands"));
  const sea = connections.find((connection) => connection.type === "SEA_ROUTE" && new Set([connection.fromEntry.slug, connection.toEntry.slug]).has("the-ocean"));
  check(connections.length === bloomfallExpectedCounts.connections && road?.directionality === "BIDIRECTIONAL" && sea?.directionality === "BIDIRECTIONAL", "Approved Riverlands ROAD and Ocean SEA_ROUTE connections are not exact.");
  check(connections.every((connection) => connection.paths.length === 1) && bloomfallPathCount === 2, "Bloomfall does not have exactly the two approved local route paths.");
  check(!connections.some((connection) => connection.fromEntry.slug === "magic-torn-wasteland" || connection.toEntry.slug === "magic-torn-wasteland"), "A semantic Magic-Torn Wasteland route was invented.");

  check(Boolean(scene), "Bloomfall local Atlas scene foundation is missing.");
  if (scene) {
    check(scene.id === bloomfallScene.id && scene.parent?.slug === "martino-world" && scene.ownerEntryId === bloomfallRegionId && scene.artVersion === "v1", "Bloomfall local scene identity, parent, owner, or activation state drifted.");
    check(scene.imageWidth === 1536 && scene.imageHeight === 1024 && scene.coordinateWidth === 100000 && scene.coordinateHeight === 66667, "Bloomfall local scene dimensions drifted from the 3:2 contract.");
    check(scene.placements.length === 18 && scene.nodePlacements.length === 0 && scene.topologyNodes.length === 8 && scene.boundaries.length === 10 && scene.connectionPaths.length === 2, "Bloomfall local scene Atlas record counts drifted.");
    check(storyAtlasArtRegistered(scene.slug, scene.artVersion), "Approved Bloomfall local scene art is not registered.");
  }

  const allSlugs = new Set(allEntries.map((entry) => entry.slug));
  const extensionBodies = extensions.map((entry) => {
    const body = entry.body ?? "";
    const marker = body.indexOf("**Bloomfall Reach —");
    return marker < 0 ? "" : body.slice(marker);
  });
  const scopedBodies = [region?.body ?? "", ...entries.map((entry) => entry.body ?? ""), ...extensionBodies];
  const referenced = new Set(scopedBodies.flatMap(storyProseLinks));
  const brokenReferences = [...referenced].filter((slug) => !allSlugs.has(slug)).sort();
  check(brokenReferences.length === 0, `Broken Bloomfall prose references: ${brokenReferences.join(", ")}`);

  const incoming = new Map<string, number>();
  for (const body of scopedBodies) for (const slug of storyProseLinks(body)) incoming.set(slug, (incoming.get(slug) ?? 0) + 1);
  const linkedFromNodes = new Set(arcs.flatMap((arc) => arc.nodes.flatMap((node) => node.entryLinks.map((link) => link.entry.slug))));
  const major = [...bloomfallSubregions, ...bloomfallPois, ...bloomfallSystems, ...bloomfallCharacters, ...bloomfallCreatures, ...bloomfallAberrants, ...bloomfallResources];
  const orphanMajorEntries = major.filter((entry) => storyProseLinks(entry.body).length === 0 && (incoming.get(entry.slug) ?? 0) === 0 && !linkedFromNodes.has(entry.slug)).map((entry) => entry.slug);
  check(orphanMajorEntries.length === 0, `Orphan major Bloomfall entries: ${orphanMajorEntries.join(", ")}`);

  const report = {
    contract: "martino-bloomfall-reach-canonical-content-audit", contractVersion: 1, status: failures.length ? "FAIL" : "PASS",
    database: { ...target, schema: identity[0]?.schema },
    counts: { mainRegion: region ? 1 : 0, subregions: bloomfallSubregions.length, pois: bloomfallPois.length, systems: bloomfallSystems.length, charactersEntities: bloomfallCharacters.length, creatureConcepts: bloomfallCreatures.length, aberrants: bloomfallAberrants.length, resources: resourcePackage.length, events: bloomfallEvents.length, regionalArcs: arcs.length, approvedConnections: connections.length, routePaths: bloomfallPathCount },
    taxonomy: { blackbloomDistinctFromCorruption: region?.body?.includes("explicitly distinct") ?? false, aberrantIsDesignation: true, menderKind: storedBySlug.get("maintenance-unit-m-17")?.kind, bloommarkedParent: (storedBySlug.get("bloommarked-remnant")?.meta as { parent?: unknown } | null)?.parent },
    stories: { representedConcepts: [...representedConcepts].sort(), nobodyCameOutcomes: arcs.filter((arc) => arc.nodes.some((node) => node.key === "nobody-came")).length, mainlineArcsLinked: mainlineRegional, mainlineNodeLinks: mainlinePackageLinks },
    worldConnections: connections.map((connection) => ({ from: connection.fromEntry.slug, to: connection.toEntry.slug, type: connection.type, directionality: connection.directionality, paths: connection.paths.length })),
    localScene: scene ? { id: scene.id, slug: scene.slug, parent: scene.parent?.slug, ownerEntryId: scene.ownerEntryId, artVersion: scene.artVersion, playerArtRegistered: storyAtlasArtRegistered(scene.slug, scene.artVersion), geometryRecords: scene.placements.length + scene.nodePlacements.length + scene.topologyNodes.length + scene.boundaries.length + scene.connectionPaths.length } : null,
    crossLinks: { uniqueResolvedReferences: referenced.size - brokenReferences.length, brokenReferences, orphanMajorEntries }, failures,
    productionWrites: 0,
  };
  process.stdout.write(stableAtlasJson(report));
  if (failures.length) process.exitCode = 1;
}

void main().finally(() => db.$disconnect());
