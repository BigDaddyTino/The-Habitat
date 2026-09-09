import { storyIdeaFacets, storyThreadStatuses, type StoryIdeaFacet, type StoryIdeaSection, type StoryThreadStatus } from "@habitat/shared";
import { plainStoryProse } from "./story-prose";

/**
 * The Idea Center's database-free arithmetic: how a thread's meta is read as
 * an idea, which tabs it shows, what its card says. Importable from client
 * components and tests (lib/story-ideas.ts opens Prisma at load and cannot be).
 */
const asRecord = (value: unknown): Record<string, unknown> => (typeof value === "object" && value !== null && !Array.isArray(value) ? (value as Record<string, unknown>) : {});
const strings = (value: unknown): string[] => (Array.isArray(value) ? value.filter((item): item is string => typeof item === "string" && item.trim().length > 0) : []);

/** The facets a thread's meta declares, in canonical order, ignoring anything unknown. */
export function ideaFacetsOf(meta: unknown): StoryIdeaFacet[] {
  const declared = new Set(strings(asRecord(meta).facets));
  return storyIdeaFacets.filter((facet) => declared.has(facet));
}

/** The attributed detail members added under each facet; malformed rows are dropped, never thrown. */
export function ideaSectionsOf(meta: unknown): StoryIdeaSection[] {
  const rows = asRecord(meta).sections;
  if (!Array.isArray(rows)) return [];
  return rows.flatMap((row) => {
    const record = asRecord(row);
    const facet = record.facet;
    if (typeof record.id !== "string" || typeof record.body !== "string" || !(storyIdeaFacets as readonly unknown[]).includes(facet)) return [];
    return [{
      id: record.id,
      facet: facet as StoryIdeaFacet,
      body: record.body,
      authorUserId: typeof record.authorUserId === "string" ? record.authorUserId : "",
      authorName: typeof record.authorName === "string" ? record.authorName : "A Habitat member",
      at: typeof record.at === "string" ? record.at : "",
    }];
  });
}

export function ideaStatusOf(meta: unknown): StoryThreadStatus | null {
  const value = asRecord(meta).threadStatus;
  return (storyThreadStatuses as readonly unknown[]).includes(value) ? (value as StoryThreadStatus) : null;
}

/**
 * The tabs an idea shows: Overview always, then only the facets it touches,
 * in the canonical order. A one-paragraph model idea gets two tabs; an idea
 * that touches everything gets six. Nothing is shown for a facet nobody claimed.
 */
export function ideaTabs(facets: readonly StoryIdeaFacet[]): Array<"overview" | StoryIdeaFacet> {
  return ["overview", ...storyIdeaFacets.filter((facet) => facets.includes(facet))];
}

/** Cut a plain string on a word, never mid-word, with an ellipsis. */
export function cutOnWord(source: string, max: number): string {
  if (source.length <= max) return source;
  const cut = source.slice(0, max - 1);
  const space = cut.lastIndexOf(" ");
  return `${(space > max / 2 ? cut.slice(0, space) : cut).trimEnd()}…`;
}

/** The card's preview: the summary when there is one, else the first sentences of the body, plain. */
export function ideaPreview(summary: string | null, body: string | null, max = 180): string {
  return cutOnWord(plainStoryProse((summary?.trim() || body?.trim() || "").replace(/\s+/g, " ")), max);
}
