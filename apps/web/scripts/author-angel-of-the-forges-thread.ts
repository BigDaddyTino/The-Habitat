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
const summary = "The owner's end-boss idea, stored as an idea: an angel who controls every Soul Forge and keeps the player at the front of the queue, needs the player's Echo given freely, walks the campaign as several faces, rules the floating island — and is where every lost Echo goes. The corrupter of souls. The Old Hunger. Brainstorming.";

const body = `**Status: brainstorming. This is an idea the owner wanted stored before it was lost, not canon.** Nothing below is confirmed, nothing is named, and nothing reaches the game.

## The idea, in the owner's words (2026-09-06)

> the angel that watches over the player and keeps him in the front of the soulforge queue and pops up once in a while — i don't have him all laid out yet, he is just an idea — he controls all the soul forges, that end boss man.

## The second pass, in the owner's words (2026-09-06, later the same day)

> END GAME BOSS — is an Angel. Controls all soul forges, makes sure the player is front of line. He needs the player's echo, but it has to be given freely, not taken.
>
> Meets and helps the player randomly throughout the game. Is a shapeshifter — is multiple characters you meet through the game, but you don't know until later. Is guiding you toward him.
>
> Lives and rules the floating island.
>
> When a soul forge is destroyed or depleted and those echos have nowhere to go, the echo has to go somewhere. The echos go to him. *Where is the island's disappearing magic actually going?* HERE IT IS.
>
> Who are the risen? He changes the echo, mutates it, and reworks them into the Risen.
>
> He is the corrupter of souls. He is the Old Hunger.

Still brainstorming. Stored so it is not lost. Everything below it is the codex pointing out where he already fits — and where he now collides with what is written, which is the owner's to rule.

## What this answers that canon left open

- **[[the-old-hunger]]'s own open questions** — *"Is the silhouette beneath Ignit the Hunger itself?"* and *"Where is the island's disappearing magic actually going?"* — are answered in one stroke: every Echo in Kestrel's Core went to the sea floor and then to him. The shape under the water in the strait, the one Wrackline throws a net back to every morning, is him or his.
- **The Old Hunger took the children** (owner ruling, [[the-empty-cribs]]). If he is the Hunger, then the thing that emptied the cribs is the thing at the front of the player's queue, and the campaign's kindest presence and its oldest appetite are one figure.
- **The Lizzarnix rule and the gift.** [[the-three-origins-of-magic]]: the only magic that consumes no one is *willingly given*; a Lizzarnix returns from the egg because it died willingly. A do-not-reconstruct can only be filed by the person's own hand. He needs the Echo **given**, not taken — which is why he cannot simply take the player's, why the front of the queue is a courtship, and why the children of a people who give were worth taking.
- **[[the-risen]]** — canon says they climb out where the war broke the ground deep enough and that the Ashen Court is the *likeliest, unconfirmed* name behind them. This makes them his: held Echoes with nowhere to go, reworked. Every Risen used to be somebody's return that never came.

## Where it collides with what is written (owner to rule)

- [[the-old-hunger]] is written as *"not organized; orbited"* — an appetite with followers, not a person. An angel who rules a city is a person. Either the Hunger is what the cults see of him from below, or the entry needs a line.
- [[the-soul-forge]] says a destroyed Forge *"holds nothing — every Echo in that register is gone from it."* True as far as the machine knows. Where they went is now his.
- [[the-risen]] and [[the-ashen-court]] both lean toward the Court. The Court would then be using his dead, or competing for them; the Court already reroutes around places where the Hunger's pattern is visible.
- **The Floating City.** [[the-floating-city]] and [[floating-city-council]] exist as places and a power; neither has a ruler written. He rules it. What the Council is to him — mask, priesthood, or hostages — is unwritten.
- **Shapeshifter, met as several people.** Which faces are his is the most dangerous decision on this page and belongs to the owner alone. Once a face is his, every scene that face is in becomes his scene. Nothing on any board may hint at it until he says which.

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
  characters: ["brother-aster", "ilse-vetch", "nag", "tino", "amanda"],
  companions: [],
  factions: ["the-congregation-of-the-bound", "the-radiant-path", "the-old-hunger", "floating-city-council", "the-ashen-court"],
  locations: ["the-floating-city", "the-starting-island"],
  arcs: [],
  companionMissions: [],
  bosses: [],
  canonPackets: [],
  tags: ["end-boss", "soul-forge", "angel", "the-light", "the-player-exception", "owner-idea", "the-old-hunger", "the-risen", "shapeshifter", "floating-city", "echo-given-freely"],
  openQuestions: [
    "His name. The owner has not given one; nothing on any board names him until he does.",
    "Which characters are him. The shapeshifter faces are the owner's alone to assign; once a face is his, every scene it stands in is his. Nothing hints at it on a board until he says which.",
    "What the Floating City Council is to him — mask, priesthood, or hostages — and whether the city knows what rules it.",
    "How 'the Echo must be given freely' plays at the end: what he offers for it, what the player can refuse, and whether refusing is the win, the loss, or the third ending.",
    "Old Hunger reconciliation: canon writes it as an appetite orbited by cults, not a person. Is the Hunger what the cults see of him from below, or does the entry gain a line?",
    "The Risen and the Ashen Court: canon leans toward the Court as their maker. Does the Court use his dead, compete for them, or answer to him?",
    "What is he to NAG — the one instrument he cannot see through, or the other half of the same gift?",
    "How 'pops up once in a while' plays without settling Tino's fate or the visions before their arcs spend them.",
    "What the fight costs the player: is the front of the queue revoked, and does the player finish as ordinary as everybody else?",
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
