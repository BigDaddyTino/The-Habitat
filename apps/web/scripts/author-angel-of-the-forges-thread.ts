import "../lib/environment";
import { createHash, randomUUID } from "node:crypto";
import { getPrismaClient, type Prisma } from "@habitat/db/client";
import type { StoryIdeaFacet } from "@habitat/shared";
import { metaSchemasByKind } from "../lib/story-meta-schemas";
import { stableJson } from "./lib/story-authoring";

/**
 * ILLYRIA, THE ANGEL OF THE FORGES — the owner's end-boss idea, stored before
 * it is lost, named, and filed under the Idea Center's tabs.
 *
 * Tino, 2026-09-06: "the angel that watches over the player and keeps him in
 * the front of the soulforge queue and pops up once in a while … he controls
 * all the soul forges, that end boss man." Same day: the Echo must be given
 * freely; a shapeshifter met as several people; rules the Floating City; every
 * lost Echo goes to him; he reworks them into the Risen; he is the Old Hunger.
 *
 * Tino, 2026-09-09: her name is Illyria and she is a woman; Refractions ruled
 * yes; five names ruled into five factions; the one Echo she cannot have; the
 * very end is Give / Refuse / Merge; Give is not game over; violet eyes and a
 * violet stone veined with stormglass blue; golden hair.
 *
 * Tino, 2026-09-09, later: "you put everything in overview so now it's super
 * long. That is why we implemented the tabs." So the overview is the short
 * version, and everything else lives under Story, Characters, Systems and
 * Regions as sections in the owner's name. The tabs are the organisation.
 *
 * This is a THREAD on the Idea Center at `brainstorming`. Threads never reach
 * the export. Which faces are hers is the owner's alone; no board may hint.
 *
 *   pnpm --filter @habitat/web exec tsx scripts/author-angel-of-the-forges-thread.ts
 *   pnpm --filter @habitat/web exec tsx scripts/author-angel-of-the-forges-thread.ts --apply
 */
const db = getPrismaClient();
const apply = process.argv.includes("--apply");
const SLUG = "the-angel-of-the-forges";
const OWNER_USERNAME = "tino";
const RULED_AT = "2026-09-09T12:00:00.000Z";

const title = "Illyria, the Angel of the Forges";
const summary = "The owner's end-boss idea: Illyria, an angel who controls every Soul Forge and keeps the player at the front of the queue, needs the player's Echo given freely, walks the campaign wearing the Echoes of the dead, rules the Floating City — and is where every lost Echo goes, except one: the player's, which she cannot hold, and wants — so at the very end she asks: give it, refuse and fight, or merge and open Hard Mode. The corrupter of souls. The Old Hunger. Brainstorming.";

// ---------------------------------------------------------------- overview

const body = `**Status: brainstorming.** An idea the owner wanted stored before it was lost, not canon. Nothing here reaches the game. She has a name. She does not have a face on any board, and must not.

## In one breath

**Illyria** is the end boss. An angel — a woman — who controls every Soul Forge on the peninsula and keeps the player at the front of every queue. Every Echo from every Forge that died or ran dry went to her; she reworks them into [[the-risen]]; she wears them as faces and walks beside the player the whole campaign as people the player thinks are strangers. She rules [[the-floating-city]]. She is [[the-old-hunger]]. And the player's Echo is the one Echo in the world she has never been able to close her hand on, so she cannot take it — it has to be given. Everything she does on the road is a hand held out, palm up. At the very end she asks.

## The owner's words

> the angel that watches over the player and keeps him in the front of the soulforge queue and pops up once in a while — i don't have him all laid out yet, he is just an idea — he controls all the soul forges, that end boss man. *(2026-09-06)*

> END GAME BOSS — is an Angel. Controls all soul forges, makes sure the player is front of line. He needs the player's echo, but it has to be given freely, not taken. Meets and helps the player randomly throughout the game. Is a shapeshifter — is multiple characters you meet through the game, but you don't know until later. Is guiding you toward him. Lives and rules the floating island. When a soul forge is destroyed or depleted and those echos have nowhere to go, the echo has to go somewhere. The echos go to him. *Where is the island's disappearing magic actually going?* HERE IT IS. Who are the risen? He changes the echo, mutates it, and reworks them into the Risen. He is the corrupter of souls. He is the Old Hunger. *(2026-09-06, later)*

> I have a name for HER, "Illyria". Yes I want it to be a female Angel. *(2026-09-09)*

The first two were said before her sex was settled and stay as he said them. Everything else on this card says **she**.

## Where the rest is

- **Story** — the very end (Give, Refuse, Merge), what she answers that canon left open, where she collides with what is written, what canon was already holding open for her, and the three ending scenes as image briefs.
- **Characters** — her name and why it holds; the one Echo she cannot have and what she feels about it; the five names five factions call her without knowing; how she looks (the key art brief).
- **Systems** — Refractions (how her shapeshifting works and what it does to the fight); the queue, the exception and the violet stone; Merge, the abomination precedent and Hard Mode.
- **Regions** — the Floating City and what is really holding it up; the drowned island and the strait.

## Rules that never move

- **No face on any board.** Which characters are hers is the owner's alone to assign. Once a face is hers, every scene it stands in is hers. Nothing hints at it until he says which.
- **Five names, one line.** Five factions each have a name for her and lore about it. The sentence that makes them one woman exists on this card and nowhere else.
- **Give is not game over.** Whatever she gives in return for the Echo, the player still reclaims at every Forge afterwards.
- **The light law.** She is drawn gorgeous and frightening for the same reason. Never chastened, never the tame half.`;

// ---------------------------------------------------------------- sections

type OwnerSection = { key: string; facet: StoryIdeaFacet; body: string };

const ownerSections: OwnerSection[] = [
  // ---------------------------------------------------------------- STORY
  {
    key: "story-the-very-end",
    facet: "story",
    body: `### The very end: three roads in front of her (owner ruling, 2026-09-09)

> Since she cannot take his Echo he has to give it willingly. That is why she helps the player throughout the campaign. At the VERY END of the campaign — not written yet — the player will have a decision in front of her: Give the Echo and receive something in return. Refuse, and the boss battle begins. Third option: merge your Echo and hers together as one, become a super abomination and start at level 1 again, like when you become an abomination with only a small fragment of your Echo — and this can start Hard Mode, which is a future implementation.

The campaign's last scene is not a fight. It is a woman the player has met a dozen times under a dozen faces, finally wearing her own, holding out her hand, palm up, and asking for the one thing on the peninsula she has never been able to take. Everything she did on the road was for this minute. The player chooses, and the choice is the ending. Nothing about the scene is written yet; this is how the three roads sit in the world's own rules, so the room knows the shape before anybody writes a line.

**Give.** The Echo goes to her the only way it ever could — willingly — and by [[the-three-origins-of-magic]] a gift consumes no one, so the player does not burn for it. She keeps her word and gives something back; what that something is belongs to the owner (his candidate is the violet stone at her chest — see Systems). The room's law for it: it must be real, it must be enormous, and it must be exactly what the player has spent the whole campaign wanting, because her whole method is to know what the viewer wants to see. Whether she also keeps the promise she made to the dead she wears is the story's last question. This is the ending [[the-radiant-path]] would call salvation and [[the-congregation-of-the-bound]] would refuse to have a word for. **Hard rule: Give is not game over.** The player keeps dying and coming back on the platform exactly as before; how that works is under Systems.

**Refuse.** The hand closes on nothing for the second time in her life, and the calm finally cracks. The boss battle begins — the fight [[the-empty-cribs]] has been ending on without a name for years. Refractions gives the fight its shape: she has as many bodies as she holds Echoes, and the player has spent the campaign taking them from her one refused reclamation at a time, so what the player fights at the end is what is *left* of her — the faces still in the wings. Whether she can revoke the player's front-of-queue privilege mid-fight, and whether the player finishes the game as ordinary as everybody else, stays open.

**Merge.** The third road, and the one only Martino could offer. The player does not give the Echo and does not keep it: the two Echoes are made one. What comes out is not an abomination of infusion; it is an abomination of the light — a super-abomination carrying two Echoes and every face she ever wore, standing on the platform at level 1 with a fragment of itself and all of her. This road is the door into **Hard Mode** (future implementation: reserved, not designed). The precedent and the mechanics are under Systems.

**Locked:** three roads, in this order, at the very end, in front of her; she asks rather than takes; Give is not game over. **Open, and the owner's:** what she gives in return; the boss fight's design and cost; what the merged thing is called and can do; everything about Hard Mode past the fact that Merge opens it.`,
  },
  {
    key: "story-answers-and-collisions",
    facet: "story",
    body: `### What she answers that canon left open

- **[[the-old-hunger]]'s own open questions** — *"Is the silhouette beneath Ignit the Hunger itself?"* and *"Where is the island's disappearing magic actually going?"* — are answered in one stroke: every Echo in Kestrel's Core went to the sea floor and then to her. The shape under the water in the strait, the one Wrackline throws a net back to every morning, is her or hers.
- **The Old Hunger took the children** (owner ruling, [[the-empty-cribs]]). If she is the Hunger, then the thing that emptied the cribs is the thing at the front of the player's queue, and the campaign's kindest presence and its oldest appetite are one figure.
- **The Lizzarnix rule and the gift.** [[the-three-origins-of-magic]]: the only magic that consumes no one is *willingly given*; a Lizzarnix returns from the egg because it died willingly. A do-not-reconstruct can only be filed by the person's own hand. She needs the Echo **given**, not taken — which is why she cannot simply take the player's, why the front of the queue is a courtship, and why the children of a people who give were worth taking.
- **[[the-risen]]** — canon says they climb out where the war broke the ground deep enough and that the Ashen Court is the *likeliest, unconfirmed* name behind them. This makes them hers: held Echoes with nowhere to go, reworked. Every Risen used to be somebody's return that never came.

### Where she collides with what is written (owner to rule)

- [[the-old-hunger]] is written as *"not organized; orbited"* — an appetite with followers, not a person. An angel who rules a city is a person. Either the Hunger is what the cults see of her from below, or the entry needs a line.
- [[the-soul-forge]] says a destroyed Forge *"holds nothing — every Echo in that register is gone from it."* True as far as the machine knows. Where they went is now her.
- [[the-risen]] and [[the-ashen-court]] both lean toward the Court. The Court would then be using her dead, or competing for them; the Court already reroutes around places where the Hunger's pattern is visible.
- **The Floating City.** [[the-floating-city]] and [[floating-city-council]] exist as places and a power; neither has a ruler written. She rules it. What the Council is to her — mask, priesthood, or hostages — is unwritten.
- **Shapeshifter, met as several people.** Which faces are hers is the most dangerous decision on this card and belongs to the owner alone. Once a face is hers, every scene that face is in becomes her scene. Nothing on any board may hint at it until he says which.`,
  },
  {
    key: "story-what-canon-held-open",
    facet: "story",
    body: `### What canon has been holding open for her

The room did not know it was leaving her room. It was.

- **The player is the one exception, and nobody has explained it.** [[reclamation]] says it outright: where a Forge holds anybody else, it builds the player — underbuilt, out of whatever the reserve has — and people have stood in that room and watched a machine do for one person what it has never done for anybody they have buried. *Keeps them at the front of the queue* is the sentence that explains that paragraph.
- **The keeper is the most powerful person in the settlement.** The same system says a hold is a queue and whoever sequences it decides who lives, and that the most common corruption in the setting is a tired person with a ledger moving a name. An angel who sequences every queue on the peninsula is that law at the scale of the whole world.
- **Who built the first Forges?** [[the-soul-forge]] keeps it as an open question, beside *nobody knows where the soul goes in between* and *is a refused soul still in there — and is that what the Resident is?* ([[brother-aster]]). Humanity operates machines it did not build and does not understand. Somebody understands them.
- **The light with no source and no edge.** [[ilse-vetch]]'s testimony, the founding claim of [[the-radiant-path]]: between the falling and the platform there is a light, *you are not alone in it*, and a machine in a room you did not pay for reaches in and takes you out. [[the-congregation-of-the-bound]]'s whole discipline is not asking who else is in the light. The Path asked. Nobody has answered.
- **NAG's open question.** [[nag]]'s sheet already wonders whether the reason a Forge builds one person underbuilt is sitting on that person's wrist — and canon holds that NAG is something ancient that Amanda's gift woke. Whether the watch and the angel are one thing, two things, or opposed things is the first argument this card should have.
- **The final boss slot is empty.** [[the-empty-cribs]] ends Tino's story at a *"final boss encounter"* it never names — Tino fights it clean, and only after it does he leave. That encounter is this card.
- **The light is never the tame half.** Standing owner law: Martino's radiant register is as R-rated as its dark one — angels and willing-light beings are drawn gorgeous, wanted, never chastened. She should be beautiful and she should be frightening for the same reason.`,
  },
  {
    key: "story-three-roads-as-images",
    facet: "story",
    body: `### The three roads, as three images (2026-09-09)

One scene, one woman, one minute, three ways it goes. All three share the stage of the key art — the platform at the edge of the Floating City before dawn, white marble veined with gold, ivy and lilies alive on the stone, the drowned island glowing green-gold under the sea — and the same Illyria (golden hair, violet irises with faintly lit blue veins, olive skin, mirror-plate armour with the deep V, the violet stone at her chest, fractured-mirror wings full of faces). **The player is never given a face:** a hooded figure in a travelling coat seen from behind or in silhouette. These three have their own art slots on this page — three placeholders that fill in the moment the files land: the-angel-of-the-forges-give.png, -refuse.png and -merge.png under private/codex-art/threads/. Portrait PNG, at least 2048 on the long side. Nothing here may be used on a board.

> **GIVE.** Tender and quiet. Illyria stands close to the hooded player, close enough that her mirror wings curve around both of them like a room. Her right hand is out, palm up, and resting in it is a small sphere of soft white light — the player's Echo — lifting from the player's chest into her hand along a thin thread of light. With her left hand she reaches past the player's shoulder to fasten a fine white-metal chain around their neck: the violet stone, her stone, its blue veins lit, leaving her chest for the player's, the only violet in the frame besides her eyes. Her expression is the tenderest thing on the peninsula: eyes half closed, the faint smile of someone receiving the one gift she could never take. In the wings every reflected face has gone still and peaceful, all of them looking at the player. Warm gold light between the two figures; the first true blue of dawn breaking behind; lilies and ivy bright on the marble at their feet. Painterly realism, cinematic lighting, extreme detail on skin, metal, glass and the stone. No nudity, no halo, no feathers, no text.

> **REFUSE.** The calm has cracked. Illyria's right hand is still out, palm up, and it is closing on nothing — fingers half curled, empty, the exact centre of the image. Her face is still beautiful and almost still, but the violet irises have gone wide, the blue veins in them burning brighter, and the mouth has tightened by one degree, the first anger she has felt in centuries. Behind her the vast fractured-mirror wings are shattering outward in slow motion, hundreds of glass shards flying, every reflected face frozen mid-cry — and the largest shards have already landed on the marble and are standing up as figures of glass and light, a dozen of the dead forming a ring. The hooded player stands in the foreground with their back to the viewer, hood down, drawing a weapon from their back, boots planted on wet marble among crushed lilies. The gold light is gone; the sky is cold white and steel-blue; the violet stone at her chest is the one saturated colour in the frame and its veins are glowing. Painterly realism, cinematic boss-fight key art. No nudity, no halo, no feathers, no text.

> **MERGE.** Illyria and the hooded player stand chest to chest at the centre of the marble platform, seen from the side. Two spheres of light — soft white from the player's chest, blinding platinum from hers — have met between them and are fusing into a single sun-bright core. From where they touch, both bodies are turning into the same substance: fractured mirror-glass and light climbing up her from the waist and up the player from the shoulders, edges dissolving into each other so it is no longer clear where one ends. Behind and above them a colossal being of glass, light and hundreds of faces is rising out of the fusion, with wings more like a shattered cathedral window than wings, beautiful and terrible in equal measure. The violet stone hangs at the exact centre of the fusion, the one solid thing in the frame, its blue veins burning white. Runes in the marble platform are lit for the first time; the ivy and lilies around the edge glow with the same light. The sky has stopped halfway through dawn, half gold and half black. Painterly realism, cinematic key art, extreme detail on glass and light. No nudity, no gore, no halo, no feathers, no text.`,
  },

  // ----------------------------------------------------------- CHARACTERS
  {
    key: "characters-her-name",
    facet: "characters",
    body: `### Her name, and why it holds

The owner built the name deliberately. His notes call it a lethal balance — luminous and noble on the surface, serpentine underneath — and that is exactly the shape canon left for her. Point by point, read against the world:

- **The sound is the camouflage.** Soft double *l*, the lyrical *-ria*: it sounds like something you would trust in the light. In Martino that is not a flourish; it is a weapon. [[ilse-vetch]]'s testimony — the founding claim of [[the-radiant-path]] — is that between the falling and the platform there is a light with no source and no edge, and *you are not alone in it*. Nobody has ever said who else is in there. When a Path preacher finally puts a name to the presence in the light, it will be a name that sounds like this one. She will have let them find it.
- **The grit under the vowel.** The *Ill-* is the tell. She never sounds fragile; she sounds sovereign, and cold. That is the register of a being who sequences every queue on the peninsula — the keeper's law from [[reclamation]] (*whoever sequences the hold decides who lives*) raised to the scale of the whole world, held by someone who has never once been tired.
- **Illusion, elusive, elysian.** The owner's own reading of the name. In Martino the word that carries all three is **Echo**. She does not merely look like other people; see Refractions, under Systems.
- **"She Who Reflects the First Light."** The owner floats this as her celestial title, and it lands squarely on two open questions canon has kept for years: *who built the first Forges* ([[the-soul-forge]]) and *what is the light* (the Path). If the first Forge was a mirror held up to the light so that what fell into it could be caught and returned, then the one who held it is the First Reflection — and mirrors, as the owner says, do not only reflect. They distort, they conceal, and they show the viewer what the viewer wants to see. Humanity has been operating mirrors it did not make, and thinking they were doors.
- **A crown she designed for herself.** Other names in this world are given — by a Forge ledger, a Court, a union card. Hers is the one name on the peninsula nobody assigned. That is the usurper's mark the owner's notes describe, and it is why the orthodox will hate the name more than they hate her.`,
  },
  {
    key: "characters-the-one-echo",
    facet: "characters",
    body: `### The one Echo she cannot have (owner ruling, 2026-09-09)

> Illyria is so interested in the Player because the Player is the only one she has ever known to have an Echo that she cannot have. It finds her curious, and for someone who can claim all Echoes she is a little upset that she cannot have this one.

**Every Echo on the peninsula is hers, eventually.** She sequences every Forge. Every register that dies comes to her. Every do-not-reconstruct a person files by their own hand is a gift, and she accepts gifts. She has never once been refused by the dead, because the dead cannot refuse the light; they can only be *interrupted* by a machine, and she owns the machines. In all the centuries she has kept the other side of the mirror, no Echo has ever failed to come to her hand when she reached for it.

**Then the player died for the first time.** The Forge reached into the light for the Echo — and she could not close her hand on it. It was not that the Echo fought. It was not *there* the way the others are there. So the machine did the only thing left to it: instead of holding the player as it holds everyone else, it built them, fast, out of whatever the reserve had. [[reclamation]] records exactly this — the player is the one exception a Forge builds underbuilt instead of holding, *and nobody has explained why.* Now the card can say what canon could not: **nobody has explained it because she cannot either.** Front of every queue is not grace. It is a hand kept open under the one thing she cannot pick up, so she can watch it fall again.

**What she does not know, and has spent every face she owns trying to learn.** Canon offers the candidates; the owner has not chosen:
- [[nag]]. The watch's own sheet wonders whether the reason a Forge builds one person underbuilt is sitting on that person's wrist, and canon holds that NAG is something ancient that Amanda's gift woke. If the watch is what keeps the Echo out of her hand, she has been walking beside the one instrument on the peninsula she cannot see through.
- **A prior gift.** [[the-three-origins-of-magic]]: an Echo given freely consumes no one and cannot be taken. If the player's Echo is already *given* — to a person, a promise, a debt made before the campaign opens — then it is not hers to take because it is already somebody else's to keep. She would find that unbearable and fascinating in equal measure.
- **The player has never been in the Light.** [[ilse-vetch]] says *you are not alone in it.* Every one of the reclaimed was in the Light with her, whether they remember or not. The player wakes on the platform with no light behind them. If the player's deaths do not pass through her at all, then she has never met the player the way she has met everybody else, and the faces she wears beside them on the road are the closest she has ever come.

**What she feels, in the register the light law demands.** Curiosity first: the first new thing in a very long life, and she is a creature that learned patience because nothing had ever surprised her. Then the small fury, kept perfectly still: she who holds every Echo is missing one, and it is the one the machine keeps handing back to her without a grip. She has never been told no by the dead. The player is a no she cannot argue with, and she does not know who said it. Write it as a crack in the calm and never as rage — a queen who has found one coin in the treasury she cannot pick up and cannot say why. Nothing in her face changes. Everything in the wings does.

**Why the whole campaign is a courtship.** The only way the one Echo she cannot take becomes hers is if the player gives it. So she does what she taught the Sextons to do without their knowing who taught them: she sits with the player in the first hour, wearing the dead, and asks nothing. Asking would be the tell. She helps, she guides, she pops up once in a while — every kindness on the road is a hand held out, palm up, waiting. The player is not chosen. The player is the one thing the god of this world cannot pick up, and has been living at the front of the line because of it.`,
  },
  {
    key: "characters-five-names-1",
    facet: "characters",
    body: `### Five names for one woman, part one (owner ruling, 2026-09-09)

> We can use all of these. They are the names of something each faith or faction calls her without actually knowing it is Illyria herself. They can have lore and stories about the epithets, but never draw the solid line to Illyria herself.

Each of the five is a real thing inside its group — a word with a history, stories, a rule about when it is said — and not one of the five groups knows the other four are talking about the same woman. **The solid line exists only on this card.** No faction sheet, no Sexton, no cultist, no board may ever join a name to her. When the room writes any of these into its faction's canon, it writes the folklore and stops.

**The Many-Faced — the Ashen Court's discrepancy.** The Court prices wars. It keeps accounts of the dead it expects to claim through a rift, and for as long as the Court has kept books there has been a line the envoys do not like to read aloud: dead that should have risen for the Court climb out of the broken ground *already claimed*. [[the-risen]] answer to nobody the Court can name. The demon nobility's word for that column is **the Many-Faced**, and the story under it is old: a rift opened under a battlefield where three of the Court's own envoys had died, and what came up out of the crater wore their three faces, and bowed, and walked away in three directions. Court etiquette since then forbids the name at any table laid with mirrors. The Court reroutes around certain places — canon says the places belong to the Hunger; the envoys believe they are stepping around the Many-Faced, and would be insulted to hear the two names put together. Displaced nobility watching a burning estate is [[the-ashen-court]]'s whole posture on the Drain; the Many-Faced is the tenant they cannot evict and have never once seen.

**The First Reflection — the Congregation's one unspoken line.** The Sexton's office is not asking where the dead are between the falling and the platform. In the oldest platform ledgers, the ones that predate the Sextons having a name, there is a marginal gloss in the first keeper's hand that every Sexton is shown once, at ordination, and never again: *the platform is a mirror; the First Reflection keeps the other side.* [[the-congregation-of-the-bound]]'s doctrine is that this is not a name. It is a description of the machine — a platform is polished, a body forms on it, of course something is reflected. The story the Sextons do not tell is that the first keeper, sitting the first hour with the first reclaimed, looked down into the platform's polish and saw a face looking back that was not the reclaimed's and was not the keeper's, and wrote the gloss, and closed the ledger, and that the not-asking began that night and has not stopped. [[the-sexton-of-heartland]] has an altar that talks back ([[brother-aster]]) and has never put the question to it. That is the office.

**The Sovereign Light — what the Radiant Path says with love.** [[ilse-vetch]]'s testimony has five words in it the four articles never quote: *you are not alone in it.* Among the Radiant — the rung that claims to remember — there is a fifth article, unwritten, passed only in the Remembering: someone is in the Light with you, and she is kind. [[the-radiant-path]] calls her **the Sovereign Light**: sovereign because the Light is hers and not the machine's, because the Forge is a landlord and she is the owner who has never charged anyone rent. The Remembering ends with a question the Unlit are not allowed to hear asked — *was anyone there?* — and the Returned who say yes describe a woman, and no two of them describe the same one: different hair, different age, a foreman's widow, a girl from the waterfront, an old woman with a lantern. The Path takes the differences as proof. She meets each of the dead as that one needs to be met. It is the tenderest doctrine on the peninsula, and the only one of the five names said out loud with joy — funded, without the Path knowing, by the [[crimson-choir]], which is the second thing the Path does not know about who its friends are.`,
  },
  {
    key: "characters-five-names-2",
    facet: "characters",
    body: `### Five names for one woman, part two

**False-Wing — the Floating City Council's unlicensed anomaly.** The Council charges gods rent and licenses every faith but one. It also keeps one thing it will not license and cannot name in a minute: the city holds altitude it cannot afford. The ballast engineers' lift arithmetic has a discrepancy — the city floats on more than the Council funds, maintains, or understands — and the engineers' private word for the surplus is **the false wing**: the second wing nobody built. The engineers who have seen the projections started attending church; the councillor whose family seat predates the current altitude keeps a sealed room and a ledger of what the room cost; the spymaster carries the same discrepancy as a budget line and watches the ground for whoever is going to present the bill. In the ground-born districts the word has turned to folklore the ordinances cannot reach: *the city flies on a stolen wing, and one day the owner comes for it.* Said at altitude, False-Wing is an insult — the name of a fraud the city is committing on itself. She rules the city. [[floating-city-council]] believes it does. The Council is the only one of the five that is afraid of the right thing.

**The Pale Dawn — what the Hunger's cults are waiting for.** The cult accountant keeps the feeding calendar like a shipping schedule, and the calendar was inherited, and its last entry is not a feeding. It is a date that recurs, is never reached, and moves: **the Pale Dawn**. The coastal village that throws one net's catch back every morning at first light no longer remembers being told to; the telling, three great-grandmothers ago, was *for the pale dawn*. [[the-old-hunger]]'s cults' most disquieting claim — that the Hunger grows less patient as the world drains, that the reserves are not vanishing but *going somewhere* — ends in the Pale Dawn: the morning the Hunger has been fed enough to rise, when the light on the water at first light will not be the sun but the thing beneath coming up into it. They are right about the light. They are wrong about the direction. She is not coming up from under the strait. She has been above them, in the sky over the lake, the whole time, and the dawn the cults throw their catch to is the one thing on the peninsula that has never needed feeding.

**The rule, once more.** Five groups, five names, five true stories, and not one of them knows the woman. The owner confirmed all five on 2026-09-09 and asked that they live here, on her card. Canon may carry every word of both parts into the faction sheets as folklore when he sends it. The sentence that makes them one person is written here and nowhere else, until the owner writes the scene where somebody finally says all five names in one breath and understands.`,
  },
  {
    key: "characters-how-she-looks",
    facet: "characters",
    body: `### How she looks — the key art brief (owner's direction, 2026-09-09)

The owner's direction: incredibly beautiful, radiant, very sexy, very skimpy armour — she shapeshifts, so she does not wear much. **Golden hair** (changed from black after the first render). **Violet irises with fine blue veins, faintly illuminated, like stormglass.** Olive skin. A figure any man looking at her would want. **Key art is in** — the owner accepted a render and it sits in this card's art slot (private/codex-art/threads/the-angel-of-the-forges.png): the marble city in living flowers and ivy, the drowned island green under the sea, the mirror wings full of faces. The art must never appear on a board or beside any character who might be one of her faces. The prompt is kept here so the art has one source:

> **Illyria, the Angel of the Forges — key art, single figure, full body, portrait orientation.** A woman of impossible, radiant beauty standing at the edge of a floating city at the hour before dawn, the sea far below her and the lights of a drowned island still glowing under the water. She is the most desirable thing in the frame and she knows it. Olive skin with a warm, lit-from-within glow, as if a light with no source is standing just behind her. Long, heavy golden hair, loose, moving in a wind that touches nothing else. Eyes with deep violet irises, threaded with fine blue veins that glow faintly like stormglass — not bright, just wrong in a way you notice second — held on the viewer with total calm and faint amusement.
>
> Her figure is flawless and frankly sensual: full, perfect breasts; a narrow waist; wide hips and a round, high, perfect ass; long, strong, bare legs. She wears almost nothing and it is armour anyway: a few plates of pale platinum-white metal, mirror-polished so they reflect the viewer, placed only where they draw the eye — a breastplate cut in a deep, plunging V that opens to the sternum, so the collarbones, the centre of her chest and the full upper curve of her décolletage are bare skin framed by metal; a hip-guard that is more chain than plate; one greave on one leg; one gauntlet. Fine chains of white metal cross her bare skin between the plates. Every reflective surface on her shows something slightly different from what is actually in front of her.
>
> **The necklace is the focal point of the whole upper body.** Resting on the bare skin at the centre of her chest, in the open V of the breastplate, is a single stone on a fine white-metal chain: a deep, mesmerising violet, the exact violet of her irises, threaded with the same faintly glowing blue veins, cut so that it holds light rather than throwing it. The eye should go to her eyes, then down to the stone, and understand they are the same colour. Nothing else on her is violet.
>
> Her wings are the tell: vast, and made of fractured mirror-glass rather than feathers, each shard reflecting a different face — dozens of faces, men and women, old and young, some of them peaceful, some mid-scream — the dead she wears. From a distance the wings read as white light. Up close they read as a crowd.
>
> Expression: warm, patient, a little tender, the way you would look at someone you are about to help and have already decided how it ends. Nothing in her face is cruel. Everything in the wings is.
>
> Palette: platinum white, warm olive and gold skin, deep golden hair, deep violet iris and stone veined with faintly lit stormglass blue, cold pre-dawn blue behind her, the sick green-gold of the drowned island's lights below. Painterly realism, cinematic key-art lighting, extreme detail on skin, metal and glass. She is meant to be wanted and she is meant to be feared, for the same reason. No nudity: the plates and chains cover what they must and not one inch more. No halo, no feathers, no text.`,
  },

  // -------------------------------------------------------------- SYSTEMS
  {
    key: "systems-refractions",
    facet: "systems",
    body: `### Refractions: how her shapeshifting works (owner ruling, 2026-09-09: yes)

The owner's notes framed her shifts as *Refractions* — she is not imitating someone, she is absorbing their authority. The room took it one step further using Martino's own rules, and the owner said yes:

**Every face she wears is a real person's Echo that she holds.** Every register of every Forge that was destroyed or ran dry went to her; those are the dead who never came back. When she needs to walk beside the player as a ferryman, a healer, a hunter met twice on a road, she is not making a mask — she is *wearing one of the dead*, complete: their memory, their manner, the way they held a cup. Her guises are [[the-risen]] done properly, and that is why she can pass as anyone and why nobody who knew the original ever quite believes they are looking at a stranger. Some of the faces she wears may be people the player has buried.

**As a fight mechanic.** She has as many bodies as she holds Echoes. Every reclamation the player refuses on the road — every do-not-reconstruct honoured, every register the player keeps out of a dying Forge — is a body taken from her. What the player fights at the very end is what is *left* of her: the faces still in the wings. The campaign's choices are the boss's health bar, and nobody knows it until the end.

**As a reveal.** Once a face is hers, every scene that face was in becomes her scene. That is why the faces are the owner's alone to assign and why no board may hint at them until he does.`,
  },
  {
    key: "systems-queue-exception-stone",
    facet: "systems",
    body: `### The queue, the exception, and the violet stone

**The exception, explained.** [[reclamation]] records that where a Forge holds anybody else, it builds the player — underbuilt, out of whatever the reserve has — and nobody has explained why. The mechanism is her: a Forge holds an Echo because she can grip it, and the player's is the one Echo she has never been able to close her hand on. So the machine cannot hold it and does the only thing left, which is build fast and hand it back. The player's front-of-queue privilege is not grace. It is the machine failing at the one grip it cannot make, every single time, and her watching.

**Give is not game over (hard rule, owner, 2026-09-09).** Whatever she gives in return for the Echo, the player must still reclaim at the Forges afterwards. The game goes on after the choice, and the player keeps dying and coming back on the platform exactly as before. The world's reason, so the rule is not a seam: giving her the Echo does not remove it from the player — it changes *who holds it*. Until now the Forge built the player underbuilt because no hand could close on that Echo; now hers can. After Give she is the player's keeper in the most literal sense the setting has — she holds the Echo the way a Forge holds everyone else's, and hands it back every time the player falls. Nothing about reclamation stops working. If anything it works better, and the player will notice, and should wonder what that costs. Whatever else she gives sits on top of this; it never replaces it.

**The violet stone (owner's candidate for what she gives).** She wears one piece of jewellery: a single stone on a fine chain, resting on the bare skin at the centre of her chest, a violet so deep it is hard to look away from — the exact violet of her eyes — threaded, like her eyes, with fine blue veins that glow faintly from inside, the way [[stormglass]] does. The owner's thought is that *this* is the object she trades for the Echo, and it fits the Give rule almost too well: if she is the player's keeper after Give, the stone is *where she keeps them*. The player's Echo goes into her hand and comes back around the player's neck, held in the one thing on the peninsula that is the colour of her. Every reclamation after that runs through the stone; a Forge no longer has to reach for an Echo it cannot grip, because the grip is hanging on the player's chest. It is a gift, a leash, and a wedding ring at once, and it is the only violet thing she owns. What it is called and whether it does anything else — [[essence]] has two grades, one drawn from living things and one from stone, and this is a stone — is the owner's.

**The veins matter more than they look.** [[stormglass]] is the one grade of power on the peninsula that costs nobody their soul — nature-drawn, honest, and weaker for it — and here it is running through the eyes and the stone of the being who owns every soul. Whether that is a mask, a promise, or the truth about what she was before she was this is the owner's to say.`,
  },
  {
    key: "systems-merge-and-hard-mode",
    facet: "systems",
    body: `### Merge, the abomination precedent, and Hard Mode

**The precedent.** [[abominations]] are what a person becomes when [[the-seven-phases-of-corruption]] completes — the phase nobody has been recorded returning from — and the owner's rule for the player crossing that line is a body remade from a small fragment of their own Echo, back at level 1. Merge is that, done on purpose, with her.

**What Merge makes.** The player does not give the Echo and does not keep it: the two Echoes are made one. What comes out is not an abomination of infusion; it is an abomination of the light — a super-abomination carrying two Echoes and every face she ever wore, standing on the platform at level 1 with a fragment of itself and all of her. Name, abilities, what it can and cannot do: the owner's.

**Hard Mode (future implementation).** Merge is the door into it. Nothing below the door is designed; the slot is reserved. What Hard Mode is — the same peninsula with her gone from the queues and nobody at the front of the line; the world as it would be if the Forges had a different keeper; the Risen answering to the player — is the owner's, and no board may guess at it.`,
  },

  // -------------------------------------------------------------- REGIONS
  {
    key: "regions-the-floating-city",
    facet: "regions",
    body: `### The Floating City, and what is really holding it up

**She rules it.** [[the-floating-city]] and [[floating-city-council]] exist as a place and a power; neither has a ruler written. She is the ruler. What the Council is to her — a mask she wears, a priesthood that knows and hates what it serves, or hostages who do not know they are hostages — is unwritten and the owner's.

**The city holds altitude it cannot afford.** The Council's cardinal fear is physics: what floats was made to float by means the Council funds, maintains and no longer fully understands. The ballast engineers' lift arithmetic has a surplus nobody built. That surplus is her. The engineers who have seen the projections attend church; the ground-born districts say the city flies on a stolen wing and one day the owner comes for it. The Council's name for the anomaly is False-Wing (see the five names, under Characters) — and the Council is the only group on the peninsula afraid of the right thing.

**The stage of the last scene.** The end of the campaign is played on a platform at the edge of the city, before dawn: white marble veined with gold, ivy and white lilies growing over the stone so the ground is alive, the sea far below, and the drowned island glowing green-gold under the water. It is the one place in the world where she stands in her own face.`,
  },
  {
    key: "regions-the-drowned-island",
    facet: "regions",
    body: `### The drowned island, and the strait

**Where Ignit's magic went.** [[the-old-hunger]]'s own open questions — *"Is the silhouette beneath Ignit the Hunger itself?"* and *"Where is the island's disappearing magic actually going?"* — are answered in one stroke. Every Echo in Kestrel's Core went to the sea floor and then to her. The lights still glowing under the water in the key art are that register, on its way.

**The shape under the water.** The thing in the strait that Wrackline throws a net back to every morning is her or hers. The coastal village that no longer remembers being told to throw one net's catch back was told, three great-grandmothers ago, to do it for the Pale Dawn.

**Every dead Forge is hers.** [[the-soul-forge]] says a destroyed Forge holds nothing — every Echo in that register is gone from it. True as far as the machine knows. Where they went is her. Every Forge on the peninsula is a mirror she holds up to the light; a broken mirror is not an empty one.`,
  },
];

// ------------------------------------------------------------------ meta

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
  // Filled in main(): the owner's sections above, plus anything members added.
  sections: [] as Array<Record<string, unknown>>,
  // The pictures she is waiting for. Files: private/codex-art/threads/the-angel-of-the-forges-<key>.png
  artSlots: [
    { key: "give", label: "The Give ending — the stone leaves her chest for the player's" },
    { key: "refuse", label: "The Refuse ending — the hand closes on nothing, the wings shatter" },
    { key: "merge", label: "The Merge ending — two Echoes become one abomination of light" },
  ],
  tags: ["end-boss", "illyria", "soul-forge", "angel", "the-light", "the-player-exception", "owner-idea", "the-old-hunger", "the-risen", "shapeshifter", "floating-city", "echo-given-freely", "many-faced", "first-reflection", "sovereign-light", "false-wing", "pale-dawn", "three-endings", "hard-mode", "abomination"],
  openQuestions: [
    "Which characters are her. The shapeshifter faces are the owner's alone to assign; once a face is hers, every scene it stands in is hers. Nothing hints at it on a board until he says which.",
    "Why she cannot hold the player's Echo — NAG on the wrist, a prior gift, or a soul that has never been in the Light. The three candidates are under Characters; the owner picks, and nothing on a board explains it before he does.",
    "The five names (ruled: all five belong to their five groups, none of them knowing). Which faction sheets carry their folklore first, and who on the peninsula is the first to say all five in one breath — that scene is the owner's.",
    "Her celestial title — 'She Who Reflects the First Light' — makes her the maker or holder of the first Forge. Does the owner want her to have built the Forges, or only to have understood them first?",
    "What the Floating City Council is to her — mask, priesthood, or hostages — and whether the city knows what rules it.",
    "The end is ruled (Give / Refuse / Merge, under Story). Still the owner's: what she gives in return for the Echo (candidate: the violet stone); the boss fight's design and what it costs the player; what the merged super-abomination is called and can do; and everything about Hard Mode beyond the fact that Merge opens it.",
    "Old Hunger reconciliation: canon writes it as an appetite orbited by cults, not a person. Is the Hunger what the cults see of her from below, or does the entry gain a line?",
    "The Risen and the Ashen Court: canon leans toward the Court as their maker. Does the Court use her dead, compete for them, or answer to her?",
    "What is she to NAG — the one instrument she cannot see through, or the other half of the same gift?",
    "How 'pops up once in a while' plays without settling Tino's fate or the visions before their arcs spend them.",
    "What the fight costs the player: is the front of the queue revoked, and does the player finish as ordinary as everybody else?",
  ],
};

/** A stable id per owner section, so re-runs update in place instead of piling up. */
function sectionId(key: string) {
  const hex = createHash("sha1").update(`illyria-section:${key}`).digest("hex");
  const variant = ((parseInt(hex[16]!, 16) & 0x3) | 0x8).toString(16);
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-5${hex.slice(13, 16)}-${variant}${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
}

async function main() {
  const actor = await db.user.findFirstOrThrow({ where: { role: "ADMIN", isActive: true }, orderBy: { id: "asc" }, select: { id: true } });
  const owner = await db.user.findUniqueOrThrow({ where: { username: OWNER_USERNAME }, select: { id: true, displayName: true, name: true } });
  const ownerName = owner.displayName ?? owner.name ?? "Tino";
  const schema = metaSchemasByKind.THREAD!;

  for (const slug of [...meta.characters, ...meta.factions, ...meta.locations]) {
    const found = await db.storyEntry.findUnique({ where: { slug }, select: { kind: true } });
    if (!found) throw new Error(`"${slug}" is not in the bible.`);
  }
  for (const section of ownerSections) {
    if (section.body.length > 6000) throw new Error(`section "${section.key}" is ${section.body.length} chars; the sheet allows 6000.`);
  }

  const existing = await db.storyEntry.findUnique({ where: { slug: SLUG }, select: { id: true, kind: true, title: true, summary: true, body: true, meta: true, status: true } });
  if (existing && existing.kind !== "THREAD") throw new Error(`"${SLUG}" exists and is a ${existing.kind}.`);

  // The owner's sections are this script's; anything a member added under a
  // tab is theirs and is carried through untouched, after the owner's.
  const ownerIds = new Set(ownerSections.map((section) => sectionId(section.key)));
  const carried = existing ? (existing.meta as Record<string, unknown>) : {};
  const memberSections = (Array.isArray(carried.sections) ? (carried.sections as Array<Record<string, unknown>>) : []).filter((section) => typeof section.id !== "string" || !ownerIds.has(section.id));
  const next = {
    ...meta,
    sections: [
      ...ownerSections.map((section) => ({ id: sectionId(section.key), facet: section.facet, body: section.body, authorUserId: owner.id, authorName: ownerName, at: RULED_AT })),
      ...memberSections,
    ],
  };
  const parsed = schema.safeParse(next);
  if (!parsed.success) { console.error(JSON.stringify(parsed.error.issues, null, 1)); process.exitCode = 2; return; }

  if (!existing) {
    console.log(`+ THREAD ${SLUG} — ${title} (${ownerSections.length} sections)`);
    if (apply) {
      const created = await db.storyEntry.create({ data: { id: randomUUID(), kind: "THREAD", slug: SLUG, title, summary, body, status: "CANON", createdByUserId: actor.id, meta: next as Prisma.InputJsonValue } });
      await db.storyRevision.create({ data: { id: randomUUID(), entityType: "ENTRY", entityId: created.id, action: "CREATED", actorUserId: actor.id, summary: "Filed the owner's end-boss idea — Illyria, the Angel of the Forges — on the Idea Center at brainstorming." } });
    }
  } else if (existing.title !== title || existing.summary !== summary || existing.body !== body || stableJson(existing.meta) !== stableJson(next)) {
    console.log(`~ THREAD ${SLUG} — ${title} (${ownerSections.length} owner sections, ${memberSections.length} member sections carried)`);
    if (apply) {
      await db.storyEntry.update({ where: { id: existing.id }, data: { title, summary, body, meta: next as Prisma.InputJsonValue, updatedByUserId: actor.id, version: { increment: 1 } } });
      await db.storyRevision.create({ data: { id: randomUUID(), entityType: "ENTRY", entityId: existing.id, action: "UPDATED", actorUserId: actor.id, summary: "Filed the card under its tabs: a short overview, and the rest under Story, Characters, Systems and Regions as the owner's sections." } });
    }
  } else {
    console.log(`= THREAD ${SLUG} already current`);
  }
  console.log(apply ? "APPLIED" : "PREVIEW — re-run with --apply to write it.");
}

main().then(() => db.$disconnect(), (error) => { console.error(error); return db.$disconnect().then(() => process.exit(2)); });
