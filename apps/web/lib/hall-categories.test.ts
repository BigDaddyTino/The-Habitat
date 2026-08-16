import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";
import { groupRecordsByCategory, hallCategories, hallCategoryArtPath, HALL_CATEGORY_LIMIT } from "./hall-categories";
import type { RecordHall } from "./record-data";

const halls: RecordHall[] = ["LEGENDS", "SHAME"];

/**
 * Read straight from the seed source rather than importing it: seed.ts opens a Prisma client and
 * runs main() on import, which a pure unit test has no business doing.
 */
async function seededCategories() {
  const seed = await readFile(resolve(process.cwd(), "../../packages/db/prisma/seed.ts"), "utf8");
  const start = seed.indexOf("const records = [");
  assert.ok(start > -1, "seed.ts must still declare a records catalog");
  const block = seed.slice(start, seed.indexOf("] as const;", start));
  const byHall: Record<string, Set<string>> = { LEGENDS: new Set(), SHAME: new Set() };
  for (const line of block.split("\n")) {
    const hall = /hall: "(LEGENDS|SHAME)"/.exec(line);
    const category = /category: "([^"]+)"/.exec(line);
    if (hall && category) byHall[hall[1]!]!.add(category[1]!);
  }
  return byHall;
}

test("each hall showcases exactly five distinctly-slugged categories", () => {
  for (const hall of halls) {
    const categories = hallCategories(hall);
    assert.equal(categories.length, HALL_CATEGORY_LIMIT, `${hall} must present ${HALL_CATEGORY_LIMIT} categories`);
    assert.equal(new Set(categories.map((entry) => entry.slug)).size, HALL_CATEGORY_LIMIT, `${hall} slugs must be unique`);
    assert.equal(new Set(categories.map((entry) => hallCategoryArtPath(hall, entry))).size, HALL_CATEGORY_LIMIT, `${hall} art paths must be unique`);
    for (const entry of categories) assert.match(hallCategoryArtPath(hall, entry), /^\/images\/halls\/category-(legends|shame)-[a-z0-9-]+\.png$/);
  }
});

test("the showcase manifest covers the seeded record catalog exactly", async () => {
  const seeded = await seededCategories();
  for (const hall of halls) {
    const manifest = hallCategories(hall).map((entry) => entry.category).sort();
    assert.deepEqual([...seeded[hall]!].sort(), manifest, `${hall} seed categories and showcase manifest have drifted apart`);
  }
});

test("grouping follows manifest order, drops nothing, and never renders an empty showcase", () => {
  const [first, second] = hallCategories("SHAME");
  const records = [
    { id: "stray", category: "Unlisted Wing" },
    { id: "second", category: second!.category },
    { id: "first-a", category: first!.category },
    { id: "first-b", category: first!.category },
  ];
  const grouped = groupRecordsByCategory("SHAME", records);
  assert.deepEqual(grouped.map((entry) => entry.category.category), [first!.category, second!.category, "Unlisted Wing"]);
  assert.deepEqual(grouped[0]!.records.map((record) => record.id), ["first-a", "first-b"]);
  assert.equal(grouped.flatMap((entry) => entry.records).length, records.length, "every record must land in a showcase");
  assert.equal(grouped.some((entry) => entry.records.length === 0), false);
  assert.equal(groupRecordsByCategory("SHAME", []).length, 0);
});

test("every category banner is authored at the 2400x1000 cinematic spec", async () => {
  for (const hall of halls) {
    for (const category of hallCategories(hall)) {
      const path = hallCategoryArtPath(hall, category);
      const bytes = await readFile(resolve(process.cwd(), "public", `.${path}`));
      assert.deepEqual([...bytes.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10], `${path} must be a PNG`);
      assert.equal(bytes.readUInt32BE(16), 2400, `${path} must be 2400px wide`);
      assert.equal(bytes.readUInt32BE(20), 1000, `${path} must be 1000px tall`);
    }
  }
});

test("the hall stylesheet wires the category banner and drops the retired filter bar", async () => {
  const styles = await readFile(resolve(process.cwd(), "app/halls/halls.css"), "utf8");
  for (const selector of [".record-category-stack", ".record-category-banner", ".record-category-veil", ".record-category-tally", ".record-showcase-grid"]) {
    assert.ok(styles.includes(selector), `${selector} needs a rule in halls.css`);
  }
  assert.equal(styles.includes(".record-hall-filters"), false, "the hall filter bar was removed, so its styles must go too");
  assert.match(styles, /@media\(prefers-reduced-motion:reduce\)/);
});
