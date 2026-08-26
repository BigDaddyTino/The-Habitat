import { fileURLToPath } from "node:url";
import path from "node:path";
import dotenv from "dotenv";
import { createPrismaClient } from "@habitat/db/client";
import { assertAtlasAuthoringEnvironment } from "../lib/atlas-authoring-environment";
import { resolveAtlasDevelopmentDatabaseUrl } from "../lib/atlas-development-database";
import {
  bloomfallCodexIntegrationContract,
  bloomfallCodexIntegrationVersion,
} from "../lib/bloomfall-codex-integration";
import {
  applyBloomfallCodexIntegration,
  bloomfallCodexIntegrationBlockCount,
  bloomfallCodexIntegrationRecordCount,
  bloomfallCodexPlanEquals,
  bloomfallCodexPlanMutations,
  planBloomfallCodexIntegration,
  validateBloomfallCodexManifest,
} from "./lib/bloomfall-codex-promotion";
import { assertAtlasPersistentDevelopmentTarget, assertAtlasV2SchemaPresent } from "./lib/atlas-v2-activation";
import { stableAtlasJson } from "./lib/atlas-integrity";

/**
 * Writes the Bloomfall Codex integration into the guarded development Codex.
 *
 * The write itself lives in scripts/lib/bloomfall-codex-promotion so that this
 * tool and the production promotion apply the same reviewed content; only the
 * target guards differ.
 */

const confirmation = "--confirm=BLOOMFALL_CODEX_INTEGRATION_DEVELOPMENT_ONLY";

async function main() {
  const root = path.resolve(process.cwd(), "..", "..");
  dotenv.config({ path: path.join(root, ".env"), quiet: true });
  dotenv.config({ path: path.join(root, ".env.local"), override: true, quiet: true });
  const developmentUrl = resolveAtlasDevelopmentDatabaseUrl(process.env);
  if (!developmentUrl) throw new Error("Bloomfall Codex integration requires HABITAT_ENVIRONMENT=development.");
  process.env.DATABASE_URL = developmentUrl;
  const target = assertAtlasPersistentDevelopmentTarget(developmentUrl);
  assertAtlasAuthoringEnvironment(process.env);
  const db = createPrismaClient(developmentUrl);

  try {
    await assertAtlasV2SchemaPresent(db);
    const identity = await db.$queryRaw<Array<{ database: string; schema: string }>>`SELECT current_database() AS database, current_schema() AS schema`;
    if (identity[0]?.database !== "habitat_atlas_dev") throw new Error("Bloomfall Codex integration independently verified the wrong database.");
    validateBloomfallCodexManifest();

    const apply = process.argv.includes("--apply");
    if (apply && !process.argv.includes(confirmation)) throw new Error(`Development authoring requires ${confirmation}.`);

    const plan = await planBloomfallCodexIntegration(db);

    if (!apply) {
      process.stdout.write(stableAtlasJson({
        contract: `${bloomfallCodexIntegrationContract}-preview`,
        contractVersion: bloomfallCodexIntegrationVersion,
        status: "PREVIEW",
        database: { ...target, schema: identity[0]?.schema },
        create: plan.create,
        upgrade: plan.upgrade,
        appendCrossLinks: plan.link,
        unchanged: [...plan.unchanged].sort(),
        fieldsChanged: ["StoryEntry.title", "StoryEntry.summary", "StoryEntry.body", "StoryEntry.meta", "StoryEntry.version"],
        schemaChanges: 0,
        imageGeneration: 0,
        productionWrites: 0,
        apply: `pnpm --filter @habitat/web bloomfall:integration:apply --apply ${confirmation}`,
      }));
      return;
    }

    let mutations = 0;
    const actorUserId = await db.$transaction(async (tx) => {
      const actor = await tx.user.findFirst({ where: { role: "ADMIN", isActive: true }, orderBy: { id: "asc" }, select: { id: true } });
      if (!actor) throw new Error("Bloomfall Codex integration requires an active administrator for audit authorship.");
      const confirmed = await planBloomfallCodexIntegration(tx);
      if (!bloomfallCodexPlanEquals(confirmed, plan)) throw new Error("The development Codex changed after preview; transaction stopped.");
      mutations = await applyBloomfallCodexIntegration(tx, actor.id, "Prompt E");
      return actor.id;
    }, { isolationLevel: "Serializable", timeout: 180_000 });

    process.stdout.write(stableAtlasJson({
      contract: `${bloomfallCodexIntegrationContract}-apply`,
      contractVersion: bloomfallCodexIntegrationVersion,
      status: mutations ? "APPLIED" : "ALREADY_APPLIED",
      database: { ...target, schema: identity[0]?.schema },
      actorUserId,
      systemRecords: bloomfallCodexIntegrationRecordCount,
      crossLinkBlocks: bloomfallCodexIntegrationBlockCount,
      planned: bloomfallCodexPlanMutations(plan),
      mutations,
      schemaChanges: 0,
      imageGeneration: 0,
      productionWrites: 0,
    }));
  } finally {
    await db.$disconnect();
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) void main();
