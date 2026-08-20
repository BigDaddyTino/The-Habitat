/**
 * Writer-ready sheets for the thirteen powers whose prose existed before the
 * structured faction editor did. Every value below is an index over that
 * prose, not new canon: unknown seats, leaders, strength, and game tags remain
 * deliberately null or empty for the room to decide.
 */
export const factionSheetSeeds = [
  {
    slug: "aegis-extraction-consortium",
    meta: {
      scope: "Corporate magical-extraction empire", parent: null, independent: false, power: null, seat: null, leaders: [],
      relations: [
        { faction: "concordance-of-natural-casters", stance: "enemy", notes: "Born casters are people to the Concordance and supply to Aegis; the conflict is existential." },
        { faction: "church-of-the-first-gift", stance: "enemy", notes: "The Church calls the harvest economy desecration and shelters what Aegis means to acquire." },
        { faction: "the-free-peoples-compact", stance: "enemy", notes: "The Compact exists to make its peoples and their land unavailable to buyers and catcher crews." },
      ],
      goals: ["Control the legal supply of Essence and the industries built around it.", "Preserve public legitimacy while deniable crews perform the work that cannot survive scrutiny."],
      gameTag: null,
      openQuestions: ["How much does Aegis leadership know about the jungle sites?", "Who owns and directs the deniable catcher crews?"],
    },
  },
  {
    slug: "the-ashen-court",
    meta: {
      scope: "Supernatural court of demon nobility", parent: null, independent: false, power: null, seat: null, leaders: [],
      relations: [{ faction: "the-riftbound-legion", stance: "ally", notes: "The Legion is the Court's organized military instrument, not an equal banner." }],
      goals: ["Exploit battlefield rifts as doors for incursions.", "Keep the Court's hierarchy, etiquette, and ultimate price opaque."],
      gameTag: null,
      openQuestions: ["What did the Court know about Pearl's build-up before Igit?", "What does the Court ultimately want from the human world?"],
    },
  },
  {
    slug: "the-choir-below",
    meta: {
      scope: "Subterranean supernatural intelligence", parent: null, independent: true, power: null, seat: null, leaders: [],
      relations: [{ faction: "the-ashen-court", stance: "rival", notes: "The Court forces doors; the Choir works beneath politics as a door in its own right." }],
      goals: ["Steer surface politics through dreams, cults, and possession.", "Keep its nature and purpose hidden behind human intermediaries."],
      gameTag: null,
      openQuestions: ["What does the Choir actually want?", "Why does its influence repeatedly take the shape of human guilt?"],
    },
  },
  {
    slug: "church-of-the-first-gift",
    meta: {
      scope: "Religious power devoted to freely gifted magic", parent: null, independent: false, power: null, seat: null, leaders: [],
      relations: [
        { faction: "sanctuary-of-living-beasts", stance: "ally", notes: "The Sanctuary is the Church's rescue network and its unresolved doctrinal challenge." },
        { faction: "aegis-extraction-consortium", stance: "enemy", notes: "The Church names extraction desecration; Aegis industrializes it." },
      ],
      goals: ["Protect freely gifted magic and the beings who carry it.", "Shelter the hunted and resist the harvest economy."],
      gameTag: null,
      openQuestions: ["Was the First Gift given by a teacher, a relic, or a captive?", "Will the Church recognize creatures as recipients of the Gift rather than evidence of it?"],
    },
  },
  {
    slug: "concordance-of-natural-casters",
    meta: {
      scope: "Hidden survival network for people born with magic", parent: null, independent: false, power: null, seat: null, leaders: [],
      relations: [
        { faction: "liberation-of-the-gifted", stance: "ally", notes: "Same safehouses and funerals, divided over whether the system can be changed or must be burned down." },
        { faction: "aegis-extraction-consortium", stance: "enemy", notes: "Aegis treats the people the Concordance hides as harvestable supply." },
      ],
      goals: ["Keep born casters alive, concealed, and connected.", "Move the hunted through safehouses before institutions can classify them as resources."],
      gameTag: null,
      openQuestions: ["Will the Concordance train a newly gifted child or hide them?", "How long can it cooperate with the Liberation while formally disowning it?"],
    },
  },
  {
    slug: "crimson-choir",
    meta: {
      scope: "Independent blood-magic cabal", parent: null, independent: true, power: null, seat: null, leaders: [],
      relations: [{ faction: "ossuary-covenant", stance: "rival", notes: "Both work in death's economy, but sacrifice and licensed necromancy are incompatible systems of value." }],
      goals: ["Turn sacrifice into enforceable supernatural transactions.", "Collect its debts while remaining misfiled by every major power."],
      gameTag: null,
      openQuestions: ["Is there one voice above the cells?", "Why have separate altars begun answering differently?"],
    },
  },
  {
    slug: "floating-city-council",
    meta: {
      scope: "Ruling bloc of the floating metropolis", parent: null, independent: false, power: null, seat: null, leaders: [],
      relations: [{ faction: "skybridge-transit-authority", stance: "ally", notes: "The Council rules the city; the Authority controls who and what can reach it." }],
      goals: ["Keep the city aloft and its reserve arithmetic credible.", "Control sky access while preserving the hierarchy built above the ground."],
      gameTag: null,
      openQuestions: ["What is the real state of the city's lift reserves?", "What happens if the Drain reaches the anchors?"],
    },
  },
  {
    slug: "national-defense-directorate",
    meta: {
      scope: "State military and security apparatus", parent: null, independent: false, power: null, seat: null, leaders: [],
      relations: [{ faction: "tropic-pearl-trade-house", stance: "enemy", notes: "Pearl's private war on Igit left the Directorate defending a state whose authority had already been bypassed." }],
      goals: ["Hold the peninsula and preserve a credible chain of command.", "Control Essence, infusion, quarantine, and the evidence those systems produce."],
      gameTag: null,
      openQuestions: ["Which emergency laws still have legitimate force?", "What explains the discrepancies in the Directorate's Essence ledgers?"],
    },
  },
  {
    slug: "the-old-hunger",
    meta: {
      scope: "Ancient supernatural appetite with mortal orbiters", parent: null, independent: true, power: null, seat: null, leaders: [],
      relations: [{ faction: "the-ashen-court", stance: "rival", notes: "Even the Court reroutes around places where the Hunger's pattern is visible." }],
      goals: ["Feed and wake — an observed pattern, not a confirmed plan.", "Remain unknowable except through the people and powers drawn into its orbit."],
      gameTag: null,
      openQuestions: ["Is the silhouette beneath Igit the Hunger itself or only an effect of it?", "Where is the island's disappearing magic actually going?"],
    },
  },
  {
    slug: "ossuary-covenant",
    meta: {
      scope: "Necromantic order and corpse-economy civilization", parent: null, independent: false, power: null, seat: null, leaders: [],
      relations: [
        { faction: "bone-market-families", stance: "ally", notes: "The Families supply corpses, relics, and discretion; the Covenant sets prices, licences, and archival access." },
        { faction: "crimson-choir", stance: "rival", notes: "The Choir's sacrificial bargains sit outside the Covenant's licensed economy of the dead." },
      ],
      goals: ["Maintain the licences, archives, and prices that organize the dead.", "Contain and understand the Risen before somebody else turns them into a market."],
      gameTag: null,
      openQuestions: ["Who or what is raising the Risen?", "Which memories of the dead are being sold, and which are being withheld?"],
    },
  },
  {
    slug: "the-pale-embassy",
    meta: {
      scope: "Supernatural diplomatic mission", parent: null, independent: true, power: null, seat: null, leaders: [], relations: [],
      goals: ["Make exact bargains and enforce the immunity of its envoys.", "Keep the identity and interests of the represented sovereign expensive to learn."],
      gameTag: null,
      openQuestions: ["What does the Embassy represent?", "What is the price embedded in its bargains?", "Why do people who learn the answer choose silence?"],
    },
  },
  {
    slug: "stormglass-cartel",
    meta: {
      scope: "Criminal maritime cartel and artifact-trade power", parent: null, independent: false, power: null, seat: null, leaders: [],
      relations: [
        { faction: "tropic-pearl-trade-house", stance: "enemy", notes: "Pearl destroyed Igit and the Cartel's position there; the employer relationship begins in the wreckage." },
        { faction: "black-tithe-syndicate", stance: "rival", notes: "An ugly competitor and occasional subcontractor that still depends on Stormglass lanes." },
      ],
      goals: ["Control the illegal sea lanes and artifact trade.", "Survive Igit's loss without surrendering the ledgers and leverage that make the Cartel valuable."],
      gameTag: null,
      openQuestions: ["What is the Cartel's connection to the stormglass that names it?", "What future does it intend to buy with Igit's survivors?"],
    },
  },
  {
    slug: "tropic-pearl-trade-house",
    meta: {
      scope: "Commercial and maritime trade bloc", parent: null, independent: false, power: null, seat: null, leaders: [],
      relations: [
        { faction: "stormglass-cartel", stance: "enemy", notes: "Pearl's strike broke Igit and the Cartel operation there; the consequences are still active." },
        { faction: "iron-saints-pmc", stance: "ally", notes: "The Saints are Pearl's longest and largest retainer, contractually aligned rather than sworn." },
      ],
      goals: ["Acquire the remaining sources of magic and the routes that move them.", "Win through contracts, retained force, and costs pushed onto everyone else."],
      gameTag: null,
      openQuestions: ["Who inside Pearl is accountable for the long consequence of Igit?", "How much control does the House truly have over its retained contractors?"],
    },
  },
] as const;

