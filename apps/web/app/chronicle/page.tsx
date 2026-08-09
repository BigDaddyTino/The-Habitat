import { ScrollText } from "lucide-react";

export default function ChroniclePage() {
  return <section className="page-shell"><div className="page-intro"><p className="eyebrow">A normalized record across every world</p><h1>The Habitat Chronicle</h1><p>Only verified adapter events belong here. The first entry arrives when monitoring begins.</p></div><div className="empty-data"><ScrollText aria-hidden="true" /><div><p className="eyebrow">The record is waiting</p><h2>No Chronicle events yet.</h2><p>Server transitions, joins, leaves, and achievements will be stored here only after the worker can prove them.</p></div></div></section>;
}
