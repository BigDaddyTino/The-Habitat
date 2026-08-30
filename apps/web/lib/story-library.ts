import { storyPlaceDescendants, storyPlaceKinds, type StoryEntryKind, type StoryPlaceLink } from "@habitat/shared";
import gallery from "@/lib/model-gallery.json";

export const storyCollections = {
  characters: {
    kind: "CHARACTER",
    label: "Characters",
    singular: "character",
    eyebrow: "The cast",
    title: "People worth following",
    description: "Build the people who carry the story. Open a dossier to define their voice, loyalties, relationships, quest involvement, and in-game model.",
    hero: "/images/story-codex-archive.webp",
    placeholder: "Commander Vale",
    summaryPlaceholder: "Who are they, and why will the player care?",
  },
  factions: {
    kind: "FACTION",
    label: "Factions",
    singular: "faction",
    eyebrow: "The powers",
    title: "Everyone wants something",
    description: "Define the powers shaping the world—their leaders, territory, goals, allies, enemies, and the pressure they put on every quest.",
    hero: "/images/codex-factions-war-room.png",
    placeholder: "The Ember Compact",
    summaryPlaceholder: "What power do they hold, and what do they want?",
  },
  regions: {
    kind: "REGION",
    label: "Regions",
    singular: "region",
    eyebrow: "The world",
    title: "Every story happens somewhere",
    description: "Shape the peninsula from continents to street corners. Connect places, assign control, and make the world navigable for writers and the game.",
    hero: "/images/codex-regions-peninsula.png",
    placeholder: "The Sunken Reach",
    summaryPlaceholder: "What makes this place matter to the story?",
  },
  species: {
    kind: "CREATURE",
    label: "Species",
    singular: "species",
    eyebrow: "The parent species",
    title: "Choose a species to see what belongs beneath it",
    description: "This landing page shows parent species only. Open one to see its children: Mythical holds the exceptionally rare Lizzarnix, Beasts holds the Hypogriff, and Humanoid holds Human, the Returnees, the Carriers, the Chartered, the Unregistered and the Latent.",
    hero: "/images/story-codex-archive.webp",
    placeholder: "Glasswing Manticore",
    summaryPlaceholder: "What is it, where does it live, and why does it matter?",
  },
  items: {
    kind: "ITEM",
    label: "Items",
    singular: "item",
    eyebrow: "Relics & tools",
    title: "Objects with consequences",
    description: "Weapons, substances, relics, documents, and tools that matter enough to carry story weight or game identity.",
    hero: "/images/story-codex-archive.webp",
    placeholder: "The Black Compass",
    summaryPlaceholder: "What is it, and why would someone risk everything for it?",
  },
  events: {
    kind: "EVENT",
    label: "Events",
    singular: "event",
    eyebrow: "The timeline",
    title: "What changed the world",
    description: "Record the wars, disasters, discoveries, and betrayals every writer needs to understand before adding another chapter.",
    hero: "/images/story-codex-archive.webp",
    placeholder: "The Seventh Breach",
    summaryPlaceholder: "What happened, and what changed because of it?",
  },
  themes: {
    kind: "THEME",
    label: "Themes",
    singular: "theme",
    eyebrow: "The compass",
    title: "What the game is really about",
    description: "The ideas every arc should echo. These are the guardrails that keep dozens of quests feeling like one story.",
    hero: "/images/story-codex-archive.webp",
    placeholder: "The Price of Power",
    summaryPlaceholder: "What truth should the player feel again and again?",
  },
  systems: {
    kind: "SYSTEM",
    label: "Game systems",
    singular: "system",
    eyebrow: "The machine",
    title: "What the player can actually do",
    description: "The mechanics the game will ship — and when the story hands each one to the player. Write quests toward these systems, not toward verbs that do not exist.",
    hero: "/images/story-codex-archive.webp",
    placeholder: "Kingdom Management",
    summaryPlaceholder: "What does this system let the player do, in one line?",
  },
  "companion-missions": {
    kind: "COMPANION_MISSION",
    label: "Companion missions",
    singular: "companion mission",
    eyebrow: "The inner circle",
    title: "The people who travel with you",
    description: "Each companion's personal arc, one mission at a time — what unlocks it, what it reveals, what it costs. Development records: a mission is not confirmed until its status says so.",
    hero: "/images/story-codex-archive.webp",
    placeholder: "The Woman in the Peninsula",
    summaryPlaceholder: "What happens, and what does the player learn about them?",
  },
  rules: {
    kind: "RULE",
    label: "Rules",
    singular: "rule",
    eyebrow: "Canon guardrails",
    title: "Promises the writers must keep",
    description: "The hard boundaries that protect mysteries, tone, continuity, and expensive game-side assumptions.",
    hero: "/images/story-codex-archive.webp",
    placeholder: "Never Explain the Breach",
    summaryPlaceholder: "What must every writer preserve?",
  },
} as const satisfies Record<string, {
  kind: StoryEntryKind;
  label: string;
  singular: string;
  eyebrow: string;
  title: string;
  description: string;
  hero: string;
  placeholder: string;
  summaryPlaceholder: string;
}>;

export type StoryCollectionSlug = keyof typeof storyCollections;

export function isStoryCollectionSlug(value: string): value is StoryCollectionSlug {
  return value in storyCollections;
}

/**
 * Shelves that have been renamed, old address to new. The codex is full of
 * links written by hand, so a rename that simply 404s the old URL reads to a
 * writer as "the section is gone". Every entry here is permanent — the cost
 * of keeping one is a map lookup, and the cost of dropping one is a dead link
 * somebody wrote in good faith.
 */
export const renamedStoryCollections: Record<string, StoryCollectionSlug> = {
  // Renamed 2026-08-20: the bestiary became the races library when creatures
  // gained the race they belong to.
  creatures: "species",
  // Renamed 2026-08-30 by the character bible: near-future world, near-future
  // words. A people is a species; nothing in this setting says race.
  races: "species",
};

export function collectionForKind(kind: StoryEntryKind): StoryCollectionSlug | null {
  const match = Object.entries(storyCollections).find(([, collection]) => collection.kind === kind);
  return (match?.[0] as StoryCollectionSlug | undefined) ?? null;
}

/** Atlas ordering for places inside a region: where people live first, then
 *  named ground, then working locations, then the rooms inside those.
 *  Anything untyped sorts last. */
export const placeTypeOrder: Record<string, number> = { settlement: 0, zone: 1, site: 2, landmark: 3, destination: 4 };

export type PlaceProjectionRow = {
  slug: string;
  title: string;
  summary: string | null;
  meta: Record<string, unknown> | null;
};

/** Direct children become dossier rows; every deeper descendant stays grouped
 * beneath its direct ancestor instead of becoming a flat sibling. */
export function buildContainedPlaceProjection(parentSlug: string, regions: readonly PlaceProjectionRow[]) {
  const order = (meta: Record<string, unknown> | null) => placeTypeOrder[String(meta?.type)] ?? 9;
  const byTitle = (a: { order: number; title: string }, b: { order: number; title: string }) => a.order - b.order || a.title.localeCompare(b.title);
  const placeLinks: StoryPlaceLink[] = regions.map((region) => ({ slug: region.slug, parent: typeof region.meta?.parent === "string" && region.meta.parent.trim() ? region.meta.parent.trim() : null }));
  const descendants = new Map(regions.map((region) => [region.slug, new Set(storyPlaceDescendants(region.slug, placeLinks))]));
  return regions
    .filter((region) => (region.meta?.parent ?? null) === parentSlug)
    .map((place) => ({
      slug: place.slug,
      title: place.title,
      summary: place.summary,
      meta: place.meta,
      label: placeKindLabel(place.meta ?? {}),
      order: order(place.meta),
      inside: regions
        .filter((candidate) => descendants.get(place.slug)?.has(candidate.slug))
        .map((candidate) => ({ slug: candidate.slug, title: candidate.title, label: placeKindLabel(candidate.meta ?? {}), order: order(candidate.meta) }))
        .sort(byTitle)
        .map(({ slug, title, label }) => ({ slug, title, label })),
    }))
    .sort(byTitle);
}

/** The values the place picker offers, so a typo cannot ship as a default. */
export type StoryPlaceKindValue = (typeof storyPlaceKinds)[number]["value"];

/**
 * What a new place inside this one most likely is, by what contains it:
 * a region holds sites, a settlement holds districts (zones), and a zone or a
 * site holds destinations — the third rung, and the one people forget the
 * picker even has.
 *
 * The settlement case was defaulting to `destination`, which is why Port
 * Arcadia's districts all had to be corrected by hand at creation: a city's
 * next rung down is a district, not a shop inside one. This is only the
 * pre-selection — every kind stays available in the picker.
 */
export function defaultChildPlaceKind(parentType: unknown): StoryPlaceKindValue {
  if (parentType === "settlement") return "zone";
  if (parentType === "zone" || parentType === "site" || parentType === "landmark" || parentType === "destination") return "destination";
  return "site";
}

export function placeKindLabel(meta: Record<string, unknown>): string {
  const tier = typeof meta.settlementTier === "string" ? meta.settlementTier : null;
  const type = typeof meta.type === "string" ? meta.type : null;
  const kind = (tier ?? type ?? "place").replaceAll("-", " ");
  // A place that IS a Veil Anchor says so wherever it is listed. Patching the
  // individual surfaces missed the deeper rungs — an Anchor filed under a
  // district went unmarked on the atlas — so the marker lives in the label.
  const anchor = typeof meta.veilAnchorTier === "string" ? meta.veilAnchorTier : null;
  const forge = typeof meta.soulForge === "string" ? meta.soulForge : null;
  const marks = [anchor ? `Veil Anchor ${anchor}` : null, forge ? (forge === "active" ? "Soul Forge" : `Soul Forge (${forge})`) : null].filter(Boolean);
  return marks.length ? `${kind} · ${marks.join(" · ")}` : kind;
}

type GalleryImage = { asset: string; pack: string; packLabel: string; image: string; ref: string };
export const modelGalleryImages = (gallery as { images: GalleryImage[] }).images;

export function modelPreview(ref: unknown) {
  return typeof ref === "string" ? modelGalleryImages.find((image) => image.ref === ref) ?? null : null;
}
