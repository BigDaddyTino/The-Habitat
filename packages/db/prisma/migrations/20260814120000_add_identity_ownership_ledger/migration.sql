-- Identity ownership ledger.
--
-- Claims now cause large retroactive changes to playtime, XP, levels,
-- achievements, and rewards. This migration adds the append-only record of
-- every ownership transition so a claim can be previewed, explained, and
-- reversed, and adds the audit-log indexes the ownership history views need.

CREATE TYPE "IdentityOwnershipAction" AS ENUM ('GRANT', 'REVOKE');
CREATE TYPE "IdentityOwnershipStatus" AS ENUM ('APPLIED', 'REVERSED');
CREATE TYPE "IdentityOwnershipSource" AS ENUM ('ADMIN_CLAIM_APPROVAL', 'ADMIN_TRANSFER', 'ADMIN_REVOCATION', 'STEAM_VERIFICATION', 'WORKER_AUTO_LINK');

CREATE TABLE "IdentityOwnershipTransaction" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "playerIdentityId" UUID NOT NULL,
    "action" "IdentityOwnershipAction" NOT NULL,
    "status" "IdentityOwnershipStatus" NOT NULL DEFAULT 'APPLIED',
    "source" "IdentityOwnershipSource" NOT NULL,
    "fromUserId" UUID,
    "toUserId" UUID,
    "claimId" UUID,
    "actorUserId" UUID,
    "reason" VARCHAR(300),
    "projectedImpact" JSONB,
    "appliedImpact" JSONB,
    "reversalTransactionId" UUID,
    "reversedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IdentityOwnershipTransaction_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "IdentityOwnershipTransaction"
    ADD CONSTRAINT "IdentityOwnershipTransaction_playerIdentityId_fkey" FOREIGN KEY ("playerIdentityId") REFERENCES "PlayerIdentity"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    ADD CONSTRAINT "IdentityOwnershipTransaction_fromUserId_fkey" FOREIGN KEY ("fromUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    ADD CONSTRAINT "IdentityOwnershipTransaction_toUserId_fkey" FOREIGN KEY ("toUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    ADD CONSTRAINT "IdentityOwnershipTransaction_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    ADD CONSTRAINT "IdentityOwnershipTransaction_claimId_fkey" FOREIGN KEY ("claimId") REFERENCES "PlayerIdentityClaim"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    ADD CONSTRAINT "IdentityOwnershipTransaction_reversalTransactionId_fkey" FOREIGN KEY ("reversalTransactionId") REFERENCES "IdentityOwnershipTransaction"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE UNIQUE INDEX "IdentityOwnershipTransaction_reversalTransactionId_key" ON "IdentityOwnershipTransaction"("reversalTransactionId");
CREATE INDEX "IdentityOwnershipTransaction_playerIdentityId_createdAt_idx" ON "IdentityOwnershipTransaction"("playerIdentityId", "createdAt");
CREATE INDEX "IdentityOwnershipTransaction_toUserId_createdAt_idx" ON "IdentityOwnershipTransaction"("toUserId", "createdAt");
CREATE INDEX "IdentityOwnershipTransaction_fromUserId_createdAt_idx" ON "IdentityOwnershipTransaction"("fromUserId", "createdAt");
CREATE INDEX "IdentityOwnershipTransaction_action_status_createdAt_idx" ON "IdentityOwnershipTransaction"("action", "status", "createdAt");

-- A grant must name who received the identity and a revocation must name who
-- lost it, otherwise the ledger cannot be replayed or reversed.
ALTER TABLE "IdentityOwnershipTransaction"
    ADD CONSTRAINT "IdentityOwnershipTransaction_direction" CHECK (
        ("action" = 'GRANT' AND "toUserId" IS NOT NULL)
        OR ("action" = 'REVOKE' AND "fromUserId" IS NOT NULL)
    );

-- Ownership history and the member data export both read the audit log by
-- entity and by actor. Only `createdAt` was indexed before.
CREATE INDEX "AuditLog_entityType_entityId_createdAt_idx" ON "AuditLog"("entityType", "entityId", "createdAt");
CREATE INDEX "AuditLog_actorUserId_createdAt_idx" ON "AuditLog"("actorUserId", "createdAt");

-- Backfill: every identity that is already owned gets an opening ledger entry
-- so ownership history is not blank for history that predates this table. The
-- source is recorded as claim approval where an approved claim exists and as
-- Steam verification otherwise, matching the two paths that could have set it.
INSERT INTO "IdentityOwnershipTransaction" ("id", "playerIdentityId", "action", "status", "source", "toUserId", "claimId", "actorUserId", "reason", "createdAt")
SELECT
    gen_random_uuid(),
    "identity"."id",
    'GRANT',
    'APPLIED',
    CASE WHEN "claim"."id" IS NOT NULL THEN 'ADMIN_CLAIM_APPROVAL'::"IdentityOwnershipSource" ELSE 'STEAM_VERIFICATION'::"IdentityOwnershipSource" END,
    "identity"."userId",
    "claim"."id",
    "claim"."resolvedByUserId",
    'Backfilled from existing ownership when the ownership ledger was introduced.',
    COALESCE("claim"."resolvedAt", "identity"."verifiedAt", "identity"."createdAt")
FROM "PlayerIdentity" AS "identity"
LEFT JOIN LATERAL (
    SELECT "candidate"."id", "candidate"."resolvedAt", "candidate"."resolvedByUserId"
    FROM "PlayerIdentityClaim" AS "candidate"
    WHERE "candidate"."playerIdentityId" = "identity"."id"
      AND "candidate"."userId" = "identity"."userId"
      AND "candidate"."status" = 'APPROVED'
    ORDER BY "candidate"."resolvedAt" DESC NULLS LAST
    LIMIT 1
) AS "claim" ON TRUE
WHERE "identity"."userId" IS NOT NULL;
