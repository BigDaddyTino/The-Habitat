import Link from "next/link";
import { Award, Crown, Target, Trophy, Users, Zap } from "lucide-react";
import { getPrismaClient } from "@habitat/db/client";
import { boundedProgress } from "@habitat/shared";

const db = getPrismaClient();
type Metric = "xp" | "quests";

export default async function SeasonalLeaderboardsPage({ searchParams }: { searchParams: Promise<{ metric?: string | string[] }> }) {
  const requested = (await searchParams).metric;
  const metric: Metric = (Array.isArray(requested) ? requested[0] : requested) === "quests" ? "quests" : "xp";
  const now = new Date();
  const season = await db.season.findFirst({ where: { isEnabled: true, status: { in: ["ACTIVE", "UPCOMING"] }, endsAt: { gt: now } }, orderBy: { startsAt: "asc" }, include: { memberships: { include: { user: { select: { displayName: true, name: true, username: true } } } } } })
    ?? await db.season.findFirst({ where: { isEnabled: true, status: "COMPLETED" }, orderBy: { endsAt: "desc" }, include: { memberships: { include: { user: { select: { displayName: true, name: true, username: true } } } } } });
  if (!season) return <section className="page-shell leaderboard-page"><div className="page-intro"><p className="eyebrow">Seasonal standings</p><h1>No season is enabled.</h1><p>The permanent leaderboard remains available while the seasonal board is dormant.</p></div></section>;

  const [xpGroups, questGroups, community] = await Promise.all([
    db.seasonXpEntry.groupBy({ by: ["userId"], where: { seasonId: season.id }, _sum: { amount: true } }),
    db.userSeasonQuestProgress.groupBy({ by: ["userId"], where: { quest: { seasonId: season.id }, completedAt: { not: null } }, _count: { _all: true } }),
    db.seasonXpEntry.aggregate({ where: { seasonId: season.id }, _sum: { amount: true } }),
  ]);
  const xp = new Map(xpGroups.map((entry) => [entry.userId, entry._sum.amount ?? 0]));
  const quests = new Map(questGroups.map((entry) => [entry.userId, entry._count._all]));
  const rows = season.memberships.map((membership) => ({ id: membership.userId, name: membership.user.displayName ?? membership.user.name ?? "Habitat member", username: membership.user.username, xp: xp.get(membership.userId) ?? 0, quests: quests.get(membership.userId) ?? 0 })).sort((left, right) => (metric === "xp" ? right.xp - left.xp : right.quests - left.quests) || right.xp - left.xp || left.name.localeCompare(right.name));
  const progress = boundedProgress(community._sum.amount ?? 0, season.communityXpGoal);
  const qualifiedCount = rows.filter((row) => row.xp >= season.trophyXpRequirement).length;
  return <section className="page-shell leaderboard-page seasonal-board">
    <div className="page-intro"><p className="eyebrow">Season {season.ordinal} · {season.theme}</p><h1>{season.name} standings</h1><p>Seasonal positions are temporary. Every lifetime level, achievement, and record remains permanent and continues on the lifetime board.</p></div>
    <section className="season-board-community"><div><Users aria-hidden="true" /><div><p className="eyebrow">One lodge, one bar</p><h2>Community XP</h2></div></div><strong>{progress.value.toLocaleString()} <span>/ {progress.goal.toLocaleString()} XP</span></strong><i><span style={{ width: `${progress.percent}%` }} /></i></section>
    <nav className="season-metric-tabs" aria-label="Season leaderboard metric"><Link className={metric === "xp" ? "active" : ""} href="/leaderboards/season?metric=xp"><Zap aria-hidden="true" /> Season XP</Link><Link className={metric === "quests" ? "active" : ""} href="/leaderboards/season?metric=quests"><Target aria-hidden="true" /> Personal quests</Link></nav>
    <article className="season-ranking"><header><div>{metric === "xp" ? <Crown aria-hidden="true" /> : <Award aria-hidden="true" />}<div><p className="eyebrow">Verified enrolled members</p><h2>{metric === "xp" ? "Season XP trail" : "Quest finishers"}</h2></div></div><span>{rows.length} expedition members</span></header>{rows.some((row) => metric === "xp" ? row.xp > 0 : row.quests > 0) ? <ol>{rows.filter((row) => metric === "xp" ? row.xp > 0 : row.quests > 0).map((row, index) => <li key={row.id}><span className={`leaderboard-place place-${index + 1}`}>#{index + 1}</span><div>{row.username ? <Link href={`/members/${row.username}`}>{row.name}</Link> : <strong>{row.name}</strong>}{season.trophyXpRequirement > 0 && row.xp >= season.trophyXpRequirement ? <em className="season-qualified" title={`Qualified for the ${season.name} shelf`}><Trophy aria-hidden="true" size={10} /> Shelf qualified</em> : null}<small>{row.xp.toLocaleString()} season XP · {row.quests} personal quests</small></div><b>{metric === "xp" ? `${row.xp.toLocaleString()} XP` : row.quests}</b></li>)}</ol> : <div className="leaderboard-empty"><Trophy aria-hidden="true" /> No verified seasonal progress has been reconciled yet.</div>}</article>
    <p className="leaderboard-note"><Trophy aria-hidden="true" /> {season.trophyXpRequirement > 0 ? <>{qualifiedCount} of {rows.length} members have banked the {season.trophyXpRequirement.toLocaleString()} season XP needed for the {season.name} shelf. </> : null}Seasonal trophies become permanent cabinet pieces when the season closes. Standings reset only inside the next season&apos;s ledger.</p>
  </section>;
}
