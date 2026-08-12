CREATE TYPE "ClubMatchResult" AS ENUM ('WIN', 'LOSS', 'DRAW', 'UNKNOWN');

ALTER TABLE "ClubGameProfile"
  ADD COLUMN "lastAttemptedAt" TIMESTAMP(3),
  ADD COLUMN "nextAttemptAt" TIMESTAMP(3),
  ADD COLUMN "consecutiveFailures" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "providerUpdatedAt" TIMESTAMP(3),
  ADD COLUMN "matchStatus" "ProviderSyncStatus" NOT NULL DEFAULT 'PENDING',
  ADD COLUMN "matchLastAttemptedAt" TIMESTAMP(3),
  ADD COLUMN "matchLastSuccessfulAt" TIMESTAMP(3),
  ADD COLUMN "matchNextAttemptAt" TIMESTAMP(3),
  ADD COLUMN "matchConsecutiveFailures" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "matchSyncError" VARCHAR(180),
  ADD COLUMN "matchCursorOccurredAt" TIMESTAMP(3),
  ADD COLUMN "matchCursorProviderId" VARCHAR(80),
  ADD CONSTRAINT "ClubGameProfile_consecutiveFailures_nonnegative" CHECK ("consecutiveFailures" >= 0),
  ADD CONSTRAINT "ClubGameProfile_matchConsecutiveFailures_nonnegative" CHECK ("matchConsecutiveFailures" >= 0);

CREATE TABLE "ClubGameMatch" (
  "id" UUID NOT NULL,
  "gameType" "ClubGameType" NOT NULL,
  "providerMatchId" VARCHAR(80) NOT NULL,
  "occurredAt" TIMESTAMP(3) NOT NULL,
  "durationSeconds" INTEGER,
  "modeId" VARCHAR(40),
  "modeName" VARCHAR(80),
  "mapId" VARCHAR(40),
  "mapName" VARCHAR(120),
  "seasonKey" VARCHAR(40),
  "source" VARCHAR(40) NOT NULL,
  "providerUpdatedAt" TIMESTAMP(3),
  "ingestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "metadata" JSONB,
  CONSTRAINT "ClubGameMatch_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ClubGameMatch_durationSeconds_nonnegative" CHECK ("durationSeconds" IS NULL OR "durationSeconds" >= 0)
);

CREATE TABLE "ClubGameMatchParticipant" (
  "id" UUID NOT NULL,
  "matchId" UUID NOT NULL,
  "clubGameProfileId" UUID NOT NULL,
  "providerPlayerUid" VARCHAR(32) NOT NULL,
  "result" "ClubMatchResult" NOT NULL DEFAULT 'UNKNOWN',
  "kills" INTEGER,
  "deaths" INTEGER,
  "assists" INTEGER,
  "damage" INTEGER,
  "healing" INTEGER,
  "damageTaken" INTEGER,
  "score" DOUBLE PRECISION,
  "scoreChange" INTEGER,
  "mvp" BOOLEAN NOT NULL DEFAULT false,
  "svp" BOOLEAN NOT NULL DEFAULT false,
  "disconnected" BOOLEAN,
  "metadata" JSONB,
  CONSTRAINT "ClubGameMatchParticipant_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ClubGameMatchParticipant_stats_nonnegative" CHECK (("kills" IS NULL OR "kills" >= 0) AND ("deaths" IS NULL OR "deaths" >= 0) AND ("assists" IS NULL OR "assists" >= 0) AND ("damage" IS NULL OR "damage" >= 0) AND ("healing" IS NULL OR "healing" >= 0) AND ("damageTaken" IS NULL OR "damageTaken" >= 0))
);

CREATE TABLE "ClubGameMatchHeroPerformance" (
  "id" UUID NOT NULL,
  "participantId" UUID NOT NULL,
  "providerHeroId" VARCHAR(40) NOT NULL,
  "heroName" VARCHAR(100) NOT NULL,
  "playtimeSeconds" INTEGER,
  "kills" INTEGER,
  "deaths" INTEGER,
  "assists" INTEGER,
  "damage" INTEGER,
  "healing" INTEGER,
  "damageTaken" INTEGER,
  "metadata" JSONB,
  CONSTRAINT "ClubGameMatchHeroPerformance_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ClubGameMatchHeroPerformance_stats_nonnegative" CHECK (("playtimeSeconds" IS NULL OR "playtimeSeconds" >= 0) AND ("kills" IS NULL OR "kills" >= 0) AND ("deaths" IS NULL OR "deaths" >= 0) AND ("assists" IS NULL OR "assists" >= 0) AND ("damage" IS NULL OR "damage" >= 0) AND ("healing" IS NULL OR "healing" >= 0) AND ("damageTaken" IS NULL OR "damageTaken" >= 0))
);

CREATE INDEX "ClubGameProfile_gameType_nextAttemptAt_idx" ON "ClubGameProfile"("gameType", "nextAttemptAt");
CREATE INDEX "ClubGameProfile_gameType_matchNextAttemptAt_idx" ON "ClubGameProfile"("gameType", "matchNextAttemptAt");
CREATE UNIQUE INDEX "ClubGameMatch_gameType_providerMatchId_key" ON "ClubGameMatch"("gameType", "providerMatchId");
CREATE INDEX "ClubGameMatch_gameType_occurredAt_idx" ON "ClubGameMatch"("gameType", "occurredAt");
CREATE UNIQUE INDEX "ClubGameMatchParticipant_matchId_clubGameProfileId_key" ON "ClubGameMatchParticipant"("matchId", "clubGameProfileId");
CREATE INDEX "ClubGameMatchParticipant_clubGameProfileId_matchId_idx" ON "ClubGameMatchParticipant"("clubGameProfileId", "matchId");
CREATE UNIQUE INDEX "ClubGameMatchHeroPerformance_participantId_providerHeroId_key" ON "ClubGameMatchHeroPerformance"("participantId", "providerHeroId");
CREATE INDEX "ClubGameMatchHeroPerformance_providerHeroId_idx" ON "ClubGameMatchHeroPerformance"("providerHeroId");

ALTER TABLE "ClubGameMatchParticipant" ADD CONSTRAINT "ClubGameMatchParticipant_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "ClubGameMatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ClubGameMatchParticipant" ADD CONSTRAINT "ClubGameMatchParticipant_clubGameProfileId_fkey" FOREIGN KEY ("clubGameProfileId") REFERENCES "ClubGameProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ClubGameMatchHeroPerformance" ADD CONSTRAINT "ClubGameMatchHeroPerformance_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "ClubGameMatchParticipant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- New match-history evidence must remain private until each member opts in.
ALTER TABLE "ClubGameProfile" ALTER COLUMN "displayPublic" SET DEFAULT false;
UPDATE "ClubGameProfile" SET "displayPublic" = false;
