import Image from "next/image";
import { auth } from "@/auth";
import { getPrismaClient } from "@habitat/db/client";
import { ChronicleReplay } from "@/components/chronicle-replay";
import { avatarBorderClass, titlePlateClass } from "@/lib/reward-presentation";
import { chronicleEventLabels, chronicleGameLabels, chronicleGameTypes, getAvailableChronicleEventTypes, getChronicleEvents, isChronicleEventType, isChronicleGameType } from "@/lib/world-data";

const db = getPrismaClient();

export default async function ChroniclePage({ searchParams }: { searchParams: Promise<{ game?: string; type?: string }> }) {
  const [filters, session] = await Promise.all([searchParams, auth()]);
  const gameType = isChronicleGameType(filters.game) ? filters.game : undefined;
  const availableEventTypes = await getAvailableChronicleEventTypes();
  const eventType = isChronicleEventType(filters.type) && availableEventTypes.includes(filters.type) ? filters.type : undefined;
  const [events, member] = await Promise.all([
    getChronicleEvents({ gameType, eventType, limit: 100 }),
    session?.user?.id && session.user.isActive ? db.user.findUnique({
      where: { id: session.user.id },
      select: {
        name: true,
        username: true,
        displayName: true,
        image: true,
        avatarBorder: true,
        playerIdentities: { where: { verifiedAt: { not: null } }, select: { id: true } },
        titles: { where: { equipped: true }, select: { title: { select: { name: true, slug: true } } }, take: 1 },
      },
    }) : null,
  ]);
  const replayEvents = events.map((event) => ({ ...event, occurredAt: event.occurredAt.toISOString() }));
  const equippedTitle = member?.titles[0]?.title;
  const viewer = member ? {
    displayName: member.displayName ?? member.name ?? member.username ?? "Habitat member",
    username: member.username ?? undefined,
    avatar: member.image ?? "/images/avatars/campfire.svg",
    avatarBorderClass: avatarBorderClass(member.avatarBorder),
    title: equippedTitle ? { name: equippedTitle.name, className: titlePlateClass(equippedTitle.slug, "MEMBER") } : undefined,
    actorHrefs: [
      ...(member.username ? [`/members/${member.username}`] : []),
      ...member.playerIdentities.map((identity) => `/chronicle/identity/${identity.id}`),
    ],
  } : null;
  return <section className="page-shell chronicle-replay-page">
    <header className="chronicle-replay-masthead">
      <div className="chronicle-masthead-title"><p className="eyebrow">Private clubhouse picture house · verified history only</p><h1>Chronicle<br /><em>Replay Theater</em></h1></div>
      <div className="chronicle-masthead-aside"><div className="chronicle-projector-figure" aria-hidden="true"><i className="projector-beam" /><Image alt="" height={430} priority src="/images/chronicle/chronicle-projector.png" width={395} /></div><p>Turn retained sessions into stories worth remembering. Play a day back, follow the crew&apos;s trail, and carry a private recap into Discord.</p></div>
      <div className="chronicle-masthead-dust" aria-hidden="true">{Array.from({ length: 12 }, (_, index) => <i key={index} />)}</div>
    </header>
    <form className="chronicle-filters replay-filters" action="/chronicle"><label>World<select name="game" defaultValue={gameType ?? ""}><option value="">All sources</option>{chronicleGameTypes.map((game) => <option key={game} value={game}>{chronicleGameLabels[game]}</option>)}</select></label><label>Moment<select name="type" defaultValue={eventType ?? ""}><option value="">All verified moments</option>{availableEventTypes.map((type) => <option key={type} value={type}>{chronicleEventLabels[type]}</option>)}</select></label><button type="submit">Cut the reel</button></form>
    <ChronicleReplay events={replayEvents} filtered={Boolean(gameType || eventType)} viewer={viewer} />
  </section>;
}
