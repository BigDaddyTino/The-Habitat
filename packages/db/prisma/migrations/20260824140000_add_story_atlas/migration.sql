-- The Martino atlas stores cartographic presentation separately from Codex
-- lore. Coordinates are normalized per scene and deliberately do not claim to
-- be Unreal world coordinates.
CREATE TYPE "StoryMapGeometryKind" AS ENUM ('POINT', 'POLYGON', 'MULTIPOLYGON');

CREATE TABLE "StoryMap" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "slug" VARCHAR(64) NOT NULL,
  "title" VARCHAR(120) NOT NULL,
  "parentMapId" UUID,
  "ownerEntryId" UUID,
  "artVersion" VARCHAR(40) NOT NULL,
  "imageWidth" INTEGER NOT NULL,
  "imageHeight" INTEGER NOT NULL,
  "coordinateWidth" INTEGER NOT NULL DEFAULT 100000,
  "coordinateHeight" INTEGER NOT NULL,
  "initialCenterX" INTEGER NOT NULL,
  "initialCenterY" INTEGER NOT NULL,
  "initialZoom" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "minZoom" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "maxZoom" DOUBLE PRECISION NOT NULL DEFAULT 8,
  "version" INTEGER NOT NULL DEFAULT 1,
  "createdByUserId" UUID NOT NULL,
  "updatedByUserId" UUID,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "StoryMap_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "StoryMap_dimensions_check" CHECK ("imageWidth" > 0 AND "imageHeight" > 0 AND "coordinateWidth" > 0 AND "coordinateHeight" > 0),
  CONSTRAINT "StoryMap_center_check" CHECK ("initialCenterX" BETWEEN 0 AND "coordinateWidth" AND "initialCenterY" BETWEEN 0 AND "coordinateHeight"),
  CONSTRAINT "StoryMap_zoom_check" CHECK ("minZoom" <= "initialZoom" AND "initialZoom" <= "maxZoom")
);

CREATE TABLE "StoryMapPlacement" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "mapId" UUID NOT NULL,
  "entryId" UUID NOT NULL,
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
  CONSTRAINT "StoryMapPlacement_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "StoryMapPlacement_zoom_check" CHECK ("maxZoom" IS NULL OR "minZoom" <= "maxZoom"),
  CONSTRAINT "StoryMapPlacement_label_pair_check" CHECK (("labelX" IS NULL) = ("labelY" IS NULL))
);

CREATE UNIQUE INDEX "StoryMap_slug_key" ON "StoryMap"("slug");
CREATE UNIQUE INDEX "StoryMap_ownerEntryId_key" ON "StoryMap"("ownerEntryId");
CREATE INDEX "StoryMap_parentMapId_title_idx" ON "StoryMap"("parentMapId", "title");
CREATE INDEX "StoryMap_ownerEntryId_idx" ON "StoryMap"("ownerEntryId");
CREATE UNIQUE INDEX "StoryMapPlacement_mapId_entryId_key" ON "StoryMapPlacement"("mapId", "entryId");
CREATE INDEX "StoryMapPlacement_mapId_priority_idx" ON "StoryMapPlacement"("mapId", "priority");
CREATE INDEX "StoryMapPlacement_entryId_idx" ON "StoryMapPlacement"("entryId");

ALTER TABLE "StoryMap" ADD CONSTRAINT "StoryMap_parentMapId_fkey" FOREIGN KEY ("parentMapId") REFERENCES "StoryMap"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "StoryMap" ADD CONSTRAINT "StoryMap_ownerEntryId_fkey" FOREIGN KEY ("ownerEntryId") REFERENCES "StoryEntry"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "StoryMap" ADD CONSTRAINT "StoryMap_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "StoryMap" ADD CONSTRAINT "StoryMap_updatedByUserId_fkey" FOREIGN KEY ("updatedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "StoryMapPlacement" ADD CONSTRAINT "StoryMapPlacement_mapId_fkey" FOREIGN KEY ("mapId") REFERENCES "StoryMap"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StoryMapPlacement" ADD CONSTRAINT "StoryMapPlacement_entryId_fkey" FOREIGN KEY ("entryId") REFERENCES "StoryEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StoryMapPlacement" ADD CONSTRAINT "StoryMapPlacement_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "StoryMapPlacement" ADD CONSTRAINT "StoryMapPlacement_updatedByUserId_fkey" FOREIGN KEY ("updatedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
