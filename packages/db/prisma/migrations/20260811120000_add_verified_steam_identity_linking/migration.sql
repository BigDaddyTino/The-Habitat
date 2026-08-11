ALTER TABLE "PlayerIdentity"
  ADD COLUMN "externalProvider" "SocialPlatform",
  ADD COLUMN "externalAccountId" VARCHAR(80);

ALTER TABLE "UserSocialAccount"
  ADD COLUMN "providerAccountId" VARCHAR(80),
  ADD COLUMN "verifiedAt" TIMESTAMP(3);

CREATE TABLE "SteamLinkNonce" (
  "id" UUID NOT NULL,
  "userId" UUID NOT NULL,
  "stateHash" VARCHAR(64) NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "consumedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SteamLinkNonce_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "PlayerIdentity_externalProvider_externalAccountId_idx" ON "PlayerIdentity"("externalProvider", "externalAccountId");
CREATE UNIQUE INDEX "UserSocialAccount_platform_providerAccountId_key" ON "UserSocialAccount"("platform", "providerAccountId");
CREATE UNIQUE INDEX "SteamLinkNonce_stateHash_key" ON "SteamLinkNonce"("stateHash");
CREATE INDEX "SteamLinkNonce_userId_expiresAt_idx" ON "SteamLinkNonce"("userId", "expiresAt");

ALTER TABLE "SteamLinkNonce" ADD CONSTRAINT "SteamLinkNonce_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
