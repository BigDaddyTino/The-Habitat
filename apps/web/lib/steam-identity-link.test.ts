import assert from "node:assert/strict";
import test from "node:test";
import type { Prisma } from "@habitat/db/client";
import { attachVerifiedSteamIdentities } from "./steam-identity-link";

test("exact Steam identity attachment queues every matched history for reconciliation", async () => {
  const queued: string[] = [];
  const claimStatuses: string[] = [];
  const transaction = {
    playerIdentity: {
      findMany: async () => [{ id: "identity-1" }, { id: "identity-2" }],
      updateMany: async () => ({ count: 2 }),
    },
    identityRewardReconciliation: {
      upsert: async ({ where }: { where: { playerIdentityId: string } }) => { queued.push(where.playerIdentityId); return {}; },
    },
    playerIdentityClaim: {
      updateMany: async ({ data }: { data: { status: string } }) => { claimStatuses.push(data.status); return { count: 1 }; },
    },
  } as unknown as Prisma.TransactionClient;

  const attached = await attachVerifiedSteamIdentities(transaction, "user-1", "76561198000000000", new Date("2026-08-12T12:00:00Z"));
  assert.equal(attached, 2);
  assert.deepEqual(queued, ["identity-1", "identity-2"]);
  assert.deepEqual(claimStatuses, ["APPROVED", "REJECTED"]);
});
