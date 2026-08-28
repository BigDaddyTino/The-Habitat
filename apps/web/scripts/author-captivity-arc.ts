import "../lib/environment";
import { getPrismaClient } from "@habitat/db/client";
import { BoardWriter } from "./lib/story-authoring";

/**
 * Builds The Captivity Arc, now that the owner gate has been answered.
 *
 *   pnpm --filter @habitat/web exec tsx scripts/author-captivity-arc.ts [--apply]
 *
 * The board was a scaffold of instructions to a writer — five nodes whose
 * bodies all said some version of "do not decide this yet", gated on one call
 * only the owner could make. On 2026-08-28 he made it:
 *
 *   - THE CHILDREN were taken by [[the-old-hunger]]. Not a faction, not a
 *     transaction, nothing that ransoms or sells. This is why nine years of
 *     searching human channels found nothing: there was nothing to find.
 *   - TINO is held by [[helix-arcanobiotics]], who were hunting the same
 *     bloodline through the same brokers. He believed he had finally caught up
 *     with the people who took his children. He had caught up with a rival.
 *
 * Two disciplines bind every line below. `what-the-player-knows-about-tino`
 * says he is CAPTURED in production truth and MISSING in player knowledge, so
 * this arc works from absence and evidence and never from an omniscient
 * narrator. And the Old Hunger is held to glimpse discipline — it is never
 * named on this board, only described as the shape the missing things leave.
 *
 * The children stay Amanda's to tell. This arc is the player's hunt for the
 * man who kept them alive, and it brushes the deeper thing without knowing it.
 */
const db = getPrismaClient();

async function main() {
  const apply = process.argv.includes("--apply");
  const actor = await db.user.findFirst({ where: { role: "ADMIN", isActive: true }, orderBy: { id: "asc" }, select: { id: true } });
  if (!actor) throw new Error("Authoring requires an active administrator for revision authorship.");
  const write = new BoardWriter(db, actor.id, apply);

  await write.arcFields("the-captivity-arc", {
    status: "CANON",
    hook: "Nobody is looking for Tino. The war has a shape and he is not in it — so the search is you, whatever you carry, and nine years of somebody else's notes.",
    summary: "The mainline hunt for Tino after Ignit. His trail turns out to be nine years old and pointed somewhere else entirely, and following it far enough puts the party in front of the people who took him — who were never looking for him at all.",
  });

  // A party that never asked Rook starts from nothing, and pays for it.
  await write.flag(
    "the-search-was-loud",
    "The Search Was Loud",
    "The party started Tino's search without the file and burned six weeks on a route somebody built to be run. The people holding him read the same reports.",
    `Set when a party opens [[the-captivity-arc]] without [[has-the-tino-file]] and works the rumour instead.

The cost is not the money or the six weeks. It is that a search conducted loudly, in public, in front of brokers who sell information twice, reaches [[helix-arcanobiotics]] before the party does — and Helix has a legal department, a security contract, and every reason to move a valuable subject before anybody arrives.

Checked at the containment site. A quiet search finds a facility running normally. A loud one finds a facility that has been expecting them.`,
  );

  // ---------------------------------------------------------------------

  await write.node("the-captivity-arc", {
    key: "the-missing-man",
    kind: "QUEST_START",
    title: "The Missing Man",
    summary: "Nobody is looking for Tino. Whatever the party carries out of Arcadia is the entire search.",
    status: "CANON", x: 320, y: 0,
    body: `Nobody is looking for Tino.

The war has a shape and he is not in it. Kestrel is on the sea floor. Ignit is a smoke column on a chart and a line item in three separate insurance disputes. The Cartel struck him off the payroll the way they strike off crates, and the Directorate has forty thousand names in worse condition and a budget that runs out in March.

You are it. Whatever you have — a file, a rumour, a bad feeling that will not sit down — is the entire search.

Start.`,
  });

  await write.node("the-captivity-arc", {
    key: "start-from-a-rumour",
    kind: "QUEST_STEP",
    title: "Start From a Rumour",
    summary: "Without the file, the party works a route somebody built to be run — and gets seen doing it.",
    status: "CANON", x: 120, y: 180,
    body: `You never asked Rook, so you start where everyone starts: a name in a bar, sold twice before it reached you.

Six weeks. A boat you paid for. A man in Shattermarket who described the infuser well enough to be believed, and who had — it emerges, later, expensively — described him to three other buyers first.

By the time you understand that you have been running a route somebody built to be run, you have spent money you needed, burned a contact you cannot replace, and put your faces in front of eleven people whose entire trade is telling other people what they saw.

That last part does not stay local.

The trail is still there. You are simply on it late, loud, and known — and the people at the end of it read the same reports you do.`,
    effects: ["set flag: the-search-was-loud"],
  });

  await write.node("the-captivity-arc", {
    key: "the-trail-he-left",
    kind: "QUEST_STEP",
    title: "The Trail He Left",
    summary: "Tino was already looking for something. He had been for nine years, and he never said a word.",
    status: "CANON", x: 320, y: 340,
    speakerSlug: "tino",
    body: `He was already looking for something.

That is the first thing the trail says, and it quietly rearranges every memory you have of the man. Tino did not drift into the Stormglass Cartel. He aimed at it. The enlistment, the infusion work, the sea lanes, the artifact routes — he picked the one employer on the peninsula that moves magic, and the magical, across water without paperwork, and then he spent nine years using it.

The notes are not a soldier's. They are a searcher's. Cross-referenced manifests. Auction catalogues with lots ringed in pencil. Three ciphers he taught himself badly and abandoned in order. The name of every broker on this coast who has ever moved something with a heartbeat, ranked by how recently they lied to him.

He never told you.

You shared a tent for two years and he never said one word, and the joke he made whenever anyone asked why a man that good stayed on a smuggler's payroll — you can hear it now, exactly as he said it, every single time, word for word, beat for beat.

It was rehearsed.`,
  });

  await write.node("the-captivity-arc", {
    key: "the-shape-of-the-nothing",
    kind: "SCENE",
    title: "The Shape of the Nothing",
    summary: "A second list in Tino's papers: thirty-one places where nothing was found, spaced too evenly to be chance.",
    status: "CANON", x: 320, y: 500,
    body: `There is a second list in his papers, and it is not an investigation.

It is a list of places where nothing was found. No sale. No witness. No body, no ledger line, no rumour that survives a second telling. Thirty-one of them, in a world that writes down every gram of Essence that changes hands and every creature that crosses a border in a crate.

He kept the list because he had noticed what you are noticing now. The nothing has a shape. The spacing is even. There is no pattern of profit in it — no route, no buyer, no market it feeds. Nothing taken from any of those places has ever surfaced anywhere, at any price, in nine years.

Things taken for money come back. That is what money is for.

At the bottom of the page, in the only line that is not a place name, in handwriting that has gone bad from pressing too hard:

*not a market.*

Then he stopped writing, took a contract that put him on the water off Ignit, and met you, and made you laugh, and never mentioned any of it again.`,
  });

  // Was the owner gate. The key is a frozen export identity and is never
  // renamed — the node it gated is simply written now that the call is made.
  await write.node("the-captivity-arc", {
    key: "owner-gate-the-captor",
    kind: "QUEST_STEP",
    title: "The Name on the Requisition",
    summary: "Somebody else was working the same lists, earlier and richer. Tino walked into a competitor believing he had found the culprits.",
    status: "CANON", x: 320, y: 660,
    body: `Somebody else was working the same lists.

You find them in the negative space, which is the only place a corporation is ever careless: lots withdrawn the week before auction. Brokers who retired abruptly and comfortably. Three of Tino's ringed entries already crossed out in a hand that is not his. Whoever this was moved earlier, paid more, and left exactly the kind of paperwork that exists only because a legal department insisted on it.

The name on the requisition is **[[helix-arcanobiotics]]**. Biotech-magic lab network, wholly owned beneath the [[aegis-extraction-consortium]] — infused super-soldiers on the brochure, monstrosities in the basement, and containment incidents in neither.

They were not hunting Tino. They were hunting the same thing he was, with a research budget and a procurement department, and they had been for years.

He found their operation, and he had been looking for nine years, and he was tired, and he believed what a tired man believes when the trail finally goes warm.

Nobody corrected him.`,
  });

  await write.node("the-captivity-arc", {
    key: "the-containment-site",
    kind: "QUEST_STEP",
    title: "The Containment Site",
    summary: "A Helix facility, working normally. That is the horror — none of it is improvised.",
    status: "CANON", x: 320, y: 820,
    completion: "Reach the records and read the one file that does not end.",
    body: `It is not a dungeon. It is a workplace.

There is a rota on the wall by the airlock with names on it and somebody's shift swapped in green pen. There is a kettle. There is a laminated sheet about correct lifting technique, and beneath it a second laminated sheet, in the same house font, about restraint-point load ratings for subjects exhibiting phase-four presentation.

Past that it stops being an office.

Infusion bays in two facing rows, drains in the floor sloped to a central channel because the volume made it necessary. Restraint frames that have been rebuilt more than once, each rebuild heavier than the last, the earliest bolt holes still visible where something tore free and took the wall with it. Cold storage racked floor to ceiling with what did not survive the incompatibility trials, catalogued, labelled, and — this is the part that stays with you — *kept*, because failures are data and data is worth money.

The records are worse than the room. Subject after subject, each one a person with an intake photograph, each one dosed with two, three, four incompatible Essence types on a schedule, each file ending the same way in the same three-letter abbreviation. Hundreds of them. Years of them.

And one file that does not end.

The dosing goes up and up and the file does not end. Somebody has written a query in the margin, twice, underlined the second time: *why does this one not die?*

They do not know. That is what the whole programme is for.

You have not found a prison. You have found a laboratory that has been asking one question for years, and the answer is a man you shared a tent with.`,
  });

  await write.node("the-captivity-arc", {
    key: "expected",
    kind: "SCENE",
    title: "Expected",
    summary: "A loud search arrives at a facility that has already moved what mattered.",
    status: "CANON", x: 120, y: 980,
    body: `The lights are on and the bays are empty.

Not abandoned — cleared, in order, by people who had time. Racks pulled. Cold storage stripped to the shelving. The rota still on the wall by the airlock, the kettle still warm enough to touch, and every single restraint frame unbolted and gone, which takes six people the better part of a day.

They knew. Of course they knew. You spent six weeks asking about a Stormglass infuser in front of eleven separate men whose entire trade is telling other people what they saw, and Helix has a procurement department, a security contract, and a shareholder's reason to move a valuable asset the moment somebody starts describing it in bars.

One thing is left, in the middle of the floor, deliberately, where you cannot miss it.

An intake photograph. Him. Thin, badly lit, looking just past the camera the way people do when they have been told to hold still.

They did not forget it. They left it, the way you leave a note, and the note says: *we were finished with this room anyway, and you are four months behind.*`,
  });

  await write.node("the-captivity-arc", {
    key: "you-have-been-here",
    kind: "SCENE",
    title: "You Have Been Here Before",
    summary: "The restraint frames. A party that fought The Hollow Wing recognises a room it stood in for four seconds, in the dark, under a mountain.",
    status: "CANON", x: 520, y: 980,
    body: `You stop in front of the third frame in the second row and you cannot say why.

Then you can.

The padding. It is the padding — a specific shade of grey-green vinyl, cracked at the wrist cuff and repaired with tape in a way somebody did carefully, and you have seen it before, at close range, from underneath, with a light directly above it.

Four seconds in a flooded chamber under [[draw-nine]], bleeding, standing in raw [[essence]] with something circling in the dark, and you told yourself it was the Essence, because everyone knows what raw Essence does to people who stand in it.

You have never been in this building. You have never been in this country's worth of buildings. You could walk to the airlock from here without looking up, and you know the rota is on the left-hand wall, and you know it before you check.

The small room with the two beds in it is not in this facility. You look. It is not here.

That one is somewhere else, and it is older, and whoever it belongs to has been carrying it a very long time.`,
    effects: ["The party can no longer explain the episodes as Essence exposure."],
  });

  await write.node("the-captivity-arc", {
    key: "the-cell-opens",
    kind: "ENDING",
    endingKind: "NEUTRAL",
    title: "The Cell Opens",
    summary: "The hunt has a name, a programme, and a direction. What it does not have is him — yet.",
    // No `completion` here: the database allows it only on QUEST_STEP, because
    // an ending is not a step somebody ticks off.
    status: "CANON", x: 320, y: 1140,
    body: `You leave with three things and none of them is him.

A name — [[helix-arcanobiotics]], and above them the [[aegis-extraction-consortium]], which means lawyers, subsidiaries, and eleven other sites this one was never the most important of.

A programme — hundreds of dead, a question in a margin, and a man who does not stop surviving what kills everybody else.

And a direction, which is the only one of the three that is any use.

What you do not have is an explanation for the other thing. Since the island, at the worst possible moments — mid-fight, mid-sentence, waking — there have been four or five seconds that do not belong to you. Restraint. A light directly overhead. Cold going into the arm and everything after it going wrong. And, twice now, a room with two small beds in it, which means nothing to you at all.

You had been calling it stress.

You will not be calling it that after tonight.`,
    effects: ["The party can name Helix Arcanobiotics as Tino's captor.", "The vision episodes are established as external, not stress."],
  });

  // ---------------------------------------------------------------------
  // Wiring. The file bought by asking Rook is what decides the opening.
  // ---------------------------------------------------------------------

  await write.edge("the-captivity-arc", {
    from: "the-missing-man", to: "the-trail-he-left",
    label: "Work the file",
    condition: "has-the-tino-file",
  });
  await write.edge("the-captivity-arc", {
    from: "the-missing-man", to: "start-from-a-rumour",
    label: "Work the rumour",
  });
  await write.edge("the-captivity-arc", { from: "start-from-a-rumour", to: "the-trail-he-left" });
  await write.edge("the-captivity-arc", { from: "the-trail-he-left", to: "the-shape-of-the-nothing" });
  await write.edge("the-captivity-arc", { from: "the-shape-of-the-nothing", to: "owner-gate-the-captor" });
  await write.edge("the-captivity-arc", {
    from: "owner-gate-the-captor", to: "expected",
    label: "The site has been cleared",
    condition: "the-search-was-loud",
  });
  await write.edge("the-captivity-arc", {
    from: "owner-gate-the-captor", to: "the-containment-site",
    label: "The site is still running",
  });
  await write.edge("the-captivity-arc", { from: "expected", to: "the-cell-opens" });
  // The payoff for [[the-hollow-wing]]. A party that took a bounty in a mine
  // under the peninsula stood in this room for four seconds, in the dark, and
  // had no way to know it. This is where that comes back.
  await write.edge("the-captivity-arc", {
    from: "the-containment-site", to: "you-have-been-here",
    label: "You have stood in this room before",
    condition: "the-first-vision",
  });
  await write.edge("the-captivity-arc", { from: "the-containment-site", to: "the-cell-opens", label: "Take what you can carry and go" });
  await write.edge("the-captivity-arc", { from: "you-have-been-here", to: "the-cell-opens" });
  await write.retireEdge("the-captivity-arc", "the-containment-site", "the-cell-opens", null,
    "the branch is labelled now that the site offers a second route for a party carrying the first vision");

  // The scaffold's own routes. Each is replaced by a branch that carries the
  // decision the gate was waiting on; left in place they would be unlabelled
  // shortcuts straight past the scenes that do the work.
  await write.retireEdge("the-captivity-arc", "the-missing-man", "the-trail-he-left", null,
    "the opening now branches on whether the party bought the file by asking Rook");
  await write.retireEdge("the-captivity-arc", "the-trail-he-left", "owner-gate-the-captor", null,
    "the trail now runs through the second list, which is where the deeper thing shows");
  await write.retireEdge("the-captivity-arc", "owner-gate-the-captor", "the-containment-site", "Approve the captivity premise",
    "the owner gate is answered; the branch is now whether the site was warned");

  write.report(apply ? "The Captivity Arc — APPLYING" : "The Captivity Arc — dry run");
}

main().then(() => db.$disconnect(), (error) => { console.error(error); return db.$disconnect().then(() => process.exit(1)); });
