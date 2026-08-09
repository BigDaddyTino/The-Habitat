import { worlds } from "@habitat/shared";
import { StatusBadge } from "@/components/status-badge";

export default function DepartureBoardPage() {
  return <section className="page-shell"><div className="page-intro departure-intro"><p className="eyebrow">The Habitat equivalent of a station board</p><h1>The Departure Board</h1><p>Leave this page up on a spare monitor. States are seeded for now, but the hierarchy is final: sleeping never reads as broken.</p></div><div className="departure-board"><div className="departure-head"><span>World</span><span>Status</span><span>Players</span><span>Version</span><span>Last fire</span></div>{worlds.map((world) => <div className="departure-row" key={world.slug}><strong>{world.game}<small>{world.worldName}</small></strong><StatusBadge state={world.state} /><span>{world.players === null ? "-" : `${world.players} / ${world.capacity}`}</span><span>{world.version}</span><span>{world.lastFire}</span></div>)}</div></section>;
}
