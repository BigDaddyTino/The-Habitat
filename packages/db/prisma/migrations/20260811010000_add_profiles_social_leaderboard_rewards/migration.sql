-- Member-controlled profile presentation, optional social links, and
-- achievement-backed cosmetics. Provider credentials and presence data are
-- intentionally not stored here.
CREATE TYPE "AchievementRewardKind" AS ENUM ('TITLE', 'AVATAR_BORDER', 'PROFILE_LAYOUT', 'BADGE');
CREATE TYPE "SocialPlatform" AS ENUM ('TWITCH', 'STEAM', 'DISCORD', 'YOUTUBE', 'XBOX', 'PLAYSTATION', 'EPIC_GAMES', 'BATTLE_NET', 'RIOT_GAMES', 'GITHUB');

ALTER TABLE "User"
  ADD COLUMN "bio" VARCHAR(500),
  ADD COLUMN "avatarBorder" VARCHAR(64),
  ADD COLUMN "profileLayout" VARCHAR(64);

CREATE TABLE "AchievementReward" (
  "id" UUID NOT NULL,
  "achievementDefinitionId" UUID NOT NULL,
  "kind" "AchievementRewardKind" NOT NULL,
  "code" VARCHAR(64) NOT NULL,
  "name" VARCHAR(80) NOT NULL,
  "description" VARCHAR(180),
  "titleDefinitionId" UUID,
  CONSTRAINT "AchievementReward_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "UserAchievementReward" (
  "id" UUID NOT NULL,
  "userId" UUID NOT NULL,
  "achievementRewardId" UUID NOT NULL,
  "playerAchievementId" UUID,
  "unlockedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "equipped" BOOLEAN NOT NULL DEFAULT false,
  CONSTRAINT "UserAchievementReward_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "UserSocialAccount" (
  "id" UUID NOT NULL,
  "userId" UUID NOT NULL,
  "platform" "SocialPlatform" NOT NULL,
  "handle" VARCHAR(80) NOT NULL,
  "profileUrl" VARCHAR(300),
  "displayPublic" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "UserSocialAccount_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AchievementReward_achievementDefinitionId_kind_code_key" ON "AchievementReward"("achievementDefinitionId", "kind", "code");
CREATE INDEX "AchievementReward_achievementDefinitionId_idx" ON "AchievementReward"("achievementDefinitionId");
CREATE UNIQUE INDEX "UserAchievementReward_userId_achievementRewardId_key" ON "UserAchievementReward"("userId", "achievementRewardId");
CREATE INDEX "UserAchievementReward_userId_equipped_idx" ON "UserAchievementReward"("userId", "equipped");
CREATE UNIQUE INDEX "UserSocialAccount_userId_platform_key" ON "UserSocialAccount"("userId", "platform");
CREATE UNIQUE INDEX "UserSocialAccount_platform_handle_key" ON "UserSocialAccount"("platform", "handle");
CREATE INDEX "UserSocialAccount_userId_displayPublic_idx" ON "UserSocialAccount"("userId", "displayPublic");

ALTER TABLE "AchievementReward" ADD CONSTRAINT "AchievementReward_achievementDefinitionId_fkey" FOREIGN KEY ("achievementDefinitionId") REFERENCES "AchievementDefinition"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AchievementReward" ADD CONSTRAINT "AchievementReward_titleDefinitionId_fkey" FOREIGN KEY ("titleDefinitionId") REFERENCES "TitleDefinition"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "UserAchievementReward" ADD CONSTRAINT "UserAchievementReward_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UserAchievementReward" ADD CONSTRAINT "UserAchievementReward_achievementRewardId_fkey" FOREIGN KEY ("achievementRewardId") REFERENCES "AchievementReward"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UserAchievementReward" ADD CONSTRAINT "UserAchievementReward_playerAchievementId_fkey" FOREIGN KEY ("playerAchievementId") REFERENCES "PlayerAchievement"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "UserSocialAccount" ADD CONSTRAINT "UserSocialAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
