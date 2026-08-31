import type { Layer } from "./character-bible";

/**
 * The other half of every connection the character bible made.
 *
 * A reference that only points one way is the shape of bug this codex has been
 * bitten by before: the races shelf existed with nothing in the world linking
 * into it, and a system named a dependency the depended-on system had never
 * heard of. Neither throws, neither shows in a screenshot, and neither is
 * visible from the writing side.
 *
 * So every person and every named piece the pass created gets an inbound link
 * from the place, faction or person it actually belongs to — written as a
 * sentence that dossier would want anyway, never as a "see also" list.
 *
 * Each carries its own marker, because these land on bodies that already have
 * design layers from other passes and must never cut one of those off.
 */
/**
 * The cut point every back-link shares.
 *
 * Deliberately the sentence opener rather than a whole phrase: these sentences
 * differ — *names*, *gives*, *files*, *puts*, *starts* — and a marker that only
 * matched some of them silently re-appended the rest on every run.
 */
const M = "\n\n**The character bible ";

export const backlinks: Layer[] = [
  {
    slug: "forward-camp-kestrel",
    note: "the command staff have names",
    marker: M,
    append: `

**The character bible names the command staff.** The four people [[the-unnamed]] reserved under Rook are drawn: [[the-kestrel-medic]], who is infused and further along the ladder than she has told anybody; [[the-kestrel-mechanic]], who read the island's load path a day before the ground went; [[the-kestrel-quartermaster]], a [[returnees]] who kept the count that said how many rounds the island had left; and [[the-kestrel-scout]], who called the rider's search pattern over [[shattermarket]] and was not believed in time. All four are proposed, not canon — whoever writes their first scene owns them.`,
  },
  {
    slug: "the-kestrel-commander",
    note: "the staff Rook commands, and the ceiling Rook holds",
    marker: M,
    append: `

**The character bible names the four who serve under them** — [[the-kestrel-medic]], [[the-kestrel-mechanic]], [[the-kestrel-quartermaster]] and [[the-kestrel-scout]] — and gives Rook one more job: the Command ceiling. *Written Defeat*, the technique that lets a line fall back intact after the horn, is Rook's to teach and nobody else's, because canon fixes them as still standing when everyone stops. See [[skills]].`,
  },
  {
    slug: "fort-tempest",
    note: "the battery officer, and what a spent case is worth",
    marker: M,
    append: `

**The character bible names the battery officer** — [[the-tempest-battery-officer]], the person whose call the evacuation channel turned on, and the one who can teach a fire mission that arrives a round early ([[skills]]). A spent case from that night is on the world's kit shelf as [[tempest-shell-case]]: no market, no broker, no price, and still a story.`,
  },
  {
    slug: "arcadian-soverign-guard",
    note: "the drill master, and the gate as a suspicion score",
    marker: M,
    append: `

**The character bible names a drill master here** — [[the-drill-master]], who only takes students who have already lost to him once and remembers every one of them. It also makes this Guard the first institution a player meets that keeps a score on them: [[suspicion]] runs highest at the gates, and a noise reading or an undeclared caster starts a file that the register never forgets.`,
  },
  {
    slug: "arcadian-special-intelligence-service",
    note: "the officer who teaches the thing nobody wants to learn",
    marker: M,
    append: `

**The character bible names an officer here** — [[the-asis-officer]], who is very good, entirely calm, and willing to demonstrate on somebody while you watch. She holds the Interrogation ceiling ([[skills]]), and she has a file on the player that says *inconclusive*, which is her favourite word.`,
  },
  {
    slug: "ashline-exchange",
    note: "the fixer who sells the fact that you asked",
    marker: M,
    append: `

**The character bible names a fixer working this junction** — [[the-ashline-fixer]], who will teach you *Credential* — a paper that works exactly once — and then sell the fact that you asked. Both halves are the arrangement, and she has never lied about the second one.`,
  },
  {
    slug: "drone-surveillance-bureau",
    note: "the analyst, and the score the Bureau actually sells",
    marker: M,
    append: `

**The character bible names an analyst** — [[the-bureau-analyst]], who trades a blind spot for one place the lattice *can* see you, on a day they choose. It also makes the Bureau's real product a mechanic: in [[suspicion]] every institution keeps its own score, and the Bureau's is the one that is for sale, which is why it is the score that follows a person between institutions.`,
  },
  {
    slug: "foundry-workers-union",
    note: "the foundry-master canon sketched, and the blast foreman",
    marker: M,
    append: `

**The character bible names two of the Union's own.** [[the-foundry-master]] is the old hand this dossier already sketched — the one who remembers what the plants built before the war and will not say — and he teaches the work and never the history. [[the-blast-foreman]] teaches demolition for nothing and expects you standing beside him at the next strike, which is the most expensive arrangement in the game. The Union's shops are also one of the three suppliers in [[cybernetics]], where canon's line about the cheap ones costing autonomy becomes a price.`,
  },
  {
    slug: "concordance-of-natural-casters",
    note: "the paper-hand, and what the network runs on",
    marker: M,
    append: `

**The character bible names the papers.** [[the-paper-hand]] — Auntie, no surname — has kept born casters alive with documents for twenty years, and teaches exactly one signature to anybody who first helps her move somebody. The network's other job is now mechanical too: in [[the-six-pillars]] every born caster begins as an unlicensed practitioner, and the Concordance is the reason that is survivable.`,
  },
  {
    slug: "tropic-pearl-trade-house",
    note: "a captured rider, written as a person",
    marker: M,
    append: `

**The character bible names a prisoner.** [[the-captured-rider]] is a captured Hypogriff rider who wants the animal back a great deal more than they want to be released, and who regards the party's insistence on staying at ground level as a strange personal choice. They are the entry point for writing Pearl as people rather than as a wave, which is what [[combat]]'s own rule asks for.`,
  },
  {
    slug: "cybernetic-ascendancy",
    note: "the clinic surgeon, and the thing the Ascendancy is wrong about",
    marker: M,
    append: `

**The character bible names a surgeon** — [[the-clinic-surgeon]], who genuinely heals and genuinely recruits and cannot tell which he is doing. It also settles what the movement's research finds: [[cybernetics]] shows that corruption cannot be engineered around, because it is not in the flesh — but every tell *is* expressed in tissue, so replacing enough tissue stops the tells appearing. The Ascendancy has built the finest corruption concealment ever devised and mistaken it for a cure, and its converts are both the proof and the refutation.`,
  },
  {
    slug: "stormglass-cartel",
    note: "the desk, and the range instructor",
    marker: M,
    append: `

**The character bible starts the game at a Cartel desk.** [[enlistment]] is a clerk asking four questions and issuing what the answers entitle you to, and the service file she opens is the character sheet for the rest of the campaign. On the mainland the Cartel also keeps [[the-range-instructor]], who charges by the hour, refuses anybody she thinks will be dead inside a month, and has been wrong twice.`,
  },
  {
    slug: "shattermarket",
    note: "the plate the title sequence cut a shard out of",
    marker: M,
    append: `

**The character bible names the plate.** The torso plate a medic cut a stormglass shard out of here — the one the game's title forms in the cracks of — is [[shattermarket-plate]], and the hole was strapped rather than replaced. Any Stormglass veteran recognises the cut, because everybody who was here that morning saw the same kind of hole in somebody.`,
  },
  {
    slug: "the-southside",
    note: "whose rifle is opening doors down here",
    marker: M,
    append: `

**The character bible names a rifle in the Southside.** [[the-southside-rifle]] was made by a Union foundry-master, carried through Kestrel and two reclamations, taken off its owner's body on a ridge, and sold to a broker down here — where it currently opens doors for somebody who did not earn them. Its owner is alive, and [[bone-market-families]] will tell him where it is for a favour.`,
  },
  {
    slug: "glassroot-observatory",
    note: "the case that is also an examination",
    marker: M,
    append: `

**The character bible names the case.** [[ansels-sample-case]] has held every family of adaptation catalogued in the Reach, and it is lent exactly once — to a student who brings it back full, labelled, with the sample that was taken wrong left in place so it can be pointed at. Returning it correctly is how the Handling ceiling is earned ([[skills]]).`,
  },
  {
    slug: "crimson-choir",
    note: "one page of an account, and why it is the frightening kind of object",
    marker: M,
    append: `

**The character bible puts one page of a Choir account into the world.** [[choir-ledger-page]] names a debt and its collateral in the Choir's own hand, and the Choir honours its paper to the letter regardless of who is holding it — which is what makes a document the most dangerous object on the kit shelf. The Choir is also the only certifying body in [[the-six-pillars]] that issues no licence at all: Hematic practice is certified by a debt.`,
  },
  {
    slug: "keira-ansel",
    note: "the ceiling she holds, and the case she lends",
    marker: M,
    append: `

**The character bible gives her students.** Dr Ansel holds the Handling ceiling — *Rung Read*, an animal's state on sight and what drove it there — and she teaches it the way she does everything else: she hands over [[ansels-sample-case]], expects it back full and correctly taken, and the one sample taken wrong is the lesson. See [[skills]].`,
  },
  {
    slug: "mara-quill",
    note: "the ceiling she holds",
    marker: M,
    append: `

**The character bible gives her students.** Mara holds the Navigation ceiling — *Agreement*, the technique of finding the crossing that moved, because a route is a recent agreement with the ground rather than owned ground. She teaches it by walking and not explaining, and the test is whether you noticed. See [[skills]].`,
  },
  {
    slug: "nalia-reed",
    note: "the ceiling she holds",
    marker: M,
    append: `

**The character bible gives her students.** Nalia holds the Survival Craft ceiling — *Marsh Sense*, predicting a coordinated response before the instruments confirm it — and it is not taught as a lesson. It is an agreement, spoken, about what will and will not be taken, and the technique arrives on its own once the agreement has been kept. See [[skills]].`,
  },
  {
    slug: "tomas-vey",
    note: "the ceiling he holds, and the limit that is the lesson",
    marker: M,
    append: `

**The character bible gives him students.** Tomas holds the Systems ceiling — *Interlock*, reversing an isolation command that was meant to be final — and his own limit is the whole teaching: he can authenticate terminology, never motive. He will show you what a system says and never guess why anyone wrote it. See [[skills]].`,
  },
  {
    slug: "jaro-fen",
    note: "the ceiling he holds",
    marker: M,
    append: `

**The character bible gives him students.** Jaro holds the Negotiation ceiling — *Close*, a contract that holds afterwards because both sides think they won. The lesson is a negotiation you lose to him, explained in writing afterwards, with the explanation itemised and charged for. See [[skills]].`,
  },
  {
    slug: "helix-arcanobiotics",
    note: "the people this wing produced, and the bloodline it wants",
    marker: M,
    append: `

**The character bible names what the wing produces.** [[chartered]] people are made here and reclassified as people by a document that can be challenged anywhere that did not issue it — and every [[reclamation]] of one is a reproduction of Helix intellectual property, which somebody eventually invoices. Helix also knows exactly what a [[carriers]] assay looks like: a body that conducts to nine is the ideal infusion subject, and the bloodline is a product line that has not been licensed yet.`,
  },
  {
    slug: "aegis-extraction-consortium",
    note: "the patents, and the number the assays are looking for",
    marker: M,
    append: `

**The character bible gives Aegis the number it is buying.** Conductivity is the one attribute an instrument can read ([[attributes]]), which is why an assay is a thing this trade wants performed on everybody, and why an *inconclusive* result on one of [[the-latent]] is the most interesting line an Aegis buyer ever sees. Aegis also holds the Bionic interface patents, so every clinic in [[cybernetics]] runs on its supply chain, and a licence to seat hardware is a licence to use Aegis's.`,
  },
  {
    slug: "bone-market-families",
    note: "what is in a body when it falls",
    marker: M,
    append: `

**The character bible gives the Families a new inventory.** A Forge rebuilds only meat, so every augment a person was wearing is still in the corpse when they walk out of a Core somewhere else ([[cybernetics]]) — a financed piece in a body is a debt with an address, and inherited debts are what these houses have always collected. They broker the three competing claims over a [[chartered]] corpse, and they are usually who reaches a body first in [[reclamation]]'s ninth step.`,
  },
  {
    slug: "ossuary-covenant",
    note: "which class the chapters license, and which nightmare is not theirs",
    marker: M,
    append: `

**The character bible files the Covenant's work as a licence class.** Reanimative sits under [[resonance]], licensed by chapter, and its master ability is testimony the Covenant's lawyers can make admissible. It also states the thing the chapters most want stated: [[the-risen]] are not Reanimative work. They rise with nobody in the room, which is exactly why they are the Covenant's nightmare rather than its product, and no licensed chapter should ever be written as the cause of one without the story knowing the charge is false.`,
  },
  {
    slug: "meridian-arcane-institute",
    note: "what the Institute certifies, now that there is a registry",
    marker: M,
    append: `

**The character bible gives the Institute a registry to run.** [[the-six-pillars]] organises magic into six fields and twenty-seven licence classes, and Meridian certifies across all of them — Licensed for a fee and a record, Certified with a practitioner, Master after a review that will ask about a candidate's corruption phase. Its assay is also the one that comes back *inconclusive* on [[the-latent]] and recommends retention, which is the horror in that species written in Meridian's own hand.`,
  },
  {
    slug: "abomination-containment-authority",
    note: "the two phases that are the ACA's whole job",
    marker: M,
    append: `

**The character bible gives the Authority its trigger.** In [[suspicion]] the ACA keeps a score like every institution, and it is the one that never forgets: a phase-five seen or a Turning reported brings a cordon team, tranquilliser doctrine and a sealed transport. At phase six they come for the person; at seven they come for what is left, and clean it before the family arrives. The Authority also owns Containment outright as a licence class under [[structure]].`,
  },
  {
    slug: "iron-saints-pmc",
    note: "what cyborg shock teams are made of, mechanically",
    marker: M,
    append: `

**The character bible gives the shock teams a body.** Saints wear cosmesis and show no tells at all, which makes them the cleanest-looking soldiers on any field and the most brittle in one specific way: ELECTRICAL vents chrome, and a minute of a limb that does not answer is a minute they cannot spend ([[cybernetics]], [[combat]]). They are also the standing military client for the augmentation trade, which is why their equipment bill is somebody else's revenue.`,
  },
  {
    slug: "field-infusion-rig",
    note: "the three grades, and who can run one past service",
    marker: M,
    append: `

**The character bible grades the rig.** [[kit]] gives it three: *standard*, which is this apparatus as canon describes it and which reads higher than it delivers — three lit, two delivered; *sealed*, which closes the leak and is honest until it breaks; and *conductor-grade*, built on [[gridcore-alloy]] buses in a [[reserve-glass]] frame, which reads true and counts as a rung of Conductivity the body never earned. The rig is a readout, a weak point an enemy can shoot mid-channel, and a thing that can lie — and [[the-infuser-tech]] is the one person who will show you how to run one past service, once, safely, so that you never do it twice.`,
  },
];
