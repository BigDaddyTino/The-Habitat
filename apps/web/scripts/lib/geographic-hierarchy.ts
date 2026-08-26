import { atlasTopLevelRegionSlugs } from "./atlas-canonical-topology";

export type GeographicClass = "WORLD_REGION" | "MAJOR_WATER" | "NESTED_REGION" | "SETTLEMENT" | "CITY" | "DISTRICT" | "SITE" | "LANDMARK" | "ISLAND" | "FACILITY" | "UNKNOWN_PLACE_TYPE";
export type GeographicEntry = {
  id: string; slug: string; title: string; kind: string; status: string; meta: unknown;
  placements: Array<{ mapSlug: string; geometryKind: string }>;
  ownedMap: { slug: string; parentSlug: string | null } | null;
};

const topLevelLand = new Set<string>(atlasTopLevelRegionSlugs);
const majorWater = new Set(["grand-lake", "the-ocean"]);
const islands = new Set(["the-starting-island"]);

function record(value: unknown): Record<string, unknown> { return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {}; }
function text(value: unknown) { return typeof value === "string" && value.trim() ? value.trim() : null; }

export function geographicParent(entry: GeographicEntry) { return text(record(entry.meta).parent); }
export function geographicType(entry: GeographicEntry) { return text(record(entry.meta).type); }

export function classifyGeographicEntry(entry: GeographicEntry, bySlug: ReadonlyMap<string, GeographicEntry>): GeographicClass {
  if (topLevelLand.has(entry.slug)) return "WORLD_REGION";
  if (majorWater.has(entry.slug)) return "MAJOR_WATER";
  if (islands.has(entry.slug)) return "ISLAND";
  const type = geographicType(entry);
  const parent = geographicParent(entry);
  const parentType = parent ? geographicType(bySlug.get(parent) ?? entry) : null;
  if (type === "settlement") return record(entry.meta).settlementTier === "major-city" ? "CITY" : "SETTLEMENT";
  if (type === "zone") return parentType === "settlement" ? "DISTRICT" : "NESTED_REGION";
  if (type === "region") return "NESTED_REGION";
  if (type === "site") return /complex|facility|refinery|vault|substation|observatory|intake/i.test(`${entry.title} ${entry.slug}`) ? "FACILITY" : "SITE";
  if (type === "landmark") return "LANDMARK";
  if (type === "destination") return "SITE";
  return "UNKNOWN_PLACE_TYPE";
}

function ancestry(slug: string, parentBySlug: ReadonlyMap<string, string | null>) {
  const result: string[] = [];
  const seen = new Set([slug]);
  let current = parentBySlug.get(slug) ?? null;
  while (current) {
    result.push(current);
    if (seen.has(current)) return { chain: result, cycle: true };
    seen.add(current);
    current = parentBySlug.get(current) ?? null;
  }
  return { chain: result, cycle: false };
}

export function auditGeographicHierarchy(entries: readonly GeographicEntry[]) {
  const bySlug = new Map(entries.map((entry) => [entry.slug, entry]));
  const parentBySlug = new Map(entries.map((entry) => [entry.slug, geographicParent(entry)]));
  const matrix = entries.map((entry) => {
    const parent = geographicParent(entry); const ancestryResult = ancestry(entry.slug, parentBySlug);
    return { id: entry.id, slug: entry.slug, title: entry.title, kind: entry.kind, status: entry.status, metaType: geographicType(entry), settlementTier: text(record(entry.meta).settlementTier), classification: classifyGeographicEntry(entry, bySlug), parent, grandparent: parent ? parentBySlug.get(parent) ?? null : null, ancestry: ancestryResult.chain, parentCycle: ancestryResult.cycle, atlasScenes: entry.placements.map((placement) => placement.mapSlug).sort(), worldPlacement: entry.placements.some((placement) => placement.mapSlug === "martino-world"), ownedMap: entry.ownedMap };
  }).sort((left, right) => left.title.localeCompare(right.title));
  const missingParents = matrix.filter((entry) => entry.parent && !bySlug.has(entry.parent)).map((entry) => entry.slug);
  const selfParents = matrix.filter((entry) => entry.parent === entry.slug).map((entry) => entry.slug);
  const cycles = matrix.filter((entry) => entry.parentCycle).map((entry) => entry.slug);
  const topLevelNestedUnderTopLevel = matrix.filter((entry) => entry.classification === "WORLD_REGION" && entry.parent !== null).map((entry) => ({ slug: entry.slug, parent: entry.parent }));
  const peninsulaVisible = matrix.filter((entry) => entry.slug !== "the-peninsula" && entry.ancestry.includes("the-peninsula")).map((entry) => ({ ...entry, whyItAppears: entry.parent === "the-peninsula" ? "direct meta.parent child" : `recursive descendant through ${entry.ancestry.slice(0, entry.ancestry.indexOf("the-peninsula")).join(" -> ")}` }));
  const suspiciousCandidates = [
    ...topLevelNestedUnderTopLevel.map((entry) => ({ slug: entry.slug, reason: `top-level world region nested under ${entry.parent}` })),
  ];
  const suspicious = [...new Map(suspiciousCandidates.map((entry) => [entry.slug, entry])).values()];
  const counts = Object.fromEntries([...new Set(matrix.map((entry) => entry.classification))].sort().map((classification) => [classification, matrix.filter((entry) => entry.classification === classification).length]));
  return { matrix, counts, topLevelWorldRegions: matrix.filter((entry) => entry.classification === "WORLD_REGION"), nestedRegions: matrix.filter((entry) => entry.classification === "NESTED_REGION"), settlements: matrix.filter((entry) => ["CITY", "SETTLEMENT"].includes(entry.classification)), sites: matrix.filter((entry) => ["SITE", "FACILITY", "LANDMARK"].includes(entry.classification)), missingParents, selfParents, cycles: [...new Set(cycles)], topLevelNestedUnderTopLevel, suspicious, invalidParentCount: new Set([...missingParents, ...selfParents, ...cycles, ...topLevelNestedUnderTopLevel.map((entry) => entry.slug)]).size, peninsulaVisible };
}
