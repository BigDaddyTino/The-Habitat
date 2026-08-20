-- Stories & Quests: arcs learn what KIND of story they are, companion quests
-- learn whose story they are, and threads learn to carry canon packets.
--
-- `isMainline` is NOT replaced. It is the export contract (v1), the ordering
-- key, and what every arc picker reads. `category` is the finer filing the
-- writers' room actually works in. The CHECK below binds the two together so
-- the pair can never drift: a writer that sets one and forgets the other gets
-- a loud failure instead of a mainline chapter the game reads as a side quest.
CREATE TYPE "StoryArcCategory" AS ENUM ('MAINLINE','SIDE_QUEST','CONTRACT','COMPANION_QUEST','INCURSION','WORLD_EVENT');

ALTER TABLE "StoryArc" ADD COLUMN "category" "StoryArcCategory" NOT NULL DEFAULT 'SIDE_QUEST';
ALTER TABLE "StoryArc" ADD COLUMN "companionEntryId" UUID;
ALTER TABLE "StoryArc" ADD CONSTRAINT "StoryArc_companionEntryId_fkey"
  FOREIGN KEY ("companionEntryId") REFERENCES "StoryEntry"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Every arc that already exists is either the spine or a side quest; the finer
-- categories are opt-in from here.
UPDATE "StoryArc" SET "category" = 'MAINLINE' WHERE "isMainline" = true;

ALTER TABLE "StoryArc" ADD CONSTRAINT "StoryArc_mainline_category_agree"
  CHECK ("isMainline" = ("category" = 'MAINLINE'));

CREATE INDEX "StoryArc_category_position_idx" ON "StoryArc"("category", "position");

-- The thread-meta law: a stored row carries every key the schema knows, or the
-- next sheet save is refused whole. `canonPackets` is required-with-no-default
-- precisely so a component that forgets to pass it through fails loudly rather
-- than silently deleting settled material — which means existing rows have to
-- be given the key here.
UPDATE "StoryEntry" SET "meta" = "meta" || '{"canonPackets": []}'::jsonb
  WHERE "kind" = 'THREAD' AND "meta" IS NOT NULL AND NOT ("meta" ? 'canonPackets');

-- Same law for companion missions learning which canon arc they became.
UPDATE "StoryEntry" SET "meta" = "meta" || '{"arc": null}'::jsonb
  WHERE "kind" = 'COMPANION_MISSION' AND "meta" IS NOT NULL AND NOT ("meta" ? 'arc');
