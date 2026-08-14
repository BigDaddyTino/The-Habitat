import Link from "next/link";
import { Check, FileSearch, History, RotateCcw, ShieldCheck, X } from "lucide-react";
import { getPrismaClient } from "@habitat/db/client";
import { detectClaimConflicts, hasBlockingConflict, previewOwnershipChange, requiresTypedConfirmation } from "@habitat/identity";
import { requireRole } from "@/lib/authorization";
import { approvalConfirmationPhrase, claimCenterErrors, claimCenterNotices, formatGame, formatMemberName, formatTimestamp } from "@/lib/claim-center";
import { resolveIdentityClaim } from "./actions";
import { ClaimImpactPanel, ConflictList } from "./claim-impact-panel";
import "./claims.css";

export const dynamic = "force-dynamic";

/** Previews are measured per claim, so the queue is bounded rather than unbounded. */
const previewLimit = 20;
const ledgerLimit = 15;

const db = getPrismaClient();

export default async function AdminClaimsPage({ searchParams }: { searchParams: Promise<{ notice?: string; error?: string }> }) {
  await requireRole("ADMIN");
  const { notice, error } = await searchParams;

  const [claims, pendingTotal, ledger, counts] = await Promise.all([
    db.playerIdentityClaim.findMany({
      where: { status: "PENDING" },
      include: { user: { select: { id: true, name: true, username: true, displayName: true, email: true } }, playerIdentity: { include: { server: { select: { displayName: true, worldName: true } } } } },
      orderBy: { requestedAt: "asc" },
      take: previewLimit,
    }),
    db.playerIdentityClaim.count({ where: { status: "PENDING" } }),
    db.identityOwnershipTransaction.findMany({
      include: { playerIdentity: { select: { id: true, displayName: true, gameType: true } }, toUser: { select: { name: true, username: true, displayName: true, email: true } }, fromUser: { select: { name: true, username: true, displayName: true, email: true } }, actor: { select: { name: true, username: true, displayName: true, email: true } } },
      orderBy: { createdAt: "desc" },
      take: ledgerLimit,
    }),
    Promise.all([
      db.playerIdentity.count({ where: { userId: { not: null } } }),
      db.playerIdentity.count({ where: { userId: null } }),
      db.identityOwnershipTransaction.count({ where: { action: "GRANT", status: "APPLIED" } }),
      db.identityRewardReconciliation.count({ where: { completedAt: null } }),
    ]),
  ]);

  const [ownedIdentities, unclaimedIdentities, reversibleGrants, queuedReconciliations] = counts;
  const reviews = await Promise.all(claims.map(async (claim) => {
    const [impact, conflicts] = await Promise.all([
      previewOwnershipChange(db, { playerIdentityId: claim.playerIdentityId, userId: claim.userId, direction: "GRANT" }),
      detectClaimConflicts(db, { playerIdentityId: claim.playerIdentityId, userId: claim.userId }),
    ]);
    return { claim, impact, conflicts, blocked: hasBlockingConflict(conflicts), needsConfirmation: requiresTypedConfirmation(conflicts) };
  }));

  return <section className="admin-page">
    <header className="admin-page-heading">
      <div>
        <p className="eyebrow">Habitat administration</p>
        <h1>Claim and identity safety</h1>
        <p>A claim rewrites history: it attaches every observed session, XP, achievement, reward, and record standing an identity carries. Read the measured impact and the conflict list before approving. Every grant is reversible from the identity dossier.</p>
      </div>
      <div className="admin-heading-mark" aria-hidden="true"><ShieldCheck size={31} /><span>Ownership<br />control</span></div>
    </header>

    {notice && claimCenterNotices[notice] && <p className="admin-flash success">{claimCenterNotices[notice]}</p>}
    {error && <p className="admin-flash error">{claimCenterErrors[error] ?? "That action could not be completed."}</p>}

    <div className="admin-stat-grid claim-stat-grid">
      <div><span>Pending review</span><strong>{pendingTotal}</strong></div>
      <div><span>Owned identities</span><strong>{ownedIdentities}</strong></div>
      <div><span>Unclaimed identities</span><strong>{unclaimedIdentities}</strong></div>
      <div><span>Reversible grants</span><strong>{reversibleGrants}</strong></div>
      <div><span>Reconciliations queued</span><strong>{queuedReconciliations}</strong></div>
    </div>

    <h2 className="admin-section-title">Pending claims</h2>
    {pendingTotal > reviews.length && <p className="admin-safety-note">Showing the {reviews.length} oldest of {pendingTotal} pending claims. Each preview is measured against live data, so the queue is deliberately bounded.</p>}
    {reviews.length === 0 ? <div className="admin-empty"><p>No identity claims need review.</p><span>Pending requests appear here with their measured impact.</span></div> : <div className="claim-review-list">{reviews.map(({ claim, impact, conflicts, blocked, needsConfirmation }) => <article className="claim-review" key={claim.id}>
      <header>
        <div>
          <p className="eyebrow">{claim.playerIdentity.server?.displayName ?? formatGame(claim.playerIdentity.gameType)}</p>
          <h3>{claim.playerIdentity.displayName}</h3>
          <p>Claimed by {formatMemberName(claim.user)} · requested {formatTimestamp(claim.requestedAt)}</p>
        </div>
        <Link className="primary-link" href={`/admin/claims/${claim.playerIdentityId}`}><FileSearch aria-hidden="true" size={15} />Dossier</Link>
      </header>

      <ClaimImpactPanel impact={impact} />
      <ConflictList conflicts={conflicts} />

      <form action={resolveIdentityClaim} className="claim-decision-form">
        <input name="claimId" type="hidden" value={claim.id} />
        <label>
          <span>Resolution note (optional)</span>
          <input maxLength={300} name="note" placeholder="How ownership was confirmed" type="text" />
        </label>
        {needsConfirmation && !blocked && <label className="claim-confirmation">
          <span>Unresolved conflicts. Type <code>{approvalConfirmationPhrase}</code> to approve anyway. Rejecting needs no confirmation.</span>
          <input autoComplete="off" maxLength={40} name="confirmation" type="text" />
        </label>}
        {blocked && <p className="claim-blocked">Approval is blocked while a blocking conflict stands. Resolve it first — roll back the current owner from the dossier if this claim is the correct one.</p>}
        <div className="claim-decision">
          <button className="claim-action approve" disabled={blocked} name="decision" title="Approve claim" type="submit" value="APPROVED"><Check aria-hidden="true" size={17} />Approve</button>
          <button className="claim-action reject" name="decision" title="Reject claim" type="submit" value="REJECTED"><X aria-hidden="true" size={17} />Reject</button>
        </div>
      </form>
    </article>)}</div>}

    <h2 className="admin-section-title"><History aria-hidden="true" size={16} />Recent ownership activity</h2>
    {ledger.length === 0 ? <div className="admin-empty"><p>No ownership changes recorded yet.</p><span>Grants and rollbacks are written here as they happen.</span></div> : <ul className="ownership-ledger">{ledger.map((entry) => <li className={`ledger-${entry.action.toLowerCase()}`} key={entry.id}>
      {entry.action === "REVOKE" ? <RotateCcw aria-hidden="true" size={15} /> : <Check aria-hidden="true" size={15} />}
      <div>
        <p>
          <Link href={`/admin/claims/${entry.playerIdentityId}`}>{entry.playerIdentity.displayName}</Link>
          {entry.action === "GRANT" ? ` granted to ${formatMemberName(entry.toUser)}` : ` revoked from ${formatMemberName(entry.fromUser)}`}
          {entry.status === "REVERSED" && <span className="ledger-reversed">reversed</span>}
        </p>
        <span>{formatGame(entry.playerIdentity.gameType)} · {entry.source.replaceAll("_", " ").toLowerCase()} · {entry.actor ? formatMemberName(entry.actor) : "automatic"} · {formatTimestamp(entry.createdAt)}</span>
        {entry.reason && <span className="ledger-reason">{entry.reason}</span>}
      </div>
    </li>)}</ul>}
  </section>;
}
