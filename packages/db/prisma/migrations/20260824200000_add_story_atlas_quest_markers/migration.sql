-- Quest beats need their own cartographic coordinates. A city-level REGION
-- entry may host several quest steps at different gates, docks, and beaches;
-- duplicating the place entry would make the Codex and game handoff ambiguous.
CREATE TABLE "StoryMapNodePlacement" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "mapId" UUID NOT NULL,
  "nodeId" UUID NOT NULL,
  "geometryKind" "StoryMapGeometryKind" NOT NULL,
  "geometry" JSONB NOT NULL,
  "labelX" INTEGER,
  "labelY" INTEGER,
  "minZoom" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "maxZoom" DOUBLE PRECISION,
  "priority" INTEGER NOT NULL DEFAULT 0,
  "version" INTEGER NOT NULL DEFAULT 1,
  "createdByUserId" UUID NOT NULL,
  "updatedByUserId" UUID,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "StoryMapNodePlacement_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "StoryMapNodePlacement_zoom_check" CHECK ("maxZoom" IS NULL OR "minZoom" <= "maxZoom"),
  CONSTRAINT "StoryMapNodePlacement_label_pair_check" CHECK (("labelX" IS NULL) = ("labelY" IS NULL))
);

CREATE UNIQUE INDEX "StoryMapNodePlacement_mapId_nodeId_key" ON "StoryMapNodePlacement"("mapId", "nodeId");
CREATE INDEX "StoryMapNodePlacement_mapId_priority_idx" ON "StoryMapNodePlacement"("mapId", "priority");
CREATE INDEX "StoryMapNodePlacement_nodeId_idx" ON "StoryMapNodePlacement"("nodeId");

ALTER TABLE "StoryMapNodePlacement" ADD CONSTRAINT "StoryMapNodePlacement_mapId_fkey" FOREIGN KEY ("mapId") REFERENCES "StoryMap"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StoryMapNodePlacement" ADD CONSTRAINT "StoryMapNodePlacement_nodeId_fkey" FOREIGN KEY ("nodeId") REFERENCES "StoryNode"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StoryMapNodePlacement" ADD CONSTRAINT "StoryMapNodePlacement_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "StoryMapNodePlacement" ADD CONSTRAINT "StoryMapNodePlacement_updatedByUserId_fkey" FOREIGN KEY ("updatedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
