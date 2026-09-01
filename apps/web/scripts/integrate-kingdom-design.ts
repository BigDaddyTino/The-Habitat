import "../lib/environment";
import { getPrismaClient, type Prisma } from "@habitat/db/client";
import { systemMetaSchema } from "../lib/story-meta-schemas";

/**
 * Kingdom Management — codex integration ("Holding Ground" rev 12, owner-approved).
 *
 * What lands, per the spec's own §16 and the owner's order to make it readable
 * and usable for a gamer — what you get, and for what:
 *
 *   1. Appended design layers (own markers, everything above untouched) on
 *      kingdom-management, outpost-and-city-management, the-power-balance,
 *      faction-membership, and a siege addendum on battle-management.
 *   2. The faith lane: SYSTEM `the-faith-lane` + five faith entries, each with
 *      its perk and its price.
 *   3. Faction sheets: the new `faith` field backfilled on all 34 rows (only
 *      the canon-obvious five get a faith; null = secular/undeclared), and the
 *      KM tier recorded in `gameTag` (never overwriting a hand-set tag).
 *   4. buildStatus concept -> designed on the four designed systems.
 *
 *   pnpm --filter @habitat/web exec tsx scripts/integrate-kingdom-design.ts [--apply]
 */

const db = getPrismaClient();

// ── 1. Appended layers ───────────────────────────────────────────────────────

const LAYERS: Record<string, { marker: string; body: string }> = {
  "kingdom-management": {
    marker: "## Designed — the crown, rung by rung",
    body: `## Designed — the crown, rung by rung

The full design is settled (the "Holding Ground" spec, owner-approved 2026-09-01). This is the gamer's version: what you get, and for what.

**The Ladder — five rungs, each adds verbs, none retires the ones below.**

- **Homestead** — a parcel and a roof. You get: build, farm, fence, hire hands. For: buying a charter parcel.
- **Outpost** — a fortified point with a job. You get: garrison, patrols, supply, a signal plan. For: holding a road or crossing.
- **Town** — a population that isn't yours. You get: districts, trades, law, admission policy. For: growth.
- **City** — districts, wharves, politics. You get: grand projects, real armies, factions inside your own walls.
- **Kingdom** — multiple holdings and vassals. You get: doctrine, diplomacy, war, a seat at the world's table.

**Getting ground — four verbs.**

- **Buy** — escrowed charter parcels, region by region; rare on purpose, because the world is owned.
- **Seize** — siege or coup. Inside a faction the Bannerlord law holds: even if YOU take the fort, the leader decides who gets it.
- **Earn** — a granted fief, with the obligations grants exist for.
- **Found** — start from nothing; slowest, and nobody holds paper over you.

**The Kingdom Level — do more, grow more, reach further.**

- The realm earns XP from REAL work only: holdings prospering, projects finished, wars won, sieges stood, treaties signed, trade moved, Court Days handled.
- The level extends your caps: how many holdings, how big your armies, how many officer seats, how many vassals, what project tiers.
- The curve is steep — each level costs more than half again the last — and every third level is a **ceiling** no XP can pass: the realm must quest its proving, the way trades prove their masters. The kingdom pass's reserved ceiling teacher is the Crown Without a Name.

**The crown's six talent trees** (your own kingdom only — join a faction and you live under THEIR doctrine): **Might** (levies, garrisons, sieges) · **Coffers** (tariffs, routes, markets) · **Works** (machinery, infrastructure, bought additions) · **Arcana** (Forge efficiency, reserves, licensed casting) · **Roots** (people, land, food, loyalty) · **Faith** (adoption, spread, tolerance, and the deep end of your faith's perk).

**Court Day — the first of every month.** The court convenes with a real docket: petitions, windfalls, disasters, omens, absurdities. Attend and rule; skip and doctrine auto-decides; be away and a governor rules in your name — and the Court Record is waiting when you return. The sims priced attendance plainly: a present ruler clears roughly double what auto-doctrine does, a good governor sits between, and a poor governor is WORSE than no governor, because doctrine does not improvise.

**The Syndicate** — the multiplayer crown: the leader decides, members hold the officer seats with real authority in their domains, and the realm's level, ceilings, and trees are everyone's work. Servers can carry several Syndicates vying with each other and the NPC powers alike.

**Succession — the Mourning.** A ruler's true death starts a live succession crisis: the heir you named holds the realm or it fractures, decided by what you actually built — officers, treasury, doctrine, faith. What survives persists as an NPC power the next run meets, wearing your old name. The realm remembers you; it does not belong to you.

**Standing laws:** every competing Great Power starts a world at the SAME total points and diverges only by play; story-critical ground never flips until its arc resolves; your crown joins the scoreboard when the world recognizes it; sacred sites can be held but never owned — grievance runs until you return them, gift them, or win their people; and the soulless garrison ([[machines]]) trades the Forge clock for a daily Essence sip. See [[the-power-balance]] for the world game and [[the-faith-lane]] for what belief buys.`,
  },
  "outpost-and-city-management": {
    marker: "## Designed — running held ground",
    body: `## Designed — running held ground

Settled design ("Holding Ground", 2026-09-01), in the gamer's terms: what your holding runs on, and what each thing buys you.

**Five stocks, accrued by the world's day, spent on everything.**

- **Food** — from farms, fisheries, caravans. Feeds people, growth, and armies marching. Run out and the gate queue reverses.
- **Materials** — lumber, quarry, salvage, trade. Feeds building, repair, siege works. Run out and everything stays broken.
- **Coin** — tariffs, storefronts, tolls, routes. Feeds wages, contracts, bribes, mercenaries. Run out and the garrison walks.
- **Essence** — the harvest economy, purchase, tithe. Feeds THE FORGE RESERVE: reclamation and binding. Run out and people stop coming back.
- **People** — growth, refugees, conquest. Feed districts, trades, the levy. Run out and nothing else matters.

**Districts, walkable, staffed by the named.** A settlement is its districts; district slots take buildings from the nine trades' blueprints, and named residents staff them — poach the master smith and her yield moves with her.

**Bought additions** — every place of control has purchasable upgrades: machinery that boosts a district's production, profession houses that boost a resource line, and more by settlement type. You walk past everything you bought.

**Admission and binding are the same conversation.** Who gets through the gate, and who gets the Forge — a refugee given shelter but refused binding has been given a roof and not a future, and somebody in the queue says so out loud.

**Defense is a composition choice.** The living garrison costs nothing until it dies, then gulps the reserve at reclamation prices; a machine garrison ([[machines]]) sips Essence daily, and destroyed is destroyed. The sims' verdict: hybrids hold a day or two less than pure living walls and end the siege with the Forge still breathing — machines don't hold longer, they hold cheaper.

**Absence is survivable by design.** Officers act on standing policy, couriers find you with reports, and Court Day falls to a governor when you're away. The world never punishes absence with silence; it punishes it with history.`,
  },
  "the-power-balance": {
    marker: "## Designed — the world game",
    body: `## Designed — the world game

Settled design ("Holding Ground", 2026-09-01). The balance is now a scoreboard with rules.

**Four tiers of power.**

- **Great Powers** race for world dominance on the point system: the [[national-defense-directorate]] (Military Might), [[aegis-extraction-consortium]] (Industry & Magic, through its wings), [[tropic-pearl-trade-house]] (Wealth as trade), the [[floating-city-council]] (Technology), and the [[ossuary-covenant]] (The Dead — necromantic magic and the [[bone-market-families]]' debt; a throne is a collection).
- **Free Powers** are scored but not racing — power without ambition, led by [[the-free-peoples-compact]].
- **Institutions** are the world's city-states: independent seats the powers court, fund, and buy influence from — conquerable, but they don't fight aggressively, and they serve whatever is in their best interest at the time. [[stormglass-cartel]] and the [[church-of-the-first-gift]] head the tier today; unwritten regions will bring more.
- **Shadow Powers** play a different game and are never scored; the board measures the war it can see.

**The points** are computed from holdings across six axes — Military, Technology, Magic, Wealth, Resources, Territory — with every wing feeding its banner through the faction tree this shelf already stores. **Every Great Power starts a world at the same total**; their shapes differ, their totals do not, and everything after the first day is play and honest randomness. The one scripted war stays Ignit Island.

**The rules of the race:** claimable places are pre-defined per region, and faction-held ones are contested from the world's first day; story-critical ground is hard-shielded until its arc resolves; a runaway leader draws a coalition (the sims hold the spread at 1.3x with about eight lead changes a world because of it); late-game wars swallow institution seats too; and the player's crown joins the board by RECOGNITION — a threshold the whole server sees crossed.

**Where you read it:** in the world, on map tables; out of it, on the Kingdom page's territory atlas — territories, resources, who holds what, and the five shapes diverging from their equal start.`,
  },
  "faction-membership": {
    marker: "## Designed — joining, and what it costs",
    body: `## Designed — joining, and what it costs

Settled design ("Holding Ground", 2026-09-01), in plain terms.

- **Joining is wholesale.** Swear to a power and you take on their beliefs — doctrine, faith, harvest policy, all of it. Your realm trees are THEIRS; your say in them is the influence game, played in service, standing, and grudge.
- **The fief law is Bannerlord's** (owner ruling): take a fort under a banner and the LEADER decides who gets it. Winning fiefs inside a faction is politics with a body count attached.
- **What you get:** supply lines, safehouses, reclamation rights at member rates, intelligence, guns that show up when called — the power's whole apparatus, priced in duties and exclusivity.
- **Striking out instead** means every belief is your own decision and every consequence has your name on it — see [[kingdom-management]] for what founding costs and buys.
- **Exit stays writable:** desertion, excommunication, bought freedom, burned bridges. A power that cannot be left is a prison, not a faction, and the codex writes factions.`,
  },
  "battle-management": {
    marker: "## The siege addendum — storm, wait, and the soulless wall",
    body: `## The siege addendum — storm, wait, and the soulless wall

Kingdom Management's siege rules land on this system ("Holding Ground", 2026-09-01), and the sims wrote the doctrine.

- **Every siege is still about the Forge — and the reserve is sized in DAYS.** A defender's clock is how long the Core can pay full casualties: shallow clocks on outposts, deep clocks on capitals.
- **The attacker chooses a posture.** **STORM** hits hard and fast, bleeds hard, and a site that falls with its reserve alive falls BURNED. **WAIT** blockades the clock for the intact prize — slower, cheaper in blood, dearer in supply.
- **The doctrine the numbers wrote:** storm shallow clocks — you cannot outrun them, and the prize comes intact anyway; deep clocks fall only to storms, taken burned or not at all. A capital-grade clock defeats a standard army outright, which is what makes capitals a different tier of war.
- **The soulless wall changes the arithmetic** ([[machines]]): a machine garrison cannot be reclaimed and never drains the clock — a pure-machine wall gives a WAIT siege nothing to starve, so storming is the only road in. Hybrid walls trade a little hold-time for a Forge that is still breathing when relief arrives.
- **A quartermaster's tip with teeth:** a fort that promotes its garrison without deepening its reserve has shortened its own clock — veterans reclaim at veteran prices.`,
  },
};

// ── 2. The faith lane ────────────────────────────────────────────────────────

type FaithSeed = { slug: string; title: string; summary: string; body: string; parent: string | null };

const FAITHS: FaithSeed[] = [
  {
    slug: "the-faith-lane",
    title: "The Faith Lane",
    parent: null,
    summary:
      "Belief as a power lane: faiths spread through territories, every one carries a perk and a price, and the world reads yours — a system woven into everything, per the owner's ruling.",
    body: `Faith in Martino is a power lane, not a flavor text ("Holding Ground", owner-approved 2026-09-01). Faiths spread through territories the way influence does — shrines, processions, funerals, what people paint on their doors — and a holding's faith majority changes what its people accept: harvest policy, binding rights, the dead's treatment, war itself.

**The law of the lane: no neutral faiths.** Every faith buys something real and costs something real, so adoption is a build choice. The roster stands at five — [[the-first-gift]], [[the-ossuary-rites]], [[the-forgefaith]], [[the-old-roads]], [[the-crimson-communion]] — with room reserved for faiths the unwritten regions bring.

**The secular position is real.** A crown may honor nothing: no faith's price binds it, no customs constrain its wars — and faith-heavy populations are harder to please under it, their morale bleeding in proportion to their devotion. Demographics are malleable like everything: policy, patronage, suppression, manipulation, and generational drift reshape a people's faith over years, at cost, and noticed.

**Faith is read.** The rites you keep and the faith your realm adopts are legible to the world the way corruption tells and Suspicion are — a fourth thing NPCs know about you without being told, moving prices, access, dialogue, and quests. Factions carry their faith on their sheets (the faith field, slug-linked both ways); most are secular or merely observant, which is itself information.

For writers: faith pressure surfaces diegetically, never as a bar. A rulership choosing between its treasury and its processions is the lane working; a percentage would be the lane failing.`,
  },
  {
    slug: "the-first-gift",
    title: "The First Gift",
    parent: "the-faith-lane",
    summary:
      "The faith of the freely given: worship of the only magic that never cost a life. Perk — the given magic thrives around you. Price — your own law restricts the harvest.",
    body: `The faith the [[church-of-the-first-gift]] keeps and preaches: reverence for creature-gifted magic — the third origin, the only power in the world that was ever freely given — and standing witness against every drop that was taken. Its congregations shelter the gifted, fund the [[sanctuary-of-living-beasts]]' runs, and treat a willing gift as the one sacrament the war has not managed to industrialize.

- **Perk** · The given magic thrives: gifted casters, creature pacts, and the beast trade all favor your ground, and the Sanctuary network aids what you protect.
- **Price** · Your own law restricts the harvest — Essence costs climb, and the extraction powers treat your realm as an obstacle with a flag.

For writers: the First Gift is hope with a spine. Its congregations know exactly what the world does to what they love, and gather anyway.`,
  },
  {
    slug: "the-ossuary-rites",
    title: "The Ossuary Rites",
    parent: "the-faith-lane",
    summary:
      "The faith of the working dead, kept by the Covenant and banked by the Families. Perk — the dead labor for the living. Price — the living hesitate to move in.",
    body: `The rites the [[ossuary-covenant]] keeps and the [[bone-market-families]] bank: the dead as labor, witness, and duty — lawful necromancy as a covenant between generations, in which the dead owe work and the living owe honor, and both debts are collected. Where the Rites hold, funerals are contracts, graves are appointments, and the phrase "rest in peace" is understood as one option on a longer menu.

- **Perk** · The dead work: lawful necromantic labor and garrison, funerals that feed the realm, Covenant services at kin rates.
- **Price** · The living hesitate — growth and immigration suffer under the Rites, and the First Gift's faithful count your workforce as blasphemy.

For writers: the Rites are dignity, not horror — that is what makes them unsettling. The horror writers should reach for is how reasonable it all sounds by the second conversation.`,
  },
  {
    slug: "the-forgefaith",
    title: "The Forgefaith",
    parent: "the-faith-lane",
    summary:
      "The folk religion of the Soul Forge — binding as sacrament, reclamation as resurrection. Nobody organized it; it grew. Perk — cheap reclamation, glad binding. Price — dependence.",
    body: `Nobody founded the Forgefaith and nobody runs it; it grew, the way faiths grow around the one thing in a hard world that visibly keeps its promises. The owner's reasoning stands as its design law: people put their faith in what they feel committed to, and a machine that can rebuild them from the dead is committable. Where the Forgefaith holds, binding is a sacrament, reclamation is resurrection witnessed weekly, and the [[the-soul-forge]] hall is the parish church in every sense that matters.

- **Perk** · Reclamation as devotion: cheaper reclamations, faster binding, and binding policy accepted gladly — the congregation is already queued.
- **Price** · Dependence: a holding without a Forge is a parish without an altar, and its morale bleeds; losing a Core is a military and spiritual catastrophe in the same hour.

For writers: the Forgefaith is the setting looking at its own machinery and kneeling. Its quiet heresy — whispered, never preached — is the question of where the dead ARE between the falling and the platform, and the faith's whole discipline is not asking.`,
  },
  {
    slug: "the-old-roads",
    title: "The Old Roads",
    parent: "the-faith-lane",
    summary:
      "The folk observance of customs older than any crown — crossroads bargains, well-truces, grave-candles. Perk — the customs bless what you move. Price — the customs bind YOU.",
    body: `The Old Roads are not a church; they are everything travelers already do and would be afraid to stop doing — the crossroads bargain never mocked, the well-truce never broken, the grave-candle lit per soul aboard. The Riverlands runs on the observance without naming it: the Honest Well's absolute truce, Candlereach's counted lights, the guest-right every caravan culture keeps. Ask an Old Roads keeper what they believe and they will tell you what they DO, which is the whole theology.

- **Perk** · The customs hold: truce grounds, safe crossings, hospitality — diplomacy and route safety bless everything you move.
- **Price** · The customs bind YOU: honor every truce and guest-right, even for enemies, or the crossroads remember — and a broken custom is a faith crisis with your name in it.

For writers: the Old Roads are the setting's connective tissue made sacred. The strongest scenes are enforcement without clergy — a feud pausing at a wellhead because everyone present would rather fight each other than the custom.`,
  },
  {
    slug: "the-crimson-communion",
    title: "The Crimson Communion",
    parent: "the-faith-lane",
    summary:
      "The Choir's faith: power in the oldest currency, spread like debt. Perk — blood pays now. Price — the debt compounds, and the Choir always collects.",
    body: `The faith the [[crimson-choir]] keeps — organized like a cult, run like a bank, and spread exactly like debt: a small advance, reasonable terms, and a compounding schedule nobody reads until the second collection. The Communion's theology is brutally simple: blood is the oldest currency, power is purchasable in it, and every other faith's talk of gifts and covenants is just worse banking.

- **Perk** · Blood pays now: immediate, potent war and ritual power, advanced on Choir credit with no waiting and no worthiness test.
- **Price** · The debt compounds; every decent power suppresses you on principle; and the Choir ALWAYS collects — on schedule, with interest, from whoever holds the account when it comes due.

For writers: the Communion recruits at the moment of desperation and is genuinely, contractually helpful — that is the trap and the tragedy. Write the first miracle free, the second itemized, and never write the Choir angry; anger is for creditors who might not get paid.`,
  },
];

// ── 3. Faction backfill: faith + KM tier gameTags ────────────────────────────

const FACTION_FAITH: Record<string, string> = {
  "church-of-the-first-gift": "the-first-gift",
  "sanctuary-of-living-beasts": "the-first-gift",
  "ossuary-covenant": "the-ossuary-rites",
  "bone-market-families": "the-ossuary-rites",
  "crimson-choir": "the-crimson-communion",
};

const KM_TIER: Record<string, string> = {
  "national-defense-directorate": "KM · Great Power — Military Might",
  "aegis-extraction-consortium": "KM · Great Power — Industry & Magic",
  "tropic-pearl-trade-house": "KM · Great Power — Wealth (trade)",
  "floating-city-council": "KM · Great Power — Technology",
  "ossuary-covenant": "KM · Great Power — The Dead",
  "the-free-peoples-compact": "KM · Free Power (bloc head)",
  "verdant-marsh-clans": "KM · Free — feeds the Compact",
  "mountain-holdfasts": "KM · Free — feeds the Compact",
  "desert-nomad-compact": "KM · Free — feeds the Compact",
  "free-islander-league": "KM · Free — feeds the Compact",
  "drifter-renegade-camps": "KM · Free — feeds the Compact",
  "concordance-of-natural-casters": "KM · Free Power",
  "liberation-of-the-gifted": "KM · Free — feeds the Concordance",
  "peninsula-expeditionary-army": "KM · feeds NDD (state organ)",
  "peninsula-coast-guard-authority": "KM · feeds NDD (state organ)",
  "abomination-containment-authority": "KM · feeds NDD (state organ)",
  "drone-surveillance-bureau": "KM · feeds NDD (state organ)",
  "wardens-monster-hunter-guild": "KM · feeds NDD (state organ)",
  "helix-arcanobiotics": "KM · feeds Aegis",
  "meridian-arcane-institute": "KM · feeds Aegis",
  "foundry-workers-union": "KM · feeds Aegis",
  "cybernetic-ascendancy": "KM · feeds Aegis",
  "iron-saints-pmc": "KM · feeds Tropic Pearl",
  "skybridge-transit-authority": "KM · feeds the Floating City",
  "bone-market-families": "KM · feeds the Ossuary Covenant",
  "stormglass-cartel": "KM · Institution (city-state)",
  "black-tithe-syndicate": "KM · feeds Stormglass (institution wing)",
  "church-of-the-first-gift": "KM · Institution · Faith (city-state)",
  "sanctuary-of-living-beasts": "KM · feeds the Church (institution wing)",
  "crimson-choir": "KM · Shadow Power · Faith",
  "the-ashen-court": "KM · Shadow Power",
  "the-riftbound-legion": "KM · feeds the Ashen Court (Shadow)",
  "the-pale-embassy": "KM · Shadow Power",
  "the-choir-below": "KM · Shadow Power",
  "the-old-hunger": "KM · Shadow Power",
};

const DESIGNED_SYSTEMS = ["kingdom-management", "outpost-and-city-management", "the-power-balance", "faction-membership"];

async function main() {
  const apply = process.argv.includes("--apply");
  const identity = await db.$queryRaw<Array<{ database: string }>>`SELECT current_database() AS database`;
  const actor = await db.user.findFirstOrThrow({ where: { role: "ADMIN", isActive: true }, orderBy: { id: "asc" }, select: { id: true } });
  const plan: string[] = [];
  const problems: string[] = [];

  const batch = new Set(FAITHS.map((f) => f.slug));
  const slugExists = async (slug: string) =>
    batch.has(slug) || Boolean(await db.storyEntry.findUnique({ where: { slug }, select: { id: true } }));
  for (const spec of [...FAITHS.map((f) => ({ slug: f.slug, body: f.body })), ...Object.entries(LAYERS).map(([slug, l]) => ({ slug, body: l.body }))]) {
    for (const match of spec.body.matchAll(/\[\[([a-z0-9-]+)\]\]/g)) {
      if (!(await slugExists(match[1]!))) problems.push(`${spec.slug}: dead link [[${match[1]}]]`);
    }
  }
  if (problems.length) {
    console.error(JSON.stringify({ database: identity[0]?.database, FAILED: problems }, null, 2));
    process.exitCode = 1;
    return;
  }

  // 2. Faith entries.
  for (const faith of FAITHS) {
    const meta = {
      category: "social", buildStatus: "designed", parent: faith.parent,
      unlockArc: null, unlockStage: "Design settled; mechanical realisation is future gameplay design",
      dependsOn: [], pillars: [], regionNotes: [], gameTag: null, openQuestions: [],
    };
    const parsed = systemMetaSchema.safeParse(meta);
    if (!parsed.success) throw new Error(`${faith.slug}: meta invalid — ${parsed.error.message}`);
    const current = await db.storyEntry.findUnique({ where: { slug: faith.slug } });
    if (!current) {
      plan.push(`create SYSTEM ${faith.slug}`);
      if (apply) {
        const created = await db.storyEntry.create({ data: {
          kind: "SYSTEM", slug: faith.slug, title: faith.title, summary: faith.summary,
          body: faith.body, meta: meta as Prisma.InputJsonValue, status: "CANON", createdByUserId: actor.id,
        } });
        await db.storyRevision.create({ data: {
          entityType: "ENTRY", entityId: created.id, action: "CREATED", actorUserId: actor.id,
          summary: `Kingdom integration: filed ${faith.title} on the faith lane`,
        } });
      }
    } else if (current.body !== faith.body) {
      if (current.body && !current.body.startsWith(faith.body.slice(0, 40))) { plan.push(`SKIP ${faith.slug} (edited by hand)`); }
      else {
        plan.push(`update ${faith.slug}`);
        if (apply) await db.storyEntry.update({ where: { id: current.id }, data: { body: faith.body, summary: faith.summary, meta: meta as Prisma.InputJsonValue, version: { increment: 1 }, updatedByUserId: actor.id } });
      }
    }
  }

  // 1. Appended layers, replace-from-own-marker.
  for (const [slug, layer] of Object.entries(LAYERS)) {
    const entry = await db.storyEntry.findUnique({ where: { slug }, select: { id: true, body: true, meta: true } });
    if (!entry) { plan.push(`MISSING ${slug}`); continue; }
    const body = entry.body ?? "";
    const at = body.indexOf(layer.marker);
    const preserved = at === -1 ? body : body.slice(0, at).trimEnd();
    const next = `${preserved}\n\n${layer.body}`;
    if (next !== body) {
      if (!next.startsWith(preserved)) throw new Error(`${slug}: append invariant violated`);
      plan.push(at === -1 ? `append design layer to ${slug}` : `refresh design layer on ${slug}`);
      if (apply) {
        const meta = entry.meta as Record<string, unknown>;
        const nextMeta = DESIGNED_SYSTEMS.includes(slug) ? { ...meta, buildStatus: "designed" } : meta;
        await db.storyEntry.update({ where: { id: entry.id }, data: {
          body: next, meta: nextMeta as Prisma.InputJsonValue, version: { increment: 1 }, updatedByUserId: actor.id,
        } });
        await db.storyRevision.create({ data: {
          entityType: "ENTRY", entityId: entry.id, action: "UPDATED", actorUserId: actor.id,
          summary: `Kingdom integration: appended the design layer (own marker; no prior words changed).`,
        } });
      }
    } else if (DESIGNED_SYSTEMS.includes(slug)) {
      const meta = entry.meta as Record<string, unknown>;
      if (meta.buildStatus !== "designed") {
        plan.push(`buildStatus -> designed on ${slug}`);
        if (apply) await db.storyEntry.update({ where: { id: entry.id }, data: { meta: { ...meta, buildStatus: "designed" } as Prisma.InputJsonValue, version: { increment: 1 }, updatedByUserId: actor.id } });
      }
    }
  }

  // 3. Faction backfill: faith key on every row; KM tier into gameTag when unset.
  const factions = await db.storyEntry.findMany({ where: { kind: "FACTION" }, select: { id: true, slug: true, meta: true } });
  for (const faction of factions) {
    const meta = (faction.meta ?? {}) as Record<string, unknown>;
    const assignedFaith = FACTION_FAITH[faction.slug] ?? null;
    const tier = KM_TIER[faction.slug] ?? null;
    const changes: string[] = [];
    const next: Record<string, unknown> = { ...meta };
    if (!("faith" in meta) || (assignedFaith && meta.faith !== assignedFaith)) {
      next.faith = assignedFaith ?? (meta.faith ?? null);
      if (assignedFaith) next.faith = assignedFaith;
      changes.push("faith");
    }
    if (tier && (meta.gameTag === null || meta.gameTag === undefined)) { next.gameTag = tier; changes.push("gameTag"); }
    else if (tier && meta.gameTag && meta.gameTag !== tier && typeof meta.gameTag === "string" && !meta.gameTag.startsWith("KM ·")) {
      plan.push(`SKIP gameTag on ${faction.slug} (hand-set: "${meta.gameTag}")`);
    } else if (tier && meta.gameTag !== tier && typeof meta.gameTag === "string" && meta.gameTag.startsWith("KM ·")) {
      next.gameTag = tier; changes.push("gameTag");
    }
    if (!changes.length) continue;
    plan.push(`faction ${faction.slug}: ${changes.join("+")}`);
    if (apply) await db.storyEntry.update({ where: { id: faction.id }, data: { meta: next as Prisma.InputJsonValue, version: { increment: 1 }, updatedByUserId: actor.id } });
  }

  console.log(JSON.stringify({ database: identity[0]?.database, mode: apply ? "APPLY" : "PREVIEW", plan: plan.length ? plan : ["nothing to do"] }, null, 2));
}

main().finally(() => db.$disconnect());
