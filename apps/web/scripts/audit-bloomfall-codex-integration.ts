import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import dotenv from "dotenv";
import { createPrismaClient } from "@habitat/db/client";
import { storyProseLinks } from "../lib/story-prose";
import { metaSchemasByKind } from "../lib/story-meta-schemas";
import { bloomfallCreatureEnhancements } from "../lib/bloomfall-creature-enhancements";
import { bloomfallAdaptiveP0Assets } from "../lib/bloomfall-adaptive-p0";
import { bloomfallAdaptiveP1P2Assets } from "../lib/bloomfall-adaptive-p1p2";
import { bloomfallV3CodexAssets, bloomfallV3ProductionPath } from "../lib/bloomfall-v3-art";
import {
  bloomfallAllCrossLinkBlocks,
  bloomfallCodexIntegrationContract,
  bloomfallCodexIntegrationVersion,
  bloomfallIntegrationExpectedBody,
  bloomfallIntegrationRecords,
  bloomfallIntegrationReferencedSlugs,
  bloomfallRouteRecords,
  bloomfallSystemPages,
} from "../lib/bloomfall-codex-integration";
import { bloomfallPois, bloomfallRegionId, bloomfallResources } from "../lib/bloomfall-reach-content";
import { assertAtlasPersistentDevelopmentTarget, assertAtlasV2SchemaPresent } from "./lib/atlas-v2-activation";
import { stableAtlasJson } from "./lib/atlas-integrity";

/**
 * The repeatable Bloomfall Codex integration audit.
 *
 * It answers one question in a way a person can check: does the development
 * Codex actually read as one connected Bloomfall, or has some part of the
 * package drifted back into a stack of unlinked pages? Everything it asserts
 * is either an exact comparison against the reviewed manifest or a structural
 * fact about the stored records.
 */

const root = path.resolve(process.cwd(), "..", "..");
dotenv.config({ path: path.join(root, ".env"), quiet: true });
dotenv.config({ path: path.join(root, ".env.local"), override: true, quiet: true });

const developmentUrl = (() => {
  const source = process.env.DATABASE_URL;
  if (process.env.HABITAT_ENVIRONMENT !== "development") throw new Error("The Bloomfall Codex integration audit requires HABITAT_ENVIRONMENT=development.");
  if (!source) throw new Error("The Bloomfall Codex integration audit requires a base DATABASE_URL.");
  const url = new URL(source);
  if (!["localhost", "127.0.0.1", "::1"].includes(url.hostname.toLowerCase())) throw new Error("The Bloomfall Codex integration audit requires a loopback PostgreSQL base URL.");
  url.pathname = "/habitat_atlas_dev";
  return url.toString();
})();

const target = assertAtlasPersistentDevelopmentTarget(developmentUrl);
const db = createPrismaClient(developmentUrl);

const routeManifestPath = path.join(root, "Docs", "bloomfall-routes", "bloomfall-route-status-manifest.json");

const bannedSpellings = ["Bloom Storm", "Bloom-storm", "Shatter Core", "Black Bloom", "Aberrent", "Mutation-Belt", "Living-Marsh"];

const canonicalTerms = [
  "Bloomfall Reach", "Blackbloom", "Shattercore", "Mutation Belt", "Living Marsh",
  "Southreach", "Essence Saturation", "Adaptive Mutation", "Bloomstorm", "Aberrant",
];

function jsonEqual(left: unknown, right: unknown) { return stableAtlasJson(left, false) === stableAtlasJson(right, false); }

function withoutVisualArt(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return value;
  const rest = { ...(value as Record<string, unknown>) };
  delete rest.visualArt;
  return rest;
}

async function main() {
  await assertAtlasV2SchemaPresent(db);
  const identity = await db.$queryRaw<Array<{ database: string; schema: string }>>`SELECT current_database() AS database, current_schema() AS schema`;
  if (identity[0]?.database !== "habitat_atlas_dev") throw new Error("The Bloomfall Codex integration audit independently verified the wrong database.");

  const failures: string[] = [];
  const check = (condition: unknown, message: string) => { if (!condition) failures.push(message); };

  const [allEntries, systems, mainlineLinks, magicTornConnections] = await Promise.all([
    db.storyEntry.findMany({ select: { id: true, slug: true, kind: true, title: true, summary: true, body: true, meta: true, status: true } }),
    db.storyEntry.findMany({ where: { kind: "SYSTEM" }, select: { slug: true, title: true, meta: true } }),
    db.storyEntryLink.count({ where: { entry: { slug: { in: [...bloomfallIntegrationRecords.map((record) => record.slug), ...bloomfallAllCrossLinkBlocks.map((block) => block.slug)] } }, node: { arc: { isMainline: true } } } }),
    db.storyWorldConnection.count({ where: { OR: [
      { fromEntry: { slug: "magic-torn-wasteland" }, toEntryId: bloomfallRegionId },
      { toEntry: { slug: "magic-torn-wasteland" }, fromEntryId: bloomfallRegionId },
    ] } }),
  ]);
  const bySlug = new Map(allEntries.map((entry) => [entry.slug, entry]));
  const slugSet = new Set(allEntries.map((entry) => entry.slug));

  // 1. The seven system dossiers exist and match the reviewed manifest exactly.
  for (const record of bloomfallIntegrationRecords) {
    const stored = bySlug.get(record.slug);
    check(Boolean(stored), `Missing system dossier ${record.slug}.`);
    if (!stored) continue;
    check(stored.kind === "SYSTEM" && stored.status === "CANON", `${record.slug} is not a canon SYSTEM record.`);
    check(stored.title === record.title, `${record.slug} title drifted.`);
    check(stored.summary === record.summary, `${record.slug} summary drifted.`);
    check(stored.body === record.body, `${record.slug} body differs from the reviewed integration manifest.`);
    check(jsonEqual(withoutVisualArt(stored.meta), record.meta), `${record.slug} metadata differs from the reviewed integration manifest.`);
    check(metaSchemasByKind.SYSTEM!.safeParse(stored.meta).success, `${record.slug} no longer satisfies StorySystemMeta.`);
    const meta = stored.meta as { buildStatus?: unknown; unlockStage?: unknown } | null;
    check(meta?.buildStatus === "concept", `${record.slug} claims a build status beyond concept.`);
    check(/Future gameplay design/i.test(String(meta?.unlockStage)), `${record.slug} does not carry the future-gameplay unlock stage.`);
  }

  // 2. No duplicate or competing Bloomfall system records.
  const bloomfallSystemSlugs = new Set(bloomfallSystemPages.map((page) => page.slug));
  const stormLike = systems.filter((system) => /bloomstorm/i.test(system.title) && system.slug !== "bloomstorms");
  const travelLike = systems.filter((system) => /bloomfall travel/i.test(system.title) && system.slug !== "bloomfall-travel");
  check(stormLike.length === 0, `Duplicate Bloomstorm system records: ${stormLike.map((system) => system.slug).join(", ")}`);
  check(travelLike.length === 0, `Duplicate Bloomfall travel records: ${travelLike.map((system) => system.slug).join(", ")}`);
  check(new Set(systems.map((system) => system.slug)).size === systems.length, "Duplicate SYSTEM slugs exist.");

  // 3. Every cross-link block landed, and nothing else moved.
  for (const block of bloomfallAllCrossLinkBlocks) {
    const stored = bySlug.get(block.slug);
    check(Boolean(stored), `Missing cross-link target ${block.slug}.`);
    if (!stored) continue;
    check(stored.body === bloomfallIntegrationExpectedBody(block.slug), `${block.slug} does not carry its approved cross-link block.`);
  }

  // 4. Every one of the fifteen POIs is reachable from a Bloomfall system.
  const poiCoverage = bloomfallPois.map((poi) => {
    const owners = bloomfallSystemPages.filter((page) => page.regionNotes.some((note) => note.region === poi.slug)).map((page) => page.slug);
    return { slug: poi.slug, systems: owners };
  });
  const uncoveredPois = poiCoverage.filter((row) => row.systems.length === 0).map((row) => row.slug);
  check(bloomfallPois.length === 15, `Expected 15 Bloomfall POIs, found ${bloomfallPois.length}.`);
  check(uncoveredPois.length === 0, `POIs with no system relationship: ${uncoveredPois.join(", ")}`);

  // 5. Every classified creature or entity links out to at least one system.
  const creatureCoverage = bloomfallCreatureEnhancements.map((enhancement) => {
    const stored = bySlug.get(enhancement.slug);
    const outbound = storyProseLinks(stored?.body ?? "");
    return {
      slug: enhancement.slug,
      eligibility: enhancement.mutationEligibility,
      classification: enhancement.classification,
      systems: outbound.filter((slug) => bloomfallSystemSlugs.has(slug)),
      outbound: outbound.length,
      explicitNone: (stored?.body ?? "").includes("Classification: NONE"),
    };
  });
  const deadEnds = creatureCoverage.filter((row) => row.systems.length === 0).map((row) => row.slug);
  check(deadEnds.length === 0, `Creature dossiers with no system link: ${deadEnds.join(", ")}`);
  // Glasswing Kite, Spore Lantern Colony, Bloommarked Remnant, and Mender.
  // The named Aberrants also carry NONE eligibility, but their classification
  // is the designation, and their dossiers must not read as a missing ladder.
  const noneSpecies = creatureCoverage.filter((row) => row.classification === "NONE");
  const implicitNone = noneSpecies.filter((row) => !row.explicitNone).map((row) => row.slug);
  check(noneSpecies.length === 4, `Expected 4 explicit NONE classifications, found ${noneSpecies.length}.`);
  check(implicitNone.length === 0, `NONE species without an explicit classification statement: ${implicitNone.join(", ")}`);

  // 6. The four named Aberrants are reachable from the threat dossier.
  const aberrantSlugs = bloomfallCreatureEnhancements.filter((entry) => entry.classification === "EXCEPTIONAL_ABERRANT").map((entry) => entry.slug);
  const aberrantPage = bySlug.get("aberrant-escalation");
  const aberrantLinks = storyProseLinks(aberrantPage?.body ?? "");
  const missingAberrants = aberrantSlugs.filter((slug) => !aberrantLinks.includes(slug));
  check(aberrantSlugs.length === 4, `Expected 4 named Aberrants, found ${aberrantSlugs.length}.`);
  check(missingAberrants.length === 0, `Named Aberrants missing from the threat dossier: ${missingAberrants.join(", ")}`);

  // 7. Every canonical resource reaches a Bloomfall system.
  const resourcePackage = ["essence", "stormglass", ...bloomfallResources.map((entry) => entry.slug)];
  const resourceCoverage = resourcePackage.map((slug) => ({
    slug,
    systems: storyProseLinks(bySlug.get(slug)?.body ?? "").filter((link) => bloomfallSystemSlugs.has(link) || ["marsh-absorption", "blackbloom-exposure", "bloomfall-environmental-hazards"].includes(link)),
  }));
  const unlinkedResources = resourceCoverage.filter((row) => row.systems.length === 0).map((row) => row.slug);
  check(resourcePackage.length === 8, `Expected the eight-resource package, found ${resourcePackage.length}.`);
  check(unlinkedResources.length === 0, `Resources with no system relationship: ${unlinkedResources.join(", ")}`);

  // 8. Route parity with the route status manifest.
  check(existsSync(routeManifestPath), "The Bloomfall route status manifest is missing.");
  const routeManifest = existsSync(routeManifestPath)
    ? JSON.parse(readFileSync(routeManifestPath, "utf8")) as { counts: Record<string, number>; routes: Array<{ key: string; classification: string }> }
    : { counts: {}, routes: [] };
  const manifestByKey = new Map(routeManifest.routes.map((route) => [route.key, route.classification]));
  const routeMismatches = bloomfallRouteRecords.filter((route) => manifestByKey.get(route.key) !== route.classKey).map((route) => route.key);
  check(bloomfallRouteRecords.length === routeManifest.routes.length, `Route count differs from the manifest: ${bloomfallRouteRecords.length} vs ${routeManifest.routes.length}.`);
  check(routeMismatches.length === 0, `Route classifications differ from the manifest: ${routeMismatches.join(", ")}`);
  const classCounts = { PERMANENT: 0, CONDITIONAL: 0, DYNAMIC: 0, DEFERRED: 0 };
  for (const route of bloomfallRouteRecords) classCounts[route.classKey] += 1;
  check(classCounts.PERMANENT === 1 && classCounts.CONDITIONAL === 3 && classCounts.DYNAMIC === 5 && classCounts.DEFERRED === 3, `Route class counts drifted: ${stableAtlasJson(classCounts, false)}`);
  check(bloomfallRouteRecords.filter((route) => route.persisted).length === 4, "The Codex no longer agrees that exactly four Bloomfall routes are drawn.");

  // 9. Magic-Torn stays adjacency only.
  check(magicTornConnections === 0, `A Bloomfall to Magic-Torn world connection exists (${magicTornConnections}).`);
  const travelBody = bySlug.get("bloomfall-travel")?.body ?? "";
  check(/geographic adjacency only/i.test(travelBody), "The travel dossier no longer states that the Magic-Torn border is adjacency only.");
  check(!/road to \[\[magic-torn-wasteland\]\]|trail to \[\[magic-torn-wasteland\]\]/i.test(travelBody), "The travel dossier implies a Magic-Torn route.");

  // 10. Nothing this phase touched is wired into the mainline.
  check(mainlineLinks === 0, `Bloomfall integration content is linked into a mainline arc (${mainlineLinks}).`);

  // 11. No broken references anywhere in the integration.
  const scopedBodies = [
    ...bloomfallIntegrationRecords.map((record) => record.body),
    ...bloomfallAllCrossLinkBlocks.map((block) => bySlug.get(block.slug)?.body ?? ""),
  ];
  const referenced = new Set(scopedBodies.flatMap(storyProseLinks));
  for (const slug of bloomfallIntegrationReferencedSlugs()) referenced.add(slug);
  const brokenReferences = [...referenced].filter((slug) => !slugSet.has(slug)).sort();
  check(brokenReferences.length === 0, `Broken Bloomfall references: ${brokenReferences.join(", ")}`);

  // 12. Image bindings: approved sets present, superseded sets unreferenced.
  const v3Missing = bloomfallV3CodexAssets.filter((asset) => !existsSync(path.join(process.cwd(), bloomfallV3ProductionPath(asset))));
  const v3Unbound = bloomfallV3CodexAssets.filter((asset) => !slugSet.has(asset.entrySlug));
  check(v3Missing.length === 0, `Approved V3 Codex art missing on disk: ${v3Missing.map((asset) => asset.filename).join(", ")}`);
  check(v3Unbound.length === 0, `V3 Codex art bound to entries that do not exist: ${v3Unbound.map((asset) => asset.entrySlug).join(", ")}`);
  const adaptiveAssets = [...bloomfallAdaptiveP0Assets, ...bloomfallAdaptiveP1P2Assets];
  const adaptiveBound = adaptiveAssets.filter((asset) => asset.codexDevelopmentBinding !== null);
  const adaptiveUnknownEntity = adaptiveBound.filter((asset) => !slugSet.has(asset.entitySlug)).map((asset) => asset.entitySlug);
  check(adaptiveUnknownEntity.length === 0, `Adaptive art bound to entries that do not exist: ${[...new Set(adaptiveUnknownEntity)].join(", ")}`);
  // State art is verified through the Codex binding rather than the asset
  // purpose: the manifests deliberately retain superseded revision attempts,
  // and those carry no binding. A bound state must be unique and in range.
  const stateBindings = new Map<string, number[]>();
  const duplicateBindings: string[] = [];
  const seenBindings = new Set<string>();
  for (const asset of adaptiveBound) {
    const binding = asset.codexDevelopmentBinding!;
    if (seenBindings.has(binding)) duplicateBindings.push(binding);
    seenBindings.add(binding);
    const match = /^([a-z0-9-]+):known-states:(\d+)$/.exec(binding);
    if (!match) continue;
    const indexes = stateBindings.get(match[1]!) ?? [];
    indexes.push(Number(match[2]));
    stateBindings.set(match[1]!, indexes);
  }
  check(duplicateBindings.length === 0, `Duplicate Codex art bindings: ${[...new Set(duplicateBindings)].join(", ")}`);
  const stateMismatches = bloomfallCreatureEnhancements
    .filter((entry) => entry.classification !== "EXCEPTIONAL_ABERRANT" && entry.mutationEligibility !== "NONE")
    .flatMap((entry) => {
      const indexes = (stateBindings.get(entry.slug) ?? []).sort((left, right) => left - right);
      const expected = entry.states.map((_, index) => index);
      return jsonEqual(indexes, expected) ? [] : [`${entry.slug} expected states ${expected.join(",")}, bound ${indexes.join(",") || "none"}`];
    });
  check(stateMismatches.length === 0, `Adaptive state art bindings differ from the classification: ${stateMismatches.join("; ")}`);
  const supersededDirectories = ["v2", "v3-reset"].filter((directory) => {
    const candidate = path.join(process.cwd(), "private", "codex-art", "bloomfall", directory);
    return existsSync(candidate);
  });
  const supersededServed = supersededDirectories.filter((directory) => {
    const served = path.join(process.cwd(), "private", "codex-art", `bloomfall-${directory}`);
    return existsSync(served);
  });
  check(supersededServed.length === 0, `A superseded Bloomfall art set is exposed through a served package: ${supersededServed.join(", ")}`);

  // 13. Terminology.
  const terminologyBodies = scopedBodies.join("\n");
  const bannedFound = bannedSpellings.filter((banned) => terminologyBodies.includes(banned));
  check(bannedFound.length === 0, `Off-canon spellings in Bloomfall prose: ${bannedFound.join(", ")}`);
  const missingTerms = canonicalTerms.filter((term) => !terminologyBodies.includes(term));
  check(missingTerms.length === 0, `Canonical Bloomfall terms absent from the integration prose: ${missingTerms.join(", ")}`);

  // 14. The terms a reader would actually type reach the right dossier. This
  // repeats the Codex library's own query shape rather than approximating it.
  const searchTerms: Array<{ term: string; mustReach: string }> = [
    { term: "Adaptive Mutation", mustReach: "adaptive-mutation" },
    { term: "Blackbloom", mustReach: "blackbloom-exposure" },
    { term: "Bloomstorm", mustReach: "bloomstorms" },
    { term: "Essence Saturation", mustReach: "essence-saturation" },
    { term: "Aberrant", mustReach: "aberrant-escalation" },
    { term: "Bellwether", mustReach: "the-bellwether" },
    { term: "Latchhound", mustReach: "latchhound" },
    { term: "Southreach", mustReach: "southreach-complex" },
    { term: "Heartfen", mustReach: "heartfen" },
    { term: "Conditional route", mustReach: "bloomfall-travel" },
  ];
  const searchResults = await Promise.all(searchTerms.map(async ({ term, mustReach }) => {
    const hits = await db.storyEntry.findMany({
      where: { OR: [
        { title: { contains: term, mode: "insensitive" } },
        { summary: { contains: term, mode: "insensitive" } },
        { body: { contains: term, mode: "insensitive" } },
      ] },
      select: { slug: true },
    });
    const slugs = hits.map((hit) => hit.slug);
    check(slugs.includes(mustReach), `A Codex search for "${term}" does not reach ${mustReach}.`);
    return { term, results: slugs.length, reaches: mustReach, found: slugs.includes(mustReach) };
  }));

  // 15. Geographic hierarchy stays top-level.
  const region = allEntries.find((entry) => entry.id === bloomfallRegionId);
  const regionMeta = region?.meta as { parent?: unknown } | null;
  check(region?.slug === "bloomfall-reach" && regionMeta?.parent === null, "Bloomfall Reach is no longer a top-level region.");

  const report = {
    contract: `${bloomfallCodexIntegrationContract}-audit`,
    contractVersion: bloomfallCodexIntegrationVersion,
    status: failures.length ? "FAIL" : "PASS",
    database: { ...target, schema: identity[0]?.schema },
    systemPages: bloomfallIntegrationRecords.map((record) => ({ slug: record.slug, authoring: record.authoring, title: record.title })),
    counts: {
      systemPages: bloomfallIntegrationRecords.length,
      crossLinkBlocks: bloomfallAllCrossLinkBlocks.length,
      pois: bloomfallPois.length,
      poisWithSystemRelationship: poiCoverage.filter((row) => row.systems.length > 0).length,
      classifiedCreatures: bloomfallCreatureEnhancements.length,
      creatureDossiersLinkedToSystems: creatureCoverage.filter((row) => row.systems.length > 0).length,
      explicitNoneSpecies: noneSpecies.length,
      namedAberrants: aberrantSlugs.length,
      resources: resourcePackage.length,
      resourcesLinkedToSystems: resourceCoverage.filter((row) => row.systems.length > 0).length,
      routes: bloomfallRouteRecords.length,
      routesDrawn: bloomfallRouteRecords.filter((route) => route.persisted).length,
      v3CodexAssets: bloomfallV3CodexAssets.length,
      adaptiveBoundAssets: adaptiveBound.length,
    },
    routeClasses: classCounts,
    search: searchResults,
    integrity: {
      brokenReferences,
      duplicateSystemEntries: stormLike.length + travelLike.length,
      missingImages: v3Missing.length,
      supersededImageBindings: supersededServed.length,
      mainlineLinks,
      magicTornConnections,
    },
    productionWrites: 0,
    failures,
  };
  process.stdout.write(stableAtlasJson(report));
  if (failures.length) process.exitCode = 1;
}

void main().finally(() => db.$disconnect());
