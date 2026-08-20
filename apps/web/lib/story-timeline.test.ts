import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { arrangeTimeline, timelineEraLabel, timelineYearsAgo } from "./story-timeline";
import { metaSchemasByKind } from "./story-meta-schemas";
import { codexArtSlot, findCodexArt, resolveCodexArtFile } from "./codex-art";

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

test("every codex surface a write can change is revalidated", () => {
  // The hand-written revalidation list had drifted: systems, events, themes,
  // rules, and the timeline were all missing, so those pages served stale
  // content after a save. The list is derived from storyCollections now, and
  // this pins both halves — the derivation and the non-collection pages.
  const actions = readFileSync(join(process.cwd(), "app/codex/actions.ts"), "utf8");
  const refresh = actions.slice(actions.indexOf("function refreshCodex"), actions.indexOf("function refreshCodex") + 1200);
  assert.match(refresh, /Object\.keys\(storyCollections\)/, "library paths must be derived, never hand-listed");
  for (const page of ["/codex", "/codex/stories", "/codex/stories/canon", "/codex/bible", "/codex/timeline", "/codex/threads", "/codex/promises", "/codex/review"]) {
    assert.ok(refresh.includes(`"${page}"`), `${page} must be revalidated after a write`);
  }
});

test("the event sheet accepts the anchors the timeline needs, and refuses the rest", () => {
  // Exercises the real schema rather than grepping for it, so this keeps
  // holding wherever the schemas live.
  const schema = metaSchemasByKind.EVENT;
  assert.ok(schema, "EVENT must have a sheet schema");
  const base = { when: "the present day", where: [], involved: [], outcome: null, openQuestions: [] };
  for (const anchor of [9000, 0.02, 0, null]) {
    assert.ok(schema.safeParse({ ...base, timelineYearsAgo: anchor }).success, `${anchor} should be a valid anchor`);
  }
  for (const anchor of [-1, "9000", Number.NaN]) {
    assert.equal(schema.safeParse({ ...base, timelineYearsAgo: anchor }).success, false, `${String(anchor)} should be refused`);
  }
  // Every field is required-but-nullable, so an omitted anchor is a rejected
  // save, not a silent null — which is why stored rows must carry the key.
  assert.equal(schema.safeParse(base).success, false, "omitting the anchor must be refused");
});

test("art is found by convention and served off disk, not from the static index", () => {
  // Files under public/ are indexed when the app is built, so art dropped in
  // afterwards 404s until the next build — which silently broke the promise
  // every art slot makes. Resolution goes through /codex-art instead.
  const art = findCodexArt("timeline", "the-great-purges");
  assert.ok(art, "the seeded timeline art should be found");
  assert.match(art, /^\/codex-art\/timeline\/the-great-purges\.(png|jpg|jpeg|webp)$/);
  assert.equal(findCodexArt("timeline", "nothing-has-been-drawn-for-this"), null);
  // The slot tells a human where to put the file, in public/ terms.
  assert.equal(codexArtSlot("timeline", "the-drain"), "images/timeline/the-drain.png");
});

test("the art route cannot be talked out of its two directories", () => {
  assert.ok(resolveCodexArtFile("timeline", "the-great-purges.jpg"), "a real file resolves");
  for (const [kind, file] of [
    ["timeline", "../../../.env"],
    ["timeline", "..%2F..%2Fsecrets.png"],
    ["secrets", "the-great-purges.jpg"],
    ["timeline", "the-great-purges.svg"],
    ["timeline", "The-Great-Purges.jpg"],
    ["timeline", "the-great-purges"],
  ] as Array<[string, string]>) {
    assert.equal(resolveCodexArtFile(kind, file), null, `${kind}/${file} must be refused`);
  }
});
