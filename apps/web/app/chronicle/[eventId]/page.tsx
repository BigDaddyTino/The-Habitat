import Link from "next/link";
import { notFound } from "next/navigation";
import { Link2 } from "lucide-react";
import { formatChronicleTime } from "@/components/chronicle-feed";
import { getChronicleEvent } from "@/lib/world-data";

export default async function ChronicleEventPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;
  const event = await getChronicleEvent(eventId);
  if (!event) notFound();

  return <section className="page-shell"><div className="page-intro chronicle-event-intro"><p className="eyebrow">Verified Chronicle event</p><h1>{event.text}</h1><p><time dateTime={event.occurredAt.toISOString()}>{formatChronicleTime(event.occurredAt)}</time> <span aria-hidden="true">/</span> {event.world}</p></div><div className="chronicle-event-links"><Link href={`/worlds/${event.worldSlug}`}>View {event.world}</Link><Link href={`/chronicle/${event.id}`} aria-label="Permanent link to this event" title="Permanent event link"><Link2 aria-hidden="true" size={16} /></Link></div></section>;
}
