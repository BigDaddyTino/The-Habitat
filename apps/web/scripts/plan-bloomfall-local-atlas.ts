import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { buildBloomfallLocalAtlasManifest, verifyBloomfallLocalAtlasArtFiles } from "./lib/bloomfall-local-atlas";
import { stableAtlasJson } from "./lib/atlas-integrity";

async function main() {
 await verifyBloomfallLocalAtlasArtFiles();
 const manifest = buildBloomfallLocalAtlasManifest();
 if (process.argv.includes("--write")) {
   const directory = path.resolve(process.cwd(), "..", "..", "Docs", "bloomfall-local-atlas");
   await mkdir(directory, { recursive: true });
   await writeFile(path.join(directory, "bloomfall-local-atlas-manifest.json"), stableAtlasJson(manifest), "utf8");
 }
 process.stdout.write(stableAtlasJson(manifest));
}
void main();
