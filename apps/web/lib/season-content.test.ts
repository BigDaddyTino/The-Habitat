import assert from "node:assert/strict";
import test from "node:test";
import { hoursFromPlaySeconds, playSecondsFromHours, seasonContentEditability, seasonGoalProblems, seasonGoalWarnings, seasonRuleCopy, seasonRuleTypes, seasonSlugFrom, trophyArtwork } from "./season-content";

test("an unstarted season is fully editable, a running one only in presentation", () => {
  const upcoming = seasonContentEditability("UPCOMING");
  assert.deepEqual([upcoming.structural, upcoming.measurable, upcoming.presentation], [true, true, true]);
  const active = seasonContentEditability("ACTIVE");
  assert.deepEqual([active.structural, active.measurable, active.presentation], [false, false, true]);
  const completed = seasonContentEditability("COMPLETED");
  assert.deepEqual([completed.structural, completed.measurable, completed.presentation], [false, false, false]);
  for (const status of ["UPCOMING", "ACTIVE", "COMPLETED"] as const) assert.ok(seasonContentEditability(status).reason.length > 20);
});

test("a distinct-game goal pinned to one game is rejected as unreachable", () => {
  // measureSeasonRule filters events to that game first, so the count can only
  // ever be 1 -- a threshold above that would sit unmet for the whole season.
  const problems = seasonGoalProblems({ ruleType: "DISTINCT_GAME_COUNT", gameType: "PALWORLD", threshold: 3 });
  assert.equal(problems.length, 1);
  assert.match(problems[0], /only ever reach 1/);
  assert.deepEqual(seasonGoalProblems({ ruleType: "DISTINCT_GAME_COUNT", gameType: null, threshold: 3 }), []);
});

test("a distinct-game goal beyond the Habitat's six games is rejected", () => {
  assert.equal(seasonGoalProblems({ ruleType: "DISTINCT_GAME_COUNT", gameType: null, threshold: 7 }).length, 1);
  assert.deepEqual(seasonGoalProblems({ ruleType: "DISTINCT_GAME_COUNT", gameType: null, threshold: 6 }), []);
});

test("a game-restricted goal is fine for every rule that actually filters by game", () => {
  for (const ruleType of seasonRuleTypes.filter((rule) => rule !== "DISTINCT_GAME_COUNT")) {
    assert.deepEqual(seasonGoalProblems({ ruleType, gameType: "VALHEIM", threshold: 30 }), [], ruleType);
  }
});

test("boss-kill and tiny-playtime goals warn without blocking", () => {
  assert.equal(seasonGoalProblems({ ruleType: "BOSS_KILL_COUNT", gameType: "VALHEIM", threshold: 5 }).length, 0);
  assert.equal(seasonGoalWarnings({ ruleType: "BOSS_KILL_COUNT", gameType: "VALHEIM", threshold: 5 }).length, 1);
  // 300 seconds reads as "300" in the form; the warning stops it being mistaken for hours
  assert.equal(seasonGoalWarnings({ ruleType: "PLAY_SECONDS", gameType: null, threshold: 300 }).length, 1);
  assert.equal(seasonGoalWarnings({ ruleType: "PLAY_SECONDS", gameType: null, threshold: 36_000 }).length, 0);
});

test("every rule type carries copy naming its unit and its evidence", () => {
  for (const rule of seasonRuleTypes) {
    assert.ok(seasonRuleCopy[rule].label.length > 0, rule);
    assert.ok(seasonRuleCopy[rule].unit.length > 0, rule);
    assert.ok(seasonRuleCopy[rule].measures.length > 20, rule);
  }
});

test("trophy codes report honestly whether authored artwork exists", () => {
  assert.equal(trophyArtwork("first-light-standard").authored, true);
  assert.equal(trophyArtwork("founders-lantern").authored, true);
  const invented = trophyArtwork("second-light-banner");
  assert.equal(invented.authored, false);
  assert.match(invented.note, /generic trophy form/);
  // a code cannot smuggle in a prototype-chain key
  assert.equal(trophyArtwork("constructor").authored, false);
  assert.equal(trophyArtwork("toString").authored, false);
});

test("slugs stay inside the database column and never keep stray separators", () => {
  assert.equal(seasonSlugFrom("The Long Watch"), "the-long-watch");
  assert.equal(seasonSlugFrom("  Mark Three Trails!  "), "mark-three-trails");
  assert.equal(seasonSlugFrom("Café Rounds"), "cafe-rounds");
  assert.equal(seasonSlugFrom("!!!"), "");
  assert.ok(seasonSlugFrom("x".repeat(200)).length <= 80);
});

test("playtime converts between the stored seconds and the hours an admin thinks in", () => {
  assert.equal(playSecondsFromHours(10), 36_000);
  assert.equal(hoursFromPlaySeconds(36_000), 10);
  assert.equal(hoursFromPlaySeconds(playSecondsFromHours(1.5)), 1.5);
});
