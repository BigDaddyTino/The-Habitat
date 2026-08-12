-- Per-season competitive records (wins, peak rating) survive on the provider
-- even when it holds no career overview at all. They are stored separately from
-- the career aggregates so a partial provider record is never presented as a
-- complete one, and so an absent career overview stays NULL instead of zero.
ALTER TABLE "ClubGameProfile" ADD COLUMN "peakRankScore" INTEGER;
ALTER TABLE "ClubGameProfile" ADD COLUMN "rankedWins" INTEGER;
ALTER TABLE "ClubGameProfile" ADD COLUMN "rankedSeasons" INTEGER;

-- Cumulative columns previously received a literal 0 whenever the provider
-- answered with an empty career. Those zeros are indistinguishable from real
-- records of zero, so clear them only where the provider also reported no
-- supporting evidence: no rating, no matches, and no tracked participation.
UPDATE "ClubGameProfile" profile
SET "totalMatches" = NULL, "totalWins" = NULL
WHERE profile."totalMatches" = 0
  AND profile."totalWins" = 0
  AND profile."overallKd" IS NULL
  AND profile."overallKda" IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM "ClubGameMatchParticipant" participant
    WHERE participant."clubGameProfileId" = profile."id"
  );
