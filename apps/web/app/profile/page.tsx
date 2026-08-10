import Link from "next/link";
import { redirect } from "next/navigation";
import { Check } from "lucide-react";
import { auth } from "@/auth";
import { getPrismaClient } from "@habitat/db/client";
import { equipTitle } from "./actions";

const db = getPrismaClient();

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id || !session.user.isActive) redirect("/sign-in");
  const [identities, titles] = await Promise.all([
    db.playerIdentity.findMany({ where: { userId: session.user.id }, include: { server: { select: { displayName: true, worldName: true } }, _count: { select: { events: true } } }, orderBy: { displayName: "asc" } }),
    db.userTitle.findMany({ where: { userId: session.user.id }, include: { title: true }, orderBy: [{ equipped: "desc" }, { awardedAt: "desc" }] }),
  ]);
  const recordedEvents = identities.reduce((total, identity) => total + identity._count.events, 0);
  const equippedTitle = titles.find((title) => title.equipped)?.title.name ?? null;

  return (
    <section className="page-shell">
      <div className="page-intro">
        <p className="eyebrow">Habitat profile</p>
        <h1>{session.user.name ?? "Habitat member"}</h1>
        <p>{equippedTitle ? equippedTitle : "No title equipped."} Claimed identities are verified by Habitat administration, and provider identifiers remain private.</p>
      </div><dl className="profile-metrics"><div><dt>Verified worlds</dt><dd>{identities.length}</dd></div><div><dt>Recorded events</dt><dd>{recordedEvents}</dd></div><div><dt>Titles earned</dt><dd>{titles.length}</dd></div></dl><div className="profile-heading"><div><p className="eyebrow">Claimed identities</p><h2>Your worlds</h2></div><Link className="primary-link" href="/profile/identities">Claim an identity</Link></div>{identities.length === 0 ? <div className="chronicle-empty"><p>No verified identities yet.</p><span>Submit a claim once your game identity has been observed by a supported adapter.</span></div> : <div className="identity-grid">{identities.map((identity) => <article className="identity-card" key={identity.id}><p className="eyebrow">{identity.server?.displayName ?? identity.gameType.replaceAll("_", " ")}</p><h2>{identity.displayName}</h2><p>{identity.server?.worldName ?? "Habitat identity"}</p><span>{identity._count.events} recorded events</span></article>)}</div>}<div className="profile-heading"><div><p className="eyebrow">Habitat titles</p><h2>Wear one</h2></div></div>{titles.length === 0 ? <div className="chronicle-empty"><p>No titles have been awarded.</p><span>Titles arrive from verified achievements or an administrator grant.</span></div> : <div className="title-grid">{titles.map((userTitle) => <article className={userTitle.equipped ? "title-card equipped" : "title-card"} key={userTitle.id}><p className="eyebrow">{userTitle.source.toLowerCase()} award</p><h2>{userTitle.title.name}</h2><p>{userTitle.title.description ?? "A Habitat title."}</p><form action={equipTitle}><input name="userTitleId" type="hidden" value={userTitle.id} /><button className={userTitle.equipped ? "icon-action approve" : "icon-action"} disabled={userTitle.equipped} title={userTitle.equipped ? "Equipped title" : "Equip title"} aria-label={userTitle.equipped ? "Equipped title" : `Equip ${userTitle.title.name}`}><Check aria-hidden="true" size={17} /></button></form></article>)}</div>}
    </section>
  );
}
