import "../lib/environment";
import { getPrismaClient, type Prisma } from "@habitat/db/client";
import { bloomfallCreatureFieldGuide } from "../lib/bloomfall-creature-field-guide";
import { renderBloomfallCreatureGuide } from "../lib/bloomfall-creature-enhancements";
import { BoardWriter, stableJson, type NodeSpec } from "./lib/story-authoring";

/**
 * The Blackweir Anaconda — Dr. Elias Vey, the Reach's first MYTHIC.
 *
 * Canon: Docs/bloomfall/BLOOMFALL_BLACKWEIR_ANACONDA.md, which holds the four
 * owner rulings this script implements. The two that bind hardest:
 *
 *   He claims the Living Marsh and he is WRONG. Nothing here may write the
 *   marsh as his, write Ansel as mistaken, or make his death break the
 *   coordination. What his death breaks is Blackweir's engineering, which was
 *   genuinely his. The refutation is mechanical, not editorial: the kill
 *   ending sets `the-weir-has-no-keeper`, `root-of-the-bargain` checks it, and
 *   Heartfen's bargain still works. The player runs the experiment.
 *
 *   He is the origin of Adaptive Mutation, and he never says so. That lands as
 *   an assay result appended to the system dossier — evidence, never his
 *   testimony. The moment he boasts about it the design collapses.
 *
 * Idempotent and preview-by-default, like every authoring script here.
 *
 *   pnpm --filter @habitat/web exec tsx scripts/author-blackweir-anaconda.ts
 *   pnpm --filter @habitat/web exec tsx scripts/author-blackweir-anaconda.ts --apply
 */

const ARC = "the-blackweir-bounty";

// ---------------------------------------------------------------- the entries

const relatedBlock = [
  "## Related in the Codex",
  "**Systems.** [[adaptive-mutation]] · [[aberrant-escalation]] · [[marsh-absorption]] · [[reactor-cycles]] · [[harvesting-consequences]]",
  "**Places.** [[blackweir]] · [[the-living-marsh]] · [[heartfen]] · [[cairnwood-camp]]",
  "**People.** [[elias-vey]] · [[tomas-vey]] · [[keira-ansel]] · [[nalia-reed]]",
].join("\n\n");

function anacondaBody() {
  const guide = bloomfallCreatureFieldGuide["the-blackweir-anaconda"];
  if (!guide || guide.kind !== "BOSS") throw new Error("the-blackweir-anaconda has no boss field guide.");
  return `${renderBloomfallCreatureGuide(guide)}\n\n${relatedBlock}`;
}

const eliasVeyBody = `Elias Vey studied Essence-adaptive organisms for the Southreach Energy Reserve: living systems that could take energized [[essence]] and put it somewhere without immediately coming apart. His standing position, which cost him three postings, was that the Reserve had misdiagnosed its own problem. Essence was not the danger. The danger was that Southreach was trying to run something alive on interlocks, load orders and a shift rota — machinery's answers to a biology question.

He was proved right in the worst available way. When [[the-bloomfall]] began he was in Sublevel 4 with a filtration prototype that had never been run at scale, and the lockdown gave him the length of one corridor to decide between the evacuation route and the switch. He threw the switch. The organism worked and then began to fail, because it needed far more biological substrate than the laboratory held.

So he gave it his own, and he was awake for all of it. His skeleton lengthened over weeks. His skin plated. His nervous system did not so much fuse with the filtration network as volunteer into it, junction by junction, each one a decision. By the time an emergency team reached the laboratory there was no person in the room, only something enormous coiled around the reactor chamber that did not attack them and did not answer.

He is not the cause of the Bloomfall. He acted after the cascade had already begun, with a device meant to contain it. Twenty years later he is still working, and stretches of the [[blackweir]] weir run on him: when the weir closes a channel ahead of a surge that is him, and when it sacrifices a root field to save the beds below it, that is him deciding which part of himself to spend.

He will tell you, plainly and without grandeur, that he is [[the-living-marsh]]. He believes it. Twenty years of Meridian telemetry has never agreed with him, [[heartfen]] coordinates in stretches of water he has never touched, and the channels there close on schedule whether he is breathing or not. [[keira-ansel]] holds the line she has always held: coordination is measured fact and consciousness is unproven. He is not the answer to the marsh. He is the loudest thing that has ever claimed to be.

What he has never once claimed is the thing that turns out to be true. See [[the-blackweir-anaconda]] for the fight, and [[adaptive-mutation]] for what an assay of his prototype's tissue signature says about every creature in this region that you wound and fail to kill.

${relatedBlock}`;

const entrySeeds = [
  {
    kind: "CHARACTER" as const,
    slug: "elias-vey",
    title: "Dr. Elias Vey",
    summary: "The Southreach biologist who fed himself to his own filtration prototype, and has been maintaining it from inside for twenty years.",
    body: eliasVeyBody,
    meta: {
      fullName: "Elias Vey",
      aliases: ["The Mire Stalker", "The Blackweir Anaconda"],
      pronouns: "he/him",
      sex: null,
      species: "Human",
      age: "Would be in his seventies; has not aged in a way anyone can measure",
      appearance:
        "Massively serpentine on a frame that still remembers shoulders. Plated hide over an elongated skull, and the remains of a Southreach research coat and equipment harness grown into the hide where they stopped being removable. In his true form, forty to sixty metres of anaconda with old identification plates set into the scales and laboratory armatures fused into the flanks.",
      voice:
        "Level, unhurried, professional. He corrects rather than threatens, and he is never angry — the register is a specialist explaining a procedural violation to someone who should already know. He was a lecturer once and it never left him.",
      voiceProfile: {
        sex: "male",
        ageRange: "60s, weathered past dating",
        accent: "Educated Southreach; institutional, flattened by twenty years of disuse",
        timbre: "Deep, wet, resonant. The breath before a sentence runs too long and too quiet — a throat no longer arranged for it.",
        pace: "Slow and even. He never hurries a sentence, including the last one.",
        register: "Clinical. Lecturing. Absolutely certain.",
        designPrompt:
          "A patient senior scientist delivering a correction, voiced through a body that is not built for speech. Low, deliberate, no rasp of effort and no menace in the delivery — the menace is entirely in the content. Never shouts. Never pleads. When he says he is the marsh, he says it the way a man states his job title.",
        referenceClipAssetId: null,
        consent: { kind: "SYNTHETIC_DESIGNED" as const, statement: null, signedAt: null },
        faceRig: "none" as const,
      },
      magic: {
        origin: null,
        schools: [],
        corruptionPhase: null,
        notes:
          "Blackbloom exposure at a saturation nothing else has survived, plus deliberate biological integration. This is [[blackbloom-exposure]], not [[the-seven-phases-of-corruption]] — he has no infusion history and is not an Abomination.",
      },
      factions: [
        { faction: "aegis-extraction-consortium", role: "former research biologist, Essence-adaptive organisms", standing: "Personnel record contradicts itself three ways; no institution will say which is current." },
      ],
      home: "blackweir",
      status: {
        known: "Dead in the cascade, or evacuated, or never in Sublevel 4 at all, depending on which record you are holding.",
        actual: "Alive, submerged, and working. Has been for twenty years.",
      },
      relationships: [
        { character: "tomas-vey", who: "His brother", type: "Tomas survived the same night on a different route. He can identify Elias's handwriting on the prototype requisition and has not said the name aloud in twenty years." },
        { character: "keira-ansel", who: "The ecologist measuring him", type: "She has his coordination data and refuses the conclusion he draws from it. They have never met and are the two halves of one argument." },
      ],
      background: null,
      professions: [],
      skills: [],
      cybernetics: [],
      storyRole:
        "The Reach's first Mythic and the region's most dangerous witness. He is wrong about the enormous thing he claims and right about the thing he never mentions. He never becomes the cause of the Bloomfall and never settles what coordinates Heartfen.",
      involvement: [{ ref: ARC, kind: "ARC" as const, how: "Is the bounty. Speaks through both phases of it." }],
      gameId: null,
      model: "Regional Mythic; non-companion, non-recruitable, authored rather than seeded.",
      companion: { capable: false, availability: "Not a companion under any branch.", status: "Hostile on sight to anything that enters the channels." },
      openQuestions: [
        "Whether anything of the man survives, or whether behaviour this coherent settles nothing — the same question the Last Shift asks and canon deliberately leaves open.",
        "Why Meridian's standing file says DO NOT ATTEMPT TO CONTACT VEY rather than DO NOT APPROACH.",
      ],
    },
  },
  {
    kind: "CREATURE" as const,
    slug: "the-blackweir-anaconda",
    title: "The Blackweir Anaconda",
    summary: "Bloomfall Reach's Mythic: a filtration organism the size of infrastructure, with a Southreach biologist still running it.",
    body: anacondaBody(),
    meta: {
      category: "monstrosity",
      // Human parentage records ORIGIN without settling personhood — the same
      // call canon already made for the Last Shift. Monstrosity because canon
      // defines one as deliberately made through engineering, and he was. By
      // himself, which makes him the only one in the Codex that consented.
      parent: "human",
      biomes: ["blackweir", "the-living-marsh", "heartfen", "drowned-intake"],
      threat:
        "Bloomfall designation: Mythic. The first of the tier, above Aberrant: region-defining, unrepeatable, and load-bearing on a regional system. Two phases. Killing it ends Blackweir as a containment structure.",
      harvest:
        "Blackweir Heart, Anaconda Hideplate, Mutated Fang, and resin at a grade nobody has assayed. Every piece is something the weir is currently using; [[harvesting-consequences]] applies at full strength.",
      gameId: null,
      openQuestions: [
        "Whether personhood survives inside it. Canon records the behaviour and settles nothing.",
        "What coordinates [[heartfen]], given that it is demonstrably not this.",
      ],
    },
  },
  {
    kind: "ITEM" as const,
    slug: "blackweir-heart",
    title: "Blackweir Heart",
    summary: "The filtration organ at the junction of body and network — the weir's single largest sink.",
    body: `The Blackweir Heart is the organ where [[elias-vey]] stops being an animal and starts being infrastructure: a dense, root-threaded filtration mass the size of a barrel, banded with conduit, still holding a charge hours after it is cut free. It is the highest-grade sink material anyone has ever recovered and the only one taken from a source that was maintaining itself.

Taking it is not a harvest. It is a decommissioning. [[blackweir]] concentrates Blackbloom drawn from the whole upstream Reach, and the Heart is the largest single reason the concentration stays put. Removing it ends the weir as a containment structure — not immediately, and not visibly, which is the problem: the ledger of what it was holding comes due somewhere downstream, on a schedule nobody has modelled, under [[harvesting-consequences]].

Every institution with a claim on it wants it for a different reason and none of them will fund the survey that would say what its removal costs.`,
    meta: { category: "Mythic biological component", rarity: "unique", origin: "The Blackweir Anaconda; there is one", gameId: null, openQuestions: [] },
  },
  {
    kind: "ITEM" as const,
    slug: "anaconda-hideplate",
    title: "Anaconda Hideplate",
    summary: "Reactor-resistant, Blackbloom-adaptive plate cut from something that spent twenty years in the worst water in the region.",
    body: `A single overlapping plate off [[the-blackweir-anaconda]], laminated by two decades of saturation it was designed to survive rather than merely endure. It holds against reactor discharge, sheds contaminated water instead of soaking it, and — the part that makes armourers argue — keeps adapting slowly to whatever keeps hurting it, at a rate measured in seasons rather than fights.

This is the clean drop. Unlike the [[blackweir-heart]], the plates were doing nothing for the weir's containment; they were doing something for him. Taking them costs the region nothing and costs him everything, which is a distinction the [[wardens-monster-hunter-guild]] considers academic and [[meridian-arcane-institute]] does not.`,
    meta: { category: "Mythic armour material", rarity: "very rare", origin: "The Blackweir Anaconda", gameId: null, openQuestions: [] },
  },
  {
    kind: "ITEM" as const,
    slug: "mutated-fang",
    title: "Mutated Fang",
    summary: "A recurved fang the length of a forearm, mineral-banded to the root, valued as advanced weapon stock.",
    body: `Crafting stock from [[the-blackweir-anaconda]]: recurved, hollow, and banded with mineralization up the root in growth rings you can count. The rings do not match the seasons. They match [[reactor-cycles]] — one band per purge, laid down while he was anchored and drawing — which makes a single fang the most complete record of Southreach sector behaviour anybody holds, and means the first people to want one were not weaponsmiths.

Worked into a blade or a head, it carries what it is: it takes an edge that resists corrosion the way he did, and it keeps a trace of the [[blackbloom-exposure]] it grew in, which is a licensing problem for whoever ends up carrying it.`,
    meta: { category: "Mythic crafting material", rarity: "rare", origin: "The Blackweir Anaconda", gameId: null, openQuestions: [] },
  },
];

// ------------------------------------------------------------------ the board

const nodes: NodeSpec[] = [
  {
    key: "the-posting",
    kind: "QUEST_START",
    title: "Three Notices, One Animal",
    summary: "The board at Cairnwood carries the same bounty three times, from three parties who want three different corpses.",
    status: "CANON",
    x: 0,
    y: 0,
    body: `The board outside the equipment shed at [[cairnwood-camp]] carries the same bounty three times, pinned over each other by people who were not speaking.

[[aegis-extraction-consortium]] wants the interference with licensed harvest stopped. The notice is a procurement form. It specifies a resolution and does not specify a condition, which is the politest way anyone has found to write *we do not care what state it is in*.

[[wardens-monster-hunter-guild]] wants it dead, and their notice is the only one with a number on it. Recovered hunters, by season, going back eleven seasons. The bottom of the column is not a total. It is the most recent tag, and it is past three hundred, and the sequence does not skip.

[[meridian-arcane-institute]] wants it studied and wants nobody near it. Its notice is a single standing line reproduced from a classified file, and it is not written the way a hazard warning is written:

**DO NOT ATTEMPT TO CONTACT VEY.**

Not *do not approach*. Not *do not engage*. Contact. Somebody at Meridian decided, in writing, that the danger was a conversation.

None of the three will withdraw. Whichever you satisfy, you fail the other two.`,
  },
  {
    key: "what-tomas-knows",
    kind: "DIALOGUE",
    title: "The Man Who Can Read It",
    summary: "You bring the Meridian notice to the only person in the camp who can authenticate Southreach language. He has been waiting twenty years to be asked.",
    speakerSlug: "tomas-vey",
    status: "CANON",
    x: -280,
    y: 220,
    body: `[[tomas-vey]] reads Southreach the way other people read weather. Old interlock language, sector shorthand, the difference between a load order and a request — he is the reason half the expeditions out of Cairnwood come back, and he has spent two decades being the man whose testimony does not quite line up with the official sequence.

You put the Meridian line in front of him because he can tell you whether it is a safety instruction or an admission.

He does not answer that question. He looks at the name for longer than the sentence needs, and when he speaks it is about the requisition attached behind it — the original authorisation for the filtration prototype in Sublevel 4, signed in a hand he has known his whole life.

He does not volunteer the rest. He has thought carefully, for twenty years, about how the sentence *my brother is down there* would be filed by the same institutions that filed everything else he said.

But he does not lie to you either, and he is very tired.`,
  },
  {
    key: "ask-him-straight",
    kind: "CHOICE",
    title: "Whose Handwriting",
    summary: "He has given you the requisition and stopped. What you do with the silence is yours.",
    status: "CANON",
    x: -280,
    y: 440,
    body: `The requisition is on the table between you. He has not covered it and he has not pushed it across.

There is a version of the next thirty seconds where nobody says anything and you both go on being professionals. He would take that. He has taken it several hundred times, once for every tag in the Wardens' column, and he is not going to be the one who breaks it.`,
  },
  {
    key: "the-arranged",
    kind: "QUEST_STEP",
    title: "The Catalogue",
    summary: "The recovered hunters are not a kill site. They are a study, and it has been running for twenty years.",
    status: "CANON",
    x: 0,
    y: 660,
    completion: "Read the arrangement. Then decide whether you still want the bounty.",
    body: `They are in the shallows above the resin beds, where the light reaches.

Not dumped. Not fed on. Supine, arms at their sides, feet toward the water, in a row that carries on past where you are willing to walk. Every one of them in the same posture — not a similar posture, the same one, the way a thing is laid out when the layout is part of the record.

Each has a disc of set [[blackweir-resin]] pressed at the throat, and each disc carries a number pressed into it while the resin was soft. The numbers are sequential. They run past three hundred. **There are no gaps.**

Whatever else is true about what is under this water, it has kept its records for twenty years, it has kept them accurately, and it did not miss a single one.

The hardest part is not the bodies. It is that the arrangement is careful. Somebody down there is still doing the part of the job that involves respect for the sample.`,
  },
  {
    key: "into-the-channels",
    kind: "QUEST_STEP",
    title: "The Weir Is Awake",
    summary: "Blackweir's water level, its channels and its temper are all downstream of whatever the reactor sector is doing today.",
    status: "CANON",
    x: 0,
    y: 880,
    completion: "Get into the channels while the sector state still permits a way out.",
    body: `[[blackweir]] is not one place. It is whatever [[reactor-cycles]] is currently doing to it.

In a Dormant Interval the water is at its lowest and you can walk most of it, which is also when he is hardest to find. Under Stabilization the pylons take load and everything in the channels gets faster. A Sector Restart cycles the old gates and the route you came in by stops existing behind you. Venting fills the basin with plume and neither of you can see. Purge is the sequence he was built for. Overflow closes his wounds as fast as you open them.

Containment Breach is not a state you fight in. It is a state you are already too late for.

The forecast is [[tomas-vey]]'s, and he is careful to say it is a forecast. The pylons standing over the channels can be sabotaged, and every one you drop takes a piece of the containment down with it — that is not a penalty the quest applies, it is what the pylon was doing.

There are two ways down to the beds.`,
  },
  {
    key: "the-mire-stalker",
    kind: "QUEST_STEP",
    title: "Phase One — He Corrects You",
    summary: "Something upright and enormous comes out of knee-deep water wearing a research coat, and it is not angry with you.",
    speakerSlug: "elias-vey",
    status: "CANON",
    x: 0,
    y: 1100,
    completion: "Take the Mire Stalker below half.",
    body: `He comes out of water that was not deep enough to hold him.

Upright, heavily serpentine, built on a frame that still remembers shoulders — and wearing the remains of a Southreach research coat and equipment harness, grown into the hide at the shoulders twenty years ago, at the point where taking it off stopped being possible and then stopped being desirable.

He fights the way a specialist works. Repeat a dodge to one side and he starts covering that side. Heal on a particular tell and that attack becomes an interrupt. Take to the water and the water is his; that was the entire point of him.

And under it, the thing that should frighten you more than the reach: he carries the region's own [[adaptive-mutation]] rule at its Advanced rung. Every damage type halved except one, and that one hurts. Let him break contact into deep water and come back, and the exception has moved. What takes a whole season out in [[long-graze]] takes him ninety seconds, in front of you, because the ladder is his.

He talks the entire time. Not taunts.

Corrections.`,
  },
  {
    key: "he-stops-moving",
    kind: "SCENE",
    title: "He Stops Moving",
    summary: "You are winning. That is the last thing about this fight you will be right about.",
    status: "CANON",
    x: 0,
    y: 1320,
    body: `You are winning. He is down past half, he has stopped closing, and for one clean second the fight looks finished.

Then he stops moving entirely, and the arms go into the torso.

The legs fuse. The spine runs out past where a spine stops. The coat tears off him and goes down into the water and stays there, turning slowly, the last piece of Southreach anybody will ever recover from Sublevel 4. Every pylon over the channels comes up to full load at once and pushes contaminated Essence into him in a volume that should end anything, and his scales split along their length to let what is underneath finish opening.

Then the camera pulls back far enough to show you the shape of the thing you have been fighting, and the arithmetic goes wrong: the silhouette is already too long for the pose it started in, and it keeps going, and it is still going.

The humanoid was never his form.

It was the shape he had been **holding** — for twenty years, awake, at a cost nobody measured — because at some point he stopped being able to tell the difference between maintaining a human silhouette and remaining a person, and he was not willing to find out which one he had already lost.

He lets go of it to kill you. That is what it costs him, and he pays it without hesitating, and that is the most human thing he does in the entire fight.`,
  },
  {
    key: "the-blackweir-coil",
    kind: "QUEST_STEP",
    title: "Phase Two — The Blackweir Coil",
    summary: "Forty to sixty metres of anaconda that is also civil engineering, and the arena is part of its body.",
    status: "CANON",
    x: 0,
    y: 1540,
    completion: "Bring down the Coil, or get out of the channels alive.",
    body: `Old Southreach identification plates set into the scales at angles that were correct when they were fitted to walls. Laboratory armatures grown through the flanks. Dim banded conduits running the length of a spine that used to be a spine. Resin packed between the plates because the plates are a place resin collects.

And sections of him that do not end — that run into root mass and channel gate and sink bed and simply continue, because the weir and the animal stopped being separable a long time before you got here.

He does not use abilities so much as use the room. The channels flood on his word because he built the channels. Cover closes. The bed you are standing on erupts. He goes under and the water tells you nothing, and if you let him stay under and come back, he comes back a rung higher — his ladder, aimed the correct way for the first time in its existence.

The pylons are still sabotageable. They are also still the only thing holding the upstream load. You may notice, somewhere around the third one, that you are winning this fight by doing his job badly.`,
  },
  {
    key: "what-he-says-at-the-end",
    kind: "CHOICE",
    title: "What He Says at the End",
    summary: "He is finished, he knows it, and he uses the time to tell you what he is. He is wrong, and there is no way for you to know that here.",
    speakerSlug: "elias-vey",
    status: "CANON",
    x: 0,
    y: 1760,
    body: `He stops fighting before he has to.

Not collapse — a decision, made early, the way you shut down a process rather than let it fail. The coils go slack across the causeways and the conduits along his back drop to almost nothing, and in the quiet you can hear the channels working, which you have not been able to hear all day.

Then he tells you what he is, in the voice of a man stating his job.

He is not boasting. There is no grandeur in it at all. He is briefing you, because in his assessment you are about to take custody of a system you do not understand, and the responsible thing is a handover.

Everything he says about [[blackweir]] is true, verifiable, and worse than you were expecting.

Everything he says about [[the-living-marsh]] is false, and there is no instrument here, and no argument you have, and no way at all for you to know that standing in this water.`,
  },
  {
    key: "the-weir-has-no-keeper",
    kind: "ENDING",
    endingKind: "NEUTRAL",
    title: "The Weir Has No Keeper",
    summary: "You finish it. The bounty pays. Blackweir stops being a containment structure and starts being a place.",
    status: "CANON",
    x: -320,
    y: 1980,
    effects: [
      "set flag: the-weir-has-no-keeper",
      "Blackweir is no longer maintained: channels stop closing ahead of surges, and no section is ever sacrificed to save another again.",
      "The bounty pays out. Aegis and the Wardens both file it satisfied; Meridian files a loss and does not say of what.",
      "The catalogue is recovered. Three hundred-odd families learn where, and in what order, and in what condition.",
    ],
    rewards: [
      "Blackweir Heart — the weir's largest sink, and the harvest that ends it as containment",
      "Anaconda Hideplate and Mutated Fang",
      "Blackweir Resin at a grade nobody has assayed",
      "Standing with Aegis and the Wardens; standing lost with Meridian",
    ],
    body: `It takes a long time and it is not difficult at the end, because he stopped.

The bounty pays. Two of the three issuers file it satisfied, and the third files something else. The catalogue comes out of the shallows over four days, in order, because taking them out of order felt wrong to everybody on the recovery detail and nobody could say why out loud.

Then the weir goes on working, and that is the part nobody is ready for.

Not perfectly. Blackweir was two things — an ancient wetland doing what wetlands do, and an engineered discipline laid over it by somebody who was awake for twenty years — and only the second one died in the water. Channels no longer close ahead of surges. No section is ever spent to save another again. The sink beds do what sink beds do, at the rate an unattended sink bed does it, which is a rate somebody upstream is going to have to learn.

[[keira-ansel]] gets her instruments into the basin inside a week and finds exactly what she expected and hoped not to: the loss is local, sharp, and entirely confined to the engineering. Nothing that was ever measured at [[heartfen]] changes at all.

She writes that up in one sentence and then sits with it for a long time, because the sentence proves a dead thing was lying and does not tell her who is telling the truth.

At Cairnwood, [[tomas-vey]] is given the requisition back. He does not read it again. He asks one question, about whether it was quick, and accepts the answer he is given without checking it against anything, which is the only time in twenty years he has done that.`,
  },
  {
    key: "left-in-the-water",
    kind: "ENDING",
    endingKind: "NEUTRAL",
    title: "Left in the Water",
    summary: "You break contact and go. Everything he said stays true, and so does everything he was wrong about.",
    status: "CANON",
    x: 320,
    y: 1980,
    effects: [
      "Blackweir stays maintained. Channels keep closing ahead of surges; the weir keeps spending sections of itself to hold the line.",
      "The bounty stays open. All three notices stay on the board, and the Wardens' column keeps taking entries.",
      "The party has met Elias Vey and can say so — which is a different problem, because Meridian's file said not to.",
    ],
    rewards: [
      "No bounty payment from any issuer",
      "Meridian standing, quietly and off the record, for the only first-hand account of him that exists",
      "The channels stay closed ahead of surges, which is worth more than the bounty to everyone downstream",
    ],
    body: `You break contact and you walk out of the channels, and nothing stops you, because he was finished before you were.

He does not follow. He does not thank you, and he does not acknowledge the decision at all — as far as he is concerned the foreign material has been removed from the system, which is the outcome he wanted, and the mechanism is not interesting.

Everything he told you about [[blackweir]] stays true. The channels keep closing ahead of surges. Sections keep being spent to save other sections. The upstream load keeps going where it is put, on a discipline that exists because one man decided twenty years ago that machinery was the wrong answer and then made himself into the right one.

Everything he told you about [[the-living-marsh]] stays false, and you still have no way to know it.

The Wardens leave their notice up. The column takes new entries, because he has not changed and neither has anybody who wants what is in those resin beds, and every one of those entries is a person, and the number is still climbing, and you are one of very few people who could have stopped that and did not.

[[tomas-vey]] does not ask you what happened. He looks at you when you come back through the camp and works it out from your face in about a second and a half, and then goes back to the manifold he was rebuilding.

Later that evening he says one thing, to nobody, while cleaning a fitting: that he is glad, and that he is not sure that is the same as thinking it was right.`,
  },
  {
    key: "nobody-came",
    kind: "ENDING",
    endingKind: "NEUTRAL",
    title: "Nobody Came",
    summary: "The bounty stays on the board. The weir keeps working, the column keeps growing, and the region resolves it without you.",
    status: "CANON",
    x: 0,
    y: 2200,
    effects: [
      "The bounty expires unclaimed and is reposted the following season, unchanged.",
      "Blackweir's resin yield rises. Nobody at Aegis asks why a contested bed got more productive.",
      "The Wardens' column takes more entries. Meridian's standing line is never explained.",
    ],
    body: `You were slow, or you never went.

The notices stay up. They yellow, and get pinned over, and get pinned over again. Aegis reposts its procurement form the following season with the same wording and a slightly better rate. The Wardens' column takes more entries, and the numbers pressed into the resin keep running consecutively, and nobody upstream ever learns that the sequence has no gaps because nobody goes to count.

And [[blackweir]]'s resin yield goes **up**.

Aegis notices, files it as a good year, and does not commission the survey that would explain it — which is a shame, because the explanation is legible to anyone who looks: the weir was pushed harder that season, and it took the loss the way it always takes the loss, by spending part of itself and not mentioning it to the people upstream.

That is the whole of it. Nobody came, the region carried it, and the thing that carried it was a man who is not going to be thanked and would not understand why you were offering.`,
  },
];

// The player-facing options. Every labelled edge carries effects: two labelled
// edges to the same target with nothing behind them is a HOLLOW_CHOICE, and
// the release audit blocks on it.
const edges = [
  {
    from: "the-posting", to: "what-tomas-knows", label: "Take it to the man who reads Southreach",
    effects: ["The party works the record before the water, which is the only order that ever produces the requisition."],
  },
  {
    from: "the-posting", to: "nobody-came", label: "Leave it on the board",
    effects: ["The bounty goes unclaimed this season and is reposted the next, unchanged."],
  },
  { from: "what-tomas-knows", to: "ask-him-straight" },
  {
    from: "ask-him-straight", to: "the-arranged", label: "\"Whose handwriting is that?\"",
    effects: [
      "Tomas confirms it out loud: his brother. First time in twenty years anybody has heard him say the name.",
      "The party can name Elias Vey before they ever see him, which changes what the first phase sounds like.",
    ],
  },
  {
    from: "ask-him-straight", to: "the-arranged", label: "\"You've known for twenty years.\"",
    effects: [
      "Tomas does not deny it and does not explain it. He asks, once, what the party intends to do, and does not argue with the answer.",
      "The camp learns nothing; whatever passed on that table stays on it.",
    ],
  },
  {
    from: "ask-him-straight", to: "the-arranged", label: "Take the requisition and say nothing",
    effects: [
      "The silence holds. He files the party as people who do not make a man say a thing out loud, and that is worth more to him than the question was.",
      "The party goes into the channels without the name, and meets it in his own voice instead.",
    ],
  },
  { from: "the-arranged", to: "into-the-channels" },
  {
    from: "into-the-channels", to: "the-mire-stalker", label: "Follow the scar the weir cut in itself",
    condition: "blackweir-arm-sacrificed",
    effects: [
      "The party walks in along the amputation from the purge window — and understands, somewhere along it, that the weir did not lose that arm. Somebody decided to spend it.",
      "The approach is short, dry, and arrives with the party already knowing what they are about to talk to.",
    ],
  },
  {
    from: "into-the-channels", to: "the-mire-stalker", label: "Take the resin road in",
    effects: [
      "The party goes in the way the harvest crews go in, past working beds, and is read as harvest the entire way.",
      "Longer, wetter, and it puts the party in the water before the fight starts — which is where he wanted them.",
    ],
  },
  { from: "the-mire-stalker", to: "he-stops-moving" },
  { from: "he-stops-moving", to: "the-blackweir-coil" },
  { from: "the-blackweir-coil", to: "what-he-says-at-the-end" },
  {
    from: "what-he-says-at-the-end", to: "the-weir-has-no-keeper", label: "Finish it",
    effects: ["The bounty is claimed and Blackweir stops being maintained."],
  },
  {
    from: "what-he-says-at-the-end", to: "left-in-the-water", label: "Break contact and go",
    effects: ["The weir keeps its keeper, and the Wardens' column keeps taking entries."],
  },
];

const links: Array<{ node: string; slugs: string[] }> = [
  { node: "the-posting", slugs: ["cairnwood-camp", "aegis-extraction-consortium", "wardens-monster-hunter-guild", "meridian-arcane-institute", "elias-vey"] },
  { node: "what-tomas-knows", slugs: ["tomas-vey", "elias-vey", "southreach-complex", "cairnwood-camp"] },
  { node: "ask-him-straight", slugs: ["tomas-vey", "elias-vey"] },
  { node: "the-arranged", slugs: ["blackweir", "blackweir-resin", "the-blackweir-anaconda", "wardens-monster-hunter-guild"] },
  { node: "into-the-channels", slugs: ["blackweir", "reactor-cycles", "tomas-vey", "harvesting-consequences", "the-living-marsh"] },
  { node: "the-mire-stalker", slugs: ["elias-vey", "the-blackweir-anaconda", "adaptive-mutation", "blackweir", "long-graze"] },
  { node: "he-stops-moving", slugs: ["elias-vey", "the-blackweir-anaconda", "southreach-complex", "essence"] },
  { node: "the-blackweir-coil", slugs: ["the-blackweir-anaconda", "blackweir", "marsh-absorption", "blackweir-resin"] },
  { node: "what-he-says-at-the-end", slugs: ["elias-vey", "the-living-marsh", "blackweir", "heartfen"] },
  { node: "the-weir-has-no-keeper", slugs: ["keira-ansel", "heartfen", "tomas-vey", "blackweir", "blackweir-heart", "anaconda-hideplate", "mutated-fang"] },
  { node: "left-in-the-water", slugs: ["elias-vey", "blackweir", "the-living-marsh", "tomas-vey", "wardens-monster-hunter-guild"] },
  { node: "nobody-came", slugs: ["blackweir", "blackweir-resin", "aegis-extraction-consortium", "wardens-monster-hunter-guild"] },
];

// ---------------------------------------------------------------- the dialogue

type LineSpeaker = { slug: string } | { role: string };
type LineSpec = { number: number; speaker: LineSpeaker; text: string; performance?: string; intensity?: number; emotion?: string[] };

const c = (slug: string): LineSpeaker => ({ slug });
const line = (number: number, speaker: LineSpeaker, text: string, extra: Partial<Omit<LineSpec, "number" | "speaker" | "text">> = {}): LineSpec =>
  ({ number, speaker, text, ...extra });

const lineSets: Array<{ node: string; lines: LineSpec[] }> = [
  {
    node: "what-tomas-knows",
    lines: [
      line(1, c("tomas-vey"), "Where did you get this?", { performance: "quiet, and too fast — the first thing out of him", intensity: 5, emotion: ["afraid"] }),
      line(2, c("tomas-vey"), "That's not a hazard notice. Hazard notices say approach. That one says contact.", { performance: "professional again, rebuilding the wall", intensity: 4, emotion: ["dry"] }),
      line(3, c("tomas-vey"), "Sublevel 4 was filtration research. Prototype work. It had one authorisation on it and I have known that handwriting my whole life.", { performance: "slow; each clause costs something", intensity: 5, emotion: ["sad"] }),
      line(4, c("tomas-vey"), "I can authenticate the terminology. That is what I do. I have never been able to authenticate why.", { performance: "the line he has hidden behind for twenty years", intensity: 4, emotion: ["dry", "sad"] }),
      line(5, c("tomas-vey"), "Ask me the question or don't. I'm not going to be the one who says it first.", { performance: "not hostile; exhausted", intensity: 5, emotion: ["sad", "protective"] }),
    ],
  },
  {
    node: "the-mire-stalker",
    lines: [
      line(1, c("elias-vey"), "Stop disturbing the filtration network.", { performance: "level, unhurried; a correction, not a threat", intensity: 4, emotion: ["calm", "command"] }),
      line(2, c("elias-vey"), "You are introducing foreign material.", { performance: "the same tone as the first, which is the frightening part", intensity: 4, emotion: ["calm"] }),
      line(3, c("elias-vey"), "You favour that side. You have favoured it four times.", { performance: "an observation being written down", intensity: 5, emotion: ["dry"] }),
      line(4, c("elias-vey"), "There is nothing in this basin that is not load-bearing. Including the water you are standing in.", { performance: "explanatory; he genuinely wants them to understand", intensity: 5, emotion: ["calm"] }),
      line(5, c("elias-vey"), "You will not be the first sample. You will not be the last one either.", { performance: "no relish in it whatsoever", intensity: 6, emotion: ["dry", "contempt"] }),
      line(6, c("elias-vey"), "Then I will remove you myself.", { performance: "flat, and final; the decision has already been taken", intensity: 7, emotion: ["command"] }),
    ],
  },
  {
    node: "what-he-says-at-the-end",
    lines: [
      line(1, c("elias-vey"), "Stop. You have done enough damage for one afternoon.", { performance: "almost gentle; he has decided to stop before he had to", intensity: 4, emotion: ["calm"] }),
      line(2, c("elias-vey"), "Listen, because there is no one else to hand this to and you are what arrived.", { performance: "a handover briefing, delivered to the wrong people", intensity: 5, emotion: ["command"] }),
      line(3, c("elias-vey"), "The weir closes its channels before a surge because I close them. It spends its own root fields to save the beds below because I decide which ones.", { performance: "stating a job", intensity: 5, emotion: ["calm"] }),
      line(4, c("elias-vey"), "The arm it lost in the purge window — that was mine. I chose it. There was no time to choose better.", { performance: "no self-pity at all; a procedural note", intensity: 5, emotion: ["dry", "sad"] }),
      line(5, c("elias-vey"), "I am the marsh. I have been the marsh for twenty years. Whatever you have been told is coordinating this wetland, it is me, and when I stop, it stops.", { performance: "absolute certainty, stated the way a man states his job title", intensity: 6, emotion: ["calm", "command"] }),
      line(6, c("elias-vey"), "So finish it or don't. But be clear with yourself about which of those you are choosing.", { performance: "he is not pleading; he is closing a file", intensity: 5, emotion: ["dry"] }),
    ],
  },
];

// ------------------------------------------------------------- the appended layers

/**
 * Appended below owner prose, each behind its own marker so a re-run replaces
 * its own block instead of stacking a third copy — the environment design note
 * grew three of those before anybody noticed.
 */
const layers = [
  {
    slug: "adaptive-mutation",
    marker: "## Where it came from",
    // Evidence, never his testimony. He has never claimed this and must not:
    // the moment he boasts about it, the design collapses into a boast.
    text: `An assay run on tissue recovered from [[blackweir]] matches all five mutation families — vascular overgrowth, mineralization, capacitance, sensory adaptation, and machine graft — back to a single engineered signature: the Southreach filtration prototype authorised for Sublevel 4 and activated during [[the-bloomfall]] by [[elias-vey]].

The ladder is not a property of the Blackbloom. It is an organism, loose in the biosphere for twenty years, doing exactly what it was designed to do — adapt to what is hurting it and keep the host working — in every eligible species in the region.

That is why Adaptive Mutation is Bloomfall Reach's signature rule and nowhere else's. It did not arise here. It was released here, by one man, on purpose, as a containment measure, and it worked far better and far more widely than the specification asked for.

[[meridian-arcane-institute]] has the result and has published nothing. [[elias-vey]] has never mentioned it, in twenty years, to anyone — not as a secret, but because to him it is the part of the design that worked and therefore the part that is not interesting.`,
  },
  {
    slug: "aberrant-escalation",
    marker: "## The three nobody can cause",
    text: `Two named threats here have always been exceptions to the 1% seed: [[switchmother]], who was engineered by somebody else, and [[the-last-shift]], which was a shift. [[the-blackweir-anaconda]] is the third, and it completes the shape — engineered, human, and self-engineered.

No player action produces him. No Advanced individual escapes into him, no saturation band promotes him, and there is no successor: he was already here, he has been here for twenty years, and the bounty on him is standing rather than triggered.

He also sits a rung above the designation this page describes. **Mythic** is what a named entity is called when killing it changes how the region works rather than who is standing in it. Like Aberrant, it is an orthogonal tag — never a race, never a parent taxonomy, and never the [[mythical]] species shelf. There is one per region. This is the Reach's, and the rest of those slots are reserved rather than empty.`,
  },
];

// ---------------------------------------------------------------------- runner

const db = getPrismaClient();

/** Content words the append must not have cost the owner's prose. */
const contentWords = (text: string) =>
  new Set((text.toLowerCase().match(/[a-z][a-z'-]{3,}/g) ?? []).filter((word) => !["this", "that", "with", "from", "they", "them", "then", "than", "have", "been", "were", "what", "when", "which", "into", "over", "only", "also", "does", "each", "more", "most", "some", "such", "would", "could", "there", "their", "these", "those"].includes(word)));

async function main() {
  const apply = process.argv.includes("--apply");
  const [identity] = await db.$queryRaw<Array<{ database: string }>>`SELECT current_database() AS database`;
  const actor = await db.user.findFirstOrThrow({ where: { role: "ADMIN", isActive: true }, orderBy: { id: "asc" }, select: { id: true } });

  const entryChanges: string[] = [];
  const lineChanges: string[] = [];
  const layerChanges: string[] = [];

  /**
   * Appends below the owner's prose, behind each layer's own marker so a
   * re-run replaces its own block rather than stacking a third copy.
   *
   * The word check is the part that matters. Appending cannot lose words in
   * theory; in practice a marker that drifts silently turns an append into a
   * truncation, and this is the method that caught 64 dropped author words on
   * the Arcadia districts. It refuses rather than reporting.
   */
  async function reconcileLayers() {
    for (const layer of layers) {
      const entry = await db.storyEntry.findUnique({ where: { slug: layer.slug }, select: { id: true, body: true } });
      if (!entry) { layerChanges.push(`MISSING ${layer.slug}`); continue; }
      const existing = entry.body ?? "";
      const above = existing.includes(layer.marker) ? existing.slice(0, existing.indexOf(layer.marker)).trimEnd() : existing.trimEnd();
      const next = `${above}\n\n${layer.marker}\n\n${layer.text}`;
      if (existing === next) continue;

      // Checked against the prose ABOVE the marker, never the whole body: this
      // guards the author's words. A re-run is allowed to rewrite our own
      // layer, and is not allowed to touch anything above it.
      const kept = contentWords(next);
      const lost = [...contentWords(above)].filter((word) => !kept.has(word));
      if (lost.length > 0) {
        layerChanges.push(`REFUSED ${layer.slug}: the append would cost ${lost.length} author words — ${lost.slice(0, 12).join(", ")}`);
        continue;
      }
      layerChanges.push(`${existing.includes(layer.marker) ? "replace" : "append"} layer on ${layer.slug} (0 words lost)`);
      if (!apply) continue;
      await db.storyEntry.update({ where: { id: entry.id }, data: { body: next, version: { increment: 1 }, updatedByUserId: actor.id } });
    }
  }

  // 1. The entries first: a StoryLine speaker must already be a CHARACTER in
  //    the bible, and BoardWriter refuses a node naming a speaker that is not.
  for (const seed of entrySeeds) {
    const current = await db.storyEntry.findUnique({ where: { slug: seed.slug } });
    const meta = seed.meta as unknown as Prisma.InputJsonValue;
    if (!current) {
      entryChanges.push(`create ${seed.kind} ${seed.slug}`);
      if (!apply) continue;
      const created = await db.storyEntry.create({ data: {
        kind: seed.kind, slug: seed.slug, title: seed.title, summary: seed.summary,
        body: seed.body, meta, status: "CANON", createdByUserId: actor.id,
      } });
      await db.storyRevision.create({ data: {
        entityType: "ENTRY", entityId: created.id, action: "CREATED", actorUserId: actor.id,
        summary: `Bloomfall: filed ${seed.title} for the Blackweir Anaconda`,
      } });
      continue;
    }
    const same = current.title === seed.title && current.summary === seed.summary && current.body === seed.body
      && stableJson(current.meta) === stableJson(seed.meta);
    if (same) continue;
    entryChanges.push(`update ${seed.kind} ${seed.slug}`);
    if (!apply) continue;
    await db.storyEntry.update({ where: { id: current.id }, data: {
      title: seed.title, summary: seed.summary, body: seed.body, meta,
      version: { increment: 1 }, updatedByUserId: actor.id,
    } });
  }

  const writer = new BoardWriter(db, actor.id, apply);

  // 2. The flag. Never plant one without deciding where it is answered: this
  //    one is set on the kill ending and checked at root-of-the-bargain, and
  //    that check is the whole refutation of his claim.
  await writer.flag(
    "the-weir-has-no-keeper",
    "The Weir Has No Keeper",
    "Blackweir's engineered discipline died with the man running it. The channels no longer close ahead of a surge, and the ancient wetland underneath goes on exactly as before.",
    `Set in [[the-blackweir-bounty]]. Checked in [[root-of-the-bargain]].

[[elias-vey]] is dead, and everything he said about [[blackweir]] turns out to have been true: no section is ever spent to save another again, and no channel closes before a surge reaches it. That loss is sharp, local, and entirely confined to the engineering.

Everything he said about [[the-living-marsh]] turns out to have been false. [[nalia-reed]] goes back to [[heartfen]] afterward and repeats the exchange, and it works, on the same terms, on the same schedule. Nothing measured there changes at all.

[[keira-ansel]] holds the line she always held: coordination is measured fact and consciousness is unproven. What the region now also knows is that a thing which lived inside the system for twenty years came back with an answer, stated it with total certainty, and was wrong — which settles nothing, and makes every other confident account of this wetland worth less than it was yesterday.`,
  );

  // 3. The board. BoardWriter has no arc(), and arcFields throws on an arc
  //    that does not exist yet — so the row is opened here, the way the seed
  //    scripts do it. CONTRACT is "a bounty posted at a place", so the region
  //    is required rather than decorative: it is where you read the notice,
  //    and it is where his brother lives.
  const arcRow = await db.storyArc.findUnique({ where: { slug: ARC }, select: { id: true, category: true, regionEntryId: true } });
  const posting = await db.storyEntry.findUnique({ where: { slug: "cairnwood-camp" }, select: { id: true, kind: true } });
  if (!posting || posting.kind !== "REGION") throw new Error("cairnwood-camp is missing; a contract must be posted somewhere real.");

  if (!arcRow) {
    entryChanges.push(`create CONTRACT arc ${ARC} posted at cairnwood-camp`);
    if (apply) {
      const last = await db.storyArc.aggregate({ where: { category: "CONTRACT" }, _max: { position: true } });
      const created = await db.storyArc.create({ data: {
        slug: ARC,
        title: "The Blackweir Bounty",
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
        summary: "Opened the contract \"The Blackweir Bounty\"",
      } });
    }
  } else if (arcRow.category !== "CONTRACT" || arcRow.regionEntryId !== posting.id) {
    entryChanges.push(`refile ${ARC} as a CONTRACT posted at cairnwood-camp`);
    if (apply) {
      await db.storyArc.update({ where: { id: arcRow.id }, data: { category: "CONTRACT", isMainline: false, regionEntryId: posting.id } });
      await db.storyRevision.create({ data: {
        entityType: "ARC", entityId: arcRow.id, arcId: arcRow.id, action: "UPDATED", actorUserId: actor.id,
        summary: "Filed the bounty to Cairnwood Camp, where it is posted",
      } });
    }
  }

  // Everything below needs the arc row to exist. On a first dry run it does
  // not yet, so the board work reports its intent and writes nothing — but the
  // appended layers are independent of the arc and their word-loss check is
  // the whole reason to preview at all, so it always runs.
  if (!apply && !arcRow) {
    await reconcileLayers();
    console.log(JSON.stringify({
      database: identity?.database,
      mode: "PREVIEW",
      entries: entryChanges,
      board: `${nodes.length} scenes, ${edges.length} routes, ${lineSets.reduce((sum, set) => sum + set.lines.length, 0)} spoken lines wait for the arc row`,
      layers: layerChanges.length ? layerChanges : ["unchanged"],
      note: "Re-run with --apply to open the contract, then preview again to diff the board.",
    }, null, 2));
    return;
  }

  await writer.arcFields(ARC, {
    status: "CANON",
    title: "The Blackweir Bounty",
    hook: "Three notices for the same animal, pinned over each other on the board at Cairnwood, from three parties who want three different corpses. The only one with a number on it is the Wardens', and the number is past three hundred, and it does not skip.",
    summary: "The Reach's Mythic. A Southreach biologist fed himself to his own filtration prototype twenty years ago and has been running the Blackweir weir from inside it ever since. He talks, he catalogues the people who come for him, and he will tell you exactly what he is — right about the weir, wrong about the marsh, and there is no way to know that standing in the water.",
  });

  for (const node of nodes) await writer.node(ARC, node);
  for (const edge of edges) await writer.edge(ARC, edge);
  for (const entry of links) await writer.links(ARC, entry.node, entry.slugs);

  // 4. The check that proves him wrong, on the board that asks the question.
  //    root-of-the-bargain is literally "what does an agreement mean when one
  //    party's consciousness is unproven" — so it is where the answer lands.
  await writer.node("root-of-the-bargain", {
    key: "the-keeper-is-gone",
    kind: "SCENE",
    title: "The Keeper Is Gone",
    summary: "Reed repeats the exchange after the thing that claimed to be the marsh has stopped breathing. It works.",
    status: "CANON",
    x: 640,
    y: 240,
    body: `[[nalia-reed]] goes back into [[heartfen]] after [[blackweir]] loses its keeper, and does the one thing that is actually worth doing: she repeats the exchange, unchanged, on the same terms, and writes down what happens.

It works.

The channels open where they opened before. The return is accepted the way it was accepted before. Nothing about the timing moves, and nothing about the schedule cares that the loudest voice in this wetland is dead.

The thing under [[blackweir]] told the people who killed it, with complete certainty, in its own voice, that it was the marsh — that the coordination was its coordination and would stop when it stopped. It has stopped. The coordination has not.

[[keira-ansel]] gets the result before she gets the story, and the note in her margin is the shortest thing in the file: *not him.*

Which is the correct amount of progress: one confident wrong answer has been removed, and no right one has arrived to replace it. Coordination remains measured fact. Consciousness remains unproven. The bargain still holds, and nobody can tell you who is keeping it.`,
    effects: ["The strongest claim ever made about the Living Marsh is disproved by the marsh continuing.", "Consciousness remains unproven; a wrong answer is not a right one."],
  });
  await writer.edge("root-of-the-bargain", {
    from: "fieldwork",
    to: "the-keeper-is-gone",
    label: "Repeat it now that Blackweir has no keeper",
    condition: "the-weir-has-no-keeper",
    effects: ["Reed reruns the exchange after the death and it holds; the claim dies with the claimant and the question survives both."],
  });
  await writer.edge("root-of-the-bargain", { from: "the-keeper-is-gone", to: "regional-decision" });
  await writer.links("root-of-the-bargain", "the-keeper-is-gone", ["nalia-reed", "keira-ansel", "heartfen", "blackweir", "elias-vey", "marsh-absorption"]);

  // 5. The dialogue.
  const nodeId = async (arc: string, key: string) => {
    const arcRow = await db.storyArc.findUnique({ where: { slug: arc }, select: { id: true } });
    if (!arcRow) return null;
    const row = await db.storyNode.findUnique({ where: { arcId_key: { arcId: arcRow.id, key } }, select: { id: true } });
    return row?.id ?? null;
  };
  const speakerData = async (speaker: LineSpeaker) => {
    if ("slug" in speaker) {
      const row = await db.storyEntry.findUnique({ where: { slug: speaker.slug }, select: { id: true, kind: true } });
      if (!row || row.kind !== "CHARACTER") throw new Error(`speaker "${speaker.slug}" is not a CHARACTER in the bible`);
      return { speakerEntryId: row.id, speakerRole: null };
    }
    return { speakerEntryId: null, speakerRole: speaker.role };
  };

  for (const set of lineSets) {
    const id = await nodeId(ARC, set.node);
    if (!id) {
      lineChanges.push(`PENDING ${set.node} (${set.lines.length} lines wait for the node)`);
      continue;
    }
    for (const [index, spec] of set.lines.entries()) {
      const data = {
        ...(await speakerData(spec.speaker)),
        order: index,
        text: spec.text,
        performance: spec.performance ?? "",
        intensity: spec.intensity ?? 5,
        emotion: spec.emotion ?? [],
        locale: "en-US",
        voiced: true,
        retiredAt: null as Date | null,
      };
      const stored = await db.storyLine.findUnique({ where: { nodeId_number: { nodeId: id, number: spec.number } } });
      const label = `${ARC}/${set.node}/${String(spec.number).padStart(2, "0")}`;
      if (!stored) {
        lineChanges.push(`create ${label} "${spec.text.slice(0, 46)}"`);
        if (apply) await db.storyLine.create({ data: { nodeId: id, number: spec.number, createdByUserId: actor.id, ...data } });
        continue;
      }
      const same = stored.speakerEntryId === data.speakerEntryId && stored.speakerRole === data.speakerRole
        && stored.order === data.order && stored.text === data.text && stored.performance === data.performance
        && stored.intensity === data.intensity && JSON.stringify(stored.emotion) === JSON.stringify(data.emotion)
        && stored.voiced === data.voiced && stored.retiredAt === null;
      if (same) continue;
      lineChanges.push(`update ${label}`);
      if (apply) await db.storyLine.update({ where: { id: stored.id }, data: { ...data, updatedByUserId: actor.id } });
    }
  }

  // 6. The appended layers, with a word-level loss check on the owner's prose.
  await reconcileLayers();

  writer.report(apply ? "The Blackweir Anaconda — APPLYING" : "The Blackweir Anaconda — dry run");
  console.log(JSON.stringify({
    database: identity?.database,
    mode: apply ? "APPLY" : "PREVIEW",
    entries: entryChanges.length ? entryChanges : ["unchanged"],
    lines: lineChanges.length ? lineChanges : ["unchanged"],
    layers: layerChanges.length ? layerChanges : ["unchanged"],
  }, null, 2));
}

main().catch((error) => { console.error(error); process.exit(1); }).finally(() => db.$disconnect());
