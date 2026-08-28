import "../lib/environment";
import { randomUUID } from "node:crypto";
import { getPrismaClient, type Prisma } from "@habitat/db/client";
import { storyInvolvementKinds } from "@habitat/shared";

/**
 * Retypes every character's `involvement` rows from a bare `arc` slug to an
 * explicit `{ ref, kind }` reference.
 *
 *   pnpm --filter @habitat/web exec tsx scripts/migrate-typed-involvement.ts [--apply]
 *
 * Six production rows pointed at canon EVENT entries through a field named
 * `arc`, and nothing reported them: the Needs Work scanner validated the slug
 * against entries and arcs merged into a single pool, so an event slug looked
 * like a resolved arc. Two more named an arc that exists under a different
 * slug than the concept entry it shares a title with.
 *
 * Reads as a dry run by default and prints exactly what it would write. Every
 * change is one transaction, each entry carries a revision, and running it a
 * second time is a no-op — a row that already has a `kind` is left alone.
 */
const db = getPrismaClient();

/**
 * The three slugs that were never arcs. Everything else was already pointing
 * at a real arc and only needs its namespace stated.
 *
 * `reserve-twelve` and `the-bellwether` are concept entries whose quest boards
 * live under different slugs; `black-tide-at-blackweir` is a canon world event
 * with no board at all, which is exactly what the EVENT kind is for.
 */
const repoint: Record<string, { ref: string; kind: (typeof storyInvolvementKinds)[number] }> = {
  "reserve-twelve": { ref: "reserve-twelve-contract", kind: "ARC" },
  "the-bellwether": { ref: "the-bellwether-hunt", kind: "ARC" },
  "black-tide-at-blackweir": { ref: "black-tide-at-blackweir", kind: "EVENT" },
};

const asRecord = (value: unknown): Record<string, unknown> | null =>
  typeof value === "object" && value !== null && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
const slug = (value: unknown): string | null => (typeof value === "string" && value.trim() ? value.trim() : null);

async function main() {
  const apply = process.argv.includes("--apply");

  const [characters, arcs, entries] = await Promise.all([
    db.storyEntry.findMany({ where: { kind: "CHARACTER" }, select: { id: true, slug: true, title: true, meta: true, version: true }, orderBy: { slug: "asc" } }),
    db.storyArc.findMany({ select: { slug: true } }),
    db.storyEntry.findMany({ select: { slug: true, kind: true } }),
  ]);
  const knownArcs = new Set(arcs.map((arc) => arc.slug));
  const knownEvents = new Set(entries.filter((entry) => entry.kind === "EVENT").map((entry) => entry.slug));

  const plan: Array<{ id: string; slug: string; title: string; meta: Record<string, unknown>; before: unknown; after: unknown; notes: string[] }> = [];
  const unresolved: string[] = [];

  for (const character of characters) {
    const meta = asRecord(character.meta);
    if (!meta) continue;
    const rows = Array.isArray(meta.involvement) ? meta.involvement : [];
    if (rows.length === 0) continue;

    const notes: string[] = [];
    let changed = false;
    const next = rows.map((row) => {
      const source = asRecord(row) ?? {};
      // Already typed by a save through the new sheet — leave it exactly as is.
      if (typeof source.kind === "string" && (storyInvolvementKinds as readonly string[]).includes(source.kind) && slug(source.ref)) return source;

      const original = slug(source.ref) ?? slug(source.arc);
      if (!original) { notes.push("dropped a row with no reference at all"); changed = true; return null; }

      const mapped = repoint[original] ?? { ref: original, kind: "ARC" as const };
      const pool = mapped.kind === "EVENT" ? knownEvents : knownArcs;
      if (!pool.has(mapped.ref)) unresolved.push(`${character.slug} .involvement -> ${mapped.ref} (no such ${mapped.kind.toLowerCase()})`);
      if (mapped.ref !== original) notes.push(`${original} -> ${mapped.ref} (${mapped.kind})`);
      else notes.push(`${original} typed as ${mapped.kind}`);
      changed = true;
      return { ref: mapped.ref, kind: mapped.kind, how: source.how ?? null };
    }).filter((row) => row !== null);

    if (!changed) continue;
    plan.push({ id: character.id, slug: character.slug, title: character.title, meta, before: rows, after: next, notes });
  }

  for (const item of plan) {
    console.log(`${item.slug}`);
    for (const note of item.notes) console.log(`   ${note}`);
  }
  console.log(`\ncharacters to migrate: ${plan.length}, rows: ${plan.reduce((total, item) => total + item.notes.length, 0)}`);
  if (unresolved.length) {
    console.log(`\nUNRESOLVED — these would still point at nothing:`);
    for (const row of unresolved) console.log(`  ${row}`);
  }

  if (plan.length === 0) {
    console.log("\nNothing to do — every involvement row is already typed.");
    return;
  }
  if (!apply) {
    console.log("\nDry run. Re-run with --apply to write it.");
    return;
  }
  // A reference that resolves to nothing is the bug this migration exists to
  // remove, so it refuses to write one rather than trading six silent dangling
  // rows for six loud ones.
  if (unresolved.length) throw new Error("Refusing to apply: the plan still contains references with no target.");

  const actor = await db.user.findFirst({ where: { role: "ADMIN", isActive: true }, orderBy: { id: "asc" }, select: { id: true } });
  if (!actor) throw new Error("This migration requires an active administrator for revision authorship.");

  await db.$transaction(async (tx) => {
    for (const item of plan) {
      // Version-guarded like every other write: if somebody saved one of these
      // sheets between the plan and the transaction, the whole thing rolls back.
      const updated = await tx.storyEntry.updateMany({
        where: { id: item.id, meta: { equals: item.meta as Prisma.InputJsonValue } },
        data: { meta: { ...item.meta, involvement: item.after } as Prisma.InputJsonValue, version: { increment: 1 }, updatedByUserId: actor.id },
      });
      if (updated.count !== 1) throw new Error(`${item.slug} changed while the migration was planning; nothing was written.`);
      await tx.storyRevision.create({
        data: {
          id: randomUUID(),
          entityType: "ENTRY",
          entityId: item.id,
          action: "UPDATED",
          actorUserId: actor.id,
          summary: `Retyped involvement references on "${item.title}" — ${item.notes.join("; ")}`,
          before: { involvement: item.before } as Prisma.InputJsonValue,
          after: { involvement: item.after } as Prisma.InputJsonValue,
        },
      });
    }
  }, { isolationLevel: "Serializable", timeout: 30_000 });

  console.log(`\nApplied. ${plan.length} character sheets retyped.`);
}

main().then(() => db.$disconnect(), (error) => { console.error(error); return db.$disconnect().then(() => process.exit(1)); });
