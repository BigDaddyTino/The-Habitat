import type { AchievementRarity } from "./achievements";
import type { AchievementRewardKind } from "./rewards";

export const habitatLiveEventKinds = [
  "WORLD_STARTED",
  "LEGENDARY_EARNED",
  "BOSS_DEFEATED",
  "WORLD_GATHERING",
  "WORLD_CRASHED",
] as const;

export type HabitatLiveEventKind = (typeof habitatLiveEventKinds)[number];

export const habitatLiveReactionKinds = [
  "PORTAL_IGNITE",
  "CONSTELLATION",
  "TROPHY_CEREMONY",
  "HALL_CROWD",
  "PORTAL_SPUTTER",
] as const;

export type HabitatLiveReactionKind = (typeof habitatLiveReactionKinds)[number];

export type HabitatLiveCeremony = {
  title: string;
  detail: string;
  rarity: AchievementRarity;
  category: string;
  points?: number;
  rewards?: Array<{ kind: AchievementRewardKind; code: string; name: string }>;
  kind: "achievement" | "world";
};

/**
 * The browser-facing projection of a source-confident Habitat fact. It always
 * retains its evidence source and confidence; UI consumers may animate it, but
 * cannot turn an unverified observation into a live event.
 */
export type VerifiedHabitatLiveEvent = {
  id: string;
  kind: HabitatLiveEventKind;
  occurredAt: string;
  verifiedAt: string;
  world: { id: string; slug: string; name: string; gameType: string };
  actor: string | null;
  headline: string;
  detail: string;
  evidence: { source: string; confidence: 100 };
  reaction: { kind: HabitatLiveReactionKind; durationMs: number };
  ceremony: HabitatLiveCeremony;
  playerCount?: number;
};

export type HabitatLiveEventBatch = {
  events: VerifiedHabitatLiveEvent[];
  cursor: string;
};

/** Custom browser event emitted by the authenticated live-event bridge. */
export const habitatLiveBrowserEvent = "habitat:verified-live-event";
