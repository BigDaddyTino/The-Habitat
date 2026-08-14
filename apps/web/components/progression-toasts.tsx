"use client";

import { useEffect, useRef, useState } from "react";
import { habitatLiveBrowserEvent, type AchievementRarity, type AchievementRewardKind, type HabitatLiveEventBatch, type VerifiedHabitatLiveEvent } from "@habitat/shared";
import { RewardCeremony } from "@/components/reward-ceremony";
import { rewardPreviewEvent, type RewardCeremonyDetail } from "@/lib/reward-events";

type ProgressionResponse = {
  level: number;
  totalXp: number;
  entries: Array<{ id: string; amount: number; description: string }>;
  achievements: Array<{ id: string; achievement: { name: string; rarity: AchievementRarity; description: string; category: string; points: number; rewards: Array<{ kind: AchievementRewardKind; code?: string; name: string }> } }>;
};

function rarityForLevel(level: number): AchievementRarity {
  if (level >= 100) return "QUESTIONABLE_LIFE_CHOICE";
  if (level >= 75) return "LEGENDARY";
  if (level >= 50) return "EPIC";
  if (level >= 25) return "RARE";
  if (level >= 10) return "UNCOMMON";
  return "COMMON";
}

export function ProgressionToasts({ enabled, initialLiveCursor }: { enabled: boolean; initialLiveCursor: string }) {
  const initialized = useRef(false);
  const [queue, setQueue] = useState<RewardCeremonyDetail[]>([]);
  const [leavingId, setLeavingId] = useState<string | null>(null);
  const active = queue[0] ?? null;
  const enqueue = (additions: RewardCeremonyDetail[]) => setQueue((current) => {
    const known = new Set(current.map((item) => item.id));
    return [...current, ...additions.filter((item) => !known.has(item.id))].slice(-8);
  });

  useEffect(() => {
    const preview = (event: Event) => enqueue([(event as CustomEvent<RewardCeremonyDetail>).detail]);
    window.addEventListener(rewardPreviewEvent, preview);
    return () => window.removeEventListener(rewardPreviewEvent, preview);
  }, []);

  useEffect(() => {
    if (!["localhost", "127.0.0.1", "::1"].includes(window.location.hostname)) return;
    const requested = new URLSearchParams(window.location.search).get("toastPreview");
    if (requested !== "boss" && requested !== "legendary") return;
    const previewFrame = window.requestAnimationFrame(() => enqueue([requested === "boss" ? {
      id: "visual-preview:boss-toast",
      title: "Bossbreaker Reliquary",
      detail: "Visual preview only — no server event was recorded.",
      rarity: "LEGENDARY",
      rewards: [{ kind: "TROPHY", code: "bossbreaker-reliquary", name: "Bossbreaker Reliquary" }],
      kind: "world",
      preview: true,
    } : {
      id: "visual-preview:legendary-toast",
      title: "Legendary Status",
      detail: "Visual preview only — no achievement was recorded.",
      rarity: "LEGENDARY",
      kind: "achievement",
      preview: true,
    }]));
    return () => window.cancelAnimationFrame(previewFrame);
  }, []);

  useEffect(() => {
    if (!enabled) return;
    let stopped = false;
    let cursor = initialLiveCursor;
    const seen = new Set<string>();
    const poll = async () => {
      const response = await fetch(`/api/live-events?since=${encodeURIComponent(cursor)}`, { cache: "no-store" }).catch(() => null);
      if (!response?.ok || stopped) return;
      const batch = await response.json() as HabitatLiveEventBatch;
      if (!Array.isArray(batch.events) || typeof batch.cursor !== "string") return;
      const fresh = batch.events.filter((event) => !seen.has(event.id));
      for (const event of fresh) {
        seen.add(event.id);
        window.dispatchEvent(new CustomEvent<VerifiedHabitatLiveEvent>(habitatLiveBrowserEvent, { detail: event }));
      }
      // The Hall still reacts to your own legend, but the toast is left to the
      // progression feed, which reports the same award with your own framing.
      const broadcast = fresh.filter((event) => !(event.kind === "LEGENDARY_EARNED" && event.viewerIsActor));
      enqueue(broadcast.map((event) => ({ id: `live-${event.id}`, ...event.ceremony })));
      cursor = batch.cursor;
    };
    void poll();
    const interval = window.setInterval(() => { void poll(); }, 5_000);
    return () => { stopped = true; window.clearInterval(interval); };
  }, [enabled, initialLiveCursor]);

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
        if (additions.length) enqueue(additions);
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
    const displayMs = legendary ? 10_500 : active.kind === "achievement" || active.kind === "level" ? 7_500 : 5_200;
    const exitMs = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 250;
    const leaveTimeout = window.setTimeout(() => setLeavingId(active.id), displayMs);
    const removeTimeout = window.setTimeout(() => { setLeavingId(null); setQueue((current) => current.slice(1)); }, displayMs + exitMs);
    return () => { window.clearTimeout(leaveTimeout); window.clearTimeout(removeTimeout); };
  }, [active]);

  return active ? <RewardCeremony key={active.id} toast={active} leaving={leavingId === active.id} /> : null;
}
