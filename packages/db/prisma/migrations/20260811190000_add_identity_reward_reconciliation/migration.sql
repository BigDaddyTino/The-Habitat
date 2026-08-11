CREATE TABLE "IdentityRewardReconciliation" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "playerIdentityId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "queuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastError" VARCHAR(180),
    CONSTRAINT "IdentityRewardReconciliation_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "IdentityRewardReconciliation_playerIdentityId_key" ON "IdentityRewardReconciliation"("playerIdentityId");
CREATE INDEX "IdentityRewardReconciliation_completedAt_queuedAt_idx" ON "IdentityRewardReconciliation"("completedAt", "queuedAt");
CREATE INDEX "IdentityRewardReconciliation_userId_completedAt_idx" ON "IdentityRewardReconciliation"("userId", "completedAt");

ALTER TABLE "IdentityRewardReconciliation" ADD CONSTRAINT "IdentityRewardReconciliation_playerIdentityId_fkey" FOREIGN KEY ("playerIdentityId") REFERENCES "PlayerIdentity"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "IdentityRewardReconciliation" ADD CONSTRAINT "IdentityRewardReconciliation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
