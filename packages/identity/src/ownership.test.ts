import assert from "node:assert/strict";
import test from "node:test";
import type { Prisma } from "@habitat/db/client";
import { revokeIdentityOwnership, trimPlaytimeXp } from "./ownership";

type Entry = { id: string; amount: number; earnedAt: Date };

/**
 * `UserXpEntry` carries a database CHECK that every amount is positive, so a
 * reversal cannot post a negative compensating row. These cover the arithmetic
 * that replaces it.
 */
function ledger(entries: Entry[]) {
  const deleted: string[] = [];
  const created: { amount: number; dedupeKey: string }[] = [];
  const transaction = {
    userXpEntry: {
      findMany: async () => [...entries].sort((left, right) => right.earnedAt.getTime() - left.earnedAt.getTime()),
      deleteMany: async ({ where }: { where: { id: { in: string[] } } }) => {
        deleted.push(...where.id.in);
        return { count: where.id.in.length };
      },
      create: async ({ data }: { data: { amount: number; dedupeKey: string } }) => {
        created.push({ amount: data.amount, dedupeKey: data.dedupeKey });
        return data;
      },
    },
  } as unknown as Prisma.TransactionClient;
  return { transaction, deleted, created };
}

const seconds = (xp: number) => xp * 300;

test("evidence that still supports the awarded XP leaves the ledger alone", async () => {
  const { transaction, deleted, created } = ledger([
    { id: "a", amount: 100, earnedAt: new Date("2026-08-01T00:00:00Z") },
    { id: "b", amount: 50, earnedAt: new Date("2026-08-02T00:00:00Z") },
  ]);
  const removed = await trimPlaytimeXp(transaction, "member", seconds(150), new Date());
  assert.equal(removed, 0);
  assert.deepEqual(deleted, []);
  assert.deepEqual(created, []);
});

test("the newest entries are dropped first until the ledger matches the remaining evidence", async () => {
  const { transaction, deleted, created } = ledger([
    { id: "oldest", amount: 100, earnedAt: new Date("2026-08-01T00:00:00Z") },
    { id: "newest", amount: 50, earnedAt: new Date("2026-08-03T00:00:00Z") },
  ]);
  const removed = await trimPlaytimeXp(transaction, "member", seconds(100), new Date());
  assert.equal(removed, 1);
  assert.deepEqual(deleted, ["newest"]);
  assert.deepEqual(created, [], "the remaining entries already total the new target");
});

test("a partial reversal re-adds the remainder so the ledger lands exactly on target", async () => {
  const { transaction, deleted, created } = ledger([
    { id: "oldest", amount: 100, earnedAt: new Date("2026-08-01T00:00:00Z") },
    { id: "newest", amount: 50, earnedAt: new Date("2026-08-03T00:00:00Z") },
  ]);
  const removed = await trimPlaytimeXp(transaction, "member", seconds(120), new Date());
  assert.equal(removed, 1);
  assert.deepEqual(deleted, ["newest"]);
  assert.deepEqual(created, [{ amount: 20, dedupeKey: "verified-playtime:member:120" }]);
});

test("revoking every hour clears the playtime ledger without posting a zero row", async () => {
  const { transaction, deleted, created } = ledger([
    { id: "a", amount: 100, earnedAt: new Date("2026-08-01T00:00:00Z") },
    { id: "b", amount: 50, earnedAt: new Date("2026-08-02T00:00:00Z") },
  ]);
  const removed = await trimPlaytimeXp(transaction, "member", 0, new Date());
  assert.equal(removed, 2);
  assert.deepEqual(deleted.sort(), ["a", "b"]);
  assert.deepEqual(created, []);
});

test("the re-added remainder reuses the cumulative dedupe key so later playtime still accrues", async () => {
  const { transaction, created } = ledger([{ id: "only", amount: 300, earnedAt: new Date("2026-08-01T00:00:00Z") }]);
  await trimPlaytimeXp(transaction, "member", seconds(275), new Date());
  // `awardAccumulatedPlaytimeXp` writes `verified-playtime:<user>:<cumulative target>`.
  // Matching that shape is what keeps a later re-grant from colliding with a stale key.
  assert.deepEqual(created, [{ amount: 275, dedupeKey: "verified-playtime:member:275" }]);
});

test("rollback rejects a tampered reversal id before detaching the identity", async () => {
  let detached = false;
  const transaction = {
    playerIdentity: {
      findUnique: async () => ({ id: "identity-a", userId: "member-a", displayName: "A", gameType: "PALWORLD" }),
      updateMany: async () => { detached = true; return { count: 1 }; },
    },
    identityOwnershipTransaction: {
      findUnique: async () => ({ action: "GRANT", status: "APPLIED", playerIdentityId: "identity-b", toUserId: "member-b" }),
    },
  } as unknown as Prisma.TransactionClient;

  await assert.rejects(
    revokeIdentityOwnership(transaction, {
      playerIdentityId: "identity-a",
      actorUserId: "admin",
      source: "ADMIN_REVOCATION",
      reason: "Wrong grant selected",
      reversesTransactionId: "grant-b",
    }),
    /no longer the active grant/,
  );
  assert.equal(detached, false);
});
