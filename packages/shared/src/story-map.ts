/**
 * Engine-neutral atlas contract shared by the Codex website and the trusted
 * game-computer bundle. Coordinates use a top-left origin within each scene's
 * declared normalized extent; the web renderer performs its own Y transform.
 */

export const storyMapGeometryKinds = ["POINT", "POLYGON", "MULTIPOLYGON"] as const;
export type StoryMapGeometryKind = (typeof storyMapGeometryKinds)[number];

/**
 * Art versions activate a scene for trusted machine export only when they are
 * explicit numbered releases. Values such as `foundation` remain available to
 * internal authoring without becoming a broken game/player map.
 */
export function isPublishedStoryMapArtVersion(value: string) {
  return /^v[1-9][0-9]*$/.test(value);
}

export type StoryMapPoint = readonly [x: number, y: number];
export type StoryMapGeometry =
  | { type: "POINT"; coordinates: StoryMapPoint }
  | { type: "POLYGON"; coordinates: readonly (readonly StoryMapPoint[])[] }
  | { type: "MULTIPOLYGON"; coordinates: readonly (readonly (readonly StoryMapPoint[])[])[] };

export const storyAtlasLayers = ["REGION", "SETTLEMENT", "POI", "QUEST", "SYSTEM"] as const;
export type StoryAtlasLayer = (typeof storyAtlasLayers)[number];

export type StoryAtlasQuest = {
  slug: string;
  title: string;
  category: string;
  status: string;
  nodeKey: string | null;
};

export type StoryAtlasMapLink = {
  slug: string;
  title: string;
};

export type StoryAtlasFeature = {
  placementId: string;
  source: "ENTRY" | "NODE";
  entryId: string | null;
  nodeId: string | null;
  slug: string;
  title: string;
  summary: string | null;
  body: string | null;
  status: string;
  layer: StoryAtlasLayer;
  geometry: StoryMapGeometry;
  label: StoryMapPoint | null;
  minZoom: number;
  maxZoom: number | null;
  priority: number;
  childMap: StoryAtlasMapLink | null;
  place: {
    type: string | null;
    settlementTier: string | null;
    biome: string | null;
    population: string | null;
    condition: string | null;
    control: readonly { slug: string; title: string; kind: string | null }[];
    soulForge: string | null;
    veilAnchorTier: string | null;
  } | null;
  quests: readonly StoryAtlasQuest[];
};

export type StoryAtlasProjection = {
  contract: "martino-story-atlas";
  contractVersion: 1;
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
  features: readonly StoryAtlasFeature[];
  counts: {
    placed: number;
    regions: number;
    settlements: number;
    pois: number;
    quests: number;
  };
};

export function isStoryMapPoint(value: unknown, width: number, height: number): value is StoryMapPoint {
  return Array.isArray(value) && value.length === 2 && value.every(Number.isFinite) && value[0] >= 0 && value[0] <= width && value[1] >= 0 && value[1] <= height;
}

export function parseStoryMapGeometry(value: unknown, width: number, height: number): StoryMapGeometry | null {
  if (!value || typeof value !== "object") return null;
  const candidate = value as { type?: unknown; coordinates?: unknown };
  if (candidate.type === "POINT") return isStoryMapPoint(candidate.coordinates, width, height) ? { type: "POINT", coordinates: candidate.coordinates } : null;
  if (candidate.type === "POLYGON" && Array.isArray(candidate.coordinates)) {
    const valid = candidate.coordinates.every((ring) => Array.isArray(ring) && ring.length >= 4 && ring.every((point) => isStoryMapPoint(point, width, height)));
    return valid ? { type: "POLYGON", coordinates: candidate.coordinates as StoryMapGeometry & never } : null;
  }
  if (candidate.type === "MULTIPOLYGON" && Array.isArray(candidate.coordinates)) {
    const valid = candidate.coordinates.every((polygon) => Array.isArray(polygon) && polygon.every((ring) => Array.isArray(ring) && ring.length >= 4 && ring.every((point) => isStoryMapPoint(point, width, height))));
    return valid ? { type: "MULTIPOLYGON", coordinates: candidate.coordinates as StoryMapGeometry & never } : null;
  }
  return null;
}
