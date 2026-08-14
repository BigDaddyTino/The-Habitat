import assert from "node:assert/strict";
import test from "node:test";
import { bossAnnouncementFreshnessMs, isAnnounceableBossKill } from "./legacy-history.js";

const now = new Date("2026-08-14T18:00:00.000Z");
const agedBy = (ms: number) => new Date(now.getTime() - ms);

test("recovering boss history never announces it as breaking news", () => {
  assert.equal(isAnnounceableBossKill(agedBy(60_000), now), true);
  assert.equal(isAnnounceableBossKill(agedBy(bossAnnouncementFreshnessMs - 1_000), now), true);
  assert.equal(isAnnounceableBossKill(agedBy(bossAnnouncementFreshnessMs), now), false);
  assert.equal(isAnnounceableBossKill(agedBy(30 * 24 * 60 * 60_000), now), false);
});

test("an unusable boss timestamp is never announced", () => {
  assert.equal(isAnnounceableBossKill(new Date("not a date"), now), false);
  assert.equal(isAnnounceableBossKill(agedBy(-bossAnnouncementFreshnessMs * 2), now), false);
  // Modest clock skew between the game host and the worker still announces.
  assert.equal(isAnnounceableBossKill(agedBy(-5_000), now), true);
});
