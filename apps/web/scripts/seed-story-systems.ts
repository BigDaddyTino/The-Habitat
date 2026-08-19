import "../lib/environment";
import { getPrismaClient, type Prisma } from "@habitat/db/client";
import { storySystemsSeed } from "../lib/story-systems-seed";

/**
 * Seeds the founding Systems shelf. Idempotent: an existing slug is left
 * exactly as it stands — once seeded, the codex owns the content and this
 * script must never overwrite what writers have done to it since.
 *
 *   pnpm --filter @habitat/web exec tsx scripts/seed-story-systems.ts
 */
const db = getPrismaClient();

async function main() {
  // Canon authorship goes to the owner where one is identifiable, else the
  // first active admin — the entries read as the studio's founding notes.
  const author =
    (await db.user.findFirst({ where: { OR: [{ displayName: "Tino" }, { name: "Tino" }], isActive: true }, select: { id: true, username: true } })) ??
    (await db.user.findFirstOrThrow({ where: { role: "ADMIN", isActive: true }, select: { id: true, username: true } }));
  console.log(`author: ${author.username}`);

  let created = 0;
  for (const seed of storySystemsSeed) {
    const existing = await db.storyEntry.findUnique({ where: { slug: seed.slug }, select: { id: true, kind: true } });
    if (existing) {
      console.log(`  skip   ${seed.slug} (already exists as ${existing.kind})`);
      continue;
    }
    await db.$transaction(async (tx) => {
      const entry = await tx.storyEntry.create({
        data: {
          kind: "SYSTEM",
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
        data: {
          entityType: "ENTRY",
          entityId: entry.id,
          action: "CREATED",
          actorUserId: author.id,
          summary: `Wrote the game system "${entry.title}"`,
          after: { kind: "SYSTEM", title: seed.title, summary: seed.summary, meta: seed.meta as unknown as Prisma.InputJsonValue },
        },
      });
    });
    console.log(`  seeded ${seed.slug}`);
    created += 1;
  }
  console.log(`\n${created} created, ${storySystemsSeed.length - created} already present`);
}

main().then(() => db.$disconnect(), (error) => { console.error(error); return db.$disconnect().then(() => process.exit(1)); });
