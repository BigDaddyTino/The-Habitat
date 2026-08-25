import type { AtlasLineGeometry, AtlasMultiLineGeometry } from "./atlas-geometry";
import type { AtlasCoordinateDimensions } from "./atlas-coordinate";
import { validateAtlasLineString, validateAtlasMultiLineString } from "./atlas-geometry";
import { atlasFinding, atlasValidationResult, type AtlasValidationFinding, type AtlasValidationResult } from "./atlas-validation";

// Prompt 2 vocabulary is intentionally limited to concepts present in the 25
// inspected legacy rows. It is additive when canon authors a new route kind.
export const atlasWorldConnectionTypes = ["ROAD", "TRAIL", "RIVER_TRAVEL", "SEA_ROUTE", "AIR_ROUTE", "OTHER", "UNKNOWN"] as const;
export type AtlasWorldConnectionType = (typeof atlasWorldConnectionTypes)[number];

export const atlasConnectionDirectionalities = ["UNSPECIFIED", "FROM_TO", "TO_FROM", "BIDIRECTIONAL"] as const;
export type AtlasConnectionDirectionality = (typeof atlasConnectionDirectionalities)[number];

export const atlasConnectionStatuses = ["UNSPECIFIED", "OPEN", "CLOSED", "DESTROYED"] as const;
export type AtlasConnectionStatus = (typeof atlasConnectionStatuses)[number];

// This is editorial/cartographic visibility only. It is not player discovery.
export const atlasConnectionVisibilityPolicies = ["DEFAULT", "HIDDEN"] as const;
export type AtlasConnectionVisibilityPolicy = (typeof atlasConnectionVisibilityPolicies)[number];

export type AtlasMetadataScalar = string | number | boolean | null;
export type AtlasMetadataValue = AtlasMetadataScalar | readonly AtlasMetadataValue[] | { readonly [key: string]: AtlasMetadataValue };
export type AtlasBoundedMetadata = Readonly<Record<string, AtlasMetadataValue>>;

export const atlasConnectionLimits = {
  maxMetadataBytes: 8_192,
  maxMetadataDepth: 4,
  maxMetadataKeys: 32,
  maxMetadataArrayItems: 64,
  maxMetadataStringLength: 1_000,
  maxNotesLength: 2_000,
} as const;

export type AtlasWorldConnection = {
  readonly id: string;
  readonly fromEntryId: string;
  readonly toEntryId: string;
  readonly type: AtlasWorldConnectionType;
  readonly directionality: AtlasConnectionDirectionality;
  readonly status: AtlasConnectionStatus;
  readonly visibility: AtlasConnectionVisibilityPolicy;
  readonly originalWording: string | null;
  readonly editorialNotes: string | null;
  readonly metadata: AtlasBoundedMetadata;
  readonly version: number;
};

export type AtlasMapConnectionPath = {
  readonly id: string;
  readonly connectionId: string;
  readonly mapSlug: string;
  readonly geometry: AtlasLineGeometry | AtlasMultiLineGeometry;
  readonly minZoom: number;
  readonly maxZoom: number | null;
  readonly priority: number;
  readonly version: number;
};

function validConnectionIdentity(value: unknown) {
  return typeof value === "string" && value.length > 0 && value.length <= 128;
}

function validConnectionVersion(value: unknown) {
  return Number.isSafeInteger(value) && (value as number) >= 1;
}

export function validateAtlasWorldConnection(value: unknown, path = "connection"): AtlasValidationResult<AtlasWorldConnection> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return atlasValidationResult<AtlasWorldConnection>(null, [atlasFinding("ERROR", "CONNECTION_SHAPE", path, "World connection must be an object.")]);
  const candidate = value as Partial<AtlasWorldConnection>;
  const findings: AtlasValidationFinding[] = [];
  for (const [key, identity] of [["id", candidate.id], ["fromEntryId", candidate.fromEntryId], ["toEntryId", candidate.toEntryId]] as const) {
    if (!validConnectionIdentity(identity)) findings.push(atlasFinding("ERROR", "CONNECTION_IDENTITY", `${path}.${key}`, "Connection identities must be non-empty bounded strings."));
  }
  if (validConnectionIdentity(candidate.fromEntryId) && candidate.fromEntryId === candidate.toEntryId) findings.push(atlasFinding("ERROR", "CONNECTION_SAME_ENDPOINT", path, "A world connection requires two distinct canonical endpoints."));
  if (!(atlasWorldConnectionTypes as readonly unknown[]).includes(candidate.type)) findings.push(atlasFinding("ERROR", "CONNECTION_TYPE", `${path}.type`, "Unsupported connection type."));
  if (!(atlasConnectionDirectionalities as readonly unknown[]).includes(candidate.directionality)) findings.push(atlasFinding("ERROR", "CONNECTION_DIRECTIONALITY", `${path}.directionality`, "Unsupported connection directionality."));
  if (!(atlasConnectionStatuses as readonly unknown[]).includes(candidate.status)) findings.push(atlasFinding("ERROR", "CONNECTION_STATUS", `${path}.status`, "Unsupported connection status."));
  if (!(atlasConnectionVisibilityPolicies as readonly unknown[]).includes(candidate.visibility)) findings.push(atlasFinding("ERROR", "CONNECTION_VISIBILITY", `${path}.visibility`, "Unsupported editorial visibility policy."));
  for (const [key, notes] of [["originalWording", candidate.originalWording], ["editorialNotes", candidate.editorialNotes]] as const) {
    if (notes !== null && (typeof notes !== "string" || notes.length > atlasConnectionLimits.maxNotesLength)) findings.push(atlasFinding("ERROR", "CONNECTION_NOTES_LIMIT", `${path}.${key}`, `Connection wording and notes must be null or at most ${atlasConnectionLimits.maxNotesLength} characters.`));
  }
  const metadata = validateAtlasBoundedMetadata(candidate.metadata, `${path}.metadata`);
  findings.push(...metadata.findings);
  if (!validConnectionVersion(candidate.version)) findings.push(atlasFinding("ERROR", "CONNECTION_VERSION", `${path}.version`, "Version must be a positive integer."));
  return atlasValidationResult<AtlasWorldConnection>(findings.some((finding) => finding.severity === "ERROR" || finding.severity === "FATAL") ? null : candidate as AtlasWorldConnection, findings);
}

export function validateAtlasMapConnectionPath(value: unknown, dimensions: AtlasCoordinateDimensions, path = "connectionPath"): AtlasValidationResult<AtlasMapConnectionPath> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return atlasValidationResult<AtlasMapConnectionPath>(null, [atlasFinding("ERROR", "CONNECTION_PATH_SHAPE", path, "Map connection path must be an object.")]);
  const candidate = value as Partial<AtlasMapConnectionPath>;
  const findings: AtlasValidationFinding[] = [];
  for (const [key, identity] of [["id", candidate.id], ["connectionId", candidate.connectionId], ["mapSlug", candidate.mapSlug]] as const) {
    if (!validConnectionIdentity(identity)) findings.push(atlasFinding("ERROR", "CONNECTION_IDENTITY", `${path}.${key}`, "Connection-path identities must be non-empty bounded strings."));
  }
  if (!candidate.geometry || typeof candidate.geometry !== "object") findings.push(atlasFinding("ERROR", "CONNECTION_PATH_GEOMETRY", `${path}.geometry`, "Connection path requires line or multiline geometry."));
  else if (candidate.geometry.type === "LINESTRING") {
    const geometry = validateAtlasLineString(candidate.geometry.coordinates, dimensions, `${path}.geometry.coordinates`);
    findings.push(...geometry.findings);
  } else if (candidate.geometry.type === "MULTILINESTRING") {
    const geometry = validateAtlasMultiLineString(candidate.geometry.coordinates, dimensions, `${path}.geometry.coordinates`);
    findings.push(...geometry.findings);
  } else findings.push(atlasFinding("ERROR", "CONNECTION_PATH_GEOMETRY", `${path}.geometry.type`, "Connection path geometry must be LINESTRING or MULTILINESTRING."));
  if (!Number.isFinite(candidate.minZoom) || (candidate.minZoom as number) < 0) findings.push(atlasFinding("ERROR", "CONNECTION_PATH_ZOOM", `${path}.minZoom`, "Minimum zoom must be finite and non-negative."));
  if (candidate.maxZoom !== null && (!Number.isFinite(candidate.maxZoom) || (candidate.maxZoom as number) < (candidate.minZoom as number))) findings.push(atlasFinding("ERROR", "CONNECTION_PATH_ZOOM", `${path}.maxZoom`, "Maximum zoom must be null or finite and not below minimum zoom."));
  if (!Number.isSafeInteger(candidate.priority)) findings.push(atlasFinding("ERROR", "CONNECTION_PATH_PRIORITY", `${path}.priority`, "Display priority must be a safe integer."));
  if (!validConnectionVersion(candidate.version)) findings.push(atlasFinding("ERROR", "CONNECTION_VERSION", `${path}.version`, "Version must be a positive integer."));
  return atlasValidationResult<AtlasMapConnectionPath>(findings.some((finding) => finding.severity === "ERROR" || finding.severity === "FATAL") ? null : candidate as AtlasMapConnectionPath, findings);
}

export type AtlasLegacyConnectionClassification = {
  readonly type: AtlasWorldConnectionType;
  readonly ambiguous: boolean;
  readonly reason: string;
};

export function classifyLegacyAtlasConnectionWording(value: unknown): AtlasLegacyConnectionClassification {
  if (typeof value !== "string" || !value.trim()) return { type: "UNKNOWN", ambiguous: true, reason: "No route wording was authored." };
  const wording = value.trim().toLowerCase();
  if (/\b(skybridge|aerial|air)\b/.test(wording)) return { type: "AIR_ROUTE", ambiguous: false, reason: "Authored wording explicitly names aerial transit." };
  if (/\bsea\b/.test(wording)) return { type: "SEA_ROUTE", ambiguous: false, reason: "Authored wording explicitly names sea travel." };
  if (/\btrail\b/.test(wording)) return { type: "TRAIL", ambiguous: false, reason: "Authored wording explicitly names a trail." };
  if (/\broad\b/.test(wording)) return { type: "ROAD", ambiguous: false, reason: "Authored wording explicitly names a road." };
  if (/\b(river|waterfall|waterfalls)\b/.test(wording)) return { type: "RIVER_TRAVEL", ambiguous: false, reason: "Authored wording names a river or waterfall corridor." };
  return { type: "OTHER", ambiguous: true, reason: "Authored wording is preserved but does not safely map to a controlled transport type." };
}

export type AtlasConnectionEndpointCandidate = {
  readonly id: string;
  readonly slug: string;
  readonly title: string;
  readonly kind: string;
  readonly status: string;
};

export type AtlasConnectionEndpointResolution =
  | { readonly status: "RESOLVED"; readonly method: "SLUG" | "TITLE"; readonly target: AtlasConnectionEndpointCandidate }
  | { readonly status: "UNRESOLVED"; readonly method: null; readonly target: null }
  | { readonly status: "AMBIGUOUS"; readonly method: "TITLE"; readonly target: null };

export function resolveAtlasConnectionEndpoint(value: unknown, candidates: readonly AtlasConnectionEndpointCandidate[]): AtlasConnectionEndpointResolution {
  if (typeof value !== "string" || !value.trim()) return { status: "UNRESOLVED", method: null, target: null };
  const authored = value.trim();
  const slug = candidates.find((candidate) => candidate.slug === authored);
  if (slug) return { status: "RESOLVED", method: "SLUG", target: slug };
  const titles = candidates.filter((candidate) => candidate.title === authored);
  if (titles.length === 1) return { status: "RESOLVED", method: "TITLE", target: titles[0]! };
  if (titles.length > 1) return { status: "AMBIGUOUS", method: "TITLE", target: null };
  return { status: "UNRESOLVED", method: null, target: null };
}

export type AtlasLegacyConnectionLocator = {
  readonly locator: string;
  readonly sourceSlug: string;
  readonly resolvedTargetSlug: string | null;
};

export function findAtlasReciprocalCandidates(rows: readonly AtlasLegacyConnectionLocator[]) {
  const byPair = new Map<string, string[]>();
  for (const row of rows) {
    if (!row.resolvedTargetSlug) continue;
    const key = `${row.sourceSlug}>${row.resolvedTargetSlug}`;
    const locators = byPair.get(key) ?? [];
    locators.push(row.locator);
    byPair.set(key, locators);
  }
  const result = new Map<string, readonly string[]>();
  for (const row of rows) {
    if (!row.resolvedTargetSlug) { result.set(row.locator, []); continue; }
    result.set(row.locator, [...(byPair.get(`${row.resolvedTargetSlug}>${row.sourceSlug}`) ?? [])].sort());
  }
  return result;
}

function validateMetadataValue(value: unknown, path: string, depth: number, findings: AtlasValidationFinding[]): value is AtlasMetadataValue {
  if (value === null || typeof value === "boolean") return true;
  if (typeof value === "number") {
    if (!Number.isFinite(value)) findings.push(atlasFinding("ERROR", "CONNECTION_METADATA_NUMBER", path, "Metadata numbers must be finite."));
    return Number.isFinite(value);
  }
  if (typeof value === "string") {
    if (value.length > atlasConnectionLimits.maxMetadataStringLength) findings.push(atlasFinding("ERROR", "CONNECTION_METADATA_STRING_LIMIT", path, "Metadata string limit exceeded."));
    return value.length <= atlasConnectionLimits.maxMetadataStringLength;
  }
  if (depth >= atlasConnectionLimits.maxMetadataDepth) {
    findings.push(atlasFinding("ERROR", "CONNECTION_METADATA_DEPTH", path, "Metadata nesting limit exceeded."));
    return false;
  }
  if (Array.isArray(value)) {
    if (value.length > atlasConnectionLimits.maxMetadataArrayItems) findings.push(atlasFinding("ERROR", "CONNECTION_METADATA_ARRAY_LIMIT", path, "Metadata array limit exceeded."));
    return value.length <= atlasConnectionLimits.maxMetadataArrayItems && value.every((item, index) => validateMetadataValue(item, `${path}[${index}]`, depth + 1, findings));
  }
  if (value && typeof value === "object") {
    const entries = Object.entries(value);
    if (entries.length > atlasConnectionLimits.maxMetadataKeys) findings.push(atlasFinding("ERROR", "CONNECTION_METADATA_KEY_LIMIT", path, "Metadata object key limit exceeded."));
    return entries.length <= atlasConnectionLimits.maxMetadataKeys && entries.every(([key, item]) => key.length > 0 && key.length <= 80 && validateMetadataValue(item, `${path}.${key}`, depth + 1, findings));
  }
  findings.push(atlasFinding("ERROR", "CONNECTION_METADATA_TYPE", path, "Unsupported metadata value."));
  return false;
}

export function validateAtlasBoundedMetadata(value: unknown, path = "metadata"): AtlasValidationResult<AtlasBoundedMetadata> {
  const findings: AtlasValidationFinding[] = [];
  if (!value || typeof value !== "object" || Array.isArray(value)) return atlasValidationResult<AtlasBoundedMetadata>(null, [atlasFinding("ERROR", "CONNECTION_METADATA_SHAPE", path, "Connection metadata must be an object.")]);
  const valid = validateMetadataValue(value, path, 0, findings);
  let bytes = Number.POSITIVE_INFINITY;
  try {
    bytes = 0;
    for (const character of JSON.stringify(value)) {
      const codePoint = character.codePointAt(0)!;
      bytes += codePoint <= 0x7f ? 1 : codePoint <= 0x7ff ? 2 : codePoint <= 0xffff ? 3 : 4;
    }
  } catch { findings.push(atlasFinding("ERROR", "CONNECTION_METADATA_SERIALIZE", path, "Connection metadata cannot be serialized.")); }
  if (bytes > atlasConnectionLimits.maxMetadataBytes) findings.push(atlasFinding("ERROR", "CONNECTION_METADATA_BYTE_LIMIT", path, "Connection metadata byte limit exceeded."));
  return atlasValidationResult(valid ? value as AtlasBoundedMetadata : null, findings);
}
