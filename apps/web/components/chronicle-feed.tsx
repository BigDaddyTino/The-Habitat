import Link from "next/link";
import { Link2 } from "lucide-react";
import type { ChronicleEventView } from "@/lib/world-data";

export function ChronicleFeed({ events, compact = false }: { events: ChronicleEventView[]; compact?: boolean }) {
  if (events.length === 0) return <div className="chronicle-empty"><p>No verified Chronicle events yet.</p><span>The record stays quiet until a source can prove something happened.</span></div>;
  return <ol className={compact ? "chronicle-list" : "chronicle-page-list"}>{events.map((event) => <li id={event.id} key={event.id}><time dateTime={event.occurredAt.toISOString()}>{formatFeedTime(event.occurredAt, compact)}</time><i className={`chronicle-symbol ${event.kind}`} aria-hidden="true" /><p>{event.text}</p>{compact ? null : <div className="chronicle-entry-actions"><Link href={event.sourceHref}>{event.world}</Link><Link className="chronicle-permalink" href={event.permalinkHref} aria-label={`Open permanent link for ${event.text}`} title="Permanent event link"><Link2 aria-hidden="true" size={15} /></Link></div>}</li>)}</ol>;
}

function formatFeedTime(occurredAt: Date, compact: boolean) {
  const date = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(occurredAt);
  const time = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit", hour12: true }).format(occurredAt).toLowerCase().replace(" am", "a").replace(" pm", "p");
  if (compact) return occurredAt.toDateString() === new Date().toDateString() ? time : date;
  return `${date} ${time}`;
}

export function formatChronicleTime(occurredAt: Date) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(occurredAt);
}
