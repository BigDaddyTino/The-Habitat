import Link from "next/link";
import { Compass, Crown, Medal, Timer, Trophy, Zap } from "lucide-react";
import { getPrismaClient } from "@habitat/db/client";
import { levelForXp } from "@habitat/shared";

const db = getPrismaClient();

type RankEntry = { id: string; name: string; username: string | null; score: number | string; detail: string };

function Leaderboard({ title, eyebrow, icon: Icon, entries }: { title: string; eyebrow: string; icon: typeof Trophy; entries: RankEntry[] }) {
  return <article className="leaderboard-card"><div className="leaderboard-card-heading"><Icon aria-hidden="true" size={20} /><div><p className="eyebrow">{eyebrow}</p><h2>{title}</h2></div></div>{entries.length ? <ol>{entries.map((entry, index) => <li key={entry.id}><span className={`leaderboard-place place-${index + 1}`}>#{index + 1}</span><div>{entry.username ? <Link href={`/members/${entry.username}`}>{entry.name}</Link> : <strong>{entry.name}</strong>}<small>{entry.detail}</small></div><b>{entry.score}</b></li>)}</ol> : <div className="leaderboard-empty">No verified Habitat activity is eligible for this board yet.</div>}</article>;
}

export default async function LeaderboardsPage() {
  const members = await db.user.findMany({
    where: { isActive: true },
    select: {
      id: true, name: true, username: true, displayName: true,
      playerIdentities: { select: { gameType: true, events: { where: { eventType: "PLAYER_JOINED" }, select: { id: true } }, legacyEvidence: { where: { kind: "SESSION" }, select: { durationSeconds: true } } } },
      achievements: { select: { achievement: { select: { points: true } } } },
      xpEntries: { select: { amount: true } },
    },
  });
  const normalized = members.map((member) => { const xp = member.xpEntries.reduce((sum, entry) => sum + entry.amount, 0); return { id: member.id, name: member.displayName ?? member.name ?? "Habitat member", username: member.username, xp, level: levelForXp(xp), visits: member.playerIdentities.reduce((sum, identity) => sum + identity.events.length, 0), worlds: new Set(member.playerIdentities.filter((identity) => identity.events.length > 0 || identity.legacyEvidence.length > 0).map((identity) => identity.gameType)).size, legacySeconds: member.playerIdentities.flatMap((identity) => identity.legacyEvidence).reduce((sum, evidence) => sum + (evidence.durationSeconds ?? 0), 0), legacySessions: member.playerIdentities.reduce((sum, identity) => sum + identity.legacyEvidence.length, 0), points: member.achievements.reduce((sum, award) => sum + award.achievement.points, 0), achievements: member.achievements.length }; });
  const visits = normalized.filter((member) => member.visits > 0).sort((a, b) => b.visits - a.visits || a.name.localeCompare(b.name)).slice(0, 10).map((member) => ({ id: member.id, name: member.name, username: member.username, score: member.visits, detail: "verified Chronicle visits" }));
  const explorers = normalized.filter((member) => member.worlds > 0).sort((a, b) => b.worlds - a.worlds || b.visits - a.visits).slice(0, 10).map((member) => ({ id: member.id, name: member.name, username: member.username, score: member.worlds, detail: `${member.visits} verified visits` }));
  const achievementPoints = normalized.filter((member) => member.points > 0).sort((a, b) => b.points - a.points || b.achievements - a.achievements).slice(0, 10).map((member) => ({ id: member.id, name: member.name, username: member.username, score: member.points, detail: `${member.achievements} achievements earned` }));
  const recoveredHours = normalized.filter((member) => member.legacySeconds > 0).sort((a, b) => b.legacySeconds - a.legacySeconds).slice(0, 10).map((member) => ({ id: member.id, name: member.name, username: member.username, score: `${(member.legacySeconds / 3_600).toFixed(1)}h`, detail: `${member.legacySessions} timestamp-paired legacy sessions` }));
  const levelBoard = normalized.filter((member) => member.xp > 0).sort((a, b) => b.xp - a.xp || a.name.localeCompare(b.name)).slice(0, 10).map((member) => ({ id: member.id, name: member.name, username: member.username, score: `Lv ${member.level}`, detail: `${member.xp.toLocaleString()} verified XP` }));
  return <section className="page-shell leaderboard-page"><div className="page-intro"><p className="eyebrow">The numbers that matter</p><h1>Leaderboards</h1><p>Extreme competition, zero imaginary stats. Every placement is calculated from verified identities, Chronicle events, earned achievements, and timestamp-paired legacy sessions.</p></div><div className="leaderboard-grid"><Leaderboard eyebrow="The long climb" icon={Zap} title="Habitat Level" entries={levelBoard} /><Leaderboard eyebrow="Footprints" icon={Trophy} title="Most Active" entries={visits} /><Leaderboard eyebrow="Recovered time" icon={Timer} title="Legacy Hours" entries={recoveredHours} /><Leaderboard eyebrow="Maps marked" icon={Compass} title="World Explorer" entries={explorers} /><Leaderboard eyebrow="Permanent record" icon={Crown} title="Achievement Power" entries={achievementPoints} /></div><p className="leaderboard-note"><Medal aria-hidden="true" size={15} /> Verified live and timestamp-paired historical time earns XP. Save-file sightings can unlock legacy rewards but never invent playtime.</p></section>;
}
