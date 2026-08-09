import { chronicle } from "@habitat/shared";

export default function ChroniclePage() {
  return <section className="page-shell"><div className="page-intro"><p className="eyebrow">A normalized record across every world</p><h1>The Habitat Chronicle</h1><p>These are seeded examples. Production entries will include source confidence, dedupe protection, permanent links, and only verified game data.</p></div><ol className="chronicle-page-list">{chronicle.map((entry) => <li key={`${entry.time}-${entry.text}`}><time>{entry.time}</time><div className={`chronicle-symbol ${entry.kind}`} /><p>{entry.text}</p><span>Seed event</span></li>)}</ol></section>;
}
