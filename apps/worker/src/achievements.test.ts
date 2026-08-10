import assert from "node:assert/strict";
import test from "node:test";
import type { Prisma } from "@habitat/db/client";
import { evaluateAchievementsForEvent } from "./achievements.js";

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
        return awards.get(where.dedupeKey);
      },
    },
  } as unknown as Prisma.TransactionClient;

  await evaluateAchievementsForEvent(transaction, sourceEvent.id);
  await evaluateAchievementsForEvent(transaction, sourceEvent.id);

  assert.equal(awards.size, 1);
  assert.equal(chronicle.size, 1);
});
