import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, BarChart3, Crown, Gamepad2, Shield, Swords, UserRound, UsersRound } from "lucide-react";
import { getClubGameBySlug } from "@/lib/club-games";

export default async function ClubGameDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const game = getClubGameBySlug(slug);
  if (!game) notFound();

  return <section className={`page-shell club-room-page club-${game.accent}`}>
    <Link className="club-room-back" href="/games#club-rooms"><ArrowLeft aria-hidden="true" size={15} /> All games</Link>

    <header className="club-room-hero">
      <div className="club-room-hero-copy">
        <p className="eyebrow"><Swords aria-hidden="true" size={13} /> {game.roomName}</p>
        <h1>{game.name}</h1>
        <p className="club-room-tagline">{game.tagline}</p>
        <p>{game.description}</p>
        <div className="club-room-facts">
          <span><UsersRound aria-hidden="true" size={15} /> {game.squadSize}-player squads</span>
          <span><Shield aria-hidden="true" size={15} /> Club game</span>
          <span><Gamepad2 aria-hidden="true" size={15} /> Steam crew</span>
        </div>
      </div>
      <div className="club-room-hero-crest" aria-hidden="true">
        <div><span>MR</span><small>The Habitat</small></div>
        <i /><i /><i /><i /><i /><i />
      </div>
    </header>

    <div className="club-room-board">
      <section className="squad-board">
        <div className="club-board-heading"><div><p className="eyebrow">Tonight&apos;s lineup</p><h2>Squad board</h2></div><span>0 / {game.squadSize}</span></div>
        <div className="squad-seats">
          {Array.from({ length: game.squadSize }, (_, index) => <div key={index}><UserRound aria-hidden="true" size={18} /><span>Open seat</span></div>)}
        </div>
        <p className="club-board-empty">No squad is posted yet.</p>
      </section>

      <aside className="club-board-side">
        <article>
          <Crown aria-hidden="true" size={20} />
          <p className="eyebrow">Member standings</p>
          <h2>The board is clean.</h2>
          <p>Ranks and records will appear when member profiles are connected.</p>
        </article>
        <article>
          <BarChart3 aria-hidden="true" size={20} />
          <p className="eyebrow">Coming to the room</p>
          <ul>{game.features.map((feature) => <li key={feature}>{feature}</li>)}</ul>
        </article>
      </aside>
    </div>

    <footer className="club-room-status"><span>Profile linking is being prepared</span><p>Until then, the room stays honest and empty.</p></footer>
  </section>;
}
