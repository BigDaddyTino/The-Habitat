import {
  isAchievementRarity,
  type AchievementRarity,
  type AchievementRewardKind,
  type VerifiedHabitatLiveEvent,
} from "@habitat/shared";

export type LiveSourceEvent = {
  id: string;
  eventType: string;
  occurredAt: Date;
  receivedAt: Date;
  actorText: string | null;
  valueNumber: number | null;
  valueText: string | null;
  metadata: unknown;
  source: string;
  sourceConfidence: number;
  server: { id: string; slug: string; displayName: string; gameType: string };
};

export type LiveAchievementDefinition = {
  name: string;
  description: string;
  category: string;
  rarity: AchievementRarity;
  points: number;
  rewards: Array<{ kind: AchievementRewardKind; code: string; name: string }>;
};

export function achievementSlugFromMetadata(metadata: unknown): string | null {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) return null;
  const value = (metadata as Record<string, unknown>).achievementSlug;
  return typeof value === "string" && value.length <= 100 ? value : null;
}

/** Maps only confidence-100 source rows onto the allow-listed cinematic contract. */
export function projectVerifiedHabitatLiveEvent(event: LiveSourceEvent, achievement?: LiveAchievementDefinition): VerifiedHabitatLiveEvent | null {
  if (event.sourceConfidence !== 100) return null;
  const base = {
    id: event.id,
    occurredAt: event.occurredAt.toISOString(),
    verifiedAt: event.receivedAt.toISOString(),
    world: { id: event.server.id, slug: event.server.slug, name: event.server.displayName, gameType: event.server.gameType },
    actor: event.actorText,
    evidence: { source: event.source, confidence: 100 as const },
  };

  if (event.eventType === "SERVER_STARTED") return {
    ...base,
    kind: "WORLD_STARTED",
    headline: `${event.server.displayName} is awake`,
    detail: "Verified process and game telemetry lit this portal.",
    reaction: { kind: "PORTAL_IGNITE", durationMs: 8_000 },
    ceremony: { title: `${event.server.displayName} ignited`, detail: "The Great Hall portal is live.", rarity: "EPIC", category: "World signal", kind: "world" },
  };
  if (event.eventType === "SERVER_CRASHED") return {
    ...base,
    kind: "WORLD_CRASHED",
    headline: `${event.server.displayName} sputtered out`,
    detail: "The process stopped while the world was expected to be running.",
    reaction: { kind: "PORTAL_SPUTTER", durationMs: 12_000 },
    ceremony: { title: `${event.server.displayName} lost its fire`, detail: "Unexpected stop verified. This was not intentional sleep.", rarity: "RARE", category: "World signal", kind: "world" },
  };
  if (event.eventType === "WORLD_GATHERING") {
    const playerCount = Math.max(5, Math.trunc(event.valueNumber ?? 5));
    return {
      ...base,
      kind: "WORLD_GATHERING",
      playerCount,
      headline: `${playerCount} players gathered in ${event.server.displayName}`,
      detail: "The Great Hall is visibly filling with life.",
      reaction: { kind: "HALL_CROWD", durationMs: 15_000 },
      ceremony: { title: "The Hall is stirring", detail: `${playerCount} players are together in ${event.server.displayName}.`, rarity: "UNCOMMON", category: "Clubhouse", kind: "world" },
    };
  }
  if (event.eventType === "BOSS_KILLED") return {
    ...base,
    kind: "BOSS_DEFEATED",
    headline: `${event.server.displayName} defeated a boss`,
    detail: event.valueText ?? (event.actorText ? `${event.actorText} was named in the verified kill.` : "The server-wide kill was entered into the Chronicle."),
    reaction: { kind: "TROPHY_CEREMONY", durationMs: 12_000 },
    ceremony: {
      title: event.valueText ?? "Boss defeated",
      detail: `A verified server-wide victory in ${event.server.displayName}.`,
      rarity: "LEGENDARY",
      category: "Chronicle ceremony",
      rewards: [{ kind: "TROPHY", code: "bossbreaker-reliquary", name: "Bossbreaker Reliquary" }],
      kind: "world",
    },
  };
  if (event.eventType === "ACHIEVEMENT_EARNED" && achievement && isAchievementRarity(achievement.rarity) && ["LEGENDARY", "QUESTIONABLE_LIFE_CHOICE"].includes(achievement.rarity)) return {
    ...base,
    kind: "LEGENDARY_EARNED",
    headline: `${event.actorText ?? "A Habitat member"} became Legendary`,
    detail: `${achievement.name} has been entered into the Chronicle.`,
    reaction: { kind: "CONSTELLATION", durationMs: 12_000 },
    ceremony: { ...achievement, title: achievement.name, detail: achievement.description, kind: "achievement" },
  };
  return null;
}
