import { existsSync } from "node:fs";
import path from "node:path";

const atlasFiles = new Map<string, { filename: string; developmentOnly?: boolean }>([
  ["martino-world:v1", { filename: "martino-world-map-v1.png" }],
  ["martino-world:v2", { filename: "candidates/martino-world-map-v2-clean-production-candidate.png" }],
  ["martino-starting-island:v1", { filename: "martino-starting-island-map-v1.png" }],
  ["martino-port-arcadia:v2", { filename: "martino-port-arcadia-map-v2.png" }],
  ["martino-bloomfall-reach:v1", { filename: "candidates/martino-bloomfall-reach-map-v1.png", developmentOnly: true }],
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
