import "../lib/environment";
import { randomUUID } from "node:crypto";
import { getPrismaClient, type Prisma } from "@habitat/db/client";
import type { StoryIdeaFacet } from "@habitat/shared";
import { metaSchemasByKind } from "../lib/story-meta-schemas";
import { stableJson } from "./lib/story-authoring";

/**
 * THE IDEA CENTER — first furniture (2026-09-09).
 *
 * Two jobs, both idempotent:
 *
 * 1. The three threads that already existed get their facets. The migration
 *    backfilled `facets: []`, which reads as "nobody has said what kind of
 *    idea this is"; these three are known.
 *
 * 2. Two ideas that are already IN THE GAME get a card, credited to the
 *    member who thought of them, at the "In game" stage, pointing at the
 *    dossier the room built from them. The son's Blackweir Anaconda and
 *    Schlotzsky's Radiant Path are the Idea Center's proof that an idea from
 *    anybody in the family can go the whole way. (Mackenzie's contribution is
 *    on her dossier in gold — see the contributor originals law — but she
 *    has no account, and ideas here are accounts only, so no card is made.)
 *
 * Threads never reach the export. Nothing here touches the game.
 *
 *   pnpm --filter @habitat/web exec tsx scripts/author-idea-center-backfill.ts
 *   pnpm --filter @habitat/web exec tsx scripts/author-idea-center-backfill.ts --apply
 */
const db = getPrismaClient();
const apply = process.argv.includes("--apply");
const schema = metaSchemasByKind.THREAD!;

const facetsByThread: Record<string, StoryIdeaFacet[]> = {
  "the-empty-cribs": ["story", "characters"],
  "the-fuse-at-heartland": ["story", "regions"],
  "the-angel-of-the-forges": ["story", "characters", "systems", "regions"], // also set by author-angel-of-the-forges-thread.ts
};

type ImplementedIdea = {
  slug: string;
  proposerUsername: string;
  title: string;
  summary: string;
  body: string;
  facets: StoryIdeaFacet[];
  tags: string[];
  links: { characters?: string[]; factions?: string[]; locations?: string[]; bosses?: string[] };
  revision: string;
};

const implemented: ImplementedIdea[] = [
  {
    slug: "idea-the-blackweir-anaconda",
    proposerUsername: "hunterthekid26",
    title: "A giant snake in the poisoned water",
    summary: "The son's idea: a Mythic anaconda living in the worst water in Bloomfall, grown from what the reactor did to everything it touched. It is in the game as the Blackweir Anaconda.",
    body: `**In game.** This is the idea that became [[the-blackweir-anaconda]] — Bloomfall Reach's Mythic, a filtration organism the size of infrastructure, with a Southreach biologist still running it. Everything that fights, drops, and bleeds is on the dossier; this card is where the idea started.

## The idea

A giant snake in the poisoned water. Not a monster that wandered in — something the water *made*, big enough to be part of the plumbing, and worth a proper fight for the hide.

## What the room did with it

- Gave it a reason to be there: the organism was a filtration prototype, thrown into the water on purpose during the lockdown by a man with one corridor to decide.
- Made it the region's Mythic, with the [[anaconda-hideplate]] cut from it — reactor-resistant, Blackbloom-adaptive plate.
- Tied it into the Bloomfall Adaptive Mutation ladder, so the thing keeps changing the longer it lives.

An idea from a member went the whole way to the game. That is what this room is for.`,
    facets: ["models", "regions", "systems"],
    tags: ["bloomfall", "mythic", "creature", "in-game"],
    links: { bosses: ["the-blackweir-anaconda"], locations: ["bloomfall-reach"] },
    revision: "Filed the Blackweir Anaconda as an Idea Center card at In game, credited to its proposer.",
  },
  {
    slug: "idea-the-radiant-path",
    proposerUsername: "schlotzsky",
    title: "A faith that says the dead were in the light",
    summary: "Schlotzsky's idea: a heresy in the Southside that holds the Forge only interrupts the light the dead are already in — and that resurrection should belong to everybody. It is in the game as the Radiant Path.",
    body: `**In game.** This is the idea that became [[the-radiant-path]]: a Forgefaith heresy in [[the-southside]], a militant movement of the unbound and the reclaimed, funded without knowing it by the Crimson Choir. The dossier holds the doctrine, the rungs, the people and the fights; this card is where the idea started.

## The idea

Somebody comes back from a Forge and will not stop talking about what she saw between the falling and the platform: a light with no source and no edge, and *you are not alone in it*. A religion grows around a testimony nobody can check, and it turns political fast, because in a Forge economy who gets brought back is the whole question.

## What the room did with it

- Gave it a founder who never meant to found anything — [[ilse-vetch]] — and a loud, certain man to arm it — [[ivo-crane]].
- Put it in the Southside, where the faces have scars and the Forge hall has one Core, so the class fight underneath the doctrine is visible across a room.
- Made the Crimson Choir its secret paymaster, which is a knife the story has not yet used.

A member's idea, with a member's name on it, all the way into the game.`,
    facets: ["story", "characters", "regions"],
    tags: ["arcadia", "southside", "faction", "faith", "in-game"],
    links: { factions: ["the-radiant-path"], characters: ["ilse-vetch", "ivo-crane"], locations: ["the-southside", "port-arcadia"] },
    revision: "Filed the Radiant Path as an Idea Center card at In game, credited to its proposer.",
  },
];

async function existingSlugs(slugs: string[]): Promise<string[]> {
  if (slugs.length === 0) return [];
  const rows = await db.storyEntry.findMany({ where: { slug: { in: slugs } }, select: { slug: true } });
  const found = new Set(rows.map((row) => row.slug));
  for (const slug of slugs) if (!found.has(slug)) console.warn(`  ! "${slug}" is not in the bible; not linked`);
  return slugs.filter((slug) => found.has(slug));
}

async function main() {
  const actor = await db.user.findFirstOrThrow({ where: { role: "ADMIN", isActive: true }, orderBy: { id: "asc" }, select: { id: true } });

  // 1. Facets on the threads that already existed.
  for (const [slug, facets] of Object.entries(facetsByThread)) {
    const thread = await db.storyEntry.findUnique({ where: { slug }, select: { id: true, kind: true, meta: true } });
    if (!thread || thread.kind !== "THREAD") { console.warn(`! ${slug} is not a thread; skipped`); continue; }
    const current = thread.meta as Record<string, unknown>;
    const meta = { ...current, facets, sections: Array.isArray(current.sections) ? current.sections : [] };
    const parsed = schema.safeParse(meta);
    if (!parsed.success) { console.error(slug, JSON.stringify(parsed.error.issues, null, 1)); process.exitCode = 2; return; }
    if (stableJson(thread.meta) === stableJson(meta)) { console.log(`= ${slug} facets already ${facets.join(", ")}`); continue; }
    console.log(`~ ${slug} facets -> ${facets.join(", ")}`);
    if (apply) {
      await db.storyEntry.update({ where: { id: thread.id }, data: { meta: meta as Prisma.InputJsonValue, updatedByUserId: actor.id, version: { increment: 1 } } });
      await db.storyRevision.create({ data: { id: randomUUID(), entityType: "ENTRY", entityId: thread.id, action: "UPDATED", actorUserId: actor.id, summary: `Said what kind of idea this is: ${facets.join(", ")}.` } });
    }
  }

  // 2. The two ideas that made it into the game.
  for (const idea of implemented) {
    const proposer = await db.user.findUnique({ where: { username: idea.proposerUsername }, select: { id: true } });
    if (!proposer) { console.warn(`! no account "${idea.proposerUsername}"; ${idea.slug} skipped`); continue; }
    const links = {
      characters: await existingSlugs(idea.links.characters ?? []),
      factions: await existingSlugs(idea.links.factions ?? []),
      locations: await existingSlugs(idea.links.locations ?? []),
      bosses: await existingSlugs(idea.links.bosses ?? []),
    };
    const meta = {
      threadStatus: "implemented",
      categories: [],
      stages: [],
      priority: null,
      spoilerLevel: "minor",
      parent: null,
      characters: links.characters,
      companions: [],
      factions: links.factions,
      locations: links.locations,
      arcs: [],
      companionMissions: [],
      bosses: links.bosses,
      canonPackets: [],
      facets: idea.facets,
      sections: [],
      tags: idea.tags,
      openQuestions: [],
    };
    const parsed = schema.safeParse(meta);
    if (!parsed.success) { console.error(idea.slug, JSON.stringify(parsed.error.issues, null, 1)); process.exitCode = 2; return; }

    const existing = await db.storyEntry.findUnique({ where: { slug: idea.slug }, select: { id: true, kind: true, title: true, summary: true, body: true, meta: true, createdByUserId: true } });
    if (existing && existing.kind !== "THREAD") throw new Error(`"${idea.slug}" exists and is a ${existing.kind}.`);
    if (!existing) {
      console.log(`+ THREAD ${idea.slug} — ${idea.title} (by ${idea.proposerUsername})`);
      if (apply) {
        const created = await db.storyEntry.create({ data: { id: randomUUID(), kind: "THREAD", slug: idea.slug, title: idea.title, summary: idea.summary, body: idea.body, status: "CANON", createdByUserId: proposer.id, meta: meta as Prisma.InputJsonValue } });
        await db.storyRevision.create({ data: { id: randomUUID(), entityType: "ENTRY", entityId: created.id, action: "CREATED", actorUserId: actor.id, summary: idea.revision } });
      }
    } else if (existing.title !== idea.title || existing.summary !== idea.summary || existing.body !== idea.body || stableJson(existing.meta) !== stableJson(meta) || existing.createdByUserId !== proposer.id) {
      console.log(`~ THREAD ${idea.slug} — ${idea.title}`);
      if (apply) {
        await db.storyEntry.update({ where: { id: existing.id }, data: { title: idea.title, summary: idea.summary, body: idea.body, meta: meta as Prisma.InputJsonValue, createdByUserId: proposer.id, updatedByUserId: actor.id, version: { increment: 1 } } });
        await db.storyRevision.create({ data: { id: randomUUID(), entityType: "ENTRY", entityId: existing.id, action: "UPDATED", actorUserId: actor.id, summary: `Refreshed the Idea Center card "${idea.title}".` } });
      }
    } else {
      console.log(`= THREAD ${idea.slug} already current`);
    }
  }
  console.log(apply ? "APPLIED" : "PREVIEW — re-run with --apply to write it.");
}

main().then(() => db.$disconnect(), (error) => { console.error(error); return db.$disconnect().then(() => process.exit(2)); });
