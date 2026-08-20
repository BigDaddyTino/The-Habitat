import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { randomUUID } from "node:crypto";
import { storyArcCategories, storyCanonPacketTargetKinds } from "@habitat/shared";
import { canonPacketSchema, threadMetaSchema } from "@/lib/story-meta-schemas";
import { ripplesForArc, type StoryRippleWeb } from "@/lib/story-codex";

/**
 * The road out of the development room, and the web of what one quest does
 * that another quest can see.
 *
 * Two of these are source pins rather than behaviour tests, and deliberately:
 * the sharpest failure modes here are silent. A sheet that stops passing the
 * packets through deletes them on the next save, and an arc writer that sets
 * `category` without `isMainline` ships a mainline chapter the game files as a
 * side quest. Neither shows up as an exception anywhere.
 */

// Deliberately loosely typed: several of these tests hand the schema shapes
// TypeScript would refuse, which is exactly what the schema exists to catch at
// runtime when the value came out of the database rather than out of a form.
const packet = (over: Record<string, unknown> = {}): Record<string, unknown> => ({
  id: randomUUID(),
  title: "What happens at the chapel",
  body: "The bell is rung three times. Nobody argues about that part any more.",
  targetKind: "campaign",
  targetRegion: null,
  targetCompanion: null,
  entries: ["amanda"],
  status: "pending",
  pushedAt: new Date("2026-08-20T12:00:00.000Z").toISOString(),
  pushedBy: "Tino",
  wovenAt: null,
  wovenBy: null,
  wovenInto: [],
  ...over,
});

test("a pending packet round-trips, and so does a woven one", () => {
  const pending = canonPacketSchema.safeParse(packet());
  assert.equal(pending.success, true);

  const woven = canonPacketSchema.safeParse(packet({
    status: "woven",
    wovenAt: new Date("2026-08-21T09:00:00.000Z").toISOString(),
    wovenBy: "Martino",
    wovenInto: ["the-drowned-chapel"],
  }));
  assert.equal(woven.success, true);
});

test("a packet aimed at a place has to say which place", () => {
  // Without this, the packet lands in a bubble nobody can open and sits in the
  // inbox forever with no destination to filter it by.
  assert.equal(canonPacketSchema.safeParse(packet({ targetKind: "region" })).success, false);
  assert.equal(canonPacketSchema.safeParse(packet({ targetKind: "region", targetRegion: "the-peninsula" })).success, true);
  // And the reverse: a place attached to a packet aimed somewhere else is a
  // stale value from a picker that was switched, not a destination.
  assert.equal(canonPacketSchema.safeParse(packet({ targetKind: "campaign", targetRegion: "the-peninsula" })).success, false);
  assert.equal(canonPacketSchema.safeParse(packet({ targetKind: "events", targetCompanion: "amanda" })).success, false);
});

test("a companions packet may name one companion or none at all", () => {
  assert.equal(canonPacketSchema.safeParse(packet({ targetKind: "companions" })).success, true);
  assert.equal(canonPacketSchema.safeParse(packet({ targetKind: "companions", targetCompanion: "amanda" })).success, true);
});

test("only the two real states are states, and every field is checked", () => {
  assert.equal(canonPacketSchema.safeParse(packet({ status: "approved" })).success, false);
  assert.equal(canonPacketSchema.safeParse(packet({ targetKind: "somewhere" })).success, false);
  assert.equal(canonPacketSchema.safeParse(packet({ entries: ["The Peninsula"] })).success, false, "entry references are slugs, never names");
  assert.equal(canonPacketSchema.safeParse(packet({ title: "" })).success, false);
  assert.equal(canonPacketSchema.safeParse(packet({ body: "" })).success, false);
});

test("the thread sheet refuses a save that forgot the packets", () => {
  // This is the whole reason the field is required with no default. A sheet
  // that drops it fails loudly here instead of quietly deleting settled
  // material that a writer already sent to canon.
  const meta = {
    threadStatus: "brainstorming",
    categories: [],
    stages: [],
    priority: null,
    spoilerLevel: null,
    parent: null,
    characters: [],
    companions: [],
    factions: [],
    locations: [],
    arcs: [],
    companionMissions: [],
    bosses: [],
    canonPackets: [packet()],
    tags: [],
    openQuestions: [],
  };
  assert.equal(threadMetaSchema.safeParse(meta).success, true);

  const withoutPackets: Record<string, unknown> = { ...meta };
  delete withoutPackets.canonPackets;
  assert.equal(threadMetaSchema.safeParse(withoutPackets).success, false, "omitting canonPackets must be refused, never silently defaulted");
});

test("the thread sheet carries the packets through instead of composing them away", () => {
  // The sheet serializes the WHOLE meta object into one hidden field and zod
  // strips what it does not see, so a missing pass-through line is a data
  // loss with no error attached to it.
  const sheets = readFileSync(join(process.cwd(), "components/story-entry-sheets.tsx"), "utf8");
  const composed = sheets.slice(sheets.indexOf("const composed: StoryThreadMeta = {"));
  assert.match(composed.slice(0, 1400), /canonPackets: asArray\(source\.canonPackets\)/, "ThreadSheet must pass canonPackets straight through");

  const mission = sheets.slice(sheets.indexOf("const composed: StoryCompanionMissionMeta = {"));
  assert.match(mission.slice(0, 900), /arc: orNull\(arc\)/, "CompanionMissionSheet must compose the arc it became");
});

test("every packet action re-validates the whole thread sheet on the way out", () => {
  const actions = readFileSync(join(process.cwd(), "app/codex/actions.ts"), "utf8");
  const shared = actions.slice(actions.indexOf("async function withThreadPackets"), actions.indexOf("const packetPushSchema"));
  assert.match(shared, /threadMetaSchema\.safeParse\(entry\.meta\)/, "the packets must be read through the schema");
  assert.match(shared, /threadMetaSchema\.safeParse\(\{/, "the whole meta must be re-validated before it is written");
  assert.match(shared, /where: \{ id: entry\.id, version: input\.version \}/, "a packet write is version-guarded like any sheet save");

  for (const action of ["pushCanonPacket", "markCanonPacketWoven", "withdrawCanonPacket"]) {
    const body = actions.slice(actions.indexOf(`export async function ${action}(`));
    assert.match(body.slice(0, 3000), /withThreadPackets\(/, `${action} must go through the shared guarded write`);
  }
});

test("weaving is a one-way door, and withdrawing only reaches what is still pending", () => {
  const actions = readFileSync(join(process.cwd(), "app/codex/actions.ts"), "utf8");
  const weave = actions.slice(actions.indexOf("export async function markCanonPacketWoven("), actions.indexOf("export async function withdrawCanonPacket("));
  assert.match(weave, /if \(packet\.status === "woven"\) throw/, "re-weaving would rewrite who did it and when");
  assert.match(weave, /arcs: \[\.\.\.new Set\(\[\.\.\.meta\.arcs, \.\.\.wovenInto\]\)\]/, "the shipped trace is unioned, never replaced");

  const withdraw = actions.slice(actions.indexOf("export async function withdrawCanonPacket("));
  assert.match(withdraw.slice(0, 2000), /if \(packet\.status === "woven"\) throw/, "woven material is history, not a pending push");
});

test("isMainline and the category are written together, everywhere an arc is written", () => {
  // The database CHECK refuses a row where they disagree, so a writer that
  // sets one and forgets the other fails loudly. These pins say the three
  // writers actually set both, so that failure never reaches a writer.
  const actions = readFileSync(join(process.cwd(), "app/codex/actions.ts"), "utf8");
  for (const action of ["createArc", "updateArc"]) {
    const body = actions.slice(actions.indexOf(`export async function ${action}(`), actions.indexOf(`export async function ${action}(`) + 3000);
    assert.match(body, /isMainline: (parsed\.data\.category|nextCategory) === "MAINLINE"/, `${action} must derive isMainline from the category`);
  }

  const seed = readFileSync(join(process.cwd(), "../../packages/db/scripts/ingest-story-seed.ts"), "utf8");
  assert.match(seed, /category: arc\.isMainline \? "MAINLINE" : "SIDE_QUEST"/, "the seed ingest is the third writer");

  const migration = readFileSync(join(process.cwd(), "../../packages/db/prisma/migrations/20260820120000_add_story_arc_category/migration.sql"), "utf8");
  assert.match(migration, /CHECK \("isMainline" = \("category" = 'MAINLINE'\)\)/, "the lockstep is enforced by the database, not by convention");
});

test("the export gains the category and keeps the boolean it always shipped", () => {
  // Additive only. An importer that knows nothing but `isMainline` keeps
  // reading exactly what it always read.
  const exporter = readFileSync(join(process.cwd(), "lib/story-export.ts"), "utf8");
  assert.match(exporter, /isMainline: arc\.isMainline,/, "the v1 contract's field must survive");
  assert.match(exporter, /category: arc\.category,/);
  assert.ok(storyArcCategories.includes("MAINLINE"));
});

test("the promises ledger and the ripple web read the same scan", () => {
  // Two scanners drifted the moment one of them learned about a site the
  // other did not, and the two pages would then disagree about the same board.
  const codex = readFileSync(join(process.cwd(), "lib/story-codex.ts"), "utf8");
  const promises = codex.slice(codex.indexOf("export async function getStoryPromises()"), codex.indexOf("export type StoryRippleSite"));
  const ripples = codex.slice(codex.indexOf("export async function getStoryRipples()"), codex.indexOf("export function ripplesForArc"));
  assert.match(promises, /await scanStoryFlagSites\(\)/);
  assert.match(ripples, /scanStoryFlagSites\(\)/);

  // The ledger's shape is unchanged by the refactor: five fields per site, the
  // same four counters, the same four states.
  assert.match(promises, /\{ label: row\.label, detail: row\.detail, arcSlug: row\.arcSlug, arcTitle: row\.arcTitle, nodeId: row\.nodeId \}/);
  for (const counter of ["planted", "unset", "wired", "dormant"]) {
    assert.ok(promises.includes(`${counter}: threads.filter`), `the ${counter} counter must survive`);
  }
});

test("a flag set and read inside one quest is that quest's own machinery, not a ripple", () => {
  const codex = readFileSync(join(process.cwd(), "lib/story-codex.ts"), "utf8");
  const ripples = codex.slice(codex.indexOf("export async function getStoryRipples()"), codex.indexOf("export function ripplesForArc"));
  assert.match(ripples, /if \(from\.arcSlug === to\.arcSlug\) continue;/, "only crossings count as ripples");
  // The amber half: a promise nobody plants, a promise nobody collects, and
  // material still sitting in the inbox.
  for (const kind of ['kind: "unset"', 'kind: "planted"', 'kind: "packet"']) assert.ok(ripples.includes(kind), `${kind} must be reported as a future connection`);
});

const site = (arcSlug: string, isMainline = false, position = 0) => ({
  label: "Continue",
  detail: "scene effect",
  arcSlug,
  arcTitle: arcSlug,
  arcCategory: (isMainline ? "MAINLINE" : "SIDE_QUEST") as (typeof storyArcCategories)[number],
  isMainline,
  position,
  nodeId: `${arcSlug}-node`,
});

test("one arc's slice of the web separates what it does from what is done to it", () => {
  const web: StoryRippleWeb = {
    ripples: [
      { flag: "chapel-bell", flagTitle: "The chapel bell", from: site("the-drowned-chapel"), to: site("act-one", true, 0) },
      { flag: "amanda-knows", flagTitle: "Amanda knows", from: site("act-one", true, 0), to: site("the-drowned-chapel") },
      { flag: "elsewhere", flagTitle: "Elsewhere", from: site("a"), to: site("b") },
    ],
    chains: [
      { from: { arcSlug: "the-drowned-chapel", arcTitle: "The drowned chapel", nodeId: "n1", nodeTitle: "The bell stops" }, to: { arcSlug: "act-two", arcTitle: "Act Two" } },
      { from: { arcSlug: "act-one", arcTitle: "Act One", nodeId: "n2", nodeTitle: "The gates" }, to: { arcSlug: "the-drowned-chapel", arcTitle: "The drowned chapel" } },
    ],
    future: [
      { flag: "unplanted", flagTitle: "Unplanted", kind: "unset", detail: "nothing sets it", where: site("the-drowned-chapel"), packet: null },
      { flag: "elsewhere-future", flagTitle: "Elsewhere", kind: "planted", detail: "nothing reads it", where: site("a"), packet: null },
    ],
  };

  const here = ripplesForArc(web, "the-drowned-chapel");
  assert.deepEqual(here.outgoing.map((row) => row.flag), ["chapel-bell"]);
  assert.deepEqual(here.incoming.map((row) => row.flag), ["amanda-knows"]);
  assert.deepEqual(here.continues.map((row) => row.to.arcSlug), ["act-two"]);
  assert.deepEqual(here.continuedFrom.map((row) => row.from.arcSlug), ["act-one"]);
  assert.deepEqual(here.future.map((row) => row.flag), ["unplanted"]);

  // A quest nothing touches gets an honestly empty slice rather than somebody
  // else's connections.
  const nowhere = ripplesForArc(web, "a-quest-with-no-flags");
  assert.equal(nowhere.outgoing.length + nowhere.incoming.length + nowhere.continues.length + nowhere.continuedFrom.length + nowhere.future.length, 0);
});

test("the canon inbox reads its packets forgivingly and its destinations exactly", () => {
  const codex = readFileSync(join(process.cwd(), "lib/story-codex.ts"), "utf8");
  const reader = codex.slice(codex.indexOf("function readCanonPackets"), codex.indexOf("export async function getCanonInbox"));
  assert.match(reader, /canonPacketSchema\.safeParse\(row\)/, "a malformed packet is skipped, never thrown on");
  assert.doesNotMatch(reader, /throw /, "one bad row must not be able to take down every surface that renders the sidebar");

  // Every destination the packet schema accepts has to be a destination the
  // inbox can actually count, or a packet lands in a bubble that never lights.
  const inbox = codex.slice(codex.indexOf("export async function getCanonInbox"), codex.indexOf("export type CanonNavArc"));
  for (const kind of storyCanonPacketTargetKinds) assert.ok(inbox.includes(`"${kind}"`), `the inbox must count ${kind} packets`);
});

test("the canon navigator is always present on desktop and starts folded on mobile", () => {
  const source = readFileSync(join(process.cwd(), "components/canon-navigator.tsx"), "utf8");
  assert.match(source, /<aside className="canon-nav canon-nav-desktop">/);
  assert.match(source, /<details className="canon-nav canon-nav-mobile">/);
  assert.doesNotMatch(source, /<details className="canon-nav canon-nav-mobile" open>/);
});

const newline = String.fromCharCode(10);

test("the writer-facing copy on the new surfaces stays out of the machine room", () => {
  // The room’s writers are not computer people. Nothing they read should be
  // named after the database column behind it, so the visible copy on every
  // new surface is scanned for the words that leak out of the machine room.
  const jargon = new RegExp(String.raw`(meta|metaJson|slug|slugs|category|categories)`, "i");
  for (const file of ["components/canon-navigator.tsx", "components/canon-packet-panel.tsx", "components/story-room-guide.tsx", "components/story-arc-form.tsx", "app/codex/stories/page.tsx", "app/codex/stories/canon/page.tsx"]) {
    const source = readFileSync(join(process.cwd(), file), "utf8");
    for (const raw of source.split(newline)) {
      const line = raw.trim();
      if (line.startsWith("//") || line.startsWith("*") || line.startsWith("/*")) continue;
      // A single-line JSX expression is code, not copy. A line still holding a
      // brace after those are removed belongs to a multi-line expression, and
      // is skipped rather than read as prose it is not.
      const stripped = raw.replace(/{[^{}]*}/g, " ");
      if (stripped.includes("{") || stripped.includes("}")) continue;
      // What is left once the tags themselves are gone is what a writer reads.
      const visible = stripped.replace(/<[^>]*>/g, " ");
      assert.doesNotMatch(visible, jargon, `${file} shows internal jargon to a writer: ${line}`);
    }
  }
});

test("a companion quest counts as a tie to the world, not an orphan", () => {
  // An arc reaches into the bible two ways — the place it is picked up and the
  // companion whose story it is — and the reachability scan only knew about
  // the first. A character whose sole connection was that somebody opened
  // their companion quest was reported as unconnected, which sends a writer
  // chasing a problem that is not there.
  const codex = readFileSync(join(process.cwd(), "lib/story-codex.ts"), "utf8");
  assert.match(codex, /select: \{ slug: true, regionEntryId: true, companionEntryId: true \}/, "the reachability pass must read both of an arc's entry links");
  assert.match(codex, /\[arc\.regionEntryId, arc\.companionEntryId\]/, "and count both as inbound");
  assert.doesNotMatch(codex, /arcRegionIds/, "the region-only set is what caused the gap");
});
