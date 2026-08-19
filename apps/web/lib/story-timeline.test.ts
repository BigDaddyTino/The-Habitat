import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { arrangeTimeline, timelineEraLabel, timelineYearsAgo } from "./story-timeline";

const event = (slug: string, yearsAgo: number | null | undefined, title = slug) => ({
  slug,
  title,
  meta: yearsAgo === undefined ? null : ({ timelineYearsAgo: yearsAgo } as Record<string, unknown>),
});

test("the line runs oldest to newest, top to bottom", () => {
  const { dated } = arrangeTimeline([event("drain", 0), event("first-hunt", 9000), event("purges", 2000)]);
  assert.deepEqual(dated.map((entry) => entry.slug), ["first-hunt", "purges", "drain"]);
});

test("fractions order same-era events without inventing dates", () => {
  // The Strike happens before the Fall; both are "now". 0.02 sits above 0.01
  // on the way down to the present.
  const { dated } = arrangeTimeline([event("the-fall", 0.01), event("the-strike", 0.02)]);
  assert.deepEqual(dated.map((entry) => entry.slug), ["the-strike", "the-fall"]);
});

test("undated history is shown apart, never silently dropped", () => {
  const { dated, undated } = arrangeTimeline([
    event("dated", 100),
    event("no-meta", undefined),
    event("null-year", null),
    event("bad-year", -5),
    event("wrong-type", "old" as unknown as number),
  ]);
  assert.deepEqual(dated.map((entry) => entry.slug), ["dated"]);
  // Alphabetical, so the section is stable across reloads.
  assert.deepEqual(undated.map((entry) => entry.slug), ["bad-year", "no-meta", "null-year", "wrong-type"]);
});

test("ties settle alphabetically so the arrangement is deterministic", () => {
  const { dated } = arrangeTimeline([event("b", 500, "Zeta"), event("a", 500, "Alpha")]);
  assert.deepEqual(dated.map((entry) => entry.title), ["Alpha", "Zeta"]);
});

test("era labels read as eras, not as decimals", () => {
  assert.equal(timelineEraLabel(0.02), "within the last year");
  assert.equal(timelineEraLabel(1), "~1 year ago");
  assert.equal(timelineEraLabel(50), "~50 years ago");
  assert.equal(timelineEraLabel(9000), "~9,000 years ago");
  assert.equal(timelineEraLabel(8734), "~8,700 years ago");
});

test("the anchor only accepts what the sheet schema accepts", () => {
  assert.equal(timelineYearsAgo({ timelineYearsAgo: 150 }), 150);
  assert.equal(timelineYearsAgo({ timelineYearsAgo: 0 }), 0);
  assert.equal(timelineYearsAgo({ timelineYearsAgo: -1 }), null);
  assert.equal(timelineYearsAgo({ timelineYearsAgo: Number.NaN }), null);
  assert.equal(timelineYearsAgo({}), null);
  assert.equal(timelineYearsAgo(null), null);
});

test("the event schema carries the timeline anchor", () => {
  const actions = readFileSync(join(process.cwd(), "app/codex/actions.ts"), "utf8");
  assert.match(actions, /timelineYearsAgo: z\.number\(\)\.min\(0\)/, "the sheet must validate the anchor");
});
