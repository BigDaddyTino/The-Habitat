/**
 * The Mythic dossier: a named fight read as one page.
 *
 * The fight itself — summary, spawn, stats, phases, abilities, drops — is NOT
 * here. It lives in `mythic-field-guide.ts`, because the Codex
 * dossier and this page must never be able to disagree about what the thing
 * does. Same law as `bloomfallMutationCards()`: one source, two surfaces.
 *
 * What is here is everything a dossier page carries that a dossier body does
 * not: how the fight couples to the region's systems, what the arena does, who
 * posted the bounty and what each of them wants out of it. Art is picked up by
 * convention from private/codex-art/bosses/<slug>.png, so a plate serves on
 * reload with no code change and no rebuild.
 */

export type MythicPanelRow = { label: string; text: string };

/**
 * One state of the regional hazard the fight runs inside — its weather.
 *
 * This was typed against Bloomfall's seven `reactor-cycles` states, because
 * the first Mythic was Bloomfall's. The second is not: Death Canyon has no
 * reactor, it has a heavy gas that pools by depth. So the axis is named for
 * what it does rather than for the first region that had one, and each
 * dossier says what its own track is called.
 */
export type MythicHazardState = {
  /** The state's name in its own region's vocabulary. */
  state: string;
  /** Hazard read at a glance, low to extreme. */
  band: "low" | "moderate" | "high" | "severe" | "extreme";
  /** What that state does to this fight, in this arena. */
  effect: string;
};

export type MythicDossier = {
  /** The CREATURE entry whose field-guide record drives the page. */
  slug: string;
  /** The CHARACTER entry, when the thing used to be somebody. */
  personSlug: string | null;
  region: string;
  regionLabel: string;
  eyebrow: string;
  /** The one line under the title. Never a summary — the field guide has that. */
  tagline: string;
  /** The closing panel: what going costs, and the plate that proves it. */
  catalogueTitle: string;
  catalogueNote: string;
  /**
   * Plates that are not one of the three fixed slots below. Empty is fine —
   * but a commissioned plate that is in neither list renders nowhere and just
   * sits on disk, which is what happened to two of the Pale Mother's.
   */
  gallery: readonly { slug: string; caption: string }[];
  /** Hero plates. The creature dossier carries its own; these are this page's. */
  arenaArtSlug: string;
  transitionArtSlug: string;
  catalogueArtSlug: string;
  biome: readonly MythicPanelRow[];
  arena: readonly string[];
  /** The mechanical beats of the phase change. The prose itself lives on the
   *  field-guide record, so the dossier body and this page cannot disagree. */
  transitionBeats: readonly string[];
  mechanics: readonly string[];
  /** What this region calls its hazard track, as the section heading. */
  hazardTitle: string;
  hazard: readonly MythicHazardState[];
  bounty: readonly { issuer: string; issuerSlug: string; wants: string }[];
  rewards: readonly { name: string; slug: string | null; what: string }[];
  /** The quest that hangs off it, by arc slug. */
  arcSlug: string;
};

/** Ability tiles are found by name: private/codex-art/bosses/ability-<slug>.png */
export function mythicAbilitySlug(name: string) {
  return `ability-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`;
}

export const mythicDossiers: Readonly<Record<string, MythicDossier>> = {
  "the-blackweir-anaconda": {
    slug: "the-blackweir-anaconda",
    personSlug: "elias-vey",
    region: "bloomfall-reach",
    regionLabel: "Bloomfall Reach · Living Marsh",
    eyebrow: "Mythic · Border bounty · Two phases",
    tagline: "Once a failed biocontainment experiment. Now the reason the Blackweir weir works, and the reason it will not once you are done.",
    catalogueTitle: "Why anyone goes",
    catalogueNote:
      "The recovered hunters are laid out in the shallows above the resin beds — supine, arms at their sides, feet toward the water, each with a numbered resin disc at the throat. The numbers are sequential. They are past three hundred. There are no gaps.",
    gallery: [],
    arenaArtSlug: "blackweir-arena",
    transitionArtSlug: "the-transformation",
    catalogueArtSlug: "the-catalogue",
    biome: [
      { label: "Forged by the cascade", text: "An Essence-adaptive filtration organism with a Southreach biologist as its substrate. It was built to contain the Bloomfall and it did." },
      { label: "Living containment", text: "It is not living in the marsh. Stretches of Blackweir's filtration network are continuous with its nervous system, and it spends parts of itself to hold the line." },
      { label: "Reactor cycles affect it", text: "Sector state drives aggression, ability tempo and the water level. The pylons over the channels are its supply, and they are sabotageable." },
      { label: "Harvesting consequences", text: "Stripping resin, cutting filtration roots or killing it outright makes the marsh more hazardous, not less. The valuable thing and the working thing are the same thing." },
      { label: "Blackbloom exposure", text: "Contact drives buildup: limb mutation, ability miscalculation, gear decay. This is Blackbloom Exposure. It is not Seven-Phase Corruption and never becomes it." },
    ],
    arena: [
      "Shallow filtration channels, collapsed rail bridges and standing pylons.",
      "Water depth moves with the reactor state and with what it does to the gates.",
      "Blackbloom vents fire on their own schedule and force movement.",
      "Every pylon you drop weakens it and takes a piece of the containment with it.",
    ],
    transitionBeats: [
      "Water level drops and the deep channels open.",
      "Sector state shifts toward Purge or Venting. It stops being ambush and becomes weather.",
      "Every pylon comes up to full load at once; sabotaging one now costs more and pays more.",
      "Reach and ambush stop mattering. Position does.",
    ],
    mechanics: [
      "Arena-wide abilities with far less telegraph and far more consequence.",
      "Pylons can be sabotaged to weaken it, at the exact cost of the containment they perform.",
      "Blackbloom buildup on the party accelerates for as long as the fight runs.",
      "Ground you have already harvested has fewer safe zones, because you took them.",
      "Let it break contact and return and it comes back a rung higher — its own Adaptive Mutation, aimed the correct way for the first time.",
    ],
    hazardTitle: "Reactor cycle — seven states",
    hazard: [
      { state: "Dormant Interval", band: "low", effect: "Water at its lowest and most of the basin walkable. Also when it is hardest to find." },
      { state: "Stabilization", band: "low", effect: "Pylons take load. Ability tempo rises and it stops waiting for you." },
      { state: "Sector Restart", band: "moderate", effect: "Old gates cycle. The route you came in by stops existing behind you." },
      { state: "Venting", band: "moderate", effect: "Plume fills the basin. Concealment for both sides; its sensing degrades and so does yours." },
      { state: "Purge", band: "severe", effect: "The sequence it was built for. It anchors and draws, and the channels flood with contaminated Essence." },
      { state: "Overflow", band: "high", effect: "Saturation past the weir's design. Every wound closes as fast as you open it." },
      { state: "Containment Breach", band: "extreme", effect: "Authored crisis, never a roll. The barrier fails and the fight stops mattering." },
    ],
    bounty: [
      { issuer: "Aegis Extraction Consortium", issuerSlug: "aegis-extraction-consortium", wants: "The interference with licensed harvest stopped. The notice specifies a resolution and does not specify a condition." },
      { issuer: "Wardens", issuerSlug: "wardens-monster-hunter-guild", wants: "It dead. Theirs is the only notice with a number on it, and the number is past three hundred and does not skip." },
      { issuer: "Meridian Arcane Institute", issuerSlug: "meridian-arcane-institute", wants: "It studied, and nobody near it. Their standing line is DO NOT ATTEMPT TO CONTACT VEY — not approach. Contact." },
    ],
    rewards: [
      { name: "Blackweir Heart", slug: "blackweir-heart", what: "The weir's largest sink. Taking it is the harvest that ends Blackweir as a containment structure." },
      { name: "Anaconda Hideplate", slug: "anaconda-hideplate", what: "Reactor-resistant, Blackbloom-adaptive plate. The one clean drop here." },
      { name: "Mutated Fang", slug: "mutated-fang", what: "Advanced weapon stock, banded one ring per purge — the most complete record of sector behaviour anybody holds." },
      { name: "Blackweir Resin", slug: "blackweir-resin", what: "At a grade nobody has assayed, from beds nobody has been able to work." },
      { name: "Bounty standing", slug: null, what: "With whichever issuer you satisfied. You cannot satisfy more than one." },
    ],
    arcSlug: "the-blackweir-bounty",
  },

  "the-pale-mother": {
    slug: "the-pale-mother",
    // Nobody to name. She is not somebody who became something — the Anaconda
    // is the region with a person inside it, and she is the region's dead
    // fitted together by something that had an opinion about the fit.
    personSlug: null,
    region: "grand-rift",
    regionLabel: "Grand Rift · Death Canyon",
    eyebrow: "Mythic · Picket bounty · Two phases",
    tagline: "She has never once defended herself. Every behaviour she has is defending the cage, and the cage has four hundred and eleven of them in it.",
    catalogueTitle: "What the quiet is",
    catalogueNote:
      "They stop at the edge of the gas and wait. Not a retreat and not a lull — they can wait longer than you can stand there, and every account that has ever come back out of [[death-canyon]] leads with the waiting rather than the deaths.",
    gallery: [
      { slug: "the-vents", caption: "Four seconds of seeing. A lit vent throws a column of flame up through the gas, and for as long as it burns the floor is visible — which is the only time anybody ever finds out how many there are." },
      { slug: "the-tally", caption: "Four hundred kilometres downriver, the bone-goods come off a barge at [[charnel-lock]] and the toll is always exactly correct. Nothing about this picture is wrong. That is the point of it." },
    ],
    arenaArtSlug: "death-canyon-arena",
    transitionArtSlug: "the-cage-opens",
    catalogueArtSlug: "the-quiet",
    biome: [
      { label: "Fitted, not grown", text: "Nine metres of bone, none of it hers. Every plate came off somebody and was seated, overlapped and keyed the way a wall is dry-stoned. The fit is the frightening part." },
      { label: "The cage", text: "Where a spider carries a body she carries a ribbed hollow, closed and full. It is on screen for the whole first phase and it is moving. Almost nobody looks." },
      { label: "Bone that will not settle", text: "The Ossuary Rites are an honest covenant and the one horror that trade has a word for is bone that goes on working after the rite. That word is undead, and Death Canyon is where it was coined." },
      { label: "The gas is not hers", text: "Hunters swear she breathes it. She does not, and the canyon is exactly as poisonous the week after she dies. She is the loudest wrong answer anybody has offered about this place." },
      { label: "Taken", text: "What the Brood takes is bone. A Soul Forge repairs that for anybody who can buy a body — which is the whole difference between a bad night for a bounty crew and a permanent one for a picket keeper." },
    ],
    arena: [
      "A fissured chasm floor under violet gas that pools by depth and has a surface like water.",
      "Fourteen vents that will light. The gas itself smothers; what burns is the fissure.",
      "Blue-green light comes up out of the floor, so everything is lit from underneath.",
      "Every vent she smothers is one you do not have when the cage opens.",
    ],
    transitionBeats: [
      "She stops, and lowers, and the legs fold. There is nothing dramatic about it.",
      "The cage opens on the underside the way a hand opens.",
      "How you killed her decided this minutes ago: seams and carry unlatch it early, legs only leave the lid on.",
      "The health bar was the cage the entire time, and the game never said so.",
    ],
    mechanics: [
      "Bullets and blades do nothing to the Brood. Total immunity, never a reduction — a gate with a gap is not a gate.",
      "Area damage kills them: magic, fire, an explosive, a lit vent. One tick, one death. The fight is coverage, not damage.",
      "No health bar in phase two — a count, going down, starting at four hundred and eleven.",
      "They do not make a sound, they block one. The canyon's hum goes out in the shape of them crossing it.",
      "Her plates grow back between attempts. Her children do not, so whatever you burned stays burned and she gets more careful as she runs out.",
    ],
    hazardTitle: "Gas depth — three bands",
    hazard: [
      { state: "Clear shelf", band: "low", effect: "Broken shelves above the pool line. You can see, she is slow, and the Brood will not follow you onto it. Also no cover and nothing to burn." },
      { state: "Working depth", band: "moderate", effect: "Gas at chest height over blue-green fissure light. The real arena, and all fourteen vents are in it." },
      { state: "Working depth · Fissure Step", band: "high", effect: "She walks into the gas and you lose her completely. Not invisibility — the gas is opaque and she is patient. The tell she is coming back is the gas." },
      { state: "The pool", band: "severe", effect: "Gas over your head in the deepest fractures. The existing environmental hazard at full strength, and she heals in it. Do not follow her in." },
      { state: "The Quiet", band: "extreme", effect: "The hum stops in a patch and the patch widens. Nothing is visible and nothing is going to be. This is the only warning the Brood gives." },
    ],
    bounty: [
      { issuer: "Bonefire Picket", issuerSlug: "bonefire-picket", wants: "It finished. The keepers took up a collection every year for nine years and nobody upriver has ever contributed a coin." },
      { issuer: "Wenna Crake", issuerSlug: "wenna-crake", wants: "Nothing for herself. She wrote the notice, she keeps the beacon lit under it, and she will tell you what happened to the five of them if you sit down." },
      { issuer: "Bone Market Families", issuerSlug: "bone-market-families", wants: "The brood-glass, quietly, at exactly the correct price — which tells them how many she had. They have never asked why the tally does not balance." },
    ],
    rewards: [
      { name: "A Settled Plate", slug: "settled-plate", what: "The one bone on her that stopped working. Proof, to the trade that cares most, that settling is still possible." },
      { name: "Brood-glass", slug: "brood-glass", what: "One bead per broodling the fire took, so your pouch is the count and the difference is what is still down there." },
      { name: "Cage Rib", slug: "cage-rib", what: "One rib off the brood chamber. The fitted notches are on the inside, which is the part armourers stop talking about." },
      { name: "The count", slug: "the-count-at-the-canyon", what: "Recorded at every ending, including the good one, where it is zero." },
    ],
    arcSlug: "the-pale-mother-bounty",
  },
};

export const mythicSlugs = Object.freeze(Object.keys(mythicDossiers));
