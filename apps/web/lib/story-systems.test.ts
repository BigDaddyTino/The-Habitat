import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import {
  isValidStoryKey,
  storyEntryKinds,
  storyEntryKindLabels,
  storySystemCategories,
  storySystemStatuses,
} from "@habitat/shared";
import { storySystemsSeed } from "./story-systems-seed";

test("SYSTEM is a first-class entry kind with a label", () => {
  assert.ok((storyEntryKinds as readonly string[]).includes("SYSTEM"));
  // Every kind must label — an unlabeled kind renders as undefined all over the codex.
  for (const kind of storyEntryKinds) assert.ok(storyEntryKindLabels[kind], `${kind} has no label`);
});

test("the actions module validates SYSTEM sheets and the collection exists", () => {
  // Source-level checks, matching story-lock.test.ts: importing the server
  // modules would drag in env and Prisma, and what we are guarding is wiring.
  const actions = readFileSync(join(process.cwd(), "app/codex/actions.ts"), "utf8");
  assert.match(actions, /SYSTEM: systemMetaSchema/, "SYSTEM sheets must be validated server-side");
  assert.match(actions, /unlockArc: metaSlug\.nullable\(\)/, "the release gate must survive in the schema");
  const library = readFileSync(join(process.cwd(), "lib/story-library.ts"), "utf8");
  assert.match(library, /systems: \{\s*\n\s*kind: "SYSTEM"/, "the systems library collection must exist");
});

test("the seed is internally coherent", () => {
  const slugs = new Set(storySystemsSeed.map((seed) => seed.slug));
  assert.equal(slugs.size, storySystemsSeed.length, "seed slugs must be unique");
  for (const seed of storySystemsSeed) {
    assert.ok(isValidStoryKey(seed.slug), `${seed.slug} is not a valid story key`);
    assert.ok(seed.title.length > 0 && seed.title.length <= 120, `${seed.slug} title length`);
    assert.ok(seed.summary.length > 0 && seed.summary.length <= 500, `${seed.slug} summary length`);
    assert.ok(seed.body.length > 0 && seed.body.length <= 20000, `${seed.slug} body length`);
    // The meta must fit the server schema it will be edited under, or the very
    // first sheet save after seeding would refuse to store anything.
    if (seed.meta.category !== null) assert.ok((storySystemCategories as readonly string[]).includes(seed.meta.category), `${seed.slug} category`);
    if (seed.meta.buildStatus !== null) assert.ok((storySystemStatuses as readonly string[]).includes(seed.meta.buildStatus), `${seed.slug} buildStatus`);
    if (seed.meta.unlockStage !== null) assert.ok(seed.meta.unlockStage.length <= 160, `${seed.slug} unlockStage length`);
    assert.ok(seed.meta.dependsOn.length <= 12, `${seed.slug} dependsOn count`);
    for (const dependency of seed.meta.dependsOn) {
      assert.ok(slugs.has(dependency), `${seed.slug} depends on ${dependency}, which is not in the seed`);
      assert.notEqual(dependency, seed.slug, `${seed.slug} depends on itself`);
    }
    for (const pillar of seed.meta.pillars) assert.ok(pillar.length <= 300, `${seed.slug} pillar length`);
    for (const question of seed.meta.openQuestions) assert.ok(question.length <= 300, `${seed.slug} open question length`);
  }
});

test("release intent is explicit on every seeded system", () => {
  // A system with neither an unlock arc nor a stage note lands in the release
  // plan's "not scheduled" hole. The founding shelf ships with no holes — the
  // hole exists for systems added later and forgotten.
  for (const seed of storySystemsSeed) {
    assert.ok(seed.meta.unlockArc !== null || seed.meta.unlockStage !== null, `${seed.slug} has no release intent`);
  }
});

test("dependencies never gate earlier than what they depend on", () => {
  // A day-one system depending on an act-two system is a shipping order that
  // cannot be honored. Arc-gated entries are treated as later than day one.
  const isDayOne = (slug: string) => {
    const seed = storySystemsSeed.find((candidate) => candidate.slug === slug);
    return Boolean(seed && seed.meta.unlockArc === null && seed.meta.unlockStage !== null && /day one|start/i.test(seed.meta.unlockStage));
  };
  for (const seed of storySystemsSeed) {
    if (!isDayOne(seed.slug)) continue;
    for (const dependency of seed.meta.dependsOn) {
      assert.ok(isDayOne(dependency), `day-one system ${seed.slug} depends on ${dependency}, which unlocks later`);
    }
  }
});
