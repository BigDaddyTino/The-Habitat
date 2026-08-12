/* eslint-disable @next/next/no-img-element */
import {
  Ban,
  Clock3,
  Crown,
  KeyRound,
  Mail,
  Radio,
  RotateCcw,
  Search,
  ShieldCheck,
  UserCheck,
  Users,
} from "lucide-react";
import Link from "next/link";
import { getPrismaClient } from "@habitat/db/client";
import { isPresenceActive } from "@/lib/member-presence";
import { requireRole } from "@/lib/authorization";
import { revokeInvitation, revokeMemberSessions, setMemberActive, updateMemberRole } from "./actions";

export const dynamic = "force-dynamic";

const db = getPrismaClient();
const messages: Record<string, string> = {
  "role-updated": "Member access level updated and recorded in the audit ledger.",
  "member-reactivated": "Member access restored.",
  "member-suspended": "Member suspended and all active sessions revoked.",
  "sessions-revoked": "All active sessions for that member were revoked.",
  "invitation-revoked": "Invitation revoked. It can no longer be used to join.",
};
const errors: Record<string, string> = {
  "invalid-member": "That member reference was invalid.",
  "invalid-role": "Choose a valid access level.",
  "not-found": "That member no longer exists.",
  "last-admin": "The last active administrator cannot be demoted or suspended.",
  "self-protected": "Your own access is protected on this screen. Have another administrator make that change.",
  "invalid-invitation": "That invitation reference was invalid.",
  "invitation-unavailable": "That invitation was already accepted or revoked.",
};

type MemberFilter = "all" | "online" | "admins" | "suspended";

export default async function AdminMembersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; notice?: string; error?: string }>;
}) {
  const actor = await requireRole("ADMIN");
  const parameters = await searchParams;
  const query = parameters.q?.trim().slice(0, 80) ?? "";
  const filter: MemberFilter = ["online", "admins", "suspended"].includes(parameters.status ?? "")
    ? parameters.status as MemberFilter
    : "all";
  const now = new Date();
  const [allMembers, pendingInvitations, recentReferrals] = await Promise.all([
    db.user.findMany({
      where: query ? {
        OR: ["name", "displayName", "username", "email"].map((field) => ({ [field]: { contains: query, mode: "insensitive" as const } })),
      } : undefined,
      select: {
        id: true,
        name: true,
        displayName: true,
        username: true,
        email: true,
        image: true,
        role: true,
        isActive: true,
        createdAt: true,
        memberPresence: true,
        sessions: { where: { expires: { gt: now } }, select: { id: true, expires: true } },
        accounts: { select: { provider: true } },
        memberReferralReceived: {
          select: { method: true, createdAt: true, inviter: { select: { displayName: true, name: true, username: true } } },
        },
        playerIdentities: {
          select: {
            providerKey: true,
            server: {
              select: {
                displayName: true,
                worldName: true,
                playerPresence: { where: { present: true }, select: { providerKey: true } },
              },
            },
          },
        },
        _count: { select: { invitationsSent: true, memberReferralsSent: true, playerIdentities: true } },
      },
      orderBy: [{ isActive: "desc" }, { role: "desc" }, { createdAt: "asc" }],
    }),
    db.invitation.findMany({
      where: { acceptedAt: null, revokedAt: null, expiresAt: { gt: now } },
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
        expiresAt: true,
        invitedBy: { select: { displayName: true, name: true, username: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    db.memberReferral.findMany({
      select: {
        id: true,
        method: true,
        codeWeek: true,
        createdAt: true,
        inviter: { select: { displayName: true, name: true, username: true } },
        invitedUser: { select: { displayName: true, name: true, username: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 12,
    }),
  ]);

  const decorated = allMembers.map((member) => {
    const online = Boolean(member.memberPresence && isPresenceActive(member.memberPresence.lastSeenAt, now));
    const currentIdentity = member.playerIdentities.find((identity) => identity.server?.playerPresence.some((presence) => presence.providerKey === identity.providerKey));
    return { ...member, online, currentWorld: currentIdentity?.server ?? null };
  });
  const totals = {
    members: decorated.filter((member) => member.isActive).length,
    online: decorated.filter((member) => member.isActive && member.online).length,
    admins: decorated.filter((member) => member.isActive && member.role === "ADMIN").length,
    suspended: decorated.filter((member) => !member.isActive).length,
  };
  const members = decorated.filter((member) => {
    if (filter === "online") return member.isActive && member.online;
    if (filter === "admins") return member.isActive && member.role === "ADMIN";
    if (filter === "suspended") return !member.isActive;
    return true;
  });
  const notice = parameters.notice ? messages[parameters.notice] : null;
  const error = parameters.error ? errors[parameters.error] : null;

  return <section className="admin-page admin-members-page">
    <header className="admin-page-heading">
      <div><p className="eyebrow">People &amp; permissions</p><h1>Member command</h1><p>Manage clubhouse access without erasing its history. Role changes, suspensions, session revocations, and invitation revocations are written to the audit ledger.</p></div>
      <div className="admin-heading-mark" aria-hidden="true"><Users size={31} /><span>Identity<br />control</span></div>
    </header>

    {notice ? <p className="admin-flash success" role="status"><UserCheck aria-hidden="true" size={16} />{notice}</p> : null}
    {error ? <p className="admin-flash error" role="alert"><Ban aria-hidden="true" size={16} />{error}</p> : null}

    <div className="admin-stat-grid" aria-label="Member summary">
      <Metric href="/admin/members" icon={Users} label="Active members" selected={filter === "all"} value={totals.members} />
      <Metric href="/admin/members?status=online" icon={Radio} label="In the lodge" selected={filter === "online"} value={totals.online} />
      <Metric href="/admin/members?status=admins" icon={Crown} label="Administrators" selected={filter === "admins"} value={totals.admins} />
      <Metric href="/admin/members?status=suspended" icon={Ban} label="Suspended" selected={filter === "suspended"} value={totals.suspended} />
    </div>

    <form action="/admin/members" className="admin-member-search">
      {filter !== "all" ? <input name="status" type="hidden" value={filter} /> : null}
      <Search aria-hidden="true" size={17} />
      <label htmlFor="member-search">Find a member</label>
      <input defaultValue={query} id="member-search" name="q" placeholder="Name, callsign, or email" />
      <button type="submit">Search roster</button>
      {query ? <Link href={filter === "all" ? "/admin/members" : `/admin/members?status=${filter}`}>Clear</Link> : null}
    </form>

    <div className="admin-section-title"><div><p className="eyebrow">Access roster</p><h2>{filter === "all" ? "Every account" : `${labelForFilter(filter)} accounts`}</h2></div><span>{members.length} shown</span></div>
    {members.length ? <div className="admin-member-list">{members.map((member) => {
      const displayName = member.displayName ?? member.name ?? member.username ?? "Habitat member";
      const isSelf = member.id === actor.id;
      const origin = member.memberReferralReceived;
      return <article className={`admin-member-row${member.isActive ? "" : " suspended"}`} id={`member-${member.id}`} key={member.id}>
        <div className="admin-member-identity">
          <div className="admin-member-avatar">{member.image ? <img alt="" src={member.image} /> : <span>{initials(displayName)}</span>}<i className={member.online && member.isActive ? "online" : ""} /></div>
          <div><div className="admin-member-name"><h3>{displayName}</h3>{isSelf ? <small>You</small> : null}{member.role === "ADMIN" ? <Crown aria-label="Administrator" size={14} /> : null}</div><p>{member.email ?? "No provider email"}</p><span>{member.username ? `@${member.username}` : "Profile callsign pending"}</span></div>
        </div>
        <div className="admin-member-signal">
          <strong><i className={member.online && member.isActive ? "online" : ""} />{member.isActive ? member.online ? "Portal active" : "Portal quiet" : "Access suspended"}</strong>
          <span>{member.currentWorld ? `In ${member.currentWorld.worldName}` : member.memberPresence ? `${member.memberPresence.browser} on ${member.memberPresence.platform}` : "No portal signal recorded"}</span>
          <small>{member.sessions.length} active session{member.sessions.length === 1 ? "" : "s"} · {providerLabel(member.accounts.map((account) => account.provider))}</small>
        </div>
        <dl className="admin-member-lineage">
          <div><dt>Joined</dt><dd>{member.createdAt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</dd></div>
          <div><dt>Invited by</dt><dd>{origin ? `${personName(origin.inviter)} · ${origin.method.toLowerCase()}` : "Founding / untracked"}</dd></div>
          <div><dt>Invites</dt><dd>{member._count.memberReferralsSent} joined · {member._count.invitationsSent} issued</dd></div>
        </dl>
        <div className="admin-member-controls">
          <form action={updateMemberRole}><input name="memberId" type="hidden" value={member.id} /><label>Access level<select defaultValue={member.role} disabled={isSelf} name="role"><option value="VIEWER">Viewer</option><option value="USER">Member</option><option value="ADMIN">Administrator</option></select></label><button disabled={isSelf} type="submit">Save role</button></form>
          <div className="admin-member-actions">
            {member.username ? <Link href={`/members/${member.username}`}>Open profile</Link> : <span>Profile pending</span>}
            <form action={revokeMemberSessions}><input name="memberId" type="hidden" value={member.id} /><button disabled={isSelf || member.sessions.length === 0} title="Sign this member out of every browser" type="submit"><KeyRound aria-hidden="true" size={14} /> Revoke sessions</button></form>
            <form action={setMemberActive}><input name="memberId" type="hidden" value={member.id} /><input name="active" type="hidden" value={member.isActive ? "false" : "true"} /><button className={member.isActive ? "danger" : "restore"} disabled={isSelf} type="submit">{member.isActive ? <Ban aria-hidden="true" size={14} /> : <RotateCcw aria-hidden="true" size={14} />}{member.isActive ? "Suspend" : "Reactivate"}</button></form>
          </div>
        </div>
      </article>;
    })}</div> : <div className="admin-empty"><Search aria-hidden="true" size={22} /><div><h3>No matching accounts.</h3><p>Change the filter or clear the search to return to the full roster.</p></div></div>}

    <div className="admin-ledger-grid">
      <section className="admin-ledger-panel"><div className="admin-section-title"><div><p className="eyebrow">Open invitations</p><h2>Awaiting arrival</h2></div><Mail aria-hidden="true" size={20} /></div>{pendingInvitations.length ? <ol>{pendingInvitations.map((invitation) => <li key={invitation.id}><div><strong>{invitation.email}</strong><span>Invited by {personName(invitation.invitedBy)} · expires {invitation.expiresAt.toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span></div><form action={revokeInvitation}><input name="invitationId" type="hidden" value={invitation.id} /><button type="submit">Revoke</button></form></li>)}</ol> : <p className="admin-ledger-empty">No active email invitations are waiting.</p>}</section>
      <section className="admin-ledger-panel"><div className="admin-section-title"><div><p className="eyebrow">Referral trail</p><h2>Who brought whom</h2></div><ShieldCheck aria-hidden="true" size={20} /></div>{recentReferrals.length ? <ol>{recentReferrals.map((referral) => <li key={referral.id}><div><strong>{personName(referral.invitedUser)}</strong><span>Invited by {personName(referral.inviter)} · {referral.method === "CODE" ? `weekly code${referral.codeWeek ? ` ${referral.codeWeek}` : ""}` : "email invitation"}</span></div><time dateTime={referral.createdAt.toISOString()}>{referral.createdAt.toLocaleDateString("en-US", { month: "short", day: "numeric" })}</time></li>)}</ol> : <p className="admin-ledger-empty">Referral history begins when the next invited member joins.</p>}</section>
    </div>
    <p className="admin-safety-note"><Clock3 aria-hidden="true" size={14} /> Suspensions revoke database sessions immediately. Access history and referral lineage remain intact for accountability.</p>
  </section>;
}

function Metric({ href, icon: Icon, label, selected, value }: { href: string; icon: typeof Users; label: string; selected: boolean; value: number }) {
  return <Link className={selected ? "selected" : ""} href={href}><Icon aria-hidden="true" size={18} /><span>{label}</span><strong>{value}</strong></Link>;
}

function initials(name: string) {
  return name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
}

function personName(person: { displayName: string | null; name: string | null; username: string | null } | null) {
  return person?.displayName ?? person?.name ?? person?.username ?? "Habitat member";
}

function providerLabel(providers: string[]) {
  const unique = [...new Set(providers.map((provider) => provider[0]?.toUpperCase() + provider.slice(1)))];
  return unique.length ? unique.join(" + ") : "No linked sign-in";
}

function labelForFilter(filter: MemberFilter) {
  if (filter === "online") return "Online";
  if (filter === "admins") return "Administrator";
  if (filter === "suspended") return "Suspended";
  return "All";
}
