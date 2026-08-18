-- The first round of additions the Unreal importer asked for after mapping the
-- export onto Narrative Tales. Everything here is nullable or defaulted, so the
-- export contract stays at version 1 and an existing importer keeps reading.

-- CreateEnum
CREATE TYPE "StoryEndingKind" AS ENUM ('SUCCESS', 'FAILURE', 'NEUTRAL');

-- AlterTable: speaker, ending valence, step completion, and effects on nodes.
ALTER TABLE "StoryNode"
    ADD COLUMN "speakerEntryId" UUID,
    ADD COLUMN "endingKind" "StoryEndingKind",
    ADD COLUMN "completion" VARCHAR(500),
    ADD COLUMN "effects" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

-- AlterTable: a stable per-choice key and effects on edges. The key is added
-- loose, backfilled for any existing row, then tightened — the live tables are
-- empty today, but a migration that only works on an empty table is a trap.
ALTER TABLE "StoryEdge"
    ADD COLUMN "key" VARCHAR(80),
    ADD COLUMN "effects" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

UPDATE "StoryEdge" SET "key" = 'choice-' || substr(md5("id"::text), 1, 12) WHERE "key" IS NULL;

ALTER TABLE "StoryEdge" ALTER COLUMN "key" SET NOT NULL;

-- The application mints readable keys itself; this default exists so a web
-- build deployed before this migration — whose Prisma client does not know
-- the column — can still draw a branch without violating NOT NULL. It is a
-- deployment bridge, not the naming scheme.
ALTER TABLE "StoryEdge" ALTER COLUMN "key"
    SET DEFAULT 'choice-' || substr(md5(gen_random_uuid()::text), 1, 12);

-- AddForeignKey: a speaker is a bible entry, never free text. Deleting the
-- entry clears the attribution rather than orphaning or cascading the node.
ALTER TABLE "StoryNode"
    ADD CONSTRAINT "StoryNode_speakerEntryId_fkey"
    FOREIGN KEY ("speakerEntryId") REFERENCES "StoryEntry"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateIndex
CREATE UNIQUE INDEX "StoryEdge_arcId_key_key" ON "StoryEdge"("arcId", "key");

-- Choice keys reach the Unreal importer as asset names, so they are held to
-- the same kebab-case shape node keys are.
ALTER TABLE "StoryEdge" ADD CONSTRAINT "StoryEdge_key_shape"
    CHECK ("key" ~ '^[a-z0-9]+(-[a-z0-9]+)*$');

-- The guarantee the importer relies on: a label is null or genuinely non-empty,
-- never whitespace. Narrative Tales silently auto-takes a player option whose
-- text is empty, so a blank label slipping through would turn a real choice
-- point into an auto-resolved one.
ALTER TABLE "StoryEdge" ADD CONSTRAINT "StoryEdge_label_not_blank"
    CHECK ("label" IS NULL OR length(btrim("label")) > 0);

-- Ending valence belongs to endings and step completion to quest steps; the
-- server action clears both when a node's kind changes, and these make that a
-- property of the data rather than a habit of the code.
ALTER TABLE "StoryNode" ADD CONSTRAINT "StoryNode_endingKind_on_endings"
    CHECK ("endingKind" IS NULL OR "kind" = 'ENDING');

ALTER TABLE "StoryNode" ADD CONSTRAINT "StoryNode_completion_on_quest_steps"
    CHECK ("completion" IS NULL OR "kind" = 'QUEST_STEP');

ALTER TABLE "StoryNode" ADD CONSTRAINT "StoryNode_completion_not_blank"
    CHECK ("completion" IS NULL OR length(btrim("completion")) > 0);
