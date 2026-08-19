-- The writers' room is open by default and freezes only where somebody says
-- so. A locked arc is settled story: no card, branch, or arc setting on it
-- changes until an ADMIN lifts the lock. Nullable-additive and unlocked for
-- every arc that already exists, which is the point — nothing was ever meant
-- to arrive frozen.
--
-- Distinct from the courtesy lock on "StoryNode"/"StoryEntry": that one is
-- transient, self-expiring, and only means "someone is typing here". This one
-- has no expiry, and is never claimed automatically.
ALTER TABLE "StoryArc" ADD COLUMN "lockedAt" TIMESTAMP(3);
ALTER TABLE "StoryArc" ADD COLUMN "lockedByUserId" UUID;

ALTER TABLE "StoryArc" ADD CONSTRAINT "StoryArc_lockedByUserId_fkey"
    FOREIGN KEY ("lockedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- The lock IS "lockedAt": whether an arc is frozen must not depend on an
-- account still existing, or deleting a member would silently thaw the story
-- they settled. "lockedByUserId" is attribution on top, and the SET NULL above
-- is allowed to erase it. What is forbidden is the other half — a locker with
-- no lock — which could only ever be a bug.
ALTER TABLE "StoryArc" ADD CONSTRAINT "StoryArc_lock_has_a_time"
    CHECK ("lockedByUserId" IS NULL OR "lockedAt" IS NOT NULL);

-- The board reads "is this arc frozen" on every render of every flow.
CREATE INDEX "StoryArc_lockedAt_idx" ON "StoryArc" ("lockedAt");
