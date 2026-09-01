import "../lib/environment";
import { getPrismaClient, type Prisma } from "@habitat/db/client";
import { creatureMetaSchema } from "../lib/story-meta-schemas";

/**
 * The Riverlands living-world pass, part two: the wildlife.
 *
 * Seven species for the watershed — the first creatures in the codex whose
 * habitats name Riverlands ground. Every one is tied to a leg's economy or
 * custom, because in the most settled country in the world the wildlife and
 * the people share an arrangement. Filed under `beasts`; NO Adaptive
 * Mutation anywhere — that ladder is Bloomfall Reach's alone, by owner ruling.
 *
 *   pnpm --filter @habitat/web exec tsx scripts/author-riverlands-wildlife.ts [--apply]
 */

type CreatureSeed = {
  slug: string;
  title: string;
  summary: string;
  body: string;
  biomes: string[];
  threat: string;
  harvest: string;
};

const seeds: CreatureSeed[] = [
  {
    slug: "towback",
    title: "Towback",
    summary:
      "The barge-hauler: a broad, patient river ox bred to walk the towpaths for generations — the Riverlands' working muscle, and the only animal with a wage scale.",
    biomes: ["riverlands", "arcadia-gate", "heartland"],
    threat: "None domesticated; a spooked team on a narrow towpath is a different conversation.",
    harvest: "Nothing while it works. A retired towback's hide and tallow are premium goods, and selling a working one to a knacker is the fastest way to be hated on any leg.",
    body: `The towback is what the Riverlands runs on when the wind and the current decline to help: a broad, deep-chested river ox bred over generations for the towpaths, hauling laden barges through the slack reaches with a patience that has become proverbial — "towback temper" is the region's highest compliment for a negotiator. Teams walk the banks of every leg, and the beasts know the paths, the locks, and the lie-bys better than most crews; a veteran towback will stop, unprompted, at exactly the point where its barge must be poled off the bar ahead.

The relationship between the region and the animal is closer to labor law than husbandry. Towpath teams are logged, rested, and paid for in fodder-shares by long custom, and the phrase "the beast's wage" appears in [[heartland]] freight contracts without irony. Bargemen talk to them constantly, and every working towback has a river-name it demonstrably answers to. Mistreating one is the rare offense that unites all five gate factions, because everyone's cargo walks on the same four legs eventually.

For writers: the towback is the region's working heartbeat and its softest pressure point — a plague, a requisition, or a panic among the teams would strangle the legs faster than any blockade. And a towback refusing a stretch of path it has walked for ten years is the Riverlands' quietest possible way to say something is wrong ahead.`,
  },
  {
    slug: "tollgull",
    title: "Tollgull",
    summary:
      "The grey opportunist of the money river — follows wrecks and fleets alike, and Gullwatch has read the war in its wings for longer than any manifest survives.",
    biomes: ["arcadia-gate", "gullwatch", "sunken-row"],
    threat: "Low, persistent, and organized around unattended cargo; a wharf flock can strip an open grain barge with the efficiency of a customs seizure.",
    harvest: "Eggs and oil-feathers in season, taken by the bank families under an old right; the birds themselves are never shot on the wing — bad luck of the specific, documented kind.",
    body: `The tollgull is the money river's grey conscience: a heavy, clever, sharp-eyed gull that follows profit in every form profit takes on the water — fleets, wrecks, fish runs, open hatches, and funerals, with an even hand. Bargemen named it for its habit of perching the toll houses and bridge rails wherever coin changes hands, and the darker joke underneath is well earned: the flocks find a wreck before any rescue does, and a column of tollgulls circling where no boat should be is the leg's oldest bad news.

[[gullwatch]] built a doctrine on the bird. Gulls shift ahead of fleets, mass ahead of wrecks, and abandon water that is about to become dangerous, and the picket's logs pair wing-counts with convoy fates over more seasons than any manifest archive survives. The birds are honest, the keepers say, because they have no side — only appetite, which on [[arcadia-gate]] makes them the most impartial observer available.

At [[sunken-row]] the relationship is domestic: the Row's flocks nest in the drowned hulls, are fed by custom, and are watched like instruments — the salvage families swear the gulls know which wrecks still hold air, and follow them accordingly. For writers: a tollgull doing something unusual is the money river's cheapest possible omen, and it is never wrong by accident.`,
  },
  {
    slug: "falls-swift",
    title: "Falls-Swift",
    summary:
      "The little dark bird that nests behind Cliffgate's waterfalls and rides the chain-song thermals — the mountain leg's living weather instrument, and its luck.",
    biomes: ["cliffgate", "winchworks", "thundershade"],
    threat: "None. The leg's response to anyone who harms one is the threat.",
    harvest: "None taken. Abandoned nest-cups from behind the falls are collected after fledging — waterproof, feather-felted, and worth more as luck than as material.",
    body: `The falls-swift is a small dark blade of a bird that does the impossible for a living: it nests *behind* the great falls of [[cliffgate]], flying through standing water into the spray-hollowed galleries where nothing else goes, and it rides the gorge's chain-song thermals all day in flickering hundreds. The [[winchworks]] crews time the lifts by them without thinking about it — swifts high and playing means clean air and steady iron; swifts gone to the walls means weather coming down the gorge with intent.

[[thundershade]] holds the bird closest. In a village where speech drowns, the swifts are the sky's handwriting: their evening return through the falls is the day's clock, and the moss farmers read storm, wind-shift, and — twice in memory, both times rightly — *get off the terraces now* from the flocks' behavior. The village signs the bird's name with the same gesture as "luck," and the connection is not decorative: nobody on the leg can point to a season when the swifts were wrong.

The swifts do not nest anywhere the chains have gone silent. The leg has noticed. Nobody has said it louder than that, and per the mountain leg's whole character, nobody will — but the galleries behind the falls above [[deadhaul]]'s stopped incline are empty of them, and have been as long as the incline has been stopped. For writers: that is the entire fact, and it is load-bearing; do not explain it.`,
  },
  {
    slug: "boneback-sturgeon",
    title: "Boneback Sturgeon",
    summary:
      "The ancient armored fish of the tannin water that swallows what the Rift washes down — on Riftgate, fishing is archaeology, and the Families buy the gizzards sight unseen.",
    biomes: ["riftgate", "wakewater", "charnel-lock"],
    threat: "A hooked adult can pull a skiff; an old one in a narrow channel decides where the skiff goes. Otherwise indifferent to people, which on Riftgate counts as warmth.",
    harvest: "Flesh, roe by strict season — and the gizzard, sold sealed and unopened to the Bone Market at a flat price, contents unseen. Opening one yourself is legal everywhere and done nowhere.",
    body: `The boneback sturgeon is older than the trade that named it: a huge, armored, slow-growing fish that works the tannin-dark bottoms of [[riftgate]], hoovering the gravel for whatever the current carries down from the [[grand-rift]] country — and the current carries everything. Grit, shell, bone, relic glass, ring-metal, coin: the boneback swallows it all as gizzard-stone, carries it for decades, and grows around it, and the oldest fish are slow swimming reliquaries with a century of the river's losses ground smooth inside them.

That fact built an economy with rules. On Riftgate, sturgeon-fishing is archaeology conducted by rod, and the gizzard is the prize: sold sealed and unopened to the [[bone-market-families]] at a flat price, contents unseen, under a custom so settled it functions as law. The flat price is the genius of it — the fisher is paid for the lottery ticket, never the winnings, so no fisher ever has a reason to lie, and the Families' appraisers at [[wakewater]] open every gizzard under witness and record what the river confessed. Most hold gravel. Enough hold better that the custom funds itself. A famous few have held things that moved quietly upstairs at [[charnel-lock]] and were never entered in any public book.

For writers: the boneback is the leg's history engine — anything lost up the Rift country in the last hundred years can plausibly surface in a fish, at a wake-house table, under witness, at the worst possible moment. The species itself asks nothing of anyone; it is the river's memory wearing armor, and the dead trade has simply learned to read it.`,
  },
  {
    slug: "salt-ibis",
    title: "Salt Ibis",
    summary:
      "The white walker of the evaporation pans — flocks that pace Sandgate's salt terraces on schedule, and Saltsong's keepers grade the harvest by where the birds refuse to stand.",
    biomes: ["sandgate", "saltsong", "mirrorwater"],
    threat: "None. Startling a working flock off the pans is a fineable offense in Saltsong, and the fine is calibrated to sting.",
    harvest: "Molted plumes, gathered from the pan margins — the corridor's ceremonial white, worn at weddings and truces. The birds are never taken; the desert's arithmetic protects what predicts.",
    body: `The salt ibis is the white punctuation of [[sandgate]]: a tall, deliberate wading bird that paces the evaporation terraces of [[saltsong]] in slow flocks, working the brine margins for the small life that lives at exactly the salinity where good salt forms. That coincidence made the bird an instrument. The ibis will not stand where the brine has gone wrong — too bitter, too fouled, too thin — and the pan-keepers long ago folded the flocks into their craft: a terrace the birds avoid gets tasted before it gets harvested, and a keeper walking the pans at dusk reads bird-spacing the way they read the salt's ring.

At [[mirrorwater]] the ibis holds the morning franchise: the flocks stand the oxbow's margins through the dawn stillness, motionless as the law requires everything else to be, and the village regards a full complement of standing ibis as the flash's second signature — still water, still birds, true mark. Caravans coming off the ridge count the white line as they steer for it.

The corridor's protection of the bird is not sentiment; it is the desert's arithmetic applied to information. The ibis predicts — salt quality, water honesty, and, the old keepers insist, weather off the deep desert a day before [[vultures-patience]] confirms it — and the [[desert-nomad-compact]] does not eat its instruments. For writers: the plume-white of a truce ceremony and the working white of the pans are the same white on purpose, and the corridor knows it.`,
  },
  {
    slug: "glasspike",
    title: "Glasspike",
    summary:
      "The still-water predator of the held river — hunts Glasscalm's flat water by reading the surface like an instrument, and the whisper-crossing custom is partly about not being read back.",
    biomes: ["stormgate", "glasscalm", "needles-eye"],
    threat: "Serious to swimmers, the careless, and anything that breaks the surface twice in the same place. Boats it ignores — boats that behave.",
    harvest: "Firm white flesh prized the whole leg; the lens-flat eyes, dried, sell upriver as instrument-charms — Gaugetown pretends not to buy them and buys them.",
    body: `The glasspike is the reason the held river's stillness never quite reads as peace: a long, pale, near-transparent ambush predator that hangs in [[stormgate]]'s engineered calm and hunts by surface-reading — every ripple, every wake, every drip from a careless oar arrives at its lateral line like a message, and the pike answers messages. On water as flat as [[glasscalm]]'s, that makes it close to omniscient. A feeding strike is a single vertical explosion through the mirror, over before the sound arrives, and the flat water heals behind it with what witnesses always describe, unhappily, as indifference.

The village's whisper-crossing custom is older than any one explanation, and the pilots decline to rank theirs — but they will note, practically, that a glasspike reads disturbance, that a quiet boat is an unread boat, and that the custom has kept the ferry accident-free for as long as the custom has existed. At [[needles-eye]] the pike gathers below the pinch where every hull's wake converges, and the threading guild's advice to swimmers is the leg's shortest: don't.

For writers: the glasspike is the held river's honest predator — no mystery, no glimpse, just an animal perfectly fitted to an unnatural calm, which is its own quiet commentary on what the calm is. It kills nothing it wasn't told about. The telling is the ripple, and everyone on the leg lives accordingly.`,
  },
  {
    slug: "reedjack",
    title: "Reedjack",
    summary:
      "The pack ambusher of the outer floodplain reeds — the reason the safe center has edges, and the first hard lesson of building past the last levee.",
    biomes: ["riverlands", "the-outfall", "first-charter"],
    threat: "Real, patient, and plural: a reedjack pack shadows before it commits, tests fences before it crosses them, and remembers what worked. The outer floodplain's standing argument for walls.",
    harvest: "Pelts with the water-bar pattern, sinew, and the long canines the levee towns drill as charms. Bounties stand in every outer district; the packs persist anyway, which is the point of them.",
    body: `The reedjack is the Riverlands' resident argument against complacency: a lean, water-loving pack predator, reed-striped and near-silent, that works the wild margins of the floodplain — the outer reed seas, the drowned meadows, the fen country out toward [[the-outfall]] — and regards the region's ever-advancing line of levees, fields, and pasture as a slowly improving buffet. Reedjacks are not monsters. They are exactly clever enough: packs shadow herds and travelers for days before committing, probe fences at different points on different nights, and abandon tactics that cost them, which every levee-town stockman will tell you is worse than ferocity.

The species is why "safe center, wild arms" has a texture instead of a border. The deep heartland sees a reedjack once a generation; the last levee sees sign of them weekly; and the ground between — the ground a new landholder drains, walls, and stocks, the [[first-charter]]'s ground — is the negotiation. First fences, first losses, first watch-fires: the reedjack is the building tutorial's unofficial faculty, and old floodplain farmers speak of the local pack almost collegially, as a standard the farm either meets or doesn't.

For writers: reedjacks give the safe region honest teeth without breaking its promise — they threaten carelessness, never towns. And the fen packs out past the levee line are the fattest and boldest in the region, because nothing hunts them there; the Watch's patrol maps mark the fen's edge in the same ink as the packs' — one line, two meanings, nobody past it.`,
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
  const beasts = await db.storyEntry.findUnique({ where: { slug: "beasts" }, select: { id: true } });
  if (!beasts) throw new Error("The beasts umbrella is missing; refusing to file wildlife under nothing.");

  const problems: string[] = [];
  for (const seed of seeds) {
    const meta = { category: "natural", parent: "beasts", biomes: seed.biomes, threat: seed.threat, harvest: seed.harvest, gameId: null, openQuestions: [] };
    const parsed = creatureMetaSchema.safeParse(meta);
    if (!parsed.success) problems.push(`${seed.slug}: meta invalid — ${parsed.error.message}`);
    for (const biome of seed.biomes) {
      const exists = await db.storyEntry.findUnique({ where: { slug: biome }, select: { id: true } });
      if (!exists) problems.push(`${seed.slug}: habitat ${biome} does not resolve`);
    }
    for (const match of seed.body.matchAll(/\[\[([a-z0-9-]+)\]\]/g)) {
      const exists = await db.storyEntry.findUnique({ where: { slug: match[1]! }, select: { id: true } });
      if (!exists) problems.push(`${seed.slug}: dead link [[${match[1]}]]`);
    }
  }
  if (problems.length) {
    console.error(JSON.stringify({ database: identity[0]?.database, FAILED: problems }, null, 2));
    process.exitCode = 1;
    return;
  }

  const plan: string[] = [];
  for (const seed of seeds) {
    const meta = { category: "natural", parent: "beasts", biomes: seed.biomes, threat: seed.threat, harvest: seed.harvest, gameId: null, openQuestions: [] } as unknown as Prisma.InputJsonValue;
    const current = await db.storyEntry.findUnique({ where: { slug: seed.slug } });
    if (!current) {
      plan.push(`create CREATURE ${seed.slug}`);
      if (!apply) continue;
      const created = await db.storyEntry.create({ data: {
        kind: "CREATURE", slug: seed.slug, title: seed.title, summary: seed.summary,
        body: seed.body, meta, status: "CANON", createdByUserId: actor.id,
      } });
      await db.storyRevision.create({ data: {
        entityType: "ENTRY", entityId: created.id, action: "CREATED", actorUserId: actor.id,
        summary: `Riverlands living world: filed the ${seed.title}`,
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

  console.log(JSON.stringify({ database: identity[0]?.database, mode: apply ? "APPLY" : "PREVIEW", species: seeds.length, plan: plan.length ? plan : ["nothing to do"] }, null, 2));
}

main().finally(() => db.$disconnect());
