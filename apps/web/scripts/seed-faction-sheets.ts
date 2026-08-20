import "../lib/environment";
import { getPrismaClient, type Prisma } from "@habitat/db/client";
import { factionSheetSeeds } from "../lib/story-faction-sheets-seed";
import { factionMetaSchema } from "../lib/story-meta-schemas";

/**
 * Gives the thirteen prose-only factions a structured starting sheet.
 * Dry-run by default; --apply fills null meta only and never overwrites a
 * writer-authored sheet.
 */
const db = getPrismaClient();

async function main() {
  const apply = process.argv.includes("--apply");
  const author =
    (await db.user.findFirst({ where: { OR: [{ displayName: "Tino" }, { name: "Tino" }], isActive: true }, select: { id: true } })) ??
    (await db.user.findFirstOrThrow({ where: { role: "ADMIN", isActive: true }, select: { id: true } }));

  let written = 0;
  let already = 0;
  for (const seed of factionSheetSeeds) {
    const parsed = factionMetaSchema.safeParse(seed.meta);
    if (!parsed.success) throw new Error(`${seed.slug}: faction sheet seed does not validate: ${parsed.error.message}`);
    const entry = await db.storyEntry.findUnique({ where: { slug: seed.slug }, select: { id: true, kind: true, title: true, meta: true } });
    if (!entry || entry.kind !== "FACTION") throw new Error(`${seed.slug}: expected a faction dossier`);
    if (entry.meta !== null) {
      already += 1;
      console.log(`ok          ${entry.title} — a sheet already exists`);
      continue;
    }

    console.log(`${apply ? "writing" : "would write"} ${entry.title}`);
    if (apply) {
      await db.$transaction(async (tx) => {
        await tx.storyEntry.update({
          where: { id: entry.id },
          data: { meta: parsed.data as unknown as Prisma.InputJsonValue, version: { increment: 1 }, updatedByUserId: author.id },
        });
        await tx.storyRevision.create({
          data: {
            entityType: "ENTRY", entityId: entry.id, action: "UPDATED", actorUserId: author.id,
            summary: `Composed the structured faction sheet for "${entry.title}" from its existing prose`.slice(0, 300),
            before: { meta: null }, after: { meta: parsed.data as unknown as Prisma.InputJsonValue },
          },
        });
      });
    }
    written += 1;
  }

  console.log(`\n${apply ? "wrote" : "would write"} ${written}; left ${already} existing sheets untouched`);
}

main().catch((error) => { console.error(error); process.exitCode = 1; }).finally(async () => db.$disconnect());
