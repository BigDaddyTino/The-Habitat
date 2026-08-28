import "../lib/environment";
import { getPrismaClient } from "@habitat/db/client";
import { BoardWriter } from "./lib/story-authoring";

/**
 * Gives the Defend branch the decision the Evacuation branch has.
 *
 *   pnpm --filter @habitat/web exec tsx scripts/author-kestrel-east-road.ts [--apply]
 *
 * The Last Days of Kestrel was a corridor: six scenes, five edges, no branches
 * and no flags. The player who chose the harder road got FEWER decisions than
 * the one who took the boats, whose manifest choice now lands three different
 * ways in Port Arcadia.
 *
 * The choice was already written into the prose and never wired. From
 * `the-dead-do-not-wait`: "along the east road, exactly where the commander
 * promised, there is a trail: torn metal, drag marks, and sign that whatever
 * hit the party's vehicle was not hunting alone."
 *
 * So the Defend road gets its own answer to `asked-about-tino`. One road buys
 * the file by asking a busy commander a question. The other buys it by sending
 * the camp's last scouts east while the wall is short-handed, and paying for
 * it in people who had names.
 *
 * GAP DISCIPLINE. The trail establishes selection and numbers — one man taken,
 * nothing else taken, and more than one thing doing the taking. It does not
 * establish who, why, where, or whether he is alive. Kestrel's own Forge is
 * explicitly no help: `what-the-player-knows-about-tino` says its Core holds
 * none of his Echo, so it cannot be asked.
 */
const db = getPrismaClient();

async function main() {
  const apply = process.argv.includes("--apply");
  const actor = await db.user.findFirst({ where: { role: "ADMIN", isActive: true }, orderBy: { id: "asc" }, select: { id: true } });
  if (!actor) throw new Error("Authoring requires an active administrator for revision authorship.");
  const write = new BoardWriter(db, actor.id, apply);

  await write.flag("walked-the-east-road", "Walked the East Road",
    "The party spent Kestrel's last scouts following the trail of what took Tino, and the wall was short-handed for it.",
    `Set in [[the-last-days-of-kestrel]]. Checked in [[binding-in-arcadia]].

The Defend road's counterpart to [[asked-about-tino]]: both routes can reach [[has-the-tino-file]], one by asking [[the-kestrel-commander]] a question at the operations table and one by walking east with people who were needed somewhere else.

The cost is not abstract. Kestrel was already short. Two of the scouts do not come back, and the positions they were holding are held by somebody else that night, and the survivors who reach the storm beach are fewer by a number the party can count.`);

  // ---------------------------------------------------------------------

  await write.node("the-last-days-of-kestrel", {
    key: "the-dead-do-not-wait",
    kind: "CHOICE",
    title: "The Trail Goes East",
    summary: "The scouts went out to count Pearl armour and came back with the one thing nobody asked for.",
    status: "CANON", x: 320, y: 320,
    body: `The scouts go out to count Pearl armor and come back counting something else. Impact craters that should be cold are moving at the edges. Contamination drifts against the wind. Positions Pearl overran days ago stand empty now — not abandoned. Emptied.

And along the east road, exactly where the commander promised, there is a trail: torn metal, drag marks, and sign that whatever hit the party's vehicle was not hunting alone.

It is nine hours old and it is going somewhere.

Following it is not a patrol. It is four people and two days, from a camp that does not have four people or two days, in the week the wall stops being a metaphor. [[the-kestrel-commander]] will not order it and will not forbid it, which is its own kind of answer, and says the only useful thing anybody says about it out loud:

"He'd go. That's not the same as it being smart."

The wall does not care what you decide. It only counts who is standing on it.`,
  });
  await write.links("the-last-days-of-kestrel", "the-dead-do-not-wait", ["the-kestrel-commander", "tino", "something-under-the-war", "the-risen"]);

  await write.node("the-last-days-of-kestrel", {
    key: "what-the-road-held",
    kind: "QUEST_STEP",
    title: "What the Road Held",
    summary: "Two days east. One man taken, nothing else taken, and more than one thing doing the taking.",
    status: "CANON", x: 120, y: 480,
    completion: "Follow the east road to where the trail stops, and bring back what it says.",
    body: `Two days east, and the road gives up three facts and no answers.

**One man.** The trail carries one person's weight and nobody else's. Pearl left forty-one bodies along that road in a week and the trail goes past every one of them without deviating. Whatever this was walked through a supply of easier meat for two days and did not stop.

**Not one thing.** The sign is wrong for a single animal. Gait spacing that changes and comes back. Drag marks that pause where a single hauler would have no reason to pause. At the fourth site something waited, at length, in cover, while something else worked — and the Wardens' word for that arrangement, when Mara Quill eventually reads the notes years later in another country, is *a party*.

**It stops.** Not at a lair, a camp, a crater, or a shore. It stops in the middle of open ground, in the eleventh hour of the second day, with no sign of anything landing, digging, embarking, or leaving. The trail simply ends, and the ground past it is undisturbed for as far as anyone is willing to walk.

You bring back what you can carry. Torn plate off the vehicle. A cast of the gait. The bearing, and the distance, and the hour the trail stops.

None of it says who. None of it says why. None of it says he is alive, and — this is the part that does the damage on the walk home — none of it says he is dead either. Kestrel's own Forge is no help; his Echo is not in it and never was, so the machine that could settle this for anybody else in the camp has nothing to say about him at all.

What you are carrying back is a file. It is a good file. It is the first honest evidence anybody will ever have, and it fits in a satchel, and it cost two scouts.`,
    effects: ["set flag: has-the-tino-file", "set flag: walked-the-east-road"],
  });
  await write.links("the-last-days-of-kestrel", "what-the-road-held", ["tino", "what-the-player-knows-about-tino", "the-soul-forge"]);

  await write.node("the-last-days-of-kestrel", {
    key: "held-the-wire",
    kind: "QUEST_STEP",
    title: "Held the Wire",
    summary: "Nobody goes east. The camp is four people stronger for it, and the road keeps whatever it was holding.",
    status: "CANON", x: 520, y: 480,
    completion: "Keep the scouts on the wire and finish the reconnaissance the camp actually needs.",
    body: `Nobody goes east.

It is the correct decision and everybody involved knows it, which is why it is made quickly and why nobody feels good about it. Four scouts and two days, out of a camp counting both, against a trail that is already nine hours cold and belongs to one man who is already gone.

So the scouts stay on the wire, and the reconnaissance the camp actually needs gets done: Pearl's armour counted properly, the north approach walked twice, two firing positions resited before the assault instead of after it.

That work shows up on the wall. Not as a feeling — as arithmetic. Positions that hold. A flank that is watched. People who are alive on the beach later specifically because four experienced scouts spent the last week doing their actual jobs.

The trail goes cold. Nobody ever walks it. Whatever it was going to say, it says to nobody, and the east road keeps it.

Somebody raises it once more, on the last night, and [[the-kestrel-commander]] does not let the conversation start.`,
    effects: ["The camp reaches the last stand at full reconnaissance strength."],
  });
  await write.links("the-last-days-of-kestrel", "held-the-wire", ["the-kestrel-commander", "forward-camp-kestrel"]);

  await write.edge("the-last-days-of-kestrel", {
    from: "the-dead-do-not-wait", to: "what-the-road-held",
    label: "Send the scouts east",
    effects: ["Two scouts do not come back, and the wall is short for the assault."],
  });
  await write.edge("the-last-days-of-kestrel", {
    from: "the-dead-do-not-wait", to: "held-the-wire",
    label: "Keep everyone on the wire",
    effects: ["The camp keeps its reconnaissance and the trail goes cold forever."],
  });
  await write.edge("the-last-days-of-kestrel", { from: "what-the-road-held", to: "the-long-nights" });
  await write.edge("the-last-days-of-kestrel", { from: "held-the-wire", to: "the-long-nights" });
  await write.retireEdge("the-last-days-of-kestrel", "the-dead-do-not-wait", "the-long-nights", null,
    "the east road is a decision now, and both routes rejoin at the long nights");

  // ---------------------------------------------------------------------
  // Arcadia notices. The storm beach is where the Defend road's bill lands.
  // ---------------------------------------------------------------------

  await write.node("binding-in-arcadia", {
    key: "two-fewer",
    kind: "SCENE",
    title: "Two Fewer",
    summary: "The defenders count themselves onto the sand, and somebody who did the arithmetic on the island does it again out loud.",
    status: "CANON", x: 120, y: 300,
    body: `The sea does not deliver a roll call. It takes three days on that beach before anybody can say with confidence who made it, and by then the number has already been arrived at privately by everyone who can count.

The east road cost two scouts on the island. It cost more than that on the wall, and the people who were standing where those scouts should have been are not all here either, and everyone knows which week that was.

Nobody accuses anybody. That is not how it goes. What happens is quieter and worse: a Kestrel sergeant, sitting on a fuel drum with a wet cigarette she cannot light, works through the arithmetic out loud, to nobody, in the flat voice of somebody who has done it several times already and keeps arriving at the same total.

She is not wrong about the number. She is wrong about one thing, and she will never find out she was wrong, and neither will the party for a very long time: the satchel that cost those people is the only reason anybody ever finds him.

The file is still in it. Torn plate, a cast of a gait, a bearing and an hour.

Carry it up the beach.`,
    effects: ["The Defend road's arrivals carry the cost of the east road into Act I."],
  });
  await write.links("binding-in-arcadia", "two-fewer", ["forward-camp-kestrel", "tino", "port-arcadia"]);

  await write.edge("binding-in-arcadia", {
    from: "storm-beach", to: "two-fewer",
    label: "Count who made it",
    condition: "walked-the-east-road",
  });
  await write.edge("binding-in-arcadia", { from: "two-fewer", to: "find-the-soul-forge" });
  await write.edge("binding-in-arcadia", { from: "storm-beach", to: "find-the-soul-forge", label: "Get off the sand and move inland" });
  await write.retireEdge("binding-in-arcadia", "storm-beach", "find-the-soul-forge", null,
    "the beach branches now, so both routes off it carry choice text");

  await write.report(apply ? "Kestrel east road — APPLYING" : "Kestrel east road — dry run");
}

main().then(() => db.$disconnect(), (error) => { console.error(error); return db.$disconnect().then(() => process.exit(1)); });
