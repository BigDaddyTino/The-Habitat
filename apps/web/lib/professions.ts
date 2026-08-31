/**
 * The nine trades — one source of truth.
 *
 * Design source: the character bible's `professions` layer (nine trades,
 * three rungs each, near-future names) plus the owner's ruling of
 * 2026-08-31: **trades level by use, and the two rung-ups are gated by a
 * licence.** You raise a trade by doing its work; you cannot cross into the
 * next rung until an institution or a master signs for you — the same law
 * the talent trees use for ceilings, and the reason the middle rung is
 * called Licensed.
 *
 * Every blueprint carries real numbers, in the same continuous-time
 * language as the talents: seconds, percentages, counts. No rounds, no
 * turns, no scenes — this is an FPS on a live server.
 *
 * The sim weights live here too, so what a player reads on the website and
 * what the balance campaign measures can never drift apart.
 */

export type Rung = "apprentice" | "licensed" | "master";

export const rungOrder: Rung[] = ["apprentice", "licensed", "master"];

/** What a trade can do to the fight model. Read by scripts/lib/talent-sim. */
export type ProfessionEffect = Partial<{
  /** Doses carried into a fight beyond the standard issue. */
  extraDoses: number;
  /** Seconds of bleed-out timer added to the whole party. */
  partyDyingClock: number;
  /** Wounds healed between fights, per person. */
  partyRecovery: number;
  /** Composure restored between fights — Culinary's real meal. */
  composureRestore: number;
  /** Multiplier on ammunition carried. */
  ammoMultiplier: number;
  /**
   * Corruption pace multiplier — Chemistry's cut. CAMPAIGN SCALE: the fight
   * model has no ladder clock, so this is deliberately not read by fight().
   */
  corruptionPace: number;
  /** Plates carried beyond issue. */
  extraPlates: number;
  /** Extra fraction of a caster's pool restored between fights. */
  poolRestore: number;
  /** Fractional cut in cast costs — Engineering's conductor-grade rig. */
  castCostRelief: number;
  /** Fractional cut in damage on ground this trade prepared — Architecture. */
  damageReduction: number;
}>;

/** One thing the trade can make or do, with what it actually changes. */
export type Blueprint = {
  name: string;
  /** Plain gameplay lines — concrete numbers, continuous time. */
  does: string[];
};

/** A rung-up: who signs, and what signing costs. */
export type Gate = {
  /** The document itself. */
  licence: string;
  /** Codex slug of the body that issues it. */
  issuer: string;
  issuerName: string;
  /** What it takes beyond the work — the favour, the fee, the oath. */
  price: string;
  /** True when holding this paper is itself a crime or a mark. */
  illicit?: boolean;
};

export type Tier = {
  rung: Rung;
  blueprints: Blueprint[];
  /** The gate that must be passed to REACH this rung. Apprentice has none. */
  gate?: Gate;
};

export type Profession = {
  slug: string;
  name: string;
  /** The one-line read. */
  tagline: string;
  /** What one unit of work is, for the use track. */
  workUnit: string;
  tiers: Tier[];
  /** The moral ceiling, where canon has one. */
  ceiling?: string;
};

/**
 * THE PROGRESSION RULE — use, gated.
 *
 * Work of your current rung's difficulty raises the trade. Work below it
 * stops counting the moment you outgrow it, which is the classic crafting
 * grey-out and the reason nobody grinds bandages to mastery. Reaching the
 * count does not promote you: it makes you ELIGIBLE, and then somebody has
 * to sign.
 */
export const progression = {
  jobsToLicence: 60,
  jobsToMastery: 300,
  /** Licensed rungs you may hold at once — as many as you can staff. */
  licensedLimit: Infinity,
  /** Master rungs, ever. */
  masterLimit: 1,
  rules: [
    "Every character is Apprentice in every trade from the first day. Nobody is licensed on day one.",
    "Only work at your current rung counts. Apprentice jobs stop feeding the track the moment you are Licensed.",
    "60 jobs makes you eligible for a licence; 300 licensed jobs makes you eligible for mastery. Eligibility is not promotion — somebody signs, or you stay where you are.",
    "Licensed in as many trades as you can keep busy. Master in exactly one, ever, and the choice does not come back.",
    "Trades are Earned, so death keeps them. Your kit is on the corpse; your licences are not.",
  ],
} as const;

export const professions: Profession[] = [
  {
    slug: "medicine",
    name: "Medicine",
    tagline: "The healer. Manages corruption without ever curing it.",
    workUnit: "a person treated",
    ceiling: "Everyone you protect is permanently in your debt, and you never had to ask.",
    tiers: [
      {
        rung: "apprentice",
        blueprints: [
          { name: "Stabilise", does: ["Pull a downed ally up with 1 wound closed", "+6s on a bleed-out timer you reach in time"] },
          { name: "Set and stitch", does: ["A bleed stopped in 8 seconds", "A broken limb usable in a day instead of a week"] },
        ],
      },
      {
        rung: "licensed",
        gate: { licence: "Practitioner's certificate", issuer: "helix-arcanobiotics", issuerName: "Helix Arcanobiotics", price: "A board examination, a named sponsor, and your name on their register for good" },
        blueprints: [
          { name: "Field surgery", does: ["Removes one lasting wound in 20 minutes", "Once per person per week — the body needs the gap"] },
          { name: "Read the phase", does: ["An instrument names a corruption phase exactly, in 30 seconds"] },
          { name: "Manage the tells", does: ["One tell suppressed for 24 hours", "Buys a phase-three one night's sleep"] },
        ],
      },
      {
        rung: "master",
        gate: { licence: "No paper at all", issuer: "black-tithe-syndicate", issuerName: "Black Tithe Syndicate", price: "The Syndicate teaches it because the Syndicate needs it. You will be asked, and not once", illicit: true },
        blueprints: [
          { name: "Falsify a reading", does: ["The instrument reports whatever phase you name", "Holds against a second opinion 90% of the time", "A caught falsification ends the certificate and starts a file"] },
        ],
      },
    ],
  },
  {
    slug: "refining",
    name: "Refining",
    tagline: "The dose-maker. Where skill and complicity become the same thing.",
    workUnit: "a dose processed to grade",
    ceiling: "You are the only person in the room who knows whose soul is in the crate, and you keep working.",
    tiers: [
      {
        rung: "apprentice",
        blueprints: [
          { name: "Raw processing", does: ["Turns raw take into usable stock at 60% yield", "Bad stock is 3× more likely to misfire — you will know which is which"] },
        ],
      },
      {
        rung: "licensed",
        gate: { licence: "Grade certification", issuer: "aegis-extraction-consortium", issuerName: "Aegis Extraction Consortium", price: "A quota you meet every month, and the Consortium's audit rights over your bench" },
        blueprints: [
          { name: "Process to grade", does: ["Yield to 90%, and the grade holds under assay"] },
          { name: "Grade reserve glass", does: ["A containment frame that will not kill its wearer", "Drops frame failure from 1-in-20 to 1-in-500"] },
          { name: "Feed a Forge", does: ["Keeps a Soul Forge's reserve above the line — the difference between a rebuild and a wait"] },
        ],
      },
      {
        rung: "master",
        gate: { licence: "The provenance sitting", issuer: "bone-market-families", issuerName: "Bone Market Families", price: "The Families teach you to name the dead. They will expect you to name some of theirs, and to stay quiet about the rest", illicit: true },
        blueprints: [
          { name: "Read provenance", does: ["A dose named by species, often by individual, sometimes by facility", "Takes 2 minutes with the crate open"] },
          { name: "The clean grade", does: ["A crate worth double the same crate without the paper", "One of the two most valuable documents a master can produce"] },
        ],
      },
    ],
  },
  {
    slug: "chemistry",
    name: "Chemistry",
    tagline: "The alchemist, near-future. Kept apart from Refining on purpose.",
    workUnit: "a batch mixed",
    tiers: [
      {
        rung: "apprentice",
        blueprints: [
          { name: "Field mixes", does: ["Stimulants, solvents and a burn that works", "+10% of a caster's pool back between fights"] },
        ],
      },
      {
        rung: "licensed",
        gate: { licence: "Institute licence", issuer: "meridian-arcane-institute", issuerName: "Meridian Arcane Institute", price: "Tuition, or a scholarship that comes with somebody's expectations attached" },
        blueprints: [
          { name: "Mana tonic", does: ["Restores a third of a caster's pool", "One dose per person per fight — the second does nothing"] },
          { name: "Stormglass stabiliser", does: ["Takes the misfire out of stormglass: 1-in-8 becomes 1-in-100"] },
        ],
      },
      {
        rung: "master",
        gate: { licence: "No licence exists for this", issuer: "stormglass-cartel", issuerName: "Stormglass Cartel", price: "The Cartel owns the only benches where it can be learned, and it does not lend them", illicit: true },
        blueprints: [
          { name: "The cut", does: ["Refined blended with nature-drawn: corruption advances 30% slower", "Costs 25% potency per dose, and no field test finds it"] },
          { name: "Assay blank", does: ["A reading comes back inconclusive — a person reads as nothing", "The other of the two most valuable documents in the trades"] },
        ],
      },
    ],
  },
  {
    slug: "engineering",
    name: "Engineering",
    tagline: "The smith, near-future. Keeps equipment alive, including the equipment that is part of a person.",
    workUnit: "a piece repaired, sealed or fitted",
    tiers: [
      {
        rung: "apprentice",
        blueprints: [
          { name: "Bench work", does: ["Field repairs at 50% of a shop's speed", "Maintenance that keeps a weapon from jamming: failures −40%"] },
        ],
      },
      {
        rung: "licensed",
        gate: { licence: "Union card", issuer: "foundry-workers-union", issuerName: "Foundry Workers' Union", price: "An apprenticeship served under a card-holder, and dues for the rest of your life" },
        blueprints: [
          { name: "Seal a rig", does: ["An infusion rig that will not vent: +1 armour plate carried"] },
          { name: "Fit a prosthetic", does: ["A limb that answers, in 4 hours on a bench"] },
          { name: "Recover an augment", does: ["A working augment out of a body in 90 seconds", "The trade's named time, met every time"] },
        ],
      },
      {
        rung: "master",
        gate: { licence: "Master's mark", issuer: "foundry-workers-union", issuerName: "Foundry Workers' Union", price: "A piece the hall accepts, judged by people who have seen everything" },
        blueprints: [
          { name: "Cosmesis", does: ["Chrome that reads as flesh — no scanner short of a surgeon finds it"] },
          { name: "Conductor-grade rig", does: ["−15% cast costs for whoever wears it"] },
          { name: "A piece with a history", does: ["A named item. People will know it before they know you"] },
        ],
      },
    ],
  },
  {
    slug: "logistics",
    name: "Logistics",
    tagline: "The quartermaster's trade. Decides who gets what, in writing.",
    workUnit: "a load allocated and signed for",
    tiers: [
      {
        rung: "apprentice",
        blueprints: [
          { name: "Inventory", does: ["Counts that are actually right", "+15% ammunition carried, because none of it is lost"] },
        ],
      },
      {
        rung: "licensed",
        gate: { licence: "Quartermaster's warrant", issuer: "peninsula-expeditionary-army", issuerName: "Peninsula Expeditionary Army", price: "A warrant is a signature you cannot take back — shortages become yours" },
        blueprints: [
          { name: "Allocate under scarcity", does: ["+30% ammunition carried and +1 dose into every fight", "In writing, which means somebody goes without and it is on your paper"] },
          { name: "The dose ledger", does: ["Every dose in the column tracked by name — theft becomes visible in a day"] },
        ],
      },
      {
        rung: "master",
        gate: { licence: "The order", issuer: "peninsula-expeditionary-army", issuerName: "Peninsula Expeditionary Army", price: "Handed to one officer per column, and it is never given back" },
        blueprints: [
          { name: "Hold the order", does: ["A Forge rebuilds one body at a time, and you sequence the queue", "+50% ammunition and +2 doses into every fight"] },
          { name: "Sound the horn", does: ["Calls the reserve. It comes, once, and the ground it leaves is uncovered"] },
        ],
      },
    ],
  },
  {
    slug: "architecture",
    name: "Architecture",
    tagline: "The builder. Walls, and a plan for when they fail.",
    workUnit: "a structure raised or shored",
    tiers: [
      {
        rung: "apprentice",
        blueprints: [
          { name: "Repairs and shoring", does: ["A structure that stops falling down", "Cover that holds one hit before it stops being cover"] },
        ],
      },
      {
        rung: "licensed",
        gate: { licence: "Builder's certificate", issuer: "foundry-workers-union", issuerName: "Foundry Workers' Union", price: "The hall signs for load paths. If your wall drops on somebody, the hall answers too" },
        blueprints: [
          { name: "Fortify to load path", does: ["Prepared ground gives everyone in it +1 armour plate"] },
          { name: "Forge housing", does: ["A housing that survives a shell — the Forge stays lit through a bombardment"] },
        ],
      },
      {
        rung: "master",
        gate: { licence: "The holdfast sitting", issuer: "mountain-holdfasts", issuerName: "Mountain Holdfasts", price: "They teach it to people who intend to stay. Leaving early ends the teaching" },
        blueprints: [
          { name: "Hold", does: ["Walls that survive a third assault, not a first", "Prepared ground gives +1 plate and −10% damage to everyone behind it"] },
          { name: "The collapse plan", does: ["When the wall goes, it goes the way you drew it — the fallback is already built"] },
        ],
      },
    ],
  },
  {
    slug: "extraction",
    name: "Extraction",
    tagline: "Mining and farming, one trade. The dark tier always pays better.",
    workUnit: "a claim worked",
    tiers: [
      {
        rung: "apprentice",
        blueprints: [
          { name: "Work a claim", does: ["Standard yield off ordinary ground", "Nothing you take here is worth hiding"] },
        ],
      },
      {
        rung: "licensed",
        gate: { licence: "Dark-tier permit", issuer: "aegis-extraction-consortium", issuerName: "Aegis Extraction Consortium", price: "Quotas, paperwork, and a permit that names you when the ground stops producing" },
        blueprints: [
          { name: "Dark-tier extraction", does: ["3× the value per claim, with quotas and paperwork", "The ground is measurably worse afterwards, and the permit has your name on it"] },
          { name: "Field supply", does: ["+1 dose into every fight, off your own take"] },
        ],
      },
      {
        rung: "master",
        gate: { licence: "Clan teaching", issuer: "verdant-marsh-clans", issuerName: "Verdant Marsh Clans", price: "They teach the partial take to people who stop working the dark tier. They check", illicit: false },
        blueprints: [
          { name: "Partial take", does: ["Harvest without killing the source — the claim produces again next season"] },
          { name: "Recovery", does: ["Worked ground brought back toward baseline, and no further", "Takes a season per claim, and nobody pays you for it"] },
        ],
      },
    ],
  },
  {
    slug: "culinary",
    name: "Culinary",
    tagline: "The cook. The only thing in the world that gives Composure back.",
    workUnit: "a company fed",
    tiers: [
      {
        rung: "apprentice",
        blueprints: [
          { name: "Field rations", does: ["Food that does not cost morale to eat", "Half a wound closed per person between fights"] },
        ],
      },
      {
        rung: "licensed",
        gate: { licence: "Provisioner's contract", issuer: "tropic-pearl-trade-house", issuerName: "Tropic Pearl Trade House", price: "Pearl signs provisioning contracts. Pearl also decides what your stores cost next month" },
        blueprints: [
          { name: "Stretch a store", does: ["A week past where the store ends, with nobody weaker for it"] },
          { name: "Hot food under fire", does: ["1 wound closed per person between fights"] },
        ],
      },
      {
        rung: "master",
        gate: { licence: "No certificate — a table", issuer: "free-islander-league", issuerName: "Free Islander League", price: "You cook for the League's own until they say it was a real meal. They are honest about it" },
        blueprints: [
          { name: "A real meal", does: ["Restores Composure — nothing else in the world does", "+25% of a caster's pool back", "1 wound closed per person, and the company talks to each other again"] },
        ],
      },
    ],
  },
  {
    slug: "xenobiology",
    name: "Xenobiology",
    tagline: "The beast-worker. The Wardens certify, and the Sanctuary teaches.",
    workUnit: "an animal handled or assayed",
    tiers: [
      {
        rung: "apprentice",
        blueprints: [
          { name: "Husbandry", does: ["Animals that stay fed, calm and transportable", "A bonded animal opens the day fight-ready"] },
        ],
      },
      {
        rung: "licensed",
        gate: { licence: "Warden certification", issuer: "wardens-monster-hunter-guild", issuerName: "Wardens' Monster Hunter Guild", price: "The Guild certifies. It also expects you to answer a lodge call, and remembers if you do not" },
        blueprints: [
          { name: "Field assay", does: ["Names what a creature is and what it can do, in 60 seconds at 20m"] },
          { name: "Sign off Morphic material", does: ["Harvested traits that are legal to carry and safe to wear"] },
          { name: "Handler's kit", does: ["+1 armour plate, from plate you cut yourself"] },
        ],
      },
      {
        rung: "master",
        gate: { licence: "The Sanctuary's teaching", issuer: "sanctuary-of-living-beasts", issuerName: "Sanctuary of Living Beasts", price: "They teach people who have stopped taking trophies. The Wardens notice that too" },
        blueprints: [
          { name: "Read the rung", does: ["A creature's mutation tier on sight, and the damage type that drove it there", "Instant, at any range you can see it"] },
          { name: "Handle the unhandleable", does: ["Animals nobody else can move, moved"] },
        ],
      },
    ],
  },
];

/** Drawn, not written: the tenth trade waits on the sea lanes and the sky. */
export const reservedTrade = {
  name: "Pilotage",
  why: "The Cartel rules the sea lanes, the Coast Guard patrols them, the Skybridge Transit Authority licenses the sky — and the prologue is an island.",
  shape: "Navigation as a profession rather than a skill, licensed by whoever controls the lane, and the first trade whose master rung is about getting somebody else's people out.",
};

/**
 * Sim weights per `<slug>/<rung>`. Master values are the ones the tuned
 * balance campaign already measured; the lower rungs scale beneath them.
 */
export const professionEffects: Record<string, ProfessionEffect> = {
  "medicine/apprentice": { partyRecovery: 0.5 },
  "medicine/licensed": { partyRecovery: 1, partyDyingClock: 3 },
  "medicine/master": { partyRecovery: 2, partyDyingClock: 6 },

  "refining/apprentice": {},
  "refining/licensed": { extraDoses: 1, poolRestore: 0.1 },
  "refining/master": { extraDoses: 2, poolRestore: 0.15 },

  "chemistry/apprentice": { poolRestore: 0.1 },
  "chemistry/licensed": { extraDoses: 1, poolRestore: 0.33 },
  "chemistry/master": { extraDoses: 1, corruptionPace: 0.7, poolRestore: 0.33 },

  "engineering/apprentice": {},
  "engineering/licensed": { extraPlates: 1 },
  "engineering/master": { extraPlates: 1, castCostRelief: 0.15 },

  "logistics/apprentice": { ammoMultiplier: 1.15 },
  "logistics/licensed": { extraDoses: 1, ammoMultiplier: 1.3 },
  "logistics/master": { extraDoses: 2, ammoMultiplier: 1.5 },

  "architecture/apprentice": {},
  "architecture/licensed": { extraPlates: 1, damageReduction: 0.05 },
  "architecture/master": { extraPlates: 1, damageReduction: 0.1 },

  "extraction/apprentice": {},
  "extraction/licensed": { extraDoses: 1 },
  "extraction/master": { extraDoses: 1, ammoMultiplier: 1.2 },

  "culinary/apprentice": { partyRecovery: 0.5 },
  "culinary/licensed": { partyRecovery: 1, composureRestore: 1 },
  "culinary/master": { composureRestore: 2, partyRecovery: 1, poolRestore: 0.25 },

  "xenobiology/apprentice": {},
  "xenobiology/licensed": { partyRecovery: 0.5, extraPlates: 1 },
  "xenobiology/master": { partyRecovery: 1, extraPlates: 1 },
};

export function professionBySlug(slug: string): Profession | null {
  return professions.find((trade) => trade.slug === slug) ?? null;
}

export function effectsForTrade(slug: string, rung: Rung): ProfessionEffect {
  return professionEffects[`${slug}/${rung}`] ?? {};
}
