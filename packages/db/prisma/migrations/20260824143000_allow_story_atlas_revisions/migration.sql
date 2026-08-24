-- Atlas scene and placement writes use the same audited revision stream as
-- every other authored Codex entity.
ALTER TABLE "StoryRevision" DROP CONSTRAINT "StoryRevision_entityType_known";
ALTER TABLE "StoryRevision" ADD CONSTRAINT "StoryRevision_entityType_known"
  CHECK ("entityType" IN ('ARC', 'NODE', 'EDGE', 'ENTRY', 'LINK', 'MAP', 'PLACEMENT'));
