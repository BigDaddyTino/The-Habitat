import "../lib/environment";
import { getPrismaClient } from "@habitat/db/client";
import { BoardWriter, type EdgeSpec, type NodeSpec } from "./lib/story-authoring";
import { CastWriter } from "./lib/story-cast";
import { LineWriter, c, r, type LineSet } from "./lib/story-lines";

/**
 * THE LAST DAYS OF KESTREL — the Defend branch, built out.
 *
 * The board had eight cards, one spoken line, and one decision. The character
 * bible had already reserved and drawn the four people who run the camp under
 * Rook — Okafor, Castellan, Brask, Marren — and canon had already written the
 * siege clock (the reserve, the horn, Written Defeat) and the load path Brask
 * read a day early. None of it was on the board. This pass puts it there.
 *
 * Owner rulings taken 2026-09-05: the placeholder names stand and are canon;
 * Rook survives both roads; the four crew are alive at the end of the chapter
 * (their sheets say so — the cost of the branch falls on the unnamed).
 *
 * What a player decides here and where it is answered:
 *   what-we-protect         -> the-count (three routes into the horn)
 *   the-man-who-would-not-leave -> effects the game interprets; the reserve
 *   the-dead-do-not-wait    -> what-the-road-held / held-the-wire (existing)
 *   the-load-path           -> every-fucking-meter -> the-sea-takes-the-island
 *
 *   pnpm --filter @habitat/web exec tsx scripts/author-kestrel-last-days.ts
 *   pnpm --filter @habitat/web exec tsx scripts/author-kestrel-last-days.ts --apply
 */

const db = getPrismaClient();
const apply = process.argv.includes("--apply");
const ARC = "the-last-days-of-kestrel";

// ------------------------------------------------------------------ the board

const nodes: NodeSpec[] = [
  {
    key: "dig-in", kind: "QUEST_START",
    title: "Make Them Pay For It",
    summary: "Kestrel stops pretending it might leave. Rook gives the camp its shape, the four who run it stop waiting to be told what they are for, and the quartermaster says the count aloud.",
    body: `Kestrel stops pretending it might leave.

[[the-kestrel-commander]] says it once, at the table, and the camp changes shape around the sentence: engineers who were packing tools an hour ago are welding them to the wall instead, the boats at [[blackreef-harbour]] are cut loose to whoever still wants them, and the four people who actually run [[forward-camp-kestrel]] stop waiting to be told what they are for.

**Brask**, [[the-kestrel-mechanic]], is already under the Forge housing with a lamp in his teeth, because the generators and the Core share a floor and he has opinions about the floor. **Castellan**, [[the-kestrel-medic]], has been turning the mess into a clinic for an hour, and her hands are steady in the specific way that means she dosed before anybody asked her to. **Marren**, [[the-kestrel-scout]], who called the rider's search pattern over [[shattermarket]] before anyone believed him, is at the wire with a map nobody has looked at. And **Okafor**, [[the-kestrel-quartermaster]], is standing at the Core with the count.

She says it aloud. That is what the count is for.

Two hundred and twelve [[essence]] in the reserve. Forty-seven to build a body at the bottom of the ladder, more for anybody who has lived a little. Four reclamations, five if nobody important dies. Below thirty-five the machine builds nothing at all and she sounds the horn, and after the horn everybody who dies stays dead ([[reclamation]]). She does not lower her voice for any of it. A [[returnees]] does not.

Rook lets the number sit in the room until everyone has heard it.

Every task in the camp is now the same task wearing different gloves: buy time, and sell it dear. Reinforce the wall. Bring the generators back. And decide — because there is not enough of anything to protect everything — what this camp is going to keep and what it is going to spend. The camp's survival is a ledger, and the party holds the pen.`,
    effects: ["The siege clock starts: two hundred and twelve Essence in Kestrel's reserve, the horn at thirty-five."],
  },
  {
    key: "what-we-protect", kind: "CHOICE", x: 260, y: -140,
    title: "What We Keep",
    summary: "There is enough plate, wire and hands to do one thing properly. Brask wants the Forge housing, Castellan wants the clinic, Okafor wants the wall. Rook wants an answer.",
    body: `Rook lays it out on the table without decoration, because decoration takes time.

There is enough plate, enough wire and enough hands to do one thing properly before Pearl comes back in strength. Not two. Anyone who says two is lying to make the room feel better, and Rook does not let people do that in this room.

**Brask** wants the Forge housing. The Core and the generators share a floor, the floor is the softest ground in the camp, and a mortar through that roof ends every argument anybody is having about anything else. He says it in about that many words.

**Castellan** wants the clinic. Whoever comes back needs somewhere to come back to, and whoever does not come back needs somewhere to do it that is not the open ground in front of the wall. She says it quickly, and then asks when the next issue is due, and everyone hears it.

**Okafor** wants the wall and the stores. A camp that cannot shoot has no use for a Forge, and she has the count that says how many rounds it has left to shoot with. She does not raise her voice. She has never needed to.

None of them is wrong. That is the design of the scene and the design of the branch: three competent people, three correct answers, one set of hands.

Rook looks at the party.`,
  },
  {
    key: "the-scattered-living", kind: "QUEST_STEP",
    title: "Whoever's Still Breathing",
    summary: "Rescue and recruitment sweeps beyond the wire, led by a scout nobody listened to in time. Every survivor brought in is a rifle on the wall and a mouth in the mess, and the island does not give them up for free.",
    body: `The commander's words made it sound simple: find whoever's still breathing. Out past the wire it is anything but.

**Marren leads.** He is the only person in the camp who has walked the district since [[the-strike]] and come back, and he knows which streets Pearl patrols by the clock and which ones nobody patrols because of what is in the cellars. He talks too much on the way out and not at all on the way back, and he is right about every corner before you reach it, which is starting to bother him.

Two [[stormglass-cartel]] checkpoints are still standing out there, each holding a handful of soldiers who have not heard that Kestrel is staying. Bring either one home and the wall gains a section it did not have. Lose either one and the camp's population is smaller in a way [[the-island-remembers]].

The cellars are worse than the streets. Stragglers holed up in shattered strongpoints, each rescue a small war of its own. A Pearl contractor bled out on a cellar stair with a family behind him who did not do it and cannot say what did. A basement where something from the crater got in first, and what it left is not a body so much as a place where a body was distributed. [[the-risen]] do not stay in the craters after dark any more.

Out at [[glasswater-village]] the clinic has an extraction ward in the back that nobody at Kestrel ordered and nobody at Kestrel shuts down, because the doses it produces are keeping the wall's infused on their feet. [[the-harvest-economy]] has a foothold even here, among the people with the least protection from it, and the party walks past it carrying stretchers.

Some will not come. Some cannot. And in the last cellar on Marren's map there is a soldier who refuses to leave his wounded friend, and what the party does about that is the kind of choice this branch is made of.`,
    completion: "Sweep the district for survivors and bring back who can be brought — soldiers, civilians, and the two checkpoints if they still stand.",
  },
  {
    key: "the-man-who-would-not-leave", kind: "CHOICE", x: 780, y: -140,
    title: "He Is Bound",
    summary: "A Stormglass private will not leave his gut-shot friend. The friend bound at Kestrel this morning, which means leaving him is not murder — it is forty-seven Essence off a reserve of two hundred and twelve.",
    body: `A cellar under a bakery, three streets from the wire, and two men on the floor of it.

One of them has a hole in his belly the size of a fist and a colour in his face that Castellan reads from the doorway. The other has a rifle across his knees and has not slept, and he says the same thing every time anyone speaks to him.

He is not leaving him.

**And here is what makes this a Kestrel decision and not an ordinary one.** The wounded man bound at the Core this morning, with everyone else. If he dies on this floor he does not stop existing. The Echo lights, the lights across the camp dim, and the machine builds him again on the platform — for forty-seven [[essence]], out of a reserve of two hundred and twelve that Okafor said aloud in front of everybody ([[reclamation]]). Leaving him to die is not abandoning him. It is spending him.

Castellan can save him here. She says so, flatly, looking at the wound and not at anyone's face. It will take the thing she does that needed a table, on a cellar floor, and it will take a dose, and she will need it now, and nobody in the room pretends they do not know what a dose costs her.

The private looks at you. He has worked out that you are the ones who decide.`,
  },
  {
    key: "the-long-nights", kind: "QUEST_STEP",
    title: "The Long Nights",
    summary: "Pearl probes by day and prices the camp like a debt. Then the attacks come after dark, and some of what is in the wire has no employer. The reserve drops, the doses go missing, and the mechanic chalks a line on the floor.",
    body: `The first assaults are professional. [[tropic-pearl-trade-house]] fire teams come up the west approach in daylight, plate sigils saying which ward they bought, and they probe the wire the way accountants probe a debt — one section at a time, pricing what it costs to move it. The walls hold. The turrets earn their repairs. One night an [[iron-saints-pmc]] shock team comes over the north wire wearing cosmesis and no tells at all, and Brask has the wire live before they are halfway across, and the chrome vents, and for a full minute the cleanest soldiers on the island cannot make their own arms answer them. The party learns what that minute is for.

Then the attacks start coming after dark, and some of the things in the wire have no employer.

[[the-risen]] climb out of the craters in numbers now — skeletal things, and fresh things hinged wrong, and once a Pearl contractor the camp shot on Tuesday walking back up to the wall on Thursday with his sigil still on his plate. They take the wounded first. They take them slowly. The party learns to shoot the ones that are down, and to make sure.

Twice the Core ignites. Everyone in the camp watches: the lights dim, the rings spin, a silhouette of raw energy resolves into skeleton, muscle, vessels, skin, and a man drops naked onto the platform and inhales like he is being born, which he is. The second time it is a woman who was concealing a phase, and the platform announces it for her.

Okafor counts after each one, aloud. She also counts the clinic's dose crate, and she does that aloud too, and the second number is not the number it should be.

And under the Forge housing, every night, Brask is on his back with a lamp and a piece of chalk, marking a line across the floor that nobody asked him to mark. When Rook asks what it is he says it is the load path. When Rook asks what that means he says it means the island is going to break along it, and not next week.`,
    completion: "Hold the wall through the escalating assaults — Pearl by day, the Saints once, and the things with no employer after dark — while the reserve and the dose crate drop.",
  },
  {
    key: "the-load-path", kind: "CHOICE", x: 1300, y: -140,
    title: "A Day Early",
    summary: "Brask says the island gives way tomorrow, not next week, and the Core floor goes first. Rook has one night of wall to spend and one mechanic who has never been wrong about a structure.",
    body: `Brask finds Rook at the table and says it without preamble, because he does not know how to do it any other way.

The island is going. Not next week. Tomorrow, or the day after. The Core floor first — it is the heaviest thing in the camp on the softest ground in the camp, and the ground under it has dropped a finger's width since morning, which he knows because he has been measuring it against a bolt. Then the clinic, which shares the slab. Then everything downhill of them, which is most of Kestrel.

He is unhurried and unsentimental and he has never once been wrong about a structure, and Rook knows it, and everyone at the table knows it.

What he is asking for is a night of wall. Move the wounded and the civilians to the high ground behind the camp tonight — carry them, in the dark, up a slope, while Pearl is out there — and the wall is thin until morning. Or hold the plan, and spend the night making the wall stronger, and trust that a finger's width is a finger's width and not a sentence.

Rook does not decide. Rook looks at the party, because the party has been carrying the stretchers and the party will be carrying them uphill.

Brask waits. He has already picked up the chalk.`,
  },
  {
    key: "the-count", kind: "SCENE", x: 1560, y: 0,
    title: "Thirty-Five Is a Sound",
    summary: "Okafor at the Core after the fourth reclamation: the reserve said aloud, one body from the floor. Then the dose crate, and the eight nobody signed for, and the medic who does not deny it.",
    body: `Okafor stands at the Core with the count, in front of the room, because the count is for the room.

Sixty-one [[essence]] in the reserve. One more body, if it is nobody who has lived. Then the machine cannot build anything, and it holds whoever dies — Echo lit, name known, body on the ground where it fell — and she takes the horn off its hook ([[reclamation]]). She says all of this in the same voice she used for the first number, and it is worse for that.

Then she reads the other count.

Twenty-four doses issued to the clinic since the camp stopped pretending. Sixteen in the crate. Eight nobody signed for.

She does not look at Castellan when she says it. She does not need to. Everybody in the room has watched the medic dose before contact without being asked, and everybody has watched her be very, very good afterwards, and nobody has said the word *Appetite* out loud because [[the-seven-phases-of-corruption]] is a ladder people are polite about right up until the count is read.

Castellan does not deny it. She says the doses went into people who are standing on the wall tonight, which is true. Then she asks when the next issue is due, which is also true, and is the whole problem.

Rook has read her hands and says nothing about them, tonight. The commander says one word to the room, and it is *noted*, and the room understands that this is not over and that it is not happening now.

The horn stays on its hook. Everyone leaves knowing how long that will last.`,
    effects: ["The party has heard the reserve at sixty-one and the dose count read against Castellan; both are on the record in front of the camp."],
  },
  {
    key: "the-horn", kind: "SCENE", x: 1820, y: 0,
    title: "After the Horn",
    summary: "The reserve crosses thirty-five. Okafor sounds one note, and everything on the island — Pearl, the Saints, the things in the wire — hears that dying has stopped being temporary. Rook teaches the only thing to do next.",
    body: `Somebody on the south face dies, and the Core ignites, and a boy drops onto the platform and inhales, and Okafor says the number.

Thirty-four.

She takes the horn off its hook. It is an ugly thing, brass gone green, a Cartel-issue signal horn somebody decided years ago would be the sound for this, and she puts it to her mouth and blows one note that goes out over the wall and across the district and off the water.

Everything hears it. That is what it is for ([[combat]]). Pearl's fire teams hear it and stop, because they know exactly what it means and they are professionals and professionals like a fight where the other side stays dead. The Saints hear it. The things in the wire hear it, and something out in the dark makes a sound back that nobody wants to think about.

And Kestrel hears it. Three men leave the south face inside a minute, over the back wall, into the dark, and nobody shoots at them and nobody calls them anything. The ones who stay are making a different decision than the one they were making ten seconds earlier, and they know it, and Rook lets them have a moment to know it.

Then Rook walks the line.

**This is the technique.** Not *hold the wall*. After the horn you do not hold a wall; you leave it, in order, with the line intact, so the people who are still alive are still alive behind the next one. Who moves first. Who covers. Where the wounded go and who carries them. Rook says it once, section by section, in a voice with no comfort in it, and the line that pulls back to the Forge housing pulls back as a line and not as a rout. Canon's law is that a defeat is written, never reloaded, and this is the person who writes it ([[skills]]).

Castellan is already at the housing with everything she has left. Brask is under it. Okafor has a rifle now.

Marren says Pearl has stopped moving. Rook says they are waiting for the dark.`,
    effects: ["Kestrel's reserve is below thirty-five; from here every death on the island is a true death.", "Rook's Written Defeat is shown: the line falls back to the Forge housing intact, after the horn."],
  },
  {
    key: "every-fucking-meter", kind: "QUEST_STEP",
    title: "The Last Stand of Forward Camp Kestrel",
    summary: "The playable final defense. Doomed by design, glorious by construction — Pearl armour, the Saints, the risen in numbers, and a true demon on the wire. Every death is permanent now, and the island is coming apart under the guns.",
    body: `The final push comes with everything.

Pearl armour from the west, walking frames that plant themselves and become wall and then walk forward and become wall again. The Saints behind them in pressed uniforms, unhurried, because clause twelve says nothing about hurrying. [[the-risen]] out of the craters in a tide, and behind the tide, on the wire, walking through the Saints' searchlights like they are weather, a true demon — not a skeleton, not a machine, not anybody's corrupted mistake — and nobody on the wall counts its limbs, because the scene does not last long enough to ([[true-demons]], [[something-under-the-war]]).

This is a battle the party fights and cannot win, and it must never feel like a cutscene wearing gameplay's clothes. Every emplacement repaired, every survivor rescued, every crate of ammunition gathered across the branch is on the wall tonight, shooting back. And every death is a true death now. A man beside you takes a round through the throat and goes down and stays down, and nothing lights, anywhere, and the war does not slow down to let you notice.

**Castellan** does the thing that needed a table on the open ground behind the second line, with a phase-three's hands, while it is still being shot at — and then she looks at yours. **Brask** keeps the last generator alive with his own arm inside it up to the shoulder, and the lights over the housing stay on because of that, and he does not mention it. **Okafor** shoots. She is not good at it and she does not stop. **Marren** calls every movement on the wire before it happens and is believed, every time, for the first time in his life.

**Rook** walks the line. Section by section, in order, the way the horn taught them, and the wall falls back to the Forge housing as a wall and not as a mob, and the camp falls the way the party built it to fall: expensively.

And then the ground itself makes the decision everyone has been arguing about.

The deep structural groan that has been under the fight all night stops being under it. The Core floor goes along Brask's chalk line, exactly along it, and the housing goes with it, and the world tilts, and the sea comes up to meet the survivors.`,
    completion: "Hold the wall through the final assault until the island's collapse reaches Kestrel — every prepared position and rescued survivor is on the line.",
  },
  {
    key: "the-sea-takes-the-island", kind: "ENDING", endingKind: "SUCCESS", continuesInSlug: "binding-in-arcadia",
    title: "Washed Ashore",
    summary: "Defend branch conclusion: thrown into the water in the collapse, the survivors wash ashore below Arcadia's walls, by a fishing village called Wrackline. A SUCCESS in survival terms, carried in defeat's clothing.",
    body: `Water. Darkness. The muffled thunder of an island becoming seabed.

Then sand, and coughing, and grey morning light on a shoreline that is not on fire — the first such shoreline in the party's living memory. Black sand under a wall you cannot see the top of. A small fishing village up the beach, nets drying, a chapel with a lamp in it, mainland hills behind. [[port-arcadia]], reached the hard way, and the village is called [[wrackline]], and the people in it have seen this before.

The defenders arrive with nothing but what the sea allowed: their scars, their story, the debts [[tropic-pearl-trade-house]] now owes them — and a trail gone cold across water, waiting to be found again.

Rook is standing in the surf. Rook is always standing. Okafor has the horn on its cord around her neck and does not seem to know it. Brask's arm is wrong and he is looking at the wall like he is pricing it. Castellan is already working. Marren found the road before anyone else was upright.

And every one of them is bound to a machine at the bottom of the sea, which is another way of saying bound to nothing, and from here until they find a Forge that will have them, a single death is the last one ([[true-death]]).

The island held for every metre it was worth. What it bought is what comes next.`,
  },
];

const edges: EdgeSpec[] = [
  // dig-in now opens onto the ledger decision rather than straight into the sweeps.
  { from: "dig-in", to: "what-we-protect" },
  { from: "what-we-protect", to: "the-scattered-living", label: "The Forge housing. If the Core goes, nothing else was worth doing.", voiced: true,
    effects: ["set flag: kestrel-shielded-the-forge", "The clinic stays in the open and the wall's south face goes unrepaired."] },
  { from: "what-we-protect", to: "the-scattered-living", label: "The clinic. Whoever comes back needs somewhere to come back to.", voiced: true,
    effects: ["set flag: kestrel-shielded-the-clinic", "The Forge housing keeps its old roof and the wall's south face goes unrepaired."] },
  { from: "what-we-protect", to: "the-scattered-living", label: "The wall and the stores. A camp that cannot shoot has no use for a Forge.", voiced: true,
    effects: ["set flag: kestrel-shielded-the-wall", "The clinic stays in the open and the Forge housing keeps its old roof."] },
  { from: "the-scattered-living", to: "the-man-who-would-not-leave" },
  { from: "the-man-who-would-not-leave", to: "the-dead-do-not-wait", label: "Carry them both. Castellan works on him here.", voiced: true,
    effects: ["Castellan doses to do it, and the crate is one short by morning.", "Two more rifles reach the wall, and the one who stayed owes you."] },
  { from: "the-man-who-would-not-leave", to: "the-dead-do-not-wait", label: "Leave the friend. He is bound; the Core will have him back.", voiced: true,
    effects: ["He dies on the cellar floor and the Core builds him at Kestrel — forty-seven Essence off the reserve, for two rifles and a walk.", "The man who stayed with him walks back to the wall behind you and never speaks to you again."] },
  { from: "the-man-who-would-not-leave", to: "the-dead-do-not-wait", label: "Order him back to the wall. Leave them both.", voiced: true,
    effects: ["The friend dies and reclaims at the Core. The private is not on the wall that night or any night, and nobody ever finds out where he went.", "Kestrel is one rifle shorter and forty-seven Essence poorer, and the camp knows whose order it was."] },
  // the-dead-do-not-wait's two roads already exist and are kept as written.
  { from: "the-long-nights", to: "the-load-path" },
  { from: "the-load-path", to: "the-count", label: "Believe him. Move the wounded and the civilians to the high ground tonight.", voiced: true,
    effects: ["set flag: believed-brask", "The wall is thin for one night while the camp carries its own wounded uphill in the dark."] },
  { from: "the-load-path", to: "the-count", label: "Hold the plan. One more day of wall is worth more than a maybe.", voiced: true,
    effects: ["The wounded stay in the clinic beside the Forge housing.", "Brask stops arguing and chalks the load path across the Core floor, so that afterwards somebody will know he was right."] },
  { from: "the-count", to: "the-horn", label: "The Forge housing held — the horn sounds late", condition: "kestrel-shielded-the-forge",
    effects: ["The Core runs clean to the last body: one more reclamation than the arithmetic allowed, and somebody stands on the wall who would otherwise be in the sea already."] },
  { from: "the-count", to: "the-horn", label: "The clinic held — the wounded are still breathing when the horn sounds", condition: "kestrel-shielded-the-clinic",
    effects: ["The clinic's roof takes the mortar meant for it; the people who cannot walk are alive to be carried when the ground goes."] },
  { from: "the-count", to: "the-horn", label: "The wall held — the horn sounds into a camp that can still shoot", condition: "kestrel-shielded-the-wall",
    effects: ["The south face is plated and the guns are fed; Pearl pays for every metre of it, and the camp stands longer after the horn than any camp should."] },
  { from: "the-horn", to: "every-fucking-meter" },
  { from: "every-fucking-meter", to: "the-sea-takes-the-island", label: "The high ground goes last", condition: "believed-brask",
    effects: ["The wounded and the civilians were above the waterline when the Core floor went; more of Kestrel reaches the beach than the arithmetic allowed."] },
  { from: "every-fucking-meter", to: "the-sea-takes-the-island", label: "The Core floor goes first",
    effects: ["The clinic goes into the sea with the Forge housing. The people who could not walk do not reach the water alive."] },
];

/** Direct routes the new scenes now carry. */
const retired: Array<{ from: string; to: string; label: string | null; because: string }> = [
  { from: "dig-in", to: "the-scattered-living", label: null, because: "the ledger decision (what-we-protect) now sits between them" },
  { from: "the-scattered-living", to: "the-dead-do-not-wait", label: null, because: "the cellar (the-man-who-would-not-leave) now sits between them" },
  { from: "the-long-nights", to: "every-fucking-meter", label: null, because: "the load path, the count and the horn now sit between them" },
  { from: "every-fucking-meter", to: "the-sea-takes-the-island", label: null, because: "the collapse now arrives two ways, labelled by whether anybody believed Brask; the unlabelled route would sit beside them as a third" },
];

const links: Array<{ node: string; slugs: string[] }> = [
  { node: "dig-in", slugs: ["forward-camp-kestrel", "the-kestrel-commander", "the-kestrel-quartermaster", "the-kestrel-medic", "the-kestrel-mechanic", "the-kestrel-scout", "reclamation", "essence", "returnees", "blackreef-harbour"] },
  { node: "what-we-protect", slugs: ["the-kestrel-commander", "the-kestrel-quartermaster", "the-kestrel-medic", "the-kestrel-mechanic", "forward-camp-kestrel"] },
  { node: "the-scattered-living", slugs: ["the-kestrel-scout", "stormglass-cartel", "forward-camp-kestrel", "glasswater-village", "the-risen", "the-harvest-economy", "the-island-remembers", "the-strike"] },
  { node: "the-man-who-would-not-leave", slugs: ["the-kestrel-medic", "reclamation", "essence", "the-corruption-system"] },
  { node: "the-long-nights", slugs: ["tropic-pearl-trade-house", "iron-saints-pmc", "the-risen", "reclamation", "the-kestrel-mechanic", "the-kestrel-quartermaster", "the-kestrel-medic", "forward-camp-kestrel"] },
  { node: "the-load-path", slugs: ["the-kestrel-mechanic", "the-kestrel-commander", "forward-camp-kestrel"] },
  { node: "the-count", slugs: ["the-kestrel-quartermaster", "the-kestrel-medic", "the-kestrel-commander", "reclamation", "the-seven-phases-of-corruption", "essence"] },
  { node: "the-horn", slugs: ["the-kestrel-quartermaster", "the-kestrel-commander", "the-kestrel-scout", "combat", "skills", "tropic-pearl-trade-house", "iron-saints-pmc"] },
  { node: "every-fucking-meter", slugs: ["forward-camp-kestrel", "the-fall-of-the-starting-island", "the-risen", "true-demons", "something-under-the-war", "tropic-pearl-trade-house", "iron-saints-pmc", "true-death", "the-kestrel-commander", "the-kestrel-medic", "the-kestrel-mechanic", "the-kestrel-quartermaster", "the-kestrel-scout"] },
  { node: "the-sea-takes-the-island", slugs: ["port-arcadia", "wrackline", "the-fall-of-the-starting-island", "true-death", "tropic-pearl-trade-house", "the-kestrel-commander"] },
];

const flags: Array<{ slug: string; title: string; summary: string; body: string }> = [
  { slug: "kestrel-shielded-the-forge", title: "Kestrel Shielded the Forge", summary: "The Defend camp spent its one repair on the Forge housing. The Core ran clean to the last body and the horn sounded late.",
    body: "Set at *What We Keep* in [[the-last-days-of-kestrel]] and read at *Thirty-Five Is a Sound*, where it decides how the horn arrives. One of three; the camp could only keep one thing." },
  { slug: "kestrel-shielded-the-clinic", title: "Kestrel Shielded the Clinic", summary: "The Defend camp spent its one repair on the clinic. The wounded were alive to be carried when the ground went.",
    body: "Set at *What We Keep* in [[the-last-days-of-kestrel]] and read at *Thirty-Five Is a Sound*, where it decides how the horn arrives. One of three; the camp could only keep one thing." },
  { slug: "kestrel-shielded-the-wall", title: "Kestrel Shielded the Wall", summary: "The Defend camp spent its one repair on the wall and the stores. Pearl paid for every metre, and the camp stood longer after the horn than any camp should.",
    body: "Set at *What We Keep* in [[the-last-days-of-kestrel]] and read at *Thirty-Five Is a Sound*, where it decides how the horn arrives. One of three; the camp could only keep one thing." },
  { slug: "believed-brask", title: "Believed Brask", summary: "The party took the mechanic at his word a day early and carried Kestrel's wounded to the high ground the night before the island broke along his chalk line.",
    body: "Set at *A Day Early* in [[the-last-days-of-kestrel]] and read at the last stand, where it decides who is above the waterline when the Core floor goes. [[the-kestrel-mechanic]] was right; the flag records whether anybody listened fast enough." },
];

// --------------------------------------------------------------- the dialogue

const ROOK = c("the-kestrel-commander");
const OKAFOR = c("the-kestrel-quartermaster");
const CASTELLAN = c("the-kestrel-medic");
const BRASK = c("the-kestrel-mechanic");
const MARREN = c("the-kestrel-scout");

const lineSets: LineSet[] = [
  { arc: ARC, node: "dig-in", lines: [
    { number: 1, speaker: ROOK, text: "We're not leaving. Say it back to me so I know it landed.", intensity: 7, emotion: ["command"], performance: "flat, to the whole table; not a rallying speech" },
    { number: 2, speaker: ROOK, text: "Good. Brask, the Core floor. Castellan, the mess is a clinic now. Marren — the wire, and this time write it down before you say it.", intensity: 6, emotion: ["command"] },
    { number: 3, speaker: OKAFOR, text: "Two hundred and twelve in the reserve. Forty-seven a body, more for anybody who has been alive a while. Four reclamations. Five if nobody important dies.", intensity: 4, emotion: ["calm"], performance: "a reading, not a warning; she does not lower her voice for numbers" },
    { number: 4, speaker: OKAFOR, text: "Below thirty-five I sound the horn. After the horn, whoever dies stays dead. I am saying it now so that nobody says afterwards they were not told.", intensity: 4, emotion: ["calm"] },
    { number: 5, speaker: BRASK, text: "Floor's fine. It's what's under the floor I don't like.", intensity: 3, emotion: ["dry"] },
    { number: 6, speaker: ROOK, text: "Then like it faster.", intensity: 5, emotion: ["dry", "command"] },
  ] },
  { arc: ARC, node: "what-we-protect", lines: [
    { number: 1, speaker: BRASK, text: "Housing. Core and generators share a floor. One mortar through that roof and we're having a very short conversation.", intensity: 4, emotion: ["calm"], performance: "a man describing a load, not making a case" },
    { number: 2, speaker: CASTELLAN, text: "The clinic. Whoever comes back needs somewhere to come back to. Whoever doesn't needs somewhere to do it that isn't in front of the wall. When's the next issue?", intensity: 6, emotion: ["urgent"], performance: "the last question tacked on as if it were the same sentence — everyone hears it" },
    { number: 3, speaker: OKAFOR, text: "The wall and the stores. A camp that cannot shoot has no use for a Forge. I have the count of what it has left to shoot with, and it is not a comfortable number.", intensity: 4, emotion: ["calm"] },
    { number: 4, speaker: ROOK, text: "Three right answers and one set of hands. Pick.", intensity: 6, emotion: ["command"], performance: "to the party, not to the staff" },
  ] },
  { arc: ARC, node: "the-scattered-living", lines: [
    { number: 1, speaker: MARREN, text: "Not that street. Pearl walks it on the hour and they're early today. This way — and don't look in the cellar on the corner. I mean it. Don't.", intensity: 6, emotion: ["urgent"], performance: "young, quick, talking too much on the way out" },
    { number: 2, speaker: r("radio"), text: "Kestrel, Checkpoint Two. We've got six still breathing and a dead man on the stairs who wasn't dead an hour ago. Say again — Kestrel is staying? Kestrel is staying?", intensity: 7, emotion: ["afraid"], performance: "radio, broken up, repeating the question" },
    { number: 3, speaker: MARREN, text: "Glasswater's clinic has a ward in the back. Nobody ordered it. Nobody's shutting it either — half the wall's running on what comes out of there.", intensity: 4, emotion: ["sad"], performance: "quieter, on the way back" },
    { number: 4, speaker: ROOK, text: "Every one you bring in is a rifle and a mouth. Bring them anyway.", intensity: 5, emotion: ["command"] },
  ] },
  { arc: ARC, node: "the-man-who-would-not-leave", lines: [
    { number: 1, speaker: r("stormglass-private"), text: "I'm not leaving him.", intensity: 6, emotion: ["protective"], performance: "not shouted; the fourth or fifth time he has said it today" },
    { number: 2, speaker: CASTELLAN, text: "I can do it here. It'll take a dose. I'll need it now, not after you've talked about it.", intensity: 6, emotion: ["urgent"], performance: "looking at the wound, not at anybody's face" },
    { number: 3, speaker: r("stormglass-private"), text: "He bound this morning. Same as you. You leave him, he dies down here and comes back up there and I'm still sitting on these stairs. So go on. Spend him.", intensity: 7, emotion: ["angry"], performance: "the word 'spend' lands like an accusation" },
  ] },
  { arc: ARC, node: "the-dead-do-not-wait", lines: [
    // Line 1 is Rook's, written earlier: "He'd go. That's not the same as it being smart."
    { number: 2, speaker: MARREN, text: "It's one man's weight. I walked enough of it to know that. One man, and more than one thing carrying him, and I don't have a word for the second part.", intensity: 5, emotion: ["afraid", "calm"], performance: "reporting; he has stopped talking too much" },
  ] },
  { arc: ARC, node: "what-the-road-held", lines: [
    { number: 1, speaker: MARREN, text: "It stops. It just stops. Nothing landed, nothing dug, nothing went in the water. The ground past it is clean for as far as I was willing to walk, and I walked further than I should have.", intensity: 5, emotion: ["afraid"], performance: "flat, at the end of two days" },
    { number: 2, speaker: MARREN, text: "I don't know what that means. I'm not going to stand here and tell you it means anything.", intensity: 4, emotion: ["sad"] },
  ] },
  { arc: ARC, node: "held-the-wire", lines: [
    { number: 1, speaker: ROOK, text: "No.", intensity: 5, emotion: ["command"], performance: "before the sentence can finish; the last night" },
    { number: 2, speaker: ROOK, text: "Get some sleep. That's not a suggestion.", intensity: 4, emotion: ["calm", "command"] },
  ] },
  { arc: ARC, node: "the-long-nights", lines: [
    { number: 1, speaker: BRASK, text: "Wire's live. Watch their arms.", intensity: 5, emotion: ["dry"], performance: "the Saints on the north wire; said as the chrome vents" },
    { number: 2, speaker: OKAFOR, text: "One hundred and eighteen.", intensity: 4, emotion: ["calm"], performance: "after the second reclamation, to the room, as the lights come back up" },
    { number: 3, speaker: CASTELLAN, text: "When's the next issue?", intensity: 5, emotion: ["neutral"], performance: "asked like a question about the weather; everybody hears it anyway" },
    { number: 4, speaker: BRASK, text: "Load path. It's going to break along it. Not next week.", intensity: 4, emotion: ["calm"], performance: "on his back under the housing, chalk in hand, to Rook's boots" },
    { number: 5, speaker: ROOK, text: "Shoot the ones that are down. Make sure. I don't want to meet anybody twice.", intensity: 7, emotion: ["command"], performance: "the risen on the wire" },
  ] },
  { arc: ARC, node: "the-load-path", lines: [
    { number: 1, speaker: BRASK, text: "The island's going. Tomorrow, maybe the day after. Core floor first — heaviest thing we've got on the softest ground we've got. Then the clinic. Then everything downhill, which is us.", intensity: 5, emotion: ["calm"], performance: "no preamble; he does not know another way to say it" },
    { number: 2, speaker: ROOK, text: "You're asking me for a night of wall on a finger's width.", intensity: 5, emotion: ["dry"] },
    { number: 3, speaker: BRASK, text: "I'm telling you what the ground's doing. What you buy with it is yours.", intensity: 4, emotion: ["calm"] },
    { number: 4, speaker: BRASK, text: "I've never been wrong about a structure. I'd like to be. Tonight would be a good night for it.", intensity: 4, emotion: ["dry", "sad"] },
  ] },
  { arc: ARC, node: "the-count", lines: [
    { number: 1, speaker: OKAFOR, text: "Sixty-one. One more body, if it is nobody who has lived. After that the machine holds whoever dies, and I take the horn down.", intensity: 4, emotion: ["calm"], performance: "the same voice as the first count; that is what makes it worse" },
    { number: 2, speaker: OKAFOR, text: "Twenty-four doses issued to the clinic. Sixteen in the crate. Eight that nobody signed for.", intensity: 4, emotion: ["calm"], performance: "she does not look at Castellan" },
    { number: 3, speaker: CASTELLAN, text: "They went into people who are standing on the wall tonight. Every one. When's the next issue due?", intensity: 6, emotion: ["angry", "afraid"], performance: "the first sentence is true; the second is the whole problem" },
    { number: 4, speaker: ROOK, text: "Noted.", intensity: 5, emotion: ["command"], performance: "one word; the room understands it is not over and it is not happening now" },
    { number: 5, speaker: OKAFOR, text: "We have been told it is safe before.", intensity: 3, emotion: ["calm"], performance: "the Returnee saying; to nobody, putting the horn back on its hook" },
  ] },
  { arc: ARC, node: "the-horn", lines: [
    { number: 1, speaker: OKAFOR, text: "Thirty-four. I'm sounding it.", intensity: 5, emotion: ["calm"], performance: "then one note, held, that the whole island hears" },
    { number: 2, speaker: MARREN, text: "They heard it. Pearl's stopped. They're just — standing there.", intensity: 6, emotion: ["afraid"] },
    { number: 3, speaker: ROOK, text: "They're waiting for the dark. Let them. Listen to me, all of you: after the horn you do not hold a wall. You leave it. In order.", intensity: 7, emotion: ["command"], performance: "walking the line, section by section" },
    { number: 4, speaker: ROOK, text: "South face moves first, north covers, wounded go to the housing and the people carrying them do not stop to shoot. Nobody runs. A line that runs is meat. A line that walks is still a line.", intensity: 7, emotion: ["command"], performance: "the technique — Written Defeat — taught the only way it can be" },
    { number: 5, speaker: ROOK, text: "Three went over the back wall. Nobody says a word about them. Ever. Now move.", intensity: 6, emotion: ["command", "calm"] },
  ] },
  { arc: ARC, node: "every-fucking-meter", lines: [
    { number: 1, speaker: ROOK, text: "Every fucking metre.", intensity: 9, emotion: ["command", "angry"], performance: "the wall, the first frames walking" },
    { number: 2, speaker: CASTELLAN, text: "Hold him. Hold him down, I don't care if he screams, I need his chest open more than he needs to like me.", intensity: 9, emotion: ["urgent", "command"], performance: "field surgery on open ground behind the second line" },
    { number: 3, speaker: BRASK, text: "Lights are staying on. Don't ask me how.", intensity: 5, emotion: ["dry"], performance: "arm inside the generator to the shoulder" },
    { number: 4, speaker: MARREN, text: "Wire. Left of the searchlight. It's not — that's not one of theirs. That's not anybody's.", intensity: 9, emotion: ["afraid"], performance: "the demon; the scene ends before anyone counts limbs" },
    { number: 5, speaker: ROOK, text: "Back to the housing. In order. Nobody runs.", intensity: 8, emotion: ["command"] },
    { number: 6, speaker: BRASK, text: "Told you.", intensity: 4, emotion: ["dry", "sad"], performance: "as the Core floor goes along the chalk line" },
  ] },
  { arc: ARC, node: "the-sea-takes-the-island", lines: [
    { number: 1, speaker: ROOK, text: "Count.", intensity: 4, emotion: ["command", "sad"], performance: "standing in the surf" },
    { number: 2, speaker: OKAFOR, text: "Later. I will count later. Let me have one morning where I do not know the number.", intensity: 3, emotion: ["sad", "calm"], performance: "the horn still around her neck" },
  ] },
];

// ------------------------------------------------------------------ the cast

const kestrelInvolvement = (how: string) => [
  { ref: ARC, kind: "ARC" as const, how },
  { ref: "the-evacuation", kind: "ARC" as const, how: "On the boats, or the dock, in the Flee branch — the same four people, spending the same island differently." },
  { ref: "binding-in-arcadia", kind: "ARC" as const, how: "Reaches Port Arcadia with the party and binds in the same scene at the Lamp Chapel." },
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

  // 1. The reserved crew get their first scenes, so the reservation is over.
  await cast.canonise({ slug: "the-kestrel-quartermaster", fullName: "Ines Okafor", involvement: kestrelInvolvement("Says the count aloud, reads the dose crate against the medic, and sounds the horn.") });
  await cast.canonise({ slug: "the-kestrel-medic", fullName: "Priya Castellan", involvement: kestrelInvolvement("Turns the mess into a clinic, doses before contact without asking, and does Field Surgery on open ground after the horn.") });
  await cast.canonise({ slug: "the-kestrel-mechanic", fullName: "Teodor Brask", involvement: kestrelInvolvement("Keeps the Core floor and the generators alive, and chalks the load path a day before the island breaks along it.") });
  await cast.canonise({ slug: "the-kestrel-scout", fullName: "Dov Marren", involvement: kestrelInvolvement("Leads the rescue sweeps, reads the trail east, and is believed on the wall for the first time in his life.") });
  await cast.canonise({
    slug: "the-kestrel-commander",
    answered: ["Fate in each branch, and whether they reach Port Arcadia."],
    relationships: [{ replaceWho: "the Kestrel command staff (medic, mechanic, quartermaster, scout — all unwritten, see [[the-unnamed]])", who: "the Kestrel command staff — [[the-kestrel-medic]], [[the-kestrel-mechanic]], [[the-kestrel-quartermaster]] and [[the-kestrel-scout]]" }],
    append: `## Both roads, answered (owner ruling, 2026-09-05)

Rook reaches [[port-arcadia]] on both roads, because canon fixes them as still standing when everyone stops and as the only person who teaches *Written Defeat*. In [[the-last-days-of-kestrel]] they walk the line after the horn and go into the sea with the Core floor, and are standing in the surf below [[wrackline]] when the party comes up for air. In [[the-evacuation]] the party decides whether the last boat waits for them under fire or leaves on their order — and a Rook left on the dock is pulled out of the strait days later by the [[peninsula-coast-guard-authority]], which owes rescue to any hull and has never once been thanked for it. Never whether. Only how, and how late.`,
  });

  // 2. The board.
  for (const node of nodes) await writer.node(ARC, node);
  for (const edge of edges) await writer.edge(ARC, edge);
  for (const cut of retired) await writer.retireEdge(ARC, cut.from, cut.to, cut.label, cut.because);
  for (const flag of flags) await writer.flag(flag.slug, flag.title, flag.summary, flag.body);
  for (const entry of links) await writer.links(ARC, entry.node, entry.slugs);
  await writer.arcFields(ARC, {
    summary: "The Defend branch, in full. Rook commits Kestrel to the wall and the four who run the camp — Okafor with the count, Castellan with the doses, Brask under the Core floor, Marren at the wire — spend the island one decision at a time: what to shield, who to carry, whether to walk the trail east, whether to believe a mechanic a day early. The reserve drops, the horn sounds, Rook writes the defeat, and the ground goes along a chalk line. The survivors wash up below Arcadia's wall.",
  });

  // 3. The lines.
  for (const set of lineSets) await lines.write(set);

  writer.report(apply ? "The Last Days of Kestrel — APPLYING" : "The Last Days of Kestrel — dry run");
  lines.report("Lines");
  cast.report("Cast");
  console.log(`\ndatabase: ${identity}  mode: ${apply ? "APPLY" : "PREVIEW"}`);
}

main().catch((error) => { console.error(error); process.exit(1); }).finally(() => db.$disconnect());
