import "../lib/environment";
import { getPrismaClient, type Prisma } from "@habitat/db/client";
import { creatureMetaSchema } from "../lib/story-meta-schemas";

/**
 * The Machines — a new shelf on the species library (owner ruling 2026-09-01).
 *
 * This is a high-tech world: attack and defense drones, walkers, siege
 * platforms, and pursuit frames belong on the shelf beside the beasts. The
 * design law they all share comes from Nation Management's soulless-garrison
 * ruling: a machine has no soul, so the Forge never held it — destroyed is
 * destroyed, replaced with coin and materials — and it SIPS Essence daily just
 * to run. Machines sit BESIDE the taxonomy of monsters, not inside it: the
 * locked taxonomy classifies the living, and nothing here is alive.
 *
 * Filed as a race umbrella (`machines`, parent null) + seven patterns.
 *
 *   pnpm --filter @habitat/web exec tsx scripts/author-machine-species.ts [--apply]
 */

type MachineSeed = {
  slug: string;
  title: string;
  summary: string;
  body: string;
  parent: string | null;
  biomes: string[];
  threat: string;
  harvest: string;
};

const seeds: MachineSeed[] = [
  {
    slug: "machines",
    title: "Machines",
    parent: null,
    biomes: [],
    threat: "By pattern. The shelf runs from surveillance birds to siege platforms; what they share is that none of them can be intimidated, demoralized, or reclaimed.",
    harvest: "Salvage: frame alloy, actuator trains, optics, and the Essence cells that ran them. A dead machine is a parts bin; stripping one is Engineering work, not butchery.",
    summary:
      "The soulless shelf: war robotics of a high-tech world — drones, walkers, siege frames. No soul, no Forge, no reclamation; they sip Essence daily to run, and destroyed is destroyed.",
    body: `This is a high-tech world, and the shelf reflects it: beside the beasts and the peoples stand the Machines — the drones, walkers, siege platforms, and pursuit frames that every power fields and every foundry builds. They are not a people and not monsters. The taxonomy of monsters classifies the living; a machine stands beside that law, not inside it, because nothing about it is alive.

One law binds the whole shelf, and it is the same law Nation Management runs on: **a machine has no soul, so a [[the-soul-forge]] never held it.** It cannot bind, cannot reclaim, and cannot come back — destroyed is destroyed, and replacement is a matter of coin, materials, and a bench, never Essence and grief. What a machine takes from the Essence economy instead is upkeep: a daily sip just to run, trivial for one unit, real for a standing army of them. The living garrison gulps from the reserve when it dies; the machine garrison sips from it every day it exists. Every quartermaster in the world knows both numbers.

The weave runs everywhere, because the world built these things and keeps building them. The [[cybernetic-ascendancy]] preaches the fusion the frames merely perform; [[helix-arcanobiotics]] and [[aegis-extraction-consortium]] field them by the yard; the [[drone-surveillance-bureau]]'s whole apparatus is this shelf with a filing system; [[iron-saints-pmc]] invoices maintain half the private frames on the peninsula; and the Floating City's manufactories set the patterns everyone else copies a generation late. On the ground: a Cypherist builds and runs frames from the bench, an Archon's Dronewright bonds with them, and a Procurator budgets their upkeep at realm scale.

For writers: machines are the war's honest arithmetic — no morale, no grief, no Forge clock, just cost. Write them procedurally lethal and emotionally vacant, and save the horror for the moment a player realizes the thing pursuing them cannot be discouraged, because there is nothing inside it to discourage. Members of this shelf carry the machine category on their sheets; the race tree law is the same as everywhere else.`,
  },
  {
    slug: "palisade-frame",
    title: "Palisade Frame",
    parent: "machines",
    biomes: ["clearinghouse", "winchworks", "regulator-station"],
    threat: "Low mobile, severe emplaced. A planted Palisade is a wall segment with a fire plan; the mistake is treating one as a vehicle when it has become architecture.",
    harvest: "Plate alloy by the ton, anchor spikes, and the stabilizer gyros every builder wants; the Essence cell array is the prize and the argument.",
    summary:
      "The wall that walks to work: a heavy quadruped that marches to its post, plants itself, and becomes fortification — the defense drone that turned garrison doctrine into a purchase order.",
    body: `The Palisade Frame is defense as a product: a heavy quadruped that walks to its assigned post, drives four anchor spikes into the ground, drops its hull to grade, and becomes — in the load-bearing, fire-plan sense — a section of wall. Emplaced frames interlock fields of fire with their neighbors, shrug small arms, and hold gates, breaches, and bridgeheads with a patience no living garrison matches, because patience is not a virtue in them. It is the absence of anything else.

Every serious fort on the map fields some: [[clearinghouse]] plants them along the bonded wharves, [[winchworks]] seats two above the cradles, and [[regulator-station]]'s corridor perimeter is Palisade doctrine end to end. The frame's economics are the textbook case of the soulless garrison — a daily Essence sip against the living wall's reclamation gulps — and its tactical weakness is the same as its virtue: a planted Palisade is exactly where it is. Attackers who cannot crack one go around it, and the doctrine manuals' whole second chapter is about making sure "around" is somewhere worse.

For writers: the Palisade is siege furniture with a temper. The image that sells it is the walk — a wall section striding through town at dawn to its post, children following it, and nobody finding that strange anymore.`,
  },
  {
    slug: "chaff-wasp",
    title: "Chaff Wasp",
    parent: "machines",
    biomes: ["the-shattercore", "breakline", "gullwatch"],
    threat: "Trivial alone, serious in weather. A chaff cloud exists to be shot down slowly enough for something else to happen; the ones that reach you are carrying the something.",
    harvest: "Barely worth bending for: rotor cores and a thumb-sized cell. Salvage crews sweep them by the sackful and sell by weight.",
    summary:
      "The sky's small change: a cheap, expendable rotor drone fielded in clouds — built to die usefully, which is the one job no living thing should be given.",
    body: `The Chaff Wasp is the answer to a procurement question nobody phrases out loud: what is the cheapest thing that can die usefully? A rotor drone the size of a folded coat, stamped out by the crate, flown in clouds — chaff — that screen advances, draw fire, spot targets, foul optics, and, in the attack patterns, arrive carrying a charge. Any single Wasp is nearly harmless and nearly worthless. That is the design. A chaff cloud is bought by the hundred and spent like ammunition, because it is ammunition with initiative.

Doctrine grew around the arithmetic: defenders who fire on chaff reveal positions and burn stock; defenders who don't get the cloud in close. The [[iron-saints-pmc]] bill chaff screens by the minute; [[breakline]] flies them over the stabilization edge where losing hardware is the job description; and the pickets at [[gullwatch]] log Wasp contrails in the same margin as the birds, with less affection.

For writers: chaff is war's disposability made visible — the sky filling with small cheap deaths so the expensive things underneath can move. The living quartermaster's line about them is the shelf's whole ethic: "they die so nobody has to come back."`,
  },
  {
    slug: "jackknife",
    title: "Jackknife",
    parent: "machines",
    biomes: ["draw-nine", "the-mutation-belt", "arcadia-gate"],
    threat: "High. A courser closes faster than a horse, corners faster than a hound, and arrives already cutting; pairs hunt with a geometry that herds the target into the second blade.",
    harvest: "Actuator trains and blade steel; the sprint capacitors sell to racers and to people the sprint capacitors should not be sold to.",
    summary:
      "The skirmish courser: a low, fast quadruped that closes like a thrown blade — escort, outrider, and the reason convoy raiders check the treeline twice.",
    body: `The Jackknife is speed with a job: a low quadruped courser, all haunch and shoulder, that escorts convoys, runs down raiders, and skirmishes ahead of columns like a hound built by an armorer with a grudge. The name is the gait — at sprint it folds and snaps open, folds and snaps open, covering broken ground in a series of blade-like lunges that end, for the target, exactly the way the name suggests. Pairs hunt with machined geometry: the first drives, the second waits where the driving leads.

Coursers changed road war more than anything since the towpath. A convoy with a Jackknife screen cannot be casually raided; a raider with Jackknives cannot be casually outrun; and every escort contract on [[arcadia-gate]] now has a line-item where cavalry used to be. Off the roads they serve as perimeter runners at sites too dangerous to walk — [[draw-nine]]'s approach, the Belt's survey lines — because a courser can be lost without a letter to anyone.

For writers: the Jackknife is pursuit with the humanity subtracted — a chase scene where the pursuer does not tire, gamble, or flinch. The one mercy is that it does exactly what it was told, which makes WHO told it the entire story.`,
  },
  {
    slug: "millstone",
    title: "Millstone",
    parent: "machines",
    biomes: ["southreach-complex", "port-arcadia", "ashline-exchange"],
    threat: "Extreme, eventually. A Millstone arrives late, cannot be discouraged, and reduces fortifications the way its name suggests — nothing dramatic, nothing survivable.",
    harvest: "The heaviest salvage on the shelf: track sections, ram plate, and a powerplant a settlement can run a district on. Recovering one is an expedition; owning the wreck is a claim worth fighting over.",
    summary:
      "Patience with treads: the siege platform that ends arguments — slow to arrive, impossible to discourage, and named for what it does to walls.",
    body: `The Millstone is what the high-tech world builds instead of a battering ram: a tracked siege platform the size of a customs house, plated past argument, that arrives at a fortification late and then makes the fortification's schedule irrelevant. It does not charge. It grinds — breach ram, siege bores, and a main battery that fires with the tempo of a slow clock, taking a wall apart the way its namesake takes grain. The joke on the gun lines is that you can outrun a Millstone your whole life and still lose to it, because it was never chasing you. It was chasing the wall.

Millstones are strategic property, counted by name in treaties. [[southreach-complex]]'s approach roads were graded for them in the industrial years; [[port-arcadia]] keeps its pair where visitors can see them, which is the point of keeping them; and the [[ashline-exchange]] freight ledgers still carry the special flatcar ratings their transport requires. Fielding one against a hard fort is the SIEGE half of the storm-or-wait doctrine made steel: a Millstone IS the storm, arriving at walking pace.

For writers: the Millstone's horror is scheduling. From the day one is loaded onto a flatcar somewhere, a distant garrison's remaining lifespan becomes arithmetic — and everyone in the fort can do the math.`,
  },
  {
    slug: "collector-pattern",
    title: "Collector Pattern",
    parent: "machines",
    biomes: ["port-arcadia", "velvet-reach", "charnel-lock"],
    threat: "Absolute, narrow, and slow. A Collector pursues exactly one writ at a time, harms nothing outside it, and does not stop. It does not run. It has never needed to.",
    harvest: "Nobody strips a Collector. Partly the armor. Mostly the question of who accepts the writ next.",
    summary:
      "The pursuit frame: a bipedal machine that walks toward one named debtor until the writ is satisfied — it does not run; it has never needed to.",
    body: `The Collector Pattern is the shelf's quiet nightmare: a bipedal pursuit frame, man-height and coat-wearing where local law requires decency, that accepts exactly one writ — a name, a debt, a warrant — and then walks toward its subject until the writ is satisfied. It does not run. It has never needed to. It boards ferries, waits politely at locks, stands in rain, and arrives — days or weeks later, at a supper, at a wedding, at the end of a dock — with the writ still open and no opinion about any of it. Collectors harm nothing outside their writ, which is why they are legal almost everywhere, and why the sound of that steady, unhurried tread has ended more flights from justice and more flights from debt than every cell in every courthouse.

Who fields them is a shorter list than who fears them: licensed recovery houses in [[port-arcadia]], certain patient interests around [[velvet-reach]]'s card tables, and — the leg insists, though the Families neither confirm nor advertise — at least one that has passed [[charnel-lock]] northbound. The polite fiction that no Collector has ever been fielded on a spite writ is maintained by everyone, believed by no one, and priced accordingly.

For writers: the Collector is dread on a schedule with perfect manners. Never let one hurry, never let one threaten — the walk IS the threat — and remember the design law that makes it bearable: a writ can be satisfied. Debts can be paid, warrants answered, names cleared. The machine does not want you. It wants the writ closed, and the difference is the whole story.`,
  },
  {
    slug: "bureau-stork",
    title: "Bureau Stork",
    parent: "machines",
    biomes: ["port-arcadia", "heartland", "arcadia-gate"],
    threat: "None, physically. A Stork has never harmed anyone. What it has done is watch them, which turns out to be worse in every way that reaches a courtroom.",
    harvest: "The optics package, if you can bring one down without being seen doing it — a sentence that has ended careers on both of its clauses.",
    summary:
      "The Bureau's patience: a high-altitude glider that watches, forgets nothing, and sells what it saw — the surveillance state with feathers of solar film.",
    body: `The Bureau Stork is the [[drone-surveillance-bureau]] made visible, barely: a long-winged high-altitude glider, solar-filmed and near-silent, that rides thermals over cities and trade roads for weeks at a stretch, watching. It carries no weapon. It has never harmed anyone. It photographs wharves, reads wakes, logs convoy timings and rooftop meetings and who left by which gate before dawn — and everything it takes flows down into the Bureau's files, where it waits for a buyer, a warrant, or a price.

The Stork's real payload is doubt. Nobody on the [[arcadia-gate]] wharves or [[heartland]]'s five quays can say at any given hour whether the speck in the high blue is a bird, and the Bureau spends good money keeping the question expensive to answer. The gulls resent them, which the pickets at Gullwatch log with open partisanship; the smart operators simply price the sky into every arrangement, which is exactly the tax the Bureau intends.

For writers: the Stork is surveillance as weather — permanent, ambient, deniable. The scene that sells it is not the drone; it is two people rescheduling a conversation indoors, without either of them looking up or saying why.`,
  },
  {
    slug: "armistice-frame",
    title: "Armistice Frame",
    parent: "machines",
    biomes: ["ashline-exchange", "halfload", "lastwater"],
    threat: "Moderate and deeply variable: every Armistice is decades old, locally repaired, and configured by whoever holds it now. Treat each one as a stranger, because it is.",
    harvest: "The most rebuilt salvage in the world — every part interchangeable with every other Armistice, which is why they refuse to die as a pattern.",
    summary:
      "Every army's grandfather: the mass-produced war frame of a finished war, surplus-sold into every arsenal on the map — old, rebuilt, everywhere, and nobody's exclusively.",
    body: `The Armistice Frame is the machine the world has instead of a common language: a general-purpose bipedal war frame mass-produced for a war that ended — the armistice it is named for predates most people carrying its parts — and then surplus-sold, resold, captured, copied, and cannibalized into every arsenal, militia, and caravan guard on the map. There is no such thing as a standard Armistice anymore. There is this one, with its mismatched shoulder, its third owner's paint under its fifth owner's paint, and a service history in four languages, two of them dead.

Its genius was never performance; it was interchangeability. Every Armistice part fits every Armistice, so the pattern refuses to die — shot ones become parts for standing ones, and the type persists the way old rivers persist, by being everyone's. Freight guards at [[ashline-exchange]] lean on them, [[halfload]]'s wharf association fields a famous pair with names and drinking songs, and the outfitters at [[lastwater]] rent them to caravans by the crossing, sand-proofed and bad-tempered.

For writers: the Armistice is the shelf's history lesson — proof the world has been building soldiers without souls for generations, and a walking question nobody asks out loud: the war it was built for ended. Which war, and who won, is a subject the oldest frames' service plates have outlived.`,
  },
];

const db = getPrismaClient();

function stableJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value as Record<string, unknown>).sort().map((k) => `${JSON.stringify(k)}:${stableJson((value as Record<string, unknown>)[k])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

async function main() {
  const apply = process.argv.includes("--apply");
  const identity = await db.$queryRaw<Array<{ database: string }>>`SELECT current_database() AS database`;
  const actor = await db.user.findFirstOrThrow({ where: { role: "ADMIN", isActive: true }, orderBy: { id: "asc" }, select: { id: true } });

  const batch = new Set(seeds.map((s) => s.slug));
  const problems: string[] = [];
  const slugExists = async (slug: string) =>
    batch.has(slug) || Boolean(await db.storyEntry.findUnique({ where: { slug }, select: { id: true } }));
  for (const seed of seeds) {
    const meta = { category: "machine", parent: seed.parent, biomes: seed.biomes, threat: seed.threat, harvest: seed.harvest, gameId: null, openQuestions: [] };
    const parsed = creatureMetaSchema.safeParse(meta);
    if (!parsed.success) problems.push(`${seed.slug}: meta invalid — ${parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ")}`);
    for (const biome of seed.biomes) if (!(await slugExists(biome))) problems.push(`${seed.slug}: habitat ${biome} does not resolve`);
    for (const match of seed.body.matchAll(/\[\[([a-z0-9-]+)\]\]/g)) {
      if (!(await slugExists(match[1]!))) problems.push(`${seed.slug}: dead link [[${match[1]}]]`);
    }
  }
  if (problems.length) {
    console.error(JSON.stringify({ database: identity[0]?.database, FAILED: problems }, null, 2));
    process.exitCode = 1;
    return;
  }

  const plan: string[] = [];
  for (const seed of seeds) {
    const meta = { category: "machine", parent: seed.parent, biomes: seed.biomes, threat: seed.threat, harvest: seed.harvest, gameId: null, openQuestions: [] } as unknown as Prisma.InputJsonValue;
    const current = await db.storyEntry.findUnique({ where: { slug: seed.slug } });
    if (!current) {
      plan.push(`create CREATURE ${seed.slug}${seed.parent === null ? " (race umbrella)" : ""}`);
      if (!apply) continue;
      const created = await db.storyEntry.create({ data: {
        kind: "CREATURE", slug: seed.slug, title: seed.title, summary: seed.summary,
        body: seed.body, meta, status: "CANON", createdByUserId: actor.id,
      } });
      await db.storyRevision.create({ data: {
        entityType: "ENTRY", entityId: created.id, action: "CREATED", actorUserId: actor.id,
        summary: `Machines shelf: filed ${seed.title}`,
      } });
      continue;
    }
    const same = current.body === seed.body && current.title === seed.title && current.summary === seed.summary
      && stableJson(current.meta) === stableJson(JSON.parse(JSON.stringify(meta)));
    if (same) continue;
    if (current.body !== null && current.body !== seed.body && !current.body.startsWith(seed.body.slice(0, 40))) {
      plan.push(`SKIP ${seed.slug} (edited by hand)`);
      continue;
    }
    plan.push(`update ${seed.slug}`);
    if (!apply) continue;
    await db.storyEntry.update({ where: { id: current.id }, data: {
      title: seed.title, summary: seed.summary, body: seed.body, meta,
      version: { increment: 1 }, updatedByUserId: actor.id,
    } });
  }

  console.log(JSON.stringify({ database: identity[0]?.database, mode: apply ? "APPLY" : "PREVIEW", machines: seeds.length, plan: plan.length ? plan : ["nothing to do"] }, null, 2));
}

main().finally(() => db.$disconnect());
