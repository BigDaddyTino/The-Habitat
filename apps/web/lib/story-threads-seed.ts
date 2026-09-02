import type { StoryCharacterMeta, StoryCompanionCapability, StoryCompanionMissionMeta, StoryCreatureMeta, StoryThreadMeta } from "@habitat/shared";

/**
 * The founding narrative-development seed: Amanda, The Empty Cribs, and her
 * nine-mission companion arc — Travis Martino's Amanda/Tino storyline, landed
 * as BRAINSTORMING material.
 *
 * Everything here is a proposal, and the seed says so in its own text: the
 * kidnappers are TBD, Amanda's true species is the Lizzarnix, the private joke is never
 * to be written, and all quoted dialogue is conceptual. What existing canon
 * already settles (Tino captured alive, the captivity arc owner-gated, the
 * player as his war buddy) is treated as the ground this proposal stands on,
 * and the places where the proposal pushes on canon are called out as open
 * questions instead of silently contradicted.
 *
 * Idempotent by slug, like every codex seed: once a row exists the codex owns
 * it, and this file never overwrites what writers have done since.
 */

export const amandaSeed: { slug: string; title: string; summary: string; body: string; meta: StoryCharacterMeta } = {
  slug: "amanda",
  title: "Amanda",
  summary:
    "A beautiful Lizzarnix hiding as a lizardwoman sorceress — brilliant, vulgar, dangerous, and hunting two answers: where her children went, and what happened to Tino.",
  body: `Her true name is **Am~hors~ormen~da** — her name in the lizard tongue, which most humans cannot pronounce. Somebody once gave up halfway through and called her **Amanda**, and the name stuck. She introduces herself in the lizard tongue first, watches you fail to hold it, then snarls: *someone called me Amanda once. I guess you can just use that.*

She is almost unnaturally attractive — beauty that crosses species boundaries, which should eventually read as a quiet clue that she is not an ordinary lizardwoman at all. People notice Amanda. Men notice her. Women notice her. Creatures notice her. She knows exactly what effect she has and is completely comfortable using it: she flirts, she makes people uncomfortable on purpose, she weaponises attraction when it is the cheapest tool in reach, and she makes deeply inappropriate jokes at the worst possible moments. The game is Mature 17+ and she is written accordingly — but she is never reducible to it. She is also extremely intelligent, magically powerful far beyond what she shows, opinionated, arrogant, funny, fiercely protective of children, and capable of both brutality and immense love.

**The woman the player meets is armor.** Before her children were taken she was wild, playful, affectionate, outgoing — constantly laughing, singing, dancing, mischievous, dangerous but joyful. After the two empty cribs she turned inward: colder, meaner, more suspicious, her humor sharpened into a weapon, her confidence intact but the warmth under it gone. Her anger at the world is grief wearing a different coat. She is still capable of love; she simply refuses to let anyone close enough to hurt her that badly again. The player should keep catching glimpses of the woman underneath — a genuine laugh she immediately regrets, a song she almost hums — and understand, piece by piece, what it cost to bury her.

**The tell.** Whenever someone mentions [[tino]], her body betrays her. Her scales flush red. Smoke coils out of her red hair. When she is truly furious, **her hair catches fire**. The other companions learn to read it — someone tells a Tino story, a thin curl of smoke starts, and everybody in the party goes *oh shit*. It becomes a running joke that is never safe to laugh at out loud.

**What she actually is: [[lizzarnix]].** Half lizard and half phoenix, Amanda belongs to a mythical people the world believes were exterminated for the legendary value of their Essence and the still-greater value of their eggs. Her impossible beauty, heat, smoking hair, instinct for restoration, and the fire beneath her scales are all one truth hiding in plain sight. An ancient creature will eventually recognise her and speak her true name, and it will either bow or be afraid. Possibly both.

The oldest truth is bigger than Amanda. The Lizzarnix gave magic to the races of the world by dying willingly, passing the gift, and being born again from the scaled egg left in their ashes. Civilization kept the magic and forgot its giver. In the deepest structures, weathered murals still show the cycle — flame, gift, ash, egg, return — but no living culture reads them correctly.

Her whole story — the family she built with Tino, the night everything broke, her nine companion missions, her true form, and what she finally does with it — is proposed in [[the-empty-cribs]]. **Nothing in that thread is confirmed canon yet.**`,
  meta: {
    fullName: "Am~hors~ormen~da",
    aliases: ["Amanda"],
    pronouns: "she/her",
    sex: "female",
    species: "Lizzarnix — half lizard, half phoenix; publicly passes as a lizardwoman",
    age: null,
    appearance:
      "Beautiful adult Lizzarnix passing as a red-haired lizardwoman sorceress: fine jewel-toned scales, golden eyes that catch light so intensely they seem almost luminous without actually glowing, and a long elegant scaled tail integrated naturally from her lower spine. Her attraction crosses species lines. Her scales flush red when Tino is mentioned; smoke rises from her hair when she is angry, and it ignites when she is furious.",
    voice:
      "Sharp, vulgar, funny, and faster than everyone else in the room. Flirts as easily as she threatens, often in the same sentence. Under the blade-work there are flashes of the woman who used to sing and dance — a genuine laugh that escapes before she can kill it.",
    voiceProfile: null,
    magic: { origin: "born", schools: ["fire", "restoration", "gift"], corruptionPhase: null, notes: "Native Lizzarnix magic. Her kind gave magic through willing death and resurrection: the gift passed outward, while the giver returned from a scaled egg in the ashes. Amanda hides almost all of that power until [[the-empty-cribs]]." },
    factions: [],
    home: null,
    status: {
      known: "a dangerous, brilliant lizardwoman mercenary-sorceress in the Peninsula, recruitable early",
      actual: "a surviving Lizzarnix, mother of two abducted children, Tino's former partner — and, if The Empty Cribs holds, the one who burns herself away to restore him and leaves a scaled egg in her ashes",
    },
    relationships: [
      { character: "tino", who: null, type: "former partner — they built a life and had two children; she believes he abandoned the family, and does not know whether she wants to embrace him or kill him. Probably both." },
    ],
    background: null,
    professions: [],
    skills: [],
    cybernetics: [],
    storyRole:
      "Companion recruited in the Peninsula whose personal arc quietly carries the campaign's emotional spine: her missions reconstruct the Amanda/Tino family, reverse everything she believed about his disappearance, and end at the Soul Forge of his containment cell.",
    involvement: [],
    gameId: null,
    model: null,
    companion: {
      capable: true,
      availability: "Peninsula / early game — she rescues the player, violently, then joins when she learns who they are looking for",
      status: "Proposed companion (brainstorming) — later beats propose: absent from the roster after her sacrificial burning; her scaled egg remains alive in Tino's care",
    },
    openQuestions: [
      "Who took the children — TBD; deliberately unresolved, potentially its own story thread later.",
      "The private joke she shares with Tino at the reunion — never to be explained anywhere, including this codex.",
      "When Amanda's egg hatches, what she remembers, and what form her rebirth takes.",
    ],
  },
};

export const lizzarnixSeed: { slug: string; title: string; summary: string; body: string; meta: StoryCreatureMeta } = {
  slug: "lizzarnix",
  title: "Lizzarnix",
  summary:
    "The lost upright humanoid half-lizard, half-phoenix givers of magic: slain for legendary Essence and priceless eggs until the world forgot that every gift once ended in ash, rebirth, and another gift.",
  body: `A **Lizzarnix** is half lizard and half phoenix: a tall upright humanoid people who stand and walk on two legs, with intelligent clawed hands, elegant reptilian faces, long scaled tails, and great phoenix wings rising from their backs. Adult males are commonly taller and broader, adult females more finely built, but both are scaled, feather-crested, fire-blooded, impossibly beautiful, and equally powerful. Their gold eyes can appear almost luminous in direct light without emitting any light of their own. They are built around a cycle no other creature shares. When one dies, the body burns completely. The flame collapses into a bed of warm ash, and in that ash remains a beautiful scaled egg. Given time and protection, the Lizzarnix is born again.

**They gave magic to the races of the world.** Before infusion rigs, extraction refineries, or schools that could name what they taught, a Lizzarnix could choose to die and pass part of its native magic into another living soul. Death was the price of the gift, but not the end of the giver: ash became egg, egg became life, and the restored Lizzarnix could one day give again. The third origin in [[the-three-origins-of-magic]] is the surviving shape of that covenant. It is not a fourth origin and never was.

That truth is gone from living history. No modern nation remembers where gifted magic began. The deepest pre-state ruins still carry murals of scaled fire-creatures surrounded by the ancestors of many races: flame leaving an opened breast, kneeling figures rising crowned in light, then ash, egg, hatching, and the same creature returning. Scholars catalogue the sequence as solar worship, a funeral cult, or dynastic allegory because the name **Lizzarnix** disappeared before their languages began.

**The extinction was an industry.** Lizzarnix Essence was legendary in purity, density, and stability. Their eggs were worth more still: concentrated life, rebirth, magic, and a future supply of all three inside one shell. Hunters, kings, early refiners, and the ancestors of today's extraction powers turned the covenant into inventory. Forced extraction killed without completing the sacred cycle; viable eggs were stolen, consumed, dissected, or locked away. The world calls the species extinct because greed succeeded so completely that even the reason for the slaughter was lost. [[the-harvest-economy]] is not merely similar to that crime. It descends from it.

The ending proposed in [[the-empty-cribs]] reveals [[amanda]] as a surviving Lizzarnix. When she spends herself restoring [[tino]], she does not leave a corpse. She burns into a column of living fire, collapses into ash, and leaves one radiant, beautifully scaled egg. Tino carries it after the facility — wrapped, guarded, spoken to when nobody is listening — while the world continues believing the Lizzarnix are gone.

For writers: public knowledge stops at *extinct mythical creature; Essence legendary; eggs priceless*. The origin of gifted magic, the voluntary death-and-return covenant, Amanda's identity, and the egg Tino carries are ending-tier truths. Ancient walls may show the truth, but nobody should correctly explain those images before Amanda makes them readable.`,
  meta: {
    category: "magical",
    parent: "mythical",
    biomes: [],
    threat: "Legendary when threatened; a Lizzarnix can weaponize fire, restoration, and the same life-giving force ancient peoples received as magic.",
    harvest: "Legendary-grade Essence; scaled rebirth eggs historically valued above kingdoms. Forced extraction interrupts the resurrection cycle and kills permanently.",
    gameId: null,
    openQuestions: [
      "Where Amanda's line survived while the rest were exterminated.",
      "When Amanda's egg hatches, what she remembers, and whether rebirth changes her apparent age or form.",
      "Whether any stolen Lizzarnix eggs remain sealed in an ancient vault or private collection.",
      "Who took Amanda and Tino's children — still deliberately TBD.",
    ],
  },
};

/**
 * Additive live-Codex patches for records that predate the Lizzarnix decision.
 * The original world-bible and system seeds carry the integrated versions for
 * clean installs; these paragraphs migrate an existing writers' room without
 * overwriting the work already done there.
 */
export const lizzarnixLorePatches: ReadonlyArray<{ slug: string; body: string; pillar?: string }> = [
  {
    slug: "the-three-origins-of-magic",
    body: `**The buried origin.** Before written history, the [[lizzarnix]] gave magic to the races of the world. They died willingly, passed native magic into another soul, and returned from scaled eggs in their ashes. Direct gifts became the third origin; gifts that endured through descendants seeded some bloodlines now called born magic. This is not a fourth origin — it is the forgotten beginning of the first and third.`,
  },
  {
    slug: "the-taxonomy-of-monsters",
    body: `The [[lizzarnix]] are native magical creatures: neither demons, monstrosities, nor abominations, despite the frightened categories later cultures forced onto them. Their half-lizard, half-phoenix form and death-and-rebirth cycle belong to the world's original magical ecology.`,
  },
  {
    slug: "the-harvest-economy",
    body: `The oldest atrocity in the harvest economy is the apparent extinction of the [[lizzarnix]]. Their Essence was legendary; their scaled rebirth eggs were worth more still. Early hunters learned to turn a willing gift-and-return covenant into forced death without return. The modern industry inherited that crime and forgot what it had destroyed.`,
  },
  {
    slug: "essence",
    body: `[[lizzarnix]] Essence survives in the oldest ledgers as the legendary upper bound: unnaturally pure, stable across incompatible schools, and valuable beyond modern assay. Their eggs were priced higher still because each held concentrated magic, resurrection, and a future source in one living shell.`,
  },
  {
    slug: "magic",
    body: `**The forgotten beginning.** [[lizzarnix]] explains why the three origins have their shape. Those half-lizard, half-phoenix beings gave magic willingly through death and rebirth; direct gifts became gifted magic, while gifts carried through descendants seeded born bloodlines. Civilization kept both roads, exterminated the givers for their Essence and eggs, and forgot where either began.`,
    pillar: "The Lizzarnix are the forgotten giver behind gifted magic and the first born bloodlines",
  },
  {
    slug: "the-soul-forge",
    body: `The only natural cycle that resembles reclamation belongs to the supposedly extinct [[lizzarnix]]. They could die, give magic outward, and return from scaled eggs without a Core, stored Echo, or harvested fuel. Ancient Forge ornament repeats the same flame-ash-egg sequence, but resemblance is not proof: nobody knows whether Forge builders copied the Lizzarnix, served them, or merely understood the same law of soul and vessel.`,
    pillar: "Lizzarnix rebirth is the only natural cycle that resembles reclamation, but the connection remains unproven",
  },
];

/**
 * Tino's companion capability, applied to his existing CANON dossier without
 * touching anything else on it. Marked as proposal in its own words — the
 * captivity arc is owner-gated canon, and this only says what The Empty
 * Cribs proposes he becomes after it.
 */
export const tinoCompanionPatch: StoryCompanionCapability = {
  capable: true,
  availability: "Late game — proposed: after the events of the-empty-cribs, replacing Amanda's seat in the roster (brainstorming, not confirmed)",
  status: "Not yet a companion — currently captured; see what-the-player-knows-about-tino before writing anything that touches his fate",
};

export const emptyCribsSeed: { slug: string; title: string; summary: string; body: string; meta: StoryThreadMeta } = {
  slug: "the-empty-cribs",
  title: "The Empty Cribs",
  summary:
    "The Amanda/Tino storyline: two stolen children, a lost Lizzarnix bloodline, the legendary Tino boss fight, Amanda's fiery restoration and rebirth egg, and the ending where MARTINO fades to TINO. Brainstorming — argue with it here.",
  body: `**Status: brainstorming. Nothing below is confirmed canon.** The culprit is TBD, every quoted line is conceptual, and the room owns all of it. Amanda's true species is now decided: she is a [[lizzarnix]], one of the supposedly extinct half-lizard, half-phoenix beings that first gave magic to the world's races through death and rebirth. What this thread deliberately builds on top of: existing canon already holds that [[tino]] was **captured alive by an unidentified force** (see [[what-the-player-knows-about-tino]]), that the captivity arc is unwritten and owner-gated, and that his life before the war is an open question. This thread is a proposed answer to those questions.

**The core.** [[amanda]] and [[tino]] were deeply in love — not merely lovers. They built a life. They had **two children**, and for a while they were genuinely happy, young enough to believe they might get to keep it.

**The night everything broke.** One evening they leave the children safely at home and go out — together, alone, for once with nothing terrible happening. No war. No monsters. No mission. No fucking apocalypse. They drink, they dance, they sing, they laugh; maybe Tino embarrasses himself, maybe Amanda embarrasses him worse; they stumble home half drunk, still laughing at some stupid private joke. This memory matters enormously later — it is perhaps the last truly happy night either of them ever had. They open the door. The house is too quiet. In the children's room stand two cribs. **Both are empty.**

**The abduction.** Deliberate, not an accident — there are signs. Who took them is **TBD** and must stay TBD until the room decides. What changes now is the scale of the motive: Amanda's children may carry the first surviving Lizzarnix bloodline in ages. A faction, magical creatures, essence hunters, someone who knows what a Lizzarnix child or egg is worth, an ancient enemy, or something nobody has named could be responsible. The answer stays locked; the legendary value of Amanda's blood makes the empty cribs more dangerous.

**What it does to Amanda.** She turns inward. The wild, laughing, singing woman becomes withdrawn, cold, mean, suspicious, vicious — obsessed with finding the children, her grief disguised as aggression. She is still capable of love; she just refuses to let anyone close enough to hurt her like that again.

**What it does to Tino.** He turns outward. They search together — days, weeks, months; every lead dies, and every dead lead tears them apart a little more. Eventually Tino makes a decision and leaves. **Critical: he did not stop loving Amanda. He did not abandon his family. He left to find their children** — believing that if he brings them home, he can restore what they lost; believing Amanda is too broken to survive the search; maybe never telling her how far he means to go. Maybe she simply wakes one morning and he is gone. From her side it is a second abandonment — first the children disappeared, then Tino did. **This misunderstanding defines everything between them afterward.**

**Amanda's belief.** No letters, no messages, no proof of life. Grief curdles into anger: maybe he stopped looking, gave up, died, found another life, could not face her. Eventually she does not know whether she wants to find Tino so she can embrace him or kill him. Probably both. That ambivalence IS her companion arc.

**The truth.** Tino never stopped. The search took him into worse and worse territory — rumors, infiltrated groups, hunted [[essence]] traffickers, crossed factions, things someone wanted kept hidden — until it got him captured by **[FACTION / ORGANIZATION TBD]**, who began experimenting on him. The very thing Amanda reads as abandonment is what led to his imprisonment. He was still looking for their children.

**The player's connection.** At story milestones the player suffers fragmented visions they cannot place: restraints, surgical lights, essence injections, symbols, chemicals, failed subjects, blood, screams — a man trying to escape, being forced back into containment, remembering a woman, remembering two empty cribs. Early visions are noise; later ones sharpen; eventually the player understands they are somehow experiencing what Tino is going through. (Open question: how this mechanism squares with the player being Tino's war buddy and [[what-the-player-knows-about-tino]] — the vision channel needs a canon explanation of its own.)

**The experiments.** His captors are trying to build a human who survives multiple incompatible essence infusions. Most subjects die. Tino survives — which makes him more valuable, and more dangerous, until he is something between human, magical weapon, experimental organism, and essence host. The visions get worse as he does. (This proposal leans directly on [[essence]], [[the-seven-phases-of-corruption]], and [[the-soul-forge]] — essence is souls, and what they are pushing into him should read as exactly as obscene as canon says it is.)

**Amanda's arc runs through nine companion missions** — see the chain on her dossier: [[the-woman-in-the-peninsula]] through [[the-man-she-never-stopped-loving]]. It starts fun and mysterious, turns tragic in the middle, reverses everything she believed in mission seven, reveals her name in mission eight, and ends inside the facility.

**The reveal.** In containment: Tino — barely recognisable. Essence types moving under his skin, veins glowing, anatomy that temporarily mutates, scars and surgical modification everywhere. Amanda approaches the glass with, for once, no joke, no sarcasm, no anger — nothing. Tino opens his eyes, looks directly at her, and for one tiny moment **he recognises her**. Then something else takes control, and containment fails.

**The legendary boss fight** — a candidate for the hardest fight in the entire game. Hard through mastery, never through cheap mechanics: by now the player has learned melee, ranged, blocking, parrying, dodging, essence interactions, status effects, environmental combat, companion coordination, resource management, positioning — and Tino examines all of it. The arena is the experimental facility, and it destroys itself as the fight goes: clean containment lab to broken walls, fires, leaking essence, collapsed platforms, until it looks like a magical warhead went off indoors. **Phase 1 — Tino:** his recognisable stance, weapon style, and tactical habits, but stronger, faster, more violent; sometimes he stops, looks at Amanda, looks at the player, is briefly *there* — then attacks. **Phase 2 — essence rotation:** infused essences take control in turn — fire (aggression, arena ignition), frost (frozen ground, shrinking safe space), storm (speed, chained lightning through the wreckage), beast (mutation, claws, unpredictable leaps), arcane (teleports, barriers, spatial tricks), corruption/void (false Tinos, unreliable UI, reality getting hard to read). The final essence set must match approved systems. **Phase 3 — combination:** fire+storm, frost+beast, arcane+storm, beast+corruption — genuinely new mechanics, not bigger numbers; the fight becomes an exam on how the essence systems interact. **Phase 4 — the visions invade the fight:** the player is pulled into Tino's memories mid-combat, and the visions carry gameplay information — a vision shows a specific essence regulator being fitted to him; that regulator exists somewhere in the arena; destroying it strips one of his abilities. Narrative mechanic becomes combat mechanic. **Phase 5 — Amanda unleashed:** she stops hiding what she is capable of and joins at extraordinary power, her magic changing, her body beginning to show what she truly is — the first glimpse of **Am~hors~ormen~da** — while she screams at him. Not heroic dialogue: personal. Years of grief, anger, and love. Conceptual line: *"YOU STUPID FUCKING BASTARD! YOU WERE SUPPOSED TO COME HOME!"* And somewhere inside the monster, Tino reacts. **Phase 6 — TINO, THE ESSENCE HOST:** he absorbs everything left in the facility and takes a boss title card; tiny openings, hostile arena, rotating mechanics, no permanent safe zone. Greed, panic, resource sloppiness, ignoring essence interactions, ignoring Amanda — all punished. Skilled players always understand why they died. **Final phase — just Tino:** the magic burns out. He collapses, tries to stand, picks up whatever weapon is left, and the player fights him one last time. Short. Human. Brutal. Sad. He falls.

**The reunion.** Amanda goes to him. He fully recognises her — understands she found him. Neither knows what to say, and it must NOT become a sentimental speech; they know each other too well for that. Amanda says something completely inappropriate — drinking, dancing, sex, the old tavern, some incident the player has zero context for. Tino understands instantly. He smiles. She smiles. Maybe both laugh. **The player never gets the explanation, and no codex entry may ever provide one.** Players should argue about it for years.

**Tino dies.** His body cannot survive the accumulated damage. And Amanda realises what she can do.

**Amanda's true form — the Lizzarnix.** One of the game's great visual reveals: the beautiful lizardwoman shape opens into something older and more impossible, still upright and recognisably humanoid but unmistakably half lizard and half phoenix — jewel-bright scales, a long living tail, a crown and mantle of fire, feathered wings edged like molten glass, and the terrible grace of a people the world murdered into myth. The facility's instruments identify the energy as impossible-quality Essence. The player who has seen the oldest ruin murals finally understands that those walls were not depicting a sun god. They were recording a people.

**The restoration.** The distinction between restoration and resurrection matters. A Lizzarnix once gave magic by dying willingly, passing the gift, and returning from the scaled egg left in its ashes; [[the-three-origins-of-magic]] remembers the gift but history forgot the giver. Amanda turns that first covenant toward Tino. Her fire passes through him, strips the foreign Essence, purges the mutations, and rebuilds him as he should have been. The price is equivalent and non-negotiable: **this body, this life, all at once.** He wakes while she is burning beside him. Now the children can finally be spoken of out loud — he tries to tell her he never stopped searching, and she already knows, which makes the sacrifice mean more: she is not saving the man who abandoned them, she is saving the man who destroyed himself trying to bring their family home. She refuses to let her last moment turn sentimental. Conceptual line: *"You disappear looking for our children again without telling anyone and I swear to whatever gods are listening, I will come back from the dead and rip your fucking balls off."* Tino, crying, laughs: *"Fair."* She smiles. Then the fire takes her.

**Ash and egg.** Amanda does not leave a body. She burns completely, fierce enough to drive everyone back, then the chamber goes quiet. In the center of the ash lies one beautiful egg covered in overlapping red, gold, and obsidian scales, warm as a heartbeat. This is not a loophole that undoes the sacrifice: the companion the player knew is gone from the roster, Tino has been restored, and nobody knows when Amanda will hatch or what death has carried away from her. But she was telling the truth about coming back. Tino lifts the egg from the ashes, wraps it in his coat, and carries it with him from that moment forward.

**After.** Amanda's record is never deleted or overwritten — she remains a character and former companion permanently; her status becomes *between lives — rebirth egg in Tino's care*. **Tino becomes an active companion in her place** and stays through the rest of the main story: the player needs time with the person she burned to save. He carries the egg physically, not as inventory hidden in a menu: a protected sling against his chest or a hard case on his kit, moved carefully before combat, checked beside campfires, and spoken to when he thinks the player is asleep. His companion dialogue carries Amanda, the children, the search, the captivity, guilt, grief, what he learned, whether the children are alive, whether they would recognise him, whether they would hate him, and whether the woman inside the egg will remember him. He is still Tino — he jokes, he laughs, he is an asshole — but changed. Because of the mythic gift he should carry some power of hers — restoration turned outward as healing — while the egg remains the visible promise that her story is not finished. He fights in the final boss encounter clean: no corruption, no forced power. Just Tino, and what she entrusted to him.

**Only after the final boss does he leave** — mirroring his original departure with the meaning inverted. Then there is no family left to restore; now he goes to find **their children** anyway, because they may still be alive, and he owes it to them, to Amanda, and to himself. The children stay deliberately undefined — one may want him, one may hate him, one may blame him for Amanda, they may be grown, they may be important, they may be with the kidnappers — all of it future-content territory for DLC, expansions, postgame, sequel.

**The ending.** Credits run to the very end. Black. Silence. Then **MARTINO** appears on screen. Hold. Slowly, **MAR** fades — until only **TINO** remains. Hold on the word. No exposition, maybe a tiny musical cue. Black. End of game. This is the final visual beat of Martino.`,
  meta: {
    threadStatus: "brainstorming",
    categories: ["companion-arc", "character-arc", "mystery", "main-story", "boss-encounter", "ending"],
    stages: ["peninsula", "endgame", "post-credits"],
    priority: "high",
    spoilerLevel: "ending",
    parent: null,
    characters: ["amanda", "tino"],
    companions: ["amanda", "tino"],
    factions: [],
    locations: ["the-peninsula", "port-arcadia"],
    arcs: ["the-captivity-arc"],
    canonPackets: [],
    companionMissions: [
      "the-woman-in-the-peninsula",
      "smoke-in-her-hair",
      "the-night-we-were-happy",
      "two-empty-cribs",
      "after-the-cribs",
      "the-man-who-left",
      "he-never-stopped-looking",
      "am-hors-ormen-da",
      "the-man-she-never-stopped-loving",
    ],
    bosses: ["tino"],
    tags: ["amanda", "tino", "lizzarnix", "missing-children", "martino-ending", "soul-forge", "origin-of-magic", "rebirth-egg"],
    openQuestions: [
      "Who took the children — TBD by design; do not decide without approval. Big enough to become its own thread.",
      "Which faction or organization holds and experiments on Tino — TBD.",
      "How the player's vision-link to Tino squares with existing canon (war buddy, what-the-player-knows-about-tino).",
      "The final essence set for the boss rotation must match approved systems.",
      "How Tino's inherited restoration expresses as companion healing without replacing medics or trivialising Soul Forges.",
      "When Amanda's egg hatches, what she remembers, and whether the reborn Amanda is physically the same age.",
      "All quoted dialogue is conceptual until specifically approved.",
    ],
  },
};

const mission = (
  order: number,
  slug: string,
  title: string,
  summary: string,
  body: string,
  extra?: Partial<StoryCompanionMissionMeta>,
): { slug: string; title: string; summary: string; body: string; meta: StoryCompanionMissionMeta } => ({
  slug,
  title,
  summary,
  body,
  meta: {
    companion: "amanda",
    arc: null,
    order,
    missionStatus: "brainstorming",
    stage: null,
    unlockConditions: null,
    rewards: [],
    relationshipEffects: null,
    consequences: null,
    characters: ["amanda", "tino"],
    locations: [],
    factions: [],
    threads: ["the-empty-cribs"],
    openQuestions: [],
    ...extra,
  },
});

/** Amanda's arc, missions 1–9. Starts fun and mysterious; ends in the facility. */
export const companionMissionSeeds = [
  mission(1, "the-woman-in-the-peninsula", "The Woman in the Peninsula",
    "The player gets into serious trouble; Amanda rescues them — violently, and mostly annoyed about it. Then she hears who they are looking for, and a curl of smoke rises from her hair.",
    `The player encounters Amanda in [[the-peninsula]] after getting into serious trouble with **[EVENT / CREATURE TBD]**. She rescues them — not heroically, not ceremonially. Violently. She treats saving their life as an inconvenience: *"I leave you alone for thirty fucking seconds and you're already getting eaten."*

She has no intention of traveling with anyone. Then she learns the player is searching for **[[tino]]**. She stops. Her expression changes. A tiny curl of smoke rises from her hair. The player notices; Amanda pretends nothing happened — and becomes very interested in joining the search. She does NOT explain why.

She introduces herself in the lizard tongue — **Am~hors~ormen~da** — watches it fail to land, then snarls: *someone called me Amanda once. I guess you can just use that.* Amanda becomes available as a companion.`,
    { stage: "peninsula", locations: ["the-peninsula"], unlockConditions: "First meeting — the trouble the player is in (event/creature) is TBD.", relationshipEffects: "Amanda joins the roster, guarded and unexplained.", openQuestions: ["What exactly the player is being eaten by — TBD."] }),

  mission(2, "smoke-in-her-hair", "Smoke in Her Hair",
    "NPCs keep mentioning Tino. Some stories make Amanda laugh despite herself; others set her hair smoldering. The party learns to read the warning signs.",
    `Across ordinary adventures, NPCs keep mentioning [[tino]]. Amanda reacts strangely — some stories make her laugh despite herself, others make her furious. Her hair smokes. Sometimes it ignites. The rest of the party learns the sequence: someone says the name, smoke starts, *oh shit.*

The player begins to understand that Amanda did not merely know Tino — she knew him extremely well. She refuses to explain. The mission's real payload is a glimpse of the woman from before: somebody tells a particularly ridiculous Tino story and Amanda laughs — a genuine laugh, the old one — then realises she did, and her mood slams shut.`,
    { stage: "early-game", relationshipEffects: "The party learns Amanda's tell; the player starts collecting the question she will not answer." }),

  mission(3, "the-night-we-were-happy", "The Night We Were Happy",
    "Evidence of a former life: Amanda and Tino were once genuinely, embarrassingly happy. The player hears about one drunken, laughing night — with no idea yet what came after it.",
    `The player stumbles onto evidence of Amanda and Tino's life together — an old tavern, an old friend, a song, a keepsake, an abandoned home, someone who remembers them (which of these is TBD). The discovery: they were once genuinely happy, and it should surprise the player who knows only the blade-cold Amanda.

Maybe they hear the story of the night out — drinking, dancing, singing, both of them drunk enough to embarrass themselves, laughing at some private joke. Amanda dismisses the memory. The player can tell it matters. **The player still does not know what happened afterward.**`,
    { stage: "mid-game", unlockConditions: "Missions 1–2 done; the party crosses a place from Amanda's old life.", openQuestions: ["Which relic of the old life carries the reveal — tavern, friend, song, keepsake, home — TBD."] }),

  mission(4, "two-empty-cribs", "Two Empty Cribs",
    "The turn: Amanda and Tino had two children. She finally tells the player what she and Tino came home to — and she does not cry telling it, which is worse.",
    `The player discovers that Amanda and Tino had **two children**. Then Amanda finally tells it: the joyful night, still laughing on the doorstep, still teasing each other — the too-quiet house — the children's room — **both cribs empty**. No bodies. No explanation. Gone.

She does not cry while explaining it. That almost makes it worse. This is the moment the player understands why Amanda became the woman she is now. The abductors were never identified — deliberate, someone took them, and who is a mystery the story keeps (TBD).`,
    { stage: "mid-game", relationshipEffects: "The armor cracks once. Amanda trusts the player with the worst fact of her life.", consequences: "The search for Tino quietly becomes, for Amanda, the search for the children too." }),

  mission(5, "after-the-cribs", "After the Cribs",
    "The aftermath: every rumor chased, every trail dead. Amanda stopped singing; Tino became obsessed. The marriage did not die of lovelessness — it collapsed under grief.",
    `The aftermath, in Amanda's telling and in what the party can find. They searched together — every rumor, every trail, every whisper, again and again and again. Nothing. Amanda withdrew: stopped dancing, stopped singing, stopped going out, stopped trusting. She got angry, mean, closed-off. Tino went the other way: obsessive, every failed lead sharpening him.

Their relationship began collapsing under the weight of it — **not because they stopped loving each other, but because neither knew how to survive it.**`,
    { stage: "mid-game" }),

  mission(6, "the-man-who-left", "The Man Who Left",
    "Amanda's version: one day Tino was simply gone. Years of silence taught her to hate him. She wants to find him — to kiss him, punch him, scream at him, kill him, hold him. Probably all five.",
    `Amanda explains that eventually Tino disappeared. Here the player's picture should match hers exactly: after everything, he left her too. Maybe he could not handle her anymore. Maybe he stopped believing the children were alive. Maybe he ran. She does not know — no letters, no proof of life, nothing — and she has spent years furious at him.

This is why she joined the player. She wants to find Tino, and she does not know whether she wants to kiss him, punch him, scream at him, kill him, or hold him. **Probably all five.** The player still does not know Tino's side.`,
    { stage: "late-game", relationshipEffects: "Amanda's motive is finally on the table — ambivalence and all." }),

  mission(7, "he-never-stopped-looking", "He Never Stopped Looking",
    "The reversal: documents, witnesses, hideouts, maps — years of Tino's search for the children. He never abandoned them, and he never abandoned Amanda. She has hated the wrong story for years.",
    `The major reversal. The player uncovers what Tino left behind — documents, witnesses, old hideouts, maps, names, tracked factions. Years of searching. The truth becomes unavoidable: **Tino never abandoned the children, and he never actually abandoned Amanda.** He left because he believed he had a real lead; everything after was the search.

Amanda is confronted with it, and it hits her harder than the cribs: she has spent years hating a man who was trying to bring their family home. Fury returns with a new target — conceptually: *"That stupid fucking bastard."* Smoke. Fire. Tears she refuses to acknowledge. Because now she realises Tino might still be out there — and the trail he was on is the one that got him taken (the same capture existing canon already holds; see [[what-the-player-knows-about-tino]]).`,
    { stage: "late-game", consequences: "The search gains a direction: whatever took Tino is findable.", openQuestions: ["Which faction's trail he was on when he was taken — TBD, same lock as the thread."] }),

  mission(8, "am-hors-ormen-da", "Am~hors~ormen~da",
    "An ancient creature recognises Amanda as Lizzarnix and names the extinct fire-blooded people who gave magic to the world's races through death and rebirth.",
    `During the continued search, Amanda's true nature begins to surface. An ancient creature recognises her — not as Amanda. It speaks: **Am~hors~ormen~da.** Possibly it bows. Possibly it fears her. Possibly both.

The creature calls her **[[lizzarnix]]**: half lizard, half phoenix, one of a mythical species the modern world believes was exterminated for legendary Essence and still-more-valuable eggs. It does not explain the whole truth. Instead it leads the party into one of the deepest ancient structures, where a wall shows the same being dying in flame before many different races, those witnesses rising with magic in their hands, and a scaled egg hatching behind them. Amanda cannot dismiss the image because it depicts the fire she has spent her whole life hiding.

This is where the player learns the outline: the Lizzarnix gave magic willingly, died, and returned to give again; civilization harvested them until both the creatures and the truth vanished. The mission still withholds exactly how Amanda's own cycle will matter. Its job is to make the fire, ash, and egg at the end of [[the-empty-cribs]] feel inevitable in retrospect rather than invented in the final scene.`,
    { stage: "late-game", consequences: "The party can finally name Amanda's species and recognise Lizzarnix murals; the full ash-and-egg consequence remains hidden until the finale.", openQuestions: ["What ancient creature recognises her, and why did it survive with the name when every modern culture lost it?"] }),

  mission(9, "the-man-she-never-stopped-loving", "The Man She Never Stopped Loving",
    "The finale: the facility, the failed subjects, Tino's records — and the containment cell. Amanda is coming, and no party system in the game gets to say otherwise.",
    `The player finally locates where Tino is held. **Amanda is coming — non-negotiable.** Even if party systems would normally allow leaving her behind, this mission requires her.

Inside the facility: failed experimental subjects, [[essence]] chambers, biological experiments, chemical infusion rigs, surgical theatres, restraints — and Tino's records, showing how long he has been held and that his capture came from following leads about the children. Everything mission 7 proved, confirmed in ink.

Then containment. Tino — barely Tino. Essence moving under his skin, veins glowing, a body that has been rebuilt too many times. Amanda approaches the glass with no joke, no sarcasm, no anger. Nothing. He opens his eyes. He looks directly at her. For one tiny moment he recognises her.

Then something takes control, containment fails — and the fight in [[the-empty-cribs]] begins.`,
    { stage: "endgame", unlockConditions: "Missions 1–8 complete; the facility located.", consequences: "Leads directly into the Tino boss encounter, the reunion, and Amanda's ending." }),
];
