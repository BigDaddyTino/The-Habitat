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

export function readPublisherConfig() {
  const pollIntervalMs = Number(process.env.HABITAT_CODEX_SYNC_INTERVAL_MS ?? "5000");
  if (!Number.isSafeInteger(pollIntervalMs) || pollIntervalMs < 1000 || pollIntervalMs > 300_000) {
    throw new Error("HABITAT_CODEX_SYNC_INTERVAL_MS must be an integer from 1000 through 300000.");
  }
  return {
    repositoryRoot: findRepositoryRoot(),
    syncRoot: requirePath("HABITAT_CODEX_SYNC_ROOT"),
    pollIntervalMs,
  };
}

export function readMirrorConfig() {
  const pollIntervalMs = Number(process.env.HABITAT_CODEX_SYNC_INTERVAL_MS ?? "5000");
  if (!Number.isSafeInteger(pollIntervalMs) || pollIntervalMs < 1000 || pollIntervalMs > 300_000) {
    throw new Error("HABITAT_CODEX_SYNC_INTERVAL_MS must be an integer from 1000 through 300000.");
  }
  const sourceRoot = requirePath("HABITAT_CODEX_SYNC_ROOT");
  const mirrorRoot = requirePath("HABITAT_CODEX_MIRROR_ROOT");
  const sourcePrefix = `${sourceRoot}${path.sep}`.toLowerCase();
  const mirrorPrefix = `${mirrorRoot}${path.sep}`.toLowerCase();
  if (
    sourceRoot.toLowerCase() === mirrorRoot.toLowerCase() ||
    sourceRoot.toLowerCase().startsWith(mirrorPrefix) ||
    mirrorRoot.toLowerCase().startsWith(sourcePrefix)
  ) {
    throw new Error("The Codex source and mirror roots must be separate, non-nested directories.");
  }
  return { sourceRoot, mirrorRoot, pollIntervalMs };
}
