import type { StoryEntryKind } from "@habitat/shared";
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
  creatures: {
    kind: "CREATURE",
    label: "Creatures",
    singular: "creature",
    eyebrow: "The bestiary",
    title: "What waits beyond the firelight",
    description: "Track the natural, magical, engineered, and supernatural life that gives each region its danger and identity.",
    hero: "/images/story-codex-archive.webp",
    placeholder: "Glasswing Manticore",
    summaryPlaceholder: "What is it, where does it live, and why is it dangerous?",
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

export function collectionForKind(kind: StoryEntryKind): StoryCollectionSlug | null {
  const match = Object.entries(storyCollections).find(([, collection]) => collection.kind === kind);
  return (match?.[0] as StoryCollectionSlug | undefined) ?? null;
}

/** Atlas ordering for places inside a region: where people live first, then
 *  named ground, then working locations, then the rooms inside those.
 *  Anything untyped sorts last. */
export const placeTypeOrder: Record<string, number> = { settlement: 0, zone: 1, site: 2, landmark: 3, destination: 4 };

/**
 * What a new place inside this one most likely is. Adding to a whole region
 * usually means a POI; adding to a POI means a destination inside it — which
 * is the third rung and the one people forget the picker even has.
 */
export function defaultChildPlaceKind(parentType: unknown): string {
  return parentType === "region" || parentType === null || parentType === undefined ? "site" : "destination";
}

export function placeKindLabel(meta: Record<string, unknown>): string {
  const tier = typeof meta.settlementTier === "string" ? meta.settlementTier : null;
  const type = typeof meta.type === "string" ? meta.type : null;
  return (tier ?? type ?? "place").replaceAll("-", " ");
}

type GalleryImage = { asset: string; pack: string; packLabel: string; image: string; ref: string };
export const modelGalleryImages = (gallery as { images: GalleryImage[] }).images;

export function modelPreview(ref: unknown) {
  return typeof ref === "string" ? modelGalleryImages.find((image) => image.ref === ref) ?? null : null;
}
