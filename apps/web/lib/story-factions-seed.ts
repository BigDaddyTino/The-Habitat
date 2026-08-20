/**
 * The shape of power in Martino: which banners stand on their own, which wings
 * fly beneath them, and which few things answer to nobody at all.
 *
 * Thirty-five powers were more than the room could hold in view, so the shelf
 * gained the same spine the regions atlas, the systems shelf, and the races
 * library already have — `FACTION.meta.parent`, and a major is a faction with
 * nothing above it. Ten majors, twenty-one wings, four independents.
 *
 * The law this filing runs on, and the reason it does not read as a demotion:
 *
 *   **Major does not mean important.** A major is a geopolitical umbrella
 *   capable of moving the world's balance on its own. A wing can be more
 *   famous, more dangerous, and far more present in a player's story than the
 *   banner it flies under — it simply lives inside that banner's economic,
 *   political, religious, territorial, or military sphere. Independence is
 *   reserved for what operates outside those spheres entirely.
 *
 * The hierarchy is a political ecosystem, **not** a command structure. The
 * Foundry Workers Union answers to Aegis the way a river answers to the dam
 * built across it. Several wings below despise their banner, and the prose
 * says so in their own voice.
 *
 * Every filing carries the sentence it was read from, because a filing whose
 * reasoning nobody can check is one nobody can correct. Three tiers:
 *
 *   CANON       — canon writes the relationship in so many words.
 *   ALIGNED     — the entry's own prose makes it the obvious reading.
 *   OWNER-CALL  — a consolidation judgment Tino made on 2026-08-20.
 *                 Reversible one line at a time.
 */

export type FactionTier = "CANON" | "ALIGNED" | "OWNER-CALL";

export type FactionAssignment = {
  /** The wing being filed. */
  faction: string;
  /** The banner it flies under. */
  parent: string;
  tier: FactionTier;
  /** The sentence the filing was read from. */
  because: string;
};

export const factionAssignments: FactionAssignment[] = [
  // --- The National Defense Directorate: the state's whole apparatus --------
  {
    faction: "peninsula-expeditionary-army",
    parent: "national-defense-directorate",
    tier: "CANON",
    because: "\"Formally it answers to the Directorate; practically, distance and desperation have made it a power of its own.\"",
  },
  {
    faction: "peninsula-coast-guard-authority",
    parent: "national-defense-directorate",
    tier: "ALIGNED",
    because: "\"The Authority holds the water the state still claims\" — the same state the Directorate is the army of.",
  },
  {
    faction: "abomination-containment-authority",
    parent: "national-defense-directorate",
    tier: "ALIGNED",
    because: "The state's quarantine force: \"half emergency service, half evidence-disposal\", deployed by the same government whose infusion regulations made the work necessary.",
  },
  {
    faction: "drone-surveillance-bureau",
    parent: "national-defense-directorate",
    tier: "OWNER-CALL",
    because: "Its own sheet calls it \"state-corporate\". Filed to the state that operates it; the corporate half is a relationship, not a banner.",
  },
  {
    faction: "wardens-monster-hunter-guild",
    parent: "national-defense-directorate",
    tier: "OWNER-CALL",
    because: "\"Licensed, chartered, and lodge-based\" — the charter is a state instrument, and the Guild holds the ground no field manual covers. Chartered, never employed.",
  },

  // --- The Floating City Council -------------------------------------------
  {
    faction: "skybridge-transit-authority",
    parent: "floating-city-council",
    tier: "CANON",
    because: "\"Formally it serves the Council; practically it is a power of its own, because the Council rules the city but the Authority decides who reaches it.\"",
  },

  // --- The Ashen Court ------------------------------------------------------
  {
    faction: "the-riftbound-legion",
    parent: "the-ashen-court",
    tier: "CANON",
    because: "Tino's call, 2026-08-20: the Legion is the Court's instrument. Canon had left it \"vanguard, rival, or instrument\" and the room decided.",
  },

  // --- The Aegis Extraction Consortium: the magical-resource empire ---------
  {
    faction: "helix-arcanobiotics",
    parent: "aegis-extraction-consortium",
    tier: "OWNER-CALL",
    because: "The Consortium is \"the biggest single buyer, hunter, and refiner of magic\"; Helix is where what it buys becomes soldiers, and where the containment incidents happen.",
  },
  {
    faction: "cybernetic-ascendancy",
    parent: "aegis-extraction-consortium",
    tier: "OWNER-CALL",
    because: "\"Every other power finds it either heretical or extremely purchasable\" — and the Consortium is who does the purchasing. Financed and patent-bound, never employed.",
  },
  {
    faction: "meridian-arcane-institute",
    parent: "aegis-extraction-consortium",
    tier: "OWNER-CALL",
    because: "\"Funding sources it teaches its students never to ask about\" and an endowment that \"does not itemize\". The Consortium is the answer nobody asks for.",
  },
  {
    faction: "foundry-workers-union",
    parent: "aegis-extraction-consortium",
    tier: "OWNER-CALL",
    because: "The Union exists because Aegis dominates the industries its members work in — \"its members build the corporations' machines\". A wing that despises its banner is still inside its sphere.",
  },

  // --- The Tropic Pearl Trade House: the commercial bloc --------------------
  {
    faction: "iron-saints-pmc",
    parent: "tropic-pearl-trade-house",
    tier: "OWNER-CALL",
    because: "\"They fought for Pearl on Igit Island.\" Filed to the retainer that pays them — canon keeps them \"loyal to the signature line, not the flag\", and clause 12 still means whatever the auditor says today.",
  },

  // --- The Stormglass Cartel: the criminal world ----------------------------
  {
    faction: "black-tithe-syndicate",
    parent: "stormglass-cartel",
    tier: "OWNER-CALL",
    because: "\"The Cartel's ugliest competitor and occasional subcontractor.\" Filed to the lanes it moves cargo through; the rivalry survives, loudly.",
  },

  // --- The Concordance of Natural Casters -----------------------------------
  {
    faction: "liberation-of-the-gifted",
    parent: "concordance-of-natural-casters",
    tier: "OWNER-CALL",
    because: "\"Where the Concordance hides, the Liberation strikes\" — the militant wing of the same hunted people, argued over inside the same network.",
  },

  // --- The Church of the First Gift -----------------------------------------
  {
    faction: "sanctuary-of-living-beasts",
    parent: "church-of-the-first-gift",
    tier: "ALIGNED",
    because: "The Church \"shelters creatures, shames corporations\" and calls extraction desecration; the Sanctuary is that doctrine with a liberation route and a van.",
  },

  // --- The Ossuary Covenant -------------------------------------------------
  {
    faction: "bone-market-families",
    parent: "ossuary-covenant",
    tier: "OWNER-CALL",
    because: "\"Corpses for the Ossuary Covenant's chapters\" — the Families are the supply chain of the dead the Covenant's whole economy runs on.",
  },

  // --- The Free Peoples Compact: the land's own, newly allied ---------------
  {
    faction: "verdant-marsh-clans",
    parent: "the-free-peoples-compact",
    tier: "OWNER-CALL",
    because: "\"The harvest economy is their existential enemy — every catcher crew in the wetlands is robbing a pact the Clans are sworn to.\" The Compact is what that enemy finally organized.",
  },
  {
    faction: "desert-nomad-compact",
    parent: "the-free-peoples-compact",
    tier: "OWNER-CALL",
    because: "\"They trade with everyone, swear to no one, and enforce exactly one law absolutely: on the sand, the Compact's word is the border.\" The pact asks for that one law, and nothing else.",
  },
  {
    faction: "mountain-holdfasts",
    parent: "the-free-peoples-compact",
    tier: "OWNER-CALL",
    because: "\"Never again is not a slogan up there; it is municipal policy.\" The Holdfasts brought the policy to a table for the first time.",
  },
  {
    faction: "free-islander-league",
    parent: "the-free-peoples-compact",
    tier: "OWNER-CALL",
    because: "\"The islands belong to islanders\" — and Igit Island proved that conviction needs allies with ground under them.",
  },
  {
    faction: "drifter-renegade-camps",
    parent: "the-free-peoples-compact",
    tier: "OWNER-CALL",
    because: "\"They hear everything, everywhere, first\" — the convoys that ride with the Compact are its eyes. Tino's call, 2026-08-20: the camps that signed are its fifth people; the rest stay outside it entirely.",
  },
];

/** The ten banners, and why each stands on its own. */
export const majorPowers: Array<{ faction: string; because: string }> = [
  { faction: "national-defense-directorate", because: "The state itself: army, coast guard, containment, surveillance, and the Wardens' charter. Five wings answer to it." },
  { faction: "floating-city-council", because: "\"The ruling bloc of the floating metropolis\" — the vertical power, and the only one whose ground is somewhere problems get sent." },
  { faction: "the-ashen-court", because: "Demon nobility — \"the shape of the power behind\" what walks the island, with a legion to march through the holes it prices." },
  { faction: "aegis-extraction-consortium", because: "The magical-resource empire the whole harvest economy runs through: labs, campuses, catcher crews, and the industries four wings live inside." },
  { faction: "tropic-pearl-trade-house", because: "\"Buys wars wholesale\" — the commercial and maritime bloc whose actuaries priced the collapse decades out." },
  { faction: "stormglass-cartel", because: "The player's employer: it rules the illegal sea lanes, the artifact trade, and the underworld that moves through both." },
  { faction: "concordance-of-natural-casters", because: "The born-magic community organizing \"the way hunted people organize\" — the political voice of everyone the world calls a resource." },
  { faction: "church-of-the-first-gift", because: "The faith that calls extraction desecration — a power of conviction, with missionaries where no army goes." },
  { faction: "ossuary-covenant", because: "The death-magic civilization: licensed chapters, corpse contracts, and the best historical record of the hunt in existence." },
  { faction: "the-free-peoples-compact", because: "The newest power on the map: five free peoples who agree on nothing except that their land is not for sale." },
];

/** The four that answer to nobody, and why that independence is meaningful. */
export const independentPowers: Array<{ faction: string; because: string }> = [
  {
    faction: "the-old-hunger",
    because: "\"It is not organized; it is *orbited*.\" It does not govern, ally, or negotiate — it feeds. The faction shelf files it only because the world needs somewhere to write it down.",
  },
  {
    faction: "the-choir-below",
    because: "It works beneath geopolitics rather than inside it: \"the Ashen Court forces doors; the Choir *is* a door\". Powers serve it without knowing they have.",
  },
  {
    faction: "the-pale-embassy",
    because: "\"What the Embassy actually represents… is unwritten and should stay expensive to learn.\" A sovereign nobody can place is the entire point of it.",
  },
  {
    faction: "crimson-choir",
    because: "Everyone assumes the Choir serves the Ashen Court, the Choir Below, the Church, or the Old Hunger — and all four assumptions are wrong. Its independence is the secret, not an absence of one.",
  },
];

/** The one new power this restructuring writes into canon. */
export const compactSeed = {
  slug: "the-free-peoples-compact",
  title: "The Free Peoples Compact",
  summary:
    "The newest power on the map: marsh clans, desert caravans, mountain holdfasts, island councils, and road convoys who agree on nothing except that their land is not for sale — one bloc by necessity, five peoples by choice.",
  body: [
    "The Compact is nine months old and already the third-largest territory on the peninsula, which tells you everything about the decade that produced it. It is not a government, a nation, or an alliance in the treaty sense — it is a defensive pact signed by peoples who had spent centuries ignoring one another, because [[aegis-extraction-consortium]] survey teams, [[national-defense-directorate]] requisitions, [[tropic-pearl-trade-house]] flotillas, and rifts that open where somebody else's war was fought had all finally arrived at the same time. [[verdant-marsh-clans]] brought the pacts, [[mountain-holdfasts]] brought the passes and the grudge, [[desert-nomad-compact]] brought the crossings, [[free-islander-league]] brought a fleet and a wound named Igit Island, and [[drifter-renegade-camps]] — the convoys that signed, at least — brought the one thing none of the others had: they hear everything, everywhere, first.",

    "There is no capital, no standing army, and no shared culture — a marsh pact-keeper and a holdfast reeve can barely agree on what a border is. What the Compact has is a single article, ratified without amendment, that its members quote the way other powers quote scripture: *our land is not yours*. Everything else — water rights, feuds two centuries old, whether the road camps are truly members or merely useful — is argued at assembly, loudly, and settled the way it has always been settled. Every great power on the peninsula has spent the year testing whether five peoples who dislike each other can be split by a good offer. So far, the offers have made the Compact stronger.",

    "Characters to write here: the assembly speaker who has to make five delegations vote as one and is running out of ways to do it; the marsh pact-keeper who signed and now wonders what the pact-creatures make of an alliance; the holdfast reeve who arms the Compact with intercepted Aegis shipments and enjoys the paperwork; the road-camp boss whose convoy is a member on paper and a suspect everywhere else; the corporate negotiator working through the delegations one at a time, patiently, with a very good offer.",

    "Where they stand on the Drain: caused, and the Compact's members are the evidence file. The deep marsh still has magic because the clans never took more than was given; the high veins emptied at exactly the speed of the extraction contracts; the small islands kept theirs because nobody let the mainland at them. Put together at an assembly table, those three histories say the same thing in three accents, and the Compact was founded on the conclusion: what is left survives only where somebody is willing to hold it. That is not a conservation philosophy. It is a defensive perimeter with a philosophy attached.",
  ].join("\n\n"),
  meta: {
    scope: "compact — the free peoples' defensive pact",
    parent: null,
    independent: false,
    power: null,
    seat: null,
    leaders: [],
    relations: [],
    goals: [],
    gameTag: null,
    openQuestions: [
      "Are the road camps full members, or useful until they are not — and who gets to decide?",
      "What does the Compact do the first time one member signs a separate peace?",
    ],
  },
};

/**
 * A paragraph added to a faction's own dossier, in that faction's own voice,
 * recording what the filing means from where it stands.
 *
 * `guard` is a distinctive substring of the paragraph itself: present, the
 * patch has already landed and is skipped. The paragraph is inserted directly
 * before the entry's closing "Where they stand on the Drain" paragraph, which
 * is the last paragraph of every faction body in the bible.
 */
export type FactionBodyPatch = {
  slug: string;
  guard: string;
  paragraph: string;
  note: string;
};

export const bodyPatches: FactionBodyPatch[] = [
  {
    slug: "national-defense-directorate",
    guard: "the Directorate is not one organization but five",
    note: "the state's whole apparatus, named",
    paragraph:
      "On the political map the Directorate is not one organization but five: [[peninsula-expeditionary-army]] fighting for territory it no longer waits for orders to take, [[peninsula-coast-guard-authority]] holding the water the state still claims, [[abomination-containment-authority]] cleaning up what its own infusion regulations produce, [[drone-surveillance-bureau]] watching all three, and [[wardens-monster-hunter-guild]] — not soldiers, never soldiers, but chartered. The Warden charter is older than the Directorate and was inherited rather than issued: it names the Guild the legally sanctioned authority for supernatural hunting, bounty recovery, and creature extermination in territory where conventional military response is impractical. The Directorate renews it annually, has never once dared let it lapse, and knows precisely how much of the peninsula that document covers.",
  },
  {
    slug: "wardens-monster-hunter-guild",
    guard: "The charter is the Guild's whole relationship with the state",
    note: "chartered, never employed",
    paragraph:
      "The charter is the Guild's whole relationship with the state. Under it [[national-defense-directorate]] recognises the Wardens as the lawful authority for supernatural hunting, bounty recovery, and extermination wherever a battalion is the wrong tool — which, on this peninsula, is most of it. No Warden is a government employee, no lodge takes orders, and the annual renewal is a formality both sides treat as a negotiation. What the charter actually buys the Directorate is deniability with a receipt; what it buys the Guild is the right to work armed in territory where the state's own writ has quietly stopped running.",
  },
  {
    slug: "peninsula-expeditionary-army",
    guard: "the Army is still Directorate on the letterhead",
    note: "the wing that outgrew its banner",
    paragraph:
      "For all of that, the Army is still Directorate on the letterhead, and both sides need it to stay that way: [[national-defense-directorate]] needs a front that has not formally seceded, and the Army needs the supply chain, the licensed casters, and the legitimacy that comes with a flag. The arrangement holds because nobody has forced the question. Every officer above major has privately worked out what happens when somebody does.",
  },
  {
    slug: "peninsula-coast-guard-authority",
    guard: "the Authority is [[national-defense-directorate]]'s poorest",
    note: "the state's sea arm, underfunded",
    paragraph:
      "On paper the Authority is [[national-defense-directorate]]'s poorest branch and its most exposed: same ministry, same budget committee, a fraction of the tonnage, and the entire coastline. Directorate command treats sea patrol as a policing matter until something goes wrong offshore, at which point it is a defence failure. Authority captains have learned to read that pattern and file accordingly.",
  },
  {
    slug: "abomination-containment-authority",
    guard: "The Authority answers to the same government",
    note: "the state cleaning up after itself",
    paragraph:
      "The Authority answers to the same government whose regulations permit infusion in the first place, which is the contradiction its officers live inside: [[national-defense-directorate]] writes the dosage rules, fields the units that overrun them, and then dispatches containment when the seventh phase arrives. Nobody in the chain finds this strange any more. That is the part the newest officers cannot get past.",
  },
  {
    slug: "drone-surveillance-bureau",
    guard: "The Bureau's charter is a state charter",
    note: "state-corporate, filed to the state",
    paragraph:
      "The Bureau's charter is a state charter, its budget line sits inside [[national-defense-directorate]]'s, and its analytics contracts belong to corporations who read the same feeds a fortnight earlier. Officially the Directorate tasks it. Practically the Bureau sells selective blindness to whoever asks correctly, and the fastest way to learn which powers are truly aligned on the peninsula is to notice whose faces the queries never cover.",
  },
  {
    slug: "aegis-extraction-consortium",
    guard: "The Consortium is best understood as an economy",
    note: "the megacorporate empire, named",
    paragraph:
      "The Consortium is best understood as an economy rather than a company, and most of the peninsula's arcane industry lives inside it: [[helix-arcanobiotics]] turning purchased essence into soldiers and worse, [[cybernetic-ascendancy]] running on Aegis financing and Aegis patents with Aegis names on its governing board, [[meridian-arcane-institute]] insisting on academic independence right up until the invoices come due, and [[foundry-workers-union]] — whose members build the machines, hate the Consortium with total clarity, and cannot strike against anyone else without stopping the same lines. None of them are subsidiaries. All of them are downstream. Aegis has never needed to own a thing it could finance.",
  },
  {
    slug: "helix-arcanobiotics",
    guard: "Helix runs on [[aegis-extraction-consortium]] supply",
    note: "the lab inside the empire",
    paragraph:
      "Helix runs on [[aegis-extraction-consortium]] supply — the intake pens, the refinery output, the legal department that keeps the campuses licensed — and the Consortium runs its riskiest research at arm's length through Helix for exactly the reason the arrangement suggests. When a containment incident reaches a courtroom, the invoices show a customer relationship. The vat numbers show something else.",
  },
  {
    slug: "cybernetic-ascendancy",
    guard: "The Ascendancy is nobody's subsidiary",
    note: "financed, patent-bound, board-seated",
    paragraph:
      "The Ascendancy is nobody's subsidiary and says so at every salon, which is technically true and financially irrelevant. [[aegis-extraction-consortium]] money funded the first conversion clinics, Aegis patents cover the interface work every chapter depends on, Aegis supplies the rare materials, and Aegis names sit on the governing board. The movement's most uncomfortable internal question is not theological but structural: an ideology of total self-authorship, operating entirely on somebody else's licences.",
  },
  {
    slug: "meridian-arcane-institute",
    guard: "Meridian claims academic independence",
    note: "independence until the invoices come due",
    paragraph:
      "Meridian claims academic independence. [[aegis-extraction-consortium]] claims otherwise whenever the invoices are due, and the Institute's endowment — which still does not itemize — has never once let the argument reach a public hearing. Faculty describe the relationship in the passive voice: chairs are funded, expeditions are supported, certain conclusions are not pursued. The scholarship students, who read the procurement forms because nobody thinks to hide them from clerks, describe it in the active one.",
  },
  {
    slug: "foundry-workers-union",
    guard: "Every industry the Union organizes is an [[aegis-extraction-consortium]] industry",
    note: "a wing that despises its banner",
    paragraph:
      "Every industry the Union organizes is an [[aegis-extraction-consortium]] industry, which is the whole tragedy of it: the plants, the sigil lines, the refinery yards, and the harbour cranes are all somewhere in the Consortium's supply chain, so the Union cannot strike against the state, a trade house, or a cartel without stopping Aegis lines first. That makes the Union part of the Consortium's world in exactly the way a river is part of the dam. Union leadership loathes the arithmetic and repeats it constantly, because it is also the only leverage the builders of everything have ever had.",
  },
  {
    slug: "tropic-pearl-trade-house",
    guard: "Pearl is not a company so much as a bloc",
    note: "the commercial and maritime bloc",
    paragraph:
      "Pearl is not a company so much as a bloc: merchant houses, shipping combines, port authorities it owns in everything but name, privateers on retainer, resource brokers, and [[iron-saints-pmc]], whose contracts have been renewed continuously for long enough that the distinction between a retained contractor and a standing army is a question for lawyers. The House prefers it that way. A trade house with an army is a political problem; a trade house with a supplier is a line item.",
  },
  {
    slug: "iron-saints-pmc",
    guard: "[[tropic-pearl-trade-house]] retainer is the largest",
    note: "the retainer, and clause 12",
    paragraph:
      "[[tropic-pearl-trade-house]] retainer is the largest and longest the Saints have ever held, which on the political map files them squarely inside Pearl's sphere and inside its enemies' targeting priorities. The Saints regard this as a contractual state rather than an allegiance, and clause 12 is still clause 12: the compliance auditor decides what it means today, and the House has never once been given cause to test what it means tomorrow. Every other power on the peninsula has done the arithmetic on what it would cost to outbid.",
  },
  {
    slug: "stormglass-cartel",
    guard: "What the Cartel actually rules is broader than lanes",
    note: "the underworld it actually rules",
    paragraph:
      "What the Cartel actually rules is broader than lanes and artifacts: relic thieves, narcotic runners, unlicensed extraction crews, gate operators, bought officials, and — at arm's length and with visible distaste — [[black-tithe-syndicate]], whose cargo Stormglass will not carry and whose money it takes anyway. The Cartel's authority in that world is not organizational but economic. Everything moves through water somebody controls, and on these islands that is Stormglass.",
  },
  {
    slug: "black-tithe-syndicate",
    guard: "pays [[stormglass-cartel]] when it is convenient",
    note: "independence, asserted",
    paragraph:
      "The Syndicate pays [[stormglass-cartel]] when it is convenient, steals from it when it is profitable, and insists in every room that this arrangement constitutes independence. The Cartel's own view is simpler and mostly unspoken: the lanes are Stormglass lanes, the harbours are Stormglass harbours, and a franchise that cannot move its cargo is a philosophy. Both organizations find the relationship humiliating for different reasons, and neither has yet found it unprofitable.",
  },
  {
    slug: "concordance-of-natural-casters",
    guard: "The Concordance is the political body of the born",
    note: "the political voice, with a militant wing",
    paragraph:
      "The Concordance is the political body of the born, and [[liberation-of-the-gifted]] is its argument with itself made flesh. Same safehouses, overlapping membership, the same funerals — and a strategic split that has never been resolved because both halves keep being right: the Concordance means to change the system from inside the institutions that hunt them, and the Liberation means to burn those institutions down. Network discipline holds them together. Every catcher raid tests it again.",
  },
  {
    slug: "liberation-of-the-gifted",
    guard: "The Liberation grew out of [[concordance-of-natural-casters]]",
    note: "the militant wing",
    paragraph:
      "The Liberation grew out of [[concordance-of-natural-casters]] and has never fully left it: its cells recruit through Concordance safehouses, its wounded recover in Concordance beds, and its leadership sits — under other names — in the same assemblies that formally disown it. The Concordance calls it a wing when it needs deniability and a faction when it needs distance. The Liberation calls the Concordance patient to the point of complicity, and keeps using its doors.",
  },
  {
    slug: "church-of-the-first-gift",
    guard: "[[sanctuary-of-living-beasts]] is the Church's hands",
    note: "the theological split with its own wing",
    paragraph:
      "[[sanctuary-of-living-beasts]] is the Church's hands in catcher country and its sharpest theological problem. Church doctrine holds that magical creatures are evidence of the First Gift — proof that power was once freely given, and therefore sacred to protect. The Sanctuary's handlers, who spend their nights with the creatures in question, have arrived somewhere else entirely: that creatures are not evidence of the Gift but recipients of it, equal to humanity and owed the same standing. Rome has not ruled. The Sanctuary has stopped waiting, and disobeys the diocese roughly as often as it obeys.",
  },
  {
    slug: "sanctuary-of-living-beasts",
    guard: "The Sanctuary runs on [[church-of-the-first-gift]] money",
    note: "the disobedient wing",
    paragraph:
      "The Sanctuary runs on [[church-of-the-first-gift]] money, moves through Church parishes, and is protected in court by Church lawyers — and disobeys Church leadership as a matter of routine, because the doctrine the funding comes with is not the doctrine the handlers hold. The Church venerates creatures as evidence of the First Gift. The Sanctuary treats them as recipients of it, equal to the people arguing about them, which makes every liberation run a small act of heresy and every diocesan audit an interesting conversation.",
  },
  {
    slug: "ossuary-covenant",
    guard: "The Covenant is less an order than a civilization",
    note: "the death-magic civilization",
    paragraph:
      "The Covenant is less an order than a civilization built on a single unfashionable premise, and most of the peninsula's corpse economy sits inside it: licensed chapters, unlicensed ones, grave-harvest crews, bone artificers, death-priests, battlefield scavengers, and [[bone-market-families]], who supply it and would object strenuously to the word *supply*. The Covenant does not command any of them. It sets the prices, keeps the archives, and holds the licences, which between them have always been enough.",
  },
  {
    slug: "bone-market-families",
    guard: "The Families are old money and [[ossuary-covenant]]",
    note: "the supply chain of the dead",
    paragraph:
      "The Families are old money and [[ossuary-covenant]] is the largest customer any of them have ever had — corpses for the chapters, relics for the archives, discretion for both. Filing them beneath the Covenant on anyone's political map offends the Families deeply, since their houses predate its charters, and changes nothing about where the invoices go. They are the trade that the death-magic economy is built on, and trade has never once outranked the institution it feeds.",
  },
  {
    slug: "verdant-marsh-clans",
    guard: "the Clans signed [[the-free-peoples-compact]]",
    note: "founding member",
    paragraph:
      "After centuries of speaking to outsiders only through guides, the Clans signed [[the-free-peoples-compact]] — the defensive pact of the peninsula's free peoples — and brought to it the one thing no other member has: standing arrangements with the marsh itself. The Compact asks nothing of the pacts and offers something the Clans could never field alone, which is other people's rifles at the wetland edge when a catcher crew arrives. The elders who signed did so with visible reluctance, and the pact-keepers are still waiting to learn what the creatures make of it.",
  },
  {
    slug: "desert-nomad-compact",
    guard: "the caravan-mistresses brought their practice to [[the-free-peoples-compact]] intact",
    note: "founding member",
    paragraph:
      "When the free peoples met to sign, the caravan-mistresses brought their practice to [[the-free-peoples-compact]] intact: swear to no one, trade with everyone, and enforce exactly one law absolutely. That is the whole of what the new pact asks — its single article is the caravan rule written for a continent — which is why they signed it in an afternoon after arguing about water rights for four days. The desert now guarantees crossings for allies it would not previously have named.",
  },
  {
    slug: "mountain-holdfasts",
    guard: "the Holdfasts brought never again to a table",
    note: "founding member",
    paragraph:
      "In signing [[the-free-peoples-compact]] the Holdfasts brought never again to a table for the first time — and brought the passes with it, which is the reason the pact has a spine at all. Nothing reaches the interior without crossing ground the Holdfasts hold, and the reeves made sure that fact was in the founding article rather than merely true. Their militias train Compact volunteers now, in tactics learned entirely from turning back survey teams.",
  },
  {
    slug: "free-islander-league",
    guard: "The League carried Igit Island into [[the-free-peoples-compact]]",
    note: "founding member",
    paragraph:
      "The League carried Igit Island into [[the-free-peoples-compact]] as testimony, and the founding assembly listened to refugees for two full days before anyone discussed terms. What the League gains is ground — allies with mountains and marshes behind them, so an island is no longer alone when the great powers arrive. What it gives is the fleet, and the hardest political lesson the pact has: the islands were also alone because nobody inland thought their fight was theirs.",
  },
  {
    slug: "drifter-renegade-camps",
    guard: "Some convoys signed [[the-free-peoples-compact]]",
    note: "the camps that signed, and the ones that did not",
    paragraph:
      "Some convoys signed [[the-free-peoples-compact]] and became its fifth people; most did not, and a few would rob the ones that did. That is the truth of the Camps and always has been — they are a condition, not an organization, and no signature covers all of them. One camp shelters travellers and runs Compact dispatches through country nobody else can cross. The next camp along the same road is why travellers arm themselves. The Compact accepts both facts because the convoys that did sign hear everything, everywhere, first, and that has already been worth more than the pact's entire fleet.",
  },
  {
    slug: "crimson-choir",
    guard: "Four powers are certain they know who the Choir works for",
    note: "meaningful independence",
    paragraph:
      "Four powers are certain they know who the Choir works for, and all four are wrong. [[the-ashen-court]] reads the altars as tribute and prices the Choir accordingly. [[the-choir-below]] is assumed by half the peninsula to be its parent on the strength of a shared word. [[church-of-the-first-gift]] preaches it as the purest form of taken magic, organized. [[the-old-hunger]]'s cults claim the jungle altars as their own, and some of those altars now answer to something the Choir did not invite. The cabal has never corrected any of them. Being universally misfiled is the most effective protection a ledger of everybody's debts has ever had.",
  },
];

/**
 * Tino decided on 2026-08-20 what canon had deliberately left open. The
 * sentence that recorded the open question is replaced by one that records the
 * answer — in the entry's own voice, and only while the original is still
 * there, so a writer who has since rewritten the passage keeps their words.
 */
export const legionBodyPatch = {
  slug: "the-riftbound-legion",
  from: "Its relationship to the Court is unwritten — vanguard, rival, or instrument — and worth deciding slowly.",
  to: "Its relationship to the Court is settled: the Legion is the Court's instrument. The nobility decides where a wound is opened; the Legion is what marches through it, and it has never once been asked its opinion.",
};

/**
 * The faction map, redrawn. The old map was a flat list under six prose
 * headings; the new one carries the law the shelf now runs on and the tree it
 * produced, so a writer who opens the map learns the structure rather than
 * having to infer it from thirty-four dossiers.
 */
export const factionMapRewrite = {
  slug: "the-faction-map",
  /** The old body still carrying the six-bloc structure; the rewrite guard. */
  guard: "**State and military**",
  summary:
    "The full political landscape: thirty-six powers — ten majors, twenty-one wings that fly beneath them, four that answer to nobody, and the seat left open for the faction the players may one day found.",
  body: [
    "The peninsula and its islands are contested by thirty-six powers. This is the board, and one law governs how it is read.",

    "**Major does not mean important.** A major power is a geopolitical umbrella: something that can move the world's balance on its own. A wing flies beneath one — it lives inside that banner's economic, political, religious, territorial, or military sphere — and a wing may be more famous, more dangerous, and far more present in a player's story than the power above it. [[iron-saints-pmc]] will be on screen more often than [[tropic-pearl-trade-house]]. That is expected. Independence is reserved for what operates outside those spheres altogether.",

    "The tree is a political ecosystem, not a chain of command. Several wings below despise their banner and say so on their own pages; being inside a sphere is a fact about where the money, the ground, and the licences come from, never a statement of loyalty.",

    "**[[national-defense-directorate]]** — the official state military holding the peninsula\n- [[peninsula-expeditionary-army]] — frontline command fighting for territory and supply\n- [[peninsula-coast-guard-authority]] — sea patrols, rescue, and blockade\n- [[abomination-containment-authority]] — the quarantine force that may protect people or erase evidence\n- [[drone-surveillance-bureau]] — state and corporate surveillance of cities and roads\n- [[wardens-monster-hunter-guild]] — licensed hunters working under an inherited charter, never in uniform",

    "**[[aegis-extraction-consortium]]** — the magical-resource empire the harvest economy runs through\n- [[helix-arcanobiotics]] — labs creating infused soldiers and monstrosities\n- [[cybernetic-ascendancy]] — transhumanists on Aegis financing and Aegis patents\n- [[meridian-arcane-institute]] — the elite research university: public prestige, unitemized endowment\n- [[foundry-workers-union]] — industrial labor, inside the sphere and against it",

    "**[[the-free-peoples-compact]]** — the newest power: five free peoples, one article, no capital\n- [[verdant-marsh-clans]] — swamp communities with old creature pacts\n- [[desert-nomad-compact]] — caravans, survival experts, and relic guides\n- [[mountain-holdfasts]] — armed mountain towns and anti-corporate militias\n- [[free-islander-league]] — the smaller-island independence coalition\n- [[drifter-renegade-camps]] — the convoys that signed; the rest ride outside it",

    "**[[tropic-pearl-trade-house]]** — the commercial and maritime bloc that buys wars wholesale\n- [[iron-saints-pmc]] — soldiers, cyborgs, and security on the longest retainer in the trade",

    "**[[stormglass-cartel]]** — island smugglers ruling the illegal sea lanes and the artifact trade\n- [[black-tithe-syndicate]] — black-market harvesters and traffickers, independent when it suits them",

    "**[[floating-city-council]]** — the ruling bloc of the floating metropolis\n- [[skybridge-transit-authority]] — air lanes and floating-city access",

    "**[[the-ashen-court]]** — demon nobility pushing incursions through battlefield rifts\n- [[the-riftbound-legion]] — the organized demonic military, and the Court's instrument",

    "**[[concordance-of-natural-casters]]** — the secretive born-magic community protecting its own\n- [[liberation-of-the-gifted]] — the militant wing that means to burn the system down",

    "**[[church-of-the-first-gift]]** — worshippers of creature-gifted magic\n- [[sanctuary-of-living-beasts]] — the creature-rescue network that disobeys as often as it obeys",

    "**[[ossuary-covenant]]** — the death-magic civilization: the dead as labor, warfare, and secrets\n- [[bone-market-families]] — old-money crime supplying the corpse, relic, and necromancy trade",

    "**Answering to nobody**\n- [[the-old-hunger]] — the ancient predatory presence; not organized, only orbited\n- [[the-choir-below]] — the subterranean intelligence steering surface politics through dreams, cults, and possession\n- [[the-pale-embassy]] — supernatural diplomats representing something nobody has placed\n- [[crimson-choir]] — the blood-magic cabal that four powers have each confidently misfiled",

    "**And one seat left open:** the Player-Founded Faction — unlocked late in the campaign, when the players stop working for the map and start redrawing it. See [[the-long-game]].",
  ].join("\n\n"),
};
