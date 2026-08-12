ALTER TABLE "Invitation"
ADD COLUMN "revokedAt" TIMESTAMP(3);

CREATE INDEX "Invitation_revokedAt_expiresAt_idx"
ON "Invitation"("revokedAt", "expiresAt");
