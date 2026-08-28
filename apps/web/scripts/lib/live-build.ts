import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";

/**
 * Where the build the running service is actually serving lives.
 *
 * Until deploy-web.ps1 existed, this was always `.next`, and the audits that
 * post server actions at a live server read their action-id manifest straight
 * out of that directory. Deploys now build into versioned `.next-<stamp>`
 * release directories and point the service at one of them, which left `.next`
 * holding a superseded build — so those audits were reading action ids from an
 * old manifest, posting them to a server that no longer knew them, and failing
 * in a way that looked like a broken write path rather than a stale lookup.
 *
 * Resolution order, most authoritative first:
 *   1. HABITAT_WEB_DIST_DIR in the environment — what a shell that has already
 *      set it is using.
 *   2. The same variable in HabitatWeb.xml, which is what the service reads.
 *   3. The newest `.next-*` directory that actually contains a BUILD_ID.
 *   4. `.next`, for a working tree that has never been deployed from.
 */
export function liveBuildDir(webRoot: string = process.cwd()): string {
  const candidate = (name: string) => path.join(webRoot, name);
  const usable = (name: string) => existsSync(path.join(candidate(name), "BUILD_ID"));

  const fromEnvironment = process.env.HABITAT_WEB_DIST_DIR;
  if (fromEnvironment && usable(fromEnvironment)) return candidate(fromEnvironment);

  // The service configuration sits at the repository root, two levels up.
  const serviceXml = path.join(webRoot, "..", "..", "HabitatWeb.xml");
  if (existsSync(serviceXml)) {
    const match = /<env\s+name="HABITAT_WEB_DIST_DIR"\s+value="([^"]+)"/.exec(readFileSync(serviceXml, "utf8"));
    if (match && usable(match[1]!)) return candidate(match[1]!);
  }

  if (usable(".next")) return candidate(".next");

  const releases = readdirSync(webRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && entry.name.startsWith(".next-"))
    .map((entry) => entry.name)
    .filter(usable)
    .sort()
    .reverse();
  if (releases.length > 0) return candidate(releases[0]!);

  throw new Error("No built Next output found. Build first, or set HABITAT_WEB_DIST_DIR.");
}

/** The server-action id map from the build the service is actually serving. */
export function liveServerReferenceManifest(webRoot: string = process.cwd()) {
  const file = path.join(liveBuildDir(webRoot), "server", "server-reference-manifest.json");
  if (!existsSync(file)) throw new Error(`No server-reference-manifest.json in the live build at ${file}.`);
  return JSON.parse(readFileSync(file, "utf8")) as { node: Record<string, { exportedName: string }> };
}
