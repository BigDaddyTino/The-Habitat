import type { AtlasV2RegionProjection, StoryAtlasFeature } from "@habitat/shared";
export type AtlasV2DisplayLevel = "WORLD" | "REGION" | "LOCAL" | "POI";
export function atlasV2DisplayLevel(zoom: number): AtlasV2DisplayLevel { return zoom >= 3.3 ? "POI" : zoom >= 2.35 ? "LOCAL" : zoom >= 1.35 ? "REGION" : "WORLD"; }
export function isAtlasV2FeatureVisible(feature: StoryAtlasFeature, zoom: number) { return zoom >= feature.minZoom && (feature.maxZoom === null || zoom <= feature.maxZoom); }
export function atlasV2Hash(slug: string | null) { return slug ? `#atlas-v2=${slug}` : ""; }
export function parseAtlasV2Hash(hash: string) { return /^#atlas-v2=([a-z0-9-]+)$/.exec(hash)?.[1] ?? null; }
export function atlasV2Breadcrumbs(regions: readonly AtlasV2RegionProjection[], selectedSlug: string | null) { const bySlug = new Map(regions.map((region) => [region.slug, region])); const ancestors: AtlasV2RegionProjection[] = []; for (let current = selectedSlug ? bySlug.get(selectedSlug) : undefined; current; current = current.parentSlug ? bySlug.get(current.parentSlug) : undefined) ancestors.unshift(current); return ancestors; }
