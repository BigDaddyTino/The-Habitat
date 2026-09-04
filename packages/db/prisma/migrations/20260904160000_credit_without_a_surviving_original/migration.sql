-- Credit without a surviving original (2026-09-04).
--
-- The gold card was built to preserve a contributor's own words. It turns out
-- there is a second case, and the owner ruled on it the day it came up: a
-- member designs something, the codex builds on it, and nobody kept what they
-- actually wrote. The words are gone. The authorship is not.
--
-- The wrong fix is to put the codex's prose in the box under their name. That
-- is the one thing this table exists to prevent, and the card's own footer
-- ("written by X and kept here whole") would become a lie.
--
-- So `body` becomes optional, and a row with no body is a CREDIT rather than a
-- contribution: same gold, same name, same weight on the page, and a card that
-- says plainly that the original wording was not kept instead of substituting
-- something that was never theirs.
--
--   body IS NOT NULL  -> their words, verbatim, never edited
--   body IS NULL      -> their design, credited, and the record says the
--                        original is missing rather than pretending otherwise
--
-- Credit does not require a surviving artifact.

ALTER TABLE "StoryEntryContribution"
  ALTER COLUMN "body" DROP NOT NULL;

-- The old CHECK required a non-empty body on every row. Keep exactly that
-- guarantee for rows that have one — a blank body is still not a submission —
-- while allowing the absence to be deliberate.
ALTER TABLE "StoryEntryContribution"
  DROP CONSTRAINT "StoryEntryContribution_body_check";

ALTER TABLE "StoryEntryContribution"
  ADD CONSTRAINT "StoryEntryContribution_body_check"
  CHECK ("body" IS NULL OR length(btrim("body")) > 0);
