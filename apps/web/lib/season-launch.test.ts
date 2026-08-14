import assert from "node:assert/strict";
import test from "node:test";
import { seasonEndFor } from "@habitat/shared";
import { seasonLaunchReadiness, type SeasonLaunchState } from "./season-launch";

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
