import { Award } from "lucide-react";
import { auth } from "@/auth";
import { getPrismaClient } from "@habitat/db/client";

const db = getPrismaClient();

export default async function AchievementsPage() {
  const session = await auth();
  const userId = session?.user?.id && session.user.isActive ? session.user.id : null;
  const [definitions, earned] = await Promise.all([
    db.achievementDefinition.findMany({ where: { enabled: true }, include: { _count: { select: { awards: true } } }, orderBy: [{ rarity: "asc" }, { name: "asc" }] }),
    userId ? db.playerAchievement.findMany({ where: { userId }, select: { achievementDefinitionId: true } }) : Promise.resolve([]),
  ]);
  const earnedIds = new Set(earned.map((award) => award.achievementDefinitionId));
  return <section className="page-shell"><div className="page-intro"><p className="eyebrow">Verified Habitat milestones</p><h1>Achievements</h1><p>Every award is evaluated from trusted Chronicle events. Replayed worker cycles cannot grant it twice.</p></div>{definitions.length === 0 ? <div className="chronicle-empty"><p>No achievement definitions are active.</p><span>The record remains quiet until a real rule is approved.</span></div> : <div className="achievement-grid">{definitions.map((achievement) => { const earnedByYou = earnedIds.has(achievement.id); return <article className={earnedByYou ? "achievement-card earned" : "achievement-card"} key={achievement.id}><Award aria-hidden="true" size={19} /><p className="eyebrow">{achievement.rarity.replaceAll("_", " ")} / {achievement.points} points</p><h2>{achievement.name}</h2><p>{achievement.description}</p><span>{earnedByYou ? "Earned" : `${achievement._count.awards} members awarded`}</span></article>; })}</div>}</section>;
}
