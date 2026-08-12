"use client";

import { useMemo, useState } from "react";
import { Eye, EyeOff, Play, ShieldCheck, Sparkles } from "lucide-react";
import { rarityPresentation, type AchievementRarity, type AchievementRewardKind } from "@habitat/shared";
import { previewReward } from "@/lib/reward-events";
import { RewardEmblem } from "@/components/reward-emblem";

export type AchievementArchiveEntry = {
  id: string;
  slug: string;
  name: string;
  description: string;
  secretDescription: string | null;
  rarity: AchievementRarity;
  category: string;
  points: number;
  isSecret: boolean;
  earned: boolean;
  awardedAt: string | null;
  awardedCount: number;
  progress: number | null;
  target: number | null;
  rewards: Array<{ kind: AchievementRewardKind; code: string; name: string }>;
};

const filters = ["ALL", "EARNED", "LOCKED", "SECRET"] as const;

export function AchievementArchive({ entries }: { entries: AchievementArchiveEntry[] }) {
  const [filter, setFilter] = useState<(typeof filters)[number]>("ALL");
  const visible = useMemo(() => entries.filter((entry) => {
    if (filter === "EARNED") return entry.earned;
    if (filter === "LOCKED") return !entry.earned;
    if (filter === "SECRET") return entry.isSecret;
    return true;
  }), [entries, filter]);
  const earned = entries.filter((entry) => entry.earned);
  const totalPoints = earned.reduce((total, entry) => total + entry.points, 0);
  const physicalRewards = earned.flatMap((entry) => entry.rewards).filter((reward) => reward.kind === "BADGE" || reward.kind === "MEDAL" || reward.kind === "TROPHY").length;

  return <>
    <section className="achievement-command" aria-label="Achievement archive summary">
      <div><p className="eyebrow">Verified reward archive</p><h1>Achievements</h1><p>Every unlock comes from trusted Chronicle evidence. Secret records reveal themselves only when the requirement is actually met.</p></div>
      <dl><div><dt>Earned</dt><dd>{earned.length}<span> / {entries.length}</span></dd></div><div><dt>Points</dt><dd>{totalPoints.toLocaleString()}</dd></div><div><dt>Cabinet pieces</dt><dd>{physicalRewards}</dd></div></dl>
    </section>
    <div className="achievement-filter" aria-label="Achievement filters">
      {filters.map((value) => <button aria-pressed={filter === value} key={value} onClick={() => setFilter(value)} type="button">{value === "SECRET" ? <EyeOff aria-hidden="true" size={14} /> : value === "EARNED" ? <ShieldCheck aria-hidden="true" size={14} /> : <Sparkles aria-hidden="true" size={14} />}{value.toLowerCase()}</button>)}
      <span>{visible.length} records on display</span>
    </div>
    <div className="achievement-archive-grid">
      {visible.map((entry) => {
        const concealed = entry.isSecret && !entry.earned;
        const title = concealed ? "Classified record" : entry.name;
        const description = concealed ? entry.secretDescription ?? "The requirement and reward remain sealed." : entry.description;
        const rewardKind = entry.rewards.find((reward) => ["TROPHY", "MEDAL", "BADGE"].includes(reward.kind))?.kind ?? "BADGE";
        const progressPercent = entry.progress !== null && entry.target ? Math.min(100, (entry.progress / entry.target) * 100) : entry.earned ? 100 : 0;
        return <article className={`achievement-dossier rarity-${entry.rarity.toLowerCase().replaceAll("_", "-")} ${entry.earned ? "earned" : "locked"} ${concealed ? "concealed" : ""}`} data-testid={`achievement-${entry.slug}`} key={entry.id}>
          <header><RewardEmblem rarity={entry.rarity} kind={rewardKind} /><div><p className="eyebrow">{rarityPresentation[entry.rarity].label} · {entry.category}</p><span>{entry.points} points</span></div></header>
          <h2>{title}</h2><p>{description}</p>
          <div className="achievement-progress" aria-label={entry.progress !== null && entry.target ? `${entry.progress} of ${entry.target}` : entry.earned ? "Complete" : "Progress concealed"}><i style={{ width: `${progressPercent}%` }} /></div>
          <div className="achievement-progress-copy"><span>{entry.earned ? `Earned${entry.awardedAt ? ` · ${new Date(entry.awardedAt).toLocaleDateString()}` : ""}` : concealed ? "Requirement classified" : entry.progress !== null && entry.target ? `${Math.min(entry.progress, entry.target).toLocaleString()} / ${entry.target.toLocaleString()}` : `${entry.awardedCount} members awarded`}</span><b>{entry.earned ? "Verified" : "Locked"}</b></div>
          <div className="achievement-loot"><small>{concealed ? "Sealed reward" : entry.rewards.length ? "Unlocks" : "Archive award"}</small>{concealed ? <span><EyeOff aria-hidden="true" size={13} /> Unknown</span> : entry.rewards.length ? entry.rewards.map((reward) => <span key={`${reward.kind}-${reward.code}`}>{reward.kind.replaceAll("_", " ")} · {reward.name}</span>) : <span>Achievement points</span>}</div>
          {concealed ? <div className="secret-seal"><Eye aria-hidden="true" /><span>Eyes only</span></div> : <button className="ceremony-preview" type="button" onClick={() => previewReward({ id: `preview-${entry.id}-${Date.now()}`, title: entry.name, detail: entry.description, rarity: entry.rarity, category: entry.category, points: entry.points, rewards: entry.rewards.map(({ kind, code, name }) => ({ kind, code, name })), kind: "achievement" })}><Play aria-hidden="true" size={13} /> Preview ceremony</button>}
        </article>;
      })}
    </div>
  </>;
}
