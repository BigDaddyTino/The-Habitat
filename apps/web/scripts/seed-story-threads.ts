import "../lib/environment";
import { getPrismaClient, type Prisma } from "@habitat/db/client";
import { amandaSeed, companionMissionSeeds, emptyCribsSeed, tinoCompanionPatch } from "../lib/story-threads-seed";

/**
 * Seeds the founding narrative-development room: Amanda, The Empty Cribs
 * story thread, and her nine companion missions — Travis Martino's
 * Amanda/Tino storyline, landed as brainstorming material.
 *
 * Idempotent: an existing slug is left exactly as it stands — once seeded,
 * the codex owns the content. Tino's dossier is only touched in one place:
 * his companion capability, and only while it is still undecided (capable
 * null); an explicit yes or no a writer has since saved is never overwritten.
 *
 *   pnpm --filter @habitat/web exec tsx scripts/seed-story-threads.ts
 */
const db = getPrismaClient();

async function main() {
  // The storyline is Travis Martino's — his account ("Tino") gets the byline,
  // exactly as the spec's "Submitted By: Travis Martino" asks.
  const author =
    (await db.user.findFirst({ where: { OR: [{ displayName: "Tino" }, { name: "Tino" }], isActive: true }, select: { id: true, username: true } })) ??
    (await db.user.findFirstOrThrow({ where: { role: "ADMIN", isActive: true }, select: { id: true, username: true } }));
  console.log(`author: ${author.username}`);

  let created = 0;
  const seedEntry = async (seed: { slug: string; title: string; summary: string; body: string; meta: unknown }, kind: "CHARACTER" | "THREAD" | "COMPANION_MISSION", status: "PROPOSED" | "CANON", summaryLine: string) => {
    const existing = await db.storyEntry.findUnique({ where: { slug: seed.slug }, select: { id: true, kind: true } });
    if (existing) {
      console.log(`  skip   ${seed.slug} (already exists as ${existing.kind})`);
      return;
    }
    await db.$transaction(async (tx) => {
      const entry = await tx.storyEntry.create({
        data: {
          kind,
          slug: seed.slug,
          title: seed.title,
          summary: seed.summary,
          body: seed.body,
          // Amanda is PROPOSED — a character awaiting the room's approval.
          // Threads and missions land at the room's working status like every
          // other save; their development truth is the meta status, which is
          // "brainstorming", and every surface shows that instead.
          status,
          meta: seed.meta as Prisma.InputJsonValue,
          createdByUserId: author.id,
        },
      });
      await tx.storyRevision.create({
        data: { entityType: "ENTRY", entityId: entry.id, action: "CREATED", actorUserId: author.id, summary: summaryLine.slice(0, 300), after: { kind, title: seed.title, summary: seed.summary } },
      });
    });
    console.log(`  seeded ${seed.slug} (${kind}, ${status})`);
    created += 1;
  };

  await seedEntry(amandaSeed, "CHARACTER", "PROPOSED", `Proposed the character "${amandaSeed.title}" (Am~hors~ormen~da) — brainstorming, species TBD`);
  await seedEntry(emptyCribsSeed, "THREAD", "CANON", `Proposed the story thread "${emptyCribsSeed.title}" — brainstorming, not confirmed canon`);
  for (const seed of companionMissionSeeds) {
    await seedEntry(seed, "COMPANION_MISSION", "CANON", `Proposed companion mission ${seed.meta.order} of Amanda's arc: "${seed.title}" — brainstorming`);
  }

  // Tino: companion-capable, later availability — additive, and only while
  // his companion object is still undecided. Everything else on his CANON
  // dossier stays exactly as the room wrote it.
  const tino = await db.storyEntry.findUnique({ where: { slug: "tino" }, select: { id: true, title: true, meta: true, version: true } });
  if (!tino) {
    console.log("  tino not found — companion patch skipped");
  } else {
    const meta = (tino.meta as Record<string, unknown> | null) ?? {};
    const companion = (typeof meta.companion === "object" && meta.companion !== null ? meta.companion : {}) as Record<string, unknown>;
    if (companion.capable === true || companion.capable === false) {
      console.log(`  skip   tino companion patch (already decided: capable=${String(companion.capable)})`);
    } else {
      const next = { ...meta, companion: tinoCompanionPatch };
      await db.$transaction(async (tx) => {
        await tx.storyEntry.update({ where: { id: tino.id }, data: { meta: next as Prisma.InputJsonValue, version: { increment: 1 }, updatedByUserId: author.id } });
        await tx.storyRevision.create({
          data: {
            entityType: "ENTRY",
            entityId: tino.id,
            action: "UPDATED",
            actorUserId: author.id,
            summary: `Marked "${tino.title}" companion-capable — proposed late-game companion after The Empty Cribs (brainstorming)`,
            before: { companion: meta.companion ?? null },
            after: { companion: tinoCompanionPatch },
          },
        });
      });
      console.log("  patched tino — companion capability (proposal)");
      created += 1;
    }
  }

  console.log(`\n${created} written`);
}

main().then(() => db.$disconnect(), (error) => { console.error(error); return db.$disconnect().then(() => process.exit(1)); });
