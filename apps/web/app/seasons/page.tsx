import Link from "next/link";
import { Award, CheckCircle2, Clock3, Compass, Flame, LockKeyhole, ShieldCheck, Sparkles, Target, Trophy, Users, Zap } from "lucide-react";
import { auth } from "@/auth";
import { getPrismaClient } from "@habitat/db/client";
import { boundedProgress, seasonPhase } from "@habitat/shared";
import { joinSeason } from "./actions";

const db = getPrismaClient();
const gameNames: Record<string, string> = { SEVEN_DAYS_TO_DIE: "7 Days to Die", PROJECT_ZOMBOID: "Project Zomboid", DRAGONWILDS: "RuneScape: Dragonwilds", ENSHROUDED: "Enshrouded", PALWORLD: "Palworld", VALHEIM: "Valheim" };

function formatGoal(ruleType: string, value: number) {
  return ruleType === "PLAY_SECONDS" ? `${(value / 3_600).toFixed(value % 3_600 ? 1 : 0)}h` : value.toLocaleString();
}

function ProgressRail({ value, goal, label }: { value: number; goal: number; label: string }) {
  const progress = boundedProgress(value, goal);
  return <div className="season-progress" aria-label={`${label}: ${progress.percent.toFixed(1)} percent complete`}><i><span style={{ width: `${progress.percent}%` }} /></i><div><span>{value.toLocaleString()} / {goal.toLocaleString()}</span><strong>{progress.complete ? "Complete" : `${Math.ceil(goal - value).toLocaleString()} remaining`}</strong></div></div>;
}

export default async function SeasonsPage() {
  const session = await auth();
  const now = new Date();
  const [current, archive] = await Promise.all([
    db.season.findFirst({
      where: { isEnabled: true, status: { in: ["ACTIVE", "UPCOMING"] } }, orderBy: { startsAt: "asc" },
      include: { memberships: { select: { userId: true } }, quests: { where: { enabled: true }, include: { teamProgress: true }, orderBy: { sortOrder: "asc" } }, expeditions: { orderBy: { sortOrder: "asc" } } },
    }),
    db.season.findMany({ where: { isEnabled: true, status: "COMPLETED" }, orderBy: { endsAt: "desc" }, take: 8, include: { chronicle: { select: { id: true } }, _count: { select: { memberships: true } } } }),
  ]);
  if (!current) return <section className="page-shell season-page"><div className="season-empty"><Trophy aria-hidden="true" /><p className="eyebrow">Seasonal expedition board</p><h1>The lodge is between seasons.</h1><p>Lifetime levels, achievements, records, and every earned trophy remain exactly where they are. A new three-month expedition will appear here only when the lodge enables one.</p>{archive.length ? <div className="season-archive-links">{archive.map((season) => <Link href={`/seasons/${season.slug}/chronicle`} key={season.id}>{season.name} chronicle</Link>)}</div> : null}</div></section>;

  const phase = seasonPhase(current, now);
  const userId = session?.user?.isActive ? session.user.id : null;
  const isMember = Boolean(userId && current.memberships.some((entry) => entry.userId === userId));
  const [communityXp, personalXp, personalProgress] = await Promise.all([
    db.seasonXpEntry.aggregate({ where: { seasonId: current.id }, _sum: { amount: true } }),
    userId ? db.seasonXpEntry.aggregate({ where: { seasonId: current.id, userId }, _sum: { amount: true } }) : Promise.resolve({ _sum: { amount: null } }),
    userId ? db.userSeasonQuestProgress.findMany({ where: { userId, quest: { seasonId: current.id } }, select: { questId: true, progress: true, completedAt: true } }) : Promise.resolve([]),
  ]);
  const communityTotal = communityXp._sum.amount ?? 0;
  const personalByQuest = new Map(personalProgress.map((entry) => [entry.questId, entry]));
  const dateOptions = { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" } as const;
  const personalQuests = current.quests.filter((quest) => quest.scope === "PERSONAL");
  const teamQuests = current.quests.filter((quest) => quest.scope === "TEAM");

  return <section className="page-shell season-page">
    <header className="season-hero">
      <div className="season-hero-copy"><p className="eyebrow">Season {String(current.ordinal).padStart(2, "0")} · {current.theme}</p><h1>{current.name}</h1><p>{current.description}</p><div className="season-dates"><Clock3 aria-hidden="true" size={15} /> {current.startsAt.toLocaleDateString("en-US", dateOptions)} — {current.endsAt.toLocaleDateString("en-US", dateOptions)} <span>{phase}</span></div></div>
      <div className="season-crest" aria-label={`Season ${current.ordinal}`}><span>S{current.ordinal}</span><i /></div>
    </header>

    <aside className="season-permanence"><ShieldCheck aria-hidden="true" /><div><strong>Your permanent record does not reset.</strong><span>Lifetime level, XP, achievements, titles, records, and prior trophies remain permanent. Seasonal XP is a separate three-month ledger for fresh goals.</span></div></aside>

    <section className="community-objective">
      <div className="community-objective-heading"><div><p className="eyebrow">Cooperative objective</p><h2>Raise the lodge standard</h2><p>Every enrolled member&apos;s verified playtime and completed quests feeds the same community bar.</p></div><strong>{communityTotal.toLocaleString()}<span>community XP</span></strong></div>
      <ProgressRail value={communityTotal} goal={current.communityXpGoal} label="Community season XP" />
      <footer><span><Users aria-hidden="true" size={14} /> {current.memberships.length} enrolled</span><Link href="/leaderboards/season">Open seasonal standings</Link></footer>
    </section>

    <div className="season-membership-card">
      {isMember ? <><CheckCircle2 aria-hidden="true" /><div><p className="eyebrow">Expedition member</p><h2>You&apos;re on the roster.</h2><p>Your in-window verified activity is reconciled automatically. You currently hold <strong>{(personalXp._sum.amount ?? 0).toLocaleString()} seasonal XP</strong>.</p></div></> : <><Sparkles aria-hidden="true" /><div><p className="eyebrow">Optional participation</p><h2>{phase === "UPCOMING" ? "Reserve your place." : "Join the expedition."}</h2><p>Joining adds seasonal goals; it does not change, spend, or replace any lifetime progress.</p>{userId ? <form action={joinSeason}><input type="hidden" name="seasonId" value={current.id} /><button type="submit">Enlist for {current.name}</button></form> : <Link href="/sign-in">Sign in to enlist</Link>}</div></>}
    </div>

    <div className="season-section-heading"><div><p className="eyebrow">Per-game cooperative routes</p><h2>Seasonal expeditions</h2></div><Compass aria-hidden="true" /></div>
    <div className="expedition-grid">{current.expeditions.map((expedition) => <article className={expedition.completedAt ? "complete" : ""} key={expedition.id}><div><Flame aria-hidden="true" /><p className="eyebrow">{gameNames[expedition.gameType] ?? expedition.gameType.replaceAll("_", " ")}</p></div><h3>{expedition.name}</h3><p>{expedition.description}</p><ProgressRail value={expedition.progress} goal={expedition.threshold} label={expedition.name} /><small>{formatGoal(expedition.ruleType, expedition.progress)} / {formatGoal(expedition.ruleType, expedition.threshold)} verified</small></article>)}</div>

    <div className="season-section-heading"><div><p className="eyebrow">Your own trail</p><h2>Personal quests</h2></div><Target aria-hidden="true" /></div>
    {isMember ? <div className="season-quest-grid">{personalQuests.map((quest) => { const progress = personalByQuest.get(quest.id); return <article className={progress?.completedAt ? "complete" : ""} key={quest.id}><p className="eyebrow">Personal · {quest.ruleType.replaceAll("_", " ")}</p><h3>{quest.name}</h3><p>{quest.description}</p><ProgressRail value={Math.min(quest.threshold, progress?.progress ?? 0)} goal={quest.threshold} label={quest.name} /><footer><span>{formatGoal(quest.ruleType, progress?.progress ?? 0)} / {formatGoal(quest.ruleType, quest.threshold)}</span><strong><Zap aria-hidden="true" size={13} /> {quest.xpReward} season XP</strong></footer></article>; })}</div> : <div className="season-locked"><LockKeyhole aria-hidden="true" /><span>Personal quests open when you enlist. No progress is invented before the verified worker reconciles your activity.</span></div>}

    <div className="season-section-heading"><div><p className="eyebrow">The lodge pulls together</p><h2>Team quests</h2></div><Users aria-hidden="true" /></div>
    <div className="season-quest-grid team">{teamQuests.map((quest) => <article className={quest.teamProgress?.completedAt ? "complete" : ""} key={quest.id}><p className="eyebrow">Team · {quest.ruleType.replaceAll("_", " ")}</p><h3>{quest.name}</h3><p>{quest.description}</p><ProgressRail value={quest.teamProgress?.progress ?? 0} goal={quest.threshold} label={quest.name} /><footer><span>{formatGoal(quest.ruleType, quest.teamProgress?.progress ?? 0)} / {formatGoal(quest.ruleType, quest.threshold)}</span><strong><Zap aria-hidden="true" size={13} /> {quest.xpReward} XP each</strong></footer></article>)}</div>

    <section className="season-reward-preview"><Award aria-hidden="true" /><div><p className="eyebrow">Permanent cabinet record</p><h2>The seasonal shelf stays.</h2><p>When the season closes, enrolled members receive its commemorative trophy. Members who complete the first season also carry the Founder&apos;s Lantern permanently.</p></div><Trophy aria-hidden="true" /></section>
    {archive.length ? <section className="season-archive"><div className="season-section-heading"><div><p className="eyebrow">Permanent record</p><h2>Past chronicles</h2></div></div><div>{archive.map((season) => <Link href={`/seasons/${season.slug}/chronicle`} key={season.id}><span>Season {season.ordinal}</span><strong>{season.name}</strong><small>{season._count.memberships} members · {season.chronicle ? "Chronicle available" : "Chronicle processing"}</small></Link>)}</div></section> : null}
  </section>;
}
