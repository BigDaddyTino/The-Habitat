import Link from "next/link";
import { Link2 } from "lucide-react";
import type { ChronicleEventView } from "@/lib/world-data";

// Chronicle text is generated from fixed templates in lib/world-data.ts (chronicleText),
// so every event type maps deterministically onto a semantic symbol color:
// RECORD_BROKEN -> record (teal), ACHIEVEMENT_EARNED -> achievement (brass),
// PLAYER_JOINED -> join (moss), SERVER_CRASHED -> death (red),
// everything else (server lifecycle, wake, save, player left, fallback) -> server (violet).
const chronicleSymbolRules: Array<[RegExp, string]> = [
  [/ set a new record: /, "record"],
  [/ earned /, "achievement"],
  [/ defeated|a boss /, "achievement"],
  [/ players gathered /, "join"],
  [/ joined /, "join"],
  [/ stopped unexpectedly\.$/, "death"],
];

function chronicleSymbolClass(text: string) {
  for (const [pattern, kind] of chronicleSymbolRules) if (pattern.test(text)) return kind;
  return "server";
}

export function ChronicleFeed({ events, compact = false }: { events: ChronicleEventView[]; compact?: boolean }) {
  if (events.length === 0) return <div className="chronicle-empty"><p>No verified Chronicle events yet.</p><span>The record stays quiet until a source can prove something happened.</span></div>;
  return <ol className={compact ? "chronicle-list" : "chronicle-page-list"}>{events.map((event) => <li id={event.id} key={event.id}><time dateTime={event.occurredAt.toISOString()}>{formatFeedTime(event.occurredAt, compact)}</time><i className={`chronicle-symbol ${chronicleSymbolClass(event.text)}`} aria-hidden="true" /><p>{event.text}</p>{compact ? null : <div className="chronicle-entry-actions"><Link href={event.sourceHref}>{event.world}</Link><Link className="chronicle-permalink" href={event.permalinkHref} aria-label={`Open permanent link for ${event.text}`} title="Permanent event link"><Link2 aria-hidden="true" size={15} /></Link></div>}</li>)}</ol>;
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
