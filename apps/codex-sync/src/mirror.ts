import { randomBytes } from "node:crypto";
import { copyFile, mkdir, readFile, rename, stat } from "node:fs/promises";
import path from "node:path";
import {
  isCodexBundleManifest,
  isCodexBundlePointer,
  type CodexBundleFile,
  type CodexBundleManifest,
  type CodexBundlePointer,
} from "@habitat/shared";
import { fileMatches, jsonBytes, readJson, replaceFileAtomically, resolveBundlePath, sha256Bytes, writeFileDurably } from "./integrity";

export type VerifiedBundle = {
  pointer: CodexBundlePointer;
  manifest: CodexBundleManifest;
};

function assertBundleFile(value: CodexBundleFile, label: string) {
  if (!value || typeof value.path !== "string" || !/^[a-f0-9]{64}$/.test(value.sha256) || !Number.isSafeInteger(value.bytes) || value.bytes < 0) {
    throw new Error(`Invalid ${label} file descriptor in the Codex manifest.`);
  }
}

export async function readAndVerifyBundle(sourceRoot: string, verifyAssets = true): Promise<VerifiedBundle> {
  const pointerValue = await readJson(path.join(sourceRoot, "current.json"));
  if (!isCodexBundlePointer(pointerValue)) throw new Error("The Codex current pointer is missing or invalid.");
  const manifestPath = resolveBundlePath(sourceRoot, pointerValue.manifestPath);
  const manifestBytes = await readFile(manifestPath);
  if (sha256Bytes(manifestBytes) !== pointerValue.manifestSha256) throw new Error("The Codex manifest hash does not match its current pointer.");
  const manifestValue = JSON.parse(manifestBytes.toString("utf8")) as unknown;
  if (!isCodexBundleManifest(manifestValue)) throw new Error("The active Codex manifest is invalid or unsupported.");
  if (manifestValue.snapshotId !== pointerValue.snapshotId || manifestValue.sourceContentSha256 !== pointerValue.sourceContentSha256) {
    throw new Error("The Codex manifest does not describe the active pointer.");
  }
  assertBundleFile(manifestValue.content, "snapshot");
  assertBundleFile(manifestValue.compatibility, "compatibility");
  if (!(await fileMatches(resolveBundlePath(sourceRoot, manifestValue.content.path), manifestValue.content.sha256, manifestValue.content.bytes))) {
    throw new Error("The complete Codex snapshot failed integrity verification.");
  }
  if (!(await fileMatches(resolveBundlePath(sourceRoot, manifestValue.compatibility.path), manifestValue.compatibility.sha256, manifestValue.compatibility.bytes))) {
    throw new Error("The canon compatibility export failed integrity verification.");
  }
  if (verifyAssets) {
    for (const asset of manifestValue.assets) {
      assertBundleFile(asset, `asset ${asset.logicalPath}`);
      if (!asset.logicalPath.startsWith("/images/")) throw new Error(`Unsafe Codex asset path: ${asset.logicalPath}`);
      if (!(await fileMatches(resolveBundlePath(sourceRoot, asset.path), asset.sha256, asset.bytes))) {
        throw new Error(`Codex asset failed integrity verification: ${asset.logicalPath}`);
      }
    }
  }
  return { pointer: pointerValue, manifest: manifestValue };
}

async function copyVerified(source: string, target: string, descriptor: CodexBundleFile) {
  if (await fileMatches(target, descriptor.sha256, descriptor.bytes)) return;
  await mkdir(path.dirname(target), { recursive: true });
  const temporary = `${target}.${process.pid}.${Date.now()}.next`;
  await copyFile(source, temporary);
  if (!(await fileMatches(temporary, descriptor.sha256, descriptor.bytes))) throw new Error(`File changed while mirroring: ${source}`);
  await rename(temporary, target);
}

async function directoryExists(directory: string) {
  try {
    return (await stat(directory)).isDirectory();
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return false;
    throw error;
  }
}

export async function mirrorCodexBundle(sourceRoot: string, mirrorRoot: string) {
  const { pointer, manifest } = await readAndVerifyBundle(sourceRoot, true);
  const releasePath = path.join(mirrorRoot, "releases", pointer.snapshotId);
  const localReleaseRelative = `releases/${pointer.snapshotId}`;
  const localManifest: CodexBundleManifest = {
    ...manifest,
    content: { ...manifest.content, path: `${localReleaseRelative}/content/snapshot.json` },
    compatibility: { ...manifest.compatibility, path: `${localReleaseRelative}/compatibility/canon-v1.json` },
    assets: manifest.assets.map((asset) => ({
      ...asset,
      path: `${localReleaseRelative}${asset.logicalPath}`,
    })),
  };
  const localManifestBytes = jsonBytes(localManifest);
  if (!(await directoryExists(releasePath))) {
    const stagingPath = path.join(mirrorRoot, ".staging", `mirror-${pointer.snapshotId}-${randomBytes(4).toString("hex")}`);
    await mkdir(stagingPath, { recursive: true });
    await copyVerified(
      resolveBundlePath(sourceRoot, manifest.content.path),
      path.join(stagingPath, "content", "snapshot.json"),
      manifest.content,
    );
    await copyVerified(
      resolveBundlePath(sourceRoot, manifest.compatibility.path),
      path.join(stagingPath, "compatibility", "canon-v1.json"),
      manifest.compatibility,
    );
    for (const asset of manifest.assets) {
      const relativeAsset = asset.logicalPath.slice(1).split("/").join(path.sep);
      await copyVerified(resolveBundlePath(sourceRoot, asset.path), path.join(stagingPath, relativeAsset), asset);
    }
    await writeFileDurably(path.join(stagingPath, "manifest.json"), localManifestBytes);
    await mkdir(path.dirname(releasePath), { recursive: true });
    await rename(stagingPath, releasePath);
  } else if (!(await fileMatches(path.join(releasePath, "manifest.json"), sha256Bytes(localManifestBytes), localManifestBytes.byteLength))) {
    throw new Error(`Existing mirror release ${pointer.snapshotId} does not match the active source release.`);
  }

  const localPointer: CodexBundlePointer = {
    ...pointer,
    manifestPath: `releases/${pointer.snapshotId}/manifest.json`,
    manifestSha256: sha256Bytes(localManifestBytes),
  };
  await mkdir(mirrorRoot, { recursive: true });
  await replaceFileAtomically(path.join(mirrorRoot, "current.json"), jsonBytes(localPointer));
  return { snapshotId: pointer.snapshotId, assets: manifest.assets.length };
}
