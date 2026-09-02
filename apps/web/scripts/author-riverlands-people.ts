import "../lib/environment";
import { getPrismaClient, type Prisma } from "@habitat/db/client";
import { characterMetaSchema } from "../lib/story-meta-schemas";

/**
 * The Riverlands living-world pass, part one: the people.
 *
 * Nine CHARACTER dossiers for the ground the foundation pass laid. Commander
 * Alder Wade lands CANON (owner-ruled name and office); everyone else lands
 * PROPOSED under the first-writer-owns convention the trainer roster set.
 * Wade is ALIVE on every sheet — the Statue belongs to the-fuse-at-heartland
 * thread and nothing here spends it.
 *
 *   pnpm --filter @habitat/web exec tsx scripts/author-riverlands-people.ts [--apply]
 */

type CharacterSeed = {
  slug: string;
  title: string;
  status: "CANON" | "PROPOSED";
  summary: string;
  body: string;
  meta: Record<string, unknown>;
};

const person = (seed: CharacterSeed) => seed;

const baseMeta = {
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
};

const cleanMagic = { origin: null, schools: [] as string[], corruptionPhase: 0, notes: null };

const seeds: CharacterSeed[] = [
  person({
    slug: "alder-wade",
    title: "Commander Alder Wade",
    status: "CANON",
    summary:
      "Heartland's Commander and the keeper of the Standstill — the one man all five gate factions find more useful standing than gone, and the wharves call him Old Wade to his face.",
    body: `Alder Wade holds the chair at [[heartland]]'s courthouse under a title with no war behind it, which is the whole city in one word — and both his names are river words: alder is the bankside tree whose timber holds up bridges underwater, a wade is a crossing on foot. The wharves worked that out two days into his tenure and have called him Old Wade to his face ever since. He answers to it. He answers to almost anything, which people mistake for softness for exactly as long as he lets them.

His method is arithmetic worn as manners. Wade has kept the Standstill not by strength — the Watch could not stop any one gate faction, let alone five — but by being, personally and deliberately, the cheapest option on everyone's books: the man whose standing there makes reaching for the city more expensive than trading through it. He knows the tariff schedules of all five wharves from memory, and he has settled more near-wars with a freight rebate than the Watch has settled with pikes.

He walks the five wharves every day, in strict rotation, never twice in the same order — so nobody can read a ranking into it. That is the most Wade thing he does, and the city knows it: the walk is the Standstill, performed daily, on foot, by an old man everyone pretends not to be reassured by. The pact's anniversary is coming, and the five factions are jointly commissioning a statue of him, splitting the cost five ways. He has asked them, in writing, not to. They are doing it anyway.

Years ago — the file is dated and the date is nothing, an ordinary morning between two wharf walks — he walked down to the Forge hall himself and filed a do-not-reconstruct: his own hand, [[brother-aster]] as witness, his schematic withdrawn from the city's Core ([[reclamation]]). He told no one. The clerk who took it files by name and not by date, so it sits in the same folder as the letter asking the factions not to build the statue, and anyone who ever turns the two up together will read a warning into an old man's paperwork. There is nothing in it but the plain thing: Old Wade has been coming back for a very long time, he has had enough of it, and he would like the machine to let him stop. He is not unhappy. He walks the wharves every morning and means it. Both are true at once, and a writer who cannot hold both at once should not write him.

For writers: Wade is alive, and every dossier keeps him that way — what ends him belongs to [[the-fuse-at-heartland]] and is spent nowhere else. Write him tired, precise, unhurried, and funnier than he lets anyone confirm. His fear is not dying — he settled that in writing years ago; it is that the city believes the Standstill is him, and that the city might be right.`,
    meta: {
      ...baseMeta,
      fullName: "Alder Wade",
      aliases: ["Old Wade", "the Commander"],
      pronouns: "he/him",
      species: "human",
      age: "late sixties",
      appearance:
        "A big frame gone spare with age; river-weathered hands, a plain coat with no insignia but the chair's small brass pin, boots resoled rather than replaced. Looks like a retired barge master, which is the effect he cultivates.",
      voice:
        "Slow, dry, precise; asks questions he knows the answers to and waits. Funnier than he lets anyone confirm.",
      magic: cleanMagic,
      factions: [],
      home: "heartland",
      status: {
        known: "Commander of Heartland; keeper of the Standstill.",
        actual: "The pact's true foundation is his personal arithmetic: he keeps himself the cheapest option on all five factions' books. He has also, years ago and in his own hand, told the city's Forge not to rebuild him.",
      },
      relationships: [
        { character: "the-judge-of-heartland", who: "the Judge", type: "His counterweight: he keeps the peace cheap, she keeps it legal. They disagree in private so the city never sees it." },
        { character: "the-heartland-watch-captain", who: "the Watch captain", type: "His wall. He gives her fewer orders every year and she has noticed." },
        { character: "brother-aster", who: "the Resident", type: "The only soul who knows what he filed at the Forge. Aster has never mentioned it and never will, and Wade has never thanked him for that." },
      ],
      storyRole: "The keeper of the Standstill and the center of gravity of the Heartland arc's opening state.",
      model: "Regional authority figure; non-companion.",
      openQuestions: [],
    },
  }),
  person({
    slug: "the-judge-of-heartland",
    title: "The Judge of Heartland",
    status: "PROPOSED",
    summary:
      "Verity Lam, the Standstill's arbiter — the only office all five gate factions trust, because her rulings are the alternative to finding out.",
    body: `Verity Lam is the Judge of [[heartland]], and the office outranks the name so completely that half the city could not produce the name at all. The Judge is the Standstill's arbiter: the one bench where a dispute between gate factions can end without anyone counting spears, and the only office in the city all five factions trust — not because they love her, but because her rulings are the alternative to finding out, and everyone has done that arithmetic.

Her law is procedural to a degree that drives advocates to drink, and that is the design. Lam discovered early what every arbiter of an armed peace discovers: fairness is not enough, fairness must be *boring* — visible, slow, documented, and utterly without drama, so that no verdict ever feels like a coup. Her courtroom voice has put out more fires than the river. Her private opinion of the five factions is on file nowhere and legible to nobody, including, colleagues suspect, herself; she has ruled for and against every wharf in almost perfectly alternating measure, and only she knows whether that is chance.

She holds the courthouse escrow — the three land charters older than the pact — and has declined every offer for them across her whole tenure, always on the same procedural ground: no release condition has been met. She has never said what the release condition is. It is not clear anyone alive knows.

For writers: the Judge is the arc's hinge — she appoints the detective, and her bench is where the ruling lands. Until then, write her as the least dramatic person in every scene and let that be the drama. Her name is Verity; the day somebody uses it in court is a day something has gone badly wrong.`,
    meta: {
      ...baseMeta,
      fullName: "Verity Lam",
      aliases: ["the Judge"],
      pronouns: "she/her",
      species: "human",
      age: "fifties",
      appearance:
        "Small, immaculate, unhurried; robes cut plain, one pen. The stillness of someone who has decided that being unreadable is a public service.",
      voice: "Level, procedural, allergic to drama; the courtroom register never fully switches off.",
      voiceProfile: null,
      magic: cleanMagic,
      factions: [],
      home: "heartland",
      status: {
        known: "The Judge — arbiter of the Standstill, keeper of the courthouse escrow.",
        actual: "Her neutrality is a discipline, not an absence; nobody living has seen the ledger she keeps of what the pact actually costs.",
      },
      relationships: [
        { character: "alder-wade", who: "Commander Alder Wade", type: "Her counterweight: she keeps the peace legal, he keeps it cheap. They disagree in private so the city never sees it." },
      ],
      storyRole: "The pact's arbiter; appoints the player detective and presides over the ruling that ends the Standstill.",
      model: "Regional authority figure; non-companion.",
      openQuestions: ["What is the charters' release condition, and does anyone alive know it — including her?"],
    },
  }),
  person({
    slug: "the-heartland-watch-captain",
    title: "Captain of the Heartland Watch",
    status: "PROPOSED",
    summary:
      "Maren Odu, captain of the city's guard and levy — a career soldier who has never fought a war and drills as if one starts tomorrow, because she has read the same fuse as everyone else.",
    body: `Maren Odu captains the Heartland Watch: [[heartland]]'s own guard and levy, the only armed force inside the walls the Standstill permits, and the institution whose entire doctrine is a paradox — be strong enough that no gate faction fancies the city cheap, and never so strong that any of them feels answered. Odu inherited that doctrine, understood it in a week, and has spent her career walking its knife edge with a drill schedule.

She has never fought a war. Neither has her Watch — the pact is older than most of her roster — and she treats that fact the way a good engineer treats a dry levee: as a temporary condition deserving constant maintenance. Her companies drill for gate seizures, wharf fires, bridge denial, and riot, on rotation, to standards that make visiting professionals raise an eyebrow; her quiet obsession is the muster ledger, which she rebalances by hand whenever a wharf's hiring tilts the city's loyalties. Asked once, by a factor who should have known better, what she was drilling *for*, Odu answered with the city's whole truth: "The day the invoices stop being the weapons."

She is proud, precise, unsentimental about the factions, and privately devoted to Old Wade in the way soldiers are devoted to the officer who never wastes them — he gives her fewer orders every year, and she has noticed, and she has not decided what it means.

For writers: Odu and her Watch are the units the player can inherit if the ruling goes that way, and the arc should earn that: her respect is the recruitment mechanic. She does not follow winners. She follows people who count the city's dead before their own advantage.`,
    meta: {
      ...baseMeta,
      fullName: "Maren Odu",
      aliases: ["the Watch captain"],
      pronouns: "she/her",
      species: "human",
      age: "early forties",
      appearance:
        "Tall, parade-straight, West-African looks; armor kept to working shine, never ceremony. Carries the muster ledger herself rather than delegate it.",
      voice: "Clipped, exact, drops rank the moment competence shows; her praise is a duty roster with your name in a better position.",
      voiceProfile: null,
      magic: cleanMagic,
      factions: [],
      home: "heartland",
      status: {
        known: "Captain of the Heartland Watch.",
        actual: "Drills a war that has never come because she has read the fuse like everyone else — and unlike everyone else, she is responsible for the morning after.",
      },
      relationships: [
        { character: "alder-wade", who: "Commander Alder Wade", type: "The officer she would follow off the wall; his shrinking orders worry her more than any wharf." },
      ],
      storyRole: "The Watch is the player's possible first army; her respect is the recruitment mechanic.",
      model: "Regional military lead; non-companion.",
      openQuestions: [],
    },
  }),
  person({
    slug: "brother-aster",
    title: "Brother Aster",
    status: "PROPOSED",
    summary:
      "The Resident: a bound Echo who never left the Heartland Forge's Core, and teaches from inside it. The city's neutrality is quietly guarded by a teacher who cannot leave.",
    body: `Brother Aster is the reason people in [[heartland]] lower their voices in the Forge hall, and the reason they smile doing it. He is an Echo — a soul bound to the city's public [[the-soul-forge]] who was never reclaimed and never faded, resident in the Core itself — and he teaches. Ask a question near the Core and the light shifts; stay, and be taught, patiently, by a voice that arrives less like sound than like remembering something in someone else's cadence. The river folk call him the Resident. He has asked, mildly and for longer than the records go back, to be called Aster.

How long he has been in the Core is not known. Longer than the Forge hall's oldest ledger; longer, some argue, than the current building around it. What he was — monk, engineer, casualty, volunteer — he deflects with the same courteous maneuver every time: the question is interesting, and here is a better one, and an hour later the asker leaves knowing more about themselves than about him. What he knows about the machine he lives in he shares freely, which is its own quiet astonishment. What he knows about the older works beneath the city — the Forge hall's undercroft stair goes down to [[first-weir]] — he does not share, and the one subject on which Brother Aster goes silent is a fact every writer should hold like a lit match.

He is also the city's witness. A do-not-reconstruct is taken by whoever keeps the machine ([[the-soul-forge]]), and in Heartland that is Aster — which means the Resident has sat with a great many people on the worst morning of their lives and taken down, in their own words, the reason they would like to stop. He does not repeat them. He does not counsel against them, ever; asked why not, he says the question is interesting, and then does not answer it.

The character bible seats him as a ceiling teacher: Aster holds the Conduit ceiling *Call* — the discipline of reaching another mind — which he teaches, with unavoidable authority, as the thing he is. His standing lesson opens the same way for every student: "You are trying to speak at a distance. I am a distance. Speak."

For writers and artists: Aster has no body and is never depicted as a figure — he is light held in a Core, per the standing art direction, and scenes with him are scenes with a room. Write him kind, unhurried, and very slightly wrong in his tenses, as a man for whom "now" is a courtesy he extends to visitors.`,
    meta: {
      ...baseMeta,
      fullName: null,
      aliases: ["the Resident"],
      pronouns: "he/him",
      species: "human (an Echo — a bound soul resident in a Forge Core)",
      age: "unknown; older than the Forge hall's records",
      appearance:
        "None. He is light held in a Core — a shift in the machine's glow that visitors learn to read as attention. Never depicted as a figure.",
      voice: "Kind, unhurried, arrives like remembered speech; slightly wrong in his tenses, as if 'now' were a courtesy.",
      voiceProfile: null,
      magic: { origin: null, schools: [], corruptionPhase: null, notes: "An Echo in a Core is past the reach of the corruption ladder; the phase field is null the way NAG's is." },
      factions: [],
      home: "heartland",
      status: {
        known: "The Resident: the teacher inside the Heartland Forge's Core.",
        actual: "A bound Echo who was never reclaimed and never faded. On the old works beneath the city, he is silent — and it reads as choice.",
      },
      relationships: [
        { character: "alder-wade", who: "Commander Alder Wade", type: "He witnessed the Commander's refusal, and has never spoken of it to anyone — including the Commander." },
      ],
      storyRole: "Ceiling teacher (Conduit — Call); the Forge tour stop that teaches 'the Forge is the settlement'; the city's quietest guardian.",
      model: "Trainer roster: the Resident. Depicted as a Core, never a figure.",
      openQuestions: [
        "Who was Aster before the Core? He deflects; canon has not decided, and should not decide casually.",
        "Why is the one silence he keeps the works beneath the city? (Glimpse discipline — the silence is the canon.)",
      ],
    },
  }),
  person({
    slug: "cassia-verne",
    title: "Factor Cassia Verne",
    status: "PROPOSED",
    summary:
      "Aegis's ranking factor at Clearinghouse — the politest ledger on the money river, who settles wars the way other people settle invoices, and vice versa.",
    body: `Cassia Verne runs [[clearinghouse]] for [[aegis-extraction-consortium]], which makes her the ranking power on [[arcadia-gate]] and, by most sober accounts, the second-most consequential person in the Riverlands after Old Wade — a comparison she would call flattering, inaccurate, and useful, in that order. She is the Consortium's model product: immaculate, reasonable, and fluent in the dialect where a war is a cost overrun and a blockade is an invoice with troops.

Her genius is settlement. Verne has ended piracy on the lower river twice — not with patrols, with pricing — and her standing instruction to her clerks is the closest thing Aegis has to poetry: *make honesty the cheap option.* She audits [[halfload]] personally, catches something every time, is caught by Halfload in turn, and regards the standing draw between them as the healthiest relationship on the leg. Her wharf's hospitality at [[velvet-reach]] is famous and precise: nothing she serves you is free, and nothing she learns over supper is wasted.

What Verne wants from [[heartland]] is what Aegis wants, said gently: the throat of continental trade as a line item. She is in no hurry. She has read the Standstill the way she reads every contract — for the exit clauses — and she is quietly certain the pact's ending is priced wrong by everyone else in the city.

For writers: Verne is the tour's economy teacher and the most dangerous kind of antagonist-adjacent character — one who is genuinely, provably fair inside a frame whose fairness is the weapon. She never lies. Check the definitions.`,
    meta: {
      ...baseMeta,
      fullName: "Cassia Verne",
      aliases: ["the Factor"],
      pronouns: "she/her",
      species: "human",
      age: "late thirties",
      appearance:
        "Polished and deliberate: tailored river-coat in Aegis grey, striking, unhurried; the kind of composure that makes a room reorganize itself.",
      voice: "Warm, exact, contractual; speaks in settlement terms and lets you discover the definitions later.",
      voiceProfile: null,
      magic: cleanMagic,
      factions: [
        { faction: "aegis-extraction-consortium", role: "ranking factor, Arcadia Gate", standing: "the Consortium's model officer; watched for bigger things" },
      ],
      home: "clearinghouse",
      status: {
        known: "Aegis's ranking factor at Clearinghouse; the power on the money river.",
        actual: "Certain the Standstill's ending is priced wrong by everyone else, and patient enough to be right.",
      },
      relationships: [
        { character: "alder-wade", who: "Commander Alder Wade", type: "Mutual professional regard conducted entirely through tariff schedules; each considers the other the city's best argument." },
      ],
      storyRole: "The tour's trade-and-economy stop; Aegis's face on the leg and in the arc.",
      model: "Per-leg voice: Arcadia Gate.",
      openQuestions: [],
    },
  }),
  person({
    slug: "ottar-kolm",
    title: "Brakemaster Ottar Kolm",
    status: "PROPOSED",
    summary:
      "The Holdfast brakemaster of Winchworks — the man whose hand is on the lever that decides whether the mountains have a door, and who has never once been hurried.",
    body: `Ottar Kolm is the brakemaster of [[winchworks]], which on [[cliffgate]] means something between harbormaster, high priest, and the man with his hand on the region's throat: the great lifts run when Kolm says they run, and the [[mountain-holdfasts]] have organized a fair portion of their river politics around the fact that he cannot be hurried, bribed, or impressed. He inherited the levers from his mother, she from her father, and the family's teaching method is the leg's oldest joke — you may touch the brake when you have stood beside it long enough to hate it.

Kolm's authority is physical before it is political. He reads the ancient counterweights through the soles of his boots, hears a flawed cradle-chain two spans off, and has stopped the lifts on nothing but a feeling four times in his tenure — and been right four times, which on the mountain leg has made "Kolm's feeling" a unit of evidence courts will hear. His relationship to the machinery he serves is the Holdfast relationship to all [[the-waterworks]] iron, concentrated: total intimacy, zero inquiry. He maintains everything around the old works and nothing inside them, and if you ask him what is inside them he will look at you the way he looks at fog.

He speaks seldom, drinks once a year at [[chainsong]]'s chain-blessing, and holds one opinion about [[heartland]] loudly: the city forgets, between crises, that its food goes up and its ore comes down through one door — and the door has a doorman.

For writers: Kolm is the tour's defense lesson made flesh — a chokepoint with a conscience. If the mountains ever close, it will be his hand on the lever, and he will have been right or he will not sleep again; write him knowing both.`,
    meta: {
      ...baseMeta,
      fullName: "Ottar Kolm",
      aliases: ["the Brakemaster"],
      pronouns: "he/him",
      species: "human",
      age: "fifties",
      appearance:
        "Built like the machinery: broad, still, chain-scarred hands; Holdfast wool and a brakeman's harness worn smooth. Northern-pale under permanent gorge-shadow.",
      voice: "Sparse, low, final; sentences arrive like counterweights — slowly, and then completely.",
      voiceProfile: null,
      magic: cleanMagic,
      factions: [
        { faction: "mountain-holdfasts", role: "brakemaster of Winchworks", standing: "hereditary office; the Holdfasts' voice on the river in all but title" },
      ],
      home: "winchworks",
      status: {
        known: "Brakemaster of Winchworks; the lifts run when he says.",
        actual: "Has stopped the lifts on a feeling four times and been right four times; 'Kolm's feeling' is a unit of evidence on the leg.",
      },
      relationships: [],
      storyRole: "The tour's defense stop; the Holdfasts' face on the leg and the arc's chokepoint conscience.",
      model: "Per-leg voice: Cliffgate.",
      openQuestions: [],
    },
  }),
  person({
    slug: "cerise-mora",
    title: "Widow Cerise Mora",
    status: "PROPOSED",
    summary:
      "The Bone Market's voice at Charnel Lock — the Widow of the Lock, whose courtesy has buried harder people than her enemies, and whose ledgers have never been sold.",
    body: `Cerise Mora holds [[charnel-lock]] for the [[bone-market-families]], and the leg calls her the Widow of the Lock with a respect that has nothing to do with mourning: the widow's dress is the uniform of her office, worn the way a judge wears robes, and Mora has worn it through the tenures of three Heartland commanders. Whose widow she is — or whether she was ever anyone's — is a question the [[riftgate]] country stopped asking a generation ago, on the theory that the answer belongs to her the way everything at the Lock eventually does.

Her instrument is courtesy. Mora's welcome is genuine, her table is famous, her condolences are exact, and every gram of it is load-bearing: the Families' power on the leg runs on the certainty that the Lock is fair, discreet, and permanent, and Mora *is* that certainty, poured into black crepe. She grants audiences in the viewing rooms among the appraised dead, which visitors take for intimidation and regulars understand as the opposite — her honest office, conducted where her trade keeps its books open. The dead trade's real currency is what she guards: the Lock's record crypts, a century of who-bought-what that the Families have never sold at any price. People have tried to buy a page. People have tried harder than that. The crypts remain unsold, and Mora remains courteous, and the leg has drawn its conclusions about the order of those facts.

On [[heartland]] she holds the Families' long position: half the city owes them, the other half is behind on payments, and a war would be terrible for collections. The Standstill has no more sincere supporter — which she knows is not the same as a friend.

For writers: Mora teaches the tour's gray-economy lesson, and she is the arc's measure of the Families entire: never loud, never cruel where patient will do, and absolutely certain that everything — the city included — is eventually an estate to be settled.`,
    meta: {
      ...baseMeta,
      fullName: "Cerise Mora",
      aliases: ["the Widow of the Lock"],
      pronouns: "she/her",
      species: "human",
      age: "sixties, worn like fifty",
      appearance:
        "Black crepe as uniform, silver-white hair dressed high, striking still; rings on both hands, each one an estate somebody settled. Beauty run to authority.",
      voice: "Velvet over iron; condolences so precise they double as appraisals.",
      voiceProfile: null,
      magic: cleanMagic,
      factions: [
        { faction: "bone-market-families", role: "keeper of Charnel Lock", standing: "the Families' voice on the leg; which Family holds her charter is deliberately unclear" },
      ],
      home: "charnel-lock",
      status: {
        known: "The Widow of the Lock; keeper of the dead trade's river gate and its record crypts.",
        actual: "The crypts have never been sold and people have tried harder than money; the leg has drawn its conclusions.",
      },
      relationships: [],
      storyRole: "The tour's gray-economy stop; the Bone Market's face on the leg and in the arc.",
      model: "Per-leg voice: Riftgate.",
      openQuestions: ["Whose widow is she — or was she ever anyone's? The country stopped asking; canon may keep it that way."],
    },
  }),
  person({
    slug: "yusra-of-the-wells",
    title: "Yusra of the Wells",
    status: "PROPOSED",
    summary:
      "Keeper of the Standing Camp and its Forge — the elder who holds the wandering peoples' one fixed point, and carries what that costs them.",
    body: `Yusra of the Wells keeps [[standing-camp]] for the [[desert-nomad-compact]], which makes her the guardian of the caravan peoples' one paradox: the camp that never strikes, standing because a [[the-soul-forge]] cannot walk. The keeper clans have held that ground for generations, and Yusra is their elder — a small, sun-cured woman of formidable stillness who has watered feuding clans in silence, hosted the Compact's shouting assemblies without once raising her voice, and buried more of the desert's dead into the Forge's keeping than anyone living.

Her title is exact. Yusra keeps the wells — the Camp's water, inside the rings, the first thing any siege would want — and keeping water in the dry country is the root of every other authority she holds. Her law is [[sandgate]]'s law distilled: hospitality with arithmetic under it. Every guest is fed. Every feud pauses at her rings. Every kindness is counted, and the count is the Compact's true census — Yusra is said to know the standing debts of every clan in the interior, and to have never once written them down, which among a people who trust paper as far as they can carry it is the highest form of banking.

What she carries, and speaks of only at the fire with other keepers, is the cost of the fixed point: the wandering peoples are chained to one place by their dead, and every year the chain grows another link. She has heard every young rider's argument for moving the Camp — for somehow moving the unmovable — and she answers all of them the same way, by walking the ring where the Forge holds the Echoes of their grandmothers, and letting the argument finish itself.

For writers: Yusra teaches the tour's diplomacy and supply-line lesson, and she is the Compact's face in the arc — the power that wants nothing from [[heartland]] except that the water stay open, which the fuse makes the most expensive want in the city.`,
    meta: {
      ...baseMeta,
      fullName: "Yusra",
      aliases: ["Yusra of the Wells", "the Keeper"],
      pronouns: "she/her",
      species: "human",
      age: "seventies",
      appearance:
        "Small, sun-cured, desert-dark; indigo keeper-cloth, well-keys worn as jewelry, a stillness that reorganizes shouting rooms. Ages like the desert — slowly, and on her own terms.",
      voice: "Quiet, hospitable, arithmetic underneath; never raises her voice because she has never needed to.",
      voiceProfile: null,
      magic: cleanMagic,
      factions: [
        { faction: "desert-nomad-compact", role: "elder of the keeper clans; keeper of the Standing Camp", standing: "the Compact's anchor; her word waters or dries a route" },
      ],
      home: "standing-camp",
      status: {
        known: "Keeper of the Standing Camp and its wells.",
        actual: "Holds the unwritten ledger of every clan's standing debts, and the heavier ledger of what the fixed point costs a wandering people.",
      },
      relationships: [],
      storyRole: "The tour's diplomacy stop; the Free Peoples' face on the leg and in the arc.",
      model: "Per-leg voice: Sandgate.",
      openQuestions: [],
    },
  }),
  person({
    slug: "casmir-rew",
    title: "Director Casmir Rew",
    status: "PROPOSED",
    summary:
      "Meridian's director at Regulator Station — polished, reasonable, and never quite answering whose budget he spends; the held river's public face and its classified one.",
    body: `Casmir Rew directs [[regulator-station]] for the [[meridian-arcane-institute]], and he is very good at the part of the job the leg can see: the corridor runs, the river holds, the [[iron-saints-pmc]] invoice is paid on schedule, and the Director appears at [[gaugetown]]'s dial wall twice a season to be charming about calibration disputes he then does not resolve. He is polished, tireless, unfailingly reasonable, and he has perfected the administrator's deepest art — answering every question except the one asked.

The question asked, on [[stormgate]], is always some version of *whose budget is this* — because the Station's real budget is classified even from most of its own researchers, and Rew signs for all of it. He signs for the survey camp out at [[the-outfall]] that appears on no map. He signs for [[echo-fence]]'s transcripts, sealed to a tier his own people mostly do not hold. He signs, and he sleeps well, and colleagues who have known him longest say the sleeping well is the strangest thing about him — either the Director knows the answers are benign, or he has decided that not knowing is a form of service, and nobody can tell which, and Rew, asked directly, agrees warmly that it is an excellent question.

His private weather shows exactly once a year, at the [[farflicker]] recording house's annual review, where the flicker-rhymes that scan are tabled. Staff say the Director reads those pages standing up.

For writers: Rew teaches the tour's intel-and-assay lesson, and he is the arc's cleanest instrument for Meridian's double presence in the region — the public charter and the quiet camp. He never lies either; he curates. The difference between him and Cassia Verne is that Verne knows her frame is a weapon.`,
    meta: {
      ...baseMeta,
      fullName: "Casmir Rew",
      aliases: ["the Director"],
      pronouns: "he/him",
      species: "human",
      age: "late forties",
      appearance:
        "Institute-immaculate against corridor weather: storm coat over academic grey, silver at the temples, a listener's tilt of the head that photographs as sincerity.",
      voice: "Warm, articulate, curatorial; answers every question except the one asked, and agrees it was excellent.",
      voiceProfile: null,
      magic: cleanMagic,
      factions: [
        { faction: "meridian-arcane-institute", role: "Director, Regulator Station and the Stormgate charter", standing: "trusted with budgets his own researchers cannot see" },
        { faction: "iron-saints-pmc", role: "contract principal", standing: "the signature the garrison's invoice answers to" },
      ],
      home: "regulator-station",
      status: {
        known: "Director of Regulator Station; the held river's public face.",
        actual: "Signs for the Outfall camp and the Fence's sealed transcripts; whether he knows what he signs for is the leg's best question.",
      },
      relationships: [],
      storyRole: "The tour's intel stop; Meridian's face on the leg, and the thread between the Station, the Fence, and the survey camp.",
      model: "Per-leg voice: Stormgate.",
      openQuestions: ["Does Rew know what the sealed budgets buy — or has he decided that not knowing is a form of service? (Keep it undecidable on the page.)"],
    },
  }),
];

const db = getPrismaClient();

async function main() {
  const apply = process.argv.includes("--apply");
  const identity = await db.$queryRaw<Array<{ database: string }>>`SELECT current_database() AS database`;
  const actor = await db.user.findFirstOrThrow({ where: { role: "ADMIN", isActive: true }, orderBy: { id: "asc" }, select: { id: true } });

  const problems: string[] = [];
  const batch = new Set(seeds.map((s) => s.slug));
  const slugExists = async (slug: string) =>
    batch.has(slug) || Boolean(await db.storyEntry.findUnique({ where: { slug }, select: { id: true } }));
  for (const seed of seeds) {
    const parsed = characterMetaSchema.safeParse(seed.meta);
    if (!parsed.success) problems.push(`${seed.slug}: meta invalid — ${parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ")}`);
    for (const match of seed.body.matchAll(/\[\[([a-z0-9-]+)\]\]/g)) {
      if (!(await slugExists(match[1]!))) problems.push(`${seed.slug}: dead link [[${match[1]}]]`);
    }
    const meta = seed.meta as { factions?: Array<{ faction: string }>; relationships?: Array<{ character: string | null }>; home?: string | null };
    for (const row of meta.factions ?? []) if (!(await slugExists(row.faction))) problems.push(`${seed.slug}: unknown faction ${row.faction}`);
    for (const row of meta.relationships ?? []) if (row.character && !(await slugExists(row.character))) problems.push(`${seed.slug}: unknown relationship ${row.character}`);
    if (meta.home && !(await slugExists(meta.home))) problems.push(`${seed.slug}: unknown home ${meta.home}`);
  }
  if (problems.length) {
    console.error(JSON.stringify({ database: identity[0]?.database, FAILED: problems }, null, 2));
    process.exitCode = 1;
    return;
  }

  function stableJson(value: unknown): string {
    if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
    if (value && typeof value === "object") {
      return `{${Object.keys(value as Record<string, unknown>).sort().map((k) => `${JSON.stringify(k)}:${stableJson((value as Record<string, unknown>)[k])}`).join(",")}}`;
    }
    return JSON.stringify(value);
  }

  const plan: string[] = [];
  for (const seed of seeds) {
    const current = await db.storyEntry.findUnique({ where: { slug: seed.slug } });
    if (!current) {
      plan.push(`create CHARACTER ${seed.slug} [${seed.status}]`);
      if (!apply) continue;
      const created = await db.storyEntry.create({ data: {
        kind: "CHARACTER", slug: seed.slug, title: seed.title, summary: seed.summary,
        body: seed.body, meta: seed.meta as Prisma.InputJsonValue, status: seed.status, createdByUserId: actor.id,
      } });
      await db.storyRevision.create({ data: {
        entityType: "ENTRY", entityId: created.id, action: "CREATED", actorUserId: actor.id,
        summary: `Riverlands living world: filed ${seed.title}`,
      } });
      continue;
    }
    const same = current.body === seed.body && current.title === seed.title && current.summary === seed.summary
      && stableJson(current.meta) === stableJson(seed.meta) && current.status === seed.status;
    if (same) continue;
    if (current.body !== null && current.body !== seed.body && !current.body.startsWith(seed.body.slice(0, 40))) {
      plan.push(`SKIP ${seed.slug} (edited by hand)`);
      continue;
    }
    plan.push(`update ${seed.slug}`);
    if (!apply) continue;
    await db.storyEntry.update({ where: { id: current.id }, data: {
      title: seed.title, summary: seed.summary, body: seed.body, meta: seed.meta as Prisma.InputJsonValue,
      status: seed.status, version: { increment: 1 }, updatedByUserId: actor.id,
    } });
  }

  console.log(JSON.stringify({ database: identity[0]?.database, mode: apply ? "APPLY" : "PREVIEW", people: seeds.length, plan: plan.length ? plan : ["nothing to do"] }, null, 2));
}

main().finally(() => db.$disconnect());
