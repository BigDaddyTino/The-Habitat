import Link from "next/link";
import { getPrismaClient } from "@habitat/db/client";
import { requireRole } from "@/lib/authorization";
import { storyReadRole } from "@/lib/story-codex";
import "./kingdom.css";

export const metadata = { title: "Kingdom Management | Story Codex" };
export const dynamic = "force-dynamic";

/**
 * The Kingdom page: the whole Holding Ground design on one surface — what you
 * get, and for what — plus the live territory board read from the region
 * sheets' control rows. Same grammar as the Trades page: square panels, mono
 * labels, the ladder as a track. Nothing here writes to the database.
 */

const db = getPrismaClient();

const RUNGS = [
  { name: "Homestead", holds: "A parcel and a roof", from: "buy a charter parcel" },
  { name: "Outpost", holds: "A fortified point with a job", from: "hold a road or crossing" },
  { name: "Town", holds: "A population that isn't yours", from: "grow, or take one" },
  { name: "City", holds: "Districts, wharves, politics", from: "the big leagues" },
  { name: "Kingdom", holds: "Holdings and vassals", from: "the endgame of holding ground" },
];

const VERBS = [
  { name: "Buy", cost: "coin, and patience", gets: "Escrowed charter parcels, region by region. Rare, because the world is owned." },
  { name: "Seize", cost: "blood, supply, consequences", gets: "Any unshielded holding. Inside a faction the leader decides who keeps what you took." },
  { name: "Earn", cost: "service and obligation", gets: "A granted fief from your faction, a ruler, or the Heartland courthouse." },
  { name: "Found", cost: "everything, slowly", gets: "Ground that is yours alone. Nobody holds paper over you; nobody owes you help." },
];

const TREES = [
  { name: "Might", buys: "Levies, garrisons, sieges" },
  { name: "Coffers", buys: "Tariffs, routes, markets" },
  { name: "Works", buys: "Machinery, infrastructure, bought additions" },
  { name: "Arcana", buys: "Forge efficiency, reserves, licensed casting" },
  { name: "Roots", buys: "People, land, food, loyalty" },
  { name: "Faith", buys: "Adoption, spread, tolerance; belief as a build" },
];

const FAITHS = [
  { slug: "the-first-gift", name: "The First Gift", perk: "The given magic thrives: gifted casters, creature pacts, the beast trade, Sanctuary aid.", price: "Your own law restricts the harvest. Essence costs climb; the extraction powers treat you as an obstacle." },
  { slug: "the-ossuary-rites", name: "The Ossuary Rites", perk: "The dead work: lawful necromantic labor and garrison; funerals feed the realm.", price: "The living hesitate. Growth and immigration suffer; the First Gift's faithful call your workforce blasphemy." },
  { slug: "the-forgefaith", name: "The Forgefaith", perk: "Reclamation as devotion: cheaper reclamations, faster binding, glad congregations.", price: "Dependence. A holding without a Forge bleeds morale, and losing a Core is a military and spiritual disaster." },
  { slug: "the-old-roads", name: "The Old Roads", perk: "The customs hold: truce grounds, safe crossings, hospitality bless everything you move.", price: "The customs bind you. Honor every truce and guest-right, even for enemies, or the crossroads remember." },
  { slug: "the-crimson-communion", name: "The Crimson Communion", perk: "Blood pays now: immediate, potent war and ritual power on Choir credit.", price: "The debt compounds; every decent power suppresses you; the Choir always collects." },
  { slug: "the-faith-lane", name: "Secular", perk: "No faith's price binds you; no customs constrain your wars; doctrine entirely yours.", price: "Faith-heavy populations are harder to please. Morale bleeds in proportion to their devotion." },
];

type TierKey = "great" | "free" | "institution" | "shadow" | "wing";

function tierOf(gameTag: unknown): { key: TierKey; label: string } {
  const tag = typeof gameTag === "string" ? gameTag : "";
  const label = tag.replace(/^KM · /, "");
  if (tag.includes("Great Power")) return { key: "great", label };
  if (tag.includes("Institution")) return { key: "institution", label };
  if (tag.includes("Shadow")) return { key: "shadow", label };
  if (tag.includes("Free")) return { key: "free", label };
  if (tag.startsWith("KM · feeds")) return { key: "wing", label };
  return { key: "wing", label: "unfiled" };
}

const holdOrder: Record<string, number> = { holds: 0, contests: 1, influences: 2 };

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

  const chips = (slug: string) => {
    const list = (holdings.get(slug) ?? []).sort((a, b) => (holdOrder[a.kind] ?? 3) - (holdOrder[b.kind] ?? 3) || a.title.localeCompare(b.title));
    if (!list.length) return <p className="is-empty">No ground on the written map yet; the unwritten regions are where this power lives.</p>;
    return (
      <ul className="km-chips">
        {list.map((place) => (
          <li key={`${slug}-${place.slug}`}><Link className={`is-${place.kind}`} href={`/codex/bible/${place.slug}`}>{place.title}</Link></li>
        ))}
      </ul>
    );
  };

  const tier = (key: TierKey, heading: string, note: string) => {
    const rows = byTier.get(key)!;
    if (!rows.length) return null;
    return (
      <section className={`km-tier is-${key}`}>
        <h3>{heading}</h3>
        <p>{note}</p>
        <div className="km-powers">
          {rows.map((faction) => {
            const meta = faction.meta as Record<string, unknown>;
            const wings = childrenOf.get(faction.slug) ?? [];
            const faith = typeof meta.faith === "string" ? meta.faith : null;
            return (
              <article className={`km-power is-${key}`} key={faction.slug}>
                <header>
                  <Link href={`/codex/bible/${faction.slug}`}>{faction.title}</Link>
                  <i>{tierOf(meta.gameTag).label}</i>
                </header>
                {wings.length ? <p><b>Wings:</b> {wings.join(" · ")}</p> : null}
                {faith ? <p><b>Faith:</b> <Link href={`/codex/bible/${faith}`}>{faith.replace(/^the-/, "").replaceAll("-", " ")}</Link></p> : null}
                {chips(faction.slug)}
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
        <p>
          Bannerlord&apos;s lord-on-horseback, Crusader Kings&apos; map of powers, Civilization&apos;s growing settlements,
          on a live server that never pauses. You rule from inside your own eyes: the map is a table in your hall,
          your holdings run while you sleep, and <b>the Forge is the settlement</b>.
        </p>
      </header>

      <section className="km-law">
        <h2>How holding ground works</h2>
        <div className="km-quick">
          <div><b>Start small</b><span>Buy a parcel, drain it, build on it. That is rung one of five.</span></div>
          <div><b>Grow by doing</b><span>Your kingdom levels on real work, and the level extends every cap.</span></div>
          <div><b>Every choice prices itself</b><span>Faiths, walls, and wars all show you the bill up front.</span></div>
          <div><b>The world fights back</b><span>Five Great Powers race from an equal start, and your crown can earn a seat at that table.</span></div>
        </div>
      </section>

      <section className="km-law">
        <h2>The Ladder: five rungs, each adds verbs</h2>
        <p className="km-lede">None retires the ones below. The Riverlands&apos; Three Charters teach rungs one through three; the top rungs are seized, granted, or founded, rarely built from mud.</p>
        <div className="km-track">
          {RUNGS.map((rung, index) => (
            <div key={rung.name} style={{ display: "contents" }}>
              {index > 0 ? <div className="km-gate" aria-hidden="true">›</div> : null}
              <div className={`km-rung${index === RUNGS.length - 1 ? " is-crown" : ""}`}>
                <i>{index + 1}</i>
                <b>{rung.name}</b>
                <span>{rung.holds}</span>
                <em>{rung.from}</em>
              </div>
            </div>
          ))}
        </div>
        <p className="km-foot"><b>Verbs by rung:</b> build, farm, fence → garrison, patrol, supply → districts, trades, law, admission → projects, armies, factions in your walls → doctrine, diplomacy, war, succession.</p>
      </section>

      <section className="km-law">
        <h2>Getting ground: four verbs, four prices</h2>
        <div className="km-tiles">
          {VERBS.map((verb) => (
            <div className="km-tile is-price" key={verb.name}>
              <b>{verb.name}</b>
              <i>costs {verb.cost}</i>
              <span>{verb.gets}</span>
            </div>
          ))}
        </div>
        <p className="km-foot" style={{ marginTop: 12 }}><b>Seizing the sacred:</b> nothing is unseizable, nothing is cheap, and some things are unkeepable. A seized sacred site never becomes a normal holding; it generates grievance until you return it, gift it, or win its people.</p>
      </section>

      <section className="km-law">
        <h2>Your Kingdom Level: do more, grow more, reach further</h2>
        <div className="km-cols">
          <div className="km-col">
            <h3>XP comes from real work only</h3>
            <ul>
              <li>Holdings prospering, day by day</li>
              <li>Projects finished · wars won · sieges stood</li>
              <li>Treaties signed · trade moved · Court Days handled</li>
            </ul>
          </div>
          <div className="km-col">
            <h3>The level extends every cap</h3>
            <ul>
              <li>How many holdings you can hold</li>
              <li>How big your armies muster</li>
              <li>Officer seats · vassal slots · project tiers</li>
            </ul>
          </div>
          <div className="km-col">
            <h3>Ceilings: the crown&apos;s provings</h3>
            <ul>
              <li>Each level costs more than half again the last</li>
              <li>Every third level is a ceiling <b>only a quest breaks</b></li>
              <li>The rulers&apos; ceiling teacher: the Crown Without a Name</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="km-law">
        <h2>The crown&apos;s six talent trees</h2>
        <p className="km-lede">Rule your own kingdom and every level grants realm points to spec it your way. Join a faction instead and you live under <b>their</b> doctrine: their spec, your problem.</p>
        <div className="km-tiles">
          {TREES.map((tree) => (
            <div className="km-tile" key={tree.name}>
              <b>{tree.name}</b>
              <i>realm tree</i>
              <span>{tree.buys}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="km-law">
        <h2>Faith: every belief has a perk and a price</h2>
        <p className="km-lede">Faith is <b>read</b>: the rites you keep and the faith your realm adopts move prices, access, and quests everywhere. Populations can be reshaped over time, at cost, and noticed.</p>
        <div className="km-faiths">
          {FAITHS.map((faith) => (
            <article className="km-faith" key={faith.slug}>
              <h3><Link href={`/codex/bible/${faith.slug}`}>{faith.name}</Link></h3>
              <p className="is-perk"><b>Perk</b>{faith.perk}</p>
              <p className="is-price"><b>Price</b>{faith.price}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="km-board">
        <h2>The World Game: who holds what, right now</h2>
        <p>
          Live from the codex&apos;s own region sheets. Every Great Power starts a world at the <b>same total points</b>;
          shapes differ, totals don&apos;t, and everything after the first day is play. Story-critical ground never flips until its
          arc resolves. Your crown joins this board when the world recognizes it.
        </p>
        {tier("great", "The Great Powers: racing for dominance", "Five banners, five axis identities, one scoreboard. Their wings feed their totals.")}
        {tier("free", "The Free Powers: their land, their law", "Scored but not racing. Power without ambition, and the whole bloc answers an attack on any of it.")}
        {tier("institution", "The Institutions: the world's city-states", "Independent seats the powers court and buy influence from. Conquerable, but they serve whatever is in their best interest at the time, and late-game wars swallow seats too.")}
        {tier("shadow", "The Shadow Powers: a different game", "Never scored. The board measures the war it can see.")}
      </section>

      <section className="km-law">
        <h2>The rhythm of rule</h2>
        <div className="km-rhythm">
          <div className="km-col">
            <h3>Court Day: the first of every month</h3>
            <p>The court convenes with a real docket: petitions, windfalls, disasters, absurdities. Attend and rule; skip and doctrine auto-decides; be away and a governor rules in your name, with the Court Record waiting for your return. <b>A present ruler clears roughly double what auto-doctrine does. A poor governor does worse than no governor at all.</b></p>
          </div>
          <div className="km-col">
            <h3>The Syndicate: the multiplayer crown</h3>
            <p>The leader decides; members hold the officer seats with real authority in their domains. The realm&apos;s level, ceilings, and trees are everyone&apos;s work, and servers can carry several Syndicates vying with each other and the NPC powers alike.</p>
          </div>
          <div className="km-col">
            <h3>The Mourning: succession</h3>
            <p>A ruler&apos;s true death starts a live succession crisis. Your named heir holds the realm or it fractures, decided by what you actually built. What survives persists as an NPC power the next run meets. <b>The realm remembers you; it does not belong to you.</b></p>
          </div>
        </div>
      </section>

      <section className="km-law">
        <h2>The soulless garrison</h2>
        <p className="km-machines">
          Machines defend too, and their economics mirror the living wall&apos;s. A living garrison costs nothing until it dies,
          then gulps the Forge reserve at reclamation prices. A machine (<Link href="/codex/bible/machines">the Machines shelf</Link>)
          has no soul: <b>destroyed is destroyed</b>, replaced with coin and materials, and it sips Essence daily just to run.
          Hybrid walls hold a day or two less than pure living ones and end the siege with the Forge still breathing.
          A pure-machine wall gives a besieger no clock to wait out at all: storming is the only road in.
        </p>
      </section>

      <p className="km-foot">
        The full law lives in the codex: <Link href="/codex/bible/kingdom-management">Kingdom Management</Link> ·{" "}
        <Link href="/codex/bible/outpost-and-city-management">Outpost &amp; City Management</Link> ·{" "}
        <Link href="/codex/bible/the-power-balance">The Power Balance</Link> ·{" "}
        <Link href="/codex/bible/faction-membership">Faction Membership</Link> ·{" "}
        <Link href="/codex/bible/the-faith-lane">The Faith Lane</Link> ·{" "}
        <Link href="/codex/bible/battle-management">Battle Management</Link>
      </p>
    </section>
  );
}
