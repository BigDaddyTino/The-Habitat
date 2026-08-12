-- Squad-board occupancy used to be an implicit side effect of making a profile
-- public, which seated members who only meant to share their stats. Seats now
-- require an explicit claim, so the column starts NULL for everyone: no existing
-- member is back-filled into a seat they never asked for.
ALTER TABLE "ClubGameProfile" ADD COLUMN "rosterSeatClaimedAt" TIMESTAMP(3);

CREATE INDEX "ClubGameProfile_gameType_rosterSeatClaimedAt_idx"
  ON "ClubGameProfile"("gameType", "rosterSeatClaimedAt");

ALTER TYPE "ClubProfileSyncStatus" ADD VALUE 'NO_PROVIDER_DATA';
