import Link from "next/link";
import type { ChronicleEventView } from "@/lib/world-data";

export function ChronicleFeed({ events, compact = false }: { events: ChronicleEventView[]; compact?: boolean }) {
  if (events.length === 0) return <div className="chronicle-empty"><p>No verified Chronicle events yet.</p><span>The record stays quiet until a source can prove something happened.</span></div>;
  return <ol className={compact ? "chronicle-list" : "chronicle-page-list"}>{events.map((event) => <li id={event.id} key={event.id}><time dateTime={event.occurredAt.toISOString()}>{new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(event.occurredAt)}</time><i className="chronicle-symbol server" aria-hidden="true" /><p>{event.text}</p>{compact ? null : <Link href={`/worlds/${event.worldSlug}`}>{event.world}</Link>}</li>)}</ol>;
}
