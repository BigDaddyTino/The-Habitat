-- The side-quest growth pass: where a quest is picked up, what it pays, which
-- arc an ending flows into, and FLAG bible entries — the canonical names for
-- consequences that outlive their quest. All nullable-additive; the export
-- contract stays at version 1.

-- Consequences that one quest sets and another checks need exactly one
-- canonical name each, guarded by the same review queue as the rest of canon.
ALTER TYPE "StoryEntryKind" ADD VALUE 'FLAG';

-- Where and how a quest enters play. The region is a bible entry, never free
-- text, so a pickup place always resolves to a real asset on the game side.
ALTER TABLE "StoryArc"
    ADD COLUMN "hook" VARCHAR(500),
    ADD COLUMN "regionEntryId" UUID;

ALTER TABLE "StoryArc"
    ADD CONSTRAINT "StoryArc_regionEntryId_fkey"
    FOREIGN KEY ("regionEntryId") REFERENCES "StoryEntry"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "StoryArc" ADD CONSTRAINT "StoryArc_hook_not_blank"
    CHECK ("hook" IS NULL OR length(btrim("hook")) > 0);

-- What finishing a step or reaching an ending pays, and where an ending
-- continues. A continuation is an arc reference so a chain of quests can be
-- followed structurally rather than by reading the prose.
ALTER TABLE "StoryNode"
    ADD COLUMN "rewards" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    ADD COLUMN "continuesInArcId" UUID;

ALTER TABLE "StoryNode"
    ADD CONSTRAINT "StoryNode_continuesInArcId_fkey"
    FOREIGN KEY ("continuesInArcId") REFERENCES "StoryArc"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "StoryNode" ADD CONSTRAINT "StoryNode_continuation_on_endings"
    CHECK ("continuesInArcId" IS NULL OR "kind" = 'ENDING');
