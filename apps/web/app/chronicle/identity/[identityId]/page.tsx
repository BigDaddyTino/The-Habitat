import Link from "next/link";
import { notFound } from "next/navigation";
import { History, MapPinned, ShieldCheck } from "lucide-react";
import { getPrismaClient } from "@habitat/db/client";
import { ChronicleFeed } from "@/components/chronicle-feed";
import { chronicleGameLabels, getChronicleEvents, type ChronicleGameType } from "@/lib/world-data";

const db = getPrismaClient();
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default async function IdentityChroniclePage({ params }: { params: Promise<{ identityId: string }> }) {
  const { identityId } = await params;
  if (!uuidPattern.test(identityId)) notFound();
  const identity = await db.playerIdentity.findFirst({
    where: { id: identityId, userId: { not: null }, verifiedAt: { not: null } },
    select: {
      displayName: true,
      gameType: true,
      server: { select: { displayName: true, worldName: true, slug: true } },
      user: { select: { username: true, displayName: true, name: true } },
      _count: { select: { events: true, legacyEvidence: true } },
    },
  });
  if (!identity) notFound();
  const events = await getChronicleEvents({ playerIdentityId: identityId, limit: 100 });
  const game = chronicleGameLabels[identity.gameType as ChronicleGameType] ?? identity.gameType.replaceAll("_", " ");
  const owner = identity.user?.displayName ?? identity.user?.name ?? "Habitat member";

  return <section className="page-shell identity-chronicle-page">
    <div className="page-intro"><p className="eyebrow">Verified character Chronicle</p><h1>{identity.displayName}</h1><p>Every retained event tied to this exact claimed character. Nothing from another identity is mixed into this record.</p></div>
    <div className="detail-grid identity-chronicle-summary">
      <article><ShieldCheck aria-hidden="true" /><h2>Claimed by</h2><p>{identity.user?.username ? <Link href={`/members/${identity.user.username}`}>{owner}</Link> : owner}</p></article>
      <article><MapPinned aria-hidden="true" /><h2>World</h2><p>{identity.server ? <Link href={`/worlds/${identity.server.slug}`}>{identity.server.worldName}</Link> : game}</p></article>
      <article><History aria-hidden="true" /><h2>Recorded history</h2><p>{identity._count.events} Chronicle event{identity._count.events === 1 ? "" : "s"} · {identity._count.legacyEvidence} recovered record{identity._count.legacyEvidence === 1 ? "" : "s"}</p></article>
    </div>
    <div className="profile-heading"><div><p className="eyebrow">Exact identity filter</p><h2>{game} events</h2></div><span className="dossier-as-of">Newest first · up to 100 retained events</span></div>
    <ChronicleFeed events={events} />
  </section>;
}
