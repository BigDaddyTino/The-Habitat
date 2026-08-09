import { WorldCard } from "@/components/world-card";
import { getWorlds } from "@/lib/world-data";

export default async function WorldsPage() {
  const worlds = await getWorlds();
  return <section className="page-shell"><div className="page-intro"><p className="eyebrow">World registry</p><h1>Six worlds. One clubhouse.</h1><p>Every world is defined here before it earns live data. Sleeping is intentional; unexpected down will always stand apart.</p></div><div className="world-grid">{worlds.map((world) => <WorldCard key={world.slug} world={world} />)}</div></section>;
}
