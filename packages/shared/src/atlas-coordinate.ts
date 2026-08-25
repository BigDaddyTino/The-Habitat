/** Atlas 2.0 uses deterministic fixed-point scene coordinates. */
export const atlasCoordinateWidth = 100_000 as const;

declare const atlasFixedCoordinateBrand: unique symbol;
export type AtlasFixedCoordinate = number & { readonly [atlasFixedCoordinateBrand]: "AtlasFixedCoordinate" };

export type AtlasPoint = readonly [x: AtlasFixedCoordinate, y: AtlasFixedCoordinate];
export type AtlasNumericPoint = readonly [x: number, y: number];
export type AtlasPixelPoint = readonly [x: number, y: number];
export type AtlasOpenLayersPoint = readonly [x: number, y: number];

export type AtlasArtworkDimensions = {
  readonly width: number;
  readonly height: number;
};

export type AtlasCoordinateDimensions = {
  readonly width: typeof atlasCoordinateWidth;
  readonly height: number;
};

export type AtlasExtent = {
  readonly minX: 0;
  readonly minY: 0;
  readonly maxX: number;
  readonly maxY: number;
};

export type AtlasCoordinateIssue =
  | "NOT_FINITE"
  | "NOT_INTEGER"
  | "NEGATIVE"
  | "OUT_OF_BOUNDS"
  | "INVALID_DIMENSIONS"
  | "INVALID_COORDINATE_HEIGHT";

export type AtlasCoordinateResult<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly issue: AtlasCoordinateIssue };

export function validateAtlasArtworkDimensions(value: unknown): AtlasCoordinateResult<AtlasArtworkDimensions> {
  if (!value || typeof value !== "object") return { ok: false, issue: "INVALID_DIMENSIONS" };
  const candidate = value as { width?: unknown; height?: unknown };
  if (!Number.isFinite(candidate.width) || !Number.isFinite(candidate.height)) return { ok: false, issue: "INVALID_DIMENSIONS" };
  if (!Number.isInteger(candidate.width) || !Number.isInteger(candidate.height)) return { ok: false, issue: "INVALID_DIMENSIONS" };
  if ((candidate.width as number) <= 0 || (candidate.height as number) <= 0) return { ok: false, issue: "INVALID_DIMENSIONS" };
  return { ok: true, value: { width: candidate.width as number, height: candidate.height as number } };
}

export function deriveAtlasCoordinateDimensions(artwork: AtlasArtworkDimensions): AtlasCoordinateResult<AtlasCoordinateDimensions> {
  const dimensions = validateAtlasArtworkDimensions(artwork);
  if (!dimensions.ok) return dimensions;
  const height = Math.round(atlasCoordinateWidth * dimensions.value.height / dimensions.value.width);
  if (!Number.isSafeInteger(height) || height <= 0) return { ok: false, issue: "INVALID_COORDINATE_HEIGHT" };
  return { ok: true, value: { width: atlasCoordinateWidth, height } };
}

export function validateAtlasCoordinateDimensions(value: unknown, artwork?: AtlasArtworkDimensions): AtlasCoordinateResult<AtlasCoordinateDimensions> {
  if (!value || typeof value !== "object") return { ok: false, issue: "INVALID_DIMENSIONS" };
  const candidate = value as { width?: unknown; height?: unknown };
  if (candidate.width !== atlasCoordinateWidth || !Number.isSafeInteger(candidate.height) || (candidate.height as number) <= 0) {
    return { ok: false, issue: "INVALID_COORDINATE_HEIGHT" };
  }
  if (artwork) {
    const expected = deriveAtlasCoordinateDimensions(artwork);
    if (!expected.ok || expected.value.height !== candidate.height) return { ok: false, issue: "INVALID_COORDINATE_HEIGHT" };
  }
  return { ok: true, value: { width: atlasCoordinateWidth, height: candidate.height as number } };
}

export function atlasExtent(dimensions: AtlasCoordinateDimensions): AtlasExtent {
  return { minX: 0, minY: 0, maxX: dimensions.width, maxY: dimensions.height };
}

export function validateAtlasFixedCoordinate(value: unknown, maximum: number): AtlasCoordinateResult<AtlasFixedCoordinate> {
  if (!Number.isFinite(value)) return { ok: false, issue: "NOT_FINITE" };
  if (!Number.isInteger(value)) return { ok: false, issue: "NOT_INTEGER" };
  if ((value as number) < 0) return { ok: false, issue: "NEGATIVE" };
  if ((value as number) > maximum) return { ok: false, issue: "OUT_OF_BOUNDS" };
  return { ok: true, value: value as AtlasFixedCoordinate };
}

export function validateAtlasPoint(value: unknown, dimensions: AtlasCoordinateDimensions): AtlasCoordinateResult<AtlasPoint> {
  if (!Array.isArray(value) || value.length !== 2) return { ok: false, issue: "INVALID_DIMENSIONS" };
  const x = validateAtlasFixedCoordinate(value[0], dimensions.width);
  if (!x.ok) return x;
  const y = validateAtlasFixedCoordinate(value[1], dimensions.height);
  if (!y.ok) return y;
  return { ok: true, value: [x.value, y.value] };
}

export function atlasPointToPixel(point: AtlasNumericPoint, coordinates: AtlasCoordinateDimensions, artwork: AtlasArtworkDimensions): AtlasPixelPoint {
  return [point[0] / coordinates.width * artwork.width, point[1] / coordinates.height * artwork.height];
}

export function pixelPointToAtlas(point: AtlasPixelPoint, artwork: AtlasArtworkDimensions, coordinates: AtlasCoordinateDimensions): AtlasNumericPoint {
  return [Math.round(point[0] / artwork.width * coordinates.width), Math.round(point[1] / artwork.height * coordinates.height)];
}

export function atlasPointToOpenLayers(point: AtlasNumericPoint, coordinates: AtlasCoordinateDimensions): AtlasOpenLayersPoint {
  return [point[0], coordinates.height - point[1]];
}

export function openLayersPointToAtlas(point: AtlasOpenLayersPoint, coordinates: AtlasCoordinateDimensions): AtlasNumericPoint {
  return [Math.round(point[0]), Math.round(coordinates.height - point[1])];
}

export function artworkHasCanonicalAspectRatio(left: AtlasArtworkDimensions, right: AtlasArtworkDimensions) {
  const leftValid = validateAtlasArtworkDimensions(left);
  const rightValid = validateAtlasArtworkDimensions(right);
  if (!leftValid.ok || !rightValid.ok) return false;
  return left.width * right.height === right.width * left.height;
}

