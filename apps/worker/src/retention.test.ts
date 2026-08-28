import assert from "node:assert/strict";
import test from "node:test";
import { metricRetentionBounds, metricRetentionCutoff, parseMetricRetentionDays } from "./retention.js";

/**
 * `ServerMetricSample` reached 609,931 rows and 129 MB in eighteen days with
 * nothing ever deleting one — larger than every other table combined, and on
 * course for roughly 2.5 GB a year. These cover the two ways a retention
 * window goes wrong: no bound at all, and a bound so tight it eats the data
 * something is still reading.
 */

const now = new Date("2026-08-28T22:00:00.000Z");

test("an unset window keeps a month rather than keeping everything", () => {
  assert.equal(parseMetricRetentionDays(undefined), metricRetentionBounds.defaultDays);
  assert.equal(parseMetricRetentionDays(""), metricRetentionBounds.defaultDays);
  assert.equal(parseMetricRetentionDays("   "), metricRetentionBounds.defaultDays);
});

test("a window is honoured inside its bounds", () => {
  assert.equal(parseMetricRetentionDays("7"), 7);
  assert.equal(parseMetricRetentionDays("90"), 90);
  assert.equal(parseMetricRetentionDays("3650"), 3650);
});

test("a window that would eat what the world page still reads is refused", () => {
  // The world page asks for the newest 48 samples per server; a window of days
  // rather than hours is what keeps that whole. Zero is the old bug inverted.
  for (const rejected of ["0", "1", "6", "-30"]) {
    assert.throws(() => parseMetricRetentionDays(rejected), /HABITAT_METRIC_RETENTION_DAYS/, `${rejected} was accepted`);
  }
});

test("a window nobody could have meant is refused rather than rounded", () => {
  for (const rejected of ["3651", "30.5", "thirty", "30d", "1e6"]) {
    assert.throws(() => parseMetricRetentionDays(rejected), /HABITAT_METRIC_RETENTION_DAYS/, `${rejected} was accepted`);
  }
});

test("the cutoff is the window measured back from now", () => {
  assert.equal(metricRetentionCutoff(30, now).toISOString(), "2026-07-29T22:00:00.000Z");
  assert.equal(metricRetentionCutoff(7, now).toISOString(), "2026-08-21T22:00:00.000Z");
});

test("the default window deletes nothing that exists today", () => {
  // The oldest sample on this installation was 2026-08-10. A thirty-day
  // default therefore removes nothing on the day it ships and starts working
  // before the table becomes a problem — which is the point of choosing it.
  const oldestSampleHere = new Date("2026-08-10T13:48:50.683Z");
  assert.ok(metricRetentionCutoff(metricRetentionBounds.defaultDays, now) < oldestSampleHere);
});
