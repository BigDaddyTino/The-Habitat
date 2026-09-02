/**
 * Holding Ground, as data the Kingdom page reads: the five Ranks of the
 * Crown (the realm's level system, three levels a rank, a proving at every
 * ceiling), the fifteen-level ledger of perks and caps, the six court seats,
 * the four ways to get ground, the six realm trees with their perk nodes,
 * the five faiths and the secular crown with the sims' morale numbers, the
 * siege as a Forge clock with the measured storm/wait table, Court Day's
 * priced options, the soulless garrison, and the standing laws. Canon is
 * the `kingdom-management` and `the-faith-lane` dossiers (owner-approved
 * 2026-09-01; ranks, ledger and perk nodes 2026-09-02); the siege, court
 * and morale numbers are the kingdom balance campaign's
 * (Docs/sims/MARTINO_KM_SIM_FINDINGS.md, tuning pass). The ledger's caps
 * are hand-set and marked so until a sim measures them.
 */

/**
 * The Ranks of the Crown. The five names that used to be drawn as a ladder
 * of holdings are the realm's level system: Kingdom Level 1–15, three levels
 * a rank, and every third level a ceiling that XP cannot pass, so the realm
 * proves its way into the next rank. Each rank licenses a scale of holding
 * and adds verbs; none retires the ones below.
 */
export type CrownRank = {
  numeral: string;
  title: string;
  realm: string;
  levels: [number, number];
  holds: string;
  how: string;
  verbs: string[];
  seats: string;
};

export const crownRanks: CrownRank[] = [
  { numeral: "I", title: "Freeholder", realm: "The Freehold", levels: [1, 3], holds: "A parcel and a roof.", how: "Buy a plot, drain it, build on it.", verbs: ["build", "farm", "fence", "hire hands"], seats: "A table, not a court." },
  { numeral: "II", title: "Warden", realm: "The Ward", levels: [4, 6], holds: "A fortified point with a job.", how: "Hold a road or a crossing.", verbs: ["garrison", "patrols", "supply", "a signal plan"], seats: "The Captain." },
  { numeral: "III", title: "Magistrate", realm: "The Township", levels: [7, 9], holds: "A population that is not yours.", how: "Grow one, or take one.", verbs: ["districts", "trades", "law", "admission policy"], seats: "The Chancellor and the Broker." },
  { numeral: "IV", title: "Lord", realm: "The City", levels: [10, 12], holds: "Districts, wharves, politics.", how: "Seized, granted, or founded; rarely built from mud.", verbs: ["grand projects", "real armies", "factions inside your own walls"], seats: "The Marshal and the Envoy." },
  { numeral: "V", title: "Crown", realm: "The Kingdom", levels: [13, 15], holds: "Multiple holdings and vassals.", how: "The world seats you; then you keep the chair.", verbs: ["doctrine", "diplomacy", "war", "succession", "a seat at the world's table"], seats: "The Spymaster; the court is whole." },
];

export const ranksLaw = "Kingdom Level runs 1 to 15. Three levels make a rank; every third level is a ceiling no XP can pass, and the realm quests its proving to enter the next rank, the way a trade proves a master. A rank licenses a scale of holding and adds verbs; none retires the ones below.";

/**
 * The provings: the four ceilings, one at every third level. The quests
 * themselves are arcs and are not written yet; these are their shapes and
 * their teachers, reserved.
 */
export type Proving = { afterLevel: number; from: string; to: string; name: string; shape: string; teacher: string };

export const provings: Proving[] = [
  { afterLevel: 3, from: "Freeholder", to: "Warden", name: "The Held Night", shape: "Your ground is attacked in earnest and stands until morning with what you built: fence, hands, signal fire. Somebody with a garrison of their own has to see it.", teacher: "The Heartland Watch; its captain's respect is the recruitment mechanic." },
  { afterLevel: 6, from: "Warden", to: "Magistrate", name: "The Second Core", shape: "A second Forge answers to you and a population that is not yours binds to it. The realm becomes a network, and a network can be cut.", teacher: "The Forge's own Resident, wherever the second Core stands." },
  { afterLevel: 9, from: "Magistrate", to: "Lord", name: "The Doctrine Crisis", shape: "A Court Day where your own people split down the middle. You write the doctrine that settles it, and live under what you wrote.", teacher: "The Judge of Heartland's courthouse; fairness must be boring." },
  { afterLevel: 12, from: "Lord", to: "Crown", name: "The Recognition", shape: "The earn-the-seat quest. The world's powers acknowledge the crown, or are made to. After it you are scored, courted and feared like any of them.", teacher: "The Crown Without a Name, the kingdom pass's reserved ceiling teacher." },
];

/**
 * The ledger: every Kingdom Level, its rank, the perk it grants and the caps
 * it extends. Caps are hand-set for the page and marked untested; the sims'
 * army scale and ceiling cadence are the shape they follow.
 */
export type KingdomLevel = {
  level: number;
  rank: string;
  perk: string;
  grants: string;
  caps: { holdings: string; muster: string; seats: string; vassals: string };
};

export const kingdomLevels: KingdomLevel[] = [
  { level: 1, rank: "I", perk: "Deed in Hand", grants: "The plot is yours: build, farm, fence. Court Day is a letter on the kitchen table. The first realm point.", caps: { holdings: "1", muster: "hands", seats: "—", vassals: "—" } },
  { level: 2, rank: "I", perk: "Hands and Hearth", grants: "More hands, a storehouse, wages paid from the box on the table.", caps: { holdings: "1", muster: "hands", seats: "—", vassals: "—" } },
  { level: 3, rank: "I", perk: "The Fence Line", grants: "Your hands take up arms as a militia; a signal fire on the roof. Ceiling: the Held Night.", caps: { holdings: "1", muster: "militia", seats: "—", vassals: "—" } },
  { level: 4, rank: "II", perk: "Warden's Writ", grants: "A garrison, patrols and a signal plan. The first officer seat: the Captain.", caps: { holdings: "2", muster: "40", seats: "1", vassals: "—" } },
  { level: 5, rank: "II", perk: "The Supply Line", grants: "A supply route between two holdings; the Waterworks lever at your own gate, where the locks tax the road.", caps: { holdings: "2", muster: "60", seats: "1", vassals: "—" } },
  { level: 6, rank: "II", perk: "Two Roads", grants: "Hold a road and a crossing at once; the Court Record begins. Ceiling: the Second Core.", caps: { holdings: "3", muster: "80", seats: "2", vassals: "—" } },
  { level: 7, rank: "III", perk: "Charter of Township", grants: "A population that is not yours: districts, trades, law, admission policy. Court Day convenes in a hall.", caps: { holdings: "4", muster: "120", seats: "2", vassals: "1" } },
  { level: 8, rank: "III", perk: "The Levy", grants: "The town musters; a market seal; the Chancellor and the Broker take their seats.", caps: { holdings: "4", muster: "160", seats: "4", vassals: "1" } },
  { level: 9, rank: "III", perk: "Vassal's Oath", grants: "A first vassal swears; the doctrine is written down. Ceiling: the Doctrine Crisis.", caps: { holdings: "5", muster: "200", seats: "4", vassals: "2" } },
  { level: 10, rank: "IV", perk: "Lord of the City", grants: "Grand projects, real armies, factions inside your own walls. The Marshal's seat.", caps: { holdings: "6", muster: "280", seats: "5", vassals: "3" } },
  { level: 11, rank: "IV", perk: "The March", grants: "March or delegate: a column under a commander fights by your doctrine while you are elsewhere. Mercenary paper.", caps: { holdings: "7", muster: "360", seats: "5", vassals: "4" } },
  { level: 12, rank: "IV", perk: "Court of Peers", grants: "Treaties in your own name; the Envoy's seat. Ceiling: the Recognition.", caps: { holdings: "8", muster: "440", seats: "6", vassals: "5" } },
  { level: 13, rank: "V", perk: "The Crown", grants: "A seat at the world's table: scored, courted, feared. The Spymaster's seat; the court is whole. Name an heir.", caps: { holdings: "10", muster: "480", seats: "6", vassals: "6" } },
  { level: 14, rank: "V", perk: "Doctrine of the Realm", grants: "Realm-wide doctrine and faith policy; vassal levies march on your word without waiting for Court Day.", caps: { holdings: "12", muster: "480 + columns", seats: "6", vassals: "8" } },
  { level: 15, rank: "V", perk: "The Long Reign", grants: "The cap. Holdings are limited by officers, not numbers; the Mourning is written into the realm, so what you built outlives you.", caps: { holdings: "by officers", muster: "by officers", seats: "6", vassals: "by officers" } },
];

export const kingdomLevel = {
  xpFrom: ["holdings prospering, day by day", "projects finished", "wars won and sieges stood (the defender earns it too)", "treaties signed and trade moved", "Court Days handled"],
  extends: ["how many holdings you can hold", "how big your armies muster", "officer seats and vassal slots", "which project tiers open"],
  curve: "Each level costs 1.6× the last.",
  ceilings: "Every third level is a ceiling no XP can pass: the realm quests its proving, the way a trade proves a master.",
  firstCeiling: "In the campaign the first ceiling lands on day 99 to 144 of a world.",
  teacher: "The Crown Without a Name, the kingdom pass's reserved ceiling teacher.",
  tallVsWide: "Governance XP is real work only, so a tall realm levels at the pace of a wide one: the five powers converge at level 5 over 420 days.",
  capsNote: "The caps on the ledger are hand-set and untested; the sims measured the ceiling cadence and the army scale, not these rows.",
};

/**
 * The six court seats, each tutored by a stop on the Heartland investigation
 * tour. A seat is real authority in its domain; a Syndicate's members hold
 * them.
 */
export type CourtSeat = { name: string; domain: string; tutor: string; opens: string };

export const courtSeats: CourtSeat[] = [
  { name: "The Captain", domain: "Defences, garrison, the signal plan.", tutor: "The Heartland Watch.", opens: "Level 4" },
  { name: "The Chancellor", domain: "Storefronts, tariffs, the treasury.", tutor: "Arcadia Gate's Clearinghouse.", opens: "Level 8" },
  { name: "The Broker", domain: "The gray economy: what moves off the books, and what it costs.", tutor: "Riftgate's Bone Market families.", opens: "Level 8" },
  { name: "The Marshal", domain: "Armies, levies, the march.", tutor: "Stormgate's Regulator Station.", opens: "Level 10" },
  { name: "The Envoy", domain: "Diplomacy, treaties, the coalition's ear.", tutor: "Sandgate's Standing Camp.", opens: "Level 12" },
  { name: "The Spymaster", domain: "Intel: who is lying, who is coming, who is for sale.", tutor: "Cliffgate's Winchworks.", opens: "Level 13" },
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

/**
 * The six realm trees and their perk nodes. Realm points: one a level and two
 * a proving, twenty-three by the cap, against seventy-eight points of nodes,
 * which is the class-tree law: nobody owns everything. Nodes read like talent
 * nodes: a name, one line, a cost, and where a rank is named, the rank the
 * realm must hold to buy it. The last node of every tree is its capstone.
 */
export type RealmNode = { id: string; name: string; desc: string; cost: number; rank?: "III" | "IV" | "V"; capstone?: boolean };

export type RealmTree = { slug: string; name: string; buys: string; note: string; nodes: RealmNode[] };

export const realmTrees: RealmTree[] = [
  { slug: "might", name: "Might", buys: "Levies, garrisons, sieges.", note: "The war engine. Dominance is taken, not accumulated.", nodes: [
    { id: "muster-roll", name: "Muster Roll", desc: "The levy cap rises and the levy musters a day sooner.", cost: 1 },
    { id: "standing-watch", name: "Standing Watch", desc: "Garrisons cost less to keep and patrol further out.", cost: 1 },
    { id: "siege-train", name: "Siege Train", desc: "Engines built at the wall, not hauled to it: the storm posture bites harder.", cost: 2, rank: "III" },
    { id: "iron-rations", name: "Iron Rations", desc: "Your columns eat half as much outside the walls: the wait posture sits longer.", cost: 2, rank: "III" },
    { id: "marching-orders", name: "Marching Orders", desc: "One more column in the field, and a delegated commander fights by your doctrine.", cost: 2, rank: "IV" },
    { id: "banners-answer", name: "Banners Answer", desc: "Vassal levies march on your word without waiting for a Court Day.", cost: 2, rank: "IV" },
    { id: "dominion", name: "Dominion", desc: "The world's coalition instinct tolerates your lead a little longer before it turns.", cost: 3, rank: "V", capstone: true },
  ] },
  { slug: "coffers", name: "Coffers", buys: "Tariffs, routes, markets.", note: "Pays for everything else; scores nothing on its own.", nodes: [
    { id: "toll-bar", name: "Toll Bar", desc: "Roads and locks you hold tax what passes.", cost: 1 },
    { id: "honest-weights", name: "Honest Weights", desc: "Markets in your towns pay the treasury a cut, and traders prefer them.", cost: 1 },
    { id: "chartered-routes", name: "Chartered Routes", desc: "Caravans between your holdings move under your seal, and arrive.", cost: 2, rank: "III" },
    { id: "the-factorage", name: "The Factorage", desc: "A counting-house: other powers' trade through your ground pays you too.", cost: 2, rank: "III" },
    { id: "mercenary-paper", name: "Mercenary Paper", desc: "Companies for hire sign cheaper; the invoice everyone can recite gets shorter.", cost: 2, rank: "IV" },
    { id: "war-chest", name: "War Chest", desc: "A lost holding's income is cushioned for a season while you take it back.", cost: 2, rank: "IV" },
    { id: "the-mint", name: "The Mint", desc: "Your own coin. Every power trading with you pays in it, and tariffs follow it to the world's table.", cost: 3, rank: "V", capstone: true },
  ] },
  { slug: "works", name: "Works", buys: "Machinery, infrastructure, bought additions.", note: "Where the soulless garrison and the deep Forge clock come from.", nodes: [
    { id: "drained-ground", name: "Drained Ground", desc: "Plots drain and build faster; the Waterworks' first lesson, learned.", cost: 1 },
    { id: "stone-over-timber", name: "Stone over Timber", desc: "Walls tier up sooner and repair cheaper.", cost: 1 },
    { id: "bought-additions", name: "Bought Additions", desc: "One more addition slot in every holding: machinery, profession houses.", cost: 2, rank: "III" },
    { id: "machine-shop", name: "Machine Shop", desc: "Frames a Cypherist built are kept here: machines on your wall sip less Essence.", cost: 2, rank: "III" },
    { id: "grand-projects", name: "Grand Projects", desc: "Project tiers open a rank early.", cost: 2, rank: "IV" },
    { id: "palisade-doctrine", name: "Palisade Doctrine", desc: "Palisade-frames walk between your holdings; a wall that answers a relief call.", cost: 2, rank: "IV" },
    { id: "the-works-never-sleep", name: "The Works Never Sleep", desc: "Projects and repairs run at full pace while you are absent from the realm.", cost: 3, rank: "V", capstone: true },
  ] },
  { slug: "arcana", name: "Arcana", buys: "Forge efficiency, reserves, licensed casting.", note: "Cheaper reclamations, a longer siege clock, more lawful casters.", nodes: [
    { id: "reserve-ledger", name: "Reserve Ledger", desc: "Every Forge's reserve reads in sustained days, at a glance, from the map table.", cost: 1 },
    { id: "thrift-binding", name: "Thrift Binding", desc: "The Forge rebuilds a little cheaper: the clock runs slower on the same reserve.", cost: 1 },
    { id: "deep-reserve", name: "Deep Reserve", desc: "Two more sustained days on every reserve cap.", cost: 2, rank: "III" },
    { id: "licensed-casters", name: "Licensed Casters", desc: "Lawful caster seats in your holdings; magic under licence, and taxed.", cost: 2, rank: "III" },
    { id: "core-network", name: "Core Network", desc: "Bodies rebuild at whichever of your Forges stands; a cut network still answers.", cost: 2, rank: "IV" },
    { id: "storm-ward", name: "Storm Ward", desc: "Under assault the reserve burns slower: the clock holds through a storm.", cost: 2, rank: "IV" },
    { id: "crown-core", name: "Crown Core", desc: "The capital's clock deepens to the tier a standard army cannot take.", cost: 3, rank: "V", capstone: true },
  ] },
  { slug: "roots", name: "Roots", buys: "People, land, food, loyalty.", note: "Morale, growth and the admission policy that keeps a town yours.", nodes: [
    { id: "open-gates", name: "Open Gates", desc: "Admission policy pays: people come, and stay.", cost: 1 },
    { id: "granary-law", name: "Granary Law", desc: "Food stores hold a season longer.", cost: 1 },
    { id: "common-weal", name: "Common Weal", desc: "A morale floor under every holding, whatever the month brought.", cost: 2, rank: "III" },
    { id: "schools", name: "Schools", desc: "A generation drifts toward your doctrine faster; the manipulation clause, made policy.", cost: 2, rank: "III" },
    { id: "named-heir", name: "Named Heir", desc: "The heir holds more of the realm through the Mourning; fracture comes harder.", cost: 2, rank: "IV" },
    { id: "the-long-memory", name: "The Long Memory", desc: "Grievance from seized ground fades sooner. Never from sacred ground.", cost: 2, rank: "IV" },
    { id: "old-oaths", name: "Old Oaths", desc: "Founded and earned holdings never turn, and vassals sworn under Old Oaths stay through a Mourning.", cost: 3, rank: "V", capstone: true },
  ] },
  { slug: "faith", name: "Faith", buys: "Adoption, spread, tolerance.", note: "The deep end of your faith's perk; belief as a build.", nodes: [
    { id: "shrine-rights", name: "Shrine Rights", desc: "A shrine in every holding; conversion runs faster than the drift.", cost: 1 },
    { id: "tolerance", name: "Tolerance", desc: "Mixed-faith holdings lose less morale to each other.", cost: 1 },
    { id: "patronage", name: "Patronage", desc: "Your faith's perk deepens: the given magic, the working dead, the cheap reclamation, the blessed road.", cost: 2, rank: "III" },
    { id: "suppression", name: "Suppression", desc: "Outlaw a faith. Conversion by force, faster, and noticed by everyone.", cost: 2, rank: "III" },
    { id: "missions", name: "Missions", desc: "Your faith reaches into neighbours' holdings as pressure they must answer.", cost: 2, rank: "IV" },
    { id: "doctrine-council", name: "Doctrine Council", desc: "Faith petitions on Court Day resolve by doctrine at no morale cost.", cost: 2, rank: "IV" },
    { id: "the-adopted-faith", name: "The Adopted Faith", desc: "The realm's faith is read by the whole world and its price is bought down. A secular crown takes the Secular Crown instead: the devout-share morale bleed halves.", cost: 3, rank: "V", capstone: true },
  ] },
];

export const realmTreesLaw = "Your own kingdom only. The realm earns one realm point a level and two at every proving, twenty-three by the cap, against seventy-eight points of nodes: nobody owns everything. Join a faction instead and you live under their doctrine; their spec, your problem.";

export const realmPoints = { perLevel: 1, perProving: 2, total: 23, onOffer: 78 };

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
