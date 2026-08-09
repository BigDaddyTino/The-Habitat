import { StatusBadge } from "@/components/status-badge";
import { getWorlds } from "@/lib/world-data";

export default async function DepartureBoardPage() {
  const worlds = await getWorlds();
  return <section className="page-shell"><div className="page-intro departure-intro"><p className="eyebrow">The Habitat equivalent of a station board</p><h1>The Departure Board</h1><p>Registry-backed now. Sleeping never reads as broken, and unknown stays unknown until the agent reports in.</p></div><div className="departure-board"><div className="departure-head"><span>World</span><span>Status</span><span>Players</span><span>Version</span><span>Last fire</span></div>{worlds.map((world) => <div className="departure-row" key={world.slug}><strong>{world.game}<small>{world.worldName}</small></strong><StatusBadge state={world.state} /><span>{world.players === null ? "-" : `${world.players} / ${world.capacity ?? "-"}`}</span><span>{world.version ?? "-"}</span><span>{world.lastFire}</span></div>)}</div></section>;
}
