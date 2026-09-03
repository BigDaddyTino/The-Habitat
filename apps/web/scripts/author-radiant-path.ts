import "../lib/environment";
import { randomUUID } from "node:crypto";
import { getPrismaClient, type Prisma } from "@habitat/db/client";
import { metaSchemasByKind } from "../lib/story-meta-schemas";
import { stableJson } from "./lib/story-authoring";

/**
 * The Radiant Path, the Nation-State of Arcadia, and the ground between them.
 *
 * Plan: Docs/codex/RADIANT_PATH_INTEGRATION.md — sections 1 to 37, and the
 * three owner rulings taken with "sounds good get to it":
 *
 *   1. The scar ruling is YES. `what-the-forge-rebuilds` is written, and
 *      everything that leans on it (Kane's face, the chrome scene, the Path's
 *      doctrine of the unwitnessed) leans on a real rule rather than a hope.
 *   2. Ryan's monster is extended by APPENDING, never by editing his prose.
 *      The Dam arrives under a marked layer with his own sentence quoted back
 *      at him, and a word-level loss check refuses the write if a single one
 *      of his content words would be dropped.
 *   3. Contributor originals are preserved verbatim elsewhere (the
 *      StoryEntryContribution table), which is what makes it safe for this
 *      script to replace `the-radiant-path`'s body outright.
 *
 * What this script does NOT do: characters (author-peninsula-cast.ts) and the
 * arc (author-lamplight-road.ts). Entries first, because a StoryLine speaker
 * has to be a CHARACTER in the bible before a node can name it.
 *
 *   pnpm --filter @habitat/web exec tsx scripts/author-radiant-path.ts
 *   pnpm --filter @habitat/web exec tsx scripts/author-radiant-path.ts --apply
 */

const db = getPrismaClient();
const apply = process.argv.includes("--apply");

// ---------------------------------------------------------------- meta shapes

/** Every region sheet key, so a partial never fails required-but-nullable. */
const region = (fields: Partial<Record<string, unknown>>) => ({
  type: null, settlementTier: null, parent: null, biome: null, control: [],
  population: null, connections: [], status: null, veilAnchorTier: null,
  soulForge: null, gameTag: null, openQuestions: [], ...fields,
});

const faction = (fields: Partial<Record<string, unknown>>) => ({
  scope: null, parent: null, power: null, seat: null, faith: null, leaders: [],
  relations: [], goals: [], gameTag: null, openQuestions: [], independent: false, ...fields,
});

const creature = (fields: Partial<Record<string, unknown>>) => ({
  category: null, parent: null, biomes: [], threat: null, harvest: null,
  gameId: null, openQuestions: [], ...fields,
});

const item = (fields: Partial<Record<string, unknown>>) => ({
  category: null, rarity: null, origin: null, gameId: null, openQuestions: [], ...fields,
});

// ------------------------------------------------------------------- the body

const arcadiaBody = `The **Nation-State of Arcadia** is the only human nation on the peninsula, and the whole country is [[port-arcadia]] with a wall around it.

It is a plutocracy and does not apologise for being one. Electability rests on three measures — military service, wealth, and demonstrated ability to survive — and the enfranchised are, in practice, [[upper-westside]] and almost nowhere else. Citizenship is earned by service on a Foreign-Legion model, takes years, and does not carry the franchise even then. What the [[census-office]] grants a newcomer is permission to be present, and permission can be revoked.

## Three arms and a floor

The [[arcadian-soverign-guard]] is the military, and its elite squads are commissioned abroad as premier operators — a city-state too small to project force projects competence instead and gets paid in leverage. [[arcadian-special-intelligence-service]] is the intelligence arm, sited deliberately opposite [[embassy-row]] so that its guests can see the windows. The [[chancellory-of-arcadia]] is the government, where the representatives sit and [[abraham-islay-kane]] holds an ultimate veto on everything they decide.

And the floor. The sole formal check on the Chancellor is that the representatives reach absolute unanimity and then authorise a duel in which one of their own number risks death. It is maintained, swept, unused, and treated by the architecture with more ceremony than the debating chamber beside it. **A class that governs because it is willing to die is a class that can ask others to.**

## Foreign policy is a queue

Arcadia permits no foreign bases and no armed presences — only accredited ones, on [[embassy-row]], under terms that require a faction to align ideologically with the Nation-State. ASIS watches every one of them from across the street and considers open surveillance the more honest option, which the professionals mostly agree with.

What the city will not accredit is the most informative document it produces.

## Where they stand on the Drain

Arcadia was the first nation to publicly condemn the use of humans as a source of [[essence]] — a position that is genuinely held and extremely convenient at once, and canon does not resolve which weighs more. The state's own answer, if you can get it from the Chancellor in person, is that both are true and that anybody who tells you only one of them is selling something.

The Drain, to Arcadia, is a supply problem with a moral answer already attached. The city has never once had to choose between the two, because it exports soldiers rather than harvest — and a reputation for principle is worth money in a world where everybody else is compromised.`;

const pathBody = `Nobody founded the Radiant Path. [[ilse-vetch]] came back on a foreman's account and would not stop talking, and by the time anyone thought to stop her there were four hundred people in [[the-southside]] who had heard her say it out loud: **there is no dark.**

## The Testimony

She died on the waterfront when a crane sling parted, and she was reclaimed because an inquest cost more than a reclamation. She came back on somebody else's money for somebody else's reasons, and the Sexton who sat with her asked her nothing, because [[the-congregation-of-the-bound]] asks nothing — the not-asking is the office.

Vetch answered anyway.

Between the falling and the platform, she says, there is a light with no source and no edge. You are in it. You are not alone in it. It wants nothing from you. And then a machine in a room you did not pay for reaches in, takes you out of it, and hands you back your debts.

[[the-forgefaith]]'s whispered heresy is the question of where the dead ARE between the falling and the platform, and the faith's whole discipline is not asking. **The Path asked, and then answered, and that is the entire quarrel.**

## The four articles

1. **You were in the Light.** Everyone the machine has ever brought back has been. That you do not remember is not evidence it did not happen. *The forgetting is the injury.*
2. **The Forge does not save. It interrupts.** It is a machine, and machines are owned.
3. **They charge you rent on your own soul.** Thirty-five [[essence]] to build a body, and eleven point seven for every level of the person who used to live in it — and [[reclamation]] is priced, queued, and recorded in a ledger that says who was worth it.
4. **What was taken in common must be held in common.** Seize the means of resurrection.

The first two are theology and the last two are politics, and the Path has never once treated them as separate things. A hierarchy that owns the door out of the Light is spiritually illegitimate *and* materially the enemy, and the movement's real genius is that it never has to choose which argument it is making.

## The rite, and the ladder

**The Remembering.** A convert is walked back through their own reclamation by somebody who has been through more of them. It is not a metaphor and the Path counts.

| rung | who |
| --- | --- |
| **The Unlit** | Never died. Fed, welcomed, and told plainly that the truth is not theirs yet. |
| **The Witnessed** | Reclaimed once. |
| **The Returned** | Reclaimed three times or more. |
| **The Radiant** | The leadership. The ones who claim to remember. |

Standing rises with reclamations. In a settlement where every passage draws a reserve that everybody shares, **the Path has made dying an act of devotion** — and its own ladder, read backwards, is a damage report. [[reclamation]] pays a short reserve out of the person, so the most devout people in the Southside are the most diminished people in it, and they experience that as humility.

Nobody inside the movement reads the ledger. One man did, which is why he left the Congregation to join them, and he has never told them what it says.

## What it wants from Arcadia

Not the barricade. **The queue.**

The Path files at the accreditation hall on [[embassy-row]], is refused, and files again. What it asks for is recognition, protection, ground, and the right to keep its own doctrine, its own loyalties and its own standards of purity **without subordinating any of them to the city**. It does not want to leave [[the-nation-state-of-arcadia]]. It wants to be inside it, safely, entirely, and on its own terms.

Arcadia's terms are the opposite of all four: citizenship earned by service, the primacy of Arcadian identity above every other, the restrained public temper the gentility calls composure, and the acceptance of stewardship by the people with the money. The Path treats each of those as a wall built specifically against it, calls the refusal what it plainly looks like from underneath, and reads every concession as the floor the next demand stands on.

And it frames none of that as rejecting the city. It frames it as fidelity — to Vetch, to the Light, and to the people the Forge halls priced and refused. **Which is the hardest part of arguing with them: they are not lying about that.**

## How it argues

By feeling first. Resentment that is entirely earned, belonging that is genuinely offered, and the specific dignity of being told that the worst thing that ever happened to you was holy.

Then by procedure. Admit nothing. Deny every substantive charge. Counter-accuse in the same breath. Criticism of the Path's demands, of its parallel loyalties, or of its doctrine is named for what the Path insists it is — hatred of the pure, and the Southside has a shorter word for it — and the naming does three things at once. It ends the debate, it establishes who was wronged, and it makes the next demand a matter of decency rather than politics.

It works because it is *sometimes true*. Arcadia does mistrust non-Arcadians as a civic habit; the Southside does send its children to other people's wars; the charge is not manufactured, it is aimed. And there is no answer to it from a podium that does not sound exactly like what a plutocracy would say.

## The unwitnessed

The Forge never records chrome ([[what-the-forge-rebuilds]]), so a reclaimed body comes back without it. The Path reads that as the machine's own testimony: the augmented cannot be witnessed in the Light. They come back incomplete, or they never went at all.

The Southside is full of cheap chrome. **A movement of the excluded that excludes**, whose loud heresy is the [[cybernetic-ascendancy]] — which puts it on the same side of one argument as the church it hates.

## Who is in it

[[ilse-vetch]], who believes every word and has died once. [[corrin-ade]], who kept a platform ledger for eleven years and reads. [[ivo-crane]], who has died eleven times and arms the Unlit. [[wren-salloway]], the almoner, who arranges the binding, settles the account and asks nothing on the day.

Three of those four are the movement. The fourth is the [[crimson-choir]].

## Where the money comes from

Free binding for the unbound, paid on Choir credit.

The movement preaching that the rich charge you rent on your own soul is financed by the one power that lends against souls and always collects. The Choir does not want Arcadia overthrown. [[choir-ledger-page]] already exists in canon, naming a debt and its collateral, and a faith that drives people to die more often and pays for their reclamations on credit is a machine for manufacturing debtors. **The collateral is the convert.**

Most of the Path does not know. Ade does. Vetch does not, and the distance between those two facts is the whole of the Peninsula act.

The Path also inherits the Choir's best protection. Four powers each confidently misfile the Choir and all four are wrong; the Path is misfiled the same way — sedition to Arcadia, heresy to the Congregation, a public-order problem to the Directorate, and an asset to the people paying for it.

## Where they stand on the Drain

The Path is the only faction on the peninsula that thinks the Drain is a distribution problem.

Magic is not running out, they say. It is being *held*. There is enough Essence in the world to bring back everyone who was ever taken out of the Light, and the reason there is not enough is that the people who own the Forges decided who was worth it and wrote it down. Ask them about the harvest and they will tell you, correctly, that Arcadia condemned it first and buys the product anyway. Ask them what the Southside's reserve looks like after a winter of devotion, and they will tell you that is exactly the kind of question the enfranchised ask.

They are right about the ledger. They are wrong about the arithmetic. **Nobody woke up evil, and this is what that law looks like aimed at the people with the least.**`;

const forgeRuleBody = `[[reclamation]] resolves "into skeleton, then muscle, then vessels, then skin" — a body built new, from a pattern, in a room. This rule says what is in the pattern and what is not.

**The Echo knows the body. It does not know the history.** Acquired damage and acquired additions are not rebuilt: scars, burns, amputations, brands, tattoos, worn joints, and chrome. [[the-forgefaith]] already carries the last of those as doctrine — *the Forge never records chrome* — and this is the rest of that sentence.

**Corruption comes back.** A phase of [[the-seven-phases-of-corruption]] is a state of the person and not damage to the body, which is why nobody has ever climbed out of a phase by dying, and why a party hoping a death will clear a companion's veining is going to be disappointed in a way that costs them the companion.

## What it means where people live

**A scar is a class marker.** In a Forge economy, permanence and repair are the same purchase. [[upper-westside]] faces are smooth. [[the-southside]]'s are not. Nobody in [[port-arcadia]] has ever said this out loud and every Arcadian can read it across a room — which is why [[abraham-islay-kane]], who has kept every mark anything ever put on him, is a political document with a chair.

**Chrome is a debt with a deadline nobody can see.** A rigger who spends three years' wages on a spinal rig owns it until the day he dies, and then does not. He comes back whole, poor, and unable to do the only work he had. The [[cybernetic-ascendancy]] preaches the body as the only vessel and calls a death the machine cannot undo the first honest one; [[the-congregation-of-the-bound]] preaches against nothing else by name. **Both of them are at the platform inside the hour**, and the man they are arguing over is naked and shaking and has not stood up yet.

**And it proves nothing about the powerful.** A smooth face is not evidence of a reclamation, because most people are simply never badly hurt. The evidence runs one way only: **damage that stayed is proof the machine was never used**, and there is no way at all to read the reverse.

For writers: never use this rule to explain a mystery. It is a rule about bodies, not about the between-place, and where the dead are between the falling and the platform stays exactly as unanswered as it was.`;

const lamplighterBody = `The [[arcadian-soverign-guard]]'s expedition register carries it under standing luminous hazards. Every expedition that has come back calls it a Lamplighter: *a thing that puts a light out on a dark road to see who walks toward it.*

**The lure.** Not a glow and not a beam. A soft, cold light that fills a volume of air under the canopy, with no source anywhere inside it and no edge where it stops. It is not bright. It does not flicker. It does not move toward you and it has never needed to.

**What happens in it.** People walk in. Then they stop walking, and stand. By every account that survives they are not frightened — and the accounts are always secondhand, because the ones who can describe it were far enough back to be pulled out on a strap.

One of the two surviving depositions, taken at [[exclusion-area]] quarantine from a woman who was on the strap and not the trail:

> "There is no dark. There is a light with no source and no edge, and you are in it, and you are not alone in it, and it wants nothing from you."

**What it is.** Unknown, and the Guard has stopped funding attempts to find out. Nothing has ever been recovered intact, nothing has ever been imaged with the light in frame, and the register's whole note on the matter is four words long: *do not go closer.*

**Where.** The deep green of [[the-peninsula]], off the trails, after dark, most often near water and most often near ground where something has recently died. Never inside the walls. Not once in [[port-arcadia]]'s entire recorded history.

**For a party.** No fight, unless you start one. A light in the trees, a companion who has stopped answering, and a rope. It is not a boss and it is not a puzzle. It is the reason experienced people in this jungle do not investigate anything beautiful.`;

const platformLedgerBody = `Every chapel [[the-congregation-of-the-bound]] keeps has one, on a table beside the Core. A Sexton writes in it after every [[reclamation]] the hall performs. Name, date, count.

It is not a secret and it was never meant to be evidence. It is a parish record — the thing that lets a Sexton sequence a queue when the Forge is behind, and the reason the office is named the way it is: a sexton keeps the graveyard, and the Bound's graveyard is a platform.

**What it becomes when somebody else reads it.**

- **A list of suspects.** [[the-radiant-path]]'s standing rises with reclamations, so its leadership is by construction the top of somebody's ledger. A movement whose holiest rite files a report on you.
- **A damage report.** A short reserve is paid out of the person, so the count is also how much of them is gone.
- **An absence.** [[abraham-islay-kane]] appears in no platform ledger on the peninsula, and there is only one way to read that.

**What it opens.** Laid beside [[choir-ledger-page]] it ends an argument: one book naming who was worth bringing back, one page naming who owes for it. Neither is a weapon. They are paper, which is worse.

**Who wants it.** [[arcadian-special-intelligence-service]], which has asked politely twice. The Path, which does not know it needs it. And the Sexton who keeps it, who will not hand it to anyone, and who has never once been asked what she would do if it were taken.`;

const greenBody = `Everything on [[the-peninsula]] that is not the city.

The green begins at the treeline past [[exclusion-area]] and does not stop again until the Riverlands. Arcadia's writ ends at the first trees and the city is honest about it: the gate excludes in both directions, the register records who went out, and the officer on duty decides how long coming back takes.

**It is not old growth. It is regrowth.** The peninsula was hunted clean during the Great Purges two thousand years ago, and its everyday emptiness of magic is inherited rather than natural — a crime scene old enough to look like geography. What stands here now grew over that, and it grew fast, and in places it grew in shapes that are not explained.

**What lives in it.** The [[arcadian-devil]], which is the richest source of Essence on the peninsula and the reason anybody goes in at all. [[the-lamplighter]], which the Guard files under hazards because the register has no other column. And most of what the Guard has never written down, because ninety-five percent of what lives out here wants people dead and the ones who find out the rest do not usually file.

**What crosses it.** One road, more or less, running inland from [[the-lower-gate]] through [[lamplight]] to [[the-last-water]] and out toward Heartland. [[aegis-extraction-consortium]] runs catcher wagons on it. [[stormglass-cartel]] runs freight. [[the-radiant-path]] walks it, because the Path buries in the green what it could not afford to keep in the city.

**For a party.** The whole middle of the Peninsula act. It is lethal, it is unpoliced, and it is the only way to anywhere.`;

// ------------------------------------------------------------------- the seeds

type Seed = {
  kind: "FACTION" | "REGION" | "CREATURE" | "ITEM" | "RULE";
  slug: string;
  title: string;
  summary: string;
  body: string;
  meta: unknown;
};

const entrySeeds: Seed[] = [
  {
    kind: "FACTION",
    slug: "the-nation-state-of-arcadia",
    title: "The Nation-State of Arcadia",
    summary:
      "The peninsula's only human nation: a plutocratic city-state that elects on service, wealth and survival, exports the best soldiers on the coast, and was the first power to condemn burning people for fuel.",
    body: arcadiaBody,
    meta: faction({
      scope: "The peninsula's only human nation: seven districts behind one wall.",
      seat: "port-arcadia",
      leaders: ["abraham-islay-kane"],
      independent: true,
      gameTag: "KM · Institution (city-state)",
      relations: [
        { faction: "the-radiant-path", stance: "enemy", notes: "An unaccreditable movement inside its own walls, preaching that the state rations permanence by wealth — which is true, and is why the charge cannot be answered from a podium." },
        { faction: "the-congregation-of-the-bound", stance: "ally", notes: "Tolerated, stipended and useful. A Sexton in every Forge hall is a record-keeper the state does not have to pay for." },
        { faction: "aegis-extraction-consortium", stance: "client", notes: "Catcher wagons on Arcadian roads and freight through the green. When one burns, the chamber has to price the precedent." },
        { faction: "stormglass-cartel", stance: "client", notes: "Buys Arcadian soldiers by the squad. A great many of the Southside's children are on a Stormglass payroll." },
        { faction: "national-defense-directorate", stance: "rival", notes: "The larger military power, the buyer Arcadia most wants, and the neighbour it least trusts." },
        { faction: "crimson-choir", stance: "unknown", notes: "ASIS holds no file. That is not the same thing as no Choir." },
      ],
      goals: [
        "Still be here in thirty years.",
        "Keep the export of competence worth more than the export of anything else.",
        "Accredit nothing that keeps a loyalty above the city's.",
        "Never let the chamber find out how easily it can reach unanimity.",
      ],
      openQuestions: [
        "Whether the Sovereign Guard, ASIS and the Chancellory should become wing factions in their own right, or stay as ground under this one.",
        "What Arcadia does with an accredited faction that stops aligning after it has been accredited. The case has never come up and everybody knows it will.",
        "Whether using the duelling floor once changes the chamber permanently.",
      ],
    }),
  },
  {
    kind: "FACTION",
    slug: "the-radiant-path",
    title: "The Radiant Path",
    summary:
      "A Forgefaith heresy in the Southside: a militant movement of the unbound and the reclaimed which holds that the dead were in the Light, that the Forge only interrupts it, and that the means of resurrection must be held in common — funded, without knowing it, by the Crimson Choir.",
    body: pathBody,
    meta: faction({
      scope: "A street movement of the Southside, with a camp out in the green.",
      parent: "crimson-choir",
      seat: "the-southside",
      faith: "its own revealed doctrine — a reserved faith of the Arcadia pass",
      leaders: ["ilse-vetch", "corrin-ade", "ivo-crane"],
      independent: false,
      gameTag: "KM · feeds the Crimson Choir (Shadow)",
      relations: [
        { faction: "the-nation-state-of-arcadia", stance: "enemy", notes: "Refused accreditation on Embassy Row, and files again every quarter. The Path does not want to leave the city; it wants to be inside it on its own terms." },
        { faction: "the-congregation-of-the-bound", stance: "rival", notes: "The church it grew inside and broke from. The Congregation's discipline is not asking; the Path asked, and answered, and calls the not-asking cowardice." },
        { faction: "crimson-choir", stance: "client", notes: "Its financier, and the only party in the arrangement that understands the arrangement. Free binding for the unbound, on Choir credit, with the convert as collateral." },
        { faction: "cybernetic-ascendancy", stance: "enemy", notes: "The unwitnessed. The Forge never records chrome, so the Path holds that the augmented were never in the Light — a movement of the excluded that excludes." },
        { faction: "aegis-extraction-consortium", stance: "enemy", notes: "Catcher wagons on the green roads. Ivo Crane burns them, frees the people inside, and kills the drivers." },
        { faction: "arcadian-special-intelligence-service", stance: "enemy", notes: "ASIS wants an informer at Lamplight and is patient about it." },
      ],
      goals: [
        "Accreditation inside Arcadia, with protections, ground, and no subordination of doctrine.",
        "Free binding for every unbound person in the Southside, whatever it costs and whoever pays.",
        "Seize the means of resurrection: Forge halls held in common rather than owned.",
        "Reach Brother Aster at Heartland and put the question to the one witness who was on the far side.",
      ],
      openQuestions: [
        "What the Path does to somebody who tries to leave it. Canon holds that a power which cannot be left is a prison, and the Path has never been tested in writing.",
        "Whether Ilse Vetch ever learns who has been paying for the bindings, and what she does in the hour after.",
        "Where the dead ARE between the falling and the platform. The Path claims. Canon never confirms, and never will.",
      ],
    }),
  },
  {
    kind: "RULE",
    slug: "what-the-forge-rebuilds",
    title: "What the Forge Rebuilds",
    summary:
      "The Forge builds the body the Echo knows, and the Echo does not know what was done to the body afterwards. Scars, chrome and amputations do not come back. Corruption does.",
    body: forgeRuleBody,
    meta: null,
  },
  {
    kind: "CREATURE",
    slug: "the-lamplighter",
    title: "The Lamplighter",
    summary:
      "A canopy ambusher of the deep green that hunts by putting out a light — soft, cold, sourceless, filling the air rather than shining from a point. Nobody has ever imaged it with the light in frame.",
    body: lamplighterBody,
    meta: creature({
      category: "natural",
      parent: "beasts",
      biomes: ["the-peninsula", "the-green"],
      threat: "No engagement anybody has survived to describe. The danger is entirely in walking toward it, and everyone who does is calm while they do it. Countered by a rope, a partner, and a rule about not investigating lights.",
      harvest: "Nothing has ever been recovered.",
      openQuestions: [
        "Whether a Lamplighter is an animal at all. The Guard files it under beasts because the expedition register has no other column.",
        "Why it has never once been seen inside a wall.",
      ],
    }),
  },
  {
    kind: "ITEM",
    slug: "the-platform-ledger",
    title: "The Platform Ledger",
    summary:
      "The Congregation's record of who came back and how many times, kept in every chapel beside the Core — a parish register that is also a list of suspects, a damage report, and one very loud absence.",
    body: platformLedgerBody,
    meta: item({
      category: "Record",
      rarity: "One per chapel, and no two agree on anything but the arithmetic.",
      origin: "Written by whichever Sexton keeps the hall, from the first day the Congregation had a door.",
      openQuestions: [
        "What a Sexton does when a state asks for the ledger in writing rather than politely.",
      ],
    }),
  },
  {
    kind: "REGION",
    slug: "the-green",
    title: "The Green",
    summary:
      "The jungle beyond Arcadia's wall: everything on the peninsula that is not the city. Hunted clean two thousand years ago, and this is what grew back over it.",
    body: greenBody,
    meta: region({
      type: "region",
      parent: "the-peninsula",
      biome: "regrown tropical jungle over Purge-era ground",
      status: "Ungoverned. Arcadia's writ ends at the treeline and nobody else has claimed it.",
      connections: [
        { to: "exclusion-area", by: "the Lower Gate", notes: "The only official land door in or out of Arcadia, and the only one with a register." },
        { to: "heartland", by: "the inland road", notes: "More or less a road. The procession walks it; nobody maintains it." },
      ],
      openQuestions: [
        "Whether anything holds ground in the green at all, or whether it is genuinely unclaimed all the way to the Riverlands.",
        "What was penned at the Ash Ground. Permanently open.",
      ],
    }),
  },
];

// ---------------------------------------------------------- the points of interest

type Poi = { slug: string; title: string; summary: string; body: string; meta: unknown };

const pois: Poi[] = [
  {
    slug: "the-lamp-chapel",
    title: "The Lamp Chapel",
    summary: "The Congregation's poorest chapel, on the Southside floor, where a Sexton has sat with four hundred people through their first hour back and told none of them anything.",
    body: `The Forge hall [[the-southside]] can afford: one Core, one platform, one table, and a [[the-platform-ledger]] with more names in it than any chapel in [[upper-westside]] will ever write.

[[imogen-roe]] keeps it, and has for thirty years. She sequences the queue when the Forge is behind, she sits with the reclaimed in the first hour, and she asks nothing, because the not-asking is the office and she has never once broken it.

**[[ilse-vetch]] came back in this room**, on a foreman's account, and Roe was the Sexton on duty. What each of them remembers about that night is the argument the whole district is now having.

**For a party.** Where the Southside's dead come back, where the chrome scene happens ([[what-the-forge-rebuilds]]), and the one place on the peninsula where somebody will tell you plainly that they do not know.`,
    meta: region({ type: "destination", parent: "the-southside", soulForge: "active", status: "Reserve running Thin through winter." }),
  },
  {
    slug: "the-drawn-shutter",
    title: "The Drawn Shutter",
    summary: "A room the Radiant Path meets in, inside a military dampening footprint — no lattice, no suspicion accrued, and everybody there knows exactly why.",
    body: `Arcadia's installations dampen magic and electronics inside their own footprint, and [[suspicion]] does not accrue in a dead zone because there is nothing running in it to read you.

Which is how a movement of the poor came to know the location of every dampening field in the city.

The Drawn Shutter is a back room under one of them: no [[drone-surveillance-bureau]] lattice overhead, no phase-reader that works, no instrument in the building that can say who was here. [[the-radiant-path]] holds a Remembering here most nights. It is warm, it is crowded, and the door is not locked, because a locked door is the only thing in this district that would be worth reporting.

**For a party.** The best recruitment scene in the act, and the safest room in Port Arcadia for anybody carrying something a gate would find.`,
    meta: region({ type: "destination", parent: "the-southside", status: "Inside a dampening footprint. Instruments read nothing here." }),
  },
  {
    slug: "the-quiet-office",
    title: "The Quiet Office",
    summary: "An ASIS room with nothing on the walls, where the file on the Radiant Path is kept and the case for clearing the Southside is made in numbers.",
    body: `On an upper floor of [[arcadian-special-intelligence-service]], facing away from [[embassy-row]] rather than toward it, because this is not the department that does the watching people can see.

Nothing hangs on the walls. There is a table, two chairs, a window with the blind down, and whichever documents the officer has decided you should be looking at when you arrive.

This is where [[the-asis-officer]] keeps the file on [[the-radiant-path]], and where she makes the argument that is harder to answer than anything the Path's enemies say in public: she has read their roll, and she has also read [[the-southside]]'s reserve reports, and she can tell you what devotion costs a district over one winter.

**For a party.** A commission, a request for an informer, and the most reasonable person in the act asking you to do the coldest thing in it.`,
    meta: region({ type: "destination", parent: "arcadian-special-intelligence-service" }),
  },
  {
    slug: "the-accreditation-hall",
    title: "The Accreditation Hall",
    summary: "Where a faction petitions for an accredited presence in Arcadia, and where the Radiant Path is refused every quarter and files again the same afternoon.",
    body: `Arcadia permits no foreign bases, only accredited presences, and every one of them is granted or refused in this room on [[embassy-row]].

The terms are published and short. A faction seeking accreditation must align ideologically with [[the-nation-state-of-arcadia]], must place the city's primacy above any other loyalty, and must accept that ASIS is watching from the building opposite. Most applicants find this reasonable. Most applicants are companies.

[[the-radiant-path]] files here every quarter. It is refused every quarter, on the same clause, by clerks who are unfailingly courteous. It files again the same afternoon, and the refusal and the refiling are both part of the argument: **the queue is the point.** A movement that is turned away in public every three months is a movement with a public grievance every three months, and the Path did not invent that mechanism, it simply understood it first.

**For a party.** Arcadia's whole foreign policy rendered as a counter, a form, and a very polite no.`,
    meta: region({ type: "destination", parent: "embassy-row" }),
  },
  {
    slug: "the-lower-gate",
    title: "The Lower Gate",
    summary: "The checkpoint seen from the jungle's side: the road every refugee, smuggler, convert and expedition actually walks, and the last piece of Arcadian order before the country stops being governed.",
    body: `[[exclusion-area]] from underneath — not the staging yards and the quarantine sheds a citizen sees, but the last hundred metres of made road before the trees, where the queue forms.

Going out is a signature. Coming back is a demonstration, and it takes as long as the officer on duty decides it takes, because an expedition returning from [[the-green]] is presumed contaminated until it proves otherwise and nobody in the line argues.

Three kinds of people wait here. Commissioned parties with paper from the [[peninsula-expeditionary-army]] or from ASIS. [[stormglass-cartel]] freight, which is paid for. And the ones walking out with [[the-radiant-path]], free, no service owed, no questions about what they are.

**Who owns your passage owns you a little.** That is the gate's whole lesson and it teaches it in one line.

**For a party.** The chokepoint that can be closed against them, and the last road sign the campaign gets.`,
    meta: region({
      type: "site", parent: "exclusion-area",
      connections: [{ to: "the-green", by: "the inland road", notes: "Out, and there is only the one." }],
    }),
  },
  {
    slug: "lamplight",
    title: "Lamplight",
    summary: "The Radiant Path's camp in the green: out of the lattice, off the ledger, and built among graves that were already there.",
    body: `A day and a half inland from [[the-lower-gate]], on ground nobody claims, [[the-radiant-path]] keeps a camp.

There is no lattice out here and no register. Nobody asks what you are, nobody reads you at a gate, and there is food, and it is given rather than sold. The Unlit earn their passage on Devil crews, because the [[arcadian-devil]] is the richest source of Essence on the peninsula and the bindings have to be paid for somehow. At dark there is a Remembering.

**The camp did not choose this ground for its beauty.** It came to where the graves already were — [[the-stone-field]] is older than the faith, and the Marker was burying the unbound and [[the-unregistered]] out here long before [[ilse-vetch]] ever fell.

**The player sees the movement at its best here**, and that is the beat's entire job: fed, welcomed, warm, and nobody asking. Everything the arc does afterwards costs more because of this night.

**For a party.** Sleep, a meal, a sermon that is genuinely good, and a friend from the island who is happy for the first time since it fell.`,
    meta: region({
      type: "site", parent: "the-green",
      population: "Two to four hundred, depending on the quarter and the reserve.",
      control: [{ faction: "the-radiant-path", kind: "holds" }],
      connections: [
        { to: "the-lower-gate", by: "the inland road", notes: "A day and a half, and the Path knows the checkpoint's habits." },
        { to: "the-stone-field", by: "a footpath", notes: "Ten minutes. The graves came first." },
      ],
    }),
  },
  {
    slug: "the-stone-field",
    title: "The Stone Field",
    summary: "Three hundred and eleven markers with one word each, out past the wall — the only honest count on the peninsula, and the ground the faith grew around.",
    body: `Rough ground past the treeline, no rows, no plan, and three hundred and eleven markers cut with one word each.

They are [[the-single-name]] — the funeral [[the-unregistered]] keep, and the only one left on the peninsula. The Marker carves them. She is Unregistered herself; she gets one name, and so do they.

**Who is actually buried here.** Not the poor. A short reserve is paid out of the person, not out of their life ([[reclamation]]), so nobody in [[port-arcadia]] dies for want of money — they come back less. The two kinds of people who stay dead are the **unbound**, whose Echo no Forge holds, and the **Unregistered**, whose pattern no Forge can resolve. This field is both, and nothing else.

Which is why [[the-radiant-path]]'s free binding is not a kindness. It is the difference between a platform and a stone.

**The third ledger.** [[the-platform-ledger]] says who came back. [[choir-ledger-page]] says who owes for it. The field says who never came back at all, and it is the only one of the three that cannot be called a forgery, because it is not paper.

**For a party.** A count, an argument that ends arguments, and an hour of work with a chisel that nobody asks them for.`,
    meta: region({
      type: "site", parent: "lamplight",
      status: "Older than the faith that meets in it.",
      openQuestions: ["What is nesting under it, and how long the camp has been feeding it."],
    }),
  },
  {
    slug: "the-ash-ground",
    title: "The Ash Ground",
    summary: "A clearing in the deep green where the canopy grows in rectangles. Nobody explains it. No bones, no marker, no dialogue about it.",
    body: `Two hours off the inland road there is a clearing, and the canopy over it grows in rectangles.

Not a ruin. There is nothing standing, nothing fallen, and nothing under the soil that a shovel finds. What there is, is shape: long straight interruptions in two thousand years of regrowth, at intervals, in a grid, on ground where the peninsula was hunted clean during the Great Purges.

Something was penned here. Nothing says what.

**Writers: this is glimpse discipline and it is absolute.** No bones. No marker. No inscription. No NPC who explains it, no document that mentions it, and no dialogue about it at all. A companion may go quiet, take a different line around it, and decline to say why. That is the entire beat, and on a second playthrough it is the worst thirty seconds in the act.

**For a party.** Nothing happens. That is what happens.`,
    meta: region({
      type: "site", parent: "the-green",
      status: "Regrowth in rectangles. Unexplained, permanently.",
      openQuestions: ["What was penned at the Ash Ground. Never to be answered on the page."],
    }),
  },
  {
    slug: "the-burned-wagon",
    title: "The Burned Wagon",
    summary: "Where Ivo Crane turned a religious argument into a military one: an Aegis catcher wagon on its side, eleven cages open, and two drivers who had names.",
    body: `An [[aegis-extraction-consortium]] catcher wagon, on its side on the inland road, burned to the frame.

Eleven cages were opened. The people in them walked away and most of them are alive. Two drivers did not walk away, and they had names, debts, and a dispatcher who had to write the letters.

[[ivo-crane]] calls it liberation. He is not lying and neither is Aegis, and that is exactly the problem: **the wagon is the moment the Peninsula stops being a question about faith and becomes a question about force.** Arcadia hardens after this. The chamber prices the precedent. The Path's moderates lose the argument to Crane at precisely the point the player most needs them to win it.

**It stays on the map.** Nobody clears it, nobody salvages it, and the procession walks past it later with lamps.

**For a party.** A crime scene with two right answers, and the first place where sympathy for the Path costs something.`,
    meta: region({ type: "site", parent: "the-green", status: "Wreckage. Unrecovered, and it will stay that way." }),
  },
  {
    slug: "the-last-water",
    title: "The Last Water",
    summary: "The procession's final camp before the Riverlands, and where the road's own graves begin.",
    body: `The last reliable water before the ground rises toward Heartland, and therefore the last place several hundred people on foot can stop together.

Walking a crowd through [[the-green]] kills some of the crowd. The Marker walks with the procession, so by the time it reaches the Last Water the road behind it is marked — **you can track a moving faith by its graves** — and a player who runs ahead passes every one the people behind them have not dug yet.

It is also where the lamps get lit for the final leg, several hundred of them, on a jungle road, after dark.

**For a party.** A night camp, a last conversation with whoever is still speaking to them, and the beginning of the walk that arrives at Heartland's gate.`,
    meta: region({
      type: "site", parent: "the-green",
      connections: [{ to: "heartland", by: "the inland road", notes: "Two days, uphill, and the city does not know they are coming." }],
    }),
  },
  {
    slug: "the-quiet-altar",
    title: "The Quiet Altar",
    summary: "Four kilometres off the road: cut stone older than everyone in this story, kept scrupulously clean, where the Radiant Path's free bindings are actually paid for.",
    body: `[[crimson-choir]] cells run from candlelit salon-societies in the great cities to raw jungle altars, and this is one of the altars.

[[wren-salloway]] walks out of [[lamplight]] on the last night of every month. The camp has decided it is a rendezvous with a supply train, and nobody has ever followed her, because she is the most reassuring person any of them has met and there is no reason to.

The stone is older than the Choir. It is cleaned regularly by somebody careful. There is nothing else here.

**Discipline.** Whatever answers at this altar is a glimpse and stays a glimpse, per [[the-old-hunger]]: a silhouette, a calendar, and the fact that certain things route around certain places. It is never named, never statted, and never confirmed to be anything at all. Canon's own note on the Choir's jungle altars is that *some of them now answer to something the Choir did not invite*, and that sentence is the whole of what this place is allowed to say.

**The rhyme.** [[the-quiet-office]] is where Arcadia decides what happens to the Path. This is where the Choir decides what the Path costs. **Two rooms nobody in the movement has ever stood in, where everything about them is settled.**

**For a party.** Optional, findable, and the single worst thing they can learn about the people who fed them.`,
    meta: region({
      type: "site", parent: "the-green",
      status: "Clean. Recently.",
      control: [{ faction: "crimson-choir", kind: "holds" }],
      openQuestions: ["What answers at the altar. Never to be answered on the page."],
    }),
  },
];

// -------------------------------------------------------------- appended layers

/**
 * Marked appends onto prose somebody else wrote.
 *
 * The Arcadian Devil is Ryan's. Its female form is a PROPOSAL, filed under a
 * marker with his own sentence quoted back at him, and the word-loss check
 * below refuses the write outright if a single content word above the marker
 * would be dropped. Same treatment for the Peninsula's owner prose.
 */
const layers = [
  {
    slug: "arcadian-devil",
    marker: "## The Dam — proposed, and not yet the author's",
    text: `*This section is a proposal to the dossier's author and is not canon until he says so. It exists because his own sentence leaves a door open:* **"Males of the species will develop their Fore claws into massive Pincers to dominate territory and rivals."**

Which says what the male does, and leaves the female entirely unwritten.

**She does not fight for territory. She selects it.** A gravid matriarch — a Dam, in the [[arcadian-soverign-guard]]'s expedition register, from the husbandry word for the mother of a brood — grows larger, older, and more heavily sectioned than any male, and grows no pincers at all, because she has never needed to win an argument. She nests where carrion is reliable. On this peninsula, reliable means *where people keep dying in the same place.*

She does not raid a camp. She has never had to come closer than the treeline.

**Why she matters to [[the-green]].** The Devil is the richest source of Essence on the peninsula, so a Dam is the single richest thing in it — enough, taken whole, to bind hundreds of unbound in one night, or to stop a district's Forge reserve going Thin for a winter, or to make somebody permanently wealthy. All three of those are real options and none of them is clean.

**Where one is.** Under [[the-stone-field]], and [[the-radiant-path]] has been feeding her for two years by holding funerals.

**Register.** Full weight. What the fang sheathe does to something already dead; a brood in the dark beneath three hundred and eleven markers; and the sound the field makes at night, which the camp has decided is wind.`,
  },
  {
    slug: "the-peninsula",
    marker: "## The green, and the road inland",
    text: `The inland half of the peninsula is written now, and it is [[the-green]]: regrowth over Purge-era ground, ungoverned, and lethal in a way the city is honest about.

One road crosses it. Out of [[port-arcadia]] through [[exclusion-area]] and [[the-lower-gate]], past [[lamplight]] and [[the-stone-field]], through [[the-ash-ground]] and [[the-last-water]], and up toward [[heartland]] and the Riverlands. [[aegis-extraction-consortium]] runs catcher wagons on it, [[stormglass-cartel]] runs freight, and [[the-radiant-path]] walks it.

Everything still farther inland stays open, on the same terms as before.`,
  },
];

// ----------------------------------------------------------------- control rows

/** Faction control, which lives on the REGION sheet rather than the faction. */
const controlRows: { slug: string; rows: { faction: string; kind: "holds" | "contests" | "influences" }[] }[] = [
  { slug: "port-arcadia", rows: [{ faction: "the-nation-state-of-arcadia", kind: "holds" }] },
  { slug: "the-southside", rows: [{ faction: "the-nation-state-of-arcadia", kind: "holds" }, { faction: "the-radiant-path", kind: "contests" }] },
  { slug: "embassy-row", rows: [{ faction: "the-nation-state-of-arcadia", kind: "holds" }, { faction: "the-radiant-path", kind: "influences" }] },
  { slug: "exclusion-area", rows: [{ faction: "the-nation-state-of-arcadia", kind: "holds" }] },
];

// ------------------------------------------------------------------------- run

const stop = new Set(["the", "a", "an", "and", "or", "of", "to", "in", "is", "it", "that", "this", "as", "for", "on", "by", "with", "its", "not", "are", "be", "at", "from", "which"]);
const contentWords = (text: string) =>
  new Set(text.toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter((word) => word.length > 2 && !stop.has(word)));

async function main() {
  const identity = (await db.$queryRawUnsafe<{ current_database: string }[]>("select current_database()"))[0]?.current_database;
  const actor = await db.user.findFirst({ where: { role: "ADMIN", isActive: true }, orderBy: { id: "asc" }, select: { id: true } });
  if (!actor) throw new Error("Authoring requires an active administrator for revision authorship.");

  const entryChanges: string[] = [];
  const layerChanges: string[] = [];
  const controlChanges: string[] = [];

  const seeds: Seed[] = [
    ...entrySeeds,
    ...pois.map((poi) => ({ kind: "REGION" as const, slug: poi.slug, title: poi.title, summary: poi.summary, body: poi.body, meta: poi.meta })),
  ];

  // 1. Validate every sheet before a single write. A meta object that does not
  //    satisfy its schema is stripped on the next save by the website and then
  //    fails the release audit's METADATA check, days later, in production.
  for (const seed of seeds) {
    const schema = metaSchemasByKind[seed.kind];
    if (!schema) continue;
    const parsed = schema.safeParse(seed.meta);
    if (!parsed.success) throw new Error(`${seed.slug} does not satisfy the ${seed.kind} sheet: ${JSON.stringify(parsed.error.issues.slice(0, 4))}`);
  }

  // 2. The entries.
  for (const seed of seeds) {
    const current = await db.storyEntry.findUnique({ where: { slug: seed.slug }, select: { id: true, kind: true, title: true, summary: true, body: true, meta: true } });
    // A RULE has no sheet, so its meta stays SQL NULL. Passing JSON null would
    // trip the StoryEntry_meta_is_object CHECK, so the column is omitted instead.
    const metaColumn = seed.meta === null ? {} : { meta: seed.meta as unknown as Prisma.InputJsonValue };
    if (!current) {
      entryChanges.push(`create ${seed.kind} ${seed.slug}`);
      if (!apply) continue;
      const created = await db.storyEntry.create({ data: {
        id: randomUUID(), kind: seed.kind, slug: seed.slug, title: seed.title, summary: seed.summary,
        body: seed.body, ...metaColumn, status: "CANON", createdByUserId: actor.id,
      } });
      await db.storyRevision.create({ data: {
        id: randomUUID(), entityType: "ENTRY", entityId: created.id, action: "CREATED", actorUserId: actor.id,
        summary: `Peninsula: filed ${seed.title}`,
      } });
      continue;
    }
    if (current.kind !== seed.kind) throw new Error(`${seed.slug} is a ${current.kind}, not a ${seed.kind}.`);
    const same = current.title === seed.title && current.summary === seed.summary && current.body === seed.body
      && stableJson(current.meta) === stableJson(seed.meta);
    if (same) continue;
    entryChanges.push(`update ${seed.kind} ${seed.slug} (body ${current.body?.length ?? 0} -> ${seed.body.length})`);
    if (!apply) continue;
    await db.storyEntry.update({ where: { id: current.id }, data: {
      title: seed.title, summary: seed.summary, body: seed.body, ...metaColumn,
      version: { increment: 1 }, updatedByUserId: actor.id,
    } });
    await db.storyRevision.create({ data: {
      id: randomUUID(), entityType: "ENTRY", entityId: current.id, action: "UPDATED", actorUserId: actor.id,
      summary: `Peninsula: rewrote ${seed.title}`,
    } });
  }

  // 3. The appended layers, with the word-level loss check on somebody else's prose.
  for (const layer of layers) {
    const entry = await db.storyEntry.findUnique({ where: { slug: layer.slug }, select: { id: true, body: true } });
    if (!entry) { layerChanges.push(`MISSING ${layer.slug}`); continue; }
    const existing = entry.body ?? "";
    const above = existing.includes(layer.marker) ? existing.slice(0, existing.indexOf(layer.marker)).trimEnd() : existing.trimEnd();
    const next = `${above}\n\n${layer.marker}\n\n${layer.text}`;
    if (existing === next) continue;
    const kept = contentWords(next);
    const lost = [...contentWords(above)].filter((word) => !kept.has(word));
    if (lost.length > 0) {
      layerChanges.push(`REFUSED ${layer.slug}: would cost ${lost.length} author words — ${lost.slice(0, 12).join(", ")}`);
      continue;
    }
    layerChanges.push(`${existing.includes(layer.marker) ? "replace" : "append"} layer on ${layer.slug} (0 words lost)`);
    if (!apply) continue;
    await db.storyEntry.update({ where: { id: entry.id }, data: { body: next, version: { increment: 1 }, updatedByUserId: actor.id } });
    await db.storyRevision.create({ data: {
      id: randomUUID(), entityType: "ENTRY", entityId: entry.id, action: "UPDATED", actorUserId: actor.id,
      summary: `Peninsula: appended "${layer.marker.replace(/^#+\s*/, "")}" without touching the prose above it`,
    } });
  }

  // 4. Control rows, and the Peninsula's junk open question.
  for (const target of controlRows) {
    const entry = await db.storyEntry.findUnique({ where: { slug: target.slug }, select: { id: true, meta: true } });
    if (!entry) { controlChanges.push(`MISSING ${target.slug}`); continue; }
    const meta = { ...(entry.meta as Record<string, unknown>), control: target.rows };
    if (stableJson(entry.meta) === stableJson(meta)) continue;
    const parsed = metaSchemasByKind.REGION!.safeParse(meta);
    if (!parsed.success) throw new Error(`${target.slug} control rows break the region sheet: ${JSON.stringify(parsed.error.issues.slice(0, 3))}`);
    controlChanges.push(`${target.slug}: ${target.rows.map((row) => `${row.faction} ${row.kind}`).join(", ")}`);
    if (!apply) continue;
    await db.storyEntry.update({ where: { id: entry.id }, data: { meta: meta as Prisma.InputJsonValue, version: { increment: 1 }, updatedByUserId: actor.id } });
    await db.storyRevision.create({ data: {
      id: randomUUID(), entityType: "ENTRY", entityId: entry.id, action: "UPDATED", actorUserId: actor.id,
      summary: "Peninsula: recorded who holds this ground",
    } });
  }

  const peninsula = await db.storyEntry.findUnique({ where: { slug: "the-peninsula" }, select: { id: true, meta: true } });
  if (peninsula) {
    const meta = { ...(peninsula.meta as Record<string, unknown>), openQuestions: [
      "How far inland the written map should reach before the Riverlands takes over.",
      "What was penned at the Ash Ground. Permanently open.",
    ] };
    if (stableJson(peninsula.meta) !== stableJson(meta)) {
      controlChanges.push("the-peninsula: replaced the placeholder open question \"x\"");
      if (apply) {
        await db.storyEntry.update({ where: { id: peninsula.id }, data: { meta: meta as Prisma.InputJsonValue, version: { increment: 1 }, updatedByUserId: actor.id } });
      }
    }
  }

  console.log(JSON.stringify({
    database: identity,
    mode: apply ? "APPLY" : "PREVIEW",
    entries: entryChanges.length ? entryChanges : ["unchanged"],
    layers: layerChanges.length ? layerChanges : ["unchanged"],
    control: controlChanges.length ? controlChanges : ["unchanged"],
  }, null, 2));
  if (!apply) console.log("\nDry run. Re-run with --apply to write it.");
}

main().catch((error) => { console.error(error); process.exit(1); }).finally(() => db.$disconnect());
