import Link from "next/link";
import { getPrismaClient } from "@habitat/db/client";
import { requireRole } from "@/lib/authorization";
import { storyReadRole } from "@/lib/story-codex";
import "./kingdom.css";

export const metadata = { title: "Kingdom Management | Story Codex" };
export const dynamic = "force-dynamic";

/**
 * The Kingdom page: the whole Holding Ground design in one gamer-readable
 * surface — what you get, and for what — plus the live territory board read
 * straight from the region sheets' control rows. Design source: the approved
 * spec plus the design layers on kingdom-management and its siblings; nothing
 * here writes to the database.
 */

const db = getPrismaClient();

const RUNGS = [
  { name: "Homestead", holds: "A parcel and a roof", verbs: "Build · farm · fence · hire hands", from: "Buy a charter parcel" },
  { name: "Outpost", holds: "A fortified point with a job", verbs: "Garrison · patrols · supply · signals", from: "Hold a road or crossing" },
  { name: "Town", holds: "A population that isn't yours", verbs: "Districts · trades · law · admission", from: "Grow, or take one" },
  { name: "City", holds: "Districts, wharves, politics", verbs: "Projects · armies · factions in your walls", from: "The big leagues" },
  { name: "Kingdom", holds: "Holdings + vassals", verbs: "Doctrine · diplomacy · war · succession", from: "The endgame of holding ground" },
];

const VERBS = [
  { name: "Buy", cost: "Coin, and patience", gets: "Escrowed charter parcels, region by region — rare, because the world is owned." },
  { name: "Seize", cost: "Blood, supply, and consequences", gets: "Any unshielded holding. Inside a faction the leader decides who KEEPS what you took." },
  { name: "Earn", cost: "Service and obligation", gets: "A granted fief — from your faction, a ruler, or the Heartland courthouse." },
  { name: "Found", cost: "Everything, slowly", gets: "Ground that is yours alone. Nobody holds paper over you; nobody owes you help either." },
];

const TREES = [
  { name: "Might", buys: "Levies, garrisons, sieges" },
  { name: "Coffers", buys: "Tariffs, routes, markets" },
  { name: "Works", buys: "Machinery, infrastructure, bought additions" },
  { name: "Arcana", buys: "Forge efficiency, reserves, licensed casting" },
  { name: "Roots", buys: "People, land, food, loyalty" },
  { name: "Faith", buys: "Adoption, spread, tolerance — belief as a build" },
];

const FAITHS = [
  { slug: "the-first-gift", name: "The First Gift", perk: "The given magic thrives: gifted casters, creature pacts, the beast trade, Sanctuary aid.", price: "Your own law restricts the harvest — Essence costs climb; the extraction powers treat you as an obstacle." },
  { slug: "the-ossuary-rites", name: "The Ossuary Rites", perk: "The dead work: lawful necromantic labor and garrison; funerals feed the realm.", price: "The living hesitate — growth and immigration suffer; the First Gift's faithful call your workforce blasphemy." },
  { slug: "the-forgefaith", name: "The Forgefaith", perk: "Reclamation as devotion: cheaper reclamations, faster binding, glad congregations.", price: "Dependence — a holding without a Forge bleeds morale, and losing a Core is a military AND spiritual disaster." },
  { slug: "the-old-roads", name: "The Old Roads", perk: "The customs hold: truce grounds, safe crossings, hospitality bless everything you move.", price: "The customs bind YOU — honor every truce and guest-right, even for enemies, or the crossroads remember." },
  { slug: "the-crimson-communion", name: "The Crimson Communion", perk: "Blood pays now: immediate, potent war and ritual power on Choir credit.", price: "The debt compounds; every decent power suppresses you; the Choir ALWAYS collects." },
  { slug: "the-faith-lane", name: "Secular", perk: "No faith's price binds you; no customs constrain your wars; doctrine entirely yours.", price: "Faith-heavy populations are harder to please — morale bleeds in proportion to their devotion." },
];

type TierKey = "great" | "free" | "institution" | "shadow" | "wing";

function tierOf(gameTag: unknown): { key: TierKey; label: string } {
  const tag = typeof gameTag === "string" ? gameTag : "";
  if (tag.includes("Great Power")) return { key: "great", label: tag.replace("KM · ", "") };
  if (tag.includes("Institution")) return { key: "institution", label: tag.replace("KM · ", "") };
  if (tag.includes("Shadow")) return { key: "shadow", label: tag.replace("KM · ", "") };
  if (tag.includes("Free")) return { key: "free", label: tag.replace("KM · ", "") };
  if (tag.startsWith("KM · feeds")) return { key: "wing", label: tag.replace("KM · ", "") };
  return { key: "wing", label: "unfiled" };
}

const holdKindLabel: Record<string, string> = { holds: "holds", contests: "contests", influences: "influences" };

export default async function KingdomPage() {
  await requireRole(storyReadRole);

  const factions = await db.storyEntry.findMany({
    where: { kind: "FACTION" },
    select: { slug: true, title: true, meta: true },
    orderBy: { title: "asc" },
  });
  const regions = await db.storyEntry.findMany({
    where: { kind: "REGION", status: "CANON" },
    select: { slug: true, title: true, meta: true },
  });

  // The territory board: every control row on every region sheet, grouped by
  // the faction that holds, contests, or influences the place.
  const holdings = new Map<string, Array<{ slug: string; title: string; kind: string }>>();
  for (const region of regions) {
    const control = ((region.meta as Record<string, unknown>)?.control ?? []) as Array<{ faction: string; kind: string | null }>;
    for (const row of control) {
      const list = holdings.get(row.faction) ?? [];
      list.push({ slug: region.slug, title: region.title, kind: row.kind ?? "influences" });
      holdings.set(row.faction, list);
    }
  }

  const byTier = new Map<TierKey, typeof factions>([["great", []], ["free", []], ["institution", []], ["shadow", []], ["wing", []]]);
  const childrenOf = new Map<string, string[]>();
  for (const faction of factions) {
    const meta = faction.meta as Record<string, unknown>;
    byTier.get(tierOf(meta.gameTag).key)!.push(faction);
    const parent = typeof meta.parent === "string" ? meta.parent : null;
    if (parent) childrenOf.set(parent, [...(childrenOf.get(parent) ?? []), faction.title]);
  }

  const holdingChips = (slug: string) => {
    const list = (holdings.get(slug) ?? []).sort((a, b) => (a.kind === b.kind ? a.title.localeCompare(b.title) : a.kind === "holds" ? -1 : b.kind === "holds" ? 1 : a.kind === "contests" ? -1 : 1));
    if (!list.length) return <p className="km-none">No ground on the written map yet — the unwritten regions are where this power lives.</p>;
    return (
      <ul className="km-chips">
        {list.map((place) => (
          <li key={`${slug}-${place.slug}`}>
            <Link className={`km-chip km-${place.kind}`} href={`/codex/bible/${place.slug}`}>
              <span className="km-chip-kind">{holdKindLabel[place.kind] ?? place.kind}</span> {place.title}
            </Link>
          </li>
        ))}
      </ul>
    );
  };

  const tierBlock = (key: TierKey, heading: string, note: string) => {
    const rows = byTier.get(key)!;
    if (!rows.length) return null;
    return (
      <section className="km-tier">
        <h3>{heading}</h3>
        <p className="km-tier-note">{note}</p>
        <div className="km-power-grid">
          {rows.map((faction) => {
            const meta = faction.meta as Record<string, unknown>;
            const tier = tierOf(meta.gameTag);
            const wings = childrenOf.get(faction.slug) ?? [];
            const faith = typeof meta.faith === "string" ? meta.faith : null;
            return (
              <article className={`km-power km-power-${key}`} key={faction.slug}>
                <header>
                  <Link href={`/codex/bible/${faction.slug}`}>{faction.title}</Link>
                  <span className="km-tier-badge">{tier.label}</span>
                </header>
                {wings.length ? <p className="km-wings"><strong>Wings feeding this banner:</strong> {wings.join(" · ")}</p> : null}
                {faith ? <p className="km-faith-line"><strong>Faith:</strong> <Link href={`/codex/bible/${faith}`}>{faith.replace(/^the-/, "").replaceAll("-", " ")}</Link></p> : null}
                {holdingChips(faction.slug)}
              </article>
            );
          })}
        </div>
      </section>
    );
  };

  return (
    <section className="page-shell codex-shell km-shell">
      <header className="km-hero">
        <p className="eyebrow">Holding Ground</p>
        <h1>Kingdom Management</h1>
        <p className="km-lede">
          Bannerlord&apos;s lord-on-horseback, Crusader Kings&apos; map of powers, Civilization&apos;s growing settlements —
          on a live server that never pauses. You rule from inside your own eyes: the map is a table in your hall,
          your holdings run while you sleep, and <strong>the Forge is the settlement</strong>.
        </p>
        <ul className="km-quickstart">
          <li><strong>Start small:</strong> buy a parcel, drain it, build on it. That&apos;s rung one of five.</li>
          <li><strong>Grow by doing:</strong> your kingdom levels on real work, and the level extends every cap.</li>
          <li><strong>Every choice prices itself:</strong> faiths, walls, and wars all show you the bill up front.</li>
          <li><strong>The world fights back:</strong> five Great Powers race for dominance from an equal start — and your crown can earn a seat at that table.</li>
        </ul>
      </header>

      <section className="km-section">
        <h2>The Ladder — five rungs, each adds verbs</h2>
        <div className="km-rungs">
          {RUNGS.map((rung, index) => (
            <article className="km-rung" key={rung.name}>
              <span className="km-rung-number">{index + 1}</span>
              <h3>{rung.name}</h3>
              <p className="km-holds">{rung.holds}</p>
              <p className="km-verbs">{rung.verbs}</p>
              <p className="km-from">{rung.from}</p>
            </article>
          ))}
        </div>
        <p className="km-note">The Riverlands&apos; Three Charters teach rungs one through three; the top rungs are seized, granted, or founded — rarely built from mud.</p>
      </section>

      <section className="km-section">
        <h2>Getting ground — four verbs, four prices</h2>
        <div className="km-verbs-grid">
          {VERBS.map((verb) => (
            <article className="km-verb" key={verb.name}>
              <h3>{verb.name}</h3>
              <p className="km-price-line">Costs: {verb.cost}</p>
              <p>{verb.gets}</p>
            </article>
          ))}
        </div>
        <p className="km-note"><strong>Seizing the sacred:</strong> nothing is unseizable, nothing is cheap, and some things are unkeepable — a seized sacred site never becomes a normal holding; it generates grievance until you return it, gift it, or win its people.</p>
      </section>

      <section className="km-section">
        <h2>Your Kingdom Level — do more, grow more, reach further</h2>
        <div className="km-cols">
          <article>
            <h3>XP comes from real work only</h3>
            <ul>
              <li>Holdings prospering, day by day</li>
              <li>Projects finished · wars won · sieges stood</li>
              <li>Treaties signed · trade moved · Court Days handled</li>
            </ul>
          </article>
          <article>
            <h3>The level extends every cap</h3>
            <ul>
              <li>How many holdings you can hold</li>
              <li>How big your armies muster</li>
              <li>Officer seats · vassal slots · project tiers</li>
            </ul>
          </article>
          <article>
            <h3>Ceilings — the crown&apos;s provings</h3>
            <ul>
              <li>The curve is steep: each level costs more than half again the last</li>
              <li>Every third level is a ceiling <strong>only a quest breaks</strong></li>
              <li>The ceiling teacher for rulers: the Crown Without a Name</li>
            </ul>
          </article>
        </div>
      </section>

      <section className="km-section">
        <h2>The crown&apos;s six talent trees</h2>
        <p className="km-note">Rule your own kingdom and every level grants realm points to spec it your way. Join a faction instead, and you live under <em>their</em> doctrine — their spec, your problem.</p>
        <div className="km-trees">
          {TREES.map((tree) => (
            <article className="km-tree" key={tree.name}>
              <h3>{tree.name}</h3>
              <p>{tree.buys}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="km-section">
        <h2>Faith — every belief has a perk and a price</h2>
        <div className="km-faiths">
          {FAITHS.map((faith) => (
            <article className="km-faith" key={faith.slug}>
              <h3><Link href={`/codex/bible/${faith.slug}`}>{faith.name}</Link></h3>
              <p className="km-perk">✓ {faith.perk}</p>
              <p className="km-cost">✗ {faith.price}</p>
            </article>
          ))}
        </div>
        <p className="km-note">Faith is READ: the rites you keep and the faith your realm adopts move prices, access, and quests everywhere. Populations can be reshaped over time — policy, patronage, suppression, generations — at cost, and noticed.</p>
      </section>

      <section className="km-section">
        <h2>The World Game — who holds what, right now</h2>
        <p className="km-note">
          Live from the codex&apos;s own region sheets. Every Great Power starts a world at the <strong>same total points</strong> —
          shapes differ, totals don&apos;t — and everything after the first day is play. Story-critical ground never flips until its
          arc resolves; your crown joins this board when the world recognizes it.
        </p>
        {tierBlock("great", "The Great Powers — racing for dominance", "Five banners, five axis identities, one scoreboard. Their wings feed their totals.")}
        {tierBlock("free", "The Free Powers — their land, their law", "Scored but not racing. Power without ambition — and the whole bloc answers an attack on any of it.")}
        {tierBlock("institution", "The Institutions — the world's city-states", "Independent seats the powers court and buy influence from. Conquerable — but they serve whatever is in their best interest at the time, and late-game wars swallow seats too.")}
        {tierBlock("shadow", "The Shadow Powers — a different game", "Never scored. The board measures the war it can see.")}
      </section>

      <section className="km-section">
        <h2>The rhythm of rule</h2>
        <div className="km-cols">
          <article>
            <h3>Court Day — the first of every month</h3>
            <p>The court convenes with a real docket: petitions, windfalls, disasters, absurdities. Attend and rule; skip and doctrine auto-decides; be away and a governor rules in your name — the Court Record waits for your return. A present ruler clears roughly double what auto-doctrine does. A poor governor does worse than no governor at all.</p>
          </article>
          <article>
            <h3>The Syndicate — the multiplayer crown</h3>
            <p>The leader decides; members hold the officer seats with real authority in their domains. The realm&apos;s level, ceilings, and trees are everyone&apos;s work — and servers can carry several Syndicates vying with each other and the NPC powers alike.</p>
          </article>
          <article>
            <h3>The Mourning — succession</h3>
            <p>A ruler&apos;s true death starts a live succession crisis: your named heir holds the realm or it fractures, decided by what you actually built. What survives persists as an NPC power the next run meets. The realm remembers you; it does not belong to you.</p>
          </article>
        </div>
      </section>

      <section className="km-section">
        <h2>The soulless garrison</h2>
        <p>
          Machines defend too — and their economics mirror the living wall&apos;s. A living garrison costs nothing until it dies,
          then gulps the Forge reserve at reclamation prices. A machine (<Link href="/codex/bible/machines">the Machines shelf</Link>)
          has no soul: <strong>destroyed is destroyed</strong>, replaced with coin and materials — and it sips Essence daily just to run.
          Hybrid walls hold a day or two less than pure living ones and end the siege with the Forge still breathing.
          A pure-machine wall gives a besieger no clock to wait out at all: storming is the only road in.
        </p>
      </section>

      <footer className="km-footer">
        <p>
          The full law lives in the codex: <Link href="/codex/bible/kingdom-management">Kingdom Management</Link> ·{" "}
          <Link href="/codex/bible/outpost-and-city-management">Outpost &amp; City Management</Link> ·{" "}
          <Link href="/codex/bible/the-power-balance">The Power Balance</Link> ·{" "}
          <Link href="/codex/bible/faction-membership">Faction Membership</Link> ·{" "}
          <Link href="/codex/bible/the-faith-lane">The Faith Lane</Link> ·{" "}
          <Link href="/codex/bible/battle-management">Battle Management</Link>
        </p>
      </footer>
    </section>
  );
}
