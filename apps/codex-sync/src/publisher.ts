import { randomBytes } from "node:crypto";
import { copyFile, link, mkdir, readFile, rename, stat } from "node:fs/promises";
import path from "node:path";
import {
  codexBundleContractVersion,
  codexDialogueLinesContractVersion,
  isCodexBundlePointer,
  type CodexBundleManifest,
  type CodexBundlePointer,
} from "@habitat/shared";
import { assetStatFingerprint, discoverCodexAssets, storeCodexAssets } from "./assets";
import { buildCanonCompatibilityExport } from "./compatibility";
import { attachDialogue, buildDialogueLinesSidecar, validateDialogue, voiceClipsIn, type DialogueValidation } from "./dialogue";
import { jsonBytes, replaceFileAtomically, sha256Bytes, writeFileDurably } from "./integrity";
import { newestPublishedRelease } from "./release";
import { buildCodexSnapshot, codexDatabaseFingerprint } from "./snapshot";

export type PublishResult = {
  changed: boolean;
  snapshotId: string;
  contentSha256: string;
  assets: number;
  lines: number;
  report: string[];
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

/**
 * Everything a publish is made of, read once: the snapshot with its dialogue
 * resolved against the drop-in voice clips, the assets in the store, the
 * flattened line sidecar (identity blank until the release id exists), and
 * the validation verdict. Health runs exactly this, so a health check and a
 * publish can never disagree about what the drive should hold.
 */
async function prepareBundle(repositoryRoot: string, syncRoot: string, generatedAt: Date) {
  const sourceAssets = await discoverCodexAssets(repositoryRoot);
  const [raw, assets] = await Promise.all([
    buildCodexSnapshot(generatedAt),
    storeCodexAssets(sourceAssets, syncRoot),
  ]);
  const snapshot = attachDialogue(raw, voiceClipsIn(assets));
  const dialogue = buildDialogueLinesSidecar(snapshot, { snapshotId: "", generatedAt: "", sourceContentSha256: "" });
  const validation = validateDialogue(snapshot, dialogue);
  return { snapshot, assets, dialogue, validation };
}

function sourceContentHash(
  snapshot: Awaited<ReturnType<typeof buildCodexSnapshot>>,
  compatibility: ReturnType<typeof buildCanonCompatibilityExport>,
  assets: Awaited<ReturnType<typeof storeCodexAssets>>,
  dialogue: ReturnType<typeof buildDialogueLinesSidecar>,
) {
  const stableSnapshot = { ...snapshot, generatedAt: "" };
  const stableCompatibility = { ...compatibility, generatedAt: "", revisionCursor: null };
  const stableDialogue = { ...dialogue, snapshotId: "", generatedAt: "", sourceContentSha256: "" };
  return sha256Bytes(
    JSON.stringify({
      // 2: contract v5 — the dialogue sidecar joined the release layout.
      releaseLayoutVersion: 2,
      snapshot: stableSnapshot,
      compatibility: stableCompatibility,
      dialogue: stableDialogue,
      assets: assets.map((asset) => ({ logicalPath: asset.logicalPath, sha256: asset.sha256, bytes: asset.bytes })),
    }),
  );
}

function dialogueFailure(validation: DialogueValidation) {
  return new Error(`The dialogue lines do not validate, so nothing was published (${validation.problems.length} problem${validation.problems.length === 1 ? "" : "s"}):\n  ${validation.problems.slice(0, 40).join("\n  ")}${validation.problems.length > 40 ? `\n  … and ${validation.problems.length - 40} more` : ""}`);
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

/**
 * What a publish WOULD produce, without writing anything.
 *
 * Exists because `verify` cannot catch the failure that actually happens. On
 * 2026-08-28 the publisher spent eight hours failing every five seconds — the
 * asset directories had moved under it — and the last good bundle stayed
 * perfectly valid the whole time, so integrity verification passed while the
 * game machine read a bundle from before a full day of work. Nothing was
 * wrong with what was on the drive; what was wrong was its age.
 *
 * This runs the same code a publish runs, so a health check and a publish can
 * never disagree about whether the drive is current.
 */
export async function codexPublishState(repositoryRoot: string, syncRoot: string) {
  assertSafeSyncRoot(repositoryRoot, syncRoot);
  const { snapshot, assets, dialogue, validation } = await prepareBundle(repositoryRoot, syncRoot, new Date());
  const release = await newestPublishedRelease();
  const current = await readCurrentPointer(syncRoot);
  if (!release) return { release: null, current, stale: true, reason: "no story release has been cut" as const, contentSha256: null, assets: assets.length, dialogue: validation, lines: dialogue.counts };
  const contentSha256 = sourceContentHash(snapshot, release.payload, assets, dialogue);
  return {
    release,
    current,
    contentSha256,
    assets: assets.length,
    dialogue: validation,
    lines: dialogue.counts,
    stale: current?.sourceContentSha256 !== contentSha256,
    reason: current ? (current.sourceContentSha256 === contentSha256 ? null : ("the drive does not match current canon" as const)) : ("nothing has ever been published" as const),
  };
}

/** The dialogue report alone, for a person: what would ship, and what stops it. */
export async function codexDialogueReport(repositoryRoot: string) {
  const sourceAssets = await discoverCodexAssets(repositoryRoot);
  const snapshot = attachDialogue(await buildCodexSnapshot(new Date()), voiceClipsIn(sourceAssets));
  const dialogue = buildDialogueLinesSidecar(snapshot, { snapshotId: "", generatedAt: "", sourceContentSha256: "" });
  return { validation: validateDialogue(snapshot, dialogue), counts: dialogue.counts };
}

export async function publishCodexBundle(repositoryRoot: string, syncRoot: string): Promise<PublishResult> {
  assertSafeSyncRoot(repositoryRoot, syncRoot);
  await mkdir(syncRoot, { recursive: true });
  const rootInfo = await stat(syncRoot);
  if (!rootInfo.isDirectory()) throw new Error(`Codex sync root is not a directory: ${syncRoot}`);

  const generatedAt = new Date();
  const { snapshot, assets, dialogue, validation } = await prepareBundle(repositoryRoot, syncRoot, generatedAt);
  // The gate (contract v5, E): a line the pipeline could not address or a
  // hash that does not match its content never reaches the share.
  if (validation.problems.length > 0) throw dialogueFailure(validation);
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
  const contentSha256 = sourceContentHash(snapshot, compatibility, assets, dialogue);
  const current = await readCurrentPointer(syncRoot);
  if (current?.sourceContentSha256 === contentSha256) {
    return { changed: false, snapshotId: current.snapshotId, contentSha256, assets: assets.length, lines: dialogue.counts.lines, report: validation.report };
  }

  const contentBytes = jsonBytes(snapshot);
  const compatibilityBytes = jsonBytes(compatibility);
  const snapshotId = `${timestampId(generatedAt)}-${contentSha256.slice(0, 12)}`;
  // The sidecar carries the release it belongs to; identical input gives
  // identical bytes because everything else in it was fixed above.
  const dialogueBytes = jsonBytes({ ...dialogue, snapshotId, generatedAt: generatedAt.toISOString(), sourceContentSha256: contentSha256 });
  const releaseRelative = `releases/${snapshotId}`;
  const releasePath = path.join(syncRoot, "releases", snapshotId);
  const stagingPath = path.join(syncRoot, ".staging", `publish-${snapshotId}-${randomBytes(4).toString("hex")}`);
  await mkdir(path.join(stagingPath, "content"), { recursive: true });
  await mkdir(path.join(stagingPath, "compatibility"), { recursive: true });

  const contentRelative = `${releaseRelative}/content/snapshot.json`;
  const compatibilityRelative = `${releaseRelative}/compatibility/canon-v1.json`;
  const dialogueRelative = `${releaseRelative}/content/dialogue-lines.json`;
  await writeFileDurably(path.join(stagingPath, "content", "snapshot.json"), contentBytes);
  await writeFileDurably(path.join(stagingPath, "content", "dialogue-lines.json"), dialogueBytes);
  await writeFileDurably(path.join(stagingPath, "compatibility", "canon-v1.json"), compatibilityBytes);
  const releaseAssets = await materializeReleaseAssets(syncRoot, stagingPath, releaseRelative, assets);

  const contentDescriptor = { path: contentRelative, sha256: sha256Bytes(contentBytes), bytes: contentBytes.byteLength };
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
    content: contentDescriptor,
    compatibility: {
      path: compatibilityRelative,
      sha256: sha256Bytes(compatibilityBytes),
      bytes: compatibilityBytes.byteLength,
    },
    // v5: the same snapshot under the name the game side reads, and the
    // flattened dialogue beside it.
    snapshot: contentDescriptor,
    dialogueLines: {
      path: dialogueRelative,
      sha256: sha256Bytes(dialogueBytes),
      bytes: dialogueBytes.byteLength,
      contractVersion: codexDialogueLinesContractVersion,
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
  return { changed: true, snapshotId, contentSha256, assets: assets.length, lines: dialogue.counts.lines, report: validation.report };
}

export async function publisherFingerprint(repositoryRoot: string) {
  const [database, assets] = await Promise.all([codexDatabaseFingerprint(), discoverCodexAssets(repositoryRoot)]);
  return `${database}:${assetStatFingerprint(assets)}`;
}
