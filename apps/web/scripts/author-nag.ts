import "../lib/environment";
import { randomUUID } from "node:crypto";
import { getPrismaClient, type Prisma } from "@habitat/db/client";
import { BoardWriter, stableJson } from "./lib/story-authoring";

/**
 * NAG — Tino's watch, and the answer to the vision question.
 *
 *   pnpm --filter @habitat/web exec tsx scripts/author-nag.ts [--apply]
 *
 * Owner design, 2026-08-28. A pre-war wristwatch [[amanda]] put a gift into,
 * because Tino was always late and she wanted something that would get him
 * home. It picks locks, hot-wires engines, and hacks systems; it talks; it is
 * funny; and it comes off his arm in the player's hand when he is taken.
 *
 * WHAT IT ACTUALLY IS, and the reason it exists in the plot: the magic in it
 * is what ties the player to Tino. That clears both constraints the vision
 * question was stuck on — it works for every player archetype because it is an
 * object rather than a class feature, and it never touches a Soul Forge, which
 * `what-the-player-knows-about-tino` forbids outright.
 *
 * GAP DISCIPLINE, and the whole design rests on this. NAG knows exactly ONE
 * thing and lies about it: how late he is. It has been counting since the car,
 * continuously, and it will not read out the number. It does not know whether
 * he is alive, where he is, or who has him — so nothing it says or withholds
 * confirms his fate, and TINO_KNOWN_STATUS stays MISSING.
 *
 * The lie is fair-play, and both tells are absences a player can catch:
 *   1. NAG nags about everything. It never once nags about Tino.
 *   2. It goes completely silent around [[amanda]], for months, and will not
 *      say why — because she made it, and she would know what it is doing.
 *
 * Its motive is not protection and not cruelty. It is a machine built by
 * somebody to expect one man home, and it cannot say out loud that he is not
 * coming, because saying it is the same as agreeing to it.
 */
const db = getPrismaClient();

async function main() {
  const apply = process.argv.includes("--apply");
  const actor = await db.user.findFirst({ where: { role: "ADMIN", isActive: true }, orderBy: { id: "asc" }, select: { id: true } });
  if (!actor) throw new Error("Authoring requires an active administrator for revision authorship.");
  const write = new BoardWriter(db, actor.id, apply);

  // ---------------------------------------------------------------------
  // The entry.
  // ---------------------------------------------------------------------

  const nagBody = `A wristwatch that talks, opens things, and is the single most reliable liar in the campaign.

**What it does.** Three tools, all taught in one scene on the worst day of the player's life. The case unfolds two fine picks for a mechanical tumbler. It puts out two hair-thin leads that will start any engine built before the war. And it throws a projected panel into the air above the wrist, keyed and typed on directly, for anything with a lockout on it. None of this is exotic in the setting. What is exotic is that it argues with you while you work.

**What it is.** Pre-war consumer tech, mass-produced, worth nothing — and then [[amanda]] gave it something.

Not an infusion. This matters more than anything else on the page. Infused magic is extracted magic, and [[the-three-origins-of-magic]] is unambiguous about what extraction costs: every dose is a life converted into product. Amanda did not buy a dose to put in a birthday present. She is a [[lizzarnix]], and the third origin is hers — magic willingly given by a magical creature, the rarest kind, the kind that **consumed no one**.

So the watch on the player's wrist is, as far as anybody in the campaign knows, the only magic in the world that cost nothing. Nobody died for it. In a setting where that sentence is true of essentially nothing else, it is true of a joke gift about being late.

That is the whole enchantment, and it is very small. It knows what time it is, it knows where he is meant to be, and it will not shut up about the gap between them.

**The name.** Tino named it. He used to say the same sentence every morning, to nobody, in the tone of a man describing a medical condition: *nag, nag, nag, all this damn thing does.* The name stuck the way a nickname sticks when it is unkind and accurate, and the watch has never once been given a say in the matter, and brings this up regularly.

**Its voice.** A palm-sized projected head, mostly eyebrows, with the timing of somebody who has been waiting years for the right moment and is prepared to wait longer. It is rude to Tino, formal with strangers, and gradually, unbearably fond of whoever is currently wearing it. It complains about its own hardware constantly. It has opinions about the player's sleep schedule.

**What it is doing.** Since the road out of [[the-starting-island]] it has been counting. It is a watch, and the person it was made for is late, and it has not stopped keeping the figure for one second since his hand came out of the player's. It will not say the number. Asked directly, it says it does not know, which is the only lie it tells and it tells it every single time.

The tells are there for anyone who watches it long enough. It nags about everything — sleep, ammunition, unopened letters, the state of the player's boots — and it has never once nagged anybody about Tino. And it goes silent around Amanda. Completely, for months, and it will not explain that either.`;

  const nagMeta = {
    fullName: "NAG",
    aliases: ["the watch", "Tino's watch"],
    pronouns: "it/its",
    sex: null,
    species: "Pre-war consumer chronometer, carrying a gift",
    age: "Older than the war it ended up in. Given roughly a decade ago.",
    appearance: "A scuffed steel wristwatch on a band that has been re-stitched twice. The case unfolds picks; two leads spool from the crown; a palm-sized panel and a projected head, mostly eyebrows, sit above the wrist when it has something to say. The band is torn at one lug and has never been repaired.",
    voice: "Dry, formal with strangers, openly insubordinate with Tino, and increasingly fond of whoever is wearing it. Complains about its own hardware. Has never willingly answered a direct question about him.",
    voiceProfile: null,
    magic: {
      // GIFTED, not infused, and the distinction is load-bearing. Infusion is
      // extracted magic and extraction kills the source, so an infused watch
      // would mean Amanda bought a life for a birthday present. She is a
      // Lizzarnix; the third origin is hers, and a gift consumes no one.
      origin: "gifted" as const,
      schools: [],
      corruptionPhase: null,
      notes: "Given by [[amanda]], not dosed. Under [[the-three-origins-of-magic]] that makes it the rarest kind and the only kind that cost nothing — which is quietly extraordinary in a world where every other unit of power is somebody's severed self. The enchantment does exactly one thing: it knows when he is late. Everything else the watch does is ordinary pre-war engineering. Whatever ties the player to Tino runs through the gift, and NAG has never been asked about it in a way it was willing to answer.",
    },
    factions: [{ faction: "stormglass-cartel", role: "not employed, merely present", standing: "the property of an infuser who is no longer on the payroll" }],
    home: null,
    status: {
      known: "A talking wristwatch that opens locks, starts engines, and will not stop commenting.",
      actual: "SPOILER-TIER. It has counted how late Tino is, without interruption, since the moment the band tore. It refuses to read out the figure and says it does not know. That is the only lie it tells, it tells it every time, and the reason is not protection — it is a machine built to expect one man home, and saying he is not coming is the same as agreeing to it.",
    },
    relationships: [
      { character: "tino", who: null, type: "Made for him, named by him, and worn by him for a decade. Their entire relationship is conducted as mutual insult." },
      { character: "amanda", who: null, type: "She built it. It goes silent in her presence and will not say why, and she has not seen it in years." },
    ],
    storyRole: "The player's constant companion from the prologue onward: a toolkit, the campaign's comic relief, and the quiet channel between the player and Tino. It occupies no party slot, so it is always there — which is the point. The joke has to be running for forty hours before the count underneath it means anything.",
    involvement: [
      { ref: "the-island-is-already-lost", kind: "ARC" as const, how: "Taught to the player by Tino in the truck scene, then torn off his arm and left in the player's hand." },
      { ref: "the-captivity-arc", kind: "ARC" as const, how: "The channel the vision episodes arrive through, and the thing that will not admit it." },
    ],
    gameId: null,
    model: null,
    companion: {
      capable: true,
      availability: "From the moment Tino is taken, permanently. Occupies no party slot and cannot be dismissed.",
      status: "Worn. Talking. Counting.",
    },
    openQuestions: [
      "Whether NAG can ever be made to say the number, and what it costs it.",
      "What it does when Amanda finally addresses it directly.",
    ],
  };

  const existing = await db.storyEntry.findUnique({ where: { slug: "nag" }, select: { id: true, title: true, summary: true, body: true, meta: true } });
  const summary = "Tino's watch: lockpick, hot-wire rig, hacking deck, permanent comic relief — and the channel the player's visions of him arrive through. Gifted magic, so it cost nobody anything. It knows how late he is and it lies about it.";
  if (!existing) {
    write.changes.push({ kind: "entry", action: "create", label: "CHARACTER nag", detail: "NAG" });
    if (apply) {
      const created = await db.storyEntry.create({ data: { id: randomUUID(), kind: "CHARACTER", slug: "nag", title: "NAG", summary, body: nagBody, status: "CANON", createdByUserId: actor.id, meta: nagMeta as unknown as Prisma.InputJsonValue } });
      await db.storyRevision.create({ data: { id: randomUUID(), entityType: "ENTRY", entityId: created.id, action: "CREATED", actorUserId: actor.id, summary: `Wrote "NAG"` } });
    }
  } else if (existing.title === "NAG" && existing.summary === summary && existing.body === nagBody && stableJson(existing.meta) === stableJson(nagMeta)) {
    write.changes.push({ kind: "entry", action: "unchanged", label: "CHARACTER nag" });
  } else {
    write.changes.push({ kind: "entry", action: "update", label: "CHARACTER nag", detail: "NAG" });
    if (apply) {
      await db.storyEntry.update({ where: { id: existing.id }, data: { title: "NAG", summary, body: nagBody, meta: nagMeta as unknown as Prisma.InputJsonValue, updatedByUserId: actor.id, version: { increment: 1 } } });
      await db.storyRevision.create({ data: { id: randomUUID(), entityType: "ENTRY", entityId: existing.id, action: "UPDATED", actorUserId: actor.id, summary: `Rewrote "NAG"` } });
    }
  }

  // ---------------------------------------------------------------------
  // The truck. Where the player learns all three tools and meets the watch.
  // ---------------------------------------------------------------------

  await write.node("the-island-is-already-lost", {
    key: "wheels", kind: "SCENE", title: "Good News. Today You Learn.",
    summary: "One locked truck, three tools, and the rudest wristwatch on the island.",
    status: "CANON", x: 600, y: 440,
    body: `The one usable truck is locked, and its crew will not be needing it. Tino tries the door with the weary optimism of a man who has never once been lucky.

TINO: "Locked." He surveys the incoming battle. "Naturally."

Then he pushes his sleeve back, and the tutorial that runs for the rest of the game starts without any announcement at all.

**The picks.** The watch case unfolds — properly unfolds, in stages, like it is enjoying itself — and puts out two fine picks. Tino hands you your wrist back with them still extended.

TINO: "Tension on the bottom. Feel for the one that's stiff. Don't force it, it'll set."

The tumblers are a small honest minigame under theatrical pressure, not punishing, this first time. The horizon gets louder while you work. The door gives.

**The panel.** Inside, the ignition answers with nothing, and it is not a dead battery — there is a Pearl lockout spliced into the column, because the contractors have been losing vehicles all week and somebody in procurement finally did something about it.

A panel throws itself into the air above your wrist, keyed and typed on directly, and Tino talks you through it the way people talk when they are not looking at you: fast, bored, and completely clear. The lockout comes apart.

**The leads.** Two hair-thin leads spool out of the crown.

TINO: "You know how to hot-wire one of these?"

If you are the engineer, he catches himself: "Actually, stupid question. Do your thing." For everyone else: "Good news. Today you learn."

Red to red. The other one to the thing that is obviously not red. The engine catches. For one second, both of you grin like the war isn't watching.

And you look at the watch, because of course you do.

TINO, without turning his head: "Don't even think about it. It's a personal gift."

A palm-sized head resolves above his wrist — mostly eyebrows, and no hurry at all.

NAG: "Damn, Tino. You're getting soft. Usually you ain't this nice."

TINO: "Shut the fuck up, Nag."

NAG, to you, in a completely different register — polite, almost formal, the tone of something being introduced properly for the first time: "He calls me Nag."

It does not explain why. Neither does he. Nobody in this truck has time, and the road is about to narrow.`,
  });
  await write.links("the-island-is-already-lost", "wheels", ["tino", "nag"]);

  // ---------------------------------------------------------------------
  // The handoff. The one thing the player keeps.
  // ---------------------------------------------------------------------

  await write.node("the-island-is-already-lost", {
    key: "tino-is-taken", kind: "SCENE", title: "GO",
    summary: "The capture, authored to be unwitnessable — and the one thing left in the player's hand.",
    status: "CANON", x: 15, y: 653,
    body: `The road narrows through wreckage. An impact — Tino wrestles the wheel and wins, barely. Then a creature lands on the vehicle, all claws and wrongness, and you get one real combat interaction: shoot it, stab it, cast at it, knock it loose. You can wound it. You cannot change what happens next.

A second creature hits Tino's side. The door tears away like paper. Tino is grabbed.

Your hand reaches into frame — first person, no cinematic mercy — and his hand closes on yours. For one full second you have him. For one full second the game lets you believe it.

Then something else pulls.

His grip does not open. The band does. Re-stitched twice, never a third time, and it goes at the lug with a sound too small for what is happening, and his hand comes out of yours and the watch does not.

TINO: "GO!"

Smoke. Movement. The swarm.

TINO: "FUCKING GO!"

And he is gone — into smoke, into enemy motion, into a chaos built precisely so that you cannot know what happened. No body. No confirmation. No clean kidnapping shot. The seat beside you is empty and the war does not slow down.

What you are holding is a wristwatch on a torn band. The one thing he told you not to think about.

It does not say anything. Not then, and not for a long time afterwards, and when it finally does start talking again it never once mentions him — which nobody notices, because a machine that will not shut up about your boots and your sleep and your ammunition does not look like a machine avoiding a subject.

It is counting. It started when the band went and it has not stopped.

It will not say the number.`,
    effects: ["set flag: carries-nag"],
  });
  await write.links("the-island-is-already-lost", "tino-is-taken", ["tino", "nag", "what-the-player-knows-about-tino"]);

  await write.flag("carries-nag", "Carries NAG",
    "The player walks out of the prologue wearing Tino's watch. It is a toolkit, a companion that costs no party slot, and the channel his visions arrive through — and it is lying to them.",
    `Set in [[the-island-is-already-lost]] when the band tears, which happens on every route through the prologue — the flag exists so later content can address the watch directly rather than assume it.

What it gates is tone, not access. [[nag]] is present for the whole campaign, so anything that wants to use it as comic relief, as a lockpick, or as the thing that goes quiet at exactly the wrong moment can check that the player has it.

Checked in [[the-hollow-wing]], where the first vision arrives through it in the dark, and in [[the-captivity-arc]], where somebody finally asks it a direct question.`);

  // ---------------------------------------------------------------------
  // Amanda. The watch goes quiet the day she joins, and stays quiet for
  // months, and the reason is the mission where her arc stops being secret.
  // ---------------------------------------------------------------------

  const missionAdditions: Array<{ slug: string; marker: string; addition: string }> = [
    {
      slug: "the-woman-in-the-peninsula",
      marker: "\n\n**NAG goes quiet.**",
      addition: `

**NAG goes quiet.** The moment [[amanda]] is in earshot, [[nag]] stops talking. Not a glitch, not a joke, not a comment about it afterwards — a machine that has been running commentary since the island simply stops, and stays stopped whenever she is nearby, for the whole middle of the game.

The player has no way to read this yet and it must not be explained. Amanda does not react to it either, because she has not looked at the player's wrist, because there is no reason on earth she would.

She made it. It knows exactly what she would do if she saw it, and it is not ready.`,
    },
    {
      slug: "the-man-who-left",
      marker: "\n\n**She sees the watch.**",
      addition: `

**She sees the watch.** This is the mission where it happens, and it should land in the middle of her own story rather than as its own beat — she is mid-sentence about the silence, the years, the not knowing, and she looks down, and stops.

AMANDA: "...where did you get that."

Not a question. The player explains, badly, because there is no good way to say *it came off his arm while I was holding it.*

AMANDA, quietly, to herself, in something close to disbelief: *"I can't believe Tino gave you NAG."*

And then she tells the player the one thing nobody has ever explained, in the flat voice of a woman describing something that used to be funny:

She built it. It was ordinary — a cheap watch, a birthday, a joke — and she gave it something of her own, because he was late to everything, every time, his whole life, and she wanted one thing in the world that would keep telling him to come home when she could not.

She does not explain what *gave* means, and the player has no framework for it yet. What they can work out, if they are paying attention, is that she did not buy a dose — and everybody in this world knows what a dose costs.

And Tino, every morning, to nobody, in exactly the same tone: *nag, nag, nag, all this damn thing does.*

"So that's its name," she says. "He named it after complaining about it. That's the whole story."

**Direction.** Play the reveal as grief arriving sideways, not as exposition. She is not moved that the watch survived; she is winded that it is *here*, on a stranger, and that she is finding out this way. And [[nag]] — which has been silent around her for months — still does not speak. Not in this scene. She notices that too, and says nothing about it, and the player should catch that she noticed.

It is also, quietly, the first hard evidence in the game that Amanda and Tino were not colleagues.`,
    },
  ];

  for (const item of missionAdditions) {
    const entry = await db.storyEntry.findUnique({ where: { slug: item.slug }, select: { id: true, title: true, body: true } });
    if (!entry) throw new Error(`Missing companion mission "${item.slug}".`);
    if ((entry.body ?? "").includes(item.marker.trim())) { write.changes.push({ kind: "entry", action: "unchanged", label: `MISSION ${item.slug}` }); continue; }
    write.changes.push({ kind: "entry", action: "update", label: `MISSION ${item.slug}`, detail: "NAG beat appended" });
    if (apply) {
      await db.storyEntry.update({ where: { id: entry.id }, data: { body: `${entry.body ?? ""}${item.addition}`, updatedByUserId: actor.id, version: { increment: 1 } } });
      await db.storyRevision.create({ data: { id: randomUUID(), entityType: "ENTRY", entityId: entry.id, action: "UPDATED", actorUserId: actor.id, summary: `Wove NAG into "${entry.title}"` } });
    }
  }

  write.report(apply ? "NAG — APPLYING" : "NAG — dry run");
}

main().then(() => db.$disconnect(), (error) => { console.error(error); return db.$disconnect().then(() => process.exit(1)); });
