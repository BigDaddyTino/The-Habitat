import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { buildBloomfallRouteStatusManifest } from "./lib/bloomfall-routes";
import { stableAtlasJson } from "./lib/atlas-integrity";

async function main() {
  const manifest = buildBloomfallRouteStatusManifest();
  if (process.argv.includes("--write")) {
    const target = path.resolve(process.cwd(), "..", "..", "Docs", "bloomfall-routes");
    await mkdir(target, { recursive: true });
    await writeFile(path.join(target, "bloomfall-route-status-manifest.json"), stableAtlasJson(manifest), "utf8");
  }
  process.stdout.write(stableAtlasJson(manifest));
}

void main();
