import Link from "next/link";
import { ArrowRight, Flame, ShieldCheck, UsersRound } from "lucide-react";
import { chronicle, worlds } from "@habitat/shared";
import { StatusBadge } from "@/components/status-badge";
import { WorldCard } from "@/components/world-card";

export default function GreatHallPage() {
  const liveWorlds = worlds.filter((world) => world.state === "ONLINE");
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
          <p className="hero-copy">The fires are burning. Six worlds, one clubhouse, and a permanent record of every questionable decision.</p>
          <div className="hero-facts" aria-label="Current seeded overview">
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
          <p>Static seed data for the first visual slice. Live telemetry joins after the agent and worker are in place.</p>
        </div>
        <div className="world-grid">
          {worlds.map((world) => <WorldCard world={world} key={world.slug} />)}
        </div>
      </section>

      <section className="content-shell lower-grid">
        <div className="chronicle-panel">
          <div className="panel-heading"><div><p className="eyebrow">The Habitat Chronicle</p><h2>Recent dispatches</h2></div><Link href="/chronicle">All history <ArrowRight size={15} /></Link></div>
          <ol className="chronicle-list">
            {chronicle.map((entry) => <li key={`${entry.time}-${entry.text}`}><time>{entry.time}</time><span className={`chronicle-dot ${entry.kind}`} aria-hidden="true" /><p>{entry.text}</p></li>)}
          </ol>
        </div>
        <aside className="fire-panel">
          <p className="eyebrow">Light the fire</p>
          <h2>Palworld is sleeping.</h2>
          <p>Four people want this world awake. Wake requests will become available after Auth.js and server-side permissions are in place.</p>
          <div className="fire-panel-status"><StatusBadge state="SLEEPING" /><span>Last fire: Yesterday, 1:18 AM</span></div>
        </aside>
      </section>
    </div>
  );
}
