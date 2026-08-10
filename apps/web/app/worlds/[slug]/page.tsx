import { notFound } from "next/navigation";
import { Activity, Gauge, History, Radar, UsersRound } from "lucide-react";
import { StatusBadge } from "@/components/status-badge";
import { getWorldBySlug } from "@/lib/world-data";
import { getPendingWakeRequest } from "@/lib/community-data";
import { auth } from "@/auth";
import { requestWake } from "./actions";

export default async function WorldDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const world = await getWorldBySlug(slug);
  if (!world) notFound();
  const session = await auth();
  const canRequestWake = Boolean(session?.user?.id && session.user.isActive && (session.user.role === "USER" || session.user.role === "ADMIN"));
  const wakeRequest = world.state === "SLEEPING" ? await getPendingWakeRequest(world.id, session?.user?.id) : null;
  return <section className={`page-shell world-detail accent-${world.accent}`}><div className="detail-hero"><p className="eyebrow">{world.game}</p><h1>{world.worldName}</h1><p>{world.description}</p><StatusBadge state={world.state} /></div><div className="detail-grid"><article><Activity aria-hidden="true" /><h2>Current state</h2><p>{world.state === "SLEEPING" ? "This world is intentionally resting. It is not counted as an outage." : world.state === "UNKNOWN" ? "No agent telemetry has been recorded yet." : "The registry will show verified adapter state here."}</p></article><article><UsersRound aria-hidden="true" /><h2>Population</h2><p>{world.players === null ? "No live count recorded" : `${world.players} of ${world.capacity ?? "-"} seats are claimed`}</p></article><article><Gauge aria-hidden="true" /><h2>Version</h2><p>{world.version ?? "Not reported"}</p></article><article><Radar aria-hidden="true" /><h2>Adapter posture</h2><p>{world.capabilityNote}</p></article></div>{world.state === "SLEEPING" ? <section className="wake-panel"><div><p className="eyebrow">Community request</p><h2>Light the Fire</h2><p>{wakeRequest ? `${wakeRequest._count.votes} Habitat member${wakeRequest._count.votes === 1 ? " wants" : "s want"} this world awake.` : "Ask an administrator to review a wake request. This never starts the server automatically."}</p></div>{canRequestWake ? <form action={requestWake}><input name="serverId" type="hidden" value={world.id} /><button className="wake-button" type="submit">Light the Fire</button></form> : <p className="wake-sign-in">Sign in as a Habitat member to support this request.</p>}</section> : null}<div className="empty-data"><History aria-hidden="true" /><div><p className="eyebrow">History begins soon</p><h2>No invented stats.</h2><p>Session data, Chronicle events, and records appear here only once they are verified by a game adapter.</p></div></div></section>;
}
