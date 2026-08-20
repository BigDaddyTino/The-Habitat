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

/** Races that need creating. */
export const raceSeeds: RaceSeed[] = [
  race(
    "mythical",
    "Mythical",
    "The world's original magical bloodlines — the creatures magic came from, hunted so thoroughly that the reason for the hunt was lost with them.",
    `The oldest living things in the world, and the reason there is magic in it at all. A mythical creature is not simply a powerful animal: it is native to magic the way a fish is native to water, it predates every nation that later catalogued it, and it is almost always the last or nearly the last of its kind.

**They are defined by absence.** Every mythical race in this world is a story about what was killed to build the present. The [[lizzarnix]] are the clearest case and the one canon has decided: half lizard and half phoenix, givers of the third origin in [[the-three-origins-of-magic]], burned into ash and reborn from a scaled egg — until [[the-harvest-economy]] discovered that the ash and the egg were worth more than the covenant. The world does not remember what it did. That forgetting is the point.

**Writing them.** Rarity is the whole texture: a mythical creature should never be an encounter type, a spawn table, or a species the player farms. One of them appearing is an event the world reacts to. If a scene needs a dangerous animal, it needs [[beasts]] — reach for this race only when the story is willing to carry the weight of what the creature means.

What else survived alongside the Lizzarnix, and whether anything else in this race is still drawing breath, is deliberately open.`,
    "magical",
    { threat: "Individually enormous, but the real danger to a party is political: whoever finds out what they are looking at will want it.", harvest: "Legendary-grade essence and worse. Every mythical race in this world was hunted to the edge for what could be cut out of it — see [[the-harvest-economy]].", openQuestions: ["Which other mythical races existed, and whether any besides the Lizzarnix survived.", "Whether the world's other magical creatures descend from mythical bloodlines or arose separately."] },
  ),
  race(
    "beasts",
    "Beasts",
    "Animals. No covenant, no bargain, no plan — they simply live here, which is exactly why the harvest hunts them.",
    `The ordinary ecology: things that hunt, breed, migrate, and defend territory without any intention toward the war being fought over their heads. [[the-taxonomy-of-monsters]] files them under the category that is neither made, fallen, nor invading, and the distinction matters morally — a beast that kills a squad was not sent, recruited, engineered, or damned. It was hungry, or it was cornered.

**They are the harvest economy's raw material.** A beast with any magic in it at all is worth cutting open, and [[the-harvest-economy]] has industrialised exactly that. Most essence in circulation started as an animal. That is the quiet horror the setting rests on: the trade did not begin with people, it merely arrived there.

**Writing them.** A beast can be terrifying without being evil, and the best beast encounters in this game are weather rather than enemies — the [[the-hypogriff-riders]] teach that lesson on a rooftop in the prologue, and Steve fails it. Give them behaviour before statistics: a search pattern, a territory, a thing they want. A player who learns an animal's habits and survives it has learned more about this world than one who out-damaged it.`,
    "natural",
    { threat: "Enormously variable, and rarely the point. The dangerous ones are dangerous the way terrain is.", harvest: "The economy's staple. Hides, venom, organs, and whatever magic the creature carried — extraction kills the source, which is the whole law of [[essence]]." },
  ),
  race(
    "humans",
    "Humans",
    "The race that built the extraction economy, fights the war, and reads this codex. The default the whole setting is measured against.",
    `Almost everyone in this story is human: the player, the squads, the cartels, the refiners, the officers who sign for the doses, and nearly every name in the codex. Recording them as a race is not a formality — it is what makes every other entry on this shelf legible. [[amanda]] being something else only means something because the room she walks into is human.

**They are the only race that does this to itself.** [[the-seven-phases-of-corruption]] is a human road. Infusion, hidden tremors, bribed doctors, and the thing at the end of the seven phases are what happens when a species that cannot hold magic natively decides to buy it anyway — which is the second origin in [[the-three-origins-of-magic]], and the reason [[abominations]] exist as a race at all. No beast chose this. No mythical creature needed to.

**Writing them.** Humanity in this setting is neither the villain nor the victim; it is the participant. The extraction trade is not run by monsters, it is run by people with quotas, and the most useful human character a writer can put on the page is one who is decent, employed, and downstream of something unforgivable. Nobody in this world woke up evil — [[the-long-hunt]] is explicit that canon never answers whether humanity caused the collapse, and every faction answers differently.`,
    "natural",
    { threat: "Organised. The only race on this shelf that arrives with logistics.", harvest: "The one nobody says out loud. [[the-soul-breakthrough]] made people harvestable, and refined [[essence]] has been soul-stuff ever since.", openQuestions: ["Whether any human population carries inherited magic from the old Lizzarnix covenant, and whether they know it."] },
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
 * the hypogriff is a war-beast, true demons are the supernatural the rule
 * names, and the Lizzarnix are the mythical bloodline the ending turns on.
 */
export const raceAssignments: Array<{ slug: string; parent: string; category: StoryCreatureMeta["category"] }> = [
  { slug: "arcadian-devil", parent: "beasts", category: "natural" },
  { slug: "the-hypogriff-riders", parent: "beasts", category: "natural" },
  { slug: "true-demons", parent: "supernaturals", category: "supernatural" },
  { slug: "lizzarnix", parent: "mythical", category: "magical" },
];
