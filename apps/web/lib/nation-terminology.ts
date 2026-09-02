import {
  LEGACY_NATION_MANAGEMENT_GAME_TAG_PREFIX,
  NATION_MANAGEMENT_GAME_TAG_PREFIX,
  NATION_MANAGEMENT_PERSISTED_SLUG,
  NATION_MANAGEMENT_ROUTE_SLUG,
} from "@habitat/shared";

/**
 * Projects stored Codex prose into the current Nation terminology. The public
 * alias is intentional here: editors and readers should only ever see and
 * author the canonical Nation route, even while storage keeps its stable key.
 */
export function nationTerminologyText(value: string): string {
  const normalized = value.replaceAll(LEGACY_NATION_MANAGEMENT_GAME_TAG_PREFIX, NATION_MANAGEMENT_GAME_TAG_PREFIX);

  return normalized.replace(/\bkingdoms?\b/gi, (match) => {
    const plural = match.toLowerCase().endsWith("s");
    const next = plural ? "nations" : "nation";
    if (match === match.toUpperCase()) return next.toUpperCase();
    if (match[0] === match[0]?.toUpperCase()) return `${next[0]?.toUpperCase()}${next.slice(1)}`;
    return next;
  });
}

/**
 * Normalizes authored prose for storage. Visible terminology stays Nation,
 * while a canonical wiki-link round-trips to the established persisted key.
 */
export function nationTerminologyStorageText(value: string): string {
  const presented = nationTerminologyText(value);
  return presented.replaceAll(`[[${NATION_MANAGEMENT_ROUTE_SLUG}]]`, `[[${NATION_MANAGEMENT_PERSISTED_SLUG}]]`);
}

/**
 * Recursively projects a DB-backed value for readers and editors. At this DTO
 * boundary every string, including structured references and tags, uses the
 * public Nation alias. The corresponding StoryEntry slugs offered by the UI
 * are projected too, and `nationTerminologyStorageValue` reverses exact
 * structured references when a form is saved.
 */
export function nationTerminologyValue(value: unknown): unknown {
  if (typeof value === "string") return nationTerminologyText(value);
  if (Array.isArray(value)) return value.map(nationTerminologyValue);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.entries(value).map(([key, child]) => [key, nationTerminologyValue(child)]));
}

/**
 * Metadata fields whose exact values address StoryEntry rows. Arc references
 * intentionally stay out of this set: the entry and arc namespaces are
 * independent, and only the established StoryEntry identity needs an alias.
 */
const storyEntryReferenceFields = new Set([
  "biomes",
  "bosses",
  "character",
  "characters",
  "companion",
  "companionMissions",
  "dependsOn",
  "entries",
  "faction",
  "factions",
  "faith",
  "home",
  "involved",
  "leaders",
  "locations",
  "origin",
  "parent",
  "ref",
  "region",
  "seat",
  "species",
  "targetCompanion",
  "targetFaction",
  "targetRegion",
  "threads",
  "to",
  "where",
]);

/**
 * Storage counterpart for JSON metadata and audit snapshots. Nation prose,
 * tags, and game tags remain Nation/NM. Only exact StoryEntry references and
 * canonical wiki targets return to the established persisted key.
 */
export function nationTerminologyStorageValue(value: unknown, field?: string): unknown {
  if (typeof value === "string") {
    const stored = nationTerminologyStorageText(value);
    return storyEntryReferenceFields.has(field ?? "") && stored === NATION_MANAGEMENT_ROUTE_SLUG
      ? NATION_MANAGEMENT_PERSISTED_SLUG
      : stored;
  }
  if (Array.isArray(value)) return value.map((child) => nationTerminologyStorageValue(child, field));
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.entries(value).map(([key, child]) => [key, nationTerminologyStorageValue(child, key)]));
}

/** Lets a Nation-labelled search find rows that have not been migrated yet. */
export function legacyNationTerminologySearchText(value: string): string {
  const routed = value
    .replaceAll(NATION_MANAGEMENT_ROUTE_SLUG, NATION_MANAGEMENT_PERSISTED_SLUG)
    .replaceAll(NATION_MANAGEMENT_GAME_TAG_PREFIX, LEGACY_NATION_MANAGEMENT_GAME_TAG_PREFIX);

  return routed.replace(/\bnations?\b/gi, (match) => {
    const plural = match.toLowerCase().endsWith("s");
    const next = plural ? "kingdoms" : "kingdom";
    if (match === match.toUpperCase()) return next.toUpperCase();
    if (match[0] === match[0]?.toUpperCase()) return `${next[0]?.toUpperCase()}${next.slice(1)}`;
    return next;
  });
}
