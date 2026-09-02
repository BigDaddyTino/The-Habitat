/**
 * The faith weave (owner order 2026-09-02: "weave and integrate the religions
 * into the world... do not unbalance the world"). Everything the pass writes,
 * as data: the stance every faction takes, the "## Faith" section appended to
 * its dossier, the keepers-and-ground section appended to each faith, the
 * "## What is kept here" paragraph on the places where a faith is visibly
 * practised, and the three new entries. `author-faith-weave.ts` applies it.
 *
 * Balance law observed throughout: no parent-tree edits, no new Great Power,
 * no points. The Congregation of the Bound joins the Institution tier beside
 * the Church, unscored by design. Three of the five Great Powers stay secular
 * and each sits on a devout population, which is the secular price working.
 */

// ── 1. Stances: the `faith` field ──────────────────────────────────────────
//
// null = secular or undeclared (the Faith Lane: "most are secular or merely
// observant, which is itself information"). A prose value is the schema's
// slug-or-prose allowance, used once, for a reserved faith.

export const STANCES: Record<string, string | null> = {
  // Great Powers
  "national-defense-directorate": null,
  "aegis-extraction-consortium": null,
  "tropic-pearl-trade-house": "the-old-roads",
  "floating-city-council": null,
  "ossuary-covenant": "the-ossuary-rites",
  // Institutions
  "stormglass-cartel": null,
  "church-of-the-first-gift": "the-first-gift",
  "the-congregation-of-the-bound": "the-forgefaith",
  // Wings
  "peninsula-expeditionary-army": "the-forgefaith",
  "peninsula-coast-guard-authority": "the-old-roads",
  "abomination-containment-authority": null,
  "drone-surveillance-bureau": null,
  "wardens-monster-hunter-guild": null,
  "foundry-workers-union": "the-forgefaith",
  "iron-saints-pmc": "the-forgefaith",
  "helix-arcanobiotics": null,
  "cybernetic-ascendancy": null,
  "meridian-arcane-institute": null,
  "skybridge-transit-authority": null,
  "sanctuary-of-living-beasts": "the-first-gift",
  "bone-market-families": "the-ossuary-rites",
  "black-tithe-syndicate": null,
  // Free Powers
  "the-free-peoples-compact": "the-old-roads",
  "desert-nomad-compact": "the-old-roads",
  "drifter-renegade-camps": "the-old-roads",
  "mountain-holdfasts": "the-old-roads",
  "verdant-marsh-clans": "the-first-gift",
  "free-islander-league": "the-first-gift",
  "concordance-of-natural-casters": "the-first-gift",
  "liberation-of-the-gifted": "the-first-gift",
  // Shadow
  "crimson-choir": "the-crimson-communion",
  "the-choir-below": null,
  "the-old-hunger": null,
  "the-pale-embassy": null,
  "the-ashen-court": null,
  "the-riftbound-legion": null,
  // Outside the tier table (Arcadia has no faction entry yet)
  "the-radiant-path": "its own revealed doctrine — a reserved faith of the Arcadia pass",
};

// ── 2. Faction dossiers: "## Faith" ─────────────────────────────────────────

export const FACTION_MARKER = "## Faith";

const F = (body: string) => `${FACTION_MARKER}\n\n${body}`;

export const FACTION_SECTIONS: Record<string, string> = {
  "national-defense-directorate": F(`The state has no faith and a chapel in every barracks. By statute the Directorate honours nothing — its officers swear to a constitution, its chaplaincy budget is a line for morale, and [[the-crimson-communion]] is proscribed outright as usury with a body count. By headcount it is the most devout army on the peninsula: the ranks keep [[the-forgefaith]], because the ranks are the people the Forge brings back, and [[the-congregation-of-the-bound]] holds its chapels inside Directorate Forge halls under a tolerance agreement nobody signed and nobody will end. The secular crown's price is paid here in the Directorate's own currency: every reserve shortfall is a religious event in the barracks before it is a logistics one in the ledger, and a garrison whose Forge fails does not merely lose its clock — it loses its parish.`),
  "aegis-extraction-consortium": F(`Aegis is secular the way a balance sheet is secular. It keeps no faith, tolerates every faith that lowers a cost, and suppresses the one that raises them: [[the-first-gift]] is a trespass problem in every concession the Consortium holds, because a congregation that calls extraction desecration stands between a refinery and its feedstock, and the legal department treats a chapel like a picket. The Consortium's quiet exception is [[the-forgefaith]]. Its plant floors are the [[foundry-workers-union]]'s, the Union's halls are chapels of [[the-congregation-of-the-bound]], and a workforce that treats reclamation as a sacrament accepts binding policy without negotiation — so Aegis funds the Sextons' stipends on the sites it owns and books them under safety. It has never once asked what it is buying. The price of the secular crown bites where the two meet: the concessions run on devout ground twice over, and neither congregation loves its landlord.`),
  "tropic-pearl-trade-house": F(`Pearl keeps [[the-old-roads]] as commercial policy, which is the only way Pearl keeps anything. The counting-houses observe every truce ground and guest-right on every route they finance, because the customs are what keep the routes open, and a trade house that breaks a well-truce is a trade house whose caravans stop arriving. The Old Roads' perk — route safety and diplomacy blessing everything moved — is worth more to Pearl than any tariff, and the price is the one Pearl finds hardest: a truce it signs holds even when breaking it would be profitable, and the crossroads are keeping count. The tension is inside its own bloc. [[iron-saints-pmc]] keeps [[the-forgefaith]], and a company chaplain who is a Sexton of [[the-congregation-of-the-bound]] does not always agree with a factor about which customs a contract is allowed to honour. Pearl's answer to the peninsula's other faiths is the answer of a house that hosts them all: the ledger keeps every faith's holidays, and charges for none of them.`),
  "floating-city-council": F(`A city that floats does not argue with anyone's gods; it charges them rent. The Council keeps no faith and tolerates all of them by ordinance, the [[church-of-the-first-gift]] and [[the-congregation-of-the-bound]] and the [[ossuary-covenant]]'s licensed chapter alike, each with a ward, a lease and a ballast allowance. The secular crown's price is real at altitude: the ground-born districts are devout in every direction, and the Council's morale arithmetic has a column for it. The one faith the city declines to license is [[the-crimson-communion]], not on principle but on physics — debt compounding on a platform that floats on maintenance projections is the kind of exposure the actuaries flagged decades ago. The councillor's private theology, insofar as one exists, is the ballast engineer's: the city was made to float by means the Council no longer fully understands, and some of the engineers have started attending church.`),
  "ossuary-covenant": F(`The Covenant is the keeper of [[the-ossuary-rites]] and the only Great Power that IS a faith: its chapters are parishes, its licences are rites, its lawyers are clergy, and the phrase "rest in peace" is a service tier. Its doctrinal war is the peninsula's oldest and quietest, and it is not with the [[crimson-choir]] — that feud is a professional insult, blood against bone. It is with [[the-forgefaith]]. The Rites hold that the dead owe work and the living owe honour, a debt collected across generations; the Bound hold that the dead come back on a platform and owe nothing but the Essence. To the Covenant a reclaimed body is a debtor who walked out of the courtroom, and the question of whether the Forge's returned owe a funeral is argued in every town that has both a chapter and a Forge hall. The Grand Advocate — the seat at the Covenant's head, reserved and unnamed — is whoever last won that argument in public. Its price is the one the Rites carry everywhere: the living hesitate, and a Covenant town grows slowly, with dignity, and fewer children than its neighbours.`),
  "stormglass-cartel": F(`The Cartel keeps no faith and rents to none; it is the most secular power in the war and the most superstitious. Its soldiers carve marks into magazines, its infusers dose before combat with something close to prayer, and its Forge halls — [[forward-camp-kestrel]]'s was one — have chapels because the soldiers built them, unbudgeted and unremarked. [[the-congregation-of-the-bound]] has never been invited and has never been evicted. What the Cartel forbids is the [[crimson-choir]] on its lanes, for the practical reason that a syndicate whose members owe blood to a creditor is a syndicate somebody else can call in; what it tolerates, at arm's length and with visible distaste, is [[black-tithe-syndicate]] brokering that paper anyway. Stormglass's real observance is the crystal, see [[stormglass]], and whether that is a faith is open lore with a long fuse.`),
  "church-of-the-first-gift": F(`The Church is [[the-first-gift]]'s keeper on the roster and, in the Faith Lane's terms, the Institution the peninsula's other powers court when they need the gifted to stand still. Its lane position is uncomfortable for a faith of gifts: it is the Church that venerates and, uncomfortably, collects, while [[verdant-marsh-clans]], [[free-islander-league]] and the [[concordance-of-natural-casters]] keep the same faith without a bishop and without a reliquary — and the Church's slow theological crisis is that the people who keep the Gift best are the ones who never asked it to.`),
  "the-congregation-of-the-bound": F(`The Congregation is [[the-forgefaith]] with a door and a ledger: the only body that keeps the faith on purpose. Its stance on the lane is written in its charter — it seats no throne and races nobody, holds chapels wherever a Forge stands, and serves whatever is in the congregation's interest at the time, which is always the same thing: that the Forge stays lit. Its price is the faith's — a parish without a platform is a parish without an altar — and its perk it gives away, because a realm whose people queue gladly for binding is a realm the Sextons already run the queue in.`),
  "peninsula-expeditionary-army": F(`The Army keeps [[the-forgefaith]] in the only way an army keeps anything: by attendance. It is the Directorate's frontline and therefore the Directorate's most reclaimed body, and the Sextons of [[the-congregation-of-the-bound]] walk its Forge halls with the chaplain's writ the state never quite issued. A column that has stopped waiting for orders has not stopped waiting for the platform, and the Army's doctrine of holding ground is, underneath, the faith's: a fort with a lit Forge is holy ground, and a fort whose Forge fails is abandoned before the order comes.`),
  "peninsula-coast-guard-authority": F(`The only state organ with a faith, and it is the sea's. The Authority keeps [[the-old-roads]] the way sailors have always kept them — rescue owed to any hull, truce at any anchorage, the drowned counted and named — and it keeps them against its own orders more often than the Directorate admits. A blockade the Guard runs will still take survivors off the ship it stopped; a Pearl privateer under a truce flag is a truce, and the Guard's incorruptible patches are exactly the patches where the customs are strongest. It is why the coast trusts the Guard when it trusts nothing else in uniform, and why the Directorate keeps the Guard underfunded: a faith that owes rescue to the enemy is expensive to command.`),
  "foundry-workers-union": F(`The Union is the largest lay body of [[the-forgefaith]] on the peninsula and does not think of itself as religious at all. It is the faith of the people who die at work — the sigil line, the blast pit, the crane yard — and who come back on a platform the company owns to work the next shift. Union halls double as chapels of [[the-congregation-of-the-bound]] because the same people built both, and the Sexton at a foundry is usually a shop steward's cousin. It is the reason the Union can strike against anything: a workforce that has been reclaimed a dozen times each does not fear the company's usual arguments, and a company that owns the Forge its workers pray to has noticed that ownership cuts both ways. The Union's radicals ask why the builders of everything own nothing; the Sextons ask, more quietly, who owns the platform.`),
  "iron-saints-pmc": F(`The Saints keep [[the-forgefaith]] on the invoice. Reclamation is a contract line, the company chaplain is a Sexton of [[the-congregation-of-the-bound]] on retainer, and a mercenary's faith is the machine that brings him back for the next renewal — which is why the name stuck, and why nobody in the company finds it funny. Their employer, [[tropic-pearl-trade-house]], keeps [[the-old-roads]] as policy, and the friction is real: a factor's truce binds the Saints' guns, and a Sexton's platform does not care whose customs the dead broke. Professionally withheld, like every other Saints opinion.`),
  "cybernetic-ascendancy": F(`The Ascendancy keeps no faith and is, in practice, [[the-forgefaith]]'s heresy with a clinic. The Forge never records chrome: a fully converted cell cannot be reclaimed, and the Ascendancy has turned that limit into a theology — the body is the only vessel, the platform is a crutch for the unimproved, and a death the Forge cannot undo is the first honest death on the peninsula. [[the-congregation-of-the-bound]] preaches against the Ascendancy by name, which is the only faith the Congregation preaches against at all. Aegis funds both, on different floors of the same building, and has not yet been asked to choose.`),
  "meridian-arcane-institute": F(`The Institute is secular by charter and studies faith as data. Its Forge-efficiency programme has [[the-forgefaith]]'s claim under instruments — congregations do bind faster and reclaim cheaper, and Meridian would like to know whether that is devotion or scheduling — and its ethics board has a file on the Sextons' platform ledgers it has never been shown. The Institute's people keep what they keep privately; its Regulator Station chapel, like its budgets, is sealed.`),
  "skybridge-transit-authority": F(`The Authority keeps no faith but enforces one. Its lanes run under [[the-old-roads]]' customs by regulation — safe crossing, no violence on a shuttle, the sky-truce at every dock — written into the ticket terms because the alternative was the customs enforcing themselves. A faith kept as a bylaw is still kept; the Authority's clerks have simply never been told.`),
  "black-tithe-syndicate": F(`The Syndicate keeps no faith and brokers all of them. Its most profitable paper is [[the-crimson-communion]]'s: Choir debt, restructured, resold, and collected by people the debtor never met — the Tithe is the reason the Choir's second collection so often comes from a stranger. It launders First Gift relics, fences Covenant contracts, and has a standing bounty on any Sexton's platform ledger, because a list of who has died how many times is a list of who is afraid of what. [[stormglass-cartel]] will not carry this cargo and takes the money anyway.`),
  "the-free-peoples-compact": F(`The Compact keeps [[the-old-roads]] because the Old Roads are the only faith five peoples can share: no doctrine, no clergy, no bishop to argue with, only the customs every one of them was already keeping. The bloc's single article — our land is not yours — is an Old Roads sentence. Two of its peoples keep something else besides. The [[verdant-marsh-clans]] and the [[free-islander-league]] hold [[the-first-gift]] without the Church, in creature pacts and fishing-village chapels older than the roster, and the assembly has ruled that the customs bind all five and the Gift binds whoever it was given to, which is the Compact's whole method: agree on the road and leave the rest at home.`),
  "desert-nomad-compact": F(`The caravan peoples keep [[the-old-roads]] as the desert keeps everything — by necessity, exactly, and without discussion. The well-truce is not a custom to them; it is the difference between a route and a grave, and the keeper clans enforce it with the only sanction the desert needs: a clan that fouls a truce is a clan the next well does not water. [[honest-well]] is the faith's plainest expression on the written map — feuds pause or hang — and [[yusra-of-the-wells]] at [[standing-camp]] is its plainest host, with a Forge in the one camp that never strikes and the Sextons of [[the-congregation-of-the-bound]] as her only permanent guests.`),
  "drifter-renegade-camps": F(`The convoys keep [[the-old-roads]] because a nation with no ground has nothing else to keep. Guest-right is the Drifters' entire law: a camp that takes you in owes you the night, and you owe it the road, and the deserters, refugees and criminals welded into a convoy stay welded because every one of them was once the guest. The Drifters are also, by attendance, the peninsula's most mixed congregation — a convoy carries a Sexton and a Covenant lawyer and a Choir debtor in the same truck — and the Old Roads are the only faith with a rule for that.`),
  "mountain-holdfasts": F(`The Holdfasts keep [[the-old-roads]] in the high-pass form: the door has a doorman, and the doorman owes the traveller the night. Pass-right in the mountains is survival written as hospitality, and [[chainsong]]'s forecast bells and [[winchworks]]' brake-law are customs before they are engineering. The mountains have their dead in them, and the Holdfasts' quiet exception is [[deadhaul]] — the stopped incline with the cars nobody unloads — which the mining towns treat as a grave under the customs' truce, and which [[the-congregation-of-the-bound]]'s Sextons are asked, politely and permanently, not to bless.`),
  "verdant-marsh-clans": F(`The clans keep [[the-first-gift]] without the Church, and kept it first. Their creature pacts are the faith in its oldest form — magic freely given by something that lives in the drowned country, honoured by the families who were given it — and no chapel was ever built because the gift itself is the altar. The [[church-of-the-first-gift]] regards the clans as saints who will not be canonised; the clans regard the Church as a congregation that reads about what they live in. [[nalia-reed]]'s working rule — knowledge that does not transfer ownership — is the marsh's theology in a sentence.`),
  "free-islander-league": F(`The islands keep [[the-first-gift]] in fishing-village chapels the [[church-of-the-first-gift]] built and the islanders own, which is the League's position on everything. The sea gives, the islands honour what it gives, and an island council that has kept a granting creature's den secret for three generations does not think of that as doctrine. It also keeps the sea's customs, which are [[the-old-roads]] by another name, and the League's militia skiffs have taken Coast Guard survivors off a boat they were shooting at an hour earlier, because the customs do not ask whose flag was up.`),
  "concordance-of-natural-casters": F(`The born keep [[the-first-gift]] the way the hunted keep a candle: lit, and covered. A natural caster is the Gift's living argument, and the Concordance's quarrel with the [[church-of-the-first-gift]] is the quarrel of the relic with the reliquary — the Church venerates the gifted, collects them, and calls it shelter; the Concordance hides them and calls it the same thing. Its members attend no chapel. Its forgers, [[the-paper-hand]] among them, have kept more of the faithful alive than the Church's missionaries, and the Concordance would like that noted somewhere the Church can read it.`),
  "liberation-of-the-gifted": F(`The Liberation is [[the-first-gift]]'s militant deacons, and it has stopped apologising for the theology too. Where the Church preaches that extraction is desecration, the Liberation acts on it — a catcher camp burned is a desecration answered — and it recruits from the Church's own fire-brand deacons, who arrive already believing everything but the body count. The [[church-of-the-first-gift]] has not excommunicated it, because the Church's doctrine is the Liberation's, and everybody at the table knows it.`),
  "crimson-choir": F(`The Choir keeps [[the-crimson-communion]] and is its only keeper by design: a faith organised like a bank has no branches it does not own. Its position on the lane is unique — every decent power suppresses it on principle, [[the-old-roads]]' customs owe it nothing, the [[ossuary-covenant]] finds it insulting and the [[church-of-the-first-gift]] preaches it as taken magic organised — and the Choir prospers anyway, because suppression is a recruitment condition. People come at the moment of desperation, and the moment of desperation is not a moment any power can outlaw. Its debt paper travels through [[black-tithe-syndicate]], which is how a Choir collection arrives from a stranger.`),
  "the-choir-below": F(`The Choir Below keeps no faith and seeds all of them. Its cults believe they invented themselves; its possessed sit in congregations of every roster faith and in the Sextons' queues; and the dreams it sends whole districts lean, always, toward human guilt — emptied lands, repentance, the extraction worker mortified. Writers should note the precision of the target: a mind beneath the peninsula that wants humanity convinced of its own blame is a mind with a use for every faith that already agrees.`),
  "the-old-hunger": F(`The Hunger is not on the roster and its cults are the sixth faith nobody names. [[the-faith-lane]] reserves the slot: a feeding calendar kept like a shipping schedule, a village that throws one net's catch back, a place the Ashen Court reroutes around. Whether that is worship or maintenance is the question the lane keeps permanently open, and no faction on the written map declares for it — which is, per the glimpse discipline, the point.`),
  "the-pale-embassy": F(`The Embassy keeps no faith and honours every custom. An envoy under an Old Roads truce keeps it to the letter, which is the Embassy's whole method applied to religion: the customs are a contract, and the Embassy has never broken a contract. [[the-old-roads]]' keepers find this more frightening than any violation would be.`),
  "the-ashen-court": F(`The Court keeps no faith of the roster's. It prices the [[crimson-choir]]'s altars as tribute, misreads the [[ossuary-covenant]]'s licensed dead as competition, and has never been observed to care what a Sexton believes — the platform's returned do not answer to rifts. What the demon nobility honours among themselves is unwritten and expensive, per the Court's own open questions.`),
  "the-riftbound-legion": F(`The Legion keeps what the Court keeps, which is nothing the roster names. Its bone engines are an insult to [[the-ossuary-rites]] by construction — dead raised with no contract and no honour — and the Covenant's investigators hunting off-book necromancy have, more than once, found a rift instead.`),
  "bone-market-families": F(`The Families bank [[the-ossuary-rites]] rather than keep them: the Covenant holds the faith, the Families hold the paper. A funeral that is a contract needs a counterparty, and every contract binding beyond the grave — [[redletter]] is where they are written — has a Family's seal at the bottom. Their quiet doctrinal position, never preached, is that [[the-forgefaith]]'s returned are the Rites' best customers, because a body that comes back keeps signing.`),
  "the-radiant-path": F(`The Path keeps a faith the roster has not written: its own revealed doctrine, a theocratic strand fused to a revolutionary one, demanding purity inside and accommodation outside. [[the-faith-lane]] holds the slot for it as a faith of the Arcadia pass — a perk and a price to be ruled when the city that hosts it is written — and until then the Path is the roster's reminder that the unwritten map brings its own gods.`),
};

// ── 3. Faith entries: keepers, ground and teachers ─────────────────────────

export const FAITH_MARKER = "## Keepers, ground and teachers";

const K = (body: string) => `${FAITH_MARKER}\n\n${body}`;

export const FAITH_SECTIONS: Record<string, { section: string; regionNotes: Array<{ region: string; note: string }> }> = {
  "the-first-gift": {
    section: K(`**Keepers.** The [[church-of-the-first-gift]] keeps the Gift on the roster and the [[sanctuary-of-living-beasts]] is its hands. Four peoples keep it without a bishop: the [[verdant-marsh-clans]] in creature pacts older than the Church, the [[free-islander-league]] in fishing-village chapels it owns, the [[concordance-of-natural-casters]] as the hunted keep a candle, and the [[liberation-of-the-gifted]] as its militant deacons. The faith's slow crisis is that the people who keep it best never asked it to.

**Ground.** The marsh, the islands, the jungle parishes; on the written map, [[the-living-marsh]] and the granting creatures' dens the clans and councils keep secret. [[aegis-extraction-consortium]] suppresses it in every concession, which is where its shrines are most crowded.

**Teachers.** The jungle-parish priest who lies about where a creature dens; the gifted saint who never asked to be worshipped; [[nalia-reed]]'s working rule that knowledge does not transfer ownership. A crown adopting the Gift is taught by whoever gave it something first.`),
    regionNotes: [
      { region: "the-living-marsh", note: "Kept in its oldest form: the clans' creature pacts, honoured by the families who were given them; no chapel, the gift is the altar." },
      { region: "port-arcadia", note: "Church chapels in the fishing quarters and the Sanctuary's runs through the harbour; suppressed on every Aegis concession, crowded for the same reason." },
    ],
  },
  "the-ossuary-rites": {
    section: K(`**Keepers.** The [[ossuary-covenant]] keeps the Rites and is the only Great Power that is a faith; the [[bone-market-families]] bank them — the Covenant holds the faith, the Families hold the paper. Its clergy are necromancy-school casters, bone-archivists and corpse-contract lawyers, and the seat at its head, the Grand Advocate ([[the-grand-advocate]]), is reserved for whoever last won the argument about the Forge's dead in public.

**Ground.** Every town with a licensed chapter and a Family seal. On the written map the Rites run the relic leg: [[riftgate]], [[charnel-lock]] under [[cerise-mora]], [[mourners-ferry]] where the bell tolls per passenger, [[redletter]] where contracts bind beyond the grave, and [[wakewater]].

**The doctrinal war.** Not with the [[crimson-choir]] — that is a professional insult, blood against bone. With [[the-forgefaith]]: the Rites hold that the dead owe work and the living owe honour, and a reclaimed body is a debtor who walked out of the courtroom. Whether the Forge's returned owe a funeral is argued in every town that has both a chapter and a Forge hall, and a crown that keeps the Rites will be asked to rule on it.`),
    regionNotes: [
      { region: "riftgate", note: "The relic leg is Rites country: the Families' seals, the Covenant's chapters, and the bell at Mourner's Ferry tolling once per soul aboard." },
      { region: "redletter", note: "Where the contracts that bind beyond the grave are written and notarised; the Rites as paperwork, which is how the Rites prefer it." },
      { region: "mourners-ferry", note: "The bell per passenger is a Rites observance and an Old Roads one at once: the dead counted, the crossing honoured." },
    ],
  },
  "the-forgefaith": {
    section: K(`**Keepers.** [[the-congregation-of-the-bound]] keeps the Forgefaith on purpose — the only body that does — with a Sexton at every Forge it can reach and a platform ledger in every chapel. Its lay bodies are the people who die for a living: the [[foundry-workers-union]] (the largest congregation on the peninsula, which does not think of itself as religious), [[iron-saints-pmc]] (the faith on the invoice) and the [[peninsula-expeditionary-army]] (the faith by attendance). No Great Power keeps it; three tolerate it in their own Forge halls, and [[aegis-extraction-consortium]] pays the Sextons' stipends under safety. The largest congregation and the smallest throne.

**Ground.** Wherever a Forge stands — which is the faith's law and its price. On the written map: the Heartland Forge under [[the-sexton-of-heartland]], with [[brother-aster]] in the Core it serves; [[forward-camp-kestrel]]'s unbudgeted chapel; [[standing-camp]], the one camp that never strikes; the foundry towns.

**Heresies.** The whispered one — where ARE the dead between the falling and the platform — which the faith's whole discipline is not asking. And the loud one, the [[cybernetic-ascendancy]]: the Forge never records chrome, so the Ascendancy preaches the body as the only vessel and calls a death the Forge cannot undo the first honest death on the peninsula. The Congregation preaches against nothing else by name.

**Teachers.** A Sexton, anywhere; the Kestrel quartermaster who sequenced the platform ([[the-kestrel-quartermaster]]); and, at the ceiling, the Resident himself, who is the Forge and does not preach.`),
    regionNotes: [
      { region: "heartland", note: "The Forge hall is the parish church; the Sexton keeps the platform ledger and Brother Aster keeps the Core. Five faiths in the city, one of them in the machine." },
      { region: "standing-camp", note: "The desert's only permanent congregation: a Forge that cannot walk, the Sextons as the keeper clans' only permanent guests." },
      { region: "forward-camp-kestrel", note: "A chapel nobody budgeted, built by the soldiers around the Forge housing; the faith as the prologue found it." },
    ],
  },
  "the-old-roads": {
    section: K(`**Keepers.** No church, by the faith's own law; the Old Roads are kept by the peoples who would be afraid to stop. [[the-free-peoples-compact]] keeps them as the one faith five peoples can share — the [[desert-nomad-compact]]'s well-truce, the [[drifter-renegade-camps]]' guest-right, the [[mountain-holdfasts]]' pass-right. At sea the [[peninsula-coast-guard-authority]] keeps them against its own orders and the [[free-islander-league]] keeps them beside the Gift. And [[tropic-pearl-trade-house]] keeps them as commercial policy, because the customs are what keep the routes open — the roster's one Great Power adopter, bound by every truce it signs.

**Ground.** Every crossing, well and threshold. On the written map: [[honest-well]] under [[the-wellkeeper-of-honest-well]], where feuds pause or hang; [[standing-camp]] under [[yusra-of-the-wells]]; [[candlereach]]'s counted lights; [[mourners-ferry]]'s bell; the Five Gates of [[heartland]], which are a truce ground the size of a city.

**Teachers.** Hosts, not priests — a wellkeeper, a ferry bellkeeper, the keeper of a wayhouse. A crown adopting the Old Roads learns them from whoever last gave it the night, and is taught the price the first time it wants to break a truce and finds it cannot.`),
    regionNotes: [
      { region: "honest-well", note: "The faith's plainest expression: the one never-fouled well, feuds paused or hung at the wellhead, enforced by everyone present and nobody in particular." },
      { region: "sandgate", note: "The oasis corridor runs on the well-truce; the keeper clans water routes that keep it and dry the ones that do not." },
      { region: "candlereach", note: "One grave-candle per soul aboard; a dark barge is empty or lying. The custom as navigation." },
      { region: "heartland", note: "The Standstill is an Old Roads truce at civic scale, whether or not the five factions would call it one." },
    ],
  },
  "the-crimson-communion": {
    section: K(`**Keepers.** The [[crimson-choir]], and only the Choir — a faith organised like a bank has no branches it does not own. Its paper travels further than its clergy: [[black-tithe-syndicate]] restructures and resells Choir debt, which is how the second collection so often arrives from a stranger.

**Ground.** Wherever a door has closed. Candlelit salons in the great cities — [[velvet-reach]] has one, everyone knows, nobody says — and jungle altars, some of which have started answering back differently. No power licenses it; the [[floating-city-council]] declines on physics, the [[national-defense-directorate]] proscribes it by statute, and [[stormglass-cartel]] forbids it on its lanes for the practical reason that a syndicate whose members owe blood can be called in.

**Teachers.** The choir-mother who collects with genuine kindness and total finality. A crown adopting the Communion is taught the first miracle free and the second itemised, and is never taught by anyone angry.`),
    regionNotes: [
      { region: "velvet-reach", note: "The money river's parlour keeps a Communion salon behind the card tables; deals close after dark, and some of them are advances." },
    ],
  },
};

// ── 4. The lane itself: who keeps what ─────────────────────────────────────

export const LANE_MARKER = "## Who keeps what";

export const LANE_SECTION = `${LANE_MARKER}

The roster's keepers, as the faction sheets carry them (the faith field, both ways). **The Great Powers** split three secular to two faithful: the [[national-defense-directorate]], [[aegis-extraction-consortium]] and [[floating-city-council]] honour nothing and each sits on a devout population that makes it pay the secular price; [[tropic-pearl-trade-house]] keeps [[the-old-roads]] as commercial policy; the [[ossuary-covenant]] keeps [[the-ossuary-rites]] and is the one Great Power that is a faith. **The Institutions** hold two faiths outright — the [[church-of-the-first-gift]] and [[the-congregation-of-the-bound]] — while [[stormglass-cartel]] keeps nothing and forbids the Choir. **The Free Powers** keep the Old Roads as the one faith five peoples can share, with [[the-first-gift]] kept beside it, without a bishop, by the marsh, the islands and the born. **The Shadow Powers** keep nothing the roster names, and [[the-crimson-communion]] is kept by the [[crimson-choir]] alone.

**The largest congregation and the smallest throne.** [[the-forgefaith]] is kept by no Great Power and attended by more people than any other faith — the [[foundry-workers-union]], [[iron-saints-pmc]], the [[peninsula-expeditionary-army]], every Forge hall's queue. A faith that any war involves, held by wings on every side and by no crown, is the lane's balance working: nobody can seize it, and everybody depends on it.

**The doctrinal wars, for a crown to walk into.** The Rites against the Forgefaith over the dead (does a reclaimed body owe a funeral?). The Gift against the Rites over the workforce (is a raised crew blasphemy?). The Church against its own keepers over the gifted (relic, teacher, or captive?). The Old Roads against every secular contract (does a truce hold when breaking it pays?). The Communion against everyone, prospering. A realm adopting a faith inherits its quarrels on the first day.

**Reserved slots.** The [[the-old-hunger]]'s cults are the sixth faith nobody names; [[the-radiant-path]]'s revealed doctrine waits for the Arcadia pass; and every unwritten region brings its own gods, with a perk and a price to be ruled when its map is drawn.`;

// ── 5. Places: what is kept here ───────────────────────────────────────────

export const REGION_MARKER = "## What is kept here";

const R = (body: string) => `${REGION_MARKER}\n\n${body}`;

export const REGION_SECTIONS: Record<string, string> = {
  heartland: R(`Five faiths in the city and one of them in the machine. The Forge hall below the courthouse is [[the-forgefaith]]'s parish church in every sense that matters: [[the-sexton-of-heartland]] keeps the platform ledger — who came back, how many times — and [[brother-aster]] keeps the Core the ledger serves, which makes Heartland the only city where the congregation's clergy and the congregation's altar are on speaking terms. The five wharves keep the five gate powers' faiths at the customs' distance: the [[ossuary-covenant]]'s chapter on the Riftgate wharf, the Compact's hosts on the Sandgate one, a Communion salon nobody licenses, and the Standstill itself, which is [[the-old-roads]] at civic scale whether or not the factions would say so. Commander Wade's do-not-reconstruct sits in the Sexton's own folder, filed by name, and she has never once opened it in company.`),
  "mourners-ferry": R(`The bell tolls once per passenger, and two faiths hear it. To [[the-ossuary-rites]] it is the count — the dead named, the crossing invoiced, the Families' seal on the ferry's charter — and to [[the-old-roads]] it is the custom: a crossing honoured, a soul acknowledged, the ferryman owed the fare and the passenger owed the far bank. Nobody on the town's landing could tell you which faith the bell belongs to, which is the whole reason it has never been silenced.`),
  candlereach: R(`One grave-candle per soul aboard, floated as a buoy; a dark barge is empty or lying. The Reach keeps [[the-old-roads]] as navigation, and its people would be surprised to be told it was a faith. The Covenant's bone-archivists come to count the candles against the Ferry's bell some seasons, and the numbers do not always agree, and the town has an opinion about which count is the honest one.`),
  "honest-well": R(`The one well in the desert that has never been fouled, and the plainest ground [[the-old-roads]] hold anywhere: feuds pause at the wellhead or hang there, and the sanction is the only one the desert needs. [[the-wellkeeper-of-honest-well]] keeps the truce and the hanging both, and the village has never once asked her which she prefers. A crown that wants to learn what the customs cost is sent here first.`),
  redletter: R(`Where contracts binding beyond the grave are written, witnessed and sealed. Redletter keeps [[the-ossuary-rites]] as paperwork, which is how the Rites prefer to be kept: a funeral is a contract, a grave is an appointment, and the Families' notaries hold the seals. The town's quiet trade is the Forge's returned — a body that comes back keeps signing — and the argument over whether they owe a funeral is conducted here in the only language the Rites respect, in writing.`),
  "standing-camp": R(`The one camp in the caravan peoples' history that never strikes, because a Forge cannot walk — and so the desert's only permanent congregation. [[yusra-of-the-wells]] keeps [[the-old-roads]]' truce and the wells; the Sextons of [[the-congregation-of-the-bound]] keep the platform, and are the keeper clans' only permanent guests, which under the customs makes them the camp's most protected people and its least trusted. The two faiths have never quarrelled here. The desert does not have the water for it.`),
  "port-arcadia": R(`Every faith on the roster has an address in the harbour sprawl. The [[church-of-the-first-gift]]'s chapels stand in the fishing quarters and its [[sanctuary-of-living-beasts]] runs cargo with heartbeats through the same docks the [[black-tithe-syndicate]] moves Choir paper through; the [[foundry-workers-union]]'s crane yards are [[the-forgefaith]]'s largest single congregation; the [[ossuary-covenant]]'s licensed chapter raises the harbour's work-crews; and the [[peninsula-coast-guard-authority]] keeps the sea's customs off the breakwater against its own orders. The city's own doctrine, insofar as [[the-radiant-path]] has not yet written it, is the Arcadia pass's to rule.`),
};

// ── 6. New entries ─────────────────────────────────────────────────────────

export const NEW_FACTION = {
  slug: "the-congregation-of-the-bound",
  title: "The Congregation of the Bound",
  status: "CANON" as const,
  summary: "The Forgefaith's only organised keeper: Sextons at every Forge, a platform ledger in every chapel, and a congregation of everyone the machine has ever brought back — the largest faith on the peninsula and the smallest throne.",
  body: `Nobody founded [[the-forgefaith]]; the Congregation is what happened when the people who kept it wanted a door. It grew around Forge halls the way a parish grows around a well — first a ledger of who had come back and how many times, then someone to keep it, then a name for the keeper: **Sexton**, the old word for the one who keeps the graveyard and rings the bell, chosen because the Bound's graveyard is a platform and the bell is the sound of the reserve dropping. A Sexton keeps the platform ledger, sequences the queue when the Forge is behind, sits with the reclaimed in the first hour, and asks nothing. The not-asking is the office.

The Congregation seats no throne and races nobody. It holds chapels wherever a Forge stands — in [[national-defense-directorate]] barracks under a tolerance nobody signed, on [[aegis-extraction-consortium]] plant floors where the Consortium books the Sextons' stipends under safety, in [[stormglass-cartel]] camps where the soldiers built the chapel unbudgeted, and in [[heartland]]'s Forge hall under [[the-sexton-of-heartland]], the only Sexton whose altar talks back ([[brother-aster]]). Its lay bodies are the people who die for a living: the [[foundry-workers-union]], its largest congregation, which does not think of itself as religious at all; [[iron-saints-pmc]], the faith on the invoice; the [[peninsula-expeditionary-army]], the faith by attendance. No Great Power keeps the Forgefaith, three tolerate it inside their own walls, and everybody's war depends on it. That is the Congregation's whole position on [[the-power-balance]]: it serves whatever is in the congregation's interest at the time, and the congregation's interest is always that the Forge stays lit.

Its quarrels are two. With the [[ossuary-covenant]], the oldest and quietest doctrinal war on the peninsula: the Rites hold that the dead owe work and the living owe honour, and count a reclaimed body as a debtor who walked out of the courtroom; the Bound hold that the returned owe nothing but the Essence. Whether the Forge's returned owe a funeral is argued in every town with a chapter and a Forge hall, and [[redletter]] writes the settlements. With the [[cybernetic-ascendancy]], the faith's loud heresy: the Forge never records chrome, so the Ascendancy preaches the body as the only vessel and a death the machine cannot undo as the first honest death on the peninsula. The Congregation preaches against nothing else by name.

The whispered heresy it does not preach against, because it cannot: where ARE the dead between the falling and the platform. Every Sexton has been asked. The Congregation's whole discipline is the answer it gives, which is to sit with you in the first hour and say nothing, and its first seat — the First Sexton, reserved and unnamed — is held by nobody for long, because everyone who holds it eventually asks.

Characters to write here: the Sexton who keeps a barracks ledger and knows which names are about to stop appearing; the foundry Sexton who is also the shop steward's cousin and negotiates with the platform's owner; the Sexton on an Iron Saints retainer, blessing a reclamation the invoice already paid for; the one who opened Commander Wade's folder. See [[the-soul-forge]] for the machine and [[reclamation]] for the sacrament, and [[the-faith-lane]] for what keeping the faith buys a crown.`,
  meta: {
    scope: "Religious institution: the Forgefaith's only organised keeper",
    parent: null,
    power: null,
    seat: "wherever a Forge stands; no capital by charter",
    faith: "the-forgefaith",
    leaders: [] as string[],
    relations: [
      { faction: "foundry-workers-union", stance: "ally", notes: "The Congregation's largest lay body; union halls double as chapels and the Sexton is usually a steward's cousin." },
      { faction: "iron-saints-pmc", stance: "ally", notes: "A Sexton on retainer as company chaplain; the faith on the invoice." },
      { faction: "peninsula-expeditionary-army", stance: "ally", notes: "The faith by attendance; the Sextons walk the Army's Forge halls with a chaplain's writ the state never issued." },
      { faction: "ossuary-covenant", stance: "rival", notes: "The doctrinal war of the dead: does a reclaimed body owe a funeral? Argued in every town with a chapter and a Forge hall." },
      { faction: "cybernetic-ascendancy", stance: "enemy", notes: "The loud heresy: the Forge never records chrome. The only faction the Congregation preaches against by name." },
      { faction: "church-of-the-first-gift", stance: null, notes: "Two faiths that agree the world takes too much and disagree about what it gives back." },
      { faction: "national-defense-directorate", stance: null, notes: "Chapels in the barracks under a tolerance nobody signed and nobody will end." },
      { faction: "aegis-extraction-consortium", stance: null, notes: "Aegis pays the Sextons' stipends on its plant floors and books them under safety; it has never asked what it is buying." },
    ],
    goals: [
      "Keep every Forge lit, and a Sexton beside it.",
      "Keep the platform ledger honest: who came back, how many times, and never why.",
      "Sit with the reclaimed in the first hour and ask nothing.",
    ],
    gameTag: "KM · Institution · Faith (city-state)",
    openQuestions: [
      "Where ARE the dead between the falling and the platform? (Glimpse discipline — permanently open; the faith's discipline is not asking.)",
      "Will the Congregation ever ordain a machine? Brother Aster is the Forge and does not preach; the Sexton of Heartland has not asked him.",
      "Who holds the First Sexton's seat now, and how long before they ask?",
    ],
    independent: false,
  },
};

type CharacterSeed = { slug: string; title: string; status: "CANON" | "PROPOSED"; summary: string; body: string; meta: Record<string, unknown> };

const baseCharacter = {
  aliases: [] as string[],
  sex: null,
  age: null,
  background: null,
  professions: [] as string[],
  skills: [] as string[],
  cybernetics: [] as string[],
  involvement: [] as unknown[],
  gameId: null,
  relationships: [] as unknown[],
  openQuestions: [] as string[],
  companion: { capable: false, availability: "Regional non-companion character.", status: "Not recruitable." },
  magic: { origin: null, schools: [] as string[], corruptionPhase: 0, notes: null },
};

export const NEW_CHARACTERS: CharacterSeed[] = [
  {
    slug: "the-sexton-of-heartland",
    title: "Sexton Edda Brook",
    status: "PROPOSED",
    summary: "The Congregation of the Bound's Sexton at the Heartland Forge — keeper of the platform ledger, the only clergy on the peninsula whose altar talks back, and the woman who has never once asked the question everyone knows she wants to.",
    body: `Edda Brook keeps the platform ledger at [[heartland]]'s Forge hall: who came back, how many times, and never why. She is a Sexton of [[the-congregation-of-the-bound]], which means she keeps the graveyard and rings the bell, and in Heartland the graveyard is a platform under the courthouse and the bell is the sound of the reserve dropping a step. She sits with the reclaimed in the first hour. She sequences the queue when the Forge is behind, and the five wharves have learned that the queue is not for sale. She asks nothing, which is the office.

Her altar is [[brother-aster]], the Resident in the Core, and that makes her the only Sexton whose altar talks back — a fact the Congregation finds theologically inconvenient and Brook finds practical. They speak most days. He teaches the Conduit Call's ceiling from inside the machine; she keeps the ledger of everyone the machine has rebuilt; and the whispered heresy of [[the-forgefaith]] — where ARE the dead between the falling and the platform — sits between them like a folder neither opens. He is the one person alive who might know. She is the one person alive who could ask him and be answered. She has not. Everyone in the hall knows she wants to, and the not-asking is, by now, the most respected thing in the city.

Commander [[alder-wade]]'s do-not-reconstruct is in her folder, filed by name, with Aster as witness. She has read it once, the day it was filed, and never in company.

For writers: Brook is quiet without being soft, a working clergy in a working hall, funny in the dry register of someone who counts deaths for a living. Her voice on the lane is the Congregation's whole position said plainly: the Forge stays lit, the ledger stays honest, and nobody asks. Her scene is the first hour — a reclaimed body on the platform, the Sexton beside it, and the Resident's light steady on both of them.`,
    meta: {
      ...baseCharacter,
      fullName: "Edda Brook",
      aliases: ["the Sexton", "Sexton Brook"],
      pronouns: "she/her",
      species: "human",
      sex: null,
      age: "fifties",
      home: "heartland",
      storyRole: "The Forgefaith's voice in the Riverlands; keeper of the Heartland platform ledger; the Congregation's clergy beside the Resident.",
      status: { known: "Sexton of the Heartland Forge hall; keeps the platform ledger and the queue.", actual: "Holds Commander Wade's do-not-reconstruct and the one question the whole faith has agreed not to ask, and could ask it of the one being who might answer." },
      appearance: "Broad, grey-cropped, a river-worker's forearms under a Sexton's plain dark coat; a ledger-clip worn at the belt like a key; the stillness of someone used to sitting beside people who have just died and are about to be fine.",
      voice: "Dry, exact, low; says the reserve figure before anyone asks and the reclaimed's name after; never says the word 'soul'.",
      model: "The faith's clergy as working hall staff; the counterpart to Brother Aster's light.",
      factions: [{ faction: "the-congregation-of-the-bound", role: "Sexton of the Heartland Forge", standing: "the Congregation's most watched seat, because of who her altar is" }],
      openQuestions: ["Will she ask Aster? (Owner's call; the not-asking is load-bearing until then.)"],
    },
  },
  {
    slug: "the-wellkeeper-of-honest-well",
    title: "Anouk Sarr, the Wellkeeper",
    status: "PROPOSED",
    summary: "Keeper of the Honest Well — the one never-fouled well in the desert — who keeps the Old Roads' truce and the hangings both, and has never been asked which she prefers.",
    body: `Anouk Sarr keeps [[honest-well]], which is to say she keeps the plainest ground [[the-old-roads]] hold anywhere: the well that has never been fouled, the truce that pauses every feud at the wellhead, and the rope that hangs the ones that do not pause. She is not a priest; the Old Roads have none. She is a host. A caravan that reaches the well is owed water and the night, whoever it was fighting at noon, and a caravan that breaks that is owed the rope, whoever it is. Sarr has kept both for thirty years and the desert has never once asked her which she prefers, because the desert already knows the customs do not have a preference.

She is the [[desert-nomad-compact]]'s answer to a question the Compact does not like being asked: what does the well-truce actually cost. Her ledger is the desert's shortest — routes that keep the truce are watered, routes that do not are dry — and the keeper clans who hold [[standing-camp]] under [[yusra-of-the-wells]] send their young keepers to sit a season at the Honest Well before they are trusted with a route, to learn the customs where the customs are enforced by everyone present and nobody in particular.

For writers: Sarr teaches a crown what the Old Roads cost — she is the natural teacher for a realm that adopts the customs and then, one day, wants to break a truce because breaking it would pay. Her scene is the wellhead at noon: two feuding clans drinking from the same bucket in silence, and a woman in indigo who has not looked up from her mending.`,
    meta: {
      ...baseCharacter,
      fullName: "Anouk Sarr",
      aliases: ["the Wellkeeper"],
      pronouns: "she/her",
      species: "human",
      sex: null,
      age: "sixties",
      home: "honest-well",
      storyRole: "The Old Roads' teacher on the written map: the host who shows a crown what the customs cost.",
      status: { known: "Keeper of the Honest Well and its truce.", actual: "Keeps the rope as well as the water, and the desert's shortest ledger of which routes drink." },
      appearance: "Lean, sun-dark, indigo keeper-cloth like the Standing Camp clans', a coil of well-rope over one shoulder that nobody has ever seen her use for water; mends while she listens.",
      voice: "Unhurried, hospitable, final. Offers water before names and never asks what the feud was about.",
      model: "The Old Roads as enforcement without clergy; a host, not a priest.",
      factions: [{ faction: "desert-nomad-compact", role: "keeper of the Honest Well", standing: "the keeper clans send their young to sit a season with her before they are trusted with a route" }],
    },
  },
  {
    slug: "the-grand-advocate",
    title: "The Grand Advocate",
    status: "PROPOSED",
    summary: "The reserved seat at the Ossuary Covenant's head — the Grand Power's supreme leader, unnamed on purpose, held by whoever last won the argument about the Forge's dead in public.",
    body: `The seat at the [[ossuary-covenant]]'s head is a reserved slot on the roster: the Great Power's supreme leader, per the world game's law that each racing power has a named head, and one the first writer to need them will name. What is settled is the seat's shape. The Grand Advocate is not a high priest; the Covenant's clergy are lawyers, and its head is the lawyer who last won the argument that matters most to [[the-ossuary-rites]] — whether the Forge's returned owe a funeral — in public, against [[the-congregation-of-the-bound]]'s Sextons, in a town with both a chapter and a Forge hall. The seat changes hands when the argument is lost.

What the seat holds: the Covenant's licences and its unlicensed chapters both, the [[bone-market-families]]' seals at one remove, and the Great Power's position on [[the-power-balance]] — the Dead as an axis, a throne as a collection. What the seat fears: [[the-risen]], dead that rise answering something else, and the possibility that the argument the Advocate won is the wrong argument.

For writers: the slot exists, the shape is known, the first writer owns the name. Write the Advocate as the most reasonable person in any room and let the reader notice, by the second conversation, what they have agreed to.`,
    meta: {
      ...baseCharacter,
      fullName: null,
      aliases: ["the Grand Advocate"],
      pronouns: null,
      species: "human",
      home: null,
      storyRole: "Reserved: the Ossuary Covenant's supreme leader and the Rites' voice at the world's table.",
      status: { known: "Head of the Ossuary Covenant.", actual: "Reserved slot — shape known, name owned by the first writer to need it." },
      appearance: null,
      voice: "Graveside reasonable; wins arguments by making the other side's position sound like an oversight.",
      model: "The reserved-leader pattern (the-unnamed): seat exists, shape known, first writer names.",
      factions: [{ faction: "ossuary-covenant", role: "Grand Advocate — the Covenant's head", standing: "holds the seat until the argument is lost" }],
      openQuestions: ["Name, face and home: reserved for the first writer who needs the Covenant at the table."],
    },
  },
];
