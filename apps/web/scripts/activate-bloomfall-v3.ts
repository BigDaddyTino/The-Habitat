import "../lib/environment";
import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { createPrismaClient } from "@habitat/db/client";
import { applyBloomfallCanonicalContent } from "./implement-bloomfall-reach-content";
import { applyBloomfallRename } from "./rename-bloomfall-reach";
import { applyGeographicHierarchyRepair } from "./repair-geographic-hierarchy";
import { stableAtlasJson } from "./lib/atlas-integrity";
import { activateBloomfallLocalAtlas, verifyBloomfallLocalAtlas } from "./lib/bloomfall-local-atlas-activation";
import { publishBloomfallV3, verifyBloomfallV3Publication } from "./lib/bloomfall-v3-publication";
import {
  assertBloomfallExpectedBaseline,
  assertBloomfallProductionActivationTarget,
  assertBloomfallV3ArtLock,
  captureBloomfallActivationSnapshot,
  classifyBloomfallActivationSnapshot,
  loadBloomfallReleaseEvidence,
} from "./lib/bloomfall-production-activation";
import { verifyBloomfallV3ArtFiles } from "./verify-bloomfall-v3-art";

const root = path.resolve(process.cwd(), "..", "..");

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const apply = process.argv.includes("--apply");
  if (dryRun === apply) throw new Error("Bloomfall V3 activation requires exactly one of --dry-run or --apply.");

  const sourceUrl = process.env.BLOOMFALL_PRODUCTION_SOURCE_DATABASE_URL;
  const targetUrl = process.env.BLOOMFALL_PRODUCTION_ACTIVATION_DATABASE_URL;
  if (!sourceUrl || !targetUrl) throw new Error("Explicit BLOOMFALL_PRODUCTION_SOURCE_DATABASE_URL and BLOOMFALL_PRODUCTION_ACTIVATION_DATABASE_URL are required.");
  const identity = assertBloomfallProductionActivationTarget(sourceUrl, targetUrl, process.env);

  const actualHead = execFileSync("git", ["rev-parse", "HEAD"], { cwd: root, encoding: "utf8" }).trim().toLowerCase();
  const actualBuildId = (await readFile(path.join(root, "apps", "web", ".next", "BUILD_ID"), "utf8")).trim();
  const release = await loadBloomfallReleaseEvidence(process.env, actualHead, actualBuildId);
  const art = verifyBloomfallV3ArtFiles();
  assertBloomfallV3ArtLock({ selected: art.selected, assets: art.assets.map((asset) => ({ id: asset.id, sha256: asset.sha256 })) });

  const database = createPrismaClient(targetUrl);
  try {
    const before = await captureBloomfallActivationSnapshot(database);
    const baseline = assertBloomfallExpectedBaseline(before, process.env);
    const plan = {
      exactTarget: identity.target,
      baseline,
      baselineFingerprint: before.logicalSha256,
      expectedRecords: {
        rename: 1,
        hierarchy: 7,
        canonicalEntries: 63,
        regionalArcs: 6,
        semanticConnections: 2,
        localAtlas: { placements: 18, nodes: 8, boundaries: 10, rings: 3, references: 12, paths: 2 },
        v3Publication: { atlas: 2, codex: 13, total: 15 },
      },
      activationOrder: ["rename", "hierarchy-repair", "canonical-content", "stories", "semantic-connections", "local-atlas", "v3-publication", "verification"],
      selectedArt: art.assets.map((asset) => ({ id: asset.id, binding: asset.binding, sha256: asset.sha256 })),
      expectedFinalCounts: { storyEntries: 238, storyMaps: 4, placements: 54, nodePlacements: 10, topologyNodes: 27, boundaries: 36, rings: 14, references: 55, worldConnections: 27, connectionPaths: 11, arcs: 13 },
    };

    if (dryRun) {
      process.stdout.write(stableAtlasJson({ action: "DRY_RUN", writes: 0, identity, release, plan, result: baseline === "ALREADY_APPLIED" ? "ALREADY_APPLIED" : "READY" }));
      return;
    }

    if (baseline === "ALREADY_APPLIED") {
      const [localAtlas, publication] = await Promise.all([verifyBloomfallLocalAtlas(database, { expectedArtVersion: "v3" }), verifyBloomfallV3Publication(database)]);
      process.stdout.write(stableAtlasJson({ action: "ACTIVATE", status: "ALREADY_APPLIED", mutations: 0, identity, release, art: art.result, baseline: before, verification: { localAtlas, publication } }));
      return;
    }

    const rename = await applyBloomfallRename(database);
    const hierarchy = await applyGeographicHierarchyRepair(database);
    const content = await applyBloomfallCanonicalContent(database);
    const localAtlas = await activateBloomfallLocalAtlas(database);
    const publication = await publishBloomfallV3(database);
    const after = await captureBloomfallActivationSnapshot(database);
    if (classifyBloomfallActivationSnapshot(after) !== "ALREADY_APPLIED") throw new Error("Bloomfall V3 activation did not reach the exact final release state.");
    const [localVerification, publicationVerification] = await Promise.all([verifyBloomfallLocalAtlas(database, { expectedArtVersion: "v3" }), verifyBloomfallV3Publication(database)]);
    const mutations = rename.mutations + hierarchy.mutations + content.mutations + (localAtlas.status === "APPLIED" ? 1 : 0) + publication.mutations;
    process.stdout.write(stableAtlasJson({ action: "ACTIVATE", status: "ACTIVATED", mutations, identity, release, art: art.result, stages: { rename, hierarchy, content: { ...content, phases: ["canonical-content", "stories", "semantic-connections"] }, localAtlas, publication }, after, verification: { localAtlas: localVerification, publication: publicationVerification } }));
  } finally {
    await database.$disconnect();
  }
}

void main();
