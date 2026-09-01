import { existsSync } from "node:fs";
import path from "node:path";

const atlasFiles = new Map<string, { filename: string; developmentOnly?: boolean }>([
  ["martino-world:v1", { filename: "martino-world-map-v1.png" }],
  ["martino-world:v2", { filename: "candidates/martino-world-map-v2-clean-production-candidate.png" }],
  ["martino-world:v3", { filename: "martino-world-map-v3.png" }],
  ["martino-starting-island:v1", { filename: "martino-starting-island-map-v1.png" }],
  ["martino-port-arcadia:v2", { filename: "martino-port-arcadia-map-v2.png" }],
  ["martino-bloomfall-reach:v1", { filename: "candidates/martino-bloomfall-reach-map-v1.png", developmentOnly: true }],
  ["martino-bloomfall-reach:v3", { filename: "martino-bloomfall-reach-map-v3.png" }],
]);

/**
 * A StoryMap row is an authoring foundation until its exact art contract is
 * registered here. Player projections use this as the activation boundary so
 * an owned-but-empty child scene cannot become a broken drill-down merely by
 * existing in the editor.
 */
export function storyAtlasArtRegistered(slug: string, artVersion: string, environment: Readonly<Record<string, string | undefined>> = process.env) {
  const art = atlasFiles.get(`${slug}:${artVersion}`);
  return Boolean(art && (!art.developmentOnly || environment.HABITAT_ENVIRONMENT === "development"));
}

/**
 * The highest registered art version for a scene, honouring the same
 * development gate the resolver uses. The release audit compares every
 * StoryMap row against this so a map can never silently go backwards —
 * the failure mode of 2026-08-27 (code pinned to a superseded version) and
 * the one the atlas seed used to be able to cause on a re-apply.
 */
export function newestRegisteredStoryAtlasArtVersion(slug: string, environment: Readonly<Record<string, string | undefined>> = process.env) {
  let newest: number | null = null;
  for (const [key, art] of atlasFiles) {
    const [artSlug, version] = key.split(":");
    if (artSlug !== slug) continue;
    if (art.developmentOnly && environment.HABITAT_ENVIRONMENT !== "development") continue;
    const number = Number.parseInt((version ?? "").replace(/^v/, ""), 10);
    if (Number.isInteger(number) && (newest === null || number > newest)) newest = number;
  }
  return newest === null ? null : `v${newest}`;
}

export function resolveStoryAtlasArt(slug: string, versionFile: string) {
  const match = /^(v[0-9]+)\.png$/.exec(versionFile);
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || !match) return null;
  const art = atlasFiles.get(`${slug}:${match[1]}`);
  if (!art || !storyAtlasArtRegistered(slug, match[1]!)) return null;
  const filename = art.filename;
  const directory = path.join(process.cwd(), "private", "codex-art", "maps");
  const target = path.resolve(directory, filename);
  if (!target.startsWith(`${directory}${path.sep}`)) return null;
  return existsSync(target) ? target : null;
}
