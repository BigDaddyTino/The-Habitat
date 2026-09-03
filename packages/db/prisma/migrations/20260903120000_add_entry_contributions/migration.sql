-- Contributor originals (2026-09-03).
--
-- When a member writes something the codex then builds on, the rewrite
-- replaces StoryEntry.body and their words would otherwise be gone. This table
-- keeps the original verbatim, credited to them by their codex name, and the
-- dossier renders it at the foot of the page in a gold-bordered card.
--
-- It is never exported, and the guarantee is structural rather than a filter:
-- the outbound bundle's entry mapper is an explicit allowlist of StoryEntry
-- columns, so a separate table cannot reach it. Keeping this in `body` or
-- `meta` would ship a contributor's private draft to the game build; keeping
-- it in its own table cannot.
--
-- onDelete on the contributor is RESTRICT on purpose: deleting the account
-- must not silently take the credit off the page.

CREATE TABLE "StoryEntryContribution" (
  "id"                UUID         NOT NULL DEFAULT gen_random_uuid(),
  "entryId"           UUID         NOT NULL,
  "contributorUserId" UUID         NOT NULL,
  "label"             VARCHAR(160) NOT NULL,
  "body"              TEXT         NOT NULL,
  "position"          INTEGER      NOT NULL DEFAULT 0,
  "submittedAt"       TIMESTAMP(3) NOT NULL,
  "createdByUserId"   UUID         NOT NULL,
  "createdAt"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"         TIMESTAMP(3) NOT NULL,

  CONSTRAINT "StoryEntryContribution_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "StoryEntryContribution_entryId_position_key" UNIQUE ("entryId", "position"),
  CONSTRAINT "StoryEntryContribution_body_check" CHECK (length(btrim("body")) > 0),

  CONSTRAINT "StoryEntryContribution_entryId_fkey"
    FOREIGN KEY ("entryId") REFERENCES "StoryEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "StoryEntryContribution_contributorUserId_fkey"
    FOREIGN KEY ("contributorUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "StoryEntryContribution_createdByUserId_fkey"
    FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "StoryEntryContribution_contributorUserId_idx" ON "StoryEntryContribution"("contributorUserId");
