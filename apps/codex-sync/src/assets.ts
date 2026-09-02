import { createHash } from "node:crypto";
import { createReadStream, existsSync } from "node:fs";
import { mkdir, readdir, rename, stat } from "node:fs/promises";
import path from "node:path";
import type { CodexBundleAsset } from "@habitat/shared";
import { fileMatches } from "./integrity";

/**
 * Where each art shelf lives on disk, and the logical path it keeps in the
 * bundle.
 *
 * The files moved out of `apps/web/public/images` and into
 * `apps/web/private/codex-art` so the web app stops serving unreleased
 * artwork to anonymous callers. The bundle's logical paths are deliberately
 * unchanged — they are the importer's contract, not web URLs, and an
 * immutable release is verified against them by hash.
 */
const codexArtDirectories = [
  ["characters", "characters/keyart"],
  // The Play section's art: class plates, constellation charts, the scenes
  // under the trees, and the small pictures (talent icons, skill plates,
  // spell icons) that land by the drop-in convention. Same logical names.
  ["classes", "classes"],
  ["talents", "talents"],
  ["talent-backdrops", "talent-backdrops"],
  ["talent-icons", "talent-icons"],
  ["skills", "skills"],
  ["spells", "spells"],
  ["trades", "trades"],
  ["companion-missions", "companion-missions"],
  ["creatures", "creatures/keyart"],
  ["factions", "factions/keyart"],
  ["faction-logos", "factions/logos"],
  ["flags", "flags"],
  ["items", "items"],
  ["races", "races/keyart"],
  ["regions", "regions/keyart"],
  ["rules", "rules"],
  ["systems", "systems"],
  ["themes", "themes"],
  ["threads", "threads"],
  ["timeline", "timeline"],
] as const satisfies ReadonlyArray<readonly [directory: string, logical: string]>;

const codexRootImages = new Set([
  "codex-characters-ensemble.jpg",
  "codex-factions-war-room.png",
  "codex-game-systems.jpg",
  "codex-regions-peninsula.png",
  "codex-stories-veil-road.png",
  "codex-theme-borrowed-power.jpg",
  "codex-theme-harvest-economy.jpg",
  "codex-theme-something-under-war.jpg",
  "story-codex-archive.webp",
]);

const imageExtensions = new Set([".jpg", ".jpeg", ".png", ".webp"]);
// Voice reference clips (v5): dropped at private/codex-art/voice-clips/<slug>.<ext>
// and carried under /audio/, where a character sheet's referenceClipAssetId
// points at them. Same content-addressed store, same hash-verified copy.
const audioExtensions = new Set([".wav", ".mp3", ".ogg", ".flac"]);
const assetExtensions = new Set([...imageExtensions, ...audioExtensions]);
const voiceClipDirectory = "voice-clips";

export type SourceAsset = {
  sourcePath: string;
  logicalPath: string;
  bytes: number;
  modifiedMs: number;
};

async function walk(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(
    entries.sort((left, right) => left.name.localeCompare(right.name)).map(async (entry) => {
      const absolute = path.join(directory, entry.name);
      return entry.isDirectory() ? walk(absolute) : [absolute];
    }),
  );
  return nested.flat();
}

export async function discoverCodexAssets(repositoryRoot: string): Promise<SourceAsset[]> {
  const imagesRoot = path.join(repositoryRoot, "apps", "web", "public", "images");
  const artRoot = path.join(repositoryRoot, "apps", "web", "private", "codex-art");
  // sourcePath -> the logical path it keeps in the bundle, so a shelf can move
  // on disk without renaming an asset an importer has already pinned by hash.
  const candidates = new Map<string, string>();
  for (const [directory, logical] of codexArtDirectories) {
    const root = path.join(artRoot, directory);
    for (const file of await walk(root)) {
      candidates.set(file, `/images/${logical}/${path.relative(root, file).split(path.sep).join("/")}`);
    }
  }
  const rootFiles = await readdir(imagesRoot, { withFileTypes: true });
  for (const entry of rootFiles) {
    if (entry.isFile() && codexRootImages.has(entry.name)) candidates.set(path.join(imagesRoot, entry.name), `/images/${entry.name}`);
  }
  const mapsRoot = path.join(artRoot, "maps");
  for (const file of await walk(mapsRoot)) {
    candidates.set(file, `/images/maps/${path.relative(mapsRoot, file).split(path.sep).join("/")}`);
  }
  const clipsRoot = path.join(artRoot, voiceClipDirectory);
  if (existsSync(clipsRoot)) {
    for (const file of await walk(clipsRoot)) {
      candidates.set(file, `/audio/${voiceClipDirectory}/${path.relative(clipsRoot, file).split(path.sep).join("/")}`);
    }
  }

  const assets = await Promise.all(
    [...candidates.entries()]
      .filter(([filename]) => assetExtensions.has(path.extname(filename).toLowerCase()))
      // Ordered by the logical path, not by where the file happens to sit on
      // disk: the bundle's asset order is part of what an importer diffs, and
      // it must not shift because a shelf moved out of public/.
      .sort(([, left], [, right]) => left.localeCompare(right))
      .map(async ([sourcePath, logicalPath]) => {
        const info = await stat(sourcePath);
        return { sourcePath, logicalPath, bytes: info.size, modifiedMs: info.mtimeMs };
      }),
  );
  return assets;
}

export function assetStatFingerprint(assets: SourceAsset[]) {
  return createHash("sha256")
    .update(assets.map((asset) => `${asset.logicalPath}\0${asset.bytes}\0${asset.modifiedMs}`).join("\n"))
    .digest("hex");
}

function mimeType(filename: string) {
  switch (path.extname(filename).toLowerCase()) {
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".png":
      return "image/png";
    case ".webp":
      return "image/webp";
    case ".wav":
      return "audio/wav";
    case ".mp3":
      return "audio/mpeg";
    case ".ogg":
      return "audio/ogg";
    case ".flac":
      return "audio/flac";
    default:
      return "application/octet-stream";
  }
}

function imageDimensions(buffer: Buffer): { width: number; height: number } | null {
  if (buffer.length >= 24 && buffer.subarray(1, 4).toString("ascii") === "PNG") {
    return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
  }
  if (buffer.length >= 30 && buffer.subarray(0, 4).toString("ascii") === "RIFF" && buffer.subarray(8, 12).toString("ascii") === "WEBP") {
    const kind = buffer.subarray(12, 16).toString("ascii");
    if (kind === "VP8X") {
      return {
        width: 1 + buffer.readUIntLE(24, 3),
        height: 1 + buffer.readUIntLE(27, 3),
      };
    }
    if (kind === "VP8 " && buffer.length >= 30) {
      return { width: buffer.readUInt16LE(26) & 0x3fff, height: buffer.readUInt16LE(28) & 0x3fff };
    }
    if (kind === "VP8L" && buffer.length >= 25) {
      const bits = buffer.readUInt32LE(21);
      return { width: 1 + (bits & 0x3fff), height: 1 + ((bits >>> 14) & 0x3fff) };
    }
  }
  if (buffer.length >= 4 && buffer[0] === 0xff && buffer[1] === 0xd8) {
    let offset = 2;
    while (offset + 9 < buffer.length) {
      if (buffer[offset] !== 0xff) {
        offset += 1;
        continue;
      }
      const marker = buffer[offset + 1];
      if (marker === undefined || marker === 0xd9 || marker === 0xda) break;
      const size = buffer.readUInt16BE(offset + 2);
      if (size < 2) break;
      if (marker >= 0xc0 && marker <= 0xc3) {
        return { width: buffer.readUInt16BE(offset + 7), height: buffer.readUInt16BE(offset + 5) };
      }
      offset += 2 + size;
    }
  }
  return null;
}

async function inspectAndStore(source: SourceAsset, bundleRoot: string): Promise<CodexBundleAsset> {
  const hash = createHash("sha256");
  const chunks: Buffer[] = [];
  await new Promise<void>((resolve, reject) => {
    const stream = createReadStream(source.sourcePath);
    stream.on("data", (chunk) => {
      const bytes = typeof chunk === "string" ? Buffer.from(chunk) : chunk;
      hash.update(bytes);
      chunks.push(bytes);
    });
    stream.on("error", reject);
    stream.on("end", resolve);
  });
  const sha256 = hash.digest("hex");
  const blobPath = `blobs/sha256/${sha256.slice(0, 2)}/${sha256}`;
  const target = path.join(bundleRoot, ...blobPath.split("/"));
  if (!(await fileMatches(target, sha256, source.bytes))) {
    await mkdir(path.dirname(target), { recursive: true });
    const temporary = `${target}.${process.pid}.${Date.now()}.next`;
    const { copyFile } = await import("node:fs/promises");
    await copyFile(source.sourcePath, temporary);
    if (!(await fileMatches(temporary, sha256, source.bytes))) throw new Error(`Asset changed while copying: ${source.sourcePath}`);
    await rename(temporary, target);
  }
  const dimensions = imageDimensions(Buffer.concat(chunks));
  return {
    path: blobPath,
    logicalPath: source.logicalPath,
    sha256,
    bytes: source.bytes,
    mimeType: mimeType(source.sourcePath),
    width: dimensions?.width ?? null,
    height: dimensions?.height ?? null,
  };
}

export async function storeCodexAssets(assets: SourceAsset[], bundleRoot: string) {
  const stored: CodexBundleAsset[] = [];
  for (const asset of assets) stored.push(await inspectAndStore(asset, bundleRoot));
  return stored;
}
