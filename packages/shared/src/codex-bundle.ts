/**
 * Complete, read-only Story Codex handoff for trusted machines on the Habitat
 * LAN. This is deliberately separate from MartinoStoryExport: that contract is
 * a canon-only game-build feed, while this bundle is the full writers' room
 * resource library (including non-canon work and its artwork).
 */
import type { DialogueLineRecord, DialogueOptionRecord, StoryVoiceProfile, StoryVoiceStatus } from "./dialogue-lines";

/**
 * v5 (2026-09-02) is additive: nodes MAY carry structured `lines` (DIALOGUE
 * nodes MUST, empty only with `linesStatus: "NONE"`), CHOICE nodes carry
 * `options`, CHARACTER entries carry `meta.voiceProfile` + `meta.voiceStatus`,
 * and the manifest names a flattened `content/dialogue-lines.json` sidecar.
 * Nothing that existed in v4 changes shape, so a v4 reader keeps working, and
 * the readers here accept both versions.
 */
export const codexBundleContractVersion = 5 as const;

/** Bundle contract versions the readers on this side still understand. */
export const supportedCodexBundleContractVersions: readonly number[] = [4, 5];

/** The flattened dialogue sidecar's own contract. */
export const codexDialogueLinesContractVersion = 1 as const;


export type CodexJsonValue =
  | null
  | boolean
  | number
  | string
  | CodexJsonValue[]
  | { [key: string]: CodexJsonValue };

export type CodexBundleFile = {
  path: string;
  sha256: string;
  bytes: number;
};

export type CodexBundleAsset = CodexBundleFile & {
  logicalPath: string;
  mimeType: string;
  width: number | null;
  height: number | null;
};

export type CodexBundleCounts = {
  arcs: number;
  nodes: number;
  edges: number;
  entries: number;
  links: number;
  comments: number;
  revisions: number;
  maps: number;
  placements: number;
  nodePlacements: number;
  assets: number;
};

/**
 * Which named, frozen release the bundle's canon payload was taken from.
 *
 * Codex Sync publishes two different things and only one is game content. The
 * snapshot mirrors the codex and moves whenever the room does; the canon
 * payload is what an importer turns into assets, and since 2026-08-28 it comes
 * from a release rather than a live read. This records which one, so a
 * consumer can pin a name and a hash instead of trusting a timestamp.
 *
 * Optional because bundles published before the release boundary existed
 * genuinely do not have it — its absence means "this canon payload was read
 * live", which is exactly the thing the boundary was introduced to end.
 */
export type CodexBundleStoryRelease = {
  name: string;
  sha256: string;
  contractVersion: number;
  cutAt: string;
};

/** The dialogue sidecar's descriptor in the manifest (v5). */
export type CodexBundleDialogueLinesFile = CodexBundleFile & {
  contractVersion: typeof codexDialogueLinesContractVersion;
};

export type CodexBundleManifest = {
  contract: "martino-codex-bundle";
  /** 4 on bundles published before 2026-09-02; 5 since. */
  contractVersion: number;
  snapshotId: string;
  generatedAt: string;
  revisionCursor: string | null;
  sourceContentSha256: string;
  /** Absent on bundles published before the release boundary. */
  storyRelease?: CodexBundleStoryRelease;
  counts: CodexBundleCounts;
  content: CodexBundleFile;
  compatibility: CodexBundleFile;
  /** v5: the same file as `content`, named the way the game side reads it. */
  snapshot?: CodexBundleFile;
  /** v5: `content/dialogue-lines.json`, the flattened voiced-line view. */
  dialogueLines?: CodexBundleDialogueLinesFile;
  assets: CodexBundleAsset[];
};

export type CodexBundlePointer = {
  contract: "martino-codex-pointer";
  contractVersion: number;
  snapshotId: string;
  generatedAt: string;
  manifestPath: string;
  manifestSha256: string;
  sourceContentSha256: string;
};

export type CodexWriterAttribution = {
  displayName: string;
};

export type CodexSnapshotArc = {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  hook: string | null;
  regionSlug: string | null;
  isMainline: boolean;
  category: string;
  companionSlug: string | null;
  factionSlug: string | null;
  status: string;
  position: number;
  lockedAt: string | null;
  createdBy: CodexWriterAttribution;
  lockedBy: CodexWriterAttribution | null;
  createdAt: string;
  updatedAt: string;
};

export type CodexSnapshotNode = {
  id: string;
  arcId: string;
  key: string;
  kind: string;
  title: string;
  summary: string | null;
  body: string | null;
  status: string;
  speakerSlug: string | null;
  endingKind: string | null;
  completion: string | null;
  effects: string[];
  rewards: string[];
  continuesInArcSlug: string | null;
  canvasX: number;
  canvasY: number;
  version: number;
  createdBy: CodexWriterAttribution;
  updatedBy: CodexWriterAttribution | null;
  createdAt: string;
  updatedAt: string;
  /** v5: the node's spoken lines in order. Present on every node that has
   *  any, and always on DIALOGUE nodes (empty with `linesStatus: "NONE"`). */
  lines?: DialogueLineRecord[];
  /** v5: only ever "NONE", and only on a DIALOGUE node with no lines yet. */
  linesStatus?: "NONE";
  /** v5: CHOICE nodes only — one option per labelled outgoing edge. */
  options?: DialogueOptionRecord[];
};

export type CodexSnapshotEdge = {
  id: string;
  arcId: string;
  key: string;
  fromNodeId: string;
  toNodeId: string;
  label: string | null;
  condition: string | null;
  effects: string[];
  position: number;
  /** v5: whether a labelled option out of a CHOICE node is a spoken line. */
  voiced?: boolean;
  status: string;
  createdBy: CodexWriterAttribution;
  createdAt: string;
  updatedAt: string;
};

export type CodexSnapshotEntry = {
  id: string;
  kind: string;
  slug: string;
  title: string;
  summary: string | null;
  body: string | null;
  meta: CodexJsonValue;
  status: string;
  version: number;
  createdBy: CodexWriterAttribution;
  updatedBy: CodexWriterAttribution | null;
  createdAt: string;
  updatedAt: string;
};

export type CodexSnapshotLink = {
  id: string;
  nodeId: string;
  entryId: string;
  arcSlug: string;
  nodeKey: string;
  entrySlug: string;
  createdAt: string;
};

export type CodexSnapshotComment = {
  id: string;
  nodeId: string | null;
  entryId: string | null;
  body: string;
  author: CodexWriterAttribution;
  resolvedAt: string | null;
  resolvedBy: CodexWriterAttribution | null;
  createdAt: string;
};

export type CodexSnapshotRevision = {
  id: string;
  entityType: string;
  entityId: string;
  arcId: string | null;
  action: string;
  actor: CodexWriterAttribution;
  summary: string;
  before: CodexJsonValue;
  after: CodexJsonValue;
  createdAt: string;
};

export type CodexSnapshotMap = {
  id: string;
  slug: string;
  title: string;
  parentMapSlug: string | null;
  ownerEntrySlug: string | null;
  artVersion: string;
  artLogicalPath: string;
  imageWidth: number;
  imageHeight: number;
  coordinateWidth: number;
  coordinateHeight: number;
  initialCenter: readonly [number, number];
  initialZoom: number;
  minZoom: number;
  maxZoom: number;
  version: number;
  createdAt: string;
  updatedAt: string;
};

export type CodexSnapshotMapPlacement = {
  id: string;
  mapSlug: string;
  entrySlug: string;
  geometryKind: string;
  geometry: CodexJsonValue;
  label: readonly [number, number] | null;
  minZoom: number;
  maxZoom: number | null;
  priority: number;
  version: number;
  createdAt: string;
  updatedAt: string;
};

export type CodexSnapshotMapNodePlacement = {
  id: string;
  mapSlug: string;
  arcSlug: string;
  nodeKey: string;
  geometryKind: string;
  geometry: CodexJsonValue;
  label: readonly [number, number] | null;
  minZoom: number;
  maxZoom: number | null;
  priority: number;
  version: number;
  createdAt: string;
  updatedAt: string;
};

/**
 * `content/dialogue-lines.json` (v5): every line in the snapshot, flattened
 * with its arc and node, plus the voice profiles of everyone who speaks.
 * Deterministic bytes for identical input: sorted by arc slug, then the
 * node's canvas order (canvasY, canvasX, key), then line order.
 */
export type CodexDialogueLine = DialogueLineRecord & {
  arcSlug: string;
  nodeKey: string;
  nodeKind: string;
  nodeId: string;
};

export type MartinoCodexDialogueLines = {
  contract: "martino-codex-dialogue-lines";
  contractVersion: typeof codexDialogueLinesContractVersion;
  snapshotId: string;
  generatedAt: string;
  sourceContentSha256: string;
  speakers: Record<string, { title: string; voiceProfile: StoryVoiceProfile; voiceStatus: StoryVoiceStatus }>;
  roles: Record<string, { title: string; voiceProfile: StoryVoiceProfile }>;
  lines: CodexDialogueLine[];
  counts: { lines: number; voiced: number; speakers: number; roles: number };
};

export type MartinoCodexSnapshot = {
  contract: "martino-codex-snapshot";
  contractVersion: typeof codexBundleContractVersion;
  generatedAt: string;
  revisionCursor: string | null;
  scope: {
    statuses: "ALL";
    entryKinds: "ALL";
    includesComments: true;
    includesRevisionHistory: true;
    excludesOperationalState: readonly ["presence", "courtesy-locks", "assistant-audit", "auth", "export-tokens"];
  };
  arcs: CodexSnapshotArc[];
  nodes: CodexSnapshotNode[];
  edges: CodexSnapshotEdge[];
  entries: CodexSnapshotEntry[];
  links: CodexSnapshotLink[];
  comments: CodexSnapshotComment[];
  revisions: CodexSnapshotRevision[];
  maps: CodexSnapshotMap[];
  placements: CodexSnapshotMapPlacement[];
  nodePlacements: CodexSnapshotMapNodePlacement[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isSha256(value: unknown): value is string {
  return typeof value === "string" && /^[a-f0-9]{64}$/.test(value);
}

function isSupportedContractVersion(value: unknown): value is number {
  return typeof value === "number" && supportedCodexBundleContractVersions.includes(value);
}

export function isCodexBundlePointer(value: unknown): value is CodexBundlePointer {
  if (!isRecord(value)) return false;
  return (
    value.contract === "martino-codex-pointer" &&
    isSupportedContractVersion(value.contractVersion) &&
    typeof value.snapshotId === "string" &&
    typeof value.generatedAt === "string" &&
    typeof value.manifestPath === "string" &&
    isSha256(value.manifestSha256) &&
    isSha256(value.sourceContentSha256)
  );
}

export function isCodexBundleManifest(value: unknown): value is CodexBundleManifest {
  if (!isRecord(value) || !isRecord(value.content) || !isRecord(value.compatibility)) return false;
  // A v5 manifest names the sidecar; a v4 one predates it. Either way the
  // descriptor, when present, must be a real file descriptor.
  if (value.dialogueLines !== undefined && !(isRecord(value.dialogueLines) && typeof value.dialogueLines.path === "string" && isSha256(value.dialogueLines.sha256))) return false;
  return (
    value.contract === "martino-codex-bundle" &&
    isSupportedContractVersion(value.contractVersion) &&
    typeof value.snapshotId === "string" &&
    typeof value.generatedAt === "string" &&
    (value.revisionCursor === null || typeof value.revisionCursor === "string") &&
    isSha256(value.sourceContentSha256) &&
    Array.isArray(value.assets)
  );
}
