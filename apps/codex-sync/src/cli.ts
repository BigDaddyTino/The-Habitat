import { setTimeout as delay } from "node:timers/promises";
import { readMirrorConfig, readPublisherConfig } from "./config";
import { mirrorCodexBundle, readAndVerifyBundle } from "./mirror";
import { publishCodexBundle, publisherFingerprint } from "./publisher";

function log(message: string) {
  process.stdout.write(`[${new Date().toISOString()}] ${message}\n`);
}

async function watchPublisher() {
  const config = readPublisherConfig();
  let fingerprint: string | null = null;
  for (;;) {
    try {
      const nextFingerprint = await publisherFingerprint(config.repositoryRoot);
      if (nextFingerprint !== fingerprint) {
        const result = await publishCodexBundle(config.repositoryRoot, config.syncRoot);
        fingerprint = nextFingerprint;
        log(
          result.changed
            ? `Published ${result.snapshotId} with ${result.assets} Codex assets.`
            : `Codex is current at ${result.snapshotId}; no release was created.`,
        );
      }
    } catch (error) {
      log(`Publish failed; the last complete release remains active. ${error instanceof Error ? error.message : String(error)}`);
    }
    await delay(config.pollIntervalMs);
  }
}

async function watchMirror() {
  const config = readMirrorConfig();
  let activeSnapshot: string | null = null;
  for (;;) {
    try {
      const result = await mirrorCodexBundle(config.sourceRoot, config.mirrorRoot);
      if (result.snapshotId !== activeSnapshot) {
        activeSnapshot = result.snapshotId;
        log(`Mirrored ${result.snapshotId} with ${result.assets} verified Codex assets.`);
      }
    } catch (error) {
      log(`Mirror failed; the last complete local release remains active. ${error instanceof Error ? error.message : String(error)}`);
    }
    await delay(config.pollIntervalMs);
  }
}

async function main() {
  const [command = "", ...flags] = process.argv.slice(2);
  const watch = flags.includes("--watch");
  if (command === "publish") {
    if (watch) return watchPublisher();
    const config = readPublisherConfig();
    const result = await publishCodexBundle(config.repositoryRoot, config.syncRoot);
    log(
      result.changed
        ? `Published ${result.snapshotId} with ${result.assets} Codex assets.`
        : `Codex is current at ${result.snapshotId}; no release was created.`,
    );
    return;
  }
  if (command === "mirror") {
    if (watch) return watchMirror();
    const config = readMirrorConfig();
    const result = await mirrorCodexBundle(config.sourceRoot, config.mirrorRoot);
    log(`Mirrored ${result.snapshotId} with ${result.assets} verified Codex assets.`);
    return;
  }
  if (command === "verify") {
    const config = readPublisherConfig();
    const result = await readAndVerifyBundle(config.syncRoot, true);
    log(`Verified ${result.pointer.snapshotId}: ${result.manifest.assets.length} assets and all content hashes are intact.`);
    return;
  }
  throw new Error("Usage: pnpm --filter @habitat/codex-sync <publish|mirror|verify> [--watch]");
}

main().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.stack ?? error.message : String(error)}\n`);
  process.exitCode = 1;
});
