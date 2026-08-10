import assert from "node:assert/strict";
import test from "node:test";
import type { Prisma } from "@habitat/db/client";
import { queueDiscordNotification } from "./discord-notifications.js";

test("queues only enabled Discord notification categories", async () => {
  const queued: Array<{ dedupeKey: string; content: string }> = [];
  const transaction = {
    discordGuildConfig: {
      findMany: async () => [{ id: "11111111-1111-1111-1111-111111111111", notifyServerOnline: true, notifyServerSleeping: false, notifyServerOutage: true, notifyRecordBroken: true, notifyLegendaryAchievement: true }],
    },
    discordNotification: {
      upsert: async ({ where, create }: { where: { dedupeKey: string }; create: { dedupeKey: string; content: string } }) => {
        queued.push({ dedupeKey: where.dedupeKey, content: create.content });
        return create;
      },
    },
  } as unknown as Prisma.TransactionClient;

  await queueDiscordNotification(transaction, { serverEventId: "22222222-2222-2222-2222-222222222222", kind: "RECORD_BROKEN", content: "A verified record broke." });
  await queueDiscordNotification(transaction, { serverEventId: "33333333-3333-3333-3333-333333333333", kind: "SERVER_SLEEPING", content: "A world is resting." });

  assert.equal(queued.length, 1);
  assert.match(queued[0].dedupeKey, /RECORD_BROKEN$/);
  assert.equal(queued[0].content, "A verified record broke.");
});
