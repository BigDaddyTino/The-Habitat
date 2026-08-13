/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { Crown, Gamepad2, Laptop, MailPlus, Radio, ShieldCheck, Smartphone, Sparkles, Users } from "lucide-react";
import { auth } from "@/auth";
import { getPrismaClient } from "@habitat/db/client";
import { MembersLodge } from "@/components/members-lodge";
import { WeeklyInviteCode } from "@/components/weekly-invite-code";
import { progressionForXp } from "@habitat/shared";
import { isPresenceActive } from "@/lib/member-presence";
import { weeklyInviteCode } from "@/lib/weekly-invite-code";
import { avatarBorderClass, titlePlateClass } from "@/lib/reward-presentation";
import { inviteMember } from "./actions";
import { hasRequiredRole } from "@/lib/permissions";
import "./members.css";

export const dynamic = "force-dynamic";

const db = getPrismaClient();
const fallbackAvatar = "/images/avatars/campfire.svg";
const inviteMessages: Record<string, { tone: string; text: string }> = {
  sent: { tone: "success", text: "Invitation set. They have 14 days to enter with that exact Discord email." },
  invalid: { tone: "error", text: "Enter a complete email address—the same one connected to their Discord account." },
  member: { tone: "notice", text: "That email already belongs to an active Habitat member." },
  limit: { tone: "error", text: "The daily invitation limit has been reached. Try again tomorrow." },
};

function lastSeenLabel(lastSeenAt: Date | null, active: boolean) {
  if (active) return "In the lodge now";
  if (!lastSeenAt) return "No lodge activity yet";
  const minutes = Math.max(1, Math.floor((Date.now() - lastSeenAt.getTime()) / 60_000));
  if (minutes < 60) return `Last seen ${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Last seen ${hours}h ago`;
  return `Last seen ${Math.floor(hours / 24)}d ago`;
}

export default async function MembersPage({ searchParams }: { searchParams: Promise<{ invite?: string }> }) {
  const session = await auth();
  const viewerId = session?.user?.id && session.user.isActive ? session.user.id : null;
  const viewerIsMember = Boolean(viewerId);
  const viewerCanInvite = Boolean(viewerId && hasRequiredRole(session?.user?.role, "USER"));
  const memberInviteCode = viewerCanInvite && viewerId && process.env.AUTH_SECRET ? weeklyInviteCode(viewerId, process.env.AUTH_SECRET) : null;
  const { invite } = await searchParams;
  const inviteMessage = invite ? inviteMessages[invite] : null;
  const now = new Date();
  const [members, myInvitations] = await Promise.all([
    db.user.findMany({
      where: { isActive: true },
      select: {
        id: true, name: true, displayName: true, username: true, image: true, avatarBorder: true, role: true, createdAt: true,
        memberPresence: true,
        memberReferralReceived: { select: { method: true, inviter: { select: { name: true, displayName: true, username: true } } } },
        titles: { where: { equipped: true }, include: { title: { select: { name: true, slug: true } } }, take: 1 },
        xpEntries: { select: { amount: true } },
        achievements: { select: { id: true } },
        playerIdentities: { select: { providerKey: true, serverId: true, displayName: true, server: { select: { displayName: true, worldName: true, playerPresence: { where: { present: true }, select: { providerKey: true } } } } } },
      },
      orderBy: [{ role: "desc" }, { createdAt: "asc" }],
    }),
    viewerCanInvite ? db.invitation.findMany({
      where: { invitedByUserId: viewerId!, acceptedAt: null, revokedAt: null, expiresAt: { gt: now } },
      select: { id: true, email: true, expiresAt: true },
      orderBy: { createdAt: "desc" },
      take: 5,
    }) : Promise.resolve([]),
  ]);
  const roster = members.map((member) => {
    const active = Boolean(member.memberPresence && isPresenceActive(member.memberPresence.lastSeenAt, now));
    const currentWorld = member.playerIdentities.find((identity) => identity.server?.playerPresence.some((presence) => presence.providerKey === identity.providerKey));
    const progression = progressionForXp(member.xpEntries.reduce((total, entry) => total + entry.amount, 0));
    return { ...member, active, currentWorld, progression };
  });
  const activeCount = roster.filter((member) => member.active).length;
  const playingCount = roster.filter((member) => member.currentWorld).length;

  return <div className="members-lodge">
    <MembersLodge />
    <section className="members-hero">
      <div className="members-hero-copy">
        <p className="eyebrow"><Sparkles aria-hidden="true" size={13} /> The people behind the legends</p>
        <h1>The Lodge<br /><em>Roster</em></h1>
        <p className="members-deck">Every fire needs its keepers. See who is around, where they have ventured, and the stories they are building across God&apos;s Country.</p>
        <dl className="members-signal-board">
          <div><dt>Members</dt><dd>{roster.length}</dd></div>
          <div><dt>In the lodge</dt><dd>{activeCount}</dd></div>
          <div><dt>In a world</dt><dd>{playingCount}</dd></div>
        </dl>
      </div>
      <div className="members-legend-mark" aria-hidden="true"><img alt="" src="/images/ui/members-legendary-standard.png" /><small>Every world leaves a mark.<br />Every member carries the fire.</small></div>
    </section>

    <main className="members-body">
      <div className="members-section-heading"><div><p className="eyebrow">The company we keep</p><h2>Inside the Habitat</h2></div><span><i /> Live presence refreshes every minute</span></div>
      <section className="member-card-grid" aria-label="Habitat members">
        {roster.map((member, index) => {
          const name = member.displayName ?? member.name ?? "Habitat member";
          const presence = member.memberPresence;
          return <article className={member.active ? "member-roster-card is-active" : "member-roster-card"} key={member.id} style={{ "--card-index": index } as React.CSSProperties}>
            <div className="member-card-rank"><span>{String(index + 1).padStart(2, "0")}</span>{member.role === "ADMIN" ? <Crown aria-label="Administrator" size={15} /> : <ShieldCheck aria-label="Verified member" size={15} />}</div>
            <div className={`member-card-portrait ${avatarBorderClass(member.avatarBorder)}`}><img alt={`${name} avatar`} src={member.image ?? fallbackAvatar} /><span className="member-card-glow" /></div>
            <div className="member-card-copy"><p className="eyebrow">Level {member.progression.level} · {member.role === "ADMIN" ? "Lodge keeper" : "Verified member"}</p><h3>{name}</h3><span className={`habitat-title ${titlePlateClass(member.titles[0]?.title.slug, member.role)}`}><span>{member.titles[0]?.title.name ?? (member.role === "ADMIN" ? "Lodge keeper" : "Habitat member")}</span></span>{member.username ? <span className="member-callsign">@{member.username}</span> : null}</div>
            <div className="member-presence-line"><Radio aria-hidden="true" size={14} /><div><strong>{lastSeenLabel(viewerIsMember ? presence?.lastSeenAt ?? null : null, member.active)}</strong>{member.active && presence ? <span>{viewerIsMember ? `Signed in with ${presence.authProvider} · ${presence.browser} on ${presence.platform}` : "Active in The Habitat"}</span> : <span>Not currently active in the portal</span>}</div>{viewerIsMember && member.active && presence?.deviceType === "Mobile" ? <Smartphone aria-label="Mobile device" size={16} /> : viewerIsMember && member.active ? <Laptop aria-label="Desktop device" size={16} /> : null}</div>
            {member.currentWorld ? <div className="member-now-playing"><Gamepad2 aria-hidden="true" size={15} /><span><small>Now in world</small><strong>{member.currentWorld.server?.worldName ?? member.currentWorld.server?.displayName}</strong></span></div> : <div className="member-now-playing quiet"><Gamepad2 aria-hidden="true" size={15} /><span><small>World signal</small><strong>No verified live game presence</strong></span></div>}
            {viewerIsMember && member.memberReferralReceived ? <p className="member-origin"><Users aria-hidden="true" size={13} /> Brought into the lodge by <strong>{member.memberReferralReceived.inviter.displayName ?? member.memberReferralReceived.inviter.name ?? member.memberReferralReceived.inviter.username ?? "a Habitat member"}</strong> · {member.memberReferralReceived.method === "CODE" ? "weekly code" : "email invitation"}</p> : null}
            <div className="member-card-footer"><span>{member.achievements.length} achievements · {member.progression.totalXp.toLocaleString()} XP</span>{member.username ? <Link href={`/members/${member.username}`}>Open dossier <span aria-hidden="true">→</span></Link> : <span>Profile pending</span>}</div>
          </article>;
        })}
      </section>

      <section className="member-invite-panel" id="invite">
        <div className="invite-seal"><MailPlus aria-hidden="true" size={30} /><span>Pass the<br />torch</span></div>
        <div className="invite-copy"><p className="eyebrow">Trusted members can grow the circle</p><h2>Bring someone into the lodge.</h2><p>Enter the exact email tied to their Discord account. Their invitation grants standard member access for 14 days; Discord verifies the person at the door.</p></div>
        {viewerCanInvite ? <div className="invite-console">
          {memberInviteCode ? <WeeklyInviteCode code={memberInviteCode} /> : null}
          <div className="invite-method-divider"><span>or invite by Discord email</span></div>
          <form action={inviteMember}><label htmlFor="member-email">Discord account email</label><div><input autoComplete="email" id="member-email" name="email" placeholder="friend@example.com" required type="email" /><button type="submit">Send invitation <span aria-hidden="true">→</span></button></div></form>
          {inviteMessage ? <p className={`invite-result ${inviteMessage.tone}`} role="status">{inviteMessage.text}</p> : null}
          {myInvitations.length ? <div className="pending-invites"><span>Awaiting arrival</span>{myInvitations.map((invitation) => <p key={invitation.id}><strong>{invitation.email}</strong><small>expires {invitation.expiresAt.toLocaleDateString("en-US", { month: "short", day: "numeric" })}</small></p>)}</div> : null}
        </div> : <div className="invite-console invite-locked"><ShieldCheck aria-hidden="true" size={20} /><p>Invitations are entrusted to members with standard or administrator access.</p>{viewerIsMember ? null : <Link href="/sign-in">Member sign in <span aria-hidden="true">→</span></Link>}</div>}
      </section>
      <p className="presence-footnote">Portal activity is reported only while an authenticated Habitat page is visible. Device details are visible only to members. Game presence appears only from verified Habitat server telemetry; external services are never guessed.</p>
    </main>
  </div>;
}
