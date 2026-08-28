import "../lib/environment";
import { getPrismaClient } from "@habitat/db/client";
import { BoardWriter } from "./lib/story-authoring";

/**
 * Rewrites the remaining four Bloomfall boards — the vent, the marsh, the
 * herds, and the vault — and closes the regional ring.
 *
 *   pnpm --filter @habitat/web exec tsx scripts/author-bloomfall-living.ts [--apply]
 *
 * Companion to author-bloomfall-machine.ts; read that file's header for the
 * ring diagram and why these six arcs are being rewritten at all. The Purge
 * Window lives here rather than there because it is the arc that READS what
 * the industrial two set, and it reads better beside the marsh it damages.
 *
 * CANON DISCIPLINE: the true cause of the Bloomfall stays deferred. Marsh
 * coordination is measured and never confirmed as consciousness — that line is
 * load-bearing for Keira Ansel's entire characterisation and no branch below
 * crosses it.
 */
const db = getPrismaClient();

async function main() {
  const apply = process.argv.includes("--apply");
  const actor = await db.user.findFirst({ where: { role: "ADMIN", isActive: true }, orderBy: { id: "asc" }, select: { id: true } });
  if (!actor) throw new Error("Authoring requires an active administrator for revision authorship.");
  const write = new BoardWriter(db, actor.id, apply);

  await write.flag("heartfen-channel-open", "Heartfen Keeps a Channel Open",
    "The marsh held a route open after the party proved the exchange was repeatable. Water moves where it did not, and so do the animals that follow it.",
    `Set in [[root-of-the-bargain]]. Checked in [[the-bellwether-hunt]].

[[heartfen]] closed and opened channels in response to a repeated material return, measurably, on a schedule that survives statistical attack. [[keira-ansel]] will describe that as coordination and refuse to describe it as agreement, and she is right to.

What it means on the ground is that water goes somewhere it did not go last season. Herds follow water. So does everything that eats them, which is how a marsh quest ends up deciding where a Warden has to stand.`);

  await write.flag("cairnwood-approach-lost", "Cairnwood Loses the Surveyed Approach",
    "The only surveyed route into Cairnwood is abandoned to displaced herds and the predators behind them. Everything that has to reach the camp now goes the long way, or goes armed.",
    `Set in [[the-bellwether-hunt]]. Checked in [[reserve-twelve-contract]].

The surveyed approach is the one road into [[cairnwood-camp]] that has been walked enough times to be trusted. Lose it and the Reach does not lose access — it loses *cheap* access, which for a containment zone running on borrowed logistics is close to the same thing.

It decides who can realistically reach [[reserve-vault-twelve]] inside a cycle window, and therefore who gets to make a claim on it at all.`);

  // =====================================================================
  // THE PURGE WINDOW — a trolley problem where the marsh has its own hand
  // on the lever.
  // =====================================================================

  await write.arcFields("the-purge-window", {
    hook: "A reactor sector is going to vent. It is not a question. The only question is where the downstream load goes, and the marsh will answer it if nobody else does.",
    summary: "A world event linking a Southreach purge to Black Tide at Blackweir. Forecast it if the Last Safe Reading was recovered, weigh a load that has to go somewhere, and choose between an ocean containment, a filtration arm, and a camp. Blackweir will make the call itself if the party is not there to make it.",
  });

  await write.node("the-purge-window", {
    key: "regional-alert", kind: "QUEST_START", title: "It Is Going to Vent",
    summary: "Not a crisis to prevent. A quantity of contaminated load, and a decision about where to put it.",
    x: 320, y: 0,
    body: `[[reactor-cycles]] is going to purge a sector. That part is settled and nobody in [[bloomfall-reach]] has ever had a say in it.

A purge is not an explosion. It is a scheduled release — a sector dumps accumulated contaminated load into the drainage that was built to take it, and twenty years ago the drainage went to the sea through infrastructure that no longer exists. Now it goes into [[the-living-marsh]].

So the event is not a disaster to avert. It is a volume, and a set of channels, and a question about which of them takes it.

[[keira-ansel]] puts it in front of you without decoration. The load is going somewhere. There are three somewheres. Everyone she has explained this to has wanted a fourth, and there is not one, and she has stopped being gentle about saying so.`,
  });
  await write.links("the-purge-window", "regional-alert", ["reactor-cycles", "the-purge-window", "keira-ansel"]);

  await write.node("the-purge-window", {
    key: "the-forecast", kind: "SCENE", title: "The Forecast",
    summary: "With a real baseline, Keira Ansel can give you a number and a window. Without one, everyone watches the stacks.",
    speakerSlug: "keira-ansel", x: 160, y: 160,
    body: `Ansel has the Last Safe Reading in front of her, and for the first time in her career she is doing forecasting instead of description.

A baseline is not a small thing. Everything the Reach has measured for twenty years is post-event data from a complex that is not the complex it was; she has been modelling a machine by watching its wreckage. With one clean block of how that sector behaved *before*, she can put a volume, a rate, and a window on the vent.

Eleven hours of warning. A number for the load. A confidence interval she states out loud, because she states everything out loud.

She is careful to say what it does not buy. It does not tell her what the load will do inside the marsh, because the marsh is not in the baseline and never was. It does not make the choice easier. What it buys is that the choice gets made in daylight, by people who had time to walk the ground, instead of in the dark by whoever is nearest when the stacks start.

"That is the entire improvement," she says. "It is enormous. Do not ask me for more than that."`,
  });
  await write.links("the-purge-window", "the-forecast", ["keira-ansel", "the-last-safe-reading", "reactor-cycles"]);

  await write.node("the-purge-window", {
    key: "no-baseline", kind: "SCENE", title: "Somebody Watches the Stacks",
    summary: "Without the reading, the Reach forecasts a vent the way it has for twenty years.",
    x: 480, y: 160,
    body: `There is no baseline, so there is no forecast, so the Reach does what the Reach has done for twenty years.

Somebody sits where they can see the vent stacks at [[southreach-complex]] and watches, in shifts, and when the note changes they shout, and a runner goes to [[cairnwood-camp]].

[[keira-ansel]] hates this and says so, at length, to anyone who will hold still. Not because it does not work — it works, in the sense that people usually get told. It works with about forty minutes of warning and no number attached, which means every decision downstream of it gets made by whoever is closest to the water when the shouting starts, on instinct, in the dark.

She has a term for the last twenty years of Reach containment policy. The term is *reflex*.

You will be making this decision at speed, on the ground, with a rate you are guessing at. People have died of that here before and the record of it is quite good.`,
  });
  await write.links("the-purge-window", "no-baseline", ["keira-ansel", "southreach-complex", "cairnwood-camp"]);

  await write.node("the-purge-window", {
    key: "fieldwork", kind: "QUEST_STEP", title: "Read the Vent and the Weir",
    summary: "Two readings, forty kilometres apart, and neither is any use without the other.",
    x: 320, y: 320,
    completion: "Pair Shattercore's vent rate with Nalia Reed's channel survey at Blackweir while both are still actionable.",
    body: `The work is two surveys that have to be taken at nearly the same time and are forty kilometres apart.

At the [[the-shattercore]] end: the vent rate, the sector's actual load, and which of the old drainage runs are still passing water rather than pretending to.

At the other end: [[nalia-reed]], up to the thigh in [[blackweir]], reading which channels are open this week. She does not describe it as asking. She reads sign — pressure, colour, where the sink organisms have moved, which resin beds are laying down and which are thinning — the same way a tracker reads a hillside, and she is fast and she is unsentimental and she will correct you if you use the word *decide*.

Together the two readings give you a map of where the load can be put and what happens to each place that takes it.

Reed will also tell you, without being asked, the thing she thinks you will not want to hear: [[blackweir]] has done this before. It has an answer already. If nobody arrives with a better one, it will use its own, and its own has never once optimised for the people living upstream.`,
  });
  await write.links("the-purge-window", "fieldwork", ["blackweir", "nalia-reed", "the-shattercore"]);

  await write.node("the-purge-window", {
    key: "more-than-it-was", kind: "SCENE", title: "More Than It Was",
    summary: "The Splicefield tie-in put load on an isolated sector. The vent is larger than any model of it.",
    x: 520, y: 480,
    body: `The number is wrong. Not the forecast — the forecast is fine. The *sector* is wrong.

An isolated feeder is carrying again. [[splicefield-substation]] is tied back into this sector, and a sector that was decommissioned to stop carrying load has been carrying it for weeks, and everything it carried has to go somewhere when the purge comes.

Nobody accounted for that because nobody could have. The tie-in is not on any drawing. It exists because a maintenance construct closed a twenty-year-old work order correctly.

The consequences are arithmetic and they are ugly. The volume is up by a margin that eats the whole safety case. The window is shorter, because a sector under load reaches its purge threshold sooner. And the load itself is dirtier, because it has been sitting in galleries that Blackbloom has had twenty undisturbed years to colonise.

There is no version of this where all three destinations survive it. There was never going to be a good outcome; there was going to be a *choosable* one, and the choosing just got narrower.

[[keira-ansel]] recalculates twice, puts the pencil down, and says the only thing there is to say, which is that somebody should have written down why that sector was isolated.`,
  });
  await write.links("the-purge-window", "more-than-it-was", ["splicefield-substation", "reactor-cycles", "keira-ansel"]);

  await write.node("the-purge-window", {
    key: "regional-decision", kind: "CHOICE", title: "Redirect the Cost",
    summary: "Three places can take it. None of them should have to.",
    x: 320, y: 640,
    body: `The load is coming. Here is where it can go, and what it costs, stated plainly, because [[keira-ansel]] refuses to state it any other way.

**The ocean run.** Push it through the old sea drainage. The peninsula's containment holds, [[the-living-marsh]] takes almost nothing, and you put a contaminated volume into open water that nobody in the Reach has the instruments to follow. It stops being your problem in the specific sense of becoming somebody else's, later, elsewhere, and probably not for years.

**The filtration arm.** Put it into [[blackweir]] and let the barrier do what it is for. It will hold. It will hold by closing off a whole arm, consuming what is inside it, and relocating its front — killing several square kilometres of the most productive marsh in the Reach, permanently, and moving the edge of the living country inland by a distance that will change every route through it.

**The Cairnwood side.** Take it upstream through the shallow channels, where the volume disperses across enough ground to dilute below the thresholds that matter. The ground it disperses across is the ground [[cairnwood-camp]] draws water from and grazes on, and they will have to move, and they have moved twice already and there is not a third place.

Choose. You do not get to leave it in the sector; the sector is venting either way.`,
  });
  await write.links("the-purge-window", "regional-decision", ["blackweir", "cairnwood-camp", "the-living-marsh"]);

  await write.node("the-purge-window", {
    key: "intervention-outcome", kind: "ENDING", endingKind: "NEUTRAL", title: "Somewhere Took It",
    summary: "The vent happens on schedule and lands where a person decided it would.",
    x: 200, y: 820,
    body: `The sector vents on schedule, at the rate it was always going to, into the channels you opened for it.

**The sea**, and the marsh is untouched and Cairnwood keeps its water and nobody in the Reach can tell you what happened to the load after it left the drainage, because nobody in the Reach owns an instrument that goes out there. There is no bill. There is a bill; it is simply not addressed to anyone currently alive in this containment zone.

**The weir**, and [[blackweir]] amputates. It closes an arm, consumes it over nine days, and relocates its front two kilometres inland — a wall of dying and re-growing barrier that you can watch move if you stand still long enough. Ocean containment holds absolutely. Several square kilometres of the richest ground in the Reach are gone, and [[nalia-reed]] walks routes that no longer exist for a season afterward, correcting her own maps by hand.

**Cairnwood**, and the camp moves. Again. They do it without much argument, which is worse than an argument would have been, and the new ground is thinner and further from the surveyed approach and everyone knows it.

The one thing the branches share: it landed where a person put it. Twenty years of this region's history is things landing where nobody put them, and for once there is a name attached to the decision, and it is yours.`,
    effects: ["The purge is directed by a person rather than by reflex.", "The chosen destination carries the load permanently."],
  });
  await write.links("the-purge-window", "intervention-outcome", ["blackweir", "cairnwood-camp", "nalia-reed"]);

  await write.node("the-purge-window", {
    key: "nobody-came", kind: "ENDING", endingKind: "NEUTRAL", title: "Nobody Came",
    summary: "Blackweir decides. It has an answer, it has always had one, and it does not consider anybody upstream.",
    x: 460, y: 820,
    body: `The sector vents and nobody is standing anywhere that matters, so [[blackweir]] answers.

It does what it has done before. It closes an arm — the northern one, the productive one, the one [[nalia-reed]] has been walking for eleven years — isolates it, and begins consuming it, and relocates the front inland to hold the line at the sea. Ocean containment is preserved absolutely. It is, by any measure anyone can apply, the correct call.

It is also made without any reference whatsoever to the people upstream. The relocation takes ground that [[cairnwood-camp]] draws on. Nobody asked Cairnwood. Nobody could have; there is no mechanism for asking, and the thing making the decision has never given a single piece of evidence that it knows Cairnwood is there.

This is the event that gets argued about for years. [[keira-ansel]] writes it up as the strongest coordination data anyone has ever recorded in [[the-living-marsh]] — a barrier that triaged, sacrificed, and relocated under load, correctly, unprompted — and she writes it up refusing, in the same paper, to call it a decision, because the data does not support the word and she will not use a word the data does not support.

Half the Reach reads the paper as proof the marsh is thinking. The other half reads it as proof it is not. Both halves are reading the same numbers.

Cairnwood moves in the spring. Nobody came, so the marsh chose, and the marsh does not optimise for anybody who is not the marsh.`,
    effects: ["set flag: blackweir-arm-sacrificed", "Blackweir's front relocates inland without any human input.", "Cairnwood loses ground it was drawing on."],
  });
  await write.links("the-purge-window", "nobody-came", ["blackweir", "keira-ansel", "cairnwood-camp", "the-living-marsh"]);

  await write.edge("the-purge-window", { from: "regional-alert", to: "the-forecast", label: "Forecast it from the baseline", condition: "the-last-safe-reading-recovered" });
  await write.edge("the-purge-window", { from: "regional-alert", to: "no-baseline", label: "Wait for the stacks to change note" });
  await write.edge("the-purge-window", { from: "regional-alert", to: "nobody-came", label: "Be somewhere else when it vents" });
  await write.edge("the-purge-window", { from: "the-forecast", to: "fieldwork" });
  await write.edge("the-purge-window", { from: "no-baseline", to: "fieldwork" });
  await write.edge("the-purge-window", { from: "fieldwork", to: "more-than-it-was", label: "The sector is carrying more than it should", condition: "splicefield-feeder-live" });
  await write.edge("the-purge-window", { from: "fieldwork", to: "regional-decision", label: "Take the readings and decide" });
  await write.edge("the-purge-window", { from: "more-than-it-was", to: "regional-decision" });
  await write.edge("the-purge-window", { from: "regional-decision", to: "intervention-outcome", label: "Push it to the sea", effects: ["The marsh and Cairnwood are spared; an untracked volume enters open water."] });
  await write.edge("the-purge-window", { from: "regional-decision", to: "intervention-outcome", label: "Give it to the weir", effects: ["set flag: blackweir-arm-sacrificed", "Blackweir amputates an arm and relocates its front inland."] });
  await write.edge("the-purge-window", { from: "regional-decision", to: "intervention-outcome", label: "Disperse it upstream", effects: ["Cairnwood loses its water and grazing and has to move again."] });
  await write.retireEdge("the-purge-window", "regional-alert", "fieldwork", null, "the opening branches on whether anyone can forecast the vent");
  await write.retireEdge("the-purge-window", "fieldwork", "regional-decision", null, "replaced by a labelled route, so the Splicefield branch has a sibling with choice text");
  await write.retireEdge("the-purge-window", "regional-decision", "intervention-outcome", "Intervene before the regional state closes", "replaced by the three named destinations");
  await write.retireEdge("the-purge-window", "regional-decision", "nobody-came", "The incident resolves without the party", "Nobody Came is the marsh answering, not a thing a player picks");

  // =====================================================================
  // ROOT OF THE BARGAIN — a repeatable exchange nobody can name.
  // =====================================================================

  await write.arcFields("root-of-the-bargain", {
    hook: "Put the same material into Heartfen twice and the same channel opens twice. That is not a bargain. Keira Ansel will not let anyone call it a bargain. It is also not nothing.",
    summary: "A measurable, repeatable exchange with the deepest part of the Living Marsh, and a corridor that moves. The experiment works. What it proves is the entire argument, and the codex does not settle it — coordination is measured, consciousness stays unproven, and both scientists in the water are right.",
  });

  await write.node("root-of-the-bargain", {
    key: "regional-alert", kind: "QUEST_START", title: "It Did It Again",
    summary: "Nalia Reed put material in. A channel opened. She did it again, and it opened again.",
    x: 320, y: 0,
    body: `[[nalia-reed]] is not claiming anything, which is what makes her worth listening to.

What she has is a notebook. Eleven entries. Each one is the same procedure: a specific quantity of a specific material returned to a specific part of [[heartfen]] — not offered, not ceremonially placed, *returned*, in the sense that it came out of the marsh in the first place — and then a note about what the water did over the following two days.

Nine times out of eleven, a channel opened. Not a channel that was going to open anyway; she is careful about that and her controls are better than they have any right to be for someone with no institution behind her. A route through the deep fen that was not passable, and then was, and stayed passable for as long as the return kept up.

She has told nobody outside the marsh clans. She is telling you because the eleventh entry is different from the other ten and she wants a second pair of eyes before she writes it down as real.

She would also like it stated, up front and once, that she is not saying the marsh agreed to anything. She has spent her whole life correcting people who say that. She is saying she did a thing eleven times and got the same answer nine.`,
  });
  await write.links("root-of-the-bargain", "regional-alert", ["nalia-reed", "heartfen", "root-of-the-bargain"]);

  await write.node("root-of-the-bargain", {
    key: "fieldwork", kind: "QUEST_STEP", title: "Test the Opening",
    summary: "Two scientists, one experiment, and a corridor that will not hold still.",
    x: 320, y: 200,
    completion: "Run the exchange under controls with Ansel and Reed, and follow the corridor while it moves.",
    body: `[[keira-ansel]] comes out to break it, because that is what a good one does with a result she likes.

She brings controls. Sham returns with inert material. Returns at the wrong site. Returns at the right site at the wrong time. Instrumented water, upstream and down, so that if a channel opens for ordinary hydrological reasons she can say so and go home.

It survives all of it. Nine in eleven becomes twenty-six in thirty-one, and the sham returns do nothing, and the wrong-site returns do nothing, and the effect tracks the correct material at the correct place with a lag of thirty to forty hours that is consistent enough to be boring.

Meanwhile the corridor moves, and that is why this takes three people and not two.

[[the-route-that-moves]] runs from a gap behind [[walking-orchard]] to a temporary crossing near [[reedless-mile]], and it does not stay where you left it — the orchard relocates over days rather than seasons, and the marsh opens and closes behind it. Reading it takes both halves: [[mara-quill]] on the animal and root signs at the front, [[nalia-reed]] on the water, Ansel logging behind them through channels that are chest-deep where they were ankle-deep the previous evening.

Quill raises the obvious idea on the second day and then argues herself out of it in front of everybody: mark it permanently, stake it, make it a road. It would save lives. It would also put fixed human structure into the exact behaviour that produces the corridor, and nobody can say what that does, and the honest position is that the route may only exist because nothing has ever tried to own it.

At the end of eleven days you have the cleanest ecological dataset anyone has ever produced in [[the-living-marsh]], an unmarked corridor, and two scientists who cannot agree on a single sentence to put at the top of the first page.`,
    effects: ["The exchange is documented under controls.", "The corridor is left unmarked."],
  });
  await write.links("root-of-the-bargain", "fieldwork", ["keira-ansel", "nalia-reed", "mara-quill", "the-route-that-moves", "walking-orchard", "reedless-mile"]);

  await write.node("root-of-the-bargain", {
    key: "the-arm-that-closed", kind: "SCENE", title: "The Arm That Closed",
    summary: "Since Blackweir amputated, Heartfen's answer has changed — and it changed in the direction of a thing under pressure.",
    x: 540, y: 200,
    body: `The numbers are different since [[blackweir]] closed its arm, and the difference is the most uncomfortable thing in the dataset.

Before the amputation the response was steady: return the material, thirty to forty hours, channel opens. Since the front relocated inland, the lag is longer, the channels are narrower, and — this is the part [[keira-ansel]] keeps rerunning — twice now [[heartfen]] has opened a channel *and then closed it again within a day*, which it had never done in thirty-one trials.

Reed's reading, offered flatly and without embellishment: it is short. It lost an arm, it is holding a longer front with less ground, and it is being careful with what it has.

Ansel's reading: that is a hypothesis with a mind smuggled inside it, and the same data supports a purely mechanical account in which reduced filtration capacity produces exactly this response profile with nothing deciding anything.

They are both right. That is the actual state of the science and the codex does not resolve it.

What neither of them says out loud, standing in water that is colder than it was last year, is the obvious next question — whether a thing under pressure that has begun withholding is a system degrading, or something rationing.`,
  });
  await write.links("root-of-the-bargain", "the-arm-that-closed", ["blackweir", "heartfen", "keira-ansel", "nalia-reed"]);

  await write.node("root-of-the-bargain", {
    key: "regional-decision", kind: "CHOICE", title: "Agreement, Exploitation, or Restraint",
    summary: "It works and it is repeatable, which means somebody is going to industrialise it.",
    x: 320, y: 420,
    body: `The result is real. That is the problem, because a repeatable input-output relationship with a marsh is not a discovery — it is a *process*, and processes get scaled.

**Publish it as an agreement.** Frame it the way [[nalia-reed]] lives it: a relationship with obligations, returned material, and restraint written in. It gives the marsh clans standing they have never had, and it puts a word — *agreement* — into the literature that the data does not support, and [[keira-ansel]] will not sign it.

**Publish it as a mechanism.** Ansel's version. Rigorous, defensible, stripped of any implication of mind. It survives every attack. It is also, the moment it exists, an operations manual: input this, receive corridor. Aegis's process engineers will read it inside a month and they will not read the caveats.

**Bury it.** Nobody publishes. The exchange stays with the people who found it and the corridor stays a thing you have to be taught by somebody who knows. It protects the marsh from being farmed and it makes Reed's knowledge unverifiable forever, which is what it has always been, which is why nobody has ever taken her seriously.

None of these settles what is happening at Heartfen. That is deliberate and it is the point of the quest.`,
  });
  await write.links("root-of-the-bargain", "regional-decision", ["keira-ansel", "nalia-reed", "heartfen"]);

  await write.node("root-of-the-bargain", {
    key: "intervention-outcome", kind: "ENDING", endingKind: "NEUTRAL", title: "Documented, or Not",
    summary: "A repeatable exchange enters the world in one of three shapes, and consciousness stays unproven in all of them.",
    x: 200, y: 620,
    body: `The corridor closes at the end of the season the way it always does, and what you did with the result is now the only part that persists.

**As agreement**, and the [[verdant-marsh-clans]] have a claim in the literature for the first time — contested, resented, and permanent. Ansel's name is not on it. She and Reed remain, carefully, friends.

**As mechanism**, and it is unimpeachable, and within the year somebody with a budget is running returns at industrial volume to open corridors on demand, and the caveats section is doing none of the work it was written to do. Ansel knew this would happen. She published anyway, and will tell you exactly why, and it is a better answer than you expect.

**Buried**, and the marsh is not farmed, and Reed goes on being an unverifiable woman with a notebook, and the corridor keeps moving for the people who were taught it.

In every branch the sentence at the top of the dataset stays the same, because it is the only sentence the evidence permits: *coordination is measured; consciousness is not demonstrated.*

[[heartfen]] keeps doing it either way. It has not once given any indication that it is aware there was an argument.`,
    effects: ["set flag: heartfen-channel-open", "The exchange enters the world in the chosen form.", "Consciousness remains unproven."],
  });
  await write.links("root-of-the-bargain", "intervention-outcome", ["heartfen", "keira-ansel", "nalia-reed", "verdant-marsh-clans"]);

  await write.node("root-of-the-bargain", {
    key: "nobody-came", kind: "ENDING", endingKind: "NEUTRAL", title: "Nobody Came",
    summary: "Reed runs it alone, eleven entries become forty, and it stays a notebook nobody will read.",
    x: 460, y: 620,
    body: `[[nalia-reed]] keeps going, because she was going to keep going regardless of whether anyone came.

Eleven entries become forty. The controls are still not there, because controls need a second person and instruments and she has neither, and the effect is still real and she still cannot prove it. The corridor moves. She follows it. She writes it down.

[[heartfen]] closes at the end of the season the way it always does. It opens again the next year for anybody who does the same thing in the same place, and nobody does, because nobody has been taught it and the one person who could teach it has been dismissed politely by three institutions.

And [[the-route-that-moves]] closes with an expedition still on the wrong side of it.

That is the part that gets written down, because it has a casualty list attached. A survey party out past [[walking-orchard]] loses the crossing near [[reedless-mile]] when the corridor shuts, and has to choose between abandoning its equipment and finding a worse way home, and does both — the instruments go into the water and the long route costs them two people. Nobody was reading the front. Quill was somewhere else. Reed was alone at Heartfen doing the work that would have told them.

Access shifts elsewhere. The route that was passable this year is not next year, no map records that it ever was, and the marsh clans lose one more piece of the only kind of knowledge they have — the kind that lives in a person and dies with them.

Years later somebody from [[meridian-arcane-institute]] finds the notebook in an estate and publishes on it, carefully, hedged, as an interesting historical account of folk practice in the Reach.

It works. It always worked. Forty times out of forty-nine, and nobody was there to hold the other end of the tape.`,
    effects: ["The exchange remains unverified folk knowledge.", "The corridor closes on an isolated expedition.", "The route is lost to everyone who was not taught it."],
  });
  await write.links("root-of-the-bargain", "nobody-came", ["nalia-reed", "heartfen", "the-route-that-moves", "reedless-mile"]);

  await write.edge("root-of-the-bargain", { from: "regional-alert", to: "fieldwork", label: "Go out and run it properly" });
  await write.edge("root-of-the-bargain", { from: "regional-alert", to: "nobody-came", label: "Leave her to it" });
  await write.edge("root-of-the-bargain", { from: "fieldwork", to: "the-arm-that-closed", label: "The response has changed since the weir closed", condition: "blackweir-arm-sacrificed" });
  await write.edge("root-of-the-bargain", { from: "fieldwork", to: "regional-decision", label: "Take the result to the room" });
  await write.edge("root-of-the-bargain", { from: "the-arm-that-closed", to: "regional-decision" });
  await write.edge("root-of-the-bargain", { from: "regional-decision", to: "intervention-outcome", label: "Publish it as an agreement", effects: ["The marsh clans gain contested standing in the literature."] });
  await write.edge("root-of-the-bargain", { from: "regional-decision", to: "intervention-outcome", label: "Publish it as a mechanism", effects: ["The exchange becomes an operations manual within a year."] });
  await write.edge("root-of-the-bargain", { from: "regional-decision", to: "intervention-outcome", label: "Bury it", effects: ["The marsh is not farmed; Reed's knowledge stays unverifiable."] });
  await write.retireEdge("root-of-the-bargain", "regional-alert", "fieldwork", null, "the opening branches, so both routes out of it carry choice text");
  await write.retireEdge("root-of-the-bargain", "fieldwork", "regional-decision", null, "replaced by a labelled route, so the Blackweir branch has a sibling with choice text");
  await write.retireEdge("root-of-the-bargain", "regional-decision", "intervention-outcome", "Intervene before the regional state closes", "replaced by the three publication choices");
  await write.retireEdge("root-of-the-bargain", "regional-decision", "nobody-came", "The incident resolves without the party", "Nobody Came is Reed carrying on alone");

  write.report(apply ? "Bloomfall — the vent and the marsh — APPLYING" : "Bloomfall — the vent and the marsh — dry run");
}

main().then(() => db.$disconnect(), (error) => { console.error(error); return db.$disconnect().then(() => process.exit(1)); });
