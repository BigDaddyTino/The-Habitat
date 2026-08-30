import { storyDamageTypes, storyDamageTypeLabels, type StoryDamageType } from "@habitat/shared";

/**
 * The Adaptive Mutation ladder: Bloomfall's one escalation rule.
 *
 * Wound a creature, fail to kill it, and let it get away — it heals into the
 * next rung and remembers what hurt it. The rungs are the same for every
 * eligible species, so a player learns the system once and reads it on
 * anything: None, Minor, Functional, Advanced, and the Exceptional Aberrant
 * that a surviving Advanced can seed.
 *
 * The numbers and rules live here, not in the creature manifest, because they
 * are the system rather than the animal. Each species supplies only its own
 * expression of them — which resistance a burn grows, what the retaliation
 * looks like, what falls off the corpse. See `bloomfall-creature-field-guide`.
 */

/**
 * The five damage types are the GAME’s taxonomy now, not the region’s.
 *
 * They were written here first because Bloomfall was the region with the most
 * writing, and the character bible then resolved every weapon, ward, plate and
 * licence class onto the same five. Re-exported rather than redefined so the
 * region and the game can never drift apart.
 */
export const bloomfallDamageTypes = storyDamageTypes;
export type BloomfallDamageType = StoryDamageType;
export const bloomfallDamageTypeLabels = storyDamageTypeLabels;

export const bloomfallMutationRungs = ["NONE", "MINOR", "FUNCTIONAL", "ADVANCED", "ABERRANT"] as const;
export type BloomfallMutationRung = (typeof bloomfallMutationRungs)[number];

/** The four rungs an ordinary animal can climb. The fifth is a rare event. */
export const bloomfallLadderRungs = ["NONE", "MINOR", "FUNCTIONAL", "ADVANCED"] as const;

export type BloomfallRungRule = {
  key: BloomfallMutationRung;
  name: string;
  /** The stat line printed on the card. */
  stats: string;
  /** Multiplier on base stats, for anything that needs the number itself. */
  multiplier: number;
  /** How an animal ends up on this rung. */
  earned: string;
  /** How it behaves once it is there. */
  temperament: string;
  /** What it gains defensively. */
  defense: string;
  /** What it gains offensively. */
  offense: string;
};

export const bloomfallMutationLadder: readonly BloomfallRungRule[] = [
  {
    key: "NONE",
    name: "None",
    stats: "Normal — base stats.",
    multiplier: 1,
    earned: "Every wild spawn starts here. Nothing has ever wounded it and lived to let it go.",
    temperament: "Normal for the species.",
    defense: "Whatever hide, plate, or distance it was born with.",
    offense: "Its base kit, and nothing else.",
  },
  {
    key: "MINOR",
    name: "Minor",
    stats: "+20% across the board (1.2× base health, damage, speed, and senses).",
    multiplier: 1.2,
    earned: "You wounded it and it escaped. It healed into this.",
    temperament: "Wary. It breaks off early and it remembers your approach.",
    defense: "One resistance, grown to answer whatever damage type drove it off — burn it and it comes back fireproofed.",
    offense: "Still the base kit. This rung buys survival, not violence.",
  },
  {
    key: "FUNCTIONAL",
    name: "Functional",
    stats: "+100% across the board (2× base).",
    multiplier: 2,
    earned: "You wounded a Minor with something new and it escaped again.",
    temperament: "Aggressive. It starts the fight now.",
    defense: "Keeps the Minor resistance and grows a second one for the new damage type — so it may be armored against physical and fire, or fire and lightning.",
    offense: "Turns the first resistance into a weapon: an attack made of whatever it learned to survive.",
  },
  {
    key: "ADVANCED",
    name: "Advanced",
    stats: "+250% across the board (3.5× base).",
    multiplier: 3.5,
    earned: "You wounded a Functional and it got away a third time. This one is your fault.",
    temperament: "Extremely aggressive. It hunts you across the cell.",
    defense: "Prisma. Every damage type is halved except one, and the game never tells you which. Find the weakness and it takes 25% extra; guess wrong all fight and you will not out-damage its healing.",
    offense: "Three special attacks, each built from the species and what it survived.",
  },
  {
    key: "ABERRANT",
    name: "Exceptional Aberrant",
    stats: "Mini-boss scale. Far past Advanced, and it does not fight like an animal any more.",
    multiplier: 8,
    earned: "1% chance every time an Advanced escapes you. It leaves as a beast and comes back as a regional event — a named abomination that claims ground and holds it.",
    temperament: "Apex. It does not flee, and the cell reorganizes around it.",
    defense: "Prisma, plus whatever the transformation gave it. Its weakness moves.",
    offense: "A boss kit: area denial, adds, and one attack that ends unprepared parties.",
  },
];

export const bloomfallRungRuleByKey = new Map(bloomfallMutationLadder.map((rung) => [rung.key, rung]));

export function bloomfallRungRule(key: BloomfallMutationRung) {
  const rung = bloomfallRungRuleByKey.get(key);
  if (!rung) throw new Error(`No Adaptive Mutation rule for ${key}.`);
  return rung;
}

/** The one-line version, for indexes and cards that have no room for the rules. */
export const bloomfallLadderSummary =
  "Four rungs — None, Minor, Functional, Advanced — climbed by wounding a creature and letting it escape. A surviving Advanced has a 1% chance of seeding an Exceptional Aberrant.";
