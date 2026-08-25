import type { AtlasLineGeometry, AtlasMultiLineGeometry, AtlasMultiPolygonGeometry, AtlasPolygonGeometry } from "./atlas-geometry";
import type { StoryAtlasFeature, StoryAtlasMapLink, StoryMapPoint } from "./story-map";

export const atlasProjectionVersions = ["V1", "V2"] as const;
export type AtlasProjectionVersion = (typeof atlasProjectionVersions)[number];
export const atlasDetailLevels = ["L0_WORLD", "L1_REGION", "L2_LOCAL", "L3_POI"] as const;
export type AtlasDetailLevel = (typeof atlasDetailLevels)[number];
export const atlasV2RegionRoles = ["TOP_LEVEL_LAND", "MAJOR_WATER", "NESTED_GEOGRAPHY"] as const;
export type AtlasV2RegionRole = (typeof atlasV2RegionRoles)[number];

export type AtlasV2RegionProjection = {
  id: string;
  placementId: string;
  entryId: string;
  slug: string;
  title: string;
  summary: string | null;
  status: string;
  role: AtlasV2RegionRole;
  detailLevel: AtlasDetailLevel;
  parentSlug: string | null;
  childSlugs: readonly string[];
  neighbors: readonly string[];
  geometry: AtlasPolygonGeometry | AtlasMultiPolygonGeometry;
  bounds: readonly [minX: number, minY: number, maxX: number, maxY: number];
  labelAnchor: StoryMapPoint;
  minZoom: number;
  maxZoom: number | null;
  childMap: StoryAtlasMapLink | null;
};

export type AtlasV2ConnectionProjection = {
  id: string;
  fromSlug: string;
  toSlug: string;
  type: string;
  directionality: string;
  status: string;
  visibility: string;
  hasPath: boolean;
};

export type AtlasV2ConnectionPathProjection = {
  id: string;
  connectionId: string;
  fromSlug: string;
  toSlug: string;
  type: string;
  geometry: AtlasLineGeometry | AtlasMultiLineGeometry;
  minZoom: number;
  maxZoom: number | null;
  priority: number;
  version: number;
};

export type AtlasV2Projection = {
  contract: "martino-story-atlas-v2";
  contractVersion: 1;
  projectionVersion: "V2";
  revisionCursor: string | null;
  scene: {
    id: string;
    slug: string;
    title: string;
    artVersion: string;
    imageUrl: string;
    imageWidth: number;
    imageHeight: number;
    coordinateWidth: number;
    coordinateHeight: number;
    initialCenter: StoryMapPoint;
    initialZoom: number;
    minZoom: number;
    maxZoom: number;
    parentMap: StoryAtlasMapLink | null;
  };
  regions: readonly AtlasV2RegionProjection[];
  points: readonly StoryAtlasFeature[];
  questNodes: readonly StoryAtlasFeature[];
  connections: readonly AtlasV2ConnectionProjection[];
  connectionPaths: readonly AtlasV2ConnectionPathProjection[];
  hierarchy: readonly { slug: string; parentSlug: string | null; childSlugs: readonly string[] }[];
  counts: {
    regions: number;
    topLevelRegions: number;
    nestedRegions: number;
    points: number;
    questNodes: number;
    connections: number;
    connectionPaths: number;
  };
};
