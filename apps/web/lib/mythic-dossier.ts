/**
 * The Mythic dossier: a named fight read as one page.
 *
 * The fight itself — summary, spawn, stats, phases, abilities, drops — is NOT
 * here. It lives in `bloomfall-creature-field-guide.ts`, because the Codex
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

export type MythicReactorState = {
  /** The canonical `reactor-cycles` state. Seven, and these are the seven. */
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
  /** Hero plates. `hero` is the creature dossier plate; the rest are this page's. */
  arenaArtSlug: string;
  transitionArtSlug: string;
  catalogueArtSlug: string;
  biome: readonly MythicPanelRow[];
  arena: readonly string[];
  /** The mechanical beats of the phase change. The prose itself lives on the
   *  field-guide record, so the dossier body and this page cannot disagree. */
  transitionBeats: readonly string[];
  mechanics: readonly string[];
  reactor: readonly MythicReactorState[];
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
    reactor: [
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
};

export const mythicSlugs = Object.freeze(Object.keys(mythicDossiers));
