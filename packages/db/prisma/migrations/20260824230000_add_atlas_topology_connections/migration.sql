-- Atlas 2.0 persistence is additive. This migration creates empty authoring
-- structures; it does not read, rewrite, or infer from legacy polygons or
-- REGION.meta.connections.

CREATE TYPE "StoryMapBoundaryKind" AS ENUM ('INTERNAL_BORDER', 'COAST', 'WATER_BOUNDARY', 'OPEN_BOUNDARY');
CREATE TYPE "StoryMapAreaRingRole" AS ENUM ('SHELL', 'HOLE');
CREATE TYPE "StoryWorldConnectionType" AS ENUM ('ROAD', 'TRAIL', 'RIVER_TRAVEL', 'SEA_ROUTE', 'AIR_ROUTE', 'OTHER', 'UNKNOWN');
CREATE TYPE "StoryWorldConnectionDirectionality" AS ENUM ('UNSPECIFIED', 'FROM_TO', 'TO_FROM', 'BIDIRECTIONAL');
CREATE TYPE "StoryWorldConnectionStatus" AS ENUM ('UNSPECIFIED', 'OPEN', 'CLOSED', 'DESTROYED');
CREATE TYPE "StoryWorldConnectionVisibility" AS ENUM ('DEFAULT', 'HIDDEN');
CREATE TYPE "StoryMapConnectionPathGeometryKind" AS ENUM ('LINESTRING', 'MULTILINESTRING');

CREATE TABLE "StoryMapTopologyNode" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "mapId" UUID NOT NULL,
  "x" INTEGER NOT NULL,
  "y" INTEGER NOT NULL,
  "version" INTEGER NOT NULL DEFAULT 1,
  "createdByUserId" UUID NOT NULL,
  "updatedByUserId" UUID,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "StoryMapTopologyNode_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "StoryMapTopologyNode_coordinate_check" CHECK ("x" >= 0 AND "y" >= 0),
  CONSTRAINT "StoryMapTopologyNode_version_check" CHECK ("version" >= 1)
);

CREATE TABLE "StoryMapBoundary" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "mapId" UUID NOT NULL,
  "startNodeId" UUID NOT NULL,
  "endNodeId" UUID NOT NULL,
  "kind" "StoryMapBoundaryKind" NOT NULL,
  "interiorVertices" JSONB NOT NULL,
  "version" INTEGER NOT NULL DEFAULT 1,
  "createdByUserId" UUID NOT NULL,
  "updatedByUserId" UUID,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "StoryMapBoundary_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "StoryMapBoundary_distinct_nodes_check" CHECK ("startNodeId" <> "endNodeId"),
  CONSTRAINT "StoryMapBoundary_interior_array_check" CHECK (jsonb_typeof("interiorVertices") = 'array'),
  CONSTRAINT "StoryMapBoundary_version_check" CHECK ("version" >= 1)
);

CREATE TABLE "StoryMapAreaRing" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "placementId" UUID NOT NULL,
  "componentIndex" INTEGER NOT NULL,
  "ringIndex" INTEGER NOT NULL,
  "role" "StoryMapAreaRingRole" NOT NULL,
  "version" INTEGER NOT NULL DEFAULT 1,
  "createdByUserId" UUID NOT NULL,
  "updatedByUserId" UUID,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "StoryMapAreaRing_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "StoryMapAreaRing_component_check" CHECK ("componentIndex" >= 0),
  CONSTRAINT "StoryMapAreaRing_role_index_check" CHECK (
    ("role" = 'SHELL' AND "ringIndex" = 0) OR
    ("role" = 'HOLE' AND "ringIndex" > 0)
  ),
  CONSTRAINT "StoryMapAreaRing_version_check" CHECK ("version" >= 1)
);

CREATE TABLE "StoryMapAreaRingBoundary" (
  "ringId" UUID NOT NULL,
  "boundaryId" UUID NOT NULL,
  "sequence" INTEGER NOT NULL,
  "reversed" BOOLEAN NOT NULL DEFAULT false,
  CONSTRAINT "StoryMapAreaRingBoundary_pkey" PRIMARY KEY ("ringId", "boundaryId"),
  CONSTRAINT "StoryMapAreaRingBoundary_sequence_check" CHECK ("sequence" >= 0)
);

CREATE TABLE "StoryWorldConnection" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "fromEntryId" UUID NOT NULL,
  "toEntryId" UUID NOT NULL,
  "type" "StoryWorldConnectionType" NOT NULL,
  "directionality" "StoryWorldConnectionDirectionality" NOT NULL DEFAULT 'UNSPECIFIED',
  "status" "StoryWorldConnectionStatus" NOT NULL DEFAULT 'UNSPECIFIED',
  "visibility" "StoryWorldConnectionVisibility" NOT NULL DEFAULT 'DEFAULT',
  "originalWording" VARCHAR(2000),
  "editorialNotes" VARCHAR(2000),
  "metadata" JSONB NOT NULL,
  "version" INTEGER NOT NULL DEFAULT 1,
  "createdByUserId" UUID NOT NULL,
  "updatedByUserId" UUID,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "StoryWorldConnection_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "StoryWorldConnection_distinct_endpoints_check" CHECK ("fromEntryId" <> "toEntryId"),
  CONSTRAINT "StoryWorldConnection_metadata_object_check" CHECK (jsonb_typeof("metadata") = 'object'),
  CONSTRAINT "StoryWorldConnection_version_check" CHECK ("version" >= 1)
);

CREATE TABLE "StoryMapConnectionPath" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "connectionId" UUID NOT NULL,
  "mapId" UUID NOT NULL,
  "geometryKind" "StoryMapConnectionPathGeometryKind" NOT NULL,
  "geometry" JSONB NOT NULL,
  "minZoom" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "maxZoom" DOUBLE PRECISION,
  "priority" INTEGER NOT NULL DEFAULT 0,
  "version" INTEGER NOT NULL DEFAULT 1,
  "createdByUserId" UUID NOT NULL,
  "updatedByUserId" UUID,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "StoryMapConnectionPath_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "StoryMapConnectionPath_geometry_object_check" CHECK (jsonb_typeof("geometry") = 'object'),
  CONSTRAINT "StoryMapConnectionPath_zoom_check" CHECK ("minZoom" >= 0 AND ("maxZoom" IS NULL OR "minZoom" <= "maxZoom")),
  CONSTRAINT "StoryMapConnectionPath_version_check" CHECK ("version" >= 1)
);

CREATE INDEX "StoryMapTopologyNode_mapId_idx" ON "StoryMapTopologyNode"("mapId");
CREATE UNIQUE INDEX "StoryMapTopologyNode_mapId_x_y_key" ON "StoryMapTopologyNode"("mapId", "x", "y");
CREATE INDEX "StoryMapBoundary_mapId_idx" ON "StoryMapBoundary"("mapId");
CREATE INDEX "StoryMapBoundary_startNodeId_idx" ON "StoryMapBoundary"("startNodeId");
CREATE INDEX "StoryMapBoundary_endNodeId_idx" ON "StoryMapBoundary"("endNodeId");
CREATE INDEX "StoryMapAreaRing_placementId_idx" ON "StoryMapAreaRing"("placementId");
CREATE UNIQUE INDEX "StoryMapAreaRing_placementId_componentIndex_ringIndex_key" ON "StoryMapAreaRing"("placementId", "componentIndex", "ringIndex");
CREATE INDEX "StoryMapAreaRingBoundary_boundaryId_idx" ON "StoryMapAreaRingBoundary"("boundaryId");
CREATE UNIQUE INDEX "StoryMapAreaRingBoundary_ringId_sequence_key" ON "StoryMapAreaRingBoundary"("ringId", "sequence");
CREATE INDEX "StoryWorldConnection_fromEntryId_idx" ON "StoryWorldConnection"("fromEntryId");
CREATE INDEX "StoryWorldConnection_toEntryId_idx" ON "StoryWorldConnection"("toEntryId");
CREATE INDEX "StoryWorldConnection_type_idx" ON "StoryWorldConnection"("type");
CREATE INDEX "StoryMapConnectionPath_mapId_idx" ON "StoryMapConnectionPath"("mapId");
CREATE INDEX "StoryMapConnectionPath_connectionId_idx" ON "StoryMapConnectionPath"("connectionId");
CREATE UNIQUE INDEX "StoryMapConnectionPath_connectionId_mapId_key" ON "StoryMapConnectionPath"("connectionId", "mapId");

ALTER TABLE "StoryMapTopologyNode" ADD CONSTRAINT "StoryMapTopologyNode_mapId_fkey" FOREIGN KEY ("mapId") REFERENCES "StoryMap"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "StoryMapTopologyNode" ADD CONSTRAINT "StoryMapTopologyNode_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "StoryMapTopologyNode" ADD CONSTRAINT "StoryMapTopologyNode_updatedByUserId_fkey" FOREIGN KEY ("updatedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "StoryMapBoundary" ADD CONSTRAINT "StoryMapBoundary_mapId_fkey" FOREIGN KEY ("mapId") REFERENCES "StoryMap"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "StoryMapBoundary" ADD CONSTRAINT "StoryMapBoundary_startNodeId_fkey" FOREIGN KEY ("startNodeId") REFERENCES "StoryMapTopologyNode"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "StoryMapBoundary" ADD CONSTRAINT "StoryMapBoundary_endNodeId_fkey" FOREIGN KEY ("endNodeId") REFERENCES "StoryMapTopologyNode"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "StoryMapBoundary" ADD CONSTRAINT "StoryMapBoundary_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "StoryMapBoundary" ADD CONSTRAINT "StoryMapBoundary_updatedByUserId_fkey" FOREIGN KEY ("updatedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "StoryMapAreaRing" ADD CONSTRAINT "StoryMapAreaRing_placementId_fkey" FOREIGN KEY ("placementId") REFERENCES "StoryMapPlacement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "StoryMapAreaRing" ADD CONSTRAINT "StoryMapAreaRing_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "StoryMapAreaRing" ADD CONSTRAINT "StoryMapAreaRing_updatedByUserId_fkey" FOREIGN KEY ("updatedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "StoryMapAreaRingBoundary" ADD CONSTRAINT "StoryMapAreaRingBoundary_ringId_fkey" FOREIGN KEY ("ringId") REFERENCES "StoryMapAreaRing"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "StoryMapAreaRingBoundary" ADD CONSTRAINT "StoryMapAreaRingBoundary_boundaryId_fkey" FOREIGN KEY ("boundaryId") REFERENCES "StoryMapBoundary"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "StoryWorldConnection" ADD CONSTRAINT "StoryWorldConnection_fromEntryId_fkey" FOREIGN KEY ("fromEntryId") REFERENCES "StoryEntry"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "StoryWorldConnection" ADD CONSTRAINT "StoryWorldConnection_toEntryId_fkey" FOREIGN KEY ("toEntryId") REFERENCES "StoryEntry"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "StoryWorldConnection" ADD CONSTRAINT "StoryWorldConnection_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "StoryWorldConnection" ADD CONSTRAINT "StoryWorldConnection_updatedByUserId_fkey" FOREIGN KEY ("updatedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "StoryMapConnectionPath" ADD CONSTRAINT "StoryMapConnectionPath_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "StoryWorldConnection"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "StoryMapConnectionPath" ADD CONSTRAINT "StoryMapConnectionPath_mapId_fkey" FOREIGN KEY ("mapId") REFERENCES "StoryMap"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "StoryMapConnectionPath" ADD CONSTRAINT "StoryMapConnectionPath_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "StoryMapConnectionPath" ADD CONSTRAINT "StoryMapConnectionPath_updatedByUserId_fkey" FOREIGN KEY ("updatedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Reuse the existing StoryRevision stream and its existing UUID entity key.
ALTER TABLE "StoryRevision" DROP CONSTRAINT "StoryRevision_entityType_known";
ALTER TABLE "StoryRevision" ADD CONSTRAINT "StoryRevision_entityType_known"
  CHECK ("entityType" IN ('ARC', 'NODE', 'EDGE', 'ENTRY', 'LINK', 'MAP', 'PLACEMENT', 'TOPO_NODE', 'BOUNDARY', 'AREA_RING', 'WORLD_CONN', 'CONN_PATH'));
