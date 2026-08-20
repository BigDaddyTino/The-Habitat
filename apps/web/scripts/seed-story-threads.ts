import "../lib/environment";
import { getPrismaClient, type Prisma } from "@habitat/db/client";
import { amandaSeed, companionMissionSeeds, emptyCribsSeed, lizzarnixLorePatches, lizzarnixSeed, tinoCompanionPatch } from "../lib/story-threads-seed";

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
  const seedEntry = async (seed: { slug: string; title: string; summary: string; body: string; meta: unknown }, kind: "CHARACTER" | "CREATURE" | "THREAD" | "COMPANION_MISSION", status: "PROPOSED" | "CANON", summaryLine: string, refreshSeedVersionOne = false) => {
    const existing = await db.storyEntry.findUnique({ where: { slug: seed.slug }, select: { id: true, kind: true, version: true, title: true, summary: true, body: true, meta: true } });
    if (existing) {
      if (refreshSeedVersionOne && existing.version === 1 && existing.kind === kind) {
        await db.$transaction(async (tx) => {
          await tx.storyEntry.update({
            where: { id: existing.id },
            data: { title: seed.title, summary: seed.summary, body: seed.body, meta: seed.meta as Prisma.InputJsonValue, version: { increment: 1 }, updatedByUserId: author.id },
          });
          await tx.storyRevision.create({
            data: {
              entityType: "ENTRY",
              entityId: existing.id,
              action: "UPDATED",
              actorUserId: author.id,
              summary: `Integrated the Lizzarnix revelation into "${seed.title}"`.slice(0, 300),
              before: { title: existing.title, summary: existing.summary, body: existing.body, meta: existing.meta as Prisma.InputJsonValue },
              after: { title: seed.title, summary: seed.summary, body: seed.body, meta: seed.meta as Prisma.InputJsonValue },
            },
          });
        });
        console.log(`  updated ${seed.slug} (${kind}, Lizzarnix integration)`);
        created += 1;
        return;
      }
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

  await seedEntry(amandaSeed, "CHARACTER", "PROPOSED", `Proposed the character "${amandaSeed.title}" (Am~hors~ormen~da) — brainstorming, Lizzarnix identity ending-gated`, true);
  await seedEntry(lizzarnixSeed, "CREATURE", "CANON", `Established the mythical creature "${lizzarnixSeed.title}" and its lost place in the origin of magic`, true);
  await seedEntry(emptyCribsSeed, "THREAD", "CANON", `Proposed the story thread "${emptyCribsSeed.title}" — brainstorming, not confirmed canon`, true);
  for (const seed of companionMissionSeeds) {
    await seedEntry(seed, "COMPANION_MISSION", "CANON", `Proposed companion mission ${seed.meta.order} of Amanda's arc: "${seed.title}" — brainstorming`, seed.slug === "am-hors-ormen-da");
  }

  // Amanda's visual revision arrived after the first Lizzarnix migration.
  // Replace only the appearance field so any live edits elsewhere on her
  // character sheet remain exactly as the room left them.
  const amanda = await db.storyEntry.findUnique({ where: { slug: "amanda" }, select: { id: true, title: true, meta: true } });
  if (amanda) {
    const meta = (amanda.meta as Record<string, unknown> | null) ?? {};
    const appearance = typeof meta.appearance === "string" ? meta.appearance : "";
    if (!appearance.includes("lower spine")) {
      const next = { ...meta, appearance: amandaSeed.meta.appearance };
      await db.$transaction(async (tx) => {
        await tx.storyEntry.update({ where: { id: amanda.id }, data: { meta: next as Prisma.InputJsonValue, version: { increment: 1 }, updatedByUserId: author.id } });
        await tx.storyRevision.create({
          data: {
            entityType: "ENTRY",
            entityId: amanda.id,
            action: "UPDATED",
            actorUserId: author.id,
            summary: `Refined "${amanda.title}" with near-luminous golden eyes and her naturally integrated Lizzarnix tail`,
            before: { appearance },
            after: { appearance: amandaSeed.meta.appearance },
          },
        });
      });
      console.log("  patched amanda — golden eyes and integrated tail");
      created += 1;
    } else {
      console.log("  skip   amanda visual anatomy (already integrated)");
    }
  }

  // The races shelf may already have filed this entry under Mythical, which
  // increments its version without changing its prose. Update only the prose
  // and pitch so that parent assignment and every other sheet field survive.
  const lizzarnix = await db.storyEntry.findUnique({ where: { slug: "lizzarnix" }, select: { id: true, title: true, summary: true, body: true } });
  if (lizzarnix && !(lizzarnix.body ?? "").includes("upright humanoid people")) {
    await db.$transaction(async (tx) => {
      await tx.storyEntry.update({ where: { id: lizzarnix.id }, data: { summary: lizzarnixSeed.summary, body: lizzarnixSeed.body, version: { increment: 1 }, updatedByUserId: author.id } });
      await tx.storyRevision.create({
        data: {
          entityType: "ENTRY",
          entityId: lizzarnix.id,
          action: "UPDATED",
          actorUserId: author.id,
          summary: `Refined "${lizzarnix.title}" as an upright humanoid people with distinct adult male and female forms`,
          before: { summary: lizzarnix.summary, body: lizzarnix.body },
          after: { summary: lizzarnixSeed.summary, body: lizzarnixSeed.body },
        },
      });
    });
    console.log("  patched lizzarnix — upright humanoid male and female forms");
    created += 1;
  } else if (lizzarnix) {
    console.log("  skip   lizzarnix humanoid anatomy (already integrated)");
  }

  // The Lizzarnix are older than Amanda's thread, so the revelation belongs in
  // the load-bearing world entries too. Append only: these records have been
  // edited since their original seed and must never be replaced wholesale.
  for (const patch of lizzarnixLorePatches) {
    const entry = await db.storyEntry.findUnique({ where: { slug: patch.slug }, select: { id: true, title: true, body: true, meta: true } });
    if (!entry) {
      console.log(`  skip   ${patch.slug} (lore target not found)`);
      continue;
    }
    if ((entry.body ?? "").includes("[[lizzarnix]]")) {
      console.log(`  skip   ${patch.slug} (Lizzarnix lore already present)`);
      continue;
    }
    const meta = (entry.meta as Record<string, unknown> | null) ?? null;
    const nextMeta = patch.pillar && meta
      ? { ...meta, pillars: [...new Set([...(Array.isArray(meta.pillars) ? meta.pillars.filter((value): value is string => typeof value === "string") : []), patch.pillar])] }
      : meta;
    const nextBody = [entry.body?.trim(), patch.body].filter(Boolean).join("\n\n");
    await db.$transaction(async (tx) => {
      await tx.storyEntry.update({ where: { id: entry.id }, data: { body: nextBody, ...(nextMeta ? { meta: nextMeta as Prisma.InputJsonValue } : {}), version: { increment: 1 }, updatedByUserId: author.id } });
      await tx.storyRevision.create({
        data: {
          entityType: "ENTRY",
          entityId: entry.id,
          action: "UPDATED",
          actorUserId: author.id,
          summary: `Connected "${entry.title}" to the forgotten Lizzarnix origin of magic`,
          before: { body: entry.body, meta: entry.meta } as Prisma.InputJsonValue,
          after: { body: nextBody, meta: nextMeta } as Prisma.InputJsonValue,
        },
      });
    });
    console.log(`  patched ${patch.slug} — Lizzarnix lore`);
    created += 1;
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
