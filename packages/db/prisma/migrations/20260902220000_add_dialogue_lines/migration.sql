-- Voiced dialogue: codex export contract v5 (2026-09-02).
--
-- A DIALOGUE node's body is prose, and prose cannot address a single spoken
-- line. StoryLine is the structured record beside it: one row per utterance,
-- with the speaker, the exact words, the performance direction and the
-- intensity as fields, so the exporter never parses prose and the voice
-- pipeline can regenerate exactly the lines whose content changed.
--
-- The number is a frozen export identity, like a node key or a choice key:
-- minted once per node, never reused, never renumbered. Deleting a line
-- retires the number. That is what lets an asset built from
-- <arc>/<node>/03 stay attached to the same sentence for the life of the
-- project.

ALTER TABLE "StoryEdge" ADD COLUMN "voiced" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE "StoryLine" (
  "id"              UUID          NOT NULL DEFAULT gen_random_uuid(),
  "nodeId"          UUID          NOT NULL,
  "number"          INTEGER       NOT NULL,
  "order"           INTEGER       NOT NULL DEFAULT 0,
  "speakerEntryId"  UUID,
  "speakerRole"     VARCHAR(64),
  "listenerEntryId" UUID,
  "listenerRole"    VARCHAR(64),
  "text"            VARCHAR(1000) NOT NULL,
  "performance"     VARCHAR(200)  NOT NULL DEFAULT '',
  "intensity"       INTEGER       NOT NULL DEFAULT 5,
  "emotion"         TEXT[]        NOT NULL DEFAULT ARRAY[]::TEXT[],
  "locale"          VARCHAR(16)   NOT NULL DEFAULT 'en-US',
  "voiced"          BOOLEAN       NOT NULL DEFAULT true,
  "retiredAt"       TIMESTAMP(3),
  "createdByUserId" UUID          NOT NULL,
  "updatedByUserId" UUID,
  "createdAt"       TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"       TIMESTAMP(3)  NOT NULL,

  CONSTRAINT "StoryLine_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "StoryLine_nodeId_number_key" UNIQUE ("nodeId", "number"),
  CONSTRAINT "StoryLine_number_check" CHECK ("number" >= 1),
  CONSTRAINT "StoryLine_intensity_check" CHECK ("intensity" BETWEEN 1 AND 10),
  -- Exactly one way to say who speaks; at most one way to say who listens.
  CONSTRAINT "StoryLine_speaker_xor_role" CHECK (("speakerEntryId" IS NULL) <> ("speakerRole" IS NULL)),
  CONSTRAINT "StoryLine_listener_at_most_one" CHECK (NOT ("listenerEntryId" IS NOT NULL AND "listenerRole" IS NOT NULL)),
  -- The spoken words are one utterance: non-empty, single-line.
  CONSTRAINT "StoryLine_text_nonempty" CHECK (length(btrim("text")) > 0),
  CONSTRAINT "StoryLine_text_single_line" CHECK ("text" !~ E'[\\n\\r]'),
  CONSTRAINT "StoryLine_role_shape" CHECK ("speakerRole" IS NULL OR "speakerRole" ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  CONSTRAINT "StoryLine_listener_role_shape" CHECK ("listenerRole" IS NULL OR "listenerRole" ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  CONSTRAINT "StoryLine_locale_shape" CHECK ("locale" ~ '^[a-z]{2,3}(-[A-Za-z0-9]{2,8})*$'),

  CONSTRAINT "StoryLine_nodeId_fkey" FOREIGN KEY ("nodeId")
    REFERENCES "StoryNode"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  -- A character who speaks lines cannot be deleted out from under them.
  CONSTRAINT "StoryLine_speakerEntryId_fkey" FOREIGN KEY ("speakerEntryId")
    REFERENCES "StoryEntry"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "StoryLine_listenerEntryId_fkey" FOREIGN KEY ("listenerEntryId")
    REFERENCES "StoryEntry"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "StoryLine_createdByUserId_fkey" FOREIGN KEY ("createdByUserId")
    REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "StoryLine_updatedByUserId_fkey" FOREIGN KEY ("updatedByUserId")
    REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX "StoryLine_nodeId_retiredAt_order_idx" ON "StoryLine"("nodeId", "retiredAt", "order");
CREATE INDEX "StoryLine_speakerEntryId_idx" ON "StoryLine"("speakerEntryId");
