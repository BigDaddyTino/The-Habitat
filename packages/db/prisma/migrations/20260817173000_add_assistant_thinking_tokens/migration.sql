-- Flash 3.7 reasons before it answers, and those tokens are billed but never
-- appear in the reply. A live probe spent 108 reasoning tokens to produce a
-- two-token answer, so leaving them out of the audit would understate the real
-- cost of an exchange by an order of magnitude.
ALTER TABLE "StoryAssistantMessage" ADD COLUMN "thinkingTokens" INTEGER;
ALTER TABLE "StoryAssistantMessage" ADD CONSTRAINT "StoryAssistantMessage_thinking_nonnegative"
    CHECK (COALESCE("thinkingTokens", 0) >= 0);
