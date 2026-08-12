import Link from "next/link";
import { ArrowRight, RadioTower, Swords } from "lucide-react";
import { ClubGameCard } from "@/components/club-game-card";
import { WorldCard } from "@/components/world-card";
import { getClubGames } from "@/lib/club-games";
import { getWorlds } from "@/lib/world-data";

export default async function GamesPage() {
  const worlds = await getWorlds();
  const clubGames = getClubGames();
  return <section className="page-shell games-hub">
    <div className="games-hub-intro">
      <p className="eyebrow">The game rooms</p>
      <h1>Pick your poison.</h1>
      <p>Private worlds we run and the games we rally around—all under one roof.</p>
      <div><span><RadioTower aria-hidden="true" size={14} /> {worlds.length} hosted worlds</span><span><Swords aria-hidden="true" size={14} /> {clubGames.length} club room</span></div>
    </div>

    <section className="games-hub-section">
      <div className="section-heading games-section-heading">
        <div><p className="eyebrow">Hosted here</p><h2>Habitat worlds</h2></div>
        <Link href="/departure-board">Departure board <ArrowRight aria-hidden="true" size={15} /></Link>
      </div>
      <div className="world-grid">{worlds.map((world) => <WorldCard key={world.slug} world={world} />)}</div>
    </section>

    <section className="games-hub-section club-rooms-section" id="club-rooms">
      <div className="section-heading games-section-heading">
        <div><p className="eyebrow">Played together</p><h2>Club rooms</h2></div>
        <p>Publisher-hosted games with a home inside the Habitat.</p>
      </div>
      <div className="club-room-grid">{clubGames.map((game) => <ClubGameCard game={game} key={game.slug} />)}</div>
    </section>
  </section>;
}
