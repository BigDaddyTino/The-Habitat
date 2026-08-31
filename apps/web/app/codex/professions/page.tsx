import { requireRole } from "@/lib/authorization";
import { findCodexArt } from "@/lib/codex-art";
import { professions, progression, reservedTrade, rungOrder } from "@/lib/professions";
import { storyReadRole } from "@/lib/story-codex";
import "./professions.css";

export const metadata = { title: "The Nine Trades | Story Codex" };

const rungLabel: Record<string, string> = { apprentice: "Apprentice", licensed: "Licensed", master: "Master" };

/**
 * The nine trades, laid out the way a player reads them: what each rung can
 * make, what it actually changes, and who has to sign before you cross into
 * the next one. Design source: `lib/professions.ts` — the same file the
 * balance campaign runs its arithmetic from.
 */
export default async function ProfessionsPage() {
  await requireRole(storyReadRole);
  return (
    <section className="page-shell codex-shell trades-shell">
      <header className="trades-hero">
        <p className="eyebrow">Professions</p>
        <h1>The Nine Trades</h1>
        <p>Three rungs each, and the near-future names are the point: Engineering, not smithing. Chemistry, not alchemy. You raise a trade by <b>doing its work</b> — but the two rung-ups are gated by a licence, and somebody has to sign. Licensed in as many trades as you can keep busy; <b>Master in exactly one, ever</b>.</p>
      </header>

      <div className="trades-law">
        <h2>How a trade levels</h2>
        <div className="trades-track">
          <div className="track-rung"><b>Apprentice</b><span>Everyone, in every trade, from day one</span></div>
          <div className="track-gate"><i>{progression.jobsToLicence} jobs</i><span>then a licence</span></div>
          <div className="track-rung"><b>Licensed</b><span>As many trades as you can staff</span></div>
          <div className="track-gate"><i>{progression.jobsToMastery} jobs</i><span>then a master signs</span></div>
          <div className="track-rung is-master"><b>Master</b><span>One trade. Ever.</span></div>
        </div>
        <ul>{progression.rules.map((rule) => <li key={rule}>{rule}</li>)}</ul>
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
                    ) : <p className="trade-gate is-open"><b>No gate</b><span>Where everyone starts</span>Nobody is licensed on day one.</p>}
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
