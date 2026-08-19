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
  parent: null,
  unlockArc: null,
  unlockStage: null,
  dependsOn: [],
  pillars: [],
  regionNotes: [],
  gameTag: null,
  openQuestions: [],
  ...value,
});

export const storySystemsSeed: StorySystemSeed[] = [
  {
    slug: "character-progression",
    title: "Character Progression",
    summary: "How the player grows: skills earned by doing, gear with a history, and infused power rented from Essence at corruption's price.",
    body: `The RPG spine. Power comes by three roads, mirroring the three origins of magic: training (skills improve through use — a mercenary becomes what they practice), equipment (gear is found, bought, and maintained, and the good pieces have histories), and infusion — doses of [[essence]] through rigs like [[field-infusion-rig]], which grant real power on a schedule and hand the bill to [[the-corruption-system]].

For writers: rewards should be growth the fiction can see. A veteran teaching a technique, a rig upgrade, a crate of doses — not abstract points falling out of a corpse. Never write a quest that assumes a build; write quests that *tempt* a build, offering the infusion shortcut where the honest road is slow. That temptation is [[the-cost-of-borrowed-power]] operating at the level of character sheets. [[character-classes]] sets a character's starting shape; practice and choices decide everything after.`,
    meta: meta({
      category: "progression",
      unlockStage: "Day one",
      pillars: ["Power is earned by doing, bought with gear, or borrowed at a price", "Classes set the starting shape; practice does the rest", "Every reward should be visible in the fiction"],
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
      parent: "magic",
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
  {
    slug: "environment",
    title: "Environment",
    summary: "The sky, the seasons, the weather, and the living land — one system for everything the world does that no faction ordered.",
    body: `The parent of the world's own behavior, split into four subsystems: [[nature]] (the land's flora, fauna, and ambient life), [[seasons]] (the year's turning), [[weather]] (what the sky does today), and [[the-sun-and-moon]] (the day-night cycle and what hangs in it). Each expresses differently by region — the same winter that buries the peninsula only cools the tropics — and the per-region notes on each subsystem's sheet are where those differences are law, wired to the region atlas.

The environment runs through [[the-living-world]]: storms land and seasons turn whether anyone is playing or not.

For writers: the environment is a story instrument, not a backdrop. A quest that must happen in the rain says so; a siege that starves through winter is a different siege. Name the conditions your scene assumes, and check this family's sheets before promising the sky can do something.`,
    meta: meta({
      category: "world simulation",
      unlockStage: "Day one",
      dependsOn: ["the-living-world"],
      pillars: ["The world acts without orders", "Same sky, different ground — region decides expression", "Weather and seasons are story instruments"],
      openQuestions: ["Does severe weather gate travel outright, or only price it?"],
    }),
  },
  {
    slug: "nature",
    title: "Nature",
    summary: "The land itself: flora, fauna, growth, and decay — the ambient life that makes a region feel alive before anything magical shows up.",
    body: `The mundane living world inside [[environment]]: plant cover, animal populations, spawning and migration, growth and rot. Nature is the substrate [[gathering-and-harvest]] draws its mundane tier from, and the ordinary wildlife against which the magical creatures of the bestiary read as wrong.

Populations respond to pressure — overhunt a coast and it empties; abandon a field and the jungle takes it back within a season. Tied to [[seasons]] for cycles and to each region's biome for what grows at all.

For writers: nature is the world's baseline reading. An empty forest is a warning sign the player should be able to trust, so never write ambient life as random set dressing — a place where the birds have gone quiet is saying something, and canon's horrors are at their best walking through a nature that behaves believably right up until it does not.`,
    meta: meta({
      category: "world simulation",
      parent: "environment",
      pillars: ["Ambient life is a readable signal", "Populations respond to pressure", "The mundane baseline makes the magical legible"],
      openQuestions: ["Do regrowth and repopulation run on season boundaries or continuous clocks?"],
    }),
  },
  {
    slug: "seasons",
    title: "Seasons",
    summary: "Summer, fall, winter, spring — the year turns everywhere, and every region wears each season its own way.",
    body: `The four seasons cycle through the whole world inside [[environment]], but a season is a question each region answers for itself: the peninsula gets four true seasons; the tropical island gets a cooler, stormier winter and will never see snow. The per-region notes on this sheet are where those answers live, and [[weather]] draws from them — what the sky can do today depends on where you are standing in the year.

Seasons move the economy and the war: harvest yields, sea conditions for the boats, campaign windows, what [[nature]] offers and withholds. They turn off-screen with [[the-living-world]].

For writers: date your scenes. A quest written "in winter" reads differently in every region, and that is the feature — use the season to price choices (a mountain pass now or in the thaw?), and never write snow onto ground whose region note forbids it.`,
    meta: meta({
      category: "world simulation",
      parent: "environment",
      pillars: ["The year turns everywhere, differently", "Seasons move the economy and the war", "Region notes are the law of what a season can do"],
      regionNotes: [
        { region: "the-starting-island", note: "Tropical: winter runs cooler and stormier, greens the Riftwood, and roughens the sea lanes — but it never snows here." },
        { region: "the-peninsula", note: "Four true seasons. Winter closes mountain routes and freezes siege lines; spring floods the lowland roads." },
      ],
      openQuestions: ["How long is a season in real time?", "Do arcs pin themselves to a season, or drift with when the party arrives?"],
    }),
  },
  {
    slug: "weather",
    title: "Weather",
    summary: "Rain, snow, sandstorm, and the clear days between — what the sky is doing right now, region by region.",
    body: `The day-to-day sky inside [[environment]]. The founding catalog: rain (and its tropical-storm big sibling), snow, sandstorm, fog, and clear — with room to grow. What can actually occur is decided by region and [[seasons]] together: the tropical island gets rain and hurricanes but never snow; sandstorms wait on the mainland's dry interior; the peninsula gets the full four-season range.

Weather is mechanical, not cosmetic: visibility, fire, tracking, boats, aircraft if any, and how sound carries. It rolls in off-screen with [[the-living-world]], and a settlement's stores feel a hard season through [[survival]].

For writers: weather is pacing. A storm is cover for one side and catastrophe for the other; write scenes that want a condition and say so, and let the wait for that condition be story. Check the region notes before writing the sky — snow on the tropics is a continuity bug, not atmosphere.`,
    meta: meta({
      category: "world simulation",
      parent: "environment",
      dependsOn: ["seasons"],
      pillars: ["Weather is mechanics, not mood lighting", "Region and season decide what the sky may do", "Storms are cover, catastrophe, and pacing"],
      regionNotes: [
        { region: "the-starting-island", note: "Rain, squalls, and true tropical storms — a hurricane season that matters to the boats. Never snow." },
        { region: "the-peninsula", note: "The full range by season: rain, fog, and real winter snow. Sandstorms only in the dry interior, when the story writes one." },
      ],
      openQuestions: ["Is weather forecastable in-fiction — and who sells the forecast?", "Which mainland region hosts the first sandstorm?"],
    }),
  },
  {
    slug: "the-sun-and-moon",
    title: "The Sun & Moon",
    summary: "The day-night cycle: forty-five minutes of daylight, fifteen of night — and a sky that sometimes does something it shouldn't.",
    body: `The clock of the world, inside [[environment]]: a full day runs one real hour — forty-five minutes of daylight, fifteen of night. Night is a different game: darker work, different creatures, different rules for what moves. The cycle runs everywhere at once and never pauses for a cutscene.

Hanging off the cycle are the celestial events — [[the-blood-moon]] by night and [[the-solar-eclipse]] by day — scheduled world moments the whole server experiences together, each with its own dossier.

For writers: the short night is scarcity — fifteen minutes is a raid window, not an evening, so night content must earn its darkness fast. Write scenes that want a time of day and say so. And keep the sky's stranger moments inside the event subsystems; the ordinary cycle stays ordinary, which is what makes the exceptions land.`,
    meta: meta({
      category: "world simulation",
      parent: "environment",
      pillars: ["Forty-five minutes of day, fifteen of night", "Night is a different game", "The cycle never pauses"],
      openQuestions: ["Do interiors and dungeons obey the surface clock?", "Is the fifteen-minute night global, or does latitude bend it?"],
    }),
  },
  {
    slug: "the-blood-moon",
    title: "The Blood Moon",
    summary: "A night event: the moon rises wrong, the world's worst things get bolder, and everyone with sense gets behind a wall.",
    body: `A scheduled celestial event inside [[the-sun-and-moon]]: some nights the moon rises red, and for that night the rules bend — the corrupted and the fallen are bolder, creatures push into places they normally avoid, and the things that obey [[something-under-the-war]]'s glimpse discipline come nearer to being seen. Settlements light up and lock down; the [[survival]] math of one bad night is the point of the event.

For writers: the blood moon is a pressure vessel, not a lore dump. What it actually is — an omen, a tide, a feeding calendar — stays unanswered per canon's rules; what it does is concrete and writable: sieges timed to it, contracts that must be finished before moonrise, a companion whose phases run hotter under it. One red night should be worth a whole quest.`,
    meta: meta({
      category: "world simulation",
      parent: "the-sun-and-moon",
      pillars: ["The rules bend for one night", "Concrete effects, unexplained cause", "A whole settlement holds its breath together"],
      openQuestions: ["Fixed lunar calendar or story-triggered?", "What does a blood moon do to a companion in the late phases?"],
    }),
  },
  {
    slug: "the-solar-eclipse",
    title: "The Solar Eclipse",
    summary: "A day event: night's rules arrive in the middle of the day, with none of night's warning.",
    body: `The rarer sibling of [[the-blood-moon]], inside [[the-sun-and-moon]]: the sun goes dark mid-cycle and, for minutes, the day runs on night's rules — night creatures surface into daylight positions, work parties are caught in the open far from walls, and the careful arithmetic of the forty-five-minute day breaks down exactly when everyone trusted it.

For writers: the eclipse is the ambush the sky writes. Its power is that daylight is where the game keeps its promises — supply runs, harvests, sieges are all planned around the safe forty-five — so the eclipse betrays plans, not just people. Best used sparingly and scheduled with intent: an eclipse over a battle already going wrong is a scene nobody forgets. Cause stays unexplained, per canon.`,
    meta: meta({
      category: "world simulation",
      parent: "the-sun-and-moon",
      pillars: ["Night's rules, day's positions", "It betrays plans, not just people", "Rare enough to be a story every time"],
      openQuestions: ["How rare — and does anything in-world predict one?", "Does an eclipse touch corruption, or only creatures?"],
    }),
  },
  {
    slug: "magic",
    title: "Magic",
    summary: "The whole magical order in one system: where power comes from, what it costs, and why the world went to war over it.",
    body: `The parent system for everything arcane, built directly on [[the-three-origins-of-magic]]: the gifted are born with power that cost no one anything — which in this world is nearly a miracle; the infused rent power dose by dose from [[essence]], with [[the-corruption-system]] keeping the ledger inside this family; and creatures carry magic natively, which is exactly why [[the-harvest-economy]] exists to render them into product.

Magic is the setting's economy, its war, and its horror in one mechanism, so this system owns the rules the others borrow: what a dose does, what a gifted caster risks, what extraction takes, and what magic can never do.

For writers: magic has prices, not exceptions. Before a scene lets power solve a problem, name which origin paid and what it cost — free magic anywhere unravels the whole bargain the setting is built on. The gifted are precious, hunted, and rare; write them accordingly.`,
    meta: meta({
      category: "progression",
      unlockStage: "Day one",
      pillars: ["Three origins, three prices", "No free magic anywhere", "The magical order is the war's cause, not its backdrop"],
      openQuestions: ["Can the player character be gifted, or only infused?", "What are the hard nevers — what can magic not do at any price?"],
    }),
  },
  {
    slug: "character-classes",
    title: "Character Classes",
    summary: "The starting shape of a character: what you were before the island, and the kit, instincts, and doors that history opens.",
    body: `The archetype layer inside [[character-progression]]: a class is who the character was before the story found them — the shape of their training, their starting kit, and the instincts the game trusts them with on day one. The prologue's own cast sketches the first roster: the Stormglass mercenary, the infuser-tech like Tino, the medic, the scout. From there, practice moves the character wherever play takes them; class sets the door you came in through, never the walls.

Classes are combat-and-instinct identity; [[professions]] are craft. The two overlap on purpose — a medic class and a medic profession are different depths of the same calling.

For writers: class is voice and history before it is numbers. Write class-flavored reads of a scene — the merc counts exits, the tech smells the bad valve — and recruitment or origin quests that honor where each archetype came from. Never gate a story branch on class alone; gate it on what the class would plausibly know.`,
    meta: meta({
      category: "progression",
      parent: "character-progression",
      pillars: ["Class is the door in, not the walls", "History and instincts before numbers", "Classes overlap professions on purpose"],
      openQuestions: ["The starting roster — which classes ship, and is Tino's infuser-tech playable?", "Can a class ever change outright, or only blur?"],
    }),
  },
  {
    slug: "persistent-damage",
    title: "Persistent Damage",
    summary: "The world keeps its wounds. Bullet holes, blast craters, burned buildings, and scars are still there hours later — and so is the wall somebody rebuilt.",
    body: `Damage is world state, not decoration. Every hole punched in a wall, every building burned, every crater and every scar is recorded and persists — across hours, across sessions, and across every player in the shared world of [[cooperative-play]]. Come back to a street you fought down and it is the street you left it: pocked, shored up, or gone.

The system has two halves, each its own dossier: [[structural-integrity]] for what happens to buildings and terrain — stability, demolition, and cascading collapse — and [[lasting-wounds]] for what happens to bodies, from scars to missing limbs. Both feed the same ledger. Repair and reinforcement run through [[building]], paid for out of the materials [[survival]] and [[gathering-and-harvest]] account for, and an upgraded structure records its upgrade the same way a broken one records its break. Damage that lands while nobody is watching still lands: [[the-living-world]] runs the shelling, the fires, and the weathering off-screen.

Canon already runs on this. [[the-island-remembers]] tracks fortification state and evacuation-boat damage as ledger lines before the Defend/Flee decision commits; [[the-last-days-of-kestrel]] is a siege whose walls, generators, and turrets are consumed one assault at a time; and [[the-strike]] is remembered by the depth of the wound it leaves, not the blast. The scar is the story.

For writers: damage is memory the player can walk through, so write it as evidence. A quest can turn on what a wall looks like now — who fired from here, how many, how long ago. Never write a scene that requires a location to be pristine unless somebody repaired it, and never quietly heal the world between chapters; if a district got fixed, say who paid and what they wanted for it. The most valuable thing this system gives the writers' room is proof: what the party did to a place is still there to be found by the next party, and by the people who live there.`,
    meta: meta({
      category: "world simulation",
      unlockStage: "Day one",
      dependsOn: ["combat", "the-living-world"],
      pillars: [
        "The world keeps its wounds — hours later, sessions later, for everyone",
        "Damage is evidence a player can read",
        "Nothing heals quietly; repair is somebody's decision and somebody's bill",
      ],
      regionNotes: [
        { region: "the-starting-island", note: "The prologue teaches the rule and then breaks it once, on purpose: the island's damage accumulates all chapter and is then erased wholesale by the fall — the only wipe canon allows, and it costs the island." },
        { region: "the-peninsula", note: "Mainland damage is permanent and political: a burned block stays burned until a faction pays to clear it, and who rebuilt what is a readable map of who actually holds the ground." },
      ],
      openQuestions: [
        "How long is the persistence horizon — forever, or a decay curve the living world runs?",
        "Can a settlement's accumulated damage make it uninhabitable, and does the sim relocate the people?",
      ],
    }),
  },
  {
    slug: "structural-integrity",
    title: "Structural Integrity",
    summary: "Buildings hold until they cannot: load paths, stability, demolition, and collapse that spreads from what you actually broke.",
    body: `The structural half of [[persistent-damage]]. Buildings and terrain are not hit-point sacks with a rubble animation at zero — they carry load, and what a piece of a structure is holding up decides what happens when it fails. Cut the supports under a floor and the floor goes; take the corner column and the corner goes, and whatever the corner was carrying follows it. Collapse cascades from the break, which makes demolition a tactic with a plan rather than a damage race.

That cuts both ways. Reinforcement through [[building]] adds real load capacity — the difference between a wall that holds one more assault and one that does not — and [[battle-management]] is largely the art of spending structure well. Partial states matter most: a building that is half down is the interesting one, and most of them will spend the campaign there.

For writers: structure is a resource the party spends and an argument the world makes back. Write objectives that are structural — bring down the causeway, hold the third floor, get the wall standing before dusk — and remember that a collapse kills whoever is under it, including people the party was trying to save. Canon's fixed point is the ceiling here: [[the-fall-of-the-starting-island]] is cascading collapse at island scale, authored rather than simulated, and nothing the players do to a building should read as bigger.`,
    meta: meta({
      category: "world simulation",
      parent: "persistent-damage",
      // Not a dependency: buildings break long before players can build, so
      // reinforcement through Building enhances this rather than gating it.
      pillars: [
        "Load paths, not hit points — what it holds decides how it falls",
        "Collapse spreads from the break, so demolition is a plan",
        "Half-standing is the interesting state, and the common one",
      ],
      openQuestions: [
        "How deep does the simulation go — per-structure, per-room, or per-piece?",
        "Can a player-built structure be brought down by the living world while they are away?",
      ],
    }),
  },
  {
    slug: "lasting-wounds",
    title: "Lasting Wounds",
    summary: "Bodies keep the record too: scars that name the fight, wounds that do not fully mend, and limbs that do not come back.",
    body: `The body half of [[persistent-damage]]. Serious injury leaves something behind — a scar with a date attached, a joint that stiffens in the cold, a hand that never fully closes, a limb that is simply gone. Characters and [[companions]] both carry it, treatment through [[professions]] decides how much of it they keep, and the world's replacements are exactly as dark as the setting is: prosthetics from the [[foundry-workers-union]]'s shops, arcane grafts with an [[essence]] cost, and whatever the [[cybernetic-ascendancy]] is evangelizing this season.

Keep it distinct from [[the-corruption-system]]. Corruption is the price of borrowed power and runs on its own seven-phase ledger; a wound is just what the world did to a body, and the two are only related in that both are visible on a person long before anyone discusses them.

For writers: a scar is a plot hook with a location. Write injuries with provenance — which fight, whose fault, what it cost the party at the time — and let other characters read them; a medic who recognises a wound pattern is a whole scene. The hardest and best material here is a companion the party could have saved something of: an arm, a hand, a career. Never write a wound away off-screen, and never make the prosthetic free — the cheap ones cost autonomy, and the good ones cost the kind of money that gets a person hunted.`,
    meta: meta({
      category: "progression",
      parent: "persistent-damage",
      // Not dependencies: a scar needs neither a companion roster nor a medic
      // profession to exist. Both deepen it; neither gates it.
      pillars: [
        "Injury leaves a mark with a date and a story",
        "Wounds are not corruption — different ledger, different price",
        "Replacement is always paid for in autonomy, money, or Essence",
      ],
      openQuestions: [
        "Is limb loss ever a player-character outcome, or companions only?",
        "What can a top-tier prosthetic do that a hand cannot — and who notices?",
      ],
    }),
  },
  {
    slug: "the-veil",
    title: "The Veil",
    summary: "Reality is not singular. The Veil is the boundary between neighboring realities, every world is a Shard of it, and humanity has learned to cross — without learning what it reopened.",
    body: `The core frame for everything cross-world. Reality is not singular: the boundary separating neighboring realities is the Veil, and each reality on either side of it is a Shard — which is how every multiplayer world exists canonically, as another Shard rather than "someone's server". Ancient civilizations learned to pierce the boundary; their structures, the [[veil-anchors]], still stand. Modern humanity has learned to partially reactivate them. It does not understand them. It uses them anyway.

The vocabulary, binding on all writing: the Veil (the boundary), a Shard (one reality), a Veil Anchor (the structure that ties two Shards together), a Breach (an active connection), a Crossing (physically traveling it), an Expedition (any journey to another Shard — see [[veil-expeditions]]), and an Incursion (a hostile Crossing into another player's Shard — see [[veil-incursions]]). Incursors cross; Defenders are native. Never write "server", "matchmaking", or "game mode" in fiction — the Veil network finds compatible Shards, and that is all anyone in-world knows.

The canon already rhymes with this, and the rhymes are the point. The [[the-riftbound-legion]] treats the world's wounds as beachheads — a rift is a hostile Crossing by an older name. The Great Purges' survivors withdrew into "hidden realms" — the timeline never said which side of the Veil those realms are on. The [[meridian-arcane-institute]]'s unpublished depletion curves suggest the world's magic is not being consumed but taken — taken *where* is a question this system makes askable. And the oldest question of all sits underneath: humanity recently learned to Cross, but the Anchors are thousands of years old. Who built them? What else has been using them? Per [[something-under-the-war]], these stay glimpses. The Veil is allowed to rhyme with the Drain, the Hunger, and the thing beneath the war. It must never be confirmed as the answer to any of them.

For writers: one law above all — everything beyond the Veil is an opportunity, and everything carried through it is a wager. Nothing an expedition takes is truly theirs until they cross home; death on the far side leaves it all behind. Write that pressure into every Veil scene, and write the human ritual around it: the crew that says "we're opening the Veil tonight" knows exactly what they are inviting.`,
    meta: meta({
      category: "world simulation",
      unlockStage: "Act I — the first controlled Crossing",
      dependsOn: ["magic"],
      pillars: [
        "Reality is not singular — every world is a Shard",
        "Humanity reactivated what it does not understand",
        "Everything beyond the Veil is an opportunity; everything carried through it is a wager",
        "The Veil rhymes with the setting's mysteries and never answers them",
      ],
      openQuestions: [
        "Who built the Anchors — and which faction is closest to finding out?",
        "Does opening the Veil tell things on the other side exactly where humanity lives?",
      ],
    }),
  },
  {
    slug: "veil-anchors",
    title: "Veil Anchors",
    summary: "The ancient structures that tie two Shards together — physical landmarks in the world, tiered by danger, and every discovered one is a POI on the atlas.",
    body: `The physical half of [[the-veil]], and the part that lives on the map. An Anchor is never a menu: it is a landmark — ancient magical engineering with whatever modern hardware humanity has bolted on while trying to understand it. A discovered Anchor accretes generators, monitoring stations, containment fencing, barricades, research trailers, and a faction flag; an undiscovered one waits under ruins or deep in territory that kills visitors. Activation is spectacle, always: lights, ancient mechanisms turning, energy building, the environment reacting — and then the Veil tears open.

Anchors are tiered, I through V, and the tier is a promise about both ends: Tier I opens introductory, low-threat Crossings for common returns; Tier III opens full [[veil-incursions]]; Tier V opens catastrophic-threat, artifact-grade endgame Crossings. Placement follows the same ladder — a Tier V Anchor does not sit conveniently beside anyone's settlement. It is under a ruined city, inside a magical exclusion zone, in ground held by a power nobody fights casually, or in the hunting range of something legendary. Merely reaching and powering a high-tier Anchor is an expedition in its own right, and should be written as one.

For writers: every discovered Anchor is a place, so it enters the codex as a REGION entry — a site (or a destination inside one), filed in the atlas with its parent, its controlling faction, and its own dossier. Set its tier on the region sheet: the "Veil Anchor tier" field marks that place as an Anchor and is what puts it on the atlas as one. The system entry here is the law; the atlas holds the instances. When you write one, answer the accretion questions: who found it, who fenced it, who is paying the research crew, and what the instruments do at night when nobody scheduled a Crossing.`,
    meta: meta({
      category: "world simulation",
      parent: "the-veil",
      pillars: [
        "Anchors are places, not menus — every discovered one is a POI in the atlas",
        "Tier climbs with danger, and reaching a high-tier Anchor is an expedition of its own",
        "Activation is spectacle: the world reacts before the Veil tears",
      ],
      regionNotes: [
        { region: "the-starting-island", note: "The island's open question: whether the Riftwood Breach is a wild tear in the Veil — an Anchor nobody built, or one that failed — is glimpse material, never confirmed. No controlled Anchor is known here, and the island falls before anyone can dig." },
        { region: "the-peninsula", note: "The first controlled Anchors are mainland discoveries — under purge-era ruins and interior exclusion zones, already fenced and instrumented by whichever power reached each one first." },
      ],
      openQuestions: [
        "Which mainland region hides the first Tier I Anchor the party can reach — and which power got there first?",
        "Does Port Arcadia's Exclusion Area exist because of something Anchor-shaped?",
      ],
    }),
  },
  {
    slug: "veil-expeditions",
    title: "Veil Expeditions",
    summary: "Any Crossing to another Shard: co-op worlds, faction realities, hunting grounds, corrupted realities — and Dead Shards, where the loot is best and the answers are worst.",
    body: `The PvE half of [[the-veil]]: the same Anchors, the same wager, no other players required. An Expedition begins with a destination the Veil network resolves — sometimes the one asked for, sometimes not — classified the way the instruments report it: PLAYER SHARD (a cooperative world), HOSTILE SHARD (a player world accepting [[veil-incursions]]), FACTION SHARD (a reality a major power controls), DEAD SHARD (a world where civilization collapsed), CORRUPTED SHARD (catastrophic magical contamination), HUNTING GROUND (a reality that belongs to its creatures), or UNKNOWN — no reliable information until somebody goes first.

Dead Shards are the crown of the system. Players cross expecting ruins and find abandoned vehicles, military checkpoints, bodies, emptied research facilities, messages left behind. Something happened here. Maybe humanity lost its war. Maybe one faction won it. Maybe the magic ran out, or ran wild, or something crossed that should never have been allowed through. The loot is the best available through any Crossing, the enemies are among the worst in the game, and the correct first line of any Dead Shard scene is somebody whispering "what the hell happened here?"

For writers: a parallel Shard shows consequences without touching the campaign. A world where a character who died here survived; where the war was lost; where a faction rules everything; where humans are the hunted species; where the harvest never industrialized — every one is a Dead or divergent Shard away, and each discovery can quietly suggest the Veil matters more to the central story than humanity realizes. The extraction law binds everything found there: nothing is theirs until it crosses home.`,
    meta: meta({
      category: "world simulation",
      parent: "the-veil",
      dependsOn: ["veil-anchors", "gathering-and-harvest", "survival"],
      pillars: [
        "One door, many destinations — and UNKNOWN means somebody goes first",
        "Dead Shards carry the best loot and the worst answers",
        "A parallel Shard shows consequences without touching the campaign",
      ],
      openQuestions: [
        "What is the first Dead Shard the story sends players to — and what happened there?",
        "Can a faction Shard be traded with instead of raided?",
      ],
    }),
  },
  {
    slug: "veil-incursions",
    title: "Veil Incursions",
    summary: "The hostile Crossing: three Incursors, twenty minutes inside another crew's Shard, and nothing is theirs until they cross back home.",
    body: `The extraction raid inside [[the-veil]], governed by consent before anything else: nobody is invaded who did not open the Veil. A Shard's owners must explicitly enable Incursions, and an open Veil pays for its danger — richer magical yields, rarer creatures, Veil-only events and materials, and [[dimensional-echo]] drops from Incursors killed on your ground. Opening up is a deliberate table decision, said out loud: "we're opening the Veil tonight."

An Incursion is up to three Incursors and roughly twenty minutes, and the clock changes the game as it runs. At 20:00 the defenders get the Breach alarm — foreign Anchor established, signatures crossed, origin Shard named. Tracking pulses at 15:00 and 10:00 flash approximate invader positions; at 5:00 the extraction phase opens return Crossings whose locations both sides learn; at 2:00 the collapse makes Incursors near-continuously visible. Stealth decays into a manhunt by design. Extraction is physical — reach the Anchor and cross, under fire if it comes to that — and missing it means WORLD CONNECTION SEVERED: a stranded Incursor, increasingly visible, surviving an emergency recall countdown while the world itself turns hostile. Death at any point leaves everything behind — carried equipment and unsecured raid loot alike — for defenders to claim or teammates to mount a rescue for. "Leave him and extract" versus "go back for his gear" is the best decision this system produces; protect it.

Two laws keep it a raid rather than a griefing tool. Incursors risk what they carry — the legendary rifle is an enormous advantage right up until it becomes the defender's legendary rifle — and matchmaking is the Veil network in fiction: tier, progression, population, cooldowns, and eligibility decide compatibility, so an endgame squad does not land on a fresh world, ever. And persistent player work is protected: no demolishing ordinary structures, no emptying long-term storage, no sabotaging a world someone spent hundreds of hours on. The value sits in raidable Veil caches, faction stockpiles, and artifact vaults spawned around Anchor activity. What legitimate battle damage the fight does leave behind persists by [[persistent-damage]] — the bullet holes around the Anchor are the story the defenders tell later.`,
    meta: meta({
      category: "cooperative",
      parent: "the-veil",
      unlockStage: "Late game — when a Shard is worth raiding",
      dependsOn: ["veil-anchors", "veil-expeditions", "combat", "cooperative-play"],
      pillars: [
        "Nobody is invaded who did not open the Veil",
        "Twenty minutes, and stealth decays into a manhunt",
        "Nothing is yours until you cross home — death leaves everything behind",
        "A raid, never a griefing tool: persistent work is protected, raidable value is provided",
      ],
      openQuestions: [
        "What ruleset lets a lone defender opt into facing a full squad?",
        "How long is the cooldown before the same Shard can be hit again?",
      ],
    }),
  },
  {
    slug: "the-soul-forge",
    title: "The Soul Forge",
    summary: "Death in Martino: a machine of ancient magic and retrofitted engineering holds an Echo of you, and calls you home when your body stops. Reclamation costs Essence — which is why the world kills for it.",
    body: `How death works, and the single mechanic that explains why the whole setting behaves as it does.

A Soul Forge is a heavy pedestal etched with symbols nobody can reproduce, wrapped in cabling, containment rings, gauges, and modern electronics humanity bolted onto technology it did not build. Suspended inside the rings is the Soul Core — a small sphere of swirling energy. Held in that Core is a Soul Echo: a resonance uniquely synchronised to one person. The vocabulary is fixed and used by everyone in-world: **Soul Forge** (the machine), **Soul Core** (the sphere), **Soul Echo** (your resonance inside it), **Binding** (synchronising yourself to a Forge — see [[soul-binding]]), **Essence** (what reconstruction burns), and **Reclamation** (the act itself — see [[reclamation]]). Soldiers say it flatly: *"Johnson's down." "Confirmed — his Echo's still active." "Forge?" "Camp Kestrel." "Then he'll be back."* Players will say *"where's your Forge?"*, *"did you bind?"*, *"we're almost out of Essence."*

The law it rests on: **a soul cannot be duplicated, but its connection to a body can be restored.** The Forge copies nothing. The Echo is a beacon — when the body dies and the connection breaks, the Echo calls the soul home, and the machine spends [[essence]] building a vessel compatible enough for it to reconnect. That is why reconstruction is expensive, and why a more magically developed person costs more to rebuild.

And that is the setting's moral engine, finally stated plainly. People do not slaughter magical creatures because magic is useful. They do it because magic brings their dead back. Nations would go to war over that. Corporations would farm it, states would stockpile it, rings would traffic it — all of which [[the-harvest-economy]] already says they do. This system is why. It does not make the atrocity acceptable; it makes it *understandable*, which is worse and better drama. And it puts the [[the-soul-breakthrough]] on a fuse: if a body can be rebuilt from Essence, and Essence can be drawn from people, somebody was always going to do that arithmetic out loud.

Humanity operates Forges. It does not understand them. Some were discovered whole, some reverse-engineered, and modern builds still carry ancient components nobody can manufacture. One fact troubles everyone who reads the instruments honestly: **nobody knows where the soul goes in between.** Departure is measurable. Resonance is measurable. Between them is a gap, and then the soul returns. Some who have died remember nothing. Some describe impossible places. Some hear voices. Some are certain something followed them back. Writers: that gap is yours to use and is deliberately **not** tied to [[the-veil]] — leaving it unattached keeps both mysteries alive.`,
    meta: meta({
      category: "core loop",
      unlockStage: "Day one",
      dependsOn: ["magic"],
      pillars: [
        "A soul cannot be duplicated, but its connection to a body can be restored",
        "Reclamation burns Essence — death costs the world something real",
        "This is why humanity harvests: magic brings the dead back",
        "Humanity operates Forges without understanding them, and nobody knows where the soul goes in between",
      ],
      openQuestions: [
        "Who built the first Forges, and is that the same question as who built the Veil Anchors?",
        "What do the people who remember impossible places have in common?",
      ],
    }),
  },
  {
    slug: "soul-binding",
    title: "Soul Binding",
    summary: "Checkpoints carry the tutorial; then you press your palm to a Core, it cuts you, and the machine writes you down. BOUND — and from then on that is where you come back.",
    body: `The first half of [[the-soul-forge]], and the prologue's most important scene.

Before the party's first Forge, the tutorial runs on **checkpoints**: die and you resume at the last one. That is scaffolding, and the game says so by taking it away — checkpoints end when binding begins, and the difference should be felt.

Binding is physical. You approach the Core, press your palm to it, and the machine cuts you. Blood meets the surface, the sphere reacts violently, and your magical signature, biological pattern, and soul resonance are recorded: *Resonance detected. Biological pattern acquired. Soul Echo established.* **BOUND.** Never write "spawn point set" — the game does not use those words and neither do the people in it. A player may bind to any Forge they reach, and on death may choose to reclaim at any Forge they have touched, which makes each new Forge a permanent widening of the map.

**Where it happens first — Kestrel.** The party reaches [[forward-camp-kestrel]] and [[the-kestrel-commander]]'s first question is not about the battle: *where are you bound?* The answers characterise the party and she reads each one — deflection ("what's it to you?") earns open annoyance; *"I don't know"* earns something closer to alarm, because to Rook that means a person walking a front line with nowhere to come back to. Then she walks them to the camp's Forge and binds them herself, on the reasoning that anyone who might stay and hold this island is no use to her unbound. The scene teaches the mechanic through a character who has obvious reasons to care about it, per [[the-war-teaches]].

**And it is where the party works out that Tino is not dead.** He is not at Kestrel, and no Echo of his sits in this Core — so whatever happened to him, he did not reclaim here. The inference is that he is bound somewhere else. That is all it is: an inference. Binding on every writer, per [[what-the-player-knows-about-tino]] — **a Forge can only speak about Echoes bound to it.** Kestrel's Forge cannot confirm that Tino is alive, cannot confirm he is dead, and cannot be asked. Never write a scene where an instrument settles his fate; the empty Core is the point, and the party leaving with a question is the correct outcome. A party that raises him here should set [[asked-about-tino]].

**Then Kestrel is lost.** The island does not survive ([[the-fall-of-the-starting-island]]), and the camp's Forge goes with it — so both branches arrive at [[port-arcadia]] bound to a machine that no longer exists. Whether the party walked off the evacuation boats or washed ashore from the beach, the city feels wrong before anyone can name why, and the first real task on the mainland is finding a Forge and binding again.`,
    meta: meta({
      category: "core loop",
      parent: "the-soul-forge",
      pillars: [
        "Checkpoints are scaffolding, and the game takes them away on purpose",
        "BOUND, never 'spawn point set' — bind anywhere you reach, return to anywhere you have touched",
        "A Forge can only speak about Echoes bound to it — it can never settle Tino",
      ],
      regionNotes: [
        { region: "forward-camp-kestrel", note: "The first binding, and Rook performs it herself after asking where the party is bound. Its Core holds no Echo of Tino — which is where the party works out he did not reclaim here. Lost with the island." },
        { region: "port-arcadia", note: "The re-binding, both branches: the party lands bound to a Forge that no longer exists, and finding a working one is the first real mainland task." },
      ],
      openQuestions: [
        "Which Arcadia district holds the Forge the party binds to — and who charges for access?",
        "What does Rook say to a party that binds and then chooses the boats anyway?",
      ],
    }),
  },
  {
    slug: "reclamation",
    title: "Reclamation",
    summary: "The body stays where it fell, with everything on it. The Echo ignites, the Forge spends Essence building a vessel, and you drop onto the platform naked and breathing.",
    body: `The second half of [[the-soul-forge]] — what the military calls the act, and what everyone watching calls the worst thing they have ever seen work.

Your corpse stays exactly where it fell, and so does everything it was carrying: reclamation moves the soul, never the gear, which is what makes a death a real loss and a corpse run a real decision. Meanwhile, at your Forge, the Core ignites. Containment rings spin up, lights across the base dim, and Essence pours into the sphere. A silhouette of raw energy resolves into skeleton, then muscle, then vessels, then skin — and drops onto the platform with a *thump*. You inhale violently. You are naked, or in whatever the Forge keeps for the purpose. The machine winds down. Anyone standing in that room watched it happen, and the first time a player sees somebody else reclaim it should be genuinely hard to look away from.

The cost is [[essence]], and it scales with the person: an early-game reclamation might run 47, a developed character 386, because a more magically developed body is a harder thing to build. A base therefore keeps an Essence reserve, and that reserve is a resource the party can actually run out of. **If there is not enough, the Forge builds what it can afford — and the shortfall is paid out of the person: experience is lost and levels go down.** Nobody dies permanently; they come back *less*, which is a far more interesting punishment and one the party will feel for hours.

For writers: this is the pressure that sends people hunting, per [[gathering-and-harvest]] and [[the-harvest-economy]] — a settlement low on Essence is a settlement that starts making choices it would not otherwise make, and that is a quest, not a status bar. Write reclamation as an event with witnesses; write what it costs; and never write a death that skips the corpse. What happens in the gap between departure and return is [[the-soul-forge]]'s open question, and stays open.`,
    meta: meta({
      category: "core loop",
      parent: "the-soul-forge",
      dependsOn: ["soul-binding", "gathering-and-harvest"],
      pillars: [
        "The body and everything on it stays where it fell",
        "Reclamation is a spectacle with witnesses, not a fade to black",
        "Too little Essence and you come back less — levels are the shortfall",
      ],
      openQuestions: [
        "Does the corpse decay, and how long does the party have to reach it?",
        "Who sells reclamation to people with no Forge of their own, and at what price?",
      ],
    }),
  },
];
