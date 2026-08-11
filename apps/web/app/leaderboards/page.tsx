import Link from "next/link";
import { Compass, Crown, Medal, Trophy } from "lucide-react";
import { getPrismaClient } from "@habitat/db/client";

const db = getPrismaClient();

type RankEntry = { id: string; name: string; username: string | null; score: number; detail: string };

function Leaderboard({ title, eyebrow, icon: Icon, entries }: { title: string; eyebrow: string; icon: typeof Trophy; entries: RankEntry[] }) {
  return <article className="leaderboard-card"><div className="leaderboard-card-heading"><Icon aria-hidden="true" size={20} /><div><p className="eyebrow">{eyebrow}</p><h2>{title}</h2></div></div>{entries.length ? <ol>{entries.map((entry, index) => <li key={entry.id}><span className={`leaderboard-place place-${index + 1}`}>#{index + 1}</span><div>{entry.username ? <Link href={`/members/${entry.username}`}>{entry.name}</Link> : <strong>{entry.name}</strong>}<small>{entry.detail}</small></div><b>{entry.score}</b></li>)}</ol> : <div className="leaderboard-empty">No verified Habitat activity is eligible for this board yet.</div>}</article>;
}

export default async function LeaderboardsPage() {
  const members = await db.user.findMany({ where: { isActive: true }, select: { id: true, name: true, username: true, displayName: true, playerIdentities: { select: { gameType: true, _count: { select: { events: true } } } }, achievements: { select: { achievement: { select: { points: true } } } } } });
  const normalized = members.map((member) => ({ id: member.id, name: member.displayName ?? member.name ?? "Habitat member", username: member.username, visits: member.playerIdentities.reduce((sum, identity) => sum + identity._count.events, 0), worlds: new Set(member.playerIdentities.filter((identity) => identity._count.events > 0).map((identity) => identity.gameType)).size, points: member.achievements.reduce((sum, award) => sum + award.achievement.points, 0), achievements: member.achievements.length }));
  const visits = normalized.filter((member) => member.visits > 0).sort((a, b) => b.visits - a.visits || a.name.localeCompare(b.name)).slice(0, 10).map((member) => ({ id: member.id, name: member.name, username: member.username, score: member.visits, detail: "verified Chronicle visits" }));
  const explorers = normalized.filter((member) => member.worlds > 0).sort((a, b) => b.worlds - a.worlds || b.visits - a.visits).slice(0, 10).map((member) => ({ id: member.id, name: member.name, username: member.username, score: member.worlds, detail: `${member.visits} verified visits` }));
  const achievementPoints = normalized.filter((member) => member.points > 0).sort((a, b) => b.points - a.points || b.achievements - a.achievements).slice(0, 10).map((member) => ({ id: member.id, name: member.name, username: member.username, score: member.points, detail: `${member.achievements} achievements earned` }));
  return <section className="page-shell leaderboard-page"><div className="page-intro"><p className="eyebrow">The numbers that matter</p><h1>Leaderboards</h1><p>Extreme competition, zero imaginary stats. Every placement is calculated from verified identities, Chronicle events, and earned achievements.</p></div><div className="leaderboard-grid"><Leaderboard eyebrow="Footprints" icon={Trophy} title="Most Active" entries={visits} /><Leaderboard eyebrow="Maps marked" icon={Compass} title="World Explorer" entries={explorers} /><Leaderboard eyebrow="Permanent record" icon={Crown} title="Achievement Power" entries={achievementPoints} /></div><p className="leaderboard-note"><Medal aria-hidden="true" size={15} /> A connected Twitch, Steam, or other account never changes a score. Live presence will appear only after an authenticated provider integration is built and enabled.</p></section>;
}
