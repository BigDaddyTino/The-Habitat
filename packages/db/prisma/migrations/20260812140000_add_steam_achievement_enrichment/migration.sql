CREATE TYPE "SteamAchievementSyncStatus" AS ENUM ('PENDING', 'READY', 'PRIVATE', 'UNSUPPORTED', 'ERROR');

ALTER TABLE "SteamApp"
  ADD COLUMN "achievementSchemaStatus" "SteamAchievementSyncStatus" NOT NULL DEFAULT 'PENDING',
  ADD COLUMN "achievementSchemaLastAttemptedAt" TIMESTAMP(3),
  ADD COLUMN "achievementSchemaLastSuccessfulAt" TIMESTAMP(3),
  ADD COLUMN "achievementSchemaNextAttemptAt" TIMESTAMP(3),
  ADD COLUMN "achievementSchemaSyncError" VARCHAR(180);

CREATE TABLE "SteamAchievementDefinition" (
  "id" UUID NOT NULL,
  "steamAppId" INTEGER NOT NULL,
  "apiName" VARCHAR(200) NOT NULL,
  "displayName" VARCHAR(200) NOT NULL,
  "description" VARCHAR(500),
  "hidden" BOOLEAN NOT NULL DEFAULT false,
  "iconUrl" VARCHAR(500),
  "iconGrayUrl" VARCHAR(500),
  "globalPercent" DOUBLE PRECISION,
  "lastSeenAt" TIMESTAMP(3) NOT NULL,
  "isCurrent" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SteamAchievementDefinition_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SteamUserAchievement" (
  "id" UUID NOT NULL,
  "steamProfileId" UUID NOT NULL,
  "achievementDefinitionId" UUID NOT NULL,
  "achieved" BOOLEAN NOT NULL DEFAULT false,
  "unlockedAt" TIMESTAMP(3),
  "lastSeenAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SteamUserAchievement_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SteamAchievementSync" (
  "id" UUID NOT NULL,
  "steamProfileId" UUID NOT NULL,
  "steamAppId" INTEGER NOT NULL,
  "status" "SteamAchievementSyncStatus" NOT NULL DEFAULT 'PENDING',
  "lastAttemptedAt" TIMESTAMP(3),
  "lastSuccessfulAt" TIMESTAMP(3),
  "nextAttemptAt" TIMESTAMP(3),
  "consecutiveFailures" INTEGER NOT NULL DEFAULT 0,
  "syncError" VARCHAR(180),
  "definitionCount" INTEGER NOT NULL DEFAULT 0,
  "achievedCount" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SteamAchievementSync_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "SteamAchievementSync_counts_nonnegative" CHECK ("consecutiveFailures" >= 0 AND "definitionCount" >= 0 AND "achievedCount" >= 0 AND "achievedCount" <= "definitionCount")
);

CREATE TABLE "ProviderRequestUsage" (
  "id" UUID NOT NULL,
  "provider" VARCHAR(40) NOT NULL,
  "usageDay" DATE NOT NULL,
  "requestCount" INTEGER NOT NULL DEFAULT 0,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ProviderRequestUsage_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ProviderRequestUsage_requestCount_nonnegative" CHECK ("requestCount" >= 0)
);

CREATE UNIQUE INDEX "SteamAchievementDefinition_steamAppId_apiName_key" ON "SteamAchievementDefinition"("steamAppId", "apiName");
CREATE INDEX "SteamAchievementDefinition_steamAppId_isCurrent_idx" ON "SteamAchievementDefinition"("steamAppId", "isCurrent");
CREATE UNIQUE INDEX "SteamUserAchievement_steamProfileId_achievementDefinitionId_key" ON "SteamUserAchievement"("steamProfileId", "achievementDefinitionId");
CREATE INDEX "SteamUserAchievement_steamProfileId_achieved_idx" ON "SteamUserAchievement"("steamProfileId", "achieved");
CREATE UNIQUE INDEX "SteamAchievementSync_steamProfileId_steamAppId_key" ON "SteamAchievementSync"("steamProfileId", "steamAppId");
CREATE INDEX "SteamAchievementSync_status_nextAttemptAt_idx" ON "SteamAchievementSync"("status", "nextAttemptAt");
CREATE INDEX "SteamAchievementSync_steamProfileId_status_idx" ON "SteamAchievementSync"("steamProfileId", "status");
CREATE UNIQUE INDEX "ProviderRequestUsage_provider_usageDay_key" ON "ProviderRequestUsage"("provider", "usageDay");
CREATE INDEX "ProviderRequestUsage_usageDay_idx" ON "ProviderRequestUsage"("usageDay");

ALTER TABLE "SteamAchievementDefinition" ADD CONSTRAINT "SteamAchievementDefinition_steamAppId_fkey" FOREIGN KEY ("steamAppId") REFERENCES "SteamApp"("appId") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SteamUserAchievement" ADD CONSTRAINT "SteamUserAchievement_steamProfileId_fkey" FOREIGN KEY ("steamProfileId") REFERENCES "SteamProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SteamUserAchievement" ADD CONSTRAINT "SteamUserAchievement_achievementDefinitionId_fkey" FOREIGN KEY ("achievementDefinitionId") REFERENCES "SteamAchievementDefinition"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SteamAchievementSync" ADD CONSTRAINT "SteamAchievementSync_steamProfileId_fkey" FOREIGN KEY ("steamProfileId") REFERENCES "SteamProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SteamAchievementSync" ADD CONSTRAINT "SteamAchievementSync_steamAppId_fkey" FOREIGN KEY ("steamAppId") REFERENCES "SteamApp"("appId") ON DELETE CASCADE ON UPDATE CASCADE;
