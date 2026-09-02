import Link from "next/link";
import { getPrismaClient } from "@habitat/db/client";
import { FieldCard } from "@/components/field-card";
import { requireRole } from "@/lib/authorization";
import { codexArtSlot, findCodexArt } from "@/lib/codex-art";
import { courtDay, courtSeats, crownRanks, faithLaw, faiths, groundVerbs, kingdomLevel, kingdomLevels, machines, plotsLaw, provings, ranksLaw, realmPoints, realmTrees, realmTreesLaw, riverlandsPlots, sacredLaw, siegeLaw, standingLaws, succession, syndicate } from "@/lib/kingdom";
import { storyReadRole } from "@/lib/story-codex";
import "../play.css";
import "./kingdom.css";

export const metadata = { title: "Kingdom Management | Story Codex" };
export const dynamic = "force-dynamic";

/**
 * The Kingdom page: the crown read top to bottom the way a ruler climbs it.
 * The hall (hero), the Ranks of the Crown drawn as a stair with a proving
 * gate between each landing, the fifteen-level ledger of perks and caps,
 * the six court seats, the six realm trees with their perk nodes, then the
 * ground itself (verbs and plots), faith, the siege clock, the rhythm of
 * rule, the live territory board and the standing laws. Data:
 * `lib/kingdom.ts`. Art: private/codex-art/kingdom/<slug>.png, picked up on
 * reload. Nothing here writes to the database.
 */

const db = getPrismaClient();

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

const rankArtSlug = (rank: { numeral: string; title: string }) => `rank-${rank.numeral.toLowerCase()}-${rank.title.toLowerCase()}`;

function Art({ slug, className, glyph }: { slug: string; className: string; glyph: string }) {
  const url = findCodexArt("kingdom", slug);
  if (url) {
    // eslint-disable-next-line @next/next/no-img-element
    return <figure className={`${className} has-art`}><img alt="" src={url} /></figure>;
  }
  return (
    <figure className={className}>
      <span aria-hidden="true" className="km-glyph">{glyph}</span>
      <figcaption className="play-artslot">art slot — Sol · <code>{codexArtSlot("kingdom", slug)}</code></figcaption>
    </figure>
  );
}

export default async function KingdomPage() {
  await requireRole(storyReadRole);

  const factions = await db.storyEntry.findMany({ where: { kind: "FACTION" }, select: { slug: true, title: true, meta: true }, orderBy: { title: "asc" } });
  const regions = await db.storyEntry.findMany({ where: { kind: "REGION", status: "CANON" }, select: { slug: true, title: true, meta: true } });

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
        {list.map((place) => <li key={`${slug}-${place.slug}`}><Link className={`is-${place.kind}`} href={`/codex/bible/${place.slug}`}>{place.title}</Link></li>)}
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
                <header><Link href={`/codex/bible/${faction.slug}`}>{faction.title}</Link><i>{tierOf(meta.gameTag).label}</i></header>
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

  const provingAfter = new Map(provings.map((proving) => [proving.afterLevel, proving]));
  const nodeCount = realmTrees.reduce((sum, tree) => sum + tree.nodes.length, 0);

  return (
    <section className="page-shell codex-shell play-shell km-shell">
      {/* -------------------------------------------------------------- hero */}
      <header className="km-hero">
        <div className="km-hero-copy">
          <p className="eyebrow">Holding Ground</p>
          <h1>Kingdom Management</h1>
          <p>Bannerlord&apos;s lord on horseback, Crusader Kings&apos; map of powers, Civilization&apos;s growing settlements, on a live server that never pauses. You rule from inside your own eyes: <b>the map is a table in your hall</b>, your holdings run while you sleep, and <b>the Forge is the settlement</b>.</p>
          <ul className="km-hero-stats">
            <li><b>{crownRanks.length}</b><span>Ranks of the Crown</span></li>
            <li><b>{kingdomLevels.length}</b><span>Kingdom Levels</span></li>
            <li><b>{provings.length}</b><span>provings</span></li>
            <li><b>{realmTrees.length}</b><span>realm trees</span></li>
            <li><b>{nodeCount}</b><span>perk nodes</span></li>
            <li><b>{courtSeats.length}</b><span>court seats</span></li>
          </ul>
        </div>
        <Art className="km-hero-art" glyph="♛" slug="hero" />
      </header>

      <div className="play-gamer">
        <b>In gamer terms</b>
        <span>Late game. Your realm has a <b>Kingdom Level, 1 to 15</b>; every three levels is a <b>Rank</b> (Freeholder → Warden → Magistrate → Lord → Crown) and every rank-up is a <b>proving quest</b>, not an XP bar. Each level grants a perk and extends your caps; each level and proving gives <b>realm points</b> to spend on <b>six talent trees</b>. Get ground by <b>buying, seizing, earning or founding</b> it; pick a <b>faith</b> that pays and costs; fight sieges as <b>Forge clocks</b>; hold <b>Court Day</b> monthly; run it with friends as a <b>Syndicate</b>; and when you die for good, your heir holds it or it fractures.</span>
      </div>

      <div className="play-jump">
        <a href="#ranks">The Ranks</a><a href="#ledger">Level ledger</a><a href="#court">The court</a><a href="#trees">Realm trees</a><a href="#ground">Ground &amp; plots</a><a href="#faith">Faith</a><a href="#siege">Sieges</a><a href="#rhythm">Court Day</a><a href="#board">The world board</a><a href="#laws">Standing laws</a>
        <Link href="/codex/bible/kingdom-management">Kingdom Management (canon)</Link>
      </div>

      {/* ------------------------------------------------------------- ranks */}
      <section className="play-law km-ranks" id="ranks">
        <h2>The Ranks of the Crown: five ranks, fifteen levels</h2>
        <p className="play-lede">{ranksLaw}</p>
        <ol className="km-stair">
          {crownRanks.map((rank, index) => {
            const proving = provingAfter.get(rank.levels[1]);
            return [
              <li className={`km-rank is-rank-${rank.numeral.toLowerCase()}${index === crownRanks.length - 1 ? " is-crown" : ""}`} key={rank.title}>
                <Art className="km-rank-art" glyph={rank.numeral} slug={rankArtSlug(rank)} />
                <header>
                  <i>Rank {rank.numeral} · Levels {rank.levels[0]}–{rank.levels[1]}</i>
                  <b>{rank.title}</b>
                  <span>{rank.realm}</span>
                </header>
                <dl>
                  <dt>Holds</dt><dd>{rank.holds}</dd>
                  <dt>How</dt><dd className="is-muted">{rank.how}</dd>
                  <dt>Unlocks</dt><dd className="is-good">{rank.verbs.join(" · ")}</dd>
                  <dt>Court</dt><dd className="is-muted">{rank.seats}</dd>
                </dl>
              </li>,
              proving ? (
                <li className="km-gate" key={proving.name}>
                  <i>Ceiling · level {proving.afterLevel}</i>
                  <b>{proving.name}</b>
                  <span>{proving.from} → {proving.to}</span>
                </li>
              ) : null,
            ];
          })}
        </ol>
        <p className="km-foot"><b>The climb:</b> {kingdomLevel.curve} {kingdomLevel.ceilings} {kingdomLevel.firstCeiling} <b>Tall or wide:</b> {kingdomLevel.tallVsWide}</p>
      </section>

      {/* ------------------------------------------------------------ ledger */}
      <section className="play-law km-ledger-law" id="ledger">
        <h2>The ledger: what every level grants <span className="field-tag" title="Hand-set caps the balance sims have not measured yet">untested caps</span></h2>
        <p className="play-lede">XP comes from real work only: {kingdomLevel.xpFrom.join("; ")}. Every level grants a perk, extends the caps, and pays <b>{realmPoints.perLevel} realm point</b>; every proving pays <b>{realmPoints.perProving} more</b>.</p>
        <div className="km-ledger-scroll">
          <table className="km-ledger">
            <thead>
              <tr><th>Lv</th><th>Rank</th><th>Perk</th><th className="is-wide">Grants</th><th>Holdings</th><th>Muster</th><th>Seats</th><th>Vassals</th><th>Pts</th></tr>
            </thead>
            <tbody>
              {kingdomLevels.map((row) => {
                const proving = provingAfter.get(row.level);
                const rank = crownRanks.find((candidate) => candidate.numeral === row.rank)!;
                return [
                  <tr className={`is-rank-${row.rank.toLowerCase()}${proving ? " is-ceiling" : ""}${row.level === rank.levels[0] ? " is-first" : ""}`} key={row.level}>
                    <td className="km-lv">{row.level}</td>
                    <td className="km-rk"><i>{row.rank}</i>{row.level === rank.levels[0] ? <span>{rank.title}</span> : null}</td>
                    <td className="km-perk">{row.perk}</td>
                    <td className="km-grants">{row.grants}</td>
                    <td>{row.caps.holdings}</td>
                    <td>{row.caps.muster}</td>
                    <td>{row.caps.seats}</td>
                    <td>{row.caps.vassals}</td>
                    <td className="km-pts">+{realmPoints.perLevel}</td>
                  </tr>,
                  proving ? (
                    <tr className="km-proving" key={`proving-${row.level}`}>
                      <td colSpan={9}>
                        <i>Proving · {proving.from} → {proving.to}</i>
                        <b>{proving.name}</b>
                        <span>{proving.shape}</span>
                        <em>Teacher: {proving.teacher} · pays +{realmPoints.perProving} realm points</em>
                      </td>
                    </tr>
                  ) : null,
                ];
              })}
            </tbody>
          </table>
        </div>
        <p className="km-foot"><b>Caps:</b> {kingdomLevel.capsNote} <b>Teacher:</b> {kingdomLevel.teacher}</p>
      </section>

      {/* ------------------------------------------------------------- court */}
      <section className="play-law" id="court">
        <h2>The court: six seats, each with a tutor</h2>
        <p className="play-lede">A seat is real authority in its domain, and a Syndicate&apos;s members hold them. Every seat is taught by one stop on the Heartland investigation, the tour that is the management tutorial.</p>
        <div className="field-grid is-row">
          {courtSeats.map((seat, index) => (
            <FieldCard
              eyebrow={`Opens at ${seat.opens}`}
              fields={[
                { label: "Domain", value: seat.domain },
                { label: "Tutor", value: seat.tutor, tone: "muted" },
              ]}
              key={seat.name}
              name={seat.name}
              step={index + 1}
            />
          ))}
        </div>
      </section>

      {/* ------------------------------------------------------------- trees */}
      <section className="play-law km-trees-law" id="trees">
        <h2>The crown&apos;s six realm trees: {nodeCount} perk nodes</h2>
        <p className="play-lede">{realmTreesLaw}</p>
        <div className="km-budget">
          <span><b>{realmPoints.perLevel}</b> point a level</span>
          <span><b>{realmPoints.perProving}</b> a proving</span>
          <span><b>{realmPoints.total}</b> by the cap</span>
          <span className="is-offer"><b>{realmPoints.onOffer}</b> on offer</span>
          <span className="is-key"><i className="is-rank">Rank III</i> needs the rank · <i className="is-cap">capstone</i> Crown only</span>
        </div>
        <div className="km-trees">
          {realmTrees.map((tree) => (
            <article className={`km-tree is-${tree.slug}`} key={tree.slug}>
              <header>
                <Art className="km-sigil" glyph={tree.name.slice(0, 1)} slug={`tree-${tree.slug}`} />
                <div>
                  <b>{tree.name}</b>
                  <span>{tree.buys}</span>
                </div>
              </header>
              <ol className="km-nodes">
                {tree.nodes.map((node) => (
                  <li className={node.capstone ? "is-capstone" : undefined} key={node.id}>
                    <i className="km-cost" title={`${node.cost} realm ${node.cost === 1 ? "point" : "points"}`}>{node.cost}</i>
                    <div>
                      <b>{node.name}{node.capstone ? <em className="is-cap">capstone</em> : node.rank ? <em className="is-rank">Rank {node.rank}</em> : null}</b>
                      <span>{node.desc}</span>
                    </div>
                  </li>
                ))}
              </ol>
              <p>{tree.note}</p>
            </article>
          ))}
        </div>
      </section>

      {/* ------------------------------------------------------------ ground */}
      <section className="play-law" id="ground">
        <h2>Getting ground: four verbs, four prices</h2>
        <div className="field-grid">
          {groundVerbs.map((verb) => (
            <FieldCard
              fields={[
                { label: "Costs", value: verb.costs, tone: "bad" },
                { label: "Gets", value: verb.gets, tone: "good" },
                { label: "Notes", value: verb.notes, tone: "muted" },
              ]}
              key={verb.name}
              name={verb.name}
            />
          ))}
        </div>
        <p className="km-foot"><b>Seizing the sacred:</b> {sacredLaw}</p>
        <h3 className="km-sub">Plots: where you build your own buildings</h3>
        <p className="play-lede">{plotsLaw} <b>The Riverlands holds three: the Charters</b>, old land charters in courthouse escrow, released by campaign progress, each a different lesson. They are plots, not ranks.</p>
        <div className="field-grid is-wide">
          {riverlandsPlots.map((plot, index) => (
            <FieldCard
              eyebrow="Riverlands · courthouse escrow"
              fields={[
                { label: "Where", value: plot.where },
                { label: "What", value: plot.what, tone: "muted" },
                { label: "Teaches", value: plot.teaches, tone: "good" },
                { label: "Unlock", value: plot.unlock, tone: "bad" },
              ]}
              key={plot.slug}
              name={<Link href={`/codex/bible/${plot.slug}`}>{plot.name}</Link>}
              step={index + 1}
            />
          ))}
        </div>
        <p className="km-foot"><b>Other regions:</b> their plots are drawn where their writing is. A region with no plot is a region where you hold ground by seizing, earning or founding it, not by buying.</p>
      </section>

      {/* ------------------------------------------------------------- faith */}
      <section className="play-law" id="faith">
        <h2>Faith: every belief has a perk and a price</h2>
        <p className="play-lede">{faithLaw.read} <b>{faithLaw.conversion}</b> {faithLaw.reshaping}</p>
        <div className="field-grid is-wide">
          {faiths.map((faith) => (
            <FieldCard
              eyebrow={faith.secular ? "The secular crown" : "Faith"}
              fields={[
                { label: "Perk", value: faith.perk, tone: "good" },
                { label: "Price", value: faith.price, tone: "bad" },
                { label: "Morale", value: faith.morale, tone: "muted" },
              ]}
              key={faith.slug}
              name={<Link href={`/codex/bible/${faith.slug}`}>{faith.name}</Link>}
            />
          ))}
        </div>
      </section>

      {/* ------------------------------------------------------------- siege */}
      <section className="play-law" id="siege">
        <h2>Sieges: the Forge clock</h2>
        <p className="play-lede">{siegeLaw.clock} <b>{siegeLaw.intact}</b></p>
        <div className="field-grid is-wide">
          {siegeLaw.postures.map((posture) => (
            <FieldCard
              eyebrow="Attacker's posture"
              fields={[
                { label: "How", value: posture.how },
                { label: "Measured", value: posture.table, tone: "good" },
                { label: "Doctrine", value: posture.doctrine },
                { label: "Risk", value: posture.risk, tone: "bad" },
              ]}
              key={posture.name}
              name={posture.name}
            />
          ))}
          <FieldCard
            eyebrow="Defender's tip"
            fields={[{ label: "Law", value: siegeLaw.garrisonTip, tone: "bad" }]}
            name="A fortress of veterans"
          />
          <FieldCard
            eyebrow="The soulless garrison"
            fields={[
              { label: "Law", value: machines.law },
              { label: "Hybrid", value: machines.hybrid, tone: "good" },
              { label: "Insurance", value: machines.insurance, tone: "muted" },
              { label: "Pure", value: machines.pure, tone: "bad" },
              { label: "Vanity", value: machines.vanity, tone: "muted" },
            ]}
            name={<Link href="/codex/bible/machines">Machines on the wall</Link>}
          />
        </div>
      </section>

      {/* ------------------------------------------------------------ rhythm */}
      <section className="play-law" id="rhythm">
        <h2>The rhythm of rule: Court Day, the Syndicate, the Mourning</h2>
        <p className="play-lede">{courtDay.when} Four ways to handle it, priced by the campaign over fourteen months of rule. The docket grows with the rank: a letter on the kitchen table at level 1, a hall from level 7.</p>
        <div className="field-grid is-row">
          {courtDay.options.map((option, index) => (
            <FieldCard
              accent={index === 0}
              fields={[
                { label: "What", value: option.what },
                { label: "Worth", value: option.value, tone: index === courtDay.options.length - 1 ? "bad" : "good" },
                { label: "Notes", value: option.note, tone: "muted" },
              ]}
              key={option.name}
              name={option.name}
              price={index === courtDay.options.length - 1}
              step={index + 1}
            />
          ))}
        </div>
        <div className="field-grid" style={{ marginTop: 10 }}>
          <FieldCard eyebrow="The multiplayer crown" fields={[{ label: "Leader", value: syndicate.leader }, { label: "Members", value: syndicate.members }, { label: "Shared", value: syndicate.shared, tone: "good" }, { label: "Servers", value: syndicate.servers, tone: "muted" }]} name="The Syndicate" />
          <FieldCard eyebrow="Succession" fields={[{ label: "Trigger", value: succession.trigger, tone: "bad" }, { label: "Heir", value: succession.heir }, { label: "After", value: succession.after, tone: "muted" }, { label: "Law", value: succession.law }]} name="The Mourning" />
        </div>
      </section>

      {/* ------------------------------------------------------------- board */}
      <section className="km-board" id="board">
        <h2>The world game: who holds what, right now</h2>
        <p>Live from the codex&apos;s own region sheets. Every Great Power starts a world at the <b>same total points</b>; shapes differ, totals don&apos;t, and everything after the first day is play. Story-critical ground never flips until its arc resolves. Your crown joins this board when the world recognises it.</p>
        {tier("great", "The Great Powers: racing for dominance", "Five banners, five axis identities, one scoreboard. Their wings feed their totals.")}
        {tier("free", "The Free Powers: their land, their law", "Scored but not racing. Power without ambition, and the whole bloc answers an attack on any of it.")}
        {tier("institution", "The Institutions: the world's city-states", "Independent seats the powers court and buy influence from. They endure the early game and become prizes in the late one.")}
        {tier("shadow", "The Shadow Powers: a different game", "Never scored. The board measures the war it can see.")}
      </section>

      {/* -------------------------------------------------------------- laws */}
      <section className="play-law" id="laws">
        <h2>Standing laws</h2>
        <ul className="km-laws">{standingLaws.map((law) => <li key={law}>{law}</li>)}</ul>
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
