import assert from "node:assert/strict";
import test from "node:test";
import type { Prisma } from "@habitat/db/client";
import { parseEventCountRule, parseGameEventCountRule } from "@habitat/shared";
import { evaluateAchievementsForActivity, evaluateAchievementsForEvent } from "./achievements.js";

test("replaying a qualifying event awards a non-repeatable achievement once", async () => {
  const awards = new Map<string, unknown>();
  const chronicle = new Map<string, unknown>();
  const sourceEvent = {
    id: "11111111-1111-1111-1111-111111111111",
    serverId: "22222222-2222-2222-2222-222222222222",
    gameType: "PALWORLD",
    eventType: "PLAYER_JOINED",
    occurredAt: new Date("2026-08-10T20:00:00.000Z"),
    playerIdentity: { id: "33333333-3333-3333-3333-333333333333", userId: "44444444-4444-4444-4444-444444444444", displayName: "HabitatTino" },
  };
  const transaction = {
    serverEvent: {
      findUnique: async () => sourceEvent,
      count: async () => 1,
      findMany: async () => [{ gameType: "PALWORLD" }],
      upsert: async ({ where, create }: { where: { dedupeKey: string }; create: unknown }) => {
        if (!chronicle.has(where.dedupeKey)) chronicle.set(where.dedupeKey, create);
        return chronicle.get(where.dedupeKey);
      },
    },
    achievementDefinition: {
      findMany: async () => [{ id: "55555555-5555-5555-5555-555555555555", slug: "welcome-to-gods-country", name: "Welcome to God's Country", rarity: "COMMON", points: 10, isRepeatable: false, ruleType: "EVENT_COUNT", ruleConfig: { eventType: "PLAYER_JOINED", threshold: 1 } }],
    },
    recordDefinition: { findMany: async () => [] },
    playerAchievement: {
      upsert: async ({ where, create }: { where: { dedupeKey: string }; create: unknown }) => {
        if (!awards.has(where.dedupeKey)) awards.set(where.dedupeKey, create);
        return { id: "66666666-6666-6666-6666-666666666666" };
      },
    },
    achievementReward: { findMany: async () => [] },
    userAchievementReward: { upsert: async () => ({}) },
    userTitle: { upsert: async () => ({}) },
  } as unknown as Prisma.TransactionClient;

  await evaluateAchievementsForEvent(transaction, sourceEvent.id);
  await evaluateAchievementsForEvent(transaction, sourceEvent.id);

  assert.equal(awards.size, 1);
  assert.equal(chronicle.size, 1);
});

test("high visit thresholds and game-specific rules remain bounded and explicit", () => {
  assert.deepEqual(parseEventCountRule({ eventType: "PLAYER_JOINED", threshold: 500 }), { eventType: "PLAYER_JOINED", threshold: 500 });
  assert.deepEqual(parseGameEventCountRule({ eventType: "PLAYER_JOINED", gameType: "PALWORLD", threshold: 15 }), { eventType: "PLAYER_JOINED", gameType: "PALWORLD", threshold: 15 });
  assert.equal(parseGameEventCountRule({ eventType: "PLAYER_JOINED", gameType: "NOT_A_GAME", threshold: 15 }), null);
});

test("activity-backed achievements retain their exact evidence and replay once", async () => {
  const awards = new Map<string, { sourceActivityId?: string }>();
  const activity = { id: "77777777-7777-7777-7777-777777777777", userId: "44444444-4444-4444-4444-444444444444", gameKey: "MARVEL_RIVALS", activityType: "MATCH_WON", occurredAt: new Date("2026-08-12T10:00:00.000Z"), user: { id: "44444444-4444-4444-4444-444444444444", displayName: "HabitatTino", name: null, username: "tino" } };
  const transaction = {
    gameActivity: { findUnique: async () => activity, count: async () => 1 },
    achievementDefinition: { findMany: async () => [{ id: "88888888-8888-8888-8888-888888888888", name: "First Rival Down", rarity: "COMMON", isRepeatable: false, gameKey: "MARVEL_RIVALS", ruleType: "ACTIVITY_COUNT", ruleConfig: { activityType: "MATCH_WON", threshold: 1, minimumConfidence: 90 } }] },
    playerAchievement: { upsert: async ({ where, create }: { where: { dedupeKey: string }; create: { sourceActivityId?: string } }) => { if (!awards.has(where.dedupeKey)) awards.set(where.dedupeKey, create); return { id: "99999999-9999-9999-9999-999999999999" }; } },
    achievementReward: { findMany: async () => [] },
    userAchievementReward: { upsert: async () => ({}) },
    userTitle: { upsert: async () => ({}) },
  } as unknown as Prisma.TransactionClient;
  await evaluateAchievementsForActivity(transaction, activity.id);
  await evaluateAchievementsForActivity(transaction, activity.id);
  assert.equal(awards.size, 1);
  assert.equal([...awards.values()][0]?.sourceActivityId, activity.id);
});
