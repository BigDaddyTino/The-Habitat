-- The module system from Codex_Module_Schema.md: one typed, fully-nullable
-- `meta` object per bible entry, shaped by kind. Null is a first-class state —
-- "not yet decided" — and feeds the needs-work dashboard rather than being an
-- error. Nullable-additive, so the export contract stays at version 1.
ALTER TABLE "StoryEntry" ADD COLUMN "meta" JSONB;

-- Meta is always an object or absent; a bare string or array in this column
-- would be a writer's paste accident, not a module.
ALTER TABLE "StoryEntry" ADD CONSTRAINT "StoryEntry_meta_is_object"
    CHECK ("meta" IS NULL OR jsonb_typeof("meta") = 'object');
