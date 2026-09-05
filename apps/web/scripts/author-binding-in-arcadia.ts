import "../lib/environment";
import { randomUUID } from "node:crypto";
import { getPrismaClient, type Prisma } from "@habitat/db/client";
import { BoardWriter, stableJson, type EdgeSpec, type NodeSpec } from "./lib/story-authoring";
import { CastWriter } from "./lib/story-cast";
import { LineWriter, c, r, type LineSet } from "./lib/story-lines";

/**
 * BINDING IN ARCADIA — the first shared mainland chapter, built out.
 *
 * Twelve cards, two spoken lines, and "find the Forge" as a single objective
 * with no place, no price and no person. Canon had already decided most of it:
 * the party lands bound to nothing and one death ends the run; Arcadia's Forge
 * is active and has a landlord whose access policy is the city's whole
 * politics; binding costs nothing and the door costs everything; the Lamp
 * Chapel is the poorest platform in the city and Imogen Roe asks nothing; the
 * seat after Tino is earned by somebody who binds in the same scene.
 *
 * Owner rulings taken 2026-09-05: ONE machine (the Lamp Chapel, the only
 * platform that binds people who are not Arcadian) and THREE creditors — the
 * Army against a service contract, the Directorate for Pearl's archive, the
 * Cartel against wages — each debt called in later during the hunt for Tino.
 * Rook survives both roads; a Rook left on the dock arrives with the Guard.
 *
 * New ground: `wrackline`, the fishing village below the wall where the Defend
 * road comes ashore. The first true death on the mainland happens on its sand.
 *
 *   pnpm --filter @habitat/web exec tsx scripts/author-binding-in-arcadia.ts
 *   pnpm --filter @habitat/web exec tsx scripts/author-binding-in-arcadia.ts --apply
 */

const db = getPrismaClient();
const apply = process.argv.includes("--apply");
const ARC = "binding-in-arcadia";

// ------------------------------------------------------------------ the board

const nodes: NodeSpec[] = [
  {
    key: "storm-beach", kind: "QUEST_STEP",
    title: "The Storm Beach",
    summary: "The Defend survivors wake scattered along black sand under Arcadia's wall, and learn what unbound means from a rating who dies on the beach with a medic's hands inside him and nothing, anywhere, lighting.",
    body: `The sea did not deliver the defenders neatly.

Black sand under a wall you cannot see the top of, and the tide line is Kestrel: people, plate, rifles with the bolts full of grit, a fuel drum, a door. Some of the people are moving. The ones who are not are not resting.

The first thing the party learns about the mainland is what unbound means, and it learns it from a rating named on his vest, who came up the beach with his chest opened by something in the water and lay down on the sand and did not get up. Castellan is on him before anyone has finished coughing. She does the thing that needed a table, on black sand, with a phase-three's hands, and it is not enough, and he dies with her hands inside him — and **nothing lights.** No Core anywhere ignites. No lamps dim. There is no platform for him to drop onto and no register with his name in it. He is a body on a beach, the way almost everybody in this world ends, and the party stands over him and understands the sentence Rook said on the island for the first time ([[true-death]]).

Then the work. Find the living. Recover what the water allowed. Rook is already standing, and already counting who is standing rather than who is here. Brask's arm is wrong and he has splinted it himself with a rifle sling and a piece of the door. Okafor has the horn on its cord around her neck and has not noticed. Marren finds the road before anyone else is upright — a coastal track above the beach, and up the track a village, and above the village the wall.

Arcadia hears this party coming as a rumour from the beach: the last defenders of Ignit, washed ashore with nothing, carrying a reputation before they carry dry ammunition. The village has seen this before. Its name is [[wrackline]], and the people in it will feed you and ask you nothing, and one of them, mending a net, will tell you plainly that if you die on this beach you die, because nobody down here can afford to be bound either.`,
    completion: "Gather the surviving defenders off the sand, recover what the water allowed, and reach the coastal track to Wrackline — without losing anybody, because nobody comes back.",
  },
  {
    key: "wrackline", kind: "SCENE", x: 520, y: -260,
    title: "What the Tide Leaves",
    summary: "The fishing village under the wall: nets, a lamp in a chapel older than the city, a meal nobody charges for, and one net's catch thrown back every morning for a reason nobody remembers.",
    body: `[[wrackline]] is the line of wreck the tide leaves, and the village is named for it, and this morning the wreck is you.

It sits on the strand below [[port-arcadia]]'s wall, outside the wall, which tells you what the city thinks of it: fisher families cleared to be present and not much more, nets on racks, hulls pulled up above the tide, and a chapel of the [[church-of-the-first-gift]] with a lamp in the window that is older than the wall behind it. Okafor stands in front of the chapel's foundation stone for a long time. A [[returnees]] reads old things, and she says this one is older than the city, and that somebody down here has been keeping a promise for a very long time and has forgotten to whom.

They feed you. Fish stew, bread, a fire, a blanket that smells of salt, and nobody asks what you are, because — as a woman mending a net says without looking up — they stopped asking a long time ago and it never changed what came up the beach.

**Almost nobody in Wrackline is bound.** The fee for the door is the city's, and a fisher family does not have it, and so when one of them dies they are buried up the slope under a flat stone with one word on it, and the village has a great many flat stones. The woman says it as a practical matter. If you die here, you die. She has seen soldiers come up this beach before and she has buried some of them.

And every morning, before the boats go out, every crew throws one net's catch back into the water. All of it. The party watches them do it. Nobody says why. The woman says her mother did not know either, and her mother's mother, and that it is simply what the Wrackline does, and that the one year a crew did not do it was a bad year, and she says nothing else about it, and the party does not ask, because the shape under the water in the strait is still in everyone's eyes.

Up the coastal track is the Waterfront's outer gate, and a queue, and a building where Arcadia counts people.`,
    effects: ["The party has seen how the unbound bury their dead in Arcadia's shadow, and has watched a village throw one net back without knowing why."],
  },
  {
    key: "military-docks", kind: "QUEST_STEP",
    title: "The Arcadia Docks",
    summary: "The Evacuation survivors come off the boats into the Coast Guard's hands, a manifest, a crowd, and a city deciding what their arrival is worth.",
    body: `The boats make the military port at grey dawn, and arrival is not safety.

The [[peninsula-coast-guard-authority]] has the quay. Cutters alongside, ratings on the bollards, an officer with a loudhailer saying the same three things over and over — hands where they can be seen, wounded where the medics can reach them, nobody is shooting anybody on this quay — in the voice of somebody who has said them to three boatloads this month. Behind the Guard, the [[waterfront-district]]: cranes, customs houses, the [[census-office]] with its doors already open, and a dockmaster who does not have time to be genteel.

The party comes off the boat into all of it still bound to a Core at the bottom of the strait. Castellan says it first, because a medic knows what a missing pulse feels like from the outside: there is a Forge in this city and she can feel that there is not one in her. Every one of you dies for good until somebody fixes that, and the quay is full of people with guns who have not decided what you are yet ([[true-death]]).

Wounded people need moving. Disputed cargo needs guarding — and the Guard has already noticed the tarpaulins, and what is roped under them, and is being very professional about not asking yet. Officials want names. A [[drone-surveillance-bureau]] lattice is overhead and has already recorded every face on the boats. Somebody at the gate has decided the refugees are a problem, and somebody else has decided they might be an asset, and both of them are on their way down.

Okafor has the manifest. She has not let go of it since the strait. Whatever the boats carried, and whatever they left on a pier at [[blackreef-harbour]], is about to be read aloud.`,
    completion: "Bring the evacuation survivors, their chosen cargo and their consequences through the military port and into the Census queue.",
  },
  {
    key: "the-village-on-the-quay", kind: "SCENE", x: 520, y: 220,
    title: "The Village on the Quay",
    summary: "Glasswater came aboard. Its harbourmaster stands in the Census queue with the whole village behind him, and Marren finds the woman who fed him.",
    body: `[[glasswater-village]] is on the quay.

All of it that made the road: fishing families with their lives in carts, a clinic's worth of patients on stretchers the Guard's medics are already sorting, children who have stopped crying because they have run out, and a harbourmaster who held a radio for a whole night asking one question and is now standing very straight in a queue in a foreign city with the answer.

The boats were waiting. He says it to the party when he sees them, and he says he will be saying it for the rest of his life to anyone who will listen. He is not a soldier and he stopped trying to sound like one somewhere on the coast road, and he shakes every hand in the party and does not let go quickly enough.

The [[census-office]] counts them as what the manifest called them, which is cargo. That is not cruelty; that is the form. Cleared to be present. Revocable. A status that follows a person through every checkpoint they meet afterwards. The harbourmaster signs for all of them because nobody else in the village can read the form, and he does it in a hand that does not shake, which costs him something the clerk does not see.

And in the middle of the queue, with a bundle on her back and a look on her face that has already found what it was looking for, is a woman from a house at the top of the inlet who fed a scout for three weeks when she was not supposed to.

Marren sees her. Marren is, for about a minute, not a scout or a Latent or anybody's reserved slot. He is a boy who ran, and then a boy who was right, and then a boy whose one selfish wish in the whole war came aboard.

He says he is fine. He says it twice.`,
    effects: ["Glasswater's people are cleared present in Arcadia and counted as the manifest's cargo; the village survives as a community, in a foreign city, with a harbourmaster who signs for all of them.", "Marren knows she got on a boat."],
  },
  {
    key: "the-census-office", kind: "CHOICE", x: 1040, y: 0,
    title: "Permission to Be Present",
    summary: "Every person entering Arcadia is processed here. The clerk has a form with one box for the infused medic's most recent reading, and is looking at her hands.",
    body: `The [[census-office]] is where Arcadia counts people, and it is unhurried by design.

The queue is long. The questions are exhaustive. Name, home, what you can do, who you served, what you carry. The clerks are courteous, thorough, and entirely unmoved by hurry, and a foreigner who answers plainly is treated plainly, which is the Arcadian way and somehow harder to argue with than hostility. What the party tells a clerk about what it can do becomes what the city has on file about it, and the city acts on its files ([[suspicion]]).

Then the clerk reaches the part of the form with one box on it.

*Infused persons in the party, and their most recent reading.*

Castellan is infused. Castellan is at Appetite — phase three, which a review does not pass, which every medic in the room including her knows and which a clerk with a form and a reasonable eye for hands is about to write down. Her Regenerative licence is provisional and up for review in this city, and a suspended licence means she cannot legally dose in Arcadia, and she will anyway, and an infused foreigner dosing illegally in [[the-southside]] is one bad afternoon from a flat stone ([[the-seven-phases-of-corruption]]).

Okafor has counted her doses. She will not lie to a clerk about the number. She will not volunteer it either. She says so, quietly, and looks at the party.

Castellan does not look at anyone. She says it is one box. She says *please*, once, and the party has never heard her say it before.

The clerk waits. The clerk has all day. That is the mechanism.`,
  },
  {
    key: "find-the-soul-forge", kind: "SCENE",
    title: "The Forge Has a Landlord",
    summary: "Everyone in Arcadia knows where the platforms are. Binding costs nothing; the door costs everything; and the only Sexton who will bind a foreigner keeps the poorest chapel in the city.",
    body: `Everyone in Arcadia knows where the platforms are. That was never the problem.

[[port-arcadia]]'s Forge is *active* and it has a landlord, and the landlord's whole politics fits in one field on one sheet: who is allowed to be permanent ([[the-soul-forge]]). The garrison Core under the Sovereign Guard binds Arcadians in uniform and nobody else. The chapels of [[the-congregation-of-the-bound]] up the slope bind citizens, for a fee the city sets, in a queue the Sextons keep. And at the bottom of the slope, in [[the-southside]], where the light is poor on purpose, there is [[the-lamp-chapel]]: one Core, one platform, one table, and the only Sexton in the city who will bind a person who is not Arcadian.

Her name is [[imogen-roe]]. She has held four hundred people through their first hour back and asked none of them anything. She will bind you. She cannot waive the fee, because the fee is not hers — it belongs to the city that owns the machine — and the Lamp Chapel's reserve is running Thin through winter, which means that even after you are bound, coming back is a queue she sequences and a bill somebody pays ([[reclamation]]).

So the question is not where. The question is who pays.

**Binding costs nothing.** The machine spends no [[essence]] to record an Echo ([[soul-binding]]). What costs is the door — and Arcadia rations the door by wealth, which is the thing [[the-radiant-path]] preaches in the Southside's dead zones and the thing the city cannot answer from a podium, because it is true.

The party has nothing. It has what it carried off the island, and three people in this city who might pay for a foreigner's permanence, each of whom will want something back.

Until one of them does, every one of you still dies for good ([[true-death]]).`,
    effects: ["The party knows the Lamp Chapel is the only platform in Arcadia that will take them, and that somebody has to pay for the door."],
  },
  {
    key: "pulled-from-the-strait", kind: "SCENE", x: 1560, y: -260,
    title: "What the Strait Gave Back",
    summary: "A Coast Guard cutter puts in with the people it pulled out of the water, and Rook steps off it in a blanket, three days late, having been the one holding two of them up.",
    body: `Three days after the boats, a [[peninsula-coast-guard-authority]] cutter puts in at the military quay with what the strait gave back.

Twenty-two people, pulled out of the water off the wreck of an island by a service that owes rescue to any hull and has never once been thanked for it. Most of them Stormglass rearguard. Two of them from [[glasswater-village]] who were never on any boat. And a commander in a Guard blanket, standing on the cutter's deck before it has finished coming alongside, because Rook does not sit down on boats.

The cutter's captain tells the party, in the flat voice of somebody who has done this all month, that Rook was the one holding two of the others up when the swimmer reached them. That Rook did not say thank you. That Rook did not say anything at all until they made port, and then asked for a count.

Rook steps onto the quay. Rook looks at the party — the party that cast off, on Rook's order, with Rook still on the pier — and says that they left when they were told to, and that this was good.

That is all that is ever said about the dock, by Rook, to anyone, ever. The commander is still standing when everyone stops. That is the whole of what canon fixes, and the whole of what Rook will discuss.

Then Rook wants to know who in this city has a Forge, and what it costs, because everyone on that cutter is bound to nothing and Rook has read the number of people the Guard did not find.`,
    effects: ["Rook reaches Arcadia in the Coast Guard's custody, three days late, and the party owes the Guard something it has not been asked for yet."],
  },
  {
    key: "the-price-of-permanence", kind: "CHOICE", x: 1820, y: 0,
    title: "Who Pays",
    summary: "Three people in this city will pay for a foreigner's permanence, and each will want something back. Okafor knows which costs least, and it is not the one you think.",
    body: `Okafor lays it out the way she lays out every count: in front of everyone, in order, without lowering her voice.

Three people in this city will pay the Congregation's fee for a party that arrived with nothing, and every one of them will want something back, and she can tell you now which costs least and it is not the one you think.

**The Army**, if the Army has offered a road. The [[peninsula-expeditionary-army]] pays the fee tonight and the party pays with years — a contract, a rifle company that the counting-house calls a foreign legion, and a first job that has a name already. The road runs through service, and they say so, which is nearly a courtesy.

**The Directorate**, if the party came off the water with Pearl's paper. The [[national-defense-directorate]] wants the archive and the prisoners and will trade a platform for them tonight — and what it learns from that archive it will sell back to the party later, one page at a time, at a price.

**The Cartel**, always. The [[stormglass-cartel]] owes Kestrel's survivors wages, and the Cartel's factor on the [[waterfront-district]] can be made to advance them against the fee, because the Cartel would very much like a story about Ignit it can tell and the party is the only people alive who can give it one. Okafor has lost a negotiation to a trade-house representative once in her life and does not intend to do it to a Cartel clerk.

Rook says to pick a creditor.

Whatever the party picks, it walks down to [[the-southside]] tonight as somebody's debtor. That is not a failure of the choice. That is the setting.`,
  },
  {
    key: "the-armys-terms", kind: "QUEST_STEP", x: 2080, y: -200,
    title: "The Road Runs Through Service",
    summary: "The Expeditionary Army pays the Congregation's fee tonight and the party pays with years. The contract is read aloud, all of it, because Rook insists.",
    body: `An officer of the [[peninsula-expeditionary-army]] meets the party in a [[lower-westside]] supper room that the Army rents by the hour for exactly this, and puts a contract on the table between the glasses.

The Army pays the [[the-congregation-of-the-bound]] fee tonight, at [[the-lamp-chapel]], for every name on the party's list. In exchange: a term of service, a rifle company that the Arcadian counting-house calls a foreign legion and the Army calls a rifle company, and a first tasking that already has a name on it. The Army does not pretend this is generosity. You came off the water with guns, the officer says; that makes you a unit, and units get contracts, and refugees get a queue.

**Rook makes them read it.** All of it, aloud, every clause, in the voice that ends conversations, and the officer does, and it takes a while, and by the end of it the party knows exactly what it has agreed to and exactly what it can be made to do. Rook has watched people sign for less and regret it for longer.

Okafor initials each page. She does not like the terms and says so, and initials anyway, because the alternative is a beach.

What the Army buys is a company that will be very good at what it does and owes the Army for the privilege of being permanent. What the party buys is a door. And a debt with the one power on this coast whose intelligence net was said, on the worst night of the war, to know what hunts like the thing that took [[tino]].

The officer signs last, and mentions, as if in passing, that the Army keeps its promises to people who keep theirs.`,
    effects: ["set flag: owes-the-army", "The Army pays the Lamp Chapel's fee for every name on the party's list; the party is contracted to the Peninsula Expeditionary Army, and the first tasking already has a name."],
    completion: "Sign the Army's contract, read aloud in full, and carry its paper down to the Lamp Chapel.",
  },
  {
    key: "the-directorates-price", kind: "QUEST_STEP", x: 2080, y: 0,
    title: "Paper for a Platform",
    summary: "The Directorate takes Pearl's operational archive and the prisoners, and pays the Lamp Chapel's fee. Hollis Vane would like it on the record that she is worth more roped than shot.",
    body: `The [[national-defense-directorate]] does not send an officer. It sends a man with a case, a warrant that has not been served yet, and a car.

The terms are short. Tropic Pearl's operational archive, all of it, and the prisoners, all of them, in exchange for the [[the-congregation-of-the-bound]] fee at [[the-lamp-chapel]] tonight for every name on the party's list. The man says the [[drone-surveillance-bureau]] will offer more for the same paper and ask for quiet, and that Pearl has already put money on a table in a room the party has not been invited to for whoever takes the prisoners off them first, and that the Directorate is offering neither more nor quiet — only a platform, tonight, before anyone in the party has to find out what true death is on a Southside stair.

**Hollis Vane** — [[the-captured-rider]], roped, polite, entirely unbothered — asks the man where the bird is. Not for Vane — the bird does not do well in the dark. Vane would like a name before becoming somebody's paperwork, and would like it on the record that a rider is worth more roped than shot, which everyone keeps saying as if it were flattery. The man writes something down. Vane tells the party, on the way to the car, that ground people do everything the slow way, and that they will remember who kept them fed.

The archive goes into the case. The party will see it again — one page at a time, at the Directorate's price, when the Directorate decides the party has something it wants — and one of those pages is going to have a client code on it and the word *specimen*.

Not tonight. Tonight it is a platform.`,
    effects: ["set flag: sold-the-pearl-archive", "The Directorate holds Pearl's operational archive and the eleven prisoners, including the rider; it pays the Lamp Chapel's fee for every name on the party's list, and will sell the archive back to the party a page at a time."],
    completion: "Hand Pearl's archive and prisoners to the Directorate's man and carry his paper down to the Lamp Chapel.",
  },
  {
    key: "the-cartels-advance", kind: "QUEST_STEP", x: 2080, y: 200,
    title: "Wages Against the Fee",
    summary: "Okafor negotiates the Stormglass factor on the Waterfront into advancing Kestrel's back wages against the Congregation's fee. The Cartel gets its story. The party gets a door, and a payroll it never left.",
    body: `The [[stormglass-cartel]]'s Arcadia house is a bonded warehouse on the [[waterfront-district]] with a customs seal on the door and a factor inside who has already heard that Kestrel is on the quay.

Okafor does the talking. She has lost a negotiation to a trade-house representative once in her life and will say so if asked; she has never lost one to a clerk, and the factor is a clerk with a good coat.

Her position is simple and she states it once. The Cartel owes every survivor of [[forward-camp-kestrel]] wages it has not paid, and the Cartel would very much like a story about Ignit it can tell — to the League, to the Directorate, to anyone who asks why a smuggling cartel lost an island — and the only people alive who can give it that story are standing in this warehouse bound to nothing. The Cartel advances the back pay against the [[the-congregation-of-the-bound]] fee at [[the-lamp-chapel]] tonight. The party gives it the story, eventually, in the shape the Cartel wants it. Until then, the party is on the payroll again, whether it likes it or not.

The factor tries the count. Okafor has the count. The factor tries the manifest. Okafor wrote the manifest. The factor tries the Cartel's regret at the loss of Kestrel's infuser, who was on the payroll for nine years and is no longer, and Okafor says nothing at all for a moment, and then says that the infuser's back pay is a separate conversation and that she will be having it.

Rook watches the whole thing from the door and does not help, because Okafor does not need it.

What the Cartel buys is its heroes. What the party buys is a door, and a Cartel factor who now knows exactly what it is looking for, and a locker in the back of this warehouse with a dead man's name on it that nobody has opened.`,
    effects: ["set flag: owes-the-cartel", "The Cartel advances Kestrel's back wages against the Lamp Chapel's fee for every name on the party's list; the party is on the Stormglass payroll again and owes the Cartel its Ignit story."],
    completion: "Let Okafor negotiate the Stormglass factor into the advance, and carry the Cartel's paper down to the Lamp Chapel.",
  },
  {
    key: "bind-to-arcadia", kind: "ENDING", endingKind: "SUCCESS", continuesInSlug: "the-captivity-arc",
    title: "Bound to Arcadia",
    summary: "The Lamp Chapel, at night, in the Southside. Roe binds them one at a time and asks nothing. The Kestrel crew bind in the same scene, which is how the seat after Tino is earned. Act I opens with the party permanent and in debt.",
    body: `[[the-lamp-chapel]] at night, on the floor of [[the-southside]], with the light poor on purpose and somebody's paper in Okafor's hand that says the door is paid.

One Core, one platform, one table, and [[the-platform-ledger]] open on it with more names than any chapel in [[upper-westside]] will ever write. [[imogen-roe]] is sitting beside the Core the way she has sat beside it for thirty years. She looks at the paper. She looks at the party. She does not ask what they are, and she does not ask who paid, and the not-asking is so complete that it is a kind of speech.

Palm on the Core. It cuts — precisely, without warning — and the sphere reacts to the blood like it has been waiting all morning.

*Resonance detected. Biological pattern acquired. Soul Echo established.*

**BOUND.**

Roe writes a name, a date, and a one. That is all the book knows. Then the next of you.

**The Kestrel crew bind in the same scene.** Okafor, who says aloud that the number in the reserve is the same as it was because binding costs nothing and it is the coming back that costs. Brask, who binds with the arm the sea broke and understands, as he does it, that he has just made it permanent — the pattern the Core takes tonight is the body it will build ([[what-the-forge-rebuilds]]) — and does it anyway, because a mechanic who waits for a better arm is a mechanic who dies unbound. Marren, who does not know what the Core will make of him and neither does the machine. Castellan, whose phase the Core reads the way an instrument reads anything, and Roe writes a one, and says nothing, because that is the office. Rook, last, who says that anyone who might stand next to them on this coast is no use to them unbound, same as the island.

Whoever came for the party and binds beside it tonight is the person the campaign has been waiting to find since a watch came off a wrist on a road. The seat after [[tino]] is earned at this Core, against a ghost, by somebody who put their palm on it in the same scene ([[companions]]). Nobody says this out loud. The chapel is too small for it.

If the one who asked came this far, he is not on the list. Nobody paid for him. Roe looks at him once and looks away, and he stands at the back with his hands in a coat that is not his, unbound in a city that counted him and cleared him to be present, and the party leaves knowing it.

For the first time since the island fell, death is no longer automatically final. The roads have converged and the state has not been washed clean: beach survivors still carry the last stand, dock survivors still carry the manifest, the city knows which version of the island walked into its machine, and somebody in this city holds the party's debt.

Act I begins here — one mainland campaign, carrying two different histories, and a search that nobody else in the world is conducting.`,
    effects: ["The party is bound at the Lamp Chapel; death costs Essence and levels again instead of everything.", "The Kestrel crew are bound in the same scene; the seat after Tino is earned here.", "Whoever paid for the door holds the party's debt into Act I."],
  },
];

const edges: EdgeSpec[] = [
  // Defend road
  { from: "storm-beach", to: "wrackline", label: "Get off the sand" },
  { from: "two-fewer", to: "wrackline" },
  { from: "wrackline", to: "the-census-office" },
  // Evacuation road
  { from: "military-docks", to: "the-village-on-the-quay", label: "Glasswater is counted with you", condition: "glasswater-came-aboard",
    effects: ["The village stands in the Census queue beside Kestrel, and the harbourmaster signs for all of them."] },
  { from: "military-docks", to: "what-the-city-is-owed", label: "Only Kestrel came off the boats",
    effects: ["The quay holds soldiers, wounded and whatever the manifest chose; nobody from Glasswater is counted."] },
  { from: "the-village-on-the-quay", to: "what-the-city-is-owed" },
  { from: "the-ones-who-lived", to: "the-census-office" },
  { from: "the-army-is-interested", to: "the-census-office" },
  { from: "leverage-and-liability", to: "the-census-office" },
  // Convergence
  { from: "the-census-office", to: "find-the-soul-forge", label: "Vouch for Castellan. Her hands are steady.", voiced: true,
    effects: ["The reading goes on file as the party's word. If it is ever read against a true assay, it is the party's word that fails, and the file remembers whose.", "Castellan is cleared present with her licence intact, and knows exactly who lied for her."] },
  { from: "the-census-office", to: "find-the-soul-forge", label: "Let the reading stand.", voiced: true,
    effects: ["Castellan is cleared present, provisional, licence suspended pending review. She cannot legally dose in Arcadia, and does anyway.", "The party told the truth to a clerk, and the clerk wrote it down, and the Abomination Containment Authority has a file that starts today."] },
  { from: "the-census-office", to: "find-the-soul-forge", label: "Pay the clerk's colleague in the back room.", voiced: true,
    effects: ["A bribed doctor beats one review. The reading on file is clean, and the party's first debt in Arcadia is to somebody in the Southside who knows what it bought.", "The Bureau's lattice recorded who went into the back room and for how long."] },
  { from: "find-the-soul-forge", to: "pulled-from-the-strait", label: "A cutter puts in with what the strait gave back", condition: "rook-left-on-the-dock",
    effects: ["Rook steps off a Coast Guard cutter three days after the boats, in a blanket, and never once mentions the dock."] },
  { from: "find-the-soul-forge", to: "the-one-who-asked", label: "Follow the survivor who remembers the question", condition: "asked-about-tino" },
  { from: "find-the-soul-forge", to: "the-price-of-permanence", label: "Settle who pays" },
  { from: "pulled-from-the-strait", to: "the-one-who-asked", label: "Follow the survivor who remembers the question", condition: "asked-about-tino" },
  { from: "pulled-from-the-strait", to: "the-price-of-permanence", label: "Settle who pays" },
  { from: "answer-the-survivor", to: "the-price-of-permanence", label: "I asked. Tell me everything you counted.", voiced: true,
    effects: ["The survivor gives up the absence they have been carrying: the count, twice, and the empty column; the file opens with numbers."] },
  { from: "answer-the-survivor", to: "the-price-of-permanence", label: "Who else has asked about him?", voiced: true,
    effects: ["Nobody. The file opens with a count of one, and the party knows the search is theirs alone."] },
  { from: "answer-the-survivor", to: "the-price-of-permanence", label: "Keep walking.", voiced: true,
    effects: ["The survivor follows anyway and says it on the move; the file gets written by somebody who did not want it either."] },
  { from: "the-price-of-permanence", to: "the-armys-terms", label: "Let the Army pay. We came off the water as a unit.", condition: "the-army-opened-a-road", voiced: true,
    effects: ["The Army's road is taken; the contract is read aloud tonight."] },
  { from: "the-price-of-permanence", to: "the-directorates-price", label: "Sell the Directorate the archive and the prisoners.", condition: "manifest-archives-and-prisoners", voiced: true,
    effects: ["Pearl's paper and people change hands tonight."] },
  { from: "the-price-of-permanence", to: "the-cartels-advance", label: "Let Okafor take it to the Cartel. They owe us wages.", voiced: true,
    effects: ["Okafor walks into the Stormglass house on the Waterfront with the count and the manifest."] },
  { from: "the-armys-terms", to: "bind-to-arcadia" },
  { from: "the-directorates-price", to: "bind-to-arcadia" },
  { from: "the-cartels-advance", to: "bind-to-arcadia" },
];

const retired: Array<{ from: string; to: string; label: string | null; because: string }> = [
  { from: "storm-beach", to: "find-the-soul-forge", label: "Get off the sand and move inland", because: "the Defend road now goes through Wrackline and the Census Office before the question of the Forge" },
  { from: "two-fewer", to: "find-the-soul-forge", label: null, because: "the count on the beach walks up to Wrackline, not straight to the Forge" },
  { from: "military-docks", to: "what-the-city-is-owed", label: null, because: "the quay now branches on whether Glasswater came aboard; the default route is labelled" },
  { from: "the-ones-who-lived", to: "find-the-soul-forge", label: null, because: "every dock outcome now passes the Census Office first" },
  { from: "the-army-is-interested", to: "find-the-soul-forge", label: null, because: "every dock outcome now passes the Census Office first" },
  { from: "leverage-and-liability", to: "find-the-soul-forge", label: null, because: "every dock outcome now passes the Census Office first" },
  { from: "find-the-soul-forge", to: "bind-to-arcadia", label: "Go straight to the Forge", because: "there is no straight road — somebody pays for the door first (the-price-of-permanence)" },
  { from: "answer-the-survivor", to: "bind-to-arcadia", label: "I asked. Tell me everything you counted.", because: "the survivor's answer leads to the question of who pays, not straight to the platform" },
  { from: "answer-the-survivor", to: "bind-to-arcadia", label: "Who else has asked about him?", because: "the survivor's answer leads to the question of who pays, not straight to the platform" },
  { from: "answer-the-survivor", to: "bind-to-arcadia", label: "Keep walking.", because: "the survivor's answer leads to the question of who pays, not straight to the platform" },
];

const links: Array<{ node: string; slugs: string[] }> = [
  { node: "storm-beach", slugs: ["port-arcadia", "wrackline", "true-death", "the-kestrel-medic", "the-kestrel-commander", "the-kestrel-mechanic", "the-kestrel-quartermaster", "the-kestrel-scout"] },
  { node: "wrackline", slugs: ["wrackline", "port-arcadia", "church-of-the-first-gift", "returnees", "the-kestrel-quartermaster", "true-death"] },
  { node: "military-docks", slugs: ["port-arcadia", "peninsula-coast-guard-authority", "waterfront-district", "census-office", "drone-surveillance-bureau", "true-death", "blackreef-harbour", "the-kestrel-medic", "the-kestrel-quartermaster"] },
  { node: "the-village-on-the-quay", slugs: ["glasswater-village", "census-office", "the-kestrel-scout", "glasswater-came-aboard"] },
  { node: "the-ones-who-lived", slugs: ["port-arcadia", "the-soul-forge", "the-kestrel-medic"] },
  { node: "the-army-is-interested", slugs: ["port-arcadia", "peninsula-expeditionary-army", "the-army-opened-a-road"] },
  { node: "leverage-and-liability", slugs: ["port-arcadia", "tropic-pearl-trade-house", "national-defense-directorate", "drone-surveillance-bureau", "the-captured-rider"] },
  { node: "the-census-office", slugs: ["census-office", "suspicion", "the-kestrel-medic", "the-kestrel-quartermaster", "the-seven-phases-of-corruption", "the-southside"] },
  { node: "find-the-soul-forge", slugs: ["port-arcadia", "the-soul-forge", "soul-binding", "reclamation", "the-congregation-of-the-bound", "the-lamp-chapel", "the-southside", "imogen-roe", "the-radiant-path", "essence", "true-death"] },
  { node: "pulled-from-the-strait", slugs: ["peninsula-coast-guard-authority", "the-kestrel-commander", "glasswater-village", "rook-left-on-the-dock"] },
  { node: "the-price-of-permanence", slugs: ["the-kestrel-quartermaster", "the-kestrel-commander", "peninsula-expeditionary-army", "national-defense-directorate", "stormglass-cartel", "waterfront-district", "the-southside"] },
  { node: "the-armys-terms", slugs: ["peninsula-expeditionary-army", "the-congregation-of-the-bound", "the-lamp-chapel", "lower-westside", "the-kestrel-commander", "the-kestrel-quartermaster", "tino", "owes-the-army"] },
  { node: "the-directorates-price", slugs: ["national-defense-directorate", "drone-surveillance-bureau", "tropic-pearl-trade-house", "the-captured-rider", "the-congregation-of-the-bound", "the-lamp-chapel", "sold-the-pearl-archive"] },
  { node: "the-cartels-advance", slugs: ["stormglass-cartel", "waterfront-district", "forward-camp-kestrel", "the-congregation-of-the-bound", "the-lamp-chapel", "the-kestrel-quartermaster", "the-kestrel-commander", "tino", "owes-the-cartel"] },
  { node: "bind-to-arcadia", slugs: ["the-lamp-chapel", "the-southside", "the-platform-ledger", "upper-westside", "imogen-roe", "soul-binding", "what-the-forge-rebuilds", "companions", "tino", "del-anwar", "the-kestrel-commander", "the-kestrel-quartermaster", "the-kestrel-medic", "the-kestrel-mechanic", "the-kestrel-scout", "port-arcadia"] },
];

const flags: Array<{ slug: string; title: string; summary: string; body: string }> = [
  { slug: "the-army-opened-a-road", title: "The Army Opened a Road", summary: "The party came off the boats armed, and the Peninsula Expeditionary Army offered a road to the Forge that runs through service.",
    body: "Set at *The Army Is Interested* in [[binding-in-arcadia]] when the manifest loaded the guns, and read at *Who Pays*, where it makes the Army one of the party's possible creditors." },
  { slug: "owes-the-army", title: "Owes the Army", summary: "The Peninsula Expeditionary Army paid the Lamp Chapel's fee for the party's binding against a service contract, read aloud in full.",
    body: "Set at *The Road Runs Through Service* in [[binding-in-arcadia]] and called in at the start of [[the-captivity-arc]], where the Army's contract buys one thing: the Bureau's record of who queried a certain face the week before Ignit fell." },
  { slug: "sold-the-pearl-archive", title: "Sold the Pearl Archive", summary: "The party traded Tropic Pearl's operational archive and prisoners to the National Defense Directorate for the Lamp Chapel's fee.",
    body: "Set at *Paper for a Platform* in [[binding-in-arcadia]] and called in at the start of [[the-captivity-arc]], where the Directorate sells the party back one page of Pearl's beachhead log — the one with a client code on it and the word *specimen*." },
  { slug: "owes-the-cartel", title: "Owes the Cartel", summary: "The Stormglass Cartel advanced Kestrel's back wages against the Lamp Chapel's fee; the party is on the payroll again and owes the Cartel its Ignit story.",
    body: "Set at *Wages Against the Fee* in [[binding-in-arcadia]] and called in at the start of [[the-captivity-arc]], where the Cartel's factor opens the locker in the back of the Waterfront house with a dead man's name on it." },
];

// --------------------------------------------------------------- the dialogue

const ROOK = c("the-kestrel-commander");
const OKAFOR = c("the-kestrel-quartermaster");
const CASTELLAN = c("the-kestrel-medic");
const BRASK = c("the-kestrel-mechanic");
const MARREN = c("the-kestrel-scout");
const ROE = c("imogen-roe");
const DEL = c("del-anwar");
const VANE = c("the-captured-rider");

const lineSets: LineSet[] = [
  { arc: ARC, node: "storm-beach", lines: [
    { number: 1, speaker: CASTELLAN, text: "Stay with me. Stay — no. No. Where is it. Where's the light. There's no light.", intensity: 8, emotion: ["urgent", "afraid"], performance: "hands inside a chest on black sand, looking up for a Core that is not there" },
    { number: 2, speaker: CASTELLAN, text: "He's gone. Not held. Gone. That's what it feels like from the outside. Now you know.", intensity: 5, emotion: ["sad", "calm"], performance: "flat; the first true death the party has watched" },
    { number: 3, speaker: ROOK, text: "Count who's standing. Not who's here. Who's standing.", intensity: 6, emotion: ["command"], performance: "in the surf" },
    { number: 4, speaker: MARREN, text: "Road. Up there, above the tide line. And a village, and past the village — that's the wall. That's Arcadia.", intensity: 5, emotion: ["urgent", "warm"] },
    { number: 5, speaker: BRASK, text: "Arm's broken. I know. I set it. Stop looking at it and look at that wall — somebody built that to keep something out, and I'd like to know what.", intensity: 4, emotion: ["dry"] },
  ] },
  { arc: ARC, node: "two-fewer", lines: [
    { number: 1, speaker: r("kestrel-sergeant"), text: "Two scouts on the road. Four on the wall where the scouts should've been. And the south face was short when it went, so add whoever was standing where those four should've been. I keep getting the same number.", intensity: 4, emotion: ["sad", "calm"], performance: "on a fuel drum, a wet cigarette she cannot light, to nobody" },
    { number: 2, speaker: r("kestrel-sergeant"), text: "I'm not saying it was wrong. I'm saying I can count.", intensity: 4, emotion: ["calm"] },
  ] },
  { arc: ARC, node: "wrackline", lines: [
    { number: 1, speaker: r("wrackline-fisher"), text: "Sit. Eat. Nobody here's asking what you are. We stopped asking a long time ago; it never once changed what came up the beach.", intensity: 3, emotion: ["calm", "warm"], performance: "mending a net, not looking up" },
    { number: 2, speaker: r("wrackline-fisher"), text: "You die on this sand, you die. None of us are bound either. The door costs what it costs and a net doesn't pay it. There's a slope up there with a lot of flat stones on it.", intensity: 3, emotion: ["calm"], performance: "a practical matter, said kindly" },
    { number: 3, speaker: OKAFOR, text: "That chapel stone is older than the wall. Older than the city. Somebody down here has been keeping a promise for a very long time, and has forgotten to whom.", intensity: 3, emotion: ["calm"], performance: "a Returnee reading old stone; the Long Memory" },
    { number: 4, speaker: r("wrackline-fisher"), text: "One net goes back every morning. All of it. Don't ask me why — my mother didn't know either, and hers. The one year a crew didn't was a bad year. That's all I've got.", intensity: 3, emotion: ["calm"], performance: "and nothing more is said about it" },
    { number: 5, speaker: ROOK, text: "Get them fed and get them moving. We're not bound. Every hour on this sand is an hour I can lose somebody in and not get them back.", intensity: 5, emotion: ["command"] },
  ] },
  { arc: ARC, node: "military-docks", lines: [
    { number: 1, speaker: r("coast-guard-officer"), text: "Peninsula Coast Guard. Hands where I can see them, wounded where my medics can reach them, and nobody is shooting anybody on my quay. I've said that to three boats this month and I'll say it to you.", intensity: 6, emotion: ["command", "calm"], performance: "loudhailer; a professional who has done this all month" },
    { number: 2, speaker: CASTELLAN, text: "Somebody bind these people. Anyone. There's a Forge in this city, I can feel that there is, and I can feel that there isn't one in me.", intensity: 6, emotion: ["afraid", "urgent"] },
    { number: 3, speaker: OKAFOR, text: "I have the manifest. I have not let go of it since the strait. Whoever reads it reads it as I wrote it, and I wrote it as it happened.", intensity: 4, emotion: ["calm"] },
  ] },
  { arc: ARC, node: "the-village-on-the-quay", lines: [
    { number: 1, speaker: r("glasswater-harbourmaster"), text: "I asked if the boats were waiting. They were. I'm going to be saying that for the rest of my life, to anybody who'll stand still for it.", intensity: 4, emotion: ["warm", "sad"], performance: "shaking every hand in the party and not letting go quickly enough" },
    { number: 2, speaker: r("glasswater-woman"), text: "Dov. Look at you. You've grown. No you haven't, you're exactly the same. Come here.", intensity: 4, emotion: ["warm"], performance: "a bundle on her back; she has already found what she was looking for" },
    { number: 3, speaker: MARREN, text: "She's here. She got on a boat. I'm — I'm fine. I'm fine.", intensity: 5, emotion: ["warm", "sad"], performance: "he says it twice" },
  ] },
  { arc: ARC, node: "what-the-city-is-owed", lines: [
    { number: 1, speaker: r("harbour-clerk"), text: "Two lighters, eight hulls. Manifest as filed by the quartermaster of record. The city thanks you for your candour.", intensity: 3, emotion: ["neutral"], performance: "a voice with no weather in it, on wet stone" },
    { number: 2, speaker: r("harbour-clerk"), text: "The city will now decide what kind of arrival this was.", intensity: 3, emotion: ["neutral"] },
  ] },
  { arc: ARC, node: "the-ones-who-lived", lines: [
    { number: 1, speaker: r("kestrel-wounded"), text: "They put us first. I watched them do it from a stretcher. I'll say so to anybody in this city who asks, and to a few who don't.", intensity: 4, emotion: ["warm"], performance: "one of the sixty-three, at dawn" },
    { number: 2, speaker: CASTELLAN, text: "Sixty-three at dawn. That's a good night. Don't let anybody tell you it isn't — they weren't in the boats.", intensity: 5, emotion: ["protective", "dry"] },
  ] },
  { arc: ARC, node: "the-army-is-interested", lines: [
    { number: 1, speaker: r("expeditionary-officer"), text: "Four crew-served pieces and the powder to feed them. That makes you a unit, not a rumour, and units get a road to the Forge. Refugees get a queue.", intensity: 4, emotion: ["calm"], performance: "counting the guns twice, then the party" },
    { number: 2, speaker: r("expeditionary-officer"), text: "The road runs through service. I'm telling you now so you can't say afterwards that you weren't told.", intensity: 4, emotion: ["calm"], performance: "plainly, which is nearly a courtesy" },
    { number: 3, speaker: r("signals-corporal"), text: "You want to know what I think of the arithmetic. I think it added up. I think you counted right. I think I'm standing here with one arm and you're standing there with the guns, and both of those things are true, and I'd like you to look at me while you hold them both.", intensity: 6, emotion: ["angry", "calm"], performance: "right arm ending above the elbow, dressing already grey; she does not raise her voice" },
  ] },
  { arc: ARC, node: "leverage-and-liability", lines: [
    { number: 1, speaker: r("directorate-agent"), text: "The Directorate will trade platform access for the archive, tonight. The Bureau will offer more for the same paper and ask you to be quiet about it. Pearl has already put money on a table for the prisoners in a room you haven't been invited to. Those are your three offers. The warrant is separate.", intensity: 4, emotion: ["calm"] },
    { number: 2, speaker: VANE, text: "I'd like it on the record that I'm worth more roped than shot. Everybody keeps saying it to me like I should be flattered.", intensity: 4, emotion: ["dry", "amused"], performance: "roped, unbothered, talkative" },
    { number: 3, speaker: VANE, text: "Ground people. You do everything the slow way, and then you stand around being interesting about it.", intensity: 3, emotion: ["amused"] },
  ] },
  { arc: ARC, node: "the-census-office", lines: [
    { number: 1, speaker: r("census-clerk"), text: "Name. Home. What you can do. Who among your party is infused, and their most recent reading.", intensity: 3, emotion: ["neutral"], performance: "courteous, thorough, unmoved by hurry" },
    { number: 2, speaker: r("census-clerk"), text: "Your medic's reading. I have a form for it, the form has one box, and I am looking at her hands.", intensity: 3, emotion: ["neutral", "calm"] },
    { number: 3, speaker: CASTELLAN, text: "Say I'm fine. Please. It's one box.", intensity: 6, emotion: ["afraid"], performance: "not looking at anyone; the party has never heard her say please" },
    { number: 4, speaker: OKAFOR, text: "I have counted her doses. I will not lie to a clerk about the number. I will also not volunteer it. Decide.", intensity: 4, emotion: ["calm"], performance: "quietly, to the party" },
    { number: 5, speaker: CASTELLAN, text: "If they suspend me I can't dose in this city, and I will anyway, and then it's a stone on a slope. You've seen the slope.", intensity: 6, emotion: ["afraid", "angry"] },
    { number: 6, speaker: r("census-clerk"), text: "Clearance is not citizenship. It is permission to be present, and it is revocable. I have all day.", intensity: 3, emotion: ["neutral"] },
  ] },
  { arc: ARC, node: "find-the-soul-forge", lines: [
    { number: 1, speaker: OKAFOR, text: "Everybody in this city knows where the platforms are. The garrison Core binds Arcadians in uniform. The chapels up the slope bind citizens, for a fee, in a queue. And at the bottom of the slope there is one Sexton who will bind a foreigner, and her chapel is the poorest in the city for exactly that reason.", intensity: 4, emotion: ["calm"] },
    { number: 2, speaker: ROOK, text: "So it's not where. It's who pays.", intensity: 5, emotion: ["dry"] },
    { number: 3, speaker: OKAFOR, text: "Binding costs the machine nothing. The door costs what the city says it costs. That is the whole of Arcadia in one sentence, and we are on the wrong side of it.", intensity: 4, emotion: ["calm", "contempt"] },
  ] },
  { arc: ARC, node: "pulled-from-the-strait", lines: [
    { number: 1, speaker: r("cutter-captain"), text: "Twenty-two out of the strait. Your commander was holding two of them up when my swimmer got there. Didn't say thank you. Didn't say anything until we made port, and then asked for a count.", intensity: 4, emotion: ["calm", "dry"], performance: "flat; done this all month" },
    { number: 2, speaker: ROOK, text: "You left when I told you to. Good.", intensity: 5, emotion: ["command", "calm"], performance: "stepping onto the quay in a Guard blanket; the only thing ever said about the dock" },
    { number: 3, speaker: ROOK, text: "I'm going to stand here until I've counted you. Then I'm going to find out who in this city has a Forge and what it costs, and so are you, and we are not going to discuss the pier.", intensity: 5, emotion: ["command"] },
  ] },
  { arc: ARC, node: "the-one-who-asked", lines: [
    { number: 1, speaker: DEL, text: "You're the one who asked Rook about the infuser.", intensity: 5, emotion: ["afraid", "warm"], performance: "a pause a beat too long before it" },
    { number: 2, speaker: DEL, text: "Nobody else did.", intensity: 4, emotion: ["sad"] },
    { number: 3, speaker: DEL, text: "I don't have an answer. I've got — there's a hole where he should be, and Kestrel counted its dead twice and he wasn't in either count, and nobody else wanted to carry that, so I did. I don't know what to do with it. You asked. So.", intensity: 5, emotion: ["afraid", "warm"], performance: "quick, eager to be useful, frightened underneath; a year from happy" },
  ] },
  { arc: ARC, node: "the-price-of-permanence", lines: [
    { number: 1, speaker: OKAFOR, text: "Three people in this city will pay for you to be permanent. Every one of them will want something back. I can tell you now which costs least, and it is not the one you think.", intensity: 4, emotion: ["calm"], performance: "in front of everyone, in order" },
    { number: 2, speaker: OKAFOR, text: "The Cartel owes every survivor of Kestrel wages. I can make its factor advance them against the fee. You will be back on the payroll before you are back on a platform, and I have never lost a negotiation to a clerk.", intensity: 4, emotion: ["calm", "dry"] },
    { number: 3, speaker: ROOK, text: "Pick a creditor.", intensity: 5, emotion: ["command"] },
  ] },
  { arc: ARC, node: "the-armys-terms", lines: [
    { number: 1, speaker: r("expeditionary-officer"), text: "We pay the Congregation's fee tonight, for every name on your list. You pay us with years. The counting-house calls it a foreign legion. We call it a rifle company. Your first tasking already has a name on it.", intensity: 4, emotion: ["calm"] },
    { number: 2, speaker: ROOK, text: "Read it. All of it. Aloud. I've watched people sign for less and regret it for longer.", intensity: 6, emotion: ["command"] },
    { number: 3, speaker: r("expeditionary-officer"), text: "The Army keeps its promises to people who keep theirs. I mention it in passing.", intensity: 3, emotion: ["calm", "dry"], performance: "signing last" },
  ] },
  { arc: ARC, node: "the-directorates-price", lines: [
    { number: 1, speaker: r("directorate-agent"), text: "The archive, all of it. The prisoners, all of them. In exchange, a platform tonight for every name on your list, before any of you finds out what true death is on a Southside stair. I'm offering neither more nor quiet. Only the platform.", intensity: 4, emotion: ["calm"], performance: "a man with a case, a car, and a warrant not yet served" },
    { number: 2, speaker: VANE, text: "Directorate, is it. Fine. Ask them where my bird is. Not for me — she doesn't do well in the dark. I'd like a name before I'm somebody's paperwork.", intensity: 4, emotion: ["calm", "dry"] },
    { number: 3, speaker: VANE, text: "I'll remember who kept me fed. Ground people never think anybody's watching from above. Somebody always is.", intensity: 3, emotion: ["amused", "calm"], performance: "walked to the car" },
  ] },
  { arc: ARC, node: "the-cartels-advance", lines: [
    { number: 1, speaker: OKAFOR, text: "The Cartel owes every survivor of Kestrel wages it has not paid, and the Cartel would like a story about Ignit it can tell. The only people alive who can give you that story are standing in this warehouse bound to nothing. Advance the wages against the fee. Tonight.", intensity: 5, emotion: ["calm", "command"], performance: "stated once; she does not repeat positions" },
    { number: 2, speaker: r("stormglass-factor"), text: "The Cartel regrets the loss of Kestrel's infuser. Nine years on the payroll. We'd hoped to have him on the books a while yet.", intensity: 3, emotion: ["neutral"], performance: "a clerk in a good coat, trying the one thing that might move her" },
    { number: 3, speaker: OKAFOR, text: "His back pay is a separate conversation. I will be having it.", intensity: 4, emotion: ["calm", "angry"], performance: "after a silence exactly as long as it needs to be" },
    { number: 4, speaker: r("stormglass-factor"), text: "Advanced against the fee. You'll give us the story when we ask for it, in the shape we ask for it. Until then you're on the payroll again. Welcome back to Stormglass.", intensity: 3, emotion: ["dry"] },
  ] },
  { arc: ARC, node: "bind-to-arcadia", lines: [
    { number: 1, speaker: ROE, text: "Palm on it. It cuts. I won't tell you it doesn't.", intensity: 3, emotion: ["calm", "warm"], performance: "she never raises her voice" },
    { number: 2, speaker: ROE, text: "I don't ask what you are. I write your name, the date, and a one. That's all this book knows.", intensity: 3, emotion: ["calm"] },
    { number: 3, speaker: OKAFOR, text: "Bound. And the number in the reserve is the same as it was, because binding costs nothing. It is the coming back that costs.", intensity: 4, emotion: ["calm"] },
    { number: 4, speaker: BRASK, text: "I know what it's taking. The arm's in the pattern now. A mechanic who waits for a better arm is a mechanic who dies unbound.", intensity: 4, emotion: ["dry", "calm"], performance: "palm on the Core with the arm the sea broke" },
    { number: 5, speaker: CASTELLAN, text: "It read me. The Core. It read me and she wrote a one.", intensity: 4, emotion: ["afraid", "warm"], performance: "quietly, to the party, after" },
    { number: 6, speaker: ROOK, text: "Anyone who might stand next to me on this coast is no use to me unbound. Same as the island.", intensity: 5, emotion: ["command", "calm"], performance: "last to the Core" },
    { number: 7, speaker: ROE, text: "Whoever paid for you isn't in this room. Remember that later, when they are.", intensity: 3, emotion: ["calm", "warm"], performance: "closing the ledger" },
  ] },
];

// --------------------------------------------------------------- new ground

const wracklineMeta = {
  type: "settlement", settlementTier: "village", parent: "port-arcadia",
  biome: "black-sand strand below the wall; nets, drying racks, hulls above the tide, a lamp-chapel older than the city",
  control: [{ faction: "the-nation-state-of-arcadia", kind: "influences" as const }, { faction: "church-of-the-first-gift", kind: "influences" as const }],
  population: "Fisher families cleared to be present. Almost none of them bound.",
  connections: [{ to: "port-arcadia", by: "coastal track", notes: "Up the strand to the Waterfront's outer gate and the Census Office queue. The Defend road's survivors walk it with nothing." }],
  status: "Standing. Feeding whoever the sea leaves, and throwing one net back.",
  veilAnchorTier: null, soulForge: null, gameTag: null,
  openQuestions: [
    "Why every Wrackline crew throws one net's catch back each morning, and who first told them to. Glimpse discipline: never answered on this page.",
    "Whether the village's dead are held anywhere at all, or only buried under flat stones on the slope.",
  ],
};

const wracklineBody = `The line of wreck the tide leaves is called the wrackline, and the village is named for it, because the village is what Arcadia's wall leaves outside.

A fishing settlement on the black-sand strand below [[port-arcadia]] — nets on racks, hulls pulled up above the tide, drying fish, a chapel of the [[church-of-the-first-gift]] with a lamp in the window on a foundation stone that a [[returnees]] will tell you is older than the wall behind it. Its people are cleared to be present and not much more. They fish the reef water the city's licences do not reach, they sell to the [[waterfront-district]] at the price the Waterfront sets, and they bury their own dead up the slope under flat stones with one word on each, because the fee for the Forge door is the city's and a net does not pay it ([[reclamation]], [[true-death]]).

**It is where the Defend road comes ashore.** The survivors of [[forward-camp-kestrel]] wash up on this sand in [[binding-in-arcadia]], and the Wrackline feeds them and asks them nothing, because it stopped asking a long time ago and it never changed what came up the beach. A woman mending a net tells the party plainly that if they die here they die. She has buried soldiers before.

**And every morning, before the boats go out, every crew throws one net's catch back into the water.** All of it. Nobody in the village can say why. The custom is older than anyone's grandmother, the one year a crew skipped it was a bad year, and that is the whole of what the Wrackline will say about it — which, per [[something-under-the-war]], is exactly as much as this page will say either.

For a party: the first meal on the mainland, the first grave, the first sight of how the unbound live in the shadow of a city that rations permanence, and a coastal track up to the Census queue.`;

// ------------------------------------------------------------------------- run

async function main() {
  const identity = (await db.$queryRawUnsafe<{ current_database: string }[]>("select current_database()"))[0]?.current_database;
  const actor = await db.user.findFirst({ where: { role: "ADMIN", isActive: true }, orderBy: { id: "asc" }, select: { id: true } });
  if (!actor) throw new Error("Authoring requires an active administrator for revision authorship.");
  LineWriter.validate(lineSets);

  const writer = new BoardWriter(db, actor.id, apply);
  const lines = new LineWriter(db, actor.id, apply);
  const cast = new CastWriter(db, actor.id, apply);

  // 1. The village, so that every card naming it resolves.
  const existing = await db.storyEntry.findUnique({ where: { slug: "wrackline" }, select: { id: true, title: true, summary: true, body: true, meta: true } });
  const wracklineSummary = "The fishing village on the black sand below Arcadia's wall, where the Defend road comes ashore — nets, flat stones, a chapel older than the city, and one net thrown back every morning for a reason nobody remembers.";
  if (!existing) {
    writer.changes.push({ kind: "entry", action: "create", label: "REGION wrackline", detail: "Wrackline" });
    if (apply) {
      const created = await db.storyEntry.create({ data: { id: randomUUID(), kind: "REGION", slug: "wrackline", title: "Wrackline", summary: wracklineSummary, body: wracklineBody, status: "CANON", createdByUserId: actor.id, meta: wracklineMeta as Prisma.InputJsonValue } });
      await db.storyRevision.create({ data: { id: randomUUID(), entityType: "ENTRY", entityId: created.id, action: "CREATED", actorUserId: actor.id, summary: "Wrote \"Wrackline\" — the village below the wall where the Defend road comes ashore" } });
    }
  } else if (existing.summary !== wracklineSummary || existing.body !== wracklineBody || stableJson(existing.meta) !== stableJson(wracklineMeta)) {
    writer.changes.push({ kind: "entry", action: "update", label: "REGION wrackline" });
    if (apply) {
      await db.storyEntry.update({ where: { id: existing.id }, data: { title: "Wrackline", summary: wracklineSummary, body: wracklineBody, meta: wracklineMeta as Prisma.InputJsonValue, updatedByUserId: actor.id, version: { increment: 1 } } });
      await db.storyRevision.create({ data: { id: randomUUID(), entityType: "ENTRY", entityId: existing.id, action: "UPDATED", actorUserId: actor.id, summary: "Rewrote \"Wrackline\"" } });
    }
  } else {
    writer.changes.push({ kind: "entry", action: "unchanged", label: "REGION wrackline" });
  }

  // 2. The people who appear here for the first time on this board.
  await cast.canonise({ slug: "imogen-roe", involvement: [{ ref: ARC, kind: "ARC", how: "Binds the party and the Kestrel crew at the Lamp Chapel, writes a name, a date and a one, and asks nothing." }] });
  await cast.canonise({ slug: "del-anwar", involvement: [{ ref: ARC, kind: "ARC", how: "Recognises the party by their question, leads them toward the Southside, and stands at the back of the chapel unbound because nobody paid for him." }] });

  // 3. The board.
  for (const node of nodes) await writer.node(ARC, node);
  for (const edge of edges) await writer.edge(ARC, edge);
  for (const cut of retired) await writer.retireEdge(ARC, cut.from, cut.to, cut.label, cut.because);
  // The Army's offer now leaves a mark the creditor choice can read.
  await writer.effects(ARC, "the-army-is-interested", ["set flag: the-army-opened-a-road", "The Expeditionary Army opens a service route to the Forge.", "Kestrel's surviving wounded hold the party responsible."]);
  for (const flag of flags) await writer.flag(flag.slug, flag.title, flag.summary, flag.body);
  for (const entry of links) await writer.links(ARC, entry.node, entry.slugs);
  await writer.arcFields(ARC, {
    hook: "Kestrel's Soul Forge died with the island. Reach Port Arcadia by the road your choice earned, watch somebody die for good on the way, find out who in this city will pay for a foreigner to be permanent, and bind before anyone else does.",
    summary: "The first shared mainland chapter and the start of Act I. Defend survivors wash up at Wrackline below the wall and bury the first true death on its sand; Evacuation survivors come off the boats into the Coast Guard's hands and a manifest read aloud. Both roads pass the Census Office and its one box for the medic's reading, learn that only the Lamp Chapel binds foreigners, choose a creditor (Army, Directorate or Cartel), and bind with the Kestrel crew while Roe asks nothing.",
  });

  // 4. The lines.
  for (const set of lineSets) await lines.write(set);

  writer.report(apply ? "Binding in Arcadia — APPLYING" : "Binding in Arcadia — dry run");
  lines.report("Lines");
  cast.report("Cast");
  console.log(`\ndatabase: ${identity}  mode: ${apply ? "APPLY" : "PREVIEW"}`);
}

main().catch((error) => { console.error(error); process.exit(1); }).finally(() => db.$disconnect());
