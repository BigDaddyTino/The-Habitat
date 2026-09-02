import Link from "next/link";
import { AbilityCardView } from "@/components/ability-card";
import { FieldCard } from "@/components/field-card";
import { requireRole } from "@/lib/authorization";
import { findCodexArt } from "@/lib/codex-art";
import { codexArtSized } from "@/lib/codex-art-derivative";
import { professions, progression, reservedTrade, rungOrder, tradeGrounds } from "@/lib/professions";
import { storyReadRole } from "@/lib/story-codex";
import { blueprintCard, rungBonus, rungLabel } from "@/lib/trade-cards";
import "../play.css";
import "./professions.css";

export const metadata = { title: "The Nine Trades | Story Codex" };

/**
 * The nine trades, laid out the way the Character page is: what a trade is
 * in one line, the ladder once, then each trade as four rung columns — the
 * gate as a labeled block, every blueprint as an ability card, the rung's
 * standing bonus in the sims' own numbers — and the seats where the book is
 * signed. Design source: `lib/professions.ts`, the same file the balance
 * campaign runs its arithmetic from.
 */
export default async function ProfessionsPage() {
  await requireRole(storyReadRole);
  return (
    <section className="page-shell codex-shell play-shell trades-shell">
      <header className="play-hero">
        <p className="eyebrow">Professions</p>
        <h1>The Nine Trades</h1>
        <p>Crafting, the near-future way. <b>Apprentice → Licensed → Journeyman → Master</b>, every rung an uphill count of real jobs, every rung-up a person who can say no. Each rung unlocks <b>blueprints</b>: things you can make or do, with the numbers. Licensed in as many trades as you can keep busy. <b>Master in exactly one, ever</b> — unless you are a Procurator.</p>
      </header>

      <div className="play-gamer">
        <b>In gamer terms</b>
        <span>Professions, WoW style, with a licence between every tier. Do <b>{progression.jobsToLicence}</b> jobs and a faction will sell you a licence; <b>{progression.jobsToJourneyman}</b> licensed jobs plus your book signed on <b>{progression.wanderGrounds} different grounds</b> opens Journeyman; <b>{progression.jobsToMastery}</b> more, a proving and a living master&apos;s signature make a Master. Every rung shows its <b>blueprints</b> as cards and its standing party bonus. Trades survive death: your kit is on the corpse, your rungs are not.</span>
      </div>

      <section className="play-law">
        <h2>The ladder</h2>
        <div className="trades-track">
          <div className="track-rung"><b>Apprentice</b><span>Everyone, in every trade, from day one</span></div>
          <div className="track-gate"><i>{progression.jobsToLicence} jobs</i><span>then a licence</span></div>
          <div className="track-rung"><b>Licensed</b><span>As many trades as you can staff</span></div>
          <div className="track-gate"><i>{progression.jobsToJourneyman} jobs</i><span>+ {progression.wanderGrounds} grounds&apos; books</span></div>
          <div className="track-rung"><b>Journeyman</b><span>The wander-years: the word means the walk</span></div>
          <div className="track-gate"><i>{progression.jobsToMastery} jobs</i><span>+ a proving + a master&apos;s signature</span></div>
          <div className="track-rung is-master"><b>Master</b><span>One trade. Ever.</span></div>
        </div>
        <ul className="trades-rules">{progression.rules.map((rule) => <li key={rule}>{rule}</li>)}</ul>
        <p className="trades-seal"><b>The Second Seal.</b> The Procurator, and only the Procurator, masters two trades. The class whose whole life is licences is not doing you a favour by holding a second mastery; it is what a Procurator <i>is</i>.</p>
      </section>

      <div className="play-jump">
        {professions.map((trade) => <a href={`#${trade.slug}`} key={trade.slug}>{trade.name}</a>)}
        <a href="#grounds">Where the trades live</a>
        <Link href="/codex/bible/professions">Professions (canon)</Link>
      </div>

      {professions.map((trade) => {
        const master = findCodexArt("trades", trade.slug);
        const art = master ? codexArtSized(master, 640) : null;
        return (
          <article className="play-law trade" id={trade.slug} key={trade.slug}>
            <header className="trade-head">
              {art
                // eslint-disable-next-line @next/next/no-img-element
                ? <img alt="" className="trade-plate" src={art} />
                : <span className="trade-plate is-slot"><code>trades/{trade.slug}.png</code></span>}
              <div>
                <p className="eyebrow">Trade · one job = {trade.workUnit}</p>
                <h3>{trade.name}</h3>
                <p className="trade-tagline">{trade.tagline}</p>
                <dl className="trade-facts">
                  <dt>The proving</dt><dd>{trade.proving}</dd>
                  {trade.ceiling ? (<><dt>The ceiling</dt><dd className="is-ceiling">{trade.ceiling}</dd></>) : null}
                </dl>
              </div>
            </header>

            <div className="trade-rungs">
              {rungOrder.map((rung, index) => {
                const tier = trade.tiers.find((entry) => entry.rung === rung);
                if (!tier) return null;
                const bonus = rungBonus(trade.slug, rung);
                return (
                  <section className={`trade-rung is-${rung}`} key={rung}>
                    <h4><span>{index + 1}</span>{rungLabel[rung]}</h4>
                    {tier.gate ? (
                      <FieldCard
                        eyebrow={tier.gate.illicit ? "The gate · no lawful paper" : "The gate"}
                        fields={[
                          { label: "Licence", value: tier.gate.licence },
                          { label: "Issuer", value: <Link href={`/codex/bible/${tier.gate.issuer}`}>{tier.gate.issuerName}</Link> },
                          { label: "Price", value: tier.gate.price, tone: "bad" },
                        ]}
                        name={`Reaching ${rungLabel[rung]}`}
                        price={tier.gate.illicit}
                        tag={tier.gate.illicit ? "holding this is itself a mark" : undefined}
                      />
                    ) : (
                      <FieldCard eyebrow="The gate" fields={[{ label: "Licence", value: "None. Everyone starts here, in every trade, on day one." }, { label: "Price", value: "Nothing after day one is free.", tone: "muted" }]} name="Where everyone starts" />
                    )}
                    {bonus.length ? (
                      <p className="trade-bonus"><b>Standing bonus at this rung</b>{bonus.map((line) => <span key={line}>{line}</span>)}</p>
                    ) : (
                      <p className="trade-bonus is-none"><b>Standing bonus at this rung</b><span>None yet; the blueprints are the whole reward.</span></p>
                    )}
                    <div className="trade-blueprints">
                      {tier.blueprints.map((blueprint) => (
                        <AbilityCardView card={blueprintCard(blueprint)} eyebrow={`${trade.name} · ${rungLabel[rung]}`} key={blueprint.name} name={blueprint.name} />
                      ))}
                    </div>
                  </section>
                );
              })}
            </div>

            <div className="trade-seats">
              <h4>Seats: where the book is signed, and what only that ground teaches</h4>
              <div className="field-grid">
                {trade.seats.map((seat) => {
                  const ground = tradeGrounds.find((entry) => entry.slug === seat.ground);
                  const reserved = seat.teaches.name.startsWith("—");
                  return (
                    <FieldCard
                      eyebrow={`${ground?.name ?? seat.ground}${ground?.unwritten ? " · not yet written" : ""}`}
                      fields={[
                        { label: "Keeper", value: reserved ? "Seat drawn, keeper unnamed." : <>{seat.keeper}{seat.kind && seat.kind !== "human" ? <i className="trade-kind"> · {seat.kind}</i> : null}</> },
                        { label: "Like", value: seat.note, tone: "muted" },
                        { label: "Teaches", value: reserved ? seat.teaches.does[0] : <><b>{seat.teaches.name}.</b> {seat.teaches.does.join(" ")}</>, tone: reserved ? "muted" : "good" },
                      ]}
                      key={seat.ground}
                      name={reserved ? "Reserved" : seat.teaches.name}
                      reserved={reserved}
                    />
                  );
                })}
              </div>
            </div>
          </article>
        );
      })}

      <section className="play-law" id="grounds">
        <h2>Where the trades live</h2>
        <p className="play-lede">A journeyman&apos;s book is signed on grounds, and the grounds are the world — including the parts nobody has written yet, where a seat is drawn and waiting. <b>No seat opens on Ignit Island.</b> The island burns; the trades already know.</p>
        <div className="field-grid">
          {tradeGrounds.map((ground) => (
            <FieldCard
              eyebrow={ground.unwritten ? "Not yet written · seats reserved" : "Written ground"}
              fields={[
                { label: "Ground", value: ground.note, tone: "muted" },
                { label: "Trades", value: professions.filter((trade) => trade.seats.some((seat) => seat.ground === ground.slug)).map((trade) => trade.name).join(" · ") || "—" },
              ]}
              key={ground.slug}
              name={ground.name}
              reserved={ground.unwritten}
            />
          ))}
          <FieldCard eyebrow="No seats, ever" fields={[{ label: "Ground", value: "The prologue's ground. It is destroyed, and no trade takes root on ground that burns.", tone: "bad" }]} name="Ignit Island" price />
        </div>
      </section>

      <section className="play-law">
        <h2>{reservedTrade.name}: the tenth trade, reserved</h2>
        <p className="play-lede">{reservedTrade.why}</p>
        <p className="play-lede">{reservedTrade.shape}</p>
      </section>

      <p className="trades-foot">The trades&apos; end-game is documents. Chemistry&apos;s assay blank and Refining&apos;s clean grade are the two most valuable pieces of paper a master can produce, and neither is a weapon: one makes a person read as nothing, the other makes a crate worth more than the same crate without it.</p>
    </section>
  );
}
