-- Contributors who are not members (2026-09-04).
--
-- The house law says a contributor's original stays on the dossier, credited,
-- verbatim. It did not say the contributor has to have a login, and the second
-- creature design the codex received came from a child with no account and no
-- reason to ever have one.
--
-- The wrong fix is a fake User row: it puts a person who cannot consent into
-- the auth table, gives them a password reset path and a session surface, and
-- makes every "list the members" query wrong forever. Credit is not identity.
--
-- So: exactly one of the two credit columns is set, enforced in the database
-- rather than in a script that a later script can forget to imitate.
--
--   contributorUserId  the contributor is a member  -> the card renders their codex name
--   contributorName    the contributor is not       -> the card renders this, verbatim
--
-- Nothing about the export guarantee changes. This is still a separate table,
-- and the outbound bundle's entry mapper is still an explicit allowlist of
-- StoryEntry columns, so it still cannot reach a game build.

ALTER TABLE "StoryEntryContribution"
  ALTER COLUMN "contributorUserId" DROP NOT NULL;

ALTER TABLE "StoryEntryContribution"
  ADD COLUMN "contributorName" VARCHAR(120);

-- Exactly one. Not zero (an uncredited original is the thing this table exists
-- to prevent) and not both (two names on one card is an argument waiting to
-- happen about which one is the author).
ALTER TABLE "StoryEntryContribution"
  ADD CONSTRAINT "StoryEntryContribution_one_credit_check"
  CHECK (num_nonnulls("contributorUserId", "contributorName") = 1);

-- A blank string is not a credit.
ALTER TABLE "StoryEntryContribution"
  ADD CONSTRAINT "StoryEntryContribution_contributorName_check"
  CHECK ("contributorName" IS NULL OR length(btrim("contributorName")) > 0);
