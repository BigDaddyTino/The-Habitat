import "../lib/environment";
import { getPrismaClient, type Prisma } from "@habitat/db/client";
import { bloomfallCreatureFieldGuide } from "../lib/bloomfall-creature-field-guide";
import { renderBloomfallCreatureGuide } from "../lib/bloomfall-creature-enhancements";

/**
 * Gives the three unwritten Exceptional Aberrants their dossiers.
 *
 * Every adaptive species can seed a named Aberrant, but only two of the five
 * already had a Codex entry — the Bellwether and Old Drowner, which predate
 * the ladder. The Slow Hill, The Braid and The Groundfault existed only inside
 * their parent species' card, so they were unreachable from the Beasts shelf
 * and from search. They are filed under Beasts like the two that came before.
 *
 * Idempotent: reconciles a record it already wrote, refuses one a writer has
 * since edited by hand.
 *
 *   pnpm --filter @habitat/web exec tsx scripts/seed-bloomfall-aberrants.ts
 *   pnpm --filter @habitat/web exec tsx scripts/seed-bloomfall-aberrants.ts --apply
 */

const seeds = [
  {
    slug: "the-slow-hill",
    title: "The Slow Hill",
    summary: "A Rootback Grazer that grew into terrain for a decade and then started moving again.",
    parentSpecies: "rootback-grazer",
    biomes: ["the-mutation-belt", "long-graze", "walking-orchard"],
    threat: "Extreme. A landmark-scale Aberrant that claims the ground it stands on.",
    harvest: "Heartwood core — a living sink the size of a barrel; killing it takes every route through that ground with it.",
  },
  {
    slug: "the-braid",
    title: "The Braid",
    summary: "A fused Sump Eel run living in the Southreach drainage as one braided conductor.",
    parentSpecies: "sump-eel",
    biomes: ["the-shattercore", "drowned-intake", "the-living-marsh"],
    threat: "Extreme. Wakes the machinery around it and fights in the dark it makes.",
    harvest: "Braided conductor — a cable grown rather than made; cutting it live discharges the drainage network.",
  },
  {
    slug: "the-groundfault",
    title: "The Groundfault",
    summary: "A Latchhound that became a fault in the Splicefield grid; the floor conducts through it.",
    parentSpecies: "latchhound",
    biomes: ["the-shattercore", "splicefield-substation", "the-mutation-belt"],
    threat: "Extreme. Site-coupled Aberrant; its reach is whatever the sector still has stored.",
    harvest: "Fault core — the heart of a grid failure, still drawing; killing it blacks out the sector.",
  },
] as const;

/** The cross-link block every Bloomfall dossier carries, so the new records are
 *  reachable from the systems that explain them rather than being dead ends. */
function relatedBlock(parentSpecies: string) {
  return `## Related in the Codex\n\n**Systems.** [[aberrant-escalation]] · [[adaptive-mutation]] · [[essence-saturation]]\n\n**Creatures.** [[${parentSpecies}]]`;
}

const body = (slug: string, parentSpecies: string) => {
  const guide = bloomfallCreatureFieldGuide[slug];
  if (!guide || guide.kind !== "BOSS") throw new Error(`${slug} has no boss field guide.`);
  return `${renderBloomfallCreatureGuide(guide)}\n\n${relatedBlock(parentSpecies)}`;
};

const db = getPrismaClient();

async function main() {
  const apply = process.argv.includes("--apply");
  const identity = await db.$queryRaw<Array<{ database: string }>>`SELECT current_database() AS database`;
  const actor = await db.user.findFirstOrThrow({ where: { role: "ADMIN", isActive: true }, orderBy: { id: "asc" }, select: { id: true } });
  const parent = await db.storyEntry.findUnique({ where: { slug: "beasts" }, select: { id: true } });
  if (!parent) throw new Error("The Beasts race is missing; refusing to file Aberrants under nothing.");

  const plan: string[] = [];
  for (const seed of seeds) {
    const expectedBody = body(seed.slug, seed.parentSpecies);
    const meta = {
      category: "natural",
      parent: "beasts",
      biomes: [...seed.biomes],
      threat: seed.threat,
      harvest: seed.harvest,
      gameId: null,
      openQuestions: [],
    } satisfies Prisma.InputJsonValue;
    const current = await db.storyEntry.findUnique({ where: { slug: seed.slug } });

    if (!current) {
      plan.push(`create ${seed.slug}`);
      if (!apply) continue;
      const created = await db.storyEntry.create({ data: {
        kind: "CREATURE", slug: seed.slug, title: seed.title, summary: seed.summary,
        body: expectedBody, meta, status: "CANON", createdByUserId: actor.id,
      } });
      await db.storyRevision.create({ data: {
        entityType: "ENTRY", entityId: created.id, action: "CREATED", actorUserId: actor.id,
        summary: `Bloomfall: filed ${seed.title} as a named Exceptional Aberrant`,
      } });
      continue;
    }

    if (current.body === expectedBody && current.title === seed.title && current.summary === seed.summary) continue;
    // Only reconcile a record this seed authored; a hand edit wins.
    if (current.body !== expectedBody && current.body !== null && !current.body.startsWith(renderBloomfallCreatureGuide(bloomfallCreatureFieldGuide[seed.slug]!).slice(0, 120))) {
      plan.push(`SKIP ${seed.slug} (edited by hand)`);
      continue;
    }
    plan.push(`update ${seed.slug}`);
    if (!apply) continue;
    await db.storyEntry.update({ where: { id: current.id }, data: {
      title: seed.title, summary: seed.summary, body: expectedBody, meta,
      version: { increment: 1 }, updatedByUserId: actor.id,
    } });
  }

  console.log(JSON.stringify({ database: identity[0]?.database, mode: apply ? "APPLY" : "PREVIEW", plan: plan.length ? plan : ["nothing to do"] }, null, 2));
}

main().finally(() => db.$disconnect());
