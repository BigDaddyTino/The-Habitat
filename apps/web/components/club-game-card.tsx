import Link from "next/link";
import { ArrowUpRight, Crosshair, ShieldCheck } from "lucide-react";
import type { ClubGame } from "@/lib/club-games";

export function ClubGameCard({ game }: { game: ClubGame }) {
  return <Link href={`/club-games/${game.slug}`} className={`club-game-card club-${game.accent}`} aria-label={`Open ${game.name} club room`}>
    <div className="club-game-card-sigil" aria-hidden="true"><Crosshair size={31} strokeWidth={1.3} /></div>
    <div className="club-card-topline"><span>Club game</span><ShieldCheck size={16} aria-hidden="true" /></div>
    <h2>{game.name}</h2>
    <p>{game.description}</p>
    <ul>{game.features.slice(0, 3).map((feature) => <li key={feature}>{feature}</li>)}</ul>
    <span className="club-card-link">Enter squad room <ArrowUpRight aria-hidden="true" size={16} /></span>
  </Link>;
}
