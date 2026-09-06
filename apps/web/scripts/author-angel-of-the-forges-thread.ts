import "../lib/environment";
import { randomUUID } from "node:crypto";
import { getPrismaClient, type Prisma } from "@habitat/db/client";
import { metaSchemasByKind } from "../lib/story-meta-schemas";
import { stableJson } from "./lib/story-authoring";

/**
 * THE ANGEL OF THE FORGES — the owner's end-boss idea, stored before it is lost.
 *
 * Tino, 2026-09-06: "the angel that watches over the player and keeps him in
 * the front of the soulforge queue and pops up once in a while … he controls
 * all the soul forges, that end boss man." Not laid out yet; an idea. This
 * files it as a THREAD on the proposal board at `brainstorming`, so it has a
 * page, a slug, and a place for the room to argue with it — and so the
 * campaign map's "what comes next" and the thread board both know the
 * campaign has an end boss slot with a shape in it.
 *
 * Threads never reach the export, so nothing here touches the game. The body
 * records the idea in the owner's own words, then lists the canon that was
 * already waiting for exactly this figure — without rewriting any of it.
 *
 *   pnpm --filter @habitat/web exec tsx scripts/author-angel-of-the-forges-thread.ts
 *   pnpm --filter @habitat/web exec tsx scripts/author-angel-of-the-forges-thread.ts --apply
 */
const db = getPrismaClient();
const apply = process.argv.includes("--apply");
const SLUG = "the-angel-of-the-forges";

const title = "The Angel of the Forges";
const summary = "The owner's end-boss idea, stored as an idea: the angel who watches over the player, keeps them at the front of every Soul Forge queue, appears now and then across the campaign — and controls all the Forges. Brainstorming; not laid out yet.";

const body = `**Status: brainstorming. This is an idea the owner wanted stored before it was lost, not canon.** Nothing below is confirmed, nothing is named, and nothing reaches the game.

## The idea, in the owner's words (2026-09-06)

> the angel that watches over the player and keeps him in the front of the soulforge queue and pops up once in a while — i don't have him all laid out yet, he is just an idea — he controls all the soul forges, that end boss man.

That is the whole of it so far. Everything else on this page is the codex pointing out where he already fits.

## What canon has been holding open for him

The room did not know it was leaving him room. It was.

- **The player is the one exception, and nobody has explained it.** [[reclamation]] says it outright: where a Forge holds anybody else, it builds the player — underbuilt, out of whatever the reserve has — and people have stood in that room and watched a machine do for one person what it has never done for anybody they have buried. *Keeps him at the front of the queue* is the sentence that explains that paragraph.
- **The keeper is the most powerful person in the settlement.** The same system says a hold is a queue and whoever sequences it decides who lives, and that the most common corruption in the setting is a tired person with a ledger moving a name. An angel who sequences every queue on the peninsula is that law at the scale of the whole world.
- **Who built the first Forges?** [[the-soul-forge]] keeps it as an open question, beside *nobody knows where the soul goes in between* and *is a refused soul still in there — and is that what the Resident is?* ([[brother-aster]]). Humanity operates machines it did not build and does not understand. Somebody understands them.
- **The light with no source and no edge.** [[ilse-vetch]]'s testimony, the founding claim of [[the-radiant-path]]: between the falling and the platform there is a light, *you are not alone in it*, and a machine in a room you did not pay for reaches in and takes you out. [[the-congregation-of-the-bound]]'s whole discipline is not asking who else is in the light. The Path asked. Nobody has answered.
- **NAG's open question.** [[nag]]'s sheet already wonders whether the reason a Forge builds one person underbuilt is sitting on that person's wrist — and canon holds that NAG is something ancient that Amanda's gift woke. Whether the watch and the angel are one thing, two things, or opposed things is the first argument this thread should have.
- **The final boss slot is empty.** [[the-empty-cribs]] ends Tino's story at a *"final boss encounter"* it never names — Tino fights it clean, and only after it does he leave. That encounter is this page.
- **The light is never the tame half.** Standing owner law: Martino's radiant register is as R-rated as its dark one — angels and willing-light beings are drawn gorgeous, wanted, never chastened. He should be beautiful and he should be frightening for the same reason.

## Questions the room should argue before anybody writes a scene

The open questions on this sheet are the ones the owner has not decided. Nothing on any board may answer them until he does.`;

const meta = {
  threadStatus: "brainstorming",
  categories: ["main-story", "boss-encounter", "reveal", "mystery", "ending"],
  stages: ["early-game", "mid-game", "late-game", "endgame"],
  priority: "critical",
  spoilerLevel: "ending",
  parent: null,
  characters: ["brother-aster", "ilse-vetch", "nag", "tino"],
  companions: [],
  factions: ["the-congregation-of-the-bound", "the-radiant-path"],
  locations: [],
  arcs: [],
  companionMissions: [],
  bosses: [],
  canonPackets: [],
  tags: ["end-boss", "soul-forge", "angel", "the-light", "the-player-exception", "owner-idea"],
  openQuestions: [
    "What is he? An angel in the world's own sense — a willing-light being — or the intelligence that built the first Forges, or something the Forges made? The three answers are three different games.",
    "Why the player? Chosen, marked, bought, owed, mistaken for somebody else — or is the player's exception the bait and the angel the hook?",
    "How does 'pops up once in a while' play: a figure in the reclamation light nobody else sees, a face in the Core, a voice on the platform in the first hour, a stranger who is always at the front of a queue? He must never settle Tino's fate or explain the visions until those arcs spend it.",
    "Is 'controls all the Soul Forges' literal — every Core answers to him — or the queue only? If literal, the Congregation, the Path, Brother Aster and every keeper on the peninsula have been working for him without knowing.",
    "What is his relationship to NAG? Same thing, opposite things, or the watch is the one instrument he cannot see through.",
    "What is he to the Old Hunger and the Ashen Court — is he the third thing under the war, or the fourth?",
    "What does the end boss fight cost the player — is the front of the queue revoked, and does the player finish the campaign as ordinary as everybody else?",
    "His name. The owner has not given one; nothing on any board names him until he does.",
  ],
};

async function main() {
  const actor = await db.user.findFirstOrThrow({ where: { role: "ADMIN", isActive: true }, orderBy: { id: "asc" }, select: { id: true } });
  const schema = metaSchemasByKind.THREAD;
  const parsed = schema.safeParse(meta);
  if (!parsed.success) { console.error(JSON.stringify(parsed.error.issues, null, 1)); process.exitCode = 2; return; }

  for (const slug of [...meta.characters, ...meta.factions]) {
    const found = await db.storyEntry.findUnique({ where: { slug }, select: { kind: true } });
    if (!found) throw new Error(`"${slug}" is not in the bible.`);
  }

  const existing = await db.storyEntry.findUnique({ where: { slug: SLUG }, select: { id: true, kind: true, title: true, summary: true, body: true, meta: true, status: true } });
  if (existing && existing.kind !== "THREAD") throw new Error(`"${SLUG}" exists and is a ${existing.kind}.`);

  if (!existing) {
    console.log(`+ THREAD ${SLUG} — ${title}`);
    if (apply) {
      const created = await db.storyEntry.create({ data: { id: randomUUID(), kind: "THREAD", slug: SLUG, title, summary, body, status: "CANON", createdByUserId: actor.id, meta: meta as Prisma.InputJsonValue } });
      await db.storyRevision.create({ data: { id: randomUUID(), entityType: "ENTRY", entityId: created.id, action: "CREATED", actorUserId: actor.id, summary: "Filed the owner's end-boss idea — the Angel of the Forges — on the proposal board at brainstorming." } });
    }
  } else if (existing.title !== title || existing.summary !== summary || existing.body !== body || stableJson(existing.meta) !== stableJson(meta)) {
    console.log(`~ THREAD ${SLUG} — ${title}`);
    if (apply) {
      await db.storyEntry.update({ where: { id: existing.id }, data: { title, summary, body, meta: meta as Prisma.InputJsonValue, updatedByUserId: actor.id, version: { increment: 1 } } });
      await db.storyRevision.create({ data: { id: randomUUID(), entityType: "ENTRY", entityId: existing.id, action: "UPDATED", actorUserId: actor.id, summary: "Rewrote the Angel of the Forges thread." } });
    }
  } else {
    console.log(`= THREAD ${SLUG} already current`);
  }
  console.log(apply ? "APPLIED" : "PREVIEW — re-run with --apply to write it.");
}

main().then(() => db.$disconnect(), (error) => { console.error(error); return db.$disconnect().then(() => process.exit(2)); });
