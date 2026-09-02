import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { isValidStoryKey, storyCreatureCategories } from "@habitat/shared";
import { existingRaceSheets, raceAssignments, raceMemberSeeds, raceSeeds } from "./story-races-seed";
import { habitatAssignments, unplacedCreatures } from "./story-habitats-seed";
import { creatureMetaSchema } from "./story-meta-schemas";
import { isStoryCollectionSlug, renamedStoryCollections, storyCollections } from "./story-library";
import { storyProseLinks } from "./story-prose";

test("the races shelf replaced the bestiary, and the old address still answers", () => {
  assert.ok(isStoryCollectionSlug("species"), "the species shelf must exist");
  assert.equal(storyCollections.species.kind, "CREATURE");
  assert.equal(storyCollections.species.label, "Species");
  // The rename must not strand anything: "creatures" is gone as a shelf but
  // still resolves, because links to it were written by hand all over.
  assert.equal(isStoryCollectionSlug("creatures"), false, "the old shelf must be gone");
  assert.equal(renamedStoryCollections.creatures, "species", "the oldest address must still redirect");
  assert.equal(renamedStoryCollections.races, "species", "the races address must still redirect after the rename");
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

test("Hypogriff and Human are distinct children of the requested parents", () => {
  assert.equal(raceAssignments.some((row) => row.slug === "the-hypogriff-riders"), false);
  assert.equal(raceAssignments.find((row) => row.slug === "hippogriff")?.parent, "beasts");
  assert.equal(raceAssignments.find((row) => row.slug === "human")?.parent, "humanoid");
  assert.ok(raceSeeds.some((seed) => seed.slug === "humanoid"));
  assert.equal(raceSeeds.some((seed) => seed.slug === "humans"), false);
});

test("the races landing page shows parent cards only", () => {
  // The factions shelf joined the races on this rule — majors only, with the
  // wings behind them — so the condition names both libraries now.
  const directory = readFileSync(join(process.cwd(), "components/story-entity-directory.tsx"), "utf8");
  assert.match(directory, /\(isRacesLibrary \|\| isFactionsLibrary\) && !search\s*\? entries\.filter\(\(entry\) => !systemParentOf\(entry\)\)/);
  assert.match(directory, /See its children/);
});

test("race-child thumbnails use the same art resolver as their dossiers", () => {
  // Shrieker Bat and all seven Machine patterns already had dossier heroes,
  // but this child list once used a smaller hand map and showed sparkles.
  const profile = readFileSync(join(process.cwd(), "components/story-entity-profile.tsx"), "utf8");
  assert.match(profile, /const memberArt = getDossierArt\("CREATURE", member\.slug, member\.meta\)\?\.src \?\? null;/);
  assert.doesNotMatch(profile, /const memberArt = getCreatureKeyart\(/, "child thumbnails must not restore the obsolete partial map");

  // Publication-aware art (notably Bloomfall V3) needs the child's own meta,
  // so the projection must not replace it with an empty object.
  const dossierPage = readFileSync(join(process.cwd(), "app/codex/bible/[slug]/page.tsx"), "utf8");
  assert.match(dossierPage, /summary: member\.summary,\s+meta: member\.meta,\s+category:/);
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
  assert.match(codex, /if \(referencesSlug\(meta\.species\)\) add\("is one of this species"\)/, "a species must list the people who are one");
  // And the outbound half, so a character whose only tie is their people is
  // not reported as unconnected.
  assert.match(codex, /meta\.origin, meta\.companion, meta\.species, meta\.faith\]/, "species and faith must count as outbound references");
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
  assert.match(sheets, /<label>Species — their people<input aria-label="Species" list=\{raceListId\}/, "the character sheet must offer the shelf");
  const directory = readFileSync(join(process.cwd(), "components/story-entity-directory.tsx"), "utf8");
  assert.match(directory, /<optgroup key=\{race\.slug\} label=\{race\.title\}>/, "the create form groups peoples under their race");
  assert.match(directory, /name="species"/, "a character is born knowing their people");
  // And the birth meta actually writes it.
  const actions = readFileSync(join(process.cwd(), "app/codex/actions.ts"), "utf8");
  assert.match(actions, /species: oneSlug\(formData, "species"\)/);
});

test("every creature is filed on ground the world actually has", () => {
  // The races shelf was wired to its own tree but not to the map: twelve
  // creatures, not one naming a place that resolved, so no region dossier
  // could say what lived there. These placements are quoted from canon, and
  // the citation travels with them — a placement whose reason nobody can
  // check is one nobody can correct.
  const worldRegions = ["the-starting-island", "the-ocean", "the-peninsula"];
  for (const assignment of habitatAssignments) {
    assert.ok(assignment.regions.length > 0, `${assignment.creature} is listed as placed but names no ground`);
    for (const region of assignment.regions) {
      assert.ok(worldRegions.includes(region), `${assignment.creature} is filed in ${region}, which is not one of the three regions the world has`);
    }
    assert.ok(assignment.because.length > 40, `${assignment.creature} needs the sentence it was read from, not an assertion`);
    assert.ok(isValidStoryKey(assignment.creature), `${assignment.creature} is not a well-formed slug`);
  }

  // A creature is either placed or deliberately unplaced — never merely
  // forgotten, which is the state the whole shelf was in.
  const placed = new Set(habitatAssignments.map((row) => row.creature));
  for (const row of unplacedCreatures) {
    assert.ok(!placed.has(row.creature), `${row.creature} is both placed and left off the map`);
    assert.ok(row.because.length > 40, `${row.creature} needs a reason it was left off, so nobody re-litigates it blind`);
  }

  // Every race and member the seed knows about is accounted for one way or
  // the other, so a creature added later cannot quietly go unplaced.
  const known = new Set([...raceSeeds, ...raceMemberSeeds].map((seed) => seed.slug));
  for (const slug of known) {
    assert.ok(placed.has(slug) || unplacedCreatures.some((row) => row.creature === slug), `${slug} is neither placed on the map nor deliberately left off it`);
  }
});
