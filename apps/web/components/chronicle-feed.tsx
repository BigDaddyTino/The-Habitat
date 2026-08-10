import Link from "next/link";
import { Link2 } from "lucide-react";
import type { ChronicleEventView } from "@/lib/world-data";

export function ChronicleFeed({ events, compact = false }: { events: ChronicleEventView[]; compact?: boolean }) {
  if (events.length === 0) return <div className="chronicle-empty"><p>No verified Chronicle events yet.</p><span>The record stays quiet until a source can prove something happened.</span></div>;
  return <ol className={compact ? "chronicle-list" : "chronicle-page-list"}>{events.map((event) => <li id={event.id} key={event.id}><time dateTime={event.occurredAt.toISOString()}>{formatChronicleTime(event.occurredAt)}</time><i className="chronicle-symbol server" aria-hidden="true" /><p>{event.text}</p>{compact ? null : <div className="chronicle-entry-actions"><Link href={`/worlds/${event.worldSlug}`}>{event.world}</Link><Link className="chronicle-permalink" href={`/chronicle/${event.id}`} aria-label={`Open permanent link for ${event.text}`} title="Permanent event link"><Link2 aria-hidden="true" size={15} /></Link></div>}</li>)}</ol>;
}

export function formatChronicleTime(occurredAt: Date) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(occurredAt);
}
