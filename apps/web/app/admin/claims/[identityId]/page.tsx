import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Download, RotateCcw, ScrollText, ShieldCheck } from "lucide-react";
import { getPrismaClient } from "@habitat/db/client";
import { detectClaimConflicts, previewOwnershipChange, summarizeIdentityProvenance, type AppliedRevocation } from "@habitat/identity";
import { requireRole } from "@/lib/authorization";
import { claimCenterErrors, claimCenterNotices, formatGame, formatHours, formatMemberName, formatTimestamp, rollbackConfirmationPhrase } from "@/lib/claim-center";
import { rollbackIdentityOwnership } from "../actions";
import { ClaimImpactPanel, ConflictList } from "../claim-impact-panel";
import "../claims.css";

export const dynamic = "force-dynamic";

const auditLimit = 25;

const db = getPrismaClient();

export default async function IdentityDossierPage({ params, searchParams }: { params: Promise<{ identityId: string }>; searchParams: Promise<{ notice?: string; error?: string }> }) {
  await requireRole("ADMIN");
  const { identityId } = await params;
  const { notice, error } = await searchParams;

  const identity = await db.playerIdentity.findUnique({
    where: { id: identityId },
    include: { user: { select: { id: true, name: true, username: true, displayName: true, email: true, isActive: true } }, server: { select: { displayName: true, worldName: true } } },
  });
  if (!identity) notFound();

  const [provenance, ledger, claims, auditTrail] = await Promise.all([
    summarizeIdentityProvenance(db, identity.id),
    db.identityOwnershipTransaction.findMany({
      where: { playerIdentityId: identity.id },
      include: { toUser: { select: { name: true, username: true, displayName: true, email: true } }, fromUser: { select: { name: true, username: true, displayName: true, email: true } }, actor: { select: { name: true, username: true, displayName: true, email: true } } },
      orderBy: { createdAt: "desc" },
    }),
    db.playerIdentityClaim.findMany({
      where: { playerIdentityId: identity.id },
      include: { user: { select: { name: true, username: true, displayName: true, email: true } }, resolvedBy: { select: { name: true, username: true, displayName: true, email: true } } },
      orderBy: { requestedAt: "desc" },
    }),
    db.auditLog.findMany({ where: { entityType: "PlayerIdentity", entityId: identity.id }, include: { actor: { select: { name: true, username: true, displayName: true, email: true } } }, orderBy: { createdAt: "desc" }, take: auditLimit }),
  ]);

  // The consequence preview only exists while somebody owns the identity.
  const unlinkImpact = identity.userId ? await previewOwnershipChange(db, { playerIdentityId: identity.id, userId: identity.userId, direction: "REVOKE" }) : null;
  // The owner holding their own identity is the expected state here, not a
  // finding, so that one conflict is dropped; everything else still applies.
  const ownerConflicts = identity.userId
    ? (await detectClaimConflicts(db, { playerIdentityId: identity.id, userId: identity.userId })).filter((conflict) => conflict.code !== "IDENTITY_ALREADY_GRANTED")
    : [];
  const activeGrant = ledger.find((entry) => entry.action === "GRANT" && entry.status === "APPLIED");

  return <section className="admin-page">
    <header className="admin-page-heading">
      <div>
        <p className="eyebrow"><Link className="dossier-back" href="/admin/claims"><ArrowLeft aria-hidden="true" size={14} />Claim and identity safety</Link></p>
        <h1>{identity.displayName}</h1>
        <p>{formatGame(identity.gameType)} · {identity.server?.displayName ?? "no registered world"}{identity.server?.worldName ? ` · ${identity.server.worldName}` : ""}</p>
      </div>
      <div className="admin-heading-mark" aria-hidden="true"><ShieldCheck size={31} /><span>Identity<br />dossier</span></div>
    </header>

    {notice && claimCenterNotices[notice] && <p className="admin-flash success">{claimCenterNotices[notice]}</p>}
    {error && <p className="admin-flash error">{claimCenterErrors[error] ?? "That action could not be completed."}</p>}

    <div className="admin-stat-grid claim-stat-grid">
      <div><span>Current owner</span><strong>{identity.user ? formatMemberName(identity.user) : "Unclaimed"}</strong></div>
      <div><span>Ownership proved</span><strong>{formatTimestamp(identity.verifiedAt)}</strong></div>
      <div><span>Provider proof</span><strong>{provenance?.hasProviderProof ? `${provenance.providerName} on file` : "None"}</strong></div>
      <div><span>Evidence records</span><strong>{(provenance?.totalRecords ?? 0).toLocaleString("en-US")}</strong></div>
      <div><span>Recorded hours</span><strong>{formatHours(provenance?.totalSessionSeconds ?? 0)}</strong></div>
    </div>
    <p className="admin-safety-note">Provider identifiers such as SteamID64 are never displayed here. The dossier reports only whether proof exists and whether it matches the owner.</p>

    {identity.user && unlinkImpact && <>
      <h2 className="admin-section-title"><RotateCcw aria-hidden="true" size={16} />Unlink consequences</h2>
      <p className="admin-safety-note">This is what rolling ownership back would remove from {formatMemberName(identity.user)} right now, measured against live data rather than replayed from the original approval.</p>
      <ClaimImpactPanel impact={unlinkImpact} />
      {ownerConflicts.length > 0 && <ConflictList conflicts={ownerConflicts} />}

      <form action={rollbackIdentityOwnership} className="rollback-form">
        <input name="playerIdentityId" type="hidden" value={identity.id} />
        {activeGrant && <input name="ownershipTransactionId" type="hidden" value={activeGrant.id} />}
        <label>
          <span>Why is this being rolled back?</span>
          <input maxLength={300} minLength={8} name="reason" placeholder="Recorded permanently in the ownership ledger" required type="text" />
        </label>
        <label>
          <span>Type <code>{rollbackConfirmationPhrase}</code> to confirm.</span>
          <input autoComplete="off" maxLength={40} name="confirmation" required type="text" />
        </label>
        <button className="danger-action" type="submit"><RotateCcw aria-hidden="true" size={16} />Roll back ownership</button>
      </form>
      <p className="admin-safety-note">Rolling back detaches the identity, trims verified playtime XP to the evidence that remains, revokes identity- and level-based achievements that are no longer earned, and clears record holdings established through this identity. Weekly quest XP already banked is not recalculated, including XP from the current week.</p>
      <p><Link className="primary-link" href={`/api/admin/members/${identity.user.id}/export`}><Download aria-hidden="true" size={15} />Export {formatMemberName(identity.user)}&apos;s identity record</Link></p>
    </>}

    <h2 className="admin-section-title"><ScrollText aria-hidden="true" size={16} />Ownership history</h2>
    {ledger.length === 0 ? <div className="admin-empty"><p>No ownership changes recorded.</p><span>This identity has never been granted to a member.</span></div> : <ul className="ownership-ledger detailed">{ledger.map((entry) => {
      const applied = entry.appliedImpact as AppliedRevocation | null;
      const projected = entry.projectedImpact as { headline?: string } | null;
      return <li className={`ledger-${entry.action.toLowerCase()}`} key={entry.id}>
        <div>
          <p>{entry.action === "GRANT" ? `Granted to ${formatMemberName(entry.toUser)}` : `Revoked from ${formatMemberName(entry.fromUser)}`}{entry.status === "REVERSED" && <span className="ledger-reversed">reversed {formatTimestamp(entry.reversedAt)}</span>}</p>
          <span>{entry.source.replaceAll("_", " ").toLowerCase()} · {entry.actor ? formatMemberName(entry.actor) : "automatic, no reviewer"} · {formatTimestamp(entry.createdAt)}</span>
          {entry.reason && <span className="ledger-reason">{entry.reason}</span>}
          {projected?.headline && <span className="ledger-impact">Predicted: {projected.headline}</span>}
          {applied && <span className="ledger-impact">Applied: removed {applied.trackedHoursRemoved.toLocaleString("en-US", { maximumFractionDigits: 1 })} hours, {applied.xpRemoved.toLocaleString("en-US")} XP, {applied.achievementsRevoked.length} achievements, {applied.titlesRevoked.length} titles; level {applied.levelBefore} → {applied.levelAfter}.</span>}
        </div>
      </li>;
    })}</ul>}

    <h2 className="admin-section-title">Claim history</h2>
    {claims.length === 0 ? <div className="admin-empty"><p>No claims filed.</p><span>Nobody has requested this identity.</span></div> : <ul className="claim-history">{claims.map((claim) => <li key={claim.id}>
      <span className={`claim-status ${claim.status.toLowerCase()}`}>{claim.status.toLowerCase()}</span>
      <div><p>{formatMemberName(claim.user)}</p><span>Requested {formatTimestamp(claim.requestedAt)}{claim.resolvedAt ? ` · resolved ${formatTimestamp(claim.resolvedAt)} by ${formatMemberName(claim.resolvedBy)}` : ""}</span>{claim.resolutionNote && <span className="ledger-reason">{claim.resolutionNote}</span>}</div>
    </li>)}</ul>}

    <h2 className="admin-section-title"><ShieldCheck aria-hidden="true" size={16} />Evidence provenance</h2>
    {!provenance || provenance.sources.length === 0 ? <div className="admin-empty"><p>No evidence recorded.</p><span>Granting this identity would transfer no history.</span></div> : <div className="provenance-table" role="table">
      <div className="provenance-row provenance-head" role="row"><span role="columnheader">Source</span><span role="columnheader">Channel</span><span role="columnheader">Records</span><span role="columnheader">Hours</span><span role="columnheader">Confidence</span><span role="columnheader">Window</span></div>
      {provenance.sources.map((source) => <div className="provenance-row" key={`${source.channel}-${source.source}-${source.label}`} role="row">
        <span role="cell">{source.label}{source.sampleRecordHash && <code title="Sample source record hash">{source.sampleRecordHash.slice(0, 12)}</code>}</span>
        <span role="cell">{source.channel === "LIVE_EVENT" ? "Live collector" : "Legacy import"}</span>
        <span role="cell">{source.recordCount.toLocaleString("en-US")}</span>
        <span role="cell">{formatHours(source.sessionSeconds)}</span>
        <span role="cell">{source.minimumConfidence === null ? "—" : `${source.minimumConfidence}${source.minimumConfidence < 100 ? " (no XP)" : ""}`}</span>
        <span role="cell">{source.firstObservedAt ? `${formatTimestamp(source.firstObservedAt)} → ${formatTimestamp(source.lastObservedAt)}` : "—"}</span>
      </div>)}
    </div>}

    <h2 className="admin-section-title">Audit trail</h2>
    {auditTrail.length === 0 ? <div className="admin-empty"><p>No audit entries.</p><span>Nothing has been recorded against this identity.</span></div> : <ul className="admin-audit-panel">{auditTrail.map((entry) => <li key={entry.id}><span className="admin-actor">{entry.actor ? formatMemberName(entry.actor) : "system"}</span><span>{entry.action.replaceAll("_", " ").toLowerCase()}</span><span>{formatTimestamp(entry.createdAt)}</span></li>)}</ul>}
  </section>;
}
