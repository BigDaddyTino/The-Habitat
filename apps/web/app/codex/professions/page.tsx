import { requireRole } from "@/lib/authorization";
import { findCodexArt } from "@/lib/codex-art";
import { professions, progression, reservedTrade, rungOrder, tradeGrounds } from "@/lib/professions";
import { storyReadRole } from "@/lib/story-codex";
import "./professions.css";

export const metadata = { title: "The Nine Trades | Story Codex" };

const rungLabel: Record<string, string> = { apprentice: "Apprentice", licensed: "Licensed", journeyman: "Journeyman", master: "Master" };

/**
 * The nine trades, laid out the way a player reads them: the grind, the
 * gates, what each rung can make, where the world signs your book, and what
 * the proving costs. Design source: `lib/professions.ts` — the same file
 * the balance campaign runs its arithmetic from.
 */
export default async function ProfessionsPage() {
  await requireRole(storyReadRole);
  return (
    <section className="page-shell codex-shell trades-shell">
      <header className="trades-hero">
        <p className="eyebrow">Professions</p>
        <h1>The Nine Trades</h1>
        <p>Four rungs, and every one of them is uphill: <b>Apprentice → Licensed → Journeyman → Master</b>. You raise a trade by doing its work — nothing is handed out, gates are people who can say no, and a journeyman <b>journeys</b>: three grounds&apos; books signed before the rung opens. Licensed in as many trades as you can keep busy. <b>Master in exactly one, ever</b> — unless you are a Procurator.</p>
      </header>

      <div className="trades-law">
        <h2>How a trade levels — the grind is the game</h2>
        <div className="trades-track">
          <div className="track-rung"><b>Apprentice</b><span>Everyone, in every trade, from day one</span></div>
          <div className="track-gate"><i>{progression.jobsToLicence} jobs</i><span>then a licence</span></div>
          <div className="track-rung"><b>Licensed</b><span>As many trades as you can staff</span></div>
          <div className="track-gate"><i>{progression.jobsToJourneyman} jobs</i><span>+ {progression.wanderGrounds} grounds&apos; books</span></div>
          <div className="track-rung"><b>Journeyman</b><span>The wander-years — the word means the walk</span></div>
          <div className="track-gate"><i>{progression.jobsToMastery} jobs</i><span>+ a proving + a master&apos;s signature</span></div>
          <div className="track-rung is-master"><b>Master</b><span>One trade. Ever.</span></div>
        </div>
        <ul>{progression.rules.map((rule) => <li key={rule}>{rule}</li>)}</ul>
        <p className="trades-seal"><b>The Second Seal.</b> The Procurator — and only the Procurator — masters two trades. It is the class whose whole life is licences; holding a second mastery is not a favour, it is what a Procurator <i>is</i>. Every other class chooses once and lives with it.</p>
      </div>

      <div className="trades-map">
        <h2>Where the trades live</h2>
        <p>A journeyman&apos;s book is signed on grounds, and the grounds are the world — including the parts nobody has written yet, where a seat is drawn and waiting. <b>No seat opens on Ignit Island.</b> The island burns; the trades already know.</p>
        <div className="trades-map-grid">
          {tradeGrounds.map((ground) => (
            <div className={`map-ground${ground.unwritten ? " is-unwritten" : ""}`} key={ground.slug}>
              <b>{ground.name}</b>
              {ground.unwritten ? <i>not yet written — seats reserved</i> : null}
              <span>{ground.note}</span>
            </div>
          ))}
          <div className="map-ground is-burned">
            <b>Ignit Island</b>
            <i>no seats, ever</i>
            <span>The prologue&apos;s ground. It is destroyed, and no trade takes root on ground that burns.</span>
          </div>
        </div>
      </div>

      <div className="trades-grid">
        {professions.map((trade) => {
          const art = findCodexArt("trades", trade.slug);
          return (
            <article className="trade-card" id={trade.slug} key={trade.slug}>
              <header>
                <h2>{trade.name}</h2>
                <p className="trade-tagline">{trade.tagline}</p>
                <p className="trade-unit">One job = {trade.workUnit}</p>
              </header>
              {art ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img alt={`${trade.name} — trade plate`} className="trade-art" src={art} />
              ) : <p className="trade-artslot">trade art slot — Sol · <code>private/codex-art/trades/{trade.slug}.png</code></p>}

              {rungOrder.map((rung) => {
                const tier = trade.tiers.find((entry) => entry.rung === rung);
                if (!tier) return null;
                return (
                  <div className={`trade-rung is-${rung}`} key={rung}>
                    <h3>{rungLabel[rung]}</h3>
                    {tier.gate ? (
                      <p className={`trade-gate${tier.gate.illicit ? " is-illicit" : ""}`}>
                        <b>{tier.gate.illicit ? "⚠ " : ""}{tier.gate.licence}</b>
                        <span>{tier.gate.issuerName}</span>
                        {tier.gate.price}
                      </p>
                    ) : <p className="trade-gate is-open"><b>No gate</b><span>Where everyone starts</span>Nobody is licensed on day one, and nothing after day one is free.</p>}
                    <ul className="trade-blueprints">
                      {tier.blueprints.map((blueprint) => (
                        <li key={blueprint.name}>
                          <b>{blueprint.name}</b>
                          <span>{blueprint.does.map((line) => <i key={line}>{line}</i>)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}

              <div className="trade-proving">
                <b>The proving</b> {trade.proving}
              </div>

              <div className="trade-seats">
                <h3>Seats — where the book is signed, and what only that ground teaches</h3>
                <ul>
                  {trade.seats.map((seat) => {
                    const ground = tradeGrounds.find((entry) => entry.slug === seat.ground);
                    const reserved = seat.teaches.name.startsWith("—");
                    return (
                      <li className={reserved ? "is-reserved" : undefined} key={seat.ground}>
                        <b>{ground?.name ?? seat.ground}</b> — {seat.keeper}
                        {seat.kind && seat.kind !== "human" ? <i className="seat-kind">{seat.kind}</i> : null}
                        <em>{seat.note}</em>
                        {reserved
                          ? <span className="seat-reserved">{seat.teaches.does[0]}</span>
                          : <span className="seat-teaches"><b>{seat.teaches.name}</b>{seat.teaches.does.map((line) => <i key={line}>{line}</i>)}</span>}
                      </li>
                    );
                  })}
                </ul>
              </div>

              {trade.ceiling ? <p className="trade-ceiling"><b>The ceiling</b> {trade.ceiling}</p> : null}
            </article>
          );
        })}
      </div>

      <aside className="trades-reserved">
        <h2>{reservedTrade.name} — reserved</h2>
        <p>{reservedTrade.why}</p>
        <p>{reservedTrade.shape}</p>
      </aside>

      <p className="trades-foot">The trades&apos; end-game is documents. Chemistry&apos;s assay blank and Refining&apos;s clean grade are the two most valuable pieces of paper a master can produce, and neither is a weapon: one makes a person read as nothing, the other makes a crate worth more than the same crate without it.</p>
    </section>
  );
}
