import assert from "node:assert/strict";
import test from "node:test";
import { analyzeStoryGraph, isValidStoryKey } from "@habitat/shared";
import { metaSchemasByKind } from "./story-meta-schemas";
import { storyProseLinks } from "./story-prose";
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
  bloomfallResources,
  bloomfallSubregions,
  bloomfallSystems,
} from "./bloomfall-reach-content";

test("the Bloomfall canonical package holds every owner-approved content count", () => {
  assert.equal(bloomfallSubregions.length, bloomfallExpectedCounts.subregions);
  assert.equal(bloomfallPois.length, bloomfallExpectedCounts.pois);
  assert.equal(bloomfallSystems.length, bloomfallExpectedCounts.systems);
  assert.equal(bloomfallCharacters.length, bloomfallExpectedCounts.characters);
  assert.equal(bloomfallCreatures.length, bloomfallExpectedCounts.creatures);
  assert.equal(bloomfallAberrants.length, bloomfallExpectedCounts.aberrants);
  assert.equal(bloomfallResources.length, bloomfallExpectedCounts.newResources);
  assert.equal(bloomfallEvents.length, bloomfallExpectedCounts.events);
  assert.equal(bloomfallArcs.length, bloomfallExpectedCounts.arcs);
  assert.equal(new Set(bloomfallNewEntries.map((entry) => entry.slug)).size, bloomfallNewEntries.length);
});

test("every Bloomfall entry uses a valid unique slug and its real typed metadata sheet", () => {
  for (const entry of bloomfallNewEntries) {
    assert.equal(isValidStoryKey(entry.slug), true, entry.slug);
    const schema = metaSchemasByKind[entry.kind];
    if (schema) assert.equal(schema.safeParse(entry.meta).success, true, `${entry.slug} metadata`);
    for (const reference of storyProseLinks(entry.body)) assert.equal(isValidStoryKey(reference), true, `${entry.slug} -> ${reference}`);
  }
  assert.equal(metaSchemasByKind.REGION!.safeParse(bloomfallMainRegion.meta).success, true);
});

test("Blackbloom taxonomy stays separate from Corruption, Abomination, and race identity", () => {
  const exposure = bloomfallSystems.find((entry) => entry.slug === "blackbloom-exposure");
  assert.match(exposure?.body ?? "", /not.*the-seven-phases-of-corruption/i);
  for (const entry of [...bloomfallCreatures, ...bloomfallAberrants]) {
    const meta = entry.meta as { parent?: unknown; category?: unknown };
    assert.equal(typeof meta.parent, "string", `${entry.slug} retains a base taxonomy`);
    assert.notEqual(meta.category, "abomination", `${entry.slug} is not automatically an Abomination`);
  }
  assert.equal(bloomfallCharacters.some((entry) => entry.slug === "maintenance-unit-m-17"), true, "Mender stays an entity dossier, not an invented race");
});

test("every Bloomfall story graph is non-mainline, structurally clean, and has Nobody Came", () => {
  const concepts = new Set<string>();
  for (const arc of bloomfallArcs) {
    assert.notEqual(arc.category, "MAINLINE");
    assert.equal(arc.nodes.some((node) => node.key === "nobody-came" && node.kind === "ENDING"), true, arc.slug);
    assert.deepEqual(analyzeStoryGraph(
      arc.nodes.map((node) => ({ key: node.key, kind: node.kind, title: node.title })),
      arc.edges.map((edge) => ({ fromKey: edge.from, toKey: edge.to, label: edge.label, hasConsequence: edge.effects.length > 0 })),
    ), [], arc.slug);
    for (const concept of arc.concepts) concepts.add(concept);
  }
  assert.equal(concepts.size, 10);
});

test("future gameplay systems do not claim a shipped runtime", () => {
  for (const entry of bloomfallSystems) {
    const meta = entry.meta as { buildStatus?: unknown; unlockStage?: unknown };
    assert.equal(meta.buildStatus, "concept", entry.slug);
    assert.match(String(meta.unlockStage), /Future gameplay design/i, entry.slug);
  }
});
