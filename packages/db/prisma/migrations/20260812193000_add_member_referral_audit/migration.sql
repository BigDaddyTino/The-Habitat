CREATE TABLE "MemberReferral" (
  "id" UUID NOT NULL,
  "inviterUserId" UUID NOT NULL,
  "invitedUserId" UUID NOT NULL,
  "invitationId" UUID,
  "method" VARCHAR(16) NOT NULL,
  "codeWeek" VARCHAR(10),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "MemberReferral_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "MemberReferral_method_valid" CHECK ("method" IN ('EMAIL', 'CODE'))
);

CREATE UNIQUE INDEX "MemberReferral_invitedUserId_key" ON "MemberReferral"("invitedUserId");
CREATE UNIQUE INDEX "MemberReferral_invitationId_key" ON "MemberReferral"("invitationId");
CREATE INDEX "MemberReferral_inviterUserId_createdAt_idx" ON "MemberReferral"("inviterUserId", "createdAt");
CREATE INDEX "MemberReferral_method_createdAt_idx" ON "MemberReferral"("method", "createdAt");

ALTER TABLE "MemberReferral"
ADD CONSTRAINT "MemberReferral_inviterUserId_fkey"
FOREIGN KEY ("inviterUserId") REFERENCES "User"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "MemberReferral"
ADD CONSTRAINT "MemberReferral_invitedUserId_fkey"
FOREIGN KEY ("invitedUserId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "MemberReferral"
ADD CONSTRAINT "MemberReferral_invitationId_fkey"
FOREIGN KEY ("invitationId") REFERENCES "Invitation"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
