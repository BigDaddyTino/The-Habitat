import "../lib/environment";
import { getPrismaClient } from "@habitat/db/client";
import { BoardWriter, type EdgeSpec, type NodeSpec } from "./lib/story-authoring";
import { CastWriter } from "./lib/story-cast";
import { LineWriter, c, r, type LineSet } from "./lib/story-lines";

/**
 * THE EVACUATION — the Flee branch, built out.
 *
 * Four cards and no spoken lines for the road half the players take. Canon had
 * already written the pieces — Blackreef's boats that hold less than the
 * island needs, Fort Tempest's guns deciding whether the boats live, Glasswater
 * as cargo capacity on somebody's manifest, Rook last on the dock, the Coast
 * Guard fishing Ignit's survivors out of the strait — and none of it was on the
 * board. Now the manifest is the first of four decisions, not the only one.
 *
 * Owner rulings taken 2026-09-05: Rook survives; the player chooses whether the
 * last boat waits for them. The Fort Tempest battery officer's scene is written
 * here, which per canon means this pass decides whether the guns held — it
 * makes that the player's call.
 *
 * Decisions and where they are answered:
 *   the-manifest        -> what-the-city-is-owed (existing, binding-in-arcadia)
 *   glasswater          -> binding-in-arcadia/military-docks
 *   the-guns-of-tempest -> the-harbour-run, the-last-boat (same arc)
 *   the-last-boat       -> binding-in-arcadia (a cutter puts in with Rook)
 *
 *   pnpm --filter @habitat/web exec tsx scripts/author-the-evacuation.ts
 *   pnpm --filter @habitat/web exec tsx scripts/author-the-evacuation.ts --apply
 */

const db = getPrismaClient();
const apply = process.argv.includes("--apply");
const ARC = "the-evacuation";

// ------------------------------------------------------------------ the board

const nodes: NodeSpec[] = [
  {
    key: "the-manifest", kind: "QUEST_START",
    title: "The Manifest",
    summary: "Rook gives the order the docks have been begging for, tells a party that bound an hour ago exactly what it is leaving behind, and hands the quartermaster the pen. The boats hold what they hold.",
    body: `The commander gives the order, and [[forward-camp-kestrel]] begins to pour itself down the evacuation road toward [[blackreef-harbour]].

Rook says one more thing first, to the party, because the party put its palms on the Core an hour ago and Rook was the one who made them do it. The Core is staying. The island is going. From the moment it goes, everyone who bound here is bound to nothing, and the mainland will not care how they arrived ([[true-death]]). Rook does not soften it and does not apologise for it. It was the right call an hour ago and it is the wrong one now, and Rook would make both again.

Then the boats. Fishing hulls and two military lighters, tied up at a quay where nets and ammunition crates share the same stone. Okafor has already counted them. She has already counted what is on the quay waiting to go into them, and the second number is larger than the first, and she says so, aloud, with the manifest open on a crate and a pen in her hand.

The wounded, who cannot fight and cannot be left. The powder and the four crew-served pieces, without which the survivors arrive on the mainland as refugees rather than as a unit. The intelligence archive the officers were burning an hour ago and eleven Pearl prisoners nobody wants to guard and nobody wants to leave — one of them a Hypogriff rider who keeps asking, politely, where the animal is. The civilians who trusted a mercenary cartel because it was the only thing on the island still shaped like order.

**What goes first is the branch's first real decision**, and its consequences board the boats with everyone else. Okafor will write it down exactly as it was decided, in a ledger that is going on the first boat, and somebody in [[port-arcadia]] will read it aloud on a wet quay in a voice with no weather in it.

She looks at the party. The pen is still.`,
  },
  {
    key: "who-we-carry", kind: "QUEST_STEP",
    title: "Who We Carry",
    summary: "Survivor escort through a collapsing district to the coast road — the slowest convoy of the war, guarded by everyone the manifest spared, with Glasswater's people somewhere ahead on the same road.",
    body: `Whatever was loaded first, the rest of Kestrel moves on foot: a column of wounded, civilians, camp followers and bone-tired soldiers threading a district that is actively coming apart. [[tropic-pearl-trade-house]] knows the docks are the prize now. So does the thing beneath the streets.

The party is the column's edge — scouting the route, breaking ambushes, carrying who cannot walk, and holding the line at every choke point while the slowest people the war has left alive shuffle past behind them. **Marren** runs the front and is right about every corner. **Castellan** walks the middle with the stretchers, dosing before every contact without being asked, and by the second hour her hands are the steadiest thing in the column. **Brask** is at the rear with a rifle he does not like, because the generators are staying and there is nothing left for him to keep alive except people.

The district is worse than it was in daylight. [[the-risen]] have learned the streets. They come out of cellars and drains, and once out of a school, and they go for the wounded on the stretchers because the wounded cannot run, and the party learns to shoot the ones that are down and to make sure. A Pearl fire team catches the column at a crossroads and is professional about it; the column's rearguard is professional back, and three men who were alive at the crossroads are not alive past it, and their Echoes light at a Core that is going into the sea tomorrow.

And on the coast road ahead, where it comes down from [[glasswater-village]] to the harbour, there is another column. Slower. Fishing families with their lives in carts, a clinic's worth of patients, and a harbourmaster on a radio asking [[forward-camp-kestrel]] whether the boats are waiting.

Nobody at Kestrel has answered him yet.`,
    completion: "Bring the column through the district to the coast road with as many of the people the manifest spared as the streets allow.",
  },
  {
    key: "glasswater", kind: "CHOICE", x: 520, y: -140,
    title: "The Coast Road",
    summary: "Glasswater's column is on the coast road and Pearl is closing it. Hold the boats for a village, send one scout for one family, or make the tide.",
    body: `The harbourmaster's voice comes over the radio every few minutes now, and every few minutes it is the same question with less in it.

[[glasswater-village]] is on the coast road. All of it — the fishing families, the clinic and its patients, the two families whose fates the island has been keeping score of since the war began ([[the-island-remembers]]). They are slow because they are carrying their lives, and they are on the wrong side of a Pearl fire team that is moving to cut the road between them and [[blackreef-harbour]], and the tide that lets a loaded boat clear the reef is not going to wait for anybody.

**Marren asks to go.** Not for the village. For one house in it, where a woman fed him for three weeks when she was not supposed to, and he wants to know she gets on a boat. He says it plainly and does not dress it up as tactics, which is the most grown-up thing anyone has heard him say.

Rook lays out the arithmetic without decoration. Hold the column at the harbour for Glasswater and the boats leave late, under fire, with Pearl on the coast road behind the last of them. Send one scout for one family and the rest of the village finds out what Pearl does with a road it has cut. Make the tide, and Glasswater is a name on a list that [[free-islander-league]] will read aloud in every harbour on the coast for a generation.

Boats hold what they hold. Rook has said that once already today and does not say it again.

The harbourmaster asks whether the boats are waiting. Somebody has to answer him.`,
  },
  {
    key: "the-guns-of-tempest", kind: "CHOICE", x: 780, y: -140,
    title: "The Guns of Tempest",
    summary: "Fort Tempest's battery commands the only safe channel off the island. Lieutenant Coyle can keep firing until the boats clear the reef, or the crew can be on the boats. Not both.",
    body: `[[fort-tempest]] sits on the north-east shore with its guns laid on the channel, and the channel is the only water a loaded boat can cross without the reef opening it like a tin.

**Lieutenant Coyle** is on the radio from the battery, and Coyle's voice is the calmest thing on the island, because Coyle has been thinking about exactly this night for months and has arrived at it with the guns clean. The battery can cover the channel. It can put fire on the Pearl flotilla that is already working around the headland to meet the boats, and it can keep putting fire there until the last hull is past the reef line.

What it cannot do is be on the boats while it does that.

There are no boats left for the gun crew. There were never going to be. A crew that fires last leaves last, if at all, and the island is going into the sea, and every one of them bound at a Core that is going with it. Coyle knows this. Coyle has known it for months, and says so in a voice that asks for nothing except to be told the guns were worth it.

Or the crew comes down now. Abandon the battery, run for the quay, take the seats the manifest left, and cross a channel with no umbrella over it, into a Pearl flotilla that knows the guns have gone quiet and knows what that means.

Rook does not decide this. Rook says Coyle's call is Coyle's call and Coyle says, quietly, that Coyle would like it to be somebody's who is going to live.

The party has the radio.`,
  },
  {
    key: "the-harbour-run", kind: "QUEST_STEP",
    title: "The Harbour Run",
    summary: "The final contested push to the boats, pier by pier. Pearl wants the docks intact; the island wants nobody to leave at all; and under the pilings the water is moving wrong.",
    body: `The waterfront is the last argument of the campaign for this island, and everyone is making it at once.

[[tropic-pearl-trade-house]] contractors racing along the quay to take the docks whole, because a harbour is an asset and an asset is not shot up. [[stormglass-cartel]] rearguards feeding themselves into the delay one section at a time — Okafor counts them going in, aloud, and stops counting when the number stops mattering. And under it all the water itself moving wrong around the pilings: a slow swell against the tide, a pressure the boats feel in their hulls before anybody sees anything, something vast keeping pace with the evacuation from below and in no hurry about it ([[something-under-the-war]]).

The run to the boats is fought pier by pier. Lines are cut under fire. A lighter takes a round through the wheelhouse and the coxswain is a smear on the glass and Brask has the wheel before the boat has finished swinging. A rearguard section on the second pier is overrun by something that came up through the planking rather than along it, and what is left of them does not need a medic, and Castellan does not go, and does not forgive herself for the right decision.

**The tide is right for the length of one held breath.** The last boat's engine catches on the second try, which is one try later than anyone's nerves could afford.

Rook is on the quay. Rook has not moved from the quay. Rook is counting people onto boats with a hand on each shoulder and will not be counted.

Get aboard. Get everyone aboard who can still be gotten.`,
    completion: "Fight the column onto the boats pier by pier, under whatever cover the battery gave you, until the last hull's engine catches.",
  },
  {
    key: "the-last-boat", kind: "CHOICE", x: 1300, y: -140,
    title: "The Last Boat",
    summary: "The last boat is full, the pier is going, and Rook is on the dock with the rearguard and has given the order to leave. Hold the boat under fire, or go.",
    body: `The last boat is full.

It is full the way a boat is full when the people in it are lying on each other and the gunwale is a hand above the water, and it is tied to a pier that is being shot at from the quay and shaken from underneath, and its engine is running, and it has not left.

Because Rook is on the dock.

Rook and the rearguard — a dozen Stormglass soldiers who fed themselves into the delay so that this boat could be full — are on the last dry stone of [[blackreef-harbour]] with Pearl coming down the quay and the water coming up through the planking. Rook has given the order to cast off. Rook has given it twice, in the voice that ends conversations, and the coxswain has not obeyed because the coxswain is looking at the party.

Hold the boat and it waits under fire. Every second on that pier is a round into a hull already a hand above the water, and the wounded on the deck cannot move and are lying where the rounds are landing. Cast off and Rook is on the dock, standing, the way Rook is always standing, watching the boat go.

Okafor has the manifest against her chest. She is not writing.

Whoever the party is, and whatever they carried, this is the last thing the island asks them.`,
  },
  {
    key: "wake-of-the-island", kind: "ENDING", endingKind: "SUCCESS", continuesInSlug: "binding-in-arcadia",
    title: "The Island Burns Behind Us",
    summary: "Flee branch conclusion: departure by boat, the crossing, and arrival at Port Arcadia's military port. A SUCCESS with a long shadow, and a list of what it could not carry.",
    body: `The boats pull out through violent water, and nobody on deck says anything, because the view says it all: the island burning stem to stern, the smoke leaning east, and — just once, far off, where the water goes deep — a shape beneath the surface that is patient and enormous and not done.

Then the island goes. Not a sound so much as a subtraction: the fires slide, the skyline shortens, and [[forward-camp-kestrel]]'s Core goes into the sea with everything bound to it, and every person on these boats feels the same thing at the same moment and none of them has a word for it. There is nowhere to come back to. Castellan says it first, because a medic knows what a missing pulse feels like from the outside.

Okafor counts. Aloud, on the deck, in the dark, while the boats take the swell. Who is on each hull. What is under the tarpaulins. What the manifest said and what the manifest did not. She writes nothing down until she has said it all once, and then she writes it exactly as it happened, because a ledger that lies is a ledger, and she has already written one covering entry in her life and will not write two.

Tino's plan comes to the party unbidden: a boat, a little piece of coast, cold beer, fishing. This is a boat. It is not that boat.

The military port takes the survivors in at grey dawn — [[port-arcadia]], the mainland, the wider war. Somewhere in its intelligence net is a file on what hunts like the thing that took him. The evacuation saved everyone it could. The list of what it could not is the cargo nobody declared, and it is on the first boat, in a ledger, in a quartermaster's hand.`,
  },
];

const edges: EdgeSpec[] = [
  // The three manifest routes exist and keep their flags; who-we-carry now opens onto the coast road.
  { from: "who-we-carry", to: "glasswater" },
  { from: "glasswater", to: "the-guns-of-tempest", label: "Hold the column for Glasswater. Nobody leaves until the village is on the road.", voiced: true,
    effects: ["set flag: glasswater-came-aboard", "Pearl closes the coast road behind the last of the village; the column reaches Blackreef under fire and the boats leave later than the tide wanted."] },
  { from: "glasswater", to: "the-guns-of-tempest", label: "Send Marren for the family that fed him, and move.", voiced: true,
    effects: ["One family reaches the harbour with Marren. The rest of Glasswater is on the coast road when Pearl cuts it, and the harbourmaster stops calling.", "Marren knows she got on a boat. He does not talk about the others."] },
  { from: "glasswater", to: "the-guns-of-tempest", label: "Make the tide. Boats hold what they hold.", voiced: true,
    effects: ["Glasswater is left to Pearl and to whatever is spreading from the Riftwood. The column makes the tide with room to spare.", "The Free Islander League will read the village's name aloud in every harbour on the coast for a generation."] },
  { from: "the-guns-of-tempest", to: "the-harbour-run", label: "Tempest fires last. The battery stays on the guns until the boats clear the reef.", voiced: true,
    effects: ["set flag: tempest-fired-last", "The channel is covered the whole way out. Coyle and the gun crew are on the island when the last boat leaves."] },
  { from: "the-guns-of-tempest", to: "the-harbour-run", label: "Pull the crew now. Nobody stays on an island that is sinking.", voiced: true,
    effects: ["set flag: tempest-crew-aboard", "The boats cross under Pearl fire with no umbrella. Two hulls take hits before the reef line, and the last boat is short of seats."] },
  { from: "the-harbour-run", to: "the-last-boat", label: "Under the guns", condition: "tempest-fired-last",
    effects: ["Tempest's fire lands on the Pearl flotilla around the headland for the whole of the run; the boats reach the reef line with every hull afloat."] },
  { from: "the-harbour-run", to: "the-last-boat", label: "Naked across the reef", condition: "tempest-crew-aboard",
    effects: ["Pearl's flotilla works the channel unopposed; two boats are holed before the reef, and the wounded on their decks do not all reach the mainland."] },
  { from: "the-last-boat", to: "wake-of-the-island", label: "Hold the boat. Nobody leaves until the commander is aboard.", voiced: true,
    effects: ["The boat waits under fire. The hull takes a round at the waterline and two of the wounded on the deck are dead before it clears the pier.", "Rook boards last, on the party's insistence, and does not thank them."] },
  { from: "the-last-boat", to: "wake-of-the-island", label: "Go. Rook gave the order.", voiced: true,
    effects: ["set flag: rook-left-on-the-dock", "Rook is on the last dry stone of Blackreef with the rearguard when the boat clears the pier, standing, watching it go."] },
  { from: "the-last-boat", to: "wake-of-the-island", label: "Put the gun crew off to make room for the wounded.", condition: "tempest-crew-aboard", voiced: true,
    effects: ["The crew that left the guns stands on the pier while the wounded take their seats. Coyle does not argue, and steps off first.", "Rook boards in the room the crew made, and says nothing about it to anyone, ever."] },
];

const retired: Array<{ from: string; to: string; label: string | null; because: string }> = [
  { from: "who-we-carry", to: "the-harbour-run", label: null, because: "the coast road (glasswater) and the battery (the-guns-of-tempest) now sit between them" },
  { from: "the-harbour-run", to: "wake-of-the-island", label: null, because: "the last boat (the-last-boat) now sits between them, and the run's two shapes are labelled by what the battery did" },
];

const links: Array<{ node: string; slugs: string[] }> = [
  { node: "the-manifest", slugs: ["forward-camp-kestrel", "blackreef-harbour", "the-kestrel-commander", "the-kestrel-quartermaster", "the-captured-rider", "true-death", "port-arcadia", "manifest-wounded-first", "manifest-munitions-first", "manifest-archives-and-prisoners"] },
  { node: "who-we-carry", slugs: ["tropic-pearl-trade-house", "something-under-the-war", "the-risen", "glasswater-village", "forward-camp-kestrel", "the-kestrel-scout", "the-kestrel-medic", "the-kestrel-mechanic"] },
  { node: "glasswater", slugs: ["glasswater-village", "blackreef-harbour", "the-island-remembers", "the-kestrel-scout", "the-kestrel-commander", "free-islander-league", "tropic-pearl-trade-house"] },
  { node: "the-guns-of-tempest", slugs: ["fort-tempest", "the-tempest-battery-officer", "the-kestrel-commander", "tropic-pearl-trade-house", "true-death"] },
  { node: "the-harbour-run", slugs: ["stormglass-cartel", "tropic-pearl-trade-house", "something-under-the-war", "blackreef-harbour", "the-kestrel-commander", "the-kestrel-quartermaster", "the-kestrel-medic", "the-kestrel-mechanic"] },
  { node: "the-last-boat", slugs: ["blackreef-harbour", "the-kestrel-commander", "the-kestrel-quartermaster", "stormglass-cartel"] },
  { node: "wake-of-the-island", slugs: ["port-arcadia", "tino", "the-fall-of-the-starting-island", "forward-camp-kestrel", "true-death", "the-kestrel-quartermaster", "the-kestrel-medic", "something-under-the-war"] },
];

const flags: Array<{ slug: string; title: string; summary: string; body: string }> = [
  { slug: "glasswater-came-aboard", title: "Glasswater Came Aboard", summary: "The evacuation held the boats for Glasswater's column and brought the village off the island under fire.",
    body: "Set at *The Coast Road* in [[the-evacuation]] and read at the military docks in [[binding-in-arcadia]], where [[glasswater-village]]'s people stand in the Census queue beside Kestrel's and are counted as what the manifest called them." },
  { slug: "tempest-fired-last", title: "Tempest Fired Last", summary: "The Fort Tempest battery stayed on its guns until the boats cleared the reef. The channel was covered, and the gun crew was on the island when the last boat left.",
    body: "Set at *The Guns of Tempest* in [[the-evacuation]] and read at *The Harbour Run*, where it shapes the crossing. [[the-tempest-battery-officer]]'s want — to have been right about the channel — turns on this flag; whether Coyle lived to ask is the writer's to decide later." },
  { slug: "tempest-crew-aboard", title: "The Tempest Crew Came Down", summary: "The battery was abandoned so the gun crew could take seats on the boats. The channel was naked, hulls were holed, and the last boat was short.",
    body: "Set at *The Guns of Tempest* in [[the-evacuation]] and read twice in the same arc — at *The Harbour Run*, where the crossing goes uncovered, and at *The Last Boat*, where the crew that left the guns can be put off the boat to make room for the wounded." },
  { slug: "rook-left-on-the-dock", title: "Rook Left on the Dock", summary: "The last boat cast off on Rook's order with Rook still on the pier beside the rearguard.",
    body: "Set at *The Last Boat* in [[the-evacuation]] and read in [[binding-in-arcadia]], where a [[peninsula-coast-guard-authority]] cutter puts in days later with what the strait gave back. Rook survives either way — canon fixes them as still standing when everyone stops — but a Rook fished out of the water arrives late, in a blanket, in somebody else's custody, and remembers who obeyed the order." },
];

// --------------------------------------------------------------- the dialogue

const ROOK = c("the-kestrel-commander");
const OKAFOR = c("the-kestrel-quartermaster");
const CASTELLAN = c("the-kestrel-medic");
const BRASK = c("the-kestrel-mechanic");
const MARREN = c("the-kestrel-scout");
const COYLE = c("the-tempest-battery-officer");
const VANE = c("the-captured-rider");

const lineSets: LineSet[] = [
  { arc: ARC, node: "the-manifest", lines: [
    { number: 1, speaker: ROOK, text: "Boats. Now.", intensity: 7, emotion: ["command"] },
    { number: 2, speaker: ROOK, text: "You bound to my Core an hour ago and the Core is staying. From the moment this island goes under you are bound to nothing, and Arcadia won't care how you got there. Get across and fix that before anything gets a look at you.", intensity: 6, emotion: ["command", "calm"], performance: "to the party; the right call an hour ago, the wrong one now, and they would make both again" },
    { number: 3, speaker: OKAFOR, text: "Two lighters and eight hulls. What is on the quay is more than what will float. I am going to write down what goes first exactly as it is decided, so decide it in words I can write.", intensity: 4, emotion: ["calm"], performance: "the manifest open on a crate, pen still" },
    { number: 4, speaker: VANE, text: "Excuse me. Sorry. Whoever's in charge of the rope — where's my bird? Not for me. She doesn't do well in the dark.", intensity: 4, emotion: ["calm", "amused"], performance: "a prisoner, roped, entirely unbothered, asking for the third time" },
    { number: 5, speaker: ROOK, text: "Wounded, powder, or paper. Somebody say it.", intensity: 6, emotion: ["command"] },
  ] },
  { arc: ARC, node: "who-we-carry", lines: [
    { number: 1, speaker: MARREN, text: "Cellar on the left's open and it wasn't this morning. Stretchers to the right side of the street. Don't look at me like that, just do it.", intensity: 6, emotion: ["urgent"] },
    { number: 2, speaker: CASTELLAN, text: "Shoot the ones that are down. All the way down. I'm not stitching anybody twice tonight.", intensity: 7, emotion: ["command", "angry"] },
    { number: 3, speaker: r("radio"), text: "Kestrel, Glasswater harbourmaster. We are on the coast road with the whole village and a Pearl team is moving to the junction ahead of us. Are the boats waiting. Kestrel, are the boats waiting.", intensity: 6, emotion: ["afraid", "calm"], performance: "radio; a civilian trying to sound like a soldier and nearly managing" },
    { number: 4, speaker: BRASK, text: "Nothing left back there to keep running. So I'm keeping you lot running. Move.", intensity: 5, emotion: ["dry"], performance: "rearguard, with a rifle he does not like" },
  ] },
  { arc: ARC, node: "glasswater", lines: [
    { number: 1, speaker: MARREN, text: "Let me go. Not for the village. There's a house at the top of the inlet — she fed me for three weeks when she wasn't supposed to and I want to know she gets on a boat. That's all. That's the whole reason.", intensity: 6, emotion: ["protective", "afraid"], performance: "plain; the most grown-up thing anyone has heard him say" },
    { number: 2, speaker: ROOK, text: "Hold for the village and we leave late, under fire, with Pearl behind the last of them. Send him for one house and the rest find out what Pearl does with a road it's cut. Make the tide and Glasswater is a name the League reads out for a generation.", intensity: 5, emotion: ["calm"], performance: "the arithmetic, undecorated" },
    { number: 3, speaker: r("radio"), text: "Kestrel, we can see the junction. We can see them at the junction. Please tell me the boats are waiting.", intensity: 7, emotion: ["afraid"], performance: "radio; the harbourmaster, the last of the soldier gone out of his voice" },
    { number: 4, speaker: MARREN, text: "Somebody answer him.", intensity: 6, emotion: ["angry", "sad"] },
  ] },
  { arc: ARC, node: "the-guns-of-tempest", lines: [
    { number: 1, speaker: COYLE, text: "Kestrel, Tempest. Battery is laid on the channel and the guns are clean. I have a Pearl flotilla working round the headland to meet your boats. I can keep fire on them until your last hull is past the reef line. Say the word.", intensity: 5, emotion: ["calm"], performance: "radio; the calmest voice on the island, because this night has been thought about for months" },
    { number: 2, speaker: ROOK, text: "Coyle. There are no boats for you if you fire last. You know that.", intensity: 5, emotion: ["calm"] },
    { number: 3, speaker: COYLE, text: "I've known it since spring, Commander. Crew knows it too. We'd like it to have been worth something, and we'd like somebody who's going to live to be the one who says so.", intensity: 5, emotion: ["calm", "sad"], performance: "radio; asking for nothing except to be told the guns were worth it" },
    { number: 4, speaker: ROOK, text: "It's your call, Lieutenant.", intensity: 4, emotion: ["calm"] },
    { number: 5, speaker: COYLE, text: "Respectfully, Commander, I'd rather it was theirs. They've got the radio.", intensity: 4, emotion: ["calm", "dry"], performance: "radio; to the party, without ever having met them" },
  ] },
  { arc: ARC, node: "the-harbour-run", lines: [
    { number: 1, speaker: OKAFOR, text: "Second section going in. Third. That is the rearguard, all of it, and I am going to stop counting now because the number has stopped meaning anything.", intensity: 5, emotion: ["calm", "sad"] },
    { number: 2, speaker: r("radio"), text: "Tempest, Tempest, rounds landing on the flotilla — good effect, good effect, keep it coming, they're turning —", intensity: 8, emotion: ["urgent"], performance: "radio; a coxswain, only if the battery is firing" },
    { number: 3, speaker: BRASK, text: "I've got the wheel. Don't look at the glass. I said don't look at it.", intensity: 7, emotion: ["command"], performance: "the lighter; the coxswain is on the wheelhouse glass" },
    { number: 4, speaker: ROOK, text: "Next. Next. Get on the fucking boat, I'm not asking you, I'm counting you.", intensity: 8, emotion: ["command"], performance: "the quay, a hand on each shoulder, not moving from the stone" },
    { number: 5, speaker: CASTELLAN, text: "No. No, I'm not going over there. There's nothing over there I can help.", intensity: 7, emotion: ["afraid", "sad"], performance: "the second pier; the right decision, unforgiven" },
  ] },
  { arc: ARC, node: "the-last-boat", lines: [
    { number: 1, speaker: ROOK, text: "Cast off. That's twice. I won't say it three times, I'll shoot the rope.", intensity: 8, emotion: ["command"], performance: "the dock; the voice that ends conversations" },
    { number: 2, speaker: r("coxswain"), text: "Say the word and we go. Say it. I'm not leaving the commander on my own say-so.", intensity: 7, emotion: ["afraid", "urgent"], performance: "to the party, hand on the throttle" },
    { number: 3, speaker: COYLE, text: "Put us off. We left the guns; we don't get the seats. Do it before I change my mind.", intensity: 5, emotion: ["calm", "sad"], performance: "only if the battery crew came down; stepping off first" },
    { number: 4, speaker: OKAFOR, text: "I am not writing this down until somebody decides it.", intensity: 4, emotion: ["calm"], performance: "the manifest against her chest" },
  ] },
  { arc: ARC, node: "wake-of-the-island", lines: [
    { number: 1, speaker: CASTELLAN, text: "It's gone. The Core. Can you — no, you can't. I can. It feels like a pulse that isn't there.", intensity: 4, emotion: ["sad", "afraid"], performance: "on deck, in the dark, as the skyline shortens" },
    { number: 2, speaker: OKAFOR, text: "First hull: fourteen, four of them wounded. Second: the guns and the powder and six to serve them. Third —", intensity: 3, emotion: ["calm"], performance: "the count, aloud, before she writes any of it" },
    { number: 3, speaker: OKAFOR, text: "I have written one covering entry in my life. I will not write two. It goes down exactly as it happened.", intensity: 4, emotion: ["calm"], performance: "to nobody; the pen finally moving" },
  ] },
];

// ------------------------------------------------------------------------- run

async function main() {
  const identity = (await db.$queryRawUnsafe<{ current_database: string }[]>("select current_database()"))[0]?.current_database;
  const actor = await db.user.findFirst({ where: { role: "ADMIN", isActive: true }, orderBy: { id: "asc" }, select: { id: true } });
  if (!actor) throw new Error("Authoring requires an active administrator for revision authorship.");
  LineWriter.validate(lineSets);

  const writer = new BoardWriter(db, actor.id, apply);
  const lines = new LineWriter(db, actor.id, apply);
  const cast = new CastWriter(db, actor.id, apply);

  // The battery officer and the captured rider speak here for the first time.
  await cast.canonise({
    slug: "the-tempest-battery-officer", fullName: "Lt Idris Coyle",
    involvement: [{ ref: ARC, kind: "ARC", how: "On the radio from Fort Tempest, offering to fire last; whether the guns held is the party's call, and Coyle asks for nothing but to be told it was worth it." }],
    answered: ["Did the guns hold, and does the officer's answer match the branch the player took?"],
    append: `## The guns, answered (2026-09-05)

Whether the battery held the channel is the player's decision at *The Guns of Tempest* in [[the-evacuation]], and canon records it as [[tempest-fired-last]] or [[tempest-crew-aboard]]. Coyle asked for the call to belong to somebody who was going to live. Whether Coyle lived — on a sinking island after firing last, or on a pier after being put off the last boat — is still the writer's to decide when the Suppression lesson is written; the case in a rating's pocket ([[tempest-shell-case]]) says only that somebody was there.`,
  });
  await cast.canonise({
    slug: "the-captured-rider", fullName: "Hollis Vane",
    involvement: [
      { ref: ARC, kind: "ARC", how: "One of the eleven Pearl prisoners on the quay at Blackreef, roped and unbothered, asking where her animal is." },
      { ref: "binding-in-arcadia", kind: "ARC", how: "Comes off the boats as leverage if the archive and prisoners were loaded, and is sold, traded or kept with the rest of them." },
    ],
  });

  for (const node of nodes) await writer.node(ARC, node);
  for (const edge of edges) await writer.edge(ARC, edge);
  for (const cut of retired) await writer.retireEdge(ARC, cut.from, cut.to, cut.label, cut.because);
  for (const flag of flags) await writer.flag(flag.slug, flag.title, flag.summary, flag.body);
  for (const entry of links) await writer.links(ARC, entry.node, entry.slugs);
  await writer.arcFields(ARC, {
    summary: "The Flee branch, in full. Kestrel empties into the boats at Blackreef: the manifest decided in words Okafor can write, a column through streets the risen have learned, Glasswater on a coast road Pearl is cutting, Fort Tempest's guns and a crew that cannot be in two places, a harbour run over water that is moving wrong, and a last boat that is full while Rook is still on the dock. Then the crossing, the Core going under, and Arcadia at grey dawn.",
  });
  for (const set of lineSets) await lines.write(set);

  writer.report(apply ? "The Evacuation — APPLYING" : "The Evacuation — dry run");
  lines.report("Lines");
  cast.report("Cast");
  console.log(`\ndatabase: ${identity}  mode: ${apply ? "APPLY" : "PREVIEW"}`);
}

main().catch((error) => { console.error(error); process.exit(1); }).finally(() => db.$disconnect());
