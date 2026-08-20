import "../lib/environment";
import { getPrismaClient, type Prisma } from "@habitat/db/client";
import { habitatAssignments, unplacedCreatures } from "../lib/story-habitats-seed";
import { creatureMetaSchema } from "../lib/story-meta-schemas";

/**
 * Files every creature on the map, using only the ground its own dossier or a
 * region's dossier actually names.
 *
 *   pnpm --filter @habitat/web exec tsx scripts/seed-creature-habitats.ts
 *   pnpm --filter @habitat/web exec tsx scripts/seed-creature-habitats.ts --apply
 *
 * Dry run by default. Idempotent and additive: a habitat already present is
 * left alone, a writer's own prose habitats ("coastal cliffs") are never
 * touched, and the whole sheet is re-validated through the schema that edits
 * it before anything is written — a seed is not a way around the sheet.
 */
const db = getPrismaClient();

async function main() {
  const apply = process.argv.includes("--apply");
  const author =
    (await db.user.findFirst({ where: { OR: [{ displayName: "Tino" }, { name: "Tino" }], isActive: true }, select: { id: true, username: true } })) ??
    (await db.user.findFirstOrThrow({ where: { role: "ADMIN", isActive: true }, select: { id: true, username: true } }));

  const regions = new Set((await db.storyEntry.findMany({ where: { kind: "REGION", status: { in: ["DRAFT", "PROPOSED", "CANON"] } }, select: { slug: true } })).map((row) => row.slug));
  let written = 0;
  let already = 0;

  for (const assignment of habitatAssignments) {
    const entry = await db.storyEntry.findUnique({ where: { slug: assignment.creature }, select: { id: true, kind: true, title: true, meta: true, status: true } });
    if (!entry || entry.kind !== "CREATURE") { console.log(`  skip   ${assignment.creature} — no such creature`); continue; }

    // A placement onto ground nobody has built is the one thing this script
    // must never write: it would read as a link and resolve to nothing.
    const missing = assignment.regions.filter((region) => !regions.has(region));
    if (missing.length > 0) { console.log(`  skip   ${assignment.creature} — ${missing.join(", ")} is not a region in the bible`); continue; }

    const current = creatureMetaSchema.safeParse(entry.meta);
    if (!current.success) { console.log(`  skip   ${entry.title} — its sheet does not validate; fix it by hand first`); continue; }

    const before = current.data.biomes;
    const additions = assignment.regions.filter((region) => !before.includes(region));
    if (additions.length === 0) { already += 1; console.log(`  ok     ${entry.title} — already lives in ${assignment.regions.join(", ")}`); continue; }

    // Regions first, then whatever prose the writer had already put there, so
    // the linked ground reads at the top of the list.
    const next = creatureMetaSchema.safeParse({ ...current.data, biomes: [...assignment.regions, ...before.filter((habitat) => !assignment.regions.includes(habitat))] });
    if (!next.success) { console.log(`  skip   ${entry.title} — the result would not validate`); continue; }

    console.log(`  ${apply ? "filing" : "would file"} ${entry.title} in ${additions.join(", ")}`);
    console.log(`         because ${assignment.because}`);
    if (!apply) { written += 1; continue; }

    await db.$transaction(async (tx) => {
      await tx.storyEntry.update({
        where: { id: entry.id },
        data: { meta: next.data as unknown as Prisma.InputJsonValue, version: { increment: 1 }, updatedByUserId: author.id },
      });
      await tx.storyRevision.create({
        data: {
          entityType: "ENTRY",
          entityId: entry.id,
          action: "UPDATED",
          actorUserId: author.id,
          summary: `Put "${entry.title}" on the map: ${additions.join(", ")}`,
          before: { biomes: before },
          after: { biomes: next.data.biomes },
        },
      });
    });
    written += 1;
  }

  console.log(`\nLeft off the map on purpose:`);
  for (const row of unplacedCreatures) console.log(`  ${row.creature} — ${row.because}`);

  console.log(`\n${apply ? `filed ${written} creature(s)` : `${written} creature(s) would be filed`}; ${already} already placed.`);
  if (!apply && written > 0) console.log("Nothing was written. Re-run with --apply.");
}

main().then(() => db.$disconnect(), (error) => { console.error(error); return db.$disconnect().then(() => process.exit(1)); });
