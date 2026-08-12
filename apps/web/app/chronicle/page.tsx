import { ChronicleFeed } from "@/components/chronicle-feed";
import { chronicleEventLabels, chronicleEventTypes, chronicleGameLabels, chronicleGameTypes, getChronicleEvents, isChronicleEventType, isChronicleGameType } from "@/lib/world-data";

export default async function ChroniclePage({ searchParams }: { searchParams: Promise<{ game?: string; type?: string }> }) {
  const filters = await searchParams;
  const gameType = isChronicleGameType(filters.game) ? filters.game : undefined;
  const eventType = isChronicleEventType(filters.type) ? filters.type : undefined;
  const events = await getChronicleEvents({ gameType, eventType });
  return <section className="page-shell"><div className="page-intro"><p className="eyebrow">A normalized record across every world</p><h1>The Habitat Chronicle</h1><p>Only verified server or provider evidence belongs here. Replayed worker cycles cannot duplicate the record.</p></div><form className="chronicle-filters" action="/chronicle"><label>World<select name="game" defaultValue={gameType ?? ""}><option value="">All sources</option>{chronicleGameTypes.map((game) => <option key={game} value={game}>{chronicleGameLabels[game]}</option>)}</select></label><label>Event<select name="type" defaultValue={eventType ?? ""}><option value="">All verified events</option>{chronicleEventTypes.map((type) => <option key={type} value={type}>{chronicleEventLabels[type]}</option>)}</select></label><button type="submit">Apply filters</button></form><ChronicleFeed events={events} /></section>;
}
