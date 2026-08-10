-- CreateEnum
CREATE TYPE "IdentityClaimStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "PlayerIdentityClaim" (
    "id" UUID NOT NULL,
    "playerIdentityId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "status" "IdentityClaimStatus" NOT NULL DEFAULT 'PENDING',
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),
    "resolvedByUserId" UUID,
    "resolutionNote" TEXT,

    CONSTRAINT "PlayerIdentityClaim_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PlayerIdentityClaim_status_requestedAt_idx" ON "PlayerIdentityClaim"("status", "requestedAt");

-- CreateIndex
CREATE INDEX "PlayerIdentityClaim_userId_requestedAt_idx" ON "PlayerIdentityClaim"("userId", "requestedAt");

-- CreateIndex
CREATE UNIQUE INDEX "PlayerIdentityClaim_playerIdentityId_userId_key" ON "PlayerIdentityClaim"("playerIdentityId", "userId");

-- AddForeignKey
ALTER TABLE "PlayerIdentityClaim" ADD CONSTRAINT "PlayerIdentityClaim_playerIdentityId_fkey" FOREIGN KEY ("playerIdentityId") REFERENCES "PlayerIdentity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerIdentityClaim" ADD CONSTRAINT "PlayerIdentityClaim_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerIdentityClaim" ADD CONSTRAINT "PlayerIdentityClaim_resolvedByUserId_fkey" FOREIGN KEY ("resolvedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
