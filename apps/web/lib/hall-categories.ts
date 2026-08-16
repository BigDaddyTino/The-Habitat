import { existsSync } from "node:fs";
import { join } from "node:path";
import type { RecordHall } from "./record-data";

/**
 * The halls present exactly five category showcases each. This manifest is the single source of
 * truth for their order, their copy, and their artwork; `hall-categories.test.ts` asserts it stays
 * in lockstep with the seeded record catalog so a new record can never land in an unrendered wing.
 */
export type HallCategory = {
  /** Matches RecordDefinition.category verbatim. */
  category: string;
  slug: string;
  headline: string;
  blurb: string;
  icon: HallCategoryIcon;
};

export type HallCategoryIcon = "visits" | "exploration" | "combat" | "achievement" | "arena" | "deaths" | "spread" | "defeat" | "runner-up" | "support";

export const HALL_CATEGORY_LIMIT = 5;

const legendsCategories: HallCategory[] = [
  { category: "Community", slug: "community", headline: "The clubhouse regulars", blurb: "Verified arrivals, counted one lit window at a time. The people who kept showing up built this place.", icon: "visits" },
  { category: "Exploration", slug: "exploration", headline: "The world collectors", blurb: "Distinct Habitat worlds entered with a claimed identity. Breadth, not hours.", icon: "exploration" },
  { category: "Combat", slug: "combat", headline: "The lifetime kill count", blurb: "Every verified elimination from every supported world, summed into one permanent number.", icon: "combat" },
  { category: "Achievement", slug: "achievement", headline: "The badge wall", blurb: "Verified achievements earned against the clubhouse rulebook. No self-reported trophies.", icon: "achievement" },
  { category: "Marvel Rivals", slug: "marvel-rivals", headline: "The competitive ledger", blurb: "Wins, eliminations, and MVP awards read straight from cached match history.", icon: "arena" },
];

const shameCategories: HallCategory[] = [
  { category: "Occupational Hazards", slug: "occupational-hazards", headline: "The lifetime death count", blurb: "Every verified death across every supported world. Respawning is apparently a long-term strategy.", icon: "deaths" },
  { category: "Widespread Failure", slug: "widespread-failure", headline: "The travelling disaster", blurb: "Not how often you died — how many different worlds you managed to die in.", icon: "spread" },
  { category: "Character Building", slug: "character-building", headline: "The defeats, framed", blurb: "Verified losses, preserved at full resolution. Every comeback story needs a long first act.", icon: "defeat" },
  { category: "Almost Had It", slug: "almost-had-it", headline: "The runner-up wing", blurb: "Officially the best person present for an outcome nobody ordered.", icon: "runner-up" },
  { category: "Supporting Role", slug: "supporting-role", headline: "The unpaid setup crew", blurb: "All of the assist work, none of the kill cam. Someone has to hold the door.", icon: "support" },
];

export function hallCategories(hall: RecordHall): HallCategory[] {
  return hall === "SHAME" ? shameCategories : legendsCategories;
}

/** Where a category's cinematic art lives once it is authored. */
export function hallCategoryArtPath(hall: RecordHall, category: HallCategory) {
  return `/images/halls/category-${hall === "SHAME" ? "shame" : "legends"}-${category.slug}.png`;
}

const artPresence = new Map<string, boolean>();

/**
 * Category art is optional on disk: until a piece is authored the showcase falls back to the hall's
 * own cinematic rather than shipping a broken image request. Presence is resolved once per path per
 * process, so dropping a PNG in needs a restart rather than a code change.
 */
export function resolveHallCategoryArt(hall: RecordHall, category: HallCategory, fallback: string) {
  const path = hallCategoryArtPath(hall, category);
  let present = artPresence.get(path);
  if (present === undefined) {
    present = existsSync(join(process.cwd(), "public", path));
    artPresence.set(path, present);
  }
  return present ? path : fallback;
}

export type CategorizedRecords<TRecord> = { category: HallCategory; records: TRecord[] };

/**
 * Groups a hall's records into its five showcases. Any record whose category is missing from the
 * manifest is still surfaced under its own heading rather than silently dropped — the parity test
 * is what keeps that path from ever being needed in a shipped build.
 */
export function groupRecordsByCategory<TRecord extends { category: string }>(hall: RecordHall, records: TRecord[]): Array<CategorizedRecords<TRecord>> {
  const known = hallCategories(hall);
  const knownNames = new Set(known.map((entry) => entry.category));
  const strays = [...new Set(records.filter((record) => !knownNames.has(record.category)).map((record) => record.category))].sort();
  return [
    ...known.map((category) => ({ category, records: records.filter((record) => record.category === category.category) })),
    ...strays.map((name) => ({
      category: { category: name, slug: slugify(name), headline: name, blurb: "This record category has no authored showcase yet.", icon: "achievement" as HallCategoryIcon },
      records: records.filter((record) => record.category === name),
    })),
  ].filter((entry) => entry.records.length > 0);
}

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}
