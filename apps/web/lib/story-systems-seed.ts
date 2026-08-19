import type { StorySystemMeta } from "@habitat/shared";

/**
 * The founding Systems shelf: every mechanic the game intends to ship, written
 * for the writers' room and grounded in canon that already exists — Essence,
 * the harvest economy, the seven phases, the island's ledger. Seeded once by
 * `scripts/seed-story-systems.ts`; from then on the entries live in the codex
 * like any other lore, edited and extended there, never from this file.
 *
 * Act structure: the whole island chapter is the prologue, and Act I opens at
 * Port Arcadia on the peninsula. Release gates reflect the three arcs that
 * exist today. Kingdom management
 * deliberately has no arc yet — its open question points at the gap.
 */
export type StorySystemSeed = {
  slug: string;
  title: string;
  summary: string;
  body: string;
  meta: StorySystemMeta;
};

const meta = (value: Partial<StorySystemMeta>): StorySystemMeta => ({
  category: null,
  buildStatus: "concept",
  unlockArc: null,
  unlockStage: null,
  dependsOn: [],
  pillars: [],
  gameTag: null,
  openQuestions: [],
  ...value,
});

export const storySystemsSeed: StorySystemSeed[] = [
  {
    slug: "character-progression",
    title: "Character Progression",
    summary: "How the player grows: skills earned by doing, gear with a history, and infused power rented from Essence at corruption's price.",
    body: `The RPG spine. Power comes by three roads, mirroring the three origins of magic: training (skills improve through use — a mercenary becomes what they practice, there are no class walls), equipment (gear is found, bought, and maintained, and the good pieces have histories), and infusion — doses of [[essence]] through rigs like [[field-infusion-rig]], which grant real power on a schedule and hand the bill to [[the-corruption-system]].

For writers: rewards should be growth the fiction can see. A veteran teaching a technique, a rig upgrade, a crate of doses — not abstract points falling out of a corpse. Never write a quest that assumes a build; write quests that *tempt* a build, offering the infusion shortcut where the honest road is slow. That temptation is [[the-cost-of-borrowed-power]] operating at the level of character sheets.`,
    meta: meta({
      category: "progression",
      unlockStage: "Day one",
      pillars: ["Power is earned by doing, bought with gear, or borrowed at a price", "No class walls — practice makes the character", "Every reward should be visible in the fiction"],
      openQuestions: ["Do unused skills decay?", "What does staying at phase zero cost the infused player in raw power?"],
    }),
  },
  {
    slug: "the-corruption-system",
    title: "Corruption",
    summary: "The seven-phase ledger every infused character keeps. Borrowed power collects — the tremor in Tino's hand is the first payment the player ever sees.",
    body: `The mechanical mirror of [[the-cost-of-borrowed-power]]. Every dose advances a character along [[the-seven-phases-of-corruption]] toward becoming one of the [[abominations]] — and the game shows tells before it shows numbers: tremors, veins, appetite, sensitivity to things others cannot feel. The player learns to read people, not bars. Companions keep their own ledgers, and watching a friend's phases advance is meant to hurt.

For writers: corruption is personal before it is systemic — canon's discipline is to show the tells and never pause the scene for the seven-phase lecture. Quests can move phases: a favor paid in doses, a cleansing rumor that costs more than it cleans, a job that only an infused specialist can survive. Never write a cure. Write bargains.`,
    meta: meta({
      category: "progression",
      unlockStage: "Day one",
      dependsOn: ["character-progression"],
      pillars: ["Every dose is a debt", "Tells before numbers", "The player can walk the whole road to abomination"],
      openQuestions: ["Is a phase ever reversible, and at what atrocity?", "How much of their own ledger does the player get to see?"],
    }),
  },
  {
    slug: "combat",
    title: "Combat",
    summary: "Guns, blades, and infused power in the same fight — loud, scarce, and survivable only by people who respect all three.",
    body: `A near-future arsenal sharing one economy with magic. Ammunition is logistics — the island's ledger counts it — and infusion is the trump card that costs twice, Essence now and corruption later. The enemy list runs from Tropic Pearl soldiers through creatures and [[monstrosities]] to things the war does not explain.

For writers: a fight is a story beat with a body count. Write who the enemy is and why they are here; a faceless wave teaches the player nothing about the world. Give encounters a third option — parley, flee, sneak, bribe — wherever the fiction allows one, and remember the standing rule of [[something-under-the-war]]: glimpse-tier horrors are glimpses. If a thing's whole purpose is to be half-seen, it does not get a stat block, and the scene should end before anyone could count its limbs.`,
    meta: meta({
      category: "combat",
      unlockStage: "Day one",
      pillars: ["Bullets, blades, and borrowed power are one economy", "Every fight can be lost, avoided, or regretted", "The half-seen stays half-seen"],
      openQuestions: ["How lethal is player death in co-op?", "Do glimpse-tier things ever get health bars, or only escapes?"],
    }),
  },
  {
    slug: "survival",
    title: "Survival",
    summary: "Food, medicine, ammunition, fuel, shelter. The war is fought between meals, and the island keeps count of every one of them.",
    body: `The personal end of the supply chain that [[the-island-remembers]] tracks at settlement scale. Needs press hard enough to drive decisions and never so hard the game becomes a chore simulator — this is dark fantasy, not inventory homework.

For writers: scarcity is drama fuel. A quest that pays in medicine is worth more than a quest that pays in praise, and hunger should push parties toward the morally priced solutions — [[the-harvest-economy]] is always hiring. Be stingy on the page: do not write supplies into scenes casually, because every crate of abundance a writer invents quietly breaks the engine that makes the hard choices hard. When a scene needs plenty, name where it came from and who is now short.`,
    meta: meta({
      category: "core loop",
      unlockStage: "Day one",
      dependsOn: ["gathering-and-harvest"],
      pillars: ["Scarcity drives story", "Everything consumed came from somewhere", "Pressure, never homework"],
      openQuestions: ["Meters, or moments — how is need surfaced?", "Do companions draw from the same stores?"],
    }),
  },
  {
    slug: "gathering-and-harvest",
    title: "Gathering & Harvest",
    summary: "Scavenge the ruins, strip the wilds, and — if you can stomach it — harvest the magical. Every resource chain ends in somebody's story.",
    body: `Two tiers. The mundane tier: scrap, timber, food, fuel, ammunition salvage — the wilds as a warehouse with teeth. And the dark tier: [[essence]] and parts taken from magical creatures and people, which is [[the-harvest-economy]] at the scale of one pair of hands. The game never forces the dark tier. It prices the choice, and the dark tier always pays better — that imbalance is the point, not a bug.

For writers: gathering sites are quest hooks with the story built in — the [[stormglass-quarry]] runs an Essence relay, catcher camps ring the Riftwood, a breach site is a harvest nobody is guarding. Keep harvesting scenes costly; canon holds that every unit of Essence is a life converted into product. Do not write renewable magic.`,
    meta: meta({
      category: "economy",
      unlockStage: "Day one",
      pillars: ["The wilds are a warehouse with teeth", "The dark tier always pays better, and it should", "No renewable magic"],
      openQuestions: ["Can a held outpost farm or breed stock — and what does the story owe that choice?"],
    }),
  },
  {
    slug: "trade-and-economy",
    title: "Trade & Economy",
    summary: "Barter to markets to trade routes: what things cost, who sets prices, and what money is worth on an island that is dying.",
    body: `The prologue trades in barter and company scrip; the mainland acts open real markets, and eventually route trading between settlements. [[essence]] is the reserve currency of the dark economy, and prices move with the world — a fallen checkpoint raises ammunition prices three villages away, because [[the-living-world]] keeps the books whether anyone is watching or not.

For writers: pay quests in the local economy's terms, and let a trader's stock tell the region's story — what is on the shelf is a report on the roads. Above all, remember that in this setting commerce is a faction: [[tropic-pearl-trade-house]] started the island war over trade goods. Writing a merchant is writing politics.`,
    meta: meta({
      category: "economy",
      unlockStage: "Day one",
      dependsOn: ["gathering-and-harvest"],
      pillars: ["Prices are world-state made visible", "Commerce is a faction with a fleet"],
      openQuestions: ["One currency or several competing ones?", "Does the player ever set prices, once they hold a market?"],
    }),
  },
  {
    slug: "reputation",
    title: "Reputation",
    summary: "Every faction, settlement, and named survivor keeps an opinion of the party. The island's ledger already tracks it — reputation is that memory, made mechanical.",
    body: `[[the-island-remembers]] already tracks standing with Stormglass, Tropic Pearl, the civilians, and any revealed third party; this system generalizes that ledger to the whole world. Reputation is earned in fiction — rescues, betrayals, whose flag you flew at the harbour — and spent as access: prices, gate permissions, dialogue options, and who answers when the party calls for help.

For writers: every meaningful choice should name who noticed it, and the payoff belongs a chapter later, not a scene later — consequence with a delay reads as a world, consequence on the spot reads as a vending machine. Reputation is per-community, never global karma. The [[ossuary-covenant]] does not care what Glasswater thinks of you.`,
    meta: meta({
      category: "social",
      unlockStage: "Day one",
      pillars: ["Communities remember, separately", "Standing is spent as access, not points", "Consequences arrive late, like news"],
      openQuestions: ["Do named individuals hold grudges distinct from their faction's ledger?"],
    }),
  },
  {
    slug: "the-living-world",
    title: "The Living World",
    summary: "The world does not wait for the players. Fronts move, rings harvest, prices drift, and the thing beneath the war keeps waking — on-screen or off.",
    body: `The off-screen simulation, and the canon already demands it: [[the-harvest-economy]] states outright that the world does not wait for the players to watch. While the party is elsewhere — or logged off entirely — factions push fronts, harvesting rings work, caches get raided, and named people carry on with their plans. Players return to a changed map, not a paused one.

For writers, three disciplines. Write clocks, not freezers: a threatened village is on a timer somewhere, even a soft one. Write the "nobody came" outcome for every crisis you invent — the simulation needs that answer, and it is usually the most honest scene in the quest. And never write a world state that assumes the player witnessed the event that caused it; the sim will fire most events unwatched.`,
    meta: meta({
      category: "world simulation",
      unlockStage: "Day one",
      pillars: ["Absence has consequences", "Every crisis has a 'nobody came' outcome", "The player returns to a changed map, not a paused one"],
      openQuestions: ["How fast does off-screen time run relative to played time?", "What is fenced off from the simulation — mainline scenery, named principals?"],
    }),
  },
  {
    slug: "transportation",
    title: "Transportation",
    summary: "Boats first — the prologue is written in them — then roads, mounts, convoys, and whatever still flies. Distance is a resource and a risk.",
    body: `The island chapter moves by water: evacuation-boat capacity and hull damage are lines in [[the-island-remembers]], and the Flee branch is a story about cargo space. The mainland opens ground vehicles, mounts, and convoy logistics, with fuel drawn from the same survival stores as everything else. Travel is exposure — routes have owners, tolls, and ambush points, and the connection lines on the region sheets are the road map writers should be reading.

For writers: name the route, not just the destination. A broken-down truck is a quest; a guarded bridge is a faction statement; a safe road is somebody's ongoing expense. Where fast travel exists it should be diegetic — a paid convoy seat, a ferry schedule — with a price and a departure time.`,
    meta: meta({
      category: "core loop",
      unlockStage: "Day one",
      pillars: ["Distance is priced", "Routes have owners", "Fast travel is a service somebody runs"],
      openQuestions: ["Is anything airborne — and who shoots at it?"],
    }),
  },
  {
    slug: "cooperative-play",
    title: "Co-op",
    summary: "The Habitat plays together: one shared world, one shared ledger, and choices that bind everyone at the table.",
    body: `Built for this crew from the start: drop-in co-op in one persistent world. The ledger is shared — one island, one count of boats — while reputation keeps per-player texture inside a party-level standing. The big forks bind the group: Defend or Flee commits everyone, which makes the table itself a story pressure.

For writers: write for a table, not a soloist. Choice scenes need room for disagreement — who speaks for the group, and what does it cost when the group is wrong? Content must tolerate absent players; [[the-living-world]] covers where they were. And never write a revelation only one player can witness without giving them a way to tell the others — or a reason not to, which is often the better scene.`,
    meta: meta({
      category: "cooperative",
      unlockStage: "Day one",
      pillars: ["One world, one ledger", "Choices bind the table", "Absence is covered by the simulation"],
      openQuestions: ["Who holds the deciding vote at branch points?", "Does corruption pressure differ per player, and can the party see each other's phases?"],
    }),
  },
  {
    slug: "companions",
    title: "Companions",
    summary: "Named people who follow the party, keep their own corruption ledgers, and can die. Tino is the pattern: the game's first companion and its first grief.",
    body: `The system arrives where the story does — with Tino, in the prologue. Companions fight, carry skills and professions, hold opinions of the party, advance their own phases on [[the-corruption-system]], and are mortal. Canon marks the first optional post-Tino companion as the hardest slot in [[the-unnamed]]: whoever follows the player after that empty seat has to earn it against a ghost.

For writers: every companion needs a want beyond the party — a person who exists only to follow is furniture with dialogue. Write scenes where companions transact with the world on their own account; canon's sharpest hook is that a companion can be worth more dead than alive to the right buyer. And never write a companion the simulation is forbidden to put at risk.`,
    meta: meta({
      category: "social",
      unlockArc: "the-island-is-already-lost",
      dependsOn: ["the-corruption-system"],
      pillars: ["Companions keep their own ledgers", "Everyone who follows can be lost", "A want beyond the party"],
      openQuestions: ["Party size cap?", "Do companions left at an outpost act off-screen through the living world?"],
    }),
  },
  {
    slug: "battle-management",
    title: "Battle Management",
    summary: "When the fight is bigger than the party: holding Kestrel means positioning squads, spending scarce shells, and deciding who is expendable.",
    body: `The Defend branch is the tutorial: escalating Tropic Pearl assaults on Forward Camp Kestrel, with surviving Stormglass squads, fortifications, and [[fort-tempest]]'s battery all lines in [[the-island-remembers]]. The player directs rather than micromanages — squad assignments, fortification priorities, fire missions, and triage when the line cracks.

For writers: a battle is choices under scarcity, never a cutscene. Whatever the player positioned, spent, and sacrificed should be legible in the outcome, and casualty lists should name names — this game's dead have families in Glasswater. Defeat states must be written as story, not game-overs; the branch structure exists precisely so the war can be lost forward.`,
    meta: meta({
      category: "combat",
      unlockArc: "the-last-days-of-kestrel",
      dependsOn: ["combat", "companions"],
      pillars: ["Command is triage", "Named people fill the lines you draw", "Defeat is written, not reloaded"],
      openQuestions: ["Does the Flee branch meet this system at all before the mainland?", "Scale ceiling — a company? a front?"],
    }),
  },
  {
    slug: "building",
    title: "Building",
    summary: "Fortify, repair, and raise structures — Kestrel's walls first, a foothold of your own later. Materials come off the same ledger as everything else.",
    body: `Starts as fortification — building materials delivered to Kestrel are a ledger line in [[the-island-remembers]] — and grows into raising structures on held ground. Every structure is a statement: a wall says what you will protect, a clinic says who you will treat, and an extraction shed says what you have become. The dark tier of [[gathering-and-harvest]] has architecture, and building it is a choice other people can see.

For writers: construction is a promise with a delivery date. Write quests around what a half-built thing invites — sabotage, squatters, a faction's sudden interest. Give materials provenance; whose timber, and what did it cost them? And write what the new structure displaced, because on a crowded island the answer is never nothing.`,
    meta: meta({
      category: "management",
      unlockArc: "the-last-days-of-kestrel",
      dependsOn: ["gathering-and-harvest"],
      pillars: ["Every structure is a statement", "Materials have provenance", "Half-built things invite trouble"],
      openQuestions: ["Does the Flee branch get building later, on the mainland?", "Can built things be lost to the living world while the party is away?"],
    }),
  },
  {
    slug: "professions",
    title: "Professions",
    summary: "Medic, mechanic, harvester, smith, infuser-tech: deep craft lines for players and companions who want to be needed for what they can make.",
    body: `Canon already reserves the medic, the mechanic, and the quartermaster in [[the-unnamed]] — professions make that party texture mechanical. Craft lines with real depth: medicine including corruption care, rig maintenance for equipment like [[field-infusion-rig]], smithing, and Essence refinement — the moral ceiling of craft, where skill and complicity become the same thing. Companions carry professions, and settled ground needs them staffed.

For writers: expertise is voice. Write profession-gated dialogue and profession-shaped solutions — the medic reads a body differently, the infuser-tech smells a bad valve across the room. A master teaching a technique is a reward worth a whole quest. And the infuser-tech line should always feel like handling live ordnance, because it is.`,
    meta: meta({
      category: "progression",
      unlockStage: "Act I — settled ground on the peninsula",
      dependsOn: ["gathering-and-harvest", "trade-and-economy"],
      pillars: ["Being needed is progression", "Craft has a moral ceiling, and the game prices it"],
      openQuestions: ["One profession per character, or a skill web?", "Which professions can companions master beyond the player?"],
    }),
  },
  {
    slug: "faction-membership",
    title: "Faction Membership",
    summary: "Beyond standing: joining. Ranks, duties, faction services, and the doors that close behind you when you swear to one power.",
    body: `[[reputation]] is opinion; membership is obligation. Swearing to a power — Cartel rank, a Coast Guard commission, Covenant initiation — grants services: supply lines, safehouses, intelligence, guns that show up when called. It costs autonomy: duties, exclusivity, and a place on somebody else's target list. The faction map is the menu, and every power on it wants something.

For writers: write joining ceremonies that mean something — an oath the scene takes seriously is a contract the story can enforce later. Every faction quest should ask what the faction owes back, because a power that only takes is a mugging with paperwork. And exit must be writable — desertion, excommunication, bought freedom, burned bridges — because players will absolutely try it.`,
    meta: meta({
      category: "social",
      unlockStage: "Act I — the peninsula's powers",
      dependsOn: ["reputation"],
      pillars: ["Joining opens doors and closes more", "Every rank has duties, not just perks", "Exit exists, and it costs"],
      openQuestions: ["Is multi-membership possible, secret, or suicidal?", "Which powers are joinable at all?"],
    }),
  },
  {
    slug: "the-power-balance",
    title: "The Power Balance",
    summary: "Territory, supply, and momentum between the powers, simulated and visible. The front line is a fact the player can read — and bend.",
    body: `[[the-faction-map]] made live. Control, supply, and momentum shift with events on-screen and off — [[the-living-world]] runs the war between sessions — and the region sheets' control fields are the substrate. The player's weight is real but never solitary: a held bridge opens a supply line, a burned depot starves an offensive, and the map repaints to match.

For writers: quests that move the balance should name the delta — say what the bridge was worth, and to whom. Write the war's weather into scenes: who patrols this road this month is an output of the balance, not set dressing. And keep canon's deepest rule — neither human faction understands the whole war, and the balance must never explain [[something-under-the-war]]. The map measures the war it can see.`,
    meta: meta({
      category: "world simulation",
      unlockStage: "Act I — the peninsula war",
      dependsOn: ["the-living-world"],
      pillars: ["The front is legible", "Player weight is real but not solitary", "The map never explains what is beneath it"],
      openQuestions: ["Can a power be eliminated outright?", "How is the balance surfaced — map paint, rumor, prices, all three?"],
    }),
  },
  {
    slug: "black-markets",
    title: "Black Markets",
    summary: "Where the harvest economy does its real business: Essence by the crate, people by the head, and prices nobody prints.",
    body: `The illegal tier of [[trade-and-economy]], and [[the-harvest-economy]] at street level: harvesting-ring product, unregistered doses, monstrosity stock, stolen evidence, and — at the bottom — people. Access runs on the underworld's own reputation ledger, and being seen using it stains standing everywhere else.

For writers: every stall implies a supply chain of atrocity, and canon demands the chain have a return address — a breeding site, a ring, a quota, someone who signed off. Write sting, raid, and debt quests from both sides of the counter. And remember the standing companion hook: the buyer who wants a friend of yours dead rather than alive shops here, and knows exactly what the parts are worth.`,
    meta: meta({
      category: "economy",
      unlockStage: "Act I — Port Arcadia",
      dependsOn: ["trade-and-economy", "reputation"],
      pillars: ["Everything has a price nobody prints", "Every lot has a return address"],
      openQuestions: ["Can the party sell — and is it exactly as profitable as it is damning?"],
    }),
  },
  {
    slug: "outpost-and-city-management",
    title: "Outpost & City Management",
    summary: "Running held ground: population, staffing, defense, supply, and the politics of who gets let in.",
    body: `From a fortified camp to a working settlement: assign professionals, set supply priorities, plan defenses — [[battle-management]] takes over when the siege actually comes — and decide admission policy, because every refugee is a person and a mouth, and the evacuation's arithmetic does not stop when the boats land. The settlement runs while the party is away; [[the-living-world]] keeps it honest.

For writers: management choices are moral instruments. Write shortages that force policy, and named residents whose fates react to it — the family turned away at the gate is a scene, not a statistic. A settlement's culture is authored by accumulated player choices; write moments that reflect it back, so the town the player built can look them in the eye.`,
    meta: meta({
      category: "management",
      unlockStage: "Act I — once the party holds ground on the peninsula",
      dependsOn: ["building", "professions", "trade-and-economy"],
      pillars: ["Policy is a moral instrument", "The town runs, and remembers, without you"],
      openQuestions: ["One party settlement or several?", "Do co-op partners share governance, and how do they outvote each other?"],
    }),
  },
  {
    slug: "kingdom-management",
    title: "Kingdom Management",
    summary: "The endgame of holding ground: multiple settlements, vassal relations, doctrine, and a seat at the war's table — long after day one.",
    body: `Not a day-one verb — this entry is why the release gate exists. When the story finally hands the player region-scale authority, every earlier system becomes politics: a multi-settlement economy over [[outpost-and-city-management]], relations with the surviving powers as a peer on [[the-power-balance]], and doctrine — above all harvest policy at scale, which is [[the-harvest-economy]]'s question asked of the player with a whole population's weight behind the answer. Kingdoms also get noticed, and not only by the powers on the map.

For writers: do not write toward this before the story grants it — the release plan on the Systems shelf is the check. Do plant its seeds early: charters, old claims, oaths sworn in the prologue that a crown would have to honor. The best endgame material is paid for in the prologue.`,
    meta: meta({
      category: "management",
      unlockStage: "Late game — well beyond the peninsula landing",
      dependsOn: ["outpost-and-city-management", "faction-membership", "the-power-balance"],
      pillars: ["Authority arrives when the story grants it", "Harvest policy at scale is the endgame's moral core", "Kingdoms get noticed"],
      openQuestions: ["Which arc actually grants the charter? It does not exist yet — link it here when it does.", "What does the thing beneath the war want with a kingdom?"],
    }),
  },
];
