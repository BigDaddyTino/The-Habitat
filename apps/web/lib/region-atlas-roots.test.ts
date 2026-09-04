import assert from "node:assert/strict";
import test from "node:test";
import { storyPlaceDescendants, storyPlaceRoot, type StoryPlaceLink } from "@habitat/shared";
import { isTopLevelRegion } from "./story-library";

/**
 * The regions atlas gives every top-level region a card and files each place
 * under the nearest ancestor that has one. So "which regions are top-level" is
 * not a cosmetic question — get it wrong and a nested region does not merely
 * gain a card it should not have, it TAKES its parent's places onto that card.
 *
 * That is what happened to the Peninsula. The Green is a region inside it, the
 * filter was `meta.type === "region"` alone, and The Green sat beside its own
 * parent holding all five of the Lamplight Road's places while the Peninsula
 * showed none of them.
 */

const peninsula = [
  { slug: "the-peninsula", meta: { type: "region", parent: null } },
  { slug: "the-green", meta: { type: "region", parent: "the-peninsula" } },
  { slug: "port-arcadia", meta: { type: "settlement", parent: "the-peninsula" } },
  { slug: "draw-nine", meta: { type: "site", parent: "the-peninsula" } },
  { slug: "lamplight", meta: { type: "site", parent: "the-green" } },
  { slug: "the-ash-ground", meta: { type: "site", parent: "the-green" } },
  { slug: "the-burned-wagon", meta: { type: "site", parent: "the-green" } },
  { slug: "the-last-water", meta: { type: "site", parent: "the-green" } },
  { slug: "the-quiet-altar", meta: { type: "site", parent: "the-green" } },
];

const links: StoryPlaceLink[] = peninsula.map((entry) => ({
  slug: entry.slug,
  parent: typeof entry.meta.parent === "string" ? entry.meta.parent : null,
}));

test("a region with something above it is not a top-level region", () => {
  assert.equal(isTopLevelRegion({ type: "region", parent: null }), true);
  assert.equal(isTopLevelRegion({ type: "region" }), true, "no parent key at all is still a root");
  assert.equal(isTopLevelRegion({ type: "region", parent: "   " }), true, "a blank parent is not a parent");
  assert.equal(isTopLevelRegion({ type: "region", parent: "the-peninsula" }), false, "The Green is inside the Peninsula and is not a world region");
  assert.equal(isTopLevelRegion({ type: "zone", parent: null }), false, "a zone is not a region however unparented");
  assert.equal(isTopLevelRegion({ type: "settlement", parent: null }), false);
  assert.equal(isTopLevelRegion(null), false);
});

test("The Green is a row inside the Peninsula, not a card beside it", () => {
  const roots = peninsula.filter((entry) => isTopLevelRegion(entry.meta)).map((entry) => entry.slug);
  assert.deepEqual(roots, ["the-peninsula"], "the atlas would draw a second world-region card for a place that is inside the first");
});

test("every Lamplight Road place files under the Peninsula, not The Green", () => {
  const isTop = (slug: string) => peninsula.some((entry) => entry.slug === slug && isTopLevelRegion(entry.meta));

  for (const slug of ["the-green", "lamplight", "the-ash-ground", "the-burned-wagon", "the-last-water", "the-quiet-altar"]) {
    assert.equal(
      storyPlaceRoot(slug, links, isTop),
      "the-peninsula",
      `${slug} does not come home to the Peninsula — this is the failure that made five places disappear off it`,
    );
  }
});

test("The Green keeps its own places listed beneath it", () => {
  // The fix must not flatten the middle rung: The Green is still the row that
  // holds the road's places, it is just a row on the Peninsula's card now.
  assert.deepEqual(
    storyPlaceDescendants("the-green", links).sort(),
    ["lamplight", "the-ash-ground", "the-burned-wagon", "the-last-water", "the-quiet-altar"],
  );
});
