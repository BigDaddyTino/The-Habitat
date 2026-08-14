import assert from "node:assert/strict";
import test from "node:test";
import type { Prisma } from "@habitat/db/client";
import { queueDiscordNotification } from "./discord-notifications.js";

type QueuedNotification = { dedupeKey: string; content: string; channelId: string | null };

function transactionFor(configurations: Array<Record<string, unknown>>, queued: QueuedNotification[]): Prisma.TransactionClient {
  return {
    discordGuildConfig: { findMany: async () => configurations },
    discordNotification: {
      upsert: async ({ where, create }: { where: { dedupeKey: string }; create: { dedupeKey: string; content: string; channelId: string | null } }) => {
        queued.push({ dedupeKey: where.dedupeKey, content: create.content, channelId: create.channelId });
        return create;
      },
    },
  } as unknown as Prisma.TransactionClient;
}

const guild = {
  id: "11111111-1111-1111-1111-111111111111",
  announcementChannelId: "900000000000000001",
  operationsChannelId: "900000000000000002",
  notifyServerOnline: true,
  notifyServerSleeping: false,
  notifyServerOutage: true,
  notifyRecordBroken: true,
  notifyLegendaryAchievement: true,
  notifyWakeRequest: true,
  notifyOperationalAlert: true,
};

test("queues only enabled Discord notification categories", async () => {
  const queued: QueuedNotification[] = [];
  const transaction = transactionFor([guild], queued);

  await queueDiscordNotification(transaction, { serverEventId: "22222222-2222-2222-2222-222222222222", kind: "RECORD_BROKEN", content: "A verified record broke." });
  await queueDiscordNotification(transaction, { serverEventId: "33333333-3333-3333-3333-333333333333", kind: "SERVER_SLEEPING", content: "A world is resting." });

  assert.equal(queued.length, 1);
  assert.match(queued[0].dedupeKey, /RECORD_BROKEN$/);
  assert.equal(queued[0].content, "A verified record broke.");
  assert.equal(queued[0].channelId, guild.announcementChannelId);
});

test("an operational alert is delivered to the operations channel and never the announcement channel", async () => {
  const queued: QueuedNotification[] = [];
  const transaction = transactionFor([guild], queued);

  await queueDiscordNotification(transaction, { evidenceKey: "pulse:tunnel.public-origin:CRITICAL:2026-08-13T20:00:00.000Z", kind: "OPERATIONS_ALERT", content: "The tunnel is down." });

  assert.equal(queued.length, 1);
  assert.equal(queued[0].channelId, guild.operationsChannelId);
  assert.notEqual(queued[0].channelId, guild.announcementChannelId);
});

test("a guild with no operations channel receives no operational alerts at all", async () => {
  const queued: QueuedNotification[] = [];
  const transaction = transactionFor([{ ...guild, operationsChannelId: null }], queued);

  // The count is what tells Pulse nothing was delivered, so it can alert later
  // rather than recording a message nobody received as sent.
  assert.equal(await queueDiscordNotification(transaction, { evidenceKey: "pulse:service.worker:CRITICAL:2026-08-13T20:00:00.000Z", kind: "OPERATIONS_ALERT", content: "The worker has stopped." }), 0);
  // The community announcement channel is not a fallback: infrastructure detail
  // being seen by the whole clubhouse is worse than an alert nobody receives.
  await queueDiscordNotification(transaction, { serverEventId: "44444444-4444-4444-4444-444444444444", kind: "SERVER_OUTAGE", content: "A world stopped unexpectedly." });

  assert.equal(queued.length, 1);
  assert.match(queued[0].dedupeKey, /SERVER_OUTAGE$/);
});

test("a guild that has switched operational alerts off still receives community notices", async () => {
  const queued: QueuedNotification[] = [];
  const transaction = transactionFor([{ ...guild, notifyOperationalAlert: false }], queued);

  await queueDiscordNotification(transaction, { evidenceKey: "pulse:backup.database:WARN:2026-08-13T20:00:00.000Z", kind: "OPERATIONS_ALERT", content: "The backup is late." });
  await queueDiscordNotification(transaction, { serverEventId: "55555555-5555-5555-5555-555555555555", kind: "SERVER_ONLINE", content: "A world came online." });

  assert.equal(queued.length, 1);
  assert.match(queued[0].dedupeKey, /SERVER_ONLINE$/);
});
