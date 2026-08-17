-- The Warden: an audited Gemini assistant that reads the Story Codex and helps
-- the crew writing it. It is severable from the codex the same way the codex is
-- severable from the Habitat — dropping this one table and enum removes the
-- feature and leaves every story row untouched.
--
-- The audit is the point. Every exchange lands a row, including the ones where
-- no request ever left the building: a member repeatedly hitting the rate limit
-- or exhausting the daily budget is exactly the pattern an audit should show,
-- and a log that only kept successful answers would hide it.

CREATE TYPE "StoryAssistantOutcome" AS ENUM ('ANSWERED', 'BLOCKED', 'RATE_LIMITED', 'BUDGET_EXHAUSTED', 'UNAVAILABLE', 'UNCONFIGURED');

CREATE TABLE "StoryAssistantMessage" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL,
    "arcId" UUID,
    "nodeId" UUID,
    "question" VARCHAR(2000) NOT NULL,
    "answer" TEXT,
    "outcome" "StoryAssistantOutcome" NOT NULL,
    "model" VARCHAR(60) NOT NULL,
    "contextSummary" VARCHAR(500) NOT NULL,
    "revisionCursor" UUID,
    "promptTokens" INTEGER,
    "responseTokens" INTEGER,
    "latencyMs" INTEGER,
    "failureReason" VARCHAR(300),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "StoryAssistantMessage_pkey" PRIMARY KEY ("id")
);

-- The hourly per-member rate limit counts rows over this index, and the admin
-- transcript reads it in both directions, so both orderings are covered.
CREATE INDEX "StoryAssistantMessage_userId_createdAt_idx" ON "StoryAssistantMessage"("userId", "createdAt");
CREATE INDEX "StoryAssistantMessage_arcId_createdAt_idx" ON "StoryAssistantMessage"("arcId", "createdAt");
CREATE INDEX "StoryAssistantMessage_createdAt_idx" ON "StoryAssistantMessage"("createdAt");
CREATE INDEX "StoryAssistantMessage_outcome_createdAt_idx" ON "StoryAssistantMessage"("outcome", "createdAt");

-- The asker is the audit subject, so their row cascades with the account.
ALTER TABLE "StoryAssistantMessage" ADD CONSTRAINT "StoryAssistantMessage_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- The arc and node are only where the question was asked. Deleting a scene must
-- not erase the record that somebody asked about it, so these null out.
ALTER TABLE "StoryAssistantMessage" ADD CONSTRAINT "StoryAssistantMessage_arcId_fkey"
    FOREIGN KEY ("arcId") REFERENCES "StoryArc"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "StoryAssistantMessage" ADD CONSTRAINT "StoryAssistantMessage_nodeId_fkey"
    FOREIGN KEY ("nodeId") REFERENCES "StoryNode"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "StoryAssistantMessage" ADD CONSTRAINT "StoryAssistantMessage_question_not_blank"
    CHECK (length(btrim("question")) > 0);
-- An answered exchange must carry an answer, and an unanswered one must not
-- invent the appearance of having had one.
ALTER TABLE "StoryAssistantMessage" ADD CONSTRAINT "StoryAssistantMessage_answer_matches_outcome"
    CHECK (("outcome" = 'ANSWERED' AND "answer" IS NOT NULL) OR ("outcome" <> 'ANSWERED' AND "answer" IS NULL));
ALTER TABLE "StoryAssistantMessage" ADD CONSTRAINT "StoryAssistantMessage_counts_nonnegative"
    CHECK (COALESCE("promptTokens", 0) >= 0 AND COALESCE("responseTokens", 0) >= 0 AND COALESCE("latencyMs", 0) >= 0);
