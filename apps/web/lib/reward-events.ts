import type { AchievementRarity, AchievementRewardKind } from "@habitat/shared";

export type RewardCeremonyDetail = {
  id: string;
  title: string;
  detail: string;
  rarity: AchievementRarity;
  category?: string;
  points?: number;
  rewards?: Array<{ kind: AchievementRewardKind; code?: string; name: string }>;
  kind: "achievement" | "level" | "xp" | "world";
  preview?: boolean;
};

export const rewardPreviewEvent = "habitat:reward-preview";

export function previewReward(detail: RewardCeremonyDetail) {
  window.dispatchEvent(new CustomEvent<RewardCeremonyDetail>(rewardPreviewEvent, { detail }));
}
