import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  bloomfallV3Assets,
  bloomfallV3AtlasAssets,
  bloomfallV3CodexAssets,
  bloomfallV3ProductionPath,
  bloomfallV3SourcePath,
} from "../lib/bloomfall-v3-art";

function inspectPng(relativePath: string) {
  const bytes = readFileSync(path.join(process.cwd(), relativePath));
  if (bytes.subarray(1, 4).toString("ascii") !== "PNG") throw new Error(`${relativePath}: not a PNG`);
  return {
    bytes,
    sha256: createHash("sha256").update(bytes).digest("hex"),
    width: bytes.readUInt32BE(16),
    height: bytes.readUInt32BE(20),
  };
}

export function verifyBloomfallV3ArtFiles() {
const rows = bloomfallV3Assets.map((asset) => {
  const sourcePath = bloomfallV3SourcePath(asset);
  const productionPath = bloomfallV3ProductionPath(asset);
  const source = inspectPng(sourcePath);
  const production = inspectPng(productionPath);
  if (source.sha256 !== asset.sha256 || production.sha256 !== asset.sha256) throw new Error(`${asset.id}: locked SHA-256 mismatch`);
  if (source.width !== asset.width || source.height !== asset.height || production.width !== asset.width || production.height !== asset.height) throw new Error(`${asset.id}: locked dimensions mismatch`);
  if (!source.bytes.equals(production.bytes)) throw new Error(`${asset.id}: source and production bytes differ`);
  return { id: asset.id, purpose: asset.purpose, binding: asset.kind === "atlas" ? `${asset.mapSlug}:v3` : asset.entrySlug, sourcePath, productionPath, dimensions: `${asset.width}x${asset.height}`, sha256: asset.sha256 };
});

return {
  package: "bloomfall-v3",
  selected: { v1: 0, v2: 0, v3: rows.length },
  registration: { worldAtlasV3: bloomfallV3AtlasAssets.some((asset) => asset.mapSlug === "martino-world"), localAtlasV3: bloomfallV3AtlasAssets.some((asset) => asset.mapSlug === "martino-bloomfall-reach"), codexV3Bindings: bloomfallV3CodexAssets.length },
  assets: rows,
  result: "BLOOMFALL_V3_ART_VERIFIED" as const,
};
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) console.log(JSON.stringify(verifyBloomfallV3ArtFiles(), null, 2));
