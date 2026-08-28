import { setTimeout as delay } from "node:timers/promises";
import { readMirrorConfig, readPublisherConfig } from "./config";
import { mirrorCodexBundle, readAndVerifyBundle } from "./mirror";
import { codexPublishState, publishCodexBundle, publisherFingerprint } from "./publisher";

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
  if (command === "health") {
    // Integrity is not freshness. `verify` confirms the bundle on the drive
    // hashes correctly, which it does even when the publisher has been failing
    // for hours and the drive is a day behind canon — that is exactly what
    // happened on 2026-08-28. This asks the only question that matters to the
    // machine building the game: is what is on the drive what canon says now?
    const config = readPublisherConfig();
    const verified = await readAndVerifyBundle(config.syncRoot, true).catch((error: unknown) => {
      log(`UNHEALTHY — the published bundle does not verify. ${error instanceof Error ? error.message : String(error)}`);
      process.exitCode = 1;
      return null;
    });
    if (!verified) return;
    const state = await codexPublishState(config.repositoryRoot, config.syncRoot);
    const age = state.current ? Date.now() - Date.parse(state.current.generatedAt) : null;
    const hours = age === null ? "unknown" : (age / 3_600_000).toFixed(1);

    log(`bundle    ${verified.pointer.snapshotId} (${verified.manifest.assets.length} assets, published ${hours}h ago)`);
    log(`canon     ${state.release ? `${state.release.name} ${state.release.sha256.slice(0, 12)}…` : "NONE CUT"}`);
    const onDrive = verified.manifest.storyRelease;
    log(`on drive  ${onDrive ? `${onDrive.name} ${onDrive.sha256.slice(0, 12)}…` : "pre-boundary bundle — canon payload was read live"}`);

    const problems: string[] = [];
    if (state.stale) problems.push(`STALE — ${state.reason ?? "the drive does not match current canon"}. The publisher should have republished and has not; check codex-sync-logs.`);
    if (state.release && onDrive && onDrive.sha256 !== state.release.sha256) {
      problems.push(`BEHIND — a release (${state.release.name}) has been cut that the drive has not picked up.`);
    }
    if (state.release && !onDrive) problems.push("PRE-BOUNDARY — the live bundle predates the release boundary; republish so its canon payload comes from a named release.");

    for (const problem of problems) log(problem);
    if (problems.length === 0) log("HEALTHY — the drive matches current canon.");
    else process.exitCode = 1;
    return;
  }
  if (command === "verify") {
    const config = readPublisherConfig();
    const result = await readAndVerifyBundle(config.syncRoot, true);
    log(`Verified ${result.pointer.snapshotId}: ${result.manifest.assets.length} assets and all content hashes are intact.`);
    return;
  }
  throw new Error("Usage: pnpm --filter @habitat/codex-sync <publish|mirror|verify|health> [--watch]");
}

main().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.stack ?? error.message : String(error)}\n`);
  process.exitCode = 1;
});
