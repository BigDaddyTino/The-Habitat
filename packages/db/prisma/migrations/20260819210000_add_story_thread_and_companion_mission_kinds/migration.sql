-- THREAD: an evolving narrative concept — an arc, a mystery, an ending —
-- worked like a brainstorm: statused in meta, argued in comments, and never
-- confirmed canon until the room says so. COMPANION_MISSION: one mission in a
-- companion's personal chain, a first-class record rather than a text field
-- on the character. Purely additive, exactly like SYSTEM before them — the
-- export contract stays at version 1, and both kinds are development-room
-- records the exporter deliberately withholds from the game.
ALTER TYPE "StoryEntryKind" ADD VALUE 'THREAD';
ALTER TYPE "StoryEntryKind" ADD VALUE 'COMPANION_MISSION';
