-- CreateEnum
CREATE TYPE "ChronicleReactionType" AS ENUM ('SKULL', 'FIRE', 'FACEPALM', 'CROWN', 'SKILL_ISSUE');

-- CreateTable
CREATE TABLE "ChronicleReaction" (
    "id" UUID NOT NULL,
    "serverEventId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "reactionType" "ChronicleReactionType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChronicleReaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ChronicleReaction_serverEventId_reactionType_idx" ON "ChronicleReaction"("serverEventId", "reactionType");

-- CreateIndex
CREATE UNIQUE INDEX "ChronicleReaction_serverEventId_userId_reactionType_key" ON "ChronicleReaction"("serverEventId", "userId", "reactionType");

-- AddForeignKey
ALTER TABLE "ChronicleReaction" ADD CONSTRAINT "ChronicleReaction_serverEventId_fkey" FOREIGN KEY ("serverEventId") REFERENCES "ServerEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChronicleReaction" ADD CONSTRAINT "ChronicleReaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
