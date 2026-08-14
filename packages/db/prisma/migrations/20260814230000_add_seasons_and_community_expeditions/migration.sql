-- Seasons are an additive progression layer. No existing XP, achievement,
-- record, or reward table is changed by this migration.
CREATE TYPE "SeasonStatus" AS ENUM ('UPCOMING', 'ACTIVE', 'COMPLETED');
CREATE TYPE "SeasonRuleType" AS ENUM ('PLAY_SECONDS', 'JOIN_COUNT', 'DISTINCT_GAME_COUNT', 'BOSS_KILL_COUNT');
CREATE TYPE "SeasonQuestScope" AS ENUM ('PERSONAL', 'TEAM');
CREATE TYPE "SeasonXpSource" AS ENUM ('VERIFIED_PLAYTIME', 'PERSONAL_QUEST', 'TEAM_QUEST');
CREATE TYPE "SeasonTrophyKind" AS ENUM ('COMMEMORATIVE', 'FOUNDING_MEMBER');

CREATE TABLE "Season" (
  "id" UUID NOT NULL, "slug" VARCHAR(80) NOT NULL, "ordinal" INTEGER NOT NULL,
  "name" VARCHAR(100) NOT NULL, "description" VARCHAR(400) NOT NULL, "theme" VARCHAR(80) NOT NULL,
  "startsAt" TIMESTAMP(3) NOT NULL, "endsAt" TIMESTAMP(3) NOT NULL,
  "status" "SeasonStatus" NOT NULL DEFAULT 'UPCOMING', "communityXpGoal" INTEGER NOT NULL,
  "isEnabled" BOOLEAN NOT NULL DEFAULT true, "completedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Season_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Season_exact_three_month_window" CHECK ("endsAt" = "startsAt" + INTERVAL '3 months'),
  CONSTRAINT "Season_positive_values" CHECK ("ordinal" > 0 AND "communityXpGoal" > 0)
);
CREATE TABLE "SeasonMembership" (
  "id" UUID NOT NULL, "seasonId" UUID NOT NULL, "userId" UUID NOT NULL,
  "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "SeasonMembership_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "SeasonQuestDefinition" (
  "id" UUID NOT NULL, "seasonId" UUID NOT NULL, "slug" VARCHAR(80) NOT NULL,
  "name" VARCHAR(100) NOT NULL, "description" VARCHAR(240) NOT NULL,
  "scope" "SeasonQuestScope" NOT NULL, "gameType" "GameType", "ruleType" "SeasonRuleType" NOT NULL,
  "threshold" INTEGER NOT NULL, "xpReward" INTEGER NOT NULL, "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "enabled" BOOLEAN NOT NULL DEFAULT true, CONSTRAINT "SeasonQuestDefinition_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "SeasonQuestDefinition_positive_values" CHECK ("threshold" > 0 AND "xpReward" > 0 AND "sortOrder" >= 0)
);
CREATE TABLE "UserSeasonQuestProgress" (
  "id" UUID NOT NULL, "userId" UUID NOT NULL, "questId" UUID NOT NULL,
  "progress" INTEGER NOT NULL DEFAULT 0, "completedAt" TIMESTAMP(3), "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "UserSeasonQuestProgress_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "UserSeasonQuestProgress_nonnegative" CHECK ("progress" >= 0)
);
CREATE TABLE "SeasonTeamQuestProgress" (
  "id" UUID NOT NULL, "questId" UUID NOT NULL, "progress" INTEGER NOT NULL DEFAULT 0,
  "completedAt" TIMESTAMP(3), "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SeasonTeamQuestProgress_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "SeasonTeamQuestProgress_nonnegative" CHECK ("progress" >= 0)
);
CREATE TABLE "SeasonExpedition" (
  "id" UUID NOT NULL, "seasonId" UUID NOT NULL, "slug" VARCHAR(80) NOT NULL,
  "gameType" "GameType" NOT NULL, "name" VARCHAR(100) NOT NULL, "description" VARCHAR(240) NOT NULL,
  "ruleType" "SeasonRuleType" NOT NULL, "threshold" INTEGER NOT NULL, "progress" INTEGER NOT NULL DEFAULT 0,
  "completedAt" TIMESTAMP(3), "sortOrder" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "SeasonExpedition_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "SeasonExpedition_progress_values" CHECK ("threshold" > 0 AND "progress" >= 0 AND "sortOrder" >= 0)
);
CREATE TABLE "SeasonXpEntry" (
  "id" UUID NOT NULL, "seasonId" UUID NOT NULL, "userId" UUID NOT NULL, "serverEventId" UUID,
  "source" "SeasonXpSource" NOT NULL, "amount" INTEGER NOT NULL, "description" VARCHAR(160) NOT NULL,
  "earnedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "dedupeKey" VARCHAR(220) NOT NULL,
  CONSTRAINT "SeasonXpEntry_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "SeasonXpEntry_amount_positive" CHECK ("amount" > 0)
);
CREATE TABLE "SeasonTrophy" (
  "id" UUID NOT NULL, "seasonId" UUID NOT NULL, "kind" "SeasonTrophyKind" NOT NULL,
  "code" VARCHAR(64) NOT NULL, "name" VARCHAR(80) NOT NULL, "description" VARCHAR(180) NOT NULL,
  "rarity" "AchievementRarity" NOT NULL DEFAULT 'EPIC', CONSTRAINT "SeasonTrophy_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "UserSeasonTrophy" (
  "id" UUID NOT NULL, "userId" UUID NOT NULL, "trophyId" UUID NOT NULL,
  "unlockedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "UserSeasonTrophy_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "SeasonChronicle" (
  "id" UUID NOT NULL, "seasonId" UUID NOT NULL, "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "snapshot" JSONB NOT NULL, CONSTRAINT "SeasonChronicle_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Season_slug_key" ON "Season"("slug");
CREATE UNIQUE INDEX "Season_ordinal_key" ON "Season"("ordinal");
CREATE INDEX "Season_isEnabled_status_startsAt_idx" ON "Season"("isEnabled", "status", "startsAt");
CREATE INDEX "Season_endsAt_idx" ON "Season"("endsAt");
CREATE UNIQUE INDEX "SeasonMembership_seasonId_userId_key" ON "SeasonMembership"("seasonId", "userId");
CREATE INDEX "SeasonMembership_userId_joinedAt_idx" ON "SeasonMembership"("userId", "joinedAt");
CREATE UNIQUE INDEX "SeasonQuestDefinition_seasonId_slug_key" ON "SeasonQuestDefinition"("seasonId", "slug");
CREATE INDEX "SeasonQuestDefinition_seasonId_scope_sortOrder_idx" ON "SeasonQuestDefinition"("seasonId", "scope", "sortOrder");
CREATE UNIQUE INDEX "UserSeasonQuestProgress_userId_questId_key" ON "UserSeasonQuestProgress"("userId", "questId");
CREATE INDEX "UserSeasonQuestProgress_userId_completedAt_idx" ON "UserSeasonQuestProgress"("userId", "completedAt");
CREATE UNIQUE INDEX "SeasonTeamQuestProgress_questId_key" ON "SeasonTeamQuestProgress"("questId");
CREATE UNIQUE INDEX "SeasonExpedition_seasonId_slug_key" ON "SeasonExpedition"("seasonId", "slug");
CREATE INDEX "SeasonExpedition_seasonId_sortOrder_idx" ON "SeasonExpedition"("seasonId", "sortOrder");
CREATE UNIQUE INDEX "SeasonXpEntry_dedupeKey_key" ON "SeasonXpEntry"("dedupeKey");
CREATE INDEX "SeasonXpEntry_seasonId_earnedAt_idx" ON "SeasonXpEntry"("seasonId", "earnedAt");
CREATE INDEX "SeasonXpEntry_seasonId_userId_earnedAt_idx" ON "SeasonXpEntry"("seasonId", "userId", "earnedAt");
CREATE UNIQUE INDEX "SeasonTrophy_seasonId_kind_key" ON "SeasonTrophy"("seasonId", "kind");
CREATE UNIQUE INDEX "SeasonTrophy_seasonId_code_key" ON "SeasonTrophy"("seasonId", "code");
CREATE UNIQUE INDEX "UserSeasonTrophy_userId_trophyId_key" ON "UserSeasonTrophy"("userId", "trophyId");
CREATE INDEX "UserSeasonTrophy_userId_unlockedAt_idx" ON "UserSeasonTrophy"("userId", "unlockedAt");
CREATE UNIQUE INDEX "SeasonChronicle_seasonId_key" ON "SeasonChronicle"("seasonId");

ALTER TABLE "SeasonMembership" ADD CONSTRAINT "SeasonMembership_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SeasonMembership" ADD CONSTRAINT "SeasonMembership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SeasonQuestDefinition" ADD CONSTRAINT "SeasonQuestDefinition_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UserSeasonQuestProgress" ADD CONSTRAINT "UserSeasonQuestProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UserSeasonQuestProgress" ADD CONSTRAINT "UserSeasonQuestProgress_questId_fkey" FOREIGN KEY ("questId") REFERENCES "SeasonQuestDefinition"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SeasonTeamQuestProgress" ADD CONSTRAINT "SeasonTeamQuestProgress_questId_fkey" FOREIGN KEY ("questId") REFERENCES "SeasonQuestDefinition"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SeasonExpedition" ADD CONSTRAINT "SeasonExpedition_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SeasonXpEntry" ADD CONSTRAINT "SeasonXpEntry_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SeasonXpEntry" ADD CONSTRAINT "SeasonXpEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SeasonXpEntry" ADD CONSTRAINT "SeasonXpEntry_serverEventId_fkey" FOREIGN KEY ("serverEventId") REFERENCES "ServerEvent"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "SeasonTrophy" ADD CONSTRAINT "SeasonTrophy_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UserSeasonTrophy" ADD CONSTRAINT "UserSeasonTrophy_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UserSeasonTrophy" ADD CONSTRAINT "UserSeasonTrophy_trophyId_fkey" FOREIGN KEY ("trophyId") REFERENCES "SeasonTrophy"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SeasonChronicle" ADD CONSTRAINT "SeasonChronicle_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE CASCADE ON UPDATE CASCADE;
