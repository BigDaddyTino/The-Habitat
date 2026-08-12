import { ClubGameCard } from "@/components/club-game-card";
import { getClubGames } from "@/lib/club-games";

export default function ClubGamesPage() {
  const games = getClubGames();
  return <section className="page-shell club-games-page">
    <div className="page-intro club-games-intro">
      <p className="eyebrow">Beyond the servers</p>
      <h1>Club games.</h1>
      <p>Games the Habitat does not host, but absolutely rallies around. Their stories come from member connections and approved data sources—not from a server monitor.</p>
    </div>
    <div className="club-game-grid">{games.map((game) => <ClubGameCard key={game.slug} game={game} />)}</div>
    <aside className="club-games-rule"><strong>Different signal. Same standard.</strong><span>Club games never show fabricated server health, uptime, or player counts. Every imported stat will name its source and last sync.</span></aside>
  </section>;
}
