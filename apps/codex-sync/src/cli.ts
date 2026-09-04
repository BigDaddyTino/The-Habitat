import { setTimeout as delay } from "node:timers/promises";
import { readImportConfig, readMirrorConfig, readPublisherConfig } from "./config";
import { applyCodexImport, describeCodexImportDiff, planCodexImport, readImportLedger, rollbackCodexImport } from "./import";
import { mirrorCodexBundle, readAndVerifyBundle } from "./mirror";
import { codexDialogueReport, codexPublishState, publishCodexBundle, publisherFingerprint } from "./publisher";
import { describeRetention } from "./retention";

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
        const result = await publishCodexBundle(config.repositoryRoot, config.syncRoot, config);
        fingerprint = nextFingerprint;
        log(
          result.changed
            ? `Published ${result.snapshotId} with ${result.assets} Codex assets.`
            : `Codex is current at ${result.snapshotId}; no release was created.`,
        );
        // Logged so a share quietly filling up is visible long before it is a
        // problem — the last time it filled up, nothing said so anywhere.
        const pruned = result.pruned && describeRetention(result.pruned);
        if (pruned) log(pruned);
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
    const result = await publishCodexBundle(config.repositoryRoot, config.syncRoot, config);
    log(
      result.changed
        ? `Published ${result.snapshotId} with ${result.assets} Codex assets and ${result.lines} dialogue lines.`
        : `Codex is current at ${result.snapshotId}; no release was created.`,
    );
    for (const row of result.report) log(`  ${row}`);
    return;
  }
  if (command === "lines") {
    // The dialogue validation report (contract v5, E/F), without touching the
    // share: what the next publish would carry, and anything that would stop
    // it. Exit code 1 on any problem, so a script can gate on it.
    const config = readPublisherConfig();
    const { validation, counts } = await codexDialogueReport(config.repositoryRoot);
    log(`dialogue  ${counts.lines} lines, ${counts.voiced} voiced, ${counts.speakers} speakers, ${counts.roles} roles`);
    for (const row of validation.report) log(`  ${row}`);
    if (validation.problems.length) {
      log(`${validation.problems.length} problem(s) would stop a publish:`);
      for (const problem of validation.problems) log(`  ! ${problem}`);
      process.exitCode = 1;
    } else log("VALID — every line is addressable, attributed, and hashed to its content.");
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

    log(`dialogue  ${state.lines.lines} lines, ${state.lines.voiced} voiced${state.dialogue.problems.length ? ` — ${state.dialogue.problems.length} validation problem(s)` : ""}`);
    const problems: string[] = [];
    if (state.dialogue.problems.length) problems.push(`INVALID DIALOGUE — the publisher refuses to ship until these are fixed: ${state.dialogue.problems.slice(0, 5).join("; ")}${state.dialogue.problems.length > 5 ? "; …" : ""}`);
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
  if (command === "import") {
    const config = readImportConfig();
    const rollback = flags.includes("--rollback");
    const apply = flags.includes("--apply");

    if (rollback) {
      const at = flags.indexOf("--to");
      const result = await rollbackCodexImport(config.importRoot, at === -1 ? undefined : flags[at + 1]);
      log(`Rolled back from ${result.from.snapshotId} to ${result.to.snapshotId}`);
      log(`  canon  ${result.to.storyRelease ? `${result.to.storyRelease.name} ${result.to.storyRelease.sha256.slice(0, 12)}…` : "pre-boundary bundle"}`);
      for (const row of describeCodexImportDiff(result.diff)) log(`  ${row}`);
      log("Nothing was deleted. The staged files for both releases are still on disk.");
      return;
    }

    if (flags.includes("--status")) {
      const ledger = await readImportLedger(config.importRoot);
      const active = ledger.history.find((entry) => entry.snapshotId === ledger.current);
      if (!active) { log("Nothing has been imported here yet."); return; }
      log(`imported  ${active.snapshotId} on ${active.importedAt} (${active.assets} assets)`);
      log(`canon     ${active.storyRelease ? `${active.storyRelease.name} ${active.storyRelease.sha256.slice(0, 12)}…` : "pre-boundary bundle"}`);
      const earlier = ledger.history.length - 1;
      log(`history   ${ledger.history.length} release(s) staged${earlier > 0 ? `, ${earlier} to roll back to` : "; nothing earlier to roll back to"}`);
      return;
    }

    // Verifying the share happens first, whether or not anything is applied,
    // so a corrupt release fails before a single local file is touched.
    const plan = await planCodexImport(config.sourceRoot, config.importRoot);
    const release = plan.source.manifest.storyRelease;
    log(`share     ${plan.source.pointer.snapshotId} (${plan.source.manifest.assets.length} assets), verified`);
    log(`canon     ${release ? `${release.name} ${release.sha256.slice(0, 12)}…` : "PRE-BOUNDARY — this payload was read live, not from a named cut"}`);
    log(`imported  ${plan.imported ? plan.imported.snapshotId : "nothing yet"}`);

    if (plan.current) { log("Already imported. Nothing to do."); return; }
    if (plan.diff.empty && plan.imported) log("The release is new but nothing the game reads has changed.");
    else for (const row of describeCodexImportDiff(plan.diff)) log(`  ${row}`);

    if (!apply) { log("Dry run. Re-run with --apply to stage and record it."); return; }
    const result = await applyCodexImport(config.sourceRoot, config.importRoot);
    log(plan.imported
      ? `Imported ${result.record.snapshotId}. ${plan.imported.snapshotId} is still staged, so --rollback goes back to it.`
      : `Imported ${result.record.snapshotId}. This is the first import here, so there is nothing earlier to roll back to.`);
    return;
  }
  throw new Error("Usage: pnpm --filter @habitat/codex-sync <publish|mirror|verify|health|lines|import> [--watch] [--apply] [--status] [--rollback [--to <snapshotId>]]");
}

main().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.stack ?? error.message : String(error)}\n`);
  process.exitCode = 1;
});
