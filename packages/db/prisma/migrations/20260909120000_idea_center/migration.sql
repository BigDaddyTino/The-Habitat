-- The Idea Center (2026-09-09).
--
-- The owner's brief: one page on the codex where the whole family can put an
-- idea down — story, systems, models, regions, characters, or several at
-- once — with pictures and files attached, and find it again. Story Threads
-- was that page for stories only; it becomes one category of this one.
--
-- An idea IS a THREAD entry. Nothing about the thread machinery changes —
-- statuses, canon packets, comments, revisions, the connection web all stay —
-- so this migration adds only what threads never had:
--
--   1. two meta keys on every THREAD row (`facets`, `sections`), backfilled
--      empty here because the sheet schema requires them and a stored row
--      missing a required key is refused on its next save;
--   2. attachments — pictures and files on an entry, stored on disk outside
--      the build output and served through an auth-gated route;
--   3. bookmarks — a member's "Saved" list, one row per (member, entry).

UPDATE "StoryEntry"
SET "meta" = COALESCE("meta", '{}'::jsonb)
  || CASE WHEN COALESCE("meta", '{}'::jsonb) ? 'facets' THEN '{}'::jsonb ELSE '{"facets": []}'::jsonb END
  || CASE WHEN COALESCE("meta", '{}'::jsonb) ? 'sections' THEN '{}'::jsonb ELSE '{"sections": []}'::jsonb END
WHERE "kind" = 'THREAD';

CREATE TABLE "StoryEntryAttachment" (
  "id"               UUID NOT NULL,
  "entryId"          UUID NOT NULL,
  -- The name the member gave the file, shown as its label. Never used on disk.
  "fileName"         VARCHAR(200) NOT NULL,
  -- The name on disk: a UUID plus a vetted extension. The only way in.
  "storedName"       VARCHAR(80) NOT NULL,
  "contentType"      VARCHAR(80) NOT NULL,
  "bytes"            INTEGER NOT NULL,
  "sha256"           CHAR(64) NOT NULL,
  "caption"          VARCHAR(300),
  "uploadedByUserId" UUID NOT NULL,
  "createdAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "StoryEntryAttachment_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "StoryEntryAttachment_storedName_key" UNIQUE ("storedName"),
  CONSTRAINT "StoryEntryAttachment_bytes_check" CHECK ("bytes" > 0),
  CONSTRAINT "StoryEntryAttachment_fileName_check" CHECK (length(btrim("fileName")) > 0),
  CONSTRAINT "StoryEntryAttachment_entryId_fkey" FOREIGN KEY ("entryId") REFERENCES "StoryEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "StoryEntryAttachment_uploadedByUserId_fkey" FOREIGN KEY ("uploadedByUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "StoryEntryAttachment_entryId_createdAt_idx" ON "StoryEntryAttachment"("entryId", "createdAt");

CREATE TABLE "StoryEntryBookmark" (
  "userId"    UUID NOT NULL,
  "entryId"   UUID NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "StoryEntryBookmark_pkey" PRIMARY KEY ("userId", "entryId"),
  CONSTRAINT "StoryEntryBookmark_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "StoryEntryBookmark_entryId_fkey" FOREIGN KEY ("entryId") REFERENCES "StoryEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "StoryEntryBookmark_entryId_idx" ON "StoryEntryBookmark"("entryId");
