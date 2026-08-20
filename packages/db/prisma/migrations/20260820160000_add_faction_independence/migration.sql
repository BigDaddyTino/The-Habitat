-- Answering to nobody becomes a fact the sheet carries.
--
-- A major with no wings filed yet and a power that stands outside every
-- sphere were indistinguishable in the data: both are `parent: null`. The
-- factions board was reading the difference out of a seed file, which froze
-- the shelf to whatever that file said and made a newly written power
-- invisible. The sheet now says it, so every surface can derive it.
--
-- The meta law: every key the schema knows is required with no default, so a
-- stored sheet missing this one would be refused whole on its next save. Every
-- faction row is backfilled here, and the guard keeps a re-run harmless.

UPDATE "StoryEntry"
SET "meta" = jsonb_set("meta", '{independent}', 'false'::jsonb, true)
WHERE "kind" = 'FACTION'
  AND "meta" IS NOT NULL
  AND NOT ("meta" ? 'independent');

-- The four the room decided answer to nobody. Written only where the sheet
-- still says otherwise, so a writer who has already changed one is not
-- overruled by a migration.
UPDATE "StoryEntry"
SET "meta" = jsonb_set("meta", '{independent}', 'true'::jsonb, true)
WHERE "kind" = 'FACTION'
  AND "meta" IS NOT NULL
  AND "meta"->>'parent' IS NULL
  AND "slug" IN ('the-old-hunger', 'the-choir-below', 'the-pale-embassy', 'crimson-choir')
  AND "meta"->'independent' = 'false'::jsonb;
