import "../lib/environment";
import { randomUUID } from "node:crypto";
import { getPrismaClient, type Prisma } from "@habitat/db/client";
import { metaSchemasByKind } from "../lib/story-meta-schemas";
import { stableJson } from "./lib/story-authoring";

/**
 * ILLYRIA, THE ANGEL OF THE FORGES — the owner's end-boss idea, stored before
 * it is lost, and now named.
 *
 * Tino, 2026-09-06: "the angel that watches over the player and keeps him in
 * the front of the soulforge queue and pops up once in a while … he controls
 * all the soul forges, that end boss man." Same day, the second pass: the
 * Echo must be given freely; a shapeshifter met as several people; rules the
 * Floating City; every lost Echo goes to him; he reworks them into the Risen;
 * he is the Old Hunger.
 *
 * Tino, 2026-09-09: her name is Illyria, and she is a woman. The reference
 * notes he built the name from are read here against Martino as the source of
 * truth — mirrors become Echoes, the First Light becomes the light with no
 * source and no edge — and an image brief for Sol is added.
 *
 * This is a THREAD on the Idea Center at `brainstorming`. Threads never reach
 * the export, so nothing here touches the game. Which faces are hers is still
 * the owner's alone to assign; nothing on any board may hint at it.
 *
 *   pnpm --filter @habitat/web exec tsx scripts/author-angel-of-the-forges-thread.ts
 *   pnpm --filter @habitat/web exec tsx scripts/author-angel-of-the-forges-thread.ts --apply
 */
const db = getPrismaClient();
const apply = process.argv.includes("--apply");
const SLUG = "the-angel-of-the-forges";

const title = "Illyria, the Angel of the Forges";
const summary = "The owner's end-boss idea: Illyria, an angel who controls every Soul Forge and keeps the player at the front of the queue, needs the player's Echo given freely, walks the campaign wearing several faces, rules the Floating City — and is where every lost Echo goes. The corrupter of souls. The Old Hunger. Named 2026-09-09. Brainstorming.";

const body = `**Status: brainstorming. This is an idea the owner wanted stored before it was lost, not canon.** Nothing below is confirmed and nothing reaches the game. She has a name now. She does not yet have a face on any board, and must not.

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

## The name, and that she is a she (owner ruling, 2026-09-09)

> I have a name for HER, "Illyria". Yes I want it to be a female Angel.

The two passes above were written before the owner had settled her sex; the quotes stay as he said them, and everything else on this sheet says **she**. Her name is **Illyria**. The owner built it deliberately, and his notes on why are read below against the world, because a name in Martino has to earn its place in the world's own terms — see [[the-three-origins-of-magic]], [[the-soul-forge]], and the way the Path talks about the light.

## Why the name holds, read against Martino

The owner's notes say the name is a lethal balance: luminous and noble on the surface, serpentine underneath. That is exactly the shape canon left for her. Point by point, translated into this world:

- **The sound is the camouflage.** Soft double *l*, the lyrical *-ria*: it sounds like something you would trust in the light. In Martino that is not a flourish; it is a weapon. [[ilse-vetch]]'s testimony — the founding claim of [[the-radiant-path]] — is that between the falling and the platform there is a light with no source and no edge, and *you are not alone in it*. Nobody has ever said who else is in there. When a Path preacher finally puts a name to the presence in the light, it will be a name that sounds like this one. She will have let them find it.
- **The grit under the vowel.** The *Ill-* is the tell. She never sounds fragile; she sounds sovereign, and cold. That is the register of a being who sequences every queue on the peninsula — the keeper's law from [[reclamation]] (*whoever sequences the hold decides who lives*) raised to the scale of the whole world, held by someone who has never once been tired.
- **Illusion, elusive, elysian.** The owner's own reading of the name. In Martino the word that carries all three is **Echo**. She does not merely look like other people; see *Refractions*, below.
- **"She Who Reflects the First Light."** The owner floats this as her celestial title, and it lands squarely on two open questions canon has kept for years: *who built the first Forges* ([[the-soul-forge]]) and *what is the light* (the Path). If the first Forge was a mirror held up to the light so that what fell into it could be caught and returned, then the one who held it is the First Reflection — and mirrors, as the owner says, do not only reflect. They distort, they conceal, and they show the viewer what the viewer wants to see. Humanity has been operating mirrors it did not make, and thinking they were doors.
- **A crown she designed for herself.** Other names in this world are given — by a Forge ledger, a Court, a union card. Hers is the one name on the peninsula nobody assigned. That is the usurper's mark the owner's notes describe, and it is why the orthodox will hate the name more than they hate her.

## Refractions: what her shapeshifting is, in this world (proposal)

The owner's notes suggest framing her shifts as *Refractions* or *Echoes* — she is not imitating someone, she is absorbing their authority. Martino already has the machinery for this, and it makes her far worse than a shapeshifter:

**Every face she wears is a real person's Echo that she holds.** Every register of every Forge that was destroyed or ran dry went to her; those are the dead who never came back. When she needs to walk beside the player as a ferryman, a healer, a hunter met twice on a road, she is not making a mask — she is *wearing one of the dead*, complete: their memory, their manner, the way they held a cup. Her guises are the Risen done properly, and that is why she can pass as anyone and why nobody who knew the original ever quite believes they are looking at a stranger. Some of the faces she wears may be people the player has buried.

This gives the reveal its teeth. It also gives the fight a mechanic: she has as many bodies as she has stolen Echoes, and the player's road through the campaign has been taking them from her one refused reclamation at a time.

## Epithets, and who uses them (proposal — the owner picks)

The owner's list, re-homed into Martino's mouths. None is canon until he says so:

- **Illyria the Many-Faced** — what the [[the-ashen-court]] calls her when it finally understands what has been rerouting its dead.
- **Illyria the First Reflection** — the [[the-congregation-of-the-bound]]'s name for her, spoken once and never again; their whole discipline is not asking who else is in the light, and this is the answer they were not asking about.
- **Illyria the Sovereign Light** — the [[the-radiant-path]]'s name, said with love. The Path is right about the light and wrong about who is in it.
- **Illyria False-Wing** — the insult. Martino has no choir of orthodox angels to sneer at her; the closest thing is the [[floating-city-council]], if the Council turns out to be a priesthood that knows what it serves and hates it.
- **Illyria the Pale Dawn** — the [[the-old-hunger]]'s cults, from below, who see only the light of her coming and think it is morning.

## What this answers that canon left open

- **[[the-old-hunger]]'s own open questions** — *"Is the silhouette beneath Ignit the Hunger itself?"* and *"Where is the island's disappearing magic actually going?"* — are answered in one stroke: every Echo in Kestrel's Core went to the sea floor and then to her. The shape under the water in the strait, the one Wrackline throws a net back to every morning, is her or hers.
- **The Old Hunger took the children** (owner ruling, [[the-empty-cribs]]). If she is the Hunger, then the thing that emptied the cribs is the thing at the front of the player's queue, and the campaign's kindest presence and its oldest appetite are one figure.
- **The Lizzarnix rule and the gift.** [[the-three-origins-of-magic]]: the only magic that consumes no one is *willingly given*; a Lizzarnix returns from the egg because it died willingly. A do-not-reconstruct can only be filed by the person's own hand. She needs the Echo **given**, not taken — which is why she cannot simply take the player's, why the front of the queue is a courtship, and why the children of a people who give were worth taking.
- **[[the-risen]]** — canon says they climb out where the war broke the ground deep enough and that the Ashen Court is the *likeliest, unconfirmed* name behind them. This makes them hers: held Echoes with nowhere to go, reworked. Every Risen used to be somebody's return that never came.

## Where it collides with what is written (owner to rule)

- [[the-old-hunger]] is written as *"not organized; orbited"* — an appetite with followers, not a person. An angel who rules a city is a person. Either the Hunger is what the cults see of her from below, or the entry needs a line.
- [[the-soul-forge]] says a destroyed Forge *"holds nothing — every Echo in that register is gone from it."* True as far as the machine knows. Where they went is now her.
- [[the-risen]] and [[the-ashen-court]] both lean toward the Court. The Court would then be using her dead, or competing for them; the Court already reroutes around places where the Hunger's pattern is visible.
- **The Floating City.** [[the-floating-city]] and [[floating-city-council]] exist as places and a power; neither has a ruler written. She rules it. What the Council is to her — mask, priesthood, or hostages — is unwritten.
- **Shapeshifter, met as several people.** Which faces are hers is the most dangerous decision on this page and belongs to the owner alone. Once a face is hers, every scene that face is in becomes her scene. Nothing on any board may hint at it until he says which.

## What canon has been holding open for her

The room did not know it was leaving her room. It was.

- **The player is the one exception, and nobody has explained it.** [[reclamation]] says it outright: where a Forge holds anybody else, it builds the player — underbuilt, out of whatever the reserve has — and people have stood in that room and watched a machine do for one person what it has never done for anybody they have buried. *Keeps them at the front of the queue* is the sentence that explains that paragraph.
- **The keeper is the most powerful person in the settlement.** The same system says a hold is a queue and whoever sequences it decides who lives, and that the most common corruption in the setting is a tired person with a ledger moving a name. An angel who sequences every queue on the peninsula is that law at the scale of the whole world.
- **Who built the first Forges?** [[the-soul-forge]] keeps it as an open question, beside *nobody knows where the soul goes in between* and *is a refused soul still in there — and is that what the Resident is?* ([[brother-aster]]). Humanity operates machines it did not build and does not understand. Somebody understands them.
- **The light with no source and no edge.** [[ilse-vetch]]'s testimony, the founding claim of [[the-radiant-path]]: between the falling and the platform there is a light, *you are not alone in it*, and a machine in a room you did not pay for reaches in and takes you out. [[the-congregation-of-the-bound]]'s whole discipline is not asking who else is in the light. The Path asked. Nobody has answered.
- **NAG's open question.** [[nag]]'s sheet already wonders whether the reason a Forge builds one person underbuilt is sitting on that person's wrist — and canon holds that NAG is something ancient that Amanda's gift woke. Whether the watch and the angel are one thing, two things, or opposed things is the first argument this thread should have.
- **The final boss slot is empty.** [[the-empty-cribs]] ends Tino's story at a *"final boss encounter"* it never names — Tino fights it clean, and only after it does he leave. That encounter is this page.
- **The light is never the tame half.** Standing owner law: Martino's radiant register is as R-rated as its dark one — angels and willing-light beings are drawn gorgeous, wanted, never chastened. She should be beautiful and she should be frightening for the same reason.

## Image brief for Sol (owner's direction, 2026-09-09)

The owner's direction: incredibly beautiful, radiant, very sexy, very skimpy armour — she shapeshifts, so she does not wear much; black hair, red irises, olive skin; a figure any man looking at her would want. The full prompt is kept here so the art has one source. The finished piece goes in the thread's art slot (\`codex-art/threads/the-angel-of-the-forges.png\`); it must never appear on a board or beside any character who might be one of her faces.

> **Illyria, the Angel of the Forges — key art, single figure, full body, portrait orientation.**
>
> A woman of impossible, radiant beauty standing at the edge of a floating city at the hour before dawn, the sea far below her and the lights of a drowned island still glowing under the water. She is the most desirable thing in the frame and she knows it. Olive skin with a warm, lit-from-within glow, as if a light with no source is standing just behind her. Long, heavy black hair, loose, moving in a wind that touches nothing else. Eyes with deep red irises — not glowing, just wrong in a way you notice second — held on the viewer with total calm and faint amusement.
>
> Her figure is flawless and frankly sensual: full, perfect breasts; a narrow waist; wide hips and a round, high, perfect ass; long, strong, bare legs. She wears almost nothing and it is armour anyway: a few plates of pale platinum-white metal, mirror-polished so they reflect the viewer, placed only where they draw the eye — a narrow breastplate that covers less than it frames, a hip-guard that is more chain than plate, one greave on one leg, one gauntlet. Fine chains of white metal cross her bare skin between the plates. Every reflective surface on her shows something slightly different from what is actually in front of her.
>
> Her wings are the tell: vast, and made of fractured mirror-glass rather than feathers, each shard reflecting a different face — dozens of faces, men and women, old and young, some of them peaceful, some mid-scream — the dead she wears. From a distance the wings read as white light. Up close they read as a crowd.
>
> Expression: warm, patient, a little tender, the way you would look at someone you are about to help and have already decided how it ends. Nothing in her face is cruel. Everything in the wings is.
>
> Palette: platinum white, warm olive and gold skin, deep black hair, blood-red iris, cold pre-dawn blue behind her, the sick green-gold of the drowned island's lights below. Painterly realism, cinematic key-art lighting, extreme detail on skin, metal and glass. She is meant to be wanted and she is meant to be feared, for the same reason. No nudity: the plates and chains cover what they must and not one inch more. No halo, no feathers, no text.

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
  facets: ["story", "characters", "systems", "regions"],
  sections: [],
  tags: ["end-boss", "illyria", "soul-forge", "angel", "the-light", "the-player-exception", "owner-idea", "the-old-hunger", "the-risen", "shapeshifter", "floating-city", "echo-given-freely"],
  openQuestions: [
    "Which characters are her. The shapeshifter faces are the owner's alone to assign; once a face is hers, every scene it stands in is hers. Nothing hints at it on a board until he says which.",
    "Refractions: is each face she wears a real dead person's held Echo (proposal above), or a made thing? If the former, the Risen and her guises are the same craft at two qualities.",
    "Which epithet is hers, and in whose mouth. The five proposals are re-homed from the owner's notes; none is canon.",
    "Her celestial title — 'She Who Reflects the First Light' — makes her the maker or holder of the first Forge. Does the owner want her to have built the Forges, or only to have understood them first?",
    "What the Floating City Council is to her — mask, priesthood, or hostages — and whether the city knows what rules it.",
    "How 'the Echo must be given freely' plays at the end: what she offers for it, what the player can refuse, and whether refusing is the win, the loss, or the third ending.",
    "Old Hunger reconciliation: canon writes it as an appetite orbited by cults, not a person. Is the Hunger what the cults see of her from below, or does the entry gain a line?",
    "The Risen and the Ashen Court: canon leans toward the Court as their maker. Does the Court use her dead, compete for them, or answer to her?",
    "What is she to NAG — the one instrument she cannot see through, or the other half of the same gift?",
    "How 'pops up once in a while' plays without settling Tino's fate or the visions before their arcs spend them.",
    "What the fight costs the player: is the front of the queue revoked, and does the player finish as ordinary as everybody else?",
  ],
};

async function main() {
  const actor = await db.user.findFirstOrThrow({ where: { role: "ADMIN", isActive: true }, orderBy: { id: "asc" }, select: { id: true } });
  const schema = metaSchemasByKind.THREAD!;
  const parsed = schema.safeParse(meta);
  if (!parsed.success) { console.error(JSON.stringify(parsed.error.issues, null, 1)); process.exitCode = 2; return; }

  for (const slug of [...meta.characters, ...meta.factions]) {
    const found = await db.storyEntry.findUnique({ where: { slug }, select: { kind: true } });
    if (!found) throw new Error(`"${slug}" is not in the bible.`);
  }

  const existing = await db.storyEntry.findUnique({ where: { slug: SLUG }, select: { id: true, kind: true, title: true, summary: true, body: true, meta: true, status: true } });
  if (existing && existing.kind !== "THREAD") throw new Error(`"${SLUG}" exists and is a ${existing.kind}.`);

  // Members' per-facet additions and the Idea Center's own fields are theirs, not this script's: carry them through.
  const carried = existing ? (existing.meta as Record<string, unknown>) : {};
  const next = { ...meta, sections: Array.isArray(carried.sections) ? carried.sections : [] };

  if (!existing) {
    console.log(`+ THREAD ${SLUG} — ${title}`);
    if (apply) {
      const created = await db.storyEntry.create({ data: { id: randomUUID(), kind: "THREAD", slug: SLUG, title, summary, body, status: "CANON", createdByUserId: actor.id, meta: next as Prisma.InputJsonValue } });
      await db.storyRevision.create({ data: { id: randomUUID(), entityType: "ENTRY", entityId: created.id, action: "CREATED", actorUserId: actor.id, summary: "Filed the owner's end-boss idea — Illyria, the Angel of the Forges — on the Idea Center at brainstorming." } });
    }
  } else if (existing.title !== title || existing.summary !== summary || existing.body !== body || stableJson(existing.meta) !== stableJson(next)) {
    console.log(`~ THREAD ${SLUG} — ${title}`);
    if (apply) {
      await db.storyEntry.update({ where: { id: existing.id }, data: { title, summary, body, meta: next as Prisma.InputJsonValue, updatedByUserId: actor.id, version: { increment: 1 } } });
      await db.storyRevision.create({ data: { id: randomUUID(), entityType: "ENTRY", entityId: existing.id, action: "UPDATED", actorUserId: actor.id, summary: "Named her: Illyria. She is a woman. The owner's name notes read against Martino, Refractions proposed, epithets re-homed, Sol image brief added." } });
    }
  } else {
    console.log(`= THREAD ${SLUG} already current`);
  }
  console.log(apply ? "APPLIED" : "PREVIEW — re-run with --apply to write it.");
}

main().then(() => db.$disconnect(), (error) => { console.error(error); return db.$disconnect().then(() => process.exit(2)); });
