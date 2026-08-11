import Link from "next/link";
import { ArrowUpRight, UsersRound, Wifi } from "lucide-react";
import type { WorldView } from "@/lib/world-data";
import { StatusBadge } from "./status-badge";

export function WorldCard({ world }: { world: WorldView }) {
  const playerLabel = world.players === null ? "No live count" : `${world.players} / ${world.capacity}`;
  return (
    <Link href={`/worlds/${world.slug}`} className={`world-card world-card-link accent-${world.accent}${world.state === "SLEEPING" ? " state-sleeping" : ""}`} aria-label={`Open ${world.worldName} server dossier`}>
      <div className="world-card-topline">
        <span className="world-game">{world.game}</span>
        <StatusBadge state={world.state} />
      </div>
      <h2>{world.worldName}</h2>
      <p>{world.description}</p>
      <dl className="world-metrics">
        <div><dt><UsersRound aria-hidden="true" size={14} /> Players</dt><dd>{playerLabel}</dd></div>
        <div><dt><Wifi aria-hidden="true" size={14} /> {world.ping === null ? "Last fire" : "Ping"}</dt><dd>{world.ping === null ? world.lastFire : `${world.ping} ms`}</dd></div>
      </dl>
      <span className="world-link">Open server dossier <ArrowUpRight aria-hidden="true" size={16} /></span>
    </Link>
  );
}
