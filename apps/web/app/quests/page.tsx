import { redirect } from "next/navigation";
import { CheckCircle2, Clock3, Target, Zap } from "lucide-react";
import { auth } from "@/auth";
import { getPrismaClient } from "@habitat/db/client";
import { progressionForXp } from "@habitat/shared";

const db = getPrismaClient();

function questValue(ruleType: string, value: number) {
  return ruleType === "PLAY_SECONDS" ? `${(value / 3_600).toFixed(1)}h` : value.toLocaleString();
}

export default async function QuestsPage() {
  const session = await auth();
  if (!session?.user?.id || !session.user.isActive) redirect("/sign-in");
  const now = new Date();
  const [total, cycle] = await Promise.all([
    db.userXpEntry.aggregate({ where: { userId: session.user.id }, _sum: { amount: true } }),
    db.weeklyQuestCycle.findFirst({ where: { weekStart: { lte: now }, endsAt: { gt: now } }, include: { selections: { include: { definition: true, progress: { where: { userId: session.user.id }, take: 1 } }, orderBy: { sortOrder: "asc" } } } }),
  ]);
  const progression = progressionForXp(total._sum.amount ?? 0);
  return <section className="page-shell quest-page">
    <div className="quest-hero"><div><p className="eyebrow">Long-haul progression</p><h1>Level {progression.level}</h1><p>The climb to Level 100 is meant to take years. Verified time always moves the bar; weekly contracts make the impossible slightly less impossible.</p></div><div className="level-orbit"><span>{progression.level}</span><i /></div></div>
    <div className="level-track" aria-label={`${progression.progressPercent.toFixed(1)} percent toward the next level`}><i style={{ width: `${progression.progressPercent}%` }} /><div><span>{progression.currentLevelXp.toLocaleString()} XP</span><span>{progression.level === 100 ? "Maximum level" : `${progression.nextLevelXp.toLocaleString()} XP to Level ${progression.level + 1}`}</span><strong>{progression.totalXp.toLocaleString()} total XP</strong></div></div>
    <div className="profile-heading"><div><p className="eyebrow">Randomized weekly contracts</p><h2>This week&apos;s trouble</h2></div>{cycle ? <span className="quest-reset"><Clock3 aria-hidden="true" size={14} /> Resets {cycle.endsAt.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric", timeZone: "UTC" })}</span> : null}</div>
    {cycle?.selections.length ? <div className="quest-grid">{cycle.selections.map((selection) => { const progress = selection.progress[0]; const value = Math.min(selection.definition.threshold, progress?.progress ?? 0); const complete = Boolean(progress?.completedAt); const percent = Math.min(100, (value / selection.definition.threshold) * 100); return <article className={complete ? "quest-card complete" : "quest-card"} key={selection.id}><div className="quest-icon">{complete ? <CheckCircle2 aria-hidden="true" /> : <Target aria-hidden="true" />}</div><p className="eyebrow">{selection.definition.ruleType.replaceAll("_", " ")}</p><h2>{selection.definition.name}</h2><p>{selection.definition.description}</p><div className="quest-progress"><i style={{ width: `${percent}%` }} /></div><footer><span>{questValue(selection.definition.ruleType, value)} / {questValue(selection.definition.ruleType, selection.definition.threshold)}</span><strong><Zap aria-hidden="true" size={14} /> {selection.definition.xpReward.toLocaleString()} XP</strong></footer></article>; })}</div> : <div className="chronicle-empty"><p>The contract board is being shuffled.</p><span>The private worker creates each weekly rotation. No placeholder quests are shown.</span></div>}
    <p className="quest-fine-print">1 XP is banked for every five cumulative minutes of verified playtime. Short sessions carry forward. Weekly quest XP is awarded automatically—there is no claim button to forget.</p>
  </section>;
}
