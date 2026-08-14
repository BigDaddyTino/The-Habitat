import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getPrismaClient } from "@habitat/db/client";
import { summarizeIdentityProvenance } from "@habitat/identity";
import { formatHours, formatTimestamp } from "@/lib/claim-center";
import { requestIdentityClaim } from "./actions";

const db = getPrismaClient();

export default async function IdentityClaimsPage() {
  const session = await auth();
  if (!session?.user?.id || !session.user.isActive) redirect("/sign-in");
  const [available, claims, owned] = await Promise.all([
    db.playerIdentity.findMany({ where: { userId: null }, include: { server: { select: { displayName: true, worldName: true } } }, orderBy: [{ gameType: "asc" }, { displayName: "asc" }] }),
    db.playerIdentityClaim.findMany({ where: { userId: session.user.id }, include: { playerIdentity: { include: { server: { select: { displayName: true, worldName: true } } } } }, orderBy: { requestedAt: "desc" } }),
    db.playerIdentity.findMany({ where: { userId: session.user.id }, include: { server: { select: { displayName: true, worldName: true } } }, orderBy: [{ gameType: "asc" }, { displayName: "asc" }] }),
  ]);
  const claimByIdentity = new Map(claims.map((claim) => [claim.playerIdentityId, claim]));
  const contributions = await Promise.all(owned.map((identity) => summarizeIdentityProvenance(db, identity.id)));

  return <section className="page-shell">
    <div className="page-intro"><p className="eyebrow">Identity claims</p><h1>Claim a game identity</h1><p>Identities carrying your verified SteamID64 attach automatically without admin review. Only identities without a provider-verifiable match use the manual request below.</p></div>

    {owned.length > 0 && <>
      <div className="profile-heading"><div><p className="eyebrow">Proven ownership</p><h2>Your claimed identities</h2></div><Link className="primary-link" href="/profile">Your profile</Link></div>
      <p className="admin-safety-note">These identities are attached to your account and their verified history counts toward your hours, XP, level, and achievements. Detaching one is an administrator action, because doing so reverses the rewards that history granted.</p>
      <div className="identity-grid">{owned.map((identity, index) => {
        const provenance = contributions[index];
        return <article className="identity-card owned" key={identity.id}>
          <p className="eyebrow">{identity.server?.displayName ?? identity.gameType.replaceAll("_", " ")}</p>
          <h2>{identity.displayName}</h2>
          <p>{identity.server?.worldName ?? "Habitat identity"}</p>
          <dl className="identity-contribution">
            <div><dt>Recorded hours</dt><dd>{formatHours(provenance?.totalSessionSeconds ?? 0)}</dd></div>
            <div><dt>Evidence records</dt><dd>{(provenance?.totalRecords ?? 0).toLocaleString("en-US")}</dd></div>
            <div><dt>Proved</dt><dd>{formatTimestamp(identity.verifiedAt)}</dd></div>
          </dl>
        </article>;
      })}</div>
    </>}

    <div className="profile-heading"><div><p className="eyebrow">Observed identities</p><h2>Available for review</h2></div>{owned.length === 0 ? <Link className="primary-link" href="/profile">Your profile</Link> : null}</div>
    {available.length === 0 ? <div className="chronicle-empty"><p>No identities are available.</p><span>Join a world with a supported identity adapter, then return after the worker observes it.</span></div> : <div className="identity-grid">{available.map((identity) => {
      const claim = claimByIdentity.get(identity.id);
      const canRequest = !claim || claim.status === "REJECTED";
      return <article className="identity-card" key={identity.id}>
        <p className="eyebrow">{identity.server?.displayName ?? identity.gameType.replaceAll("_", " ")}</p>
        <h2>{identity.displayName}</h2>
        <p>{identity.server?.worldName ?? "Habitat identity"}</p>
        {claim && <span className={`claim-status ${claim.status.toLowerCase()}`}>{claim.status.toLowerCase()}</span>}
        {claim?.resolutionNote && <span className="claim-resolution-note">{claim.resolutionNote}</span>}
        {canRequest && <form action={requestIdentityClaim}><input name="playerIdentityId" type="hidden" value={identity.id} /><button className="save-server" type="submit">{claim ? "Request review again" : "Request claim"}</button></form>}
      </article>;
    })}</div>}
  </section>;
}
