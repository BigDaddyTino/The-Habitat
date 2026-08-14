import assert from "node:assert/strict";
import test from "node:test";
import { collectibleAtlasGrid, collectibleVisuals } from "./collectible-art";

test("no authored collectible wears another collectible's relief", () => {
  const claimed = new Map<string, string>();
  for (const [code, visual] of Object.entries(collectibleVisuals)) {
    if (visual.tile === null) continue;
    const key = `${visual.atlas}:${visual.tile}`;
    const owner = claimed.get(key);
    assert.equal(owner, undefined, `${code} claims ${key}, already authored for ${owner}`);
    claimed.set(key, code);
  }
});

test("every authored relief points at a tile the atlas actually contains", () => {
  for (const [code, visual] of Object.entries(collectibleVisuals)) {
    if (visual.tile === null) continue;
    const grid = collectibleAtlasGrid[visual.atlas];
    assert.ok(Number.isInteger(visual.tile) && visual.tile >= 0, `${code} has a non-index tile`);
    assert.ok(visual.tile < grid.columns * grid.rows, `${code} points past the ${visual.atlas} atlas`);
  }
});

test("season heirlooms have distinct bespoke forms and borrow no atlas relief", () => {
  const standard = collectibleVisuals["first-light-standard"];
  const lantern = collectibleVisuals["founders-lantern"];
  assert.ok(standard);
  assert.ok(lantern);
  assert.equal(standard.tile, null);
  assert.equal(lantern.tile, null);
  assert.equal(standard.form, "first-light-standard");
  assert.equal(lantern.form, "founders-lantern");
  assert.notEqual(standard.inscription, lantern.inscription);
  assert.notEqual(standard.enamel, lantern.enamel);
});
