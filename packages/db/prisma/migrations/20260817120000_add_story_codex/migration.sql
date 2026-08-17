-- The Story Codex: a collaborative writing surface for the Martino game, and
-- the canon export the Unreal project reads. Nothing here touches an existing
-- table beyond adding no columns to it — the codex is severable, and dropping
-- these tables would leave the rest of the Habitat untouched.
--
-- The status ladder is the safety property worth stating plainly: everything a
-- contributor writes lands at PROPOSED, and only CANON is ever exported, so an
-- unreviewed idea cannot reach a game build by any path through this schema.

CREATE TYPE "StoryEntryKind" AS ENUM ('THEME', 'REGION', 'CREATURE', 'CHARACTER', 'FACTION', 'ITEM', 'EVENT', 'RULE');
CREATE TYPE "StoryStatus" AS ENUM ('DRAFT', 'PROPOSED', 'CANON', 'REJECTED', 'ARCHIVED');
CREATE TYPE "StoryNodeKind" AS ENUM ('BEAT', 'SCENE', 'DIALOGUE', 'CHOICE', 'CONDITION', 'QUEST_START', 'QUEST_STEP', 'ENDING');
CREATE TYPE "StoryRevisionAction" AS ENUM ('CREATED', 'UPDATED', 'MOVED', 'STATUS_CHANGED', 'DELETED', 'LINKED', 'UNLINKED');

CREATE TABLE "StoryArc" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "slug" VARCHAR(64) NOT NULL,
    "title" VARCHAR(120) NOT NULL,
    "summary" VARCHAR(500),
    "isMainline" BOOLEAN NOT NULL DEFAULT false,
    "status" "StoryStatus" NOT NULL DEFAULT 'PROPOSED',
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdByUserId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "StoryArc_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "StoryArc_slug_key" ON "StoryArc"("slug");
CREATE INDEX "StoryArc_status_isMainline_position_idx" ON "StoryArc"("status", "isMainline", "position");

ALTER TABLE "StoryArc" ADD CONSTRAINT "StoryArc_createdByUserId_fkey"
    FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- A slug reaches the Unreal importer as an asset path segment, so it is held to
-- lowercase kebab-case here rather than only in the server action.
ALTER TABLE "StoryArc" ADD CONSTRAINT "StoryArc_slug_is_kebab_case"
    CHECK ("slug" ~ '^[a-z0-9]+(-[a-z0-9]+)*$');
ALTER TABLE "StoryArc" ADD CONSTRAINT "StoryArc_title_not_blank"
    CHECK (length(btrim("title")) > 0);

CREATE TABLE "StoryNode" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "arcId" UUID NOT NULL,
    "kind" "StoryNodeKind" NOT NULL DEFAULT 'SCENE',
    "key" VARCHAR(80) NOT NULL,
    "title" VARCHAR(160) NOT NULL,
    "summary" VARCHAR(500),
    "body" TEXT,
    "status" "StoryStatus" NOT NULL DEFAULT 'PROPOSED',
    "canvasX" INTEGER NOT NULL DEFAULT 0,
    "canvasY" INTEGER NOT NULL DEFAULT 0,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdByUserId" UUID NOT NULL,
    "updatedByUserId" UUID,
    "lockedByUserId" UUID,
    "lockExpiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "StoryNode_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "StoryNode_arcId_key_key" ON "StoryNode"("arcId", "key");
CREATE INDEX "StoryNode_arcId_status_idx" ON "StoryNode"("arcId", "status");
CREATE INDEX "StoryNode_status_updatedAt_idx" ON "StoryNode"("status", "updatedAt");

ALTER TABLE "StoryNode" ADD CONSTRAINT "StoryNode_arcId_fkey"
    FOREIGN KEY ("arcId") REFERENCES "StoryArc"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StoryNode" ADD CONSTRAINT "StoryNode_createdByUserId_fkey"
    FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StoryNode" ADD CONSTRAINT "StoryNode_updatedByUserId_fkey"
    FOREIGN KEY ("updatedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "StoryNode" ADD CONSTRAINT "StoryNode_lockedByUserId_fkey"
    FOREIGN KEY ("lockedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "StoryNode" ADD CONSTRAINT "StoryNode_key_is_kebab_case"
    CHECK ("key" ~ '^[a-z0-9]+(-[a-z0-9]+)*$');
ALTER TABLE "StoryNode" ADD CONSTRAINT "StoryNode_title_not_blank"
    CHECK (length(btrim("title")) > 0);
-- Keeps a fat-fingered drag from parking a node where nobody can find it again.
ALTER TABLE "StoryNode" ADD CONSTRAINT "StoryNode_canvas_within_bounds"
    CHECK ("canvasX" BETWEEN -100000 AND 100000 AND "canvasY" BETWEEN -100000 AND 100000);
ALTER TABLE "StoryNode" ADD CONSTRAINT "StoryNode_version_positive"
    CHECK ("version" >= 1);
-- A lock without an expiry is a node nobody can ever edit again.
ALTER TABLE "StoryNode" ADD CONSTRAINT "StoryNode_lock_is_complete"
    CHECK (("lockedByUserId" IS NULL AND "lockExpiresAt" IS NULL)
        OR ("lockedByUserId" IS NOT NULL AND "lockExpiresAt" IS NOT NULL));

CREATE TABLE "StoryEdge" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "arcId" UUID NOT NULL,
    "fromNodeId" UUID NOT NULL,
    "toNodeId" UUID NOT NULL,
    "label" VARCHAR(200),
    "condition" VARCHAR(300),
    "position" INTEGER NOT NULL DEFAULT 0,
    "status" "StoryStatus" NOT NULL DEFAULT 'PROPOSED',
    "createdByUserId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "StoryEdge_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "StoryEdge_fromNodeId_position_key" ON "StoryEdge"("fromNodeId", "position");
CREATE INDEX "StoryEdge_arcId_status_idx" ON "StoryEdge"("arcId", "status");
CREATE INDEX "StoryEdge_toNodeId_idx" ON "StoryEdge"("toNodeId");

ALTER TABLE "StoryEdge" ADD CONSTRAINT "StoryEdge_arcId_fkey"
    FOREIGN KEY ("arcId") REFERENCES "StoryArc"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StoryEdge" ADD CONSTRAINT "StoryEdge_fromNodeId_fkey"
    FOREIGN KEY ("fromNodeId") REFERENCES "StoryNode"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StoryEdge" ADD CONSTRAINT "StoryEdge_toNodeId_fkey"
    FOREIGN KEY ("toNodeId") REFERENCES "StoryNode"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StoryEdge" ADD CONSTRAINT "StoryEdge_createdByUserId_fkey"
    FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- A node that continues into itself is a hang in the game, not a story.
ALTER TABLE "StoryEdge" ADD CONSTRAINT "StoryEdge_no_self_transition"
    CHECK ("fromNodeId" <> "toNodeId");
ALTER TABLE "StoryEdge" ADD CONSTRAINT "StoryEdge_position_nonnegative"
    CHECK ("position" >= 0);

CREATE TABLE "StoryEntry" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "kind" "StoryEntryKind" NOT NULL,
    "slug" VARCHAR(64) NOT NULL,
    "title" VARCHAR(120) NOT NULL,
    "summary" VARCHAR(500),
    "body" TEXT,
    "status" "StoryStatus" NOT NULL DEFAULT 'PROPOSED',
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdByUserId" UUID NOT NULL,
    "updatedByUserId" UUID,
    "lockedByUserId" UUID,
    "lockExpiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "StoryEntry_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "StoryEntry_slug_key" ON "StoryEntry"("slug");
CREATE INDEX "StoryEntry_kind_status_title_idx" ON "StoryEntry"("kind", "status", "title");
CREATE INDEX "StoryEntry_status_updatedAt_idx" ON "StoryEntry"("status", "updatedAt");

ALTER TABLE "StoryEntry" ADD CONSTRAINT "StoryEntry_createdByUserId_fkey"
    FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StoryEntry" ADD CONSTRAINT "StoryEntry_updatedByUserId_fkey"
    FOREIGN KEY ("updatedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "StoryEntry" ADD CONSTRAINT "StoryEntry_lockedByUserId_fkey"
    FOREIGN KEY ("lockedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "StoryEntry" ADD CONSTRAINT "StoryEntry_slug_is_kebab_case"
    CHECK ("slug" ~ '^[a-z0-9]+(-[a-z0-9]+)*$');
ALTER TABLE "StoryEntry" ADD CONSTRAINT "StoryEntry_title_not_blank"
    CHECK (length(btrim("title")) > 0);
ALTER TABLE "StoryEntry" ADD CONSTRAINT "StoryEntry_version_positive"
    CHECK ("version" >= 1);
ALTER TABLE "StoryEntry" ADD CONSTRAINT "StoryEntry_lock_is_complete"
    CHECK (("lockedByUserId" IS NULL AND "lockExpiresAt" IS NULL)
        OR ("lockedByUserId" IS NOT NULL AND "lockExpiresAt" IS NOT NULL));

CREATE TABLE "StoryEntryLink" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "nodeId" UUID NOT NULL,
    "entryId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "StoryEntryLink_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "StoryEntryLink_nodeId_entryId_key" ON "StoryEntryLink"("nodeId", "entryId");
CREATE INDEX "StoryEntryLink_entryId_idx" ON "StoryEntryLink"("entryId");

ALTER TABLE "StoryEntryLink" ADD CONSTRAINT "StoryEntryLink_nodeId_fkey"
    FOREIGN KEY ("nodeId") REFERENCES "StoryNode"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StoryEntryLink" ADD CONSTRAINT "StoryEntryLink_entryId_fkey"
    FOREIGN KEY ("entryId") REFERENCES "StoryEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "StoryRevision" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "entityType" VARCHAR(12) NOT NULL,
    "entityId" UUID NOT NULL,
    "arcId" UUID,
    "action" "StoryRevisionAction" NOT NULL,
    "actorUserId" UUID NOT NULL,
    "summary" VARCHAR(300) NOT NULL,
    "before" JSONB,
    "after" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "StoryRevision_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "StoryRevision_entityType_entityId_createdAt_idx" ON "StoryRevision"("entityType", "entityId", "createdAt");
CREATE INDEX "StoryRevision_arcId_createdAt_idx" ON "StoryRevision"("arcId", "createdAt");
-- The live-sync endpoint reads only the newest row, every couple of seconds,
-- for every connected writer. That probe has to stay an index-only lookup.
CREATE INDEX "StoryRevision_createdAt_idx" ON "StoryRevision"("createdAt");

ALTER TABLE "StoryRevision" ADD CONSTRAINT "StoryRevision_actorUserId_fkey"
    FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "StoryRevision" ADD CONSTRAINT "StoryRevision_entityType_known"
    CHECK ("entityType" IN ('ARC', 'NODE', 'EDGE', 'ENTRY', 'LINK'));

CREATE TABLE "StoryComment" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "nodeId" UUID,
    "entryId" UUID,
    "authorUserId" UUID NOT NULL,
    "body" VARCHAR(2000) NOT NULL,
    "resolvedAt" TIMESTAMP(3),
    "resolvedByUserId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "StoryComment_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "StoryComment_nodeId_createdAt_idx" ON "StoryComment"("nodeId", "createdAt");
CREATE INDEX "StoryComment_entryId_createdAt_idx" ON "StoryComment"("entryId", "createdAt");

ALTER TABLE "StoryComment" ADD CONSTRAINT "StoryComment_nodeId_fkey"
    FOREIGN KEY ("nodeId") REFERENCES "StoryNode"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StoryComment" ADD CONSTRAINT "StoryComment_entryId_fkey"
    FOREIGN KEY ("entryId") REFERENCES "StoryEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StoryComment" ADD CONSTRAINT "StoryComment_authorUserId_fkey"
    FOREIGN KEY ("authorUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StoryComment" ADD CONSTRAINT "StoryComment_resolvedByUserId_fkey"
    FOREIGN KEY ("resolvedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- A comment belongs to exactly one thing. Attached to both, it would appear in
-- two discussions and be resolved from one of them.
ALTER TABLE "StoryComment" ADD CONSTRAINT "StoryComment_targets_exactly_one"
    CHECK (("nodeId" IS NULL) <> ("entryId" IS NULL));
ALTER TABLE "StoryComment" ADD CONSTRAINT "StoryComment_body_not_blank"
    CHECK (length(btrim("body")) > 0);
ALTER TABLE "StoryComment" ADD CONSTRAINT "StoryComment_resolution_is_complete"
    CHECK (("resolvedAt" IS NULL AND "resolvedByUserId" IS NULL)
        OR ("resolvedAt" IS NOT NULL AND "resolvedByUserId" IS NOT NULL));

CREATE TABLE "StoryPresence" (
    "userId" UUID NOT NULL,
    "arcId" UUID,
    "nodeId" UUID,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "StoryPresence_pkey" PRIMARY KEY ("userId")
);

CREATE INDEX "StoryPresence_arcId_lastSeenAt_idx" ON "StoryPresence"("arcId", "lastSeenAt");

ALTER TABLE "StoryPresence" ADD CONSTRAINT "StoryPresence_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StoryPresence" ADD CONSTRAINT "StoryPresence_arcId_fkey"
    FOREIGN KEY ("arcId") REFERENCES "StoryArc"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StoryPresence" ADD CONSTRAINT "StoryPresence_nodeId_fkey"
    FOREIGN KEY ("nodeId") REFERENCES "StoryNode"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "StoryExportToken" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "label" VARCHAR(80) NOT NULL,
    "tokenHash" VARCHAR(64) NOT NULL,
    "createdByUserId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUsedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    CONSTRAINT "StoryExportToken_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "StoryExportToken_tokenHash_key" ON "StoryExportToken"("tokenHash");
CREATE INDEX "StoryExportToken_revokedAt_idx" ON "StoryExportToken"("revokedAt");

ALTER TABLE "StoryExportToken" ADD CONSTRAINT "StoryExportToken_createdByUserId_fkey"
    FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Only a SHA-256 hex digest is ever stored. A row that is not 64 hex characters
-- means somebody wrote a raw token into this column.
ALTER TABLE "StoryExportToken" ADD CONSTRAINT "StoryExportToken_hash_is_sha256_hex"
    CHECK ("tokenHash" ~ '^[0-9a-f]{64}$');
ALTER TABLE "StoryExportToken" ADD CONSTRAINT "StoryExportToken_label_not_blank"
    CHECK (length(btrim("label")) > 0);
