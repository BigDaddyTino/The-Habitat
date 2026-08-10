import Link from "next/link";
import { ArrowRight, Flame, ShieldCheck, UsersRound } from "lucide-react";
import { StatusBadge } from "@/components/status-badge";
import { WorldCard } from "@/components/world-card";
import { getWorlds } from "@/lib/world-data";

export default async function GreatHallPage() {
  const worlds = await getWorlds();
  const liveWorlds = worlds.filter((world) => world.state === "ONLINE");
  const reportingWorlds = worlds.filter((world) => world.state !== "UNKNOWN");
  const monitorFocus = reportingWorlds[0] ?? null;
  const activePlayers = liveWorlds.reduce((total, world) => total + (world.players ?? 0), 0);
  return (
    <div className="great-hall">
      <section className="hall-hero">
        <div className="hero-image" aria-hidden="true" />
        <div className="hero-shade" aria-hidden="true" />
        <div className="hero-content content-shell">
          <p className="eyebrow">Private operations center</p>
          <h1>The Habitat</h1>
          <p className="hero-subtitle">God&apos;s Country</p>
          <p className="hero-copy">{liveWorlds.length > 0 ? "The fires are burning." : "Quiet night in God’s Country."} Six worlds, one clubhouse, and a permanent record of every questionable decision.</p>
          <div className="hero-facts" aria-label="Current world overview">
            <div><Flame aria-hidden="true" /><strong>{liveWorlds.length}</strong><span>fires burning</span></div>
            <div><UsersRound aria-hidden="true" /><strong>{activePlayers}</strong><span>players online</span></div>
            <div><ShieldCheck aria-hidden="true" /><strong>{worlds.length}</strong><span>worlds registered</span></div>
          </div>
          <Link className="primary-link" href="/departure-board">Open departure board <ArrowRight aria-hidden="true" size={17} /></Link>
        </div>
      </section>

      <section className="content-shell world-section">
        <div className="section-heading">
          <div><p className="eyebrow">World registry</p><h2>Tonight in the Habitat</h2></div>
          <p>These world definitions come directly from the Habitat registry. Live telemetry arrives through the agent and worker.</p>
        </div>
        <div className="world-grid">
          {worlds.map((world) => <WorldCard world={world} key={world.slug} />)}
        </div>
      </section>

      <section className="content-shell lower-grid">
        <div className="chronicle-panel">
          <div className="panel-heading"><div><p className="eyebrow">The Habitat Chronicle</p><h2>Recent dispatches</h2></div><Link href="/chronicle">All history <ArrowRight size={15} /></Link></div>
          <div className="chronicle-empty"><p>No verified Chronicle events yet.</p><span>Monitoring will write the first true dispatch.</span></div>
        </div>
        <aside className="fire-panel">
          <p className="eyebrow">Monitor report</p>
          <h2>{monitorFocus ? `${monitorFocus.game} is ${monitorFocus.state.replaceAll("_", " ").toLowerCase()}.` : "Waiting on the first report."}</h2>
          <p>{monitorFocus ? `${reportingWorlds.length} world${reportingWorlds.length === 1 ? " is" : "s are"} reporting verified runtime state through the Habitat Agent.` : "The dashboard will remain unknown until the worker records verified agent telemetry."}</p>
          <div className="fire-panel-status"><StatusBadge state={monitorFocus?.state ?? "UNKNOWN"} /><span>{monitorFocus ? `Last fire: ${monitorFocus.lastFire}` : "Waiting on MartServ102 telemetry"}</span></div>
        </aside>
      </section>
    </div>
  );
}
