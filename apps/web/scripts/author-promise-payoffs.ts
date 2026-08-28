import "../lib/environment";
import { getPrismaClient } from "@habitat/db/client";
import { BoardWriter } from "./lib/story-authoring";

/**
 * Pays off the six planted promises.
 *
 *   pnpm --filter @habitat/web exec tsx scripts/author-promise-payoffs.ts [--apply]
 *
 * Six flags were planted in the prologue and the Evacuation and never once
 * checked: the party asked Commander Rook about Tino, held Kestrel or took the
 * boats, and loaded the wounded, the munitions, or the archives and prisoners.
 * Real decisions, recorded in the save, and the world never noticed.
 *
 * A flag is CHECKED when its slug appears in an edge's `condition`. Binding in
 * Arcadia already had prose conditions — "The party defended Forward Camp
 * Kestrel" — which read correctly to a human and counted for nothing, which is
 * why the ledger showed six promises planted and zero answered.
 *
 * This lands three things:
 *  - the two road conditions start naming their flags, so the branch that was
 *    always there is finally a payoff on the ledger;
 *  - the manifest becomes the opening state of Act I, three ways, each with a
 *    different price and a different set of people who watched you choose;
 *  - asking about Tino becomes the first line of a file that does not exist
 *    yet — the thread the Captivity Arc picks up.
 */
const db = getPrismaClient();

async function main() {
  const apply = process.argv.includes("--apply");
  const actor = await db.user.findFirst({ where: { role: "ADMIN", isActive: true }, orderBy: { id: "asc" }, select: { id: true } });
  if (!actor) throw new Error("Authoring requires an active administrator for revision authorship.");
  const write = new BoardWriter(db, actor.id, apply);

  // ---------------------------------------------------------------------
  // The manifest comes due.
  // ---------------------------------------------------------------------

  await write.node("binding-in-arcadia", {
    key: "what-the-city-is-owed",
    kind: "CHOICE",
    title: "What the City Is Owed",
    summary: "Arcadia reads the manifest aloud and decides what kind of arrival this was.",
    x: 320, y: 420,
    body: `Port Arcadia does not ask what you survived. It asks what you brought.

A harbour clerk reads the manifest aloud on the wet stone in a voice with no weather in it — crates, headcount, tonnage, names where there are names — and the city decides, right there, in the time it takes to read a list, what kind of arrival this was.

Everyone from the boats is standing close enough to hear it.`,
  });

  await write.edge("binding-in-arcadia", { from: "military-docks", to: "what-the-city-is-owed" });
  // The docks used to run straight to the Forge search. Left in place, the
  // manifest would be optional scenery the player could walk past — and the
  // manifest is the one thing the Evacuation road actually decided.
  await write.retireEdge("binding-in-arcadia", "military-docks", "find-the-soul-forge", null, "the route now runs through the manifest coming due");

  await write.node("binding-in-arcadia", {
    key: "the-ones-who-lived",
    kind: "QUEST_STEP",
    title: "The Ones Who Lived",
    summary: "The wounded came first. Arcadia has no interest in that, and sixty-three people do.",
    x: 120, y: 560,
    body: `Ninety-one wounded came off the boats breathing. Sixty-three are still breathing at dawn, which the surgeons call a good night and nobody else does.

What you do not have is cargo. No powder, no stores, no intelligence, no prisoners — nothing Port Arcadia wants, from a city that has stopped pretending it wants anything else. Berth, water, powder, a roof, a surgeon's hour: all of it priced, and you are paying in labour and time you cannot spare, because every one of you is still bound to a machine at the bottom of the sea and the next death any of you take is the last one.

What you do have is sixty-three people who watched you choose, and they talk. In a city where nobody knows your name yet that is worth something.

It is just not worth money, and Arcadia only counts money.`,
    effects: ["The Kestrel wounded survive into Act I and speak for the party."],
  });

  await write.node("binding-in-arcadia", {
    key: "the-army-is-interested",
    kind: "QUEST_STEP",
    title: "The Army Is Interested",
    summary: "You came off the water armed. The Expeditionary Army offers a road, and the dockside keeps its own ledger.",
    x: 320, y: 560,
    body: `You came off the water armed. Kestrel's powder, four crew-served pieces, and enough stores to keep them fed — the Peninsula Expeditionary Army counts it twice, then counts you, and offers a road to the Forge before the tide turns.

The road runs through service. They say so plainly, which is nearly a courtesy.

The other column of the ledger gets read too. The wounded went in the second boats, or they went in no boat at all, and enough of them did not go that the survivors have sorted themselves into two groups on the dockside without anyone organising it. One group will not look at you.

A signals corporal from Kestrel's own section — right arm ending above the elbow, dressing already grey — waits until you are close enough that she does not have to raise her voice, and tells you exactly what she thinks of the arithmetic. She is not wrong. That is the part that stays.`,
    effects: ["The Expeditionary Army opens a service route to the Forge.", "Kestrel's surviving wounded hold the party responsible."],
  });

  await write.node("binding-in-arcadia", {
    key: "leverage-and-liability",
    kind: "QUEST_STEP",
    title: "Leverage and Liability",
    summary: "Pearl's archive and eleven live prisoners make the party the most interesting thing in the city.",
    x: 520, y: 560,
    body: `Tropic Pearl's operational archive and eleven of their people — alive, roped, and worth more that way — come off your boats onto a dock owned by a state that would dearly like both.

By evening you have three offers and a warrant. The Directorate wants the archive and will trade Forge access for it. The Drone Surveillance Bureau wants the same archive quietly, and pays better for quiet. Pearl wants their people back and has already put money on a table in a room you have not been invited to, for whoever takes them off you first.

You are the most interesting thing in Port Arcadia. Interesting is not the same as safe, and every one of you still dies for good.

The wounded you did not put first are a separate ledger. It is not presented tonight. It is presented later, by people who kept a list, at the worst possible moment — because that is when lists get read.`,
    effects: ["The Pearl archive and prisoners become Act I political leverage.", "The party is marked by Pearl, the Directorate, and the Bureau."],
  });

  // The payoff. Each branch names its flag, which is what puts it on the ledger.
  await write.edge("binding-in-arcadia", {
    from: "what-the-city-is-owed", to: "the-ones-who-lived",
    label: "You carried people",
    condition: "manifest-wounded-first",
  });
  await write.edge("binding-in-arcadia", {
    from: "what-the-city-is-owed", to: "the-army-is-interested",
    label: "You carried the guns",
    condition: "manifest-munitions-first",
  });
  await write.edge("binding-in-arcadia", {
    from: "what-the-city-is-owed", to: "leverage-and-liability",
    label: "You carried what Pearl could not afford to lose",
    condition: "manifest-archives-and-prisoners",
  });
  for (const from of ["the-ones-who-lived", "the-army-is-interested", "leverage-and-liability"]) {
    await write.edge("binding-in-arcadia", { from, to: "find-the-soul-forge" });
  }

  // ---------------------------------------------------------------------
  // The two roads, finally counted as the payoff they always were.
  // ---------------------------------------------------------------------

  await write.edge("binding-in-arcadia", {
    from: "arcadia-landfall", to: "storm-beach",
    label: "Defend road — survive the storm beach",
    condition: "defended-the-island — the party held Forward Camp Kestrel",
  });
  await write.edge("binding-in-arcadia", {
    from: "arcadia-landfall", to: "military-docks",
    label: "Evacuation road — clear the military docks",
    condition: "fled-the-island — the party took the boats",
  });

  // ---------------------------------------------------------------------
  // Asking about Tino. The smallest promise, and the one that starts a quest.
  // ---------------------------------------------------------------------

  await write.flag(
    "has-the-tino-file",
    "Has the Tino File",
    "The party left Port Arcadia holding the first verified facts about Tino's disappearance. Bought by asking Rook one question on the island; checked when The Captivity Arc opens.",
    `What the party actually carries out of Port Arcadia: three facts and no theory.

Tino was not on the beach. He was not in the boats. He was not among Kestrel's dead, and Kestrel counted its dead twice.

That is the whole file. It is worthless to anyone else and it is the only reason the search starts from evidence instead of from a rumour — which is the difference between an investigation and a wish. Planted in [[binding-in-arcadia]] at "The One Who Asked", and only reachable by a party that set [[asked-about-tino]] in the prologue.

A party that never asked still goes looking. They just start from nothing, and the world can tell.`,
  );

  await write.node("binding-in-arcadia", {
    key: "the-one-who-asked",
    kind: "SCENE",
    title: "The One Who Asked",
    summary: "A Kestrel survivor recognises the party — not by face, by question.",
    x: 620, y: 720,
    body: `Somewhere in the Forge search a Kestrel survivor places you. Not your face. Your question.

"You're the one who asked Rook about the infuser." A pause that runs a beat too long for comfort. "Nobody else did."

They do not have an answer. What they have is an absence, and they have carried it since the island because nobody else wanted it. Tino was not on the beach. He was not in the boats. He was not among the dead, and Kestrel counted its dead twice, because on that last night Kestrel had nothing else to do.

A man does not become nothing.

Write it down. It is the first line of a file that does not exist yet, and it exists at all because somebody in your party thought to ask a busy commander one question about one infuser on the worst night of the war.`,
    // Not a re-set of asked-about-tino — that was planted on the island and
    // does not need planting twice. This is the thing the asking BOUGHT, and
    // The Captivity Arc opens differently depending on whether you hold it.
    effects: ["set flag: has-the-tino-file"],
  });

  await write.edge("binding-in-arcadia", {
    from: "find-the-soul-forge", to: "the-one-who-asked",
    label: "Follow the survivor who remembers the question",
    condition: "asked-about-tino",
  });
  await write.edge("binding-in-arcadia", { from: "the-one-who-asked", to: "bind-to-arcadia" });
  // The Forge search now splits two ways, so the branch that skips the
  // survivor needs choice text of its own — an unlabelled sibling is a branch
  // the game cannot offer and the player cannot tell apart.
  await write.edge("binding-in-arcadia", { from: "find-the-soul-forge", to: "bind-to-arcadia", label: "Go straight to the Forge" });
  await write.retireEdge("binding-in-arcadia", "find-the-soul-forge", "bind-to-arcadia", null,
    "the branch is labelled now that the Forge search offers a second route");

  write.report(apply ? "Promise payoffs — APPLYING" : "Promise payoffs — dry run");
}

main().then(() => db.$disconnect(), (error) => { console.error(error); return db.$disconnect().then(() => process.exit(1)); });
