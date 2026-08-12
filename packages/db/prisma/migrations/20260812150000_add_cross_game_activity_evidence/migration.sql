ALTER TYPE "AchievementRuleType" ADD VALUE 'ACTIVITY_COUNT';
ALTER TYPE "AchievementRuleType" ADD VALUE 'ACTIVITY_VALUE_SUM';
ALTER TYPE "AchievementRuleType" ADD VALUE 'DISTINCT_ACTIVITY_GAME_COUNT';
ALTER TYPE "AchievementRuleType" ADD VALUE 'ORDERED_ACTIVITY_STREAK';
ALTER TYPE "AchievementRuleType" ADD VALUE 'SHARED_ACTIVITY_COUNT';
ALTER TYPE "AchievementRuleType" ADD VALUE 'ACTIVITY_STAT_THRESHOLD';

ALTER TYPE "RecordRuleType" ADD VALUE 'ACTIVITY_COUNT';
ALTER TYPE "RecordRuleType" ADD VALUE 'ACTIVITY_VALUE_SUM';
ALTER TYPE "RecordRuleType" ADD VALUE 'ACTIVITY_DISTINCT_GAME_COUNT';
CREATE TYPE "RecordComparison" AS ENUM ('MAX', 'MIN');

ALTER TABLE "AchievementDefinition" ADD COLUMN "gameKey" VARCHAR(40);
ALTER TABLE "AchievementDefinition" ADD CONSTRAINT "AchievementDefinition_one_game_scope" CHECK (NOT ("gameType" IS NOT NULL AND "gameKey" IS NOT NULL));

ALTER TABLE "RecordDefinition"
  ADD COLUMN "gameKey" VARCHAR(40),
  ADD COLUMN "comparison" "RecordComparison" NOT NULL DEFAULT 'MAX',
  ADD COLUMN "minimumSampleSize" INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN "seasonScope" VARCHAR(40),
  ADD CONSTRAINT "RecordDefinition_one_game_scope" CHECK (NOT ("gameType" IS NOT NULL AND "gameKey" IS NOT NULL)),
  ADD CONSTRAINT "RecordDefinition_minimumSampleSize_positive" CHECK ("minimumSampleSize" >= 1);

CREATE TABLE "GameActivity" (
  "id" UUID NOT NULL,
  "userId" UUID NOT NULL,
  "gameKey" VARCHAR(40) NOT NULL,
  "activityType" VARCHAR(60) NOT NULL,
  "occurredAt" TIMESTAMP(3) NOT NULL,
  "source" VARCHAR(40) NOT NULL,
  "sourceConfidence" INTEGER NOT NULL DEFAULT 100,
  "valueNumber" DOUBLE PRECISION,
  "valueText" VARCHAR(200),
  "metadata" JSONB,
  "sourceServerEventId" UUID,
  "sourceClubMatchParticipantId" UUID,
  "providerEventId" VARCHAR(120),
  "dedupeKey" VARCHAR(220) NOT NULL,
  "chroniclePromotedAt" TIMESTAMP(3),
  "chronicleHeadline" VARCHAR(180),
  "chronicleSummary" VARCHAR(500),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "GameActivity_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "GameActivity_gameKey_allowed" CHECK ("gameKey" IN ('SEVEN_DAYS_TO_DIE','PROJECT_ZOMBOID','DRAGONWILDS','ENSHROUDED','PALWORLD','VALHEIM','MARVEL_RIVALS')),
  CONSTRAINT "GameActivity_activityType_allowed" CHECK ("activityType" IN ('SESSION_STARTED','MATCH_PLAYED','MATCH_WON','MATCH_LOST','MATCH_DRAWN','KILLS_RECORDED','DEATHS_RECORDED','ASSISTS_RECORDED','MVP_EARNED','SVP_EARNED','SHARED_MATCH_PLAYED','BOSS_KILLED','RATING_CHANGED')),
  CONSTRAINT "GameActivity_sourceConfidence_range" CHECK ("sourceConfidence" >= 0 AND "sourceConfidence" <= 100),
  CONSTRAINT "GameActivity_exactly_one_evidence" CHECK ((CASE WHEN "sourceServerEventId" IS NULL THEN 0 ELSE 1 END + CASE WHEN "sourceClubMatchParticipantId" IS NULL THEN 0 ELSE 1 END) = 1),
  CONSTRAINT "GameActivity_chronicle_promotion_complete" CHECK ("chroniclePromotedAt" IS NULL OR "chronicleHeadline" IS NOT NULL)
);

CREATE UNIQUE INDEX "GameActivity_dedupeKey_key" ON "GameActivity"("dedupeKey");
CREATE INDEX "GameActivity_userId_activityType_occurredAt_idx" ON "GameActivity"("userId", "activityType", "occurredAt");
CREATE INDEX "GameActivity_gameKey_activityType_occurredAt_idx" ON "GameActivity"("gameKey", "activityType", "occurredAt");
CREATE INDEX "GameActivity_sourceServerEventId_idx" ON "GameActivity"("sourceServerEventId");
CREATE INDEX "GameActivity_sourceClubMatchParticipantId_idx" ON "GameActivity"("sourceClubMatchParticipantId");
CREATE INDEX "GameActivity_chroniclePromotedAt_occurredAt_idx" ON "GameActivity"("chroniclePromotedAt", "occurredAt");

ALTER TABLE "GameActivity" ADD CONSTRAINT "GameActivity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GameActivity" ADD CONSTRAINT "GameActivity_sourceServerEventId_fkey" FOREIGN KEY ("sourceServerEventId") REFERENCES "ServerEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GameActivity" ADD CONSTRAINT "GameActivity_sourceClubMatchParticipantId_fkey" FOREIGN KEY ("sourceClubMatchParticipantId") REFERENCES "ClubGameMatchParticipant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PlayerAchievement"
  ADD COLUMN "sourceActivityId" UUID,
  ADD CONSTRAINT "PlayerAchievement_one_source" CHECK (NOT ("sourceEventId" IS NOT NULL AND "sourceActivityId" IS NOT NULL));
CREATE INDEX "PlayerAchievement_sourceActivityId_idx" ON "PlayerAchievement"("sourceActivityId");
ALTER TABLE "PlayerAchievement" ADD CONSTRAINT "PlayerAchievement_sourceActivityId_fkey" FOREIGN KEY ("sourceActivityId") REFERENCES "GameActivity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Provider-derived reward inventory cannot outlive the award evidence it came from.
ALTER TABLE "UserAchievementReward" DROP CONSTRAINT "UserAchievementReward_playerAchievementId_fkey";
ALTER TABLE "UserAchievementReward" ADD CONSTRAINT "UserAchievementReward_playerAchievementId_fkey" FOREIGN KEY ("playerAchievementId") REFERENCES "PlayerAchievement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "RecordHolder" DROP CONSTRAINT "RecordHolder_playerIdentityId_fkey";
ALTER TABLE "RecordHolder"
  ALTER COLUMN "playerIdentityId" DROP NOT NULL,
  ALTER COLUMN "sourceEventId" DROP NOT NULL,
  ADD COLUMN "sourceActivityId" UUID,
  ADD CONSTRAINT "RecordHolder_one_evidence" CHECK ((CASE WHEN "sourceEventId" IS NULL THEN 0 ELSE 1 END + CASE WHEN "sourceActivityId" IS NULL THEN 0 ELSE 1 END) = 1);
ALTER TABLE "RecordHolder" ADD CONSTRAINT "RecordHolder_playerIdentityId_fkey" FOREIGN KEY ("playerIdentityId") REFERENCES "PlayerIdentity"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "RecordHolder" ADD CONSTRAINT "RecordHolder_sourceActivityId_fkey" FOREIGN KEY ("sourceActivityId") REFERENCES "GameActivity"("id") ON DELETE CASCADE ON UPDATE CASCADE;
CREATE INDEX "RecordHolder_sourceActivityId_idx" ON "RecordHolder"("sourceActivityId");

ALTER TABLE "RecordHistory" DROP CONSTRAINT "RecordHistory_playerIdentityId_fkey";
ALTER TABLE "RecordHistory"
  ALTER COLUMN "playerIdentityId" DROP NOT NULL,
  ALTER COLUMN "sourceEventId" DROP NOT NULL,
  ADD COLUMN "sourceActivityId" UUID,
  ADD CONSTRAINT "RecordHistory_one_evidence" CHECK ((CASE WHEN "sourceEventId" IS NULL THEN 0 ELSE 1 END + CASE WHEN "sourceActivityId" IS NULL THEN 0 ELSE 1 END) = 1);
ALTER TABLE "RecordHistory" ADD CONSTRAINT "RecordHistory_playerIdentityId_fkey" FOREIGN KEY ("playerIdentityId") REFERENCES "PlayerIdentity"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "RecordHistory" ADD CONSTRAINT "RecordHistory_sourceActivityId_fkey" FOREIGN KEY ("sourceActivityId") REFERENCES "GameActivity"("id") ON DELETE CASCADE ON UPDATE CASCADE;
CREATE INDEX "RecordHistory_sourceActivityId_idx" ON "RecordHistory"("sourceActivityId");

ALTER TABLE "DiscordNotification" ADD COLUMN "gameActivityId" UUID;
ALTER TABLE "DiscordNotification" ADD CONSTRAINT "DiscordNotification_at_most_one_evidence" CHECK (NOT ("serverEventId" IS NOT NULL AND "gameActivityId" IS NOT NULL));
ALTER TABLE "DiscordNotification" ADD CONSTRAINT "DiscordNotification_gameActivityId_fkey" FOREIGN KEY ("gameActivityId") REFERENCES "GameActivity"("id") ON DELETE CASCADE ON UPDATE CASCADE;
CREATE INDEX "DiscordNotification_gameActivityId_idx" ON "DiscordNotification"("gameActivityId");
