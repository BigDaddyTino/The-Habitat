import assert from "node:assert/strict";
import test from "node:test";
import { seasonEndFor } from "@habitat/shared";
import { seasonAvailabilityProblems, seasonLaunchReadiness, seasonScheduleProblems, type SeasonLaunchState } from "./season-launch";

const ready: SeasonLaunchState = { status: "UPCOMING", trophyCount: 2, questCount: 5, expeditionCount: 6, xpEntryCount: 0 };

test("a seeded, unstarted season with trophies is launchable without caveats", () => {
  const readiness = seasonLaunchReadiness(ready);
  assert.equal(readiness.launchable, true);
  assert.deepEqual(readiness.blockers, []);
  assert.deepEqual(readiness.warnings, []);
});

test("a season that could never reward anyone is refused", () => {
  const readiness = seasonLaunchReadiness({ ...ready, trophyCount: 0 });
  assert.equal(readiness.launchable, false);
  assert.match(readiness.blockers[0] ?? "", /trophy/i);
});

test("a running or closed season is never relaunched", () => {
  assert.equal(seasonLaunchReadiness({ ...ready, status: "ACTIVE" }).launchable, false);
  assert.equal(seasonLaunchReadiness({ ...ready, status: "COMPLETED" }).launchable, false);
});

test("a season already holding seasonal XP cannot have its window moved", () => {
  const readiness = seasonLaunchReadiness({ ...ready, xpEntryCount: 1 });
  assert.equal(readiness.launchable, false);
  assert.match(readiness.blockers.join(" "), /ledger/i);
});

test("a goalless season launches but says so", () => {
  const readiness = seasonLaunchReadiness({ ...ready, questCount: 0, expeditionCount: 0 });
  assert.equal(readiness.launchable, true);
  assert.equal(readiness.warnings.length, 1);
});

test("every blocker is reported, so fixing one does not hide the next", () => {
  const readiness = seasonLaunchReadiness({ status: "COMPLETED", trophyCount: 0, questCount: 0, expeditionCount: 0, xpEntryCount: 4 });
  assert.equal(readiness.blockers.length, 3);
});

test("a launch window always lands on a date the season CHECK constraint accepts", () => {
  // Postgres clamps `+ INTERVAL '3 months'`; an admin launching on the 31st must
  // not produce an end date the database will reject.
  assert.equal(seasonEndFor(new Date("2026-08-14T20:31:07.412Z")).toISOString(), "2026-11-14T20:31:07.412Z");
  assert.equal(seasonEndFor(new Date("2026-11-30T09:15:00.000Z")).toISOString(), "2027-02-28T09:15:00.000Z");
  assert.equal(seasonEndFor(new Date("2026-12-31T00:00:00.000Z")).toISOString(), "2027-03-31T00:00:00.000Z");
});

test("scheduling never back-credits a past opening", () => {
  const now = new Date("2026-08-14T16:00:00.000Z");
  assert.equal(seasonScheduleProblems(new Date("2026-08-15T00:00:00.000Z"), now).length, 0);
  assert.match(seasonScheduleProblems(new Date("2026-08-14T00:00:00.000Z"), now)[0] ?? "", /Launch now/);
  assert.equal(seasonScheduleProblems(new Date("invalid"), now).length, 1);
});

test("a running season cannot be disabled before its worker closes it", () => {
  assert.equal(seasonAvailabilityProblems("ACTIVE", false).length, 1);
  assert.deepEqual(seasonAvailabilityProblems("ACTIVE", true), []);
  assert.deepEqual(seasonAvailabilityProblems("UPCOMING", false), []);
  assert.equal(seasonAvailabilityProblems("UPCOMING", true, { wasEnabled: false, startsAt: new Date("2026-08-14T00:00:00.000Z"), now: new Date("2026-08-14T12:00:00.000Z") }).length, 1);
  assert.deepEqual(seasonAvailabilityProblems("UPCOMING", true, { wasEnabled: false, startsAt: new Date("2026-08-15T00:00:00.000Z"), now: new Date("2026-08-14T12:00:00.000Z") }), []);
});
