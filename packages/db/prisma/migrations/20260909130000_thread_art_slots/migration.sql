-- Idea Center art slots (2026-09-09).
--
-- An idea can name the pictures it is waiting for — "the Give ending", "the
-- Refuse ending" — before anybody has drawn them. Each named slot is a file
-- the art pipeline drops into private/codex-art/threads/<slug>-<key>.png,
-- and the idea's page shows a placeholder carrying the slot's path until the
-- file lands, then the picture. Same convention as every other codex art
-- slot: found on disk by name, no registry to keep.
--
-- The key is required on the sheet with no default, like facets, sections and
-- canonPackets: a sheet that forgets to pass it through must fail loudly
-- rather than quietly erase the list of pictures an idea is waiting for. So
-- every stored THREAD row gets an empty list here.

UPDATE "StoryEntry"
SET "meta" = COALESCE("meta", '{}'::jsonb)
  || CASE WHEN COALESCE("meta", '{}'::jsonb) ? 'artSlots' THEN '{}'::jsonb ELSE '{"artSlots": []}'::jsonb END
WHERE "kind" = 'THREAD';
