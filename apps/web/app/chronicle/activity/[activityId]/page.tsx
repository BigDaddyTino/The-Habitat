import Link from "next/link";
import { notFound } from "next/navigation";
import { Link2 } from "lucide-react";
import { getPrismaClient } from "@habitat/db/client";
import { formatChronicleTime } from "@/components/chronicle-feed";
import "./activity.css";

const db = getPrismaClient();
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default async function ActivityChroniclePage({ params }: { params: Promise<{ activityId: string }> }) {
  const { activityId } = await params;
  if (!uuidPattern.test(activityId)) notFound();
  const activity = await db.gameActivity.findFirst({
    where: { id: activityId, OR: [{ sourceServerEventId: { not: null } }, { sourceClubMatchParticipant: { is: { clubGameProfile: { is: { displayPublic: true } } } } }] },
    include: {
      user: { select: { displayName: true, name: true, username: true } },
      playerAchievements: { include: { achievement: { select: { name: true, description: true } } }, orderBy: { awardedAt: "asc" } },
      recordHistory: { include: { definition: { select: { title: true, valueLabel: true } } }, orderBy: { occurredAt: "asc" } },
    },
  });
  if (!activity) notFound();
  const member = activity.user.displayName ?? activity.user.name ?? activity.user.username ?? "Habitat member";
  const source = activity.gameKey === "MARVEL_RIVALS" ? "Marvel Rivals" : activity.gameKey.replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
  const sourceHref = activity.gameKey === "MARVEL_RIVALS" ? "/club-games/marvel-rivals" : "/worlds";
  const activityLabel = activity.activityType.toLowerCase().replaceAll("_", " ");
  return <section className="page-shell"><div className="page-intro chronicle-event-intro"><p className="eyebrow">Verified cross-game evidence</p><h1>{activity.chronicleHeadline ?? `${member} recorded ${activityLabel}.`}</h1><p><time dateTime={activity.occurredAt.toISOString()}>{formatChronicleTime(activity.occurredAt)}</time> <span aria-hidden="true">/</span> {source} <span aria-hidden="true">/</span> confidence {activity.sourceConfidence}%</p></div><div className="chronicle-event-links"><Link href={sourceHref}>View {source}</Link><Link href={`/chronicle/activity/${activity.id}`} aria-label="Permanent link to this evidence" title="Permanent evidence link"><Link2 aria-hidden="true" size={16} /></Link></div><section className="activity-evidence-card"><p className="eyebrow">Evidence receipt</p><h2>{activityLabel}</h2><dl><div><dt>Member</dt><dd>{member}</dd></div><div><dt>Value</dt><dd>{activity.valueNumber ?? "Recorded"}</dd></div><div><dt>Source</dt><dd>{activity.source.replaceAll("_", " ")}</dd></div><div><dt>Confidence</dt><dd>{activity.sourceConfidence}%</dd></div></dl>{activity.playerAchievements.length ? <div><h3>Achievements unlocked</h3><ul>{activity.playerAchievements.map((award) => <li key={award.id}><strong>{award.achievement.name}</strong><span>{award.achievement.description}</span></li>)}</ul></div> : null}{activity.recordHistory.length ? <div><h3>Records established</h3><ul>{activity.recordHistory.map((history) => <li key={history.id}><strong>{history.definition.title}</strong><span>{history.valueNumber.toLocaleString()} {history.definition.valueLabel}</span></li>)}</ul></div> : null}</section></section>;
}
