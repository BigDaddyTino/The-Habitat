import Link from "next/link";
import { getPrismaClient } from "@habitat/db/client";
import { FieldCard } from "@/components/field-card";
import { requireRole } from "@/lib/authorization";
import { courtDay, faithLaw, faiths, groundVerbs, holdingRungs, kingdomLevel, machines, plotsLaw, realmTrees, realmTreesLaw, riverlandsPlots, sacredLaw, siegeLaw, standingLaws, succession, syndicate } from "@/lib/kingdom";
import { storyReadRole } from "@/lib/story-codex";
import "../play.css";
import "./kingdom.css";

export const metadata = { title: "Kingdom Management | Story Codex" };
export const dynamic = "force-dynamic";

/**
 * The Kingdom page, laid out the way the Character page is: what holding
 * ground is in one line, then every rung, verb, tree, faith, siege posture
 * and Court Day option as a labeled card with the balance campaign's
 * numbers on it, and the live territory board read from the region sheets'
 * control rows. Data: `lib/kingdom.ts`. Nothing here writes to the database.
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

  return (
    <section className="page-shell codex-shell play-shell km-shell">
      <header className="play-hero">
        <p className="eyebrow">Holding Ground</p>
        <h1>Kingdom Management</h1>
        <p>Bannerlord&apos;s lord on horseback, Crusader Kings&apos; map of powers, Civilization&apos;s growing settlements, on a live server that never pauses. You rule from inside your own eyes: the map is a table in your hall, your holdings run while you sleep, and <b>the Forge is the settlement</b>.</p>
      </header>

      <div className="play-gamer">
        <b>In gamer terms</b>
        <span>Late game. Climb <b>five rungs</b> of holding from a homestead to a crown; get ground by <b>buying, seizing, earning or founding</b> it; level your realm on real work with a <b>1.6× curve and a quest ceiling every third level</b>; spec <b>six realm trees</b>; pick a <b>faith</b> that pays and costs; fight sieges as <b>Forge clocks</b> (storm or wait); hold <b>Court Day</b> monthly; run it with friends as a <b>Syndicate</b>; and when you die for good, your heir holds it or it fractures.</span>
      </div>

      <div className="play-jump">
        <a href="#ladder">The ladder</a><a href="#plots">Plots</a><a href="#ground">Getting ground</a><a href="#level">Kingdom Level</a><a href="#trees">Realm trees</a><a href="#faith">Faith</a><a href="#siege">Sieges</a><a href="#court">Court Day</a><a href="#board">The world board</a><a href="#laws">Standing laws</a>
        <Link href="/codex/bible/kingdom-management">Kingdom Management (canon)</Link>
      </div>

      {/* ------------------------------------------------------------ ladder */}
      <section className="play-law" id="ladder">
        <h2>The ladder: five rungs, each adds verbs</h2>
        <p className="play-lede">None retires the ones below. The bottom rung starts on a bought plot; the top two are seized, granted or founded, rarely built from mud.</p>
        <div className="field-grid is-row">
          {holdingRungs.map((rung, index) => (
            <FieldCard
              accent={index === holdingRungs.length - 1}
              eyebrow={`Rung ${index + 1}`}
              fields={[
                { label: "Holds", value: rung.holds },
                { label: "How", value: rung.how, tone: "muted" },
                { label: "Unlocks", value: rung.verbs.join(" · "), tone: "good" },
              ]}
              key={rung.name}
              name={rung.name}
              step={index + 1}
            />
          ))}
        </div>
      </section>

      {/* ------------------------------------------------------------- plots */}
      <section className="play-law" id="plots">
        <h2>Plots: where you build your own buildings</h2>
        <p className="play-lede">{plotsLaw} <b>The Riverlands holds three: the Charters</b> — old land charters in courthouse escrow, released by campaign progress, each a different lesson. They are plots, not rungs of the ladder.</p>
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
      </section>

      {/* ------------------------------------------------------------- level */}
      <section className="play-law" id="level">
        <h2>Your Kingdom Level: do more, grow more, reach further</h2>
        <div className="field-grid">
          <FieldCard eyebrow="XP comes from real work only" fields={kingdomLevel.xpFrom.map((line, index) => ({ label: index === 0 ? "Earned by" : "", value: line }))} name="What levels the realm" />
          <FieldCard eyebrow="Every cap grows with the level" fields={kingdomLevel.extends.map((line, index) => ({ label: index === 0 ? "Extends" : "", value: line }))} name="What the level buys" />
          <FieldCard
            accent
            eyebrow="The curve and the ceilings"
            fields={[
              { label: "Curve", value: kingdomLevel.curve },
              { label: "Ceilings", value: kingdomLevel.ceilings, tone: "bad" },
              { label: "First one", value: kingdomLevel.firstCeiling, tone: "muted" },
              { label: "Teacher", value: kingdomLevel.teacher },
              { label: "Tall or wide", value: kingdomLevel.tallVsWide, tone: "good" },
            ]}
            name="The crown's provings"
          />
        </div>
      </section>

      {/* ------------------------------------------------------------- trees */}
      <section className="play-law" id="trees">
        <h2>The crown&apos;s six realm trees</h2>
        <p className="play-lede">{realmTreesLaw}</p>
        <div className="field-grid is-row">
          {realmTrees.map((tree) => (
            <FieldCard eyebrow="Realm tree" fields={[{ label: "Buys", value: tree.buys, tone: "good" }, { label: "Notes", value: tree.note, tone: "muted" }]} key={tree.name} name={tree.name} />
          ))}
        </div>
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

      {/* ------------------------------------------------------------- court */}
      <section className="play-law" id="court">
        <h2>Court Day: the first of every month</h2>
        <p className="play-lede">{courtDay.when} Four ways to handle it, priced by the campaign over fourteen months of rule.</p>
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
