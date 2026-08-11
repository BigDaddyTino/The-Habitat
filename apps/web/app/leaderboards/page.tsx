import Link from "next/link";
import { Compass, Crown, Medal, Timer, Trophy, Zap } from "lucide-react";
import { getPrismaClient } from "@habitat/db/client";
import { levelForXp, parseDistinctGameEventCountRule, parseEventCountRule, parseLegacyEvidenceCountRule, parseLevelReachedRule, verifiedPlaytimeXp } from "@habitat/shared";

const db = getPrismaClient();

type RankEntry = { id: string; name: string; username: string | null; score: number | string; detail: string; unclaimed?: boolean };
type Competitor = { id: string; name: string; username: string | null; xp: number; level: number; visits: number; worlds: number; legacySeconds: number; legacySessions: number; points: number; achievements: number; unclaimed: boolean };

function Leaderboard({ title, eyebrow, icon: Icon, entries }: { title: string; eyebrow: string; icon: typeof Trophy; entries: RankEntry[] }) {
  return <article className="leaderboard-card"><div className="leaderboard-card-heading"><Icon aria-hidden="true" size={20} /><div><p className="eyebrow">{eyebrow}</p><h2>{title}</h2></div></div>{entries.length ? <ol>{entries.map((entry, index) => <li key={entry.id}><span className={`leaderboard-place place-${index + 1}`}>#{index + 1}</span><div>{entry.username ? <Link href={`/members/${entry.username}`}>{entry.name}</Link> : <strong>{entry.name}</strong>}<small>{entry.unclaimed ? `Unclaimed competitor · ${entry.detail}` : entry.detail}</small></div><b>{entry.score}</b></li>)}</ol> : <div className="leaderboard-empty">No observed Habitat activity is eligible for this board yet.</div>}</article>;
}

export default async function LeaderboardsPage() {
  const [members, unclaimedIdentities, definitions] = await Promise.all([
    db.user.findMany({ where: { isActive: true }, select: { id: true, name: true, username: true, displayName: true, playerIdentities: { select: { gameType: true, events: { where: { eventType: "PLAYER_JOINED" }, select: { id: true } }, legacyEvidence: { where: { kind: "SESSION" }, select: { durationSeconds: true } } } }, achievements: { select: { achievement: { select: { points: true } } } }, xpEntries: { select: { amount: true } } } }),
    db.playerIdentity.findMany({ where: { userId: null }, select: { id: true, displayName: true, gameType: true, events: { select: { eventType: true, gameType: true, source: true, sourceConfidence: true, valueNumber: true } }, legacyEvidence: { where: { kind: "SESSION" }, select: { durationSeconds: true } } } }),
    db.achievementDefinition.findMany({ where: { enabled: true }, select: { ruleType: true, ruleConfig: true, points: true } }),
  ]);
  const claimed: Competitor[] = members.map((member) => { const xp = member.xpEntries.reduce((sum, entry) => sum + entry.amount, 0); return { id: member.id, name: member.displayName ?? member.name ?? "Habitat member", username: member.username, xp, level: levelForXp(xp), visits: member.playerIdentities.reduce((sum, identity) => sum + identity.events.length, 0), worlds: new Set(member.playerIdentities.filter((identity) => identity.events.length > 0 || identity.legacyEvidence.length > 0).map((identity) => identity.gameType)).size, legacySeconds: member.playerIdentities.flatMap((identity) => identity.legacyEvidence).reduce((sum, evidence) => sum + (evidence.durationSeconds ?? 0), 0), legacySessions: member.playerIdentities.reduce((sum, identity) => sum + identity.legacyEvidence.length, 0), points: member.achievements.reduce((sum, award) => sum + award.achievement.points, 0), achievements: member.achievements.length, unclaimed: false }; });
  const unclaimed: Competitor[] = unclaimedIdentities.map((identity) => {
    const visits = identity.events.filter((event) => event.eventType === "PLAYER_JOINED").length;
    const playtimeSeconds = identity.events.filter((event) => event.eventType === "PLAYER_LEFT" && event.sourceConfidence >= 100 && ["PALWORLD_REST", "LEGACY_HISTORY_IMPORT"].includes(event.source) && typeof event.valueNumber === "number" && event.valueNumber > 0).reduce((sum, event) => sum + (event.valueNumber ?? 0), 0);
    const xp = verifiedPlaytimeXp(playtimeSeconds);
    const level = levelForXp(xp);
    const legacySeconds = identity.legacyEvidence.reduce((sum, evidence) => sum + (evidence.durationSeconds ?? 0), 0);
    const points = definitions.reduce((sum, definition) => {
      if (definition.ruleType === "EVENT_COUNT") { const rule = parseEventCountRule(definition.ruleConfig); return sum + (rule && rule.eventType === "PLAYER_JOINED" && visits >= rule.threshold ? definition.points : 0); }
      if (definition.ruleType === "DISTINCT_GAME_EVENT_COUNT") { const rule = parseDistinctGameEventCountRule(definition.ruleConfig); return sum + (rule && rule.eventType === "PLAYER_JOINED" && visits > 0 && 1 >= rule.threshold ? definition.points : 0); }
      if (definition.ruleType === "LEGACY_EVIDENCE_COUNT") { const rule = parseLegacyEvidenceCountRule(definition.ruleConfig); return sum + (rule && identity.legacyEvidence.length >= rule.threshold ? definition.points : 0); }
      const rule = parseLevelReachedRule(definition.ruleConfig); return sum + (rule && level >= rule.level ? definition.points : 0);
    }, 0);
    return { id: identity.id, name: identity.displayName, username: null, xp, level, visits, worlds: visits || identity.legacyEvidence.length ? 1 : 0, legacySeconds, legacySessions: identity.legacyEvidence.length, points, achievements: 0, unclaimed: true };
  });
  const competitors = [...claimed, ...unclaimed];
  const rank = (items: Competitor[], score: (member: Competitor) => number, format: (member: Competitor) => number | string, detail: (member: Competitor) => string) => items.filter((member) => score(member) > 0).sort((left, right) => score(right) - score(left) || left.name.localeCompare(right.name)).slice(0, 10).map((member) => ({ id: member.id, name: member.name, username: member.username, score: format(member), detail: detail(member), unclaimed: member.unclaimed }));
  const visits = rank(competitors, (member) => member.visits, (member) => member.visits, () => "verified Chronicle visits");
  const explorers = rank(competitors, (member) => member.worlds, (member) => member.worlds, (member) => `${member.visits} verified visits`);
  const achievementPoints = rank(competitors, (member) => member.points, (member) => member.points, (member) => `${member.unclaimed ? "provisional" : member.achievements} achievement points`);
  const recoveredHours = rank(competitors, (member) => member.legacySeconds, (member) => `${(member.legacySeconds / 3_600).toFixed(1)}h`, (member) => `${member.legacySessions} timestamp-paired legacy sessions`);
  const levelBoard = rank(competitors, (member) => member.xp, (member) => `Lv ${member.level}`, (member) => `${member.xp.toLocaleString()} ${member.unclaimed ? "provisional" : "verified"} XP`);
  return <section className="page-shell leaderboard-page"><div className="page-intro"><p className="eyebrow">The numbers that matter</p><h1>Leaderboards</h1><p>Extreme competition, zero imaginary stats. Observed identities can compete before they are claimed; their standing and rewards become a member profile only once ownership is verified.</p></div><div className="leaderboard-grid"><Leaderboard eyebrow="The long climb" icon={Zap} title="Habitat Level" entries={levelBoard} /><Leaderboard eyebrow="Footprints" icon={Trophy} title="Most Active" entries={visits} /><Leaderboard eyebrow="Recovered time" icon={Timer} title="Legacy Hours" entries={recoveredHours} /><Leaderboard eyebrow="Maps marked" icon={Compass} title="World Explorer" entries={explorers} /><Leaderboard eyebrow="Permanent record" icon={Crown} title="Achievement Power" entries={achievementPoints} /></div><p className="leaderboard-note"><Medal aria-hidden="true" size={15} /> “Unclaimed” standings come from observed, source-confident game identities. They cannot equip rewards; when ownership is approved or Steam-verifiable, the worker safely reconciles their full history into that member profile.</p></section>;
}
