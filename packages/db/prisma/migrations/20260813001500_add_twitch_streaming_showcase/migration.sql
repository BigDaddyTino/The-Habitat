-- Streaming showcase. Twitch is the authoritative source of live state and is
-- only ever reached for channels a member verified through OAuth, so a typed-in
-- handle can never place someone else's channel on the showcase. Discord
-- streaming presence is recorded separately because it proves only that a member
-- is broadcasting, never where to.

CREATE TYPE "DiscordStreamKind" AS ENUM ('PRESENCE_ACTIVITY', 'VOICE_GO_LIVE');

ALTER TYPE "DiscordNotificationKind" ADD VALUE 'STREAM_WENT_LIVE';

CREATE TABLE "TwitchChannel" (
  "id" UUID NOT NULL,
  "socialAccountId" UUID NOT NULL,
  "userId" UUID NOT NULL,
  "twitchUserId" VARCHAR(40) NOT NULL,
  "login" VARCHAR(40) NOT NULL,
  "displayName" VARCHAR(80) NOT NULL,
  "profileImageUrl" VARCHAR(500),
  "offlineImageUrl" VARCHAR(500),
  "broadcasterType" VARCHAR(20),
  "channelDescription" VARCHAR(500),
  "showcaseEnabled" BOOLEAN NOT NULL DEFAULT false,
  "connectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "isLive" BOOLEAN NOT NULL DEFAULT false,
  "liveSince" TIMESTAMP(3),
  "currentStreamId" VARCHAR(40),
  "currentTitle" VARCHAR(200),
  "currentGameName" VARCHAR(120),
  "currentViewerCount" INTEGER,
  "thumbnailUrlTemplate" VARCHAR(500),
  "lastLiveAt" TIMESTAMP(3),
  "followerCount" INTEGER,
  "syncStatus" "ProviderSyncStatus" NOT NULL DEFAULT 'PENDING',
  "syncError" VARCHAR(180),
  "lastSyncedAt" TIMESTAMP(3),
  "lastAttemptedAt" TIMESTAMP(3),
  "metadataNextAttemptAt" TIMESTAMP(3),
  "consecutiveFailures" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "TwitchChannel_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "TwitchChannel_socialAccountId_key" ON "TwitchChannel"("socialAccountId");
CREATE UNIQUE INDEX "TwitchChannel_userId_key" ON "TwitchChannel"("userId");
CREATE UNIQUE INDEX "TwitchChannel_twitchUserId_key" ON "TwitchChannel"("twitchUserId");
CREATE INDEX "TwitchChannel_showcaseEnabled_isLive_idx" ON "TwitchChannel"("showcaseEnabled", "isLive");
CREATE INDEX "TwitchChannel_isLive_currentViewerCount_idx" ON "TwitchChannel"("isLive", "currentViewerCount");
CREATE INDEX "TwitchChannel_showcaseEnabled_lastLiveAt_idx" ON "TwitchChannel"("showcaseEnabled", "lastLiveAt");

ALTER TABLE "TwitchChannel"
ADD CONSTRAINT "TwitchChannel_socialAccountId_fkey"
FOREIGN KEY ("socialAccountId") REFERENCES "UserSocialAccount"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TwitchChannel"
ADD CONSTRAINT "TwitchChannel_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

-- A channel may only advertise a live viewer count while it is actually live,
-- so an offline row can never keep a stale audience number on the showcase.
ALTER TABLE "TwitchChannel"
ADD CONSTRAINT "TwitchChannel_offline_has_no_live_facts"
CHECK (
  "isLive"
  OR ("currentStreamId" IS NULL AND "currentViewerCount" IS NULL AND "liveSince" IS NULL)
);

CREATE TABLE "StreamSession" (
  "id" UUID NOT NULL,
  "channelId" UUID NOT NULL,
  "providerStreamId" VARCHAR(40) NOT NULL,
  "title" VARCHAR(200),
  "gameName" VARCHAR(120),
  "startedAt" TIMESTAMP(3) NOT NULL,
  "endedAt" TIMESTAMP(3),
  "lastObservedAt" TIMESTAMP(3) NOT NULL,
  "peakViewerCount" INTEGER,
  "observationCount" INTEGER NOT NULL DEFAULT 1,
  "thumbnailUrl" VARCHAR(500),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "StreamSession_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "StreamSession_channelId_providerStreamId_key" ON "StreamSession"("channelId", "providerStreamId");
CREATE INDEX "StreamSession_channelId_startedAt_idx" ON "StreamSession"("channelId", "startedAt");
CREATE INDEX "StreamSession_endedAt_startedAt_idx" ON "StreamSession"("endedAt", "startedAt");

ALTER TABLE "StreamSession"
ADD CONSTRAINT "StreamSession_channelId_fkey"
FOREIGN KEY ("channelId") REFERENCES "TwitchChannel"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

-- Observed broadcasts cannot end before they began, and a negative audience is
-- never a real observation.
ALTER TABLE "StreamSession"
ADD CONSTRAINT "StreamSession_ends_after_start"
CHECK ("endedAt" IS NULL OR "endedAt" >= "startedAt");

ALTER TABLE "StreamSession"
ADD CONSTRAINT "StreamSession_peak_viewers_nonnegative"
CHECK ("peakViewerCount" IS NULL OR "peakViewerCount" >= 0);

CREATE TABLE "DiscordStreamSignal" (
  "id" UUID NOT NULL,
  "userId" UUID NOT NULL,
  "kind" "DiscordStreamKind" NOT NULL,
  "streaming" BOOLEAN NOT NULL DEFAULT false,
  "streamUrl" VARCHAR(300),
  "activityName" VARCHAR(120),
  "activityDetail" VARCHAR(200),
  "guildId" VARCHAR(40),
  "channelId" VARCHAR(40),
  "channelName" VARCHAR(120),
  "startedAt" TIMESTAMP(3),
  "observedAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "DiscordStreamSignal_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "DiscordStreamSignal_userId_key" ON "DiscordStreamSignal"("userId");
CREATE INDEX "DiscordStreamSignal_streaming_observedAt_idx" ON "DiscordStreamSignal"("streaming", "observedAt");

ALTER TABLE "DiscordStreamSignal"
ADD CONSTRAINT "DiscordStreamSignal_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "TwitchLinkNonce" (
  "id" UUID NOT NULL,
  "userId" UUID NOT NULL,
  "stateHash" VARCHAR(64) NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "consumedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "TwitchLinkNonce_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "TwitchLinkNonce_stateHash_key" ON "TwitchLinkNonce"("stateHash");
CREATE INDEX "TwitchLinkNonce_userId_expiresAt_idx" ON "TwitchLinkNonce"("userId", "expiresAt");

ALTER TABLE "TwitchLinkNonce"
ADD CONSTRAINT "TwitchLinkNonce_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
