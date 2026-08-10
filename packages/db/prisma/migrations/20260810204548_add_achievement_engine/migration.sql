-- CreateEnum
CREATE TYPE "AchievementRarity" AS ENUM ('COMMON', 'UNCOMMON', 'RARE', 'EPIC', 'LEGENDARY', 'QUESTIONABLE_LIFE_CHOICE');

-- CreateEnum
CREATE TYPE "AchievementRuleType" AS ENUM ('EVENT_COUNT', 'DISTINCT_GAME_EVENT_COUNT');

-- CreateTable
CREATE TABLE "AchievementDefinition" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "secretDescription" TEXT,
    "icon" TEXT,
    "gameType" "GameType",
    "rarity" "AchievementRarity" NOT NULL,
    "category" TEXT NOT NULL,
    "ruleType" "AchievementRuleType" NOT NULL,
    "ruleConfig" JSONB NOT NULL,
    "isSecret" BOOLEAN NOT NULL DEFAULT false,
    "isRepeatable" BOOLEAN NOT NULL DEFAULT false,
    "points" INTEGER NOT NULL DEFAULT 0,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AchievementDefinition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlayerAchievement" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "achievementDefinitionId" UUID NOT NULL,
    "sourceEventId" UUID,
    "awardedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dedupeKey" TEXT NOT NULL,

    CONSTRAINT "PlayerAchievement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AchievementDefinition_slug_key" ON "AchievementDefinition"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "PlayerAchievement_dedupeKey_key" ON "PlayerAchievement"("dedupeKey");

-- CreateIndex
CREATE INDEX "PlayerAchievement_userId_awardedAt_idx" ON "PlayerAchievement"("userId", "awardedAt");

-- CreateIndex
CREATE INDEX "PlayerAchievement_achievementDefinitionId_awardedAt_idx" ON "PlayerAchievement"("achievementDefinitionId", "awardedAt");

-- AddForeignKey
ALTER TABLE "PlayerAchievement" ADD CONSTRAINT "PlayerAchievement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerAchievement" ADD CONSTRAINT "PlayerAchievement_achievementDefinitionId_fkey" FOREIGN KEY ("achievementDefinitionId") REFERENCES "AchievementDefinition"("id") ON DELETE CASCADE ON UPDATE CASCADE;
