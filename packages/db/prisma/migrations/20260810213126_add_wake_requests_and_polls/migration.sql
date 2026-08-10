-- CreateEnum
CREATE TYPE "WakeRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ServerPollStatus" AS ENUM ('ACTIVE', 'CLOSED');

-- AlterEnum
ALTER TYPE "DiscordNotificationKind" ADD VALUE 'WAKE_REQUEST';

-- AlterTable
ALTER TABLE "DiscordGuildConfig" ADD COLUMN     "notifyWakeRequest" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "WakeRequest" (
    "id" UUID NOT NULL,
    "serverId" UUID NOT NULL,
    "requesterUserId" UUID NOT NULL,
    "status" "WakeRequestStatus" NOT NULL DEFAULT 'PENDING',
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),
    "resolvedByUserId" UUID,
    "resolutionNote" TEXT,

    CONSTRAINT "WakeRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WakeVote" (
    "wakeRequestId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WakeVote_pkey" PRIMARY KEY ("wakeRequestId","userId")
);

-- CreateTable
CREATE TABLE "ServerPoll" (
    "id" UUID NOT NULL,
    "question" TEXT NOT NULL,
    "status" "ServerPollStatus" NOT NULL DEFAULT 'ACTIVE',
    "closesAt" TIMESTAMP(3) NOT NULL,
    "createdByUserId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" TIMESTAMP(3),

    CONSTRAINT "ServerPoll_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServerPollOption" (
    "id" UUID NOT NULL,
    "pollId" UUID NOT NULL,
    "serverId" UUID NOT NULL,
    "position" INTEGER NOT NULL,

    CONSTRAINT "ServerPollOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServerPollVote" (
    "pollId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "optionId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServerPollVote_pkey" PRIMARY KEY ("pollId","userId")
);

-- CreateIndex
CREATE INDEX "WakeRequest_serverId_status_requestedAt_idx" ON "WakeRequest"("serverId", "status", "requestedAt");

-- CreateIndex
CREATE UNIQUE INDEX "WakeRequest_one_pending_per_server" ON "WakeRequest"("serverId") WHERE "status" = 'PENDING';

-- CreateIndex
CREATE INDEX "WakeRequest_requesterUserId_requestedAt_idx" ON "WakeRequest"("requesterUserId", "requestedAt");

-- CreateIndex
CREATE INDEX "WakeVote_userId_createdAt_idx" ON "WakeVote"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "ServerPoll_status_closesAt_idx" ON "ServerPoll"("status", "closesAt");

-- CreateIndex
CREATE UNIQUE INDEX "ServerPoll_one_active" ON "ServerPoll" ((1)) WHERE "status" = 'ACTIVE';

-- CreateIndex
CREATE UNIQUE INDEX "ServerPollOption_pollId_serverId_key" ON "ServerPollOption"("pollId", "serverId");

-- CreateIndex
CREATE UNIQUE INDEX "ServerPollOption_pollId_position_key" ON "ServerPollOption"("pollId", "position");

-- CreateIndex
CREATE INDEX "ServerPollVote_optionId_idx" ON "ServerPollVote"("optionId");

-- AddForeignKey
ALTER TABLE "WakeRequest" ADD CONSTRAINT "WakeRequest_serverId_fkey" FOREIGN KEY ("serverId") REFERENCES "GameServer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WakeRequest" ADD CONSTRAINT "WakeRequest_requesterUserId_fkey" FOREIGN KEY ("requesterUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WakeRequest" ADD CONSTRAINT "WakeRequest_resolvedByUserId_fkey" FOREIGN KEY ("resolvedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WakeVote" ADD CONSTRAINT "WakeVote_wakeRequestId_fkey" FOREIGN KEY ("wakeRequestId") REFERENCES "WakeRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WakeVote" ADD CONSTRAINT "WakeVote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServerPoll" ADD CONSTRAINT "ServerPoll_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServerPollOption" ADD CONSTRAINT "ServerPollOption_pollId_fkey" FOREIGN KEY ("pollId") REFERENCES "ServerPoll"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServerPollOption" ADD CONSTRAINT "ServerPollOption_serverId_fkey" FOREIGN KEY ("serverId") REFERENCES "GameServer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServerPollVote" ADD CONSTRAINT "ServerPollVote_pollId_fkey" FOREIGN KEY ("pollId") REFERENCES "ServerPoll"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServerPollVote" ADD CONSTRAINT "ServerPollVote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServerPollVote" ADD CONSTRAINT "ServerPollVote_optionId_fkey" FOREIGN KEY ("optionId") REFERENCES "ServerPollOption"("id") ON DELETE CASCADE ON UPDATE CASCADE;
