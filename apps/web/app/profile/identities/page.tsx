import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getPrismaClient } from "@habitat/db/client";
import { requestIdentityClaim } from "./actions";

const db = getPrismaClient();

export default async function IdentityClaimsPage() {
  const session = await auth();
  if (!session?.user?.id || !session.user.isActive) redirect("/sign-in");
  const [available, claims] = await Promise.all([
    db.playerIdentity.findMany({ where: { userId: null }, include: { server: { select: { displayName: true, worldName: true } } }, orderBy: [{ gameType: "asc" }, { displayName: "asc" }] }),
    db.playerIdentityClaim.findMany({ where: { userId: session.user.id }, include: { playerIdentity: { include: { server: { select: { displayName: true, worldName: true } } } } }, orderBy: { requestedAt: "desc" } }),
  ]);
  const claimByIdentity = new Map(claims.map((claim) => [claim.playerIdentityId, claim]));

  return <section className="page-shell"><div className="page-intro"><p className="eyebrow">Identity claims</p><h1>Claim a game identity</h1><p>Identities carrying your verified SteamID64 attach automatically without admin review. Only identities without a provider-verifiable match use the manual request below.</p></div><div className="profile-heading"><div><p className="eyebrow">Observed identities</p><h2>Available for review</h2></div><Link className="primary-link" href="/profile">Your profile</Link></div>{available.length === 0 ? <div className="chronicle-empty"><p>No identities are available.</p><span>Join a world with a supported identity adapter, then return after the worker observes it.</span></div> : <div className="identity-grid">{available.map((identity) => { const claim = claimByIdentity.get(identity.id); return <article className="identity-card" key={identity.id}><p className="eyebrow">{identity.server?.displayName ?? identity.gameType.replaceAll("_", " ")}</p><h2>{identity.displayName}</h2><p>{identity.server?.worldName ?? "Habitat identity"}</p>{claim ? <span className={`claim-status ${claim.status.toLowerCase()}`}>{claim.status.toLowerCase()}</span> : <form action={requestIdentityClaim}><input name="playerIdentityId" type="hidden" value={identity.id} /><button className="save-server" type="submit">Request claim</button></form>}</article>; })}</div>}</section>;
}
