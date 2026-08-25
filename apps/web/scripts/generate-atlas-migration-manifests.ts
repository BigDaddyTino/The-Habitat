import "../lib/environment";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { resolveStoryAtlasArt } from "../lib/story-atlas-art";
import { atlasAuditExitCode, atlasSha256, buildAtlasIntegrityAudit, buildAtlasMigrationManifests, createFilesystemAtlasArtworkInspector, stableAtlasJson } from "./lib/atlas-integrity";
import { disconnectAtlasAuditDatabase, loadAtlasAuditSource } from "./lib/atlas-integrity-db";

const check = process.argv.includes("--check");
const outputDirectory = path.resolve(process.cwd(), "..", "..", "Docs", "atlas-migration-manifests");
const targets = {
  geometry: path.join(outputDirectory, "atlas-v1-geometry.json"),
  connections: path.join(outputDirectory, "atlas-v1-connections.json"),
} as const;

async function main() {
  const source = await loadAtlasAuditSource();
  const audit = await buildAtlasIntegrityAudit(source, createFilesystemAtlasArtworkInspector(resolveStoryAtlasArt));
  if (atlasAuditExitCode(audit) !== 0) throw new Error("Atlas audit contains ERROR or FATAL findings; manifests were not generated.");
  const manifests = buildAtlasMigrationManifests(audit);
  const outputs = { geometry: stableAtlasJson(manifests.geometry), connections: stableAtlasJson(manifests.connections) };
  if (!check) await mkdir(outputDirectory, { recursive: true });
  for (const key of Object.keys(targets) as Array<keyof typeof targets>) {
    if (check) {
      const existing = await readFile(targets[key], "utf8").catch(() => null);
      if (existing !== outputs[key]) throw new Error(`${path.basename(targets[key])} is missing or differs from deterministic generation.`);
    } else await writeFile(targets[key], outputs[key], "utf8");
    process.stdout.write(`${key}: ${outputs[key].split("\n").length - 1} lines, sha256 ${atlasSha256(outputs[key])}${check ? " (byte-identical)" : ""}\n`);
  }
}

main().then(disconnectAtlasAuditDatabase, async (error) => {
  process.stderr.write(`${error instanceof Error ? error.message : "Atlas manifest generation failed."}\n`);
  await disconnectAtlasAuditDatabase().catch(() => undefined);
  process.exitCode = 1;
});

