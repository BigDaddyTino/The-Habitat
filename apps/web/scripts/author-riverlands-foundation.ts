import "../lib/environment";
import { getPrismaClient, type Prisma } from "@habitat/db/client";
import { NATION_MANAGEMENT_PERSISTED_SLUG } from "@habitat/shared";
import { regionMetaSchema, systemMetaSchema } from "../lib/story-meta-schemas";

/**
 * The Riverlands foundation pass — owner-approved plan of 2026-09-01.
 *
 * Rewrites the `riverlands` dossier and files the region's first children:
 * Heartland, the five gate-legs with their forts and first towns, the Three
 * Charters, the First Weir, the Outfall, and the Waterworks system entry.
 * Every ruling here is Tino's (plan artifact "The Riverlands"); reserved
 * town/outpost slots stay unwritten per placeholder law.
 *
 * Idempotent: creates what is missing, reconciles what it wrote, refuses a
 * record a writer has since edited by hand. The `riverlands` body rewrite
 * runs a word-level loss check against the stored prose and aborts if any
 * content word would be dropped.
 *
 *   pnpm --filter @habitat/web exec tsx scripts/author-riverlands-foundation.ts
 *   pnpm --filter @habitat/web exec tsx scripts/author-riverlands-foundation.ts --apply
 */

type RegionSeed = {
  kind: "REGION";
  slug: string;
  title: string;
  summary: string;
  body: string;
  meta: {
    type: "region" | "zone" | "settlement" | "landmark" | "site" | "destination" | null;
    settlementTier: "village" | "town" | "city" | "major-city" | null;
    parent: string | null;
    biome: string | null;
    control: Array<{ faction: string; kind: "holds" | "contests" | "influences" | null }>;
    population: string | null;
    connections: Array<{ to: string; by: string | null; notes: string | null }>;
    status: string | null;
    veilAnchorTier: "I" | "II" | "III" | "IV" | "V" | null;
    soulForge: "active" | "damaged" | "destroyed" | null;
    gameTag: string | null;
    openQuestions: string[];
  };
};

type SystemSeed = {
  kind: "SYSTEM";
  slug: string;
  title: string;
  summary: string;
  body: string;
  meta: {
    category: string | null;
    buildStatus: string | null;
    parent: string | null;
    unlockArc: string | null;
    unlockStage: string | null;
    dependsOn: string[];
    pillars: string[];
    regionNotes: Array<{ region: string; note: string }>;
    gameTag: string | null;
    openQuestions: string[];
  };
};

const region = (seed: Omit<RegionSeed, "kind">): RegionSeed => ({ kind: "REGION", ...seed });

// The legs deliberately do NOT settle evenly (owner ruling): the money river is
// thick with towns, the hard legs are watch-post-heavy, and villages below the
// law's count fill in freely. Each leg carries its own reserved-slot note.
const RESERVED = {
  arcadia: "Reserved slots per the leg law: the money river's five town slots are full; one outpost slot remains open for future writers. Villages below the law's count may fill in freely.",
  cliff: "Reserved slots per the leg law: the mountain leg's three outpost slots are full; two town slots remain open for future writers. Villages below the law's count may fill in freely.",
  rift: "Reserved slots per the leg law: two town slots and one outpost slot remain open for future writers. Villages below the law's count may fill in freely.",
  sand: "Reserved slots per the leg law: three town slots and one outpost slot remain open for future writers — the corridor settles sparse on purpose. Villages below the law's count may fill in freely.",
  storm: "Reserved slots per the leg law: the held river's three outpost slots are full; three town slots remain open for future writers. Villages below the law's count may fill in freely.",
} as const;

const seeds: Array<RegionSeed | SystemSeed> = [
  // ─── Heartland ────────────────────────────────────────────────────────────
  region({
    slug: "heartland",
    title: "Heartland",
    summary:
      "The city where all five rivers braid — the center of trade for every region, neutral under an uneasy pact, and worth more than any army that could take it.",
    body: `Heartland sits where the watershed's five arms braid into one water, which makes it the center of trade for every region on the map and the most valuable ground nobody owns. Grain from the floodplain, ore off [[cliffgate]], relics down [[riftgate]], caravan goods up [[sandgate]], instruments and strange cargo along [[stormgate]], and everything the [[the-peninsula]] buys or sells riding [[arcadia-gate]] — all of it clears Heartland's wharves, and the city takes its cut in every currency there is.

It stays neutral by a pact a generation old that everyone calls the Standstill: every faction gets a wharf, no faction gets a garrison. [[aegis-extraction-consortium]], the [[mountain-holdfasts]], the [[bone-market-families]], the [[desert-nomad-compact]], and the [[meridian-arcane-institute]] each hold a gate-leg of river and each wants the city at the end of it — and each knows that reaching for it hands the other four a war worth fighting. The Heartland Watch, the city's own guard and levy, wants the Standstill kept; so do the city folk, who have watched the war eat every other country that worked. Nobody in Heartland thinks the peace is permanent. They think it is theirs, which is different, and they know it is only a matter of time before one gate lights off the rest.

The city is run from the courthouse. Commander Alder Wade holds the chair — the title is military and the war behind it never came, which is the whole city in one word. The wharves call him Old Wade to his face. He has kept the Standstill by being the one man all five factions find more useful standing than gone, and the pact's anniversary is coming round: the five factions are jointly commissioning a statue of him, splitting the cost five ways, and each of them is quietly shaving its share. Beside the chair sits the Judge, the pact's arbiter — the only office in the city all five factions trust, because the Judge's rulings are the alternative to finding out.

Heartland's five great lock-gates stand in the city wall where each river enters, and the legs take their names from them. The gates are [[the-waterworks]] at civic scale: ancient machinery nobody alive built, maintained by gate crews who keep its brass moving and ask it no questions. Closing a gate is a real act of war, and the city has never closed one.

The city keeps a public [[the-soul-forge]], active and open to any citizen the Watch will vouch for. Its Core is also the home of the teacher the river folk call the Resident — Brother Aster, a bound Echo who never left the machine, and teaches from inside it. The city's neutrality is quietly guarded by a man who cannot leave it.

In courthouse escrow sit three land charters older than the Standstill — [[first-charter]], [[second-charter]], [[third-charter]] — the only ground in the Riverlands that can be bought outright and built on. The Judge's office holds the deeds and has never released one.

For writers: Heartland is where holding ground is learned — [[outpost-and-city-management]] taught in the streets, [[${NATION_MANAGEMENT_PERSISTED_SLUG}]]'s charter granted here when the arc that grants it is finally written. The fuse is the city's whole character: write the counting-down politeness, the exits everyone has mapped, the five wharves pretending not to watch each other. Do not spend the fuse early, and do not write the Standstill breaking — that belongs to the campaign arc alone.`,
    meta: {
      type: "settlement",
      settlementTier: "city",
      parent: "riverlands",
      biome: "braided river nexus; dry walled ground in open floodplain",
      control: [
        { faction: "aegis-extraction-consortium", kind: "influences" },
        { faction: "mountain-holdfasts", kind: "influences" },
        { faction: "bone-market-families", kind: "influences" },
        { faction: "desert-nomad-compact", kind: "influences" },
        { faction: "meridian-arcane-institute", kind: "influences" },
      ],
      population: "The largest river city in the world; the census is argued wharf by wharf.",
      connections: [
        { to: "arcadia-gate", by: "gate-lock", notes: "The money gate: the freight artery southwest toward the Peninsula." },
        { to: "cliffgate", by: "gate-lock", notes: "The vertical gate: locks and lifts climbing the falls toward the High Cliffs." },
        { to: "riftgate", by: "gate-lock", notes: "The relic gate: tannin-dark water northwest toward the Grand Rift." },
        { to: "sandgate", by: "gate-lock", notes: "The caravan gate: the oasis corridor south into the Desert." },
        { to: "stormgate", by: "gate-lock", notes: "The engineered gate: the held river northeast into the Magic-Torn Wasteland." },
        { to: "first-weir", by: "undercroft stair", notes: "Down from the oldest cellars into the drowned works the city stands on." },
        { to: "the-outfall", by: "levee road", notes: "Out past the last levee into the wild fen. The Watch patrols to the line and no further." },
      ],
      status: "Neutral under the Standstill; the Watch keeps it that way, and everyone is counting.",
      veilAnchorTier: null,
      soulForge: "active",
      gameTag: null,
      openQuestions: [
        "How long can the Standstill hold once any single gate changes hands?",
        "Who sits in the Commander's chair after Alder Wade — and who gets to decide?",
      ],
    },
  }),

  // ─── The five gate-legs ───────────────────────────────────────────────────
  region({
    slug: "arcadia-gate",
    title: "Arcadia Gate",
    summary:
      "The money leg: the freight artery running southwest from Heartland's wall to the Peninsula, held by Aegis and worth more per mile than any other water in the world.",
    body: `Arcadia Gate is the leg every ledger loves: the deep, patient water running southwest from [[heartland]]'s wall toward [[the-peninsula]] and the markets of [[port-arcadia]]. Grain, ore, relics, and refined [[essence]] ride it south; coin, machines, and the war's appetite ride it back north. It is the busiest freight corridor in the world and the reason Heartland matters to people who could not find the other four gates on a map.

[[aegis-extraction-consortium]] holds the leg — the wharves, the pilotage, and above all [[clearinghouse]], the customs fort where every southbound cargo is weighed, sealed, and taxed. Aegis wants Heartland the way it wants everything: as a line item it controls. It is the richest of the five gate factions and the least sentimental, and its patience is the kind that owns things eventually.

Downriver the country hardens. Past [[halfload]]'s shallows the traffic thins, the escorts get serious, and the war on the Peninsula stops being news and starts being weather. The leg is the safest road out of the Riverlands right up until it is not.

The leg's settlements run the whole argument of the money river — it is the thickest-settled water in the region, its five town slots full. [[widows-toll]] holds the great bridge and the one fund on the leg Aegis cannot audit; [[brasslight]]'s pilot families run the night channel by heirloom lamplight; [[sunken-row]] stands on the pilings of its own wrecks and keeps what the river takes; and at [[velvet-reach]] the money rests, and more cargo changes owners after dark than Clearinghouse sees by day. Between them, [[tally-light]] counts every convoy in lamp-code, and [[gullwatch]] reads the birds at the war's edge, because gulls follow wrecks and fleets alike.

For writers: this is the leg where money talks and everything listens. Contested crossings here are priced, not fought — until the campaign changes that. ${"Reserved"} slots below hold the rest of the leg.`,
    meta: {
      type: "zone",
      settlementTier: null,
      parent: "riverlands",
      biome: "deep freight river through settled floodplain, hardening toward the war",
      control: [{ faction: "aegis-extraction-consortium", kind: "holds" }],
      population: "Barge crews, pilot families, and Aegis payrolls the whole way down.",
      connections: [
        { to: "heartland", by: "gate-lock", notes: "The leg begins at its gate in the city wall; in town you ship out through Arcadia Gate." },
      ],
      status: "Held by Aegis; the safest leg by contract and the richest by far.",
      veilAnchorTier: null,
      soulForge: null,
      gameTag: null,
      openQuestions: [RESERVED.arcadia],
    },
  }),
  region({
    slug: "cliffgate",
    title: "Cliffgate",
    summary:
      "The vertical leg: locks, lifts, and switchback water climbing the falls from Heartland toward Grand Lake and the High Cliffs, run by the Mountain Holdfasts.",
    body: `Cliffgate is the leg that goes up. North of [[heartland]] the water turns to stairs — the long chain of falls and races fed by [[grand-lake]] pouring off [[high-cliffs]] — and the river becomes a climbing machine: lock after lock, lift after lift, barges hauled bodily up cradles of timber and chain. It is the only freight route between the watershed and the high country, and every ton of mountain ore in Heartland's markets came down it.

The [[mountain-holdfasts]] run the leg from [[winchworks]], the lift-yard fortress at the great falls, with [[stairfoot]] queued at its base. They are [[the-free-peoples-compact]]'s people — miners, smiths, and militias who hold the passes above and the grudge that comes with them — and they treat the leg less like property than like a tool they will not be parted from. Their answer to the question of who owns the water is that the water is not for sale, which is the Compact's single article said shorter.

The locks and lifts are [[the-waterworks]] at their most naked: ancient counterweights that take a barge's whole weight without complaint, worked by crews who learned the levers from their parents and know better than to ask the machinery how it knows.

The climb has grown its own settlements, and more watch posts than any other leg — the mountain leg's three outpost slots are full. [[chainsong]] lives under the great chains and forecasts weather by their pitch; the [[hanging-market]] is bolted to the cliff face itself, shops stacked in galleries a customer climbs through; the village of [[thundershade]] farms moss in the falls' permanent spray-shadow and its people read lips before they read letters. Above and below, [[deadhaul]] keeps watch from the abandoned incline nobody names the last day of, [[anvil-watch]] counts what moves on the gorge road rather than the water, and [[high-sill]] holds the lip of the falls and decides what goes over the top.

For writers: the leg's drama is vertical — what goes up on credit, what comes down under guard, and what happens at the one chokepoint everything must pass. ${"Reserved"} slots below hold the rest.`,
    meta: {
      type: "zone",
      settlementTier: null,
      parent: "riverlands",
      biome: "stepped river of falls, locks, and lift-yards climbing toward the cliffs",
      control: [{ faction: "mountain-holdfasts", kind: "holds" }],
      population: "Lock crews, cradle riggers, and holdfast families who never quite came down.",
      connections: [
        { to: "heartland", by: "gate-lock", notes: "The leg begins at its gate in the city wall; the climb starts within sight of it." },
      ],
      status: "Held by the Holdfasts; the one road up, and priced like it.",
      veilAnchorTier: null,
      soulForge: null,
      gameTag: null,
      openQuestions: [RESERVED.cliff],
    },
  }),
  region({
    slug: "riftgate",
    title: "Riftgate",
    summary:
      "The relic leg: tannin-dark water running northwest through Red Forest country toward the Grand Rift, held by the Bone Market Families — the dead trade's own river.",
    body: `Riftgate runs northwest out of [[heartland]] into country that gets older as it goes. The water is dark with red-leaf tannin long before [[the-red-forest]] proper, and what comes down the leg is the past itself: rift-relics, bone-goods, grave salvage, and the quiet coffins of the dead trade, bound for buyers who do not ask where the [[grand-rift]] ends and the graveyard begins.

The [[bone-market-families]] hold the leg, which surprises people who expected soldiers. Old-money crime does not need soldiers: it needs [[charnel-lock]], the fortified river-lock every relic cargo must pass, and [[wakewater]], the town where the trade holds its wakes and its auctions in the same rooms. The Families are dignified, patient, and owed by half of Heartland — and the other half is behind on payments. Their claim on the city is the oldest kind there is: the ledger.

On this leg stands the ruin the courthouse deeds call [[third-charter]] — an old watch-fort with a flooded ditch and a wall worth keeping, held in escrow like the other two parcels. The Families have never moved on it. They have opinions about neighbors.

The dead trade has domesticated the whole river. Funeral barges queue at [[mourners-ferry]], where the bell tolls once per passenger and the town can count a rich man's death by ear; contracts are inked in red-leaf tannin at [[redletter]], and a thing signed in Redletter is binding beyond appeal and beyond the grave; [[candlereach]] lights the night stretch with grave-candles, and a dark barge on the Reach is either empty or lying. The Families' [[quiet-boom]] can close the river without a sound, and [[bonefire-picket]]'s white beacon burns the trade's own bone-oil — the old word for bonfire, kept honest.

For writers: Riftgate's menace is contractual, never loud. Everything on this river is owed to someone, including the bodies. ${"Reserved"} slots below hold the rest of the leg.`,
    meta: {
      type: "zone",
      settlementTier: null,
      parent: "riverlands",
      biome: "tannin-dark river through red-forest country, rising toward the Rift",
      control: [{ faction: "bone-market-families", kind: "holds" }],
      population: "Barge undertakers, appraisers, and families who have always been here.",
      connections: [
        { to: "heartland", by: "gate-lock", notes: "The leg begins at its gate in the city wall; the water is already dark there." },
      ],
      status: "Held by the Bone Market; the dead trade's river, and the politest leg by far.",
      veilAnchorTier: null,
      soulForge: null,
      gameTag: null,
      openQuestions: [RESERVED.rift],
    },
  }),
  region({
    slug: "sandgate",
    title: "Sandgate",
    summary:
      "The caravan leg: the oasis corridor running south from Heartland into the Desert — the caravan peoples' one wet border, held by the Desert Nomad Compact.",
    body: `Sandgate runs south from [[heartland]] and is the last green thing a traveler sees before [[the-desert]] starts killing the confident. The leg is the oasis corridor: a ribbon of river, palms, and watered ground reaching into the dry country, and the [[desert-nomad-compact]] meets the water here — the caravan peoples' one wet border, and the only place their world and the river's world touch.

The Compact are [[the-free-peoples-compact]]'s southern hand, and they hold the leg from [[standing-camp]] — the one camp in all their history that never strikes, because a [[the-soul-forge]] cannot walk. That fact sits at the center of their politics like a stone: the people who belong nowhere are chained to one place by their dead. Downstream of it, [[lastwater]] fits out every crossing the desert permits and prices the water honestly, which is to say by weight.

Everything the deep desert yields — salt, relic glass, the trade of the interior — comes up this leg, and everything the caravans cannot make comes down it. The Compact does not want Heartland the way the others want it. It wants the water to stay open, and it has noticed that wanting things to stay as they are is the most expensive position in the Riverlands.

The corridor's places keep the crossing honest. [[honest-well]] is the one well never salted, poisoned, or claimed in the corridor's whole history, and feuds pause at its wellhead or end at a rope; [[mirrorwater]]'s still oxbow flashes from the ridge line and the town keeps the water unbroken at dawn so the flash reads true; [[saltsong]]'s tuned evaporation pans crack and sing at dusk, and a keeper can hear a bad batch. Out on the edges, [[dry-bell]] strikes once per missing day per overdue caravan — the worst sound in the corridor is the bell finding a rhythm — and [[vultures-patience]] watches the deep desert on the doctrine its name admits to.

For writers: Sandgate is hospitality with arithmetic under it. Every kindness on this leg is real and every kindness is counted. ${"Reserved"} slots below hold the rest.`,
    meta: {
      type: "zone",
      settlementTier: null,
      parent: "riverlands",
      biome: "oasis river corridor: palms and watered green narrowing into dry country",
      control: [{ faction: "desert-nomad-compact", kind: "holds" }],
      population: "Caravan families in season, ferry keepers and well-tenders the year round.",
      connections: [
        { to: "heartland", by: "gate-lock", notes: "The leg begins at its gate in the city wall; the green thins from there south." },
      ],
      status: "Held by the Nomad Compact; the one wet road into the interior.",
      veilAnchorTier: null,
      soulForge: null,
      gameTag: null,
      openQuestions: [RESERVED.sand],
    },
  }),
  region({
    slug: "stormgate",
    title: "Stormgate",
    summary:
      "The engineered leg: a river held unnaturally steady by pylons and instruments, running northeast into the Magic-Torn Wasteland under Meridian's research charter.",
    body: `Stormgate is the leg that should not work. Northeast of [[heartland]] the country begins its long slide toward [[magic-torn-wasteland]], where physical law stops being a promise — and the river runs through it anyway, held steady by a corridor of pylons, instruments, and stabilization hardware bolted along both banks. The water is unnaturally calm the whole way. Bargemen call it the quietest river in the world and do not mean it as a compliment.

The [[meridian-arcane-institute]] holds the research charter for the corridor and runs the leg from [[regulator-station]], the fortress built around the master pylon — though the guns on its walls belong to [[iron-saints-pmc]] mercenaries, because Meridian's prestige does not stop artillery. Downstream, [[gaugetown]] reads the river with a household superstition of needles and dials, and when its gauges disagree with the Regulator's official numbers, Gaugetown believes the needles.

What Meridian wants with the leg is the acceptable question, and the acceptable answer is research access to the Wasteland. The Institute's funding sources are a subject its students are taught never to ask about, and its interest in the Riverlands does not end at this river.

The held river breeds strange settlements, and it is thin country — more wire and watch posts than streets, its three outpost slots full. The village of [[glasscalm]] crosses the flattest water in the world at a whisper, and its boatmen say the calm is not the absence of current but attention; every hull on the leg threads [[needles-eye]] between the narrowest pylon pair, one tattooed needle per hundred threadings; and [[farflicker]]'s lamps stutter in patterns off the Wasteland's interference — the children learn flicker-rhymes, Meridian records them, and some of them scan. When the corridor calls a weather hold, every hull on the upper leg runs for [[last-mooring]] and chains to bollards that have never let go. Past the last pylon, [[breakline]] holds the point where stabilization ends and has moved twice, both times inward, and [[echo-fence]]'s resonant posts hum back what the storm country says to them.

For writers: Stormgate is the leg where the region's oldest machinery and its newest science stand on the same banks pretending not to see each other — the pylons are modern, the calm underneath them may not be. ${"Reserved"} slots below hold the rest.`,
    meta: {
      type: "zone",
      settlementTier: null,
      parent: "riverlands",
      biome: "stabilized river corridor running into storm country; unnaturally calm water",
      control: [{ faction: "meridian-arcane-institute", kind: "holds" }],
      population: "Research crews, garrison rotations, and rivermen who trust the needles.",
      connections: [
        { to: "heartland", by: "gate-lock", notes: "The leg begins at its gate in the city wall; the calm starts at the first pylon." },
      ],
      status: "Held by Meridian under charter; Iron Saints garrison the hardware.",
      veilAnchorTier: null,
      soulForge: null,
      gameTag: null,
      openQuestions: [RESERVED.storm],
    },
  }),

  // ─── Forts and first towns ────────────────────────────────────────────────
  region({
    slug: "clearinghouse",
    title: "Clearinghouse",
    summary:
      "The Aegis customs fort on Arcadia Gate: every southbound cargo is weighed, sealed, and taxed here, and the ledgers are the real fortifications.",
    body: `Clearinghouse is [[aegis-extraction-consortium]]'s headquarters on [[arcadia-gate]] and the point every southbound cargo must clear: a customs house built like a fortress, or a fortress that files like a customs house — from the river it is hard to say which insult lands closer. Cranes, bonded warehouses, assay benches, and a garrison that salutes the manifest before the officer.

The fort keeps its own [[the-soul-forge]], active, its Essence reserve carried on the books as a line item between dredging and lamp oil. That entry says everything about Aegis anyone needs to know: coming back from the dead is, here, a budgeted operating cost.

For writers: nothing enters or leaves the Riverlands' richest river without touching this place, which makes its records the most valuable thing on the leg — worth more than the cargo, to the right buyer.`,
    meta: {
      type: "site",
      settlementTier: null,
      parent: "arcadia-gate",
      biome: "fortified customs complex on the deep-water freight river",
      control: [{ faction: "aegis-extraction-consortium", kind: "holds" }],
      population: "Clerks, assayers, crane crews, and a garrison on corporate rotation.",
      connections: [],
      status: "Aegis regional headquarters; the leg's fort under the Standstill's fort law.",
      veilAnchorTier: null,
      soulForge: "active",
      gameTag: null,
      openQuestions: ["What is in the sealed sub-ledger the fort's own clerks are not cleared to reconcile?"],
    },
  }),
  region({
    slug: "halfload",
    title: "Halfload",
    summary:
      "The shallows town on Arcadia Gate where deep barges lighten to pass — a whole town living on the transfer, where everyone's cargo passes through everyone's hands.",
    body: `Halfload exists because the river does not quite cooperate: a long shallow reach on [[arcadia-gate]] where the deep-draft barges must lighten, handing half their load to shallow lighters and taking it back aboard below the bar. A whole town lives on that transfer — stevedores, tally clerks, lighter families, cranemen — and its unofficial motto is the truest sentence on the leg: everything passes through everyone's hands.

That makes Halfload the friendliest town on the money river and the leakiest. What a manifest says and what a lighter carries are reconciled here by people paid by both sides, and the town's real trade is the difference. [[aegis-extraction-consortium]] audits Halfload constantly, catches something every time, and has never once caught the same thing twice.

For writers: any cargo, any secret, any person who needs to vanish between [[heartland]] and the [[the-peninsula]] plausibly does it at Halfload, in the gap between one hull and another.`,
    meta: {
      type: "settlement",
      settlementTier: "town",
      parent: "arcadia-gate",
      biome: "shallow-reach river town of wharves, lighters, and transfer cranes",
      control: [{ faction: "aegis-extraction-consortium", kind: "influences" }],
      population: "Lighter families and stevedore crews; swells with every convoy.",
      connections: [],
      status: "The leg's first written town; prosperous, porous, and audited without end.",
      veilAnchorTier: null,
      soulForge: null,
      gameTag: null,
      openQuestions: [],
    },
  }),
  region({
    slug: "winchworks",
    title: "Winchworks",
    summary:
      "The Holdfast lift-yard fortress at the great falls of Cliffgate: ancient counterweight machinery hauling whole hulls up the cliff, and the mountains' one door to the river.",
    body: `Winchworks is the [[mountain-holdfasts]]' headquarters on [[cliffgate]] and the reason the leg works at all: the lift-yard fortress at the great falls, where barges are floated into timber cradles and hauled bodily up the cliff face on chains and counterweights that were old before anyone now living was born. The machinery is [[the-waterworks]] at its most unarguable — it takes a laden hull's whole weight without strain, and the Holdfast crews who work its levers maintain everything around the old works and nothing inside them, because nothing inside them has ever needed it.

The fort grew around the machine the way holdfasts grow around a mine: stone courses, chain galleries, windlass halls, and a garrison that thinks of the lifts the way other soldiers think of a standard. It keeps an active [[the-soul-forge]] in the deep gallery, and the Holdfasts' rule for it is their rule for everything — their own people first, paid strangers second, questions never.

For writers: the day Winchworks stops, the mountains close. Every power on the map knows it, which is why the politest thing on the leg is how carefully nobody threatens the lifts.`,
    meta: {
      type: "site",
      settlementTier: null,
      parent: "cliffgate",
      biome: "lift-yard fortress at the great falls; chain galleries and windlass halls",
      control: [{ faction: "mountain-holdfasts", kind: "holds" }],
      population: "Cradle crews, chainwrights, and a holdfast garrison with long memories.",
      connections: [],
      status: "Holdfast regional headquarters; the leg's fort, and the leg's whole argument.",
      veilAnchorTier: null,
      soulForge: "active",
      gameTag: null,
      openQuestions: ["What do the counterweights actually descend into? The chain galleries stop at a door the crews do not open."],
    },
  }),
  region({
    slug: "stairfoot",
    title: "Stairfoot",
    summary:
      "The town at the base of Cliffgate's great falls, living in the spray and the lift queues — where the mountain and river worlds wait in the same line.",
    body: `Stairfoot lives at the bottom of the climb on [[cliffgate]], in the permanent spray and thunder of the great falls, and its whole economy is the queue: barges waiting for cradles, crews waiting for barges, and everyone waiting on [[winchworks]] above. Boarding houses, chandlers, rope-lofts, and taprooms where mountain folk coming down and river folk going up drink at the same bar and mostly do not fight about it.

The town's mood is the leg's weather report. When the lifts run sweet, Stairfoot sings; when the Holdfasts slow the cradles to make a point upstream, the queue backs down the river and the town's tempers back up with it. A person who wants to know what the [[mountain-holdfasts]] intend before they announce it watches the lift schedule, not the fort.

For writers: everything on the vertical leg funnels through this one wet, loud, cheerful chokepoint. Whatever needs to happen to a cargo, a traveler, or a secret on Cliffgate happens while it waits its turn at Stairfoot.`,
    meta: {
      type: "settlement",
      settlementTier: "town",
      parent: "cliffgate",
      biome: "falls-foot town in permanent spray; wharves, rope-lofts, boarding houses",
      control: [{ faction: "mountain-holdfasts", kind: "influences" }],
      population: "Queue town: steady families, and a floating population the lifts decide.",
      connections: [],
      status: "The leg's first written town; loud, wet, and never still.",
      veilAnchorTier: null,
      soulForge: null,
      gameTag: null,
      openQuestions: [],
    },
  }),
  region({
    slug: "charnel-lock",
    title: "Charnel Lock",
    summary:
      "The Bone Market's fortified river-lock on Riftgate: every relic cargo and every coffin pays its respects here, and the toll is always exactly correct.",
    body: `Charnel Lock is the [[bone-market-families]]' headquarters on [[riftgate]]: a fortified lock the tannin-dark water must pass, staffed by attendants in mourning dress whose courtesy has never once been mistaken for weakness. Every relic cargo, every bone-goods consignment, every coffin coming down from the [[grand-rift]] country pays its respects at the Lock, and the toll is always exactly correct — the Families consider overcharging vulgar, which frightens people more than extortion would.

The fort is a lock-castle: gate machinery of [[the-waterworks]]' usual unexplained vintage, wrapped in generations of Family stonework, record crypts, and viewing rooms where cargo is appraised with the same gravity as the dead. It keeps an active [[the-soul-forge]], and the Families' relationship to it is the house joke nobody makes twice: the people who sell funerals maintain the machine that makes funerals optional.

For writers: the Lock is where the dead trade's paperwork lives. Whatever came down the river in the last century, a ledger here says who bought it — and the Families' ledgers are the one thing they have never sold.`,
    meta: {
      type: "site",
      settlementTier: null,
      parent: "riftgate",
      biome: "fortified river-lock in dark water; lock-castle, record crypts, toll wharf",
      control: [{ faction: "bone-market-families", kind: "holds" }],
      population: "Family attendants, appraisers, lock crews; a garrison that dresses well.",
      connections: [],
      status: "Bone Market regional headquarters; the leg's fort, run like a funeral that never ends.",
      veilAnchorTier: null,
      soulForge: "active",
      gameTag: null,
      openQuestions: ["Which of the five Families actually holds the Lock's charter, and why do the other four let the question stand?"],
    },
  }),
  region({
    slug: "wakewater",
    title: "Wakewater",
    summary:
      "The town on Riftgate where the dead trade holds its wakes and its auctions in the same rooms — every funeral is also an appraisal.",
    body: `Wakewater is the [[riftgate]] town where the dead trade is domestic. The wakes are real — the river folk bury and mourn like anyone — but in Wakewater the wake and the auction learned long ago to share premises, and nobody local sees the contradiction anymore. A viewing in the front room, an appraisal in the back; the same low voices for both; and the [[bone-market-families]]' agents in attendance at each, paying their respects and their retainers.

Relics come down the river, and Wakewater is where they surface: rift glass, grave goods, instruments from expeditions that did not come back whole. The town's appraisers are the best outside [[heartland]], and its etiquette is the strictest on any leg — because when everything in the room is worth money and somebody is grieving, manners are load-bearing.

For writers: Wakewater is where a relic's story is decided — what it is, where it came from, and which version of that gets written down. The difference between those is the town's real economy.`,
    meta: {
      type: "settlement",
      settlementTier: "town",
      parent: "riftgate",
      biome: "riverside town of wake-houses, auction rooms, and appraisers' lofts",
      control: [{ faction: "bone-market-families", kind: "influences" }],
      population: "Appraisers, wake-keepers, and families in the trade for generations.",
      connections: [],
      status: "The leg's first written town; quiet rooms, strict manners, serious money.",
      veilAnchorTier: null,
      soulForge: null,
      gameTag: null,
      openQuestions: [],
    },
  }),
  region({
    slug: "standing-camp",
    title: "Standing Camp",
    summary:
      "The one camp the Desert Nomad Compact never strikes: their fort on Sandgate, standing because a Soul Forge cannot walk — the wandering peoples' fixed point.",
    body: `Standing Camp is the contradiction at the heart of the [[desert-nomad-compact]], and their headquarters on [[sandgate]]: the one camp in the caravan peoples' whole history that never strikes. It stands because an active [[the-soul-forge]] stands in it, and a Forge cannot walk — so the people who belong nowhere are chained to one place by their dead, and they have built that place the only way they know, as a camp: rings of tents and awnings around a stone heart, permanent in everything but appearance.

As a fort it does not look like one, which has misled exactly the people it was meant to mislead. The rings are laid out as fields of fire; the wells are inside; the camel lines double as walls; and the Compact can put every rider within a season's reach onto this ground faster than any gate faction credits. It is also the Compact's assembly ground on the river — where the caravans meet, marry, settle feuds, and vote, loudly, the way [[the-free-peoples-compact]] votes about everything.

For writers: the Camp is the Nomads' one hostage to fortune and they know it. Threats against it do not produce negotiation; they produce the whole desert at once.`,
    meta: {
      type: "site",
      settlementTier: null,
      parent: "sandgate",
      biome: "permanent camp in rings around a stone Forge-heart; wells and camel lines",
      control: [{ faction: "desert-nomad-compact", kind: "holds" }],
      population: "A standing keeper clan, and the caravans of the whole interior in season.",
      connections: [],
      status: "Nomad Compact regional headquarters; the leg's fort, disguised as impermanence.",
      veilAnchorTier: null,
      soulForge: "active",
      gameTag: null,
      openQuestions: ["Whose Echoes does the Camp's Forge hold from before the Compact held the Camp — and do the keepers know?"],
    },
  }),
  region({
    slug: "lastwater",
    title: "Lastwater",
    summary:
      "The final watering town on Sandgate, where every desert crossing fits out and water has an honest price list — by weight, like everything that matters.",
    body: `Lastwater is the last town on [[sandgate]] and means it: below here the green quits and [[the-desert]] starts charging. Every crossing the desert permits fits out at Lastwater — water, fodder, shade cloth, guides, and the [[desert-nomad-compact]]'s stamped assurance that a caravan's route has been agreed with the people who own the wells along it. The town sells water by weight, openly, off a posted price list, and everyone pretends that is normal because the alternative to the list is what the desert charges.

The town is half river folk, half Compact, and wholly practical. Its warehouses hold the interior's trade coming up — salt, relic glass, worked leather — and the river's goods going down, and its real product is the crossing itself: organized, priced, survivable. Freelancers who skip the stamp are not stopped. They are remembered, briefly.

For writers: Lastwater is where the river's rules end and the desert's begin, and the town's whole culture is the seam between them. Anyone heading into the interior meets it here first, as a price list.`,
    meta: {
      type: "settlement",
      settlementTier: "town",
      parent: "sandgate",
      biome: "edge-of-green river town: watering wharves, caravan yards, shade markets",
      control: [{ faction: "desert-nomad-compact", kind: "influences" }],
      population: "Outfitters and well-tenders year round; caravan crowds in season.",
      connections: [],
      status: "The leg's first written town; the desert's front desk.",
      veilAnchorTier: null,
      soulForge: null,
      gameTag: null,
      openQuestions: [],
    },
  }),
  region({
    slug: "regulator-station",
    title: "Regulator Station",
    summary:
      "The fortress around Stormgate's master pylon: Meridian researchers upstairs, Iron Saints guns on the walls, and a river that does exactly what the instruments say.",
    body: `Regulator Station is the fortress built around [[stormgate]]'s master pylon — the keystone of the stabilization corridor, and the reason the leg's water lies calm all the way into country where calm is against nature. [[meridian-arcane-institute]] holds the Station under its research charter and staffs it with the Institute's usual polished seriousness; the guns on the walls belong to [[iron-saints-pmc]], on an invoice whose renewal dates the whole leg can recite, because the day Meridian stops paying is a day everyone downstream has plans for.

Inside, the Station is two buildings arguing: a research institution of instrument halls, calibration floors, and sealed archives wrapped around a piece of engineering that answers to the master pylon — and beneath the modern hardware, older courses of stone that the survey drawings mark, without elaboration, as prior works. The Station keeps an active [[the-soul-forge]] for staff and garrison, administered with consent forms.

For writers: the Station's public mission is keeping the river safe for the leg. Its actual budget is classified even from most of its own researchers, and its instruments watch more than water.`,
    meta: {
      type: "site",
      settlementTier: null,
      parent: "stormgate",
      biome: "pylon fortress on the stabilized river: instrument halls over older stone",
      control: [
        { faction: "meridian-arcane-institute", kind: "holds" },
        { faction: "iron-saints-pmc", kind: "influences" },
      ],
      population: "Researchers on rotation, permanent technical staff, a mercenary garrison.",
      connections: [],
      status: "Meridian regional headquarters; the leg's fort, garrisoned by invoice.",
      veilAnchorTier: null,
      soulForge: "active",
      gameTag: null,
      openQuestions: ["What do the survey drawings mean by 'prior works' — and why does that sheet have its own classification?"],
    },
  }),
  region({
    slug: "gaugetown",
    title: "Gaugetown",
    summary:
      "The Stormgate town that reads the river: every household keeps a gauge, and when the needles disagree with the Regulator's numbers, Gaugetown believes the needles.",
    body: `Gaugetown grew up downstream of [[regulator-station]] as the corridor's service town — pilots, maintenance crews, instrument-tenders — and developed the only municipal religion on any leg: reading the river. Every household keeps a gauge; the taproom wall is a bank of dials older than the taproom; and the town's children learn needle-drift the way other towns' children learn weather signs. It is half superstition and half the best independent dataset on [[stormgate]] in existence, and [[meridian-arcane-institute]] has tried to buy it twice.

The town's article of faith is simple: when the needles disagree with the Regulator's official numbers, believe the needles. It has been right often enough to keep the faith alive, and the occasions it was right are the stories the town tells instead of history.

For writers: Gaugetown is the leg's honest witness. If something changes on the held river — pressure, calm, whatever moves beneath the calm — this town's wall of dials knows before anyone official admits it.`,
    meta: {
      type: "settlement",
      settlementTier: "town",
      parent: "stormgate",
      biome: "corridor service town: pilot houses, instrument shops, the dial wall",
      control: [{ faction: "meridian-arcane-institute", kind: "influences" }],
      population: "Pilots, tenders, and maintenance families; everyone reads.",
      connections: [],
      status: "The leg's first written town; the needles are the town.",
      veilAnchorTier: null,
      soulForge: null,
      gameTag: null,
      openQuestions: [],
    },
  }),

  // ─── Arcadia Gate: deeper coverage ────────────────────────────────────────
  region({
    slug: "widows-toll",
    title: "Widow's Toll",
    summary:
      "The bridge town on Arcadia Gate whose crossing coin is split by ancient deed between the bridge and the river's war widows — the one fund on the money leg Aegis cannot audit.",
    body: `Widow's Toll holds the great road bridge over [[arcadia-gate]], and the toll is exactly what the name says: by a deed older than any company on the river, every crossing coin splits two ways — half to the bridge's keeping, half to the fund for the river's war widows. [[aegis-extraction-consortium]]'s lawyers have read the deed a dozen ways and given up a dozen times; the fund predates their charter, their nation's charter, and possibly the idea of charters.

The town runs on the bridge, the fund, and the Accounting — the day each year when the widows gather on the span and read the names of the river's dead aloud, newest first, while the traffic waits. Nobody has ever made the traffic wait for anything else on the money leg. Barge crews time their runs to be under the bridge for it.

For writers: the fund's books are the one ledger on the leg Aegis cannot open, which makes them the most interesting documents on the river — who has been paid quietly, for what loss, since before the war had its current name.`,
    meta: {
      type: "settlement",
      settlementTier: "town",
      parent: "arcadia-gate",
      biome: "bridge town: stone span, toll houses, the widows' hall",
      control: [{ faction: "aegis-extraction-consortium", kind: "influences" }],
      population: "Toll keepers, bridge wardens, and the widows' families; steady, proud.",
      connections: [],
      status: "The oldest institution on the leg; the deed outranks everyone who has read it.",
      veilAnchorTier: null,
      soulForge: null,
      gameTag: null,
      openQuestions: ["Who established the widows' deed, and what loss was it first written for?"],
    },
  }),
  region({
    slug: "brasslight",
    title: "Brasslight",
    summary:
      "The night-pilot town of Arcadia Gate, where the channel past the sandbars is run by lamplight and a family's brass stern-lamp is license, heirloom, and marriage-portion at once.",
    body: `The sandbars below Brasslight shift with every season, and the channel through them is run at night — when the water's sound tells a pilot more than daylight ever did. The running of it belongs to the pilot families, and the sign of the trade is the brass stern-lamp: license, heirloom, and marriage-portion in one object, polished nightly, never sold. Buying the lamp means marrying the family, and the families know exactly what their daughters and sons are worth to a shipping concern.

[[aegis-extraction-consortium]] has offered to dredge the bars, chart the channel, and standardize the lamps into a pilotage authority with salaried posts. The families decline annually, politely, and the channel goes on shifting in ways the charts somehow never quite capture. Barge captains pay the lamp rate without complaint; the ones who tried the bars alone are part of why [[sunken-row]] has streets.

For writers: Brasslight is knowledge as property and family as institution. The channel is only dangerous to people the families have not agreed to take through — which is a fact somebody will eventually want weaponized.`,
    meta: {
      type: "settlement",
      settlementTier: "town",
      parent: "arcadia-gate",
      biome: "sandbar reach: pilot wharves, lamp-lofts, night water",
      control: [{ faction: "aegis-extraction-consortium", kind: "influences" }],
      population: "The pilot families and their crews; everyone else is passing through.",
      connections: [],
      status: "The night channel is family property in everything but law.",
      veilAnchorTier: null,
      soulForge: null,
      gameTag: null,
      openQuestions: [],
    },
  }),
  region({
    slug: "sunken-row",
    title: "Sunken Row",
    summary:
      "The Arcadia Gate town built on the pilings of its own shipwrecks — every street is named for the barge beneath it, and the town law is that what the river takes, the Row keeps.",
    body: `Sunken Row stands on its own dead: generations of scuttled and foundered hulls driven into the mud as pilings, decked over, and built upon, until the town became an archive of every wreck the money river has made. Each street bears the name of the barge under it, the eldest streets sitting deepest, and a Row family's standing is measured by how far down their name goes.

The town's law is old, short, and seriously meant: what the river takes, the Row keeps. Salvage is the Row's trade and its religion — cargo, fittings, and the recoverable dead all come ashore here, and the Row's arbiters rule on every claim before [[aegis-extraction-consortium]]'s insurers hear a word. The companies call it organized wrecking. The Row calls it burial rights, and points out that nobody else was willing to live on top of the answer.

For writers: anything lost on this river in living memory is plausibly under somebody's kitchen in Sunken Row, and the Row knows exactly which kitchen. The town is the leg's memory, and memory has a price list.`,
    meta: {
      type: "settlement",
      settlementTier: "town",
      parent: "arcadia-gate",
      biome: "town decked over drowned hulls; salvage yards, wet cellars",
      control: [{ faction: "aegis-extraction-consortium", kind: "influences" }],
      population: "Salvage families ranked by the depth of their streets.",
      connections: [],
      status: "Standing on its own wrecks and keeping what the river takes.",
      veilAnchorTier: null,
      soulForge: null,
      gameTag: null,
      openQuestions: ["Which wreck is the Row's oldest street named for — and why does no salvage claim on that hull exist in any ledger?"],
    },
  }),
  region({
    slug: "tally-light",
    title: "Tally Light",
    summary:
      "The signal tower outpost that counts every convoy on Arcadia Gate in lamp-code — and has never once been wrong, including the time it disagreed with the manifest.",
    body: `Tally Light is a stone signal tower on a mid-river islet, crewed by a handful of keepers whose whole duty is the count: every hull, every convoy, every flag, coded upriver by lamp to [[clearinghouse]] and down to the pilot stations. The count has run unbroken for longer than [[aegis-extraction-consortium]] has held the leg, and the keepers' pride is a single sentence — the Light has never been wrong.

Once, famously, the Light's count disagreed with a sealed Aegis manifest. The investigation is still cited in the fort's clerk school, because the manifest was lying and the tower was not, and the question of who had paid for the lie ended three careers on the leg. Since then, when the numbers differ, it is the paper that gets re-counted.

For writers: the Light sees everything that moves on the money river and writes none of it down — the count lives in lamp-code and keepers' memory. People who need something unseen talk to the manifest. People who need the truth climb the tower.`,
    meta: {
      type: "site",
      settlementTier: null,
      parent: "arcadia-gate",
      biome: "signal tower on a mid-river islet",
      control: [{ faction: "aegis-extraction-consortium", kind: "holds" }],
      population: "A keeper crew on long rotation; the lamp is never dark.",
      connections: [],
      status: "Outpost; the leg's count, and the leg's conscience.",
      veilAnchorTier: null,
      soulForge: null,
      gameTag: null,
      openQuestions: [],
    },
  }),
  region({
    slug: "gullwatch",
    title: "Gullwatch",
    summary:
      "The last picket on Arcadia Gate before the war's weather — an outpost that reads the birds, because gulls follow wrecks and fleets alike.",
    body: `Gullwatch is the leg's last picket, dug into the bluffs where the river country starts giving way to [[the-peninsula]]'s war, and its doctrine is in the name: watch the birds. Gulls follow wrecks and fleets with equal enthusiasm, carrion birds shift ahead of armies, and the wading flocks abandon a marsh a day before shellfire finds it. The picket's log is half troop movements, half ornithology, and the two columns predict each other.

The post is [[aegis-extraction-consortium]] muscle with a naturalist's soul: spotting scopes, bird logs going back decades, and a standing rule that a keeper who cries a warning on bird-sign alone is never punished for being wrong — because the times the birds were right bought convoys hours nothing else could have.

For writers: Gullwatch is where the Riverlands ends and consequences begin. Whatever comes up the leg from the war — refugees, deserters, things the war made — the picket logs it first, in a margin, next to the birds.`,
    meta: {
      type: "site",
      settlementTier: null,
      parent: "arcadia-gate",
      biome: "bluff-top picket over the downriver reaches",
      control: [{ faction: "aegis-extraction-consortium", kind: "holds" }],
      population: "A picket garrison and one log of birds kept longer than any war.",
      connections: [],
      status: "Outpost; the leg's early warning, written in wings.",
      veilAnchorTier: null,
      soulForge: null,
      gameTag: null,
      openQuestions: [],
    },
  }),

  region({
    slug: "velvet-reach",
    title: "Velvet Reach",
    summary:
      "The money river's parlor: the mooring on Arcadia Gate where the wealth rests after dark — more cargo changes owners at Velvet Reach than at Clearinghouse, on paper signed at breakfast.",
    body: `Velvet Reach is where the money river relaxes, which is when it does its real business. A sheltered mooring basin on [[arcadia-gate]] grown into a town of galleried inns, supper barges, card rooms, and private landings, the Reach is where factors, captains, and buyers come off the water to eat well, drink carefully, and talk — and the leg's oldest joke is precise: more cargo changes owners at Velvet Reach than at [[clearinghouse]], on paper signed at breakfast.

The Reach's charter trade is discretion, and it is priced like everything else on the leg — a scale of rooms from the open galleries down to landings with no names, and a staff culture whose one absolute is that what is said over the water stays over the water. [[aegis-extraction-consortium]] tolerates the Reach because Aegis uses it as hard as anyone: half the Consortium's own arrangements are Reach arrangements, made where the manifest cannot hear.

For writers: every deal, courtship, betrayal, and recruitment on the money river plausibly happens here, over supper, with excellent manners. The Reach is neutral the way a card table is neutral — completely, and only while everyone remains seated.`,
    meta: {
      type: "settlement",
      settlementTier: "town",
      parent: "arcadia-gate",
      biome: "sheltered mooring basin: galleried inns, supper barges, private landings",
      control: [{ faction: "aegis-extraction-consortium", kind: "influences" }],
      population: "Innkeepers, boat crews, factors in transit; discretion is the payroll.",
      connections: [],
      status: "The leg's parlor; the paperwork happens elsewhere, later, politely.",
      veilAnchorTier: null,
      soulForge: null,
      gameTag: null,
      openQuestions: [],
    },
  }),

  // ─── Cliffgate: deeper coverage ───────────────────────────────────────────
  region({
    slug: "chainsong",
    title: "Chainsong",
    summary:
      "The Cliffgate town beneath the great lift chains, where the wind plays the iron and the whole leg forecasts weather by its pitch — when the chains go silent, evacuate.",
    body: `Chainsong sits in the gorge beneath the great lift chains of [[winchworks]], and the wind never stops playing them. Every span has its note, every weather its chord, and the town has turned listening into civic infrastructure: keepers log the pitch the way [[gaugetown]] logs needles, storm warnings travel down-leg as a change of key, and the chainwrights — Chainsong's founding trade — can hear a flawed link from the street below it.

The town's one commandment is inherited from a day its founders did not survive intact: when the chains go silent, evacuate. Silence means slack, slack means something above has let go, and the gorge is no place to be curious in. The bell tower has no bell; it has a horn, and the horn has been blown in earnest twice in the town's memory, which is why the town still has a memory.

For writers: Chainsong hears the leg's machinery the way a sailor hears a hull. If something changes in [[the-waterworks]]' oldest iron — strain, resonance, anything moving that should not — this town knows first, as music going wrong.`,
    meta: {
      type: "settlement",
      settlementTier: "town",
      parent: "cliffgate",
      biome: "gorge town beneath the lift chains; forge rows, listening posts",
      control: [{ faction: "mountain-holdfasts", kind: "influences" }],
      population: "Chainwrights, riggers, and families who sleep better with the noise.",
      connections: [],
      status: "The leg's ears; the chains are the town's weather, calendar, and alarm.",
      veilAnchorTier: null,
      soulForge: null,
      gameTag: null,
      openQuestions: [],
    },
  }),
  region({
    slug: "hanging-market",
    title: "Hanging Market",
    summary:
      "The market town bolted to Cliffgate's rock face between lift stages — shops stacked in galleries, goods moving by basket-winch, the only town a customer climbs through.",
    body: `The Hanging Market is exactly what it sounds like and still surprises everyone who sees it: a town bolted to the cliff face between two lift stages of [[cliffgate]], its shops stacked in timber galleries a dozen storeys of ladders and cat-walks deep, its goods moving by basket-winch, its streets vertical. It began as scaffolding for a repair that took a generation; the scaffolding never came down, and commerce moved in the way commerce does.

Position is everything and the Market's law is written in altitude: the guilds auction gallery levels annually, prestige climbs, and the phrase high shelf means expensive everywhere the leg's traders drink. Mountain goods coming down and river goods going up meet in the middle galleries, which is where the real bargains and the real knife-work both happen — the Market's wardens patrol with ropes and take falls more seriously than theft.

For writers: everything passing between the mountains and the river can be bought, sold, or glimpsed in the Hanging Market, and the town's vertical geography makes every chase scene, every meeting, and every escape a climbing problem.`,
    meta: {
      type: "settlement",
      settlementTier: "town",
      parent: "cliffgate",
      biome: "gallery town bolted to the cliff face; ladders, winches, stacked shops",
      control: [{ faction: "mountain-holdfasts", kind: "influences" }],
      population: "Guild traders by gallery level; porters who never touch a ladder rail.",
      connections: [],
      status: "The leg's exchange, sold by the storey.",
      veilAnchorTier: null,
      soulForge: null,
      gameTag: null,
      openQuestions: [],
    },
  }),
  region({
    slug: "thundershade",
    title: "Thundershade",
    summary:
      "The Cliffgate village in the falls' spray-shadow: permanent mist, moss farms, a noon rainbow — and the quietest people on the leg, because everyone reads lips.",
    body: `Thundershade lives where the great falls' spray-shadow never lifts: a village of permanent mist, slick stone, and green so deep it looks dyed. The falls' thunder is total and constant — speech drowns a pace away — so Thundershade talks with its hands and reads lips, and its people are famous down the whole leg for two things: the best moss, herb, and mist-garden harvests in the high country, and conversations nobody else can overhear.

The moss farms terrace the wet rock in tiers, tended by families who can tell humidity by the weight of their sleeves. At true noon, when the light comes down the gorge straight, the town gets its rainbow — a full arc off the spray, reliable as a bell — and the day is measured from it: before-arc and after-arc, which is all the clock a town this quiet needs.

For writers: Thundershade is where secrets go to be discussed in the open. Anything said hand-to-hand under the thunder is as private as speech gets in the Riverlands, and the people who need that kind of privacy have all quietly learned to sign.`,
    meta: {
      type: "settlement",
      settlementTier: "village",
      parent: "cliffgate",
      biome: "spray-shadow village: mist terraces, moss farms, wet stone",
      control: [{ faction: "mountain-holdfasts", kind: "influences" }],
      population: "Moss farmers and mist-gardeners; everyone signs, few shout.",
      connections: [],
      status: "The quiet village under the loudest water on the leg.",
      veilAnchorTier: null,
      soulForge: null,
      gameTag: null,
      openQuestions: [],
    },
  }),
  region({
    slug: "deadhaul",
    title: "Deadhaul",
    summary:
      "The abandoned haul-incline on Cliffgate, kept as a Holdfast outpost — the cars still sit mid-slope, loaded, from a day nobody in the mountains will name.",
    body: `Deadhaul is the incline that stopped. A second haul-road once climbed the gorge wall a distance up-leg from [[winchworks]] — cruder than the great lifts, counterweighted, profitable — until the day it stopped, and the [[mountain-holdfasts]] do not name that day, which for a people who curse fluently about everything is its own kind of record. The cars still sit mid-slope where they halted, loaded, weathering. Nobody has unloaded them. Nobody has asked twice.

The Holdfasts garrison the old winch house at the incline's foot as a watch post — it commands the gorge road and the river bend below, and soldiers are cheaper than answers. Post duty at Deadhaul is quiet work under an unspoken rule the garrison keeps without being ordered to: nobody climbs to the cars.

For writers: Deadhaul is the leg's held breath. Whatever happened on the incline belongs to the same drawer as [[the-waterworks]]' other silences — describe the stopped cars, the weathered loads, the garrison's careful incuriosity, and never the day itself.`,
    meta: {
      type: "site",
      settlementTier: null,
      parent: "cliffgate",
      biome: "abandoned haul-incline and winch house; stopped cars on the slope",
      control: [{ faction: "mountain-holdfasts", kind: "holds" }],
      population: "A small garrison that watches the road and not the incline.",
      connections: [],
      status: "Outpost; the incline is not discussed, which is a kind of maintenance.",
      veilAnchorTier: null,
      soulForge: null,
      gameTag: null,
      openQuestions: ["What stopped the incline? (Glimpse discipline — the garrison's incuriosity is the canon; the day itself is never written.)"],
    },
  }),
  region({
    slug: "high-sill",
    title: "High Sill",
    summary:
      "The outpost at the lip of Cliffgate's great falls — the last lock before the long level to Grand Lake, and the post that decides what goes over the top.",
    body: `High Sill holds the lip of the great falls: the last lock of the climb, where [[cliffgate]]'s stacked ascent finally levels out into the long calm water that runs toward [[grand-lake]] and the [[high-cliffs]] proper. Everything that has survived the lifts passes the Sill, and the Sill's lock-keepers — [[mountain-holdfasts]] veterans to the last — hold the least glamorous and most absolute authority on the leg: what goes over the top, and when.

The post is small, windburned, and unbribeable by long tradition, the Holdfasts having discovered generations ago that the lip of a waterfall is the one negotiating position that needs no help. The keepers' ledger of refusals is the leg's quiet legend; entries are one line each, and several end with the same three words: turned back full.

For writers: High Sill is the border between the Riverlands' climb and the high country's politics. A cargo, a fugitive, or an army moving between the two passes this one gate — and the keepers write one line about everything.`,
    meta: {
      type: "site",
      settlementTier: null,
      parent: "cliffgate",
      biome: "lock post at the falls' lip; wind, spray, long water beyond",
      control: [{ faction: "mountain-holdfasts", kind: "holds" }],
      population: "Lock-keepers on the wind; a post that promotes patience.",
      connections: [],
      status: "Outpost; the top of the climb and the last word on it.",
      veilAnchorTier: null,
      soulForge: null,
      gameTag: null,
      openQuestions: [],
    },
  }),

  region({
    slug: "anvil-watch",
    title: "Anvil Watch",
    summary:
      "The Holdfast outpost on the anvil-shaped crag over Cliffgate's gorge road — it counts what walks, not what floats, and its road tally does not always match the towns' arrivals.",
    body: `Anvil Watch sits on the anvil-shaped crag commanding the gorge road, and it is the [[cliffgate]] post that faces away from the river: while [[high-sill]] and [[deadhaul]] mind the water and the works, the Watch counts what walks. Every traveler, drover, column, and cart on the land road up the gorge passes under the crag, and the [[mountain-holdfasts]] keepers tally them with the same patience the leg gives everything — heads up, heads down, and the signal mirrors flashing the count to [[winchworks]] by mountain code.

The post's quiet fame is a discrepancy it refuses to editorialize about: the road tally and the towns' arrival books do not always agree. Most seasons the difference is drovers' arithmetic and short cuts. Some seasons it is not, and those seasons the Watch's log simply carries the two columns side by side, unreconciled, which among Holdfast record-keepers is as close to an alarm as dignity permits.

For writers: the Watch is the leg's land-side conscience. Anyone avoiding the water — deserters, smugglers, things that do not care for boats — walks through its count, and the unreconciled seasons are a drawer of hooks nobody has opened yet.`,
    meta: {
      type: "site",
      settlementTier: null,
      parent: "cliffgate",
      biome: "dry-stone watch on the anvil crag; signal mirrors over the gorge road",
      control: [{ faction: "mountain-holdfasts", kind: "holds" }],
      population: "Keepers on mountain rotation; the mirrors are polished daily.",
      connections: [],
      status: "Outpost; the leg's land-side count, carried in two columns.",
      veilAnchorTier: null,
      soulForge: null,
      gameTag: null,
      openQuestions: ["In the unreconciled seasons, which column runs long — the road's, or the towns'? (The log keeps both; canon keeps quiet.)"],
    },
  }),

  // ─── Riftgate: deeper coverage ────────────────────────────────────────────
  region({
    slug: "mourners-ferry",
    title: "Mourner's Ferry",
    summary:
      "The Riftgate town where funeral barges queue for Charnel Lock — the ferry bell tolls once per passenger, and the town can count a rich man's death by ear.",
    body: `Mourner's Ferry is where the dead wait their turn. Funeral barges bound down [[riftgate]] queue here for passage of [[charnel-lock]], and the town grew up around the waiting: mooring rows for the biers, hostels for the bereaved, chandlers of black crepe and lamp-oil, and the professional mourners — a licensed trade here, hired by the crossing, graded by repertoire. The ferry bell tolls once per passenger carried, pauper or prince alike, and the town has learned to read the river by ear: a long slow peal means wealth coming down, and the shops open early.

The [[bone-market-families]] keep a courteous presence and take no toll in the town itself — the Ferry is where their clients grieve, and the Families understand presentation. What they do keep is the queue's order, and the order is never sold. Jumping the line at Mourner's Ferry is the one vulgarity the dead trade does not forgive.

For writers: everyone who has lost anyone to the Rift country passes through here, talkative with grief. The town hears every story a death leaves behind — which makes it the best listening post on the leg, and the mourners know exactly what their memories are worth.`,
    meta: {
      type: "settlement",
      settlementTier: "town",
      parent: "riftgate",
      biome: "queue town of mooring rows, bier wharves, and mourning trades",
      control: [{ faction: "bone-market-families", kind: "influences" }],
      population: "Mourners, wake-chandlers, hostel keepers; the bereaved, passing through.",
      connections: [],
      status: "The queue is sacred; the bell is the town's newspaper.",
      veilAnchorTier: null,
      soulForge: null,
      gameTag: null,
      openQuestions: [],
    },
  }),
  region({
    slug: "redletter",
    title: "Redletter",
    summary:
      "The scrivener town of Riftgate where the dead trade's contracts are inked in red-leaf tannin — a thing signed in Redletter is binding beyond appeal, and beyond the grave.",
    body: `Redletter is where the dead trade writes things down. The town's scriveners ink contracts in red-leaf tannin drawn from the same water that stains the leg, and signed in Redletter is a phrase with weight from [[heartland]] to the [[grand-rift]]: it means binding beyond appeal, witnessed by the [[bone-market-families]], and — this is the part outsiders learn slowly — enforceable past the signatories' deaths. Redletter paper does not expire with you. The debts of the dead are collected, the bequests of the dead are delivered, and the town's archive holds instruments still running on signatories buried before their creditors were born.

The scriveners are a guild older than the Families' hold on the leg, punctilious about their independence, and the Families honor it — a contract house that could be leaned on would be worthless to lean on. The archive's deep stacks are the closest thing the dead trade has to a temple, and its reading rules are stricter than most temples manage.

For writers: half the leg's plots are filed in Redletter already, waiting. An heir, a debt, a promise inked before the war — the town is a drawer of loaded instruments, and pulling one out is a legitimate way to start anything.`,
    meta: {
      type: "settlement",
      settlementTier: "town",
      parent: "riftgate",
      biome: "scrivener town: ink-works, contract houses, the deep archive",
      control: [{ faction: "bone-market-families", kind: "influences" }],
      population: "Scriveners, archivists, ink-makers; witnesses by appointment.",
      connections: [],
      status: "The dead trade's paper lives here, and the paper outlives everyone.",
      veilAnchorTier: null,
      soulForge: null,
      gameTag: null,
      openQuestions: ["What is the oldest instrument in the archive still technically in force — and who is still paying it?"],
    },
  }),
  region({
    slug: "candlereach",
    title: "Candlereach",
    summary:
      "The night stretch of Riftgate lit by grave-candles on shrine-buoys — the village sells the candles and tends the lights, and a dark barge on the Reach is either empty or lying.",
    body: `Candlereach tends the leg's darkest water: a long, treed-in stretch of [[riftgate]] that daylight barely enters, navigated by the town's shrine-buoys — floating lanterns burning grave-candles, one for each of the Reach's own dead, renewed nightly by the candle-wards in their flat black skiffs. Passage barges light candles of their own by custom, one per soul aboard, living or otherwise; the wards count lights as hulls go by, and the arithmetic is the Reach's whole security system. A dark barge on Candlereach is either empty or lying, and the wards signal ahead accordingly.

The village makes the candles — tallow, bone-oil, and a temper of river tannin that burns steady in wet air — and holds the candle-right as its charter trade under the [[bone-market-families]]' patient patronage. Ward duty is hereditary, quiet, and armed.

For writers: Candlereach is the leg's honesty test. Every smuggler's problem on this river eventually becomes a candle problem, and the wards' nightly count is a record of exactly who was pretending to be nobody, and when.`,
    meta: {
      type: "settlement",
      settlementTier: "village",
      parent: "riftgate",
      biome: "dark treed river-reach; shrine-buoys, candle-works, ward skiffs",
      control: [{ faction: "bone-market-families", kind: "influences" }],
      population: "Candle-makers and hereditary wards; visitors keep their lights lit.",
      connections: [],
      status: "The lit road through the dark water; the count is always running.",
      veilAnchorTier: null,
      soulForge: null,
      gameTag: null,
      openQuestions: [],
    },
  }),
  region({
    slug: "quiet-boom",
    title: "Quiet Boom",
    summary:
      "The Bone Market's chain boom across Riftgate — lowered without a sound on Waterworks counterweights, raised for everyone, and dropped twice in a century.",
    body: `The Quiet Boom is the [[bone-market-families]]' answer to a question nobody asks out loud: what happens if the river needs closing. A great chain boom spans [[riftgate]] here, run on [[the-waterworks]]' counterweights sunk in both banks, and its single famous property is in the name — it lowers without a sound. No bell, no winch-scream, no warning. The water is open, and then it is not.

The Families keep the Boom raised for everyone, which is the point: the dead trade's river runs on the certainty of passage, and the Boom exists so that certainty stays a courtesy rather than a law of nature. It has been lowered in earnest twice in a century. Both occasions are known, neither is discussed, and the discussions that did not happen are why it has not been needed since.

For writers: the Boom is the politest threat in the Riverlands — infrastructure as etiquette. The garrison is small, formal, and mostly ceremonial, because the weapon is the fact of the thing, not the men beside it.`,
    meta: {
      type: "site",
      settlementTier: null,
      parent: "riftgate",
      biome: "chain boom and counterweight houses spanning the dark water",
      control: [{ faction: "bone-market-families", kind: "holds" }],
      population: "A small formal garrison; the machinery is the argument.",
      connections: [],
      status: "Outpost; raised for everyone, and that is the message.",
      veilAnchorTier: null,
      soulForge: null,
      gameTag: null,
      openQuestions: [],
    },
  }),
  region({
    slug: "bonefire-picket",
    title: "Bonefire Picket",
    summary:
      "The beacon outpost on upper Riftgate whose white flame burns bone-oil rendered from the trade's scrap — the old word for bonfire, kept honest.",
    body: `Bonefire Picket holds the high bend where [[riftgate]] starts becoming [[grand-rift]] country in earnest, and its beacon is the leg's last fixed light: a rendered bone-oil flame that burns white, visible far down the tannin water, fed by the dead trade's own scrap by an arrangement with [[charnel-lock]] that both parties describe as tidy. The picket's keepers will tell anyone who asks that bonfire was bone-fire before it was anything else, and that they are merely keeping the word honest.

The Picket is a working military post under the ceremony — the [[bone-market-families]]' upstream tripwire, watching what comes down out of the Rift country before the river's towns have to meet it. Its log divides arrivals into three columns that say everything about the leg: trade, grief, and other. The third column is short, and the keepers underline it.

For writers: the Picket is where the Riverlands' politest leg faces its wildest border. Whatever the Rift sends down — salvage crews, survivors, cargo that should have stayed buried — the white flame sees it first.`,
    meta: {
      type: "site",
      settlementTier: null,
      parent: "riftgate",
      biome: "beacon bluff at the wild upstream bend; white flame over dark water",
      control: [{ faction: "bone-market-families", kind: "holds" }],
      population: "Beacon keepers and a watchful garrison; the flame is never let die.",
      connections: [],
      status: "Outpost; the leg's upstream tripwire, burning the trade's own scrap.",
      veilAnchorTier: null,
      soulForge: null,
      gameTag: null,
      openQuestions: ["What entries fill the log's third column — and which one made the keepers start underlining?"],
    },
  }),

  // ─── Sandgate: deeper coverage ────────────────────────────────────────────
  region({
    slug: "honest-well",
    title: "Honest Well",
    summary:
      "The one well on Sandgate never salted, poisoned, or claimed in the corridor's whole history — neutral ground stricter than Heartland, where feuds pause at the wellhead or end at a rope.",
    body: `The Honest Well is the corridor's one absolute: a deep sweet-water well that has never been salted, poisoned, fouled, or claimed by any clan, company, or crown in the whole remembered history of [[sandgate]]. Everything else in the dry country has been fought over. The Well has not, because every people who ever used it understood the same arithmetic — a corridor with one honest well and a corridor with none are different worlds, and nobody wins in the second one.

The village around it enforces the oldest law on the leg: feuds pause at the wellhead. Blood enemies water their animals in turn, in silence, and resume their business over the horizon. The [[desert-nomad-compact]] hangs well-breakers, and so — this is the point — does everyone else, including the well-breaker's own kin, because the alternative is unthinkable in the exact, literal sense.

For writers: the Honest Well is the one place every party in the corridor can be written into a room together — smuggler and lawman, feuding clans, the hunter and the hunted, all watering in turn. Neutral ground this absolute is a stage, and the desert knows it.`,
    meta: {
      type: "settlement",
      settlementTier: "village",
      parent: "sandgate",
      biome: "wellhead village: sweet water, watering rings, truce ground",
      control: [{ faction: "desert-nomad-compact", kind: "influences" }],
      population: "Well-keepers and truce wardens; everyone else is watering.",
      connections: [],
      status: "The corridor's one absolute; the law is older than every claimant.",
      veilAnchorTier: null,
      soulForge: null,
      gameTag: null,
      openQuestions: [],
    },
  }),
  region({
    slug: "mirrorwater",
    title: "Mirrorwater",
    summary:
      "The still oxbow village on Sandgate whose dawn flash is visible from the ridge line — caravans navigate by it, so the village's law keeps the water unbroken until the sun clears the dunes.",
    body: `Mirrorwater holds a dead-still oxbow of [[sandgate]]'s river, and at dawn, when the light comes flat across the dunes, the water flashes — a sheet of sun visible from the far ridge line, the corridor's oldest fixed navigation mark. Caravans coming out of the deep desert steer for the flash the way sailors steer for a light, and generations of them have lived because the water was where the water is.

So the village's founding law is about stillness: from first grey to full sun, nothing breaks the water. No boats, no washing, no nets, no stones — the oxbow lies untouched until the flash has done its work, and Mirrorwater's mornings are conducted at a hush that visitors mistake for piety. It is navigation. The village also quietly maintains the flash's honesty the hard way: dredging the oxbow's stillness, cutting the reeds that would dull it, and treating a false flash lit anywhere on the ridge as the corridor treats well-breaking.

For writers: an entire village organized around being visible and truthful from far away is a place with strong opinions about deception. Mirrorwater's people make natural witnesses, terrible accomplices, and one very specific kind of victim — whoever finally has a reason to make the flash lie.`,
    meta: {
      type: "settlement",
      settlementTier: "village",
      parent: "sandgate",
      biome: "still oxbow and reed margins; dawn-flash water, hushed mornings",
      control: [{ faction: "desert-nomad-compact", kind: "influences" }],
      population: "Reed-cutters, dredgers, and keepers of the morning stillness.",
      connections: [],
      status: "The corridor's landmark; the law is stillness, and the stillness is navigation.",
      veilAnchorTier: null,
      soulForge: null,
      gameTag: null,
      openQuestions: [],
    },
  }),
  region({
    slug: "saltsong",
    title: "Saltsong",
    summary:
      "The evaporation-pan town of Sandgate whose tuned pans crack and sing at dusk — salt is the corridor's coin, and a keeper can hear a bad batch.",
    body: `Saltsong makes the corridor's money. Its terraced evaporation pans step down the bank of [[sandgate]]'s river, and at dusk, when the day's heat lets go, the crusting salt cracks — and sings. The pans are tuned: built to thicknesses and spans the pan-keepers adjust by ear, so that a clean batch rings true and a fouled one sounds flat, and an experienced keeper walking the terraces at dusk can grade the whole day's harvest without bending down. Salt is currency from here to the deep interior, and Saltsong's stamp on a block is what makes it spendable.

The [[desert-nomad-compact]] guards the town's independence as carefully as its own camps, because the caravan economy runs on Saltsong's honesty — debased salt would poison the corridor's trust faster than any well-breaker. The keepers' guild takes apprentices by ear-test, and the town's evenings, when the terraces ring, are the corridor's one reliable music.

For writers: Saltsong is a mint that sings. Counterfeiting, debasement, a bad batch that rang true — any threat to the stamp is a threat to the whole interior's economy, and the Compact would ride for it.`,
    meta: {
      type: "settlement",
      settlementTier: "town",
      parent: "sandgate",
      biome: "terraced salt pans stepping to the river; dusk-ring evenings",
      control: [{ faction: "desert-nomad-compact", kind: "influences" }],
      population: "Pan-keepers, stampers, and haulers; apprenticeship is by ear.",
      connections: [],
      status: "The corridor's mint; the stamp is trust made mineral.",
      veilAnchorTier: null,
      soulForge: null,
      gameTag: null,
      openQuestions: [],
    },
  }),
  region({
    slug: "dry-bell",
    title: "Dry Bell",
    summary:
      "The tower outpost on Sandgate that rings for overdue caravans — one strike per missing day, per caravan, out over the dunes. The worst sound in the corridor is the bell finding a rhythm.",
    body: `Dry Bell is a watchtower on the corridor's edge with one duty and one voice. Every caravan that files a crossing with [[lastwater]] is logged at the Bell, and when a caravan runs overdue the bell begins: one strike at dusk per missing day, per caravan, rolling out over the dunes where sound carries impossibly far. One late caravan is a slow, patient tolling. A bad season is arithmetic. The corridor's people can read the evening count from their camps, and the worst sound in the dry country is the bell finding a rhythm.

The strikes are not mourning — they are a summons. Bell-count is the [[desert-nomad-compact]]'s standing authority to raise riders: so many days, so many spears, the response scaling with the count by a formula every clan knows. The tower's keepers are wiry, unsentimental, and profoundly respected, because their log decides when the desert goes looking for its own.

For writers: the Bell turns absence into drama on a schedule. A caravan the player rode with, a cargo somebody swore was safe, a count that stops abruptly one evening — the tower is a narrative engine with a rope.`,
    meta: {
      type: "site",
      settlementTier: null,
      parent: "sandgate",
      biome: "bell tower on the dune line; the log, the rope, the count",
      control: [{ faction: "desert-nomad-compact", kind: "holds" }],
      population: "Bell-keepers and their log; riders answer the count.",
      connections: [],
      status: "Outpost; the corridor's conscience, struck nightly when owed.",
      veilAnchorTier: null,
      soulForge: null,
      gameTag: null,
      openQuestions: [],
    },
  }),
  region({
    slug: "vultures-patience",
    title: "Vulture's Patience",
    summary:
      "The last ridge watch over the deep desert on Sandgate — named for its doctrine: watch, wait, count what the sky does. The birds are honest; everything else out there lies.",
    body: `Vulture's Patience is the corridor's last eye: a dry-stone watch post on the final ridge before [[the-desert]] becomes the interior's business, named with the doctrine it teaches. The deep desert kills the confident and rewards nothing, so the post does not patrol, does not pursue, and does not hurry. It watches, waits, and counts what the sky does — dust columns, heat-shimmer that moves wrong, and above all the birds, because a wheeling column of vultures is the interior's one honest report of an event.

The [[desert-nomad-compact]] staffs it with its oldest hands, on the theory that patience is the last skill a rider learns and the first the ridge requires. The post's log pairs with [[dry-bell]]'s: the Bell counts who has not come back, the Patience counts what the sky says about why, and between them the corridor knows most of what the desert will admit to.

For writers: the post sees the interior's disasters as weather — remote, legible, and too far to help. What the keepers do with what they see, and what they choose not to ride toward, is the station's whole moral territory.`,
    meta: {
      type: "site",
      settlementTier: null,
      parent: "sandgate",
      biome: "dry-stone watch on the last ridge; sky-log, heat, patience",
      control: [{ faction: "desert-nomad-compact", kind: "holds" }],
      population: "Old hands on long watches; the young are sent elsewhere.",
      connections: [],
      status: "Outpost; the corridor's last eye, and the desert's first witness.",
      veilAnchorTier: null,
      soulForge: null,
      gameTag: null,
      openQuestions: [],
    },
  }),

  // ─── Stormgate: deeper coverage ───────────────────────────────────────────
  region({
    slug: "glasscalm",
    title: "Glasscalm",
    summary:
      "The Stormgate village on the flattest water in the world — crews cross it at a whisper, and its boatmen say the calm is not the absence of current but attention.",
    body: `Glasscalm sits on the reach where [[stormgate]]'s engineered stillness is most complete: water so flat it takes the sky like a plate, unrippled by wind that moves the trees on both banks. Crews cross it at a whisper. Nobody ordered that; it simply happens to people, the way lowered voices happen in certain buildings, and the village has long since stopped pretending it is superstition and started calling it manners.

The boatmen's saying is the town's whole philosophy: the calm is not the absence of current but attention. Below the plate-still surface the river is moving at full freight strength — the pylons hold the surface, not the water — and Glasscalm's pilots make their living on the difference, reading a current they can never see. Their private word for the reach translates roughly as held breath. [[meridian-arcane-institute]] surveyors ask the pilots questions twice a season and get answers of carefully graded uselessness.

For writers: Glasscalm is the held river at its most beautiful and least reassuring. Reflections here are canonically excellent — of the sky, the banks, and whatever a scene needs a character to notice standing behind them.`,
    meta: {
      type: "settlement",
      settlementTier: "village",
      parent: "stormgate",
      biome: "plate-still reach; whisper crossings, mirror water over hard current",
      control: [{ faction: "meridian-arcane-institute", kind: "influences" }],
      population: "Pilots who read invisible water; ferrymen with quiet voices.",
      connections: [],
      status: "The stillest water on the leg, and nobody relaxed about it.",
      veilAnchorTier: null,
      soulForge: null,
      gameTag: null,
      openQuestions: [],
    },
  }),
  region({
    slug: "needles-eye",
    title: "Needle's Eye",
    summary:
      "The Stormgate town at the narrowest pylon pair, where every hull on the leg must thread — the pilots' guild tattoos one needle per hundred threadings, and the elders' arms are unreadable.",
    body: `Needle's Eye is the pinch: the narrowest pylon pair on [[stormgate]], where the stabilization corridor closes to a gap that every hull on the leg must thread, in turn, with the current live underneath and the pylons' field pressing the water glass-flat exactly where a pilot most wants to read it. Threading the Eye is the leg's licensing act and its sport. The pilots' guild tattoos one needle on a member's forearm per hundred threadings, and the elders' arms are solid ink past the elbow — unreadable, which among pilots is the entire point of seniority.

The town stacks on both banks with the guild hall astride the narrowest water, and keeps a dial wall — sister to [[gaugetown]]'s and feuding with it cheerfully about calibration — because the pinch is where the corridor's numbers matter most. When the Eye's needles jump, hulls wait, whatever [[regulator-station]]'s official figures say, and the waiting has always turned out to be right or lucky, which locally are the same word.

For writers: everything on the leg funnels through one gap with a queue, a guild, and a grudge about whose instruments to trust. The Eye is a chokepoint in every sense a story can use.`,
    meta: {
      type: "settlement",
      settlementTier: "town",
      parent: "stormgate",
      biome: "twin-bank town at the narrowest pylon pair; guild hall over the gap",
      control: [{ faction: "meridian-arcane-institute", kind: "influences" }],
      population: "The threading guild and its queue; ink measures seniority.",
      connections: [],
      status: "The pinch; the leg's license, sport, and second opinion.",
      veilAnchorTier: null,
      soulForge: null,
      gameTag: null,
      openQuestions: [],
    },
  }),
  region({
    slug: "farflicker",
    title: "Farflicker",
    summary:
      "The last settlement on Stormgate, where the lamps stutter in patterns off the Wasteland's interference — children learn flicker-rhymes, Meridian records them, and some of them scan.",
    body: `Farflicker is the end of the ordinary world. The last village on [[stormgate]] before the corridor is only pylons and then only [[magic-torn-wasteland]], it lives inside the interference: lamps here do not burn steady but stutter — in patterns, in sequences, in what a visitor eventually stops calling coincidence. The townsfolk treat it as weather. Children learn flicker-rhymes the way children elsewhere learn skipping songs, chanted to the kitchen lamp's rhythm, and the rhymes change season to season as the patterns do.

[[meridian-arcane-institute]] keeps a recording house in Farflicker and pays a standing fee for new rhymes, which the village finds hilarious and profitable. The Institute's interest is not folklore. Some of the rhymes scan — against instrument logs, against storm cycles, against things the researchers do not name in town — and the recording house's shutters are iron.

For writers: Farflicker is where the Wasteland starts talking and nobody can prove it. Keep the village cheerful — that is the horror working correctly. The rhymes may foreshadow; per glimpse discipline they must never be decoded on the page.`,
    meta: {
      type: "settlement",
      settlementTier: "village",
      parent: "stormgate",
      biome: "edge village under stuttering lamplight; the recording house, iron shutters",
      control: [{ faction: "meridian-arcane-institute", kind: "influences" }],
      population: "Corridor families who treat interference as weather; researchers who do not.",
      connections: [],
      status: "The last ordinary lights on the leg, and they flicker in patterns.",
      veilAnchorTier: null,
      soulForge: null,
      gameTag: null,
      openQuestions: ["Which flicker-rhymes scan against the instrument logs — and against what? (Glimpse discipline: never decoded on the page.)"],
    },
  }),
  region({
    slug: "breakline",
    title: "Breakline",
    summary:
      "The outpost where Stormgate's stabilization ends — sandbagged instruments at the corridor's true edge. The line has moved twice, both times inward, and nobody says retreat.",
    body: `Breakline is where the held river lets go. The last stabilization hardware of [[stormgate]] stands here, and past it the water — and the world — resumes [[magic-torn-wasteland]]'s opinion of how things should behave. The outpost is sandbags, instrument huts, and a garrison of [[iron-saints-pmc]] professionals on [[meridian-arcane-institute]]'s invoice, rotated short because the edge wears people in ways the medical forms have learned to ask about.

The line has moved twice since the corridor was driven. Both times inward. The official reports say recalibrated perimeter, the garrison says nothing, and the abandoned pylon footings out past the sandbags say what footings say. Nobody at Breakline uses the word retreat, and the discipline of not using it is observed with a rigor that tells visitors everything.

For writers: Breakline is the war the leg is actually fighting — not against a faction but against geography's slow opinion. Two moves inward is a trend with a destination, and every scene here stands on that arithmetic without saying it.`,
    meta: {
      type: "site",
      settlementTier: null,
      parent: "stormgate",
      biome: "sandbagged instrument line at the stabilization edge; footings beyond",
      control: [
        { faction: "meridian-arcane-institute", kind: "holds" },
        { faction: "iron-saints-pmc", kind: "influences" },
      ],
      population: "Short-rotation garrison and instrument crews; the forms ask new questions.",
      connections: [],
      status: "Outpost; the corridor's true edge, twice recalibrated inward.",
      veilAnchorTier: null,
      soulForge: null,
      gameTag: null,
      openQuestions: [],
    },
  }),
  region({
    slug: "echo-fence",
    title: "Echo Fence",
    summary:
      "The listening outpost on Stormgate: a fence of resonant posts facing the Wasteland that hums back what the storm country says. Transcripts classified; keepers don't discuss dreams.",
    body: `Echo Fence is [[meridian-arcane-institute]] listening. A line of resonant posts runs along the corridor's flank facing open [[magic-torn-wasteland]] country — tuned columns that do not transmit anything, only receive, and hum. What they hum is, officially, atmospheric and seismic data relevant to corridor maintenance. What the keepers log, in the fence's shielded recording bunker, goes upriver to [[regulator-station]] under seal, and the transcripts hold a classification tier the Station's own researchers mostly do not hold.

The posting is quiet, well paid, and strange in a way the Institute manages with unusual delicacy: keepers walk the wire in earplugs by regulation, rotations are short, the exit interview asks about sleep, and by firm unwritten custom nobody at Echo Fence discusses dreams. The keepers keep the custom without being told twice, which is the part a visitor finds hardest to like.

For writers: the Fence hears the Wasteland's side of a conversation nobody admits is one. Per glimpse discipline the transcripts are never shown and never decoded — write the seals, the earplugs, the exit interviews, and the custom about dreams, and let the reader do the arithmetic.`,
    meta: {
      type: "site",
      settlementTier: null,
      parent: "stormgate",
      biome: "resonant post line and shielded bunker facing the open Wasteland",
      control: [
        { faction: "meridian-arcane-institute", kind: "holds" },
        { faction: "iron-saints-pmc", kind: "influences" },
      ],
      population: "Keepers on short rotation; earplugs on the wire, by regulation.",
      connections: [],
      status: "Outpost; the Institute's ear, sealed to its own researchers.",
      veilAnchorTier: null,
      soulForge: null,
      gameTag: null,
      openQuestions: ["What tier reads the Fence's transcripts — and is it above or beside the tier that reads the survey camp's? (Glimpse discipline: never answered.)"],
    },
  }),

  region({
    slug: "last-mooring",
    title: "Last Mooring",
    summary:
      "The hardened storm-refuge basin on upper Stormgate: when the corridor calls a weather hold, every hull runs for Last Mooring and chains to Waterworks bollards that have never let go.",
    body: `Last Mooring is the upper leg's insurance policy: a hardened refuge basin cut into [[stormgate]]'s bank behind a storm wall, ringed with mooring bollards of [[the-waterworks]]' unmistakable vintage — older than the pylons by an age nobody measures, and the reason the basin is where it is. When [[regulator-station]] calls a weather hold, every hull on the upper leg runs for the Mooring, chains on, and the crews go below until the corridor says otherwise. The bollards have never let go. In anomaly weather that has peeled roofs and reversed rain, that sentence is the basin's entire reputation and the [[iron-saints-pmc]] harbormaster's favorite thing to say slowly.

Between holds the Mooring is a bored, orderly outpost of chain lockers, a bunkhouse, and the hold-log — which is a stranger document than the garrison discusses. Hulls chain on in a hold; the harbormaster walks the wall and counts them; and once in a long while the count includes a hull nobody logged onto the leg, riding out the weather like everything else, gone by morning. The log notes it. Nobody asks. The corridor's advice about the held river extends to its guests.

For writers: the Mooring is where the leg's crews are trapped together while the world goes wrong outside — a bottle episode with chains. And the uninvited hulls belong to the same drawer as every other Stormgate silence: note them, never explain them.`,
    meta: {
      type: "site",
      settlementTier: null,
      parent: "stormgate",
      biome: "hardened refuge basin: storm wall, ancient bollards, chain lockers",
      control: [
        { faction: "meridian-arcane-institute", kind: "holds" },
        { faction: "iron-saints-pmc", kind: "influences" },
      ],
      population: "A harbormaster's crew; everyone on the leg, in a hold.",
      connections: [],
      status: "Outpost; the bollards have never let go, and the log keeps its guests.",
      veilAnchorTier: null,
      soulForge: null,
      gameTag: null,
      openQuestions: ["Whose hulls ride out holds unlogged, and where do they go by morning? (Glimpse discipline — noted, never explained.)"],
    },
  }),

  // ─── The Three Charters ───────────────────────────────────────────────────
  region({
    slug: "first-charter",
    title: "First Charter",
    summary:
      "A bankside parcel on the safe floodplain — the first of the three escrowed land charters, and the first ground a player can ever own outright.",
    body: `The First Charter is a stretch of good bank on the safe floodplain within a day of [[heartland]]: river frontage, dry ground behind a low rise, and a deed older than the Standstill sitting in courthouse escrow with the other two. Like all three charters it predates every claim on the river — the [[${NATION_MANAGEMENT_PERSISTED_SLUG}]] shelf's oldest advice is that the best endgame material is paid for early, in charters and old claims, and these are those.

The ground itself is modest on purpose: a homestead's worth of floodplain, needing draining before building the way all riverland ground does — the first lever of [[the-waterworks]] a new landholder ever pulls. What it becomes is the holder's decision entirely.

For writers: the charters unlock in campaign order and the Judge's office has never released one. Whoever changes that will have done something the Standstill's whole generation never managed.`,
    meta: {
      type: "site",
      settlementTier: null,
      parent: "riverlands",
      biome: "bankside floodplain parcel: river frontage, wet meadow, a dry rise",
      control: [],
      population: "None. Escrowed ground; the reeds hold it.",
      connections: [],
      status: "In courthouse escrow at Heartland; release is campaign-gated.",
      veilAnchorTier: null,
      soulForge: null,
      gameTag: null,
      openQuestions: ["What the holder builds here is the holder's alone; the deed constrains nothing."],
    },
  }),
  region({
    slug: "second-charter",
    title: "Second Charter",
    summary:
      "A confluence island under Heartland's walls with wharf rights attached — the second escrowed charter, and the one every merchant in the city has priced.",
    body: `The Second Charter is the island: a confluence eyot within sight of [[heartland]]'s walls, with the one thing no other private ground on the river carries — wharf rights, written into the deed in language older than the city's own charter. Whoever holds it may land, warehouse, and trade in Heartland's water without leasing an inch from any faction wharf, which is why every merchant house in the city has quietly priced it and why the Judge's office has quietly declined every offer.

The island floods in the old pattern and will need real works — levees, drainage, pilings — before it holds serious building: [[the-waterworks]] at commercial scale, and the natural second lesson after the [[first-charter]]'s homestead ground.

For writers: the island is the economy tutorial made of mud and law. Its wharf rights touch the Standstill's balance directly — five factions have wharves, and this deed makes a sixth.`,
    meta: {
      type: "site",
      settlementTier: null,
      parent: "heartland",
      biome: "confluence island: flood meadow, old pilings, deep water on both sides",
      control: [],
      population: "None. Herons, and surveyors who keep being noticed.",
      connections: [],
      status: "In courthouse escrow at Heartland; release is campaign-gated.",
      veilAnchorTier: null,
      soulForge: null,
      gameTag: null,
      openQuestions: ["The deed's wharf rights make its holder a sixth wharf in a five-wharf city. Which faction objects first?"],
    },
  }),
  region({
    slug: "third-charter",
    title: "Third Charter",
    summary:
      "A ruined watch-fort on Riftgate with a wall worth keeping and a flooded ditch that still answers — the third escrowed charter, with the Bone Market for neighbors.",
    body: `The Third Charter is the serious one: a ruined watch-fort on [[riftgate]], upstream among the tannin water and the old trees, with a wall worth keeping, a collapsed gatehouse, and a flooded defensive ditch whose sluices — [[the-waterworks]], of course — still answer levers that have not been pulled in living memory. The deed in courthouse escrow describes it only by its charter number. Nobody remembers the fort's own name, and the courthouse takes the view that whoever finally holds the ground can answer that themselves.

Claiming it is a diplomatic act before it is a construction project. The [[bone-market-families]] hold the leg, have never moved on the ruin, and have opinions about neighbors — measured, courteous opinions, delivered with interest. A holder here learns garrison work, wall work, and [[outpost-and-city-management]] in full, with the politest pressure on any river as the tutor.

For writers: the ruin is the defense lesson and the endgame of the charter ladder. Do not name the old fort; the player will.`,
    meta: {
      type: "site",
      settlementTier: null,
      parent: "riftgate",
      biome: "ruined watch-fort on dark water: standing wall, drowned ditch, old trees",
      control: [],
      population: "None. The rooks keep the wall.",
      connections: [],
      status: "In courthouse escrow at Heartland; release is campaign-gated.",
      veilAnchorTier: null,
      soulForge: null,
      gameTag: null,
      openQuestions: ["The fort's original name is deliberately unrecorded — the holder names it. Do not fill this in."],
    },
  }),

  // ─── The First Weir and the Outfall ───────────────────────────────────────
  region({
    slug: "first-weir",
    title: "First Weir",
    summary:
      "The drowned works beneath Heartland: galleries and sluice-gates that still regulate the whole watershed, entered from the city's oldest cellars and flooded past the first landing.",
    body: `Beneath [[heartland]], older than every charter and every wall above it, lies the First Weir: a complex of galleries, sluice-gates, and pump halls that still regulates the watershed — the reason five rivers braid politely at this exact place, the reason the city's ground stays dry in the middle of a floodplain, and the reason nobody who understands either of those facts sleeps entirely well. Nobody built it in living memory. Nobody maintains it. It works anyway.

The way in is an undercroft stair from the city's oldest cellars, and past the first landing the works are drowned. The old pumps answer, though — [[the-waterworks]]' deepest instance — and the works can be reclaimed the only way the machinery permits: chamber by chamber, pumped dry wing by wing, each drained gallery opening the next descent. What the pumping costs and what each wing holds is future design; what canon fixes is the shape — progress down the Weir is measured in water moved, not doors unlocked.

The city profits from every wing that dries. Vaults, cellars, dock works, and dry storage come online above as the water goes down, which means the deepest dungeon in the region pays out civic real estate as it is cleared — and means the courthouse, the factions, and every merchant in Heartland have opinions about who does the clearing.

The works run deeper than any survey. What is at the true bottom — and what the Weir is for, beyond the obvious, and why the obvious has been enough for this long — stays where the region keeps all its oldest questions. The [[the-outfall]] is the same system's far end, and the two ends have never been walked between.

For writers: glimpse discipline binds the Weir absolutely. It may rhyme with why the Riverlands are the one country still alive in a draining world; it must never be confirmed as the answer to that or to anything. Write the machinery working. Never write it understood.`,
    meta: {
      type: "site",
      settlementTier: null,
      parent: "heartland",
      biome: "drowned galleries, sluice halls, and pump rooms beneath the city",
      control: [],
      population: "None living. The Watch keeps the stair's key and does not use it.",
      connections: [
        { to: "heartland", by: "undercroft stair", notes: "The one known way in, from the city's oldest cellars; flooded past the first landing." },
      ],
      status: "Flooded; the pumps answer. The region's endgame ground, unclaimed by any power.",
      veilAnchorTier: null,
      soulForge: null,
      gameTag: null,
      openQuestions: [
        "What is at the true bottom of the Weir? (Glimpse discipline — describe, never answer.)",
        "Who built the works, and why do they still answer? Canon never says.",
      ],
    },
  }),
  region({
    slug: "the-outfall",
    title: "The Outfall",
    summary:
      "The remote station where the watershed's overflow drains into wild fen — the far end of the Weir's system, and the first Veil Anchor anyone can reach. Meridian got there first, quietly.",
    body: `Out past the last levee, where the watershed's overflow drains away into wild fen that no leg claims and no road serves, stands the Outfall: the far end of the same ancient system as the [[first-weir]], a station of overflow channels and dead machinery — and, at its heart, an Anchor. Tier I: ancient structure, low-threat Crossings, the introductory door in the whole [[the-veil]] network — [[veil-anchors]] holds the law of what that tier promises.

It stands remote because remoteness is the point, in-world and out. Anchors invite Crossings, and Crossings can come the other way — [[veil-incursions]] arriving through the Outfall arrive in empty country, a hard wet distance from anyone's wharves, and that distance is the reason [[heartland]] can stay the safest ground in the game while the region still holds an open door. The Heartland Watch patrols the levee line facing the fen and does not go past it. Ask a Watch officer why and the answer is a schedule. Ask again and it is a different schedule.

Somebody did go past it. The [[meridian-arcane-institute]] keeps a quiet survey camp at the station — instruments, a research trailer, a rotation of unfailingly polite staff, and no activation, no fence, and no flag on any map. The Institute has not told the courthouse, the courthouse has not asked, and the camp's existence is a secret in the specific sense that everyone important suspects it and nobody has decided what suspecting it is worth yet.

For writers: the Outfall is where [[veil-expeditions]] begin for this region, and the Veil's own law is the tutorial text — nothing an expedition takes is truly theirs until they cross home. The Anchor's builders fall under the same silence as the Weir's: the two ends of the system share their questions, and canon answers neither.`,
    meta: {
      type: "site",
      settlementTier: null,
      parent: "riverlands",
      biome: "overflow station in wild fen: dead channels, standing water, old machinery",
      control: [{ faction: "meridian-arcane-institute", kind: "influences" }],
      population: "A Meridian survey rotation, unacknowledged. Otherwise the fen's.",
      connections: [
        { to: "heartland", by: "levee road", notes: "The Watch patrols the levee to the line facing the fen, and does not go past it." },
      ],
      status: "Unclaimed; quietly surveyed by Meridian. No activation on record.",
      veilAnchorTier: "I",
      soulForge: null,
      gameTag: null,
      openQuestions: [
        "What is Meridian's survey camp actually measuring, and who inside the Institute reads it?",
        "Which Shard does the Outfall's first Crossing open? Future design decides; the tier only promises the threat band.",
      ],
    },
  }),

  // ─── The Waterworks (regional rule) ───────────────────────────────────────
  {
    kind: "SYSTEM",
    slug: "the-waterworks",
    title: "The Waterworks",
    summary:
      "The Riverlands' signature rule: whoever holds the water, holds the country. Ancient locks, sluices, and pumps stand throughout the watershed, maintained by nobody and still answering levers.",
    body: `The Riverlands' standing rule, and the region's signature system the way Adaptive Mutation is [[bloomfall-reach]]'s: **whoever holds the water, holds the country.** Ancient locks, sluices, lifts, and pumps stand throughout the watershed — machinery no living tradition built, that no crew maintains beyond its brasswork, and that still answers levers. Water control is not scenery in this region; it is the substrate every other power runs on.

One rule, expressed everywhere:

- **The Five Gates.** [[heartland]]'s five great lock-gates are the works at civic scale — each gate-leg begins at one, and closing a gate is a real act of war.
- **The legs.** Locks and lifts move the rivers' whole trade past falls and shallows. Hold a lock, tax a river — [[winchworks]] and [[charnel-lock]] are both forts because they are both levers.
- **Defense.** A riverland fort floods its own approaches. A wall here is a valve with stonework.
- **Building.** Riverland ground is drained before it is built — every landholder's first lesson, from the [[first-charter]]'s homestead bank to the [[second-charter]]'s island works.
- **The deep works.** The [[first-weir]] beneath Heartland regulates the watershed and is reclaimed the only way the machinery permits: pumped dry, wing by wing. [[the-outfall]] is the same system's far end, and carries the region's Anchor.

For writers: never write a working pump as understood. The works answer levers; nobody alive knows why, and every lever answered is a question not answered — the same silence that covers the Weir's builders and the Anchor's. Glimpse discipline applies: the works may rhyme with why this country still lives while the world drains, and canon must never confirm it. Mechanically, everything above is canonical world behaviour; its realisation as gameplay is future design, gated with the region's arcs.`,
    meta: {
      category: "world simulation",
      buildStatus: "concept",
      parent: null,
      unlockArc: null,
      unlockStage: "Canonical world behaviour; mechanical realisation is future gameplay design",
      dependsOn: [],
      pillars: [
        "Whoever holds the water, holds the country",
        "The works answer levers; nobody alive built them, and nobody writes them understood",
        "Water control is player-facing: routes, defense, building ground, and the region's endgame all run through it",
      ],
      regionNotes: [
        { region: "riverlands", note: "Unique to the Riverlands: the region's signature rule, as Adaptive Mutation is Bloomfall Reach's. Every leg, fort, charter, and the Weir express it." },
        { region: "heartland", note: "The Five Gates are the rule at civic scale; the city stands dry in a floodplain and has never asked why." },
        { region: "first-weir", note: "The deepest instance: the drowned works are reclaimed pump by pump, and progress is measured in water moved." },
        { region: "the-outfall", note: "The system's far end — overflow channels, dead machinery, and the region's Veil Anchor under the same old silence." },
      ],
      gameTag: null,
      openQuestions: [
        "Who built the works, and why do they still answer? (Glimpse discipline — permanently open.)",
        "Do any works answer outside the Riverlands, and is that a door future regions may open?",
      ],
    },
  },
];

// Body for the riverlands rewrite is separate: the update path runs a word-loss
// check against the stored prose before it will touch the row.
const riverlandsBody = `The Riverlands are the central watershed, not a round territory. Their navigable branches reach into every neighboring biome, carrying roads, trade, contested crossings, and strips of buildable ground far into higher-risk country. The broad central floodplains are the world's premier player-building territory. Each river arm should remain geographically readable on the atlas because those corridors are a deliberate progression and settlement system, not decorative water.

Every other region shows what the war costs. The Riverlands are what the war is for: the last country where the world still works — fertile ground, moving trade, morning light. That is why everyone with an army eventually looks here, and why the region's question is never what monster lives in it but how long something this good can stay standing.

At the center, where all five arms braid, stands [[heartland]] — the crossroads city everyone needs and nobody owns, neutral under the pact its people call the Standstill. Each arm begins at one of the city's five great lock-gates and takes its name from its gate. [[arcadia-gate]] runs southwest to [[the-peninsula]] and [[port-arcadia]] under [[aegis-extraction-consortium]]'s ledgers; [[cliffgate]] climbs the falls toward [[grand-lake]] and [[high-cliffs]] in [[mountain-holdfasts]] hands; [[riftgate]] runs northwest through red-forest tannin country toward [[grand-rift]] on the [[bone-market-families]]' patient water; [[sandgate]] carries the oasis corridor into [[the-desert]] where the [[desert-nomad-compact]] meets the river; and [[stormgate]] is the engineered leg, held unnaturally steady into [[magic-torn-wasteland]] under the [[meridian-arcane-institute]]'s charter. A sixth connection is a road, not a river: the Ashline haul road east to [[bloomfall-reach]] and [[ashline-exchange]], which no faction claims. Nobody fights over the road to the wound.

The region's standing rule is [[the-waterworks]]: whoever holds the water, holds the country. Ancient locks, sluices, lifts, and pumps stand throughout the watershed, maintained by nobody, still answering levers — the gates, the leg locks, the fort defenses, the drained building ground, and the drowned works under the city are all one system wearing different stone.

The danger is arranged deliberately: safe center, wild arms. The floodplain around Heartland is the safest open ground in the game — worth living in, worth defending, the reason the region is the world's hope rather than its museum. Each leg ramps toward the biome it feeds, and the leg law fixes the scale: every leg carries exactly one fort, its faction's regional seat, with at least one town and one outpost and room for five towns and three outposts in all. But no two legs settle alike — the money river is thick with towns while the held river is mostly wire and watch posts, the corridor into the desert stays sparse on purpose, and villages below the law's count fill in wherever life finds a bank. The remaining slots are deliberately unwritten — the codex is growing, and the empty banks are invitations, not gaps.

Beneath all of it, the works that keep this country alive keep working. The [[first-weir]] under Heartland and [[the-outfall]] in the far fen are the two doors anyone has found into the old system, and neither has given up the name of its builder.`;

const riverlandsMetaUpdate = {
  type: "region" as const,
  settlementTier: null,
  parent: null,
  biome: "river floodplain, wetlands, and fertile lowland",
  control: [],
  population: "The most settled open country in the world; the floodplain is the point.",
  // Deliberately byte-identical to the stored rows: atlas provenance keys
  // reference these entries by index and the array must not shift.
  connections: [
    { to: "high-cliffs", by: "river corridor", notes: "A Riverlands branch carries buildable ground into the neighboring biome." },
    { to: "grand-rift", by: "river corridor", notes: "A Riverlands branch carries buildable ground into the neighboring biome." },
    { to: "the-desert", by: "river corridor", notes: "A Riverlands branch carries buildable ground into the neighboring biome." },
    { to: "magic-torn-wasteland", by: "river corridor", notes: "A Riverlands branch carries buildable ground into the neighboring biome." },
    { to: "the-peninsula", by: "river corridor", notes: "A Riverlands branch carries buildable ground into the neighboring biome." },
  ],
  status: "Established macro region; Heartland and the Five Gates founded.",
  veilAnchorTier: null,
  soulForge: null,
  gameTag: null,
  openQuestions: [
    "Which towns and outposts fill each gate-leg's reserved slots? Up to five towns and three outposts ride every leg, and most are unwritten.",
    "What does the Free Peoples Compact make of two member peoples holding rival gates?",
  ],
};

/** The stored rows are carried forward verbatim — atlas provenance keys them by
 *  index and Postgres jsonb does not preserve authoring key order, so a
 *  re-authored array can never compare or store byte-identically. */
function withStoredConnections(storedMeta: Record<string, unknown>) {
  const storedRows = storedMeta.connections as Array<{ to: string; by: string | null; notes: string | null }>;
  const sameTargets = JSON.stringify(storedRows.map((r) => r.to)) === JSON.stringify(riverlandsMetaUpdate.connections.map((r) => r.to));
  return { sameTargets, meta: { ...riverlandsMetaUpdate, connections: storedRows } };
}

const STOPWORDS = new Set([
  "the", "their", "them", "they", "this", "that", "those", "these", "with", "into", "onto",
  "from", "because", "should", "would", "could", "each", "every", "very", "much", "many",
  "and", "not", "are", "was", "were", "been", "being", "have", "has", "had", "for", "far",
  "its", "his", "her", "our", "your", "who", "whom", "whose", "which", "what", "when",
  "where", "why", "how", "than", "then", "there", "here", "over", "under", "about",
  "remain", "remains",
]);

function contentWords(text: string): string[] {
  return [...new Set(
    text.toLowerCase().replace(/\[\[|\]\]/g, " ").split(/[^a-z']+/)
      .map((w) => w.replace(/^'|'$/g, ""))
      .filter((w) => w.length > 3 && !STOPWORDS.has(w)),
  )];
}

function extractLinks(body: string): string[] {
  return [...body.matchAll(/\[\[([a-z0-9-]+)\]\]/g)].map((m) => m[1]!);
}

/** Postgres jsonb does not preserve key order; compare with sorted keys. */
function stableJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value as Record<string, unknown>).sort().map((k) => `${JSON.stringify(k)}:${stableJson((value as Record<string, unknown>)[k])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

const db = getPrismaClient();

async function main() {
  const apply = process.argv.includes("--apply");
  const identity = await db.$queryRaw<Array<{ database: string }>>`SELECT current_database() AS database`;
  const actor = await db.user.findFirstOrThrow({ where: { role: "ADMIN", isActive: true }, orderBy: { id: "asc" }, select: { id: true } });

  // ── Validate every seed before touching anything ──────────────────────────
  const batchSlugs = new Set(seeds.map((s) => s.slug));
  const problems: string[] = [];
  const slugExists = async (slug: string) => {
    if (batchSlugs.has(slug)) return true;
    return Boolean(await db.storyEntry.findUnique({ where: { slug }, select: { id: true } }));
  };

  for (const seed of seeds) {
    const parsed = seed.kind === "REGION" ? regionMetaSchema.safeParse(seed.meta) : systemMetaSchema.safeParse(seed.meta);
    if (!parsed.success) problems.push(`${seed.slug}: meta invalid — ${parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ")}`);
    for (const link of extractLinks(seed.body)) {
      if (!(await slugExists(link))) problems.push(`${seed.slug}: dead link [[${link}]]`);
    }
    if (seed.kind === "REGION") {
      if (seed.meta.parent && !(await slugExists(seed.meta.parent)) && seed.meta.parent !== "riverlands") problems.push(`${seed.slug}: missing parent ${seed.meta.parent}`);
      for (const row of seed.meta.control) if (!(await slugExists(row.faction))) problems.push(`${seed.slug}: control names missing faction ${row.faction}`);
      for (const row of seed.meta.connections) if (!(await slugExists(row.to))) problems.push(`${seed.slug}: connection to missing ${row.to}`);
    } else {
      for (const row of seed.meta.regionNotes) if (!(await slugExists(row.region))) problems.push(`${seed.slug}: regionNotes names missing ${row.region}`);
    }
    if (seed.body.includes("|]]") || /\[\[[^\]]*\|/.test(seed.body)) problems.push(`${seed.slug}: piped link syntax is forbidden`);
  }
  const rlParsed = regionMetaSchema.safeParse(riverlandsMetaUpdate);
  if (!rlParsed.success) problems.push(`riverlands: meta invalid — ${rlParsed.error.message}`);
  for (const link of extractLinks(riverlandsBody)) if (!(await slugExists(link))) problems.push(`riverlands: dead link [[${link}]]`);

  // ── Word-loss check on the riverlands rewrite ─────────────────────────────
  const stored = await db.storyEntry.findUniqueOrThrow({ where: { slug: "riverlands" } });
  const lost = contentWords(stored.body ?? "").filter((w) => !riverlandsBody.toLowerCase().includes(w));
  if (lost.length) problems.push(`riverlands rewrite drops content words: ${lost.join(", ")}`);
  const storedMeta = stored.meta as Record<string, unknown>;
  const carried = withStoredConnections(storedMeta);
  if (!carried.sameTargets) {
    problems.push("riverlands connection targets or order differ from the plan — the atlas provenance keys them by index; refusing.");
  }

  if (problems.length) {
    console.error(JSON.stringify({ database: identity[0]?.database, FAILED: problems }, null, 2));
    process.exitCode = 1;
    return;
  }

  // ── Plan and write ────────────────────────────────────────────────────────
  const plan: string[] = [];
  for (const seed of seeds) {
    const meta = seed.meta as unknown as Prisma.InputJsonValue;
    const current = await db.storyEntry.findUnique({ where: { slug: seed.slug } });
    if (!current) {
      plan.push(`create ${seed.kind} ${seed.slug}`);
      if (!apply) continue;
      const created = await db.storyEntry.create({ data: {
        kind: seed.kind, slug: seed.slug, title: seed.title, summary: seed.summary,
        body: seed.body, meta, status: "CANON", createdByUserId: actor.id,
      } });
      await db.storyRevision.create({ data: {
        entityType: "ENTRY", entityId: created.id, action: "CREATED", actorUserId: actor.id,
        summary: `Riverlands foundation: filed ${seed.title}`,
      } });
      continue;
    }
    const same = current.body === seed.body && current.title === seed.title && current.summary === seed.summary
      && stableJson(current.meta) === stableJson(seed.meta);
    if (same) continue;
    // Only reconcile a record this pass authored; a hand edit wins.
    if (current.body !== null && current.body !== seed.body && !current.body.startsWith(seed.body.slice(0, 40))) {
      plan.push(`SKIP ${seed.slug} (edited by hand)`);
      continue;
    }
    plan.push(`update ${seed.slug}`);
    if (!apply) continue;
    await db.storyEntry.update({ where: { id: current.id }, data: {
      title: seed.title, summary: seed.summary, body: seed.body, meta,
      version: { increment: 1 }, updatedByUserId: actor.id,
    } });
  }

  // riverlands rewrite
  const rlSame = stored.body === riverlandsBody && stableJson(stored.meta) === stableJson(carried.meta);
  if (!rlSame) {
    plan.push("rewrite riverlands (word-loss check passed)");
    if (apply) {
      await db.storyEntry.update({ where: { id: stored.id }, data: {
        body: riverlandsBody,
        summary: "Martino's central watershed: Heartland, the Five Gates, and the broad buildable floodplains whose river corridors reach into every surrounding region.",
        meta: carried.meta as unknown as Prisma.InputJsonValue,
        version: { increment: 1 }, updatedByUserId: actor.id,
      } });
      await db.storyRevision.create({ data: {
        entityType: "ENTRY", entityId: stored.id, action: "UPDATED", actorUserId: actor.id,
        summary: "Riverlands foundation: dossier rewritten to the approved region plan (Heartland, Five Gates, Waterworks, Charters, Weir, Outfall).",
      } });
    }
  }

  console.log(JSON.stringify({ database: identity[0]?.database, mode: apply ? "APPLY" : "PREVIEW", entries: seeds.length + 1, plan: plan.length ? plan : ["nothing to do"] }, null, 2));
}

main().finally(() => db.$disconnect());
