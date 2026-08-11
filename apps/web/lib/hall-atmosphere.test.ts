import assert from "node:assert/strict";
import test from "node:test";
import { getGreatHallAtmosphere, getHallEncounterSchedule, getHallSky, isCurrentHallEncounter } from "./hall-atmosphere";

test("uses Eastern time for the four Hall sky phases", () => {
  assert.equal(getHallSky(6), "sunrise");
  assert.equal(getHallSky(12), "midday");
  assert.equal(getHallSky(18), "sunset");
  assert.equal(getHallSky(23), "night");
});

test("schedules three non-overlapping encounter windows per Eastern hour", () => {
  const date = new Date("2026-08-11T16:00:00.000Z");
  const schedule = getHallEncounterSchedule(date);
  assert.equal(schedule.length, 3);
  assert.equal(new Set(schedule.map((entry) => entry.encounter)).size, 3);
  schedule.forEach((entry, index) => {
    assert.ok(entry.startsAtSecond >= index * 1_200 + 90);
    assert.ok(entry.endsAtSecond < (index + 1) * 1_200 - 89);
  });
  assert.deepEqual(schedule, getHallEncounterSchedule(date));
});

test("is quiet outside a window and server-verifies an active encounter key", () => {
  const hour = new Date("2026-08-11T16:00:00.000Z");
  const [window] = getHallEncounterSchedule(hour);
  assert.ok(window);
  assert.equal(getGreatHallAtmosphere(hour).encounter, "none");

  const active = new Date(hour.getTime() + (window.startsAtSecond + 1) * 1_000);
  const atmosphere = getGreatHallAtmosphere(active);
  assert.equal(atmosphere.encounter, window.encounter);
  assert.equal(atmosphere.encounterKey, window.encounterKey);
  assert.ok(atmosphere.encounterProgress > 0);
  assert.ok(atmosphere.encounterProgress < 1);
  assert.equal(atmosphere.encounterDurationSeconds, window.endsAtSecond - window.startsAtSecond);
  assert.equal(isCurrentHallEncounter(window.encounter, window.encounterKey, active), true);
  assert.equal(isCurrentHallEncounter(window.encounter, `${window.encounterKey}:forged`, active), false);
});
