import type { StoryCreatureMeta } from "@habitat/shared";

/**
 * The races: the top rung of what used to be the bestiary.
 *
 * A race is a creature entry with nothing above it, and everything else names
 * the race it belongs to — the same `parent` law the regions atlas and the
 * systems shelf already run on. The set below is not invented over canon; it
 * is [[the-taxonomy-of-monsters]] made into a shelf. That rule already sorts
 * the world into the made (monstrosities), the fallen (abominations), the
 * true supernatural (demons), and the native ecology that is "neither made,
 * fallen, nor invading". This splits that last group the way the setting
 * already talks about it — the mythical bloodlines magic came from, and the
 * ordinary animals the harvest economy hunts — and adds the one race the
 * codex was silently missing: the people who read it.
 *
 * Three races already existed as umbrella entries and are only being marked
 * as races here (their prose is untouched): Monstrosities, Abominations, and
 * The Risen.
 */

export type RaceSeed = { slug: string; title: string; summary: string; body: string; meta: StoryCreatureMeta };
export type RaceMemberSeed = RaceSeed;

const race = (
  slug: string,
  title: string,
  summary: string,
  body: string,
  category: StoryCreatureMeta["category"],
  extra: Partial<StoryCreatureMeta> = {},
): RaceSeed => ({
  slug,
  title,
  summary,
  body,
  meta: { category, parent: null, biomes: [], threat: null, harvest: null, gameId: null, openQuestions: [], ...extra },
});

const member = (
  slug: string,
  title: string,
  summary: string,
  body: string,
  parent: string,
  category: StoryCreatureMeta["category"],
  extra: Partial<StoryCreatureMeta> = {},
): RaceMemberSeed => ({
  slug,
  title,
  summary,
  body,
  meta: { category, parent, biomes: [], threat: null, harvest: null, gameId: null, openQuestions: [], ...extra },
});

/** Races that need creating. */
export const raceSeeds: RaceSeed[] = [
  race(
    "mythical",
    "Mythical",
    "The rarest category in the Codex. Only one mythical creature is known at present: the Lizzarnix.",
    `Mythical is not a crowded bestiary tier. It is the name for beings so rare that one discovery changes history. **Only one mythical creature exists in the Codex right now: the [[lizzarnix]].** Do not populate this parent casually. An entry belongs here only when the story is willing to carry the weight of a species almost erased from the world.

**Rarity is the philosophy.** A mythical creature is native to magic rather than merely touched by it, older than the nations that tried to catalogue it, and likely the last or nearly the last of its kind. The Lizzarnix are the only confirmed example: half lizard and half phoenix, givers behind the first and third origins in [[the-three-origins-of-magic]], burned into ash and reborn from a scaled egg — until [[the-harvest-economy]] discovered that the ash and the egg were worth more than the covenant.

**Writing them.** Rarity is the whole texture: a mythical creature should never be an encounter type, a spawn table, or a species the player farms. One of them appearing is an event the world reacts to. If a scene needs a dangerous animal, it needs [[beasts]] — reach for this race only when the story is willing to carry the weight of what the creature means.

Future mythical beings may be proposed, but none are canon now. Until the room makes that exceptional decision, Mythical means Lizzarnix and Lizzarnix alone.`,
    "magical",
    { threat: "Individually enormous, but the real danger to a party is political: whoever finds out what they are looking at will want it.", harvest: "Legendary-grade essence and worse. The Lizzarnix were hunted to apparent extinction for what could be cut out of them — see [[the-harvest-economy]].", openQuestions: ["Whether the world's other magical creatures descend from the Lizzarnix or arose separately."] },
  ),
  race(
    "beasts",
    "Beasts",
    "Animals. No covenant, no bargain, no plan — they simply live here, which is exactly why the harvest hunts them.",
    `The ordinary ecology: things that hunt, breed, migrate, and defend territory without any intention toward the war being fought over their heads. [[the-taxonomy-of-monsters]] files them under the category that is neither made, fallen, nor invading, and the distinction matters morally — a beast that kills a squad was not sent, recruited, engineered, or damned. It was hungry, or it was cornered.

**They are the harvest economy's raw material.** A beast with any magic in it at all is worth cutting open, and [[the-harvest-economy]] has industrialised exactly that. Most essence in circulation started as an animal. That is the quiet horror the setting rests on: the trade did not begin with people, it merely arrived there.

**Writing them.** A beast can be terrifying without being evil, and the best beast encounters in this game are weather rather than enemies — the [[hippogriff]] teaches that lesson on a rooftop in the prologue, and Steve fails it. Give them behaviour before statistics: a search pattern, a territory, a thing they want. A player who learns an animal's habits and survives it has learned more about this world than one who out-damaged it.`,
    "natural",
    { threat: "Enormously variable, and rarely the point. The dangerous ones are dangerous the way terrain is.", harvest: "The economy's staple. Hides, venom, organs, and whatever magic the creature carried — extraction kills the source, which is the whole law of [[essence]]." },
  ),
  race(
    "humanoid",
    "Humanoid",
    "Upright peoples with recognisably human form. Human is the only child filed here at present.",
    `Humanoid is a parent shape, not a synonym for Human and not a claim that every upright people shares one ancestry. It gives the Codex a clean place for recognisably human-bodied peoples without confusing them with individual species. **Human is the only child filed here right now.** [[amanda]] being something else only means something because the room she walks into is human.

**The child is the species.** Open [[human]] for the people who built the extraction economy, fight the war, and move through the seven phases. Future humanoid peoples belong here only if canon establishes them as a distinct species; a profession, faction, culture, mutation, or rider is never a race.

**Writing them.** Keep the parent clean and broad. Put human history and moral responsibility on the Human child; use Humanoid to answer only the structural question: what kind of people are these?`,
    "natural",
    { threat: "Varies by the child species; the parent describes body plan, not allegiance or power.", harvest: "Humanoid peoples can be harvested, which is a crime the world's industries have learned to describe as supply." },
  ),
  race(
    "supernaturals",
    "Supernaturals",
    "True beings from outside the world's ecology — not made, not fallen, not born here. They arrive with their own hierarchies, territories, and long-term plans.",
    `The third category in [[the-taxonomy-of-monsters]], and the one that is genuinely other. A supernatural was not engineered in a facility and was never a person who took too many doses. It is a real being of a separate order, with motives that predate the war and outlast it, and — crucially — with a *society*: nobility, bargains, obligations, and grudges. [[true-demons]] are the ones walking the island where the player can see them, and [[the-ashen-court]] is the shape of the power behind them.

**They negotiate.** That is what separates this race from everything else on the shelf and what makes it dangerous in a different key. A monstrosity has to be fought or freed and an abomination has to be mourned, but a supernatural can be *dealt with* — which is how parties end up owing things. Write bargains with real terms and real collection.

**Writing them.** Never explain the hierarchy fully, and never let a scene resolve into a demon simply being a strong enemy. What raises [[the-risen]] and what it wants with a battlefield's worth of dead belongs to [[something-under-the-war]] — the glimpse discipline governs every appearance here.`,
    "supernatural",
    { threat: "Categorical rather than numerical: the danger is what they can offer, and what accepting it costs.", harvest: "Attempted, historically, by people who are no longer available for comment." },
  ),
];

/** Canon children created alongside the parent taxonomy. */
export const raceMemberSeeds: RaceMemberSeed[] = [
  member(
    "hippogriff",
    "Hypogriff",
    "An intelligent eagle-and-horse beast of the old world, dangerous in its own right and entirely separate from the human who may ride it.",
    `A Hypogriff is a beast: eagle in its forward anatomy, horse through the hindquarters, and powerful enough in the air to turn a rooftop into exposed ground. It is not a rider, a military unit, or a piece of equipment. Those are roles humans place around it.

The prologue's rooftop hunter is one of these animals fitted into Tropic Pearl doctrine. The human rider brings the weapon, orders, and faction allegiance; the [[hippogriff]] brings flight, senses, learned search behaviour, and the old-world presence that makes the silhouette unforgettable. Separating the two matters because a beast cannot inherit its rider's guilt.

**Writing them.** Give the animal behaviour before statistics. A Hypogriff circles, searches, warns, tires, chooses, and can be frightened or mistreated. It may be trained for war, but it is never born belonging to an army. Steve dies because he misreads its search pattern, not because the species is evil. [[steve]]`,
    "beasts",
    "natural",
    { biomes: ["highlands", "coastal cliffs", "urban roosts"], threat: "Severe in exposed terrain. Its eyesight, speed, and aerial reach make timing and cover more important than damage.", harvest: "Feathers, organs, and magical essence make the species valuable to handlers and harvesters alike." },
  ),
  member(
    "human",
    "Human",
    "The mortal species that built the extraction economy, fights the war, and reads this Codex.",
    `Most people in this story are Human: the player, the squads, the cartels, the refiners, the officers who sign for doses, and nearly every name in the Codex. Filing Human beneath [[humanoid]] makes the distinction explicit: Humanoid is the parent body plan; Human is the species with this history.

**They are the only species that does this to itself.** [[the-seven-phases-of-corruption]] is a human road. Infusion, hidden tremors, bribed doctors, and the thing at the end of the seven phases are what happens when a species that cannot hold magic natively decides to buy it anyway — the second origin in [[the-three-origins-of-magic]], and the reason [[abominations]] exist at all. No beast chose this. No mythical creature needed to.

**Writing them.** Humanity is neither the villain nor the victim; it is the participant. The extraction trade is run by people with quotas, and the most useful human character is often decent, employed, and downstream of something unforgivable. Nobody woke up evil — [[the-long-hunt]] never answers whether humanity caused the collapse, and every faction answers differently.`,
    "humanoid",
    "natural",
    { threat: "Organised. Humans arrive with logistics, institutions, weapons, and stories that justify all three.", harvest: "The one nobody says out loud. [[the-soul-breakthrough]] made people harvestable, and refined [[essence]] has been soul-stuff ever since.", openQuestions: ["Whether any human population carries inherited magic from the old Lizzarnix covenant, and whether they know it."] },
  ),
];

/**
 * Races that already exist as umbrella entries. Only their sheet is written —
 * the prose the room wrote is never touched, because these entries were
 * already doing this job before the shelf had a name for it.
 */
export const existingRaceSheets: Array<{ slug: string; category: StoryCreatureMeta["category"] }> = [
  { slug: "monstrosities", category: "monstrosity" },
  { slug: "abominations", category: "abomination" },
  { slug: "the-risen", category: "supernatural" },
];

/**
 * Where every creature that is not itself a race belongs. Each assignment
 * follows the taxonomy law rather than taste: the Arcadian Devil is an animal,
 * the Hypogriff is a beast, true demons are the supernatural the rule
 * names, and the Lizzarnix are the mythical bloodline the ending turns on.
 */
export const raceAssignments: Array<{ slug: string; parent: string; category: StoryCreatureMeta["category"] }> = [
  { slug: "arcadian-devil", parent: "beasts", category: "natural" },
  { slug: "hippogriff", parent: "beasts", category: "natural" },
  { slug: "human", parent: "humanoid", category: "natural" },
  { slug: "true-demons", parent: "supernaturals", category: "supernatural" },
  { slug: "lizzarnix", parent: "mythical", category: "magical" },
];
