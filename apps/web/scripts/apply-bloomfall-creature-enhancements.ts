import { fileURLToPath } from "node:url";
import path from "node:path";
import dotenv from "dotenv";
import { createPrismaClient, type Prisma } from "@habitat/db/client";
import { assertAtlasAuthoringEnvironment } from "../lib/atlas-authoring-environment";
import { resolveAtlasDevelopmentDatabaseUrl } from "../lib/atlas-development-database";
import {
  bloomfallCreatureEnhancements,
  renderBloomfallCreatureEnhancement,
} from "../lib/bloomfall-creature-enhancements";
import { bloomfallAberrants, bloomfallCharacters, bloomfallCreatures } from "../lib/bloomfall-reach-content";
import { bloomfallIntegrationExpectedBody } from "../lib/bloomfall-codex-integration";
import { assertAtlasPersistentDevelopmentTarget, assertAtlasV2SchemaPresent } from "./lib/atlas-v2-activation";
import { stableAtlasJson } from "./lib/atlas-integrity";

const confirmation = "--confirm=BLOOMFALL_CREATURE_ENHANCEMENTS_DEVELOPMENT_ONLY";
const baselines = new Map(
  [...bloomfallCreatures, ...bloomfallAberrants, ...bloomfallCharacters]
    .map((entry) => [entry.slug, entry] as const),
);

function isApprovedPriorPromptBBody(slug: string, body: string | null, expected: string) {
  return slug === "maintenance-unit-m-17" && body?.replace("Tomas Vey's", "Tomas Venn's") === expected;
}

function inputJson(value: unknown) {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

async function main() {
  const root = path.resolve(process.cwd(), "..", "..");
  dotenv.config({ path: path.join(root, ".env"), quiet: true });
  dotenv.config({ path: path.join(root, ".env.local"), override: true, quiet: true });
  const developmentUrl = resolveAtlasDevelopmentDatabaseUrl(process.env);
  if (!developmentUrl) throw new Error("Creature enhancement authoring requires HABITAT_ENVIRONMENT=development.");
  process.env.DATABASE_URL = developmentUrl;
  const target = assertAtlasPersistentDevelopmentTarget(developmentUrl);
  assertAtlasAuthoringEnvironment(process.env);
  const db = createPrismaClient(developmentUrl);

  try {
    await assertAtlasV2SchemaPresent(db);
    const identity = await db.$queryRaw<Array<{ database: string; schema: string }>>`SELECT current_database() AS database, current_schema() AS schema`;
    if (identity[0]?.database !== "habitat_atlas_dev") throw new Error("Creature enhancement authoring independently verified the wrong database.");
    const apply = process.argv.includes("--apply");
    if (apply && !process.argv.includes(confirmation)) throw new Error(`Development authoring requires ${confirmation}.`);

    const stored = await db.storyEntry.findMany({
      where: { slug: { in: bloomfallCreatureEnhancements.map((entry) => entry.slug) } },
      orderBy: { slug: "asc" },
    });
    if (stored.length !== bloomfallCreatureEnhancements.length) throw new Error(`Expected ${bloomfallCreatureEnhancements.length} target records; found ${stored.length}.`);
    const storedBySlug = new Map(stored.map((entry) => [entry.slug, entry]));
    let pending = 0;

    for (const enhancement of bloomfallCreatureEnhancements) {
      const seed = baselines.get(enhancement.slug);
      const current = storedBySlug.get(enhancement.slug);
      if (!seed || !current) throw new Error(`Missing source or stored record for ${enhancement.slug}.`);
      if (current.kind !== enhancement.kind || current.title !== seed.title || current.summary !== seed.summary || current.status !== "CANON") {
        throw new Error(`${enhancement.slug} identity drifted from its approved canonical baseline.`);
      }
      if (enhancement.kind === "CREATURE") {
        const meta = current.meta as { parent?: unknown; category?: unknown } | null;
        if (meta?.parent !== enhancement.taxonomyParent || meta.category !== enhancement.taxonomyCategory || meta.category === "abomination") {
          throw new Error(`${enhancement.slug} taxonomy drifted or conflates Blackbloom with Abomination.`);
        }
      }
      // Prompt E appended a cross-link block on top of the Prompt B prose, so
      // that composed body is an approved state this tool must leave alone.
      const expected = bloomfallIntegrationExpectedBody(enhancement.slug) ?? renderBloomfallCreatureEnhancement(enhancement);
      if (current.body !== seed.body && current.body !== expected && !isApprovedPriorPromptBBody(enhancement.slug, current.body, renderBloomfallCreatureEnhancement(enhancement))) throw new Error(`${enhancement.slug} body has edits outside the approved Prompt 3, Prompt B, or Prompt E states.`);
      if (current.body !== expected) pending += 1;
    }

    if (!apply) {
      process.stdout.write(stableAtlasJson({
        contract: "martino-bloomfall-creature-enhancement-preview",
        status: "PREVIEW",
        database: { ...target, schema: identity[0]?.schema },
        targets: stored.length,
        pending,
        fieldsChanged: ["StoryEntry.body", "StoryEntry.version", "StoryEntry.updatedByUserId"],
        schemaChanges: 0,
        imageGeneration: 0,
        productionWrites: 0,
        apply: `pnpm --filter @habitat/web bloomfall:creatures:apply --apply ${confirmation}`,
      }));
      return;
    }

    let mutations = 0;
    const actorUserId = await db.$transaction(async (tx) => {
      const actor = await tx.user.findFirst({ where: { role: "ADMIN", isActive: true }, orderBy: { id: "asc" }, select: { id: true } });
      if (!actor) throw new Error("Creature enhancement authoring requires an active administrator for audit authorship.");
      for (const enhancement of bloomfallCreatureEnhancements) {
        const seed = baselines.get(enhancement.slug)!;
        const current = await tx.storyEntry.findUniqueOrThrow({ where: { slug: enhancement.slug } });
        const expected = bloomfallIntegrationExpectedBody(enhancement.slug) ?? renderBloomfallCreatureEnhancement(enhancement);
        if (current.body === expected) continue;
        if (current.body !== seed.body && !isApprovedPriorPromptBBody(enhancement.slug, current.body, renderBloomfallCreatureEnhancement(enhancement))) throw new Error(`${enhancement.slug} changed after preview; transaction stopped.`);
        const before = { body: current.body, version: current.version };
        const updated = await tx.storyEntry.update({
          where: { id: current.id },
          data: { body: expected, version: { increment: 1 }, updatedByUserId: actor.id },
        });
        await tx.storyRevision.create({ data: {
          entityType: "ENTRY",
          entityId: current.id,
          action: "UPDATED",
          actorUserId: actor.id,
          summary: `Prompt B: authored ecology and Adaptive Mutation rules for ${current.title}`,
          before: inputJson(before),
          after: inputJson({ body: updated.body, version: updated.version }),
        } });
        mutations += 1;
      }
      return actor.id;
    }, { isolationLevel: "Serializable", timeout: 120_000 });

    process.stdout.write(stableAtlasJson({
      contract: "martino-bloomfall-creature-enhancement-apply",
      status: mutations ? "APPLIED" : "ALREADY_APPLIED",
      database: { ...target, schema: identity[0]?.schema },
      actorUserId,
      targets: stored.length,
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
