import Link from "next/link";
import { ArrowRight, Swords, UsersRound } from "lucide-react";
import type { ClubGame } from "@/lib/club-games";

export function ClubGameCard({ game }: { game: ClubGame }) {
  return <Link href={`/club-games/${game.slug}`} className={`club-room-card club-${game.accent}`} aria-label={`Enter ${game.name}: ${game.roomName}`}>
    <div className="club-room-card-copy">
      <div className="club-room-label"><Swords aria-hidden="true" size={14} /><span>Club room</span></div>
      <p className="club-room-name">{game.roomName}</p>
      <h2>{game.name}</h2>
      <p>{game.description}</p>
      <div className="club-room-meta"><span><UsersRound aria-hidden="true" size={14} /> {game.squadSize}-player squads</span><span>Member stats coming soon</span></div>
      <span className="club-room-link">Enter the room <ArrowRight aria-hidden="true" size={16} /></span>
    </div>
    <div className="club-room-crest" aria-hidden="true">
      <span>MR</span>
      <i /><i /><i /><i /><i /><i />
    </div>
  </Link>;
}
