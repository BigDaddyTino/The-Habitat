-- Seasonal trophies become earned rather than granted for enrolling. Existing
-- rows adopt the default season XP bar through the column default; no
-- membership, XP entry, prior trophy, or lifetime record is read or rewritten
-- here. Zero disables the bar for a season that wants none.
ALTER TABLE "Season" ADD COLUMN "trophyXpRequirement" INTEGER NOT NULL DEFAULT 1500;
ALTER TABLE "Season" ADD CONSTRAINT "Season_trophy_requirement_nonnegative" CHECK ("trophyXpRequirement" >= 0);
