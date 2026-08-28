import { readFile } from "node:fs/promises";
import path from "node:path";
import { isCodexBundleManifest, type CodexBundleManifest, type MartinoStoryExport, type StoryExportArc, type StoryExportEntry, type StoryExportNode } from "@habitat/shared";
import { jsonBytes, readJson, replaceFileAtomically, resolveBundlePath } from "./integrity";
import { mirrorCodexBundle, readAndVerifyBundle, type VerifiedBundle } from "./mirror";

/**
 * The reference importer: what the machine building the game does with a
 * bundle, written as runnable code rather than as a paragraph somebody has to
 * reimplement from memory.
 *
 * The verification half already existed — `readAndVerifyBundle` refuses an
 * unsupported contract, checks the manifest against the pointer, and hashes
 * every file — and staging already existed as `mirrorCodexBundle`, which
 * copies into a fresh directory, verifies each copy, and never deletes an old
 * release. What was missing is everything that makes an import *safe to
 * repeat*: knowing what would change before it changes, recording what was
 * actually taken, and being able to go back.
 *
 * Two pointers, deliberately:
 *
 *  - `current.json` in the import root is the mirror's, and means "the newest
 *    release copied and verified locally".
 *  - `imported.json` beside it is this ledger, and means "the release the game
 *    is actually built from".
 *
 * They are usually the same and are allowed not to be. A rollback moves the
 * ledger and leaves the mirror alone, which is what makes it a rollback rather
 * than a deletion, and the build reads the ledger.
 */

export const codexImportLedgerVersion = 1 as const;

export type CodexImportRecord = {
  snapshotId: string;
  sourceContentSha256: string;
  /** The named release the canon payload came from; absent on pre-boundary bundles. */
  storyRelease: { name: string; sha256: string; cutAt: string } | null;
  importedAt: string;
  /** Relative to the import root, so a moved cache stays valid. */
  releasePath: string;
  assets: number;
};

export type CodexImportLedger = {
  contract: "martino-codex-import";
  contractVersion: typeof codexImportLedgerVersion;
  /** snapshotId of the record the game is built from, or null before the first import. */
  current: string | null;
  /** Newest first. Never truncated here — a record is the only route back. */
  history: CodexImportRecord[];
};

const emptyLedger: CodexImportLedger = { contract: "martino-codex-import", contractVersion: codexImportLedgerVersion, current: null, history: [] };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isImportRecord(value: unknown): value is CodexImportRecord {
  return isRecord(value)
    && typeof value.snapshotId === "string"
    && typeof value.sourceContentSha256 === "string"
    && typeof value.importedAt === "string"
    && typeof value.releasePath === "string";
}

export function isCodexImportLedger(value: unknown): value is CodexImportLedger {
  return isRecord(value)
    && value.contract === "martino-codex-import"
    && value.contractVersion === codexImportLedgerVersion
    && (value.current === null || typeof value.current === "string")
    && Array.isArray(value.history)
    && value.history.every(isImportRecord);
}

const ledgerPath = (importRoot: string) => path.join(importRoot, "imported.json");

export async function readImportLedger(importRoot: string): Promise<CodexImportLedger> {
  try {
    const value = await readJson(ledgerPath(importRoot));
    if (!isCodexImportLedger(value)) throw new Error("The import ledger exists but is not a ledger this version understands.");
    return value;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return emptyLedger;
    throw error;
  }
}

async function writeImportLedger(importRoot: string, ledger: CodexImportLedger) {
  await replaceFileAtomically(ledgerPath(importRoot), jsonBytes(ledger));
}

// ---------------------------------------------------------------------------
// The diff
// ---------------------------------------------------------------------------

/**
 * Object identity, frozen.
 *
 * These are not invented here. The codex already treats an arc slug and a node
 * key as export identities that renaming never moves, which is what lets an
 * importer keep a game asset attached to a story object across a rewrite. This
 * function is only where that law is written down as code.
 */
export const codexObjectId = {
  arc: (arc: StoryExportArc) => arc.slug,
  node: (arcSlug: string, node: StoryExportNode) => `${arcSlug}/${node.key}`,
  choice: (arcSlug: string, nodeKey: string, choiceKey: string) => `${arcSlug}/${nodeKey}#${choiceKey}`,
  entry: (entry: StoryExportEntry) => `${entry.kind}:${entry.slug}`,
};

/** Key order is not part of the contract, so comparison must not depend on it. */
function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value) ?? "null";
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  const entries = Object.entries(value as Record<string, unknown>).filter(([, item]) => item !== undefined).sort(([left], [right]) => left.localeCompare(right));
  return `{${entries.map(([key, item]) => `${JSON.stringify(key)}:${stableStringify(item)}`).join(",")}}`;
}

export type CodexObjectChange = { added: string[]; changed: string[]; removed: string[] };

export type CodexImportDiff = {
  arcs: CodexObjectChange;
  nodes: CodexObjectChange;
  choices: CodexObjectChange;
  entries: CodexObjectChange;
  assets: CodexObjectChange;
  /** True when nothing at all would change on the game side. */
  empty: boolean;
};

function compare(before: Map<string, string>, after: Map<string, string>): CodexObjectChange {
  const added: string[] = [];
  const changed: string[] = [];
  const removed: string[] = [];
  for (const [id, hash] of after) {
    const previous = before.get(id);
    if (previous === undefined) added.push(id);
    else if (previous !== hash) changed.push(id);
  }
  for (const id of before.keys()) if (!after.has(id)) removed.push(id);
  return { added: added.sort(), changed: changed.sort(), removed: removed.sort() };
}

type PayloadIndex = { arcs: Map<string, string>; nodes: Map<string, string>; choices: Map<string, string>; entries: Map<string, string> };

/**
 * One hash per story object.
 *
 * An arc hashes without its nodes and a node without its choices, so a
 * one-word edit to a single scene reports as one changed node rather than as a
 * changed arc containing everything under it. That distinction is the whole
 * value of the dry run: it is the difference between "reimport 133 branches"
 * and "one line moved in one card".
 */
function indexPayload(payload: MartinoStoryExport): PayloadIndex {
  const index: PayloadIndex = { arcs: new Map(), nodes: new Map(), choices: new Map(), entries: new Map() };
  for (const arc of payload.arcs) {
    const { nodes, ...arcOnly } = arc;
    index.arcs.set(codexObjectId.arc(arc), stableStringify(arcOnly));
    for (const node of nodes ?? []) {
      const { choices, ...nodeOnly } = node;
      const nodeId = codexObjectId.node(arc.slug, node);
      index.nodes.set(nodeId, stableStringify(nodeOnly));
      for (const choice of choices ?? []) {
        index.choices.set(codexObjectId.choice(arc.slug, node.key, choice.key), stableStringify(choice));
      }
    }
  }
  for (const entry of payload.bible) index.entries.set(codexObjectId.entry(entry), stableStringify(entry));
  return index;
}

function indexAssets(manifest: CodexBundleManifest): Map<string, string> {
  return new Map(manifest.assets.map((asset) => [asset.logicalPath, asset.sha256]));
}

const emptyIndex = (): PayloadIndex => ({ arcs: new Map(), nodes: new Map(), choices: new Map(), entries: new Map() });

async function readCanonPayload(root: string, manifest: CodexBundleManifest): Promise<MartinoStoryExport> {
  // Manifest paths are relative to the bundle root and resolveBundlePath
  // refuses anything absolute or climbing out of it.
  const file = resolveBundlePath(root, manifest.compatibility.path);
  return JSON.parse(await readFile(file, "utf8")) as MartinoStoryExport;
}

/** A staged release's own manifest, or null when that release is not there. */
async function readStagedManifest(importRoot: string, releasePath: string): Promise<CodexBundleManifest | null> {
  const value = await readJson(path.join(importRoot, releasePath, "manifest.json")).catch(() => null);
  return isCodexBundleManifest(value) ? value : null;
}

// ---------------------------------------------------------------------------
// Plan, apply, roll back
// ---------------------------------------------------------------------------

export type CodexImportPlan = {
  source: VerifiedBundle;
  /** What the game is built from now, and null before the first import. */
  imported: CodexImportRecord | null;
  /** True when the share is already the imported release. */
  current: boolean;
  diff: CodexImportDiff;
};

/**
 * What importing would do, without doing any of it. Verifies the share
 * completely — an unreadable or half-written release fails here, before
 * anything local has been touched.
 */
export async function planCodexImport(sourceRoot: string, importRoot: string): Promise<CodexImportPlan> {
  const source = await readAndVerifyBundle(sourceRoot, true);
  const ledger = await readImportLedger(importRoot);
  const imported = ledger.history.find((record) => record.snapshotId === ledger.current) ?? null;

  let before = emptyIndex();
  let beforeAssets = new Map<string, string>();
  if (imported) {
    // Read the previous release out of the local staging directory rather than
    // asking the share for it. The share has usually moved on, and the question
    // being answered is what *this machine* currently has.
    const staged = await readStagedManifest(importRoot, imported.releasePath);
    if (staged) {
      before = indexPayload(await readCanonPayload(importRoot, staged));
      beforeAssets = indexAssets(staged);
    }
  }

  const after = indexPayload(await readCanonPayload(sourceRoot, source.manifest));
  const afterAssets = indexAssets(source.manifest);
  const diff: CodexImportDiff = {
    arcs: compare(before.arcs, after.arcs),
    nodes: compare(before.nodes, after.nodes),
    choices: compare(before.choices, after.choices),
    entries: compare(before.entries, after.entries),
    assets: compare(beforeAssets, afterAssets),
    empty: false,
  };
  diff.empty = [diff.arcs, diff.nodes, diff.choices, diff.entries, diff.assets]
    .every((change) => change.added.length === 0 && change.changed.length === 0 && change.removed.length === 0);

  return { source, imported, current: imported?.snapshotId === source.pointer.snapshotId, diff };
}

export type CodexImportResult = { plan: CodexImportPlan; record: CodexImportRecord; changed: boolean };

/**
 * Stage the share's release locally, verify every byte of it, and only then
 * record it as the release the game is built from. Nothing that was already
 * imported is deleted, moved, or overwritten.
 */
export async function applyCodexImport(sourceRoot: string, importRoot: string, now = new Date()): Promise<CodexImportResult> {
  const plan = await planCodexImport(sourceRoot, importRoot);
  const ledger = await readImportLedger(importRoot);
  if (plan.current) {
    const record = ledger.history.find((entry) => entry.snapshotId === ledger.current)!;
    return { plan, record, changed: false };
  }

  // Staging: a fresh directory, every file re-verified after the copy, and the
  // local pointer moved only once the release is whole.
  const mirrored = await mirrorCodexBundle(sourceRoot, importRoot);
  const release = plan.source.manifest.storyRelease;
  const record: CodexImportRecord = {
    snapshotId: mirrored.snapshotId,
    sourceContentSha256: plan.source.pointer.sourceContentSha256,
    storyRelease: release ? { name: release.name, sha256: release.sha256, cutAt: release.cutAt } : null,
    importedAt: now.toISOString(),
    releasePath: `releases/${mirrored.snapshotId}`,
    assets: mirrored.assets,
  };
  await writeImportLedger(importRoot, {
    ...emptyLedger,
    current: record.snapshotId,
    history: [record, ...ledger.history.filter((entry) => entry.snapshotId !== record.snapshotId)],
  });
  return { plan, record, changed: true };
}

export type CodexRollbackResult = { from: CodexImportRecord; to: CodexImportRecord; diff: CodexImportDiff };

/**
 * Go back to the release imported before this one.
 *
 * It only moves the ledger. The staged files were never deleted, so there is
 * nothing to restore and nothing to re-download — which is the reason staging
 * keeps old releases in the first place. A record whose directory has since
 * been cleaned up is refused rather than half-applied.
 */
export async function rollbackCodexImport(importRoot: string, toSnapshotId?: string): Promise<CodexRollbackResult> {
  const ledger = await readImportLedger(importRoot);
  const from = ledger.history.find((entry) => entry.snapshotId === ledger.current);
  if (!from) throw new Error("Nothing has been imported yet, so there is nothing to roll back.");
  const candidates = ledger.history.filter((entry) => entry.snapshotId !== from.snapshotId);
  const to = toSnapshotId ? candidates.find((entry) => entry.snapshotId === toSnapshotId) : candidates[0];
  if (!to) {
    throw new Error(toSnapshotId
      ? `No import of "${toSnapshotId}" is recorded in this ledger.`
      : "Only one release has ever been imported here, so there is nothing to roll back to.");
  }

  const target = await readStagedManifest(importRoot, to.releasePath);
  if (!target) throw new Error(`The staged files for "${to.snapshotId}" are gone, so rolling back to it would import nothing. Re-import it from the share instead.`);
  const active = await readStagedManifest(importRoot, from.releasePath);
  if (!active) throw new Error(`The staged files for the active release "${from.snapshotId}" are gone, so the change cannot be described honestly. Re-import from the share instead.`);

  const before = indexPayload(await readCanonPayload(importRoot, active));
  const after = indexPayload(await readCanonPayload(importRoot, target));
  const diff: CodexImportDiff = {
    arcs: compare(before.arcs, after.arcs),
    nodes: compare(before.nodes, after.nodes),
    choices: compare(before.choices, after.choices),
    entries: compare(before.entries, after.entries),
    assets: compare(indexAssets(active), indexAssets(target)),
    empty: false,
  };
  diff.empty = [diff.arcs, diff.nodes, diff.choices, diff.entries, diff.assets]
    .every((change) => change.added.length === 0 && change.changed.length === 0 && change.removed.length === 0);

  await writeImportLedger(importRoot, { ...emptyLedger, current: to.snapshotId, history: ledger.history });
  return { from, to, diff };
}

/** One line per object class, for a human reading a terminal. */
export function describeCodexImportDiff(diff: CodexImportDiff): string[] {
  const rows: string[] = [];
  const classes: Array<[string, CodexObjectChange]> = [
    ["arcs", diff.arcs], ["scenes", diff.nodes], ["branches", diff.choices], ["bible entries", diff.entries], ["assets", diff.assets],
  ];
  for (const [label, change] of classes) {
    if (!change.added.length && !change.changed.length && !change.removed.length) continue;
    const parts = [
      change.added.length ? `${change.added.length} new` : null,
      change.changed.length ? `${change.changed.length} changed` : null,
      change.removed.length ? `${change.removed.length} REMOVED` : null,
    ].filter(Boolean);
    rows.push(`${label.padEnd(14)} ${parts.join(", ")}`);
  }
  return rows;
}
