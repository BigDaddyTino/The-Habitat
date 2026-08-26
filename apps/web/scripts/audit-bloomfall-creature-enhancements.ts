import path from "node:path";
import dotenv from "dotenv";
import { createPrismaClient } from "@habitat/db/client";
import {
  bloomfallCreatureEnhancements,
  bloomfallCreatureNewImageCount,
  renderBloomfallCreatureEnhancement,
} from "../lib/bloomfall-creature-enhancements";
import { resolveAtlasDevelopmentDatabaseUrl } from "../lib/atlas-development-database";
import { metaSchemasByKind } from "../lib/story-meta-schemas";
import { storyProseLinks } from "../lib/story-prose";
import { assertAtlasPersistentDevelopmentTarget, assertAtlasV2SchemaPresent } from "./lib/atlas-v2-activation";
import { stableAtlasJson } from "./lib/atlas-integrity";

const root = path.resolve(process.cwd(), "..", "..");
dotenv.config({ path: path.join(root, ".env"), quiet: true });
dotenv.config({ path: path.join(root, ".env.local"), override: true, quiet: true });
const developmentUrl = resolveAtlasDevelopmentDatabaseUrl(process.env);
if (!developmentUrl) throw new Error("Creature enhancement audit requires the guarded development database.");
const target = assertAtlasPersistentDevelopmentTarget(developmentUrl);
const db = createPrismaClient(developmentUrl);

async function main() {
  await assertAtlasV2SchemaPresent(db);
  const identity = await db.$queryRaw<Array<{ database: string; schema: string }>>`SELECT current_database() AS database, current_schema() AS schema`;
  if (identity[0]?.database !== "habitat_atlas_dev") throw new Error("Creature enhancement audit independently verified the wrong database.");
  const failures: string[] = [];
  const check = (condition: unknown, message: string) => { if (!condition) failures.push(message); };
  const [stored, allSlugs] = await Promise.all([
    db.storyEntry.findMany({ where: { slug: { in: bloomfallCreatureEnhancements.map((entry) => entry.slug) } }, orderBy: { slug: "asc" } }),
    db.storyEntry.findMany({ select: { slug: true } }),
  ]);
  const storedBySlug = new Map(stored.map((entry) => [entry.slug, entry]));
  const slugSet = new Set(allSlugs.map((entry) => entry.slug));
  const brokenReferences = new Set<string>();

  check(stored.length === bloomfallCreatureEnhancements.length, `Expected ${bloomfallCreatureEnhancements.length} records; found ${stored.length}.`);
  for (const enhancement of bloomfallCreatureEnhancements) {
    const current = storedBySlug.get(enhancement.slug);
    check(Boolean(current), `Missing ${enhancement.slug}.`);
    if (!current) continue;
    check(current.kind === enhancement.kind && current.status === "CANON", `${enhancement.slug} kind or canon status drifted.`);
    check(current.body === renderBloomfallCreatureEnhancement(enhancement), `${enhancement.slug} prose differs from the Prompt B source manifest.`);
    if (enhancement.kind === "CREATURE") {
      const meta = current.meta as { parent?: unknown; category?: unknown } | null;
      check(meta?.parent === enhancement.taxonomyParent, `${enhancement.slug} parent taxonomy drifted.`);
      check(meta?.category === enhancement.taxonomyCategory && meta?.category !== "abomination", `${enhancement.slug} category taxonomy drifted or conflates Abomination.`);
      check(metaSchemasByKind.CREATURE!.safeParse(current.meta).success, `${enhancement.slug} no longer satisfies StoryCreatureMeta.`);
    }
    for (const slug of storyProseLinks(current.body ?? "")) if (!slugSet.has(slug)) brokenReferences.add(slug);
  }

  const promotions = bloomfallCreatureEnhancements.filter((entry) => entry.promotedThreat.eligible).map((entry) => entry.slug).sort();
  check(stableAtlasJson(promotions, false) === stableAtlasJson(["blackbloom-hart", "latchhound", "mirejaw"], false), "Persistent promotion eligibility drifted.");
  check(bloomfallCreatureEnhancements.filter((entry) => entry.classification === "EXCEPTIONAL_ABERRANT").length === 4, "Named Aberrant count drifted.");
  check(bloomfallCreatureEnhancements.filter((entry) => entry.mutationEligibility !== "NONE" && entry.classification !== "EXCEPTIONAL_ABERRANT").length === 5, "Ordinary adaptive species count drifted.");
  check(bloomfallCreatureEnhancements.every((entry) => String(entry.taxonomyCategory) !== "abomination"), "Source manifest uses Abomination taxonomy.");
  check(brokenReferences.size === 0, `Broken Codex references: ${[...brokenReferences].sort().join(", ")}`);

  const priorityImageCounts = Object.fromEntries(["P0", "P1", "P2", "P3"].map((priority) => [
    priority,
    bloomfallCreatureEnhancements.filter((entry) => entry.image.priority === priority).reduce((sum, entry) => sum + bloomfallCreatureNewImageCount(entry), 0),
  ]));
  check(stableAtlasJson(priorityImageCounts, false) === stableAtlasJson({ P0: 12, P1: 9, P2: 5, P3: 1 }, false), "Image workload drifted.");

  const report = {
    contract: "martino-bloomfall-creature-enhancement-audit",
    contractVersion: 1,
    status: failures.length ? "FAIL" : "PASS",
    database: { ...target, schema: identity[0]?.schema },
    records: stored.length,
    classification: {
      none: bloomfallCreatureEnhancements.filter((entry) => entry.classification === "NONE").length,
      minor: bloomfallCreatureEnhancements.filter((entry) => entry.classification === "MINOR_ADAPTIVE").length,
      functional: bloomfallCreatureEnhancements.filter((entry) => entry.classification === "FUNCTIONAL_ADAPTIVE").length,
      advanced: bloomfallCreatureEnhancements.filter((entry) => entry.classification === "ADVANCED_ADAPTIVE").length,
      exceptional: bloomfallCreatureEnhancements.filter((entry) => entry.classification === "EXCEPTIONAL_ABERRANT").length,
    },
    promotionEligible: promotions,
    images: { new: Object.values(priorityImageCounts).reduce((sum, count) => sum + count, 0), byPriority: priorityImageCounts, existingV3HeroesReused: ["the-bellwether", "switchmother"] },
    dataArchitecture: { structuredMutationMetadataStored: false, existingStoryCreatureMetaPreserved: true, migrationRequiredBeforeRuntimeState: true },
    brokenReferences: [...brokenReferences].sort(),
    failures,
    schemaChanges: 0,
    imageGeneration: 0,
    productionWrites: 0,
  };
  process.stdout.write(stableAtlasJson(report));
  if (failures.length) process.exitCode = 1;
}

void main().finally(() => db.$disconnect());
