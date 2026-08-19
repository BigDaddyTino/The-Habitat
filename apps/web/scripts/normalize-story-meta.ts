import "../lib/environment";
import { getPrismaClient, type Prisma } from "@habitat/db/client";
import { metaSchemasByKind } from "../lib/story-meta-schemas";

/**
 * Fills keys that stored `meta` rows are missing, so every row matches the
 * schema its sheet declares.
 *
 *   pnpm --filter @habitat/web exec tsx scripts/normalize-story-meta.ts [--apply]
 *
 * Rows written before a field existed simply lack it — SYSTEM entries seeded
 * before `parent` and `regionNotes`, characters seeded before `model`. The
 * sheets still save (they compose a whole object from form state), but the
 * database disagreeing with its own contract is how a later reader, importer,
 * or migration breaks. Defaults come from the schema itself — nullable becomes
 * null, array becomes empty, nested objects recurse — so this stays correct as
 * the schemas grow. Never overwrites a value that is already present.
 *
 * Dry-run by default; pass --apply to write.
 */
const db = getPrismaClient();
const apply = process.argv.includes("--apply");

type ZodLike = { _def?: { typeName?: string; innerType?: ZodLike; type?: ZodLike }; shape?: Record<string, ZodLike> };

/** The empty value a schema field accepts, read off the schema. */
function defaultFor(field: ZodLike): { ok: true; value: unknown } | { ok: false } {
  const def = field?._def;
  const name = def?.typeName;
  // zod v4 keeps the discriminator on _def.type for some nodes; check both.
  const kind = name ?? (typeof (def as { type?: unknown })?.type === "string" ? String((def as { type?: unknown }).type) : undefined);
  if (kind === "ZodNullable" || kind === "nullable") return { ok: true, value: null };
  if (kind === "ZodArray" || kind === "array") return { ok: true, value: [] };
  if (kind === "ZodObject" || kind === "object") {
    const shape = (field as { shape?: Record<string, ZodLike> }).shape;
    if (!shape) return { ok: false };
    const value: Record<string, unknown> = {};
    for (const [key, child] of Object.entries(shape)) {
      const nested = defaultFor(child);
      if (!nested.ok) return { ok: false };
      value[key] = nested.value;
    }
    return { ok: true, value };
  }
  return { ok: false };
}

/** Adds only what is missing; present values are never touched. */
function fill(stored: Record<string, unknown>, shape: Record<string, ZodLike>): { filled: Record<string, unknown>; added: string[] } {
  const filled: Record<string, unknown> = { ...stored };
  const added: string[] = [];
  for (const [key, field] of Object.entries(shape)) {
    if (key in filled && filled[key] !== undefined) {
      // Recurse into nested objects that exist but may be short a key.
      const nestedShape = (field as { shape?: Record<string, ZodLike> }).shape
        ?? ((field as ZodLike)._def?.innerType as { shape?: Record<string, ZodLike> } | undefined)?.shape;
      const current = filled[key];
      if (nestedShape && typeof current === "object" && current !== null && !Array.isArray(current)) {
        const inner = fill(current as Record<string, unknown>, nestedShape);
        filled[key] = inner.filled;
        added.push(...inner.added.map((child) => `${key}.${child}`));
      }
      continue;
    }
    const value = defaultFor(field);
    if (!value.ok) continue;
    filled[key] = value.value;
    added.push(key);
  }
  return { filled, added };
}

async function main() {
  const author = await db.user.findFirstOrThrow({ where: { OR: [{ displayName: "Tino" }, { name: "Tino" }], isActive: true }, select: { id: true } });
  const entries = await db.storyEntry.findMany({
    where: { status: { in: ["DRAFT", "PROPOSED", "CANON"] } },
    select: { id: true, slug: true, kind: true, title: true, meta: true },
    orderBy: [{ kind: "asc" }, { slug: "asc" }],
  });

  let changed = 0;
  let stillBroken = 0;
  for (const entry of entries) {
    const stored = typeof entry.meta === "object" && entry.meta !== null && !Array.isArray(entry.meta) ? (entry.meta as Record<string, unknown>) : null;
    const schema = metaSchemasByKind[entry.kind];
    if (!stored || !schema) continue;
    if (schema.safeParse(stored).success) continue;

    const shape = (schema as unknown as { shape?: Record<string, ZodLike> }).shape;
    if (!shape) continue;
    const { filled, added } = fill(stored, shape);
    const result = schema.safeParse(filled);
    if (!result.success) {
      stillBroken += 1;
      console.log(`  UNFIXED ${entry.kind}:${entry.slug} — ${result.error.issues.slice(0, 2).map((i) => `${i.path.join(".")}: ${i.message}`).join("; ")}`);
      continue;
    }
    console.log(`  ${apply ? "filled " : "would fill "}${entry.kind}:${entry.slug} — ${added.join(", ")}`);
    changed += 1;
    if (!apply) continue;

    await db.$transaction(async (tx) => {
      // Written through the same shape a save produces, so the row is exactly
      // what the sheet would have stored had the field existed at the time.
      await tx.storyEntry.update({ where: { id: entry.id }, data: { meta: result.data as Prisma.InputJsonValue, updatedByUserId: author.id, version: { increment: 1 } } });
      await tx.storyRevision.create({
        data: {
          entityType: "ENTRY",
          entityId: entry.id,
          action: "UPDATED",
          actorUserId: author.id,
          summary: `Filled in sheet fields added after "${entry.title}" was written (${added.join(", ")})`,
          before: { meta: stored } as unknown as Prisma.InputJsonValue,
          after: { meta: result.data } as unknown as Prisma.InputJsonValue,
        },
      });
    });
  }

  console.log(`\n${apply ? "filled" : "would fill"} ${changed} row${changed === 1 ? "" : "s"}${stillBroken ? `, ${stillBroken} need a human` : ""}`);
  if (!apply && changed > 0) console.log("dry run — pass --apply to write");
}

main().then(() => db.$disconnect(), (error) => { console.error(error); return db.$disconnect().then(() => process.exit(1)); });
