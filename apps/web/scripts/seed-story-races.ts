import "../lib/environment";
import { isDeepStrictEqual } from "node:util";
import { getPrismaClient, type Prisma } from "@habitat/db/client";
import { existingRaceSheets, raceAssignments, raceMemberSeeds, raceSeeds } from "../lib/story-races-seed";

/**
 * Builds the races shelf: creates the races that were missing, marks the
 * umbrella entries that were already doing the job, and files every existing
 * creature under the race it belongs to.
 *
 * Idempotent throughout. Managed taxonomy records are reconciled to this seed;
 * other existing races remain writer-owned, and assignments never overrule a
 * creature that a writer has already re-filed by hand.
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

  // Earlier versions treated Humans as a parent race and the Hippogriff plus
  // its rider as one creature. Rename those records in place so node links,
  // comments, revisions, and story appearances stay attached to their ids.
  const migrations = [
    { from: "humans", to: raceSeeds.find((seed) => seed.slug === "humanoid") },
    { from: "the-hypogriff-riders", to: raceMemberSeeds.find((seed) => seed.slug === "hippogriff") },
  ] as const;
  for (const migration of migrations) {
    const seed = migration.to;
    if (!seed) throw new Error(`Missing race migration target for ${migration.from}`);
    const [legacy, target] = await Promise.all([
      db.storyEntry.findUnique({ where: { slug: migration.from }, select: { id: true, title: true, summary: true, body: true, meta: true, status: true } }),
      db.storyEntry.findUnique({ where: { slug: seed.slug }, select: { id: true } }),
    ]);
    if (legacy && !target) {
      await db.$transaction(async (tx) => {
        await tx.storyEntry.update({
          where: { id: legacy.id },
          data: { slug: seed.slug, title: seed.title, summary: seed.summary, body: seed.body, meta: seed.meta as unknown as Prisma.InputJsonValue, version: { increment: 1 }, updatedByUserId: author.id },
        });
        await tx.storyRevision.create({
          data: { entityType: "ENTRY", entityId: legacy.id, action: "UPDATED", actorUserId: author.id, summary: `Separated the taxonomy: renamed "${legacy.title}" to "${seed.title}"`, before: { slug: migration.from, title: legacy.title, summary: legacy.summary, body: legacy.body, meta: legacy.meta }, after: { slug: seed.slug, title: seed.title, summary: seed.summary, body: seed.body, meta: seed.meta as unknown as Prisma.InputJsonValue } },
        });
      });
      console.log(`  migrated ${migration.from} -> ${seed.slug}`);
      written += 1;
    } else if (legacy && target && legacy.status !== "ARCHIVED") {
      await db.$transaction(async (tx) => {
        await tx.storyEntry.update({ where: { id: legacy.id }, data: { status: "ARCHIVED", version: { increment: 1 }, updatedByUserId: author.id } });
        await tx.storyRevision.create({ data: { entityType: "ENTRY", entityId: legacy.id, action: "STATUS_CHANGED", actorUserId: author.id, summary: `Archived superseded combined taxonomy record "${legacy.title}"`, before: { status: legacy.status }, after: { status: "ARCHIVED", replacement: seed.slug } } });
      });
      console.log(`  archived ${migration.from} (replaced by ${seed.slug})`);
      written += 1;
    }
  }

  // Rewrite authored wiki links after the in-place rename. Plain story prose
  // can still say "rider"; only the entity target changes to the beast itself.
  const linked = await db.storyEntry.findMany({
    where: { OR: [{ summary: { contains: "[[the-hypogriff-riders]]" } }, { body: { contains: "[[the-hypogriff-riders]]" } }] },
    select: { id: true, title: true, summary: true, body: true },
  });
  for (const entry of linked) {
    const summary = entry.summary?.replaceAll("[[the-hypogriff-riders]]", "[[hippogriff]]") ?? null;
    const body = entry.body?.replaceAll("[[the-hypogriff-riders]]", "[[hippogriff]]") ?? null;
    await db.$transaction(async (tx) => {
      await tx.storyEntry.update({ where: { id: entry.id }, data: { summary, body, version: { increment: 1 }, updatedByUserId: author.id } });
      await tx.storyRevision.create({ data: { entityType: "ENTRY", entityId: entry.id, action: "UPDATED", actorUserId: author.id, summary: `Repointed the Hippogriff lore link in "${entry.title}"`, before: { summary: entry.summary, body: entry.body }, after: { summary, body } } });
    });
    written += 1;
  }

  // 1. The parent races and the two newly separated children.
  for (const seed of [...raceSeeds, ...raceMemberSeeds]) {
    const existing = await db.storyEntry.findUnique({ where: { slug: seed.slug }, select: { id: true, kind: true, title: true, summary: true, body: true, meta: true } });
    if (existing) {
      const managed = seed.slug === "mythical" || seed.slug === "humanoid" || raceMemberSeeds.some((member) => member.slug === seed.slug);
      const needsUpdate = managed && (existing.title !== seed.title || existing.summary !== seed.summary || existing.body !== seed.body || !isDeepStrictEqual(existing.meta, seed.meta));
      if (!needsUpdate) {
        console.log(`  skip   ${seed.slug} (already exists as ${existing.kind})`);
        continue;
      }
      await db.$transaction(async (tx) => {
        await tx.storyEntry.update({ where: { id: existing.id }, data: { title: seed.title, summary: seed.summary, body: seed.body, meta: seed.meta as unknown as Prisma.InputJsonValue, version: { increment: 1 }, updatedByUserId: author.id } });
        await tx.storyRevision.create({ data: { entityType: "ENTRY", entityId: existing.id, action: "UPDATED", actorUserId: author.id, summary: `Aligned "${seed.title}" with the parent-and-child race taxonomy`, before: { title: existing.title, summary: existing.summary, body: existing.body, meta: existing.meta }, after: { title: seed.title, summary: seed.summary, body: seed.body, meta: seed.meta as unknown as Prisma.InputJsonValue } } });
      });
      console.log(`  updated ${seed.slug}`);
      written += 1;
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
        data: { entityType: "ENTRY", entityId: entry.id, action: "CREATED", actorUserId: author.id, summary: `Named the ${seed.meta.parent ? "race child" : "race"} "${entry.title}"`, after: { kind: "CREATURE", title: seed.title, race: !seed.meta.parent, parent: seed.meta.parent } },
      });
    });
    console.log(`  seeded ${seed.meta.parent ? "race child" : "race"} ${seed.slug}`);
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
