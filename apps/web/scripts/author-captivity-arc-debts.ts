import "../lib/environment";
import { randomUUID } from "node:crypto";
import { getPrismaClient } from "@habitat/db/client";
import { BoardWriter, type EdgeSpec, type NodeSpec } from "./lib/story-authoring";
import { CastWriter } from "./lib/story-cast";
import { LineWriter, c, r, type LineSet } from "./lib/story-lines";

/**
 * THE CAPTIVITY ARC — the debts come due, and the room gets a voice.
 *
 * The arc's spine was already right: nobody is looking for Tino, the trail is
 * nine years old and pointed somewhere else, the watch lies, the requisition
 * has a name on it, the containment site is a workplace. What it lacked was
 * connective tissue and speech — three lines in twelve cards, no region, and an
 * opening that only remembered one thing the party did in Arcadia.
 *
 * This pass (2026-09-05):
 *   - files the arc to port-arcadia, where it opens;
 *   - gives the opening Rook's voice, and three new roads in, one per creditor
 *     from binding-in-arcadia: the Army's contract buys the Bureau's query log,
 *     the Directorate sells back one page of Pearl's beachhead log, the Cartel
 *     opens Tino's locker. All three arrive at the trail he left;
 *   - fixes a canon slip — the rumour route bought its lead in Shattermarket,
 *     which is at the bottom of the sea;
 *   - puts the intake recording in the containment site, so the file that does
 *     not end has a voice on it, and marks the watch's three questions as
 *     spoken player lines.
 *
 * Nothing here touches the reveal's discipline: Helix is named where it was
 * already named, the visions stay unexplained, and TINO_KNOWN_STATUS stays
 * MISSING through the-cell-opens exactly as before.
 *
 *   pnpm --filter @habitat/web exec tsx scripts/author-captivity-arc-debts.ts
 *   pnpm --filter @habitat/web exec tsx scripts/author-captivity-arc-debts.ts --apply
 */

const db = getPrismaClient();
const apply = process.argv.includes("--apply");
const ARC = "the-captivity-arc";

// ------------------------------------------------------------------ the board

const nodes: NodeSpec[] = [
  {
    key: "the-missing-man", kind: "QUEST_START",
    title: "The Missing Man",
    summary: "Nobody is looking for Tino, and Rook tells the party so, because Rook is the one who struck him off. Whatever the party carries — a file, a rumour, a debt somebody owes them — is the entire search.",
    body: `Nobody is looking for [[tino]].

Rook says it, in a room in [[port-arcadia]] with a Cartel seal on the door, because Rook is the one who struck him off. Payroll, ration strength, the register at a Core that is now on the sea floor — he is on none of it, and the [[stormglass-cartel]] does not send people after a name that is not on a list. The war has a shape and he is not in it. Kestrel is a wreck. Ignit is a smoke column on a chart and a line item in three separate insurance disputes. The Directorate has forty thousand names in worse condition and a budget that runs out in March.

Rook does not soften it. Rook also says, in the same voice, that this is not the same as telling the party to stop.

You are it. Whatever you have is the entire search.

**A file**, if you bought one — by asking Rook one question on the worst night of the war, or by paying two scouts for a road that stopped in open ground. **A rumour**, if you did not. **Or a debt.** Somebody in this city paid for the door you walked through at [[the-lamp-chapel]], and the people who pay for doors in Arcadia keep records, and every one of the party's possible creditors is sitting on something that touches the man nobody is looking for. The Army's intelligence net was said to know what hunts like the thing that took him. The Directorate has Pearl's paper. The Cartel has a locker with his name on it.

[[nag]] says the party has been wearing the same socks for four days. It has said this several times. It has never once said anything about him.

Start.`,
  },
  {
    key: "the-query-log", kind: "SCENE", x: 260, y: -300,
    title: "Who Queried the Face",
    summary: "The Army's contract buys one thing from the Bureau: the record of who ran Tino's face through the lattice the week before Ignit fell. The requester is a client code. The nine years underneath it are a trail.",
    body: `The [[peninsula-expeditionary-army]] keeps its promises to people who keep theirs, and the promise it keeps tonight is a room in the [[drone-surveillance-bureau]] with the blinds down and an analyst who sells blind spots like real estate.

The Army's contract paid for exactly one query, and the officer who walks the party in says so, so that nobody mistakes it for a favour.

**Somebody ran Tino's face through the lattice the week before Ignit fell.** Not a state query — the analyst is clear about that, because state queries are logged under a ministry and this one is logged under a client code that has been redacted from her, which means it was redacted from everybody, which means it cost more than the building she is sitting in. She does not know who. She knows the shape of who: somebody with a procurement department and a legal department and the kind of money that buys silence from an institution whose whole product is watching.

The query returned nine years.

That is what the party leaves with. Not the requester — the requester is a code — but what the requester bought: every camera on the coast that ever saw a Stormglass infuser standing somewhere he had no work reason to be standing. Auction houses. Brokers' doors. A dock in [[the-southside]] at three in the morning, twice a year, for nine years. The Bureau sold it to a client before the island fell, and tonight it sells it to the Army, and the Army hands it to the party as a printout with the client code blacked out in a hand that was not careful enough to hide that it was blacked out.

He was already looking for something. The lattice watched him do it.`,
    effects: ["The Army's contract is called in: the party has the Bureau's record of Tino's movements over nine years, and knows a redacted client queried his face the week before Ignit fell."],
  },
  {
    key: "the-buyers-copy", kind: "SCENE", x: 260, y: -150,
    title: "The Word Was Specimen",
    summary: "The Directorate sells the party back one page of Pearl's beachhead log: a corporate client's recovery sorties flown east of the Quarry under Pearl safe passage in the week the island fell, and the cargo logged as specimens.",
    body: `The Directorate's man with the case has one page for the party, and a price for it, and the price is not money.

It is a page from Tropic Pearl's beachhead log — the archive the party handed over on the quay for a platform — and the man reads it aloud rather than handing it over, because the [[national-defense-directorate]] sells its paper one page at a time and never lets go of the paper.

**Safe passage, granted.** In the week the island fell, Pearl's field command at [[pearl-beachhead]] cleared a corporate client's aircraft to fly recovery sorties east of the [[stormglass-quarry]] — over ground Pearl did not hold and did not want, toward the breach-scarred country where the war's two armies both quietly routed around a forest neither could hold ([[the-riftwood-breach]]). The client is a code. The manifest column for the cargo says *specimens*. There are three sorties, and the third one's cargo weight is entered by hand, after the fact, and is the weight of one man.

The Directorate does not know who the client is. The man says this plainly and the party believes him, because a state that knew would be selling that instead. What the Directorate knows is that somebody paid Pearl for the right to work an island Pearl was in the middle of buying, and that the thing they were working for was not the island.

Nobody in the room says the obvious thing, which is that a trail across open ground stops where something with wings picks it up.

He was already looking for something. So was somebody else, with a budget.`,
    effects: ["The Directorate's price is paid: the party knows a coded corporate client flew recovery sorties east of the Quarry under Pearl safe passage in the week Ignit fell, and logged its cargo as specimens."],
  },
  {
    key: "the-back-pay-locker", kind: "SCENE", x: 260, y: 0,
    title: "Nine Years of Back Pay",
    summary: "The Cartel calls in its advance: the party's Ignit story, told the Cartel's way, in exchange for the locker in the back of the Waterfront house with a dead man's name on it. He never drew a wage in nine years. It is all in there.",
    body: `The [[stormglass-cartel]]'s factor wants the story now, and the party tells it — in the shape the Cartel wants, which is a shape with a hero in it and no Pearl casters and nothing under the streets. Okafor tells most of it. She is very good at a shape.

Then the factor opens the locker.

It is in the back of the bonded warehouse on the [[waterfront-district]], one of a row, with a name on a card in a brass slot, and the factor mentions as he turns the key that the man never once drew his back pay in nine years on the books — not a wage, not an advance, not a ration chit cashed on the mainland. Nobody draws nothing for nine years unless they are saving for something or hiding from it. The factor says this the way a clerk says things, without meaning it to land, and it lands on Okafor, who says nothing, and on the party, who have just been told exactly what the boat and the cold beer were.

Inside: a soldier's effects, and a searcher's.

A spare rig manifold, wrapped. A photograph the party does not understand yet of two people laughing at something off-camera, and a woman in it with red hair. Auction catalogues with lots ringed in pencil. Cross-referenced manifests. Three ciphers taught badly and abandoned in order. The name of every broker on this coast who has ever moved something with a heartbeat, ranked by how recently they lied to him. And, under all of it, in the hand that has gone bad from pressing too hard, a second list.

Nine years of a man's actual life, in a locker, behind a story about cold beer that he told word for word, beat for beat, every single time.

The factor gives the party a receipt for it. The Cartel keeps records.`,
    effects: ["The Cartel's advance is called in: the party has told its Ignit story the Cartel's way, and holds nine years of Tino's own papers out of the Waterfront locker."],
  },
  {
    key: "start-from-a-rumour", kind: "QUEST_STEP",
    title: "Start From a Rumour",
    summary: "Without a file or a creditor's paper, the party works a route somebody built to be run — through the Southside's brokers — and gets seen doing it.",
    body: `You never asked Rook, and nobody in this city owes you a page, so you start where everyone starts: a name in a bar, sold twice before it reached you.

Six weeks. A boat you paid for, up the coast and back for nothing. A broker in [[the-southside]] who described the infuser well enough to be believed, and who had — it emerges, later, expensively — described him to three other buyers first. A dead zone under a dampening footprint where a woman with a ledger told you, for a price, the one thing in it that was true, and let you pay for the four that were not.

By the time you understand that you have been running a route somebody built to be run, you have spent money you needed, burned a contact you cannot replace, and put your faces in front of seven people whose entire trade is telling other people what they saw.

That last part does not stay local. [[drone-surveillance-bureau]] queries are cheap for people with the right requester code, and somebody has one, and your faces have been on a lattice since the quay.

The trail is still there. You are simply on it late, loud, and known — and the people at the end of it read the same reports you do.`,
    effects: ["set flag: the-search-was-loud"],
    completion: "Buy the rumour, run the route, and arrive at the trail six weeks late and known to everyone on it.",
  },
];

const edges: EdgeSpec[] = [
  { from: "the-missing-man", to: "the-query-log", label: "Call in the Army's contract", condition: "owes-the-army",
    effects: ["The Army pays for one Bureau query and hands the party the printout; the party's first tasking is now real."] },
  { from: "the-missing-man", to: "the-buyers-copy", label: "Call in the Directorate's price", condition: "sold-the-pearl-archive",
    effects: ["The Directorate reads the party one page of Pearl's beachhead log and keeps the page."] },
  { from: "the-missing-man", to: "the-back-pay-locker", label: "Call in the Cartel's advance", condition: "owes-the-cartel",
    effects: ["The party tells the Cartel its Ignit story in the Cartel's shape, and the factor opens the locker."] },
  { from: "the-query-log", to: "the-trail-he-left" },
  { from: "the-buyers-copy", to: "the-trail-he-left" },
  { from: "the-back-pay-locker", to: "the-trail-he-left" },
  // The watch's three questions are spoken player lines.
  { from: "ask-it-anything", to: "four-words", label: "Where is he?", voiced: true,
    effects: ["NAG answers with the same four words; the party asked the obvious question and moved on."] },
  { from: "ask-it-anything", to: "four-words", label: "Is he alive?", voiced: true,
    effects: ["NAG answers with the same four words; nothing in the room confirms he is alive, dead, held, or anywhere."] },
  { from: "ask-it-anything", to: "four-words", label: "How long has it been?", voiced: true,
    effects: ["NAG answers with the same four words — to the one question a watch could answer to a hundredth of a second. The lie is on the record."] },
];

const links: Array<{ node: string; slugs: string[] }> = [
  { node: "the-missing-man", slugs: ["tino", "what-the-player-knows-about-tino", "the-kestrel-commander", "stormglass-cartel", "port-arcadia", "the-lamp-chapel", "nag", "peninsula-expeditionary-army", "national-defense-directorate"] },
  { node: "the-query-log", slugs: ["peninsula-expeditionary-army", "drone-surveillance-bureau", "the-bureau-analyst", "tino", "the-southside", "owes-the-army"] },
  { node: "the-buyers-copy", slugs: ["national-defense-directorate", "tropic-pearl-trade-house", "pearl-beachhead", "stormglass-quarry", "the-riftwood-breach", "tino", "sold-the-pearl-archive"] },
  { node: "the-back-pay-locker", slugs: ["stormglass-cartel", "waterfront-district", "the-kestrel-quartermaster", "tino", "amanda", "field-infusion-rig", "owes-the-cartel"] },
  { node: "start-from-a-rumour", slugs: ["tino", "the-southside", "drone-surveillance-bureau", "the-search-was-loud"] },
];

// --------------------------------------------------------------- the dialogue

const ROOK = c("the-kestrel-commander");
const OKAFOR = c("the-kestrel-quartermaster");
const NAG = c("nag");
const TINO = c("tino");
const ANALYST = c("the-bureau-analyst");

const lineSets: LineSet[] = [
  { arc: ARC, node: "the-missing-man", lines: [
    { number: 1, speaker: ROOK, text: "Nobody is looking for him. I want you to hear that from me, because I'm the one who struck him off. Payroll, ration strength, the Core register — he's on none of it, and the Cartel does not send people after a name that isn't on a list.", intensity: 5, emotion: ["calm", "sad"], performance: "economical; reads the answer off their faces" },
    { number: 2, speaker: ROOK, text: "That is not the same as me telling you to stop.", intensity: 5, emotion: ["calm"] },
    { number: 3, speaker: NAG, text: "You have been wearing the same socks for four days. I am not going to say it again. I am going to say it again.", intensity: 3, emotion: ["dry"], performance: "the nag; it has never once nagged about him, and nobody notices" },
    { number: 4, speaker: ROOK, text: "Whatever you've got. A file, a rumour, somebody's debt. That's the whole search. Start.", intensity: 6, emotion: ["command"] },
  ] },
  { arc: ARC, node: "the-query-log", lines: [
    { number: 1, speaker: r("expeditionary-officer"), text: "Your contract bought one query. This is it. Don't mistake it for a favour and don't ask her for a second.", intensity: 4, emotion: ["calm"] },
    { number: 2, speaker: ANALYST, text: "Somebody ran his face through the lattice the week before your island went under. Not a ministry — a client. The client code's redacted from me, which means it's redacted from everybody, which means it cost more than this building.", intensity: 4, emotion: ["calm", "dry"], performance: "blinds down; sells blind spots like real estate and knows what this one is worth" },
    { number: 3, speaker: ANALYST, text: "I can't give you who. I can give you what they bought: nine years of where he stood when he had no work reason to be standing there. Every camera on the coast. Take the printout. Pretend you don't see where I blacked the code out.", intensity: 4, emotion: ["calm"] },
  ] },
  { arc: ARC, node: "the-buyers-copy", lines: [
    { number: 1, speaker: r("directorate-agent"), text: "Pearl's beachhead kept a safe-passage log. In the week your island went down, somebody paid Pearl to fly recovery sorties east of the Quarry. Not Pearl. A client, coded. The cargo column says specimens. Three sorties. The third weight is entered by hand.", intensity: 4, emotion: ["calm"], performance: "reading, not handing over; the Directorate never lets go of the paper" },
    { number: 2, speaker: r("directorate-agent"), text: "You sold us this. I'm reading you the part you paid for and none of the rest. We don't know who the client is. If we did, I'd be selling you that instead.", intensity: 4, emotion: ["calm", "dry"] },
  ] },
  { arc: ARC, node: "the-back-pay-locker", lines: [
    { number: 1, speaker: r("stormglass-factor"), text: "Nine years on the books and he never once drew his back pay. Not a wage, not an advance, not a chit. Nobody draws nothing for nine years unless they're saving for something or hiding from it.", intensity: 3, emotion: ["neutral"], performance: "turning the key; a clerk saying a thing without meaning it to land" },
    { number: 2, speaker: OKAFOR, text: "A boat. A piece of coast. Cold beer. He said it every time. He said it exactly the same way every time.", intensity: 3, emotion: ["sad", "calm"], performance: "to nobody, at the open locker" },
    { number: 3, speaker: r("stormglass-factor"), text: "Sign for it. The Cartel keeps records. That's rather the point of us.", intensity: 3, emotion: ["dry"] },
  ] },
  { arc: ARC, node: "the-trail-he-left", lines: [
    { number: 1, speaker: TINO, text: "Why do I stay? Pension. Stormglass has a pension. You laugh — show me another outfit on this coast that'll pay a man to stand on a boat and not ask what he's looking at.", intensity: 4, emotion: ["dry", "amused"], performance: "remembered; the joke he made every single time, word for word, beat for beat — rehearsed" },
  ] },
  { arc: ARC, node: "owner-gate-the-captor", lines: [
    { number: 1, speaker: OKAFOR, text: "That is a legal department's hand. Nobody writes a requisition like that unless somebody made them, and nobody makes them unless the thing being requisitioned could end up in a courtroom.", intensity: 4, emotion: ["calm", "contempt"], performance: "reading the paperwork that exists only because somebody insisted on it" },
  ] },
  { arc: ARC, node: "the-containment-site", lines: [
    { number: 1, speaker: r("helix-intake-recording"), text: "Intake. State your name for the record.", intensity: 3, emotion: ["neutral"], performance: "a recording; an intake room; a voice that has said it hundreds of times" },
    { number: 2, speaker: TINO, text: "Tino.", intensity: 3, emotion: ["dry"], performance: "recorded; badly lit; looking just past the camera" },
    { number: 3, speaker: r("helix-intake-recording"), text: "Occupation.", intensity: 3, emotion: ["neutral"] },
    { number: 4, speaker: TINO, text: "Late.", intensity: 3, emotion: ["dry", "amused"], performance: "recorded; the joke lands on nobody in the room and on everybody listening to it years later" },
    { number: 5, speaker: r("helix-intake-recording"), text: "Dose history does not match presentation. Flag for the director.", intensity: 3, emotion: ["neutral"], performance: "recorded; the first time anybody at Helix noticed" },
  ] },
];

const containmentAppendix = `**And the recordings.** Every intake has one, because failures are data and data is worth money, and his is in the rack with the others, catalogued by number. Play it and the room gets a voice: a tired clerk asking for a name for the record, and a man badly lit and looking just past the camera giving it, and being asked his occupation, and saying *late*. Nobody in that room laughed. Somebody in this one does, once, and it is the worst sound the party has made since the island. The last line on the intake is the clerk's, flat, reading a result off a sheet: dose history does not match presentation, flag for the director. It is the first time anybody at [[helix-arcanobiotics]] noticed. It is not the last, and it does not settle a single thing the party needs settled ([[what-the-player-knows-about-tino]]): a recording proves a man was in a room on a date, and nothing after it.`;

// ------------------------------------------------------------------------- run

async function main() {
  const identity = (await db.$queryRawUnsafe<{ current_database: string }[]>("select current_database()"))[0]?.current_database;
  const actor = await db.user.findFirst({ where: { role: "ADMIN", isActive: true }, orderBy: { id: "asc" }, select: { id: true } });
  if (!actor) throw new Error("Authoring requires an active administrator for revision authorship.");
  LineWriter.validate(lineSets);

  const writer = new BoardWriter(db, actor.id, apply);
  const lines = new LineWriter(db, actor.id, apply);
  const cast = new CastWriter(db, actor.id, apply);
  const notes: string[] = [];

  // 1. The arc opens in Port Arcadia. It had no region at all.
  const arc = await db.storyArc.findUnique({ where: { slug: ARC }, select: { id: true, regionEntryId: true, lockedAt: true } });
  const arcadia = await db.storyEntry.findUnique({ where: { slug: "port-arcadia" }, select: { id: true } });
  if (!arc || !arcadia) throw new Error("the-captivity-arc or port-arcadia is missing.");
  if (arc.lockedAt) throw new Error("the-captivity-arc is locked; unlock it before authoring into it.");
  if (arc.regionEntryId !== arcadia.id) {
    notes.push("file the-captivity-arc to port-arcadia");
    if (apply) {
      await db.storyArc.update({ where: { id: arc.id }, data: { regionEntryId: arcadia.id } });
      await db.storyRevision.create({ data: { id: randomUUID(), entityType: "ARC", entityId: arc.id, arcId: arc.id, action: "UPDATED", actorUserId: actor.id, summary: "Filed the story to port-arcadia — the search opens in the city the party bound in." } });
    }
  }

  // 2. The analyst speaks for the first time.
  await cast.canonise({
    slug: "the-bureau-analyst", fullName: "Wren Adeyemi",
    involvement: [{ ref: ARC, kind: "ARC", how: "Sells the Army one query: who ran Tino's face through the lattice the week before Ignit fell, and the nine years underneath it." }],
  });

  // 3. The board.
  for (const node of nodes) await writer.node(ARC, node);
  for (const edge of edges) await writer.edge(ARC, edge);
  for (const entry of links) await writer.links(ARC, entry.node, entry.slugs);

  // 4. The containment site keeps its prose and gains the recording.
  const site = await db.storyNode.findUnique({ where: { arcId_key: { arcId: arc.id, key: "the-containment-site" } }, select: { id: true, body: true, title: true } });
  if (!site) throw new Error("the-containment-site is missing.");
  if (!(site.body ?? "").includes("**And the recordings.**")) {
    writer.changes.push({ kind: "node", action: "update", label: `${ARC}/the-containment-site`, detail: "appended the intake recording" });
    if (apply) {
      await db.storyNode.update({ where: { id: site.id }, data: { body: `${(site.body ?? "").trimEnd()}\n\n${containmentAppendix}`, updatedByUserId: actor.id, version: { increment: 1 } } });
      await db.storyRevision.create({ data: { id: randomUUID(), entityType: "NODE", entityId: site.id, arcId: arc.id, action: "UPDATED", actorUserId: actor.id, summary: `Gave "${site.title}" the intake recording` } });
    }
  } else {
    writer.changes.push({ kind: "node", action: "unchanged", label: `${ARC}/the-containment-site` });
  }

  await writer.arcFields(ARC, {
    summary: "The mainline hunt for Tino after Ignit, opening in Port Arcadia with the one fact that matters: nobody else is looking. The party works whatever it carries, the island's file, a Southside rumour, or a debt called in from whoever paid for its binding, and every road reaches the same locker of papers: a man who searched for nine years and never said. The trail points somewhere else, the watch lies, a requisition has a name on it. The party leaves with a name and a direction. Not him.",
  });

  // 5. The lines.
  for (const set of lineSets) await lines.write(set);

  writer.report(apply ? "The Captivity Arc — APPLYING" : "The Captivity Arc — dry run");
  lines.report("Lines");
  cast.report("Cast");
  console.log(`\narc: ${notes.length ? notes.join("; ") : "already filed"}`);
  console.log(`database: ${identity}  mode: ${apply ? "APPLY" : "PREVIEW"}`);
}

main().catch((error) => { console.error(error); process.exit(1); }).finally(() => db.$disconnect());
