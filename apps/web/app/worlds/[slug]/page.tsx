import { notFound } from "next/navigation";
import { Activity, Gauge, History, Radar, Signal, Trophy, UsersRound } from "lucide-react";
import { StatusBadge } from "@/components/status-badge";
import { chronicleEventLabels, getWorldBySlug } from "@/lib/world-data";
import { getPendingWakeRequest } from "@/lib/community-data";
import { auth } from "@/auth";
import { getPrismaClient } from "@habitat/db/client";
import { requestWake } from "./actions";

const db = getPrismaClient();

function when(value: Date) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(value);
}

function bytes(value: bigint | null | undefined) {
  if (value === null || value === undefined) return "Not recorded";
  const amount = Number(value);
  if (amount < 1_024 * 1_024 * 1_024) return `${Math.round(amount / (1_024 * 1_024))} MB`;
  return `${(amount / (1_024 * 1_024 * 1_024)).toFixed(1)} GB`;
}

export default async function WorldDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const world = await getWorldBySlug(slug);
  if (!world) notFound();
  const session = await auth();
  const canRequestWake = Boolean(session?.user?.id && session.user.isActive && (session.user.role === "USER" || session.user.role === "ADMIN"));
  const wakeRequest = world.state === "SLEEPING" ? await getPendingWakeRequest(world.id, session?.user?.id) : null;
  const [metrics, recentEvents, verifiedRoster, presentPlayers, achievementCount] = await Promise.all([
    db.serverMetricSample.findMany({ where: { serverId: world.id }, orderBy: { observedAt: "desc" }, take: 48 }),
    db.serverEvent.findMany({ where: { serverId: world.id }, orderBy: [{ occurredAt: "desc" }, { id: "desc" }], take: 8, select: { id: true, occurredAt: true, eventType: true, actorText: true, valueText: true } }),
    db.playerIdentity.findMany({ where: { serverId: world.id, userId: { not: null }, verifiedAt: { not: null } }, orderBy: { updatedAt: "desc" }, take: 12, select: { id: true, displayName: true, user: { select: { username: true, displayName: true, name: true } }, _count: { select: { events: { where: { eventType: "PLAYER_JOINED" } }, legacyEvidence: true } } } }),
    db.serverPlayerPresence.count({ where: { serverId: world.id, present: true } }),
    db.serverEvent.count({ where: { serverId: world.id, eventType: "ACHIEVEMENT_EARNED" } }),
  ]);
  const latestMetric = metrics[0];
  const peakPlayers = metrics.reduce<number | null>((peak, metric) => metric.playerCount === null ? peak : Math.max(peak ?? 0, metric.playerCount), null);
  const pings = metrics.flatMap((metric) => metric.pingMs === null ? [] : [metric.pingMs]);
  const averagePing = pings.length ? Math.round(pings.reduce((sum, value) => sum + value, 0) / pings.length) : null;
  return <section className={`page-shell world-detail accent-${world.accent}`}><div className="detail-hero"><p className="eyebrow">{world.game} · server dossier</p><h1>{world.worldName}</h1><p>{world.description}</p><StatusBadge state={world.state} /></div><div className="detail-grid"><article><Activity aria-hidden="true" /><h2>Current state</h2><p>{world.state === "SLEEPING" ? "This world is intentionally resting. It is not counted as an outage." : world.state === "UNKNOWN" ? "No agent telemetry has been recorded yet." : "State is reported by the private Habitat agent."}</p></article><article><UsersRound aria-hidden="true" /><h2>Population</h2><p>{world.players === null ? "No live count recorded" : `${world.players} of ${world.capacity ?? "-"} seats are observed`}</p></article><article><Gauge aria-hidden="true" /><h2>Version</h2><p>{world.version ?? "Not reported"}</p></article><article><Radar aria-hidden="true" /><h2>Adapter posture</h2><p>{world.capabilityNote}</p></article></div>{world.state === "SLEEPING" ? <section className="wake-panel"><div><p className="eyebrow">Community request</p><h2>Light the Fire</h2><p>{wakeRequest ? `${wakeRequest._count.votes} Habitat member${wakeRequest._count.votes === 1 ? " wants" : "s want"} this world awake.` : "Ask an administrator to review a wake request. This never starts the server automatically."}</p></div>{canRequestWake ? <form action={requestWake}><input name="serverId" type="hidden" value={world.id} /><button className="wake-button" type="submit">Light the Fire</button></form> : <p className="wake-sign-in">Sign in as a Habitat member to support this request.</p>}</section> : null}<section className="dossier-section"><div className="panel-heading"><div><p className="eyebrow">Observed by the lodge</p><h2>Field telemetry</h2></div><span className="dossier-as-of">{latestMetric ? `Last sample ${when(latestMetric.observedAt)}` : "Awaiting first metric sample"}</span></div><div className="dossier-grid"><article><Signal aria-hidden="true" /><small>Peak, recent window</small><strong>{peakPlayers ?? "—"}</strong><p>{metrics.length ? `${metrics.length} retained telemetry samples` : "No observed population samples yet."}</p></article><article><UsersRound aria-hidden="true" /><small>Currently identified</small><strong>{presentPlayers || "—"}</strong><p>{presentPlayers ? "Observed by a player-name-capable adapter." : "No named players currently observed."}</p></article><article><Gauge aria-hidden="true" /><small>Average ping</small><strong>{averagePing === null ? "—" : `${averagePing} ms`}</strong><p>{averagePing === null ? "This adapter has not reported ping." : "Recent observed query samples."}</p></article><article><Activity aria-hidden="true" /><small>Latest memory</small><strong>{bytes(latestMetric?.processMemoryBytes)}</strong><p>{latestMetric ? `Disk free: ${bytes(latestMetric.diskFreeBytes)}` : "Process telemetry will appear after a sample."}</p></article></div></section><section className="dossier-columns"><article className="dossier-panel"><div className="panel-heading"><div><p className="eyebrow">Verified only</p><h2>Server roster</h2></div><Trophy aria-hidden="true" /></div>{verifiedRoster.length ? <ul className="dossier-roster">{verifiedRoster.map((identity) => <li key={identity.id}><div><strong>{identity.user?.displayName ?? identity.user?.name ?? identity.displayName}</strong><span>{identity._count.events} verified visit{identity._count.events === 1 ? "" : "s"} · {identity._count.legacyEvidence} recovered record{identity._count.legacyEvidence === 1 ? "" : "s"}</span></div>{identity.user?.username ? <a href={`/members/${identity.user.username}`}>Profile</a> : null}</li>)}</ul> : <p className="dossier-empty">No linked, verified player identities are recorded for this server yet.</p>}</article><article className="dossier-panel"><div className="panel-heading"><div><p className="eyebrow">The Chronicle</p><h2>Recent signals</h2></div><History aria-hidden="true" /></div>{recentEvents.length ? <ul className="dossier-events">{recentEvents.map((event) => <li key={event.id}><time>{when(event.occurredAt)}</time><div><strong>{chronicleEventLabels[event.eventType as keyof typeof chronicleEventLabels] ?? "Verified server event"}</strong><span>{event.actorText ? `${event.actorText}${event.valueText ? ` · ${event.valueText}` : ""}` : event.valueText ?? "Verified server event"}</span></div></li>)}</ul> : <p className="dossier-empty">No Chronicle events have been verified for this server yet.</p>}</article></section><p className="dossier-footnote">{achievementCount} server-earned achievement {achievementCount === 1 ? "entry" : "entries"} recorded. Every figure on this dossier comes from the private agent, a verified identity, or the Chronicle—never a placeholder.</p></section>;
}
