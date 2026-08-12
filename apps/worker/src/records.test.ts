import assert from "node:assert/strict";
import test from "node:test";
import type { Prisma } from "@habitat/db/client";
import { evaluateRecordsForActivity, evaluateRecordsForEvent } from "./records.js";

test("replaying a qualifying event records one Legend break", async () => {
  const holders = new Map<string, { valueNumber: number; holderName: string }>();
  const history = new Map<string, unknown>();
  const chronicle = new Map<string, unknown>();
  const sourceEvent = {
    id: "11111111-1111-1111-1111-111111111111",
    serverId: "22222222-2222-2222-2222-222222222222",
    gameType: "PALWORLD",
    eventType: "PLAYER_JOINED",
    occurredAt: new Date("2026-08-10T21:00:00.000Z"),
    playerIdentity: { id: "33333333-3333-3333-3333-333333333333", userId: "44444444-4444-4444-4444-444444444444", displayName: "HabitatTino" },
  };
  const definition = { id: "55555555-5555-5555-5555-555555555555", slug: "most-verified-visits", title: "Most Verified Visits", valueLabel: "verified visits", gameType: null, ruleType: "PLAYER_EVENT_COUNT", ruleConfig: { eventType: "PLAYER_JOINED" } };
  const transaction = {
    serverEvent: {
      findUnique: async () => sourceEvent,
      count: async () => 1,
      findMany: async () => [{ gameType: "PALWORLD" }],
      upsert: async ({ where, create }: { where: { dedupeKey: string }; create: unknown }) => {
        if (!chronicle.has(where.dedupeKey)) chronicle.set(where.dedupeKey, { id: "66666666-6666-6666-6666-666666666666", ...(create as object) });
        return chronicle.get(where.dedupeKey);
      },
    },
    recordDefinition: { findMany: async () => [definition] },
    discordGuildConfig: { findMany: async () => [] },
    recordHolder: {
      findUnique: async ({ where }: { where: { recordDefinitionId: string } }) => holders.get(where.recordDefinitionId) ?? null,
      create: async ({ data }: { data: { recordDefinitionId: string; valueNumber: number; holderName: string } }) => {
        holders.set(data.recordDefinitionId, { valueNumber: data.valueNumber, holderName: data.holderName });
        return data;
      },
      updateMany: async () => ({ count: 0 }),
    },
    recordHistory: {
      upsert: async ({ where, create }: { where: { dedupeKey: string }; create: { dedupeKey: string } }) => {
        if (!history.has(where.dedupeKey)) history.set(where.dedupeKey, create);
        return history.get(where.dedupeKey);
      },
    },
  } as unknown as Prisma.TransactionClient;

  await evaluateRecordsForEvent(transaction, sourceEvent.id);
  await evaluateRecordsForEvent(transaction, sourceEvent.id);

  assert.equal(holders.size, 1);
  assert.equal(history.size, 1);
  assert.equal(chronicle.size, 1);
});

test("activity records remain replay-safe and link directly to provider evidence", async () => {
  const holders = new Map<string, { valueNumber: number; holderName: string; sourceActivityId?: string }>();
  const history = new Map<string, { sourceActivityId?: string }>();
  const activity = { id: "77777777-7777-7777-7777-777777777777", userId: "44444444-4444-4444-4444-444444444444", gameKey: "MARVEL_RIVALS", activityType: "MATCH_WON", occurredAt: new Date("2026-08-12T10:00:00.000Z"), user: { id: "44444444-4444-4444-4444-444444444444", displayName: "HabitatTino", name: null, username: "tino" } };
  const definition = { id: "88888888-8888-8888-8888-888888888888", slug: "most-rivals-wins", title: "Most Marvel Rivals Wins", valueLabel: "wins", gameKey: "MARVEL_RIVALS", ruleType: "ACTIVITY_COUNT", ruleConfig: { activityType: "MATCH_WON", minimumConfidence: 90 }, comparison: "MAX", minimumSampleSize: 1 };
  const transaction = {
    gameActivity: { findUnique: async () => activity, count: async () => 1 },
    recordDefinition: { findMany: async () => [definition] },
    recordHolder: {
      findUnique: async ({ where }: { where: { recordDefinitionId: string } }) => holders.get(where.recordDefinitionId) ?? null,
      create: async ({ data }: { data: { recordDefinitionId: string; valueNumber: number; holderName: string; sourceActivityId?: string } }) => { holders.set(data.recordDefinitionId, data); return data; },
      updateMany: async () => ({ count: 0 }),
    },
    recordHistory: { upsert: async ({ where, create }: { where: { dedupeKey: string }; create: { sourceActivityId?: string } }) => { if (!history.has(where.dedupeKey)) history.set(where.dedupeKey, create); return create; } },
    discordGuildConfig: { findMany: async () => [] },
  } as unknown as Prisma.TransactionClient;
  await evaluateRecordsForActivity(transaction, activity.id);
  await evaluateRecordsForActivity(transaction, activity.id);
  assert.equal(holders.size, 1);
  assert.equal(history.size, 1);
  assert.equal([...history.values()][0]?.sourceActivityId, activity.id);
});
