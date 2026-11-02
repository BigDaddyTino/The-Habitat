import { WorldCard } from "@/components/world-card";
import { getWorlds } from "@/lib/world-data";

export default async function WorldsPage() {
  const worlds = await getWorlds();
  return <section className="page-shell"><div className="page-intro"><p className="eyebrow">Hosted worlds</p><h1>Six worlds. One clubhouse.</h1><p>Choose a world to launch through Steam or copy its current connection details. Sign in as a member to connect.</p></div><div className="world-grid">{worlds.map((world) => <WorldCard key={world.slug} world={world} />)}</div></section>;
}
