CREATE TYPE "ProviderSyncStatus" AS ENUM ('PENDING', 'READY', 'PRIVATE', 'ERROR');

CREATE TABLE "SteamProfile" (
    "id" UUID NOT NULL,
    "socialAccountId" UUID NOT NULL,
    "enrichmentEnabledAt" TIMESTAMP(3) NOT NULL,
    "displayPublic" BOOLEAN NOT NULL DEFAULT false,
    "personaName" VARCHAR(80),
    "profileUrl" VARCHAR(300),
    "avatarUrl" VARCHAR(500),
    "avatarMediumUrl" VARCHAR(500),
    "avatarFullUrl" VARCHAR(500),
    "communityVisibilityState" INTEGER,
    "profileState" INTEGER,
    "steamCreatedAt" TIMESTAMP(3),
    "lastLogoffAt" TIMESTAMP(3),
    "currentGameAppId" INTEGER,
    "currentGameName" VARCHAR(160),
    "profileStatus" "ProviderSyncStatus" NOT NULL DEFAULT 'PENDING',
    "profileLastAttemptedAt" TIMESTAMP(3),
    "profileLastSuccessfulAt" TIMESTAMP(3),
    "profileNextAttemptAt" TIMESTAMP(3),
    "profileConsecutiveFailures" INTEGER NOT NULL DEFAULT 0,
    "profileSyncError" VARCHAR(180),
    "libraryStatus" "ProviderSyncStatus" NOT NULL DEFAULT 'PENDING',
    "libraryLastAttemptedAt" TIMESTAMP(3),
    "libraryLastSuccessfulAt" TIMESTAMP(3),
    "libraryNextAttemptAt" TIMESTAMP(3),
    "libraryConsecutiveFailures" INTEGER NOT NULL DEFAULT 0,
    "librarySyncError" VARCHAR(180),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "SteamProfile_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "SteamProfile_profileConsecutiveFailures_nonnegative" CHECK ("profileConsecutiveFailures" >= 0),
    CONSTRAINT "SteamProfile_libraryConsecutiveFailures_nonnegative" CHECK ("libraryConsecutiveFailures" >= 0)
);

CREATE TABLE "SteamApp" (
    "appId" INTEGER NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "iconHash" VARCHAR(100),
    "metadataSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "SteamApp_pkey" PRIMARY KEY ("appId")
);

CREATE TABLE "SteamLibraryGame" (
    "id" UUID NOT NULL,
    "steamProfileId" UUID NOT NULL,
    "steamAppId" INTEGER NOT NULL,
    "playtimeMinutes" INTEGER NOT NULL DEFAULT 0,
    "playtimeTwoWeeksMinutes" INTEGER,
    "lastPlayedAt" TIMESTAMP(3),
    "lastSeenAt" TIMESTAMP(3) NOT NULL,
    "isCurrent" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "SteamLibraryGame_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "SteamLibraryGame_playtimeMinutes_nonnegative" CHECK ("playtimeMinutes" >= 0),
    CONSTRAINT "SteamLibraryGame_playtimeTwoWeeksMinutes_nonnegative" CHECK ("playtimeTwoWeeksMinutes" IS NULL OR "playtimeTwoWeeksMinutes" >= 0)
);

CREATE UNIQUE INDEX "SteamProfile_socialAccountId_key" ON "SteamProfile"("socialAccountId");
CREATE INDEX "SteamProfile_profileNextAttemptAt_idx" ON "SteamProfile"("profileNextAttemptAt");
CREATE INDEX "SteamProfile_libraryNextAttemptAt_idx" ON "SteamProfile"("libraryNextAttemptAt");
CREATE UNIQUE INDEX "SteamLibraryGame_steamProfileId_steamAppId_key" ON "SteamLibraryGame"("steamProfileId", "steamAppId");
CREATE INDEX "SteamLibraryGame_steamProfileId_isCurrent_playtimeMinutes_idx" ON "SteamLibraryGame"("steamProfileId", "isCurrent", "playtimeMinutes");
CREATE INDEX "SteamLibraryGame_steamProfileId_lastPlayedAt_idx" ON "SteamLibraryGame"("steamProfileId", "lastPlayedAt");

ALTER TABLE "SteamProfile" ADD CONSTRAINT "SteamProfile_socialAccountId_fkey" FOREIGN KEY ("socialAccountId") REFERENCES "UserSocialAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SteamLibraryGame" ADD CONSTRAINT "SteamLibraryGame_steamProfileId_fkey" FOREIGN KEY ("steamProfileId") REFERENCES "SteamProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SteamLibraryGame" ADD CONSTRAINT "SteamLibraryGame_steamAppId_fkey" FOREIGN KEY ("steamAppId") REFERENCES "SteamApp"("appId") ON DELETE RESTRICT ON UPDATE CASCADE;
