/**
 * The nine trades — one source of truth.
 *
 * Design source: the character bible's `professions` layer plus the owner's
 * rulings of 2026-08-31, second sitting:
 *
 *  - **The grind is real.** Nothing in a trade is handed to the player —
 *    every rung is an uphill count of actual jobs, gates are people who can
 *    say no, and the ladder has FOUR rungs now:
 *    Apprentice → Licensed → Journeyman → Master.
 *  - **A journeyman journeys.** The rung means what the word means: your
 *    trade-book must be signed on three different grounds before the rung
 *    opens. That is what pushes the trades out into every region — and into
 *    the ones nobody has written yet, where a seat is drawn and waiting.
 *  - **Master in exactly one — except the Procurator.** The class whose
 *    whole life is licences holds the Second Seal: two masteries. Every
 *    other class holds one, ever.
 *  - **Ignit Island has no seats.** The island is destroyed. No trade takes
 *    root on ground that burns.
 *
 * Every blueprint carries real numbers in continuous-time language —
 * seconds, percentages, counts. No rounds, no turns, no scenes.
 *
 * The sim weights live here too, so what a player reads on the website and
 * what the balance campaign measures can never drift apart.
 */

export type Rung = "apprentice" | "licensed" | "journeyman" | "master";

export const rungOrder: Rung[] = ["apprentice", "licensed", "journeyman", "master"];

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

/**
 * A trade's seat on a ground: who signs the book there, and the one
 * blueprint that can be learned nowhere else. Seats are why a journeyman
 * travels — three signatures from three different grounds open the rung,
 * and every seat teaches something the halls at home never will.
 */
export type Seat = {
  /** Ground slug from `tradeGrounds`. */
  ground: string;
  /** Who holds the seat — the gate with a face. */
  keeper: string;
  /**
   * Future codex slug for the keeper — the address their dossier and their
   * portrait will live at. Absent on reserved seats.
   */
  keeperSlug?: string;
  /**
   * What the keeper IS — a species lock, load-bearing for art and dossiers.
   * Owner's ruling: the bench is not all humanoid, and the humanoids are
   * not all white. "human" kinds carry their look in the note.
   */
  kind?: string;
  /** What the keeper is like, in one line. */
  note: string;
  /** The seat-exclusive blueprint. */
  teaches: Blueprint;
};

export type Profession = {
  slug: string;
  name: string;
  /** The one-line read. */
  tagline: string;
  /** What one unit of work is, for the use track. */
  workUnit: string;
  /** The masterwork: the proving the trade accepts nothing instead of. */
  proving: string;
  tiers: Tier[];
  /** Where the trade's book can be signed, across the world. */
  seats: Seat[];
  /** The moral ceiling, where canon has one. */
  ceiling?: string;
};

/**
 * The grounds the trades live on. Three are written, the rest are canon's
 * own geography waiting for its writers — a seat on unwritten ground is a
 * reservation, not a gap, per the standing law: the codex is growing, and
 * design never scopes to current coverage.
 *
 * Ignit Island is deliberately absent. It gets destroyed; no trade takes
 * root on ground that burns.
 */
export type TradeGround = {
  slug: string;
  name: string;
  /** One line of what the ground is. */
  note: string;
  /** True when the ground has no written dossier yet — the seat waits. */
  unwritten?: boolean;
};

export const tradeGrounds: TradeGround[] = [
  { slug: "port-arcadia", name: "Port Arcadia", note: "The capital of buying and selling — five hundred years of alchemists' money under the streets." },
  { slug: "bloomfall-reach", name: "Bloomfall Reach", note: "The mutation country. Everything here is a variant of something, including the work." },
  { slug: "southside", name: "Southside", note: "The gun quarter. Institutions end at its edge; reputations do not.", unwritten: true },
  { slug: "the-verdant-marsh", name: "The Verdant Marsh", note: "Clan ground. The marsh teaches what the schools refuse to.", unwritten: true },
  { slug: "the-high-holdfasts", name: "The High Holdfasts", note: "Mountain ground, held by people who intend to die where they built.", unwritten: true },
  { slug: "the-dust-roads", name: "The Dust Roads", note: "The desert compacts' routes. Everything is freight here, including you.", unwritten: true },
  { slug: "the-free-islands", name: "The Free Islands", note: "League water. No charter reaches it, which is the whole point.", unwritten: true },
  { slug: "the-ocean", name: "The Ocean Lanes", note: "Crossed, not lived on — the ground Pilotage is waiting for." },
  { slug: "the-far-shore", name: "The Far Shore", note: "Not yet written. The seat is drawn, the keeper unnamed, the door already owed.", unwritten: true },
];

/**
 * THE PROGRESSION LAW — the grind is the game.
 *
 * Work of your current rung's difficulty raises the trade, and nothing else
 * does. Work below your rung stops counting the moment you outgrow it, a
 * botched job counts for nothing but the materials it wasted, and reaching
 * a count never promotes you — it makes you ELIGIBLE, and then a person
 * with the authority to refuse you decides. Every rung-up is somebody's
 * signature, and signatures are earned, bought, owed, or denied.
 */
export const progression = {
  jobsToLicence: 75,
  jobsToJourneyman: 250,
  jobsToMastery: 600,
  /** Grounds whose books must carry your signature before Journeyman opens. */
  wanderGrounds: 3,
  /** Licensed rungs you may hold at once — as many as you can keep busy. */
  licensedLimit: Infinity,
  /** Master rungs, ever — for every class but one. */
  masterLimit: 1,
  /** The Second Seal: the Procurator's class perk, and nobody else's. */
  procuratorMasterLimit: 2,
  rules: [
    "Every character is Apprentice in every trade from the first day. Nobody is licensed on day one, and nothing after day one is free.",
    "Only work at your current rung counts. Apprentice jobs stop feeding the track the moment you are Licensed, and a botched job feeds nothing at all.",
    "75 jobs makes you eligible for a licence. 250 licensed jobs makes you eligible for the journeyman's rung — and eligibility opens nothing until your book is signed on three different grounds, because a journeyman journeys.",
    "600 journeyman jobs, a proving the trade accepts, and a living master's signature make a Master. Any of the three can be refused.",
    "Licensed in as many trades as you can keep busy. Master in exactly one, ever — except the Procurator, whose class carries the Second Seal: two masteries, because the Procurator's whole life is licences. The choice never comes back for anyone.",
    "Trades are Earned, so death keeps them. Your kit is on the corpse; your rungs, your signatures and your standing in the halls are not.",
    "No seat opens on Ignit Island. The island burns; the trades already know.",
  ],
} as const;

/** How many masteries a class may hold. The Procurator's Second Seal. */
export function masterLimitFor(classSlug: string): number {
  return classSlug === "procurator" ? progression.procuratorMasterLimit : progression.masterLimit;
}

export const professions: Profession[] = [
  {
    slug: "medicine",
    name: "Medicine",
    tagline: "The healer. Manages corruption without ever curing it.",
    workUnit: "a person treated",
    proving: "Bring back somebody the instruments already called finished — with witnesses, and without a Forge.",
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
        gate: { licence: "Practitioner's certificate", issuer: "helix-arcanobiotics", issuerName: "Helix Arcanobiotics", price: "A board examination with a 40% first-pass rate, a named sponsor who answers for you, and your name on their register for good" },
        blueprints: [
          { name: "Field surgery", does: ["Removes one lasting wound in 20 minutes", "Once per person per week — the body needs the gap"] },
          { name: "Read the phase", does: ["An instrument names a corruption phase exactly, in 30 seconds"] },
          { name: "Manage the tells", does: ["One tell suppressed for 24 hours", "Buys a phase-three one night's sleep"] },
        ],
      },
      {
        rung: "journeyman",
        gate: { licence: "The circuit book", issuer: "helix-arcanobiotics", issuerName: "Helix Arcanobiotics", price: "Three grounds' books signed, and a season riding circuit where the certificate means nothing and the work still has to" },
        blueprints: [
          { name: "Theatre anywhere", does: ["Field surgery no longer needs a ward — a table and 20 minutes, anywhere", "Two lasting wounds per session instead of one"] },
          { name: "Triage command", does: ["Allies mend +50% faster between fights while you run the line", "You call the order and the order is right"] },
        ],
      },
      {
        rung: "master",
        gate: { licence: "No paper at all", issuer: "black-tithe-syndicate", issuerName: "Black Tithe Syndicate", price: "The Syndicate teaches it because the Syndicate needs it. The proving comes first, then the asking price — and you will be asked more than once", illicit: true },
        blueprints: [
          { name: "Falsify a reading", does: ["The instrument reports whatever phase you name", "Holds against a second opinion 90% of the time", "A caught falsification ends the certificate and starts a file"] },
          { name: "The long save", does: ["A Dying body holds for an hour under your hands, not seconds", "Once per person, ever — the body remembers being argued for"] },
        ],
      },
    ],
    seats: [
      { ground: "port-arcadia", keeper: "Registrar Oduya", keeperSlug: "registrar-oduya", kind: "human", note: "A tall, grey-locked Igbo man who signs the harbour's medicine book and reads sponsors like invoices.", teaches: { name: "Dock lung", does: ["Cure the harbour's own disease — the wet-lung the clinics call chronic", "Cures it in 3 days; the clinics charge for years"] } },
      { ground: "bloomfall-reach", keeper: "the Ansel Sisters", keeperSlug: "the-ansel-sisters", kind: "bloommarked", note: "Two clinicians, one signature, one Bloommarked body that learned to be in two places. Nobody has ever met both, because there is no both.", teaches: { name: "Bloom debridement", does: ["Cut adaptive growth without waking it: mutation-driven wounds close clean", "−50% infection from Reach-born injuries"] } },
      { ground: "the-verdant-marsh", keeper: "Matron Ayida", keeperSlug: "matron-ayida", kind: "human", note: "Clan medicine — a broad, dark-skinned marshwoman who signs with a thumbprint and forgets nothing.", teaches: { name: "Marsh antivenin", does: ["Immunity to the marsh's whole venom table for 12 hours, from a field brew"] } },
      { ground: "the-far-shore", keeper: "— seat drawn, keeper unnamed", note: "The book already has a spine. Somebody will hold it.", teaches: { name: "— reserved", does: ["The far shore's medicine is not written yet, and the seat is kept open on purpose"] } },
    ],
  },
  {
    slug: "refining",
    name: "Refining",
    tagline: "The dose-maker. Where skill and complicity become the same thing.",
    workUnit: "a dose processed to grade",
    proving: "A blind assay: five crates, one of them wrong in a way only provenance shows. Name it, and name why.",
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
        gate: { licence: "Grade certification", issuer: "aegis-extraction-consortium", issuerName: "Aegis Extraction Consortium", price: "A monthly quota that does not care what the month did to you, and the Consortium's audit rights over your bench" },
        blueprints: [
          { name: "Process to grade", does: ["Yield to 90%, and the grade holds under assay"] },
          { name: "Grade reserve glass", does: ["A containment frame that will not kill its wearer", "Drops frame failure from 1-in-20 to 1-in-500"] },
          { name: "Feed a Forge", does: ["Keeps a Soul Forge's reserve above the line — the difference between a rebuild and a wait"] },
        ],
      },
      {
        rung: "journeyman",
        gate: { licence: "The route stamp", issuer: "aegis-extraction-consortium", issuerName: "Aegis Extraction Consortium", price: "Three grounds' books signed. Grade travels; a refiner who has only ever graded one region's take has only ever graded one lie" },
        blueprints: [
          { name: "Grade on the move", does: ["Full-grade processing from a wagon bench — no fixed shop needed", "+1 dose carried into every fight, off your own line"] },
          { name: "Stretch a reserve", does: ["A Forge reserve lasts +30% longer under your rationing", "Somebody notices. Somebody always notices"] },
        ],
      },
      {
        rung: "master",
        gate: { licence: "The provenance sitting", issuer: "bone-market-families", issuerName: "Bone Market Families", price: "The Families teach you to name the dead. The sitting is one long night, the blind assay is the door, and what you owe after is not written down", illicit: true },
        blueprints: [
          { name: "Read provenance", does: ["A dose named by species, often by individual, sometimes by facility", "Takes 2 minutes with the crate open"] },
          { name: "The clean grade", does: ["A crate worth double the same crate without the paper", "One of the two most valuable documents a master can produce"] },
        ],
      },
    ],
    seats: [
      { ground: "port-arcadia", keeper: "the Tally", keeperSlug: "the-tally", kind: "machine", note: "An Aegis assay engine older than the harbour it sits in — brass drums, one lens, a bell for disputes. Its stamp outranks every hand in the building.", teaches: { name: "Harbour assay", does: ["Grade a sealed crate without opening it — 85% accurate through the boards"] } },
      { ground: "the-dust-roads", keeper: "Ferren of the Third Compact", keeperSlug: "ferren-of-the-third-compact", kind: "human", note: "A sun-black desert woman who grades by starlight on a moving wagon and has never been wrong twice.", teaches: { name: "Dry storage", does: ["Doses keep 3× longer in desert cache — no glass, no cooling, no loss"] } },
      { ground: "the-free-islands", keeper: "the Wet Assayer", keeperSlug: "the-wet-assayer", kind: "risen", note: "A refiner who drowned with his bench and climbed back to it. No name, League water, and everything that cannot be graded legally is graded here — the dead keep no ledgers for the law.", teaches: { name: "Salvage grade", does: ["Water-damaged and contested stock recovered to grade at 70%", "No questions asked, in either direction"] } },
      { ground: "bloomfall-reach", keeper: "— seat drawn, keeper unnamed", note: "The Reach's take mutates in the crate. Somebody will learn to grade that.", teaches: { name: "— reserved", does: ["Living-grade is not written yet; the Reach is still deciding what it produces"] } },
    ],
  },
  {
    slug: "chemistry",
    name: "Chemistry",
    tagline: "The alchemist, near-future. Kept apart from Refining on purpose.",
    workUnit: "a batch mixed",
    proving: "Synthesise a named compound from a hostile shelf — the Institute picks the shelf, and it picks it to be unfair.",
    tiers: [
      {
        rung: "apprentice",
        blueprints: [
          { name: "Field mixes", does: ["Stimulants, solvents and a burn that works", "+10% of a caster's pool back between fights"] },
        ],
      },
      {
        rung: "licensed",
        gate: { licence: "Institute licence", issuer: "meridian-arcane-institute", issuerName: "Meridian Arcane Institute", price: "Tuition that costs a season's wages, or a scholarship that comes with somebody's expectations attached — the procurement clerks know which conclusions are not pursued" },
        blueprints: [
          { name: "Mana tonic", does: ["Restores a third of a caster's pool", "One dose per person per fight — the second does nothing"] },
          { name: "Stormglass stabiliser", does: ["Takes the misfire out of stormglass: 1-in-8 becomes 1-in-100"] },
        ],
      },
      {
        rung: "journeyman",
        gate: { licence: "The field book", issuer: "meridian-arcane-institute", issuerName: "Meridian Arcane Institute", price: "Three grounds' books signed. A chemist who has only mixed on one ground has only ever had one water, one heat, and one excuse" },
        blueprints: [
          { name: "Hostile-shelf synthesis", does: ["Licensed mixes from whatever the ground offers — no supply line needed", "+1 dose carried into every fight"] },
          { name: "Batch scale", does: ["One mixing session supplies a whole column, not a person", "Tonic for four costs the materials of two"] },
        ],
      },
      {
        rung: "master",
        gate: { licence: "No licence exists for this", issuer: "stormglass-cartel", issuerName: "Stormglass Cartel", price: "The Cartel owns the only benches where it can be learned, lends nothing, and takes its teaching fee in product — yours, for a year", illicit: true },
        blueprints: [
          { name: "The cut", does: ["Refined blended with nature-drawn: corruption advances 30% slower", "Costs 25% potency per dose, and no field test finds it"] },
          { name: "Assay blank", does: ["A reading comes back inconclusive — a person reads as nothing", "The other of the two most valuable documents in the trades"] },
        ],
      },
    ],
    seats: [
      { ground: "port-arcadia", keeper: "Doctor Anaya Chandrasekar", keeperSlug: "doctor-anaya-chandrasekar", kind: "human", note: "Institute chair — a silver-braided South Asian woman, Aegis-funded, honest about neither.", teaches: { name: "Vault reagents", does: ["Access to pre-Drain stock under the old quarters — mixes at +20% potency"] } },
      { ground: "the-verdant-marsh", keeper: "Grandmother Sedge", keeperSlug: "grandmother-sedge", kind: "supernatural", note: "Never took the licence, and was mixing before there was an Institute to refuse. Whatever wears that shawl is older than the marsh's name for it. Students are sent to her anyway, quietly.", teaches: { name: "Nature-drawn base", does: ["Mixes from living stock instead of refined — half cost, and the ladder never notices them"] } },
      { ground: "the-high-holdfasts", keeper: "Powder Warden Tsering", keeperSlug: "powder-warden-tsering", kind: "human", note: "A wind-burned Himalayan-featured woman who keeps the mountains' munitions book and a personal grudge against imprecision.", teaches: { name: "Cold synthesis", does: ["Mixing at altitude and frost without loss — no heat source, full yield"] } },
      { ground: "the-far-shore", keeper: "— seat drawn, keeper unnamed", note: "Whatever the far shore burns for fuel, somebody there mixes with it.", teaches: { name: "— reserved", does: ["The far shore's shelf is not written yet; the seat holds its place"] } },
    ],
  },
  {
    slug: "engineering",
    name: "Engineering",
    tagline: "The smith, near-future. Keeps equipment alive, including the equipment that is part of a person.",
    workUnit: "a piece repaired, sealed or fitted",
    proving: "The hall's piece: build something the judges cannot break in a day of trying. They have seen everything, and they try hard.",
    tiers: [
      {
        rung: "apprentice",
        blueprints: [
          { name: "Bench work", does: ["Field repairs at 50% of a shop's speed", "Maintenance that keeps a weapon from jamming: failures −40%"] },
        ],
      },
      {
        rung: "licensed",
        gate: { licence: "Union card", issuer: "foundry-workers-union", issuerName: "Foundry Workers' Union", price: "An apprenticeship served under a card-holder who can end it with a word, and dues for the rest of your life" },
        blueprints: [
          { name: "Seal a rig", does: ["An infusion rig that will not vent: +1 armour plate carried"] },
          { name: "Fit a prosthetic", does: ["A limb that answers, in 4 hours on a bench"] },
          { name: "Recover an augment", does: ["A working augment out of a body in 90 seconds", "The trade's named time, met every time"] },
        ],
      },
      {
        rung: "journeyman",
        gate: { licence: "The travelling card", issuer: "foundry-workers-union", issuerName: "Foundry Workers' Union", price: "Three grounds' books signed — the Union's oldest law. A hand that has only worked one shop's tolerances is a shop hand, not a tradesman" },
        blueprints: [
          { name: "Shop speed anywhere", does: ["Full-shop repair speed from a field bench", "A weapon rebuilt between fights, not between weeks"] },
          { name: "Pattern work", does: ["Copy any piece you can disassemble — 80% of the original's quality, every time"] },
        ],
      },
      {
        rung: "master",
        gate: { licence: "Master's mark", issuer: "foundry-workers-union", issuerName: "Foundry Workers' Union", price: "The hall's piece, judged in the open by people who have seen everything. A rejected piece can be resubmitted once a year, and the hall remembers every one" },
        blueprints: [
          { name: "Cosmesis", does: ["Chrome that reads as flesh — no scanner short of a surgeon finds it"] },
          { name: "Conductor-grade rig", does: ["−15% cast costs for whoever wears it"] },
          { name: "A piece with a history", does: ["A named item. People will know it before they know you"] },
        ],
      },
    ],
    seats: [
      { ground: "port-arcadia", keeper: "Hallmaster Adaeze Quill", keeperSlug: "hallmaster-adaeze-quill", kind: "human", note: "A stately dark-skinned West African woman who runs the harbour hall. Judged the piece that got a man killed for plagiarising it.", teaches: { name: "Harbour proofing", does: ["Salt-and-storm sealing: equipment stops degrading at sea entirely"] } },
      { ground: "southside", keeper: "the Gun's Armourer", keeperSlug: "the-guns-armourer", kind: "chartered", note: "Purpose-built hands and a serial before a name — Southside forgave the origin because of the work. Nobody knows the name. Everybody knows the work.", teaches: { name: "The quiet action", does: ["A firearm silent to 10m without losing a grain of power", "Southside will not teach it twice"] } },
      { ground: "the-high-holdfasts", keeper: "Forgemistress Ada Krail", keeperSlug: "forgemistress-ada-krail", kind: "human", note: "A pale, soot-scarred mountain woman. Her hall is a mountain's heart and her standards are its bedrock.", teaches: { name: "Cold-forge lamination", does: ["Plates +1 hit before breaking, forged in freezing air", "The holdfasts' plate, and nobody else's"] } },
      { ground: "the-ocean", keeper: "— seat drawn, keeper unnamed", note: "Somewhere on the lanes is a ship-engineer worth a book signature. The lanes are not written.", teaches: { name: "— reserved", does: ["Marine engineering waits on the sea lanes, with Pilotage"] } },
    ],
  },
  {
    slug: "logistics",
    name: "Logistics",
    tagline: "The quartermaster's trade. Decides who gets what, in writing.",
    workUnit: "a load allocated and signed for",
    proving: "Run a starving column's books for a month and end it with nobody dead of your arithmetic. The Army picks the column.",
    tiers: [
      {
        rung: "apprentice",
        blueprints: [
          { name: "Inventory", does: ["Counts that are actually right", "+15% ammunition carried, because none of it is lost"] },
        ],
      },
      {
        rung: "licensed",
        gate: { licence: "Quartermaster's warrant", issuer: "peninsula-expeditionary-army", issuerName: "Peninsula Expeditionary Army", price: "A warrant is a signature you cannot take back — shortages become yours, in writing, with your name where the blame goes" },
        blueprints: [
          { name: "Allocate under scarcity", does: ["+30% ammunition carried and +1 dose into every fight", "In writing, which means somebody goes without and it is on your paper"] },
          { name: "The dose ledger", does: ["Every dose in the column tracked by name — theft becomes visible in a day"] },
        ],
      },
      {
        rung: "journeyman",
        gate: { licence: "The route warrant", issuer: "peninsula-expeditionary-army", issuerName: "Peninsula Expeditionary Army", price: "Three grounds' books signed. Supply is geography; a quartermaster who knows one road knows nothing yet" },
        blueprints: [
          { name: "The manifest", does: ["Run supply for three columns at once without a count slipping", "+40% ammunition carried, and +1 dose for every ally near you"] },
          { name: "Cold chain", does: ["Perishables, doses and blood move at full grade across any distance you plan"] },
        ],
      },
      {
        rung: "master",
        gate: { licence: "The order", issuer: "peninsula-expeditionary-army", issuerName: "Peninsula Expeditionary Army", price: "Handed to one officer per column after the month that proves you, and it is never given back — resigning the order is a court-martial with better manners" },
        blueprints: [
          { name: "Hold the order", does: ["A Forge rebuilds one body at a time, and you sequence the queue", "+50% ammunition and +2 doses into every fight"] },
          { name: "Sound the horn", does: ["Calls the reserve. It comes, once, and the ground it leaves is uncovered"] },
        ],
      },
    ],
    seats: [
      { ground: "port-arcadia", keeper: "Harbourmaster Teuila Wren", keeperSlug: "harbourmaster-teuila-wren", kind: "human", note: "A big, laughing Pacific-islander woman — Pearl's dockside ledger walks and talks, and nothing crosses the quay unsigned.", teaches: { name: "Bonded warehouse", does: ["Stores held in the harbour's bond survive theft, fire and seizure — on paper, and paper wins"] } },
      { ground: "the-dust-roads", keeper: "Caravan-Mother Ilyas", keeperSlug: "caravan-mother-ilyas", kind: "human", note: "A hawk-faced desert matriarch in indigo veils. Runs the compacts' longest route; has buried three partners and zero cargoes.", teaches: { name: "Dead reckoning freight", does: ["Route a convoy across unmapped ground with zero loss — the desert signs your book itself"] } },
      { ground: "the-free-islands", keeper: "the Ledger of Brine", keeperSlug: "the-ledger-of-brine", kind: "echo", note: "An Echo in a hull-mounted Forge Core — the League's count-house is a ship, and its accountant is a light that has never once been wrong about a debt. The ship moves; the debts do not.", teaches: { name: "Grey manifest", does: ["Move cargo no charter would touch, clean at both ends", "The League's price is that you never ask theirs"] } },
      { ground: "the-far-shore", keeper: "— seat drawn, keeper unnamed", note: "Every shore has a quartermaster. This one is not written yet.", teaches: { name: "— reserved", does: ["The far shore's supply lines wait for their writer"] } },
    ],
  },
  {
    slug: "architecture",
    name: "Architecture",
    tagline: "The builder. Walls, and a plan for when they fail.",
    workUnit: "a structure raised or shored",
    proving: "A wall of yours must survive a third assault it was watched being built for. The trade waits for the assault; so do you.",
    tiers: [
      {
        rung: "apprentice",
        blueprints: [
          { name: "Repairs and shoring", does: ["A structure that stops falling down", "Cover that holds one hit before it stops being cover"] },
        ],
      },
      {
        rung: "licensed",
        gate: { licence: "Builder's certificate", issuer: "foundry-workers-union", issuerName: "Foundry Workers' Union", price: "The hall signs for load paths. If your wall drops on somebody, the hall answers too — which is why the hall says no easily and often" },
        blueprints: [
          { name: "Fortify to load path", does: ["Prepared ground gives everyone in it +1 armour plate"] },
          { name: "Forge housing", does: ["A housing that survives a shell — the Forge stays lit through a bombardment"] },
        ],
      },
      {
        rung: "journeyman",
        gate: { licence: "The survey book", issuer: "foundry-workers-union", issuerName: "Foundry Workers' Union", price: "Three grounds' books signed. Ground is the whole trade — marsh, rock, sand and street each break a different builder" },
        blueprints: [
          { name: "Field works", does: ["Real fortification in hours, not days: prepared ground −5% damage for everyone on it"] },
          { name: "Read a ruin", does: ["Any structure's collapse story at a glance — what fell, what was pushed, what is still waiting to"] },
        ],
      },
      {
        rung: "master",
        gate: { licence: "The holdfast sitting", issuer: "mountain-holdfasts", issuerName: "Mountain Holdfasts", price: "They teach it to people who intend to stay — the sitting lasts a season, and leaving early ends it forever. Your proving wall must already have held" },
        blueprints: [
          { name: "Hold", does: ["Walls that survive a third assault, not a first", "Prepared ground gives +1 plate and −10% damage to everyone behind it"] },
          { name: "The collapse plan", does: ["When the wall goes, it goes the way you drew it — the fallback is already built"] },
        ],
      },
    ],
    seats: [
      { ground: "port-arcadia", keeper: "Surveyor Inés Alarcón", keeperSlug: "surveyor-ines-alarcon", kind: "returnee", note: "A Returnee — olive-skinned, unhurried, older than the seals on the vaults she maps, because she watched them being poured. Parts of her map are for sale.", teaches: { name: "Undercity purchase", does: ["Build downward safely into pre-Drain works — basements, tunnels, vault access"] } },
      { ground: "the-high-holdfasts", keeper: "Stonemother Ravn", keeperSlug: "stonemother-ravn", kind: "human", note: "A weathered, flint-eyed northern woman. Her family has held one wall for nine generations; it has never fallen.", teaches: { name: "The ninth course", does: ["The holdfasts' bonding course: walls +1 assault survived beyond their rating"] } },
      { ground: "bloomfall-reach", keeper: "Warden-Builder Naledi Osk", keeperSlug: "warden-builder-naledi-osk", kind: "human", note: "A wiry, dark-skinned southern-African woman who builds in country that grows back overnight. Her walls negotiate.", teaches: { name: "Living lumber", does: ["Build with adaptive growth instead of against it — structures self-repair 10% a day"] } },
      { ground: "the-verdant-marsh", keeper: "— seat drawn, keeper unnamed", note: "The clans build on water and have never written down how.", teaches: { name: "— reserved", does: ["Marsh foundations wait for the clans' writer"] } },
    ],
  },
  {
    slug: "extraction",
    name: "Extraction",
    tagline: "Mining and farming, one trade. The dark tier always pays better.",
    workUnit: "a claim worked",
    proving: "Bring a worked-dead claim back to yield inside a season — the trade hands you the corpse of somebody else's greed.",
    tiers: [
      {
        rung: "apprentice",
        blueprints: [
          { name: "Work a claim", does: ["Standard yield off ordinary ground", "Nothing you take here is worth hiding"] },
        ],
      },
      {
        rung: "licensed",
        gate: { licence: "Dark-tier permit", issuer: "aegis-extraction-consortium", issuerName: "Aegis Extraction Consortium", price: "Quotas, paperwork, and a permit that names you personally when the ground stops producing — Aegis never signs the blame" },
        blueprints: [
          { name: "Dark-tier extraction", does: ["3× the value per claim, with quotas and paperwork", "The ground is measurably worse afterwards, and the permit has your name on it"] },
          { name: "Field supply", does: ["+1 dose into every fight, off your own take"] },
        ],
      },
      {
        rung: "journeyman",
        gate: { licence: "The prospector's book", issuer: "aegis-extraction-consortium", issuerName: "Aegis Extraction Consortium", price: "Three grounds' books signed. Every ground hides its wealth differently, and a digger who knows one seam knows one seam" },
        blueprints: [
          { name: "Vein sense", does: ["Read what a claim actually holds before breaking ground — no more dry shafts", "+25% yield from every claim you site yourself"] },
          { name: "Two crews", does: ["Run a second claim without being on it, at 70% of your own hand's yield"] },
        ],
      },
      {
        rung: "master",
        gate: { licence: "Clan teaching", issuer: "verdant-marsh-clans", issuerName: "Verdant Marsh Clans", price: "They teach the partial take to people who stop working the dark tier — the proving claim comes first, and they check for the rest of your life that you stopped" },
        blueprints: [
          { name: "Partial take", does: ["Harvest without killing the source — the claim produces again next season"] },
          { name: "Recovery", does: ["Worked ground brought back toward baseline, and no further", "Takes a season per claim, and nobody pays you for it"] },
        ],
      },
    ],
    seats: [
      { ground: "bloomfall-reach", keeper: "Quotamaster Jexa Hale", keeperSlug: "quotamaster-jexa-hale", kind: "chartered", note: "Purpose-built for counting — Aegis's Reach office in one person, serial number filed before her name. Counts what the Reach grows back and pretends not to notice it growing.", teaches: { name: "Bloom harvest", does: ["Take adaptive stock live and stable — the Reach's variants, worth 5× ordinary take"] } },
      { ground: "the-dust-roads", keeper: "the Seam Witch", keeperSlug: "the-seam-witch", kind: "beast", note: "A blind burrower older than the compacts — a beast the size of a wagon that surfaces where water and ore run. The caravans follow her casts, sign their books at her spoil-heaps, and pay her in carrion and silence.", teaches: { name: "Dry farming", does: ["Yield off ground the maps call dead — the desert's own agriculture"] } },
      { ground: "the-high-holdfasts", keeper: "Delver Ossian Krail", keeperSlug: "delver-ossian-krail", kind: "human", note: "The Forgemistress's brother — pale, quiet, half his hair gone to rockdust. Digs where the mountain permits and not one span further.", teaches: { name: "Deep-rock reading", does: ["Know a shaft's collapse risk exactly before entering — cave-ins stop being surprises"] } },
      { ground: "the-far-shore", keeper: "— seat drawn, keeper unnamed", note: "Whatever the far shore grows or hides, somebody there works it.", teaches: { name: "— reserved", does: ["The far shore's ground waits for its writer"] } },
    ],
  },
  {
    slug: "culinary",
    name: "Culinary",
    tagline: "The cook. The only thing in the world that gives Composure back.",
    workUnit: "a company fed",
    proving: "Cook for a company the day after it lost people. If they talk to each other again by the end of the meal, you passed.",
    tiers: [
      {
        rung: "apprentice",
        blueprints: [
          { name: "Field rations", does: ["Food that does not cost morale to eat", "Half a wound closed per person between fights"] },
        ],
      },
      {
        rung: "licensed",
        gate: { licence: "Provisioner's contract", issuer: "tropic-pearl-trade-house", issuerName: "Tropic Pearl Trade House", price: "Pearl signs provisioning contracts and Pearl decides what your stores cost next month — the contract is a leash with a wage attached" },
        blueprints: [
          { name: "Stretch a store", does: ["A week past where the store ends, with nobody weaker for it"] },
          { name: "Hot food under fire", does: ["1 wound closed per person between fights"] },
        ],
      },
      {
        rung: "journeyman",
        gate: { licence: "The road kitchen", issuer: "tropic-pearl-trade-house", issuerName: "Tropic Pearl Trade House", price: "Three grounds' books signed. Every ground eats differently, and a cook who cannot feed strangers their own food is a camp cook forever" },
        blueprints: [
          { name: "Forage table", does: ["A full meal from any ground's own shelf — no supply line, no stores drawn down"] },
          { name: "Mess at scale", does: ["Feed a whole outpost to field standard from one kitchen", "+10% of a caster's pool back for everyone at the table"] },
        ],
      },
      {
        rung: "master",
        gate: { licence: "No certificate — a table", issuer: "free-islander-league", issuerName: "Free Islander League", price: "You cook for the League's own until they say it was a real meal. They are honest about it, they are patient about it, and they have said no for years at a stretch" },
        blueprints: [
          { name: "A real meal", does: ["Restores Composure — nothing else in the world does", "+25% of a caster's pool back", "1 wound closed per person, and the company talks to each other again"] },
        ],
      },
    ],
    seats: [
      { ground: "port-arcadia", keeper: "Auntie Meridian", keeperSlug: "auntie-meridian", kind: "human", note: "A round, iron-eyed Black matriarch whose harbour kitchen has fed four coups and catered two. Neutral ground, absolutely enforced.", teaches: { name: "The neutral table", does: ["A meal at which nobody fights — enemies eat together under your roof, and it holds"] } },
      { ground: "the-verdant-marsh", keeper: "First-Cook Nzinga", keeperSlug: "first-cook-nzinga", kind: "human", note: "A scar-knuckled, deep-brown clanswoman. Everything on her tables was alive this morning and most of it argued.", teaches: { name: "The marsh table", does: ["Cook the marsh's own venom table safe — delicacies from what kills other people's cooks"] } },
      { ground: "the-free-islands", keeper: "the Galley Saint", keeperSlug: "the-galley-saint", kind: "human", note: "A whip-lean brown islander man with salt-white hair — one ship, one stove, and a reputation the whole League defers to.", teaches: { name: "Sea-legs supper", does: ["Meals that hold down in any weather — seasickness and fatigue penalties erased for a day"] } },
      { ground: "southside", keeper: "— seat drawn, keeper unnamed", note: "Southside eats late and talks quietly. Its kitchen is not written yet.", teaches: { name: "— reserved", does: ["The gun quarter's table waits for its writer"] } },
    ],
  },
  {
    slug: "xenobiology",
    name: "Xenobiology",
    tagline: "The beast-worker. The Wardens certify, and the Sanctuary teaches.",
    workUnit: "an animal handled or assayed",
    proving: "Move an animal the lodges have written off as unmovable, without a scratch on either of you. The Wardens pick the animal.",
    tiers: [
      {
        rung: "apprentice",
        blueprints: [
          { name: "Husbandry", does: ["Animals that stay fed, calm and transportable", "A bonded animal opens the day fight-ready"] },
        ],
      },
      {
        rung: "licensed",
        gate: { licence: "Warden certification", issuer: "wardens-monster-hunter-guild", issuerName: "Wardens' Monster Hunter Guild", price: "The Guild certifies, expects you to answer a lodge call, and remembers if you do not — the charter is older than the state and so are the grudges" },
        blueprints: [
          { name: "Field assay", does: ["Names what a creature is and what it can do, in 60 seconds at 20m"] },
          { name: "Sign off Morphic material", does: ["Harvested traits that are legal to carry and safe to wear"] },
          { name: "Handler's kit", does: ["+1 armour plate, from plate you cut yourself"] },
        ],
      },
      {
        rung: "journeyman",
        gate: { licence: "The range book", issuer: "wardens-monster-hunter-guild", issuerName: "Wardens' Monster Hunter Guild", price: "Three grounds' books signed. An animal is its ground; a handler who knows one ecology handles one ecology" },
        blueprints: [
          { name: "String a team", does: ["Work three bonded animals at once — pack, mount and watcher on one whistle"] },
          { name: "Field surgery, animal", does: ["A wounded beast stabilised and moving in 5 minutes", "Bonded animals mend fully between fights"] },
        ],
      },
      {
        rung: "master",
        gate: { licence: "The Sanctuary's teaching", issuer: "sanctuary-of-living-beasts", issuerName: "Sanctuary of Living Beasts", price: "They teach people who have stopped taking trophies — the proving move comes first, the Wardens watch you make it, and the Sanctuary decides whether they liked how" },
        blueprints: [
          { name: "Read the rung", does: ["A creature's mutation tier on sight, and the damage type that drove it there", "Instant, at any range you can see it"] },
          { name: "Handle the unhandleable", does: ["Animals nobody else can move, moved"] },
        ],
      },
    ],
    seats: [
      { ground: "bloomfall-reach", keeper: "Lodge-Keeper Mara Quill", keeperSlug: "mara-quill", kind: "human", note: "Warden tracker — an existing codex character; her lodge book is the Reach's real census.", teaches: { name: "Variant handling", does: ["Work the Reach's adaptive stock safely — mutation tells read before they fire"] } },
      { ground: "the-verdant-marsh", keeper: "the Heron Speaker", keeperSlug: "the-heron-speaker", kind: "beast", note: "A heron. The clans stopped explaining years ago. It stands where the beast-work happens, it approves or it leaves, and every handler the marsh has ever produced was watched by it first.", teaches: { name: "Marsh string", does: ["Bond semi-aquatic stock nobody else works — the marsh's own mounts and watchers"] } },
      { ground: "the-dust-roads", keeper: "Drover Ashkani", keeperSlug: "drover-ashkani", kind: "human", note: "A copper-skinned, kohl-eyed desert man who moves the compacts' herds through country with no water and worse. Loses none.", teaches: { name: "Dry drove", does: ["Animals cross waterless ground at full pace for 3 days — the desert's own husbandry"] } },
      { ground: "the-ocean", keeper: "— seat drawn, keeper unnamed", note: "The lanes have their own animals. Their handler is not written yet.", teaches: { name: "— reserved", does: ["The sea's stock waits on the lanes, with Pilotage"] } },
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
 * balance campaign measured; the lower rungs scale beneath them, and every
 * ladder is monotone — a test enforces that a higher rung never measures
 * worse than the rung below it.
 */
export const professionEffects: Record<string, ProfessionEffect> = {
  "medicine/apprentice": { partyRecovery: 0.5 },
  "medicine/licensed": { partyRecovery: 1, partyDyingClock: 3 },
  "medicine/journeyman": { partyRecovery: 1.5, partyDyingClock: 4 },
  "medicine/master": { partyRecovery: 2, partyDyingClock: 6 },

  "refining/apprentice": {},
  "refining/licensed": { extraDoses: 1, poolRestore: 0.1 },
  "refining/journeyman": { extraDoses: 2, poolRestore: 0.1 },
  "refining/master": { extraDoses: 2, poolRestore: 0.15 },

  "chemistry/apprentice": { poolRestore: 0.1 },
  "chemistry/licensed": { extraDoses: 1, poolRestore: 0.33 },
  "chemistry/journeyman": { extraDoses: 2, poolRestore: 0.33 },
  "chemistry/master": { extraDoses: 2, corruptionPace: 0.7, poolRestore: 0.33 },

  "engineering/apprentice": {},
  "engineering/licensed": { extraPlates: 1 },
  "engineering/journeyman": { extraPlates: 1, castCostRelief: 0.08 },
  "engineering/master": { extraPlates: 1, castCostRelief: 0.15 },

  "logistics/apprentice": { ammoMultiplier: 1.15 },
  "logistics/licensed": { extraDoses: 1, ammoMultiplier: 1.3 },
  "logistics/journeyman": { extraDoses: 1, ammoMultiplier: 1.4 },
  "logistics/master": { extraDoses: 2, ammoMultiplier: 1.5 },

  "architecture/apprentice": {},
  "architecture/licensed": { extraPlates: 1 },
  "architecture/journeyman": { extraPlates: 1, damageReduction: 0.05 },
  "architecture/master": { extraPlates: 1, damageReduction: 0.1 },

  "extraction/apprentice": {},
  "extraction/licensed": { extraDoses: 1 },
  "extraction/journeyman": { extraDoses: 1, ammoMultiplier: 1.1 },
  "extraction/master": { extraDoses: 1, ammoMultiplier: 1.2 },

  "culinary/apprentice": { partyRecovery: 0.5 },
  "culinary/licensed": { partyRecovery: 1, composureRestore: 1 },
  "culinary/journeyman": { partyRecovery: 1, composureRestore: 1, poolRestore: 0.1 },
  "culinary/master": { partyRecovery: 1, composureRestore: 2, poolRestore: 0.25 },

  "xenobiology/apprentice": {},
  "xenobiology/licensed": { partyRecovery: 0.5, extraPlates: 1 },
  "xenobiology/journeyman": { partyRecovery: 1, extraPlates: 1 },
  "xenobiology/master": { partyRecovery: 1, extraPlates: 1, partyDyingClock: 2 },
};

export function professionBySlug(slug: string): Profession | null {
  return professions.find((trade) => trade.slug === slug) ?? null;
}

export function effectsForTrade(slug: string, rung: Rung): ProfessionEffect {
  return professionEffects[`${slug}/${rung}`] ?? {};
}
