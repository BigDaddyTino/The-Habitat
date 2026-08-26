import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { bloomfallCreatureEnhancements } from "../lib/bloomfall-creature-enhancements";
import { bloomfallAdaptiveP0SelectedAssets } from "../lib/bloomfall-adaptive-p0";
import { bloomfallAdaptiveP1P2Assets, bloomfallAdaptiveP1P2GenerationSummary, bloomfallAdaptiveP1P2RejectedAssets, bloomfallAdaptiveP1P2ReusedAssets, bloomfallAdaptiveP1P2SelectedAssets } from "../lib/bloomfall-adaptive-p1p2";

type Failure = { asset?: string; check: string; expected?: unknown; actual?: unknown };
const failures: Failure[] = [];
const webRoot = process.cwd();

function assetPath(asset: (typeof bloomfallAdaptiveP1P2Assets)[number]) {
  if (asset.reusedAsset === "V3") return path.join(webRoot, "private", "codex-art", "bloomfall-v3", asset.filename);
  if (asset.reusedAsset === "P0") return path.join(webRoot, "private", "codex-art", "bloomfall-adaptive-p0", "candidates", asset.filename);
  const directory = asset.status === "REJECTED" || asset.status === "REVISE" ? "sources" : "candidates";
  return path.join(webRoot, "private", "codex-art", "bloomfall-adaptive-p1p2", directory, asset.filename);
}

for (const asset of bloomfallAdaptiveP1P2Assets) {
  const target = assetPath(asset);
  if (!existsSync(target)) { failures.push({ asset: asset.id, check: "file existence", expected: target, actual: "missing" }); continue; }
  const bytes = readFileSync(target);
  const sha256 = createHash("sha256").update(bytes).digest("hex");
  if (sha256 !== asset.sha256) failures.push({ asset: asset.id, check: "SHA-256", expected: asset.sha256, actual: sha256 });
  const width = bytes.readUInt32BE(16), height = bytes.readUInt32BE(20);
  if (width !== asset.width || height !== asset.height) failures.push({ asset: asset.id, check: "dimensions", expected: `${asset.width}x${asset.height}`, actual: `${width}x${height}` });
}

const exact = (check: string, actual: unknown, expected: unknown) => { if (actual !== expected) failures.push({ check, expected, actual }); };
const expectedRemaining = bloomfallCreatureEnhancements.filter((entry) => entry.image.priority === "P1" || entry.image.priority === "P2").reduce((sum, entry) => sum + entry.image.newStateReferences + entry.image.newHeroImages, 0);
exact("Prompt B P1/P2 matrix", expectedRemaining, 14);
exact("approved P1/P2 count", bloomfallAdaptiveP1P2SelectedAssets.length, 14);
exact("staged rejected asset count", bloomfallAdaptiveP1P2RejectedAssets.length, 0);
exact("rejected generation count", bloomfallAdaptiveP1P2GenerationSummary.rejectedAttempts, 1);
exact("reuse records", bloomfallAdaptiveP1P2ReusedAssets.length, 3);
exact("P0 selected regression", bloomfallAdaptiveP0SelectedAssets.length, 12);
exact("combined required new visual package", bloomfallAdaptiveP0SelectedAssets.length + bloomfallAdaptiveP1P2SelectedAssets.length, 26);

for (const asset of bloomfallAdaptiveP1P2SelectedAssets) {
  for (const [category, value] of Object.entries(asset.scores)) if (value < 9) failures.push({ asset: asset.id, check: `${category} score >= 9`, expected: ">= 9", actual: value });
  if (!asset.codexDevelopmentBinding) failures.push({ asset: asset.id, check: "development binding", expected: "non-null", actual: null });
}

const promotionSlugs = bloomfallCreatureEnhancements.filter((entry) => entry.promotedThreat.eligible).map((entry) => entry.slug).sort();
if (promotionSlugs.join("|") !== "blackbloom-hart|latchhound|mirejaw") failures.push({ check: "promotion allow-list", expected: ["blackbloom-hart", "latchhound", "mirejaw"], actual: promotionSlugs });

const quality = Object.fromEntries(Object.keys(bloomfallAdaptiveP1P2SelectedAssets[0]!.scores).map((category) => {
  const values = bloomfallAdaptiveP1P2SelectedAssets.map((asset) => asset.scores[category as keyof typeof asset.scores]);
  return [category, { minimum: Math.min(...values), average: Number((values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(2)) }];
}));

const report = { contract: "martino-bloomfall-adaptive-p1p2-audit", contractVersion: 1, expectedFromPromptB: expectedRemaining, selected: bloomfallAdaptiveP1P2SelectedAssets.length, generatedAttempts: bloomfallAdaptiveP1P2GenerationSummary.attempts, revised: bloomfallAdaptiveP1P2GenerationSummary.revisedSubjects, rejected: bloomfallAdaptiveP1P2GenerationSummary.rejectedAttempts, stagedRejectedAssets: bloomfallAdaptiveP1P2RejectedAssets.length, reusedV3: bloomfallAdaptiveP1P2ReusedAssets.filter((asset) => asset.status === "REUSED_V3").length, reusedP0: bloomfallAdaptiveP1P2ReusedAssets.filter((asset) => asset.status === "REUSED_P0").length, p0SelectedRegression: bloomfallAdaptiveP0SelectedAssets.length, combinedRequiredPackage: 26, filesChecked: bloomfallAdaptiveP1P2Assets.length, quality, productionWrites: 0, productionMigrations: 0, failures, status: failures.length ? "FAIL" : "PASS" };
console.log(JSON.stringify(report, null, 2));
if (failures.length) process.exitCode = 1;
