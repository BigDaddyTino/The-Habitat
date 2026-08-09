-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'USER', 'VIEWER');

-- CreateEnum
CREATE TYPE "GameType" AS ENUM ('SEVEN_DAYS_TO_DIE', 'PROJECT_ZOMBOID', 'DRAGONWILDS', 'ENSHROUDED', 'PALWORLD', 'VALHEIM');

-- CreateEnum
CREATE TYPE "ServerState" AS ENUM ('ONLINE', 'STARTING', 'STOPPING', 'SLEEPING', 'UPDATING', 'DEGRADED', 'DOWN_UNEXPECTEDLY', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "ServerEventType" AS ENUM ('SERVER_STARTED', 'SERVER_STOPPED', 'SERVER_SLEEPING', 'SERVER_CRASHED', 'SERVER_UPDATED', 'PLAYER_JOINED', 'PLAYER_LEFT', 'PLAYER_DIED', 'PLAYER_KILLED', 'BOSS_KILLED', 'CHAT_MESSAGE', 'WORLD_SAVED', 'BACKUP_CREATED', 'ACHIEVEMENT_EARNED', 'RECORD_BROKEN', 'ADMIN_ANNOUNCEMENT', 'WAKE_REQUESTED', 'WAKE_APPROVED');

-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL,
    "username" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "email" TEXT,
    "role" "Role" NOT NULL DEFAULT 'VIEWER',
    "imageUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GameServer" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "gameType" "GameType" NOT NULL,
    "worldName" TEXT NOT NULL,
    "description" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "desiredState" "ServerState" NOT NULL DEFAULT 'SLEEPING',
    "actualState" "ServerState" NOT NULL DEFAULT 'UNKNOWN',
    "lastStateChangeAt" TIMESTAMP(3),
    "lastQueryAt" TIMESTAMP(3),
    "lastOnlineAt" TIMESTAMP(3),
    "currentVersion" TEXT,
    "currentBuildId" TEXT,
    "maxPlayers" INTEGER,
    "adapterType" TEXT NOT NULL,
    "capabilities" JSONB NOT NULL,
    "publicNotes" TEXT,
    "adminNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GameServer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServerRuntimeState" (
    "id" UUID NOT NULL,
    "serverId" UUID NOT NULL,
    "state" "ServerState" NOT NULL DEFAULT 'UNKNOWN',
    "reachable" BOOLEAN,
    "playerCount" INTEGER,
    "maxPlayers" INTEGER,
    "pingMs" INTEGER,
    "version" TEXT,
    "buildId" TEXT,
    "processRunning" BOOLEAN,
    "processStartedAt" TIMESTAMP(3),
    "observedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "details" JSONB,

    CONSTRAINT "ServerRuntimeState_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServerStatusHistory" (
    "id" UUID NOT NULL,
    "serverId" UUID NOT NULL,
    "state" "ServerState" NOT NULL,
    "desiredState" "ServerState",
    "observedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reason" TEXT,
    "details" JSONB,

    CONSTRAINT "ServerStatusHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlayerIdentity" (
    "id" UUID NOT NULL,
    "userId" UUID,
    "serverId" UUID,
    "gameType" "GameType" NOT NULL,
    "displayName" TEXT NOT NULL,
    "providerKey" TEXT NOT NULL,
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlayerIdentity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServerEvent" (
    "id" UUID NOT NULL,
    "serverId" UUID NOT NULL,
    "gameType" "GameType" NOT NULL,
    "eventType" "ServerEventType" NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "playerIdentityId" UUID,
    "actorText" TEXT,
    "targetText" TEXT,
    "cause" TEXT,
    "valueNumber" DOUBLE PRECISION,
    "valueText" TEXT,
    "metadata" JSONB,
    "source" TEXT NOT NULL,
    "sourceConfidence" INTEGER NOT NULL DEFAULT 100,
    "dedupeKey" TEXT,

    CONSTRAINT "ServerEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" UUID NOT NULL,
    "actorUserId" UUID,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "before" JSONB,
    "after" JSONB,
    "requestHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "GameServer_slug_key" ON "GameServer"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "ServerRuntimeState_serverId_key" ON "ServerRuntimeState"("serverId");

-- CreateIndex
CREATE INDEX "ServerStatusHistory_serverId_observedAt_idx" ON "ServerStatusHistory"("serverId", "observedAt");

-- CreateIndex
CREATE UNIQUE INDEX "PlayerIdentity_gameType_providerKey_key" ON "PlayerIdentity"("gameType", "providerKey");

-- CreateIndex
CREATE UNIQUE INDEX "ServerEvent_dedupeKey_key" ON "ServerEvent"("dedupeKey");

-- CreateIndex
CREATE INDEX "ServerEvent_serverId_occurredAt_idx" ON "ServerEvent"("serverId", "occurredAt");

-- CreateIndex
CREATE INDEX "ServerEvent_eventType_occurredAt_idx" ON "ServerEvent"("eventType", "occurredAt");

-- CreateIndex
CREATE INDEX "ServerEvent_playerIdentityId_occurredAt_idx" ON "ServerEvent"("playerIdentityId", "occurredAt");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- AddForeignKey
ALTER TABLE "ServerRuntimeState" ADD CONSTRAINT "ServerRuntimeState_serverId_fkey" FOREIGN KEY ("serverId") REFERENCES "GameServer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServerStatusHistory" ADD CONSTRAINT "ServerStatusHistory_serverId_fkey" FOREIGN KEY ("serverId") REFERENCES "GameServer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerIdentity" ADD CONSTRAINT "PlayerIdentity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerIdentity" ADD CONSTRAINT "PlayerIdentity_serverId_fkey" FOREIGN KEY ("serverId") REFERENCES "GameServer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServerEvent" ADD CONSTRAINT "ServerEvent_serverId_fkey" FOREIGN KEY ("serverId") REFERENCES "GameServer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServerEvent" ADD CONSTRAINT "ServerEvent_playerIdentityId_fkey" FOREIGN KEY ("playerIdentityId") REFERENCES "PlayerIdentity"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
