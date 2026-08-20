import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import {
  developmentOnlyStoryKinds,
  isDevelopmentOnlyStoryKind,
  isUnconfirmedThreadStatus,
  isValidStoryKey,
  storyCompanionMissionStatuses,
  storyCompanionMissionStatusLabels,
  storyEntryKinds,
  storyEntryKindLabels,
  storyStoryStages,
  storyStoryStageLabels,
  storyThreadCategories,
  storyThreadCategoryLabels,
  storyThreadStatuses,
  storyThreadStatusLabels,
} from "@habitat/shared";
import { amandaSeed, companionMissionSeeds, emptyCribsSeed, lizzarnixLorePatches, lizzarnixSeed, tinoCompanionPatch } from "./story-threads-seed";
import { companionMissionMetaSchema, metaSchemasByKind, threadMetaSchema } from "./story-meta-schemas";
import { storyProseLinks } from "./story-prose";

test("the development-room kinds exist and carry labels", () => {
  for (const kind of ["THREAD", "COMPANION_MISSION"] as const) {
    assert.ok(storyEntryKinds.includes(kind), `${kind} missing from storyEntryKinds`);
    assert.ok(storyEntryKindLabels[kind], `${kind} has no label`);
  }
  // Every enum member has a label — a status the badge cannot name would
  // render as a hole in the UI.
  for (const status of storyThreadStatuses) assert.ok(storyThreadStatusLabels[status], `thread status ${status} unlabelled`);
  for (const status of storyCompanionMissionStatuses) assert.ok(storyCompanionMissionStatusLabels[status], `mission status ${status} unlabelled`);
  for (const category of storyThreadCategories) assert.ok(storyThreadCategoryLabels[category], `category ${category} unlabelled`);
  for (const stage of storyStoryStages) assert.ok(storyStoryStageLabels[stage], `stage ${stage} unlabelled`);
});

test("brainstorming reads as unconfirmed; approved does not", () => {
  assert.equal(isUnconfirmedThreadStatus("brainstorming"), true);
  assert.equal(isUnconfirmedThreadStatus("under-discussion"), true);
  assert.equal(isUnconfirmedThreadStatus(null), true);
  assert.equal(isUnconfirmedThreadStatus("approved"), false);
  assert.equal(isUnconfirmedThreadStatus("implemented"), false);
  assert.equal(isUnconfirmedThreadStatus("rejected"), false);
});

test("every seeded record validates against the schema its sheet enforces", () => {
  // A seed that does not parse is a row nobody could save from the sheet —
  // the same drift the 2026-08-19 audit caught on 21 system rows.
  const character = metaSchemasByKind.CHARACTER;
  assert.ok(character, "CHARACTER must have a sheet schema");
  const amanda = character.safeParse(amandaSeed.meta);
  assert.ok(amanda.success, `amanda meta invalid: ${amanda.success ? "" : amanda.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("; ")}`);

  const creature = metaSchemasByKind.CREATURE;
  assert.ok(creature, "CREATURE must have a sheet schema");
  const lizzarnix = creature.safeParse(lizzarnixSeed.meta);
  assert.ok(lizzarnix.success, `lizzarnix meta invalid: ${lizzarnix.success ? "" : lizzarnix.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("; ")}`);

  const thread = threadMetaSchema.safeParse(emptyCribsSeed.meta);
  assert.ok(thread.success, `thread meta invalid: ${thread.success ? "" : thread.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("; ")}`);

  for (const seed of companionMissionSeeds) {
    const parsed = companionMissionMetaSchema.safeParse(seed.meta);
    assert.ok(parsed.success, `${seed.slug} meta invalid: ${parsed.success ? "" : parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("; ")}`);
  }
});

test("the seeded meta carries every key its schema declares", () => {
  // safeParse passing is not enough: an unknown key is stripped silently, so
  // a typo'd field would vanish on the first sheet save. Compare key sets.
  const threadKeys = Object.keys((threadMetaSchema as unknown as { shape: Record<string, unknown> }).shape).sort();
  assert.deepEqual(Object.keys(emptyCribsSeed.meta).sort(), threadKeys, "thread meta keys drifted from the schema");
  const missionKeys = Object.keys((companionMissionMetaSchema as unknown as { shape: Record<string, unknown> }).shape).sort();
  for (const seed of companionMissionSeeds) {
    assert.deepEqual(Object.keys(seed.meta).sort(), missionKeys, `${seed.slug} meta keys drifted from the schema`);
  }
});

test("Amanda's chain is nine missions, ordered 1..9, every one hers and threaded", () => {
  assert.equal(companionMissionSeeds.length, 9);
  const orders = companionMissionSeeds.map((seed) => seed.meta.order);
  assert.deepEqual(orders, [1, 2, 3, 4, 5, 6, 7, 8, 9], "chain order must be exactly 1..9, in file order");
  for (const seed of companionMissionSeeds) {
    assert.ok(isValidStoryKey(seed.slug), `${seed.slug} is not a valid slug`);
    assert.equal(seed.meta.companion, "amanda", `${seed.slug} must belong to Amanda's arc`);
    assert.ok(seed.meta.threads.includes("the-empty-cribs"), `${seed.slug} must advance The Empty Cribs`);
    assert.equal(seed.meta.missionStatus, "brainstorming", `${seed.slug} must land as brainstorming — this material is not confirmed`);
  }
});

test("the thread's mission list and the seeded chain are the same nine slugs", () => {
  // The thread names its missions and each mission names the thread — the
  // two directions must agree or one surface will show a hole.
  assert.deepEqual(emptyCribsSeed.meta.companionMissions, companionMissionSeeds.map((seed) => seed.slug));
});

test("the thread lands loudly unconfirmed, with its remaining mysteries kept", () => {
  assert.equal(emptyCribsSeed.meta.threadStatus, "brainstorming");
  assert.ok(isUnconfirmedThreadStatus(emptyCribsSeed.meta.threadStatus));
  // The Lizzarnix identity is decided. The culprit and the private joke stay
  // locked, and the rebirth details remain questions for the room.
  assert.match(emptyCribsSeed.body, /\*\*Status: brainstorming\. Nothing below is confirmed canon\.\*\*/);
  assert.ok(emptyCribsSeed.meta.openQuestions.some((question) => /Who took the children — TBD/.test(question)));
  assert.match(String(amandaSeed.meta.species), /Lizzarnix/);
  assert.match(emptyCribsSeed.body, /Ash and egg/);
  assert.match(emptyCribsSeed.body, /Tino lifts the egg from the ashes/);
  assert.ok(emptyCribsSeed.meta.openQuestions.some((question) => /When Amanda's egg hatches/.test(question)));
  assert.match(emptyCribsSeed.body, /no codex entry may ever provide one/);
});

test("the Lizzarnix deepen existing magic law without creating a fourth origin", () => {
  assert.equal(lizzarnixSeed.slug, "lizzarnix");
  assert.equal(lizzarnixSeed.meta.category, "magical");
  assert.match(lizzarnixSeed.body, /half lizard and half phoenix/i);
  assert.match(lizzarnixSeed.body, /upright humanoid people who stand and walk on two legs/i);
  assert.match(String(amandaSeed.meta.appearance), /golden eyes.*almost luminous.*without actually glowing/i);
  assert.match(String(amandaSeed.meta.appearance), /scaled tail.*lower spine/i);
  assert.match(lizzarnixSeed.body, /ash became egg, egg became life/i);
  assert.match(lizzarnixSeed.body, /It is not a fourth origin/i);
  assert.match(lizzarnixSeed.meta.harvest ?? "", /eggs.*above kingdoms/i);

  assert.deepEqual(lizzarnixLorePatches.map((patch) => patch.slug), [
    "the-three-origins-of-magic",
    "the-taxonomy-of-monsters",
    "the-harvest-economy",
    "essence",
    "magic",
    "the-soul-forge",
  ]);
  for (const patch of lizzarnixLorePatches) assert.match(patch.body, /\[\[lizzarnix\]\]/, `${patch.slug} must link the creature dossier`);
});

test("Amanda is companion-capable; Tino's patch proposes without deciding his fate", () => {
  assert.equal(amandaSeed.meta.companion.capable, true);
  assert.match(String(amandaSeed.meta.companion.availability), /Peninsula/i);
  assert.equal(tinoCompanionPatch.capable, true);
  assert.match(String(tinoCompanionPatch.availability), /brainstorming/i);
  // The existing canon lock: nothing may touch his fate without the rule.
  assert.match(String(tinoCompanionPatch.status), /what-the-player-knows-about-tino/);
});

test("the export withholds development-room kinds — bible and references both", () => {
  // The room argues in THREAD and COMPANION_MISSION entries; the game must
  // never see them. Two doors lead out of the codex: the bible query, and
  // the per-node reference list (a scene can link a thread in the room, and
  // exporting that reference would dangle against a bible that withholds the
  // entry). This reads the exporter's source the way story-lock.test.ts
  // reads the actions', so removing either filter fails a test.
  assert.deepEqual([...developmentOnlyStoryKinds], ["THREAD", "COMPANION_MISSION"]);
  assert.ok(isDevelopmentOnlyStoryKind("THREAD") && isDevelopmentOnlyStoryKind("COMPANION_MISSION") && !isDevelopmentOnlyStoryKind("SYSTEM"));
  const exporter = readFileSync(join(process.cwd(), "lib/story-export.ts"), "utf8");
  assert.match(exporter, /kind:\s*\{\s*notIn:\s*\[\.\.\.developmentOnlyStoryKinds\]\s*\}/, "the bible query must exclude development-only kinds");
  assert.match(exporter, /!isDevelopmentOnlyStoryKind\(link\.entry\.kind\)/, "node references must drop development-only kinds");
});

test("every cross-reference the seed bodies make is kebab-case and intact", () => {
  // Prose links render as todos when unwritten — that is legal — but a
  // malformed slug can never resolve, so it would sit broken forever.
  for (const body of [amandaSeed.body, lizzarnixSeed.body, emptyCribsSeed.body, ...lizzarnixLorePatches.map((patch) => patch.body), ...companionMissionSeeds.map((seed) => seed.body)]) {
    for (const slug of storyProseLinks(body)) assert.ok(isValidStoryKey(slug), `body links malformed slug ${slug}`);
  }
  // The chain's bodies link the thread; the thread links Amanda and Tino.
  assert.ok(storyProseLinks(emptyCribsSeed.body).includes("amanda"));
  assert.ok(storyProseLinks(emptyCribsSeed.body).includes("tino"));
  assert.ok(storyProseLinks(emptyCribsSeed.body).includes("what-the-player-knows-about-tino"));
});
