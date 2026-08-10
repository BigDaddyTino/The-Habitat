import assert from "node:assert/strict";
import test from "node:test";
import type { Prisma } from "@habitat/db/client";
import { evaluateRecordsForEvent } from "./records.js";

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
        if (!chronicle.has(where.dedupeKey)) chronicle.set(where.dedupeKey, create);
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
