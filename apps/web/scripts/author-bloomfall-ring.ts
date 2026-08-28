import "../lib/environment";
import { getPrismaClient } from "@habitat/db/client";
import { BoardWriter } from "./lib/story-authoring";

/**
 * The last two Bloomfall boards — the herds and the vault — and the edge that
 * closes the regional ring.
 *
 *   pnpm --filter @habitat/web exec tsx scripts/author-bloomfall-ring.ts [--apply]
 *
 * See author-bloomfall-machine.ts for the ring diagram. This file plants
 * cairnwood-approach-lost in the Bellwether hunt and reserve-twelve-sealed in
 * the vault contract, which is the link back to Mender's Work and the point at
 * which the six arcs stop being six arcs.
 *
 * CANON DISCIPLINE: the Bellwether is not a giant-deer boss. It is an
 * ecological intervention question that happens to be standing in front of you
 * at four hundred metres, and killing it is a legitimate branch with a
 * legitimate cost rather than the win condition.
 */
const db = getPrismaClient();

async function main() {
  const apply = process.argv.includes("--apply");
  const actor = await db.user.findFirst({ where: { role: "ADMIN", isActive: true }, orderBy: { id: "asc" }, select: { id: true } });
  if (!actor) throw new Error("Authoring requires an active administrator for revision authorship.");
  const write = new BoardWriter(db, actor.id, apply);

  // =====================================================================
  // THE BELLWETHER — a rifle, a question, and no boss health bar.
  // =====================================================================

  await write.arcFields("the-bellwether-hunt", {
    hook: "The herds left Cairnwood's surveyed approach in one night. The Bellwether has entered Long Graze, and nothing that walks near it stays what it was.",
    summary: "A Warden faction quest about an Aberrant that changes what other animals are simply by being near them. Track the field rather than the trophy, and decide between observation, redirection, and a clean shot — one of which is easy, obvious, popular, and the worst available outcome for everyone who has to live here.",
  });

  await write.node("the-bellwether-hunt", {
    key: "regional-alert", kind: "QUEST_START", title: "The Herds Left in One Night",
    summary: "Not spooked. Relocated — deliberately, in order, off ground they have used for twenty years.",
    x: 320, y: 0,
    body: `[[mara-quill]] has the board and she is unhappy about the wording on it, which says BOUNTY.

What actually happened is that the herds left [[long-graze]]'s eastern shelf between one evening and the next morning. Not scattered — *relocated*, in order, unhurried, off ground they have grazed for twenty years, onto ground that is worse. Nothing panicked. Nothing was run. There are no kill sites and no carcasses.

They moved because [[the-bellwether]] entered Long Graze and began its Long Graze cycle, and the herds around it are doing what herds around it have always done, which is go somewhere else in a hurry that does not look like a hurry.

Quill will tell you what the Bellwether is before you ask, because she has learned that people arrive with the wrong idea. It is a named grazing-lineage Aberrant — a [[blackbloom-hart]] that survived long enough to stop being one. It is not a predator, has never taken a person, and has no interest in you whatsoever.

What it does is harder to put on a bounty board than predation. It carries a mobile field of scent, low-frequency vibration, and saturation discharge, and inside that field the behaviour and [[adaptive-mutation]] *expression* of other animals change.

Quill is precise about this because everyone gets it wrong. It is not the ladder. The ladder is climbed by being wounded and getting away, and the Bellwether has never wounded anything in its life. What changes inside the field is which of an animal's adaptations are switched on, how hard, and for how long — and it does not command the herds either. It changes what they are while they stand near it.

The road the herds abandoned is the surveyed approach into [[cairnwood-camp]]. It is the only route into the camp that anyone trusts, and it is now full of displaced animals and the things that eat them.`,
  });
  await write.links("the-bellwether-hunt", "regional-alert", ["mara-quill", "the-bellwether", "long-graze", "adaptive-mutation", "blackbloom-hart"]);

  await write.node("the-bellwether-hunt", {
    key: "fieldwork", kind: "QUEST_STEP", title: "Track the Field, Not the Trophy",
    summary: "Quill's method: map what changes around it, at range, for days, before anyone touches a trigger.",
    speakerSlug: "mara-quill", x: 320, y: 180,
    completion: "Map herd displacement and predator response across Long Graze before choosing a course.",
    body: `Quill's method is unglamorous and it is the whole quest.

You do not track the Bellwether. It does not conceal itself and it has never needed to; finding the animal is the trivial part and it is not the job. You track the *field* — the volume of ground around it in which things are changing — and you do that by walking transects at range for four days and writing down what you see, which is exactly as boring as it sounds until the numbers start.

Expression shifts inside about two kilometres of it, in animals surveyed as ordinary last season. Latchhound packs working the abandoned approach in broad daylight, which latchhounds do not do. A [[rootback-grazer]] that will not leave the herd it has attached itself to and has started retaliating against things it used to walk away from.

None of them has been wounded. None of them has climbed anything. They are expressing what the Reach already gave them, at volumes nobody has measured before, because they are standing inside the field.

And the predators, which is the part that will actually kill someone. Displaced herds have pulled the whole predator profile of eastern Long Graze onto a road that people use, and those predators are inside the field as well, and behaving accordingly.

Quill insists the change is communicated rather than merely chemical. She cannot prove it. She has been saying it for eleven years and writing down what she sees while she says it, which is more than any of her critics have done.

She is also blunt about the trap: everyone she has ever brought out here works out by day three that all of this stops if the Bellwether stops, and the trap is that they are right.`,
  });
  await write.links("the-bellwether-hunt", "fieldwork", ["mara-quill", "adaptive-mutation", "long-graze", "rootback-grazer"]);

  await write.node("the-bellwether-hunt", {
    key: "the-water-moved", kind: "SCENE", title: "The Water Moved",
    summary: "Heartfen kept a channel open, so the herds have somewhere to go — and the Bellwether is following them there.",
    x: 540, y: 180,
    body: `The displacement is not random and Quill works it out on the fourth day with a map and a piece of charcoal.

The herds are not fleeing. They are *going somewhere*, and the somewhere is new: water that was not there last season, on the marsh side, running through ground that used to be dry because [[heartfen]] has been keeping a channel open.

That changes the whole problem and it changes it in a direction nobody planned.

The good half: there is somewhere for them to go. A displaced herd with water and forage is a herd that survives the season instead of collapsing, and the predator pressure spreads out across new ground instead of concentrating on one road.

The bad half: [[the-bellwether]] follows grazing. Grazing follows water. The water now runs toward the marsh — so the field is being walked, slowly and without any hurry at all, into [[the-living-marsh]], where every species is already carrying more Blackbloom load than anything in the Belt and nobody has the faintest idea what the field does to a population under that much pressure.

Nobody modelled that. Nobody could have. A woman with a notebook and a fen forty kilometres away opened a channel, and an Aberrant changed course.`,
  });
  await write.links("the-bellwether-hunt", "the-water-moved", ["heartfen", "the-bellwether", "the-living-marsh", "mara-quill"]);

  await write.node("the-bellwether-hunt", {
    key: "regional-decision", kind: "CHOICE", title: "Protect the Route or the Ecology",
    summary: "One option is easy, obvious, popular, and the worst thing you can do here.",
    x: 320, y: 400,
    body: `Three courses. Quill will back any of them and she has an opinion about all of them.

**Observe.** Do nothing, keep the transects running, and let the cycle finish. The Bellwether moves on in its own time and the field goes with it, and the eastern shelf spends a long while settling back toward whatever it was. Cairnwood loses the surveyed approach for at least a season and probably for good, and people will die on the long route this winter, and Quill can tell you roughly how many because she has the figures from the last time.

**Redirect.** Move it. Not force — pressure, scent, fire lines, water, and a great deal of patience, steering four metres at the shoulder away from the corridor over about nine days. It works if you are good. Wherever you steer it to, the field goes as well, and something else that lives there gets what Long Graze is getting now.

**Kill it.** One shot, at range, into a thing that has never threatened anyone. It ends immediately: the field collapses, the herds come back inside a season, the approach reopens, and Cairnwood is measurably safer this winter.

And the signal network goes out with it. Every herd in the Belt navigates by that animal — that is what trail forecasting *is* here, and it is why the Wardens hunt only when extraction or migration safety requires it. Kill it and Quill's forecasts stop working, the herds move on nothing anyone can read, and [[long-graze]] does what it does when a recognisable individual is removed without cause: [[aberrant-escalation]] intensifies across a shelf with nothing left in it that anybody can name.

[[mara-quill]] has seen it done elsewhere. Her word for the result is *unsupervised*, and the way she says it is the most frightened she gets in this entire quest.`,
  });
  await write.links("the-bellwether-hunt", "regional-decision", ["mara-quill", "the-bellwether", "cairnwood-camp"]);

  await write.node("the-bellwether-hunt", {
    key: "intervention-outcome", kind: "ENDING", endingKind: "NEUTRAL", title: "The Field Moves, or Stops",
    summary: "Observed, redirected, or killed — and only one of the three takes the signal out of the Belt.",
    x: 200, y: 620,
    body: `**Observed**, and the cycle completes on its own schedule. The Bellwether leaves Long Graze in its own time and the field goes with it, and the eastern shelf settles into something that is not quite what it was — but the signal is still out there, walking, and Quill's forecasts still work, which turns out to be the whole difference. The surveyed approach is gone. Cairnwood takes the long route and the winter bill comes in about where Quill said it would.

**Redirected**, and it works, and the corridor reopens, and nine days of the hardest patient fieldwork anyone in the Reach has done that year gets written up in a Warden log that four people will read. The field is now somewhere else. Quill files the location and does not editorialise, and the entry sits in the log like an unpaid invoice.

**Killed**, and everything gets better immediately and stays better for about two years. The approach reopens. The herds return. Cairnwood is safer this winter, verifiably, in a count of people who did not die.

Then the forecasts stop working. Trails Quill has read for a decade produce nothing. Herds that were legible move on reasons nobody can see, and Wardens go out on bad predictions, which is how Wardens die. [[aberrant-escalation]] intensifies unevenly across a shelf with nothing recognisable left in it.

It is not a disaster. It is a slow, unsupervised drift, and by the time it is legible the shot is four years old and nobody connects the two.

One thing is true on every branch: there is one Bellwether horn at a time, and whatever gets built from this one, the Belt notices.`,
    effects: ["set flag: cairnwood-approach-lost", "The surveyed approach is decided one way or the other.", "Killing the Bellwether ends trail forecasting in the Belt."],
  });
  await write.links("the-bellwether-hunt", "intervention-outcome", ["the-bellwether", "long-graze", "cairnwood-camp", "aberrant-escalation"]);

  await write.node("the-bellwether-hunt", {
    key: "nobody-came", kind: "ENDING", endingKind: "NEUTRAL", title: "Nobody Came",
    summary: "The Aberrant migrates on its own schedule and takes the road with it.",
    x: 460, y: 620,
    body: `The Bellwether finishes its cycle and moves on, because that is what it was always going to do and it was never waiting on anybody.

Nothing dramatic marks it. One week it is on the eastern shelf and the next it is not, and the field goes with it, and the herds do not come back — the ground they left is a rung higher than it was and the forage is wrong now and they have found water elsewhere.

The surveyed approach into [[cairnwood-camp]] belongs to the displaced animals and the predators that followed them. The Wardens close it formally in the spring, which changes nothing except that it is now written down.

Cairnwood goes the long way. Everything Cairnwood needs goes the long way: water, salvage, relief, the people walking in from the coast road. It costs a day each direction and it costs an escort, and by midwinter [[mara-quill]] is spending most of her working life on that route instead of on anything she is actually good at.

She keeps the transect data. Four days of it, incomplete, taken by one person who could not be in two places. She notes at the bottom, in the log, that a proper survey would have wanted three people and that she did not have three people.

Nobody argues with a bounty that closed itself. The board gets a line drawn through it, and the road is gone — and the signal network is intact, walking somewhere north, which is the single piece of good news in the entire entry and the only one nobody thinks to write down.`,
    effects: ["set flag: cairnwood-approach-lost", "The surveyed approach is abandoned to displaced herds and predators.", "The signal network survives and trail forecasting still works."],
  });
  await write.links("the-bellwether-hunt", "nobody-came", ["the-bellwether", "cairnwood-camp", "mara-quill", "long-graze"]);

  await write.edge("the-bellwether-hunt", { from: "regional-alert", to: "fieldwork", label: "Walk the transects with Quill" });
  await write.edge("the-bellwether-hunt", { from: "regional-alert", to: "nobody-came", label: "Let the cycle run its course" });
  await write.edge("the-bellwether-hunt", { from: "fieldwork", to: "the-water-moved", label: "The herds are heading for new water", condition: "heartfen-channel-open" });
  await write.edge("the-bellwether-hunt", { from: "fieldwork", to: "regional-decision", label: "Take the field map and decide" });
  await write.edge("the-bellwether-hunt", { from: "the-water-moved", to: "regional-decision" });
  await write.edge("the-bellwether-hunt", { from: "regional-decision", to: "intervention-outcome", label: "Observe and let it finish", effects: ["The approach is lost for a season or for good."] });
  await write.edge("the-bellwether-hunt", { from: "regional-decision", to: "intervention-outcome", label: "Redirect it off the corridor", effects: ["The corridor reopens; the field becomes somewhere else's problem."] });
  await write.edge("the-bellwether-hunt", { from: "regional-decision", to: "intervention-outcome", label: "Take the shot", effects: ["The approach reopens and Cairnwood is safer this winter.", "A whole shelf of escalation is left with nothing above it."] });
  await write.retireEdge("the-bellwether-hunt", "regional-alert", "fieldwork", null, "the opening branches, so both routes out of it carry choice text");
  await write.retireEdge("the-bellwether-hunt", "fieldwork", "regional-decision", null, "replaced by a labelled route, so the Heartfen branch has a sibling with choice text");
  await write.retireEdge("the-bellwether-hunt", "regional-decision", "intervention-outcome", "Intervene before the regional state closes", "replaced by observe / redirect / shoot");
  await write.retireEdge("the-bellwether-hunt", "regional-decision", "nobody-came", "The incident resolves without the party", "Nobody Came is the Aberrant migrating on its own schedule");

  // =====================================================================
  // RESERVE TWELVE — two authentic claims and a ledger that does not add up.
  // =====================================================================

  await write.arcFields("reserve-twelve-contract", {
    hook: "The vault cycles open for nine days. Jaro Fen's salvage claim is genuine. Selene Ward's containment authority is genuine. The inventory inside matches neither of them.",
    summary: "A lawful recovery window on a pre-Bloomfall reserve vault, contested by two people who are both entirely within their rights. The material is real, the claims are real, and the ledger is short by an amount nobody can explain without accusing someone — which is exactly what this quest declines to do.",
  });

  await write.node("reserve-twelve-contract", {
    key: "regional-alert", kind: "QUEST_START", title: "Nine Days",
    summary: "A vault mechanism cycles on its own schedule, and two people with real claims are already at the door.",
    x: 320, y: 0,
    body: `[[reserve-vault-twelve]] opens on a mechanism, not a decision.

Pre-Bloomfall Aegis design: pressure-driven, unpowered, on a cycle measured in years, built so a reserve could never be locked shut by a failure. It opens for nine days and then it seals, and the next window is a long way off, and nobody alive can override either end of that.

Inside is several tonnes of correctly-specified pre-Bloomfall material — the last of it in [[bloomfall-reach]], and worth more every year that the Reach goes on rebuilding out of salvage.

Both of the people waiting at the adit have a real claim.

[[jaro-fen]] holds licensed salvage rights and buyer obligations that predate the containment order, properly filed, legally sound, with the paperwork in a case he will show you unprompted because he knows it is good.

[[selene-ward]] holds containment authority over the entire zone, which includes every gram of material in it, and a duty regarding contradictory inventory that she takes seriously and can quote.

Neither is lying. Neither is bluffing. There is no villain at this door — there are two people doing their jobs correctly at each other, for nine days.`,
  });
  await write.links("reserve-twelve-contract", "regional-alert", ["reserve-vault-twelve", "jaro-fen", "selene-ward", "reserve-twelve"]);

  await write.node("reserve-twelve-contract", {
    key: "fieldwork", kind: "QUEST_STEP", title: "Enter the Vault Window",
    summary: "People and evidence before valuables, in a chamber that has been sealed for twenty years.",
    x: 320, y: 180,
    completion: "Clear the vault, establish the inventory, and get the count out before the mechanism seals.",
    body: `Order of work, and Ward is immovable about it: people, then evidence, then material.

There are people. That is the first thing nobody expects. Two of them, in the vestibule, from the week of the Bloomfall — they got into a reserve vault while the world ended and the mechanism sealed behind them on schedule, and the vault is airtight, and twenty years is twenty years. They are extremely well preserved. One of them is sitting down with their back to the door in a posture that makes the last hours legible in a way nobody in the party is ready for.

Then evidence. The vault's own tally boards, the transfer dockets, the log of what came in during the last week.

Then material, and this is where the nine days start to matter — several tonnes of it, in a chamber four levels down, with a hard stop on the clock and a haul route that depends entirely on which roads are still walkable.

[[reserve-glass]] alone is enough to fund the camp for two years. That fact stands behind every conversation anybody has down here, including the ones about the two people in the vestibule.

And the recovery is not consequence-free: pulling ring segments and cell glass out of a level that was isolated after the first resonance cascade weakens the containment still holding what is left. [[selene-ward]] says so once, flatly, on the first morning. [[jaro-fen]] does not dispute it. It is the only thing all nine days that nobody argues about.`,
  });
  await write.links("reserve-twelve-contract", "fieldwork", ["reserve-vault-twelve", "reserve-glass", "selene-ward"]);

  await write.node("reserve-twelve-contract", {
    key: "the-long-way-round", kind: "SCENE", title: "The Long Way Round",
    summary: "With the surveyed approach gone, nine days is not enough to move several tonnes, and everyone at the adit knows it.",
    x: 540, y: 180,
    body: `The arithmetic breaks the moment somebody costs the haul.

The surveyed approach into [[cairnwood-camp]] is gone, so everything out of this vault goes the long route — an extra day each direction, over ground that needs an escort, past displaced herds and everything that followed them onto the road.

Nine days. Several tonnes. The long way round.

It cannot all come out. That is not a negotiating position, it is a number, and everybody standing at the adit works it out within an hour of each other.

Which changes the quest, quietly, from *who has the better claim* to *what comes out first* — and the two are not the same question at all, because the first has a legal answer and the second does not.

[[jaro-fen]] adapts instantly, because that is his actual talent. He stops arguing about rights and starts arguing about load order, and his proposed load order is entirely reasonable, and it is also — you notice on the second reading — front-weighted with exactly the categories his buyers named.

[[selene-ward]] does not adapt. She does the other thing, which is to state that if the whole inventory cannot be recovered and verified then the whole inventory is contradictory material and it seals with the vault. Legally she is correct. She knows what she is saying. She says it anyway, standing in front of two tonnes of glass that would keep a camp alive for two years, because that is what the duty says and she has not found a way around it that she can live with.`,
  });
  await write.links("reserve-twelve-contract", "the-long-way-round", ["cairnwood-camp", "jaro-fen", "selene-ward", "reserve-glass"]);

  await write.node("reserve-twelve-contract", {
    key: "a-ledger-that-is-short", kind: "SCENE", title: "A Ledger With Two Owners",
    summary: "Two inventory chains, both authentic, both signed, both claiming the same stock — and a public total that reconciles with neither.",
    x: 320, y: 360,
    body: `The tally boards are intact, and that turns out to be the problem.

There are two chains for this vault, and both of them are real. A state chain, countersigned through the [[national-defense-directorate]], carrying authentic signatures for the stock in these cells. And an [[aegis-extraction-consortium]] operations chain, carrying different authentic signatures, for the same stock. Not overlapping. Not ambiguous. The *same* cells, claimed twice, by two record systems that each look exactly like a record system that is telling the truth.

Meridian assay data complicates both, because the assays do not match either chain's grading.

And neither chain reconciles with the public reserve total, which is the figure the whole peninsula's strategic policy has been resting on for twenty years.

Everybody in the vestibule can list the possibilities and nobody can choose between them. Duplication by clerical failure in the last week, when the complex was collapsing and two systems were both trying to record everything. Duplication on purpose, by somebody who has been dead for twenty years. Or a public total that was wrong before any of this started — which is the one nobody says out loud, because it would mean the reserve figures were never real.

There is no evidence in this vault that distinguishes them. There is not going to be. This is what [[a-ledger-with-two-owners]] has always been, and coming down here has not solved it; it has only made it specific.

[[selene-ward]] records the duplication in full and does not speculate, in a hand that has clearly done this before.

[[jaro-fen]] observes — correctly, and without any particular relish — that duplicate ownership is worth money to at least three parties regardless of which explanation is true, that somebody is going to circulate a partial copy, and that it may as well be somebody who will say where it came from.

Nothing here says anything about what caused the Bloomfall. Everybody checks. It does not.`,
  });
  await write.links("reserve-twelve-contract", "a-ledger-that-is-short", ["a-ledger-with-two-owners", "selene-ward", "jaro-fen", "national-defense-directorate", "aegis-extraction-consortium"]);

  await write.node("reserve-twelve-contract", {
    key: "regional-decision", kind: "CHOICE", title: "Custody, Disclosure, or Containment",
    summary: "Two correct claims, one clock, and a discrepancy that hurts somebody whichever way it goes.",
    x: 320, y: 540,
    body: `Nine days are nearly up and the mechanism does not negotiate.

**Salvage.** [[jaro-fen]]'s claim is honoured and the load comes out in his order. The Reach gets material it desperately needs and a functioning market for it, [[reserve-glass]] reaches the camps that need it, and a large fraction of it also reaches buyers whose names are in a case in his hand. He does not pretend otherwise and he is not ashamed of it.

**Custody.** [[selene-ward]]'s authority is honoured and everything recovered goes into Directorate hands, catalogued, contradictory inventory and all. It is the correct call for the evidence and it is a slow, cold, bureaucratic answer to a camp that is short of everything, and it puts several tonnes of material into a system that is not built to give things back.

**Disclosure.** Publish the discrepancy — the count, the tally boards, the four explanations, all of it, without picking one. It detonates a twenty-year-old argument about the pre-Bloomfall reserve figures, embarrasses institutions that will remember it, and is the only branch in which anybody outside this vestibule ever learns the vault was short.

**Seal it.** Take what came out in nine days and let the mechanism close on the rest. Ward's fallback. Nothing is stolen, nothing is lost, nothing is decided, and several tonnes of correctly-specified material goes out of the Reach's reach for years — including, though nobody at this adit is thinking about it, the last components a certain maintenance construct out at [[splicefield-substation]] still needs.`,
  });
  await write.links("reserve-twelve-contract", "regional-decision", ["jaro-fen", "selene-ward", "reserve-glass", "a-ledger-with-two-owners"]);

  await write.node("reserve-twelve-contract", {
    key: "intervention-outcome", kind: "ENDING", endingKind: "NEUTRAL", title: "The Mechanism Closes",
    summary: "Nine days end on schedule and somebody is holding the ledger.",
    x: 200, y: 760,
    body: `The vault seals on the ninth day at the hour the mechanism says, with whatever is still inside it inside it.

**Salvage**, and the Reach has material, and the freight going out through [[ashline-exchange]] is the heaviest that junction has carried since the evacuation, and roughly a third of it is on a boat within the month going somewhere that is not here. Fen pays what he said he would pay, to the hour. He always does. That is why people keep dealing with him and why [[selene-ward]] will not.

**Custody**, and it is all correctly catalogued in a Directorate store, and Cairnwood applies for a release, and the application is progressing.

**Disclosure**, and the twenty-year argument about the reserve figures reopens with actual numbers in it. Nobody is charged. Nobody could be. Three institutions issue statements, one of which is very good and none of which explains the discrepancy, and the four possibilities stay four possibilities forever.

**Sealed**, and nothing leaves, and nothing is decided, and everybody goes home with clean hands and the camp goes into winter short.

The two people in the vestibule are brought out under all four branches. Ward insisted on that before anyone had begun arguing, and it is the only thing that happened in nine days that nobody disputed.`,
    effects: ["The vault's contents are dispersed, held, published, or sealed.", "The discrepancy remains unexplained under every branch."],
  });
  await write.links("reserve-twelve-contract", "intervention-outcome", ["reserve-vault-twelve", "jaro-fen", "selene-ward", "ashline-exchange"]);

  await write.node("reserve-twelve-contract", {
    key: "nobody-came", kind: "ENDING", endingKind: "NEUTRAL", title: "Nobody Came",
    summary: "The vault cycles closed with the argument still going on outside it.",
    x: 460, y: 760,
    body: `Nine days pass in negotiation and the mechanism seals on schedule.

Some material came out — whatever two parties with incompatible authority could agree to move while they were arguing, which is less than either would admit to afterwards. Most of it is still in there. It will be in there for years.

Pressure transfers, the way it always does. Buyers who were promised [[reserve-glass]] from Twelve go to a neighbouring sector and start asking harder questions there, and the salvage crews working that sector are less careful than Fen's people, and two of them do not come back that season.

And the ledgers circulate. This is the part that outlasts everything: partial copies of the vault tally, taken by whoever was standing near the boards, none of them complete, none of them agreeing. [[jaro-fen]] has one. The Directorate has one. A third changes hands in a freight office at [[ashline-exchange]] within the year, for a great deal less than it is worth.

So the discrepancy becomes public in the worst possible form — as rumour, in fragments, with no authority behind any version, and everyone free to pick the explanation that suits them. Twenty years of argument about [[a-ledger-with-two-owners]] gets a second twenty years and worse evidence.

The two people in the vestibule are still in there. Nobody agreed on whose responsibility that was, so it was nobody's.`,
    effects: ["set flag: reserve-twelve-sealed", "Rival partial ledgers circulate with no authoritative version.", "Pressure transfers to a neighbouring sector and costs lives there."],
  });
  await write.links("reserve-twelve-contract", "nobody-came", ["reserve-vault-twelve", "a-ledger-with-two-owners", "jaro-fen", "ashline-exchange"]);

  await write.edge("reserve-twelve-contract", { from: "regional-alert", to: "fieldwork", label: "Go in on the first day" });
  await write.edge("reserve-twelve-contract", { from: "regional-alert", to: "nobody-came", label: "Let them argue it out" });
  await write.edge("reserve-twelve-contract", { from: "fieldwork", to: "the-long-way-round", label: "The haul route is gone", condition: "cairnwood-approach-lost" });
  await write.edge("reserve-twelve-contract", { from: "fieldwork", to: "a-ledger-that-is-short", label: "Read the chains" });
  await write.edge("reserve-twelve-contract", { from: "the-long-way-round", to: "a-ledger-that-is-short" });
  await write.edge("reserve-twelve-contract", { from: "a-ledger-that-is-short", to: "regional-decision" });
  await write.edge("reserve-twelve-contract", { from: "regional-decision", to: "intervention-outcome", label: "Honour the salvage claim", effects: ["Material reaches the Reach and a third of it leaves on a boat."] });
  await write.edge("reserve-twelve-contract", { from: "regional-decision", to: "intervention-outcome", label: "Honour containment authority", effects: ["Everything recovered enters a Directorate store; Cairnwood applies for release."] });
  await write.edge("reserve-twelve-contract", { from: "regional-decision", to: "intervention-outcome", label: "Publish the discrepancy", effects: ["The reserve-figures argument reopens with real numbers and no culprit."] });
  await write.edge("reserve-twelve-contract", { from: "regional-decision", to: "intervention-outcome", label: "Let it seal", effects: ["set flag: reserve-twelve-sealed", "Several tonnes of correctly-specified material leaves circulation for years."] });
  await write.retireEdge("reserve-twelve-contract", "fieldwork", "a-ledger-that-is-short", "Take the count",
    "renamed: the vault's problem is two authentic chains, not a short count");
  await write.retireEdge("reserve-twelve-contract", "regional-alert", "fieldwork", null, "the opening branches, so both routes out of it carry choice text");
  await write.retireEdge("reserve-twelve-contract", "fieldwork", "regional-decision", null, "the chains and the haul are read before anyone decides");
  await write.retireEdge("reserve-twelve-contract", "regional-decision", "intervention-outcome", "Intervene before the regional state closes", "replaced by the four named dispositions");
  await write.retireEdge("reserve-twelve-contract", "regional-decision", "nobody-came", "The incident resolves without the party", "Nobody Came is the mechanism sealing mid-argument");

  write.report(apply ? "Bloomfall — the ring closes — APPLYING" : "Bloomfall — the ring closes — dry run");
}

main().then(() => db.$disconnect(), (error) => { console.error(error); return db.$disconnect().then(() => process.exit(1)); });
