import "../lib/environment";
import { randomUUID } from "node:crypto";
import { getPrismaClient, type Prisma } from "@habitat/db/client";
import { BoardWriter, stableJson } from "./lib/story-authoring";

/**
 * Step 7 — the vertical slice.
 *
 * All forty-nine SYSTEM entries have sat at `concept` since the kind was
 * added, so nothing in the codex demonstrated what leaving it looks like. This
 * takes the Soul Forge family — the machine, the binding, the reclamation — to
 * `designed`, and it is the Soul Forge because that system is the setting's
 * moral engine: death, and the reason a world full of people harvest each
 * other for magic.
 *
 * Going vertical meant going down as well as across. Writing the numbers
 * exposed a hole nobody had noticed: the binding scene is described in detail
 * in three separate dossiers — the system, the region note, and Rook's own
 * character sheet, which calls it "the scene that teaches soul-binding" — and
 * it does not exist on any board. The prologue runs TUTORIAL COMPLETE straight
 * into the operations table. So this writes it.
 *
 * Preview by default; --apply writes.
 */

const db = getPrismaClient();

type EntryEdit = { slug: string; append: string; meta: Record<string, unknown>; note: string };

// ---------------------------------------------------------------------------
// The three system dossiers. Each APPENDS a design layer to a body that is
// already good; the prose above it is the owner's and is carried through
// verbatim, which the loss check at the bottom of this file proves.
// ---------------------------------------------------------------------------

const forgeDesign = `

---

## Designed

**The Forge as a thing the build has to hold.** A Soul Forge is a place, and every place that has one already says so on its own sheet — \`soulForge\` on the region, one of *active*, *damaged*, *destroyed*. Two exist in canon today: [[port-arcadia]] active, [[forward-camp-kestrel]] destroyed. Everything below hangs off that field, so adding a Forge to the world is adding it to a place and never to a table somewhere else.

A Forge holds four things: an **Echo register** — every Echo recorded in its Core, and a Core holds many — an **Essence reserve**, the **grade** that reserve is kept in, and an **owner** with an access policy. The last one is not flavour. Whoever holds the Forge decides who is allowed to be permanent, so *open*, *garrison only*, *paid* and *refused* are the four postures a settlement can take, and the whole of [[binding-in-arcadia]] is a party negotiating one of them.

**The three states, and what each can still do.**

- **Active** — binds, and reclaims.
- **Damaged** — still holds every Echo in its register and still binds newcomers, but the containment no longer runs clean and reconstruction costs **double**. A damaged Forge is a settlement living on borrowed time that has usually not told anybody yet.
- **Destroyed** — holds nothing. Every Echo in that register is gone from it, and anyone whose register is now empty is unbound. That is Kestrel, and it is [[true-death]].

**A Forge cannot build a body for less than 35 Essence,** whatever the person, because that is the floor cost of a vessel at all. Below that in the reserve it can hold Echoes, and bind newcomers, and do nothing else — a machine still making a promise it can no longer keep. What happens to somebody who dies while it is in that state is [[reclamation]]'s to answer, and the answer is not the one most players will expect.

**One at a time.** A Core reconstructs one body at a time. A wiped squad comes back in the order it died, and in a lean settlement the order is the whole argument.

**What an importer has to persist.** Per Forge: the place, the state, the owner, the access policy, the reserve, its grade, and the register. Per character: which Forges they are registered at, which one they return to, their level, their corruption phase, and the biological pattern their last binding recorded. Per death: where the body fell, what was on it, and when. None of that needs a subsystem the game does not already need for other reasons, which is a large part of why this system was the right one to design first.

**What it must never do.** It must never confirm or deny anything about [[tino]] — a Forge speaks only about Echoes in its own register, and that limit is load-bearing across the whole campaign ([[what-the-player-knows-about-tino]]). It must never auto-bind anyone anywhere. And it must never explain the gap between departure and return; that stays open, and stays deliberately unattached to [[the-veil]].`;

const bindingDesign = `

---

## Designed

**Binding registers; it does not move anything.** The Echo is a record of a resonance, not the soul itself, which is why it can sit in more than one Core at once without troubling the law that a soul cannot be duplicated. Binding **adds** a Forge to your register and never removes one, and nothing removes one except that Forge's destruction. So the register only ever grows, each new Forge is a permanent widening of the map exactly as promised, and **unbound** has a precise meaning the build can check: no *living* Forge in your register.

**What binding records is a body.** The readout says it in order — *Resonance detected. Biological pattern acquired. Soul Echo established.* The middle line is the one that matters later. The pattern taken at your most recent binding is the blueprint every future reconstruction is built to, so what [[reclamation]] hands back is the body you last bound with, not the body you died in. Re-binding overwrites the blueprint. A person who binds again after losing a hand has just made that permanent, and the ones who have been around know it while they are doing it.

**Binding costs nothing.** No Essence is spent recording an Echo; the whole expense is in the rebuilding. That is why a settlement will bind strangers it would never reclaim, and why access and reserve are two separate arguments with two different people.

**Numbers the build needs:** a register with no cap, one active return Forge the player chooses, and no cooldown. Nothing here is tuned. It is all structural, and it is all consequence.

**What it must never do.** Never write an automatic re-binding on arrival anywhere. Never let a Forge report on an Echo it does not hold. And never call it a spawn point, in the interface or in the fiction.`;

const reclamationDesign = `

---

## Designed

**The cost, solved rather than invented.** The fiction already committed to two figures — an early reclamation around 47, a developed character 386 — and one straight line runs through both: **35 Essence to build a body at all, plus 11.7 for every level of the person being built.** Level 1 comes to 47. Level 30 comes to 386. The awkward 11.7 is not a design choice; it is what those two numbers make true, and the curve was derived from the canon rather than laid over it.

In **nature-drawn** essence the same body costs **four times** as much, because [[essence]] of that grade is weaker and needed in far greater volume. A level-30 reclamation is 386 refined from something that was alive, or 1,544 drawn from stone. That multiplier is the moral geography of the setting expressed as a supply line, and a settlement's choice of grade becomes a number somebody has to keep paying.

**The shortfall.** The Forge spends what it has and the person makes up the difference: every 11.7 Essence short is one level, down to a floor of 1. They come back *less*, they feel it for hours, and nobody dies of it.

**And below the floor, the dead wait.** A Forge holding under 35 Essence cannot build any vessel at all — so it does not refuse, it **holds**. The Echo stays lit in the Core and the person is neither returned nor lost. A settlement in that state has its dead sitting in the machine with their names known, and getting them back is a hunt for Essence: which is [[gathering-and-harvest]], which is [[the-harvest-economy]], which is the exact pressure this system exists to create. Write it as people waiting, never as a queue on a status bar. How long anyone can be held is **not** answered here, and is the same gap [[the-soul-forge]] keeps open.

**What comes back, and what does not.**

- **Your gear does not.** It is on the corpse where it fell. Reclamation moves a soul and never a bag.
- **Your wounds do not** — and this is the sharp one. The vessel is built to the pattern your last binding recorded, so scars, stiffened joints and missing limbs taken *since* that binding are simply not built. Dying is how a person with a Forge and a reserve gets a hand back. That does not soften [[lasting-wounds]]; it prices it. The people who keep their injuries are the ones who cannot afford Essence, cannot reach a working Forge, or bound again afterwards and made the loss part of the blueprint. Every prosthetic in this setting belongs to somebody in one of those three positions.
- **Your corruption does.** It is lodged in the soul, and the Echo is a soul resonance; the vessel is new and the corruption walks into it wearing the new skin. **Nobody dies their way clean.** [[the-corruption-system]] and [[the-seven-phases-of-corruption]] survive every reclamation intact, which is what keeps that ladder frightening.
- **Your levels do,** unless the reserve was short.

**The reserve belongs to the Forge, not to you.** Everyone in a Forge's register draws on the same Essence, so in [[cooperative-play]] a party's deaths are one shared bill and a stranger's bad night spends your reserve. That is not an inconvenience bolted on for co-op. It is the reason a settlement cares who it binds, and it is [[the-power-balance]] in miniature.

**What it must never do.** Never skip the corpse. Never reclaim somebody quietly — it is a spectacle with witnesses and lights dimming across the base. Never let a shortfall kill anyone; the punishment is levels and waiting, never permanence. And never reclaim anyone whose register holds no living Forge, however sympathetic the moment.`;

const systems: EntryEdit[] = [
  {
    slug: "the-soul-forge",
    append: forgeDesign,
    note: "the machine, its states, and what an importer persists",
    meta: {
      buildStatus: "designed",
      gameTag: "System.SoulForge",
      dependsOn: ["magic", "gathering-and-harvest"],
      openQuestions: [
        "Who built the first Forges, and is that the same question as who built the Veil Anchors?",
        "What do the people who remember impossible places have in common?",
        "How long can a Forge hold a person it cannot afford to build, and does anything change while it does?",
      ],
    },
  },
  {
    slug: "soul-binding",
    append: bindingDesign,
    note: "registration, the blueprint, and the return Forge",
    meta: {
      buildStatus: "designed",
      gameTag: "System.SoulForge.Binding",
      dependsOn: ["the-soul-forge"],
      unlockArc: "the-island-is-already-lost",
      unlockStage: "Prologue — Forward Camp Kestrel, when Rook binds the party",
    },
  },
  {
    slug: "reclamation",
    append: reclamationDesign,
    note: "the cost curve, the shortfall, and what survives a new body",
    meta: {
      buildStatus: "designed",
      gameTag: "System.SoulForge.Reclamation",
      dependsOn: ["soul-binding", "gathering-and-harvest"],
      unlockArc: "the-island-is-already-lost",
      unlockStage: "The first death after binding",
      openQuestions: [
        "Does the corpse decay, and how long does the party have to reach it?",
        "Who sells reclamation to people with no Forge of their own, and at what price?",
        "What does a settlement do with the dead it is holding when the Essence does not come?",
      ],
    },
  },
];

/** Where the design creates an obligation on somebody else's dossier. */
const ripples: EntryEdit[] = [
  {
    slug: "lasting-wounds",
    append: `

**And reclamation prices all of it.** A rebuilt body is built to the pattern taken at that person's last binding ([[reclamation]]), so an injury taken after the binding is not rebuilt — which means a wound is kept by people who cannot afford [[essence]], cannot reach a working Forge, or bound again afterwards and made it permanent. That is not an escape hatch for the writers' room. It is the reason the scars in this world are unevenly distributed, and why a visible injury on somebody who obviously has money is a question worth a scene.`,
    note: "the wound economy the Forge design creates",
    meta: {},
  },
];

// ---------------------------------------------------------------------------
// The scene three dossiers describe and no board contains.
// ---------------------------------------------------------------------------

const PROLOGUE = "the-island-is-already-lost";

const whereAreYouBound = `Rook finds you before the map does.

They have been watching the camp fill up with people who should not have made it, and they walk over with the flat, unhurried certainty of somebody who has already decided what they need to know. Not how many Pearl armor you counted. Not what the east road looked like.

COMMANDER: "Where are you bound?"

It takes a second to land, because it is not the question anyone expects after a morning like that one.

Answer straight — name a Forge, a city, a company chapel — and Rook nods once and files it. That is a person with somewhere to come back to, and there is nothing else to discuss.

Deflect, *what's it to you*, *why are you asking*, and they let the annoyance show, openly and without heat. They are not being nosy. They are doing inventory.

Say you don't know, and something moves behind their face that is closer to alarm than anger.

COMMANDER: "You've been walking a front line with nowhere to come back to."

COMMANDER: "Fuck's sake."

The law of this scene: **the answers characterise and change nothing.** They tell Rook what kind of person is standing in their camp, and they tell the player that this world has a question about death which everyone except them already knows the answer to. Whatever the party says, the next thing that happens is the same, because Rook decided before they walked over.

COMMANDER: "Come with me."`;

const boundAtKestrel = `The Forge sits in a hardened room off the camp's spine, and it is older than everything bolted to it.

A heavy pedestal etched with symbols nobody at Kestrel can read, wrapped in cabling and containment rings and gauges manufactured this decade. Suspended in the rings is the Soul Core: a small sphere of energy turning over itself, lighting the room a colour that does not quite belong to any of the lamps.

COMMANDER: "Anyone who might stay and hold this island is no use to me unbound."

You put your palm on the Core, because that is what Rook indicates and no ceremony is offered. The surface is not warm. Then it cuts you — precisely, without warning — and the sphere reacts to the blood like it has been waiting all morning.

*Resonance detected.*

*Biological pattern acquired.*

*Soul Echo established.*

**BOUND.**

That is the entire tutorial for the most important system in the game, and it is taught by somebody with an obvious reason to care rather than by a panel of text ([[the-war-teaches]]). Everyone who came with you binds in turn. Nobody says *spawn point*, here or ever — the words do not exist in this world and the interface does not use them.

Then, in the quiet afterwards, somebody thinks to ask the machine about Tino.

The Core holds a register of every Echo recorded in it, and it answers the way a Forge always answers: completely, and only about itself. There is no Echo of Tino at Kestrel. He never bound here, so whatever happened on that road, he did not come back here.

That is an inference, and it is all the party gets. **A Forge can only speak about Echoes in its own register** ([[soul-binding]]). Kestrel's cannot tell them he is alive, cannot tell them he is dead, and cannot be asked again for more. Rook, watching, does not help. They do not soften it and they do not take it away.

Binding on every writer, per [[what-the-player-knows-about-tino]]: **never write an instrument that settles his fate.** The empty register is the point. The party leaves this room carrying a question, and that question is what sends them to raise him with Rook at the operations table a few minutes later — which is where the game finally writes it down ([[asked-about-tino]]).

Then the commander takes you to the map.`;

/** The one line of existing prose this displaces, and why. */
const tutorialHandoff = {
  from: "Then the commander calls you — and whoever came for you — to the operations table.",
  to: "Then the commander calls you — and whoever came for you — over. She does not start with the map.",
};

// ---------------------------------------------------------------------------

const STOP = new Set("the a an and or but of to in on at is are was were be been being it its this that these those for with as by from not no nor so than then there their they them he she his her you your we our if all any each both few more most other some such only own same too very can will just should now do does did done have has had having into over under again further once here when where why how what which who whom".split(" "));
const contentWords = (value: string) =>
  new Set(value.toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter((word) => word.length > 3 && !STOP.has(word)));

const DESIGN_MARKER = "\n\n---\n\n## Designed";
const RIPPLE_MARKER = "\n\n**And reclamation prices all of it.**";

async function editEntry(edit: EntryEdit, actorId: string, apply: boolean): Promise<number> {
  const entry = await db.storyEntry.findUnique({ where: { slug: edit.slug }, select: { id: true, body: true, meta: true } });
  if (!entry) throw new Error(`No entry "${edit.slug}".`);
  // Idempotent: an appended layer is cut back off before being reapplied, so
  // re-running never stacks a second copy of itself.
  let base = (entry.body ?? "").trimEnd();
  for (const marker of [DESIGN_MARKER, RIPPLE_MARKER]) {
    if (base.includes(marker)) base = base.slice(0, base.indexOf(marker)).trimEnd();
  }
  const body = `${base}${edit.append}`;
  const meta = Object.keys(edit.meta).length ? { ...(entry.meta as Record<string, unknown> ?? {}), ...edit.meta } : entry.meta;

  if (entry.body === body && stableJson(entry.meta) === stableJson(meta)) {
    console.log(`  ${edit.slug.padEnd(18)} unchanged`);
    return 0;
  }
  console.log(`  ${edit.slug.padEnd(18)} body ${String(entry.body?.length ?? 0).padStart(5)} -> ${String(body.length).padStart(5)}   ${edit.note}`);

  // Nothing the owner wrote may vanish into an append unnoticed.
  const lost = [...contentWords(entry.body ?? "")].filter((word) => !contentWords(body).has(word));
  if (lost.length) console.log(`      NOT CARRIED: ${lost.join(", ")}`);

  if (apply) {
    await db.storyEntry.update({ where: { id: entry.id }, data: { body, meta: meta as Prisma.InputJsonValue, updatedByUserId: actorId, version: { increment: 1 } } });
    await db.storyRevision.create({ data: { id: randomUUID(), entityType: "ENTRY", entityId: entry.id, action: "UPDATED", actorUserId: actorId, summary: `Designed: ${edit.note}` } });
  }
  return lost.length;
}

async function main() {
  const apply = process.argv.includes("--apply");
  const actor = await db.user.findFirst({ where: { role: "ADMIN", isActive: true }, orderBy: { id: "asc" }, select: { id: true } });
  if (!actor) throw new Error("Authoring requires an active administrator for revision authorship.");
  let dropped = 0;

  console.log("\nSystems — concept to designed");
  for (const edit of systems) dropped += await editEntry(edit, actor.id, apply);

  console.log("\nRipples");
  for (const edit of ripples) dropped += await editEntry(edit, actor.id, apply);

  console.log("\nThe prologue's missing scene");
  const writer = new BoardWriter(db, actor.id, apply);
  await writer.node(PROLOGUE, {
    key: "where-are-you-bound",
    kind: "DIALOGUE",
    title: "Where Are You Bound?",
    summary: "Rook's first question is not about the battle, and the answer tells them what kind of person is standing in their camp.",
    body: whereAreYouBound,
    speakerSlug: "the-kestrel-commander",
    status: "CANON",
  });
  await writer.node(PROLOGUE, {
    key: "bound-at-kestrel",
    kind: "SCENE",
    title: "Bound",
    summary: "Palm to the Core, and BOUND — then a register with no Echo of Tino in it, and an inference the machine will not confirm.",
    body: boundAtKestrel,
    status: "CANON",
  });
  await writer.retireEdge(PROLOGUE, "tutorial-complete", "the-operations-table", null, "the binding scene now sits between them");
  await writer.edge(PROLOGUE, { from: "tutorial-complete", to: "where-are-you-bound", status: "CANON" });
  await writer.edge(PROLOGUE, { from: "where-are-you-bound", to: "bound-at-kestrel", status: "CANON" });
  await writer.edge(PROLOGUE, { from: "bound-at-kestrel", to: "the-operations-table", status: "CANON" });
  await writer.links(PROLOGUE, "where-are-you-bound", ["the-kestrel-commander", "soul-binding"]);
  await writer.links(PROLOGUE, "bound-at-kestrel", ["the-soul-forge", "soul-binding", "tino", "the-kestrel-commander", "forward-camp-kestrel"]);

  // The handoff line has to stop promising the table, because the Forge is now
  // between the two. One sentence, replaced in place.
  const arc = await db.storyArc.findUnique({ where: { slug: PROLOGUE }, select: { id: true } });
  const handoff = arc ? await db.storyNode.findFirst({ where: { arcId: arc.id, key: "tutorial-complete" }, select: { id: true, body: true } }) : null;
  if (handoff?.body?.includes(tutorialHandoff.from)) {
    console.log(`  rewrite   node  tutorial-complete — the handoff line now leads to the Forge, not the table`);
    if (apply) {
      await db.storyNode.update({ where: { id: handoff.id }, data: { body: handoff.body.replace(tutorialHandoff.from, tutorialHandoff.to), updatedByUserId: actor.id, version: { increment: 1 } } });
      await db.storyRevision.create({ data: { id: randomUUID(), entityType: "NODE", entityId: handoff.id, action: "UPDATED", actorUserId: actor.id, summary: "The camp handoff leads to the Forge before the operations table" } });
    }
  } else if (handoff) {
    console.log("  unchanged node  tutorial-complete — handoff line already rewritten");
  }

  for (const change of writer.changes) console.log(`  ${change.action.padEnd(9)} ${change.kind.padEnd(5)} ${change.label}${change.detail ? ` — ${change.detail}` : ""}`);

  console.log(`\n${dropped} author word${dropped === 1 ? "" : "s"} not carried over.`);
  if (!apply) console.log("Dry run. Re-run with --apply to write it.");
}

main().then(() => db.$disconnect(), (error) => { console.error(error); return db.$disconnect().then(() => process.exit(1)); });
