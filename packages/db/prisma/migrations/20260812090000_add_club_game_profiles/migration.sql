CREATE TYPE "ClubGameType" AS ENUM ('MARVEL_RIVALS');
CREATE TYPE "ClubProfileSyncStatus" AS ENUM ('READY', 'PRIVATE', 'ERROR');

CREATE TABLE "ClubGameProfile" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "gameType" "ClubGameType" NOT NULL,
    "providerUid" VARCHAR(32) NOT NULL,
    "displayName" VARCHAR(80) NOT NULL,
    "platform" VARCHAR(24) NOT NULL DEFAULT 'PC',
    "displayPublic" BOOLEAN NOT NULL DEFAULT true,
    "connectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSyncedAt" TIMESTAMP(3),
    "syncStatus" "ClubProfileSyncStatus" NOT NULL DEFAULT 'READY',
    "syncError" VARCHAR(180),
    "playerLevel" INTEGER,
    "rankName" VARCHAR(40),
    "peakRankName" VARCHAR(40),
    "rankScore" INTEGER,
    "totalMatches" INTEGER,
    "totalWins" INTEGER,
    "overallKd" DOUBLE PRECISION,
    "overallKda" DOUBLE PRECISION,
    "topHeroes" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ClubGameProfile_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ClubGameStatSnapshot" (
    "id" UUID NOT NULL,
    "profileId" UUID NOT NULL,
    "sampleKey" VARCHAR(96) NOT NULL,
    "sampledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "source" VARCHAR(40) NOT NULL,
    "rankName" VARCHAR(40),
    "rankScore" INTEGER,
    "totalMatches" INTEGER,
    "totalWins" INTEGER,
    "overallKd" DOUBLE PRECISION,
    "overallKda" DOUBLE PRECISION,
    "topHeroes" JSONB,
    CONSTRAINT "ClubGameStatSnapshot_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ClubGameProfile_userId_gameType_key" ON "ClubGameProfile"("userId", "gameType");
CREATE UNIQUE INDEX "ClubGameProfile_gameType_providerUid_key" ON "ClubGameProfile"("gameType", "providerUid");
CREATE INDEX "ClubGameProfile_gameType_rankScore_idx" ON "ClubGameProfile"("gameType", "rankScore");
CREATE INDEX "ClubGameProfile_gameType_lastSyncedAt_idx" ON "ClubGameProfile"("gameType", "lastSyncedAt");
CREATE UNIQUE INDEX "ClubGameStatSnapshot_sampleKey_key" ON "ClubGameStatSnapshot"("sampleKey");
CREATE INDEX "ClubGameStatSnapshot_profileId_sampledAt_idx" ON "ClubGameStatSnapshot"("profileId", "sampledAt");

ALTER TABLE "ClubGameProfile" ADD CONSTRAINT "ClubGameProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ClubGameStatSnapshot" ADD CONSTRAINT "ClubGameStatSnapshot_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "ClubGameProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
