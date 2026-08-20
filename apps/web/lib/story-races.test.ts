import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { isValidStoryKey, storyCreatureCategories } from "@habitat/shared";
import { existingRaceSheets, raceAssignments, raceMemberSeeds, raceSeeds } from "./story-races-seed";
import { creatureMetaSchema } from "./story-meta-schemas";
import { isStoryCollectionSlug, renamedStoryCollections, storyCollections } from "./story-library";
import { storyProseLinks } from "./story-prose";

test("the races shelf replaced the bestiary, and the old address still answers", () => {
  assert.ok(isStoryCollectionSlug("races"), "the races shelf must exist");
  assert.equal(storyCollections.races.kind, "CREATURE");
  assert.equal(storyCollections.races.label, "Races");
  // The rename must not strand anything: "creatures" is gone as a shelf but
  // still resolves, because links to it were written by hand all over.
  assert.equal(isStoryCollectionSlug("creatures"), false, "the old shelf must be gone");
  assert.equal(renamedStoryCollections.creatures, "races", "the old address must still redirect");
  const page = readFileSync(join(process.cwd(), "app/codex/library/[collection]/page.tsx"), "utf8");
  assert.match(page, /renamedStoryCollections\[collection\]/, "the library page must honour renamed shelves");
  assert.match(page, /redirect\(`\/codex\/library\/\$\{renamed\}`\)/, "a renamed shelf must redirect rather than 404");
});

test("every renamed shelf points at a shelf that exists", () => {
  // A redirect to a slug nobody serves is worse than a 404 — it loops the
  // reader through a rename that goes nowhere.
  for (const [from, to] of Object.entries(renamedStoryCollections)) {
    assert.ok(isStoryCollectionSlug(to), `${from} redirects to ${to}, which is not a shelf`);
    assert.equal(isStoryCollectionSlug(from), false, `${from} is both a live shelf and a redirect`);
  }
});

test("a race is a creature with nothing above it", () => {
  // The whole tree rests on this: parent null means "this IS a race". If a
  // seeded race ever carried a parent it would file itself under something
  // and vanish from the top rung.
  for (const seed of raceSeeds) {
    assert.ok(isValidStoryKey(seed.slug), `${seed.slug} is not a valid slug`);
    assert.equal(seed.meta.parent, null, `${seed.slug} is a race and must have no parent`);
    assert.ok(seed.meta.category, `${seed.slug} needs a category — the taxonomy law is the point of the shelf`);
    assert.ok(seed.summary.trim() && seed.body.trim(), `${seed.slug} needs a summary and a body`);
  }
});

test("Mythical exists and the Lizzarnix belong to it", () => {
  // The two things asked for by name.
  const mythical = raceSeeds.find((seed) => seed.slug === "mythical");
  assert.ok(mythical, "Mythical must be one of the races");
  assert.equal(mythical.meta.category, "magical");
  const lizzarnix = raceAssignments.find((row) => row.slug === "lizzarnix");
  assert.ok(lizzarnix, "the Lizzarnix must be filed somewhere");
  assert.equal(lizzarnix.parent, "mythical");
  assert.equal(raceAssignments.filter((row) => row.parent === "mythical").length, 1, "Lizzarnix is the only mythical creature at present");
});

test("Hippogriff and Human are distinct children of the requested parents", () => {
  assert.equal(raceAssignments.some((row) => row.slug === "the-hypogriff-riders"), false);
  assert.equal(raceAssignments.find((row) => row.slug === "hippogriff")?.parent, "beasts");
  assert.equal(raceAssignments.find((row) => row.slug === "human")?.parent, "humanoid");
  assert.ok(raceSeeds.some((seed) => seed.slug === "humanoid"));
  assert.equal(raceSeeds.some((seed) => seed.slug === "humans"), false);
});

test("the races landing page shows parent cards only", () => {
  const directory = readFileSync(join(process.cwd(), "components/story-entity-directory.tsx"), "utf8");
  assert.match(directory, /isRacesLibrary && !search\s*\? entries\.filter\(\(entry\) => !systemParentOf\(entry\)\)/);
  assert.match(directory, /See its children/);
});

test("every assignment names a race that exists, and a real category", () => {
  const races = new Set([...raceSeeds.map((seed) => seed.slug), ...existingRaceSheets.map((row) => row.slug)]);
  for (const row of raceAssignments) {
    assert.ok(isValidStoryKey(row.slug), `${row.slug} is not a valid slug`);
    assert.ok(races.has(row.parent), `${row.slug} is filed under "${row.parent}", which is not a race`);
    assert.ok((storyCreatureCategories as readonly string[]).includes(row.category ?? ""), `${row.slug} has category "${row.category}", which is not in the taxonomy`);
  }
  // Nothing may be filed under itself — a self-parent would drop the entry
  // off the top rung and out of its own member list at the same time.
  for (const row of raceAssignments) assert.notEqual(row.slug, row.parent, `${row.slug} is its own race`);
});

test("no creature is both a race and a member", () => {
  const races = new Set([...raceSeeds.map((seed) => seed.slug), ...existingRaceSheets.map((row) => row.slug)]);
  for (const row of raceAssignments) {
    assert.equal(races.has(row.slug), false, `${row.slug} is declared a race and also filed under one`);
  }
});

test("every seeded race validates against the sheet that will edit it", () => {
  for (const seed of [...raceSeeds, ...raceMemberSeeds]) {
    const parsed = creatureMetaSchema.safeParse(seed.meta);
    assert.ok(parsed.success, `${seed.slug} meta invalid: ${parsed.success ? "" : parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("; ")}`);
  }
  // And the schema knows the new field at all.
  const shape = Object.keys((creatureMetaSchema as unknown as { shape: Record<string, unknown> }).shape);
  assert.ok(shape.includes("parent"), "the creature sheet schema must carry the race parent");
  for (const seed of [...raceSeeds, ...raceMemberSeeds]) {
    assert.deepEqual(Object.keys(seed.meta).sort(), [...shape].sort(), `${seed.slug} meta keys drifted from the schema`);
  }
});

test("race prose links only ever reach for well-formed slugs", () => {
  for (const seed of [...raceSeeds, ...raceMemberSeeds]) {
    for (const slug of storyProseLinks(seed.body)) assert.ok(isValidStoryKey(slug), `${seed.slug} links malformed slug ${slug}`);
  }
  // The races are meant to sit inside existing law, not float beside it.
  const mythical = raceSeeds.find((seed) => seed.slug === "mythical");
  assert.ok(storyProseLinks(mythical?.body ?? "").includes("lizzarnix"));
  const human = raceMemberSeeds.find((seed) => seed.slug === "human");
  assert.ok(storyProseLinks(human?.body ?? "").includes("the-seven-phases-of-corruption"));
});
