/**
 * Complete, read-only Story Codex handoff for trusted machines on the Habitat
 * LAN. This is deliberately separate from MartinoStoryExport: that contract is
 * a canon-only game-build feed, while this bundle is the full writers' room
 * resource library (including non-canon work and its artwork).
 */

export const codexBundleContractVersion = 2 as const;

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
  assets: number;
};

export type CodexBundleManifest = {
  contract: "martino-codex-bundle";
  contractVersion: typeof codexBundleContractVersion;
  snapshotId: string;
  generatedAt: string;
  revisionCursor: string | null;
  sourceContentSha256: string;
  counts: CodexBundleCounts;
  content: CodexBundleFile;
  compatibility: CodexBundleFile;
  assets: CodexBundleAsset[];
};

export type CodexBundlePointer = {
  contract: "martino-codex-pointer";
  contractVersion: typeof codexBundleContractVersion;
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
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isSha256(value: unknown): value is string {
  return typeof value === "string" && /^[a-f0-9]{64}$/.test(value);
}

export function isCodexBundlePointer(value: unknown): value is CodexBundlePointer {
  if (!isRecord(value)) return false;
  return (
    value.contract === "martino-codex-pointer" &&
    value.contractVersion === codexBundleContractVersion &&
    typeof value.snapshotId === "string" &&
    typeof value.generatedAt === "string" &&
    typeof value.manifestPath === "string" &&
    isSha256(value.manifestSha256) &&
    isSha256(value.sourceContentSha256)
  );
}

export function isCodexBundleManifest(value: unknown): value is CodexBundleManifest {
  if (!isRecord(value) || !isRecord(value.content) || !isRecord(value.compatibility)) return false;
  return (
    value.contract === "martino-codex-bundle" &&
    value.contractVersion === codexBundleContractVersion &&
    typeof value.snapshotId === "string" &&
    typeof value.generatedAt === "string" &&
    (value.revisionCursor === null || typeof value.revisionCursor === "string") &&
    isSha256(value.sourceContentSha256) &&
    Array.isArray(value.assets)
  );
}
