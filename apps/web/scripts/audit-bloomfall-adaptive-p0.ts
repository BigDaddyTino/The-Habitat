import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { bloomfallCreatureEnhancements } from "../lib/bloomfall-creature-enhancements";
import {
  bloomfallAdaptiveP0Assets,
  bloomfallAdaptiveP0RevisionAssets,
  bloomfallAdaptiveP0ReusedAssets,
  bloomfallAdaptiveP0SelectedAssets,
} from "../lib/bloomfall-adaptive-p0";

type Failure = { asset?: string; check: string; expected?: unknown; actual?: unknown };
const failures: Failure[] = [];
const webRoot = process.cwd();

function assetPath(asset: (typeof bloomfallAdaptiveP0Assets)[number]) {
  if (asset.existingV3Reused) return path.join(webRoot, "private", "codex-art", "bloomfall-v3", asset.filename);
  const directory = asset.status === "REVISE" ? "sources" : "candidates";
  return path.join(webRoot, "private", "codex-art", "bloomfall-adaptive-p0", directory, asset.filename);
}

for (const asset of bloomfallAdaptiveP0Assets) {
  const target = assetPath(asset);
  if (!existsSync(target)) {
    failures.push({ asset: asset.id, check: "file existence", expected: target, actual: "missing" });
    continue;
  }
  const bytes = readFileSync(target);
  const sha256 = createHash("sha256").update(bytes).digest("hex");
  if (sha256 !== asset.sha256) failures.push({ asset: asset.id, check: "SHA-256", expected: asset.sha256, actual: sha256 });
  const width = bytes.readUInt32BE(16);
  const height = bytes.readUInt32BE(20);
  if (width !== asset.width || height !== asset.height) failures.push({ asset: asset.id, check: "dimensions", expected: `${asset.width}x${asset.height}`, actual: `${width}x${height}` });
}

const exact = (check: string, actual: unknown, expected: unknown) => {
  if (actual !== expected) failures.push({ check, expected, actual });
};
exact("approved P0 count", bloomfallAdaptiveP0SelectedAssets.length, 12);
exact("revision count", bloomfallAdaptiveP0RevisionAssets.length, 4);
exact("rejected count", bloomfallAdaptiveP0Assets.filter((asset) => asset.status === "REJECTED").length, 0);
exact("V3 reuse count", bloomfallAdaptiveP0ReusedAssets.length, 4);
exact("Hart selected count", bloomfallAdaptiveP0SelectedAssets.filter((asset) => asset.entitySlug === "blackbloom-hart").length, 5);
exact("Latchhound selected count", bloomfallAdaptiveP0SelectedAssets.filter((asset) => asset.entitySlug === "latchhound").length, 5);
exact("Last Shift selected count", bloomfallAdaptiveP0SelectedAssets.filter((asset) => asset.entitySlug === "the-last-shift").length, 2);

for (const asset of bloomfallAdaptiveP0SelectedAssets) {
  for (const [category, value] of Object.entries(asset.scores)) {
    if (value < 9) failures.push({ asset: asset.id, check: `${category} score >= 9`, expected: ">= 9", actual: value });
  }
  if (!asset.codexDevelopmentBinding) failures.push({ asset: asset.id, check: "development binding", expected: "non-null", actual: null });
  if (!asset.alt || asset.alt.length > 180) failures.push({ asset: asset.id, check: "concise alt text", expected: "1-180 chars", actual: asset.alt.length });
}

const expectedP0 = bloomfallCreatureEnhancements.filter((entry) => entry.image.priority === "P0").reduce((sum, entry) => sum + entry.image.newStateReferences + entry.image.newHeroImages, 0);
exact("Prompt B P0 matrix", expectedP0, 12);
exact("P1/P2 generated", bloomfallAdaptiveP0SelectedAssets.filter((asset) => !["blackbloom-hart", "latchhound", "the-last-shift"].includes(asset.entitySlug)).length, 0);

const quality = Object.fromEntries(Object.keys(bloomfallAdaptiveP0SelectedAssets[0]!.scores).map((category) => {
  const values = bloomfallAdaptiveP0SelectedAssets.map((asset) => asset.scores[category as keyof typeof asset.scores]);
  return [category, { minimum: Math.min(...values), average: Number((values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(2)) }];
}));

const report = {
  contract: "martino-bloomfall-adaptive-p0-audit",
  contractVersion: 1,
  package: "Bloomfall Adaptive Mutation P0",
  expectedFromPromptB: expectedP0,
  manifestRecords: bloomfallAdaptiveP0Assets.length,
  selected: bloomfallAdaptiveP0SelectedAssets.length,
  revised: bloomfallAdaptiveP0RevisionAssets.length,
  rejected: 0,
  reusedV3: bloomfallAdaptiveP0ReusedAssets.length,
  generatedP1P2: 0,
  filesChecked: bloomfallAdaptiveP0Assets.length,
  quality,
  productionWrites: 0,
  productionMigrations: 0,
  failures,
  status: failures.length ? "FAIL" : "PASS",
};

console.log(JSON.stringify(report, null, 2));
if (failures.length) process.exitCode = 1;
