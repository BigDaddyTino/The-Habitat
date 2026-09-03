import "../lib/environment";
import { randomUUID } from "node:crypto";
import { getPrismaClient } from "@habitat/db/client";
import { dialogueTextProblem } from "@habitat/shared";
import { BoardWriter, type EdgeSpec, type NodeSpec } from "./lib/story-authoring";

/**
 * THE LAMPLIGHT ROAD — the Peninsula leg of the main campaign.
 *
 * Plan: Docs/codex/RADIANT_PATH_INTEGRATION.md sections 19 to 34.
 *
 * Two movements with the duelling floor as the hinge. Movement I is the city:
 * the Path in the Southside, the chamber, the veto, and the first time in
 * fifteen years anybody has called the floor. Movement II is the road: the
 * gate, the camp, the graves, the deep green, and a procession walking at
 * Heartland's gate.
 *
 * THE ARCHITECTURE THAT MUST NOT BE BROKEN, per the owner:
 *
 *   Amanda's nine-mission chain is not touched. This arc hits ONE node where
 *   the player meets her — `the-woman-in-the-green` — and from there her chain
 *   webs off and runs its own clock forever after. The mainline does not wait
 *   for her, does not gate on her, and continues through the green without her
 *   if she is left behind. There is exactly one hand-off and this is it.
 *
 *   Her species is not revealed until her own mission 8, late-game. Nothing in
 *   this arc hints at it. `the-ash-ground` is the closest it comes and it says
 *   nothing at all, which is the entire beat.
 *
 *   Glimpse discipline: the Ash Ground is never explained, the Lamplighter is
 *   never connected to Ilse Vetch's testimony in any document, and where the
 *   dead are between the falling and the platform stays unanswered.
 *
 *   pnpm --filter @habitat/web exec tsx scripts/author-lamplight-road.ts
 *   pnpm --filter @habitat/web exec tsx scripts/author-lamplight-road.ts --apply
 */

const db = getPrismaClient();
const apply = process.argv.includes("--apply");
const ARC = "the-lamplight-road";

// ------------------------------------------------------------------ the board

const nodes: NodeSpec[] = [
  // ---------------------------------------------------- Movement I — the city
  {
    key: "the-trail-points-inland", kind: "QUEST_START", x: 0, y: 0,
    title: "Nobody Is Looking For Him",
    summary: "The party is bound now, the search is theirs alone, and the trail runs inland — through the one land door Arcadia has, which excludes in both directions.",
    body: `They are bound. Whatever the Forge in this city is, it holds them now, and one death has stopped being the end of everything.

What has not changed is the count. [[the-captivity-arc]] opened with the only fact that matters: **nobody is looking for [[tino]].** No agency has a file, no service has a case, and whatever the party carries out of [[port-arcadia]] is the entire search.

The trail runs inland. The city has one land door — [[exclusion-area]] — and its own dossier is honest about what it is for: *the area excludes in both directions.* It keeps the jungle out, which is what a visitor assumes, and it keeps Arcadians in, and the register of who went out and whether they came back is one of the more closely held documents in the city.

You do not simply walk out of this place.

**And the party spends this whole stretch as exactly the kind of person [[the-radiant-path]] exists to find**: foreign, unbound until recently, owed nothing by anybody, and standing in the poorest district in the city asking questions.`,
    effects: ["The search for Tino becomes a journey rather than an enquiry.", "The party is on the Exclusion Area's standing register from this point forward."],
  },
  {
    key: "the-accreditation-queue", kind: "SCENE", x: 260, y: -120,
    title: "The Queue Is The Point",
    summary: "The Path files for accreditation on Embassy Row, is refused on the same clause it is always refused on, and files again the same afternoon.",
    body: `[[the-accreditation-hall]] on [[embassy-row]], where every faction in the world asks [[the-nation-state-of-arcadia]] for permission to exist inside it.

The terms are published and short. Align ideologically with the Nation-State. Place the city's primacy above any other loyalty. Accept that [[arcadian-special-intelligence-service]] is watching from the building opposite. Most applicants find this reasonable. Most applicants are companies.

[[the-radiant-path]] files every quarter and is refused every quarter, on the same clause, by clerks who are unfailingly courteous about it. Today it files again before the ink is dry.

**Watch what that does.** A movement turned away in public every three months is a movement with a public grievance every three months. Nobody in the hall raises their voice. Nobody has to. The refusal is correct, the clause is real, the courtesy is genuine, and the whole thing is a machine for manufacturing exactly the thing it is refusing to accommodate.

The Path did not invent that mechanism. It simply understood it first.`,
    effects: ["The player sees Arcadia's foreign policy work exactly as designed, and produce a grievance."],
  },
  {
    key: "the-drawn-shutter", kind: "SCENE", x: 260, y: 40,
    title: "A Remembering",
    summary: "A dead-zone room in the Southside, a crowd, a meal nobody is charged for, and Ilse Vetch — who is good, and unfakeably so.",
    body: `[[the-drawn-shutter]]: a back room under a military dampening footprint, where no lattice reaches, no phase-reader works, and [[suspicion]] does not accrue because there is nothing running in the building that can read anybody.

Which is how a movement of the poor came to know the location of every dead zone in [[port-arcadia]].

It is warm. It is crowded. There is food and nobody is charged for it. The door is not locked, because a locked door is the only thing in this district that would be worth reporting.

At dark there is a **Remembering**: a convert walked back through their own reclamation, out loud, in detail, by somebody who has been through more of them. It is not a metaphor and the Path counts. It goes on for a long time and it is the strangest thing the party has watched anybody do voluntarily, and every person in the room loves the man it is happening to.

Then [[ilse-vetch]] speaks, and she is **good**. Not a rhetorician — the opposite. She stops mid-sentence to ask whether somebody at the back has eaten.

**This beat's whole job is that the offer is genuinely, unfakeably good before anybody sees its price.** Everything the act does afterwards costs more because of tonight.`,
    effects: ["The party is offered a free binding, no service owed, no questions about what they are.", "The player likes the Radiant Path. That is the point, and it is not a trick."],
  },
  {
    key: "the-platform", kind: "SCENE", x: 520, y: -60,
    title: "He Comes Back Whole",
    summary: "A rigger goes off a crane with three years' wages in his spine, and comes back without it. Two churches make their case over his head before he has stood up.",
    body: `[[the-lamp-chapel]], the poorest Forge hall in the city, an hour after a fall on the [[waterfront-district]] cranes.

The Core ignites, the lights across the district dim, and a silhouette of raw energy resolves into skeleton, then muscle, then vessels, then skin, and drops onto the platform. He inhales violently. He is naked and shaking and entirely unhurt.

He is also poor, because the spinal rig he spent three years' wages on is not there. [[what-the-forge-rebuilds]]: the Echo knows the body and does not know what was done to it afterwards, and **the Forge has never once recorded chrome.** He cannot do the only work he had.

[[imogen-roe]] puts a blanket on him and asks him nothing, because that is the office.

Two other people are already in the room. The [[cybernetic-ascendancy]] preaches the body as the only vessel and calls a death the machine cannot undo the first honest death on the peninsula. [[the-radiant-path]] holds that the augmented were never in the Light at all — they come back incomplete, or they never went.

He has to pick a church in the first hour of the rest of his life, and he is sitting on a platform with a blanket round him while they argue over his head.

**Nobody in this scene is lying.** That is what makes it the worst thing in the district.`,
    effects: ["The player learns what the Forge does and does not rebuild, from a man rather than from a rule.", "Both of the Forgefaith's heresies are explained at once, by their own advocates, in four minutes."],
  },
  {
    key: "the-two-witnesses", kind: "SCENE", x: 520, y: 100,
    title: "Six Hours In One Room",
    summary: "Sexton Imogen Roe and Ilse Vetch were in the same room on the same night and remember two different things. Neither is lying and neither can ever prove it.",
    body: `Two women who were in the same room on the same night, six hours apart in what they remember, and neither of them has ever called the other a liar.

[[imogen-roe]] has held four hundred people through their first hour back. In thirty years she has never told one of them what is on the other side, **because she does not know, and the not-knowing is not a gap in her ministry — it is her ministry.**

[[ilse-vetch]] came back in this room, and Roe was the Sexton on duty the night the crane sling parted.

It can be played from either direction: bring Roe out to [[lamplight]], or walk Vetch back to the chapel that held her. Roe never raises her voice and never once calls the Path a heresy in front of its people, and she is the hardest thing in the act to argue with.

Nothing is settled here. Something breaks anyway.`,
    effects: ["The Path's founding testimony is put beside the only other account of the same six hours, and survives it.", "The player has now heard the Congregation's real position, which is that it does not know."],
  },
  {
    key: "an-informer", kind: "CHOICE", x: 780, y: 40,
    title: "Inconclusive",
    summary: "Inspector Merrow has read the same roll the player has, and also the Southside's reserve reports. She wants an informer inside Lamplight and would prefer it to be the party.",
    body: `[[the-quiet-office]]: an upper floor of [[arcadian-special-intelligence-service]], nothing on the walls, a blind down, and whichever documents [[the-asis-officer]] has decided you should be looking at when you arrive.

She is not a bigot, and that is worse for the player's conscience, because she is **right**. She does not care what anybody believes. She has read the Path's roll and she has read [[the-southside]]'s reserve reports, and she can tell you what a district that is dying more often on purpose costs itself over one winter, and she can tell you that none of the people it kills will be Path.

She wants an informer inside [[lamplight]]. She would prefer it to be the party. She will be reasonable for exactly as long as reasonable works, and she says so at the start, which is not a threat and lands as one anyway.

Her file on you says *inconclusive*, which is her favourite word, because it means she has not finished.`,
  },
  {
    key: "the-first-wagon", kind: "QUEST_STEP", x: 1040, y: 40,
    title: "Eleven Freed, Two Dead",
    summary: "Ivo Crane burns an Aegis catcher wagon inside the Exclusion Area's reach. Everything after this is a different kind of argument.",
    body: `An [[aegis-extraction-consortium]] catcher wagon on the near green, on its side, burned to the frame. See [[the-burned-wagon]], which stays on the map afterwards and is never cleared.

Eleven cages were opened and most of those people are alive. Two drivers did not walk away, and they had names, debts, and a dispatcher who has to write the letters.

[[ivo-crane]] calls it liberation. He is not lying. Aegis calls it eleven counts and a loss on freight, and it is not lying either.

**This is where the Peninsula stops being a question about faith and becomes a question about force.** Arcadia hardens. [[the-asis-officer]] stops being reasonable on the same afternoon. And the Path's moderates start losing the argument to Crane at exactly the point the player most needs them to win it.

He has died eleven times, which by the Path's own ladder makes him the highest rung it has. What that cost him is in [[the-platform-ledger]] and nobody in the movement has read it.`,
    completion: "The party is present at, or arrives immediately after, the burning of the first catcher wagon, and has seen both the freed and the dead.",
    effects: ["set flag: crane-burned-a-wagon", "Arcadia's fear of the Radiant Path becomes reasonable rather than bigoted.", "Aegis prices the loss. The chamber prices the precedent."],
  },
  {
    key: "the-clearance", kind: "SCENE", x: 1300, y: -60,
    title: "The Clearance",
    summary: "The Upper Westside moves to walk the entire Southside out through the Exclusion Area and not readmit them. It is legally a deportation and everybody in the chamber can do the arithmetic.",
    body: `The measure is read into the chamber at [[chancellory-of-arcadia]] eight days after the wagon.

Every unbound, unregistered and Path-affiliated resident of [[the-southside]] walked out through [[exclusion-area]] and not readmitted. Legally a deportation. Practically a mass grave with a queue, because [[the-green]] kills and **a Forge reserve does not follow you out of the walls.**

[[ottoline-vasque]] moves it. She is thirty-four, [[upper-westside]], and has never held a weapon in anger. She has read the reserve reports. She has done the sums in public and reached the conclusion that removing the cause saves more lives than it costs, and she is prepared to say so with her name on it.

She is wrong about who spends the reserve. **She is not wrong about the reserve.**

Nobody in the chamber shouts. That is the frightening part.`,
    effects: ["The Clearance is on the order paper, and every unbound person the party has met is on the schedule."],
  },
  {
    key: "the-veto", kind: "SCENE", x: 1300, y: 80,
    title: "Inside The Hour",
    summary: "The Chancellor vetoes the Clearance before the chamber has finished filing out, and does not explain himself to anybody.",
    body: `[[abraham-islay-kane]] vetoes it inside the hour.

He does not make a speech. He does not consult. He signs the instrument in the small room off the chamber and has it read back before the representatives have finished filing out, and the only thing he says about it in public is that the city will not do this.

**Nobody in Arcadia has ever tried to break one of his vetoes.** Fifteen years, and the sole formal check on him has stayed a swept floor that people who have never seen it used can describe precisely.

What the chamber understands by the end of the afternoon is that this time somebody is going to try.`,
    effects: ["set flag: kane-vetoed-the-clearance", "The Chancellor has put himself between the Upper Westside and the Southside, in public, on the record."],
  },
  {
    key: "an-audience", kind: "CHOICE", x: 1560, y: 20,
    title: "One Question",
    summary: "The Chancellor receives the party once, asks a single question that is not the one they prepared for, and does not tell them whether they answered it.",
    body: `The Chancellory's daily business is unremarkable and extremely competent: budgets, barrier maintenance schedules, and the standing register of who is outside the walls. You are on that register. That is the only reason you are in this room.

It is not his office. It is a small room off the debating chamber with two chairs and no window, and [[abraham-islay-kane]] is already in one of them, reading, and he finishes the paragraph before he looks up.

The left side of his face does not move the way the right does. In a city where a man can be built new from the skeleton out, he has kept every mark anything has ever put on him ([[what-the-forge-rebuilds]]), and he has never once explained why, and no Arcadian has ever needed him to.

Then he asks his question, in the tone of a man asking about the weather, and it is not the one you prepared for.`,
  },
  {
    key: "what-he-keeps", kind: "SCENE", x: 1820, y: 20,
    title: "Both Of Those Are Me",
    summary: "He does not say which answer he wanted or whether you gave it. On the way to the door he says the only thing in the room that was not procedure.",
    body: `He does not tell you which answer he wanted. He does not tell you whether you gave it. He stands, and the audience is over, and on the way to the door he says the only thing in the room that was not procedure.

**This is where [[port-arcadia]]'s standing open question gets answered** — what the Chancellor actually thinks of the harvest, given Arcadia was the first nation to publicly condemn using people as [[essence]]. He answers it. It resolves nothing. It simply puts a man inside the contradiction instead of leaving it hanging over a city.`,
    effects: ["Port Arcadia's open question about Kane and the harvest is answered in his own voice, and settles nothing.", "The party is told, eight days early, exactly what the chamber is going to do."],
  },
  {
    key: "unanimity", kind: "SCENE", x: 2080, y: -60,
    title: "Fifteen Years, One Session",
    summary: "The chamber reaches absolute unanimity for the first time in fifteen years, and finds out how easy it was.",
    body: `It takes one session.

Absolute unanimity is the whole of the Arcadian check: every representative, without exception, and then one of their own number on the floor with their life on it. It is designed to be almost impossible, and it has been almost impossible for fifteen years, and this afternoon it takes a single sitting and a count that nobody has to run twice.

**What the chamber has just learned about itself is more dangerous than the measure.** Kane knows it before the count is finished. He says so afterwards, once, sitting down, and it is the only time in the act his voice comes up.

[[ottoline-vasque]] stands.`,
    effects: ["set flag: the-chamber-reached-unanimity", "The Arcadian constitution's rarest instrument is armed for the first time in fifteen years."],
  },
  {
    key: "the-floor", kind: "CHOICE", x: 2340, y: -60,
    title: "Who Answers For The Chancellor?",
    summary: "The floor is called. The law names the representative's risk and has never named who answers for the Chancellor, because it has never been called.",
    body: `The floor is part of the building. Maintained, swept, unused, and treated by the architecture with more ceremony than the debating chamber beside it — Arcadians who have never seen it used can describe it precisely, and today most of them are going to see it.

[[ottoline-vasque]] is standing on it. She has never held a weapon in anger, she has practised, and she is terrified, and she is going to do it anyway, because in Arcadia a class that governs is a class that is willing to die for what it votes.

**The law names her risk. It has never once named who answers for the Chancellor**, because it has never once been called.

That gap is asymmetric on purpose, and nobody noticed until now: the chamber must bleed in person; the Chancellor may be answered for. A player who thinks the Clearance is right cannot fight for it — the law forbids a foreigner standing for the chamber. They can only decline to help, or hand the chamber something, and both roads end on the same floor with the same man on it.

**And the fourth way is to be somewhere else.** The gate is open. A player can walk out through the Exclusion Area and hear all of this from a stranger at a camp fire, three days late, in one line.`,
  },
  {
    key: "the-red-devil", kind: "SCENE", x: 2600, y: -140,
    title: "He Does Not Take His Coat Off",
    summary: "Sixty-one, one eye, and no coat taken off. The horror of it is the duration, and he does not kill her, deliberately, in front of everyone.",
    body: `He does not take his coat off. That is the part people describe afterwards.

It is not a fight, because a fight has two people trying. [[ottoline-vasque]] is thirty-four and brave and has practised, and the Red Devil of Arcadia is sixty-one and slow and does not practise, and he takes her apart with the patience of a man doing a job he has done before and hoped never to do again.

It goes on. **That is the horror of it — not the blood, the duration.** The chamber is silent by the middle of it, and by the end a number of extremely well-bred people are studying the ceiling.

He does not kill her. Under the law he does not have to, and everyone in the room understands, from the moment he steps back, that the choice was his and that he made it in front of them deliberately.

Afterwards he is helped toward a chair, and he does not sit in it.

**The veto holds.** [[the-radiant-path]] is not cleared — and [[ilse-vetch]], who has just watched a chamber find unanimity in a single session, understands it will be faster next time. She decides to take the question to [[brother-aster]] at [[heartland]] before the city takes the decision out of her hands.

**The procession exists because of this room.**`,
    effects: ["set flag: the-veto-held", "The Clearance falls. The Southside is not walked out.", "Ilse Vetch decides to go to Heartland on her own terms rather than wait for the chamber's second attempt."],
  },
  {
    key: "the-foreigner-answers", kind: "SCENE", x: 2600, y: 40,
    title: "I Did Not Ask You To",
    summary: "A foreign mercenary fights for the Chancellor's veto in front of the enfranchised of Arcadia. His thanks afterwards are cold, and he wants the party to work out why.",
    body: `The chamber has never had to decide whether a foreigner may answer for the Chancellor, and it decides in about four seconds, because the alternative is watching a sixty-one-year-old man do it.

So the party fights a thirty-four-year-old legislator on a marble floor in front of her colleagues.

**Arcadia's regard for them changes**, and it does not change in a way that is simply good or simply bad. The city has now seen a foreign contractor used on the Chancellor's behalf, in the one room where the Arcadian bargain is performed rather than described. Some of the gallery will never forgive it. Some of them will hire them.

[[abraham-islay-kane]] thanks them afterwards, and it is the coldest sentence he says in the act.

**The veto holds either way.** What changes is who the city thinks the party is.`,
    effects: ["set flag: the-veto-held", "set flag: floor-answered-by-party", "The party's standing in Arcadia moves sharply in both directions at once.", "Kane does not thank them warmly, and wants them to understand why he did not ask."],
  },
  // ---------------------------------------------------- Movement II — the road
  {
    key: "the-gate-that-excludes-both-ways", kind: "CHOICE", x: 2860, y: -40,
    title: "Who Owns Your Passage",
    summary: "Three ways out through the Lower Gate, and they are the whole game rendered as a checkpoint.",
    body: `[[the-lower-gate]]: the last hundred metres of made road before the trees, seen from the queue rather than from the city.

Going out is a signature. Coming back is a demonstration, and it takes as long as the officer on duty decides it takes, because an expedition returning from [[the-green]] is presumed contaminated until it proves otherwise and nobody in the line argues.

Three kinds of people are waiting, and the party has to be one of them.

**Who owns your passage owns you a little.** That is the gate's whole lesson and it teaches it in one line.`,
  },
  {
    key: "a-commission", kind: "QUEST_STEP", x: 3120, y: -160,
    title: "The State's Instrument",
    summary: "Out through the gate on Arcadian paper, owing a report to people who would very much like eyes inside Lamplight.",
    body: `A commission from the [[peninsula-expeditionary-army]] or from [[the-asis-officer]], stamped, filed, and read back at the gate by a sergeant who has clearly read it already.

You go out as the state's instrument. Supplies are better, the checkpoint is quicker, and the [[exclusion-area]] register will show you left under paper rather than as one of the crowd.

**And you owe a report.** Not immediately. Not urgently. Merrow is patient and will be reasonable for as long as reasonable works, and the arc never lets the party forget that they have not filed yet.`,
    completion: "The party leaves Arcadia under Arcadian commission, with a reporting obligation attached.",
    effects: ["set flag: passage-by-commission", "ASIS has a route into Lamplight, and it is the party."],
  },
  {
    key: "walk-with-them", kind: "QUEST_STEP", x: 3120, y: -40,
    title: "One Of The Unlit",
    summary: "Out with the procession. Free, no service owed, nobody asking what you are — and the register records you as one of them.",
    body: `You walk out with [[the-radiant-path]].

Free. No paper, no service owed, and nobody at the front of the column asking what any of you are, which after [[census-office]] and the gates and the standing files is an unfamiliar sensation and not an unpleasant one.

The Path buries in [[the-green]] what it could not afford to keep in the city, so it knows the road, the water, and the checkpoint's habits better than the people who man the checkpoint.

**And the register records it.** Whatever the party privately is, [[arcadian-special-intelligence-service]] now has them leaving Arcadia among the Unlit, and a file that says *inconclusive* has acquired a line that is not inconclusive at all.`,
    completion: "The party leaves Arcadia in the Path's column, and is recorded doing it.",
    effects: ["set flag: passage-with-the-path", "The party is on the Exclusion Area register as Path-affiliated."],
  },
  {
    key: "freight", kind: "QUEST_STEP", x: 3120, y: 80,
    title: "Pay, Or Owe",
    summary: "Out with Stormglass freight. Clean, fast, expensive, and Stormglass remembers who owes.",
    body: `[[stormglass-cartel]] moves freight through [[the-green]], and it will move people with it for a price that is honest and high.

Pay it and you are nobody's instrument and nobody's convert. You go out fast, well-escorted, and entirely uninteresting to everybody's file.

Or owe it, which is cheaper today.

**Stormglass remembers who owes**, and a great many Arcadians end up on Cartel payrolls precisely because the Cartel is very patient about the difference between a debt and an employee.`,
    completion: "The party leaves Arcadia on Cartel freight, paid for or on credit.",
    effects: ["set flag: passage-by-freight", "The party owes nobody in Arcadia, and possibly owes Stormglass."],
  },
  {
    key: "lamplight", kind: "SCENE", x: 3380, y: -40,
    title: "Somebody Handed Him A Bowl",
    summary: "The camp in the green at its best: fed, welcomed, out of the lattice, off the ledger — and a friend from the island who is happy for the first time since it fell.",
    body: `A day and a half inland, on ground nobody claims, [[the-radiant-path]] keeps a camp.

No lattice. No register. Nobody asks what you are. There is food and it is given rather than sold, and the Unlit earn their passage on Devil crews because the [[arcadian-devil]] is the richest source of [[essence]] on the peninsula and the bindings have to be paid for somehow.

**And [[del-anwar]] is here.** The Kestrel survivor who recognised the party in [[binding-in-arcadia]] — not by face, by question. He is wearing somebody else's coat, too big, with obvious pleasure. He is fed. He is safe. He is happy, for the first time since the island fell, and he will tell you cheerfully that he does not know whether the Light is real and does not much care.

He was drowning. These were the only people who reached.

**Whatever the player does to the Path, they do to Del.** He is the cost, with a name they already know, and no choice in this act is about him.`,
    effects: ["The player sees the Radiant Path at its best, from the inside, before anybody shows them the price.", "Del Anwar is re-established as the human cost of every branch that follows."],
  },
  {
    key: "the-thin-reserve", kind: "CONDITION", x: 3380, y: 100,
    title: "Thin",
    summary: "The Southside's Forge reserve, readable all act, dropping on a clock the player cannot directly fix — and the people it costs are never Path.",
    body: `A number, available to anybody who thinks to look, at any Forge hall in the city: **Healthy, Thin, Dry.**

[[the-southside]] has been Thin for two winters. [[reclamation]] pays a short reserve out of the person — the Forge builds what it can afford and the shortfall comes off the life that was lived — so nobody in [[port-arcadia]] stays dead for want of money. **They come back less.**

The Path teaches that dying is devotion and standing rises with reclamations. Every passage draws the same reserve.

So the ladder read backwards is a damage report, and [[the-platform-ledger]] has the count. [[ivo-crane]] has died eleven times. He was a foundry rigger with a union card and a good head for load, and now he is a short, loud, certain man with a smaller vocabulary than the trade he came out of. **He did not become a fanatic. He was reduced to one**, and nobody who has lost it can miss it, so he does not know.

**No line of dialogue in this arc says any of that.** It is in the ledger. The ledger is readable. That is all.

And the people the winter kills are never Path. They are the ones who go off a crane and find the reserve already spent.`,
    effects: ["The Southside reserve is readable for the rest of the act, and drops.", "The player watches a number they cannot directly fix."],
  },
  {
    key: "three-hundred-and-eleven", kind: "CHOICE", x: 3640, y: 40,
    title: "Three Hundred And Eleven",
    summary: "The graveyard is older than the faith. The Marker was here first, she keeps the only honest count on the peninsula, and it is not paper.",
    body: `Ten minutes' walk from the camp: [[the-stone-field]], rough ground past the treeline, no rows, no plan, and three hundred and eleven markers cut with one word each.

They are [[the-single-name]] — the funeral [[the-unregistered]] keep, and the only one left on the peninsula. **The Marker carves them.** She is Unregistered herself. She gets one name, and so do they.

**Who is actually in her ground.** Not the poor. The two kinds who stay dead are the unbound, whose Echo no Forge holds, and the Unregistered, whose pattern no Forge can resolve. Her field is both, and nothing else — which is why the Path's free binding is not a kindness. It is the difference between a platform and a stone.

**And she was here first.** [[lamplight]] was built where the graves already were. A graveyard that grew a faith, rather than a faith that dug a graveyard.

**The third ledger.** [[the-platform-ledger]] says who came back. [[choir-ledger-page]] says who owes for it. The field says who never came back at all, and it is the only one of the three that cannot be called a forgery, because it is not paper.`,
    effects: ["The player has now seen the only count on the peninsula that nobody can dispute."],
  },
  {
    key: "the-devil-crew", kind: "QUEST_STEP", x: 3900, y: 40,
    title: "The Light Providing",
    summary: "How the Unlit earn their passage, where the Essence for the bindings comes from, and why the field keeps filling.",
    body: `The [[arcadian-devil]] is a large, multi-sectioned, multi-limbed insectoid that moves across the jungle floor at terrifying speeds, and it is the richest source of [[essence]] in [[the-green]]. The Unlit hunt them.

That is how a movement with no money pays for free bindings, and it is honest work, and it kills people.

**Follow the loop.** The Path harvests Devils to pay for reclamations. The Unlit earn their passage on the crews. The crews get people killed. The dead go into [[the-stone-field]]. The field is reliable carrion in a fixed place, which is the one thing a gravid Dam selects ground for — and she has never once had to come closer than the treeline.

A perfect closed circle that looks exactly like providence. [[ilse-vetch]] calls it the Light providing.

**It is a nest**, and the camp has been feeding it for two years by holding funerals.`,
    completion: "The party runs at least one Devil crew with the Unlit, and comes back with what a crew comes back with.",
    effects: ["The party learns where the Path's money comes from, which is not where the Path thinks it comes from.", "Optional: the Dam under the stone field becomes findable."],
    rewards: ["Raw Essence, at the going rate for a Devil, minus what the crew keeps"],
  },
  {
    key: "the-two-ledgers", kind: "CHOICE", x: 4160, y: 40,
    title: "A Debt And Its Collateral",
    summary: "Corrin Ade keeps the roll. A player who has been paying attention can get the Choir's paper onto the same table as it.",
    body: `[[corrin-ade]] keeps the Path's roll now, in the same hand he kept [[the-platform-ledger]] in for eleven years.

A player who has been paying attention — or who took [[the-asis-officer]]'s commission, or who followed [[wren-salloway]] out of the camp on the last night of a month — can get [[choir-ledger-page]] onto the same table as it. *A debt, its collateral, and the person who owes*, in the [[crimson-choir]]'s own hand, on the Choir's own paper, which it honours to the letter.

**The collateral is the convert.**

Ade signed it. He signed it with his eyes open, because free binding for the unbound was worth it and because he had already worked out what it would cost and decided. He has not told [[ilse-vetch]]. He tells himself that is protection, and he knows it is also control.

**Both sides of this are a cost.** Show her, and the movement breaks on its founder's face — and the only thing feeding the Southside's unbound stops. Do not, and the debt keeps compounding on the people who fed you last night.`,
  },
  {
    key: "what-she-does-with-it", kind: "SCENE", x: 4420, y: 40,
    title: "On Her Face",
    summary: "What Ilse Vetch does when the paper is in front of her — and what she can and cannot call it.",
    body: `She can call a ledger a forgery. She can call the Choir's paper slander, a plant, a state fabrication, hatred of the pure, and there is a shorter word for it in [[the-southside]] and she has heard it used about her a hundred times.

**She cannot call [[the-stone-field]] anything.** It is not paper.

So the sequence matters. Put Ade's roll beside the Choir's paper and the movement has an answer ready. Then walk her out among the stones and ask her which of the three hundred and eleven the Light kept.

If she is shown it and believes it: everything she has built rests on money from the one power that lends against souls and always collects, and she has been handing the collateral to it in bowls of soup, and she says so herself before anybody else can.

If she refuses it: she is not lying. She has simply reached the place where a person cannot afford a fact, and the arc lets her stay there, and it is not a punishment and it is not a joke.

**Either way [[corrin-ade]] is standing right there**, and what he does is the most interesting thing in the scene.`,
    effects: ["The Radiant Path either breaks on its founder's face or hardens permanently around her refusal.", "Whatever happens, the Southside's unbound lose something."],
  },
  {
    key: "the-deep-green", kind: "QUEST_STEP", x: 4680, y: 40,
    title: "The City's Writ Ends At The Treeline",
    summary: "The crossing. Ninety-five percent of what lives out here wants people dead, and something goes badly wrong.",
    body: `Past the camp the road stops pretending. [[the-green]] is regrowth over ground that was hunted clean during the Great Purges two thousand years ago, and its everyday emptiness of magic is inherited rather than natural, and none of that helps at all with what grew back.

Arcadia's writ ended at the treeline. Ninety-five percent of what lives out here wants people dead, and everyone in the [[exclusion-area]] inspection line has known somebody who came back wrong.

Something goes wrong. The party is separated, overrun, or simply lost somewhere that does not care which.

**Jungle-native, and factional in no way at all** — this is not an ambush by anybody's enemies. It is the country. That matters, because of what happens next.`,
    completion: "The party is in serious trouble in the deep green, from the green itself and from nobody's politics.",
    effects: ["The party is separated from the road and from whoever they walked out with."],
  },
  {
    key: "the-woman-in-the-green", kind: "SCENE", x: 4940, y: 40,
    title: "The Woman In The Green",
    summary: "She arrives violently and mostly annoyed about having to. Then she hears who they are looking for, and a curl of smoke rises from her hair.",
    body: `She arrives the way weather arrives.

It is violent, it is extremely fast, and she is mostly annoyed about having had to. She does not introduce herself and she does not ask who they are. She asks what they are doing out here, in the tone of somebody who has pulled idiots out of this jungle before and resented every one of them.

Then she hears who they are looking for.

And a curl of smoke rises from her hair.

---

**THIS IS THE HAND-OFF, AND IT IS THE ONLY ONE.**

[[amanda]]'s mission 1, *the-woman-in-the-peninsula*, fires here. Her nine-mission chain webs off from this node and runs its own course for the rest of the game. **The mainline records the meeting, links her, and walks on.** It does not wait for her, does not gate on her, and continues through the green without her if she is left behind.

**She does not join the party. She joins the search.**

Her recruitment gate is two conditions and both are already canon: the party must be in the green, and the party must already be hunting [[tino]]. Nothing here reveals anything about what she is. That is late-game and it belongs to her own chain.`,
    effects: ["Amanda's companion chain opens. It runs on its own clock from this point and the mainline never waits for it.", "The party has a second hunter for Tino, and does not yet know what that means."],
  },
  {
    key: "the-ash-ground", kind: "SCENE", x: 5200, y: -60,
    title: "The Canopy Grows In Rectangles",
    summary: "A clearing two hours off the road where two thousand years of regrowth is interrupted in a grid. Nobody explains it. Nothing happens.",
    body: `[[the-ash-ground]]. Two hours off the inland road there is a clearing, and the canopy over it grows in rectangles.

Not a ruin. Nothing standing, nothing fallen, and nothing under the soil that a shovel finds. What there is, is shape: long straight interruptions in two thousand years of regrowth, at intervals, in a grid, on ground where the peninsula was hunted clean.

Something was penned here. Nothing says what.

**Glimpse discipline, absolutely.** No bones. No marker. No inscription. No NPC who explains it, no document that mentions it, and no dialogue about it at all.

If [[amanda]] is walking with the party, **she goes quiet, takes a different line around it, and does not say why.** Nothing is revealed. Her species is not named until her own mission 8, late-game, and this beat never comes near breaking that — it simply means that on a second playthrough this is the worst thirty seconds in the act.

Nothing happens. That is what happens.`,
  },
  {
    key: "the-second-wagon", kind: "QUEST_STEP", x: 5460, y: -60,
    title: "Crane's War",
    summary: "He burns another one, deep in the green, where the city cannot see it and cannot pretend it did not happen.",
    body: `He does it again, four days up the road, and this time there is no Arcadian jurisdiction within sixty kilometres and no possibility of calling it anything but what it is.

The register changes. Until now [[the-radiant-path]] has been a religious question that a city was arguing about. After this it is a military one, and every institution on the peninsula reprices it in the same week.

[[the-asis-officer]] stops being reasonable, and she is honest about the moment it happened. [[aegis-extraction-consortium]] stops treating the road as a freight problem. And inside the movement, **[[ivo-crane]] wins the argument he has been losing to [[ilse-vetch]] for a year**, at exactly the point the player most needs him to lose it.

A player who has been sympathetic to the Path now has to decide whether the sympathy survives contact with what the movement is becoming — and the honest answer is that Crane is not wrong about the cages and is not right about anything else.`,
    completion: "The second wagon burns, and every institution on the peninsula reprices the Radiant Path in the same week.",
    effects: ["set flag: crane-made-it-a-war", "The Path's moderates lose the argument to its militants.", "Arcadia hardens permanently, in every branch, including the one where the veto held."],
  },
  {
    key: "what-del-does", kind: "SCENE", x: 5720, y: -60,
    title: "Somebody Tries To Leave",
    summary: "Late on the road, after the wagon and after the stones, Del Anwar tries to leave — and the player is standing right there.",
    body: `After the wagon. After the stones. After the register changed and the column stopped feeling like a crowd and started feeling like a formation.

[[del-anwar]] tries to leave.

He is not denouncing anybody. He is not going to Arcadia. He is a cleared foreigner with somebody else's coat who has worked out that he is walking toward a city with a movement that is now burning wagons, and he would like to stop.

**Canon's law is that a power which cannot be left is a prison.** What [[the-radiant-path]] does about Del is its true answer to that law, and the player is standing right there when it happens.

**The codex does not pre-write the answer.** The first writer of this scene owns it, and it should be the last thing written in the arc — after the tone of everything around it is settled, and with the full knowledge that the movement has been shown at its best, its most honest, and its most frightened by that point.

Whatever the answer is, it is not a speech. Ilse Vetch is not a woman who makes speeches, and Ivo Crane does not need one.`,
    effects: ["The Radiant Path answers, in front of the player, whether it can be left."],
  },
  {
    key: "the-last-water", kind: "SCENE", x: 5980, y: -60,
    title: "You Can Track Them By Their Graves",
    summary: "The last reliable water before the ground rises to Heartland, and the road behind the column is marked.",
    body: `[[the-last-water]]: the last reliable water before the ground rises toward [[heartland]], and therefore the last place several hundred people on foot can stop together.

Walking a crowd through [[the-green]] kills some of the crowd. The Marker walks with the procession, so by now the road behind it is marked — **you can track a moving faith by its graves** — and a player who ran ahead has passed every one the people behind them have not dug yet.

It is also where the lamps get lit for the final leg. Several hundred of them, on a jungle road, after dark.

Nobody in the column finds that ominous. They have been carrying lamps at waist height at every Remembering since the first one, so every face lights from beneath, and it is the warmest thing any of them has.`,
    effects: ["The road's own graves are legible behind the column.", "The lamps are lit for the last leg."],
  },
  {
    key: "the-light-with-no-edge", kind: "SCENE", x: 6240, y: 60,
    title: "Off The Trail, After Dark",
    summary: "Optional, at night, at the edge of the column. There is a light in the trees and somebody is walking toward it. There is no dialogue in this scene.",
    body: `Somewhere off the trail there is a light.

It is not a lamp. It is soft, cold, and it fills a volume of air under the canopy rather than shining from a point, and there is no source anywhere inside it and no edge where it stops. It is not bright. It does not flicker. It is, and nobody who sees it uses the word *frightening* about it afterwards.

Somebody at the edge of the column has stopped walking with the column and started walking toward it.

**There is no dialogue in this scene.** There is a light, a strap, a decision, and however long the party takes to make it. [[the-lamplighter]] is what the [[arcadian-soverign-guard]]'s expedition register calls the thing that does this, contemptuously, and the register's whole note on the matter is four words long.

**Nothing in this arc, this scene, or any document anywhere connects this to anything anybody has said in it.** It is a jungle predator with a lure, on a road, at night. That is all it is, and that is all it will ever be told to be.`,
    effects: ["Somebody at the edge of the column is pulled back, or is not."],
  },
  {
    key: "the-procession", kind: "QUEST_STEP", x: 6500, y: -60,
    title: "Hundreds Of Lamps On A Jungle Road",
    summary: "The Path walks to Heartland to put its question to Brother Aster — the one witness who was on the far side — and the city does not know they are coming.",
    body: `Several hundred people, walking, with lamps at waist height, toward a city under a generation-old Standstill that has no idea they are on the road.

**What they are going to ask.** [[brother-aster]] is a Forge and a person, in the Core that [[the-sexton-of-heartland]] serves, and the Congregation's own standing question is whether it will ever ordain him — *the Sexton of Heartland has not asked him.*

**The Path decided to ask first.**

That is the whole endgame of the Peninsula, and it is not a threat, an assault, or a march. It is a question, carried by a thousand people, to the only witness in the world who might have been on the far side of the light — and the Congregation's horror is not that the heresy is wrong. It is that the heresy reached the witness before the church did.

**The arc ends on the journey and never on the answer.** Aster does not preach here and does not answer here. What he would say stays permanently open, exactly as it has been since the day he was written.

What [[heartland]] gets is not the spark. It is the powder: a neutral city, five factions holding five gate-legs, everybody polite and counting exits — and a thousand pilgrims arriving to ask its Forge a question its own church has never dared ask.

Alder Wade dies later, and the city was already full.`,
    completion: "The procession reaches the approaches to Heartland, and the party arrives with it, ahead of it, or behind it.",
    effects: ["The Riverlands opens.", "Heartland receives the powder for its own fuse, without this arc touching that fuse."],
  },
  {
    key: "ahead-of-it", kind: "ENDING", endingKind: "NEUTRAL", x: 6760, y: -180,
    title: "Ahead Of It",
    summary: "You went fast and warned Heartland. A stranger arrives at the gate with a warning, and Arcadia's thanks.",
    body: `You went fast, and you got there first, and you told them.

[[heartland]] hears about the procession from a stranger rather than from its own gate watch, which is worth something in a city that has held a Standstill for a generation by knowing things early. The five houses on the five gate-legs each do the arithmetic separately and reach five different conclusions, which is how that city works.

**What the Riverlands sees:** somebody who brought a warning, and carried Arcadian gratitude with them.

**What it costs:** the people you walked with for three weeks arrive to find a city already braced. Whatever welcome they were going to get, they get less of it, and [[del-anwar]] is somewhere in that column.

Nothing about [[brother-aster]] is settled. The question is still coming up the road behind you.`,
  },
  {
    key: "with-it", kind: "ENDING", endingKind: "NEUTRAL", x: 6760, y: -60,
    title: "With It",
    summary: "You walked in among the Unlit. Whatever you privately are, Heartland has now seen what you arrived as.",
    body: `You walked in among them, at waist height, with a lamp.

Whatever the party privately believes, [[heartland]] has now seen what they arrived as, and a city that has spent a generation counting exits does not spend much time on what people privately believe.

**What the Riverlands sees:** one of them.

**What it costs:** every institution in the Riverlands that has read Arcadia's file on the party now reads it differently, and [[the-asis-officer]] — who is patient, and who was owed a report — hears about it in a week.

**What it buys:** [[ilse-vetch]] arrives with the party beside her, and the Congregation's chapel at the Forge hall opens its door to a heresy that has walked three weeks to ask a question. Nothing about [[brother-aster]] is settled. The arc ends on the journey.`,
  },
  {
    key: "behind-it", kind: "ENDING", endingKind: "NEUTRAL", x: 6760, y: 60,
    title: "Behind It",
    summary: "You broke the Path at the stones and followed the pieces up the road. Something true is scattered along it, and you are carrying what is left.",
    body: `You put the roll beside the paper, and then you walked her out among the stones, and it ended in a field.

**What the Riverlands sees:** somebody trailing a scattered faith, carrying what is left of it.

**What it costs:** the only thing feeding the unbound in [[the-southside]] has stopped, [[wren-salloway]]'s paper is still valid and the [[crimson-choir]] still honours its paper to the letter, and the collateral is still the convert. Breaking a movement does not cancel its debts. It only removes the thing that was servicing them.

**What is true about it:** the Path's grievance was real, its practice was destructive, and neither half ever cancelled the other. Nobody woke up evil. The player was right, and the district is worse, and both of those are the same sentence.

[[del-anwar]] is somewhere on this road too, and he does not have a coat any more.

Nothing about [[brother-aster]] is settled. Somebody will still ask him. It will just take longer now.`,
  },
];

// ------------------------------------------------------------------- the wiring

const edges: EdgeSpec[] = [
  { from: "the-trail-points-inland", to: "the-accreditation-queue" },
  { from: "the-accreditation-queue", to: "the-drawn-shutter" },
  { from: "the-drawn-shutter", to: "the-platform" },
  { from: "the-platform", to: "the-two-witnesses" },
  { from: "the-two-witnesses", to: "an-informer" },

  { from: "an-informer", to: "the-first-wagon", label: "Take the commission. You will owe her a report.",
    effects: ["set flag: took-the-asis-commission", "ASIS gets a route into Lamplight and the party gets a debt that is never called in urgently."] },
  { from: "an-informer", to: "the-first-wagon", label: "Refuse, and say so to her face.",
    effects: ["Merrow says thank you, means it, and does not close the file. The party leaves Arcadia with nothing owed and nothing offered."] },
  { from: "an-informer", to: "the-first-wagon", label: "Say yes, and mean none of it.",
    effects: ["set flag: took-the-asis-commission", "The party carries an obligation it has already decided not to honour, to somebody whose favourite word is inconclusive."] },

  { from: "the-first-wagon", to: "the-clearance" },
  { from: "the-clearance", to: "the-veto" },
  { from: "the-veto", to: "an-audience" },

  { from: "an-audience", to: "what-he-keeps", label: "You call him right. Then you stop him.",
    effects: ["Kane closes the file himself, and the commission through the exclusion area is offered without ASIS attached to it."] },
  { from: "an-audience", to: "what-he-keeps", label: "You give him what he is asking for.",
    effects: ["Kane does not argue. He asks who pays for it, and writes down the answer."] },
  { from: "an-audience", to: "what-he-keeps", label: "You find out who is paying him.", condition: "took-the-asis-commission",
    effects: ["The Chancellor and ASIS are now running the same errand through the same person, and Merrow is not told."] },
  { from: "an-audience", to: "what-he-keeps", label: "Nothing. He is right.",
    effects: ["Kane says the city cannot afford that answer and neither can he, and the audience ends politely and early."] },

  { from: "what-he-keeps", to: "unanimity" },
  { from: "unanimity", to: "the-floor" },

  { from: "the-floor", to: "the-foreigner-answers", label: "I do.",
    effects: ["set flag: floor-answered-by-party", "A foreigner fights for the Chancellor's veto in front of the enfranchised of Arcadia."] },
  { from: "the-floor", to: "the-red-devil", label: "He can answer for himself.",
    effects: ["set flag: floor-answered-by-kane", "Kane takes the floor at sixty-one with one eye, and the city watches him earn the name again."] },
  { from: "the-floor", to: "the-red-devil", label: "Table the Choir's paper to the chamber first.", condition: "choir-ledger-page",
    effects: ["set flag: clearance-evidence-tabled", "The Clearance acquires evidence and the veto reads to the chamber as protection of a Crimson Choir front. He does not withdraw it. He fights anyway, and afterwards nobody thanks him."] },

  { from: "the-red-devil", to: "the-gate-that-excludes-both-ways" },
  { from: "the-foreigner-answers", to: "the-gate-that-excludes-both-ways" },

  { from: "the-gate-that-excludes-both-ways", to: "a-commission", label: "Go out on Arcadian paper.",
    effects: ["The state's instrument, with a reporting obligation."] },
  { from: "the-gate-that-excludes-both-ways", to: "walk-with-them", label: "Walk out with the procession.",
    effects: ["Free, no service owed — and the register records the party as one of the Unlit."] },
  { from: "the-gate-that-excludes-both-ways", to: "freight", label: "Buy passage from Stormglass.",
    effects: ["Nobody's instrument and nobody's convert, at a price that is honest and high."] },

  { from: "a-commission", to: "lamplight" },
  { from: "walk-with-them", to: "lamplight" },
  { from: "freight", to: "lamplight" },

  { from: "lamplight", to: "the-thin-reserve" },
  { from: "the-thin-reserve", to: "three-hundred-and-eleven" },

  { from: "three-hundred-and-eleven", to: "the-devil-crew", label: "Show her count to Vetch.",
    effects: ["set flag: stood-in-the-field", "Vetch can call a ledger a forgery. She cannot call a field one, and it is the only argument the Path has no counter to."] },
  { from: "three-hundred-and-eleven", to: "the-devil-crew", label: "Ask what she wants for the stones.",
    effects: ["set flag: stood-in-the-field", "Nothing. She has never asked anybody for anything, which is why the Unregistered will hear that the party stood here."] },
  { from: "three-hundred-and-eleven", to: "the-devil-crew", label: "Say nothing, and help her cut one.",
    effects: ["set flag: stood-in-the-field", "An hour of work, no dialogue, one word. The stone is for a name the party recognises, and she does not point that out."] },

  { from: "the-devil-crew", to: "the-two-ledgers" },

  { from: "the-two-ledgers", to: "what-she-does-with-it", label: "Put both ledgers in front of her.", condition: "choir-ledger-page",
    effects: ["The movement is broken on its founder's face, and the only thing feeding the Southside's unbound stops."] },
  { from: "the-two-ledgers", to: "what-she-does-with-it", label: "Take it to Ade instead, and give him the choice.",
    effects: ["The one member who joined on evidence is handed the evidence, and what he does with it is his."] },
  { from: "the-two-ledgers", to: "what-she-does-with-it", label: "Leave it. They fed you last night.",
    effects: ["The debt keeps compounding on the people who fed the party, and the Choir honours its paper to the letter."] },

  { from: "what-she-does-with-it", to: "the-deep-green" },
  { from: "the-deep-green", to: "the-woman-in-the-green" },
  { from: "the-woman-in-the-green", to: "the-ash-ground" },
  { from: "the-ash-ground", to: "the-second-wagon" },
  { from: "the-second-wagon", to: "what-del-does" },
  { from: "what-del-does", to: "the-last-water" },
  { from: "the-last-water", to: "the-light-with-no-edge", label: "There is a light off the trail." },
  { from: "the-last-water", to: "the-procession", label: "Stay with the column." },
  { from: "the-light-with-no-edge", to: "the-procession" },

  { from: "the-procession", to: "ahead-of-it", label: "Go fast, and warn Heartland.",
    effects: ["The city is braced before the column arrives, and Arcadia is grateful."] },
  { from: "the-procession", to: "with-it", label: "Walk in among them.",
    effects: ["Whatever the party privately is, Heartland has seen what they arrived as."] },
  { from: "the-procession", to: "behind-it", label: "Follow what is left of them.", condition: "stood-in-the-field",
    effects: ["The party arrives trailing a scattered faith and carrying what is left of it."] },
];

// ------------------------------------------------------------ what is in a scene

const links: { node: string; slugs: string[] }[] = [
  { node: "the-trail-points-inland", slugs: ["tino", "port-arcadia", "exclusion-area", "the-radiant-path"] },
  { node: "the-accreditation-queue", slugs: ["the-accreditation-hall", "embassy-row", "the-radiant-path", "the-nation-state-of-arcadia", "arcadian-special-intelligence-service"] },
  { node: "the-drawn-shutter", slugs: ["the-drawn-shutter", "ilse-vetch", "the-radiant-path", "suspicion", "port-arcadia"] },
  { node: "the-platform", slugs: ["the-lamp-chapel", "imogen-roe", "what-the-forge-rebuilds", "cybernetic-ascendancy", "the-radiant-path", "waterfront-district"] },
  { node: "the-two-witnesses", slugs: ["imogen-roe", "ilse-vetch", "lamplight"] },
  { node: "an-informer", slugs: ["the-asis-officer", "the-quiet-office", "arcadian-special-intelligence-service", "the-southside", "lamplight"] },
  { node: "the-first-wagon", slugs: ["ivo-crane", "the-burned-wagon", "aegis-extraction-consortium", "the-platform-ledger"] },
  { node: "the-clearance", slugs: ["ottoline-vasque", "chancellory-of-arcadia", "the-southside", "exclusion-area", "the-green"] },
  { node: "the-veto", slugs: ["abraham-islay-kane"] },
  { node: "an-audience", slugs: ["abraham-islay-kane", "what-the-forge-rebuilds"] },
  { node: "what-he-keeps", slugs: ["abraham-islay-kane", "port-arcadia", "essence"] },
  { node: "unanimity", slugs: ["ottoline-vasque", "abraham-islay-kane"] },
  { node: "the-floor", slugs: ["ottoline-vasque", "abraham-islay-kane", "chancellory-of-arcadia"] },
  { node: "the-red-devil", slugs: ["abraham-islay-kane", "ottoline-vasque", "ilse-vetch", "brother-aster", "heartland", "the-radiant-path"] },
  { node: "the-foreigner-answers", slugs: ["abraham-islay-kane", "ottoline-vasque"] },
  { node: "the-gate-that-excludes-both-ways", slugs: ["the-lower-gate", "the-green", "exclusion-area"] },
  { node: "a-commission", slugs: ["peninsula-expeditionary-army", "the-asis-officer", "exclusion-area"] },
  { node: "walk-with-them", slugs: ["the-radiant-path", "the-green", "census-office", "arcadian-special-intelligence-service"] },
  { node: "freight", slugs: ["stormglass-cartel", "the-green"] },
  { node: "lamplight", slugs: ["lamplight", "the-radiant-path", "del-anwar", "arcadian-devil", "essence"] },
  { node: "the-thin-reserve", slugs: ["the-southside", "reclamation", "the-platform-ledger", "ivo-crane", "port-arcadia"] },
  { node: "three-hundred-and-eleven", slugs: ["the-stone-field", "the-single-name", "the-unregistered", "the-platform-ledger", "choir-ledger-page", "lamplight"] },
  { node: "the-devil-crew", slugs: ["arcadian-devil", "essence", "the-green", "the-stone-field", "ilse-vetch"] },
  { node: "the-two-ledgers", slugs: ["corrin-ade", "the-platform-ledger", "choir-ledger-page", "crimson-choir", "wren-salloway", "ilse-vetch", "the-asis-officer"] },
  { node: "what-she-does-with-it", slugs: ["ilse-vetch", "corrin-ade", "the-stone-field", "the-southside"] },
  { node: "the-deep-green", slugs: ["the-green", "exclusion-area"] },
  { node: "the-woman-in-the-green", slugs: ["amanda", "tino"] },
  { node: "the-ash-ground", slugs: ["the-ash-ground", "amanda"] },
  { node: "the-second-wagon", slugs: ["ivo-crane", "ilse-vetch", "the-radiant-path", "the-asis-officer", "aegis-extraction-consortium"] },
  { node: "what-del-does", slugs: ["del-anwar", "the-radiant-path"] },
  { node: "the-last-water", slugs: ["the-last-water", "the-green", "heartland"] },
  { node: "the-light-with-no-edge", slugs: ["the-lamplighter", "arcadian-soverign-guard"] },
  { node: "the-procession", slugs: ["brother-aster", "the-sexton-of-heartland", "heartland", "the-radiant-path"] },
  { node: "ahead-of-it", slugs: ["heartland", "del-anwar", "brother-aster"] },
  { node: "with-it", slugs: ["heartland", "ilse-vetch", "the-asis-officer", "brother-aster"] },
  { node: "behind-it", slugs: ["the-southside", "wren-salloway", "crimson-choir", "del-anwar", "brother-aster"] },
];

// --------------------------------------------------------------- the dialogue

type LineSpeaker = { slug: string } | { role: string };
type LineSpec = { number: number; speaker: LineSpeaker; listener?: LineSpeaker; text: string; performance?: string; intensity?: number; emotion?: string[] };

const lineSets: { node: string; lines: LineSpec[] }[] = [
  {
    node: "an-informer",
    lines: [
      { number: 1, speaker: { slug: "the-asis-officer" }, listener: { role: "player" }, intensity: 4, emotion: ["dry"], performance: "she has the file open and does not look at it",
        text: "Your file says inconclusive. That is my word and it does not mean I have no opinion. It means I have not finished." },
      { number: 2, speaker: { slug: "the-asis-officer" }, listener: { role: "player" }, intensity: 5, emotion: ["dry", "command"], performance: "sourced, and she names the documents",
        text: "I have read the same roll you have. I have also read the Southside's reserve reports, and I can tell you how many people that district loses this winter because a church has made dying into a promotion. None of them will be Path. They will be the ones who go off a crane and find the reserve already spent." },
      { number: 3, speaker: { slug: "the-asis-officer" }, listener: { role: "player" }, intensity: 4, emotion: ["calm"], performance: "not a threat, and it lands as one anyway",
        text: "I would like eyes at Lamplight and I would prefer them to be yours. I will be reasonable about this for exactly as long as reasonable works, and I am telling you that at the start rather than at the end." },
    ],
  },
  {
    node: "an-audience",
    lines: [
      { number: 1, speaker: { slug: "abraham-islay-kane" }, listener: { role: "player" }, intensity: 4, emotion: ["calm", "dry"], performance: "he finishes the paragraph first",
        text: "Sit. Your file says inconclusive. That is Inspector Merrow's favourite word and it means she has not finished." },
      { number: 2, speaker: { slug: "abraham-islay-kane" }, listener: { role: "player" }, intensity: 4, emotion: ["calm"],
        text: "You have eaten in the Southside. Somebody offered to pay for your binding and asked nothing for it, and you are still working out what that cost you. So am I. Fifteen years." },
      { number: 3, speaker: { slug: "abraham-islay-kane" }, listener: { role: "player" }, intensity: 3, emotion: ["calm"], performance: "no emphasis anywhere in it",
        text: "So. If a man tells you that permanence in this city is rationed by wealth, and he is right, what do you do with him?" },
    ],
  },
  {
    node: "what-he-keeps",
    lines: [
      { number: 1, speaker: { slug: "abraham-islay-kane" }, listener: { role: "player" }, intensity: 5, emotion: ["calm"], performance: "at the door, not turning round",
        text: "I was the first man in that chamber to say out loud that we should not burn people for fuel. I have run a government that prices permanence every day since. Both of those are me." },
      { number: 2, speaker: { slug: "abraham-islay-kane" }, listener: { role: "player" }, intensity: 4, emotion: ["calm", "command"],
        text: "Whichever one you tell people about, tell them the other one as well." },
      { number: 3, speaker: { slug: "abraham-islay-kane" }, listener: { role: "player" }, intensity: 4, emotion: ["calm"],
        text: "The chamber will move on the Southside inside a month. I will stop it. Ask me afterwards what I think of the woman down there who says I am renting her back her own soul." },
      { number: 4, speaker: { slug: "abraham-islay-kane" }, listener: { role: "player" }, intensity: 4, emotion: ["dry"],
        text: "I will tell you that she is right. I will also tell you what her church costs this district by winter. Both of those are true as well. Good afternoon." },
    ],
  },
  {
    node: "the-floor",
    lines: [
      { number: 1, speaker: { slug: "ottoline-vasque" }, listener: { role: "chamber-speaker" }, intensity: 6, emotion: ["calm", "afraid"], performance: "steady, and she has practised it",
        text: "I am not asking the chamber to agree with me. I am asking it to notice that I am willing to pay for this, and to weigh that against a veto which has never cost one man anything at all." },
      { number: 2, speaker: { slug: "abraham-islay-kane" }, listener: { slug: "ottoline-vasque" }, intensity: 4, emotion: ["calm"], performance: "he does not stand up to say it",
        text: "It has cost me something every year for fifteen. You have simply never been shown the invoice." },
      { number: 3, speaker: { role: "chamber-speaker" }, intensity: 6, emotion: ["command"], performance: "a ritual formula read off a card nobody has needed in a generation",
        text: "The floor is called and the chamber is bound by it. Who answers for the Chancellor?" },
    ],
  },
  {
    node: "the-red-devil",
    lines: [
      { number: 1, speaker: { slug: "abraham-islay-kane" }, listener: { slug: "ottoline-vasque" }, intensity: 3, emotion: ["calm"], performance: "quietly, to her, while she is still down",
        text: "You were not wrong about the reserve. You were wrong about who spends it." },
      { number: 2, speaker: { slug: "abraham-islay-kane" }, listener: { role: "chamber-speaker" }, intensity: 9, emotion: ["angry", "command"], performance: "the only time in the act his voice comes up, and it is not a shout - it is a man who has run out",
        text: "You reached unanimity in one session. It took you fifteen years to find out that you could. It will take you less next time, and I will not always be standing here." },
      { number: 3, speaker: { slug: "abraham-islay-kane" }, listener: { role: "player" }, intensity: 4, emotion: ["dry"], performance: "only if the party answered for him",
        text: "Thank you. I did not ask you to. You should think about why I did not." },
    ],
  },
  {
    node: "the-two-witnesses",
    lines: [
      { number: 1, speaker: { slug: "imogen-roe" }, listener: { slug: "ilse-vetch" }, intensity: 3, emotion: ["calm"],
        text: "I sat with you for six hours. You did not say anything for the first five. Then you asked for water, and I gave it to you, and that is everything that happened in this room." },
      { number: 2, speaker: { slug: "ilse-vetch" }, listener: { slug: "imogen-roe" }, intensity: 4, emotion: ["warm"], performance: "no edge on it at all",
        text: "That is everything that happened in the room. Yes." },
      { number: 3, speaker: { slug: "imogen-roe" }, listener: { slug: "ilse-vetch" }, intensity: 3, emotion: ["calm", "sad"],
        text: "Ilse. I am not calling you a liar." },
      { number: 4, speaker: { slug: "ilse-vetch" }, listener: { slug: "imogen-roe" }, intensity: 4, emotion: ["warm", "sad"], performance: "the only unkind thing she says in the act, and it is aimed at kindness",
        text: "I know. That is what makes you so hard to talk to." },
      { number: 5, speaker: { slug: "imogen-roe" }, listener: { role: "player" }, intensity: 3, emotion: ["calm"], performance: "after Vetch has gone, and she is not upset",
        text: "Ask me what is on the other side and I will tell you I do not know. Four hundred people. Thirty years. It is the only thing I have ever had to offer any of them, and she is offering them more." },
    ],
  },
  {
    node: "lamplight",
    lines: [
      { number: 1, speaker: { slug: "del-anwar" }, listener: { role: "player" }, intensity: 6, emotion: ["warm", "amused"], performance: "delighted, and he has been waiting to say it",
        text: "You. You are the one who was asking about the man they took alive. Everybody else was asking about boats." },
      { number: 2, speaker: { slug: "del-anwar" }, listener: { role: "player" }, intensity: 5, emotion: ["warm"],
        text: "I do not know if the Light is real. I want to be honest with you about that because everybody here already knows it. What I know is that I was on the floor of a customs shed for four months and these are the people who reached." },
      { number: 3, speaker: { slug: "ilse-vetch" }, intensity: 4, emotion: ["warm", "calm"], performance: "to the room, and she stops halfway through to check on somebody at the back",
        text: "There is no dark. I keep saying it like it is a big thing and it is not a big thing, it is the smallest thing I know. There was no dark, and I was not on my own in it, and it did not want anything from me. Has somebody at the back eaten?" },
    ],
  },
  {
    node: "three-hundred-and-eleven",
    lines: [
      { number: 1, speaker: { slug: "the-marker" }, listener: { role: "player" }, intensity: 2, emotion: ["dry"], performance: "not looking up from the stone",
        text: "Three hundred and eleven." },
      { number: 2, speaker: { slug: "the-marker" }, listener: { role: "player" }, intensity: 3, emotion: ["dry"],
        text: "You have seen her roll. Four hundred names on it, and every one of them came back. Nobody keeps a roll of the ones who did not. So I keep the field." },
      { number: 3, speaker: { slug: "the-marker" }, listener: { role: "player" }, intensity: 3, emotion: ["sad"],
        text: "I do not argue with her. She feeds them and I bury them. Same trade from opposite ends." },
      { number: 4, speaker: { slug: "the-marker" }, listener: { role: "player" }, intensity: 3, emotion: ["dry"], performance: "and a player who has read the Unregistered knows exactly what she has just told them",
        text: "I get one name. So do they, now." },
    ],
  },
  {
    node: "the-two-ledgers",
    lines: [
      { number: 1, speaker: { slug: "corrin-ade" }, listener: { role: "player" }, intensity: 3, emotion: ["dry"], performance: "he does not deny anything, and does not raise his voice",
        text: "Four hundred and eleven bindings in two years. I can tell you what each of them cost and who signed for it, because I signed for all of them, and I read the paper before I did." },
      { number: 2, speaker: { slug: "corrin-ade" }, listener: { role: "player" }, intensity: 4, emotion: ["dry", "sad"],
        text: "You want to know whether she knows. She does not. I decided that, and I have called it protecting her every day since, and you and I both know what else it is." },
    ],
  },
  {
    node: "the-woman-in-the-green",
    lines: [
      { number: 1, speaker: { slug: "amanda" }, listener: { role: "player" }, intensity: 7, emotion: ["angry", "dry"], performance: "annoyed, breathing hard, and she has already stopped looking at the bodies",
        text: "Do not thank me. Tell me what you are doing out here, because nobody walks this far off the road for a good reason." },
      { number: 2, speaker: { slug: "amanda" }, listener: { role: "player" }, intensity: 4, emotion: ["neutral"], performance: "flat, and everything under it changes; a curl of smoke rises from her hair and she does not notice",
        text: "Say that name again." },
    ],
  },
  {
    node: "what-del-does",
    lines: [
      { number: 1, speaker: { slug: "del-anwar" }, listener: { slug: "ilse-vetch" }, intensity: 5, emotion: ["afraid", "warm"], performance: "apologetic, which is the worst part",
        text: "I am not going to say anything about any of you. To anyone. I would just like to stop walking now." },
      { number: 2, speaker: { slug: "ivo-crane" }, listener: { slug: "del-anwar" }, intensity: 7, emotion: ["command"], performance: "a rigger looking at a load, and the vocabulary is smaller than the man it belongs to",
        text: "Nobody is holding you. Look around and tell me where you would go." },
    ],
  },
];

// ------------------------------------------------------------------------- run

async function main() {
  const identity = (await db.$queryRawUnsafe<{ current_database: string }[]>("select current_database()"))[0]?.current_database;
  const actor = await db.user.findFirst({ where: { role: "ADMIN", isActive: true }, orderBy: { id: "asc" }, select: { id: true } });
  if (!actor) throw new Error("Authoring requires an active administrator for revision authorship.");
  const writer = new BoardWriter(db, actor.id, apply);
  const notes: string[] = [];
  const lineChanges: string[] = [];

  // Spoken text is checked here as well as on save and on export: no line
  // breaks, no bible links, no markdown, one utterance.
  for (const set of lineSets) {
    for (const line of set.lines) {
      const problem = dialogueTextProblem(line.text);
      if (problem) throw new Error(`${ARC}/${set.node}/${line.number} is not speakable: ${problem}`);
    }
  }

  // 1. The arc row. BoardWriter has no arc(), so a mainline arc is opened the
  //    way the seed scripts open one — both columns together, because the
  //    CHECK refuses a row where isMainline and category disagree.
  const arcRow = await db.storyArc.findUnique({ where: { slug: ARC }, select: { id: true } });
  const pickup = await db.storyEntry.findUnique({ where: { slug: "port-arcadia" }, select: { id: true, kind: true } });
  if (!pickup || pickup.kind !== "REGION") throw new Error("port-arcadia is missing; the road has to start somewhere real.");

  if (!arcRow) {
    notes.push(`create MAINLINE arc ${ARC} at position 5, picked up in port-arcadia`);
    if (apply) {
      const created = await db.storyArc.create({ data: {
        id: randomUUID(), slug: ARC, title: "The Lamplight Road",
        category: "MAINLINE", isMainline: true, regionEntryId: pickup.id,
        status: "PROPOSED", position: 5, createdByUserId: actor.id,
      }, select: { id: true } });
      await db.storyRevision.create({ data: {
        id: randomUUID(), entityType: "ARC", entityId: created.id, arcId: created.id, action: "CREATED", actorUserId: actor.id,
        summary: "Opened the mainline arc \"The Lamplight Road\" — the Peninsula leg of the main campaign",
      } });
    }
  }

  if (!apply && !arcRow) {
    console.log(JSON.stringify({
      database: identity, mode: "PREVIEW", notes,
      board: `${nodes.length} scenes, ${edges.length} routes, ${lineSets.reduce((sum, set) => sum + set.lines.length, 0)} spoken lines wait for the arc row`,
      note: "Re-run with --apply to open the arc, then preview again to diff the board.",
    }, null, 2));
    return;
  }

  await writer.arcFields(ARC, {
    status: "CANON",
    title: "The Lamplight Road",
    hook: "The trail out of Arcadia runs inland, and Arcadia has one land door. Getting through it means dealing with the movement that walks it for free — and the city is about to decide, on a duelling floor, whether that movement is allowed to exist.",
    summary: "The Peninsula leg of the main campaign, in two movements. The city: a Forgefaith heresy in the Southside, a burned catcher wagon, a chamber that reaches unanimity for the first time in fifteen years, and a Chancellor who vetoes the clearance of a district and answers for it on a duelling floor. The road: the camp in the green, three ledgers, a woman who arrives violently and joins the search, and a thousand lamps walking at Heartland's gate. Three arrivals, no winner, and one hand-off to Amanda.",
  });

  for (const node of nodes) await writer.node(ARC, node);
  for (const edge of edges) await writer.edge(ARC, edge);
  for (const entry of links) await writer.links(ARC, entry.node, entry.slugs);

  // 2. The dialogue. Numbers are frozen export identities; order is display.
  const arcId = await writer.arcId(ARC);
  const speakerData = async (speaker: LineSpeaker) => {
    if ("slug" in speaker) {
      const row = await db.storyEntry.findUnique({ where: { slug: speaker.slug }, select: { id: true, kind: true } });
      if (!row || row.kind !== "CHARACTER") throw new Error(`speaker "${speaker.slug}" is not a CHARACTER in the bible`);
      return { speakerEntryId: row.id, speakerRole: null };
    }
    return { speakerEntryId: null, speakerRole: speaker.role };
  };
  const listenerData = async (listener: LineSpeaker | undefined) => {
    if (!listener) return { listenerEntryId: null, listenerRole: null };
    if ("slug" in listener) {
      const row = await db.storyEntry.findUnique({ where: { slug: listener.slug }, select: { id: true } });
      return { listenerEntryId: row?.id ?? null, listenerRole: null };
    }
    return { listenerEntryId: null, listenerRole: listener.role };
  };

  for (const set of lineSets) {
    const node = await db.storyNode.findUnique({ where: { arcId_key: { arcId, key: set.node } }, select: { id: true } });
    if (!node) { lineChanges.push(`PENDING ${set.node} (${set.lines.length} lines wait for the scene)`); continue; }
    for (const [index, spec] of set.lines.entries()) {
      const data = {
        ...(await speakerData(spec.speaker)),
        ...(await listenerData(spec.listener)),
        order: index,
        text: spec.text,
        performance: spec.performance ?? "",
        intensity: spec.intensity ?? 5,
        emotion: spec.emotion ?? [],
        locale: "en-US",
        voiced: true,
        retiredAt: null as Date | null,
      };
      const stored = await db.storyLine.findUnique({ where: { nodeId_number: { nodeId: node.id, number: spec.number } } });
      const label = `${ARC}/${set.node}/${String(spec.number).padStart(2, "0")}`;
      if (!stored) {
        lineChanges.push(`create ${label} "${spec.text.slice(0, 44)}"`);
        if (apply) await db.storyLine.create({ data: { id: randomUUID(), nodeId: node.id, number: spec.number, createdByUserId: actor.id, ...data } });
        continue;
      }
      const same = stored.speakerEntryId === data.speakerEntryId && stored.speakerRole === data.speakerRole
        && stored.listenerEntryId === data.listenerEntryId && stored.listenerRole === data.listenerRole
        && stored.order === data.order && stored.text === data.text && stored.performance === data.performance
        && stored.intensity === data.intensity && JSON.stringify(stored.emotion) === JSON.stringify(data.emotion)
        && stored.voiced === data.voiced && stored.retiredAt === null;
      if (same) continue;
      lineChanges.push(`update ${label}`);
      if (apply) await db.storyLine.update({ where: { id: stored.id }, data: { ...data, updatedByUserId: actor.id } });
    }
  }

  writer.report(apply ? "The Lamplight Road — APPLYING" : "The Lamplight Road — dry run");
  console.log(JSON.stringify({
    database: identity,
    mode: apply ? "APPLY" : "PREVIEW",
    arc: notes.length ? notes : ["already open"],
    lines: lineChanges.length ? lineChanges : ["unchanged"],
  }, null, 2));
}

main().catch((error) => { console.error(error); process.exit(1); }).finally(() => db.$disconnect());
