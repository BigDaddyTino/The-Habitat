import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getPrismaClient } from "@habitat/db/client";

const db = getPrismaClient();

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id || !session.user.isActive) redirect("/sign-in");
  const identities = await db.playerIdentity.findMany({ where: { userId: session.user.id }, include: { server: { select: { displayName: true, worldName: true } } }, orderBy: { displayName: "asc" } });

  return (
    <section className="page-shell">
      <div className="page-intro">
        <p className="eyebrow">Habitat profile</p>
        <h1>{session.user.name ?? "Habitat member"}</h1>
        <p>Claimed game identities are verified by Habitat administration. Provider identifiers remain private.</p>
      </div><div className="profile-heading"><div><p className="eyebrow">Claimed identities</p><h2>Your worlds</h2></div><Link className="primary-link" href="/profile/identities">Claim an identity</Link></div>{identities.length === 0 ? <div className="chronicle-empty"><p>No verified identities yet.</p><span>Submit a claim once your game identity has been observed by a supported adapter.</span></div> : <div className="identity-grid">{identities.map((identity) => <article className="identity-card" key={identity.id}><p className="eyebrow">{identity.server?.displayName ?? identity.gameType.replaceAll("_", " ")}</p><h2>{identity.displayName}</h2><p>{identity.server?.worldName ?? "Habitat identity"}</p><span>Verified</span></article>)}</div>}
    </section>
  );
}
