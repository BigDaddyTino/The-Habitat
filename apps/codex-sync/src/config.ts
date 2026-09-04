import dotenv from "dotenv";
import { existsSync } from "node:fs";
import path from "node:path";

function findUp(start: string, filename: string) {
  let directory = path.resolve(start);
  for (;;) {
    const candidate = path.join(directory, filename);
    if (existsSync(candidate)) return candidate;
    const parent = path.dirname(directory);
    if (parent === directory) return null;
    directory = parent;
  }
}

const envPath = findUp(process.cwd(), ".env");
if (envPath) dotenv.config({ path: envPath, quiet: true });

export function findRepositoryRoot(start = process.cwd()) {
  const packagePath = findUp(start, "pnpm-workspace.yaml");
  if (!packagePath) throw new Error("Could not locate the Habitat workspace root.");
  return path.dirname(packagePath);
}

function requirePath(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} must be an absolute local or UNC path.`);
  if (!path.isAbsolute(value)) throw new Error(`${name} must be absolute; received ${JSON.stringify(value)}.`);
  return path.resolve(value);
}

/**
 * How many superseded releases stay on the share, and why there is a ceiling.
 *
 * A release materializes its assets as HARDLINKS into `blobs/`, so one kept
 * release is one link on every blob it uses. NTFS caps a single file at 1024
 * links, and when a blob reaches it every further publish fails — which is
 * exactly how the share wedged on 2026-09-03 with 512 releases banked up.
 *
 * So retention is not housekeeping here, it is the thing that keeps publishing
 * possible at all, and the maximum is deliberately far below 1024 rather than
 * near it: the cap has to hold with room for a blob that appears more than
 * once in a release, and for whatever a half-finished publish is holding.
 *
 * The releases are publisher-side rollback history. No consumer needs them:
 * `mirror` and `import` both read only the release `current.json` names, and
 * `planCodexImport` reads what this machine last imported out of its own local
 * staging precisely because "the share has usually moved on".
 */
export const codexRetentionDefaults = { keepReleases: 30, minAgeMs: 15 * 60_000 } as const;

function readRetention() {
  const keepReleases = Number(process.env.HABITAT_CODEX_SYNC_KEEP_RELEASES ?? String(codexRetentionDefaults.keepReleases));
  if (!Number.isSafeInteger(keepReleases) || keepReleases < 5 || keepReleases > 400) {
    throw new Error("HABITAT_CODEX_SYNC_KEEP_RELEASES must be an integer from 5 through 400 — the ceiling is well under the NTFS 1024-hardlink cap on purpose.");
  }
  // Nothing is deleted until it has been superseded for this long. A consumer
  // that read the pointer a moment before it moved may still be copying the
  // release it named, and the share is reached over the network by a machine
  // this process cannot see or coordinate with.
  const minAgeMs = Number(process.env.HABITAT_CODEX_SYNC_RETENTION_MIN_AGE_MS ?? String(codexRetentionDefaults.minAgeMs));
  if (!Number.isSafeInteger(minAgeMs) || minAgeMs < 60_000 || minAgeMs > 24 * 60 * 60_000) {
    throw new Error("HABITAT_CODEX_SYNC_RETENTION_MIN_AGE_MS must be an integer from 60000 through 86400000.");
  }
  return { keepReleases, minAgeMs };
}

export function readPublisherConfig() {
  const pollIntervalMs = Number(process.env.HABITAT_CODEX_SYNC_INTERVAL_MS ?? "5000");
  if (!Number.isSafeInteger(pollIntervalMs) || pollIntervalMs < 1000 || pollIntervalMs > 300_000) {
    throw new Error("HABITAT_CODEX_SYNC_INTERVAL_MS must be an integer from 1000 through 300000.");
  }
  return {
    repositoryRoot: findRepositoryRoot(),
    syncRoot: requirePath("HABITAT_CODEX_SYNC_ROOT"),
    pollIntervalMs,
    ...readRetention(),
  };
}

function requirePollInterval() {
  const pollIntervalMs = Number(process.env.HABITAT_CODEX_SYNC_INTERVAL_MS ?? "5000");
  if (!Number.isSafeInteger(pollIntervalMs) || pollIntervalMs < 1000 || pollIntervalMs > 300_000) {
    throw new Error("HABITAT_CODEX_SYNC_INTERVAL_MS must be an integer from 1000 through 300000.");
  }
  return pollIntervalMs;
}

/**
 * A local root must not be the share, and must not sit inside it or contain
 * it. Writing a copy into the thing being copied corrupts the source, and the
 * game machine is never allowed to write to the share at all.
 */
function assertSeparateRoots(sourceRoot: string, localRoot: string, what: string) {
  const sourcePrefix = `${sourceRoot}${path.sep}`.toLowerCase();
  const localPrefix = `${localRoot}${path.sep}`.toLowerCase();
  if (
    sourceRoot.toLowerCase() === localRoot.toLowerCase() ||
    sourceRoot.toLowerCase().startsWith(localPrefix) ||
    localRoot.toLowerCase().startsWith(sourcePrefix)
  ) {
    throw new Error(`The Codex source and ${what} roots must be separate, non-nested directories.`);
  }
}

export function readMirrorConfig() {
  const pollIntervalMs = requirePollInterval();
  const sourceRoot = requirePath("HABITAT_CODEX_SYNC_ROOT");
  const mirrorRoot = requirePath("HABITAT_CODEX_MIRROR_ROOT");
  assertSeparateRoots(sourceRoot, mirrorRoot, "mirror");
  return { sourceRoot, mirrorRoot, pollIntervalMs };
}

/**
 * The game machine's side. The import root holds the staged releases and the
 * ledger saying which one the build is actually using.
 */
export function readImportConfig() {
  const pollIntervalMs = requirePollInterval();
  const sourceRoot = requirePath("HABITAT_CODEX_SYNC_ROOT");
  const importRoot = requirePath("HABITAT_CODEX_IMPORT_ROOT");
  assertSeparateRoots(sourceRoot, importRoot, "import");
  return { sourceRoot, importRoot, pollIntervalMs };
}
