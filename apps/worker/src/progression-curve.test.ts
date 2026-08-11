import assert from "node:assert/strict";
import test from "node:test";
import { levelForXp, progressionForXp, utcWeekWindow, verifiedPlaytimeXp, xpRequiredForLevel } from "@habitat/shared";
import { selectWeeklyQuestRotation } from "./progression.js";

test("the 100-level curve is steep, monotonic, and takes over one million XP", () => {
  assert.equal(xpRequiredForLevel(1), 0);
  for (let level = 2; level <= 100; level += 1) assert.ok(xpRequiredForLevel(level) > xpRequiredForLevel(level - 1));
  assert.ok(xpRequiredForLevel(100) > 1_000_000);
  assert.equal(levelForXp(xpRequiredForLevel(50)), 50);
  assert.equal(progressionForXp(xpRequiredForLevel(100)).progressPercent, 100);
});

test("verified short sessions accumulate in five-minute XP units", () => {
  assert.equal(verifiedPlaytimeXp(299), 0);
  assert.equal(verifiedPlaytimeXp(300), 1);
  assert.equal(verifiedPlaytimeXp(3_600), 12);
});

test("weekly windows begin Monday at midnight UTC", () => {
  assert.deepEqual(utcWeekWindow(new Date("2026-08-13T20:00:00.000Z")), { weekStart: new Date("2026-08-10T00:00:00.000Z"), endsAt: new Date("2026-08-17T00:00:00.000Z") });
});

test("weekly quest rotation is deterministic and always includes each activity family", () => {
  const definitions = [
    { id: "1", slug: "play-a", ruleType: "PLAY_SECONDS" as const },
    { id: "2", slug: "play-b", ruleType: "PLAY_SECONDS" as const },
    { id: "3", slug: "joins", ruleType: "JOIN_COUNT" as const },
    { id: "4", slug: "worlds", ruleType: "DISTINCT_GAME_COUNT" as const },
    { id: "5", slug: "joins-b", ruleType: "JOIN_COUNT" as const },
  ];
  const week = new Date("2026-08-10T00:00:00.000Z");
  const first = selectWeeklyQuestRotation(definitions, week);
  assert.deepEqual(first, selectWeeklyQuestRotation(definitions, week));
  assert.equal(first.length, 4);
  assert.deepEqual(new Set(first.map((quest) => quest.ruleType)), new Set(["PLAY_SECONDS", "JOIN_COUNT", "DISTINCT_GAME_COUNT"]));
});
