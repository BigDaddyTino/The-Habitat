import { notFound } from "next/navigation";
import { Activity, Gauge, History, Radar, UsersRound } from "lucide-react";
import { worlds } from "@habitat/shared";
import { StatusBadge } from "@/components/status-badge";

export function generateStaticParams() { return worlds.map(({ slug }) => ({ slug })); }

export default async function WorldDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const world = worlds.find((entry) => entry.slug === slug);
  if (!world) notFound();
  return <section className={`page-shell world-detail accent-${world.accent}`}><div className="detail-hero"><p className="eyebrow">{world.game}</p><h1>{world.worldName}</h1><p>{world.description}</p><StatusBadge state={world.state} /></div><div className="detail-grid"><article><Activity aria-hidden="true" /><h2>Current state</h2><p>{world.state === "SLEEPING" ? "This world is intentionally resting. It is not counted as an outage." : "This is seeded preview state. Real checks arrive through the Habitat Agent."}</p></article><article><UsersRound aria-hidden="true" /><h2>Population</h2><p>{world.players === null ? "No live count recorded" : `${world.players} of ${world.capacity} seats are claimed`}</p></article><article><Gauge aria-hidden="true" /><h2>Version</h2><p>{world.version}</p></article><article><Radar aria-hidden="true" /><h2>Adapter posture</h2><p>{world.capabilityNote}</p></article></div><div className="empty-data"><History aria-hidden="true" /><div><p className="eyebrow">History begins soon</p><h2>No invented stats.</h2><p>Session data, Chronicle events, and records appear here only once they are verified by a game adapter.</p></div></div></section>;
}
