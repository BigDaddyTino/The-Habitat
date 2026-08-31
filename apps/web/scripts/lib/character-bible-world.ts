/**
 * The Price of a Person — the world half of the character bible.
 *
 * Five peoples for the species shelf, six named pieces for the kit shelf, and
 * sixteen people the design produced: the teachers who lift a skill ceiling and
 * the command staff [[the-unnamed]] has been reserving since it was written.
 *
 * Everything here is created rather than appended, so the only law that matters
 * is the frozen-slug law: a slug written once is written forever. The runner
 * (`scripts/integrate-character-bible.ts`) previews before it writes, and
 * refuses to touch a slug that already exists as a different kind.
 *
 * Placeholder names are in the titles on purpose. The standing rule from
 * [[the-unnamed]] is that whoever names them, names them — these are drawn
 * enough to be castable and loose enough to be renamed by whoever writes their
 * first scene.
 */

export type NewCreature = {
  slug: string;
  title: string;
  summary: string;
  body: string;
  meta: { category: string | null; parent: string | null; biomes: string[]; threat: string | null; harvest: string | null; gameId: string | null; openQuestions: string[] };
};

export type NewItem = {
  slug: string;
  title: string;
  summary: string;
  body: string;
  meta: { category: string | null; rarity: string | null; origin: string | null; gameId: string | null; openQuestions: string[] };
};

export type NewCharacter = {
  slug: string;
  title: string;
  summary: string;
  body: string;
  /** PROPOSED, always. None of these people is canon until somebody writes a scene. */
  meta: Record<string, unknown>;
};

/** A complete CHARACTER sheet with every key at its empty value, so a partial
 *  spread below still validates. The schema rejects a sheet that omits a key. */
const person = (over: Record<string, unknown>): Record<string, unknown> => ({
  fullName: null, aliases: [], pronouns: null, sex: null, species: null, age: null,
  appearance: null, voice: null,
  magic: { origin: null, schools: [], corruptionPhase: null, notes: null },
  factions: [], home: null, status: { known: null, actual: null }, relationships: [],
  background: null, professions: [], skills: [], cybernetics: [],
  storyRole: null, involvement: [], gameId: null, model: null,
  companion: { capable: null, availability: null, status: null },
  openQuestions: [], ...over,
});

// ===========================================================================
// The species shelf. Human is already here; these five join it under humanoid.
// ===========================================================================

export const species: NewCreature[] = [
  {
    slug: "returnees",
    title: "Returnees",
    summary: "Two generations out of the hidden realms their ancestors fled to during the Great Purges — long-lived, slow to mend, and remembering the fire from people who stood in it.",
    body: `Their ancestors did not die in [[the-great-purges]]. They went somewhere, and two generations ago they came back out, into a world that had spent two thousand years rearranging itself around their absence.

- **Perk · Long Memory** — old things read to a Returnee. Purge-era murals, relic country, an [[ossuary-covenant]] chapter's bone-archive — on anything older than the states, their reads succeed where a human's fail, and a Returnee knows a [[lizzarnix]] mural is not sun worship. It is also why a Returnee quartermaster who can read Purge-era ledgers is worth a great deal to people who would rather those ledgers stayed unread.
- **Drawback · Slow to Mend** — Resilience recovers at half pace. A long life is a body that takes its time, and the wound taken at [[forward-camp-kestrel]] is still there at [[port-arcadia]].
- **Drawback · Dense pattern** — what a Forge makes of them: [[reclamation]] costs ten percent more, and a quartermaster who has never bound a Returnee finds that out by quoting one wrong, out loud, in front of everybody.
- **Ceilings** — Conditioning 7 · Coordination 8 · Resilience 7 · Acuity 9 · Composure 9 · Conductivity 7. A long life carries less.
- **Lifespan** — two to three human spans, with very few children.

**How they live with it.** Children take a calendar name — a place in the Long Count, the reckoning that dates everything from the Purges — so a child called *Tenth of the Second* is the tenth born in the second year outside. The states find it eccentric; it is a census. They bind like anyone, and keep two graves: one for the body the Forge did not need, one for the count. Every reclamation is entered in the Long Count as a return, which is how a people with two thousand years of memory make the machine mean something. *We have been told it is safe before* is the thing they say. *Vaulters*, *the walked-out*, and in port *claimants* — which is the polite word for the fear — are what others say.

**Standing.** Distrusted in every port and courted hard by [[concordance-of-natural-casters]]. Nobody agrees whether they are refugees or a returning claim, and the difference is worth a war.

For writers: a Returnee is not an elf. They are recently displaced people with an unusually long institutional memory and no instinct for modern idiom, traffic or queuing — and it shows in small things a [[drone-surveillance-bureau]] analyst files under *anomaly*.`,
    meta: {
      category: "natural", parent: "humanoid",
      biomes: ["the-peninsula", "port-arcadia"],
      threat: "Rarely a threat as a people. Individually, the most patient negotiator in any room, and the only witness who remembers what the paperwork said the first time.",
      harvest: "Harvestable like any humanoid, and priced higher for the pattern's density — which is the same reason a Forge charges more to rebuild one.",
      gameId: null,
      openQuestions: [
        "Where are the hidden realms, and did anything come out with them?",
        "Is the Long Count a calendar, a census, or a claim — and who is counting it now?",
      ],
    },
  },
  {
    slug: "carriers",
    title: "Carriers",
    summary: "Bloodlines infused so many generations back that something bred true — not the debt, the resistance. Born clean, and the most wanted assay on the peninsula.",
    body: `Somebody in the line was infused, long enough ago that nobody kept the record, and what came down the generations was not the corruption. It was the tolerance for it.

- **Perk · Tolerance** — corruption phases advance at two-thirds pace, the body conducts to nine, and a Carrier reads tells on other people a phase early, because they grew up in a house that talked about them. It is the only discount on the ladder in the game, and it is inherited rather than earned.
- **Born clean** — a Carrier starts at phase 0 like anyone else. The inheritance is the *pace*, never the debt, and a settlement that works this out will want to keep binding them.
- **Drawback · Wanted** — a body that conducts to nine is the ideal infusion subject, and an assay says so in a single line — [[helix-arcanobiotics]] knows exactly what a Carrier assay looks like. The bloodline is a product line that has not been licensed yet, and the children are watched.
- **Ceilings** — Conditioning 8 · Coordination 8 · Resilience 8 · Acuity 8 · Composure 7 · Conductivity 9. Ordinary lifespan, standard Forge rate.

**How they live with it.** Ordinary names, and a family ledger: the child's assay recorded in the parents' own hand, because the alternative is a stranger recording it. They are reclaimed like anyone, and what a Carrier family fears is not death but an assay. *Slow blood* is what the family calls it, and it is a compliment. *Slow-bloods* is what others call it; *stock-grade*, from a Helix recruiter, who means it kindly.

**Standing.** [[aegis-extraction-consortium]] classifies the bloodline as a resource. The courts have not agreed and have been in no hurry to. A Carrier who dosed once and stayed quiet for a decade is the most-studied person in any clinic they walk into.

For writers: the horror here is entirely paperwork. Nothing about a Carrier looks like anything, until a slip of paper says it does — and then four organisations want the same person for four different reasons.`,
    meta: {
      category: "natural", parent: "humanoid",
      biomes: ["the-peninsula", "port-arcadia", "bloomfall-reach"],
      threat: "None as a people. The most dangerous infused caster on the peninsula is a Carrier who decided to dose, and every programme director knows it.",
      harvest: "The assay is the harvest. A Carrier bloodline is treated as a supply question by people who would never use the word out loud.",
      gameId: null,
      openQuestions: [
        "Which infusion programme produced the first Carrier line, and does its paperwork still exist?",
        "Has a court anywhere ruled on whether a bloodline can be owned?",
      ],
    },
  },
  {
    slug: "chartered",
    title: "The Chartered",
    summary: "Built by a Helix cross-breeding wing and reclassified as people by a document that can be challenged anywhere that did not issue it. Purpose-made, and running on a clock.",
    body: `They were made — by the same programmes that make [[monstrosities]], in the same buildings, on the same budget lines. What separates a Chartered person from a monstrosity is not biology. It is a piece of paper and who honours it.

- **Perk · Specification** — one attribute starts at rung 5, the thing they were made for, which is why a Chartered arrives at the enlistment desk at the top of the recruit band. The charter itself is a document that opens doors in four jurisdictions and is a licence in its own right, reviewable like any other.
- **Drawback · Expiry** — past a threshold the world does not disclose, Resilience begins to decay unless maintained, and maintenance is a [[helix-arcanobiotics]] service. The only people who can keep a Chartered alive are the people who made them inventory.
- **Drawback · Patented pattern** — what a Forge makes of them: a Forge will rebuild it, and every [[reclamation]] is a reproduction of Helix intellectual property. Somebody, eventually, sends an invoice.
- **Ceilings** — Conditioning 9 · Coordination 8 · Resilience 8 · Acuity 7 · Composure 7 · Conductivity 9 — built to take doses. Lifespan is *unknown*, which is the honest word: Helix builds soldiers with expiry dates.

**How they live with it.** A serial, then a chosen name, in that order and never the reverse — and most keep the serial as a middle name, out of something between spite and honesty. Their dead are contested three ways at once: returned property under Helix's reading, a person's remains under the charter, and a patented pattern being reproduced at the Forge. [[bone-market-families]] broker all three. *Read the charter* is the answer to every question about what they are allowed to be, and every Chartered can recite it. Others say *product*, or *basement*, after where they were made; the [[abomination-containment-authority]] field manual says *subject*, which is worse.

**On paper:** *The bearer is recognised as a person within the jurisdictions listed in Schedule A. This recognition does not extend to jurisdictions not so listed. This recognition is subject to review.*

For writers: never write a Chartered as an artificial person questioning whether they are real. They know exactly what they are. The question in every scene is whether the room they walked into signed Schedule A.`,
    meta: {
      category: "natural", parent: "humanoid",
      biomes: ["the-peninsula", "port-arcadia"],
      threat: "Built for one thing and good at it. A Chartered soldier is the strongest person at most tables, on a clock nobody at the table can read.",
      harvest: "Contested even in death: property, remains, and patented pattern, claimed by three parties over one corpse.",
      gameId: null,
      openQuestions: [
        "How long is an expiry, and has anyone outlived one?",
        "Which four jurisdictions signed Schedule A, and what did signing cost them?",
      ],
    },
  },
  {
    slug: "the-unregistered",
    title: "The Unregistered",
    summary: "A people whose Echo does not take. The Core cuts them, the sphere reacts, and the readout says the one thing it never says: pattern unresolved.",
    body: `A Forge can record an Unregistered and cannot rebuild one. The readout gets as far as *Soul Echo established* and then reports the sentence nobody wants to hear: **pattern unresolved**. Nobody knows why. [[ossuary-covenant]] has theories, and does not share them.

- **Perk · Unreadable** — phase-readers return noise. Assays return noise. Echoic reads find nothing to read. Suspicion instruments cannot see them at all, which makes them the only people in the world concealed by default, for free, forever — and a Core cannot resolve a Conductivity it cannot read, which is the closest anyone has come to an explanation.
- **Drawback · Unbindable** — every death is [[true-death]]. Canon's law applies from the first minute: the run is over, and it starts again.
- **Ceilings** — Conditioning 8 · Coordination 8 · Resilience 8 · Acuity 8 · Composure 9 · Conductivity unreadable. People who live once learn nerve.

**How they live with it.** One name. No family name, no calendar name, no serial — you only get one of everything. They bury their dead under a marker with one word on it ([[the-single-name]]), the only people on the peninsula who still do, and theirs are the only funerals where nobody makes a joke about the Forge queue; other peoples come to them to remember what a funeral is. *Once* is the toast, the warning and the whole philosophy. Others say *one-lifers*, with something close to awe, which the Unregistered find tiresome.

**Standing.** Employable everywhere and trusted nowhere, because a person with nothing to lose twice cannot be threatened in the usual way.

**A warning at the desk.** As a player choice this is opt-in hardcore, taken behind a clear warning at [[enlistment]], and the clerk makes you say yes twice. Companions and NPCs are the ordinary way to meet one, and a party that has an Unregistered in it re-costs every plan in front of them, because they are the one it would actually kill.

For writers: never soften the law for drama, and never write an Unregistered death as a setback. There is no *after* to write. That is what the whole species is for.`,
    meta: {
      category: "natural", parent: "humanoid",
      biomes: ["the-peninsula", "port-arcadia", "the-starting-island"],
      threat: "Not a threat as a people. Individually, the most careful person on any operation, and the hardest to coerce.",
      harvest: "An assay returns noise, so the trade has never worked out what to do with them — which is its own kind of safety and its own kind of interest.",
      gameId: null,
      openQuestions: [
        "Why does the pattern not resolve, and does the Covenant actually know?",
        "Has any Forge anywhere ever built one — and what came back?",
      ],
    },
  },
  {
    slug: "the-latent",
    title: "The Latent",
    summary: "Descendants of peoples who survived the Purges by becoming indistinguishable and staying that way for two thousand years. The passing worked so well it erased its own record.",
    body: `Their ancestors did not retreat to a hidden realm during [[the-great-purges]]. They stayed, and they passed — so thoroughly, for so long, that the passing erased its own record, and a Latent family today is a human family with an odd story about an uncle.

- **Perk · Surfacing** — once, and once only, something dormant expresses: a licence class never trained (born, after all), a creature-native sense — night sight, pressure sense, a nose for essence — or a Returnee's memory of things nobody ever told them. It is triggered by a near-death, a first dose, a corruption phase, or a [[resonance]]-pillar overcharge nearby, and the world chooses from what the story has already set up. One ceiling becomes 9, and the person finds out which.
- **Inconclusive** — no assay can say what they are, including [[meridian-arcane-institute]]'s — and an inconclusive assay is the most interesting result an [[aegis-extraction-consortium]] buyer ever sees. Before Surfacing they read as human, completely, which is the whole achievement and the whole cost.
- **Ceilings** — 8 across until Surfacing. Conductivity is the usual one to move, and the assay that was inconclusive suddenly is not.
- **Forge** — standard rate before Surfacing. Afterwards, the pattern the Forge holds is the *old* one — so the first [[reclamation]] after Surfacing is the scene where the machine tries to build the person they used to be.

**How they live with it.** Deliberately, generationally ordinary names: a Latent family has been choosing unremarkable ones for two thousand years and is very good at it. They are reclaimed like humans until Surfacing, after which the family holds a story about the quiet uncle who came back different — every Latent family has one, and none of them tells it. *Ask what happened to your uncle* is said only inside the family, and only once the child is old enough. Others say nothing at all, which is the achievement.

**Standing.** No policy exists, because officially they do not. The only institutions with an opinion are the ones running assays, and they are not publishing.

For writers: a Latent character is a human character until the worst possible moment. Plant the family's story early and never explain it, and let the Surfacing happen mid-crisis to somebody who has spent their life being unremarkable on purpose.`,
    meta: {
      category: "natural", parent: "humanoid",
      biomes: ["the-peninsula", "port-arcadia", "the-starting-island"],
      threat: "None, until one Surfaces in the middle of something. Then whatever their family was, two thousand years ago, is in the room.",
      harvest: "Nobody knows what a Latent is worth, which is exactly why Meridian's assay forms recommend retention.",
      gameId: null,
      openQuestions: [
        "Which peoples went quiet during the Purges, and how many lines are still passing?",
        "Can a Surfacing be induced deliberately — and has anybody tried it on a child?",
      ],
    },
  },
];

// ===========================================================================
// Six named pieces. Nothing is named at the bench: each of these was named by
// what happened to it, and each is a quest the moment it changes hands.
// ===========================================================================

export const kitItems: NewItem[] = [
  {
    slug: "shattermarket-plate",
    title: "The Shattermarket Plate",
    summary: "The player's own torso plate — the one a medic cut a stormglass shard out of in the title sequence. Canon's first named object, which never knew it was one.",
    body: `Issued at [[enlistment]], strapped over a jacket that did not fit, and worn into the first morning of the war.

Then the shard: a splinter of [[stormglass]] driven through the plate at [[shattermarket]], cut out by a medic and set down on the map table, where the game's title forms in its cracks. The hole was strapped and never replaced, because by then the hole was the point.

**What it opens.** Any Stormglass veteran recognises the cut — not the plate, the *cut*, because everyone who was on the island that morning saw the same kind of hole in somebody. It is a door in the Cartel's mainland house, whenever that house is written.

**Who wants it.** A [[free-islander-league]] archivist, who is collecting the island one object at a time and has a list.

**Why it matters to [[kit]].** A plate is a record before it is protection. This one is the worked example: provenance is who fitted it, what hit it, and what came out of it — and none of those three facts is a stat.`,
    meta: { category: "Torso plate — issued, damaged, never replaced", rarity: "Unique — one hole, one witness list", origin: "shattermarket", gameId: null, openQuestions: ["Does the shard itself still exist, and who has it?"] },
  },
  {
    slug: "tempest-shell-case",
    title: "A Tempest Shell Case",
    summary: "A spent case from Fort Tempest's battery, from the night the guns fought for the channel — carried off the island in a rating's pocket and traded for passage.",
    body: `Fired by the battery at [[fort-tempest]] on the night the guns fought for the evacuation channel. Picked up by a rating on the last boat, for no reason anybody could explain afterwards. Traded for passage at [[blackreef-harbour]], which is how it left the island in somebody else's hand.

**What it opens.** [[the-tempest-battery-officer]], if they lived, will teach Suppression to whoever carries one of these and can say where they got it. The case is not a token; it is a conversation opener that proves the carrier was there, or knows somebody who was.

**Who wants it.** Nobody. There is no market, no broker, and no price — which is exactly why it is still a story rather than an asset, and why it is on this shelf as the counter-example to the other five.`,
    meta: { category: "Spent artillery case — a keepsake with a witness", rarity: "Common object, uncommon provenance", origin: "fort-tempest", gameId: null, openQuestions: ["How many of these left the island, and does the officer know?"] },
  },
  {
    slug: "the-southside-rifle",
    title: "The Southside Rifle",
    summary: "A named rifle made by a foundry-master, carried through Kestrel and two reclamations, taken off its owner's body on a ridge and sold into the Southside.",
    body: `Made by [[the-foundry-master]] in a Union town, well enough to acquire a history — which under [[kit]]'s law is the only way anything is ever named.

Carried through [[forward-camp-kestrel]] and two reclamations by a Contract Security veteran who never held a licence and never wanted one. Taken off his body on a ridge by a [[black-tithe-syndicate]] crew who wanted the rounds and recognised the rifle. Sold to a broker in [[the-southside]], where it currently opens doors for somebody who did not earn them.

**What it opens.** Standing in the Southside, with the wrong people, for whoever is holding it now.

**Who wants it.** Its owner. It is his, and [[bone-market-families]] will tell him where it is — for a favour, which is how they price everything.

**Why it is here.** [[veil-incursions]] already wrote the law this piece demonstrates: the legendary rifle is an enormous advantage right up until it becomes the defender's legendary rifle.`,
    meta: { category: "Named rifle — foundry-made, twice-reclaimed, stolen", rarity: "Named — one of a handful with a history somebody can recite", origin: "the-southside", gameId: null, openQuestions: ["Does the Gun want the rifle back, or the crew that took it?"] },
  },
  {
    slug: "ansels-sample-case",
    title: "Ansel's Sample Case",
    summary: "A Glassroot field case in hardened Southreach glass that has held every family of adaptation catalogued in the Reach — and is lent exactly once.",
    body: `Meridian issue, hardened [[reserve-glass]] in a frame that has been dropped down more of [[the-living-marsh]] than its owner will admit. It has held every family of adaptation catalogued in the Reach, in order, with the labels still legible.

Carried by [[keira-ansel]] on every marsh run since [[glassroot-observatory]] opened its doors. Lent once, to a Handling student who brought it back correctly — full, labelled, and with the one sample that was taken wrong left in place so it could be pointed at.

**What it opens.** Glassroot's door, and the Handling ceiling, to anybody who returns it full and correct. That is the whole test, and Ansel does not explain it in advance.

**Who wants it.** [[aegis-extraction-consortium]], for what is in it. [[helix-arcanobiotics]], for what is on it — the labels are a catalogue of what the Reach has learned to do, in a scientist's own hand.`,
    meta: { category: "Field sample case — Meridian issue, Glassroot service", rarity: "Uncommon object, irreplaceable contents", origin: "glassroot-observatory", gameId: null, openQuestions: ["What is in the one sample Ansel has never sent to Meridian?"] },
  },
  {
    slug: "choir-ledger-page",
    title: "A Choir Ledger Page",
    summary: "One page torn from a Crimson Choir account, in the Choir's own hand, naming a debt and its collateral — and the Choir honours its paper to the letter.",
    body: `Written by a voice standing above the debtor, in the Choir's hand, on the Choir's paper. It names a debt, the collateral against it, and the person who owes.

Torn out by the debtor, in a moment they have never described to anybody. Sold to a [[bone-market-families]] house, which does not deal in the living but does deal in paper, and files it where they file everything.

**What it opens.** The debt. Whoever holds the page can call it, and [[crimson-choir]] honours its paper to the letter — which is the frightening half, because the Choir does not care who is holding it or why.

**Who wants it.** The person named on it. They are a companion, they have not told the party, and they will find out that the page exists at the worst available moment.

**Why it is on the kit shelf.** Because [[kit]] is a quest engine, and the most dangerous object in this world is a document. Provenance is not only for weapons.`,
    meta: { category: "Debt instrument — Crimson Choir account page", rarity: "Unique — one page, one name, one collateral line", origin: "port-arcadia", gameId: null, openQuestions: ["Whose name is on it, and does the Choir already know where the page went?"] },
  },
  {
    slug: "the-single-name",
    title: "The Single Name",
    summary: "A grave marker with one word on it — the only kind of funeral left on the peninsula, and the only named thing on this shelf that nobody would ever take.",
    body: `Not equipment. A marker, cut by a party for one of [[the-unregistered]] who died once, carrying the only name they ever had.

They only get one of everything, so the marker gets one word. It was carved by the people who were there, and it is visited by people who came to remember what *once* means — which is why other peoples attend Unregistered funerals at all.

**What it opens.** Standing with every Unregistered who hears of it, and they hear of all of them. They do not forget who buried their dead.

**Who wants it.** Nobody would take it. That is the entire point of it, and the reason it is on this shelf: provenance is a record of what happened, and the most valuable record in the setting is the one with no market at all.`,
    meta: { category: "Grave marker — one word, cut by the party", rarity: "Unique, and deliberately worthless", origin: "the-peninsula", gameId: null, openQuestions: ["Whose name is on the first one, and who cut it?"] },
  },
];

// ===========================================================================
// Sixteen people. Twelve lift a skill ceiling; four are the command staff
// [[the-unnamed]] reserved. All PROPOSED — the slot exists, the shape is
// known, and whoever writes their first scene owns them.
// ===========================================================================

const teacher = (skill: string, technique: string) =>
  `**Lifts:** ${skill} — *${technique}*, the ceiling technique, which only this person can teach.`;

export const people: NewCharacter[] = [
  {
    slug: "the-kestrel-medic",
    title: "The Kestrel Medic [Priya Castellan]",
    summary: "Kestrel's medic and the party's second one — infused, already at Appetite, with a licence review in Arcadia that a phase-three does not pass.",
    body: `One of the four command staff [[the-unnamed]] reserves under [[the-kestrel-commander]], drawn here as a companion.

She is infused, and she is at Appetite — which is the first thing the player's own medic notices and the last thing anybody says out loud. She doses before contact without asking, so the crate is short by morning and somebody has to decide whether to mention it.

**Her want.** Her Regenerative licence is up for review in [[port-arcadia]], and a phase-three does not pass a review. She needs a forged reading, a Medicine master, or a city that does not ask. She follows the party because the party has a medic.

**Her trade.** Medicine at licensed rung: the settlement's clinic, the moment there is a settlement.

${teacher("Trauma", "Field Surgery")} She does the thing that needed a table, on the ground, while it is still being shot at — with a phase-three's hands. Afterwards she looks at yours.

**Her price.** Nothing to a buyer. Everything to [[abomination-containment-authority]], in about a year.

For writers: she is the clearest demonstration in the game that [[the-corruption-system]] is a progression path and not a punishment. She is very good at her job *because* of the road she is on, and she knows exactly where it ends.`,
    meta: person({
      background: "Field Medicine", professions: ["Medicine · licensed"], skills: ["Trauma · Ceiling — she is the one who lifts it", "Diagnostics · Expert"], cybernetics: [],
      fullName: "Priya Castellan (placeholder — whoever names her, names her)",
      species: "human", home: "forward-camp-kestrel",
      magic: { origin: "infused", schools: ["Regenerative"], corruptionPhase: 3, notes: "Licensed Regenerative, provisional and under review. Doses before contact automatically — Appetite makes the decision for her." },
      status: { known: "Kestrel's medic; competent, tired, and slightly too quick to volunteer for the forward position.", actual: "Phase three. Hiding it well from strangers and not at all from another medic." },
      storyRole: "Companion; the Trauma ceiling; the highest corruption phase on any sheet in the codex.",
      companion: { capable: true, availability: "From Kestrel, if she survives the branch the player takes.", status: "Alive at the end of the prologue in both branches unless a writer decides otherwise." },
      relationships: [{ character: "the-kestrel-commander", who: "Commander Rook", type: "Her commanding officer, who has read her hands and said nothing yet." }],
      openQuestions: ["Does she ever ask the player directly for a forged reading, or wait to be offered one?"],
    }),
  },
  {
    slug: "the-kestrel-mechanic",
    title: "The Kestrel Mechanic [Teodor Brask]",
    summary: "Kestrel's mechanic — kept the camp's generators alive and the Forge housing standing, and read the island's load path a day before it gave way.",
    body: `One of the four command staff [[the-unnamed]] reserves, drawn as a companion.

He kept the generators running at [[forward-camp-kestrel]] and the Forge housing standing through two assaults, and he read the island's load path a day before the ground gave way. Nobody listened fast enough, which he has not mentioned since and has not stopped thinking about.

**His want.** His tools are [[foundry-workers-union]] property under a contract he signed at nineteen, and the steward has called it in. He wants them to be his. The party is a route to a bench where nobody asks whose the tools are.

**His trade.** Engineering at licensed rung — sealed rigs, plate replacement, augment recovery in ninety seconds.

**Lifts:** Fabrication — *True*. He teaches a weapon returned to what it was. He does not know *History*, and says so; that belongs to [[the-foundry-master]], and he will tell the player where to look.

**His price.** The Union's. He is worth more to them working than to anybody dead, which is the safest thing about him and the reason he cannot simply walk away.

For writers: he is the fixer at the wheel's *Medic* spoke, except for kit. When a rig vents on your side of the line, he is the one who gets it honest again before the next assault.`,
    meta: person({
      background: "Salvage Engineering", professions: ["Engineering · licensed"], skills: ["Fabrication · Expert — he teaches True, and does not know History", "Systems · Reliable"], cybernetics: ["Limb — built for somebody else, unfinanced"],
      fullName: "Teodor Brask (placeholder)",
      species: "human", home: "forward-camp-kestrel",
      magic: { origin: "none", schools: [], corruptionPhase: 0, notes: "Never dosed. Works on rigs daily and has never wanted one." },
      status: { known: "The camp's mechanic. Unhurried, unsentimental, and correct about structures more often than is comfortable.", actual: "In debt to the Union for the tools in his own hands, on a contract he did not read at nineteen." },
      storyRole: "Companion; the Fabrication ceiling until the foundry-master is written; the Salvage Engineering door, personified.",
      companion: { capable: true, availability: "From Kestrel.", status: "Alive." },
      factions: [{ faction: "foundry-workers-union", role: "Member, by a contract he signed at nineteen", standing: "Owing" }],
      openQuestions: ["Does the steward come for the tools in person, and does the party meet them?"],
    }),
  },
  {
    slug: "the-kestrel-quartermaster",
    title: "The Kestrel Quartermaster [Ines Okafor]",
    summary: "A Returnee who kept the count that said how many rounds the island had, spoke the reserve aloud to Rook, and would have been the one to sound the horn.",
    body: `One of the four command staff [[the-unnamed]] reserves, drawn as a companion — and a [[returnees]], which means she can read a Purge-era ledger and most people cannot.

She kept the count that said how many rounds [[the-starting-island]] had left. She spoke the Forge's reserve aloud to [[the-kestrel-commander]], in front of the room, because that is what the count is for. If the island had lasted another day she would have been the one to sound the horn.

**Her want.** A shortfall on the island killed somebody, and the entry she wrote covered it. She wants the ledger that entry is in — it went out on a boat — before anybody else reads it.

**Her trade.** Logistics at licensed rung: allocation, the dose ledger, transport papers. She is one settlement away from the master rung, which is *the order* — who comes back first.

**Lifts:** Negotiation — *What They'll Take*. Only to Expert. She has lost to a trade-house representative and will say so, and she points the player at [[jaro-fen]] for the rest.

**Her price.** Her Long Memory. A Returnee quartermaster who can read Purge-era ledgers is worth a great deal to a [[bone-market-families]] house, and they have already asked.

For writers: she is the party's crate and the party's conscience. She will tell the player who is short, in writing, and she counts the doses the medic took.`,
    meta: person({
      background: "Materiel", professions: ["Logistics · licensed"], skills: ["Negotiation · Expert — the ceiling is Jaro Fen's", "Command · Practised"], cybernetics: [],
      fullName: "Ines Okafor (placeholder)",
      species: "returnees", home: "forward-camp-kestrel",
      magic: { origin: "none", schools: [], corruptionPhase: 0, notes: "Not a caster. Reads other people's dose ledgers for a living." },
      status: { known: "Kestrel's quartermaster. Precise, unpopular on the days it matters, and right.", actual: "Carrying one covering entry she wrote herself, in a ledger that left on a boat." },
      storyRole: "Companion; the party's Logistics; the person who says numbers aloud in a world where nobody does.",
      companion: { capable: true, availability: "From Kestrel.", status: "Alive." },
      openQuestions: ["Whose death did the entry cover, and does that person have family in Glasswater?"],
    }),
  },
  {
    slug: "the-kestrel-scout",
    title: "The Kestrel Scout [Dov Marren]",
    summary: "Kestrel's scout, who called the Hypogriff rider's search pattern over Shattermarket before anyone believed him — and is Latent, and does not know it.",
    body: `One of the four command staff [[the-unnamed]] reserves, drawn as a companion — and one of [[the-latent]], which nobody knows, including him.

He called the Hypogriff rider's search pattern over [[shattermarket]], out loud, before [[steve]] broke cover. Nobody believed him in time. He has not decided yet whether that is a thing that happened to him or a thing he did.

**His want.** Somebody in [[glasswater-village]] fed him for three weeks and was not supposed to. He wants to know she got on a boat. He follows the party because the party is going where the boats went.

**His trade.** None yet — Xenobiology at apprentice rung, the moment [[bloomfall-reach]] is on the map.

**Lifts:** Navigation — *Sign*. Only to Expert. He points the party at [[mara-quill]], who holds the real ceiling, and he is oddly relieved to do it.

**His Surfacing.** The first [[resonance]]-pillar overcharge near him is the scene where something dormant expresses, the sheet quietly says *born*, and he says nothing for a day. After that his assay stops being inconclusive, which an [[aegis-extraction-consortium]] buyer would find more interesting still.

For writers: he is the eyes the prologue party did not have, and a Surfacing waiting to happen. Plant the family's ordinary name early. Never foreshadow it twice.`,
    meta: person({
      background: "Reconnaissance", professions: ["Xenobiology · apprentice, once the Reach is on the map"], skills: ["Navigation · Expert — the ceiling is Mara Quill's", "Infiltration · Reliable"], cybernetics: [],
      fullName: "Dov Marren (placeholder)",
      species: "the-latent", home: "forward-camp-kestrel",
      magic: { origin: "none", schools: [], corruptionPhase: 0, notes: "Reads as none. Latent — the origin changes to born at Surfacing, and the sheet is the only place it is ever said." },
      status: { known: "Kestrel's scout. Young, right early, ignored.", actual: "Latent, and does not know it. His assay came back inconclusive and nobody explained why that is interesting." },
      storyRole: "Companion; the Latent species written as a person; the Surfacing scene.",
      companion: { capable: true, availability: "From Kestrel.", status: "Alive." },
      openQuestions: ["What surfaces, and does the party see it happen or only the aftermath?"],
    }),
  },
  {
    slug: "the-tempest-battery-officer",
    title: "The Tempest Battery Officer [Lt Idris Coyle]",
    summary: "The officer who controls Fort Tempest's guns and therefore the evacuation channel — reserved by canon, and holding the Suppression ceiling.",
    body: `A slot [[the-unnamed]] already reserves: the person who controls the battery at [[fort-tempest]], and therefore the evacuation channel.

**Their want.** To have been right about the channel. Whichever branch the player took, the guns held or did not on this officer's call, and they want somebody — anybody — to say which.

${teacher("Suppression", "Battery Voice")} The lesson is a fire mission called on your own position, which arrives a round early. That is the technique. Surviving it is the lesson.

**Their patience** runs to roughly one crew's worth a year, and the player is not the first person to ask.

For writers: this is the officer whose decision the prologue's branches turn on, and canon reserved the slot before there was a design to fill it. Whoever writes their scene decides whether the guns held.`,
    meta: person({
      background: "Contract Security — Fort Tempest battery", professions: [], skills: ["Suppression · Ceiling — Battery Voice"], cybernetics: [],
      fullName: "Lt Idris Coyle (placeholder)",
      species: "human", home: "fort-tempest",
      magic: { origin: "none", schools: [], corruptionPhase: 0, notes: null },
      status: { known: "The battery officer at Fort Tempest.", actual: "Reserved by canon; whether they survived the island is the writer's to decide." },
      storyRole: "The Suppression ceiling. The person the evacuation channel depended on.",
      companion: { capable: false, availability: null, status: null },
      openQuestions: ["Did the guns hold, and does the officer's answer match the branch the player took?"],
    }),
  },
  {
    slug: "the-range-instructor",
    title: "The Range Instructor [Sabine Achterberg]",
    summary: "A Stormglass range instructor who charges by the hour, refuses anyone she thinks will be dead inside a month, and holds the Marksmanship ceiling.",
    body: `Wherever the Cartel sets up on the mainland — a place that is not written yet, which is why her home is openly a placeholder.

**Her want.** Not to bury another one. She refuses anyone she thinks will be dead inside a month, and she has been wrong twice, in both directions, and remembers both.

${teacher("Marksmanship", "Called Shot")} She names the plate. You name the hole. She does not speak again until the round has found it, and the first time it does she says: *Again, and mean it.*

**What it costs.** Convincing her you are worth the ammunition, which is not a payment and cannot be bought.

For writers: she is the first teacher most players will meet, and the one who establishes the law — nobody on this roster simply takes money.`,
    meta: person({
      background: "Contract Security", professions: [], skills: ["Marksmanship · Ceiling — Called Shot"], cybernetics: [],
      fullName: "Sabine Achterberg (placeholder)",
      species: "human", home: null,
      magic: { origin: "none", schools: [], corruptionPhase: 0, notes: null },
      status: { known: "A Stormglass range instructor with a waiting list she has never published.", actual: null },
      storyRole: "The Marksmanship ceiling. Home is a placeholder until the Cartel's mainland house is written.",
      companion: { capable: false, availability: null, status: null },
      factions: [{ faction: "stormglass-cartel", role: "Range instructor", standing: "Employed, and difficult" }],
      openQuestions: ["Where does the Cartel train on the mainland, and who else is on that range?"],
    }),
  },
  {
    slug: "the-drill-master",
    title: "The Drill Master [Cassius Orme]",
    summary: "A Sovereign Guard drill master who only takes students who have already lost to him once, and remembers every one of them by name.",
    body: `At [[arcadian-soverign-guard]] in [[upper-westside]] — a written place, which makes him one of the few teachers on this roster with a real address.

**His want.** A student who lost to him and came back. Most do not. The ones who do, he remembers by name for the rest of his life.

${teacher("Close Quarters", "Three Seconds")} He beats you in a doorway, then asks what you were thinking about in the three seconds before it started. You were thinking about the fight. That is the lesson.

For writers: he is the cleanest example of the ceiling mechanic's real shape — the technique is trivial to describe and impossible to get without the relationship.`,
    meta: person({
      background: "Sovereign Guard", professions: [], skills: ["Close Quarters · Ceiling — Three Seconds"], cybernetics: [],
      fullName: "Cassius Orme (placeholder)",
      species: "human", home: "arcadian-soverign-guard",
      magic: { origin: "none", schools: [], corruptionPhase: 0, notes: null },
      status: { known: "Sovereign Guard drill master. Undefeated in a doorway, which he considers a small category.", actual: null },
      storyRole: "The Close Quarters ceiling.",
      companion: { capable: false, availability: null, status: null },
      openQuestions: ["How many students have come back, and where are they now?"],
    }),
  },
  {
    slug: "the-blast-foreman",
    title: "The Blast Foreman [Reuben Kassel]",
    summary: "A Foundry Union blast foreman who teaches demolition for nothing and expects you standing beside him at the next strike.",
    body: `In the manufacturing towns [[foundry-workers-union]] holds — ground the codex has not drawn yet, which his entry says plainly rather than pretending otherwise.

**His want.** A witness. He has brought down four buildings the Union needed brought down, and he wants somebody standing beside him at the fifth who is not Union.

${teacher("Demolition", "Controlled Collapse")} He walks you through a structure and asks what it is holding up. Then where you would like it to land. Then he hands you the charge and does not tell you whether you are right.

**What it costs.** Nothing, and then everything: the invoice arrives later and it is not money.

For writers: he teaches for free, which in this setting is the most expensive arrangement available.`,
    meta: person({
      background: "Line worker — Foundry Union", professions: ["Engineering · licensed"], skills: ["Demolition · Ceiling — Controlled Collapse"], cybernetics: [],
      fullName: "Reuben Kassel (placeholder)",
      species: "human", home: null,
      magic: { origin: "none", schools: [], corruptionPhase: 0, notes: null },
      status: { known: "A Union blast foreman. Four buildings, no convictions.", actual: null },
      storyRole: "The Demolition ceiling. Home waits for the Union's towns to be written.",
      companion: { capable: false, availability: null, status: null },
      factions: [{ faction: "foundry-workers-union", role: "Blast foreman", standing: "Trusted, and expected at the next strike" }],
      openQuestions: ["What are the Union's manufacturing towns, and which one is his?"],
    }),
  },
  {
    slug: "the-bureau-analyst",
    title: "The Bureau Analyst [Wren Adeyemi]",
    summary: "A Drone Surveillance Bureau analyst who sells blind spots like real estate, and will trade you one for a place the lattice can see.",
    body: `In a great city's lattice — [[port-arcadia]] is written; the other three are not, and this entry moves with whichever gets written first.

**Their want.** One place the lattice *can* see, that they want you to walk through, on a day they choose, so the record shows what they need it to show.

${teacher("Infiltration", "Blind Spot")} They show you the map of what the lattice cannot see. It is small. Then they show you where they have been standing for six years.

**The limit.** The jungle is [[drone-surveillance-bureau]]'s humiliation — the canopy kills drone coverage — so the lesson ends where the green starts, and they are not sorry about it.

For writers: the Bureau sells blindness, and this is the person who writes the invoice. Every deal with them is a deal about the record rather than the wall.`,
    meta: person({
      background: "Bureau analyst", professions: [], skills: ["Infiltration · Ceiling — Blind Spot", "Systems · Expert"], cybernetics: ["Sensory overlay — Bureau issue, and Bureau-readable"],
      fullName: "Wren Adeyemi (placeholder)",
      species: "human", home: "port-arcadia",
      magic: { origin: "none", schools: [], corruptionPhase: 0, notes: null },
      status: { known: "A Bureau analyst. Unremarkable, punctual, and never photographed.", actual: "Has been standing in one particular blind spot for six years." },
      storyRole: "The Infiltration ceiling. The Bureau's blind-spot trade, personified.",
      companion: { capable: false, availability: null, status: null },
      factions: [{ faction: "drone-surveillance-bureau", role: "Analyst", standing: "In good standing, which is the frightening part" }],
      openQuestions: ["What is the record they need, and who is it for?"],
    }),
  },
  {
    slug: "the-captured-rider",
    title: "The Captured Rider [Hollis Vane]",
    summary: "A captured Tropic Pearl Hypogriff rider who wants the animal back more than freedom, and thinks staying on the ground is a strange personal choice.",
    body: `A prisoner, wherever the party is holding one — which makes this entry a person rather than a place, and deliberately portable.

**Their want.** The bird. Pearl doctrine puts the human in the saddle and the animal in restraints, and the rider wants the animal back a great deal more than they want to be released.

${teacher("Traversal", "Rider's Eye")} They describe the rooftops you crossed yesterday, from above, correctly, having never seen them. You understand that you have been walking around on the ground floor of a two-storey world.

**Their manner.** They regard the party's insistence on staying on the ground as a strange personal choice, and will say so throughout, at length.

For writers: canon fixes the rider as a Pearl doctrine role and the [[hippogriff]] as its own animal. This is the entry point for writing Pearl as people rather than as a wave.`,
    meta: person({
      background: "Tropic Pearl Hypogriff rider", professions: ["Xenobiology · licensed"], skills: ["Traversal · Ceiling — Rider's Eye", "Handling · Expert"], cybernetics: [],
      fullName: "Hollis Vane (placeholder)",
      species: "human", home: null,
      magic: { origin: "none", schools: [], corruptionPhase: 0, notes: null },
      status: { known: "A captured Pearl rider. Talkative. Unbothered.", actual: "Negotiating, constantly, for one thing, which is not their own freedom." },
      storyRole: "The Traversal ceiling. Tropic Pearl written as a person.",
      companion: { capable: false, availability: null, status: null },
      factions: [{ faction: "tropic-pearl-trade-house", role: "Hypogriff rider", standing: "Captured" }],
      openQuestions: ["Where is the animal, and what happens if the party finds it first?"],
    }),
  },
  {
    slug: "the-ashline-fixer",
    title: "The Ashline Fixer [Petra Solano]",
    summary: "A fixer working the Ashline Exchange junction who will teach you properly and then sell the fact that you asked. Both halves are the arrangement.",
    body: `At [[ashline-exchange]], or whichever junction the codex writes next — she is a junction person rather than a place person, and moves.

**Her want.** To be asked. Every lesson she gives is a fact she can sell, and she wants the fact more than the fee.

${teacher("Bypass", "Credential")} She hands you a paper that works exactly once. She does not tell you where. You find out by using it, and she finds out the same afternoon.

For writers: she is the honest version of a dishonest arrangement — she never lies about what she does with the information, and people ask anyway.`,
    meta: person({
      background: "Materiel", professions: [], skills: ["Bypass · Ceiling — Credential", "Deception · Expert"], cybernetics: [],
      fullName: "Petra Solano (placeholder)",
      species: "human", home: "ashline-exchange",
      magic: { origin: "none", schools: [], corruptionPhase: 0, notes: null },
      status: { known: "A fixer at the Exchange. Reliable, in the specific sense that she always does exactly what she said.", actual: null },
      storyRole: "The Bypass ceiling. Information as a two-way trade.",
      companion: { capable: false, availability: null, status: null },
      openQuestions: ["Who is her standing buyer, and have they ever met?"],
    }),
  },
  {
    slug: "the-infuser-tech",
    title: "The Infuser-Tech [Yusuf Halloran]",
    summary: "An infusion technician who trained alongside Tino and will not say so — the most dangerous teacher on the roster, for reasons that have nothing to do with rigs.",
    body: `Wherever [[tino]] trained, which is a placeholder by design and adjacent to the one thing the player may never learn.

**His want.** Not to be asked about Tino. He will teach you everything there is to know about a rig in order to avoid one question, and the technique is the price of not asking it.

${teacher("Rig Maintenance", "Overrun")} He runs a rig past service in front of you, once, safely, and says: *Now you have seen it. You will never do it twice.*

**The binding rule.** [[what-the-player-knows-about-tino]] applies to him absolutely. He is a person who knew Tino, not an instrument that settles anything about him, and no scene with him may resolve what happened on that road.

For writers: he is the most dangerous teacher on this list, and none of the danger is technical.`,
    meta: person({
      background: "Infusion Technician", professions: ["Engineering · licensed", "Chemistry · apprentice"], skills: ["Rig Maintenance · Ceiling — Overrun", "Diagnostics · Expert"], cybernetics: [],
      fullName: "Yusuf Halloran (placeholder)",
      species: "human", home: null,
      magic: { origin: "infused", schools: [], corruptionPhase: 1, notes: "Infused, and careful about it. Phase one, and has been for a long time, which is its own kind of discipline." },
      status: { known: "An infusion technician of unusual skill, working somewhere unremarkable on purpose.", actual: "Trained alongside Tino, and has arranged his entire life around not discussing it." },
      storyRole: "The Rig Maintenance ceiling. Adjacent to the Tino law, and bound by it.",
      companion: { capable: false, availability: null, status: null },
      relationships: [{ character: "tino", who: "Tino", type: "Trained alongside him. Will not say so, and the refusal is the character." }],
      openQuestions: ["What does he actually know, and is any of it something the player is allowed to learn?"],
    }),
  },
  {
    slug: "the-clinic-surgeon",
    title: "The Clinic Surgeon [Dr Lior Massey]",
    summary: "An Ascendancy clinic surgeon who genuinely heals and genuinely recruits, and cannot always tell which he is doing.",
    body: `In whichever city writes its first [[cybernetic-ascendancy]] clinic — canon's own character type, given a name and a ceiling.

**His want.** To heal, and to recruit, and he cannot tell which he is doing. Both are sincere, which is what makes him useful and what makes him dangerous.

${teacher("Diagnostics", "The Recruit's Question")} He shows you an implant and asks what it is for. You say the function. He says the *other* thing it is for, and then offers you one.

**What he is wrong about.** The central fact of [[cybernetics]]: the Ascendancy's programme cannot engineer around the seven phases, because corruption is not in the flesh. His clinic produces genuinely encouraging results and has built the finest corruption concealment ever devised, and he believes it is a cure.

For writers: play the medicine straight. He is a good surgeon. That is the trap.`,
    meta: person({
      background: "Field Medicine", professions: ["Medicine · master", "Engineering · licensed — interface work"], skills: ["Diagnostics · Ceiling — The Recruit's Question"], cybernetics: ["Sensory overlay — his own work, fitted by a colleague"],
      fullName: "Dr Lior Massey (placeholder)",
      species: "human", home: null,
      magic: { origin: "none", schools: [], corruptionPhase: 0, notes: null },
      status: { known: "An Ascendancy clinic surgeon with excellent outcomes and a waiting list.", actual: "Recruiting, sincerely, while healing, sincerely, and unable to separate the two." },
      storyRole: "The Diagnostics ceiling. The Ascendancy's argument, delivered by somebody who means it.",
      companion: { capable: false, availability: null, status: null },
      factions: [{ faction: "cybernetic-ascendancy", role: "Clinic surgeon", standing: "Chapter-respected" }],
      openQuestions: ["Which city gets the first clinic, and who financed it?"],
    }),
  },
  {
    slug: "the-asis-officer",
    title: "The ASIS Officer [Tamsin Roque]",
    summary: "An Arcadian Special Intelligence officer who is very good, very calm, and entirely willing to demonstrate on somebody while you watch.",
    body: `At [[arcadian-special-intelligence-service]] in [[upper-westside]] — written ground, and the only teacher on this roster whose lesson the player may wish they had refused.

**Her want.** To know what you are for. She has read your file and it is inconclusive, and *inconclusive* is her favourite word.

${teacher("Interrogation", "Demonstration")} You watch. That is the whole lesson. You will not forget it, and she knows you will not.

For writers: she never raises her voice and never needs to. Write her as competent, courteous and entirely unbothered, and let the scene do the rest.`,
    meta: person({
      background: "ASIS officer", professions: [], skills: ["Interrogation · Ceiling — Demonstration", "Deception · Expert"], cybernetics: [],
      fullName: "Tamsin Roque (placeholder)",
      species: "human", home: "arcadian-special-intelligence-service",
      magic: { origin: "none", schools: [], corruptionPhase: 0, notes: null },
      status: { known: "An ASIS officer. Courteous. Never hurried.", actual: "Has a file on the player that says inconclusive, and finds that interesting rather than annoying." },
      storyRole: "The Interrogation ceiling. Arcadia's intelligence service with a face on it.",
      companion: { capable: false, availability: null, status: null },
      openQuestions: ["What is in the player's file, and who opened it?"],
    }),
  },
  {
    slug: "the-paper-hand",
    title: "The Paper-Hand [“Auntie”]",
    summary: "A Concordance forger who has kept born casters alive with documents for twenty years, and will teach you exactly one signature.",
    body: `In a [[concordance-of-natural-casters]] safehouse — a placeholder by nature, because a safehouse that has an address is not one.

**Her want.** A born caster moved safely. The lesson is the second favour; the first is the moving, and she will not discuss the second before the first is done.

${teacher("Deception", "One Signature")} She writes a name that is not yours on a paper that says it is, and it passes the gate, and she says: *That is the only one you get from me. Make it last.*

**Why she matters.** Canon says the Concordance runs on forged papers and coded introductions. She is the papers.

For writers: she is called Auntie by everybody and has no surname anybody has ever heard. Do not give her one.`,
    meta: person({
      background: "Concordance paper-hand", professions: [], skills: ["Deception · Ceiling — One Signature"], cybernetics: [],
      fullName: null,
      aliases: ["Auntie"],
      species: "human", home: null,
      magic: { origin: "none", schools: [], corruptionPhase: 0, notes: "Not a caster. Has kept more born casters alive than any caster ever has." },
      status: { known: "A name people are given by somebody they trust, in a room with no window.", actual: "Twenty years of documents, and a memory for signatures that is close to a discipline." },
      storyRole: "The Deception ceiling. The Concordance's paper trade.",
      companion: { capable: false, availability: null, status: null },
      factions: [{ faction: "concordance-of-natural-casters", role: "Paper-hand", standing: "Load-bearing" }],
      openQuestions: ["How many people are walking around under her signatures right now?"],
    }),
  },
  {
    slug: "the-foundry-master",
    title: "The Foundry-Master [Old Brannagh]",
    summary: "The old foundry-master canon already sketches — who remembers what the plants built before the war and will not say, and teaches the work and never the history.",
    body: `In a [[foundry-workers-union]] town that does not have a dossier yet — canon sketched him on the Union's own sheet before there was anywhere to put him.

**His want.** To remember what the plants built before the war, and never say. He is not protecting a secret so much as declining to hand one over.

${teacher("Fabrication", "History")} He watches you make a thing good enough to be named, and when it is, *he* names it — and the name is the only history he will ever give you. [[the-southside-rifle]] is one of his, and he knows where it went.

For writers: he teaches the work and never the history, and the gap between those two is the whole character.`,
    meta: person({
      background: "Line worker — Foundry Union", professions: ["Engineering · master"], skills: ["Fabrication · Ceiling — History"], cybernetics: [],
      fullName: "Old Brannagh (placeholder)",
      species: "human", home: null,
      magic: { origin: "none", schools: [], corruptionPhase: 0, notes: null },
      status: { known: "The oldest foundry-master anybody can name, still working.", actual: "Remembers what the plants built before the war. Has never told anyone, including the Union." },
      storyRole: "The Fabrication ceiling. The named-piece law, personified.",
      companion: { capable: false, availability: null, status: null },
      factions: [{ faction: "foundry-workers-union", role: "Foundry-master", standing: "Revered, and unmanageable" }],
      openQuestions: ["What did the plants build before the war?"],
    }),
  },
];
