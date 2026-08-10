-- CreateEnum
CREATE TYPE "ServerCommandAction" AS ENUM ('START', 'STOP', 'RESTART', 'UPDATE');

-- AlterTable
ALTER TABLE "GameServer" ADD COLUMN "controlEnabled" BOOLEAN NOT NULL DEFAULT false;

-- CreateEnum
CREATE TYPE "ServerCommandStatus" AS ENUM ('REQUESTED', 'AUTHORIZED', 'DISPATCHED', 'RUNNING', 'SUCCEEDED', 'FAILED', 'TIMED_OUT');

-- CreateTable
CREATE TABLE "ServerCommand" (
    "id" UUID NOT NULL,
    "serverId" UUID NOT NULL,
    "requestedByUserId" UUID NOT NULL,
    "action" "ServerCommandAction" NOT NULL,
    "status" "ServerCommandStatus" NOT NULL DEFAULT 'REQUESTED',
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "authorizedAt" TIMESTAMP(3),
    "dispatchedAt" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "result" JSONB,
    "errorCode" TEXT,

    CONSTRAINT "ServerCommand_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServerCommandAudit" (
    "id" UUID NOT NULL,
    "serverCommandId" UUID NOT NULL,
    "status" "ServerCommandStatus" NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actorUserId" UUID,
    "details" JSONB,

    CONSTRAINT "ServerCommandAudit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ServerCommand_status_requestedAt_idx" ON "ServerCommand"("status", "requestedAt");

-- CreateIndex
CREATE INDEX "ServerCommand_serverId_requestedAt_idx" ON "ServerCommand"("serverId", "requestedAt");

-- CreateIndex
CREATE INDEX "ServerCommand_requestedByUserId_requestedAt_idx" ON "ServerCommand"("requestedByUserId", "requestedAt");

-- CreateIndex
CREATE INDEX "ServerCommandAudit_serverCommandId_recordedAt_idx" ON "ServerCommandAudit"("serverCommandId", "recordedAt");

-- AddForeignKey
ALTER TABLE "ServerCommand" ADD CONSTRAINT "ServerCommand_serverId_fkey" FOREIGN KEY ("serverId") REFERENCES "GameServer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServerCommand" ADD CONSTRAINT "ServerCommand_requestedByUserId_fkey" FOREIGN KEY ("requestedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServerCommandAudit" ADD CONSTRAINT "ServerCommandAudit_serverCommandId_fkey" FOREIGN KEY ("serverCommandId") REFERENCES "ServerCommand"("id") ON DELETE CASCADE ON UPDATE CASCADE;
