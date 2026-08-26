import { createHash } from "node:crypto";
import type { Prisma } from "@habitat/db/client";
import { metaSchemasByKind } from "../../lib/story-meta-schemas";
import {
  bloomfallAllCrossLinkBlocks,
  bloomfallIntegrationExpectedBody,
  bloomfallIntegrationPriorBodies,
  bloomfallIntegrationRecords,
} from "../../lib/bloomfall-codex-integration";
import { bloomfallNewEntries } from "../../lib/bloomfall-reach-content";
import { stableAtlasJson } from "./atlas-integrity";

/**
 * The one implementation of the Bloomfall Codex integration write.
 *
 * Development authoring and production promotion both call this, so the two
 * environments cannot receive different content: whatever the reviewed
 * manifest says is what both databases end up holding. Every write is checked
 * against the exact approved prior state first, and a record already carrying
 * the target content is skipped, which is what makes a second run a no-op.
 */

type Client = { storyEntry: Prisma.StoryEntryDelegate; user?: unknown };

export const bloomfallCodexIntegrationRecordCount = bloomfallIntegrationRecords.length;
export const bloomfallCodexIntegrationBlockCount = bloomfallAllCrossLinkBlocks.length;

export function bloomfallCodexIntegrationUuid(key: string) {
  const source = createHash("sha256").update(`martino:bloomfall-reach:prompt-e:${key}`).digest("hex").slice(0, 32).split("");
  source[12] = "5";
  source[16] = ((Number.parseInt(source[16]!, 16) & 0x3) | 0x8).toString(16);
  const hex = source.join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export function bloomfallCodexInputJson(value: unknown) {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

function jsonEqual(left: unknown, right: unknown) {
  return stableAtlasJson(left, false) === stableAtlasJson(right, false);
}

/** Art publication markers live in the same metadata blob but belong to a
 *  different release, so the content comparison never sees them. */
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

const packageBySlug = new Map(bloomfallNewEntries.map((entry) => [entry.slug, entry] as const));

export function validateBloomfallCodexManifest() {
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
    if (bloomfallIntegrationPriorBodies(block.slug).length === 0) throw new Error(`No approved prior body is known for ${block.slug}.`);
  }
}

export type BloomfallCodexPlan = {
  create: string[];
  upgrade: string[];
  link: string[];
  unchanged: string[];
};

export async function planBloomfallCodexIntegration(db: Client): Promise<BloomfallCodexPlan> {
  const plan: BloomfallCodexPlan = { create: [], upgrade: [], link: [], unchanged: [] };

  for (const record of bloomfallIntegrationRecords) {
    const current = await db.storyEntry.findUnique({ where: { slug: record.slug } });
    if (!current) {
      if (record.authoring !== "NEW") throw new Error(`${record.slug} is missing from the Codex.`);
      plan.create.push(record.slug);
      continue;
    }
    if (current.kind !== record.kind) throw new Error(`${record.slug} is stored as ${current.kind}, not ${record.kind}.`);
    if (current.status !== "CANON") throw new Error(`${record.slug} is not canon.`);
    const integrated = current.title === record.title && current.summary === record.summary && current.body === record.body && jsonEqual(withoutVisualArt(current.meta), record.meta);
    if (integrated) { plan.unchanged.push(record.slug); continue; }
    if (record.authoring === "NEW") throw new Error(`${record.slug} already exists with content this release did not author.`);
    const seed = packageBySlug.get(record.slug);
    if (!seed) throw new Error(`${record.slug} has no approved baseline.`);
    const baseline = current.title === seed.title && current.summary === seed.summary && current.body === seed.body && jsonEqual(withoutVisualArt(current.meta), seed.meta);
    if (!baseline) throw new Error(`${record.slug} has drifted from its approved baseline; refusing to overwrite it.`);
    plan.upgrade.push(record.slug);
  }

  for (const block of bloomfallAllCrossLinkBlocks) {
    const current = await db.storyEntry.findUnique({ where: { slug: block.slug } });
    if (!current) throw new Error(`Cross-link target ${block.slug} is missing.`);
    if (current.kind !== block.kind) throw new Error(`${block.slug} is stored as ${current.kind}, not ${block.kind}.`);
    if (current.body === bloomfallIntegrationExpectedBody(block.slug)) { plan.unchanged.push(block.slug); continue; }
    if (!bloomfallIntegrationPriorBodies(block.slug).includes(current.body ?? "")) throw new Error(`${block.slug} has edits outside its approved prior states; refusing to append.`);
    plan.link.push(block.slug);
  }

  return plan;
}

export function bloomfallCodexPlanEquals(left: BloomfallCodexPlan, right: BloomfallCodexPlan) {
  return jsonEqual(left, right);
}

export function bloomfallCodexPlanMutations(plan: BloomfallCodexPlan) {
  return plan.create.length + plan.upgrade.length + plan.link.length;
}

type Transaction = Prisma.TransactionClient;

/** Writes the reviewed package. Returns the number of records changed. */
export async function applyBloomfallCodexIntegration(tx: Transaction, actorUserId: string, revisionPrefix: string) {
  let mutations = 0;

  for (const record of bloomfallIntegrationRecords) {
    const current = await tx.storyEntry.findUnique({ where: { slug: record.slug } });
    if (!current) {
      const id = bloomfallCodexIntegrationUuid(`entry:${record.slug}`);
      await tx.storyEntry.create({ data: {
        id, kind: record.kind, slug: record.slug, title: record.title, summary: record.summary,
        body: record.body, meta: bloomfallCodexInputJson(record.meta), status: "CANON", createdByUserId: actorUserId,
      } });
      await tx.storyRevision.create({ data: {
        entityType: "ENTRY", entityId: id, action: "CREATED", actorUserId,
        summary: `${revisionPrefix}: ${record.revisionSummary}`.slice(0, 300),
        after: bloomfallCodexInputJson({ title: record.title, summary: record.summary, body: record.body, meta: record.meta }),
      } });
      mutations += 1;
      continue;
    }
    if (current.title === record.title && current.summary === record.summary && current.body === record.body && jsonEqual(withoutVisualArt(current.meta), record.meta)) continue;
    if (!bloomfallIntegrationPriorBodies(record.slug).includes(current.body ?? "")) throw new Error(`${record.slug} changed after the plan was taken; transaction stopped.`);
    const before = { title: current.title, summary: current.summary, body: current.body, meta: current.meta, version: current.version };
    const updated = await tx.storyEntry.update({ where: { id: current.id }, data: {
      title: record.title, summary: record.summary, body: record.body,
      meta: bloomfallCodexInputJson(preserveVisualArt(current.meta, record.meta)),
      version: { increment: 1 }, updatedByUserId: actorUserId,
    } });
    await tx.storyRevision.create({ data: {
      entityType: "ENTRY", entityId: current.id, action: "UPDATED", actorUserId,
      summary: `${revisionPrefix}: ${record.revisionSummary}`.slice(0, 300),
      before: bloomfallCodexInputJson(before),
      after: bloomfallCodexInputJson({ title: updated.title, summary: updated.summary, body: updated.body, meta: updated.meta, version: updated.version }),
    } });
    mutations += 1;
  }

  for (const block of bloomfallAllCrossLinkBlocks) {
    const current = await tx.storyEntry.findUniqueOrThrow({ where: { slug: block.slug } });
    const expected = bloomfallIntegrationExpectedBody(block.slug);
    if (current.body === expected) continue;
    if (!bloomfallIntegrationPriorBodies(block.slug).includes(current.body ?? "")) throw new Error(`${block.slug} changed after the plan was taken; transaction stopped.`);
    const before = { body: current.body, version: current.version };
    const updated = await tx.storyEntry.update({ where: { id: current.id }, data: { body: expected, version: { increment: 1 }, updatedByUserId: actorUserId } });
    await tx.storyRevision.create({ data: {
      entityType: "ENTRY", entityId: current.id, action: "UPDATED", actorUserId,
      summary: `${revisionPrefix}: ${block.revisionSummary}`.slice(0, 300),
      before: bloomfallCodexInputJson(before),
      after: bloomfallCodexInputJson({ body: updated.body, version: updated.version }),
    } });
    mutations += 1;
  }

  return mutations;
}
