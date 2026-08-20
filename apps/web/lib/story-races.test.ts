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

test("a character's people is a real edge, in both directions", () => {
  // The races shelf became a first-class library, but the one field that ties
  // a person to a people — `species` on the character sheet — was never read
  // by the connection scanner. Four characters already named `human` and the
  // Human dossier listed none of them: the shelf existed, and nothing in the
  // world pointed into it.
  const codex = readFileSync(join(process.cwd(), "lib/story-codex.ts"), "utf8");
  assert.match(codex, /if \(referencesSlug\(meta\.species\)\) add\("is one of this race"\)/, "a race must list the people who are one");
  // And the outbound half, so a character whose only tie is their people is
  // not reported as unconnected.
  assert.match(codex, /meta\.origin, meta\.companion, meta\.species\]/, "species must count as an outbound reference");
});

test("the races shelf is watched by the needs-work dashboard like every other kind", () => {
  // CREATURE was the one kind whose own references nothing ever checked, so a
  // member filed under a deleted race, or a habitat naming a place nobody
  // wrote, rotted silently while every other kind was scanned.
  const codex = readFileSync(join(process.cwd(), "lib/story-codex.ts"), "utf8");
  const block = codex.slice(codex.indexOf('if (entry.kind === "CREATURE") {'), codex.indexOf('if (entry.kind === "REGION") {', codex.indexOf('if (entry.kind === "CREATURE") {')));
  assert.ok(block.length > 0, "CREATURE must have its own reference checks");
  assert.match(block, /check\("race", meta\.parent\)/, "the race is a strict slug field and is checked outright");
  assert.match(block, /checkIfSlugShaped\("habitat", habitat\)/, "habitats are slug-or-prose, so only slug-shaped ones are reported");

  // The slug-or-prose rule itself: Amanda's race reads "Lizzarnix — half
  // lizard, half phoenix; publicly passes as a lizardwoman", which is the
  // spoiler-tier truth and must never be reported as a broken link.
  assert.match(codex, /const checkIfSlugShaped = \(field: string, target: unknown\) => \{/);
  assert.match(codex, /slug\.includes\("-"\) && \/\^\[a-z0-9\]\+\(-\[a-z0-9\]\+\)\*\$\/\.test\(slug\)/, "only a multi-word kebab value could have been meant as a link");
});

test("the stored-meta audit looks at the two fields it used to skip", () => {
  const audit = readFileSync(join(process.cwd(), "scripts/audit-story-meta.ts"), "utf8");
  assert.match(audit, /check\("species", maybeSlugs\(one\(meta\.species\)\), known, "entry"\)/);
  assert.match(audit, /check\("biomes", maybeSlugs\(strings\(meta\.biomes\)\), known, "entry"\)/);
});

test("the sheet and the create form both offer the whole shelf, not just the umbrellas", () => {
  // A character is one of a *people* — Tino is a Human, and Human is a member
  // of the race Humanoid. A picker that only offered top-level races would
  // lose exactly the distinction the parent-child shelf was built to make.
  const sheets = readFileSync(join(process.cwd(), "components/story-entry-sheets.tsx"), "utf8");
  assert.match(sheets, /<label>Race — their people<input aria-label="Race" list=\{raceListId\}/, "the character sheet must offer the shelf");
  const directory = readFileSync(join(process.cwd(), "components/story-entity-directory.tsx"), "utf8");
  assert.match(directory, /<optgroup key=\{race\.slug\} label=\{race\.title\}>/, "the create form groups peoples under their race");
  assert.match(directory, /name="species"/, "a character is born knowing their people");
  // And the birth meta actually writes it.
  const actions = readFileSync(join(process.cwd(), "app/codex/actions.ts"), "utf8");
  assert.match(actions, /species: oneSlug\(formData, "species"\)/);
});
