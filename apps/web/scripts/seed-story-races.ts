import "../lib/environment";
import { getPrismaClient, type Prisma } from "@habitat/db/client";
import { existingRaceSheets, raceAssignments, raceSeeds } from "../lib/story-races-seed";

/**
 * Builds the races shelf: creates the races that were missing, marks the
 * umbrella entries that were already doing the job, and files every existing
 * creature under the race it belongs to.
 *
 * Idempotent throughout. A race that exists is left exactly as it stands, and
 * an assignment is only written when the entry does not already name a parent
 * — so a writer who re-files something by hand is never overruled by a rerun.
 *
 *   pnpm --filter @habitat/web exec tsx scripts/seed-story-races.ts
 */
const db = getPrismaClient();

async function main() {
  const author =
    (await db.user.findFirst({ where: { OR: [{ displayName: "Tino" }, { name: "Tino" }], isActive: true }, select: { id: true, username: true } })) ??
    (await db.user.findFirstOrThrow({ where: { role: "ADMIN", isActive: true }, select: { id: true, username: true } }));
  console.log(`author: ${author.username}`);
  let written = 0;

  // 1. The races that did not exist yet.
  for (const seed of raceSeeds) {
    const existing = await db.storyEntry.findUnique({ where: { slug: seed.slug }, select: { id: true, kind: true } });
    if (existing) {
      console.log(`  skip   ${seed.slug} (already exists as ${existing.kind})`);
      continue;
    }
    await db.$transaction(async (tx) => {
      const entry = await tx.storyEntry.create({
        data: {
          kind: "CREATURE",
          slug: seed.slug,
          title: seed.title,
          summary: seed.summary,
          body: seed.body,
          status: "CANON",
          meta: seed.meta as unknown as Prisma.InputJsonValue,
          createdByUserId: author.id,
        },
      });
      await tx.storyRevision.create({
        data: { entityType: "ENTRY", entityId: entry.id, action: "CREATED", actorUserId: author.id, summary: `Named the race "${entry.title}"`, after: { kind: "CREATURE", title: seed.title, race: true } },
      });
    });
    console.log(`  seeded race ${seed.slug}`);
    written += 1;
  }

  // 2. The umbrella entries that were already races — sheet only, prose kept.
  for (const { slug, category } of existingRaceSheets) {
    const entry = await db.storyEntry.findUnique({ where: { slug }, select: { id: true, title: true, meta: true } });
    if (!entry) { console.log(`  miss   ${slug} (not in the codex)`); continue; }
    const meta = (entry.meta as Record<string, unknown> | null) ?? {};
    if (meta.parent === null && meta.category) { console.log(`  skip   ${slug} (already marked a race)`); continue; }
    // Whatever the sheet already holds wins; this only supplies the two facts
    // that make it a race — nothing above it, and a category.
    const next: Record<string, unknown> = {
      biomes: [], threat: null, harvest: null, gameId: null, openQuestions: [],
      ...meta,
      parent: null,
      category: meta.category ?? category,
    };
    await db.$transaction(async (tx) => {
      await tx.storyEntry.update({ where: { id: entry.id }, data: { meta: next as Prisma.InputJsonValue, version: { increment: 1 }, updatedByUserId: author.id } });
      await tx.storyRevision.create({
        data: { entityType: "ENTRY", entityId: entry.id, action: "UPDATED", actorUserId: author.id, summary: `Marked "${entry.title}" as a race`, before: { meta: entry.meta }, after: { meta: next as Prisma.InputJsonValue } },
      });
    });
    console.log(`  marked ${slug} as a race`);
    written += 1;
  }

  // 3. File every remaining creature under its race.
  for (const { slug, parent, category } of raceAssignments) {
    const entry = await db.storyEntry.findUnique({ where: { slug }, select: { id: true, title: true, meta: true } });
    if (!entry) { console.log(`  miss   ${slug} (not in the codex)`); continue; }
    const meta = (entry.meta as Record<string, unknown> | null) ?? {};
    if (typeof meta.parent === "string" && meta.parent.trim()) {
      console.log(`  skip   ${slug} (already filed under ${meta.parent})`);
      continue;
    }
    const next: Record<string, unknown> = { category, biomes: [], threat: null, harvest: null, gameId: null, openQuestions: [], ...meta, parent };
    if (!next.category) next.category = category;
    await db.$transaction(async (tx) => {
      await tx.storyEntry.update({ where: { id: entry.id }, data: { meta: next as Prisma.InputJsonValue, version: { increment: 1 }, updatedByUserId: author.id } });
      await tx.storyRevision.create({
        data: { entityType: "ENTRY", entityId: entry.id, action: "UPDATED", actorUserId: author.id, summary: `Filed "${entry.title}" under the ${parent}`, before: { meta: entry.meta }, after: { meta: next as Prisma.InputJsonValue } },
      });
    });
    console.log(`  filed  ${slug} under ${parent}`);
    written += 1;
  }

  console.log(`\n${written} written`);
}

main().then(() => db.$disconnect(), (error) => { console.error(error); return db.$disconnect().then(() => process.exit(1)); });
