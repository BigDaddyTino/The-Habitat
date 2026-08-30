import "../lib/environment";
import { randomUUID } from "node:crypto";
import { getPrismaClient, type Prisma } from "@habitat/db/client";

/**
 * The backfill that has to ship with the character-sheet schema change.
 *
 * `characterMetaSchema` gained four keys — background, professions, skills,
 * cybernetics — and every field on a sheet is required-but-nullable, which
 * means a sheet that OMITS a key is rejected whole. Without this, every
 * character written before the change would refuse to save the next time
 * somebody opened it, and the failure would look like a form bug rather than
 * a migration that was never run.
 *
 * It writes empty values only. An empty ledger says "not yet decided", which
 * is exactly what is true of a dossier written before the ledger existed —
 * inventing a trade for a canon character would be a claim nobody made.
 *
 *   pnpm --filter @habitat/web exec tsx scripts/backfill-character-bible-ledgers.ts
 *   pnpm --filter @habitat/web exec tsx scripts/backfill-character-bible-ledgers.ts --apply
 */
const db = getPrismaClient();
const apply = process.argv.includes("--apply");

async function main() {
  const actor = await db.user.findFirstOrThrow({ where: { role: "ADMIN", isActive: true }, select: { id: true } });
  const rows = await db.storyEntry.findMany({ where: { kind: "CHARACTER" }, select: { id: true, slug: true, meta: true }, orderBy: { slug: "asc" } });
  let patched = 0;
  for (const row of rows) {
    const meta = (row.meta as Record<string, unknown>) ?? null;
    if (!meta) { console.log(`  skip      ${row.slug} — no sheet at all; run backfill-entry-sheets.ts first`); continue; }
    const missing = (["background", "professions", "skills", "cybernetics"] as const).filter((key) => !(key in meta));
    if (missing.length === 0) { console.log(`  ok        ${row.slug}`); continue; }
    const next = { ...meta, background: meta.background ?? null, professions: meta.professions ?? [], skills: meta.skills ?? [], cybernetics: meta.cybernetics ?? [] };
    console.log(`  backfill  ${row.slug} — ${missing.join(", ")}`);
    patched += 1;
    if (!apply) continue;
    await db.storyEntry.update({ where: { id: row.id }, data: { meta: next as Prisma.InputJsonValue, updatedByUserId: actor.id, version: { increment: 1 } } });
    await db.storyRevision.create({ data: { id: randomUUID(), entityType: "ENTRY", entityId: row.id, action: "UPDATED", actorUserId: actor.id, summary: "Backfilled the four character-bible ledgers as empty" } });
  }
  console.log(`\n${patched} of ${rows.length} character sheets need the new keys.`);
  if (!apply) console.log("Dry run. Re-run with --apply to write it.");
}

main().then(() => db.$disconnect(), (error) => { console.error(error); return db.$disconnect().then(() => process.exit(1)); });
