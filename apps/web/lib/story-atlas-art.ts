import { existsSync } from "node:fs";
import path from "node:path";

const atlasFiles = new Map([
  ["martino-world:v1", "martino-world-map-v1.png"],
  ["martino-world:v2", "candidates/martino-world-map-v2-clean-production-candidate.png"],
  ["martino-starting-island:v1", "martino-starting-island-map-v1.png"],
  ["martino-port-arcadia:v2", "martino-port-arcadia-map-v2.png"],
]);

export function resolveStoryAtlasArt(slug: string, versionFile: string) {
  const match = /^(v[0-9]+)\.png$/.exec(versionFile);
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || !match) return null;
  const filename = atlasFiles.get(`${slug}:${match[1]}`);
  if (!filename) return null;
  const directory = path.join(process.cwd(), "private", "codex-art", "maps");
  const target = path.resolve(directory, filename);
  if (!target.startsWith(`${directory}${path.sep}`)) return null;
  return existsSync(target) ? target : null;
}
