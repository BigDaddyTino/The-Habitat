"use client";

import { useEffect, useRef, useState } from "react";
import type { AchievementRarity, AchievementRewardKind } from "@habitat/shared";
import { RewardCeremony } from "@/components/reward-ceremony";
import { rewardPreviewEvent, type RewardCeremonyDetail } from "@/lib/reward-events";

type ProgressionResponse = {
  level: number;
  totalXp: number;
  entries: Array<{ id: string; amount: number; description: string }>;
  achievements: Array<{ id: string; achievement: { name: string; rarity: AchievementRarity; description: string; category: string; points: number; rewards: Array<{ kind: AchievementRewardKind; name: string }> } }>;
};

function rarityForLevel(level: number): AchievementRarity {
  if (level >= 100) return "QUESTIONABLE_LIFE_CHOICE";
  if (level >= 75) return "LEGENDARY";
  if (level >= 50) return "EPIC";
  if (level >= 25) return "RARE";
  if (level >= 10) return "UNCOMMON";
  return "COMMON";
}

export function ProgressionToasts({ enabled }: { enabled: boolean }) {
  const initialized = useRef(false);
  const [queue, setQueue] = useState<RewardCeremonyDetail[]>([]);
  const active = queue[0] ?? null;

  useEffect(() => {
    const preview = (event: Event) => setQueue((current) => [...current, (event as CustomEvent<RewardCeremonyDetail>).detail].slice(-8));
    window.addEventListener(rewardPreviewEvent, preview);
    return () => window.removeEventListener(rewardPreviewEvent, preview);
  }, []);

  useEffect(() => {
    if (!enabled) return;
    let stopped = false;
    const poll = async () => {
      const response = await fetch("/api/progression", { cache: "no-store" }).catch(() => null);
      if (!response?.ok || stopped) return;
      const data = await response.json() as ProgressionResponse;
      const lastEntryKey = "habitat:last-xp-entry";
      const lastAchievementKey = "habitat:last-legendary-achievement";
      const lastLevelKey = "habitat:last-level";
      const priorEntry = localStorage.getItem(lastEntryKey);
      const priorLevel = Number(localStorage.getItem(lastLevelKey) ?? data.level);
      if (initialized.current && priorEntry) {
        const entryIndex = data.entries.findIndex((entry) => entry.id === priorEntry);
        const newEntries = data.entries.slice(0, entryIndex >= 0 ? entryIndex : data.entries.length).reverse();
        const additions: RewardCeremonyDetail[] = newEntries.map((entry) => ({ id: entry.id, title: `+${entry.amount.toLocaleString()} XP`, detail: entry.description, rarity: "COMMON", kind: "xp" }));
        const priorAchievement = localStorage.getItem(lastAchievementKey);
        const achievementIndex = data.achievements.findIndex((achievement) => achievement.id === priorAchievement);
        const newAchievements = data.achievements.slice(0, achievementIndex >= 0 ? achievementIndex : data.achievements.length).reverse();
        additions.push(...newAchievements.map(({ id, achievement }) => ({ id: `achievement-${id}`, title: achievement.name, detail: achievement.description, rarity: achievement.rarity, category: achievement.category, points: achievement.points, rewards: achievement.rewards, kind: "achievement" as const })));
        if (data.level > priorLevel) additions.push({ id: `level-${data.level}-${Date.now()}`, title: `Level ${data.level}`, detail: "The climb continues. New rewards may be waiting in your cabinet.", rarity: rarityForLevel(data.level), kind: "level" });
        if (additions.length) setQueue((current) => [...current, ...additions].slice(-8));
      }
      localStorage.setItem(lastEntryKey, data.entries[0]?.id ?? "none");
      localStorage.setItem(lastAchievementKey, data.achievements[0]?.id ?? "none");
      localStorage.setItem(lastLevelKey, String(data.level));
      initialized.current = true;
    };
    void poll();
    const interval = window.setInterval(() => { void poll(); }, 30_000);
    return () => { stopped = true; window.clearInterval(interval); };
  }, [enabled]);

  useEffect(() => {
    if (!active) return;
    const legendary = active.rarity === "LEGENDARY" || active.rarity === "QUESTIONABLE_LIFE_CHOICE";
    const timeout = window.setTimeout(() => setQueue((current) => current.slice(1)), legendary ? 10_500 : active.kind === "achievement" || active.kind === "level" ? 7_500 : 5_200);
    return () => window.clearTimeout(timeout);
  }, [active]);

  return active ? <RewardCeremony key={active.id} toast={active} /> : null;
}
