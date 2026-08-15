import assert from "node:assert/strict";
import test from "node:test";
import type { Prisma } from "@habitat/db/client";
import { evaluateRecordsForActivity, evaluateRecordsForEvent, reconcileActivityRecordCatalog } from "./records.js";

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

test("a newly seeded Shame activity record silently reconciles existing verified defeat history", async () => {
  const definition = { id: "99999999-9999-9999-9999-999999999999", slug: "most-rivals-losses", title: "Most Heroic Defeats", valueLabel: "heroic defeats", gameKey: "MARVEL_RIVALS", ruleType: "ACTIVITY_COUNT", ruleConfig: { version: 1, activityType: "MATCH_LOST", minimumConfidence: 90 }, comparison: "MAX" as const, minimumSampleSize: 1 };
  const activities = [
    { id: "activity-a", userId: "user-a", activityType: "MATCH_LOST", occurredAt: new Date("2026-08-12T10:00:00.000Z"), user: { displayName: "First Fall", name: null, username: null } },
    { id: "activity-b", userId: "user-b", activityType: "MATCH_LOST", occurredAt: new Date("2026-08-13T10:00:00.000Z"), user: { displayName: "Respawn Royalty", name: null, username: null } },
  ];
  const totals = new Map([["user-a", 12], ["user-b", 17]]);
  type ReconciledHolder = { recordDefinitionId: string; userId: string; holderName: string; valueNumber: number; sourceActivityId: string };
  let holder: ReconciledHolder | null = null;
  const history = new Set<string>();
  const transaction = {
    gameActivity: {
      count: async ({ where }: { where: { userId: string } }) => totals.get(where.userId) ?? 0,
    },
    recordHolder: {
      findUnique: async () => holder,
      create: async ({ data }: { data: ReconciledHolder }) => { holder = data; return data; },
      updateMany: async ({ data }: { data: ReconciledHolder }) => { holder = { ...holder!, ...data }; return { count: 1 }; },
    },
    recordHistory: { upsert: async ({ where }: { where: { dedupeKey: string } }) => { history.add(where.dedupeKey); return {}; } },
  } as unknown as Prisma.TransactionClient;
  const database = {
    recordDefinition: { findMany: async () => [definition] },
    gameActivity: { findMany: async () => activities },
    $transaction: async (callback: (tx: Prisma.TransactionClient) => Promise<void>) => callback(transaction),
  } as unknown as Parameters<typeof reconcileActivityRecordCatalog>[0];

  const result = await reconcileActivityRecordCatalog(database);
  const reconciledHolder = holder as ReconciledHolder | null;

  assert.deepEqual(result, { definitions: 1, candidates: 2 });
  assert.equal(reconciledHolder?.holderName, "Respawn Royalty");
  assert.equal(reconciledHolder?.valueNumber, 17);
  assert.equal(reconciledHolder?.sourceActivityId, "activity-b");
  assert.equal(history.size, 2);
});
