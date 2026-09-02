/**
 * Holding Ground, as data the Kingdom page reads: the five rungs and the
 * verbs each adds, the four ways to get ground, the Kingdom Level law, the
 * six realm trees, the five faiths and the secular crown with the sims'
 * morale numbers, the siege as a Forge clock with the measured storm/wait
 * table, Court Day's priced options, the soulless garrison, and the standing
 * laws. Canon is the `kingdom-management` and `the-faith-lane` dossiers
 * (owner-approved 2026-09-01); the numbers are the kingdom balance campaign's
 * (Docs/sims/MARTINO_KM_SIM_FINDINGS.md, tuning pass). Nothing here is new
 * design — it is the same law laid out to be read.
 */

export type HoldingRung = { name: string; holds: string; how: string; verbs: string[] };

export const holdingRungs: HoldingRung[] = [
  { name: "Homestead", holds: "A parcel and a roof.", how: "Buy a plot, drain it, build on it.", verbs: ["build", "farm", "fence", "hire hands"] },
  { name: "Outpost", holds: "A fortified point with a job.", how: "Hold a road or a crossing.", verbs: ["garrison", "patrols", "supply", "a signal plan"] },
  { name: "Town", holds: "A population that is not yours.", how: "Grow one, or take one.", verbs: ["districts", "trades", "law", "admission policy"] },
  { name: "City", holds: "Districts, wharves, politics.", how: "Seized, granted, or founded — rarely built from mud.", verbs: ["grand projects", "real armies", "factions inside your own walls"] },
  { name: "Kingdom", holds: "Multiple holdings and vassals.", how: "The endgame of holding ground.", verbs: ["doctrine", "diplomacy", "war", "succession", "a seat at the world's table"] },
];

export type GroundVerb = { name: string; costs: string; gets: string; notes: string };

export const groundVerbs: GroundVerb[] = [
  { name: "Buy", costs: "Coin, and patience.", gets: "One of a region's few pre-defined plots: ground you can buy outright and build your own buildings on.", notes: "Not every region has one, and the ones that do have a handful. Rare on purpose: the world is owned. The Riverlands holds three, in courthouse escrow: the Charters." },
  { name: "Seize", costs: "Blood, supply, consequences.", gets: "Any unshielded holding, by siege or coup.", notes: "Inside a faction the leader decides who keeps what you took, even if you took it." },
  { name: "Earn", costs: "Service and obligation.", gets: "A granted fief from your faction, a ruler, or the Heartland courthouse.", notes: "Grants come with the obligations grants exist for." },
  { name: "Found", costs: "Everything, slowly.", gets: "Ground that is yours alone.", notes: "Nobody holds paper over you; nobody owes you help." },
];

/**
 * Custom building happens on plots: a few pre-defined parcels in certain
 * regions that can be bought outright and built on. The Riverlands' three
 * are the Charters — old land charters in courthouse escrow, released by
 * campaign progress, each a different building lesson. They are plots, not
 * rungs of the ladder: the first is a homestead, the second an economy, the
 * third a defence, and none of them is a town.
 */
export type Plot = { slug: string; name: string; where: string; what: string; teaches: string; unlock: string };

export const plotsLaw = "Certain regions hold a few specific plots of land you can buy and build your own buildings on. Not every region has one; the ones that do have a handful, pre-defined, and the world already owns the rest.";

export const riverlandsPlots: Plot[] = [
  { slug: "first-charter", name: "First Charter", where: "A bankside plot below Heartland.", what: "The homestead ground: drain it, build on it, a roof and a fence.", teaches: "Building. The first lesson every Riverland landholder learns: the ground is drained before it is built.", unlock: "Held in courthouse escrow by the Judge of Heartland; released by campaign progress." },
  { slug: "second-charter", name: "Second Charter", where: "A confluence island with wharf rights.", what: "Floods in the old pattern; needs levees, drainage and pilings before it holds serious building.", teaches: "Economy. Wharf rights, the Waterworks at commercial scale, the money side of holding ground.", unlock: "Held in courthouse escrow; released by campaign progress after the first." },
  { slug: "third-charter", name: "Third Charter", where: "A ruined watch-fort on Riftgate, with a flooded ditch and a wall worth keeping.", what: "A defensible ruin with the Bone Market for a neighbour.", teaches: "Defence. Garrison, walls, a signal plan, and who your neighbours are.", unlock: "Held in courthouse escrow; released last." },
];

export const sacredLaw = "Nothing is unseizable, nothing is cheap, and some things are unkeepable. A seized sacred site never becomes a normal holding: it generates grievance until you return it, gift it, or win its people.";

export const kingdomLevel = {
  xpFrom: ["holdings prospering, day by day", "projects finished", "wars won and sieges stood (the defender earns it too)", "treaties signed and trade moved", "Court Days handled"],
  extends: ["how many holdings you can hold", "how big your armies muster", "officer seats and vassal slots", "which project tiers open"],
  curve: "Each level costs 1.6× the last.",
  ceilings: "Every third level is a ceiling no XP can pass: the realm quests its proving, the way a trade proves a master.",
  firstCeiling: "In the campaign the first ceiling lands on day 99 to 144 of a world.",
  teacher: "The Crown Without a Name — the kingdom pass's reserved ceiling teacher.",
  tallVsWide: "Governance XP is real work only, so a tall realm levels at the pace of a wide one: the five powers converge at level 5 over 420 days.",
};

export type RealmTree = { name: string; buys: string; note: string };

export const realmTrees: RealmTree[] = [
  { name: "Might", buys: "Levies, garrisons, sieges.", note: "The war engine. Dominance is taken, not accumulated." },
  { name: "Coffers", buys: "Tariffs, routes, markets.", note: "Pays for everything else; scores nothing on its own." },
  { name: "Works", buys: "Machinery, infrastructure, bought additions.", note: "Where the soulless garrison and the deep Forge clock come from." },
  { name: "Arcana", buys: "Forge efficiency, reserves, licensed casting.", note: "Cheaper reclamations, a longer siege clock, more lawful casters." },
  { name: "Roots", buys: "People, land, food, loyalty.", note: "Morale, growth and the admission policy that keeps a town yours." },
  { name: "Faith", buys: "Adoption, spread, tolerance.", note: "The deep end of your faith's perk; belief as a build." },
];

export const realmTreesLaw = "Your own kingdom only. Every level grants realm points to spec the six trees your way; join a faction instead and you live under their doctrine — their spec, your problem.";

export type FaithCard = { slug: string; name: string; perk: string; price: string; morale: string; secular?: boolean };

export const faiths: FaithCard[] = [
  { slug: "the-first-gift", name: "The First Gift", perk: "The given magic thrives: gifted casters, creature pacts, the beast trade, Sanctuary aid.", price: "Your own law restricts the harvest. Essence costs climb; the extraction powers treat you as an obstacle.", morale: "A faith-matched crown holds morale at 92–94." },
  { slug: "the-ossuary-rites", name: "The Ossuary Rites", perk: "The dead work: lawful necromantic labour and garrison; funerals feed the realm.", price: "The living hesitate. Growth and immigration suffer; the First Gift's faithful call your workforce blasphemy.", morale: "A faith-matched crown holds morale at 92–94." },
  { slug: "the-forgefaith", name: "The Forgefaith", perk: "Reclamation as devotion: cheaper reclamations, faster binding, glad congregations.", price: "Dependence. A holding without a Forge bleeds morale, and losing a Core is a military and a spiritual disaster.", morale: "A faith-matched crown holds morale at 92–94." },
  { slug: "the-old-roads", name: "The Old Roads", perk: "The customs hold: truce grounds, safe crossings, hospitality bless everything you move.", price: "The customs bind you. Honour every truce and guest-right, even for enemies, or the crossroads remember.", morale: "A faith-matched crown holds morale at 92–94." },
  { slug: "the-crimson-communion", name: "The Crimson Communion", perk: "Blood pays now: immediate, potent war and ritual power on Choir credit.", price: "The debt compounds; every decent power suppresses you; the Choir always collects.", morale: "A faith-matched crown holds morale at 92–94." },
  { slug: "the-faith-lane", name: "Secular", perk: "No faith's price binds you; no customs constrain your wars; doctrine entirely yours.", price: "Faith-heavy populations are harder to please: morale bleeds in proportion to their devotion.", morale: "Over a devout people morale falls 100 → 82, then climbs back to 89 as they secularise (5% → 56% in two world-years).", secular: true },
];

export const faithLaw = {
  read: "Faith is read: the rites you keep and the faith your realm adopts move prices, access, dialogue and quests everywhere, like corruption tells and suspicion.",
  conversion: "Conversion half-life is 15.5 world-months (about 31 real days of server time) before shrines, the Faith tree and suppression pull it faster.",
  reshaping: "Populations can be reshaped over years by policy, patronage, suppression and drift — at cost, and noticed.",
};

export type SiegePosture = { name: string; how: string; table: string; doctrine: string; risk: string };

export const siegeLaw = {
  clock: "A siege is a Forge clock. The defender's reserve rebuilds every fallen body at 35 + 11.7 × level Essence until it is dry; reserves are sized in sustained days.",
  postures: [
    { name: "Storm", how: "Assault early, for speed.", table: "A 2-day clock falls in 11 days · a 6-day clock in 16 · a 12-day capital clock rarely falls at all, and usually burned.", doctrine: "Against a shallow clock, storm: you cannot outrun it, and it dies before your assault does, so the prize comes intact anyway.", risk: "The prize may burn; your losses run 1.25× the wait posture's." },
    { name: "Wait", how: "Sit on the walls and let the reserve run dry.", table: "A 2-day clock falls in 23 days · a 6-day clock in 35 · a 12-day capital clock starves the attacker first.", doctrine: "Against a deep clock, storming is the only road; waiting loses. Deep clocks are what make capitals a different tier of war.", risk: "Time: every day outside the walls is a day the coalition can turn on you." },
  ] as SiegePosture[],
  garrisonTip: "A fortress of veterans is a fortress with an expensive clock: a level-30 defender costs 386 Essence to rebuild, so a level-30 garrison falls in 15.5 days where a level-4 one holds 17.8. Promote the garrison and deepen the reserve together, or not at all.",
  intact: "Storm early and you may take it burned; wait and you take it whole. The intact prize is the reason to wait.",
};

export type CourtOption = { name: string; what: string; value: string; note: string };

export const courtDay = {
  when: "The first of every month. The court convenes with a real docket: petitions, windfalls, disasters, omens, absurdities.",
  options: [
    { name: "Attend and rule", what: "You sit the court and decide the docket yourself.", value: "771 coin expected over 14 months", note: "Roughly double what auto-doctrine clears." },
    { name: "A good governor", what: "Somebody competent rules in your name; the Court Record waits for you.", value: "542 coin expected over 14 months", note: "Between you and doctrine." },
    { name: "Skip: doctrine decides", what: "Your standing doctrine auto-rules every petition.", value: "313 coin expected over 14 months", note: "Doctrine does not improvise." },
    { name: "A poor governor", what: "Somebody incompetent rules in your name.", value: "192 coin expected over 14 months", note: "Worse than no governor at all. A warning label on the governor pool." },
  ] as CourtOption[],
};

export const machines = {
  law: "Machines defend without souls: no Forge, no reclamation, destroyed is destroyed, replaced with coin and materials. They sip Essence daily to run: 0.05 per unit per day.",
  hybrid: "At 160 total defence on a 6-day clock: a pure living wall holds 16.3 days (storm) or 34.8 (wait) and ends with the reserve at zero; 100 machines and 60 living holds 15.0 or 31.5 and ends with a live Forge for the relief and the retaking.",
  insurance: "One full siege burns about 11,856 Essence in reclamations; 100 machines cost 5 a day. The siege's burn equals 79 months of their upkeep.",
  pure: "A pure-machine wall abolishes the clock: there is nothing for a wait siege to starve, so storming is the attacker's only road. Paid for in blood, or left alone.",
  vanity: "The drain only bites at vanity scale: 400 idle machines cost 20 Essence a day.",
};

export const syndicate = {
  leader: "The leader decides.",
  members: "Members hold the officer seats with real authority in their domains.",
  shared: "The realm's level, ceilings and trees are everyone's work.",
  servers: "A server can carry several Syndicates vying with each other and the NPC powers alike.",
};

export const succession = {
  trigger: "A ruler's true death starts a live succession crisis.",
  heir: "The heir you named holds the realm or it fractures, decided by what you actually built: officers, treasury, doctrine, faith.",
  after: "What survives persists as an NPC power the next run meets, wearing your old name.",
  law: "The realm remembers you; it does not belong to you.",
};

export const standingLaws = [
  "Every Great Power starts a world at the same total points; shapes differ, totals do not, and everything after the first day is play.",
  "No world snowballs: the coalition instinct turns the powers on any leader past 1.18× the field, and the spread holds at 1.3× with eight lead changes a run.",
  "Story-critical ground never flips until its arc resolves.",
  "Your crown joins the scoreboard when the world recognises it — the earn-the-seat entrant is the history-breaker these worlds leave room for.",
  "The Free Powers bloc answers an attack on any of it as one, and finished every simulated world intact.",
  "City-states endure the early game and become prizes in the late one: late-game wars swallow institution seats.",
  "There are no alternate victory engines. Dominance is taken, not accumulated.",
];
