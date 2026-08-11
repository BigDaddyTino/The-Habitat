import Link from "next/link";
import { notFound } from "next/navigation";
import { Crown, Flame, Hand, Link2, Skull, Swords, type LucideIcon } from "lucide-react";
import { auth } from "@/auth";
import { formatChronicleTime } from "@/components/chronicle-feed";
import { chronicleReactionTypes, getChronicleEvent, type ChronicleReactionType } from "@/lib/world-data";
import { toggleChronicleReaction } from "./actions";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const reactionPresentation: Record<ChronicleReactionType, { label: string; Icon: LucideIcon }> = {
  SKULL: { label: "Skull", Icon: Skull },
  FIRE: { label: "Fire", Icon: Flame },
  FACEPALM: { label: "Facepalm", Icon: Hand },
  CROWN: { label: "Crown", Icon: Crown },
  SKILL_ISSUE: { label: "Skill issue", Icon: Swords },
};

export default async function ChronicleEventPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;
  if (!uuidPattern.test(eventId)) notFound();
  const session = await auth();
  const member = Boolean(session?.user?.id && session.user.isActive && (session.user.role === "USER" || session.user.role === "ADMIN"));
  const event = await getChronicleEvent(eventId, member ? session?.user?.id : undefined);
  if (!event) notFound();

  return <section className="page-shell"><div className="page-intro chronicle-event-intro"><p className="eyebrow">Verified Chronicle event</p><h1>{event.text}</h1><p><time dateTime={event.occurredAt.toISOString()}>{formatChronicleTime(event.occurredAt)}</time> <span aria-hidden="true">/</span> {event.world}</p></div><div className="chronicle-event-links"><Link href={`/worlds/${event.worldSlug}`}>View {event.world}</Link><Link href={`/chronicle/${event.id}`} aria-label="Permanent link to this event" title="Permanent event link"><Link2 aria-hidden="true" size={16} /></Link></div><section className="chronicle-reactions" aria-labelledby="reaction-heading"><div><p className="eyebrow">Member reactions</p><h2 id="reaction-heading">Leave a mark</h2></div>{member ? <div className="reaction-actions">{chronicleReactionTypes.map((reactionType) => { const reaction = event.reactions.find((item) => item.reactionType === reactionType); const { Icon, label } = reactionPresentation[reactionType]; return <form action={toggleChronicleReaction} key={reactionType}><input name="eventId" type="hidden" value={event.id} /><input name="reactionType" type="hidden" value={reactionType} /><button className={reaction?.reacted ? "reaction-button selected" : "reaction-button"} aria-label={`${label}: ${reaction?.count ?? 0}`} title={label} type="submit"><Icon aria-hidden="true" size={17} /><span>{reaction?.count ?? 0}</span></button></form>; })}</div> : <p className="reaction-sign-in"><Link href="/sign-in">Sign in</Link> to react to verified Chronicle events.</p>}</section></section>;
}
