import type { AtlasMultiPolygonGeometry, AtlasPolygonGeometry } from "./atlas-geometry";

export const atlasSpatialLayerKinds = [
  "BASE_GEOGRAPHY",
  "BIOME",
  "FACTION_INFLUENCE",
  "POLITICAL_CONTROL",
  "MILITARY_CONTROL",
  "CORRUPTION",
  "NARRATIVE_AREA",
  "RESOURCE_AREA",
  "OTHER",
] as const;
export type AtlasSpatialLayerKind = (typeof atlasSpatialLayerKinds)[number];

export const atlasSpatialGeometryModes = ["SHARED_TOPOLOGY", "INDEPENDENT_OVERLAY"] as const;
export type AtlasSpatialGeometryMode = (typeof atlasSpatialGeometryModes)[number];

export type AtlasSpatialLayerContract = {
  readonly kind: AtlasSpatialLayerKind;
  readonly geometryMode: AtlasSpatialGeometryMode;
};

export type AtlasIndependentArea = {
  readonly id: string;
  readonly mapSlug: string;
  readonly layerKind: Exclude<AtlasSpatialLayerKind, "BASE_GEOGRAPHY">;
  readonly geometry: AtlasPolygonGeometry | AtlasMultiPolygonGeometry;
  readonly version: number;
};

export function atlasSpatialGeometryMode(kind: AtlasSpatialLayerKind): AtlasSpatialGeometryMode {
  return kind === "BASE_GEOGRAPHY" ? "SHARED_TOPOLOGY" : "INDEPENDENT_OVERLAY";
}

export function isAtlasSpatialLayerKind(value: unknown): value is AtlasSpatialLayerKind {
  return typeof value === "string" && (atlasSpatialLayerKinds as readonly string[]).includes(value);
}

