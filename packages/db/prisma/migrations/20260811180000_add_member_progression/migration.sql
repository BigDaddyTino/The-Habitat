ALTER TYPE "AchievementRuleType" ADD VALUE 'LEVEL_REACHED';

CREATE TYPE "XpSource" AS ENUM ('VERIFIED_PLAYTIME', 'WEEKLY_QUEST');
CREATE TYPE "WeeklyQuestRuleType" AS ENUM ('PLAY_SECONDS', 'JOIN_COUNT', 'DISTINCT_GAME_COUNT');

CREATE TABLE "UserXpEntry" (
  "id" UUID NOT NULL,
  "userId" UUID NOT NULL,
  "serverEventId" UUID,
  "source" "XpSource" NOT NULL,
  "amount" INTEGER NOT NULL,
  "description" VARCHAR(160) NOT NULL,
  "earnedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "dedupeKey" VARCHAR(220) NOT NULL,
  CONSTRAINT "UserXpEntry_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "WeeklyQuestDefinition" (
  "id" UUID NOT NULL,
  "slug" VARCHAR(80) NOT NULL,
  "name" VARCHAR(100) NOT NULL,
  "description" VARCHAR(240) NOT NULL,
  "ruleType" "WeeklyQuestRuleType" NOT NULL,
  "threshold" INTEGER NOT NULL,
  "xpReward" INTEGER NOT NULL,
  "icon" VARCHAR(40),
  "enabled" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "WeeklyQuestDefinition_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "WeeklyQuestCycle" (
  "id" UUID NOT NULL,
  "weekStart" TIMESTAMP(3) NOT NULL,
  "endsAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "WeeklyQuestCycle_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "WeeklyQuestSelection" (
  "id" UUID NOT NULL,
  "cycleId" UUID NOT NULL,
  "definitionId" UUID NOT NULL,
  "sortOrder" INTEGER NOT NULL,
  CONSTRAINT "WeeklyQuestSelection_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "UserWeeklyQuestProgress" (
  "id" UUID NOT NULL,
  "userId" UUID NOT NULL,
  "selectionId" UUID NOT NULL,
  "progress" INTEGER NOT NULL DEFAULT 0,
  "completedAt" TIMESTAMP(3),
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "UserWeeklyQuestProgress_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "UserXpEntry_dedupeKey_key" ON "UserXpEntry"("dedupeKey");
CREATE INDEX "UserXpEntry_userId_earnedAt_idx" ON "UserXpEntry"("userId", "earnedAt");
CREATE INDEX "UserXpEntry_source_earnedAt_idx" ON "UserXpEntry"("source", "earnedAt");
CREATE UNIQUE INDEX "WeeklyQuestDefinition_slug_key" ON "WeeklyQuestDefinition"("slug");
CREATE UNIQUE INDEX "WeeklyQuestCycle_weekStart_key" ON "WeeklyQuestCycle"("weekStart");
CREATE UNIQUE INDEX "WeeklyQuestSelection_cycleId_definitionId_key" ON "WeeklyQuestSelection"("cycleId", "definitionId");
CREATE INDEX "WeeklyQuestSelection_cycleId_sortOrder_idx" ON "WeeklyQuestSelection"("cycleId", "sortOrder");
CREATE UNIQUE INDEX "UserWeeklyQuestProgress_userId_selectionId_key" ON "UserWeeklyQuestProgress"("userId", "selectionId");
CREATE INDEX "UserWeeklyQuestProgress_userId_completedAt_idx" ON "UserWeeklyQuestProgress"("userId", "completedAt");

ALTER TABLE "UserXpEntry" ADD CONSTRAINT "UserXpEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UserXpEntry" ADD CONSTRAINT "UserXpEntry_serverEventId_fkey" FOREIGN KEY ("serverEventId") REFERENCES "ServerEvent"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "WeeklyQuestSelection" ADD CONSTRAINT "WeeklyQuestSelection_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "WeeklyQuestCycle"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WeeklyQuestSelection" ADD CONSTRAINT "WeeklyQuestSelection_definitionId_fkey" FOREIGN KEY ("definitionId") REFERENCES "WeeklyQuestDefinition"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UserWeeklyQuestProgress" ADD CONSTRAINT "UserWeeklyQuestProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UserWeeklyQuestProgress" ADD CONSTRAINT "UserWeeklyQuestProgress_selectionId_fkey" FOREIGN KEY ("selectionId") REFERENCES "WeeklyQuestSelection"("id") ON DELETE CASCADE ON UPDATE CASCADE;
