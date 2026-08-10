import { ChronicleFeed } from "@/components/chronicle-feed";
import { getChronicleEvents } from "@/lib/world-data";

export default async function ChroniclePage() {
  const events = await getChronicleEvents();
  return <section className="page-shell"><div className="page-intro"><p className="eyebrow">A normalized record across every world</p><h1>The Habitat Chronicle</h1><p>Only verified adapter events belong here. Replayed worker cycles cannot duplicate the record.</p></div><ChronicleFeed events={events} /></section>;
}
