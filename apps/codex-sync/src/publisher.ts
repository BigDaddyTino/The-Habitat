import { randomBytes } from "node:crypto";
import { copyFile, link, mkdir, readFile, rename, stat } from "node:fs/promises";
import path from "node:path";
import {
  codexBundleContractVersion,
  isCodexBundlePointer,
  type CodexBundleManifest,
  type CodexBundlePointer,
} from "@habitat/shared";
import { assetStatFingerprint, discoverCodexAssets, storeCodexAssets } from "./assets";
import { buildCanonCompatibilityExport } from "./compatibility";
import { jsonBytes, replaceFileAtomically, sha256Bytes, writeFileDurably } from "./integrity";
import { newestPublishedRelease } from "./release";
import { buildCodexSnapshot, codexDatabaseFingerprint } from "./snapshot";

export type PublishResult = {
  changed: boolean;
  snapshotId: string;
  contentSha256: string;
  assets: number;
};

async function readCurrentPointer(syncRoot: string) {
  try {
    const value = JSON.parse(await readFile(path.join(syncRoot, "current.json"), "utf8")) as unknown;
    return isCodexBundlePointer(value) ? value : null;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw error;
  }
}

function timestampId(date: Date) {
  return date.toISOString().replaceAll("-", "").replaceAll(":", "").replace(".", "");
}

function sourceContentHash(
  snapshot: Awaited<ReturnType<typeof buildCodexSnapshot>>,
  compatibility: ReturnType<typeof buildCanonCompatibilityExport>,
  assets: Awaited<ReturnType<typeof storeCodexAssets>>,
) {
  const stableSnapshot = { ...snapshot, generatedAt: "" };
  const stableCompatibility = { ...compatibility, generatedAt: "", revisionCursor: null };
  return sha256Bytes(
    JSON.stringify({
      releaseLayoutVersion: 1,
      snapshot: stableSnapshot,
      compatibility: stableCompatibility,
      assets: assets.map((asset) => ({ logicalPath: asset.logicalPath, sha256: asset.sha256, bytes: asset.bytes })),
    }),
  );
}

async function materializeReleaseAssets(
  syncRoot: string,
  stagingPath: string,
  releaseRelative: string,
  assets: Awaited<ReturnType<typeof storeCodexAssets>>,
) {
  for (const asset of assets) {
    const source = path.join(syncRoot, ...asset.path.split("/"));
    const target = path.join(stagingPath, ...asset.logicalPath.slice(1).split("/"));
    await mkdir(path.dirname(target), { recursive: true });
    try {
      await link(source, target);
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code;
      if (code !== "EXDEV" && code !== "EPERM" && code !== "EACCES" && code !== "ENOTSUP") throw error;
      await copyFile(source, target);
    }
  }
  return assets.map((asset) => ({ ...asset, path: `${releaseRelative}${asset.logicalPath}` }));
}

function assertSafeSyncRoot(repositoryRoot: string, syncRoot: string) {
  const resolvedRoot = path.resolve(syncRoot);
  const filesystemRoot = path.parse(resolvedRoot).root;
  if (resolvedRoot.toLowerCase() === filesystemRoot.toLowerCase()) {
    throw new Error("The Codex sync root cannot be an entire drive or filesystem root.");
  }
  if (resolvedRoot.toLowerCase() === path.resolve(repositoryRoot).toLowerCase()) {
    throw new Error("The Codex sync root cannot be the Habitat repository root.");
  }
}

export async function publishCodexBundle(repositoryRoot: string, syncRoot: string): Promise<PublishResult> {
  assertSafeSyncRoot(repositoryRoot, syncRoot);
  await mkdir(syncRoot, { recursive: true });
  const rootInfo = await stat(syncRoot);
  if (!rootInfo.isDirectory()) throw new Error(`Codex sync root is not a directory: ${syncRoot}`);

  const generatedAt = new Date();
  const sourceAssets = await discoverCodexAssets(repositoryRoot);
  const [snapshot, assets] = await Promise.all([
    buildCodexSnapshot(generatedAt),
    storeCodexAssets(sourceAssets, syncRoot),
  ]);
  // The canon payload comes from a NAMED RELEASE, never from the live read.
  //
  // The snapshot above is a mirror of the codex and is meant to move whenever
  // the room does. This payload is what an importer turns into game assets, so
  // it is subject to the release boundary: it is a frozen cut with a hash an
  // importer can pin, and it does not change because somebody saved a
  // sentence. Publishing without one would put live canon back into the
  // bundle through the side door.
  const release = await newestPublishedRelease();
  if (!release) {
    throw new Error(
      "No story release has been cut, so there is no canon payload to publish. " +
      "Codex Sync bundles a named release rather than live canon — cut one with " +
      "apps/web/scripts/cut-story-release.ts and publish again.",
    );
  }
  const compatibility = release.payload;
  const contentSha256 = sourceContentHash(snapshot, compatibility, assets);
  const current = await readCurrentPointer(syncRoot);
  if (current?.sourceContentSha256 === contentSha256) {
    return { changed: false, snapshotId: current.snapshotId, contentSha256, assets: assets.length };
  }

  const contentBytes = jsonBytes(snapshot);
  const compatibilityBytes = jsonBytes(compatibility);
  const snapshotId = `${timestampId(generatedAt)}-${contentSha256.slice(0, 12)}`;
  const releaseRelative = `releases/${snapshotId}`;
  const releasePath = path.join(syncRoot, "releases", snapshotId);
  const stagingPath = path.join(syncRoot, ".staging", `publish-${snapshotId}-${randomBytes(4).toString("hex")}`);
  await mkdir(path.join(stagingPath, "content"), { recursive: true });
  await mkdir(path.join(stagingPath, "compatibility"), { recursive: true });

  const contentRelative = `${releaseRelative}/content/snapshot.json`;
  const compatibilityRelative = `${releaseRelative}/compatibility/canon-v1.json`;
  await writeFileDurably(path.join(stagingPath, "content", "snapshot.json"), contentBytes);
  await writeFileDurably(path.join(stagingPath, "compatibility", "canon-v1.json"), compatibilityBytes);
  const releaseAssets = await materializeReleaseAssets(syncRoot, stagingPath, releaseRelative, assets);

  const manifest: CodexBundleManifest = {
    contract: "martino-codex-bundle",
    contractVersion: codexBundleContractVersion,
    snapshotId,
    generatedAt: generatedAt.toISOString(),
    revisionCursor: snapshot.revisionCursor,
    sourceContentSha256: contentSha256,
    storyRelease: { name: release.name, sha256: release.sha256, contractVersion: release.contractVersion, cutAt: release.cutAt },
    counts: {
      arcs: snapshot.arcs.length,
      nodes: snapshot.nodes.length,
      edges: snapshot.edges.length,
      entries: snapshot.entries.length,
      links: snapshot.links.length,
      comments: snapshot.comments.length,
      revisions: snapshot.revisions.length,
      maps: snapshot.maps.length,
      placements: snapshot.placements.length,
      nodePlacements: snapshot.nodePlacements.length,
      assets: assets.length,
    },
    content: {
      path: contentRelative,
      sha256: sha256Bytes(contentBytes),
      bytes: contentBytes.byteLength,
    },
    compatibility: {
      path: compatibilityRelative,
      sha256: sha256Bytes(compatibilityBytes),
      bytes: compatibilityBytes.byteLength,
    },
    assets: releaseAssets,
  };
  const manifestBytes = jsonBytes(manifest);
  await writeFileDurably(path.join(stagingPath, "manifest.json"), manifestBytes);

  await mkdir(path.dirname(releasePath), { recursive: true });
  await rename(stagingPath, releasePath);
  const pointer: CodexBundlePointer = {
    contract: "martino-codex-pointer",
    contractVersion: codexBundleContractVersion,
    snapshotId,
    generatedAt: generatedAt.toISOString(),
    manifestPath: `${releaseRelative}/manifest.json`,
    manifestSha256: sha256Bytes(manifestBytes),
    sourceContentSha256: contentSha256,
  };
  await replaceFileAtomically(path.join(syncRoot, "current.json"), jsonBytes(pointer));
  return { changed: true, snapshotId, contentSha256, assets: assets.length };
}

export async function publisherFingerprint(repositoryRoot: string) {
  const [database, assets] = await Promise.all([codexDatabaseFingerprint(), discoverCodexAssets(repositoryRoot)]);
  return `${database}:${assetStatFingerprint(assets)}`;
}
