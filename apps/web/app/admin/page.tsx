import {
  Activity,
  ArrowUpRight,
  ClipboardCheck,
  Flame,
  Map,
  Radio,
  ScrollText,
  Users,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { getPrismaClient } from "@habitat/db/client";
import { requireRole } from "@/lib/authorization";

export const dynamic = "force-dynamic";

const db = getPrismaClient();

export default async function AdminPage() {
  const user = await requireRole("ADMIN");
  const now = new Date();
  const presenceCutoff = new Date(now.getTime() - 2 * 60 * 1000);
  const [memberCount, onlineCount, invitations, claims, wakeRequests, activePolls, attentionWorlds, recentAudits, pulseSignals] = await Promise.all([
    db.user.count({ where: { isActive: true } }),
    db.memberPresence.count({ where: { lastSeenAt: { gte: presenceCutoff }, user: { isActive: true } } }),
    db.invitation.count({ where: { acceptedAt: null, revokedAt: null, expiresAt: { gt: now } } }),
    db.playerIdentityClaim.count({ where: { status: "PENDING" } }),
    db.wakeRequest.count({ where: { status: "PENDING" } }),
    db.serverPoll.count({ where: { status: "ACTIVE", closesAt: { gt: now } } }),
    db.gameServer.findMany({ where: { enabled: true, actualState: { in: ["DOWN_UNEXPECTEDLY", "UNKNOWN"] } }, select: { id: true, displayName: true, actualState: true }, orderBy: { displayName: "asc" } }),
    db.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 8, select: { id: true, action: true, entityType: true, createdAt: true, actor: { select: { displayName: true, name: true, email: true } } } }),
    db.pulseSignal.findMany({ select: { status: true } }),
  ]);
  const reviewCount = invitations + claims + wakeRequests;
  // The card reports only what has actually been evaluated; an installation whose
  // worker has never run says so rather than claiming everything is well.
  const failingSignals = pulseSignals.filter((signal) => signal.status === "CRITICAL" || signal.status === "WARN").length;
  const pulseSignal = pulseSignals.length === 0 ? "Never evaluated" : failingSignals === 0 ? `${pulseSignals.length} signals healthy` : `${failingSignals} of ${pulseSignals.length} signals need attention`;
  const pulseTone: "brass" | "moss" | "ember" = pulseSignals.length === 0 ? "brass" : failingSignals === 0 ? "moss" : "ember";

  return <section className="admin-page admin-overview-page">
    <header className="admin-overview-hero">
      <div><p className="eyebrow">Administrator command deck</p><h1>The lodge,<br /><em>under watch.</em></h1><p>Welcome back, {user.name ?? "keeper"}. Identity, community, and world operations are separated into clear stations. Every control remains authenticated and audit logged.</p></div>
      <div className="admin-command-reliquary" aria-hidden="true"><Image alt="" height={1402} priority src="/images/ui/admin-command-reliquary.png" width={1122} /><span>Authenticated controls<br />Permanent audit trail</span></div>
    </header>

    <div className="admin-overview-metrics">
      <Link href="/admin/members"><Users aria-hidden="true" size={18} /><span>Active members</span><strong>{memberCount}</strong><small>{onlineCount} in the lodge now</small></Link>
      <Link href="/admin/members"><ClipboardCheck aria-hidden="true" size={18} /><span>Items for review</span><strong>{reviewCount}</strong><small>{invitations} invites · {claims} claims · {wakeRequests} wake</small></Link>
      <Link className={attentionWorlds.length ? "attention" : ""} href="/admin/operations"><Activity aria-hidden="true" size={18} /><span>Worlds requiring attention</span><strong>{attentionWorlds.length}</strong><small>{attentionWorlds.length ? attentionWorlds.map((world) => world.displayName).join(", ") : "No unexpected or unknown state"}</small></Link>
      <Link href="/admin/community"><Flame aria-hidden="true" size={18} /><span>Active game-night poll</span><strong>{activePolls}</strong><small>{activePolls ? "Community voting is open" : "No poll currently open"}</small></Link>
    </div>

    <div className="admin-command-grid">
      <CommandStation eyebrow="People & identity" href="/admin/members" icon={Users} title="Member command" copy="Roles, access status, session control, invitations, and the complete referral trail." signal={`${memberCount} active · ${onlineCount} online`} />
      <CommandStation eyebrow="Hosted worlds" href="/admin/operations" icon={Radio} title="World operations" copy="Observe real agent telemetry and dispatch only allow-listed lifecycle controls." signal={attentionWorlds.length ? `${attentionWorlds.length} need attention` : "No critical signals"} tone={attentionWorlds.length ? "ember" : "moss"} />
      <CommandStation eyebrow="Registry" href="/admin/servers" icon={Map} title="World registry" copy="Maintain public world labels and explicit control eligibility without exposing infrastructure." signal="Configuration station" />
      <CommandStation eyebrow="Community" href="/admin/community" icon={Flame} title="The gathering" copy="Review wake requests and run the single, deliberate game-night ballot." signal={`${wakeRequests} wake requests · ${activePolls} polls`} />
      <CommandStation eyebrow="Observability" href="/admin/pulse" icon={Activity} title="Habitat Pulse" copy="Tunnel, process freshness, collectors, backups, ingestion and the reward pipeline, each evaluated and dated." signal={pulseSignal} tone={pulseTone} />
    </div>

    <section className="admin-audit-panel">
      <div className="admin-section-title"><div><p className="eyebrow">Accountability</p><h2>Recent audit signal</h2></div><ScrollText aria-hidden="true" size={22} /></div>
      {recentAudits.length ? <ol>{recentAudits.map((audit) => <li key={audit.id}><span className="admin-audit-pulse" /><div><strong>{formatAction(audit.action)}</strong><span>{audit.actor?.displayName ?? audit.actor?.name ?? audit.actor?.email ?? "System"} · {audit.entityType}</span></div><time dateTime={audit.createdAt.toISOString()}>{audit.createdAt.toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</time></li>)}</ol> : <p className="admin-ledger-empty">No administrative writes have been recorded yet.</p>}
    </section>
  </section>;
}

function CommandStation({ copy, eyebrow, href, icon: Icon, signal, title, tone = "brass" }: { copy: string; eyebrow: string; href: string; icon: typeof Users; signal: string; title: string; tone?: "brass" | "moss" | "ember" }) {
  return <Link className={`admin-command-card ${tone}`} href={href}><div><span className="admin-command-icon"><Icon aria-hidden="true" size={20} /></span><p className="eyebrow">{eyebrow}</p></div><h2>{title}</h2><p>{copy}</p><footer><span>{signal}</span><strong>Enter station <ArrowUpRight aria-hidden="true" size={14} /></strong></footer></Link>;
}

function formatAction(action: string) {
  return action.replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
}
