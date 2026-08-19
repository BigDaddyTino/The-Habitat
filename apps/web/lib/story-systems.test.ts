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
  storyVeilAnchorTiers,
  storyVeilAnchorTierLabels,
  storySoulForgeStates,
  storySoulForgeStateLabels,
} from "@habitat/shared";
import { storySystemsSeed } from "./story-systems-seed";
import { metaSchemasByKind } from "./story-meta-schemas";

test("every seeded system validates against the schema its sheet enforces", () => {
  // Seeded meta that does not parse would be a row nobody can save from the
  // sheet, and — as the 2026-08-19 audit found — a row whose shape silently
  // disagrees with its contract. Twenty-one rows had drifted that way because
  // they predated `parent` and `regionNotes`; this keeps the seed honest so it
  // cannot happen again from this side.
  const schema = metaSchemasByKind.SYSTEM;
  assert.ok(schema, "SYSTEM must have a sheet schema");
  for (const seed of storySystemsSeed) {
    const result = schema.safeParse(seed.meta);
    assert.ok(result.success, `${seed.slug} meta is invalid: ${result.success ? "" : result.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("; ")}`);
  }
});

test("the seeded meta carries every key the schema declares", () => {
  // safeParse passing is not enough on its own: a key the schema does not know
  // is stripped silently rather than rejected, so compare the key sets too.
  const shape = (metaSchemasByKind.SYSTEM as unknown as { shape: Record<string, unknown> }).shape;
  const declared = Object.keys(shape).sort();
  for (const seed of storySystemsSeed) {
    assert.deepEqual(Object.keys(seed.meta).sort(), declared, `${seed.slug} meta keys drifted from the schema`);
  }
});

test("SYSTEM is a first-class entry kind with a label", () => {
  assert.ok((storyEntryKinds as readonly string[]).includes("SYSTEM"));
  // Every kind must label — an unlabeled kind renders as undefined all over the codex.
  for (const kind of storyEntryKinds) assert.ok(storyEntryKindLabels[kind], `${kind} has no label`);
});

test("the SYSTEM sheet is validated, and the fields the shelf depends on survive", () => {
  // Exercises the real schema. The hierarchy, the release gate, and the
  // regional expression are what every systems surface reads; losing any of
  // them silently would strip the field on the next save rather than error.
  const schema = metaSchemasByKind.SYSTEM;
  assert.ok(schema, "SYSTEM sheets must be validated server-side");
  const shape = (schema as unknown as { shape: Record<string, unknown> }).shape;
  for (const field of ["parent", "unlockArc", "unlockStage", "dependsOn", "regionNotes", "category", "buildStatus"]) {
    assert.ok(field in shape, `the schema must keep ${field}`);
  }
  // Slug-typed fields refuse prose, so a picker can always resolve them.
  const valid = { category: null, buildStatus: null, parent: null, unlockArc: null, unlockStage: null, dependsOn: [], pillars: [], regionNotes: [], gameTag: null, openQuestions: [] };
  assert.ok(schema.safeParse(valid).success, "an empty sheet must be savable");
  assert.equal(schema.safeParse({ ...valid, parent: "The Environment" }).success, false, "parent must be a slug, not prose");
  assert.equal(schema.safeParse({ ...valid, regionNotes: [{ region: "the-peninsula" }] }).success, false, "a region note needs its note");

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
    assert.ok(seed.meta.regionNotes.length <= 20, `${seed.slug} regionNotes count`);
    for (const note of seed.meta.regionNotes) {
      assert.ok(isValidStoryKey(note.region), `${seed.slug} region note slug "${note.region}"`);
      assert.ok(note.note.length > 0 && note.note.length <= 300, `${seed.slug} region note length`);
    }
  }
});

test("the system tree is sound — parents exist, and nothing orbits itself", () => {
  const bySlug = new Map(storySystemsSeed.map((seed) => [seed.slug, seed]));
  for (const seed of storySystemsSeed) {
    if (seed.meta.parent === null) continue;
    assert.ok(bySlug.has(seed.meta.parent), `${seed.slug} is inside ${seed.meta.parent}, which is not in the seed`);
    assert.notEqual(seed.meta.parent, seed.slug, `${seed.slug} is inside itself`);
    // Walk to the top; a cycle would spin past the seed count.
    let cursor: string | null = seed.meta.parent;
    let steps = 0;
    while (cursor) {
      steps += 1;
      assert.ok(steps <= storySystemsSeed.length, `${seed.slug} sits in a parent cycle`);
      cursor = bySlug.get(cursor)?.meta.parent ?? null;
    }
  }
});

test("release intent is explicit on every top-level system", () => {
  // A top-level system with neither an unlock arc nor a stage note lands in
  // the release plan's "not scheduled" hole. The founding shelf ships with no
  // holes — the hole exists for systems added later and forgotten. A child
  // ships with its parent, so its own intent is optional and overrides when set.
  for (const seed of storySystemsSeed) {
    if (seed.meta.parent !== null) continue;
    assert.ok(seed.meta.unlockArc !== null || seed.meta.unlockStage !== null, `${seed.slug} has no release intent`);
  }
});

test("dependencies never gate earlier than what they depend on", () => {
  // A day-one system depending on an act-two system is a shipping order that
  // cannot be honored. Arc-gated entries are treated as later than day one.
  //
  // Release is INHERITED: a child with no gate of its own ships with its
  // parent, so a day-one parent's children are day-one too and answer for
  // their dependencies the same way. Persistent Damage's children were caught
  // by exactly this — both inherited day one while depending on systems that
  // unlock chapters later.
  const bySlug = new Map(storySystemsSeed.map((seed) => [seed.slug, seed]));
  const effectiveRelease = (slug: string): { arc: string | null; stage: string | null } | null => {
    let cursor = bySlug.get(slug);
    for (let hops = 0; cursor && hops <= storySystemsSeed.length; hops++) {
      if (cursor.meta.unlockArc !== null || cursor.meta.unlockStage !== null) {
        return { arc: cursor.meta.unlockArc, stage: cursor.meta.unlockStage };
      }
      cursor = cursor.meta.parent ? bySlug.get(cursor.meta.parent) : undefined;
    }
    return null;
  };
  const isDayOne = (slug: string) => {
    const release = effectiveRelease(slug);
    return Boolean(release && release.arc === null && release.stage !== null && /day one|start/i.test(release.stage));
  };
  for (const seed of storySystemsSeed) {
    if (!isDayOne(seed.slug)) continue;
    for (const dependency of seed.meta.dependsOn) {
      assert.ok(isDayOne(dependency), `${seed.slug} ships day one (its own gate or its parent's) but depends on ${dependency}, which unlocks later`);
    }
  }
});

test("a Veil Anchor is recorded on the place that IS one", () => {
  // Anchors are POIs, not prose: the tier lives on the REGION entry so the
  // atlas can show which places open onto other Shards, and at what risk.
  const schema = metaSchemasByKind.REGION;
  assert.ok(schema, "REGION must have a sheet schema");
  const place = { type: "site", settlementTier: null, parent: "the-peninsula", biome: null, control: [], population: null, connections: [], status: null, soulForge: null, gameTag: null, openQuestions: [] };
  // Most places are not Anchors, and null must stay legal.
  assert.ok(schema.safeParse({ ...place, veilAnchorTier: null }).success, "a place that is not an Anchor must save");
  for (const tier of storyVeilAnchorTiers) {
    assert.ok(schema.safeParse({ ...place, veilAnchorTier: tier }).success, `tier ${tier} must be storable`);
  }
  for (const bad of ["VI", "1", "i", "Tier III", ""]) {
    assert.equal(schema.safeParse({ ...place, veilAnchorTier: bad }).success, false, `${bad} must be refused`);
  }
  // Required-but-nullable, like every other sheet field.
  assert.equal(schema.safeParse(place).success, false, "omitting the tier must be refused");
  // Every tier the picker offers has a label to show for it.
  for (const tier of storyVeilAnchorTiers) assert.ok(storyVeilAnchorTierLabels[tier]?.includes(tier), `tier ${tier} needs a label`);
});

test("the Veil family is wired to what it cannot ship without", () => {
  const bySlug = new Map(storySystemsSeed.map((seed) => [seed.slug, seed]));
  const veil = bySlug.get("the-veil");
  assert.ok(veil, "The Veil must exist");
  assert.equal(veil.meta.parent, null, "The Veil is top-level");
  for (const child of ["veil-anchors", "veil-expeditions", "veil-incursions"]) {
    assert.equal(bySlug.get(child)?.meta.parent, "the-veil", `${child} files under The Veil`);
  }
  // Nothing crosses without a structure to cross through.
  for (const dependent of ["veil-expeditions", "veil-incursions"]) {
    assert.ok(bySlug.get(dependent)?.meta.dependsOn.includes("veil-anchors"), `${dependent} depends on veil-anchors`);
  }
  // The raid is gated apart from the rest of the family.
  assert.match(String(bySlug.get("veil-incursions")?.meta.unlockStage), /late game/i);
  assert.equal(bySlug.get("veil-anchors")?.meta.unlockStage, null, "Anchors ship with the parent");
  // The Anchors sheet must say how each region expresses them.
  assert.ok((bySlug.get("veil-anchors")?.meta.regionNotes.length ?? 0) >= 2, "Anchors need region notes");
});

test("a place that holds a Soul Forge says so, and a dead one says that louder", () => {
  const schema = metaSchemasByKind.REGION;
  assert.ok(schema, "REGION must have a sheet schema");
  const place = { type: "site", settlementTier: null, parent: "the-starting-island", biome: null, control: [], population: null, connections: [], status: null, veilAnchorTier: null, gameTag: null, openQuestions: [] };
  assert.ok(schema.safeParse({ ...place, soulForge: null }).success, "most places have no Forge");
  for (const state of storySoulForgeStates) {
    assert.ok(schema.safeParse({ ...place, soulForge: state }).success, `${state} must be storable`);
    assert.ok(storySoulForgeStateLabels[state], `${state} needs a label`);
  }
  for (const bad of ["gone", "ACTIVE", "", "broken"]) {
    assert.equal(schema.safeParse({ ...place, soulForge: bad }).success, false, `${bad} must be refused`);
  }
  assert.equal(schema.safeParse(place).success, false, "omitting the field must be refused");
});

test("the Soul Forge family is wired, and binding is what teaches it", () => {
  const bySlug = new Map(storySystemsSeed.map((seed) => [seed.slug, seed]));
  const forge = bySlug.get("the-soul-forge");
  assert.ok(forge, "The Soul Forge must exist");
  assert.equal(forge.meta.parent, null, "The Soul Forge is top-level");
  assert.match(String(forge.meta.unlockStage), /day one/i, "death works from the first minute");
  for (const child of ["soul-binding", "reclamation"]) {
    assert.equal(bySlug.get(child)?.meta.parent, "the-soul-forge", `${child} files under The Soul Forge`);
  }
  // You cannot reclaim to a Forge you never bound to.
  assert.ok(bySlug.get("reclamation")?.meta.dependsOn.includes("soul-binding"));
  // Binding is placed on the two locations the prologue actually uses.
  const notes = bySlug.get("soul-binding")?.meta.regionNotes ?? [];
  assert.deepEqual(notes.map((note) => note.region).sort(), ["forward-camp-kestrel", "port-arcadia"]);
});

test("no Forge is ever written as settling Tino", () => {
  // Canon law: a Forge speaks only about Echoes bound to it, so it can neither
  // confirm nor deny him. The guard is the limiting language itself — an
  // earlier draft searched for "Tino is alive" and flagged the very sentence
  // that refuses to say it, which is how a crude guard talks you out of good
  // prose instead of protecting anything.
  const binding = bySlugBody("soul-binding");
  assert.match(binding, /can only speak about Echoes bound to it/i, "the limit must be stated where the scene is");
  assert.match(binding, /inference/i, "the realization must read as an inference, not a finding");
  assert.match(binding, /cannot confirm that Tino is alive/i, "it must refuse the alive reading explicitly");
  assert.match(binding, /cannot confirm he is dead/i, "and the dead reading too");
  assert.match(binding, /\[\[what-the-player-knows-about-tino\]\]/, "the scene must cite the law it obeys");
});

function bySlugBody(slug: string): string {
  const seed = storySystemsSeed.find((candidate) => candidate.slug === slug);
  assert.ok(seed, `${slug} must exist`);
  return seed.body;
}
