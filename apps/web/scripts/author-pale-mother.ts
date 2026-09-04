import "../lib/environment";
import { randomUUID } from "node:crypto";
import { getPrismaClient, type Prisma } from "@habitat/db/client";
import { BoardWriter, stableJson, type NodeSpec } from "./lib/story-authoring";

/**
 * The Pale Mother — Death Canyon's Mythic, and the Grand Rift's.
 *
 *   pnpm --filter @habitat/web exec tsx scripts/author-pale-mother.ts [--apply]
 *
 * Canon: Docs/codex/GRAND_RIFT_THE_PALE_MOTHER.md. Contributor: Mackenzie
 * Martino, whose words are Appendix A there and are the source for all of it.
 *
 * The design in one line, because everything below depends on it: SHE HAS NO
 * HEALTH BAR, SHE HAS A LID. The bar on screen is the cage, every point of
 * damage is a plate off the thing holding four hundred and eleven children
 * shut, and the game never says so once.
 *
 * Four things land here:
 *
 *  1. THE CANYON — death-canyon rewritten so the arena's three parts are real
 *     prose: the hum, the fourteen vents, and a tally that has never balanced.
 *     Its open question (what makes the light and the gas) stays open.
 *  2. THE MOTHER AND THE BROOD — two CREATURE entries, not one. The swarm has
 *     its own damage rules and its own outcome, and a footnote on her record
 *     is missed by exactly the player who needed to read it.
 *  3. WENNA CRAKE — the beacon keeper at Bonefire Picket, the only person who
 *     has walked out of the canyon in nine years, and the reason the board
 *     says what it says. Her account is the horror; the creature sheet is
 *     only the specification.
 *  4. THE BOUNTY — a CONTRACT posted at bonefire-picket whose three endings
 *     are decided by HOW you killed her, not whether.
 *
 * Rating discipline: Mature 17+ at full weight, per standing owner ruling.
 * Nothing here is softened toward implication.
 */
const db = getPrismaClient();
const apply = process.argv.includes("--apply");

const ARC = "the-pale-mother-bounty";

// ---------------------------------------------------------------------------
// Prose
// ---------------------------------------------------------------------------

const deathCanyonBody = `Death Canyon is the lethal interior of [[grand-rift]], and the first thing anybody tells you about it is wrong.

They will tell you it is dark down there. It is not. The fissures in the floor throw a cold blue-green light up out of the rock — the colour of a lit pool at night — and above that light lies the gas, violet, heavy, obedient to gravity, pooling in the low ground and rolling downhill with a visible surface on it like water. Between the two you can see perfectly well. What you cannot do is see *into* the gas, and the gas is where the floor is.

**Three depths, and every one of them is a different place.** The broken shelves stand clear above the pool line: safe, exposed, and useless, because nothing burns up there. The working depth holds the gas at chest height and is where all the ground is. The deepest fractures are over your head in it, and the standing advice from [[bonefire-picket]] is that nobody has ever needed to go into one.

**The hum.** The fissures make a noise. It comes up with the light, low and constant and everywhere, and after ten minutes down there you stop hearing it the way you stop hearing a machine two floors down. Every keeper on the leg will tell you the same thing about that hum and they will all tell you unprompted: *you stop hearing it in ten minutes, and it takes the rest of your life to start again.*

**The vents.** Fourteen places on the canyon floor where a fissure runs hot enough to light. The gas itself will not burn — it is heavy and inert and it smothers — but a lit vent throws a column of flame straight up through it, and for four seconds you can see the whole floor. This is the only fire in Death Canyon that is not something a person carried in, and it is the only reason anybody has ever walked out.

**What comes down the water.** [[riftgate]] runs out of this country toward [[heartland]] carrying rift-relics, bone-goods, grave salvage and the quiet coffins of the dead trade, and it has done for generations, and the tally has never balanced. The [[bone-market-families]] have carefully never asked why. A discrepancy nobody has asked about is not yet a liability, and the Families are excellent at law.

Nobody has established what makes the light or the gas. Every confident account of this canyon has been wrong so far, including the loudest one, which is currently walking around down there on eight legs.`;

const paleMotherBody = `She is nine metres across the legs and she is made entirely of bone, and none of it is hers.

Every plate, every leg segment, every socketed joint on [[the-pale-mother]] came off somebody. She did not grow them. She **fitted** them — seated, overlapped and keyed the way a wall is dry-stoned, and the fit is the frightening part, because a fit that good was done slowly by something with an opinion about it. She has no soft tissue anywhere. No hide, no organ, no eye, no wet surface. She has no face at all, which means there is nothing on her a person can look at and read an intention off, and people find that harder than teeth.

Where a spider carries a body she carries a **cage**: a ribbed hollow slung between the legs, closed, dark, and full. Blue-green fissure light gets into it from underneath and comes back out through the seams between her plates, so at two hundred metres through violet gas she reads as a pale lantern walking.

**She has never once defended herself.**

Read that again before reading anything else about how she fights, because every behaviour she has changes meaning under it. She does not attack — she interposes, putting her body between you and the cage. She smothers the fire because fire is what kills them. She backs into the deep gas because you cannot see in it and they can. She is slow, she is level, she is unhurried, and she does not react to injury at all: a plate off her is not a wound, it is inventory, and she will pick one up off the floor mid-fight and put it back on without hurrying that either.

**What is in the cage is four hundred and eleven of them, and it is moving the entire time you are fighting her.** It is visible. Nobody looks.

She is not undead in the way a frightened person means it. There is no caster behind her and nothing was raised. The Riverlands' Ossuary Rites are an honest covenant between generations — the dead stay in the family's keeping and bone is contract — and the one horror that trade has a word for is bone that will not settle: bone that goes on working after the rite. That word is *undead*. Death Canyon is where it was coined. She is the reason anybody needed it.

She is made out of other people's dead, and she is a good mother, and both of those are the same sentence.`;

const paleBroodBody = `Hand-sized, bone, several hundred, and the colour of the gas.

Not camouflaged. Not invisible. The [[the-pale-brood]] are the same hue as the volume they are standing in, at the same value, with the same softness at distance — violet in the gas, blue-green over a fissure — so the eye has nothing to catch on and the brain files them as weather. **The only tell is that the gas moves wrong.** A wake. A displacement. A surface disturbed in a direction the gas is not going.

**Nothing that hits a point will touch them.** Bullets pass between. A blade finds gaps. There is no mass to hurt and no organ to find, and this is immunity rather than resistance — a hunter who empties a magazine into a moving patch of gas has not slowed it down by one step, and every recovery on the board says the same thing about the brass. What kills them is anything that fills a volume: magic, fire, an explosive, a lit vent. One tick, one death. They have no health worth the name. The problem was never how hard they are to kill. The problem is that there are four hundred and eleven of them and you have fourteen vents.

**They pick one person.** The nearest, not the weakest, and then they climb — boots, shin, chest — and what they take is bone. A hunter who walks out with them still on has walked out lighter than they went in, and that is a thing a Soul Forge fixes, for anybody who can buy a body. The people at [[bonefire-picket]] cannot. That is the whole difference between a bad night for a bounty crew and a permanent one for a picket keeper, and it is why the notice is posted where it is posted.

**They do not make a sound. They block one.** The canyon hums and they do not, so when they cross a fissure the hum goes out in that spot, and the shape of the silence coming toward you across the floor is the only warning anybody gets. Hunters who learn to hear the quiet survive Death Canyon. Hunters who learn to watch for movement do not.

**And they are patient.** Reach clear stone and they will not follow you onto it. They come to the line where the gas ends and they stop, and they wait, all of them, not moving, for as long as it takes — which is the detail every survivor account leads with, ahead of the deaths.`;

const wennaBody = `Keeper of the beacon at [[bonefire-picket]], and the only person who has come out of [[death-canyon]] on her own feet in nine years.

She keeps the bone-oil flame lit, which people upriver read as grief and which she will correct you about, at length, if you say it out loud: the light goes four miles down the tannin water, and anybody coming up the leg after dark can see from a long way off exactly where the last safe place is. She considers that a job rather than a memorial and she is right.

She is the reason the notice on the picket board says what it says. She wrote it. It is nine words long, four of which are the pay, and the last two are **bring fire**, and she has watched crews read it, nod, and walk up the road with rifles for nine years.

She will tell it to anybody who sits down. She has told it enough times that it comes out level, which unsettles people more than crying would.`;

const wennaAccount = `> *Wenna Crake, at the picket, to anybody who sits down.*

People want me to tell them about the spider. I will tell them about the spider if that is what gets them to sit still, but the spider is not the part.

We went in five. Ilsa Renn, who had done it before and was the whole reason the rest of us thought we could. A boy called Petrik whose boots were too big, and who stopped the line twice on the walk up to tie them, and I was short with him about it both times. That is a thing I get to keep now. Dav and his brother, who did not talk much and were very good at this. And me, carrying the oil.

The canyon hums. You would not think a hole in the ground makes a noise but it does, it comes up out of the cracks with the light, low, everywhere, all the time. You stop hearing it in about ten minutes. Write that down, because it is the only thing on this whole page that will save anybody. **You stop hearing it in ten minutes and it takes the rest of your life to start again.**

She was easy.

I want to be honest about that, because whoever comes after me is owed honesty and not a story. She was slow and she was enormous and she never once came at us the way a thing that means it comes at you. Ilsa said she was old. Ilsa said *look, she is not even trying.* And we opened her up along the seams where the light gets out, because that is where you hit a thing, everybody knows that, you can see it glowing from across the floor.

We were laughing. Not the whole time. But we were.

Then Petrik said, quite quietly, in an ordinary voice, like a man noticing weather — *why has it gone quiet over there.*

And it had. Off to the left, thirty feet, the hum had stopped in a patch about as wide as a cart. Not everywhere. There. And while we stood looking at it the patch got wider, and then there was a second one, and then the whole left side of the canyon was silent and coming toward us, and there was nothing to see. Nothing at all. Only gas doing what gas does, except in one direction.

Dav shot at it. I do not blame him. I want that in the record as well — I do not blame him and I would have done the same and I did not have a gun. He put the entire magazine into it, and it did not slow down, and it did not spark, and it did not make a single sound, and that was when I understood that we had not been in a fight yet.

They went for Petrik because Petrik was nearest. That is all it is. It is not fate and it is not a lesson. He was nearest.

I got two of them off him with the oil. Two. There is no version of this where I give you a bigger number.

Ilsa got a vent open and the fire went up through the gas like a wall, and for about four seconds I could see the entire floor, and I saw how many there were, and then I turned around and ran. I have never once said that I did anything else.

I got up onto clear stone and they stopped at the edge of the gas.

That is the part I would take out of my head if anybody could. Not the noise. Not Petrik. **The waiting.** They came to the line where the gas ended and they stood there in the dark, all of them, not moving, for a very long time, because they could and I could not.

Bring fire. That is all the board says. It is all it needs to say and nobody reads it.

One more thing and then I am finished talking about it.

Three weeks after, I was cleaning out the lamp housing, and something came out of the lining of my coat and went down the wall and under the quay. It was the size of my hand. I did not get a good look at it.

I never went into the gas wearing that coat. **It got on me on the road.**`;

// ---------------------------------------------------------------------------
// Entries
// ---------------------------------------------------------------------------

type EntrySpec = {
  slug: string;
  kind: "REGION" | "CREATURE" | "CHARACTER" | "ITEM";
  title: string;
  summary: string;
  body: string;
  meta: Record<string, unknown>;
};

const entries: EntrySpec[] = [
  {
    slug: "death-canyon", kind: "REGION", title: "Death Canyon",
    summary: "The Grand Rift's lethal interior: violet gas pooled over blue-green fissure light, fourteen vents that will burn, and a hum you stop hearing in ten minutes.",
    body: deathCanyonBody,
    meta: {
      type: "zone", settlementTier: null, parent: "grand-rift",
      biome: "fissured toxic chasm floor, heavy violet gas over blue-green luminescence",
      control: [], population: "None. The nearest fixed light is Bonefire Picket, and it is deliberately the last one.",
      connections: [{ to: "the-red-forest", by: "broken canyon shelves", notes: "The red canopy dies back gradually inside the canyon." }],
      status: "Established high-level hazard zone. One named threat, unresolved.",
      veilAnchorTier: null, soulForge: null, gameTag: null,
      openQuestions: [
        "What produces the blue-green light and the purple gas.",
        "Why the bone-goods tally on Riftgate has never balanced, in either direction, for four generations.",
      ],
    },
  },
  {
    slug: "the-pale-mother", kind: "CREATURE", title: "The Pale Mother",
    summary: "Nine metres of fitted bone, none of it hers, carrying a closed cage with four hundred and eleven of them in it. She has never once defended herself.",
    body: paleMotherBody,
    meta: {
      // Taxonomy, and it was the hardest call in the entry. No race fits her
      // cleanly: she is not a Beast, she was not made (so not a Monstrosity),
      // she has no infusion history (so not an Abomination), and Supernaturals
      // are "from outside the world's ecology" — she is made of this world's
      // dead. The Risen is "the dead that do not stay down ... skeletal
      // figures," which is a literal description of her, and its suspected
      // cause is explicitly unconfirmed, so filing her here imports no answer.
      category: "supernatural", parent: "the-risen",
      biomes: ["death-canyon"],
      threat: "Mythic designation — the Grand Rift's. Two phases. The health bar is the cage: damage to the seams and the carry unlatches it, damage to the eight legs does not. How she is killed decides which fight happens next. Smothers the arena's burning vents to heal, which is the same action as putting out the only thing that kills her brood.",
      harvest: "A Settled Plate, Brood-glass by the bead, and a Cage Rib. The first is clean; the second is a number the Bone Market Families would like to have.",
      gameId: null,
      openQuestions: ["Whether the covenant bone on her was sold or stolen, and whether anybody alive could still tell the two apart."],
    },
  },
  {
    slug: "the-pale-brood", kind: "CREATURE", title: "The Pale Brood",
    summary: "Four hundred and eleven hand-sized bone spiders the exact colour of the gas. Bullets and blades do nothing at all. They do not make a sound — they block one.",
    body: paleBroodBody,
    meta: {
      category: "supernatural", parent: "the-risen",
      biomes: ["death-canyon"],
      threat: "The Pale Mother's second phase, recorded separately because its damage rules are not hers. Total immunity to all point damage — ballistic and melee alike, never a reduction. Killed only by area effect: magic, fire, explosives, or one of the canyon's fourteen fissure vents. One tick, one death; the difficulty is coverage and count, not durability. Applies Taken while attached, which the Soul Forge repairs for anybody who can afford a body.",
      harvest: "One bead of Brood-glass per kill, so a hunter's pouch is the count.",
      gameId: null,
      openQuestions: ["Where the ones that ride out of the canyon get off."],
    },
  },
  {
    slug: "wenna-crake", kind: "CHARACTER", title: "Wenna Crake",
    summary: "Beacon keeper at Bonefire Picket. Went into Death Canyon with four other people, came back alone, and wrote the nine words on the board that nobody reads.",
    body: `${wennaBody}\n\n---\n\n${wennaAccount}`,
    // Every field on the character sheet is required-but-nullable: a sheet that
    // omits one is rejected whole, and the release audit catches it before a
    // deploy rather than the next person to press save.
    meta: {
      fullName: "Wenna Crake",
      aliases: ["the one who came out"],
      pronouns: "she/her",
      sex: "female",
      species: "human",
      age: "fifties",
      appearance: "Working clothes kept well past their life, and a lamp-keeper's hands — burn-marked, capable, always doing something with a rag and a housing while she talks. She looks like maintenance, because she is.",
      voice: "Level. She has told it enough times that it comes out flat, and the flatness is what unsettles people; write her lines without a single dramatic beat in them.",
      voiceProfile: {
        sex: "female",
        ageRange: "50-59",
        accent: "upper Riftgate river, flattened by thirty years of talking to boat crews",
        timbre: "dry, unhurried, slightly roughened",
        pace: "even, and it does not change at the worst part",
        register: "plain testimony, never performance",
        designPrompt: "A river beacon keeper in her fifties who went into a lethal canyon with four other people and came back alone. She recounts it on request, in order, without pausing at the deaths — not numb and not brave, just done being surprised by it. The direction that matters: she is NOT haunted and never breaks. The horror is that she is completely calm about something she should not be calm about.",
        referenceClipAssetId: null,
        consent: { kind: "SYNTHETIC_DESIGNED", statement: null, signedAt: null },
        faceRig: "unknown",
      },
      magic: { origin: null, schools: [], corruptionPhase: null, notes: null },
      factions: [{ faction: "bone-market-families", role: "Beacon keeper, Bonefire Picket", standing: "Employed by the arrangement that feeds the flame. She keeps the light and does not discuss the trade." }],
      home: "bonefire-picket",
      status: {
        known: "Keeps the beacon at Bonefire Picket. Wrote the nine words on the board.",
        actual: "Has not slept properly since something came out of her coat lining three weeks after she got back.",
      },
      relationships: [
        { character: null, who: "Ilsa Renn", type: "Led the crew. Got the vent open, which is the only reason Wenna is alive, and did not get out herself." },
        { character: null, who: "Petrik", type: "The boy with the boots. She was short with him twice on the walk up and she keeps that." },
      ],
      background: "Beacon keeper on the upper Riftgate leg",
      professions: ["Beacon keeping", "Bone-oil rendering"],
      skills: ["Composure · Ceiling", "Lamp and burner maintenance · Expert"],
      cybernetics: [],
      storyRole: "The reason the bounty board says BRING FIRE, and the only firsthand account of the Pale Brood anybody has. Her testimony is the tutorial nobody reads.",
      involvement: [],
      gameId: null,
      model: null,
      companion: { capable: false, availability: null, status: null },
      openQuestions: [
        "What went under the quay at Bonefire Picket three weeks after she came back, and whether it is still there.",
        "Whether she has ever told anyone that it got on her on the road rather than in the gas.",
      ],
    },
  },
  {
    slug: "settled-plate", kind: "ITEM", title: "A Settled Plate",
    summary: "The one bone on the Pale Mother that had stopped working. Proof, to the trade that cares most, that settling is still possible.",
    body: `A broad curved shield-plate off [[the-pale-mother]], the size of a cart wheel, and inert.

That is the whole value of it. Everything else on her is bone that will not settle — the Ossuary Rites' one word of horror, working on after the rite that should have ended it. This plate stopped. Somewhere in her assembly, one piece of somebody finished, and she went on carrying it because she does not appear to be able to tell the difference.

Armourers want it because chalk-dry mineral laminate of that age is very good stock. The [[bone-market-families]] want it for a reason they will not put on paper, and their offer is always slightly too high, and they never explain that either.`,
    meta: { category: "Mythic material", rarity: "very rare", origin: "The Pale Mother", gameId: null, openQuestions: [] },
  },
  {
    slug: "brood-glass", kind: "ITEM", title: "Brood-glass",
    summary: "What a broodling leaves when fire takes it: one small clear bead of fused bone. One per kill, which makes a pouch of them a body count.",
    body: `Fire is the only thing that reduces one of [[the-pale-brood]] to anything at all, and what it leaves is a bead: small, irregular, clear, some of them still clouded with smoke inside.

**One bead, one broodling.** Nobody had to design that and nobody can argue with it, which is why a hunter's pouch coming out of [[death-canyon]] is not loot. It is a count, and the difference between the count in the pouch and four hundred and eleven is the number that is still down there.

[[charnel-lock]] buys it. The toll attendants weigh it without comment, pay exactly correctly, and enter it in a ledger that has not balanced for four generations. Selling it tells the [[bone-market-families]] precisely how many she had. They will price it. They will not stop buying.`,
    meta: { category: "Mythic material", rarity: "uncommon", origin: "The Pale Brood", gameId: null, openQuestions: [] },
  },
  {
    slug: "cage-rib", kind: "ITEM", title: "Cage Rib",
    summary: "One rib off the brood chamber — a very well-made piece of a very large enclosure.",
    body: `A single long curved rib section off the cage [[the-pale-mother]] carried between her legs, taller than a person, with fitted notches down its inner edge at regular intervals.

The notches are the part armourers stop talking when they see. They are spaced, they are identical, and they are on the inside — which means the cage was not armour and was never meant to keep anything out. It was assembled, deliberately, at a tolerance, by something that had a plan for the inside of it.

Excellent crafting stock. Nobody who has handled one has ever described it as excellent crafting stock.`,
    meta: { category: "Mythic crafting material", rarity: "rare", origin: "The Pale Mother", gameId: null, openQuestions: [] },
  },
];

// ---------------------------------------------------------------------------
// The board
// ---------------------------------------------------------------------------

const nodes: NodeSpec[] = [
  {
    key: "the-board", kind: "QUEST_START", title: "Nine Words at the Picket", status: "CANON", x: 0, y: 0,
    summary: "The notice on the beacon board at Bonefire Picket, and the woman who wrote it.",
    body: `The board at [[bonefire-picket]] carries one notice about [[death-canyon]] and it is nine words long. Four of them are the pay. The last two are **bring fire**.

[[wenna-crake]] wrote it, keeps the beacon under it lit, and has watched crews read it, nod, and walk up the road with rifles for nine years. She will not stop anybody and she does not argue. If you sit down she will tell you what happened to the five of them, level, all the way through, including the part where they were laughing.

The pay is good. It is good because the picket's keepers have taken up a collection every year for nine years and nobody upriver has ever contributed a coin, and Wenna considers explaining that to be somebody else's job.

The Picket's arrival log has three columns — trade, grief, and other — and the keepers underline the third. Ask to see it and you will be shown it without comment. The third column is short. Every line in it is a date, and one of the dates is hers.`,
    effects: ["The party has been told, in plain words and at length, what kills the Brood."],
  },
  {
    key: "the-walk-up", kind: "SCENE", title: "The Road In", status: "CANON", x: 240, y: 0,
    summary: "The last made ground before the shelves. Nothing happens. Something gets on.",
    body: `Four hours up a road that stops being a road, through country that gets older as it goes, until the red canopy thins and the ground opens and the light comes up out of it.

Nothing attacks the party on the approach and nothing is meant to. This is the quiet stretch where people check straps, argue about the gas, and decide out loud that the notice was written by a frightened woman.

**One broodling attaches to somebody here.** Not in the canyon — on the road, before the gas, in the open, silently. It does no damage, produces no icon, makes no sound, and rides. A party that inspects itself on the walk in will find it. Nobody inspects anybody on the walk in.`,
    effects: ["A passenger is attached to one party member. Nothing indicates it."],
  },
  {
    key: "the-hum", kind: "SCENE", title: "The Hum", status: "CANON", x: 480, y: 0,
    summary: "Ten minutes of learning the canyon, which is nine minutes longer than anybody wants.",
    body: `The floor throws blue-green light and the gas lies on top of it, violet, heavy, with a surface. Three depths: clear shelves above the pool line, working depth at the chest, and the fractures that go over your head.

And the noise. Low, constant, coming up with the light, everywhere. The game does not point at it. It simply plays it, at a level that stops registering after about ten minutes, exactly as [[wenna-crake]] said it would.

**Fourteen vents.** Fissures running hot enough to light, and a lit one throws a column of flame straight up through the gas. The gas itself will not burn — it smothers. Nothing in this scene explains what the vents are for.`,
    effects: ["The canyon's hum is established at a level the player will stop hearing.", "Fourteen ignitable vents are placed and unexplained."],
  },
  {
    key: "the-lantern", kind: "SCENE", title: "A Pale Lantern, Walking", status: "CANON", x: 720, y: 0,
    summary: "First sight of her, at two hundred metres, and the first mistake is already available.",
    body: `Through the violet she reads as a lantern — blue-green light getting into her from underneath and coming back out through the seams between her plates, moving unhurriedly across the floor at a distance.

Up close she is nine metres across, faceless, and slow, and the cage slung between her legs is closed and dark and **moving**.

It is in frame. It is in frame for the entire fight. The seams that make her beautiful at distance are the gaps in the thing holding it shut, and they glow, and thirty years of games have taught every player alive to shoot the part that glows.`,
    effects: ["The cage is visible and visibly occupied before a shot is fired."],
  },
  {
    key: "phase-one-the-walk", kind: "SCENE", title: "Phase One — the Walk", status: "CANON", x: 960, y: 0,
    summary: "A completely fair, completely winnable fight against a big slow thing. That is the trap, and playing honestly is what springs it.",
    body: `She is slow, she is enormous, and she never comes at the party the way a thing that means it comes at you — because [[the-pale-mother]] has never once defended herself. She interposes. She puts her body between the party and the cage, and every read of that as aggression is the player's own.

**Sweeping Foreleg · Shed Plate · The Drag · Fissure Step · Settle · Cradle Slam.**

*The Drag* comes out of an opaque gas wall from nothing, at reach, and teaches the party that the gas can hold her. *Fissure Step* takes her into the deep pool and she is simply gone — not invisible, the gas is opaque and she is patient, and the tell that she is returning is the gas.

*Settle* is the fight. She lowers the cage onto a burning vent, puts it out, and heals off it, in one unhurried animation. That is not a boss healing. That is a mother standing on the fire, and every vent she smothers is one the party does not have in three minutes' time.

So the whole phase is an economy nobody explains: kill her fast at the glowing seams and keep the vents, or kill her slowly at the legs and watch her take the vents away. There is no correct answer. There is only the one the party can execute.`,
    effects: ["Vents smothered in this phase are unavailable in the next."],
  },
  {
    key: "the-cage", kind: "CHOICE", title: "The Lid", status: "CANON", x: 1200, y: 0,
    summary: "She does not have a health bar. She has a lid. The player finds this out here, and it is decided by damage already dealt.",
    body: `She stops, and lowers, and the legs fold — and what happens next was settled minutes ago by where the party put its damage.

**Seams and carry first.** The obvious weak point, the fastest kill in the fight, and the fastest way to unlatch a cage. It comes apart before she has stopped moving and the Brood pours out **while she is still standing**. Both at once, in the gas, with the fire mostly spent. Most first attempts end here.

**Body damage, no discipline.** She goes down, the legs fold, and then the cage opens. A clean break between two fights. This is the intended hard version.

**The eight legs only, cage untouched.** She goes down with the lid on, and the party can hear them in it. Burn it closed. Nothing gets away, and the count reaches zero, and this is brutally difficult and it is the only outcome that ends anything.

The health bar was the cage the whole time. The game does not say so now either.`,
    effects: ["The phase-two opening state is set by which targets took the damage."],
  },
  {
    key: "phase-two-the-count", kind: "SCENE", title: "Phase Two — the Count", status: "CANON", x: 1440, y: 0,
    summary: "No health bar. A number going down, three minutes without a pause, and the only warning is a noise stopping.",
    body: `**Four hundred and eleven.** The HUD does not show health in this phase. It shows a number, and the number goes down, and it is the same number the [[bone-market-families]] have failed to balance for four generations.

Bullets do nothing. Blades do nothing. Total immunity, never a reduction — [[the-pale-brood]] has no mass to hurt and no organ to find, and a hunter emptying a magazine into moving gas has not slowed it by a step. What kills them fills a volume: magic, fire, an explosive, a lit vent. One tick, one death. The fight is coverage, not damage, and coverage is what the party spent in phase one.

They are the colour of the gas. The tell is that the gas moves wrong.

**And the canyon goes quiet in the shape of them.** They do not make a sound; they block one. The hum goes out where they cross it, so the party fights this phase by listening to a noise stop — locatable in the mix, learnable in one attempt, and the first time somebody works out what the silence means is the moment this creature lands.

They pick the nearest person and climb. What they take is bone. Ten stacks of **Taken** and that person is down; walk out with stacks and it is a lasting injury, which a Soul Forge repairs for anybody who can buy a body. The keepers at [[bonefire-picket]] cannot.

Leave them alive long enough and they start carrying plates back. They will rebuild her in front of the party — and if somebody is down and not picked up, out of that too.`,
    effects: ["Every broodling killed is dead permanently, across attempts.", "Brood-glass drops one bead per kill, so the pouch is the count."],
  },
  {
    key: "the-cage-never-opened", kind: "ENDING", title: "The Cage Never Opened", status: "CANON", endingKind: "SUCCESS", x: 1680, y: -180,
    summary: "Legs only, lid on, fire on a closed cage. The count reaches zero and the tally balances for the first time in living memory.",
    body: `Eight legs, no seams, no carry — and then fire on a shut cage while the noise inside it goes on for longer than anybody in the party will describe accurately afterwards.

The count reaches zero. Death Canyon has no Mother, and nothing walked out of it, and the difference between the beads in the pouch and four hundred and eleven is nothing at all.

Downriver, inside a season, the [[bone-market-families]]' bone-goods tally on [[riftgate]] balances. Somebody at [[charnel-lock]] notices — the attendants are meticulous, it is the entire culture of the place — and says nothing to anybody, and the ledger is not shown to the party, and no explanation is ever offered for why it was wrong before.

[[wenna-crake]] takes the notice off the board at [[bonefire-picket]] and keeps the beacon lit anyway. She is asked about that and gives the same answer she has always given: the light goes four miles, and somebody is always coming up the water after dark.`,
    effects: ["FLAG the-count-at-the-canyon is set to zero.", "The Riftgate bone-goods tally balances within a season.", "The Death Canyon notice comes off the Bonefire Picket board."],
    rewards: ["A Settled Plate", "Cage Rib", "Brood-glass — the full count", "Standing with the Bone Market Families, unexplained and slightly too warm"],
  },
  {
    key: "the-number-you-left", kind: "ENDING", title: "The Number You Left", status: "CANON", endingKind: "NEUTRAL", x: 1680, y: 0,
    summary: "She is dead and most of them are burned. The rest is a figure, and it is written down, and it is not zero.",
    body: `[[the-pale-mother]] is down and the fire took most of them, and the party walks out with a pouch that weighs a specific amount.

Count the beads. Subtract from four hundred and eleven. **That is the number that is still in Death Canyon**, and the game states it once, plainly, without comment, and then keeps it.

[[charnel-lock]] buys the glass. The attendants weigh it, pay exactly correctly, enter it, and do not remark on it — and somewhere in the Families' books the discrepancy that has run for four generations moves by precisely the amount the party burned, which is the first time in living memory anybody has made it move in the right direction and nowhere near far enough.

Something is still down there. The party is the only group of people alive who know how much of it.`,
    effects: ["FLAG the-count-at-the-canyon is set to the surviving figure and carried."],
    rewards: ["A Settled Plate", "Brood-glass — as many as were burned", "The exact figure, recorded"],
  },
  {
    key: "they-went-with-you", kind: "ENDING", title: "They Went With You", status: "CANON", endingKind: "FAILURE", x: 1680, y: 180,
    summary: "She is dead. The Brood is not, and Reassembly finishes without an audience, and the road out is four hours long.",
    body: `The party kills her and cannot cover the ground, and at some point covering the ground stops being the plan and the road becomes the plan.

Reassembly finishes without an audience. There is a Pale Mother in [[death-canyon]] by the season — built out of the fight the party won, out of whatever else is on that floor, and out of anybody who went down and was not picked up — and she is bigger, and she is more careful, and she will not come out of the deep gas as readily as she did.

**And one of them left with the party.** The one from the road, or another; it does not matter which and nobody will ever establish it. It does no damage. It produces no icon. It rides, the way it rode in, and it gets off somewhere that is not a canyon.

[[wenna-crake]] does not say anything when the party comes back down past the beacon. She has been the only person this happened to for nine years and she is visibly relieved not to be, and being relieved about that is the worst thing she has ever felt.`,
    effects: ["FLAG the-brood-got-away is set.", "FLAG the-count-at-the-canyon carries a figure close to four hundred and eleven.", "A passenger leaves Death Canyon with the party. Where it gets off is owed."],
    rewards: ["A Settled Plate", "Brood-glass — very few"],
  },
];

const edges = [
  { from: "the-board", to: "the-walk-up" },
  { from: "the-walk-up", to: "the-hum" },
  { from: "the-hum", to: "the-lantern" },
  { from: "the-lantern", to: "phase-one-the-walk" },
  { from: "phase-one-the-walk", to: "the-cage" },
  { from: "the-cage", to: "phase-two-the-count", label: "The cage opens — early, or cleanly" },
  { from: "the-cage", to: "the-cage-never-opened", label: "Eight legs, lid on, fire on a closed cage", condition: "the-count-at-the-canyon" },
  { from: "phase-two-the-count", to: "the-number-you-left", label: "The ground was covered", condition: "the-count-at-the-canyon" },
  { from: "phase-two-the-count", to: "they-went-with-you", label: "The ground was not covered", condition: "the-brood-got-away" },
];

const links: Array<{ node: string; slugs: string[] }> = [
  { node: "the-board", slugs: ["bonefire-picket", "wenna-crake", "death-canyon"] },
  { node: "the-walk-up", slugs: ["death-canyon", "the-pale-brood"] },
  { node: "the-hum", slugs: ["death-canyon"] },
  { node: "the-lantern", slugs: ["the-pale-mother", "death-canyon"] },
  { node: "phase-one-the-walk", slugs: ["the-pale-mother"] },
  { node: "the-cage", slugs: ["the-pale-mother", "the-pale-brood"] },
  { node: "phase-two-the-count", slugs: ["the-pale-brood", "bonefire-picket", "bone-market-families"] },
  { node: "the-cage-never-opened", slugs: ["the-pale-mother", "charnel-lock", "riftgate", "wenna-crake", "bonefire-picket"] },
  { node: "the-number-you-left", slugs: ["the-pale-mother", "charnel-lock", "brood-glass"] },
  { node: "they-went-with-you", slugs: ["the-pale-brood", "death-canyon", "wenna-crake"] },
];

// ---------------------------------------------------------------------------

async function main() {
  const actor = await db.user.findFirst({ where: { role: "ADMIN", isActive: true }, orderBy: { id: "asc" }, select: { id: true } });
  if (!actor) throw new Error("Authoring requires an active administrator for revision authorship.");
  const writer = new BoardWriter(db, actor.id, apply);
  const entryChanges: string[] = [];

  // 1. Entries. Written directly: REGION, CREATURE, CHARACTER and ITEM sheets
  //    all carry meta, and the BoardWriter deliberately only plants flags.
  for (const spec of entries) {
    const existing = await db.storyEntry.findUnique({ where: { slug: spec.slug }, select: { id: true, kind: true, title: true, summary: true, body: true, meta: true } });
    if (existing && existing.kind !== spec.kind) throw new Error(`"${spec.slug}" already exists as a ${existing.kind}, not a ${spec.kind}.`);
    if (!existing) {
      entryChanges.push(`create ${spec.kind} ${spec.slug}`);
      if (apply) {
        const created = await db.storyEntry.create({ data: { id: randomUUID(), kind: spec.kind, slug: spec.slug, title: spec.title, summary: spec.summary, body: spec.body, status: "CANON", createdByUserId: actor.id, meta: spec.meta as Prisma.InputJsonValue } });
        await db.storyRevision.create({ data: { id: randomUUID(), entityType: "ENTRY", entityId: created.id, action: "CREATED", actorUserId: actor.id, summary: `Wrote "${spec.title}"` } });
      }
      continue;
    }
    const unchanged = existing.title === spec.title && existing.summary === spec.summary && existing.body === spec.body && stableJson(existing.meta) === stableJson(spec.meta);
    if (unchanged) continue;
    entryChanges.push(`rewrite ${spec.kind} ${spec.slug}`);
    if (apply) {
      // Server-owned keys are carried, exactly as a sheet save does.
      const prior = typeof existing.meta === "object" && existing.meta !== null && !Array.isArray(existing.meta) ? existing.meta as Record<string, unknown> : {};
      const meta = prior.visualArt === undefined ? spec.meta : { ...spec.meta, visualArt: prior.visualArt };
      await db.storyEntry.update({ where: { id: existing.id }, data: { title: spec.title, summary: spec.summary, body: spec.body, meta: meta as Prisma.InputJsonValue, updatedByUserId: actor.id, version: { increment: 1 } } });
      await db.storyRevision.create({ data: { id: randomUUID(), entityType: "ENTRY", entityId: existing.id, action: "UPDATED", actorUserId: actor.id, summary: `Rewrote "${spec.title}"` } });
    }
  }

  // 2. The flags. Both are planted with their answer already decided, which is
  //    the standing rule — a flag nobody checks is a promise nobody keeps.
  await writer.flag(
    "the-count-at-the-canyon",
    "The Count at the Canyon",
    "How many of the Pale Brood are still in Death Canyon: four hundred and eleven minus whatever the party burned.",
    `A number, carried. [[the-pale-mother]] had **four hundred and eleven**, one bead of [[brood-glass]] comes off each one the fire takes, and the difference is what is still down there.

Set at every ending of the bounty, including the good one, where it is zero. Read by [[charnel-lock]] — the [[bone-market-families]]' bone-goods tally on [[riftgate]] has not balanced for four generations and moves by exactly this amount, in the right direction, for the first time in living memory.

It is never shown as a health bar and it is never rounded.`,
  );
  await writer.flag(
    "the-brood-got-away",
    "The Brood Got Away",
    "The party killed the Pale Mother and could not cover the ground. Reassembly finished without an audience, and one of them left the canyon.",
    `Set when the bounty ends at *They Went With You*.

Two consequences and they run on different clocks. **Death Canyon rebuilds a Mother inside a season**, bigger and more careful, out of the fight the party won and anybody who went down in it. And **a passenger leaves the canyon** — attached on the road, riding out the same way, doing no damage and producing no icon.

Where it gets off is deliberately not answered here. This flag is the promise; the payoff is owed and unwritten, and it must not be paid off in Death Canyon.`,
  );

  // 3. The board. BoardWriter has no arc(), and arcFields throws on an arc row
  //    that does not exist yet — so the row is opened here first. CONTRACT is
  //    "a bounty posted at a place", so the region is structural: it is where
  //    you read the notice, and it is where the woman who wrote it lives.
  const arcRow = await db.storyArc.findUnique({ where: { slug: ARC }, select: { id: true, category: true, regionEntryId: true } });
  const posting = await db.storyEntry.findUnique({ where: { slug: "bonefire-picket" }, select: { id: true, kind: true } });
  if (!posting || posting.kind !== "REGION") throw new Error("bonefire-picket is missing or is not a REGION; a contract must be posted somewhere real.");

  if (!arcRow) {
    entryChanges.push(`create CONTRACT arc ${ARC} posted at bonefire-picket`);
    if (apply) {
      const last = await db.storyArc.aggregate({ where: { category: "CONTRACT" }, _max: { position: true } });
      const created = await db.storyArc.create({ data: {
        slug: ARC,
        title: "The Pale Mother",
        category: "CONTRACT",
        // Both columns, always together: the CHECK refuses a row where they disagree.
        isMainline: false,
        regionEntryId: posting.id,
        status: "PROPOSED",
        position: (last._max.position ?? -1) + 1,
        createdByUserId: actor.id,
      }, select: { id: true } });
      await db.storyRevision.create({ data: {
        entityType: "ARC", entityId: created.id, arcId: created.id, action: "CREATED", actorUserId: actor.id,
        summary: 'Opened the contract "The Pale Mother"',
      } });
    }
  }

  // Everything below needs the arc row. On a first dry run it does not exist
  // yet, so the board reports its intent and writes nothing.
  if (!apply && !arcRow) {
    console.log(JSON.stringify({
      mode: "PREVIEW",
      entries: entryChanges,
      board: `${nodes.length} scenes and ${edges.length} routes wait for the arc row`,
      note: "Re-run with --apply to open the contract, then preview again to diff the board.",
    }, null, 2));
    return;
  }

  await writer.arcFields(ARC, {
    status: "CANON",
    title: "The Pale Mother",
    hook: "Nine words on the beacon board at Bonefire Picket. Four of them are the pay and the last two are BRING FIRE, and the woman who wrote them has watched crews read it, nod, and walk up the road with rifles for nine years.",
    summary: "The Grand Rift's Mythic. A spider assembled out of other people's bone, carrying a closed cage with four hundred and eleven of her children in it, in a canyon of heavy violet gas over blue-green fissure light. She has never once defended herself. Her health bar is the lid, and how you kill her decides which of three fights happens next — one of which is survivable and one of which ends anything.",
  });

  for (const node of nodes) await writer.node(ARC, node);
  for (const edge of edges) await writer.edge(ARC, edge);
  for (const entry of links) await writer.links(ARC, entry.node, entry.slugs);

  writer.report(`The Pale Mother — Death Canyon ${apply ? "apply" : "preview"}`);
  if (entryChanges.length) {
    console.log("\nEntries:");
    for (const change of entryChanges) console.log(`  ${change}`);
  }
}

main().catch((error) => { console.error(error); process.exit(1); }).finally(() => db.$disconnect());
