import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import path from "node:path";
import dotenv from "dotenv";
import { createPrismaClient, type Prisma } from "@habitat/db/client";
import { assertAtlasAuthoringEnvironment } from "../lib/atlas-authoring-environment";
import { resolveAtlasDevelopmentDatabaseUrl } from "../lib/atlas-development-database";
import { metaSchemasByKind } from "../lib/story-meta-schemas";
import {
  bloomfallAllCrossLinkBlocks,
  bloomfallCodexIntegrationContract,
  bloomfallCodexIntegrationVersion,
  bloomfallIntegrationBaselineBody,
  bloomfallIntegrationExpectedBody,
  bloomfallIntegrationRecords,
} from "../lib/bloomfall-codex-integration";
import { bloomfallNewEntries } from "../lib/bloomfall-reach-content";
import { assertAtlasPersistentDevelopmentTarget, assertAtlasV2SchemaPresent } from "./lib/atlas-v2-activation";
import { stableAtlasJson } from "./lib/atlas-integrity";

/**
 * Writes the Prompt E Bloomfall Codex integration into the guarded development
 * Codex, and nowhere else.
 *
 * Two kinds of change, both reversible by inspection:
 *   - seven system dossiers, five upgraded in place and two created;
 *   - thirty-five short cross-link blocks appended to records the earlier
 *     phases left without outbound links.
 *
 * Every write is checked against the exact approved prior state first. A record
 * that somebody else has edited stops the transaction rather than being
 * silently overwritten, and a record already carrying the target content is
 * skipped, so the tool is safe to run twice.
 */

const confirmation = "--confirm=BLOOMFALL_CODEX_INTEGRATION_DEVELOPMENT_ONLY";

type Transaction = Prisma.TransactionClient;

const packageBySlug = new Map(bloomfallNewEntries.map((entry) => [entry.slug, entry] as const));

function inputJson(value: unknown) {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

function jsonEqual(left: unknown, right: unknown) {
  return stableAtlasJson(left, false) === stableAtlasJson(right, false);
}

/** Metadata carries an art marker the content manifest never described; the
 *  comparison ignores it so a published V3 binding is not treated as drift. */
function withoutVisualArt(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return value;
  const rest = { ...(value as Record<string, unknown>) };
  delete rest.visualArt;
  return rest;
}

function preserveVisualArt(current: unknown, next: Record<string, unknown>) {
  const marker = current && typeof current === "object" && !Array.isArray(current) ? (current as Record<string, unknown>).visualArt : undefined;
  return marker === undefined ? next : { ...next, visualArt: marker };
}

function stableUuid(key: string) {
  const source = createHash("sha256").update(`martino:bloomfall-reach:prompt-e:${key}`).digest("hex").slice(0, 32).split("");
  source[12] = "5";
  source[16] = ((Number.parseInt(source[16]!, 16) & 0x3) | 0x8).toString(16);
  const hex = source.join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function validateManifest() {
  for (const record of bloomfallIntegrationRecords) {
    const schema = metaSchemasByKind[record.kind];
    if (!schema) throw new Error(`${record.slug} has no typed metadata sheet.`);
    const parsed = schema.safeParse(record.meta);
    if (!parsed.success) throw new Error(`${record.slug} metadata fails its typed sheet: ${parsed.error.message}`);
  }
  const seen = new Set<string>();
  for (const block of bloomfallAllCrossLinkBlocks) {
    if (seen.has(block.slug)) throw new Error(`Duplicate cross-link block for ${block.slug}.`);
    seen.add(block.slug);
    if (bloomfallIntegrationBaselineBody(block.slug) === null) throw new Error(`No approved baseline body is known for ${block.slug}.`);
  }
}

type Plan = {
  create: Array<{ slug: string }>;
  upgrade: Array<{ slug: string }>;
  link: Array<{ slug: string }>;
  unchanged: string[];
};

async function planFor(db: ReturnType<typeof createPrismaClient> | Transaction): Promise<Plan> {
  const plan: Plan = { create: [], upgrade: [], link: [], unchanged: [] };

  for (const record of bloomfallIntegrationRecords) {
    const current = await db.storyEntry.findUnique({ where: { slug: record.slug } });
    if (!current) {
      if (record.authoring !== "NEW") throw new Error(`${record.slug} is missing from the development Codex.`);
      plan.create.push({ slug: record.slug });
      continue;
    }
    if (current.kind !== record.kind) throw new Error(`${record.slug} is stored as ${current.kind}, not ${record.kind}.`);
    if (current.status !== "CANON") throw new Error(`${record.slug} is not canon.`);
    const alreadyIntegrated = current.title === record.title && current.summary === record.summary && current.body === record.body && jsonEqual(withoutVisualArt(current.meta), record.meta);
    if (alreadyIntegrated) { plan.unchanged.push(record.slug); continue; }
    if (record.authoring === "NEW") throw new Error(`${record.slug} already exists with content this phase did not author.`);
    const seed = packageBySlug.get(record.slug);
    if (!seed) throw new Error(`${record.slug} has no approved Prompt 3 baseline.`);
    const baseline = current.title === seed.title && current.summary === seed.summary && current.body === seed.body && jsonEqual(withoutVisualArt(current.meta), seed.meta);
    if (!baseline) throw new Error(`${record.slug} has drifted from its approved baseline; refusing to overwrite it.`);
    plan.upgrade.push({ slug: record.slug });
  }

  for (const block of bloomfallAllCrossLinkBlocks) {
    const current = await db.storyEntry.findUnique({ where: { slug: block.slug } });
    if (!current) throw new Error(`Cross-link target ${block.slug} is missing.`);
    if (current.kind !== block.kind) throw new Error(`${block.slug} is stored as ${current.kind}, not ${block.kind}.`);
    const expected = bloomfallIntegrationExpectedBody(block.slug);
    if (current.body === expected) { plan.unchanged.push(block.slug); continue; }
    if (current.body !== bloomfallIntegrationBaselineBody(block.slug)) throw new Error(`${block.slug} has edits outside its approved baseline; refusing to append.`);
    plan.link.push({ slug: block.slug });
  }

  return plan;
}

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
    validateManifest();

    const apply = process.argv.includes("--apply");
    if (apply && !process.argv.includes(confirmation)) throw new Error(`Development authoring requires ${confirmation}.`);

    const plan = await planFor(db);

    if (!apply) {
      process.stdout.write(stableAtlasJson({
        contract: `${bloomfallCodexIntegrationContract}-preview`,
        contractVersion: bloomfallCodexIntegrationVersion,
        status: "PREVIEW",
        database: { ...target, schema: identity[0]?.schema },
        create: plan.create.map((row) => row.slug),
        upgrade: plan.upgrade.map((row) => row.slug),
        appendCrossLinks: plan.link.map((row) => row.slug),
        unchanged: plan.unchanged.sort(),
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
      const confirmed = await planFor(tx);
      if (!jsonEqual(confirmed, plan)) throw new Error("The development Codex changed after preview; transaction stopped.");

      for (const record of bloomfallIntegrationRecords) {
        const current = await tx.storyEntry.findUnique({ where: { slug: record.slug } });
        if (!current) {
          const id = stableUuid(`entry:${record.slug}`);
          await tx.storyEntry.create({ data: {
            id, kind: record.kind, slug: record.slug, title: record.title, summary: record.summary,
            body: record.body, meta: inputJson(record.meta), status: "CANON", createdByUserId: actor.id,
          } });
          await tx.storyRevision.create({ data: {
            entityType: "ENTRY", entityId: id, action: "CREATED", actorUserId: actor.id,
            summary: record.revisionSummary.slice(0, 300),
            after: inputJson({ title: record.title, summary: record.summary, body: record.body, meta: record.meta }),
          } });
          mutations += 1;
          continue;
        }
        if (current.title === record.title && current.summary === record.summary && current.body === record.body && jsonEqual(withoutVisualArt(current.meta), record.meta)) continue;
        const before = { title: current.title, summary: current.summary, body: current.body, meta: current.meta, version: current.version };
        const updated = await tx.storyEntry.update({ where: { id: current.id }, data: {
          title: record.title, summary: record.summary, body: record.body,
          meta: inputJson(preserveVisualArt(current.meta, record.meta)),
          version: { increment: 1 }, updatedByUserId: actor.id,
        } });
        await tx.storyRevision.create({ data: {
          entityType: "ENTRY", entityId: current.id, action: "UPDATED", actorUserId: actor.id,
          summary: record.revisionSummary.slice(0, 300),
          before: inputJson(before),
          after: inputJson({ title: updated.title, summary: updated.summary, body: updated.body, meta: updated.meta, version: updated.version }),
        } });
        mutations += 1;
      }

      for (const block of bloomfallAllCrossLinkBlocks) {
        const current = await tx.storyEntry.findUniqueOrThrow({ where: { slug: block.slug } });
        const expected = bloomfallIntegrationExpectedBody(block.slug);
        if (current.body === expected) continue;
        if (current.body !== bloomfallIntegrationBaselineBody(block.slug)) throw new Error(`${block.slug} changed after preview; transaction stopped.`);
        const before = { body: current.body, version: current.version };
        const updated = await tx.storyEntry.update({ where: { id: current.id }, data: { body: expected, version: { increment: 1 }, updatedByUserId: actor.id } });
        await tx.storyRevision.create({ data: {
          entityType: "ENTRY", entityId: current.id, action: "UPDATED", actorUserId: actor.id,
          summary: block.revisionSummary.slice(0, 300),
          before: inputJson(before),
          after: inputJson({ body: updated.body, version: updated.version }),
        } });
        mutations += 1;
      }

      return actor.id;
    }, { isolationLevel: "Serializable", timeout: 180_000 });

    process.stdout.write(stableAtlasJson({
      contract: `${bloomfallCodexIntegrationContract}-apply`,
      contractVersion: bloomfallCodexIntegrationVersion,
      status: mutations ? "APPLIED" : "ALREADY_APPLIED",
      database: { ...target, schema: identity[0]?.schema },
      actorUserId,
      systemRecords: bloomfallIntegrationRecords.length,
      crossLinkBlocks: bloomfallAllCrossLinkBlocks.length,
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
