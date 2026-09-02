import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {
  codexBundleContractVersion,
  type CodexBundleManifest,
  type CodexBundlePointer,
} from "@habitat/shared";
import { jsonBytes, resolveBundlePath, sha256Bytes } from "./integrity";
import { mirrorCodexBundle, readAndVerifyBundle } from "./mirror";

test("bundle paths cannot escape their declared root", () => {
  const root = path.resolve(os.tmpdir(), "codex-root");
  assert.equal(resolveBundlePath(root, "releases/example/manifest.json"), path.join(root, "releases", "example", "manifest.json"));
  assert.throws(() => resolveBundlePath(root, "../outside.json"), /escapes/);
  assert.throws(() => resolveBundlePath(root, path.resolve(root, "absolute.json")), /Unsafe/);
  if (process.platform === "win32") {
    assert.equal(
      resolveBundlePath("\\\\codex-host\\codex-share", "releases/example/manifest.json"),
      "\\\\codex-host\\codex-share\\releases\\example\\manifest.json",
    );
  }
});

test("mirror verifies and atomically materializes a complete release", async () => {
  const temporaryRoot = await mkdtemp(path.join(os.tmpdir(), "habitat-codex-sync-"));
  const sourceRoot = path.join(temporaryRoot, "source");
  const mirrorRoot = path.join(temporaryRoot, "mirror");
  const snapshotId = "fixture-001";
  const releaseRelative = `releases/${snapshotId}`;
  const content = jsonBytes({ contract: "fixture", complete: true });
  const compatibility = jsonBytes({ contractVersion: 1, arcs: [], bible: [] });
  const asset = Buffer.from("fixture-image-bytes");
  const assetHash = sha256Bytes(asset);
  const assetPath = `blobs/sha256/${assetHash.slice(0, 2)}/${assetHash}`;
  const contentDescriptor = {
    path: `${releaseRelative}/content/snapshot.json`,
    sha256: sha256Bytes(content),
    bytes: content.byteLength,
  };
  const compatibilityDescriptor = {
    path: `${releaseRelative}/compatibility/canon-v1.json`,
    sha256: sha256Bytes(compatibility),
    bytes: compatibility.byteLength,
  };
  const manifest: CodexBundleManifest = {
    contract: "martino-codex-bundle",
    contractVersion: codexBundleContractVersion,
    snapshotId,
    generatedAt: "2026-08-20T00:00:00.000Z",
    revisionCursor: null,
    sourceContentSha256: "a".repeat(64),
    counts: { arcs: 0, nodes: 0, edges: 0, entries: 0, links: 0, comments: 0, revisions: 0, maps: 0, placements: 0, nodePlacements: 0, assets: 1 },
    content: contentDescriptor,
    compatibility: compatibilityDescriptor,
    assets: [
      {
        path: assetPath,
        logicalPath: "/images/characters/fixture.jpg",
        sha256: assetHash,
        bytes: asset.byteLength,
        mimeType: "image/jpeg",
        width: null,
        height: null,
      },
    ],
  };
  const manifestBytes = jsonBytes(manifest);
  const pointer: CodexBundlePointer = {
    contract: "martino-codex-pointer",
    contractVersion: codexBundleContractVersion,
    snapshotId,
    generatedAt: manifest.generatedAt,
    manifestPath: `${releaseRelative}/manifest.json`,
    manifestSha256: sha256Bytes(manifestBytes),
    sourceContentSha256: manifest.sourceContentSha256,
  };

  try {
    await mkdir(path.join(sourceRoot, releaseRelative, "content"), { recursive: true });
    await mkdir(path.join(sourceRoot, releaseRelative, "compatibility"), { recursive: true });
    await mkdir(path.dirname(path.join(sourceRoot, ...assetPath.split("/"))), { recursive: true });
    await writeFile(path.join(sourceRoot, releaseRelative, "content", "snapshot.json"), content);
    await writeFile(path.join(sourceRoot, releaseRelative, "compatibility", "canon-v1.json"), compatibility);
    await writeFile(path.join(sourceRoot, ...assetPath.split("/")), asset);
    await writeFile(path.join(sourceRoot, releaseRelative, "manifest.json"), manifestBytes);
    await writeFile(path.join(sourceRoot, "current.json"), jsonBytes(pointer));

    const first = await mirrorCodexBundle(sourceRoot, mirrorRoot);
    const second = await mirrorCodexBundle(sourceRoot, mirrorRoot);
    assert.deepEqual(first, { snapshotId, assets: 1 });
    assert.deepEqual(second, first);
    await readAndVerifyBundle(mirrorRoot, true);
    assert.deepEqual(await readFile(path.join(mirrorRoot, releaseRelative, "images", "characters", "fixture.jpg")), asset);

    await writeFile(path.join(sourceRoot, ...assetPath.split("/")), Buffer.from("tampered"));
    await assert.rejects(readAndVerifyBundle(sourceRoot, true), /failed integrity verification/);
  } finally {
    await rm(temporaryRoot, { recursive: true, force: true });
  }
});

test("a v5 release mirrors its dialogue sidecar and voice clips, and a tampered sidecar fails verification", async () => {
  const temporaryRoot = await mkdtemp(path.join(os.tmpdir(), "habitat-codex-sync-v5-"));
  const sourceRoot = path.join(temporaryRoot, "source");
  const mirrorRoot = path.join(temporaryRoot, "mirror");
  const snapshotId = "fixture-v5";
  const releaseRelative = `releases/${snapshotId}`;
  const content = jsonBytes({ contract: "fixture", complete: true });
  const compatibility = jsonBytes({ contractVersion: 1, arcs: [], bible: [] });
  const dialogue = jsonBytes({ contract: "martino-codex-dialogue-lines", contractVersion: 1, lines: [] });
  const clip = Buffer.from("RIFF-fixture-wave-bytes");
  const clipHash = sha256Bytes(clip);
  const clipPath = `blobs/sha256/${clipHash.slice(0, 2)}/${clipHash}`;
  const descriptor = (relative: string, bytes: Buffer) => ({ path: `${releaseRelative}/${relative}`, sha256: sha256Bytes(bytes), bytes: bytes.byteLength });
  const manifest: CodexBundleManifest = {
    contract: "martino-codex-bundle",
    contractVersion: 5,
    snapshotId,
    generatedAt: "2026-09-02T00:00:00.000Z",
    revisionCursor: null,
    sourceContentSha256: "b".repeat(64),
    counts: { arcs: 0, nodes: 0, edges: 0, entries: 0, links: 0, comments: 0, revisions: 0, maps: 0, placements: 0, nodePlacements: 0, assets: 1 },
    content: descriptor("content/snapshot.json", content),
    compatibility: descriptor("compatibility/canon-v1.json", compatibility),
    snapshot: descriptor("content/snapshot.json", content),
    dialogueLines: { ...descriptor("content/dialogue-lines.json", dialogue), contractVersion: 1 },
    assets: [{ path: clipPath, logicalPath: "/audio/voice-clips/tino.wav", sha256: clipHash, bytes: clip.byteLength, mimeType: "audio/wav", width: null, height: null }],
  };
  const manifestBytes = jsonBytes(manifest);
  const pointer: CodexBundlePointer = {
    contract: "martino-codex-pointer",
    contractVersion: 5,
    snapshotId,
    generatedAt: manifest.generatedAt,
    manifestPath: `${releaseRelative}/manifest.json`,
    manifestSha256: sha256Bytes(manifestBytes),
    sourceContentSha256: manifest.sourceContentSha256,
  };
  try {
    await mkdir(path.join(sourceRoot, releaseRelative, "content"), { recursive: true });
    await mkdir(path.join(sourceRoot, releaseRelative, "compatibility"), { recursive: true });
    await mkdir(path.dirname(path.join(sourceRoot, ...clipPath.split("/"))), { recursive: true });
    await writeFile(path.join(sourceRoot, releaseRelative, "content", "snapshot.json"), content);
    await writeFile(path.join(sourceRoot, releaseRelative, "content", "dialogue-lines.json"), dialogue);
    await writeFile(path.join(sourceRoot, releaseRelative, "compatibility", "canon-v1.json"), compatibility);
    await writeFile(path.join(sourceRoot, ...clipPath.split("/")), clip);
    await writeFile(path.join(sourceRoot, releaseRelative, "manifest.json"), manifestBytes);
    await writeFile(path.join(sourceRoot, "current.json"), jsonBytes(pointer));

    const result = await mirrorCodexBundle(sourceRoot, mirrorRoot);
    assert.deepEqual(result, { snapshotId, assets: 1 });
    const verified = await readAndVerifyBundle(mirrorRoot, true);
    assert.equal(verified.manifest.contractVersion, 5);
    assert.equal(verified.manifest.dialogueLines?.path, `${releaseRelative}/content/dialogue-lines.json`);
    assert.deepEqual(await readFile(path.join(mirrorRoot, releaseRelative, "content", "dialogue-lines.json")), dialogue);
    assert.deepEqual(await readFile(path.join(mirrorRoot, releaseRelative, "audio", "voice-clips", "tino.wav")), clip);

    await writeFile(path.join(sourceRoot, releaseRelative, "content", "dialogue-lines.json"), Buffer.from("{}"));
    await assert.rejects(readAndVerifyBundle(sourceRoot, true), /dialogue lines sidecar failed integrity verification/);
  } finally {
    await rm(temporaryRoot, { recursive: true, force: true });
  }
});
