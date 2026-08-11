import { getPrismaClient } from "@habitat/db/client";
import { evaluateAchievementsForEvent, evaluateAchievementsForLegacyEvidence } from "./achievements.js";
import { processProgressionForEvent } from "./progression.js";

const verifiedSessionSources = ["PALWORLD_REST", "LEGACY_HISTORY_IMPORT"];

/** Applies all already-observed, verified identity history after ownership becomes proven. */
export async function reconcilePendingIdentityRewards(limit = 20) {
  const db = getPrismaClient();
  const jobs = await db.identityRewardReconciliation.findMany({ where: { completedAt: null }, orderBy: { queuedAt: "asc" }, take: limit, select: { id: true, playerIdentityId: true, userId: true } });
  let completed = 0;
  for (const job of jobs) {
    try {
      await db.$transaction(async (transaction) => {
        const identity = await transaction.playerIdentity.findUnique({ where: { id: job.playerIdentityId }, select: { id: true, userId: true, verifiedAt: true, displayName: true } });
        if (!identity || identity.userId !== job.userId || !identity.verifiedAt) {
          await transaction.identityRewardReconciliation.update({ where: { id: job.id }, data: { completedAt: new Date(), attempts: { increment: 1 }, lastError: "identity_not_verified_for_queued_user" } });
          return;
        }
        const [latestJoin, latestEvidence, progressionEvent] = await Promise.all([
          transaction.serverEvent.findFirst({ where: { playerIdentityId: identity.id, eventType: "PLAYER_JOINED", sourceConfidence: { gte: 100 } }, orderBy: [{ occurredAt: "desc" }, { id: "desc" }], select: { id: true } }),
          transaction.legacyPlayerEvidence.findFirst({ where: { playerIdentityId: identity.id }, orderBy: [{ occurredAt: "desc" }, { id: "desc" }], select: { id: true } }),
          transaction.serverEvent.findFirst({ where: { playerIdentityId: identity.id, OR: [{ eventType: "PLAYER_LEFT", source: { in: verifiedSessionSources }, sourceConfidence: { gte: 100 }, valueNumber: { gt: 0 } }, { eventType: "PLAYER_JOINED", sourceConfidence: { gte: 100 } }] }, orderBy: [{ occurredAt: "desc" }, { id: "desc" }], select: { id: true, serverId: true, gameType: true, occurredAt: true } }),
        ]);
        if (latestJoin) await evaluateAchievementsForEvent(transaction, latestJoin.id);
        if (latestEvidence) await evaluateAchievementsForLegacyEvidence(transaction, latestEvidence.id);
        if (progressionEvent) {
          await processProgressionForEvent(transaction, progressionEvent.id);
        }
        await transaction.identityRewardReconciliation.update({ where: { id: job.id }, data: { completedAt: new Date(), attempts: { increment: 1 }, lastError: null } });
        await transaction.auditLog.create({ data: { actorUserId: job.userId, action: "PLAYER_IDENTITY_REWARDS_RECONCILED", entityType: "PlayerIdentity", entityId: identity.id, after: { reconciliationJobId: job.id } } });
      });
      completed += 1;
    } catch (error) {
      await db.identityRewardReconciliation.update({ where: { id: job.id }, data: { attempts: { increment: 1 }, lastError: error instanceof Error ? error.message.slice(0, 180) : "unknown_reconciliation_error" } });
    }
  }
  return completed;
}
