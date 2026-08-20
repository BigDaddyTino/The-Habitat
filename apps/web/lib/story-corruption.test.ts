import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import {
  storyBodyWithoutCorruptionLadder,
  storyCorruptionLadderMarker,
  storyCorruptionLadderSlugs,
  storyCorruptionPhase,
  storyCorruptionPhaseLabel,
  storyCorruptionPhases,
} from "@habitat/shared";
import { characterMetaSchema } from "./story-meta-schemas";

test("the ladder is eight rungs, 0 through 7, in order", () => {
  assert.equal(storyCorruptionPhases.length, 8);
  assert.deepEqual(storyCorruptionPhases.map((row) => row.phase), [0, 1, 2, 3, 4, 5, 6, 7]);
});

test("every rung carries the four things a writer needs from it", () => {
  for (const row of storyCorruptionPhases) {
    assert.ok(row.name.trim(), `phase ${row.phase} has no name`);
    assert.ok(row.tell.trim(), `phase ${row.phase} has no tell — the tell is what a scene shows instead of a number`);
    assert.ok(row.detail.trim(), `phase ${row.phase} has no detail`);
    assert.ok(row.hiding.trim(), `phase ${row.phase} says nothing about hiding, and hiding is half the law`);
  }
});

test("only the last phase ends the character", () => {
  // Corruption is a road somebody walks, not a status they catch: every phase
  // but the last is still a person a writer can put in a scene.
  const gone = storyCorruptionPhases.filter((row) => !row.playable);
  assert.deepEqual(gone.map((row) => row.phase), [7], "exactly phase seven is the end");
});

test("the first four phases are the tells canon already named, in canon's order", () => {
  // "tremors, veins, appetite, sensitivity to things others cannot feel" —
  // the-corruption-system. The ladder makes that sentence explicit rather
  // than inventing a competing one, so this ordering is load-bearing.
  assert.deepEqual(
    storyCorruptionPhases.slice(1, 5).map((row) => row.name),
    ["The Tremor", "The Veining", "The Appetite", "The Sensitivity"],
  );
});

test("a stored phase resolves, and anything else reads as undecided", () => {
  assert.equal(storyCorruptionPhase(3)?.name, "The Appetite");
  assert.equal(storyCorruptionPhaseLabel(3), "Phase 3 — The Appetite");
  assert.equal(storyCorruptionPhaseLabel(0), "Phase 0 — Clean");
  // Unset is the common case and must never render as phase zero: nobody
  // having decided is a different fact from somebody being clean.
  for (const value of [null, undefined, "", "3", 3.5, -1, 8, {}]) {
    assert.equal(storyCorruptionPhase(value), null, `${JSON.stringify(value)} should not resolve to a phase`);
    assert.equal(storyCorruptionPhaseLabel(value), null);
  }
});

test("every phase the sheet can store is a phase the ladder can name", () => {
  // The schema bound and the ladder must agree — a sheet that accepts a value
  // the ladder cannot explain puts an unreadable number on a dossier.
  for (const row of storyCorruptionPhases) {
    const parsed = characterMetaSchema.shape.magic.safeParse({ origin: "infused", schools: [], corruptionPhase: row.phase, notes: null });
    assert.ok(parsed.success, `the character sheet rejects phase ${row.phase}, which the ladder defines`);
  }
  const past = characterMetaSchema.shape.magic.safeParse({ origin: "infused", schools: [], corruptionPhase: 8, notes: null });
  assert.equal(past.success, false, "the sheet must not accept a phase past the end of the ladder");
});

test("the dossiers that document the ladder actually render it", () => {
  const profile = readFileSync(join(process.cwd(), "components/story-entity-profile.tsx"), "utf8");
  assert.match(profile, /storyCorruptionLadderSlugs/, "the profile must gate the ladder on the shared slug list");
  assert.deepEqual([...storyCorruptionLadderSlugs], ["the-seven-phases-of-corruption", "the-corruption-system"]);
});

test("the sheet picker names the phases instead of offering bare numbers", () => {
  // The whole reason no character had a phase set: a 0–7 number picker with
  // nothing to consult. If this regresses, writers go blind again.
  const sheets = readFileSync(join(process.cwd(), "components/story-entry-sheets.tsx"), "utf8");
  assert.match(sheets, /storyCorruptionPhases\.map/, "the corruption picker must be built from the ladder");
  assert.doesNotMatch(sheets, /Array\.from\(\{ length: 8 \}/, "the bare 0–7 number picker must stay gone");
});

test("the rendered ladder replaces the generated prose rather than doubling it", () => {
  // The enumeration must exist as prose (the export ships bodies) AND render
  // as the ladder (the web page). Printing both showed all seven phases twice
  // on the rule's own dossier — the seam is one shared marker.
  const body = `Written by hand.\n\n${storyCorruptionLadderMarker}\n\nGenerated rows here.`;
  assert.equal(storyBodyWithoutCorruptionLadder(body), "Written by hand.");
  // A body that has never been through the script is returned untouched.
  assert.equal(storyBodyWithoutCorruptionLadder("Nothing generated here."), "Nothing generated here.");
  const profile = readFileSync(join(process.cwd(), "components/story-entity-profile.tsx"), "utf8");
  assert.match(profile, /showsLadder \? storyBodyWithoutCorruptionLadder\(entry\.body\)/, "the ladder dossiers must cut the generated block from the prose they print");
});

test("the generated prose block is projected from the ladder, never hand-written", () => {
  // The export ships prose, so the phases must exist as prose too — but as a
  // projection of the constant, so the two can never disagree.
  const script = readFileSync(join(process.cwd(), "scripts/seed-corruption-phases.ts"), "utf8");
  assert.match(script, /storyCorruptionPhases\.map/, "the prose block must be generated from the ladder");
  for (const row of storyCorruptionPhases) {
    assert.doesNotMatch(script, new RegExp(`"${row.tell.slice(0, 30)}`), `phase ${row.phase}'s tell is duplicated as a literal in the script`);
  }
});
