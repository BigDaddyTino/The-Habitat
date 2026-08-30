import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { storyInvolvementKinds } from "@habitat/shared";
import { bloomfallCharacters } from "./bloomfall-reach-content";
import { metaSchemasByKind } from "./story-meta-schemas";

/**
 * Six production involvement rows named a canon EVENT entry through a field
 * called `arc`, and no audit reported them: the Needs Work scanner validated
 * against entries and arcs merged into one pool, so an event slug read as a
 * resolved arc. The reference carries its own namespace now, and each kind is
 * checked against only its own pool.
 */

const character = {
  fullName: null, aliases: [], pronouns: null, sex: null, species: null, age: null, appearance: null, voice: null,
  magic: { origin: null, schools: [], corruptionPhase: null, notes: null },
  factions: [], home: null, status: { known: null, actual: null }, relationships: [],
  background: null, professions: [], skills: [], cybernetics: [], storyRole: null,
  involvement: [], gameId: null, model: null, companion: { capable: null, availability: null, status: null }, openQuestions: [],
};

test("an involvement row has to say which namespace it points into", () => {
  const schema = metaSchemasByKind.CHARACTER!;
  // The pre-typed shape. Rejected outright rather than guessed at — guessing
  // is what produced six references nothing could resolve.
  assert.equal(schema.safeParse({ ...character, involvement: [{ arc: "the-evacuation", how: null }] }).success, false);
  assert.equal(schema.safeParse({ ...character, involvement: [{ ref: "the-evacuation", how: null }] }).success, false);
  assert.equal(schema.safeParse({ ...character, involvement: [{ ref: "the-evacuation", kind: null, how: null }] }).success, false);
  assert.equal(schema.safeParse({ ...character, involvement: [{ ref: "the-evacuation", kind: "REGION", how: null }] }).success, false);

  for (const kind of storyInvolvementKinds) {
    assert.equal(schema.safeParse({ ...character, involvement: [{ ref: "the-evacuation", kind, how: "..." }] }).success, true, kind);
  }
});

test("the needs-work scanner checks each involvement row against its own pool", () => {
  const codex = readFileSync(join(process.cwd(), "lib/story-codex.ts"), "utf8");
  assert.match(codex, /const knownArcs = new Set\(arcs\.map/, "the arc pool has to exist separately from the merged one");
  assert.match(codex, /const knownEntries = new Set\(entries\.map/, "the entry pool has to exist separately from the merged one");
  const block = codex.slice(codex.indexOf('if (entry.kind === "CHARACTER") {'), codex.indexOf('if (entry.kind === "SYSTEM") {'));
  assert.ok(block.includes('row.kind === "EVENT" ? knownEntries : knownArcs'), "an involvement row must be checked against its own namespace, never the merged pool");
});

test("every seeded involvement row points at something that exists in its own namespace", () => {
  const source = readFileSync(join(process.cwd(), "lib/bloomfall-reach-content.ts"), "utf8");
  // The arcs and events the same seed file creates, so the check is self-contained.
  const arcs = new Set([...source.matchAll(/regionalArc\(\{ slug: "([a-z0-9-]+)"/g)].map((match) => match[1]));
  const events = new Set([...source.matchAll(/kind: "EVENT", slug: "([a-z0-9-]+)"/g)].map((match) => match[1]));
  assert.ok(arcs.size > 0 && events.size > 0, "the seed must define the arcs and events it references");

  let rows = 0;
  for (const seed of bloomfallCharacters) {
    for (const row of (seed.meta as { involvement: Array<{ ref: string; kind: string }> }).involvement) {
      rows += 1;
      assert.ok((storyInvolvementKinds as readonly string[]).includes(row.kind), `${seed.slug}: ${row.ref} has no namespace`);
      // Only slugs this file owns can be checked here; anything from the wider
      // bible is left to the database audit, which sees every entry and arc.
      if (row.kind === "EVENT") assert.equal(arcs.has(row.ref), false, `${seed.slug}: ${row.ref} is typed EVENT but the seed opens it as an arc`);
      else assert.equal(events.has(row.ref) && !arcs.has(row.ref), false, `${seed.slug}: ${row.ref} is typed ARC but is a world event, not a quest board`);
    }
  }
  assert.ok(rows >= 13, `expected the seeded involvement rows, found ${rows}`);
});
