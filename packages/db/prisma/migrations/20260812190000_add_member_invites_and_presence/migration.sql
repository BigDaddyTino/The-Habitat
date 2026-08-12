ALTER TABLE "Invitation" ADD COLUMN "invitedByUserId" UUID;

CREATE INDEX "Invitation_invitedByUserId_createdAt_idx"
ON "Invitation"("invitedByUserId", "createdAt");

ALTER TABLE "Invitation"
ADD CONSTRAINT "Invitation_invitedByUserId_fkey"
FOREIGN KEY ("invitedByUserId") REFERENCES "User"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "MemberPresence" (
  "userId" UUID NOT NULL,
  "authProvider" VARCHAR(32) NOT NULL DEFAULT 'Discord',
  "deviceType" VARCHAR(32) NOT NULL,
  "platform" VARCHAR(64) NOT NULL,
  "browser" VARCHAR(64) NOT NULL,
  "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "MemberPresence_pkey" PRIMARY KEY ("userId")
);

CREATE INDEX "MemberPresence_lastSeenAt_idx" ON "MemberPresence"("lastSeenAt");

ALTER TABLE "MemberPresence"
ADD CONSTRAINT "MemberPresence_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
