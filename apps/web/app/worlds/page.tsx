import { WorldCard } from "@/components/world-card";
import { getWorlds } from "@/lib/world-data";

export default async function WorldsPage() {
  const worlds = await getWorlds();
  return <section className="page-shell"><div className="page-intro"><p className="eyebrow">Hosted worlds</p><h1>Six worlds. One clubhouse.</h1><p>The private servers operated by the Habitat.</p></div><div className="world-grid">{worlds.map((world) => <WorldCard key={world.slug} world={world} />)}</div></section>;
}
