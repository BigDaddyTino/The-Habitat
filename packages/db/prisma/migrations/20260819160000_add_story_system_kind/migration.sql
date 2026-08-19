-- SYSTEM: a game mechanic written down for the writers' room, so quests are
-- written toward the verbs the game actually ships. Purely additive — the
-- export contract stays at version 1, and an importer that has never heard of
-- the kind reads these entries exactly as it reads a THEME it doesn't act on.
ALTER TYPE "StoryEntryKind" ADD VALUE 'SYSTEM';
