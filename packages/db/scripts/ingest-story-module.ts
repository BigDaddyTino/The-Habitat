/**
 * Ingests one module file (Codex_Module_Schema.md §2) into the Story Codex:
 * bible entries only, in the export's own contract-v1 shape, merging on slug.
 * An entry re-shipped on an existing slug SUPERSEDES it — title, summary,
 * body, and meta are replaced, and the identity (slug, kind) never moves.
 *
 * Run from packages/db:
 *   DOTENV_CONFIG_PATH=../../.env npx tsx scripts/ingest-story-module.ts <module.json> "<module label>"
 *
 * Unlike the one-time seed, this is re-runnable by design: modules keep
 * shipping as the world grows. Every create and every supersession lands a
 * revision, so the audit log tells the truth about where canon came from.
 */
import "dotenv/config";
import { readFileSync } from "node:fs";
import { getPrismaClient, type Prisma } from "../src/client";

const entryKinds = ["THEME", "REGION", "CREATURE", "CHARACTER", "FACTION", "ITEM", "EVENT", "RULE", "FLAG"] as const;
type EntryKind = (typeof entryKinds)[number];

type ModuleEntry = { kind: EntryKind; slug: string; title: string; summary: string | null; body: string | null; meta?: Record<string, unknown> | null };
type ModuleFile = { contractVersion: number; arcs: unknown[]; bible: ModuleEntry[] };

const keyShape = /^[a-z0-9]+(-[a-z0-9]+)*$/;

function fail(message: string): never {
  console.error(`ABORT: ${message}`);
  process.exit(1);
}

const [modulePath, moduleLabel] = process.argv.slice(2);
if (!modulePath || !moduleLabel) fail("usage: ingest-story-module.ts <module.json> \"<module label>\"");

const file = JSON.parse(readFileSync(modulePath, "utf8")) as ModuleFile;
if (file.contractVersion !== 1) fail("module files must be contract version 1");
if ((file.arcs ?? []).length > 0) fail("module files carry bible entries only — arcs ship in chapter files");
if (!Array.isArray(file.bible) || file.bible.length === 0) fail("no bible entries in this module");

const slugs = new Set<string>();
for (const entry of file.bible) {
  if (!entryKinds.includes(entry.kind)) fail(`unknown kind ${entry.kind} on ${entry.slug}`);
  if (!keyShape.test(entry.slug)) fail(`slug "${entry.slug}" is not a valid key`);
  if (!entry.title?.trim()) fail(`blank title on ${entry.slug}`);
  if (slugs.has(entry.slug)) fail(`duplicate slug ${entry.slug} inside the module`);
  if (entry.meta !== undefined && entry.meta !== null && (typeof entry.meta !== "object" || Array.isArray(entry.meta))) fail(`meta on ${entry.slug} is not an object`);
  slugs.add(entry.slug);
}

const db = getPrismaClient();

async function main() {
  const actor = await db.user.findFirst({ where: { role: "ADMIN" }, orderBy: { createdAt: "asc" }, select: { id: true } });
  if (!actor) fail("no ADMIN user exists to own the module");

  let created = 0;
  let superseded = 0;

  await db.$transaction(
    async (tx) => {
      for (const entry of file.bible) {
        const existing = await tx.storyEntry.findUnique({ where: { slug: entry.slug }, select: { id: true, kind: true, title: true, summary: true, body: true, meta: true } });

        if (existing) {
          // Supersession replaces content, never identity. A kind change is a
          // different entity wearing the same slug — that is a human decision,
          // not an ingest's.
          if (existing.kind !== entry.kind) fail(`"${entry.slug}" is a ${existing.kind} in the codex but a ${entry.kind} in the module`);
          await tx.storyEntry.update({
            where: { id: existing.id },
            data: {
              title: entry.title,
              summary: entry.summary,
              body: entry.body,
              ...(entry.meta !== undefined && entry.meta !== null ? { meta: entry.meta as Prisma.InputJsonValue } : {}),
              updatedByUserId: actor.id,
              version: { increment: 1 },
            },
          });
          await tx.storyRevision.create({
            data: {
              entityType: "ENTRY", entityId: existing.id, action: "UPDATED", actorUserId: actor.id,
              summary: `Superseded "${entry.title}" from the ${moduleLabel} module`,
              before: { title: existing.title, summary: existing.summary, body: existing.body, meta: existing.meta as Prisma.InputJsonValue },
              after: { title: entry.title, summary: entry.summary, body: entry.body, meta: (entry.meta ?? existing.meta) as Prisma.InputJsonValue },
            },
          });
          superseded += 1;
        } else {
          const row = await tx.storyEntry.create({
            data: {
              kind: entry.kind,
              slug: entry.slug,
              title: entry.title,
              summary: entry.summary,
              body: entry.body,
              ...(entry.meta !== undefined && entry.meta !== null ? { meta: entry.meta as Prisma.InputJsonValue } : {}),
              status: "CANON",
              createdByUserId: actor.id,
            },
            select: { id: true },
          });
          await tx.storyRevision.create({
            data: { entityType: "ENTRY", entityId: row.id, action: "CREATED", actorUserId: actor.id, summary: `Seeded "${entry.title}" from the ${moduleLabel} module` },
          });
          created += 1;
        }
      }
    },
    { timeout: 180_000, maxWait: 15_000 },
  );

  const [entryCount, newest] = await Promise.all([
    db.storyEntry.count({ where: { status: "CANON" } }),
    db.storyRevision.findFirst({ orderBy: [{ createdAt: "desc" }, { id: "desc" }], select: { id: true } }),
  ]);
  console.log(JSON.stringify({ ok: true, module: moduleLabel, created, superseded, canonEntries: entryCount, revisionCursor: newest?.id ?? null }));
}

main()
  .catch((cause) => fail(cause instanceof Error ? cause.message : String(cause)))
  .finally(() => db.$disconnect());
