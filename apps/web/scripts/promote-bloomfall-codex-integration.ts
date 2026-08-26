import "../lib/environment";
import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { createPrismaClient } from "@habitat/db/client";
import {
  bloomfallCodexIntegrationContract,
  bloomfallCodexIntegrationVersion,
  bloomfallIntegrationNewSlugs,
  bloomfallIntegrationRecords,
  bloomfallRouteRecords,
} from "../lib/bloomfall-codex-integration";
import { bloomfallAdaptiveP0SelectedAssets } from "../lib/bloomfall-adaptive-p0";
import { bloomfallAdaptiveP1P2SelectedAssets } from "../lib/bloomfall-adaptive-p1p2";
import {
  applyBloomfallCodexIntegration,
  bloomfallCodexIntegrationBlockCount,
  bloomfallCodexIntegrationRecordCount,
  bloomfallCodexPlanEquals,
  bloomfallCodexPlanMutations,
  planBloomfallCodexIntegration,
  validateBloomfallCodexManifest,
} from "./lib/bloomfall-codex-promotion";
import {
  assertBloomfallExpectedBaseline,
  assertBloomfallProductionActivationTarget,
  captureBloomfallActivationSnapshot,
  loadBloomfallReleaseEvidence,
} from "./lib/bloomfall-production-activation";
import { stableAtlasJson } from "./lib/atlas-integrity";

/**
 * Controlled production promotion of the reviewed Bloomfall Codex systems
 * integration.
 *
 * It promotes content only: seven system dossiers and the cross-link blocks
 * that connect the region to them. The Adaptive Mutation galleries need no
 * database state — their manifests are hash-locked in source, so they go live
 * with the application build, and this tool refuses to run unless those
 * manifests still describe the files on disk.
 *
 * The gates are the ones the V3 cutover established: an explicit canonical
 * database URL, production environment and mode, the owner authorization
 * token, a release-specific promotion token, the exact source commit, the
 * exact build it produced, and a fresh verified backup.
 */

const promotionAuthorization = "I_AUTHORIZE_BLOOMFALL_CODEX_INTEGRATION_PRODUCTION_PROMOTION" as const;
const root = path.resolve(process.cwd(), "..", "..");

/** The galleries ship with the build, so the release proves the manifests and
 *  the files still agree before it opens them to production. */
function adaptiveGalleryLock() {
  const selected = [...bloomfallAdaptiveP0SelectedAssets, ...bloomfallAdaptiveP1P2SelectedAssets];
  const bindings = selected.map((asset) => asset.codexDevelopmentBinding).filter((binding): binding is string => Boolean(binding));
  if (new Set(bindings).size !== bindings.length) throw new Error("Adaptive gallery bindings are not unique.");
  if (bloomfallAdaptiveP0SelectedAssets.length !== 12) throw new Error(`Expected 12 approved P0 finals, found ${bloomfallAdaptiveP0SelectedAssets.length}.`);
  if (bloomfallAdaptiveP1P2SelectedAssets.length !== 14) throw new Error(`Expected 14 approved P1/P2 finals, found ${bloomfallAdaptiveP1P2SelectedAssets.length}.`);
  return { p0: bloomfallAdaptiveP0SelectedAssets.length, p1p2: bloomfallAdaptiveP1P2SelectedAssets.length, total: selected.length, boundStates: bindings.length };
}

function routeParity() {
  const counts = { PERMANENT: 0, CONDITIONAL: 0, DYNAMIC: 0, DEFERRED: 0 };
  for (const route of bloomfallRouteRecords) counts[route.classKey] += 1;
  if (counts.PERMANENT !== 1 || counts.CONDITIONAL !== 3 || counts.DYNAMIC !== 5 || counts.DEFERRED !== 3) throw new Error(`Route classification drifted: ${stableAtlasJson(counts, false)}`);
  const drawn = bloomfallRouteRecords.filter((route) => route.persisted).length;
  if (drawn !== 4) throw new Error(`Expected 4 drawn routes, found ${drawn}.`);
  return { ...counts, drawn };
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const apply = process.argv.includes("--apply");
  if (dryRun === apply) throw new Error("Bloomfall Codex promotion requires exactly one of --dry-run or --apply.");

  const sourceUrl = process.env.BLOOMFALL_PRODUCTION_SOURCE_DATABASE_URL;
  const targetUrl = process.env.BLOOMFALL_PRODUCTION_ACTIVATION_DATABASE_URL;
  if (!sourceUrl || !targetUrl) throw new Error("Explicit BLOOMFALL_PRODUCTION_SOURCE_DATABASE_URL and BLOOMFALL_PRODUCTION_ACTIVATION_DATABASE_URL are required.");
  const identity = assertBloomfallProductionActivationTarget(sourceUrl, targetUrl, process.env);
  if (identity.mode !== "PRODUCTION") throw new Error("The Bloomfall Codex promotion targets production only.");
  if (process.env.BLOOMFALL_CODEX_PROMOTION_CONFIRM !== promotionAuthorization) throw new Error("Bloomfall Codex promotion requires its own explicit authorization token.");

  const actualHead = execFileSync("git", ["rev-parse", "HEAD"], { cwd: root, encoding: "utf8" }).trim().toLowerCase();
  const dirty = execFileSync("git", ["status", "--porcelain"], { cwd: root, encoding: "utf8" }).trim();
  if (dirty) throw new Error("Bloomfall Codex promotion refuses to release from a dirty worktree.");
  const actualBuildId = (await readFile(path.join(root, "apps", "web", ".next", "BUILD_ID"), "utf8")).trim();
  const release = await loadBloomfallReleaseEvidence(process.env, actualHead, actualBuildId, "BLOOMFALL_CODEX");

  validateBloomfallCodexManifest();
  const galleries = adaptiveGalleryLock();
  const routes = routeParity();

  const database = createPrismaClient(targetUrl);
  try {
    const before = await captureBloomfallActivationSnapshot(database);
    const baseline = assertBloomfallExpectedBaseline(before, process.env);
    const plan = await planBloomfallCodexIntegration(database);
    const mutations = bloomfallCodexPlanMutations(plan);

    const summary = {
      exactTarget: identity.target,
      baseline,
      baselineFingerprint: before.logicalSha256,
      storyEntriesBefore: before.counts.storyEntries,
      expected: {
        systemDossiers: bloomfallCodexIntegrationRecordCount,
        newDossiers: bloomfallIntegrationNewSlugs,
        crossLinkBlocks: bloomfallCodexIntegrationBlockCount,
        adaptiveGalleries: galleries,
        routes,
      },
      plan: { create: plan.create, upgrade: plan.upgrade, link: plan.link, unchangedRecords: plan.unchanged.length },
    };

    if (dryRun) {
      process.stdout.write(stableAtlasJson({
        contract: `${bloomfallCodexIntegrationContract}-production-dry-run`,
        contractVersion: bloomfallCodexIntegrationVersion,
        action: "DRY_RUN",
        writes: 0,
        identity,
        release,
        summary,
        plannedMutations: mutations,
        result: mutations === 0 ? "ALREADY_APPLIED" : "READY",
      }));
      return;
    }

    if (mutations === 0) {
      process.stdout.write(stableAtlasJson({
        contract: `${bloomfallCodexIntegrationContract}-production-promotion`,
        contractVersion: bloomfallCodexIntegrationVersion,
        action: "PROMOTE",
        status: "ALREADY_APPLIED",
        mutations: 0,
        identity,
        release,
        summary,
      }));
      return;
    }

    let applied = 0;
    const actorUserId = await database.$transaction(async (tx) => {
      const actor = await tx.user.findFirst({ where: { role: "ADMIN", isActive: true }, orderBy: { id: "asc" }, select: { id: true } });
      if (!actor) throw new Error("Bloomfall Codex promotion requires an active administrator for audit authorship.");
      const confirmed = await planBloomfallCodexIntegration(tx);
      if (!bloomfallCodexPlanEquals(confirmed, plan)) throw new Error("Production changed after the dry run; transaction stopped.");
      applied = await applyBloomfallCodexIntegration(tx, actor.id, "Prompt F production promotion");
      return actor.id;
    }, { isolationLevel: "Serializable", timeout: 180_000 });

    const after = await captureBloomfallActivationSnapshot(database);
    const verification = await planBloomfallCodexIntegration(database);
    const remaining = bloomfallCodexPlanMutations(verification);
    if (remaining !== 0) throw new Error(`Promotion left ${remaining} records unpromoted.`);
    if (after.counts.storyEntries !== before.counts.storyEntries + bloomfallIntegrationNewSlugs.length) {
      throw new Error(`Story entry count moved unexpectedly: ${before.counts.storyEntries} to ${after.counts.storyEntries}.`);
    }

    process.stdout.write(stableAtlasJson({
      contract: `${bloomfallCodexIntegrationContract}-production-promotion`,
      contractVersion: bloomfallCodexIntegrationVersion,
      action: "PROMOTE",
      status: "APPLIED",
      identity,
      release,
      actorUserId,
      summary,
      mutations: applied,
      storyEntriesAfter: after.counts.storyEntries,
      afterFingerprint: after.logicalSha256,
      verification: { unpromotedRecords: remaining, dossiers: bloomfallIntegrationRecords.length },
      schemaChanges: 0,
      imageGeneration: 0,
    }));
  } finally {
    await database.$disconnect();
  }
}

void main();
