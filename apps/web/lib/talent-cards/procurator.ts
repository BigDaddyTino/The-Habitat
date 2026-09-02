import type { AbilityCard } from "../ability-cards";

/** Procurator — every node's card, keyed by node id; corrupted phases keyed corrupt-1..corrupt-7. */
export const procuratorCards: Record<string, AbilityCard> = {
  // ------------------------------------------------------------ Command (core)
  "voice-that-carries": {
    kind: "Passive",
    effect: "Allies within 10m take −6% damage. Your orders reach every squadmate within 40m through gunfire and panic.",
  },
  "names-and-faces": {
    kind: "Passive",
    effect: "Recalls every name, face, debt and grudge you have ever met, perfectly. +10 disposition with anyone you have met before — people remember being remembered.",
  },
  rally: {
    kind: "Active",
    cooldown: "45s",
    range: "10m",
    duration: "Until moved",
    effect: "Reforms a broken line on you: field-mends nearby allies 12 wounds' worth a minute while they stand within 10m of you.",
    notes: "Stacks with The Order and The Long Column. Ends the moment you go Down or leave the spot you called it on.",
  },
  "triage-order": {
    kind: "Passive",
    effect: "Allies within 10m take −8% damage. The order wheel reaches every squadmate in that radius, and a triage call marks the worst-hurt ally for all of them.",
  },
  "dry-powder": {
    kind: "Passive",
    effect: "Damage taken −4%. Your own Composure does not tick down when a plan fails or an ally goes Down.",
    notes: "A Grazed still ticks Composure; only the plan failing is exempt.",
  },
  "your-own-orders": {
    kind: "Passive",
    effect: "Your orders apply to you as well as the column: damage dealt +35%, hit chance +5%, damage taken −8%.",
    notes: "Works alone. Does not stack with a second Procurator's orders on you — the higher value wins.",
  },
  "steady-the-line": {
    kind: "Passive",
    effect: "Allies within 10m take −14% damage. Their Composure holds: no Composure tick from a Grazed or from an ally going Down while they stand inside the aura.",
    notes: "Gate for The Field and The Map. Falls silent while you are Down.",
  },
  "the-field": {
    kind: "Choice",
    range: "10m",
    effect: "Allies within 10m take −16% damage. Every Command aura you carry reaches the allies you stand with — 10m, line of sight — and nobody further.",
    notes: "Locks The Map. Needs Steady the Line. Falls silent while you are Down.",
  },
  "the-map": {
    kind: "Choice",
    range: "Any range",
    effect: "Allies within 10m take −10% damage, and the aura follows any ally you hold a drone or lattice feed on, at any range. Sees through 15% concealment.",
    notes: "Locks The Field. Needs Steady the Line. Links to Overwatch Grid: buying either end opens both paths. Without a feed — jammed lattice, dead drone — the aura is 10m and line of sight only.",
  },
  "the-long-column": {
    kind: "Passive",
    effect: "Allies within 10m take −12% damage and are field-mended 8 wounds' worth a minute. Your orders move formations: every squad under your command answers the wheel, not only yours.",
    notes: "Needs The Field or The Map. Reach follows the one you chose — 10m on the field, any range with a feed at the map.",
  },

  // ------------------------------------------------------------ Tactician
  "sand-table-mind": {
    kind: "Passive",
    effect: "Readiness +12% (draw, mount and first shot come sooner). Ground you have looked at once is mapped for the whole squad: cover, lines and exits.",
  },
  "walk-the-fire": {
    kind: "Passive",
    effect: "14% chance per attack to strip a plate or stagger. Marks one position as the squad's suppression line; every squadmate sees it.",
  },
  "read-the-horn": {
    kind: "Passive",
    effect: "Reads the reserve live — Essence count, morale, ammunition — before the quartermaster reports. You see the reserve cross 35 Essence the moment it does, before the horn sounds.",
  },
  "clockwork-advance": {
    kind: "Passive",
    effect: "Readiness +14% (draw, mount and first shot come sooner). Two squads you time arrive on the same second.",
  },
  "danger-close": {
    kind: "Active",
    cooldown: "60s",
    range: "Rifle range",
    duration: "Instant",
    effect: "Calls fire support in beside your own line: damage dealt +40% on the strike, and allies inside the safety line take none of it.",
    notes: "Needs a battery, drone or caster on the net to answer the call. Battery Voice makes the same call land sooner and harder.",
  },
  "kill-box": {
    kind: "Active",
    cooldown: "90s",
    range: "25m",
    duration: "Until moved",
    effect: "Marks the ground in front of you as the kill box: damage dealt +30% against anything standing in it, and readiness +10% (draw, mount and first shot come sooner) while it is set.",
    notes: "One kill box at a time. Moving it restarts the cooldown. Sand Table Mind shows the squad where it is.",
  },
  "overwatch-grid": {
    kind: "Passive",
    effect: "Sees through 15% concealment; readiness +10% (draw, mount and first shot come sooner). Every squadmate's sightline draws on your map as a line.",
    notes: "Links to The Map: buying either end opens both paths.",
  },
  "battery-voice": {
    kind: "Capstone",
    effect: "Fire missions you call: damage dealt +80% and readiness +20% (draw, mount and first shot come sooner). The guns answer before you finish the request.",
    notes: "Trainer-gated: the Tempest Battery Officer teaches it; points alone never open it. Closed at corruption phase 3 or above — command ceilings shut.",
  },

  // ------------------------------------------------------------ Quartermaster
  "ledger-hand": {
    kind: "Passive",
    effect: "Your books audit clean, always. Inspectors wave you through: institutional trust +15%.",
  },
  "the-count": {
    kind: "Passive",
    effect: "Ammunition carried +30%. Stock, prices and shortfalls of any store you look at are counted on sight.",
  },
  "dose-ledger": {
    kind: "Passive",
    effect: "Action speed +5% (attacks, casts and swaps cycle faster). Every squadmate's dose count — who is holding, who is short, who is lying about it — shows on your wheel.",
  },
  "one-more-crate": {
    kind: "Passive",
    effect: "Ammunition carried +40%. The nearest unclaimed crate of whatever your squad is shortest on is marked on your map.",
  },
  "stretch-the-store": {
    kind: "Passive",
    effect: "Ammunition carried +40%. Any supply line you manage runs 7 days past where its books say it ends.",
    notes: "Stacks with a Culinary licence's stretched store — the two weeks add.",
  },
  "cold-chain": {
    kind: "Passive",
    effect: "Ammunition carried +20%. Doses, samples, blood and rations keep at full grade across any distance you manage.",
  },
  "convoy-discipline": {
    kind: "Passive",
    effect: "Ammunition carried +40%. Convoys you plan arrive with 100% of their manifest: nothing lost to spoilage, theft or a bad road.",
  },
  "the-order": {
    kind: "Capstone",
    effect: "Field-mends nearby allies 12 wounds' worth a minute; allies within 10m take −6% damage. You sequence the Forge: you choose which of the dead rebuilds first, and you sound the horn.",
    notes: "Trainer-gated: the Kestrel Quartermaster teaches it; points alone never open it. Closed at corruption phase 3 or above — command ceilings shut. Stacks with Rally.",
  },

  // ------------------------------------------------------------ Envoy
  protocol: {
    kind: "Passive",
    effect: "Speaks every institution's manners fluently: zero etiquette failures. Doors open one rank above your station.",
  },
  terms: {
    kind: "Passive",
    effect: "Every deal opens on your paper: your clauses are the baseline the other side has to argue down from.",
  },
  "read-the-table": {
    kind: "Passive",
    effect: "Sees through 10% concealment. At any table, who is bluffing, who is desperate and who actually decides is marked for you.",
  },
  "the-right-gift": {
    kind: "Passive",
    effect: "Knows the correct gift before the door opens — rank, faith and grudge accounted — so no first meeting opens at a disposition penalty.",
  },
  "what-theyll-take": {
    kind: "Passive",
    effect: "Reads the other side's bottom line before it is spoken: their true price shows on the table.",
  },
  "back-channel": {
    kind: "Active",
    cooldown: "Once per day",
    range: "Any range",
    effect: "Names one person inside any organization who will talk to you first, quietly. They reach you within a day.",
    notes: "One organization per use. Suspicion at that institution is not raised by the contact; what you do with it can raise it.",
  },
  "safe-passage": {
    kind: "Passive",
    effect: "6% harder to target and to hit. Faction lines open for you and anyone travelling under your name: checkpoints read your paper and let the column through.",
    notes: "Falls off at any institution where your suspicion score is high enough to flag you on sight.",
  },
  close: {
    kind: "Capstone",
    effect: "Closed deals stay closed: both sides believe they won, and renegotiation fails unless you allow it.",
    notes: "Trainer-gated: Jaro Fen teaches it; points alone never open it. Closed at corruption phase 5 or above — every teacher but the Choir and the Covenant refuses.",
  },

  // ------------------------------------------------------------ Magnate
  "coin-eye": {
    kind: "Passive",
    effect: "Reads the true value, provenance and best buyer of anything at a glance.",
  },
  "price-the-room": {
    kind: "Passive",
    effect: "On entering a room, reads who is paid, who is owed and who is for sale.",
  },
  margin: {
    kind: "Passive",
    effect: "Trade runs you make turn +15% profit: buy low here, sell high there, repeat.",
  },
  escrow: {
    kind: "Passive",
    effect: "Your deals cannot be welched: the structure guarantees both deliveries, or neither happens.",
  },
  "black-book": {
    kind: "Unlock",
    effect: "Opens the black market in any port to your knock. Fence prices run 10% in your favour.",
    notes: "Buying and selling there still counts against your suspicion with whichever institution polices that port.",
  },
  "cornered-market": {
    kind: "Active",
    cooldown: "One season",
    range: "Any range",
    duration: "Until you change it",
    effect: "Sets the price of one good in one port: buyers and sellers there trade at your number. Changing the good or the port takes a season.",
    notes: "One good, one port at a time. Cartel Terms moves the markets around it.",
  },
  "letters-of-credit": {
    kind: "Passive",
    effect: "Your paper spends as coin in four ports of your choosing. Nothing in your strongbox is worth robbing.",
    notes: "Changing a port takes a season, the same as Cornered Market.",
  },
  "cartel-terms": {
    kind: "Capstone",
    effect: "Trades at price-making scale: your volume moves any market ±10%.",
    notes: "Trainer-gated: the Pearl Factor teaches it; points alone never open it. Closed at corruption phase 5 or above — every teacher but the Choir and the Covenant refuses.",
  },

  // ------------------------------------------------------------ Sovereign
  "claim-ground": {
    kind: "Unlock",
    effect: "Claims one place as yours. Claimed ground produces: scavenge rights, rents or taxes flow to you weekly.",
    notes: "First node of the branch costs 2; there is no 1-point node here. Everything below needs ground claimed.",
  },
  census: {
    kind: "Passive",
    effect: "Knows your ground's people live: heads, skills, needs and grudges, updated as they change.",
    notes: "Needs Claim Ground.",
  },
  "boots-on-the-wall": {
    kind: "Passive",
    effect: "No surprise attacks on your ground: patrols actually patrol, and watch rotations run themselves.",
    notes: "Needs Census. Still needs people to stand the watch — an empty ground has no patrol.",
  },
  "the-board": {
    kind: "Unlock",
    effect: "Unlocks Outpost management on your ground: walls, beds, workshops and a Forge housing.",
    notes: "Needs Boots on the Wall. The Forge housing needs an Architecture licence on the ground to build.",
  },
  "tithe-and-wage": {
    kind: "Passive",
    effect: "Settler growth +20% on your ground and a raised loyalty floor: staying pays.",
    notes: "Needs The Board.",
  },
  "standing-court": {
    kind: "Passive",
    effect: "Disputes on your ground end at your table and rulings stick. Loyalty compounds +10% a season.",
    notes: "Needs Tithe & Wage. Stacks with the loyalty floor from Tithe & Wage.",
  },
  charter: {
    kind: "Unlock",
    effect: "Your ground becomes a jurisdiction: your signature carries law beyond its walls.",
    notes: "Needs Standing Court. Gate for Crown Without a Name.",
  },
  "crown-without-a-name": {
    kind: "Capstone",
    effect: "Unlocks Kingdom management: holding ground becomes ruling it — vassals, levies, law, legacy.",
    notes: "Reserved for the kingdom pass; no trainer is named yet, and points alone never open it. Needs Charter.",
  },

  // ------------------------------------------------------------ The Hungry Ledger (corrupted)
  "corrupt-1": {
    kind: "Corrupted",
    effect: "Allies within 10m take −4% damage. The tremor never reaches your voice: your orders land at full effect however low your Composure runs.",
    notes: "Phase 1, Tremor. A medic sees the hand; a stranger does not, yet. Nothing closes.",
  },
  "corrupt-2": {
    kind: "Corrupted",
    effect: "6% chance per attack to strip a plate or stagger. The glow shows when you command and reads as conviction: allies hold morale.",
    notes: "Phase 2, Veining. Suspicion rises at every institution that watches you command. Temporal licences close and the Church stops calling you brother.",
  },
  "corrupt-3": {
    kind: "Corrupted",
    effect: "Field-mends nearby allies 4 wounds' worth a minute. Every obeyed order quiets the hunger for a moment.",
    notes: "Phase 3, Appetite. Command ceilings close: Battery Voice and The Order can no longer be learned. The order wheel is harder to read under fire.",
  },
  "corrupt-4": {
    kind: "Corrupted",
    effect: "Sees through 15% concealment. Tells, lies and fear are legible across a whole formation.",
    notes: "Phase 4, Sensitivity. Institutional cost: 12% easier to read and to hit. Instruments flag you at every checkpoint that has one.",
  },
  "corrupt-5": {
    kind: "Corrupted",
    effect: "Damage dealt +20%. Strategies you never studied arrive from whoever the dose used to be.",
    notes: "Phase 5, Drift. Institutional costs: nobody sells you plates — one plate slot short (−1 plate slot) — and still 12% easier to read and to hit. Every teacher closes except the Choir and the Covenant.",
  },
  "corrupt-6": {
    kind: "Corrupted",
    effect: "10% chance per attack to strip a plate or stagger. Your column obeys faster, and bunks farther away.",
    notes: "Phase 6, Turning. Institutional costs: nobody billets with you — between-fight care halves; still one plate slot short and 12% easier to read and to hit. The horn sounds early for you.",
  },
  "corrupt-7": {
    kind: "Corrupted",
    effect: "Completion. An abomination stands where you stood; the character ends.",
    notes: "Phase 7. Someone else gives the next order.",
  },
};
