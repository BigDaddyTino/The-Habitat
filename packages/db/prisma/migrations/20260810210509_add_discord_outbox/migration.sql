-- CreateEnum
CREATE TYPE "DiscordNotificationKind" AS ENUM ('SERVER_ONLINE', 'SERVER_SLEEPING', 'SERVER_OUTAGE', 'RECORD_BROKEN', 'LEGENDARY_ACHIEVEMENT', 'WEEKLY_CHRONICLE');

-- CreateTable
CREATE TABLE "DiscordGuildConfig" (
    "id" UUID NOT NULL,
    "guildId" TEXT NOT NULL,
    "announcementChannelId" TEXT,
    "commandsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "notificationsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "notifyServerOnline" BOOLEAN NOT NULL DEFAULT true,
    "notifyServerSleeping" BOOLEAN NOT NULL DEFAULT false,
    "notifyServerOutage" BOOLEAN NOT NULL DEFAULT true,
    "notifyRecordBroken" BOOLEAN NOT NULL DEFAULT true,
    "notifyLegendaryAchievement" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DiscordGuildConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiscordNotification" (
    "id" UUID NOT NULL,
    "configId" UUID NOT NULL,
    "serverEventId" UUID,
    "kind" "DiscordNotificationKind" NOT NULL,
    "content" TEXT NOT NULL,
    "dedupeKey" TEXT NOT NULL,
    "queuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sentAt" TIMESTAMP(3),
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,

    CONSTRAINT "DiscordNotification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DiscordGuildConfig_guildId_key" ON "DiscordGuildConfig"("guildId");

-- CreateIndex
CREATE UNIQUE INDEX "DiscordNotification_dedupeKey_key" ON "DiscordNotification"("dedupeKey");

-- CreateIndex
CREATE INDEX "DiscordNotification_configId_sentAt_queuedAt_idx" ON "DiscordNotification"("configId", "sentAt", "queuedAt");

-- AddForeignKey
ALTER TABLE "DiscordNotification" ADD CONSTRAINT "DiscordNotification_configId_fkey" FOREIGN KEY ("configId") REFERENCES "DiscordGuildConfig"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiscordNotification" ADD CONSTRAINT "DiscordNotification_serverEventId_fkey" FOREIGN KEY ("serverEventId") REFERENCES "ServerEvent"("id") ON DELETE SET NULL ON UPDATE CASCADE;
