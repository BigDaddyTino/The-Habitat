import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { isValidStoryKey } from "@habitat/shared";
import { metaSchemasByKind } from "./story-meta-schemas";
import { storyProseLinks } from "./story-prose";
import { bloomfallCreatureEnhancements } from "./bloomfall-creature-enhancements";
import { bloomfallPois, bloomfallResources } from "./bloomfall-reach-content";
import {
  bloomfallAllCrossLinkBlocks,
  bloomfallCrossLinkBlockBySlug,
  bloomfallFutureGameplayNotice,
  bloomfallHarvestClasses,
  bloomfallHarvestPressureBands,
  bloomfallIntegrationBaselineBody,
  bloomfallIntegrationExpectedBody,
  bloomfallIntegrationNewSlugs,
  bloomfallIntegrationRecords,
  bloomfallIntegrationUpgradedSlugs,
  bloomfallIntelStates,
  bloomfallMobilityClasses,
  bloomfallReactorStates,
  bloomfallRelationshipDiagram,
  bloomfallRouteClasses,
  bloomfallRouteKnowledgeStates,
  bloomfallRouteRecords,
  bloomfallSaturationBands,
  bloomfallStormStages,
  bloomfallSystemPages,
} from "./bloomfall-codex-integration";

const routeManifest = JSON.parse(readFileSync(path.resolve(process.cwd(), "..", "..", "Docs", "bloomfall-routes", "bloomfall-route-status-manifest.json"), "utf8")) as {
  counts: Record<string, number>;
  routes: Array<{ key: string; classification: string; persisted: boolean }>;
};

test("the integration authors exactly the seven Bloomfall system pages", () => {
  assert.deepEqual(bloomfallSystemPages.map((page) => page.slug), [
    "essence-saturation", "reactor-cycles", "adaptive-mutation", "bloomstorms",
    "harvesting-consequences", "aberrant-escalation", "bloomfall-travel",
  ]);
  assert.deepEqual(bloomfallIntegrationNewSlugs, ["bloomstorms", "bloomfall-travel"]);
  assert.equal(bloomfallIntegrationUpgradedSlugs.length, 5);
  assert.equal(bloomfallIntegrationRecords.length, 7);
});

test("every system record satisfies its typed sheet and refuses to claim a runtime", () => {
  for (const record of bloomfallIntegrationRecords) {
    assert.equal(metaSchemasByKind.SYSTEM!.safeParse(record.meta).success, true, record.slug);
    const meta = record.meta as { buildStatus: unknown; unlockStage: unknown };
    assert.equal(meta.buildStatus, "concept", record.slug);
    assert.match(String(meta.unlockStage), /Future gameplay design/i, record.slug);
    assert.ok(record.body.includes(bloomfallFutureGameplayNotice), `${record.slug} states its implementation status`);
    assert.match(record.body, /## Related in the Codex/, record.slug);
  }
});

test("every reference the integration writes is a real slug in the supported markup", () => {
  const bodies = [...bloomfallIntegrationRecords.map((record) => record.body), ...bloomfallAllCrossLinkBlocks.map((block) => block.block)];
  for (const body of bodies) {
    // The prose parser understands [[slug]] only; a piped label renders raw.
    assert.equal(/\[\[[a-z0-9-]+\|/.test(body), false, "no unsupported piped links");
    for (const slug of storyProseLinks(body)) assert.equal(isValidStoryKey(slug), true, slug);
  }
  for (const record of bloomfallIntegrationRecords) {
    const meta = record.meta as { parent: string; dependsOn: string[]; regionNotes: Array<{ region: string }> };
    assert.equal(isValidStoryKey(meta.parent), true, `${record.slug} parent`);
    for (const slug of meta.dependsOn) assert.equal(isValidStoryKey(slug), true, `${record.slug} dependsOn ${slug}`);
    for (const note of meta.regionNotes) assert.equal(isValidStoryKey(note.region), true, `${record.slug} regionNote ${note.region}`);
  }
});

test("a system never depends on itself and never parents itself", () => {
  for (const page of bloomfallSystemPages) {
    assert.equal(page.dependsOn.includes(page.slug), false, page.slug);
    assert.notEqual(page.parent, page.slug, page.slug);
    assert.equal(page.related.systems.includes(page.slug), false, page.slug);
  }
});

test("the canonical band, state, tier, stage, and class vocabularies are exact", () => {
  assert.deepEqual(bloomfallSaturationBands.map((band) => band.key), ["RESIDUAL", "ACTIVE", "SURGE", "BLOOMSTORM"]);
  assert.deepEqual(bloomfallReactorStates.map((state) => state.key), [
    "DORMANT_INTERVAL", "STABILIZATION", "SECTOR_RESTART", "VENTING", "PURGE", "OVERFLOW", "CONTAINMENT_BREACH",
  ]);
  assert.deepEqual(bloomfallReactorStates.filter((state) => state.frequencyClass === "NORMAL_CYCLE").map((state) => state.key), ["DORMANT_INTERVAL", "STABILIZATION", "SECTOR_RESTART", "VENTING"]);
  assert.deepEqual(bloomfallReactorStates.filter((state) => state.frequencyClass === "RARE_CONTROLLED").map((state) => state.key), ["PURGE"]);
  assert.deepEqual(bloomfallReactorStates.filter((state) => state.frequencyClass === "FAILURE").map((state) => state.key), ["OVERFLOW", "CONTAINMENT_BREACH"]);
  assert.deepEqual(bloomfallStormStages.map((stage) => stage.key), ["WARNING", "ONSET", "PEAK", "DECAY", "AFTERMATH"]);
  assert.deepEqual(bloomfallHarvestClasses.map((entry) => entry.key), ["INERT_SALVAGE", "REGENERATIVE_TAKE", "FUNCTIONAL_HARVEST", "SINK_HARVEST", "BREACH_EXTRACTION"]);
  assert.deepEqual(bloomfallHarvestPressureBands.map((band) => band.key), ["LIGHT", "WORKED", "STRESSED", "CRITICAL"]);
  assert.deepEqual(bloomfallIntelStates.map((state) => state.key), ["RUMORED", "TRACKED", "CONFIRMED", "LOST"]);
  assert.deepEqual(bloomfallRouteKnowledgeStates.map((state) => state.key), ["KNOWN_OPEN", "KNOWN_CLOSED", "HAZARDOUS", "UNVERIFIED", "LOST"]);
});

test("the route presentation matches the authored route status manifest exactly", () => {
  assert.equal(bloomfallRouteRecords.length, routeManifest.routes.length);
  const manifestByKey = new Map(routeManifest.routes.map((route) => [route.key, route]));
  for (const route of bloomfallRouteRecords) {
    const source = manifestByKey.get(route.key);
    assert.ok(source, `${route.key} exists in the route manifest`);
    assert.equal(route.classKey, source.classification, route.key);
    assert.equal(route.persisted, source.persisted === true, route.key);
  }
  assert.equal(bloomfallRouteRecords.filter((route) => route.classKey === "PERMANENT").length, routeManifest.counts.PERMANENT);
  assert.equal(bloomfallRouteRecords.filter((route) => route.classKey === "CONDITIONAL").length, routeManifest.counts.CONDITIONAL);
  assert.equal(bloomfallRouteRecords.filter((route) => route.classKey === "DYNAMIC").length, routeManifest.counts.DYNAMIC);
  assert.equal(bloomfallRouteRecords.filter((route) => route.classKey === "DEFERRED").length, routeManifest.counts.DEFERRED);
  assert.deepEqual(bloomfallRouteClasses.map((entry) => entry.key), ["PERMANENT", "CONDITIONAL", "DYNAMIC", "DEFERRED"]);
});

test("the Magic-Torn border is documented as adjacency and never as a route", () => {
  const travel = bloomfallSystemPages.find((page) => page.slug === "bloomfall-travel");
  assert.ok(travel);
  assert.match(travel.canonRule, /geographic adjacency only/i);
  const magicTorn = bloomfallRouteRecords.find((route) => route.key === "magic-torn-adjacency");
  assert.equal(magicTorn?.classKey, "DEFERRED");
  assert.equal(magicTorn?.persisted, false);
  for (const record of bloomfallIntegrationRecords) {
    assert.equal(/road|trail|passage/i.test(record.body.split("[[magic-torn-wasteland]]")[1]?.slice(0, 40) ?? ""), false, record.slug);
  }
});

test("every Bloomfall POI is reachable from at least one system", () => {
  const covered = new Set(bloomfallSystemPages.flatMap((page) => page.regionNotes.map((note) => note.region)));
  const uncovered = bloomfallPois.filter((poi) => !covered.has(poi.slug)).map((poi) => poi.slug);
  assert.deepEqual(uncovered, []);
  assert.equal(bloomfallPois.length, 15);
});

test("every classified creature and every canonical resource gains a system relationship", () => {
  const systemSlugs = new Set(bloomfallSystemPages.map((page) => page.slug));
  for (const enhancement of bloomfallCreatureEnhancements) {
    const block = bloomfallCrossLinkBlockBySlug.get(enhancement.slug);
    assert.ok(block, `${enhancement.slug} has a cross-link block`);
    const links = storyProseLinks(block.block);
    assert.ok(links.some((slug) => systemSlugs.has(slug)), `${enhancement.slug} links a Bloomfall system`);
    assert.equal(links.includes(enhancement.slug), false, `${enhancement.slug} does not link itself`);
  }
  for (const resource of bloomfallResources) {
    const block = bloomfallCrossLinkBlockBySlug.get(resource.slug);
    assert.ok(block, `${resource.slug} has a harvest-class block`);
    assert.match(block.block, /Harvest class/);
  }
});

test("the Adaptive Mutation index covers every classified entity exactly once", () => {
  const page = bloomfallSystemPages.find((entry) => entry.slug === "adaptive-mutation");
  assert.ok(page);
  const listed = [...page.related.creatures, ...page.related.people.filter((slug) => slug === "maintenance-unit-m-17")];
  for (const enhancement of bloomfallCreatureEnhancements) {
    assert.ok(listed.includes(enhancement.slug), `${enhancement.slug} appears on the Adaptive Mutation page`);
  }
  assert.equal(new Set(listed).size, listed.length);
});

test("all four named Aberrants and all four mobility profiles line up", () => {
  const named = bloomfallCreatureEnhancements.filter((entry) => entry.classification === "EXCEPTIONAL_ABERRANT").map((entry) => entry.slug).sort();
  assert.deepEqual(named, ["old-drowner", "switchmother", "the-bellwether", "the-last-shift"]);
  assert.deepEqual([...bloomfallMobilityClasses].map((entry) => entry.holder).sort(), named);
  const dossier = bloomfallIntegrationRecords.find((entry) => entry.slug === "aberrant-escalation");
  for (const slug of named) assert.ok(storyProseLinks(dossier!.body).includes(slug), `${slug} is linked from the threat dossier`);
});

test("expected stored bodies are the approved baseline plus the appended block", () => {
  for (const block of bloomfallAllCrossLinkBlocks) {
    const baseline = bloomfallIntegrationBaselineBody(block.slug);
    assert.ok(baseline, `${block.slug} has a known baseline`);
    assert.equal(bloomfallIntegrationExpectedBody(block.slug), `${baseline}\n\n${block.block}`, block.slug);
  }
  for (const record of bloomfallIntegrationRecords) {
    assert.equal(bloomfallIntegrationExpectedBody(record.slug), record.body, record.slug);
  }
  assert.equal(new Set(bloomfallAllCrossLinkBlocks.map((block) => block.slug)).size, bloomfallAllCrossLinkBlocks.length);
});

test("the relationship diagram is a connected, resolvable graph", () => {
  const keys = new Set(bloomfallRelationshipDiagram.nodes.map((node) => node.key));
  assert.equal(keys.size, bloomfallRelationshipDiagram.nodes.length);
  const touched = new Set<string>();
  for (const edge of bloomfallRelationshipDiagram.edges) {
    assert.ok(keys.has(edge.from), edge.from);
    assert.ok(keys.has(edge.to), edge.to);
    assert.notEqual(edge.from, edge.to);
    touched.add(edge.from);
    touched.add(edge.to);
  }
  assert.equal(touched.size, keys.size, "every node in the diagram is on at least one arrow");
  for (const node of bloomfallRelationshipDiagram.nodes) {
    if (node.slug) assert.equal(isValidStoryKey(node.slug), true, node.slug);
  }
});
