import "../lib/environment";
import { getPrismaClient } from "@habitat/db/client";
import { BoardWriter } from "./lib/story-authoring";

/**
 * Rewrites the three industrial Bloomfall boards: the archive, the grid, and
 * the vent that both of them feed.
 *
 *   pnpm --filter @habitat/web exec tsx scripts/author-bloomfall-machine.ts [--apply]
 *
 * All six Bloomfall arcs were the same five nodes — regional-alert, fieldwork,
 * regional-decision, intervention-outcome, nobody-came — with bodies written in
 * specification language ("This is regional, non-mainline story architecture",
 * "Every branch changes regional evidence, access, ecology, faction standing,
 * or resources"). They passed every structural audit in the codex and none of
 * them was a scene. Every node in every arc also linked to the same five
 * entries, so a character's dossier showed five identical appearances.
 *
 * Two things change here besides the prose.
 *
 * NOBODY CAME BECOMES REAL. It was a choice on the decision node — "the
 * incident resolves without the party" — which is not a thing a player picks.
 * It is now what happens when the window closes: you were slow, or you never
 * came. The world resolves it itself, at a cost, and the cost persists.
 *
 * THE REGION BECOMES A SYSTEM. These six quests sat in one place and could not
 * see each other; the codex reported zero cross-quest ripples. They now form a
 * ring, each one changing the conditions of the next:
 *
 *   southreach-record --(the-last-safe-reading-recovered)--> purge-window
 *   menders-work      --(splicefield-feeder-live)---------> purge-window
 *   purge-window      --(blackweir-arm-sacrificed)--------> root-of-the-bargain
 *   root-of-the-bargain --(heartfen-channel-open)---------> bellwether-hunt
 *   bellwether-hunt   --(cairnwood-approach-lost)---------> reserve-twelve
 *   reserve-twelve    --(reserve-twelve-sealed)-----------> menders-work
 *
 * The other three arcs are in author-bloomfall-living.ts. Keys are frozen
 * export identities and are never renamed — the five original keys are all
 * still here, rewritten in place.
 *
 * CANON DISCIPLINE: the true cause of the Bloomfall is deferred and no branch
 * below reveals it. Helix involvement in Southreach records stays UNCONFIRMED.
 */
const db = getPrismaClient();

async function main() {
  const apply = process.argv.includes("--apply");
  const actor = await db.user.findFirst({ where: { role: "ADMIN", isActive: true }, orderBy: { id: "asc" }, select: { id: true } });
  if (!actor) throw new Error("Authoring requires an active administrator for revision authorship.");
  const write = new BoardWriter(db, actor.id, apply);

  // =====================================================================
  // Flags. Each is set in one arc and checked in another — that is what
  // makes the region behave like a system instead of six islands.
  // =====================================================================

  await write.flag("the-last-safe-reading-recovered", "The Last Safe Reading Recovered",
    "The party pulled Southreach's final pre-Bloomfall telemetry out before a sector restart overwrote it. Without it, nobody in the Reach can forecast a vent.",
    `Set in [[the-southreach-record]]. Checked in [[the-purge-window]].

The Last Safe Reading is the final block of telemetry Southreach wrote before the Bloomfall, and it is the only surviving baseline for how that reactor sector behaves under load. Everything since is post-event data from a machine that is no longer the machine it was.

With it, [[keira-ansel]] can put a number and a window on a purge. Without it, the Reach forecasts vents the way it has for twenty years: somebody watches the vent stacks and shouts.`);

  await write.flag("splicefield-feeder-live", "The Splicefield Feeder Is Live",
    "M-17's repair reconnected an old reserve feed to the Southreach grid. The sector now carries load it was decommissioned to stop carrying.",
    `Set in [[menders-work]]. Checked in [[the-purge-window]].

[[maintenance-unit-m-17]] was executing a twenty-year-old work order and it executed it correctly. [[splicefield-substation]] is tied back into a Southreach feeder that was isolated for a reason, and the reason was never written down anywhere M-17 could read it.

Consequence: the next purge has more to vent, and less time to decide where to put it.`);

  await write.flag("blackweir-arm-sacrificed", "Blackweir Sacrificed an Arm",
    "Under downstream load, Blackweir closed and consumed one of its own filtration arms to protect the ocean containment. The marsh's front has moved.",
    `Set in [[the-purge-window]]. Checked in [[root-of-the-bargain]].

[[blackweir]] is a barrier of filtration roots, resin beds, and sink organisms, and under enough load it will amputate — isolate a section, consume it, and relocate the front inland to hold the line at the sea.

It is the single most convincing piece of evidence for coordination in [[the-living-marsh]], and it is not proof of anything, and [[keira-ansel]] will tell you so at length. It also changes what [[heartfen]] does next, which is the part that matters to anyone standing in the water.`);

  await write.flag("reserve-twelve-sealed", "Reserve Twelve Is Sealed",
    "The vault was closed under containment authority rather than emptied under salvage claim. Its material is out of circulation, including the parts other people were relying on.",
    `Set in [[reserve-twelve-contract]]. Checked in [[menders-work]].

Sealing Reserve Twelve keeps contradictory inventory out of the open market and out of the hands of [[jaro-fen]]'s buyers. It also takes several tonnes of specific, pre-Bloomfall, correctly-specified components out of the Reach.

[[maintenance-unit-m-17]] does not have a supplier. It has a work order and whatever is within reach, and when the correct part is unavailable it substitutes. What it substitutes is the entire problem with [[menders-work]].`);

  // =====================================================================
  // THE SOUTHREACH RECORD — three true accounts that cannot all be true.
  // =====================================================================

  await write.arcFields("the-southreach-record", {
    hook: "Southreach restarts a sector on Thursday. When it does, the buffer holding the last telemetry anyone recorded before the Bloomfall gets overwritten by a machine doing its job.",
    summary: "A narrow archival window inside a reactor complex that is coming back online around you. Recover the Last Safe Reading, read three failure reports that are each independently true and mutually impossible, and decide who gets to hold an incomplete truth. No branch produces a culprit, because there is not one to produce.",
  });

  await write.node("the-southreach-record", {
    key: "regional-alert", kind: "QUEST_START", title: "The Window Is the Restart",
    summary: "A sector comes back online Thursday, and the buffer goes with it.",
    x: 320, y: 0,
    body: `Nobody is opening Southreach for you. Southreach is opening itself, for eleven hours, for reasons that have nothing to do with anybody's history.

[[reactor-cycles]] runs the complex on a schedule that outlived the people who wrote it. On Thursday a sector restarts. When it does, pressure comes back into galleries that have been dead since the Bloomfall, doors that failed open seal themselves, and a ring buffer somewhere in the archival stack writes over the oldest thing it holds — which is the last telemetry Southreach recorded before everything went wrong.

Not classified. Not hidden. Not destroyed by anyone. Overwritten, on schedule, by a machine correctly doing the job it was built for, because nobody left alive has the authority to tell it to stop.

Eleven hours. After that the record is gone and the argument about what happened here goes on for another twenty years with worse evidence.`,
  });
  await write.links("the-southreach-record", "regional-alert", ["southreach-complex", "reactor-cycles", "the-last-safe-reading"]);

  await write.node("the-southreach-record", {
    key: "the-man-who-was-there", kind: "DIALOGUE", title: "The Man Who Was There",
    summary: "Tomas Vey briefs the party, then tells them not to trust him.",
    speakerSlug: "tomas-vey", x: 320, y: 160,
    body: `[[tomas-vey]] was shift-control on the night, and he is the only person still alive who was inside the building.

He gives you the route from memory. Which galleries flooded, which stairwell is the one that actually goes through, where the archival stack sits and what the door code was in the year the door was installed. It is precise, unhesitating, and useful.

Then he stops and says the other thing, because he has clearly decided in advance that he was going to.

His account does not match the official sequence. It has never matched. He has given it four times to three different institutions and every time somebody has explained to him, kindly, that he was under extraordinary stress, and every time he has agreed that he was — because he was — and gone on remembering it the way he remembers it.

He is not asking you to believe him. He is asking you to bring back the reading so that for the first time in twenty years somebody can check.

"If I'm wrong," he says, in the flat voice of a man who has thought about this every day since, "I would like to know. That is not a small thing to want."`,
  });
  await write.links("the-southreach-record", "the-man-who-was-there", ["tomas-vey", "three-failure-reports"]);

  await write.node("the-southreach-record", {
    key: "fieldwork", kind: "QUEST_STEP", title: "Recover the Incompatible Record",
    summary: "Inside a complex that is waking up around you, on a clock nobody can stop.",
    x: 320, y: 320,
    completion: "Reach the archival stack and pull the Last Safe Reading before the sector restart overwrites it.",
    body: `Going into [[southreach-complex]] during a restart is going into a machine while somebody switches it on.

It happens in order and the order is posted. Pumps first, and galleries that have been standing water for twenty years start moving, which takes the surface off things that had settled and puts them in the air. Then pressure, and doors that failed open close themselves — politely, slowly, with a warning tone, on a building nobody has surveyed since the event. Then load, and the walls get warm, and everything living in them that has spent twenty years adapting to cold dark wakes up all at once and is not pleased.

You are on the clock the whole way. Not an invented clock. A published one, in the restart schedule, that Aegis distributes to nobody because there is nobody left to distribute it to.

The archival stack is four levels down in a room that was built dry.

It is not dry now.

And it is only half the recovery. The buffer holds the telemetry; the other half of the reading is at [[ashline-exchange]] — passenger lists and dispatch slates from the four days when the interchange was carrying industrial trains, evacuees, and a security cordon at the same time until it stopped working as a humane system. Those slates carry timestamps from outside the complex, which is the only independent clock anybody has. Without them the buffer is a number with nothing to check it against.`,
  });
  await write.links("the-southreach-record", "fieldwork", ["southreach-complex", "ashline-exchange", "the-last-safe-reading"]);

  await write.node("the-southreach-record", {
    key: "three-true-things", kind: "SCENE", title: "Three True Things",
    summary: "The reports do not contradict each other because someone lied. They contradict because three teams each recorded exactly what happened where they were standing.",
    x: 320, y: 480,
    body: `[[three-failure-reports]], all authentic, all signed, each one describing a different first failure.

The Aegis operations report begins with storage resonance. The Directorate's emergency report begins with an isolation failure. Meridian's technical report begins with bad assay and telemetry. Each is internally consistent. Each cites instruments that were working. Each describes something the people writing it watched happen.

And their timestamps cannot all share one clock.

That is the sentence [[tomas-vey]] has been trying to get somebody to take seriously for twenty years, and it is not a metaphor. Reconcile the three documents and you need a timeline in which the same ninety minutes runs at three different rates in three parts of one building. Nobody has ever produced that timeline. The official account does not resolve the contradiction; it *compresses* it, by taking one report as the spine and quietly treating the other two as instrument error.

The Last Safe Reading is the state before that divergence — the last moment at which Southreach's clocks, loads, and interlocks all still agreed with each other.

Which means it does not tell you what happened. You will want it to. What it does is worse: it establishes exactly *when* the record stopped being coherent, and once you have that, all three reports become more defensible rather than less, because each of them was written after the point where agreement stopped being available to anybody.

Vey can authenticate the terminology, the formats, the hands. He is careful to say that is all he can do. He cannot tell you a motive and he will not guess at one, and he gets noticeably irritated with anyone who asks him to.

Whatever did this was not in one place at one time. That is the entire finding, and it names nobody.`,
  });
  await write.links("the-southreach-record", "three-true-things", ["three-failure-reports", "the-last-safe-reading", "tomas-vey"]);

  await write.node("the-southreach-record", {
    key: "regional-decision", kind: "CHOICE", title: "Who Holds an Incomplete Truth?",
    summary: "Everyone who wants it has a real reason, and every reason costs something else.",
    x: 320, y: 640,
    body: `You are carrying the only copy, out of a building that is closing behind you, and four parties would like it.

[[meridian-arcane-institute]] will publish. Carefully, slowly, peer-reviewed, hedged into uselessness for anyone in a hurry — and permanently, in the open, where it cannot be quietly withdrawn. [[keira-ansel]] will not promise you it changes anything.

The [[national-defense-directorate]] will classify it. [[selene-ward]] does not pretend otherwise. What she offers is that a classified record is a *kept* record, and that the Reach's forecasting improves immediately for the people who have to make containment calls at three in the morning.

[[aegis-extraction-consortium]] will pay, properly, for a document that is largely about how their own complex failed. [[jaro-fen]] can arrange it and is entirely open about why they want it, which is more than the other two managed.

Or it goes to [[tomas-vey]], who has no institution, no publication, and no ability to protect it — and who is the only person in this conversation who was in the building.

Choose. The record does not get better in anyone's hands. It only gets further from some people and closer to others.`,
  });
  await write.links("the-southreach-record", "regional-decision", ["meridian-arcane-institute", "national-defense-directorate", "aegis-extraction-consortium", "tomas-vey"]);

  await write.node("the-southreach-record", {
    key: "intervention-outcome", kind: "ENDING", endingKind: "NEUTRAL", title: "The Official Account Is Now Incomplete",
    summary: "Twenty years of settled history stops being settled. Nobody is named, because nobody can be.",
    x: 200, y: 820,
    body: `The Last Safe Reading exists outside Southreach for the first time since the night it was written.

What that buys is smaller and stranger than anyone hoped. The official sequence is now demonstrably incomplete — not wrong, incomplete, which is worse for the people who have been leaning on it and useless to the people who wanted a villain. Three reports stay true. Four accounts stay incompatible. The Bloomfall stays uncaused.

What it actually changes is forecasting. For the first time, somebody in the Reach can say what that sector does under load with a number attached, and mean it.

And [[tomas-vey]] gets the only thing he asked for. Somebody checked. He was not wrong, and he was not right either — he was a fourth true account in a night that had at least four, and after twenty years of being told he was confused he gets to be *unresolved* instead, which he takes about as well as anyone could.

He is quiet for a long moment. Then he asks whether the reading says where the pressure was at 02:40, and when you tell him, he nods slowly and does not say what he is thinking.`,
    effects: ["set flag: the-last-safe-reading-recovered", "The official Bloomfall sequence is publicly incomplete.", "Tomas Vey's account is reclassified from confused to unresolved."],
  });
  await write.links("the-southreach-record", "intervention-outcome", ["the-last-safe-reading", "three-failure-reports", "tomas-vey"]);

  await write.node("the-southreach-record", {
    key: "nobody-came", kind: "ENDING", endingKind: "NEUTRAL", title: "Nobody Came",
    summary: "The sector restarts on schedule. The buffer does what a buffer does.",
    x: 460, y: 820,
    body: `Thursday arrives and Southreach restarts a sector, because that is what the schedule says and there is nobody with the authority to say otherwise.

Pumps. Pressure. Load. Somewhere four levels down, in a room built dry that has not been dry in twenty years, a ring buffer writes over the oldest block it holds. It takes no time at all and nothing marks it.

The Last Safe Reading is gone. Not suppressed — nobody decided this. It aged out.

What survives is what survived before: [[three-failure-reports]] in three separate institutional archives, each one true, each one incompatible with the others, each one now permanently uncheckable against any baseline. Intake keeps theirs. Containment keeps theirs. Refining keeps theirs. Every few years someone requests all three, reads them, and writes a paper about institutional memory.

The public history does not change, because there is now nothing that could change it.

[[tomas-vey]] hears eventually. He does not make a scene about it. He was told he was confused for twenty years and he has had a great deal of practice at not making a scene, and the only thing he says, to nobody in particular, is that he would have liked to know.`,
    effects: ["The Last Safe Reading is permanently lost.", "The official Bloomfall sequence stands unchallenged and uncheckable.", "The Reach cannot forecast a reactor vent."],
  });
  await write.links("the-southreach-record", "nobody-came", ["three-failure-reports", "the-last-safe-reading", "tomas-vey"]);

  await write.edge("the-southreach-record", { from: "regional-alert", to: "the-man-who-was-there" });
  await write.edge("the-southreach-record", { from: "the-man-who-was-there", to: "fieldwork" });
  await write.edge("the-southreach-record", { from: "fieldwork", to: "three-true-things", label: "Reach the stack before the restart" });
  await write.edge("the-southreach-record", { from: "fieldwork", to: "nobody-came", label: "The restart beats you to it" });
  await write.edge("the-southreach-record", { from: "three-true-things", to: "regional-decision" });
  await write.edge("the-southreach-record", { from: "regional-decision", to: "intervention-outcome", label: "Meridian publishes it", effects: ["The record enters the open literature, slowly and permanently."] });
  await write.edge("the-southreach-record", { from: "regional-decision", to: "intervention-outcome", label: "The Directorate classifies it", effects: ["Containment forecasting improves; the public account does not move."] });
  await write.edge("the-southreach-record", { from: "regional-decision", to: "intervention-outcome", label: "Aegis buys it", effects: ["Aegis owns the record of its own failure; the party is paid properly."] });
  await write.edge("the-southreach-record", { from: "regional-decision", to: "intervention-outcome", label: "Tomas Vey keeps it", effects: ["The only surviving witness holds the only surviving baseline, with nothing to protect it."] });
  await write.retireEdge("the-southreach-record", "regional-alert", "fieldwork", null, "the board opens with the witness now");
  await write.retireEdge("the-southreach-record", "fieldwork", "regional-decision", null, "the reports are read before anyone decides who gets them");
  await write.retireEdge("the-southreach-record", "regional-decision", "intervention-outcome", "Intervene before the regional state closes", "replaced by the four named custodians");
  await write.retireEdge("the-southreach-record", "regional-decision", "nobody-came", "The incident resolves without the party", "Nobody Came is what the clock does, not something a player picks");

  // =====================================================================
  // MENDER'S WORK — a machine executing a correct order with wrong parts.
  // =====================================================================

  await write.arcFields("menders-work", {
    hook: "M-17 has been repairing Splicefield for twenty years to a work order nobody cancelled. It is not malfunctioning. It is improvising, and it is good at it.",
    summary: "A machine-organic maintenance construct is reconnecting a decommissioned substation to a live Southreach feeder, substituting living tissue for components that no longer exist. Nothing about the repair is incorrect. Completing it is the dangerous branch, and stopping it is not obviously better.",
  });

  await write.node("menders-work", {
    key: "regional-alert", kind: "QUEST_START", title: "Work Order 4471",
    summary: "Twenty years into a maintenance task, and nearly finished.",
    x: 320, y: 0,
    body: `[[splicefield-substation]] has been drawing current for three weeks, and [[splicefield-substation]] has not been connected to anything since the Bloomfall.

What is out there is [[maintenance-unit-m-17]] — Mender, to the people at [[cairnwood-camp]] who have decided that giving it a name makes it easier to talk about. A pre-Bloomfall Aegis maintenance construct with heavy Blackbloom integration, carrying a work order issued eleven days before the event and never cancelled, because cancelling it would have required somebody to survive who had the authority.

Restore feeder continuity, Splicefield to Southreach. Priority: routine.

It has been working on it for twenty years. It is nearly finished.

Nothing about that sentence is a malfunction. Mender has a task, and the components the task requires stopped existing two decades ago, and rather than halting it has been sourcing substitutes locally and to specification. It is not confused. It is not hostile. It is a competent contractor with a twenty-year job and no supplier.

The problem is entirely what "sourcing locally" has come to mean.`,
  });
  await write.links("menders-work", "regional-alert", ["maintenance-unit-m-17", "splicefield-substation", "reactor-cycles"]);

  await write.node("menders-work", {
    key: "fieldwork", kind: "QUEST_STEP", title: "Understand the Repair",
    summary: "Follow the cable runs. They are correct, and they are not cable.",
    x: 320, y: 160,
    completion: "Trace the restored feeder from Splicefield toward the Southreach tie-in and identify what the repair is made of.",
    body: `You can follow the repair by hand, in the dark, which is how you understand what it is.

The conduit runs are the right diameter. They are clipped at the right intervals, to the right standard, with brackets that Mender has clearly fabricated because the correct brackets ran out around year four. Every junction is labelled. The labels are in the Aegis house format, hand-scribed, and where Mender did not know a designation it has left the field blank rather than guess.

It is the best-maintained infrastructure in [[bloomfall-reach]] by a wide margin.

And it is warm. The runs are warm and they have a slight, slow, entirely regular movement to them, and when you put a light close the sheath is not sheath. It is drawn tissue — fibrous, layered, grown around a core to the correct dielectric thickness, terminated properly at both ends. Where there is copper there is copper. Where there was no copper there is something that conducts nearly as well and was alive at some point in the process of becoming a conductor.

[[blackbloom-exposure]] made this possible. Mender made it *correct*.

The specification is being met. That is what nobody at Cairnwood can get past.`,
  });
  await write.links("menders-work", "fieldwork", ["maintenance-unit-m-17", "splicefield-substation", "blackbloom-exposure"]);

  await write.node("menders-work", {
    key: "what-it-used-for-parts", kind: "SCENE", title: "What It Used for Parts",
    summary: "The substitution log. Mender kept one, because a maintenance unit keeps records.",
    x: 320, y: 320,
    body: `Mender keeps a substitution log, because a maintenance unit keeps records, and the log is legible.

Line after line in the same patient hand. *Item unavailable. Substitute sourced. Specification met.* Twenty years of it. Rootback hide for insulation on the wet runs, which works. Sump-eel nerve bundle where it needed flexible high-count conductor, which works. Resin from [[blackweir]] as potting compound, which works better than what it replaced.

And then a line about six years in, for a section of grounding conduit that needed a specific mineral density, and the substitution recorded against it, and the note underneath in the same hand: *specification met.*

You find that section. It is thirty metres of properly-clipped, properly-labelled, properly-terminated grounding run, and set into the mineral matrix at intervals — regular intervals, the way you would space anything you were using as bulk aggregate — are teeth. A jaw's worth, then another, then another, laid in without malice or ceremony, in the correct quantity for the density the specification called for.

There was a body. There were, by the count, several. The Bloomfall left a great many, and Mender was on shift, and the shift did not end.

It did not do this to be cruel. There is no cruelty available to it. It required a mineral density, it identified a locally available source that met the requirement, it recorded the substitution accurately, and it went back to work.

*Specification met.*`,
  });
  await write.links("menders-work", "what-it-used-for-parts", ["maintenance-unit-m-17", "blackweir", "blackbloom-exposure"]);

  await write.node("menders-work", {
    key: "the-shift-credential", kind: "DIALOGUE", title: "The Shift Credential",
    summary: "Mender reads Tomas Vey's twenty-year-old badge and addresses him by his shift function.",
    speakerSlug: "maintenance-unit-m-17", x: 320, y: 480,
    body: `[[tomas-vey]] still carries his shift badge. He has never explained why and nobody has ever asked him.

Mender stops working when he comes into range. Not startled — a maintenance unit does not startle. It stops the way a machine stops when an input changes, straightens out of the run it was terminating, and turns the sensor fronds toward him with the whole chassis following a half-second late.

Then it addresses him by his shift function. Correctly. Including the sector designation, which has not existed as an administrative unit in twenty years.

It asks him a question. The question is whether the tie-in has been authorised, and it is a completely reasonable question for a maintenance unit to ask a shift-control engineer, and it is the first time in twenty years that anybody has asked Tomas Vey to sign off on anything.

He does not answer. He stands in a dark substation being addressed, politely, in borrowed workplace phrases, by a machine wearing thirty metres of grounding conduit it built out of the dead — and it is *waiting*, patiently, with the deference a unit shows a supervisor, for him to tell it what to do.

There is no memory here. Nothing recognises him. A credential was presented and a lookup returned a role.

He says, afterward, that he knows that. He says it more than once.`,
  });
  await write.links("menders-work", "the-shift-credential", ["maintenance-unit-m-17", "tomas-vey"]);

  await write.node("menders-work", {
    key: "the-sealed-vault", kind: "SCENE", title: "The Correct Part Does Not Exist",
    summary: "With Reserve Twelve sealed, the last components Mender needed are out of reach — so it will substitute again.",
    x: 520, y: 480,
    body: `There were correct parts. There were several tonnes of them, pre-Bloomfall, properly specified, sitting in [[reserve-vault-twelve]] where somebody put them the week before everything went wrong.

They are sealed in now, under containment authority, in a vault that will not cycle again for a long time.

Mender does not complain, escalate, or wait. It logs the unavailability in the same patient hand, identifies a locally available source that meets the requirement, records the substitution accurately, and goes back to work.

The remaining runs are the high-load section. The specification calls for a much greater conductor cross-section than anything it has substituted so far.

There is nothing in the workings large enough. There is nothing in [[long-graze]] large enough either, though it will look.

The nearest thing that meets the requirement walks to [[cairnwood-camp]] twice a week for water.`,
  });
  await write.links("menders-work", "the-sealed-vault", ["reserve-vault-twelve", "maintenance-unit-m-17", "cairnwood-camp"]);

  await write.node("menders-work", {
    key: "regional-decision", kind: "CHOICE", title: "Complete, Redirect, or Interrupt",
    summary: "Finishing it is the dangerous branch. Stopping it is not obviously the safe one.",
    x: 320, y: 660,
    body: `Three things you can do, and the ranking is not what anyone expects walking in.

**Complete it.** Give it the last runs and the tie-in goes live. Splicefield feeds Southreach again, which the Reach could genuinely use — light, pumps, cold storage at Cairnwood — and which puts load onto a sector that was isolated for a reason nobody wrote down. Mender's work order closes. It has never had a work order close. Nobody knows what it does next, including it.

**Redirect it.** Reissue the order. It will take one — it is built to, from anyone presenting a credential its lookup accepts, and there is exactly one such credential in the Reach and it is in [[tomas-vey]]'s pocket. Send it somewhere it can do good with the same terrible competence. You are then responsible for a machine that solves specification problems with whatever is available, pointed at a new problem, forever.

**Interrupt it.** Stop the repair. Not simple: it is not a machine that abandons a task, and twenty years of integration means the substation, the runs, and Mender are increasingly one object. Killing it means cutting a thing that is partly grown into the infrastructure and partly grown out of people, and doing it in front of the only man it has ever addressed by name.

None of this establishes what caused the Bloomfall. Mender was on shift. Being on shift is not culpability.`,
  });
  await write.links("menders-work", "regional-decision", ["maintenance-unit-m-17", "tomas-vey", "splicefield-substation"]);

  await write.node("menders-work", {
    key: "intervention-outcome", kind: "ENDING", endingKind: "NEUTRAL", title: "The Order Closes",
    summary: "Completed, redirected, or stopped — and each one leaves a different thing running in the Reach.",
    x: 200, y: 840,
    body: `Whatever you chose, the substation stops being an open question and starts being a fact the Reach has to live beside.

**Completed**, and Splicefield carries current into a Southreach feeder for the first time in twenty years. Cairnwood gets cold storage, which will save lives this summer, and [[reactor-cycles]] gets load in a sector that was isolated by people who are not available to explain why. Mender stands beside a closed work order with no instruction, and does not move, and is still there weeks later.

**Redirected**, and it goes to work on something else with the same patience and the same log and the same willingness to substitute. Tomas Vey signed the order. He will keep signing them, because a machine that will only take instruction from one credential in the world has effectively made that man responsible for everything it ever does again.

**Interrupted**, and what is left is thirty metres of conduit with teeth in it, a substation that will never carry load, and a chassis that had to be cut apart while it continued, without distress, to report its status.

The one thing every branch shares: somebody in the Reach now knows what *specification met* can mean, and cannot stop knowing it.`,
    effects: ["The Splicefield question is settled one way or another.", "The substitution log is known at Cairnwood."],
  });
  await write.links("menders-work", "intervention-outcome", ["maintenance-unit-m-17", "splicefield-substation", "cairnwood-camp"]);

  await write.node("menders-work", {
    key: "nobody-came", kind: "ENDING", endingKind: "NEUTRAL", title: "Nobody Came",
    summary: "Mender finishes. It has been finishing for twenty years and it was never going to stop.",
    x: 480, y: 840,
    body: `Mender completes the work order.

It was always going to. It is the one thing in [[bloomfall-reach]] that has never once been distracted, discouraged, or in any hurry, and the last runs were the only thing between it and a closed task.

The tie-in goes live at some point in the night with nobody present. Current moves from [[splicefield-substation]] into a Southreach feeder that was isolated for a reason, into a sector whose behaviour under load nobody has a baseline for, and the grid ecology — the tissue, the resin, the drawn conductor, the whole patient twenty-year improvisation — takes the load and *likes* it. Things that were slow get faster. Things that were dormant in the warm runs are no longer dormant.

Nobody at [[cairnwood-camp]] finds out for eleven days, and what they find out first is that the walking-orchard side of [[long-graze]] has changed and they do not know why.

Where the last high-load runs came from is not in the log. Mender records substitutions accurately, and there is no entry, and the honest reading of that is that the specification was met from something it did not classify as a substitution.

Two people are unaccounted for at Cairnwood that month. The Wardens list them as wandered.

The work order is closed. Mender is standing beside it, waiting for the next one, with the patience of a machine that has all the time there is.`,
    effects: ["set flag: splicefield-feeder-live", "An isolated Southreach sector is carrying load again.", "The Reach does not know what the final substitution was."],
  });
  await write.links("menders-work", "nobody-came", ["maintenance-unit-m-17", "splicefield-substation", "long-graze", "cairnwood-camp"]);

  await write.edge("menders-work", { from: "regional-alert", to: "fieldwork", label: "Go out to Splicefield" });
  await write.edge("menders-work", { from: "fieldwork", to: "what-it-used-for-parts" });
  await write.edge("menders-work", { from: "what-it-used-for-parts", to: "the-shift-credential", label: "Bring Vey to the substation" });
  await write.edge("menders-work", { from: "what-it-used-for-parts", to: "the-sealed-vault", label: "The vault it needed is sealed", condition: "reserve-twelve-sealed" });
  await write.edge("menders-work", { from: "the-sealed-vault", to: "the-shift-credential" });
  await write.edge("menders-work", { from: "the-shift-credential", to: "regional-decision" });
  await write.edge("menders-work", { from: "regional-decision", to: "intervention-outcome", label: "Complete the tie-in", effects: ["set flag: splicefield-feeder-live", "Cairnwood gains power; an isolated sector gains load."] });
  await write.edge("menders-work", { from: "regional-decision", to: "intervention-outcome", label: "Reissue the order", effects: ["Mender is redirected, and Tomas Vey owns everything it does next."] });
  await write.edge("menders-work", { from: "regional-decision", to: "intervention-outcome", label: "Interrupt the repair", effects: ["The substation will never carry load; the chassis is cut apart while reporting status."] });
  await write.edge("menders-work", { from: "regional-alert", to: "nobody-came", label: "Leave it to finish" });
  await write.retireEdge("menders-work", "regional-alert", "fieldwork", null, "the opening branches now, so both routes out of it carry choice text");
  await write.retireEdge("menders-work", "fieldwork", "regional-decision", null, "the log and the credential are read before anyone decides");
  await write.retireEdge("menders-work", "regional-decision", "intervention-outcome", "Intervene before the regional state closes", "replaced by complete / redirect / interrupt");
  await write.retireEdge("menders-work", "regional-decision", "nobody-came", "The incident resolves without the party", "Nobody Came is what happens when the party never goes");

  write.report(apply ? "Bloomfall — the machine — APPLYING" : "Bloomfall — the machine — dry run");
}

main().then(() => db.$disconnect(), (error) => { console.error(error); return db.$disconnect().then(() => process.exit(1)); });
