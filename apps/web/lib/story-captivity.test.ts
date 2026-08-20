import assert from "node:assert/strict";
import test from "node:test";
import { isValidStoryKey } from "@habitat/shared";
import { captivityArcSeed } from "./story-captivity-seed";

test("the captivity scaffold resolves the reference without inventing protected answers", () => {
  assert.equal(captivityArcSeed.slug, "the-captivity-arc");
  assert.ok(isValidStoryKey(captivityArcSeed.slug));
  assert.equal(captivityArcSeed.nodes.length, 5);
  assert.equal(new Set(captivityArcSeed.nodes.map((node) => node.key)).size, captivityArcSeed.nodes.length);
  assert.equal(new Set(captivityArcSeed.edges.map((edge) => edge.key)).size, captivityArcSeed.edges.length);
  assert.ok(captivityArcSeed.nodes.some((node) => node.title.includes("Owner Gate")));
  const copy = JSON.stringify(captivityArcSeed);
  assert.match(copy, /unidentified force/i);
  assert.match(copy, /do not name the captor/i);
  assert.doesNotMatch(copy, /captured by (Aegis|Pearl|Ashen|Choir)/i);
});

test("every edge stays inside the scaffold and references remain real slugs", () => {
  const keys = new Set(captivityArcSeed.nodes.map((node) => node.key));
  for (const edge of captivityArcSeed.edges) { assert.ok(keys.has(edge.from)); assert.ok(keys.has(edge.to)); }
  for (const node of captivityArcSeed.nodes) for (const slug of node.references) assert.ok(isValidStoryKey(slug), slug);
});

