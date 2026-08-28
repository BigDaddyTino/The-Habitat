import "../lib/environment";
import { randomUUID } from "node:crypto";
import { getPrismaClient, type Prisma } from "@habitat/db/client";
import { BoardWriter, stableJson } from "./lib/story-authoring";

/**
 * Builds The Hollow Wing, and gives it somewhere to live.
 *
 *   pnpm --filter @habitat/web exec tsx scripts/author-hollow-wing.ts [--apply]
 *
 * It was a canon side quest with a three-phase boss described in its summary,
 * a hook reading "In a abandoned essence mine", a summary truncated mid-word,
 * and zero scenes. Everything it needed was already written down and none of
 * it was on a board.
 *
 * Three things land here, and the middle one is the point:
 *
 *  1. DRAW NINE — the abandoned Aegis Essence draw beneath the peninsula it
 *     has always been set in, as a real place with a parent and reciprocal
 *     connections, so the peninsula stops being one city and open country.
 *  2. THE FIRST VISION — the owner's ruling. In phase three the lamps die and
 *     the player gets four seconds that do not belong to them: restraint,
 *     surgical light, and a room with two small beds in it. They have no
 *     context for any of it. That is the point, and it pays off years later.
 *  3. THE CREATURE — the Hollow Wing as a bible entry whose habitat names a
 *     place that actually resolves. No creature in the codex managed that.
 *
 * Rating discipline: this is Mature 17+ at full weight, per owner ruling.
 * Nothing here is softened toward implication.
 */
const db = getPrismaClient();

async function main() {
  const apply = process.argv.includes("--apply");
  const actor = await db.user.findFirst({ where: { role: "ADMIN", isActive: true }, orderBy: { id: "asc" }, select: { id: true } });
  if (!actor) throw new Error("Authoring requires an active administrator for revision authorship.");
  const write = new BoardWriter(db, actor.id, apply);

  // ---------------------------------------------------------------------
  // The place. Numbered, decommissioned, and still on somebody's asset list.
  // ---------------------------------------------------------------------

  const drawNineMeta = {
    type: "site", settlementTier: null, parent: "the-peninsula",
    biome: "flooded hard-rock extraction workings, permanently dark",
    control: [{ faction: "aegis-extraction-consortium", kind: "holds" as const }],
    population: "None recorded. The Wardens' standing figure for the approach is eleven missing in fourteen months.",
    connections: [{ to: "port-arcadia", by: "haul road", notes: "The spur that carried the draw's Essence to the city, unmaintained since decommissioning and still the only way in." }],
    status: "Decommissioned by Aegis, never sealed, never written off — the shafts are still on the asset register.",
    veilAnchorTier: null, soulForge: null, gameTag: null,
    openQuestions: ["Whether Aegis knows what is living in Draw Nine, and how long the register has said 'pending survey'."],
  };

  const drawNineBody = `An Essence draw is a hole that money made. Draw Nine is the one the money left.

[[aegis-extraction-consortium]] cut it into the rock under the peninsula, worked it for nineteen years, and decommissioned it when the yield curve stopped justifying the pumps. Decommissioned, not sealed. Sealing a shaft costs money and abandoning one costs a line in a register, so Draw Nine has been carried as *pending survey* for longer than some of the surveyors have been alive.

The haul road to [[port-arcadia]] is still there under the scrub, which is the only reason anyone still goes in — a road is an invitation, and there is salvage down there for anyone willing to walk a dark spur nobody maintains.

Eleven of them in fourteen months, on the [[wardens-monster-hunter-guild]] board. All found on the road, none found in the workings. Every one of them dry: no blood, no Essence, and no wound big enough to explain where either went.

The bats came in when the pumps stopped. They are not the problem. They are what the problem eats when nothing else walks down the road.`;

  // ---------------------------------------------------------------------

  const wingBody = `Something went down Draw Nine while it was still working, and did not come back up the same.

The Hollow Wing hunts on the wing in a place with no sky, which is the first thing that is wrong with it: a wingspan that has no business fitting the galleries it moves through, folded and refolded until it does. It does not screech. The [[shrieker-bat]] colonies do that for it, and it has learned exactly what their panic sounds like from above.

It feeds by draining, and it drains both — blood and [[essence]] together, through a feeding structure that had to open a person's chest to reach what it wanted and has become very good at doing that quickly. The bodies on the haul road are found flat. Not exsanguinated in the clinical sense: emptied. Skin over architecture. The Wardens who bag them describe the weight wrong every time, because a person is mostly water and these are not.

**What makes it a bounty and not a hazard.** It gets stronger as you get weaker. The lifesteal is not a mechanic bolted on; it is the animal. Wound it and it goes for the softest bleeding thing in the room and comes back whole. And there is an Essence reservoir in the lower workings that Aegis never drained, because draining it cost more than walking away, and the Wing knows exactly where it is.

**The dark.** In its last phase the corruption in it takes the heart it has been running on and the galleries go black — genuinely black, the lamps guttering out one by one, and the thing that has been circling above you all fight stops needing to see you at all.

Nothing about it is malevolent. It is an animal that was made into this by an industry that left a hole open, and it is starving in a place where eleven people a year is a good year.`;

  // ---------------------------------------------------------------------
  // The board.
  // ---------------------------------------------------------------------

  await write.arcFields("the-hollow-wing", {
    hook: "Eleven travellers on the Draw Nine haul road in fourteen months, all found dry. The Wardens have stopped calling it a hazard and started calling it a bounty.",
    summary: "A bounty hunt into an abandoned Aegis Essence draw beneath the peninsula, after a thing that drains blood and Essence together and gets stronger the worse you are doing. Three phases: it hunts from the air, it feeds the reservoir Aegis never drained, and then the lights go out.",
  });

  await write.node("the-hollow-wing", {
    key: "the-board", kind: "QUEST_START", title: "Eleven in Fourteen Months",
    summary: "A Warden bounty nobody has taken, priced like an apology.",
    x: 320, y: 0,
    body: `The notice has been on the [[wardens-monster-hunter-guild]] board long enough to go soft at the corners.

Eleven travellers on the Draw Nine haul road in fourteen months. Recovered, all of them, which is unusual — this is not a thing that hides its work. Cause of death recorded as *exsanguination and Essence depletion, concurrent*, in a hand that has written it eleven times and has stopped adding a note.

The bounty has been raised twice. Nobody has taken it twice, either, which is a different fact and the one that should interest you.

The Warden who hands it over is straightforward about the arithmetic: the road is the only way in, the road is where the bodies are, and every hunter who has gone down that spur has come back or not come back within one day. She does not tell you it is dangerous. She tells you the pay, watches your face while you read the recovery notes, and lets you decide what that is worth. Everybody doing this work is doing it for the same reason: reclamation costs Essence, dying is therefore expensive, and the only way to afford dying is to take jobs that might kill you.`,
  });

  await write.node("the-hollow-wing", {
    key: "the-haul-road", kind: "QUEST_STEP", title: "The Haul Road",
    summary: "A spur road, a decommissioned draw, and the eleventh recovery site still marked.",
    x: 320, y: 160,
    completion: "Follow the haul road to the Draw Nine adit and go in.",
    body: `The spur leaves the Arcadia road and stops being maintained inside a mile.

[[aegis-extraction-consortium]] built it to carry Essence out and let the scrub have it back the day the yield curve turned. The rails are still down. So are the sleepers, and the drainage, and a loading gantry with a company crest on it that somebody has shot at for the fun of it.

The eleventh recovery site is still flagged, because the Wardens flag them and nobody comes out to unflag anything. Two stakes and a tape gone grey. There is a stain on the gravel that four seasons of rain have not managed, which tells you what came out of him and how much of it there was.

He was found face up, forty yards from the adit, walking out. Not in. Out.

Whatever it is, it let him get that far.`,
  });

  await write.node("the-hollow-wing", {
    key: "shrieker-galleries", kind: "QUEST_STEP", title: "The Shrieker Galleries",
    summary: "The bats are not the problem. They are the alarm, and they have been trained by something.",
    x: 320, y: 320,
    completion: "Cross the colony galleries to the lower workings without turning the whole roof over.",
    body: `The [[shrieker-bat]] came in when the pumps stopped and the water came up, and there are now enough of them that the first gallery has a floor made of what they have dropped, ankle-deep and moving with things that live in it.

They are not dangerous the way the bounty is dangerous. They are dangerous the way an alarm is dangerous. A shrieker that is startled hits a register that puts a person on one knee with their hands over their ears for two full seconds, and two seconds is a long time in a place where something is listening for exactly that noise.

So you learn to move. Lamps hooded. Nothing sudden. Rounds counted and not spent, because a discharge in here turns four hundred of them over at once and the ceiling comes down as a single screaming animal.

And somewhere above you, in the dark past where the light reaches, something that has been living off this colony's panic for years hears the galleries go quiet in a way they do not go quiet on their own.`,
  });

  await write.node("the-hollow-wing", {
    key: "phase-one-the-wing", kind: "QUEST_STEP", title: "Phase One — It Hunts From the Air",
    summary: "It takes the ceiling and works the room. The worse you do, the better it does.",
    x: 320, y: 480,
    completion: "Survive the open gallery and drive it down toward the workings.",
    body: `It takes the ceiling immediately and it does not come down.

The gallery is ninety feet across and it uses all of it, folding through the roof supports at angles that read wrong, dropping onto whoever is furthest from a light and going straight through the chest wall with a feeding structure built for exactly that and nothing else. It does not maul. There is no thrashing. It opens someone, drinks, and is back in the dark above the lamps before the body has finished going down.

And it comes back whole. Every wound you have put in it closes on what it takes, and it knows precisely which of you is bleeding — it will cross the entire gallery past two healthy targets to get to the one who is hurt, because the one who is hurt is worth more.

That is the fight. It is not a damage race, it is a race against your own condition. A party that plays it clean grinds it down. A party that starts losing people discovers the thing gets faster, bolder, and stops bothering with the ceiling at all — it will land in front of you, in the open, because it has stopped needing to be careful.

Drive it down. There is nowhere else to drive it.`,
  });

  await write.node("the-hollow-wing", {
    key: "phase-two-the-reservoir", kind: "QUEST_STEP", title: "Phase Two — The Reservoir",
    summary: "Aegis never drained the lower workings. It knows exactly where that is.",
    x: 320, y: 640,
    completion: "Break the feed, or fight it while it drinks.",
    body: `The lower workings are flooded to the chest, and what is in them is not water.

Aegis logged the reservoir at decommissioning and costed the drain-down against the residual yield, and the residual yield lost. So it is still here: raw [[essence]] pooled in a worked-out chamber, going the colour that raw Essence goes when nobody has touched it for eleven years, lighting the whole room from below.

The Wing drops into it and drinks.

You watch it fill. The wingspan does not change — the *density* does, the membrane going from grey to something with weight and current in it, and the wounds you spent the last gallery putting into it closing in the order you made them. It is not healing. It is being paid.

There is a way to stop this. There is always a way to stop this, and it is loud, and it involves the pumps or the gantry or the seventy feet of standing pipework that Aegis also decided was not worth recovering, and doing it puts somebody in the water with the thing that is in the water.

Or you fight it at strength. That is a legitimate choice and the Wardens have a phrase for the people who make it.`,
  });

  await write.node("the-hollow-wing", {
    key: "phase-three-the-dark", kind: "SCENE", title: "Phase Three — The Dark",
    summary: "The corruption takes its heart, the lamps go out, and for four seconds the player is somewhere else entirely.",
    x: 320, y: 800,
    body: `Something in it fails.

You have hurt it enough that whatever has been keeping the animal running — the corruption that made it, the Essence it just drank, whichever came first — turns on the heart it has been running on. You can see it happen. The light under the membrane goes out from the middle, like a coal dying, and the thing screams for the first time in the entire fight, and it is not a hunting sound.

Then the lamps go.

Not doused — *drawn*. One by one, in order, from the far wall inward, every source of light in the chamber pulled out to nothing, and the last thing you see before it is complete is that the Wing has stopped looking at you, because it does not need to look at you any more.

The dark is total. You are bleeding into standing Essence, in a worked-out chamber under a peninsula, with something above you that hunts on the wing in a place with no sky.

[[nag]] — which has narrated this entire descent, uninvited, at length, with running commentary on the air quality — stops mid-sentence.

---

**And for four seconds you are not there.**

Flat on your back. Restrained at the wrist, the chest, and above the knee, and the restraints are padded, which is worse. A light directly overhead, surgical, adjusted by someone standing where you cannot turn your head to see. Something cold going into the arm and everything after it going wrong — every nerve reporting at once, in the wrong order, from parts of a body that is not shaped the way yours is shaped.

And behind all of it, not seen, *remembered* — a small room with two small beds in it, and both of them empty, and a grief attached to the sight of them so large and so specific that it does not belong to you and it arrives anyway.

---

Four seconds. Then the chamber, the dark, the water, the blood you are losing, and the thing coming.

The panel above your wrist is lit. It was not lit before, nobody asked it to be, and it goes out while you are looking at it.

NAG, after a pause that is a little too long: "...air quality remains poor."

You will call it stress. Everyone does, the first time.`,
    effects: ["set flag: the-first-vision"],
  });

  await write.node("the-hollow-wing", {
    key: "the-wing-falls", kind: "ENDING", endingKind: "SUCCESS", title: "The Wing Falls",
    summary: "A bounty, a body, and four seconds the party has no explanation for.",
    x: 200, y: 980,
    body: `It dies badly and it takes a long time, because the thing keeping it alive has already stopped and nobody told the animal.

What is left on the chamber floor is smaller than it was in the air. That is the part the Wardens will not believe: a wingspan that filled a ninety-foot gallery, folded down into something you could carry out between two people, mostly membrane and hollow bone and a feeding structure that somebody in Port Arcadia is going to pay to look at.

Bounty confirmed. The board gets a line drawn through it. The haul road opens, which matters to the salvage crews and to nobody else, and eleven families get a letter that says *recovered* instead of *missing*, which is not nothing and is not much.

And one of you keeps not mentioning the four seconds in the dark.

Because how would you say it. *I was strapped to a table. There was a light. There were two empty beds and I have never seen them before and I have not stopped thinking about them.* You are tired, you were bleeding, the chamber was full of raw Essence and everyone knows what raw Essence does to people who stand in it.

That is what you decide it was.`,
    effects: ["The Hollow Wing bounty is closed and the Draw Nine haul road reopens.", "The party carries the first vision without an explanation for it."],
  });

  await write.node("the-hollow-wing", {
    key: "walked-out", kind: "ENDING", endingKind: "FAILURE", title: "Walked Out",
    summary: "The eleventh man was found walking out, forty yards from the adit. It lets you get that far too.",
    x: 460, y: 980,
    body: `You leave in the dark, uphill, through a colony you can no longer afford to keep quiet, with the sound of four hundred shriekers coming off the roof behind you and something moving through them without slowing down.

It lets you reach the adit. It let him reach forty yards past it.

Whatever is left of the party comes out onto the haul road into daylight that hurts, carrying whoever cannot walk, and the bounty stays on the board with the corners gone soft, and the Wardens add a twelfth line to a recovery log in a hand that has stopped adding notes.

Draw Nine is still on the Aegis register as *pending survey*.

The four seconds in the dark come with you.`,
    effects: ["The Hollow Wing bounty stays open and the haul road stays closed.", "The party carries the first vision without an explanation for it."],
  });

  await write.flag(
    "the-first-vision",
    "The First Vision",
    "The player's first episode: restraints, a surgical light, and a room with two empty beds. It arrives in the dark under Draw Nine with no context at all, and the party writes it off as raw Essence exposure.",
    `The first of the vision episodes described in [[the-empty-cribs]], planted where nobody can interpret it.

It lands in the black of [[the-hollow-wing]]'s third phase — bleeding, standing in raw [[essence]], with a lifesteal predator overhead — which gives the party a complete and entirely wrong explanation to reach for. Essence exposure causes exactly this kind of thing. Everyone knows that. They are wrong, and they will keep being wrong for a long time.

The two empty beds mean nothing to the player here. They are not supposed to. [[amanda]] tells that story to somebody, years later, in her own words, on her own schedule, and the player recognises a room they have already stood in once, in the dark, under a mountain.

Checked at the close of [[the-captivity-arc]], where a second episode makes "stress" impossible to keep believing.`,
  );

  await write.edge("the-hollow-wing", { from: "the-board", to: "the-haul-road" });
  await write.edge("the-hollow-wing", { from: "the-haul-road", to: "shrieker-galleries" });
  await write.edge("the-hollow-wing", { from: "shrieker-galleries", to: "phase-one-the-wing" });
  await write.edge("the-hollow-wing", { from: "phase-one-the-wing", to: "phase-two-the-reservoir" });
  await write.edge("the-hollow-wing", { from: "phase-two-the-reservoir", to: "phase-three-the-dark" });
  await write.edge("the-hollow-wing", { from: "phase-three-the-dark", to: "the-wing-falls", label: "Put it down in the dark" });
  await write.edge("the-hollow-wing", { from: "phase-three-the-dark", to: "walked-out", label: "Break for the adit" });

  // Per-scene links. A blanket link set says nothing; these say who is in the
  // room. The dark is the only scene NAG appears in, and that is the point.
  await write.links("the-hollow-wing", "the-board", ["wardens-monster-hunter-guild", "draw-nine"]);
  await write.links("the-hollow-wing", "the-haul-road", ["draw-nine", "aegis-extraction-consortium"]);
  await write.links("the-hollow-wing", "shrieker-galleries", ["shrieker-bat", "draw-nine"]);
  await write.links("the-hollow-wing", "phase-one-the-wing", ["the-hollow-wing-creature"]);
  await write.links("the-hollow-wing", "phase-two-the-reservoir", ["the-hollow-wing-creature", "essence"]);
  await write.links("the-hollow-wing", "phase-three-the-dark", ["the-hollow-wing-creature", "nag", "tino"]);
  await write.links("the-hollow-wing", "the-wing-falls", ["the-hollow-wing-creature", "draw-nine"]);
  await write.links("the-hollow-wing", "walked-out", ["the-hollow-wing-creature", "shrieker-bat", "draw-nine"]);

  // ---------------------------------------------------------------------
  // Entries. Written directly, because REGION and CREATURE sheets are meta
  // and the BoardWriter deliberately only knows how to plant a flag.
  // ---------------------------------------------------------------------

  const entries: Array<{ slug: string; kind: "REGION" | "CREATURE"; title: string; summary: string; body: string; meta: Record<string, unknown> }> = [
    {
      slug: "draw-nine", kind: "REGION", title: "Draw Nine",
      summary: "An abandoned Aegis Essence draw beneath the peninsula, decommissioned but never sealed, still carried on the asset register as pending survey.",
      body: drawNineBody, meta: drawNineMeta,
    },
    {
      slug: "the-hollow-wing-creature", kind: "CREATURE", title: "The Hollow Wing",
      summary: "The thing in Draw Nine: a lifesteal predator that drains blood and Essence together and gets stronger the worse you are doing.",
      body: wingBody,
      meta: {
        category: "monstrosity", parent: "monstrosities",
        biomes: ["draw-nine"],
        threat: "Bounty-tier. Drains blood and Essence concurrently, heals on what it takes, and preferentially targets the most wounded member of a party. In its final phase it removes every light source in the chamber and no longer requires sight.",
        harvest: "Membrane, hollow bone, and an intact feeding structure — the last of which Port Arcadia's anatomists will pay for and Aegis would rather nobody examined.",
        gameId: null,
        openQuestions: ["Whether it went down Draw Nine as something else while the draw was still working, and what it was before."],
      },
    },
    {
      slug: "shrieker-bat", kind: "CREATURE", title: "Shrieker Bat",
      summary: "Colony bats that moved into Draw Nine when the pumps stopped. Harmless alone; their panic is a two-second stun and an alarm something else has learned to read.",
      body: `Nothing about a shrieker is designed to hurt you. That is done by accident, at volume, four hundred at a time.

They came into [[draw-nine]] when the pumps stopped and the water came up, and they have had eleven undisturbed years to fill the upper galleries. The floor is what they have dropped. The ceiling is the colony.

A startled shrieker hits a register that puts an unprotected person on one knee with their hands over their ears for about two seconds. One is a nuisance. A gallery going over at once is a solid wall of it, in the dark, with the roof coming alive.

They are prey, and they know it, and they have spent those eleven years learning that the quiet is worse than the noise. Which is the useful thing about them: a hunter who watches the colony instead of the dark will know [[the-hollow-wing-creature]] is moving before they hear it, because four hundred animals stop screaming at once.`,
      meta: {
        category: "natural", parent: "beasts",
        biomes: ["draw-nine"],
        threat: "Individually negligible. A disturbed colony produces a roughly two-second incapacitating stun across an area and announces the party to everything in the workings.",
        harvest: "Nothing worth carrying. The guano is worked for saltpetre by people with no better options.",
        gameId: null,
        openQuestions: [],
      },
    },
  ];

  for (const spec of entries) {
    const existing = await db.storyEntry.findUnique({ where: { slug: spec.slug }, select: { id: true, title: true, summary: true, body: true, meta: true } });
    if (!existing) {
      write.changes.push({ kind: "entry", action: "create", label: `${spec.kind} ${spec.slug}`, detail: spec.title });
      if (apply) {
        const created = await db.storyEntry.create({ data: { id: randomUUID(), kind: spec.kind, slug: spec.slug, title: spec.title, summary: spec.summary, body: spec.body, status: "CANON", createdByUserId: actor.id, meta: spec.meta as Prisma.InputJsonValue } });
        await db.storyRevision.create({ data: { id: randomUUID(), entityType: "ENTRY", entityId: created.id, action: "CREATED", actorUserId: actor.id, summary: `Wrote "${spec.title}"` } });
      }
      continue;
    }
    const unchanged = existing.title === spec.title && existing.summary === spec.summary && existing.body === spec.body && stableJson(existing.meta) === stableJson(spec.meta);
    if (unchanged) { write.changes.push({ kind: "entry", action: "unchanged", label: `${spec.kind} ${spec.slug}` }); continue; }
    write.changes.push({ kind: "entry", action: "update", label: `${spec.kind} ${spec.slug}`, detail: spec.title });
    if (apply) {
      // Server-owned keys are carried, exactly as a sheet save does.
      const prior = typeof existing.meta === "object" && existing.meta !== null && !Array.isArray(existing.meta) ? existing.meta as Record<string, unknown> : {};
      const meta = prior.visualArt === undefined ? spec.meta : { ...spec.meta, visualArt: prior.visualArt };
      await db.storyEntry.update({ where: { id: existing.id }, data: { title: spec.title, summary: spec.summary, body: spec.body, meta: meta as Prisma.InputJsonValue, updatedByUserId: actor.id, version: { increment: 1 } } });
      await db.storyRevision.create({ data: { id: randomUUID(), entityType: "ENTRY", entityId: existing.id, action: "UPDATED", actorUserId: actor.id, summary: `Rewrote "${spec.title}"` } });
    }
  }

  // The Atlas. A place with a parent, a body, and connections that is not on
  // any map is still an unplaced place — the atlas audit counts it, and a road
  // to somewhere the map does not show is not a road anyone can follow.
  //
  // Draw Nine is peninsula-level (its parent is the-peninsula, a sibling of
  // Port Arcadia), so it belongs on the world map rather than inside the city
  // scene. The point sits inland and north-east of Port Arcadia, which is the
  // direction the haul road leaves by.
  const [worldMap, drawNine] = await Promise.all([
    db.storyMap.findUnique({ where: { slug: "martino-world" }, select: { id: true } }),
    db.storyEntry.findUnique({ where: { slug: "draw-nine" }, select: { id: true } }),
  ]);
  if (worldMap && drawNine) {
    const existing = await db.storyMapPlacement.findUnique({ where: { mapId_entryId: { mapId: worldMap.id, entryId: drawNine.id } }, select: { id: true } });
    if (existing) write.changes.push({ kind: "entry", action: "unchanged", label: "atlas placement draw-nine" });
    else {
      write.changes.push({ kind: "entry", action: "create", label: "atlas placement draw-nine", detail: "martino-world POINT 54000,50000" });
      if (apply) {
        const placement = await db.storyMapPlacement.create({
          data: {
            id: randomUUID(), mapId: worldMap.id, entryId: drawNine.id,
            geometryKind: "POINT",
            geometry: { type: "POINT", coordinates: [54000, 50000] } as Prisma.InputJsonValue,
            priority: 265, createdByUserId: actor.id,
          },
        });
        await db.storyRevision.create({ data: { id: randomUUID(), entityType: "ENTRY", entityId: placement.id, action: "CREATED", actorUserId: actor.id, summary: "Placed Draw Nine on the world Atlas, inland of Port Arcadia" } });
      }
    }
  }

  // The reciprocal. A connection readable from only one end is half a road,
  // and the atlas audit has been reporting exactly that for months.
  const arcadia = await db.storyEntry.findUnique({ where: { slug: "port-arcadia" }, select: { id: true, meta: true } });
  if (arcadia) {
    const meta = (arcadia.meta ?? {}) as Record<string, unknown>;
    const connections = Array.isArray(meta.connections) ? meta.connections as Array<Record<string, unknown>> : [];
    if (!connections.some((row) => row?.to === "draw-nine")) {
      write.changes.push({ kind: "entry", action: "update", label: "REGION port-arcadia", detail: "reciprocal connection to draw-nine" });
      if (apply) {
        const next = { ...meta, connections: [...connections, { to: "draw-nine", by: "haul road", notes: "The decommissioned Aegis spur south into the workings. Unmaintained, and the only road to Draw Nine." }] };
        await db.storyEntry.update({ where: { id: arcadia.id }, data: { meta: next as Prisma.InputJsonValue, updatedByUserId: actor.id, version: { increment: 1 } } });
        await db.storyRevision.create({ data: { id: randomUUID(), entityType: "ENTRY", entityId: arcadia.id, action: "UPDATED", actorUserId: actor.id, summary: "Connected Port Arcadia to Draw Nine by the old haul road" } });
      }
    } else {
      write.changes.push({ kind: "entry", action: "unchanged", label: "REGION port-arcadia" });
    }
  }

  write.report(apply ? "The Hollow Wing — APPLYING" : "The Hollow Wing — dry run");
}

main().then(() => db.$disconnect(), (error) => { console.error(error); return db.$disconnect().then(() => process.exit(1)); });
